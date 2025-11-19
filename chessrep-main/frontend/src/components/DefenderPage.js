import React, { useState, useEffect, useCallback, useRef } from 'react';
import { DndProvider } from 'react-dnd';
import { TouchBackend } from 'react-dnd-touch-backend';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Shield, Clock, Zap, Trophy, RotateCcw, Play, Pause, BarChart3, Crown, Sword } from 'lucide-react';

const API_BASE = 'http://localhost:3001/api/defender';
const DIFFICULTY_TO_RATING = {
  beginner: 800,
  intermediate: 1200,
  advanced: 1600,
  expert: 2000
};

const DefenderPage = () => {
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
  const [gameMode, setGameMode] = useState('playing'); // 'playing', 'finished'
  const [difficulty, setDifficulty] = useState('intermediate');
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [movesPlayed, setMovesPlayed] = useState(0);
  const [correctMoves, setCorrectMoves] = useState(0);
  const [gameHistory, setGameHistory] = useState([]);
  const [drawnArrows, setDrawnArrows] = useState([]);
  const [highlightedSquares, setHighlightedSquares] = useState([]);
  const [boardSize, setBoardSize] = useState(() => {
    // Detect screen size on initial render to set appropriate default (matching PuzzleSolvePage)
    if (typeof window !== 'undefined') {
      const isMobile = window.innerWidth < 768;
      const isTablet = window.innerWidth >= 768 && window.innerWidth < 1280;
      if (isMobile) return Math.min(window.innerWidth - 64, 350);
      if (isTablet) return Math.min(window.innerWidth - 128, 500);
      return 800; // Desktop default
    }
    return 400; // SSR fallback
  });
  const [orientation, setOrientation] = useState('white');
  const [moveHistory, setMoveHistory] = useState([]);
  const [lastMove, setLastMove] = useState(null);
  const [showHint, setShowHint] = useState(false);
  const [hintText, setHintText] = useState('');
  const moveSoundRef = useRef(null);
  const captureSoundRef = useRef(null);
  const castleSoundRef = useRef(null);
  const timerRef = useRef(null);
  const boardContainerRef = useRef(null);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const winProcessedRef = useRef(new Set());

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const detectTouch = () => {
      const hasMatchMedia = typeof window.matchMedia === 'function';
      const coarse = hasMatchMedia ? window.matchMedia('(pointer: coarse)').matches : false;
      return coarse || 'ontouchstart' in window;
    };
    setIsTouchDevice(detectTouch());
    let mq;
    const handleChange = () => setIsTouchDevice(detectTouch());
    if (typeof window.matchMedia === 'function') {
      mq = window.matchMedia('(pointer: coarse)');
      if (mq.addEventListener) mq.addEventListener('change', handleChange);
      else if (mq.addListener) mq.addListener(handleChange);
    }
    return () => {
      if (mq) {
        if (mq.removeEventListener) mq.removeEventListener('change', handleChange);
        else if (mq.removeListener) mq.removeListener(handleChange);
      }
    };
  }, []);


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

  useEffect(() => {
    // Clear processed wins whenever we load a brand new position
    winProcessedRef.current.clear();
  }, [currentPosition?.puzzleId, currentPosition?.fen]);

  const fetchUserRating = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token && user) {
        setUserRating(user.defenderRating || 1200);
        setWinsCount(user.defenderWins || 0);
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
    setFeedback('');
    setSelectedSquare(null);
    setDrawnArrows([]);
    setHighlightedSquares([]);
    setMoveHistory([]);
    setLastMove(null);
    setShowHint(false);
    setHintText('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setFeedback('Please log in to access defender training.');
        setLoading(false);
        return;
      }

      const response = await fetch(`http://localhost:3001/api/defender/position?difficulty=${difficulty}`, {
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        }
      });
      console.log('[DEFENDER] Response status:', response.status);
      
      const data = await response.json();
      console.log('[DEFENDER] Response data:', data);
      
      if (response.ok) {
        if (data && data.fen) {
          console.log('[DEFENDER] Initializing position with FEN:', data.fen);
          initializePosition(data);
        } else {
          console.error('[DEFENDER] No FEN in response data:', data);
          setFeedback('Error: Invalid position data received. Please try again.');
        }
      } else {
        console.error('[DEFENDER] API error:', data);
        setFeedback(data.error || `Error: HTTP ${response.status}. Please try again.`);
      }
    } catch (error) {
      console.error('[DEFENDER] Error loading defensive position:', error);
      setFeedback(`Error loading position: ${error.message}. Please check if the backend is running.`);
    } finally {
      setLoading(false);
    }
  }, [gameMode, difficulty]);

  // Initialize game on mount
  useEffect(() => {
    // Check usage limits for free users
    if (user && user.userType !== 'premium') {
      const checkUsageLimits = async () => {
        try {
          const token = localStorage.getItem('token');
          const response = await fetch('http://localhost:3001/api/usage-limits/defender', {
            headers: { 'x-auth-token': token }
          });
          
          if (response.ok) {
            const limitData = await response.json();
            if (!limitData.allowed) {
              alert(`You've reached your daily limit of 1 defender session. Come back tomorrow or upgrade to premium for unlimited access!`);
              navigate(-1);
              return;
            }
            
            // Increment usage
            await fetch('http://localhost:3001/api/usage-limits/defender/increment', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-auth-token': token
              }
            });
          }
        } catch (error) {
          console.error('Error checking usage limits:', error);
        }
      };
      checkUsageLimits();
    }
    
    // Initialize game state
    setMovesPlayed(0);
    setCorrectMoves(0);
    setGameHistory([]);
    setFeedback('');
    setTimeLeft(300);
    setIsTimerRunning(true);
  }, []); // Only run on mount

  // Load position immediately when game mode changes to 'playing'
  useEffect(() => {
    if (gameMode === 'playing') {
      loadDefensivePosition();
    }
  }, [gameMode, loadDefensivePosition]);

  const initializePosition = useCallback((positionData) => {
    console.log('🔧 Initializing defensive position:', positionData);
    
    try {
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
  const getPuzzleRating = useCallback(() => {
    if (currentPosition?.rating) return currentPosition.rating;
    return DIFFICULTY_TO_RATING[difficulty] || 1200;
  }, [currentPosition, difficulty]);

  const submitDefenderStats = useCallback(async (won) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return false;

      const payload = {
        solved: !!won,
        puzzleRating: getPuzzleRating()
      };

      if (won) {
        payload.won = true;
      }

      const response = await fetch(`${API_BASE}/stats`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        console.error('❌ Failed to update defender stats:', response.status);
        return false;
      }

      const data = await response.json();
      if (data.newRating) {
        setUserRating(data.newRating);
      }

      const refreshedUser = await refreshUser();
      if (refreshedUser) {
        if (refreshedUser.defenderRating) {
          setUserRating(refreshedUser.defenderRating);
        }
        if (typeof refreshedUser.defenderWins === 'number') {
          setWinsCount(refreshedUser.defenderWins);
        }
      }

      return true;
    } catch (error) {
      console.error('❌ Error updating defender stats:', error);
      return false;
    }
  }, [getPuzzleRating, refreshUser]);

  const processDefenderWin = useCallback(async () => {
    const positionKey = currentPosition?.puzzleId || currentPosition?.fen || `win-${Date.now()}`;
    if (winProcessedRef.current.has(positionKey)) {
      console.log('⚠️ Defender win already processed for this position.');
      return;
    }

    winProcessedRef.current.add(positionKey);
    setWinsCount(prev => prev + 1);

    const success = await submitDefenderStats(true);
    if (!success) {
      winProcessedRef.current.delete(positionKey);
      setWinsCount(prev => (prev > 0 ? prev - 1 : 0));
    }
  }, [currentPosition, submitDefenderStats]);

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
      if (afterBot.in_checkmate()) {
        setFeedback('Bot delivered checkmate. Next position...');
        submitDefenderStats(false);
        setTimeout(() => loadDefensivePosition(), 800);
      } else if (afterBot.in_check()) {
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

  const onPieceDrop = (from, to, piece) => {
    if (!game || !currentPosition || gameMode !== 'playing') {
      return false;
    }

    console.log('=== DEFENDER MOVE ===');
    console.log('Attempting move from', from, 'to', to);
    console.log('Current position:', currentPosition);

    // Create a copy of the game to test the move
    const testGame = new Chess(game.fen());
    const move = testGame.move({ from, to, promotion: 'q' });
    if (!move) {
      return false;
    }

    console.log('✅ Move played:', move.san);
    
    // Update game state with the testGame (which now has the move applied)
    setGame(testGame);
    setFen(testGame.fen());
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
        // Don't auto-load next position - let game continue until end
        // Track that they found the correct defensive move, but continue the game
      }
    }

    // Check game state and continue playing
    if (testGame.in_checkmate()) {
      // User got checkmated - lost the game
      const gameResult = testGame.turn() === 'w' ? 'lost' : 'won'; // If white to move and checkmated, white lost
      const userWon = (testGame.turn() === 'w' && orientation === 'black') || (testGame.turn() === 'b' && orientation === 'white');
      
      if (userWon) {
        setFeedback('🎉 Checkmate! You won! Next position...');
        processDefenderWin();
      } else {
        setFeedback('Checkmate! You lost. Next position...');
        submitDefenderStats(false);
      }
      setTimeout(() => loadDefensivePosition(), 2000);
    } else if (testGame.in_stalemate() || testGame.in_draw()) {
      setFeedback('Game ended in a draw. Next position...');
      setTimeout(() => loadDefensivePosition(), 2000);
    } else {
      // Game continues
      if (testGame.in_check()) {
        setFeedback('You are in check. Find the defensive move!');
      } else {
        setFeedback('Continue defending...');
      }
      
      // Ask bot to reply automatically if game not over
      const fenAfterUser = testGame.fen();
      requestAndApplyBotMove(fenAfterUser);
    }

    return true;
  };

  const onSquareClick = (square) => {
    if (gameMode !== 'playing' || !game || !currentPosition) return;
    
    // If clicking the same square, deselect it
    if (selectedSquare === square) {
      setSelectedSquare(null);
      setHighlightedSquares([]);
      return;
    }
    
    // If a square is already selected, try to make a move
    if (selectedSquare) {
      // Create a copy of the game to test the move
      const testGame = new Chess(game.fen());
      const move = testGame.move({ from: selectedSquare, to: square, promotion: 'q' });
      
      if (move) {
        // Valid move - execute it using the same logic as onPieceDrop
        console.log('✅ Move played via click:', move.san);
        
        // Update game state
        setGame(testGame);
        setFen(testGame.fen());
        setMoveHistory(prev => [...prev, move.san]);
        setMovesPlayed(prev => prev + 1);
        playMoveSound(move);
        
        // Clear selection
        setSelectedSquare(null);
        setHighlightedSquares([]);
        
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
          }
        }
        
        // Check game state and continue playing
        if (testGame.in_checkmate()) {
          // User got checkmated - lost the game
          const gameResult = testGame.turn() === 'w' ? 'lost' : 'won';
          const userWon = (testGame.turn() === 'w' && orientation === 'black') || (testGame.turn() === 'b' && orientation === 'white');
          
          if (userWon) {
            setFeedback('🎉 Checkmate! You won! Next position...');
            processDefenderWin();
          } else {
            setFeedback('Checkmate! You lost. Next position...');
            submitDefenderStats(false);
          }
          setTimeout(() => loadDefensivePosition(), 2000);
        } else if (testGame.in_stalemate() || testGame.in_draw()) {
          setFeedback('Game ended in a draw. Next position...');
          setTimeout(() => loadDefensivePosition(), 2000);
        } else {
          // Game continues
          if (testGame.in_check()) {
            setFeedback('You are in check. Find the defensive move!');
          } else {
            setFeedback('Continue defending...');
          }
          
          // Ask bot to reply automatically if game not over
          const fenAfterUser = testGame.fen();
          requestAndApplyBotMove(fenAfterUser);
        }
      } else {
        // Invalid move - select the new square if it has a piece of the current player's color
        const piece = game.get(square);
        if (piece && piece.color === game.turn()) {
          setSelectedSquare(square);
          const moves = game.moves({ square, verbose: true });
          const squares = moves.map(move => move.to);
          setHighlightedSquares(squares);
        } else {
          // Invalid move and clicked square doesn't have a valid piece - clear selection
          setSelectedSquare(null);
          setHighlightedSquares([]);
        }
      }
    } else {
      // No square selected - select this square if it has a piece of the current player's color
      setSelectedSquare(square);
      const piece = game.get(square);
      if (piece && piece.color === game.turn()) {
        const moves = game.moves({ square, verbose: true });
        const squares = moves.map(move => move.to);
        setHighlightedSquares(squares);
      } else {
        setHighlightedSquares([]);
      }
    }
  };

  const startGame = async (selectedDifficulty) => {
    // Check usage limits for free users
    if (user && user.userType !== 'premium') {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:3001/api/usage-limits/defender', {
          headers: { 'x-auth-token': token }
        });
        
        if (response.ok) {
          const limitData = await response.json();
          if (!limitData.allowed) {
            alert(`You've reached your daily limit of 1 defender session. Come back tomorrow or upgrade to premium for unlimited access!`);
            return;
          }
          
          // Increment usage
          await fetch('http://localhost:3001/api/usage-limits/defender/increment', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-auth-token': token
            }
          });
        }
      } catch (error) {
        console.error('Error checking usage limits:', error);
      }
    }
    
    setDifficulty(selectedDifficulty);
    setGameMode('playing');
    setMovesPlayed(0);
    setCorrectMoves(0);
    setGameHistory([]);
    setFeedback('');
    setTimeLeft(300); // 5 minutes
    setIsTimerRunning(true);
  };

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

  // Handle responsive board sizing (matching PuzzleSolvePage)
  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth < 768;
      const isTablet = window.innerWidth >= 768 && window.innerWidth < 1280;
      
      if (isMobile) {
        // On mobile, use a smaller board size
        const mobileSize = Math.min(window.innerWidth - 64, 350);
        setBoardSize(mobileSize);
      } else if (isTablet) {
        // On tablet, use medium size
        const tabletSize = Math.min(window.innerWidth - 128, 500);
        setBoardSize(tabletSize);
      } else {
        // On desktop, use the default 800px but ensure it fits
        const desktopSize = Math.min(800, window.innerWidth - 200);
        setBoardSize(desktopSize);
      }
    };

    handleResize(); // Set initial size
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);


  if (gameMode === 'finished') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-3 sm:p-4">
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-3 sm:p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg p-3 sm:p-4 mb-4 sm:mb-6 shadow-sm">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0">
            <div className="flex flex-wrap items-center gap-3 sm:gap-6">
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
            <div className="flex gap-2">
              <button
                onClick={() => {
                  if (window.confirm('Resign this position and move to the next puzzle?')) {
                    // Update stats as a loss
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
                    loadDefensivePosition();
                  }
                }}
                className="bg-orange-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors text-sm sm:text-base"
              >
                Resign
              </button>
              <button
                onClick={endGame}
                className="bg-red-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm sm:text-base"
              >
                End Training
              </button>
            </div>
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

            {/* Hide size slider on mobile - board is fixed at 350px max */}
            <div className="hidden sm:flex items-center space-x-2">
              <label className="text-gray-700 font-medium">Size:</label>
              <input
                type="range"
                min="300"
                max="1000"
                value={boardSize}
                onChange={(e) => {
                  // Only allow size changes on non-mobile devices
                  if (window.innerWidth >= 768) {
                    setBoardSize(Number(e.target.value));
                  }
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
              {game && fen ? (
              <>
                {/* EXACT COPY of board structure from BlunderPreventerPage for consistent mobile drag behavior */}
                <div className="relative w-full" ref={boardContainerRef} style={{ touchAction: 'pan-y', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg sm:rounded-2xl p-1 sm:p-4 shadow-inner border border-amber-200" 
                  style={{ 
                    touchAction: 'pan-y',
                    width: 'fit-content',
                    margin: '0 auto'
                  }}>
                  <div className="bg-gradient-to-br from-amber-100 to-orange-100 rounded-md sm:rounded-xl p-0.5 sm:p-2 shadow-lg" 
                    style={{ 
                      touchAction: 'pan-y',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center'
                    }}>
                    <div style={{ 
                      width: boardSize, 
                      height: boardSize,
                      touchAction: 'none', // CRITICAL: Allow all touch gestures for piece dragging
                      WebkitUserSelect: 'none',
                      userSelect: 'none'
                    }}>
                      {isTouchDevice ? (
                        <DndProvider backend={TouchBackend} options={{ enableMouseEvents: true, enableTouchEvents: true, enableKeyboardEvents: true, delayTouchStart: 0, touchSlop: 5, ignoreContextMenu: true }}>
                          <Chessboard
                            position={fen}
                            onPieceDrop={onPieceDrop}
                            onSquareClick={onSquareClick}
                            boardOrientation={orientation}
                            arePiecesDraggable={true}
                            areArrowsAllowed={true}
                            customBoardStyle={{
                              borderRadius: '8px',
                              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                              // Mobile touch optimizations - CRITICAL for drag-and-drop
                              touchAction: 'none', // CRITICAL: Allow all touch gestures for piece dragging (not pan-y)
                              pointerEvents: 'auto', // Ensure touch events are captured
                              userSelect: 'none', // Prevent text selection on mobile
                              WebkitUserSelect: 'none',
                              MozUserSelect: 'none',
                              msUserSelect: 'none',
                              WebkitTouchCallout: 'none', // Disable iOS callout
                              WebkitTapHighlightColor: 'transparent', // Remove tap highlight
                              WebkitUserDrag: 'none', // Prevent drag ghosts
                              cursor: 'pointer', // Ensure cursor shows interaction
                              // Ensure proper positioning for drag and drop
                              position: 'relative',
                              zIndex: 1, // Ensure board is not blocked by overlays
                              transform: 'none',
                              willChange: 'auto'
                            }}
                            customPieceStyle={{
                              cursor: 'grab',
                              touchAction: 'none'
                            }}
                            customDragPieceStyle={{
                              cursor: 'grabbing',
                              touchAction: 'none'
                            }}
                            customSquareStyles={highlightedSquares.reduce((acc, square) => {
                              acc[square] = { backgroundColor: 'rgba(59, 130, 246, 0.3)' };
                              return acc;
                            }, {})}
                            customArrows={drawnArrows.map(arrow => [arrow.from, arrow.to, arrow.color])}
                            boardWidth={boardSize}
                          />
                        </DndProvider>
                      ) : (
                        <Chessboard
                          position={fen}
                          onPieceDrop={onPieceDrop}
                          onSquareClick={onSquareClick}
                          boardOrientation={orientation}
                          arePiecesDraggable={true}
                          areArrowsAllowed={true}
                          customBoardStyle={{
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                            // Mobile touch optimizations - CRITICAL for drag-and-drop
                            touchAction: 'none', // CRITICAL: Allow all touch gestures for piece dragging (not pan-y)
                            pointerEvents: 'auto', // Ensure touch events are captured
                            userSelect: 'none', // Prevent text selection on mobile
                            WebkitUserSelect: 'none',
                            MozUserSelect: 'none',
                            msUserSelect: 'none',
                            WebkitTouchCallout: 'none', // Disable iOS callout
                            WebkitTapHighlightColor: 'transparent', // Remove tap highlight
                            WebkitUserDrag: 'none', // Prevent drag ghosts
                            cursor: 'pointer', // Ensure cursor shows interaction
                            // Ensure proper positioning for drag and drop
                            position: 'relative',
                            zIndex: 1, // Ensure board is not blocked by overlays
                            transform: 'none',
                            willChange: 'auto'
                          }}
                          customSquareStyles={highlightedSquares.reduce((acc, square) => {
                            acc[square] = { backgroundColor: 'rgba(59, 130, 246, 0.3)' };
                            return acc;
                          }, {})}
                          customArrows={drawnArrows.map(arrow => [arrow.from, arrow.to, arrow.color])}
                          boardWidth={boardSize}
                        />
                      )}
                    </div>
                  </div>
                </div>
                </div>
              </>
              ) : (
                <div className="flex items-center justify-center h-64 sm:h-96 bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-200 rounded-full flex items-center justify-center mb-3 sm:mb-4 mx-auto">
                      <Shield className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500 text-sm sm:text-base">Loading defensive position...</p>
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

