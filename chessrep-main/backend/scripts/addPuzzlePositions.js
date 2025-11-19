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

// Puzzle Schema (using existing model)
const Puzzle = mongoose.model('Puzzle', new mongoose.Schema({
  fen: { type: String, required: true },
  moves: { type: [String], required: true },
  theme: { type: String, required: true },
  rating: { type: Number, required: true },
  themes: { type: [String], default: [] }
}));

async function addPuzzlePositions() {
  try {
    console.log('Adding 500 puzzle positions from CSV...');
    
    // Don't clear existing puzzles, just add more
    const PUZZLES_CSV_PATH = path.join(__dirname, '../data/puzzles.csv');
    const positions = [];
    let loadedCount = 0;
    const MAX_POSITIONS = 500;

    // Load positions from CSV
    console.log('Loading puzzle positions from CSV...');
    
    await new Promise((resolve, reject) => {
      fs.createReadStream(PUZZLES_CSV_PATH)
        .pipe(csv())
        .on('data', (row) => {
          if (loadedCount >= MAX_POSITIONS) return;

          if (row.FEN && row.Moves && row.Rating) {
            const rating = parseInt(row.Rating) || 0;
            
            // Use puzzles with reasonable ratings
            if (rating >= 600 && rating <= 2200) {
              const puzzle = {
                id: row.PuzzleId || `puzzle_${loadedCount}`,
                fen: row.FEN,
                moves: row.Moves.split(' '),
                rating: rating,
                themes: row.Themes ? row.Themes.split(',').map(t => t.trim()) : ['tactical'],
                url: row.GameUrl || '',
              };
              
              // Validate the position is legal
              try {
                const chess = new Chess(puzzle.fen);
                
                // Must be legal, not in checkmate/stalemate, has moves
                if (!chess.isCheckmate() && 
                    !chess.isStalemate() && 
                    chess.moves().length >= 2) {
                  
                  positions.push(puzzle);
                  loadedCount++;
                  
                  if (loadedCount % 100 === 0) {
                    console.log(`Loaded ${loadedCount} puzzle positions...`);
                  }
                }
              } catch (err) {
                // Skip invalid positions
              }
            }
          }
        })
        .on('end', () => {
          console.log(`Loaded ${positions.length} valid puzzle positions from CSV`);
          resolve();
        })
        .on('error', (err) => {
          console.error('Error loading positions:', err);
          reject(err);
        });
    });

    console.log(`Saving ${positions.length} puzzle positions to database...`);
    
    let savedCount = 0;
    let skippedCount = 0;

    for (const position of positions) {
      try {
        // Check if puzzle already exists
        const existingPuzzle = await Puzzle.findOne({ fen: position.fen });
        if (existingPuzzle) {
          skippedCount++;
          continue;
        }
        
        // Determine primary theme
        let primaryTheme = 'tactical';
        if (position.themes && position.themes.length > 0) {
          primaryTheme = position.themes[0].toLowerCase();
        }
        
        // Save to database
        const puzzle = new Puzzle({
          fen: position.fen,
          moves: position.moves,
          theme: primaryTheme,
          rating: position.rating,
          themes: position.themes
        });

        await puzzle.save();
        savedCount++;
        
        if (savedCount % 50 === 0) {
          console.log(`Saved ${savedCount} puzzle positions...`);
        }
        
      } catch (err) {
        console.error(`Error saving position ${position.fen}:`, err.message);
        continue;
      }
    }

    console.log(`\nPuzzle positions saved!`);
    console.log(`Saved: ${savedCount} new puzzle positions to database`);
    console.log(`Skipped: ${skippedCount} duplicate positions`);
    
    // Show total count
    const totalPuzzles = await Puzzle.countDocuments();
    console.log(`Total puzzles in database: ${totalPuzzles}`);
    
    // Show some examples
    const examples = await Puzzle.find().limit(5);
    console.log('\nExample saved puzzle positions:');
    examples.forEach((puzzle, i) => {
      console.log(`${i+1}. FEN: ${puzzle.fen}`);
      console.log(`   Theme: ${puzzle.theme}, Rating: ${puzzle.rating}`);
      console.log(`   Moves: ${puzzle.moves.join(', ')}\n`);
    });

  } catch (error) {
    console.error('Error in addPuzzlePositions:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the analysis
addPuzzlePositions();

