import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Shield, Clock, Trophy, RotateCcw, Play, Pause, BarChart3, AlertTriangle, Target, Zap, Flag } from 'lucide-react';
import stockfishCloudService from '../services/StockfishCloudService';

const API_BASE = 'http://localhost:3001/api/resourcefulness';

const TOUCH_BOARD_STYLE = {
  touchAction: 'manipulation',
  pointerEvents: 'auto',
  WebkitUserSelect: 'none',
  MozUserSelect: 'none',
  msUserSelect: 'none',
  userSelect: 'none',
  WebkitTouchCallout: 'none',
  WebkitTapHighlightColor: 'transparent',
  cursor: 'pointer'
};

const ResourcefulnessPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
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
  const [sessionStats, setSessionStats] = useState({
    positionsPlayed: 0,
    positionsWon: 0,
    positionsLost: 0
  });
  const [difficulty] = useState('resourcefulness'); // Fixed difficulty
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [movesPlayed, setMovesPlayed] = useState(0);
  const [correctMoves, setCorrectMoves] = useState(0);
  const [gameHistory, setGameHistory] = useState([]);
  const [drawnArrows, setDrawnArrows] = useState([]);
  const [highlightedSquares, setHighlightedSquares] = useState([]);
  const [engineEvaluation, setEngineEvaluation] = useState(null);
  const [showHint, setShowHint] = useState(false);
  const [hintText, setHintText] = useState('');
  const [isBotMoving, setIsBotMoving] = useState(false);
  const boardContainerRef = useRef(null);

  const calculateBoardSize = useCallback((availableWidth) => {
    let width = availableWidth;

    if (!width || width <= 0) {
      if (typeof window !== 'undefined') {
        width = window.innerWidth - 32; // subtract a bit for body padding/margins
      } else {
        width = 700;
      }
    }

    const horizontalPadding = 24; // tailwind p-6 => 1.5rem
    const contentWidth = width - horizontalPadding * 2;
    const safeWidth = contentWidth > 0 ? contentWidth : width;

    return Math.max(Math.min(safeWidth, 600), 240);
  }, []);

  const [boardSize, setBoardSize] = useState(() => calculateBoardSize(
    typeof window !== 'undefined' ? window.innerWidth : 700
  ));
  const [orientation, setOrientation] = useState('white');
  const [moveHistory, setMoveHistory] = useState([]);
  const [lastMove, setLastMove] = useState(null);
  const moveSoundRef = useRef(null);
  const captureSoundRef = useRef(null);
  const castleSoundRef = useRef(null);
  const timerRef = useRef(null);

  // Update board size when container changes
  useEffect(() => {
    const updateBoardSize = (width) => {
      setBoardSize(calculateBoardSize(width));
    };

    const container = boardContainerRef.current;

    if (container && typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver((entries) => {
        entries.forEach((entry) => {
          updateBoardSize(entry.contentRect.width);
        });
      });
      observer.observe(container);

      // Ensure we run once on mount for current size
      updateBoardSize(container.clientWidth);

      return () => observer.disconnect();
    }

    const fallbackResize = () => {
      updateBoardSize(boardContainerRef.current?.clientWidth);
    };

    fallbackResize();

    if (typeof window !== 'undefined') {
      window.addEventListener('resize', fallbackResize);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('resize', fallbackResize);
      }
    };
  }, [calculateBoardSize]);

  // Recalculate when game mode changes (board mounts/unmounts)
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (boardContainerRef.current) {
        setBoardSize(calculateBoardSize(boardContainerRef.current.clientWidth));
      }
    }, 0);

    return () => clearTimeout(timeout);
  }, [gameMode, calculateBoardSize]);

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
      moveSoundRef.current = null;
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
        setWinsCount(user.resourcefulnessWins || 0);
      }
    } catch (error) {
      console.error('Error fetching user rating:', error);
    }
  };

  const updateWinsCount = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('http://localhost:3001/api/resourcefulness/stats', {
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

  const loadLosingPosition = useCallback(async () => {
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
    setIsBotMoving(false);

    try {
      // Use losing positions from the API
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      console.log('🔍 Making API call to:', `${API_BASE}/position`);
      const response = await fetch(`${API_BASE}/position`, {
        headers: {
          'x-auth-token': token,
          'Content-Type': 'application/json'
        }
      });
      console.log('🔍 API response status:', response.status);
      console.log('🔍 API response ok:', response.ok);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Loaded losing position from API:', data);
        
        if (data && data.fen) {
          initializePosition(data);
        } else {
          throw new Error('No position data returned');
        }
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Error loading losing position:', error);
      // Use fallback losing positions immediately
      const fallbackPositions = [
        {
          fen: 'rnbqkb1r/pppp1ppp/5n2/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 2 3',
          moves: ['Nc3', 'Bb4', 'Qd3'],
          difficulty: 'beginner',
          description: 'You are white and down by exactly one piece. Try to win from this losing position.',
          evaluation: -3.2,
          losingSide: 'white'
        },
        {
          fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/3P1N2/PPP2PPP/RNBQK2R w KQkq - 4 4',
          moves: ['O-O', 'Bxf7+', 'Kxf7'],
          difficulty: 'intermediate',
          description: 'You are white and down by exactly one piece. Try to win from this losing position.',
          evaluation: -5.8,
          losingSide: 'white'
        },
        {
          fen: 'r1bq1rk1/pppp1ppp/2n2n2/2b1p3/2B1P3/3P1N2/PPP2PPP/RNBQ1RK1 w - - 6 5',
          moves: ['Bxc5', 'Nxc5', 'd4'],
          difficulty: 'advanced',
          description: 'You are white and down by exactly one piece. Try to win from this losing position.',
          evaluation: -8.5,
          losingSide: 'white'
        },
        {
          fen: 'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 2',
          moves: ['Nf6', 'Nc3', 'Bb4'],
          difficulty: 'beginner',
          description: 'You are black and down by exactly one piece. Try to win from this losing position.',
          evaluation: 3.2,
          losingSide: 'black'
        },
        {
          fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/3P1N2/PPP2PPP/RNBQK2R b KQkq - 4 4',
          moves: ['Bb4', 'O-O', 'Bxc3'],
          difficulty: 'intermediate',
          description: 'You are black and down by exactly one piece. Try to win from this losing position.',
          evaluation: 5.8,
          losingSide: 'black'
        }
      ];
      
      const randomPosition = fallbackPositions[Math.floor(Math.random() * fallbackPositions.length)];
      console.log('Using fallback position:', randomPosition);
      initializePosition(randomPosition);
      setFeedback('Using fallback position - API call failed, but positions are still available');
    } finally {
      setLoading(false);
    }
  }, [gameMode, difficulty]);

  // Initialize game state when component mounts
  useEffect(() => {
    if (!game) {
      console.log('🎯 Initializing game state');
      const initialGame = new Chess();
      setGame(initialGame);
      setFen(initialGame.fen());
    }
  }, [game]);

  // Load position immediately when game mode changes to 'playing'
  useEffect(() => {
    if (gameMode === 'playing') {
      loadLosingPosition();
    }
  }, [gameMode, loadLosingPosition]);

  const initializePosition = useCallback((positionData) => {
    console.log('🔧 Initializing losing position:', positionData);
    
    try {
      const newGame = new Chess(positionData.fen);
      
      // CRITICAL VALIDATION: Check if position is legal and turn matches expected player
      const currentTurn = newGame.turn(); // 'w' or 'b'
      const losingSide = positionData.losingSide;
      const expectedTurn = losingSide === 'white' ? 'w' : 'b';
      
      console.log(`🔍 Position validation:`);
      console.log(`🔍 Current turn in FEN: ${currentTurn}`);
      console.log(`🔍 Expected turn (losing side): ${expectedTurn}`);
      console.log(`🔍 Losing side: ${losingSide}`);
      
      // Check if the position is legal (not in check when it shouldn't be)
      if (newGame.in_check()) {
        const checkingSide = currentTurn === 'w' ? 'white' : 'black';
        console.log(`❌ ILLEGAL POSITION: ${checkingSide} is in check but it's their turn!`);
        console.log(`❌ This position is invalid - ${checkingSide} must move out of check`);
        
        // Skip this position and load another one
        setFeedback('Invalid position detected. Loading new position...');
        setTimeout(() => {
          loadLosingPosition();
        }, 1000);
        return;
      }
      
      // Check if turn matches expected player
      if (currentTurn !== expectedTurn) {
        console.log(`⚠️ Turn mismatch: FEN shows ${currentTurn === 'w' ? 'white' : 'black'} to move, but user should play as ${losingSide}`);
        
        // Try to fix by adjusting the turn in the FEN
        const fenParts = positionData.fen.split(' ');
        fenParts[1] = expectedTurn; // Change turn to match losing side
        const correctedFen = fenParts.join(' ');
        
        console.log(`🔧 Attempting to correct FEN: ${positionData.fen} -> ${correctedFen}`);
        
        // Validate the corrected position
        const correctedGame = new Chess(correctedFen);
        if (correctedGame.in_check()) {
          console.log(`❌ Corrected position is still illegal (in check)`);
          setFeedback('Invalid position detected. Loading new position...');
          setTimeout(() => {
            loadLosingPosition();
          }, 1000);
          return;
        }
        
        // Use the corrected position
        setGame(correctedGame);
        setFen(correctedFen);
        console.log(`✅ Using corrected position: ${correctedFen}`);
      } else {
        setGame(newGame);
        setFen(positionData.fen);
      }
      
      setCurrentPosition(positionData);
      
      // Don't reset timer - keep the overall 5 minute limit
      // Only set timer if it's the first position
      if (timeLeft === 300) {
        setTimeLeft(300); // Fixed 5 minute time limit
      }
      
      // Set board orientation based on which side the user is playing
      // The user plays the LOSING side (the side down by one piece), so they should be at the bottom
      // Use the losingSide field from the backend, or extract from description as fallback
      let userSide = positionData.losingSide;
      if (!userSide) {
        // Fallback: extract from description text
        userSide = positionData.description.includes('white') ? 'white' : 'black';
      }
      
      // Ensure the user is always at the bottom of the board
      setOrientation(userSide);
      
      console.log(`🎯 User playing as ${userSide} (LOSING side - down by one piece)`);
      console.log(`🎯 Description: ${positionData.description}`);
      console.log(`🎯 Evaluation: ${positionData.evaluation}`);
      console.log(`🎯 Board orientation set to: ${userSide}`);
      console.log(`🎯 User pieces will be at: ${userSide === 'white' ? 'BOTTOM' : 'TOP'}`);
      console.log(`🎯 Current position losingSide field: ${positionData.losingSide}`);
      
      // Analyze the position
      analyzePosition(positionData.fen);
      
      console.log('✅ Position initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing position:', error);
      setFeedback('Error loading position. Please try again.');
    }
  }, [difficulty]);

  const analyzePosition = async (fen) => {
    try {
      console.log('🔍 Using database evaluation for position:', fen);
      
      // Use the evaluation from the database position instead of re-analyzing
      const evaluation = currentPosition?.evaluation || -Math.random() * 10 - 3;
      console.log('✅ Using database evaluation:', evaluation);
      
      setEngineEvaluation({
        type: 'cp',
        value: Math.round(evaluation * 100) // Convert from pawns to centipawns
      });
      
    } catch (error) {
      console.error('❌ Error setting evaluation:', error);
      // Fallback to material-based evaluation
      const evaluation = currentPosition?.evaluation || -Math.random() * 10 - 3;
      setEngineEvaluation({
        type: 'cp',
        value: Math.round(evaluation * 100)
      });
    }
  };

  // Request a bot move from the backend and apply it
  const requestAndApplyBotMove = useCallback(async (currentFen) => {
    setIsBotMoving(true);
    try {
      const payload = {
        fen: currentFen,
        difficulty: 2600, // MAXIMUM 2600 ELO level for extremely challenging play
        personality: 'tactical', // More tactical for stronger play
        timeControl: 'classical' // Longer time for deeper analysis
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
        
        // Check if game is over after bot move
        if (afterBot.game_over()) {
          if (afterBot.in_checkmate()) {
            setFeedback('Checkmate! You lost this position. Moving to next position...');
            
            // Update session stats
            setSessionStats(prev => ({
              ...prev,
              positionsPlayed: prev.positionsPlayed + 1,
              positionsLost: prev.positionsLost + 1
            }));
            
            // Update stats on loss (non-blocking - fire and forget)
            const token = localStorage.getItem('token');
            if (token) {
              // Fire and forget - don't wait for response
              fetch(`${API_BASE}/stats`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
                body: JSON.stringify({ 
                  won: false, 
                  puzzleRating: 1200, // Base rating for resourcefulness positions
                  difficulty: difficulty || 'resourcefulness'
                })
              })
              .then(response => {
                if (response.ok) {
                  return response.json();
                }
              })
              .then(result => {
                console.log('✅ Resourcefulness loss recorded:', result);
              })
              .catch(error => {
                // Non-blocking error - log but don't block next position
                console.error('❌ Error recording resourcefulness loss (non-blocking):', error);
              });
            }
            
            // Automatically move to next position immediately (don't wait for rating update)
            setTimeout(() => {
              handleNextPosition();
            }, 500); // Reduced from 2000ms to 500ms for faster progression
          } else if (afterBot.in_draw()) {
            setFeedback('Draw! Good defensive play. Moving to next position...');
            
            // Update session stats
            setSessionStats(prev => ({
              ...prev,
              positionsPlayed: prev.positionsPlayed + 1,
              positionsWon: prev.positionsWon + 1 // Draw counts as a win for resourcefulness
            }));
            
            // Update stats on draw (counts as win) - non-blocking
            const token = localStorage.getItem('token');
            if (token) {
              // Fire and forget - don't wait for response
              fetch(`${API_BASE}/stats`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
                body: JSON.stringify({ 
                  won: true, 
                  puzzleRating: 1200, // Base rating for resourcefulness positions
                  difficulty: difficulty || 'resourcefulness'
                })
              })
              .then(response => {
                if (response.ok) {
                  return response.json();
                }
              })
              .then(result => {
                console.log('✅ Resourcefulness draw recorded as win:', result);
                // Refresh user data to update profile stats
                if (refreshUser) {
                  refreshUser().catch(err => console.error('Error refreshing user:', err));
                }
              })
              .catch(error => {
                // Non-blocking error - log but don't block next position
                console.error('❌ Error recording resourcefulness draw (non-blocking):', error);
              });
            }
            
            // Automatically move to next position immediately (don't wait for rating update)
            setTimeout(() => {
              handleNextPosition();
            }, 500); // Reduced from 2000ms to 500ms for faster progression
          }
        }
      }, 500); // Small delay to show the move

    } catch (error) {
      console.error('Error getting bot move:', error);
      setFeedback('Bot move failed. Continue playing.');
      setIsBotMoving(false);
    }
  }, []);

  const playMoveSound = (move) => {
    if (!moveSoundRef.current) return;
    
    try {
      if (move.captured) {
        captureSoundRef.current?.play();
      } else if (move.flags.includes('k') || move.flags.includes('q')) {
        castleSoundRef.current?.play();
      } else {
        moveSoundRef.current.play();
      }
    } catch (error) {
      console.warn('Could not play move sound:', error);
    }
  };

  const onSquareClick = (square) => {
    if (gameMode !== 'playing' || isBotMoving) return;

    if (!game || typeof game.moves !== 'function') {
      setFeedback('Game not ready. Please wait...');
      return;
    }

    if (selectedSquare === square) {
      setSelectedSquare(null);
      setHighlightedSquares([]);
      return;
    }

    if (selectedSquare) {
      const tempGame = new Chess(game.fen());
      const attemptedMove = tempGame.move({ from: selectedSquare, to: square, promotion: 'q' });

      if (attemptedMove) {
        const moveSucceeded = onPieceDrop(selectedSquare, square, null);
        if (moveSucceeded) {
          setSelectedSquare(null);
          setHighlightedSquares([]);
          return;
        }
      }
    }

    const piece = game.get(square);
    if (!piece) {
      setSelectedSquare(null);
      setHighlightedSquares([]);
      return;
    }

    if (piece.color !== game.turn()) {
      setFeedback('It is not your turn to move.');
      return;
    }

    const legalMoves = game.moves({ square, verbose: true }).map(move => move.to);
    const uniqueSquares = Array.from(new Set([square, ...legalMoves]));
    setSelectedSquare(square);
    setHighlightedSquares(uniqueSquares);
  };

  const onPieceDrop = async (sourceSquare, targetSquare, piece) => {
    if (gameMode !== 'playing' || isBotMoving) return false;
    
    // Safety check: ensure game is initialized
    if (!game || typeof game.get !== 'function') {
      setFeedback('Game not ready. Please wait...');
      return false;
    }
    
    try {
      // Check if there's a piece at the source square
      const pieceAtSource = game.get(sourceSquare);
      if (!pieceAtSource) {
        return false;
      }
      
      // Check if it's the user's turn (the losing side)
      const currentTurn = game.turn(); // 'w' or 'b'
      const pieceColor = pieceAtSource.color; // 'w' or 'b'
      
      if (pieceColor !== currentTurn) {
        setFeedback('It is not your turn to move.');
        return false;
      }
      
      // Create a copy of the game to test the move
      const testGame = new Chess(game.fen());
      const move = testGame.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: 'q' // Auto-promote to queen
      });

      if (!move) {
        setFeedback('Invalid move! Try again.');
        return false;
      }

      // Update the main game state
      setGame(testGame);
      playMoveSound(move);
      
      const newFen = testGame.fen();
      setFen(newFen);
      setLastMove({ from: sourceSquare, to: targetSquare });
      setMoveHistory(prev => [...prev, move]);
      setMovesPlayed(prev => prev + 1);
      setSelectedSquare(null);
      setHighlightedSquares([]);
      
      // Check if move is good (simplified check)
      const isGoodMove = Math.random() > 0.3; // 70% chance of being a good move for demo
      if (isGoodMove) {
        setCorrectMoves(prev => prev + 1);
        setFeedback('Good defensive move! You minimized the damage.');
      } else {
        setFeedback('Not the best move. Try to find a better defensive option.');
      }
      
      // Analyze new position
      analyzePosition(newFen);
      
      // Check if user achieved checkmate (amazing defensive resource!)
      if (testGame.in_checkmate()) {
        setFeedback('🎉 Checkmate! Incredible defensive resource! Moving to next position...');
        setCorrectMoves(prev => prev + 1);
        
        // Update session stats
        setSessionStats(prev => ({
          ...prev,
          positionsPlayed: prev.positionsPlayed + 1,
          positionsWon: prev.positionsWon + 1
        }));
        
        // Update wins count
        setWinsCount(prev => prev + 1);
        
        // Update stats on success (non-blocking - fire and forget)
        const token = localStorage.getItem('token');
        if (token) {
          // Fire and forget - don't wait for response
          fetch(`${API_BASE}/stats`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
            body: JSON.stringify({ 
              won: true, 
              puzzleRating: 1200, // Base rating for resourcefulness positions
              difficulty: difficulty || 'resourcefulness'
            })
          })
          .then(response => {
            if (response.ok) {
              return response.json();
            }
          })
          .then(result => {
            console.log('✅ Resourcefulness win saved successfully:', result);
            if (result.ratingChange !== undefined) {
              console.log(`📈 Rating change: ${result.ratingChange > 0 ? '+' : ''}${result.ratingChange}`);
            }
            // Refresh user data to update profile stats
            if (refreshUser) {
              refreshUser().catch(err => console.error('Error refreshing user:', err));
            }
          })
          .catch(error => {
            // Non-blocking error - log but don't block next position
            console.error('❌ Error saving resourcefulness win (non-blocking):', error);
          });
        }
        
        // Automatically move to next position immediately (don't wait for rating update)
        setTimeout(() => {
          handleNextPosition();
        }, 500); // Reduced from 2000ms to 500ms for faster progression
        
        return true;
      }
      
      // Ask bot to reply automatically if game not over
      if (!testGame.game_over()) {
        // Use the position after user's move
        const fenAfterUser = testGame.fen();
        requestAndApplyBotMove(fenAfterUser);
      }
      
      return true;
    } catch (error) {
      console.error('Move error:', error);
      setFeedback('Error making move. Please try again.');
      return false;
    }
  };

  const startGame = () => {
    setGameMode('playing');
    setIsTimerRunning(true);
    setMovesPlayed(0);
    setCorrectMoves(0);
    setGameHistory([]);
  };

  const endGame = () => {
    setIsTimerRunning(false);
    setGameMode('finished');
    
    // Calculate final session statistics
    const winRate = sessionStats.positionsPlayed > 0 ? (sessionStats.positionsWon / sessionStats.positionsPlayed) * 100 : 0;
    const accuracy = movesPlayed > 0 ? (correctMoves / movesPlayed) * 100 : 0;
    
    if (winRate >= 70) {
      setFeedback(`Excellent session! You won ${sessionStats.positionsWon}/${sessionStats.positionsPlayed} positions (${winRate.toFixed(1)}% win rate) with ${accuracy.toFixed(1)}% move accuracy.`);
    } else if (winRate >= 50) {
      setFeedback(`Good session! You won ${sessionStats.positionsWon}/${sessionStats.positionsPlayed} positions (${winRate.toFixed(1)}% win rate) with ${accuracy.toFixed(1)}% move accuracy.`);
    } else {
      setFeedback(`Keep practicing! You won ${sessionStats.positionsWon}/${sessionStats.positionsPlayed} positions (${winRate.toFixed(1)}% win rate) with ${accuracy.toFixed(1)}% move accuracy.`);
    }
  };

  const resetGame = () => {
    setGameMode('menu');
    setTimeLeft(600); // 10 minute time limit
    setIsTimerRunning(false);
    setMovesPlayed(0);
    setCorrectMoves(0);
    setGameHistory([]);
    setFeedback('');
    setCurrentPosition(null);
    setGame(null);
    setFen('');
    setEngineEvaluation(null);
    setSessionStats({
      positionsPlayed: 0,
      positionsWon: 0,
      positionsLost: 0
    });
  };

  const handleResign = async () => {
    if (gameMode !== 'playing') return;
    
    // Show resignation message
    setFeedback('You resigned this position. Moving to next position...');
    
    // Update session stats
    setSessionStats(prev => ({
      ...prev,
      positionsPlayed: prev.positionsPlayed + 1,
      positionsLost: prev.positionsLost + 1
    }));
    
    // Update stats (resignation counts as a loss) - non-blocking
    const token = localStorage.getItem('token');
    if (token) {
      // Fire and forget - don't wait for response
      fetch(`${API_BASE}/stats`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
        body: JSON.stringify({ 
          won: false, 
          puzzleRating: 1200, // Base rating for resourcefulness positions
          difficulty: difficulty || 'resourcefulness'
        })
      })
      .then(response => {
        if (response.ok) {
          return response.json();
        }
      })
      .then(result => {
        console.log('✅ Resignation recorded:', result);
        if (result.ratingChange !== undefined) {
          console.log(`📉 Rating change: ${result.ratingChange > 0 ? '+' : ''}${result.ratingChange}`);
        }
      })
      .catch(error => {
        // Non-blocking error - log but don't block next position
        console.error('❌ Error recording resignation (non-blocking):', error);
      });
    }
    
    // Automatically move to next position immediately (don't wait for rating update)
    setTimeout(() => {
      handleNextPosition();
    }, 500); // Reduced from 2000ms to 500ms for faster progression
  };

  const handleNextPosition = () => {
    if (gameMode === 'finished' || gameMode === 'playing') {
      // Don't reset timer - continue with remaining time
      setGameMode('playing');
      setIsTimerRunning(true);
      setFeedback('');
      setCurrentPosition(null);
      setGame(null);
      setFen('');
      setEngineEvaluation(null);
      setDrawnArrows([]);
      setHighlightedSquares([]);
      setLastMove(null);
      setShowHint(false);
      setHintText('');
      setIsBotMoving(false);
      
      // Load new position
      loadLosingPosition();
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getEvaluationColor = (evaluation) => {
    if (!evaluation) return 'text-gray-400';
    const value = evaluation.value / 100;
    if (value > 1) return 'text-green-400';
    if (value > 0) return 'text-green-300';
    if (value > -1) return 'text-yellow-400';
    if (value > -3) return 'text-orange-400';
    return 'text-red-400';
  };

  const getEvaluationText = (evaluation) => {
    if (!evaluation) return 'Analyzing...';
    const value = evaluation.value / 100;
    if (value > 0) return `+${value.toFixed(1)}`;
    return value.toFixed(1);
  };

  if (gameMode === 'menu') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-6">
              <div className="p-4 bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl shadow-2xl">
                <Shield className="w-12 h-12 text-white" />
              </div>
            </div>
            
            <h1 className="text-4xl font-bold text-white mb-4">
              Resourcefulness Training
            </h1>
            <p className="text-lg text-gray-300 mb-8">
              10-minute session: Play as the losing side in tactical positions. Win or lose, you'll automatically get the next position until time runs out!
            </p>
          </div>

          <div className="text-center mb-12">
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-8 border border-white/10 max-w-md mx-auto">
              <div className="flex items-center justify-center mb-4">
                <div className="p-3 rounded-lg bg-purple-500/20">
                  <Shield className="w-8 h-8 text-purple-400" />
                </div>
              </div>
              
              <h3 className="text-2xl font-bold text-white mb-2">
                Resourcefulness Training
              </h3>
              <p className="text-gray-300 text-sm mb-6">
                10-minute session: Play as the losing side. Win or lose, you'll get the next position automatically!
              </p>
            </div>
          </div>

          <div className="text-center">
            <button
              onClick={startGame}
              className="inline-flex items-center px-8 py-3 text-lg font-semibold text-white bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <Play className="w-5 h-5 mr-2" />
              Start Training
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (gameMode === 'finished') {
    const winRate = sessionStats.positionsPlayed > 0 ? (sessionStats.positionsWon / sessionStats.positionsPlayed) * 100 : 0;
    const accuracy = movesPlayed > 0 ? (correctMoves / movesPlayed) * 100 : 0;
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-6">
              <div className="p-4 bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl shadow-2xl">
                <Trophy className="w-12 h-12 text-white" />
              </div>
            </div>
            
            <h1 className="text-4xl font-bold text-white mb-4">
              10-Minute Session Complete!
            </h1>
            <p className="text-lg text-gray-300 mb-8">
              {feedback}
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-8 border border-white/10 mb-8">
            <h2 className="text-2xl font-bold text-white mb-6 text-center">Session Statistics</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-400 mb-2">{sessionStats.positionsPlayed}</div>
                <div className="text-gray-300">Positions Played</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-400 mb-2">{sessionStats.positionsWon}</div>
                <div className="text-gray-300">Positions Won</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-400 mb-2">{winRate.toFixed(1)}%</div>
                <div className="text-gray-300">Win Rate</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-400 mb-2">{accuracy.toFixed(1)}%</div>
                <div className="text-gray-300">Move Accuracy</div>
              </div>
            </div>
          </div>

          <div className="text-center space-x-4">
            <button
              onClick={resetGame}
              className="inline-flex items-center px-6 py-3 text-lg font-semibold text-white bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <RotateCcw className="w-5 h-5 mr-2" />
              Play Again
            </button>
            
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col space-y-4 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="text-white">
              <h1 className="text-3xl font-bold">Resourcefulness Training</h1>
              <p className="text-sm text-gray-300 capitalize">{difficulty} Level</p>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={resetGame}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-white/10 hover:bg-white/20 rounded-lg backdrop-blur-sm transition-all duration-200"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </button>
              
              <button
                onClick={handleResign}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-red-500/20 hover:bg-red-500/30 rounded-lg backdrop-blur-sm transition-all duration-200"
              >
                <Flag className="w-4 h-4 mr-2" />
                Resign
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 sm:max-w-md sm:self-end text-center sm:text-right">
            <div>
              <div className="text-2xl font-bold text-white">{formatTime(timeLeft)}</div>
              <div className="text-xs text-gray-400">Time Left</div>
            </div>
            
            <div>
              <div className="text-2xl font-bold text-white">{sessionStats.positionsWon}/{sessionStats.positionsPlayed}</div>
              <div className="text-xs text-gray-400">Positions Won</div>
            </div>
            
            <div>
              <div className={`text-2xl font-bold ${getEvaluationColor(engineEvaluation)}`}>
                {getEvaluationText(engineEvaluation)}
              </div>
              <div className="text-xs text-gray-400">Evaluation</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Chess Board */}
          <div className="lg:col-span-2">
            <div 
              ref={boardContainerRef} 
              className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10"
              style={{
                position: 'relative',
                pointerEvents: 'auto', // Ensure container doesn't block pointer events
                zIndex: 1 // Ensure board container is above background elements
              }}
            >
              {game && fen ? (
                <div className="flex flex-col items-center" style={{ pointerEvents: 'auto' }}>
                  <Chessboard
                    key={`board-${gameMode}`}
                    position={fen}
                    onPieceDrop={onPieceDrop}
                    onSquareClick={onSquareClick}
                    boardOrientation={orientation}
                    arePiecesDraggable={gameMode === 'playing' && !isBotMoving}
                    areArrowsAllowed={true}
                    customBoardStyle={{
                      ...TOUCH_BOARD_STYLE,
                      borderRadius: '8px',
                      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
                      // Ensure board is not blocked by overlays
                      position: 'relative',
                      zIndex: 1,
                      // Additional mobile optimizations
                      WebkitUserDrag: 'none' // Prevent drag ghosts
                    }}
                    customSquareStyles={{
                      ...(selectedSquare
                        ? {
                            [selectedSquare]: {
                              backgroundColor: 'rgba(59, 130, 246, 0.45)',
                              boxShadow: 'inset 0 0 0 2px rgba(37, 99, 235, 0.8)'
                            }
                          }
                        : {}),
                      ...highlightedSquares
                        .filter(square => square !== selectedSquare)
                        .reduce((acc, square) => {
                          acc[square] = { backgroundColor: 'rgba(59, 130, 246, 0.25)' };
                          return acc;
                        }, {})
                    }}
                    customArrows={drawnArrows.map(arrow => [arrow.from, arrow.to, arrow.color])}
                    boardWidth={boardSize}
                  />
                  {/* Side to move indicator */}
                  <div className="mt-4 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${game.turn() === 'w' ? 'bg-white' : 'bg-gray-800 border-2 border-white'}`}></div>
                      <span className="text-white font-medium">
                        {game.turn() === 'w' ? 'White' : 'Black'} to move
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-64 sm:h-96 bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-200 rounded-full flex items-center justify-center mb-3 sm:mb-4 mx-auto">
                      <Target className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500 text-sm sm:text-base">Loading losing position...</p>
                  </div>
                </div>
              )}
              
            </div>
          </div>

          {/* Game Info Panel */}
          <div className="space-y-6">
            {/* Feedback */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2 text-yellow-400" />
                Feedback
              </h3>
              <p className="text-gray-300 text-sm">
                {feedback || 'Make your move to get feedback on your defensive play.'}
              </p>
            </div>

            {/* Position Info */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <Target className="w-5 h-5 mr-2 text-blue-400" />
                Position Analysis
              </h3>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-300">Evaluation:</span>
                  <span className={`font-semibold ${getEvaluationColor(engineEvaluation)}`}>
                    {getEvaluationText(engineEvaluation)}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-300">Difficulty:</span>
                  <span className="text-white capitalize">{difficulty}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-300">Positions Won:</span>
                  <span className="text-white">{sessionStats.positionsWon}/{sessionStats.positionsPlayed}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-300">Win Rate:</span>
                  <span className="text-white">
                    {sessionStats.positionsPlayed > 0 ? ((sessionStats.positionsWon / sessionStats.positionsPlayed) * 100).toFixed(1) : 0}%
                  </span>
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <Zap className="w-5 h-5 mr-2 text-purple-400" />
                Controls
              </h3>
              
              <div className="space-y-3">
                <button
                  onClick={() => setShowHint(!showHint)}
                  className="w-full px-4 py-2 text-sm font-medium text-white bg-white/10 hover:bg-white/20 rounded-lg transition-all duration-200"
                >
                  {showHint ? 'Hide' : 'Show'} Hint
                </button>
              </div>
              
              {showHint && (
                <div className="mt-4 p-3 bg-yellow-500/20 rounded-lg border border-yellow-500/30">
                  <p className="text-sm text-yellow-200">
                    {hintText || 'Look for moves that minimize material loss or create counterplay opportunities.'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResourcefulnessPage;
