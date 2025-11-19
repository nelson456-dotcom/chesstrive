const mongoose = require('mongoose');
const fs = require('fs');
const csv = require('csv-parse');
const { Chess } = require('chess.js');
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

// Validate puzzle moves
const validatePuzzle = (fen, moves) => {
  try {
    const chess = new Chess(fen);
    
    // Check if position is valid
    if (chess.isCheckmate() || chess.isStalemate() || chess.isDraw()) {
      return false;
    }
    
    // Check if moves are valid
    for (const move of moves) {
      if (!chess.move(move, { sloppy: true })) {
        return false;
      }
    }
    
    return true;
  } catch (error) {
    return false;
  }
};

// Map themes to our standardized format
const normalizeTheme = (themes) => {
  const themeMap = {
    // Basic Tactics
    'fork': 'fork',
    'pin': 'pin', 
    'skewer': 'skewer',
    'discoveredattack': 'discovered_attack',
    'discovered_attack': 'discovered_attack',
    'deflection': 'deflection',
    'interference': 'interference',
    'attraction': 'attraction',
    'sacrifice': 'sacrifice',
    
    // Mate Patterns
    'backrankmate': 'back_rank_mate',
    'back_rank_mate': 'back_rank_mate',
    'smotheredmate': 'smothered_mate',
    'smothered_mate': 'smothered_mate',
    'bodenmate': 'boden_mate',
    'boden_mate': 'boden_mate',
    'matein1': 'mate_in_1',
    'mate_in_1': 'mate_in_1',
    'matein2': 'mate_in_2',
    'mate_in_2': 'mate_in_2',
    'matein3': 'mate_in_3',
    'mate_in_3': 'mate_in_3',
    'mate': 'mate',
    
    // Endgames
    'endgame': 'endgame',
    'pawnendgame': 'pawn_endgame',
    'pawn_endgame': 'pawn_endgame',
    'rookendgame': 'rook_endgame',
    'rook_endgame': 'rook_endgame',
    'bishopendgame': 'bishop_endgame',
    'bishop_endgame': 'bishop_endgame',
    'queenendgame': 'queen_endgame',
    'queen_endgame': 'queen_endgame',
    'queenrookendgame': 'queen_rook_endgame',
    'queen_rook_endgame': 'queen_rook_endgame',
    
    // Positional Themes
    'advancedpawn': 'advanced_pawn',
    'advanced_pawn': 'advanced_pawn',
    'hangingpiece': 'hanging_piece',
    'hanging_piece': 'hanging_piece',
    'exposedking': 'exposed_king',
    'exposed_king': 'exposed_king',
    'promotion': 'promotion',
    'zugzwang': 'zugzwang',
    
    // Attack Patterns
    'kingsideattack': 'kingside_attack',
    'kingside_attack': 'kingside_attack',
    'queensideattack': 'queenside_attack',
    'queenside_attack': 'queenside_attack',
    'attackingf2f7': 'attacking_f2_f7',
    'attacking_f2_f7': 'attacking_f2_f7',
    
    // Game Phases
    'opening': 'opening',
    'middlegame': 'middlegame',
    
    // Move Types
    'onemove': 'one_move',
    'one_move': 'one_move',
    'short': 'short',
    'long': 'long',
    'verylong': 'very_long',
    'very_long': 'very_long',
    'quietmove': 'quiet_move',
    'quiet_move': 'quiet_move',
    'defensivemove': 'defensive_move',
    'defensive_move': 'defensive_move',
    
    // Difficulty Levels
    'master': 'master',
    'mastervsmaster': 'master_vs_master',
    'master_vs_master': 'master_vs_master',
    'supergm': 'super_gm',
    'super_gm': 'super_gm',
    'crushing': 'crushing',
    'advantage': 'advantage',
    
    // Additional themes from CSV
    'crushing': 'crushing',
    'hangingpiece': 'hanging_piece',
    'hangingPiece': 'hanging_piece',
    'rookendgame': 'rook_endgame',
    'rookEndgame': 'rook_endgame',
    'advantage': 'advantage',
    'short': 'short',
    'middlegame': 'middlegame',
    'long': 'long',
    'verylong': 'very_long',
    'veryLong': 'very_long',
    'quietmove': 'quiet_move',
    'quietMove': 'quiet_move',
    'defensivemove': 'defensive_move',
    'defensiveMove': 'defensive_move',
    'onemove': 'one_move',
    'oneMove': 'one_move',
    'smotheredmate': 'smothered_mate',
    'smotheredMate': 'smothered_mate',
    'bodenmate': 'boden_mate',
    'bodenMate': 'boden_mate',
    'matein3': 'mate_in_3',
    'mateIn3': 'mate_in_3',
    'mate': 'mate',
    'pawnendgame': 'pawn_endgame',
    'pawnEndgame': 'pawn_endgame',
    'bishopendgame': 'bishop_endgame',
    'bishopEndgame': 'bishop_endgame',
    'queenendgame': 'queen_endgame',
    'queenEndgame': 'queen_endgame',
    'queenrookendgame': 'queen_rook_endgame',
    'queenRookEndgame': 'queen_rook_endgame',
    'advancedpawn': 'advanced_pawn',
    'advancedPawn': 'advanced_pawn',
    'exposedking': 'exposed_king',
    'exposedKing': 'exposed_king',
    'promotion': 'promotion',
    'zugzwang': 'zugzwang',
    'kingsideattack': 'kingside_attack',
    'kingsideAttack': 'kingside_attack',
    'queensideattack': 'queenside_attack',
    'queensideAttack': 'queenside_attack',
    'attackingf2f7': 'attacking_f2_f7',
    'attackingF2F7': 'attacking_f2_f7',
    'opening': 'opening',
    'mastervsmaster': 'master_vs_master',
    'masterVsMaster': 'master_vs_master',
    'supergm': 'super_gm',
    'superGM': 'super_gm',
    
    // Legacy mappings
    'tactic': 'tactic',
    'tactics': 'tactic',
    'attack': 'attack'
  };
  
  for (const theme of themes) {
    const normalized = themeMap[theme.toLowerCase()];
    if (normalized) {
      return normalized;
    }
  }
  
  // Default to tactic if no recognized theme
  return 'tactic';
};

