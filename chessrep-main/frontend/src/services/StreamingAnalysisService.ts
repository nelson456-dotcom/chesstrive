/**
 * Streaming Analysis Service
 * Provides real-time Multi-PV analysis with streaming updates via WebSocket/SSE
 */

import { EngineMove, Evaluation } from '../types/chess';

export interface AnalysisConfig {
  fen: string;
  multiPV: number;
  depthCap?: number;
  timeLimit?: number;
  pvLength?: number;
  nodeId?: string;
}

export interface StreamedPV {
  lineIndex: number; // 0-based, 0 = best line
  depth: number;
  evaluation: {
    type: 'cp' | 'mate';
    value: number;
  };
  pv: string[]; // Full principal variation in SAN
  nodes?: number;
  nps?: number;
  latency_ms?: number;
}

export interface AnalysisTelemetry {
  analysis_start: {
    fen: string;
    nodeId?: string;
    multipv: number;
    pv_len_target: number;
    cap: { depth?: number; time?: number };
    timestamp: number;
  };
  pv_received: {
    lineIndex: number;
    depth: number;
    pvLength: number;
    latency_ms_from_start: number;
  };
  analysis_error: {
    reason: string;
    code?: string;
    timestamp: number;
  };
  analysis_stopped: {
    reason: 'bestmove_received' | 'timeout' | 'cancelled' | 'error';
    pv_count: number;
    elapsed_ms: number;
  };
}

type AnalysisCallback = (pv: StreamedPV) => void;
type ErrorCallback = (error: Error) => void;
type CompleteCallback = (allPVs: StreamedPV[]) => void;

class StreamingAnalysisService {
  private ws: WebSocket | null = null;
  private activeAnalysisId: string | null = null;
  private callbacks: Map<string, {
    onPV?: AnalysisCallback;
    onError?: ErrorCallback;
    onComplete?: CompleteCallback;
  }> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private readonly wsUrl = process.env.REACT_APP_WS_URL || 'ws://localhost:3001';
  private readonly httpUrl = process.env.REACT_APP_API_URL 
    ? `${process.env.REACT_APP_API_URL.replace(/\/api$/, '')}/api/analysis`
    : 'http://localhost:3001/api/analysis';

  constructor() {
    console.log('StreamingAnalysisService: Initialized');
  }

