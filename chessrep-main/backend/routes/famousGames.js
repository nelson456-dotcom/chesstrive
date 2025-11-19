const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();
const { Chess } = require('chess.js');
const PGNParser = require('pgn-parser');
const auth = require('../middleware/auth');
const premium = require('../middleware/premium');

const GAMES_DIR = path.join(__dirname, '../data');

// List available PGN files
router.get('/', (req, res) => {
  fs.readdir(GAMES_DIR, (err, files) => {
    if (err) return res.status(500).json({ error: 'Failed to list games' });
    const pgnFiles = files.filter(f => f.endsWith('.pgn'));
    res.json({ games: pgnFiles });
  });
});

// Get all games from all files at once (for faster loading)
router.get('/all', (req, res) => {
  fs.readdir(GAMES_DIR, (err, files) => {
    if (err) return res.status(500).json({ error: 'Failed to list games' });
    
    const pgnFiles = files.filter(f => f.endsWith('.pgn'));
    let allGames = [];
    let processedFiles = 0;
    
    if (pgnFiles.length === 0) {
      return res.json({ games: [] });
    }
    
    pgnFiles.forEach(filename => {
      const filePath = path.join(GAMES_DIR, filename);
      fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
          console.error(`Error reading ${filename}:`, err);
        } else {
          const games = parseGamesFromPGN(data);
          const gameList = games.map((g, idx) => ({
            index: idx,
            file: filename,
            event: g.headers.find(h => h.name === 'Event')?.value || '',
            white: g.headers.find(h => h.name === 'White')?.value || '',
            black: g.headers.find(h => h.name === 'Black')?.value || '',
            year: g.headers.find(h => h.name === 'Date')?.value?.split('.')?.[0] || '',
            round: g.headers.find(h => h.name === 'Round')?.value || '',
            eco: g.headers.find(h => h.name === 'ECO')?.value || '',
            result: g.headers.find(h => h.name === 'Result')?.value || '',
          }));
          allGames = allGames.concat(gameList);
        }
        
        processedFiles++;
        if (processedFiles === pgnFiles.length) {
          // Sort games by year (newest first)
          allGames.sort((a, b) => parseInt(b.year) - parseInt(a.year));
          res.json({ games: allGames });
        }
      });
    });
  });
});

// Fetch content of a selected PGN file
router.get('/:filename', (req, res) => {
  const { filename } = req.params;
  if (!filename.endsWith('.pgn')) return res.status(400).json({ error: 'Invalid file type' });
  const filePath = path.join(GAMES_DIR, filename);
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) return res.status(404).json({ error: 'Game not found' });
    res.type('text/plain').send(data);
  });
});

// Helper: Parse all games in a PGN file
function parseGamesFromPGN(pgnContent) {
  try {
    const parsed = PGNParser.parse(pgnContent);
    return parsed;
  } catch (e) {
    return [];
  }
}

// List all games in a PGN file (with metadata)
router.get('/:filename/games', (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(GAMES_DIR, filename);
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) return res.status(404).json({ error: 'Game not found' });
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
    }));
    res.json({ games: gameList });
  });
});

// Serve moves of a selected game
// NOTE: This endpoint is intentionally left public so all users can use Guess-the-Move
router.get('/:filename/games/:gameIndex', (req, res) => {
  const { filename, gameIndex } = req.params;
  const filePath = path.join(GAMES_DIR, filename);
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) return res.status(404).json({ error: 'Game not found' });
    const games = parseGamesFromPGN(data);
    const idx = parseInt(gameIndex, 10);
    if (!games[idx]) return res.status(404).json({ error: 'Game not found' });
    const moves = games[idx].moves.map(m => m.move);
    res.json({ moves });
  });
});

// Check user's guess for the next move
router.post('/:filename/games/:gameIndex/guess', auth, premium, (req, res) => {
  const { filename, gameIndex } = req.params;
  const { moveHistory, guess } = req.body; // moveHistory: ["e4", "e5", ...], guess: "Nf3"
  const filePath = path.join(GAMES_DIR, filename);
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) return res.status(404).json({ error: 'Game not found' });
    const games = parseGamesFromPGN(data);
    const idx = parseInt(gameIndex, 10);
    if (!games[idx]) return res.status(404).json({ error: 'Game not found' });
    const moves = games[idx].moves.map(m => m.move);
    const chess = new Chess();
    for (const m of moveHistory) {
      chess.move(m, { sloppy: true });
    }
    const correctMove = moves[moveHistory.length];
    let result = 'incorrect';
    if (guess === correctMove) {
      result = 'correct';
      chess.move(guess, { sloppy: true });
    } else {
      chess.move(correctMove, { sloppy: true });
    }
    res.json({
      result,
      correctMove,
      fen: chess.fen(),
      nextMoveIndex: moveHistory.length + 1
    });
  });
});

module.exports = router; 