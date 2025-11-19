import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Target, Clock, Zap, Trophy, RotateCcw, Play, Pause, BarChart3, Crown, Sword } from 'lucide-react';

const API_BASE = 'http://localhost:3001/api/advantage';

const AdvantageCapitalisationPage = () => {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const [currentPosition, setCurrentPosition] = useState(null);
  const [game, setGame] = useState(null);
  const [fen, setFen] = useState('');
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
  const [showHint, setShowHint] = useState(false);
  const [hintText, setHintText] = useState('');
  const moveSoundRef = useRef(null);
  const captureSoundRef = useRef(null);
  const castleSoundRef = useRef(null);
  const timerRef = useRef(null);

  const difficulties = [
    { id: 'beginner', name: 'Beginner', desc: 'Simple positions (2-6 pieces) - Clear material advantage', color: 'green' },
    { id: 'intermediate', name: 'Intermediate', desc: 'Moderate complexity (7-12 pieces) - Tactical awareness needed', color: 'yellow' },
    { id: 'advanced', name: 'Advanced', desc: 'Complex positions (13-20 pieces) - Precise calculation required', color: 'orange' },
    { id: 'expert', name: 'Expert', desc: 'Master-level (21+ pieces) - Deep analysis and pattern recognition', color: 'red' }
  ];

  useEffect(() => {
    // Create audio elements with error handling
    try {
      moveSoundRef.current = new Audio('/sounds/move-self.mp3');
      moveSoundRef.current.load();
    } catch (error) {
      console.warn('Could not load move sound:', error);
      moveSoundRef.current = null;
    }
    
    try {
      captureSoundRef.current = new Audio('/sounds/capture.mp3');
      captureSoundRef.current.load();
    } catch (error) {
      console.warn('Could not load capture sound:', error);
      moveSoundRef.current = null;
    }
    
    try {
      castleSoundRef.current = new Audio('/sounds/castle.mp3');
      castleSoundRef.current.load();
    } catch (error) {
      console.warn('Could not load castle sound:', error);
      castleSoundRef.current = null;
    }
  }, []);

  useEffect(() => {
    fetchUserRating();
  }, []);

  useEffect(() => {
    if (user && user.rating) {
      setUserRating(user.rating);
    }
  }, [user]);

  useEffect(() => {
    if (isTimerRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setIsTimerRunning(false);
            endGame();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timerRef.current);
    }
  }, [isTimerRunning]);


  const fetchUserRating = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token && user) {
        setUserRating(user.rating || 1200);
        setWinsCount(user.advantageWins || 0);
      }
    } catch (error) {
      console.error('Error fetching user rating:', error);
    }
  };

  const updateWinsCount = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('http://localhost:3001/api/advantage/stats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        body: JSON.stringify({ won: true })
      });

      if (response.ok) {
        const data = await response.json();
        setWinsCount(prev => prev + 1);
        console.log('Wins count updated');
      }
    } catch (error) {
      console.error('Error updating wins count:', error);
    }
  };

  const loadWinningPosition = useCallback(async () => {
    if (gameMode !== 'playing') return;
    
    setLoading(true);
    setFeedback('');
    setSelectedSquare(null);
    setDrawnArrows([]);
    setHighlightedSquares([]);
    setMoveHistory([]);
    setLastMove(null);
    setShowHint(false);
    setHintText('');

    try {
      // Use checkmate positions from the CSV data
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/advantage/position?difficulty=${difficulty}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'x-auth-token': token, 'Authorization': `Bearer ${token}` } : {})
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Loaded winning position:', data);
        
        if (data && data.fen) {
          initializePosition(data);
        } else {
          throw new Error('No position data returned');
        }
      } else {
        if (response.status === 401 || response.status === 403) {
          throw new Error('Authentication or premium access required');
        }
        throw new Error(`HTTP ${response.status}`); 
      }
    } catch (error) {
      console.error('Error loading winning position:', error);
      // Use fallback winning positions immediately
      const fallbackPositions = [
        {
          fen: '8/8/8/8/8/8/4K3/4Q3 w - - 0 1',
          moves: ['Qe8#'],
          difficulty: 'beginner',
          description: 'Queen and King vs King - Basic checkmate'
        },
        {
          fen: '8/8/8/8/8/8/3K4/4Q3 w - - 0 1',
          moves: ['Qe7', 'Kd8', 'Qe8#'],
          difficulty: 'intermediate',
          description: 'Queen and King vs King - Advanced checkmate'
        },
        {
          fen: '8/8/8/8/8/8/2K5/4Q3 w - - 0 1',
          moves: ['Qe6', 'Kd8', 'Qe7', 'Kc8', 'Qc7#'],
          difficulty: 'advanced',
          description: 'Queen and King vs King - Complex checkmate'
        },
        {
          fen: '8/8/8/8/8/8/4K3/4R3 w - - 0 1',
          moves: ['Re8#'],
          difficulty: 'beginner',
          description: 'Rook and King vs King - Basic checkmate'
        },
        {
          fen: '8/8/8/8/8/8/3K4/4R3 w - - 0 1',
          moves: ['Re7', 'Kd8', 'Re8#'],
          difficulty: 'intermediate',
          description: 'Rook and King vs King - Advanced checkmate'
        }
      ];
      
      const randomPosition = fallbackPositions[Math.floor(Math.random() * fallbackPositions.length)];
      console.log('Using fallback position:', randomPosition);
      initializePosition(randomPosition);
      if (error && typeof error.message === 'string' && error.message.includes('Authentication')) {
        setFeedback('Sign in with premium to load real positions. Showing fallback.');
      } else {
        setFeedback('Using fallback position - API not available');
      }
    } finally {
      setLoading(false);
    }
  }, [gameMode, difficulty]);

  // Load position immediately when game mode changes to 'playing'
  useEffect(() => {
    if (gameMode === 'playing') {
      loadWinningPosition();
    }
  }, [gameMode, loadWinningPosition]);

  // Auto-start training with a default difficulty so users immediately see a position
  useEffect(() => {
    if (gameMode === 'menu') {
      startGame('intermediate');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const initializePosition = useCallback((positionData) => {
    console.log('🔧 Initializing winning position:', positionData);
    
    try {
      const newGame = new Chess(positionData.fen);
      console.log('✅ Created Chess game with FEN:', positionData.fen);
      
      setCurrentPosition(positionData);
      setGame(newGame);
      setFen(newGame.fen());
      setOrientation(newGame.turn() === 'w' ? 'white' : 'black');
      setFeedback('Find the winning sequence! You have the advantage.');
      setHintText(`Goal: ${positionData.description || 'Convert your advantage to checkmate'}`);
      
      console.log('✅ Position initialization complete!');
    } catch (err) {
      console.error('Error initializing position:', err);
      setFeedback('Failed to initialize position. Please try again.');
      setLoading(false);
    }
  }, []);

  const playMoveSound = (move) => {
    if (!move) return;
    try {
      if (move.flags && move.flags.includes('c')) {
        captureSoundRef.current && captureSoundRef.current.play().catch(e => console.warn('Could not play capture sound:', e));
      } else if (move.flags && (move.flags.includes('k') || move.flags.includes('q'))) {
        castleSoundRef.current && castleSoundRef.current.play().catch(e => console.warn('Could not play castle sound:', e));
      } else {
        moveSoundRef.current && moveSoundRef.current.play().catch(e => console.warn('Could not play move sound:', e));
      }
    } catch (error) {
      console.warn('Error playing move sound:', error);
    }
  };

  // Request a bot move from the backend and apply it
  const requestAndApplyBotMove = useCallback(async (currentFen) => {
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
        setFeedback('Bot move failed. Try your next forcing move.');
        return;
      }

      const data = await res.json();
      // data.move is SAN, data.fen is new FEN after bot move
      const beforeBot = new Chess(currentFen);
      let botMoveObj = null;
      try {
        botMoveObj = beforeBot.move(data.move, { sloppy: true });
      } catch (_) {}

      // Apply bot position from returned FEN for full accuracy
      const afterBot = new Chess(data.fen || beforeBot.fen());
      setGame(afterBot);
      setFen(afterBot.fen());

      // Show opponent arrow (red)
      if (botMoveObj && botMoveObj.from && botMoveObj.to) {
        const botArrow = { from: botMoveObj.from, to: botMoveObj.to, color: '#ef4444' };
        setDrawnArrows([botArrow]);
      } else {
        // Fallback: no arrow if we couldn't parse SAN
        setDrawnArrows([]);
      }

      // Update feedback
      if (afterBot.isCheckmate()) {
        setFeedback('Bot delivered checkmate. Next position...');
        // Update rating on failure
        try {
          const token = localStorage.getItem('token');
          if (token) {
            fetch(`${API_BASE}/stats`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
              body: JSON.stringify({ solved: false, puzzleRating: 1200 })
            }).catch(()=>{});
          }
        } catch(_) {}
        setTimeout(() => loadWinningPosition(), 800);
      } else if (afterBot.isDraw() || afterBot.isStalemate() || afterBot.isThreefoldRepetition() || afterBot.isInsufficientMaterial()) {
        setFeedback('Position ended in a draw. Loading new position...');
        setTimeout(() => loadWinningPosition(), 800);
      } else if (afterBot.isCheck()) {
        setFeedback('Bot move played. You are in check!');
      } else {
        setFeedback('Bot move played. Your turn.');
      }
    } catch (e) {
      console.error('Bot move error:', e);
      setFeedback('Could not get bot move. Continue playing forcing moves.');
    }
  }, [difficulty, loadWinningPosition]);

  const onPieceDrop = (from, to, piece) => {
    if (!game || !currentPosition || gameMode !== 'playing') {
      return false;
    }

    console.log('=== ADVANTAGE CAPITALISATION MOVE ===');
    console.log('Attempting move from', from, 'to', to);
    console.log('Current position:', currentPosition);

    // Check if the move is legal
    const move = game.move({ from, to, promotion: 'q' });
    if (!move) {
      // Don't show error message for illegal moves - just return false silently
      return false;
    }

    console.log('✅ Move played:', move.san);
    // Create new game state after the move
    const newGameState = new Chess(game.fen());
    setGame(newGameState);
    setFen(newGameState.fen());
    setMoveHistory(prev => [...prev, move.san]);
    setMovesPlayed(prev => prev + 1);
    playMoveSound(move);

    // Add user move arrow (green)
    const userArrow = { from: move.from, to: move.to, color: '#22c55e' };
    setDrawnArrows([userArrow]);

    // Check if this is a winning move or draw
    if (newGameState.isCheckmate()) {
      console.log('🎉 Checkmate achieved!');
      setFeedback('🎉 Checkmate! Excellent conversion!');
      setCorrectMoves(prev => prev + 1);
      // Update rating and wins on success
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const response = await fetch(`${API_BASE}/stats`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
            body: JSON.stringify({ solved: true, puzzleRating: 1200, won: true })
          });
          
          if (response.ok) {
            const data = await response.json();
            // Update wins count from backend response
            if (data.advantageWins !== undefined) {
              setWinsCount(data.advantageWins);
            }
            // Refresh user data to get latest advantageWins from database
            const refreshedUser = await refreshUser();
            if (refreshedUser && refreshedUser.advantageWins !== undefined) {
              setWinsCount(refreshedUser.advantageWins);
            }
          }
        }
      } catch(_) {
        console.error('Error updating advantage stats:', _);
      }
      
      // Auto-load next position after a short delay
      setTimeout(() => {
        loadWinningPosition();
      }, 2000);
    } else if (newGameState.isDraw() || newGameState.isStalemate() || newGameState.isThreefoldRepetition() || newGameState.isInsufficientMaterial()) {
      setFeedback('Position ended in a draw. Loading new position...');
      setTimeout(() => {
        loadWinningPosition();
      }, 1500);
    } else if (newGameState.isCheck()) {
      setFeedback('Check! Keep going...');
    } else {
      setFeedback('Good move! Continue the conversion...');
    }

    // Ask bot to reply automatically if game not over
    if (!newGameState.isGameOver()) {
      // Use the position after user's move
      const fenAfterUser = newGameState.fen();
      requestAndApplyBotMove(fenAfterUser);
    }

    return true;
  };

  const onSquareClick = (square) => {
    if (gameMode !== 'playing') return;
    
    if (selectedSquare === square) {
      setSelectedSquare(null);
      setHighlightedSquares([]);
    } else {
      setSelectedSquare(square);
      const piece = game.get(square);
      if (piece && piece.color === game.turn()) {
        // Highlight possible moves
        const moves = game.moves({ square, verbose: true });
        const squares = moves.map(move => move.to);
        setHighlightedSquares(squares);
      } else {
        setHighlightedSquares([]);
      }
    }
  };

  const startGame = (selectedDifficulty) => {
    setDifficulty(selectedDifficulty);
    setGameMode('playing');
    setMovesPlayed(0);
    setCorrectMoves(0);
    setGameHistory([]);
    setFeedback('');
    setTimeLeft(300); // 5 minutes
    setIsTimerRunning(true);
    
    // Position will be loaded by useEffect when gameMode changes to 'playing'
  };

  const endGame = () => {
    setIsTimerRunning(false);
    setGameMode('finished');
  };

  const resetGame = () => {
    setGameMode('menu');
    setMovesPlayed(0);
    setCorrectMoves(0);
    setGameHistory([]);
    setFeedback('');
    setTimeLeft(300);
    setIsTimerRunning(false);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const showHintForPosition = () => {
    if (!currentPosition) return;
    
    setShowHint(true);
    setHintText(`Hint: ${currentPosition.description || 'Look for forcing moves that lead to checkmate'}`);
  };

  if (gameMode === 'menu') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-indigo-100 p-3 sm:p-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800 mb-3 sm:mb-4 flex items-center justify-center">
              <Crown className="w-8 h-8 sm:w-10 sm:h-10 text-teal-600 mr-2 sm:mr-3" />
              Advantage Capitalisation
            </h1>
            <p className="text-sm sm:text-base lg:text-xl text-gray-600 mb-4 sm:mb-6">
              Practice converting winning positions into checkmate
            </p>
            
            {/* User Rating Display */}
            {userRating && (
              <div className="inline-flex items-center bg-gradient-to-r from-teal-50 to-teal-100 px-4 sm:px-6 py-2 sm:py-3 rounded-xl border border-teal-200 shadow-lg mb-4 sm:mb-6">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-teal-500 rounded-full flex items-center justify-center mr-2 sm:mr-3">
                  <span className="text-white text-xs sm:text-sm font-bold">♔</span>
                </div>
                <div className="text-left">
                  <p className="text-xs sm:text-sm text-teal-700 font-medium">Your Rating</p>
                  <p className="text-lg sm:text-2xl font-bold text-teal-800">{userRating}</p>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {difficulties.map((diff) => (
              <div key={diff.id} className="bg-white rounded-xl p-4 sm:p-6 shadow-lg hover:shadow-xl transition-shadow">
                <div className="flex items-center mb-3 sm:mb-4">
                  <Sword className="w-6 h-6 sm:w-8 sm:h-8 text-teal-600 mr-2 sm:mr-3" />
                  <h3 className="text-lg sm:text-xl font-bold text-gray-800">{diff.name}</h3>
                </div>
                <p className="text-gray-600 mb-3 sm:mb-4 text-sm sm:text-base">{diff.desc}</p>
                <button
                  onClick={() => startGame(diff.id)}
                  className="w-full bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white font-semibold py-2 sm:py-3 px-3 sm:px-4 rounded-lg transition-colors text-sm sm:text-base"
                >
                  Start {diff.name} Training
                </button>
              </div>
            ))}
          </div>

          <div className="text-center mt-6 sm:mt-8">
            <button
              onClick={() => navigate(-1)}
              className="bg-gray-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg hover:bg-gray-700 transition-colors text-sm sm:text-base"
            >
              Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (gameMode === 'finished') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-indigo-100 p-3 sm:p-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-xl p-4 sm:p-6 lg:p-8 shadow-lg text-center">
            <Trophy className="w-12 h-12 sm:w-16 sm:h-16 text-teal-500 mx-auto mb-3 sm:mb-4" />
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-3 sm:mb-4">Training Complete!</h1>
            
            <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
              <div className="bg-teal-50 rounded-lg p-3 sm:p-4">
                <div className="text-xl sm:text-2xl font-bold text-teal-600">{correctMoves}</div>
                <div className="text-xs sm:text-sm text-gray-600">Positions Solved</div>
              </div>
              <div className="bg-green-50 rounded-lg p-3 sm:p-4">
                <div className="text-xl sm:text-2xl font-bold text-green-600">{movesPlayed}</div>
                <div className="text-xs sm:text-sm text-gray-600">Total Moves</div>
              </div>
            </div>

            <button
              onClick={resetGame}
              className="bg-teal-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg hover:bg-teal-700 transition-colors text-sm sm:text-base"
            >
              Train Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-indigo-100 p-3 sm:p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg p-3 sm:p-4 mb-4 sm:mb-6 shadow-sm">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0">
            <div className="flex flex-wrap items-center gap-3 sm:gap-6">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-teal-600" />
                <span className="font-bold text-lg sm:text-xl">{formatTime(timeLeft)}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Target className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                <span className="font-bold text-lg sm:text-xl">{correctMoves}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                <span className="font-bold text-lg sm:text-xl">{movesPlayed}</span>
              </div>
            </div>
            <button
              onClick={endGame}
              className="bg-red-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm sm:text-base"
            >
              End Training
            </button>
          </div>
        </div>

        {/* Board Controls */}
        <div className="bg-white rounded-lg p-3 sm:p-4 mb-4 sm:mb-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
            {/* Board Orientation */}
            <div className="flex items-center space-x-2">
              <label className="text-gray-700 font-medium">Side:</label>
              <select
                value={orientation}
                onChange={(e) => setOrientation(e.target.value)}
                className="bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:border-teal-400"
              >
                <option value="white">White</option>
                <option value="black">Black</option>
              </select>
            </div>

            {/* Board Size */}
            <div className="flex items-center space-x-2">
              <label className="text-gray-700 font-medium">Size:</label>
              <input
                type="range"
                min="400"
                max="800"
                value={boardSize}
                onChange={(e) => setBoardSize(Number(e.target.value))}
                className="w-24"
              />
              <span className="text-gray-700 text-sm w-12">{boardSize}px</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Chessboard */}
          <div className="lg:col-span-3 order-2 lg:order-1">
            <div className="bg-white rounded-lg p-3 sm:p-6 shadow-sm">
              {game && fen ? (
                <div className="flex justify-center">
                  <Chessboard
                    position={fen}
                    onPieceDrop={onPieceDrop}
                    onSquareClick={onSquareClick}
                    boardOrientation={orientation}
                    arePiecesDraggable={true}
                    areArrowsAllowed={true}
                    customBoardStyle={{
                      borderRadius: '8px',
                      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
                      // Mobile touch optimizations
                      touchAction: 'pan-y', // Allow vertical page scroll while preserving drag
                      userSelect: 'none', // Prevent text selection on mobile
                      WebkitUserSelect: 'none',
                      MozUserSelect: 'none',
                      msUserSelect: 'none',
                      WebkitTouchCallout: 'none', // Disable iOS callout
                      WebkitTapHighlightColor: 'transparent', // Remove tap highlight
                      cursor: 'pointer' // Ensure cursor shows interaction
                    }}
                    customSquareStyles={highlightedSquares.reduce((acc, square) => {
                      acc[square] = { backgroundColor: 'rgba(59, 130, 246, 0.3)' };
                      return acc;
                    }, {})}
                    customArrows={drawnArrows.map(arrow => [arrow.from, arrow.to, arrow.color])}
                    boardWidth={boardSize}
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center h-64 sm:h-96 bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-200 rounded-full flex items-center justify-center mb-3 sm:mb-4 mx-auto">
                      <Target className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500 text-sm sm:text-base">Loading winning position...</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Info Panel */}
          <div className="space-y-4 sm:space-y-6 order-1 lg:order-2">
            {/* Current Position Info */}
            {currentPosition && (
              <div className="bg-white rounded-lg p-3 sm:p-4 shadow-sm">
                <h3 className="font-bold text-base sm:text-lg mb-2">Current Position</h3>
                <p className="text-gray-600 text-xs sm:text-sm mb-2">
                  Difficulty: {currentPosition.difficulty || 'Unknown'}
                </p>
                {hintText && (
                  <p className="text-gray-600 text-xs sm:text-sm font-medium">
                    Goal: <span className="text-teal-600">{hintText}</span>
                  </p>
                )}
              </div>
            )}

            {/* Feedback */}
            {feedback && (
              <div className={`p-3 sm:p-4 rounded-lg text-sm sm:text-base ${
                feedback.includes('Checkmate') || feedback.includes('Excellent')
                  ? 'bg-green-100 text-green-800' 
                  : feedback.includes('Error') || feedback.includes('Illegal')
                  ? 'bg-red-100 text-red-800'
                  : 'bg-blue-100 text-blue-800'
              }`}>
                {feedback}
              </div>
            )}

            {/* Controls */}
            <div className="space-y-2 sm:space-y-3">
              <button
                onClick={showHintForPosition}
                className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-semibold py-2 sm:py-3 px-3 sm:px-4 rounded-lg transition-colors flex items-center justify-center space-x-2 text-sm sm:text-base"
              >
                <BarChart3 className="w-4 h-4" />
                <span>Show Hint</span>
              </button>

              <button
                onClick={() => loadWinningPosition()}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 sm:py-3 px-3 sm:px-4 rounded-lg transition-colors flex items-center justify-center space-x-2 text-sm sm:text-base"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Next Position</span>
              </button>
            </div>

            {/* Stats */}
            <div className="bg-white rounded-lg p-3 sm:p-4 shadow-sm">
              <h3 className="font-bold text-base sm:text-lg mb-2 sm:mb-3">Training Stats</h3>
              <div className="space-y-1 sm:space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600 text-xs sm:text-sm">Positions Won:</span>
                  <span className="font-bold text-green-600 text-sm sm:text-lg">{winsCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 text-xs sm:text-sm">Positions Solved:</span>
                  <span className="font-medium text-xs sm:text-sm">{correctMoves}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 text-xs sm:text-sm">Total Moves:</span>
                  <span className="font-medium text-xs sm:text-sm">{movesPlayed}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 text-xs sm:text-sm">Success Rate:</span>
                  <span className="font-medium text-xs sm:text-sm">
                    {movesPlayed > 0 ? Math.round((correctMoves / movesPlayed) * 100) : 0}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvantageCapitalisationPage; 