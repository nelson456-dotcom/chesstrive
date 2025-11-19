const mongoose = require('mongoose');

const LineSchema = new mongoose.Schema({
  name: { type: String, required: true },
  fen: { type: String, required: true },
  moves: { type: [String], required: true },
  moveExplanations: { type: [String], required: true },
  orientation: { type: String, enum: ['white', 'black'], default: 'white' },
  userSide: { type: String, enum: ['white', 'black'], default: 'white' }
}, { _id: false });

const OpeningSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  difficulty: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced'],
    required: true
  },
  category: {
    type: String,
    required: true
  },
  isFree: {
    type: Boolean,
    default: false
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  lines: {
    type: [LineSchema],
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Opening', OpeningSchema);

// Migration script to move top-level fen, moves, and moveExplanations into lines array for all openings
// Run this script once to fix existing data
const Opening = require('./Opening');

async function migrateOpenings() {
  await mongoose.connect('mongodb://localhost:27017/chessrep', { useNewUrlParser: true, useUnifiedTopology: true });
  const openings = await Opening.find({});
  for (const opening of openings) {
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
      await opening.save();
      console.log(`Migrated opening: ${opening.name}`);
    }
  }
  await mongoose.disconnect();
  console.log('Migration complete.');
}

if (require.main === module) {
  migrateOpenings();
} 