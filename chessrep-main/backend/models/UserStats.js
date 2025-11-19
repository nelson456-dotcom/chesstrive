const mongoose = require('mongoose');

// Define the schema
const userStatsSchema = new mongoose.Schema({
  userId: String,
  puzzleStats: {
    totalAttempted: { type: Number, default: 0 },
    totalSolved: { type: Number, default: 0 },
    totalFailed: { type: Number, default: 0 },
    currentStreak: { type: Number, default: 0 },
    bestStreak: { type: Number, default: 0 }
  },
  openingStats: {
    openings: []
  }
}, { timestamps: true });

// Create and export the model
const UserStats = mongoose.model('UserStats', userStatsSchema);

// Export a function to get or create stats
const getOrCreateStats = async (userId) => {
  try {
    let stats = await UserStats.findOne({ userId });
    if (!stats) {
      stats = new UserStats({
        userId,
        puzzleStats: {
          totalAttempted: 0,
          totalSolved: 0,
          totalFailed: 0,
          currentStreak: 0,
          bestStreak: 0
        },
        openingStats: {
          openings: []
        }
      });
      await stats.save();
    }
    return stats;
  } catch (error) {
    console.error('Error in getOrCreateStats:', error);
    throw error;
  }
};

module.exports = {
  UserStats,
  getOrCreateStats
}; 