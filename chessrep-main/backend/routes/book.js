const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
// const Opening = require('../models/Opening');
// const { Chess } = require('chess.js');

// Get book moves for a position
router.post('/', auth, async (req, res) => {
  try {
    const { fen } = req.body;

    if (!fen) {
      return res.status(400).json({ message: 'FEN string is required' });
    }

    // Create a chess instance to validate the position
    // const game = new Chess(fen);
    // if (game.isGameOver()) {
    //   return res.status(400).json({ message: 'Game is over' });
    // }

    // Find all openings that match the current position
    // const openings = await Opening.find({
    //   'moves.fen': fen
    // });

    // Extract and format book moves
    const bookMoves = openings.reduce((moves, opening) => {
      const position = opening.moves.find(m => m.fen === fen);
      if (position && position.nextMoves) {
        position.nextMoves.forEach(nextMove => {
          const existingMove = moves.find(m => m.move === nextMove.move);
          if (existingMove) {
            existingMove.frequency += nextMove.frequency;
            if (nextMove.explanation && !existingMove.explanation) {
              existingMove.explanation = nextMove.explanation;
            }
          } else {
            moves.push({
              move: nextMove.move,
              frequency: nextMove.frequency,
              explanation: nextMove.explanation,
              name: opening.name
            });
          }
        });
      }
      return moves;
    }, []);

    // Sort moves by frequency
    bookMoves.sort((a, b) => b.frequency - a.frequency);

    // Normalize frequencies
    const totalFrequency = bookMoves.reduce((sum, move) => sum + move.frequency, 0);
    bookMoves.forEach(move => {
      move.frequency = Math.round((move.frequency / totalFrequency) * 100);
    });

    res.json({ moves: bookMoves });
  } catch (error) {
    console.error('Error fetching book moves:', error);
    res.status(500).json({ message: 'Error fetching book moves' });
  }
});

// Add a new move to the book
router.post('/moves', auth, async (req, res) => {
  try {
    const { openingId, fen, move, explanation } = req.body;

    if (!openingId || !fen || !move) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // const opening = await Opening.findById(openingId);
    // if (!opening) {
    //   return res.status(404).json({ message: 'Opening not found' });
    // }

    // Find the position in the opening
    const position = opening.moves.find(m => m.fen === fen);
    if (!position) {
      return res.status(404).json({ message: 'Position not found in opening' });
    }

    // Add or update the move
    const existingMove = position.nextMoves.find(m => m.move === move);
    if (existingMove) {
      existingMove.frequency += 1;
      if (explanation) {
        existingMove.explanation = explanation;
      }
    } else {
      position.nextMoves.push({
        move,
        frequency: 1,
        explanation
      });
    }

    await opening.save();
    res.json({ message: 'Move added to book' });
  } catch (error) {
    console.error('Error adding move to book:', error);
    res.status(500).json({ message: 'Error adding move to book' });
  }
});

module.exports = router; 