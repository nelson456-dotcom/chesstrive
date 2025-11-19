const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { Chess } = require('chess.js');
const Puzzle = require('../models/Puzzle');
const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');

// Load easy puzzles from CSV for puzzle rush
let easyPuzzles = [];

// Pre-load some sample puzzles for immediate use
const samplePuzzles = [
  {
    _id: 'sample-1',
    fen: 'r6k/pp2r2p/4Rp1Q/3p4/8/1N1P2R1/PqP2bPP/7K b - - 0 24',
    moves: ['f2g3', 'e6e7', 'b2b1'],
    rating: 1928,
    theme: 'crushing',
    themes: 'crushing hangingPiece long middlegame'
  },
  {
    _id: 'sample-2',
    fen: '5rk1/1p3ppp/pq3b2/8/8/1P1Q1N2/P4PPP/3R2K1 w - - 2 27',
    moves: ['d3d6', 'f8d8', 'd6d8'],
    rating: 1471,
    theme: 'advantage',
    themes: 'advantage endgame short'
  },
  {
    _id: 'sample-3',
    fen: '8/4R3/1p2P3/p4r2/P6p/1P3Pk1/4K3/8 w - - 1 64',
    moves: ['e7f7', 'f5e5', 'e2f1'],
    rating: 1361,
    theme: 'advantage',
    themes: 'advantage endgame rookEndgame short'
  },
  {
    _id: 'sample-4',
    fen: 'r2qr1k1/b1p2ppp/pp4n1/P1P1p3/4P1n1/B2P2Pb/3NBP1P/RN1QR1K1 b - - 1 16',
    moves: ['b6c5', 'e2g4', 'h3g4'],
    rating: 1080,
    theme: 'advantage',
    themes: 'advantage middlegame short'
  }
];

// Initialize with sample puzzles
easyPuzzles = samplePuzzles;

function loadEasyPuzzlesFromCSV() {
  return new Promise((resolve, reject) => {
    const CSV_PATH = path.join(__dirname, '../data/puzzles.csv');
    console.log('[PUZZLE RUSH] CSV path:', CSV_PATH);
    console.log('[PUZZLE RUSH] CSV exists:', fs.existsSync(CSV_PATH));
    
    if (!fs.existsSync(CSV_PATH)) {
      console.log('[PUZZLE RUSH] No CSV found, using fallback puzzles');
      easyPuzzles = getFallbackPuzzles();
      resolve();
      return;
    }

    console.log('[PUZZLE RUSH] Starting CSV parsing with csv-parser...');
    
    const puzzles = [];
    let loadedCount = 0;
    const MAX_PUZZLES = 2000; // Load up to 2000 puzzles as requested
    let hasError = false;
    
    try {
      const stream = fs.createReadStream(CSV_PATH)
        .pipe(csv())
        .on('data', (row) => {
          if (hasError || loadedCount >= MAX_PUZZLES) {
            return;
          }
          
          try {
            const fen = row.FEN;
            const rating = parseInt(row.Rating) || 600;
            const themes = row.Themes || '';
            const movesStr = row.Moves || '';
            
            // Log every 1000 rows for debugging
            if (loadedCount === 0 && puzzles.length === 0) {
              console.log('[PUZZLE RUSH] First row processed:', { fen, rating, movesStr });
            }
            
            if (fen && movesStr && rating < 1500) {
              // Parse moves from the CSV
              const moves = movesStr.split(' ').filter(m => m.trim()).slice(0, 3); // Take first 3 moves max
              
              if (moves.length > 0) {
                puzzles.push({
                  _id: `csv-${loadedCount}`,
                  fen: fen,
                  moves: moves,
                  rating: rating,
                  theme: themes.split(',')[0].trim() || 'tactics',
                  themes: themes
                });
                loadedCount++;
                
                if (loadedCount % 100 === 0) {
                  console.log(`[PUZZLE RUSH] Loaded ${loadedCount} puzzles so far...`);
                }
                
                // Debug: log first few puzzles
                if (loadedCount <= 3) {
                  console.log(`[PUZZLE RUSH] Sample puzzle ${loadedCount}:`, {
                    fen: fen,
                    moves: moves,
                    rating: rating,
                    theme: themes.split(',')[0].trim()
                  });
                }
              }
            }
          } catch (rowError) {
            console.error('[PUZZLE RUSH] Error processing row:', rowError);
            // Continue processing other rows
          }
        })
        .on('end', () => {
          if (!hasError) {
            easyPuzzles = puzzles;
            console.log(`[PUZZLE RUSH] CSV parsing complete! Loaded ${easyPuzzles.length} puzzles with rating < 1500`);
            if (puzzles.length > 0) {
              console.log('[PUZZLE RUSH] Sample puzzle:', puzzles[0]);
            }
            resolve();
          }
        })
        .on('error', (error) => {
          console.error('[PUZZLE RUSH] Error parsing CSV:', error);
          hasError = true;
          easyPuzzles = getFallbackPuzzles();
          resolve();
        });
      
    } catch (error) {
      console.error('[PUZZLE RUSH] Error setting up CSV parsing:', error);
      easyPuzzles = getFallbackPuzzles();
      resolve();
    }
  });
}

