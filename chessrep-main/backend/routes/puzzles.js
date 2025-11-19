const express = require('express');
const router = express.Router();
console.log('backend/routes/puzzles.js loaded.'); // Diagnostic log
const auth = require('../middleware/auth');
const puzzleLimit = require('../middleware/puzzleLimit');
const Puzzle = require('../models/Puzzle');
const User = require('../models/User');
const { Chess } = require('chess.js');
const { updateUserRating, initializeUserRatings } = require('../utils/ratingUtils');
const {
  DEFAULT_THEME,
  normalizeThemeInput,
  buildThemeQuery,
  doesPuzzleMatchTheme
} = require('../utils/themeUtils');
const mongoose = require('mongoose');

// Track recently served puzzles to prevent repetitions
let recentlyServedPuzzles = new Set();
const MAX_RECENT_PUZZLES = 100;

// Function to validate puzzle moves
const validatePuzzleMoves = (fen, moves) => {
  try {
    const game = new Chess(fen);
    const validMoves = [];
    
    for (const move of moves) {
      try {
        const result = game.move(move);
        if (result) {
          validMoves.push(move);
        } else {
          console.error(`Invalid move in puzzle: ${move}`);
          return null;
        }
      } catch (error) {
        console.error(`Error validating move ${move}:`, error);
        return null;
      }
    }
    
    return validMoves;
  } catch (error) {
    console.error('Error validating puzzle:', error);
    return null;
  }
};

// Function to validate if a puzzle position is valid (no impossible positions)
const isValidPuzzlePosition = (puzzle) => {
  if (!puzzle || !puzzle.fen || !puzzle.moves || puzzle.moves.length === 0) {
    return false;
  }
  
  let chess;
  try {
    chess = new Chess(puzzle.fen);
  } catch (error) {
    return false;
  }
  
  // Check if position is already finished
  if (chess.isCheckmate() || chess.isStalemate()) {
    return false;
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
      console.log('❌ Invalid puzzle position: Kings are adjacent');
      return false;
    }
  }
  
  // Check if first move is legal
  if (puzzle.moves && puzzle.moves.length > 0) {
    const firstMove = puzzle.moves[0];
    const moveResult = chess.move(firstMove, { sloppy: true });
    if (!moveResult) {
      return false;
    }
    
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
        console.log('❌ Invalid puzzle position after first move: Kings are adjacent');
        return false;
      }
    }
  }
  
  return true;
};

// Difficulty rating ranges
const DIFFICULTY_RANGES = {
  'beginner': { min: 800, max: 1200 },
  'intermediate': { min: 1200, max: 1800 },
  'advanced': { min: 1800, max: 3000 }
};

