const express = require('express');
const router = express.Router();
const optionalAuth = require('../middleware/optionalAuth');
const { spawn } = require('child_process');
const path = require('path');
const { Chess } = require('chess.js');
const { ratingToLevel, levelToEngineParams } = require('../utils/botLevels');

// Bot personalities and their move selection strategies
const botPersonalities = {
  aggressive: {
    name: 'Aggressive',
    description: 'Prefers attacking moves and sacrifices',
    moveWeight: 0.7 // Higher weight for attacking moves
  },
  defensive: {
    name: 'Defensive',
    description: 'Focuses on solid, defensive play',
    moveWeight: 0.3 // Lower weight for attacking moves
  },
  positional: {
    name: 'Positional',
    description: 'Plays for long-term advantages',
    moveWeight: 0.5 // Balanced approach
  },
  tactical: {
    name: 'Tactical',
    description: 'Looks for tactical opportunities',
    moveWeight: 0.6 // Slightly higher for tactical moves
  }
};

const resolveEngineParams = ({ rating, level, engineParams: overrides }) => {
  const numericRating = Number.isFinite(Number(rating)) ? Number(rating) : 0;
  const derivedLevel = level || ratingToLevel(numericRating);
  const baseParams = levelToEngineParams(derivedLevel);
  const safeOverrides =
    overrides && typeof overrides === 'object' && !Array.isArray(overrides) ? overrides : {};

  const merged = {
    ...baseParams,
    ...safeOverrides
  };

  merged.level = baseParams.level;
  merged.levelIndex = baseParams.levelIndex;
  merged.canonicalRating =
    safeOverrides.canonicalRating ?? baseParams.canonicalRating ?? (numericRating || 1200);
  merged.appliedRating = numericRating || merged.canonicalRating;

  if (typeof merged.moveTimeMs !== 'number' || merged.moveTimeMs <= 0) {
    merged.moveTimeMs = 400;
  }

  return merged;
};

// Convert UCI string (e2e4, e7e8q) to SAN using chess.js
function uciToSan(chess, uciMove) {
  if (!uciMove || uciMove.length < 4) return null;
  const from = uciMove.slice(0, 2);
  const to = uciMove.slice(2, 4);
  const promotion = uciMove.length > 4 ? uciMove[4] : undefined;
  const move = chess.move({ from, to, promotion }, { sloppy: true });
  return move ? move.san : null;
}

