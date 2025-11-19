const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  platform: { type: String, enum: ['chesscom', 'lichess', 'chessrep'], required: true },
  gameUrl: { type: String },
  pgn: { type: String, required: true },
  endTime: { type: Date },
  importedAt: { type: Date, default: Date.now },
  analysed: { type: Boolean, default: false },
  whiteUsername: { type: String },
  blackUsername: { type: String },
  result: { type: String }, // '1-0' | '0-1' | '1/2-1/2' | '*'
  timeControl: { type: String },
  timeClass: { type: String } // bullet | blitz | rapid | classical | daily
}, {
  timestamps: true
});

gameSchema.index({ user: 1, gameUrl: 1 }, { unique: true });

module.exports = mongoose.model('Game', gameSchema);