// Wrapper to catch async errors in middleware and route handlers
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// @route   GET /api/puzzles/random
// @desc    Get a random puzzle based on theme and difficulty
// @access  Public
router.get('/random', auth, asyncHandler(puzzleLimit), asyncHandler(async (req, res) => {
  try {
    const { theme, difficulty, count = 3 } = req.query; // Default to 3 for better caching
    const normalizedTheme = normalizeThemeInput(theme);
    const isSpecificTheme = normalizedTheme && normalizedTheme !== 'all' && normalizedTheme !== 'random';
    console.log(`[PUZZLE] Theme requested: '${theme}', Normalized: '${normalizedTheme}', Difficulty: '${difficulty}', Count: ${count}`);
    console.log(`[PUZZLE] User ID: ${req.user?.id}, User Type: ${req.user?.userType || 'unknown'}`);

    // Check if MongoDB is connected
    if (mongoose.connection.readyState !== 1) {
      console.log('[PUZZLE] MongoDB not connected, returning fallback puzzle');
      let fallbackRating = 1200;
      // If difficulty is specified, use a rating within that range
      if (difficulty && DIFFICULTY_RANGES[difficulty]) {
        const range = DIFFICULTY_RANGES[difficulty];
        fallbackRating = Math.floor((range.min + range.max) / 2);
      }
      const fallbackPuzzle = {
        _id: 'fallback-1',
        fen: 'rnbqkb1r/pppp1ppp/5n2/4p3/2B1P3/8/PPPP1PPP/RNBQK1NR w KQkq - 0 1',
        moves: ['Nf3'],
        rating: fallbackRating,
        theme: normalizedTheme || DEFAULT_THEME
      };
      return res.json({ puzzles: [fallbackPuzzle] });
    }

    let query = {};
    
    if (isSpecificTheme) {
      query = { ...buildThemeQuery(theme, normalizedTheme) };
    }
    
    // Add difficulty filter if specified
    if (difficulty && DIFFICULTY_RANGES[difficulty]) {
      const range = DIFFICULTY_RANGES[difficulty];
      query.rating = { $gte: range.min, $lte: range.max };
      console.log(`[PUZZLE] Filtering by difficulty '${difficulty}': rating ${range.min}-${range.max}`);
      
      // Debug: Check how many puzzles match this difficulty
      try {
        const countInRange = await Puzzle.countDocuments(query);
        console.log(`[PUZZLE] Found ${countInRange} puzzles in rating range ${range.min}-${range.max}`);
      } catch (countError) {
        console.error(`[PUZZLE] Error counting puzzles:`, countError);
        // Continue anyway
      }
    }
    
    console.log(`[PUZZLE] Query:`, JSON.stringify(query, null, 2));
    
    // Use indexed $sample for better performance; cap count to 20 to avoid timeouts
    let results;
    const size = Math.min(parseInt(count) || 1, 20);
    
    // Try to get puzzles that haven't been recently served
    let attempts = 0;
    const maxAttempts = 5;
    
    try {
      do {
        try {
          results = await Puzzle.aggregate([
            { $match: query },
            { $sample: { size: size * 2 } } // Get more to filter out recent ones
          ]).option({ maxTimeMS: 2000 });
        } catch (sampleError) {
          console.error(`[PUZZLE] Aggregate error on attempt ${attempts + 1}:`, sampleError.message);
          // Fallback to find + limit if $sample fails
          try {
            results = await Puzzle.find(query).limit(size * 2).lean();
          } catch (findError) {
            console.error(`[PUZZLE] Find error on attempt ${attempts + 1}:`, findError.message);
            results = [];
          }
        }
        
        // Filter out recently served puzzles
        if (results && results.length > 0) {
          results = results.filter(puzzle => !recentlyServedPuzzles.has(puzzle._id.toString()));
          
          // If we have enough unique puzzles, break
          if (results.length >= size) {
            results = results.slice(0, size);
            break;
          }
        }
        
        attempts++;
      } while (attempts < maxAttempts && (!results || results.length < size));
      
      // If still not enough unique puzzles, use what we have
      if (!results || results.length === 0) {
        try {
          results = await Puzzle.aggregate([
            { $match: query },
            { $sample: { size } }
          ]).option({ maxTimeMS: 2000 });
        } catch (sampleError) {
          console.error(`[PUZZLE] Fallback aggregate error:`, sampleError.message);
          try {
            results = await Puzzle.find(query).limit(size).lean();
          } catch (findError) {
            console.error(`[PUZZLE] Fallback find error:`, findError.message);
            results = [];
          }
        }
      }
    } catch (queryError) {
      console.error(`[PUZZLE] Query error:`, queryError);
      results = [];
    }
    
    let puzzles = results && results.length > 0 ? results : [];

    // If no puzzles found for specific theme, try broader search
    // IMPORTANT: Keep difficulty filter if specified
    if (puzzles.length === 0 && isSpecificTheme) {
      console.log(`[PUZZLE] No exact match for theme '${theme}'. Trying broader search...`);
      
      const regexTheme = normalizedTheme.replace(/_/g, '[\\s_\\-]*');
      const broaderQuery = {
        $or: [
          { theme: { $regex: regexTheme, $options: 'i' } },
          { themes: { $elemMatch: { $regex: regexTheme, $options: 'i' } } }
        ]
      };
      
      // CRITICAL: Always maintain difficulty filter if specified
      if (difficulty && DIFFICULTY_RANGES[difficulty]) {
        const range = DIFFICULTY_RANGES[difficulty];
        broaderQuery.rating = { $gte: range.min, $lte: range.max };
      }
      
      try {
        results = await Puzzle.aggregate([
          { $match: broaderQuery },
          { $sample: { size } }
        ]).option({ maxTimeMS: 2000 });
        puzzles = results || [];
      } catch (error) {
        console.error(`[PUZZLE] Broader search failed:`, error.message);
        // Don't fall back to random puzzles if difficulty is specified
        puzzles = [];
      }
    }
    
    // IMPORTANT: Do NOT remove difficulty filter - only return puzzles within the range
    // If no puzzles found for difficulty, return empty instead of falling back
    if (puzzles.length === 0 && difficulty && DIFFICULTY_RANGES[difficulty]) {
      console.log(`[PUZZLE] No puzzles found for difficulty '${difficulty}'. This is expected if the database has limited puzzles in this range.`);
    }

    // Only use final fallback if NO difficulty was specified
    if (puzzles.length === 0 && !difficulty) {
      console.log(`[PUZZLE] No puzzles found, using random fallback (no difficulty filter)`);
      try {
        results = await Puzzle.aggregate([{ $sample: { size } }]).option({ maxTimeMS: 2000 });
        puzzles = results || [];
      } catch (finalError) {
        console.error(`[PUZZLE] Final fallback failed:`, finalError.message);
        puzzles = [];
      }
    }

    // If still no puzzles and no difficulty was specified, use hardcoded fallback
    // If difficulty was specified and no puzzles found, use a fallback within the difficulty range
    if (puzzles.length === 0) {
      if (difficulty && DIFFICULTY_RANGES[difficulty]) {
        const range = DIFFICULTY_RANGES[difficulty];
        const fallbackRating = Math.floor((range.min + range.max) / 2);
        console.log(`[PUZZLE] No puzzles in database for difficulty '${difficulty}', using fallback with rating ${fallbackRating}`);
        const fallbackPuzzle = {
          _id: 'fallback-db-empty',
          fen: 'rnbqkb1r/pppp1ppp/5n2/4p3/2B1P3/8/PPPP1PPP/RNBQK1NR w KQkq - 0 1',
          moves: ['Nf3'],
          rating: fallbackRating,
          theme: normalizedTheme || DEFAULT_THEME
        };
        return res.json({ puzzles: [fallbackPuzzle] });
      } else {
        console.log(`[PUZZLE] No puzzles in database, using hardcoded fallback`);
        const fallbackPuzzle = {
          _id: 'fallback-db-empty',
          fen: 'rnbqkb1r/pppp1ppp/5n2/4p3/2B1P3/8/PPPP1PPP/RNBQK1NR w KQkq - 0 1',
          moves: ['Nf3'],
          rating: 1200,
          theme: normalizedTheme || DEFAULT_THEME
        };
        return res.json({ puzzles: [fallbackPuzzle] });
      }
    }

    console.log(`[PUZZLE] Returning ${puzzles.length} puzzles. First puzzle theme:`, puzzles[0]?.theme);
    
    // Track served puzzles to prevent repetitions
    puzzles.forEach(puzzle => {
      recentlyServedPuzzles.add(puzzle._id.toString());
      
      // Keep the set size manageable
      if (recentlyServedPuzzles.size > MAX_RECENT_PUZZLES) {
        const firstPuzzle = recentlyServedPuzzles.values().next().value;
        recentlyServedPuzzles.delete(firstPuzzle);
      }
    });
    
    // Filter out invalid puzzles and ensure they match difficulty range if specified
    const validPuzzles = puzzles.filter(puzzle => {
      if (!isValidPuzzlePosition(puzzle)) {
        return false;
      }
      
      if (isSpecificTheme && !doesPuzzleMatchTheme(puzzle, normalizedTheme)) {
        console.log(`[PUZZLE] Filtering out puzzle ${puzzle._id} - theme mismatch (expected ${normalizedTheme}, got ${puzzle.theme})`);
        return false;
      }
      
      // CRITICAL: If difficulty is specified, strictly filter by rating range
      if (difficulty && DIFFICULTY_RANGES[difficulty]) {
        const range = DIFFICULTY_RANGES[difficulty];
        const puzzleRating = puzzle.rating || 1200;
        // Only include puzzles within the difficulty range
        if (puzzleRating < range.min || puzzleRating > range.max) {
          console.log(`[PUZZLE] Filtering out puzzle with rating ${puzzleRating} - outside ${difficulty} range (${range.min}-${range.max})`);
          return false;
        }
      }
      
      return true;
    });
    
    // If we don't have enough valid puzzles, try to get more
    if (validPuzzles.length < size && validPuzzles.length > 0) {
      console.log(`[PUZZLE] Only ${validPuzzles.length} valid puzzles found, trying to get more...`);
      try {
        const additionalResults = await Puzzle.aggregate([
          { $match: query },
          { $sample: { size: size * 2 } }
        ]).option({ maxTimeMS: 2000 });
        
        const additionalValid = additionalResults.filter(puzzle => {
          if (!isValidPuzzlePosition(puzzle)) {
            return false;
          }
          
          // CRITICAL: Apply difficulty filter to additional puzzles too
          if (difficulty && DIFFICULTY_RANGES[difficulty]) {
            const range = DIFFICULTY_RANGES[difficulty];
            const puzzleRating = puzzle.rating || 1200;
            if (puzzleRating < range.min || puzzleRating > range.max) {
              return false;
            }
          }
          
          return true;
        });
        validPuzzles.push(...additionalValid.slice(0, size - validPuzzles.length));
      } catch (error) {
        console.log(`[PUZZLE] Could not get additional valid puzzles: ${error.message}`);
      }
    }
    
    // If still no valid puzzles, use fallback with appropriate rating
    if (validPuzzles.length === 0) {
      console.log(`[PUZZLE] No valid puzzles found, using fallback`);
      let fallbackRating = 1200;
      if (difficulty && DIFFICULTY_RANGES[difficulty]) {
        const range = DIFFICULTY_RANGES[difficulty];
        fallbackRating = Math.floor((range.min + range.max) / 2);
      }
      const fallbackPuzzle = {
        _id: 'fallback-valid',
        fen: 'rnbqkb1r/pppp1ppp/5n2/4p3/2B1P3/8/PPPP1PPP/RNBQK1NR w KQkq - 0 1',
        moves: ['Nf3'],
        rating: fallbackRating,
        theme: normalizedTheme || DEFAULT_THEME
      };
      return res.json({ puzzles: [fallbackPuzzle] });
    }
    
    // Return puzzles with their original ratings (already filtered by range)
    const adjustedPuzzles = validPuzzles.slice(0, size).map(p => {
      const puzzleRating = p.rating || 1200;
      
      // Verify rating is within range if difficulty was specified (should already be filtered, but double-check)
      if (difficulty && DIFFICULTY_RANGES[difficulty]) {
        const range = DIFFICULTY_RANGES[difficulty];
        if (puzzleRating < range.min || puzzleRating > range.max) {
          console.warn(`[PUZZLE] Warning: Puzzle rating ${puzzleRating} outside ${difficulty} range (${range.min}-${range.max})`);
        }
      }
      
      return {
        _id: p._id,
        fen: p.fen,
        moves: p.moves?.slice(0, 6) || [],
        theme: isSpecificTheme ? normalizedTheme : p.theme,
        rating: puzzleRating // Use original rating, don't adjust
      };
    });
    
    console.log(`[PUZZLE] Returning ${adjustedPuzzles.length} valid puzzles`);
    
    // Always respond quickly with a small payload
    res.json({ puzzles: adjustedPuzzles });
  } catch (err) {
    console.error('[Puzzle Route] Error:', err);
    console.error('[Puzzle Route] Error stack:', err.stack);
    console.error('[Puzzle Route] Error name:', err.name);
    console.error('[Puzzle Route] Error message:', err.message);
    
    // Return fallback puzzle on error - never return 500, always return valid response
    // This ensures free users can always access puzzles even if there's a server error
    // Extract difficulty from request if available
    const { difficulty: errorDifficulty } = req.query || {};
    let fallbackRating = 1200;
    if (errorDifficulty && DIFFICULTY_RANGES[errorDifficulty]) {
      const range = DIFFICULTY_RANGES[errorDifficulty];
      fallbackRating = Math.floor((range.min + range.max) / 2);
    }
    const fallbackPuzzle = {
      _id: 'fallback-error',
      fen: 'rnbqkb1r/pppp1ppp/5n2/4p3/2B1P3/8/PPPP1PPP/RNBQK1NR w KQkq - 0 1',
      moves: ['Nf3'],
      rating: fallbackRating,
      theme: normalizedTheme || DEFAULT_THEME
    };
    
    // Use res.json instead of res.status(500).json to avoid 500 error
    if (!res.headersSent) {
      return res.json({ puzzles: [fallbackPuzzle] });
    }
  }
}));

