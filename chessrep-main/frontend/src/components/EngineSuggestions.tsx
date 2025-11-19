import React, { useState, useEffect, useRef } from 'react';
import { Chess } from 'chess.js';
import lichessApi, { LichessAnalysisResult } from '../services/lichessApi';
import stockfishCloudService from '../services/StockfishCloudService';
import { EngineMove as StockfishEngineMove } from '../types/chess';

interface EngineMove {
  move: string;
  san: string;
  evaluation: string;
  depth: number;
  knodes: number;
  pv: string;
  score?: number; // Add score property for fallback analysis
  wdl?: {
    win: number;
    draw: number;
    loss: number;
  };
}

interface EngineSuggestionsProps {
  currentFEN: string;
  onMoveClick: (from: string, to: string, promotion?: string) => void;
  className?: string;
  isEnabled?: boolean;
  onToggle?: (enabled: boolean) => void;
}

const EngineSuggestions: React.FC<EngineSuggestionsProps> = ({
  currentFEN,
  onMoveClick,
  className = '',
  isEnabled = true,
  onToggle
}) => {
  const [engineMoves, setEngineMoves] = useState<EngineMove[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedMove, setSelectedMove] = useState<string | null>(null);
  const [evaluation, setEvaluation] = useState<string>('0.0');
  const [isReady, setIsReady] = useState(true); // Lichess API is always ready
  const [error, setError] = useState<string | null>(null);
  
  const analysisTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize Lichess API
  useEffect(() => {
    console.log('EngineSuggestions: Initialized with Lichess Cloud Analysis API');
    setIsReady(true);
    setError(null);
    
    return () => {
      // Cleanup any pending analysis
      if (analysisTimeoutRef.current) {
        clearTimeout(analysisTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (isEnabled && isReady) {
      analyzePosition();
    }
  }, [currentFEN, isEnabled, isReady]);

  const analyzePosition = async () => {
    if (!isEnabled || !isReady) {
      console.log('EngineSuggestions: Cannot analyze - isEnabled:', isEnabled, 'isReady:', isReady);
      return;
    }
    
    // Check whose turn it is from the FEN
    if (!currentFEN) return;
    const fenParts = currentFEN.split(' ');
    const turnToMove = fenParts[1]; // 'w' for white, 'b' for black
    
    console.log('EngineSuggestions: Starting analysis with FEN:', currentFEN, 'Turn to move:', turnToMove);
    setIsAnalyzing(true);
    setEngineMoves([]);
    setEvaluation('0.0');
    setError(null);

    // Determine analysis method based on URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const isFromEndgameTrainer = urlParams.has('fen') && !urlParams.has('pgn');
    const isFromLessonsPage = !urlParams.has('fen') || urlParams.has('pgn');
    
    console.log('EngineSuggestions: Analysis source detected:', {
      isFromEndgameTrainer,
      isFromLessonsPage,
      hasFen: urlParams.has('fen'),
      hasPgn: urlParams.has('pgn')
    });

    try {
      // Clear any existing timeout
      if (analysisTimeoutRef.current) {
        clearTimeout(analysisTimeoutRef.current);
      }

      // Use local analysis for endgame trainer positions, Lichess for lessons page
      if (isFromEndgameTrainer) {
        console.log('EngineSuggestions: Using local analysis for endgame trainer position');
        await handleFallbackAnalysis();
      } else {
        console.log('EngineSuggestions: Using Lichess analysis for lessons page position');

      // Call Lichess Cloud Analysis API
      const result = await lichessApi.analyzePosition(currentFEN, 5);
      console.log('EngineSuggestions: Received analysis from Lichess:', result);
      
      // Process the analysis result
      handleLichessAnalysis(result);
      }
      
    } catch (error) {
      console.error('EngineSuggestions: Analysis failed:', error);
      console.error('EngineSuggestions: Error message:', error instanceof Error ? error.message : 'Unknown error');
      console.error('EngineSuggestions: Current FEN being analyzed:', currentFEN);
      
      // Try fallback analysis as backup
      console.log('EngineSuggestions: Attempting fallback analysis as backup...');
      try {
        await handleFallbackAnalysis();
      } catch (fallbackError) {
        console.error('EngineSuggestions: Fallback analysis also failed:', fallbackError);
        setError(`Analysis unavailable: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`);
        setIsAnalyzing(false);
      }
    }
  };

  // Stockfish analysis for accurate local analysis
  const handleFallbackAnalysis = async () => {
    console.log('EngineSuggestions: Running Stockfish analysis for position:', currentFEN);
    
    try {
      const chess = new Chess(currentFEN);
      console.log('EngineSuggestions: Chess instance created successfully');
      
      // Generate basic move suggestions using chess.js
      const moves = chess.moves({ verbose: true });
      console.log('EngineSuggestions: Available moves:', moves.length, moves);
      
      if (moves.length === 0) {
        console.log('EngineSuggestions: No legal moves available');
        setError('No legal moves available in this position');
        setIsAnalyzing(false);
        return;
      }
      
      // Use actual Stockfish for analysis
      const engineMoves = await analyzeWithRealStockfish(currentFEN);
      
      console.log('EngineSuggestions: Generated', engineMoves.length, 'engine moves:', engineMoves);
      
      if (engineMoves.length === 0) {
        console.log('EngineSuggestions: No engine moves generated, this might be a checkmate or stalemate position');
        setError('No engine suggestions available - this might be a checkmate or stalemate position');
        setIsAnalyzing(false);
        return;
      }
      
      setEngineMoves(engineMoves);
      setEvaluation(engineMoves[0]?.evaluation || '0.0');
      setError(null); // Clear error since fallback analysis is working
      setIsAnalyzing(false);
      
      console.log('EngineSuggestions: Stockfish analysis completed successfully with', engineMoves.length, 'moves');
      
    } catch (error) {
      console.error('EngineSuggestions: Stockfish analysis failed:', error);
      throw error;
    }
  };

  // Real Stockfish analysis function using StockfishCloudService
  const analyzeWithRealStockfish = async (fen: string): Promise<EngineMove[]> => {
    try {
      console.log('EngineSuggestions: Starting Stockfish Cloud analysis for FEN:', fen);
      console.log('EngineSuggestions: StockfishCloudService ready:', stockfishCloudService.isEngineReady());
      
      // Cloud service is always ready, no need to wait
      if (!stockfishCloudService.isEngineReady()) {
        throw new Error('StockfishCloudService not ready');
      }
      
      // Use the Stockfish Cloud Service
      const moves: StockfishEngineMove[] = await stockfishCloudService.analyzePosition(fen, {
        depth: 22,
        multiPV: 3,
        timeLimit: 15000
      });
      
      console.log('EngineSuggestions: Received moves from StockfishCloudService:', moves);
      
      // Convert the moves to the expected format
      const engineMoves: EngineMove[] = [];
      const chess = new Chess(fen);
      
      // Convert StockfishCloudService moves to EngineMove format
      for (let i = 0; i < moves.length; i++) {
        const stockfishMove = moves[i];
        
        // Convert UCI move to SAN if possible
        let sanMove = stockfishMove.move;
        try {
          // Try to convert UCI to SAN using chess.js
          const from = stockfishMove.move.substring(0, 2);
          const to = stockfishMove.move.substring(2, 4);
          const promotion = stockfishMove.move.length > 4 ? stockfishMove.move.substring(4) : undefined;
          
          const legalMoves = chess.moves({ verbose: true });
          const matchingMove = legalMoves.find(move => 
            move.from === from && 
            move.to === to && 
            (move.promotion || '') === (promotion || '')
          );
          
          if (matchingMove) {
            sanMove = matchingMove.san;
          }
        } catch (error) {
          console.warn('EngineSuggestions: Could not convert UCI to SAN:', stockfishMove.move);
        }
        
        // Format evaluation
        let evaluationStr = '0.0';
        if (stockfishMove.evaluation.type === 'mate') {
          evaluationStr = stockfishMove.evaluation.value > 0 ? 
            `+M${stockfishMove.evaluation.value}` : 
            `-M${Math.abs(stockfishMove.evaluation.value)}`;
        } else {
          const score = stockfishMove.evaluation.value / 100;
          evaluationStr = score > 0 ? `+${score.toFixed(1)}` : score.toFixed(1);
        }
        
        engineMoves.push({
          move: stockfishMove.move,
          san: sanMove,
          evaluation: evaluationStr,
          score: stockfishMove.evaluation.value,
          depth: stockfishMove.depth,
          knodes: Math.floor(stockfishMove.nodes / 1000),
          pv: stockfishMove.pv.join(' ')
        });
      }
      
      console.log('EngineSuggestions: Converted to engine moves:', engineMoves);
      return engineMoves;
      
    } catch (error) {
      console.error('EngineSuggestions: Stockfish analysis failed:', error);
      throw error;
    }
  };

  // All hardcoded evaluation functions removed - using REAL Stockfish now

  // Handle Lichess analysis result
  const handleLichessAnalysis = (result: LichessAnalysisResult) => {
    console.log('EngineSuggestions: Processing Lichess analysis result:', result);
    
    try {
      const chess = new Chess(currentFEN);
      const moves: EngineMove[] = [];
      
      // Process each PV (Principal Variation)
      result.pvs.forEach((pv, index) => {
        const firstMove = pv.moves ? pv.moves.split(' ')[0] : '';
        if (!firstMove) return;
        
        // Convert UCI move to SAN
        const sanMove = convertUCIToSAN(firstMove, chess);
        if (!sanMove) {
          console.error('EngineSuggestions: Failed to convert UCI move to SAN:', firstMove);
          return;
        }
        
        const engineMove: EngineMove = {
          move: firstMove,
          san: sanMove,
          evaluation: lichessApi.formatEvaluation(pv.evaluation),
          depth: result.depth,
          knodes: result.knodes,
          pv: pv.moves,
          wdl: result.wdl
        };
        
        moves.push(engineMove);
        console.log(`EngineSuggestions: Added move ${index + 1}:`, engineMove);
      });
      
      // Update state
      setEngineMoves(moves);
      setEvaluation(lichessApi.formatEvaluation(result.evaluation));
      setIsAnalyzing(false);
      
      console.log('EngineSuggestions: Analysis complete, moves:', moves.length);
      
    } catch (error) {
      console.error('EngineSuggestions: Error processing Lichess analysis:', error);
      setError('Error processing analysis result');
      setIsAnalyzing(false);
    }
  };

  // Convert UCI move to SAN notation
  const convertUCIToSAN = (uciMove: string, chess: Chess): string | null => {
    if (uciMove.length < 4) return null;
    
    const from = uciMove.substring(0, 2);
    const to = uciMove.substring(2, 4);
    const promotion = uciMove.length > 4 ? uciMove.substring(4) : undefined;
    
    // Get all legal moves and find the one that matches
    const legalMoves = chess.moves({ verbose: true });
    const matchingMove = legalMoves.find(move => 
      move.from === from && 
      move.to === to && 
      (move.promotion || '') === (promotion || '')
    );
    
    return matchingMove ? matchingMove.san : null;
  };


  const handleMoveClick = (move: EngineMove) => {
    setSelectedMove(move.move);
    // move.move is already in UCI format (e.g., "e2e4")
    const from = move.move.substring(0, 2);
    const to = move.move.substring(2, 4);
    const promotion = move.move.length > 4 ? move.move.substring(4) : undefined;
    onMoveClick(from, to, promotion);
  };

  const formatEvaluation = (evaluation: string) => {
    return evaluation;
  };

  const getEvaluationColor = (evaluation: string) => {
    const numEval = parseFloat(evaluation.replace(/[+\-M]/g, ''));
    if (evaluation.includes('M') && evaluation.startsWith('+')) return '#10b981'; // green - mate in favor
    if (evaluation.includes('M') && evaluation.startsWith('-')) return '#ef4444'; // red - mate against
    if (numEval > 50) return '#10b981'; // green - winning
    if (numEval > 10) return '#3b82f6'; // blue - good
    if (numEval > -10) return '#6b7280'; // gray - equal
    if (numEval > -50) return '#f59e0b'; // yellow - bad
    return '#ef4444'; // red - losing
  };

  const getEvaluationText = (evaluation: string) => {
    if (evaluation.includes('M') && evaluation.startsWith('+')) return 'Mate';
    if (evaluation.includes('M') && evaluation.startsWith('-')) return 'Mate';
    const numEval = parseFloat(evaluation.replace(/[+\-]/g, ''));
    if (numEval > 50) return 'Winning';
    if (numEval > 10) return 'Good';
    if (numEval > -10) return 'Equal';
    if (numEval > -50) return 'Bad';
    return 'Losing';
  };

  return (
    <div className={`engine-suggestions ${className}`}>
      <div style={{
        padding: '12px',
        backgroundColor: 'rgba(249, 250, 251, 0.8)',
        borderRadius: '8px',
        marginBottom: '12px'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '8px'
        }}>
          <h3 style={{
            margin: 0,
            fontSize: '14px',
            fontWeight: '600',
            color: '#374151'
          }}>
            🤖 Engine Analysis
            {engineMoves.length > 0 && !error && (
              <span style={{
                fontSize: '10px',
                color: '#6b7280',
                fontWeight: 'normal',
                marginLeft: '8px'
              }}>
                {(() => {
                  const urlParams = new URLSearchParams(window.location.search);
                  const isFromEndgameTrainer = urlParams.has('fen') && !urlParams.has('pgn');
                  return isFromEndgameTrainer ? '(Stockfish Cloud)' : '(Lichess Analysis)';
                })()}
              </span>
            )}
          </h3>
          
          {onToggle && (
            <button
              onClick={() => onToggle(!isEnabled)}
              style={{
                padding: '4px 8px',
                backgroundColor: isEnabled ? 'rgba(239, 68, 68, 0.9)' : 'rgba(16, 185, 129, 0.9)',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '10px',
                fontWeight: '600',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.3)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.2)';
              }}
            >
              {isEnabled ? '⏸️ Pause' : '▶️ Start'}
            </button>
          )}
        </div>
        
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <p style={{
              margin: 0,
              fontSize: '11px',
              color: '#6b7280'
            }}>
              {!isReady ? 'Loading Engine...' : 
               error ? `Error: ${error}` :
               isEnabled ? 'Stockfish Cloud Engine' : 'Engine analysis disabled'}
            </p>
            {isEnabled && isReady && !error && (
              <p style={{
                margin: '2px 0 0 0',
                fontSize: '10px',
                color: currentFEN && currentFEN.split(' ')[1] === 'w' ? '#3b82f6' : '#6b7280',
                fontWeight: '600'
              }}>
                {currentFEN && currentFEN.split(' ')[1] === 'w' ? '⚪ White to move' : '⚫ Black to move'}
              </p>
            )}
          </div>
          
          {isEnabled && !isAnalyzing && (
            <button
              onClick={analyzePosition}
              style={{
                padding: '4px 8px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '10px',
                fontWeight: '600'
              }}
            >
              🔄 Analyze
            </button>
          )}
        </div>
      </div>

              {!isEnabled ? (
                <div style={{
                  textAlign: 'center',
                  padding: '20px',
                  color: '#6b7280',
                  fontSize: '12px'
                }}>
                  <div style={{
                    fontSize: '24px',
                    marginBottom: '8px'
                  }}>
                    ⏸️
                  </div>
                  Engine analysis is paused
                  <br />
                  <button
                    onClick={() => onToggle?.(true)}
                    style={{
                      marginTop: '8px',
                      padding: '6px 12px',
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '11px',
                      fontWeight: '600'
                    }}
                  >
                    ▶️ Start Analysis
                  </button>
                </div>
              ) : error ? (
                <div style={{
                  textAlign: 'center',
                  padding: '20px',
                  color: '#ef4444',
                  fontSize: '12px'
                }}>
                  <div style={{
                    fontSize: '24px',
                    marginBottom: '8px'
                  }}>
                    ❌
                  </div>
                  {error}
                  <br />
                  <button
                    onClick={() => window.location.reload()}
                    style={{
                      marginTop: '8px',
                      padding: '6px 12px',
                      backgroundColor: '#ef4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '11px',
                      fontWeight: '600'
                    }}
                  >
                    🔄 Reload Page
                  </button>
                </div>
      ) : isAnalyzing ? (
        <div style={{
          textAlign: 'center',
          padding: '20px',
          color: '#6b7280',
          fontSize: '12px'
        }}>
          <div style={{
            display: 'inline-block',
            width: '20px',
            height: '20px',
            border: '2px solid #e5e7eb',
            borderTop: '2px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            marginRight: '8px'
          }} />
          Analyzing position...
        </div>
      ) : engineMoves.length > 0 ? (
        <div>
          {/* Overall evaluation */}
          <div style={{
            padding: '8px 12px',
            backgroundColor: getEvaluationColor(evaluation),
            color: 'white',
            borderRadius: '6px',
            marginBottom: '8px',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '14px',
              fontWeight: '600'
            }}>
              {formatEvaluation(evaluation)}
            </div>
            <div style={{
              fontSize: '10px',
              opacity: 0.9
            }}>
              {getEvaluationText(evaluation)}
            </div>
          </div>

          {/* Move suggestions */}
          <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
            {engineMoves.map((move, index) => (
              <div
                key={move.move}
                onClick={() => handleMoveClick(move)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '8px 12px',
                  marginBottom: '4px',
                  backgroundColor: selectedMove === move.move ? '#dbeafe' : 'transparent',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  border: selectedMove === move.move ? '1px solid #3b82f6' : '1px solid transparent',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  if (selectedMove !== move.move) {
                    e.currentTarget.style.backgroundColor = '#f3f4f6';
                  }
                }}
                onMouseOut={(e) => {
                  if (selectedMove !== move.move) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                <div style={{
                  width: '24px',
                  height: '24px',
                  backgroundColor: index === 0 ? '#10b981' : index === 1 ? '#3b82f6' : '#6b7280',
                  color: 'white',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '10px',
                  fontWeight: '600',
                  marginRight: '12px',
                  minWidth: '24px'
                }}>
                  {index + 1}
                </div>
                
                <div style={{ flex: 1 }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '2px'
                  }}>
                    <span style={{
                      fontSize: '12px',
                      fontWeight: '500',
                      color: '#374151'
                    }}>
                      {move.san}
                    </span>
                    <span style={{
                      fontSize: '11px',
                      color: getEvaluationColor(move.evaluation),
                      fontWeight: '600'
                    }}>
                      {formatEvaluation(move.evaluation)}
                    </span>
                  </div>
                  
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '10px',
                    color: '#6b7280'
                  }}>
                    <span>Depth {move.depth}</span>
                    <span>{move.knodes}k nodes</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div style={{
          textAlign: 'center',
          padding: '20px',
          color: '#6b7280',
          fontSize: '12px'
        }}>
          {!isReady ? '🔄 Loading engine...' : 
           error ? `❌ ${error}` :
           '🎯 No engine suggestions available'}
        </div>
      )}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default EngineSuggestions;
