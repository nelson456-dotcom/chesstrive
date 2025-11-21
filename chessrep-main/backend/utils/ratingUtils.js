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

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

/**
 * Calculate rating change using a dynamic system
 * Ensures rating change stays between 10 and 30 points (or -10 and -30 for failures)
 * and scales with both player rating and puzzle difficulty.
 *
 * @param {number} userRating - Current user rating
 * @param {number} puzzleRating - Puzzle difficulty rating
 * @param {boolean} solved - Whether the puzzle was solved
 * @returns {number} Rating change
 */
const calculateRatingChange = (userRating = 1200, puzzleRating = 1200, solved = true) => {
  const baseChange = 20; // Center point
  const difficultyGap = puzzleRating - userRating;
  // Normalize difficulty gap to [-1, 1] (roughly +/-500 rating difference)
  const normalizedGap = clamp(difficultyGap / 500, -1, 1);
  const gapBonus = Math.round(normalizedGap * 10); // +/-10 points

  if (solved) {
    // Harder puzzles (positive gap) give more points, easier puzzles less
    const change = baseChange + gapBonus;
    return clamp(change, 10, 30);
  } else {
    // Failing easy puzzles hurts more (negative gap), hard puzzles hurt less
    const change = -baseChange + gapBonus;
    return clamp(change, -30, -10);
  }
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
    
    const ratingChange = calculateRatingChange(oldRating, validPuzzleRating, solvedBoolean);
    
    console.log('📊 Rating calculation:', {
      oldRating,
      puzzleRating: validPuzzleRating,
      solved: solvedBoolean,
      ratingChange,
      newRating: oldRating + ratingChange
    });

    user[ratingType] += ratingChange;
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
