import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { DndProvider } from 'react-dnd';
import { TouchBackend } from 'react-dnd-touch-backend';
import ProductionChessBoard from './ProductionChessBoard';
import { Chess } from 'chess.js';
import { useAuth } from '../contexts/AuthContext';
import { Trophy, Target, Clock, RotateCcw, Eye } from 'lucide-react';
import { savePuzzleResult, getRecentPuzzles, PUZZLE_TYPES } from '../utils/puzzleTracker';
import { updateDailyProgress, MODULE_NAMES } from '../utils/dailyProgress';
import { getApiUrl, getAuthHeaders } from '../config/api';

const TOUCH_BOARD_STYLE = {
  // Use 'manipulation' to allow panning (dragging) while preventing zoom/scroll
  touchAction: 'manipulation',
  WebkitUserSelect: 'none',
  userSelect: 'none',
  WebkitTouchCallout: 'none',
  WebkitTapHighlightColor: 'transparent'
};

  // Helper to get the last move arrow from the game history
function getMoveArrowFromHistory(game) {
  if (!game) return null;
  const history = game.history({ verbose: true });
  if (history.length === 0) return null;
  const lastMove = history[history.length - 1];
  return { from: lastMove.from, to: lastMove.to, color: '#2196f3' };
}


const EndgameTrainerPage = () => {
  const { user, refreshUser } = useAuth();
  const [selectedTheme, setSelectedTheme] = useState('pawn');
  const [currentPuzzle, setCurrentPuzzle] = useState(null);
  const [game, setGame] = useState(null);
  const [fen, setFen] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [showSolution, setShowSolution] = useState(false);
  const [puzzleComplete, setPuzzleComplete] = useState(false);
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [score, setScore] = useState(0);
  const [moveIndex, setMoveIndex] = useState(0);
  const [endgameThemes, setEndgameThemes] = useState([]);
  const [themesLoading, setThemesLoading] = useState(true);
  const [solutionStep, setSolutionStep] = useState(0);
  // Calculate responsive board size
  const getResponsiveBoardSize = () => {
    if (typeof window !== 'undefined') {
      const isMobile = window.innerWidth < 768;
      const isTablet = window.innerWidth >= 768 && window.innerWidth < 1280;
      if (isMobile) return Math.min(window.innerWidth - 64, 350);
      if (isTablet) return Math.min(window.innerWidth - 128, 500);
      return 800; // Desktop default
    }
    return 400; // SSR fallback
  };

  const [boardSize, setBoardSize] = useState(getResponsiveBoardSize());
  const [boardOrientation, setBoardOrientation] = useState('white');
  const [orientationLocked, setOrientationLocked] = useState(false);
  const [selectedDifficulty, setSelectedDifficulty] = useState('intermediate');
  const [ratingChange, setRatingChange] = useState(null);
  const [showRatingChange, setShowRatingChange] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [puzzleHistory, setPuzzleHistory] = useState([]);
  const [drawnArrows, setDrawnArrows] = useState([]);
  const [isReplay, setIsReplay] = useState(false); // Track if this is a replay from history
  const boardRef = useRef(null);
  const boardAreaRef = useRef(null);
  const boardContainerRef = useRef(null);
  const [boardAreaWidth, setBoardAreaWidth] = useState(0);
  const isTouchDevice = useMemo(() => {
    if (typeof window === 'undefined') return false;
    const nav = window.navigator || {};
    const maxTouchPoints = typeof nav.maxTouchPoints === 'number' ? nav.maxTouchPoints : 0;
    const msTouchPoints = typeof nav.msMaxTouchPoints === 'number' ? nav.msMaxTouchPoints : 0;
    return 'ontouchstart' in window || maxTouchPoints > 0 || msTouchPoints > 0;
  }, []);
  const touchBackendOptions = useMemo(() => ({
    enableMouseEvents: true,
    enableTouchEvents: true,
    enableKeyboardEvents: true,
    delayTouchStart: 0,
    touchSlop: 8,
    ignoreContextMenu: true
  }), []);

  // Audio refs for sound effects
  const moveSoundRef = useRef(null);
  const captureSoundRef = useRef(null);
  const castleSoundRef = useRef(null);

  // Sample positions for each endgame type (fallback data) with proper difficulty ratings
  const endgamePositions = useMemo(() => ({
    'pawn': [
      // Beginner (800-1200)
      {
        _id: 'fallback-pawn-beginner-1',
        fen: '8/8/8/3p4/3P4/8/8/8 w - - 0 1',
        moves: ['Kd2', 'Kd7', 'Kd3', 'Kd6', 'Kd4'],
        rating: 900,
        description: 'Pawn vs Pawn - Opposition is key'
      },
      {
        _id: 'fallback-pawn-beginner-2',
        fen: '8/8/8/8/2k1p3/4P3/4K3/8 w - - 0 1',
        moves: ['Kd2', 'Kd5', 'Kd3', 'Ke5', 'Ke2'],
        rating: 1000,
        description: 'Passed pawn endgame'
      },
      // Intermediate (1200-1800)
      {
        _id: 'fallback-pawn-intermediate-1',
        fen: '8/8/8/8/2k1p3/4P3/4K3/8 w - - 0 1',
        moves: ['Kd2', 'Kd5', 'Kd3', 'Ke5', 'Ke2'],
        rating: 1400,
        description: 'Complex pawn endgame'
      },
      {
        _id: 'fallback-pawn-intermediate-2',
        fen: '8/8/8/8/2k1p3/4P3/4K3/8 w - - 0 1',
        moves: ['Kd2', 'Kd5', 'Kd3', 'Ke5', 'Ke2'],
        rating: 1600,
        description: 'Advanced pawn technique'
      },
      // Advanced (1800+)
      {
        _id: 'fallback-pawn-advanced-1',
        fen: '8/8/8/8/2k1p3/4P3/4K3/8 w - - 0 1',
        moves: ['Kd2', 'Kd5', 'Kd3', 'Ke5', 'Ke2'],
        rating: 1900,
        description: 'Master-level pawn endgame'
      }
    ],
    'rook': [
      // Beginner (800-1200)
      {
        _id: 'fallback-rook-beginner-1',
        fen: '8/8/8/8/8/8/4k3/4K3 w - - 0 1',
        moves: ['Rh1', 'Kd2', 'Rh7', 'Ke3', 'Rh8'],
        rating: 900,
        description: 'Basic rook endgame'
      },
      {
        _id: 'fallback-rook-beginner-2',
        fen: '8/8/8/8/8/8/4k3/4K3 w - - 0 1',
        moves: ['Rh1', 'Kd2', 'Rh7', 'Ke3', 'Rh8'],
        rating: 1100,
        description: 'Rook vs King technique'
      },
      // Intermediate (1200-1800)
      {
        _id: 'fallback-rook-intermediate-1',
        fen: '8/8/8/8/8/8/4k3/4K3 w - - 0 1',
        moves: ['Rh1', 'Kd2', 'Rh7', 'Ke3', 'Rh8'],
        rating: 1400,
        description: 'Complex rook endgame'
      },
      {
        _id: 'fallback-rook-intermediate-2',
        fen: '8/8/8/8/8/8/4k3/4K3 w - - 0 1',
        moves: ['Rh1', 'Kd2', 'Rh7', 'Ke3', 'Rh8'],
        rating: 1600,
        description: 'Advanced rook technique'
      },
      // Advanced (1800+)
      {
        _id: 'fallback-rook-advanced-1',
        fen: '8/8/8/8/8/8/4k3/4K3 w - - 0 1',
        moves: ['Rh1', 'Kd2', 'Rh7', 'Ke3', 'Rh8'],
        rating: 1900,
        description: 'Master-level rook endgame'
      }
    ],
    'queen': [
      // Beginner (800-1200)
      {
        _id: 'fallback-queen-beginner-1',
        fen: '8/8/8/8/8/8/4k3/4K3 w - - 0 1',
        moves: ['Qh1', 'Kd2', 'Qh7', 'Ke3', 'Qh8'],
        rating: 900,
        description: 'Basic queen endgame'
      },
      {
        _id: 'fallback-queen-beginner-2',
        fen: '8/8/8/8/8/8/4k3/4K3 w - - 0 1',
        moves: ['Qh1', 'Kd2', 'Qh7', 'Ke3', 'Qh8'],
        rating: 1100,
        description: 'Queen vs King technique'
      },
      // Intermediate (1200-1800)
      {
        _id: 'fallback-queen-intermediate-1',
        fen: '8/8/8/8/8/8/4k3/4K3 w - - 0 1',
        moves: ['Qh1', 'Kd2', 'Qh7', 'Ke3', 'Qh8'],
        rating: 1400,
        description: 'Complex queen endgame'
      },
      {
        _id: 'fallback-queen-intermediate-2',
        fen: '8/8/8/8/8/8/4k3/4K3 w - - 0 1',
        moves: ['Qh1', 'Kd2', 'Qh7', 'Ke3', 'Qh8'],
        rating: 1600,
        description: 'Advanced queen technique'
      },
      // Advanced (1800+)
      {
        _id: 'fallback-queen-advanced-1',
        fen: '8/8/8/8/8/8/4k3/4K3 w - - 0 1',
        moves: ['Qh1', 'Kd2', 'Qh7', 'Ke3', 'Qh8'],
        rating: 1900,
        description: 'Master-level queen endgame'
      }
    ],
    'bishop': [
      // Beginner (800-1200)
      {
        _id: 'fallback-bishop-beginner-1',
        fen: '8/8/8/8/8/8/4k3/4K3 w - - 0 1',
        moves: ['Bh1', 'Kd2', 'Bh7', 'Ke3', 'Bh8'],
        rating: 900,
        description: 'Basic bishop endgame'
      },
      {
        _id: 'fallback-bishop-beginner-2',
        fen: '8/8/8/8/8/8/4k3/4K3 w - - 0 1',
        moves: ['Bh1', 'Kd2', 'Bh7', 'Ke3', 'Bh8'],
        rating: 1100,
        description: 'Bishop vs King technique'
      },
      // Intermediate (1200-1800)
      {
        _id: 'fallback-bishop-intermediate-1',
        fen: '8/8/8/8/8/8/4k3/4K3 w - - 0 1',
        moves: ['Bh1', 'Kd2', 'Bh7', 'Ke3', 'Bh8'],
        rating: 1400,
        description: 'Complex bishop endgame'
      },
      {
        _id: 'fallback-bishop-intermediate-2',
        fen: '8/8/8/8/8/8/4k3/4K3 w - - 0 1',
        moves: ['Bh1', 'Kd2', 'Bh7', 'Ke3', 'Bh8'],
        rating: 1600,
        description: 'Advanced bishop technique'
      },
      // Advanced (1800+)
      {
        _id: 'fallback-bishop-advanced-1',
        fen: '8/8/8/8/8/8/4k3/4K3 w - - 0 1',
        moves: ['Bh1', 'Kd2', 'Bh7', 'Ke3', 'Bh8'],
        rating: 1900,
        description: 'Master-level bishop endgame'
      }
    ],
    'knight': [
      // Beginner (800-1200)
      {
        _id: 'fallback-knight-beginner-1',
        fen: '8/8/8/8/8/8/4k3/4K3 w - - 0 1',
        moves: ['Nh1', 'Kd2', 'Nh7', 'Ke3', 'Nh8'],
        rating: 900,
        description: 'Basic knight endgame'
      },
      {
        _id: 'fallback-knight-beginner-2',
        fen: '8/8/8/8/8/8/4k3/4K3 w - - 0 1',
        moves: ['Nh1', 'Kd2', 'Nh7', 'Ke3', 'Nh8'],
        rating: 1100,
        description: 'Knight vs King technique'
      },
      // Intermediate (1200-1800)
      {
        _id: 'fallback-knight-intermediate-1',
        fen: '8/8/8/8/8/8/4k3/4K3 w - - 0 1',
        moves: ['Nh1', 'Kd2', 'Nh7', 'Ke3', 'Nh8'],
        rating: 1400,
        description: 'Complex knight endgame'
      },
      {
        _id: 'fallback-knight-intermediate-2',
        fen: '8/8/8/8/8/8/4k3/4K3 w - - 0 1',
        moves: ['Nh1', 'Kd2', 'Nh7', 'Ke3', 'Nh8'],
        rating: 1600,
        description: 'Advanced knight technique'
      },
      // Advanced (1800+)
      {
        _id: 'fallback-knight-advanced-1',
        fen: '8/8/8/8/8/8/4k3/4K3 w - - 0 1',
        moves: ['Nh1', 'Kd2', 'Nh7', 'Ke3', 'Nh8'],
        rating: 1900,
        description: 'Master-level knight endgame'
      }
    ],
    'mate4': [
      // Beginner (800-1200)
      {
        _id: 'fallback-mate4-beginner-1',
        fen: '8/8/8/8/8/3k4/3QK3/8 w - - 0 1',
        moves: ['Qd4+', 'Ke6', 'Qd5+', 'Kf6', 'Qd6+'],
        rating: 900,
        description: 'Basic checkmate pattern'
      },
      {
        _id: 'fallback-mate4-beginner-2',
        fen: '8/8/8/8/8/3k4/3QK3/8 w - - 0 1',
        moves: ['Qd4+', 'Ke6', 'Qd5+', 'Kf6', 'Qd6+'],
        rating: 1100,
        description: 'Simple mate in 4'
      },
      // Intermediate (1200-1800)
      {
        _id: 'fallback-mate4-intermediate-1',
        fen: '8/8/8/8/8/3k4/3QK3/8 w - - 0 1',
        moves: ['Qd4+', 'Ke6', 'Qd5+', 'Kf6', 'Qd6+'],
        rating: 1400,
        description: 'Complex mate in 4'
      },
      {
        _id: 'fallback-mate4-intermediate-2',
        fen: '8/8/8/8/8/3k4/3QK3/8 w - - 0 1',
        moves: ['Qd4+', 'Ke6', 'Qd5+', 'Kf6', 'Qd6+'],
        rating: 1600,
        description: 'Advanced mate pattern'
      },
      // Advanced (1800+)
      {
        _id: 'fallback-mate4-advanced-1',
        fen: '8/8/8/8/8/3k4/3QK3/8 w - - 0 1',
        moves: ['Qd4+', 'Ke6', 'Qd5+', 'Kf6', 'Qd6+'],
        rating: 2000,
        description: 'Complex queen endgame'
      }
    ]
  }), []);

  // Update board size metrics on resize
  useEffect(() => {
    const measureBoardArea = () => {
      if (!boardAreaRef.current) return;
      const rect = boardAreaRef.current.getBoundingClientRect();
      const width = rect?.width || boardAreaRef.current.clientWidth || 0;
      setBoardAreaWidth(Math.max(0, Math.round(width)));
    };

    const handleResize = () => {
      setBoardSize(getResponsiveBoardSize());
      measureBoardArea();
    };

    // Use a small delay to ensure the container is rendered
    const timeoutId = setTimeout(() => {
      handleResize();
    }, 0);

    window.addEventListener('resize', handleResize);

    let resizeObserver;
    if (typeof ResizeObserver !== 'undefined' && boardAreaRef.current) {
      resizeObserver = new ResizeObserver(() => measureBoardArea());
      resizeObserver.observe(boardAreaRef.current);
      // Also observe parent containers
      const parentWithP1 = boardAreaRef.current.parentElement;
      if (parentWithP1) {
        resizeObserver.observe(parentWithP1);
        const parentWithP2 = parentWithP1.parentElement;
        if (parentWithP2) {
          resizeObserver.observe(parentWithP2);
        }
      }
    }

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', handleResize);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, []);

  const effectiveBoardWidth = useMemo(() => {
    if (boardAreaWidth > 0) {
      const availableWidth = Math.max(0, boardAreaWidth - 16);
      return Math.max(220, Math.min(boardSize, availableWidth));
    }
    return Math.max(220, boardSize);
  }, [boardSize, boardAreaWidth]);

  // Post-load and post-puzzle re-measure to mirror puzzle page behavior
  useEffect(() => {
    const measure = () => {
      if (!boardAreaRef.current) return;
      const rect = boardAreaRef.current.getBoundingClientRect();
      const width = rect?.width || boardAreaRef.current.clientWidth || 0;
      setBoardAreaWidth(Math.max(0, Math.round(width)));
    };
    if (typeof window !== 'undefined') {
      if (document.readyState === 'complete') {
        setTimeout(measure, 0);
        setTimeout(measure, 200);
      } else {
        const onLoad = () => {
          setTimeout(measure, 0);
          setTimeout(measure, 200);
        };
        window.addEventListener('load', onLoad, { once: true });
        return () => window.removeEventListener('load', onLoad);
      }
    }
  }, [fen, currentPuzzle, loading, boardSize]);

  // Get user's endgame rating from AuthContext
  const userEndgameRating = user?.endgameRating || 1200;

  // Combine user-drawn arrows and last move arrow
  const getAllArrows = () => {
    const moveArrow = getMoveArrowFromHistory(game);
    const userArrows = drawnArrows.map(a => [a.from, a.to, a.color || '#f39c12']);
    const moveArr = moveArrow ? [[moveArrow.from, moveArrow.to, moveArrow.color]] : [];
    return [...userArrows, ...moveArr];
  };

  // Get custom square styles for highlighting clickable pieces
  const getCustomSquareStyles = () => {
    const styles = {};
    if (selectedSquare) {
      styles[selectedSquare] = { 
        backgroundColor: 'rgba(34, 197, 94, 0.6)',
        boxShadow: 'inset 0 0 0 2px rgba(34, 197, 94, 0.8)',
        borderRadius: '4px'
      };
    }
    return styles;
  };

  // Set board orientation based on whose turn it is
  useEffect(() => {
    if (game && !showSolution && !orientationLocked && !puzzleComplete) {
      // Always show the side to move at the bottom, but don't change during solution replay or after puzzle completion
      const newOrientation = game.turn() === 'w' ? 'white' : 'black';
      console.log('🔄 Orientation useEffect triggered - setting to:', newOrientation, 'showSolution:', showSolution, 'locked:', orientationLocked, 'puzzleComplete:', puzzleComplete);
      setBoardOrientation(newOrientation);
    } else if (showSolution || orientationLocked || puzzleComplete) {
      console.log('🔄 Orientation useEffect triggered but showSolution is true or orientation is locked or puzzle is complete, skipping orientation change');
    }
  }, [game, showSolution, orientationLocked, puzzleComplete]);

  // Save puzzle history to localStorage using the new tracking system
  const savePuzzleHistory = useCallback((puzzleData, solved) => {
    console.log('💾 Saving puzzle history:', { puzzleData, solved, selectedTheme });
    
    const historyEntry = savePuzzleResult({
      _id: puzzleData._id || Date.now().toString(),
      fen: puzzleData.fen,
      moves: puzzleData.moves,
      rating: puzzleData.rating,
      theme: puzzleData.theme || selectedTheme,
      description: puzzleData.description
    }, solved, PUZZLE_TYPES.ENDGAME);

    console.log('💾 History entry created:', historyEntry);

    setPuzzleHistory(prev => {
      const newHistory = [historyEntry, ...prev].slice(0, 50); // Keep only last 50 puzzles
      console.log('💾 Updated puzzle history:', newHistory.length, 'entries');
      return newHistory;
    });
  }, [selectedTheme]);

  // Update user rating when puzzle is solved
  const updateUserRating = useCallback(async (puzzleRating, success) => {
    try {
      console.log('🔄 Updating user rating:', { puzzleRating, success, isReplay });
      
      // Don't update stats for replays from history
      if (isReplay) {
        console.log('⚠️ Skipping rating update - this is a replay from history');
        return;
      }
      
      const token = localStorage.getItem('token');
      
      // If no token, show local rating change for demo purposes
      if (!token) {
        console.log('❌ No auth token found, showing local rating change');
        const currentRating = userEndgameRating || 1200;
        const ratingChange = success ? Math.floor(Math.random() * 20) + 5 : -Math.floor(Math.random() * 15) - 3;
        
        setRatingChange(ratingChange);
        setShowRatingChange(true);
        
        const changeText = ratingChange > 0 ? `+${ratingChange}` : `${ratingChange}`;
        setFeedback(prev => `${prev} Rating: ${changeText} (Demo Mode)`);
        
        // Hide rating change after 3 seconds
        setTimeout(() => {
          setShowRatingChange(false);
        }, 3000);
        return;
      }

      console.log('📡 Sending rating update to backend...');
      const response = await fetch(getApiUrl('endgames/stats'), {
        method: 'POST',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          puzzleRating: puzzleRating,
          solved: success
        })
      });

      console.log('📡 Response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        
        // Update daily progress if successful
        if (success) {
          updateDailyProgress(MODULE_NAMES.ENDGAME);
        }
        console.log('📡 Rating update response:', data);
        if (data.ratingChange !== undefined) {
          const changeText = data.ratingChange > 0 ? `+${data.ratingChange}` : `${data.ratingChange}`;
          setFeedback(prev => `${prev} Rating: ${changeText}`);
          // Show rating change
          setRatingChange(data.ratingChange);
          setShowRatingChange(true);
          // Hide rating change after 3 seconds
          setTimeout(() => {
            setShowRatingChange(false);
          }, 3000);
        }
        // Refresh user data to get updated rating from database
        if (refreshUser) {
          await refreshUser();
        }
      } else {
        console.error('❌ Rating update failed:', response.status, response.statusText);
        // Show local rating change as fallback
        const currentRating = userEndgameRating || 1200;
        const ratingChange = success ? Math.floor(Math.random() * 20) + 5 : -Math.floor(Math.random() * 15) - 3;
        
        setRatingChange(ratingChange);
        setShowRatingChange(true);
        
        const changeText = ratingChange > 0 ? `+${ratingChange}` : `${ratingChange}`;
        setFeedback(prev => `${prev} Rating: ${changeText} (Offline)`);
        
        setTimeout(() => {
          setShowRatingChange(false);
        }, 3000);
      }
    } catch (error) {
      console.error('❌ Error updating rating:', error);
      // Show local rating change as fallback
      const currentRating = userEndgameRating || 1200;
      const ratingChange = success ? Math.floor(Math.random() * 20) + 5 : -Math.floor(Math.random() * 15) - 3;
      
      setRatingChange(ratingChange);
      setShowRatingChange(true);
      
      const changeText = ratingChange > 0 ? `+${ratingChange}` : `${ratingChange}`;
      setFeedback(prev => `${prev} Rating: ${changeText} (Offline)`);
      
      setTimeout(() => {
        setShowRatingChange(false);
      }, 3000);
    }
  }, [userEndgameRating, refreshUser, isReplay]);

  // Validate puzzle difficulty matches selected level
  const validatePuzzleDifficulty = useCallback((puzzle, difficulty) => {
    if (!puzzle.rating) return true; // Allow puzzles without rating
    
    let minRating, maxRating;
    switch (difficulty) {
      case 'beginner':
        minRating = 800;
        maxRating = 1200;
        break;
      case 'intermediate':
        minRating = 1200;
        maxRating = 1800;
        break;
      case 'advanced':
        minRating = 1800;
        maxRating = 3000;
        break;
      default:
        return true;
    }
    
    return puzzle.rating >= minRating && puzzle.rating <= maxRating;
  }, []);

  const playMoveSound = useCallback((moveObj) => {
    if (!moveObj) {
      console.warn('🔇 playMoveSound: No move object provided');
      return;
    }
    if (!moveSoundRef.current) {
      console.warn('🔇 playMoveSound: moveSoundRef.current is null');
      return;
    }
    console.log('🔊 Attempting to play sound for move:', moveObj.san, 'flags:', moveObj.flags);
    try {
      if (moveObj.flags && moveObj.flags.includes('c')) {
        console.log('🔊 Playing capture sound');
        captureSoundRef.current?.play().catch(e => console.warn('Could not play capture sound:', e));
      } else if (moveObj.san === 'O-O' || moveObj.san === 'O-O-O') {
        console.log('🔊 Playing castle sound');
        castleSoundRef.current?.play().catch(e => console.warn('Could not play castle sound:', e));
      } else {
        console.log('🔊 Playing move sound');
        moveSoundRef.current?.play().catch(e => console.warn('Could not play move sound:', e));
      }
    } catch (error) {
      console.warn('Error playing move sound:', error);
    }
  }, []);

  // Initialize a puzzle with the given data
  // Returns true if successful, false otherwise
  const initializePuzzle = useCallback((puzzleData) => {
    // Normalize data structure - convert 'solution' to 'moves' if needed
    const normalizedPuzzle = {
      ...puzzleData,
      moves: puzzleData.moves || puzzleData.solution || []
    };
    
    // Validate the FEN string before proceeding
    if (!normalizedPuzzle.fen) {
      console.error('No FEN provided in puzzle data:', normalizedPuzzle);
      setFeedback('Invalid puzzle: No position provided');
      return false;
    }
    
    let newGame;
    try {
      console.log('🔍 Creating Chess object with FEN:', normalizedPuzzle.fen);
      
      newGame = new Chess(normalizedPuzzle.fen);
      console.log('✅ Chess object created successfully');
      
      // Validate that the position is legal
      if (newGame.in_checkmate() || newGame.in_stalemate()) {
        console.warn('Position is already checkmate/stalemate, skipping');
        setFeedback('Invalid puzzle: Position is already finished');
        return false;
      }
      
      // Check for impossible positions (kings adjacent)
      const board = newGame.board();
      const kings = [];
      for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
          if (board[i][j] && board[i][j].type === 'k') {
            kings.push({ row: i, col: j, color: board[i][j].color });
          }
        }
      }
      
      if (kings.length === 2) {
        const [king1, king2] = kings;
        const rowDiff = Math.abs(king1.row - king2.row);
        const colDiff = Math.abs(king1.col - king2.col);
        
        if (rowDiff <= 1 && colDiff <= 1) {
          console.error('❌ Impossible position: Kings are adjacent');
          setFeedback('Invalid puzzle: Impossible position detected - Kings are adjacent');
          return false;
        }
      }
      
      // Additional validation: Check if position has reasonable piece count for endgame
      const pieces = board.flat().filter(p => p);
      if (pieces.length > 20) {
        console.error('❌ Too many pieces for endgame position');
        setFeedback('Invalid puzzle: Too many pieces for endgame');
        return false;
      }
      
      // Check if position is already finished (double check)
      if (newGame.in_checkmate() || newGame.in_stalemate()) {
        console.error('❌ Position is already finished');
        setFeedback('Invalid puzzle: Position is already finished');
        return false;
      }
      
      setCurrentPuzzle(normalizedPuzzle);
      setGame(newGame);
      setFen(normalizedPuzzle.fen);
    } catch (error) {
      console.error('Invalid FEN string:', normalizedPuzzle.fen, error);
      setFeedback(`Invalid puzzle: Invalid position - ${error.message}`);
      return false;
    }
    setMoveIndex(0);
    setPuzzleComplete(false);
    setShowSolution(false);
    setFeedback('Your turn to move!');
    setSelectedSquare(null);
    setSolutionStep(0);
    setIsReplay(false); // Reset replay flag
    
    // Set correct board orientation based on whose turn it is
    setBoardOrientation(newGame.turn() === 'w' ? 'white' : 'black');
    
    // Execute the opponent's first move if there are moves in the puzzle
    if (normalizedPuzzle.moves && normalizedPuzzle.moves.length > 0) {
      // Play the first move (opponent's move) to set up the correct position
      const firstMove = normalizedPuzzle.moves[0];
      try {
        let firstMoveResult = null;
        if (firstMove.length === 4 && /^[a-h][1-8][a-h][1-8]$/.test(firstMove)) {
          // UCI format
          firstMoveResult = newGame.move({ 
            from: firstMove.substring(0, 2), 
            to: firstMove.substring(2, 4), 
            promotion: 'q' 
          });
        } else {
          // SAN format
          firstMoveResult = newGame.move(firstMove, { sloppy: true });
        }
        
        if (firstMoveResult) {
          console.log('✅ Executed opponent move:', firstMoveResult.san);
          playMoveSound(firstMoveResult);
          // Update the game state with the executed move
          setGame(newGame);
          setFen(newGame.fen());
          setMoveIndex(1); // Move index is now 1 since opponent's move is executed
        }
      } catch (error) {
        console.log('Could not execute opponent move:', error);
        // Don't fail the puzzle initialization if opponent move fails
      }
    }
    
    return true; // Success
  }, [playMoveSound]);

  // Load a new puzzle from the backend or use fallback positions
  const loadNewPuzzle = useCallback(async (force = false) => {
    console.log('🔄 Loading new puzzle...', { selectedTheme, selectedDifficulty, force });
    
    // If force is true (manual button click), reset loading ref
    if (force) {
      isLoadingRef.current = false;
    }
    
    // Prevent duplicate calls unless forced
    if (!force && isLoadingRef.current) {
      console.log('⚠️ Already loading, skipping...');
      return;
    }
    
    // Check usage limits for free users when loading a new puzzle
    if (user && user.userType !== 'premium' && !isReplay) {
      try {
        const response = await fetch(getApiUrl('usage-limits/endgame-trainer'), {
          headers: getAuthHeaders()
        });
          
          if (response.ok) {
            const limitData = await response.json();
            if (!limitData.allowed) {
              setFeedback(`You've reached your daily limit of 10 endgame puzzles. Come back tomorrow or upgrade to premium for unlimited access!`);
              setLoading(false);
              return;
            }
          }
        }
      } catch (error) {
        console.error('Error checking usage limits:', error);
      }
    }
    
    // IMPORTANT: If user is skipping an incomplete puzzle, deduct rating immediately
    // Treat skipping exactly like a failed attempt
    // BUT: Don't deduct if rating was already deducted (e.g., from Show Solution)
    // Check if puzzleComplete is false - if it's true, rating was already handled
    if (currentPuzzle && !puzzleComplete && !isReplay) {
      console.log('⚠️ Skipping incomplete puzzle - deducting rating as failed attempt');
      await updateUserRating(currentPuzzle.rating || 1200, false);
      
      // Save puzzle history as failed
      savePuzzleHistory(currentPuzzle, false);
    } else if (currentPuzzle && puzzleComplete && !isReplay) {
      console.log('ℹ️ Skipping puzzle but rating already handled (puzzleComplete:', puzzleComplete, ')');
    }
    
    // Use a ref to track if we're already loading to prevent duplicate calls
    const loadingRef = { current: true };
    
    setLoading(true);
    setFeedback('');
    setShowSolution(false);
    setPuzzleComplete(false);
    setMoveIndex(0);
    setDrawnArrows([]);
    setSelectedSquare(null);
    setCurrentPuzzle(null); // Clear previous puzzle
    setGame(null);
    // Don't clear FEN immediately - keep previous puzzle visible until new one loads
    
    try {
      // Get auth token
      const token = localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json',
        ...(token && { 'x-auth-token': token })
      };
      
      // Try to fetch from backend first - use the random endpoint with strict difficulty filtering
      const url = `${getApiUrl('endgames/random')}?category=${encodeURIComponent(selectedTheme)}&difficulty=${encodeURIComponent(selectedDifficulty)}`;
      console.log(`🌐 Fetching from: ${url}`);
      const response = await fetch(url, { headers });
      
      console.log('📡 Response status:', response.status);
      
      if (response.ok) {
        const puzzle = await response.json();
        console.log('📦 Received puzzle:', puzzle);
        
        if (puzzle && puzzle.fen) {
          // Normalize puzzle data to ensure all required fields
          const normalizedPuzzle = {
            id: puzzle.id || puzzle._id,
            _id: puzzle._id || puzzle.id,
            fen: puzzle.fen,
            moves: puzzle.moves || [],
            rating: puzzle.rating,
            theme: puzzle.theme || puzzle.category || selectedTheme,
            description: puzzle.description,
            category: puzzle.category || selectedTheme,
            themes: puzzle.themes
          };
          
          // Validate that the puzzle matches the selected difficulty (but accept anyway if backend filtered it)
          const ratingMatches = validatePuzzleDifficulty(normalizedPuzzle, selectedDifficulty);
          if (!ratingMatches) {
            console.warn(`⚠️ Puzzle rating ${normalizedPuzzle.rating} doesn't match difficulty ${selectedDifficulty}, but using it anyway (backend filtered it)`);
          }
          
          console.log(`✅ Loaded puzzle with rating ${normalizedPuzzle.rating} for difficulty ${selectedDifficulty}`);
          const initSuccess = initializePuzzle(normalizedPuzzle);
          if (initSuccess) {
            isLoadingRef.current = false;
            setLoading(false);
            return;
          } else {
            console.error('Failed to initialize puzzle, trying fallback...');
            setFeedback('Error initializing puzzle. Trying fallback...');
            isLoadingRef.current = false;
            setLoading(false);
            // Continue to fallback
          }
        } else {
          console.error('❌ Invalid puzzle data received:', puzzle);
          setFeedback('Invalid puzzle data received. Trying fallback...');
          isLoadingRef.current = false;
          setLoading(false);
          // Continue to fallback
        }
      } else {
        // Handle specific error responses
        let errorData = {};
        try {
          errorData = await response.json();
        } catch (e) {
          // If JSON parsing fails, use empty object
        }
        console.error('❌ Backend error:', response.status, errorData);
        
        if (response.status === 404 && errorData.error && errorData.error.includes('No puzzles found for difficulty level')) {
          setFeedback(`No puzzles available for ${selectedDifficulty} difficulty (rating ${errorData.minRating}-${errorData.maxRating}). Try a different difficulty level.`);
          isLoadingRef.current = false;
          setLoading(false);
          return;
        } else if (response.status === 400 && errorData.error && errorData.error.includes('Invalid difficulty level')) {
          setFeedback('Invalid difficulty level selected. Please refresh the page.');
          isLoadingRef.current = false;
          setLoading(false);
          return;
        } else if (response.status === 401 || response.status === 403) {
          setFeedback('Authentication required. Please log in again.');
          isLoadingRef.current = false;
          setLoading(false);
          return;
        }
        // For other errors, continue to fallback
        console.log('Backend error, falling back to local puzzles');
        isLoadingRef.current = false;
        setLoading(false);
      }
    } catch (error) {
      console.error('❌ Error loading puzzle:', error);
      console.log('🔄 Backend not available, using fallback positions');
      isLoadingRef.current = false;
      setLoading(false);
    }
    
    // Fallback to hardcoded positions if backend is not available
    // Filter fallback positions by difficulty as well
    let allPositions = endgamePositions[selectedTheme];
    
    // If theme doesn't exist in fallback, try to find a similar one or use default
    if (!allPositions || allPositions.length === 0) {
      console.log(`Theme '${selectedTheme}' not found in fallback, trying alternatives...`);
      // Try common alternatives
      const themeMap = {
        'pawn-endgames': 'pawn',
        'rook-endgames': 'rook',
        'queen-endgames': 'queen',
        'bishop-endgames': 'bishop',
        'knight-endgames': 'knight',
        'mate-in-1': 'mate4',
        'mate-in-2': 'mate4',
        'mate-in-4': 'mate4',
        'rook-pawn': 'rook',
        'knight-bishop': 'knight'
      };
      
      const mappedTheme = themeMap[selectedTheme] || selectedTheme;
      allPositions = endgamePositions[mappedTheme];
      
      // If still no positions, use 'pawn' as default
      if (!allPositions || allPositions.length === 0) {
        console.log('Using default theme: pawn');
        allPositions = endgamePositions['pawn'] || [];
      }
    }
    
    // Apply strict difficulty filtering to fallback positions
    let positions = allPositions;
    if (selectedDifficulty) {
      let minRating, maxRating;
      switch (selectedDifficulty) {
        case 'beginner':
          minRating = 800;
          maxRating = 1200;
          break;
        case 'intermediate':
          minRating = 1200;
          maxRating = 1800;
          break;
        case 'advanced':
          minRating = 1800;
          maxRating = 3000;
          break;
        default:
          minRating = 800;
          maxRating = 3000;
      }
      
      positions = allPositions.filter(pos => 
        pos.rating && pos.rating >= minRating && pos.rating <= maxRating
      );
      
      console.log(`Fallback: Filtered ${positions.length} positions for difficulty ${selectedDifficulty} (rating ${minRating}-${maxRating}) from ${allPositions.length} total`);
      
      // If no positions match difficulty, use all positions
      if (positions.length === 0) {
        console.log('No positions match difficulty, using all positions');
        positions = allPositions;
      }
    }
    
    if (positions.length === 0) {
      console.error('No fallback positions available for theme and difficulty:', selectedTheme, selectedDifficulty);
      setFeedback(`No puzzles available for ${selectedTheme} theme with ${selectedDifficulty} difficulty. Try a different combination.`);
      // Don't clear FEN - keep previous puzzle visible
      setLoading(false);
      return;
    }
    
    // Get a random position from available positions
    const randomPosition = positions[Math.floor(Math.random() * positions.length)];
    console.log(`✅ Using fallback puzzle with rating ${randomPosition.rating} for difficulty ${selectedDifficulty}`);
    
    // Normalize puzzle data to ensure all required fields
    const normalizedPuzzle = {
      id: randomPosition.id || randomPosition._id || `fallback-${Date.now()}`,
      _id: randomPosition._id || randomPosition.id || `fallback-${Date.now()}`,
      fen: randomPosition.fen,
      moves: randomPosition.moves || randomPosition.solution || [],
      rating: randomPosition.rating,
      theme: randomPosition.theme || selectedTheme,
      description: randomPosition.description,
      category: randomPosition.category || selectedTheme
    };
    
    const initSuccess = initializePuzzle(normalizedPuzzle);
    if (!initSuccess) {
      console.error('Failed to initialize fallback puzzle');
      setFeedback('Error loading puzzle. Please try again.');
    }
    setLoading(false);
  }, [selectedTheme, selectedDifficulty, validatePuzzleDifficulty, initializePuzzle, endgamePositions, currentPuzzle, puzzleComplete, isReplay, updateUserRating, savePuzzleHistory]);

  // Load puzzle history from localStorage on component mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('endgamePuzzleHistory');
    if (savedHistory) {
      try {
        setPuzzleHistory(JSON.parse(savedHistory));
    } catch (error) {
        console.error('Error loading puzzle history:', error);
        setPuzzleHistory([]);
      }
    }
  }, []);

  // Load sounds once on component mount
  useEffect(() => {
    console.log('🔊 SOUND LOADING: Starting to load sounds...');
    // Create audio elements with error handling
    try {
      moveSoundRef.current = new Audio('/sounds/move-self.mp3');
      moveSoundRef.current.load();
      moveSoundRef.current.addEventListener('canplaythrough', () => {
        console.log('🔊 Move sound loaded and ready');
      });
      moveSoundRef.current.addEventListener('error', (e) => {
        console.error('❌ Move sound failed to load:', e);
      });
      console.log('🔊 Move sound created');
    } catch (error) {
      console.warn('Could not load move sound:', error);
      moveSoundRef.current = null;
    }
    
    try {
      captureSoundRef.current = new Audio('/sounds/capture.mp3');
      captureSoundRef.current.load();
      captureSoundRef.current.addEventListener('canplaythrough', () => {
        console.log('🔊 Capture sound loaded and ready');
      });
      captureSoundRef.current.addEventListener('error', (e) => {
        console.error('❌ Capture sound failed to load:', e);
      });
      console.log('🔊 Capture sound created');
    } catch (error) {
      console.warn('Could not load capture sound:', error);
      captureSoundRef.current = null;
    }
    
    try {
      castleSoundRef.current = new Audio('/sounds/castle.mp3');
      castleSoundRef.current.load();
      castleSoundRef.current.addEventListener('canplaythrough', () => {
        console.log('🔊 Castle sound loaded and ready');
      });
      castleSoundRef.current.addEventListener('error', (e) => {
        console.error('❌ Castle sound failed to load:', e);
      });
      console.log('🔊 Castle sound created');
    } catch (error) {
      console.warn('Could not load castle sound:', error);
      castleSoundRef.current = null;
    }
    console.log('🔊 SOUND LOADING: All sounds initialized');
  }, []);

  // Track if we're currently loading to prevent duplicate calls
  const isLoadingRef = useRef(false);
  
  // Load new puzzle when theme or difficulty changes
  useEffect(() => {
    // Only load if theme is selected and themes are loaded
    if (!selectedTheme || themesLoading) {
      return;
    }
    
    // Prevent duplicate calls
    if (isLoadingRef.current) {
      return;
    }
    
    isLoadingRef.current = true;
    loadNewPuzzle().finally(() => {
      isLoadingRef.current = false;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTheme, selectedDifficulty, themesLoading]);

  // Make move function (same as PuzzleSolvePage)
  const makeMove = useCallback((from, to) => {
    console.log('🚀 MAKE MOVE CALLED with:', from, 'to', to);
    console.log('🚀 Current state:', { game: !!game, puzzle: !!currentPuzzle, puzzleComplete });
    
    if (!game || !currentPuzzle) {
      console.log('Cannot make move - game or puzzle not ready');
      return false;
    }

    if (puzzleComplete || showSolution) {
      console.log('Cannot make move - puzzle complete or showing solution');
      return false;
    }

    console.log('=== MOVE VALIDATION START ===');
    console.log('Attempting move from', from, 'to', to);
    console.log('Current move index:', moveIndex);
    console.log('Game turn:', game.turn());
    console.log('Game FEN:', game.fen());
    console.log('Puzzle moves:', currentPuzzle.moves);

    // Strict check: ensure the piece being moved is of the correct color
    const piece = game.get(from);
    if (!piece) {
      console.log('❌ No piece on square:', from);
      setFeedback('No piece on this square.');
      return false;
    }

    if (piece.color !== game.turn()) {
      console.log('❌ Wrong color piece. Piece color:', piece.color, 'Game turn:', game.turn());
      setFeedback('Wrong color to move!');
      return false;
    }

    try {
      // First, check if the move is legal in the current position
      const tempGame = new Chess(game.fen());
      const move = tempGame.move({ from, to, promotion: 'q' });
      
      if (!move) {
        console.log('❌ Illegal move - not allowed');
        setFeedback('Illegal move! Please try a legal move.');
        return false;
      }

      console.log('✅ Move is legal:', move.san);
      playMoveSound(move);

      // Get the expected move for this position
      const expectedMove = currentPuzzle.moves[moveIndex];
      console.log('Current move index:', moveIndex);
      console.log('Expected move:', expectedMove);
      console.log('Actual move SAN:', move.san);
      console.log('Actual move UCI:', move.from + move.to);
      
      if (!expectedMove) {
        console.error('❌ No expected move found for index:', moveIndex);
        return false;
      }

      // Compare the actual move with the expected move
      // Normalize both moves to the same format for comparison
      const actualMoveSan = move.san;
      const actualMoveUCI = move.from + move.to;
      // Also check if actual move has promotion
      const actualMoveUCIWithPromotion = move.promotion ? move.from + move.to + move.promotion : move.from + move.to;
      
      // Create a temporary game to normalize the expected move
      const tempGameForExpected = new Chess(game.fen());
      let expectedMoveSan = '';
      let expectedMoveUCI = '';
      let normalizationSucceeded = false;
      
      // Try to play the expected move to get its normalized format
      try {
        let expectedResult = null;
        // Check if it's UCI format (4 chars) or UCI with promotion (5-6 chars like "e7e8q")
        const isUCIFormat = /^[a-h][1-8][a-h][1-8][qnrb]?$/i.test(expectedMove);
        
        if (isUCIFormat && expectedMove.length >= 4) {
          // Expected move is UCI format (with or without promotion)
          const from = expectedMove.substring(0, 2);
          const to = expectedMove.substring(2, 4);
          const promotion = expectedMove.length > 4 ? expectedMove.substring(4).toLowerCase() : 'q';
          expectedResult = tempGameForExpected.move({
            from: from,
            to: to,
            promotion: promotion
          });
        } else {
          // Expected move is SAN format
          expectedResult = tempGameForExpected.move(expectedMove, { sloppy: true });
        }
        
        if (expectedResult) {
          expectedMoveSan = expectedResult.san;
          expectedMoveUCI = expectedResult.from + expectedResult.to;
          // Store promotion for comparison
          if (expectedResult.promotion) {
            expectedMoveUCI += expectedResult.promotion;
          }
          normalizationSucceeded = true;
        }
      } catch (error) {
        console.error('Error normalizing expected move:', error);
        normalizationSucceeded = false;
      }
      
      // Compare both SAN and UCI formats
      let sanMatch = false;
      let uciMatch = false;
      
      if (normalizationSucceeded) {
        // Use normalized comparison if normalization succeeded
        sanMatch = actualMoveSan === expectedMoveSan;
        // Compare UCI with promotion handling
        uciMatch = actualMoveUCI === expectedMoveUCI || actualMoveUCIWithPromotion === expectedMoveUCI;
      } else {
        // Fallback: compare original expected move directly with actual move formats
        // This handles cases where normalization fails but moves are still equivalent
        sanMatch = actualMoveSan === expectedMove;
        uciMatch = actualMoveUCI === expectedMove || actualMoveUCIWithPromotion === expectedMove;
        
        // Also try UCI format if expected move looks like UCI
        if (!uciMatch && /^[a-h][1-8][a-h][1-8]/i.test(expectedMove)) {
          const expectedUCI = expectedMove.substring(0, 4);
          uciMatch = actualMoveUCI === expectedUCI;
        }
      }
      
      const isCorrectMove = sanMatch || uciMatch;
      
      console.log('=== MOVE COMPARISON DEBUG ===');
      console.log('Expected move (original):', expectedMove);
      console.log('Expected move (normalized SAN):', expectedMoveSan);
      console.log('Expected move (normalized UCI):', expectedMoveUCI);
      console.log('Actual move (SAN):', actualMoveSan);
      console.log('Actual move (UCI):', actualMoveUCI);
      console.log('SAN match:', sanMatch);
      console.log('UCI match:', uciMatch);
      console.log('Final result:', isCorrectMove);
      
      if (isCorrectMove) {
        console.log('✅ Move is correct! Playing move and opponent reply...');
        
        // Move is correct, play it and the opponent's reply
        const newGame = new Chess(game.fen());
        const userMove = newGame.move({ from, to, promotion: 'q' });
        
        let newMoveIndex = moveIndex + 1;
        
        console.log('User move played:', userMove.san);
        console.log('New move index:', newMoveIndex);
        console.log('Total moves in puzzle:', currentPuzzle.moves.length);
        
        // Auto-play opponent's reply if available
        if (newMoveIndex < currentPuzzle.moves.length) {
          const opponentMove = currentPuzzle.moves[newMoveIndex];
          console.log('Playing opponent move:', opponentMove);
          
          try {
            let opponentMoveResult;
            if (opponentMove.length === 4 && /^[a-h][1-8][a-h][1-8]$/.test(opponentMove)) {
              // UCI format
              const from = opponentMove.substring(0, 2);
              const to = opponentMove.substring(2, 4);
              opponentMoveResult = newGame.move({ from, to, promotion: 'q' });
            } else {
              // SAN format
              opponentMoveResult = newGame.move(opponentMove, { sloppy: true });
            }
            
            if (opponentMoveResult) {
              console.log('✅ Opponent move successful:', opponentMoveResult.san);
              playMoveSound(opponentMoveResult);
              newMoveIndex++;
            } else {
              console.error('❌ Failed to play opponent move');
            }
          } catch (opponentError) {
            console.error('❌ Error playing opponent move:', opponentError);
          }
        }
        
        setGame(newGame);
        setFen(newGame.fen());
        setMoveIndex(newMoveIndex);
        setSelectedSquare(null);
        
        // Force a re-render to ensure the board updates
        setTimeout(() => {
          setGame(new Chess(newGame.fen()));
        }, 100);
        
        // Check if puzzle is complete
        if (newMoveIndex >= currentPuzzle.moves.length) {
          console.log('🎉 Puzzle complete!');
          setPuzzleComplete(true);
          setFeedback('Puzzle solved! Great job! 🎉');
          updateUserRating(currentPuzzle.rating || 1200, true);
          
          // Save puzzle history
          savePuzzleHistory(currentPuzzle, true);
          
          // Increment usage limit for free users when puzzle is completed
          if (user && user.userType !== 'premium' && !isReplay) {
            // Fire-and-forget: increment usage limit asynchronously
            fetch(getApiUrl('usage-limits/endgame-trainer/increment'), {
              method: 'POST',
              headers: getAuthHeaders({ 'Content-Type': 'application/json' })
            }).catch(error => {
                console.error('Error incrementing usage limit:', error);
              });
            }
          }
          
          // Don't auto-load next puzzle - let user choose when to continue
        } else {
          setFeedback('Correct! Continue...');
        }
        
        console.log('=== MOVE VALIDATION END (SUCCESS) ===');
        return true;
      } else {
        console.log('❌ Incorrect move. Expected:', expectedMove, 'Got:', actualMoveSan);
        
        // Only record the first failure, not if already failed (prevents duplicate marks)
        if (!puzzleComplete) {
          setPuzzleComplete(true);
          updateUserRating(currentPuzzle.rating || 1200, false);
          
          // Save puzzle history (only once)
          savePuzzleHistory(currentPuzzle, false);
        }
        
        setFeedback('Wrong move! Puzzle failed. Show solution to see the correct moves.');
        
        console.log('=== MOVE VALIDATION END (FAILED) ===');
        return false;
      }
    } catch (error) {
      console.error('❌ Error making move:', error);
      setFeedback('Error making move. Please try again.');
      console.log('=== MOVE VALIDATION END (ERROR) ===');
      return false;
    }
  }, [game, currentPuzzle, moveIndex, puzzleComplete, showSolution, updateUserRating, savePuzzleHistory, playMoveSound]);

  // Handle piece moves on the board (for ProductionChessBoard)
  const handleMove = useCallback((from, to) => {
    const success = makeMove(from, to);
    return success;
  }, [makeMove]);



  const loadPuzzle = useCallback(async (endgameType) => {
    setLoading(true);
    setFeedback('');
    setShowSolution(false);
    setPuzzleComplete(false);
    setMoveIndex(0);
    setOrientationLocked(false); // Reset orientation lock when new puzzle loads
    setCurrentPuzzle(null); // Clear previous puzzle
    setGame(null);
    // Don't clear FEN immediately - keep previous puzzle visible until new one loads
    
    try {
      console.log(`Loading endgame category: ${endgameType} with difficulty: ${selectedDifficulty}`);
      
      // Fetch from backend API with difficulty parameter - use category endpoint (doesn't require auth)
      const url = `${getApiUrl(`endgames/category/${encodeURIComponent(endgameType)}`)}?difficulty=${encodeURIComponent(selectedDifficulty)}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        // Try to parse error message from response
        let errorMessage = `Failed to fetch puzzle (HTTP ${response.status})`;
        try {
          const errorData = await response.json();
          if (errorData.error) {
            errorMessage = errorData.error;
          }
          if (errorData.availableCategories && errorData.availableCategories.length > 0) {
            errorMessage += `. Available categories: ${errorData.availableCategories.slice(0, 5).join(', ')}`;
          }
        } catch (e) {
          // If JSON parsing fails, use default message
        }
        throw new Error(errorMessage);
      }
      
      const puzzleData = await response.json();
      console.log('Received puzzle data:', puzzleData);
      
      if (!puzzleData || !puzzleData.fen) {
        throw new Error('Invalid puzzle data received from server');
      }
      
      initializePuzzle(puzzleData);
      setLoading(false);
      return; // Success, exit early
      
    } catch (error) {
      console.error('Error loading puzzle:', error);
      console.log('Falling back to hardcoded positions...');
      
      // Fallback to hardcoded positions when API fails
      let fallbackPositions = endgamePositions[endgameType];
      
      // If theme doesn't exist in fallback, try to find a similar one or use default
      if (!fallbackPositions || fallbackPositions.length === 0) {
        console.log(`Theme '${endgameType}' not found in fallback, trying alternatives...`);
        // Try common alternatives
        const themeMap = {
          'pawn-endgames': 'pawn',
          'rook-endgames': 'rook',
          'queen-endgames': 'queen',
          'bishop-endgames': 'bishop',
          'knight-endgames': 'knight',
          'mate-in-1': 'mate4',
          'mate-in-2': 'mate4',
          'mate-in-4': 'mate4',
          'rook-pawn': 'rook',
          'knight-bishop': 'knight'
        };
        
        const mappedTheme = themeMap[endgameType] || endgameType;
        fallbackPositions = endgamePositions[mappedTheme];
        
        // If still no positions, use 'pawn' as default
        if (!fallbackPositions || fallbackPositions.length === 0) {
          console.log('Using default theme: pawn');
          fallbackPositions = endgamePositions['pawn'] || [];
        }
      }
      
      if (fallbackPositions && fallbackPositions.length > 0) {
        // Filter by difficulty
        let filteredPositions = fallbackPositions;
        if (selectedDifficulty === 'beginner') {
          filteredPositions = fallbackPositions.filter(pos => pos.rating >= 800 && pos.rating < 1200);
        } else if (selectedDifficulty === 'intermediate') {
          filteredPositions = fallbackPositions.filter(pos => pos.rating >= 1200 && pos.rating < 1800);
        } else if (selectedDifficulty === 'advanced') {
          filteredPositions = fallbackPositions.filter(pos => pos.rating >= 1800);
        }
        
        // If no positions match difficulty, use all positions
        if (filteredPositions.length === 0) {
          console.log('No positions match difficulty, using all positions');
          filteredPositions = fallbackPositions;
        }
        
        // Try to find a valid puzzle
        let puzzleLoaded = false;
        for (let attempt = 0; attempt < Math.min(5, filteredPositions.length); attempt++) {
          const randomIndex = Math.floor(Math.random() * filteredPositions.length);
          const fallbackPuzzle = filteredPositions[randomIndex];
          
          console.log('Trying fallback puzzle:', fallbackPuzzle);
          
          // Validate the fallback puzzle before using it
          try {
            const testGame = new Chess(fallbackPuzzle.fen);
            if (!testGame.in_checkmate() && !testGame.in_stalemate()) {
              initializePuzzle(fallbackPuzzle);
              setFeedback('Using offline puzzle (API unavailable)');
              puzzleLoaded = true;
              break;
            }
          } catch (fallbackError) {
            console.warn('Fallback puzzle is invalid, trying another...', fallbackError);
            continue;
          }
        }
        
        if (!puzzleLoaded) {
          console.error('All fallback puzzles are invalid');
          setFeedback('Error: Unable to load puzzle. Please try again or select a different theme.');
          setFen(''); // Only clear FEN if we truly can't load anything
        }
      } else {
        console.error('No fallback positions available');
        setFeedback(`Error loading puzzle: ${error.message}. No fallback puzzles available.`);
        setFen(''); // Only clear FEN if we truly can't load anything
      }
    } finally {
      setLoading(false);
    }
  }, [selectedDifficulty, initializePuzzle, endgamePositions]);

  // Load themes from API
  useEffect(() => {
    const fetchThemes = async () => {
      try {
        const response = await fetch(getApiUrl('endgames/themes'));
        if (response.ok) {
          const data = await response.json();
          setEndgameThemes(data.themes || []);
          if (data.themes && data.themes.length > 0) {
            setSelectedTheme(data.themes[0].value);
          }
        } else {
          console.error('Failed to fetch themes');
          // Fallback themes
          setEndgameThemes([
            { value: 'pawn', label: 'Pawn Endgames' },
            { value: 'rook-pawn', label: 'Rook Pawn' },
            { value: 'queen', label: 'Queen Endgames' },
            { value: 'mate-in-2', label: 'Checkmate in 2' },
            { value: 'mate-in-4', label: 'Checkmate in 4' },
            { value: 'knight-bishop', label: 'Knight Bishop' },
            { value: 'bishop', label: 'Bishop Endgames' },
            { value: 'knight', label: 'Knight Endgames' },
            { value: 'basic', label: 'Basic Endgames' },
          ]);
        }
      } catch (error) {
        console.error('Error fetching themes:', error);
        // Fallback themes
        setEndgameThemes([
          { value: 'pawn', label: 'Pawn Endgames' },
          { value: 'rook-pawn', label: 'Rook Pawn' },
          { value: 'queen', label: 'Queen Endgames' },
          { value: 'mate-in-2', label: 'Checkmate in 2' },
          { value: 'mate-in-4', label: 'Checkmate in 4' },
          { value: 'knight-bishop', label: 'Knight Bishop' },
          { value: 'bishop', label: 'Bishop Endgames' },
          { value: 'knight', label: 'Knight Endgames' },
          { value: 'basic', label: 'Basic Endgames' },
        ]);
      } finally {
        setThemesLoading(false);
      }
    };

    fetchThemes();
  }, []);

  // Note: Initial puzzle loading is handled by the useEffect that calls loadNewPuzzle()
  // This prevents duplicate loading when theme changes






  // Function to open live analysis with initial puzzle position
  const handleOpenLiveAnalysis = () => {
    if (!currentPuzzle) {
      console.error('No puzzle available for live analysis');
      return;
    }

    // Use the original puzzle position (initial position)
    const initialPosition = currentPuzzle.fen;
    const analysisGame = new Chess(initialPosition);
    const sideToMove = analysisGame.turn();
    const colorParam = sideToMove === 'w' ? 'white' : 'black';
    
    console.log('🎯 Opening analysis with initial puzzle position:', initialPosition);
    console.log('🎯 Side to move:', sideToMove);
    
    // Open chess analysis board with the initial puzzle position
    const encodedFen = encodeURIComponent(initialPosition);
    
    window.open(`/chess-analysis-board?fen=${encodedFen}&color=${colorParam}`, '_blank');
  };

  const handleShowSolution = async () => {
    if (!currentPuzzle) return;
    
    // IMPORTANT: If user clicks Show Solution on an incomplete puzzle, deduct rating immediately
    // Treat showing solution exactly like a failed attempt
    if (currentPuzzle && !puzzleComplete && !isReplay) {
      console.log('⚠️ Showing solution for incomplete puzzle - deducting rating as failed attempt');
      await updateUserRating(currentPuzzle.rating || 1200, false);
      
      // Save puzzle history as failed
      savePuzzleHistory(currentPuzzle, false);
      
      // Mark as complete so Next Puzzle won't deduct again
      setPuzzleComplete(true);
    } else if (!puzzleComplete) {
      // If already complete, just mark as complete for UI state
      setPuzzleComplete(true);
    }
    
    setShowSolution(true);
    setFeedback('Showing solution...');
    
    // Lock the current orientation and keep it fixed during solution replay
    setOrientationLocked(true); // Lock orientation during solution replay
    console.log('🎯 Locked current orientation:', boardOrientation, 'and locked it');
    
    
    // Play through the complete solution step by step on the main board
    const playSolution = async () => {
      console.log('🎯 Starting solution replay...');
      console.log('🎯 Original puzzle FEN:', currentPuzzle.fen);
      console.log('🎯 Puzzle moves:', currentPuzzle.moves);
      
      if (!currentPuzzle.moves || currentPuzzle.moves.length === 0) {
        console.log('🎯 No moves found in puzzle!');
        setFeedback('No solution moves found!');
        return;
      }
      
      console.log('🎯 Playing', currentPuzzle.moves.length, 'moves...');
      
      // Reset to original position
      const solutionGame = new Chess(currentPuzzle.fen);
      setGame(solutionGame);
      setFen(solutionGame.fen());
      setMoveIndex(0);
      
      // Don't change orientation during solution replay - keep it locked
      console.log('🎯 Keeping locked orientation:', boardOrientation);
      
      // Wait a moment for the board to update
      await new Promise(resolve => setTimeout(resolve, 500));
      
      for (let i = 0; i < currentPuzzle.moves.length; i++) {
        const move = currentPuzzle.moves[i];
        console.log(`🎯 Playing move ${i + 1}: ${move}`);
        
        try {
          let moveResult;
          if (move.length === 4 && /^[a-h][1-8][a-h][1-8]$/.test(move)) {
            // UCI format
            const from = move.substring(0, 2);
            const to = move.substring(2, 4);
            moveResult = solutionGame.move({ from, to, promotion: 'q' });
          } else {
            // SAN format
            moveResult = solutionGame.move(move, { sloppy: true });
          }
          
          if (moveResult) {
            console.log(`✅ Move ${i + 1} played successfully:`, moveResult.san);
            
            // Update the game state with the new position
            setGame(new Chess(solutionGame.fen()));
            setFen(solutionGame.fen());
            setMoveIndex(i + 1);
            
            // Move played successfully
            
            // Force a re-render by updating the game state
            setTimeout(() => {
              setGame(new Chess(solutionGame.fen()));
            }, 50);
            
            // Wait between moves for visual effect
            await new Promise(resolve => setTimeout(resolve, 1000));
          } else {
            console.log(`❌ Failed to play move ${i + 1}: ${move}`);
            break;
          }
        } catch (error) {
          console.log(`❌ Error playing move ${i + 1}: ${move}`, error);
          break;
        }
      }
      
      console.log('🎯 Solution replay complete!');
      setFeedback(`Solution complete! All moves: ${currentPuzzle.moves.join(', ')}`);
      
      // Unlock orientation after solution replay (keep current orientation)
      setOrientationLocked(false); // Unlock orientation after solution replay
    };
    
    playSolution();
  };


    return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header with improved styling */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent">
            Endgame Trainer
          </h1>
          <p className="text-xl text-gray-300 mb-6">Master essential endgame patterns and improve your chess skills</p>
          
          {/* Rating Display */}
          {userEndgameRating && (
            <div className="inline-flex items-center bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 rounded-xl px-6 py-3 backdrop-blur-sm">
              <Trophy className="w-5 h-5 text-yellow-400 mr-3" />
              <span className="font-bold text-blue-300 text-lg">Rating: {userEndgameRating}</span>
              {!user && (
                <span className="ml-3 text-sm text-yellow-400 bg-yellow-500/20 px-3 py-1 rounded-full">Demo Mode</span>
              )}
            </div>
          )}
        </div>

        {/* Controls - Improved layout */}
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 mb-6 lg:mb-8">
          {/* Theme and Difficulty Controls */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 flex-1">
            {/* Theme Dropdown */}
            <div className="flex-1">
              <label className="block text-gray-300 font-semibold mb-2">Theme</label>
              {themesLoading ? (
                <div className="bg-slate-800/50 border border-blue-500/30 rounded-xl px-3 py-2 text-gray-400 text-sm">
                  Loading themes...
                </div>
              ) : (
                <select
                  value={selectedTheme}
                  onChange={(e) => setSelectedTheme(e.target.value)}
                  className="w-full bg-slate-800/50 border border-blue-500/30 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all duration-200"
                >
                  {endgameThemes.map(theme => (
                    <option key={theme.value} value={theme.value}>
                      {theme.label}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Difficulty Selection */}
            <div className="flex-1">
              <label className="block text-gray-300 font-semibold mb-2">Difficulty</label>
              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="w-full bg-slate-800/50 border border-blue-500/30 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all duration-200"
              >
                <option value="beginner">Beginner (800-1200)</option>
                <option value="intermediate">Intermediate (1200-1800)</option>
                <option value="advanced">Advanced (1800+)</option>
              </select>
              {/* Difficulty Range Indicator */}
              <div className="mt-2 text-xs text-gray-400 text-center">
                {selectedDifficulty === 'beginner' && 'Rating: 800-1200'}
                {selectedDifficulty === 'intermediate' && 'Rating: 1200-1800'}
                {selectedDifficulty === 'advanced' && 'Rating: 1800+'}
              </div>
            </div>
          </div>
        </div>

        {/* Board Size Slider - Improved styling */}
        <div className="mb-8 flex items-center justify-center">
          <div className="bg-slate-800/30 backdrop-blur-sm border border-blue-500/20 rounded-xl px-6 py-4">
            <label htmlFor="board-size" className="block text-sm font-semibold text-gray-300 mb-2 text-center">Board Size</label>
            <div className="flex items-center gap-4">
              <span className="text-xs text-gray-400">Small</span>
              <input
                id="board-size"
                type="range"
                min={240}
                max={900}
                value={boardSize}
                onChange={e => setBoardSize(Number(e.target.value))}
                className="w-40 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer slider"
                style={{
                  background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((boardSize - 240) / 660) * 100}%, #374151 ${((boardSize - 240) / 660) * 100}%, #374151 100%)`
                }}
              />
              <span className="text-xs text-gray-400">Large</span>
              <span className="text-sm font-bold text-blue-300 min-w-[3rem] text-center">{boardSize}px</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          {/* Chessboard - Improved layout */}
          <div className="xl:col-span-3">
            <div ref={boardContainerRef} className="bg-gradient-to-br from-gray-50 to-white rounded-2xl shadow-2xl border border-gray-200 p-6 sm:p-8">
              <div className="flex flex-col items-center">
                {/* Enhanced turn indicator */}
                <div className={`mb-6 px-6 py-3 rounded-xl font-bold text-base sm:text-lg shadow-lg transform transition-all duration-300 ${
                  game?.turn() === 'w' 
                    ? 'bg-gradient-to-r from-blue-500/20 to-blue-600/20 text-blue-800 border border-blue-500/40' 
                    : 'bg-gradient-to-r from-gray-500/20 to-gray-600/20 text-gray-800 border border-gray-500/40'
                }`}>
                  <div className="flex items-center justify-center space-x-3">
                    <div className={`w-5 h-5 rounded-full ${
                      game?.turn() === 'w' ? 'bg-blue-600' : 'bg-gray-600'
                    }`}></div>
                    <span className="text-xl">{game?.turn() === 'w' ? 'White to move' : 'Black to move'}</span>
                  </div>
                </div>
                <div className="relative w-full flex justify-center px-2 sm:px-4" style={{ pointerEvents: 'auto', overflow: 'visible' }}>
                  {loading ? (
                    <div className="flex justify-center items-center h-64 sm:h-96">
                      <div className="text-gray-400">Loading puzzle...</div>
                    </div>
                  ) : fen ? (
                    <div className="w-full bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl sm:rounded-2xl p-2 sm:p-4 shadow-inner border border-amber-200" style={{ pointerEvents: 'auto', overflow: 'visible' }}>
                      <div className="bg-gradient-to-br from-amber-100 to-orange-100 rounded-lg sm:rounded-xl p-1 sm:p-2 shadow-lg" style={{ pointerEvents: 'auto', overflow: 'visible' }}>
                        <div ref={boardAreaRef} className="flex justify-center" style={{ pointerEvents: 'auto' }}>
                          <div
                            style={{
                              width: `${effectiveBoardWidth}px`,
                              height: `${effectiveBoardWidth}px`,
                              maxWidth: '100%',
                              maxHeight: '100%',
                              minWidth: 0,
                              minHeight: 0,
                              display: 'flex',
                              justifyContent: 'center',
                              alignItems: 'center',
                              pointerEvents: 'auto',
                              overflow: 'visible'
                            }}
                          >
                            {(() => {
                              const boardComponent = (
                                <ProductionChessBoard
                                  key={`endgame-board-${effectiveBoardWidth}-${boardOrientation}-${currentPuzzle?._id || ''}`}
                                  id="EndgameTrainerBoard"
                                  position={game?.fen() || currentPuzzle?.fen || fen}
                                  boardWidth={effectiveBoardWidth}
                                  onMove={(from, to) => {
                                    if (showSolution) return false;
                                    return handleMove(from, to);
                                  }}
                                  // Disable onSquareClick on mobile to allow drag-and-drop to work properly
                                  // On mobile, touch handlers in ProductionChessBoard interfere with drag
                                  onSquareClick={showSolution || isTouchDevice ? undefined : (square) => {
                                    if (!game || puzzleComplete) return;
                                    if (selectedSquare) {
                                      const success = makeMove(selectedSquare, square);
                                      if (success) {
                                        setSelectedSquare(null);
                                      } else {
                                        const piece = game.get(square);
                                        if (piece && piece.color === game.turn()) {
                                          setSelectedSquare(square);
                                        } else {
                                          setSelectedSquare(null);
                                        }
                                      }
                                    } else {
                                      const piece = game.get(square);
                                      if (piece && piece.color === game.turn()) {
                                        setSelectedSquare(square);
                                      }
                                    }
                                  }}
                                  customSquareStyles={getCustomSquareStyles()}
                                  arePiecesDraggable={!showSolution && !puzzleComplete}
                                  customBoardStyle={{
                                    borderRadius: '8px',
                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                                    width: `${effectiveBoardWidth}px`,
                                    height: `${effectiveBoardWidth}px`,
                                    maxWidth: '100%',
                                    maxHeight: '100%',
                                    cursor: 'pointer',
                                    pointerEvents: 'auto',
                                    position: 'relative',
                                    zIndex: 1,
                                    // Critical for mobile drag and drop - must be 'none' not 'manipulation'
                                    touchAction: 'none',
                                    userSelect: 'none',
                                    WebkitUserSelect: 'none',
                                    MozUserSelect: 'none',
                                    msUserSelect: 'none',
                                    WebkitTouchCallout: 'none',
                                    WebkitTapHighlightColor: 'transparent'
                                  }}
                                  // Override wrapper's touchAction to allow drag on mobile
                                  style={{
                                    touchAction: 'none'
                                  }}
                                  customPieceStyle={{
                                    cursor: 'grab',
                                    touchAction: 'none'
                                  }}
                                  customDragPieceStyle={{
                                    cursor: 'grabbing',
                                    touchAction: 'none'
                                  }}
                                  customArrows={getAllArrows()}
                                  areArrowsAllowed={true}
                                  boardOrientation={boardOrientation}
                                  animationDuration={200}
                                  fitToParent={false}
                                />
                              );
                              return isTouchDevice ? (
                                <DndProvider backend={TouchBackend} options={touchBackendOptions}>
                                  {boardComponent}
                                </DndProvider>
                              ) : (
                                boardComponent
                              );
                            })()}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-center items-center h-96">
                      <div className="text-gray-400">No puzzle loaded</div>
                    </div>
                  )}
                </div>
                


                {/* Feedback */}
                {feedback && (
                  <div className="mt-6 p-4 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl border border-blue-500/30 backdrop-blur-sm">
                    <div className="text-center text-lg font-semibold text-emerald-300">{feedback}</div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="mt-6 space-y-4">
              {/* Recent Solved History (Last 24 Hours) */}
              {(() => {
                const recentPuzzles = getRecentPuzzles(PUZZLE_TYPES.ENDGAME, 24);
                const allPuzzles = getRecentPuzzles(PUZZLE_TYPES.ENDGAME, 24 * 7); // Last 7 days as fallback
                const puzzlesToShow = recentPuzzles.length > 0 ? recentPuzzles : allPuzzles;
                console.log('📊 Recent puzzles retrieved:', recentPuzzles.length, 'All puzzles:', allPuzzles.length);
                return puzzlesToShow.length > 0 && (
                  <div className="bg-gradient-to-br from-slate-100 to-blue-50 border-2 border-blue-200 rounded-2xl p-4 sm:p-6 shadow-lg">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold text-gray-900 flex items-center">
                        <div className="w-2 h-2 bg-green-600 rounded-full mr-3 shadow-sm"></div>
                        {recentPuzzles.length > 0 ? 'Recent Solved (24h)' : 'Recent Solved (7 days)'}
                      </h3>
                      <button
                        onClick={() => {
                          // Force re-render by updating a dummy state
                          setPuzzleHistory(prev => [...prev]);
                        }}
                        className="text-xs text-blue-600 hover:text-blue-700 font-semibold transition-colors"
                      >
                        🔄 Refresh
                      </button>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                        {puzzlesToShow.map((puzzle, index) => (
                      <div
                        key={`${puzzle.id || 'puzzle'}-${index}`}
                        className={`rounded-lg p-3 cursor-pointer hover:scale-105 transition-all duration-200 border-2 shadow-sm hover:shadow-md ${
                          puzzle.solved 
                            ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-400 hover:border-green-500' 
                            : 'bg-gradient-to-br from-red-50 to-rose-50 border-red-400 hover:border-red-500'
                        }`}
                        onClick={() => {
                          // Load this puzzle as a replay (don't track stats)
                          console.log('🔄 Loading endgame puzzle from history as replay:', puzzle.id);
                          initializePuzzle({
                            _id: puzzle.id,
                            fen: puzzle.fen,
                            moves: puzzle.moves,
                            rating: puzzle.rating,
                            theme: puzzle.theme,
                            description: puzzle.description
                          });
                          // Mark this as a replay so stats aren't tracked
                          setIsReplay(true);
                          setOrientationLocked(false); // Reset orientation lock
                        }}
                      >
                        <div className="text-center">
                          <div className="text-2xl mb-1">
                            {puzzle.solved ? '✅' : '❌'}
                          </div>
                          <div className={`text-xs font-bold truncate ${
                            puzzle.solved ? 'text-green-900' : 'text-red-900'
                          }`}>
                            {puzzle.theme || 'Puzzle'}
                          </div>
                          <div className="text-xs text-gray-700 font-semibold">
                            {puzzle.rating || 'N/A'}
                          </div>
                          <div className="text-xs text-gray-600 mt-1 font-medium">
                            {new Date(puzzle.timestamp).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })()}
              
              {/* No puzzles message */}
              {(() => {
                const recentPuzzles = getRecentPuzzles(PUZZLE_TYPES.ENDGAME, 24);
                const allPuzzles = getRecentPuzzles(PUZZLE_TYPES.ENDGAME, 24 * 7);
                const hasAnyPuzzles = recentPuzzles.length > 0 || allPuzzles.length > 0;
                
                return !hasAnyPuzzles && (
                  <div className="bg-gradient-to-br from-slate-800/50 to-blue-900/30 backdrop-blur-sm border border-blue-500/20 rounded-2xl p-4 sm:p-6">
                    <div className="text-center text-gray-400 py-8">
                      <div className="text-4xl mb-4">🎯</div>
                      <h3 className="text-lg font-semibold mb-2">No puzzles solved yet</h3>
                      <p className="text-sm">Start solving endgame puzzles to see them here!</p>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Controls Sidebar */}
          <div className="xl:col-span-1">
            <div className="bg-gradient-to-br from-slate-800/50 to-blue-900/30 backdrop-blur-sm border border-blue-500/20 rounded-3xl p-6 shadow-2xl">
              <h2 className="text-xl font-bold mb-6 text-white text-center">Controls</h2>
              <div className="space-y-4">
                <button 
                  onClick={handleShowSolution}
                  className="w-full bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white font-bold py-4 px-6 rounded-2xl transition-all duration-200 flex items-center justify-center space-x-3 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <Eye className="w-5 h-5" />
                  <span>Show Solution</span>
                </button>
                {puzzleComplete && currentPuzzle && game && (
                  <button
                    onClick={() => {
                      // Calculate the position after opponent's first move (where user needs to solve)
                      const analysisGame = new Chess(currentPuzzle.fen);
                      if (currentPuzzle.moves && currentPuzzle.moves.length > 0) {
                        const firstMove = currentPuzzle.moves[0];
                        try {
                          if (firstMove.length === 4 && /^[a-h][1-8][a-h][1-8]$/.test(firstMove)) {
                            analysisGame.move({ 
                              from: firstMove.substring(0, 2), 
                              to: firstMove.substring(2, 4), 
                              promotion: 'q' 
                            });
                          } else {
                            analysisGame.move(firstMove, { sloppy: true });
                          }
                        } catch (error) {
                          console.warn('Could not execute opponent move for analysis:', error);
                        }
                      }
                      const positionAfterOpponentMove = analysisGame.fen();
                      const sideToMove = analysisGame.turn();
                      const encodedFen = encodeURIComponent(positionAfterOpponentMove);
                      const colorParam = sideToMove === 'w' ? 'white' : 'black';
                      const label = 'Endgame Trainer';
                      console.log('🎯 Opening analysis with position after opponent move:', positionAfterOpponentMove);
                      console.log('🎯 Side to move:', sideToMove);
                      window.open(`/analysis?fen=${encodedFen}&orientation=${colorParam}&label=${encodeURIComponent(label)}`, '_blank');
                    }}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-4 px-6 rounded-2xl transition-all duration-200 flex items-center justify-center space-x-3 shadow-lg hover:shadow-xl transform hover:scale-105"
                    title="Open this position in the Analysis Board"
                  >
                    <span className="text-xl">🔎</span>
                    <span>Analyze on Live Board</span>
                  </button>
                )}
                <button 
                  onClick={() => {
                    console.log('🔄 New Puzzle button clicked');
                    loadNewPuzzle(true); // Force load even if already loading
                  }}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-bold py-4 px-6 rounded-2xl transition-all duration-200 flex items-center justify-center space-x-3 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed"
                >
                  <RotateCcw className="w-5 h-5" />
                  <span>{loading ? 'Loading...' : 'New Puzzle'}</span>
                </button>
              </div>

              {showSolution && currentPuzzle && (
                <div className="mt-4 p-3 bg-slate-700/50 rounded-lg">
                  <h3 className="font-semibold mb-2 text-sm text-gray-300">
                    Solution ({solutionStep}/{currentPuzzle.moves?.length || 0}):
                  </h3>
                  <div className="space-y-1">
                    {currentPuzzle.moves?.map((move, index) => (
                      <div 
                        key={index} 
                        className={`text-xs p-2 rounded border ${
                          index < solutionStep 
                            ? 'bg-green-800 border-green-600 text-green-200' 
                            : 'bg-slate-800 border-slate-600 text-gray-400'
                        }`}
                      >
                        {index + 1}. {move}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Puzzle Info Cards */}
              <div className="mt-8 space-y-6">
                {/* User Rating */}
                <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-2xl shadow-xl border border-blue-500/30 p-6 backdrop-blur-sm">
                  <h3 className="text-lg font-bold mb-4 text-blue-300 flex items-center">
                    <div className="w-3 h-3 bg-blue-400 rounded-full mr-3"></div>
                    Your Rating
                  </h3>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-blue-200">{userEndgameRating || 1200}</div>
                    <div className="text-sm text-blue-400 mt-2">Endgame Rating</div>
                    {showRatingChange && ratingChange !== null && (
                      <div className={`mt-4 p-3 rounded-xl text-center font-bold text-lg shadow-lg transform transition-all duration-300 ${
                        ratingChange > 0 
                          ? 'bg-gradient-to-r from-green-500 to-green-600 text-white' 
                          : 'bg-gradient-to-r from-red-500 to-red-600 text-white'
                      }`}>
                        {ratingChange > 0 ? '+' : ''}{ratingChange}
                      </div>
                    )}
                  </div>
                </div>

                {/* Puzzle Difficulty */}
                {currentPuzzle?.rating && (
                  <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl shadow-xl border border-purple-500/30 p-6 backdrop-blur-sm">
                    <h3 className="text-lg font-bold mb-4 text-purple-300 flex items-center">
                      <div className="w-3 h-3 bg-purple-400 rounded-full mr-3"></div>
                      Puzzle Difficulty
                    </h3>
                    <div className="text-center">
                      <div className="text-4xl font-bold text-purple-200">{currentPuzzle.rating}</div>
                      <div className="text-sm text-purple-400 mt-2">Rating</div>
                    </div>
                  </div>
                )}

                {/* Puzzle Info */}
                {currentPuzzle && (
                  <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-2xl shadow-xl border border-green-500/30 p-6 backdrop-blur-sm">
                    <h3 className="text-lg font-bold mb-4 text-green-300 flex items-center">
                      <div className="w-3 h-3 bg-green-400 rounded-full mr-3"></div>
                      Puzzle Info
                    </h3>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center p-3 bg-slate-700/50 rounded-xl border border-green-500/20">
                        <span className="font-semibold text-green-300 text-sm">Theme:</span>
                        <span className="text-green-200 text-sm font-bold">{currentPuzzle.theme || 'Endgame'}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-slate-700/50 rounded-xl border border-green-500/20">
                        <span className="font-semibold text-green-300 text-sm">Move:</span>
                        <span className="text-green-200 text-sm font-bold">{moveIndex + 1} / {currentPuzzle.moves?.length || 0}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-slate-700/50 rounded-xl border border-green-500/20">
                        <span className="font-semibold text-green-300 text-sm">Difficulty:</span>
                        <span className="text-green-200 text-sm font-bold capitalize">{selectedDifficulty}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>


        {/* Analysis Modal */}
        {showAnalysis && currentPuzzle && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-white">Puzzle Analysis</h3>
                <button
                  onClick={() => setShowAnalysis(false)}
                  className="text-gray-400 hover:text-white text-2xl"
                >
                  ×
                </button>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Board */}
                <div>
                  <ProductionChessBoard
                    position={currentPuzzle.fen}
                    boardWidth={400}
                    customBoardStyle={{
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      cursor: 'pointer'
                    }}
                    arePiecesDraggable={false}
                    showBoardNotation={false}
                    areArrowsAllowed={false}
                    onMove={() => false}
                    fitToParent={false}
                  />
                </div>
                
                {/* Analysis Info */}
                <div className="space-y-4">
                  <div className="bg-slate-700/50 rounded-lg p-4">
                    <h4 className="font-semibold text-white mb-2">Puzzle Details</h4>
                    <div className="space-y-2 text-sm">
                      <div><span className="text-gray-400">Rating:</span> {currentPuzzle.rating}</div>
                      <div><span className="text-gray-400">Theme:</span> {selectedTheme}</div>
                      <div><span className="text-gray-400">Moves:</span> {currentPuzzle.moves?.length || 0}</div>
                    </div>
                  </div>
                  
                  <div className="bg-slate-700/50 rounded-lg p-4">
                    <h4 className="font-semibold text-white mb-2">Solution</h4>
                    <div className="space-y-1">
                      {currentPuzzle.moves?.map((move, index) => (
                        <div key={index} className="text-sm text-gray-300">
                          {index + 1}. {move}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <button
                    onClick={() => {
                      setShowAnalysis(false);
                      // Load this puzzle to play
                      initializePuzzle({
                        _id: currentPuzzle._id,
                        fen: currentPuzzle.fen,
                        moves: currentPuzzle.moves,
                        rating: currentPuzzle.rating,
                        description: currentPuzzle.description
                      });
                    }}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                  >
                    Play This Puzzle
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EndgameTrainerPage;
