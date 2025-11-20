const mongoose = require('mongoose');
const fs = require('fs');
const csv = require('csv-parser');
const { Chess } = require('chess.js');
const path = require('path');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/chessrep', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Defender Position Schema (matching the route)
const defenderPositionSchema = new mongoose.Schema({
  fen: { type: String, required: true },
  answer1: { type: String, required: true },
  answer2: { type: String, required: true },
  correctAnswer: { type: String, required: true, enum: ['Answer1', 'Answer2'] },
  correctMove: { type: String, required: true },
  difficulty: { type: String, required: true, enum: ['beginner', 'intermediate', 'advanced', 'expert'] },
  description: { type: String, default: '' },
  rating: { type: Number, required: true },
  pieceCount: { type: Number, required: true },
  puzzleId: { type: String, required: true }
});

const DefenderPosition = mongoose.model('DefenderPosition', defenderPositionSchema);

// Helper function to determine difficulty based on piece count and rating
function determineDifficulty(pieceCount, rating) {
  if (pieceCount <= 6) {
    return 'beginner';
  } else if (pieceCount <= 12) {
    return rating < 1200 ? 'beginner' : 'intermediate';
  } else if (pieceCount <= 20) {
    return rating < 1500 ? 'intermediate' : 'advanced';
  } else {
    return rating < 1800 ? 'advanced' : 'expert';
  }
}

// Helper function to get description based on difficulty
function getDescription(difficulty, pieceCount) {
  const descriptions = {
    beginner: `Simple defensive position (${pieceCount} pieces) - Find the best defensive move`,
    intermediate: `Moderate defensive challenge (${pieceCount} pieces) - Select the defensive move that maintains your position`,
    advanced: `Complex defensive position (${pieceCount} pieces) - Choose the precise defensive move`,
    expert: `Master-level defensive challenge (${pieceCount} pieces) - Find the best defensive resource`
  };
  return descriptions[difficulty] || descriptions.intermediate;
}

