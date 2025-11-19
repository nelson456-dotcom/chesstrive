import React from 'react';
import ProductionChessBoard from './ProductionChessBoard';

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
const FastChessBoard = ({ 
  position = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
  orientation = 'white',
  onMove = null,
  width = 640,
  height = 640,
  viewOnly = false,
  lastMove = null,
  check = null
}) => {
  
  const handlePieceDrop = (sourceSquare, targetSquare) => {
    if (onMove) {
      onMove(sourceSquare + targetSquare, { from: sourceSquare, to: targetSquare });
    }
    return true;
  };

  const customSquareStyles = {};
  
  // Add last move highlighting
  if (lastMove) {
    customSquareStyles[lastMove.from] = { backgroundColor: 'rgba(255, 255, 0, 0.4)' };
    customSquareStyles[lastMove.to] = { backgroundColor: 'rgba(255, 255, 0, 0.4)' };
  }
  
  // Add check highlighting
  if (check) {
    customSquareStyles[check] = { backgroundColor: 'rgba(255, 0, 0, 0.4)' };
  }

  return (
    <div style={{ display: 'inline-block', width: '100%', maxWidth: width }}>
      <ProductionChessBoard
        position={position}
        onMove={(from, to) => handlePieceDrop(from, to)}
        boardOrientation={orientation}
        boardSize={width}
        fitToParent={true}
        arePiecesDraggable={!viewOnly}
        customSquareStyles={customSquareStyles}
        animationDuration={100}
        customBoardStyle={{
          borderRadius: '8px',
          boxShadow: '0 8px 16px rgba(0, 0, 0, 0.2)',
          border: '2px solid #404040'
        }}
        customLightSquareStyle={{
          backgroundColor: '#f0d9b5'
        }}
        customDarkSquareStyle={{
          backgroundColor: '#b58863'
        }}
        customPieces={{
          wP: ({ squareWidth }) => (
            <div style={{
              width: squareWidth,
              height: squareWidth,
              backgroundImage: 'url(https://chessboardjs.com/img/chesspieces/wikipedia/wP.png)',
              backgroundSize: 'contain',
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'center'
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
              backgroundPosition: 'center'
            }} />
          )
        }}
      />
    </div>
  );
};

export default FastChessBoard; 