import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Bot, Crown, BarChart3, Play, Clock, RotateCcw } from 'lucide-react';
const TOUCH_BOARD_STYLE = {
  touchAction: 'none',
  WebkitUserSelect: 'none',
  userSelect: 'none'
};

const BotGamePage = () => {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const [game, setGame] = useState(new Chess());
  const [fen, setFen] = useState('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [userRating, setUserRating] = useState(null);
  const [winsCount, setWinsCount] = useState(0);
  const [gameMode, setGameMode] = useState('menu'); // 'menu', 'playing', 'finished'
  const [difficulty, setDifficulty] = useState('intermediate');
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [movesPlayed, setMovesPlayed] = useState(0);
  const [correctMoves, setCorrectMoves] = useState(0);
  const [gameHistory, setGameHistory] = useState([]);
  const [drawnArrows, setDrawnArrows] = useState([]);
  const [highlightedSquares, setHighlightedSquares] = useState([]);
  const [boardSize, setBoardSize] = useState(700);
  const [orientation, setOrientation] = useState('white');
  const [moveHistory, setMoveHistory] = useState([]);
  const [lastMove, setLastMove] = useState(null);
  const [isBotMoving, setIsBotMoving] = useState(false);
  const [gameResult, setGameResult] = useState(null);
  const timerRef = useRef(null);

  const difficulties = [
    { id: 'beginner', name: 'Beginner', elo: 1200, description: 'Easy moves, good for learning' },
    { id: 'intermediate', name: 'Intermediate', elo: 1600, description: 'Balanced play' },
    { id: 'advanced', name: 'Advanced', elo: 1800, description: 'Strong tactical play' },
    { id: 'expert', name: 'Expert', elo: 2000, description: 'Very strong play' }
  ];

  // Calculate responsive board size
  const getResponsiveBoardSize = () => {
    if (typeof window !== 'undefined') {
      const screenWidth = window.innerWidth;
      if (screenWidth < 640) { // Mobile
        return Math.min(screenWidth - 40, 350);
      } else if (screenWidth < 768) { // Small tablet
        return Math.min(screenWidth - 80, 450);
      } else if (screenWidth < 1024) { // Tablet
        return Math.min(screenWidth - 120, 550);
      } else { // Desktop
        return Math.min(700, 600);
      }
    }
    return 700;
  };

  // Update board size on window resize
  useEffect(() => {
    const updateBoardSize = () => {
      setBoardSize(getResponsiveBoardSize());
    };

    updateBoardSize();
    window.addEventListener('resize', updateBoardSize);
    return () => window.removeEventListener('resize', updateBoardSize);
  }, []);

  // Timer functionality
  useEffect(() => {
    if (isTimerRunning && timeLeft > 0) {
      timerRef.current = setTimeout(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsTimerRunning(false);
      setGameMode('finished');
      setGameResult('Time\'s up! Bot wins!');
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [isTimerRunning, timeLeft]);

  // Load user rating on component mount
  useEffect(() => {
    const loadUserRating = async () => {
      if (!user) return;
      
      try {
        const response = await fetch('http://localhost:3001/api/users/rating', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setUserRating(data.rating);
        }
      } catch (error) {
        console.error('Error loading user rating:', error);
      }
    };

    loadUserRating();
  }, [user]);

  // Play move sound
  const playMoveSound = useCallback(() => {
    try {
      const audio = new Audio('/sounds/move.mp3');
      audio.volume = 0.3;
      audio.play().catch(() => {});
    } catch (error) {
      console.log('Could not play move sound:', error);
    }
  }, []);

  // Request a bot move from the backend and apply it
  const requestAndApplyBotMove = useCallback(async (currentFen) => {
    setIsBotMoving(true);
    try {
      const diffToElo = { beginner: 1400, intermediate: 1600, advanced: 1800, expert: 2000 };
      const payload = {
        fen: currentFen,
        difficulty: diffToElo[difficulty] || 1200,
        personality: 'positional',
        timeControl: 'rapid'
      };

      const res = await fetch('http://localhost:3001/api/bot/move', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        setFeedback('Bot move failed. Try your next move.');
        return;
      }

      const data = await res.json();
      
      if (data.gameOver) {
        setGameMode('finished');
        setGameResult(data.result === 'checkmate' ? 'Checkmate! Bot wins!' : 
                     data.result === 'draw' ? 'Draw!' : 
                     data.result === 'stalemate' ? 'Stalemate! Draw!' : 'Game Over!');
        return;
      }

      // data.move is SAN, data.fen is new FEN after bot move
      const beforeBot = new Chess(currentFen);
      let botMoveObj = null;
      try {
        botMoveObj = beforeBot.move(data.move, { sloppy: true });
      } catch (_) {}

      // Apply bot position from returned FEN for full accuracy
      const afterBot = new Chess(data.fen || beforeBot.fen());
      
      // Batch state updates to prevent flashing
      setTimeout(() => {
        setGame(afterBot);
        setFen(afterBot.fen());
        
        // Add bot move to move history
        if (data.move) {
          setMoveHistory(prev => [...prev, data.move]);
          console.log('Bot move added to history:', data.move);
        }
        
        // Show opponent arrow (red)
        if (botMoveObj && botMoveObj.from && botMoveObj.to) {
          const botArrow = { from: botMoveObj.from, to: botMoveObj.to, color: '#ef4444' };
          setDrawnArrows([botArrow]);
        } else {
          // Fallback: no arrow if we couldn't parse SAN
          setDrawnArrows([]);
        }
        
        setIsBotMoving(false);
      }, 100); // Small delay to batch updates

      // Update feedback
      if (afterBot.isCheckmate()) {
        setFeedback('Checkmate! Bot wins!');
        setGameMode('finished');
        setGameResult('Checkmate! Bot wins!');
      } else if (afterBot.isDraw()) {
        setFeedback('Draw!');
        setGameMode('finished');
        setGameResult('Draw!');
      } else if (afterBot.isCheck()) {
        setFeedback('Check!');
      } else {
        setFeedback('Bot played: ' + data.move);
      }

    } catch (error) {
      console.error('Error requesting bot move:', error);
      setFeedback('Bot move failed. Try your next move.');
      setIsBotMoving(false);
    }
  }, [difficulty]);

  // Handle piece drop
  const onPieceDrop = useCallback((sourceSquare, targetSquare, piece) => {
    if (gameMode !== 'playing' || isBotMoving) return false;

    try {
      const move = game.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: piece[1] === 'p' && (targetSquare[1] === '8' || targetSquare[1] === '1') ? 'q' : undefined
      });

      if (!move) return false;

      // Play move sound
      playMoveSound();

      // Update game state
      setGame(game);
      setFen(game.fen());
      setMoveHistory(prev => [...prev, move.san]);
      setLastMove({ from: sourceSquare, to: targetSquare });

      // Show player move arrow (green)
      const playerArrow = { from: sourceSquare, to: targetSquare, color: '#22c55e' };
      setDrawnArrows([playerArrow]);

      // Check for game over
      if (game.isGameOver()) {
        setGameMode('finished');
        if (game.isCheckmate()) {
          setGameResult('Checkmate! You win!');
          setFeedback('Checkmate! You win!');
          setWinsCount(prev => prev + 1);
        } else if (game.isDraw()) {
          setGameResult('Draw!');
          setFeedback('Draw!');
        }
        setIsTimerRunning(false);
        return true;
      }

      // Update feedback
      if (game.isCheck()) {
        setFeedback('Check!');
      } else {
        setFeedback('Good move!');
      }

      // Bot's turn - make bot move after a short delay
      setTimeout(() => {
        requestAndApplyBotMove(game.fen());
      }, 500);

      return true;
    } catch (error) {
      console.error('Error making move:', error);
      return false;
    }
  }, [game, gameMode, isBotMoving, playMoveSound, requestAndApplyBotMove]);

  // Start new game
  const startNewGame = useCallback(() => {
    const newGame = new Chess();
    setGame(newGame);
    setFen(newGame.fen());
    setMoveHistory([]);
    setLastMove(null);
    setDrawnArrows([]);
    setHighlightedSquares([]);
    setGameMode('playing');
    setGameResult(null);
    setFeedback('Make your first move!');
    setTimeLeft(300); // Reset timer
    setIsTimerRunning(true);
    setIsBotMoving(false);
  }, []);

  // Reset game
  const resetGame = useCallback(() => {
    const newGame = new Chess();
    setGame(newGame);
    setFen(newGame.fen());
    setMoveHistory([]);
    setLastMove(null);
    setDrawnArrows([]);
    setHighlightedSquares([]);
    setGameMode('menu');
    setGameResult(null);
    setFeedback('');
    setTimeLeft(300);
    setIsTimerRunning(false);
    setIsBotMoving(false);
  }, []);

  // Analyze game function
  const analyzeGame = useCallback(() => {
    if (moveHistory.length === 0) {
      alert('No moves to analyze yet!');
      return;
    }

    console.log('Analyzing game with moves:', moveHistory);

    // Create a complete PGN string
    let pgnMoves = '';
    const chess = new Chess();
    
    console.log('Generating PGN from moves:', moveHistory);
    
    // Play all moves to generate proper PGN
    for (const move of moveHistory) {
      try {
        const result = chess.move(move, { sloppy: true });
        if (result) {
          pgnMoves += result.san + ' ';
          console.log('Added move to PGN:', result.san);
        } else {
          console.error('Failed to play move:', move);
        }
      } catch (error) {
        console.error('Error playing move for PGN:', move, error);
      }
    }
    
    console.log('Generated PGN moves:', pgnMoves.trim());

    // Create complete PGN with headers
    const pgn = `[Event "Bot Game Analysis"]
[Site "ChessRep"]
[Date "${new Date().toISOString().split('T')[0]}"]
[Round "1"]
[White "Player"]
[Black "Bot (${difficulty})"]
[Result "${gameResult || '*'}"]
[TimeControl "300"]

${pgnMoves.trim()}`;

    console.log('Generated PGN:', pgn);
    console.log('Generated PGN length:', pgn.length);
    console.log('Generated PGN first 200 chars:', pgn.substring(0, 200));

    // Navigate to chess analysis board with PGN
    const encodedPgn = encodeURIComponent(pgn);
    navigate(`/chess-analysis-board?pgn=${encodedPgn}`);
  }, [moveHistory, gameResult, difficulty, navigate]);

  // Format time display
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Menu Screen
  const MenuScreen = () => (
    <div className="max-w-4xl mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-white mb-4 flex items-center justify-center gap-3">
          <Bot className="w-10 h-10" />
          Play Against Bot
        </h1>
        <p className="text-gray-300 text-lg">
          Challenge yourself against our chess bot!
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Difficulty Selection */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
          <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-2">
            <Crown className="w-6 h-6" />
            Choose Difficulty
          </h2>
          <div className="space-y-3">
            {difficulties.map((diff) => (
              <button
                key={diff.id}
                onClick={() => setDifficulty(diff.id)}
                className={`w-full p-4 rounded-lg text-left transition-all ${
                  difficulty === diff.id
                    ? 'bg-blue-500 text-white shadow-lg'
                    : 'bg-white/20 text-gray-200 hover:bg-white/30'
                }`}
              >
                <div className="font-semibold">{diff.name}</div>
                <div className="text-sm opacity-80">{diff.description}</div>
                <div className="text-xs opacity-60">~{diff.elo} ELO</div>
              </button>
            ))}
          </div>
        </div>

        {/* Game Info */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
          <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-2">
            <BarChart3 className="w-6 h-6" />
            Game Stats
          </h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Your Rating:</span>
              <span className="text-white font-semibold">{userRating || 'Loading...'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Wins:</span>
              <span className="text-white font-semibold">{winsCount}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Time Control:</span>
              <span className="text-white font-semibold">5 min</span>
            </div>
          </div>
          
          <button
            onClick={startNewGame}
            className="w-full mt-6 bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Play className="w-5 h-5" />
            Start Game
          </button>
        </div>
      </div>
    </div>
  );

  // Game Screen
  const GameScreen = () => (
    <div className="max-w-6xl mx-auto p-6">
      <div className="grid lg:grid-cols-4 gap-6">
        {/* Game Info */}
        <div className="lg:col-span-1 order-1 lg:order-1">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 mb-6">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Game Info
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Time Left:</span>
                <span className={`font-semibold ${timeLeft < 60 ? 'text-red-400' : 'text-white'}`}>
                  {formatTime(timeLeft)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Difficulty:</span>
                <span className="text-white font-semibold capitalize">{difficulty}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Moves:</span>
                <span className="text-white font-semibold">{moveHistory.length}</span>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-white/20">
              <div className="text-sm text-gray-300 mb-2">Feedback:</div>
              <div className="text-white text-sm bg-white/10 rounded p-2 min-h-[2rem]">
                {feedback}
              </div>
            </div>

            <div className="mt-4 space-y-2">
              {gameMode === 'finished' && moveHistory.length > 0 && (
                <button
                  onClick={analyzeGame}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <BarChart3 className="w-4 h-4" />
                  Analyze Game
                </button>
              )}
              <button
                onClick={resetGame}
                className="w-full bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Reset Game
              </button>
            </div>
          </div>
        </div>

        {/* Chess Board */}
        <div className="lg:col-span-3 order-2 lg:order-2">
          <div className="bg-white rounded-lg p-3 sm:p-6 shadow-sm">
            <div
              className="flex justify-center smooth-board"
              style={{ minHeight: boardSize, backgroundColor: '#f0d9b5', ...TOUCH_BOARD_STYLE }}
            >
              <Chessboard
                position={fen}
                onPieceDrop={onPieceDrop}
                boardOrientation={orientation}
                customBoardStyle={{
                  ...TOUCH_BOARD_STYLE,
                  borderRadius: '4px',
                  boxShadow: '0 5px 15px rgba(0, 0, 0, 0.5)'
                }}
                customDarkSquareStyle={{ backgroundColor: '#b58863' }}
                customLightSquareStyle={{ backgroundColor: '#f0d9b5' }}
                customArrows={drawnArrows}
                customSquareStyles={{
                  ...highlightedSquares.reduce((a, c) => ({ ...a, [c]: { backgroundColor: 'rgba(255, 255, 0, 0.4)' } }), {})
                }}
                arePiecesDraggable={gameMode === 'playing' && !isBotMoving}
                areArrowsAllowed={false}
                animationDuration={200}
              />
            </div>
          </div>
        </div>

        {/* Move Notation Display */}
        <div className="lg:col-span-4 order-3 lg:order-3 mt-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Move History
            </h3>
            {moveHistory.length > 0 ? (
              <div className="bg-white/10 rounded-lg p-4 max-h-64 overflow-y-auto">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {moveHistory.map((move, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-white/5 rounded">
                      <span className="text-gray-300">
                        {Math.floor(index / 2) + 1}.
                        {index % 2 === 0 ? '' : '..'}
                      </span>
                      <span className="text-white font-medium">{move}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-gray-400 text-center py-8">
                No moves played yet
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // Finished Screen
  const FinishedScreen = () => (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 text-center">
        <h1 className="text-3xl font-bold text-white mb-4">
          {gameResult}
        </h1>
        <p className="text-gray-300 mb-6">
          Game finished in {moveHistory.length} moves
        </p>
        <div className="space-y-3">
          {moveHistory.length > 0 && (
            <button
              onClick={analyzeGame}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <BarChart3 className="w-5 h-5" />
              Analyze Game
            </button>
          )}
          <button
            onClick={startNewGame}
            className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Play className="w-5 h-5" />
            Play Again
          </button>
          <button
            onClick={resetGame}
            className="w-full bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-5 h-5" />
            Back to Menu
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <style>
        {`
          @keyframes pulse {
            0%, 100% { opacity: 0.8; }
            50% { opacity: 1; }
          }
          
          .smooth-board {
            transition: all 0.3s ease;
          }
        `}
      </style>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
        {gameMode === 'menu' && <MenuScreen />}
        {gameMode === 'playing' && <GameScreen />}
        {gameMode === 'finished' && <FinishedScreen />}
      </div>
    </>
  );
};

export default BotGamePage;




