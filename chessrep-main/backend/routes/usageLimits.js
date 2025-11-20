const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');

// Helper function to check if date is within last N days
const isWithinDays = (date, days) => {
  if (!date) return false;
  const daysAgo = new Date();
  daysAgo.setDate(daysAgo.getDate() - days);
  return new Date(date) >= daysAgo;
};

// Helper function to reset daily limits if needed
const resetDailyLimits = (user) => {
  // Initialize usageLimits if it doesn't exist
  if (!user.usageLimits) {
    user.usageLimits = {};
  }
  
  const today = new Date().toISOString().split('T')[0];
  
  // Initialize puzzleRush if it doesn't exist
  if (!user.usageLimits.puzzleRush) {
    user.usageLimits.puzzleRush = {
      sessionsToday: 0,
      lastResetDate: today
    };
  } else if (user.usageLimits.puzzleRush.lastResetDate !== today) {
    user.usageLimits.puzzleRush.sessionsToday = 0;
    user.usageLimits.puzzleRush.lastResetDate = today;
  }
  
  // Initialize defender if it doesn't exist
  if (!user.usageLimits.defender) {
    user.usageLimits.defender = {
      sessionsToday: 0,
      lastResetDate: today
    };
  } else if (user.usageLimits.defender.lastResetDate !== today) {
    user.usageLimits.defender.sessionsToday = 0;
    user.usageLimits.defender.lastResetDate = today;
  }
  
  // Initialize endgameTrainer if it doesn't exist
  if (!user.usageLimits.endgameTrainer) {
    user.usageLimits.endgameTrainer = {
      puzzlesToday: 0,
      lastResetDate: today
    };
  } else if (user.usageLimits.endgameTrainer.lastResetDate !== today) {
    user.usageLimits.endgameTrainer.puzzlesToday = 0;
    user.usageLimits.endgameTrainer.lastResetDate = today;
  }
  
  // Initialize puzzleTrainer if it doesn't exist
  if (!user.usageLimits.puzzleTrainer) {
    user.usageLimits.puzzleTrainer = {
      puzzlesToday: 0,
      lastResetDate: today
    };
  } else if (user.usageLimits.puzzleTrainer.lastResetDate !== today) {
    user.usageLimits.puzzleTrainer.puzzlesToday = 0;
    user.usageLimits.puzzleTrainer.lastResetDate = today;
  }
};

// Helper function to reset openings every 3 days (tracking distinct openings, not variations)
const resetOpeningsLimits = (user) => {
  // Initialize usageLimits if it doesn't exist
  if (!user.usageLimits) {
    user.usageLimits = {};
  }
  if (!user.usageLimits.openings) {
    user.usageLimits.openings = {
      openingsSeen: [], // Changed from variationsSeen to openingsSeen
      lastReset: new Date()
    };
    return;
  }
  
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
  
  if (!user.usageLimits.openings.lastReset || new Date(user.usageLimits.openings.lastReset) < threeDaysAgo) {
    user.usageLimits.openings.openingsSeen = [];
    user.usageLimits.openings.lastReset = new Date();
  }
};

