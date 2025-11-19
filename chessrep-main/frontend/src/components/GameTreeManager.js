/**
 * GameTreeManager - Clean variation system built from scratch
 * Handles unlimited nesting of chess variations
 */

export class GameTreeManager {
  constructor() {
    this.tree = {
      moves: [],
      variations: []
    };
    this.currentPath = []; // Array of variation indices: [] = main line, [1] = first var, [1,2] = nested
    this.currentMoveIndex = 0; // Position in current line
  }

  /**
   * Navigate to a specific move index in the main line
   * This resets the path to main line and sets the move index
   */
  navigateToMainLineMove(moveIndex) {
    console.log('🎯 Navigating to main line move index:', moveIndex);
    console.log('🎯 Current path before:', this.currentPath);
    
    // Reset to main line
    this.currentPath = [];
    this.currentMoveIndex = moveIndex;
    
    console.log('🎯 Path reset to main line:', this.currentPath);
    console.log('🎯 Move index set to:', this.currentMoveIndex);
    
    return { success: true, path: [...this.currentPath], moveIndex: this.currentMoveIndex };
  }

  /**
   * Navigate to a specific position in the tree
   * Returns the current line we're in
   */
  getCurrentLine() {
    let line = this.tree;
    
    console.log('📍 getCurrentLine: path =', this.currentPath);
    
    // Traverse the path to get to current variation
    for (let i = 0; i < this.currentPath.length; i++) {
      const pathElement = this.currentPath[i];
      const varIndex = pathElement.varIndex;
      const branchPoint = pathElement.branchPoint;
      
      if (varIndex === 0) {
        // Stay at root level
        console.log('  [%d] Stay at current level', i);
        continue;
      }
      
      // Navigate into a variation
      console.log('  [%d] Navigate to variation %d (branches at %d)', i, varIndex, branchPoint);
      
      // Check if this is a root-level variation (branchPoint === 0 and no moves yet)
      if (branchPoint === 0 && line.moves.length === 0) {
        // Root-level variation
        console.log('    Root-level variation');
        if (!line.variations || !line.variations[varIndex - 1]) {
          console.error('    ERROR: Root variation not found at index', varIndex - 1);
          return this.tree; // Return root as fallback
        }
        line = line.variations[varIndex - 1];
        continue;
      }
      
      // Regular variation - stored on the move at branchPoint
      if (line.moves.length <= branchPoint) {
        console.error('    ERROR: Branch point', branchPoint, 'out of range (have', line.moves.length, 'moves)');
        return this.tree;
      }
      
      const branchMove = line.moves[branchPoint];
      
      if (!branchMove) {
        console.error('    ERROR: Branch move is undefined at index', branchPoint);
        return this.tree;
      }
      
      if (!branchMove.variations || !branchMove.variations[varIndex - 1]) {
        console.error('    ERROR: Variation not found at index', varIndex - 1, 'on move', branchMove.notation);
        console.error('    Available variations:', branchMove.variations?.length || 0);
        return this.tree; // Return root as fallback
      }
      
      line = branchMove.variations[varIndex - 1];
      console.log('    Entered variation from move', branchMove.notation);
    }
    
    console.log('  Result: line with', line.moves?.length || 0, 'moves');
    return line;
  }