const importPuzzles = async () => {
  try {
    await connectDB();
    
    // Clear existing puzzles
    await Puzzle.deleteMany({});
    console.log('Cleared existing puzzles');
    
    let totalProcessed = 0;
    let totalImported = 0;
    const batchSize = 100;
    let currentBatch = [];
    
    const parser = fs
      .createReadStream(__dirname + '/../puzzles/lichess_db_puzzle.csv')
      .pipe(csv.parse({
        columns: true,
        skip_empty_lines: true
      }));

    for await (const record of parser) {
      totalProcessed++;
      
      // Skip if missing required fields
      if (!record.FEN || !record.Moves || !record.Themes) {
        continue;
      }
      
      const moves = record.Moves.split(' ').filter(m => m.trim());
      if (moves.length === 0) {
        continue;
      }
      
      // Validate puzzle
      if (!validatePuzzle(record.FEN, moves)) {
        continue;
      }
      
      const themes = record.Themes.split(/[, ]+/).map(t => t.toLowerCase().trim()).filter(t => t);
      const primaryTheme = normalizeTheme(themes);
      
      const puzzle = {
        fen: record.FEN,
        moves: moves,
        rating: parseInt(record.Rating) || 1500,
        ratingDeviation: parseInt(record.RatingDeviation) || 100,
        popularity: parseInt(record.Popularity) || 50,
        nbPlays: parseInt(record.NbPlays) || 100,
        themes: themes, // Keep original themes array for backward compatibility
        theme: primaryTheme, // Add primary theme field
        url: record.URL || `https://lichess.org/training/${record.PuzzleId}`,
        random: Math.random() // Add random field for better querying
      };
      
      currentBatch.push(puzzle);
      
      // Insert batch when it reaches batchSize
      if (currentBatch.length >= batchSize) {
        await Puzzle.insertMany(currentBatch);
        totalImported += currentBatch.length;
        console.log(`Imported ${totalImported} puzzles (processed ${totalProcessed})`);
        currentBatch = [];
      }
      
      // Progress indicator
      if (totalProcessed % 1000 === 0) {
        console.log(`Processed ${totalProcessed} records...`);
      }
    }
    
    // Insert remaining puzzles
    if (currentBatch.length > 0) {
      await Puzzle.insertMany(currentBatch);
      totalImported += currentBatch.length;
    }

    // Verify puzzles were added
    const count = await Puzzle.countDocuments();
    console.log(`\nImport complete!`);
    console.log(`Total records processed: ${totalProcessed}`);
    console.log(`Total puzzles imported: ${totalImported}`);
    console.log(`Total puzzles in database: ${count}`);
    
    // Log puzzles by theme
    const themeCounts = await Puzzle.aggregate([
      { $group: { _id: '$theme', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    console.log('\nPuzzles by theme:');
    themeCounts.forEach(t => {
      console.log(`  ${t._id}: ${t.count}`);
    });
    
    // Create indexes for better performance
    await Puzzle.collection.createIndex({ theme: 1, random: 1 });
    await Puzzle.collection.createIndex({ rating: 1 });
    console.log('\nIndexes created for better performance');
    
    process.exit(0);
  } catch (err) {
    console.error('Error importing puzzles:', err);
    process.exit(1);
  }
};

importPuzzles(); 