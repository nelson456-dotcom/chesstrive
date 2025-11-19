const express = require('express');
const router = express.Router();
const User = require('../models/User');

// @route   GET /api/leaderboard
// @desc    Get leaderboard rankings - ALL USERS with ratings from all modules
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { limit = 100, page = 1 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Get ALL users and show all their ratings
    const users = await User.find({})
      .select('username name rating blunderRating visualisationRating endgameRating advantageRating resourcefulnessRating stats.puzzleStats createdAt')
      .sort({ rating: -1 }) // Sort by main rating (tactics)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Calculate average rating for each user across all modules
    const usersWithAverage = users.map(user => {
      const ratings = [
        user.rating || 1200,
        user.blunderRating || 1200,
        user.visualisationRating || 1200,
        user.endgameRating || 1200,
        user.advantageRating || 1200,
        user.resourcefulnessRating || 1200
      ];
      const averageRating = Math.round(ratings.reduce((a, b) => a + b, 0) / ratings.length);
      
      return {
        ...user,
        averageRating,
        totalSolved: user.stats?.puzzleStats?.totalSolved || 0,
        totalAttempted: user.stats?.puzzleStats?.totalAttempted || 0
      };
    });

    const totalUsers = await User.countDocuments({});
    
    res.json({
      users: usersWithAverage,
      totalUsers,
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalUsers / parseInt(limit)),
      limit: parseInt(limit)
    });
  } catch (err) {
    console.error('Error fetching leaderboard:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/leaderboard/user/:userId
// @desc    Get specific user's ranking
// @access  Public
router.get('/user/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .select('username name rating stats.puzzleStats.totalSolved stats.puzzleStats.totalAttempted')
      .lean();
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get user's rank
    const rank = await User.countDocuments({ rating: { $gt: user.rating } }) + 1;
    
    res.json({
      user,
      rank
    });
  } catch (err) {
    console.error('Error fetching user ranking:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/leaderboard/endgames
// @desc    Get endgame leaderboard rankings
// @access  Public
router.get('/endgames', async (req, res) => {
  try {
    const { limit = 50, page = 1 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const users = await User.find({ endgameRating: { $exists: true } })
      .select('username name endgameRating')
      .sort({ endgameRating: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const totalUsers = await User.countDocuments({ endgameRating: { $exists: true } });
    
    res.json({
      users,
      totalUsers,
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalUsers / parseInt(limit)),
      limit: parseInt(limit)
    });
  } catch (err) {
    console.error('Error fetching endgame leaderboard:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/leaderboard/endgames/user/:userId
// @desc    Get specific user's endgame ranking
// @access  Public
router.get('/endgames/user/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .select('username name endgameRating')
      .lean();
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get user's rank
    const rank = await User.countDocuments({ endgameRating: { $gt: user.endgameRating } }) + 1;
    
    res.json({
      user,
      rank
    });
  } catch (err) {
    console.error('Error fetching user endgame ranking:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 