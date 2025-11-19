const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');

// ... existing routes ...

// Update progress for an opening (using progress Map)
router.post('/progress', auth, async (req, res) => {
  try {
    const { openingId, completedLines, totalLines } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    // Update progress in the Map
    const progress = user.progress.get(openingId) || {
      lastPracticed: new Date(),
      completedLines: 0,
      totalLines: totalLines || 0
    };
    progress.completedLines = completedLines;
    progress.totalLines = totalLines;
    progress.lastPracticed = new Date();
    user.progress.set(openingId, progress);
    await user.save();
    res.json({ success: true, progress });
  } catch (error) {
    console.error('Error updating progress:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get progress for an opening (using progress Map)
router.get('/progress/:openingId', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    const progress = user.progress.get(req.params.openingId) || { completedLines: 0, totalLines: 0 };
    res.json(progress);
  } catch (error) {
    console.error('Error fetching progress:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 