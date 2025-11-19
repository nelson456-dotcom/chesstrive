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
}

// Function to determine losing side based on evaluation
function determineLosingSide(evaluation, fen) {
  const turn = fen.split(' ')[1]; // 'w' or 'b'
  
  if (evaluation < -3.0) { // White is significantly worse (Black is winning)
    return 'white';
  } else if (evaluation > 3.0) { // Black is significantly worse (White is winning)
    return 'black';
  }
  return null; // Not a clear losing position
}

async function findWinningPositions() {
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
    const TARGET_COUNT = 200; // Process fewer positions for faster results
    const MIN_EVAL_ADVANTAGE = 3.0; // Minimum 3 point advantage for winning side

    console.log('🔍 Starting CSV analysis to find positions where one side is winning by 3+ points...');

    // Process positions one by one
    const positions = [];
    
    // First, read positions from CSV
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

    // Process positions one by one
    for (let i = 0; i < positions.length; i++) {
      const pos = positions[i];
      processedCount++;
      
      if (processedCount % 10 === 0) {
        console.log(`📊 Processed ${processedCount} positions, found ${validCount} winning positions`);
      }

      try {
        const analysis = await analyzePositionWithAPI(pos.fen);
        const evaluation = analysis.evaluation; // Evaluation in pawns

        // Check if one side has a 3+ point advantage
        if (Math.abs(evaluation) >= MIN_EVAL_ADVANTAGE) {
          const losingSide = determineLosingSide(evaluation, pos.fen);

          if (losingSide) {
            // Create a description
            const winningSide = losingSide === 'white' ? 'black' : 'white';
            const description = `You are ${losingSide} and ${winningSide} is winning by ${Math.abs(evaluation).toFixed(1)} points. Try to win from this losing position.`;
            
            // Determine difficulty based on evaluation magnitude
            let difficulty = 'beginner';
            const absEval = Math.abs(evaluation);
            if (absEval >= 8.0) difficulty = 'expert';
            else if (absEval >= 5.0) difficulty = 'advanced';
            else if (absEval >= 3.0) difficulty = 'intermediate';
            
            positionsToInsert.push({
              fen: pos.fen,
              moves: pos.moves,
              difficulty,
              description,
              evaluation,
              themes: 'resourcefulness',
              puzzleId: `resourcefulness-${pos.puzzleId}`,
              losingSide
            });
            validCount++;
            
            console.log(`✅ Found winning position ${validCount}: ${winningSide} winning by ${Math.abs(evaluation).toFixed(1)} points, user plays as ${losingSide}`);
          }
        }
      } catch (error) {
        console.warn(`⚠️ Error processing position ${processedCount}: ${error.message}`);
      }

      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    console.log(`📊 Analysis complete. Processed ${processedCount} positions, found ${validCount} winning positions`);
    
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

      // Show distribution
      const difficultyDistribution = await ResourcefulnessPosition.aggregate([
        { $group: { _id: '$difficulty', count: { $sum: 1 }, avgEval: { $avg: '$evaluation' } } },
        { $sort: { count: -1 } }
      ]);
      console.log('📊 Difficulty distribution:');
      difficultyDistribution.forEach(dist => {
        console.log(`  ${dist._id}: ${dist.count} positions (avg eval: ${dist.avgEval.toFixed(2)})`);
      });

      const losingSideDistribution = await ResourcefulnessPosition.aggregate([
        { $group: { _id: '$losingSide', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]);
      console.log('📊 Losing side distribution:');
      losingSideDistribution.forEach(dist => {
        console.log(`  ${dist._id}: ${dist.count} positions`);
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

findWinningPositions();
