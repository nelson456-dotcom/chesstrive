const mongoose = require('mongoose');

const PuzzleSchema = new mongoose.Schema({
  fen: {
    type: String,
    required: true
  },
  moves: {
    type: [String],
    required: true
  },
  rating: {
    type: Number,
    required: true
  },
  ratingDeviation: {
    type: Number,
    required: true
  },
  popularity: {
    type: Number,
    required: true
  },
  nbPlays: {
    type: Number,
    required: true
  },
  themes: {
    type: [String],
    required: false // legacy, for migration only
  },
  theme: {
    type: String,
    index: true // for fast exact match
  },
  url: {
    type: String,
    required: true
  },
  solvedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  failedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  random: { type: Number, index: true, default: Math.random }
}, {
  timestamps: true
});

// Create indexes for better query performance
PuzzleSchema.index({ theme: 1, random: 1 });

const Puzzle = mongoose.model('Puzzle', PuzzleSchema);

module.exports = Puzzle; 