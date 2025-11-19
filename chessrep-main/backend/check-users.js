const mongoose = require('mongoose');

async function checkUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/chessrep');
    console.log('✅ Connected to MongoDB');
    
    const User = require('./models/User');
    const userCount = await User.countDocuments();
    console.log(`👥 Total users: ${userCount}`);
    
    if (userCount > 0) {
      const users = await User.find().limit(5).lean();
      console.log('\n📝 Sample users:');
      users.forEach((user, index) => {
        console.log(`${index + 1}. ${user.username} - Rating: ${user.rating || 'Not set'}`);
        if (user.stats && user.stats.puzzleStats) {
          console.log(`   Puzzle Stats: ${user.stats.puzzleStats.totalSolved || 0} solved, ${user.stats.puzzleStats.totalAttempted || 0} attempted`);
        }
      });
    }
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkUsers();


