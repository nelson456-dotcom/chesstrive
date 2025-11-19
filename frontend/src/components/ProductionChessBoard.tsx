// Production-quality interactive chessboard component

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Chessboard } from 'react-chessboard';
import { Square, Move, BoardOrientation, Annotation } from '../types/chess';

interface ProductionChessBoardProps {
  position: string;
  onMove: (from: string, to: string, promotion?: string) => boolean;
  onSquareClick?: (square: string) => void;
  onSquareRightClick?: (square: string) => void;
  onArrowDraw?: (from: string, to: string) => void;
  onCircleDraw?: (square: string) => void;
  orientation?: BoardOrientation;
  showCoordinates?: boolean;
  showLastMove?: boolean;
  showLegalMoves?: boolean;
  animationDuration?: number;
  customArrows?: Array<[string, string, string]>;
  customSquares?: Record<string, React.CSSProperties>;
  width?: number;
  height?: number;
  boardStyle?: React.CSSProperties;
  pieces?: Record<string, React.ComponentType<any>>;
  arePiecesDraggable?: boolean;
  areArrowsAllowed?: boolean;
  arePremovesAllowed?: boolean;
  onMouseOverSquare?: (square: string) => void;
  onMouseOutSquare?: (square: string) => void;
  onDragOverSquare?: (square: string) => void;
  onSquareDrop?: (sourceSquare: string, targetSquare: string, piece: string) => boolean;
  onPieceDrop?: (sourceSquare: string, targetSquare: string, piece: string) => boolean;
  onPromotionCheck?: (sourceSquare: string, targetSquare: string, piece: string) => boolean;
  onPromotionPieceSelect?: (piece: string) => void;
  promotionDialogVariant?: 'default' | 'modal';
  promotionToSquare?: string;
  showPromotionDialog?: boolean;
  clearPremovesOnRightClick?: boolean;
  boardWidth?: number;
  boardOrientation?: BoardOrientation;
  id?: string;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

export const ProductionChessBoard: React.FC<ProductionChessBoardProps> = ({
  position,
  onMove,
  onSquareClick,
  onSquareRightClick,
  onArrowDraw,
  onCircleDraw,
  orientation = 'white',
  showCoordinates = true,
  showLastMove = true,
  showLegalMoves = false,
  animationDuration = 200,
  customArrows = [],
  customSquares = {},
  width,
  height,
  boardStyle = {},
  pieces,
  arePiecesDraggable = true,
  areArrowsAllowed = true,
  arePremovesAllowed = false,
  onMouseOverSquare,
  onMouseOutSquare,
  onDragOverSquare,
  onSquareDrop,
  onPieceDrop,
  onPromotionCheck,
  onPromotionPieceSelect,
  promotionDialogVariant = 'default',
  promotionToSquare,
  showPromotionDialog = false,
  clearPremovesOnRightClick = true,
  boardWidth = 400,
  boardOrientation = 'white',
  id,
  className,
  style,
  children,
  ...props
}) => {
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [rightClickedSquare, setRightClickedSquare] = useState<string | null>(null);
  const [draggedPiece, setDraggedPiece] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawMode, setDrawMode] = useState<'arrow' | 'circle' | 'none'>('none');
  const [arrowStart, setArrowStart] = useState<string | null>(null);
  const [circles, setCircles] = useState<Set<string>>(new Set());
  const [arrows, setArrows] = useState<Array<[string, string, string]>>([]);
  const [legalMoves, setLegalMoves] = useState<string[]>([]);
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);

  const boardRef = useRef<HTMLDivElement>(null);

  // Handle square click
  const handleSquareClick = useCallback((square: string) => {
    if (drawMode === 'arrow') {
      if (!arrowStart) {
        setArrowStart(square);
        setIsDrawing(true);
      } else if (arrowStart !== square) {
        // Complete arrow
        const newArrow: [string, string, string] = [arrowStart, square, '#2196f3'];
        setArrows(prev => [...prev, newArrow]);
        onArrowDraw?.(arrowStart, square);
        setArrowStart(null);
        setIsDrawing(false);
      }
    } else if (drawMode === 'circle') {
      setCircles(prev => {
        const newCircles = new Set(prev);
        if (newCircles.has(square)) {
          newCircles.delete(square);
        } else {
          newCircles.add(square);
        }
        onCircleDraw?.(square);
        return newCircles;
      });
    } else {
      // Normal move handling
      if (selectedSquare) {
        if (selectedSquare === square) {
          setSelectedSquare(null);
        } else {
          const success = onMove(selectedSquare, square);
          if (success) {
            setLastMove({ from: selectedSquare, to: square });
            setSelectedSquare(null);
          } else {
            setSelectedSquare(square);
          }
        }
      } else {
        setSelectedSquare(square);
      }
    }
    onSquareClick?.(square);
  }, [drawMode, arrowStart, selectedSquare, onMove, onSquareClick, onArrowDraw, onCircleDraw]);

  // Handle square right click
  const handleSquareRightClick = useCallback((square: string) => {
    if (clearPremovesOnRightClick) {
      setSelectedSquare(null);
    }
    setRightClickedSquare(square);
    onSquareRightClick?.(square);
  }, [clearPremovesOnRightClick, onSquareRightClick]);

  // Handle piece drop
  const handlePieceDrop = useCallback((sourceSquare: string, targetSquare: string, piece: string) => {
    const success = onMove(sourceSquare, targetSquare);
    if (success) {
      setLastMove({ from: sourceSquare, to: targetSquare });
    }
    return success;
  }, [onMove]);

  // Handle mouse over square
  const handleMouseOverSquare = useCallback((square: string) => {
    onMouseOverSquare?.(square);
  }, [onMouseOverSquare]);

  // Handle mouse out square
  const handleMouseOutSquare = useCallback((square: string) => {
    onMouseOutSquare?.(square);
  }, [onMouseOutSquare]);

  // Handle drag over square
  const handleDragOverSquare = useCallback((square: string) => {
    onDragOverSquare?.(square);
  }, [onDragOverSquare]);

  // Get custom square styles
  const getCustomSquareStyles = useCallback(() => {
    const styles: Record<string, React.CSSProperties> = { ...customSquares };

    // Highlight selected square
    if (selectedSquare) {
      styles[selectedSquare] = {
        ...styles[selectedSquare],
        backgroundColor: 'rgba(255, 255, 0, 0.4)',
        borderRadius: '50%'
      };
    }

    // Highlight last move
    if (showLastMove && lastMove) {
      styles[lastMove.from] = {
        ...styles[lastMove.from],
        backgroundColor: 'rgba(255, 255, 0, 0.4)'
      };
      styles[lastMove.to] = {
        ...styles[lastMove.to],
        backgroundColor: 'rgba(255, 255, 0, 0.4)'
      };
    }

    // Highlight legal moves
    if (showLegalMoves && selectedSquare) {
      legalMoves.forEach(square => {
        styles[square] = {
          ...styles[square],
          backgroundColor: 'rgba(0, 255, 0, 0.4)',
          borderRadius: '50%'
        };
      });
    }

    // Highlight circles
    circles.forEach(square => {
      styles[square] = {
        ...styles[square],
        backgroundColor: 'rgba(255, 0, 0, 0.4)',
        borderRadius: '50%'
      };
    });

    return styles;
  }, [selectedSquare, showLastMove, lastMove, showLegalMoves, legalMoves, circles, customSquares]);

  // Get custom arrows
  const getCustomArrows = useCallback(() => {
    return [...customArrows, ...arrows];
  }, [customArrows, arrows]);

  // Mobile touch optimizations for the board
  const mobileOptimizedBoardStyle = useMemo(() => ({
    ...boardStyle,
    // Critical mobile touch optimizations
    // 'none' prevents browser gestures (pan, zoom) from interfering with drag-and-drop
    // This is essential for reliable mobile piece dragging
    touchAction: 'none',
    pointerEvents: 'auto', // Ensure touch events are captured
    WebkitUserSelect: 'none', // Prevent text selection on iOS
    MozUserSelect: 'none',
    msUserSelect: 'none',
    userSelect: 'none', // Prevent text selection
    WebkitTouchCallout: 'none', // Disable iOS callout menu
    WebkitTapHighlightColor: 'transparent', // Remove tap highlight on iOS
    // Ensure proper positioning for drag and drop
    position: 'relative',
    // Performance optimizations
    transform: 'translateZ(0)', // Hardware acceleration
    backfaceVisibility: 'hidden',
    willChange: 'transform',
  }), [boardStyle]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSelectedSquare(null);
        setIsDrawing(false);
        setArrowStart(null);
        setDrawMode('none');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Update legal moves when position changes
  useEffect(() => {
    if (selectedSquare && showLegalMoves) {
      // This would be implemented with the chess engine
      setLegalMoves([]);
    }
  }, [selectedSquare, position, showLegalMoves]);

  return (
    <div
      ref={boardRef}
      id={id}
      className={className}
      style={{
        position: 'relative',
        width: width || boardWidth,
        height: height || boardWidth,
        // Apply mobile touch optimizations to container as well
        // 'none' prevents browser gestures from interfering with drag-and-drop
        touchAction: 'none', // Disable browser gestures to allow proper drag handling
        pointerEvents: 'auto', // Ensure touch events are captured
        WebkitUserSelect: 'none',
        MozUserSelect: 'none',
        msUserSelect: 'none',
        userSelect: 'none',
        WebkitTouchCallout: 'none', // Disable iOS callout
        WebkitTapHighlightColor: 'transparent', // Remove tap highlight
        ...style
      }}
      {...props}
    >
      <Chessboard
        position={position}
        onSquareClick={handleSquareClick}
        onSquareRightClick={handleSquareRightClick}
        onPieceDrop={handlePieceDrop}
        onMouseOverSquare={handleMouseOverSquare}
        onMouseOutSquare={handleMouseOutSquare}
        onDragOverSquare={handleDragOverSquare}
        customArrows={getCustomArrows()}
        customSquareStyles={getCustomSquareStyles()}
        boardWidth={width || boardWidth}
        boardOrientation={boardOrientation}
        arePiecesDraggable={arePiecesDraggable}
        areArrowsAllowed={areArrowsAllowed}
        arePremovesAllowed={arePremovesAllowed}
        animationDuration={animationDuration}
        showBoardNotation={showCoordinates}
        customBoardStyle={mobileOptimizedBoardStyle}
        pieces={pieces}
        onPromotionCheck={onPromotionCheck}
        onPromotionPieceSelect={onPromotionPieceSelect}
        promotionDialogVariant={promotionDialogVariant}
        promotionToSquare={promotionToSquare}
        showPromotionDialog={showPromotionDialog}
        clearPremovesOnRightClick={clearPremovesOnRightClick}
      />
      {children}
    </div>
  );
};

export default ProductionChessBoard;
