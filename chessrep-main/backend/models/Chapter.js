const mongoose = require('mongoose');

const chapterSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  notes: {
    type: String,
    default: ''
  },
  studyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Study',
    required: true
  },
  pgn: {
    type: String,
    default: ''
  },
  position: {
    type: String,
    default: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
  },
  gameTree: {
    moves: [{
      id: String,
      move: String,
      notation: String,
      san: String, // Standard Algebraic Notation
      from: String,
      to: String,
      color: String,
      piece: String,
      captured: String,
      promotion: String,
      flags: String,
      variations: [{
        id: String,
        moves: [{
          id: String,
          move: String,
          notation: String,
          san: String,
          from: String,
          to: String,
          color: String,
          piece: String,
          captured: String,
          promotion: String,
          flags: String,
          variations: [] // Allow nested variations (recursive)
        }],
        parentMoveIndex: Number,
        depth: Number
      }]
    }],
    variations: [{
      id: String,
      moves: [String], // Array of move strings (legacy support)
      parentMoveIndex: Number
    }],
    currentMove: {
      type: Number,
      default: 0
    }
  },
  currentPath: [{
    varIndex: Number,
    branchPoint: Number
  }],
  currentMoveIndex: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
chapterSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Chapter', chapterSchema);