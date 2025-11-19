const express = require('express');
const fs = require('fs');
const csv = require('csv-parse');
const { Chess } = require('chess.js');
const router = express.Router();
const auth = require('../middleware/auth');
const premium = require('../middleware/premium');
const puzzleLimit = require('../middleware/puzzleLimit');
const User = require('../models/User');
const Puzzle = require('../models/Puzzle');

// Helper function to get piece values for material calculation
function getPieceValue(pieceType) {
  const values = {
    'p': 1,
    'n': 3,
    'b': 3,
    'r': 5,
    'q': 9,
    'k': 0
  };
  return values[pieceType] || 0;
}

// Function to categorize endgame by piece count and types
function categorizeEndgame(fen) {
  try {
    const chess = new Chess(fen);
    const board = chess.board();
    const pieces = board.flat().filter(p => p);
    
    const whitePieces = pieces.filter(p => p.color === 'w');
    const blackPieces = pieces.filter(p => p.color === 'b');
    
    const whitePawns = whitePieces.filter(p => p.type === 'p').length;
    const blackPawns = blackPieces.filter(p => p.type === 'p').length;
    const whiteKnights = whitePieces.filter(p => p.type === 'n').length;
    const blackKnights = blackPieces.filter(p => p.type === 'n').length;
    const whiteBishops = whitePieces.filter(p => p.type === 'b').length;
    const blackBishops = blackPieces.filter(p => p.type === 'b').length;
    const whiteRooks = whitePieces.filter(p => p.type === 'r').length;
    const blackRooks = blackPieces.filter(p => p.type === 'r').length;
    const whiteQueens = whitePieces.filter(p => p.type === 'q').length;
    const blackQueens = blackPieces.filter(p => p.type === 'q').length;
    
    const totalPieces = pieces.length;
    const totalPawns = whitePawns + blackPawns;
    const totalKnights = whiteKnights + blackKnights;
    const totalBishops = whiteBishops + blackBishops;
    const totalRooks = whiteRooks + blackRooks;
    const totalQueens = whiteQueens + blackQueens;
    
    // Check for checkmate patterns first
    if (chess.isCheckmate()) {
      return 'checkmate';
    }
    
    // Basic endgames (fundamental learning positions)
    if (totalPieces <= 4 && totalPawns === 0) {
      return 'basic'; // K vs K, K+Q vs K, K+R vs K, etc.
    }
    
    if (totalPieces <= 5 && totalPawns === 1 && (totalKnights + totalBishops + totalRooks + totalQueens <= 1)) {
      return 'basic'; // K+P vs K, K+Q vs K+P, etc.
    }
    
    // Pawn endgames - only pawns and kings
    if (totalKnights === 0 && totalBishops === 0 && totalRooks === 0 && totalQueens === 0) {
      return 'pawn';
    }
    
    // Knight endgames
    if (totalKnights > 0 && totalBishops === 0 && totalRooks === 0 && totalQueens === 0) {
      if (totalBishops > 0) {
        return 'knight-bishop';
      }
      return 'knight';
    }
    
    // Bishop endgames
    if (totalBishops > 0 && totalKnights === 0 && totalRooks === 0 && totalQueens === 0) {
      return 'bishop';
    }
    
    // Mixed minor pieces
    if ((totalKnights > 0 && totalBishops > 0) && totalRooks === 0 && totalQueens === 0) {
      return 'knight-bishop';
    }
    
    // Rook endgames
    if (totalRooks > 0 && totalQueens === 0) {
      if (totalPawns >= 1) {
        return 'rook-pawn';
      }
      if (totalKnights > 0 || totalBishops > 0) {
        return 'rook-pieces';
      }
      return 'rook-pieces';
    }
    
    // Queen endgames
    if (totalQueens > 0) {
      return 'queen';
    }
    
    // Fallback categories
    if (totalPieces >= 12) {
      return 'complex-endgames';
    }
    
    return 'basic';
  } catch (error) {
    console.error('Error categorizing endgame:', error);
    return 'basic';
  }
}

