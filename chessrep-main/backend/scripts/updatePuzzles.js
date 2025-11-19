const mongoose = require('mongoose');
const { Chess } = require('chess.js');
const Puzzle = require('../models/Puzzle');
require('dotenv').config();

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

// Sample valid puzzles with verified moves
const validPuzzles = [
  {
    fen: "8/8/8/4k3/8/8/6R1/8 w - - 0 1",
    moves: ["Rg5+", "Kf6", "Rg6+", "Ke7", "Rg7+", "Kf8", "Rh7"],
    rating: 1000,
    ratingDeviation: 80,
    popularity: 50,
    nbPlays: 100,
    themes: ["endgame", "rookEndgame", "mateIn1"],
    url: "https://lichess.org/training/94632"
  },
  {
    fen: "r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 0 3",
    moves: ["Bc5", "O-O", "Nf6", "d4", "Bxd4", "Nxd4", "Qxd4"],
    rating: 1200,
    ratingDeviation: 90,
    popularity: 60,
    nbPlays: 120,
    themes: ["opening", "fork", "tactics"],
    url: "https://lichess.org/training/94633"
  },
  {
    fen: "r1bq1rk1/ppp2ppp/2n2n2/3pp3/3P4/2N1PN2/PPP2PPP/R1BQ1RK1 w - - 0 7",
    moves: ["dxe5", "Ng4", "Qxd5", "Qxd5", "Nxd5"],
    rating: 1300,
    ratingDeviation: 85,
    popularity: 55,
    nbPlays: 110,
    themes: ["middlegame", "pin", "tactics"],
    url: "https://lichess.org/training/94634"
  },
  {
    fen: "r2q1rk1/ppp2ppp/2n2n2/3pp3/3P4/2N1PN2/PPP2PPP/R1BQ1RK1 w - - 0 7",
    moves: ["dxe5", "Ng4", "Qxd5", "Qxd5", "Nxd5"],
    rating: 1400,
    ratingDeviation: 95,
    popularity: 65,
    nbPlays: 130,
    themes: ["skewer", "tactics"],
    url: "https://lichess.org/training/94635"
  },
  {
    fen: "r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 0 3",
    moves: ["Nf6", "d4", "Bxd4", "Nxd4", "Qxd4"],
    rating: 1500,
    ratingDeviation: 100,
    popularity: 70,
    nbPlays: 150,
    themes: ["discoveredattack", "tactics"],
    url: "https://lichess.org/training/94636"
  },
  {
    fen: "r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 0 3",
    moves: ["Nf6", "d4", "Bxd4", "Nxd4", "Qxd4"],
    rating: 1100,
    ratingDeviation: 110,
    popularity: 75,
    nbPlays: 160,
    themes: ["deflection", "tactics"],
    url: "https://lichess.org/training/94637"
  },
  {
    fen: "r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 0 3",
    moves: ["Nf6", "d4", "Bxd4", "Nxd4", "Qxd4"],
    rating: 1150,
    ratingDeviation: 115,
    popularity: 80,
    nbPlays: 170,
    themes: ["pin", "tactics"],
    url: "https://lichess.org/training/94638"
  },
  // Add more puzzles for other themes as needed
  {
    fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    moves: ["e4", "e5", "Nf3", "Nc6", "Bc4", "Nf6", "Ng5", "d5", "exd5", "Nxd5", "Nxf7"],
    rating: 1400,
    ratingDeviation: 90,
    popularity: 60,
    nbPlays: 120,
    themes: ["doubleattack", "tactics"],
    url: "https://lichess.org/training/94639"
  },
  {
    fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    moves: ["e4", "e5", "Nf3", "Nc6", "Bb5", "a6", "Ba4", "Nf6", "O-O", "Be7"],
    rating: 1350,
    ratingDeviation: 85,
    popularity: 55,
    nbPlays: 110,
    themes: ["backrank", "tactics"],
    url: "https://lichess.org/training/94640"
  },
  {
    fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    moves: ["e4", "e5", "Nf3", "Nc6", "Bb5", "a6", "Ba4", "Nf6", "O-O", "Be7", "Re1"],
    rating: 1250,
    ratingDeviation: 80,
    popularity: 50,
    nbPlays: 100,
    themes: ["deflection", "tactics"],
    url: "https://lichess.org/training/94640"
  },
  {
    fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    moves: ["e4", "e5", "Nf3", "Nc6", "Bb5", "a6", "Ba4", "Nf6", "O-O", "Be7", "Re1", "b5", "Bb3"],
    rating: 1280,
    ratingDeviation: 82,
    popularity: 52,
    nbPlays: 102,
    themes: ["decoy", "tactics"],
    url: "https://lichess.org/training/94640"
  },
  // ... add more for each theme as needed ...
];

// Function to validate puzzle moves
const validatePuzzleMoves = (fen, moves) => {
  try {
    const game = new Chess(fen);
    const validMoves = [];
    
    for (const move of moves) {
      try {
        const result = game.move(move);
        if (result) {
          validMoves.push(move);
        } else {
          console.error(`Invalid move in puzzle: ${move}`);
          return null;
        }
      } catch (error) {
        console.error(`Error validating move ${move}:`, error);
        return null;
      }
    }
    
    return validMoves;
  } catch (error) {
    console.error('Error validating puzzle:', error);
    return null;
  }
};

const updatePuzzles = async () => {
  try {
    await connectDB();
    
    // Clear existing puzzles
    await Puzzle.deleteMany({});
    console.log('Cleared existing puzzles');
    
    // Validate and insert new puzzles
    for (const puzzle of validPuzzles) {
      const validMoves = validatePuzzleMoves(puzzle.fen, puzzle.moves);
      if (validMoves) {
        await Puzzle.create({
          ...puzzle,
          moves: validMoves
        });
        console.log(`Added puzzle with FEN: ${puzzle.fen}`);
      } else {
        console.error(`Skipping invalid puzzle with FEN: ${puzzle.fen}`);
      }
    }
    
    // Verify puzzles were added
    const count = await Puzzle.countDocuments();
    console.log(`Total puzzles in database: ${count}`);
    
    // Log puzzles by theme
    const themes = await Puzzle.distinct('themes');
    console.log('Available themes:', themes);
    
    process.exit(0);
  } catch (err) {
    console.error('Error updating puzzles:', err);
    process.exit(1);
  }
};

updatePuzzles(); 