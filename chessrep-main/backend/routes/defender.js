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

// Defender Position Schema
const defenderPositionSchema = new mongoose.Schema({
  fen: { type: String, required: true },
  answer1: { type: String, required: true },
  answer2: { type: String, required: true },
  correctAnswer: { type: String, required: true },
  difficulty: { type: String, required: true },
  description: { type: String, required: true },
  rating: { type: Number, required: true },
  themes: { type: String, default: 'defensive_move' },
  puzzleId: { type: String, required: true }
});

const DefenderPosition = mongoose.model('DefenderPosition', defenderPositionSchema);

// Track recently served positions to prevent repetitions
let recentlyServedDefender = new Set();
const MAX_RECENT_DEFENDER = 50;

// Load defensive positions from CSV file
let defensivePositions = [];

// Create fallback defensive positions if CSV is not available
function createFallbackPositions() {
  return [
    {
      fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 1',
      answer1: 'Nxe5',
      answer2: 'Bxf7+',
      correctAnswer: 'Answer1',
      correctMove: 'Nxe5',
      difficulty: 'intermediate',
      pieceCount: 16,
      puzzleId: 'fallback-1'
    },
    {
      fen: 'rnbqkb1r/pppp1ppp/5n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 1',
      answer1: 'Nxe5',
      answer2: 'd4',
      correctAnswer: 'Answer1',
      correctMove: 'Nxe5',
      difficulty: 'intermediate',
      pieceCount: 16,
      puzzleId: 'fallback-2'
    },
    {
      fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/3P1N2/PPP2PPP/RNBQK2R w KQkq - 0 1',
      answer1: 'Nxe5',
      answer2: 'Bxf7+',
      correctAnswer: 'Answer2',
      correctMove: 'Bxf7+',
      difficulty: 'intermediate',
      pieceCount: 16,
      puzzleId: 'fallback-3'
    }
  ];
}

function loadDefensivePositions() {
  return new Promise((resolve, reject) => {
    // Try multiple possible paths for the CSV file
    const possiblePaths = [
      path.join(__dirname, '../../../aimchess_fens.csv'), // From chessrep-main/backend/routes to workspace root
      path.join(__dirname, '../../../../aimchess_fens.csv'), // From chessrep-main - Copy root
      path.join(process.cwd(), 'aimchess_fens.csv'), // From current working directory
      path.join(process.cwd(), '../aimchess_fens.csv'), // One level up from cwd
      path.join(process.cwd(), '../../aimchess_fens.csv'), // Two levels up from cwd
      path.join(__dirname, '../../puzzles/aimchess_fens.csv'), // In puzzles folder
    ];
    
    let CSV_PATH = null;
    for (const possiblePath of possiblePaths) {
      if (fs.existsSync(possiblePath)) {
        CSV_PATH = possiblePath;
        console.log(`[DEFENDER] Found CSV file at: ${CSV_PATH}`);
        break;
      }
    }
    
    if (!CSV_PATH) {
      console.error(`[DEFENDER] CSV file not found. Tried paths:`, possiblePaths);
      console.error(`[DEFENDER] Current working directory: ${process.cwd()}`);
      console.error(`[DEFENDER] __dirname: ${__dirname}`);
      console.log(`[DEFENDER] Using fallback defensive positions`);
      defensivePositions = createFallbackPositions();
      resolve();
      return;
    }

    const positions = [];
    
    fs.createReadStream(CSV_PATH)
      .pipe(csv())
      .on('data', (row) => {
        try {
          // Skip header row or invalid rows
          if (!row.FEN || row.Index === 'Index') {
            return;
          }

          const fen = row.FEN.trim();
          const answer1 = row.Answer1 ? row.Answer1.trim() : '';
          const answer2 = row.Answer2 ? row.Answer2.trim() : '';
          const correctAnswer = row.CorrectAnswer ? row.CorrectAnswer.trim() : '';
          const index = row.Index ? row.Index.trim() : '';

          if (fen && answer1 && answer2 && correctAnswer) {
            // Determine correct move
            const correctMove = correctAnswer === 'Answer1' ? answer1 : answer2;

            // Count pieces to determine difficulty
            try {
              const { Chess } = require('chess.js');
              const game = new Chess(fen);
              const board = game.board();
              const pieceCount = board.flat().filter(p => p).length;

              let difficulty = 'intermediate';
              if (pieceCount <= 6) {
                difficulty = 'beginner';
              } else if (pieceCount <= 12) {
                difficulty = 'intermediate';
              } else if (pieceCount <= 20) {
                difficulty = 'advanced';
              } else {
                difficulty = 'expert';
              }

              positions.push({
                fen,
                answer1,
                answer2,
                correctAnswer,
                correctMove,
                difficulty,
                pieceCount,
                puzzleId: index || `defender-${positions.length}`
              });
            } catch (error) {
              console.error(`[DEFENDER] Error processing FEN ${fen}:`, error.message);
            }
          }
        } catch (error) {
          console.error('[DEFENDER] Error parsing row:', error);
        }
      })
      .on('end', () => {
        defensivePositions = positions.length > 0 ? positions : createFallbackPositions();
        console.log(`[DEFENDER] Loaded ${defensivePositions.length} defensive positions from CSV (or fallbacks)`);
        resolve();
      })
      .on('error', (error) => {
        console.error('[DEFENDER] Error reading CSV:', error);
        console.log('[DEFENDER] Using fallback positions due to CSV error');
        defensivePositions = createFallbackPositions();
        resolve(); // Resolve instead of reject so we can still use fallbacks
      });
  });
}

