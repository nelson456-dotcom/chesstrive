import React, { useState, useEffect } from 'react';

// Move Annotation System (TypeScript converted to JavaScript)
class MoveNode {
  constructor(data) {
    this.move = data.move;
    this.comment = data.comment || '';
    this.annotation = data.annotation || '';
    this.moveNumber = data.moveNumber || 0;
    this.isWhiteMove = data.isWhiteMove || true;
    this.variations = [];
    this.parent = null;
    this.nextMove = null;
  }

  addVariation(variationNode) {
    variationNode.parent = this;
    this.variations.push(variationNode);
    return variationNode;
  }

  setNextMove(nextNode) {
    this.nextMove = nextNode;
    nextNode.parent = this;
    return nextNode;
  }

  getDepth() {
    let depth = 0;
    let current = this.parent;
    while (current) {
      depth++;
      current = current.parent;
    }
    return depth;
  }

  isVariation() {
    if (!this.parent) return false;
    return this.parent.variations.includes(this);
  }

  toString() {
    let result = '';
    
    if (this.isWhiteMove || this.isVariation()) {
      result += `${this.moveNumber}.`;
      if (!this.isWhiteMove) result += '..';
      result += ' ';
    }
    
    result += this.move;
    
    if (this.annotation) {
      result += this.annotation;
    }
    
    if (this.comment) {
      result += ` {${this.comment}}`;
    }
    
    return result;
  }
}

class MoveAnnotation {
  constructor() {
    this.root = null;
    this.currentPosition = null;
    this.moveNumber = 1;
    this.isWhiteToMove = true;
  }

  addMove(move, comment = '', annotation = '') {
    const moveNode = new MoveNode({
      move,
      comment,
      annotation,
      moveNumber: this.moveNumber,
      isWhiteMove: this.isWhiteToMove
    });

    if (this.root === null) {
      this.root = moveNode;
      this.currentPosition = moveNode;
    } else {
      this.currentPosition.setNextMove(moveNode);
      this.currentPosition = moveNode;
    }

    if (!this.isWhiteToMove) {
      this.moveNumber++;
    }
    this.isWhiteToMove = !this.isWhiteToMove;

    return moveNode;
  }

  addVariationAtPosition(position, moves) {
    if (moves.length === 0) return [];

    const variationNodes = [];
    let currentVariationNode = null;
    let variationMoveNumber = position.moveNumber;
    let isWhiteMove = position.isWhiteMove;

    for (let i = 0; i < moves.length; i++) {
      const moveData = moves[i];
      const variationNode = new MoveNode({
        move: moveData.move,
        comment: moveData.comment,
        annotation: moveData.annotation,
        moveNumber: variationMoveNumber,
        isWhiteMove: isWhiteMove
      });

      if (i === 0) {
        position.addVariation(variationNode);
        currentVariationNode = variationNode;
      } else {
        currentVariationNode.setNextMove(variationNode);
        currentVariationNode = variationNode;
      }

      variationNodes.push(variationNode);

      if (!isWhiteMove) {
        variationMoveNumber++;
      }
      isWhiteMove = !isWhiteMove;
    }

    return variationNodes;
  }

  toPGN() {
    if (!this.root) return '';
    
    const formatVariation = (node, isMainline = true) => {
      if (!node) return '';
      
      let result = '';
      let current = node;
      
      while (current) {
        if (!isMainline || result !== '') result += ' ';
        result += current.toString();
        
        for (const variation of current.variations) {
          result += ' (' + formatVariation(variation, false) + ')';
        }
        
        current = current.nextMove;
      }
      
      return result;
    };
    
    return formatVariation(this.root, true);
  }

  getMainline() {
    const mainline = [];
    let current = this.root;
    
    while (current) {
      mainline.push(current);
      current = current.nextMove;
    }
    
    return mainline;
  }
}

// Chess piece components
const pieces = {
  'K': '♔', 'Q': '♕', 'R': '♖', 'B': '♗', 'N': '♘', 'P': '♙',
  'k': '♚', 'q': '♛', 'r': '♜', 'b': '♝', 'n': '♞', 'p': '♟'
};

const initialPosition = [
  ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'],
  ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
  ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R']
];

