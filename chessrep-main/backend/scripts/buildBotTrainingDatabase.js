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
const { spawn } = require('child_process');
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
    rating: { type: Number }, // Average rating of players who played this move
    avgEval: { type: Number }, // Average Stockfish evaluation after this move (in centipawns)
    quality: { type: String } // 'excellent', 'good', 'average', 'poor' based on Stockfish analysis
  }],
  totalGames: { type: Number, default: 1 },
  lastUpdated: { type: Date, default: Date.now }
}, { collection: 'botTrainingPositions' });

// Index for fast lookups
positionSchema.index({ fen: 1, ratingRange: 1 });

const Position = mongoose.model('BotTrainingPosition', positionSchema);

// Rating range mapping from PGN files
// Only includes files that actually exist in backend/data/level/
const RATING_RANGES = {
  '500-800.pgn': '500-800',
  '800-1200.pgn': '800-1200',
  '1200-1400.pgn': '1200-1400',
  '1600-1700.pgn': '1600-1700',
  '1700.pgn': '1700-1800',
  '1800.pgn': '1800-2000',
  '1800-2500.pgn': '1800-2500'
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

// Get Stockfish path
function getStockfishPath() {
  if (process.platform === 'win32') {
    return path.join(__dirname, '../engines/stockfish.exe');
  }
  if (fs.existsSync('/usr/games/stockfish')) return '/usr/games/stockfish';
  if (fs.existsSync('/usr/bin/stockfish')) return '/usr/bin/stockfish';
  if (fs.existsSync('/usr/local/bin/stockfish')) return '/usr/local/bin/stockfish';
  return path.join(__dirname, '../engines/stockfish');
}

// Analyze a position with Stockfish to get move evaluation
async function analyzeMoveWithStockfish(fen, move, depth = 8) {
  return new Promise((resolve, reject) => {
    const stockfishPath = getStockfishPath();
    if (!fs.existsSync(stockfishPath)) {
      console.warn(`⚠️  Stockfish not found at ${stockfishPath}, skipping analysis`);
      resolve(null);
      return;
    }

    const engine = spawn(stockfishPath);
    let output = '';
    let bestMove = null;
    let evaluation = null;
    let timeout;

    const cleanup = () => {
      clearTimeout(timeout);
      if (engine && !engine.killed) {
        engine.kill();
      }
    };

    timeout = setTimeout(() => {
      cleanup();
      resolve(null);
    }, 5000); // 5 second timeout

    engine.stdout.on('data', (data) => {
      output += data.toString();
      const lines = output.split('\n');
      
      for (const line of lines) {
        // Look for bestmove
        if (line.startsWith('bestmove')) {
          const match = line.match(/bestmove\s+(\S+)/);
          if (match) {
            bestMove = match[1];
          }
        }
        
        // Look for evaluation in info lines
        if (line.includes('depth') && line.includes('score')) {
          const cpMatch = line.match(/score\s+cp\s+(-?\d+)/);
          if (cpMatch) {
            evaluation = parseInt(cpMatch[1]);
          }
        }
      }
    });

    engine.stderr.on('data', (data) => {
      // Ignore stderr
    });

    engine.on('error', (error) => {
      cleanup();
      resolve(null);
    });

    engine.on('close', () => {
      cleanup();
      // Make the move and evaluate the resulting position
      try {
        const chess = new Chess(fen);
        const chessMove = chess.move(move, { sloppy: true });
        if (chessMove) {
          // If we got an evaluation, use it; otherwise return null
          resolve(evaluation);
        } else {
          resolve(null);
        }
      } catch (e) {
        resolve(null);
      }
    });

    // Initialize Stockfish
    engine.stdin.write('uci\n');
    engine.stdin.write('isready\n');
    
    setTimeout(() => {
      // Make the move first
      const chess = new Chess(fen);
      try {
        const chessMove = chess.move(move, { sloppy: true });
        if (chessMove) {
          const newFen = chess.fen();
          engine.stdin.write(`position fen ${newFen}\n`);
          engine.stdin.write(`go depth ${depth}\n`);
        } else {
          cleanup();
          resolve(null);
        }
      } catch (e) {
        cleanup();
        resolve(null);
      }
    }, 100);
  });
}

// Determine move quality based on Stockfish evaluation
function getMoveQuality(evalBefore, evalAfter, ratingRange) {
  if (evalAfter === null || evalBefore === null) return 'average';
  
  const evalDiff = evalAfter - evalBefore;
  const rating = parseInt(ratingRange.split('-')[0]) || 1200;
  
  // For lower ratings, moves can be worse and still be "good" for that level
  // For higher ratings, we expect better moves
  if (rating < 1200) {
    // Beginner: moves that lose less than 200cp are "good"
    if (evalDiff > -50) return 'excellent';
    if (evalDiff > -150) return 'good';
    if (evalDiff > -300) return 'average';
    return 'poor';
  } else if (rating < 1800) {
    // Intermediate: moves that lose less than 100cp are "good"
    if (evalDiff > -30) return 'excellent';
    if (evalDiff > -100) return 'good';
    if (evalDiff > -200) return 'average';
    return 'poor';
  } else {
    // Advanced: moves that lose less than 50cp are "good"
    if (evalDiff > -20) return 'excellent';
    if (evalDiff > -50) return 'good';
    if (evalDiff > -100) return 'average';
    return 'poor';
  }
}

async function buildDatabase() {
  try {
    console.log('🏗️  Building Bot Training Database from PGN files...\n');
    
    // Clear existing database (optional - comment out if you want to append)
    console.log('🗑️  Clearing existing training positions...');
    await Position.deleteMany({});
    console.log('✅ Cleared existing positions\n');
    
    // Check both data directory and data/level subdirectory
    const dataDir = path.join(__dirname, '../data');
    const levelDir = path.join(dataDir, 'level');
    
    let pgnFiles = [];
    
    // First, try the level subdirectory (preferred location)
    if (fs.existsSync(levelDir)) {
      console.log('📁 Found level/ subdirectory, using games from there...\n');
      const levelFiles = fs.readdirSync(levelDir);
      pgnFiles = levelFiles
        .filter(f => f.endsWith('.pgn'))
        .map(f => path.join(levelDir, f));
      
      // Filter out files that don't match our rating range pattern
      // Only keep files that match patterns like "500-800.pgn", "800-1200.pgn", etc.
      pgnFiles = pgnFiles.filter(filePath => {
        const filename = path.basename(filePath);
        // Check if filename matches rating range pattern (e.g., "500-800.pgn", "1800-2500.pgn")
        const hasRatingPattern = /\d+-\d+\.pgn$/.test(filename) || /^\d+\.pgn$/.test(filename);
        if (!hasRatingPattern) {
          console.log(`⚠️  Skipping ${filename} - doesn't match rating range pattern`);
        }
        return hasRatingPattern;
      });
    } else {
      // Fallback to data directory (but warn about it)
      console.log('⚠️  level/ subdirectory not found, checking data/ directory...\n');
      const files = fs.readdirSync(dataDir);
      const levelPgnFiles = files.filter(f => f.endsWith('.pgn'));
      pgnFiles = levelPgnFiles.map(f => path.join(dataDir, f));
      
      // Filter to only include files with rating patterns
      pgnFiles = pgnFiles.filter(filePath => {
        const filename = path.basename(filePath);
        const hasRatingPattern = /\d+-\d+\.pgn$/.test(filename) || /^\d+\.pgn$/.test(filename);
        if (!hasRatingPattern) {
          console.log(`⚠️  Skipping ${filename} - doesn't match rating range pattern`);
        }
        return hasRatingPattern;
      });
    }
    
    if (pgnFiles.length === 0) {
      console.log('❌ ERROR: No valid PGN files found!');
      console.log(`   Expected files in: ${levelDir}`);
      console.log(`   Or fallback: ${dataDir}`);
      console.log(`   Files should match pattern: "500-800.pgn", "800-1200.pgn", etc.`);
      await mongoose.disconnect();
      process.exit(1);
    }
    
    console.log(`✅ Found ${pgnFiles.length} valid PGN files to process:\n`);
    pgnFiles.forEach(f => console.log(`   - ${path.basename(f)}`));
    console.log('');
    
    let totalGames = 0;
    let totalPositions = 0;
    
    for (const filePath of pgnFiles) {
      const filename = path.basename(filePath);
      
      // Skip files that don't exist
      if (!fs.existsSync(filePath)) {
        console.log(`⚠️  Skipping ${filename} - file does not exist`);
        continue;
      }
      
      const ratingRange = getRatingRange(filename);
      
      if (!ratingRange) {
        console.log(`⚠️  Skipping ${filename} - could not determine rating range`);
        continue;
      }
      
      console.log(`\n📂 Processing: ${filename} → Rating range: ${ratingRange}`);
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

