const express = require('express');
const router = express.Router();
const Puzzle = require('../models/Puzzle');
const { Chess } = require('chess.js');
const { spawn } = require('child_process');
const path = require('path');
const auth = require('../middleware/auth');
const premium = require('../middleware/premium');
const User = require('../models/User');
const fs = require('fs');
const csv = require('csv-parser');
const { updateUserRating, initializeUserRatings } = require('../utils/ratingUtils');
const mongoose = require('mongoose');

// Blunder Position Schema
const blunderPositionSchema = new mongoose.Schema({
  fen: { type: String, required: true },
  bestMove: { type: String, required: true },
  blunderMove: { type: String, required: true },
  bestMoveEval: { type: Number, required: true },
  blunderMoveEval: { type: Number, required: true },
  rating: { type: Number, required: true },
  themes: { type: String, default: 'tactical' },
  puzzleId: { type: String, required: true }
});

const BlunderPosition = mongoose.model('BlunderPosition', blunderPositionSchema);

const pieceVals = { p:1, n:3, b:3, r:5, q:9, k:0 };
function materialDiff(chess){
  const board = chess.board();
  let white=0, black=0;
  for(const row of board){
    for(const piece of row){
      if(!piece) continue;
      const val = pieceVals[piece.type] || 0;
      if(piece.color==='w') white += val; else black += val;
    }
  }
  return white - black;
}

// Load GENERAL puzzles for blunder prevention (any position, no check)
let generalPuzzlesForBlunder = [];
// Track recently served FENs to avoid repetition
const recentServedFens = [];
const RECENT_FENS_LIMIT = 15;

function loadGeneralPuzzlesForBlunder() {
  return new Promise((resolve, reject) => {
    const PUZZLES_CSV_PATH = path.join(__dirname, '../data/puzzles.csv');
    const puzzles = [];
    let loadedCount = 0;
    const MAX_PUZZLES = 2000;

    if (!fs.existsSync(PUZZLES_CSV_PATH)) {
      console.log('No puzzles CSV found, using fallback puzzles for blunder preventer');
      generalPuzzlesForBlunder = getFallbackGeneralPuzzles();
      resolve();
      return;
    }

    console.log('Loading GENERAL puzzle positions from CSV for blunder prevention...');
    
    fs.createReadStream(PUZZLES_CSV_PATH)
      .pipe(csv())
      .on('data', (row) => {
        if (loadedCount >= MAX_PUZZLES) return;

        // Load GENERAL puzzle positions from CSV
        if (row.FEN && row.Moves && row.Rating) {
          const rating = parseInt(row.Rating) || 0;
          
          // Use puzzles with reasonable ratings (any position type)
          if (rating >= 600 && rating <= 2200) {
            const puzzle = {
              id: row.PuzzleId || `puzzle_${loadedCount}`,
              fen: row.FEN,
              moves: row.Moves.split(' '),
              rating: rating,
              themes: row.Themes || 'tactical',
              url: row.GameUrl || '',
            };
            
            // Validate the position is legal, NOT in check, and has multiple moves
            try {
              const chess = new Chess(puzzle.fen);
              
              // Must be legal, not in check, not mate/stalemate, has moves
              if (!chess.isCheck() && 
                  !chess.isCheckmate() && 
                  !chess.isStalemate() && 
                  chess.moves().length >= 4) {
                puzzles.push(puzzle);
                loadedCount++;
                
                if (loadedCount % 500 === 0) {
                  console.log(`Loaded ${loadedCount} general positions...`);
                }
              }
            } catch (err) {
              // Skip invalid positions
            }
          }
        }
      })
      .on('end', () => {
        generalPuzzlesForBlunder = puzzles;
        console.log(`Successfully loaded ${generalPuzzlesForBlunder.length} GENERAL puzzle positions for blunder prevention`);
        resolve();
      })
      .on('error', (err) => {
        console.error('Error loading general puzzle positions for blunder prevention:', err);
        generalPuzzlesForBlunder = getFallbackGeneralPuzzles();
        resolve();
      });
  });
}

function getFallbackGeneralPuzzles() {
  // Legal GENERAL positions (any piece count, no check) where one move is clearly better than the other
  return [
    { // Opening - develop piece vs waste move
      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      bestMove: 'e4',
      blunderMove: 'h3'
    },
    { // Middlegame - tactical shot vs passive move
      fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/3P1N2/PPP2PPP/RNBQK2R w KQkq - 4 4',
      bestMove: 'Bxf7+',
      blunderMove: 'Be2'
    },
    { // Endgame - king activity vs passive move
      fen: '8/8/8/8/8/k7/2P5/2K5 w - - 0 1',
      bestMove: 'c4',
      blunderMove: 'Kd2'
    },
    { // Tactical - fork vs random move
      fen: 'r3k2r/ppp1nppp/2n1p3/2b1P3/2B1P3/2N2N2/PPP2PPP/R3K2R w KQkq - 6 8',
      bestMove: 'Nxe5',
      blunderMove: 'Be2'
    },
    { // Positional - control center vs edge move
      fen: 'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2',
      bestMove: 'Nf3',
      blunderMove: 'h3'
    },
    { // Material - win piece vs waste time
      fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/3P1N2/PPP2PPP/RNBQK2R w KQkq - 4 4',
      bestMove: 'Bxf7+',
      blunderMove: 'Be2'
    },
    { // King safety - castle vs expose king
      fen: 'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2',
      bestMove: 'Nf3',
      blunderMove: 'f3'
    },
    { // Development - develop vs waste move
      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      bestMove: 'e4',
      blunderMove: 'a3'
    }
  ];
}

