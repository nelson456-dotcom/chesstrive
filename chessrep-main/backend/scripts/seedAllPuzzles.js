const mongoose = require('mongoose');
const Puzzle = require('../models/Puzzle');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/chessrep', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const puzzlesByTheme = {
  fork: [
    { fen: "r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4", moves: ["Ng5", "d5", "exd5", "Nxd5", "Nxf7"], rating: 1400, url: "https://lichess.org/training/61373" },
    { fen: "2r2rk1/pp1b1ppp/1q2p3/2bpP3/3n1P2/2Q1BN2/PP2B1PP/R4RK1 w - - 0 16", moves: ["Nxd4", "Bxd4", "Qxd4", "Rxe2"], rating: 1500, url: "https://lichess.org/training/61374" },
    { fen: "r1bq1rk1/pp2bppp/2n1pn2/2p5/3pP3/3P1N2/PPPBNPPP/R2QKB1R w KQ - 2 9", moves: ["Nxd4", "cxd4", "Bxd4", "Qxd4"], rating: 1450, url: "https://lichess.org/training/61385" },
    { fen: "rnbqkb1r/ppp2ppp/5n2/3pp3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 4", moves: ["Nxe5", "Nxe5", "Qd5", "Nc6"], rating: 1350, url: "https://lichess.org/training/61386" },
    { fen: "r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4", moves: ["Nxe5", "Nxe5", "Qd5", "Nc6"], rating: 1300, url: "https://lichess.org/training/61387" },
    { fen: "rnbqkb1r/pppp1ppp/5n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 2 3", moves: ["Nxe5", "Nxe5", "Qd5", "Nc6"], rating: 1250, url: "https://lichess.org/training/61388" },
    { fen: "r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4", moves: ["Nxe5", "Nxe5", "Qd5", "Nc6"], rating: 1200, url: "https://lichess.org/training/61389" },
    { fen: "rnbqkb1r/pppp1ppp/5n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 2 3", moves: ["Nxe5", "Nxe5", "Qd5", "Nc6"], rating: 1150, url: "https://lichess.org/training/61390" },
  ],
  pin: [
    { fen: "r1b1k2r/pp1p1ppp/1qn2n2/2b1p3/4P3/2P2N2/PP2BPPP/RNBQ1RK1 b kq - 3 8", moves: ["Nxe4", "Qd4", "exd4", "cxd4"], rating: 1600, url: "https://lichess.org/training/61375" },
    { fen: "r1bq1rk1/pp2bppp/2n1pn2/2p5/3pP3/3P1N2/PPPBNPPP/R2QKB1R w KQ - 2 9", moves: ["g3", "e5", "Bg2", "Ne8"], rating: 1550, url: "https://lichess.org/training/61376" },
  ],
  skewer: [
    { fen: "6k1/p4p1p/6p1/8/8/5P2/P5PP/4R1K1 b - - 0 29", moves: ["Kg7", "Re7", "a5", "Ra7"], rating: 1300, url: "https://lichess.org/training/61377" },
    { fen: "8/5pk1/R5p1/7p/7P/5PK1/6P1/4r3 w - - 3 41", moves: ["Kf4", "Re2", "g3", "Re1"], rating: 1400, url: "https://lichess.org/training/61378" },
  ],
  discovered_attack: [
    { fen: "r2q1rk1/1p1bbppp/p1np1n2/4p3/4P3/1NN1BP2/PPPQ2PP/2KR1B1R b - - 0 11", moves: ["b5", "g4", "b4", "Nd4"], rating: 1700, url: "https://lichess.org/training/61379" },
    { fen: "rnbq1rk1/4bppp/p2p1n2/1p2p3/4P3/1NN1BP2/PPPQ2PP/R3KB1R w KQ - 2 10", moves: ["Nd5", "Nxd5", "exd5", "Bb7"], rating: 1650, url: "https://lichess.org/training/61380" },
  ],
  endgame: [
    { fen: "8/8/5p2/5k2/5P2/4K3/8/8 w - - 1 54", moves: ["Kf3", "Kg6", "Kg4", "f5+"], rating: 1200, url: "https://lichess.org/training/61381" },
    { fen: "8/8/8/4k3/8/5K2/p7/8 w - - 0 60", moves: ["Ke3", "a1Q", "Kd3", "Qd4+"], rating: 1300, url: "https://lichess.org/training/61382" },
  ],
  mate: [
    { fen: "r1bq1bnr/pppp1Qpp/2nk4/4p3/2B1P3/8/PPPP1PPP/RNB1K1NR w KQ - 3 5", moves: ["Qd5#"], rating: 1100, url: "https://lichess.org/training/61383" },
    { fen: "rnb1kbnr/pppp1ppp/8/4p3/6Pq/5P2/PPPPP2P/RNBQKBNR w KQkq - 1 3", moves: ["Rg1#"], rating: 1000, url: "https://lichess.org/training/61384" },
  ],
  opening: [
    { fen: "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2", moves: ["Nf3", "Nc6", "Bb5", "a6"], rating: 1000, url: "https://lichess.org/training/opening1" },
    { fen: "rnbqkbnr/pp1ppppp/8/2p5/4P3/8/PPPP1PPP/RNBQKBNR w KQkq c6 0 2", moves: ["Nf3", "d6", "d4", "cxd4"], rating: 1100, url: "https://lichess.org/training/opening2" },
  ],
  middlegame: [
    { fen: "r1bq1rk1/pp2bppp/2n1pn2/2p5/3pP3/3P1N2/PPPBNPPP/R2QKB1R w KQ - 2 9", moves: ["g3", "e5", "Bg2", "Ne8"], rating: 1400, url: "https://lichess.org/training/middlegame1" },
    { fen: "r2q1rk1/1p1bbppp/p1np1n2/4p3/4P3/1NN1BP2/PPPQ2PP/2KR1B1R b - - 0 11", moves: ["b5", "g4", "b4", "Nd4"], rating: 1500, url: "https://lichess.org/training/middlegame2" },
  ]
};

const allPuzzles = [];
for (const theme in puzzlesByTheme) {
  puzzlesByTheme[theme].forEach(puzzle => {
    allPuzzles.push({
      ...puzzle,
      theme: theme,
      themes: [theme],
      ratingDeviation: 50,
      popularity: 100,
      nbPlays: 1000,
      solution: puzzle.moves,
      explanation: `A puzzle with the theme: ${theme}`
    });
  });
}

async function seedPuzzles() {
  try {
    console.log('Clearing existing puzzles...');
    await Puzzle.deleteMany({});
    
    console.log('Seeding puzzles for all themes...');
    await Puzzle.insertMany(allPuzzles);
    
    console.log(`✅ Successfully seeded ${allPuzzles.length} puzzles.`);
    console.log(`Themes included: ${Object.keys(puzzlesByTheme).join(', ')}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding puzzles:', error);
    process.exit(1);
  }
}

seedPuzzles(); 