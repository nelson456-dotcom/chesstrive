const mongoose = require('mongoose');

const PuzzleRushPuzzleSchema = new mongoose.Schema({
  fen: { type: String, required: true },
  moves: { type: [String], required: true },
  rating: { type: Number, required: true, index: true },
  theme: { type: String, index: true },
  difficulty: { type: String, enum: ['beginner', 'intermediate', 'advanced'], index: true },
  source: { type: String },
  random: { type: Number, index: true, default: Math.random },
}, {
  timestamps: true
});

// Helpful indexes
PuzzleRushPuzzleSchema.index({ rating: 1 });
PuzzleRushPuzzleSchema.index({ theme: 1 });
PuzzleRushPuzzleSchema.index({ difficulty: 1 });

const PuzzleRushPuzzle = mongoose.model('PuzzleRushPuzzle', PuzzleRushPuzzleSchema);

module.exports = PuzzleRushPuzzle;
