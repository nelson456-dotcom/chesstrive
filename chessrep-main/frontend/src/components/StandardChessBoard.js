import React, { useState, useEffect, useCallback, useRef } from 'react';
import ProductionChessBoard from './ProductionChessBoard';
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
      setCurrentFen(newFen);
      try {
        gameRef.current.load(newFen); // Ensure internal game state matches prop
      } catch (e) {
        console.error("Failed to load FEN in StandardChessBoard:", newFen, e);
        gameRef.current = new Chess(); // Reset to default if FEN is invalid
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
      
      // Check if this is a pawn promotion
      const piece = tempGame.get(sourceSquare);
      const isPawnPromotion = piece && piece.type === 'p' && 
        ((piece.color === 'w' && targetSquare[1] === '8') || 
         (piece.color === 'b' && targetSquare[1] === '1'));
      
      let move;
      if (isPawnPromotion) {
        // For pawn promotion, default to queen
        move = tempGame.move({
          from: sourceSquare,
          to: targetSquare,
          promotion: 'q'
        });
      } else {
        move = tempGame.move({
          from: sourceSquare,
          to: targetSquare
        });
      }

      if (move) {
        gameRef.current.move({ 
          from: sourceSquare, 
          to: targetSquare, 
          promotion: isPawnPromotion ? 'q' : undefined 
        });
        const newFen = gameRef.current.fen();
        
        // Only update FEN if it actually changed
        if (newFen !== currentFen) {
          setCurrentFen(newFen);
        }
        
        playMoveSound(move);
        
        // Call the appropriate callback
        if (onPieceDrop) {
          return onPieceDrop(sourceSquare, targetSquare);
        } else if (onMove) {
          onMove(move, newFen);
        }
        return true;
      }
    } catch (e) {
      console.error("Illegal move in StandardChessBoard:", e);
    }
    return false;
  }, [allowUserMoves, onMove, onPieceDrop, playMoveSound, currentFen]);

  const handleSquareClick = useCallback((square) => {
    console.log('🔥 STANDARD CHESS BOARD - Square clicked:', square, 'allowUserMoves:', allowUserMoves);
    
    if (!allowUserMoves) {
      console.log('🔥 STANDARD CHESS BOARD - User moves not allowed');
      return;
    }

    if (onSquareClick) {
      console.log('🔥 STANDARD CHESS BOARD - Calling onSquareClick with:', square);
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

  const getCustomSquareStyles = useCallback(() => {
    const styles = {};
    if (highlightLastMove) {
      const history = gameRef.current.history({ verbose: true });
      if (history.length > 0) {
        const lastMove = history[history.length - 1];
        styles[lastMove.from] = { backgroundColor: 'rgba(255, 255, 0, 0.4)' };
        styles[lastMove.to] = { backgroundColor: 'rgba(255, 255, 0, 0.4)' };
      }
    }
    if (currentSelectedSquare) {
      styles[currentSelectedSquare] = {
        backgroundColor: 'rgba(59, 130, 246, 0.4)',
        transition: 'background-color 0.2s ease'
      };
    }
    return { ...styles, ...props.customSquares }; // Merge with any custom squares passed via props
  }, [highlightLastMove, currentSelectedSquare, props.customSquares]);

  return (
    <div className={`relative mx-auto smooth-board ${className}`} style={{ 
      ...style,
      width: '100%',
      maxWidth: `${boardSize}px`,
      backgroundColor: '#f0d9b5'
    }}>
      <ProductionChessBoard
        position={currentFen}
        onMove={(sourceSquare, targetSquare) => {
          const success = handlePieceDrop(sourceSquare, targetSquare);
          // Call external onMove with richer info if provided
          if (success && onMove) {
            const game = new Chess(currentFen);
            const mv = game.move({ from: sourceSquare, to: targetSquare, sloppy: true });
            const newFen = mv ? game.fen() : currentFen;
            onMove(mv || { from: sourceSquare, to: targetSquare }, newFen);
          }
          return success;
        }}
        onSquareClick={handleSquareClick}
        boardOrientation={orientation}
        boardSize={boardSize}
        fitToParent={true}
        customBoardStyle={{
          borderRadius: '12px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
          backgroundColor: '#f0d9b5'
        }}
        customSquareStyles={getCustomSquareStyles()}
        customPieceStyle={{
          cursor: 'grab'
        }}
        animationDuration={200}
        areArrowsAllowed={showArrows}
        showBoardNotation={showCoordinates}
        showPromotionDialog={false}
        customDropSquareStyle={{
          boxShadow: 'inset 0 0 1px 6px rgba(34, 197, 94, 0.75)',
          transition: 'box-shadow 0.2s ease'
        }}
        customPremoveDarkSquareStyle={{ backgroundColor: 'rgba(255, 255, 0, 0.4)' }}
        customPremoveLightSquareStyle={{ backgroundColor: 'rgba(255, 255, 0, 0.4)' }}
        customArrows={localCustomArrows}
        {...props}
      />
    </div>
  );
};

export default StandardChessBoard;









