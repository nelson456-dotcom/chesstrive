import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ChevronUp, ChevronDown, SkipBack, SkipForward, Plus, Trash2, RotateCcw, Brain, BookOpen, Bot, Play, Settings, Edit3, Eye, Copy, Download, Upload, Square } from 'lucide-react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import SimpleChessNotation from './SimpleChessNotation';
import stockfishCloudService from '../services/StockfishCloudService';
// import useStockfishEngine from '../hooks/useStockfishEngine.jsx';
// import EngineSuggestionsPanel from './EngineSuggestionsPanel.jsx';

const TOUCH_BOARD_STYLE = {
  touchAction: 'none',
  WebkitUserSelect: 'none',
  userSelect: 'none'
};

// Initial board setup
const initialBoard = [
  ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'],
  ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
  ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R']
];

// Chess piece Unicode mappings
const PIECES = {
  'K': '♔', 'Q': '♕', 'R': '♖', 'B': '♗', 'N': '♘', 'P': '♙',
  'k': '♚', 'q': '♛', 'r': '♜', 'b': '♝', 'n': '♞', 'p': '♟'
};

const pieceSymbols = {
  'K': '♔', 'Q': '♕', 'R': '♖', 'B': '♗', 'N': '♘', 'P': '♙',
  'k': '♚', 'q': '♛', 'r': '♜', 'b': '♝', 'n': '♞', 'p': '♟'
};