// Initialize puzzles on startup
let csvLoadingPromise = loadEasyPuzzlesFromCSV().catch(err => {
  console.error('[PUZZLE RUSH] Failed to load puzzles:', err);
  easyPuzzles = getFallbackPuzzles();
});

// Debug endpoint to check CSV loading
router.get('/debug', (req, res) => {
  res.json({
    csvLoaded: easyPuzzles.length > 0,
    puzzleCount: easyPuzzles.length,
    samplePuzzle: easyPuzzles.length > 0 ? easyPuzzles[0] : null,
    csvPath: path.join(__dirname, '../data/puzzles.csv'),
    csvExists: fs.existsSync(path.join(__dirname, '../data/puzzles.csv'))
  });
});

// Test endpoint without auth to check if server is working
router.get('/test', (req, res) => {
  res.json({
    message: 'Puzzle Rush server is working!',
    timestamp: new Date().toISOString(),
    easyPuzzlesCount: easyPuzzles.length
  });
});

// Manual CSV loading endpoint for testing
router.get('/load-csv', async (req, res) => {
  try {
    console.log('[PUZZLE RUSH] Manual CSV loading triggered');
    await loadEasyPuzzlesFromCSV();
    res.json({
      success: true,
      message: 'CSV loaded manually',
      puzzleCount: easyPuzzles.length,
      samplePuzzle: easyPuzzles.length > 0 ? easyPuzzles[0] : null
    });
  } catch (error) {
    console.error('[PUZZLE RUSH] Manual CSV loading failed:', error);
    res.json({
      success: false,
      message: 'CSV loading failed',
      error: error.message
    });
  }
});

// Temporary non-auth endpoint for testing
router.get('/puzzle-test', async (req, res) => {
  try {
    console.log(`[PUZZLE RUSH TEST] Request received, easyPuzzles count: ${easyPuzzles.length}`);
    
    let puzzle = null;
    
    // Always try to get a puzzle from loaded CSV puzzles first
    if (easyPuzzles && easyPuzzles.length > 0) {
      // Filter for very easy puzzles (rating 300-600) for puzzle rush
      const filteredPuzzles = easyPuzzles.filter(p => p.rating >= 300 && p.rating <= 600);
      
      if (filteredPuzzles.length > 0) {
        puzzle = filteredPuzzles[Math.floor(Math.random() * filteredPuzzles.length)];
        console.log(`[PUZZLE RUSH TEST] Found easy puzzle from CSV: ${puzzle.theme || 'unknown'} (rating: ${puzzle.rating})`);
      } else {
        console.log(`[PUZZLE RUSH TEST] No easy puzzles found in filtered range, trying broader range`);
        // Fallback to slightly harder puzzles if no easy ones found
        const broaderFilter = easyPuzzles.filter(p => p.rating >= 300 && p.rating <= 800);
        if (broaderFilter.length > 0) {
          puzzle = broaderFilter[Math.floor(Math.random() * broaderFilter.length)];
          console.log(`[PUZZLE RUSH TEST] Found puzzle from broader range: ${puzzle.theme || 'unknown'} (rating: ${puzzle.rating})`);
        }
      }
    } else {
      console.log(`[PUZZLE RUSH TEST] No CSV puzzles loaded yet`);
    }
    
    // If no puzzle from CSV, use fallback
    if (!puzzle) {
      console.log(`[PUZZLE RUSH TEST] Using fallback puzzle`);
      puzzle = getFallbackPuzzles()[0];
    }
    
    // Ensure puzzle has required fields
    if (!puzzle.fen || !puzzle.moves) {
      console.log(`[PUZZLE RUSH TEST] Invalid puzzle data, using fallback`);
      puzzle = getFallbackPuzzles()[0];
    }
    
    console.log(`[PUZZLE RUSH TEST] Returning puzzle:`, {
      id: puzzle._id,
      fen: puzzle.fen,
      moves: puzzle.moves,
      rating: puzzle.rating,
      theme: puzzle.theme
    });

    return res.json({
      id: String(puzzle._id),
      fen: puzzle.fen,
      difficulty: puzzle.rating || 900,
      theme: puzzle.theme || 'mixed',
      moves: Array.isArray(puzzle.moves) ? puzzle.moves : [puzzle.moves]
    });

  } catch (error) {
    console.error('[PUZZLE RUSH TEST] Error getting puzzle:', error);
    return res.status(200).json({
      // Always return a valid puzzle to avoid blank board
      id: 'error-fallback',
      fen: 'rnbqkb1r/pppp1ppp/5n2/4p3/2B1P3/8/PPPP1PPP/RNBQK1NR w KQkq - 0 1',
      difficulty: 900,
      theme: 'development',
      moves: ['Nf3']
    });
  }
});

