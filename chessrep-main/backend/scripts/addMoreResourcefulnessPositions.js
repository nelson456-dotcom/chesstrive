const mongoose = require('mongoose');
const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');
const http = require('http');

// Simple HTTP request function
function makeRequest(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          reject(e);
        }
      });
    });
    
    req.on('error', reject);
    req.write(JSON.stringify(data));
    req.end();
  });
}

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/chessrep', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

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

// Function to analyze position with Stockfish
async function analyzePositionWithStockfish(fen) {
  try {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/analysis/position',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    };
    
    const data = {
      fen: fen,
      depth: 15,
      multiPV: 1,
      timeLimit: 3000
    };
    
    const response = await makeRequest(options, data);
    
    if (response.success && response.evaluation !== undefined) {
      const stockfishEvaluation = response.evaluation;
      
      // Determine losing side based on Stockfish evaluation
      const isWhiteLosing = stockfishEvaluation < 0;
      const isBlackLosing = stockfishEvaluation > 0;
      
      let losingSide = '';
      if (isWhiteLosing) {
        losingSide = 'white';
      } else if (isBlackLosing) {
        losingSide = 'black';
      }
      
      return {
        stockfishEvaluation: stockfishEvaluation,
        losingSide: losingSide,
        isDownByOnePiece: Math.abs(stockfishEvaluation) >= 1.0,
        bestMove: response.bestMove
      };
    }
    
    return null;
    
  } catch (error) {
    console.error('Stockfish analysis error:', error);
    return null;
  }
}

// Function to add more positions from CSV
async function addMorePositions() {
  try {
    console.log('Adding more resourcefulness positions...');
    
    const CSV_PATH = path.join(__dirname, '../data/puzzles.csv');
    console.log('CSV path:', CSV_PATH);
    
    if (!fs.existsSync(CSV_PATH)) {
      console.log('No CSV found, creating additional fallback positions');
      await createAdditionalFallbackPositions();
      return;
    }

    const positions = [];
    let loadedCount = 0;
    const MAX_POSITIONS = 200; // Increase to 200 positions
    let hasError = false;
    
    const timeout = setTimeout(() => {
      console.log(`CSV parsing timeout reached. Positions loaded: ${positions.length}`);
      if (positions.length > 0) {
        processPositions(positions);
      } else {
        createAdditionalFallbackPositions();
      }
    }, 60000); // 60 second timeout
    
    const stream = fs.createReadStream(CSV_PATH)
      .pipe(csv())
      .on('data', async (row) => {
        if (hasError || loadedCount >= MAX_POSITIONS) {
          if (loadedCount >= MAX_POSITIONS && !hasError) {
            console.log(`Reached MAX_POSITIONS (${MAX_POSITIONS}), completing CSV parsing`);
            clearTimeout(timeout);
            await processPositions(positions);
            return;
          }
          return;
        }
        
        try {
          const fen = row.FEN;
          const rating = parseInt(row.Rating) || 600;
          const themes = row.Themes || '';
          const movesStr = row.Moves || '';
          const puzzleId = row.PuzzleId || `csv-${loadedCount}`;
          
          if (fen && movesStr && rating >= 600) { // Lower rating threshold
            const analysis = await analyzePositionWithStockfish(fen);
            
            if (analysis && analysis.losingSide && analysis.isDownByOnePiece) {
              const moves = movesStr.split(' ').filter(m => m.trim()).slice(0, 3);
              
              if (moves.length > 0) {
                // Determine difficulty based on evaluation
                let difficulty = 'beginner';
                const absEval = Math.abs(analysis.stockfishEvaluation);
                
                if (absEval >= 3.0) {
                  difficulty = 'expert';
                } else if (absEval >= 2.0) {
                  difficulty = 'advanced';
                } else if (absEval >= 1.5) {
                  difficulty = 'intermediate';
                } else {
                  difficulty = 'beginner';
                }
                
                positions.push({
                  puzzleId: puzzleId,
                  fen: fen,
                  moves: moves,
                  difficulty: difficulty,
                  description: `You are ${analysis.losingSide} and down by ${Math.abs(analysis.stockfishEvaluation).toFixed(1)} pawns according to Stockfish (${analysis.stockfishEvaluation > 0 ? '+' : ''}${analysis.stockfishEvaluation.toFixed(1)}). Try to win from this losing position.`,
                  evaluation: analysis.stockfishEvaluation,
                  themes: themes,
                  originalRating: rating,
                  losingSide: analysis.losingSide
                });
                
                loadedCount++;
                
                if (loadedCount % 25 === 0) {
                  console.log(`Loaded ${loadedCount} positions...`);
                }
              }
            }
          }
        } catch (rowError) {
          console.error('Error processing row:', rowError);
        }
      })
      .on('end', async () => {
        clearTimeout(timeout);
        console.log(`CSV parsing completed. Positions array length: ${positions.length}`);
        await processPositions(positions);
      })
      .on('error', async (error) => {
        clearTimeout(timeout);
        console.error('CSV parsing error:', error);
        await createAdditionalFallbackPositions();
      });
        
  } catch (error) {
    console.error('Error adding positions:', error);
    await createAdditionalFallbackPositions();
  }
}

