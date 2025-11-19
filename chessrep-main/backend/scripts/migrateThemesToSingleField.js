const mongoose = require('mongoose');
const Puzzle = require('../models/Puzzle');

const MONGO_URI = 'mongodb://localhost:27017/chessrep';

async function migrateThemes() {
  await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  const batchSize = 500;
  let processed = 0;
  let created = 0;
  while (true) {
    // Only process puzzles that still have a 'themes' array
    const puzzles = await Puzzle.find({ themes: { $exists: true, $ne: [] } }).limit(batchSize);
    if (puzzles.length === 0) break;
    for (const puzzle of puzzles) {
      if (Array.isArray(puzzle.themes) && puzzle.themes.length > 0) {
        for (const theme of puzzle.themes) {
          const newPuzzle = { ...puzzle.toObject(), theme: theme.toLowerCase(), themes: undefined };
          delete newPuzzle._id;
          await Puzzle.create(newPuzzle);
          created++;
        }
        await Puzzle.deleteOne({ _id: puzzle._id });
      }
      processed++;
    }
    console.log(`Processed ${processed} puzzles, created ${created} new puzzles so far...`);
  }
  await mongoose.disconnect();
  console.log(`Migration complete. Created ${created} puzzles with single theme field.`);
}

migrateThemes(); 