// Initialize positions on startup
loadDefensivePositions().catch(err => {
  console.error('[DEFENDER] Failed to load defensive positions:', err);
  // If loading fails, use fallback positions
  if (defensivePositions.length === 0) {
    console.log('[DEFENDER] Initializing with fallback positions');
    defensivePositions = createFallbackPositions();
  }
});

// Difficulty definitions with progressive complexity
const DIFFICULTY_LEVELS = {
  'beginner': {
    pieceCountRange: [2, 6],
    description: 'Simple defensive positions with clear threats to parry',
    complexity: 1
  },
  'intermediate': {
    pieceCountRange: [7, 12],
    description: 'Moderate threats requiring defensive awareness',
    complexity: 2
  },
  'advanced': {
    pieceCountRange: [13, 20],
    description: 'Complex positions requiring precise defensive calculation',
    complexity: 3
  },
  'expert': {
    pieceCountRange: [21, 32],
    description: 'Master-level positions requiring deep defensive analysis',
    complexity: 4
  }
};

// Get a random defensive position based on difficulty
router.get('/position', auth, premium, async (req, res) => {
  try {
    const { difficulty = 'intermediate' } = req.query;
    
    console.log(`[DEFENDER] Getting position for difficulty: ${difficulty}`);
    
    // Validate difficulty
    if (!DIFFICULTY_LEVELS[difficulty]) {
      return res.status(400).json({ error: 'Invalid difficulty level' });
    }
    
    const difficultyConfig = DIFFICULTY_LEVELS[difficulty];
    
    // Try to get position from database first
    try {
      const totalPositions = await DefenderPosition.countDocuments({ difficulty });
      console.log(`[DEFENDER] Total defender positions in database for ${difficulty}: ${totalPositions}`);
      
      if (totalPositions > 0) {
        // Try to get a position that hasn't been recently served
        let attempts = 0;
        const maxAttempts = 10;
        let defPos = null;
        
        do {
          const randomIndex = Math.floor(Math.random() * totalPositions);
          defPos = await DefenderPosition.findOne({ difficulty }).skip(randomIndex);
          
          if (defPos && !recentlyServedDefender.has(defPos.puzzleId)) {
            break;
          }
          attempts++;
        } while (attempts < maxAttempts && defPos);
        
        // If we couldn't find a unique position, use any position of this difficulty
        if (!defPos) {
          const randomIndex = Math.floor(Math.random() * totalPositions);
          defPos = await DefenderPosition.findOne({ difficulty }).skip(randomIndex);
        }
        
        if (defPos) {
          // Track this position to prevent repetition
          recentlyServedDefender.add(defPos.puzzleId);
          
          // Keep the set size manageable
          if (recentlyServedDefender.size > MAX_RECENT_DEFENDER) {
            const firstPosition = recentlyServedDefender.values().next().value;
            recentlyServedDefender.delete(firstPosition);
          }
          
          console.log(`[DEFENDER] Serving database position: ${defPos.difficulty} difficulty`);
          return res.json({
            fen: defPos.fen,
            answer1: defPos.answer1,
            answer2: defPos.answer2,
            correctAnswer: defPos.correctAnswer,
            correctMove: defPos.correctAnswer === 'Answer1' ? defPos.answer1 : defPos.answer2,
            difficulty: defPos.difficulty,
            description: defPos.description,
            rating: defPos.rating
          });
        }
      }
    } catch (dbError) {
      console.log('[DEFENDER] Database error, falling back to CSV:', dbError.message);
    }
    
    // Fallback to CSV positions - filter by difficulty
    if (defensivePositions.length === 0) {
      console.log('[DEFENDER] No positions loaded, using fallback positions');
      defensivePositions = createFallbackPositions();
    }
    
    // Filter positions by difficulty based on piece count
    const filteredPositions = defensivePositions.filter(pos => {
      return pos.pieceCount >= difficultyConfig.pieceCountRange[0] && 
             pos.pieceCount <= difficultyConfig.pieceCountRange[1];
    });
    
    console.log(`[DEFENDER] Found ${filteredPositions.length} positions for ${difficulty} difficulty`);
    
    // If no positions match the difficulty, try to find the closest match
    let positionsToUse = filteredPositions;
    if (positionsToUse.length === 0) {
      console.log(`[DEFENDER] No positions found for ${difficulty}, finding closest match...`);
      
      // Find positions closest to the difficulty range
      const sortedPositions = [...defensivePositions].sort((a, b) => {
        const aDiff = Math.abs(a.pieceCount - difficultyConfig.pieceCountRange[0]);
        const bDiff = Math.abs(b.pieceCount - difficultyConfig.pieceCountRange[0]);
        return aDiff - bDiff;
      });
      
      positionsToUse = sortedPositions.slice(0, Math.min(10, sortedPositions.length));
    }
    
    if (positionsToUse.length === 0) {
      console.log(`[DEFENDER] No positions match ${difficulty}, using any available position`);
      // Use any available position as a last resort
      positionsToUse = defensivePositions.length > 0 ? defensivePositions : createFallbackPositions();
    }
    
    if (positionsToUse.length === 0) {
      console.error('[DEFENDER] Still no positions available after all fallbacks');
      return res.status(500).json({ error: 'No positions available. Please try again later.' });
    }
    
    const randomIndex = Math.floor(Math.random() * positionsToUse.length);
    const selectedPosition = positionsToUse[randomIndex];
    
    const position = {
      fen: selectedPosition.fen,
      answer1: selectedPosition.answer1,
      answer2: selectedPosition.answer2,
      correctAnswer: selectedPosition.correctAnswer,
      correctMove: selectedPosition.correctMove,
      difficulty: difficulty,
      description: getPositionDescription(difficulty, selectedPosition.pieceCount),
      rating: getDifficultyRating(difficulty)
    };
    
    console.log(`[DEFENDER] Serving position: ${difficulty} difficulty, ${selectedPosition.pieceCount} pieces, rating: ${position.rating}`);
    res.json(position);
    
  } catch (error) {
    console.error('[DEFENDER] Error getting defensive position:', error);
    res.status(500).json({ error: 'Failed to get defensive position' });
  }
});

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
      `Simple defensive position (${pieceCount} pieces) - Find the move that defends against the threat`,
      `Basic defense (${pieceCount} pieces) - Identify the defensive move to stay safe`,
      `Easy defensive puzzle (${pieceCount} pieces) - Choose the move that prevents the attack`
    ],
    intermediate: [
      `Moderate defensive position (${pieceCount} pieces) - Find the best defensive move`,
      `Tactical defense (${pieceCount} pieces) - Defend against the incoming threats`,
      `Balanced complexity (${pieceCount} pieces) - Select the defensive move that maintains your position`
    ],
    advanced: [
      `Complex defensive position (${pieceCount} pieces) - Calculate the precise defensive move`,
      `Advanced defense (${pieceCount} pieces) - Find the sophisticated defensive solution`,
      `Challenging defense (${pieceCount} pieces) - Identify the accurate defensive move`
    ],
    expert: [
      `Master-level defensive position (${pieceCount} pieces) - Find the deep defensive solution`,
      `Expert defense (${pieceCount} pieces) - Use master-level defensive patterns`,
      `Elite defensive puzzle (${pieceCount} pieces) - Find the most precise defensive move`
    ]
  };
  
  const options = descriptions[difficulty] || descriptions.intermediate;
  return options[Math.floor(Math.random() * options.length)];
}