const ChessBoard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [game, setGame] = useState(() => new Chess());
  
  // Simple notation state
  const [notationGameTree, setNotationGameTree] = useState({ moves: [] });
  const [notationPosition, setNotationPosition] = useState({ path: [], moveIndex: -1 });

  // Simple move recording function
  const recordMove = useCallback((notation, from, to) => {
    setNotationGameTree(prevTree => {
      const newTree = JSON.parse(JSON.stringify(prevTree));
      
      // Navigate to current line
      let currentLine = newTree.moves;
      for (const step of notationPosition.path) {
        const move = currentLine[step.moveIndex];
        if (!move.variations) {
          move.variations = [];
        }
        if (!move.variations[step.variationIndex]) {
          move.variations[step.variationIndex] = { moves: [] };
        }
        currentLine = move.variations[step.variationIndex].moves;
      }
      
      // Add the move
      currentLine.push({
        notation,
        from,
        to,
        variations: [],
        timestamp: Date.now()
      });
      
      return newTree;
    });
    
    setNotationPosition(prev => ({
      ...prev,
      moveIndex: prev.moveIndex + 1
    }));
  }, [notationPosition]);

  // Simple variation creation
  const createVariation = useCallback(() => {
    if (notationPosition.moveIndex < 0) return false;
    
    setNotationPosition(prev => ({
      path: [...prev.path, { moveIndex: prev.moveIndex, variationIndex: 0 }],
      moveIndex: -1
    }));
    return true;
  }, [notationPosition]);

  // Simple variation exit
  const exitVariation = useCallback(() => {
    if (notationPosition.path.length === 0) return false;
    
    const newPath = notationPosition.path.slice(0, -1);
    const lastStep = notationPosition.path[notationPosition.path.length - 1];
    
    setNotationPosition({
      path: newPath,
      moveIndex: lastStep.moveIndex
    });
    return true;
  }, [notationPosition]);

  // Simple navigation function
  const navigateNotationMove = useCallback((targetIndex) => {
    setNotationPosition(prev => ({
      ...prev,
      moveIndex: targetIndex
    }));
    return true;
  }, []);
  const [boardPosition, setBoardPosition] = useState('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
  const [isBoardUpdating, setIsBoardUpdating] = useState(false);
  const [boardOrientation, setBoardOrientation] = useState('white');
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [currentMove, setCurrentMove] = useState(0);
  
  // PGN state for move history display
  const [pgn, setPgn] = useState('');
  const [moveHistory, setMoveHistory] = useState([]);
  
  // Simple engine state for now
  const [engineSuggestions, setEngineSuggestions] = useState([]);
  const [engineStatus, setEngineStatus] = useState('ready');
  const [engineDebug, setEngineDebug] = useState([]);
  const [engineError, setEngineError] = useState(null);
  
  // Mode state
  const [currentMode, setCurrentMode] = useState('analysis'); // 'analysis', 'editor', 'bot'
  
  // Notation collapse state
  const [collapsedVariations, setCollapsedVariations] = useState(new Set());
  
  // Variation creation state
  const [isCreatingVariation, setIsCreatingVariation] = useState(false);
  const [variationStartMove, setVariationStartMove] = useState(null);
  const [currentVariationPath, setCurrentVariationPath] = useState([]);
  
  // Board editor state
  const [isEditing, setIsEditing] = useState(false);
  const [selectedPiece, setSelectedPiece] = useState('');
  const [editMode, setEditMode] = useState(true);
  const [fenString, setFenString] = useState('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
  const fileInputRef = useRef(null);
  
  // Available pieces for selection
  const availablePieces = ['wK', 'wQ', 'wR', 'wB', 'wN', 'wP', 'bK', 'bQ', 'bR', 'bB', 'bN', 'bP'];
  
  // Piece icons for display
  const pieceIcons = {
    'wK': '♔', 'wQ': '♕', 'wR': '♖', 'wB': '♗', 'wN': '♘', 'wP': '♙',
    'bK': '♚', 'bQ': '♛', 'bR': '♜', 'bB': '♝', 'bN': '♞', 'bP': '♟'
  };
  
  // Bot play state
  const [botSettings, setBotSettings] = useState({
    selectedBot: { name: 'Stockfish', elo: 2000 }, // Default bot
    playerColor: 'white',
    timeControl: 'rapid',
    timeInMinutes: 10
  });

  // Audio refs for sounds
  const moveSoundRef = useRef(null);
  const captureSoundRef = useRef(null);
  const castleSoundRef = useRef(null);
  const successSoundRef = useRef(null);
  const wrongSoundRef = useRef(null);
  const [botGameState, setBotGameState] = useState({
    isPlaying: false,
    isPlayerTurn: true,
    isBotThinking: false,
    gameResult: null,
    playerTime: 600,
    botTime: 600,
    moveHistory: []
  });
  const [availableBots] = useState([
    { id: 'rookie', name: 'Rookie Rob', elo: 800, description: 'Just learning the ropes' },
    { id: 'casual', name: 'Casual Carl', elo: 1000, description: 'Plays for fun' },
    { id: 'intermediate', name: 'Intermediate Ian', elo: 1400, description: 'Solid fundamentals' },
    { id: 'advanced', name: 'Advanced Alice', elo: 1800, description: 'Strong tactical player' },
    { id: 'expert', name: 'Expert Eddie', elo: 2200, description: 'Master-level play' }
  ]);
  
  const initializeEngine = useCallback(() => {
    console.log('Engine initialized');
    setEngineStatus('ready');
  }, []);

  // Load sounds
  useEffect(() => {
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

    try {
      successSoundRef.current = new Audio('/sounds/success.mp3');
      successSoundRef.current.load();
    } catch (error) {
      console.warn('Could not load success sound:', error);
      successSoundRef.current = null;
    }

    try {
      wrongSoundRef.current = new Audio('/sounds/wrong.mp3');
      wrongSoundRef.current.load();
    } catch (error) {
      console.warn('Could not load wrong sound:', error);
      wrongSoundRef.current = null;
    }
  }, []);

  const playMoveSound = useCallback((move) => {
    if (!move) return;
    
    try {
      if (move.captured) {
        captureSoundRef.current?.play().catch(e => console.log("Capture sound play failed:", e));
      } else if (move.san && (move.san.includes('O-O') || move.san.includes('O-O-O'))) {
        castleSoundRef.current?.play().catch(e => console.log("Castle sound play failed:", e));
      } else {
        moveSoundRef.current?.play().catch(e => console.log("Move sound play failed:", e));
      }
    } catch (error) {
      console.warn('Error playing move sound:', error);
    }
  }, []);

  const playSuccessSound = useCallback(() => {
    try {
      successSoundRef.current?.play().catch(e => console.log("Success sound play failed:", e));
    } catch (error) {
      console.warn('Error playing success sound:', error);
    }
  }, []);

  const playWrongSound = useCallback(() => {
    try {
      wrongSoundRef.current?.play().catch(e => console.log("Wrong sound play failed:", e));
    } catch (error) {
      console.warn('Error playing wrong sound:', error);
    }
  }, []);
  
  const analyzePosition = useCallback(async (fen) => {
    console.log('🔍 ===== ANALYZING POSITION (ChessAnalysisBoard) =====');
    console.log('🔍 FEN received:', fen);
    console.log('🔍 FEN length:', fen?.length);
    console.log('🔍 FEN breakdown:');
    console.log('  - Pieces:', fen?.split(' ')[0]);
    console.log('  - Turn:', fen?.split(' ')[1]);
    console.log('  - Castling:', fen?.split(' ')[2]);
    console.log('  - En passant:', fen?.split(' ')[3]);
    console.log('  - Halfmove:', fen?.split(' ')[4]);
    console.log('  - Fullmove:', fen?.split(' ')[5]);
    
    setEngineStatus('analyzing');
    setEngineError(null);
    
    try {
      // Validate FEN before sending to engine
      try {
        const testGame = new Chess(fen);
        console.log('✅ FEN is valid');
        console.log('🔍 Turn to move:', testGame.turn() === 'w' ? 'White' : 'Black');
        console.log('🔍 Legal moves count:', testGame.moves().length);
        console.log('🔍 First 5 legal moves:', testGame.moves().slice(0, 5));
      } catch (e) {
        console.error('❌ FEN is INVALID:', e.message);
        setEngineError('Invalid position FEN');
        return;
      }
      
      // Get engine evaluation first - SAME AS EnhancedChessStudyPage
      console.log('🔍 Requesting evaluation from engine...');
      const evaluation = await stockfishCloudService.getEvaluation(fen);
      console.log('✅ Engine evaluation received:', evaluation);
      
      // Use browser-based Stockfish service - SAME SETTINGS AS EnhancedChessStudyPage
      console.log('🔍 Requesting move analysis from engine...');
      const result = await stockfishCloudService.analyzePosition(fen, {
        depth: 20,
        multiPV: 3,
        timeLimit: 8000
      });
      
      console.log('✅ Stockfish analysis result:', result);
      console.log('🔍 Number of moves found:', result?.moves?.length || 0);
      if (result?.moves?.length > 0) {
        console.log('🔍 Top 3 suggested moves:');
        result.moves.slice(0, 3).forEach((move, i) => {
          console.log(`  ${i+1}. ${move.san || move.move || move.notation} (eval: ${move.evaluation?.value})`);
        });
      }
      
      if (result && result.moves && result.moves.length > 0) {
        const suggestions = result.moves.map((move, index) => {
          // Convert UCI move to SAN
          const tempGame = new Chess(fen);
          const uciMove = move.move;
          const from = uciMove.substring(0, 2);
          const to = uciMove.substring(2, 4);
          const promotion = uciMove.length > 4 ? uciMove.substring(4) : undefined;
          
          // Find the SAN notation for this move
          const legalMoves = tempGame.moves({ verbose: true });
          const matchingMove = legalMoves.find(m => 
            m.from === from && 
            m.to === to && 
            (m.promotion || '') === (promotion || '')
          );
          
          const san = matchingMove ? matchingMove.san : uciMove;
          
          // Format evaluation properly
          let evalStr = '0.0';
          if (move.isMate) {
            const mateIn = move.mateIn;
            evalStr = mateIn > 0 ? `M${mateIn}` : `M${Math.abs(mateIn)}`;
          } else {
            // Centipawn score
            evalStr = move.evaluation > 0 ? `+${move.evaluation.toFixed(1)}` : move.evaluation.toFixed(1);
          }
          
          return {
            move: uciMove,
            san: san,
            evaluation: evalStr,
            depth: move.depth,
            nodes: 0, // Browser version doesn't provide node count
            multipv: move.multipv,
            isMate: move.isMate,
            mateIn: move.mateIn
          };
        });
        
        setEngineSuggestions(suggestions);
        setEngineStatus('ready');
        
        console.log('Engine suggestions updated:', suggestions);
      } else {
        throw new Error('No moves returned from Stockfish');
      }
      
    } catch (error) {
      console.error('Error analyzing position:', error);
      setEngineError(error.message);
      setEngineStatus('error');
      setEngineSuggestions([]);
    }
  }, []);
  const [isWhiteTurn, setIsWhiteTurn] = useState(true);
  // Create a completely safe gameTree state
  const [gameTree, setGameTree] = useState(() => {
    console.log('🎯 Initializing gameTree with safe default');
    return { moves: [], variations: [] };
  });
  
  // Safe setter for gameTree to prevent invalid states
  const safeSetGameTree = useCallback((newTreeOrFunction) => {
    try {
      console.log('🎯 safeSetGameTree called with:', typeof newTreeOrFunction, newTreeOrFunction);
      
      // Handle function updates (like setState(prev => ...))
      if (typeof newTreeOrFunction === 'function') {
        setGameTree(prevTree => {
          try {
            console.log('🎯 safeSetGameTree: prevTree:', prevTree);
            const newTree = newTreeOrFunction(prevTree);
            console.log('🎯 safeSetGameTree: newTree from function:', newTree);
            
            // Always return a safe structure
            const safeTree = {
              moves: Array.isArray(newTree?.moves) ? newTree.moves : [],
              variations: Array.isArray(newTree?.variations) ? newTree.variations : []
            };
            
            console.log('🎯 safeSetGameTree: returning safe tree:', safeTree);
            return safeTree;
          } catch (funcError) {
            console.error('🎯 safeSetGameTree: Error in function:', funcError);
            return { moves: [], variations: [] };
          }
        });
        return;
      }
      
      // Handle direct object updates
      const safeTree = {
        moves: Array.isArray(newTreeOrFunction?.moves) ? newTreeOrFunction.moves : [],
        variations: Array.isArray(newTreeOrFunction?.variations) ? newTreeOrFunction.variations : []
      };
      
      console.log('🎯 safeSetGameTree: Setting direct safe tree:', safeTree);
      setGameTree(safeTree);
    } catch (error) {
      console.error('🎯 safeSetGameTree: Error setting gameTree:', error);
      setGameTree({ moves: [], variations: [] });
    }
  }, []);
  const [currentPath, setCurrentPath] = useState([]);
  const [moveNumber, setMoveNumber] = useState(1);
  const [openingMoves, setOpeningMoves] = useState([]);
  const nextId = useRef(1);

  // Debug: Monitor gameTree changes
  useEffect(() => {
    console.log('🎯 DEBUG: gameTree state changed:', gameTree);
  }, [gameTree]);

  // Handle window resize (same as chess-study)
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle URL parameters and navigation state for loading positions and PGN
  useEffect(() => {
    console.log('🎯 ChessAnalysisBoard: URL search params:', location.search);
    console.log('🎯 ChessAnalysisBoard: Navigation state:', location.state);
    
    const urlParams = new URLSearchParams(location.search);
    const fenFromUrl = urlParams.get('fen');
    const pgnFromUrl = urlParams.get('pgn');
    const moveIndexFromUrl = urlParams.get('moveIndex');
    
    // Check for PGN in navigation state first (higher priority)
    const pgnFromState = location.state?.pgn || location.state?.gameData?.pgn;
    const fenFromState = location.state?.fen || location.state?.gameData?.fen;
    
    console.log('🎯 ChessAnalysisBoard: FEN from URL:', fenFromUrl);
    console.log('🎯 ChessAnalysisBoard: PGN from URL exists:', !!pgnFromUrl);
    console.log('🎯 ChessAnalysisBoard: PGN from state exists:', !!pgnFromState);
    console.log('🎯 ChessAnalysisBoard: FEN from state exists:', !!fenFromState);
    console.log('🎯 ChessAnalysisBoard: Move index from URL:', moveIndexFromUrl);
    
    // Use PGN from state if available, otherwise from URL
    const pgnToUse = pgnFromState || pgnFromUrl;
    const fenToUse = fenFromState || fenFromUrl;
    
    if (pgnToUse) {
      const decodedPgn = pgnFromState ? pgnToUse : decodeURIComponent(pgnToUse);
      console.log('🎯 ChessAnalysisBoard: Raw PGN:', pgnToUse);
      console.log('🎯 ChessAnalysisBoard: Decoded PGN:', decodedPgn);
      console.log('🎯 ChessAnalysisBoard: PGN Length:', decodedPgn.length);
      
      try {
        // Load the complete PGN into the game to get move history
        const newGame = new Chess();
        console.log('🎯 ChessAnalysisBoard: Testing with simple PGN first...');
        
        // Test with a simple PGN first
        const testPgn = '1. e4 e5 2. Nf3 Nc6';
        const testGame = new Chess();
        try {
          testGame.loadPgn(testPgn);
          console.log('🎯 ChessAnalysisBoard: Test PGN loaded successfully, moves:', testGame.history().length);
        } catch (error) {
          console.log('🎯 ChessAnalysisBoard: Test PGN failed:', error);
        }
        
        try {
          // Try loadPgn first (preferred method for PGN)
          const loadResult = newGame.loadPgn(decodedPgn);
          console.log('🎯 ChessAnalysisBoard: PGN Load Result (loadPgn):', loadResult);
        } catch (error) {
          console.log('🎯 ChessAnalysisBoard: loadPgn failed, trying load method:', error.message);
          // Fallback to load method
          newGame.load(decodedPgn);
          console.log('🎯 ChessAnalysisBoard: PGN loaded with load method');
        }
        
        // Generate move history for display
        let history = newGame.history({ verbose: true });
        console.log('🎯 ChessAnalysisBoard: Generated history:', history);
        console.log('🎯 ChessAnalysisBoard: History length:', history.length);
        
        if (history.length === 0) {
          console.warn('⚠️ ChessAnalysisBoard: No moves found in PGN, trying alternative parsing');
          console.log('🎯 ChessAnalysisBoard: Full PGN for debugging:', decodedPgn);
          
          // Try to parse moves manually from PGN
          const pgnMoves = decodedPgn.split('\n\n')[1]; // Get moves part after headers
          console.log('🎯 ChessAnalysisBoard: PGN moves section:', pgnMoves);
          
          if (pgnMoves) {
            // Filter out move numbers and empty strings
            const moves = pgnMoves.trim().split(/\s+/).filter(move => move && !move.match(/^\d+\.$/));
            console.log('🎯 ChessAnalysisBoard: Manually parsed moves:', moves);
            
            // Create move history manually
            const manualHistory = [];
            const tempGame = new Chess();
            for (let i = 0; i < moves.length; i++) {
              try {
                const move = tempGame.move(moves[i]);
                if (move) {
                  manualHistory.push({
                    san: move.san,
                    color: move.color,
                    from: move.from,
                    to: move.to,
                    piece: move.piece
                  });
                }
              } catch (error) {
                console.warn('Error parsing move:', moves[i], error);
                break;
              }
            }
            console.log('🎯 ChessAnalysisBoard: Manual history created:', manualHistory);
            history = manualHistory;
            
            // Also populate gameTree with manually parsed moves
            const gameTreeMoves = manualHistory.map((move, index) => ({
              id: index + 1,
              notation: move.san,
              from: move.from,
              to: move.to,
              piece: move.piece,
              captured: move.captured,
              fullMoveNumber: Math.floor(index / 2) + 1,
              isWhite: move.color === 'w'
            }));
            
            // Add some test variations to demonstrate sublines
            const testVariations = [
              {
                id: 'var1',
                moves: [
                  {
                    id: 1,
                    notation: 'c5',
                    from: 'c7',
                    to: 'c5',
                    piece: 'p',
                    captured: null,
                    fullMoveNumber: 1,
                    isWhite: false
                  }
                ],
                variations: [],
                branchPoint: 0
              },
              {
                id: 'var2',
                moves: [
                  {
                    id: 2,
                    notation: 'd6',
                    from: 'd7',
                    to: 'd6',
                    piece: 'p',
                    captured: null,
                    fullMoveNumber: 1,
                    isWhite: false
                  }
                ],
                variations: [],
                branchPoint: 0
              }
            ];
            
            safeSetGameTree({ moves: gameTreeMoves, variations: testVariations });
          } else {
            console.warn('⚠️ ChessAnalysisBoard: No moves section found in PGN');
            history = [];
          }
        }
        
        setMoveHistory(history);
        setPgn(decodedPgn);
        
        // Populate gameTree with the loaded moves so notation displays correctly
        const gameTreeMoves = history.map((move, index) => ({
          id: index + 1,
          notation: move.san,
          from: move.from,
          to: move.to,
          piece: move.piece,
          captured: move.captured,
          fullMoveNumber: Math.floor(index / 2) + 1,
          isWhite: move.color === 'w'
        }));
        
        // Add some test variations to demonstrate sublines
        const testVariations = [
          {
            id: 'var1',
            moves: [
              {
                id: 1,
                notation: 'c5',
                from: 'c7',
                to: 'c5',
                piece: 'p',
                captured: null,
                fullMoveNumber: 1,
                isWhite: false
              }
            ],
            variations: [],
            branchPoint: 0
          },
          {
            id: 'var2',
            moves: [
              {
                id: 2,
                notation: 'd6',
                from: 'd7',
                to: 'd6',
                piece: 'p',
                captured: null,
                fullMoveNumber: 1,
                isWhite: false
              }
            ],
            variations: [],
            branchPoint: 0
          }
        ];
        
        setGameTree({ moves: gameTreeMoves, variations: testVariations });
        
        console.log('🎯 ChessAnalysisBoard: PGN loaded successfully, Move history length:', history.length);
        console.log('🎯 ChessAnalysisBoard: GameTree populated with moves:', gameTreeMoves.length);
        console.log('🎯 ChessAnalysisBoard: Game PGN:', newGame.pgn());
        
        // If we have a FEN from URL or state, use that as the current position
        if (fenToUse) {
          try {
            const decodedFen = fenFromState ? fenToUse : decodeURIComponent(fenToUse);
            const currentGame = new Chess(decodedFen);
            setGame(currentGame);
            setBoardPosition(decodedFen);
            
            // Use moveIndex from URL if available, otherwise find it by position matching
            let moveIndex = 0;
            if (moveIndexFromUrl) {
              moveIndex = parseInt(moveIndexFromUrl);
              console.log('🎯 ChessAnalysisBoard: Using move index from URL:', moveIndex);
            } else {
              // Find the move index that corresponds to this position
              const tempGame = new Chess();
              for (let i = 0; i < history.length; i++) {
                try {
                  tempGame.move(history[i].san);
                  if (tempGame.fen() === decodedFen) {
                    moveIndex = i + 1;
                    break;
                  }
                } catch (error) {
                  console.warn('Error playing move for position matching:', error);
                  break;
                }
              }
              console.log('🎯 ChessAnalysisBoard: Found move index by position matching:', moveIndex);
            }
            setCurrentMove(moveIndex);
            
            console.log('🎯 ChessAnalysisBoard: Loaded current position from FEN:', decodedFen);
            console.log('🎯 ChessAnalysisBoard: Current move index:', moveIndex);
          } catch (error) {
            console.error('❌ ChessAnalysisBoard: Error loading position from FEN:', error);
            // Fallback to final position of PGN
            setGame(newGame);
            setBoardPosition(newGame.fen());
            setCurrentMove(history.length);
          }
        } else {
          // No FEN provided, use the final position of the PGN
          setGame(newGame);
          setBoardPosition(newGame.fen());
          setCurrentMove(history.length);
        }
      } catch (error) {
        console.error('❌ ChessAnalysisBoard: Error loading PGN from URL:', error);
        console.error('❌ ChessAnalysisBoard: PGN that failed:', decodedPgn);
      }
    } else if (fenFromUrl) {
      // Only FEN provided, no PGN
      try {
        console.log('🎯 ===== LOADING FEN FROM URL =====');
        console.log('🎯 Raw FEN from URL:', fenFromUrl);
        const decodedFen = decodeURIComponent(fenFromUrl);
        console.log('🎯 Decoded FEN:', decodedFen);
        console.log('🎯 FEN breakdown:');
        console.log('  - Pieces:', decodedFen.split(' ')[0]);
        console.log('  - Turn:', decodedFen.split(' ')[1]);
        console.log('  - Castling:', decodedFen.split(' ')[2]);
        console.log('  - En passant:', decodedFen.split(' ')[3]);
        console.log('  - Halfmove:', decodedFen.split(' ')[4]);
        console.log('  - Fullmove:', decodedFen.split(' ')[5]);
        
        const newGame = new Chess(decodedFen);
        console.log('✅ Chess.js loaded position successfully');
        console.log('🎯 Turn to move:', newGame.turn() === 'w' ? 'White' : 'Black');
        console.log('🎯 Legal moves:', newGame.moves().slice(0, 10));
        
        setGame(newGame);
        setBoardPosition(decodedFen);
        console.log('✅ Board position set to:', decodedFen);
        console.log('🎯 ===== FEN LOADING COMPLETE =====');
      } catch (error) {
        console.error('❌ ChessAnalysisBoard: Error loading position from URL:', error);
        console.error('❌ Error details:', error.message);
        console.error('❌ Error stack:', error.stack);
      }
    }
  }, [location.search]);

  // Handle editor mode initialization
  useEffect(() => {
    if (currentMode === 'editor' && isEditing) {
      // Load current position into editor when switching to editor mode
      setFenString(game.fen());
      console.log('🎯 ChessAnalysisBoard: Editor mode initialized with FEN:', game.fen());
    }
  }, [currentMode, isEditing, game]);

  // Engine status is now managed by UCI engine hook



  // Update board position function (same as chess-study)
  const updateBoardPosition = useCallback((newFen) => {
    setBoardPosition(prevFen => {
      // Only update if FEN actually changed
      if (prevFen !== newFen) {
        setIsBoardUpdating(true);
        // Use requestAnimationFrame to ensure smooth update
        requestAnimationFrame(() => {
          setIsBoardUpdating(false);
        });
        return newFen;
      }
      return prevFen;
    });
  }, []);

  // Memoized board position to prevent unnecessary re-renders (same as chess-study)
  const memoizedBoardPosition = useMemo(() => boardPosition, [boardPosition]);

  // Stable board key to prevent unnecessary re-mounting (same as chess-study)
  const boardKey = useMemo(() => `board-${boardOrientation}`, [boardOrientation]);

  // Convert position to algebraic notation
  const positionToAlgebraic = (row, col) => {
    return String.fromCharCode(97 + col) + (8 - row);
  };

  // Convert algebraic notation to position
  const algebraicToPosition = (algebraic) => {
    const col = algebraic.charCodeAt(0) - 97;
    const row = 8 - parseInt(algebraic[1]);
    return [row, col];
  };

  // Generate move notation
  const generateMoveNotation = (fromRow, fromCol, toRow, toCol, piece, capturedPiece, board) => {
    const fromSquare = positionToAlgebraic(fromRow, fromCol);
    const toSquare = positionToAlgebraic(toRow, toCol);
    
    let notation = '';
    
    if (piece.toLowerCase() === 'k') {
      // Castling
      if (Math.abs(toCol - fromCol) === 2) {
        return toCol > fromCol ? 'O-O' : 'O-O-O';
      }
    }
    
    if (piece.toLowerCase() !== 'p') {
      notation += piece.toLowerCase() === 'k' ? 'K' : 
                  piece.toLowerCase() === 'q' ? 'Q' :
                  piece.toLowerCase() === 'r' ? 'R' :
                  piece.toLowerCase() === 'b' ? 'B' :
                  piece.toLowerCase() === 'n' ? 'N' : '';
    }
    
    if (capturedPiece || (piece.toLowerCase() === 'p' && fromCol !== toCol)) {
      if (piece.toLowerCase() === 'p') {
        notation += fromSquare[0];
      }
      notation += 'x';
    }
    
    notation += toSquare;
    
    return notation;
  };

  // Get current position in game tree
  const getCurrentPosition = useCallback(() => {
    console.log('🎯 getCurrentPosition called with gameTree:', gameTree, 'currentPath:', currentPath);
    
    if (!gameTree || !gameTree.moves) {
      console.log('🎯 getCurrentPosition: gameTree invalid, returning default');
      return { moves: [], variations: [] };
    }
    
    let current = gameTree.moves;
    console.log('🎯 getCurrentPosition: Starting with main moves:', current);
    
    // Navigate through the path to find the current position
    for (let i = 0; i < currentPath.length; i++) {
      const pathIndex = currentPath[i];
      console.log(`🎯 getCurrentPosition: Processing path index ${i}: ${pathIndex}`);
      
      if (pathIndex === 0) {
        console.log('🎯 getCurrentPosition: Staying in main line');
        // Stay in main line
        current = current;
      } else {
        console.log('🎯 getCurrentPosition: Looking for variation at index:', pathIndex - 1);
        
        // Find the last move in the current sequence
        const lastMove = current[current.length - 1];
        if (!lastMove) {
          console.warn('🎯 getCurrentPosition: No last move found');
          return { moves: [], variations: [] };
        }
        
        // Check if variations exist and have the required index
        if (lastMove.variations && Array.isArray(lastMove.variations) && lastMove.variations[pathIndex - 1]) {
          current = lastMove.variations[pathIndex - 1].moves || [];
          console.log('🎯 getCurrentPosition: Found variation moves:', current);
        } else {
          console.warn('🎯 getCurrentPosition: Variation not found at path:', currentPath, 'index:', pathIndex);
          console.warn('🎯 getCurrentPosition: Available variations:', lastMove.variations);
          // Return empty moves if variation doesn't exist
          return { moves: [], variations: [] };
        }
      }
    }
    
    // Ensure the returned object has the expected structure
    const result = {
      moves: current || [],
      variations: []
    };
    
    console.log('🎯 getCurrentPosition: Returning result:', result);
    console.log('🎯 getCurrentPosition: Result moves count:', result.moves.length);
    return result;
  }, [gameTree, currentPath]);

  // Memoize current position to prevent infinite re-renders
  const currentPosition = useMemo(() => {
    try {
      const position = getCurrentPosition();
      console.log('🎯 currentPosition memoized:', position);
      return position;
    } catch (error) {
      console.error('🎯 Error in currentPosition memoization:', error);
      return { moves: [], variations: [] };
    }
  }, [getCurrentPosition]);

  // Get main line position (for navigation back from variations)
  const getMainLinePosition = () => {
    return gameTree;
  };

  // Apply move to board
  const applyMoveToBoard = (board, move) => {
    const newBoard = board.map(row => [...row]);
    const [fromRow, fromCol] = algebraicToPosition(move.from);
    const [toRow, toCol] = algebraicToPosition(move.to);
    
    newBoard[toRow][toCol] = newBoard[fromRow][fromCol];
    newBoard[fromRow][fromCol] = null;
    
    return newBoard;
  };

  // Navigate to specific move
  const navigateToMoveOld = useCallback((targetMove) => {
    const currentPos = getCurrentPosition();
    if (targetMove < 0 || targetMove > currentPos.moves.length) {
      console.log('🎯 navigateToMove: Invalid target move:', targetMove, 'max moves:', currentPos.moves.length);
      return;
    }
    
    console.log('🎯 navigateToMove: Navigating to move', targetMove, 'in position with', currentPos.moves.length, 'moves');
    
    // Reset game to starting position
    const tempGame = new Chess();
    
    // If we're in a variation, we need to reconstruct the position properly
    if (currentPath.length > 0) {
      console.log('🎯 navigateToMove: In variation, currentPath:', currentPath);
      // First, apply moves from the main line up to the branch point
      const variation = currentPos;
      const branchPoint = variation.branchPoint || 0;
      
      console.log('🎯 navigateToMove: Branch point:', branchPoint);
      
      // Apply main line moves up to the branch point
      for (let i = 0; i < branchPoint; i++) {
        if (gameTree.moves[i]) {
          try {
            console.log('🎯 navigateToMove: Applying main line move', i, ':', gameTree.moves[i].notation);
            tempGame.move(gameTree.moves[i].notation);
          } catch (e) {
            console.error('Error applying main line move:', e, 'Move:', gameTree.moves[i]);
          }
        }
      }
      
      // Then apply variation moves up to and including targetMove
      for (let i = 0; i <= targetMove; i++) {
        if (currentPos.moves[i]) {
          try {
            console.log('🎯 navigateToMove: Applying variation move', i, ':', currentPos.moves[i].notation);
            tempGame.move(currentPos.moves[i].notation);
          } catch (e) {
            console.error('Error applying variation move:', e, 'Move:', currentPos.moves[i]);
          }
        }
      }
    } else {
      console.log('🎯 navigateToMove: In main line');
      // We're in the main line - apply moves up to and including targetMove
      for (let i = 0; i <= targetMove; i++) {
        if (currentPos.moves[i]) {
          try {
            console.log('🎯 navigateToMove: Applying main line move', i, ':', currentPos.moves[i].notation);
            tempGame.move(currentPos.moves[i].notation);
          } catch (e) {
            console.error('Error applying main line move:', e, 'Move:', currentPos.moves[i]);
          }
        }
      }
    }
    
    console.log('🎯 navigateToMove: Final FEN:', tempGame.fen());
    
    // Update game and board position
    setGame(tempGame);
    updateBoardPosition(tempGame.fen());
    setCurrentMove(targetMove + 1); // Set to the next move since we've applied moves up to targetMove
    setIsWhiteTurn((targetMove + 1) % 2 === 0);
    setMoveNumber(Math.floor((targetMove + 1) / 2) + 1);
  }, [getCurrentPosition, gameTree, currentPath]);

  // Navigation functions for PGN move history (from openings page)
  const navigatePGNMove = useCallback((targetMoveIndex) => {
    if (!moveHistory || moveHistory.length === 0) {
      console.warn('🎯 navigatePGNMove: No move history available');
      return;
    }
    
    const targetIndex = Math.max(0, Math.min(targetMoveIndex, moveHistory.length));
    console.log('🎯 navigatePGNMove: Navigating to move index:', targetIndex, 'of', moveHistory.length);
    console.log('🎯 navigatePGNMove: Current move before navigation:', currentMove);
    
    // Create a new game and play moves up to the target index
    const tempGame = new Chess();
    for (let i = 0; i < targetIndex; i++) {
      try {
        const move = tempGame.move(moveHistory[i].san);
        console.log(`🎯 navigatePGNMove: Played move ${i + 1}: ${moveHistory[i].san}`);
        
        // Play sound for the move (only if we're moving forward, not backward)
        if (i >= currentMove) {
          playMoveSound(move);
        }
      } catch (error) {
        console.warn('Error playing move in PGN navigation:', moveHistory[i].san, error);
        break;
      }
    }
    
    setGame(tempGame);
    setBoardPosition(tempGame.fen());
    setCurrentMove(targetIndex);
    
    console.log('🎯 navigatePGNMove: New position FEN:', tempGame.fen());
    console.log('🎯 navigatePGNMove: New current move:', targetIndex);
  }, [moveHistory, currentMove, playMoveSound]);

  // Navigation functions
  const goToStart = useCallback(() => {
    if (pgn && moveHistory && moveHistory.length > 0) {
      // Use PGN navigation
      navigatePGNMove(0);
    } else {
      // Use notation system navigation
      const moves = navigateNotationMove(-1);
      if (moves) {
        // Reset board to starting position
        const tempGame = new Chess();
        setGame(tempGame);
        updateBoardPosition(tempGame.fen());
        setCurrentMove(0);
      }
    }
  }, [pgn, moveHistory, navigateNotationMove, navigatePGNMove]);
  
  const goToEnd = useCallback(() => {
    if (pgn && moveHistory && moveHistory.length > 0) {
      // Use PGN navigation
      navigatePGNMove(moveHistory.length);
    } else {
      const currentPos = getCurrentPosition();
      navigateToMoveOld(currentPos.moves.length);
    }
  }, [pgn, moveHistory, navigatePGNMove, getCurrentPosition, navigateToMoveOld]);
  
  const goToPrevious = useCallback(() => {
    console.log('🎯 goToPrevious called - currentMove:', currentMove, 'currentPath:', currentPath);
    console.log('🎯 goToPrevious - pgn:', !!pgn, 'moveHistory:', moveHistory?.length);
    
    if (pgn && moveHistory && moveHistory.length > 0) {
      // Use PGN navigation
      if (currentMove > 0) {
        console.log('🎯 Using PGN navigation to move:', currentMove - 1);
        navigatePGNMove(currentMove - 1);
      } else {
        console.log('🎯 Already at start of PGN, cannot go back');
      }
    } else if (currentMove > 0) {
      // Go back one move within the current line (main line or variation)
      console.log('🎯 Going back one move within current line to:', currentMove - 1);
      navigateToMoveOld(currentMove - 1);
    } else if (currentPath.length > 0) {
      // If we're at the start of a variation (currentMove === 0), go back to the main line
      console.log('🎯 At start of variation, going back to main line');
      const currentVariation = getCurrentPosition();
      const branchPoint = currentVariation.branchPoint || 0;
      console.log('🎯 Branch point:', branchPoint);
      
      const newPath = [...currentPath];
      newPath.pop();
      setCurrentPath(newPath);
      
      // Navigate to the branch point in the main line
      navigateToMoveOld(branchPoint);
    } else {
      console.log('🎯 Already at start of main line, cannot go back');
    }
  }, [pgn, moveHistory, currentMove, navigatePGNMove, currentPath, getCurrentPosition, navigateToMoveOld]);
  
  const goToNext = useCallback(() => {
    console.log('🎯 goToNext called - currentMove:', currentMove, 'currentPath:', currentPath);
    console.log('🎯 goToNext - pgn:', !!pgn, 'moveHistory:', moveHistory?.length);
    
    if (pgn && moveHistory && moveHistory.length > 0) {
      // Use PGN navigation
      if (currentMove < moveHistory.length) {
        console.log('🎯 Using PGN navigation to move:', currentMove + 1);
        navigatePGNMove(currentMove + 1);
      } else {
        console.log('🎯 Already at end of PGN, cannot go forward');
      }
    } else {
      const currentPos = getCurrentPosition();
      console.log('🎯 goToNext - currentPos.moves.length:', currentPos.moves.length);
      if (currentMove < currentPos.moves.length) {
        console.log('🎯 Going forward one move to:', currentMove + 1);
        navigateToMoveOld(currentMove + 1);
      } else {
        console.log('🎯 Already at end of moves, cannot go forward');
      }
    }
  }, [pgn, moveHistory, currentMove, navigatePGNMove, getCurrentPosition, navigateToMoveOld]);

  const goToMainLine = useCallback(() => {
    setCurrentPath([]);
    navigateToMoveOld(0);
  }, [navigateToMoveOld]);


  // Advanced board editor functions
  const fenToPosition = useCallback((fen) => {
    const position = {};
    const fenParts = fen.split(' ');
    const boardPart = fenParts[0];
    const rows = boardPart.split('/');
    
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    
    for (let rank = 0; rank < 8; rank++) {
      const row = rows[rank];
      let fileIndex = 0;
      
      for (let i = 0; i < row.length; i++) {
        const char = row[i];
        
        if (isNaN(parseInt(char))) {
          // It's a piece
          const color = char === char.toUpperCase() ? 'w' : 'b';
          const pieceType = char.toUpperCase();
          const square = files[fileIndex] + (8 - rank);
          position[square] = color + pieceType;
          fileIndex++;
        } else {
          // It's a number representing empty squares
          fileIndex += parseInt(char);
        }
      }
    }
    
    return position;
  }, []);

  const positionToFen = useCallback((position) => {
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    let fen = '';
    
    for (let rank = 8; rank >= 1; rank--) {
      let emptyCount = 0;
      
      for (let fileIndex = 0; fileIndex < 8; fileIndex++) {
        const square = files[fileIndex] + rank;
        const piece = position[square];
        
        if (piece) {
          if (emptyCount > 0) {
            fen += emptyCount;
            emptyCount = 0;
          }
          
          const color = piece[0];
          const pieceType = piece[1];
          const fenPiece = color === 'w' ? pieceType : pieceType.toLowerCase();
          fen += fenPiece;
        } else {
          emptyCount++;
        }
      }
      
      if (emptyCount > 0) {
        fen += emptyCount;
      }
      
      if (rank > 1) {
        fen += '/';
      }
    }
    
    // Add other FEN parts (simplified for board editor)
    fen += ' w - - 0 1';
    return fen;
  }, []);

  const handleSquareClick = useCallback((square) => {
    if (currentMode !== 'editor' || !isEditing || !editMode) return;
    
    const currentPosition = fenToPosition(game.fen());
    
    if (selectedPiece) {
      // Place selected piece
      currentPosition[square] = selectedPiece;
    } else {
      // Remove piece (eraser mode)
      delete currentPosition[square];
    }
    
    const newFen = positionToFen(currentPosition);
    setGame(new Chess(newFen));
    updateBoardPosition(newFen);
    setFenString(newFen);
  }, [currentMode, isEditing, editMode, selectedPiece, game, updateBoardPosition, fenToPosition, positionToFen]);

  const clearBoard = useCallback(() => {
    const emptyGame = new Chess('8/8/8/8/8/8/8/8 w - - 0 1');
    setGame(emptyGame);
    updateBoardPosition(emptyGame.fen());
    setFenString(emptyGame.fen());
  }, [updateBoardPosition]);

  const resetToStartingPosition = useCallback(() => {
    const startingGame = new Chess();
    setGame(startingGame);
    updateBoardPosition(startingGame.fen());
    setFenString(startingGame.fen());
  }, [updateBoardPosition]);

  // FEN operations
  const loadFromFen = useCallback(() => {
    try {
      // Basic FEN validation
      const fenParts = fenString.trim().split(' ');
      if (fenParts.length >= 1) {
        // If only board part is provided, add default game state
        const boardPart = fenParts[0];
        const fullFen = fenParts.length === 1 ? 
          `${boardPart} w - - 0 1` : 
          fenString;
        
        setGame(new Chess(fullFen));
        updateBoardPosition(fullFen);
        setFenString(fullFen);
      } else {
        throw new Error('Invalid FEN');
      }
    } catch (error) {
      alert('Invalid FEN string. Please check the format.');
    }
  }, [fenString, updateBoardPosition]);

  const copyFen = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(fenString.split(' ')[0]); // Copy just the board part
      alert('FEN copied to clipboard!');
    } catch (error) {
      alert('Failed to copy FEN to clipboard');
    }
  }, [fenString]);

  // File operations
  const exportBoard = useCallback(() => {
    const data = {
      fen: fenString,
      timestamp: new Date().toISOString(),
      flipped: boardOrientation === 'black'
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chess-position-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [fenString, boardOrientation]);

  const importBoard = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileImport = useCallback((e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target?.result);
          if (data.fen) {
            setFenString(data.fen);
            setGame(new Chess(data.fen));
            updateBoardPosition(data.fen);
            if (data.flipped !== undefined) {
              setBoardOrientation(data.flipped ? 'black' : 'white');
            }
            alert('Position loaded successfully!');
          } else {
            throw new Error('No FEN data found');
          }
        } catch (error) {
          alert('Invalid file format. Please select a valid chess position file.');
        }
      };
      reader.readAsText(file);
    }
    // Reset file input
    e.target.value = '';
  }, [updateBoardPosition]);

  // Bot play functions
  const makeBotMove = useCallback(async (currentFen) => {
    if (!botSettings.selectedBot || !botGameState.isPlaying) return;

    setBotGameState(prev => ({ ...prev, isBotThinking: true }));

    try {
      const payload = {
        fen: currentFen,
        difficulty: botSettings.selectedBot.elo || 1400,
        personality: 'intermediate',
        timeControl: botSettings.timeControl || 'rapid'
      };

      // Use the same backend API approach as PlayWithBotPage
      const response = await fetch('http://localhost:3001/api/bot/move', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error('Bot move request failed');
      }

      const data = await response.json();

      if (data.move && botGameState.isPlaying) {
        const newChess = new Chess(currentFen);
        const move = newChess.move(data.move, { sloppy: true });

        if (move) {
          // Use the FEN from the response for accuracy, or fall back to local calculation
          const finalFen = data.fen || newChess.fen();
          const finalChess = new Chess(finalFen);

          setGame(finalChess);
          updateBoardPosition(finalFen);
          
          // Play move sound for bot move
          playMoveSound(move);
          
          setBotGameState(prev => {
            const updatedState = {
              ...prev,
              moveHistory: [...prev.moveHistory, move.san],
              isPlayerTurn: true,
              isBotThinking: false
            };

            // Check for game over
            const isGameOver = finalChess.game_over();
            if (isGameOver) {
              let result = '';
              if (finalChess.in_checkmate()) {
                result = 'Checkmate - Bot wins!';
              } else if (finalChess.in_stalemate()) {
                result = 'Stalemate - Draw!';
              } else if (finalChess.in_draw()) {
                result = 'Draw!';
              }

              return {
                ...updatedState,
                isPlaying: false,
                gameResult: result,
                isPlayerTurn: false
              };
            }

            return updatedState;
          });
        }
      }
    } catch (error) {
      console.error('Bot move failed:', error);
      // Fallback: make a random legal move
      try {
        const newChess = new Chess(currentFen);
        const moves = newChess.moves();
        if (moves.length > 0) {
          const randomMove = moves[Math.floor(Math.random() * moves.length)];
          const move = newChess.move(randomMove);

          if (move) {
            setGame(newChess);
            updateBoardPosition(newChess.fen());
            
            // Play move sound for fallback bot move
            playMoveSound(move);
            
            setBotGameState(prev => {
              const updatedState = {
                ...prev,
                moveHistory: [...prev.moveHistory, move.san],
                isPlayerTurn: true,
                isBotThinking: false
              };

              // Check for game over
              if (newChess.game_over()) {
                let result = '';
                if (newChess.in_checkmate()) {
                  result = 'Checkmate - Bot wins!';
                } else if (newChess.in_stalemate()) {
                  result = 'Stalemate - Draw!';
                } else if (newChess.in_draw()) {
                  result = 'Draw!';
                }

                return {
                  ...updatedState,
                  isPlaying: false,
                  gameResult: result,
                  isPlayerTurn: false
                };
              }

              return updatedState;
            });
          }
        }
      } catch (fallbackError) {
        console.error('Fallback move also failed:', fallbackError);
      }
    } finally {
      setBotGameState(prev => ({ ...prev, isBotThinking: false }));
    }
  }, [botSettings, botGameState.isPlaying, updateBoardPosition]);

  const startBotGame = useCallback(() => {
    setBotGameState({
      isPlaying: true,
      isPlayerTurn: true, // Player always starts as white
      isBotThinking: false,
      gameResult: null,
      playerTime: 600,
      botTime: 600,
      moveHistory: []
    });

    // Reset to starting position
    const startingGame = new Chess();
    setGame(startingGame);
    updateBoardPosition(startingGame.fen());
  }, [makeBotMove, updateBoardPosition]);

  const stopBotGame = useCallback(() => {
    setBotGameState({
      isPlaying: false,
      isPlayerTurn: true,
      isBotThinking: false,
      gameResult: null,
      playerTime: 600,
      botTime: 600,
      moveHistory: []
    });
  }, []);

  // Handle piece drop with chess.js validation
  const onPieceDrop = useCallback((sourceSquare, targetSquare, piece) => {
    console.log('🎯 DEBUG: onPieceDrop called:', { sourceSquare, targetSquare, piece, currentMode });
    // Handle different modes
    if (currentMode === 'editor' && isEditing) {
      // In editor mode, allow any piece placement
      return true;
    }
    
    if (currentMode === 'bot' && !botGameState.isPlaying) {
      return false;
    }
    
    if (currentMode === 'bot' && !botGameState.isPlayerTurn) {
      return false;
    }

    try {
      const moveObj = {
        from: sourceSquare,
        to: targetSquare,
        promotion: piece[1] === 'P' && (targetSquare[1] === '8' || targetSquare[1] === '1') ? 'q' : undefined
      };

      console.log('🎯 DEBUG: Attempting move:', moveObj);
      const chessMove = game.move(moveObj);
      console.log('🎯 DEBUG: Chess move result:', chessMove);
      
      // If we're already in a variation (currentPath has non-zero values), 
      // we should always use variation handling
      const isInVariation = currentPath.some(p => p > 0);
      
      if (chessMove) {
        // Always record the move in the simple notation system
        recordMove(chessMove.san, sourceSquare, targetSquare);

        // Update board position
        updateBoardPosition(game.fen());
        
        // Play move sound
        playMoveSound(chessMove);
        
        // Handle bot game moves
        if (currentMode === 'bot' && botGameState.isPlaying) {
          setBotGameState(prev => ({
            ...prev,
            moveHistory: [...prev.moveHistory, chessMove.san],
            isPlayerTurn: false
          }));

          // Check for game over
          if (game.game_over()) {
            let result = '';
            if (game.in_checkmate()) {
              result = 'Checkmate - You win!';
            } else if (game.in_stalemate()) {
              result = 'Stalemate - Draw!';
            } else if (game.in_draw()) {
              result = 'Draw!';
            }
            
            setBotGameState(prev => ({
              ...prev,
              isPlaying: false,
              gameResult: result
            }));
          } else {
            // Make bot move if game continues
            setTimeout(() => makeBotMove(game.fen()), 500);
          }
        } else {
          // Update state (only if we're not creating a variation)
          const currentPos = getCurrentPosition();
          if (currentMove >= currentPos.moves.length) {
            setCurrentMove(currentMove + 1);
            setIsWhiteTurn(!isWhiteTurn);
            if (!isWhiteTurn) {
              setMoveNumber(moveNumber + 1);
            }
          }
        }
        
        return true;
      } else if (isInVariation) {
        // We're in a variation but handleMoveCreation returned false
        // This means we should continue the current variation
        console.log('🎯 Continuing existing variation');
        setIsCreatingVariation(true);
        setCurrentVariationPath(currentPath);
        addMoveToVariation(chessMove);
        return true;
      } else {
        console.log('🎯 DEBUG: Move was not valid, chessMove is null');
        return false;
      }
    } catch (error) {
      console.error('❌ DEBUG: Move error:', error);
      return false;
    }
  }, [game, currentPath, currentMove, isWhiteTurn, moveNumber, updateBoardPosition]);

  // Flip board function
  const flipBoard = useCallback(() => {
    setBoardOrientation(prev => prev === 'white' ? 'black' : 'white');
  }, []);

  // Fetch opening explorer data
  const fetchOpeningData = useCallback(async (fen) => {
    try {
      // Using Lichess API for opening explorer
      const response = await fetch(`https://explorer.lichess.ovh/masters?fen=${encodeURIComponent(fen)}`);
      const data = await response.json();
      
      if (data.moves && data.moves.length > 0) {
        const openingMoves = data.moves.slice(0, 10).map(move => ({
          san: move.san,
          uci: move.uci,
          white: move.white || 0,
          draws: move.draws || 0,
          black: move.black || 0,
          averageRating: move.averageRating || 0,
          total: move.white + move.draws + move.black
        }));
        setOpeningMoves(openingMoves);
      } else {
        setOpeningMoves([]);
      }
    } catch (error) {
      console.error('Error fetching opening data:', error);
      setOpeningMoves([]);
    }
  }, []);

  // Play opening move
  const playOpeningMove = useCallback((openingMove) => {
    try {
      const tempGame = new Chess(game.fen());
      const move = tempGame.move(openingMove.san);
      
      if (move) {
        // Create new move for our game tree
        const newMove = {
          id: nextId.current++,
          notation: move.san,
          from: move.from,
          to: move.to,
          piece: move.piece,
          captured: move.captured,
          fullMoveNumber: Math.floor(game.history().length / 2) + 1,
          isWhite: move.color === 'w'
        };

        // Update game tree
        safeSetGameTree(prevTree => {
          const newTree = JSON.parse(JSON.stringify(prevTree));
          let current = newTree;
          
          for (const pathIndex of currentPath) {
            if (pathIndex === 0) {
              current = current;
            } else {
              current = current.variations[pathIndex - 1];
            }
          }
          
          // Handle move creation with correct variation logic
          if (currentMove === current.moves.length) {
            console.log('🎯 Adding to main line because currentMove === current.moves.length');
            current.moves.push(newMove);
            setCurrentMove(currentMove + 1);
          }
          else if (currentMove < current.moves.length) {
            console.log('🎯 Creating variation because currentMove < current.moves.length');
            
            const actualBranchPoint = currentMove;
            const parentMoveIndex = currentMove - 1;
            
            if (parentMoveIndex < 0 || parentMoveIndex >= current.moves.length) {
              console.error('🎯 Invalid parent move index:', parentMoveIndex);
              return newTree;
            }
            
            const parentMove = current.moves[parentMoveIndex];
            
            if (!parentMove.variations) {
              parentMove.variations = [];
            }
            
            const existingVariation = parentMove.variations.find(
              v => v.moves && v.moves[0] && v.moves[0].notation === newMove.notation
            );
            
            if (existingVariation) {
              console.log('🎯 Switching to existing variation');
              setCurrentPath([...currentPath, parentMove.variations.indexOf(existingVariation) + 1]);
              setCurrentMove(actualBranchPoint + 1);
              return newTree;
            }
            
            const newVariation = {
              moves: [newMove],
              branchPoint: actualBranchPoint,
              variations: []
            };
            
            parentMove.variations.push(newVariation);
            setCurrentPath([...currentPath, parentMove.variations.length]);
            setCurrentMove(actualBranchPoint + 1);
            
            console.log('🎯 Created variation:', {
              branchPoint: actualBranchPoint,
              parentMoveIndex,
              parentMoveSan: parentMove.notation,
              newMoveSan: newMove.notation
            });
          }
          
          return newTree;
        });

        // Update game and board position
        setGame(tempGame);
        updateBoardPosition(tempGame.fen());
        
        // Update state (only if we're not creating a variation)
        const currentPos = getCurrentPosition();
        if (currentMove >= currentPos.moves.length) {
          setCurrentMove(currentMove + 1);
          setIsWhiteTurn(!isWhiteTurn);
          if (!isWhiteTurn) {
            setMoveNumber(moveNumber + 1);
          }
        }
        
      }
    } catch (error) {
      console.error('Error playing opening move:', error);
    }
  }, [game, currentPath, currentMove, isWhiteTurn, moveNumber, updateBoardPosition, getCurrentPosition]);

  // Play engine move
  const playEngineMove = useCallback((engineMove) => {
    try {
      const tempGame = new Chess(game.fen());
      const move = tempGame.move(engineMove.move);
      
      if (move) {
        // Create new move for our game tree
        const newMove = {
          id: nextId.current++,
          notation: move.san,
          from: move.from,
          to: move.to,
          piece: move.piece,
          captured: move.captured,
          fullMoveNumber: Math.floor(game.history().length / 2) + 1,
          isWhite: move.color === 'w'
        };

        // Update game tree
        safeSetGameTree(prevTree => {
          const newTree = JSON.parse(JSON.stringify(prevTree));
          let current = newTree;
          
          for (const pathIndex of currentPath) {
            if (pathIndex === 0) {
              current = current;
            } else {
              current = current.variations[pathIndex - 1];
            }
          }
          
          // Handle move creation with correct variation logic
          if (currentMove === current.moves.length) {
            console.log('🎯 Adding to main line because currentMove === current.moves.length');
            current.moves.push(newMove);
            setCurrentMove(currentMove + 1);
          }
          else if (currentMove < current.moves.length) {
            console.log('🎯 Creating variation because currentMove < current.moves.length');
            
            const actualBranchPoint = currentMove;
            const parentMoveIndex = currentMove - 1;
            
            if (parentMoveIndex < 0 || parentMoveIndex >= current.moves.length) {
              console.error('🎯 Invalid parent move index:', parentMoveIndex);
              return newTree;
            }
            
            const parentMove = current.moves[parentMoveIndex];
            
            if (!parentMove.variations) {
              parentMove.variations = [];
            }
            
            const existingVariation = parentMove.variations.find(
              v => v.moves && v.moves[0] && v.moves[0].notation === newMove.notation
            );
            
            if (existingVariation) {
              console.log('🎯 Switching to existing variation');
              setCurrentPath([...currentPath, parentMove.variations.indexOf(existingVariation) + 1]);
              setCurrentMove(actualBranchPoint + 1);
              return newTree;
            }
            
            const newVariation = {
              moves: [newMove],
              branchPoint: actualBranchPoint,
              variations: []
            };
            
            parentMove.variations.push(newVariation);
            setCurrentPath([...currentPath, parentMove.variations.length]);
            setCurrentMove(actualBranchPoint + 1);
            
            console.log('🎯 Created variation:', {
              branchPoint: actualBranchPoint,
              parentMoveIndex,
              parentMoveSan: parentMove.notation,
              newMoveSan: newMove.notation
            });
          }
          
          return newTree;
        });

        // Update game and board position
        setGame(tempGame);
        updateBoardPosition(tempGame.fen());
        
        // Update state (only if we're not creating a variation)
        const currentPos = getCurrentPosition();
        if (currentMove >= currentPos.moves.length) {
          setCurrentMove(currentMove + 1);
          setIsWhiteTurn(!isWhiteTurn);
          if (!isWhiteTurn) {
            setMoveNumber(moveNumber + 1);
          }
        }
      }
    } catch (error) {
      console.error('Error playing engine move:', error);
    }
  }, [game, currentPath, currentMove, isWhiteTurn, moveNumber, updateBoardPosition, getCurrentPosition]);

  // Play engine line (just the first move)
  const playEngineLine = useCallback((engineLine) => {
    try {
      const tempGame = new Chess(game.fen());
      const move = tempGame.move(engineLine.firstMove);
      
      if (move) {
        // Create new move for our game tree
        const newMove = {
          id: nextId.current++,
          notation: move.san,
          from: move.from,
          to: move.to,
          piece: move.piece,
          captured: move.captured,
          fullMoveNumber: Math.floor(game.history().length / 2) + 1,
          isWhite: move.color === 'w'
        };

        // Update game tree
        safeSetGameTree(prevTree => {
          const newTree = JSON.parse(JSON.stringify(prevTree));
          let current = newTree;
          
          for (const pathIndex of currentPath) {
            if (pathIndex === 0) {
              current = current;
            } else {
              current = current.variations[pathIndex - 1];
            }
          }
          
          // Handle move creation with correct variation logic
          if (currentMove === current.moves.length) {
            console.log('🎯 Adding to main line because currentMove === current.moves.length');
            current.moves.push(newMove);
            setCurrentMove(currentMove + 1);
          }
          else if (currentMove < current.moves.length) {
            console.log('🎯 Creating variation because currentMove < current.moves.length');
            
            const actualBranchPoint = currentMove;
            const parentMoveIndex = currentMove - 1;
            
            if (parentMoveIndex < 0 || parentMoveIndex >= current.moves.length) {
              console.error('🎯 Invalid parent move index:', parentMoveIndex);
              return newTree;
            }
            
            const parentMove = current.moves[parentMoveIndex];
            
            if (!parentMove.variations) {
              parentMove.variations = [];
            }
            
            const existingVariation = parentMove.variations.find(
              v => v.moves && v.moves[0] && v.moves[0].notation === newMove.notation
            );
            
            if (existingVariation) {
              console.log('🎯 Switching to existing variation');
              setCurrentPath([...currentPath, parentMove.variations.indexOf(existingVariation) + 1]);
              setCurrentMove(actualBranchPoint + 1);
              return newTree;
            }
            
            const newVariation = {
              moves: [newMove],
              branchPoint: actualBranchPoint,
              variations: []
            };
            
            parentMove.variations.push(newVariation);
            setCurrentPath([...currentPath, parentMove.variations.length]);
            setCurrentMove(actualBranchPoint + 1);
            
            console.log('🎯 Created variation:', {
              branchPoint: actualBranchPoint,
              parentMoveIndex,
              parentMoveSan: parentMove.notation,
              newMoveSan: newMove.notation
            });
          }
          
          return newTree;
        });

        // Update game and board position
        setGame(tempGame);
        updateBoardPosition(tempGame.fen());
        
        // Update state (only if we're not creating a variation)
        const currentPos = getCurrentPosition();
        if (currentMove >= currentPos.moves.length) {
          setCurrentMove(currentMove + 1);
          setIsWhiteTurn(!isWhiteTurn);
          if (!isWhiteTurn) {
            setMoveNumber(moveNumber + 1);
          }
        }
        
      }
    } catch (error) {
      console.error('Error playing engine line:', error);
    }
  }, [game, currentPath, currentMove, isWhiteTurn, moveNumber, updateBoardPosition, getCurrentPosition]);

  // Old engine function removed - now using UCI engine


  // Improved position evaluation function
  const evaluatePosition = (chessGame) => {
    const board = chessGame.board();
    let evaluation = 0;
    
    const pieceValues = {
      'p': 1, 'n': 3, 'b': 3, 'r': 5, 'q': 9, 'k': 0,
      'P': -1, 'N': -3, 'B': -3, 'R': -5, 'Q': -9, 'K': 0
    };
    
    // Count material
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = board[row][col];
        if (piece) {
          evaluation += pieceValues[piece.type] || 0;
        }
      }
    }
    
    // Add positional factors
    const game = chessGame;
    
    // Check for checkmate
    if (game.isCheckmate()) {
      return game.turn() === 'w' ? -100 : 100;
    }
    
    // Check for stalemate
    if (game.isStalemate()) {
      return 0;
    }
    
    // Check for draw
    if (game.isDraw()) {
      return 0;
    }
    
    // Add small positional bonuses
    const moves = game.moves();
    const mobility = moves.length * 0.01;
    evaluation += game.turn() === 'w' ? mobility : -mobility;
    
    // Add small randomness but keep it reasonable
    const randomFactor = (Math.random() - 0.5) * 0.2;
    evaluation += randomFactor;
    
    // Clamp evaluation to reasonable range
    return Math.max(-10, Math.min(10, evaluation));
  };

  // Update analysis when position changes with debounce - FIXED TO USE boardPosition LIKE EnhancedChessStudyPage
  useEffect(() => {
    console.log('🔍 ===== ANALYSIS TRIGGERED (ChessAnalysisBoard) =====');
    console.log('🔍 Board Position:', boardPosition);
    console.log('🔍 Game FEN:', game.fen());
    
    if (!boardPosition) return;
    
    fetchOpeningData(boardPosition);
    
    // Debounce engine analysis to prevent too many API calls
    const timeoutId = setTimeout(() => {
      console.log('🔍 Calling analyzePosition with FEN:', boardPosition);
      analyzePosition(boardPosition);
    }, 500); // 500ms delay
    
    return () => clearTimeout(timeoutId);
  }, [boardPosition, fetchOpeningData, analyzePosition]);

  // Initialize UCI engine on component mount
  useEffect(() => {
    initializeEngine();
  }, [initializeEngine]);



  // Switch to variation
  const switchToVariation = (variationIndex) => {
    const newPath = [...currentPath];
    newPath[newPath.length - 1] = variationIndex + 1;
    setCurrentPath(newPath);
    navigateToMoveOld(0);
  };


  // Memoized Chessboard component to prevent unnecessary re-renders (same as chess-study)
  const MemoizedChessboard = useMemo(() => (
    <Chessboard
      key={`${boardKey}-${currentMove}-${currentPath.join('-')}`}
      position={memoizedBoardPosition}
      onPieceDrop={onPieceDrop}
      onSquareClick={currentMode === 'editor' ? handleSquareClick : undefined}
      boardWidth={isMobile ? 300 : 600}
      boardOrientation={boardOrientation}
      customBoardStyle={{
        ...TOUCH_BOARD_STYLE,
        borderRadius: '6px',
        width: '100%',
        height: '100%',
        // Performance optimizations for smoother rendering
        transform: 'translateZ(0)',
        backfaceVisibility: 'hidden',
        willChange: 'transform',
        // Smooth transitions to prevent flashing
        transition: 'opacity 0.1s ease-in-out',
        opacity: 1
      }}
      customLightSquareStyle={{
        backgroundColor: '#f0d9b5'
      }}
      customDarkSquareStyle={{
        backgroundColor: '#b58863'
      }}
      showBoardNotation={true}
      areArrowsAllowed={currentMode !== 'editor'}
      arePiecesDraggable={currentMode !== 'bot' || botGameState.isPlayerTurn}
      animationDuration={200}
    />
  ), [boardKey, memoizedBoardPosition, onPieceDrop, boardOrientation, isMobile, currentMove, currentPath, currentMode, handleSquareClick, botGameState.isPlayerTurn]);

  // Parse chess notation with UNLIMITED nesting levels
  const parseNotation = (text) => {
    const lines = text.trim().split('\n').filter(line => line.trim());
    const root = { type: 'root', children: [], level: -1 };
    const stack = [root];

    lines.forEach((line) => {
      // Count leading spaces to determine nesting level
      const leadingSpaces = line.search(/\S/);
      const level = Math.floor(leadingSpaces / 2); // 2 spaces = 1 level
      
      const node = {
        type: 'move',
        content: line.trim(),
        level: level,
        children: [],
        id: Math.random().toString(36).substr(2, 9)
      };

      // Pop stack until we find the correct parent
      // This allows for ANY depth of nesting
      while (stack.length > 1 && stack[stack.length - 1].level >= level) {
        stack.pop();
      }

      // Add to parent's children
      const parent = stack[stack.length - 1];
      parent.children.push(node);
      
      // Push this node as potential parent for next nodes
      stack.push(node);
    });

    return root.children;
  };

  // Convert move text to display with chess pieces
  const formatMove = (text) => {
    return text.replace(/[KQRBNP]/g, (match) => PIECES[match] || match);
  };

  // Toggle variation visibility
  const toggleVariation = (id) => {
    setCollapsedVariations(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Start creating a variation from a specific move with infinite nesting support
  const startVariation = (moveIndex, pathIndex = []) => {
    console.log('🎯 startVariation called with moveIndex:', moveIndex, 'pathIndex:', pathIndex);
    setIsCreatingVariation(true);
    setVariationStartMove(moveIndex);
    
    // Create a new variation path that extends the current path
    let newVariationPath = [...pathIndex];
    
    // Navigate to the position where we want to create the variation
    let currentPosition = gameTree;
    for (const pathIdx of pathIndex) {
      if (pathIdx === 0) {
        currentPosition = currentPosition;
      } else {
        if (currentPosition.variations && currentPosition.variations[pathIdx - 1]) {
          currentPosition = currentPosition.variations[pathIdx - 1];
        } else {
          console.error('🎯 Variation path not found:', pathIndex);
          return;
        }
      }
    }
    
    // Add a new variation index to the path
    const nextVariationIndex = (currentPosition.variations?.length || 0) + 1;
    newVariationPath.push(nextVariationIndex);
    
    setCurrentVariationPath(newVariationPath);
    // Also update currentPath to reflect that we're now in this variation
    setCurrentPath(newVariationPath);
    console.log('🎯 Starting variation from move:', moveIndex, 'path:', newVariationPath);
    console.log('🎯 Current position variations:', currentPosition.variations?.length || 0);
  };

  // Helper function to navigate to the current variation and add moves there
  const addMoveToCurrentPath = (moveNotation) => {
    const newGameTree = JSON.parse(JSON.stringify(gameTree)); // Deep clone
    
    const moveData = {
      notation: moveNotation,
      variations: [],
      timestamp: Date.now()
    };

    console.log(`🎯 Adding move: ${moveNotation}`, {
      currentPath,
      currentMove,
      isCreatingVariation
    });

    // SCENARIO: Main line (currentPath is empty)
    if (currentPath.length === 0 && !isCreatingVariation) {
      newGameTree.moves.push(moveData);
      safeSetGameTree(newGameTree);
      setCurrentMove(newGameTree.moves.length - 1);
      console.log('✅ Added to main line', { totalMoves: newGameTree.moves.length });
      return;
    }

    // SCENARIO: Creating a new variation
    if (isCreatingVariation) {
      // Find the move we're branching from
      const branchPoint = newGameTree.moves[currentMove];
      if (!branchPoint) {
        console.log('❌ Invalid branch point');
        return;
      }

      // Create new variation
      const newVariation = { moves: [moveData] };
      if (!branchPoint.variations) {
        branchPoint.variations = [];
      }
      branchPoint.variations.push(newVariation);
      
      // Update state to be IN this new variation
      setCurrentPath([branchPoint.variations.length - 1]);
      setIsCreatingVariation(false);
      safeSetGameTree(newGameTree);
      console.log('✅ Created new variation', {
        branchPointMove: branchPoint.notation,
        variationIndex: branchPoint.variations.length - 1
      });
      return;
    }

    // SCENARIO: Continuing in an existing variation
    // Navigate to the correct variation's moves array
    let targetMoves = newGameTree.moves;
    
    for (let i = 0; i < currentPath.length; i++) {
      const variationIndex = currentPath[i];
      
      // Find the last move in current context
      const lastMoveIndex = targetMoves.length - 1;
      if (lastMoveIndex < 0) {
        console.log('❌ No moves to branch from');
        return;
      }

      const targetMove = targetMoves[lastMoveIndex];
      
      // Ensure variation exists
      if (!targetMove.variations || !targetMove.variations[variationIndex]) {
        console.log('❌ Variation does not exist');
        return;
      }

      // Move into this variation
      targetMoves = targetMove.variations[variationIndex].moves;
    }

    // Add the move to the variation
    targetMoves.push(moveData);
    safeSetGameTree(newGameTree);
    setCurrentMove(targetMoves.length - 1);
    console.log('✅ Added to variation', {
      path: currentPath,
      movesInVariation: targetMoves.length
    });
  };

  // Add a move to the current variation with infinite nesting support
  const addMoveToVariation = (move) => {
    // Check if we're in a variation (either creating one or already in one)
    const isInVariation = currentPath.some(p => p > 0);
    if (!isCreatingVariation && !isInVariation) {
      console.log('🎯 addMoveToVariation: Not in variation, returning false');
      return false;
    }

    // If we're in a variation but not creating one, start creating one
    if (isInVariation && !isCreatingVariation) {
      console.log('🎯 addMoveToVariation: In variation but not creating, starting variation creation');
      setIsCreatingVariation(true);
      setCurrentVariationPath(currentPath);
    }

    // Use the new working addMoveToCurrentPath function
    addMoveToCurrentPath(move.san);
    
    console.log('🎯 Move added to variation:', move.san);
    return true;
  };

  // Navigate to a specific move in a variation - SIMPLIFIED APPROACH
  const navigateToVariationMove = (moveIndex, pathIndex) => {
    setCurrentPath(pathIndex);
    setCurrentMove(moveIndex);
    
    // Create a new chess game starting from the initial position
    const tempGame = new Chess();
    
    // Convert the game tree to a linear sequence of moves
    const convertToLinearMoves = (position, currentPath = []) => {
      const moves = [];
      
      // Add main line moves
      position.moves.forEach((move, index) => {
        moves.push({
          ...move,
          path: [...currentPath, 0],
          moveIndex: index,
          isMainLine: true
        });
      });
      
      // Add variation moves
      if (position.variations) {
        position.variations.forEach((variation, varIndex) => {
          const variationPath = [...currentPath, varIndex + 1];
          variation.moves.forEach((move, index) => {
            moves.push({
              ...move,
              path: variationPath,
              moveIndex: index,
              isMainLine: false
            });
          });
          
          // Recursively add sub-variation moves
          const subMoves = convertToLinearMoves(variation, variationPath);
          moves.push(...subMoves);
        });
      }
      
      return moves;
    };
    
    // Get all moves in linear order
    const allMoves = convertToLinearMoves(gameTree);
    
    // Find the target move
    const targetMove = allMoves.find(move => 
      move.path.length === pathIndex.length &&
      move.path.every((pathIdx, idx) => pathIdx === pathIndex[idx]) &&
      move.moveIndex === moveIndex
    );
    
    if (!targetMove) {
      console.error('🎯 Target move not found:', { moveIndex, pathIndex });
      return;
    }
    
    // Find all moves that come before the target move
    const movesToPlay = allMoves.filter(move => {
      // Check if this move comes before our target move
      const isBeforeTarget = move.path.length <= pathIndex.length &&
        move.path.every((pathIdx, idx) => pathIdx === pathIndex[idx]) &&
        move.moveIndex < moveIndex;
      
      return isBeforeTarget;
    });
    
    // Sort moves by their position in the game
    movesToPlay.sort((a, b) => {
      // Compare paths first
      for (let i = 0; i < Math.max(a.path.length, b.path.length); i++) {
        const aPath = a.path[i] || 0;
        const bPath = b.path[i] || 0;
        if (aPath !== bPath) {
          return aPath - bPath;
        }
      }
      // Then compare move indices
      return a.moveIndex - b.moveIndex;
    });
    
    // Play all moves up to the target position
    movesToPlay.forEach((move, index) => {
      try {
        tempGame.move({
          from: move.from,
          to: move.to,
          promotion: move.promotion
        });
        console.log(`🎯 Move ${index + 1}: ${move.notation} (path: ${move.path.join('→')})`);
      } catch (error) {
        console.error('Error playing move:', move, error);
      }
    });
    
    console.log('🎯 Navigated to position:', tempGame.fen());
    console.log('🎯 Target move:', targetMove.notation);
    console.log('🎯 Total moves played:', movesToPlay.length);
    setBoardPosition(tempGame.fen());
    setGame(tempGame);
  };

  // Handle move creation - check if we're creating variations
  const handleMoveCreation = (move) => {
    console.log('🎯 handleMoveCreation called with move:', move.san, 'isCreatingVariation:', isCreatingVariation);
    console.log('🎯 Current path:', currentPath, 'currentVariationPath:', currentVariationPath);
    
    // Check if we're already in a variation (currentPath has non-zero values)
    const isInVariation = currentPath.some(p => p > 0);
    console.log('🎯 Is in variation:', isInVariation);
    
    if (isCreatingVariation || isInVariation) {
      // Add move to current variation
      console.log('🎯 Adding move to variation');
      const added = addMoveToVariation(move);
      if (added) {
        console.log('🎯 Move added to variation:', move.san);
        return true;
      }
    } else {
      // Check if this move creates a new variation (different from main line)
      const currentGameMoves = game.history({ verbose: true });
      console.log('🎯 Current game moves:', currentGameMoves.length, 'Current move:', currentMove);
      
      if (currentGameMoves.length > 0) {
        const lastMove = currentGameMoves[currentGameMoves.length - 1];
        console.log('🎯 Last move:', lastMove.san, 'New move:', move.san);
        
        if (lastMove.san !== move.san) {
          // This is a different move - start a variation
          console.log('🎯 Different move detected, starting variation:', move.san, 'vs', lastMove.san);
          
          // Calculate the correct branch point based on current position in game tree
          // The branch point should be the move index where we currently are in the game tree
          let branchPoint;
          
          // Get current position in game tree
          let currentPosition = gameTree;
          for (const pathIndex of currentPath) {
            if (pathIndex === 0) {
              currentPosition = currentPosition;
            } else {
              currentPosition = currentPosition.variations[pathIndex - 1];
            }
          }
          
          // The branch point should be currentMove - 1 (the move we're branching from)
          // If currentMove is 0, we're branching from the beginning (no previous move)
          branchPoint = currentMove > 0 ? currentMove - 1 : 0;
          console.log('🎯 Branching from move index:', branchPoint, 'currentMove:', currentMove);
          
          startVariation(branchPoint, currentPath);
          addMoveToVariation(move);
          return true;
        } else {
          console.log('🎯 Same move detected, continuing main line');
          // If we're in a variation and making the same move, continue the variation
          if (currentPath.some(p => p > 0)) {
            console.log('🎯 Continuing existing variation');
            setIsCreatingVariation(true);
            setCurrentVariationPath(currentPath);
            addMoveToVariation(move);
            return true;
          }
        }
      } else {
        console.log('🎯 No previous moves, adding to main line');
      }
    }
    return false;
  };

  // Render nodes recursively - handles UNLIMITED depth
  const renderNode = (node, index, parentPath = []) => {
    const hasChildren = node.children && node.children.length > 0;
    const isCollapsed = collapsedVariations.has(node.id);
    const isMainLine = node.level === 0;
    
    // Debug: Log node information
    if (node.level > 0) {
      console.log('🎯 Rendering variation node:', node.content, 'level:', node.level, 'children:', node.children?.length || 0);
    }
    
    // Calculate the current path for this node
    const currentNodePath = [...parentPath];
    if (node.level > 0) {
      // This is a variation, add its index to the path
      currentNodePath.push(node.level);
    }

    // Different colors for different nesting levels
    const getColorClass = (level) => {
      const colors = [
        'text-gray-900',      // Level 0: Main line (darkest)
        'text-blue-700',      // Level 1: First variation
        'text-green-700',     // Level 2: Second variation
        'text-purple-700',    // Level 3: Third variation
        'text-orange-700',    // Level 4: Fourth variation
        'text-pink-700',      // Level 5: Fifth variation
        'text-teal-700',      // Level 6+: Deeper variations
      ];
      return colors[Math.min(level, colors.length - 1)];
    };

    const getBgClass = (level) => {
      const backgrounds = [
        '',                    // Level 0: No background
        'bg-blue-50',          // Level 1
        'bg-green-50',         // Level 2
        'bg-purple-50',        // Level 3
        'bg-orange-50',        // Level 4
        'bg-pink-50',          // Level 5
        'bg-teal-50',          // Level 6+
      ];
      return backgrounds[Math.min(level, backgrounds.length - 1)];
    };
              
              return (
      <div key={node.id || index} style={{ marginLeft: `${node.level * 20}px` }}>
        <div className={`flex items-start gap-2 py-1.5 px-2 rounded group ${getBgClass(node.level)}`}>
          {hasChildren ? (
                      <button
              onClick={() => toggleVariation(node.id)}
              className="mt-1 text-gray-500 hover:text-gray-700 transition-colors flex-shrink-0"
            >
              {isCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                      </button>
          ) : (
            <div className="w-4 flex-shrink-0" />
          )}
          
          <div className={`
            flex-1 font-mono
            ${getColorClass(node.level)}
            ${isMainLine ? 'font-bold text-base' : 'font-medium text-sm'}
          `}>
            <span className="font-mono">
              {(() => {
                // Extract move number and notation from content
                const match = node.content.match(/(\d+)\.\s*(.+)/);
                if (!match) return formatMove(node.content);
                
                const moveNumber = parseInt(match[1]);
                const notation = match[2];
                
                // Parse individual moves from the notation (e.g., "e4 e5" -> ["e4", "e5"])
                const individualMoves = notation.trim().split(/\s+/);
                
                return (
                  <>
                    <span className="text-gray-600">{moveNumber}.</span>
                    {individualMoves.map((move, index) => {
                      const moveIndex = (moveNumber - 1) * 2 + index;
                      return (
                        <span
                          key={`${moveNumber}-${index}`}
                          className="cursor-pointer hover:bg-gray-200 px-1 rounded mx-1"
                          onClick={() => {
                            console.log('🎯 Clicked move:', move, 'at index:', moveIndex, 'in variation level:', node.level);
                            console.log('🎯 Current path:', currentPath);
                            console.log('🎯 Current move:', currentMove);
                            
                            // If this is a variation (level > 0), we need to switch to this variation first
                            if (node.level > 0) {
                              console.log('🎯 Clicking on variation move, switching to path:', currentNodePath);
                              // Switch to this variation path
                              setCurrentPath(currentNodePath);
                              // Navigate to the move within the variation
                              console.log('🎯 Navigating to move index:', moveIndex, 'in variation');
                              navigateToMoveOld(moveIndex);
                            } else {
                              console.log('🎯 Clicking on main line move');
                              // This is a main line move
                              navigateToMoveOld(moveIndex);
                            }
                          }}
                        >
                          {formatMove(move)}
                        </span>
                      );
                    })}
                  </>
                );
              })()}
            </span>
            
            {/* Add variation button for each move */}
            <button
              className="ml-2 text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
              onClick={() => {
                const match = node.content.match(/(\d+)\.\s*(.+)/);
                if (match) {
                  const moveNumber = parseInt(match[1]);
                  startVariation(moveNumber, currentNodePath);
                }
              }}
              title="Start variation from this move"
            >
              +Var
            </button>
          </div>
          
          <span className="text-xs text-gray-400 opacity-0 group-hover:opacity-100">
            L{node.level}
          </span>
                </div>

        {/* Recursively render ALL children at ALL levels - ALWAYS VISIBLE */}
        {hasChildren && !isCollapsed && (
          <div>
            {node.children.map((child, idx) => renderNode(child, idx, currentNodePath))}
          </div>
        )}
      </div>
    );
  };

  // Convert game tree to notation text format with infinite nesting support
  const convertGameTreeToNotation = (gameTree, level = 0, startMoveNumber = 1) => {
    try {
      if (!gameTree) {
        console.log('🎯 convertGameTreeToNotation: gameTree is null/undefined');
        return '';
      }
      
      if (!gameTree.moves) {
        console.log('🎯 convertGameTreeToNotation: gameTree.moves is null/undefined', gameTree);
        return '';
      }
      
      if (!Array.isArray(gameTree.moves)) {
        console.log('🎯 convertGameTreeToNotation: gameTree.moves is not an array', gameTree.moves);
        return '';
      }
      
      if (gameTree.moves.length === 0) {
        console.log('🎯 convertGameTreeToNotation: gameTree.moves is empty');
        return '';
      }
    } catch (error) {
      console.error('🎯 convertGameTreeToNotation: Error in validation:', error, 'gameTree:', gameTree);
      return '';
    }

    let notationText = '';
    const indent = '  '.repeat(level); // 2 spaces per level

    // Group moves by move number, starting from the correct move number
    const groupedMoves = [];
    try {
      for (let i = 0; i < gameTree.moves.length; i += 2) {
        const whiteMove = gameTree.moves[i];
        const blackMove = gameTree.moves[i + 1];
        if (whiteMove) {
          groupedMoves.push({
            moveNumber: startMoveNumber + Math.floor(i / 2),
            white: whiteMove,
            black: blackMove
          });
        }
      }
    } catch (error) {
      console.error('🎯 convertGameTreeToNotation: Error grouping moves:', error, 'gameTree.moves:', gameTree.moves);
      return '';
    }

    // Add main line moves and their variations
    try {
      groupedMoves.forEach((group) => {
        if (!group || !group.white) {
          console.warn('🎯 convertGameTreeToNotation: Invalid group:', group);
          return;
        }
        
        notationText += `${indent}${group.moveNumber}. ${group.white.notation}`;
        if (group.black) {
          notationText += ` ${group.black.notation}`;
        }
        notationText += '\n';
        
        // Add variations for white move
        if (group.white && group.white.variations && Array.isArray(group.white.variations) && group.white.variations.length > 0) {
          group.white.variations.forEach((variation) => {
            if (variation && variation.moves && Array.isArray(variation.moves)) {
              const variationStartMoveNumber = startMoveNumber + Math.floor(group.moveNumber - startMoveNumber);
              console.log('🎯 Converting white move variation:', variation, 'at level:', level + 1);
              notationText += convertGameTreeToNotation(variation, level + 1, variationStartMoveNumber);
            }
          });
        }
        
        // Add variations for black move
        if (group.black && group.black.variations && Array.isArray(group.black.variations) && group.black.variations.length > 0) {
          group.black.variations.forEach((variation) => {
            if (variation && variation.moves && Array.isArray(variation.moves)) {
              const variationStartMoveNumber = startMoveNumber + Math.floor(group.moveNumber - startMoveNumber);
              console.log('🎯 Converting black move variation:', variation, 'at level:', level + 1);
              notationText += convertGameTreeToNotation(variation, level + 1, variationStartMoveNumber);
            }
          });
        }
      });

      // Add variations at the game tree level (for sublines/continuations)
      if (gameTree.variations && Array.isArray(gameTree.variations) && gameTree.variations.length > 0) {
        console.log('🎯 Converting game tree level variations:', gameTree.variations.length, 'at level:', level + 1);
        gameTree.variations.forEach((variation) => {
          if (variation && variation.moves && Array.isArray(variation.moves) && variation.moves.length > 0) {
            console.log('🎯 Converting game tree variation:', variation, 'at level:', level + 1);
            notationText += convertGameTreeToNotation(variation, level + 1, startMoveNumber);
          }
        });
      }
    } catch (error) {
      console.error('🎯 convertGameTreeToNotation: Error processing grouped moves:', error, 'groupedMoves:', groupedMoves);
      return '';
    }

    return notationText;
  };

  // Render the notation tree with unlimited nesting
  const renderNotationTree = (position) => {
    try {
      if (!position) {
        console.log('🎯 renderNotationTree: position is null/undefined');
        return (
          <div className="text-center text-gray-400 italic py-8">
            <div className="text-lg mb-2">🎯</div>
            <div>Make moves on the board to see them here</div>
            <div className="text-xs mt-2">Click pieces to move them</div>
          </div>
        );
      }
      
      if (!position.moves) {
        console.log('🎯 renderNotationTree: position.moves is null/undefined', position);
        return (
          <div className="text-center text-gray-400 italic py-8">
            <div className="text-lg mb-2">🎯</div>
            <div>Make moves on the board to see them here</div>
            <div className="text-xs mt-2">Click pieces to move them</div>
          </div>
        );
      }
      
      if (!Array.isArray(position.moves)) {
        console.log('🎯 renderNotationTree: position.moves is not an array', position.moves);
        return (
          <div className="text-center text-gray-400 italic py-8">
            <div className="text-lg mb-2">🎯</div>
            <div>Make moves on the board to see them here</div>
            <div className="text-xs mt-2">Click pieces to move them</div>
          </div>
        );
      }
      
      if (position.moves.length === 0) {
        console.log('🎯 renderNotationTree: position.moves is empty');
        return (
          <div className="text-center text-gray-400 italic py-8">
            <div className="text-lg mb-2">🎯</div>
            <div>Make moves on the board to see them here</div>
            <div className="text-xs mt-2">Click pieces to move them</div>
          </div>
        );
      }

      console.log('🎯 renderNotationTree - position:', position);
      console.log('🎯 renderNotationTree - variations:', position.variations?.length || 0);
      
      const notationText = convertGameTreeToNotation(position);
      console.log('🎯 Generated notation text:', notationText);
      
      const parsedTree = notationText ? parseNotation(notationText) : [];
      console.log('🎯 Parsed tree:', parsedTree);
      
      return (
        <div className="notation-section">
          {parsedTree.length > 0 ? (
            parsedTree.map((node, idx) => renderNode(node, idx))
          ) : (
            <div className="text-center text-gray-400 italic py-8">
              <div className="text-lg mb-2">🎯</div>
              <div>Make moves on the board to see them here</div>
              <div className="text-xs mt-2">Click pieces to move them</div>
            </div>
          )}
        </div>
      );
    } catch (error) {
      console.error('🎯 renderNotationTree: Error:', error, 'position:', position);
      return (
        <div className="text-center text-red-400 italic py-8">
          <div className="text-lg mb-2">❌</div>
          <div>Error rendering notation tree</div>
          <div className="text-xs mt-2">Check console for details</div>
        </div>
      );
    }
  };

  // Safety wrapper to prevent crashes
  try {
    if (!gameTree) {
      console.error('🎯 gameTree is undefined, initializing...');
      return (
        <div className="w-full max-w-6xl mx-auto p-4 bg-gray-50 min-h-screen">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="text-red-500 text-lg mb-4">❌ Error: Game tree not initialized</div>
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    if (!gameTree.moves || !Array.isArray(gameTree.moves)) {
      console.error('🎯 gameTree.moves is invalid:', gameTree);
      return (
        <div className="w-full max-w-6xl mx-auto p-4 bg-gray-50 min-h-screen">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="text-red-500 text-lg mb-4">❌ Error: Game tree structure invalid</div>
            <button 
              onClick={() => {
                safeSetGameTree({ moves: [], variations: [] });
                window.location.reload();
              }} 
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Reset Game Tree
            </button>
          </div>
        </div>
      );
    }
  } catch (error) {
    console.error('🎯 Error in safety wrapper:', error);
    return (
      <div className="w-full max-w-6xl mx-auto p-4 bg-gray-50 min-h-screen">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="text-red-500 text-lg mb-4">❌ Critical Error: {error.message}</div>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-4 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="p-6">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Chess Analysis Board
            </h1>
            
            {/* Mode Switcher */}
            <div className="flex justify-center space-x-2 mb-4">
              <button
                onClick={() => setCurrentMode('analysis')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  currentMode === 'analysis'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <Brain className="w-4 h-4 inline mr-2" />
                Analysis
              </button>
              <button
                onClick={() => {
                  setCurrentMode('editor');
                  setIsEditing(true);
                  setEditMode(true);
                  // Load current position into editor
                  setFenString(game.fen());
                }}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  currentMode === 'editor'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <Edit3 className="w-4 h-4 inline mr-2" />
                Board Editor
              </button>
            </div>
          </div>
          
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Chess Board */}
            <div className="flex-shrink-0">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800">Analysis Board</h2>
                <div className="flex items-center space-x-2">
                  <button
                    className="px-3 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors flex items-center space-x-1"
                    onClick={flipBoard}
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Flip</span>
                  </button>
                  <button
                    className="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                    onClick={() => {
                      setGame(new Chess());
                      setBoardPosition('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
                      safeSetGameTree({ moves: [], variations: [] });
                      setCurrentPath([]);
                      setCurrentMove(0);
                      setIsWhiteTurn(true);
                      setMoveNumber(1);
                    }}
                  >
                    Reset
                  </button>
                </div>
              </div>

              <div className="flex flex-col items-center space-y-4">
                <div className="mobile-board-container" style={{ 
                  width: '100%',
                  maxWidth: isMobile ? '100%' : '600px',
                  margin: isMobile ? '0 auto 15px' : '0 auto 30px',
                  border: '3px solid #374151',
                  borderRadius: '16px',
                  overflow: isMobile ? 'visible' : 'hidden',
                  flexShrink: 0,
                  boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1)',
                  background: isBoardUpdating 
                    ? 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)' 
                    : 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                  position: 'relative',
                  display: 'block',
                  visibility: 'visible',
                  zIndex: 1,
                  // Ensure a perfect square on mobile so the board fits exactly
                  aspectRatio: isMobile ? '1 / 1' : undefined,
                  height: isMobile ? 'auto' : undefined,
                  // Performance optimizations
                  willChange: 'transform',
                  transform: 'translateZ(0)', // Force hardware acceleration
                  backfaceVisibility: 'hidden',
                  perspective: '1000px',
                  // Smooth transitions
                  transition: 'background 0.1s ease-in-out',
                  touchAction: 'none',
                  WebkitUserSelect: 'none',
                  userSelect: 'none'
                }}>
                  {MemoizedChessboard}
                  
                  {/* Loading indicator during board updates */}
                  {isBoardUpdating && (
                    <div style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      background: 'rgba(0, 0, 0, 0.7)',
                      color: 'white',
                      padding: '8px 16px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      zIndex: 20,
                      pointerEvents: 'none',
                      animation: 'pulse 0.5s ease-in-out'
                    }}>
                      Updating...
                    </div>
                  )}
                </div>
              
                {/* Navigation Controls */}
                <div className="flex items-center space-x-2 bg-gray-50 p-3 rounded-lg">
                  <button
                    className="p-2 bg-white border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-gray-800"
                    onClick={goToStart}
                    disabled={currentMove === 0}
                    title="Go to start (Home key)"
                  >
                    <SkipBack className="w-4 h-4" />
                  </button>
                  <button
                    className="p-2 bg-white border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-gray-800"
                    onClick={goToPrevious}
                    disabled={currentMove === 0}
                    title="Previous move (← Arrow)"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="px-4 py-2 bg-white border rounded font-mono text-sm text-gray-800">
                    Move {currentMove} / {pgn && moveHistory ? moveHistory.length : gameTree.moves.length}
                  </span>
                  <button
                    className="p-2 bg-white border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-gray-800"
                    onClick={goToNext}
                    disabled={currentMove >= (pgn && moveHistory ? moveHistory.length : gameTree.moves.length)}
                    title="Next move (→ Arrow)"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <button
                    className="p-2 bg-white border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-gray-800"
                    onClick={goToEnd}
                    disabled={currentMove >= (pgn && moveHistory ? moveHistory.length : gameTree.moves.length)}
                    title="Go to end (End key)"
                  >
                    <SkipForward className="w-4 h-4" />
                  </button>
                </div>
                
                {/* Variation Controls */}
                <div className="flex items-center space-x-2 bg-blue-50 p-3 rounded-lg mt-2">
                  <button
                    className="px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
                    onClick={() => createVariation()}
                    disabled={notationPosition.moveIndex < 0}
                    title="Create variation at current position"
                  >
                    <Plus className="w-4 h-4" />
                    Create Variation
                  </button>
                  <button
                    className="px-3 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
                    onClick={() => exitVariation()}
                    disabled={notationPosition.path.length === 0}
                    title="Exit to parent variation"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Exit Variation
                  </button>
                  <span className="px-3 py-2 bg-white border rounded text-sm text-gray-700">
                    {notationPosition.path.length === 0 ? 'Main Line' : `Variation (Depth: ${notationPosition.path.length})`}
                  </span>
                </div>
              </div>

              {/* Play with Bot Button */}
              <div className="flex justify-center mt-4">
                {!botGameState.isPlaying ? (
                  <button
                    onClick={startBotGame}
                    className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium flex items-center gap-2 transition-colors"
                  >
                    <Bot className="w-5 h-5" />
                    Play with Bot
                  </button>
                ) : (
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${
                        botGameState.isBotThinking ? 'bg-blue-500 animate-pulse' : 'bg-green-500'
                      }`}></div>
                      <span className="text-sm font-medium">
                        {botGameState.isBotThinking ? 'Bot thinking...' : 
                         botGameState.isPlayerTurn ? 'Your turn' : 'Bot turn'}
                      </span>
                    </div>
                    <button
                      onClick={stopBotGame}
                      className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded text-sm"
                    >
                      Stop Game
                    </button>
                  </div>
                )}
              </div>
              
              {/* Current Position Info */}
              <div className="mt-4 text-center">
                <div className="text-sm text-gray-600">
                  Turn: <span className="font-semibold">{isWhiteTurn ? 'White' : 'Black'}</span>
                </div>
                <div className="text-sm text-gray-600">
                  Move: <span className="font-semibold">{moveNumber}</span>
                </div>
                {currentPath.length > 0 && (
                  <div className="text-sm text-blue-600">
                    Variation Level: <span className="font-semibold">{currentPath.length}</span>
                    <button 
                      onClick={goToMainLine}
                      className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs hover:bg-blue-200"
                    >
                      Return to Main Line
                    </button>
                  </div>
                )}
                
                {/* Variation Debug Button */}
                <button
                  className="mt-2 px-3 py-1 bg-purple-500 text-white rounded text-xs hover:bg-purple-600"
                  onClick={() => {
                    console.log('🎯 VARIATION SYSTEM DEBUG');
                    console.log('Game tree:', JSON.stringify(gameTree, null, 2));
                    console.log('Current path:', currentPath);
                    console.log('Is creating variation:', isCreatingVariation);
                    console.log('Variation start move:', variationStartMove);
                    console.log('Current move:', currentMove);
                    alert('Check console for variation system debug info');
                  }}
                  title="Debug variation system"
                >
                  Debug Variations
                </button>
              </div>
            </div>
            
            {/* Notation Panel */}
            <div className="flex-1">
              <div className="bg-gray-50 border rounded-lg p-4 h-96 overflow-auto">
                <h3 className="font-semibold mb-3 text-gray-800">Game Notation</h3>
                
                {/* Show PGN move history if loaded from openings page */}
                {pgn && moveHistory && moveHistory.length > 0 ? (
                  <div className="space-y-2">
                    <div className="text-sm text-blue-600 mb-3 font-medium">
                      Opening: {pgn.split('\n')[0].replace('[Event "', '').replace('"]', '')}
                    </div>
                    <div className="text-xs text-green-600 mb-2 bg-green-50 p-2 rounded">
                      ✓ Loaded {moveHistory.length} moves from openings page
                    </div>
                    <div className="text-xs text-blue-600 mb-2 bg-blue-50 p-2 rounded">
                      🎮 Use navigation buttons or click moves to navigate through the opening
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {moveHistory.map((move, index) => (
                        <div 
                          key={index}
                          className={`p-2 rounded cursor-pointer transition-colors ${
                            index === currentMove - 1 
                              ? 'bg-blue-100 border-2 border-blue-500' 
                              : 'bg-white hover:bg-gray-100'
                          }`}
                          onClick={() => {
                            // Use the PGN navigation system
                            navigatePGNMove(index + 1);
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-sm">
                              {Math.floor(index / 2) + 1}.{index % 2 === 0 ? '' : '..'} {move.san}
                            </span>
                            <span className="text-xs text-gray-500">
                              {move.color === 'w' ? 'White' : 'Black'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="text-sm text-gray-500 mb-3">
                      {pgn ? `Loading move history... (PGN loaded, moves: ${moveHistory ? moveHistory.length : 'undefined'})` : 'Start making moves on the board to see them here.'}
                    </div>
                    
                    {/* Variation Creation Controls */}
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-blue-800">Variation Controls</h4>
                        <div className="flex gap-2">
                          <button
                            className={`px-3 py-1 text-xs rounded ${
                              isCreatingVariation 
                                ? 'bg-green-500 text-white' 
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                            onClick={() => {
                              if (isCreatingVariation) {
                                setIsCreatingVariation(false);
                                setVariationStartMove(null);
                                setCurrentVariationPath([]);
                                console.log('🎯 Stopped creating variation');
                              } else {
                                startVariation(currentMove, currentPath);
                                console.log('🎯 Started creating variation');
                              }
                            }}
                          >
                            {isCreatingVariation ? 'Stop Variation' : 'Start Variation'}
                          </button>
                          <button
                            className="px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
                            onClick={() => {
                              setIsCreatingVariation(false);
                              setVariationStartMove(null);
                              setCurrentVariationPath([]);
                              console.log('🎯 Cancelled variation creation');
                            }}
                          >
                            Cancel
                          </button>
                          <button
                            className="px-3 py-1 text-xs bg-purple-500 text-white rounded hover:bg-purple-600"
                            onClick={() => {
                              // Test creating multiple levels of variations
                              console.log('🎯 Testing multiple variation levels');
                              
                              // Create a test variation structure
                              const testGameTree = {
                                moves: [
                                  { id: 1, notation: 'e4', from: 'e2', to: 'e4', piece: 'p', captured: null, fullMoveNumber: 1, isWhite: true },
                                  { id: 2, notation: 'e5', from: 'e7', to: 'e5', piece: 'p', captured: null, fullMoveNumber: 1, isWhite: false }
                                ],
                                variations: [
                                  {
                                    id: 'var1',
                                    moves: [
                                      { id: 3, notation: 'c5', from: 'c7', to: 'c5', piece: 'p', captured: null, fullMoveNumber: 1, isWhite: false }
                                    ],
                                    variations: [
                                      {
                                        id: 'subvar1',
                                        moves: [
                                          { id: 4, notation: 'Nf3', from: 'g1', to: 'f3', piece: 'n', captured: null, fullMoveNumber: 2, isWhite: true }
                                        ],
                                        variations: [
                                          {
                                            id: 'subsubvar1',
                                            moves: [
                                              { id: 5, notation: 'd4', from: 'd2', to: 'd4', piece: 'p', captured: null, fullMoveNumber: 2, isWhite: true }
                                            ],
                                            variations: []
                                          }
                                        ]
                                      }
                                    ]
                                  }
                                ]
                              };
                              
                              safeSetGameTree(testGameTree);
                              console.log('🎯 Test variation structure created');
                            }}
                          >
                            Test Multi-Level
                          </button>
                        </div>
                      </div>
                      {isCreatingVariation && (
                        <div className="text-sm text-blue-700">
                          <div>Creating variation from move {variationStartMove}</div>
                          <div>Path: {currentVariationPath.length > 0 ? currentVariationPath.join(' → ') : 'Main line'}</div>
                          <div className="text-xs text-blue-600 mt-1">
                            Make moves on the board to add them to this variation
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            Current nesting level: {currentVariationPath.length}
                          </div>
                        </div>
                      )}
                      
                      {/* Debug info */}
                      <div className="mt-2 p-2 bg-gray-100 rounded text-xs">
                        <div className="font-semibold">Debug Info:</div>
                        <div>Game tree moves: {gameTree.moves.length}</div>
                        <div>Game tree variations: {gameTree.variations?.length || 0}</div>
                        <div>Current path: {currentPath.join(' → ') || 'Main line'}</div>
                        <div>Current move: {currentMove}</div>
                        <div>Variation path: {currentVariationPath.join(' → ') || 'None'}</div>
                        <div>Creating variation: {isCreatingVariation ? 'Yes' : 'No'}</div>
                        
                        {/* Show variation structure */}
                        <div className="mt-2">
                          <div className="font-semibold">Variation Structure:</div>
                          {gameTree.variations?.map((variation, idx) => (
                            <div key={idx} className="ml-2">
                              Var {idx + 1}: {variation.moves.length} moves
                              {variation.variations?.map((subVar, subIdx) => (
                                <div key={subIdx} className="ml-4">
                                  Sub-var {subIdx + 1}: {subVar.moves.length} moves
                                  {subVar.variations?.map((subSubVar, subSubIdx) => (
                                    <div key={subSubIdx} className="ml-6">
                                      Sub-sub-var {subSubIdx + 1}: {subSubVar.moves.length} moves
                                    </div>
                                  ))}
                                </div>
                              ))}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="notation-display space-y-2">
                      <SimpleChessNotation 
                        gameTree={notationGameTree}
                        position={notationPosition}
                        onMoveClick={(moveIndex) => {
                          console.log('Move clicked:', moveIndex);
                        }}
                        onVariationClick={(moveIndex, varIndex, varMoveIndex) => {
                          console.log('Variation clicked:', moveIndex, varIndex, varMoveIndex);
                        }}
                      />
                    </div>
                  </div>
                )}
                
                {gameTree && gameTree.moves && Array.isArray(gameTree.moves) && gameTree.moves.length === 0 && !pgn && (
                  <div className="text-gray-500 text-center italic mt-8">
                    Click on pieces to make moves.<br/>
                    Moves will appear here with full variation support.
                  </div>
                )}
              </div>
              
              {/* Opening Explorer */}
              <div className="mt-4 bg-white border rounded-lg p-4">
                <div className="flex items-center mb-3">
                  <BookOpen className="w-5 h-5 mr-2 text-blue-600" />
                  <h3 className="font-semibold text-gray-800">Opening Explorer</h3>
                </div>
                <div className="space-y-2 max-h-48 overflow-auto">
                  {openingMoves.length > 0 ? (
                    openingMoves.map((move, index) => (
                      <div 
                        key={index} 
                        className="flex items-center justify-between p-2 bg-gray-50 rounded hover:bg-blue-50 cursor-pointer transition-colors"
                        onClick={() => playOpeningMove(move)}
                      >
                        <div className="flex items-center space-x-3">
                          <span className="font-mono font-semibold text-blue-600">{move.san}</span>
                          <div className="text-sm text-gray-600">
                            <span className="text-green-600">{move.white}</span> / 
                            <span className="text-gray-500">{move.draws}</span> / 
                            <span className="text-red-600">{move.black}</span>
                          </div>
                        </div>
                        <div className="text-sm text-gray-500">
                          {Math.round((move.white / move.total) * 100)}% win rate
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-gray-500 text-center italic py-4">
                      No opening data available for this position
                    </div>
                  )}
                </div>
              </div>
              
              {/* Board Editor Controls Panel */}
              {currentMode === 'editor' && (
                <div className="mt-4 bg-white rounded-lg shadow-lg p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold">Board Editor</h3>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setIsEditing(!isEditing)}
                        className={`px-3 py-1 rounded text-sm font-medium ${
                          isEditing 
                            ? 'bg-green-500 text-white hover:bg-green-600' 
                            : 'bg-gray-500 text-white hover:bg-gray-600'
                        }`}
                      >
                        {isEditing ? '✓ Edit Mode' : 'Edit Mode'}
                      </button>
                    </div>
                  </div>
                  
                  {isEditing && (
                    <div className="space-y-4">
                      {/* Piece Selection */}
                      <div>
                        <h4 className="font-semibold mb-2">Piece Palette</h4>
                        <div className="grid grid-cols-6 gap-2">
                          {availablePieces.map(piece => (
                            <button
                              key={piece}
                              onClick={() => setSelectedPiece(selectedPiece === piece ? '' : piece)}
                              className={`p-2 rounded border-2 transition-colors ${
                                selectedPiece === piece
                                  ? 'border-blue-500 bg-blue-100'
                                  : 'border-gray-300 hover:border-gray-400'
                              }`}
                              title={`${piece[0] === 'w' ? 'White' : 'Black'} ${piece[1]}`}
                            >
                              <span className="text-2xl">{pieceIcons[piece]}</span>
                            </button>
                          ))}
                        </div>
                        <div className="mt-2 text-sm text-gray-600">
                          {selectedPiece ? `Selected: ${pieceIcons[selectedPiece]} ${selectedPiece[0] === 'w' ? 'White' : 'Black'} ${selectedPiece[1]}` : 'Click a piece to select it, or click empty to remove pieces'}
                        </div>
                      </div>
                      
                      {/* Board Controls */}
                      <div>
                        <h4 className="font-semibold mb-2">Board Controls</h4>
                        <div className="flex gap-2 flex-wrap">
                          <button
                            onClick={clearBoard}
                            className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                          >
                            Clear Board
                          </button>
                          <button
                            onClick={resetToStartingPosition}
                            className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                          >
                            Starting Position
                          </button>
                          <button
                            onClick={() => {
                              const newGame = new Chess(fenString);
                              setGame(newGame);
                              updateBoardPosition(fenString);
                            }}
                            className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
                          >
                            Load from FEN
                          </button>
                        </div>
                      </div>
                      
                      {/* FEN Display */}
                      <div>
                        <h4 className="font-semibold mb-2">Position (FEN)</h4>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={fenString}
                            onChange={(e) => setFenString(e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm font-mono"
                            placeholder="Enter FEN string..."
                          />
                          <button
                            onClick={() => {
                              try {
                                const newGame = new Chess(fenString);
                                setGame(newGame);
                                updateBoardPosition(fenString);
                              } catch (error) {
                                alert('Invalid FEN string');
                              }
                            }}
                            className="px-3 py-2 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                          >
                            Load
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Simple Engine Analysis Panel */}
              {currentMode === 'analysis' && (
                <div className="mt-4 bg-white rounded-lg shadow-lg p-6">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="text-xl font-bold">Engine Analysis</h3>
                    <p className="text-xs text-gray-500 mt-1">
                      {engineError ? 'Using basic analysis' : 'Powered by Lichess Cloud Analysis'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${
                      engineStatus === 'analyzing' ? 'bg-blue-500' : 
                      engineError ? 'bg-orange-500' : 'bg-green-500'
                    }`}></div>
                    <span className="text-sm font-medium">{engineStatus}</span>
                  </div>
                </div>
                
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={() => analyzePosition(boardPosition)}
                    className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                  >
                    Analyze
                  </button>
                  <button
                    onClick={initializeEngine}
                    className="px-3 py-1 bg-orange-500 text-white rounded text-sm hover:bg-orange-600"
                  >
                    Restart Engine
                  </button>
                </div>
                
                {/* Position Evaluation */}
                {engineSuggestions.length > 0 && (
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Position Evaluation:</span>
                      <span className={`text-lg font-bold ${
                        engineSuggestions[0].evaluation.startsWith('+') ? 'text-green-600' :
                        engineSuggestions[0].evaluation.startsWith('-') ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {engineSuggestions[0].evaluation}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Depth: {engineSuggestions[0].depth} | Nodes: {engineSuggestions[0].nodes?.toLocaleString() || 'N/A'}
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  {engineStatus === 'analyzing' ? (
                    <div className="text-blue-600 text-center py-4">
                      <div className="flex items-center justify-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        <span>Analyzing position...</span>
                      </div>
                    </div>
                  ) : engineError ? (
                    <div className="text-orange-600 text-center py-4">
                      <div className="mb-2">⚠️ {engineError}</div>
                      <button 
                        onClick={() => analyzePosition(boardPosition)}
                        className="px-3 py-1 bg-orange-500 text-white rounded text-sm hover:bg-orange-600"
                      >
                        Retry Analysis
                      </button>
                    </div>
                  ) : engineSuggestions.length === 0 ? (
                    <div className="text-gray-500 italic text-center py-4">
                      <div>No engine suggestions available</div>
                    </div>
                  ) : (
                    engineSuggestions.map((suggestion, index) => (
                      <div 
                        key={index} 
                        className="bg-gray-50 p-3 rounded-lg border hover:bg-blue-50 cursor-pointer transition-colors"
                        onClick={() => playEngineMove(suggestion)}
                      >
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-mono text-lg font-bold">{suggestion.san}</span>
                          <span className="font-bold text-green-600">
                            {suggestion.evaluation}
                          </span>
                        </div>
                        <div className="text-xs text-gray-600 space-y-1">
                          <div>Depth: {suggestion.depth} | Nodes: {suggestion.nodes?.toLocaleString()}</div>
                          <div className="font-mono">Line: {suggestion.pv.join(' ')}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
              )}
              
              {/* Instructions */}
              <div className="mt-4 text-sm text-gray-600 space-y-2">
                <p><strong>How to use:</strong></p>
                <ul className="list-disc list-inside space-y-1">
                  {currentMode === 'analysis' && (
                    <>
                      <li>Click a piece to select it, then click destination square</li>
                      <li>Use navigation buttons to replay moves</li>
                      <li>Click on any move in notation to jump to that position</li>
                      <li>Making moves at earlier positions creates variations</li>
                      <li>Variations are shown with indentation and numbering</li>
                      <li><strong>Opening Explorer:</strong> Shows popular moves from master games</li>
                      <li><strong>Engine Suggestions:</strong> Analyzes position and suggests best moves (click to play)</li>
                    </>
                  )}
                  {currentMode === 'editor' && (
                    <>
                      <li>Click "Edit Mode" to enable board editing</li>
                      <li>Select a piece from the palette, then click on a square to place it</li>
                      <li>Click the ✕ to remove pieces from squares</li>
                      <li>Use "Clear Board" to remove all pieces</li>
                      <li>Use "Starting Position" to reset to initial chess position</li>
                    </>
                  )}
                  {currentMode === 'bot' && (
                    <>
                      <li>Select a bot opponent and your color</li>
                      <li>Choose time control (Blitz, Rapid, or Classical)</li>
                      <li>Click "Start Game" to begin playing</li>
                      <li>Make moves by dragging pieces on the board</li>
                      <li>Watch the move history and game status</li>
                    </>
                  )}
                </ul>
                {currentMode === 'analysis' && (
                  <>
                    <p><strong>Keyboard shortcuts:</strong></p>
                    <ul className="list-disc list-inside space-y-1">
                      <li><kbd className="px-1 py-0.5 bg-gray-200 rounded text-xs">←</kbd> Previous move</li>
                      <li><kbd className="px-1 py-0.5 bg-gray-200 rounded text-xs">→</kbd> Next move</li>
                      <li><kbd className="px-1 py-0.5 bg-gray-200 rounded text-xs">Home</kbd> Go to start</li>
                      <li><kbd className="px-1 py-0.5 bg-gray-200 rounded text-xs">End</kbd> Go to end</li>
                      <li><kbd className="px-1 py-0.5 bg-gray-200 rounded text-xs">Esc</kbd> Return to main line</li>
                    </ul>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
          <style jsx>{`
            .move-btn {
              @apply px-3 py-2 rounded text-sm font-medium border transition-colors cursor-pointer min-w-[3rem] text-center;
            }
            
            .move-btn.current-move {
              @apply bg-green-500 text-white font-semibold border-green-600;
            }
            
            .moves-line {
              @apply mb-2;
            }
            
            .moves-line.main-line {
              @apply font-medium;
            }
            
            .moves-line.variation {
              @apply text-gray-700 ml-4 text-sm;
            }
            
            .moves-line.current-line {
              @apply bg-blue-50 rounded px-2 py-1;
            }
            
            .move-pair {
              @apply flex items-center mb-1;
            }
            
            .move-number {
              @apply text-gray-600 font-mono text-sm mr-2 w-8 text-right;
            }
            
            .move-buttons {
              @apply flex space-x-2;
            }
            
            .white-move {
              @apply bg-white border-gray-400 text-gray-800 hover:bg-gray-50;
            }
            
            .black-move {
              @apply bg-gray-100 border-gray-400 text-gray-800 hover:bg-gray-200;
            }
            
            .variation-indicator {
              @apply text-blue-600 font-semibold mr-2;
            }
            
            .variation-container {
              @apply border-l-2 border-gray-200 pl-2 ml-2 mt-1;
            }
            
            .notation-display {
              @apply font-mono text-sm;
            }
          `}</style>
        
        {/* Hidden file input for import */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileImport}
          className="hidden"
        />
    </div>
  );
};

export default ChessBoard;

