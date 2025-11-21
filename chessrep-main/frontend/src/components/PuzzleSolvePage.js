import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import axios from 'axios';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Volume2, VolumeX, RotateCcw, Eye, ArrowRight, Trophy, Zap, Pencil, Trash, Copy, MoreVertical } from 'lucide-react';
import UpgradeBanner from './UpgradeBanner';
import { getApiUrl } from '../config/api';
import { DropdownMenu } from './ui/dropdown-menu';
import OpenInLiveAnalysisButton from './OpenInLiveAnalysisButton';
import { savePuzzleResult, getRecentPuzzles, PUZZLE_TYPES } from '../utils/puzzleTracker';
import { updateDailyProgress, MODULE_NAMES } from '../utils/dailyProgress';

// Theme explanations
const themeExplanations = {
  'fork': 'A tactic where one piece attacks two or more enemy pieces simultaneously',
  'pin': 'A piece is pinned when it cannot move without exposing a more valuable piece behind it',
  'skewer': 'A tactic where a valuable piece is attacked and forced to move, exposing a less valuable piece behind it',
  'discovered_attack': 'Moving one piece to reveal an attack by another piece',
  'deflection': 'Forcing an opponent\'s piece to leave a square where it performs an important function',
  'sacrifice': 'Intentionally giving up material to gain a positional or tactical advantage',
  'back_rank_mate': 'Checkmate delivered on the back rank, typically when the king is trapped by its own pieces',
  'mate_in_1': 'Puzzles where you can checkmate in one move',
  'mate_in_2': 'Puzzles where you can checkmate in two moves',
  'mate_in_3': 'Puzzles where you can checkmate in three moves',
  'endgame': 'Puzzles focusing on endgame techniques and principles',
  'tactic': 'General tactical puzzles covering various tactical motifs',
  'interference': 'A tactic that blocks the connection between two enemy pieces',
  'attraction': 'Luring an opponent\'s piece to a disadvantageous square',
  'smothered_mate': 'A checkmate where the king is surrounded by its own pieces and cannot escape',
  'boden_mate': 'A checkmate pattern involving two bishops and a knight',
  'mate': 'General checkmate puzzles',
  'pawn_endgame': 'Endgame puzzles focusing on pawn play and promotion',
  'rook_endgame': 'Endgame puzzles featuring rook and pawn endgames',
  'bishop_endgame': 'Endgame puzzles with bishops and pawns',
  'queen_endgame': 'Endgame puzzles with queens and pawns',
  'queen_rook_endgame': 'Endgame puzzles with queens, rooks, and pawns',
  'advanced_pawn': 'Puzzles involving advanced pawns and their promotion potential',
  'hanging_piece': 'Puzzles where pieces are left undefended and can be captured',
  'exposed_king': 'Puzzles where the king is vulnerable to attack',
  'promotion': 'Puzzles focusing on pawn promotion tactics',
  'zugzwang': 'A situation where any move worsens the position',
  'kingside_attack': 'Attacking patterns directed at the opponent\'s kingside',
  'queenside_attack': 'Attacking patterns directed at the opponent\'s queenside',
  'attacking_f2_f7': 'Attacks targeting the vulnerable f2 and f7 squares',
  'opening': 'Puzzles from the opening phase of the game',
  'middlegame': 'Puzzles from the middlegame phase',
  'one_move': 'Single-move tactical puzzles',
  'short': 'Short tactical sequences',
  'long': 'Longer tactical sequences',
  'very_long': 'Complex tactical sequences requiring deep calculation',
  'quiet_move': 'Non-forcing moves that improve the position',
  'defensive_move': 'Puzzles requiring defensive techniques',
  'master': 'Puzzles from master-level games',
  'master_vs_master': 'Puzzles from games between masters',
  'super_gm': 'Puzzles from games involving super grandmasters',
  'crushing': 'Puzzles featuring decisive tactical blows',
  'advantage': 'Puzzles where you convert an advantage',
  // CamelCase mappings
  'advancedPawn': 'Puzzles involving advanced pawns and their promotion potential',
  'attackingF2F7': 'Attacks targeting the vulnerable f2 and f7 squares',
  'backRankMate': 'Checkmate delivered on the back rank, typically when the king is trapped by its own pieces',
  'bishopEndgame': 'Endgame puzzles with bishops and pawns',
  'bodenMate': 'A checkmate pattern involving two bishops and a knight',
  'defensiveMove': 'Puzzles requiring defensive techniques',
  'discoveredAttack': 'Moving one piece to reveal an attack by another piece',
  'exposedKing': 'Puzzles where the king is vulnerable to attack',
  'hangingPiece': 'Puzzles where pieces are left undefended and can be captured',
  'kingsideAttack': 'Attacking patterns directed at the opponent\'s kingside'
};


const TOUCH_BOARD_STYLE = {
  touchAction: 'manipulation', // Better mobile touch handling - allows dragging but prevents double-tap zoom
  WebkitUserSelect: 'none',
  MozUserSelect: 'none',
  msUserSelect: 'none',
  userSelect: 'none',
  WebkitTouchCallout: 'none', // Disable iOS callout
  WebkitTapHighlightColor: 'transparent', // Remove tap highlight
  cursor: 'pointer' // Ensure cursor shows interaction
};
// Helper to get the last move arrow from the game history
function getMoveArrowFromHistory(game) {
  if (!game) return null;
  const history = game.history({ verbose: true });
  if (history.length === 0) return null;
  const lastMove = history[history.length - 1];
  return { from: lastMove.from, to: lastMove.to, color: '#2196f3' };
}

