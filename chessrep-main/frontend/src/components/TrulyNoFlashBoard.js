import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Chess } from 'chess.js';

const TrulyNoFlashBoard = ({
  fen,
  position,
  onMove,
  onPieceDrop,
  onSquareClick,
  orientation = 'white',
  showCoordinates = true,
  showArrows = true,
  highlightLastMove = true,
  allowUserMoves = true,
  customArrows = [],
  selectedSquare = null,
  onSquareSelect = null,
  className = '',
  style = {},
  boardSize = 600,
  ...props
}) => {
  const actualFen = fen || position || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
  
  const gameRef = useRef(new Chess(actualFen));
  const [currentFen, setCurrentFen] = useState(actualFen);
  const [currentSelectedSquare, setCurrentSelectedSquare] = useState(selectedSquare);
  const [localCustomArrows, setLocalCustomArrows] = useState(customArrows);

  // Audio refs for sounds
  const moveSoundRef = useRef(null);
  const captureSoundRef = useRef(null);
  const castleSoundRef = useRef(null);

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
      moveSoundRef.current = null;
    }
    
    try {
      castleSoundRef.current = new Audio('/sounds/castle.mp3');
      castleSoundRef.current.load();
    } catch (error) {
      console.warn('Could not load castle sound:', error);
      moveSoundRef.current = null;
    }
  }, []);

  const playMoveSound = useCallback((move) => {
    if (move.captured) {
      captureSoundRef.current?.play().catch(e => console.log("Capture sound play failed:", e));
    } else if (move.san.includes('O-O')) {
      castleSoundRef.current?.play().catch(e => console.log("Castle sound play failed:", e));
    } else {
      moveSoundRef.current?.play().catch(e => console.log("Move sound play failed:", e));
    }
  }, []);

  // Update FEN when prop changes
  useEffect(() => {
    const newFen = fen || position;
    if (newFen && typeof newFen === 'string' && newFen !== currentFen) {
      try {
        const testGame = new Chess(newFen);
        if (testGame.fen() === newFen) {
          setCurrentFen(newFen);
          gameRef.current.load(newFen);
        }
      } catch (e) {
        console.error("Failed to load FEN in TrulyNoFlashBoard:", newFen, e);
      }
    }
  }, [fen, position, currentFen]);

  useEffect(() => {
    setCurrentSelectedSquare(selectedSquare);
  }, [selectedSquare]);

  useEffect(() => {
    setLocalCustomArrows(customArrows);
  }, [customArrows]);

  const handlePieceDrop = useCallback((sourceSquare, targetSquare) => {
    if (!allowUserMoves) return false;

    try {
      const tempGame = new Chess(gameRef.current.fen());
      
      const piece = tempGame.get(sourceSquare);
      if (!piece || piece.color !== tempGame.turn()) {
        console.log("Not the correct player's turn");
        return false;
      }
      
      const move = tempGame.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: 'q'
      });

      if (move) {
        gameRef.current.move({ from: sourceSquare, to: targetSquare, promotion: 'q' });
        setCurrentFen(gameRef.current.fen());
        playMoveSound(move);
        
        if (onPieceDrop) {
          return onPieceDrop(sourceSquare, targetSquare);
        } else if (onMove) {
          onMove(move, gameRef.current.fen());
        }
        return true;
      }
    } catch (e) {
      console.error("Illegal move in TrulyNoFlashBoard:", e);
    }
    return false;
  }, [allowUserMoves, onMove, onPieceDrop, playMoveSound]);

  const handleSquareClick = useCallback((square) => {
    if (!allowUserMoves) return;

    if (onSquareClick) {
      onSquareClick(square);
    } else if (onSquareSelect) {
      onSquareSelect(square);
    } else {
      if (currentSelectedSquare) {
        const success = handlePieceDrop(currentSelectedSquare, square);
        if (success) {
          setCurrentSelectedSquare(null);
        } else {
          const piece = gameRef.current.get(square);
          if (piece && piece.color === gameRef.current.turn()) {
            setCurrentSelectedSquare(square);
          } else {
            setCurrentSelectedSquare(null);
          }
        }
      } else {
        const piece = gameRef.current.get(square);
        if (piece && piece.color === gameRef.current.turn()) {
          setCurrentSelectedSquare(square);
        }
      }
    }
  }, [allowUserMoves, onSquareClick, onSquareSelect, currentSelectedSquare, handlePieceDrop]);

  const customSquareStyles = useMemo(() => {
    const styles = {};
    if (highlightLastMove) {
      const history = gameRef.current.history({ verbose: true });
      if (history.length > 0) {
        const lastMove = history[history.length - 1];
        styles[lastMove.from] = { 
          backgroundColor: 'rgba(255, 255, 0, 0.4)',
          transition: 'background-color 0.1s ease'
        };
        styles[lastMove.to] = { 
          backgroundColor: 'rgba(255, 255, 0, 0.4)',
          transition: 'background-color 0.1s ease'
        };
      }
    }
    if (currentSelectedSquare) {
      styles[currentSelectedSquare] = {
        backgroundColor: 'rgba(59, 130, 246, 0.4)',
        transition: 'background-color 0.1s ease'
      };
    }
    return { ...styles, ...props.customSquares };
  }, [highlightLastMove, currentSelectedSquare, props.customSquares]);

  // Parse FEN to get board state
  const boardState = useMemo(() => {
    try {
      const tempGame = new Chess(currentFen);
      return tempGame.board();
    } catch (e) {
      console.error('Error parsing FEN:', currentFen, e);
      return [];
    }
  }, [currentFen]);

  // Get piece symbol for display
  const getPieceSymbol = (piece) => {
    if (!piece) return '';
    const symbols = {
      'wK': '♔', 'wQ': '♕', 'wR': '♖', 'wB': '♗', 'wN': '♘', 'wP': '♙',
      'bK': '♚', 'bQ': '♛', 'bR': '♜', 'bB': '♝', 'bN': '♞', 'bP': '♟'
    };
    return symbols[piece.color + piece.type.toUpperCase()] || '';
  };

  // Get square name from row/col
  const getSquareName = (row, col) => {
    const file = String.fromCharCode(97 + col);
    const rank = 8 - row;
    return file + rank;
  };

  return (
    <div 
      className={`relative mx-auto smooth-board ${className}`} 
      style={{ 
        ...style, 
        aspectRatio: '1',
        backgroundColor: '#f0d9b5',
        background: '#f0d9b5',
        minHeight: boardSize,
        minWidth: boardSize,
        contain: 'layout style paint',
        isolation: 'isolate'
      }}
    >
      <div 
        style={{
          width: boardSize,
          height: boardSize,
          backgroundColor: '#f0d9b5',
          background: '#f0d9b5',
          position: 'relative',
          borderRadius: '12px',
          overflow: 'hidden',
          contain: 'layout style paint',
          isolation: 'isolate',
          display: 'grid',
          gridTemplateColumns: 'repeat(8, 1fr)',
          gridTemplateRows: 'repeat(8, 1fr)'
        }}
      >
        {/* Render squares with pieces */}
        {Array.from({ length: 64 }, (_, i) => {
          const row = Math.floor(i / 8);
          const col = i % 8;
          const isLight = (row + col) % 2 === 0;
          const squareName = getSquareName(row, col);
          const piece = boardState[row] && boardState[row][col];
          const pieceSymbol = getPieceSymbol(piece);
          
          // Apply custom square styles
          const customStyle = customSquareStyles[squareName] || {};
          
          return (
            <div
              key={squareName}
              style={{
                backgroundColor: isLight ? '#f0d9b5' : '#b58863',
                background: isLight ? '#f0d9b5' : '#b58863',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                contain: 'layout style paint',
                transition: 'background-color 0.1s ease',
                cursor: allowUserMoves ? 'pointer' : 'default',
                ...customStyle
              }}
              onClick={() => handleSquareClick(squareName)}
            >
              {/* Piece */}
              {pieceSymbol && (
                <div
                  style={{
                    fontSize: `${boardSize / 8 * 0.6}px`,
                    lineHeight: 1,
                    userSelect: 'none',
                    pointerEvents: 'none',
                    textShadow: '1px 1px 2px rgba(0,0,0,0.3)',
                    transition: 'transform 0.1s ease'
                  }}
                >
                  {pieceSymbol}
                </div>
              )}
              
              {/* Square coordinates */}
              {showCoordinates && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: '2px',
                    right: '2px',
                    fontSize: '10px',
                    color: isLight ? '#8b4513' : '#f0d9b5',
                    fontWeight: 'bold',
                    pointerEvents: 'none'
                  }}
                >
                  {squareName}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default React.memo(TrulyNoFlashBoard);
