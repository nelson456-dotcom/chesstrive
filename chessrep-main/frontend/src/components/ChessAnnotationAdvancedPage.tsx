import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { parseGame } from '@mliebelt/pgn-parser';
import SimpleOpeningExplorer from './SimpleOpeningExplorer';
import EngineSuggestions from './EngineSuggestions';
import { saveGame, createGame, exportGameAsFile } from '../utils/gameManager';
import { Save, Download, Bot, Edit3 } from 'lucide-react';
import { VariationTree, MoveAnnotation, MoveNode as BaseMoveNode } from './VariationTree';

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
const convertToMoveNode = (baseNode: BaseMoveNode, id: string, from: string = '', to: string = '') => {
  return new MoveNode(baseNode, id, from, to);
};

// Move Tree Component with variation controls (from chess-game-variations)
const MoveTree = ({ node, onMoveClick, onCreateVariation, onDeleteVariation, onPromoteVariation, currentPath, depth = 0 }: {
  node: any;
  onMoveClick: (node: any) => void;
  onCreateVariation: (node: any) => void;
  onDeleteVariation: (node: any) => void;
  onPromoteVariation: (node: any) => void;
  currentPath: any[];
  depth?: number;
}) => {
  if (!node) return null;
  
  const isCurrentMove = currentPath && currentPath.some((pathNode: any) => pathNode === node);
  const isMainLine = depth === 0 || (node.parent && node.parent.mainLine === node);
  const canCreateVariation = node.notation && !isCurrentMove; // Can create variation from any past move
  
  return (
    <div style={{ marginLeft: `${depth * 16}px` }}>
      {node.notation && (
        <div style={{ display: 'inline-block', position: 'relative', marginBottom: '2px' }}>
          <span
            onClick={() => onMoveClick(node)}
            style={{
              cursor: 'pointer',
              backgroundColor: isCurrentMove ? '#ffeb3b' : 'transparent',
              padding: '2px 4px',
              borderRadius: '3px',
              fontWeight: isMainLine ? 'bold' : 'normal',
              color: isMainLine ? '#000' : '#666',
              textDecoration: 'underline'
            }}
          >
            {node.moveNumber && (node.turn === 'white' || depth > 0) && 
              `${node.moveNumber}${node.turn === 'white' ? '.' : '...'}`
            }
            {node.notation}
          </span>
          
          {/* Variation Controls */}
          {canCreateVariation && (
            <span style={{ marginLeft: '4px' }}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCreateVariation(node);
                }}
                style={{
                  fontSize: '10px',
                  padding: '1px 4px',
                  border: '1px solid #007bff',
                  backgroundColor: '#e3f2fd',
                  color: '#0277bd',
                  borderRadius: '2px',
                  cursor: 'pointer',
                  marginRight: '2px'
                }}
                title="Create variation from this move"
              >
                +var
              </button>
            </span>
          )}
          
          {/* Delete and Promote buttons for variations */}
          {depth > 0 && (
            <span style={{ marginLeft: '2px' }}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onPromoteVariation(node);
                }}
                style={{
                  fontSize: '10px',
                  padding: '1px 3px',
                  border: '1px solid #4caf50',
                  backgroundColor: '#e8f5e8',
                  color: '#2e7d32',
                  borderRadius: '2px',
                  cursor: 'pointer',
                  marginRight: '2px'
                }}
                title="Promote this variation to main line"
              >
                ↑
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteVariation(node);
                }}
                style={{
                  fontSize: '10px',
                  padding: '1px 3px',
                  border: '1px solid #f44336',
                  backgroundColor: '#ffebee',
                  color: '#c62828',
                  borderRadius: '2px',
                  cursor: 'pointer'
                }}
                title="Delete this variation"
              >
                ×
              </button>
            </span>
          )}
        </div>
      )}
      
      {/* Variations */}
      {node.variations && node.variations.length > 0 && (
        <div style={{ marginTop: '4px' }}>
          {node.variations.map((variation: any, index: number) => (
            <div key={`var-${index}`} style={{ marginBottom: '4px' }}>
              {index > 0 || !isMainLine ? (
                <span style={{ color: '#999', fontSize: '12px' }}>
                  (
                </span>
              ) : null}
              <MoveTree 
                node={variation} 
                onMoveClick={onMoveClick}
                onCreateVariation={onCreateVariation}
                onDeleteVariation={onDeleteVariation}
                onPromoteVariation={onPromoteVariation}
                currentPath={currentPath}
                depth={depth + 1}
              />
              {index === node.variations.length - 1 && (index > 0 || !isMainLine) ? (
                <span style={{ color: '#999', fontSize: '12px' }}>
                  )
                </span>
              ) : null}
            </div>
          ))}
        </div>
      )}
      
      {/* Main continuation */}
      {node.next && (
        <span style={{ marginLeft: '4px' }}>
          <MoveTree 
            node={node.next} 
            onMoveClick={onMoveClick}
            onCreateVariation={onCreateVariation}
            onDeleteVariation={onDeleteVariation}
            onPromoteVariation={onPromoteVariation}
            currentPath={currentPath}
            depth={depth}
          />
        </span>
      )}
    </div>
  );
};

