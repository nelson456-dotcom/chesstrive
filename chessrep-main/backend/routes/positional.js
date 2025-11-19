const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { Chess } = require('chess.js');

// Curated positional positions with strategic themes
const positionalPositions = [
  {
    id: 1,
    fen: 'rnbqkb1r/pppp1ppp/5n2/4p3/2B1P3/8/PPPP1PPP/RNBQK1NR w KQkq - 0 1',
    bestMove: 'Nf3',
    theme: 'Development',
    explanation: 'Develop the knight to control the center and prepare kingside castling. This is a fundamental principle in chess.',
    difficulty: 'beginner'
  },
  {
    id: 2,
    fen: 'rnbqkb1r/pppp1ppp/5n2/4p3/2B1P3/8/PPPP1PPP/RNBQK1NR w KQkq - 0 2',
    bestMove: 'd3',
    theme: 'Pawn Structure',
    explanation: 'Support the e4 pawn and prepare to develop the light-squared bishop. This creates a solid pawn structure.',
    difficulty: 'beginner'
  },
  {
    id: 3,
    fen: 'rnbqkb1r/pppp1ppp/5n2/4p3/2B1P3/8/PPPP1PPP/RNBQK1NR w KQkq - 0 3',
    bestMove: 'O-O',
    theme: 'King Safety',
    explanation: 'Castle early to ensure king safety. This is crucial in open positions.',
    difficulty: 'beginner'
  },
  {
    id: 4,
    fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/8/PPPP1PPP/RNBQK1NR w KQkq - 0 1',
    bestMove: 'Nc3',
    theme: 'Center Control',
    explanation: 'Develop the knight to control central squares and support the e4 pawn.',
    difficulty: 'intermediate'
  },
  {
    id: 5,
    fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/8/PPPP1PPP/RNBQK1NR w KQkq - 0 2',
    bestMove: 'd4',
    theme: 'Center Control',
    explanation: 'Challenge the center immediately with d4, gaining space and opening lines.',
    difficulty: 'intermediate'
  },
  {
    id: 6,
    fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/8/PPPP1PPP/RNBQK1NR w KQkq - 0 3',
    bestMove: 'Bxc6',
    theme: 'Piece Activity',
    explanation: 'Trade the bishop for the knight to damage Black\'s pawn structure and gain development.',
    difficulty: 'advanced'
  },
  {
    id: 7,
    fen: 'rnbqkb1r/ppp2ppp/3ppn2/8/2BPP3/8/PPP2PPP/RNBQK1NR w KQkq - 0 1',
    bestMove: 'Nf3',
    theme: 'Development',
    explanation: 'Develop the knight to control the center and prepare kingside castling.',
    difficulty: 'beginner'
  },
  {
    id: 8,
    fen: 'rnbqkb1r/ppp2ppp/3ppn2/8/2BPP3/8/PPP2PPP/RNBQK1NR w KQkq - 0 2',
    bestMove: 'c4',
    theme: 'Pawn Structure',
    explanation: 'Establish a strong pawn center with c4, controlling important central squares.',
    difficulty: 'intermediate'
  },
  {
    id: 9,
    fen: 'rnbqkb1r/ppp2ppp/3ppn2/8/2BPP3/8/PPP2PPP/RNBQK1NR w KQkq - 0 3',
    bestMove: 'Bd3',
    theme: 'Piece Placement',
    explanation: 'Develop the bishop to a more active square, supporting the center and preparing castling.',
    difficulty: 'intermediate'
  },
  {
    id: 10,
    fen: 'rnbqkb1r/ppp2ppp/3ppn2/8/2BPP3/8/PPP2PPP/RNBQK1NR w KQkq - 0 4',
    bestMove: 'O-O',
    theme: 'King Safety',
    explanation: 'Castle to ensure king safety and connect the rooks for better coordination.',
    difficulty: 'beginner'
  },
  {
    id: 11,
    fen: 'rnbqkb1r/pppp1ppp/5n2/4p3/2B1P3/8/PPPP1PPP/RNBQK1NR w KQkq - 0 4',
    bestMove: 'Bd3',
    theme: 'Piece Placement',
    explanation: 'Develop the bishop to a more active square, supporting the center.',
    difficulty: 'intermediate'
  },
  {
    id: 12,
    fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/8/PPPP1PPP/RNBQK1NR w KQkq - 0 4',
    bestMove: 'O-O',
    theme: 'King Safety',
    explanation: 'Castle early to ensure king safety in this open position.',
    difficulty: 'beginner'
  },
  {
    id: 13,
    fen: 'rnbqkb1r/ppp2ppp/3ppn2/8/2BPP3/8/PPP2PPP/RNBQK1NR w KQkq - 0 5',
    bestMove: 'c4',
    theme: 'Pawn Structure',
    explanation: 'Establish a strong pawn center with c4, controlling important central squares.',
    difficulty: 'intermediate'
  },
  {
    id: 14,
    fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/8/PPPP1PPP/RNBQK1NR w KQkq - 0 5',
    bestMove: 'Nc3',
    theme: 'Development',
    explanation: 'Develop the knight to control central squares and support the e4 pawn.',
    difficulty: 'intermediate'
  },
  {
    id: 15,
    fen: 'rnbqkb1r/pppp1ppp/5n2/4p3/2B1P3/8/PPPP1PPP/RNBQK1NR w KQkq - 0 5',
    bestMove: 'd3',
    theme: 'Pawn Structure',
    explanation: 'Support the e4 pawn and prepare to develop the light-squared bishop.',
    difficulty: 'beginner'
  }
];

