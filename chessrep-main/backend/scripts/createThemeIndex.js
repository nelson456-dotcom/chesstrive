const mongoose = require('mongoose');
const Puzzle = require('../models/Puzzle');

const MONGO_URI = 'mongodb://localhost:27017/chessrep';

async function createThemeIndex() {
  try {
    await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Connected to MongoDB');
    
    // Create index on theme field
    await Puzzle.collection.createIndex({ theme: 1 });
    console.log('Created index on theme field');
    
    // Create index on rating field
    await Puzzle.collection.createIndex({ rating: 1 });
    console.log('Created index on rating field');
    
    // Create compound index for theme + rating queries
    await Puzzle.collection.createIndex({ theme: 1, rating: 1 });
    console.log('Created compound index on theme + rating');
    
    await mongoose.disconnect();
    console.log('Index creation complete');
  } catch (error) {
    console.error('Error:', error);
    await mongoose.disconnect();
  }
}

createThemeIndex(); 