const express = require('express');
const router = express.Router();
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Helper function to get Stockfish path based on platform
function getStockfishPath() {
  if (process.platform === 'win32') {
    return path.join(__dirname, '../engines/stockfish.exe');
  } else {
    // Linux: Try system Stockfish first, then local binary
    if (fs.existsSync('/usr/games/stockfish')) {
      return '/usr/games/stockfish';
    } else if (fs.existsSync('/usr/bin/stockfish')) {
      return '/usr/bin/stockfish';
    } else if (fs.existsSync('/usr/local/bin/stockfish')) {
      return '/usr/local/bin/stockfish';
    } else {
      return path.join(__dirname, '../engines/stockfish');
    }
  }
}

router.post('/position', async (req, res) => {
  // Priority fix: Use lower defaults for faster testing
  const { fen, depth = 14, multiPV = 3, timeLimit = 750 } = req.body;

  if (!fen) {
    return res.status(400).json({ success: false, message: 'FEN is required.' });
  }

  // Validate FEN format
  if (typeof fen !== 'string' || fen.trim() === '') {
    console.error('❌ Invalid FEN: not a string or empty', fen);
    return res.status(400).json({ 
      success: false, 
      message: `Invalid FEN: empty or not a string. Received: ${JSON.stringify(fen)}` 
    });
  }

  // Validate FEN with chess.js
  try {
    const { Chess } = require('chess.js');
    const testGame = new Chess(fen);
    // If we get here, FEN is valid
    console.log('✅ FEN validated:', fen);
  } catch (error) {
    console.error('❌ Invalid FEN error:', error.message, 'FEN:', fen);
    return res.status(400).json({ 
      success: false, 
      message: `Invalid FEN: ${error.message}. FEN received: ${fen ? fen.substring(0, 50) : 'null/undefined'}` 
    });
  }

  try {
    // Find Stockfish executable
    let stockfishPath = getStockfishPath();
    stockfishPath = path.normalize(stockfishPath);
    console.log('Stockfish path:', stockfishPath);
    console.log('Absolute path:', path.resolve(stockfishPath));
    
    // Check if file exists
    if (!fs.existsSync(stockfishPath)) {
      console.error('❌ Stockfish executable not found at:', stockfishPath);
      console.error('❌ Checking alternative locations...');
      
      // Try alternative paths
      const alternatives = [
        '/usr/games/stockfish',
        '/usr/bin/stockfish',
        '/usr/local/bin/stockfish',
        path.join(__dirname, '../engines/stockfish'),
        path.join(__dirname, '../../engines/stockfish.exe'),
        path.join(process.cwd(), 'engines/stockfish.exe'),
        path.join(process.cwd(), 'backend/engines/stockfish.exe')
      ];
      
      for (const altPath of alternatives) {
        const normalized = path.normalize(altPath);
        console.log('  Checking:', normalized);
        if (fs.existsSync(normalized)) {
          stockfishPath = normalized;
          console.log('✅ Found Stockfish at:', stockfishPath);
          break;
        }
      }
      
      if (!fs.existsSync(stockfishPath)) {
        console.error('❌ Stockfish not found in any location');
        return res.status(500).json({
          success: false,
          message: `Stockfish executable not found. Expected at: ${stockfishPath}. Please ensure Stockfish is installed.`,
          error: 'STOCKFISH_NOT_FOUND'
        });
      }
    } else {
      console.log('✅ Stockfish executable found');
    }
    
    console.log('Starting Stockfish analysis for FEN:', fen);
    console.log(`Analysis parameters: depth=${depth}, multiPV=${multiPV}, timeLimit=${timeLimit}ms`);
    
    // Priority fix: Log analysis start with telemetry
    console.log('📊 TELEMETRY: analysis_start', {
      fen: fen,
      multipv: multiPV,
      depthCap: depth,
      timeLimit: timeLimit,
      timestamp: Date.now()
    });

    return new Promise((resolve, reject) => {
      let stockfishProcess;
      let spawnErrorOccurred = false;
      
      console.log('Spawning Stockfish from:', stockfishPath);
      
      // On Windows, use absolute path
      const absolutePath = path.resolve(stockfishPath);
      console.log('Absolute path:', absolutePath);
      
      // Verify file exists and get stats
      try {
        const stats = fs.statSync(absolutePath);
        console.log('✅ File exists, size:', stats.size, 'bytes');
        console.log('✅ File is executable:', (stats.mode & parseInt('111', 8)) !== 0);
      } catch (statError) {
        console.error('❌ Cannot access file:', statError.message);
        return reject(new Error(`Cannot access Stockfish executable: ${statError.message}. Path: ${absolutePath}`));
      }
      
      // On Windows, use shell: false - it handles paths with spaces correctly
      // shell: true causes issues with paths containing spaces in cmd.exe
      const useShell = false; // Always use shell: false, even on Windows
      const spawnPath = absolutePath;
      
      console.log('Using shell: false (handles paths with spaces correctly)');
      console.log('Spawn path:', spawnPath);
      
      stockfishProcess = spawn(spawnPath, [], {
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: useShell,
        windowsHide: true
      });
      
      if (!stockfishProcess) {
        return reject(new Error('Failed to create process object'));
      }
      
      console.log('✅ Stockfish process object created, PID:', stockfishProcess.pid);
      
      // Handle spawn errors (these come asynchronously via events)
      stockfishProcess.on('error', (spawnError) => {
        spawnErrorOccurred = true;
        console.error('❌ Stockfish spawn error:', spawnError);
        console.error('❌ Error details:', {
          message: spawnError.message,
          code: spawnError.code,
          errno: spawnError.errno,
          syscall: spawnError.syscall,
          path: absolutePath
        });
        
        // Try alternative: use shell: true with quoted path
        console.log('⚠️ Trying alternative spawn method with shell: true...');
        const altSpawnPath = `"${absolutePath}"`;
        
        console.log('Trying with shell: true, quoted path:', altSpawnPath);
        
        const altProcess = spawn(altSpawnPath, [], {
          stdio: ['pipe', 'pipe', 'pipe'],
          shell: true,
          windowsHide: true
        });
        
        altProcess.on('error', (altError) => {
          console.error('❌ Alternative spawn also failed:', altError.message);
          reject(new Error(`Failed to start Stockfish: ${spawnError.message}. Path: ${absolutePath}. Make sure Stockfish exists and is executable.`));
        });
        
        // Check if alternative process works (no error after 200ms)
        let altProcessWorked = false;
        setTimeout(() => {
          if (!altProcess.killed && !altProcessWorked) {
            console.log('✅ Alternative spawn method worked');
            stockfishProcess = altProcess;
            spawnErrorOccurred = false;
            altProcessWorked = true;
            // Start UCI handshake for the new process
            startUCIHandshake(altProcess);
          } else if (!altProcessWorked) {
            reject(new Error(`Failed to start Stockfish: ${spawnError.message}. Path: ${absolutePath}. Make sure Stockfish exists and is executable.`));
          }
        }, 200);
        
        // Also check for immediate error
        altProcess.on('error', () => {
          altProcessWorked = false;
        });
      });
      
      // Check if process is still alive after a moment and log initial state
      setTimeout(() => {
        if (stockfishProcess && stockfishProcess.killed) {
          console.error('❌ Stockfish process died immediately after spawn');
        } else if (stockfishProcess && !spawnErrorOccurred) {
          console.log('✅ Stockfish process is still alive');
          console.log('📊 Process stdout readable:', stockfishProcess.stdout && stockfishProcess.stdout.readable);
          console.log('📊 Process stderr readable:', stockfishProcess.stderr && stockfishProcess.stderr.readable);
          console.log('📊 Process stdin writable:', stockfishProcess.stdin && stockfishProcess.stdin.writable);
        }
      }, 500);
      
      let bestMove = null;
      let evaluation = 0;
      let isMate = false;
      let mateIn = 0;
      const analysisResults = new Array(multiPV).fill(null);
      let lastInfoLine = '';
      let outputBuffer = '';
      let isReady = false;
      let isUciOk = false;
      let commandsSent = false;
      let hasReceivedAnyOutput = false;
      const analysisStartTime = Date.now(); // Track when analysis started for telemetry
      let firstPVReceived = false; // Track if first PV has been received

      // Shorter timeout - return partial results if we have PVs
      const timeoutDuration = Math.max(timeLimit + 5000, 15000); // timeLimit + 5s buffer, min 15s
      console.log(`Setting timeout to ${timeoutDuration}ms`);

      const timeout = setTimeout(() => {
        console.error('⏱️ Stockfish timeout reached after', timeoutDuration, 'ms');
        console.error('⏱️ TimeLimit was:', timeLimit, 'ms');
        console.error('⏱️ Has received output:', hasReceivedAnyOutput);
        console.error('⏱️ Is ready:', isReady);
        console.error('⏱️ Commands sent:', commandsSent);
        
        // Log detailed diagnostics
        console.error('📊 Timeout diagnostics:');
        console.error('  - Output buffer length:', outputBuffer.length);
        console.error('  - Output buffer content:', outputBuffer.substring(0, 500));
        console.error('  - Last info line:', lastInfoLine);
        console.error('  - Analysis results:', analysisResults.map((r, i) => ({ index: i, move: r?.move, depth: r?.depth })));
        
        // If we have any PVs, return them even without bestmove
        // Filter out null, invalid moves, and duplicates
        const filteredMoves = analysisResults
          .filter(m => {
            if (!m) return false;
            if (!m.move || !/^[a-h][1-8][a-h][1-8][qrbn]?$/i.test(m.move)) {
              return false;
            }
            return true;
          })
          .filter((m, index, self) => {
            // Remove duplicates based on move string
            return index === self.findIndex(other => other.move === m.move);
          })
          .sort((a, b) => a.multipv - b.multipv);
        if (filteredMoves.length > 0) {
          console.log('⚠️ Timeout but returning', filteredMoves.length, 'partial moves');
          if (stockfishProcess && !stockfishProcess.killed) {
            stockfishProcess.kill();
          }
          clearTimeout(timeout);
          res.json({
            success: true,
            bestMove: filteredMoves[0].move,
            evaluation: filteredMoves[0].evaluation,
            moves: filteredMoves,
            depth: filteredMoves[0].depth || depth,
            multiPV,
            isMate: filteredMoves[0].isMate || false,
            mateIn: filteredMoves[0].mateIn || 0,
            warning: 'Analysis timed out, returning partial results'
          });
          return resolve();
        }
        
        // No results at all - check if we got any output
        if (!hasReceivedAnyOutput || outputBuffer.length === 0) {
          console.error('❌ No output received from Stockfish at all!');
          console.error('❌ This suggests Stockfish is not running or not producing output.');
          console.error('❌ Check if Stockfish is a valid UCI engine.');
          console.error('❌ Try running Stockfish manually to verify it works.');
        } else {
          console.error('⚠️ Received output but no valid moves parsed');
          console.error('⚠️ Output buffer length:', outputBuffer.length);
          console.error('⚠️ Output buffer (first 1000 chars):', outputBuffer.substring(0, 1000));
          console.error('⚠️ Last info line:', lastInfoLine);
        }
        
        if (stockfishProcess && !stockfishProcess.killed) {
          stockfishProcess.kill();
        }
        
        const pvCount = analysisResults.filter(m => m !== null).length;
        console.log('📊 TELEMETRY: analysis_stopped', {
          reason: 'timeout',
          pv_count: pvCount,
          elapsed_ms: timeoutDuration,
          hasReceivedAnyOutput: hasReceivedAnyOutput,
          outputBufferLength: outputBuffer.length
        });
        
        // Priority fix: Return empty array instead of rejecting - let frontend handle it
        // This allows the frontend to show a proper error message
        console.warn('⚠️ Returning empty moves array due to timeout');
        res.json({
          success: true,
          bestMove: null,
          evaluation: 0,
          moves: [],
          depth: depth,
          multiPV: multiPV,
          isMate: false,
          mateIn: 0,
          warning: `Stockfish analysis timed out. No PVs received. Check if Stockfish is working. Output received: ${hasReceivedAnyOutput}`
        });
        resolve();
      }, timeoutDuration);

      // Main stdout handler for parsing UCI responses
      stockfishProcess.stdout.on('data', (data) => {
        const output = data.toString();
        hasReceivedAnyOutput = true;
        console.log('📊 Stockfish stdout received (', output.length, 'bytes):', output.substring(0, 500));
        if (output.length > 500) {
          console.log('📊 ... (truncated, full length:', output.length, ')');
        }
        outputBuffer += output;
        const lines = outputBuffer.split('\n');
        outputBuffer = lines.pop() || ''; // Keep incomplete line in buffer

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine) continue;
          
          // Check for uciok (response to "uci" command)
          if (trimmedLine === 'uciok') {
            isUciOk = true;
            console.log('✅ Stockfish UCI OK');
            // Now send isready
            if (!isReady) {
              stockfishProcess.stdin.write('isready\n');
            }
            continue;
          }
          
          // Check for readyok (response to "isready" command)
          if (trimmedLine === 'readyok') {
            isReady = true;
            console.log('✅ Stockfish is ready');
            if (!commandsSent) {
              sendCommands();
            }
            continue;
          }
          
          if (trimmedLine.includes('info')) {
            lastInfoLine = line;
            const multipvMatch = line.match(/multipv (\d+)/);
            const currentMultipv = multipvMatch ? parseInt(multipvMatch[1]) : 1;

            if (currentMultipv <= multiPV) {
              const depthMatch = line.match(/depth (\d+)/);
              const scoreCpMatch = line.match(/score cp (-?\d+)/);
              const scoreMateMatch = line.match(/score mate (-?\d+)/);
              const pvMatch = line.match(/pv (.+)/);
              
              // Priority fix: Log PV reception for debugging
              if (pvMatch) {
                const pvMoves = pvMatch[1].trim().split(/\s+/).filter(m => m.length >= 4);
                const latency = Date.now() - analysisStartTime;
                if (!firstPVReceived) {
                  firstPVReceived = true;
                  console.log(`📊 TELEMETRY: first_pv_received`, {
                    latency_ms: latency,
                    lineIndex: currentMultipv - 1,
                    depth: depthMatch ? parseInt(depthMatch[1]) : 0,
                    pvLength: pvMoves.length
                  });
                  if (latency > 2000) {
                    console.warn(`⚠️ TELEMETRY ALERT: first_pv_latency_ms (${latency}ms) > 2000ms`);
                  }
                }
                console.log(`📊 TELEMETRY: pv_received`, {
                  lineIndex: currentMultipv - 1,
                  depth: depthMatch ? parseInt(depthMatch[1]) : 0,
                  pvLength: pvMoves.length,
                  latency_ms_from_start: latency,
                  firstMove: pvMoves[0]
                });
              }

              let moveEvaluation = 0;
              let currentIsMate = false;
              let currentMateIn = 0;

              if (scoreMateMatch) {
                currentIsMate = true;
                currentMateIn = parseInt(scoreMateMatch[1]);
                moveEvaluation = currentMateIn > 0 ? 1000 : -1000;
              } else if (scoreCpMatch) {
                moveEvaluation = parseInt(scoreCpMatch[1]) / 100;
              }

              if (pvMatch) {
                // Extract full PV (principal variation) - all moves in the line
                const pvMoves = pvMatch[1].trim().split(/\s+/).filter(m => {
                  // Filter out invalid moves: must be 4-5 chars and match UCI format
                  return m.length >= 4 && m.length <= 5 && /^[a-h][1-8][a-h][1-8][qrbn]?$/i.test(m);
                });
                const firstMove = pvMoves[0];
                
                // Validate first move is a valid UCI move
                if (firstMove && firstMove.length >= 4 && firstMove.length <= 5 && /^[a-h][1-8][a-h][1-8][qrbn]?$/i.test(firstMove)) {
                  analysisResults[currentMultipv - 1] = {
                    move: firstMove,
                    pv: pvMoves, // Full principal variation (already filtered)
                    depth: depthMatch ? parseInt(depthMatch[1]) : 0,
                    evaluation: moveEvaluation,
                    multipv: currentMultipv,
                    isMate: currentIsMate,
                    mateIn: currentMateIn,
                  };
                } else {
                  console.warn(`⚠️ Skipping invalid first move for multipv ${currentMultipv}:`, firstMove);
                }
              }
            }
          } else if (line.includes('bestmove')) {
            bestMove = line.split(' ')[1];
            console.log('✅ Stockfish found bestmove:', bestMove);

            // Use the evaluation from the last info line for the best move
            const scoreCpMatch = lastInfoLine.match(/score cp (-?\d+)/);
            const scoreMateMatch = lastInfoLine.match(/score mate (-?\d+)/);

            if (scoreMateMatch) {
              isMate = true;
              mateIn = parseInt(scoreMateMatch[1]);
              evaluation = mateIn > 0 ? 1000 : -1000;
            } else if (scoreCpMatch) {
              evaluation = parseInt(scoreCpMatch[1]) / 100;
            }

            clearTimeout(timeout);
            stockfishProcess.kill();
            
            // Priority fix: Filter and sort - show whatever PVs we have, even if < requested MultiPV
            // Also filter out duplicates and invalid moves
            const filteredMoves = analysisResults
              .filter(m => {
                // Remove null entries
                if (!m) return false;
                // Validate move is a proper UCI move (4-5 chars, matches pattern)
                if (!m.move || !/^[a-h][1-8][a-h][1-8][qrbn]?$/i.test(m.move)) {
                  console.warn(`⚠️ Filtering out invalid move entry:`, m.move);
                  return false;
                }
                return true;
              })
              .filter((m, index, self) => {
                // Remove duplicates based on move string
                return index === self.findIndex(other => other.move === m.move);
              })
              .sort((a, b) => a.multipv - b.multipv);
            
            console.log('📊 TELEMETRY: analysis_stopped', {
              reason: 'bestmove_received',
              pv_count: filteredMoves.length,
              requested_multiPV: multiPV,
              elapsed_ms: Date.now() - analysisStartTime
            });
            
            // Ensure bestMove is always in the moves array (as first move if not already there)
            if (filteredMoves.length === 0 || filteredMoves[0].move !== bestMove) {
              // Try to get PV from last info line
              const lastPvMatch = lastInfoLine.match(/pv (.+)/);
              const lastPv = lastPvMatch ? lastPvMatch[1].trim().split(/\s+/).filter(m => m.length >= 4) : [bestMove];
              
              filteredMoves.unshift({
                move: bestMove,
                pv: lastPv, // Full principal variation
                depth: depth,
                evaluation: evaluation,
                multipv: 1,
                isMate: isMate,
                mateIn: mateIn,
              });
            }
            
            console.log('✅ Returning', filteredMoves.length, 'moves to frontend');
            console.log('✅ Best move:', filteredMoves[0].move, 'eval:', filteredMoves[0].evaluation);
            
            const result = {
              bestMove,
              evaluation,
              moves: filteredMoves,
              isMate,
              mateIn,
            };

            console.log('✅ Sending response to frontend with', result.moves.length, 'moves');
            res.json({
              success: true,
              bestMove: result.bestMove,
              evaluation: result.evaluation,
              moves: result.moves,
              depth,
              multiPV,
              isMate: result.isMate,
              mateIn: result.mateIn,
            });
            resolve(); // Resolve the Promise after sending response
          }
        }
      });

      let stderrBuffer = '';
      stockfishProcess.stderr.on('data', (data) => {
        const errorOutput = data.toString();
        stderrBuffer += errorOutput;
        console.error('📛 Stockfish stderr:', errorOutput);
        hasReceivedAnyOutput = true;
      });
      
      // Log when stdout/stderr streams are set up
      console.log('✅ Stdout/stderr handlers attached');
      
      // Handle stdin errors (EPIPE when process dies)
      stockfishProcess.stdin.on('error', (error) => {
        if (error.code === 'EPIPE') {
          console.warn('⚠️ EPIPE on stdin - process may have crashed before we could write');
        } else {
          console.error('❌ Stdin error:', error);
        }
      });

      stockfishProcess.on('close', (code, signal) => {
        clearTimeout(timeout);
        console.log(`Stockfish process closed with code: ${code}, signal: ${signal}`);
        console.log(`Has received output: ${hasReceivedAnyOutput}`);
        console.log(`Has best move: ${bestMove !== null}`);
        console.log(`Analysis results count: ${analysisResults.filter(m => m !== null).length}`);
        
        if (stderrBuffer) {
          console.error('Full stderr output:', stderrBuffer);
        }
        
        // Only reject if we got no results AND the exit code indicates an error
        const hasResults = bestMove || analysisResults.filter(m => m !== null).length > 0;
        if (code !== 0 && !hasResults && !res.headersSent) {
          const errorMsg = `Stockfish process exited with code ${code}${stderrBuffer ? `. Error: ${stderrBuffer.substring(0, 200)}` : ''}`;
          console.error('❌', errorMsg);
          reject(new Error(errorMsg));
        } else if (code !== 0 && hasResults) {
          console.warn('⚠️ Stockfish exited with error code but we have results, continuing...');
        } else if (code === 0) {
          console.log('✅ Stockfish process exited normally');
        }
      });

      stockfishProcess.on('error', (error) => {
        clearTimeout(timeout);
        console.error('❌ Stockfish process error event:', error);
        console.error('❌ Error details:', {
          message: error.message,
          code: error.code,
          errno: error.errno,
          syscall: error.syscall
        });
        if (!res.headersSent) {
          reject(error);
        }
      });

      // Function to send commands (called after readyok)
      const sendCommands = () => {
        if (commandsSent) return;
        commandsSent = true;
        
        console.log('📤 Sending analysis commands to Stockfish...');
        console.log(`  - MultiPV: ${multiPV}, Depth: ${depth}, Time: ${timeLimit}ms`);
        
        try {
          // Send UCI commands with proper newlines (don't send uci/isready again)
          const commands = [
            'ucinewgame',
            `setoption name MultiPV value ${multiPV}`,
            'setoption name Threads value 2',
            'setoption name Hash value 128',
            'setoption name Skill Level value 20',
            `position fen ${fen}`,
            `go depth ${depth} movetime ${timeLimit}`
          ];
          
          commands.forEach((cmd, index) => {
            setTimeout(() => {
              if (stockfishProcess && !stockfishProcess.killed && !spawnErrorOccurred) {
                console.log(`  → ${cmd}`);
                if (!safeWrite(stockfishProcess, cmd + '\n', cmd.split(' ')[0])) {
                  console.warn(`⚠️ Failed to send command: ${cmd}`);
                  // If we can't write, the process is probably dead
                  if (index === commands.length - 1) {
                    console.log('⚠️ Some commands may not have been sent');
                  }
                } else if (index === commands.length - 1) {
                  console.log('✅ All commands sent to Stockfish');
                }
              }
            }, index * 50); // Small delay between commands
          });
        } catch (error) {
          console.error('Error sending commands to Stockfish:', error);
          clearTimeout(timeout);
          if (stockfishProcess && !stockfishProcess.killed) {
            stockfishProcess.kill();
          }
          reject(new Error(`Failed to send commands to Stockfish: ${error.message}`));
        }
      };

      // Function to safely write to process stdin
      const safeWrite = (process, data, description) => {
        if (!process || process.killed || spawnErrorOccurred) {
          console.warn(`⚠️ Cannot write ${description}: process is killed or error occurred`);
          return false;
        }
        
        if (!process.stdin || process.stdin.destroyed || process.stdin.writableEnded) {
          console.warn(`⚠️ Cannot write ${description}: stdin is not available`);
          return false;
        }
        
        try {
          const result = process.stdin.write(data);
          if (result) {
            console.log(`✅ Sent "${description}" command`);
            return true;
          } else {
            // Buffer is full, wait for drain
            process.stdin.once('drain', () => {
              console.log(`✅ Drain event for ${description}`);
            });
            return true;
          }
        } catch (writeError) {
          // EPIPE means process already died, handle gracefully
          if (writeError.code === 'EPIPE') {
            console.error(`❌ Process died before we could send ${description}`);
            return false;
          }
          console.error(`❌ Error writing ${description}:`, writeError);
          return false;
        }
      };
      
      // Function to start UCI handshake (reusable for alternative process)
      const startUCIHandshake = (process) => {
        console.log('📤 Starting UCI handshake...');
        console.log('📊 Process state - killed:', process?.killed, 'spawnErrorOccurred:', spawnErrorOccurred);
        
        // Wait a moment for process to be ready, then send uci
        setTimeout(() => {
          if (process && !process.killed && !spawnErrorOccurred) {
            console.log('📤 Attempting to send "uci" command...');
            if (!safeWrite(process, 'uci\n', 'uci')) {
              // Process might have died, check stderr
              console.error('❌ Failed to send uci command, process may have crashed');
              // Don't reject immediately, let the close handler deal with it
            } else {
              console.log('✅ "uci" command sent, waiting for uciok response...');
            }
          } else {
            console.warn('⚠️ Cannot send uci - process state:', { killed: process?.killed, spawnErrorOccurred });
          }
        }, 500); // Give process 500ms to initialize
        
        // Fallback: if no response after 2 seconds, try sending commands anyway
        setTimeout(() => {
          if (!isReady && !commandsSent && !spawnErrorOccurred) {
            console.log('⚠️ Stockfish did not respond properly, attempting to send commands anyway...');
            console.log('⚠️ isUciOk:', isUciOk, 'isReady:', isReady, 'hasReceivedAnyOutput:', hasReceivedAnyOutput);
            // Try sending isready if we got uciok
            if (isUciOk) {
              if (safeWrite(process, 'isready\n', 'isready')) {
                // Wait another second for readyok
                setTimeout(() => {
                  if (!isReady && !commandsSent) {
                    console.log('⚠️ Still no readyok, sending commands anyway...');
                    sendCommands();
                  }
                }, 1000);
              } else {
                // Failed to write, try commands anyway
                sendCommands();
              }
            } else {
              // No uciok either, try sending commands directly
              console.log('⚠️ No uciok received, sending commands directly...');
              sendCommands();
            }
          }
        }, 2000);
      };
      
      // Start UCI handshake for initial process
      startUCIHandshake(stockfishProcess);
    });

  } catch (error) {
    console.error('Error during Stockfish analysis:', error);
    
    // Return a fallback response instead of failing completely
    const fallbackResponse = {
      success: true,
      bestMove: 'e2e4', // Default opening move
      evaluation: 0,
      moves: [{
        move: 'e2e4',
        depth: 0,
        evaluation: 0,
        multipv: 1,
        isMate: false,
        mateIn: 0,
      }],
      depth: req.body.depth || 15,
      multiPV: req.body.multiPV || 3,
      isMate: false,
      mateIn: 0,
      warning: 'Stockfish analysis failed, using fallback response'
    };
    
    console.log('⚠️ Returning fallback response due to Stockfish error');
    res.json(fallbackResponse);
  }
});

module.exports = router;