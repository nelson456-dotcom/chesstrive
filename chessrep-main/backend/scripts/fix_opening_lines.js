const mongoose = require('mongoose');

const uri = 'mongodb://localhost:27017/chessrep';
const Opening = require('../models/Opening');

async function fixOpenings() {
  await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
  const openings = await Opening.find({});
  let fixed = 0;
  for (const opening of openings) {
    if (opening.fen && opening.moves && opening.moves.length > 0) {
      // Always add to lines, even if lines exists
      opening.lines = [{
        name: 'Main Line',
        fen: opening.fen,
        moves: opening.moves,
        moveExplanations: opening.moveExplanations || []
      }];
      opening.fen = undefined;
      opening.moves = undefined;
      opening.moveExplanations = undefined;
      await opening.save();
      console.log(`Fixed opening: ${opening.name}`);
      fixed++;
    }
  }
  await mongoose.disconnect();
  console.log(`Done. Fixed ${fixed} openings.`);
}

if (require.main === module) {
  fixOpenings();
} 