// Get fallback puzzles
function getFallbackPuzzles() {
  return [
    {
      _id: 'fallback-1',
      fen: 'rnbqkb1r/pppp1ppp/5n2/4p3/2B1P3/8/PPPP1PPP/RNBQK1NR w KQkq - 0 1',
      moves: ['Nf3'],
      rating: 400,
      theme: 'development'
    },
    {
      _id: 'fallback-2',
      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      moves: ['e4'],
      rating: 300,
      theme: 'opening'
    },
    {
      _id: 'fallback-3',
      fen: 'rnbqkb1r/pppp1ppp/5n2/4p3/2B1P3/8/PPPP1PPP/RNBQK1NR w KQkq - 0 1',
      moves: ['Bc4'],
      rating: 450,
      theme: 'development'
    },
    {
      _id: 'fallback-4',
      fen: 'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2',
      moves: ['Nf3'],
      rating: 350,
      theme: 'opening'
    },
    {
      _id: 'fallback-5',
      fen: 'rnbqkb1r/pppp1ppp/5n2/4p3/2B1P3/8/PPPP1PPP/RNBQK1NR w KQkq - 0 1',
      moves: ['d4'],
      rating: 500,
      theme: 'development'
    }
  ];
}

// Get a puzzle for puzzle rush
router.get('/puzzle', auth, async (req, res) => {
  try {
    // Wait for CSV loading to complete
    await csvLoadingPromise;
    
    console.log(`[PUZZLE RUSH] Request received, easyPuzzles count: ${easyPuzzles.length}`);
    
    let puzzle = null;
    
    // Always try to get a puzzle from loaded CSV puzzles first
    if (easyPuzzles && easyPuzzles.length > 0) {
      // Filter for puzzles with rating < 1500 as requested
      const filteredPuzzles = easyPuzzles.filter(p => p.rating < 1500);
      
      if (filteredPuzzles.length > 0) {
        puzzle = filteredPuzzles[Math.floor(Math.random() * filteredPuzzles.length)];
        console.log(`[PUZZLE RUSH] Found puzzle from CSV: ${puzzle.theme || 'unknown'} (rating: ${puzzle.rating})`);
      } else {
        console.log(`[PUZZLE RUSH] No puzzles found with rating < 1500, using all available puzzles`);
        // Fallback to all available puzzles if none under 1500
        puzzle = easyPuzzles[Math.floor(Math.random() * easyPuzzles.length)];
        console.log(`[PUZZLE RUSH] Found puzzle from all available: ${puzzle.theme || 'unknown'} (rating: ${puzzle.rating})`);
      }
    } else {
      console.log(`[PUZZLE RUSH] No CSV puzzles loaded yet`);
    }
    
    // If no puzzle from CSV, use fallback
    if (!puzzle) {
      console.log(`[PUZZLE RUSH] Using fallback puzzle`);
      puzzle = getFallbackPuzzles()[0];
    }
    
    // Ensure puzzle has required fields
    if (!puzzle.fen || !puzzle.moves) {
      console.log(`[PUZZLE RUSH] Invalid puzzle data, using fallback`);
      puzzle = getFallbackPuzzles()[0];
    }
    
    console.log(`[PUZZLE RUSH] Returning puzzle:`, {
      id: puzzle._id,
      fen: puzzle.fen,
      moves: puzzle.moves,
      rating: puzzle.rating,
      theme: puzzle.theme
    });

    // Validate the puzzle with comprehensive checks
    try {
      const chess = new Chess(puzzle.fen);
      
      // Check if position is already finished
      if (chess.isCheckmate() || chess.isStalemate()) {
        console.log(`[PUZZLE RUSH] Invalid puzzle position (finished), using fallback`);
        puzzle = getFallbackPuzzles()[0];
      }
      
      // Check for impossible positions (kings adjacent)
      const board = chess.board();
      const kings = [];
      for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
          if (board[i][j] && board[i][j].type === 'k') {
            kings.push({ row: i, col: j, color: board[i][j].color });
          }
        }
      }
      
      if (kings.length === 2) {
        const [king1, king2] = kings;
        const rowDiff = Math.abs(king1.row - king2.row);
        const colDiff = Math.abs(king1.col - king2.col);
        
        if (rowDiff <= 1 && colDiff <= 1) {
          console.log(`[PUZZLE RUSH] Invalid puzzle position (kings adjacent), using fallback`);
          puzzle = getFallbackPuzzles()[0];
        }
      }
      
      // Check if first move is legal
      if (puzzle.moves && puzzle.moves.length > 0) {
        const firstMove = puzzle.moves[0];
        const moveResult = chess.move(firstMove, { sloppy: true });
        if (!moveResult) {
          console.log(`[PUZZLE RUSH] Invalid first move, using fallback`);
          puzzle = getFallbackPuzzles()[0];
        } else {
          // Check for impossible positions after the first move too
          const boardAfterMove = chess.board();
          const kingsAfterMove = [];
          for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
              if (boardAfterMove[i][j] && boardAfterMove[i][j].type === 'k') {
                kingsAfterMove.push({ row: i, col: j, color: boardAfterMove[i][j].color });
              }
            }
          }
          
          if (kingsAfterMove.length === 2) {
            const [king1, king2] = kingsAfterMove;
            const rowDiff = Math.abs(king1.row - king2.row);
            const colDiff = Math.abs(king1.col - king2.col);
            
            if (rowDiff <= 1 && colDiff <= 1) {
              console.log(`[PUZZLE RUSH] Invalid puzzle position after first move (kings adjacent), using fallback`);
              puzzle = getFallbackPuzzles()[0];
            }
          }
        }
      }
      
    } catch (fenError) {
      console.log(`[PUZZLE RUSH] Invalid FEN, using fallback:`, fenError.message);
      puzzle = getFallbackPuzzles()[0];
    }

    return res.json({
      id: String(puzzle._id),
      fen: puzzle.fen,
      difficulty: puzzle.rating || 900,
      theme: puzzle.theme || 'mixed',
      moves: Array.isArray(puzzle.moves) ? puzzle.moves : [puzzle.moves]
    });

  } catch (error) {
    console.error('[PUZZLE RUSH] Error getting puzzle:', error);
    return res.status(200).json({
      // Always return a valid puzzle to avoid blank board
      id: 'error-fallback',
      fen: 'rnbqkb1r/pppp1ppp/5n2/4p3/2B1P3/8/PPPP1PPP/RNBQK1NR w KQkq - 0 1',
      difficulty: 900,
      theme: 'development',
      moves: ['Nf3']
    });
  }
});