  /**
   * Add a move to the current position
   * Automatically creates variations when needed
   */
  addMove(moveData) {
    const currentLine = this.getCurrentLine();
    const moves = currentLine.moves;
    
    console.log('📝 Adding move:', moveData.notation, 'at position', this.currentMoveIndex, 'in line with', moves.length, 'moves');
    console.log('📝 Current path:', this.currentPath);
    
    // CASE 1: Appending to end of current line
    if (this.currentMoveIndex >= moves.length) {
      console.log('✅ Case 1: Appending to end');
      moves.push({
        ...moveData,
        variations: []
      });
      this.currentMoveIndex++;
      return { type: 'append', path: [...this.currentPath], moveIndex: this.currentMoveIndex };
    }
    
    // CASE 2: Move already exists at this position
    const existingMove = moves[this.currentMoveIndex];
    if (existingMove.notation === moveData.notation) {
      console.log('✅ Case 2: Move exists, navigating forward');
      this.currentMoveIndex++;
      return { type: 'navigate', path: [...this.currentPath], moveIndex: this.currentMoveIndex };
    }
    
    // CASE 3: Different move - create variation
    console.log('✅ Case 3: Creating variation');
    
    // Special case: Variation from position 0 (alternative first move)
    if (this.currentMoveIndex === 0) {
      return this._createRootVariation(moveData);
    }
    
    // Regular case: Variation from middle of line
    return this._createRegularVariation(moveData, moves);
  }

  /**
   * Create a variation from the starting position (alternative opening)
   */
  _createRootVariation(moveData) {
    const currentLine = this.getCurrentLine();
    
    if (!currentLine.variations) {
      currentLine.variations = [];
    }
    
    // Check if this variation already exists
    const existingIndex = currentLine.variations.findIndex(
      v => v.moves.length > 0 && v.moves[0].notation === moveData.notation
    );
    
    if (existingIndex !== -1) {
      // Switch to existing variation
      console.log('🔄 Switching to existing root variation');
      this.currentPath.push({ varIndex: existingIndex + 1, branchPoint: 0 });
      this.currentMoveIndex = 1;
      return { type: 'switch', path: [...this.currentPath], moveIndex: this.currentMoveIndex };
    }
    
    // Create new root-level variation
    const newVariation = {
      moves: [{
        ...moveData,
        variations: []
      }],
      variations: [],
      branchPoint: 0  // Root variations branch from position 0
    };
    
    currentLine.variations.push(newVariation);
    const newIndex = currentLine.variations.length;
    
    console.log('🌟 Created root variation at index', newIndex);
    this.currentPath.push({ varIndex: newIndex, branchPoint: 0 });
    this.currentMoveIndex = 1;
    
    return { type: 'create_root', path: [...this.currentPath], moveIndex: this.currentMoveIndex };
  }

  /**
   * Create a variation from middle of a line
   */
  _createRegularVariation(moveData, moves) {
    // Get the parent move (the move before the branch point)
    const branchPointIndex = this.currentMoveIndex - 1;
    const parentMove = moves[branchPointIndex];
    
    if (!parentMove.variations) {
      parentMove.variations = [];
    }
    
    // Check if this variation already exists
    const existingIndex = parentMove.variations.findIndex(
      v => v.moves.length > 0 && v.moves[0].notation === moveData.notation
    );
    
    if (existingIndex !== -1) {
      // Switch to existing variation
      console.log('🔄 Switching to existing variation');
      this.currentPath.push({ varIndex: existingIndex + 1, branchPoint: branchPointIndex });
      this.currentMoveIndex = 1;
      return { type: 'switch', path: [...this.currentPath], moveIndex: this.currentMoveIndex };
    }
    
    // Create new variation
    const newVariation = {
      moves: [{
        ...moveData,
        variations: []
      }],
      variations: [],
      branchPoint: branchPointIndex  // Store where this variation branches from
    };
    
    parentMove.variations.push(newVariation);
    const newIndex = parentMove.variations.length;
    
    console.log('🌟 Created variation at index', newIndex, 'branching from move', parentMove.notation, 'at position', branchPointIndex);
    this.currentPath.push({ varIndex: newIndex, branchPoint: branchPointIndex });
    this.currentMoveIndex = 1;
    
    return { type: 'create', path: [...this.currentPath], moveIndex: this.currentMoveIndex };
  }

