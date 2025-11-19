import React, { memo, useMemo, useCallback } from 'react';
import { Chessboard } from 'react-chessboard';

/**
 * FastChessBoard - High-performance chess board using react-chessboard
 * --------------------------------------------------------------
 * An optimized version of react-chessboard with faster animations and better performance.
 * 
 * Features:
 * - Ultra-fast animations (100ms)
 * - Optimized rendering
 * - Smooth drag & drop
 * - Professional styling
 */
const FastChessBoard = memo(({ 
  position = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
  orientation = 'white',
  onMove = null,
  width = 640,
  height = 640,
  viewOnly = false,
  lastMove = null,
  check = null
}) => {
  
  const handlePieceDrop = useCallback((sourceSquare, targetSquare) => {
    if (onMove) {
      onMove(sourceSquare + targetSquare, { from: sourceSquare, to: targetSquare });
    }
    return true;
  }, [onMove]);

  // Memoize square styles to prevent recalculation
  const customSquareStyles = useMemo(() => {
    const styles = {};
    
    if (lastMove) {
      styles[lastMove.from] = { 
        backgroundColor: 'rgba(255, 255, 0, 0.4)',
        transition: 'background-color 0.05s ease'
      };
      styles[lastMove.to] = { 
        backgroundColor: 'rgba(255, 255, 0, 0.4)',
        transition: 'background-color 0.05s ease'
      };
    }
    
    if (check) {
      styles[check] = { 
        backgroundColor: 'rgba(255, 0, 0, 0.4)',
        transition: 'background-color 0.05s ease'
      };
    }
    
    return styles;
  }, [lastMove, check]);

  // Memoize board styles to prevent recreation
  const boardStyles = useMemo(() => ({
    customBoardStyle: {
      borderRadius: '8px',
      boxShadow: '0 8px 16px rgba(0, 0, 0, 0.2)',
      border: '2px solid #404040',
      transform: 'translateZ(0)', // Hardware acceleration
      willChange: 'transform',
      backgroundColor: '#f0d9b5' // Prevent white flashing
    },
    customLightSquareStyle: {
      backgroundColor: '#f0d9b5'
    },
    customDarkSquareStyle: {
      backgroundColor: '#b58863'
    }
  }), []);

  return (
    <div style={{ display: 'inline-block' }}>
      <Chessboard
        position={position}
        onPieceDrop={handlePieceDrop}
        boardOrientation={orientation}
        boardWidth={width}
        boardHeight={height}
        arePiecesDraggable={!viewOnly}
        customSquareStyles={customSquareStyles}
        animationDuration={75} // Even faster animations
        {...boardStyles}
        customPieces={useMemo(() => ({
          wP: ({ squareWidth }) => (
            <div style={{
              width: squareWidth,
              height: squareWidth,
              backgroundImage: 'url(https://chessboardjs.com/img/chesspieces/wikipedia/wP.png)',
              backgroundSize: 'contain',
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'center',
              willChange: 'transform' // Optimize for animations
            }} />
          ),
          wR: ({ squareWidth }) => (
            <div style={{
              width: squareWidth,
              height: squareWidth,
              backgroundImage: 'url(https://chessboardjs.com/img/chesspieces/wikipedia/wR.png)',
              backgroundSize: 'contain',
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'center'
            }} />
          ),
          wN: ({ squareWidth }) => (
            <div style={{
              width: squareWidth,
              height: squareWidth,
              backgroundImage: 'url(https://chessboardjs.com/img/chesspieces/wikipedia/wN.png)',
              backgroundSize: 'contain',
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'center'
            }} />
          ),
          wB: ({ squareWidth }) => (
            <div style={{
              width: squareWidth,
              height: squareWidth,
              backgroundImage: 'url(https://chessboardjs.com/img/chesspieces/wikipedia/wB.png)',
              backgroundSize: 'contain',
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'center'
            }} />
          ),
          wQ: ({ squareWidth }) => (
            <div style={{
              width: squareWidth,
              height: squareWidth,
              backgroundImage: 'url(https://chessboardjs.com/img/chesspieces/wikipedia/wQ.png)',
              backgroundSize: 'contain',
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'center'
            }} />
          ),
          wK: ({ squareWidth }) => (
            <div style={{
              width: squareWidth,
              height: squareWidth,
              backgroundImage: 'url(https://chessboardjs.com/img/chesspieces/wikipedia/wK.png)',
              backgroundSize: 'contain',
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'center'
            }} />
          ),
          bP: ({ squareWidth }) => (
            <div style={{
              width: squareWidth,
              height: squareWidth,
              backgroundImage: 'url(https://chessboardjs.com/img/chesspieces/wikipedia/bP.png)',
              backgroundSize: 'contain',
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'center'
            }} />
          ),
          bR: ({ squareWidth }) => (
            <div style={{
              width: squareWidth,
              height: squareWidth,
              backgroundImage: 'url(https://chessboardjs.com/img/chesspieces/wikipedia/bR.png)',
              backgroundSize: 'contain',
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'center'
            }} />
          ),
          bN: ({ squareWidth }) => (
            <div style={{
              width: squareWidth,
              height: squareWidth,
              backgroundImage: 'url(https://chessboardjs.com/img/chesspieces/wikipedia/bN.png)',
              backgroundSize: 'contain',
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'center'
            }} />
          ),
          bB: ({ squareWidth }) => (
            <div style={{
              width: squareWidth,
              height: squareWidth,
              backgroundImage: 'url(https://chessboardjs.com/img/chesspieces/wikipedia/bB.png)',
              backgroundSize: 'contain',
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'center'
            }} />
          ),
          bQ: ({ squareWidth }) => (
            <div style={{
              width: squareWidth,
              height: squareWidth,
              backgroundImage: 'url(https://chessboardjs.com/img/chesspieces/wikipedia/bQ.png)',
              backgroundSize: 'contain',
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'center'
            }} />
          ),
          bK: ({ squareWidth }) => (
            <div style={{
              width: squareWidth,
              height: squareWidth,
              backgroundImage: 'url(https://chessboardjs.com/img/chesspieces/wikipedia/bK.png)',
              backgroundSize: 'contain',
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'center',
              willChange: 'transform' // Optimize for animations
            }} />
          )
        }), [])}
      />
    </div>
  );
});

FastChessBoard.displayName = 'FastChessBoard';

export default FastChessBoard; 