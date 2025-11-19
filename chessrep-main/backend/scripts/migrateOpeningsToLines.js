// migrateOpeningsToLines.js
const mongoose = require('mongoose');
const Opening = require('../models/Opening');

const MONGO_URI = 'mongodb://localhost:27017/chessrep'; // Change if your DB URI is different

async function migrate() {
  await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

  const openings = await Opening.find({});
  for (const opening of openings) {
    let updated = false;
    // If opening has top-level fen and moves, but no lines or empty lines
    if ((!opening.lines || opening.lines.length === 0) && opening.fen && opening.moves && opening.moves.length > 0) {
      opening.lines = [{
        name: 'Main Line',
        fen: opening.fen,
        moves: opening.moves,
        moveExplanations: opening.moveExplanations || []
      }];
      opening.fen = undefined;
      opening.moves = undefined;
      opening.moveExplanations = undefined;
      updated = true;
      console.log('Migrated opening:', opening.name);
    }
    // Optionally, add a warning if lines exist but are missing moves
    if (opening.lines && opening.lines.length > 0) {
      for (const line of opening.lines) {
        if (!line.moves || line.moves.length === 0) {
          console.warn('Warning: Opening', opening.name, 'has a line with no moves.');
        }
      }
    }
    if (updated) {
      await opening.save();
    }
  }
  await mongoose.disconnect();
  console.log('Migration complete.');
}

migrate(); 