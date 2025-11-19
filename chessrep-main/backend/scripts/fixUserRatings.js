const mongoose = require('mongoose');
const User = require('../models/User');

const MONGO_URI = 'mongodb://localhost:27017/chessrep';

async function fixUserRatings() {
  try {
    await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Connected to MongoDB');
    
    // Find all users
    const users = await User.find({});
    console.log(`Found ${users.length} users to process`);
    
    let updatedCount = 0;
    
    for (const user of users) {
      let needsUpdate = false;
      
      // Check if any rating fields are missing
      if (!user.rating) {
        user.rating = 1200;
        needsUpdate = true;
        console.log(`Initializing rating for user ${user.username}`);
      }
      
      if (!user.blunderRating) {
        user.blunderRating = 1200;
        needsUpdate = true;
        console.log(`Initializing blunderRating for user ${user.username}`);
      }
      
      if (!user.visualisationRating) {
        user.visualisationRating = 1200;
        needsUpdate = true;
        console.log(`Initializing visualisationRating for user ${user.username}`);
      }
      
      // Initialize stats if missing
      if (!user.stats) {
        user.stats = {
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
          },
          openingStats: {
            openings: []
          }
        };
        needsUpdate = true;
        console.log(`Initializing stats for user ${user.username}`);
      }
      
      if (needsUpdate) {
        await user.save();
        updatedCount++;
      }
    }
    
    console.log(`Updated ${updatedCount} users with missing rating fields`);
    
    // Create indexes for better performance
    await User.collection.createIndex({ rating: -1 });
    await User.collection.createIndex({ blunderRating: -1 });
    await User.collection.createIndex({ visualisationRating: -1 });
    console.log('Created indexes on rating fields');
    
    await mongoose.disconnect();
    console.log('User rating fix complete');
  } catch (error) {
    console.error('Error:', error);
    await mongoose.disconnect();
  }
}

fixUserRatings();
