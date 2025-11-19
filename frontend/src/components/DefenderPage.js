import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Shield, Clock, Zap, Trophy, RotateCcw, Play, Pause, BarChart3, Crown, Sword } from 'lucide-react';

const API_BASE = 'http://localhost:3001/api/defender';

const DefenderPage = () => {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const [currentPosition, setCurrentPosition] = useState(null);
  // Initialize with default starting position so board always renders
  const [game, setGame] = useState(() => new Chess());
  const [fen, setFen] = useState(() => new Chess().fen());
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [userRating, setUserRating] = useState(null);
  const [winsCount, setWinsCount] = useState(0);
  const [gameMode, setGameMode] = useState('playing'); // 'playing', 'finished'
  const [difficulty, setDifficulty] = useState('intermediate');
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [movesPlayed, setMovesPlayed] = useState(0);
  const [correctMoves, setCorrectMoves] = useState(0);
  const [gameHistory, setGameHistory] = useState([]);
  const [drawnArrows, setDrawnArrows] = useState([]);
  const [highlightedSquares, setHighlightedSquares] = useState([]);
  // Initialize board size based on screen width - default to 300px on mobile
  const getInitialBoardSize = () => {
    if (typeof window !== 'undefined') {
      const isMobile = window.innerWidth < 768;
      if (isMobile) {
        return 300; // Always 300px on mobile
      }
      const isTablet = window.innerWidth >= 768 && window.innerWidth < 1280;
      if (isTablet) {
        return Math.min(window.innerWidth - 128, 500);
      }
      return Math.min(600, window.innerWidth - 200);
    }
    return 300; // Default to 300px
  };
  
  const [boardSize, setBoardSize] = useState(getInitialBoardSize());
  const [orientation, setOrientation] = useState('white');
  const [moveHistory, setMoveHistory] = useState([]);
  const [lastMove, setLastMove] = useState(null);
  const [showHint, setShowHint] = useState(false);
  const [hintText, setHintText] = useState('');
  const moveSoundRef = useRef(null);
  const captureSoundRef = useRef(null);
  const castleSoundRef = useRef(null);
  const timerRef = useRef(null);
  const winProcessedRef = useRef(new Set()); // Track processed wins to prevent double-increment


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
      captureSoundRef.current = null;
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
    if (user && user.defenderRating) {
      setUserRating(user.defenderRating);
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
        setUserRating(user.defenderRating || 1200);
        setWinsCount(user.defenderWins || 0);
      }
      // Refresh user to get latest defender rating
      if (user) {
        const refreshedUser = await refreshUser();
        if (refreshedUser && refreshedUser.defenderRating) {
          setUserRating(refreshedUser.defenderRating);
        }
        if (refreshedUser && refreshedUser.defenderWins !== undefined) {
          setWinsCount(refreshedUser.defenderWins);
        }
      }
    } catch (error) {
      console.error('Error fetching user rating:', error);
    }
  };

  const updateWinsCount = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('http://localhost:3001/api/defender/stats', {
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

  const loadDefensivePosition = useCallback(async () => {
    if (gameMode !== 'playing') return;
    
    setLoading(true);
    setFeedback('Loading position...');
    setSelectedSquare(null);
    setDrawnArrows([]);
    setHighlightedSquares([]);
    setMoveHistory([]);
    setLastMove(null);
    setShowHint(false);
    setHintText('');

    try {
      // Add timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
      
      const response = await fetch(`http://localhost:3001/api/defender/position?difficulty=${difficulty}`, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Loaded defensive position:', data);
        
        if (data && data.fen) {
          initializePosition(data);
        } else {
          throw new Error('No position data returned');
        }
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.error('Error loading defensive position:', error);
      if (error.name === 'AbortError') {
        setFeedback('Request timed out. Using default position. Click "Next Position" to retry.');
      } else {
        setFeedback('Error loading position. Using default position. Click "Next Position" to retry.');
      }
      // ALWAYS set a fallback position so board can still render
      try {
        const fallbackGame = new Chess();
        setGame(fallbackGame);
        setFen(fallbackGame.fen());
        setCurrentPosition({
          fen: fallbackGame.fen(),
          description: 'Default starting position',
          difficulty: difficulty
        });
      } catch (fallbackErr) {
        console.error('Failed to create fallback game:', fallbackErr);
        // Even if Chess() fails, ensure we have something
        setGame(new Chess());
        setFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
      }
    } finally {
      setLoading(false);
    }
  }, [gameMode, difficulty]);

  // Handle responsive board sizing - Set default to 300px on mobile
  useEffect(() => {
    const updateBoardSize = () => {
      const isMobile = window.innerWidth < 768;
      const isTablet = window.innerWidth >= 768 && window.innerWidth < 1280;
      
      if (isMobile) {
        // On mobile, ALWAYS set board to exactly 300px - no exceptions
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
    
    // Set initial size
    updateBoardSize();
    
    // Listen for resize events to maintain 300px on mobile
    window.addEventListener('resize', updateBoardSize);
    
    return () => {
      window.removeEventListener('resize', updateBoardSize);
    };
  }, []);

  // Load position immediately when game mode changes to 'playing'
  useEffect(() => {
    if (gameMode === 'playing') {
      // Ensure board is always initialized before loading
      if (!game || !fen || fen.trim() === '') {
        const defaultGame = new Chess();
        setGame(defaultGame);
        setFen(defaultGame.fen());
      }
      // Use setTimeout to avoid dependency issues
      const timer = setTimeout(() => {
        loadDefensivePosition();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [gameMode, loadDefensivePosition]);

  const initializePosition = useCallback((positionData) => {
    console.log('🔧 Initializing defensive position:', positionData);
    
    try {
      if (!positionData || !positionData.fen) {
        throw new Error('Invalid position data');
      }
      
      const newGame = new Chess(positionData.fen);
      console.log('✅ Created Chess game with FEN:', positionData.fen);
      
      setCurrentPosition(positionData);
      setGame(newGame);
      setFen(newGame.fen());
      setOrientation(newGame.turn() === 'w' ? 'white' : 'black');
      setFeedback('Find the defensive move! Your position is under threat.');
      setHintText(`Goal: ${positionData.description || 'Find the move that defends against the threat'}`);
      
      console.log('✅ Position initialization complete!');
    } catch (err) {
      console.error('Error initializing position:', err);
      setFeedback('Failed to initialize position. Using default position.');
      // Always ensure board can render
      try {
        const fallbackGame = new Chess();
        setGame(fallbackGame);
        setFen(fallbackGame.fen());
      } catch (fallbackErr) {
        console.error('Failed to create fallback game:', fallbackErr);
      }
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
        personality: 'aggressive',
        timeControl: 'rapid'
      };

      const res = await fetch('http://localhost:3001/api/bot/move', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        setFeedback('Bot move failed. Try your next defensive move.');
        return;
      }

      const data = await res.json();
      const beforeBot = new Chess(currentFen);
      let botMoveObj = null;
      try {
        botMoveObj = beforeBot.move(data.move, { sloppy: true });
      } catch (_) {}

      const afterBot = new Chess(data.fen || beforeBot.fen());
      setGame(afterBot);
      setFen(afterBot.fen());

      // Show opponent arrow (red)
      if (botMoveObj && botMoveObj.from && botMoveObj.to) {
        const botArrow = { from: botMoveObj.from, to: botMoveObj.to, color: '#ef4444' };
        setDrawnArrows([botArrow]);
      } else {
        setDrawnArrows([]);
      }

      // Update feedback
      if (afterBot.isCheckmate()) {
        setFeedback('Bot delivered checkmate. Next position...');
        try {
          const token = localStorage.getItem('token');
          if (token) {
            // Get puzzle rating from current position or use difficulty-based rating
            const puzzleRating = currentPosition?.rating || 
              (difficulty === 'beginner' ? 800 : 
               difficulty === 'intermediate' ? 1200 : 
               difficulty === 'advanced' ? 1600 : 2000);
            
            const response = await fetch(`${API_BASE}/stats`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
              body: JSON.stringify({ solved: false, puzzleRating })
            });
            
            if (response.ok) {
              const data = await response.json();
              // Update local rating with new rating from backend
              if (data.newRating) {
                setUserRating(data.newRating);
              }
              // Refresh user to get latest defender rating
              const refreshedUser = await refreshUser();
              if (refreshedUser && refreshedUser.defenderRating) {
                setUserRating(refreshedUser.defenderRating);
              }
            }
          }
        } catch(_) {
          console.error('Error updating defender stats:', _);
        }
        setTimeout(() => loadDefensivePosition(), 800);
      } else if (afterBot.isDraw() || afterBot.isStalemate() || afterBot.isThreefoldRepetition() || afterBot.isInsufficientMaterial()) {
        setFeedback('Position ended in a draw. Loading new position...');
        setTimeout(() => loadDefensivePosition(), 800);
      } else if (afterBot.isCheck()) {
        setFeedback('Bot move played. You are in check!');
      } else {
        setFeedback('Bot move played. Your turn to defend.');
      }
    } catch (e) {
      console.error('Bot move error:', e);
      setFeedback('Could not get bot move. Continue playing defensive moves.');
    }
  }, [difficulty, loadDefensivePosition]);

  // Normalize move notation for comparison (handles different formats)
  const normalizeMove = (move) => {
    if (!move) return '';
    return move.replace(/[+#x=]/g, '').trim().toLowerCase();
  };

  // Core move handler used by both drag-and-drop and tap-to-move
  const handleUserMove = (from, to) => {
    if (!game || !currentPosition || gameMode !== 'playing') {
      return false;
    }

    console.log('=== DEFENDER MOVE ===');
    console.log('Attempting move from', from, 'to', to);
    console.log('Current position:', currentPosition);

    // Check if the move is legal
    const move = game.move({ from, to, promotion: 'q' });
    if (!move) {
      return false;
    }

    console.log('✅ Move played:', move.san);
    const newGameState = new Chess(game.fen());
    newGameState.move(move);
    setGame(newGameState);
    setFen(newGameState.fen());
    setMoveHistory(prev => [...prev, move.san]);
    setMovesPlayed(prev => prev + 1);
    playMoveSound(move);

    // Add user move arrow (green)
    const userArrow = { from: move.from, to: move.to, color: '#22c55e' };
    setDrawnArrows([userArrow]);

    // Check if this is the correct defensive move
    const userMove = normalizeMove(move.san);
    const correctMove = normalizeMove(currentPosition.correctMove);
    const answer1Normalized = normalizeMove(currentPosition.answer1);
    const answer2Normalized = normalizeMove(currentPosition.answer2);

    if (userMove === correctMove || userMove === answer1Normalized || userMove === answer2Normalized) {
      // Additional check: verify it matches the correct answer
      const isCorrect = userMove === correctMove || 
                        (currentPosition.correctAnswer === 'Answer1' && userMove === answer1Normalized) ||
                        (currentPosition.correctAnswer === 'Answer2' && userMove === answer2Normalized);

      if (isCorrect) {
        console.log('🎉 Correct defensive move!');
        setFeedback('🎉 Excellent defense! Continue playing...');
        setCorrectMoves(prev => prev + 1);
        // Don't load next position yet - let the game continue until it ends
        // The position will only change when the game ends (win, lose, or draw)
      }
    }

    // If not the correct move, continue the game
    if (newGameState.isCheck()) {
      setFeedback('You are in check. Find the defensive move!');
    } else if (newGameState.isCheckmate()) {
      setFeedback('Checkmate! You lost. Next position...');
      try {
        const token = localStorage.getItem('token');
        if (token) {
          // Get puzzle rating from current position or use difficulty-based rating
          const puzzleRating = currentPosition?.rating || 
            (difficulty === 'beginner' ? 800 : 
             difficulty === 'intermediate' ? 1200 : 
             difficulty === 'advanced' ? 1600 : 2000);
          
          const response = await fetch(`${API_BASE}/stats`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
            body: JSON.stringify({ solved: false, puzzleRating })
          });
          
          if (response.ok) {
            const data = await response.json();
            // Update local rating with new rating from backend
            if (data.newRating) {
              setUserRating(data.newRating);
            }
            // Refresh user to get latest defender rating
            const refreshedUser = await refreshUser();
            if (refreshedUser && refreshedUser.defenderRating) {
              setUserRating(refreshedUser.defenderRating);
            }
          }
        }
      } catch(_) {
        console.error('Error updating defender stats:', _);
      }
      setTimeout(() => loadDefensivePosition(), 1500);
    } else if (newGameState.isDraw() || newGameState.isStalemate() || newGameState.isThreefoldRepetition() || newGameState.isInsufficientMaterial()) {
      setFeedback('Position ended in a draw. Loading new position...');
      setTimeout(() => loadDefensivePosition(), 1500);
    } else {
      setFeedback('Continue defending...');
    }

    // Ask bot to reply automatically if game not over
    if (!newGameState.isGameOver()) {
      const fenAfterUser = newGameState.fen();
      requestAndApplyBotMove(fenAfterUser);
    }

    return true;
  };

  const onPieceDrop = (from, to, piece) => {
    // Delegate to shared handler so drag-and-drop works consistently
    return handleUserMove(from, to);
  };

  const onSquareClick = (square) => {
    if (gameMode !== 'playing') return;
    
    if (selectedSquare) {
      // If a square is already selected, try to make a move
      const success = handleUserMove(selectedSquare, square);
      if (success) {
        setSelectedSquare(null);
        setHighlightedSquares([]);
      } else {
        // If move failed, decide whether to change selection
        const piece = game.get(square);
        if (piece && piece.color === game.turn()) {
          setSelectedSquare(square);
          const moves = game.moves({ square, verbose: true });
          const squares = moves.map(m => m.to);
          setHighlightedSquares(squares);
        } else {
          setSelectedSquare(null);
          setHighlightedSquares([]);
        }
      }
    } else {
      // No square selected yet – select if it has a piece of the side to move
      const piece = game.get(square);
      if (piece && piece.color === game.turn()) {
        setSelectedSquare(square);
        const moves = game.moves({ square, verbose: true });
        const squares = moves.map(m => m.to);
        setHighlightedSquares(squares);
      } else {
        setSelectedSquare(null);
        setHighlightedSquares([]);
      }
    }
  };

  // Initialize game on mount
  useEffect(() => {
    setMovesPlayed(0);
    setCorrectMoves(0);
    setGameHistory([]);
    setFeedback('');
    setTimeLeft(300); // 5 minutes
    setIsTimerRunning(true);
    // Clear processed wins when starting a new game
    winProcessedRef.current.clear();
  }, []); // Only run on mount

  const endGame = () => {
    setIsTimerRunning(false);
    setGameMode('finished');
  };

  const resetGame = () => {
    setGameMode('playing');
    setMovesPlayed(0);
    setCorrectMoves(0);
    setGameHistory([]);
    setFeedback('');
    setTimeLeft(300);
    setIsTimerRunning(true);
    // Clear processed wins when resetting game
    winProcessedRef.current.clear();
    // Reload position after reset
    setTimeout(() => {
      loadDefensivePosition();
    }, 100);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const showHintForPosition = () => {
    if (!currentPosition) return;
    
    setShowHint(true);
    setHintText(`Hint: ${currentPosition.description || 'Look for moves that defend against threats'}`);
  };


  if (gameMode === 'finished') {
    return (
      <div className="min-h-screen overflow-y-auto bg-gradient-to-br from-blue-50 to-indigo-100 p-3 sm:p-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-xl p-4 sm:p-6 lg:p-8 shadow-lg text-center">
            <Trophy className="w-12 h-12 sm:w-16 sm:h-16 text-blue-500 mx-auto mb-3 sm:mb-4" />
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-3 sm:mb-4">Training Complete!</h1>
            
            <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
              <div className="bg-blue-50 rounded-lg p-3 sm:p-4">
                <div className="text-xl sm:text-2xl font-bold text-blue-600">{correctMoves}</div>
                <div className="text-xs sm:text-sm text-gray-600">Positions Solved</div>
              </div>
              <div className="bg-green-50 rounded-lg p-3 sm:p-4">
                <div className="text-xl sm:text-2xl font-bold text-green-600">{movesPlayed}</div>
                <div className="text-xs sm:text-sm text-gray-600">Total Moves</div>
              </div>
            </div>

            <button
              onClick={resetGame}
              className="bg-blue-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
            >
              Continue Training
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-y-auto bg-gradient-to-br from-blue-50 to-indigo-100 p-3 sm:p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg p-3 sm:p-4 mb-4 sm:mb-6 shadow-sm">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0">
            <div className="flex flex-wrap items-center gap-3 sm:gap-6">
              {/* Won Positions Display */}
              <div className="inline-flex items-center bg-gradient-to-r from-blue-50 to-blue-100 px-4 sm:px-6 py-2 sm:py-3 rounded-xl border border-blue-200 shadow-lg">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-500 rounded-full flex items-center justify-center mr-2 sm:mr-3">
                  <span className="text-white text-xs sm:text-sm font-bold">🛡️</span>
                </div>
                <div className="text-left">
                  <p className="text-xs sm:text-sm text-blue-700 font-medium">Won Positions</p>
                  <p className="text-lg sm:text-2xl font-bold text-blue-800">{winsCount || 0}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                <span className="font-bold text-lg sm:text-xl">{formatTime(timeLeft)}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
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
            <div className="flex items-center space-x-2">
              <label className="text-gray-700 font-medium">Side:</label>
              <select
                value={orientation}
                onChange={(e) => setOrientation(e.target.value)}
                className="bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:border-blue-400"
              >
                <option value="white">White</option>
                <option value="black">Black</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <label className="text-gray-700 font-medium">Size:</label>
              <input
                type="range"
                min="300"
                max="800"
                value={boardSize}
                onChange={(e) => {
                  setBoardSize(Number(e.target.value));
                }}
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
              {game && fen && fen.trim() !== '' ? (
                // Board container with proper mobile touch handling
                <div
                  className="relative w-full"
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    // CRITICAL: Use 'none' instead of 'pan-y' to allow piece dragging
                    touchAction: 'none',
                    WebkitUserSelect: 'none',
                    userSelect: 'none',
                    pointerEvents: 'auto'
                  }}
                >
                  <div
                    className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg sm:rounded-2xl p-1 sm:p-4 shadow-inner border border-amber-200"
                    style={{
                      width: 'fit-content',
                      margin: '0 auto',
                      touchAction: 'none',
                      WebkitUserSelect: 'none',
                      userSelect: 'none'
                    }}
                  >
                    <div
                      className="bg-gradient-to-br from-amber-100 to-orange-100 rounded-md sm:rounded-xl p-0.5 sm:p-2 shadow-lg"
                      style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        touchAction: 'none',
                        WebkitUserSelect: 'none',
                        userSelect: 'none'
                      }}
                    >
                      <div
                        style={{
                          width: boardSize,
                          height: boardSize,
                          WebkitUserSelect: 'none',
                          MozUserSelect: 'none',
                          msUserSelect: 'none',
                          userSelect: 'none',
                          touchAction: 'none',
                          pointerEvents: 'auto',
                          position: 'relative',
                          zIndex: 10
                        }}
                      >
                        <Chessboard
                          key={`board-${fen}-${boardSize}`}
                          position={fen}
                          onPieceDrop={onPieceDrop}
                          onSquareClick={onSquareClick}
                          boardOrientation={orientation}
                          arePiecesDraggable={true}
                          areArrowsAllowed={true}
                          customBoardStyle={{
                            borderRadius: '8px',
                            boxShadow:
                              '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                            // CRITICAL mobile touch optimizations for drag-and-drop
                            touchAction: 'none', // Disable all browser gestures to allow proper piece dragging
                            pointerEvents: 'auto', // Ensure touch events are captured
                            userSelect: 'none', // Prevent text selection on mobile
                            WebkitUserSelect: 'none',
                            MozUserSelect: 'none',
                            msUserSelect: 'none',
                            WebkitTouchCallout: 'none', // Disable iOS callout menu
                            WebkitTapHighlightColor: 'transparent', // Remove tap highlight on iOS
                            WebkitUserDrag: 'none', // Prevent drag ghosts
                            cursor: 'grab', // Show grab cursor
                            // Performance optimizations for smooth dragging
                            position: 'relative',
                            zIndex: 10, // Ensure board is above other elements
                            transform: 'translateZ(0)', // Hardware acceleration
                            backfaceVisibility: 'hidden',
                            willChange: 'transform'
                          }}
                          customDropSquareStyle={{
                            boxShadow: 'inset 0 0 1px 4px rgba(34, 197, 94, 0.8)'
                          }}
                          customSquareStyles={{
                            ...highlightedSquares.reduce((acc, square) => {
                              acc[square] = { backgroundColor: 'rgba(59, 130, 246, 0.3)' };
                              return acc;
                            }, {})
                          }}
                          customArrows={drawnArrows.map(arrow => [arrow.from, arrow.to, arrow.color])}
                          boardWidth={boardSize}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-64 sm:h-96 bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-200 rounded-full flex items-center justify-center mb-3 sm:mb-4 mx-auto">
                      <Shield className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500 text-sm sm:text-base">
                      {loading ? 'Loading defensive position...' : 'Failed to load position. Click "Next Position" to retry.'}
                    </p>
                    {!loading && (
                      <button
                        onClick={() => loadDefensivePosition()}
                        className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                      >
                        Retry
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Info Panel */}
          <div className="space-y-4 sm:space-y-6 order-1 lg:order-2">
            {currentPosition && (
              <div className="bg-white rounded-lg p-3 sm:p-4 shadow-sm">
                <h3 className="font-bold text-base sm:text-lg mb-2">Current Position</h3>
                <p className="text-gray-600 text-xs sm:text-sm mb-2">
                  Difficulty: {currentPosition.difficulty || 'Unknown'}
                </p>
                {hintText && (
                  <p className="text-gray-600 text-xs sm:text-sm font-medium">
                    Goal: <span className="text-blue-600">{hintText}</span>
                  </p>
                )}
                {currentPosition.answer1 && currentPosition.answer2 && (
                  <div className="mt-3 text-xs sm:text-sm text-gray-500">
                    <p>Possible moves: {currentPosition.answer1} or {currentPosition.answer2}</p>
                  </div>
                )}
              </div>
            )}

            {feedback && (
              <div className={`p-3 sm:p-4 rounded-lg text-sm sm:text-base ${
                feedback.includes('Excellent') || feedback.includes('Correct')
                  ? 'bg-green-100 text-green-800' 
                  : feedback.includes('Error') || feedback.includes('lost')
                  ? 'bg-red-100 text-red-800'
                  : 'bg-blue-100 text-blue-800'
              }`}>
                {feedback}
              </div>
            )}

            <div className="space-y-2 sm:space-y-3">
              <button
                onClick={showHintForPosition}
                className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-semibold py-2 sm:py-3 px-3 sm:px-4 rounded-lg transition-colors flex items-center justify-center space-x-2 text-sm sm:text-base"
              >
                <BarChart3 className="w-4 h-4" />
                <span>Show Hint</span>
              </button>

              <button
                onClick={() => loadDefensivePosition()}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 sm:py-3 px-3 sm:px-4 rounded-lg transition-colors flex items-center justify-center space-x-2 text-sm sm:text-base"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Next Position</span>
              </button>
            </div>

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

export default DefenderPage;