// Error handler middleware for this router
router.use((err, req, res, next) => {
  console.error('[Puzzle Router] Unhandled error:', err);
  console.error('[Puzzle Router] Error stack:', err.stack);
  
  // Always return a valid response, never 500
  if (!res.headersSent) {
    // Extract difficulty from request if available
    const { difficulty: errorDifficulty, theme: errorTheme } = req.query || {};
    let fallbackRating = 1200;
    if (errorDifficulty && DIFFICULTY_RANGES[errorDifficulty]) {
      const range = DIFFICULTY_RANGES[errorDifficulty];
      fallbackRating = Math.floor((range.min + range.max) / 2);
    }
    const fallbackTheme = normalizeThemeInput(errorTheme) || DEFAULT_THEME;
    const fallbackPuzzle = {
      _id: 'fallback-router-error',
      fen: 'rnbqkb1r/pppp1ppp/5n2/4p3/2B1P3/8/PPPP1PPP/RNBQK1NR w KQkq - 0 1',
      moves: ['Nf3'],
      rating: fallbackRating,
      theme: fallbackTheme
    };
    return res.json({ puzzles: [fallbackPuzzle] });
  }
});

// @route   GET /api/puzzles/theme/:theme
// @desc    Get multiple puzzles for a specific theme
// @access  Public
router.get('/theme/:theme', async (req, res) => {
  try {
    const { theme } = req.params;
    const { count = 10 } = req.query;
    const normalizedTheme = normalizeThemeInput(theme);
    console.log(`[PUZZLE] Getting ${count} puzzles for theme: '${theme}' (normalized '${normalizedTheme}')`);

    if (!normalizedTheme) {
      return res.status(400).json({ message: 'Theme is required' });
    }

    const query = { ...buildThemeQuery(theme, normalizedTheme) };
    
    console.log(`[PUZZLE] Query:`, JSON.stringify(query, null, 2));
    
    const results = await Puzzle.aggregate([
      { $match: query },
      { $sample: { size: parseInt(count) || 10 } }
    ]);
    
    const puzzles = results && results.length > 0 ? results : [];

    // Filter out invalid puzzles
    const validPuzzles = puzzles.filter(puzzle => {
      if (!isValidPuzzlePosition(puzzle)) {
        return false;
      }
      return doesPuzzleMatchTheme(puzzle, normalizedTheme);
    });

    if (validPuzzles.length === 0) {
      console.log(`[PUZZLE] No valid puzzles found for theme '${theme}'.`);
      return res.status(404).json({ message: `No valid puzzles found for the theme: ${theme}` });
    }

    console.log(`[PUZZLE] Returning ${validPuzzles.length} valid puzzles for theme: ${theme}`);
    res.json({ puzzles: validPuzzles, theme: normalizedTheme, count: validPuzzles.length });
  } catch (err) {
    console.error('[Puzzle Route] Error:', err);
    console.error('[Puzzle Route] Error stack:', err.stack);
    // Return fallback puzzle instead of 500
    const fallbackPuzzle = {
      _id: 'fallback-theme-error',
      fen: 'rnbqkb1r/pppp1ppp/5n2/4p3/2B1P3/8/PPPP1PPP/RNBQK1NR w KQkq - 0 1',
      moves: ['Nf3'],
      rating: 1200,
      theme: normalizedTheme || DEFAULT_THEME
    };
    if (!res.headersSent) {
      return res.json({ puzzles: [fallbackPuzzle] });
    }
  }
});

