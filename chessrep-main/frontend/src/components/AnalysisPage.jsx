import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import { 
  ChevronLeft, ChevronRight, SkipBack, SkipForward, 
  RotateCcw, Brain, BookOpen, Download, Upload, Copy,
  AlertCircle, CheckCircle, FileText, X, Play, Square
} from 'lucide-react';
import AnalysisNotation from './AnalysisNotation';
import MultiPVAnalysisPanel from './MultiPVAnalysisPanel';
import lichessAnalysisEngine from '../services/LichessAnalysisEngine';
import { EngineMove } from '../types/chess';

/**
 * Dedicated Analysis Board Page
 * Uses EXACT SAME game tree structure as SimplifiedChessBoardPage
 * Tree structure: { moves: [...], variations: [] }
 * Each move: { san: string, variations: [] }
 */
const AnalysisPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Extract query parameters
  const queryFen = searchParams.get('fen');
  const queryStartFen = searchParams.get('startFen');
  const queryPgn = searchParams.get('pgn');
  const queryLabel = searchParams.get('label');
  const queryOrientation = searchParams.get('orientation') || 'white';
  const queryMoveIndexParam = searchParams.get('moveIndex');
  const queryMoveNumberParam = searchParams.get('moveNumber');
  const parsedMoveIndex = queryMoveIndexParam !== null ? parseInt(queryMoveIndexParam, 10) : null;
  const parsedMoveNumber = queryMoveNumberParam !== null ? parseInt(queryMoveNumberParam, 10) : null;
  const hasMoveIndex = parsedMoveIndex !== null && !Number.isNaN(parsedMoveIndex);
  const hasMoveNumber = parsedMoveNumber !== null && !Number.isNaN(parsedMoveNumber);
  const queryMoveIndex = hasMoveIndex ? parsedMoveIndex : (hasMoveNumber ? parsedMoveNumber : null);
  
  const decodedPgn = useMemo(() => {
    if (!queryPgn) return null;
    try {
      return decodeURIComponent(queryPgn);
    } catch (error) {
      console.error('❌ Failed to decode PGN from URL:', error);
      return null;
    }
  }, [queryPgn]);
  
  const pgnStartingFen = useMemo(() => {
    if (!decodedPgn) return null;
    const match = decodedPgn.match(/\[FEN\s+"([^"]+)"\]/i);
    return match ? match[1] : null;
  }, [decodedPgn]);
  
  // Core game state (EXACT SAME AS SimplifiedChessBoardPage)
  const DEFAULT_STARTING_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
  
  // Determine starting FEN: PGN FEN > queryFEN > default
  // This ensures editor-origin positions are preserved as the starting point
  const effectiveStartingFen = pgnStartingFen || queryStartFen || (!queryPgn && queryFen) || DEFAULT_STARTING_FEN;
  const [startingFen, setStartingFen] = useState(effectiveStartingFen);
  const initialBoardFen = queryPgn ? effectiveStartingFen : (queryFen || effectiveStartingFen);
  const [game, setGame] = useState(() => new Chess(initialBoardFen));
  const [boardPosition, setBoardPosition] = useState(initialBoardFen);
  
  // Game tree structure: { moves: [...], variations: [] }
  const [tree, setTree] = useState({ moves: [], variations: [] });
  
  // Current position tracking
  const [currentPath, setCurrentPath] = useState([]); // [] = mainline, [n] = in variation n
  const [currentMoveIndex, setCurrentMoveIndex] = useState(0);
  
  // Board settings
  const [boardOrientation, setBoardOrientation] = useState(queryOrientation);
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Engine analysis state (using new LichessAnalysisEngine)
  const [engineEvaluation, setEngineEvaluation] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [engineError, setEngineError] = useState(null);
  const [currentAnalysisDepth, setCurrentAnalysisDepth] = useState(0);
  const [engineLines, setEngineLines] = useState([]); // EngineMove[]
  
  // Analysis settings (synced with MultiPVAnalysisPanel)
  const [analysisSettings, setAnalysisSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('chessrep-analysis-settings');
      const defaults = { multiPV: 3, pvLength: 10, depthCap: 20, timeLimit: 750 };
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...defaults, ...parsed };
      }
      return defaults;
    } catch (error) {
      console.warn('Failed to load analysis settings:', error);
      return { multiPV: 3, pvLength: 10, depthCap: 20, timeLimit: 750 };
    }
  });
  
  // Analysis enabled/disabled state
  const [isAnalysisEnabled, setIsAnalysisEnabled] = useState(() => {
    const saved = localStorage.getItem('chessrep-analysis-enabled');
    return saved !== null ? JSON.parse(saved) : true; // Default to enabled
  });
  
  // Opening explorer state
  const [openingMoves, setOpeningMoves] = useState([]);
  const [openingName, setOpeningName] = useState('');
  const [hoveredOpeningMove, setHoveredOpeningMove] = useState(null); // SAN of hovered opening move

  // Board resize state (for desktop)
  const [boardSize, setBoardSize] = useState(480); // Default size in pixels
  const [isResizing, setIsResizing] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);
  const resizeStartRef = useRef({ size: 480, x: 0 });

  // PGN Import state
  const [showPgnImport, setShowPgnImport] = useState(false);
  const [pgnText, setPgnText] = useState('');
  const [pgnError, setPgnError] = useState('');
  const [isLoadingPgn, setIsLoadingPgn] = useState(false);
  const fileInputRef = useRef(null);

  // Bot game state
  const [botMode, setBotMode] = useState(false);
  const [botColor, setBotColor] = useState('black'); // Bot plays black by default
  const [isBotThinking, setIsBotThinking] = useState(false);
  const [botDifficulty, setBotDifficulty] = useState(1500); // Default bot rating
  const [botGameResult, setBotGameResult] = useState(null);

  /**
   * Navigate to a specific position in the tree (EXACT COPY from SimplifiedChessBoardPage)
   */
  const navigateToPosition = useCallback((path, moveIndex) => {
    // Stop bot mode when navigating (to prevent confusion)
    if (botMode) {
      console.log('🤖 Stopping bot mode due to navigation');
      setBotMode(false);
      setBotGameResult(null);
      setIsBotThinking(false);
    }
    
    console.log('📍 Navigating to path:', path, 'move index:', moveIndex);
    console.log('📍 Path length:', path.length);
    
    const newGame = new Chess(startingFen);
    const movesToPlay = [];
    
    if (path.length === 0) {
      // Mainline - simple case
      for (let i = 0; i < moveIndex && i < tree.moves.length; i++) {
        movesToPlay.push(tree.moves[i]);
      }
    } else if (path.length === 2 && path[0] === -1) {
      // Root-level variation (alternative first move)
      const varIndex = path[1];
      const variation = tree.variations?.[varIndex];
      if (variation?.moves) {
        for (let i = 0; i < moveIndex && i < variation.moves.length; i++) {
          movesToPlay.push(variation.moves[i]);
        }
      }
    } else if (path.length === 4 && path[0] === -1) {
      // Sub-variation within root-level variation
      const [, varIndex1, branchPoint, varIndex2] = path;
      const variation1 = tree.variations?.[varIndex1];
      if (variation1?.moves) {
        for (let i = 0; i <= branchPoint && i < variation1.moves.length; i++) {
          movesToPlay.push(variation1.moves[i]);
        }
        
        const variation2 = variation1.moves[branchPoint]?.variations?.[varIndex2];
        if (variation2?.moves) {
          for (let i = 0; i < moveIndex && i < variation2.moves.length; i++) {
            movesToPlay.push(variation2.moves[i]);
          }
        }
      }
    } else if (path.length === 2) {
      // First-level variation: [branchPoint, varIndex]
      const branchPoint = path[0];
      const varIndex = path[1];
      
      // Play mainline moves up to branch point (INCLUSIVE)
      for (let i = 0; i <= branchPoint && i < tree.moves.length; i++) {
        movesToPlay.push(tree.moves[i]);
      }
      
      // Then play variation moves
      const variation = tree.moves[branchPoint]?.variations?.[varIndex];
      if (variation?.moves) {
        for (let i = 0; i < moveIndex && i < variation.moves.length; i++) {
          movesToPlay.push(variation.moves[i]);
        }
      }
    } else if (path.length === 4) {
      // Second-level variation: [branchPoint1, varIndex1, branchPoint2, varIndex2]
      const [branchPoint1, varIndex1, branchPoint2, varIndex2] = path;
      
      // Play mainline moves up to first branch point (INCLUSIVE)
      for (let i = 0; i <= branchPoint1 && i < tree.moves.length; i++) {
        movesToPlay.push(tree.moves[i]);
      }
      
      // Play first variation moves up to second branch point (INCLUSIVE)
      const variation1 = tree.moves[branchPoint1]?.variations?.[varIndex1];
      if (variation1?.moves) {
        for (let i = 0; i <= branchPoint2 && i < variation1.moves.length; i++) {
          movesToPlay.push(variation1.moves[i]);
        }
        
        // Play second variation moves
        const variation2 = variation1.moves[branchPoint2]?.variations?.[varIndex2];
        if (variation2?.moves) {
          for (let i = 0; i < moveIndex && i < variation2.moves.length; i++) {
            movesToPlay.push(variation2.moves[i]);
          }
        }
      }
    } else if (path.length === 6) {
      // Third-level variation: [bp1, vi1, bp2, vi2, bp3, vi3]
      const [bp1, vi1, bp2, vi2, bp3, vi3] = path;
      
      console.log('🔍 Third-level navigation:', { bp1, vi1, bp2, vi2, bp3, vi3, moveIndex });
      
      // Play mainline moves up to first branch point (INCLUSIVE)
      for (let i = 0; i <= bp1 && i < tree.moves.length; i++) {
        movesToPlay.push(tree.moves[i]);
      }
      console.log('📝 After mainline:', movesToPlay.map(m => m.san));
      
      // Play first variation moves up to second branch point (INCLUSIVE)
      const variation1 = tree.moves[bp1]?.variations?.[vi1];
      if (variation1?.moves) {
        for (let i = 0; i <= bp2 && i < variation1.moves.length; i++) {
          movesToPlay.push(variation1.moves[i]);
        }
        console.log('📝 After first variation:', movesToPlay.map(m => m.san));
        
        // Play second variation moves up to third branch point (INCLUSIVE)
        const variation2 = variation1.moves[bp2]?.variations?.[vi2];
        if (variation2?.moves) {
          for (let i = 0; i <= bp3 && i < variation2.moves.length; i++) {
            movesToPlay.push(variation2.moves[i]);
          }
          console.log('📝 After second variation:', movesToPlay.map(m => m.san));
          
          // Play third variation moves
          const variation3 = variation2.moves[bp3]?.variations?.[vi3];
          console.log('📝 Third variation exists?', !!variation3, 'moves:', variation3?.moves?.map(m => m.san));
          if (variation3?.moves) {
            for (let i = 0; i < moveIndex && i < variation3.moves.length; i++) {
              movesToPlay.push(variation3.moves[i]);
            }
            console.log('📝 After third variation:', movesToPlay.map(m => m.san));
          }
        }
      }
    }
    
    // Apply all moves
    movesToPlay.forEach(move => {
      try {
        newGame.move(move.san);
      } catch (e) {
        console.error('Error applying move:', move, e);
      }
    });
    
    setGame(newGame);
    setBoardPosition(newGame.fen());
    setCurrentPath(path);
    setCurrentMoveIndex(moveIndex);
    setRefreshKey(prev => prev + 1);
  }, [tree, startingFen, botMode]);

  const getParentContext = useCallback((path) => {
    if (!path || path.length < 2) {
      return null;
    }

    const parentPath = path.slice(0, -2);
    const branchPoint = path[path.length - 2];

    return {
      path: parentPath,
      moveIndex: branchPoint < 0 ? 0 : branchPoint + 1
    };
  }, []);

  /**
   * Load PGN from text
   */
  const loadPgnFromText = useCallback((pgnString) => {
    setIsLoadingPgn(true);
    setPgnError('');
    
    try {
      if (!pgnString || !pgnString.trim()) {
        throw new Error('PGN is empty');
      }

      // Extract FEN from PGN if present
      const fenMatch = pgnString.match(/\[FEN\s+"([^"]+)"\]/i);
      const pgnFen = fenMatch ? fenMatch[1] : DEFAULT_STARTING_FEN;

      // Create new game instance with starting position
      const pgnGame = new Chess(pgnFen);
      
      // Try to load PGN
      const loadMethod = pgnGame.loadPgn || pgnGame.load_pgn;
      if (!loadMethod) {
        throw new Error('Chess.js does not support PGN loading');
      }

      const loadSuccess = loadMethod.call(pgnGame, pgnString);
      if (!loadSuccess) {
        throw new Error('Failed to parse PGN. Please check the format.');
      }

      // Get move history
      const history = pgnGame.history({ verbose: true });
      if (!history || history.length === 0) {
        throw new Error('No moves found in PGN');
      }

      // Convert to tree structure
      const moves = history.map(move => ({
        san: move.san,
        variations: [],
      }));

      // Update game state
      setTree({ moves, variations: [] });
      setGame(pgnGame);
      setBoardPosition(pgnGame.fen());
      setCurrentPath([]);
      setCurrentMoveIndex(history.length);
      setStartingFen(pgnFen);
      setBotMode(false); // Exit bot mode when loading new PGN
      setBotGameResult(null);
      setRefreshKey(prev => prev + 1);

      // Update URL to include PGN (optional, stored in state)
      const encodedPgn = encodeURIComponent(pgnString);
      navigate(`/analysis?pgn=${encodedPgn}`, { replace: true });

      setShowPgnImport(false);
      setPgnText('');
      console.log('✅ PGN loaded successfully:', moves.length, 'moves');
    } catch (error) {
      console.error('❌ Error loading PGN:', error);
      setPgnError(error.message || 'Failed to load PGN. Please check the format.');
    } finally {
      setIsLoadingPgn(false);
    }
  }, [DEFAULT_STARTING_FEN, navigate]);

  /**
   * Handle file input for PGN
   */
  const handleFileInput = useCallback((event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result;
      if (typeof content === 'string') {
        setPgnText(content);
        loadPgnFromText(content);
      }
    };
    reader.onerror = () => {
      setPgnError('Failed to read file');
    };
    reader.readAsText(file);
  }, [loadPgnFromText]);

  /**
   * Make bot move (aligned with PlayWithBotPage)
   */
  const makeBotMove = useCallback(async () => {
    if (!botMode || isBotThinking) return;

    // Create a temporary game instance to check turn
    const tempGame = new Chess(boardPosition);
    const currentTurn = tempGame.turn();
    const botColorCode = botColor === 'white' ? 'w' : 'b';
    const isBotTurn = currentTurn === botColorCode;
    
    if (!isBotTurn) {
      return; // Not bot's turn
    }

    // Check if game is over
    if (tempGame.game_over()) {
      setBotMode(false);
      setIsBotThinking(false);
      if (tempGame.in_checkmate()) {
        // The side to move is the one in checkmate (lost)
        const loserColor = currentTurn === 'w' ? 'white' : 'black';
        setBotGameResult(loserColor === botColor ? 'You win!' : 'Bot wins!');
      } else if (tempGame.in_stalemate()) {
        setBotGameResult('Stalemate - Draw!');
      } else if (tempGame.in_draw()) {
        setBotGameResult('Draw!');
      }
      return;
    }

    setIsBotThinking(true);

    try {
      // Use the same API format as PlayWithBotPage
      const payload = {
        fen: boardPosition,
        difficulty: botDifficulty,
        rating: botDifficulty,
        personality: 'positional',
        timeControl: 'rapid'
      };

      console.log('🤖 Making bot move for FEN:', boardPosition);
      console.log('🤖 Bot color:', botColor, 'Current turn:', currentTurn === 'w' ? 'white' : 'black');
      console.log('🤖 Bot payload:', payload);

      const response = await fetch('http://localhost:3001/api/bot/move', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Bot move request failed: ${response.status}`);
      }

      const data = await response.json();
      console.log('🤖 Bot move response:', data);
      
      if (data.success && data.move) {
        // Make the bot's move using sloppy parsing (same as PlayWithBotPage)
        const gameCopy = new Chess(boardPosition);
        const moveObj = gameCopy.move(data.move, { sloppy: true });
        
        if (moveObj) {
          // Use FEN from response if available, otherwise use calculated
          const finalFen = data.fen || gameCopy.fen();
          const finalChess = new Chess(finalFen);

          // Use the same logic as onPieceDrop to update tree
          const parentContext = currentMoveIndex === 0 && currentPath.length > 0
            ? getParentContext(currentPath)
            : null;
          
          const effectivePath = parentContext?.path ?? currentPath;
          const effectiveMoveIndex = parentContext?.moveIndex ?? currentMoveIndex;
          
          // Add move to tree (append to current position, don't reset)
          let newPath = effectivePath;
          let newMoveIndex = effectiveMoveIndex + 1;
          
          setTree(prevTree => {
            const newTree = JSON.parse(JSON.stringify(prevTree));
            
            if (effectivePath.length === 0) {
              // Adding to mainline
              const existingMove = newTree.moves[effectiveMoveIndex];
              if (!existingMove) {
                // Append to end - this continues the notation
                newTree.moves.push({ san: moveObj.san, variations: [] });
              } else if (existingMove.san !== moveObj.san) {
                // Different move - create variation
                const parentMoveIndex = effectiveMoveIndex - 1;
                if (parentMoveIndex < 0) {
                  // Root-level variation
                  if (!newTree.variations) {
                    newTree.variations = [];
                  }
                  newTree.variations.push({ moves: [{ san: moveObj.san, variations: [] }] });
                  newPath = [-1, newTree.variations.length - 1];
                  newMoveIndex = 1;
                } else {
                  // Create variation from parent move
                  const parentMove = newTree.moves[parentMoveIndex];
                  if (!parentMove.variations) {
                    parentMove.variations = [];
                  }
                  parentMove.variations.push({ moves: [{ san: moveObj.san, variations: [] }] });
                  newPath = [parentMoveIndex, parentMove.variations.length - 1];
                  newMoveIndex = 1;
                }
              } else {
                // Same move exists - just navigate forward
                newMoveIndex = effectiveMoveIndex + 1;
              }
            } else {
              // Handle variations - append to current variation
              // This is a simplified version, full variation handling is in onPieceDrop
              // For bot moves, we'll append to mainline if we're in a variation
              if (!newTree.moves) {
                newTree.moves = [];
              }
              newTree.moves.push({ san: moveObj.san, variations: [] });
              newPath = [];
              newMoveIndex = newTree.moves.length;
            }
            
            return newTree;
          });

          // Update game state
          setGame(finalChess);
          setBoardPosition(finalFen);
          setCurrentPath(newPath);
          setCurrentMoveIndex(newMoveIndex);
          setRefreshKey(prev => prev + 1);

          // Check if game is over after bot move
          if (finalChess.game_over()) {
            setBotMode(false);
            const winnerTurn = finalChess.turn(); // Turn is for the player who just moved
            if (finalChess.in_checkmate()) {
              // The player whose turn it is now is the one who lost
              const loserColor = winnerTurn === 'w' ? 'white' : 'black';
              setBotGameResult(loserColor === botColor ? 'You win!' : 'Bot wins!');
            } else if (finalChess.in_stalemate()) {
              setBotGameResult('Stalemate - Draw!');
            } else if (finalChess.in_draw()) {
              setBotGameResult('Draw!');
            }
          }
        } else {
          console.error('❌ Failed to execute bot move:', data.move);
          setPgnError('Failed to execute bot move. Please try again.');
        }
      } else if (data.gameOver) {
        setBotMode(false);
        setBotGameResult(data.result === 'checkmate' ? 'Checkmate - Bot wins!' : 
                        data.result === 'draw' ? 'Draw!' : 
                        data.result === 'stalemate' ? 'Stalemate - Draw!' : 'Game over');
      }
    } catch (error) {
      console.error('❌ Error making bot move:', error);
      const errorMessage = error.message || 'Unknown error';
      console.error('❌ Error details:', {
        message: errorMessage,
        stack: error.stack,
        botMode,
        boardPosition,
        botColor,
        botDifficulty
      });
      
      // Show user-friendly error message
      if (errorMessage.includes('fetch') || errorMessage.includes('network')) {
        setPgnError('Network error: Could not connect to bot service. Please check your connection.');
      } else if (errorMessage.includes('400') || errorMessage.includes('404')) {
        setPgnError('Bot service error: Invalid request. Please try again.');
      } else if (errorMessage.includes('500')) {
        setPgnError('Bot service error: Server error. Please try again later.');
      } else {
        setPgnError(`Bot move failed: ${errorMessage}. Please try again.`);
      }
      
      // Don't stop bot mode on error - let user retry or continue
    } finally {
      setIsBotThinking(false);
    }
  }, [botMode, isBotThinking, botColor, boardPosition, botDifficulty, currentMoveIndex, currentPath, getParentContext]);

  /**
   * Handle piece drop on board (EXACT COPY from SimplifiedChessBoardPage)
   */
  const onPieceDrop = useCallback((sourceSquare, targetSquare) => {
    // In bot mode, prevent moves when it's bot's turn
    if (botMode) {
      const tempGame = new Chess(boardPosition);
      const currentTurn = tempGame.turn();
      const isBotTurn = (botColor === 'black' && currentTurn === 'b') || 
                        (botColor === 'white' && currentTurn === 'w');
      if (isBotTurn) {
        return false; // Bot's turn, prevent user move
      }
    }

    const gameCopy = new Chess(boardPosition);
    
    try {
      const move = gameCopy.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: 'q' // Always promote to queen for simplicity
      });
      
      if (!move) return false;
      
      const parentContext = currentMoveIndex === 0 && currentPath.length > 0
        ? getParentContext(currentPath)
        : null;
      
      const effectivePath = parentContext?.path ?? currentPath;
      const effectiveMoveIndex = parentContext?.moveIndex ?? currentMoveIndex;
      
      console.log('✅ Legal move:', move.san, 'from path:', currentPath, 'index:', currentMoveIndex, 'effective path:', effectivePath, 'effective index:', effectiveMoveIndex);
      
      // Add move to tree
      let newPath = effectivePath;
      let newMoveIndex = effectiveMoveIndex + 1;
      let shouldSkipTreeUpdate = false;
      
      setTree(prevTree => {
        const newTree = JSON.parse(JSON.stringify(prevTree));
        
        if (effectivePath.length === 0) {
          // Adding to mainline
          console.log('📊 Mainline state:', {
            currentMoveIndex: effectiveMoveIndex,
            mainlineLength: newTree.moves.length,
            existingMoveAtIndex: newTree.moves[effectiveMoveIndex]?.san,
            newMove: move.san
          });
          
          // Check if there's already a different move at this position
          const existingMove = newTree.moves[effectiveMoveIndex];
          
          if (!existingMove) {
            // No move at this position - appending at end
            console.log('📝 Appending to mainline');
            newTree.moves.push({ san: move.san, variations: [] });
          } else if (existingMove.san !== move.san) {
            // Different move exists - create variation
            console.log('📝 Creating new variation from mainline (different move)');
            const parentMoveIndex = effectiveMoveIndex - 1;
            
            if (parentMoveIndex < 0) {
              // Special case: Alternative first move (position 0)
              // Store as variation at game tree root level
              console.log('📝 Creating alternative first move');
              if (!newTree.variations) {
                newTree.variations = [];
              }
              newTree.variations.push({ moves: [{ san: move.san, variations: [] }] });
              // Path format for root-level variation: [-1, variationIndex]
              newPath = [-1, newTree.variations.length - 1];
              newMoveIndex = 1;
            } else if (parentMoveIndex >= 0) {
              const parentMove = newTree.moves[parentMoveIndex];
              if (!parentMove.variations) {
                parentMove.variations = [];
              }
              parentMove.variations.push({ moves: [{ san: move.san, variations: [] }] });
              // Update path to reflect we're now in this new variation
              newPath = [parentMoveIndex, parentMove.variations.length - 1];
              newMoveIndex = 1; // First move in new variation
            }
          } else {
            // Same move exists - don't modify tree, just navigate forward
            console.log('⚠️ Same move already exists - will navigate forward');
            shouldSkipTreeUpdate = true;
            newMoveIndex = effectiveMoveIndex + 1;
          }
        } else if (effectivePath.length === 2 && effectivePath[0] === -1) {
          // Adding to root-level variation (alternative first move)
          const varIndex = effectivePath[1];
          const variation = newTree.variations[varIndex];
          
          console.log('📊 Root-level variation state:', {
            currentMoveIndex: effectiveMoveIndex,
            variationLength: variation.moves.length,
            existingMoveAtIndex: variation.moves[effectiveMoveIndex]?.san,
            newMove: move.san
          });
          
          // Check if there's already a different move at this position
          const existingMove = variation.moves[effectiveMoveIndex];
          
          if (!existingMove) {
            // No move at this position - appending at end
            console.log('📝 Appending to root-level variation');
            variation.moves.push({ san: move.san, variations: [] });
          } else if (existingMove.san !== move.san) {
            // Different move exists - create sub-variation
            console.log('📝 Creating sub-variation from root-level variation');
            const parentMoveIndex = effectiveMoveIndex - 1;
            if (parentMoveIndex >= 0) {
              const parentMove = variation.moves[parentMoveIndex];
              if (!parentMove.variations) {
                parentMove.variations = [];
              }
              parentMove.variations.push({ moves: [{ san: move.san, variations: [] }] });
              // Update path to reflect we're now in this sub-variation
              newPath = [-1, varIndex, parentMoveIndex, parentMove.variations.length - 1];
              newMoveIndex = 1;
            }
          } else {
            // Same move exists - don't modify tree, just navigate forward
            console.log('⚠️ Same move already exists - will navigate forward');
            shouldSkipTreeUpdate = true;
            newMoveIndex = effectiveMoveIndex + 1;
          }
        } else if (effectivePath.length === 4 && effectivePath[0] === -1) {
          // Adding to sub-variation within root-level variation
          const [, varIndex1, branchPoint, varIndex2] = effectivePath;
          const variation1 = newTree.variations[varIndex1];
          const variation2 = variation1.moves[branchPoint].variations[varIndex2];
          
          console.log('📊 Root sub-variation state:', {
            currentMoveIndex: effectiveMoveIndex,
            variation2Length: variation2.moves.length,
            existingMoveAtIndex: variation2.moves[effectiveMoveIndex]?.san,
            newMove: move.san
          });
          
          const existingMove = variation2.moves[effectiveMoveIndex];
          
          if (!existingMove) {
            console.log('📝 Appending to root sub-variation');
            variation2.moves.push({ san: move.san, variations: [] });
          } else if (existingMove.san !== move.san) {
            console.log('📝 Creating third-level variation from root sub-variation');
            const parentMoveIndex = effectiveMoveIndex - 1;
            if (parentMoveIndex >= 0) {
              const parentMove = variation2.moves[parentMoveIndex];
              if (!parentMove.variations) {
                parentMove.variations = [];
              }
              parentMove.variations.push({ moves: [{ san: move.san, variations: [] }] });
              console.log('⚠️ Third-level from root created but navigation may be limited');
            }
          } else {
            console.log('⚠️ Same move already exists - will navigate forward');
            shouldSkipTreeUpdate = true;
            newMoveIndex = effectiveMoveIndex + 1;
          }
        } else if (effectivePath.length === 2) {
          // Adding to first-level variation
          const branchPoint = effectivePath[0];
          const varIndex = effectivePath[1];
          const variation = newTree.moves[branchPoint].variations[varIndex];
          
          console.log('📊 First-level variation state:', {
            currentMoveIndex: effectiveMoveIndex,
            variationLength: variation.moves.length,
            existingMoveAtIndex: variation.moves[effectiveMoveIndex]?.san,
            newMove: move.san
          });
          
          // Check if there's already a different move at this position
          const existingMove = variation.moves[effectiveMoveIndex];
          
          if (!existingMove) {
            // No move at this position - appending at end
            console.log('📝 Appending to first-level variation');
            variation.moves.push({ san: move.san, variations: [] });
          } else if (existingMove.san !== move.san) {
            // Different move exists - create sub-variation
            console.log('📝 Creating sub-variation (different move)');
            const parentMoveIndex = effectiveMoveIndex - 1;
            if (parentMoveIndex >= 0) {
              const parentMove = variation.moves[parentMoveIndex];
              if (!parentMove.variations) {
                parentMove.variations = [];
              }
              parentMove.variations.push({ moves: [{ san: move.san, variations: [] }] });
              // Update path to reflect we're now in this sub-variation
              newPath = [branchPoint, varIndex, parentMoveIndex, parentMove.variations.length - 1];
              newMoveIndex = 1; // First move in new sub-variation
            }
          } else {
            // Same move exists - don't modify tree, just navigate forward
            console.log('⚠️ Same move already exists - will navigate forward');
            shouldSkipTreeUpdate = true;
            newMoveIndex = effectiveMoveIndex + 1;
          }
        } else if (effectivePath.length === 4) {
          // Adding to second-level variation
          const [bp1, vi1, bp2, vi2] = effectivePath;
          const variation1 = newTree.moves[bp1].variations[vi1];
          const variation2 = variation1.moves[bp2].variations[vi2];
          
          console.log('📊 Second-level variation state:', {
            currentMoveIndex: effectiveMoveIndex,
            variation2Length: variation2.moves.length,
            existingMoveAtIndex: variation2.moves[effectiveMoveIndex]?.san,
            newMove: move.san
          });
          
          // Check if there's already a different move at this position
          const existingMove = variation2.moves[effectiveMoveIndex];
          
          if (!existingMove) {
            // No move at this position - appending at end
            console.log('📝 Appending to second-level variation');
            variation2.moves.push({ san: move.san, variations: [] });
          } else if (existingMove.san !== move.san) {
            // Different move exists - create third-level variation
            console.log('📝 Creating third-level variation (different move)');
            const parentMoveIndex = effectiveMoveIndex - 1;
            if (parentMoveIndex >= 0) {
              const parentMove = variation2.moves[parentMoveIndex];
              if (!parentMove.variations) {
                parentMove.variations = [];
              }
              parentMove.variations.push({ moves: [{ san: move.san, variations: [] }] });
              // Update path to reflect we're now in this third-level variation
              newPath = [bp1, vi1, bp2, vi2, parentMoveIndex, parentMove.variations.length - 1];
              newMoveIndex = 1;
            }
          } else {
            // Same move exists - don't modify tree, just navigate forward
            console.log('⚠️ Same move already exists - will navigate forward');
            shouldSkipTreeUpdate = true;
            newMoveIndex = effectiveMoveIndex + 1;
          }
        } else if (effectivePath.length === 6) {
          // Adding to third-level variation
          const [bp1, vi1, bp2, vi2, bp3, vi3] = effectivePath;
          const variation1 = newTree.moves[bp1].variations[vi1];
          const variation2 = variation1.moves[bp2].variations[vi2];
          const variation3 = variation2.moves[bp3].variations[vi3];
          
          console.log('📊 Third-level variation state:', {
            currentMoveIndex: effectiveMoveIndex,
            variation3Length: variation3.moves.length,
            existingMoveAtIndex: variation3.moves[effectiveMoveIndex]?.san,
            newMove: move.san
          });
          
          // Check if there's already a different move at this position
          const existingMove = variation3.moves[effectiveMoveIndex];
          
          if (!existingMove) {
            // No move at this position - appending at end
            console.log('📝 Appending to third-level variation');
            variation3.moves.push({ san: move.san, variations: [] });
          } else if (existingMove.san !== move.san) {
            // Different move exists - create fourth-level variation
            console.log('📝 Creating fourth-level variation (different move)');
            const parentMoveIndex = effectiveMoveIndex - 1;
            if (parentMoveIndex >= 0) {
              const parentMove = variation3.moves[parentMoveIndex];
              if (!parentMove.variations) {
                parentMove.variations = [];
              }
              parentMove.variations.push({ moves: [{ san: move.san, variations: [] }] });
              // Note: Fourth level would need path length 8, not implementing full navigation for now
              console.log('⚠️ Fourth-level created but full navigation not yet implemented');
            }
          } else {
            // Same move exists - don't modify tree, just navigate forward
            console.log('⚠️ Same move already exists - will navigate forward');
            shouldSkipTreeUpdate = true;
            newMoveIndex = effectiveMoveIndex + 1;
          }
        }
        
        // If we're just navigating to an existing move, don't modify the tree
        if (shouldSkipTreeUpdate) {
          return prevTree; // Return unchanged tree
        }
        
        return newTree;
      });
      
      console.log('🔄 Updated path:', newPath, 'moveIndex:', newMoveIndex);
      
      // Update game state
      setGame(gameCopy);
      // Clear preview when making a move
      if (previewPositionRef.current) {
        console.log('🧹 Clearing preview due to move being made');
        isPreviewingRef.current = false;
        setPreviewPosition(null);
      }
      
      setBoardPosition(gameCopy.fen());
      setCurrentPath(newPath);
      setCurrentMoveIndex(newMoveIndex);
      setRefreshKey(prev => prev + 1);
      
      // Check if game is over after user move
      if (gameCopy.game_over()) {
        if (botMode) {
          setBotMode(false);
          if (gameCopy.in_checkmate()) {
            // The side to move lost (checkmated)
            const loserColor = gameCopy.turn() === 'w' ? 'white' : 'black';
            setBotGameResult(loserColor === botColor ? 'Bot wins!' : 'You win!');
          } else if (gameCopy.in_stalemate()) {
            setBotGameResult('Stalemate - Draw!');
          } else if (gameCopy.in_draw()) {
            setBotGameResult('Draw!');
          }
        }
        return true;
      }
      
      // In bot mode, trigger bot move after user move (if game not over)
      if (botMode && !gameCopy.game_over()) {
        console.log('🤖 User move completed, triggering bot move');
        // Small delay to ensure state is updated
        setTimeout(() => {
          makeBotMove().catch(err => {
            console.error('❌ Error in makeBotMove after user move:', err);
            setPgnError(`Bot move failed: ${err.message || 'Unknown error'}`);
          });
        }, 200);
      }
      
      return true;
    } catch (error) {
      console.error('Invalid move:', error);
      return false;
    }
  }, [boardPosition, currentPath, currentMoveIndex, getParentContext, botMode, makeBotMove, botColor]);

  /**
   * Go back one move - properly handles editor origin and variations
   */
  const goBack = useCallback(() => {
    console.log('⬅️ GO BACK - currentPath:', currentPath, 'currentMoveIndex:', currentMoveIndex, 'startingFen:', startingFen);
    
    // Check if we're at the origin (moveIndex 0, no parent variation)
    const isAtOrigin = currentMoveIndex === 0 && currentPath.length === 0;
    
    if (isAtOrigin) {
      console.log('⬅️ Already at origin (editor starting position) - cannot go back');
      return; // At origin, do nothing
    }
    
    if (currentMoveIndex > 0) {
      // We're not at the start of current line, just go back one move in the same line
      console.log('⬅️ Going back within current line/variation from move', currentMoveIndex, 'to', currentMoveIndex - 1);
      navigateToPosition(currentPath, currentMoveIndex - 1);
    } else if (currentMoveIndex === 0 && currentPath.length > 0) {
      // We're at the start of a variation, go back to the parent line
      console.log('⬅️ At start of variation, returning to parent');
      
      if (currentPath.length === 2 && currentPath[0] === -1) {
        // Root-level variation, go to mainline start (origin)
        navigateToPosition([], 0);
      } else if (currentPath.length === 2) {
        // First-level variation, go to parent move in mainline
        const parentMoveIndex = currentPath[0];
        navigateToPosition([], parentMoveIndex);
      } else if (currentPath.length === 4 && currentPath[0] === -1) {
        // Sub-variation of root-level variation
        const parentPath = [-1, currentPath[1]];
        const parentMoveIndex = currentPath[2];
        navigateToPosition(parentPath, parentMoveIndex);
      } else if (currentPath.length === 4) {
        // Second-level variation, go to parent variation
        const parentPath = [currentPath[0], currentPath[1]];
        const parentMoveIndex = currentPath[2];
        navigateToPosition(parentPath, parentMoveIndex);
      } else if (currentPath.length === 6) {
        // Third-level variation, go to parent variation
        const parentPath = [currentPath[0], currentPath[1], currentPath[2], currentPath[3]];
        const parentMoveIndex = currentPath[4];
        navigateToPosition(parentPath, parentMoveIndex);
      }
    }
  }, [currentPath, currentMoveIndex, navigateToPosition, startingFen]);
  
  // Check if Back button should be disabled (at origin)
  const isBackDisabled = useMemo(() => {
    return currentMoveIndex === 0 && currentPath.length === 0;
  }, [currentMoveIndex, currentPath]);
  
  // Check if Forward button should be disabled (at end of current line)
  const isForwardDisabled = useMemo(() => {
    let maxMoves = 0;
    
    if (currentPath.length === 0) {
      maxMoves = tree.moves.length;
    } else if (currentPath.length === 2 && currentPath[0] === -1) {
      maxMoves = tree.variations?.[currentPath[1]]?.moves?.length || 0;
    } else if (currentPath.length === 4 && currentPath[0] === -1) {
      const variation1 = tree.variations?.[currentPath[1]];
      maxMoves = variation1?.moves?.[currentPath[2]]?.variations?.[currentPath[3]]?.moves?.length || 0;
    } else if (currentPath.length === 2) {
      maxMoves = tree.moves[currentPath[0]]?.variations?.[currentPath[1]]?.moves?.length || 0;
    } else if (currentPath.length === 4) {
      const variation1 = tree.moves[currentPath[0]]?.variations?.[currentPath[1]];
      maxMoves = variation1?.moves?.[currentPath[2]]?.variations?.[currentPath[3]]?.moves?.length || 0;
    } else if (currentPath.length === 6) {
      const variation1 = tree.moves[currentPath[0]]?.variations?.[currentPath[1]];
      const variation2 = variation1?.moves?.[currentPath[2]]?.variations?.[currentPath[3]];
      maxMoves = variation2?.moves?.[currentPath[4]]?.variations?.[currentPath[5]]?.moves?.length || 0;
    }
    
    return currentMoveIndex >= maxMoves;
  }, [currentPath, currentMoveIndex, tree]);

  /**
   * Go forward one move (EXACT COPY from SimplifiedChessBoardPage)
   */
  const goForward = useCallback(() => {
    console.log('➡️ GO FORWARD - currentPath:', currentPath, 'currentMoveIndex:', currentMoveIndex);
    
    // Get max moves for current line/variation
    let maxMoves = 0;
    
    if (currentPath.length === 0) {
      // Mainline
      maxMoves = tree.moves.length;
    } else if (currentPath.length === 2 && currentPath[0] === -1) {
      // Root-level variation
      maxMoves = tree.variations?.[currentPath[1]]?.moves?.length || 0;
    } else if (currentPath.length === 4 && currentPath[0] === -1) {
      // Sub-variation within root-level variation
      const variation1 = tree.variations?.[currentPath[1]];
      maxMoves = variation1?.moves?.[currentPath[2]]?.variations?.[currentPath[3]]?.moves?.length || 0;
    } else if (currentPath.length === 2) {
      // First-level variation
      maxMoves = tree.moves[currentPath[0]]?.variations?.[currentPath[1]]?.moves?.length || 0;
    } else if (currentPath.length === 4) {
      // Second-level variation
      const variation1 = tree.moves[currentPath[0]]?.variations?.[currentPath[1]];
      maxMoves = variation1?.moves?.[currentPath[2]]?.variations?.[currentPath[3]]?.moves?.length || 0;
    } else if (currentPath.length === 6) {
      // Third-level variation
      const variation1 = tree.moves[currentPath[0]]?.variations?.[currentPath[1]];
      const variation2 = variation1?.moves?.[currentPath[2]]?.variations?.[currentPath[3]];
      maxMoves = variation2?.moves?.[currentPath[4]]?.variations?.[currentPath[5]]?.moves?.length || 0;
    }
    
    console.log('➡️ maxMoves:', maxMoves, 'currentMoveIndex:', currentMoveIndex);
    
    if (currentMoveIndex < maxMoves) {
      console.log('➡️ Moving forward within current line/variation');
      navigateToPosition(currentPath, currentMoveIndex + 1);
    } else {
      console.log('➡️ Already at end of current line/variation');
    }
  }, [currentPath, currentMoveIndex, tree, navigateToPosition]);

  /**
   * Go to start - always goes to the origin (editor starting position)
   */
  const goToStart = useCallback(() => {
    // Always navigate to mainline origin (moveIndex 0, empty path)
    // This is the editor-origin FEN position
    console.log('⏮️ Going to start (origin)');
    navigateToPosition([], 0);
  }, [navigateToPosition]);

  /**
   * Go to end (EXACT COPY from SimplifiedChessBoardPage)
   */
  const goToEnd = useCallback(() => {
    let maxMoves = 0;
    
    if (currentPath.length === 0) {
      maxMoves = tree.moves.length;
    } else if (currentPath.length === 2 && currentPath[0] === -1) {
      // Root-level variation
      maxMoves = tree.variations?.[currentPath[1]]?.moves?.length || 0;
    } else if (currentPath.length === 4 && currentPath[0] === -1) {
      // Sub-variation within root-level variation
      const variation1 = tree.variations?.[currentPath[1]];
      maxMoves = variation1?.moves?.[currentPath[2]]?.variations?.[currentPath[3]]?.moves?.length || 0;
    } else if (currentPath.length === 2) {
      maxMoves = tree.moves[currentPath[0]]?.variations?.[currentPath[1]]?.moves?.length || 0;
    } else if (currentPath.length === 4) {
      const variation1 = tree.moves[currentPath[0]]?.variations?.[currentPath[1]];
      maxMoves = variation1?.moves?.[currentPath[2]]?.variations?.[currentPath[3]]?.moves?.length || 0;
    } else if (currentPath.length === 6) {
      const variation1 = tree.moves[currentPath[0]]?.variations?.[currentPath[1]];
      const variation2 = variation1?.moves?.[currentPath[2]]?.variations?.[currentPath[3]];
      maxMoves = variation2?.moves?.[currentPath[4]]?.variations?.[currentPath[5]]?.moves?.length || 0;
    }
    
    navigateToPosition(currentPath, maxMoves);
  }, [currentPath, tree, navigateToPosition]);

  /**
   * Reset the game
   */
  const reset = useCallback(() => {
    const newGame = new Chess(startingFen);
    setGame(newGame);
    setBoardPosition(newGame.fen());
    setTree({ moves: [], variations: [] });
    setCurrentPath([]);
    setCurrentMoveIndex(0);
    setBotMode(false);
    setBotGameResult(null);
    setPgnError('');
  }, [startingFen]);

  /**
   * Start bot game - preserves current position
   */
  const startBotGame = useCallback(() => {
    try {
      // Validate current position FEN
      const currentGame = new Chess(boardPosition);
      
      // Check if position is terminal (game over)
      if (currentGame.game_over()) {
        let message = '';
        if (currentGame.in_checkmate()) {
          message = 'Cannot start bot game: Position is already checkmated.';
        } else if (currentGame.in_stalemate()) {
          message = 'Cannot start bot game: Position is stalemated.';
        } else if (currentGame.in_draw()) {
          message = 'Cannot start bot game: Position is a draw.';
        } else {
          message = 'Cannot start bot game: Game is already over.';
        }
        setPgnError(message);
        console.error('❌', message);
        return;
      }

      // Check if there are legal moves
      const legalMoves = currentGame.moves();
      if (legalMoves.length === 0) {
        setPgnError('Cannot start bot game: No legal moves available.');
        console.error('❌ No legal moves available');
        return;
      }

      // Detect side to move from FEN
      const currentTurn = currentGame.turn(); // 'w' or 'b'
      
      // Assign bot to the side that needs to move
      // User plays the opposite side
      const botColorNew = currentTurn === 'w' ? 'white' : 'black';
      const userColor = botColorNew === 'white' ? 'black' : 'white';
      
      console.log('🤖 Starting bot game from current position');
      console.log('🤖 Current FEN:', boardPosition);
      console.log('🤖 Side to move:', currentTurn === 'w' ? 'white' : 'black');
      console.log('🤖 Bot assigned to:', botColorNew);
      console.log('🤖 User plays:', userColor);
      
      setBotColor(botColorNew);
      setBotMode(true);
      setBotGameResult(null);
      setPgnError('');
      
      // Preserve current position - DO NOT reset board or notation
      // The board and notation stay exactly as they are
      // We just enable bot mode to continue from here
      
      // Check if we're at the initial position (optional - for user info)
      const isInitialPosition = boardPosition === DEFAULT_STARTING_FEN || 
                                boardPosition === startingFen;
      
      if (isInitialPosition) {
        console.log('🤖 Starting from initial position - normal new game vs bot');
      } else {
        console.log('🤖 Starting from mid-game position - continuing from current position');
      }
      
      // If it's the bot's turn, make the bot move immediately
      if (currentTurn === (botColorNew === 'white' ? 'w' : 'b')) {
        console.log('🤖 Bot to move - triggering first move');
        setTimeout(() => {
          makeBotMove().catch(err => {
            console.error('❌ Error in makeBotMove from startBotGame:', err);
            setPgnError(`Bot move failed: ${err.message || 'Unknown error'}`);
            setBotMode(false);
          });
        }, 500);
      } else {
        console.log('🤖 User to move - waiting for user input');
      }
      
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('❌ Error starting bot game:', error);
      setPgnError('Failed to start bot game: Invalid position. Please check the board.');
    }
  }, [boardPosition, startingFen, DEFAULT_STARTING_FEN, makeBotMove]);

  /**
   * Stop bot game
   */
  const stopBotGame = useCallback(() => {
    setBotMode(false);
    setBotGameResult(null);
    setIsBotThinking(false);
  }, []);

  const renderNotation = () => (
    <AnalysisNotation
      tree={tree}
      currentPath={currentPath}
      currentMoveIndex={currentMoveIndex}
      onNavigate={navigateToPosition}
    />
  );

  // Check if desktop for responsive board sizing
  useEffect(() => {
    const checkDesktop = () => {
      const width = window.innerWidth;
      setWindowWidth(width);
      setIsDesktop(width >= 1024);
    };
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  // Keyboard navigation with arrow keys
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Don't handle arrow keys if user is typing in an input field
      const activeElement = document.activeElement;
      const isInputActive = activeElement && (
        activeElement.tagName === 'INPUT' ||
        activeElement.tagName === 'TEXTAREA' ||
        activeElement.isContentEditable
      );

      if (isInputActive) {
        return; // Let the input handle the key
      }

      // Handle arrow keys for move navigation
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        if (!isBackDisabled) {
          goBack();
        }
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        if (!isForwardDisabled) {
          goForward();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [goBack, goForward, isBackDisabled, isForwardDisabled]);

  // Subscribe to new LichessAnalysisEngine state
  useEffect(() => {
    const unsubscribeState = lichessAnalysisEngine.onStateUpdate((state) => {
      setIsAnalyzing(state.isRunning);
      setEngineError(state.error);
      setCurrentAnalysisDepth(state.depth);
      
      // Convert StreamedPV[] to EngineMove[]
      if (state.pvs && state.pvs.length > 0) {
        const convertedLines = state.pvs
          .map((pv) => ({
            move: pv.pv && pv.pv.length > 0 ? pv.pv[0] : '',
            evaluation: {
              type: pv.evaluation.type,
              value: pv.evaluation.value,
              depth: pv.depth,
              nodes: pv.nodes || 0,
              time: pv.latency_ms || 0,
              pv: pv.pv || []
            },
            pv: pv.pv || [],
            depth: pv.depth,
            nodes: pv.nodes || 0,
            time: pv.latency_ms || 0
          }))
          // Remove duplicates based on the first move and PV sequence
          .filter((line, index, self) => {
            // Find first occurrence of this move
            const firstIndex = self.findIndex(other => 
              other.move === line.move && 
              JSON.stringify(other.pv) === JSON.stringify(line.pv)
            );
            return index === firstIndex;
          });
        setEngineLines(convertedLines);
        
        // Update evaluation bar from line #1
        const firstPV = state.pvs[0];
        if (firstPV.evaluation) {
          const evalValue = firstPV.evaluation.type === 'mate'
            ? (firstPV.evaluation.value > 0 ? 10000 : -10000)
            : firstPV.evaluation.value;
          setEngineEvaluation({
            type: firstPV.evaluation.type,
            value: evalValue,
            depth: firstPV.depth
          });
        }
      } else {
        setEngineLines([]);
        if (!state.isRunning) {
          setEngineEvaluation(null);
        }
      }
    });

    const unsubscribeError = lichessAnalysisEngine.onError((error) => {
      setEngineError(error.message);
    });

    return () => {
      unsubscribeState();
      unsubscribeError();
    };
  }, []);
  
  // Handle FEN-only navigation (from Board Editor, no PGN)
  useEffect(() => {
    // Only handle FEN-only if there's no PGN and FEN is provided
    if (decodedPgn) {
      return; // PGN handling is done in the next useEffect
    }
    
    if (!queryFen) {
      console.log('📝 No FEN and no PGN in URL parameters - using default starting position');
      return;
    }
    
    try {
      console.log('🎯 ===== LOADING FEN-ONLY FROM URL (Editor Origin) =====');
      console.log('🎯 Raw FEN from URL:', queryFen);
      
      // Validate FEN
      const testGame = new Chess(queryFen);
      console.log('✅ FEN is valid');
      console.log('🎯 Turn to move:', testGame.turn() === 'w' ? 'White' : 'Black');
      console.log('🎯 Legal moves:', testGame.moves().length);
      
      // Set starting FEN to the editor-origin FEN
      // This is critical: the starting position is the editor FEN, not DEFAULT_STARTING_FEN
      setStartingFen(queryFen);
      setGame(testGame);
      setBoardPosition(queryFen);
      setCurrentPath([]);
      setCurrentMoveIndex(0); // Start at origin (the editor FEN position)
      setTree({ moves: [], variations: [] }); // Empty tree - moves will be added as user plays
      setRefreshKey(prev => prev + 1);
      
      console.log('✅ Editor-origin FEN loaded successfully');
      console.log('✅ Starting FEN set to:', queryFen);
      console.log('✅ Current move index: 0 (at origin)');
      console.log('🎯 ===== FEN-ONLY LOADING COMPLETE =====');
    } catch (error) {
      console.error('❌ Error loading FEN from URL:', error);
      console.error('❌ Error details:', error.message);
      setPgnError('Failed to load position: Invalid FEN. Please check the board editor.');
    }
  }, [queryFen, decodedPgn]);
  
  // Load PGN from URL parameters
  useEffect(() => {
    if (!decodedPgn) {
      console.log('📝 No PGN in URL parameters');
      return;
    }

    // Validate PGN is not empty
    if (!decodedPgn.trim()) {
      console.error('❌ PGN is empty after decoding');
      return;
    }

    try {
      console.log('📝 Loading PGN from URL (decoded)');
      console.log('📝 PGN length:', decodedPgn.length);
      console.log('📝 PGN first 200 chars:', decodedPgn.substring(0, 200));
      console.log('📝 PGN last 200 chars:', decodedPgn.substring(Math.max(0, decodedPgn.length - 200)));

      // Helper to support chess.js API variations
      const loadPgnIntoGame = (gameInstance, pgn) => {
        if (typeof gameInstance.load_pgn === 'function') {
          return gameInstance.load_pgn(pgn);
        }
        if (typeof gameInstance.loadPgn === 'function') {
          return gameInstance.loadPgn(pgn);
        }
        console.error('❌ Chess.js instance does not support load_pgn/loadPgn');
        return false;
      };

      // Load PGN - if it contains a FEN tag, use that as starting position
      // Otherwise, use the starting FEN from URL (editor origin) or default
      const pgnStartingFenFromTag = pgnStartingFen || effectiveStartingFen;
      const pgnGame = new Chess(pgnStartingFenFromTag);
      const loadSuccess = loadPgnIntoGame(pgnGame, decodedPgn);

      if (!loadSuccess) {
        console.error('❌ Failed to load PGN into Chess.js');
        console.error('❌ PGN that failed (first 500 chars):', decodedPgn.substring(0, 500));
        // Show user-visible error
        alert('Error: Could not parse PGN. The game notation may be corrupted.');
        return;
      }

      const history = pgnGame.history({ verbose: true });
      
      if (!history || history.length === 0) {
        console.error('❌ No moves found in PGN');
        alert('Error: No moves found in PGN.');
        return;
      }

      const moves = history.map(move => ({
        san: move.san,
        variations: [],
      }));

      console.log('📝 Parsed moves from PGN:', moves.length);
      console.log('📝 First few moves:', moves.slice(0, 5).map(m => m.san));
      console.log('📝 Last few moves:', moves.slice(-5).map(m => m.san));

      // Set starting FEN from PGN (if it has a FEN tag) or use editor origin
      if (pgnStartingFen) {
        setStartingFen(pgnStartingFen);
        console.log('✅ Starting FEN set from PGN tag:', pgnStartingFen);
      } else if (queryStartFen) {
        setStartingFen(queryStartFen);
        console.log('✅ Starting FEN set from startFen param:', queryStartFen);
      } else {
        // Use editor origin FEN (fen-only mode) or default start
        setStartingFen(!decodedPgn && queryFen ? queryFen : DEFAULT_STARTING_FEN);
        console.log('✅ Starting FEN set to:', (!decodedPgn && queryFen ? queryFen : DEFAULT_STARTING_FEN));
      }
      
      // Update the tree with all moves from PGN - this populates the Game Notation panel
      setTree({ moves, variations: [] });
      console.log('✅ Tree updated with', moves.length, 'moves');

      // Determine target move index
      let targetMoveIndex = history.length;
      const actualStartingFen = pgnStartingFen || queryStartFen || DEFAULT_STARTING_FEN;

      if (queryMoveIndex !== null && !Number.isNaN(queryMoveIndex)) {
        targetMoveIndex = Math.max(0, Math.min(queryMoveIndex, history.length));
        console.log('📝 Using moveIndex from URL:', targetMoveIndex);
      } else if (queryFen) {
        // Replay moves from the actual starting FEN to find matching FEN
        const tempGame = new Chess(actualStartingFen);
        for (let i = 0; i < history.length; i++) {
          tempGame.move(history[i]);
          if (tempGame.fen() === queryFen) {
            targetMoveIndex = i + 1;
            console.log('📝 Found matching FEN at move index:', targetMoveIndex);
            break;
          }
        }
      }

      // Replay moves to get to target position
      const positionGame = new Chess(actualStartingFen);
      for (let i = 0; i < targetMoveIndex && i < history.length; i++) {
        positionGame.move(history[i]);
      }

      setGame(positionGame);
      setCurrentPath([]);
      setBoardPosition(positionGame.fen());
      setCurrentMoveIndex(targetMoveIndex);
      setRefreshKey(prev => prev + 1);

      console.log('✅ PGN loaded successfully');
      console.log('✅ Tree moves count:', moves.length);
      console.log('✅ Target move index:', targetMoveIndex);
      console.log('✅ Board position:', positionGame.fen());
      console.log('✅ Game Notation panel should now show', moves.length, 'moves');
    } catch (error) {
      console.error('❌ Error loading PGN from URL:', error);
      console.error('❌ Error stack:', error.stack);
      alert('Error loading PGN: ' + error.message);
    }
  }, [decodedPgn, queryFen, queryMoveIndex, DEFAULT_STARTING_FEN, queryStartFen]);
  
  // Save analysis enabled state to localStorage
  useEffect(() => {
    localStorage.setItem('chessrep-analysis-enabled', JSON.stringify(isAnalysisEnabled));
  }, [isAnalysisEnabled]);

  // Auto-start engine analysis when enabled (using new LichessAnalysisEngine)
  useEffect(() => {
    if (!isAnalysisEnabled || !boardPosition) {
      lichessAnalysisEngine.stopAnalysis();
      return;
    }

    // Validate FEN before sending to analysis engine
    try {
      if (typeof boardPosition !== 'string' || boardPosition.trim() === '') {
        console.error('❌ Invalid FEN: not a string or empty', boardPosition);
        setEngineError('Invalid FEN: empty or not a string');
        return;
      }

      const tempGame = new Chess(boardPosition);
      const validatedFen = tempGame.fen();
      if (!validatedFen || validatedFen.trim() === '') {
        console.error('❌ Invalid FEN: validation returned empty', boardPosition);
        setEngineError('Invalid FEN: validation failed');
        return;
      }
      
      console.log('✅ FEN validated:', validatedFen);
    } catch (error) {
      console.error('❌ Invalid FEN:', boardPosition, error);
      setEngineError(`Invalid FEN: ${error.message || 'FEN validation failed'}`);
      return;
    }

    // Generate node ID from current position and path
    const nodeId = `${boardPosition}-${JSON.stringify(currentPath)}-${currentMoveIndex}`;
    
    // Check if we should cancel due to node change
    if (lichessAnalysisEngine.shouldCancelForNode(boardPosition, nodeId, currentPath)) {
      lichessAnalysisEngine.stopAnalysis();
    }

    // Clear any previous errors
    setEngineError(null);

    // Test backend connection first
    fetch('http://localhost:3001/api/health')
      .then(res => res.json())
      .then(data => {
        console.log('✅ Backend health check:', data);
      })
      .catch(err => {
        console.error('❌ Backend health check failed:', err);
        setEngineError('Cannot connect to backend server. Make sure it is running on port 3001.');
        return; // Don't proceed if backend is down
      });

    // Also test direct HTTP analysis endpoint to see what error we get
    console.log('🧪 Testing direct HTTP analysis endpoint...');
    fetch('http://localhost:3001/api/analysis/position', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fen: boardPosition,
        depth: analysisSettings.depthCap || 20,
        multiPV: analysisSettings.multiPV || 3,
        timeLimit: analysisSettings.timeLimit || 750
      })
    })
      .then(async (res) => {
        const text = await res.text();
        console.log('🧪 Direct HTTP test response status:', res.status);
        console.log('🧪 Direct HTTP test response:', text);
        try {
          const json = JSON.parse(text);
          console.log('🧪 Direct HTTP test parsed JSON:', json);
          if (!res.ok) {
            setEngineError(`Backend error: ${json.message || json.error || text}`);
          }
        } catch (e) {
          console.log('🧪 Direct HTTP test response is not JSON:', text);
        }
      })
      .catch(err => {
        console.error('❌ Direct HTTP test failed:', err);
      });

    // Start analysis with current settings
    console.log('📊 Starting analysis for FEN:', boardPosition);
    console.log('📊 FEN type:', typeof boardPosition);
    console.log('📊 FEN length:', boardPosition ? boardPosition.length : 'null/undefined');
    console.log('📊 Analysis settings:', {
      multiPV: analysisSettings.multiPV || 3,
      pvLength: analysisSettings.pvLength || 10,
      depthCap: analysisSettings.depthCap || 20,
      timeLimit: analysisSettings.timeLimit || 750
    });
    console.log('📊 Node ID:', nodeId);
    console.log('📊 Current path:', currentPath);
    
    try {
      const result = lichessAnalysisEngine.startAnalysis(
        boardPosition,
        {
          multiPV: analysisSettings.multiPV || 3,
          pvLength: analysisSettings.pvLength || 10,
          depthCap: analysisSettings.depthCap || 20,
          timeLimit: analysisSettings.timeLimit || 750
        },
        nodeId,
        currentPath
      );
      console.log('📊 Analysis start call completed, result:', result);
      
      // If it returns a promise, handle it
      if (result && typeof result.then === 'function') {
        result.catch((error) => {
          console.error('❌ Analysis start promise rejected:', error);
          setEngineError(`Failed to start analysis: ${error.message}`);
        });
      }
    } catch (error) {
      console.error('❌ Error calling startAnalysis:', error);
      console.error('❌ Error stack:', error.stack);
      setEngineError(`Failed to start analysis: ${error.message}`);
    }

    return () => {
      // Cancel analysis when position changes or component unmounts
      lichessAnalysisEngine.stopAnalysis();
    };
  }, [boardPosition, currentPath, currentMoveIndex, isAnalysisEnabled, analysisSettings.multiPV, analysisSettings.pvLength, analysisSettings.depthCap, analysisSettings.timeLimit]);

  // Trigger bot move immediately when bot mode is enabled and it's bot's turn
  useEffect(() => {
    if (!botMode || isBotThinking) return;
    
    try {
      const tempGame = new Chess(boardPosition);
      const currentTurn = tempGame.turn();
      const botColorCode = botColor === 'white' ? 'w' : 'b';
      const isBotTurn = currentTurn === botColorCode;
      
      // Only trigger if game is not over and it's bot's turn
      if (isBotTurn && !tempGame.game_over()) {
        console.log('🤖 Bot mode enabled and bot to move - triggering move');
        console.log('🤖 Current FEN:', boardPosition);
        console.log('🤖 Bot color:', botColor, 'Current turn:', currentTurn);
        
        // Small delay to ensure state is stable
        const timeoutId = setTimeout(() => {
          makeBotMove().catch(err => {
            console.error('❌ Error in makeBotMove from useEffect:', err);
            setPgnError(`Bot move failed: ${err.message || 'Unknown error'}`);
          });
        }, 300);
        
        return () => clearTimeout(timeoutId);
      }
    } catch (error) {
      console.error('❌ Error in bot move trigger useEffect:', error);
      setPgnError(`Failed to check bot turn: ${error.message || 'Unknown error'}`);
    }
  }, [botMode, boardPosition, botColor, isBotThinking, makeBotMove]);
  
  // Load opening data
  useEffect(() => {
    loadOpeningData(boardPosition);
  }, [boardPosition]);
  
  const loadOpeningData = async (fen) => {
    try {
      const response = await fetch(`https://explorer.lichess.ovh/masters?fen=${encodeURIComponent(fen)}`);
      const data = await response.json();
      
      if (data.opening) {
        setOpeningName(data.opening.name || '');
      }
      
      if (data.moves && data.moves.length > 0) {
        const processedMoves = data.moves.slice(0, 10).map(move => ({
          san: move.san,
          uci: move.uci,
          white: move.white,
          draws: move.draws,
          black: move.black,
          total: move.white + move.draws + move.black,
          whiteWinRate: Math.round((move.white / (move.white + move.draws + move.black)) * 100),
          drawRate: Math.round((move.draws / (move.white + move.draws + move.black)) * 100),
          averageRating: move.averageRating || 2400
        }));
        setOpeningMoves(processedMoves);
      } else {
        setOpeningMoves([]);
      }
    } catch (error) {
      console.error('Error loading opening data:', error);
      setOpeningMoves([]);
    }
  };
  
  // Legacy analyzePosition removed - now using LichessAnalysisEngine
  // This function is kept for backward compatibility but is no longer used
  const analyzePosition = async () => {
    // Deprecated - analysis is now handled by LichessAnalysisEngine via useEffect
    console.warn('⚠️ analyzePosition is deprecated - analysis is now automatic via LichessAnalysisEngine');
  };
  
  // Legacy code removed - analysis is now handled by LichessAnalysisEngine

  // Handle adopting a full PV line - ONLY PLAY FIRST MOVE for engine suggestions
  const handleAdoptLine = useCallback((moves) => {
    console.log('🎯 handleAdoptLine called with moves:', moves);
    if (!moves || moves.length === 0) return;

    // For engine suggestions, only play the first move
    const gameCopy = new Chess(boardPosition);
    
    if (moves.length > 0) {
      try {
        const firstMove = gameCopy.move(moves[0], { sloppy: true });
        if (firstMove) {
          // Use onPieceDrop to apply only the first move
          onPieceDrop(firstMove.from, firstMove.to);
        }
      } catch (error) {
        console.warn('Error applying first move:', error);
      }
    }
  }, [boardPosition, onPieceDrop]);

  // Handle previewing a line (temporary board visualization)
  const [previewPosition, setPreviewPosition] = useState(null);
  const previewPositionRef = useRef(null);
  const isPreviewingRef = useRef(false);
  const previewTimeoutRef = useRef(null);
  
  // Sync ref with state
  useEffect(() => {
    previewPositionRef.current = previewPosition;
  }, [previewPosition]);
  
  const handlePreviewLine = useCallback((moves, isPreviewing) => {
    console.log('🎯 handlePreviewLine called:', { moves, isPreviewing });
    
    // Clear any existing timeout
    if (previewTimeoutRef.current) {
      clearTimeout(previewTimeoutRef.current);
      previewTimeoutRef.current = null;
    }
    
    if (!isPreviewing || !moves || moves.length === 0) {
      isPreviewingRef.current = false;
      setPreviewPosition(null);
      return;
    }

    isPreviewingRef.current = true;

    // Create a temporary game to calculate preview position
    const tempGame = new Chess(boardPosition);
    let lastValidFEN = boardPosition;

    for (const moveSan of moves) {
      try {
        const move = tempGame.move(moveSan, { sloppy: true });
        if (move) {
          lastValidFEN = tempGame.fen();
        } else {
          break;
        }
      } catch (error) {
        break;
      }
    }

    setPreviewPosition(lastValidFEN);
  }, [boardPosition]);

  // Clear preview when board position changes (unless actively previewing)
  useEffect(() => {
    // Only clear if we're not actively previewing
    if (!isPreviewingRef.current && previewPosition) {
      console.log('🧹 Clearing preview due to board position change');
      setPreviewPosition(null);
    }
  }, [boardPosition]); // Only depend on boardPosition, not previewPosition

  // Get arrows to display on board
  const getBoardArrows = useCallback(() => {
    if (previewPosition) return [];
    
    const arrows = [];
    
    // Show arrow for hovered opening move (if any)
    if (hoveredOpeningMove) {
      try {
        const game = new Chess(boardPosition);
        const moveObj = game.move(hoveredOpeningMove, { sloppy: true });
        if (moveObj) {
          arrows.push({
            from: moveObj.from,
            to: moveObj.to,
            color: '#10b981' // Green arrow for opening move
          });
          // Undo the move to restore position
          game.undo();
        }
      } catch (error) {
        console.warn('Error getting opening move arrow:', error);
      }
    }
    
    // Only show best move arrow if no opening move is hovered
    if (arrows.length === 0) {
      const engineState = lichessAnalysisEngine.getState();
      if (engineState.pvs && engineState.pvs.length > 0) {
        const firstPV = engineState.pvs[0];
        if (firstPV.pv && firstPV.pv.length > 0) {
          try {
            const game = new Chess(boardPosition);
            const firstMoveSan = firstPV.pv[0];
            const moveObj = game.move(firstMoveSan, { sloppy: true });
            
            if (moveObj) {
              arrows.push({
                from: moveObj.from,
                to: moveObj.to,
                color: '#3b82f6' // Blue arrow for best move
              });
            }
          } catch (error) {
            console.warn('Error getting best move arrow:', error);
          }
        }
      }
    }
    
    return arrows;
  }, [boardPosition, previewPosition, hoveredOpeningMove]);

  // Handle inserting PV as variation
  const handleInsertAsVariation = useCallback((moves) => {
    console.log('🎯 handleInsertAsVariation called with moves:', moves);
    // For now, just adopt the line (variation insertion would need more complex tree manipulation)
    handleAdoptLine(moves);
  }, [handleAdoptLine]);

  // Board resize handlers (desktop only)
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing) return;
      e.preventDefault();
      // Calculate new size based on mouse position relative to the board container
      const boardContainer = document.querySelector('[data-board-container]');
      if (boardContainer) {
        const rect = boardContainer.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const deltaX = e.clientX - resizeStartRef.current.x;
        const newSize = Math.max(300, Math.min(800, resizeStartRef.current.size + deltaX * 2)); // Min 300px, max 800px
        setBoardSize(newSize);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };
    }
  }, [isResizing]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 md:mb-10">
          <div className="relative inline-flex items-center justify-center mb-4">
            <h1 className="px-6 md:px-8 py-2 md:py-3 text-3xl md:text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-blue-900 to-slate-800">
              Analysis Board
            </h1>
          </div>
          <p className="mt-2 md:mt-4 text-sm md:text-lg text-slate-600 max-w-2xl mx-auto">
            Explore variations, evaluate plans, and craft winning strategies with a refined analysis experience.
          </p>
          {queryLabel && (
            <div className="mt-3 md:mt-4 inline-flex items-center px-3 md:px-4 py-1.5 md:py-2 bg-blue-100 border border-blue-300 text-blue-800 rounded-full text-xs md:text-sm font-semibold shadow-sm">
              {queryLabel}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column - Board */}
          <div className="lg:col-span-7 xl:col-span-8">
            <div className="bg-white rounded-xl shadow-lg p-6 relative">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-800">Chess Board</h2>
                <button
                  onClick={() => setBoardOrientation(o => o === 'white' ? 'black' : 'white')}
                  className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm transition-colors"
                >
                  Flip: {boardOrientation}
                </button>
              </div>
              
              <div className="flex justify-center relative" style={{ minHeight: '300px' }} data-board-container>
                <div 
                  className="relative inline-block w-full"
                  style={{ 
                    width: isDesktop ? `${boardSize}px` : '100%',
                    maxWidth: '100%',
                    aspectRatio: '1 / 1'
                  }}
                >
                  <Chessboard
                    key={`board-${refreshKey}`}
                    position={previewPosition || boardPosition}
                    onPieceDrop={onPieceDrop}
                    boardOrientation={boardOrientation}
                    boardWidth={isDesktop ? boardSize : Math.min(windowWidth - 48, 480)}
                    customBoardStyle={{
                      borderRadius: '8px',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                      // Mobile touch optimizations
                      touchAction: 'manipulation', // Better mobile touch handling - allows dragging but prevents double-tap zoom
                      userSelect: 'none', // Prevent text selection on mobile
                      WebkitUserSelect: 'none',
                      MozUserSelect: 'none',
                      msUserSelect: 'none',
                      WebkitTouchCallout: 'none', // Disable iOS callout
                      WebkitTapHighlightColor: 'transparent', // Remove tap highlight
                      cursor: 'pointer' // Ensure cursor shows interaction
                    }}
                    customArrows={getBoardArrows()}
                    areArrowsAllowed={true}
                    arePiecesDraggable={true}
                  />
                  {previewPosition && (
                    <div className="absolute top-2 right-2 bg-yellow-500 text-white px-3 py-1 rounded-lg text-xs font-semibold shadow-lg">
                      Preview Mode
                    </div>
                  )}
                  {/* Resize handle - desktop only */}
                  <div 
                    className="hidden lg:block absolute right-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-blue-500 bg-blue-400 opacity-40 hover:opacity-70 transition-opacity rounded-r-lg"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      resizeStartRef.current = { size: boardSize, x: e.clientX };
                      setIsResizing(true);
                    }}
                    style={{ 
                      touchAction: 'none',
                      zIndex: 10
                    }}
                  />
                </div>
              </div>

              {/* Navigation */}
              <div className="mt-6">
                <div className="flex items-center justify-center space-x-3 bg-gradient-to-r from-gray-100 to-gray-200 p-4 rounded-lg shadow-md">
                  <button
                    onClick={goToStart}
                    disabled={isBackDisabled}
                    className="p-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md"
                    title="Go to start"
                  >
                    <SkipBack className="w-5 h-5" />
                  </button>
                  
                  <button
                    onClick={goBack}
                    disabled={isBackDisabled}
                    className="p-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md"
                    title="Previous move"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  
                  <span className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-mono text-sm min-w-[120px] text-center shadow-md">
                    Move {currentMoveIndex}
                  </span>
                  
                  <button
                    onClick={goForward}
                    disabled={isForwardDisabled}
                    className="p-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md"
                    title="Next move"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                  
                  <button
                    onClick={goToEnd}
                    disabled={isForwardDisabled}
                    className="p-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md"
                    title="Go to end"
                  >
                    <SkipForward className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-4 flex justify-center gap-3 flex-wrap items-center" style={{ position: 'relative', zIndex: 10 }}>
                <button
                  onClick={() => setShowPgnImport(true)}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors shadow-md flex items-center gap-2"
                  style={{ pointerEvents: 'auto' }}
                >
                  <Upload className="w-4 h-4" />
                  Import PGN
                </button>
                {!botMode ? (
                  <>
                    <div className="flex items-center gap-2">
                      <label className="text-sm text-gray-700 font-medium">Bot:</label>
                      <select
                        value={botDifficulty}
                        onChange={(e) => setBotDifficulty(parseInt(e.target.value))}
                        className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        disabled={botMode}
                        style={{ pointerEvents: 'auto' }}
                      >
                        <option value={800}>Beginner (800)</option>
                        <option value={1000}>Casual (1000)</option>
                        <option value={1400}>Intermediate (1400)</option>
                        <option value={1500}>Club (1500)</option>
                        <option value={1800}>Advanced (1800)</option>
                        <option value={2200}>Expert (2200)</option>
                        <option value={2500}>Master (2500)</option>
                      </select>
                    </div>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('🎮 Play vs Bot button clicked');
                        try {
                          startBotGame();
                        } catch (error) {
                          console.error('❌ Error in button click handler:', error);
                          setPgnError(`Failed to start bot game: ${error.message || 'Unknown error'}`);
                        }
                      }}
                      className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 active:bg-green-700 transition-colors shadow-md flex items-center gap-2 cursor-pointer"
                      style={{ 
                        pointerEvents: 'auto',
                        position: 'relative',
                        zIndex: 20,
                        userSelect: 'none',
                        WebkitUserSelect: 'none'
                      }}
                      type="button"
                    >
                      <Play className="w-4 h-4" />
                      Play vs Bot
                    </button>
                  </>
                ) : (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('🛑 Stop Bot button clicked');
                      stopBotGame();
                    }}
                    className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 active:bg-orange-700 transition-colors shadow-md flex items-center gap-2 cursor-pointer"
                      style={{ 
                        pointerEvents: 'auto',
                        position: 'relative',
                        zIndex: 20
                      }}
                      type="button"
                    >
                      <Square className="w-4 h-4" />
                      Stop Bot
                    </button>
                )}
                <button
                  onClick={reset}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors shadow-md"
                  disabled={botMode}
                  style={{ pointerEvents: botMode ? 'none' : 'auto' }}
                >
                  Reset Game
                </button>
              </div>

              {/* Bot Game Status */}
              {botMode && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-blue-800">
                        Playing vs Bot ({botDifficulty} rating)
                      </span>
                      {isBotThinking && (
                        <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" title="Bot is thinking..."></div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-blue-700">
                        Bot: {botColor === 'white' ? 'White' : 'Black'}
                      </span>
                      <span className="text-xs text-blue-600">
                        • You: {botColor === 'white' ? 'Black' : 'White'}
                      </span>
                    </div>
                  </div>
                  {botGameResult && (
                    <div className="mt-2 p-2 bg-yellow-100 border border-yellow-300 rounded text-sm font-semibold text-yellow-800 text-center">
                      {botGameResult}
                    </div>
                  )}
                  {pgnError && !botGameResult && (
                    <div className="mt-2 p-2 bg-red-100 border border-red-300 rounded text-sm text-red-800">
                      {pgnError}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Engine Analysis, Notation, and Opening Explorer */}
          <div className="lg:col-span-5 xl:col-span-4 space-y-6">
            {/* Engine Analysis Panel - Multi-PV */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
              <MultiPVAnalysisPanel
                lines={engineLines}
                currentFEN={boardPosition}
                isAnalyzing={isAnalyzing}
                isAnalysisEnabled={isAnalysisEnabled}
                engineError={engineError}
                onToggleAnalysis={(enabled) => {
                  setIsAnalysisEnabled(enabled);
                }}
                onAdoptLine={handleAdoptLine}
                onPreviewLine={handlePreviewLine}
                onInsertAsVariation={handleInsertAsVariation}
                onSettingsChange={(newSettings) => {
                  setAnalysisSettings(newSettings);
                }}
              />
              
              {/* Evaluation Bar - Synced with Line #1 */}
              {engineEvaluation && (
                <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-gray-800 font-medium">Evaluation</span>
                    <span className={`font-bold ${
                      engineEvaluation.value > 0 ? 'text-green-600' : 
                      engineEvaluation.value < 0 ? 'text-red-600' : 'text-gray-800'
                    }`}>
                      {engineEvaluation.type === 'mate' 
                        ? `M${Math.abs(engineEvaluation.value)}` 
                        : `${engineEvaluation.value > 0 ? '+' : ''}${(engineEvaluation.value / 100).toFixed(1)}`
                      }
                    </span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-300 ${
                        engineEvaluation.value > 0 ? 'bg-green-500' : 
                        engineEvaluation.value < 0 ? 'bg-red-500' : 'bg-gray-400'
                      }`}
                      style={{
                        width: engineEvaluation.type === 'mate' 
                          ? '100%' 
                          : `${Math.min(100, Math.max(0, 50 + (engineEvaluation.value / 100) * 25))}%`
                      }}
                    />
                  </div>
                  <div className="mt-1 text-xs text-gray-600">
                    Depth: {currentAnalysisDepth}
                  </div>
                </div>
              )}
            </div>

            {/* Game Notation Panel - Now under Evaluation */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
              <h3 className="font-semibold text-lg mb-4 flex items-center space-x-2">
                <span>Game Notation</span>
              </h3>
              
              <div className="bg-gray-50 rounded-lg p-4 min-h-[200px] max-h-[400px] overflow-auto border border-gray-200">
                {renderNotation()}
              </div>
            </div>

            {/* Opening Explorer Panel */}
            {openingMoves.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                <h3 
                  className={`font-semibold text-lg mb-3 flex items-center space-x-2 transition-colors duration-300 ${
                    currentMoveIndex > 0 ? 'text-blue-600' : 'text-gray-800'
                  }`}
                >
                  <BookOpen className={`w-5 h-5 ${currentMoveIndex > 0 ? 'text-blue-600' : 'text-green-600'}`} />
                  <span>Opening Explorer</span>
                </h3>
                
                {openingName && (
                  <div className="mb-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 text-blue-800 rounded-lg text-sm font-semibold">
                    {openingName}
                  </div>
                )}
                
                <div className="space-y-2">
                  {openingMoves.map((move, i) => {
                    const handleOpeningMoveClick = () => {
                      try {
                        const gameCopy = new Chess(boardPosition);
                        const moveObj = gameCopy.move(move.san, { sloppy: true });
                        if (moveObj) {
                          onPieceDrop(moveObj.from, moveObj.to);
                        }
                      } catch (error) {
                        console.warn('Error playing opening move:', error);
                      }
                    };
                    
                    return (
                      <div 
                        key={i} 
                        className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm hover:bg-blue-50 transition-colors cursor-pointer"
                        onClick={handleOpeningMoveClick}
                        onMouseEnter={() => setHoveredOpeningMove(move.san)}
                        onMouseLeave={() => setHoveredOpeningMove(null)}
                      >
                        <span className="font-semibold text-gray-800">{move.san}</span>
                        <div className="flex items-center space-x-2 text-xs text-gray-600">
                          <span className="font-medium">W: {move.whiteWinRate}%</span>
                          <span className="font-medium">D: {move.drawRate}%</span>
                          <span className="text-gray-500">({move.total})</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* PGN Import Modal */}
      {showPgnImport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <FileText className="w-6 h-6" />
                Import PGN
              </h2>
              <button
                onClick={() => {
                  setShowPgnImport(false);
                  setPgnText('');
                  setPgnError('');
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              {/* File Input */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload PGN File
                </label>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileInput}
                  accept=".pgn,.txt"
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>

              {/* Or Divider */}
              <div className="flex items-center my-4">
                <div className="flex-1 border-t border-gray-300"></div>
                <span className="px-4 text-sm text-gray-500">or</span>
                <div className="flex-1 border-t border-gray-300"></div>
              </div>

              {/* Text Input */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Paste PGN Text
                </label>
                <textarea
                  value={pgnText}
                  onChange={(e) => {
                    setPgnText(e.target.value);
                    setPgnError('');
                  }}
                  placeholder="Paste your PGN here...&#10;&#10;Example:&#10;[Event &quot;Game&quot;]&#10;[Site &quot;Local&quot;]&#10;[Date &quot;2024.01.01&quot;]&#10;[Round &quot;1&quot;]&#10;[White &quot;Player 1&quot;]&#10;[Black &quot;Player 2&quot;]&#10;[Result &quot;1-0&quot;]&#10;&#10;1. e4 e5 2. Nf3 Nc6 3. Bb5 a6..."
                  className="w-full h-64 p-3 border border-gray-300 rounded-lg font-mono text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Error Message */}
              {pgnError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium">Error</p>
                    <p className="text-sm">{pgnError}</p>
                  </div>
                </div>
              )}

              {/* Info Message */}
              <div className="p-3 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg text-sm">
                <p className="font-medium mb-1">Supported Features:</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>Standard PGN format with move notation</li>
                  <li>PGN headers (Event, Site, Date, etc.)</li>
                  <li>Variations (parentheses)</li>
                  <li>Comments (curly braces)</li>
                  <li>NAGs (annotation symbols)</li>
                  <li>FEN positions</li>
                </ul>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50">
              <button
                onClick={() => {
                  setShowPgnImport(false);
                  setPgnText('');
                  setPgnError('');
                }}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (pgnText.trim()) {
                    loadPgnFromText(pgnText);
                  } else {
                    setPgnError('Please paste PGN text or select a file');
                  }
                }}
                disabled={isLoadingPgn || !pgnText.trim()}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {isLoadingPgn ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Loading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Load PGN
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalysisPage;
