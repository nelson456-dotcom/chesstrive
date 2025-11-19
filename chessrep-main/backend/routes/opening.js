// Opening explorer API endpoints

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Opening move schema
const openingMoveSchema = new mongoose.Schema({
  fen: String,
  move: String,
  san: String,
  uci: String,
  white: Number,
  draws: Number,
  black: Number,
  total: Number,
  averageRating: Number,
  eco: String,
  name: String,
  createdAt: { type: Date, default: Date.now }
});

const OpeningMove = mongoose.model('OpeningMove', openingMoveSchema);

// Get opening moves for a position
router.get('/moves', async (req, res) => {
  try {
    const { fen, limit = 10, minGames = 10 } = req.query;

    if (!fen) {
      return res.status(400).json({ error: 'FEN is required' });
    }

    const moves = await OpeningMove.find({
      fen: fen,
      total: { $gte: minGames }
    })
      .sort({ total: -1 })
      .limit(parseInt(limit));

    // Calculate win rates
    const movesWithStats = moves.map(move => ({
      ...move.toObject(),
      winRate: {
        white: (move.white / move.total * 100).toFixed(1),
        black: (move.black / move.total * 100).toFixed(1),
        draws: (move.draws / move.total * 100).toFixed(1)
      }
    }));

    res.json({
      success: true,
      moves: movesWithStats,
      total: moves.length
    });
  } catch (error) {
    console.error('Opening moves error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get opening statistics
router.get('/stats', async (req, res) => {
  try {
    const { fen } = req.query;

    if (!fen) {
      return res.status(400).json({ error: 'FEN is required' });
    }

    const stats = await OpeningMove.aggregate([
      { $match: { fen: fen } },
      {
        $group: {
          _id: null,
          totalGames: { $sum: '$total' },
          totalMoves: { $sum: 1 },
          averageRating: { $avg: '$averageRating' },
          mostPopular: { $max: '$total' }
        }
      }
    ]);

    res.json({
      success: true,
      stats: stats[0] || {
        totalGames: 0,
        totalMoves: 0,
        averageRating: 0,
        mostPopular: 0
      }
    });
  } catch (error) {
    console.error('Opening stats error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get ECO codes for a position
router.get('/eco', async (req, res) => {
  try {
    const { fen } = req.query;

    if (!fen) {
      return res.status(400).json({ error: 'FEN is required' });
    }

    const ecoCodes = await OpeningMove.find({
      fen: fen,
      eco: { $exists: true, $ne: null }
    })
      .select('eco name total')
      .sort({ total: -1 });

    res.json({ success: true, ecoCodes });
  } catch (error) {
    console.error('ECO codes error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Search openings by name
router.get('/search', async (req, res) => {
  try {
    const { q, limit = 20 } = req.query;

    if (!q) {
      return res.status(400).json({ error: 'Query is required' });
    }

    const openings = await OpeningMove.find({ name: { $regex: q, $options: 'i' } })
      .select('name eco total averageRating')
      .sort({ total: -1 })
      .limit(parseInt(limit));

    res.json({ success: true, openings });
  } catch (error) {
    console.error('Opening search error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get popular openings
router.get('/popular', async (req, res) => {
  try {
    const { limit = 20, minGames = 100 } = req.query;

    const popularOpenings = await OpeningMove.aggregate([
      { $match: { total: { $gte: parseInt(minGames) } } },
      {
        $group: {
          _id: '$eco',
          name: { $first: '$name' },
          totalGames: { $sum: '$total' },
          averageRating: { $avg: '$averageRating' }
        }
      },
      { $sort: { totalGames: -1 } },
      { $limit: parseInt(limit) }
    ]);

    res.json({ success: true, openings: popularOpenings });
  } catch (error) {
    console.error('Popular openings error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Import opening data (admin only)
router.post('/import', async (req, res) => {
  try {
    const { moves } = req.body;

    if (!moves || !Array.isArray(moves)) {
      return res.status(400).json({ error: 'Moves array is required' });
    }

    // Clear existing data
    await OpeningMove.deleteMany({});

    // Insert new data
    const result = await OpeningMove.insertMany(moves);

    res.json({ success: true, imported: result.length });
  } catch (error) {
    console.error('Import error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;




















































