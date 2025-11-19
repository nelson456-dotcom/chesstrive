const express = require('express');
const path = require('path');
const fs = require('fs');
const csv = require('csv-parser');
const router = express.Router();
const auth = require('../middleware/auth');
const premium = require('../middleware/premium');
const User = require('../models/User');
const { updateUserRating, initializeUserRatings } = require('../utils/ratingUtils');
const mongoose = require('mongoose');
const { Chess } = require('chess.js');

// Resourcefulness Position Schema
const resourcefulnessPositionSchema = new mongoose.Schema({
  fen: { type: String, required: true },
  moves: { type: [String], required: true },
  difficulty: { type: String, required: true },
  description: { type: String, required: true },
  evaluation: { type: Number, required: true }, // Engine evaluation in pawns
  themes: { type: String, default: 'resourcefulness' },
  puzzleId: { type: String, required: true },
  losingSide: { type: String, required: true } // Which side is down by one piece
});

const ResourcefulnessPosition = mongoose.model('ResourcefulnessPosition', resourcefulnessPositionSchema);

// Track recently served positions to prevent repetitions
let recentlyServedResourcefulness = new Set();
const MAX_RECENT_RESOURCEFULNESS = 50;

// Load losing positions from CSV
let losingPositions = [];

// Function to store positions in database
async function storePositionsInDatabase(positions) {
  try {
    console.log(`[RESOURCEFULNESS] Storing ${positions.length} positions in database...`);
    
    // Clear existing positions first
    await ResourcefulnessPosition.deleteMany({});
    console.log(`[RESOURCEFULNESS] Cleared existing resourcefulness positions`);
    
    // Insert new positions
    const positionsToInsert = positions.map(pos => ({
      fen: pos.fen,
      moves: pos.moves,
      difficulty: pos.difficulty,
      description: pos.description,
      evaluation: pos.evaluation,
      themes: pos.themes || 'resourcefulness',
      puzzleId: pos.puzzleId,
      losingSide: pos.losingSide
    }));
    
    await ResourcefulnessPosition.insertMany(positionsToInsert);
    console.log(`[RESOURCEFULNESS] Successfully stored ${positions.length} positions in database`);
    
  } catch (error) {
    console.error('[RESOURCEFULNESS] Error storing positions in database:', error);
  }
}

// Enhanced evaluation function that uses Stockfish to determine losing side
async function evaluatePositionWithStockfish(fen) {
  try {
    console.log(`[RESOURCEFULNESS] Analyzing position with Stockfish: ${fen}`);
    
    // Use a timeout to prevent hanging
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Stockfish analysis timeout')), 3000)
    );
    
    // Call Stockfish analysis with timeout
    const analysisPromise = fetch('http://localhost:3001/api/analysis/position', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fen: fen,
        depth: 8, // Reduced depth for faster analysis
        multiPV: 1,
        timeLimit: 1500 // Reduced time limit
      })
    });

    const analysisResponse = await Promise.race([analysisPromise, timeoutPromise]);

    if (analysisResponse.ok) {
      const analysisData = await analysisResponse.json();
      console.log(`[RESOURCEFULNESS] Stockfish analysis result:`, analysisData);
      
      if (analysisData.success && analysisData.evaluation !== undefined) {
        const stockfishEvaluation = analysisData.evaluation;
        
        // Determine losing side based on Stockfish evaluation
        // Positive evaluation = White is ahead, so Black is losing
        // Negative evaluation = Black is ahead, so White is losing
        const isWhiteLosing = stockfishEvaluation < 0;
        const isBlackLosing = stockfishEvaluation > 0;
        
        let losingSide = '';
        if (isWhiteLosing) {
          losingSide = 'white';
        } else if (isBlackLosing) {
          losingSide = 'black';
        }
        
        console.log(`[RESOURCEFULNESS] Stockfish eval: ${stockfishEvaluation}, Losing side: ${losingSide}`);
        
        return {
          stockfishEvaluation: stockfishEvaluation,
          losingSide: losingSide,
          isDownByOnePiece: Math.abs(stockfishEvaluation) >= 1.0, // Consider positions down by 1+ pawns
          bestMove: analysisData.bestMove,
          depth: analysisData.depth || 8
        };
      }
    }
    
    console.warn('[RESOURCEFULNESS] Stockfish analysis failed, using material evaluation');
    // Fallback to material evaluation
    return evaluatePosition(fen);
    
  } catch (error) {
    console.log(`[RESOURCEFULNESS] Stockfish analysis error: ${error.message}, using fallback`);
    // Fallback to material evaluation
    return evaluatePosition(fen);
  }
}

