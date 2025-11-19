const mongoose = require('mongoose');
const Opening = require('../models/Opening');
const { Chess } = require('chess.js');

const MONGO_URI = 'mongodb://localhost:27017/chessrep';

const realOpenings = [
  // WHITE OPENINGS
  {
    name: 'Ruy Lopez (Spanish Opening)',
    description: 'A classic opening that develops the bishop to b5, putting pressure on Black\'s knight.',
    category: 'Open Game',
    difficulty: 'Intermediate',
    isFree: true,
    lines: [{
      name: 'Main Line',
      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5', 'a6', 'Ba4', 'Nf6', 'O-O', 'Be7', 'Re1', 'b5', 'Bb3', 'd6', 'c3'],
      moveExplanations: [
        'White plays e4', 'Black responds e5', 'White develops knight', 'Black develops knight',
        'White plays Bb5 (Ruy Lopez)', 'Black plays a6', 'White retreats bishop', 'Black develops knight',
        'White castles', 'Black develops bishop', 'White plays Re1', 'Black plays b5', 'White retreats bishop',
        'Black plays d6', 'White plays c3'
      ],
      orientation: 'white'
    }]
  },
  {
    name: 'Italian Game',
    description: 'A direct attacking opening that develops the bishop to c4.',
    category: 'Open Game',
    difficulty: 'Beginner',
    isFree: true,
    lines: [{
      name: 'Main Line',
      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Bc5', 'c3', 'Nf6', 'd4', 'exd4', 'cxd4', 'Bb4+', 'Nc3', 'd5', 'exd5'],
      moveExplanations: [
        'White plays e4', 'Black responds e5', 'White develops knight', 'Black develops knight',
        'White plays Bc4', 'Black plays Bc5', 'White plays c3', 'Black develops knight',
        'White plays d4', 'Black captures d4', 'White recaptures', 'Black checks with bishop',
        'White blocks with knight', 'Black plays d5', 'White captures d5'
      ],
      orientation: 'white'
    }]
  },
  {
    name: 'Scotch Game',
    description: 'An aggressive opening that immediately challenges the center with d4.',
    category: 'Open Game',
    difficulty: 'Intermediate',
    isFree: true,
    lines: [{
      name: 'Main Line',
      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      moves: ['e4', 'e5', 'Nf3', 'Nc6', 'd4', 'exd4', 'Nxd4', 'Nf6', 'Nc3', 'Bb4', 'Nxc6', 'bxc6', 'Bd3', 'd5', 'exd5'],
      moveExplanations: [
        'White plays e4', 'Black responds e5', 'White develops knight', 'Black develops knight',
        'White plays d4', 'Black captures d4', 'White recaptures', 'Black develops knight',
        'White develops knight', 'Black develops bishop', 'White captures knight', 'Black recaptures',
        'White develops bishop', 'Black plays d5', 'White captures d5'
      ],
      orientation: 'white'
    }]
  },
  {
    name: "King's Gambit",
    description: 'A bold gambit that sacrifices a pawn for rapid development and attacking chances.',
    category: 'Open Game',
    difficulty: 'Advanced',
    isFree: true,
    lines: [{
      name: 'Main Line',
      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      moves: ['e4', 'e5', 'f4', 'exf4', 'Nf3', 'g5', 'h4', 'g4', 'Ne5', 'Nf6', 'Bc4', 'd5', 'exd5', 'Bd6', 'd4'],
      moveExplanations: [
        'White plays e4', 'Black responds e5', 'White plays f4 (gambit)', 'Black captures f4',
        'White develops knight', 'Black plays g5', 'White plays h4', 'Black plays g4',
        'White plays Ne5', 'Black develops knight', 'White develops bishop', 'Black plays d5',
        'White captures d5', 'Black develops bishop', 'White plays d4'
      ],
      orientation: 'white'
    }]
  },
  {
    name: 'Vienna Game',
    description: 'A flexible opening that can transpose into various other openings.',
    category: 'Open Game',
    difficulty: 'Intermediate',
    isFree: true,
    lines: [{
      name: 'Main Line',
      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      moves: ['e4', 'e5', 'Nc3', 'Nf6', 'f4', 'd5', 'fxe5', 'Nxe4', 'Nf3', 'Nc6', 'Bb5', 'Bc5', 'd4', 'Bb4', 'O-O'],
      moveExplanations: [
        'White plays e4', 'Black responds e5', 'White develops knight', 'Black develops knight',
        'White plays f4', 'Black plays d5', 'White captures e5', 'Black captures e4',
        'White develops knight', 'Black develops knight', 'White develops bishop', 'Black develops bishop',
        'White plays d4', 'Black develops bishop', 'White castles'
      ],
      orientation: 'white'
    }]
  },
  {
    name: 'English Opening',
    description: 'A hypermodern opening that controls the center from a distance.',
    category: 'Flank Opening',
    difficulty: 'Intermediate',
    isFree: true,
    lines: [{
      name: 'Main Line',
      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      moves: ['c4', 'e5', 'Nc3', 'Nf6', 'g3', 'd5', 'cxd5', 'Nxd5', 'Bg2', 'Nb6', 'Nf3', 'Nc6', 'O-O', 'Be7', 'd3'],
      moveExplanations: [
        'White plays c4', 'Black responds e5', 'White develops knight', 'Black develops knight',
        'White plays g3', 'Black plays d5', 'White captures d5', 'Black recaptures',
        'White develops bishop', 'Black retreats knight', 'White develops knight', 'Black develops knight',
        'White castles', 'Black develops bishop', 'White plays d3'
      ],
      orientation: 'white'
    }]
  },
  {
    name: 'Catalan Opening',
    description: 'A sophisticated opening that combines d4 with fianchettoed bishop.',
    category: 'Closed Game',
    difficulty: 'Advanced',
    isFree: true,
    lines: [{
      name: 'Main Line',
      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      moves: ['d4', 'Nf6', 'c4', 'e6', 'g3', 'd5', 'Bg2', 'Be7', 'Nf3', 'O-O', 'O-O', 'dxc4', 'Qc2', 'a6', 'Qxc4'],
      moveExplanations: [
        'White plays d4', 'Black develops knight', 'White plays c4', 'Black plays e6',
        'White plays g3', 'Black plays d5', 'White develops bishop', 'Black develops bishop',
        'White develops knight', 'Black castles', 'White castles', 'Black captures c4',
        'White plays Qc2', 'Black plays a6', 'White recaptures c4'
      ],
      orientation: 'white'
    }]
  },
  {
    name: "Queen's Gambit",
    description: 'A classic opening that offers a pawn to gain central control.',
    category: 'Closed Game',
    difficulty: 'Intermediate',
    isFree: true,
    lines: [{
      name: 'Main Line',
      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      moves: ['d4', 'd5', 'c4', 'e6', 'Nc3', 'Nf6', 'Nf3', 'Be7', 'Bf4', 'O-O', 'e3', 'c5', 'dxc5', 'Bxc5', 'Qc2'],
      moveExplanations: [
        'White plays d4', 'Black responds d5', 'White plays c4 (gambit)', 'Black plays e6',
        'White develops knight', 'Black develops knight', 'White develops knight', 'Black develops bishop',
        'White develops bishop', 'Black castles', 'White plays e3', 'Black plays c5',
        'White captures c5', 'Black recaptures', 'White plays Qc2'
      ],
      orientation: 'white'
    }]
  },
  {
    name: 'London System',
    description: 'A solid system that develops pieces to natural squares.',
    category: 'Closed Game',
    difficulty: 'Beginner',
    isFree: true,
    lines: [{
      name: 'Main Line',
      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      moves: ['d4', 'd5', 'Nf3', 'Nf6', 'Bf4', 'e6', 'e3', 'c5', 'c3', 'Nc6', 'Nbd2', 'Bd6', 'Bg3', 'O-O', 'Bd3'],
      moveExplanations: [
        'White plays d4', 'Black responds d5', 'White develops knight', 'Black develops knight',
        'White develops bishop', 'Black plays e6', 'White plays e3', 'Black plays c5',
        'White plays c3', 'Black develops knight', 'White develops knight', 'Black develops bishop',
        'White retreats bishop', 'Black castles', 'White develops bishop'
      ],
      orientation: 'white'
    }]
  },
  {
    name: "King's Indian Attack",
    description: 'A flexible system that can be played against various Black setups.',
    category: 'Flank Opening',
    difficulty: 'Intermediate',
    isFree: true,
    lines: [{
      name: 'Main Line',
      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      moves: ['Nf3', 'd5', 'g3', 'Nf6', 'Bg2', 'e6', 'O-O', 'Be7', 'd3', 'O-O', 'Nbd2', 'c5', 'e4', 'Nc6', 'Re1'],
      moveExplanations: [
        'White develops knight', 'Black plays d5', 'White plays g3', 'Black develops knight',
        'White develops bishop', 'Black plays e6', 'White castles', 'Black develops bishop',
        'White plays d3', 'Black castles', 'White develops knight', 'Black plays c5',
        'White plays e4', 'Black develops knight', 'White plays Re1'
      ],
      orientation: 'white'
    }]
  },
  
  // BLACK OPENINGS
  {
    name: 'French Defense',
    description: 'A solid defense that controls the center with pawns.',
    category: 'Semi-Open Game',
    difficulty: 'Intermediate',
    isFree: true,
    lines: [{
      name: 'Main Line',
      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      moves: ['e4', 'e6', 'd4', 'd5', 'Nc3', 'Nf6', 'e5', 'Nfd7', 'f4', 'c5', 'Nf3', 'Nc6', 'Be3', 'Be7', 'Qd2'],
      moveExplanations: [
        'White plays e4', 'Black responds e6', 'White plays d4', 'Black plays d5',
        'White develops knight', 'Black develops knight', 'White advances e5', 'Black retreats knight',
        'White plays f4', 'Black plays c5', 'White develops knight', 'Black develops knight',
        'White develops bishop', 'Black develops bishop', 'White plays Qd2'
      ],
      orientation: 'black'
    }]
  },
  {
    name: 'Sicilian Defense (Najdorf)',
    description: 'A sharp defense that creates dynamic counterplay.',
    category: 'Semi-Open Game',
    difficulty: 'Advanced',
    isFree: true,
    lines: [{
      name: 'Main Line',
      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      moves: ['e4', 'c5', 'Nf3', 'd6', 'd4', 'cxd4', 'Nxd4', 'Nf6', 'Nc3', 'a6', 'Bg5', 'e6', 'f4', 'Qb6', 'Qd2'],
      moveExplanations: [
        'White plays e4', 'Black responds c5', 'White develops knight', 'Black plays d6',
        'White plays d4', 'Black captures d4', 'White recaptures', 'Black develops knight',
        'White develops knight', 'Black plays a6', 'White develops bishop', 'Black plays e6',
        'White plays f4', 'Black plays Qb6', 'White plays Qd2'
      ],
      orientation: 'black'
    }]
  },
  {
    name: 'Caro-Kann Defense',
    description: 'A solid defense that maintains pawn structure.',
    category: 'Semi-Open Game',
    difficulty: 'Intermediate',
    isFree: true,
    lines: [{
      name: 'Main Line',
      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      moves: ['e4', 'c6', 'd4', 'd5', 'Nc3', 'dxe4', 'Nxe4', 'Bf5', 'Ng3', 'Bg6', 'h4', 'h6', 'Nf3', 'Nd7', 'h5'],
      moveExplanations: [
        'White plays e4', 'Black responds c6', 'White plays d4', 'Black plays d5',
        'White develops knight', 'Black captures e4', 'White recaptures', 'Black develops bishop',
        'White attacks bishop', 'Black retreats bishop', 'White plays h4', 'Black plays h6',
        'White develops knight', 'Black develops knight', 'White plays h5'
      ],
      orientation: 'black'
    }]
  },
  {
    name: 'Pirc Defense',
    description: 'A hypermodern defense that allows White to control the center.',
    category: 'Semi-Open Game',
    difficulty: 'Advanced',
    isFree: true,
    lines: [{
      name: 'Main Line',
      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      moves: ['e4', 'd6', 'd4', 'Nf6', 'Nc3', 'g6', 'Be3', 'Bg7', 'Qd2', 'O-O', 'f3', 'c6', 'Nge2', 'b5', 'Bh6'],
      moveExplanations: [
        'White plays e4', 'Black responds d6', 'White plays d4', 'Black develops knight',
        'White develops knight', 'Black plays g6', 'White develops bishop', 'Black develops bishop',
        'White plays Qd2', 'Black castles', 'White plays f3', 'Black plays c6',
        'White develops knight', 'Black plays b5', 'White plays Bh6'
      ],
      orientation: 'black'
    }]
  },
  {
    name: 'Scandinavian Defense',
    description: 'A direct defense that immediately challenges the e4 pawn.',
    category: 'Semi-Open Game',
    difficulty: 'Beginner',
    isFree: true,
    lines: [{
      name: 'Main Line',
      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      moves: ['e4', 'd5', 'exd5', 'Qxd5', 'Nc3', 'Qa5', 'd4', 'c6', 'Nf3', 'Nf6', 'Bc4', 'Bf5', 'Bd2', 'e6', 'Qe2'],
      moveExplanations: [
        'White plays e4', 'Black responds d5', 'White captures d5', 'Black recaptures with queen',
        'White develops knight', 'Black retreats queen', 'White plays d4', 'Black plays c6',
        'White develops knight', 'Black develops knight', 'White develops bishop', 'Black develops bishop',
        'White develops bishop', 'Black plays e6', 'White plays Qe2'
      ],
      orientation: 'black'
    }]
  },
  {
    name: 'Modern Defense',
    description: 'A hypermodern defense that fianchettoes the bishop.',
    category: 'Semi-Open Game',
    difficulty: 'Advanced',
    isFree: true,
    lines: [{
      name: 'Main Line',
      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      moves: ['e4', 'g6', 'd4', 'Bg7', 'Nc3', 'd6', 'Be3', 'a6', 'Qd2', 'b5', 'f3', 'Nd7', 'h4', 'h5', 'Nh3'],
      moveExplanations: [
        'White plays e4', 'Black responds g6', 'White plays d4', 'Black develops bishop',
        'White develops knight', 'Black plays d6', 'White develops bishop', 'Black plays a6',
        'White plays Qd2', 'Black plays b5', 'White plays f3', 'Black develops knight',
        'White plays h4', 'Black plays h5', 'White develops knight'
      ],
      orientation: 'black'
    }]
  },
  {
    name: "Alekhine's Defense",
    description: 'A provocative defense that lures White pawns forward.',
    category: 'Semi-Open Game',
    difficulty: 'Advanced',
    isFree: true,
    lines: [{
      name: 'Main Line',
      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      moves: ['e4', 'Nf6', 'e5', 'Nd5', 'd4', 'd6', 'Nf3', 'Bg4', 'Be2', 'e6', 'O-O', 'Be7', 'h3', 'Bh5', 'c4'],
      moveExplanations: [
        'White plays e4', 'Black responds Nf6', 'White advances e5', 'Black retreats knight',
        'White plays d4', 'Black plays d6', 'White develops knight', 'Black develops bishop',
        'White develops bishop', 'Black plays e6', 'White castles', 'Black develops bishop',
        'White plays h3', 'Black retreats bishop', 'White plays c4'
      ],
      orientation: 'black'
    }]
  },
  {
    name: 'Nimzo-Indian Defense',
    description: 'A flexible defense that controls e4 with the bishop.',
    category: 'Closed Game',
    difficulty: 'Advanced',
    isFree: true,
    lines: [{
      name: 'Main Line',
      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      moves: ['d4', 'Nf6', 'c4', 'e6', 'Nc3', 'Bb4', 'e3', 'O-O', 'Bd3', 'd5', 'Nf3', 'c5', 'O-O', 'Nc6', 'a3'],
      moveExplanations: [
        'White plays d4', 'Black develops knight', 'White plays c4', 'Black plays e6',
        'White develops knight', 'Black develops bishop', 'White plays e3', 'Black castles',
        'White develops bishop', 'Black plays d5', 'White develops knight', 'Black plays c5',
        'White castles', 'Black develops knight', 'White plays a3'
      ],
      orientation: 'black'
    }]
  },
  {
    name: "King's Indian Defense",
    description: 'A dynamic defense that creates kingside attacking chances.',
    category: 'Closed Game',
    difficulty: 'Advanced',
    isFree: true,
    lines: [{
      name: 'Main Line',
      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      moves: ['d4', 'Nf6', 'c4', 'g6', 'Nc3', 'Bg7', 'e4', 'd6', 'Nf3', 'O-O', 'Be2', 'e5', 'O-O', 'Nc6', 'd5'],
      moveExplanations: [
        'White plays d4', 'Black develops knight', 'White plays c4', 'Black plays g6',
        'White develops knight', 'Black develops bishop', 'White plays e4', 'Black plays d6',
        'White develops knight', 'Black castles', 'White develops bishop', 'Black plays e5',
        'White castles', 'Black develops knight', 'White plays d5'
      ],
      orientation: 'black'
    }]
  },
  {
    name: 'Grunfeld Defense',
    description: 'A dynamic defense that allows White to control the center.',
    category: 'Closed Game',
    difficulty: 'Advanced',
    isFree: true,
    lines: [{
      name: 'Main Line',
      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      moves: ['d4', 'Nf6', 'c4', 'g6', 'Nc3', 'd5', 'cxd5', 'Nxd5', 'e4', 'Nxc3', 'bxc3', 'Bg7', 'Nf3', 'c5', 'Rb1'],
      moveExplanations: [
        'White plays d4', 'Black develops knight', 'White plays c4', 'Black plays g6',
        'White develops knight', 'Black plays d5', 'White captures d5', 'Black recaptures',
        'White plays e4', 'Black captures knight', 'White recaptures', 'Black develops bishop',
        'White develops knight', 'Black plays c5', 'White plays Rb1'
      ],
      orientation: 'black'
    }]
  }
];

async function addRealOpenings() {
  await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  
  console.log('Adding real openings to database...');
  
  for (const openingData of realOpenings) {
    // Check if opening already exists
    const existingOpening = await Opening.findOne({ name: openingData.name });
    
    if (existingOpening) {
      console.log(`Opening "${openingData.name}" already exists, updating...`);
      // Update existing opening
      existingOpening.description = openingData.description;
      existingOpening.category = openingData.category;
      existingOpening.difficulty = openingData.difficulty;
      existingOpening.isFree = openingData.isFree;
      existingOpening.lines = openingData.lines;
      await existingOpening.save();
    } else {
      console.log(`Creating new opening: "${openingData.name}"`);
      // Create new opening
      const newOpening = new Opening(openingData);
      await newOpening.save();
    }
  }
  
  console.log('All openings have been added/updated successfully!');
  await mongoose.disconnect();
}

addRealOpenings().catch(console.error); 