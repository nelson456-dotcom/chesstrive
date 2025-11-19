const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

async function upgradeAdminiz1() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/chessrep';
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');

    // Find user by username
    const user = await User.findOne({ username: 'adminiz1' });
    
    if (!user) {
      console.log('User "adminiz1" not found');
      process.exit(1);
    }

    // Upgrade to premium
    user.userType = 'premium';
    await user.save();

    console.log(`Successfully upgraded user "adminiz1" (${user.email}) to premium`);
    console.log(`User ID: ${user._id}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error upgrading user:', error);
    process.exit(1);
  }
}

upgradeAdminiz1();



