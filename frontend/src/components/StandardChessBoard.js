import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';

const StandardChessBoard = ({
  fen,
  position, // Accept both fen and position props for compatibility
  onMove, // Callback for when a move is successfully made (move, newFen)
  onPieceDrop, // Support both onMove and onPieceDrop for compatibility
  onSquareClick, // Callback for square clicks
  orientation = 'white',
  showCoordinates = true,
  showArrows = true,
  highlightLastMove = true,
  allowUserMoves = true,
  customArrows = [],
  selectedSquare = null,
  onSquareSelect = null, // New prop for external square selection handling
  className = '', // For additional styling from parent
  style = {}, // Custom style for the board container
  boardSize = 600, // Add boardSize prop with default
  ...props // Catch any other props
}) => {
  // Use fen prop if provided, otherwise use position prop, otherwise default
  const actualFen = fen || position || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
  
  const gameRef = useRef(new Chess(actualFen)); // Internal Chess.js instance for move validation
  const [currentFen, setCurrentFen] = useState(actualFen);
  const [currentSelectedSquare, setCurrentSelectedSquare] = useState(selectedSquare);
  const [localCustomArrows, setLocalCustomArrows] = useState(customArrows);

  // Measure container to fit board to parent width when boardSize not explicitly provided
  const containerRef = useRef(null);
  const [measuredWidth, setMeasuredWidth] = useState(null);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;
    // Initialize immediately
    const initial = Math.floor(node.clientWidth || node.getBoundingClientRect().width || 0);
    if (initial) setMeasuredWidth(initial);
    const ro = new ResizeObserver(entries => {
      for (const entry of entries) {
        const width = Math.floor(entry.contentRect?.width || node.clientWidth || 0);
        if (width && width !== measuredWidth) {
          setMeasuredWidth(width);
        }
      }
    });
    ro.observe(node);
    return () => ro.disconnect();
  }, [measuredWidth]);

  const resolvedBoardWidth = useMemo(() => {
    // If explicit boardSize provided by parent, use it; otherwise fit to container
    return boardSize || measuredWidth || 0;
  }, [boardSize, measuredWidth]);

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
      captureSoundRef.current = null;
    }
    
    try {
      castleSoundRef.current = new Audio('/sounds/castle.mp3');
      castleSoundRef.current.load();
    } catch (error) {
      console.warn('Could not load castle sound:', error);
      castleSoundRef.current = null;
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

  useEffect(() => {
    const newFen = fen || position;
    if (newFen && typeof newFen === 'string' && newFen !== currentFen) {
      try {
        // Validate FEN before updating
        const testGame = new Chess(newFen);
        if (testGame.fen() === newFen) {
          setCurrentFen(newFen);
          gameRef.current.load(newFen);
        }
      } catch (e) {
        console.error("Failed to load FEN in StandardChessBoard:", newFen, e);
        // Don't update if FEN is invalid
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
      const tempGame = new Chess(gameRef.current.fen()); // Use a temporary game for validation
      
      // Check if it's the correct player's turn
      const piece = tempGame.get(sourceSquare);
      if (!piece || piece.color !== tempGame.turn()) {
        console.log("Not the correct player's turn");
        return false;
      }
      
      const move = tempGame.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: 'q' // Assume queen promotion for simplicity, actual dialog handled by react-chessboard
      });

      if (move) {
        gameRef.current.move({ from: sourceSquare, to: targetSquare, promotion: 'q' }); // Update internal game
        setCurrentFen(gameRef.current.fen()); // Update local FEN state
        playMoveSound(move);
        
        // Call the appropriate callback
        if (onPieceDrop) {
          return onPieceDrop(sourceSquare, targetSquare);
        } else if (onMove) {
          onMove(move, gameRef.current.fen());
        }
        return true;
      }
    } catch (e) {
      console.error("Illegal move in StandardChessBoard:", e);
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
      // Default click behavior if no external handler is provided
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
          transition: 'background-color 0.1s ease' // Faster transition
        };
        styles[lastMove.to] = { 
          backgroundColor: 'rgba(255, 255, 0, 0.4)',
          transition: 'background-color 0.1s ease' // Faster transition
        };
      }
    }
    if (currentSelectedSquare) {
      styles[currentSelectedSquare] = {
        backgroundColor: 'rgba(59, 130, 246, 0.4)',
        transition: 'background-color 0.1s ease' // Faster transition
      };
    }
    return { ...styles, ...props.customSquares }; // Merge with any custom squares passed via props
  }, [highlightLastMove, currentSelectedSquare, props.customSquares]);

  return (
    <div 
      ref={containerRef}
      className={`relative mx-auto smooth-board ${className}`} 
      style={{ 
        ...style, 
        width: '100%',
        aspectRatio: '1', 
        backgroundColor: '#f0d9b5',
        pointerEvents: 'auto'
      }}
    >
      <Chessboard
        position={currentFen}
        onPieceDrop={handlePieceDrop}
        onSquareClick={handleSquareClick}
        boardOrientation={orientation}
        boardWidth={resolvedBoardWidth}
        customBoardStyle={{
          borderRadius: '12px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
          backgroundColor: '#f0d9b5', // Prevent white flashing
          // Mobile touch optimizations - CRITICAL for drag-and-drop
          touchAction: 'manipulation', // Better mobile touch handling - allows dragging but prevents double-tap zoom
          pointerEvents: 'auto', // Ensure touch events are captured
          userSelect: 'none', // Prevent text selection on mobile
          WebkitUserSelect: 'none',
          MozUserSelect: 'none',
          msUserSelect: 'none',
          WebkitTouchCallout: 'none', // Disable iOS callout
          WebkitTapHighlightColor: 'transparent', // Remove tap highlight
          WebkitUserDrag: 'none', // Prevent drag ghosts
          cursor: 'pointer', // Ensure cursor shows interaction
          // Ensure proper positioning for drag and drop
          position: 'relative',
          zIndex: 1, // Ensure board is not blocked by overlays
          transform: 'none',
          willChange: 'auto'
        }}
        customLightSquareStyle={{
          backgroundColor: '#f0d9b5'
        }}
        customDarkSquareStyle={{
          backgroundColor: '#b58863'
        }}
        customSquareStyles={customSquareStyles}
        customPieceStyle={{
          cursor: 'grab'
        }}
        animationDuration={100}
        areArrowsAllowed={showArrows}
        showBoardNotation={showCoordinates}
        showPromotionDialog={true}
        customDropSquareStyle={{
          boxShadow: 'inset 0 0 1px 6px rgba(34, 197, 94, 0.75)',
          transition: 'box-shadow 0.1s ease' // Faster transition
        }}
        customPremoveDarkSquareStyle={{ backgroundColor: 'rgba(255, 255, 0, 0.4)' }}
        customPremoveLightSquareStyle={{ backgroundColor: 'rgba(255, 255, 0, 0.4)' }}
        customArrows={localCustomArrows}
        {...props} // Pass any other props to react-chessboard
      />
    </div>
  );
};

export default React.memo(StandardChessBoard);

