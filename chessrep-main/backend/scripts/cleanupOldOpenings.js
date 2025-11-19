const mongoose = require('mongoose');
const Opening = require('../models/Opening');

const MONGO_URI = 'mongodb://localhost:27017/chessrep';

const realOpeningNames = [
  'Ruy Lopez (Spanish Opening)',
  'Italian Game',
  'Scotch Game',
  "King's Gambit",
  'Vienna Game',
  'English Opening',
  'Catalan Opening',
  "Queen's Gambit",
  'London System',
  "King's Indian Attack",
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

async function cleanupOldOpenings() {
  await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  
  console.log('Cleaning up old openings...');
  
  // Find all openings
  const allOpenings = await Opening.find({});
  console.log(`Found ${allOpenings.length} total openings`);
  
  // Count how many will be removed
  let toRemove = 0;
  for (const opening of allOpenings) {
    if (!realOpeningNames.includes(opening.name)) {
      toRemove++;
    }
  }
  
  console.log(`Will remove ${toRemove} old openings`);
  
  // Remove openings that are not in our real list
  const result = await Opening.deleteMany({
    name: { $nin: realOpeningNames }
  });
  
  console.log(`Removed ${result.deletedCount} old openings`);
  
  // Verify what's left
  const remainingOpenings = await Opening.find({});
  console.log(`Remaining openings: ${remainingOpenings.length}`);
  
  for (const opening of remainingOpenings) {
    console.log(`- ${opening.name} (moves: ${opening.lines[0].moves.length})`);
  }
  
  await mongoose.disconnect();
  console.log('Cleanup complete!');
}

cleanupOldOpenings().catch(console.error); 