// Load puzzles on startup
loadGeneralPuzzlesForBlunder().catch(console.error);

// helper: run stockfish once and return array of {move, scoreCp}
async function analyseFen(fen, depth = 12, multiPv = 8) {
  return new Promise((resolve, reject) => {
    const stockPath = path.join(__dirname, '../engines/stockfish.exe');
    const engine = spawn(stockPath);
    const evaluations = [];

    engine.stdout.on('data', chunk => {
      const lines = chunk.toString().split(/\r?\n/);
      lines.forEach(line => {
        if (line.startsWith('info') && line.includes(' pv ')) {
          const parts = line.split(' ');
          const idxPv = parts.indexOf('pv');
          const idxScore = parts.indexOf('cp');
          if (idxPv !== -1 && idxScore !== -1) {
            const move = parts[idxPv+1];
            const score = parseInt(parts[idxScore+1]);
            // avoid duplicates
            if (!evaluations.find(e=>e.move===move)) evaluations.push({move, scoreCp: score});
          }
        }
        if (line.startsWith('bestmove')) {
          engine.kill();
          resolve(evaluations);
        }
      });
    });

    engine.stdin.write(`position fen ${fen}\n`);
    engine.stdin.write(`setoption name MultiPV value ${multiPv}\n`);
    engine.stdin.write(`go depth ${depth}\n`);

    // timeout safety
    setTimeout(()=>{
      engine.kill();
      if(evaluations.length) resolve(evaluations); else reject(new Error('Stockfish timeout'));
    }, 7000);
  });
}

// GET /api/blunder-preventer/random
router.get('/random', auth, premium, async (req, res) => {
  try {
    console.log('Getting blunder position from database...');
    
    // Get total count of available positions
    const totalPositions = await BlunderPosition.countDocuments();
    console.log(`Total blunder positions in database: ${totalPositions}`);
    
    if (totalPositions === 0) {
      console.log('No blunder positions in database, using fallback');
      const fallbackPuzzles = getFallbackGeneralPuzzles();
      const randomFallback = fallbackPuzzles[Math.floor(Math.random() * fallbackPuzzles.length)];
      
      return res.json({
        fen: randomFallback.fen,
        bestMove: randomFallback.bestMove,
        blunderMove: randomFallback.blunderMove,
        id: 'fallback'
      });
    }

    // Get a random position from the database
    const randomIndex = Math.floor(Math.random() * totalPositions);
    const blunderPos = await BlunderPosition.findOne().skip(randomIndex);
    
    if (!blunderPos) {
      console.log('No blunder position found, using fallback');
      const fallbackPuzzles = getFallbackGeneralPuzzles();
      const randomFallback = fallbackPuzzles[Math.floor(Math.random() * fallbackPuzzles.length)];
      
      return res.json({
        fen: randomFallback.fen,
        bestMove: randomFallback.bestMove,
        blunderMove: randomFallback.blunderMove,
        id: 'fallback'
      });
    }

    console.log(`Selected blunder position: ${blunderPos.fen}`);
    console.log(`Best: ${blunderPos.bestMove} (${blunderPos.bestMoveEval}cp), Blunder: ${blunderPos.blunderMove} (${blunderPos.blunderMoveEval}cp)`);
    console.log(`Rating: ${blunderPos.rating}, Themes: ${blunderPos.themes}`);

    return res.json({
      fen: blunderPos.fen,
      bestMove: blunderPos.bestMove,
      blunderMove: blunderPos.blunderMove,
      id: blunderPos.puzzleId,
      rating: blunderPos.rating,
      themes: blunderPos.themes,
      bestMoveEval: blunderPos.bestMoveEval,
      blunderMoveEval: blunderPos.blunderMoveEval
    });

  } catch (error) {
    console.error('Blunder prevention error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/blunder-preventer/stats
router.post('/stats', auth, async (req, res) => {
  try {
    const { solved, puzzleRating } = req.body;
    console.log('🔥 Blunder stats update - solved:', solved, 'puzzleRating:', puzzleRating, 'userID:', req.user.id);
    
    const user = await User.findById(req.user.id);
    if (!user) {
      console.log('❌ User not found for ID:', req.user.id);
      return res.status(404).json({ message: 'User not found' });
    }
    
    console.log('👤 User found, current blunderRating:', user.blunderRating);
    
    // Initialize all rating fields if they don't exist
    initializeUserRatings(user);
    
    const ratingValue = parseInt(puzzleRating) || 1200;
    console.log('📊 Rating calculation - userRating:', user.blunderRating, 'puzzleRating:', ratingValue, 'solved:', solved);
    
    // Update user rating using utility function
    const ratingResult = await updateUserRating(req.user.id, 'blunderRating', ratingValue, solved);
    
    console.log('✅ New blunder rating:', ratingResult.newRating, 'change:', ratingResult.ratingChange);
    
    res.json({ newRating: ratingResult.newRating, ratingChange: ratingResult.ratingChange });
  } catch (err) {
    console.error('❌ Error updating blunder rating:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 