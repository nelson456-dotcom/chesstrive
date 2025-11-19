const User = require('../models/User');
const mongoose = require('mongoose');

/**
 * Middleware to check daily puzzle limit for free users
 * Free users can solve 20 puzzles per day (including endgames)
 * Premium users have unlimited puzzles
 */
module.exports = async function(req, res, next) {
  try {
    // Safety check - if user is not set, skip limit check and proceed
    if (!req.user || !req.user.id) {
      console.warn('[PuzzleLimit] No user in request, skipping limit check');
      req.remainingPuzzles = 20; // Default to full limit
      return next();
    }

    try {
      // Use raw MongoDB collection to completely bypass Mongoose and avoid validation issues
      let user = null;
      if (mongoose.connection.readyState === 1) {
        const usersCollection = mongoose.connection.db.collection('users');
        user = await usersCollection.findOne(
          { _id: new mongoose.Types.ObjectId(req.user.id) },
          { projection: { userType: 1, dailyPuzzleCount: 1, lastPuzzleDate: 1 } }
        );
      } else {
        // Fallback to Mongoose with lean() if raw collection not available
        user = await User.findById(req.user.id)
          .select('userType dailyPuzzleCount lastPuzzleDate')
          .lean();
      }
      
      if (!user) {
        console.warn('[PuzzleLimit] User not found, skipping limit check');
        req.remainingPuzzles = 20; // Default to full limit
        return next();
      }

      // Premium users have unlimited puzzles
      if (user.userType === 'premium') {
        req.remainingPuzzles = Infinity;
        return next();
      }

      // Free users: check daily limit
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const lastPuzzleDate = user.lastPuzzleDate ? new Date(user.lastPuzzleDate).toISOString().split('T')[0] : null;
      
      // Initialize dailyPuzzleCount if it doesn't exist
      let currentPuzzleCount = user.dailyPuzzleCount;
      if (currentPuzzleCount === undefined || currentPuzzleCount === null) {
        currentPuzzleCount = 0;
      }
      
      // Reset count if it's a new day
      if (lastPuzzleDate !== today) {
        currentPuzzleCount = 0;
        // Use raw MongoDB collection to completely bypass Mongoose hooks/validators
        try {
          if (mongoose.connection.readyState === 1) {
            const usersCollection = mongoose.connection.db.collection('users');
            await usersCollection.updateOne(
              { _id: new mongoose.Types.ObjectId(req.user.id) },
              {
                $set: {
                  dailyPuzzleCount: 0,
                  lastPuzzleDate: new Date()
                }
              }
            );
          }
        } catch (resetError) {
          console.error('[PuzzleLimit] Error resetting puzzle count:', resetError);
          // Continue anyway
        }
      }

      // Check if limit reached
      const DAILY_PUZZLE_LIMIT = 20;
      if (currentPuzzleCount >= DAILY_PUZZLE_LIMIT) {
        return res.status(403).json({ 
          message: 'Daily puzzle limit reached',
          requiresPremium: true,
          limit: DAILY_PUZZLE_LIMIT,
          used: currentPuzzleCount,
          resetDate: today
        });
      }

      // Increment puzzle count
      const newPuzzleCount = currentPuzzleCount + 1;
      
      // Use raw MongoDB collection to completely bypass Mongoose hooks/validators
      // This directly updates the database without any validation
      try {
        if (mongoose.connection.readyState === 1) {
          const usersCollection = mongoose.connection.db.collection('users');
          await usersCollection.updateOne(
            { _id: new mongoose.Types.ObjectId(req.user.id) },
            {
              $set: {
                dailyPuzzleCount: newPuzzleCount,
                lastPuzzleDate: new Date()
              }
            }
          );
        }
      } catch (saveError) {
        console.error('[PuzzleLimit] Error updating user puzzle count:', saveError);
        // Continue anyway - don't block the request if save fails
        // The count will be updated on next request or can be fixed manually
      }

      // Add remaining puzzles to response
      req.remainingPuzzles = DAILY_PUZZLE_LIMIT - newPuzzleCount;
      
      return next();
    } catch (dbError) {
      console.error('[PuzzleLimit] Database error:', dbError);
      console.error('[PuzzleLimit] Error stack:', dbError.stack);
      // On database error, deny access to ensure limit is enforced
      // Better to be strict than allow unlimited access
      return res.status(500).json({ 
        message: 'Error checking puzzle limit',
        error: 'Database error',
        requiresPremium: false
      });
    }
  } catch (error) {
    console.error('[PuzzleLimit] Unexpected error:', error);
    console.error('[PuzzleLimit] Error stack:', error.stack);
    // On unexpected error, deny access to ensure limit is enforced
    return res.status(500).json({ 
      message: 'Error checking puzzle limit',
      error: 'Unexpected error',
      requiresPremium: false
    });
  }
};



