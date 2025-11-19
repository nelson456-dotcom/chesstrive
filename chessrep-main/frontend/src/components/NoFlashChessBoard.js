import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import ProductionChessBoard from './ProductionChessBoard';
import { Chess } from 'chess.js';

const NoFlashChessBoard = ({
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
  const [isTransitioning, setIsTransitioning] = useState(false);

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
          setIsTransitioning(true);
          setCurrentFen(newFen);
          gameRef.current.load(newFen);
          // Reset transition state after a brief delay
          setTimeout(() => setIsTransitioning(false), 50);
        }
      } catch (e) {
        console.error("Failed to load FEN in NoFlashChessBoard:", newFen, e);
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
      console.error("Illegal move in NoFlashChessBoard:", e);
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

  // Custom board styles to prevent white flashing
  const boardStyles = useMemo(() => ({
    customBoardStyle: {
      borderRadius: '12px',
      boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
      backgroundColor: '#f0d9b5',
      background: '#f0d9b5',
      overflow: 'hidden'
    },
    customLightSquareStyle: {
      backgroundColor: '#f0d9b5',
      background: '#f0d9b5'
    },
    customDarkSquareStyle: {
      backgroundColor: '#b58863',
      background: '#b58863'
    }
  }), []);

  return (
    <div 
      className={`relative mx-auto smooth-board ${className}`} 
      style={{ 
        ...style, 
        width: '100%',
        maxWidth: boardSize,
        backgroundColor: '#f0d9b5',
        background: '#f0d9b5'
      }}
    >
      <ProductionChessBoard
        position={currentFen}
        onMove={(sourceSquare, targetSquare) => handlePieceDrop(sourceSquare, targetSquare)}
        onSquareClick={handleSquareClick}
        boardOrientation={orientation}
        boardSize={boardSize}
        fitToParent={true}
        customBoardStyle={boardStyles.customBoardStyle}
        customLightSquareStyle={boardStyles.customLightSquareStyle}
        customDarkSquareStyle={boardStyles.customDarkSquareStyle}
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
          transition: 'box-shadow 0.1s ease'
        }}
        customPremoveDarkSquareStyle={{ backgroundColor: 'rgba(255, 255, 0, 0.4)' }}
        customPremoveLightSquareStyle={{ backgroundColor: 'rgba(255, 255, 0, 0.4)' }}
        customArrows={localCustomArrows}
        {...props}
      />
    </div>
  );
};

export default React.memo(NoFlashChessBoard);
