const mongoose = require('mongoose');
const Puzzle = require('../models/Puzzle');
require('dotenv').config();

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

const checkThemes = async () => {
  try {
    await connectDB();
    
    // Get all unique themes
    const themes = await Puzzle.distinct('themes');
    console.log('\n=== ALL AVAILABLE THEMES ===');
    console.log(themes.sort());
    
    // Get count for each theme
    console.log('\n=== THEME COUNTS ===');
    for (const theme of themes.sort()) {
      const count = await Puzzle.countDocuments({ themes: theme });
      console.log(`${theme}: ${count} puzzles`);
    }
    
    // Check specific themes that might be problematic
    const problematicThemes = [
      'fork', 'pin', 'skewer', 'discoveredAttack', 'doubleAttack', 
      'backRank', 'deflection', 'decoy', 'zwischenzug', 'overloading',
      'trappedPiece', 'clearance', 'interference', 'xRayAttack',
      'smotheredMate', 'underPromotion', 'desperado', 'perpetual',
      'stalemate', 'mateIn1', 'mateIn2', 'mateIn3', 'sacrifice',
      'attraction', 'blocking', 'matingNet', 'quietMove', 'advancedPawn',
      'passedPawn', 'promotion', 'mate', 'short', 'middlegame'
    ];
    
    console.log('\n=== CHECKING FRONTEND THEMES ===');
    for (const theme of problematicThemes) {
      const count = await Puzzle.countDocuments({ 
        themes: { $elemMatch: { $regex: new RegExp(theme, 'i') } }
      });
      console.log(`${theme}: ${count} puzzles`);
    }
    
    process.exit(0);
  } catch (err) {
    console.error('Error checking themes:', err);
    process.exit(1);
  }
};

checkThemes(); 