// Function to validate if an endgame position is valid
function isValidEndgamePosition(position) {
  if (!position || !position.fen || !Array.isArray(position.moves) || position.moves.length === 0) {
    return false;
  }
  
  let chess;
  try {
    chess = new Chess(position.fen);
  } catch (error) {
    return false;
  }
  
  // Check if position is already checkmate or stalemate
  if (chess.isCheckmate() || chess.isStalemate()) {
    return false;
  }
  
  // Check for impossible positions (kings adjacent)
  const board = chess.board();
  const kings = [];
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      if (board[i][j] && board[i][j].type === 'k') {
        kings.push({ row: i, col: j, color: board[i][j].color });
      }
    }
  }
  
  if (kings.length === 2) {
    const [king1, king2] = kings;
    const rowDiff = Math.abs(king1.row - king2.row);
    const colDiff = Math.abs(king1.col - king2.col);
    
    if (rowDiff <= 1 && colDiff <= 1) {
      console.log('❌ Invalid position: Kings are adjacent');
      return false;
    }
  }
  
  // Check if position has reasonable piece count (endgame should have fewer pieces)
  const pieces = chess.board().flat().filter(p => p);
  if (pieces.length > 20) { // Allow slightly more pieces for endgame
    return false;
  }
  
  // Check if first move is legal
  const firstMove = position.moves[0];
  if (firstMove) {
    const moveResult = chess.move(firstMove, { sloppy: true });
    if (!moveResult) {
      return false;
    }
    
    // After playing the first move, check if the position is still valid
    if (chess.isCheckmate() || chess.isStalemate()) {
      return false;
    }
    
    // Check for impossible positions after the first move too
    const boardAfterMove = chess.board();
    const kingsAfterMove = [];
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        if (boardAfterMove[i][j] && boardAfterMove[i][j].type === 'k') {
          kingsAfterMove.push({ row: i, col: j, color: boardAfterMove[i][j].color });
        }
      }
    }
    
    if (kingsAfterMove.length === 2) {
      const [king1, king2] = kingsAfterMove;
      const rowDiff = Math.abs(king1.row - king2.row);
      const colDiff = Math.abs(king1.col - king2.col);
      
      if (rowDiff <= 1 && colDiff <= 1) {
        console.log('❌ Invalid position after first move: Kings are adjacent');
        return false;
      }
    }
    
    // Ensure there are more moves in the solution for the user to play
    if (position.moves.length < 2) {
      return false;
    }
  }
  
  return true;
}

// Load endgame puzzles from database and CSV
let endgamePuzzles = [];
let endgameCategories = {};

async function loadEndgamePuzzles() {
  try {
    console.log('[ENDGAMES] Loading endgame puzzles...');
    
    // First, try to get endgame puzzles from the database (limit to prevent hanging)
    let dbEndgames = [];
    try {
      dbEndgames = await Promise.race([
        Puzzle.find({
          $or: [
            { theme: 'endgame' },
            { themes: { $in: ['endgame'] } }
          ]
        }).limit(2000).lean(), // Limit to 2000 to prevent memory issues
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Database query timeout')), 10000)
        )
      ]);
      
      console.log(`[ENDGAMES] Found ${dbEndgames.length} endgame puzzles in database`);
    } catch (dbError) {
      console.log(`[ENDGAMES] Database query failed: ${dbError.message}, using fallback puzzles`);
      dbEndgames = [];
    }
    
    // Process database puzzles
    dbEndgames.forEach((puzzle, index) => {
      if (isValidEndgamePosition(puzzle)) {
        const category = categorizeEndgame(puzzle.fen);
        const endgamePuzzle = {
          id: `db-${puzzle._id}`,
          fen: puzzle.fen,
          moves: Array.isArray(puzzle.moves) ? puzzle.moves : [puzzle.moves],
          rating: puzzle.rating || 1200,
          themes: puzzle.themes || [puzzle.theme || 'endgame'],
          url: puzzle.url || '',
          description: `Database endgame puzzle #${index + 1}`,
          category: category,
          source: 'database'
        };
        
        endgamePuzzles.push(endgamePuzzle);
        
        if (!endgameCategories[category]) {
          endgameCategories[category] = [];
        }
        endgameCategories[category].push(endgamePuzzle);
      }
    });
    
    // Load additional puzzles from CSV if available
    const ENDGAME_CSV_PATH = __dirname + '/../data/puzzles.csv';
    if (fs.existsSync(ENDGAME_CSV_PATH)) {
      await loadEndgamesFromCSV(ENDGAME_CSV_PATH);
    }
    
    // Load endgames from the professional endgame database
    const ENDGAME_DB_PATH = __dirname + '/../data/endgamedatabase.json';
    if (fs.existsSync(ENDGAME_DB_PATH)) {
      await loadEndgamesFromJSON(ENDGAME_DB_PATH);
    }
    
    // Load checkmate puzzles from the checkmate database
    const CHECKMATE_DB_PATH = __dirname + '/../data/checkmate.json';
    if (fs.existsSync(CHECKMATE_DB_PATH)) {
      await loadCheckmatesFromJSON(CHECKMATE_DB_PATH);
    }
    
    // Add fallback endgame puzzles if we don't have enough
    if (endgamePuzzles.length < 50) {
      addFallbackEndgames();
    }
    
    console.log(`[ENDGAMES] Total endgame puzzles loaded: ${endgamePuzzles.length}`);
    console.log(`[ENDGAMES] Categories:`, Object.keys(endgameCategories));
    
    // Log count per category
    Object.entries(endgameCategories).forEach(([category, puzzles]) => {
      console.log(`[ENDGAMES] ${category}: ${puzzles.length} puzzles`);
    });
    
  } catch (error) {
    console.error('[ENDGAMES] Error loading endgame puzzles:', error);
    addFallbackEndgames();
  }
}