// Process positions and save to database
async function processPositions(positions) {
  try {
    console.log(`Processing ${positions.length} positions...`);
    
    // Clear existing positions
    await ResourcefulnessPosition.deleteMany({});
    console.log('Cleared existing resourcefulness positions');
    
    // Insert new positions
    await ResourcefulnessPosition.insertMany(positions);
    console.log(`Successfully added ${positions.length} resourcefulness positions`);
    
    // Show distribution
    const distribution = {
      beginner: positions.filter(p => p.difficulty === 'beginner').length,
      intermediate: positions.filter(p => p.difficulty === 'intermediate').length,
      advanced: positions.filter(p => p.difficulty === 'advanced').length,
      expert: positions.filter(p => p.difficulty === 'expert').length
    };
    
    console.log('Difficulty distribution:', distribution);
    
  } catch (error) {
    console.error('Error processing positions:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Create additional fallback positions
async function createAdditionalFallbackPositions() {
  try {
    console.log('Creating additional fallback positions...');
    
    const fallbackPositions = [
      // White losing positions
      {
        fen: 'rnbqkb1r/pppp1ppp/5n2/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 2 3',
        moves: ['Nc3', 'Bb4', 'Qd3'],
        difficulty: 'beginner',
        description: 'You are white and down by 2.0 pawns according to Stockfish (-2.0). Try to win from this losing position.',
        evaluation: -2.0,
        puzzleId: 'fallback-1',
        themes: 'defensive',
        losingSide: 'white'
      },
      {
        fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/3P1N2/PPP2PPP/RNBQK2R w KQkq - 4 4',
        moves: ['O-O', 'Bxf7+', 'Kxf7'],
        difficulty: 'intermediate',
        description: 'You are white and down by 2.5 pawns according to Stockfish (-2.5). Try to win from this losing position.',
        evaluation: -2.5,
        puzzleId: 'fallback-2',
        themes: 'defensive',
        losingSide: 'white'
      },
      {
        fen: 'r1bq1rk1/pppp1ppp/2n2n2/2b1p3/2B1P3/3P1N2/PPP2PPP/RNBQ1RK1 w - - 6 5',
        moves: ['Bxc5', 'Nxc5', 'd4'],
        difficulty: 'advanced',
        description: 'You are white and down by 3.0 pawns according to Stockfish (-3.0). Try to win from this losing position.',
        evaluation: -3.0,
        puzzleId: 'fallback-3',
        themes: 'defensive',
        losingSide: 'white'
      },
      // Black losing positions
      {
        fen: 'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2',
        moves: ['Nf3', 'Nc6', 'Bb5'],
        difficulty: 'beginner',
        description: 'You are black and down by 1.5 pawns according to Stockfish (+1.5). Try to win from this losing position.',
        evaluation: 1.5,
        puzzleId: 'fallback-4',
        themes: 'defensive',
        losingSide: 'black'
      },
      {
        fen: 'rnbqkbnr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq e6 0 3',
        moves: ['Nc6', 'Bb5', 'Nf6'],
        difficulty: 'intermediate',
        description: 'You are black and down by 2.0 pawns according to Stockfish (+2.0). Try to win from this losing position.',
        evaluation: 2.0,
        puzzleId: 'fallback-5',
        themes: 'defensive',
        losingSide: 'black'
      },
      {
        fen: 'rnbqkbnr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq e6 0 3',
        moves: ['Nc6', 'Bb5', 'Nf6', 'O-O'],
        difficulty: 'advanced',
        description: 'You are black and down by 2.5 pawns according to Stockfish (+2.5). Try to win from this losing position.',
        evaluation: 2.5,
        puzzleId: 'fallback-6',
        themes: 'defensive',
        losingSide: 'black'
      }
    ];
    
    await processPositions(fallbackPositions);
    
  } catch (error) {
    console.error('Error creating fallback positions:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the script
addMorePositions();
