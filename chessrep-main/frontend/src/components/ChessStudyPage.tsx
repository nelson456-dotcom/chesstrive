import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, SkipBack, SkipForward, Play, Pause, RotateCcw, BookOpen, Plus, Trash2, Upload, Download, ChevronUp, Brain, Bot, Settings, Edit3, Eye, Copy, Square } from 'lucide-react';
import { Chess } from 'chess.js';
import ProductionChessBoard from './ProductionChessBoard';
import { VariationTree, MoveAnnotation, MoveNode as BaseMoveNode } from './VariationTree';
import TraditionalNotation from './TraditionalNotation';

// Compatibility class that extends BaseMoveNode
class MoveNode extends BaseMoveNode {
  public id: string;
  public san: string;
  public from: string;
  public to: string;
  public commentAfter?: string;
  public depth: number;
  public isWhite: boolean;

  constructor(baseNode: BaseMoveNode, id: string, from: string = '', to: string = '') {
    super({
      move: baseNode.move,
      comment: baseNode.comment,
      annotation: baseNode.annotation,
      moveNumber: baseNode.moveNumber,
      isWhiteMove: baseNode.isWhiteMove
    });
    
    this.id = id;
    this.san = baseNode.move;
    this.from = from;
    this.to = to;
    this.commentAfter = baseNode.comment;
    this.depth = baseNode.getDepth();
    this.isWhite = baseNode.isWhiteMove;
  }

  // Type-safe accessors for parent and variations
  getParent(): MoveNode | null {
    return this.parent as MoveNode | null;
  }

  setParent(value: MoveNode | null): void {
    this.parent = value;
  }

  getVariations(): MoveNode[] {
    return this.variations as MoveNode[];
  }

  setVariations(value: MoveNode[]): void {
    this.variations = value;
  }
}

// Helper function to convert BaseMoveNode to MoveNode
const convertToMoveNode = (baseNode: BaseMoveNode, id: string, from: string = '', to: string = ''): MoveNode => {
  return new MoveNode(baseNode, id, from, to);
};

interface GameTree {
  moveAnnotation: MoveAnnotation;
  currentPath: string[]; // Array of node IDs representing current position
  currentNode: MoveNode | null;
  root: MoveNode | null;
  moves: any[];
  variations: any[];
  branchPoint?: number;
}