// Non-auth endpoint for puzzle rush (for testing)
router.get('/puzzle-no-auth', async (req, res) => {
  try {
    // Wait for CSV loading to complete
    await csvLoadingPromise;
    
    console.log(`[PUZZLE RUSH NO-AUTH] Request received, easyPuzzles count: ${easyPuzzles.length}`);
    
    let puzzle = null;
    
    // Always try to get a puzzle from loaded CSV puzzles first
    if (easyPuzzles && easyPuzzles.length > 0) {
      // Filter for puzzles with rating < 1500 as requested
      const filteredPuzzles = easyPuzzles.filter(p => p.rating < 1500);
      
      if (filteredPuzzles.length > 0) {
        puzzle = filteredPuzzles[Math.floor(Math.random() * filteredPuzzles.length)];
        console.log(`[PUZZLE RUSH NO-AUTH] Found puzzle from CSV: ${puzzle.theme || 'unknown'} (rating: ${puzzle.rating})`);
      } else {
        console.log(`[PUZZLE RUSH NO-AUTH] No puzzles found with rating < 1500, using all available puzzles`);
        // Fallback to all available puzzles if none under 1500
        puzzle = easyPuzzles[Math.floor(Math.random() * easyPuzzles.length)];
        console.log(`[PUZZLE RUSH NO-AUTH] Found puzzle from all available: ${puzzle.theme || 'unknown'} (rating: ${puzzle.rating})`);
      }
    } else {
      console.log(`[PUZZLE RUSH NO-AUTH] No CSV puzzles loaded yet`);
    }
    
    // If no puzzle from CSV, use fallback
    if (!puzzle) {
      console.log(`[PUZZLE RUSH NO-AUTH] Using fallback puzzle`);
      puzzle = getFallbackPuzzles()[0];
    }
    
    // Ensure puzzle has required fields
    if (!puzzle.fen || !puzzle.moves) {
      console.log(`[PUZZLE RUSH NO-AUTH] Invalid puzzle data, using fallback`);
      puzzle = getFallbackPuzzles()[0];
    }
    
    console.log(`[PUZZLE RUSH NO-AUTH] Returning puzzle:`, {
      id: puzzle._id,
      fen: puzzle.fen,
      moves: puzzle.moves,
      rating: puzzle.rating,
      theme: puzzle.theme
    });

    // Validate the puzzle with comprehensive checks
    try {
      const chess = new Chess(puzzle.fen);
      
      // Check if position is already finished
      if (chess.isCheckmate() || chess.isStalemate()) {
        console.log(`[PUZZLE RUSH NO-AUTH] Invalid puzzle position (finished), using fallback`);
        puzzle = getFallbackPuzzles()[0];
      }
      
      // Check for impossible positions (kings adjacent)
      const board = chess.board();
      const kings = [];
      for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
          if (board[i][j] && board[i][j].type === 'k') {
            kings.push({ row: i, col: j, color: board[i][j].color });
          }
        }
      }
      
      if (kings.length === 2) {
        const [king1, king2] = kings;
        const rowDiff = Math.abs(king1.row - king2.row);
        const colDiff = Math.abs(king1.col - king2.col);
        
        if (rowDiff <= 1 && colDiff <= 1) {
          console.log(`[PUZZLE RUSH NO-AUTH] Invalid puzzle position (kings adjacent), using fallback`);
          puzzle = getFallbackPuzzles()[0];
        }
      }
      
      // Check if first move is legal
      if (puzzle.moves && puzzle.moves.length > 0) {
        const firstMove = puzzle.moves[0];
        const moveResult = chess.move(firstMove, { sloppy: true });
        if (!moveResult) {
          console.log(`[PUZZLE RUSH NO-AUTH] Invalid first move, using fallback`);
          puzzle = getFallbackPuzzles()[0];
        } else {
          // Check for impossible positions after the first move too
          const boardAfterMove = chess.board();
          const kingsAfterMove = [];
          for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
              if (boardAfterMove[i][j] && boardAfterMove[i][j].type === 'k') {
                kingsAfterMove.push({ row: i, col: j, color: boardAfterMove[i][j].color });
              }
            }
          }
          
          if (kingsAfterMove.length === 2) {
            const [king1, king2] = kingsAfterMove;
            const rowDiff = Math.abs(king1.row - king2.row);
            const colDiff = Math.abs(king1.col - king2.col);
            
            if (rowDiff <= 1 && colDiff <= 1) {
              console.log(`[PUZZLE RUSH NO-AUTH] Invalid puzzle position after first move (kings adjacent), using fallback`);
              puzzle = getFallbackPuzzles()[0];
            }
          }
        }
      }
      
    } catch (fenError) {
      console.log(`[PUZZLE RUSH NO-AUTH] Invalid FEN, using fallback:`, fenError.message);
      puzzle = getFallbackPuzzles()[0];
    }

    return res.json({
      id: String(puzzle._id),
      fen: puzzle.fen,
      difficulty: puzzle.rating || 900,
      theme: puzzle.theme || 'mixed',
      moves: Array.isArray(puzzle.moves) ? puzzle.moves : [puzzle.moves]
    });

  } catch (error) {
    console.error('[PUZZLE RUSH NO-AUTH] Error getting puzzle:', error);
    return res.status(200).json({
      // Always return a valid puzzle to avoid blank board
      id: 'error-fallback',
      fen: 'rnbqkb1r/pppp1ppp/5n2/4p3/2B1P3/8/PPPP1PPP/RNBQK1NR w KQkq - 0 1',
      difficulty: 900,
      theme: 'development',
      moves: ['Nf3']
    });
  }
});

