import React, { useState, useCallback, useEffect } from 'react';
import { Chess } from 'chess.js';
import { ChevronLeft, ChevronRight, RotateCcw, Play, Pause, Square } from 'lucide-react';

const PGNViewer = ({ onClose, initialPGN = '' }) => {
  const [pgnText, setPgnText] = useState(initialPGN);
  const [game, setGame] = useState(new Chess());
  const [moves, setMoves] = useState([]);
  const [currentMoveIndex, setCurrentMoveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playSpeed, setPlaySpeed] = useState(1000); // milliseconds per move
  const [error, setError] = useState('');

  // Load initial PGN when component mounts
  useEffect(() => {
    if (initialPGN && initialPGN.trim()) {
      setPgnText(initialPGN);
      // Auto-load the PGN if it's provided
      setTimeout(() => {
        loadPGN();
      }, 100);
    }
  }, [initialPGN, loadPGN]);

  // Parse PGN and load moves
  const loadPGN = useCallback(() => {
    if (!pgnText.trim()) {
      setError('Please enter a PGN');
      return;
    }

    try {
      setError('');
      const newGame = new Chess();
      const result = newGame.load_pgn(pgnText.trim());
      
      if (!result) {
        setError('Invalid PGN format');
        return;
      }

      const gameMoves = newGame.history({ verbose: true });
      setGame(newGame);
      setMoves(gameMoves);
      setCurrentMoveIndex(0);
      
      // Reset to starting position
      const startGame = new Chess();
      setGame(startGame);
      
      console.log('Loaded PGN with', gameMoves.length, 'moves');
    } catch (err) {
      setError('Error parsing PGN: ' + err.message);
      console.error('PGN parsing error:', err);
    }
  }, [pgnText]);

  // Navigate to a specific move
  const goToMove = useCallback((moveIndex) => {
    if (moveIndex < 0 || moveIndex > moves.length) return;
    
    const newGame = new Chess();
    for (let i = 0; i < moveIndex; i++) {
      newGame.move(moves[i].san);
    }
    
    setGame(newGame);
    setCurrentMoveIndex(moveIndex);
  }, [moves]);

  // Auto-play moves
  useEffect(() => {
    if (!isPlaying || currentMoveIndex >= moves.length) {
      setIsPlaying(false);
      return;
    }

    const timer = setTimeout(() => {
      goToMove(currentMoveIndex + 1);
    }, playSpeed);

    return () => clearTimeout(timer);
  }, [isPlaying, currentMoveIndex, moves.length, playSpeed, goToMove]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.target.tagName === 'TEXTAREA') return; // Don't interfere with text input
      
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          goToMove(currentMoveIndex - 1);
          break;
        case 'ArrowRight':
          e.preventDefault();
          goToMove(currentMoveIndex + 1);
          break;
        case ' ':
          e.preventDefault();
          setIsPlaying(!isPlaying);
          break;
        case 'Home':
          e.preventDefault();
          goToMove(0);
          break;
        case 'End':
          e.preventDefault();
          goToMove(moves.length);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentMoveIndex, moves.length, isPlaying, goToMove]);

  const handleMoveClick = (moveIndex) => {
    goToMove(moveIndex);
  };

  const togglePlay = () => {
    if (currentMoveIndex >= moves.length) {
      goToMove(0);
    }
    setIsPlaying(!isPlaying);
  };

  const resetGame = () => {
    goToMove(0);
    setIsPlaying(false);
  };

  const goToEnd = () => {
    goToMove(moves.length);
    setIsPlaying(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-bold">PGN Game Viewer</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="flex flex-col lg:flex-row h-[calc(90vh-80px)]">
          {/* Left Panel - PGN Input and Controls */}
          <div className="w-full lg:w-1/3 p-4 border-r flex flex-col">
            {/* PGN Input */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Paste PGN Here:
              </label>
              <textarea
                value={pgnText}
                onChange={(e) => setPgnText(e.target.value)}
                placeholder="Paste your PGN here..."
                className="w-full h-32 p-3 border border-gray-300 rounded-md resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {error && (
                <div className="text-red-600 text-sm mt-2">{error}</div>
              )}
              <button
                onClick={loadPGN}
                className="mt-2 w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Load Game
              </button>
            </div>

            {/* Controls */}
            <div className="space-y-4">
              {/* Navigation Controls */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => goToMove(currentMoveIndex - 1)}
                  disabled={currentMoveIndex === 0}
                  className="p-2 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                
                <button
                  onClick={togglePlay}
                  className="p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>
                
                <button
                  onClick={() => goToMove(currentMoveIndex + 1)}
                  disabled={currentMoveIndex >= moves.length}
                  className="p-2 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Quick Navigation */}
              <div className="flex space-x-2">
                <button
                  onClick={resetGame}
                  className="flex-1 bg-gray-200 px-3 py-2 rounded-md hover:bg-gray-300 text-sm"
                >
                  <RotateCcw className="w-4 h-4 inline mr-1" />
                  Start
                </button>
                <button
                  onClick={goToEnd}
                  className="flex-1 bg-gray-200 px-3 py-2 rounded-md hover:bg-gray-300 text-sm"
                >
                  <Square className="w-4 h-4 inline mr-1" />
                  End
                </button>
              </div>

              {/* Play Speed */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Play Speed: {playSpeed}ms
                </label>
                <input
                  type="range"
                  min="200"
                  max="3000"
                  step="100"
                  value={playSpeed}
                  onChange={(e) => setPlaySpeed(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              {/* Move Counter */}
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {currentMoveIndex} / {moves.length}
                </div>
                <div className="text-sm text-gray-500">
                  {moves.length > 0 && currentMoveIndex < moves.length ? 
                    `Move: ${moves[currentMoveIndex]?.san}` : 
                    'Game Complete'
                  }
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel - Chess Board and Move List */}
          <div className="w-full lg:w-2/3 flex flex-col">
            {/* Chess Board */}
            <div className="flex-1 p-4 flex items-center justify-center bg-gray-100">
              <div className="w-96 h-96 bg-white border-2 border-gray-300 rounded-lg shadow-lg">
                {/* Simple ASCII board representation */}
                <div className="w-full h-full p-4 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-6xl mb-4">♔</div>
                    <div className="text-lg text-gray-600">
                      {currentMoveIndex === 0 ? 'Starting Position' : 
                       currentMoveIndex >= moves.length ? 'Game Complete' :
                       `After ${moves[currentMoveIndex]?.san}`}
                    </div>
                    <div className="text-sm text-gray-500 mt-2">
                      {game.fen()}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Move List */}
            <div className="h-48 border-t overflow-y-auto">
              <div className="p-4">
                <h3 className="font-semibold mb-2">Move List:</h3>
                <div className="grid grid-cols-2 gap-1 text-sm">
                  {moves.map((move, index) => (
                    <button
                      key={index}
                      onClick={() => handleMoveClick(index + 1)}
                      className={`p-2 text-left rounded hover:bg-gray-100 ${
                        index === currentMoveIndex - 1 ? 'bg-blue-100 border border-blue-300' : ''
                      }`}
                    >
                      <span className="font-mono">
                        {Math.floor(index / 2) + 1}.
                        {index % 2 === 0 ? '' : '..'}
                        {move.san}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer with instructions */}
        <div className="p-3 bg-gray-50 border-t text-xs text-gray-600">
          <div className="flex flex-wrap gap-4">
            <span>← → Navigate moves</span>
            <span>Space: Play/Pause</span>
            <span>Home: Start</span>
            <span>End: Finish</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PGNViewer;