  /**
   * Connect to WebSocket server
   */
  private connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        resolve();
        return;
      }

      try {
        this.ws = new WebSocket(this.wsUrl);

        this.ws.onopen = () => {
          console.log('✅ StreamingAnalysisService: WebSocket connected');
          this.reconnectAttempts = 0;
          resolve();
        };

        this.ws.onerror = (error) => {
          console.error('❌ StreamingAnalysisService: WebSocket error', error);
          reject(new Error('WebSocket connection failed. Please check your connection.'));
        };

        this.ws.onclose = () => {
          console.log('⚠️ StreamingAnalysisService: WebSocket closed');
          this.ws = null;
          this.attemptReconnect();
        };

        this.ws.onmessage = (event) => {
          try {
            console.log('📥 StreamingAnalysisService: Received WebSocket message:', event.data.substring(0, 200));
            const data = JSON.parse(event.data);
            console.log('📥 StreamingAnalysisService: Parsed message type:', data.type);
            console.log('📥 StreamingAnalysisService: Full message:', JSON.stringify(data, null, 2).substring(0, 500));
            this.handleMessage(data);
          } catch (error) {
            console.error('❌ StreamingAnalysisService: Failed to parse message', error);
            console.error('❌ StreamingAnalysisService: Raw message:', event.data);
          }
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Attempt to reconnect to WebSocket
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ StreamingAnalysisService: Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts - 1), 10000);
    console.log(`🔄 StreamingAnalysisService: Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);

    this.reconnectTimeout = setTimeout(() => {
      this.connect().catch(() => {
        // Will retry on next attempt
      });
    }, delay);
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleMessage(data: any): void {
    console.log('🔍 StreamingAnalysisService.handleMessage: Processing message type:', data.type);
    
    if (data.type === 'analysis_pv') {
      const analysisId = data.analysisId;
      console.log('📥 Received analysis_pv for analysisId:', analysisId);
      console.log('📥 PV data:', JSON.stringify(data.pv, null, 2).substring(0, 300));
      const callbacks = this.callbacks.get(analysisId);
      if (callbacks && callbacks.onPV) {
        console.log('✅ Calling onPV callback');
        callbacks.onPV(data.pv);
      } else {
        console.warn('⚠️ No callbacks found for analysisId:', analysisId);
        console.warn('⚠️ Available analysisIds:', Array.from(this.callbacks.keys()));
      }
    } else if (data.type === 'analysis_complete') {
      const analysisId = data.analysisId;
      console.log('📥 Received analysis_complete for analysisId:', analysisId);
      console.log('📥 PVs count:', data.pvs ? data.pvs.length : 0);
      const callbacks = this.callbacks.get(analysisId);
      if (callbacks && callbacks.onComplete) {
        console.log('✅ Calling onComplete callback');
        callbacks.onComplete(data.pvs || []);
      } else {
        console.warn('⚠️ No callbacks found for analysisId:', analysisId);
      }
      this.callbacks.delete(analysisId);
    } else if (data.type === 'analysis_error') {
      const analysisId = data.analysisId;
      console.error('❌ Received analysis_error for analysisId:', analysisId);
      console.error('❌ Error:', data.error);
      const callbacks = this.callbacks.get(analysisId);
      if (callbacks && callbacks.onError) {
        console.log('✅ Calling onError callback');
        callbacks.onError(new Error(data.error || 'Analysis error'));
      } else {
        console.warn('⚠️ No callbacks found for analysisId:', analysisId);
      }
      this.callbacks.delete(analysisId);
    } else {
      console.log('ℹ️ Unknown message type:', data.type);
    }
  }

  /**
   * Start streaming analysis
   * Falls back to HTTP polling if WebSocket is unavailable
   */
  async startAnalysis(
    config: AnalysisConfig,
    onPV: AnalysisCallback,
    onError: ErrorCallback,
    onComplete: CompleteCallback
  ): Promise<() => void> {
    const analysisId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.activeAnalysisId = analysisId;

    // Log telemetry
    this.logTelemetry('analysis_start', {
      fen: config.fen,
      nodeId: config.nodeId,
      multipv: config.multiPV,
      pv_len_target: config.pvLength || 10,
      cap: { depth: config.depthCap, time: config.timeLimit },
      timestamp: Date.now()
    });

    // Store callbacks
    this.callbacks.set(analysisId, { onPV, onError, onComplete });

    // Try WebSocket first
    try {
      console.log('🔍 StreamingAnalysisService: Attempting WebSocket connection...');
      await this.connect();
      console.log('🔍 StreamingAnalysisService: WebSocket connection attempt completed');
      console.log('🔍 StreamingAnalysisService: WebSocket state:', this.ws ? this.ws.readyState : 'null');
      console.log('🔍 StreamingAnalysisService: WebSocket.OPEN constant:', WebSocket.OPEN);
      
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        console.log('📤 StreamingAnalysisService: Sending WebSocket analysis request');
        console.log('📤 FEN being sent:', config.fen);
        console.log('📤 FEN type:', typeof config.fen);
        console.log('📤 FEN length:', config.fen ? config.fen.length : 'null/undefined');
        console.log('📤 Full config:', JSON.stringify(config, null, 2));
        
        const message = JSON.stringify({
          type: 'start_analysis',
          analysisId,
          config
        });
        console.log('📤 StreamingAnalysisService: Sending message:', message.substring(0, 200) + '...');
        
        this.ws.send(message);
        console.log('📤 StreamingAnalysisService: Started WebSocket analysis', analysisId);
        
        // Set up timeout to fall back to HTTP if no response received
        let websocketWorking = false;
        const websocketTimeout = setTimeout(() => {
          if (!websocketWorking) {
            console.warn('⚠️ StreamingAnalysisService: No WebSocket response received within 3 seconds, falling back to HTTP');
            this.callbacks.delete(analysisId);
            // Start HTTP fallback
            this.startHTTPAnalysis(analysisId, config, onPV, onError, onComplete);
          }
        }, 3000);
        
        // Mark WebSocket as working when we receive any message
        const originalOnPV = onPV;
        const originalOnError = onError;
        const originalOnComplete = onComplete;
        
        this.callbacks.set(analysisId, {
          onPV: (pv) => {
            websocketWorking = true;
            clearTimeout(websocketTimeout);
            originalOnPV(pv);
          },
          onError: (error) => {
            websocketWorking = true;
            clearTimeout(websocketTimeout);
            originalOnError(error);
          },
          onComplete: (pvs) => {
            websocketWorking = true;
            clearTimeout(websocketTimeout);
            originalOnComplete(pvs);
          }
        });
        
        return () => {
          clearTimeout(websocketTimeout);
          this.cancelAnalysis(analysisId);
        };
      } else {
        console.warn('⚠️ StreamingAnalysisService: WebSocket not open, state:', this.ws ? this.ws.readyState : 'null');
        // Fallback to HTTP polling
        return this.startHTTPAnalysis(analysisId, config, onPV, onError, onComplete);
      }
    } catch (error) {
      console.warn('⚠️ StreamingAnalysisService: WebSocket unavailable, falling back to HTTP', error);
      console.warn('⚠️ StreamingAnalysisService: Error details:', error.message);
      // Fallback to HTTP polling
      return this.startHTTPAnalysis(analysisId, config, onPV, onError, onComplete);
    }

    // Final fallback to HTTP polling (shouldn't reach here, but just in case)
    return this.startHTTPAnalysis(analysisId, config, onPV, onError, onComplete);
  }

  /**
   * HTTP polling fallback (with streaming simulation)
   */
  private startHTTPAnalysis(
    analysisId: string,
    config: AnalysisConfig,
    onPV: AnalysisCallback,
    onError: ErrorCallback,
    onComplete: CompleteCallback
  ): () => void {
    const startTime = Date.now();
    let cancelled = false;
    const pvs: StreamedPV[] = [];
    let firstPVReceived = false;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), (config.timeLimit || 15000) + 5000);

    // Log the FEN being sent
    console.log('📤 StreamingAnalysisService: Sending HTTP analysis request');
    console.log('📤 FEN being sent:', config.fen);
    console.log('📤 FEN type:', typeof config.fen);
    console.log('📤 FEN length:', config.fen ? config.fen.length : 'null/undefined');
    
    // Make HTTP request
    fetch(`${this.httpUrl}/position`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fen: config.fen,
        depth: config.depthCap || 20,
        multiPV: config.multiPV,
        timeLimit: config.timeLimit || 750
      }),
      signal: controller.signal
    })
      .then(async (response) => {
        clearTimeout(timeout);
        if (!response.ok) {
          const errorText = await response.text().catch(() => 'Unknown error');
          throw new Error(`HTTP ${response.status}: ${response.statusText}. ${errorText}`);
        }
        const data = await response.json();

        if (cancelled) return;

        if (!data.success || !data.moves || data.moves.length === 0) {
          throw new Error(data.warning || 'No PVs received');
        }

        // Convert backend moves to StreamedPV format and stream them
        const Chess = require('chess.js').Chess;
        const game = new Chess(config.fen);

        // Filter out invalid moves first
        const validMoves = data.moves.filter((m: any) => {
          // Must have a valid move field (UCI format: 4-5 chars)
          if (!m.move || typeof m.move !== 'string') return false;
          if (!/^[a-h][1-8][a-h][1-8][qrbn]?$/i.test(m.move)) {
            console.warn(`⚠️ Filtering out invalid move:`, m.move);
            return false;
          }
          return true;
        });

        // Remove duplicates based on move string
        const uniqueMoves = validMoves.filter((m: any, index: number, self: any[]) => {
          return index === self.findIndex(other => other.move === m.move);
        });

        console.log(`✅ Filtered ${data.moves.length} moves to ${uniqueMoves.length} unique valid moves`);

        for (let i = 0; i < uniqueMoves.length; i++) {
          if (cancelled) break;

          const move = uniqueMoves[i];
          const latency = Date.now() - startTime;

          // Convert PV from UCI to SAN
          // Filter out non-move strings (like "score", "nodes", numbers, etc.)
          const pvSan: string[] = [];
          const pvUci = Array.isArray(move.pv) ? move.pv : (move.pv || [move.move]);
          console.log(`🔍 Processing move ${i}, raw PV:`, pvUci.slice(0, 20)); // Log first 20 items
          
          const tempGame = new Chess(config.fen);
          let validMovesFound = 0;
          let skippedCount = 0;

          for (const uciMove of pvUci) {
            // Skip if not a string or too short to be a move
            if (typeof uciMove !== 'string' || uciMove.length < 4) {
              skippedCount++;
              continue;
            }
            
            // Skip known Stockfish info keywords
            if (['score', 'nodes', 'hashfull', 'tbhits', 'time', 'cp', 'mate', 'multipv', 'depth'].includes(uciMove.toLowerCase())) {
              skippedCount++;
              continue;
            }
            
            // Skip if it's a number (node counts, etc.)
            if (/^\d+$/.test(uciMove)) {
              skippedCount++;
              continue;
            }
            
            // Must be a UCI move (4-5 characters, starting with a-h)
            if (!/^[a-h][1-8][a-h][1-8][qrbn]?$/.test(uciMove.toLowerCase())) {
              skippedCount++;
              continue;
            }
            
            try {
              const from = uciMove.slice(0, 2);
              const to = uciMove.slice(2, 4);
              const promotion = uciMove.length > 5 ? uciMove[4] : undefined;
              const chessMove = tempGame.move({ from, to, promotion }, { sloppy: true });
              if (chessMove) {
                pvSan.push(chessMove.san);
                validMovesFound++;
              } else {
                skippedCount++;
              }
            } catch (e) {
              // Skip invalid moves
              skippedCount++;
              console.warn('⚠️ Skipping invalid UCI move:', uciMove, e);
            }
          }
          
          console.log(`✅ Move ${i}: Found ${validMovesFound} valid moves, skipped ${skippedCount} items, PV:`, pvSan.slice(0, 10));

          const streamedPV: StreamedPV = {
            lineIndex: i,
            depth: move.depth || 0,
            evaluation: {
              type: move.isMate ? 'mate' : 'cp',
              value: move.isMate
                ? (move.mateIn > 0 ? 10000 : -10000)
                : (move.evaluation * 100) // Convert to centipawns
            },
            pv: pvSan,
            nodes: move.nodes,
            nps: move.nps,
            latency_ms: latency
          };

          pvs.push(streamedPV);

          // Stream first PV immediately if we have moves
          if (!firstPVReceived && pvSan.length > 0) {
            firstPVReceived = true;
            console.log(`📤 Streaming first PV (line ${i}) with ${pvSan.length} moves:`, pvSan.slice(0, 5));
            onPV(streamedPV);
            this.logTelemetry('pv_received', {
              lineIndex: i,
              depth: streamedPV.depth,
              pvLength: pvSan.length,
              latency_ms_from_start: latency
            });

            if (latency > 2000) {
              console.warn(`⚠️ TELEMETRY ALERT: first_pv_latency_ms (${latency}ms) > 2000ms`);
            }
          } else if (!firstPVReceived && pvSan.length === 0) {
            console.warn(`⚠️ Move ${i} has empty PV after filtering! Raw PV had ${pvUci.length} items`);
          }
        }

        // Stream remaining PVs with small delay to simulate streaming
        for (let i = firstPVReceived ? 1 : 0; i < pvs.length; i++) {
          if (cancelled) break;
          await new Promise(resolve => setTimeout(resolve, 50));
          onPV(pvs[i]);
          this.logTelemetry('pv_received', {
            lineIndex: pvs[i].lineIndex,
            depth: pvs[i].depth,
            pvLength: pvs[i].pv.length,
            latency_ms_from_start: pvs[i].latency_ms || 0
          });
        }

        if (!cancelled) {
          this.logTelemetry('analysis_stopped', {
            reason: 'bestmove_received',
            pv_count: pvs.length,
            elapsed_ms: Date.now() - startTime
          });
          onComplete(pvs);
        }
      })
      .catch((error) => {
        clearTimeout(timeout);
        if (!cancelled) {
          let finalError = error;
          if (error.name === 'AbortError' || error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
            finalError = new Error('Cannot connect to backend server. Please check your connection.');
            console.error('❌', finalError.message);
          }
          this.logTelemetry('analysis_error', {
            reason: finalError.message,
            code: finalError.name,
            timestamp: Date.now()
          });
          onError(finalError);
        }
      });

    return () => {
      cancelled = true;
      controller.abort();
      clearTimeout(timeout);
      this.callbacks.delete(analysisId);
    };
  }

  /**
   * Cancel active analysis
   */
  private cancelAnalysis(analysisId: string): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'cancel_analysis',
        analysisId
      }));
    }
    this.callbacks.delete(analysisId);
    if (this.activeAnalysisId === analysisId) {
      this.activeAnalysisId = null;
    }
  }

  /**
   * Log telemetry
   */
  private logTelemetry(event: keyof AnalysisTelemetry, data: any): void {
    console.log(`📊 TELEMETRY: ${event}`, data);
  }

  /**
   * Disconnect WebSocket
   */
  disconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.callbacks.clear();
    this.activeAnalysisId = null;
  }
}

export const streamingAnalysisService = new StreamingAnalysisService();
export default streamingAnalysisService;