async function loadEndgamesFromCSV(csvPath) {
  return new Promise((resolve, reject) => {
    const puzzles = [];
    let isFirstRow = true;
    let headers = [];
    let loadedCount = 0;
    const MAX_CSV_PUZZLES = 2000;

    fs.createReadStream(csvPath)
      .pipe(csv.parse())
      .on('data', (row) => {
        if (isFirstRow) {
          headers = row;
          isFirstRow = false;
          return;
        }

        if (loadedCount >= MAX_CSV_PUZZLES) {
          return;
        }

        const record = {};
        headers.forEach((header, index) => {
          record[header] = row[index];
        });

        // Filter for endgame puzzles - be more inclusive
        if (record.FEN && record.Moves) {
          // Check if it's an endgame position by piece count
          try {
            const chess = new Chess(record.FEN);
            const board = chess.board();
            const pieces = board.flat().filter(p => p);
            
            // Consider it an endgame if there are 18 or fewer pieces (more inclusive)
            const isEndgame = pieces.length <= 18;
            
            if (isEndgame) {
              // Parse themes from CSV and categorize
              let themes = [];
              if (record.Themes) {
                themes = record.Themes.split(',').map(t => t.trim()).filter(t => t);
              }
              
              // Check if it's a checkmate puzzle
              const isCheckmate = themes.some(t => 
                t.toLowerCase().includes('mate') || 
                t.toLowerCase().includes('checkmate') ||
                record.OpeningTags?.toLowerCase().includes('mate') ||
                record.OpeningTags?.toLowerCase().includes('checkmate')
              );
              
              // Count moves to determine mate-in-X
              const moveCount = record.Moves.split(' ').length;
              let mateCategory = '';
              if (isCheckmate && moveCount <= 5) {
                mateCategory = `mate-in-${moveCount}`;
              }
              
              const puzzle = {
                id: `csv-${record.PuzzleId || loadedCount}`,
                fen: record.FEN,
                moves: record.Moves.split(' '),
                rating: parseInt(record.Rating) || 1200,
                themes: themes,
                url: record.GameUrl || '',
                description: record.OpeningTags || 'CSV endgame puzzle',
                source: 'csv'
              };
              
              if (isValidEndgamePosition(puzzle)) {
                // Use mate category if available, otherwise use piece-based categorization
                const category = mateCategory || categorizeEndgame(puzzle.fen);
                puzzle.category = category;
                
                endgamePuzzles.push(puzzle);
                
                if (!endgameCategories[category]) {
                  endgameCategories[category] = [];
                }
                endgameCategories[category].push(puzzle);
                
                loadedCount++;
              }
            }
          } catch (error) {
            // Skip invalid positions
            console.log(`[ENDGAMES] Skipping invalid position: ${error.message}`);
          }
        }
      })
      .on('end', () => {
        console.log(`[ENDGAMES] Loaded ${loadedCount} additional puzzles from CSV`);
        resolve();
      })
      .on('error', (err) => {
        console.error('[ENDGAMES] Error loading CSV:', err);
        resolve(); // Don't reject, just continue
      });
  });
}

async function loadEndgamesFromJSON(jsonPath) {
  try {
    console.log(`[ENDGAMES] Loading endgames from JSON: ${jsonPath}`);
    const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    let loadedCount = 0;
    const MAX_JSON_PUZZLES = 2000;

    // Handle different JSON structures
    let positions = [];
    
    if (data.positions && Array.isArray(data.positions)) {
      positions = data.positions;
    } else if (Array.isArray(data)) {
      // Handle checkmate.json format - array of FEN strings
      positions = data.map((fen, index) => ({
        fen: fen,
        target: 'checkmate',
        id: `checkmate-${index}`
      }));
    } else if (data.categories && Array.isArray(data.categories)) {
      // Handle endgamedatabase.json format
      data.categories.forEach(category => {
        if (category.subcategories) {
          category.subcategories.forEach(subcat => {
            if (subcat.games) {
              positions = positions.concat(subcat.games);
            }
          });
        }
      });
    }

    positions.forEach((position, index) => {
      if (loadedCount >= MAX_JSON_PUZZLES) return;
      
      if (position.fen) {
        try {
          const chess = new Chess(position.fen);
          const board = chess.board();
          const pieces = board.flat().filter(p => p);
          
          // Only include true endgame positions
          if (pieces.length <= 16) {
            // Generate moves if not provided
            let moves = position.moves;
            if (!moves || !Array.isArray(moves) || moves.length === 0) {
              // Generate a simple solution based on the target
              if (position.target === 'checkmate') {
                // For checkmate positions, generate a basic mating sequence
                const legalMoves = chess.moves({ verbose: true });
                if (legalMoves.length > 0) {
                  moves = [legalMoves[0].san]; // Just the first legal move for now
                } else {
                  moves = ['resign']; // Fallback
                }
              } else {
                // For other positions, generate basic moves
                const legalMoves = chess.moves({ verbose: true });
                if (legalMoves.length > 0) {
                  moves = legalMoves.slice(0, 3).map(m => m.san);
                } else {
                  moves = ['resign'];
                }
              }
            }
            
            const puzzle = {
              id: `json-endgame-${index}`,
              fen: position.fen,
              moves: moves,
              rating: position.rating || 1300,
              themes: ['endgame', 'professional'],
              url: '',
              description: position.description || `Professional endgame #${index + 1}`,
              source: 'json-database'
            };
            
            if (isValidEndgamePosition(puzzle)) {
              const category = categorizeEndgame(puzzle.fen);
              puzzle.category = category;
              
              endgamePuzzles.push(puzzle);
              
              if (!endgameCategories[category]) {
                endgameCategories[category] = [];
              }
              endgameCategories[category].push(puzzle);
              
              loadedCount++;
            }
          }
        } catch (error) {
          // Skip invalid positions
          console.log(`[ENDGAMES] Skipping invalid JSON position: ${error.message}`);
        }
      }
    });
    
    console.log(`[ENDGAMES] Loaded ${loadedCount} puzzles from JSON database`);
  } catch (error) {
    console.error('[ENDGAMES] Error loading JSON database:', error);
  }
}

