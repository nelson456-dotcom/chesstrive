import React, { useEffect, useRef, useCallback, useMemo } from 'react';
import { Chess } from 'chess.js';
import { Chessground } from 'chessground';
import 'chessground/assets/chessground.base.css';
import 'chessground/assets/chessground.brown.css';
import 'chessground/assets/chessground.cburnett.css';

const OptimizedChessgroundBoard = ({
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
  const actualFen = fen || position || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
  const boardRef = useRef(null);
  const cgRef = useRef(null);
  const gameRef = useRef(new Chess(actualFen));
  const lastFenRef = useRef(actualFen);
  const isUpdatingRef = useRef(false);

  // Memoize valid moves to prevent recalculation on every render
  const validMoves = useMemo(() => {
    if (!allowUserMoves) return new Map();
    
    try {
      const moves = gameRef.current.moves({ verbose: true });
      const dests = new Map();
      
      moves.forEach(move => {
        if (move && move.from && move.to && typeof move.from === 'string' && typeof move.to === 'string') {
          if (!dests.has(move.from)) {
            dests.set(move.from, []);
          }
          dests.get(move.from).push(move.to);
        }
      });
      
      return dests;
    } catch (error) {
      console.error('Error calculating valid moves:', error);
      return new Map();
    }
  }, [actualFen, allowUserMoves]);

  // Memoize current turn
  const currentTurn = useMemo(() => {
    return gameRef.current.turn() === 'w' ? 'white' : 'black';
  }, [actualFen]);

  // Audio refs for sounds
  const moveSoundRef = useRef(null);
  const captureSoundRef = useRef(null);
  const castleSoundRef = useRef(null);

  // Load sounds only once
  useEffect(() => {
    if (!moveSoundRef.current) {
      try {
        moveSoundRef.current = new Audio('/sounds/move-self.mp3');
        moveSoundRef.current.load();
      } catch (error) {
        console.warn('Could not load move sound:', error);
      }
    }
    
    if (!captureSoundRef.current) {
      try {
        captureSoundRef.current = new Audio('/sounds/capture.mp3');
        captureSoundRef.current.load();
      } catch (error) {
        console.warn('Could not load capture sound:', error);
      }
    }
    
    if (!castleSoundRef.current) {
      try {
        castleSoundRef.current = new Audio('/sounds/castle.mp3');
        castleSoundRef.current.load();
      } catch (error) {
        console.warn('Could not load castle sound:', error);
      }
    }
  }, []);

  const playMoveSound = useCallback((move) => {
    if (move.captured && captureSoundRef.current) {
      captureSoundRef.current.play().catch(() => {});
    } else if (move.san.includes('O-O') && castleSoundRef.current) {
      castleSoundRef.current.play().catch(() => {});
    } else if (moveSoundRef.current) {
      moveSoundRef.current.play().catch(() => {});
    }
  }, []);

  // Optimized move handler
  const handleMove = useCallback((orig, dest, capturedPiece) => {
    if (!allowUserMoves || isUpdatingRef.current) return false;
    
    // Validate input parameters
    if (!orig || !dest || typeof orig !== 'string' || typeof dest !== 'string') {
      console.error('Invalid move parameters:', { orig, dest });
      return false;
    }

    try {
      const move = gameRef.current.move({
        from: orig,
        to: dest,
        promotion: 'q'
      });

      if (move) {
        isUpdatingRef.current = true;
        playMoveSound(move);
        
        if (onPieceDrop) {
          const result = onPieceDrop(orig, dest);
          isUpdatingRef.current = false;
          return result;
        } else if (onMove) {
          onMove(move, gameRef.current.fen());
        }
        isUpdatingRef.current = false;
        return true;
      }
    } catch (e) {
      console.error("Illegal move in OptimizedChessgroundBoard:", e);
      isUpdatingRef.current = false;
    }
    return false;
  }, [allowUserMoves, onMove, onPieceDrop, playMoveSound]);

  // Optimized square selection handler
  const handleSquareSelect = useCallback((key) => {
    if (!allowUserMoves) return;
    
    // Validate key parameter
    if (!key || typeof key !== 'string') {
      console.error('Invalid square key:', key);
      return;
    }

    if (onSquareClick) {
      onSquareClick(key);
    } else if (onSquareSelect) {
      onSquareSelect(key);
    }
  }, [allowUserMoves, onSquareClick, onSquareSelect]);

  // Initialize Chessground only once
  useEffect(() => {
    if (boardRef.current && !cgRef.current) {
      try {
        // Validate FEN before initialization
        const testGame = new Chess(actualFen);
        const validFen = testGame.fen();
        
        cgRef.current = Chessground(boardRef.current, {
          fen: validFen,
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
            duration: 150 // Reduced from 200ms for better responsiveness
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
          // Performance optimizations
          addPieceZIndex: true,
          highlight: {
            lastMove: highlightLastMove,
            check: true
          }
        });
      } catch (error) {
        console.error('Failed to initialize Chessground:', error);
        // Fallback to default position
        try {
          cgRef.current = Chessground(boardRef.current, {
            fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
            orientation: orientation,
            coordinates: showCoordinates,
            viewOnly: !allowUserMoves,
            width: boardSize,
            height: boardSize
          });
        } catch (fallbackError) {
          console.error('Failed to initialize Chessground fallback:', fallbackError);
        }
      }
    }
  }, []); // Empty dependency array - only initialize once

  // Optimized FEN update - only update when FEN actually changes
  useEffect(() => {
    const newFen = fen || position;
    if (newFen && typeof newFen === 'string' && newFen !== lastFenRef.current && cgRef.current) {
      try {
        const testGame = new Chess(newFen);
        const validFen = testGame.fen();
        
        if (validFen === newFen) {
          lastFenRef.current = newFen;
          gameRef.current.load(newFen);
          
          // Recalculate valid moves for the new position
          const moves = testGame.moves({ verbose: true });
          const dests = new Map();
          
          moves.forEach(move => {
            if (move && move.from && move.to && typeof move.from === 'string' && typeof move.to === 'string') {
              if (!dests.has(move.from)) {
                dests.set(move.from, []);
              }
              dests.get(move.from).push(move.to);
            }
          });
          
          // Batch update to prevent multiple re-renders
          cgRef.current.set({
            fen: validFen,
            movable: {
              free: false,
              color: allowUserMoves ? (testGame.turn() === 'w' ? 'white' : 'black') : false,
              dests: allowUserMoves ? dests : new Map(),
              showDests: true
            }
          });
        }
      } catch (e) {
        console.error("Failed to load FEN in OptimizedChessgroundBoard:", newFen, e);
      }
    }
  }, [fen, position, allowUserMoves]);

  // Optimized orientation update
  useEffect(() => {
    if (cgRef.current && cgRef.current.state.orientation !== orientation) {
      cgRef.current.set({ orientation });
    }
  }, [orientation]);

  // Update selected square only when it changes
  useEffect(() => {
    if (cgRef.current && selectedSquare !== cgRef.current.state.selected?.[0]) {
      // Validate selectedSquare before setting
      if (selectedSquare && typeof selectedSquare === 'string' && selectedSquare.length === 2) {
        cgRef.current.set({ selected: [selectedSquare] });
      } else {
        cgRef.current.set({ selected: [] });
      }
    }
  }, [selectedSquare]);

  // Update custom arrows only when they change
  useEffect(() => {
    if (cgRef.current && Array.isArray(customArrows)) {
      // Validate arrows before setting
      const validArrows = customArrows.filter(arrow => 
        arrow && 
        typeof arrow === 'object' && 
        arrow.length === 2 && 
        typeof arrow[0] === 'string' && 
        typeof arrow[1] === 'string' &&
        arrow[0].length === 2 && 
        arrow[1].length === 2
      );
      
      if (validArrows.length !== cgRef.current.state.arrows?.length) {
        cgRef.current.set({ arrows: validArrows });
      }
    }
  }, [customArrows]);

  // Update custom square styles only when they change
  useEffect(() => {
    if (cgRef.current && customSquareStyles && typeof customSquareStyles === 'object') {
      // Extract last move squares from customSquareStyles for highlighting
      const lastMoveSquares = [];
      Object.keys(customSquareStyles).forEach(square => {
        if (square && typeof square === 'string' && square.length === 2) {
          lastMoveSquares.push(square);
        }
      });
      
      if (lastMoveSquares.length > 0) {
        cgRef.current.set({ 
          lastMove: lastMoveSquares,
          check: false // Disable check highlighting if we have custom styles
        });
      }
    }
  }, [customSquareStyles]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (cgRef.current) {
        cgRef.current.destroy();
        cgRef.current = null;
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
        willChange: 'transform' // Optimize for animations
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
          transform: 'translateZ(0)', // Hardware acceleration
          willChange: 'transform'
        }}
      />
    </div>
  );
};

export default React.memo(OptimizedChessgroundBoard);
