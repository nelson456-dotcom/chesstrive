const mongoose = require('mongoose');
const Puzzle = require('../models/Puzzle');

const samplePuzzles = [
  // Sophisticated positions for subtle blunder detection
  {
    fen: "rnbqkb1r/pppp1ppp/5n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 1",
    moves: ["O-O"],
    rating: 1200,
    ratingDeviation: 50,
    popularity: 100,
    nbPlays: 1000,
    themes: ["positional", "development", "blunder"].map(t => t.toLowerCase()),
    url: "https://lichess.org/training/subtle1",
    solution: ["O-O", "Be7", "Re1"],
    explanation: "Castling is best, other moves allow Black to equalize"
  },
  {
    fen: "rnbqkb1r/pppp1ppp/5n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 0 1",
    moves: ["Be7"],
    rating: 1100,
    ratingDeviation: 50,
    popularity: 100,
    nbPlays: 1000,
    themes: ["positional", "development", "blunder"].map(t => t.toLowerCase()),
    url: "https://lichess.org/training/subtle2",
    solution: ["Be7", "O-O", "O-O"],
    explanation: "Be7 is solid, other moves allow White advantage"
  },
  {
    fen: "rnbqkb1r/pppp1ppp/5n2/4p3/2B1P3/3P1N2/PPP2PPP/RNBQK2R b KQkq - 0 1",
    moves: ["Be7"],
    rating: 1150,
    ratingDeviation: 50,
    popularity: 100,
    nbPlays: 1000,
    themes: ["positional", "development", "blunder"].map(t => t.toLowerCase()),
    url: "https://lichess.org/training/subtle3",
    solution: ["Be7", "O-O", "O-O"],
    explanation: "Be7 is best, other moves allow White initiative"
  },
  {
    fen: "rnbqkb1r/pppp1ppp/5n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 1",
    moves: ["d3"],
    rating: 1000,
    ratingDeviation: 50,
    popularity: 100,
    nbPlays: 1000,
    themes: ["positional", "development", "blunder"].map(t => t.toLowerCase()),
    url: "https://lichess.org/training/subtle4",
    solution: ["d3", "Be7", "O-O"],
    explanation: "d3 is solid, other moves allow Black to equalize"
  },
  {
    fen: "rnbqkb1r/pppp1ppp/5n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 1",
    moves: ["Nc3"],
    rating: 1050,
    ratingDeviation: 50,
    popularity: 100,
    nbPlays: 1000,
    themes: ["positional", "development", "blunder"].map(t => t.toLowerCase()),
    url: "https://lichess.org/training/subtle5",
    solution: ["Nc3", "Be7", "O-O"],
    explanation: "Nc3 is natural, other moves are less accurate"
  },
  {
    fen: "rnbqkb1r/pppp1ppp/5n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 0 1",
    moves: ["Nc6"],
    rating: 1000,
    ratingDeviation: 50,
    popularity: 100,
    nbPlays: 1000,
    themes: ["positional", "development", "blunder"].map(t => t.toLowerCase()),
    url: "https://lichess.org/training/subtle6",
    solution: ["Nc6", "O-O", "Be7"],
    explanation: "Nc6 is natural, other moves are less accurate"
  },
  {
    fen: "rnbqkb1r/pppp1ppp/5n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 1",
    moves: ["Qe2"],
    rating: 1100,
    ratingDeviation: 50,
    popularity: 100,
    nbPlays: 1000,
    themes: ["positional", "development", "blunder"].map(t => t.toLowerCase()),
    url: "https://lichess.org/training/subtle7",
    solution: ["Qe2", "Be7", "O-O"],
    explanation: "Qe2 is solid, other moves allow Black to equalize"
  },
  {
    fen: "rnbqkb1r/pppp1ppp/5n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 0 1",
    moves: ["Bc5"],
    rating: 1050,
    ratingDeviation: 50,
    popularity: 100,
    nbPlays: 1000,
    themes: ["positional", "development", "blunder"].map(t => t.toLowerCase()),
    url: "https://lichess.org/training/subtle8",
    solution: ["Bc5", "O-O", "O-O"],
    explanation: "Bc5 is natural, other moves are less accurate"
  },
  // Simple positions for visualisation practice
  {
    fen: "8/8/8/8/8/8/8/K7 w - - 0 1",
    moves: ["Kb1"],
    rating: 500,
    ratingDeviation: 50,
    popularity: 100,
    nbPlays: 1000,
    themes: ["endgame", "king"].map(t => t.toLowerCase()),
    url: "https://lichess.org/training/4",
    solution: ["Kb1"],
    explanation: "Simple king move"
  },
  {
    fen: "8/8/8/8/8/8/8/KR6 w - - 0 1",
    moves: ["Kb1"],
    rating: 600,
    ratingDeviation: 50,
    popularity: 100,
    nbPlays: 1000,
    themes: ["endgame", "king", "rook"].map(t => t.toLowerCase()),
    url: "https://lichess.org/training/5",
    solution: ["Kb1"],
    explanation: "King and rook position"
  },
  {
    fen: "8/8/8/8/8/8/8/KQ6 w - - 0 1",
    moves: ["Kb1"],
    rating: 700,
    ratingDeviation: 50,
    popularity: 100,
    nbPlays: 1000,
    themes: ["endgame", "king", "queen"].map(t => t.toLowerCase()),
    url: "https://lichess.org/training/6",
    solution: ["Kb1"],
    explanation: "King and queen position"
  },
  {
    fen: "8/8/8/8/8/8/8/KB6 w - - 0 1",
    moves: ["Kb1"],
    rating: 650,
    ratingDeviation: 50,
    popularity: 100,
    nbPlays: 1000,
    themes: ["endgame", "king", "bishop"].map(t => t.toLowerCase()),
    url: "https://lichess.org/training/7",
    solution: ["Kb1"],
    explanation: "King and bishop position"
  },
  {
    fen: "8/8/8/8/8/8/8/KN6 w - - 0 1",
    moves: ["Kb1"],
    rating: 650,
    ratingDeviation: 50,
    popularity: 100,
    nbPlays: 1000,
    themes: ["endgame", "king", "knight"].map(t => t.toLowerCase()),
    url: "https://lichess.org/training/8",
    solution: ["Kb1"],
    explanation: "King and knight position"
  },
  {
    fen: "8/8/8/8/8/8/8/KP6 w - - 0 1",
    moves: ["Kb1"],
    rating: 550,
    ratingDeviation: 50,
    popularity: 100,
    nbPlays: 1000,
    themes: ["endgame", "king", "pawn"].map(t => t.toLowerCase()),
    url: "https://lichess.org/training/9",
    solution: ["Kb1"],
    explanation: "King and pawn position"
  },
  {
    fen: "8/8/8/8/8/8/4k3/4K3 w - - 0 1",
    moves: ["Ke2"],
    rating: 400,
    ratingDeviation: 50,
    popularity: 100,
    nbPlays: 1000,
    themes: ["visualisation", "king"],
    url: "https://lichess.org/training/king1",
    solution: ["Ke2"],
    explanation: "Both kings on board"
  },
  {
    fen: "8/8/8/8/8/8/4k3/KR6 w - - 0 1",
    moves: ["Ra8#"],
    rating: 450,
    ratingDeviation: 50,
    popularity: 100,
    nbPlays: 1000,
    themes: ["visualisation", "rook"],
    url: "https://lichess.org/training/king2",
    solution: ["Ra8#"],
    explanation: "Simple mate with both kings"
  }
];

mongoose.connect('mongodb://localhost:27017/chessrep', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(async () => {
  console.log('Connected to MongoDB');
  try {
    // Clear existing puzzles
    await Puzzle.deleteMany({});
    console.log('Cleared existing puzzles');
    
    // Insert new puzzles
    const puzzles = await Puzzle.insertMany(samplePuzzles);
    console.log(`Successfully added ${puzzles.length} puzzles`);
    
    mongoose.connection.close();
  } catch (err) {
    console.error('Error seeding puzzles:', err);
    mongoose.connection.close();
  }
})
.catch(err => {
  console.error('Error connecting to MongoDB:', err);
}); 