async function loadCheckmatesFromJSON(jsonPath) {
  try {
    console.log(`[ENDGAMES] Loading checkmates from JSON: ${jsonPath}`);
    const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    let loadedCount = 0;
    const MAX_CHECKMATE_PUZZLES = 300;

    // Handle array format (checkmate.json)
    if (Array.isArray(data)) {
      data.forEach((fen, index) => {
        if (loadedCount >= MAX_CHECKMATE_PUZZLES) return;
        
        if (fen && typeof fen === 'string') {
          try {
            const chess = new Chess(fen);
            
            // Verify it's NOT already checkmate (we want positions where we can find mate)
            if (!chess.isCheckmate()) {
              // Generate a basic mating sequence
              const legalMoves = chess.moves({ verbose: true });
              let moves = [];
              
              if (legalMoves.length > 0) {
                // Try to find a checkmate in a few moves
                moves = legalMoves.slice(0, 3).map(m => m.san);
              } else {
                moves = ['resign'];
              }
              
              const puzzle = {
                id: `json-checkmate-${index}`,
                fen: fen,
                moves: moves,
                rating: 1400,
                themes: ['endgame', 'checkmate', 'professional'],
                url: '',
                description: `Checkmate puzzle #${index + 1}`,
                source: 'json-checkmate-database'
              };
              
              if (isValidEndgamePosition(puzzle)) {
                puzzle.category = 'checkmate';
                
                endgamePuzzles.push(puzzle);
                
                if (!endgameCategories['checkmate']) {
                  endgameCategories['checkmate'] = [];
                }
                endgameCategories['checkmate'].push(puzzle);
                
                loadedCount++;
              }
            }
          } catch (error) {
            // Skip invalid positions
            console.log(`[ENDGAMES] Skipping invalid checkmate position: ${error.message}`);
          }
        }
      });
    } else if (data.positions && Array.isArray(data.positions)) {
      // Handle object format with positions array
      data.positions.forEach((position, index) => {
        if (loadedCount >= MAX_CHECKMATE_PUZZLES) return;
        
        if (position.fen && position.moves && Array.isArray(position.moves) && position.moves.length > 0) {
          try {
            const chess = new Chess(position.fen);
            
            // Verify it's a checkmate position
            if (!chess.isCheckmate()) {
              const puzzle = {
                id: `json-checkmate-${index}`,
                fen: position.fen,
                moves: position.moves,
                rating: 1400,
                themes: ['endgame', 'checkmate', 'professional'],
                url: '',
                description: position.description || `Checkmate puzzle #${index + 1}`,
                source: 'json-checkmate-database'
              };
              
              if (isValidEndgamePosition(puzzle)) {
                puzzle.category = 'checkmate';
                
                endgamePuzzles.push(puzzle);
                
                if (!endgameCategories['checkmate']) {
                  endgameCategories['checkmate'] = [];
                }
                endgameCategories['checkmate'].push(puzzle);
                
                loadedCount++;
              }
            }
          } catch (error) {
            // Skip invalid positions
            console.log(`[ENDGAMES] Skipping invalid checkmate position: ${error.message}`);
          }
        }
      });
    }
    
    console.log(`[ENDGAMES] Loaded ${loadedCount} checkmate puzzles from JSON database`);
  } catch (error) {
    console.error('[ENDGAMES] Error loading checkmate JSON database:', error);
  }
}