const InteractiveChessBoard = () => {
  const [board, setBoard] = useState(initialPosition.map(row => [...row]));
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [moveAnnotation] = useState(new MoveAnnotation());
  const [gameNotation, setGameNotation] = useState('');
  const [currentMove, setCurrentMove] = useState('');
  const [moveComment, setMoveComment] = useState('');
  const [moveSymbol, setMoveSymbol] = useState('');
  const [isWhiteToMove, setIsWhiteToMove] = useState(true);
  const [moveHistory, setMoveHistory] = useState([]);
  const [selectedMoveForVariation, setSelectedMoveForVariation] = useState(null);
  const [currentNode, setCurrentNode] = useState(null);
  const [boardHistory, setBoardHistory] = useState([initialPosition.map(row => [...row])]);
  const [currentBoardIndex, setCurrentBoardIndex] = useState(0);

  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];

  const squareToAlgebraic = (row, col) => {
    return files[col] + ranks[row];
  };

  const algebraicToSquare = (algebraic) => {
    const file = algebraic[0];
    const rank = algebraic[1];
    const col = files.indexOf(file);
    const row = ranks.indexOf(rank);
    return [row, col];
  };

  const makeMove = (fromSquare, toSquare) => {
    const [fromRow, fromCol] = fromSquare;
    const [toRow, toCol] = toSquare;
    const piece = board[fromRow][fromCol];
    
    if (!piece) return false;
    
    // Simple validation - check if it's the right player's turn
    const isWhitePiece = piece === piece.toUpperCase();
    if (isWhitePiece !== isWhiteToMove) return false;

    const newBoard = board.map(row => [...row]);
    newBoard[toRow][toCol] = piece;
    newBoard[fromRow][fromCol] = null;
    
    const moveNotation = generateMoveNotation(piece, fromSquare, toSquare);
    
    // Automatically add move to annotation system
    const moveNode = moveAnnotation.addMove(moveNotation, '', '');
    setMoveHistory([...moveHistory, moveNode]);
    setGameNotation(moveAnnotation.toPGN());
    setCurrentNode(moveNode);
    
    // Update board history
    const newBoardHistory = [...boardHistory.slice(0, currentBoardIndex + 1), newBoard];
    setBoardHistory(newBoardHistory);
    setCurrentBoardIndex(newBoardHistory.length - 1);
    
    setBoard(newBoard);
    setCurrentMove('');  // Clear current move since it's already added
    setIsWhiteToMove(!isWhiteToMove);
    
    return true;
  };

  const generateMoveNotation = (piece, fromSquare, toSquare) => {
    const [fromRow, fromCol] = fromSquare;
    const [toRow, toCol] = toSquare;
    const fromAlgebraic = squareToAlgebraic(fromRow, fromCol);
    const toAlgebraic = squareToAlgebraic(toRow, toCol);
    
    // Simplified notation - just piece + destination
    const pieceSymbol = piece.toUpperCase() === 'P' ? '' : piece.toUpperCase();
    const capture = board[toRow][toCol] ? 'x' : '';
    
    return `${pieceSymbol}${capture}${toAlgebraic}`;
  };

  const handleSquareClick = (row, col) => {
    console.log('Square clicked:', { row, col, selectedSquare, selectedMoveForVariation: selectedMoveForVariation?.toString() });
    
    if (selectedSquare) {
      const [selectedRow, selectedCol] = selectedSquare;
      
      if (selectedRow === row && selectedCol === col) {
        setSelectedSquare(null);
        return;
      }
      
      if (selectedMoveForVariation) {
        // Creating a variation
        const piece = board[selectedRow][selectedCol];
        if (piece) {
          // For variations, we need to check if it's a valid move from the selected piece
          // We don't need to check the current turn since we're creating an alternative line
          const moveNotation = generateMoveNotation(piece, selectedSquare, [row, col]);
          
          console.log('Creating variation:', {
            from: selectedSquare,
            to: [row, col],
            piece: piece,
            moveNotation: moveNotation,
            afterMove: selectedMoveForVariation.toString()
          });
          
          // Add as variation
          moveAnnotation.addVariationAtPosition(selectedMoveForVariation, [{
            move: moveNotation,
            comment: moveComment,
            annotation: moveSymbol
          }]);
          
          setGameNotation(moveAnnotation.toPGN());
          // Update move history to include variations
          setMoveHistory(moveAnnotation.getMainline());
          setSelectedMoveForVariation(null);
          setMoveComment('');
          setMoveSymbol('');
        }
        setSelectedSquare(null);
      } else {
        // Normal move
        if (makeMove(selectedSquare, [row, col])) {
          setSelectedSquare(null);
        } else {
          setSelectedSquare([row, col]);
        }
      }
    } else {
      if (board[row][col]) {
        setSelectedSquare([row, col]);
      }
    }
  };

  const addMoveToAnnotation = () => {
    if (!currentMove) return;
    
    const moveNode = moveAnnotation.addMove(currentMove, moveComment, moveSymbol);
    setMoveHistory([...moveHistory, moveNode]);
    setGameNotation(moveAnnotation.toPGN());
    setCurrentMove('');
    setMoveComment('');
    setMoveSymbol('');
  };

  const addVariation = () => {
    if (!selectedMoveForVariation || !currentMove) return;
    
    const variationMoves = [{ 
      move: currentMove, 
      comment: moveComment, 
      annotation: moveSymbol 
    }];
    
    moveAnnotation.addVariationAtPosition(selectedMoveForVariation, variationMoves);
    setGameNotation(moveAnnotation.toPGN());
    setCurrentMove('');
    setMoveComment('');
    setMoveSymbol('');
    setSelectedMoveForVariation(null);
  };

  const resetGame = () => {
    setBoard(initialPosition.map(row => [...row]));
    setSelectedSquare(null);
    setCurrentMove('');
    setMoveComment('');
    setMoveSymbol('');
    setIsWhiteToMove(true);
    setMoveHistory([]);
    setGameNotation('');
    setSelectedMoveForVariation(null);
    setCurrentNode(null);
    setBoardHistory([initialPosition.map(row => [...row])]);
    setCurrentBoardIndex(0);
    moveAnnotation.root = null;
    moveAnnotation.currentPosition = null;
    moveAnnotation.moveNumber = 1;
    moveAnnotation.isWhiteToMove = true;
  };

  const loadDemoGame = () => {
    resetGame();
    
    // Add some demo moves with annotations
    const e4 = moveAnnotation.addMove('e4', 'King pawn opening', '!');
    const e5 = moveAnnotation.addMove('e5', 'Classical response');
    const nf3 = moveAnnotation.addMove('Nf3', 'Developing with tempo', '!?');
    
    // Add Sicilian variation after e4
    moveAnnotation.addVariationAtPosition(e4, [
      { move: 'c5', comment: 'Sicilian Defense - sharp and complex', annotation: '!' },
      { move: 'Nf3', comment: 'Open Sicilian' },
      { move: 'Nc6', comment: 'Accelerated Dragon setup' }
    ]);
    
    // Add French Defense variation
    moveAnnotation.addVariationAtPosition(e4, [
      { move: 'e6', comment: 'French Defense - solid but cramped' },
      { move: 'd4', annotation: '!' },
      { move: 'd5', comment: 'Central tension' }
    ]);
    
    // Add a variation after e5 (Petroff Defense)
    moveAnnotation.addVariationAtPosition(e5, [
      { move: 'Nf6', comment: 'Petroff Defense - symmetrical', annotation: '!?' },
      { move: 'Nxe5', comment: 'Accepting the challenge' },
      { move: 'd6', comment: 'Forcing the knight back' }
    ]);
    
    setGameNotation(moveAnnotation.toPGN());
    setMoveHistory(moveAnnotation.getMainline());
    setCurrentNode(nf3);
  };

  // Navigation functions
  const goBack = () => {
    if (currentBoardIndex > 0) {
      const newIndex = currentBoardIndex - 1;
      setCurrentBoardIndex(newIndex);
      setBoard(boardHistory[newIndex]);
      
      // Update current node and turn
      if (newIndex === 0) {
        setCurrentNode(null);
        setIsWhiteToMove(true);
      } else {
        setCurrentNode(moveHistory[newIndex - 1]);
        setIsWhiteToMove(moveHistory[newIndex - 1] ? !moveHistory[newIndex - 1].isWhiteMove : true);
      }
    }
  };

  const goForward = () => {
    if (currentBoardIndex < boardHistory.length - 1) {
      const newIndex = currentBoardIndex + 1;
      setCurrentBoardIndex(newIndex);
      setBoard(boardHistory[newIndex]);
      
      // Update current node and turn
      setCurrentNode(moveHistory[newIndex - 1]);
      setIsWhiteToMove(moveHistory[newIndex - 1] ? !moveHistory[newIndex - 1].isWhiteMove : true);
    }
  };

  const goToStart = () => {
    setCurrentBoardIndex(0);
    setBoard(boardHistory[0]);
    setCurrentNode(null);
    setIsWhiteToMove(true);
  };

  const goToEnd = () => {
    const lastIndex = boardHistory.length - 1;
    setCurrentBoardIndex(lastIndex);
    setBoard(boardHistory[lastIndex]);
    if (lastIndex > 0) {
      setCurrentNode(moveHistory[lastIndex - 1]);
      setIsWhiteToMove(moveHistory[lastIndex - 1] ? !moveHistory[lastIndex - 1].isWhiteMove : true);
    }
  };

  const goToMove = (moveIndex) => {
    if (moveIndex >= 0 && moveIndex < boardHistory.length) {
      setCurrentBoardIndex(moveIndex);
      setBoard(boardHistory[moveIndex]);
      
      if (moveIndex === 0) {
        setCurrentNode(null);
        setIsWhiteToMove(true);
      } else {
        setCurrentNode(moveHistory[moveIndex - 1]);
        setIsWhiteToMove(moveHistory[moveIndex - 1] ? !moveHistory[moveIndex - 1].isWhiteMove : true);
      }
    }
  };


  // Function to render move with variations
  const renderMoveWithVariations = (move, index) => {
    const hasVariations = move.variations && move.variations.length > 0;
    
    return (
      <div key={index} className="inline-block">
        <span
                  onClick={() => {
                    console.log('Selecting move for variation:', move.toString());
                    goToMove(index + 1);
                    setSelectedMoveForVariation(move);
                  }}
          className={`inline-block m-1 p-1 rounded cursor-pointer transition-colors ${
            currentBoardIndex === index + 1
              ? 'bg-green-200 text-green-800 ring-2 ring-green-400'
              : selectedMoveForVariation === move 
                ? 'bg-purple-200 text-purple-800' 
                : 'bg-gray-200 hover:bg-gray-300'
          }`}
        >
          {move.toString()}
          {hasVariations && (
            <span className="ml-1 text-xs text-purple-600">
              ({move.variations.length} var{move.variations.length > 1 ? 's' : ''})
            </span>
          )}
        </span>
        
        {/* Render variations inline */}
        {hasVariations && (
          <div className="ml-4 mt-1">
            {move.variations.map((variation, varIndex) => (
              <span
                key={varIndex}
                onClick={() => {
                  // Navigate to variation start
                  goToMove(index + 1);
                  setSelectedMoveForVariation(variation);
                }}
                className="inline-block m-1 p-1 rounded cursor-pointer text-xs bg-purple-100 text-purple-800 hover:bg-purple-200 transition-colors"
              >
                {variation.move}
              </span>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold text-center mb-6 text-gray-800">
        Chess Board with Move Annotation System
      </h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Chess Board */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">
            Chess Board ({isWhiteToMove ? 'White' : 'Black'} to move)
          </h2>
          
          <div className="inline-block border-4 border-gray-800 rounded">
            {board.map((row, rowIndex) => (
              <div key={rowIndex} className="flex">
                {row.map((piece, colIndex) => {
                  const isLight = (rowIndex + colIndex) % 2 === 0;
                  const isSelected = selectedSquare && 
                    selectedSquare[0] === rowIndex && 
                    selectedSquare[1] === colIndex;
                  
                  return (
                    <div
                      key={`${rowIndex}-${colIndex}`}
                      className={`w-16 h-16 flex items-center justify-center cursor-pointer text-4xl font-bold border ${
                        isLight ? 'bg-amber-100' : 'bg-amber-800'
                      } ${isSelected ? 'ring-4 ring-blue-500' : ''} hover:opacity-80`}
                      onClick={() => handleSquareClick(rowIndex, colIndex)}
                    >
                      {piece && pieces[piece]}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
          
          
          <div className="mt-4 flex gap-2 flex-wrap">
            <button 
              onClick={resetGame}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
            >
              Reset Game
            </button>
            <button 
              onClick={loadDemoGame}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Load Demo Game
            </button>
          </div>

          {/* Navigation Controls */}
          <div className="mt-4 p-4 bg-gray-100 rounded-lg">
            <h3 className="font-semibold text-gray-700 mb-3">Game Navigation</h3>
            
            <div className="flex gap-2 mb-3">
              <button 
                onClick={goToStart}
                disabled={currentBoardIndex === 0}
                className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm"
              >
                ⏮ Start
              </button>
              <button 
                onClick={goBack}
                disabled={currentBoardIndex === 0}
                className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm"
              >
                ◀ Back
              </button>
              <button 
                onClick={goForward}
                disabled={currentBoardIndex >= boardHistory.length - 1}
                className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm"
              >
                Forward ▶
              </button>
              <button 
                onClick={goToEnd}
                disabled={currentBoardIndex >= boardHistory.length - 1}
                className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm"
              >
                End ⏭
              </button>
            </div>
            
            <div className="text-sm text-gray-600">
              Position: {currentBoardIndex} / {boardHistory.length - 1}
              {currentNode && (
                <span className="ml-2 font-mono bg-white px-2 py-1 rounded">
                  Current: {currentNode.toString()}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Move Annotation Panel */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">Move Annotation</h2>
          
          {/* Add annotations to last move */}
          {moveHistory.length > 0 && (
            <div className="mb-4 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-2">
                Annotate Last Move: {moveHistory[moveHistory.length - 1].move}
              </h3>
              
              <div className="space-y-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Comment:</label>
                  <input
                    type="text"
                    value={moveComment}
                    onChange={(e) => setMoveComment(e.target.value)}
                    placeholder="Add a comment about this move..."
                    className="w-full p-2 border border-gray-300 rounded text-sm"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Annotation:</label>
                  <select
                    value={moveSymbol}
                    onChange={(e) => setMoveSymbol(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded text-sm"
                  >
                    <option value="">No annotation</option>
                    <option value="!">! (Good move)</option>
                    <option value="!!">!! (Brilliant move)</option>
                    <option value="?">? (Questionable move)</option>
                    <option value="??">?? (Blunder)</option>
                    <option value="!?">!? (Interesting move)</option>
                    <option value="?!">?! (Dubious move)</option>
                  </select>
                </div>
                
                <div className="flex gap-2">
                  <button 
                    onClick={() => {
                      const lastMove = moveHistory[moveHistory.length - 1];
                      lastMove.comment = moveComment;
                      lastMove.annotation = moveSymbol;
                      setGameNotation(moveAnnotation.toPGN());
                      setMoveComment('');
                      setMoveSymbol('');
                    }}
                    className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors text-sm"
                  >
                    Update Annotation
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Create variations */}
          {selectedMoveForVariation && (
            <div className="mb-4 p-4 bg-purple-50 rounded-lg">
              <h3 className="font-semibold text-purple-800 mb-2">
                Create Variation after: {selectedMoveForVariation.toString()}
              </h3>
              <p className="text-sm text-purple-600 mb-2">
                <strong>Instructions:</strong> Click on any piece on the board, then click on a destination square to create an alternative move from this position.
              </p>
              <p className="text-xs text-purple-500 mb-3">
                The variation will be added as an alternative line and shown in the move history.
              </p>
              <button 
                onClick={() => setSelectedMoveForVariation(null)}
                className="px-3 py-1 bg-gray-400 text-white rounded hover:bg-gray-500 transition-colors text-sm"
              >
                Cancel Variation
              </button>
            </div>
          )}

          {/* Move History with Navigation */}
          <div className="mb-4">
            <h3 className="font-semibold text-gray-700 mb-2">Move History (Click to navigate):</h3>
            <div className="max-h-32 overflow-y-auto bg-gray-50 p-2 rounded text-sm">
              <span
                onClick={() => goToMove(0)}
                className={`inline-block m-1 p-1 rounded cursor-pointer transition-colors ${
                  currentBoardIndex === 0
                    ? 'bg-green-200 text-green-800 ring-2 ring-green-400'
                    : 'bg-gray-200 hover:bg-gray-300'
                }`}
              >
                Start
              </span>
              {moveHistory.map((move, index) => renderMoveWithVariations(move, index))}
            </div>
            {selectedMoveForVariation && (
              <p className="text-sm text-purple-600 mt-1">
                Selected for variation: {selectedMoveForVariation.toString()}
              </p>
            )}
          </div>

          {/* Game Notation Display */}
          <div>
            <h3 className="font-semibold text-gray-700 mb-2">Game Notation (PGN-like):</h3>
            <div className="bg-gray-100 p-4 rounded text-sm font-mono max-h-96 overflow-y-auto leading-relaxed">
              {gameNotation || 'No moves recorded yet. Make some moves and add them to see the notation!'}
            </div>
          </div>
        </div>
      </div>
      
        <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">Instructions:</h2>
          <div className="space-y-2 text-sm text-gray-600">
            <p><strong>1.</strong> Click on a piece to select it, then click on a destination square to move</p>
            <p><strong>2.</strong> Use the navigation controls (⏮ ◀ ▶ ⏭) to move back and forward through the game</p>
            <p><strong>3.</strong> Click on any move in the history to jump directly to that position</p>
            <p><strong>4.</strong> After making a move, add comments and annotations in the right panel</p>
            <p><strong>5.</strong> Click on any move in the history to select it for creating variations</p>
            <p><strong>6.</strong> When a move is selected (purple), make another move to create a variation</p>
            <p><strong>7.</strong> Try the "Load Demo Game" button to see the annotation system with complex variations!</p>
          </div>
        </div>
    </div>
  );
};

export default InteractiveChessBoard;