// Update defender stats and rating
router.post('/stats', auth, async (req, res) => {
  try {
    const { solved, puzzleRating, won, additionalWins } = req.body;
    const userId = req.user.id;

    console.log(`[DEFENDER] Stats update request from user ${userId}:`, { solved, puzzleRating, won, additionalWins });

    const user = await User.findById(userId);
    if (!user) {
      console.log(`[DEFENDER] User ${userId} not found`);
      return res.status(404).json({ message: 'User not found' });
    }

    console.log(`[DEFENDER] User found: ${user.username}, current defenderWins: ${user.defenderWins || 0}`);

    // Ensure rating fields exist
    initializeUserRatings(user);

    const ratingValue = parseInt(puzzleRating) || 1200;

    // Update dedicated defender rating field
    const ratingResult = await updateUserRating(userId, 'defenderRating', ratingValue, solved);

    // Update wins count if position was won
    if (won) {
      const oldWins = user.defenderWins || 0;
      
      // Handle additional wins (for end-of-game saves)
      if (additionalWins && additionalWins > 0) {
        user.defenderWins = oldWins + additionalWins;
        console.log(`[DEFENDER] Added ${additionalWins} additional wins: ${oldWins} -> ${user.defenderWins}`);
      } else {
        // Single win (during gameplay)
        user.defenderWins = oldWins + 1;
        console.log(`[DEFENDER] Added 1 win: ${oldWins} -> ${user.defenderWins}`);
      }
      
      await user.save();
      console.log(`[DEFENDER] User saved with defenderWins: ${user.defenderWins}`);
    }

    const response = { 
      newRating: ratingResult.newRating, 
      ratingChange: ratingResult.ratingChange,
      defenderWins: user.defenderWins || 0
    };

    console.log(`[DEFENDER] Sending response:`, response);
    res.json(response);
  } catch (err) {
    console.error('[DEFENDER] Error updating stats:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

