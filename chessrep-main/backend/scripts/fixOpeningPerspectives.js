const mongoose = require('mongoose');
const Opening = require('../models/Opening');
const { Chess } = require('chess.js');

const MONGO_URI = 'mongodb://localhost:27017/chessrep';

// Define which openings are for Black (defenses) and which are for White
const blackOpenings = [
  'French Defense',
  'Sicilian Defense (Najdorf)',
  'Caro-Kann Defense',
  'Pirc Defense',
  'Scandinavian Defense',
  'Modern Defense',
  "Alekhine's Defense",
  'Nimzo-Indian Defense',
  "King's Indian Defense",
  'Grunfeld Defense'
];

const whiteOpenings = [
  'Ruy Lopez (Spanish Opening)',
  'Italian Game',
  'Scotch Game',
  "King's Gambit",
  'Vienna Game',
  'English Opening',
  'Catalan Opening',
  "Queen's Gambit",
  'London System',
  "King's Indian Attack"
];

async function fixOpeningPerspectives() {
  await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  
  console.log('Fixing opening perspectives...');
  
  const openings = await Opening.find({});
  
  for (const opening of openings) {
    let updated = false;
    
    // Determine if this is a Black or White opening
    const isBlackOpening = blackOpenings.includes(opening.name);
    const isWhiteOpening = whiteOpenings.includes(opening.name);
    
    if (isBlackOpening) {
      // For Black openings, set orientation to black and user side to black
      for (const line of opening.lines) {
        if (line.orientation !== 'black') {
          line.orientation = 'black';
          updated = true;
        }
        if (line.userSide !== 'black') {
          line.userSide = 'black';
          updated = true;
        }
      }
      console.log(`Set ${opening.name} to Black perspective`);
    } else if (isWhiteOpening) {
      // For White openings, set orientation to white and user side to white
      for (const line of opening.lines) {
        if (line.orientation !== 'white') {
          line.orientation = 'white';
          updated = true;
        }
        if (line.userSide !== 'white') {
          line.userSide = 'white';
          updated = true;
        }
      }
      console.log(`Set ${opening.name} to White perspective`);
    } else {
      console.log(`Unknown opening: ${opening.name}`);
    }
    
    if (updated) {
      await opening.save();
    }
  }
  
  console.log('All opening perspectives have been fixed!');
  await mongoose.disconnect();
}

fixOpeningPerspectives().catch(console.error); 