interface GameTree {
  moveAnnotation: MoveAnnotation;
  currentPath: MoveNode[];
  currentNode: MoveNode | null;
  root: MoveNode | null;
}

const ChessAnnotationAdvancedPage: React.FC = () => {
  const location = useLocation();
  
  // Get FEN from URL parameters
  const urlParams = new URLSearchParams(location.search);
  const fenFromUrl = urlParams.get('fen');
  const pgnFromUrl = urlParams.get('pgn');
  const colorFromUrl = urlParams.get('color');
  
  // Get PGN from location state (from play-with-bot page)
  const pgnFromState = location.state?.pgn;
  const fromBotGame = location.state?.fromBotGame;
  
  // Debug logging
  console.log('🔍 ChessAnnotationAdvancedPage: URL search params:', location.search);
  console.log('🔍 ChessAnnotationAdvancedPage: FEN from URL:', fenFromUrl);
  console.log('🔍 ChessAnnotationAdvancedPage: PGN from URL:', pgnFromUrl);
  console.log('🔍 ChessAnnotationAdvancedPage: Color from URL:', colorFromUrl);
  console.log('🔍 ChessAnnotationAdvancedPage: PGN from state:', pgnFromState);
  console.log('🔍 ChessAnnotationAdvancedPage: From bot game:', fromBotGame);
  
  // Responsive state
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Core game state
  const [game, setGame] = useState(new Chess());
  const [gameTree, setGameTree] = useState<GameTree>(() => {
    const moveAnnotation = new MoveAnnotation();
    return {
      moveAnnotation: moveAnnotation,
      currentPath: [],
      currentNode: null,
      root: null
    };
  });
  
  // UI state - initialize with FEN from URL or default
  const [boardPosition, setBoardPosition] = useState(() => {
    if (fenFromUrl) {
      // Decode the FEN from URL (replace underscores with spaces)
      const decodedFen = decodeURIComponent(fenFromUrl).replace(/_/g, ' ');
      console.log('🔍 ChessAnnotationAdvancedPage: Raw FEN from URL:', fenFromUrl);
      console.log('🔍 ChessAnnotationAdvancedPage: Decoded FEN:', decodedFen);
      return decodedFen;
    }
    console.log('🔍 ChessAnnotationAdvancedPage: No FEN from URL, using default');
    return 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
  });
  const [selectedNode, setSelectedNode] = useState<MoveNode | null>(null);
  const [commentText, setCommentText] = useState('');
  const [pgnInput, setPgnInput] = useState('');
  const [showTree, setShowTree] = useState(true);
  const [showGameNotation, setShowGameNotation] = useState(true);
  const [showOpeningTree, setShowOpeningTree] = useState(true);
  const [showEngineSuggestions, setShowEngineSuggestions] = useState(true);
  
  // Move tree state for variations
  const [moveTree, setMoveTree] = useState({ variations: [], next: null });
  const [currentNode, setCurrentNode] = useState(moveTree);
  const [currentPath, setCurrentPath] = useState<any[]>([]);
  const [variationMode, setVariationMode] = useState(false);
  const [variationStartNode, setVariationStartNode] = useState<any>(null);
  const [openingDatabase, setOpeningDatabase] = useState<'lichess' | 'masters'>('masters');
  const [boardOrientation, setBoardOrientation] = useState<'white' | 'black'>('white');
  
  // Game saving state
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [gameTitle, setGameTitle] = useState('');
  const [gameDescription, setGameDescription] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  // Bot play state
  const [isPlayingWithBot, setIsPlayingWithBot] = useState(false);
  const [botDifficulty, setBotDifficulty] = useState('intermediate');
  const [isBotThinking, setIsBotThinking] = useState(false);
  const [botMoveHistory, setBotMoveHistory] = useState<Array<{from: string, to: string, san: string}>>([]);
  const [isBoardUpdating, setIsBoardUpdating] = useState(false);

  // Immediate board position update with minimal flashing
  useEffect(() => {
    if (boardPosition) {
      try {
        game.load(boardPosition);
        console.log('🔍 ChessAnnotationAdvancedPage: Board position updated to:', boardPosition);
    } catch (error) {
        console.error('🔍 ChessAnnotationAdvancedPage: Error loading board position:', error);
      }
    }
  }, [boardPosition, game]);

  // Load PGN from URL or state
  useEffect(() => {
    const pgnToLoad = pgnFromUrl || pgnFromState;
    if (pgnToLoad) {
      try {
        console.log('🔍 ChessAnnotationAdvancedPage: Loading PGN:', pgnToLoad);
        game.loadPgn(pgnToLoad);
        setBoardPosition(game.fen());
        console.log('🔍 ChessAnnotationAdvancedPage: PGN loaded successfully, FEN:', game.fen());
          } catch (error) {
        console.error('🔍 ChessAnnotationAdvancedPage: Error loading PGN:', error);
      }
    }
  }, [pgnFromUrl, pgnFromState, game]);

  // Set board orientation from URL
  useEffect(() => {
    if (colorFromUrl) {
      setBoardOrientation(colorFromUrl as 'white' | 'black');
    }
  }, [colorFromUrl]);

  // Navigation functions
  const goToStart = useCallback(() => {
    if (gameTree.root) {
      setSelectedNode(gameTree.root);
      setGameTree(prev => ({
        ...prev,
        currentPath: [gameTree.root!],
        currentNode: gameTree.root
      }));
      setBoardPosition('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
    }
  }, [gameTree.root]);

  const goToEnd = useCallback(() => {
    if (gameTree.currentPath.length > 0) {
      const lastNode = gameTree.currentPath[gameTree.currentPath.length - 1];
      setSelectedNode(lastNode);
      setBoardPosition(game.fen());
    }
  }, [gameTree.currentPath, game]);

  const goBack = useCallback(() => {
    if (gameTree.currentPath.length > 1) {
      const newPath = gameTree.currentPath.slice(0, -1);
      const currentNode = newPath[newPath.length - 1];
      setSelectedNode(currentNode);
      setGameTree(prev => ({
        ...prev,
        currentPath: newPath,
        currentNode: currentNode
      }));
      setBoardPosition(game.fen());
    }
  }, [gameTree.currentPath, game]);

  const goForward = useCallback(() => {
    if (gameTree.currentNode && gameTree.currentNode.getVariations().length > 0) {
      const nextNode = gameTree.currentNode.getVariations()[0];
      const newPath = [...gameTree.currentPath, nextNode];
      setSelectedNode(nextNode);
    setGameTree(prev => ({
      ...prev,
        currentPath: newPath,
        currentNode: nextNode
      }));
      setBoardPosition(game.fen());
    }
  }, [gameTree.currentNode, gameTree.currentPath, game]);

  // Handle move on board (for react-chessboard)
  const handlePieceDrop = useCallback((sourceSquare: string, targetSquare: string, piece: string) => {
    try {
      // Create move object in the format expected by chess.js
      const move = {
        from: sourceSquare,
        to: targetSquare,
        promotion: piece.toLowerCase().includes('q') ? 'q' : undefined
      };
      
      const result = game.move(move);
      if (result) {
        setBoardPosition(game.fen());
        console.log('🔍 ChessAnnotationAdvancedPage: Move made:', result.san);
        return true;
      }
      return false;
    } catch (error) {
      console.error('🔍 ChessAnnotationAdvancedPage: Invalid move:', error);
    return false;
    }
  }, [game]);

  // Handle move from other components (move object format)
  const handleMove = useCallback((move: any) => {
    try {
      const result = game.move(move);
      if (result) {
        setBoardPosition(game.fen());
        console.log('🔍 ChessAnnotationAdvancedPage: Move made:', result.san);
        return true;
      }
      return false;
    } catch (error) {
      console.error('🔍 ChessAnnotationAdvancedPage: Invalid move:', error);
      return false;
    }
  }, [game]);

  // Handle node selection in variation tree
  const navigateToNode = useCallback((node: MoveNode) => {
    setSelectedNode(node);
    setBoardPosition(game.fen());
    
    // Update current path to this node
    const pathToNode: MoveNode[] = [];
    let currentNode = node;
    while (currentNode) {
      pathToNode.unshift(currentNode);
      currentNode = currentNode.getParent();
    }
    
    setGameTree(prev => ({
      ...prev,
      currentPath: pathToNode,
      currentNode: node
    }));
  }, [game]);

  // Save game functionality
  const handleSaveGame = useCallback(async () => {
    try {
      const gameData = {
        title: gameTitle || 'Untitled Game',
        description: gameDescription || '',
        pgn: game.pgn(),
        fen: game.fen(),
        createdAt: new Date().toISOString()
      };
      
      await saveGame(gameData);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving game:', error);
    }
  }, [game, gameTitle, gameDescription]);

  // Export game functionality
  const handleExportGame = useCallback(() => {
    try {
      const pgn = game.pgn();
      exportGameAsFile(pgn, gameTitle || 'chess-game');
    } catch (error) {
      console.error('Error exporting game:', error);
    }
  }, [game, gameTitle]);

  // Bot move generation (simplified)
  const generateBotMove = useCallback(() => {
    const moves = game.moves();
    if (moves.length > 0) {
      const randomMove = moves[Math.floor(Math.random() * moves.length)];
      return randomMove;
    }
    return null;
  }, [game]);

  // Handle bot move
  const handleBotMove = useCallback(() => {
    if (isPlayingWithBot && game.turn() === 'b') {
    setIsBotThinking(true);
      setTimeout(() => {
        const botMove = generateBotMove();
        if (botMove) {
          handleMove(botMove);
          setBotMoveHistory(prev => [...prev, { from: botMove.from, to: botMove.to, san: botMove.san }]);
        }
        setIsBotThinking(false);
      }, 1000);
    }
  }, [isPlayingWithBot, game, generateBotMove, handleMove]);

  // Auto-make bot move when it's bot's turn
  useEffect(() => {
    if (isPlayingWithBot && game.turn() === 'b' && !isBotThinking) {
      handleBotMove();
    }
  }, [isPlayingWithBot, game, isBotThinking, handleBotMove]);

  // Variation handling functions
  const handleCreateVariation = useCallback((node: any) => {
    // Navigate to the position and enter variation mode
    handleMoveClick(node);
    setVariationMode(true);
    setVariationStartNode(node);
  }, []);

  const handleDeleteVariation = useCallback((nodeToDelete: any) => {
    const parent = nodeToDelete.parent;
    if (!parent || !parent.variations) return;
    
    // Remove the variation from parent's variations array
    parent.variations = parent.variations.filter((variation: any) => variation !== nodeToDelete);
    
    // If we're currently on this variation or any of its descendants, go back to parent
    if (currentPath.includes(nodeToDelete)) {
      handleMoveClick(parent);
    }
    
    // Force re-render by updating the tree
    setMoveTree({...moveTree});
  }, [currentPath, moveTree]);

  const handlePromoteVariation = useCallback((variationNode: any) => {
    const parent = variationNode.parent;
    if (!parent || !parent.variations) return;
    
    // Find the current main line (could be parent.next or the first variation)
    const currentMainLine = parent.next;
    
    // Remove the variation from variations array
    parent.variations = parent.variations.filter((variation: any) => variation !== variationNode);
    
    // If there was a main line, demote it to a variation
    if (currentMainLine) {
      if (!parent.variations) parent.variations = [];
      parent.variations.unshift(currentMainLine); // Add as first variation
      currentMainLine.parent = parent;
    }
    
    // Promote the variation to main line
    parent.next = variationNode;
    variationNode.parent = parent;
    
    // Force re-render
    setMoveTree({...moveTree});
  }, [moveTree]);

  const handleMoveClick = useCallback((moveNode: any) => {
    // Reconstruct board state up to this move
    let node = moveNode;
    const pathToMove: any[] = [];
    
    while (node && node.notation) {
      pathToMove.unshift(node);
      node = node.parent;
    }
    
    let reconstructedBoard = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    let reconstructedTurn = 'white';
    let reconstructedMoveNumber = 1;
    
    for (const pathNode of pathToMove) {
      const [fromRank, fromFile] = pathNode.from;
      const [toRank, toFile] = pathNode.to;
      
      // Reconstruct the move on a temporary chess instance
      const tempGame = new Chess(reconstructedBoard);
      try {
        tempGame.move({ from: pathNode.from, to: pathNode.to });
        reconstructedBoard = tempGame.fen();
        reconstructedTurn = pathNode.turn === 'white' ? 'black' : 'white';
        
        if (pathNode.turn === 'black') {
          reconstructedMoveNumber++;
        }
      } catch (error) {
        console.error('Error reconstructing move:', error);
          break;
      }
    }
    
    setBoardPosition(reconstructedBoard);
    setCurrentNode(moveNode);
    setCurrentPath(pathToMove);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">Advanced Chess Annotation</h1>
          <p className="text-gray-300">Analyze positions, explore variations, and study chess with advanced tools</p>
        </div>

        <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-3'} gap-6`}>
          {/* Main Board Area */}
          <div className={`${isMobile ? 'order-1' : 'lg:col-span-2'}`}>
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800">Chess Board</h2>
                <div className="flex gap-2">
            <button
                    onClick={() => setBoardOrientation(prev => prev === 'white' ? 'black' : 'white')}
                    className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                  >
                    Flip Board
            </button>
            <button
                    onClick={() => setShowSaveDialog(true)}
                    className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 transition-colors flex items-center gap-1"
                  >
                    <Save size={16} />
                    Save
            </button>
          <button
                    onClick={handleExportGame}
                    className="px-3 py-1 bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors flex items-center gap-1"
                  >
                    <Download size={16} />
                    Export
          </button>
        </div>
          </div>
              
              <div className="flex justify-center">
                <Chessboard
                  position={boardPosition}
                  onPieceDrop={handlePieceDrop}
                  boardOrientation={boardOrientation}
                  customBoardStyle={{
                    borderRadius: '4px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  }}
                  customSquareStyles={{
                    [selectedNode?.from || '']: {
                      backgroundColor: 'rgba(255, 255, 0, 0.4)',
                    },
                    [selectedNode?.to || '']: {
                      backgroundColor: 'rgba(255, 255, 0, 0.4)',
                    },
                  }}
                />
      </div>

              {variationMode && (
      <div style={{ 
                  padding: '8px', 
                  backgroundColor: '#fff3cd', 
                  border: '1px solid #ffeaa7',
              borderRadius: '4px',
                  marginTop: '8px'
                }}>
                  <strong>Variation Mode:</strong> Next move will create a variation from "{variationStartNode?.notation}"
                  <br />
          <button
            onClick={() => {
                      setVariationMode(false);
                      setVariationStartNode(null);
                    }}
                    style={{ marginTop: '4px', padding: '4px 8px', fontSize: '12px' }}
                  >
                    Cancel
          </button>
                </div>
              )}
            </div>
          
            {/* Navigation Controls */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Navigation</h3>
              <div className="flex gap-2">
          <button
                  onClick={goToStart}
                  disabled={gameTree.currentPath.length <= 1}
                  className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  ⏮ Start
          </button>
          <button
                  onClick={goBack}
                  disabled={gameTree.currentPath.length <= 1}
                  className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  ◀ Back
          </button>
          <button
                  onClick={goForward}
                  disabled={!gameTree.currentNode || gameTree.currentNode.getVariations().length === 0}
                  className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Forward ▶
          </button>
          <button
                  onClick={goToEnd}
                  disabled={gameTree.currentPath.length <= 1}
                  className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  End ⏭
          </button>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className={`${isMobile ? 'order-2' : 'lg:col-span-1'}`}>
            {/* Variation Tree */}
            {showTree && (
              <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">Variation Tree</h3>
          <button
                    onClick={() => setShowTree(!showTree)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    {showTree ? 'Hide' : 'Show'}
          </button>
              </div>
                <VariationTree
                  moveAnnotation={gameTree.moveAnnotation}
                  selectedNodeId={selectedNode?.id || null}
                  currentPath={gameTree.currentPath.map(node => node.id || '')}
                  onNodeSelect={(nodeId) => {
                    const node = gameTree.currentPath.find(n => (n.id || '') === nodeId);
                    if (node) navigateToNode(node);
                  }}
                  maxDepth={8}
                  showComments={true}
                  showVariationCount={true}
                />
            </div>
          )}

            {/* Game Notation with Variations */}
            {showGameNotation && (
              <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">Game Notation</h3>
          <button
                    onClick={() => setShowGameNotation(!showGameNotation)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    {showGameNotation ? 'Hide' : 'Show'}
          </button>
        </div>
        <div style={{ 
                  border: '1px solid #ddd', 
                  padding: '15px', 
                  minHeight: '400px',
                  backgroundColor: '#f9f9f9',
                  fontFamily: 'monospace',
            fontSize: '14px', 
                  lineHeight: '1.6'
                }}>
                  {moveTree.variations.length > 0 ? (
                    <MoveTree 
                      node={moveTree.variations[0]} 
                      onMoveClick={handleMoveClick}
                      onCreateVariation={handleCreateVariation}
                      onDeleteVariation={handleDeleteVariation}
                      onPromoteVariation={handlePromoteVariation}
                      currentPath={currentPath}
                    />
                  ) : (
                    <div style={{ color: '#999', fontStyle: 'italic' }}>
                      Game not started. Make the first move!
          </div>
                  )}
        </div>

                <div style={{ marginTop: '20px', fontSize: '12px', color: '#666' }}>
                  <p><strong>Instructions:</strong></p>
                  <ul style={{ margin: 0, paddingLeft: '20px' }}>
                    <li>Click on moves in the notation to navigate to that position</li>
                    <li>Moves are displayed in algebraic notation</li>
                    <li>Bold numbers indicate move numbers</li>
                    <li>Click any move to jump to that position on the board</li>
                  </ul>
                  
          <div style={{ 
                    marginTop: '15px', 
                    padding: '10px', 
                    backgroundColor: '#e8f5e8',
                    borderRadius: '4px' 
                  }}>
                    <p style={{ margin: '0 0 8px 0', fontWeight: 'bold' }}>Creating Variations:</p>
                    <ol style={{ margin: 0, paddingLeft: '20px', fontSize: '11px' }}>
                      <li>Click "+var" next to any move in the notation</li>
                      <li>The board will jump to that position</li>
                      <li>You'll see "Variation Mode" indicator</li>
                      <li>Make your alternative move - it will create a new variation</li>
                      <li>The variation will appear in parentheses in the notation</li>
                    </ol>
                  </div>
                </div>
              </div>
            )}

            {/* Opening Explorer */}
            {showOpeningTree && (
              <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">Opening Explorer</h3>
                  <div className="flex gap-2">
                    <select
                      value={openingDatabase}
                      onChange={(e) => setOpeningDatabase(e.target.value as 'lichess' | 'masters')}
                      className="px-2 py-1 border rounded text-sm"
                    >
                      <option value="masters">Masters</option>
                      <option value="lichess">Lichess</option>
                    </select>
              <button
                      onClick={() => setShowOpeningTree(!showOpeningTree)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      {showOpeningTree ? 'Hide' : 'Show'}
              </button>
            </div>
                </div>
                <SimpleOpeningExplorer
                  currentFEN={boardPosition}
                  onMoveClick={(from, to, promotion) => {
                    const move = { from, to, promotion };
                    handleMove(move);
                  }}
                />
              </div>
            )}

            {/* Engine Suggestions */}
            {showEngineSuggestions && (
              <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">Engine Suggestions</h3>
            <button
                    onClick={() => setShowEngineSuggestions(!showEngineSuggestions)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    {showEngineSuggestions ? 'Hide' : 'Show'}
            </button>
                </div>
                <EngineSuggestions
                  currentFEN={boardPosition || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'}
                  onMoveClick={(from, to, promotion) => {
                    const move = { from, to, promotion };
                    handleMove(move);
                  }}
                />
          </div>
        )}

            {/* Bot Play */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Bot Play</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="bot-play"
                    checked={isPlayingWithBot}
                    onChange={(e) => setIsPlayingWithBot(e.target.checked)}
                    className="rounded"
                  />
                  <label htmlFor="bot-play" className="text-sm text-gray-700">
                    Play against bot
                  </label>
      </div>

                {isPlayingWithBot && (
                  <div className="space-y-2">
                    <label className="text-sm text-gray-700">Bot Difficulty:</label>
                    <select
                      value={botDifficulty}
                      onChange={(e) => setBotDifficulty(e.target.value)}
                      className="w-full px-2 py-1 border rounded text-sm"
                    >
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
        </div>
                )}
                
                {isBotThinking && (
                  <div className="text-sm text-blue-600 flex items-center gap-2">
                    <Bot size={16} className="animate-spin" />
                    Bot is thinking...
                  </div>
                )}
              </div>
            </div>
        </div>
      </div>

        {/* Save Dialog */}
      {showSaveDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Save Game</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Title</label>
              <input
                type="text"
                value={gameTitle}
                onChange={(e) => setGameTitle(e.target.value)}
                    className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter game title"
              />
            </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Description</label>
              <textarea
                value={gameDescription}
                onChange={(e) => setGameDescription(e.target.value)}
                    className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter game description"
                rows={3}
              />
            </div>
                <div className="flex gap-2">
              <button
                    onClick={handleSaveGame}
                    className="flex-1 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                  >
                    Save Game
              </button>
              <button
                    onClick={() => setShowSaveDialog(false)}
                    className="flex-1 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                  >
                    Cancel
              </button>
            </div>
      {saveSuccess && (
                  <div className="text-green-600 text-sm text-center">
          Game saved successfully!
        </div>
      )}
    </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChessAnnotationAdvancedPage;
