const mongoose = require('mongoose');
const User = require('../models/User');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/chessrep', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function addUsernamesToExistingUsers() {
  try {
    console.log('Starting migration to add usernames to existing users...');
    
    // Find all users without usernames
    const usersWithoutUsernames = await User.find({ 
      $or: [
        { username: { $exists: false } },
        { username: null },
        { username: '' }
      ]
    });
    
    console.log(`Found ${usersWithoutUsernames.length} users without usernames`);
    
    for (let i = 0; i < usersWithoutUsernames.length; i++) {
      const user = usersWithoutUsernames[i];
      
      // Generate a unique username based on email
      let baseUsername = user.email.split('@')[0];
      let username = baseUsername;
      let counter = 1;
      
      // Keep trying until we find a unique username
      while (true) {
        const existingUser = await User.findOne({ username });
        if (!existingUser) {
          break;
        }
        username = `${baseUsername}${counter}`;
        counter++;
      }
      
      // Update the user with the new username
      user.username = username;
      await user.save();
      
      console.log(`Updated user ${user.email} with username: ${username}`);
    }
    
    console.log('Migration completed successfully!');
    
    // Verify the migration
    const usersStillWithoutUsernames = await User.find({ 
      $or: [
        { username: { $exists: false } },
        { username: null },
        { username: '' }
      ]
    });
    
    console.log(`Users still without usernames: ${usersStillWithoutUsernames.length}`);
    
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the migration
addUsernamesToExistingUsers(); 