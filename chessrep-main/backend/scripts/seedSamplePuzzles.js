const mongoose = require('mongoose');
const { Chess } = require('chess.js');
const Puzzle = require('../models/Puzzle');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/chessrep';

// Minimal set of sample puzzles, one per main theme
const samples = [
  {
    theme: 'fork',
    fen: 'r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 2 4',
    moves: ['Bxf7+','Kxf7','Nxe5+'],
  },
  {
    theme: 'pin',
    fen: 'rnbqkb1r/pppp1ppp/5n2/4p3/1P6/2N2N2/P1PPPPPP/R1BQKB1R b KQkq - 1 3',
    moves: ['Bxb4','Nxe5','O-O'],
  },
  {
    theme: 'skewer',
    fen: 'r3k2r/pp1bbppp/2n1pn2/q2p4/3P4/2N1PN2/PPQ1BPPP/R1B2RK1 w kq - 2 10',
    moves: ['Bd2','Qc7','Nb5'],
  },
  {
    theme: 'discovered_attack',
    fen: 'r2qkbnr/ppp2ppp/2np4/4p3/3PP3/2N2N2/PPP2PPP/R1BQKB1R w KQkq - 4 5',
    moves: ['d5','Nce7','Bb5+'],
  },
  {
    theme: 'back_rank_mate',
    fen: '6k1/5ppp/8/8/8/8/PPP2PPP/R3R1K1 w - - 0 1',
    moves: ['Re8#'],
  },
];

(async () => {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  for (const s of samples) {
    try {
      const g = new Chess(s.fen);
      let ok = true;
      for (const m of s.moves) {
        if (!g.move(m, { sloppy: true })) {
          ok = false;
          break;
        }
      }
      if (!ok) {
        console.log(`Skipping sample for ${s.theme} – illegal move sequence`);
        continue;
      }
      await Puzzle.create({
        fen: s.fen,
        moves: s.moves,
        rating: 1200,
        ratingDeviation: 80,
        popularity: 50,
        nbPlays: 100,
        theme: s.theme,
        themes: [s.theme],
        url: 'local'
      });
      console.log(`Inserted sample puzzle for theme '${s.theme}'`);
    } catch (e) {
      console.log(`Error inserting sample for ${s.theme}:`, e.message);
    }
  }

  process.exit(0);
})(); 