// Ask Stockfish for a move with level-based scaling
async function getStockfishMove(fen, engineParams, personality) {
  return new Promise((resolve, reject) => {
    const {
      canonicalRating,
      appliedRating,
      moveTimeMs,
      depth,
      nodes,
      skillLevel,
      uciLimitStrength,
      uciElo,
      level
    } = engineParams;
    const targetElo = Math.max(
      800,
      Math.min(2800, Math.round(canonicalRating || appliedRating || 1200))
    );
    const movetime = Math.max(50, Math.round(moveTimeMs || 400));
    const searchDepth = typeof depth === 'number' && depth > 0 ? Math.round(depth) : null;
    const nodeCap = typeof nodes === 'number' && nodes > 0 ? Math.round(nodes) : null;
    const limitStrength = uciLimitStrength !== false;
    const skill = Math.max(0, Math.min(20, Math.round(typeof skillLevel === 'number' ? skillLevel : 20)));
    const limitedElo = Math.max(800, Math.min(2800, Math.round(uciElo || targetElo)));
    const stockfishPath = path.join(__dirname, '../engines/stockfish.exe');
    const engine = spawn(stockfishPath);

    let bestUci = null;
    let closed = false;

    const finish = (err, result) => {
      if (closed) return;
      closed = true;
      try { engine.stdin.write('quit\n'); } catch (_) {}
      try { engine.kill(); } catch (_) {}
      if (err) reject(err); else resolve(result);
    };

    // Safety timeout - scale with configured move time
    const timeout = setTimeout(
      () => finish(new Error('Engine timeout')),
      Math.max(8000, movetime * 4)
    );

    engine.stdout.on('data', (data) => {
      const out = data.toString();
      console.log('[Stockfish bot]:', out.trim());
      const m = out.match(/bestmove\s+([a-h][1-8][a-h][1-8][qrbn]?)/);
      if (m) {
        bestUci = m[1];
        clearTimeout(timeout);
        finish(null, {
          bestUci,
          elo: targetElo,
          movetime,
          depth: searchDepth,
          nodes: nodeCap
        });
      }
    });

    engine.stderr.on('data', (d) => {
      console.error('[Stockfish bot stderr]:', d.toString());
    });

    engine.on('error', (err) => {
      clearTimeout(timeout);
      finish(err);
    });

    // Configure engine based on derived level parameters
    engine.stdin.write('uci\n');
    engine.stdin.write('setoption name Hash value 256\n'); // More memory for better play
    engine.stdin.write('setoption name Threads value 2\n'); // Use 2 threads for faster/stronger analysis
    
    if (limitStrength) {
      console.log(`[Stockfish] Using LIMITED strength for Elo ${limitedElo} (level ${level})`);
      engine.stdin.write('setoption name UCI_LimitStrength value true\n');
      engine.stdin.write(`setoption name UCI_Elo value ${limitedElo}\n`);
      engine.stdin.write(`setoption name Skill Level value ${skill}\n`);
      engine.stdin.write('setoption name Contempt value 0\n');
    } else {
      console.log(`[Stockfish] Using FULL STRENGTH for level ${level}`);
      engine.stdin.write('setoption name UCI_LimitStrength value false\n');
      engine.stdin.write(`setoption name Skill Level value ${skill}\n`);
      if (personality === 'aggressive') {
        engine.stdin.write('setoption name Contempt value 50\n');
      } else if (personality === 'defensive') {
        engine.stdin.write('setoption name Contempt value -50\n');
      } else {
        engine.stdin.write('setoption name Contempt value 0\n');
      }
    }
    
    engine.stdin.write('isready\n');
    engine.stdin.write(`position fen ${fen}\n`);
    
    const goArgs = [];
    if (searchDepth) {
      goArgs.push(`depth ${searchDepth}`);
    }
    if (nodeCap) {
      goArgs.push(`nodes ${nodeCap}`);
    }
    if (movetime) {
      goArgs.push(`movetime ${movetime}`);
    }

    engine.stdin.write(`go ${goArgs.join(' ').trim()}\n`);
  });
}

// Strong bot move generation for high difficulty fallback
const generateStrongBotMove = (chess, engineParams, personality) => {
  console.log('=== GENERATE STRONG BOT MOVE (FALLBACK) ===');
  const difficulty = engineParams?.canonicalRating ?? engineParams?.appliedRating ?? 2200;
  console.log('Difficulty:', difficulty);
  console.log('Personality:', personality);
  console.log('Current FEN:', chess.fen());
  
  const legalMoves = chess.moves({ verbose: true });
  console.log('Legal moves found:', legalMoves.length);
  
  if (legalMoves.length === 0) {
    console.log('No legal moves available');
    return null;
  }
  
  // For high difficulty, use much stronger evaluation
  let bestMove = null;
  let bestScore = -Infinity;
  
  console.log('Evaluating moves with STRONG evaluation...');
  for (const move of legalMoves) {
    const tempChess = new Chess(chess.fen());
    tempChess.move(move);
    
    // Much stronger evaluation
    let score = evaluatePositionStrong(tempChess);
    
    // Strong tactical bonuses
    if (move.captured) {
      score += 100; // Capturing is good
    }
    if (move.flags.includes('c')) {
      score += 50; // Castling is good
    }
    if (move.flags.includes('e')) {
      score += 30; // En passant is good
    }
    if (move.flags.includes('p')) {
      score += 200; // Promotion is very good
    }
    
    // Check for tactical patterns
    if (isTacticalMove(move, chess)) {
      score += 150;
    }
    
    // Minimal randomness for high difficulty
    const randomnessBaseline = Math.max(0, Math.min(1, engineParams?.randomness ?? 0.02));
    const randomness = Math.random() * Math.max(5, 10 * randomnessBaseline);
    score += randomness;
    
    console.log(`Strong move ${move.san}: score = ${score}`);
    
    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }
  
  const finalMove = bestMove || legalMoves[0];
  console.log('Final STRONG move selected:', finalMove.san);
  console.log('=== END GENERATE STRONG BOT MOVE ===');
  
  return finalMove;
};

