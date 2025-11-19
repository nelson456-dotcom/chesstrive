const mongoose = require('mongoose');
const Puzzle = require('../models/Puzzle');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/chessrep', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const tacticalPuzzles = [
  // Fork Puzzles
  {
    fen: "r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 1",
    moves: ["Ng5", "d6", "Nxf7"],
    rating: 1200,
    ratingDeviation: 50,
    popularity: 100,
    nbPlays: 1000,
    themes: ["fork"],
    theme: "fork",
    url: "https://lichess.org/training/fork1",
    solution: ["Ng5", "d6", "Nxf7"],
    explanation: "Knight fork attacks king and rook"
  },
  {
    fen: "rnbqkb1r/ppp2ppp/3p1n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 1",
    moves: ["Ng5", "d5", "Nxf7"],
    rating: 1100,
    ratingDeviation: 50,
    popularity: 100,
    nbPlays: 1000,
    themes: ["fork"],
    theme: "fork", 
    url: "https://lichess.org/training/fork2",
    solution: ["Ng5", "d5", "Nxf7"],
    explanation: "Knight fork wins material"
  },
  {
    fen: "r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/3P1N2/PPP2PPP/RNBQK2R w KQkq - 0 1",
    moves: ["Ng5", "Nh5", "Nxf7"],
    rating: 1300,
    ratingDeviation: 60,
    popularity: 90,
    nbPlays: 800,
    themes: ["fork"],
    theme: "fork",
    url: "https://lichess.org/training/fork3",
    solution: ["Ng5", "Nh5", "Nxf7"],
    explanation: "Knight forks king and queen"
  },
  // Pin Puzzles
  {
    fen: "r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 0 1",
    moves: ["Bg4", "h3", "Bxf3"],
    rating: 1150,
    ratingDeviation: 50,
    popularity: 95,
    nbPlays: 900,
    themes: ["pin"],
    theme: "pin",
    url: "https://lichess.org/training/pin1",
    solution: ["Bg4", "h3", "Bxf3"],
    explanation: "Pin the knight to the queen"
  },
  {
    fen: "rnbqkb1r/ppp2ppp/3p1n2/4p3/4P3/3P1N2/PPP2PPP/RNBQKB1R b KQkq - 0 1",
    moves: ["Bg4", "Be2", "Bxf3"],
    rating: 1200,
    ratingDeviation: 55,
    popularity: 85,
    nbPlays: 750,
    themes: ["pin"],
    theme: "pin",
    url: "https://lichess.org/training/pin2",
    solution: ["Bg4", "Be2", "Bxf3"],
    explanation: "Pin wins the knight"
  },
  // Skewer Puzzles
  {
    fen: "6k1/5ppp/8/8/8/8/5PPP/R5K1 w - - 0 1",
    moves: ["Ra8+", "Kh7", "Ra7"],
    rating: 1000,
    ratingDeviation: 40,
    popularity: 80,
    nbPlays: 600,
    themes: ["skewer"],
    theme: "skewer",
    url: "https://lichess.org/training/skewer1",
    solution: ["Ra8+", "Kh7", "Ra7"],
    explanation: "Skewer wins the pawn"
  },
  // Discovered Attack
  {
    fen: "r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 1",
    moves: ["Nd4", "Nxd4", "exd4"],
    rating: 1250,
    ratingDeviation: 60,
    popularity: 75,
    nbPlays: 650,
    themes: ["discovered_attack"],
    theme: "discovered_attack",
    url: "https://lichess.org/training/discovered1",
    solution: ["Nd4", "Nxd4", "exd4"],
    explanation: "Discovered attack on the knight"
  },
  // Deflection
  {
    fen: "r2qkb1r/ppp2ppp/2np1n2/4p3/2B1P3/3P1N2/PPP2PPP/RNBQK2R w KQkq - 0 1",
    moves: ["Bxf7+", "Kxf7", "Ng5+"],
    rating: 1400,
    ratingDeviation: 70,
    popularity: 85,
    nbPlays: 700,
    themes: ["deflection"],
    theme: "deflection", 
    url: "https://lichess.org/training/deflection1",
    solution: ["Bxf7+", "Kxf7", "Ng5+"],
    explanation: "Deflect the king to win material"
  },
  // Sacrifice
  {
    fen: "r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 1",
    moves: ["Bxf7+", "Kxf7", "Ng5+"],
    rating: 1350,
    ratingDeviation: 65,
    popularity: 90,
    nbPlays: 800,
    themes: ["sacrifice"],
    theme: "sacrifice",
    url: "https://lichess.org/training/sacrifice1", 
    solution: ["Bxf7+", "Kxf7", "Ng5+"],
    explanation: "Sacrifice for a winning attack"
  }
];

async function seedPuzzles() {
  try {
    console.log('Clearing existing puzzles...');
    await Puzzle.deleteMany({});
    
    console.log('Seeding tactical puzzles...');
    await Puzzle.insertMany(tacticalPuzzles);
    
    console.log(`✅ Successfully seeded ${tacticalPuzzles.length} tactical puzzles`);
    console.log('Themes included: fork, pin, skewer, discovered_attack, deflection, sacrifice');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding puzzles:', error);
    process.exit(1);
  }
}

seedPuzzles(); 