#!/usr/bin/env node

/**
 * Build Bot Training Database from PGN Files
 * 
 * This script processes PGN files organized by rating and builds a position database
 * that the bots can use to play more like humans at each rating level.
 * 
 * Usage:
 *   node scripts/buildBotTrainingDatabase.js
 */

const fs = require('fs');
const path = require('path');
const { Chess } = require('chess.js');
const PGNParser = require('pgn-parser');
const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/chessrep';
mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 30000
}).then(() => {
  console.log('✅ Connected to MongoDB');
  buildDatabase();
}).catch(err => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});

// Position database schema
const positionSchema = new mongoose.Schema({
  fen: { type: String, required: true, index: true },
  ratingRange: { type: String, required: true, index: true }, // e.g., "800-1200", "1200-1400"
  moves: [{
    move: { type: String, required: true },
    count: { type: Number, default: 1 },
    rating: { type: Number } // Average rating of players who played this move
  }],
  totalGames: { type: Number, default: 1 },
  lastUpdated: { type: Date, default: Date.now }
}, { collection: 'botTrainingPositions' });

// Index for fast lookups
positionSchema.index({ fen: 1, ratingRange: 1 });

const Position = mongoose.model('BotTrainingPosition', positionSchema);

// Rating range mapping from PGN files
const RATING_RANGES = {
  '500-800.pgn': '500-800',
  '800-1200.pgn': '800-1200',
  '1200-1400.pgn': '1200-1400',
  '1600-1700.pgn': '1600-1700',
  '1700.pgn': '1700-1800',
  '1800.pgn': '1800-2000',
  'master_games.pgn': '2400-2800',
  'Kasparov.pgn': '2500-2800',
  'Karpov.pgn': '2500-2800'
};

// Also map the old files
const OLD_FILE_MAPPING = {
  'beginner_games.pgn': '800-1200',
  'intermediate_games.pgn': '1200-1800'
};

function getRatingRange(filename) {
  // Check direct mapping first
  if (RATING_RANGES[filename]) {
    return RATING_RANGES[filename];
  }
  // Check old file mapping
  if (OLD_FILE_MAPPING[filename]) {
    return OLD_FILE_MAPPING[filename];
  }
  // Try to extract from filename
  const match = filename.match(/(\d+)-(\d+)/);
  if (match) {
    return `${match[1]}-${match[2]}`;
  }
  return null;
}

function getAverageRating(game) {
  const whiteElo = parseInt(game.headers.find(h => h.name === 'WhiteElo')?.value || '0');
  const blackElo = parseInt(game.headers.find(h => h.name === 'BlackElo')?.value || '0');
  
  if (whiteElo > 0 && blackElo > 0) {
    return Math.round((whiteElo + blackElo) / 2);
  } else if (whiteElo > 0) {
    return whiteElo;
  } else if (blackElo > 0) {
    return blackElo;
  }
  return null;
}

async function processPGNFile(filePath, ratingRange) {
  console.log(`\n📖 Processing ${path.basename(filePath)} (Rating: ${ratingRange})...`);
  
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    return { games: 0, positions: 0 };
  }
  
  const fileContent = fs.readFileSync(filePath, 'utf8');
  
  // Skip comment-only files
  if (fileContent.trim().startsWith('#')) {
    console.log(`⚠️  File appears to be empty or comment-only: ${path.basename(filePath)}`);
    return { games: 0, positions: 0 };
  }
  
  let games;
  try {
    games = PGNParser.parse(fileContent);
  } catch (error) {
    console.error(`❌ Error parsing PGN file ${path.basename(filePath)}:`, error.message);
    return { games: 0, positions: 0 };
  }
  
  if (!games || games.length === 0) {
    console.log(`⚠️  No games found in ${path.basename(filePath)}`);
    return { games: 0, positions: 0 };
  }
  
  console.log(`   Found ${games.length} games`);
  
  let totalPositions = 0;
  let processedGames = 0;
  
  for (let gameIndex = 0; gameIndex < games.length; gameIndex++) {
    const game = games[gameIndex];
    
    try {
      const chess = new Chess();
      const averageRating = getAverageRating(game);
      
      // Process each move in the game
      if (game.moves && game.moves.length > 0) {
        for (let moveIndex = 0; moveIndex < game.moves.length; moveIndex++) {
          const moveObj = game.moves[moveIndex];
          const move = moveObj.move;
          
          if (!move) continue;
          
          // Get current FEN before making the move
          const currentFen = chess.fen();
          
          // Try to make the move
          try {
            const chessMove = chess.move(move, { sloppy: true });
            if (!chessMove) {
              // Move is invalid, skip
              continue;
            }
            
            // Update or create position entry
            await updatePositionDatabase(currentFen, ratingRange, move, averageRating);
            totalPositions++;
            
          } catch (moveError) {
            // Invalid move, skip
            continue;
          }
        }
      }
      
      processedGames++;
      if (processedGames % 100 === 0) {
        console.log(`   Processed ${processedGames}/${games.length} games...`);
      }
      
    } catch (error) {
      console.error(`   Error processing game ${gameIndex + 1}:`, error.message);
      continue;
    }
  }
  
  console.log(`   ✅ Processed ${processedGames} games, ${totalPositions} positions`);
  return { games: processedGames, positions: totalPositions };
}

