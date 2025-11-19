const mongoose = require('mongoose');
const User = require('../models/User');

// MongoDB connection string
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/chessrep';

async function makeAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB');

    // Find and update the user
    const username = 'adminiz1';
    const user = await User.findOne({ username: username });

    if (!user) {
      console.log(`❌ User '${username}' not found!`);
      console.log('Creating new admin user...');
      
      // Create the admin user if it doesn't exist
      const bcrypt = require('bcryptjs');
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);
      
      const newAdmin = new User({
        username: username,
        email: 'admin@chessupgrade.com',
        password: hashedPassword,
        role: 'admin'
      });
      
      await newAdmin.save();
      console.log(`✅ Created new admin user: ${username}`);
      console.log(`📧 Email: admin@chessupgrade.com`);
      console.log(`🔑 Password: admin123`);
    } else {
      // Update existing user to admin
      user.role = 'admin';
      await user.save();
      console.log(`✅ User '${username}' is now an admin!`);
      console.log(`📧 Email: ${user.email}`);
    }

    // Verify
    const updatedUser = await User.findOne({ username: username });
    console.log(`\n✅ Verification:`);
    console.log(`   Username: ${updatedUser.username}`);
    console.log(`   Role: ${updatedUser.role}`);
    console.log(`   Email: ${updatedUser.email}`);

    mongoose.connection.close();
    console.log('\n✅ Done! You can now login as admin.');
  } catch (error) {
    console.error('❌ Error:', error);
    mongoose.connection.close();
  }
}

makeAdmin();