// Simple bot move generation based on difficulty and personality
const generateBotMove = (chess, engineParams, personality) => {
  console.log('=== GENERATE BOT MOVE ===');
  const difficulty = engineParams?.canonicalRating ?? engineParams?.appliedRating ?? 1200;
  const randomnessChance = Math.max(0, Math.min(0.9, engineParams?.randomness ?? 0.1));
  console.log('Difficulty:', difficulty);
  console.log('Randomness chance:', randomnessChance);
  console.log('Personality:', personality);
  console.log('Current FEN:', chess.fen());
  
  const legalMoves = chess.moves({ verbose: true });
  console.log('Legal moves found:', legalMoves.length);
  console.log('Legal moves:', legalMoves.map(m => m.san));
  
  if (legalMoves.length === 0) {
    console.log('No legal moves available');
    return null;
  }
  
  // For very easy difficulty or high randomness, make occasional random moves
  if (difficulty <= 900 || Math.random() < randomnessChance) {
    const randomMove = legalMoves[Math.floor(Math.random() * legalMoves.length)];
    console.log('Easy difficulty - random move selected:', randomMove.san);
    return randomMove;
  }
  
  // For higher difficulties, use some basic evaluation
  let bestMove = null;
  let bestScore = -Infinity;
  
  console.log('Evaluating moves for higher difficulty...');
  for (const move of legalMoves) {
    const tempChess = new Chess(chess.fen());
    tempChess.move(move);
    
    // Simple evaluation based on material and position
    let score = evaluatePosition(tempChess);
    
    // Adjust score based on personality
    if (personality === 'aggressive' && isAttackingMove(move, chess)) {
      score += 50;
    } else if (personality === 'defensive' && isDefensiveMove(move, chess)) {
      score += 30;
    }
    
    // Add some randomness scaled by configured randomness and difficulty gap
    const difficultyScale = Math.max(0, 2200 - Math.min(difficulty, 2200));
    const randomnessMagnitude = difficultyScale / 40 * (0.5 + randomnessChance);
    score += Math.random() * randomnessMagnitude;
    
    console.log(`Move ${move.san}: score = ${score}`);
    
    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }
  
  const finalMove = bestMove || legalMoves[0];
  console.log('Final move selected:', finalMove.san);
  console.log('=== END GENERATE BOT MOVE ===');
  
  return finalMove;
};

// Strong position evaluation for high difficulty
const evaluatePositionStrong = (chess) => {
  let score = 0;
  const board = chess.board();
  
  // Material evaluation
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      const piece = board[i][j];
      if (piece) {
        const pieceValue = {
          'p': 1, 'n': 3, 'b': 3, 'r': 5, 'q': 9, 'k': 0
        }[piece.type] || 0;
        
        score += piece.color === 'w' ? pieceValue : -pieceValue;
      }
    }
  }
  
  // Position evaluation bonuses
  if (chess.in_check()) {
    score += chess.turn() === 'w' ? -50 : 50; // Being in check is bad
  }
  
  if (chess.in_checkmate()) {
    score += chess.turn() === 'w' ? -1000 : 1000; // Checkmate is very bad
  }
  
  // Center control bonus
  const centerSquares = ['d4', 'd5', 'e4', 'e5'];
  for (const square of centerSquares) {
    const piece = chess.get(square);
    if (piece) {
      score += piece.color === 'w' ? 10 : -10;
    }
  }
  
  return score;
};

