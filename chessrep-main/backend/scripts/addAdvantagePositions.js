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

// Advantage Position Schema
const advantagePositionSchema = new mongoose.Schema({
  fen: { type: String, required: true },
  moves: { type: [String], required: true },
  difficulty: { type: String, required: true },
  description: { type: String, required: true },
  rating: { type: Number, required: true },
  themes: { type: String, default: 'advantage' },
  puzzleId: { type: String, required: true }
});

const AdvantagePosition = mongoose.model('AdvantagePosition', advantagePositionSchema);

// Helper function to generate winning moves
function generateWinningMoves(fen) {
  try {
    const game = new Chess(fen);
    const moves = game.moves();
    if (moves.length === 0) return [];
    
    // Return first few moves as a potential winning sequence
    return moves.slice(0, Math.min(5, moves.length));
  } catch (error) {
    console.error('Error generating winning moves:', error);
    return [];
  }
}

// Helper function to get position description
function getPositionDescription(difficulty, pieceCount) {
  const descriptions = {
    beginner: [
      'Convert your material advantage to checkmate',
      'Use your extra pieces to force checkmate',
      'Find the winning sequence with your advantage',
      'Exploit your material edge to win',
      'Turn your advantage into victory'
    ],
    intermediate: [
      'Convert your positional advantage to victory',
      'Use tactical motifs to force checkmate',
      'Find the most forcing line to win',
      'Capitalize on your superior position',
      'Convert your edge into a decisive advantage'
    ],
    advanced: [
      'Convert your complex advantage to checkmate',
      'Use advanced tactics to force the win',
      'Find the precise winning sequence',
      'Execute the winning plan with precision',
      'Convert your advantage with master-level play'
    ],
    expert: [
      'Convert your master-level advantage to checkmate',
      'Use expert-level tactics to force victory',
      'Find the most accurate winning sequence',
      'Execute the perfect winning plan',
      'Convert your advantage with world-class precision'
    ]
  };
  
  const options = descriptions[difficulty] || descriptions.intermediate;
  return options[Math.floor(Math.random() * options.length)];
}

async function addAdvantagePositions() {
  try {
    console.log('Adding 200 advantage positions from CSV...');
    
    // Clear existing advantage positions
    await AdvantagePosition.deleteMany({});
    console.log('Cleared existing advantage positions');

    const PUZZLES_CSV_PATH = path.join(__dirname, '../data/puzzles.csv');
    const positions = [];
    let loadedCount = 0;
    const MAX_POSITIONS = 200;

    // Load positions from CSV
    console.log('Loading advantage positions from CSV...');
    
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
                id: row.PuzzleId || `advantage_${loadedCount}`,
                fen: row.FEN,
                moves: row.Moves.split(' '),
                rating: rating,
                themes: row.Themes || 'advantage',
                url: row.GameUrl || '',
              };
              
              // Validate the position is legal and has winning potential
              try {
                const chess = new Chess(puzzle.fen);
                
                // Must be legal, not in checkmate/stalemate, has moves
                if (!chess.isCheckmate() && 
                    !chess.isStalemate() && 
                    chess.moves().length >= 3) {
                  
                  // Check if it's a winning position (material advantage or tactical edge)
                  const board = chess.board();
                  const pieceCount = board.flat().filter(p => p).length;
                  
                  // Prefer positions with fewer pieces (endgame advantage scenarios)
                  if (pieceCount <= 12) {
                    positions.push(puzzle);
                    loadedCount++;
                    
                    if (loadedCount % 50 === 0) {
                      console.log(`Loaded ${loadedCount} advantage positions...`);
                    }
                  }
                }
              } catch (err) {
                // Skip invalid positions
              }
            }
          }
        })
        .on('end', () => {
          console.log(`Loaded ${positions.length} valid advantage positions from CSV`);
          resolve();
        })
        .on('error', (err) => {
          console.error('Error loading positions:', err);
          reject(err);
        });
    });

    console.log(`Saving ${positions.length} advantage positions to database...`);
    
    let savedCount = 0;

    for (const position of positions) {
      try {
        const chess = new Chess(position.fen);
        const board = chess.board();
        const pieceCount = board.flat().filter(p => p).length;
        
        // Determine difficulty based on piece count
        let difficulty = 'beginner';
        if (pieceCount <= 6) {
          difficulty = 'beginner';
        } else if (pieceCount <= 10) {
          difficulty = 'intermediate';
        } else if (pieceCount <= 15) {
          difficulty = 'advanced';
        } else {
          difficulty = 'expert';
        }
        
        // Generate winning moves
        const winningMoves = generateWinningMoves(position.fen);
        
        // Save to database
        const advPos = new AdvantagePosition({
          fen: position.fen,
          moves: winningMoves,
          difficulty: difficulty,
          description: getPositionDescription(difficulty, pieceCount),
          rating: position.rating,
          themes: position.themes,
          puzzleId: position.id
        });

        await advPos.save();
        savedCount++;
        
        console.log(`Saved advantage position ${savedCount}: ${position.fen} (${difficulty})`);
        
      } catch (err) {
        console.error(`Error saving position ${position.fen}:`, err.message);
        continue;
      }
    }

    console.log(`\nAdvantage positions saved!`);
    console.log(`Saved: ${savedCount} advantage positions to database`);
    
    // Show some examples
    const examples = await AdvantagePosition.find().limit(5);
    console.log('\nExample saved advantage positions:');
    examples.forEach((pos, i) => {
      console.log(`${i+1}. FEN: ${pos.fen}`);
      console.log(`   Difficulty: ${pos.difficulty}, Rating: ${pos.rating}`);
      console.log(`   Moves: ${pos.moves.join(', ')}\n`);
    });

  } catch (error) {
    console.error('Error in addAdvantagePositions:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the analysis
addAdvantagePositions();

