import React from 'react';
import ProductionChessBoard from './ProductionChessBoard';

/**
 * ModernChessBoard component using Clariity/react-chessboard
 * ---------------------------------------------------------
 * A modern, responsive chessboard with drag & drop, animations, and customization.
 * 
 * Props:
 *   - position (string): FEN string for the board position
 *   - orientation ('white' | 'black'): Board orientation
 *   - boardWidth (number): Board width in pixels
 *   - onPieceDrop (function): Callback when a piece is dropped
 *   - showBoardNotation (boolean): Show board coordinates
 *   - animationDuration (number): Animation duration in ms
 *   - customBoardStyle (object): Custom board styling
 */
const ModernChessBoard = ({ 
  position = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', // starting position
  orientation = 'white',
  boardWidth = 640,
  onPieceDrop = null,
  showBoardNotation = true,
  animationDuration = 200,
  customBoardStyle = {},
  arePiecesDraggable = true,
  ...otherProps
}) => {
  
  const boardStyle = {
    borderRadius: '4px',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
    ...customBoardStyle
  };

  return (
    <div style={{ display: 'inline-block', width: '100%', maxWidth: boardWidth }}>
      <ProductionChessBoard
        position={position}
        boardOrientation={orientation}
        boardSize={boardWidth}
        fitToParent={true}
        onMove={(from, to) => onPieceDrop ? onPieceDrop(from, to) : true}
        showBoardNotation={showBoardNotation}
        animationDuration={animationDuration}
        customBoardStyle={boardStyle}
        arePiecesDraggable={arePiecesDraggable}
        {...otherProps}
      />
    </div>
  );
};

export default ModernChessBoard; 