  /**
   * Navigate backward one move
   */
  goBack() {
    console.log('⬅️ goBack from:', { path: this.currentPath, moveIndex: this.currentMoveIndex });
    
    if (this.currentMoveIndex > 0) {
      this.currentMoveIndex--;
      console.log('  Moved back to index', this.currentMoveIndex);
      return { success: true, path: [...this.currentPath], moveIndex: this.currentMoveIndex };
    }
    
    // At start of a variation - go back to parent
    if (this.currentPath.length > 0) {
      const exitedPath = [...this.currentPath];
      this.currentPath.pop();
      
      // After exiting, we should be at the position just before entering that variation
      const currentLine = this.getCurrentLine();
      
      if (!currentLine || !currentLine.moves) {
        console.error('  ERROR: Invalid line after exiting');
        // Recovery: go to root
        this.currentPath = [];
        this.currentMoveIndex = 0;
        return { success: false, path: [...this.currentPath], moveIndex: this.currentMoveIndex };
      }
      
      // Set position to just before the variation branch
      // For regular variations, this would be at the move that has the variation
      // For root variations, this would be at position 0
      this.currentMoveIndex = 0;
      
      console.log('  Exited variation from path', exitedPath, 'to', this.currentPath, 'at index', this.currentMoveIndex);
      return { success: true, path: [...this.currentPath], moveIndex: this.currentMoveIndex };
    }
    
    console.log('  Already at start');
    return { success: false, path: [...this.currentPath], moveIndex: this.currentMoveIndex };
  }

  /**
   * Navigate forward one move
   */
  goForward() {
    console.log('➡️ goForward from:', { path: this.currentPath, moveIndex: this.currentMoveIndex });
    
    const currentLine = this.getCurrentLine();
    
    if (!currentLine || !currentLine.moves) {
      console.error('  ERROR: Invalid current line');
      return { success: false, path: [...this.currentPath], moveIndex: this.currentMoveIndex };
    }
    
    if (this.currentMoveIndex < currentLine.moves.length) {
      this.currentMoveIndex++;
      console.log('  Moved forward to index', this.currentMoveIndex);
      return { success: true, path: [...this.currentPath], moveIndex: this.currentMoveIndex };
    }
    
    console.log('  Already at end');
    return { success: false, path: [...this.currentPath], moveIndex: this.currentMoveIndex };
  }

  /**
   * Get all moves up to current position (for reconstructing board state)
   */
  getMovesToPosition() {
    const moves = [];
    
    // Start from root
    let currentLine = this.tree;
    let pathIndex = 0;
    
    console.log('🔄 getMovesToPosition: currentPath =', this.currentPath, 'moveIndex =', this.currentMoveIndex);
    
    // Navigate through the path
    while (pathIndex < this.currentPath.length) {
      const pathElement = this.currentPath[pathIndex];
      const varIndex = pathElement.varIndex;
      const branchPoint = pathElement.branchPoint;
      
      if (varIndex === 0) {
        // Stay in current line (main line or already in a variation)
        console.log('  Path[%d]: Stay in current line', pathIndex);
        pathIndex++;
        continue;
      }
      
      // Navigate into a variation
      console.log('  Path[%d]: Navigate into variation %d (branches at %d)', pathIndex, varIndex, branchPoint);
      
      // Check if this is a root-level variation (branchPoint === 0)
      if (branchPoint === 0) {
        // Root-level variation - don't add any moves before entering
        console.log('    Root-level variation detected');
        if (!currentLine.variations || !currentLine.variations[varIndex - 1]) {
          console.error('    ERROR: Root variation not found at index', varIndex - 1);
          return moves;
        }
        currentLine = currentLine.variations[varIndex - 1];
        pathIndex++;
        continue;
      }
      
      // Regular variation - add moves up to and including the branch point
      if (currentLine.moves.length <= branchPoint) {
        console.error('    ERROR: Branch point', branchPoint, 'out of range (have', currentLine.moves.length, 'moves)');
        return moves;
      }
      
      // Add moves up to and INCLUDING the branch point
      for (let i = 0; i <= branchPoint; i++) {
        if (currentLine.moves[i]) {
          moves.push(currentLine.moves[i]);
          console.log('    Added move %d:', i, currentLine.moves[i].notation);
        }
      }
      
      // Enter the variation
      const branchMove = currentLine.moves[branchPoint];
      if (!branchMove.variations || !branchMove.variations[varIndex - 1]) {
        console.error('    ERROR: Variation not found at index', varIndex - 1, 'on move', branchMove.notation);
        console.error('    Available variations:', branchMove.variations?.length || 0);
        return moves;
      }
      
      currentLine = branchMove.variations[varIndex - 1];
      console.log('    Entered variation with', currentLine.moves?.length || 0, 'moves');
      pathIndex++;
    }
    
    // Safety check
    if (!currentLine || !currentLine.moves) {
      console.error('  ERROR: Current line is invalid', currentLine);
      return moves;
    }
    
    // Add moves from final line up to current position
    console.log('  Adding final moves up to index', this.currentMoveIndex);
    for (let i = 0; i < this.currentMoveIndex; i++) {
      if (currentLine.moves[i]) {
        moves.push(currentLine.moves[i]);
        console.log('    Added:', currentLine.moves[i].notation);
      }
    }
    
    console.log('  Total moves:', moves.length, '-', moves.map(m => m.notation).join(' '));
    return moves;
  }