async function updatePositionDatabase(fen, ratingRange, move, averageRating) {
  try {
    // Normalize FEN (remove move counters for better matching)
    const normalizedFen = normalizeFen(fen);
    
    // Find existing position
    let position = await Position.findOne({ fen: normalizedFen, ratingRange });
    
    if (position) {
      // Update existing position
      const existingMove = position.moves.find(m => m.move === move);
      
      if (existingMove) {
        existingMove.count += 1;
        if (averageRating) {
          // Update average rating
          const totalRating = (existingMove.rating || 0) * (existingMove.count - 1) + averageRating;
          existingMove.rating = Math.round(totalRating / existingMove.count);
        }
      } else {
        // Add new move
        position.moves.push({
          move: move,
          count: 1,
          rating: averageRating || null
        });
      }
      
      position.totalGames += 1;
      position.lastUpdated = new Date();
      await position.save();
    } else {
      // Create new position
      position = new Position({
        fen: normalizedFen,
        ratingRange: ratingRange,
        moves: [{
          move: move,
          count: 1,
          rating: averageRating || null
        }],
        totalGames: 1,
        lastUpdated: new Date()
      });
      await position.save();
    }
  } catch (error) {
    console.error(`   Error updating position database:`, error.message);
  }
}

function normalizeFen(fen) {
  // Remove move counters and halfmove clock for better position matching
  // Keep the essential position information
  const parts = fen.split(' ');
  if (parts.length >= 4) {
    return `${parts[0]} ${parts[1]} ${parts[2]} ${parts[3]}`;
  }
  return fen;
}

async function buildDatabase() {
  try {
    console.log('🏗️  Building Bot Training Database from PGN files...\n');
    
    // Clear existing database (optional - comment out if you want to append)
    console.log('🗑️  Clearing existing training positions...');
    await Position.deleteMany({});
    console.log('✅ Cleared existing positions\n');
    
    const dataDir = path.join(__dirname, '../data');
    const files = fs.readdirSync(dataDir);
    const pgnFiles = files.filter(f => f.endsWith('.pgn'));
    
    console.log(`Found ${pgnFiles.length} PGN files to process\n`);
    
    let totalGames = 0;
    let totalPositions = 0;
    
    for (const filename of pgnFiles) {
      const filePath = path.join(dataDir, filename);
      const ratingRange = getRatingRange(filename);
      
      if (!ratingRange) {
        console.log(`⚠️  Skipping ${filename} - could not determine rating range`);
        continue;
      }
      
      const result = await processPGNFile(filePath, ratingRange);
      totalGames += result.games;
      totalPositions += result.positions;
    }
    
    console.log('\n📊 Database Statistics:');
    const stats = await Position.aggregate([
      {
        $group: {
          _id: '$ratingRange',
          positions: { $sum: 1 },
          totalMoves: { $sum: { $size: '$moves' } },
          totalGames: { $sum: '$totalGames' }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    stats.forEach(stat => {
      console.log(`   ${stat._id}: ${stat.positions} positions, ${stat.totalMoves} moves, ${stat.totalGames} games`);
    });
    
    const overallStats = await Position.aggregate([
      {
        $group: {
          _id: null,
          totalPositions: { $sum: 1 },
          totalMoves: { $sum: { $size: '$moves' } },
          totalGames: { $sum: '$totalGames' }
        }
      }
    ]);
    
    if (overallStats.length > 0) {
      const overall = overallStats[0];
      console.log(`\n✅ Database build complete!`);
      console.log(`   Total positions: ${overall.totalPositions}`);
      console.log(`   Total moves: ${overall.totalMoves}`);
      console.log(`   Total games processed: ${overall.totalGames}`);
    }
    
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error building database:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

