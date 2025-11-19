const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');

// Get today's progress
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const today = new Date().toISOString().split('T')[0];
    
    // Initialize dailyProgress if it doesn't exist
    if (!user.dailyProgress) {
      user.dailyProgress = {
        date: today,
        tactics: { completed: 0, total: 5 },
        blunderPreventer: { completed: 0, total: 6 },
        intuitionTrainer: { completed: 0, total: 1 },
        defender: { completed: 0, total: 1 },
        endgame: { completed: 0, total: 1 },
        visualization: { completed: 0, total: 1 }
      };
      await user.save();
    }

    // Reset progress if it's a new day
    if (user.dailyProgress.date !== today) {
      user.dailyProgress = {
        date: today,
        tactics: { completed: 0, total: 5 },
        blunderPreventer: { completed: 0, total: 6 },
        intuitionTrainer: { completed: 0, total: 1 },
        defender: { completed: 0, total: 1 },
        endgame: { completed: 0, total: 1 },
        visualization: { completed: 0, total: 1 }
      };
      await user.save();
    }

    res.json({ 
      success: true, 
      progress: {
        tactics: user.dailyProgress.tactics,
        blunderPreventer: user.dailyProgress.blunderPreventer,
        intuitionTrainer: user.dailyProgress.intuitionTrainer,
        defender: user.dailyProgress.defender,
        endgame: user.dailyProgress.endgame,
        visualization: user.dailyProgress.visualization
      }
    });
  } catch (error) {
    console.error('Error getting daily progress:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update progress for a specific module
router.post('/update', auth, async (req, res) => {
  try {
    const { module } = req.body; // module: 'tactics', 'blunderPreventer', etc.
    
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const today = new Date().toISOString().split('T')[0];

    // Initialize or reset progress if needed
    if (!user.dailyProgress || user.dailyProgress.date !== today) {
      user.dailyProgress = {
        date: today,
        tactics: { completed: 0, total: 5 },
        blunderPreventer: { completed: 0, total: 6 },
        intuitionTrainer: { completed: 0, total: 1 },
        defender: { completed: 0, total: 1 },
        endgame: { completed: 0, total: 1 },
        visualization: { completed: 0, total: 1 }
      };
    }

    // Increment the completed count for the module
    if (user.dailyProgress[module]) {
      const current = user.dailyProgress[module].completed;
      const total = user.dailyProgress[module].total;
      
      if (current < total) {
        user.dailyProgress[module].completed = current + 1;
      }
    }

    await user.save();

    res.json({ 
      success: true, 
      progress: {
        tactics: user.dailyProgress.tactics,
        blunderPreventer: user.dailyProgress.blunderPreventer,
        intuitionTrainer: user.dailyProgress.intuitionTrainer,
        defender: user.dailyProgress.defender,
        endgame: user.dailyProgress.endgame,
        visualization: user.dailyProgress.visualization
      }
    });
  } catch (error) {
    console.error('Error updating daily progress:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;











