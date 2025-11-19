const mongoose = require('mongoose');

const practiceSessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  openingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Opening',
    required: true
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  },
  successRate: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  mistakes: [{
    move: {
      type: String,
      required: true
    },
    correctMove: {
      type: String,
      required: true
    },
    explanation: {
      type: String,
      required: true
    },
    frequency: {
      type: Number,
      default: 1
    }
  }],
  moves: [{
    move: String,
    isCorrect: Boolean,
    timestamp: Date
  }]
}, {
  timestamps: true
});

// Index for faster queries
practiceSessionSchema.index({ userId: 1, startTime: -1 });
practiceSessionSchema.index({ openingId: 1, userId: 1 });

module.exports = mongoose.model('PracticeSession', practiceSessionSchema); 