const mongoose = require('mongoose');
const Puzzle = require('../models/Puzzle');

const MONGO_URI = 'mongodb://localhost:27017/chessrep';

async function addRandomField() {
  try {
    await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Connected to MongoDB');
    
    // Update all puzzles that don't have a random field
    const result = await Puzzle.updateMany(
      { random: { $exists: false } },
      [{ $set: { random: { $rand: {} } } }]
    );
    
    console.log(`Updated ${result.modifiedCount} puzzles with random field`);
    
    // Create index on random field for faster queries
    await Puzzle.collection.createIndex({ random: 1 });
    console.log('Created index on random field');
    
    await mongoose.disconnect();
    console.log('Random field migration complete');
  } catch (error) {
    console.error('Error:', error);
    await mongoose.disconnect();
  }
}

addRandomField(); 