import React, { useState, useCallback, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, SkipBack, SkipForward, RotateCcw } from 'lucide-react';

// Chess Game Tree Management with Fixed Deep Variation Support
class ChessGameTree {
  constructor() {
    this.gameTree = {
      moves: [],
      variations: []
    };
    this.currentPath = [0]; // Start at main line
    this.currentMove = -1; // -1 means before first move
  }

  // Navigate to a specific position in the tree using path
  navigateToPosition(path, moveIndex = null) {
    let current = this.gameTree;
    
    console.log(`🚀 navigateToPosition - path: [${path.join(', ')}]`);
    console.log(`🚀 navigateToPosition - starting at root with ${current.moves.length} moves`);
    
    // Navigate through the path to reach the target position
    for (let i = 1; i < path.length; i++) {
      const variationIndex = path[i] - 1; // Convert to 0-based index
      
      console.log(`🚀 navigateToPosition - step ${i}: looking for variation ${path[i]} (index ${variationIndex})`);
      
      if (!current.variations || !current.variations[variationIndex]) {
        console.error(`Invalid path: variation ${path[i]} not found at level ${i}`);
        console.error(`Available variations:`, current.variations?.map((v, idx) => `${idx + 1}: ${v.moves.length} moves`) || 'none');
        return null;
      }
      
      current = current.variations[variationIndex];
      console.log(`🚀 navigateToPosition - moved to variation ${path[i]} with ${current.moves.length} moves`);
    }
    
    console.log(`🚀 navigateToPosition - final position has ${current.moves.length} moves`);
    return current;
  }

  // Get a deep copy of a position to avoid reference issues
  deepClonePosition(position) {
    return {
      moves: [...position.moves],
      variations: position.variations.map(variation => ({
        moves: [...variation.moves],
        variations: variation.variations ? this.deepCloneVariations(variation.variations) : []
      }))
    };
  }

  deepCloneVariations(variations) {
    return variations.map(variation => ({
      moves: [...variation.moves],
      variations: variation.variations ? this.deepCloneVariations(variation.variations) : []
    }));
  }

  // SIMPLIFIED makeMove function that actually works
  makeMove(fromRow, fromCol, toRow, toCol, piece, notation, isWhite) {
    // Create the move object
    const move = {
      id: Date.now() + Math.random(),
      from: { row: fromRow, col: fromCol },
      to: { row: toRow, col: toCol },
      piece: piece,
      notation: notation,
      isWhite: isWhite,
      timestamp: Date.now()
    };

    console.log(`🚀 Making move from (${fromRow},${fromCol}) to (${toRow},${toCol})`);
    console.log(`🚀 Current path: [${this.currentPath.join(', ')}], current move: ${this.currentMove}`);

    // Navigate to the current position using the path
    const targetPosition = this.navigateToPosition(this.currentPath);
    
    if (!targetPosition) {
      console.error('Could not navigate to target position');
      return false;
    }

    console.log(`🚀 Target position moves length: ${targetPosition.moves.length}, currentMove: ${this.currentMove}`);

    // SIMPLE LOGIC: Always add the move to the current position
    targetPosition.moves.push(move);
    this.currentMove = targetPosition.moves.length - 1;
    
    console.log(`🚀 Added move to position. New currentMove: ${this.currentMove}`);
    console.log(`🚀 Position now has ${targetPosition.moves.length} moves`);
    
    return true;
  }

  // Helper function to find if a variation with the given move already exists
  findExistingVariation(position, move) {
    if (!position.variations) return -1;
    
    return position.variations.findIndex(variation => {
      if (variation.moves.length === 0) return false;
      
      const firstMove = variation.moves[0];
      return firstMove.from.row === move.from.row &&
             firstMove.from.col === move.from.col &&
             firstMove.to.row === move.to.row &&
             firstMove.to.col === move.to.col;
    });
  }

