const User = require('../models/User');

/**
 * Initialize all rating fields for a user if they don't exist
 * @param {Object} user - User document
 * @returns {Object} Updated user object
 */
const initializeUserRatings = (user) => {
  if (!user.rating) {
    user.rating = 1200;
  }
  if (!user.blunderRating) {
    user.blunderRating = 1200;
  }
  if (!user.visualisationRating) {
    user.visualisationRating = 1200;
  }
  if (!user.resourcefulnessRating) {
    user.resourcefulnessRating = 1200;
  }
  if (!user.endgameRating) {
    user.endgameRating = 1200;
  }
  if (!user.advantageRating) {
    user.advantageRating = 1200;
  }
  if (!user.defenderRating) {
    user.defenderRating = 1200;
  }
  return user;
};

/**
 * Calculate rating change using ELO system
 * @param {number} userRating - Current user rating
 * @param {number} puzzleRating - Puzzle difficulty rating
 * @param {boolean} solved - Whether the puzzle was solved
 * @param {number} kFactor - K-factor for rating sensitivity (default: 32)
 * @returns {number} Rating change
 */
const calculateRatingChange = (userRating, puzzleRating, solved, kFactor = 32) => {
  const expectedScore = 1 / (1 + Math.pow(10, (puzzleRating - userRating) / 400));
  const actualScore = solved ? 1 : 0;
  return Math.round(kFactor * (actualScore - expectedScore));
};

/**
 * Update user rating for a specific rating type
 * @param {string} userId - User ID
 * @param {string} ratingType - Type of rating ('rating', 'blunderRating', 'visualisationRating')
 * @param {number} puzzleRating - Puzzle difficulty rating
 * @param {boolean} solved - Whether the puzzle was solved
 * @returns {Object} Updated rating information
 */
const updateUserRating = async (userId, ratingType, puzzleRating, solved) => {
  try {
    console.log('🔄 updateUserRating called:', { userId, ratingType, puzzleRating, solved });
    
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Initialize all ratings
    initializeUserRatings(user);

    // Validate rating type
    const validRatingTypes = ['rating', 'blunderRating', 'visualisationRating', 'resourcefulnessRating', 'endgameRating', 'advantageRating', 'defenderRating'];
    if (!validRatingTypes.includes(ratingType)) {
      throw new Error(`Invalid rating type: ${ratingType}. Valid types: ${validRatingTypes.join(', ')}`);
    }

    const oldRating = user[ratingType];
    
    // CRITICAL: Ensure puzzleRating is a valid number
    const validPuzzleRating = typeof puzzleRating === 'number' && !isNaN(puzzleRating) && puzzleRating > 0 
      ? puzzleRating 
      : 1200; // Default to 1200 if invalid
    
    // CRITICAL: Ensure solved is a boolean
    const solvedBoolean = solved === true || solved === 'true' || solved === 1;
    
    // Use higher K-factor for failed puzzles to increase penalty
    // K-factor of 32 for solved, 64 for failed (double penalty)
    const kFactor = solvedBoolean ? 32 : 64;
    
    const ratingChange = calculateRatingChange(oldRating, validPuzzleRating, solvedBoolean, kFactor);
    
    console.log('📊 Rating calculation:', {
      oldRating,
      puzzleRating: validPuzzleRating,
      solved: solvedBoolean,
      kFactor: kFactor,
      ratingChange,
      expectedScore: 1 / (1 + Math.pow(10, (validPuzzleRating - oldRating) / 400)),
      actualScore: solvedBoolean ? 1 : 0,
      newRating: oldRating + ratingChange
    });
    
    // CRITICAL: Verify rating change is calculated correctly
    // When puzzle is failed (solved=false), rating MUST decrease
    if (!solvedBoolean && ratingChange >= 0) {
      console.error('🚨 WARNING: Rating should decrease when puzzle is failed, but ratingChange is:', ratingChange);
      console.error('🚨 Calculation details:', {
        oldRating,
        validPuzzleRating,
        expectedScore: 1 / (1 + Math.pow(10, (validPuzzleRating - oldRating) / 400)),
        calculatedChange: ratingChange
      });
      // Force a minimum rating decrease of 1 point if calculation is wrong
      // This should never happen, but ensures rating always decreases on failure
      const forcedChange = -1;
      console.error('🚨 FORCING rating decrease to -1 due to calculation error');
      user[ratingType] += forcedChange;
    } else {
      // Update the specific rating (normal case)
      user[ratingType] += ratingChange;
    }
    
    console.log('💾 Saving user with updated rating:', {
      oldRating,
      newRating: user[ratingType],
      ratingChange,
      ratingType
    });
    
    await user.save();
    
    // Verify the save was successful
    const verifyUser = await User.findById(userId);
    console.log('✅ Rating updated successfully:', {
      oldRating,
      newRating: verifyUser[ratingType],
      savedRating: user[ratingType],
      ratingChange,
      match: verifyUser[ratingType] === user[ratingType]
    });
    
    return {
      newRating: user[ratingType],
      ratingChange: ratingChange,
      oldRating: oldRating
    };
  } catch (error) {
    console.error('❌ Error updating user rating:', error);
    console.error('❌ Error stack:', error.stack);
    throw error;
  }
};

/**
 * Get all user ratings
 * @param {string} userId - User ID
 * @returns {Object} User ratings
 */
const getUserRatings = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Initialize all ratings
    initializeUserRatings(user);
    await user.save();

    return {
      rating: user.rating,
      blunderRating: user.blunderRating,
      visualisationRating: user.visualisationRating
    };
  } catch (error) {
    console.error('Error getting user ratings:', error);
    throw error;
  }
};

module.exports = {
  initializeUserRatings,
  calculateRatingChange,
  updateUserRating,
  getUserRatings
};
