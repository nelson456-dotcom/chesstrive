import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import { useAuth } from '../contexts/AuthContext';
import { Clock, Zap, Trophy, Target, Play, Pause, RotateCcw, BarChart3, Award } from 'lucide-react';
import { getApiUrl, getAuthHeaders } from '../config/api';
// Removed Live Analysis imports for a pure board experience
// Board runs without engine or annotations; only user interaction

const TOUCH_BOARD_STYLE = {
  touchAction: 'none', // Required on mobile to prevent the browser from hijacking drag gestures
  pointerEvents: 'auto',
  WebkitUserSelect: 'none',
  MozUserSelect: 'none',
  msUserSelect: 'none',
  userSelect: 'none',
  WebkitTouchCallout: 'none',
  WebkitTapHighlightColor: 'transparent',
  cursor: 'pointer'
};

// Helper to get the last move arrow from the game history
function getMoveArrowFromHistory(game) {
  if (!game) return null;
  const history = game.history({ verbose: true });
  if (history.length === 0) return null;
  const lastMove = history[history.length - 1];
  return { from: lastMove.from, to: lastMove.to, color: '#2196f3' };
}

const PuzzleRushPage = () => {
  const { user, refreshUser } = useAuth();
  const [currentPuzzle, setCurrentPuzzle] = useState(null);
  const [game, setGame] = useState(null);
  const [fen, setFen] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [showSolution, setShowSolution] = useState(false);
  const [solution, setSolution] = useState([]);
  const [score, setScore] = useState(0);
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [selectedSquare, setSelectedSquare] = useState(null);
  // Removed userRating, ratingChange, showRatingChange - puzzle rush uses best streak only
  const [puzzleComplete, setPuzzleComplete] = useState(false);
  const [puzzleState, setPuzzleState] = useState('active');
  const [drawnArrows, setDrawnArrows] = useState([]);
  const [highlightedSquares, setHighlightedSquares] = useState([]);
  const [puzzleRushStats, setPuzzleRushStats] = useState({
    bestStreak: 0,
    currentStreak: 0,
    totalPuzzles: 0,
    totalSolved: 0,
    totalFailed: 0,
    bestTime: null,
    averageTime: 0
  });
  // Calculate responsive board size
  const getResponsiveBoardSize = () => {
    if (typeof window !== 'undefined') {
      const screenWidth = window.innerWidth;
      if (screenWidth < 640) { // Mobile
        return Math.min(screenWidth - 40, 400);
      } else if (screenWidth < 768) { // Small tablet
        return Math.min(screenWidth - 80, 500);
      } else if (screenWidth < 1024) { // Tablet
        return Math.min(screenWidth - 120, 600);
      } else { // Desktop
        return Math.min(800, 700);
      }
    }
    return 800;
  };

  const [boardSize, setBoardSize] = useState(getResponsiveBoardSize());

  // Update board size on window resize
  useEffect(() => {
    const handleResize = () => {
      setBoardSize(getResponsiveBoardSize());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const [orientation, setOrientation] = useState('white');
  const [gameMode, setGameMode] = useState('menu'); // 'menu', 'playing', 'finished'
  const [timeMode, setTimeMode] = useState('3min'); // '3min', '5min', 'survival'
  const [timeLeft, setTimeLeft] = useState(180); // 3 minutes in seconds
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [puzzlesSolved, setPuzzlesSolved] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [puzzleRushBestStreak, setPuzzleRushBestStreak] = useState(0);
  const [lastMove, setLastMove] = useState(null); // Store last move for display
  const [gameHistory, setGameHistory] = useState([]);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [currentMoveIndex, setCurrentMoveIndex] = useState(0);
  const [puzzleSolved, setPuzzleSolved] = useState(false);
  const [puzzle, setPuzzle] = useState(null);
  const [moveIndex, setMoveIndex] = useState(0);

  const moveSoundRef = useRef(null);
  const captureSoundRef = useRef(null);
  const castleSoundRef = useRef(null);
  const successSoundRef = useRef(null);
  const wrongSoundRef = useRef(null);
  const timerRef = useRef(null);

  const timeModes = [
    { id: '3min', name: '3 Minutes', time: 180, desc: 'Solve as many easy puzzles as possible in 3 minutes' },
    { id: '5min', name: '5 Minutes', time: 300, desc: 'Solve as many easy puzzles as possible in 5 minutes' }
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

    // Success and wrong sounds (user provided in public/sounds)
    try {
      successSoundRef.current = new Audio('/sounds/success.mp3');
      successSoundRef.current.load();
    } catch (e) {
      console.warn('Could not load success sound:', e);
    }
    try {
      wrongSoundRef.current = new Audio('/sounds/wrong.mp3');
      wrongSoundRef.current.load();
    } catch (e) {
      console.warn('Could not load wrong sound:', e);
    }

    // Load initial puzzle when component mounts
    // Note: This will be called when gameMode changes to 'playing'

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
    // Only fetch puzzle rush best streak - no regular puzzle rating
    fetchPuzzleRushBestStreak();
  }, []);

  const fetchPuzzleRushBestStreak = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const response = await fetch(getApiUrl('stats/puzzle-rush-best-streak'), {
          headers: getAuthHeaders()
        });
        if (response.ok) {
          const data = await response.json();
          setPuzzleRushBestStreak(data.bestStreak || 0);
        }
      }
    } catch (error) {
      console.error('Error fetching puzzle rush best streak:', error);
    }
  };

  // Removed user rating effect - puzzle rush doesn't use regular puzzle rating

  useEffect(() => {
    if (isTimerRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            endGame();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timerRef.current);
    }
  }, [isTimerRunning]);

  

  // Puzzle rush doesn't use regular puzzle rating - only best streak
  // const fetchUserRating = async () => {
  //   // Removed - puzzle rush has its own rating system (best streak)
  // };



  const loadNewPuzzle = useCallback(async () => {
    if (gameMode !== 'playing') return;
    
    // Clear all visual elements immediately
    setDrawnArrows([]);
    setHighlightedSquares([]);
    setSelectedSquare(null);
    setLastMove(null);
    
    setLoading(true);
    setFeedback('');
    setShowSolution(false);
    setSolution([]);
    setPuzzleComplete(false);
    setPuzzleState('active');
    setCurrentMoveIndex(0);
    setPuzzleSolved(false);
    setMoveIndex(0);

    try {
      // Use the same API as PuzzleSolvePage - this works perfectly!
      const token = localStorage.getItem('token');
      const headers = token ? { 'x-auth-token': token } : {};

      // Use puzzle rush specific API endpoint - separate from regular puzzles
      const url = getApiUrl('puzzle-rush/random?maxRating=1499');
      console.log('🌐 Fetching puzzle from:', url);

      const response = await fetch(url, {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Puzzle Rush API response:', data);

        // Puzzle rush API returns single puzzle object
        if (data?.success && data.puzzle) {
          console.log('🎯 Selected puzzle:', data.puzzle);
          initializePuzzle({ puzzle: data.puzzle });
        } else if (data?.puzzle) {
          // Handle case where success field is missing but puzzle exists
          console.log('🎯 Selected puzzle (no success field):', data.puzzle);
          initializePuzzle({ puzzle: data.puzzle });
        } else {
          throw new Error('No puzzle in response');
        }
      } else {
        throw new Error('Failed to fetch puzzle from API');
      }
    } catch (error) {
      console.error('Error loading puzzle from database:', error);
      
      // Fallback to local puzzles if database fails
      const fallbackPuzzles = [
        {
          _id: 'fallback-1',
          fen: 'rnbqkb1r/pppp1ppp/5n2/4p3/2B1P3/8/PPPP1PPP/RNBQK1NR w KQkq - 0 1',
          moves: ['Nf3'],
          rating: 400,
          theme: 'development',
          difficulty: 'intermediate'
        },
        {
          _id: 'fallback-2',
          fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
          moves: ['e4'],
          rating: 300,
          theme: 'opening',
          difficulty: 'beginner'
        },
        {
          _id: 'fallback-3',
          fen: 'rnbqkb1r/pppp1ppp/5n2/4p3/2B1P3/8/PPPP1PPP/RNBQK1NR w KQkq - 0 1',
          moves: ['Bc4'],
          rating: 450,
          theme: 'development',
          difficulty: 'intermediate'
        },
        {
          _id: 'fallback-5',
          fen: 'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2',
          moves: ['Nf3'],
          rating: 350,
          theme: 'opening',
          difficulty: 'beginner'
        },
        {
          _id: 'fallback-6',
          fen: 'rnbqkb1r/pppp1ppp/5n2/4p3/2B1P3/8/PPPP1PPP/RNBQK1NR w KQkq - 0 1',
          moves: ['d4'],
          rating: 500,
          theme: 'development',
          difficulty: 'intermediate'
        }
      ];
      
      const randomPuzzle = fallbackPuzzles[Math.floor(Math.random() * fallbackPuzzles.length)];
      initializePuzzle({ puzzle: randomPuzzle });
    } finally {
      setLoading(false);
    }
  }, [gameMode]);

  // Load puzzle when entering 'playing' after loadNewPuzzle is defined
  useEffect(() => {
    if (gameMode === 'playing') {
      loadNewPuzzle();
    }
  }, [gameMode, loadNewPuzzle]);

  // Fetch puzzle rush stats on component mount
  useEffect(() => {
    fetchPuzzleRushStats();
  }, []);

  // Initialize puzzle using EXACT same logic as PuzzleSolvePage
  const initializePuzzle = useCallback((puzzleData) => {
    console.log('🔧 Initializing puzzle:', puzzleData);
    
    // Clear all visual elements immediately
    setDrawnArrows([]);
    setHighlightedSquares([]);
    setSelectedSquare(null);
    
    if (!puzzleData?.puzzle) {
      console.error('Invalid puzzle data:', puzzleData);
      setFeedback('No puzzle data available.');
      setLoading(false);
      return;
    }

    try {
      const newGame = new Chess(puzzleData.puzzle.fen);
      console.log('✅ Created Chess game with FEN:', puzzleData.puzzle.fen);
      let userMoveIndex = 0;

      // Try to play the first move as the opponent's move if it exists
      const firstMove = puzzleData.puzzle.moves[0];
      if (firstMove && puzzleData.puzzle.moves.length > 1) {
        try {
          // Try both UCI and SAN formats
          let firstMoveResult = null;
          if (firstMove.length === 4 && /^[a-h][1-8][a-h][1-8]$/.test(firstMove)) {
            // UCI format
            firstMoveResult = newGame.move({ 
              from: firstMove.substring(0, 2), 
              to: firstMove.substring(2, 4), 
              promotion: 'q' 
            });
          } else if (firstMove.length === 5 && /^[a-h][1-8][a-h][1-8][qrbn]$/.test(firstMove)) {
            // UCI format with promotion
            firstMoveResult = newGame.move({ 
              from: firstMove.substring(0, 2), 
              to: firstMove.substring(2, 4), 
              promotion: firstMove[4]
            });
          } else {
            // SAN format
            firstMoveResult = newGame.move(firstMove, { sloppy: true });
          }
          
          if (firstMoveResult) {
            userMoveIndex = 1;
            console.log('✅ Played opponent move:', firstMove);
            // Set the last move for highlighting
            setLastMove({
              from: firstMoveResult.from,
              to: firstMoveResult.to
            });
          } else {
            console.log('⚠️ Could not play first move, user starts:', firstMove);
          }
        } catch (error) {
          console.log('⚠️ First move failed, user is to move:', error.message);
        }
      }

      console.log('✅ Setting puzzle state with:', puzzleData.puzzle);
      setPuzzle({ ...puzzleData.puzzle, originalMoves: [...puzzleData.puzzle.moves] });
      setCurrentPuzzle(puzzleData.puzzle);
      setGame(newGame);
      setFen(newGame.fen());
      console.log('🎯 Game state set with FEN:', newGame.fen());
      setMoveIndex(userMoveIndex);
      setShowSolution(false);
      setFeedback('Your turn to move!');
      setPuzzleState('active');
      setSelectedSquare(null);

      // Clear arrows when loading new puzzle
      setDrawnArrows([]);
      
      // Set orientation based on side to move
      setOrientation(newGame.turn() === 'w' ? 'white' : 'black');
      setLoading(false);
      console.log('✅ Puzzle initialization complete!');
      
      // Extra safety: clear arrows after a short delay
      setTimeout(() => {
        setDrawnArrows([]);
      }, 100);
      
      setTotalAttempts(prev => prev + 1);
    } catch (err) {
      console.error('Error initializing puzzle:', err);
      setFeedback('Failed to initialize puzzle. Please try again.');
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

  // Update puzzle rush stats
  const updatePuzzleRushStats = async (solved, timeSpent = null) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(getApiUrl('puzzle-rush/update-stats'), {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ solved, timeSpent })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setPuzzleRushStats(data.stats);
        }
      }
    } catch (error) {
      console.error('Error updating puzzle rush stats:', error);
    }
  };

  // Fetch puzzle rush stats
  const fetchPuzzleRushStats = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(getApiUrl('puzzle-rush/user-stats'), {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setPuzzleRushStats(data.stats);
        }
      }
    } catch (error) {
      console.error('Error fetching puzzle rush stats:', error);
    }
  };

  // Move handling using the same logic as PuzzleSolvePage
  const onPieceDrop = (from, to, piece) => {
      if (!game || !puzzle || puzzleState !== 'active' || puzzleComplete) {
      return false;
    }

    console.log('=== PUZZLE RUSH MOVE VALIDATION START ===');
    console.log('Attempting move from', from, 'to', to);
    console.log('Current move index:', moveIndex);
    console.log('Game turn:', game.turn());
    console.log('Puzzle moves:', puzzle.moves);

    // Strict check: ensure the piece being moved is of the correct color
    const pieceObj = game.get(from);
    if (!pieceObj) {
      console.log('❌ No piece on square:', from);
      setFeedback('No piece on this square.');
      return false;
    }

    if (pieceObj.color !== game.turn()) {
      console.log('❌ Wrong color piece. Piece color:', pieceObj.color, 'Game turn:', game.turn());
      setFeedback('Wrong color to move!');
      return false;
    }

    try {
      // Get the expected move for this position first
      const expectedMove = puzzle.moves[moveIndex];
      console.log('Current move index:', moveIndex);
      console.log('Expected move:', expectedMove);
      
      if (!expectedMove) {
        console.error('❌ No expected move found for index:', moveIndex);
        return false;
      }

      // Determine promotion piece from expected move
      let promotionPiece = 'q'; // Default to queen
      if (expectedMove.length === 5 && /^[a-h][1-8][a-h][1-8][qrbn]$/.test(expectedMove)) {
        // UCI format with promotion
        promotionPiece = expectedMove[4];
      } else if (expectedMove.includes('=')) {
        // SAN format with promotion (e.g., "e8=Q")
        const promotionMatch = expectedMove.match(/=([QRBN])/);
        if (promotionMatch) {
          promotionPiece = promotionMatch[1].toLowerCase();
        }
      }

      // First, check if the move is legal in the current position
      const tempGame = new Chess(game.fen());
      const move = tempGame.move({ from, to, promotion: promotionPiece });
      
      if (!move) {
        console.log('❌ Illegal move - not allowed');
        return false;
      }

      console.log('✅ Move is legal:', move.san);
      playMoveSound(move);

      console.log('Actual move SAN:', move.san);
      console.log('Actual move UCI:', move.from + move.to);
      
      // Compare the actual move with the expected move
      const actualMoveSan = move.san;
      const actualMoveUCI = move.from + move.to;
      
      // Check if expected move is in UCI format
      const isExpectedUCI = expectedMove.length === 4 && /^[a-h][1-8][a-h][1-8]$/.test(expectedMove) ||
                            expectedMove.length === 5 && /^[a-h][1-8][a-h][1-8][qrbn]$/.test(expectedMove);
      
      let isCorrectMove = false;
      if (isExpectedUCI) {
        // Compare UCI format
        isCorrectMove = actualMoveUCI === expectedMove.substring(0, 4);
        console.log('UCI comparison:', { actual: actualMoveUCI, expected: expectedMove.substring(0, 4), isCorrect: isCorrectMove });
      } else {
        // Compare SAN format
        isCorrectMove = actualMoveSan === expectedMove;
        console.log('SAN comparison:', { actual: actualMoveSan, expected: expectedMove, isCorrect: isCorrectMove });
      }
      
      if (isCorrectMove) {
        console.log('✅ Move is correct! Playing move and opponent reply...');

        // Move is correct, play it and the opponent's reply
        const newGame = new Chess(game.fen());
        const userMove = newGame.move({ from, to, promotion: promotionPiece });
        
        let newMoveIndex = moveIndex + 1;
        
        console.log('User move played:', userMove.san);
        setGame(newGame);
        setFen(newGame.fen());
        setMoveIndex(newMoveIndex);

        // Auto-play opponent's move if it exists
        const opponentMove = puzzle.moves[newMoveIndex];
        if (opponentMove) {
          try {
            let opponentMoveResult = null;
            if (opponentMove.length === 4 && /^[a-h][1-8][a-h][1-8]$/.test(opponentMove)) {
              // UCI format
              opponentMoveResult = newGame.move({
                from: opponentMove.substring(0, 2),
                to: opponentMove.substring(2, 4),
                promotion: 'q' // Default to queen for opponent moves
              });
            } else if (opponentMove.length === 5 && /^[a-h][1-8][a-h][1-8][qrbn]$/.test(opponentMove)) {
              // UCI format with promotion
              opponentMoveResult = newGame.move({
                from: opponentMove.substring(0, 2),
                to: opponentMove.substring(2, 4),
                promotion: opponentMove[4]
              });
            } else {
              // SAN format
              opponentMoveResult = newGame.move(opponentMove, { sloppy: true });
            }

            if (opponentMoveResult) {
              console.log('✅ Played opponent move:', opponentMove);
              setGame(newGame);
              setFen(newGame.fen());
              setMoveIndex(newMoveIndex + 1);

              // Set last move for highlighting
              setLastMove({
                from: opponentMoveResult.from,
                to: opponentMoveResult.to
              });
            }
          } catch (error) {
            console.log('⚠️ Could not play opponent move:', error.message);
          }
        }

        // Check if puzzle is complete after all moves
        if (newMoveIndex >= puzzle.moves.length) {
          console.log('🎉 Puzzle completed!');
          setPuzzleComplete(true);
          setPuzzleSolved(true);
          setPuzzleState('completed');
          setFeedback('Puzzle solved! Well done!');
          setScore(prev => prev + 1);
          setPuzzlesSolved(prev => prev + 1);
          setCurrentStreak(prev => prev + 1);
          updatePuzzleRushStats(true);
          try { successSoundRef.current && successSoundRef.current.play(); } catch(e) { /* ignore */ }
          setTimeout(() => {
            loadNewPuzzle();
          }, 400);
        } else {
          // Puzzle continues - user must play the next move
          console.log('Puzzle continues, next move index:', newMoveIndex);
          setFeedback('Correct! Your turn again.');
        }

        setSelectedSquare(null);
        setHighlightedSquares([]);
        return true;
      } else {
        console.log('❌ Move is incorrect');
        try { wrongSoundRef.current && wrongSoundRef.current.play(); } catch(e) { /* ignore */ }
        // No penalty beyond lost time; just move to next puzzle
        setFeedback('Wrong move! Next puzzle...');
        setSelectedSquare(null);
        setHighlightedSquares([]);
        updatePuzzleRushStats(false);
        setTimeout(() => {
          loadNewPuzzle();
        }, 200);
        return false;
      }
    } catch (error) {
      console.error('Error processing move:', error);
      setFeedback('Error processing move. Please try again.');
      setSelectedSquare(null);
      setHighlightedSquares([]);
      return false;
    }
  };

  const startGame = async (mode) => {
    // Check usage limits for free users
    if (user && user.userType !== 'premium') {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(getApiUrl('usage-limits/puzzle-rush'), {
          headers: getAuthHeaders()
        });
        
        if (response.ok) {
          const limitData = await response.json();
          if (!limitData.allowed) {
            alert(`You've reached your daily limit of 3 puzzle rush sessions. Come back tomorrow or upgrade to premium for unlimited access!`);
            return;
          }
          
          // Increment usage
          await fetch(getApiUrl('usage-limits/puzzle-rush/increment'), {
            method: 'POST',
            headers: getAuthHeaders()
          });
        }
      } catch (error) {
        console.error('Error checking usage limits:', error);
      }
    }
    
    setTimeMode(mode);
    setGameMode('playing');
    setScore(0);
    setPuzzlesSolved(0);
    setCurrentStreak(0);
    setLastMove(null); // Reset last move
    setGameHistory([]);
    setFeedback('');
    setShowSolution(false);
    setPuzzleComplete(false);
    setPuzzleState('active');
    
    const selectedMode = timeModes.find(m => m.id === mode);
    if (selectedMode && selectedMode.time > 0) {
      setTimeLeft(selectedMode.time);
      setIsTimerRunning(true);
    }
    
    // Load puzzle immediately when starting game
    loadNewPuzzle();
  };

  const endGame = () => {
    setIsTimerRunning(false);
    setGameMode('finished');
    setPuzzleState('inactive');
    
    if (currentStreak > bestStreak) {
      setBestStreak(currentStreak);
    }
    
    if (currentStreak > puzzleRushBestStreak) {
      setPuzzleRushBestStreak(currentStreak);
      savePuzzleRushBestStreak(currentStreak);
    }
    
    // Save game result
    saveGameResult();
  };

  const savePuzzleRushBestStreak = async (streak) => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        await fetch(getApiUrl('stats/puzzle-rush-best-streak'), {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ bestStreak: streak })
        });
      }
    } catch (error) {
      console.error('Error saving puzzle rush best streak:', error);
    }
  };

  const saveGameResult = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const gameResult = {
        mode: timeMode,
        score: score,
        puzzlesSolved: puzzlesSolved,
        timeSpent: timeModes.find(m => m.id === timeMode)?.time - timeLeft,
        streak: currentStreak
      };

      await fetch(getApiUrl('puzzles/rush/result'), {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(gameResult)
      });
    } catch (error) {
      console.error('Error saving game result:', error);
    }
  };

  const resetGame = () => {
    setGameMode('menu');
    setScore(0);
    setPuzzlesSolved(0);
    setCurrentStreak(0);
    setTimeLeft(180);
    setIsTimerRunning(false);
    setPuzzleComplete(false);
    setPuzzleState('active');
    setCurrentPuzzle(null);
    setGame(null);
    setFen('');
    setFeedback('');
    setShowSolution(false);
    setSolution([]);
    setSelectedSquare(null);
    setDrawnArrows([]);
    setHighlightedSquares([]);
  };

  const formatTime = (seconds) => {
    if (seconds < 0) return '∞';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const onSquareClick = (square) => {
    if (!game || puzzleState !== 'active' || puzzleComplete) return;

    if (selectedSquare) {
      const piece = game.get(selectedSquare);
      const move = {
        from: selectedSquare,
        to: square,
        promotion: 'q'
      };

      try {
        const tempGame = new Chess(game.fen());
        const moveResult = tempGame.move(move);

        if (moveResult) {
          const success = onPieceDrop(selectedSquare, square, piece);
          if (success) {
            setSelectedSquare(null);
            setHighlightedSquares([]);
          } else {
            const newPiece = game.get(square);
            if (newPiece && newPiece.color === game.turn()) {
              setSelectedSquare(square);
              setHighlightedSquares([square]);
            } else {
              setSelectedSquare(null);
              setHighlightedSquares([]);
            }
          }
        } else {
          const newPiece = game.get(square);
          if (newPiece && newPiece.color === game.turn()) {
            setSelectedSquare(square);
            setHighlightedSquares([square]);
          } else {
            setSelectedSquare(null);
            setHighlightedSquares([]);
          }
        }
      } catch (error) {
        const newPiece = game.get(square);
        if (newPiece && newPiece.color === game.turn()) {
          setSelectedSquare(square);
          setHighlightedSquares([square]);
        } else {
          setSelectedSquare(null);
          setHighlightedSquares([]);
        }
      }
    } else {
      const piece = game.get(square);
      if (piece && piece.color === game.turn()) {
        setSelectedSquare(square);
        setHighlightedSquares([square]);
      } else {
        setSelectedSquare(null);
        setHighlightedSquares([]);
      }
    }
  };

  const onPieceDragBegin = (piece, sourceSquare) => {
    if (!game || puzzleState !== 'active' || puzzleComplete) return false;

    const pieceObj = game.get(sourceSquare);
    if (!pieceObj || pieceObj.color !== game.turn()) {
      setFeedback('Wrong color to move!');
      return false;
    }

    setSelectedSquare(sourceSquare);
    setHighlightedSquares([sourceSquare]);
    return true;
  };

  // Combine user-drawn arrows and last move arrow (same as PuzzleSolvePage)
  const getAllArrows = () => {
    const moveArrow = getMoveArrowFromHistory(game);
    const userArrows = drawnArrows.map(a => [a.from, a.to, a.color || '#f39c12']);
    const moveArr = moveArrow ? [[moveArrow.from, moveArrow.to, moveArrow.color]] : [];
    return [...userArrows, ...moveArr];
  };

  if (gameMode === 'menu') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-3 sm:p-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800 mb-3 sm:mb-4">Puzzle Rush</h1>
            <p className="text-sm sm:text-base lg:text-lg text-gray-600 mb-4">
              Test your tactical skills under time pressure
            </p>
            {/* Removed user rating display - puzzle rush uses best streak only */}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
            {timeModes.map((mode) => (
              <div
                key={mode.id}
                className="bg-white rounded-xl p-4 sm:p-6 shadow-lg hover:shadow-xl transition-shadow cursor-pointer border-2 border-transparent hover:border-blue-200"
                onClick={() => startGame(mode.id)}
              >
                <div className="text-center">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                    <Clock className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2">{mode.name}</h3>
                  <p className="text-gray-600 text-xs sm:text-sm">{mode.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {puzzleRushBestStreak > 0 && (
            <div className="text-center">
              <div className="inline-flex items-center bg-yellow-100 rounded-lg px-3 sm:px-4 py-2">
                <Award className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600 mr-2" />
                <span className="text-yellow-800 font-medium text-sm sm:text-base">Best Puzzle Rush Streak: {puzzleRushBestStreak}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (gameMode === 'finished') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-3 sm:p-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-xl p-4 sm:p-6 lg:p-8 shadow-lg text-center">
            <Trophy className="w-12 h-12 sm:w-16 sm:h-16 text-yellow-500 mx-auto mb-3 sm:mb-4" />
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-3 sm:mb-4">Game Complete!</h1>
            
            <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
              <div className="bg-blue-50 rounded-lg p-3 sm:p-4">
                <div className="text-xl sm:text-2xl font-bold text-blue-600">{score}</div>
                <div className="text-xs sm:text-sm text-gray-600">Points</div>
              </div>
              <div className="bg-green-50 rounded-lg p-3 sm:p-4">
                <div className="text-xl sm:text-2xl font-bold text-green-600">{puzzlesSolved}</div>
                <div className="text-xs sm:text-sm text-gray-600">Puzzles Solved</div>
              </div>
            </div>

            <div className="bg-yellow-50 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
              <div className="text-xl sm:text-2xl font-bold text-yellow-600">{currentStreak}</div>
              <div className="text-xs sm:text-sm text-gray-600">Final Streak</div>
            </div>

            <button
              onClick={resetGame}
              className="bg-blue-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
            >
              Play Again
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
                <span className="font-bold text-lg sm:text-xl text-gray-800">{formatTime(timeLeft)}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Target className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                <span className="font-bold text-lg sm:text-xl text-gray-800">{score}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600" />
                <span className="font-bold text-lg sm:text-xl text-gray-800">{currentStreak}</span>
              </div>
              {/* Removed mistakes display to align with no-penalty scoring (wrong answers give no points) */}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={endGame}
                className="bg-red-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm sm:text-base"
              >
                End Game
              </button>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">

          {/* Chessboard */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg p-3 sm:p-6 shadow-sm">
              {game && fen ? (
                <div>
                  {/* Side to move indicator */}
                  <div className="text-center mb-4">
                    <div className={`inline-flex items-center px-4 py-2 rounded-lg font-bold text-lg ${
                      game.turn() === 'w'
                        ? 'bg-white text-gray-800 border-2 border-gray-300'
                        : 'bg-gray-800 text-white border-2 border-gray-600'
                    }`}>
                      <div className={`w-4 h-4 rounded-full mr-2 ${
                        game.turn() === 'w' ? 'bg-gray-800' : 'bg-white'
                      }`}></div>
                      {game.turn() === 'w' ? 'White to move' : 'Black to move'}
                    </div>
                  </div>
                  <div className="flex justify-center" style={{ overflow: 'visible' }}>
                    {/* Interactive board only - no analysis UI */}
                    <div
                      className="w-full"
                      style={{
                        maxWidth: boardSize,
                        width: '100%',
                        aspectRatio: '1',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        ...TOUCH_BOARD_STYLE
                      }}
                    >
                      <Chessboard
                        id="PuzzleRushBoard"
                        position={fen}
                        boardWidth={boardSize}
                        onPieceDragBegin={onPieceDragBegin}
                        onPieceDrop={(from, to) => onPieceDrop(from, to, game.get(from))}
                        onSquareClick={onSquareClick}
                        arePiecesDraggable={true}
                        animationDuration={200}
                        boardOrientation={orientation}
                        showBoardNotation={false}
                        areArrowsAllowed={false}
                        customArrows={getAllArrows()}
                        customSquareStyles={{}}
                        customBoardStyle={{
                          ...TOUCH_BOARD_STYLE
                        }}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500">Loading puzzle...</div>
              )}
            </div>
          </div>

          {/* Info Panel */}
          <div className="space-y-4">
             {/* Current Puzzle Info */}
             {currentPuzzle && (
               <div className="bg-white rounded-lg p-3 sm:p-4 shadow-sm">
                 <h3 className="font-bold text-base sm:text-lg mb-2">Current Puzzle</h3>
                 <p className="text-gray-600 text-xs sm:text-sm mb-2">
                   Theme: {currentPuzzle.theme || 'Mixed'}
                 </p>
                 <p className="text-gray-600 text-xs sm:text-sm mb-2">
                   Rating: {currentPuzzle.rating || 'Unknown'}
                 </p>
                  {lastMove && lastMove.from && lastMove.to && (
                    <p className="text-gray-600 text-xs sm:text-sm font-medium">
                      Last move: <span className="text-blue-600">{lastMove.from}-{lastMove.to}</span>
                    </p>
                  )}
               </div>
             )}

            {/* Feedback */}
            {feedback && (
              <div className={`p-3 sm:p-4 rounded-lg text-sm sm:text-base ${
                feedback.includes('solved') || feedback.includes('Good')
                  ? 'bg-green-100 text-green-800'
                  : feedback.includes('Error') || feedback.includes('Not the best')
                  ? 'bg-red-100 text-red-800'
                  : 'bg-blue-100 text-blue-800'
              }`}>
                {feedback}
              </div>
            )}

            {/* Next Puzzle Button */}
            <button
              onClick={() => loadNewPuzzle()}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 sm:py-3 px-3 sm:px-4 rounded-lg transition-colors flex items-center justify-center space-x-2 text-sm sm:text-base"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Next Puzzle</span>
            </button>

            {/* Stats */}
            <div className="bg-white rounded-lg p-3 sm:p-4 shadow-sm">
              <h3 className="font-bold text-base sm:text-lg mb-2 sm:mb-3">Session Stats</h3>
              <div className="space-y-1 sm:space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600 text-xs sm:text-sm">Puzzles Solved:</span>
                  <span className="font-medium text-xs sm:text-sm">{puzzlesSolved}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 text-xs sm:text-sm">Current Streak:</span>
                  <span className="font-medium text-xs sm:text-sm">{currentStreak}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 text-xs sm:text-sm">Best Streak:</span>
                  <span className="font-medium text-xs sm:text-sm">{bestStreak}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PuzzleRushPage;

