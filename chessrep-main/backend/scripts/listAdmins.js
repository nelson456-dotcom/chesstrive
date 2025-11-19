const mongoose = require('mongoose');
const User = require('../models/User');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/chessrep';

async function listAdmins() {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB\n');

    const admins = await User.find({ role: 'admin' }).select('username email role createdAt');
    
    console.log(`📋 Admin Users (${admins.length}):\n`);
    admins.forEach((admin, index) => {
      console.log(`${index + 1}. ${admin.username}`);
      console.log(`   Email: ${admin.email}`);
      console.log(`   Role: ${admin.role}`);
      console.log(`   Created: ${admin.createdAt}\n`);
    });

    mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error);
    mongoose.connection.close();
  }
}

listAdmins();