const PuzzleSolvePage = () => {
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [puzzle, setPuzzle] = useState(null);
  const [game, setGame] = useState(null);
  const [moveIndex, setMoveIndex] = useState(0);
  const [boardOrientation, setBoardOrientation] = useState('white');
  const [orientationLocked, setOrientationLocked] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const [status, setStatus] = useState('');
  const [arrows, setArrows] = useState([]);
  const [drawnArrows, setDrawnArrows] = useState([]);
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [puzzleState, setPuzzleState] = useState('active'); // 'active', 'solved', 'failed'
  const [userRating, setUserRating] = useState(null);
  const [ratingChange, setRatingChange] = useState(null);
  const [showRatingChange, setShowRatingChange] = useState(false);
  const [statsUpdated, setStatsUpdated] = useState(false);
  const [failedUpdated, setFailedUpdated] = useState(false);
  const [showLimitReached, setShowLimitReached] = useState(false);
  const [puzzleLimitInfo, setPuzzleLimitInfo] = useState(null);
  const [boardSize, setBoardSize] = useState(() => {
    // Detect screen size on initial render to set appropriate default
    if (typeof window !== 'undefined') {
      const isMobile = window.innerWidth < 768;
      const isTablet = window.innerWidth >= 768 && window.innerWidth < 1280;
      if (isMobile) return Math.min(window.innerWidth - 64, 350);
      if (isTablet) return Math.min(window.innerWidth - 128, 500);
      return 800; // Desktop default
    }
    return 400; // SSR fallback
  });
  const [computedBoardWidth, setComputedBoardWidth] = useState(() => {
    // Detect screen size on initial render to set appropriate default
    if (typeof window !== 'undefined') {
      const isMobile = window.innerWidth < 768;
      const isTablet = window.innerWidth >= 768 && window.innerWidth < 1280;
      if (isMobile) return Math.min(window.innerWidth - 64, 350);
      if (isTablet) return Math.min(window.innerWidth - 128, 500);
      return 800; // Desktop default
    }
    return 400; // SSR fallback
  });
  const [userAdjustedBoardSize, setUserAdjustedBoardSize] = useState(false);
  const [selectedDifficulty, setSelectedDifficulty] = useState('intermediate');
  const [theme, setTheme] = useState(''); // Assuming theme is passed as a param or state
  const [highlightedSquares, setHighlightedSquares] = useState([]); // For right-click red highlight
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  // Puzzle caching for instant loading
  const [puzzleCache, setPuzzleCache] = useState([]);
  const [isPreloading, setIsPreloading] = useState(false);
  const [skipCounter, setSkipCounter] = useState(0); // Prevent infinite loops
  const [isManualChange, setIsManualChange] = useState(false); // Track manual puzzle changes
  const [isInitialized, setIsInitialized] = useState(false); // Prevent multiple initializations
  const [isReplay, setIsReplay] = useState(false); // Track if this is a replay from history

  // Solution replay state (removed unused solutionPosition)

  // Puzzle history
  const [puzzleHistory, setPuzzleHistory] = useState([]);
  const [showAnalysis, setShowAnalysis] = useState(false);

  // Audio refs
  const moveSoundRef = useRef(null);
  const captureSoundRef = useRef(null);
  const castleSoundRef = useRef(null);

  // Board ref for direct control during solution replay
  const boardRef = useRef(null);
  const boardContainerRef = useRef(null);
  
  // Refs for tracking stats updates (used in async operations)
  const statsUpdatedRef = useRef(false);
  const failedUpdatedRef = useRef(false);

  React.useLayoutEffect(() => {
    const updateBoardWidth = () => {
      const container = boardContainerRef.current;
      const p1 = container?.parentElement || null;
      const p2 = p1?.parentElement || null;
      // Prefer the inner gradient card (p2), else p1, else container
      const measureEl = p2 || p1 || container;
      let containerWidth = 600;
      let contentWidth = 600;
      if (measureEl) {
        const rect = measureEl.getBoundingClientRect();
        containerWidth = rect.width || measureEl.clientWidth || 600;
        // Subtract horizontal paddings to get content width
        try {
          const styles = getComputedStyle(measureEl);
          const padLeft = parseFloat(styles.paddingLeft || '0');
          const padRight = parseFloat(styles.paddingRight || '0');
          // Subtract a slightly larger safety margin to avoid right-edge clipping
          contentWidth = Math.max(0, containerWidth - padLeft - padRight - 16);
        } catch {
          contentWidth = containerWidth;
        }
      } else if (typeof window !== 'undefined') {
        containerWidth = window.innerWidth;
        contentWidth = Math.max(0, containerWidth - 56 - 16);
      }
      // If user hasn't adjusted, use min(800px, content width) for desktop; otherwise respect chosen boardSize
      const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 1280;
      const defaultSize = isDesktop ? 800 : 400;
      const desired = userAdjustedBoardSize ? boardSize : Math.min(defaultSize, contentWidth);
      const finalWidth = Math.min(desired, contentWidth);
      setComputedBoardWidth(Math.max(240, Math.floor(finalWidth) || 240));
    };

    updateBoardWidth();
    const raf1 = requestAnimationFrame(updateBoardWidth);
    const raf2 = requestAnimationFrame(() => setTimeout(updateBoardWidth, 0));
    const t2 = setTimeout(updateBoardWidth, 250);

    const resizeObserver =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(updateBoardWidth)
        : null;

    if (resizeObserver && boardContainerRef.current) {
      resizeObserver.observe(boardContainerRef.current);
      const p1 = boardContainerRef.current.parentElement;
      if (p1) resizeObserver.observe(p1);
      const p2 = p1?.parentElement;
      if (p2) resizeObserver.observe(p2);
    } else if (typeof window !== 'undefined') {
      window.addEventListener('resize', updateBoardWidth);
    }

    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
      clearTimeout(t2);
      if (resizeObserver) {
        resizeObserver.disconnect();
      } else if (typeof window !== 'undefined') {
        window.removeEventListener('resize', updateBoardWidth);
      }
    };
  }, [boardSize, userAdjustedBoardSize]);

  // Ensure a second-pass re-measure after page load and after puzzle loads (mimics slider fix automatically)
  useEffect(() => {
    const measure = () => {
      const container = boardContainerRef.current;
      const p1 = container?.parentElement || null;
      const p2 = p1?.parentElement || null;
      const measureEl = p2 || p1 || container;
      let containerWidth = 600;
      let contentWidth = 600;
      if (measureEl) {
        const rect = measureEl.getBoundingClientRect();
        containerWidth = rect.width || measureEl.clientWidth || 600;
        try {
          const styles = getComputedStyle(measureEl);
          const padLeft = parseFloat(styles.paddingLeft || '0');
          const padRight = parseFloat(styles.paddingRight || '0');
          contentWidth = Math.max(0, containerWidth - padLeft - padRight - 16);
        } catch {
          contentWidth = containerWidth;
        }
      } else if (typeof window !== 'undefined') {
        containerWidth = window.innerWidth;
        contentWidth = Math.max(0, containerWidth - 56 - 16);
      }
      const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 1280;
      const defaultSize = isDesktop ? 800 : 400;
      const desired = userAdjustedBoardSize ? boardSize : Math.min(defaultSize, contentWidth);
      const finalWidth = Math.min(desired, contentWidth);
      setComputedBoardWidth(Math.max(240, Math.floor(finalWidth) || 240));
    };
    // After initial content and fonts/images
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
  }, [puzzle, loading, boardSize, userAdjustedBoardSize]);

  // Pre-load sounds once
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

  const playMoveSound = (moveObj) => {
    if (!moveObj || !moveSoundRef.current) return;
    try {
      if (moveObj.flags.includes('c')) {
        captureSoundRef.current?.play().catch(e => console.warn('Could not play capture sound:', e));
      } else if (moveObj.san === 'O-O' || moveObj.san === 'O-O-O') {
        castleSoundRef.current?.play().catch(e => console.warn('Could not play castle sound:', e));
      } else {
        moveSoundRef.current?.play().catch(e => console.warn('Could not play move sound:', e));
      }
    } catch (error) {
      console.warn('Error playing move sound:', error);
    }
  };

  const fetchPuzzleRef = useRef();
  const lastFetchIdRef = useRef(0);
  const prevThemeRef = useRef(null);
  const hasMountedRef = useRef(false);

  // Theme options will be fetched dynamically from the backend
  const [themeOptions, setThemeOptions] = useState([
    '', // All themes
    'random', // Add random theme option
    // Basic themes (fallback)
    'fork',
    'pin',
    'skewer',
    'discovered_attack',
    'deflection',
    'sacrifice',
    'back_rank_mate',
    'mate_in_1',
    'mate_in_2',
    'endgame',
    'tactic',
  ]);
  
  // Store theme labels from backend
  const [themeLabels, setThemeLabels] = useState({});
  
  // Helper function to format theme names properly
  const formatThemeName = useCallback((themeCode) => {
    if (!themeCode) return '';
    
    // If we have a label from backend, use it
    if (themeLabels[themeCode]) {
      return themeLabels[themeCode];
    }
    
    // Handle camelCase (e.g., "ExposedKing" -> "Exposed King")
    const camelCaseFormatted = themeCode.replace(/([a-z])([A-Z])/g, '$1 $2');
    
    // Handle snake_case (e.g., "exposed_king" -> "Exposed King")
    const snakeCaseFormatted = camelCaseFormatted.replace(/_/g, ' ');
    
    // Capitalize first letter of each word
    return snakeCaseFormatted.replace(/\b\w/g, l => l.toUpperCase());
  }, [themeLabels]);

  const { theme: urlTheme } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // Preload puzzles for instant "Next Puzzle" experience
  const preloadPuzzles = useCallback(async (currentTheme = urlTheme || theme, count = 5) => {
    if (isPreloading) return;
    
    setIsPreloading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { 'x-auth-token': token } : {};
      
      const themeToUse = currentTheme;
      const url = `${getApiUrl('/puzzles/random')}${themeToUse ? `?theme=${encodeURIComponent(themeToUse)}&count=${count}` : `?count=${count}`}`;
      
      console.log('🔄 Preloading puzzles from:', url);
      
      const response = await axios.get(url, { 
        headers,
        timeout: 5000 // Reduced timeout for faster preloading
      });
      
      if (response.data?.puzzles?.length > 0) {
        const validPuzzles = response.data.puzzles.filter(p => p && p.fen && p.moves);
        console.log('✅ Preloaded', validPuzzles.length, 'puzzles for theme:', themeToUse);
        setPuzzleCache(prev => [...prev, ...validPuzzles].slice(0, 10)); // Keep max 10 puzzles in cache
      }
    } catch (error) {
      console.error('⚠️ Preload failed:', error.message);
    } finally {
      setIsPreloading(false);
    }
  }, [urlTheme, theme, isPreloading]);

  // Function to initialize a new puzzle
  const initializePuzzle = useCallback((puzzleData, skipValidation = false) => {
    console.log('🔧 Initializing puzzle:', puzzleData);
    
    if (!puzzleData?.puzzle) {
      console.error('Invalid puzzle data:', puzzleData);
      setError('No puzzle data available.');
      setLoading(false);
      return;
    }

    try {
      const newGame = new Chess(puzzleData.puzzle.fen);
      console.log('✅ Created Chess game with FEN:', puzzleData.puzzle.fen);
      
      // Immediately preload next puzzles for instant "Next Puzzle" experience
      setTimeout(() => preloadPuzzles(), 200);
      
      let userMoveIndex = 0;

      // Only do basic validation, don't auto-skip puzzles unless explicitly broken
      if (!skipValidation) {
        // Only skip if the FEN is completely invalid
        if (!newGame.fen()) {
          console.error('Invalid FEN, cannot create game');
          setError('Invalid puzzle position.');
          setLoading(false);
          return;
        }
      }

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
          } else {
            // SAN format
            firstMoveResult = newGame.move(firstMove, { sloppy: true });
          }
          
          if (firstMoveResult) {
            userMoveIndex = 1;
            console.log('✅ Played opponent move:', firstMove);
          } else {
            console.log('⚠️ Could not play first move, user starts:', firstMove);
          }
        } catch (error) {
          console.log('⚠️ First move failed, user is to move:', error.message);
        }
      }

      console.log('✅ Setting puzzle state with:', puzzleData.puzzle);
      setPuzzle({ ...puzzleData.puzzle, originalMoves: [...puzzleData.puzzle.moves] });
      setGame(newGame);
      console.log('🎯 Game state set with FEN:', newGame.fen());
      setMoveIndex(userMoveIndex);
      setShowSolution(false);
      setStatus('Your turn to move!');
      setArrows([]);
      setError(null);
      setPuzzleState('active');
      setSelectedSquare(null);
      setSkipCounter(0); // Reset skip counter on successful puzzle load
      setIsManualChange(false); // Reset manual change flag
      setIsReplay(false); // Reset replay flag
      // Set board orientation so the player whose turn it is has pieces at the bottom
      setBoardOrientation(newGame.turn() === 'w' ? 'white' : 'black');
      setLoading(false);
      console.log('✅ Puzzle initialization complete!');
    } catch (err) {
      console.error('Error initializing puzzle:', err);
      // Initialize with default position on error
      const defaultGame = new Chess();
      setGame(defaultGame);
      setError('Failed to initialize puzzle. Please try again.');
      setLoading(false);
    }
  }, []);

  // Function to fetch a new puzzle (with validation)
  const fetchPuzzle = useCallback(async () => {
    // Check usage limits for free users before fetching puzzle
    if (user && user.userType !== 'premium' && !isReplay) {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const response = await fetch(getApiUrl('/usage-limits/puzzle-trainer'), {
            headers: { 'x-auth-token': token }
          });
          
          if (response.ok) {
            const limitData = await response.json();
            if (!limitData.allowed) {
              setStatus(`You've reached your daily limit of 20 puzzles. Come back tomorrow or upgrade to premium for unlimited access!`);
              setShowLimitReached(true);
              setPuzzleLimitInfo({ used: limitData.limit, limit: limitData.limit });
              setLoading(false);
              return;
            }
          }
        }
      } catch (error) {
        console.error('Error checking usage limits:', error);
      }
    }
    
    const fetchId = ++lastFetchIdRef.current;
    console.log('🔄 FETCHING NEW PUZZLE - Manual change:', isManualChange);
    setLoading(true);
    setError(null);
    setSkipCounter(0); // Reset skip counter on new fetch
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { 'x-auth-token': token } : {};
      
      // Use state theme first, then URL theme as fallback
      const themeToUse = theme || urlTheme;
      let url = getApiUrl('/puzzles/random');
      const params = new URLSearchParams();
      if (themeToUse) params.append('theme', themeToUse);
      if (selectedDifficulty) params.append('difficulty', selectedDifficulty);
      params.append('count', '5');
      if (params.toString()) url += `?${params.toString()}`;
      
      console.log('🌐 Fetching puzzles from:', url);
      console.log('🎯 Theme requested:', themeToUse);
      
      const response = await axios.get(url, { 
        headers,
        timeout: 5000 // Reduced to 5 seconds for faster response
      });
      
      const puzzleData = response.data;
      console.log('📦 Received puzzle data:', puzzleData);
      
      if (fetchId !== lastFetchIdRef.current) {
        // A newer request has been issued; ignore this response
        console.log('⏭️ Stale fetch response ignored');
        return;
      }
      if (puzzleData?.puzzles && puzzleData.puzzles.length > 0) {
        const puzzles = puzzleData.puzzles;
        const selectedPuzzle = puzzles[0]; // Use first puzzle
        console.log('🎯 Selected puzzle with theme:', selectedPuzzle.theme);
        console.log('🎯 Puzzle FEN:', selectedPuzzle.fen);
        console.log('🎯 Puzzle moves:', selectedPuzzle.moves);
        
        // Cache remaining puzzles for instant "Next Puzzle"
        if (puzzles.length > 1) {
          const remainingPuzzles = puzzles.slice(1);
          setPuzzleCache(prev => [...remainingPuzzles, ...prev].slice(0, 10));
          console.log('💾 Cached', remainingPuzzles.length, 'puzzles for instant loading');
        }
        
        // Verify the puzzle theme matches what we requested
        if (themeToUse && selectedPuzzle.theme !== themeToUse) {
          console.log(`⚠️ Theme mismatch: requested '${themeToUse}', got '${selectedPuzzle.theme}'`);
        }
        
        console.log('🚀 Calling initializePuzzle with:', { puzzle: selectedPuzzle });
        initializePuzzle({ puzzle: selectedPuzzle });
      } else if (puzzleData?.puzzle) {
        // Fallback for old format
        console.log('🚀 Calling initializePuzzle with fallback format:', puzzleData);
        initializePuzzle(puzzleData);
      } else {
        console.error('❌ No puzzle in response:', puzzleData);
        setError(`No puzzles found for theme: ${themeToUse || 'any'}`);
      }
    } catch (err) {
      console.error('Error fetching puzzle:', err.response?.data || err.message);
      console.error('Error status:', err.response?.status);
      console.error('Error code:', err.code);
      
      if (err.code === 'ECONNABORTED') {
        setError('Request timed out. Please try again.');
      } else if (err.response?.status === 401) {
        setError('Authentication failed. Please log in again.');
      } else if (err.response?.status === 403 && err.response?.data?.requiresPremium) {
        // Daily puzzle limit reached - show upgrade screen
        setPuzzleLimitInfo({
          limit: err.response.data.limit || 20,
          used: err.response.data.used || 20,
          resetDate: err.response.data.resetDate
        });
        setShowLimitReached(true);
        setLoading(false);
        return;
      } else if (err.response?.status === 404) {
        setError(`No puzzles found for the selected theme.`);
      } else if (err.response?.status) {
        setError(`Failed to fetch puzzle (HTTP ${err.response.status}). Please try again.`);
      } else if (err.message?.includes('Network Error') || err.message?.includes('Failed to fetch')) {
        setError('Network error. Please check your connection and ensure the backend server is running.');
      } else {
        setError('Failed to fetch puzzle. Please check your connection and try again.');
      }
    } finally {
      setLoading(false);
    }
  }, [urlTheme, theme, selectedDifficulty, initializePuzzle, user, isReplay]);
