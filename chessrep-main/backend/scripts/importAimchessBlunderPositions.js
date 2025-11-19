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

async function importAimchessBlunderPositions() {
  try {
    console.log('Starting import of Aimchess blunder positions...');
    
    // Clear existing blunder positions
    await BlunderPosition.deleteMany({});
    console.log('Cleared existing blunder positions');
    
    const CSV_PATH = path.join(__dirname, '../../../aimchess_fens.csv');
    const positions = [];
    
    // Load positions from CSV
    console.log('Loading positions from CSV...');
    
    await new Promise((resolve, reject) => {
      fs.createReadStream(CSV_PATH)
        .pipe(csv())
        .on('data', (row) => {
          if (row.FEN && row.Answer1 && row.Answer2 && row.CorrectAnswer) {
            const index = parseInt(row.Index) || 0;
            const fen = row.FEN.trim();
            const answer1 = row.Answer1.trim();
            const answer2 = row.Answer2.trim();
            const correctAnswer = row.CorrectAnswer.trim();
            
            // Determine which is the best move and which is the blunder
            let bestMove, blunderMove;
            if (correctAnswer === 'Answer1') {
              bestMove = answer1;
              blunderMove = answer2;
            } else if (correctAnswer === 'Answer2') {
              bestMove = answer2;
              blunderMove = answer1;
            } else {
              console.log(`Skipping row ${index} - invalid CorrectAnswer: ${correctAnswer}`);
              return;
            }
            
            // Validate the position is legal
            try {
              const chess = new Chess(fen);
              
              // Check if moves are valid
              const validMoves = chess.moves();
              if (!validMoves.includes(bestMove) || !validMoves.includes(blunderMove)) {
                console.log(`Skipping row ${index} - invalid moves`);
                return;
              }
              
              const puzzle = {
                id: `aimchess_${index}`,
                fen: fen,
                bestMove: bestMove,
                blunderMove: blunderMove,
                rating: 1500, // Default rating, can be adjusted
                themes: 'tactical',
              };
              
              positions.push(puzzle);
              
              if (positions.length % 50 === 0) {
                console.log(`Loaded ${positions.length} positions...`);
              }
            } catch (err) {
              console.log(`Skipping row ${index} - invalid position: ${err.message}`);
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
    let skippedCount = 0;

    for (const position of positions) {
      try {
        analyzedCount++;
        if (analyzedCount % 10 === 0) {
          console.log(`Analyzing position ${analyzedCount}/${positions.length}: ${position.fen}`);
        }
        
        // Analyze with Stockfish to get evaluations
        const evaluations = await analyseFen(position.fen, 12, 6);
        
        if (evaluations.length < 2) {
          console.log(`Skipping position ${position.id} - not enough moves analyzed`);
          skippedCount++;
          continue;
        }

        // Find evaluations for best move and blunder move
        const bestEval = evaluations.find(e => e.move === position.bestMove);
        const blunderEval = evaluations.find(e => e.move === position.blunderMove);
        
        if (!bestEval || !blunderEval) {
          // If exact moves not found, use closest match or default values
          const sortedEvals = evaluations.sort((a, b) => b.scoreCp - a.scoreCp);
          const bestEvalValue = bestEval ? bestEval.scoreCp : sortedEvals[0].scoreCp;
          const blunderEvalValue = blunderEval ? blunderEval.scoreCp : sortedEvals[sortedEvals.length - 1].scoreCp;
          
          // Ensure best move has better evaluation than blunder
          if (bestEvalValue <= blunderEvalValue) {
            console.log(`Skipping position ${position.id} - best move not better than blunder`);
            skippedCount++;
            continue;
          }
          
          // Save with found or estimated evaluations
          const blunderPos = new BlunderPosition({
            fen: position.fen,
            bestMove: position.bestMove,
            blunderMove: position.blunderMove,
            bestMoveEval: bestEvalValue,
            blunderMoveEval: blunderEvalValue,
            rating: position.rating,
            themes: position.themes,
            puzzleId: position.id
          });

          await blunderPos.save();
          savedCount++;
          continue;
        }
        
        // Ensure best move has better evaluation than blunder
        if (bestEval.scoreCp <= blunderEval.scoreCp) {
          console.log(`Skipping position ${position.id} - best move evaluation (${bestEval.scoreCp}) not better than blunder (${blunderEval.scoreCp})`);
          skippedCount++;
          continue;
        }

        // Save to database
        const blunderPos = new BlunderPosition({
          fen: position.fen,
          bestMove: position.bestMove,
          blunderMove: position.blunderMove,
          bestMoveEval: bestEval.scoreCp,
          blunderMoveEval: blunderEval.scoreCp,
          rating: position.rating,
          themes: position.themes,
          puzzleId: position.id
        });

        await blunderPos.save();
        savedCount++;
        
        if (savedCount % 10 === 0) {
          console.log(`Saved ${savedCount} positions...`);
        }
        
        // Small delay to not overwhelm the system
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (err) {
        console.error(`Error analyzing position ${position.id}:`, err.message);
        skippedCount++;
        continue;
      }
    }

    console.log(`\nImport complete!`);
    console.log(`Analyzed: ${analyzedCount} positions`);
    console.log(`Saved: ${savedCount} blunder positions to database`);
    console.log(`Skipped: ${skippedCount} positions`);
    
    // Show total count
    const totalPositions = await BlunderPosition.countDocuments();
    console.log(`Total blunder positions in database: ${totalPositions}`);
    
    // Show some examples
    const examples = await BlunderPosition.find().limit(5);
    console.log('\nExample saved positions:');
    examples.forEach((pos, i) => {
      console.log(`${i+1}. FEN: ${pos.fen}`);
      console.log(`   Best: ${pos.bestMove} (${pos.bestMoveEval}cp), Blunder: ${pos.blunderMove} (${pos.blunderMoveEval}cp)`);
      console.log(`   Rating: ${pos.rating}, Themes: ${pos.themes}\n`);
    });

  } catch (error) {
    console.error('Error in importAimchessBlunderPositions:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the import
importAimchessBlunderPositions();

