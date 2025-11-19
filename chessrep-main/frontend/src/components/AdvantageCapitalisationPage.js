import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Target, Clock, Zap, Trophy, RotateCcw, Play, Pause, BarChart3, Crown, Sword } from 'lucide-react';

const API_BASE = 'http://localhost:3001/api/advantage';

// Mobile-optimized chessboard with touch support
const TOUCH_BOARD_STYLE = {
  // Mobile-optimized touch handling - 'manipulation' allows touch events but prevents scrolling
  touchAction: 'manipulation',
  pointerEvents: 'auto',
  WebkitUserSelect: 'none',
  userSelect: 'none',
  WebkitTouchCallout: 'none',
  WebkitTapHighlightColor: 'transparent',
  cursor: 'pointer',
  position: 'relative',
  zIndex: 1
};

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

  const [boardSize, setBoardSize] = useState(getResponsiveBoardSize());
  const [orientation, setOrientation] = useState('white');
  const [moveHistory, setMoveHistory] = useState([]);
  const [lastMove, setLastMove] = useState(null);
  const [showHint, setShowHint] = useState(false);
  const [hintText, setHintText] = useState('');
  const [isBotMoving, setIsBotMoving] = useState(false);
  const moveSoundRef = useRef(null);
  const captureSoundRef = useRef(null);
  const castleSoundRef = useRef(null);
  const timerRef = useRef(null);
  const currentPositionRef = useRef(null);
  const gameRef = useRef(null);
  const isLoadingRef = useRef(false);

  // Detect touch device for mobile drag and drop
  const isTouchDevice = useMemo(() => {
    if (typeof window === 'undefined') return false;
    const nav = window.navigator || {};
    const maxTouchPoints = (nav && typeof nav.maxTouchPoints === 'number') ? nav.maxTouchPoints : 0;
    return 'ontouchstart' in window || maxTouchPoints > 0;
  }, []);

  const difficulties = [
    { id: 'beginner', name: 'Beginner', desc: 'Simple winning positions - Learn basic conversion patterns', color: 'green' },
    { id: 'intermediate', name: 'Intermediate', desc: 'Moderate advantages - Master tactical conversions', color: 'yellow' },
    { id: 'advanced', name: 'Advanced', desc: 'Complex positions - Perfect your conversion technique', color: 'orange' },
    { id: 'expert', name: 'Expert', desc: 'Subtle advantages - Master positional conversions', color: 'red' }
  ];

  // Update board size on window resize
  useEffect(() => {
    const handleResize = () => {
      setBoardSize(getResponsiveBoardSize());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
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

  // Keep refs in sync with state
  useEffect(() => {
    currentPositionRef.current = currentPosition;
  }, [currentPosition]);

  useEffect(() => {
    gameRef.current = game;
  }, [game]);

  useEffect(() => {
    isLoadingRef.current = loading;
  }, [loading]);

  const initializePosition = useCallback((positionData) => {
    console.log('🔧 Initializing winning position:', positionData);
    
    try {
      const newGame = new Chess(positionData.fen);
      console.log('✅ Created Chess game with FEN:', positionData.fen);
      
      setCurrentPosition(positionData);
      setGame(newGame);
      setFen(newGame.fen());
      setOrientation(newGame.turn() === 'w' ? 'white' : 'black');
      setFeedback('Find the winning sequence! Convert your advantage to victory.');
      setHintText(`Goal: ${positionData.description || 'Convert your advantage to decisive victory'}`);
      
      console.log('✅ Position initialization complete!');
    } catch (err) {
      console.error('Error initializing position:', err);
      setFeedback('Failed to initialize position. Please try again.');
      setLoading(false);
    }
  }, []);

  const loadWinningPosition = useCallback(async () => {
    if (gameMode !== 'playing') return;
    
    // Prevent multiple simultaneous loads
    if (isLoadingRef.current) {
      console.log('⏸️ Position load already in progress, skipping...');
      return;
    }
    
    // IMPORTANT: If user is skipping an unsolved position, deduct rating immediately
    // Treat skipping exactly like a failed attempt
    const currentPos = currentPositionRef.current;
    const currentGame = gameRef.current;
    if (currentPos && currentGame && !currentGame.in_checkmate()) {
      console.log('⚠️ Skipping unsolved position - deducting rating as failed attempt');
      try {
        const token = localStorage.getItem('token');
        if (token) {
          await fetch(`${API_BASE}/stats`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
            body: JSON.stringify({ solved: false, puzzleRating: 1200 })
          }).catch(()=>{});
        }
      } catch(_) {}
    }
    
    isLoadingRef.current = true;
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
      isLoadingRef.current = false;
      setLoading(false);
    }
  }, [gameMode, difficulty, initializePosition]);

  // Load position immediately when game mode changes to 'playing'
  useEffect(() => {
    if (gameMode === 'playing') {
      loadWinningPosition();
    }
  }, [gameMode, loadWinningPosition]);

  // Auto-start training so a position appears immediately
  useEffect(() => {
    if (gameMode === 'menu') {
      startGame('intermediate');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      
      // Batch state updates to prevent flashing
      setTimeout(() => {
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
        
        setIsBotMoving(false);
      }, 100); // Small delay to batch updates

      // Update feedback
      if (afterBot.in_checkmate()) {
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
      } else if (afterBot.in_check()) {
        setFeedback('Bot move played. You are in check!');
      } else {
        setFeedback('Bot move played. Your turn.');
      }
    } catch (e) {
      console.error('Bot move error:', e);
      setFeedback('Could not get bot move. Continue playing forcing moves.');
      setIsBotMoving(false);
    }
  }, [difficulty, loadWinningPosition]);

  const handleMove = useCallback((from, to, promotion) => {
    if (!game || !currentPosition || gameMode !== 'playing') {
      console.log('❌ Move blocked - conditions not met:', { game: !!game, currentPosition: !!currentPosition, gameMode });
      return false;
    }

    console.log('=== ADVANTAGE CAPITALISATION MOVE ===');
    console.log('Attempting move from', from, 'to', to);
    console.log('Current position:', currentPosition);
    console.log('Current game FEN:', game.fen());

    // Create a copy of the game to test the move
    const testGame = new Chess(game.fen());
    const move = testGame.move({ from, to, promotion: promotion || 'q' });
    if (!move) {
      console.log('❌ Illegal move:', from, 'to', to);
      return false;
    }

    console.log('✅ Move played:', move.san);
    
    // Update the game state with the new position
    setGame(testGame);
    setFen(testGame.fen());
    setMoveHistory(prev => [...prev, move.san]);
    setMovesPlayed(prev => prev + 1);
    playMoveSound(move);
    
    // Clear any selected square and highlighted squares
    setSelectedSquare(null);
    setHighlightedSquares([]);

    // Add user move arrow (green)
    const userArrow = { from: move.from, to: move.to, color: '#22c55e' };
    setDrawnArrows([userArrow]);

    // Check if this is a winning move
    if (testGame.in_checkmate()) {
      console.log('🎉 Checkmate achieved!');
      setFeedback('🎉 Checkmate! Excellent position conversion!');
      setCorrectMoves(prev => prev + 1);
      const newWinsCount = winsCount + 1;
      setWinsCount(newWinsCount);
      
      // Add this solved position to game history
      const solvedPosition = {
        id: Date.now(),
        fen: currentPosition?.fen || testGame.fen(),
        moves: [...moveHistory, move.san],
        solvedAt: new Date().toISOString(),
        difficulty: difficulty,
        timeSpent: 300 - timeLeft // Time spent on this position
      };
      setGameHistory(prev => [...prev, solvedPosition]);
      
      // Update stats on success (async, don't block)
      (async () => {
        try {
          const token = localStorage.getItem('token');
          if (token) {
            console.log('🚀 Sending advantage win to backend:', { solved: true, puzzleRating: 1200, won: true });
            const response = await fetch(`${API_BASE}/stats`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
              body: JSON.stringify({ 
                solved: true, 
                puzzleRating: 1200,
                won: true
              })
            });
            
            if (response.ok) {
              const result = await response.json();
              console.log('✅ Advantage win saved successfully:', result);
            } else {
              console.error('❌ Failed to save advantage win:', response.status, response.statusText);
            }
          } else {
            console.error('❌ No auth token found');
          }
        } catch(error) {
          console.error('❌ Error saving advantage win:', error);
        }
      })();
      
      // Auto-load next position after a short delay
      setTimeout(() => {
        loadWinningPosition();
      }, 2000);
    } else if (testGame.in_check()) {
      setFeedback('Check! Keep going...');
    } else {
      setFeedback('Good move! Continue the conversion...');
    }

    // Ask bot to reply automatically if game not over
    if (!testGame.game_over()) {
      // Use the position after user's move
      const fenAfterUser = testGame.fen();
      requestAndApplyBotMove(fenAfterUser);
    }

    return true;
  }, [game, currentPosition, gameMode, moveHistory, difficulty, timeLeft, winsCount, loadWinningPosition, requestAndApplyBotMove]);

  // onPieceDrop handler for react-chessboard - must be synchronous
  const onPieceDrop = useCallback((from, to, piece) => {
    return handleMove(from, to);
  }, [handleMove]);

  const onSquareClick = (square) => {
    if (gameMode !== 'playing') return;
    
    console.log('🎯 Square clicked:', square, 'Selected:', selectedSquare);
    
    if (selectedSquare === square) {
      // Deselect if clicking the same square
      setSelectedSquare(null);
      setHighlightedSquares([]);
    } else if (selectedSquare) {
      // Second click - try to move the piece
      console.log('🎯 Attempting move from', selectedSquare, 'to', square);
      
      // Create a copy of the game to test the move
      const testGame = new Chess(game.fen());
      const move = testGame.move({ from: selectedSquare, to: square, promotion: 'q' });
      
      if (move) {
        console.log('✅ Move successful:', move.san);
        // Use the existing handleMove logic to handle the move
        handleMove(selectedSquare, square);
      } else {
        console.log('❌ Illegal move, selecting new piece instead');
        // If move failed, select the new square if it has a piece of the current player
        const piece = game.get(square);
        if (piece && piece.color === game.turn()) {
          setSelectedSquare(square);
          const moves = game.moves({ square, verbose: true });
          const squares = moves.map(move => move.to);
          setHighlightedSquares(squares);
        } else {
          setSelectedSquare(null);
          setHighlightedSquares([]);
        }
      }
    } else {
      // First click - select the piece
      const piece = game.get(square);
      if (piece && piece.color === game.turn()) {
        // Check if this piece has any legal moves
        const legalMoves = game.moves({ square, verbose: true });
        console.log('Legal moves for piece:', legalMoves);
        
        if (legalMoves.length > 0) {
          console.log('✅ Selecting piece:', piece.type, 'on', square, 'with', legalMoves.length, 'legal moves');
          setSelectedSquare(square);
          const squares = legalMoves.map(move => move.to);
          setHighlightedSquares(squares);
        } else {
          console.log('❌ Piece has no legal moves:', square);
          setSelectedSquare(null);
          setHighlightedSquares([]);
        }
      } else {
        console.log('❌ Cannot select piece - wrong color or no piece');
        setSelectedSquare(null);
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

  const endGame = async () => {
    setIsTimerRunning(false);
    setGameMode('finished');
    
    // Save all solved positions from this session
    if (correctMoves > 0) {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          console.log('💾 Saving solved positions on game end:', correctMoves);
          
          // Get current user data to see how many wins they already have
          const userResponse = await fetch('http://localhost:3001/api/auth/me', {
            headers: { 'x-auth-token': token }
          });
          
          if (userResponse.ok) {
            const userData = await userResponse.json();
            const currentWins = userData.advantageWins || 0;
            const newWins = correctMoves; // Use correctMoves instead of winsCount
            
            console.log(`📊 Current wins in DB: ${currentWins}, Session solved positions: ${newWins}`);
            console.log(`👤 Current user: ${userData.username} (ID: ${userData._id})`);
            
            // Save all solved positions as a single batch
            if (newWins > 0) {
              const requestData = { 
                solved: true, 
                puzzleRating: 1200,
                won: true,
                additionalWins: newWins // Send the total number of wins
              };
              console.log('📤 Sending advantage stats request:', requestData);
              
              let savedCount = 0;
              try {
                const response = await fetch(`${API_BASE}/stats`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
                  body: JSON.stringify(requestData)
                });
                
                if (response.ok) {
                  const result = await response.json();
                  console.log(`✅ All ${newWins} positions saved successfully:`, result);
                  savedCount = newWins;
                } else {
                  console.error(`❌ Failed to save positions:`, response.status);
                }
              } catch (error) {
                console.error(`❌ Error saving positions:`, error);
              }
              
              if (savedCount > 0) {
                setFeedback(`🎉 Training ended! ${savedCount} position${savedCount > 1 ? 's' : ''} solved and saved to your profile!`);
                
                // Refresh user data to update the profile
                try {
                  const refreshedUser = await refreshUser();
                  console.log('🔄 User data refreshed after saving positions:', refreshedUser);
                } catch (error) {
                  console.error('❌ Error refreshing user data:', error);
                }
              } else {
                setFeedback('❌ Failed to save any positions. Please try again.');
              }
            } else {
              console.log('ℹ️ No solved positions to save');
              setFeedback('Training ended. No positions were solved this session.');
            }
          } else {
            console.error('❌ Failed to get current user data');
            setFeedback('❌ Failed to get user data. Please try again.');
          }
        } else {
          console.error('❌ No auth token found when ending game');
          setFeedback('❌ Please log in to save your progress.');
        }
      } catch(error) {
        console.error('❌ Error saving solved positions on game end:', error);
        setFeedback('❌ Error saving your progress. Please try again.');
      }
    } else {
      setFeedback('Training ended. No positions were solved this session.');
    }
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
    setHintText(`Hint: ${currentPosition.description || 'Look for forcing moves that convert your advantage'}`);
  };

  if (gameMode === 'menu') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 p-3 sm:p-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800 mb-3 sm:mb-4 flex items-center justify-center">
              <Crown className="w-8 h-8 sm:w-10 sm:h-10 text-purple-600 mr-2 sm:mr-3" />
              Advantage Capitalisation
            </h1>
            <p className="text-sm sm:text-base lg:text-xl text-gray-600 mb-4 sm:mb-6">
              Master the art of converting winning positions into decisive victories
            </p>
            
            {/* Position Conversions Display */}
            <div className="inline-flex items-center bg-gradient-to-r from-purple-50 to-purple-100 px-4 sm:px-6 py-2 sm:py-3 rounded-xl border border-purple-200 shadow-lg mb-4 sm:mb-6">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-purple-500 rounded-full flex items-center justify-center mr-2 sm:mr-3">
                <span className="text-white text-xs sm:text-sm font-bold">✓</span>
              </div>
              <div className="text-left">
                <p className="text-xs sm:text-sm text-purple-700 font-medium">Positions Won</p>
                <p className="text-lg sm:text-2xl font-bold text-purple-800">{winsCount}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {difficulties.map((diff) => (
              <div key={diff.id} className="bg-white rounded-xl p-4 sm:p-6 shadow-lg hover:shadow-xl transition-shadow">
                <div className="flex items-center mb-3 sm:mb-4">
                  <Sword className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600 mr-2 sm:mr-3" />
                  <h3 className="text-lg sm:text-xl font-bold text-gray-800">{diff.name}</h3>
                </div>
                <p className="text-gray-600 mb-3 sm:mb-4 text-sm sm:text-base">{diff.desc}</p>
                <button
                  onClick={() => startGame(diff.id)}
                  className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold py-2 sm:py-3 px-3 sm:px-4 rounded-lg transition-colors text-sm sm:text-base"
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
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 p-3 sm:p-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-xl p-4 sm:p-6 lg:p-8 shadow-lg text-center">
            <Trophy className="w-12 h-12 sm:w-16 sm:h-16 text-purple-500 mx-auto mb-3 sm:mb-4" />
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-3 sm:mb-4">Training Complete!</h1>
            
            <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
              <div className="bg-purple-50 rounded-lg p-3 sm:p-4">
                <div className="text-xl sm:text-2xl font-bold text-purple-600">{correctMoves}</div>
                <div className="text-xs sm:text-sm text-gray-600">Positions Solved</div>
              </div>
              <div className="bg-green-50 rounded-lg p-3 sm:p-4">
                <div className="text-xl sm:text-2xl font-bold text-green-600">{movesPlayed}</div>
                <div className="text-xs sm:text-sm text-gray-600">Total Moves</div>
              </div>
            </div>

            <button
              onClick={resetGame}
              className="bg-purple-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg hover:bg-purple-700 transition-colors text-sm sm:text-base"
            >
              Train Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 p-3 sm:p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg p-3 sm:p-4 mb-4 sm:mb-6 shadow-sm">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0">
            <div className="flex flex-wrap items-center gap-3 sm:gap-6">
              <div className="flex items-center space-x-2">
                <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center ${
                  timeLeft <= 60 ? 'bg-red-500 animate-pulse' : 'bg-purple-500'
                }`}>
                  <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-gray-600">Time</span>
                  <span className={`font-bold text-lg sm:text-xl ${
                    timeLeft <= 60 ? 'text-red-600' : 'text-purple-600'
                  }`}>{formatTime(timeLeft)}</span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-500 rounded-full flex items-center justify-center">
                  <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-gray-600">Won</span>
                  <span className="font-bold text-lg sm:text-xl text-green-600">{winsCount}</span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-500 rounded-full flex items-center justify-center">
                  <Target className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-gray-600">Solved</span>
                  <span className="font-bold text-lg sm:text-xl text-blue-600">{correctMoves}</span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-orange-500 rounded-full flex items-center justify-center">
                  <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-gray-600">Moves</span>
                  <span className="font-bold text-lg sm:text-xl text-orange-600">{movesPlayed}</span>
                </div>
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
                className="bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:border-purple-400"
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
                  <div
                    className="w-full"
                    style={{
                      maxWidth: boardSize,
                      ...TOUCH_BOARD_STYLE
                    }}
                  >
                    <Chessboard
                      key={`board-${gameMode}`}
                      position={fen}
                      onPieceDrop={onPieceDrop}
                      onSquareClick={onSquareClick}
                      boardOrientation={orientation}
                      // Enable dragging on all devices including mobile
                      arePiecesDraggable={gameMode === 'playing' && !isBotMoving}
                      areArrowsAllowed={true}
                      customBoardStyle={{
                        ...TOUCH_BOARD_STYLE,
                        borderRadius: '8px',
                        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
                        width: `${boardSize}px`,
                        height: `${boardSize}px`,
                        maxWidth: '100%',
                        maxHeight: '100%',
                        WebkitTouchCallout: 'none',
                        WebkitTapHighlightColor: 'transparent',
                        cursor: 'default'
                      }}
                      customPieceStyle={{ 
                        cursor: 'grab',
                        touchAction: 'manipulation',
                        WebkitTouchCallout: 'none',
                        WebkitUserSelect: 'none',
                        userSelect: 'none'
                      }}
                      customDragPieceStyle={{ 
                        cursor: 'grabbing',
                        touchAction: 'none',
                        WebkitUserSelect: 'none',
                        userSelect: 'none'
                      }}
                      customSquareStyles={highlightedSquares.reduce((acc, square) => {
                        acc[square] = { backgroundColor: 'rgba(59, 130, 246, 0.3)' };
                        return acc;
                      }, {})}
                      customArrows={drawnArrows.map(arrow => [arrow.from, arrow.to, arrow.color])}
                      boardWidth={boardSize}
                      animationDuration={200}
                    />
                  </div>
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
                    Goal: <span className="text-purple-600">{hintText}</span>
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

