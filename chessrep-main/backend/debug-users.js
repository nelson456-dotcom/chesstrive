const mongoose = require('mongoose');
const User = require('./models/User');

async function debugUsers() {
  try {
    await mongoose.connect('mongodb://localhost:27017/chessrep');
    console.log('Connected to database');
    
    const users = await User.find({});
    console.log(`Found ${users.length} users in database:`);
    
    users.forEach((user, i) => {
      console.log(`${i+1}. User ID: ${user._id}`);
      console.log(`   Username: ${user.username}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log('---');
    });
    
    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
  }
}

debugUsers();


