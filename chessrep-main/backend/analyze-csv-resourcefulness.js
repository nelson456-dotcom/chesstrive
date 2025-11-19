const mongoose = require('mongoose');
const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');
const http = require('http');

// Resourcefulness Position Schema
const resourcefulnessPositionSchema = new mongoose.Schema({
  fen: { type: String, required: true },
  moves: { type: [String], required: true },
  difficulty: { type: String, required: true },
  description: { type: String, required: true },
  evaluation: { type: Number, required: true },
  themes: { type: String, default: 'resourcefulness' },
  puzzleId: { type: String, required: true },
  losingSide: { type: String, required: true }
});

const ResourcefulnessPosition = mongoose.model('ResourcefulnessPosition', resourcefulnessPositionSchema);

// Function to analyze position using the backend API
async function analyzePositionWithAPI(fen) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      fen: fen,
      depth: 15, // Higher depth for accurate evaluation
      multiPV: 1,
      timeLimit: 5000 // 5 seconds timeout
    });

    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/analysis/position',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (result.success) {
            resolve({
              evaluation: result.evaluation,
              bestMove: result.bestMove,
              isMate: result.isMate,
              mateIn: result.mateIn
            });
          } else {
            reject(new Error(`API returned error: ${result.message}`));
          }
        } catch (error) {
          reject(new Error(`Failed to parse response: ${error.message}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(new Error(`API request failed: ${error.message}`));
    });

    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('API request timeout'));
    });

    req.write(postData);
    req.end();
  });
}

// Function to determine losing side based on evaluation
function determineLosingSide(evaluation, fen) {
  const turn = fen.split(' ')[1]; // 'w' or 'b'
  
  if (evaluation < -3.0) { // White is significantly worse
    return 'white';
  } else if (evaluation > 3.0) { // Black is significantly worse
    return 'black';
  }
  return null; // Not a clear losing position
}

async function analyzeAndPopulateResourcefulness() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect('mongodb://localhost:27017/chessrep');
    console.log('✅ Connected to MongoDB');

    // Clear existing positions
    console.log('🗑️ Clearing existing resourcefulness positions...');
    await ResourcefulnessPosition.deleteMany({});
    console.log('✅ Cleared existing positions');

    const CSV_PATH = path.join(__dirname, 'data', 'puzzles.csv');
    console.log('📁 CSV path:', CSV_PATH);

    const positionsToInsert = [];
    let processedCount = 0;
    let validCount = 0;
    const TARGET_COUNT = 2000; // Process 2000 positions from CSV
    const MIN_EVAL_LOSS = 3.0; // Minimum pawn loss for a position to be considered "losing"

    console.log('🔍 Starting CSV analysis...');

    const stream = fs.createReadStream(CSV_PATH)
      .pipe(csv())
      .on('data', async (row) => {
        if (processedCount >= TARGET_COUNT) {
          stream.destroy(); // Stop reading the CSV
          return;
        }

        processedCount++;
        if (processedCount % 100 === 0) {
          console.log(`📊 Processed ${processedCount} positions, found ${validCount} valid resourcefulness positions`);
        }

        const fen = row.FEN;
        const moves = row.Moves.split(' '); // Assuming moves are space-separated SAN
        const puzzleId = row.PuzzleId;
        const rating = parseInt(row.Rating);

        if (!fen || !moves || moves.length === 0 || !puzzleId || isNaN(rating)) {
          return;
        }

        try {
          const analysis = await analyzePositionWithAPI(fen);
          const evaluation = analysis.evaluation; // Evaluation in pawns

          const losingSide = determineLosingSide(evaluation, fen);

          if (losingSide) {
            // Create a description
            const description = `You are ${losingSide} and down by ${Math.abs(evaluation).toFixed(1)} points. Try to win from this losing position.`;
            
            // Determine difficulty based on evaluation magnitude
            let difficulty = 'beginner';
            const absEval = Math.abs(evaluation);
            if (absEval >= 8.0) difficulty = 'expert';
            else if (absEval >= 5.0) difficulty = 'advanced';
            else if (absEval >= 3.0) difficulty = 'intermediate';
            
            positionsToInsert.push({
              fen,
              moves,
              difficulty,
              description,
              evaluation,
              themes: 'resourcefulness',
              puzzleId: `resourcefulness-${puzzleId}`,
              losingSide
            });
            validCount++;
            
            console.log(`✅ Found losing position ${validCount}: ${losingSide} down by ${Math.abs(evaluation).toFixed(1)} points`);
          }
        } catch (error) {
          console.warn(`⚠️ Error processing position ${processedCount}: ${error.message}`);
        }
      })
      .on('end', async () => {
        console.log(`📊 Analysis complete. Processed ${processedCount} positions, found ${validCount} valid resourcefulness positions`);
        
        if (positionsToInsert.length > 0) {
          console.log(`📝 Inserting ${positionsToInsert.length} new resourcefulness positions...`);
          await ResourcefulnessPosition.insertMany(positionsToInsert);
          console.log(`✅ Inserted ${positionsToInsert.length} positions`);
        } else {
          console.log('❌ No valid resourcefulness positions found to insert.');
        }

        console.log('🔍 Verifying positions...');
        const totalInDb = await ResourcefulnessPosition.countDocuments();
        console.log(`✅ Total positions in database: ${totalInDb}`);

        if (totalInDb > 0) {
          console.log('📊 Sample positions:');
          const sample = await ResourcefulnessPosition.find().limit(5);
          sample.forEach((pos, index) => {
            console.log(`  ${index + 1}. ${pos.difficulty} - ${pos.losingSide} - ${pos.fen.substring(0, 20)}... - ${pos.evaluation.toFixed(1)}`);
          });
        }

        console.log('🎉 Database population completed successfully!');
        mongoose.disconnect();
        process.exit(0);
      })
      .on('error', (error) => {
        console.error('❌ CSV stream error:', error);
        mongoose.disconnect();
        process.exit(1);
      });
  } catch (error) {
    console.error('❌ Database population failed:', error);
    mongoose.disconnect();
    process.exit(1);
  }
}

analyzeAndPopulateResourcefulness();
