/**
 * Game Review Component
 * Analyzes entire game and classifies moves with CPL (Centipawn Loss)
 */

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Chess } from 'chess.js';
import { 
  Play, Pause, SkipForward, SkipBack, TrendingUp, TrendingDown,
  AlertCircle, CheckCircle, XCircle, Info, Download, Share2
} from 'lucide-react';
import streamingAnalysisService from '../services/StreamingAnalysisService';
import './GameReview.css';

interface MoveClassification {
  move: string;
  san: string;
  moveNumber: number;
  color: 'white' | 'black';
  classification: 'best' | 'good' | 'inaccuracy' | 'mistake' | 'blunder' | 'only';
  cpl: number; // Centipawn Loss
  evaluation: number; // Position evaluation after move
  bestMove?: string;
  alternatives?: Array<{ move: string; evaluation: number }>;
}

interface GameReviewResult {
  moves: MoveClassification[];
  accuracy: number;
  averageCPL: number;
  keyMoments: number[];
  openingECO?: string;
  openingName?: string;
  evalGraph: Array<{ move: number; eval: number }>;
}

interface GameReviewProps {
  pgn: string;
  onClose?: () => void;
  className?: string;
}

export const GameReview: React.FC<GameReviewProps> = ({ pgn, onClose, className = '' }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<GameReviewResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentMoveIndex, setCurrentMoveIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [game, setGame] = useState<Chess | null>(null);

  // Parse PGN
  const parsedGame = useMemo(() => {
    try {
      const chess = new Chess();
      if (chess.loadPgn(pgn)) {
        return chess;
      }
      return null;
    } catch (e) {
      return null;
    }
  }, [pgn]);

  // Classify move based on CPL
  const classifyMove = useCallback((cpl: number, isOnlyMove: boolean): MoveClassification['classification'] => {
    if (isOnlyMove) return 'only';
    if (cpl <= 10) return 'best';
    if (cpl <= 30) return 'good';
    if (cpl <= 60) return 'inaccuracy';
    if (cpl <= 100) return 'mistake';
    return 'blunder';
  }, []);

  // Analyze game
  const analyzeGame = useCallback(async () => {
    if (!parsedGame) {
      setError('Invalid PGN');
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setProgress(0);
    setResult(null);

    try {
      const moves: MoveClassification[] = [];
      const evalGraph: Array<{ move: number; eval: number }> = [];
      const gameCopy = new Chess();
      const history = parsedGame.history({ verbose: true });
      let totalCPL = 0;
      let moveCount = 0;

      // Analyze each move
      for (let i = 0; i < history.length; i++) {
        const move = history[i];
        const moveNumber = Math.floor(i / 2) + 1;
        const color = i % 2 === 0 ? 'white' : 'black';

        // Make move to get position after move
        gameCopy.move(move);
        const fenAfterMove = gameCopy.fen();

        // Analyze position before move to get best move
        const fenBeforeMove = i > 0 
          ? new Chess(parsedGame.history({ verbose: true }).slice(0, i).map(m => `${m.from}${m.to}${m.promotion || ''}`).join(' ')).fen()
          : 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

        // Analyze position before move
        const analysisBefore = await new Promise<{ evaluation: number; bestMove?: string; alternatives?: Array<{ move: string; evaluation: number }> }>((resolve) => {
          let cancel: (() => void) | null = null;
          const pvs: Array<{ evaluation: { value: number }; pv: string[] }> = [];

          cancel = streamingAnalysisService.startAnalysis(
            { fen: fenBeforeMove, multiPV: 3, depthCap: 18, timeLimit: 500 },
            (pv) => {
              pvs.push(pv);
            },
            () => {
              resolve({ evaluation: 0 });
            },
            (allPVs) => {
              if (allPVs.length > 0) {
                const bestEval = allPVs[0].evaluation.value;
                const alternatives = allPVs.slice(1, 3).map(pv => ({
                  move: pv.pv[0] || '',
                  evaluation: pv.evaluation.value
                }));
                resolve({
                  evaluation: bestEval,
                  bestMove: allPVs[0].pv[0],
                  alternatives
                });
              } else {
                resolve({ evaluation: 0 });
              }
            }
          );
        });

        // Analyze position after move
        const analysisAfter = await new Promise<number>((resolve) => {
          streamingAnalysisService.startAnalysis(
            { fen: fenAfterMove, multiPV: 1, depthCap: 18, timeLimit: 500 },
            () => {},
            () => resolve(0),
            (allPVs) => {
              resolve(allPVs.length > 0 ? allPVs[0].evaluation.value : 0);
            }
          );
        });

        // Calculate CPL (Centipawn Loss)
        // CPL = evaluation before move - evaluation after move (adjusted for color)
        const evalBefore = analysisBefore.evaluation;
        const evalAfter = color === 'white' ? analysisAfter : -analysisAfter;
        const cpl = Math.max(0, evalBefore - evalAfter);
        const isOnlyMove = gameCopy.moves().length === 1;

        const classification: MoveClassification = {
          move: `${move.from}${move.to}${move.promotion || ''}`,
          san: move.san,
          moveNumber,
          color,
          classification: classifyMove(cpl, isOnlyMove),
          cpl: Math.round(cpl),
          evaluation: evalAfter,
          bestMove: analysisBefore.bestMove,
          alternatives: analysisBefore.alternatives
        };

        moves.push(classification);
        evalGraph.push({ move: i + 1, eval: evalAfter });
        totalCPL += cpl;
        moveCount++;

        setProgress(Math.round(((i + 1) / history.length) * 100));
      }

      // Calculate accuracy
      const accuracy = Math.max(0, Math.min(100, 100 - (totalCPL / moveCount) / 2));

      // Find key moments (moves with high CPL)
      const keyMoments = moves
        .map((m, i) => ({ index: i, cpl: m.cpl }))
        .filter(m => m.cpl > 60)
        .sort((a, b) => b.cpl - a.cpl)
        .slice(0, 5)
        .map(m => m.index);

      // Try to identify opening
      const openingMoves = parsedGame.history().slice(0, 10).join(' ');
      // Simple opening detection (can be enhanced with opening database)
      let openingName = '';
      let openingECO = '';
      if (openingMoves.includes('e4 e5')) {
        openingName = 'King\'s Pawn Game';
        openingECO = 'C20';
      } else if (openingMoves.includes('d4 d5')) {
        openingName = 'Queen\'s Pawn Game';
        openingECO = 'D00';
      }

      const reviewResult: GameReviewResult = {
        moves,
        accuracy: Math.round(accuracy),
        averageCPL: Math.round(totalCPL / moveCount),
        keyMoments,
        openingECO,
        openingName,
        evalGraph
      };

      setResult(reviewResult);
      setGame(new Chess(pgn));
    } catch (err: any) {
      setError(err.message || 'Analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  }, [parsedGame, pgn, classifyMove]);

  // Play through moves
  useEffect(() => {
    if (!isPlaying || !game || !result) return;

    const interval = setInterval(() => {
      setCurrentMoveIndex(prev => {
        const next = prev + 1;
        if (next >= result.moves.length) {
          setIsPlaying(false);
          return prev;
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying, game, result]);

  // Get classification icon
  const getClassificationIcon = (classification: MoveClassification['classification']) => {
    switch (classification) {
      case 'best':
      case 'only':
        return <CheckCircle className="icon best" />;
      case 'good':
        return <CheckCircle className="icon good" />;
      case 'inaccuracy':
        return <AlertCircle className="icon inaccuracy" />;
      case 'mistake':
        return <XCircle className="icon mistake" />;
      case 'blunder':
        return <XCircle className="icon blunder" />;
    }
  };

  // Get classification color
  const getClassificationColor = (classification: MoveClassification['classification']) => {
    switch (classification) {
      case 'best':
      case 'only':
        return '#4CAF50';
      case 'good':
        return '#8BC34A';
      case 'inaccuracy':
        return '#FFC107';
      case 'mistake':
        return '#FF9800';
      case 'blunder':
        return '#F44336';
    }
  };

  if (!parsedGame) {
    return (
      <div className={`game-review ${className}`}>
        <div className="error-message">
          <AlertCircle className="icon" />
          <p>Invalid PGN. Please provide a valid game.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`game-review ${className}`}>
      <div className="game-review-header">
        <h2>Game Review</h2>
        {onClose && (
          <button onClick={onClose} className="close-btn">
            <XCircle className="icon" />
          </button>
        )}
      </div>

      {!result && !isAnalyzing && (
        <div className="review-start">
          <p>Analyze this game to see move classifications, accuracy, and key moments.</p>
          <button onClick={analyzeGame} className="analyze-btn">
            <Play className="icon" />
            Review Game
          </button>
        </div>
      )}

      {isAnalyzing && (
        <div className="review-progress">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <p>Analyzing game... {progress}%</p>
          <p className="progress-hint">This may take a few minutes for longer games.</p>
        </div>
      )}

      {error && (
        <div className="error-message">
          <AlertCircle className="icon" />
          <p>{error}</p>
        </div>
      )}

      {result && (
        <div className="review-results">
          {/* Summary */}
          <div className="review-summary">
            <div className="summary-item">
              <span className="summary-label">Accuracy</span>
              <span className="summary-value">{result.accuracy}%</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Avg CPL</span>
              <span className="summary-value">{result.averageCPL}</span>
            </div>
            {result.openingName && (
              <div className="summary-item">
                <span className="summary-label">Opening</span>
                <span className="summary-value">{result.openingName} ({result.openingECO})</span>
              </div>
            )}
          </div>

          {/* Eval Graph */}
          <div className="eval-graph">
            <h3>Evaluation Graph</h3>
            <div className="graph-container">
              {result.evalGraph.map((point, i) => (
                <div
                  key={i}
                  className="graph-point"
                  style={{
                    left: `${(i / result.evalGraph.length) * 100}%`,
                    bottom: `${50 + (point.eval / 10)}%`,
                    backgroundColor: point.eval > 0 ? '#4CAF50' : point.eval < 0 ? '#F44336' : '#9E9E9E'
                  }}
                />
              ))}
            </div>
          </div>

          {/* Key Moments */}
          {result.keyMoments.length > 0 && (
            <div className="key-moments">
              <h3>Key Moments</h3>
              <div className="moments-list">
                {result.keyMoments.map((index) => {
                  const move = result.moves[index];
                  return (
                    <div key={index} className="moment-item">
                      {getClassificationIcon(move.classification)}
                      <div>
                        <strong>Move {move.moveNumber}</strong> ({move.color})
                        <p>{move.san} - {move.classification.toUpperCase()} ({move.cpl} CPL)</p>
                        {move.bestMove && (
                          <p className="best-move-hint">Best: {move.bestMove}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Move List */}
          <div className="moves-list">
            <h3>Move-by-Move Analysis</h3>
            <div className="moves-container">
              {result.moves.map((move, index) => (
                <div
                  key={index}
                  className={`move-item ${currentMoveIndex === index ? 'current' : ''} ${move.classification}`}
                  onClick={() => setCurrentMoveIndex(index)}
                >
                  <div className="move-classification">
                    {getClassificationIcon(move.classification)}
                    <span className="move-number">{move.moveNumber}.</span>
                    <span className="move-san">{move.san}</span>
                  </div>
                  <div className="move-details">
                    <span className="move-cpl" style={{ color: getClassificationColor(move.classification) }}>
                      {move.cpl} CPL
                    </span>
                    {move.bestMove && move.bestMove !== move.san && (
                      <span className="best-move">Best: {move.bestMove}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Controls */}
          <div className="review-controls">
            <button onClick={() => setIsPlaying(!isPlaying)}>
              {isPlaying ? <Pause className="icon" /> : <Play className="icon" />}
            </button>
            <button onClick={() => setCurrentMoveIndex(0)}>
              <SkipBack className="icon" />
            </button>
            <button onClick={() => setCurrentMoveIndex(result.moves.length - 1)}>
              <SkipForward className="icon" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameReview;