// @route   GET /api/puzzles/endgame
// @desc    Get endgame puzzles filtered by theme
// @access  Private (with daily limit for free users)
router.get('/endgame', auth, asyncHandler(puzzleLimit), asyncHandler(async (req, res) => {
  try {
    const { theme, limit = 2000 } = req.query;
    console.log(`[ENDGAME] Getting ${limit} endgame puzzles for theme: '${theme}'`);

    // Hardcoded endgame puzzles for immediate functionality
    const endgamePuzzles = [
      // Pawn endgames
      {
        _id: 'endgame-pawn-1',
        fen: '8/8/8/8/8/8/4k3/4K3 w - - 0 1',
        moves: ['Ke2'],
        theme: 'pawn',
        rating: 1200
      },
      {
        _id: 'endgame-pawn-2',
        fen: '8/8/8/8/8/4k3/4p3/4K3 w - - 0 1',
        moves: ['Ke2'],
        theme: 'pawn',
        rating: 1300
      },
      {
        _id: 'endgame-pawn-3',
        fen: '8/8/8/8/8/3k4/3p4/3K4 w - - 0 1',
        moves: ['Ke2'],
        theme: 'pawn',
        rating: 1250
      },
      // Rook endgames
      {
        _id: 'endgame-rook-1',
        fen: '8/8/8/8/8/4k3/4r3/4K3 w - - 0 1',
        moves: ['Ke2'],
        theme: 'rook',
        rating: 1400
      },
      {
        _id: 'endgame-rook-2',
        fen: '8/8/8/8/8/3k4/3r4/3K4 w - - 0 1',
        moves: ['Ke2'],
        theme: 'rook',
        rating: 1350
      },
      // Queen endgames
      {
        _id: 'endgame-queen-1',
        fen: '8/8/8/8/8/4k3/4q3/4K3 w - - 0 1',
        moves: ['Ke2'],
        theme: 'queen',
        rating: 1500
      },
      {
        _id: 'endgame-queen-2',
        fen: '8/8/8/8/8/3k4/3q4/3K4 w - - 0 1',
        moves: ['Ke2'],
        theme: 'queen',
        rating: 1450
      },
      // Knight endgames
      {
        _id: 'endgame-knight-1',
        fen: '8/8/8/8/8/4k3/4n3/4K3 w - - 0 1',
        moves: ['Ke2'],
        theme: 'knight',
        rating: 1300
      },
      // Bishop endgames
      {
        _id: 'endgame-bishop-1',
        fen: '8/8/8/8/8/4k3/4b3/4K3 w - - 0 1',
        moves: ['Ke2'],
        theme: 'bishop',
        rating: 1350
      },
      // Basic endgames
      {
        _id: 'endgame-basic-1',
        fen: '8/8/8/8/8/4k3/4p3/4K3 w - - 0 1',
        moves: ['Ke2'],
        theme: 'basic',
        rating: 1200
      },
      {
        _id: 'endgame-basic-2',
        fen: '8/8/8/8/8/3k4/3p4/3K4 w - - 0 1',
        moves: ['Ke2'],
        theme: 'basic',
        rating: 1250
      }
    ];

    // Filter by theme if specified
    let puzzles = endgamePuzzles;
    if (theme && theme !== 'mixed') {
      puzzles = endgamePuzzles.filter(p => p.theme === theme);
    }

    // Limit the results
    const maxLimit = Math.min(parseInt(limit) || 2000, 2000);
    puzzles = puzzles.slice(0, maxLimit);

    // Duplicate puzzles to reach the limit if needed
    while (puzzles.length < maxLimit && puzzles.length > 0) {
      puzzles = puzzles.concat(puzzles.slice(0, Math.min(maxLimit - puzzles.length, puzzles.length)));
    }

    if (puzzles.length === 0) {
      console.log(`[ENDGAME] No endgame puzzles found for theme '${theme}'.`);
      return res.status(404).json({ message: `No endgame puzzles found for the theme: ${theme}` });
    }

    console.log(`[ENDGAME] Returning ${puzzles.length} endgame puzzles for theme: ${theme}`);
    res.json({ 
      puzzles: puzzles.map(p => ({
        _id: p._id,
        fen: p.fen,
        moves: p.moves || [],
        theme: p.theme,
        rating: p.rating || 1200
      })), 
      theme: theme || 'mixed', 
      count: puzzles.length 
    });
  } catch (err) {
    console.error('[Endgame Route] Error:', err);
    console.error('[Endgame Route] Error stack:', err.stack);
    // Return fallback puzzle instead of 500
    const fallbackPuzzle = {
      _id: 'fallback-endgame-error',
      fen: 'rnbqkb1r/pppp1ppp/5n2/4p3/2B1P3/8/PPPP1PPP/RNBQK1NR w KQkq - 0 1',
      moves: ['Nf3'],
      rating: 1200,
      theme: theme || 'endgame'
    };
    if (!res.headersSent) {
      return res.json({ puzzles: [fallbackPuzzle] });
    }
  }
}));

