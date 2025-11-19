const mongoose = require('mongoose');
const Puzzle = require('../models/Puzzle');
require('dotenv').config();

const puzzles = [
  {
    fen: "rnbq1rk1/ppp1bppp/5n2/3p4/3P4/2N2N2/PPP2PPP/R1BQKB1R b KQ - 0 6",
    moves: ["Bb4", "Bd2", "Re8+", "Be2", "Bg4", "Qd2", "Ne4", "Qd3", "Nxc3", "bxc3", "Qe7", "O-O", "Nd7", "Rfe1", "Qf6", "h3", "Bh5", "Rab1", "c6", "Bg5", "Qd6", "Ne5", "Bxg5", "Nxd7", "Bxd7", "Rxe8+", "Rxe8", "c4", "dxc4", "Qxc4", "Qc7"],
    rating: 1200,
    ratingDeviation: 90,
    popularity: 60,
    nbPlays: 120,
    themes: ["middlegame", "fork", "advantage"],
    url: "https://lichess.org/training/94633"
  },
  {
    fen: "8/8/8/4k3/8/8/6R1/8 w - - 0 1",
    moves: ["Rg5+", "Kf6", "Rg6+", "Ke7", "Rg7+", "Kf8", "Rh7", "Kg8", "Ra7", "Kf8", "Rb7", "Kg8", "Rc7", "Kf8", "Rd7", "Kg8", "Re7", "Kf8", "Rf7+", "Kg8", "Rg7+", "Kf8", "Rh7"],
    rating: 1000,
    ratingDeviation: 80,
    popularity: 50,
    nbPlays: 100,
    themes: ["endgame", "rookEndgame", "mateIn1"],
    url: "https://lichess.org/training/94632"
  },
  {
    fen: "r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 0 3",
    moves: ["Bc5", "O-O", "Nf6", "d4", "Bxd4", "Nxd4", "Qxd4", "Qe2", "O-O", "Bd3", "d6", "c3", "Be6", "Qe3", "Qd7", "Bd2", "Rfe8", "Rfe1", "Bf8", "Qf4", "Qd8", "Rad1", "Qc7", "Qh4", "h6", "Qf4", "Qd8", "Qh4", "Qc7"],
    rating: 1100,
    ratingDeviation: 85,
    popularity: 55,
    nbPlays: 110,
    themes: ["opening", "fork", "tactics"],
    url: "https://lichess.org/training/94634"
  },
  {
    fen: "r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 0 3",
    moves: ["Bc5", "O-O", "Nf6", "d4", "Bxd4", "Nxd4", "Qxd4", "Qe2", "O-O", "Bd3", "d6", "c3", "Be6", "Qe3", "Qd7", "Bd2", "Rfe8", "Rfe1", "Bf8", "Qf4", "Qd8", "Rad1", "Qc7", "Qh4", "h6", "Qf4", "Qd8", "Qh4", "Qc7"],
    rating: 1300,
    ratingDeviation: 95,
    popularity: 65,
    nbPlays: 130,
    themes: ["middlegame", "fork", "tactics"],
    url: "https://lichess.org/training/94635"
  },
  {
    fen: "r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 0 3",
    moves: ["Bc5", "O-O", "Nf6", "d4", "Bxd4", "Nxd4", "Qxd4", "Qe2", "O-O", "Bd3", "d6", "c3", "Be6", "Qe3", "Qd7", "Bd2", "Rfe8", "Rfe1", "Bf8", "Qf4", "Qd8", "Rad1", "Qc7", "Qh4", "h6", "Qf4", "Qd8", "Qh4", "Qc7"],
    rating: 1500,
    ratingDeviation: 100,
    popularity: 70,
    nbPlays: 150,
    themes: ["endgame", "fork", "tactics"],
    url: "https://lichess.org/training/94636"
  }
];

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/chessrep', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('MongoDB Connected');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
};

const initPuzzles = async () => {
  try {
    await connectDB();
    
    // Clear existing puzzles
    await Puzzle.deleteMany({});
    console.log('Cleared existing puzzles');
    
    // Insert new puzzles
    await Puzzle.insertMany(puzzles);
    console.log('Added initial puzzles');
    
    // Verify puzzles were added
    const count = await Puzzle.countDocuments();
    console.log(`Total puzzles in database: ${count}`);
    
    // Log puzzles by theme
    const themes = await Puzzle.distinct('themes');
    console.log('Available themes:', themes);
    
    process.exit(0);
  } catch (err) {
    console.error('Error initializing puzzles:', err);
    process.exit(1);
  }
};

initPuzzles(); 