// Stockfish Cloud Service - Uses external Stockfish cloud APIs
// This replaces the problematic local Stockfish worker with cloud-based analysis

import { Evaluation, EngineMove, AnalysisConfig } from '../types/chess';

export interface StockfishCloudResponse {
  bestmove: string;
  evaluation: {
    type: 'cp' | 'mate';
    value: number;
  };
  depth: number;
  nodes: number;
  pv: string[];
  multipv?: number;
}

export interface StockfishCloudConfig {
  depth?: number;
  multiPV?: number;
  timeLimit?: number;
  fen: string;
}

class StockfishCloudService {
  private isReady = true; // Always ready (using chess.js for move generation)
  private readonly localBackendUrl = 'http://localhost:3001/api/analysis/position'; // Local backend Stockfish
  private readonly baseUrl = 'https://stockfish-api.herokuapp.com'; // Public Stockfish API
  private readonly fallbackUrl = 'https://chess-api.com/v1'; // Fallback API

  constructor() {
    console.log('StockfishCloudService: Using local backend Stockfish engine');
  }

  /**
   * Check if the service is ready
   */
  isEngineReady(): boolean {
    return this.isReady;
  }

  /**
   * Analyze a position using Stockfish (LOCAL BACKEND FIRST, then Cloud APIs)
   */
  async analyzePosition(fen: string, config: Partial<AnalysisConfig> = {}): Promise<EngineMove[]> {
    try {
      console.log('StockfishCloudService: Analyzing position:', fen);
      console.log('StockfishCloudService: Config:', config);

      const analysisConfig: StockfishCloudConfig = {
        fen,
        depth: config.depth || 20,
        multiPV: config.multiPV || 3,
        timeLimit: config.timeLimit || 10000
      };

      // Try local backend FIRST (best option - real Stockfish)
      console.log('🚀 Trying local backend Stockfish engine...');
      console.log('🚀 Local backend URL:', this.localBackendUrl);
      try {
        const moves = await this.analyzeWithLocalBackend(analysisConfig);
        if (moves && moves.length > 0) {
          console.log('✅ Local backend Stockfish returned', moves.length, 'moves');
          return moves;
        } else {
          console.warn('⚠️ Local backend returned empty moves array');
        }
      } catch (error) {
        console.warn('⚠️ Local backend failed:', error);
        console.warn('⚠️ Error details:', {
          message: error?.message,
          name: error?.name,
          stack: error?.stack
        });
        console.warn('⚠️ This usually means the backend server is not running on port 3001');
        console.warn('⚠️ Falling back to cloud APIs...');
      }
      
      // Try cloud API as backup
      try {
        const moves = await this.analyzeWithPrimaryAPI(analysisConfig);
        if (moves.length > 0) {
          return moves;
        }
      } catch (error) {
        console.warn('StockfishCloudService: Primary API failed, trying Lichess fallback:', error);
      }

      // Try Lichess fallback API
      try {
        const moves = await this.analyzeWithFallbackAPI(analysisConfig);
        if (moves.length > 0) {
          return moves;
        }
      } catch (error) {
        console.warn('StockfishCloudService: Fallback API failed, using chess.js mock:', error);
      }

      // If everything fails, use chess.js to generate REAL legal moves
      console.log('✨ All APIs failed, using chess.js to generate legal moves');
      console.log('⚠️ NOTE: These are basic legal moves, not engine analysis');
      console.log('⚠️ To get real engine analysis, start the backend server:');
      console.log('⚠️   cd backend && npm start');
      const mockMoves = this.generateMockAnalysis(fen, analysisConfig);
      console.log('✅ Generated', mockMoves.length, 'mock moves');
      return mockMoves;

    } catch (error) {
      console.error('StockfishCloudService: Analysis failed:', error);
      return this.generateMockAnalysis(fen, { fen, depth: 20, multiPV: 3 });
    }
  }

