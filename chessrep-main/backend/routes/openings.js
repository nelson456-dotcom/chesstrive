const express = require('express');
const router = express.Router();
const Opening = require('../models/Opening');
const User = require('../models/User');
const auth = require('../middleware/auth');
const premium = require('../middleware/premium');
const mongoose = require('mongoose');

// @route   GET /api/openings
// @desc    Get all openings
// @access  Premium
router.get('/', auth, premium, async (req, res) => {
  console.log('GET /api/openings - Request received');
  try {
    console.log('Fetching openings from database...');
    const openings = await Opening.find();
    console.log(`Found ${openings.length} openings`);
    console.log('Openings:', JSON.stringify(openings, null, 2));
    res.json(openings);
  } catch (err) {
    console.error('Error fetching openings:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// @route   GET /api/openings/:id
// @desc    Get opening by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    let opening = null;
    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      opening = await Opening.findById(req.params.id);
    }
    if (!opening) {
      // Try a custom string id field
      opening = await Opening.findOne({ id: req.params.id });
    }
    if (!opening) {
      return res.status(404).json({ message: 'Opening not found' });
    }
    res.json(opening);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// @route   POST /api/openings
// @desc    Create a new opening
// @access  Private (Admin only)
router.post('/', auth, async (req, res) => {
  try {
    const { name, description, difficulty, category, isFree, lines } = req.body;
    const opening = new Opening({
      name,
      description,
      difficulty,
      category,
      isFree,
      lines
    });
    await opening.save();
    res.json(opening);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's custom openings
router.get('/user', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const userOpenings = await Opening.find({ userId: userId })
      .sort({ createdAt: -1 });

    res.json(userOpenings);
  } catch (error) {
    console.error('Error fetching user openings:', error);
    res.status(500).json({ message: 'Failed to fetch user openings', error: error.message });
  }
});

// Create a new opening
router.post('/create', auth, async (req, res) => {
  try {
    const { name, description, difficulty, category, lines } = req.body;
    const userId = req.user.id;

    if (!name || !description || !difficulty || !category || !lines || lines.length === 0) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const opening = new Opening({
      name,
      description,
      difficulty,
      category,
      lines,
      userId,
      isFree: true // User-created openings are free
    });

    await opening.save();

    res.json({ 
      message: 'Opening created successfully', 
      opening 
    });

  } catch (error) {
    console.error('Error creating opening:', error);
    res.status(500).json({ message: 'Failed to create opening', error: error.message });
  }
});

// @route   PUT /api/openings/:id
// @desc    Update an opening
// @access  Private (Admin only)
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, description, difficulty, category, isFree, lines } = req.body;
    const opening = await Opening.findById(req.params.id);
    if (!opening) {
      return res.status(404).json({ message: 'Opening not found' });
    }
    opening.name = name || opening.name;
    opening.description = description || opening.description;
    opening.difficulty = difficulty || opening.difficulty;
    opening.category = category || opening.category;
    opening.isFree = isFree !== undefined ? isFree : opening.isFree;
    if (lines) opening.lines = lines;
    await opening.save();
    res.json(opening);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/openings/:id
// @desc    Delete an opening
// @access  Private (Admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    const opening = await Opening.findById(req.params.id);
    if (!opening) {
      return res.status(404).json({ message: 'Opening not found' });
    }

    await opening.remove();
    res.json({ message: 'Opening removed' });
  } catch (err) {
    console.error('Error deleting opening:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Helper function to check if a date is within N days
const isWithinDays = (date, days) => {
  const daysAgo = new Date();
  daysAgo.setDate(daysAgo.getDate() - days);
  return new Date(date) >= daysAgo;
};

// @route   POST /api/openings/practice
// @desc    Track when user practices an opening
// @access  Private
router.post('/practice', auth, async (req, res) => {
  try {
    const { openingName, variationName } = req.body;
    const userId = req.user.id;

    console.log(`[OPENINGS] Practice request from user ${userId}:`, { openingName, variationName });

    // Reload user from database to ensure we have fresh data
    const user = await User.findById(userId);
    if (!user) {
      console.log(`[OPENINGS] User ${userId} not found`);
      return res.status(404).json({ message: 'User not found' });
    }

    console.log(`[OPENINGS] User found: ${user.username}, userType: ${user.userType}, current openingsPracticed: ${user.openingsPracticed}`);
    
    // Check usage limits for free users BEFORE tracking practice
    // Track distinct OPENINGS (not variations) - same opening can be practiced multiple times
    if (user.userType !== 'premium' && user.userType !== 'Premium') {
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
      
      // Reset openings older than 3 days (exactly 3 days = 72 hours)
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      threeDaysAgo.setHours(0, 0, 0, 0); // Start of day 3 days ago
      
      if (!user.usageLimits.openings.lastReset || new Date(user.usageLimits.openings.lastReset) < threeDaysAgo) {
        console.log(`[OPENINGS] Resetting openings older than 3 days for user ${userId}`);
        user.usageLimits.openings.openingsSeen = [];
        user.usageLimits.openings.lastReset = new Date();
        await user.save(); // Save the reset and reload
        // Reload user to ensure we have the saved data
        const refreshedUser = await User.findById(userId);
        if (refreshedUser) {
          Object.assign(user, refreshedUser);
        }
      }
      
      // Check valid openings (within last 3 days) - only count distinct openings
      // Filter out openings older than 3 days
      const openingsSeen = user.usageLimits.openings.openingsSeen || [];
      const validOpenings = openingsSeen.filter(o => {
        if (!o.seenAt) return false;
        const seenDate = new Date(o.seenAt);
        return seenDate >= threeDaysAgo;
      });
      
      // Get unique opening names from valid openings
      const distinctOpenings = [...new Set(validOpenings.map(o => o.openingName))];
      
      // Check if this opening was already seen (regardless of variation)
      const alreadySeen = distinctOpenings.includes(openingName);
      
      console.log(`[OPENINGS] Limit check for user ${userId}:`, {
        totalOpeningsSeen: openingsSeen.length,
        validOpenings: validOpenings.length,
        distinctOpenings: distinctOpenings.length,
        distinctOpeningNames: distinctOpenings,
        alreadySeen,
        openingName,
        variationName
      });
      
      // If not already seen and limit reached (3 or more distinct openings), block the practice
      // We block if distinctOpenings.length >= 3 because they've already seen 3 distinct openings
      if (!alreadySeen && distinctOpenings.length >= 3) {
        console.log(`[OPENINGS] ❌ LIMIT REACHED for user ${userId}. Blocking practice. Distinct openings seen: ${distinctOpenings.length}, attempting: ${openingName} - ${variationName}`);
        return res.status(403).json({ 
          success: false, 
          message: 'You have reached your limit of 3 distinct openings. Upgrade to premium for unlimited access!',
          limitReached: true,
          openingsSeen: distinctOpenings.length,
          limit: 3
        });
      }
      
      // If this is a new distinct opening, add it to the list BEFORE tracking practice
      if (!alreadySeen) {
        console.log(`[OPENINGS] Adding new distinct opening to limit tracking. Current count: ${distinctOpenings.length}, adding: ${openingName}`);
        // Initialize usageLimits structure if needed
        if (!user.usageLimits) { user.usageLimits = {}; }
        if (!user.usageLimits.openings) { user.usageLimits.openings = {}; }
        if (!user.usageLimits.openings.openingsSeen) { user.usageLimits.openings.openingsSeen = []; }
        user.usageLimits.openings.openingsSeen.push({
          openingName, // Only track opening name, not variation
          seenAt: new Date()
        });
        // Recalculate distinct openings to verify we're still under the limit
        const newValidOpenings = user.usageLimits.openings.openingsSeen.filter(o => {
          if (!o.seenAt) return false;
          const seenDate = new Date(o.seenAt);
          return seenDate >= threeDaysAgo;
        });
        const newDistinctOpenings = [...new Set(newValidOpenings.map(o => o.openingName))];
        console.log(`[OPENINGS] After adding, distinct openings count: ${newDistinctOpenings.length}`);
        
        // Double-check: if after adding we're over the limit, remove it and block
        if (newDistinctOpenings.length > 3) {
          console.log(`[OPENINGS] ❌ ERROR: After adding, limit exceeded! Removing opening.`);
          user.usageLimits.openings.openingsSeen.pop(); // Remove the opening we just added
          return res.status(403).json({ 
            success: false, 
            message: 'You have reached your limit of 3 distinct openings. Upgrade to premium for unlimited access!',
            limitReached: true,
            openingsSeen: distinctOpenings.length,
            limit: 3
          });
        }
        
        await user.save(); // Save the limit before tracking practice
        console.log(`[OPENINGS] ✅ Distinct opening added to limit tracking for user ${userId}. New count: ${newDistinctOpenings.length}`);
      } else {
        console.log(`[OPENINGS] Opening already seen, allowing re-practice (different variation): ${openingName} - ${variationName}`);
      }
    }

    // Initialize openingsPracticed if it doesn't exist
    if (user.openingsPracticed === undefined) {
      user.openingsPracticed = 0;
    }

    // Check if this opening variation has already been practiced
    const existingOpening = user.stats?.openingStats?.openings?.find(
      opening => opening.name === openingName && opening.variation === variationName
    );

    if (!existingOpening) {
      // Add new opening to stats
      if (!user.stats) {
        user.stats = {
          openingStats: { openings: [] },
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
          }
        };
      }

      if (!user.stats.openingStats) {
        user.stats.openingStats = { openings: [] };
      }

      if (!user.stats.openingStats.openings) {
        user.stats.openingStats.openings = [];
      }

      // Add the opening to the user's practiced openings
      user.stats.openingStats.openings.push({
        name: openingName,
        variation: variationName,
        practicedAt: new Date(),
        totalPlayed: 1,
        wins: 0,
        losses: 0,
        draws: 0
      });

      // Increment openingsPracticed count
      user.openingsPracticed = (user.openingsPracticed || 0) + 1;

      await user.save();
      console.log(`[OPENINGS] Added new opening practice: ${openingName} - ${variationName}`);
      console.log(`[OPENINGS] User openingsPracticed count: ${user.openingsPracticed}`);
    } else {
      // Update existing opening practice count
      existingOpening.totalPlayed = (existingOpening.totalPlayed || 0) + 1;
      await user.save();
      console.log(`[OPENINGS] Updated existing opening practice: ${openingName} - ${variationName}`);
    }

    res.json({ 
      success: true,
      openingsPracticed: user.openingsPracticed,
      message: 'Opening practice tracked successfully'
    });

  } catch (err) {
    console.error('[OPENINGS] Error tracking practice:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router; 