const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

/**
 * Migration script to ensure all users have userType field set
 * Sets default to 'free' for users without userType
 * Ensures adminiz1 is premium
 */
async function migrateUserTypes() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/chessrep';
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');

    // Find all users without userType or with null/undefined userType
    const usersWithoutType = await User.find({
      $or: [
        { userType: { $exists: false } },
        { userType: null },
        { userType: undefined }
      ]
    });

    console.log(`\nFound ${usersWithoutType.length} users without userType field`);

    // Set default to 'free' for users without userType
    if (usersWithoutType.length > 0) {
      const result = await User.updateMany(
        {
          $or: [
            { userType: { $exists: false } },
            { userType: null },
            { userType: undefined }
          ]
        },
        {
          $set: { userType: 'free' }
        }
      );
      console.log(`✅ Set userType to 'free' for ${result.modifiedCount} users`);
    }

    // Ensure adminiz1 is premium
    const adminiz1 = await User.findOne({ username: 'adminiz1' });
    if (adminiz1) {
      if (adminiz1.userType !== 'premium') {
        adminiz1.userType = 'premium';
        await adminiz1.save();
        console.log(`✅ Set adminiz1 to premium`);
      } else {
        console.log(`✅ adminiz1 is already premium`);
      }
    } else {
      console.log(`⚠️  adminiz1 user not found`);
    }

    // Verify all users now have userType
    const allUsers = await User.find({}).select('username email userType');
    console.log(`\n📊 Total users in database: ${allUsers.length}`);
    
    const premiumUsers = allUsers.filter(u => u.userType === 'premium');
    const freeUsers = allUsers.filter(u => u.userType === 'free');
    const usersStillWithoutType = allUsers.filter(u => !u.userType || u.userType === null || u.userType === undefined);

    console.log(`   - Premium users: ${premiumUsers.length}`);
    console.log(`   - Free users: ${freeUsers.length}`);
    console.log(`   - Users without type: ${usersStillWithoutType.length}`);

    if (premiumUsers.length > 0) {
      console.log(`\n👑 Premium users:`);
      premiumUsers.forEach(u => {
        console.log(`   - ${u.username} (${u.email})`);
      });
    }

    if (usersStillWithoutType.length > 0) {
      console.log(`\n⚠️  Users still without type:`);
      usersStillWithoutType.forEach(u => {
        console.log(`   - ${u.username} (${u.email})`);
      });
    }

    console.log(`\n✅ Migration complete!`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error during migration:', error);
    process.exit(1);
  }
}

migrateUserTypes();

