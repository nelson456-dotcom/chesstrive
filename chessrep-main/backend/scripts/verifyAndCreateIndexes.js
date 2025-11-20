const mongoose = require('mongoose');
const Puzzle = require('../models/Puzzle');

const MONGO_URI = process.env.MONGO_URL || 'mongodb://localhost:27017/chessrep';

async function verifyAndCreateIndexes() {
  try {
    await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('✅ Connected to MongoDB');
    
    const collection = Puzzle.collection;
    
    // Check existing indexes
    console.log('\n📋 Checking existing indexes...');
    const existingIndexes = await collection.indexes();
    console.log('Existing indexes:', existingIndexes.map(idx => idx.name));
    
    // Create indexes if they don't exist
    console.log('\n🔨 Creating indexes (this may take 10-30 minutes for 4.9M documents)...');
    
    try {
      await collection.createIndex({ theme: 1 }, { background: true, name: 'theme_1' });
      console.log('✅ Created index: theme_1');
    } catch (e) {
      if (e.message.includes('already exists')) {
        console.log('ℹ️  Index theme_1 already exists');
      } else {
        console.error('❌ Error creating theme_1 index:', e.message);
      }
    }
    
    try {
      await collection.createIndex({ rating: 1 }, { background: true, name: 'rating_1' });
      console.log('✅ Created index: rating_1');
    } catch (e) {
      if (e.message.includes('already exists')) {
        console.log('ℹ️  Index rating_1 already exists');
      } else {
        console.error('❌ Error creating rating_1 index:', e.message);
      }
    }
    
    try {
      await collection.createIndex({ theme: 1, rating: 1 }, { background: true, name: 'theme_1_rating_1' });
      console.log('✅ Created index: theme_1_rating_1');
    } catch (e) {
      if (e.message.includes('already exists')) {
        console.log('ℹ️  Index theme_1_rating_1 already exists');
      } else {
        console.error('❌ Error creating theme_1_rating_1 index:', e.message);
      }
    }
    
    // Verify indexes
    console.log('\n📋 Final index list:');
    const finalIndexes = await collection.indexes();
    finalIndexes.forEach(idx => {
      console.log(`  - ${idx.name}: ${JSON.stringify(idx.key)}`);
    });
    
    // Check puzzle count
    const count = await collection.countDocuments();
    console.log(`\n📊 Total puzzles in database: ${count.toLocaleString()}`);
    
    await mongoose.disconnect();
    console.log('\n✅ Done!');
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

verifyAndCreateIndexes();

