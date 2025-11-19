const mongoose = require('mongoose');
const Opening = require('../models/Opening');
require('dotenv').config();

const sampleOpenings = [
  {
    name: 'Sicilian Defense: Najdorf Variation',
    description: 'A complex and highly theoretical variation of the Sicilian Defense, known for its sharp tactical battles.',
    fen: 'rnbqkbnr/pp1ppppp/2p5/8/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2',
    moves: ['e4', 'c5', 'Nf3', 'd6', 'd4', 'cxd4', 'Nxd4', 'Nf6', 'Nc3', 'a6'],
    moveExplanations: [
      'White establishes central control with e4.',
      'Black responds with c5, challenging White\'s center.',
      'White develops the knight and attacks the c5 pawn.',
      'Black defends the c5 pawn with d6.',
      'White opens the center with d4.',
      'Black captures on d4 with the c-pawn.',
      'White recaptures with the knight, gaining central control.',
      'Black develops the knight to f6, attacking e4.',
      'White develops the knight to c3, defending e4.',
      'Black plays a6, preparing for the Najdorf setup.'
    ],
    difficulty: 'Advanced',
    category: 'Defense',
    isFree: false
  },
  {
    name: 'Queen\'s Gambit Declined',
    description: 'A solid and classical response to the Queen\'s Gambit, focusing on strong pawn structures and positional play.',
    fen: 'rnbqkbnr/pppppppp/8/8/2PP4/8/PP2PPPP/RNBQKBNR b KQkq - 0 1',
    moves: ['d4', 'd5', 'c4', 'e6', 'Nc3', 'Nf6', 'Bg5', 'Be7', 'e3', 'O-O'],
    moveExplanations: [
      'White establishes central control with d4.',
      'Black responds with d5, challenging White\'s center.',
      'White offers a pawn sacrifice with c4.',
      'Black declines the gambit with e6.',
      'White develops the knight to c3.',
      'Black develops the knight to f6.',
      'White pins the knight with Bg5.',
      'Black breaks the pin with Be7.',
      'White supports the center with e3.',
      'Black castles, completing development.'
    ],
    difficulty: 'Intermediate',
    category: 'Gambit',
    isFree: true
  },
  {
    name: 'King\'s Indian Defense',
    description: 'A dynamic and aggressive defense for Black, where they allow White to build a large center before counter-attacking it.',
    fen: 'rnbqkbnr/pppppppp/8/8/3P4/8/PPP1PPPP/RNBQKBNR b KQkq - 0 1',
    moves: ['d4', 'Nf6', 'c4', 'g6', 'Nc3', 'Bg7', 'e4', 'd6', 'Nf3', 'O-O'],
    moveExplanations: [
      'White establishes central control with d4.',
      'Black develops the knight to f6.',
      'White expands with c4.',
      'Black prepares to fianchetto with g6.',
      'White develops the knight to c3.',
      'Black completes the fianchetto with Bg7.',
      'White establishes a strong center with e4.',
      'Black supports the center with d6.',
      'White develops the knight to f3.',
      'Black castles, completing development.'
    ],
    difficulty: 'Advanced',
    category: 'Defense',
    isFree: false
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

const importOpenings = async () => {
  try {
    await connectDB();
    
    // Clear existing openings
    await Opening.deleteMany({});
    console.log('Cleared existing openings');
    
    // Insert sample openings
    await Opening.insertMany(sampleOpenings);
    console.log('Imported sample openings');
    
    // Verify openings were added
    const count = await Opening.countDocuments();
    console.log(`Total openings in database: ${count}`);
    
    process.exit(0);
  } catch (err) {
    console.error('Error importing openings:', err);
    process.exit(1);
  }
};

importOpenings(); 