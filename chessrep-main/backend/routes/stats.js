const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// Get puzzle rush best streak
router.get('/puzzle-rush-best-streak', auth, async (req, res) => {
  try {
    // For now, return 0 - in a real app, this would come from database
    res.json({ bestStreak: 0 });
  } catch (error) {
    console.error('Error fetching puzzle rush best streak:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Save puzzle rush best streak
router.post('/puzzle-rush-best-streak', auth, async (req, res) => {
  try {
    const { bestStreak } = req.body;
    
    // For now, just return success - in a real app, this would save to database
    console.log(`Saving puzzle rush best streak: ${bestStreak} for user: ${req.user.id}`);
    
    res.json({ success: true, bestStreak });
  } catch (error) {
    console.error('Error saving puzzle rush best streak:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;