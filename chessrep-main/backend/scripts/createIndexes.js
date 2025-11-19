const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/chessrep', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('MongoDB Connected');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
};

const createIndexes = async () => {
  try {
    await connectDB();
    const Puzzle = require('../models/Puzzle');
    await Puzzle.collection.createIndex({ rating: 1 });
    await Puzzle.collection.createIndex({ themes: 1 });
    await Puzzle.collection.createIndex({ rating: 1, themes: 1 });
    console.log('Indexes created successfully');
    process.exit(0);
  } catch (err) {
    console.error('Error creating indexes:', err.message);
    process.exit(1);
  }
};

createIndexes(); 