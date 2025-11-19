import React, { useEffect, useRef, useCallback, useMemo } from 'react';
import { Chess } from 'chess.js';
import { Chessground } from 'chessground';
import 'chessground/assets/chessground.base.css';
import 'chessground/assets/chessground.brown.css';
import 'chessground/assets/chessground.cburnett.css';

const SafeChessgroundBoard = ({
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
  customSquareStyles = {},
  className = '',
  style = {},
  boardSize = 600,
  ...props
}) => {
  // Validate square notation
  const isValidSquare = useCallback((square) => {
    if (!square || typeof square !== 'string' || square.length !== 2) {
      return false;
    }
    const file = square.charCodeAt(0);
    const rank = square.charCodeAt(1);
    return file >= 97 && file <= 104 && rank >= 49 && rank <= 56; // a-h, 1-8
  }, []);

  // Safe FEN with fallback
  const getSafeFen = useCallback((inputFen) => {
    if (!inputFen || typeof inputFen !== 'string') {
      return 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    }
    
    try {
      const testGame = new Chess(inputFen);
      return testGame.fen();
    } catch (error) {
      console.warn('Invalid FEN provided, using default:', inputFen);
      return 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    }
  }, []);

  const actualFen = useMemo(() => {
    const inputFen = fen || position;
    return getSafeFen(inputFen);
  }, [fen, position, getSafeFen]);

  const boardRef = useRef(null);
  const cgRef = useRef(null);
  const gameRef = useRef(null);
  const isInitializedRef = useRef(false);

  // Initialize game instance safely
  useEffect(() => {
    try {
      gameRef.current = new Chess(actualFen);
    } catch (error) {
      console.error('Failed to initialize Chess instance:', error);
      gameRef.current = new Chess();
    }
  }, [actualFen]);

  // Safe move calculation
  const getValidMoves = useCallback(() => {
    if (!gameRef.current || !allowUserMoves) {
      return new Map();
    }

    try {
      const moves = gameRef.current.moves({ verbose: true });
      const dests = new Map();
      
      if (Array.isArray(moves)) {
        moves.forEach(move => {
          if (move && 
              typeof move === 'object' && 
              move.from && 
              move.to && 
              isValidSquare(move.from) && 
              isValidSquare(move.to)) {
            
            // Ensure both from and to are valid strings before adding to Map
            const fromSquare = String(move.from);
            const toSquare = String(move.to);
            
            if (isValidSquare(fromSquare) && isValidSquare(toSquare)) {
              if (!dests.has(fromSquare)) {
                dests.set(fromSquare, []);
              }
              dests.get(fromSquare).push(toSquare);
            }
          }
        });
      }
      
      return dests;
    } catch (error) {
      console.error('Error calculating valid moves:', error);
      return new Map();
    }
  }, [actualFen, allowUserMoves, isValidSquare]);

  // Safe move handler
  const handleMove = useCallback((orig, dest, capturedPiece) => {
    if (!allowUserMoves || !gameRef.current) {
      return false;
    }

    // Ensure parameters are strings and validate them
    const origStr = String(orig);
    const destStr = String(dest);
    
    // Validate input parameters using the safe square validator
    if (!isValidSquare(origStr) || !isValidSquare(destStr)) {
      console.warn('Invalid move parameters:', { orig: origStr, dest: destStr });
      return false;
    }

    try {
      const move = gameRef.current.move({
        from: origStr,
        to: destStr,
        promotion: 'q'
      });

      if (move) {
        if (onPieceDrop) {
          return onPieceDrop(origStr, destStr);
        } else if (onMove) {
          onMove(move, gameRef.current.fen());
        }
        return true;
      }
    } catch (error) {
      console.warn("Illegal move:", error.message);
    }
    
    return false;
  }, [allowUserMoves, onMove, onPieceDrop, isValidSquare]);

  // Safe square selection handler
  const handleSquareSelect = useCallback((key) => {
    if (!allowUserMoves) return;
    
    // Ensure key is a string and validate it
    const keyStr = String(key);
    
    // Validate key parameter using the safe square validator
    if (!isValidSquare(keyStr)) {
      console.warn('Invalid square key:', keyStr);
      return;
    }

    if (onSquareClick) {
      onSquareClick(keyStr);
    } else if (onSquareSelect) {
      onSquareSelect(keyStr);
    }
  }, [allowUserMoves, onSquareClick, onSquareSelect, isValidSquare]);

  // Initialize Chessground safely
  useEffect(() => {
    if (boardRef.current && !isInitializedRef.current) {
      try {
        const validMoves = getValidMoves();
        const currentTurn = gameRef.current ? (gameRef.current.turn() === 'w' ? 'white' : 'black') : 'white';
        
        cgRef.current = Chessground(boardRef.current, {
          fen: actualFen,
          orientation: orientation,
          coordinates: showCoordinates,
          movable: {
            free: false,
            color: allowUserMoves ? currentTurn : false,
            dests: validMoves,
            showDests: true
          },
          draggable: {
            enabled: allowUserMoves,
            showGhost: true
          },
          selectable: {
            enabled: allowUserMoves
          },
          events: {
            move: handleMove,
            select: handleSquareSelect
          },
          animation: {
            enabled: true,
            duration: 150
          },
          premovable: {
            enabled: false
          },
          predroppable: {
            enabled: false
          },
          viewOnly: !allowUserMoves,
          width: boardSize,
          height: boardSize,
          addPieceZIndex: true,
          highlight: {
            lastMove: highlightLastMove,
            check: true
          }
        });
        
        isInitializedRef.current = true;
      } catch (error) {
        console.error('Failed to initialize Chessground:', error);
        // Create a minimal fallback
        try {
          cgRef.current = Chessground(boardRef.current, {
            fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
            orientation: orientation,
            coordinates: showCoordinates,
            viewOnly: true,
            width: boardSize,
            height: boardSize
          });
          isInitializedRef.current = true;
        } catch (fallbackError) {
          console.error('Failed to initialize Chessground fallback:', fallbackError);
        }
      }
    }
  }, []); // Only initialize once

  // Update FEN safely
  useEffect(() => {
    if (cgRef.current && isInitializedRef.current) {
      try {
        const newFen = getSafeFen(fen || position);
        const validMoves = getValidMoves();
        const currentTurn = gameRef.current ? (gameRef.current.turn() === 'w' ? 'white' : 'black') : 'white';
        
        cgRef.current.set({
          fen: newFen,
          movable: {
            free: false,
            color: allowUserMoves ? currentTurn : false,
            dests: validMoves,
            showDests: true
          }
        });
      } catch (error) {
        console.error('Failed to update FEN:', error);
      }
    }
  }, [actualFen, allowUserMoves, getValidMoves, getSafeFen, fen, position]);

  // Update orientation safely
  useEffect(() => {
    if (cgRef.current && isInitializedRef.current) {
      try {
        cgRef.current.set({ orientation });
      } catch (error) {
        console.error('Failed to update orientation:', error);
      }
    }
  }, [orientation]);

  // Update selected square safely
  useEffect(() => {
    if (cgRef.current && isInitializedRef.current) {
      try {
        if (isValidSquare(selectedSquare)) {
          cgRef.current.set({ selected: [selectedSquare] });
        } else {
          cgRef.current.set({ selected: [] });
        }
      } catch (error) {
        console.error('Failed to update selected square:', error);
      }
    }
  }, [selectedSquare, isValidSquare]);

  // Update custom arrows safely
  useEffect(() => {
    if (cgRef.current && isInitializedRef.current && Array.isArray(customArrows)) {
      try {
        const validArrows = customArrows.filter(arrow => {
          // Check if arrow is an array with at least 2 elements
          if (!arrow || !Array.isArray(arrow) || arrow.length < 2) {
            return false;
          }
          
          // Check if from and to squares are valid strings
          const from = arrow[0];
          const to = arrow[1];
          
          if (typeof from !== 'string' || typeof to !== 'string') {
            return false;
          }
          
          if (from.length !== 2 || to.length !== 2) {
            return false;
          }
          
          return isValidSquare(from) && isValidSquare(to);
        });
        
        // Convert to chessground arrow format if needed
        const chessgroundArrows = validArrows.map(arrow => {
          if (arrow.length === 2) {
            return { orig: arrow[0], dest: arrow[1], brush: 'blue' };
          } else if (arrow.length === 3) {
            return { orig: arrow[0], dest: arrow[1], brush: arrow[2] || 'blue' };
          }
          return { orig: arrow[0], dest: arrow[1], brush: 'blue' };
        });
        
        cgRef.current.setShapes(chessgroundArrows);
      } catch (error) {
        console.error('Failed to update arrows:', error);
      }
    }
  }, [customArrows, isValidSquare]);

  // Update custom square styles safely
  useEffect(() => {
    if (cgRef.current && isInitializedRef.current && customSquareStyles && typeof customSquareStyles === 'object') {
      try {
        const lastMoveSquares = [];
        Object.keys(customSquareStyles).forEach(square => {
          if (isValidSquare(square)) {
            lastMoveSquares.push(square);
          }
        });
        
        if (lastMoveSquares.length > 0) {
          cgRef.current.set({ 
            lastMove: lastMoveSquares,
            check: false
          });
        }
      } catch (error) {
        console.error('Failed to update custom square styles:', error);
      }
    }
  }, [customSquareStyles, isValidSquare]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (cgRef.current) {
        try {
          cgRef.current.destroy();
        } catch (error) {
          console.error('Error destroying Chessground:', error);
        }
        cgRef.current = null;
        isInitializedRef.current = false;
      }
    };
  }, []);

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
        isolation: 'isolate',
        willChange: 'transform'
      }}
    >
      <div
        ref={boardRef}
        style={{
          width: boardSize,
          height: boardSize,
          backgroundColor: '#f0d9b5',
          background: '#f0d9b5',
          borderRadius: '12px',
          overflow: 'hidden',
          contain: 'layout style paint',
          isolation: 'isolate',
          transform: 'translateZ(0)',
          willChange: 'transform'
        }}
      />
    </div>
  );
};

export default React.memo(SafeChessgroundBoard);
