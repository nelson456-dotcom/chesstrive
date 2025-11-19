import React, { useRef, useCallback, useMemo, useEffect } from 'react';
import { Chessboard } from 'react-chessboard';
import MultiBackend, { multiBackendOptions } from '../utils/dndBackendConfig';
import { TouchBackend } from 'react-dnd-touch-backend';

// Minimal, clean, production-ready chessboard component
// This replaces a previously broken/duplicated file caused by a bad merge.

type BoardOrientation = 'white' | 'black';

interface ProductionChessBoardProps extends Partial<React.ComponentProps<typeof Chessboard>> {
  position: string;
  onMove: (from: string, to: string, promotion?: string) => boolean;
  boardWidth?: number;
  boardSize?: number;
  fitToParent?: boolean;
  boardOrientation?: BoardOrientation;
  showCoordinates?: boolean;
  showLastMove?: boolean;
  showLegalMoves?: boolean;
  selectedSquare?: string;
  id?: string;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

const ProductionChessBoardComponent: React.FC<ProductionChessBoardProps> = ({
  position,
  onMove,
  boardWidth = 400,
  boardSize,
  boardOrientation = 'white',
  fitToParent = true,
  showCoordinates = true,
  showLastMove = true,
  showLegalMoves = false,
  selectedSquare,
  id,
  className,
  style,
  children,
  onSquareClick,
  onSquareRightClick,
  onMouseOverSquare,
  onMouseOutSquare,
  onDragOverSquare,
  customArrows,
  customSquareStyles,
  arePiecesDraggable = true,
  areArrowsAllowed = true,
  arePremovesAllowed = false,
  animationDuration = 300,
  showBoardNotation = true,
  customBoardStyle,
  onPromotionCheck,
  onPromotionPieceSelect,
  promotionDialogVariant,
  promotionToSquare,
  showPromotionDialog,
  clearPremovesOnRightClick,
  customPieces,
  customDndBackend,
  customDndBackendOptions,
  ...rest
}) => {
  const boardRef = useRef<HTMLDivElement>(null);
  const [measuredWidth, setMeasuredWidth] = React.useState<number | null>(null);
  const resolvedBoardWidth = (fitToParent && measuredWidth) ? measuredWidth : (boardSize ?? boardWidth ?? 400);
  const isTouchDevice = useMemo(() => {
    if (typeof window === 'undefined') return false;
    const nav = window.navigator as Navigator & { msMaxTouchPoints?: number };
    return (
      'ontouchstart' in window ||
      (typeof nav.maxTouchPoints === 'number' && nav.maxTouchPoints > 0) ||
      (typeof nav.msMaxTouchPoints === 'number' && nav.msMaxTouchPoints > 0)
    );
  }, []);
  const touchBackendOptions = useMemo(() => ({
    enableMouseEvents: true,
    enableKeyboardEvents: true,
    delayTouchStart: 25,
    ignoreContextMenu: true,
  }), []);
  const effectiveDndBackend = customDndBackend ?? (isTouchDevice ? TouchBackend : MultiBackend);
  const effectiveDndBackendOptions = customDndBackendOptions ?? (isTouchDevice ? touchBackendOptions : multiBackendOptions);

  // Default to our multi-backend config so both mouse and touch dragging stay in sync.
  // Parents can still override by passing customDndBackend/customDndBackendOptions.

  const handlePieceDrop = useCallback(
    (sourceSquare: string, targetSquare: string, piece: string) => {
      console.log('🎯 ProductionChessBoard handlePieceDrop:', sourceSquare, 'to', targetSquare, 'piece:', piece);
      return onMove(sourceSquare, targetSquare);
    },
    [onMove]
  );

  const wrapperStyle = useMemo<React.CSSProperties>(
    () => ({
      position: 'relative',
      width: fitToParent ? '100%' : resolvedBoardWidth,
      height: fitToParent ? (typeof resolvedBoardWidth === 'number' ? resolvedBoardWidth : 0) : resolvedBoardWidth,
      touchAction: 'manipulation',
      ...style
    }),
    [resolvedBoardWidth, style, fitToParent]
  );

  const mergedCustomBoardStyle = useMemo<Record<string, string | number>>(() => ({
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    transition: 'all 0.3s ease',
    // Ensure reliable mobile dragging by default; can be overridden by prop
    touchAction: 'none',
    ...(customBoardStyle ?? {})
  }), [customBoardStyle]);

  const memoizedCustomPieces = useMemo(() => customPieces, [customPieces]);

  useEffect(() => {
    if (fitToParent) {
      // Observe parent/container width to keep the board within its container
      const node = boardRef.current;
      if (!node) return;
      // Initialize immediately with current clientWidth to avoid tiny initial render
      const initialWidth = Math.floor(node.clientWidth || 0);
      if (initialWidth && initialWidth !== measuredWidth) {
        setMeasuredWidth(initialWidth);
      }
      const resizeObserver = new ResizeObserver(entries => {
        for (const entry of entries) {
          const width = Math.floor(entry.contentRect?.width || node.clientWidth || 0);
          if (width && width !== measuredWidth) {
            // The board must be a square; use container width for both dimensions
            setMeasuredWidth(width);
          }
        }
      });
      resizeObserver.observe(node);
      return () => resizeObserver.disconnect();
    }
    return;
  }, [fitToParent, measuredWidth]);

  useEffect(() => {
    if (!isTouchDevice || !boardRef.current || !onSquareClick) {
      return undefined;
    }

    const root = boardRef.current;
    let touchStartSquare: string | null = null;
    let touchStartX = 0;
    let touchStartY = 0;
    let isTapCandidate = false;

    const callOnSquareClick = (square: string) => {
      const squareSelector = `[data-square="${square}"]`;
      const squareElement = root.querySelector(squareSelector) as HTMLElement | null;
      const pieceElement = squareElement?.querySelector('[data-piece]') as HTMLElement | null;
      const piece = pieceElement?.dataset?.piece;
      onSquareClick(square as any, piece as any);
    };

    const getSquareFromEvent = (event: TouchEvent) => {
      const touch = event.touches[0] || event.changedTouches[0];
      if (!touch) return null;
      let el = document.elementFromPoint(touch.clientX, touch.clientY) as HTMLElement | null;
      while (el && !(el.dataset && el.dataset.square)) {
        el = el.parentElement;
      }
      return el?.dataset?.square || null;
    };

    const handleTouchStart = (event: TouchEvent) => {
      if (event.touches.length !== 1) {
        isTapCandidate = false;
        return;
      }
      const square = getSquareFromEvent(event);
      if (!square) {
        isTapCandidate = false;
        return;
      }
      touchStartSquare = square;
      touchStartX = event.touches[0].clientX;
      touchStartY = event.touches[0].clientY;
      isTapCandidate = true;
    };

    const handleTouchMove = (event: TouchEvent) => {
      if (!isTapCandidate || event.touches.length !== 1) {
        return;
      }
      const { clientX, clientY } = event.touches[0];
      const deltaX = Math.abs(clientX - touchStartX);
      const deltaY = Math.abs(clientY - touchStartY);
      if (deltaX > 12 || deltaY > 12) {
        isTapCandidate = false;
      }
    };

    const handleTouchEnd = (event: TouchEvent) => {
      if (!touchStartSquare) {
        return;
      }
      const square = getSquareFromEvent(event);
      if (isTapCandidate && square && square === touchStartSquare) {
        callOnSquareClick(square);
        event.preventDefault();
      }
      touchStartSquare = null;
      isTapCandidate = false;
    };

    const handleTouchCancel = () => {
      touchStartSquare = null;
      isTapCandidate = false;
    };

    root.addEventListener('touchstart', handleTouchStart, { passive: true });
    root.addEventListener('touchmove', handleTouchMove, { passive: true });
    root.addEventListener('touchend', handleTouchEnd);
    root.addEventListener('touchcancel', handleTouchCancel);

    return () => {
      root.removeEventListener('touchstart', handleTouchStart);
      root.removeEventListener('touchmove', handleTouchMove);
      root.removeEventListener('touchend', handleTouchEnd);
      root.removeEventListener('touchcancel', handleTouchCancel);
    };
  }, [isTouchDevice, onSquareClick]);

  console.log('🎯 ProductionChessBoard render:', { 
    position, 
    resolvedBoardWidth, 
    arePiecesDraggable, 
    boardOrientation 
  });

  const chessboardElement = (
    <Chessboard
      position={position}
      boardWidth={resolvedBoardWidth}
      boardOrientation={boardOrientation}
      onSquareClick={onSquareClick}
      onSquareRightClick={onSquareRightClick}
      onMouseOverSquare={onMouseOverSquare}
      onMouseOutSquare={onMouseOutSquare}
      onDragOverSquare={onDragOverSquare}
      onPieceDrop={handlePieceDrop}
      customArrows={customArrows}
      customSquareStyles={customSquareStyles}
      arePiecesDraggable={arePiecesDraggable}
      areArrowsAllowed={areArrowsAllowed}
      arePremovesAllowed={arePremovesAllowed}
      animationDuration={animationDuration}
      showBoardNotation={showBoardNotation}
      customBoardStyle={mergedCustomBoardStyle}
      customPieces={memoizedCustomPieces}
      customDndBackend={effectiveDndBackend}
      customDndBackendOptions={effectiveDndBackendOptions}
      onPromotionCheck={onPromotionCheck}
      onPromotionPieceSelect={onPromotionPieceSelect}
      promotionDialogVariant={promotionDialogVariant}
      promotionToSquare={promotionToSquare}
      showPromotionDialog={showPromotionDialog}
      clearPremovesOnRightClick={clearPremovesOnRightClick}
      {...rest}
    />
  );

  return (
    <div ref={boardRef} id={id} className={className} style={wrapperStyle}>
      {chessboardElement}
      {children}
    </div>
  );
};

const areProductionBoardPropsEqual = (
  prev: ProductionChessBoardProps,
  next: ProductionChessBoardProps
) => {
  const diffs: string[] = [];

  if (prev.position !== next.position) diffs.push('position');
  if (prev.boardOrientation !== next.boardOrientation) diffs.push('boardOrientation');
  if (prev.arePiecesDraggable !== next.arePiecesDraggable) diffs.push('arePiecesDraggable');
  if ((prev.boardWidth ?? prev.boardSize ?? 400) !== (next.boardWidth ?? next.boardSize ?? 400)) diffs.push('boardWidth/boardSize');
  if (prev.boardSize !== next.boardSize) diffs.push('boardSize');
  if (prev.customBoardStyle !== next.customBoardStyle) diffs.push('customBoardStyle');
  if (prev.customSquareStyles !== next.customSquareStyles) diffs.push('customSquareStyles');
  if (prev.customDarkSquareStyle !== next.customDarkSquareStyle) diffs.push('customDarkSquareStyle');
  if (prev.customLightSquareStyle !== next.customLightSquareStyle) diffs.push('customLightSquareStyle');
  if (prev.showBoardNotation !== next.showBoardNotation) diffs.push('showBoardNotation');
  if (prev.customPieces !== next.customPieces) diffs.push('customPieces');
  if (prev.onMove !== next.onMove) diffs.push('onMove');
  if (prev.onSquareClick !== next.onSquareClick) diffs.push('onSquareClick');
  if (prev.onPieceDragBegin !== next.onPieceDragBegin) diffs.push('onPieceDragBegin');
  if (prev.onPieceDragEnd !== next.onPieceDragEnd) diffs.push('onPieceDragEnd');

  if (diffs.length > 0) {
    console.log('♻️ ProductionChessBoard prop changes forcing render:', diffs);
  }

  return diffs.length === 0;
};

export const ProductionChessBoard = React.memo(ProductionChessBoardComponent, areProductionBoardPropsEqual);
ProductionChessBoard.displayName = 'ProductionChessBoard';

export default ProductionChessBoard;