async function importDefenderFromPuzzlesCSV() {
  try {
    console.log('Starting import of defender positions from puzzles.csv...');
    
    // Clear existing defender positions
    await DefenderPosition.deleteMany({});
    console.log('Cleared existing defender positions');
    
    const PUZZLES_CSV_PATH = path.join(__dirname, '../data/puzzles.csv');
    
    // Check if file exists
    if (!fs.existsSync(PUZZLES_CSV_PATH)) {
      console.error(`❌ CSV file not found at: ${PUZZLES_CSV_PATH}`);
      console.error('Please ensure puzzles.csv exists in backend/data/');
      process.exit(1);
    }
    
    const positions = [];
    let processedCount = 0;
    let validCount = 0;
    let skippedCount = 0;
    
    console.log(`Reading puzzles from ${PUZZLES_CSV_PATH}...`);
    console.log('Filtering for puzzles with "defender" theme...');
    
    // Read CSV file
    await new Promise((resolve, reject) => {
      fs.createReadStream(PUZZLES_CSV_PATH)
        .pipe(csv())
        .on('data', (row) => {
          processedCount++;
          
          // Check if this puzzle has "defender" theme
          const themes = (row.Theme || row.Themes || '').toLowerCase();
          if (!themes.includes('defender') && !themes.includes('defensive')) {
            return; // Skip if not defender/defensive theme
          }
          
          // Validate required fields
          if (!row.FEN || !row.Moves || !row.Rating) {
            skippedCount++;
            return;
          }
          
          try {
            const fen = row.FEN.trim();
            const moves = row.Moves.split(' ').filter(m => m.trim());
            const rating = parseInt(row.Rating) || 1500;
            
            if (moves.length === 0) {
              skippedCount++;
              return;
            }
            
            // Validate FEN and position
            const chess = new Chess(fen);
            if (chess.isGameOver()) {
              skippedCount++;
              return; // Skip if game is already over
            }
            
            // Get valid moves
            const validMoves = chess.moves({ verbose: true });
            if (validMoves.length < 2) {
              skippedCount++;
              return; // Need at least 2 moves for answer1/answer2
            }
            
            // The first move in the puzzle is the correct defensive move
            const correctMove = moves[0];
            
            // Find the correct move in valid moves (handle UCI vs SAN)
            let correctMoveSan = null;
            let correctMoveUci = null;
            
            // Try to find the move
            for (const move of validMoves) {
              if (move.san === correctMove || move.uci === correctMove) {
                correctMoveSan = move.san;
                correctMoveUci = move.uci;
                break;
              }
            }
            
            // If not found, try to make the move
            try {
              const testChess = new Chess(fen);
              testChess.move(correctMove);
              // If successful, find the move object
              const lastMove = testChess.history({ verbose: true }).pop();
              if (lastMove) {
                correctMoveSan = lastMove.san;
                correctMoveUci = lastMove.uci;
              }
            } catch (e) {
              // Move might be invalid, skip
              skippedCount++;
              return;
            }
            
            if (!correctMoveSan || !correctMoveUci) {
              skippedCount++;
              return;
            }
            
            // Find a second move (wrong answer) - prefer a move that's clearly worse
            // Get all valid moves except the correct one
            const otherMoves = validMoves.filter(m => m.uci !== correctMoveUci);
            if (otherMoves.length === 0) {
              skippedCount++;
              return;
            }
            
            // Use a random other move as the wrong answer
            const wrongMove = otherMoves[Math.floor(Math.random() * otherMoves.length)];
            const wrongMoveSan = wrongMove.san;
            const wrongMoveUci = wrongMove.uci;
            
            // Count pieces to determine difficulty
            const board = chess.board();
            const pieceCount = board.flat().filter(p => p).length;
            
            const difficulty = determineDifficulty(pieceCount, rating);
            const description = getDescription(difficulty, pieceCount);
            
            // Randomly assign which is answer1 and answer2
            const useAnswer1AsCorrect = Math.random() > 0.5;
            
            const position = {
              fen: fen,
              answer1: useAnswer1AsCorrect ? correctMoveSan : wrongMoveSan,
              answer2: useAnswer1AsCorrect ? wrongMoveSan : correctMoveSan,
              correctAnswer: useAnswer1AsCorrect ? 'Answer1' : 'Answer2',
              correctMove: correctMoveSan,
              difficulty: difficulty,
              description: description,
              rating: rating,
              pieceCount: pieceCount,
              puzzleId: `defender_${validCount + 1}`
            };
            
            positions.push(position);
            validCount++;
            
            if (validCount % 100 === 0) {
              console.log(`Processed ${validCount} defender positions (processed ${processedCount} rows, skipped ${skippedCount})...`);
            }
            
          } catch (error) {
            skippedCount++;
            // Skip invalid puzzles silently
          }
        })
        .on('end', async () => {
          console.log(`\nFinished reading CSV.`);
          console.log(`Total rows processed: ${processedCount}`);
          console.log(`Valid defender positions found: ${validCount}`);
          console.log(`Skipped: ${skippedCount}`);
          
          if (positions.length === 0) {
            console.log('❌ No valid defender positions found in puzzles.csv');
            console.log('Make sure puzzles.csv contains puzzles with "defender" or "defensive" theme');
            await mongoose.connection.close();
            process.exit(1);
          }
          
          // Insert positions in batches
          console.log(`\nInserting ${positions.length} defender positions into database...`);
          const batchSize = 100;
          let insertedCount = 0;
          
          for (let i = 0; i < positions.length; i += batchSize) {
            const batch = positions.slice(i, i + batchSize);
            try {
              await DefenderPosition.insertMany(batch, { ordered: false });
              insertedCount += batch.length;
              console.log(`Inserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(positions.length / batchSize)} (${insertedCount}/${positions.length})`);
            } catch (error) {
              // Some duplicates might exist, continue
              console.log(`Warning: Some positions in batch ${Math.floor(i / batchSize) + 1} failed to insert:`, error.message);
              insertedCount += batch.filter(p => !error.writeErrors || !error.writeErrors.some(e => e.index === batch.indexOf(p))).length;
            }
          }
          
          console.log(`\n✅ Successfully imported ${insertedCount} defender positions!`);
          
          // Show summary by difficulty
          const summary = await DefenderPosition.aggregate([
            { $group: { _id: '$difficulty', count: { $sum: 1 } } },
            { $sort: { _id: 1 } }
          ]);
          
          console.log('\n📊 Summary by difficulty:');
          summary.forEach(item => {
            console.log(`  ${item._id}: ${item.count} positions`);
          });
          
          // Show total count
          const totalPositions = await DefenderPosition.countDocuments();
          console.log(`\n📈 Total defender positions in database: ${totalPositions}`);
          
          // Show some examples
          const examples = await DefenderPosition.find().limit(3);
          console.log('\n📝 Example positions:');
          examples.forEach((pos, i) => {
            console.log(`\n${i + 1}. Difficulty: ${pos.difficulty}, Rating: ${pos.rating}`);
            console.log(`   FEN: ${pos.fen}`);
            console.log(`   Answer1: ${pos.answer1}, Answer2: ${pos.answer2}`);
            console.log(`   Correct: ${pos.correctAnswer} (${pos.correctMove})`);
          });
          
          await mongoose.connection.close();
          console.log('\n✅ Import complete!');
        })
        .on('error', (error) => {
          console.error('Error reading CSV:', error);
          reject(error);
        });
    });
    
  } catch (error) {
    console.error('Error in importDefenderFromPuzzlesCSV:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Run the import
importDefenderFromPuzzlesCSV();