// Get a random positional position
router.get('/random', auth, async (req, res) => {
  try {
    console.log('=== POSITIONAL TRAINER REQUEST ===');
    console.log('Request received for positional position');
    console.log('User ID:', req.user.id);
    
    const { theme } = req.query;
    console.log('Requested theme:', theme);
    
    let filteredPositions = positionalPositions;
    if (theme && theme !== 'all') {
      filteredPositions = positionalPositions.filter(pos => 
        pos.theme.toLowerCase() === theme.toLowerCase()
      );
    }
    
    console.log('Total positions available:', positionalPositions.length);
    console.log('Filtered positions:', filteredPositions.length);
    
    if (filteredPositions.length === 0) {
      console.log('No positions match theme, using all positions');
      filteredPositions = positionalPositions; // Fallback to all positions
    }
    
    const randomPosition = filteredPositions[Math.floor(Math.random() * filteredPositions.length)];
    
    console.log('Selected position:', randomPosition);
    console.log('Position FEN:', randomPosition.fen);
    console.log('Best move:', randomPosition.bestMove);
    
    res.json({
      id: randomPosition.id,
      fen: randomPosition.fen,
      bestMove: randomPosition.bestMove,
      theme: randomPosition.theme,
      explanation: randomPosition.explanation,
      difficulty: randomPosition.difficulty
    });
    
    console.log('=== POSITIONAL TRAINER RESPONSE SENT ===');
    
  } catch (error) {
    console.error('Error getting positional position:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Validate a move in a positional position
router.post('/validate', auth, async (req, res) => {
  try {
    const { fen, move, bestMove } = req.body;
    
    if (!fen || !move || !bestMove) {
      return res.status(400).json({ 
        success: false, 
        message: 'FEN, move, and bestMove are required' 
      });
    }
    
    const chess = new Chess(fen);
    
    // Check if the move is legal
    const legalMoves = chess.moves();
    const isLegal = legalMoves.some(m => m.san === move || m.uci === move);
    
    if (!isLegal) {
      return res.json({
        success: true,
        correct: false,
        message: 'Illegal move'
      });
    }
    
    // Check if the move matches the best move
    const isCorrect = move === bestMove;
    
    res.json({
      success: true,
      correct: isCorrect,
      message: isCorrect ? 'Excellent strategic move!' : 'Not the best strategic move'
    });
    
  } catch (error) {
    console.error('Error validating positional move:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Get available themes
router.get('/themes', auth, async (req, res) => {
  try {
    const themes = [...new Set(positionalPositions.map(pos => pos.theme))];
    res.json({
      success: true,
      themes: themes
    });
  } catch (error) {
    console.error('Error getting themes:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router;