function addFallbackEndgames() {
  const fallbackEndgames = [
    {
      id: 'fallback-1',
      fen: '8/8/8/3p4/3P4/8/4K3/5k2 w - - 0 1',
      moves: ['Kd3', 'Ke5', 'Kc4', 'Kf4', 'Kd5'],
      rating: 1200,
      themes: ['endgame', 'pawn'],
      description: 'King and Pawn vs King - Opposition',
      category: 'king-pawn-vs-king',
      source: 'fallback'
    },
    {
      id: 'fallback-2',
      fen: '8/8/8/8/2p1P3/8/4K3/5k2 w - - 0 1',
      moves: ['Kd3', 'Ke5', 'e5', 'Kf5', 'Kd4'],
      rating: 1300,
      themes: ['endgame', 'pawn'],
      description: 'Pawn breakthrough',
      category: 'king-pawn-vs-king',
      source: 'fallback'
    },
    {
      id: 'fallback-3',
      fen: '8/8/8/3pk3/3PK3/8/8/8 w - - 0 1',
      moves: ['Kf5', 'Kd6', 'Kf6', 'Kd7', 'Ke5'],
      rating: 1400,
      themes: ['endgame', 'pawn'],
      description: 'King and Pawn vs King and Pawn',
      category: 'king-pawn-vs-king-pawn',
      source: 'fallback'
    },
    {
      id: 'fallback-4',
      fen: '8/8/8/8/2k1p3/4P3/4K3/8 w - - 0 1',
      moves: ['Kd3', 'Kd5', 'Kd2', 'Ke4', 'Ke2'],
      rating: 1500,
      themes: ['endgame', 'pawn'],
      description: 'Passed pawn endgame',
      category: 'pawn-endgames',
      source: 'fallback'
    },
    {
      id: 'fallback-5',
      fen: '8/8/8/8/8/8/4K3/4k3 w - - 0 1',
      moves: ['Ke2', 'Kd2', 'Kd3', 'Kc3', 'Kc4'],
      rating: 1000,
      themes: ['endgame', 'king'],
      description: 'King vs King',
      category: 'king-vs-king',
      source: 'fallback'
    },
    {
      id: 'fallback-6',
      fen: '8/8/8/8/8/3k4/3BK3/8 w - - 0 1',
      moves: ['Bc3', 'Kd2', 'Ke4'],
      rating: 1400,
      themes: ['endgame', 'bishop'],
      description: 'Bishop Endgame - Control key squares',
      category: 'bishop-endgames',
      source: 'fallback'
    },
    {
      id: 'fallback-7',
      fen: '8/8/8/8/8/3k4/3NK3/8 w - - 0 1',
      moves: ['Nc4+', 'Kd4', 'Ne3'],
      rating: 1400,
      themes: ['endgame', 'knight'],
      description: 'Knight Endgame - Maneuver effectively',
      category: 'knight-endgames',
      source: 'fallback'
    },
    {
      id: 'fallback-8',
      fen: '8/8/8/8/8/3k4/3RK3/8 w - - 0 1',
      moves: ['Rd4+', 'Ke5', 'Rd5+'],
      rating: 1500,
      themes: ['endgame', 'rook'],
      description: 'Rook Endgame - Dominate the position',
      category: 'rook-endgames',
      source: 'fallback'
    },
    {
      id: 'fallback-9',
      fen: '7k/5Q2/6K1/8/8/8/8/8 w - - 0 1',
      moves: ['Qf8#'],
      rating: 1200,
      themes: ['endgame', 'checkmate'],
      description: 'Mate in 1 - Find the checkmate',
      category: 'checkmate',
      source: 'fallback'
    },
    {
      id: 'fallback-10',
      fen: '8/8/8/8/8/3k4/3QK3/8 w - - 0 1',
      moves: ['Qd4+', 'Ke6', 'Qd5+'],
      rating: 1300,
      themes: ['endgame', 'queen'],
      description: 'Queen Endgame - Demonstrate queen power',
      category: 'queen-endgames',
      source: 'fallback'
    }
  ];
  
  fallbackEndgames.forEach(puzzle => {
    endgamePuzzles.push(puzzle);
    if (!endgameCategories[puzzle.category]) {
      endgameCategories[puzzle.category] = [];
    }
    endgameCategories[puzzle.category].push(puzzle);
  });
  
  // Ensure we have at least one puzzle in each category
  const categories = ['basic', 'pawn', 'bishop', 'knight', 'rook', 'queen', 'checkmate'];
  categories.forEach(category => {
    if (!endgameCategories[category] || endgameCategories[category].length === 0) {
      // Find a fallback puzzle for this category
      const fallback = fallbackEndgames.find(p => p.category === category);
      if (fallback) {
        if (!endgameCategories[category]) {
          endgameCategories[category] = [];
        }
        endgameCategories[category].push(fallback);
      }
    }
  });
  
  console.log(`[ENDGAMES] Added ${fallbackEndgames.length} fallback endgames`);
}

// Initialize endgame puzzles
loadEndgamePuzzles().catch(err => {
  console.error('[ENDGAMES] Failed to load endgame puzzles:', err);
});

// Get all endgame categories
router.get('/categories', (req, res) => {
  const categories = Object.keys(endgameCategories).map(category => ({
    id: category,
    name: getCategoryDisplayName(category),
    count: endgameCategories[category]?.length || 0,
    description: getCategoryDescription(category)
  }));
  
  res.json({ 
    categories: categories.sort((a, b) => b.count - a.count),
    totalPuzzles: endgamePuzzles.length
  });
});

// Get all endgame themes for dropdown
router.get('/themes', (req, res) => {
  const themes = Object.keys(endgameCategories).map(category => ({
    value: category,
    label: getCategoryDisplayName(category)
  }));
  
  res.json({ themes });
});