// Check if move is tactical
const isTacticalMove = (move, chess) => {
  // Check for tactical patterns
  if (move.captured) return true;
  if (move.san.includes('+')) return true; // Check
  if (move.san.includes('#')) return true; // Checkmate
  if (move.san.includes('x')) return true; // Capture
  
  // Check if move creates threats
  const tempChess = new Chess(chess.fen());
  tempChess.move(move);
  return tempChess.in_check();
};

// Simple position evaluation
const evaluatePosition = (chess) => {
  const fen = chess.fen();
  const pieces = fen.split(' ')[0];
  
  let score = 0;
  const pieceValues = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
  
  for (let i = 0; i < pieces.length; i++) {
    const char = pieces[i];
    if (char === '/') continue;
    
    if (char >= '1' && char <= '8') {
      i += parseInt(char) - 1;
      continue;
    }
    
    const value = pieceValues[char.toLowerCase()] || 0;
    score += char === char.toUpperCase() ? value : -value;
  }
  
  return score;
};

// Check if move is attacking
const isAttackingMove = (move, chess) => {
  return move.captured || move.san.includes('+') || move.san.includes('#');
};

// Check if move is defensive
const isDefensiveMove = (move, chess) => {
  return move.san.includes('O-O') || move.san.includes('O-O-O') || 
         move.to && chess.moves({ verbose: true }).some(m => m.captured && m.to === move.to);
};

