const express = require('express');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const auth = require('../middleware/auth');
const premium = require('../middleware/premium');
const User = require('../models/User');
const { updateUserRating, initializeUserRatings } = require('../utils/ratingUtils');
const mongoose = require('mongoose');

// Advantage Position Schema
const advantagePositionSchema = new mongoose.Schema({
  fen: { type: String, required: true },
  moves: { type: [String], required: true },
  difficulty: { type: String, required: true },
  description: { type: String, required: true },
  rating: { type: Number, required: true },
  themes: { type: String, default: 'advantage' },
  puzzleId: { type: String, required: true }
});

const AdvantagePosition = mongoose.model('AdvantagePosition', advantagePositionSchema);

// Track recently served positions to prevent repetitions
let recentlyServedAdvantage = new Set();
const MAX_RECENT_ADVANTAGE = 50;

// Load checkmate positions from JSON file
let checkmatePositions = [];

function loadCheckmatePositions() {
  return new Promise((resolve, reject) => {
    const JSON_PATH = path.join(__dirname, '../data/checkmate.json');
    
    fs.readFile(JSON_PATH, 'utf8', (err, data) => {
      if (err) {
        console.error('Error reading checkmate.json:', err);
        reject(err);
        return;
      }
      
      try {
        checkmatePositions = JSON.parse(data);
        console.log(`[ADVANTAGE] Loaded ${checkmatePositions.length} checkmate positions`);
        resolve();
      } catch (parseErr) {
        console.error('Error parsing checkmate.json:', parseErr);
        reject(parseErr);
      }
    });
  });
}

// Initialize positions on startup
loadCheckmatePositions().catch(err => {
  console.error('Failed to load checkmate positions:', err);
});

// Difficulty definitions with progressive complexity
const DIFFICULTY_LEVELS = {
  'beginner': {
    pieceCountRange: [2, 6],
    description: 'Simple winning positions with clear material advantage',
    complexity: 1
  },
  'intermediate': {
    pieceCountRange: [7, 12],
    description: 'Moderate advantages requiring tactical awareness',
    complexity: 2
  },
  'advanced': {
    pieceCountRange: [13, 20],
    description: 'Complex positions requiring precise calculation',
    complexity: 3
  },
  'expert': {
    pieceCountRange: [21, 32],
    description: 'Master-level positions requiring deep analysis',
    complexity: 4
  }
};