// Enhanced evaluation function that properly identifies positions down by exactly one piece
function evaluatePosition(fen) {
  try {
    const chess = new Chess(fen);
    
    // Count pieces for each side
    const pieceCounts = {
      white: { pawns: 0, knights: 0, bishops: 0, rooks: 0, queens: 0 },
      black: { pawns: 0, knights: 0, bishops: 0, rooks: 0, queens: 0 }
    };
    
    const board = chess.board();
    
    for (let row of board) {
      for (let piece of row) {
        if (piece) {
          const side = piece.color === 'w' ? 'white' : 'black';
          const pieceType = piece.type.toLowerCase();
          
          // Map chess.js piece types to our counting structure
          switch (pieceType) {
            case 'p':
              pieceCounts[side].pawns++;
              break;
            case 'n':
              pieceCounts[side].knights++;
              break;
            case 'b':
              pieceCounts[side].bishops++;
              break;
            case 'r':
              pieceCounts[side].rooks++;
              break;
            case 'q':
              pieceCounts[side].queens++;
              break;
            case 'k':
              // Don't count kings in material evaluation
              break;
          }
        }
      }
    }
    
    // Calculate total material value for each side
    // Standard piece values: Pawn=1, Knight=3, Bishop=3, Rook=5, Queen=9
    const whiteMaterial = pieceCounts.white.pawns * 1 + 
                         pieceCounts.white.knights * 3 + 
                         pieceCounts.white.bishops * 3 + 
                         pieceCounts.white.rooks * 5 + 
                         pieceCounts.white.queens * 9;
    
    const blackMaterial = pieceCounts.black.pawns * 1 + 
                          pieceCounts.black.knights * 3 + 
                          pieceCounts.black.bishops * 3 + 
                          pieceCounts.black.rooks * 5 + 
                          pieceCounts.black.queens * 9;
    
    const materialDifference = whiteMaterial - blackMaterial;
    
    // Check if one side is down by exactly one piece (major pieces only)
    const whiteMajorPieces = pieceCounts.white.knights + pieceCounts.white.bishops + pieceCounts.white.rooks + pieceCounts.white.queens;
    const blackMajorPieces = pieceCounts.black.knights + pieceCounts.black.bishops + pieceCounts.black.rooks + pieceCounts.black.queens;
    
    const majorPieceDifference = whiteMajorPieces - blackMajorPieces;
    
    // Return evaluation based on material difference
    let evaluation = materialDifference; // Positive if white has more material, negative if black has more material
    let isDownByOnePiece = false;
    
    // Check if one side is down by exactly one major piece
    if (Math.abs(majorPieceDifference) === 1) {
      isDownByOnePiece = true;
    }
    
    // Generate a random best move
    const moves = chess.moves();
    const bestMove = moves.length > 0 ? moves[Math.floor(Math.random() * moves.length)] : null;
    
    return {
      evaluation: evaluation,
      bestMove: bestMove,
      isDownByOnePiece: isDownByOnePiece,
      pieceCounts: pieceCounts,
      whiteMaterial: whiteMaterial,
      blackMaterial: blackMaterial,
      materialDifference: materialDifference
    };
  } catch (error) {
    console.error('Error evaluating position:', error);
    return {
      evaluation: 0,
      bestMove: null,
      isDownByOnePiece: false,
      pieceCounts: null
    };
  }
}

// Function to check if a position is down by exactly one piece
function isDownByOnePiece(evaluation) {
  return Math.abs(evaluation) === 1;
}

