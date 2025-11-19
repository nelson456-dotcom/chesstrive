import { useState, useCallback, useRef, useEffect } from 'react';
import { Chess } from 'chess.js';
import { GameTreeManager } from '../components/GameTreeManager';

/**
 * Custom hook for managing game tree with variations
 * Clean implementation built from scratch
 */
export const useGameTree = (initialFen = null) => {
  const [game, setGame] = useState(() => {
    if (initialFen) {
      try {
        return new Chess(initialFen);
      } catch (error) {
        console.error('Invalid initial FEN:', initialFen, error);
        return new Chess();
      }
    }
    return new Chess();
  });
  const [boardPosition, setBoardPosition] = useState(() => {
    if (initialFen) {
      try {
        const testGame = new Chess(initialFen);
        return testGame.fen();
      } catch (error) {
        console.error('Invalid initial FEN:', initialFen, error);
        return 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      }
    }
    return 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
  });
  const treeManager = useRef(new GameTreeManager());
  const [treeState, setTreeState] = useState(treeManager.current.getState());
  const [refreshKey, setRefreshKey] = useState(0);

  // Update tree state
  const updateTreeState = useCallback(() => {
    setTreeState(treeManager.current.getState());
    setRefreshKey(k => k + 1);
  }, []);

  // Reconstruct board from tree position
  const reconstructBoard = useCallback((customFen = null) => {
    const moves = treeManager.current.getMovesToPosition();
    console.log('🔄 Reconstructing board with', moves.length, 'moves');
    console.log('🔄 Current move index:', treeManager.current.currentMoveIndex);
    console.log('🔄 Initial FEN:', initialFen);
    console.log('🔄 Custom FEN:', customFen);
    
    // Use custom FEN if provided, otherwise use initial FEN, otherwise use starting position
    const startingFen = customFen || initialFen;
    let newGame;
    if (startingFen && startingFen !== 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1') {
      try {
        newGame = new Chess(startingFen);
        console.log('🔄 Starting from custom FEN:', startingFen);
      } catch (error) {
        console.warn('⚠️ Invalid custom FEN, using initial position:', error);
        newGame = new Chess();
      }
    } else {
      newGame = new Chess();
      console.log('🔄 Starting from initial position');
    }
    
    console.log('🔄 Starting from FEN:', newGame.fen());
    
    moves.forEach((move, index) => {
      try {
        // Handle both 'notation' and 'move' properties for compatibility
        const moveNotation = move.notation || move.move;
        if (moveNotation) {
          newGame.move(moveNotation);
          console.log(`  ${index + 1}. ${moveNotation}`);
        } else {
          console.warn(`Move ${index + 1} has no notation:`, move);
        }
      } catch (error) {
        const moveNotation = move.notation || move.move;
        console.error(`Failed to apply move ${index + 1}: ${moveNotation}`, error);
      }
    });
    
    console.log('🔄 Final position:', newGame.fen());
    console.log('🔄 Setting board position to:', newGame.fen());
    
    // Use a single state update to prevent loops
    setGame(newGame);
    setBoardPosition(newGame.fen());
    
    return newGame;
  }, [initialFen]);

  // Handle piece drop on board
  const onPieceDrop = useCallback((sourceSquare, targetSquare, piece) => {
    console.log('🎯 Piece dropped:', sourceSquare, '→', targetSquare);
    
    // Test if move is legal
    const testGame = new Chess(game.fen());
    const moveObj = {
      from: sourceSquare,
      to: targetSquare,
      promotion: piece[1] === 'P' && (targetSquare[1] === '8' || targetSquare[1] === '1') ? 'q' : undefined
    };
    
    const result = testGame.move(moveObj);
    if (!result) {
      console.log('❌ Illegal move');
      return false;
    }
    
    console.log('✅ Legal move:', result.san);
    
    // Add to tree
    const moveData = {
      notation: result.san,
      move: result.san, // Also include 'move' property for compatibility
      from: result.from,
      to: result.to,
      piece: result.piece,
      captured: result.captured
    };
    
    const addResult = treeManager.current.addMove(moveData);
    console.log('📊 Add result:', addResult);
    
    // Reconstruct board
    reconstructBoard();
    updateTreeState();
    
    return true;
  }, [game, reconstructBoard, updateTreeState]);

  // Navigation functions
  const goBack = useCallback(() => {
    console.log('⬅️ Go back');
    const result = treeManager.current.goBack();
    
    if (result.success) {
      reconstructBoard();
      updateTreeState();
    }
    
    return result.success;
  }, [reconstructBoard, updateTreeState]);

  const goForward = useCallback(() => {
    console.log('➡️ Go forward');
    const result = treeManager.current.goForward();
    
    if (result.success) {
      reconstructBoard();
      updateTreeState();
    }
    
    return result.success;
  }, [reconstructBoard, updateTreeState]);

  const goToStart = useCallback(() => {
    console.log('⏮️ Go to start');
    treeManager.current.currentMoveIndex = 0;
    reconstructBoard();
    updateTreeState();
  }, [reconstructBoard, updateTreeState]);

  const goToEnd = useCallback(() => {
    console.log('⏭️ Go to end');
    const currentLine = treeManager.current.getCurrentLine();
    treeManager.current.currentMoveIndex = currentLine.moves.length;
    reconstructBoard();
    updateTreeState();
  }, [reconstructBoard, updateTreeState]);

  // Reset everything
  const reset = useCallback(() => {
    console.log('🔄 Reset');
    treeManager.current.reset();
    let resetGame;
    if (initialFen && initialFen !== 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1') {
      try {
        resetGame = new Chess(initialFen);
        console.log('🔄 Reset to custom FEN:', initialFen);
      } catch (error) {
        console.warn('⚠️ Invalid custom FEN for reset, using initial position:', error);
        resetGame = new Chess();
      }
    } else {
      resetGame = new Chess();
      console.log('🔄 Reset to initial position');
    }
    setGame(resetGame);
    setBoardPosition(resetGame.fen());
    updateTreeState();
  }, [initialFen, updateTreeState]);

  // Restore game tree from database data
  const restoreGameTree = useCallback((gameTreeData, currentPath = [], currentMoveIndex = 0) => {
    console.log('🔄 Restoring game tree from database:', gameTreeData);
    
    if (!gameTreeData || !gameTreeData.moves) {
      console.log('No game tree data to restore, resetting');
      reset();
      return;
    }
    
    // Use the new restoreFromData method
    treeManager.current.restoreFromData(gameTreeData, currentPath, currentMoveIndex);
    
    // Reconstruct the board from the restored position
    reconstructBoard();
    updateTreeState();
    
    console.log('✅ Game tree restored successfully');
  }, [reset, reconstructBoard, updateTreeState]);

  return {
    // Game state
    game,
    boardPosition,
    
    // Tree state
    tree: treeState.tree,
    currentPath: treeState.path,
    currentMoveIndex: treeState.moveIndex,
    refreshKey,
    
    // Actions
    onPieceDrop,
    goBack,
    goForward,
    goToStart,
    goToEnd,
    reset,
    restoreGameTree,
    updateTreeState,
    reconstructBoard,
    
    // Board control
    setGame,
    setBoardPosition,
    
    // Tree manager reference
    treeManager
  };
};