// Types for chapter management
interface Chapter {
  id: number;
  name: string;
  pgn: string;
  headers: Record<string, string>;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Types for study management
interface Study {
  id: number;
  name: string;
  active: boolean;
  chapters: Chapter[];
  currentChapterId?: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}



export default function ChessStudyPage() {
  const navigate = useNavigate();
  const [game, setGame] = useState(() => new Chess());
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [boardOrientation, setBoardOrientation] = useState<'white' | 'black'>('white');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Game tree state (same as chess-annotation-advanced)
  const [gameTree, setGameTree] = useState<GameTree>(() => {
    const moveAnnotation = new MoveAnnotation();
    return {
      moveAnnotation: moveAnnotation,
      currentPath: [],
      currentNode: null,
      root: null,
      moves: [],
      variations: [],
      branchPoint: 0
    };
  });
  
  // Additional state variables from chess-annotation-advanced
  const [selectedNode, setSelectedNode] = useState<MoveNode | null>(null);
  const [boardPosition, setBoardPosition] = useState('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
  const [isBoardUpdating, setIsBoardUpdating] = useState(false);
  
  // Responsive state (same as chess-annotation-advanced)
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);
  
  // Enhanced analysis board state from chess-analysis-board
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [currentMove, setCurrentMove] = useState(0);
  const [isWhiteTurn, setIsWhiteTurn] = useState(true);
  const [moveNumber, setMoveNumber] = useState(1);
  const [openingMoves, setOpeningMoves] = useState([]);
  const [currentPath, setCurrentPath] = useState([]);
  const nextId = useRef(1);
  
  // Simple engine state for now
  const [engineSuggestions, setEngineSuggestions] = useState([]);
  const [engineStatus, setEngineStatus] = useState('ready');
  const [engineDebug, setEngineDebug] = useState([]);
  const [engineError, setEngineError] = useState(null);
  
  // Mode state
  const [currentMode, setCurrentMode] = useState('analysis'); // 'analysis', 'editor', 'bot'
  
  // Board editor state
  const [isEditing, setIsEditing] = useState(false);
  const [selectedPiece, setSelectedPiece] = useState('');
  const [editMode, setEditMode] = useState(true);
  const [fenString, setFenString] = useState('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
  
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
  
  // Load studies from localStorage on component mount
  const loadStudiesFromStorage = useCallback(() => {
    try {
      const savedStudies = localStorage.getItem('chess-studies');
      if (savedStudies) {
        const parsed = JSON.parse(savedStudies);
        // Convert date strings back to Date objects
        const studiesWithDates = parsed.map((study: any) => ({
          ...study,
          createdAt: new Date(study.createdAt),
          updatedAt: new Date(study.updatedAt),
          chapters: study.chapters.map((chapter: any) => ({
            ...chapter,
            createdAt: new Date(chapter.createdAt),
            updatedAt: new Date(chapter.updatedAt)
          }))
        }));
        return studiesWithDates;
      }
    } catch (error) {
      console.error('Error loading studies from localStorage:', error);
    }
    
    // Return default studies if no saved data
    return [
      { 
        id: 1, 
        name: 'Italian Game Study', 
        active: true, 
        chapters: [
          {
            id: 1,
            name: 'Main Line',
            pgn: '',
            headers: {},
            notes: '',
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ],
        currentChapterId: 1,
        notes: '',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      { 
        id: 2, 
        name: 'Sicilian Defense', 
        active: false, 
        chapters: [
          {
            id: 2,
            name: 'Dragon Variation',
            pgn: '',
            headers: {},
            notes: '',
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ],
        currentChapterId: 2,
        notes: '',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
  }, []);

  // Study management
  const [studies, setStudies] = useState<Study[]>(loadStudiesFromStorage);
  const [activeStudy, setActiveStudy] = useState(1);
  const [activeChapter, setActiveChapter] = useState(1);
  const [studyNotes, setStudyNotes] = useState('');
  const [chapterNotes, setChapterNotes] = useState('');

  // Save studies to localStorage whenever studies change
  useEffect(() => {
    try {
      localStorage.setItem('chess-studies', JSON.stringify(studies));
    } catch (error) {
      console.error('Error saving studies to localStorage:', error);
    }
  }, [studies]);

  // Engine analysis functions from chess-analysis-board
  const initializeEngine = useCallback(() => {
    console.log('Engine initialized');
    setEngineStatus('ready');
  }, []);
  
  const analyzePosition = useCallback(async (fen) => {
    console.log('Analyzing position:', fen);
    setEngineStatus('analyzing');
    setEngineError(null);
    
    try {
      // Use Lichess Cloud Analysis API for real engine analysis
      const response = await fetch(`https://lichess.org/api/cloud-eval?fen=${encodeURIComponent(fen)}&multiPv=3&depth=15`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.pvs && data.pvs.length > 0) {
        const suggestions = data.pvs.map((pv, index) => {
          // Convert UCI move to SAN
          const tempGame = new Chess(fen);
          const firstMove = pv.moves.split(' ')[0];
          const from = firstMove.substring(0, 2);
          const to = firstMove.substring(2, 4);
          const promotion = firstMove.length > 4 ? firstMove.substring(4) : undefined;
          
          // Find the SAN notation for this move
          const legalMoves = tempGame.moves({ verbose: true });
          const matchingMove = legalMoves.find(move => 
            move.from === from && 
            move.to === to && 
            (move.promotion || '') === (promotion || '')
          );
          
          const san = matchingMove ? matchingMove.san : firstMove;
          
          return {
            move: firstMove,
            san: san,
            evaluation: pv.cp ? (pv.cp / 100).toFixed(1) : '0.0',
            depth: data.depth || 15,
            pv: pv.moves.split(' ').slice(0, 3),
            nodes: data.knodes * 1000 || 100000,
            multipv: index + 1
          };
        });
        
        setEngineSuggestions(suggestions);
        setEngineStatus('ready');
      } else {
        // Fallback to basic move generation if no analysis available
        const tempGame = new Chess(fen);
        const legalMoves = tempGame.moves({ verbose: true });
        
        if (legalMoves.length === 0) {
          setEngineSuggestions([]);
          setEngineStatus('ready');
          return;
        }
        
        // Simple heuristic-based suggestions
        const suggestions = legalMoves.slice(0, 3).map((move, index) => {
          let evaluation = 0;
          
          // Basic piece values
          const pieceValues = { 'p': 1, 'n': 3, 'b': 3, 'r': 5, 'q': 9, 'k': 0 };
          if (move.captured) {
            evaluation += pieceValues[move.captured.toLowerCase()] * 0.1;
          }
          
          // Check for checks
          if (move.san.includes('+')) {
            evaluation += 0.5;
          }
          
          // Check for checkmate
          if (move.san.includes('#')) {
            evaluation = 10;
          }
          
          // Center control bonus
          const centerSquares = ['d4', 'd5', 'e4', 'e5'];
          if (centerSquares.includes(move.to)) {
            evaluation += 0.2;
          }
          
          // Development bonus for knights and bishops
          if (move.piece === 'n' || move.piece === 'b') {
            evaluation += 0.1;
          }
          
          const evalStr = evaluation > 0 ? `+${evaluation.toFixed(1)}` : evaluation.toFixed(1);
          
          return {
            move: move.from + move.to,
            san: move.san,
            evaluation: evalStr,
            depth: 15,
            pv: [move.from + move.to, '...'],
            nodes: 100000,
            multipv: index + 1
          };
        });
        
        setEngineSuggestions(suggestions);
        setEngineStatus('ready');
      }
    } catch (error) {
      console.error('Engine analysis failed:', error);
      setEngineError('Failed to connect to engine. Using basic analysis.');
      
      // Fallback to basic move generation
      const tempGame = new Chess(fen);
      const legalMoves = tempGame.moves({ verbose: true });
      
      if (legalMoves.length === 0) {
        setEngineSuggestions([]);
        setEngineStatus('ready');
        return;
      }
      
      const suggestions = legalMoves.slice(0, 3).map((move, index) => {
        let evaluation = 0;
        
        // Basic piece values
        const pieceValues = { 'p': 1, 'n': 3, 'b': 3, 'r': 5, 'q': 9, 'k': 0 };
        if (move.captured) {
          evaluation += pieceValues[move.captured.toLowerCase()] * 0.1;
        }
        
        // Check for checks
        if (move.san.includes('+')) {
          evaluation += 0.5;
        }
        
        // Check for checkmate
        if (move.san.includes('#')) {
          evaluation = 10;
        }
        
        const evalStr = evaluation > 0 ? `+${evaluation.toFixed(1)}` : evaluation.toFixed(1);
        
        return {
          move: move.from + move.to,
          san: move.san,
          evaluation: evalStr,
          depth: 15,
          pv: [move.from + move.to, '...'],
          nodes: 100000,
          multipv: index + 1
        };
      });
      
      setEngineSuggestions(suggestions);
      setEngineStatus('ready');
    }
  }, []);

  // Handle window resize (same as chess-analysis-board)
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Update board position function
  const updateBoardPosition = useCallback((newFen: string) => {
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

  // Get current position in game tree
  const getCurrentPosition = useCallback(() => {
    let current = gameTree;
    for (const pathIndex of currentPath) {
      if (pathIndex === 0) {
        current = { 
          moves: current.moves, 
          variations: current.variations,
          moveAnnotation: current.moveAnnotation,
          currentPath: current.currentPath,
          currentNode: current.currentNode,
          root: current.root,
          branchPoint: current.branchPoint
        };
      } else {
        current = current.variations[pathIndex - 1];
      }
    }
    return current;
  }, [gameTree, currentPath]);

  // Memoize current position to prevent infinite re-renders
  const currentPosition = useMemo(() => getCurrentPosition(), [getCurrentPosition]);

  // Navigate to specific move
  const navigateToMove = useCallback((targetMove) => {
    const currentPos = getCurrentPosition();
    if (targetMove < 0 || targetMove > currentPos.moves.length) {
      return;
    }
    
    // Reset game to starting position
    const tempGame = new Chess();
    
    // If we're in a variation, we need to reconstruct the position properly
    if (currentPath.length > 0) {
      // First, apply moves from the main line up to the branch point
      const variation = currentPos;
      const branchPoint = variation.branchPoint || 0;
      
      // Apply main line moves up to the branch point
      for (let i = 0; i < branchPoint; i++) {
        if (gameTree.moves[i]) {
          try {
            tempGame.move({
              from: gameTree.moves[i].from,
              to: gameTree.moves[i].to,
              promotion: gameTree.moves[i].promotion
            });
          } catch (e) {
            console.error('Error applying main line move:', e);
          }
        }
      }
      
      // Then apply variation moves up to targetMove
      for (let i = 0; i < targetMove; i++) {
        if (currentPos.moves[i]) {
          try {
            tempGame.move({
              from: currentPos.moves[i].from,
              to: currentPos.moves[i].to,
              promotion: currentPos.moves[i].promotion
            });
          } catch (e) {
            console.error('Error applying variation move:', e);
          }
        }
      }
    } else {
      // We're in the main line - apply moves normally
      for (let i = 0; i < targetMove; i++) {
        if (currentPos.moves[i]) {
          try {
            tempGame.move({
              from: currentPos.moves[i].from,
              to: currentPos.moves[i].to,
              promotion: currentPos.moves[i].promotion
            });
          } catch (e) {
            console.error('Error applying main line move:', e);
          }
        }
      }
    }
    
    // Update game and board position
    setGame(tempGame);
    updateBoardPosition(tempGame.fen());
    setCurrentMove(targetMove);
    setIsWhiteTurn(targetMove % 2 === 0);
    setMoveNumber(Math.floor(targetMove / 2) + 1);
  }, [getCurrentPosition, gameTree, currentPath]);

  // Navigation functions
  const goToStart = useCallback(() => {
    if (currentPath.length > 0) {
      // If we're in a variation, go to the start of the variation
      navigateToMove(0);
    } else {
      // If we're in the main line, go to the very beginning
      navigateToMove(0);
    }
  }, [currentPath, navigateToMove]);
  
  const goToEnd = useCallback(() => {
    const currentPos = getCurrentPosition();
    navigateToMove(currentPos.moves.length);
  }, [getCurrentPosition, navigateToMove]);
  
  const goToPrevious = useCallback(() => {
    if (currentMove > 0) {
      // Go back one move within the current line (main line or variation)
      navigateToMove(currentMove - 1);
    } else if (currentPath.length > 0) {
      // If we're at the start of a variation (currentMove === 0), go back to the main line
      const currentVariation = getCurrentPosition();
      const branchPoint = currentVariation.branchPoint || 0;
      
      const newPath = [...currentPath];
      newPath.pop();
      setCurrentPath(newPath);
      
      // Navigate to the branch point in the main line
      navigateToMove(branchPoint);
    }
  }, [currentMove, currentPath, getCurrentPosition, navigateToMove]);
  
  const goToNext = useCallback(() => {
    const currentPos = getCurrentPosition();
    if (currentMove < currentPos.moves.length) {
      navigateToMove(currentMove + 1);
    }
  }, [currentMove, getCurrentPosition, navigateToMove]);

  const goToMainLine = useCallback(() => {
    setCurrentPath([]);
    navigateToMove(0);
  }, [navigateToMove]);


  // Add keyboard navigation
  useEffect(() => {
    const handleKeyPress = (event) => {
      // Only handle arrow keys when not typing in an input
      if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
        return;
      }

      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault();
          goToPrevious();
          break;
        case 'ArrowRight':
          event.preventDefault();
          goToNext();
          break;
        case 'Home':
          event.preventDefault();
          goToStart();
          break;
        case 'End':
          event.preventDefault();
          goToEnd();
          break;
        case 'Escape':
          event.preventDefault();
          // Reset to main line if in variation
          if (currentPath.length > 0) {
            goToMainLine();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [goToPrevious, goToNext, goToStart, goToEnd, goToMainLine, currentPath.length]);

  // Debug moveAnnotation data
  useEffect(() => {
    console.log('ChessStudyPage moveAnnotation debug:', {
      moveAnnotation: gameTree.moveAnnotation,
      selectedNodeId: selectedNode?.id || null,
      currentPath: gameTree.currentPath,
      hasGetMainline: gameTree.moveAnnotation && typeof gameTree.moveAnnotation.getMainline === 'function'
    });
  }, [gameTree.moveAnnotation, selectedNode, gameTree.currentPath]);



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
        setGameTree(prevTree => {
          const newTree = JSON.parse(JSON.stringify(prevTree));
          let current = newTree;
          
          for (const pathIndex of currentPath) {
            if (pathIndex === 0) {
              current = current;
            } else {
              current = current.variations[pathIndex - 1];
            }
          }
          
          // If we're not at the end of the current line, create a variation
          if (currentMove < current.moves.length) {
            // Calculate the actual branch point in the main line
            let actualBranchPoint = currentMove;
            if (currentPath.length > 0) {
              // We're creating a variation within a variation
              // The branch point should be relative to the main line
              actualBranchPoint = currentMove + (current.branchPoint || 0);
            }
            
            // Store all moves from the branch point onwards in the variation
            const variationMoves = current.moves.slice(currentMove);
            variationMoves[0] = newMove; // Replace the first move with the new variation move
            
            const newVariation = {
              moves: variationMoves, // Store all moves from branch point
              variations: [],
              id: nextId.current++,
              branchPoint: actualBranchPoint // Track where this variation branches off from main line
            };
            current.variations.push(newVariation);
            setCurrentPath([...currentPath, current.variations.length]);
            setCurrentMove(1); // Set to 1 since we just made the first move in the variation
          } else {
            current.moves.push(newMove);
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
        setGameTree(prevTree => {
          const newTree = JSON.parse(JSON.stringify(prevTree));
          let current = newTree;
          
          for (const pathIndex of currentPath) {
            if (pathIndex === 0) {
              current = current;
            } else {
              current = current.variations[pathIndex - 1];
            }
          }
          
          // If we're not at the end of the current line, create a variation
          if (currentMove < current.moves.length) {
            // Calculate the actual branch point in the main line
            let actualBranchPoint = currentMove;
            if (currentPath.length > 0) {
              // We're creating a variation within a variation
              // The branch point should be relative to the main line
              actualBranchPoint = currentMove + (current.branchPoint || 0);
            }
            
            // Store all moves from the branch point onwards in the variation
            const variationMoves = current.moves.slice(currentMove);
            variationMoves[0] = newMove; // Replace the first move with the new variation move
            
            const newVariation = {
              moves: variationMoves, // Store all moves from branch point
              variations: [],
              id: nextId.current++,
              branchPoint: actualBranchPoint // Track where this variation branches off from main line
            };
            current.variations.push(newVariation);
            setCurrentPath([...currentPath, current.variations.length]);
            setCurrentMove(1); // Set to 1 since we just made the first move in the variation
          } else {
            current.moves.push(newMove);
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

  // Update analysis when position changes with debounce
  useEffect(() => {
    const currentFen = game.fen();
    fetchOpeningData(currentFen);
    
    // Debounce engine analysis to prevent too many API calls
    const timeoutId = setTimeout(() => {
      analyzePosition(currentFen);
    }, 500); // 500ms delay
    
    return () => clearTimeout(timeoutId);
  }, [game.fen(), fetchOpeningData, analyzePosition]);

  // Initialize UCI engine on component mount
  useEffect(() => {
    initializeEngine();
  }, [initializeEngine]);

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


  // Render notation tree in traditional chess format
  const renderNotationTree = (position, depth = 0, pathIndex = []) => {
    const isCurrentPath = JSON.stringify(pathIndex) === JSON.stringify(currentPath.slice(0, pathIndex.length));
    
    // For variations, only show the variation moves (not the complete sequence)
    let movesToShow = position.moves;
    let startingMoveNumber = 1;
    
    if (depth > 0) {
      // This is a variation - calculate the starting move number based on branch point
      const branchPoint = position.branchPoint || 0;
      startingMoveNumber = Math.floor(branchPoint / 2) + 1;
      movesToShow = position.moves;
    }
    
    // Group moves by move number for traditional display
    const groupedMoves = [];
    for (let i = 0; i < movesToShow.length; i += 2) {
      const whiteMove = movesToShow[i];
      const blackMove = movesToShow[i + 1];
      if (whiteMove) {
        groupedMoves.push({
          moveNumber: startingMoveNumber + Math.floor(i / 2),
          white: whiteMove,
          black: blackMove
        });
      }
    }
    
    return (
      <div className="notation-section" key={`${depth}-${pathIndex.join('-')}`}>
        {groupedMoves.length > 0 && (
          <div className={`moves-line ${isCurrentPath ? 'current-line' : ''} ${depth > 0 ? 'variation' : 'main-line'}`}>
            {depth > 0 && <span className="variation-indicator">({depth}) </span>}
            {groupedMoves.map((group, groupIdx) => {
              const whiteMoveIndex = groupIdx * 2;
              const blackMoveIndex = groupIdx * 2 + 1;
              const isWhiteCurrent = isCurrentPath && currentMove === whiteMoveIndex + 1;
              const isBlackCurrent = isCurrentPath && currentMove === blackMoveIndex + 1;
              
              return (
                <div key={group.moveNumber} className="move-pair">
                  <span className="move-number">{group.moveNumber}</span>
                  <div className="move-buttons">
                    {group.white && (
                      <button
                        className={`move-btn white-move ${isWhiteCurrent ? 'current-move' : ''}`}
                        onClick={() => {
                          setCurrentPath(pathIndex);
                          navigateToMove(whiteMoveIndex + 1);
                        }}
                      >
                        {group.white.notation}
                      </button>
                    )}
                    {group.black && (
                      <button
                        className={`move-btn black-move ${isBlackCurrent ? 'current-move' : ''}`}
                        onClick={() => {
                          setCurrentPath(pathIndex);
                          navigateToMove(blackMoveIndex + 1);
                        }}
                      >
                        {group.black.notation}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        {position.variations.map((variation, idx) => (
          <div key={variation.id} className="variation-container">
            {renderNotationTree(variation, depth + 1, [...pathIndex, idx + 1])}
          </div>
        ))}
      </div>
    );
  };

  // Handle window resize (same as chess-annotation-advanced)
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);






  // Navigate to a specific node in the tree (same as chess-annotation-advanced)
  const navigateToNode = useCallback((nodeId: string) => {
    console.log('🎯 Navigating to node:', nodeId);
    
    // For now, just update the selected node
    // The MoveAnnotation system will handle the actual navigation
    setSelectedNode(null);
    
    // Update the game tree to reflect the new position
    setGameTree(prev => ({
      ...prev,
      currentPath: [nodeId],
      currentNode: null
    }));
  }, []);


  // Flip board function
  const flipBoard = useCallback(() => {
    setBoardOrientation(prev => prev === 'white' ? 'black' : 'white');
  }, []);

  // Memoized board position to prevent unnecessary re-renders
  const memoizedBoardPosition = useMemo(() => boardPosition, [boardPosition]);

  // Stable board key to prevent unnecessary re-mounting
  const boardKey = useMemo(() => `board-${boardOrientation}`, [boardOrientation]);

  // Handle piece drop with chess.js validation
  const onPieceDrop = useCallback((sourceSquare: string, targetSquare: string, piece: string) => {
    try {
      console.log('🎯 Piece drop attempt:', { sourceSquare, targetSquare, piece });
      console.log('🎯 Current game state:', { fen: game.fen(), turn: game.turn() });
      console.log('🎯 Current node:', gameTree.currentNode);
      
      const moveObj = {
        from: sourceSquare,
        to: targetSquare,
        promotion: piece[1] === 'P' && (targetSquare[1] === '8' || targetSquare[1] === '1') ? 'q' : undefined
      };

      console.log('🎯 Move object:', moveObj);

      const chessMove = game.move(moveObj);
      if (chessMove) {
        console.log('🎯 Move successful:', chessMove);
        
        // Create new move node using MoveAnnotation system
        const moveNode = gameTree.moveAnnotation.addMove(chessMove.san);
        const newNode = convertToMoveNode(moveNode, `${Date.now()}-${chessMove.san}`, chessMove.from, chessMove.to);

        console.log('🎯 New node created:', newNode);

        // Add to current node's variations
        if (gameTree.currentNode) {
          gameTree.currentNode.variations.push(newNode);
          console.log('🎯 Added to current node variations. Current node variations count:', gameTree.currentNode.getVariations().length);
        } else {
          console.log('🎯 No current node found!');
        }

        // Update game tree
        setGameTree(prev => {
          const newTree = {
            ...prev,
            currentPath: [...prev.currentPath, newNode.id],
            currentNode: newNode
          };
          console.log('🎯 Updated game tree:', newTree);
          return newTree;
        });

        updateBoardPosition(game.fen());
        setSelectedNode(newNode);
        
        console.log('🎯 Move completed successfully');
        return true;
      } else {
        console.log('🎯 Move rejected by chess.js');
        return false;
      }
    } catch (error) {
      console.error('🎯 Move error:', error);
      return false;
    }
  }, [game, gameTree.currentNode, gameTree.moveAnnotation, updateBoardPosition]);

  // Memoized chess board component using ProductionChessBoard for consistent DnD (desktop + mobile) and fit-to-parent sizing
  const MemoizedChessboard = useMemo(() => (
    <ProductionChessBoard
      key={boardKey}
      position={memoizedBoardPosition}
      onMove={(sourceSquare, targetSquare) => onPieceDrop(sourceSquare, targetSquare, '')}
      boardOrientation={boardOrientation}
      showBoardNotation={true}
      areArrowsAllowed={currentMode !== 'editor'}
      arePiecesDraggable={currentMode !== 'bot' || botGameState.isPlayerTurn}
      animationDuration={200}
      fitToParent={true}
      customBoardStyle={{
        borderRadius: '6px',
        width: '100%',
        height: '100%',
        transform: 'translateZ(0)',
        backfaceVisibility: 'hidden',
        willChange: 'transform',
        transition: 'opacity 0.1s ease-in-out',
        opacity: 1,
        touchAction: 'manipulation',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        MozUserSelect: 'none',
        msUserSelect: 'none',
        WebkitTouchCallout: 'none',
        WebkitTapHighlightColor: 'transparent',
        cursor: 'pointer'
      }}
      customLightSquareStyle={{
        backgroundColor: '#f0d9b5'
      }}
      customDarkSquareStyle={{
        backgroundColor: '#b58863'
      }}
    />
  ), [boardKey, memoizedBoardPosition, onPieceDrop, boardOrientation, currentMode, botGameState.isPlayerTurn]);



  const toggleAutoPlay = useCallback(() => {
    setIsAutoPlaying(prev => !prev);
  }, []);


  const resetPosition = useCallback(() => {
    setGame(new Chess());
    setGameTree(prev => ({
      ...prev,
      currentPath: [],
      currentNode: prev.root
    }));
  }, []);

  const addNewStudy = useCallback(() => {
    const newId = Math.max(...studies.map(s => s.id)) + 1;
    const newChapterId = Math.max(...studies.flatMap(s => s.chapters.map(c => c.id))) + 1;
    const newStudy = {
      id: newId,
      name: `New Study ${newId}`,
      active: false,
      chapters: [
        {
          id: newChapterId,
          name: 'Chapter 1',
          pgn: '',
          headers: {},
          notes: '',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ],
      currentChapterId: newChapterId,
      notes: '',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    setStudies(prev => [...prev, newStudy]);
  }, [studies]);

  const addNewChapter = useCallback((studyId: number) => {
    const study = studies.find(s => s.id === studyId);
    if (!study) return;

    const newChapterId = Math.max(...studies.flatMap(s => s.chapters.map(c => c.id))) + 1;
    const newChapter: Chapter = {
      id: newChapterId,
      name: `Chapter ${study.chapters.length + 1}`,
      pgn: '', // Start with empty PGN for initial position
      headers: {},
      notes: '',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    setStudies(prev => prev.map(s => 
      s.id === studyId 
        ? { 
            ...s, 
            chapters: [...s.chapters, newChapter],
            currentChapterId: newChapterId,
            updatedAt: new Date()
          }
        : s
    ));
    
    // Switch to the new chapter and reset the board to initial position
    setActiveChapter(newChapterId);
    setGame(new Chess());
    setGameTree(prev => ({
      ...prev,
      currentPath: [],
      currentNode: null,
      root: null
    }));
    setBoardPosition('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
    setChapterNotes('');
  }, [studies]);

  const deleteChapter = useCallback((studyId: number, chapterId: number) => {
    const study = studies.find(s => s.id === studyId);
    if (!study || study.chapters.length <= 1) return; // Don't delete the last chapter

    setStudies(prev => prev.map(s => 
      s.id === studyId 
        ? { 
            ...s, 
            chapters: s.chapters.filter(c => c.id !== chapterId),
            currentChapterId: s.chapters.find(c => c.id !== chapterId)?.id || s.chapters[0].id,
            updatedAt: new Date()
          }
        : s
    ));

    // Switch to another chapter if we deleted the active one
    if (activeChapter === chapterId) {
      const remainingChapter = study.chapters.find(c => c.id !== chapterId);
      if (remainingChapter) {
        setActiveChapter(remainingChapter.id);
      }
    }
  }, [studies, activeChapter]);

  const switchChapter = useCallback((studyId: number, chapterId: number) => {
    // Save current chapter state
    setStudies(prev => prev.map(s => 
      s.id === studyId 
        ? s.chapters.map(c => 
            c.id === activeChapter 
              ? { ...c, pgn: game.pgn(), notes: chapterNotes, updatedAt: new Date() }
              : c
          ).reduce((acc, c) => ({ ...acc, chapters: [...(acc.chapters || []), c] }), { ...s, chapters: [] })
        : s
    ));

    setActiveChapter(chapterId);
    setStudies(prev => prev.map(s => 
      s.id === studyId 
        ? { ...s, currentChapterId: chapterId, updatedAt: new Date() }
        : s
    ));

    // Load the selected chapter
    const study = studies.find(s => s.id === studyId);
    const chapter = study?.chapters.find(c => c.id === chapterId);
    
    if (chapter && chapter.pgn) {
      try {
        const newGame = new Chess();
        newGame.loadPgn(chapter.pgn);
        setGame(newGame);
        // Build tree from PGN moves using MoveAnnotation
        const moves = newGame.history();
        const moveAnnotation = new MoveAnnotation();
        
        // Add all moves to MoveAnnotation
        for (const move of moves) {
          moveAnnotation.addMove(move);
        }
        
        const mainline = moveAnnotation.getMainline();
        const rootNode = mainline.length > 0 ? convertToMoveNode(mainline[0], 'root') : null;
        const currentNode = mainline.length > 0 ? convertToMoveNode(mainline[mainline.length - 1], `end-${mainline.length}`) : null;
        
        setGameTree({
          moveAnnotation: moveAnnotation,
          root: rootNode,
          currentPath: moves.map((_, index) => `move-${index}`),
          currentNode: currentNode,
          moves: [],
          variations: [],
          branchPoint: 0
        });
      } catch (error) {
        console.error('Error loading PGN:', error);
      }
    } else {
      setGame(new Chess());
      setGameTree(prev => ({
        ...prev,
        currentPath: [],
        currentNode: prev.root
      }));
    }
    setChapterNotes(chapter?.notes || '');
  }, [studies, activeStudy, activeChapter, game, chapterNotes]);

  const deleteStudy = useCallback((studyId: number) => {
    if (studies.length > 1) {
      setStudies(prev => prev.filter(s => s.id !== studyId));
      if (activeStudy === studyId) {
        setActiveStudy(studies.find(s => s.id !== studyId)?.id || 1);
      }
    }
  }, [studies, activeStudy]);

  const switchStudy = useCallback((studyId: number) => {
    // Save current study state
    setStudies(prev => prev.map(s => 
      s.id === activeStudy 
        ? { 
            ...s, 
            notes: studyNotes,
            chapters: s.chapters.map(c => 
              c.id === activeChapter 
                ? { ...c, pgn: game.pgn(), notes: chapterNotes, updatedAt: new Date() }
                : c
            ),
            updatedAt: new Date()
          }
        : s
    ));
    
    setActiveStudy(studyId);
    setStudies(prev => prev.map(s => ({ ...s, active: s.id === studyId })));
    
    // Load the selected study and its current chapter
    const study = studies.find(s => s.id === studyId);
    const currentChapterId = study?.currentChapterId || study?.chapters[0]?.id;
    
    if (currentChapterId) {
      setActiveChapter(currentChapterId);
      switchChapter(studyId, currentChapterId);
    } else {
      setGame(new Chess());
      setGameTree(prev => ({
        ...prev,
        currentPath: [],
        currentNode: prev.root
      }));
    }
    setStudyNotes(study?.notes || '');
  }, [studies, activeStudy, activeChapter, game, studyNotes, chapterNotes, switchChapter]);

  const exportStudy = useCallback(() => {
    const study = studies.find(s => s.id === activeStudy);
    const pgn = game.pgn();
    
    const blob = new Blob([pgn], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${study?.name || 'chess-study'}.pgn`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [studies, activeStudy, game]);

  const importStudy = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileImport = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const pgnContent = e.target?.result;
      if (typeof pgnContent === 'string') {
        try {
          const newGame = new Chess();
          newGame.loadPgn(pgnContent);
          
          // Extract study name from PGN headers or filename
          const eventMatch = pgnContent.match(/\[Event "([^"]*)"\]/);
          const studyName = eventMatch ? eventMatch[1] : file.name.replace('.pgn', '');
          
          // Create new study with imported data
          const newId = Math.max(...studies.map(s => s.id)) + 1;
          const newChapterId = Math.max(...studies.flatMap(s => s.chapters.map(c => c.id))) + 1;
          const newStudy: Study = {
            id: newId,
            name: studyName,
            active: false,
            chapters: [
              {
                id: newChapterId,
                name: 'Imported Chapter',
                pgn: pgnContent,
                headers: {},
                notes: '',
                createdAt: new Date(),
                updatedAt: new Date()
              }
            ],
            currentChapterId: newChapterId,
            notes: '',
            createdAt: new Date(),
            updatedAt: new Date()
          };
          
          setStudies(prev => [...prev, newStudy]);
          
          // Switch to the imported study
          setActiveStudy(newId);
          setActiveChapter(newChapterId);
          setGame(newGame);
          
          // Build tree from imported PGN using MoveAnnotation
          const moves = newGame.history();
          const moveAnnotation = new MoveAnnotation();
          
          for (const move of moves) {
            moveAnnotation.addMove(move);
          }
          
          const mainline = moveAnnotation.getMainline();
          const rootNode = mainline.length > 0 ? convertToMoveNode(mainline[0], 'root') : null;
          const currentNode = mainline.length > 0 ? convertToMoveNode(mainline[mainline.length - 1], `end-${mainline.length}`) : null;
          
          setGameTree({
            moveAnnotation: moveAnnotation,
            root: rootNode,
            currentPath: currentNode ? [currentNode.id] : [],
            currentNode: currentNode,
            moves: [],
            variations: [],
            branchPoint: 0
          });
          
          setStudyNotes('');
          
          // Show success message (you could add a toast notification here)
          console.log(`Successfully imported study: ${studyName} with ${newGame.history().length} moves`);
        } catch (error) {
          console.error('Error importing PGN:', error);
          // You could show an error message to the user here
        }
      }
    };
    
    reader.readAsText(file);
    event.target.value = ''; // Reset file input
  }, [studies]);

  const saveStudyNotes = useCallback(() => {
    setStudies(prev => prev.map(s => 
      s.id === activeStudy 
        ? { ...s, notes: studyNotes, updatedAt: new Date() }
        : s
    ));
  }, [activeStudy, studyNotes]);

  const saveChapterNotes = useCallback(() => {
    setStudies(prev => prev.map(s => 
      s.id === activeStudy 
        ? { 
            ...s, 
            chapters: s.chapters.map(c => 
              c.id === activeChapter 
                ? { ...c, notes: chapterNotes, updatedAt: new Date() }
                : c
            ),
            updatedAt: new Date()
          }
        : s
    ));
  }, [activeStudy, activeChapter, chapterNotes]);

  // Create new study
  const createNewStudy = useCallback(() => {
    const newStudyId = Math.max(...studies.map(s => s.id)) + 1;
    const newStudy: Study = {
      id: newStudyId,
      name: `New Study ${newStudyId}`,
      active: true,
      chapters: [{
        id: 1,
        name: 'Chapter 1',
        pgn: '',
        headers: {},
        notes: '',
        createdAt: new Date(),
        updatedAt: new Date()
      }],
      currentChapterId: 1,
      notes: '',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    setStudies(prev => [...prev, newStudy]);
    setActiveStudy(newStudyId);
    setActiveChapter(1);
  }, [studies]);

  // Create new chapter
  const createNewChapter = useCallback(() => {
    const currentStudy = studies.find(s => s.id === activeStudy);
    if (!currentStudy) return;
    
    const newChapterId = Math.max(...currentStudy.chapters.map(c => c.id)) + 1;
    const newChapter: Chapter = {
      id: newChapterId,
      name: `Chapter ${newChapterId}`,
      pgn: '',
      headers: {},
      notes: '',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    setStudies(prev => prev.map(study => 
      study.id === activeStudy 
        ? { 
            ...study, 
            chapters: [...study.chapters, newChapter],
            updatedAt: new Date()
          }
        : study
    ));
    setActiveChapter(newChapterId);
  }, [studies, activeStudy]);


  // Export studies for user profile
  const exportStudiesForProfile = useCallback(() => {
    const studiesForProfile = studies.map(study => ({
      id: study.id,
      name: study.name,
      chapters: study.chapters.map(chapter => ({
        id: chapter.id,
        name: chapter.name,
        pgn: chapter.pgn,
        notes: chapter.notes,
        createdAt: chapter.createdAt,
        updatedAt: chapter.updatedAt
      })),
      notes: study.notes,
      createdAt: study.createdAt,
      updatedAt: study.updatedAt
    }));
    
    return studiesForProfile;
  }, [studies]);

  // Get studies summary for profile display
  const getStudiesSummary = useCallback(() => {
    return {
      totalStudies: studies.length,
      totalChapters: studies.reduce((sum, study) => sum + study.chapters.length, 0),
      lastUpdated: studies.reduce((latest, study) => 
        study.updatedAt > latest ? study.updatedAt : latest, 
        new Date(0)
      ),
      studies: studies.map(study => ({
        id: study.id,
        name: study.name,
        chapterCount: study.chapters.length,
        lastUpdated: study.updatedAt
      }))
    };
  }, [studies]);

  // Auto-play functionality
  React.useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isAutoPlaying && gameTree.currentNode && gameTree.currentNode.getVariations().length > 0) {
      interval = setInterval(() => {
        goToNext();
      }, 1000);
    } else if (isAutoPlaying) {
      setIsAutoPlaying(false);
    }
    return () => clearInterval(interval);
  }, [isAutoPlaying, gameTree.currentNode, goToNext]);

  return (
    <>
      <style>
        {`
          @keyframes pulse {
            0%, 100% { opacity: 0.8; }
            50% { opacity: 1; }
          }
        `}
      </style>
      <div style={{
      display: 'flex',
      flexDirection: isMobile ? 'column' : 'row',
      height: isMobile ? 'auto' : '100vh', 
      minHeight: isMobile ? '100vh' : '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      overflow: isMobile ? 'auto' : 'hidden'
    }}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        padding: isMobile ? '15px' : '30px',
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        minHeight: isMobile ? '500px' : '100vh',
        overflow: 'auto',
        boxShadow: '0 0 40px rgba(0, 0, 0, 0.1)',
        margin: isMobile ? '5px' : '10px',
        borderRadius: '20px',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        flex: isMobile ? '0 0 auto' : '1 1 auto'
      }}>
        <header style={{ marginBottom: isMobile ? '15px' : '30px' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            flexDirection: isMobile ? 'column' : 'row',
            gap: isMobile ? '15px' : '0'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <BookOpen className="w-8 h-8 text-amber-600" />
              <h1 style={{ 
                fontSize: isMobile ? '20px' : '28px', 
                fontWeight: 'bold',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                margin: 0
              }}>Chess Study</h1>
            </div>
            <div className="flex items-center space-x-2">
              <button 
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center space-x-2"
                onClick={importStudy}
              >
                <Upload className="w-4 h-4" />
                <span>Import PGN</span>
              </button>
              <button 
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2"
                onClick={exportStudy}
              >
                <Download className="w-4 h-4" />
                <span>Export PGN</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pgn,.txt"
                onChange={handleFileImport}
                className="hidden"
              />
            </div>
          </div>
        </header>

        {/* Study Tabs */}
        <div className="mb-6">
          <div className="flex items-center space-x-2 mb-4">
            <div className="flex space-x-1 bg-white rounded-lg p-1 border">
              {studies.map(study => (
                <button
                  key={study.id}
                  className={`
                    px-3 py-2 rounded text-sm font-medium transition-colors flex items-center space-x-2
                    ${study.id === activeStudy ? 'bg-blue-500 text-white' : 'text-gray-600 hover:bg-gray-100'}
                  `}
                  onClick={() => switchStudy(study.id)}
                >
                  <span>{study.name}</span>
                  {studies.length > 1 && (
                    <span
                      className="ml-1 hover:bg-red-500 hover:text-white rounded p-0.5 transition-colors cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteStudy(study.id);
                      }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </span>
                  )}
                </button>
              ))}
            </div>
            <button
              className="px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center space-x-1"
              onClick={addNewStudy}
            >
              <Plus className="w-4 h-4" />
              <span>New Study</span>
            </button>
          </div>

          {/* Chapter Tabs */}
          {studies.find(s => s.id === activeStudy) && (
            <div className="flex items-center space-x-2">
              <div className="flex space-x-1 bg-white rounded-lg p-1 border">
                {studies.find(s => s.id === activeStudy)?.chapters.map(chapter => (
                  <button
                    key={chapter.id}
                    className={`
                      px-3 py-2 rounded text-sm font-medium transition-colors flex items-center space-x-2
                      ${chapter.id === activeChapter ? 'bg-purple-500 text-white' : 'text-gray-600 hover:bg-gray-100'}
                    `}
                    onClick={() => switchChapter(activeStudy, chapter.id)}
                  >
                    <span>{chapter.name}</span>
                    {studies.find(s => s.id === activeStudy)?.chapters.length! > 1 && (
                      <span
                        className="ml-1 hover:bg-red-500 hover:text-white rounded p-0.5 transition-colors cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteChapter(activeStudy, chapter.id);
                        }}
                      >
                        <Trash2 className="w-3 h-3" />
                      </span>
                    )}
                  </button>
                ))}
              </div>
              <button
                className="px-3 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors flex items-center space-x-1"
                onClick={() => addNewChapter(activeStudy)}
              >
                <Plus className="w-4 h-4" />
                <span>New Chapter</span>
              </button>
            </div>
          )}
        </div>

        <div style={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          gap: isMobile ? '15px' : '30px',
          width: '100%'
        }}>
          {/* Chess Board Section */}
          <div style={{
            flex: isMobile ? '0 0 auto' : '2 1 auto',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}>
            <div className="bg-white rounded-xl shadow-lg p-6">
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
                    onClick={resetPosition}
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
                  aspectRatio: isMobile ? '1 / 1' as any : undefined,
                  height: isMobile ? 'auto' : undefined,
                  // Performance optimizations
                  willChange: 'transform',
                  transform: 'translateZ(0)',
                  backfaceVisibility: 'hidden',
                  perspective: '1000px',
                  // Smooth transitions
                  transition: 'background 0.1s ease-in-out',
                  // Touch interaction guarantees
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
                    className="p-2 bg-white border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    onClick={goToStart}
                    disabled={!gameTree.currentNode || gameTree.currentNode.id === 'root'}
                  >
                    <SkipBack className="w-4 h-4" />
                  </button>
                  <button
                    className="p-2 bg-white border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    onClick={goToPrevious}
                    disabled={!gameTree.currentNode || gameTree.currentNode.id === 'root'}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    className={`p-2 border rounded transition-colors ${
                      isAutoPlaying ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-green-500 text-white hover:bg-green-600'
                    }`}
                    onClick={toggleAutoPlay}
                    disabled={!gameTree.currentNode || gameTree.currentNode.getVariations().length === 0}
                  >
                    {isAutoPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </button>
                  <button
                    className="p-2 bg-white border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    onClick={goToNext}
                    disabled={!gameTree.currentNode || gameTree.currentNode.getVariations().length === 0}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <button
                    className="p-2 bg-white border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    onClick={goToEnd}
                    disabled={!gameTree.currentNode || gameTree.currentNode.getVariations().length === 0}
                  >
                    <SkipForward className="w-4 h-4" />
                  </button>
                </div>

                <div className="text-sm text-gray-600">
                  Move {gameTree.currentNode ? Math.ceil(gameTree.currentNode.moveNumber / 2) : 0} • 
                  {game.turn() === 'w' ? ' White' : ' Black'} to play
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div style={{
            flex: isMobile ? '0 0 auto' : '1 1 auto',
            display: 'flex',
            flexDirection: 'column',
            gap: isMobile ? '15px' : '30px',
            minWidth: isMobile ? '100%' : '300px'
          }}>
            {/* Move List */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="font-semibold mb-3 text-gray-800">Moves</h3>
          <TraditionalNotation
            moveAnnotation={game}
            selectedNodeId={selectedNode?.id || null}
            currentPath={gameTree.currentPath}
            onNodeSelect={navigateToNode}
            maxDepth={8}
            showComments={true}
            showVariationCount={true}
          />
        </div>

            {/* Study Notes */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="font-semibold mb-3 text-gray-800">Study Notes</h3>
              <textarea
                className="w-full h-24 p-3 border rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Add your study-wide notes here..."
                value={studyNotes}
                onChange={(e) => setStudyNotes(e.target.value)}
              />
              <button 
                className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                onClick={saveStudyNotes}
              >
                Save Study Notes
              </button>
            </div>

            {/* Chapter Notes */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="font-semibold mb-3 text-gray-800">Chapter Notes</h3>
              <textarea
                className="w-full h-24 p-3 border rounded-lg resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Add your chapter-specific notes here..."
                value={chapterNotes}
                onChange={(e) => setChapterNotes(e.target.value)}
              />
              <button 
                className="mt-2 px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors"
                onClick={saveChapterNotes}
              >
                Save Chapter Notes
              </button>
            </div>

            {/* Position Info */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="font-semibold mb-3 text-gray-800">Position Info</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Study:</span>
                  <span className="font-semibold text-blue-600">
                    {studies.find(s => s.id === activeStudy)?.name || 'Unknown'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Chapter:</span>
                  <span className="font-semibold text-purple-600">
                    {studies.find(s => s.id === activeStudy)?.chapters.find(c => c.id === activeChapter)?.name || 'Unknown'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">FEN:</span>
                  <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                    {game.fen().substring(0, 20)}...
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">To Move:</span>
                  <span className="font-semibold">
                    {game.turn() === 'w' ? 'White' : 'Black'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Move:</span>
                  <span className="font-semibold">{gameTree.currentNode ? Math.ceil(gameTree.currentNode.moveNumber / 2) : 0}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
