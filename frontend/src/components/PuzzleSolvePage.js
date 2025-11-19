import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Volume2, VolumeX, RotateCcw, Eye, ArrowRight, Trophy, Zap } from 'lucide-react';
import OpenInLiveAnalysisButton from './OpenInLiveAnalysisButton';

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
  const [playerColor, setPlayerColor] = useState('white');
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
  const [failedUpdated, setFailedUpdated] = useState(false); // Track if failed puzzle stats have been updated
  const failedUpdatedRef = useRef(false); // Use ref for synchronous tracking to prevent race conditions
  const statsUpdatedRef = useRef(false); // Use ref for synchronous tracking to prevent race conditions
  const [boardSize, setBoardSize] = useState(600);
  const [selectedDifficulty, setSelectedDifficulty] = useState('intermediate');
  const [theme, setTheme] = useState(''); // Assuming theme is passed as a param or state
  const [highlightedSquares, setHighlightedSquares] = useState([]); // For right-click red highlight
  
  // Puzzle caching for instant loading
  const [puzzleCache, setPuzzleCache] = useState([]);
  const [isPreloading, setIsPreloading] = useState(false);
  const [skipCounter, setSkipCounter] = useState(0); // Prevent infinite loops
  const [isManualChange, setIsManualChange] = useState(false); // Track manual puzzle changes
  const [isInitialized, setIsInitialized] = useState(false); // Prevent multiple initializations
  
  // Solution replay state
  const [solutionPosition, setSolutionPosition] = useState(null);
  
  // Puzzle history
  const [puzzleHistory, setPuzzleHistory] = useState([]);
  const [showAnalysis, setShowAnalysis] = useState(false);

  // Audio refs
  const moveSoundRef = useRef(null);
  const captureSoundRef = useRef(null);
  const castleSoundRef = useRef(null);
  
  // Board ref for direct control during solution replay
  const boardRef = useRef(null);
  
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

  const themeOptions = [
    '', // All themes
    'random', // Add random theme option
    'fork',
    'pin',
    'skewer',
    'discovered_attack',
    'back_rank_mate',
    'deflection',
    'mate_in_1',
    'mate_in_2',
    'endgame',
    'tactic',
    'attack',
    'sacrifice',
    'double_check',
    'removal_of_defender',
    'interference',
    'overloading',
    'decoy',
    'clearance',
    'blocking',
    'x_ray',
    'zwischenzug',
    'windmill',
    'smothered_mate',
    'anastasias_mate',
    'arabian_mate',
    'bodens_mate',
    'opera_mate',
    'swiss_mate',
    'epaulette_mate',
    'dovetail_mate',
    'cozios_mate',
    'grecos_mate',
    'lollis_mate',
    'blackburnes_mate',
    'damianos_mate',
    'pillsburys_mate',
    'retis_mate',
    'legals_mate',
    'scholars_mate',
    'fools_mate',
    'suffocation_mate',
    'triangle_mate',
    'corridor_mate',
    'h_file_mate',
    'g_file_mate',
    'f_file_mate',
    'e_file_mate',
    'd_file_mate',
    'c_file_mate',
    'b_file_mate',
    'a_file_mate',
    '7th_rank_mate',
    '6th_rank_mate',
    '5th_rank_mate',
    '4th_rank_mate',
    '3rd_rank_mate',
    '2nd_rank_mate',
    '1st_rank_mate',
    '8th_rank_mate',
  ];

  const { theme: urlTheme } = useParams();
  const navigate = useNavigate();

  // Preload puzzles for instant "Next Puzzle" experience
  const preloadPuzzles = useCallback(async (currentTheme = urlTheme || theme, count = 5) => {
    if (isPreloading) return;
    
    setIsPreloading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { 'x-auth-token': token } : {};
      
      const themeToUse = currentTheme;
      const url = `http://localhost:3001/api/puzzles/random${themeToUse ? `?theme=${encodeURIComponent(themeToUse)}&count=${count}` : `?count=${count}`}`;
      
      console.log('🔄 Preloading puzzles from:', url);
      
      const response = await axios.get(url, { 
        headers,
        timeout: 10000
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
      
      // Set board orientation so the player whose turn it is has pieces at the bottom
      const userColor = newGame.turn() === 'w' ? 'white' : 'black';
      setPlayerColor(userColor);
      setBoardOrientation(userColor);
      console.log('🎯 Board orientation set to player color:', userColor, 'userMoveIndex:', userMoveIndex);
      
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
    console.log('🔄 FETCHING NEW PUZZLE - Manual change:', isManualChange);
    setLoading(true);
    setError(null);
    setSkipCounter(0); // Reset skip counter on new fetch
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { 'x-auth-token': token } : {};
      
      // Use state theme first, then URL theme as fallback
      const themeToUse = theme || urlTheme;
      let url = `http://localhost:3001/api/puzzles/random`;
      const params = new URLSearchParams();
      if (themeToUse) params.append('theme', themeToUse);
      if (selectedDifficulty) params.append('difficulty', selectedDifficulty);
      params.append('count', '5');
      if (params.toString()) url += `?${params.toString()}`;
      
      console.log('🌐 Fetching puzzles from:', url);
      console.log('🎯 Theme requested:', themeToUse);
      
      const response = await axios.get(url, { 
        headers,
        timeout: 8000 // 8 second timeout
      });
      
      const puzzleData = response.data;
      console.log('📦 Received puzzle data:', puzzleData);
      
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
      
      if (err.code === 'ECONNABORTED') {
        setError('Request timed out. Please try again.');
      } else if (err.response?.status === 404) {
        setError(`No puzzles found for the selected theme.`);
      } else {
        setError('Failed to fetch puzzle. Please check your connection and try again.');
      }
    } finally {
      setLoading(false);
    }
  }, [urlTheme, theme, selectedDifficulty, initializePuzzle]);
fetchPuzzleRef.current = fetchPuzzle;

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
      
      const response = await axios.get('http://localhost:3001/api/auth/me', {
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
  const updateUserRating = async (puzzleRating, success) => {
    try {
      console.log('🔄 Updating user rating:', { puzzleRating, success });
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('❌ No auth token found');
        return;
      }

      console.log('📡 Sending rating update to backend...');
      const response = await fetch('http://localhost:3001/api/puzzles/stats/puzzle', {
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
        console.log('📡 Rating update response:', data);
        if (data.ratingChange !== undefined) {
          // Ensure rating always changes - if it's 0, make it at least ±1
          let ratingChange = data.ratingChange;
          if (ratingChange === 0) {
            ratingChange = success ? 1 : -1;
            console.log('⚠️ Rating change was 0, forcing to:', ratingChange);
          }
          // Only show rating in feedback when puzzle is solved successfully
          if (success) {
            const changeText = ratingChange > 0 ? `+${ratingChange}` : `${ratingChange}`;
            setStatus(prev => {
              // Remove any existing rating text and add new one
              const cleaned = prev.replace(/Rating:.*$/, '').trim();
              return cleaned ? `${cleaned} Rating: ${changeText}` : `Rating: ${changeText}`;
            });
          }
          setRatingChange(ratingChange);
          setShowRatingChange(true);
        }
        // Refresh user data to get updated rating from database
        if (refreshUser) {
          await refreshUser();
        }
      } else {
        console.error('❌ Rating update failed:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('❌ Error updating rating:', error);
    }
  };

  // Function to update puzzle stats (DEPRECATED - using updateUserRating instead)
  const updatePuzzleStats = useCallback(async (solved) => {
    console.log('🔄 updatePuzzleStats called with solved:', solved);
    console.log('🔄 Current state - statsUpdated:', statsUpdatedRef.current, 'failedUpdated:', failedUpdatedRef.current);
    console.log('🔄 Puzzle data:', { 
      hasPuzzle: !!puzzle, 
      puzzleRating: puzzle?.rating, 
      puzzleId: puzzle?._id || puzzle?.id,
      puzzleTheme: puzzle?.theme 
    });
    
    // CRITICAL: For failed puzzles, we need to ensure rating is ALWAYS updated
    // The ref check should only prevent duplicate calls, not prevent the initial call
    // Check if this is a duplicate call (already processed)
    if (solved && statsUpdatedRef.current) {
      console.log('⚠️ Stats already updated for solved puzzle, skipping duplicate...');
      return;
    }
    
    if (!solved && failedUpdatedRef.current) {
      console.log('⚠️ Stats already updated for failed puzzle, skipping duplicate...');
      return;
    }
    
    // Mark as updating IMMEDIATELY using ref to prevent race conditions
    // This ensures that any subsequent calls will see the updated flag
    if (solved) {
      statsUpdatedRef.current = true;
      setStatsUpdated(true);
    } else {
      // For failed puzzles, mark as updating but don't skip the actual update
      failedUpdatedRef.current = true;
      setFailedUpdated(true);
      console.log('🚨 Marked failedUpdatedRef as true - rating update will proceed');
    }
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('❌ No token found, skipping rating update');
        // Reset the flag if update fails
        if (solved) {
          statsUpdatedRef.current = false;
          setStatsUpdated(false);
        } else {
          failedUpdatedRef.current = false;
          setFailedUpdated(false);
        }
        return;
      }
      // Always send a valid puzzleRating number
      // CRITICAL: Ensure puzzleRating is always a valid number for proper rating calculation
      let ratingToSend = 1200; // Default fallback
      if (puzzle?.rating) {
        if (typeof puzzle.rating === 'number' && !isNaN(puzzle.rating) && puzzle.rating > 0) {
          ratingToSend = puzzle.rating;
        } else if (typeof puzzle.rating === 'string') {
          const parsed = parseInt(puzzle.rating);
          if (!isNaN(parsed) && parsed > 0) {
            ratingToSend = parsed;
          }
        }
      }
      
      // CRITICAL: Ensure solved is a boolean, not a string
      const solvedBoolean = solved === true || solved === 'true' || solved === 1;
      
      console.log('📊 Preparing to send rating update:', {
        solved: solvedBoolean,
        solvedType: typeof solvedBoolean,
        puzzleRating: ratingToSend,
        currentUserRating: userRating,
        puzzleId: puzzle?._id || puzzle?.id,
        originalPuzzleRating: puzzle?.rating
      });
      
      const requestBody = {
        solved: solvedBoolean,
        puzzleRating: ratingToSend
      };
      console.log('📤 Sending POST request to /api/puzzles/stats/puzzle:', requestBody);
      
      const response = await axios.post('http://localhost:3001/api/puzzles/stats/puzzle', requestBody, {
        headers: { 'x-auth-token': token }
      });
      
      console.log('📥 Received response:', {
        status: response.status,
        data: response.data,
        newRating: response.data?.newRating,
        ratingChange: response.data?.ratingChange
      });
      
      // Update user rating and show rating change
      if (response.data && response.data.newRating !== undefined) {
        const change = response.data.ratingChange || 0;
        const newRating = response.data.newRating;
        
        console.log('✅ Rating update successful:', {
          oldRating: userRating,
          newRating: newRating,
          change: change,
          solved: solved,
          expectedDecrease: !solved && change < 0 ? 'YES' : !solved && change >= 0 ? 'NO - ERROR!' : 'N/A'
        });
        
        // CRITICAL: Verify that failed puzzles result in rating decrease
        if (!solved && change >= 0) {
          console.error('🚨 CRITICAL ERROR: Rating did not decrease for failed puzzle!', {
            oldRating: userRating,
            newRating: newRating,
            change: change,
            puzzleRating: ratingToSend
          });
        }
        
        setUserRating(newRating);
        setRatingChange(change);
        setShowRatingChange(true);
        
        // Refresh user data in auth context to update localStorage
        try {
          const refreshedUser = await refreshUser();
          console.log('🔄 User refreshed after rating update:', refreshedUser);
        } catch (refreshError) {
          console.error('⚠️ Error refreshing user:', refreshError);
        }
      } else {
        console.error('❌ Invalid response data - missing newRating:', response.data);
        // Reset the flag if update fails so it can be retried
        if (solved) {
          statsUpdatedRef.current = false;
          setStatsUpdated(false);
        } else {
          failedUpdatedRef.current = false;
          setFailedUpdated(false);
          console.log('🔄 Reset failedUpdatedRef due to invalid response - rating update can be retried');
        }
      }
    } catch (error) {
      console.error('❌ ERROR updating puzzle stats:', error);
      console.error('❌ Error message:', error.message);
      console.error('❌ Error response:', error.response?.data);
      console.error('❌ Error status:', error.response?.status);
      console.error('❌ Error stack:', error.stack);
      
      // Reset the flag if update fails so it can be retried
      if (solved) {
        statsUpdatedRef.current = false;
        setStatsUpdated(false);
      } else {
        failedUpdatedRef.current = false;
        setFailedUpdated(false);
        console.log('🔄 Reset failedUpdatedRef due to error - rating update can be retried');
      }
    }
  }, [puzzle, refreshUser, userRating]);

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
      // Handle both UCI format (e.g., "a3c3") and SAN format (e.g., "Qc3")
      const actualMoveSan = move.san;
      const actualMoveUCI = move.from + move.to;
      
      // Check if expected move is in UCI format (4 characters, all lowercase letters/numbers)
      const isExpectedUCI = expectedMove.length === 4 && /^[a-h][1-8][a-h][1-8]$/.test(expectedMove);
      
      let isCorrectMove = false;
      if (isExpectedUCI) {
        // Compare UCI format
        isCorrectMove = actualMoveUCI === expectedMove;
        console.log('UCI comparison:', { actual: actualMoveUCI, expected: expectedMove, isCorrect: isCorrectMove });
      } else {
        // Compare SAN format
        isCorrectMove = actualMoveSan === expectedMove;
        console.log('SAN comparison:', { actual: actualMoveSan, expected: expectedMove, isCorrect: isCorrectMove });
      }
      
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
          console.log('🎯 Current puzzle rating:', puzzle.rating);
          setPuzzleState('solved');
          setStatus('🎉 Puzzle solved! Well done! Click "Next Puzzle" to continue.');
          
          // Update user rating - ensure it always changes
          if (puzzle.rating) {
            console.log('🔄 Calling updateUserRating with rating:', puzzle.rating);
            updateUserRating(puzzle.rating, true);
          } else {
            console.log('⚠️ No rating found in puzzle');
          }
          
          // Add to puzzle history
          const puzzleResult = {
            id: puzzle._id || Date.now(),
            theme: theme,
            rating: puzzle.rating,
            solved: true,
            moves: puzzle.moves,
            fen: puzzle.fen,
            description: puzzle.theme || 'Puzzle',
            timestamp: new Date().toISOString()
          };
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
        console.log('❌ Incorrect move - Puzzle failed!');
        console.log('🎯 Current puzzle rating:', puzzle.rating);
        setPuzzleState('failed');
        setStatus('❌ Incorrect move. Try again or show solution.');
        
        // Update user rating for failed attempt
        if (puzzle.rating) {
          console.log('🔄 Calling updateUserRating for failed attempt with rating:', puzzle.rating);
          updateUserRating(puzzle.rating, false);
        } else {
          console.log('⚠️ No rating found in puzzle for failed attempt');
        }
        
        // Add to puzzle history
        const puzzleResult = {
          id: puzzle._id || Date.now(),
          theme: theme,
          rating: puzzle.rating,
          solved: false,
          moves: puzzle.moves,
          fen: puzzle.fen,
          description: puzzle.theme || 'Puzzle',
          timestamp: new Date().toISOString()
        };
        setPuzzleHistory(prev => [puzzleResult, ...prev]);
        
        console.log('=== MOVE VALIDATION END (FAILED) ===');
        return false;
      }
    } catch (error) {
      console.error('❌ Error making move:', error);
      setStatus('Error making move. Please try again.');
      console.log('=== MOVE VALIDATION END (ERROR) ===');
      return false;
    }
  }, [game, puzzle, moveIndex, puzzleState, updatePuzzleStats, showSolution]);

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
        setSelectedSquare(null);
        
        if (success) {
          console.log('✅ Move successful');
        } else {
          console.log('❌ Move failed');
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

  const handleNext = () => {
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
      
      // Preload more puzzles in the background if cache is getting low
      if (puzzleCache.length <= 2) {
        setTimeout(() => preloadPuzzles(), 100);
      }
    } else {
      // Fallback to regular fetch if no cache available
      console.log('📡 No cache available, fetching puzzle...');
      fetchPuzzle();
    }
  };

  const handleRandomPuzzle = async () => {
    setLoading(true);
    setStatus('');
    try {
      const url = `http://localhost:3001/api/puzzles/random${theme ? `?theme=${encodeURIComponent(theme)}` : ''}`;
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


  const handleShowSolution = () => {
    if (!puzzle) return;
    
    setShowSolution(true);
    setPuzzleState('failed');
    setStatus('Showing solution...');
    
    // Update user rating for using solution (counts as failure)
    if (puzzle.rating) {
      console.log('🔄 Calling updateUserRating for show solution with rating:', puzzle.rating);
      updateUserRating(puzzle.rating, false);
    }
    
    // Play through the complete solution step by step
    const playSolution = async () => {
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
      
      // Create a solution game that we'll update WITHOUT changing React state
      const solutionGame = new Chess(puzzle.fen);
      console.log('🎯 Reset to original puzzle FEN:', solutionGame.fen());
      console.log('🎯 Original side to move:', solutionGame.turn() === 'w' ? 'white' : 'black');
      
      // DO NOT CHANGE ORIENTATION - keep the current board orientation
      // This prevents any board flipping when showing solution
      console.log('🎯 Keeping current orientation:', boardOrientation);
      
      // Set the board to the original position
      setSolutionPosition(solutionGame.fen());
      
      // Set board orientation so the player whose turn it is has pieces at the bottom
      setBoardOrientation(playerColor);
      
      // Wait a moment for the board to update
      await new Promise(resolve => setTimeout(resolve, 500));
      
      for (let i = 0; i < movesToPlay.length; i++) {
        const move = movesToPlay[i];
        console.log(`🎯 Playing move ${i + 1}/${movesToPlay.length}:`, move);
        
        try {
          const result = solutionGame.move(move);
          if (result) {
            console.log(`🎯 Move ${i + 1} successful:`, result.san);
            
            // Update the board position ONLY - do not change orientation
            setSolutionPosition(solutionGame.fen());
            
            console.log(`🎯 After move ${i + 1}:`, solutionGame.fen());
            console.log(`🎯 Next to move:`, solutionGame.turn() === 'w' ? 'white' : 'black');
            
            // Wait before next move
            await new Promise(resolve => setTimeout(resolve, 500));
          } else {
            console.error(`🎯 Move ${i + 1} failed:`, move);
            break;
          }
        } catch (error) {
          console.error(`🎯 Error playing move ${i + 1}:`, error);
          break;
        }
      }
      
      if (puzzleState === 'failed') {
        console.log('🎯 Solution replay completed successfully');
        setStatus('Solution complete!');
      }
    };
    
    playSolution();
  };

  useEffect(() => {
    fetchPuzzle();
    fetchUserRating();
    // Start preloading puzzles after initial load
    setTimeout(() => preloadPuzzles(), 1000);
  }, []); // Run only once on mount

  // Initialize user rating from AuthContext
  useEffect(() => {
    if (user && user.rating) {
      setUserRating(user.rating);
      console.log('PuzzleSolvePage: User rating initialized from AuthContext:', user.rating);
    }
  }, [user]);

  // Reset statsUpdated and failedUpdated when loading a new puzzle
  useEffect(() => {
    setStatsUpdated(false);
    setFailedUpdated(false);
    statsUpdatedRef.current = false;
    failedUpdatedRef.current = false;
  }, [puzzle]);

  // Sync boardOrientation with playerColor - EXACT COPY from EndgameTrainerPage
  useEffect(() => {
    setBoardOrientation(playerColor);
  }, [playerColor]);

  // Sync theme state with URL param on mount or when urlTheme changes
  React.useEffect(() => {
    if (typeof urlTheme === 'string' && urlTheme !== theme) {
      setTheme(urlTheme || '');
    }
  }, [urlTheme]);

  // Handle responsive board sizing
  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth < 768;
      const isTablet = window.innerWidth >= 768 && window.innerWidth < 1280;
      
      if (isMobile) {
        // On mobile, make board smaller to ensure it fits with all padding
        const mobileSize = Math.min(window.innerWidth - 80, 320);
        setBoardSize(mobileSize);
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

    handleResize(); // Set initial size
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
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
    <div className="max-w-7xl mx-auto py-4 px-2 sm:py-6 sm:px-4 lg:px-8" style={{ isolation: 'isolate' }}>
      <div className="text-center mb-8" style={{ position: 'relative', zIndex: 50 }}>
        <h1 className="text-2xl sm:text-3xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent">
          Puzzle Trainer
        </h1>
        {theme && (
          <div className="mb-2">
            <p className="text-gray-600 font-medium">
              Theme: <span className="text-blue-600 font-semibold">{theme.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
            </p>
            {(themeExplanations[theme] || themeExplanations[theme.replace(/([A-Z])/g, '_$1').toLowerCase()]) && (
              <p className="text-gray-500 text-sm mt-1 max-w-2xl mx-auto">
                {themeExplanations[theme] || themeExplanations[theme.replace(/([A-Z])/g, '_$1').toLowerCase()]}
              </p>
            )}
          </div>
        )}
        {selectedDifficulty && (
          <p className="text-gray-600 font-medium">
            Difficulty: <span className="text-green-600 font-semibold">
              {selectedDifficulty === 'beginner' && '🟢 Beginner (800-1200)'}
              {selectedDifficulty === 'intermediate' && '🟡 Intermediate (1200-1800)'}
              {selectedDifficulty === 'advanced' && '🔴 Advanced (1800+)'}
            </span>
          </p>
        )}
      </div>
      <div className="mb-6 flex flex-col sm:flex-row justify-center gap-3" style={{ position: 'relative', zIndex: 50 }}>
        <div className="relative" style={{ zIndex: 100 }}>
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
              // Fetch new puzzle immediately with the new theme
              setTimeout(() => {
                if (fetchPuzzleRef.current) {
                  fetchPuzzleRef.current();
                }
              }, 100);
            }}
            className="px-4 py-3 border-2 border-gray-300 rounded-xl text-sm shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 cursor-pointer min-w-[200px]"
            style={{ 
              WebkitAppearance: 'none',
              MozAppearance: 'none',
              appearance: 'none',
              position: 'relative',
              zIndex: 1000,
              backgroundColor: '#ffffff',
              color: '#000000',
              transition: 'none'
            }}
          >
            <option value="" style={{ backgroundColor: '#f9fafb', color: '#111827', padding: '10px', fontSize: '14px', fontWeight: '500' }}>🎯 All Themes</option>
            <option value="random" style={{ backgroundColor: '#f9fafb', color: '#111827', padding: '10px', fontSize: '14px', fontWeight: '500' }}>🎲 Random Theme</option>
            {themeOptions.filter(t => t && t !== 'random').map(t => (
              <option key={t} value={t} style={{ backgroundColor: '#f9fafb', color: '#111827', padding: '10px', fontSize: '14px', fontWeight: '500' }}>{t.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
        <div className="relative" style={{ zIndex: 100 }}>
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
            className="px-4 py-3 border-2 border-gray-300 rounded-xl text-sm shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 cursor-pointer min-w-[180px]"
            style={{ 
              WebkitAppearance: 'none',
              MozAppearance: 'none',
              appearance: 'none',
              position: 'relative',
              zIndex: 1000,
              backgroundColor: '#ffffff',
              color: '#000000',
              transition: 'none'
            }}
          >
            <option value="" style={{ backgroundColor: '#f9fafb', color: '#111827', padding: '10px', fontSize: '14px', fontWeight: '500' }}>📊 All Difficulties</option>
            <option value="beginner" style={{ backgroundColor: '#f9fafb', color: '#111827', padding: '10px', fontSize: '14px', fontWeight: '500' }}>🟢 Beginner (800-1200)</option>
            <option value="intermediate" style={{ backgroundColor: '#f9fafb', color: '#111827', padding: '10px', fontSize: '14px', fontWeight: '500' }}>🟡 Intermediate (1200-1800)</option>
            <option value="advanced" style={{ backgroundColor: '#f9fafb', color: '#111827', padding: '10px', fontSize: '14px', fontWeight: '500' }}>🔴 Advanced (1800+)</option>
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>
      {/* Board Size Slider - Hidden on mobile, show on desktop */}
      <div className="mb-2 hidden md:flex items-center justify-center gap-2">
        <label htmlFor="board-size" className="text-xs">Board Size:</label>
        <input
          id="board-size"
          type="range"
          min={300}
          max={600}
          value={boardSize}
          onChange={e => setBoardSize(Number(e.target.value))}
          className="w-32"
        />
        <span className="text-xs w-8 text-right">{boardSize}px</span>
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        {/* Left Sidebar - Your Rating and Expected Points */}
        <div className="xl:col-span-1 space-y-4">
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

        {/* Chessboard - Takes up more space */}
        <div className="xl:col-span-3">
          <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl shadow-2xl border border-gray-200 p-1 sm:p-6 lg:p-8">
            <div className="flex flex-col items-center">
              {/* Enhanced turn indicator */}
              <div className={`mb-4 sm:mb-6 px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-bold text-base sm:text-lg shadow-lg transform transition-all duration-300 ${getTurnIndicatorStyle()}`}>
                {getTurnIndicator()}
              </div>
              <div className="relative w-full" style={{ touchAction: 'manipulation', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg sm:rounded-2xl p-1 sm:p-4 shadow-inner border border-amber-200" 
                  style={{ 
                    touchAction: 'manipulation',
                    width: 'fit-content',
                    margin: '0 auto'
                  }}>
                  <div className="bg-gradient-to-br from-amber-100 to-orange-100 rounded-md sm:rounded-xl p-0.5 sm:p-2 shadow-lg" 
                    style={{ 
                      touchAction: 'manipulation',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center'
                    }}>
                    <div style={{ 
                      width: boardSize, 
                      height: boardSize,
                      touchAction: 'manipulation',
                      WebkitUserSelect: 'none',
                      userSelect: 'none'
                    }}>
                        <Chessboard
                        position={showSolution ? (solutionPosition || puzzle?.fen || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1') : game?.fen() || puzzle?.fen || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'}
                        boardOrientation={boardOrientation}
                        arePiecesDraggable={!showSolution && puzzleState === 'active'}
                        onPieceDrop={showSolution || puzzleState !== 'active' ? undefined : (sourceSquare, targetSquare) => {
                          const success = makeMove(sourceSquare, targetSquare);
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
                        onSquareClick={showSolution || puzzleState !== 'active' ? undefined : (square) => {
                          if (!game || puzzleState !== 'active') return;

                          if (selectedSquare) {
                            // If a square is already selected, try to make a move
                            const success = makeMove(selectedSquare, square);
                            if (success) {
                              setSelectedSquare(null);
                            } else {
                              // Invalid move, select the new square
                              const piece = game.get(square);
                              if (piece && piece.color === game.turn()) {
                                setSelectedSquare(square);
                              } else {
                                setSelectedSquare(null);
                              }
                            }
                          } else {
                            // No square selected, select this square if it has a piece of the correct color
                            const piece = game.get(square);
                            if (piece && piece.color === game.turn()) {
                              setSelectedSquare(square);
                            }
                          }
                        }}
                        customSquareStyles={getCustomSquareStyles()}
                        boardWidth={boardSize}
                        customBoardStyle={{
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                          // Mobile touch optimizations - CRITICAL for drag-and-drop
                          touchAction: 'none', // Disable browser gestures to allow proper drag handling
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
                        customArrows={[]}
                        areArrowsAllowed={false}
                        animationDuration={200}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Controls and Info - Takes up less space */}
        <div className="xl:col-span-1 space-y-4 order-first xl:order-last">
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-xl border border-gray-200 p-4 sm:p-6">
            <h2 className="text-lg font-bold mb-4 text-gray-800 flex items-center">
              <div className="w-2 h-2 bg-teal-500 rounded-full mr-3"></div>
              Controls
            </h2>
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
                className="bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white font-semibold py-2 sm:py-3 px-3 sm:px-4 rounded-xl text-sm shadow-lg transform transition-all duration-200 hover:scale-105 hover:shadow-xl"
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
                <div className="mt-4 flex flex-col items-center space-y-2">
                  <OpenInLiveAnalysisButton
                    fen={puzzle.fen}
                    color={puzzle.fen.split(' ')[1] === 'w' ? 'white' : 'black'}
                    label="Analyze Position"
                    className="!bg-green-600 hover:!bg-green-700 !text-white !font-semibold !py-3 !px-6 !rounded-lg !shadow-lg !transform !transition-all !duration-200 hover:!scale-105 w-full"
                    onClick={() => {
                      console.log('🔍 Debug: Opening analysis with FEN:', puzzle.fen);
                      console.log('🔍 Debug: Side to move:', puzzle.fen.split(' ')[1] === 'w' ? 'white' : 'black');
                    }}
                  />
                </div>
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
                  <span className="text-green-700 truncate max-w-[120px]">{puzzle.theme}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
                  <span className="font-semibold text-blue-800">Rating:</span>
                  <span className="text-blue-700 font-bold">{puzzle.rating || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gradient-to-r from-teal-50 to-cyan-50 rounded-lg border border-teal-200">
                  <span className="font-semibold text-teal-800">Move:</span>
                  <span className="text-teal-700 font-bold">{moveIndex + 1} / {puzzle.moves.length}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gradient-to-r from-gray-50 to-slate-50 rounded-lg border border-gray-200">
                  <span className="font-semibold text-gray-800">ID:</span>
                  <span className="text-gray-700 truncate max-w-[120px]">{puzzle.id || 'N/A'}</span>
                </div>
                {puzzleCache.length > 0 && (
                  <div className="flex justify-between items-center p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                    <span className="font-semibold text-green-800">Cache:</span>
                    <span className="text-green-700 font-bold">⚡ {puzzleCache.length} ready</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Puzzle History */}
      {puzzleHistory.length > 0 && (
        <div className="mt-8 bg-gradient-to-br from-slate-800/50 to-blue-900/30 backdrop-blur-sm border border-blue-500/20 rounded-2xl p-6">
          <h2 className="text-lg font-bold mb-4 text-white flex items-center">
            <Trophy className="w-5 h-5 mr-2" />
            Puzzle History
          </h2>
          <div className="max-h-64 overflow-y-auto space-y-2">
            {puzzleHistory.map((puzzle, index) => (
              <div 
                key={puzzle.id} 
                className={`p-3 rounded-lg border transition-all duration-200 hover:scale-105 cursor-pointer ${
                  puzzle.solved 
                    ? 'bg-green-900/30 border-green-500/50 hover:bg-green-800/40' 
                    : 'bg-red-900/30 border-red-500/50 hover:bg-red-800/40'
                }`}
                onClick={() => {
                  // Navigate to live analysis with puzzle data
                  const puzzleData = {
                    _id: puzzle.id,
                    fen: puzzle.fen,
                    moves: puzzle.moves,
                    rating: puzzle.rating,
                    theme: puzzle.theme,
                    description: puzzle.description
                  };
                  
                  // Encode puzzle data as URL parameters
                  const encodedFen = encodeURIComponent(puzzle.fen);
                  const encodedMoves = encodeURIComponent(JSON.stringify(puzzle.moves));
                  const encodedPuzzle = encodeURIComponent(JSON.stringify(puzzleData));
                  
                  // Navigate to live analysis with puzzle data
                  window.open(`/live-analysis?fen=${encodedFen}&moves=${encodedMoves}&puzzle=${encodedPuzzle}`, '_blank');
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      puzzle.solved ? 'bg-green-500' : 'bg-red-500'
                    }`}></div>
                    <div>
                      <div className="text-sm font-medium text-white">
                        {puzzle.description || 'Puzzle'}
                      </div>
                      <div className="text-xs text-gray-400">
                        Rating: {puzzle.rating} • {puzzle.theme}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-400">
                    {new Date(puzzle.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Analysis Modal */}
      {showAnalysis && puzzle && (
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
                <Chessboard
                  position={puzzle.fen}
                  boardWidth={400}
                  customBoardStyle={{
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    // Mobile touch optimizations - CRITICAL for drag-and-drop
                    touchAction: 'none', // Disable browser gestures to allow proper drag handling
                    pointerEvents: 'auto', // Ensure touch events are captured
                    userSelect: 'none',
                    WebkitUserSelect: 'none',
                    MozUserSelect: 'none',
                    msUserSelect: 'none',
                    userSelect: 'none',
                    WebkitTouchCallout: 'none',
                    WebkitTapHighlightColor: 'transparent',
                    WebkitUserDrag: 'none', // Prevent drag ghosts
                    zIndex: 1 // Ensure board is not blocked by overlays
                  }}
                />
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
        </div>
      )}
    </div>
  );
};

export default PuzzleSolvePage;