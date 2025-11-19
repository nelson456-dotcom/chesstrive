const mongoose = require('mongoose');
const User = require('./models/User');
const { updateUserRating } = require('./utils/ratingUtils');

const MONGO_URI = 'mongodb://localhost:27017/chessrep';

async function testRatingSystem() {
  try {
    await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Connected to MongoDB');

    // Find a test user
    const user = await User.findOne({});
    if (!user) {
      console.log('No users found in database');
      return;
    }

    console.log('Testing with user:', user.username);
    console.log('Initial ratings:', {
      rating: user.rating,
      blunderRating: user.blunderRating,
      visualisationRating: user.visualisationRating
    });

    // Test rating update
    const result = await updateUserRating(user._id, 'rating', 1200, true);
    console.log('Rating update result:', result);

    // Check updated user
    const updatedUser = await User.findById(user._id);
    console.log('Updated ratings:', {
      rating: updatedUser.rating,
      blunderRating: updatedUser.blunderRating,
      visualisationRating: updatedUser.visualisationRating
    });

    await mongoose.disconnect();
    console.log('Test completed');
  } catch (error) {
    console.error('Test error:', error);
    await mongoose.disconnect();
  }
}

testRatingSystem();
