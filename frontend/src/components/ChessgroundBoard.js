import React, { useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from 'react';
import { Chessground } from 'chessground';
import 'chessground/assets/chessground.base.css';
import 'chessground/assets/chessground.brown.css';
import 'chessground/assets/chessground.cburnett.css';

const ChessgroundBoard = forwardRef(({ 
  position = 'start', 
  orientation = 'white', 
  draggable = true, 
  onMove = null, 
  arrows = [], 
  highlights = [],
  width = 400,
  height = 400
}, ref) => {
  const boardRef = useRef(null);
  const cgRef = useRef(null);
  const onMoveRef = useRef(onMove);
  const lastPositionRef = useRef(position);
  const isInitializedRef = useRef(false);

  // Expose Chessground instance to parent component
  useImperativeHandle(ref, () => ({
    set: (config) => {
      if (cgRef.current) {
        cgRef.current.set(config);
      }
    },
    get: () => cgRef.current
  }));

  // Update the ref when onMove changes
  useEffect(() => {
    onMoveRef.current = onMove;
  }, [onMove]);

  useEffect(() => {
    if (!boardRef.current) return;

    const config = {
      fen: position === 'start' ? 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1' : position,
      orientation: orientation,
      draggable: {
        enabled: draggable,
        showGhost: true,
        deleteOnDropOff: false
      },
      movable: {
        free: true, // Allow moves but they will be validated in the onMove callback
        color: 'both',
        showDests: true
      },
      events: {
        move: (orig, dest, capturedPiece) => {
          console.log('🎯 Chessground move event:', { orig, dest, capturedPiece });
          if (onMoveRef.current) {
            const moveObj = { from: orig, to: dest, captured: capturedPiece };
            console.log('🎯 Calling onMove with:', moveObj);
            onMoveRef.current(moveObj);
          }
        }
      },
      highlight: {
        lastMove: true,
        check: true
      },
      animation: {
        enabled: true,
        duration: 200
      }
    };
    
    try {
      const chessground = Chessground(boardRef.current, config);
      cgRef.current = chessground;
      lastPositionRef.current = position;
      isInitializedRef.current = true;

      return () => {
        if (chessground) {
          chessground.destroy();
        }
        isInitializedRef.current = false;
      };
    } catch (error) {
      console.error('Error initializing Chessground:', error);
    }
  }, []); // Only initialize once

  useEffect(() => {
    if (cgRef.current && isInitializedRef.current && position !== lastPositionRef.current) {
      try {
        const newFen = position === 'start' ? 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1' : position;
        console.log('🎯 Updating Chessground position to:', newFen);
        cgRef.current.set({
          fen: newFen
        });
        lastPositionRef.current = position;
      } catch (error) {
        console.error('Error setting position:', error);
      }
    }
  }, [position]); // Add position dependency back

  return (
    <div 
      ref={boardRef} 
      style={{ 
        width: width, 
        height: height,
        margin: '0 auto'
      }}
    />
  );
});

export default ChessgroundBoard;
