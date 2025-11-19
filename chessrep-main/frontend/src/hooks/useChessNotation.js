import { useState, useCallback } from 'react';

// ============================================================================
// SHARED NOTATION RECORDER HOOK
// ============================================================================

export const useChessNotation = () => {
  // State
  const [gameTree, setGameTree] = useState({ moves: [] });
  const [position, setPosition] = useState({
    path: [], // [{moveIndex, variationIndex}, ...]
    moveIndex: -1
  });

  // ============================================================================
  // CORE API FUNCTIONS
  // ============================================================================

  /**
   * Record a move made on the board
   * @param {string} notation - SAN notation (e.g., "e4", "Nf3", "O-O")
   * @param {string} from - square moved from (e.g., "e2")
   * @param {string} to - square moved to (e.g., "e4")
   */
  const recordMove = useCallback((notation, from = null, to = null) => {
    const newTree = JSON.parse(JSON.stringify(gameTree));
    
    // Navigate to current line
    let currentLine = newTree.moves;
    for (const step of position.path) {
      const move = currentLine[step.moveIndex];
      if (!move.variations) {
        move.variations = [];
      }
      if (!move.variations[step.variationIndex]) {
        move.variations[step.variationIndex] = { moves: [] };
      }
      currentLine = move.variations[step.variationIndex].moves;
    }
    
    // Add the move
    currentLine.push({
      notation,
      from,
      to,
      variations: [],
      timestamp: Date.now()
    });
    
    setGameTree(newTree);
    setPosition({
      ...position,
      moveIndex: currentLine.length - 1
    });
  }, [gameTree, position]);

  /**
   * Navigate to a specific move
   * @param {number} index - Move index in current line
   */
  const navigateToMove = useCallback((index) => {
    const currentLine = getCurrentLine();
    if (index >= -1 && index < currentLine.length) {
      setPosition({
        ...position,
        moveIndex: index
      });
      
      return getPositionMoves(index);
    }
    return null;
  }, [position]);

  /**
   * Start creating a variation at current position
   */
  const createVariation = useCallback(() => {
    if (position.moveIndex < 0) return false;

    const currentLine = getCurrentLine();
    if (position.moveIndex >= currentLine.length) return false;

    const move = currentLine[position.moveIndex];
    if (!move.variations) {
      move.variations = [];
    }
    const variationIndex = move.variations.length;

    setPosition({
      path: [
        ...position.path,
        { moveIndex: position.moveIndex, variationIndex }
      ],
      moveIndex: -1
    });
    
    return true;
  }, [position]);

  /**
   * Go back to parent variation
   */
  const exitVariation = useCallback(() => {
    if (position.path.length === 0) return false;

    const newPath = position.path.slice(0, -1);
    const lastStep = position.path[position.path.length - 1];
    
    setPosition({
      path: newPath,
      moveIndex: lastStep.moveIndex
    });
    
    return true;
  }, [position]);

  /**
   * Get current line of moves
   */
  const getCurrentLine = useCallback(() => {
    let currentLine = gameTree.moves;
    
    for (const step of position.path) {
      if (step.moveIndex >= currentLine.length) break;
      const move = currentLine[step.moveIndex];
      if (!move.variations || !move.variations[step.variationIndex]) break;
      currentLine = move.variations[step.variationIndex].moves;
    }
    
    return currentLine;
  }, [gameTree, position]);

  /**
   * Get all moves up to current position for board rendering
   */
  const getPositionMoves = useCallback((upToIndex = position.moveIndex) => {
    const moves = [];
    
    if (position.path.length === 0) {
      // In main line
      for (let i = 0; i <= upToIndex && i < gameTree.moves.length; i++) {
        moves.push(gameTree.moves[i]);
      }
    } else {
      // In variations - need to build path
      let currentLine = gameTree.moves;
      
      for (let pathIndex = 0; pathIndex < position.path.length; pathIndex++) {
        const step = position.path[pathIndex];
        
        // Add moves up to branch point
        for (let i = 0; i <= step.moveIndex && i < currentLine.length; i++) {
          moves.push(currentLine[i]);
        }
        
        // Enter variation
        const move = currentLine[step.moveIndex];
        if (move && move.variations && move.variations[step.variationIndex]) {
          currentLine = move.variations[step.variationIndex].moves;
        }
      }
      
      // Add moves in final variation
      for (let i = 0; i <= upToIndex && i < currentLine.length; i++) {
        moves.push(currentLine[i]);
      }
    }
    
    return moves;
  }, [gameTree, position]);

  /**
   * Reset to start position
   */
  const resetPosition = useCallback(() => {
    setPosition({ path: [], moveIndex: -1 });
  }, []);

  /**
   * Clear entire game
   */
  const clearGame = useCallback(() => {
    setGameTree({ moves: [] });
    setPosition({ path: [], moveIndex: -1 });
  }, []);

  /**
   * Export game as PGN-style notation
   */
  const exportNotation = useCallback(() => {
    return formatNotation(gameTree.moves);
  }, [gameTree]);

  // ============================================================================
  // FORMATTING FUNCTIONS
  // ============================================================================

  const formatNotation = useCallback((moves, startNum = 1, startColor = 'white') => {
    let result = '';
    let moveNum = startNum;
    let isWhite = startColor === 'white';
    
    for (let i = 0; i < moves.length; i++) {
      const move = moves[i];
      
      if (isWhite) {
        result += `${moveNum}. ${move.notation} `;
      } else {
        result += `${move.notation} `;
        moveNum++;
      }
      
      if (move.variations && move.variations.length > 0) {
        for (let v = 0; v < move.variations.length; v++) {
          const variation = move.variations[v];
          if (!variation.moves || variation.moves.length === 0) continue;
          
          result += '(';
          
          if (isWhite) {
            result += `${moveNum}...${variation.moves[0].notation} `;
            if (variation.moves.length > 1) {
              result += formatNotation(variation.moves.slice(1), moveNum + 1, 'white');
            }
          } else {
            result += formatNotation(variation.moves, moveNum, 'white');
          }
          
          result += ') ';
        }
      }
      
      isWhite = !isWhite;
    }
    
    return result.trim();
  }, []);

  return {
    // State
    gameTree,
    position,
    
    // API Functions
    recordMove,
    navigateToMove,
    createVariation,
    exitVariation,
    getCurrentLine,
    getPositionMoves,
    resetPosition,
    clearGame,
    exportNotation,
    formatNotation
  };
};