// Get a random winning position based on difficulty
router.get('/position', auth, premium, async (req, res) => {
  try {
    const { difficulty = 'intermediate' } = req.query;
    
    console.log(`[ADVANTAGE] Getting position for difficulty: ${difficulty}`);
    
    // Validate difficulty
    if (!DIFFICULTY_LEVELS[difficulty]) {
      return res.status(400).json({ error: 'Invalid difficulty level' });
    }
    
    const difficultyConfig = DIFFICULTY_LEVELS[difficulty];
    
    // Try to get position from database first
    try {
      const totalPositions = await AdvantagePosition.countDocuments({ difficulty });
      console.log(`Total advantage positions in database for ${difficulty}: ${totalPositions}`);
      
      if (totalPositions > 0) {
        // Try to get a position that hasn't been recently served
        let attempts = 0;
        const maxAttempts = 10;
        let advPos = null;
        
        do {
          const randomIndex = Math.floor(Math.random() * totalPositions);
          advPos = await AdvantagePosition.findOne({ difficulty }).skip(randomIndex);
          
          if (advPos && !recentlyServedAdvantage.has(advPos.puzzleId)) {
            break;
          }
          attempts++;
        } while (attempts < maxAttempts && advPos);
        
        // If we couldn't find a unique position, use any position of this difficulty
        if (!advPos) {
          const randomIndex = Math.floor(Math.random() * totalPositions);
          advPos = await AdvantagePosition.findOne({ difficulty }).skip(randomIndex);
        }
        
        if (advPos) {
          // Track this position to prevent repetition
          recentlyServedAdvantage.add(advPos.puzzleId);
          
          // Keep the set size manageable
          if (recentlyServedAdvantage.size > MAX_RECENT_ADVANTAGE) {
            const firstPosition = recentlyServedAdvantage.values().next().value;
            recentlyServedAdvantage.delete(firstPosition);
          }
          
          console.log(`[ADVANTAGE] Serving database position: ${advPos.difficulty} difficulty`);
          return res.json({
            fen: advPos.fen,
            moves: advPos.moves,
            difficulty: advPos.difficulty,
            description: advPos.description,
            rating: advPos.rating
          });
        }
      }
    } catch (dbError) {
      console.log('Database error, falling back to JSON:', dbError.message);
    }
    
    // Fallback to JSON positions - filter by difficulty
    if (checkmatePositions.length === 0) {
      return res.status(500).json({ error: 'No positions available' });
    }
    
    // Filter positions by difficulty based on piece count
    const filteredPositions = checkmatePositions.filter(selectedFen => {
      const fenString = Array.isArray(selectedFen) ? selectedFen[0] : selectedFen;
      try {
        const { Chess } = require('chess.js');
        const game = new Chess(fenString);
        const board = game.board();
        const pieceCount = board.flat().filter(p => p).length;
        
        return pieceCount >= difficultyConfig.pieceCountRange[0] && 
               pieceCount <= difficultyConfig.pieceCountRange[1];
      } catch (error) {
        console.error('Error processing position:', error);
        return false;
      }
    });
    
    console.log(`[ADVANTAGE] Found ${filteredPositions.length} positions for ${difficulty} difficulty`);
    
    // If no positions match the difficulty, try to find the closest match
    let positionsToUse = filteredPositions;
    if (positionsToUse.length === 0) {
      console.log(`[ADVANTAGE] No positions found for ${difficulty}, finding closest match...`);
      
      // Find positions closest to the difficulty range
      const sortedPositions = checkmatePositions.map(selectedFen => {
        const fenString = Array.isArray(selectedFen) ? selectedFen[0] : selectedFen;
        try {
          const { Chess } = require('chess.js');
          const game = new Chess(fenString);
          const board = game.board();
          const pieceCount = board.flat().filter(p => p).length;
          return { fen: fenString, pieceCount };
        } catch (error) {
          return { fen: fenString, pieceCount: 0 };
        }
      }).sort((a, b) => {
        const aDiff = Math.abs(a.pieceCount - difficultyConfig.pieceCountRange[0]);
        const bDiff = Math.abs(b.pieceCount - difficultyConfig.pieceCountRange[0]);
        return aDiff - bDiff;
      });
      
      positionsToUse = sortedPositions.slice(0, Math.min(10, sortedPositions.length));
    }
    
    if (positionsToUse.length === 0) {
      return res.status(404).json({ error: `No positions available for ${difficulty} difficulty` });
    }
    
    const randomIndex = Math.floor(Math.random() * positionsToUse.length);
    const selectedPosition = positionsToUse[randomIndex];
    const fenString = selectedPosition.fen || (Array.isArray(selectedPosition) ? selectedPosition[0] : selectedPosition);
    
    const { Chess } = require('chess.js');
    const game = new Chess(fenString);
    const board = game.board();
    const pieceCount = board.flat().filter(p => p).length;
    
    const winningMoves = generateWinningMoves(fenString, difficultyConfig.complexity);
    
    const position = {
      fen: fenString,
      moves: winningMoves,
      difficulty: difficulty,
      description: getPositionDescription(difficulty, pieceCount),
      rating: getDifficultyRating(difficulty)
    };
    
    console.log(`[ADVANTAGE] Serving position: ${difficulty} difficulty, ${pieceCount} pieces, rating: ${position.rating}`);
    res.json(position);
    
  } catch (error) {
    console.error('Error getting winning position:', error);
    res.status(500).json({ error: 'Failed to get winning position' });
  }
});

// Generate winning moves for a position based on complexity
function generateWinningMoves(fen, complexity = 1) {
  const { Chess } = require('chess.js');
  const game = new Chess(fen);
  
  // For now, return some basic moves that might lead to checkmate
  const moves = game.moves();
  if (moves.length === 0) return [];
  
  // Return more moves for higher complexity levels
  const moveCount = Math.min(2 + complexity, moves.length);
  return moves.slice(0, moveCount);
}

// Get difficulty rating based on level
function getDifficultyRating(difficulty) {
  const ratings = {
    'beginner': 800,
    'intermediate': 1200,
    'advanced': 1600,
    'expert': 2000
  };
  return ratings[difficulty] || 1200;
}

// Get position description based on difficulty
function getPositionDescription(difficulty, pieceCount) {
  const descriptions = {
    beginner: [
      `Simple winning position (${pieceCount} pieces) - Convert your clear material advantage to checkmate`,
      `Basic endgame (${pieceCount} pieces) - Use your extra pieces to force checkmate`,
      `Easy conversion (${pieceCount} pieces) - Find the straightforward winning sequence`
    ],
    intermediate: [
      `Moderate advantage (${pieceCount} pieces) - Convert your positional edge to victory`,
      `Tactical position (${pieceCount} pieces) - Use tactical motifs to force checkmate`,
      `Balanced complexity (${pieceCount} pieces) - Find the most forcing line to win`
    ],
    advanced: [
      `Complex position (${pieceCount} pieces) - Convert your advantage with precise calculation`,
      `Advanced tactics (${pieceCount} pieces) - Use sophisticated patterns to force the win`,
      `Challenging conversion (${pieceCount} pieces) - Find the accurate winning sequence`
    ],
    expert: [
      `Master-level position (${pieceCount} pieces) - Convert your advantage with deep analysis`,
      `Expert tactics (${pieceCount} pieces) - Use master-level patterns to force victory`,
      `Elite conversion (${pieceCount} pieces) - Find the most precise winning sequence`
    ]
  };
  
  const options = descriptions[difficulty] || descriptions.intermediate;
  return options[Math.floor(Math.random() * options.length)];
}

