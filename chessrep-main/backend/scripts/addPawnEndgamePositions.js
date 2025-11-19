const { Chess } = require('chess.js');
const fs = require('fs');
const csv = require('csv-parser');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/chessrep', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Visualization Position Schema
const visualizationPositionSchema = new mongoose.Schema({
  fen: { type: String, required: true },
  rating: { type: Number, required: true },
  themes: { type: String, default: 'pawnEndgame' },
  puzzleId: { type: String, required: true }
});

const VisualizationPosition = mongoose.model('VisualizationPosition', visualizationPositionSchema);

async function addPawnEndgamePositions() {
  try {
    console.log('Adding 100 pawn endgame positions for practice visualization...');
    
    // Clear existing visualization positions
    await VisualizationPosition.deleteMany({});
    console.log('Cleared existing visualization positions');

    const PUZZLES_CSV_PATH = path.join(__dirname, '../data/puzzles.csv');
    const positions = [];
    let loadedCount = 0;
    const MAX_POSITIONS = 100;

    // Load positions from CSV
    console.log('Loading pawn endgame positions from CSV...');
    
    await new Promise((resolve, reject) => {
      fs.createReadStream(PUZZLES_CSV_PATH)
        .pipe(csv())
        .on('data', (row) => {
          if (loadedCount >= MAX_POSITIONS) return;

          if (row.FEN && row.Moves && row.Rating) {
            const rating = parseInt(row.Rating) || 0;
            
            // Use puzzles with reasonable ratings
            if (rating >= 600 && rating <= 2000) {
              const puzzle = {
                id: row.PuzzleId || `puzzle_${loadedCount}`,
                fen: row.FEN,
                moves: row.Moves.split(' '),
                rating: rating,
                themes: row.Themes || 'pawnEndgame',
                url: row.GameUrl || '',
              };
              
              // Validate the position is a pawn endgame
              try {
                const chess = new Chess(puzzle.fen);
                
                // Count pieces to ensure it's a pawn endgame (only kings and pawns)
                const board = chess.board();
                let pieceCount = 0;
                let hasOnlyKingsAndPawns = true;
                
                for (const row of board) {
                  for (const piece of row) {
                    if (piece) {
                      pieceCount++;
                      // Check if piece is not a king or pawn
                      if (piece.type !== 'k' && piece.type !== 'p') {
                        hasOnlyKingsAndPawns = false;
                      }
                    }
                  }
                }
                
                // Must be pawn endgame (only kings and pawns), legal, not in check, has moves
                if (hasOnlyKingsAndPawns && 
                    pieceCount >= 3 && pieceCount <= 8 && // 3-8 pieces total
                    !chess.isCheck() && 
                    !chess.isCheckmate() && 
                    !chess.isStalemate() && 
                    chess.moves().length >= 3) {
                  positions.push(puzzle);
                  loadedCount++;
                  
                  if (loadedCount % 20 === 0) {
                    console.log(`Loaded ${loadedCount} pawn endgame positions...`);
                  }
                }
              } catch (err) {
                // Skip invalid positions
              }
            }
          }
        })
        .on('end', () => {
          console.log(`Loaded ${positions.length} valid pawn endgame positions from CSV`);
          resolve();
        })
        .on('error', (err) => {
          console.error('Error loading positions:', err);
          reject(err);
        });
    });

    console.log(`Saving ${positions.length} pawn endgame positions to database...`);
    
    let savedCount = 0;

    for (const position of positions) {
      try {
        // Save to database
        const visPos = new VisualizationPosition({
          fen: position.fen,
          rating: position.rating,
          themes: position.themes,
          puzzleId: position.id
        });

        await visPos.save();
        savedCount++;
        
        console.log(`Saved pawn endgame position ${savedCount}: ${position.fen}`);
        
      } catch (err) {
        console.error(`Error saving position ${position.fen}:`, err.message);
        continue;
      }
    }

    console.log(`\nPawn endgame positions saved!`);
    console.log(`Saved: ${savedCount} pawn endgame positions to database`);
    
    // Show some examples
    const examples = await VisualizationPosition.find().limit(5);
    console.log('\nExample saved pawn endgame positions:');
    examples.forEach((pos, i) => {
      console.log(`${i+1}. FEN: ${pos.fen}`);
      console.log(`   Rating: ${pos.rating}, Themes: ${pos.themes}\n`);
    });

  } catch (error) {
    console.error('Error in addPawnEndgamePositions:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the analysis
addPawnEndgamePositions();