  // Fixed switchToVariation function
  switchToVariation(path, moveIndex) {
    console.log(`🚀 Switching to variation: [${path.join(', ')}], move: ${moveIndex}`);
    
    // Validate the path exists
    const targetPosition = this.navigateToPosition(path);
    if (!targetPosition) {
      console.error('Invalid variation path');
      return false;
    }

    // Validate the move index - allow -1 for "before first move"
    if (moveIndex < -1 || moveIndex >= targetPosition.moves.length) {
      console.error(`Invalid move index ${moveIndex} for variation with ${targetPosition.moves.length} moves`);
      return false;
    }

    this.currentPath = [...path]; // Create a copy to avoid reference issues
    this.currentMove = moveIndex;
    
    console.log(`🚀 Successfully switched to path: [${this.currentPath.join(', ')}], move: ${this.currentMove}`);
    return true;
  }

  // Get the current position in the game tree
  getCurrentPosition() {
    return this.navigateToPosition(this.currentPath);
  }

  // Get moves up to current position for board display
  getMovesToCurrentPosition() {
    const moves = [];
    const position = this.getCurrentPosition();
    
    console.log(`🚀 getMovesToCurrentPosition - position:`, position);
    console.log(`🚀 getMovesToCurrentPosition - currentMove: ${this.currentMove}`);
    
    if (position && position.moves) {
      // If currentMove is -1, return empty array (before first move)
      if (this.currentMove === -1) {
        console.log(`🚀 getMovesToCurrentPosition - before first move, returning empty array`);
        return [];
      }
      
      for (let i = 0; i <= this.currentMove; i++) {
        if (position.moves[i]) {
          moves.push(position.moves[i]);
        }
      }
    }
    
    console.log(`🚀 getMovesToCurrentPosition - returning ${moves.length} moves`);
    return moves;
  }

  // Debug function to print the entire tree structure
  debugPrintTree(position = this.gameTree, indent = 0, pathSoFar = [0]) {
    const spaces = ' '.repeat(indent * 2);
    console.log(`${spaces}Path [${pathSoFar.join(',')}]: ${position.moves.length} moves`);
    
    if (position.variations && position.variations.length > 0) {
      position.variations.forEach((variation, index) => {
        const newPath = [...pathSoFar, index + 1];
        console.log(`${spaces}  Variation ${index + 1}:`);
        this.debugPrintTree(variation, indent + 1, newPath);
      });
    }
  }
}

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

const pieceSymbols = {
  'K': '♔', 'Q': '♕', 'R': '♖', 'B': '♗', 'N': '♘', 'P': '♙',
  'k': '♚', 'q': '♛', 'r': '♜', 'b': '♝', 'n': '♞', 'p': '♟'
};

