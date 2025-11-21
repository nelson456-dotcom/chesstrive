/**
 * Bot Training Service
 * 
 * Provides move suggestions based on human games at different rating levels.
 * This makes bots play more like humans rather than just weak engines.
 */

const mongoose = require('mongoose');
const { Chess } = require('chess.js');

// Position schema (same as in buildBotTrainingDatabase.js)
const positionSchema = new mongoose.Schema({
  fen: { type: String, required: true, index: true },
  ratingRange: { type: String, required: true, index: true },
  moves: [{
    move: { type: String, required: true },
    count: { type: Number, default: 1 },
    rating: { type: Number },
    avgEval: { type: Number }, // Average Stockfish evaluation after this move
    quality: { type: String } // 'excellent', 'good', 'average', 'poor'
  }],
  totalGames: { type: Number, default: 1 },
  lastUpdated: { type: Date, default: Date.now }
}, { collection: 'botTrainingPositions' });

positionSchema.index({ fen: 1, ratingRange: 1 });

const Position = mongoose.model('BotTrainingPosition', positionSchema);

// Normalize FEN for matching (same as in buildBotTrainingDatabase.js)
function normalizeFen(fen) {
  const parts = fen.split(' ');
  if (parts.length >= 4) {
    return `${parts[0]} ${parts[1]} ${parts[2]} ${parts[3]}`;
  }
  return fen;
}

// Get rating range from target rating
function getRatingRange(targetRating) {
  if (targetRating < 800) return '500-800';
  if (targetRating < 1200) return '800-1200';
  if (targetRating < 1400) return '1200-1400';
  if (targetRating < 1600) return '1200-1400';
  if (targetRating < 1700) return '1600-1700';
  if (targetRating < 1800) return '1700-1800';
  if (targetRating < 2000) return '1800-2000';
  if (targetRating < 2400) return '1800-2500';
  if (targetRating < 2500) return '1800-2500';
  return '1800-2500';
}

// Get similar rating ranges (for fallback)
function getSimilarRatingRanges(targetRating) {
  const primary = getRatingRange(targetRating);
  const ranges = [primary];
  
  // Add adjacent ranges for better coverage
  if (targetRating < 1200) {
    ranges.push('500-800', '1200-1400');
  } else if (targetRating < 1600) {
    ranges.push('800-1200', '1600-1700');
  } else if (targetRating < 1700) {
    ranges.push('1200-1400', '1600-1700', '1700-1800');
  } else if (targetRating < 1800) {
    ranges.push('1600-1700', '1700-1800', '1800-2000');
  } else if (targetRating < 2000) {
    ranges.push('1700-1800', '1800-2000', '1800-2500');
  } else if (targetRating < 2400) {
    ranges.push('1800-2000', '1800-2500');
  } else {
    ranges.push('1800-2500');
  }
  
  return ranges;
}

/**
 * Get a move suggestion based on training data
 * @param {string} fen - Current position FEN
 * @param {number} targetRating - Target rating for the bot
 * @param {object} options - Additional options
 * @returns {Promise<object|null>} - Move suggestion or null if no data
 */