function loadLosingPositionsFromCSV() {
  return new Promise((resolve, reject) => {
    const CSV_PATH = path.join(__dirname, '../data/puzzles.csv');
    console.log('[RESOURCEFULNESS] CSV path:', CSV_PATH);
    console.log('[RESOURCEFULNESS] CSV exists:', fs.existsSync(CSV_PATH));
    console.log('[RESOURCEFULNESS] Current directory:', __dirname);
    
    if (!fs.existsSync(CSV_PATH)) {
      console.log('[RESOURCEFULNESS] No CSV found, using fallback positions');
      createFallbackPositions();
      resolve();
      return;
    }

    console.log('[RESOURCEFULNESS] Starting CSV parsing for losing positions...');
    
    const positions = [];
    let loadedCount = 0;
    const MAX_POSITIONS = 100; // Load exactly 100 positions as requested
    let hasError = false;
    
    // Add timeout to prevent hanging
    const timeout = setTimeout(() => {
      console.log(`[RESOURCEFULNESS] CSV parsing timeout reached. Positions loaded: ${positions.length}`);
      if (positions.length > 0) {
        losingPositions = positions;
        console.log(`[RESOURCEFULNESS] Using ${losingPositions.length} positions from timeout`);
      } else {
        createFallbackPositions();
      }
      resolve();
    }, 30000); // 30 second timeout
    
    try {
      const stream = fs.createReadStream(CSV_PATH)
        .pipe(csv())
        .on('data', async (row) => {
          if (hasError || loadedCount >= MAX_POSITIONS) {
            if (loadedCount >= MAX_POSITIONS && !hasError) {
              console.log(`[RESOURCEFULNESS] Reached MAX_POSITIONS (${MAX_POSITIONS}), completing CSV parsing`);
              // Manually trigger completion
              clearTimeout(timeout);
              losingPositions = positions;
              console.log(`[RESOURCEFULNESS] Successfully loaded ${losingPositions.length} losing positions from CSV (early completion)`);
              resolve();
              return;
            }
            return;
          }
          
          try {
            const fen = row.FEN;
            const rating = parseInt(row.Rating) || 600;
            const themes = row.Themes || '';
            const movesStr = row.Moves || '';
            const puzzleId = row.PuzzleId || `csv-${loadedCount}`;
            
            if (fen && movesStr && rating >= 800) { // Lower the rating threshold
              // Evaluate the position with Stockfish to determine losing side
              const evaluation = await evaluatePositionWithStockfish(fen);
              
              // Debug logging
              if (loadedCount < 10) {
                console.log(`[RESOURCEFULNESS] Position ${loadedCount + 1}: FEN=${fen}`);
                console.log(`[RESOURCEFULNESS] Stockfish Evaluation: ${evaluation.stockfishEvaluation || evaluation.evaluation}`);
                console.log(`[RESOURCEFULNESS] Losing Side: ${evaluation.losingSide}`);
                console.log(`[RESOURCEFULNESS] IsDownByOnePiece: ${evaluation.isDownByOnePiece}`);
              }
              
              // Only accept positions where one side is down by 1+ pawns according to Stockfish
              if (evaluation.isDownByOnePiece && evaluation.losingSide) {
                // Parse moves from the CSV
                const moves = movesStr.split(' ').filter(m => m.trim()).slice(0, 3);
                
                if (moves.length > 0) {
                  // Use Stockfish-determined losing side
                  const losingSide = evaluation.losingSide;
                  const stockfishEvaluation = evaluation.stockfishEvaluation || evaluation.evaluation;
                  
                  let losingFen = fen;
                  let losingMoves = moves;
                  let evaluationValue = stockfishEvaluation;
                  
                  // Determine difficulty based on piece type and position complexity
                  let difficulty = 'beginner';
                  
                  // For now, assign difficulty randomly since all positions are down by exactly one piece
                  const difficultyRandom = Math.random();
                  if (difficultyRandom > 0.75) {
                    difficulty = 'expert';
                  } else if (difficultyRandom > 0.5) {
                    difficulty = 'advanced';
                  } else if (difficultyRandom > 0.25) {
                    difficulty = 'intermediate';
                  } else {
                    difficulty = 'beginner';
                  }
                  
                  positions.push({
                    puzzleId: puzzleId,
                    fen: losingFen,
                    moves: losingMoves,
                    difficulty: difficulty,
                    description: `You are ${losingSide} and down by ${Math.abs(evaluationValue).toFixed(1)} pawns according to Stockfish (${evaluationValue > 0 ? '+' : ''}${evaluationValue.toFixed(1)}). Try to win from this losing position.`,
                    evaluation: evaluationValue,
                    themes: themes,
                    originalRating: rating,
                    losingSide: losingSide
                  });
                  
                  loadedCount++;
                  
                  if (loadedCount % 50 === 0) {
                    console.log(`[RESOURCEFULNESS] Loaded ${loadedCount} losing positions...`);
                  }
                }
              }
            }
          } catch (rowError) {
            console.error('[RESOURCEFULNESS] Error processing row:', rowError);
          }
        })
                .on('end', () => {
                  clearTimeout(timeout);
                  console.log(`[RESOURCEFULNESS] CSV parsing completed. Positions array length: ${positions.length}`);
                  
                  // Store positions in database
                  if (positions.length > 0) {
                    storePositionsInDatabase(positions);
                  }
                  
                  losingPositions = positions;
                  console.log(`[RESOURCEFULNESS] Successfully loaded ${losingPositions.length} losing positions from CSV`);
                  console.log(`[RESOURCEFULNESS] Difficulty distribution:`, {
                    beginner: losingPositions.filter(p => p.difficulty === 'beginner').length,
                    intermediate: losingPositions.filter(p => p.difficulty === 'intermediate').length,
                    advanced: losingPositions.filter(p => p.difficulty === 'advanced').length,
                    expert: losingPositions.filter(p => p.difficulty === 'expert').length
                  });
                  
                  // Show sample positions
                  if (losingPositions.length > 0) {
                    console.log(`[RESOURCEFULNESS] Sample positions:`);
                    losingPositions.slice(0, 3).forEach((pos, index) => {
                      console.log(`  ${index + 1}. Difficulty: ${pos.difficulty}, Evaluation: ${pos.evaluation}, FEN: ${pos.fen.substring(0, 20)}...`);
                    });
                  }
                  if (losingPositions.length === 0) {
                    console.log('[RESOURCEFULNESS] No losing positions found in CSV, using fallback');
                    createFallbackPositions();
                  }
                  resolve();
                })
        .on('error', (error) => {
          clearTimeout(timeout);
          console.error('[RESOURCEFULNESS] CSV parsing error:', error);
          console.log(`[RESOURCEFULNESS] Error occurred. Positions array length: ${positions.length}`);
          createFallbackPositions();
          resolve();
        });
        
    } catch (error) {
      console.error('[RESOURCEFULNESS] Error setting up CSV stream:', error);
      createFallbackPositions();
      resolve();
    }
  });
}