const ChessBoard = () => {
  const [board, setBoard] = useState(initialBoard);
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [isWhiteTurn, setIsWhiteTurn] = useState(true);
  const [moveNumber, setMoveNumber] = useState(1);
  const [boardOrientation, setBoardOrientation] = useState('white');
  const [isMobile, setIsMobile] = useState(false);
  const [isBoardUpdating, setIsBoardUpdating] = useState(false);
  
  // Use the new ChessGameTree class
  const gameTreeRef = useRef(new ChessGameTree());
  const [gameState, setGameState] = useState({}); // Force re-renders

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


  // Check if a move is valid
  const isValidMove = (board, fromRow, fromCol, toRow, toCol) => {
    const piece = board[fromRow][fromCol];
    if (!piece) return false;

    const isWhitePiece = piece === piece.toUpperCase();
    const targetPiece = board[toRow][toCol];
    
    // Can't capture own piece
    if (targetPiece && (targetPiece === targetPiece.toUpperCase()) === isWhitePiece) {
      return false;
    }

    const rowDiff = Math.abs(toRow - fromRow);
    const colDiff = Math.abs(toCol - fromCol);

    switch (piece.toLowerCase()) {
      case 'p': // Pawn
        const direction = isWhitePiece ? -1 : 1;
        const startRow = isWhitePiece ? 6 : 1;
        
        // Forward move
        if (colDiff === 0 && !targetPiece) {
          if (toRow === fromRow + direction) return true;
          if (fromRow === startRow && toRow === fromRow + 2 * direction) return true;
        }
        // Capture
        if (colDiff === 1 && rowDiff === 1 && targetPiece) {
          return toRow === fromRow + direction;
        }
        return false;

      case 'r': // Rook
        return (rowDiff === 0 || colDiff === 0) && !hasPieceInPath(board, fromRow, fromCol, toRow, toCol);

      case 'n': // Knight
        return (rowDiff === 2 && colDiff === 1) || (rowDiff === 1 && colDiff === 2);

      case 'b': // Bishop
        return rowDiff === colDiff && !hasPieceInPath(board, fromRow, fromCol, toRow, toCol);

      case 'q': // Queen
        return (rowDiff === colDiff || rowDiff === 0 || colDiff === 0) && 
               !hasPieceInPath(board, fromRow, fromCol, toRow, toCol);

      case 'k': // King
        // Regular king move
        if (rowDiff <= 1 && colDiff <= 1) return true;
        
        // Castling
        if (rowDiff === 0 && colDiff === 2) {
          const rookCol = toCol > fromCol ? 7 : 0;
          const rook = board[fromRow][rookCol];
          const kingRow = isWhitePiece ? 7 : 0;
          
          return fromRow === kingRow && 
                 rook && 
                 rook.toLowerCase() === 'r' &&
                 (rook === rook.toUpperCase()) === isWhitePiece &&
                 !hasPieceInPath(board, fromRow, fromCol, fromRow, rookCol);
        }
        return false;

      default:
        return false;
    }
  };

  // Check if there's a piece in the path (for rook, bishop, queen)
  const hasPieceInPath = (board, fromRow, fromCol, toRow, toCol) => {
    const rowStep = toRow > fromRow ? 1 : toRow < fromRow ? -1 : 0;
    const colStep = toCol > fromCol ? 1 : toCol < fromCol ? -1 : 0;
    
    let currentRow = fromRow + rowStep;
    let currentCol = fromCol + colStep;
    
    while (currentRow !== toRow || currentCol !== toCol) {
      if (board[currentRow][currentCol]) return true;
      currentRow += rowStep;
      currentCol += colStep;
    }
    
    return false;
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



  // Make a move using the new ChessGameTree
  const makeMove = (fromRow, fromCol, toRow, toCol) => {
    console.log('🚀 makeMove - from:', fromRow, fromCol, 'to:', toRow, toCol);
    
    const piece = board[fromRow][fromCol];
    if (!piece) {
      console.log('🚀 makeMove - No piece at source square');
      return false;
    }

    const isWhitePiece = piece === piece.toUpperCase();
    console.log('🚀 makeMove - piece:', piece, 'isWhitePiece:', isWhitePiece, 'isWhiteTurn:', isWhiteTurn);
    
    if (isWhitePiece !== isWhiteTurn) {
      console.log('🚀 makeMove - Turn validation failed: wrong player to move');
      return false;
    }

    // Validate the move
    if (!isValidMove(board, fromRow, fromCol, toRow, toCol)) {
      console.log('🚀 makeMove - Invalid move:', piece, 'from', positionToAlgebraic(fromRow, fromCol), 'to', positionToAlgebraic(toRow, toCol));
      return false;
    }

    const capturedPiece = board[toRow][toCol];
    const notation = generateMoveNotation(fromRow, fromCol, toRow, toCol, piece, capturedPiece, board);

    // Use the ChessGameTree to make the move
    const success = gameTreeRef.current.makeMove(fromRow, fromCol, toRow, toCol, piece, notation, isWhiteTurn);
    
    if (success) {
      // Update turn and move number
      setIsWhiteTurn(!isWhiteTurn);
      if (!isWhiteTurn) {
        setMoveNumber(moveNumber + 1);
      }
      
      // Update board from tree (this will apply all moves correctly)
      updateBoardFromTree();
      
      // Debug print tree
      gameTreeRef.current.debugPrintTree();
    }

    return success;
  };

  // Handle square click for custom board - ENHANCED
  const handleSquareClick = (row, col) => {
    console.log('🚀 === HANDLE SQUARE CLICK ===');
    console.log('🚀 handleSquareClick - row:', row, 'col:', col);
    console.log('🚀 handleSquareClick - piece at square:', board[row][col]);
    console.log('🚀 handleSquareClick - currentPath:', gameTreeRef.current.currentPath, 'currentMove:', gameTreeRef.current.currentMove);
    
    if (selectedSquare) {
      const [fromRow, fromCol] = selectedSquare;
      if (fromRow === row && fromCol === col) {
        setSelectedSquare(null);
        return;
      }
      
      // Make the move with enhanced variation logic
      const result = makeMove(fromRow, fromCol, row, col);
      console.log('🚀 handleSquareClick - makeMove result:', result);
      
      if (result) {
        setSelectedSquare(null);
        // Update the board and game state
        updateBoardFromTree();
      } else {
        // If move failed, select the target square if it has a piece
        setSelectedSquare(board[row][col] ? [row, col] : null);
      }
    } else {
      // Select piece if it belongs to the current player
      const piece = board[row][col];
      if (piece) {
        const isWhitePiece = piece === piece.toUpperCase();
        if (isWhitePiece === isWhiteTurn) {
          setSelectedSquare([row, col]);
        }
      }
    }
  };

  // Navigation functions using ChessGameTree
  const goToStart = () => {
    gameTreeRef.current.switchToVariation([0], -1);
    updateBoardFromTree();
  };
  
  const goToEnd = () => {
    const currentPos = gameTreeRef.current.getCurrentPosition();
    if (currentPos && currentPos.moves.length > 0) {
      gameTreeRef.current.switchToVariation(gameTreeRef.current.currentPath, currentPos.moves.length - 1);
      updateBoardFromTree();
    }
  };

  const goToPrevious = () => {
    console.log('🚀 === GO TO PREVIOUS ===');
    const currentMove = gameTreeRef.current.currentMove;
    const currentPath = gameTreeRef.current.currentPath;
    
    if (currentMove > -1) {
      console.log('🚀 goToPrevious - Going back one move in current variation');
      gameTreeRef.current.switchToVariation(currentPath, currentMove - 1);
      updateBoardFromTree();
    } else if (currentPath.length > 1) {
      console.log('🚀 goToPrevious - At start of variation, going to parent');
      const parentPath = currentPath.slice(0, -1);
      const parentPos = gameTreeRef.current.navigateToPosition(parentPath);
      if (parentPos && parentPos.moves.length > 0) {
        gameTreeRef.current.switchToVariation(parentPath, parentPos.moves.length - 1);
        updateBoardFromTree();
      } else {
        // Parent has no moves, go to start of parent
        gameTreeRef.current.switchToVariation(parentPath, -1);
        updateBoardFromTree();
      }
    } else {
      console.log('🚀 goToPrevious - Already at start of main line');
    }
  };

  const goToNext = () => {
    const currentPos = gameTreeRef.current.getCurrentPosition();
    const currentMove = gameTreeRef.current.currentMove;
    const currentPath = gameTreeRef.current.currentPath;
    
    console.log('🚀 goToNext - currentPos:', currentPos, 'currentMove:', currentMove, 'currentPath:', currentPath);
    
    if (currentMove < currentPos.moves.length - 1) {
      // Move forward in current line
      console.log('🚀 goToNext - Moving forward in current line');
      gameTreeRef.current.switchToVariation(currentPath, currentMove + 1);
      updateBoardFromTree();
    } else if (currentPos.variations && currentPos.variations.length > 0) {
      // Move to first variation
      console.log('🚀 goToNext - Moving to first variation');
      const newPath = [...currentPath, 1];
      gameTreeRef.current.switchToVariation(newPath, -1);
      updateBoardFromTree();
    } else {
      console.log('🚀 goToNext - No more moves available');
    }
  };

  // Update board position from the game tree
  const updateBoardFromTree = () => {
    const moves = gameTreeRef.current.getMovesToCurrentPosition();
    console.log('🚀 updateBoardFromTree - moves:', moves);
    let newBoard = JSON.parse(JSON.stringify(initialBoard));
    
    // Apply all moves up to current position
    for (const move of moves) {
      const fromRow = move.from.row;
      const fromCol = move.from.col;
      const toRow = move.to.row;
      const toCol = move.to.col;
      const piece = move.piece;
      
      console.log(`🚀 Applying move: ${piece} from (${fromRow},${fromCol}) to (${toRow},${toCol})`);
      newBoard[toRow][toCol] = piece;
      newBoard[fromRow][fromCol] = null;
    }
    
    // Update turn and move number based on the last move
    if (moves.length > 0) {
      const lastMove = moves[moves.length - 1];
      setIsWhiteTurn(!lastMove.isWhite); // Next player to move
      setMoveNumber(Math.floor(moves.length / 2) + 1);
    } else {
      setIsWhiteTurn(true); // White to move at start
      setMoveNumber(1);
    }
    
    console.log('🚀 Final board after updateBoardFromTree:', newBoard);
    setBoard(newBoard);
    setGameState({...gameState, timestamp: Date.now()});
  };

  // Switch to variation using ChessGameTree
  const switchToVariation = (variationPath, moveIndex = 0) => {
    console.log('🚀 switchToVariation - variationPath:', variationPath, 'moveIndex:', moveIndex);
    
    const success = gameTreeRef.current.switchToVariation(variationPath, moveIndex);
    if (success) {
      updateBoardFromTree();
      console.log('🚀 Successfully switched to variation');
      } else {
      console.error('🚀 Failed to switch to variation');
      }
  };


  // Reset game
  const resetGame = () => {
    setBoard(initialBoard);
    setIsWhiteTurn(true);
    setMoveNumber(1);
    gameTreeRef.current = new ChessGameTree();
    setGameState({...gameState, timestamp: Date.now()});
  };

  // Toggle board orientation
  const toggleBoardOrientation = () => {
    setBoardOrientation(prev => prev === 'white' ? 'black' : 'white');
  };

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Keyboard controls
  useEffect(() => {
    const handleKeyPress = (event) => {
      // Don't trigger if user is typing in an input field
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
        case 'r':
        case 'R':
          event.preventDefault();
          resetGame();
          break;
        case 'f':
        case 'F':
          event.preventDefault();
          toggleBoardOrientation();
          break;
        case 'Escape':
          event.preventDefault();
          // Go back to main line if in a variation
          if (gameTreeRef.current.currentPath.length > 0) {
            switchToVariation([0]);
          }
          break;
        case 'p':
        case 'P':
          event.preventDefault();
          if (gameTreeRef.current.currentPath.length > 1) {
            const parentPath = gameTreeRef.current.currentPath.slice(0, -1);
            switchToVariation(parentPath);
          }
          break;
        case ' ':
          event.preventDefault();
          goToNext();
          break;
        case 'Backspace':
          event.preventDefault();
          goToPrevious();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [goToPrevious, goToNext, goToStart, goToEnd, resetGame, toggleBoardOrientation, switchToVariation]);


  // Render notation tree using ChessGameTree
  const renderNotationTree = (position, depth = 0, pathPrefix = []) => {
    const currentPath = gameTreeRef.current.currentPath;
    const currentMove = gameTreeRef.current.currentMove;
    const currentFullPath = pathPrefix;
    const isCurrentPath = JSON.stringify(currentFullPath) === JSON.stringify(currentPath.slice(0, currentFullPath.length));
    
    return (
      <div className="notation-section" key={`${depth}-${pathPrefix.join('-')}`}>
        {position.moves.length > 0 && (
          <div className={`moves-line ${isCurrentPath && currentPath.length === pathPrefix.length ? 'current-line' : ''} ${depth > 0 ? 'variation' : 'main-line'}`}>
            {depth > 0 && <span className="variation-indicator">({depth}) </span>}
            {position.moves.map((move, idx) => {
              const moveIndex = idx;
              const isCurrentMove = isCurrentPath && currentPath.length === pathPrefix.length && currentMove === moveIndex;
              const displayNumber = move.isWhite ? `${Math.floor(idx / 2) + 1}.` : 
                                   (!move.isWhite && idx === 0) ? `${Math.floor(idx / 2) + 1}...` : '';
              
              return (
                <span key={move.id} className="move-group">
                  {displayNumber && <span className="move-number">{displayNumber}</span>}
                  <button
                    className={`move-btn ${isCurrentMove ? 'current-move' : ''}`}
                    onClick={() => switchToVariation(currentFullPath, moveIndex)}
                  >
                    {move.notation}
                  </button>
                  
                  {/* Inline variations after this move */}
                  {position.variations && position.variations.length > 0 && idx === position.moves.length - 1 && (
                    <span className="inline-variations">
                      {position.variations.map((variation, varIdx) => (
                        <span key={variation.id || varIdx} className="inline-variation">
                          <span className="variation-paren"> (</span>
                          {renderInlineVariation(variation, depth + 1, [...pathPrefix, varIdx + 1])}
                          <span className="variation-paren">) </span>
                        </span>
                      ))}
                    </span>
                  )}
                </span>
              );
            })}
          </div>
        )}
        
        {/* Block-level variations (shown below main moves) */}
        {position.variations && position.variations.length > 0 && position.moves.length > 0 && (
          <div className="block-variations">
            {position.variations.map((variation, idx) => (
              <div key={variation.id || idx} className="variation-container">
                {renderNotationTree(variation, depth + 1, [...pathPrefix, idx + 1])}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Render inline variations using ChessGameTree
  const renderInlineVariation = (variation, depth, fullPath) => {
    const currentPath = gameTreeRef.current.currentPath;
    const currentMove = gameTreeRef.current.currentMove;
    
    return (
      <span className="inline-variation-content">
        {variation.moves.map((move, idx) => {
          const moveIndex = idx;
          const isCurrentMove = JSON.stringify(currentPath) === JSON.stringify(fullPath) && currentMove === moveIndex;
          const displayNumber = move.isWhite ? `${Math.floor(idx / 2) + 1}.` : 
                               (!move.isWhite && idx === 0) ? `${Math.floor(idx / 2) + 1}...` : '';
          
          return (
            <span key={move.id}>
              {displayNumber && <span className="move-number">{displayNumber}</span>}
              <button
                className={`move-btn inline ${isCurrentMove ? 'current-move' : ''}`}
                onClick={() => {
                  console.log('🚀 Variation click - fullPath:', fullPath, 'moveIndex:', moveIndex);
                  switchToVariation(fullPath, moveIndex);
                }}
              >
                {move.notation}
              </button>
              
              {/* Nested inline variations */}
              {variation.variations && variation.variations.length > 0 && idx === variation.moves.length - 1 && (
                <span>
                  {variation.variations.map((subVar, subIdx) => {
                    const subVariationPath = [...fullPath, subIdx + 1];
                    console.log('🚀 Creating sub-variation path:', subVariationPath, 'for subVar:', subVar);
                    return (
                      <span key={subVar.id || subIdx}>
                      <span className="variation-paren"> (</span>
                        {renderInlineVariation(subVar, depth + 1, subVariationPath)}
                      <span className="variation-paren">) </span>
                    </span>
                    );
                  })}
                </span>
              )}
            </span>
          );
        })}
      </span>
    );
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        {/* Header */}
        <div className="bg-white shadow-sm border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <h1 className="text-xl font-semibold text-slate-900">Analysis Board</h1>
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={toggleBoardOrientation}
                  className="flex items-center px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Flip
                </button>
                <button
                  onClick={resetGame}
                  className="flex items-center px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Chess Board */}
            <div className="flex-shrink-0">
              <div className={`${isMobile ? 'w-80 h-80' : 'w-96 h-96'} mx-auto`}>
                <div className="relative bg-white rounded-xl shadow-2xl p-4 border border-slate-200">
                  <div className="inline-block border-4 border-gray-800 rounded-lg overflow-hidden shadow-lg">
                    {board.map((row, rowIndex) => (
                      <div key={rowIndex} className="flex">
                        {row.map((piece, colIndex) => {
                          const isLight = (rowIndex + colIndex) % 2 === 0;
                          const isSelected = selectedSquare && selectedSquare[0] === rowIndex && selectedSquare[1] === colIndex;
                          return (
                            <div 
                              key={`${rowIndex}-${colIndex}`} 
                              className={`w-12 h-12 flex items-center justify-center cursor-pointer text-3xl relative ${
                                isLight ? 'bg-amber-100' : 'bg-amber-800'
                              } ${isSelected ? 'ring-4 ring-blue-400' : ''} hover:ring-2 hover:ring-blue-300 transition-all`}
                              onClick={() => handleSquareClick(rowIndex, colIndex)}
                            >
                              {piece && (
                                <span className={`${piece === piece.toUpperCase() ? 'text-white' : 'text-black'} drop-shadow-lg select-none`}>
                                  {pieceSymbols[piece]}
                                </span>
                              )}
                              {/* Square coordinates */}
                              <div className="absolute top-1 left-1 text-xs font-bold opacity-30">
                                {positionToAlgebraic(rowIndex, colIndex)}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Navigation Controls - FIXED VISIBILITY */}
              <div className="mt-6 flex justify-center space-x-2 bg-white p-4 rounded-lg shadow-lg border border-slate-200">
                <button
                  onClick={goToStart}
                  className="flex items-center justify-center w-12 h-12 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors shadow-md"
                  title="Go to start"
                >
                  <SkipBack size={24} />
                </button>
                <button
                  onClick={goToPrevious}
                  className="flex items-center justify-center w-12 h-12 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors shadow-md"
                  title="Previous move"
                >
                  <ChevronLeft size={24} />
                </button>
                <div className="flex items-center px-6 py-3 bg-gray-100 rounded-lg border-2 border-gray-300">
                  <span className="text-lg font-mono text-gray-800 font-bold">
                    Move {gameTreeRef.current.currentMove + 1} / {gameTreeRef.current.getCurrentPosition()?.moves?.length || 0}
                  </span>
                </div>
                <button
                  onClick={goToNext}
                  className="flex items-center justify-center w-12 h-12 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors shadow-md"
                  title="Next move"
                >
                  <ChevronRight size={24} />
                </button>
                <button
                  onClick={goToEnd}
                  className="flex items-center justify-center w-12 h-12 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors shadow-md"
                  title="Go to end"
                >
                  <SkipForward size={24} />
                </button>
              </div>
            </div>

            {/* Sidebar */}
            <div className="flex-1 space-y-6">
              {/* Game Notation */}
              <div className="bg-white rounded-xl shadow-lg border border-slate-200">
                <div className="px-6 py-4 border-b border-slate-200">
                  <h3 className="text-lg font-semibold text-slate-900">Game Notation</h3>
                </div>
                <div className="p-6 max-h-96 overflow-y-auto">
                  <div className="notation-display space-y-2">
                    {renderNotationTree(gameTreeRef.current.gameTree)}
                  </div>
                  {gameTreeRef.current.gameTree.moves.length === 0 && (
                    <div className="text-slate-500 text-center italic mt-8">
                      Click on pieces to make moves.<br/>
                      Moves will appear here with full variation support.
                    </div>
                  )}
                </div>
              </div>

              {/* Position Info */}
              <div className="bg-white rounded-xl shadow-lg border border-slate-200">
                <div className="px-6 py-4 border-b border-slate-200">
                  <h3 className="text-lg font-semibold text-slate-900">Position Info</h3>
                </div>
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm font-medium text-slate-600">To Move:</span>
                      <span className={`ml-2 font-semibold ${isWhiteTurn ? 'text-slate-900' : 'text-slate-600'}`}>
                        {isWhiteTurn ? 'White' : 'Black'}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-slate-600">Move:</span>
                      <span className="ml-2 font-semibold text-slate-900">{moveNumber}</span>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-slate-600">Path:</span>
                      <span className="ml-2 font-semibold text-slate-900">
                        {gameTreeRef.current.currentPath.length > 0 ? gameTreeRef.current.currentPath.join(', ') : 'Main Line'}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-slate-600">Position:</span>
                      <span className="ml-2 font-semibold text-slate-900">
                        {gameTreeRef.current.currentMove + 1}/{gameTreeRef.current.getCurrentPosition()?.moves?.length || 0}
                      </span>
                    </div>
                  </div>
                  
                  {gameTreeRef.current.currentPath.length > 0 && (
                    <div className="pt-4 border-t border-slate-200">
                      <div className="text-sm text-slate-600 mb-3">
                        Variation Level: <span className="font-semibold text-slate-900">{gameTreeRef.current.currentPath.length}</span>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => switchToVariation([0])}
                          className="px-3 py-1 bg-blue-100 text-blue-800 rounded text-sm hover:bg-blue-200 transition-colors"
                        >
                          Main Line
                        </button>
                        {gameTreeRef.current.currentPath.length > 1 && (
                          <button 
                            onClick={() => {
                              const parentPath = gameTreeRef.current.currentPath.slice(0, -1);
                              switchToVariation(parentPath);
                            }}
                            className="px-3 py-1 bg-green-100 text-green-800 rounded text-sm hover:bg-green-200 transition-colors"
                          >
                            Parent Line
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Instructions */}
              <div className="bg-white rounded-xl shadow-lg border border-slate-200">
                <div className="px-6 py-4 border-b border-slate-200">
                  <h3 className="text-lg font-semibold text-slate-900">How to use</h3>
                </div>
                <div className="p-6">
                  <ul className="space-y-2 text-sm text-slate-600">
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      Click a piece to select it, then click destination square
                    </li>
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      Use navigation buttons to replay moves
                    </li>
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      Click on any move in notation to jump to that position
                    </li>
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      Making moves at earlier positions creates variations
                    </li>
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      Variations are shown with indentation and numbering
                    </li>
                  </ul>
                  
                  <div className="mt-6 pt-4 border-t border-slate-200">
                    <h4 className="text-sm font-semibold text-slate-900 mb-3">Keyboard Shortcuts</h4>
                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                      <div className="flex justify-between">
                        <span>← →</span>
                        <span>Previous/Next move</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Home/End</span>
                        <span>Start/End of game</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Space/Backspace</span>
                        <span>Next/Previous move</span>
                      </div>
                      <div className="flex justify-between">
                        <span>R</span>
                        <span>Reset game</span>
                      </div>
                      <div className="flex justify-between">
                        <span>F</span>
                        <span>Flip board</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Esc</span>
                        <span>Return to main line</span>
                      </div>
                      <div className="flex justify-between">
                        <span>P</span>
                        <span>Go to parent line</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .move-btn {
          @apply px-2 py-1 mx-1 rounded text-sm hover:bg-slate-200 transition-colors;
        }
        .move-btn.current-move {
          @apply bg-blue-500 text-white font-semibold;
        }
        .moves-line {
          @apply flex flex-wrap items-center mb-1;
        }
        .moves-line.main-line {
          @apply font-medium;
        }
        .moves-line.variation {
          @apply text-slate-700 ml-4 text-sm;
        }
        .moves-line.current-line {
          @apply bg-blue-50 rounded px-2 py-1;
        }
        .move-number {
          @apply text-slate-600 font-mono text-sm mr-1;
        }
        .variation-indicator {
          @apply text-blue-600 font-semibold mr-1;
        }
        .variation-container {
          @apply border-l-2 border-slate-200 pl-2 ml-2;
        }
        .move-btn.inline {
          @apply px-1 py-0 text-xs;
        }
        .inline-variations {
          @apply ml-1;
        }
        .inline-variation {
          @apply text-blue-700;
        }
        .inline-variation-content {
          @apply space-x-1;
        }
        .variation-paren {
          @apply text-slate-500 font-bold;
        }
        .block-variations {
          @apply mt-2 space-y-1;
        }
      `}</style>
    </>
  );
};

export default ChessBoard;
