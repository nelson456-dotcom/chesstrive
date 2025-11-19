const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
require('dotenv').config();

async function createAdminizUser() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/chessrep');
    console.log('Connected to MongoDB');

    // Check if adminiz user already exists
    const existingUser = await User.findOne({ username: 'adminiz' });
    if (existingUser) {
      console.log('Adminiz user already exists:');
      console.log('Username: adminiz');
      console.log('Email:', existingUser.email);
      console.log('User ID:', existingUser._id);
      return existingUser;
    }

    // Create adminiz user
    const hashedPassword = await bcrypt.hash('adminiz123', 10);
    const adminizUser = new User({
      email: 'adminiz@example.com',
      password: hashedPassword,
      username: 'adminiz',
      createdAt: new Date()
    });

    await adminizUser.save();
    console.log('Adminiz user created successfully:');
    console.log('Username: adminiz');
    console.log('Email: adminiz@example.com');
    console.log('Password: adminiz123');
    console.log('User ID:', adminizUser._id);
    return adminizUser;
  } catch (error) {
    console.error('Error creating adminiz user:', error);
  } finally {
    await mongoose.disconnect();
  }
}

createAdminizUser();