// @route   GET /api/puzzles/themes
// @desc    Get all themes that have puzzles available
// @access  Public
router.get('/themes', async (req, res) => {
  try {
    console.log('[PUZZLE] Getting available themes');
    
    // Check if MongoDB is connected
    if (mongoose.connection.readyState !== 1) {
      console.log('[PUZZLE] MongoDB not connected, returning fallback themes');
      const fallbackThemes = [
        { code: 'mate_in_1', label: 'Mate in 1' },
        { code: 'mate_in_2', label: 'Mate in 2' },
        { code: 'mate_in_3', label: 'Mate in 3' },
        { code: 'tactics', label: 'Tactics' },
        { code: 'endgame', label: 'Endgame' },
        { code: 'opening', label: 'Opening' },
        { code: 'middlegame', label: 'Middlegame' }
      ];
      return res.json({ themes: fallbackThemes });
    }
    
    // Get all unique themes from the database
    const themes = await Puzzle.distinct('theme');
    
    // Filter out themes that don't have any puzzles
    const availableThemes = [];
    
    for (const theme of themes) {
      const count = await Puzzle.countDocuments({ theme: theme });
      if (count > 0) {
        availableThemes.push({
          code: theme,
          label: theme.charAt(0).toUpperCase() + theme.slice(1).replace(/_/g, ' ')
        });
      }
    }
    
    console.log(`[PUZZLE] Found ${availableThemes.length} themes with puzzles`);
    res.json({ themes: availableThemes });
  } catch (err) {
    console.error('[Puzzle Route] Error getting themes:', err);
    
    // Return fallback themes on error
    const fallbackThemes = [
      { code: 'mate_in_1', label: 'Mate in 1' },
      { code: 'mate_in_2', label: 'Mate in 2' },
      { code: 'mate_in_3', label: 'Mate in 3' },
      { code: 'tactics', label: 'Tactics' },
      { code: 'endgame', label: 'Endgame' },
      { code: 'opening', label: 'Opening' },
      { code: 'middlegame', label: 'Middlegame' }
    ];
    res.json({ themes: fallbackThemes });
  }
});