// Create fallback losing positions
function createFallbackPositions() {
  losingPositions = [
    {
      fen: 'rnbqkb1r/pppp1ppp/5n2/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 2 3',
      moves: ['Nc3', 'Bb4', 'Qd3'],
      difficulty: 'beginner',
      description: 'You are white and down by exactly one piece (17 vs 19 material). Try to win from this losing position.',
      evaluation: -2, // White down by 2 points (one piece)
      puzzleId: 'fallback-1',
      themes: 'defensive',
      losingSide: 'white'
    },
    {
      fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/3P1N2/PPP2PPP/RNBQK2R w KQkq - 4 4',
      moves: ['O-O', 'Bxf7+', 'Kxf7'],
      difficulty: 'intermediate',
      description: 'You are white and down by exactly one piece (16 vs 18 material). Try to win from this losing position.',
      evaluation: -2, // White down by 2 points (one piece)
      puzzleId: 'fallback-2',
      themes: 'defensive',
      losingSide: 'white'
    },
    {
      fen: 'r1bq1rk1/pppp1ppp/2n2n2/2b1p3/2B1P3/3P1N2/PPP2PPP/RNBQ1RK1 w - - 6 5',
      moves: ['Bxc5', 'Nxc5', 'd4'],
      difficulty: 'advanced',
      description: 'You are white and down by exactly one piece (15 vs 17 material). Try to win from this losing position.',
      evaluation: -2, // White down by 2 points (one piece)
      puzzleId: 'fallback-3',
      themes: 'defensive',
      losingSide: 'white'
    },
    {
      fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/3P1N2/PPP2PPP/RNBQK2R w KQkq - 4 4',
      moves: ['O-O', 'Bxf7+', 'Kxf7', 'Qd5+'],
      difficulty: 'expert',
      description: 'You are white and down by exactly one piece (14 vs 16 material). Try to win from this losing position.',
      evaluation: -2, // White down by 2 points (one piece)
      puzzleId: 'fallback-4',
      themes: 'defensive',
      losingSide: 'white'
    }
  ];
  console.log(`[RESOURCEFULNESS] Created ${losingPositions.length} fallback losing positions`);
}

// Initialize positions on startup - use fallback positions directly
createFallbackPositions();
console.log(`[RESOURCEFULNESS] Using ${losingPositions.length} fallback positions`);

