const mongoose = require('mongoose');
const Opening = require('../models/Opening');
require('dotenv').config();

async function addVariations() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/chessrep');
    console.log('Connected to MongoDB');

    // Add variations to French Defense
    const frenchDefense = await Opening.findOne({ name: 'French Defense' });
    if (frenchDefense) {
      frenchDefense.lines = [
        {
          name: 'Advance Variation',
          fen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1',
          moves: ['e4', 'e6', 'e5'],
          moveExplanations: [
            'White establishes central control with the king\'s pawn advance.',
            'Black responds with the French Defense, preparing to challenge the center with d5.',
            'White advances further, gaining space and restricting Black\'s development.'
          ],
          orientation: 'white',
          userSide: 'white'
        },
        {
          name: 'Tarrasch Variation',
          fen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1',
          moves: ['e4', 'e6', 'd4', 'd5', 'Nd2'],
          moveExplanations: [
            'White establishes central control with the king\'s pawn advance.',
            'Black responds with the French Defense, preparing to challenge the center with d5.',
            'White reinforces the center and prepares to develop the knight.',
            'Black challenges the center immediately with the pawn advance.',
            'White develops the knight to d2, protecting the e4 pawn and preparing c3.'
          ],
          orientation: 'white',
          userSide: 'white'
        },
        {
          name: 'Winawer Variation',
          fen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1',
          moves: ['e4', 'e6', 'd4', 'd5', 'Nc3', 'Bb4'],
          moveExplanations: [
            'White establishes central control with the king\'s pawn advance.',
            'Black responds with the French Defense, preparing to challenge the center with d5.',
            'White reinforces the center and prepares to develop the knight.',
            'Black challenges the center immediately with the pawn advance.',
            'White develops the knight to c3, attacking the d5 pawn.',
            'Black pins the knight with the bishop, creating tactical opportunities.'
          ],
          orientation: 'white',
          userSide: 'white'
        }
      ];
      await frenchDefense.save();
      console.log('Updated French Defense with variations');
    }

    // Add variations to Sicilian Defense
    const sicilianDefense = await Opening.findOne({ name: 'Sicilian Defense - Najdorf Variation' });
    if (sicilianDefense) {
      sicilianDefense.name = 'Sicilian Defense';
      sicilianDefense.lines = [
        {
          name: 'Najdorf Variation',
          fen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1',
          moves: ['e4', 'c5', 'Nf3', 'd6', 'd4', 'cxd4', 'Nxd4', 'Nf6', 'Nc3', 'a6'],
          moveExplanations: [
            'White establishes central control with the king\'s pawn advance.',
            'Black responds with the Sicilian Defense, immediately challenging the center.',
            'White develops the knight and attacks the c5 pawn.',
            'Black prepares to develop the knight and control the center.',
            'White opens the center and creates attacking chances.',
            'Black captures the pawn, opening the c-file.',
            'White recaptures with the knight, maintaining central control.',
            'Black develops the knight and attacks the e4 pawn.',
            'White develops the knight and protects the e4 pawn.',
            'Black prepares for queenside expansion and prevents Nb5.'
          ],
          orientation: 'white',
          userSide: 'white'
        },
        {
          name: 'Dragon Variation',
          fen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1',
          moves: ['e4', 'c5', 'Nf3', 'd6', 'd4', 'cxd4', 'Nxd4', 'Nf6', 'Nc3', 'g6'],
          moveExplanations: [
            'White establishes central control with the king\'s pawn advance.',
            'Black responds with the Sicilian Defense, immediately challenging the center.',
            'White develops the knight and attacks the c5 pawn.',
            'Black prepares to develop the knight and control the center.',
            'White opens the center and creates attacking chances.',
            'Black captures the pawn, opening the c-file.',
            'White recaptures with the knight, maintaining central control.',
            'Black develops the knight and attacks the e4 pawn.',
            'White develops the knight and protects the e4 pawn.',
            'Black prepares to fianchetto the bishop and create a kingside attack.'
          ],
          orientation: 'white',
          userSide: 'white'
        },
        {
          name: 'Scheveningen Variation',
          fen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1',
          moves: ['e4', 'c5', 'Nf3', 'd6', 'd4', 'cxd4', 'Nxd4', 'Nf6', 'Nc3', 'e6'],
          moveExplanations: [
            'White establishes central control with the king\'s pawn advance.',
            'Black responds with the Sicilian Defense, immediately challenging the center.',
            'White develops the knight and attacks the c5 pawn.',
            'Black prepares to develop the knight and control the center.',
            'White opens the center and creates attacking chances.',
            'Black captures the pawn, opening the c-file.',
            'White recaptures with the knight, maintaining central control.',
            'Black develops the knight and attacks the e4 pawn.',
            'White develops the knight and protects the e4 pawn.',
            'Black prepares to develop the light-squared bishop and control the center.'
          ],
          orientation: 'white',
          userSide: 'white'
        }
      ];
      await sicilianDefense.save();
      console.log('Updated Sicilian Defense with variations');
    }

    // Add variations to Ruy Lopez
    const ruyLopez = await Opening.findOne({ name: 'Ruy Lopez - Closed Variation' });
    if (ruyLopez) {
      ruyLopez.name = 'Ruy Lopez';
      ruyLopez.lines = [
        {
          name: 'Closed Defense',
          fen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1',
          moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5', 'a6', 'Ba4', 'Nf6', 'O-O', 'Be7'],
          moveExplanations: [
            'White establishes central control with the king\'s pawn advance.',
            'Black responds symmetrically, controlling the center.',
            'White develops the knight and attacks the e5 pawn.',
            'Black defends the pawn and develops the knight.',
            'White develops the bishop and pins the knight.',
            'Black forces the bishop to retreat and gains time.',
            'White retreats the bishop while maintaining pressure.',
            'Black develops the knight and attacks the e4 pawn.',
            'White castles kingside, ensuring king safety.',
            'Black develops the bishop and prepares to castle.'
          ],
          orientation: 'white',
          userSide: 'white'
        },
        {
          name: 'Open Defense',
          fen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1',
          moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5', 'a6', 'Ba4', 'Nf6', 'O-O', 'Nxe4'],
          moveExplanations: [
            'White establishes central control with the king\'s pawn advance.',
            'Black responds symmetrically, controlling the center.',
            'White develops the knight and attacks the e5 pawn.',
            'Black defends the pawn and develops the knight.',
            'White develops the bishop and pins the knight.',
            'Black forces the bishop to retreat and gains time.',
            'White retreats the bishop while maintaining pressure.',
            'Black develops the knight and attacks the e4 pawn.',
            'White castles kingside, ensuring king safety.',
            'Black captures the pawn, creating tactical complications.'
          ],
          orientation: 'white',
          userSide: 'white'
        },
        {
          name: 'Berlin Defense',
          fen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1',
          moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5', 'Nf6'],
          moveExplanations: [
            'White establishes central control with the king\'s pawn advance.',
            'Black responds symmetrically, controlling the center.',
            'White develops the knight and attacks the e5 pawn.',
            'Black defends the pawn and develops the knight.',
            'White develops the bishop and pins the knight.',
            'Black develops the knight and attacks the e4 pawn, ignoring the pin.'
          ],
          orientation: 'white',
          userSide: 'white'
        }
      ];
      await ruyLopez.save();
      console.log('Updated Ruy Lopez with variations');
    }

    console.log('All variations added successfully!');
    mongoose.connection.close();
  } catch (error) {
    console.error('Error adding variations:', error);
    mongoose.connection.close();
  }
}

addVariations();