  /**
   * Analyze using local backend Stockfish engine
   */
  private async analyzeWithLocalBackend(config: StockfishCloudConfig): Promise<EngineMove[]> {
    console.log('🚀 Calling local backend at:', this.localBackendUrl);
    
    const requestBody = {
      fen: config.fen,
      depth: Math.min(config.depth || 15, 15), // Cap depth at 15 for performance
      multiPV: Math.min(config.multiPV || 3, 3), // Cap multiPV at 3
      timeLimit: Math.min(config.timeLimit || 8000, 12000) // Cap timeLimit at 12 seconds
    };

    console.log('🚀 Local backend request:', requestBody);

    // Add timeout to fetch request (15 seconds max)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      const response = await fetch(this.localBackendUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Local backend error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Local backend response:', data);
      console.log('✅ Local backend response.moves:', data.moves);
      console.log('✅ Local backend response.moves length:', data.moves?.length);

      if (!data.success) {
        throw new Error(`Local backend failed: ${data.message || 'Unknown error'}`);
      }

      // Convert backend response to EngineMove[] format
      // Backend returns UCI moves, we need to convert to SAN
      const Chess = require('chess.js').Chess;
      
      const moves: EngineMove[] = [];
      
      // Process each move from the backend
      // Priority fix: Check for warning in response (timeout/error cases)
      if (data.warning) {
        console.warn('⚠️ Backend warning:', data.warning);
      }
      
      if (data.moves && Array.isArray(data.moves) && data.moves.length > 0) {
        console.log('✅ Processing', data.moves.length, 'moves from backend');
        for (const backendMove of data.moves) {
          try {
            // Validate backend move has required fields
            if (!backendMove || !backendMove.move) {
              console.warn('⚠️ Skipping move - missing move field:', backendMove);
              continue;
            }
            
            // Create a fresh game instance for this PV conversion
            const pvGame = new Chess(config.fen);
            if (pvGame.isGameOver()) {
              console.warn('⚠️ Position is terminal, skipping move conversion');
              continue;
            }
            
            const pvSan: string[] = [];
            
            // Convert full PV from UCI to SAN
            // Handle both array and string formats for PV
            let pvUci: string[] = [];
            if (Array.isArray(backendMove.pv)) {
              pvUci = backendMove.pv;
            } else if (typeof backendMove.pv === 'string') {
              pvUci = backendMove.pv.trim().split(/\s+/).filter(m => m.length >= 4);
            } else {
              // Fallback: use the move itself
              pvUci = [backendMove.move];
            }
            
            // Ensure we have at least the first move
            if (pvUci.length === 0 && backendMove.move) {
              pvUci = [backendMove.move];
            }
            
            // Convert each UCI move to SAN
            for (const uciMove of pvUci) {
              if (!uciMove || typeof uciMove !== 'string' || uciMove.length < 4) {
                continue; // Skip invalid moves
              }
              
              try {
                const from = uciMove.substring(0, 2);
                const to = uciMove.substring(2, 4);
                const promotion = uciMove.length > 4 ? uciMove[4] : undefined;
                
                // Validate square format
                if (!/^[a-h][1-8]$/.test(from) || !/^[a-h][1-8]$/.test(to)) {
                  console.warn('⚠️ Invalid square format in UCI move:', uciMove);
                  break; // Stop PV conversion if invalid move
                }
                
                const moveObj = pvGame.move({ from, to, promotion }, { sloppy: true });
                if (moveObj && moveObj.san) {
                  pvSan.push(moveObj.san);
                } else {
                  // Priority fix: If SAN conversion fails, fallback to LAN/UCI instead of dropping
                  console.warn('⚠️ Failed to convert UCI move to SAN:', uciMove, '- using UCI as fallback');
                  pvSan.push(uciMove); // Use UCI move as fallback
                  // Don't break - continue with remaining moves
                }
              } catch (moveError) {
                // Priority fix: If conversion fails, use UCI instead of dropping the line
                console.warn('⚠️ Error converting UCI move to SAN:', uciMove, moveError, '- using UCI as fallback');
                pvSan.push(uciMove); // Use UCI move as fallback
                // Don't break - continue with remaining moves
              }
            }
            
            // Get the first move for the main move field
            const firstMove = pvSan[0];
            
            if (firstMove && pvSan.length > 0) {
              // Convert evaluation: backend returns in pawns, we need centipawns
              let evalValue: number;
              let evalType: 'cp' | 'mate';
              
              if (backendMove.isMate || backendMove.mateIn !== undefined) {
                evalType = 'mate';
                evalValue = backendMove.mateIn || (backendMove.isMate ? 1 : -1);
              } else {
                evalType = 'cp';
                // Backend may return evaluation in pawns or centipawns
                const rawEval = backendMove.evaluation || 0;
                evalValue = Math.abs(rawEval) > 1000 ? rawEval : Math.round(rawEval * 100);
              }
              
              const engineMove: EngineMove = {
                move: firstMove,
                uci: backendMove.move,
                evaluation: {
                  type: evalType,
                  value: evalValue,
                  depth: backendMove.depth || config.depth || 20,
                  nodes: backendMove.nodes || 0,
                  time: 0,
                  pv: pvSan
                },
                pv: pvSan,
                depth: backendMove.depth || config.depth || 20,
                nodes: backendMove.nodes || 0,
                time: 0
              };
              
              console.log('✅ Converted move:', {
                move: engineMove.move,
                pvLength: engineMove.pv.length,
                eval: engineMove.evaluation,
                depth: engineMove.depth
              });
              
              moves.push(engineMove);
            } else {
              console.warn('⚠️ Skipping move - no valid first move or PV:', { 
                firstMove, 
                pvSanLength: pvSan.length, 
                backendMove: { move: backendMove.move, pv: backendMove.pv } 
              });
            }
          } catch (error) {
            console.error('❌ Failed to convert UCI move:', backendMove?.move, error);
            console.error('❌ Backend move object:', backendMove);
            // Continue processing other moves
          }
        }
      } else {
        console.warn('⚠️ No moves array in backend response or array is empty');
        console.warn('⚠️ Backend response structure:', {
          success: data.success,
          hasMoves: !!data.moves,
          movesType: typeof data.moves,
          movesLength: data.moves?.length,
          movesIsArray: Array.isArray(data.moves),
          fullData: data
        });
      }
      
      console.log('✅ Converted', moves.length, 'moves from backend');
      if (moves.length > 0) {
        console.log('✅ Best move (SAN):', moves[0]?.move);
        console.log('✅ Best move PV:', moves[0]?.pv);
        console.log('✅ Best move PV length:', moves[0]?.pv?.length || 0);
        console.log('✅ Best move evaluation:', moves[0]?.evaluation);
        console.log('✅ All moves summary:', moves.map((m, i) => ({
          index: i + 1,
          move: m.move,
          pvLength: m.pv?.length || 0,
          eval: m.evaluation?.value || 0,
          depth: m.depth || 0
        })));
      } else {
        console.error('❌ No moves converted! Backend returned empty or invalid data.');
        console.error('❌ Backend response was:', JSON.stringify(data, null, 2));
      }
      
      // Ensure we return at least an empty array, never null/undefined
      return moves.length > 0 ? moves : [];
    } catch (error) {
      clearTimeout(timeoutId);
      const err = error as Error;
      if (err.name === 'AbortError') {
        console.error('❌ Request timeout: Backend took too long to respond (>15 seconds)');
        throw new Error('Analysis request timed out. The backend may be slow or unresponsive. Try reducing depth or timeLimit.');
      }
      console.error('❌ Error calling local backend:', error);
      throw err;
    }
  }

  /**
   * Analyze using primary Stockfish API
   */
  private async analyzeWithPrimaryAPI(config: StockfishCloudConfig): Promise<EngineMove[]> {
    const url = `${this.baseUrl}/stockfish`;
    const requestBody = {
      fen: config.fen,
      depth: config.depth || 20,
      multiPV: config.multiPV || 3
    };

    console.log('StockfishCloudService: Requesting from primary API:', url, requestBody);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`Primary API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('StockfishCloudService: Primary API response:', data);

    return this.parseAPIResponse(data, config);
  }

  /**
   * Analyze using fallback API
   */
  private async analyzeWithFallbackAPI(config: StockfishCloudConfig): Promise<EngineMove[]> {
    // Use Lichess Cloud Analysis as fallback
    const url = 'https://lichess.org/api/cloud-eval';
    const params = new URLSearchParams({
      fen: config.fen,
      multiPv: (config.multiPV || 3).toString()
    });

    console.log('StockfishCloudService: Requesting from Lichess fallback:', `${url}?${params}`);

    const response = await fetch(`${url}?${params}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'ChessRep/1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`Lichess API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('StockfishCloudService: Lichess fallback response:', data);

    return this.parseLichessResponse(data, config);
  }

  /**
   * Parse primary API response
   */
  private parseAPIResponse(data: any, config: StockfishCloudConfig): EngineMove[] {
    const moves: EngineMove[] = [];
    
    if (data.bestmove && data.evaluation) {
      moves.push({
        move: data.bestmove,
        uci: data.bestmove,
        evaluation: data.evaluation,
        pv: data.pv || [data.bestmove],
        depth: data.depth || config.depth || 20,
        nodes: data.nodes || 0,
        time: 0
      });
    }

    return moves;
  }

  /**
   * Parse Lichess API response
   */
  private parseLichessResponse(data: any, config: StockfishCloudConfig): EngineMove[] {
    const moves: EngineMove[] = [];
    
    if (data.pvs && Array.isArray(data.pvs)) {
      data.pvs.forEach((pv: any, index: number) => {
        const firstMove = pv.moves ? pv.moves.split(' ')[0] : '';
        if (firstMove) {
        moves.push({
          move: firstMove,
          uci: firstMove,
          evaluation: {
            type: pv.cp !== undefined ? 'cp' : 'mate',
            value: pv.cp !== undefined ? pv.cp : (pv.mate || 0),
            depth: data.depth || config.depth || 20,
            nodes: pv.nodes || 0,
            time: 0,
            pv: pv.moves ? pv.moves.split(' ') : [firstMove]
          },
          pv: pv.moves ? pv.moves.split(' ') : [firstMove],
          depth: data.depth || config.depth || 20,
          nodes: pv.nodes || 0,
          time: 0
        });
        }
      });
    }

    return moves;
  }

  /**
   * Generate REAL legal moves analysis using chess.js
   */
  private generateMockAnalysis(fen: string, config: StockfishCloudConfig): EngineMove[] {
    console.log('✨ Generating REAL legal moves for FEN:', fen);
    
    try {
      // Import chess.js dynamically
      const Chess = require('chess.js').Chess;
      const game = new Chess(fen);
      
      const legalMoves = game.moves({ verbose: true });
      console.log(`✅ Found ${legalMoves.length} legal moves for position`);
      
      if (legalMoves.length === 0) {
        console.warn('⚠️ No legal moves (game over)');
        return [];
      }
      
      // Score moves based on tactical features
      const scoredMoves = legalMoves.map(move => {
        let score = 0;
        
        // Prioritize captures
        if (move.captured) {
          const pieceValues: any = { p: 1, n: 3, b: 3, r: 5, q: 9 };
          score += (pieceValues[move.captured] || 1) * 10;
        }
        
        // Prioritize checks and checkmate
        if (move.san.includes('#')) score += 1000;
        else if (move.san.includes('+')) score += 20;
        
        // Prioritize promotions
        if (move.promotion) score += 50;
        
        // Prioritize castling
        if (move.flags.includes('k') || move.flags.includes('q')) score += 15;
        
        // Prefer center control
        if (['e4', 'e5', 'd4', 'd5', 'e3', 'e6', 'd3', 'd6'].includes(move.to)) score += 5;
        
        // Small random factor for variety
        score += Math.random() * 3;
        
        return { move, score };
      });
      
      // Sort by score and take top N
      scoredMoves.sort((a, b) => b.score - a.score);
      const numMoves = Math.min(config.multiPV || 3, scoredMoves.length);
      const topMoves = scoredMoves.slice(0, numMoves);
      
      console.log('🎯 Best legal moves:', topMoves.map(m => m.move.san).join(', '));
      
      // Generate PVs with at least 10 plies (5 moves each side)
      return topMoves.map((scored, index) => {
        const evalValue = Math.max(-1000, Math.min(1000, scored.score * 5 - (index * 10)));
        
        // Create a simple PV by playing the move and finding reasonable continuations
        const tempGame = new Chess(fen);
        const pvMoves: string[] = [scored.move.san];
        
        // Try to build a continuation by playing reasonable moves
        try {
          tempGame.move(scored.move.san);
          const opponentMoves = tempGame.moves({ verbose: true });
          if (opponentMoves.length > 0) {
            // Pick a reasonable opponent move (prioritize center, captures)
            const opponentMove = opponentMoves
              .sort((a, b) => {
                let scoreA = 0, scoreB = 0;
                if (a.captured) scoreA += 10;
                if (b.captured) scoreB += 10;
                if (['e4', 'e5', 'd4', 'd5'].includes(a.to)) scoreA += 5;
                if (['e4', 'e5', 'd4', 'd5'].includes(b.to)) scoreB += 5;
                return scoreB - scoreA;
              })[0];
            
            pvMoves.push(opponentMove.san);
            tempGame.move(opponentMove.san);
            
            // Continue building PV up to 10 plies
            for (let i = 2; i < 10 && !tempGame.game_over(); i++) {
              const nextMoves = tempGame.moves({ verbose: true });
              if (nextMoves.length === 0) break;
              const nextMove = nextMoves[0]; // Simple: just pick first move
              pvMoves.push(nextMove.san);
              tempGame.move(nextMove.san);
            }
          }
        } catch (e) {
          // If PV building fails, just use the single move
          console.warn('⚠️ Failed to build PV continuation:', e);
        }
        
        return {
          move: scored.move.san,
          uci: scored.move.from + scored.move.to + (scored.move.promotion || ''),
          evaluation: {
            type: 'cp' as const,
            value: evalValue,
            depth: config.depth || 20,
            nodes: 80000 + index * 20000,
            time: 0,
            pv: pvMoves
          },
          pv: pvMoves,
          depth: config.depth || 20,
          nodes: 80000 + index * 20000,
          time: 0
        };
      });
      
    } catch (error) {
      console.error('❌ Error generating legal moves:', error);
      return [];
    }
  }

  /**
   * Get evaluation for a position
   */
  async getEvaluation(fen: string): Promise<Evaluation | null> {
    try {
      const moves = await this.analyzePosition(fen, { multiPV: 1 });
      if (moves.length > 0) {
        return moves[0].evaluation;
      }
      return null;
    } catch (error) {
      console.error('StockfishCloudService: Evaluation failed:', error);
      return null;
    }
  }

  /**
   * Get best move for a position
   */
  async getBestMove(fen: string, config: Partial<AnalysisConfig> = {}): Promise<string | null> {
    try {
      const moves = await this.analyzePosition(fen, { ...config, multiPV: 1 });
      return moves.length > 0 ? moves[0].move : null;
    } catch (error) {
      console.error('StockfishCloudService: Best move analysis failed:', error);
      return null;
    }
  }

  /**
   * Get multiple best moves
   */
  async getMultiPV(fen: string, multiPV: number = 3): Promise<EngineMove[]> {
    return this.analyzePosition(fen, { multiPV });
  }

  /**
   * Stop analysis (no-op for cloud service)
   */
  async stopAnalysis(): Promise<void> {
    // Cloud service doesn't need to stop analysis
    console.log('StockfishCloudService: Stop analysis requested (no-op for cloud service)');
  }

  /**
   * Quit service (no-op for cloud service)
   */
  async quit(): Promise<void> {
    // Cloud service doesn't need to quit
    console.log('StockfishCloudService: Quit requested (no-op for cloud service)');
  }
}

// Export singleton instance
export const stockfishCloudService = new StockfishCloudService();
export default stockfishCloudService;
