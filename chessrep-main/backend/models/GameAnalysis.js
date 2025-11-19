const mongoose = require('mongoose');

const moveSchema = new mongoose.Schema({
  index: { type: Number, required: true },
  move: { type: String },
  fen: { type: String },
  cp: { type: Number },
  evaluation: { type: Number },
  winPercent: { type: Number },
  bestCp: { type: Number },
  bestWinPercent: { type: Number },
  bestMove: { type: String },
  type: { type: String, enum: ['best', 'excellent', 'great', 'inaccuracy', 'mistake', 'blunder', 'miss', 'good', 'normal', 'book', 'interpolated', 'analyzed', 'brilliant'], default: 'normal' }
}, { _id: false });

const gameAnalysisSchema = new mongoose.Schema({
  game: { type: mongoose.Schema.Types.ObjectId, ref: 'Game', required: true, unique: true },
  result: { type: String }, // '1-0' | '0-1' | '1/2-1/2' | '*'
  moves: [moveSchema],
  counts: {
    best: { type: Number, default: 0 },
    excellent: { type: Number, default: 0 },
    great: { type: Number, default: 0 },
    good: { type: Number, default: 0 },
    inaccuracy: { type: Number, default: 0 },
    mistake: { type: Number, default: 0 },
    blunder: { type: Number, default: 0 },
    miss: { type: Number, default: 0 },
    total: { type: Number, default: 0 }
  },
  metrics: {
    advantageCapitalization: { type: Number, default: 0 }, // % of games converted after reaching +1.5
    resourcefulness: { type: Number, default: 0 },         // % of games saved after -1.5
    timeManagementBadMoves: { type: Number, default: 0 },  // placeholder count
    openingScoreCp: { type: Number, default: 0 },
    endgameCpLossPerMove: { type: Number, default: 0 },
    tacticsBlundersPerGame: { type: Number, default: 0 },
    accuracyPercent: { type: Number, default: 0 }
  }
}, { timestamps: true });

module.exports = mongoose.model('GameAnalysis', gameAnalysisSchema);