  /**
   * Get current state for display
   */
  getState() {
    return {
      tree: this.tree,
      path: [...this.currentPath],
      moveIndex: this.currentMoveIndex,
      currentLine: this.getCurrentLine()
    };
  }

  /**
   * Reset to starting position
   */
  reset() {
    this.tree = {
      moves: [],
      variations: []
    };
    this.currentPath = [];
    this.currentMoveIndex = 0;
  }

  /**
   * Restore game tree from saved data
   */
  restoreFromData(gameTreeData, currentPath = [], currentMoveIndex = 0) {
    console.log('=== GAMETREEMANAGER RESTORE DEBUG ===');
    console.log('🔄 GameTreeManager: Restoring from data:', {
      hasMoves: !!(gameTreeData && gameTreeData.moves),
      movesCount: gameTreeData?.moves?.length || 0,
      currentPath,
      currentMoveIndex
    });
    console.log('Raw gameTreeData:', gameTreeData);
    console.log('gameTreeData.moves:', gameTreeData?.moves);
    console.log('gameTreeData.moves type:', typeof gameTreeData?.moves);
    console.log('gameTreeData.moves is array:', Array.isArray(gameTreeData?.moves));

    if (!gameTreeData || !gameTreeData.moves) {
      console.log('❌ No game tree data to restore, resetting');
      this.reset();
      return;
    }

    // Deep clone the tree data to avoid reference issues
    console.log('🔄 Deep cloning tree data...');
    this.tree = JSON.parse(JSON.stringify(gameTreeData));
    this.currentPath = [...currentPath];
    this.currentMoveIndex = currentMoveIndex;

    console.log('✅ GameTreeManager: Restored successfully', {
      movesCount: this.tree.moves.length,
      pathLength: this.currentPath.length,
      moveIndex: this.currentMoveIndex
    });
    console.log('Restored tree object:', this.tree);
    console.log('First restored move:', this.tree.moves[0]);
    
    // Debug method to verify moves
    this.debugMoves();
  }

  /**
   * Debug method to log current moves state
   */
  debugMoves() {
    console.log('=== GAMETREEMANAGER DEBUG STATE ===');
    console.log('Total moves:', this.tree.moves.length);
    console.log('Tree object:', this.tree);
    console.log('Current path:', this.currentPath);
    console.log('Current move index:', this.currentMoveIndex);
    
    if (this.tree.moves.length > 0) {
      console.log('First 3 moves:');
      this.tree.moves.forEach((move, idx) => {
        if (idx < 3) {
          console.log(`Move ${idx}:`, {
            notation: move.notation,
            move: move.move,
            from: move.from,
            to: move.to,
            keys: Object.keys(move),
            fullMove: move
          });
        }
      });
    } else {
      console.log('❌ No moves in tree!');
    }
  }
}

