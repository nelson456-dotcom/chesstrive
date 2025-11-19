const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const Puzzle = require('../models/Puzzle');
const { Chess } = require('chess.js');
const auth = require('../middleware/auth');
const premium = require('../middleware/premium');
const User = require('../models/User');
const { updateUserRating, initializeUserRatings } = require('../utils/ratingUtils');
const mongoose = require('mongoose');

// Visualization Position Schema
const visualizationPositionSchema = new mongoose.Schema({
  fen: { type: String, required: true },
  rating: { type: Number, required: true },
  themes: { type: String, default: 'pawnEndgame' },
  puzzleId: { type: String, required: true }
});

const VisualizationPosition = mongoose.model('VisualizationPosition', visualizationPositionSchema);

// Load lightweight visualization positions (<= 6 pieces) from CSV on startup
let visualisationPositions = [];
function loadVisualisationFromCSV() {
  return new Promise((resolve) => {
    try {
      const CSV_PATH = path.join(__dirname, '../data/puzzles.csv');
      if (!fs.existsSync(CSV_PATH)) {
        console.log('[VIS] puzzles.csv not found, will use curated fallbacks');
        resolve();
        return;
      }
      const positions = [];
      fs.createReadStream(CSV_PATH)
        .pipe(csv())
        .on('data', (row) => {
          try {
            const fen = row.FEN || row.fen;
            if (!fen) return;
            const chess = new Chess(fen);
            if (chess.isCheckmate() || chess.isStalemate()) return;
            const pieceCount = fen.split(' ')[0].replace(/\//g,'').replace(/\d/g,'').length;
            if (pieceCount <= 6 && chess.moves().length > 0) {
              positions.push(fen);
            }
          } catch (_) {
            // skip invalid rows
          }
        })
        .on('end', () => {
          visualisationPositions = positions;
          console.log(`[VIS] Loaded ${visualisationPositions.length} <=6-piece positions from CSV`);
          resolve();
        })
        .on('error', (err) => {
          console.error('[VIS] CSV load error:', err.message);
          resolve();
        });
    } catch (e) {
      console.error('[VIS] Unexpected CSV load error:', e.message);
      resolve();
    }
  });
}

loadVisualisationFromCSV().catch(()=>{});

// util to count material
router.get('/random', auth, premium, async (req,res)=>{
  try{
    console.log('Visualisation route called');
    
    // Try to get pawn endgame position from database first
    try {
      const totalPositions = await VisualizationPosition.countDocuments();
      console.log(`Total pawn endgame positions in database: ${totalPositions}`);
      
      if (totalPositions > 0) {
        const randomIndex = Math.floor(Math.random() * totalPositions);
        const visPos = await VisualizationPosition.findOne().skip(randomIndex);
        
        if (visPos) {
          console.log(`Selected pawn endgame position: ${visPos.fen}`);
          return res.json({ 
            fen: visPos.fen,
            rating: visPos.rating,
            themes: visPos.themes,
            puzzleId: visPos.puzzleId
          });
        }
      }
    } catch (dbError) {
      console.log('Database error, falling back to CSV:', dbError.message);
    }
    
    // Fallback to CSV-sourced minimal positions if available
    if (visualisationPositions.length > 0) {
      const fen = visualisationPositions[Math.floor(Math.random() * visualisationPositions.length)];
      return res.json({ fen });
    }

    // Final fallback curated minimal positions (<= 6 pieces)
    const curated = [
      '8/8/4k3/8/8/3K4/8/6Q1 w - - 0 1',
      '8/8/4k3/8/8/3K4/8/6R1 w - - 0 1',
      '8/8/4k3/8/2P5/2K5/8/8 w - - 0 1',
      '8/8/4k3/8/2B5/2K5/8/8 w - - 0 1',
      '8/8/4k3/8/2N5/2K5/8/8 w - - 0 1',
      '6k1/8/6K1/8/8/8/8/8 w - - 0 1'
    ];
    const fen = curated[Math.floor(Math.random() * curated.length)];
    return res.json({ fen });
    
  }catch(e){
    console.error('Visualisation route error:', e);
    res.status(500).json({message:'Server error'});
  }
});

// POST /api/visualisation/stats
router.post('/stats', auth, async (req, res) => {
  try {
    const { solved, puzzleRating } = req.body;
    console.log('Visualisation stats update - solved:', solved, 'puzzleRating:', puzzleRating);
    
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    // Initialize all rating fields if they don't exist
    initializeUserRatings(user);
    
    const ratingValue = parseInt(puzzleRating) || 1200;
    
    // Update user rating using utility function
    const ratingResult = await updateUserRating(req.user.id, 'visualisationRating', ratingValue, solved);
    
    console.log('New visualisation rating:', ratingResult.newRating);
    
    res.json({ newRating: ratingResult.newRating, ratingChange: ratingResult.ratingChange });
  } catch (err) {
    console.error('Error updating visualisation rating:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 