// Get multiple positions for practice
router.get('/positions', auth, premium, async (req, res) => {
  try {
    const { count = 5, difficulty = 'intermediate' } = req.query;
    
    if (checkmatePositions.length === 0) {
      return res.status(500).json({ error: 'No positions available' });
    }
    
    const positions = [];
    const maxPositions = Math.min(parseInt(count), checkmatePositions.length);
    
    for (let i = 0; i < maxPositions; i++) {
      const randomIndex = Math.floor(Math.random() * checkmatePositions.length);
      const selectedFen = checkmatePositions[randomIndex];
      
      // Handle the case where checkmatePositions is an array of arrays
      const fenString = Array.isArray(selectedFen) ? selectedFen[0] : selectedFen;
      
      const { Chess } = require('chess.js');
      const game = new Chess(fenString);
      const board = game.board();
      const pieceCount = board.flat().filter(p => p).length;
      
      let calculatedDifficulty = 'beginner';
      if (pieceCount <= 6) {
        calculatedDifficulty = 'beginner';
      } else if (pieceCount <= 10) {
        calculatedDifficulty = 'intermediate';
      } else if (pieceCount <= 15) {
        calculatedDifficulty = 'advanced';
      } else {
        calculatedDifficulty = 'expert';
      }
      
      const winningMoves = generateWinningMoves(fenString);
      
      positions.push({
        fen: fenString,
        moves: winningMoves,
        difficulty: calculatedDifficulty,
        description: getPositionDescription(calculatedDifficulty, pieceCount)
      });
    }
    
    console.log(`[ADVANTAGE] Serving ${positions.length} positions`);
    res.json({ positions });
    
  } catch (error) {
    console.error('Error getting multiple positions:', error);
    res.status(500).json({ error: 'Failed to get positions' });
  }
});

module.exports = router;

// Update advantage conversion stats and rating
router.post('/stats', auth, async (req, res) => {
  try {
    const { solved, puzzleRating, won, additionalWins } = req.body;
    const userId = req.user.id;

    console.log(`[ADVANTAGE] Stats update request from user ${userId}:`, { solved, puzzleRating, won, additionalWins });
    console.log(`[ADVANTAGE] Full request body:`, req.body);

    const user = await User.findById(userId);
    if (!user) {
      console.log(`[ADVANTAGE] User ${userId} not found`);
      return res.status(404).json({ message: 'User not found' });
    }

    console.log(`[ADVANTAGE] User found: ${user.username}, current advantageWins: ${user.advantageWins}`);
    console.log(`[ADVANTAGE] User object before update:`, {
      id: user._id,
      username: user.username,
      advantageWins: user.advantageWins,
      rating: user.rating
    });
    console.log(`[ADVANTAGE] Requesting user ID: ${userId}`);

    // Ensure rating fields exist
    initializeUserRatings(user);

    const ratingValue = parseInt(puzzleRating) || 1200;

    // Update dedicated advantage rating field
    const ratingResult = await updateUserRating(userId, 'advantageRating', ratingValue, solved);

    // Update wins count if position was won
    if (won) {
      const oldWins = user.advantageWins || 0;
      
      // Handle additional wins (for end-of-game saves)
      if (additionalWins && additionalWins > 0) {
        user.advantageWins = oldWins + additionalWins;
        console.log(`[ADVANTAGE] Added ${additionalWins} additional wins: ${oldWins} -> ${user.advantageWins}`);
      } else {
        // Single win (during gameplay)
        user.advantageWins = oldWins + 1;
        console.log(`[ADVANTAGE] Added 1 win: ${oldWins} -> ${user.advantageWins}`);
      }
      
      await user.save();
      console.log(`[ADVANTAGE] User saved with advantageWins: ${user.advantageWins}`);
      
      // Verify the user was actually saved by fetching it again
      const savedUser = await User.findById(userId);
      console.log(`[ADVANTAGE] Verification - User after save:`, {
        id: savedUser._id,
        username: savedUser.username,
        advantageWins: savedUser.advantageWins
      });
    }

    const response = { 
      newRating: ratingResult.newRating, 
      ratingChange: ratingResult.ratingChange,
      advantageWins: user.advantageWins
    };

    console.log(`[ADVANTAGE] Sending response:`, response);
    res.json(response);
  } catch (err) {
    console.error('[ADVANTAGE] Error updating stats:', err);
    res.status(500).json({ message: 'Server error' });
  }
});