fetchPuzzleRef.current = fetchPuzzle;

  // Set board orientation based on whose turn it is - but NEVER change after puzzle is solved/failed
  useEffect(() => {
    if (game && !showSolution && !orientationLocked && puzzleState === 'active') {
      // Only change orientation during active puzzle play, never after completion
      const newOrientation = game.turn() === 'w' ? 'white' : 'black';
      console.log('🔄 Orientation useEffect triggered - setting to:', newOrientation, 'showSolution:', showSolution, 'locked:', orientationLocked, 'puzzleState:', puzzleState);
      setBoardOrientation(newOrientation);
    } else if (showSolution || orientationLocked || puzzleState !== 'active') {
      console.log('🔄 Orientation useEffect triggered but showSolution is true or orientation is locked or puzzle not active, skipping orientation change');
    }
  }, [game, showSolution, orientationLocked, puzzleState]); // Include all dependencies for clarity

  // Add turn indicator with visual styling
  const getTurnIndicator = () => {
    if (!game) return '';
    const turn = game.turn();
    return turn === 'w' ? 'White to move' : 'Black to move (bottom pieces)';
  };

  // Add visual styling for turn indicator
  const getTurnIndicatorStyle = () => {
    if (!game) return '';
    const turn = game.turn();
    return turn === 'w' 
      ? 'text-white bg-gradient-to-r from-blue-600 to-blue-700 shadow-blue-500/50' 
      : 'text-white bg-gradient-to-r from-gray-800 to-black shadow-gray-800/50';
  };

  // Function to fetch user's current rating
  const fetchUserRating = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const response = await axios.get(getApiUrl('/auth/me'), {
        headers: { 'x-auth-token': token }
      });
      
      if (response.data.rating) {
        setUserRating(response.data.rating);
      }
    } catch (error) {
      console.error('Error fetching user rating:', error);
    }
  }, []);

  // Update user rating when puzzle is solved - EXACT COPY from EndgameTrainerPage
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
        const currentRating = userRating || 1200;
        const ratingChange = success ? Math.floor(Math.random() * 20) + 5 : -Math.floor(Math.random() * 15) - 3;
        
        setRatingChange(ratingChange);
        setShowRatingChange(true);
        
        const changeText = ratingChange > 0 ? `+${ratingChange}` : `${ratingChange}`;
        setStatus(prev => `${prev} Rating: ${changeText} (Demo Mode)`);
        
        // Hide rating change after 3 seconds
        setTimeout(() => {
          setShowRatingChange(false);
        }, 3000);
        return;
      }

      console.log('📡 Sending rating update to backend...');
      const response = await fetch(getApiUrl('/puzzles/stats/puzzle'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
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
          updateDailyProgress(MODULE_NAMES.TACTICS);
        }
        console.log('📡 Rating update response:', data);
        if (data.ratingChange !== undefined) {
          const changeText = data.ratingChange > 0 ? `+${data.ratingChange}` : `${data.ratingChange}`;
          setStatus(prev => `${prev} Rating: ${changeText}`);
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
        const currentRating = userRating || 1200;
        const ratingChange = success ? Math.floor(Math.random() * 20) + 5 : -Math.floor(Math.random() * 15) - 3;
        
        setRatingChange(ratingChange);
        setShowRatingChange(true);
        
        const changeText = ratingChange > 0 ? `+${ratingChange}` : `${ratingChange}`;
        setStatus(prev => `${prev} Rating: ${changeText} (Offline)`);
        
        setTimeout(() => {
          setShowRatingChange(false);
        }, 3000);
      }
    } catch (error) {
      console.error('❌ Error updating rating:', error);
      // Show local rating change as fallback
      const currentRating = userRating || 1200;
      const ratingChange = success ? Math.floor(Math.random() * 20) + 5 : -Math.floor(Math.random() * 15) - 3;
      
      setRatingChange(ratingChange);
      setShowRatingChange(true);
      
      const changeText = ratingChange > 0 ? `+${ratingChange}` : `${ratingChange}`;
      setStatus(prev => `${prev} Rating: ${changeText} (Offline)`);
      
      setTimeout(() => {
        setShowRatingChange(false);
      }, 3000);
    }
  }, [isReplay, userRating, refreshUser]);

  // Function to validate and make a move
  const makeMove = useCallback((from, to) => {
    console.log('🚀 MAKE MOVE CALLED with:', from, 'to', to);
    console.log('🚀 Current state:', { game: !!game, puzzle: !!puzzle, puzzleState });
    
    if (!game || !puzzle) {
      console.log('Cannot make move - game or puzzle not ready');
      return false;
    }

    // If solution is being shown, stop it and reset to active state
    if (puzzleState === 'failed' && showSolution) {
      setShowSolution(false);
      setPuzzleState('active');
      setStatus('Your turn to move!');
      return false;
    }

    if (puzzleState !== 'active') {
      console.log('Cannot make move - puzzle state is:', puzzleState);
      return false;
    }

    console.log('=== MOVE VALIDATION START ===');
    console.log('Attempting move from', from, 'to', to);
    console.log('Current move index:', moveIndex);
    console.log('Game turn:', game.turn());
    console.log('Game FEN:', game.fen());
    console.log('Puzzle moves:', puzzle.moves);

    // Strict check: ensure the piece being moved is of the correct color
    const piece = game.get(from);
    if (!piece) {
      console.log('❌ No piece on square:', from);
      return false;
    }

    if (piece.color !== game.turn()) {
      console.log('❌ Wrong color piece. Piece color:', piece.color, 'Game turn:', game.turn());
      return false;
    }

    try {
      // First, check if the move is legal in the current position
      const tempGame = new Chess(game.fen());
      const move = tempGame.move({ from, to, promotion: 'q' });
      
      if (!move) {
        console.log('❌ Illegal move - not allowed');
        setStatus('Illegal move! Please try a legal move.');
        return false;
      }

      console.log('✅ Move is legal:', move.san);
      playMoveSound(move);

      // Get the expected move for this position
      const expectedMove = puzzle.moves[moveIndex];
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
      
      // Create a temporary game to normalize the expected move
      const tempGameForExpected = new Chess(game.fen());
      let expectedMoveSan = '';
      let expectedMoveUCI = '';
      
      // Try to play the expected move to get its normalized format
      try {
        let expectedResult = null;
        if (expectedMove.length === 4 && /^[a-h][1-8][a-h][1-8]$/.test(expectedMove)) {
          // Expected move is UCI format
          expectedResult = tempGameForExpected.move({
            from: expectedMove.substring(0, 2),
            to: expectedMove.substring(2, 4),
            promotion: 'q'
          });
        } else {
          // Expected move is SAN format
          expectedResult = tempGameForExpected.move(expectedMove, { sloppy: true });
        }
        
        if (expectedResult) {
          expectedMoveSan = expectedResult.san;
          expectedMoveUCI = expectedResult.from + expectedResult.to;
        }
      } catch (error) {
        console.error('Error normalizing expected move:', error);
      }
      
      // Determine if expected move is in UCI format
      const isExpectedUCI = expectedMove.length === 4 && /^[a-h][1-8][a-h][1-8]$/.test(expectedMove);
      
      // Compare both SAN and UCI formats
      const sanMatch = actualMoveSan === expectedMoveSan;
      const uciMatch = actualMoveUCI === expectedMoveUCI;
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
      
      console.log('Move comparison result:', { 
        actualSan: actualMoveSan, 
        actualUCI: actualMoveUCI,
        expected: expectedMove, 
        isCorrect: isCorrectMove,
        format: isExpectedUCI ? 'UCI' : 'SAN'
      });
      
      if (isCorrectMove) {
        console.log('✅ Move is correct! Playing move and opponent reply...');
        
        // Move is correct, play it and the opponent's reply
        const newGame = new Chess(game.fen());
        const userMove = newGame.move({ from, to, promotion: 'q' });
        
        let newMoveIndex = moveIndex + 1;
        
        console.log('User move played:', userMove.san);
        console.log('New move index:', newMoveIndex);
        console.log('Total moves in puzzle:', puzzle.moves.length);
        
        // Auto-play opponent's reply if available
        if (newMoveIndex < puzzle.moves.length) {
          const opponentMove = puzzle.moves[newMoveIndex];
          console.log('Playing opponent move:', opponentMove);
          console.log('Game state before opponent move:', newGame.fen());
          console.log('Opponent move type check:', {
            length: opponentMove.length,
            isUCI: opponentMove.length === 4 && /^[a-h][1-8][a-h][1-8]$/.test(opponentMove),
            move: opponentMove
          });
          
          try {
            let opponentMoveResult;
            if (opponentMove.length === 4 && /^[a-h][1-8][a-h][1-8]$/.test(opponentMove)) {
              // UCI format
              const from = opponentMove.substring(0, 2);
              const to = opponentMove.substring(2, 4);
              console.log('Playing UCI move:', { from, to });
              opponentMoveResult = newGame.move({ from, to, promotion: 'q' });
            } else {
              // SAN format
              console.log('Playing SAN move:', opponentMove);
              opponentMoveResult = newGame.move(opponentMove, { sloppy: true });
            }
            
            if (opponentMoveResult) {
              playMoveSound(opponentMoveResult);
              newMoveIndex++;
              console.log('✅ Opponent move successful:', opponentMoveResult.san);
              console.log('Game state after opponent move:', newGame.fen());
            } else {
              console.error('❌ Failed to play opponent move - move returned null');
              console.error('Move details:', { opponentMove, gameFen: newGame.fen() });
            }
          } catch (opponentError) {
            console.error('❌ Error playing opponent move:', opponentError);
            console.error('Move details:', { opponentMove, gameFen: newGame.fen(), error: opponentError.message });
          }
        } else {
          console.log('No opponent move available - puzzle complete');
        }
        
        setGame(newGame);
        setMoveIndex(newMoveIndex);
        
        // Force a re-render to ensure the board updates
        setTimeout(() => {
          setGame(new Chess(newGame.fen()));
        }, 100);
        
        // Check if puzzle is complete
        if (newMoveIndex >= puzzle.moves.length) {
          console.log('🎉 Puzzle complete!');
          setPuzzleState('solved');
          setStatus('🎉 Puzzle solved! Well done! Click "Next Puzzle" to continue.');
          // CRITICAL: Lock orientation immediately when puzzle is solved to prevent flipping
          setOrientationLocked(true);
          console.log('🔒 Locked board orientation after puzzle completion to prevent flipping');
          // Update user rating - ensure it always changes
          if (puzzle.rating) {
            console.log('🔄 Calling updateUserRating with rating:', puzzle.rating);
            updateUserRating(puzzle.rating, true);
          } else {
            console.log('⚠️ No rating found in puzzle');
          }
          
          // Update daily progress for tactics
          updateDailyProgress(MODULE_NAMES.TACTICS);
          
          // Increment usage limit for free users when puzzle is solved
          if (user && user.userType !== 'premium' && !isReplay) {
            try {
              const token = localStorage.getItem('token');
              if (token) {
                fetch(getApiUrl('/usage-limits/puzzle-trainer/increment'), {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token
                  }
                }).catch(error => {
                  console.error('Error incrementing usage limit:', error);
                });
              }
            } catch (error) {
              console.error('Error incrementing usage limit:', error);
            }
          }
          
          // Add to puzzle history using the new tracking system
          const puzzleResult = savePuzzleResult({
            _id: puzzle._id || Date.now(),
            theme: theme,
            rating: puzzle.rating,
            moves: puzzle.moves,
            fen: puzzle.fen,
            description: puzzle.theme || 'Puzzle'
          }, true, PUZZLE_TYPES.REGULAR);
          
          setPuzzleHistory(prev => [puzzleResult, ...prev]);
          
          // CRITICAL: Do NOT auto-advance to next puzzle
          // User must click "Next Puzzle" button to load a new puzzle
        } else {
          console.log('Puzzle continues, next move index:', newMoveIndex);
          setStatus('Correct! Opponent responded.');
        }
        
        console.log('=== MOVE VALIDATION END (SUCCESS) ===');
        return true;
      } else {
        console.log('❌ Incorrect move. Expected:', expectedMove, 'Got:', isExpectedUCI ? actualMoveUCI : actualMoveSan);
        
        // Only record the first failure, not every wrong move (prevents duplicate marks)
        if (puzzleState !== 'failed') {
          setPuzzleState('failed');
          // CRITICAL: Lock orientation immediately when puzzle fails to prevent flipping
          setOrientationLocked(true);
          console.log('🔒 Locked board orientation after puzzle failure to prevent flipping');
          // Update user rating for failed attempt
          if (puzzle.rating) {
            console.log('🔄 Calling updateUserRating for failed attempt with rating:', puzzle.rating);
            updateUserRating(puzzle.rating, false);
          } else {
            console.log('⚠️ No rating found in puzzle for failed attempt');
          }
          
          // Add to puzzle history using the new tracking system (only once)
          const puzzleResult = savePuzzleResult({
            _id: puzzle._id || Date.now(),
            theme: theme,
            rating: puzzle.rating,
            moves: puzzle.moves,
            fen: puzzle.fen,
            description: puzzle.theme || 'Puzzle'
          }, false, PUZZLE_TYPES.REGULAR);
          
          setPuzzleHistory(prev => [puzzleResult, ...prev]);
        }
        
        setStatus('❌ Incorrect move. Try again or show solution.');
        
        console.log('=== MOVE VALIDATION END (FAILED) ===');
        return false;
      }
    } catch (error) {
      console.error('❌ Error making move:', error);
      setStatus('Error making move. Please try again.');
      console.log('=== MOVE VALIDATION END (ERROR) ===');
      return false;
    }
  }, [game, puzzle, moveIndex, puzzleState, updateUserRating, showSolution, user, isReplay]);

  const handleSquareClick = (square) => {
    console.log('🎯 SQUARE CLICKED:', square);
    console.log('�� Current state:', { 
      loading, 
      puzzleState, 
      game: !!game, 
      puzzle: !!puzzle,
      selectedSquare,
      gameTurn: game?.turn(),
      gameFen: game?.fen()
    });
    
    if (loading) {
      console.log('❌ Cannot make move - still loading');
      return;
    }
    
    if (puzzleState !== 'active') {
      console.log('❌ Cannot make move - puzzle state is:', puzzleState);
      return;
    }
    
    if (!game) {
      console.log('❌ Cannot make move - no game object');
      return;
    }
    
    if (!puzzle) {
      console.log('❌ Cannot make move - no puzzle object');
      return;
    }

    console.log('=== SQUARE CLICK ===');
    console.log('Square clicked:', square);
    console.log('Current turn:', game.turn());
    console.log('Current move index:', moveIndex);
    console.log('Puzzle state:', puzzleState);
    console.log('Selected square:', selectedSquare);

    if (!selectedSquare) {
      // First click - select the piece
      const piece = game.get(square);
      console.log('Piece on square:', piece);
      
      if (piece && piece.color === game.turn()) {
        // Check if this piece has any legal moves
        const legalMoves = game.moves({ square, verbose: true });
        console.log('Legal moves for piece:', legalMoves);
        
        if (legalMoves.length > 0) {
          console.log('✅ Selecting piece:', piece.type, 'on', square, 'with', legalMoves.length, 'legal moves');
          setSelectedSquare(square);
          setStatus('Piece selected. Click destination or drag to move.');
        } else {
          console.log('❌ Piece has no legal moves:', square);
          setStatus('This piece has no legal moves.');
        }
      } else {
        console.log('❌ Cannot select piece - wrong color or no piece');
        if (piece) {
          console.log('Piece color:', piece.color, 'Game turn:', game.turn());
          setStatus('Wrong color to move!');
        } else {
          setStatus('No piece on this square.');
        }
      }
    } else {
      // Second click - try to move the piece
      if (selectedSquare === square) {
        // Clicked the same square - deselect
        console.log('Deselecting square:', square);
        setSelectedSquare(null);
        setStatus('');
      } else {
        // Try to move from selectedSquare to square
        console.log('🎯 ATTEMPTING MOVE from', selectedSquare, 'to', square);
        const success = makeMove(selectedSquare, square);

        if (success) {
          console.log('✅ Move successful');
          setSelectedSquare(null);
        } else {
          console.log('❌ Move failed');
          const piece = game.get(square);
          if (piece && piece.color === game.turn()) {
            setSelectedSquare(square);
          } else {
            setSelectedSquare(null);
          }
        }
      }
    }
    console.log('=== SQUARE CLICK END ===');
  };

  const handleRightClickSquare = useCallback((square) => {
    setHighlightedSquares((prev) =>
      prev.includes(square)
        ? prev.filter((s) => s !== square)
        : [...prev, square]
    );
  }, []);

  const handlePieceDragBegin = useCallback((piece, sourceSquare) => {
    if (!game || puzzleState !== 'active') {
      return false;
    }

    const pieceOnSquare = game.get(sourceSquare);
    if (!pieceOnSquare || pieceOnSquare.color !== game.turn()) {
      setStatus('Wrong color to move!');
      return false;
    }

    setSelectedSquare(sourceSquare);
    return true;
  }, [game, puzzleState]);

  const handleNext = async () => {
    // Check usage limits for free users before loading next puzzle
    if (user && user.userType !== 'premium' && !isReplay) {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const response = await fetch(getApiUrl('/usage-limits/puzzle-trainer'), {
            headers: { 'x-auth-token': token }
          });
          
          if (response.ok) {
            const limitData = await response.json();
            if (!limitData.allowed) {
              setStatus(`You've reached your daily limit of 20 puzzles. Come back tomorrow or upgrade to premium for unlimited access!`);
              setShowLimitReached(true);
              setPuzzleLimitInfo({ used: limitData.limit, limit: limitData.limit });
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
    // Check if puzzleState is 'active' - if it's 'failed' or 'solved', rating was already handled
    if (puzzle && puzzleState === 'active' && !isReplay) {
      console.log('⚠️ Skipping incomplete puzzle - deducting rating as failed attempt');
      if (puzzle.rating) {
        await updateUserRating(puzzle.rating, false);
      } else {
        console.log('⚠️ No rating found in puzzle for skip');
      }
      
      // Save puzzle history as failed
      const puzzleResult = savePuzzleResult({
        _id: puzzle._id || Date.now(),
        theme: theme,
        rating: puzzle.rating,
        moves: puzzle.moves,
        fen: puzzle.fen,
        description: puzzle.theme || 'Puzzle'
      }, false, PUZZLE_TYPES.REGULAR);
      
      setPuzzleHistory(prev => [puzzleResult, ...prev]);
    } else if (puzzle && puzzleState !== 'active' && !isReplay) {
      console.log('ℹ️ Skipping puzzle but rating already handled (puzzleState:', puzzleState, ')');
    }
    
    // Mark this as a manual change
    setIsManualChange(true);
    
    // Reset skip counter when user manually requests next puzzle
    setSkipCounter(0);
    
    // Reset stats flags when manually loading next puzzle
    setStatsUpdated(false);
    setFailedUpdated(false);
    statsUpdatedRef.current = false;
    failedUpdatedRef.current = false;
    
    // Use cached puzzle if available for instant loading
    if (puzzleCache.length > 0) {
      const nextPuzzle = puzzleCache[0];
      setPuzzleCache(prev => prev.slice(1)); // Remove used puzzle from cache
      
      console.log('⚡ Using cached puzzle for instant loading');
      initializePuzzle({ puzzle: nextPuzzle }, true); // Skip validation for cached puzzles
      
      // ALWAYS preload more puzzles immediately after using cache
      // This ensures cache is never empty for next click
      setTimeout(() => preloadPuzzles(), 50);
    } else {
      // Fallback to regular fetch if no cache available
      console.log('📡 No cache available, fetching puzzle...');
      // Fetch and immediately preload more
      fetchPuzzle().then(() => {
        setTimeout(() => preloadPuzzles(), 100);
      });
    }
  };

  const handleRandomPuzzle = async () => {
    setLoading(true);
    setStatus('');
    try {
      const url = `${getApiUrl('/puzzles/random')}${theme ? `?theme=${encodeURIComponent(theme)}` : ''}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch random puzzle');
      const data = await response.json();
      if (data?.puzzles && data.puzzles.length > 0) {
        // Select a random puzzle from the returned puzzles
        const randomIndex = Math.floor(Math.random() * data.puzzles.length);
        const selectedPuzzle = data.puzzles[randomIndex];
        setPuzzle(selectedPuzzle);
        setMoveIndex(0);
        setGame(new Chess(selectedPuzzle.fen));
        setStatus('Random puzzle loaded!');
      } else if (data?.puzzle) {
        // Fallback for old format
        setPuzzle(data.puzzle);
        setMoveIndex(0);
        setGame(new Chess(data.puzzle.fen));
        setStatus('Random puzzle loaded!');
      } else {
        setStatus('Failed to load a valid random puzzle.');
      }
    } catch (err) {
      setStatus('Error loading random puzzle.');
    } finally {
      setLoading(false);
    }
  };

  // Function to open live analysis with opponent move played
  const handleOpenLiveAnalysis = () => {
    if (!puzzle || !puzzle.moves || puzzle.moves.length === 0) {
      console.error('No puzzle or moves available for live analysis');
      return;
    }

    // Create a new game from the original puzzle position
    const analysisGame = new Chess(puzzle.fen);
    
    // Play the first move (opponent's move) if it exists
    if (puzzle.moves.length > 0) {
      const opponentMove = puzzle.moves[0];
      console.log('🎯 Playing opponent move for analysis:', opponentMove);
      
      try {
        let result;
        if (opponentMove.length === 4 && /^[a-h][1-8][a-h][1-8]$/.test(opponentMove)) {
          // UCI format
          result = analysisGame.move({
            from: opponentMove.substring(0, 2),
            to: opponentMove.substring(2, 4),
            promotion: 'q'
          });
        } else {
          // SAN format
          result = analysisGame.move(opponentMove, { sloppy: true });
        }
        
        if (result) {
          console.log('✅ Opponent move played successfully:', result.san);
        } else {
          console.error('❌ Failed to play opponent move:', opponentMove);
        }
      } catch (error) {
        console.error('❌ Error playing opponent move:', error);
      }
    }
    
    // Get the position after opponent's move
    const positionAfterOpponentMove = analysisGame.fen();
    const sideToMove = analysisGame.turn();
    
    console.log('🎯 Position after opponent move:', positionAfterOpponentMove);
    console.log('🎯 Side to move:', sideToMove);
    
    // Create PGN with the opponent's move
    const pgn = `[Event "Puzzle Analysis"]
[Site "ChessRep"]
[Date "${new Date().toISOString().split('T')[0]}"]
[Round "1"]
[White "Puzzle"]
[Black "User"]
[Result "*"]

${puzzle.moves[0]} *`;
    
    // Open chess analysis board with the position after opponent's move and PGN
    const encodedFen = encodeURIComponent(positionAfterOpponentMove);
    const encodedPgn = encodeURIComponent(pgn);
    
    window.open(`/chess-analysis-board?fen=${encodedFen}&pgn=${encodedPgn}`, '_blank');
  };

  const handleShowSolution = async () => {
    // IMPORTANT: If user clicks Show Solution on an incomplete puzzle, deduct rating immediately
    // Treat showing solution exactly like a failed attempt
    if (puzzle && puzzleState === 'active' && !isReplay) {
      console.log('⚠️ Showing solution for incomplete puzzle - deducting rating as failed attempt');
      if (puzzle.rating) {
        await updateUserRating(puzzle.rating, false);
      } else {
        console.log('⚠️ No rating found in puzzle for show solution');
      }
      
      // Save puzzle history as failed
      const puzzleResult = savePuzzleResult({
        _id: puzzle._id || Date.now(),
        theme: theme,
        rating: puzzle.rating,
        moves: puzzle.moves,
        fen: puzzle.fen,
        description: puzzle.theme || 'Puzzle'
      }, false, PUZZLE_TYPES.REGULAR);
      
      setPuzzleHistory(prev => [puzzleResult, ...prev]);
      
      // Mark as failed so Next Puzzle won't deduct again
      setPuzzleState('failed');
    } else if (puzzleState !== 'failed') {
      // If already failed or solved, just mark as failed for UI state
      setPuzzleState('failed');
    }
    
    setShowSolution(true);
    setStatus('Showing solution...');
    
    // Lock the current orientation and keep it fixed during solution replay
    setOrientationLocked(true); // Lock orientation during solution replay
    console.log('🎯 Locked current orientation:', boardOrientation, 'and locked it');
    
    console.log('🎯 Starting solution replay...');
    console.log('🎯 Original puzzle FEN:', puzzle.fen);
    console.log('🎯 Puzzle moves:', puzzle.moves);
    
    // Use the correct moves array
    let movesToPlay = [];
    if (puzzle.moves && puzzle.moves.length > 0) {
      movesToPlay = puzzle.moves;
      console.log('🎯 Using puzzle.moves:', movesToPlay);
    } else if (puzzle.originalMoves && puzzle.originalMoves.length > 0) {
      movesToPlay = puzzle.originalMoves;
      console.log('🎯 Using puzzle.originalMoves:', movesToPlay);
    } else {
      console.log('🎯 No moves found in puzzle!');
      setStatus('No solution moves found!');
      return;
    }
    
    console.log('🎯 Playing', movesToPlay.length, 'moves...');
    
    // Reset the main game to the original puzzle position
    const newGame = new Chess(puzzle.fen);
    setGame(newGame);
    setMoveIndex(0);
    console.log('🎯 Reset main game to original puzzle FEN:', newGame.fen());
    console.log('🎯 Original side to move:', newGame.turn() === 'w' ? 'white' : 'black');
    
    // Wait a moment for the board to update
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Show each move with clear indication
    for (let i = 0; i < movesToPlay.length; i++) {
      const move = movesToPlay[i];
      const moveNumber = Math.floor(i / 2) + 1;
      const isWhiteMove = i % 2 === 0;
      
      setStatus(`Solution: Move ${moveNumber}${isWhiteMove ? '.' : '...'} ${move}`);
      console.log(`🎯 Playing move ${i + 1}/${movesToPlay.length}:`, move);
      console.log(`🎯 Current game FEN before move:`, newGame.fen());
      console.log(`🎯 Current turn before move:`, newGame.turn());
      
      try {
        let result;
        // Try both UCI and SAN formats
        if (move.length === 4 && /^[a-h][1-8][a-h][1-8]$/.test(move)) {
          // UCI format
          result = newGame.move({
            from: move.substring(0, 2),
            to: move.substring(2, 4),
            promotion: 'q'
          });
        } else {
          // SAN format
          result = newGame.move(move, { sloppy: true });
        }
        
        if (result) {
          console.log(`🎯 Move ${i + 1} successful:`, result.san);
          console.log(`🎯 Game FEN after move:`, newGame.fen());
          console.log(`🎯 Turn after move:`, newGame.turn());
          
          // Update the main game state to show the move on the board
          const updatedGame = new Chess(newGame.fen());
          setGame(updatedGame);
          setMoveIndex(i + 1);
          
          // Force a re-render by updating the game state again
          setTimeout(() => {
            setGame(new Chess(updatedGame.fen()));
          }, 50);
          
          // Wait longer between moves so user can follow
          await new Promise(resolve => setTimeout(resolve, 1000));
        } else {
          console.error(`🎯 Move ${i + 1} failed:`, move);
          setStatus(`Failed to play move: ${move}`);
          break;
        }
      } catch (error) {
        console.error(`🎯 Error playing move ${i + 1}:`, error);
        setStatus(`Error playing move: ${move}`);
        break;
      }
    }
    
    console.log('🎯 Solution replay completed successfully');
    setStatus('✅ Solution complete! Click "Next Puzzle" to continue.');
    
    // Unlock orientation after solution replay (keep current orientation)
    setOrientationLocked(false); // Unlock orientation after solution replay
  };

  // Fetch available themes from backend
  const fetchAvailableThemes = async () => {
    try {
      const response = await fetch(getApiUrl('/puzzles/themes'));
      if (response.ok) {
        const data = await response.json();
        const themes = ['', 'random', ...data.themes.map(theme => theme.code)]; // Add empty and random options
        setThemeOptions(themes);
        
        // Store theme labels for display
        const labels = {};
        data.themes.forEach(theme => {
          labels[theme.code] = theme.label || formatThemeName(theme.code);
        });
        setThemeLabels(labels);
      }
    } catch (err) {
      console.error('Error fetching themes:', err);
      // Keep the fallback themes
    }
  };

  useEffect(() => {
    // Check if we have a puzzle passed via navigation state (for random puzzles)
    if (location.state?.puzzle) {
      console.log('🎯 Random puzzle received via navigation state:', location.state.puzzle);
      setTheme('random');
      initializePuzzle({ puzzle: location.state.puzzle });
      fetchUserRating();
      // Start preloading after mount
      setTimeout(() => preloadPuzzles('random'), 1000);
    } else if (urlTheme) {
      // If URL already specifies a theme, set it and let the theme effect handle fetching once
      setTheme(urlTheme);
      fetchUserRating();
      setTimeout(() => preloadPuzzles(urlTheme), 1000);
    } else {
      // No theme in URL — fetch immediately once
      fetchPuzzle();
      fetchUserRating();
      setTimeout(() => preloadPuzzles(), 1000);
    }
    
    // Fetch available themes
    fetchAvailableThemes();
  }, []); // Run only once on mount

  // Initialize user rating from AuthContext
  useEffect(() => {
    if (user && user.rating) {
      setUserRating(user.rating);
      console.log('PuzzleSolvePage: User rating initialized from AuthContext:', user.rating);
    }
  }, [user]);

  // Reset statsUpdated when loading a new puzzle
  useEffect(() => {
    setStatsUpdated(false);
    setOrientationLocked(false); // Reset orientation lock when new puzzle loads
  }, [puzzle]);

  // Sync theme state with URL param on mount or when urlTheme changes
  React.useEffect(() => {
    if (typeof urlTheme === 'string' && urlTheme !== theme) {
      setTheme(urlTheme || '');
    }
  }, [urlTheme]);

  // Fetch new puzzle when theme changes (but NOT when puzzle is solved/failed)
  React.useEffect(() => {
    // Skip on initial mount - the mount effect handles initial fetching
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      if (theme && theme !== 'random') {
        prevThemeRef.current = theme;
      }
      return;
    }
    
    // Only fetch if theme actually changed, not when fetchPuzzle function is recreated
    // This prevents auto-reload when refreshUser() updates the user object (which recreates fetchPuzzle)
    if (theme && theme !== 'random' && theme !== prevThemeRef.current) {
      console.log('🎯 Theme changed to:', theme, '- fetching new puzzle');
      prevThemeRef.current = theme;
      if (fetchPuzzleRef.current) {
        fetchPuzzleRef.current();
      }
    }
  }, [theme]); // Removed fetchPuzzle from dependencies to prevent auto-reload when user updates

  // Handle responsive board sizing
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

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const detectTouch = () => {
      const hasMatchMedia = typeof window.matchMedia === 'function';
      const coarse = hasMatchMedia ? window.matchMedia('(pointer: coarse)').matches : false;
      return coarse || 'ontouchstart' in window;
    };

    setIsTouchDevice(detectTouch());

    let mediaQuery;
    const handleChange = () => setIsTouchDevice(detectTouch());

    if (typeof window.matchMedia === 'function') {
      mediaQuery = window.matchMedia('(pointer: coarse)');
      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', handleChange);
      } else if (mediaQuery.addListener) {
        mediaQuery.addListener(handleChange);
      }
    }

    return () => {
      if (mediaQuery) {
        if (mediaQuery.removeEventListener) {
          mediaQuery.removeEventListener('change', handleChange);
        } else if (mediaQuery.removeListener) {
          mediaQuery.removeListener(handleChange);
        }
      }
    };
  }, []);

  // Arrow drawing handlers
  const handleDrawArrow = useCallback((arrow) => {
    setDrawnArrows((prev) => [...prev, arrow]);
  }, []);
  const handleClearArrows = useCallback(() => {
    setDrawnArrows([]);
  }, []);

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
    highlightedSquares.forEach((sq) => {
      styles[sq] = { 
        backgroundColor: 'rgba(239, 68, 68, 0.6)',
        boxShadow: 'inset 0 0 0 2px rgba(239, 68, 68, 0.8)',
        borderRadius: '4px'
      };
    });
    return styles;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500 mx-auto mb-4"></div>
          <div className="text-xl text-white font-semibold">Loading puzzle...</div>
          <div className="text-gray-300 mt-2">
            {puzzleCache.length > 0 ? 'Preparing instant puzzle' : 'Fetching from server'}
          </div>
        </div>
      </div>
    );
  }

  if (showLimitReached) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4">
        <UpgradeBanner
          title="Daily Puzzle Limit Reached"
          message={`You've solved ${puzzleLimitInfo?.used || 20} puzzles today. Upgrade to Premium for unlimited puzzles, or try Puzzle Rush to keep practicing!`}
          showFullPage={true}
        />
        <div className="mt-8 text-center">
          <div className="bg-gray-800 rounded-lg p-6 mb-6">
            <h3 className="text-xl font-semibold text-white mb-4">Keep Practicing with Puzzle Rush!</h3>
            <p className="text-gray-300 mb-4">
              Puzzle Rush is a fast-paced training mode where you can solve as many puzzles as you want in a time-limited session.
            </p>
            <button
              onClick={() => navigate('/puzzle-rush')}
              className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-gray-900 font-bold py-3 px-6 rounded-lg text-lg transition-all transform hover:scale-105 shadow-lg"
            >
              Try Puzzle Rush →
            </button>
          </div>
          <div className="text-gray-400 text-sm">
            Your daily limit resets at midnight (UTC). You can solve {puzzleLimitInfo?.limit || 20} puzzles per day as a free user.
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="text-center text-red-600 text-lg font-semibold">{error}</div>
        <div className="mt-4 text-center">
          <button 
            onClick={() => {
              setError(null);
              setLoading(true);
              fetchPuzzle();
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
          Puzzle Trainer
        </h1>
        {theme && (
          <div className="mb-2">
            <p className="text-gray-300 font-medium">
              Theme: <span className="text-blue-400 font-semibold">{formatThemeName(theme)}</span>
            </p>
            {(themeExplanations[theme] || themeExplanations[theme.replace(/([A-Z])/g, '_$1').toLowerCase()]) && (
              <p className="text-gray-400 text-sm mt-1 max-w-2xl mx-auto">
                {themeExplanations[theme] || themeExplanations[theme.replace(/([A-Z])/g, '_$1').toLowerCase()]}
              </p>
            )}
          </div>
        )}
        {selectedDifficulty && (
          <p className="text-gray-300 font-medium">
            Difficulty: <span className="text-green-400 font-semibold">
              {selectedDifficulty === 'beginner' && '🟢 Beginner (800-1200)'}
              {selectedDifficulty === 'intermediate' && '🟡 Intermediate (1200-1800)'}
              {selectedDifficulty === 'advanced' && '🔴 Advanced (1800+)'}
            </span>
          </p>
        )}
      </div>
      <div className="mb-6 flex flex-col sm:flex-row justify-center gap-3">
        <div className="relative">
          <select
            value={theme}
            onChange={e => {
              let selected = e.target.value;
              if (selected === 'random') {
                // Pick a random theme (excluding '', 'random')
                const filtered = themeOptions.filter(t => t && t !== 'random');
                selected = filtered[Math.floor(Math.random() * filtered.length)];
              }
              setTheme(selected);
              // Update the URL
              if (selected) {
                navigate(`/puzzles/${selected}`);
              } else {
                navigate('/puzzles');
              }
            }}
            className="px-4 py-3 border-2 border-gray-300 rounded-xl text-sm bg-white shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 appearance-none cursor-pointer min-w-[200px]"
          >
            <option value="">🎯 All Themes</option>
            <option value="random">🎲 Random Theme</option>
            {themeOptions.filter(t => t && t !== 'random').map(t => (
              <option key={t} value={t}>{formatThemeName(t)}</option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
        <div className="relative">
          <select
            value={selectedDifficulty}
            onChange={e => {
              setSelectedDifficulty(e.target.value);
              // Trigger new puzzle fetch immediately when difficulty changes
              setTimeout(() => {
                if (fetchPuzzleRef.current) {
                  fetchPuzzleRef.current();
                }
              }, 100);
            }}
            className="px-4 py-3 border-2 border-gray-300 rounded-xl text-sm bg-white shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 appearance-none cursor-pointer min-w-[180px]"
          >
            <option value="">📊 All Difficulties</option>
            <option value="beginner">🟢 Beginner (800-1200)</option>
            <option value="intermediate">🟡 Intermediate (1200-1800)</option>
            <option value="advanced">🔴 Advanced (1800+)</option>
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>
      {/* Board Size Slider - Visible on mobile and desktop */}
      <div className="mb-2 flex items-center justify-center gap-2">
        <label htmlFor="board-size" className="text-xs">Board Size:</label>
        <input
          id="board-size"
          type="range"
          min={300}
          max={1000}
          value={boardSize}
          onChange={e => {
            setUserAdjustedBoardSize(true);
            setBoardSize(Number(e.target.value));
          }}
          className="w-32"
        />
        <span className="text-xs w-8 text-right">{boardSize}px</span>
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        {/* Chessboard - Primary focus */}
        <div className="order-1 xl:order-2 xl:col-span-3">
          <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl shadow-2xl border border-gray-200 p-6 sm:p-8" style={{ pointerEvents: 'auto' }}>
            <div className="flex flex-col items-center" style={{ pointerEvents: 'auto' }}>
              {/* Enhanced turn indicator */}
              <div className={`mb-4 px-6 py-3 rounded-xl font-bold text-base sm:text-lg shadow-lg transform transition-all duration-300 ${getTurnIndicatorStyle()}`}>
                {getTurnIndicator()}
              </div>
              {isTouchDevice && (
                <div className="mb-4 text-xs sm:text-sm text-gray-600 text-center">
                  Tap a piece, then tap its destination square (or drag the piece) to make a move.
                </div>
              )}
              <div className="relative w-full flex justify-center" style={{ pointerEvents: 'auto', overflow: 'visible' }}>
                <div className="w-full max-w-full bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-4 shadow-inner border border-amber-200" style={{ pointerEvents: 'auto', overflow: 'visible' }}>
                  <div className="bg-gradient-to-br from-amber-100 to-orange-100 rounded-xl p-2 shadow-lg flex justify-center items-center" style={{ pointerEvents: 'auto', overflow: 'visible' }}>
                    <div
                      ref={boardContainerRef}
                      className="mx-auto"
                      style={{ 
                        width: `${computedBoardWidth}px`,
                        height: `${computedBoardWidth}px`,
                        maxWidth: '100%',
                        maxHeight: '100%',
                        minWidth: 0,
                        minHeight: 0,
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        pointerEvents: 'auto',
                        overflow: 'hidden',
                        ...TOUCH_BOARD_STYLE 
                      }}
                    >
                      <Chessboard
                        key={`board-${computedBoardWidth}-${boardOrientation}-${puzzle?._id || ''}`}
                        ref={boardRef}
                        position={game?.fen() || puzzle?.fen || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'}
                        onPieceDragBegin={handlePieceDragBegin}
                        onPieceDrop={showSolution || puzzleState !== 'active' ? undefined : (sourceSquare, targetSquare) => {
                          const success = makeMove(sourceSquare, targetSquare);
                          if (success) {
                            setSelectedSquare(null);
                          }
                          return success;
                        }}
                        customPieceStyle={{
                          cursor: 'grab',
                          touchAction: 'none'
                        }}
                        customDragPieceStyle={{
                          cursor: 'grabbing',
                          touchAction: 'none'
                        }}
                        onSquareClick={showSolution || puzzleState !== 'active' ? undefined : handleSquareClick}
                        onRightClickSquare={(square) => {
                          setHighlightedSquares(prev => 
                            prev.includes(square) 
                              ? prev.filter(s => s !== square)
                              : [...prev, square]
                          );
                        }}
                        customSquareStyles={getCustomSquareStyles()}
                        boardWidth={computedBoardWidth}
                        arePiecesDraggable={!showSolution && puzzleState === 'active'}
                        customBoardStyle={{
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                          width: `${computedBoardWidth}px`,
                          height: `${computedBoardWidth}px`,
                          maxWidth: '100%',
                          maxHeight: '100%',
                          touchAction: isTouchDevice ? 'none' : 'manipulation',
                          userSelect: 'none',
                          WebkitUserSelect: 'none',
                          MozUserSelect: 'none',
                          msUserSelect: 'none',
                          WebkitTouchCallout: 'none',
                          WebkitTapHighlightColor: 'transparent',
                          cursor: 'pointer',
                          pointerEvents: 'auto',
                          position: 'relative',
                          zIndex: 1
                        }}
                        customArrows={getAllArrows()}
                        areArrowsAllowed={true}
                        boardOrientation={boardOrientation}
                        animationDuration={200}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Recent History - Under the main board */}
          <div className="mt-6 space-y-4">
            {/* Recent Solved History - Show puzzles from last 24 hours */}
            {(() => {
              const recent24hPuzzles = getRecentPuzzles(PUZZLE_TYPES.REGULAR, 24);
              return recent24hPuzzles.length > 0 && (
                <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-xl border border-gray-200 p-4 sm:p-6">
                  <h3 className="text-lg font-bold mb-4 text-gray-800 flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                    Recent Solved (24h)
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {recent24hPuzzles.slice(0, 10).map((puzzle, index) => (
                    <div
                      key={puzzle.id || index}
                      className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg p-3 cursor-pointer hover:scale-105 transition-transform duration-200 border border-gray-300"
                      onClick={() => {
                        // Load this puzzle as a replay (don't track stats)
                        console.log('🔄 Loading puzzle from history as replay:', puzzle.id);
                        initializePuzzle({
                          puzzle: {
                            _id: puzzle.id,
                            fen: puzzle.fen,
                            moves: puzzle.moves,
                            rating: puzzle.rating,
                            theme: puzzle.theme
                          }
                        });
                        // Mark this as a replay so stats aren't tracked
                        setIsReplay(true);
                      }}
                    >
                      <div className="text-center">
                        <div className="text-2xl mb-1">
                          {puzzle.solved ? '✅' : '❌'}
                        </div>
                        <div className="text-xs font-semibold text-gray-700 truncate">
                          {puzzle.theme || 'Puzzle'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {puzzle.rating || 'N/A'}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          {new Date(puzzle.timestamp).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        {/* Rating */}
        <div className="order-2 xl:order-1 xl:col-span-1 space-y-4">
          {/* User Rating Display */}
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-xl border border-gray-200 p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-bold mb-4 text-gray-800 flex items-center">
              <div className="w-2 h-2 bg-yellow-500 rounded-full mr-3"></div>
              Your Rating
            </h2>
            {userRating ? (
              <div className="text-center">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-6 shadow-lg">
                  <p className="text-2xl sm:text-3xl font-bold text-white mb-2">{userRating}</p>
                  <p className="text-blue-100 text-sm">Current Rating</p>
                </div>
                {showRatingChange && ratingChange !== null && (
                  <div className={`mt-4 p-3 rounded-xl text-center font-bold text-sm shadow-lg transform transition-all duration-300 ${
                    ratingChange > 0 
                      ? 'bg-gradient-to-r from-green-500 to-green-600 text-white' 
                      : 'bg-gradient-to-r from-red-500 to-red-600 text-white'
                  }`}>
                    {ratingChange > 0 ? '+' : ''}{ratingChange}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center p-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                <p className="text-gray-500 text-sm">Loading rating...</p>
              </div>
            )}
          </div>

        </div>

        {/* Controls and Info - Takes up less space */}
        <div className="order-3 xl:order-3 xl:col-span-1 space-y-4">
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-xl border border-gray-200 p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-800 flex items-center">
                <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                Controls
              </h2>
              <DropdownMenu
                options={[
                  {
                    label: "Edit",
                    onClick: () => console.log("Edit"),
                    Icon: <Pencil className="h-4 w-4" />,
                  },
                  {
                    label: "Duplicate",
                    onClick: () => console.log("Duplicate"),
                    Icon: <Copy className="h-4 w-4" />,
                  },
                  {
                    label: "Delete",
                    onClick: () => console.log("Delete"),
                    Icon: <Trash className="h-4 w-4" />,
                  },
                ]}
                align="end"
              >
                <MoreVertical className="h-5 w-5 text-gray-600 hover:text-gray-800 transition-colors" />
              </DropdownMenu>
            </div>
            <div className="grid grid-cols-1 gap-3">
              <button
                className={`bg-gradient-to-r font-semibold py-2 sm:py-3 px-3 sm:px-4 rounded-xl text-sm shadow-lg transform transition-all duration-200 hover:scale-105 hover:shadow-xl ${
                  puzzleState === 'solved' 
                    ? 'from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white animate-pulse' 
                    : puzzleCache.length > 0 
                    ? 'from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white' 
                    : 'from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white'
                }`}
                onClick={handleNext}
              >
                {puzzleState === 'solved' 
                  ? '🎉 Next Puzzle (Solved!)' 
                  : puzzleCache.length > 0 
                  ? '⚡ Next Puzzle (Instant)' 
                  : 'Next Puzzle'}
              </button>
              <button
                className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold py-2 sm:py-3 px-3 sm:px-4 rounded-xl text-sm shadow-lg transform transition-all duration-200 hover:scale-105 hover:shadow-xl"
                onClick={handleRandomPuzzle}
              >
                Random Puzzle
              </button>
              <button
                className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-2 sm:py-3 px-3 sm:px-4 rounded-xl text-sm shadow-lg transform transition-all duration-200 hover:scale-105 hover:shadow-xl"
                onClick={handleShowSolution}
              >
                Show Solution
              </button>
              {puzzle && puzzleState !== 'active' && (
                <button
                  className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold py-3 px-6 rounded-lg shadow-lg transform transition-all duration-200 hover:scale-105 w-full"
                  onClick={() => {
                    // Calculate the position after opponent's first move (where user needs to solve)
                    const analysisGame = new Chess(puzzle.fen);
                    if (puzzle.moves && puzzle.moves.length > 0) {
                      const firstMove = puzzle.moves[0];
                      try {
                        if (firstMove.length === 4 && /^[a-h][1-8][a-h][1-8]$/.test(firstMove)) {
                          // UCI format
                          analysisGame.move({ 
                            from: firstMove.substring(0, 2), 
                            to: firstMove.substring(2, 4), 
                            promotion: 'q' 
                          });
                        } else {
                          // SAN format
                          analysisGame.move(firstMove, { sloppy: true });
                        }
                      } catch (error) {
                        console.warn('Could not execute opponent move for analysis:', error);
                      }
                    }
                    const positionAfterOpponentMove = analysisGame.fen();
                    const sideToMove = analysisGame.turn();
                    const color = sideToMove === 'w' ? 'white' : 'black';
                    const encodedFen = encodeURIComponent(positionAfterOpponentMove);
                    
                    console.log('🔍 Opening analysis with FEN (after opponent move):', positionAfterOpponentMove);
                    console.log('🔍 Side to move:', color);
                    
                    window.open(`/analysis?fen=${encodedFen}&color=${color}`, '_blank');
                  }}
                >
                  🔍 Analyze Position
                </button>
              )}
            </div>
          </div>

          {puzzle && (
            <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-xl border border-gray-200 p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-bold mb-4 text-gray-800 flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                Puzzle Info
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                  <span className="font-semibold text-green-800">Theme:</span>
                  <span className="text-green-700 truncate max-w-[120px]">{formatThemeName(puzzle.theme)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
                  <span className="font-semibold text-blue-800">Rating:</span>
                  <span className="text-blue-700 font-bold">{puzzle.rating || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gradient-to-r from-purple-50 to-violet-50 rounded-lg border border-purple-200">
                  <span className="font-semibold text-purple-800">Move:</span>
                  <span className="text-purple-700 font-bold">{moveIndex + 1} / {puzzle.moves.length}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* No puzzles message */}
      {(() => {
        const recentPuzzles = getRecentPuzzles(PUZZLE_TYPES.REGULAR, 24);
        const allPuzzles = getRecentPuzzles(PUZZLE_TYPES.REGULAR, 24 * 7);
        const hasAnyPuzzles = recentPuzzles.length > 0 || allPuzzles.length > 0;
        
        return !hasAnyPuzzles && (
          <div className="mt-8 bg-gradient-to-br from-slate-800/50 to-blue-900/30 backdrop-blur-sm border border-blue-500/20 rounded-2xl p-6">
            <div className="text-center text-gray-400 py-8">
              <div className="text-4xl mb-4">🧩</div>
              <h3 className="text-lg font-semibold mb-2">No puzzles solved yet</h3>
              <p className="text-sm">Start solving tactical puzzles to see them here!</p>
            </div>
          </div>
        );
      })()}

      {/* Analysis Board - Under main board */}
      {showAnalysis && puzzle && (
        <div className="mt-8 bg-gradient-to-br from-slate-800/50 to-blue-900/30 backdrop-blur-sm border border-blue-500/20 rounded-2xl p-6">
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
              <div
                style={{ ...TOUCH_BOARD_STYLE }}
              >
                <Chessboard
                position={puzzle.fen}
                boardWidth={400}
                customBoardStyle={{
                  ...TOUCH_BOARD_STYLE,
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  WebkitTouchCallout: 'none', // Disable iOS callout
                  WebkitTapHighlightColor: 'transparent', // Remove tap highlight
                  cursor: 'pointer' // Ensure cursor shows interaction
                }}
              />
              </div>
            </div>
            
            {/* Analysis Info */}
            <div className="space-y-4">
              <div className="bg-slate-700/50 rounded-lg p-4">
                <h4 className="font-semibold text-white mb-2">Puzzle Details</h4>
                <div className="space-y-2 text-sm">
                  <div><span className="text-gray-400">Rating:</span> {puzzle.rating}</div>
                  <div><span className="text-gray-400">Theme:</span> {puzzle.theme}</div>
                  <div><span className="text-gray-400">Moves:</span> {puzzle.moves?.length || 0}</div>
                </div>
              </div>
              
              <div className="bg-slate-700/50 rounded-lg p-4">
                <h4 className="font-semibold text-white mb-2">Solution</h4>
                <div className="space-y-1">
                  {puzzle.moves?.map((move, index) => (
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
                    puzzle: {
                      _id: puzzle._id,
                      fen: puzzle.fen,
                      moves: puzzle.moves,
                      rating: puzzle.rating,
                      theme: puzzle.theme
                    }
                  });
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                Play This Puzzle
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PuzzleSolvePage;



