const mongoose = require('mongoose');
const User = require('../models/User');

const MONGO_URI = 'mongodb://localhost:27017/chessrep';

async function initializeUserRatings() {
  try {
    await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Connected to MongoDB');
    
    // Find users without rating and set them to 1200
    const result = await User.updateMany(
      { rating: { $exists: false } },
      { $set: { rating: 1200 } }
    );
    
    console.log(`Initialized rating for ${result.modifiedCount} users`);
    
    // Create index on rating field for faster leaderboard queries
    await User.collection.createIndex({ rating: -1 });
    console.log('Created index on rating field');
    
    await mongoose.disconnect();
    console.log('User rating initialization complete');
  } catch (error) {
    console.error('Error:', error);
    await mongoose.disconnect();
  }
}

initializeUserRatings(); 