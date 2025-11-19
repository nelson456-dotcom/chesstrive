const mongoose = require('mongoose');
require('dotenv').config();

async function fixUsernameIndex() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/chessrep');
    console.log('Connected to MongoDB');

    // Get the users collection
    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');

    // Drop the existing username index
    try {
      await usersCollection.dropIndex('username_1');
      console.log('Dropped existing username index');
    } catch (error) {
      console.log('No existing username index to drop');
    }

    // Create the new sparse index
    await usersCollection.createIndex({ username: 1 }, { sparse: true, unique: true });
    console.log('Created new sparse username index');

    console.log('Username index fixed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error fixing username index:', error);
    process.exit(1);
  }
}

fixUsernameIndex(); 