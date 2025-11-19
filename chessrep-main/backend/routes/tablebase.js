// Syzygy tablebase API endpoints

const express = require('express');
const router = express.Router();
const { spawn } = require('child_process');
const path = require('path');

// Tablebase process
let tablebaseProcess = null;

// Initialize tablebase
const initTablebase = () => {
  if (!tablebaseProcess) {
    const tablebasePath = path.join(__dirname, '../engines/syzygy');
    tablebaseProcess = spawn(tablebasePath);

    tablebaseProcess.stdout.on('data', (data) => {
      console.log('Tablebase output:', data.toString());
    });

    tablebaseProcess.stderr.on('data', (data) => {
      console.error('Tablebase error:', data.toString());
    });

    tablebaseProcess.on('close', (code) => {
      console.log('Tablebase process exited with code', code);
      tablebaseProcess = null;
    });
  }
};

// Query tablebase for a position
router.post('/query', async (req, res) => {
  try {
    const { fen } = req.body;

    if (!fen) {
      return res.status(400).json({ error: 'FEN is required' });
    }

    // Initialize tablebase if not already done
    if (!tablebaseProcess) {
      initTablebase();
    }

    // Send query to tablebase
    tablebaseProcess.stdin.write(`query ${fen}\n`);

    // Collect results
    const result = await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Tablebase query timeout'));
      }, 5000);

      let output = '';
      tablebaseProcess.stdout.on('data', (data) => {
        output += data.toString();

        // Parse tablebase result
        if (output.includes('WDL:') || output.includes('DTZ:') || output.includes('DTM:')) {
          clearTimeout(timeout);

          const wdlMatch = output.match(/WDL: (-?\d+)/);
          const dtzMatch = output.match(/DTZ: (-?\d+)/);
          const dtmMatch = output.match(/DTM: (-?\d+)/);

          const moves = [];
          const moveMatches = output.match(/(\w+): WDL:(-?\d+) DTZ:(-?\d+) DTM:(-?\d+)/g);
          if (moveMatches) {
            moveMatches.forEach(match => {
              const parts = match.split(' ');
              const move = parts[0].replace(':', '');
              const wdl = parseInt(parts[1].split(':')[1]);
              const dtz = parseInt(parts[2].split(':')[1]);
              const dtm = parseInt(parts[3].split(':')[1]);

              moves.push({
                uci: move,
                san: move, // Would need to convert UCI to SAN
                wdl: wdl,
                dtz: dtz,
                dtm: dtm
              });
            });
          }

          resolve({
            category: wdlMatch ? (parseInt(wdlMatch[1]) > 0 ? 'win' : parseInt(wdlMatch[1]) < 0 ? 'loss' : 'draw') : 'unknown',
            wdl: wdlMatch ? parseInt(wdlMatch[1]) : 0,
            dtz: dtzMatch ? parseInt(dtzMatch[1]) : 0,
            dtm: dtmMatch ? parseInt(dtmMatch[1]) : 0,
            moves: moves
          });
        }
      });
    });

    res.json({ success: true, result });
  } catch (error) {
    console.error('Tablebase query error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get tablebase status
router.get('/status', (req, res) => {
  res.json({
    ready: tablebaseProcess !== null,
    processId: tablebaseProcess ? tablebaseProcess.pid : null
  });
});

// Check if position is in tablebase
router.post('/check', async (req, res) => {
  try {
    const { fen } = req.body;

    if (!fen) {
      return res.status(400).json({ error: 'FEN is required' });
    }

    // Count pieces in FEN
    const pieceCount = (fen.match(/[KQRBNP]/g) || []).length;

    // Tablebase typically covers positions with 7 or fewer pieces
    const inTablebase = pieceCount <= 7;

    res.json({ success: true, inTablebase, pieceCount });
  } catch (error) {
    console.error('Tablebase check error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get tablebase statistics
router.get('/stats', (req, res) => {
  res.json({
    success: true,
    stats: {
      totalPositions: 0, // Would be calculated from tablebase files
      maxPieces: 7,
      supportedEndgames: [
        'KQ vs K',
        'KR vs K',
        'KB vs K',
        'KN vs K',
        'KQ vs KQ',
        'KR vs KR',
        'KB vs KB',
        'KN vs KN'
      ]
    }
  });
});

module.exports = router;




















































