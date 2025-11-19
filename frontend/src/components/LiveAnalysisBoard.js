import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import StandardChessBoard from './StandardChessBoard';
import { Chess } from 'chess.js';
import { RotateCcw, Brain, BarChart3, MessageSquare, ArrowLeft, ArrowRight, Trash2 } from 'lucide-react';

const LiveAnalysisBoard = () => {
  const location = useLocation();
  const [game, setGame] = useState(new Chess());
  const [fen, setFen] = useState('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
  const [analysis, setAnalysis] = useState(null);
  const [moveHistory, setMoveHistory] = useState([]);
  const [currentMoveIndex, setCurrentMoveIndex] = useState(-1);
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [boardOrientation, setBoardOrientation] = useState('white');
  const [showLegalMoves, setShowLegalMoves] = useState(false);
  const [customArrows, setCustomArrows] = useState([]);
  const [boardSize, setBoardSize] = useState(600);

  // Handle responsive board sizing - same as BlunderPreventerPage
  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth < 768;
      const isTablet = window.innerWidth >= 768 && window.innerWidth < 1280;
      
      if (isMobile) {
        // On mobile, set board to exactly 300px
        setBoardSize(300);
      } else if (isTablet) {
        // On tablet, use medium size
        const tabletSize = Math.min(window.innerWidth - 128, 500);
        setBoardSize(tabletSize);
      } else {
        // On desktop, use the default 600px but ensure it fits
        const desktopSize = Math.min(600, window.innerWidth - 200);
        setBoardSize(desktopSize);
      }
    };

    handleResize(); // Set initial size
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle incoming game data from navigation
  useEffect(() => {
    if (location.state?.gameData) {
      const gameData = location.state.gameData;
      console.log('Loading game data:', gameData);
      
      // If PGN is provided, load the game from PGN
      if (gameData.pgn) {
        try {
          const newGame = new Chess();
          newGame.loadPgn(gameData.pgn);
          setGame(newGame);
          setFen(newGame.fen());
          setMoveHistory(newGame.history({ verbose: true }));
          setCurrentMoveIndex(newGame.history().length - 1);
        } catch (error) {
          console.error('Error loading PGN:', error);
        }
      } else if (gameData.moves && gameData.moves.length > 0) {
        // If moves are provided, reconstruct the game
        try {
          const newGame = new Chess();
          const moves = gameData.moves.map(move => {
            if (typeof move === 'string') {
              return move;
            } else if (move.move) {
              return move.move;
            } else if (move.san) {
              return move.san;
            }
            return move;
          });
          
          moves.forEach(move => {
            newGame.move(move);
          });
          
          setGame(newGame);
          setFen(newGame.fen());
          setMoveHistory(newGame.history({ verbose: true }));
          setCurrentMoveIndex(newGame.history().length - 1);
        } catch (error) {
          console.error('Error loading moves:', error);
        }
      } else if (gameData.fen) {
        // If only FEN is provided, load the position
        try {
          const newGame = new Chess(gameData.fen);
          setGame(newGame);
          setFen(gameData.fen);
        } catch (error) {
          console.error('Error loading FEN:', error);
        }
      }
    }
  }, [location.state]);

  const analyzePosition = useCallback(async (positionFen) => {
    try {
      const response = await fetch('/api/analysis/position', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fen: positionFen, depth: 15, multiPV: 3, timeLimit: 5000 }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setAnalysis(data);
      }
    } catch (error) {
      console.error('Error analyzing position:', error);
    }
  }, []);

  useEffect(() => {
    analyzePosition(fen);
  }, [fen, analyzePosition]);

  const handleMove = useCallback((move, newFen) => {
    const newGame = new Chess(fen);
    const moveResult = newGame.move(move);
    
    if (moveResult) {
      setGame(newGame);
      setFen(newGame.fen());
      setMoveHistory(prev => [...prev, moveResult]);
      setCurrentMoveIndex(prev => prev + 1);
      setSelectedSquare(null);
    }
  }, [fen]);

  const handleSquareClick = useCallback((square) => {
    if (selectedSquare) {
      const move = { from: selectedSquare, to: square };
      const newGame = new Chess(fen);
      const moveResult = newGame.move(move);
      
      if (moveResult) {
        handleMove(moveResult, newGame.fen());
      } else {
        if (game && game.get && game.turn) {
          const piece = game.get(square);
          if (piece && piece.color === game.turn()) {
            setSelectedSquare(square);
          } else {
            setSelectedSquare(null);
          }
        }
      }
    } else {
      if (game && game.get && game.turn) {
        const piece = game.get(square);
        if (piece && piece.color === game.turn()) {
          setSelectedSquare(square);
        }
      }
    }
  }, [selectedSquare, fen, game, handleMove]);

  const goToMove = useCallback((moveIndex) => {
    if (moveIndex < 0 || moveIndex >= moveHistory.length) return;
    
    const newGame = new Chess();
    for (let i = 0; i <= moveIndex; i++) {
      newGame.move(moveHistory[i]);
    }
    
    setGame(newGame);
    setFen(newGame.fen());
    setCurrentMoveIndex(moveIndex);
  }, [moveHistory]);

  const flipBoard = useCallback(() => {
    setBoardOrientation(prev => prev === 'white' ? 'black' : 'white');
  }, []);

  const resetBoard = useCallback(() => {
    const newGame = new Chess();
    setGame(newGame);
    setFen(newGame.fen());
    setMoveHistory([]);
    setCurrentMoveIndex(-1);
    setSelectedSquare(null);
    setCustomArrows([]);
  }, []);

  const getCustomSquareStyles = useCallback(({ square, piece }) => {
    const styles = {};
    
    if (selectedSquare === square) {
      styles.backgroundColor = '#7dd3fc';
    }
    
    if (showLegalMoves && game && game.moves({ square, verbose: true }).length > 0) {
      const moves = game.moves({ square, verbose: true });
      if (moves.some(move => move.from === selectedSquare)) {
        styles.backgroundColor = '#86efac';
      }
    }
    
    return styles;
  }, [selectedSquare, showLegalMoves, game]);

  const getCustomArrows = useCallback(() => {
    const arrows = [...customArrows];
    
    if (selectedSquare && showLegalMoves && game) {
      const moves = game.moves({ square: selectedSquare, verbose: true });
      moves.forEach(move => {
        arrows.push({
          from: move.from,
          to: move.to,
          color: '#3b82f6'
        });
      });
    }
    
    return arrows;
  }, [customArrows, selectedSquare, showLegalMoves, game]);

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chess Board */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold text-gray-800">Live Analysis</h1>
                <div className="flex gap-2">
                  <button
                    onClick={flipBoard}
                    className="p-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
                    title="Flip Board"
                  >
                    <RotateCcw className="w-5 h-5" />
                  </button>
                  <button
                    onClick={resetBoard}
                    className="p-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
                    title="Reset Board"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              <StandardChessBoard
                position={fen}
                onSquareClick={handleSquareClick}
                onPieceDrop={handleMove}
                customSquareStyles={getCustomSquareStyles}
                customArrows={getCustomArrows()}
                orientation={boardOrientation}
                boardSize={boardSize}
              />
              
              {/* Move Navigation */}
              {moveHistory.length > 0 && (
                <div className="mt-4 flex items-center justify-center gap-2">
                  <button
                    onClick={() => goToMove(currentMoveIndex - 1)}
                    disabled={currentMoveIndex <= 0}
                    className="p-2 bg-blue-500 text-white rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <span className="text-sm text-gray-600">
                    Move {currentMoveIndex + 1} of {moveHistory.length}
                  </span>
                  <button
                    onClick={() => goToMove(currentMoveIndex + 1)}
                    disabled={currentMoveIndex >= moveHistory.length - 1}
                    className="p-2 bg-blue-500 text-white rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
          
          {/* Analysis Panel */}
          <div className="space-y-6">
            {/* Analysis Results */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                <Brain className="w-5 h-5 mr-2" />
                Position Analysis
              </h2>
              
              {analysis ? (
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-800">
                      {analysis.evaluation}
                    </div>
                    <div className="text-sm text-gray-600">
                      {analysis.bestMove && `Best: ${analysis.bestMove}`}
                    </div>
                  </div>
                  
                  {analysis.topMoves && analysis.topMoves.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-gray-700 mb-2">Top Moves:</h3>
                      <div className="space-y-2">
                        {analysis.topMoves.map((move, index) => (
                          <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                            <span className="font-mono text-sm">{move.move}</span>
                            <span className="text-sm text-gray-600">{move.evaluation}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center text-gray-500">
                  <Brain className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>Analyzing position...</p>
                </div>
              )}
            </div>
            
            {/* Move History */}
            {moveHistory.length > 0 && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                  <MessageSquare className="w-5 h-5 mr-2" />
                  Move History
                </h2>
                
                <div className="max-h-64 overflow-y-auto">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {moveHistory.map((move, index) => (
                      <div
                        key={index}
                        className={`p-2 rounded cursor-pointer transition-colors ${
                          index === currentMoveIndex
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-50 hover:bg-gray-100'
                        }`}
                        onClick={() => goToMove(index)}
                      >
                        <span className="font-mono">
                          {Math.floor(index / 2) + 1}. {index % 2 === 0 ? '' : '...'} {move.san}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveAnalysisBoard;
