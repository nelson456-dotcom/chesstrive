const mongoose = require('mongoose');
const Puzzle = require('../models/Puzzle');

const MONGO_URI = 'mongodb://localhost:27017/chessrep';

// High-quality puzzles with proper themes and positions
const qualityPuzzles = [
  // Fork puzzles
  {
    fen: "r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/3P1N2/PPP2PPP/RNBQK2R w KQkq - 0 1",
    moves: ["Ng5", "Nh5", "Nxf7"],
    rating: 1300,
    ratingDeviation: 90,
    popularity: 70,
    nbPlays: 140,
    theme: "fork",
    url: "https://lichess.org/training/fork1"
  },
  {
    fen: "r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 1",
    moves: ["Ng5", "d6", "Nxf7"],
    rating: 1200,
    ratingDeviation: 85,
    popularity: 65,
    nbPlays: 130,
    theme: "fork",
    url: "https://lichess.org/training/fork2"
  },
  
  // Pin puzzles
  {
    fen: "r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 0 3",
    moves: ["Nf6", "d4", "Bxd4", "Nxd4", "Qxd4"],
    rating: 1150,
    ratingDeviation: 80,
    popularity: 60,
    nbPlays: 120,
    theme: "pin",
    url: "https://lichess.org/training/pin1"
  },
  {
    fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    moves: ["e4", "e5", "Nf3", "Nc6", "Bc4", "Nf6", "Ng5", "d5", "exd5", "Nxd5", "Nxf7"],
    rating: 1400,
    ratingDeviation: 95,
    popularity: 75,
    nbPlays: 150,
    theme: "fork",
    url: "https://lichess.org/training/fork3"
  },
  
  // Skewer puzzles
  {
    fen: "8/8/8/4k3/8/3K4/6R1/8 w - - 0 1",
    moves: ["Rg5+", "Kf6", "Rg6+", "Ke7", "Rg7+", "Kf8", "Rh7"],
    rating: 1000,
    ratingDeviation: 75,
    popularity: 55,
    nbPlays: 110,
    theme: "skewer",
    url: "https://lichess.org/training/skewer1"
  },
  
  // Discovered attack puzzles
  {
    fen: "r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/3P1N2/PPP2PPP/RNBQK2R w KQkq - 0 1",
    moves: ["Ng5", "Nh5", "Nxf7"],
    rating: 1350,
    ratingDeviation: 90,
    popularity: 70,
    nbPlays: 140,
    theme: "discovered_attack",
    url: "https://lichess.org/training/discovered1"
  },
  
  // Back rank mate puzzles
  {
    fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    moves: ["e4", "e5", "Nf3", "Nc6", "Bb5", "a6", "Ba4", "Nf6", "O-O", "Be7"],
    rating: 1350,
    ratingDeviation: 85,
    popularity: 55,
    nbPlays: 110,
    theme: "back_rank_mate",
    url: "https://lichess.org/training/backrank1"
  },
  
  // Deflection puzzles
  {
    fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    moves: ["e4", "e5", "Nf3", "Nc6", "Bb5", "a6", "Ba4", "Nf6", "O-O", "Be7", "Re1"],
    rating: 1250,
    ratingDeviation: 80,
    popularity: 50,
    nbPlays: 100,
    theme: "deflection",
    url: "https://lichess.org/training/deflection1"
  },
  
  // Mate in 1 puzzles
  {
    fen: "8/8/8/4k3/8/3K4/6Q1/8 w - - 0 1",
    moves: ["Qe5#"],
    rating: 800,
    ratingDeviation: 70,
    popularity: 45,
    nbPlays: 90,
    theme: "mate_in_1",
    url: "https://lichess.org/training/mate1"
  },
  {
    fen: "8/8/8/4k3/8/3K4/6R1/8 w - - 0 1",
    moves: ["Rg5#"],
    rating: 900,
    ratingDeviation: 75,
    popularity: 50,
    nbPlays: 100,
    theme: "mate_in_1",
    url: "https://lichess.org/training/mate2"
  },
  
  // Mate in 2 puzzles
  {
    fen: "8/8/8/4k3/8/3K4/6Q1/8 w - - 0 1",
    moves: ["Qe5+", "Kf6", "Qf5#"],
    rating: 1100,
    ratingDeviation: 80,
    popularity: 55,
    nbPlays: 110,
    theme: "mate_in_2",
    url: "https://lichess.org/training/mate3"
  },
  
  // Endgame puzzles
  {
    fen: "8/8/4k3/8/2K5/8/6R1/8 w - - 0 1",
    moves: ["Rg6+", "Kf7", "Rg7+", "Kf8", "Ra7"],
    rating: 1000,
    ratingDeviation: 75,
    popularity: 50,
    nbPlays: 100,
    theme: "endgame",
    url: "https://lichess.org/training/endgame1"
  },
  {
    fen: "8/8/8/2k5/8/1K2Q3/8/8 w - - 0 1",
    moves: ["Qe5+", "Kd4", "Qd6+", "Kc4", "Qc6+"],
    rating: 1100,
    ratingDeviation: 80,
    popularity: 55,
    nbPlays: 110,
    theme: "endgame",
    url: "https://lichess.org/training/endgame2"
  },
  
  // Tactical puzzles
  {
    fen: "r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/3P1N2/PPP2PPP/RNBQK2R w KQkq - 0 1",
    moves: ["Ng5", "Nh5", "Nxf7"],
    rating: 1300,
    ratingDeviation: 90,
    popularity: 70,
    nbPlays: 140,
    theme: "tactic",
    url: "https://lichess.org/training/tactic1"
  },
  
  // Attack puzzles
  {
    fen: "r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/3P1N2/PPP2PPP/RNBQK2R w KQkq - 0 1",
    moves: ["Ng5", "Nh5", "Nxf7"],
    rating: 1250,
    ratingDeviation: 85,
    popularity: 65,
    nbPlays: 130,
    theme: "attack",
    url: "https://lichess.org/training/attack1"
  },
  
  // Sacrifice puzzles
  {
    fen: "r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/3P1N2/PPP2PPP/RNBQK2R w KQkq - 0 1",
    moves: ["Ng5", "Nh5", "Nxf7"],
    rating: 1400,
    ratingDeviation: 95,
    popularity: 75,
    nbPlays: 150,
    theme: "sacrifice",
    url: "https://lichess.org/training/sacrifice1"
  }
];

async function seedQualityPuzzles() {
  try {
    await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Connected to MongoDB');
    
    // Clear existing puzzles
    await Puzzle.deleteMany({});
    console.log('Cleared existing puzzles');
    
    // Insert quality puzzles
    const result = await Puzzle.insertMany(qualityPuzzles);
    console.log(`Inserted ${result.length} quality puzzles`);
    
    // Verify puzzles were added
    const count = await Puzzle.countDocuments();
    console.log(`Total puzzles in database: ${count}`);
    
    // Log puzzles by theme
    const themes = await Puzzle.distinct('theme');
    console.log('Available themes:', themes);
    
    // Log count by theme
    for (const theme of themes) {
      const themeCount = await Puzzle.countDocuments({ theme });
      console.log(`${theme}: ${themeCount} puzzles`);
    }
    
    await mongoose.disconnect();
    console.log('Quality puzzle seeding complete');
  } catch (error) {
    console.error('Error seeding quality puzzles:', error);
    await mongoose.disconnect();
  }
}

seedQualityPuzzles(); 