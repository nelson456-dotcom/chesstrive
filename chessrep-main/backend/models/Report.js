const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  username: {
    type: String,
    required: true
  },
  platform: {
    type: String,
    required: true,
    enum: ['chesscom', 'lichess', 'auto']
  },
  timeClass: {
    type: String,
    required: true
  },
  // Store the complete report data
  reportData: {
    summary: mongoose.Schema.Types.Mixed,
    metrics: mongoose.Schema.Types.Mixed,
    scouting: mongoose.Schema.Types.Mixed,
    peerComparison: mongoose.Schema.Types.Mixed
  },
  // Store metadata for quick display
  metadata: {
    playerRating: Number,
    ratingSource: String,
    ratingRange: String,
    playerStats: {
      opening: Number,
      tactics: Number,
      ending: Number,
      advantage: Number,
      resourcefulness: Number,
      timeManagement: Number
    },
    createdAt: Date
  }
}, {
  timestamps: true
});

// Index for faster queries
reportSchema.index({ user: 1, createdAt: -1 });
reportSchema.index({ user: 1, username: 1, platform: 1, timeClass: 1 });

const Report = mongoose.model('Report', reportSchema);

module.exports = Report;


