const mongoose = require('mongoose');
const Puzzle = require('../models/Puzzle');

const MONGO_URI = 'mongodb://localhost:27017/chessrep';

async function addRandomField() {
  await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  const puzzles = await Puzzle.find({}, '_id');
  let updated = 0;
  for (const puzzle of puzzles) {
    const random = Math.random();
    await Puzzle.updateOne({ _id: puzzle._id }, { $set: { random } });
    updated++;
    if (updated % 1000 === 0) console.log(`Updated ${updated} puzzles...`);
  }
  await mongoose.disconnect();
  console.log(`Added random field to ${updated} puzzles.`);
}

addRandomField(); 