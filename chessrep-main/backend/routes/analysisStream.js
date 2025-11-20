/**
 * Streaming Analysis Route
 * Provides WebSocket/SSE support for real-time Multi-PV analysis
 */

const express = require('express');
const router = express.Router();
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
function getStockfishPath() {
  if (process.platform === 'win32') {
    return path.join(__dirname, '../engines/stockfish.exe');
  }

  if (fs.existsSync('/usr/games/stockfish')) return '/usr/games/stockfish';
  if (fs.existsSync('/usr/bin/stockfish')) return '/usr/bin/stockfish';
  if (fs.existsSync('/usr/local/bin/stockfish')) return '/usr/local/bin/stockfish';
  return path.join(__dirname, '../engines/stockfish');
}

const { Chess } = require('chess.js');

// Store active analysis sessions
const activeAnalyses = new Map(); // analysisId -> { process, ws, config }

/**
 * WebSocket handler for streaming analysis
 * Called from server.js when WebSocket connection is established
 */
function handleAnalysisWebSocket(ws, req) {
  let currentAnalysisId = null;
  let analysisHandlerSet = false;

  // Set up message handler - only handles analysis messages
  // Store original message handler if it exists
  const originalMessageListeners = ws.listeners('message').slice();
  ws.removeAllListeners('message');

  // Add our analysis handler first
  ws.on('message', (message) => {
    try {
      console.log('📥 Backend: Received WebSocket message');
      const data = typeof message === 'string' ? JSON.parse(message) : message;
      console.log('📥 Backend: Parsed message type:', data.type);
      console.log('📥 Backend: Full message:', JSON.stringify(data, null, 2));

      // Only handle analysis messages
      if (data.type === 'start_analysis' || data.type === 'cancel_analysis') {
        console.log('📥 Backend: Handling analysis message:', data.type);
        if (data.type === 'start_analysis') {
          // Cancel previous analysis if any
          if (currentAnalysisId && activeAnalyses.has(currentAnalysisId)) {
            cancelAnalysis(currentAnalysisId);
          }

          currentAnalysisId = data.analysisId;
          console.log('📥 Backend: Starting analysis with ID:', currentAnalysisId);
          console.log('📥 Backend: Config:', JSON.stringify(data.config, null, 2));
          startStreamingAnalysis(ws, currentAnalysisId, data.config).catch((error) => {
            console.error('❌ Analysis start error:', error);
            console.error('❌ Analysis start error stack:', error.stack);
            try {
              ws.send(JSON.stringify({
                type: 'analysis_error',
                analysisId: currentAnalysisId,
                error: error.message
              }));
            } catch (sendError) {
              console.error('❌ Failed to send error message:', sendError);
            }
          });
        } else if (data.type === 'cancel_analysis') {
          if (data.analysisId && activeAnalyses.has(data.analysisId)) {
            cancelAnalysis(data.analysisId);
          }
        }
        // Don't forward analysis messages to other handlers
        return;
      }

      // Forward non-analysis messages to original handlers
      originalMessageListeners.forEach(listener => {
        try {
          listener(message);
        } catch (e) {
          console.error('Error in original message listener:', e);
        }
      });
    } catch (error) {
      console.error('❌ Analysis WebSocket error:', error);
      ws.send(JSON.stringify({
        type: 'analysis_error',
        analysisId: currentAnalysisId,
        error: error.message
      }));
    }
  });

  ws.on('close', () => {
    if (currentAnalysisId && activeAnalyses.has(currentAnalysisId)) {
      cancelAnalysis(currentAnalysisId);
    }
  });
}

/**
 * Start streaming analysis
 */