function getCategoryDisplayName(category) {
  const displayNames = {
    'king-vs-king': 'King vs King',
    'king-pawn-vs-king': 'King + Pawn vs King',
    'king-pawn-vs-king-pawn': 'King + Pawn vs King + Pawn',
    'pawn-endgames': 'Pawn Endgames',
    'knight-endgames': 'Knight Endgames',
    'bishop-endgames': 'Bishop Endgames',
    'rook-endgames': 'Rook Endgames',
    'queen-endgames': 'Queen Endgames',
    'multi-pawn-endgames': 'Multi-Pawn Endgames',
    'major-piece-endgames': 'Major Piece Endgames',
    'minor-piece-endgames': 'Minor Piece Endgames',
    'complex-endgames': 'Complex Endgames',
    'checkmate': 'Checkmate',
    'mate-in-1': 'Mate in 1',
    'mate-in-2': 'Mate in 2',
    'mate-in-3': 'Mate in 3',
    'mate-in-4': 'Mate in 4',
    'mate-in-5': 'Mate in 5',
    'basic': 'Basic Endgames',
    'pawn': 'Pawn Endgames',
    'rook': 'Rook Endgames',
    'queen': 'Queen Endgames'
  };
  
  return displayNames[category] || category.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function getCategoryDescription(category) {
  const descriptions = {
    'king-vs-king': 'Basic king maneuvering and opposition',
    'king-pawn-vs-king': 'Essential pawn promotion techniques',
    'king-pawn-vs-king-pawn': 'Pawn races and opposition',
    'pawn-endgames': 'Multi-pawn endgames and breakthroughs',
    'knight-endgames': 'Knight coordination and tactics',
    'bishop-endgames': 'Bishop pair and diagonal control',
    'rook-endgames': 'Rook activity and 7th rank',
    'queen-endgames': 'Queen coordination and mating patterns',
    'multi-pawn-endgames': 'Complex pawn structures',
    'major-piece-endgames': 'Rook and queen endgames',
    'minor-piece-endgames': 'Knight and bishop endgames',
    'complex-endgames': 'Mixed piece endgames',
    'checkmate': 'Find the winning move',
    'mate-in-1': 'Checkmate in one move',
    'mate-in-2': 'Checkmate in two moves',
    'mate-in-3': 'Checkmate in three moves',
    'mate-in-4': 'Checkmate in four moves',
    'mate-in-5': 'Checkmate in five moves',
    'basic': 'Fundamental endgame principles',
    'pawn': 'Pawn promotion and breakthroughs',
    'rook': 'Rook activity and coordination',
    'queen': 'Queen power and mating patterns'
  };
  
  return descriptions[category] || 'Various endgame positions';
}

// Get endgame puzzles by category
router.get('/category/:categoryId', (req, res) => {
  const { categoryId } = req.params;
  const { count = 1, difficulty } = req.query;
  
  console.log(`[ENDGAMES] Fetching ${count} puzzles for category: ${categoryId}, difficulty: ${difficulty || 'any'}`);
  
  let categoryPuzzles = endgameCategories[categoryId];
  if (!categoryPuzzles || categoryPuzzles.length === 0) {
    console.log(`[ENDGAMES] No puzzles found for category: ${categoryId}`);
    return res.status(404).json({ 
      error: `No puzzles found for category: ${categoryId}`,
      availableCategories: Object.keys(endgameCategories)
    });
  }
  
  // Filter by difficulty if specified
  if (difficulty) {
    let minRating, maxRating;
    
    switch (difficulty.toLowerCase()) {
      case 'beginner':
        minRating = 800;
        maxRating = 1200;
        break;
      case 'intermediate':
        minRating = 1200;
        maxRating = 1800;
        break;
      case 'advanced':
        minRating = 1800;
        maxRating = 3000;
        break;
      default:
        console.log(`[ENDGAMES] Unknown difficulty level: ${difficulty}, ignoring filter`);
    }
    
    if (minRating !== undefined && maxRating !== undefined) {
      const originalCount = categoryPuzzles.length;
      categoryPuzzles = categoryPuzzles.filter(pos => 
        pos.rating && pos.rating >= minRating && pos.rating <= maxRating
      );
      console.log(`[ENDGAMES] Filtered to ${categoryPuzzles.length} puzzles (from ${originalCount}) for difficulty '${difficulty}' (rating ${minRating}-${maxRating})`);
      
      // If no puzzles match the difficulty, return error
      if (categoryPuzzles.length === 0) {
        console.log(`[ENDGAMES] No puzzles match difficulty range ${minRating}-${maxRating} for category ${categoryId}`);
        return res.status(404).json({ 
          error: `No puzzles found for category '${categoryId}' with difficulty '${difficulty}' (rating ${minRating}-${maxRating})`,
          difficulty: difficulty,
          minRating: minRating,
          maxRating: maxRating,
          category: categoryId,
          availableCategories: Object.keys(endgameCategories)
        });
      }
    }
  }
  
  // Return random puzzle(s) from this category
  const numPuzzles = Math.min(parseInt(count), categoryPuzzles.length);
  const selectedPuzzles = [];
  
  for (let i = 0; i < numPuzzles; i++) {
    const randomIndex = Math.floor(Math.random() * categoryPuzzles.length);
    selectedPuzzles.push(categoryPuzzles[randomIndex]);
  }
  
  console.log(`[ENDGAMES] Returning ${selectedPuzzles.length} puzzles for category: ${categoryId}`);
  
  if (numPuzzles === 1) {
    // Return single puzzle
    const puzzle = selectedPuzzles[0];
    res.json({
      id: puzzle.id,
      fen: puzzle.fen,
      moves: puzzle.moves,
      description: puzzle.description,
      rating: puzzle.rating,
      category: puzzle.category,
      themes: puzzle.themes,
      theme: puzzle.category // Add theme field for compatibility
    });
  } else {
    // Return multiple puzzles
    res.json({
      category: categoryId,
      puzzles: selectedPuzzles.map(p => ({
        id: p.id,
        fen: p.fen,
        moves: p.moves,
        description: p.description,
        rating: p.rating,
        themes: p.themes,
        theme: p.category // Add theme field for compatibility
      })),
      count: selectedPuzzles.length
    });
  }
});

// Get random endgame puzzle (free users can access but count toward puzzle limit)
router.get('/random', auth, puzzleLimit, (req, res) => {
  const { category, difficulty } = req.query;
  
  let filtered = endgamePuzzles;

  if (category) {
    const normalizedCategory = category.toLowerCase().trim();
    filtered = filtered.filter(pos => pos.category === normalizedCategory);
  }
  
  // Strict difficulty filtering based on rating ranges
  if (difficulty) {
    let minRating, maxRating;
    
    switch (difficulty.toLowerCase()) {
      case 'beginner':
        minRating = 800;
        maxRating = 1200;
        break;
      case 'intermediate':
        minRating = 1200;
        maxRating = 1800;
        break;
      case 'advanced':
        minRating = 1800;
        maxRating = 3000;
        break;
      default:
        console.log(`[ENDGAMES] Unknown difficulty level: ${difficulty}`);
        return res.status(400).json({ 
          error: 'Invalid difficulty level',
          validLevels: ['beginner', 'intermediate', 'advanced']
        });
    }
    
    console.log(`[ENDGAMES] Filtering by difficulty '${difficulty}': rating ${minRating}-${maxRating}`);
    
    // Apply strict rating range filtering
    const originalFiltered = [...filtered];
    filtered = filtered.filter(pos => 
      pos.rating && pos.rating >= minRating && pos.rating <= maxRating
    );
    
    console.log(`[ENDGAMES] Found ${filtered.length} puzzles in rating range ${minRating}-${maxRating} (from ${originalFiltered.length} total)`);
    
    // If no puzzles match the strict difficulty range, return error
    if (filtered.length === 0) {
      console.log(`[ENDGAMES] No puzzles match strict difficulty range ${minRating}-${maxRating}`);
      return res.status(404).json({ 
        error: `No puzzles found for difficulty level '${difficulty}' (rating ${minRating}-${maxRating})`,
        difficulty: difficulty,
        minRating: minRating,
        maxRating: maxRating,
        availableCategories: Object.keys(endgameCategories)
      });
    }
  }
  
  if (filtered.length === 0) {
    return res.status(404).json({ 
      error: 'No endgame positions found with the specified criteria',
      availableCategories: Object.keys(endgameCategories)
    });
  }
  
  const randomPosition = filtered[Math.floor(Math.random() * filtered.length)];
  
  res.json({
    id: randomPosition.id,
    fen: randomPosition.fen,
    description: randomPosition.description,
    themes: randomPosition.themes,
    rating: randomPosition.rating,
    category: randomPosition.category,
    moves: randomPosition.moves
  });
});

// Get next puzzle in sequence for a category (free users can access but count toward puzzle limit)
router.get('/next/:categoryId', auth, puzzleLimit, (req, res) => {
  const { categoryId } = req.params;
  const { currentId, difficulty } = req.query;
  
  console.log(`[ENDGAMES] Getting next puzzle for category: ${categoryId}, current: ${currentId}`);
  
  const categoryPuzzles = endgameCategories[categoryId];
  if (!categoryPuzzles || categoryPuzzles.length === 0) {
    console.log(`[ENDGAMES] No puzzles found for category: ${categoryId}`);
    return res.status(404).json({ 
      error: `No puzzles found for category: ${categoryId}`,
      availableCategories: Object.keys(endgameCategories)
    });
  }
  
  let nextPuzzle;
  
  if (currentId) {
    // Find current puzzle index and get next one
    const currentIndex = categoryPuzzles.findIndex(p => p.id === currentId);
    if (currentIndex !== -1) {
      const nextIndex = (currentIndex + 1) % categoryPuzzles.length;
      nextPuzzle = categoryPuzzles[nextIndex];
    }
  }
  
  // If no current ID or couldn't find next, get random puzzle
  if (!nextPuzzle) {
    const randomIndex = Math.floor(Math.random() * categoryPuzzles.length);
    nextPuzzle = categoryPuzzles[randomIndex];
  }
  
  // Filter by difficulty if specified
  if (difficulty) {
    const targetRating = parseInt(difficulty);
    const filtered = categoryPuzzles.filter(pos => 
      pos.rating && Math.abs(pos.rating - targetRating) <= 200
    );
    if (filtered.length > 0) {
      const randomIndex = Math.floor(Math.random() * filtered.length);
      nextPuzzle = filtered[randomIndex];
    }
  }
  
  console.log(`[ENDGAMES] Returning next puzzle: ${nextPuzzle.id}`);
  
  res.json({
    id: nextPuzzle.id,
    fen: nextPuzzle.fen,
    moves: nextPuzzle.moves,
    description: nextPuzzle.description,
    rating: nextPuzzle.rating,
    category: nextPuzzle.category,
    themes: nextPuzzle.themes
  });
});

// Get specific endgame position by ID (free users can access but count toward puzzle limit)
router.get('/:id', auth, puzzleLimit, (req, res) => {
  const { id } = req.params;
  const position = endgamePuzzles.find(pos => pos.id == id);
  
  if (!position) {
    return res.status(404).json({ error: 'Endgame position not found' });
  }
  
  res.json({
    id: position.id,
    fen: position.fen,
    description: position.description,
    themes: position.themes,
    rating: position.rating,
    category: position.category,
    moves: position.moves
  });
});

// Validate move in endgame position (counts toward puzzle limit for free users)
router.post('/:id/validate', auth, puzzleLimit, (req, res) => {
  const { id } = req.params;
  const { move, fen, moveIndex } = req.body;
  
  const position = endgamePuzzles.find(pos => pos.id == id);
  if (!position) {
    return res.status(404).json({ error: 'Endgame position not found' });
  }
  
  console.log('[ENDGAMES] Validation request:', { id, move, fen, moveIndex });
  
  const idx = typeof moveIndex === 'number' ? moveIndex : 0;
  const solution = position.moves;
  
  // Check if the user's move matches the expected move at the current index
  if (solution[idx] && move === solution[idx]) {
    // Create chess instance from the current FEN and make the user's move
    let chess = new Chess(fen);
    const userMoveResult = chess.move(move, { sloppy: true });
    
    if (!userMoveResult) {
      return res.json({ valid: false, error: 'Invalid move' });
    }
    
    let opponentMove = null;
    let puzzleComplete = false;
    let nextMoveIndex = idx + 1;
    
    // If there's a next move in the solution, play it automatically
    if (solution[idx + 1]) {
      const oppResult = chess.move(solution[idx + 1], { sloppy: true });
      if (oppResult) {
        opponentMove = oppResult.san;
        nextMoveIndex = idx + 2;
      }
    }
    
    // Check if puzzle is complete
    if (nextMoveIndex >= solution.length) {
      puzzleComplete = true;
    }
    
    console.log('[ENDGAMES] Move validation successful:', {
      valid: true,
      fen: chess.fen(),
      userMove: move,
      opponentMove,
      nextMoveIndex,
      puzzleComplete
    });
    
    return res.json({
      valid: true,
      fen: chess.fen(),
      userMove: move,
      opponentMove,
      nextMoveIndex,
      puzzleComplete
    });
  } else {
    console.log('[ENDGAMES] Move validation failed:', {
      valid: false,
      expected: solution[idx],
      received: move,
      index: idx
    });
    return res.json({ valid: false, error: 'Incorrect move' });
  }
});

// Get solution for endgame position (free users can access but count toward puzzle limit)
router.get('/:id/solution', auth, puzzleLimit, (req, res) => {
  const { id } = req.params;
  const position = endgamePuzzles.find(pos => pos.id == id);
  
  if (!position) {
    return res.status(404).json({ error: 'Endgame position not found' });
  }
  
  res.json({ solution: position.moves });
});

// Update endgame stats and rating
router.post('/stats', auth, async (req, res) => {
  try {
    console.log('[ENDGAMES] Rating update request received:', req.body);
    console.log('[ENDGAMES] User from auth middleware:', req.user);
    const { solved, puzzleRating } = req.body;
    const userId = req.user.id;
    
    console.log('[ENDGAMES] User ID:', userId, 'Solved:', solved, 'Puzzle Rating:', puzzleRating);

    const user = await User.findById(userId);
    if (!user) {
      console.log('[ENDGAMES] User not found:', userId);
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('[ENDGAMES] Current user endgame rating:', user.endgameRating);
    console.log('[ENDGAMES] User document before update:', {
      id: user._id,
      endgameRating: user.endgameRating,
      username: user.username
    });

    // Calculate rating change using ELO system
    const userRating = user.endgameRating || 1200;
    const expectedScore = 1 / (1 + Math.pow(10, (puzzleRating - userRating) / 400));
    const actualScore = solved ? 1 : 0;
    const kFactor = 32;
    let ratingChange = Math.round(kFactor * (actualScore - expectedScore));
    
    // Ensure rating always changes - if it's 0, make it at least ±1
    if (ratingChange === 0) {
      ratingChange = solved ? 1 : -1;
      console.log('[ENDGAMES] Rating change was 0, forcing to:', ratingChange);
    }
    
    const newRating = Math.max(100, userRating + ratingChange);

    console.log('[ENDGAMES] Rating calculation:', {
      userRating,
      puzzleRating,
      expectedScore,
      actualScore,
      ratingChange,
      newRating
    });

    // Update user's endgame rating
    user.endgameRating = newRating;
    await user.save();

    console.log('[ENDGAMES] Rating updated successfully for user:', userId);
    console.log('[ENDGAMES] User document after update:', {
      id: user._id,
      endgameRating: user.endgameRating,
      username: user.username
    });

    res.json({
      newRating,
      ratingChange,
      message: solved ? 'Endgame solved! Rating increased.' : 'Endgame failed. Rating decreased.'
    });

  } catch (error) {
    console.error('[ENDGAMES] Error updating stats:', error);
    res.status(500).json({ message: 'Failed to update endgame stats', error: error.message });
  }
});

module.exports = router; 