async function getTrainingMove(fen, targetRating, options = {}) {
  try {
    const normalizedFen = normalizeFen(fen);
    const ratingRange = getRatingRange(targetRating);
    const similarRanges = getSimilarRatingRanges(targetRating);
    const chess = new Chess(fen);
    
    // Try primary rating range first
    let position = await Position.findOne({ 
      fen: normalizedFen, 
      ratingRange: ratingRange 
    });
    
    // If not found, try similar ranges
    if (!position) {
      for (const range of similarRanges) {
        if (range === ratingRange) continue; // Already tried
        position = await Position.findOne({ 
          fen: normalizedFen, 
          ratingRange: range 
        });
        if (position) break;
      }
    }
    
    if (!position || !position.moves || position.moves.length === 0) {
      return null; // No training data for this position
    }
    
    // Get moves sorted by frequency (most common first)
    // Filter and validate moves - only keep moves that are legal in current position
    const validMoves = [];
    for (const moveData of position.moves) {
      if (moveData.count <= 0) continue;
      
      // Try to validate the move (could be SAN or UCI)
      let isValid = false;
      let moveSan = null;
      
      try {
        // Try as SAN first
        const chessMove = chess.move(moveData.move, { sloppy: true });
        if (chessMove) {
          isValid = true;
          moveSan = chessMove.san;
        }
      } catch (e) {
        // Try as UCI
        try {
          if (moveData.move.length >= 4) {
            const from = moveData.move.slice(0, 2);
            const to = moveData.move.slice(2, 4);
            const promotion = moveData.move.length > 4 ? moveData.move[4] : undefined;
            const chessMove = chess.move({ from, to, promotion }, { sloppy: true });
            if (chessMove) {
              isValid = true;
              moveSan = chessMove.san;
            }
          }
        } catch (e2) {
          // Move is invalid, skip it
        }
      }
      
      if (isValid && moveSan) {
        validMoves.push({
          move: moveSan, // Always return SAN format
          originalMove: moveData.move,
          count: moveData.count,
          rating: moveData.rating,
          quality: moveData.quality,
          avgEval: moveData.avgEval
        });
      }
    }
    
    if (validMoves.length === 0) {
      return null; // No valid moves found
    }
    
    // Sort by frequency
    const moves = validMoves.sort((a, b) => b.count - a.count);
    
    // Calculate weights based on frequency, rating proximity, and move quality
    const weightedMoves = moves.map(move => {
      let weight = move.count;
      
      // Boost weight if move's average rating is close to target rating
      if (move.rating) {
        const ratingDiff = Math.abs(move.rating - targetRating);
        if (ratingDiff < 100) {
          weight *= 2.0; // Strong boost for exact rating match
        } else if (ratingDiff < 200) {
          weight *= 1.5; // Boost moves from similar rating players
        } else if (ratingDiff < 300) {
          weight *= 1.2; // Small boost for nearby ratings
        } else if (ratingDiff > 500) {
          weight *= 0.3; // Strongly reduce weight for very different ratings
        } else {
          weight *= 0.7; // Reduce for moderately different ratings
        }
      }
      
      // Boost weight for higher quality moves (if quality data exists)
      if (move.quality) {
        if (move.quality === 'excellent') weight *= 1.5;
        else if (move.quality === 'good') weight *= 1.2;
        else if (move.quality === 'poor') weight *= 0.5;
      }
      
      // Boost weight for moves with better average evaluation (if available)
      if (move.avgEval !== undefined && move.avgEval !== null) {
        // Moves that maintain or improve position are better
        if (move.avgEval > -50) weight *= 1.3;
        else if (move.avgEval > -100) weight *= 1.1;
        else if (move.avgEval < -300) weight *= 0.4; // Heavily penalize very bad moves
        else if (move.avgEval < -200) weight *= 0.6;
      }
      
      return {
        move: move.move,
        weight: weight,
        count: move.count,
        rating: move.rating,
        quality: move.quality,
        avgEval: move.avgEval
      };
    });
    
    // Normalize weights
    const totalWeight = weightedMoves.reduce((sum, m) => sum + m.weight, 0);
    weightedMoves.forEach(m => {
      m.probability = m.weight / totalWeight;
    });
    
    // Select move based on weighted probability
    // Add some randomness based on rating level (lower ratings = more random)
    const randomness = options.randomness || (targetRating < 1200 ? 0.3 : targetRating < 1800 ? 0.15 : 0.05);
    const random = Math.random();
    
    if (random < randomness && moves.length > 1) {
      // Pick a random move (weighted by probability)
      let cumulative = 0;
      const target = Math.random();
      for (const move of weightedMoves) {
        cumulative += move.probability;
        if (target <= cumulative) {
          return {
            move: move.move,
            source: 'training',
            confidence: move.probability,
            rating: move.rating,
            count: move.count
          };
        }
      }
    }
    
    // Otherwise, pick the most common move (with some chance of picking 2nd or 3rd)
    const topMoves = weightedMoves.slice(0, Math.min(3, weightedMoves.length));
    if (topMoves.length === 1) {
      return {
        move: topMoves[0].move,
        source: 'training',
        confidence: topMoves[0].probability,
        rating: topMoves[0].rating,
        count: topMoves[0].count
      };
    }
    
    // Weighted selection from top moves
    const topTotalWeight = topMoves.reduce((sum, m) => sum + m.weight, 0);
    let cumulative = 0;
    const target = Math.random() * topTotalWeight;
    
    for (const move of topMoves) {
      cumulative += move.weight;
      if (target <= cumulative) {
        return {
          move: move.move,
          source: 'training',
          confidence: move.probability,
          rating: move.rating,
          count: move.count
        };
      }
    }
    
    // Fallback to first move
    return {
      move: topMoves[0].move,
      source: 'training',
      confidence: topMoves[0].probability,
      rating: topMoves[0].rating,
      count: topMoves[0].count
    };
    
  } catch (error) {
    console.error('Error in getTrainingMove:', error);
    return null;
  }
}

/**
 * Check if a move is valid for the current position
 * @param {string} fen - Current position FEN
 * @param {string} move - Move in UCI or SAN format
 * @returns {boolean} - True if move is valid
 */
function isValidMove(fen, move) {
  try {
    const chess = new Chess(fen);
    // Try UCI format first
    if (move.length >= 4) {
      const from = move.slice(0, 2);
      const to = move.slice(2, 4);
      const promotion = move.length > 4 ? move[4] : undefined;
      const chessMove = chess.move({ from, to, promotion }, { sloppy: true });
      return !!chessMove;
    }
    // Try SAN format
    const chessMove = chess.move(move, { sloppy: true });
    return !!chessMove;
  } catch (error) {
    return false;
  }
}

/**
 * Get statistics about training database
 * @returns {Promise<object>} - Statistics
 */
async function getTrainingStats() {
  try {
    const stats = await Position.aggregate([
      {
        $group: {
          _id: '$ratingRange',
          positions: { $sum: 1 },
          totalMoves: { $sum: { $size: '$moves' } },
          totalGames: { $sum: '$totalGames' }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    const overall = await Position.aggregate([
      {
        $group: {
          _id: null,
          totalPositions: { $sum: 1 },
          totalMoves: { $sum: { $size: '$moves' } },
          totalGames: { $sum: '$totalGames' }
        }
      }
    ]);
    
    return {
      byRange: stats,
      overall: overall[0] || { totalPositions: 0, totalMoves: 0, totalGames: 0 }
    };
  } catch (error) {
    console.error('Error getting training stats:', error);
    return { byRange: [], overall: { totalPositions: 0, totalMoves: 0, totalGames: 0 } };
  }
}

module.exports = {
  getTrainingMove,
  isValidMove,
  getTrainingStats,
  getRatingRange
};

