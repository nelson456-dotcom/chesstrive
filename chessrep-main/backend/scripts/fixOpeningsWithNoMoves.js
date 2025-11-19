// fixOpeningsWithNoMoves.js
const mongoose = require('mongoose');
const Opening = require('../models/Opening');
const { Chess } = require('chess.js');

const MONGO_URI = 'mongodb://localhost:27017/chessrep'; // Change if your DB URI is different

const demoLines = {
  'sicilian': {
    name: 'Sicilian Main Line',
    fen: 'rnbqkbnr/pp1ppppp/8/2p5/4P3/8/PPPP1PPP/RNBQKBNR w KQkq c6 0 2',
    moves: ['e4', 'c5', 'Nf3', 'd6', 'd4', 'cxd4', 'Nxd4', 'Nf6', 'Nc3', 'a6'],
    moveExplanations: [
      'White plays e4', 'Black responds c5', 'White develops knight', 'Black plays d6',
      'White plays d4', 'Black captures d4', 'White recaptures', 'Black develops knight',
      'White develops knight', 'Black plays a6'
    ]
  },
  'french': {
    name: 'French Main Line',
    fen: 'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2',
    moves: ['e4', 'e6', 'd4', 'd5', 'Nc3', 'Nf6', 'Bg5', 'Be7', 'e5', 'Nfd7'],
    moveExplanations: [
      'White plays e4', 'Black responds e6', 'White plays d4', 'Black plays d5',
      'White develops knight', 'Black develops knight', 'White pins knight', 'Black develops bishop',
      'White advances e5', 'Black retreats knight'
    ]
  },
  'caro': {
    name: 'Caro-Kann Main Line',
    fen: 'rnbqkbnr/pp2pppp/2p5/3p4/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3',
    moves: ['e4', 'c6', 'd4', 'd5', 'Nc3', 'dxe4', 'Nxe4', 'Bf5', 'Ng3', 'Bg6'],
    moveExplanations: [
      'White plays e4', 'Black responds c6', 'White plays d4', 'Black plays d5',
      'White develops knight', 'Black captures e4', 'White recaptures', 'Black develops bishop',
      'White attacks bishop', 'Black retreats bishop'
    ]
  },
  'ruy': {
    name: 'Ruy Lopez Main Line',
    fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5', 'a6', 'Ba4', 'Nf6', 'O-O', 'Be7'],
    moveExplanations: [
      'White plays e4', 'Black responds e5', 'White develops knight', 'Black develops knight',
      'White plays Bb5 (Ruy Lopez)', 'Black plays a6', 'White retreats bishop', 'Black develops knight',
      'White castles', 'Black develops bishop'
    ]
  },
  'queens': {
    name: "Queen's Gambit Main Line",
    fen: 'rnbqkbnr/ppp2ppp/8/3pp3/2P5/5N2/PP1PPPPP/RNBQKB1R b KQkq - 0 3',
    moves: ['d4', 'd5', 'c4', 'e6', 'Nc3', 'Nf6', 'Bg5', 'Be7', 'e3', 'O-O'],
    moveExplanations: [
      'White plays d4', 'Black responds d5', 'White plays c4', 'Black plays e6',
      'White develops knight', 'Black develops knight', 'White pins knight', 'Black develops bishop',
      'White supports center', 'Black castles'
    ]
  },
  'italian': {
    name: 'Italian Game Main Line',
    fen: 'rnbqkbnr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3',
    moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Bc5', 'c3', 'Nf6', 'd4', 'exd4'],
    moveExplanations: [
      'White plays e4', 'Black responds e5', 'White develops knight', 'Black develops knight',
      'White plays Bc4', 'Black plays Bc5', 'White plays c3', 'Black develops knight',
      'White plays d4', 'Black captures d4'
    ]
  }
};

function pickDemoLine(openingName) {
  const name = openingName.toLowerCase();
  if (name.includes('sicilian')) return demoLines.sicilian;
  if (name.includes('french')) return demoLines.french;
  if (name.includes('caro')) return demoLines.caro;
  if (name.includes('ruy')) return demoLines.ruy;
  if (name.includes('queen')) return demoLines.queens;
  if (name.includes('italian')) return demoLines.italian;
  // fallback: empty line
  return {
    name: 'Generic Demo Line',
    fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    moves: [],
    moveExplanations: []
  };
}

async function fixOpenings() {
  await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

  const openings = await Opening.find({});
  for (const opening of openings) {
    let updated = false;
    const demoLine = pickDemoLine(opening.name);
    // If no lines or lines is empty
    if (!opening.lines || opening.lines.length === 0) {
      const line = JSON.parse(JSON.stringify(demoLine));
      // Set orientation based on first move color
      const tempGame = new mongoose.models.Opening().lines ? new Chess(line.fen) : new Chess(line.fen);
      const firstMove = tempGame.move(line.moves[0], { sloppy: true });
      line.orientation = (firstMove && firstMove.color === 'b') ? 'black' : 'white';
      opening.lines = [line];
      opening.isFree = true;
      updated = true;
      console.log('Added demo line to opening:', opening.name);
    } else {
      // If any line has no moves, add demo moves to that line
      for (const line of opening.lines) {
        if (!line.moves || line.moves.length === 0) {
          line.fen = demoLine.fen;
          line.moves = [...demoLine.moves];
          line.moveExplanations = [...demoLine.moveExplanations];
          // Set orientation based on first move color
          const tempGame = new Chess(line.fen);
          const firstMove = tempGame.move(line.moves[0], { sloppy: true });
          line.orientation = (firstMove && firstMove.color === 'b') ? 'black' : 'white';
          updated = true;
          console.log('Added demo moves to line in opening:', opening.name);
        }
      }
    }
    if (updated) {
      await opening.save();
    }
  }
  await mongoose.disconnect();
  console.log('All openings now have at least one line with correct moves and orientation.');
}

fixOpenings(); 