// Validate a move in puzzle rush
router.post('/validate', auth, async (req, res) => {
  try {
    const { puzzleId, move } = req.body;
    
    if (!puzzleId || !move) {
      return res.status(400).json({ 
        success: false, 
        message: 'Puzzle ID and move are required' 
      });
    }
    
    let isCorrect = false;
    
    try {
      // Try to get puzzle from database
      const puzzle = await Puzzle.findById(puzzleId).lean();
      if (puzzle && Array.isArray(puzzle.moves)) {
        isCorrect = puzzle.moves.includes(move);
        console.log(`[PUZZLE RUSH] Move validation: ${move} is ${isCorrect ? 'correct' : 'incorrect'}`);
      }
    } catch (dbError) {
      console.log(`[PUZZLE RUSH] Could not validate move from DB:`, dbError.message);
    }
    
    res.json({ 
      success: true, 
      correct: isCorrect, 
      message: isCorrect ? 'Correct!' : 'Incorrect. Try again!' 
    });
    
  } catch (error) {
    console.error('[PUZZLE RUSH] Error validating move:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Save puzzle rush result and update leaderboard
router.post('/result', auth, async (req, res) => {
  try {
    const { puzzlesSolved, timeUsed, mode, score } = req.body;
    const userId = req.user.id;
    
    // Find user and update puzzle rush stats
    const User = require('../models/User');
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    // Initialize puzzle rush stats if not exists
    if (!user.stats.puzzleRushStats) {
      user.stats.puzzleRushStats = {
        bestScore: 0,
        totalGames: 0,
        totalPuzzlesSolved: 0,
        bestTime: 0,
        averageScore: 0
      };
    }
    
    // Update stats
    user.stats.puzzleRushStats.totalGames += 1;
    user.stats.puzzleRushStats.totalPuzzlesSolved += puzzlesSolved || 0;
    
    if (score > user.stats.puzzleRushStats.bestScore) {
      user.stats.puzzleRushStats.bestScore = score;
    }
    
    // Calculate average score
    const totalScore = (user.stats.puzzleRushStats.averageScore * (user.stats.puzzleRushStats.totalGames - 1)) + score;
    user.stats.puzzleRushStats.averageScore = Math.round(totalScore / user.stats.puzzleRushStats.totalGames);
    
    // Update rating based on performance
    const ratingChange = Math.max(-50, Math.min(50, (puzzlesSolved - 10) * 5));
    user.rating = Math.max(100, user.rating + ratingChange);
    
    await user.save();
    
    res.json({ 
      success: true, 
      message: 'Result saved successfully',
      newRating: user.rating,
      ratingChange: ratingChange,
      stats: user.stats.puzzleRushStats
    });
    
  } catch (error) {
    console.error('[PUZZLE RUSH] Error saving result:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Get puzzle rush leaderboard
router.get('/leaderboard', auth, async (req, res) => {
  try {
    const { mode = '3min' } = req.query;
    
    // Get users with best puzzle rush scores
    const User = require('../models/User');
    const leaderboard = await User.find({
      'stats.puzzleRushStats.bestScore': { $gt: 0 }
    })
    .select('username stats.puzzleRushStats.bestScore')
    .sort({ 'stats.puzzleRushStats.bestScore': -1 })
    .limit(10)
    .lean();

    const formattedLeaderboard = leaderboard.map(user => ({
      username: user.username,
      score: user.stats?.puzzleRushStats?.bestScore || 0,
      mode: mode
    }));

    res.json({ success: true, leaderboard: formattedLeaderboard });
  } catch (error) {
    console.error('[PUZZLE RUSH] Error getting leaderboard:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router;

