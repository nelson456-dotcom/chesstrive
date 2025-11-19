const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

/**
 * Script to verify and ensure a user is premium
 * This also helps debug if there are any issues
 */
async function forceRefreshUser(username) {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/chessrep';
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');

    // Find user by username
    const user = await User.findOne({ username: username });
    
    if (!user) {
      console.log(`User "${username}" not found`);
      process.exit(1);
    }

    console.log(`\nCurrent user data:`);
    console.log(`- Username: ${user.username}`);
    console.log(`- Email: ${user.email}`);
    console.log(`- User Type: ${user.userType || 'free (not set)'}`);
    console.log(`- User ID: ${user._id}`);

    // Ensure user is premium
    if (user.userType !== 'premium') {
      console.log(`\n⚠️  User is not premium. Upgrading...`);
      user.userType = 'premium';
      await user.save();
      console.log(`✅ User upgraded to premium!`);
    } else {
      console.log(`\n✅ User is already premium!`);
    }

    // Verify the save
    const updatedUser = await User.findById(user._id).select('username email userType');
    console.log(`\nVerified user data:`);
    console.log(JSON.stringify(updatedUser, null, 2));
    
    console.log(`\n📝 IMPORTANT: The user needs to log out and log back in for the changes to take effect in the frontend.`);
    console.log(`   Or they can refresh their profile page which should call /api/auth/me to get updated data.`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

const username = process.argv[2] || 'adminiz1';
forceRefreshUser(username);



