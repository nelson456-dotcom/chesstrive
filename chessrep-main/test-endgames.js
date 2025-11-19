// Test script to check endgame database retrieval
const mongoose = require('mongoose');
const Puzzle = require('./models/Puzzle');

// Connect to MongoDB
const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/chessrep';

async function testEndgameRetrieval() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
    });
    
    console.log('✅ Connected to MongoDB');
    
    // Test 1: Check total puzzles in database
    const totalPuzzles = await Puzzle.countDocuments();
    console.log(`📊 Total puzzles in database: ${totalPuzzles}`);
    
    // Test 2: Check endgame puzzles specifically
    const endgamePuzzles = await Puzzle.find({
      $or: [
        { theme: 'endgame' },
        { themes: { $in: ['endgame'] } }
      ]
    }).limit(10).lean();
    
    console.log(`🎯 Endgame puzzles found: ${endgamePuzzles.length}`);
    
    if (endgamePuzzles.length > 0) {
      console.log('\n📋 Sample endgame puzzles:');
      endgamePuzzles.forEach((puzzle, index) => {
        console.log(`${index + 1}. ID: ${puzzle._id}`);
        console.log(`   FEN: ${puzzle.fen}`);
        console.log(`   Theme: ${puzzle.theme || 'N/A'}`);
        console.log(`   Themes: ${JSON.stringify(puzzle.themes || [])}`);
        console.log(`   Rating: ${puzzle.rating || 'N/A'}`);
        console.log(`   Moves: ${JSON.stringify(puzzle.moves || [])}`);
        console.log('---');
      });
    } else {
      console.log('❌ No endgame puzzles found in database');
      
      // Check what themes are available
      const themes = await Puzzle.distinct('theme');
      console.log('📝 Available themes in database:', themes);
      
      const themesArray = await Puzzle.distinct('themes');
      console.log('📝 Available themes array in database:', themesArray);
    }
    
    // Test 3: Check puzzle structure
    const samplePuzzle = await Puzzle.findOne();
    if (samplePuzzle) {
      console.log('\n🔍 Sample puzzle structure:');
      console.log(JSON.stringify(samplePuzzle.toObject(), null, 2));
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

testEndgameRetrieval();
