const { Chess } = require('chess.js');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const csv = require('csv-parser');
const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/chessrep', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Blunder Position Schema
const blunderPositionSchema = new mongoose.Schema({
  fen: { type: String, required: true },
  bestMove: { type: String, required: true },
  blunderMove: { type: String, required: true },
  bestMoveEval: { type: Number, required: true },
  blunderMoveEval: { type: Number, required: true },
  rating: { type: Number, required: true },
  themes: { type: String, default: 'tactical' },
  puzzleId: { type: String, required: true }
});

const BlunderPosition = mongoose.model('BlunderPosition', blunderPositionSchema);

// Helper function to run Stockfish analysis
async function analyseFen(fen, depth = 12, multiPv = 6) {
  return new Promise((resolve, reject) => {
    // Use system Stockfish on Linux, or local executable
    let stockPath;
    if (process.platform === 'win32') {
      stockPath = path.join(__dirname, '../engines/stockfish.exe');
    } else {
      // Try system Stockfish first, then local binary
      stockPath = fs.existsSync('/usr/bin/stockfish') 
        ? '/usr/bin/stockfish' 
        : fs.existsSync('/usr/local/bin/stockfish')
        ? '/usr/local/bin/stockfish'
        : path.join(__dirname, '../engines/stockfish');
    }
    const engine = spawn(stockPath);
    const evaluations = [];

    engine.stdout.on('data', chunk => {
      const lines = chunk.toString().split(/\r?\n/);
      lines.forEach(line => {
        if (line.startsWith('info') && line.includes(' pv ')) {
          const parts = line.split(' ');
          const idxPv = parts.indexOf('pv');
          const idxScore = parts.indexOf('cp');
          if (idxPv !== -1 && idxScore !== -1) {
            const move = parts[idxPv+1];
            const score = parseInt(parts[idxScore+1]);
            // avoid duplicates
            if (!evaluations.find(e=>e.move===move)) evaluations.push({move, scoreCp: score});
          }
        }
        if (line.startsWith('bestmove')) {
          engine.kill();
          resolve(evaluations);
        }
      });
    });

    engine.stdin.write(`position fen ${fen}\n`);
    engine.stdin.write(`setoption name MultiPV value ${multiPv}\n`);
    engine.stdin.write(`go depth ${depth}\n`);

    // timeout safety
    setTimeout(()=>{
      engine.kill();
      if(evaluations.length) resolve(evaluations); else reject(new Error('Stockfish timeout'));
    }, 10000);
  });
}

async function analyzeBlunderPositions() {
  try {
    console.log('Starting blunder position analysis...');
    
    // Clear existing blunder positions
    await BlunderPosition.deleteMany({});
    console.log('Cleared existing blunder positions');

    const PUZZLES_CSV_PATH = path.join(__dirname, '../data/puzzles.csv');
    const positions = [];
    let loadedCount = 0;
    const MAX_POSITIONS = 100;

    // Load positions from CSV
    console.log('Loading positions from CSV...');
    
    await new Promise((resolve, reject) => {
      fs.createReadStream(PUZZLES_CSV_PATH)
        .pipe(csv())
        .on('data', (row) => {
          if (loadedCount >= MAX_POSITIONS) return;

          if (row.FEN && row.Moves && row.Rating) {
            const rating = parseInt(row.Rating) || 0;
            
            // Use puzzles with reasonable ratings
            if (rating >= 800 && rating <= 2000) {
              const puzzle = {
                id: row.PuzzleId || `puzzle_${loadedCount}`,
                fen: row.FEN,
                moves: row.Moves.split(' '),
                rating: rating,
                themes: row.Themes || 'tactical',
                url: row.GameUrl || '',
              };
              
              // Validate the position is legal, not in check, and has multiple moves
              try {
                const chess = new Chess(puzzle.fen);
                
                if (!chess.isCheck() && 
                    !chess.isCheckmate() && 
                    !chess.isStalemate() && 
                    chess.moves().length >= 4) {
                  positions.push(puzzle);
                  loadedCount++;
                  
                  if (loadedCount % 20 === 0) {
                    console.log(`Loaded ${loadedCount} positions...`);
                  }
                }
              } catch (err) {
                // Skip invalid positions
              }
            }
          }
        })
        .on('end', () => {
          console.log(`Loaded ${positions.length} valid positions from CSV`);
          resolve();
        })
        .on('error', (err) => {
          console.error('Error loading positions:', err);
          reject(err);
        });
    });

    console.log(`Analyzing ${positions.length} positions with Stockfish...`);
    
    let analyzedCount = 0;
    let savedCount = 0;

    for (const position of positions) {
      try {
        console.log(`Analyzing position ${analyzedCount + 1}/${positions.length}: ${position.fen}`);
        
        // Analyze with Stockfish
        const evaluations = await analyseFen(position.fen, 12, 6);
        
        if (evaluations.length < 2) {
          console.log(`Skipping position - not enough moves analyzed`);
          analyzedCount++;
          continue;
        }

        // Sort moves by evaluation (best first)
        evaluations.sort((a, b) => b.scoreCp - a.scoreCp);
        
        const bestMove = evaluations[0].move;
        const bestEval = evaluations[0].scoreCp;
        
        // Find a significantly worse move as the blunder
        let blunderMove = null;
        let blunderEval = null;
        
        for (let i = 1; i < evaluations.length; i++) {
          const scoreDiff = bestEval - evaluations[i].scoreCp;
          if (scoreDiff >= 200) { // At least 2 pawns worse
            blunderMove = evaluations[i].move;
            blunderEval = evaluations[i].scoreCp;
            break;
          }
        }
        
        if (!blunderMove) {
          // If no significant blunder found, use the worst move
          blunderMove = evaluations[evaluations.length - 1].move;
          blunderEval = evaluations[evaluations.length - 1].scoreCp;
        }

        // Save to database
        const blunderPos = new BlunderPosition({
          fen: position.fen,
          bestMove: bestMove,
          blunderMove: blunderMove,
          bestMoveEval: bestEval,
          blunderMoveEval: blunderEval,
          rating: position.rating,
          themes: position.themes,
          puzzleId: position.id
        });

        await blunderPos.save();
        savedCount++;
        
        console.log(`Saved: best=${bestMove} (${bestEval}cp), blunder=${blunderMove} (${blunderEval}cp), diff=${bestEval - blunderEval}cp`);
        
        analyzedCount++;
        
        // Small delay to not overwhelm the system
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (err) {
        console.error(`Error analyzing position ${position.fen}:`, err.message);
        analyzedCount++;
        continue;
      }
    }

    console.log(`\nAnalysis complete!`);
    console.log(`Analyzed: ${analyzedCount} positions`);
    console.log(`Saved: ${savedCount} blunder positions to database`);
    
    // Show some examples
    const examples = await BlunderPosition.find().limit(5);
    console.log('\nExample saved positions:');
    examples.forEach((pos, i) => {
      console.log(`${i+1}. FEN: ${pos.fen}`);
      console.log(`   Best: ${pos.bestMove} (${pos.bestMoveEval}cp), Blunder: ${pos.blunderMove} (${pos.blunderMoveEval}cp)`);
      console.log(`   Rating: ${pos.rating}, Themes: ${pos.themes}\n`);
    });

  } catch (error) {
    console.error('Error in analyzeBlunderPositions:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the analysis
analyzeBlunderPositions();