// Make a bot move
router.post('/move', optionalAuth, async (req, res) => {
  try {
    console.log('=== BOT MOVE REQUEST ===');
    console.log('Request received for bot move');
    if (req.user && req.user.id) console.log('User ID:', req.user.id);
    
    const {
      fen,
      difficulty,
      rating: ratingOverride,
      level,
      engineParams: engineParamsOverride,
      personality = 'positional',
      timeControl
    } = req.body;
    const rating = Number.isFinite(Number(ratingOverride))
      ? Number(ratingOverride)
      : Number.isFinite(Number(difficulty))
        ? Number(difficulty)
        : 1200;
    const resolvedEngineParams = resolveEngineParams({
      rating,
      level,
      engineParams: engineParamsOverride
    });
    console.log('Request body:', {
      fen,
      rating,
      level: resolvedEngineParams.level,
      personality,
      timeControl
    });
    console.log('Resolved engine params:', resolvedEngineParams);
    
    if (!fen) {
      console.log('ERROR: No FEN provided');
      return res.status(400).json({ 
        success: false, 
        message: 'FEN is required' 
      });
    }
    
    console.log('Creating chess object with FEN:', fen);
    const chess = new Chess(fen);
    console.log('Chess object created successfully');
    
    if (chess.isGameOver()) {
      console.log('Game is over, returning game over status');
      return res.json({
        success: true,
        gameOver: true,
        result: chess.isCheckmate() ? 'checkmate' : 
                chess.isDraw() ? 'draw' : 
                chess.isStalemate() ? 'stalemate' : 'resignation'
      });
    }
    
    // Try Stockfish first - FORCE IT TO WORK FOR HIGH DIFFICULTY
    let sanMove = null;
    try {
      console.log('Generating bot move via Stockfish...');
      console.log('Resolved difficulty:', resolvedEngineParams.canonicalRating);
      
      // For high difficulty (2000+), retry Stockfish multiple times if it fails
      let attempts = 0;
      const highLevel = resolvedEngineParams.canonicalRating >= 2000 || resolvedEngineParams.levelIndex >= 4;
      const maxAttempts = highLevel ? 3 : 1;
      
      while (attempts < maxAttempts && !sanMove) {
        attempts++;
        console.log(`Stockfish attempt ${attempts}/${maxAttempts}`);
        
        try {
          const { bestUci, elo, movetime } = await getStockfishMove(
            fen,
            resolvedEngineParams,
            personality
          );
          console.log('Stockfish bestmove (UCI):', bestUci, 'Elo:', elo, 'movetime:', movetime);
          
          if (bestUci) {
            const temp = new Chess(fen);
            sanMove = uciToSan(temp, bestUci);
            if (sanMove) {
              console.log('✅ Stockfish move converted successfully:', sanMove);
              break;
            } else {
              console.warn('Failed to convert UCI to SAN, retrying...');
            }
          }
        } catch (e) {
          console.error(`Stockfish attempt ${attempts} failed:`, e.message);
          if (attempts < maxAttempts) {
            console.log('Retrying Stockfish...');
            await new Promise(resolve => setTimeout(resolve, 500)); // Wait 500ms before retry
          }
        }
      }
      
      if (!sanMove && highLevel) {
        console.error('❌ CRITICAL: Stockfish failed for high difficulty! This should not happen.');
        throw new Error('Stockfish failed for high difficulty - this is unacceptable');
      }
    } catch (e) {
      console.error('Stockfish failed completely:', e.message);
    }

    let botMove = null;
    if (sanMove) {
      // Use SAN move
      botMove = { san: sanMove };
    } else {
      // Fallback - but make it much stronger for high difficulty
      console.log('⚠️ Using fallback move generation');
      if (resolvedEngineParams.canonicalRating >= 2000 || resolvedEngineParams.levelIndex >= 4) {
        console.log('❌ WARNING: Using fallback for high difficulty - this should not happen!');
        // For high difficulty, try to use a stronger fallback
        botMove = generateStrongBotMove(chess, resolvedEngineParams, personality);
      } else {
        botMove = generateBotMove(chess, resolvedEngineParams, personality);
      }
    }
    console.log('Bot move selected:', botMove);
    
    if (!botMove) {
      console.log('No bot move available, game is stalemate');
      return res.json({
        success: true,
        gameOver: true,
        result: 'stalemate'
      });
    }
    
    console.log('Executing bot move:', botMove.san);
    // Accept SAN or verbose
    const executed = chess.move(botMove.san || botMove, { sloppy: true });
    if (!executed) {
      console.warn('SAN move execution failed, attempting fallback on raw value');
      chess.move(botMove, { sloppy: true });
    }
    console.log('Bot move executed successfully');
    
    console.log('Bot making move:', botMove.san, 'from position:', fen);
    console.log('New FEN after move:', chess.fen());
    
    res.json({
      success: true,
      move: (executed && executed.san) || botMove.san || null,
      fen: chess.fen(),
      gameOver: chess.isGameOver(),
      result: chess.isGameOver() ? 
        (chess.isCheckmate() ? 'checkmate' : 
         chess.isDraw() ? 'draw' : 
         chess.isStalemate() ? 'stalemate' : 'resignation') : null
    });
    
    console.log('=== BOT MOVE RESPONSE SENT ===');
    
  } catch (error) {
    console.error('Error making bot move:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Get bot personalities
router.get('/personalities', optionalAuth, async (req, res) => {
  try {
    res.json({
      success: true,
      personalities: botPersonalities
    });
  } catch (error) {
    console.error('Error getting bot personalities:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Analyze a game position
router.post('/analyze', optionalAuth, async (req, res) => {
  try {
    const { fen } = req.body;
    
    if (!fen) {
      return res.status(400).json({ 
        success: false, 
        message: 'FEN is required' 
      });
    }
    
    const chess = new Chess(fen);
    const evaluation = evaluatePosition(chess);
    
    res.json({
      success: true,
      evaluation: evaluation,
      isCheck: chess.isCheck(),
      isCheckmate: chess.isCheckmate(),
      isDraw: chess.isDraw(),
      isStalemate: chess.isStalemate()
    });
    
  } catch (error) {
    console.error('Error analyzing position:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router;
