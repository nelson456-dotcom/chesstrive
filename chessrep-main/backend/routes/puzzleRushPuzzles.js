const express = require('express');
const router = express.Router();
const PuzzleRushPuzzle = require('../models/PuzzleRushPuzzle');
const User = require('../models/User');
const auth = require('../middleware/auth');

// Get a random puzzle for puzzle rush
router.get('/random', async (req, res) => {
  try {
    const { maxRating = 1600, minRating = 300, theme, difficulty } = req.query;
    
    // Build query
    const query = {
      rating: { $gte: parseInt(minRating), $lte: parseInt(maxRating) }
    };
    
    if (theme) {
      query.theme = theme;
    }
    
    if (difficulty) {
      query.difficulty = difficulty;
    }
    
    // Get random puzzle
    const puzzle = await PuzzleRushPuzzle.aggregate([
      { $match: query },
      { $sample: { size: 1 } }
    ]);
    
    if (puzzle.length === 0) {
      // Return fallback puzzle if database is empty
      console.log('No puzzles in database, returning fallback puzzle');
      const fallbackPuzzle = getFallbackPuzzle();
      return res.json({
        success: true,
        puzzle: fallbackPuzzle
      });
    }
    
    res.json({
      success: true,
      puzzle: puzzle[0]
    });
  } catch (error) {
    console.error('Error fetching puzzle rush puzzle:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch puzzle',
      error: error.message
    });
  }
});

// Get multiple random puzzles
router.get('/random-multiple', async (req, res) => {
  try {
    const { count = 10, maxRating = 1600, minRating = 300, theme, difficulty } = req.query;
    
    // Build query
    const query = {
      rating: { $gte: parseInt(minRating), $lte: parseInt(maxRating) }
    };
    
    if (theme) {
      query.theme = theme;
    }
    
    if (difficulty) {
      query.difficulty = difficulty;
    }
    
    // Get random puzzles
    const puzzles = await PuzzleRushPuzzle.aggregate([
      { $match: query },
      { $sample: { size: parseInt(count) } }
    ]);
    
    res.json({
      success: true,
      puzzles: puzzles
    });
  } catch (error) {
    console.error('Error fetching puzzle rush puzzles:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch puzzles',
      error: error.message
    });
  }
});

// Get puzzle statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = await PuzzleRushPuzzle.aggregate([
      {
        $group: {
          _id: null,
          totalPuzzles: { $sum: 1 },
          avgRating: { $avg: '$rating' },
          minRating: { $min: '$rating' },
          maxRating: { $max: '$rating' }
        }
      }
    ]);
    
    const difficultyStats = await PuzzleRushPuzzle.aggregate([
      {
        $group: {
          _id: '$difficulty',
          count: { $sum: 1 },
          avgRating: { $avg: '$rating' }
        }
      }
    ]);
    
    const themeStats = await PuzzleRushPuzzle.aggregate([
      {
        $group: {
          _id: '$theme',
          count: { $sum: 1 }
        }
      }
    ]);
    
    res.json({
      success: true,
      stats: stats[0] || {},
      difficultyStats: difficultyStats,
      themeStats: themeStats
    });
  } catch (error) {
    console.error('Error fetching puzzle rush stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch stats',
      error: error.message
    });
  }
});

// Fallback puzzle function for when database is empty
function getFallbackPuzzle() {
  const fallbackPuzzles = [
    {
      _id: 'fallback-1',
      fen: 'rnbqkb1r/pppp1ppp/5n2/4p3/2B1P3/8/PPPP1PPP/RNBQK1NR w KQkq - 0 1',
      moves: ['Nf3'],
      rating: 800,
      theme: 'development',
      difficulty: 'intermediate'
    },
    {
      _id: 'fallback-2',
      fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/3P1N2/PPP2PPP/RNBQK2R w KQkq - 0 1',
      moves: ['Bxc6'],
      rating: 900,
      theme: 'tactics',
      difficulty: 'intermediate'
    },
    {
      _id: 'fallback-3',
      fen: 'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 1',
      moves: ['d4'],
      rating: 700,
      theme: 'opening',
      difficulty: 'beginner'
    },
    {
      _id: 'fallback-4',
      fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/3P1N2/PPP2PPP/RNBQK2R w KQkq - 0 1',
      moves: ['O-O'],
      rating: 850,
      theme: 'castling',
      difficulty: 'intermediate'
    },
    {
      _id: 'fallback-5',
      fen: 'rnbqkbnr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 0 1',
      moves: ['Bc4'],
      rating: 750,
      theme: 'development',
      difficulty: 'beginner'
    }
  ];
  
  return fallbackPuzzles[Math.floor(Math.random() * fallbackPuzzles.length)];
}

// Update puzzle rush stats for a user
router.post('/update-stats', auth, async (req, res) => {
  try {
    const { solved, timeSpent } = req.body; // timeSpent in seconds
    const userId = req.user.id;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Initialize puzzle rush stats if they don't exist
    if (!user.stats.puzzleRushStats) {
      user.stats.puzzleRushStats = {
        bestStreak: 0,
        currentStreak: 0,
        totalPuzzles: 0,
        totalSolved: 0,
        totalFailed: 0,
        bestTime: null,
        averageTime: 0
      };
    }
    
    const stats = user.stats.puzzleRushStats;
    
    // Update basic stats
    stats.totalPuzzles += 1;
    
    if (solved) {
      stats.totalSolved += 1;
      stats.currentStreak += 1;
      
      // Update best streak if current streak is higher
      if (stats.currentStreak > stats.bestStreak) {
        stats.bestStreak = stats.currentStreak;
      }
      
      // Update best time if this is better
      if (timeSpent && (stats.bestTime === null || timeSpent < stats.bestTime)) {
        stats.bestTime = timeSpent;
      }
      
      // Update average time
      if (timeSpent) {
        const totalTime = stats.averageTime * (stats.totalSolved - 1) + timeSpent;
        stats.averageTime = totalTime / stats.totalSolved;
      }
    } else {
      stats.totalFailed += 1;
      stats.currentStreak = 0; // Reset streak on failure
    }
    
    await user.save();
    
    res.json({
      success: true,
      stats: {
        bestStreak: stats.bestStreak,
        currentStreak: stats.currentStreak,
        totalPuzzles: stats.totalPuzzles,
        totalSolved: stats.totalSolved,
        totalFailed: stats.totalFailed,
        bestTime: stats.bestTime,
        averageTime: stats.averageTime
      }
    });
    
  } catch (error) {
    console.error('Error updating puzzle rush stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update stats',
      error: error.message
    });
  }
});

// Get puzzle rush stats for a user
router.get('/user-stats', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    const stats = user.stats.puzzleRushStats || {
      bestStreak: 0,
      currentStreak: 0,
      totalPuzzles: 0,
      totalSolved: 0,
      totalFailed: 0,
      bestTime: null,
      averageTime: 0
    };
    
    res.json({
      success: true,
      stats: stats
    });
    
  } catch (error) {
    console.error('Error fetching puzzle rush stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch stats',
      error: error.message
    });
  }
});

module.exports = router;


