const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();
const { Chess } = require('chess.js');
const PGNParser = require('pgn-parser');

const GAMES_DIR = path.join(__dirname, '../data');

// Skill level mapping
const SKILL_LEVELS = {
  'beginner': 'beginner_games.pgn',
  'intermediate': 'intermediate_games.pgn',
  'master': 'master_games.pgn'
};

// Get available skill levels
router.get('/levels', (req, res) => {
  res.json({ 
    levels: Object.keys(SKILL_LEVELS),
    descriptions: {
      beginner: 'Games from players rated 800-1200',
      intermediate: 'Games from players rated 1200-1800', 
      master: 'Games from players rated 2000+'
    }
  });
});

// Get games for a specific skill level
router.get('/:level/games', (req, res) => {
  const { level } = req.params;
  const filename = SKILL_LEVELS[level];
  
  if (!filename) {
    return res.status(400).json({ error: 'Invalid skill level' });
  }

  const filePath = path.join(GAMES_DIR, filename);
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) return res.status(404).json({ error: 'Games not found' });
    
    const games = parseGamesFromPGN(data);
    const gameList = games.map((g, idx) => ({
      index: idx,
      event: g.headers.find(h => h.name === 'Event')?.value || '',
      white: g.headers.find(h => h.name === 'White')?.value || '',
      black: g.headers.find(h => h.name === 'Black')?.value || '',
      year: g.headers.find(h => h.name === 'Date')?.value?.split('.')?.[0] || '',
      round: g.headers.find(h => h.name === 'Round')?.value || '',
      eco: g.headers.find(h => h.name === 'ECO')?.value || '',
      result: g.headers.find(h => h.name === 'Result')?.value || '',
      whiteElo: g.headers.find(h => h.name === 'WhiteElo')?.value || '',
      blackElo: g.headers.find(h => h.name === 'BlackElo')?.value || '',
      plyCount: g.headers.find(h => h.name === 'PlyCount')?.value || ''
    }));
    
    res.json({ 
      level,
      games: gameList,
      totalGames: gameList.length
    });
  });
});

// Get a specific game for training
router.get('/:level/games/:gameIndex', (req, res) => {
  const { level, gameIndex } = req.params;
  const filename = SKILL_LEVELS[level];
  
  if (!filename) {
    return res.status(400).json({ error: 'Invalid skill level' });
  }

  const filePath = path.join(GAMES_DIR, filename);
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) return res.status(404).json({ error: 'Games not found' });
    
    const games = parseGamesFromPGN(data);
    const idx = parseInt(gameIndex, 10);
    
    if (!games[idx]) return res.status(404).json({ error: 'Game not found' });
    
    const game = games[idx];
    const moves = game.moves.map(m => m.move);
    
    res.json({
      level,
      gameIndex: idx,
      headers: game.headers,
      moves,
      totalMoves: moves.length
    });
  });
});

// Training session: Get position and check move
router.post('/:level/games/:gameIndex/train', (req, res) => {
  const { level, gameIndex } = req.params;
  const { moveHistory, userMove, position } = req.body;
  
  const filename = SKILL_LEVELS[level];
  if (!filename) {
    return res.status(400).json({ error: 'Invalid skill level' });
  }

  const filePath = path.join(GAMES_DIR, filename);
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) return res.status(404).json({ error: 'Games not found' });
    
    const games = parseGamesFromPGN(data);
    const idx = parseInt(gameIndex, 10);
    
    if (!games[idx]) return res.status(404).json({ error: 'Game not found' });
    
    const moves = games[idx].moves.map(m => m.move);
    const chess = new Chess(position || 'start');
    
    // Apply move history to get to current position
    for (const move of moveHistory) {
      try {
        chess.move(move, { sloppy: true });
      } catch (e) {
        return res.status(400).json({ error: 'Invalid move history' });
      }
    }
    
    const currentMoveIndex = moveHistory.length;
    const correctMove = moves[currentMoveIndex];
    
    if (!correctMove) {
      return res.json({
        completed: true,
        message: 'Game completed!'
      });
    }
    
    let isCorrect = false;
    let feedback = '';
    
    if (userMove === correctMove) {
      isCorrect = true;
      feedback = 'Excellent move!';
      chess.move(userMove, { sloppy: true });
    } else {
      feedback = `The correct move was ${correctMove}`;
      chess.move(correctMove, { sloppy: true });
    }
    
    res.json({
      isCorrect,
      feedback,
      correctMove,
      currentFen: chess.fen(),
      nextMoveIndex: currentMoveIndex + 1,
      totalMoves: moves.length,
      progress: Math.round(((currentMoveIndex + 1) / moves.length) * 100)
    });
  });
});

// Get training statistics for a skill level
router.get('/:level/stats', (req, res) => {
  const { level } = req.params;
  const filename = SKILL_LEVELS[level];
  
  if (!filename) {
    return res.status(400).json({ error: 'Invalid skill level' });
  }

  const filePath = path.join(GAMES_DIR, filename);
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) return res.status(404).json({ error: 'Games not found' });
    
    const games = parseGamesFromPGN(data);
    const stats = {
      totalGames: games.length,
      averageMoves: 0,
      openings: {},
      results: { '1-0': 0, '0-1': 0, '1/2-1/2': 0 },
      averageElo: 0
    };
    
    let totalMoves = 0;
    let totalElo = 0;
    let eloCount = 0;
    
    games.forEach(game => {
      const moves = game.moves.length;
      totalMoves += moves;
      
      const result = game.headers.find(h => h.name === 'Result')?.value || '';
      if (stats.results.hasOwnProperty(result)) {
        stats.results[result]++;
      }
      
      const eco = game.headers.find(h => h.name === 'ECO')?.value || '';
      if (eco) {
        stats.openings[eco] = (stats.openings[eco] || 0) + 1;
      }
      
      const whiteElo = parseInt(game.headers.find(h => h.name === 'WhiteElo')?.value || '0');
      const blackElo = parseInt(game.headers.find(h => h.name === 'BlackElo')?.value || '0');
      
      if (whiteElo > 0) {
        totalElo += whiteElo;
        eloCount++;
      }
      if (blackElo > 0) {
        totalElo += blackElo;
        eloCount++;
      }
    });
    
    stats.averageMoves = Math.round(totalMoves / games.length);
    stats.averageElo = eloCount > 0 ? Math.round(totalElo / eloCount) : 0;
    
    res.json({ level, stats });
  });
});

// Helper: Parse all games in a PGN file
function parseGamesFromPGN(pgnContent) {
  try {
    const parsed = PGNParser.parse(pgnContent);
    return parsed;
  } catch (e) {
    console.error('Error parsing PGN:', e);
    return [];
  }
}

module.exports = router;
