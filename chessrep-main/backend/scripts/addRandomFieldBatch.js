const mongoose = require('mongoose');
const Puzzle = require('../models/Puzzle');

const MONGO_URI = 'mongodb://localhost:27017/chessrep';

async function addRandomFieldBatch() {
  try {
    await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Connected to MongoDB');
    
    const batchSize = 1000;
    let processed = 0;
    let updated = 0;
    
    while (true) {
      // Get batch of puzzles without random field
      const puzzles = await Puzzle.find(
        { random: { $exists: false } }, 
        '_id'
      ).limit(batchSize).lean();
      
      if (puzzles.length === 0) break;
      
      // Update batch with random values
      const updates = puzzles.map(puzzle => ({
        updateOne: {
          filter: { _id: puzzle._id },
          update: { $set: { random: Math.random() } }
        }
      }));
      
      const result = await Puzzle.bulkWrite(updates);
      updated += result.modifiedCount;
      processed += puzzles.length;
      
      console.log(`Processed ${processed} puzzles, updated ${updated} with random field`);
      
      // Small delay to prevent memory buildup
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Create index on random field
    await Puzzle.collection.createIndex({ random: 1 });
    console.log('Created index on random field');
    
    await mongoose.disconnect();
    console.log(`Random field migration complete. Updated ${updated} puzzles.`);
  } catch (error) {
    console.error('Error:', error);
    await mongoose.disconnect();
  }
}

addRandomFieldBatch(); 