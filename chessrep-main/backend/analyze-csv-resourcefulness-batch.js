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

// Function to analyze position using the backend API with retry logic
async function analyzePositionWithAPI(fen, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await new Promise((resolve, reject) => {
        const postData = JSON.stringify({
          fen: fen,
          depth: 12, // Lower depth for faster analysis
          multiPV: 1,
          timeLimit: 3000 // 3 seconds timeout
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

        req.setTimeout(8000, () => {
          req.destroy();
          reject(new Error('API request timeout'));
        });

        req.write(postData);
        req.end();
      });
    } catch (error) {
      if (attempt === retries) {
        throw error;
      }
      console.warn(`⚠️ Attempt ${attempt} failed for FEN ${fen.substring(0, 20)}..., retrying...`);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
    }
  }
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
    const TARGET_COUNT = 500; // Process fewer positions to avoid overwhelming API
    const MIN_EVAL_LOSS = 3.0; // Minimum pawn loss for a position to be considered "losing"

    console.log('🔍 Starting CSV analysis...');

    // Process positions in smaller batches to avoid overwhelming the API
    const positions = [];
    
    // First, read all positions from CSV
    await new Promise((resolve, reject) => {
      fs.createReadStream(CSV_PATH)
        .pipe(csv())
        .on('data', (row) => {
          if (positions.length < TARGET_COUNT) {
            const fen = row.FEN;
            const moves = row.Moves.split(' ');
            const puzzleId = row.PuzzleId;
            const rating = parseInt(row.Rating);

            if (fen && moves && moves.length > 0 && puzzleId && !isNaN(rating)) {
              positions.push({ fen, moves, puzzleId, rating });
            }
          }
        })
        .on('end', () => {
          console.log(`📊 Loaded ${positions.length} positions from CSV`);
          resolve();
        })
        .on('error', reject);
    });

    // Now process positions in batches
    const BATCH_SIZE = 10;
    for (let i = 0; i < positions.length; i += BATCH_SIZE) {
      const batch = positions.slice(i, i + BATCH_SIZE);
      
      console.log(`📊 Processing batch ${Math.floor(i/BATCH_SIZE) + 1}/${Math.ceil(positions.length/BATCH_SIZE)} (positions ${i + 1}-${Math.min(i + BATCH_SIZE, positions.length)})`);
      
      // Process batch in parallel but with limited concurrency
      const batchPromises = batch.map(async (pos) => {
        try {
          const analysis = await analyzePositionWithAPI(pos.fen);
          const evaluation = analysis.evaluation;
          const losingSide = determineLosingSide(evaluation, pos.fen);

          if (losingSide) {
            const description = `You are ${losingSide} and down by ${Math.abs(evaluation).toFixed(1)} points. Try to win from this losing position.`;
            
            let difficulty = 'beginner';
            const absEval = Math.abs(evaluation);
            if (absEval >= 8.0) difficulty = 'expert';
            else if (absEval >= 5.0) difficulty = 'advanced';
            else if (absEval >= 3.0) difficulty = 'intermediate';
            
            return {
              fen: pos.fen,
              moves: pos.moves,
              difficulty,
              description,
              evaluation,
              themes: 'resourcefulness',
              puzzleId: `resourcefulness-${pos.puzzleId}`,
              losingSide
            };
          }
          return null;
        } catch (error) {
          console.warn(`⚠️ Error processing position ${pos.puzzleId}: ${error.message}`);
          return null;
        }
      });

      const batchResults = await Promise.all(batchPromises);
      const validPositions = batchResults.filter(pos => pos !== null);
      
      if (validPositions.length > 0) {
        positionsToInsert.push(...validPositions);
        validCount += validPositions.length;
        console.log(`✅ Found ${validPositions.length} losing positions in this batch (total: ${validCount})`);
      }

      // Small delay between batches to avoid overwhelming the API
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log(`📊 Analysis complete. Processed ${positions.length} positions, found ${validCount} valid resourcefulness positions`);
    
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
  } catch (error) {
    console.error('❌ Database population failed:', error);
    mongoose.disconnect();
    process.exit(1);
  }
}

analyzeAndPopulateResourcefulness();
