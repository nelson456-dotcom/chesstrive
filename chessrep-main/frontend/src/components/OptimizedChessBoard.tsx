import React, { memo, useMemo, useCallback, useState, useReducer } from 'react';
import { Chess } from 'chess.js';
import './OptimizedChessBoard.css';

interface Piece {
  type: string;
  color: 'w' | 'b';
  square: string;
}

interface OptimizedChessBoardProps {
  fen: string;
  onSquareClick: (from: string, to: string, piece?: string) => void;
  selectedSquare?: string | null;
  lastMove?: { from: string; to: string } | null;
  width?: number;
  height?: number;
  onMove?: (from: string, to: string, promotion?: string) => boolean;
}

// Memoized individual square component
const Square = memo(({ 
  square, 
  piece, 
  isSelected, 
  isLastMove, 
  isLight, 
  isPieceSelected,
  onSquareClick 
}: {
  square: string;
  piece: Piece | null;
  isSelected: boolean;
  isLastMove: boolean;
  isLight: boolean;
  isPieceSelected: boolean;
  onSquareClick: (square: string) => void;
}) => {
  const handleClick = useCallback(() => {
    onSquareClick(square);
  }, [square, onSquareClick]);

  const squareClassName = useMemo(() => {
    let className = 'optimized-square';
    if (isSelected) className += ' selected';
    if (isLastMove) className += ' last-move';
    if (isPieceSelected) className += ' piece-selected';
    return className;
  }, [isSelected, isLastMove, isPieceSelected]);

  const squareStyle = useMemo(() => ({
    backgroundColor: isLight ? '#f0d9b5' : '#b58863',
  }), [isLight]);

  const pieceSymbol = useMemo(() => {
    if (!piece) return '';
    const symbols = {
      'w': { 'k': '♔', 'q': '♕', 'r': '♖', 'b': '♗', 'n': '♘', 'p': '♙' },
      'b': { 'k': '♚', 'q': '♛', 'r': '♜', 'b': '♝', 'n': '♞', 'p': '♟' }
    };
    return symbols[piece.color][piece.type as keyof typeof symbols['w']] || '?';
  }, [piece]);

  return (
    <div
      className={squareClassName}
      style={squareStyle}
      onClick={handleClick}
    >
      {pieceSymbol && (
        <span className={`optimized-piece ${piece.color === 'w' ? 'white' : 'black'}`}>
          {pieceSymbol}
        </span>
      )}
    </div>
  );
});

// Board state reducer for optimized state management
interface BoardState {
  pieces: Map<string, Piece>;
  moveHistory: string[];
}

type BoardAction = 
  | { type: 'SET_POSITION'; fen: string }
  | { type: 'MOVE_PIECE'; from: string; to: string; piece: Piece }
  | { type: 'CLEAR_SELECTION' };

const boardReducer = (state: BoardState, action: BoardAction): BoardState => {
  switch (action.type) {
    case 'SET_POSITION': {
      const chess = new Chess(action.fen);
      const pieces = new Map<string, Piece>();
      
      for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
          const piece = chess.board()[row][col];
          if (piece) {
            const square = String.fromCharCode(97 + col) + (8 - row);
            pieces.set(square, {
              type: piece.type,
              color: piece.color,
              square
            });
          }
        }
      }
      
      return { pieces, moveHistory: [] };
    }
    
    case 'MOVE_PIECE': {
      const newPieces = new Map(state.pieces);
      newPieces.delete(action.from);
      newPieces.set(action.to, action.piece);
      return { 
        ...state, 
        pieces: newPieces,
        moveHistory: [...state.moveHistory, `${action.from}-${action.to}`]
      };
    }
    
    case 'CLEAR_SELECTION':
      return state;
      
    default:
      return state;
  }
};

// Main optimized chess board component
const OptimizedChessBoard: React.FC<OptimizedChessBoardProps> = memo(({
  fen,
  onSquareClick,
  selectedSquare = null,
  lastMove = null,
  width = 600,
  height = 600,
  onMove
}) => {
  const [boardState, dispatch] = useReducer(boardReducer, { pieces: new Map(), moveHistory: [] });
  const [pendingMove, setPendingMove] = useState<{ from: string; to: string } | null>(null);
  const [selectedPiece, setSelectedPiece] = useState<string | null>(null);

  // Update board state when FEN changes
  React.useEffect(() => {
    dispatch({ type: 'SET_POSITION', fen });
    setSelectedPiece(null); // Clear selection when position changes
  }, [fen]);

  // Handle square click for move making
  const handleSquareClick = useCallback((square: string) => {
    const piece = boardState.pieces.get(square);
    const isWhiteTurn = fen.split(' ')[1] === 'w';
    
    if (selectedPiece) {
      // Second click - trying to move
      if (selectedPiece === square) {
        // Clicked same square - deselect
        setSelectedPiece(null);
        return;
      }
      
      // Check if it's a valid move
      if (onMove) {
        const moveSuccess = onMove(selectedPiece, square);
        if (moveSuccess) {
          setSelectedPiece(null);
          return;
        }
      }
      
      // If move failed or no onMove handler, select new piece if it's the right color
      if (piece && piece.color === (isWhiteTurn ? 'w' : 'b')) {
        setSelectedPiece(square);
      } else {
        setSelectedPiece(null);
      }
    } else {
      // First click - select piece
      if (piece && piece.color === (isWhiteTurn ? 'w' : 'b')) {
        setSelectedPiece(square);
      }
    }
  }, [selectedPiece, boardState.pieces, fen, onMove]);

  // Memoized squares calculation
  const squares = useMemo(() => {
    const squaresArray = [];
    
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const square = String.fromCharCode(97 + col) + (8 - row);
        const piece = boardState.pieces.get(square) || null;
        const isLight = (row + col) % 2 === 0;
        const isSelected = selectedSquare === square;
        const isLastMove = lastMove && (lastMove.from === square || lastMove.to === square);
        
        squaresArray.push({
          square,
          piece,
          isSelected,
          isLastMove,
          isLight,
          row,
          col
        });
      }
    }
    
    return squaresArray;
  }, [boardState.pieces, selectedSquare, lastMove]);


  // Memoized board container style
  const boardStyle = useMemo(() => ({
    width: `${width}px`,
    height: `${height}px`,
    border: '2px solid #374151',
    borderRadius: '8px',
    overflow: 'hidden',
  }), [width, height]);

  return (
    <div className="optimized-chess-board" style={boardStyle}>
      {squares.map(({ square, piece, isSelected, isLastMove, isLight, row, col }) => (
        <Square
          key={square}
          square={square}
          piece={piece}
          isSelected={isSelected}
          isLastMove={isLastMove}
          isLight={isLight}
          isPieceSelected={selectedPiece === square}
          onSquareClick={handleSquareClick}
        />
      ))}
      
      {/* Coordinate labels */}
      <div className="optimized-coordinates">
        {/* File labels (a-h) */}
        {Array.from({ length: 8 }, (_, i) => (
          <div
            key={`file-${i}`}
            className="optimized-file-label"
            style={{
              left: `${(i + 0.5) * 12.5}%`,
            }}
          >
            {String.fromCharCode(97 + i)}
          </div>
        ))}
        
        {/* Rank labels (1-8) */}
        {Array.from({ length: 8 }, (_, i) => (
          <div
            key={`rank-${i}`}
            className="optimized-rank-label"
            style={{
              top: `${(i + 0.5) * 12.5}%`,
            }}
          >
            {8 - i}
          </div>
        ))}
      </div>
    </div>
  );
});

OptimizedChessBoard.displayName = 'OptimizedChessBoard';

export default OptimizedChessBoard;