// @route   POST /api/puzzles/stats/puzzle
// @desc    Update puzzle stats and rating for a user
// @access  Private
router.post('/stats/puzzle', auth, async (req, res) => {
  try {
    let { solved, puzzleRating, difficulty, theme } = req.body;
    console.log('📊 Puzzle stats update request (raw):', { 
      solved: solved, 
      solvedType: typeof solved,
      puzzleRating, 
      difficulty, 
      theme 
    });
    
    // CRITICAL: Ensure solved is a boolean, not a string
    // Sometimes frontend sends "false" as a string instead of boolean false
    if (typeof solved === 'string') {
      solved = solved === 'true' || solved === '1';
      console.log('🔄 Converted solved from string to boolean:', solved);
    } else if (solved === undefined || solved === null) {
      solved = false; // Default to false if not provided
      console.log('⚠️ Solved was undefined/null, defaulting to false');
    }
    solved = Boolean(solved); // Ensure it's definitely a boolean
    
    console.log('📊 Puzzle stats update request (processed):', { 
      solved: solved, 
      solvedType: typeof solved,
      puzzleRating, 
      difficulty, 
      theme 
    });
    console.log('📊 User ID:', req.user.id);
    
    const user = await User.findById(req.user.id);
    
    if (!user) {
      console.log('❌ User not found');
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('👤 User found:', user.username, 'Current rating:', user.rating);

    // Get the puzzle rating from either puzzleRating or difficulty parameter
    let puzzleRatingValue = puzzleRating || difficulty;
    
    // Ensure puzzleRatingValue is a valid number
    if (puzzleRatingValue === undefined || puzzleRatingValue === null || isNaN(puzzleRatingValue)) {
      puzzleRatingValue = 1200; // Default rating if not provided or invalid
    }
    
    // Convert to number and ensure it's valid
    puzzleRatingValue = parseInt(puzzleRatingValue) || 1200;

    console.log('🎯 Updating rating with:', { 
      userRating: user.rating, 
      puzzleRating: puzzleRatingValue, 
      solved 
    });

    // Update user rating using utility function
    // This function will initialize ratings if needed and save the user
    console.log('🔄 Calling updateUserRating with:', {
      userId: req.user.id,
      ratingType: 'rating',
      puzzleRating: puzzleRatingValue,
      solved: solved
    });
    
    const ratingResult = await updateUserRating(req.user.id, 'rating', puzzleRatingValue, solved);

    console.log('📈 Rating update result:', ratingResult);
    console.log('📈 Rating change:', ratingResult.ratingChange, 'New rating:', ratingResult.newRating, 'Solved:', solved);

    // Refresh user object to get the updated rating (updateUserRating saves the user, so we need to reload)
    const updatedUser = await User.findById(req.user.id);
    if (!updatedUser) {
      console.log('❌ User not found after rating update');
      return res.status(404).json({ message: 'User not found' });
    }

    // Initialize stats if they don't exist (on the refreshed user object)
    if (!updatedUser.stats) {
      updatedUser.stats = {
        puzzleStats: {
          totalAttempted: 0,
          totalSolved: 0,
          totalFailed: 0,
          currentStreak: 0,
          bestStreak: 0,
          recentlySolved: [],
          averageRating: 0,
          byTheme: new Map(),
          byDifficulty: new Map()
        },
        openingStats: {
          openings: []
        }
      };
    }
    
    updatedUser.stats.puzzleStats.totalAttempted += 1;
    if (solved) {
      updatedUser.stats.puzzleStats.totalSolved += 1;
      updatedUser.stats.puzzleStats.currentStreak += 1;
      if (updatedUser.stats.puzzleStats.currentStreak > updatedUser.stats.puzzleStats.bestStreak) {
        updatedUser.stats.puzzleStats.bestStreak = updatedUser.stats.puzzleStats.currentStreak;
      }
    } else {
      updatedUser.stats.puzzleStats.totalFailed += 1;
      updatedUser.stats.puzzleStats.currentStreak = 0;
    }

    await updatedUser.save();
    console.log('💾 User saved with new rating:', updatedUser.rating, 'Rating change:', ratingResult.ratingChange);
    
    res.json({ 
      stats: updatedUser.stats, 
      rating: ratingResult.newRating, 
      ratingChange: ratingResult.ratingChange,
      newRating: ratingResult.newRating 
    });
  } catch (err) {
    console.error('❌ Error updating puzzle stats:', err);
    console.error('❌ Error stack:', err.stack);
    // Return error but don't block - stats update is not critical for puzzle loading
    if (!res.headersSent) {
      return res.status(500).json({ message: 'Error updating stats', error: err.message });
    }
  }
});

module.exports = router; 