async function startStreamingAnalysis(ws, analysisId, config) {
  console.log('📥 Backend: Received analysis request');
  console.log('📥 Backend: Full config:', JSON.stringify(config, null, 2));
  const { fen, depth = 20, multiPV = 3, timeLimit = 750 } = config;
  console.log('📥 Backend: Extracted FEN:', fen);
  console.log('📥 Backend: FEN type:', typeof fen);
  console.log('📥 Backend: FEN length:', fen ? fen.length : 'null/undefined');

  if (!fen) {
    console.error('❌ Backend: FEN is missing');
    ws.send(JSON.stringify({
      type: 'analysis_error',
      analysisId,
      error: 'FEN is required'
    }));
    return;
  }

  // Validate FEN
  try {
    if (!fen || typeof fen !== 'string' || fen.trim() === '') {
      console.error('❌ Backend: Invalid FEN: empty or not a string', fen);
      console.error('❌ Backend: FEN value:', JSON.stringify(fen));
      ws.send(JSON.stringify({
        type: 'analysis_error',
        analysisId,
        error: `Invalid FEN: empty or not a string. Received: ${JSON.stringify(fen)}`
      }));
      return;
    }

    // Chess is already imported at the top of the file
    console.log('🔍 About to create Chess instance with FEN:', fen);
    console.log('🔍 Chess type:', typeof Chess);
    console.log('🔍 Chess is function:', typeof Chess === 'function');
    
    const game = new Chess(fen);
    console.log('✅ Chess instance created successfully');
    
    if (game.isGameOver()) {
      ws.send(JSON.stringify({
        type: 'analysis_error',
        analysisId,
        error: 'Position is terminal (mate/stalemate)'
      }));
      return;
    }
  } catch (error) {
    console.error('❌ Invalid FEN error:', error.message);
    console.error('❌ Error stack:', error.stack);
    console.error('❌ FEN that failed:', fen);
    console.error('❌ FEN type:', typeof fen);
    console.error('❌ FEN length:', fen ? fen.length : 'null/undefined');
    ws.send(JSON.stringify({
      type: 'analysis_error',
      analysisId,
      error: `Invalid FEN: ${error.message}. FEN received: ${fen ? fen.substring(0, 100) : 'null/undefined'}`
    }));
    return;
  }

  // Find Stockfish executable
  let stockfishPath = getStockfishPath();
  
  // Fallback: try alternative paths if primary path doesn't exist (Linux only - no .exe paths)
  if (!fs.existsSync(stockfishPath)) {
    const alternatives = [
      '/usr/games/stockfish',
      '/usr/bin/stockfish',
      '/usr/local/bin/stockfish',
      path.join(__dirname, '../engines/stockfish')
    ];
    for (const altPath of alternatives) {
      if (fs.existsSync(altPath)) {
        stockfishPath = altPath;
        break;
      }
    }
  }

  if (!fs.existsSync(stockfishPath)) {
    ws.send(JSON.stringify({
      type: 'analysis_error',
      analysisId,
      error: 'Stockfish executable not found'
    }));
    return;
  }

  // Log telemetry
  const startTime = Date.now();
  console.log('📊 TELEMETRY: analysis_start', {
    fen,
    analysisId,
    multipv: multiPV,
    depthCap: depth,
    timeLimit,
    timestamp: startTime
  });

  const stockfishProcess = spawn(stockfishPath, [], {
    stdio: ['pipe', 'pipe', 'pipe'],
    shell: false,
    windowsHide: true
  });

  const analysisResults = new Array(multiPV).fill(null);
  let firstPVReceived = false;
  let outputBuffer = '';
  let isReady = false;
  let isUciOk = false;
  let commandsSent = false;

  const timeout = setTimeout(() => {
    if (stockfishProcess && !stockfishProcess.killed) {
      stockfishProcess.kill();
    }
    const pvCount = analysisResults.filter(m => m !== null).length;
    if (pvCount > 0) {
      sendComplete(ws, analysisId, analysisResults, startTime);
    } else {
      ws.send(JSON.stringify({
        type: 'analysis_error',
        analysisId,
        error: 'Analysis timeout - no PVs received'
      }));
    }
    activeAnalyses.delete(analysisId);
  }, Math.max(timeLimit + 5000, 15000));

  // Store analysis session
  activeAnalyses.set(analysisId, {
    process: stockfishProcess,
    ws,
    config,
    startTime
  });

  stockfishProcess.stdout.on('data', (data) => {
    const output = data.toString();
    outputBuffer += output;
    const lines = outputBuffer.split('\n');
    outputBuffer = lines.pop() || '';

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;

      if (trimmedLine === 'uciok') {
        isUciOk = true;
        if (!isReady) {
          stockfishProcess.stdin.write('isready\n');
        }
        continue;
      }

      if (trimmedLine === 'readyok') {
        isReady = true;
        if (!commandsSent) {
          sendCommands();
        }
        continue;
      }

      if (trimmedLine.includes('info')) {
        const multipvMatch = line.match(/multipv (\d+)/);
        const currentMultipv = multipvMatch ? parseInt(multipvMatch[1]) : 1;

        if (currentMultipv <= multiPV) {
          const depthMatch = line.match(/depth (\d+)/);
          const scoreCpMatch = line.match(/score cp (-?\d+)/);
          const scoreMateMatch = line.match(/score mate (-?\d+)/);
          const pvMatch = line.match(/pv (.+?)(?:\s|$)/);
          const nodesMatch = line.match(/nodes (\d+)/);
          const npsMatch = line.match(/nps (\d+)/);
          
          // Extract full PV (may contain multiple moves)
          let fullPV = '';
          if (pvMatch) {
            // Get everything after "pv " until end of line or next keyword
            const pvStart = line.indexOf('pv ');
            if (pvStart >= 0) {
              fullPV = line.substring(pvStart + 3).trim();
            }
          }

          if (fullPV) {
            const pvMoves = fullPV.split(/\s+/).filter(m => m.length >= 4);
            const latency = Date.now() - startTime;

            let moveEvaluation = 0;
            let currentIsMate = false;
            let currentMateIn = 0;

            if (scoreMateMatch) {
              currentIsMate = true;
              currentMateIn = parseInt(scoreMateMatch[1]);
              moveEvaluation = currentMateIn > 0 ? 10000 : -10000;
            } else if (scoreCpMatch) {
              moveEvaluation = parseInt(scoreCpMatch[1]);
            }

            // Normalize evaluation to White POV
            // Chess is already imported at the top of the file
            const tempGame = new Chess(fen);
            const currentTurn = tempGame.turn();
            let normalizedEval = moveEvaluation;
            if (currentTurn === 'b') {
              normalizedEval = -normalizedEval;
            }

            // Convert PV from UCI to SAN with fallback to LAN/UCI
            // Chess is already imported above, reuse it
            const pvGame = new Chess(fen);
            const pvSan = [];

            for (const uciMove of pvMoves) {
              if (uciMove.length < 4) continue;
              try {
                const from = uciMove.slice(0, 2);
                const to = uciMove.slice(2, 4);
                const promotion = uciMove.length > 4 ? uciMove[4] : undefined;
                const chessMove = pvGame.move({ from, to, promotion }, { sloppy: true });
                if (chessMove) {
                  // Try SAN first
                  pvSan.push(chessMove.san);
                } else {
                  // Fallback to LAN
                  const lanMove = pvGame.move({ from, to, promotion }, { sloppy: true, notation: 'long' });
                  if (lanMove) {
                    pvSan.push(lanMove.lan);
                  } else {
                    // Final fallback to UCI
                    pvSan.push(uciMove);
                  }
                }
              } catch (e) {
                // If SAN conversion fails, try LAN, then fallback to UCI
                try {
                  const from = uciMove.slice(0, 2);
                  const to = uciMove.slice(2, 4);
                  const promotion = uciMove.length > 4 ? uciMove[4] : undefined;
                  const lanMove = pvGame.move({ from, to, promotion }, { sloppy: true, notation: 'long' });
                  if (lanMove) {
                    pvSan.push(lanMove.lan);
                  } else {
                    pvSan.push(uciMove); // Keep UCI as last resort
                  }
                } catch (e2) {
                  // Keep UCI if all conversions fail
                  pvSan.push(uciMove);
                }
              }
            }
            
            // Ensure we have at least some moves in PV
            if (pvSan.length === 0 && pvMoves.length > 0) {
              // If SAN conversion completely failed, use UCI moves
              pvSan.push(...pvMoves.slice(0, Math.min(pvMoves.length, 24)));
            }

            if (pvSan.length > 0) {
              const streamedPV = {
                lineIndex: currentMultipv - 1,
                depth: depthMatch ? parseInt(depthMatch[1]) : 0,
              evaluation: {
                type: currentIsMate ? 'mate' : 'cp',
                value: normalizedEval
              },
                pv: pvSan,
                nodes: nodesMatch ? parseInt(nodesMatch[1]) : undefined,
                nps: npsMatch ? parseInt(npsMatch[1]) : undefined,
                latency_ms: latency
              };

              analysisResults[currentMultipv - 1] = streamedPV;

              // Stream PV immediately
              console.log('📤 Backend: Sending analysis_pv for analysisId:', analysisId);
              console.log('📤 Backend: PV data:', JSON.stringify(streamedPV, null, 2).substring(0, 300));
              try {
                ws.send(JSON.stringify({
                  type: 'analysis_pv',
                  analysisId,
                  pv: streamedPV
                }));
                console.log('✅ Backend: Successfully sent analysis_pv');
              } catch (sendError) {
                console.error('❌ Backend: Failed to send analysis_pv:', sendError);
              }

              // Log telemetry
              if (!firstPVReceived) {
                firstPVReceived = true;
                console.log(`📊 TELEMETRY: first_pv_received`, {
                  latency_ms: latency,
                  lineIndex: currentMultipv - 1,
                  depth: streamedPV.depth,
                  pvLength: pvSan.length
                });
                if (latency > 2000) {
                  console.warn(`⚠️ TELEMETRY ALERT: first_pv_latency_ms (${latency}ms) > 2000ms`);
                }
              }

              console.log(`📊 TELEMETRY: pv_received`, {
                lineIndex: currentMultipv - 1,
                depth: streamedPV.depth,
                pvLength: pvSan.length,
                latency_ms_from_start: latency
              });
            }
          }
        }
      } else if (trimmedLine.includes('bestmove')) {
        clearTimeout(timeout);
        stockfishProcess.kill();
        sendComplete(ws, analysisId, analysisResults, startTime);
        activeAnalyses.delete(analysisId);
      }
    }
  });

  stockfishProcess.stderr.on('data', (data) => {
    console.error('📛 Stockfish stderr:', data.toString());
  });

  stockfishProcess.on('error', (error) => {
    clearTimeout(timeout);
    ws.send(JSON.stringify({
      type: 'analysis_error',
      analysisId,
      error: error.message
    }));
    activeAnalyses.delete(analysisId);
  });

  stockfishProcess.on('close', () => {
    clearTimeout(timeout);
  });

  function sendCommands() {
    if (commandsSent) return;
    commandsSent = true;

    const commands = [
      'ucinewgame',
      `setoption name MultiPV value ${multiPV}`,
      'setoption name Threads value 2',
      'setoption name Hash value 128',
      `position fen ${fen}`,
      `go depth ${depth} movetime ${timeLimit}`
    ];

    commands.forEach((cmd, index) => {
      setTimeout(() => {
        if (stockfishProcess && !stockfishProcess.killed) {
          stockfishProcess.stdin.write(cmd + '\n');
        }
      }, index * 50);
    });
  }

  // Start UCI handshake
  setTimeout(() => {
    if (stockfishProcess && !stockfishProcess.killed) {
      stockfishProcess.stdin.write('uci\n');
    }
  }, 100);
}

/**
 * Send complete analysis results
 */
function sendComplete(ws, analysisId, analysisResults, startTime) {
  const filteredPVs = analysisResults.filter(pv => pv !== null).sort((a, b) => a.lineIndex - b.lineIndex);
  
  console.log('📊 TELEMETRY: analysis_stopped', {
    reason: 'bestmove_received',
    pv_count: filteredPVs.length,
    elapsed_ms: Date.now() - startTime
  });

  ws.send(JSON.stringify({
    type: 'analysis_complete',
    analysisId,
    pvs: filteredPVs
  }));
}

/**
 * Cancel analysis
 */
function cancelAnalysis(analysisId) {
  const analysis = activeAnalyses.get(analysisId);
  if (analysis) {
    if (analysis.process && !analysis.process.killed) {
      analysis.process.kill();
    }
    activeAnalyses.delete(analysisId);
    console.log(`📊 TELEMETRY: analysis_stopped`, {
      reason: 'cancelled',
      analysisId,
      elapsed_ms: Date.now() - (analysis.startTime || Date.now())
    });
  }
}

module.exports = {
  router,
  handleAnalysisWebSocket,
  cancelAnalysis
};