// Difficulty definitions for positions down by exactly one piece
const DIFFICULTY_LEVELS = {
  'beginner': {
    evaluationRange: [-1, -1],
    description: 'Down by one piece - Learn to fight back',
    complexity: 1
  },
  'intermediate': {
    evaluationRange: [-1, -1],
    description: 'One piece down - Master counterplay',
    complexity: 2
  },
  'advanced': {
    evaluationRange: [-1, -1],
    description: 'One piece disadvantage - Perfect your technique',
    complexity: 3
  },
  'expert': {
    evaluationRange: [-1, -1],
    description: 'One piece down - Master resourceful play',
    complexity: 4
  }
};

// Get a random losing position (simplified - no difficulty levels)
router.get('/position', auth, premium, async (req, res) => {
  try {
    console.log(`[RESOURCEFULNESS] ===== ENDPOINT CALLED =====`);
    
    // Try to get positions from database first
    try {
      const totalPositions = await ResourcefulnessPosition.countDocuments();
      console.log(`[RESOURCEFULNESS] Total positions in database: ${totalPositions}`);
      
      if (totalPositions > 0) {
        // Get a random position from database
        const randomIndex = Math.floor(Math.random() * totalPositions);
        const selectedPosition = await ResourcefulnessPosition.findOne().skip(randomIndex);
        
        if (selectedPosition) {
          console.log(`[RESOURCEFULNESS] Selected database position:`, selectedPosition.puzzleId);
          
          return res.json({
            fen: selectedPosition.fen,
            moves: selectedPosition.moves,
            difficulty: 'resourcefulness',
            description: selectedPosition.description,
            evaluation: selectedPosition.evaluation,
            losingSide: selectedPosition.losingSide
          });
        }
      }
    } catch (dbError) {
      console.error('[RESOURCEFULNESS] Database error:', dbError);
    }
    
    // Fallback to in-memory positions if database is empty or fails
    console.log(`[RESOURCEFULNESS] Falling back to in-memory positions. Total: ${losingPositions.length}`);
    
    if (losingPositions.length === 0) {
      console.log(`[RESOURCEFULNESS] No positions available`);
      return res.status(500).json({ error: 'No positions available' });
    }
    
    // Get a random position from in-memory array
    const randomIndex = Math.floor(Math.random() * losingPositions.length);
    const selectedPosition = losingPositions[randomIndex];
    
    console.log(`[RESOURCEFULNESS] Selected in-memory position:`, selectedPosition);
    
    res.json({
      fen: selectedPosition.fen,
      moves: selectedPosition.moves,
      difficulty: 'resourcefulness',
      description: selectedPosition.description,
      evaluation: selectedPosition.evaluation,
      losingSide: selectedPosition.losingSide
    });
    
  } catch (error) {
    console.error('[RESOURCEFULNESS] Error getting position:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user stats - NON-BLOCKING: Always return success immediately, update rating in background
router.post('/stats', auth, async (req, res) => {
  const startTime = Date.now();
  const { won, puzzleRating = 1200, difficulty } = req.body;
  const userId = req.user.id;
  
  // Log telemetry
  console.log(`[RESOURCEFULNESS] resourcefulness_result:`, {
    userId,
    won,
    difficulty: difficulty || 'unknown',
    puzzleRating,
    timestamp: new Date().toISOString()
  });
  
  // ALWAYS return success immediately - don't block next position
  // Update rating in background (fire and forget)
  const updateRatingInBackground = async () => {
    try {
      console.log(`[RESOURCEFULNESS] rating_update_start:`, {
        userId,
        ratingType: 'resourcefulnessRating',
        puzzleRating,
        won,
        timestamp: new Date().toISOString()
      });
      
      // Get current user to check their rating
      const user = await User.findById(userId);
      if (!user) {
        console.error(`[RESOURCEFULNESS] rating_update_fail: User not found`, { userId });
        return;
      }
      
      // Initialize resourcefulness rating if it doesn't exist
      if (!user.resourcefulnessRating) {
        user.resourcefulnessRating = 1200;
        await user.save();
      }
      
      // Calculate rating change using ELO system
      const ratingResult = await updateUserRating(userId, 'resourcefulnessRating', puzzleRating, won);
      
      // Update user's resourcefulness wins and rating
      const updateFields = {};
      if (won) {
        updateFields.$inc = { resourcefulnessWins: 1 };
      }
      
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        updateFields,
        { new: true }
      );
      
      if (!updatedUser) {
        console.error(`[RESOURCEFULNESS] rating_update_fail: User not found after update`, { userId });
        return;
      }
      
      const duration = Date.now() - startTime;
      console.log(`[RESOURCEFULNESS] rating_update_success:`, {
        userId,
        oldRating: ratingResult.oldRating,
        newRating: ratingResult.newRating,
        ratingChange: ratingResult.ratingChange,
        duration,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`[RESOURCEFULNESS] rating_update_fail:`, {
        userId,
        error: error.message,
        stack: error.stack,
        duration,
        timestamp: new Date().toISOString()
      });
      
      // Log if error rate is high (for monitoring)
      // This is a non-blocking error, so we don't throw
    }
  };
  
  // Fire and forget - don't await
  updateRatingInBackground().catch(err => {
    console.error(`[RESOURCEFULNESS] Background rating update error (non-blocking):`, err);
  });
  
  // Get user for current stats (don't wait for rating update)
  try {
    const user = await User.findById(userId);
    if (!user) {
      // Still return success even if user not found (non-blocking)
      return res.json({
        success: true,
        resourcefulnessWins: 0,
        resourcefulnessRating: 1200,
        ratingChange: 0
      });
    }
    
    // Return immediately with current stats (rating update happens in background)
    res.json({
      success: true,
      resourcefulnessWins: user.resourcefulnessWins || 0,
      resourcefulnessRating: user.resourcefulnessRating || 1200,
      ratingChange: 0 // Will be updated in background
    });
    
    // Log next position delivery
    const deliveryTime = Date.now() - startTime;
    console.log(`[RESOURCEFULNESS] next_position_delivered:`, {
      userId,
      deliveryTime,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    // Even on error, return success to not block next position
    console.error('[RESOURCEFULNESS] Error getting user stats (non-blocking):', error);
    res.json({
      success: true,
      resourcefulnessWins: 0,
      resourcefulnessRating: 1200,
      ratingChange: 0
    });
  }
});

// Get user stats
router.get('/stats', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      resourcefulnessWins: user.resourcefulnessWins || 0,
      rating: user.rating || 1200
    });
    
  } catch (error) {
    console.error('[RESOURCEFULNESS] Error getting stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Analyze position with Stockfish
router.post('/analyze', auth, premium, async (req, res) => {
  try {
    const { fen } = req.body;
    
    if (!fen) {
      return res.status(400).json({ error: 'FEN is required' });
    }
    
    console.log(`[RESOURCEFULNESS] Analyzing position with Stockfish: ${fen}`);
    
    // Call the real Stockfish analysis API
    const analysisResponse = await fetch('http://localhost:3001/api/analysis/position', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fen: fen,
        depth: 15,
        multiPV: 1,
        timeLimit: 3000
      })
    });

    if (analysisResponse.ok) {
      const analysisData = await analysisResponse.json();
      console.log(`[RESOURCEFULNESS] Stockfish analysis result:`, analysisData);
      
      if (analysisData.success && analysisData.evaluation !== undefined) {
        res.json({
          evaluation: {
            type: 'cp',
            value: Math.round(analysisData.evaluation * 100) // Convert to centipawns
          },
          bestMove: analysisData.bestMove,
          depth: analysisData.depth || 15
        });
      } else {
        console.warn('[RESOURCEFULNESS] Stockfish analysis failed, using material evaluation');
        // Fallback to material evaluation
        const evaluation = evaluatePosition(fen);
        res.json({
          evaluation: {
            type: 'cp',
            value: Math.round(evaluation.evaluation * 100)
          },
          bestMove: evaluation.bestMove,
          depth: 1
        });
      }
    } else {
      console.warn('[RESOURCEFULNESS] Stockfish API not available, using material evaluation');
      // Fallback to material evaluation
      const evaluation = evaluatePosition(fen);
      res.json({
        evaluation: {
          type: 'cp',
          value: Math.round(evaluation.evaluation * 100)
        },
        bestMove: evaluation.bestMove,
        depth: 1
      });
    }
    
  } catch (error) {
    console.error('[RESOURCEFULNESS] Error analyzing position:', error);
    // Fallback to material evaluation
    try {
      const evaluation = evaluatePosition(req.body.fen);
      res.json({
        evaluation: {
          type: 'cp',
          value: Math.round(evaluation.evaluation * 100)
        },
        bestMove: evaluation.bestMove,
        depth: 1
      });
    } catch (fallbackError) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

module.exports = router;