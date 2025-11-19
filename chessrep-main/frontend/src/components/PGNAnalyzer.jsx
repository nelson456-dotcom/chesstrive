import React, { useState, useCallback, useEffect } from 'react';
import { Chess } from 'chess.js';
import { ChevronLeft, ChevronRight, RotateCcw, Play, Pause, Square, Download, Upload } from 'lucide-react';

const PGNAnalyzer = () => {
  const [pgnText, setPgnText] = useState('');
  const [game, setGame] = useState(new Chess());
  const [moves, setMoves] = useState([]);
  const [currentMoveIndex, setCurrentMoveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playSpeed, setPlaySpeed] = useState(1000); // milliseconds per move
  const [error, setError] = useState('');
  const [gameInfo, setGameInfo] = useState({});

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
      
      // Extract game information from PGN headers
      const headers = {};
      const lines = pgnText.split('\n');
      lines.forEach(line => {
        const match = line.match(/\[(\w+)\s+"([^"]+)"\]/);
        if (match) {
          headers[match[1]] = match[2];
        }
      });
      
      setGameInfo(headers);
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

  const exportCurrentPGN = () => {
    const pgn = game.pgn();
    const blob = new Blob([pgn], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'game.pgn';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const loadSamplePGN = () => {
    const samplePGN = `[Event "FIDE World Championship 2023"]
[Site "Astana KAZ"]
[Date "2023.04.30"]
[Round "1"]
[White "Nepomniachtchi, Ian"]
[Black "Ding, Liren"]
[Result "1/2-1/2"]
[WhiteElo "2795"]
[BlackElo "2788"]
[ECO "C88"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 d6 8. c3 O-O 9. h3 Nb8 10. d4 Nbd7 11. c4 c6 12. cxb5 axb5 13. Nc3 Bb7 14. Ng5 c5 15. Nf3 Re8 16. d5 c4 17. Bc2 Nc5 18. a4 bxa4 19. Rxa4 Bd7 20. Ra2 Qb6 21. Be3 Qb7 22. Qd2 Rf8 23. h4 h6 24. Nh2 Nh7 25. g3 Ng6 26. Ng4 Nf6 27. Nxf6+ Bxf6 28. Bg5 Bxg5 29. hxg5 Qb6 30. Qf4 Qxb2 31. Rxb2 Bxb2 32. Bxc4 Ba3 33. Bxf7+ Kh8 34. Be6 Bc5 35. Kg2 Rf6 36. Bc4 Rf2+ 37. Kh3 Rf6 38. Be6 Rf2 39. Bc4 Rf6 40. Be6 1/2-1/2`;
    setPgnText(samplePGN);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">PGN Game Analyzer</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={loadSamplePGN}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Load Sample
              </button>
              <button
                onClick={exportCurrentPGN}
                disabled={moves.length === 0}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="w-4 h-4 inline mr-2" />
                Export PGN
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Panel - PGN Input and Game Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* PGN Input */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Paste PGN</h2>
              <textarea
                value={pgnText}
                onChange={(e) => setPgnText(e.target.value)}
                placeholder="Paste your PGN here..."
                className="w-full h-64 p-3 border border-gray-300 rounded-md resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
              />
              {error && (
                <div className="text-red-600 text-sm mt-2">{error}</div>
              )}
              <button
                onClick={loadPGN}
                className="mt-4 w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                <Upload className="w-4 h-4 inline mr-2" />
                Load Game
              </button>
            </div>

            {/* Game Information */}
            {Object.keys(gameInfo).length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Game Information</h3>
                <div className="space-y-2 text-sm">
                  {Object.entries(gameInfo).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="font-medium text-gray-600">{key}:</span>
                      <span className="text-gray-900">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Controls */}
            {moves.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Controls</h3>
                
                {/* Navigation Controls */}
                <div className="flex items-center justify-center space-x-2 mb-4">
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
                <div className="flex space-x-2 mb-4">
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
                <div className="mb-4">
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
            )}
          </div>

          {/* Right Panel - Chess Board and Move List */}
          <div className="lg:col-span-2 space-y-6">
            {/* Chess Board */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Chess Board</h3>
              <div className="flex items-center justify-center">
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
                      <div className="text-sm text-gray-500 mt-2 font-mono">
                        {game.fen()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Move List */}
            {moves.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Move List</h3>
                <div className="grid grid-cols-2 gap-1 text-sm max-h-64 overflow-y-auto">
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
            )}
          </div>
        </div>

        {/* Footer with instructions */}
        <div className="mt-8 bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600">
            <h4 className="font-semibold mb-2">Keyboard Shortcuts:</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <span>← → Navigate moves</span>
              <span>Space: Play/Pause</span>
              <span>Home: Start</span>
              <span>End: Finish</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PGNAnalyzer;

