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
async function analyseFen(fen, depth = 12, multiPv = 8) {
  return new Promise((resolve, reject) => {
    const stockPath = path.join(__dirname, '../engines/stockfish.exe');
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

async function addMoreBlunderPositions() {
  try {
    console.log('Adding 100 more blunder positions with less obvious choices...');
    
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
            if (rating >= 1000 && rating <= 1800) {
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
                    chess.moves().length >= 6) { // More moves for less obvious choices
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
        const evaluations = await analyseFen(position.fen, 12, 8);
        
        if (evaluations.length < 3) {
          console.log(`Skipping position - not enough moves analyzed`);
          analyzedCount++;
          continue;
        }

        // Sort moves by evaluation (best first)
        evaluations.sort((a, b) => b.scoreCp - a.scoreCp);
        
        const bestMove = evaluations[0].move;
        const bestEval = evaluations[0].scoreCp;
        
        // Find a move that's worse but not too obvious (50-150 centipawns worse)
        let blunderMove = null;
        let blunderEval = null;
        
        for (let i = 1; i < evaluations.length; i++) {
          const scoreDiff = bestEval - evaluations[i].scoreCp;
          if (scoreDiff >= 50 && scoreDiff <= 150) { // Less obvious difference
            blunderMove = evaluations[i].move;
            blunderEval = evaluations[i].scoreCp;
            break;
          }
        }
        
        if (!blunderMove) {
          // If no subtle blunder found, look for a slightly worse move
          for (let i = 1; i < evaluations.length; i++) {
            const scoreDiff = bestEval - evaluations[i].scoreCp;
            if (scoreDiff >= 30 && scoreDiff <= 200) {
              blunderMove = evaluations[i].move;
              blunderEval = evaluations[i].scoreCp;
              break;
            }
          }
        }

        if (!blunderMove) {
          console.log(`Skipping position - no suitable blunder found`);
          analyzedCount++;
          continue;
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
    console.log(`Saved: ${savedCount} additional blunder positions to database`);
    
    // Show total count
    const totalPositions = await BlunderPosition.countDocuments();
    console.log(`Total blunder positions in database: ${totalPositions}`);

  } catch (error) {
    console.error('Error in addMoreBlunderPositions:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the analysis
addMoreBlunderPositions();