// @route   GET /api/usage-limits/:feature
// @desc    Check if user can access a feature
// @access  Private
router.get('/:feature', auth, async (req, res) => {
  try {
    const { feature } = req.params;
    const userId = req.user.id;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Premium users have unlimited access
    if (user.userType === 'premium') {
      return res.json({ allowed: true, remaining: Infinity, limit: Infinity });
    }
    
    // Reset daily limits if needed
    resetDailyLimits(user);
    resetOpeningsLimits(user);
    await user.save();
    
    let allowed = false;
    let remaining = 0;
    let limit = 0;
    
    switch (feature) {
      case 'openings':
        // Initialize usageLimits if it doesn't exist
        if (!user.usageLimits) {
          user.usageLimits = {};
        }
        if (!user.usageLimits.openings) {
          user.usageLimits.openings = {
            openingsSeen: [], // Changed from variationsSeen to openingsSeen
            lastReset: new Date()
          };
        }
        // Free users can practice 3 distinct openings every 3 days
        const openingsSeen = user.usageLimits.openings.openingsSeen || [];
        const validOpenings = openingsSeen.filter(o => 
          isWithinDays(o.seenAt, 3)
        );
        // Count distinct openings (not variations)
        const distinctOpenings = [...new Set(validOpenings.map(o => o.openingName))];
        limit = 3;
        remaining = Math.max(0, limit - distinctOpenings.length);
        allowed = remaining > 0;
        break;
        
      case 'puzzle-rush':
        // Free users can play 3 sessions per day
        limit = 3;
        remaining = Math.max(0, limit - (user.usageLimits.puzzleRush.sessionsToday || 0));
        allowed = remaining > 0;
        break;
        
      case 'defender':
        // Free users can play 1 session per day
        limit = 1;
        remaining = Math.max(0, limit - (user.usageLimits.defender.sessionsToday || 0));
        allowed = remaining > 0;
        break;
        
      case 'report-40':
        // Free users can generate 1 report total
        limit = 1;
        remaining = user.usageLimits.report40.used ? 0 : 1;
        allowed = !user.usageLimits.report40.used;
        break;
        
      case 'endgame-trainer':
        // Free users can do 10 puzzles per day
        limit = 10;
        remaining = Math.max(0, limit - (user.usageLimits.endgameTrainer.puzzlesToday || 0));
        allowed = remaining > 0;
        break;
        
      case 'guess-the-move':
        // Free users can play 1 game total
        limit = 1;
        remaining = user.usageLimits.guessTheMove.gamesPlayed >= 1 ? 0 : 1;
        allowed = user.usageLimits.guessTheMove.gamesPlayed < 1;
        break;
        
      case 'puzzle-trainer':
        // Free users can solve 20 puzzles per day
        limit = 20;
        remaining = Math.max(0, limit - (user.usageLimits.puzzleTrainer.puzzlesToday || 0));
        allowed = remaining > 0;
        break;
        
      default:
        return res.status(400).json({ message: 'Invalid feature' });
    }
    
    res.json({ allowed, remaining, limit });
  } catch (error) {
    console.error('Error checking usage limits:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/usage-limits/:feature/increment
// @desc    Increment usage for a feature
// @access  Private
router.post('/:feature/increment', auth, async (req, res) => {
  try {
    const { feature } = req.params;
    const userId = req.user.id;
    const { openingName, variationName } = req.body;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Premium users don't need tracking
    if (user.userType === 'premium') {
      return res.json({ success: true, remaining: Infinity });
    }
    
    // Reset limits if needed
    resetDailyLimits(user);
    resetOpeningsLimits(user);
    
    let remaining = 0;
    
    switch (feature) {
      case 'openings':
        if (openingName && variationName) {
          // Initialize usageLimits if it doesn't exist
          if (!user.usageLimits) {
            user.usageLimits = {};
          }
          if (!user.usageLimits.openings) {
            user.usageLimits.openings = {
              openingsSeen: [], // Changed from variationsSeen to openingsSeen
              lastReset: new Date()
            };
          }
          
          // Check if this opening was already seen in the last 3 days (regardless of variation)
          const openingsSeen = user.usageLimits.openings.openingsSeen || [];
          const validOpenings = openingsSeen.filter(o => 
            isWithinDays(o.seenAt, 3)
          );
          
          // Get distinct openings (not variations)
          const distinctOpenings = [...new Set(validOpenings.map(o => o.openingName))];
          
          // Check if this opening was already seen (regardless of variation)
          const alreadySeen = distinctOpenings.includes(openingName);
          
          // If already seen, don't increment but allow (they can practice different variations of the same opening)
          if (alreadySeen) {
            remaining = Math.max(0, 3 - distinctOpenings.length);
            // Return success with a flag indicating opening was already seen (allow practice)
            return res.json({ success: true, remaining, limitReached: false, alreadySeen: true });
          } else if (distinctOpenings.length >= 3) {
            // Limit reached - don't increment, return success but indicate limit was reached
            remaining = 0;
            return res.json({ success: true, remaining: 0, limitReached: true, alreadySeen: false });
          } else {
            // Add the new distinct opening (only track opening name, not variation)
            // Initialize usageLimits structure if needed
            if (!user.usageLimits) { user.usageLimits = {}; }
            if (!user.usageLimits.openings) { user.usageLimits.openings = {}; }
            if (!user.usageLimits.openings.openingsSeen) { user.usageLimits.openings.openingsSeen = []; }
            user.usageLimits.openings.openingsSeen.push({
              openingName, // Only track opening name, not variation
              seenAt: new Date()
            });
            
            const newValidOpenings = user.usageLimits.openings.openingsSeen.filter(o => 
              isWithinDays(o.seenAt, 3)
            );
            const newDistinctOpenings = [...new Set(newValidOpenings.map(o => o.openingName))];
            remaining = Math.max(0, 3 - newDistinctOpenings.length);
            
            // Save the user before returning
            await user.save();
            return res.json({ success: true, remaining, limitReached: false, alreadySeen: false });
          }
        } else {
          // No openingName or variationName provided
          return res.status(400).json({ message: 'openingName and variationName are required for openings' });
        }
        break;
        
      case 'puzzle-rush':
        user.usageLimits.puzzleRush.sessionsToday = (user.usageLimits.puzzleRush.sessionsToday || 0) + 1;
        remaining = Math.max(0, 3 - user.usageLimits.puzzleRush.sessionsToday);
        break;
        
      case 'defender':
        user.usageLimits.defender.sessionsToday = (user.usageLimits.defender.sessionsToday || 0) + 1;
        remaining = Math.max(0, 1 - user.usageLimits.defender.sessionsToday);
        break;
        
      case 'report-40':
        user.usageLimits.report40.used = true;
        remaining = 0;
        break;
        
      case 'endgame-trainer':
        user.usageLimits.endgameTrainer.puzzlesToday = (user.usageLimits.endgameTrainer.puzzlesToday || 0) + 1;
        remaining = Math.max(0, 10 - user.usageLimits.endgameTrainer.puzzlesToday);
        break;
        
      case 'guess-the-move':
        user.usageLimits.guessTheMove.gamesPlayed = (user.usageLimits.guessTheMove.gamesPlayed || 0) + 1;
        remaining = user.usageLimits.guessTheMove.gamesPlayed >= 1 ? 0 : 1;
        break;
        
      case 'puzzle-trainer':
        user.usageLimits.puzzleTrainer.puzzlesToday = (user.usageLimits.puzzleTrainer.puzzlesToday || 0) + 1;
        remaining = Math.max(0, 20 - user.usageLimits.puzzleTrainer.puzzlesToday);
        break;
        
      default:
        return res.status(400).json({ message: 'Invalid feature' });
    }
    
    await user.save();
    res.json({ success: true, remaining });
  } catch (error) {
    console.error('Error incrementing usage:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/usage-limits
// @desc    Get all usage limits for user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).select('userType usageLimits');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Initialize usageLimits if it doesn't exist
    if (!user.usageLimits) {
      user.usageLimits = {};
    }
    
    // Reset limits if needed
    resetDailyLimits(user);
    resetOpeningsLimits(user);
    await user.save();
    
    // Premium users have unlimited access
    if (user.userType === 'premium') {
      return res.json({
        premium: true,
        openings: { remaining: Infinity, limit: Infinity },
        puzzleRush: { remaining: Infinity, limit: Infinity },
        defender: { remaining: Infinity, limit: Infinity },
        report40: { remaining: Infinity, limit: Infinity },
        endgameTrainer: { remaining: Infinity, limit: Infinity },
        guessTheMove: { remaining: Infinity, limit: Infinity },
        puzzleTrainer: { remaining: Infinity, limit: Infinity }
      });
    }
    
    // Ensure openings exists
    if (!user.usageLimits.openings) {
      user.usageLimits.openings = {
        openingsSeen: [], // Changed from variationsSeen to openingsSeen
        lastReset: new Date()
      };
    }
    
    const openingsSeen = user.usageLimits.openings.openingsSeen || [];
    const validOpenings = openingsSeen.filter(o => 
      isWithinDays(o.seenAt, 3)
    );
    // Count distinct openings (not variations)
    const distinctOpenings = [...new Set(validOpenings.map(o => o.openingName))];
    
    res.json({
      premium: false,
      openings: {
        remaining: Math.max(0, 3 - distinctOpenings.length),
        limit: 3
      },
      puzzleRush: {
        remaining: Math.max(0, 3 - (user.usageLimits.puzzleRush.sessionsToday || 0)),
        limit: 3
      },
      defender: {
        remaining: Math.max(0, 1 - (user.usageLimits.defender.sessionsToday || 0)),
        limit: 1
      },
      report40: {
        remaining: user.usageLimits.report40.used ? 0 : 1,
        limit: 1
      },
      endgameTrainer: {
        remaining: Math.max(0, 10 - (user.usageLimits.endgameTrainer.puzzlesToday || 0)),
        limit: 10
      },
      guessTheMove: {
        remaining: user.usageLimits.guessTheMove.gamesPlayed >= 1 ? 0 : 1,
        limit: 1
      },
      puzzleTrainer: {
        remaining: Math.max(0, 20 - (user.usageLimits.puzzleTrainer.puzzlesToday || 0)),
        limit: 20
      }
    });
  } catch (error) {
    console.error('Error getting usage limits:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

