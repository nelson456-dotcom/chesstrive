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
      depth: 12,
      multiPV: 1,
      timeLimit: 3000
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
          resolve({
            evaluation: result.evaluation,
            bestMove: result.bestMove,
            isMate: result.isMate,
            mateIn: result.mateIn
          });
        } catch (error) {
          reject(new Error(`Failed to parse response: ${error.message}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(new Error(`API request failed: ${error.message}`));
    });

    req.write(postData);
    req.end();
  });
}

// Function to determine losing side based on evaluation
function determineLosingSide(evaluation, fen) {
  // If evaluation is negative, white is losing
  // If evaluation is positive, black is losing
  if (evaluation <= -3.0) {
    return 'white'; // White is losing by 3+ points
  } else if (evaluation >= 3.0) {
    return 'black'; // Black is losing by 3+ points
  }
  
  return null; // Not losing enough
}

// Function to determine difficulty based on evaluation
function determineDifficulty(evaluation) {
  const absEval = Math.abs(evaluation);
  if (absEval >= 8.0) return 'expert';
  if (absEval >= 5.0) return 'advanced';
  if (absEval >= 3.0) return 'intermediate';
  return 'beginner';
}

async function analyzeAndPopulateDatabase() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect('mongodb://localhost:27017/chessrep');
    console.log('✅ Connected to MongoDB');

    console.log('🗑️ Clearing existing resourcefulness positions...');
    await ResourcefulnessPosition.deleteMany({});
    console.log('✅ Cleared existing positions');

    const CSV_PATH = path.join(__dirname, 'data', 'puzzles.csv');
    console.log('📁 CSV path:', CSV_PATH);
    
    if (!fs.existsSync(CSV_PATH)) {
      throw new Error('CSV file not found');
    }

    console.log('🔍 Starting CSV analysis...');
    
    const resourcefulnessPositions = [];
    let processedCount = 0;
    let validPositions = 0;
    const TARGET_POSITIONS = 500;

    return new Promise((resolve, reject) => {
      const stream = fs.createReadStream(CSV_PATH)
        .pipe(csv())
        .on('data', async (row) => {
          if (validPositions >= TARGET_POSITIONS) {
            return; // Stop processing once we have enough positions
          }

          processedCount++;
          if (processedCount % 50 === 0) {
            console.log(`📊 Processed ${processedCount} positions, found ${validPositions} valid resourcefulness positions`);
          }

          try {
            const fen = row.FEN || row.fen;
            if (!fen) return;

            // Analyze position with backend API
            const analysis = await analyzePositionWithAPI(fen);
            const evaluation = analysis.evaluation;

            // Check if position has a losing side (evaluation <= -3 or >= 3)
            const losingSide = determineLosingSide(evaluation, fen);
            if (!losingSide) return; // Skip if not losing enough

            // Determine difficulty
            const difficulty = determineDifficulty(evaluation);

            // Create position object
            const position = {
              fen: fen,
              moves: row.Moves ? row.Moves.split(' ') : [],
              difficulty: difficulty,
              description: `You are ${losingSide} and down by ${Math.abs(evaluation).toFixed(1)} points. Try to win from this losing position.`,
              evaluation: evaluation,
              themes: 'resourcefulness',
              puzzleId: `resourcefulness-${validPositions + 1}`,
              losingSide: losingSide
            };

            resourcefulnessPositions.push(position);
            validPositions++;

            console.log(`✅ Found position ${validPositions}: ${losingSide} losing by ${Math.abs(evaluation).toFixed(1)} points (${difficulty})`);

            // If we have enough positions, stop processing
            if (validPositions >= TARGET_POSITIONS) {
              stream.destroy();
              resolve();
            }

          } catch (error) {
            console.warn(`⚠️ Error processing position ${processedCount}:`, error.message);
          }
        })
        .on('end', () => {
          console.log(`📊 Finished processing CSV. Found ${validPositions} valid resourcefulness positions`);
          resolve();
        })
        .on('error', (error) => {
          console.error('❌ CSV processing error:', error);
          reject(error);
        });
    }).then(async () => {
      if (resourcefulnessPositions.length === 0) {
        throw new Error('No valid resourcefulness positions found');
      }

      console.log(`📝 Inserting ${resourcefulnessPositions.length} resourcefulness positions into database...`);
      const insertedPositions = await ResourcefulnessPosition.insertMany(resourcefulnessPositions);
      console.log(`✅ Inserted ${insertedPositions.length} positions`);

      console.log('🔍 Verifying positions...');
      const count = await ResourcefulnessPosition.countDocuments();
      console.log(`✅ Total positions in database: ${count}`);

      // Show statistics
      const stats = await ResourcefulnessPosition.aggregate([
        {
          $group: {
            _id: '$difficulty',
            count: { $sum: 1 },
            avgEvaluation: { $avg: '$evaluation' }
          }
        }
      ]);

      console.log('📊 Difficulty distribution:');
      stats.forEach(stat => {
        console.log(`  ${stat._id}: ${stat.count} positions (avg eval: ${stat.avgEvaluation.toFixed(2)})`);
      });

      const losingSideStats = await ResourcefulnessPosition.aggregate([
        {
          $group: {
            _id: '$losingSide',
            count: { $sum: 1 }
          }
        }
      ]);

      console.log('📊 Losing side distribution:');
      losingSideStats.forEach(stat => {
        console.log(`  ${stat._id}: ${stat.count} positions`);
      });

      console.log('🎉 Database population completed successfully!');
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

analyzeAndPopulateDatabase();