// Chess game service for game state management

import { Chess } from 'chess.js';
import { GameState, Move, MoveNode, Annotation, BoardOrientation } from '../types/chess';
import { PGNParser, ParsedGame } from './PGNParser';

export class ChessGameService {
  private game: Chess;
  private moveTree: MoveNode[] = [];
  private annotations: Map<string, Annotation[]> = new Map();
  private currentMoveIndex = -1;
  private currentVariationId: string | null = null;
  private pgnParser: PGNParser;

  constructor(fen?: string) {
    this.game = new Chess(fen);
    this.pgnParser = new PGNParser();
  }

  getGameState(): GameState {
    return {
      fen: this.game.fen(),
      pgn: this.game.pgn(),
      turn: this.game.turn(),
      checkmate: this.game.in_checkmate(),
      stalemate: this.game.in_stalemate(),
      draw: this.game.in_draw(),
      in_check: this.game.in_check(),
      in_draw: this.game.in_draw(),
      in_stalemate: this.game.in_stalemate(),
      in_threefold_repetition: false, // TODO: Implement proper threefold repetition check
      in_insufficient_material: this.game.insufficient_material(),
      moves: this.game.history({ verbose: true }) as Move[],
      history: this.game.history({ verbose: true }) as Move[]
    };
  }

  makeMove(from: string, to: string, promotion?: string): boolean {
    try {
      console.log('🎯 makeMove called:', { from, to, promotion });
      console.log('🎯 Current FEN:', this.game.fen());
      console.log('🎯 Available moves:', this.game.moves({ verbose: true }));
      console.log('🎯 Current variation ID:', this.currentVariationId);
      console.log('🎯 Current move index:', this.currentMoveIndex);

      // Special case for starting position
      if (this.currentMoveIndex === -1) {
        const move = this.game.move({
          from,
          to,
          promotion: promotion as any
        });
        if (move) {
          console.log('🎯 Move from starting position successful:', move);
          this.addMoveToTree(move);
          this.currentMoveIndex = 0;
          return true;
        } else {
          console.log('🎯 Move from starting position failed');
          return false;
        }
      }

      const move = this.game.move({
        from,
        to,
        promotion: promotion as any
      });

      if (move) {
        console.log('🎯 Move successful:', move);
        console.log('🎯 Current state:', { currentMoveIndex: this.currentMoveIndex, moveTreeLength: this.moveTree.length });
        
        // Check if we're currently in a variation
        if (this.currentVariationId) {
          console.log('🎯 Continuing variation:', this.currentVariationId);
          // Check if this move should return to main line
          // If we're at the end of a variation and this move matches the next main line move
          const shouldReturnToMainLine = this.shouldReturnToMainLine(move);
          if (shouldReturnToMainLine) {
            console.log('🎯 Move should return to main line, clearing variation state');
            this.clearVariationState();
            const parentId = this.currentMoveIndex >= 0 ? this.moveTree[this.currentMoveIndex].id : undefined;
            this.addMoveToTree(move, true, parentId);
            this.currentMoveIndex = this.moveTree.length - 1;
            return true;
          } else {
            // We're continuing the current variation
            return this.continueVariation(this.currentVariationId, from, to, promotion);
          }
        } else {
          // Check if we're going back to a previous move and creating a variation
          if (this.currentMoveIndex < this.moveTree.length - 1) {
            console.log('🎯 Creating variation at position:', this.currentMoveIndex);
            // We're going back to a previous move, create a variation
            return this.createVariationAtCurrentPosition(from, to, promotion);
          } else {
            console.log('🎯 Normal forward move on main line');
            // Clear any variation state when making a normal move
            this.currentVariationId = null;
            // Normal forward move on main line
            console.log('🎯 About to call addMoveToTree with move:', move);
            const parentId = this.currentMoveIndex >= 0 ? this.moveTree[this.currentMoveIndex].id : undefined;
            this.addMoveToTree(move, true, parentId);
            this.currentMoveIndex = this.moveTree.length - 1;
            console.log('🎯 After adding move - currentMoveIndex:', this.currentMoveIndex, 'moveTreeLength:', this.moveTree.length);
            return true;
          }
        }
      } else {
        console.log('🎯 Move failed - invalid move');
        // Clear variation state on invalid move
        this.currentVariationId = null;
        return false;
      }
    } catch (error) {
      console.error('Invalid move:', error);
      // Clear variation state on error
      this.currentVariationId = null;
      return false;
    }
  }

  /**
   * Clears variation state and returns to main line
   * This should be called when the user wants to continue from the main line
   */
  clearVariationState(): void {
    console.log('🎯 Clearing variation state');
    this.currentVariationId = null;
    // Reset to the end of the main line
    this.currentMoveIndex = this.moveTree.length - 1;
  }

  /**
   * Determines if a move should return to the main line
   * This happens when we're in a variation and the move matches the next main line move
   */
  private shouldReturnToMainLine(move: any): boolean {
    // For now, let's be conservative and only return to main line
    // when we're at the end of a variation and there's a main line move available
    const mainLineLength = this.moveTree.filter(node => node.isMainLine).length;
    const currentMainLineIndex = this.currentMoveIndex;
    
    // If we're past the main line, we should return to it
    if (currentMainLineIndex >= mainLineLength) {
      return true;
    }
    
    return false;
  }

  private addMoveToTree(chessMove: any, isMainLine: boolean = true, parentId?: string) {
    console.log('🎯 addMoveToTree called with:', chessMove, 'isMainLine:', isMainLine, 'parentId:', parentId);
    console.log('🎯 Current moveTree length before adding:', this.moveTree.length);
    const move: Move = chessMove as Move;

    const moveIndex = this.moveTree.length;
    const moveNumber = Math.floor(moveIndex / 2) + 1;
    const isWhite = moveIndex % 2 === 0;

    const moveNode: MoveNode = {
      id: `move_${moveIndex}_${Date.now()}_${Math.random()}`,
      move,
      moveNumber,
      isWhite,
      moveIndex: moveIndex,
      annotations: [],
      sublines: [],
      isMainLine: isMainLine,
      parentId: parentId
    };

    console.log('🎯 Created moveNode:', moveNode);
    this.moveTree.push(moveNode);

    // Link to parent if provided
    if (parentId) {
      const parent = this.moveTree.find(node => node.id === parentId);
      if (parent) {
        parent.sublines.push(moveNode);
        console.log('🎯 Added to parent sublines:', parentId);
      }
    }

    console.log('🎯 MoveTree after adding:', this.moveTree);
    console.log('🎯 MoveTree length after adding:', this.moveTree.length);
  }

  createVariation(moveIndex: number, from: string, to: string, promotion?: string): boolean {
    if (moveIndex < 0 || moveIndex >= this.moveTree.length) {
      return false;
    }

    // Save current state
    const currentFen = this.game.fen();
    const currentMoveIndex = this.currentMoveIndex;

    // Go back to the specified move
    this.goToMove(moveIndex);

    // Try to make the variation move
    const success = this.makeMove(from, to, promotion);

    if (success) {
      // Mark the new move as a variation
      const variationNode = this.moveTree[this.moveTree.length - 1];
      variationNode.isMainLine = false;
      variationNode.parentId = this.moveTree[moveIndex].id;

      // Add to parent's sublines
      this.moveTree[moveIndex].sublines.push(variationNode);
    } else {
      // Restore state if move failed
      this.game.load(currentFen);
      this.currentMoveIndex = currentMoveIndex;
    }

    return success;
  }

  private createVariationAtCurrentPosition(from: string, to: string, promotion?: string): boolean {
    try {
      console.log('🎯 createVariationAtCurrentPosition:', { from, to, promotion, currentMoveIndex: this.currentMoveIndex });
      
      // Save current state
      const currentFen = this.game.fen();
      const currentMoveIndex = this.currentMoveIndex;

      // First, go back to the position where we want to create the variation
      this.goToMove(this.currentMoveIndex);
      console.log('🎯 After goToMove - FEN:', this.game.fen());
      console.log('🎯 Available moves:', this.game.moves({ verbose: true }));

      // Check if the move is valid from this position
      const availableMoves = this.game.moves({ verbose: true });
      const isValidMove = availableMoves.some(m => m.from === from && m.to === to);
      
      if (!isValidMove) {
        console.log('🎯 Move is not valid from current position:', { from, to, availableMoves });
        // Restore state if move is not valid
        this.game.load(currentFen);
        this.currentMoveIndex = currentMoveIndex;
        return false;
      }

      // Try the move
      const move = this.game.move({
        from,
        to,
        promotion: promotion as any
      });

      if (move) {
        console.log('🎯 Move successful, creating variation node');
        
        // Create variation node
        const moveNumber = Math.floor(this.currentMoveIndex / 2) + 1;
        const isWhite = this.currentMoveIndex % 2 === 0;

        const variationNode: MoveNode = {
          id: `variation_${this.currentMoveIndex}_${move.san}_${Date.now()}`,
          move: move as Move,
          moveNumber,
          isWhite,
          moveIndex: this.currentMoveIndex + 1,
          annotations: [],
          sublines: [],
          isMainLine: false,
          parentId: this.moveTree[this.currentMoveIndex].id
        };

        console.log('🎯 Variation node created:', variationNode);

        // Add to parent's sublines
        this.moveTree[this.currentMoveIndex].sublines.push(variationNode);
        
        console.log('🎯 Added to parent sublines. Parent now has', this.moveTree[this.currentMoveIndex].sublines.length, 'variations');

        // Update current move index to the variation and set variation ID
        this.currentMoveIndex = this.currentMoveIndex + 1;
        this.currentVariationId = variationNode.id;

        return true;
      } else {
        console.log('🎯 Move failed, restoring state');
        // Restore state if move failed
        this.game.load(currentFen);
        this.currentMoveIndex = currentMoveIndex;
        return false;
      }
    } catch (error) {
      console.error('Failed to create variation:', error);
      return false;
    }
  }

  // Method to continue a variation from a specific move
  continueVariation(variationId: string, from: string, to: string, promotion?: string): boolean {
    try {
      console.log('🎯 continueVariation called with:', { variationId, from, to, promotion });
      
      // Find the current variation node
      const currentVariationNode = this.findVariationNode(variationId);
      if (!currentVariationNode) {
        console.log('🎯 Variation not found:', variationId);
        return false;
      }

      console.log('🎯 Found variation node:', currentVariationNode);

      // Find the root variation (the original variation, not a continuation)
      const rootVariation = this.findRootVariation(variationId);
      if (!rootVariation) {
        console.log('🎯 Could not find root variation');
        return false;
      }

      console.log('🎯 Found root variation:', rootVariation);

      // Find the parent move that contains the root variation
      const parentMove = this.findParentMoveForVariation(rootVariation.id);
      if (!parentMove) {
        console.log('🎯 Could not find parent move for root variation');
        return false;
      }

      console.log('🎯 Found parent move:', parentMove);

      // Save current state
      const currentFen = this.game.fen();
      const currentMoveIndex = this.currentMoveIndex;

      // Navigate to the parent position
      this.goToMove(parentMove.moveIndex);
      console.log('🎯 After goToMove - FEN:', this.game.fen());

      // Play the root variation move
      const variationMove = this.game.move(rootVariation.move);
      if (!variationMove) {
        console.log('🎯 Failed to play root variation move');
        this.game.load(currentFen);
        this.currentMoveIndex = currentMoveIndex;
        return false;
      }

      console.log('🎯 Played root variation move, now at FEN:', this.game.fen());

      // Play all continuation moves up to the current position
      const continuationPath = this.getContinuationPath(rootVariation.id, variationId);
      console.log('🎯 Continuation path:', continuationPath);

      for (const continuationNode of continuationPath) {
        const contMove = this.game.move(continuationNode.move);
        if (!contMove) {
          console.log('🎯 Failed to play continuation move:', continuationNode.move);
          this.game.load(currentFen);
          this.currentMoveIndex = currentMoveIndex;
          return false;
        }
        console.log('🎯 Played continuation move:', continuationNode.move.san);
      }

      console.log('🎯 After playing all continuations - FEN:', this.game.fen());
      console.log('🎯 Available moves:', this.game.moves({ verbose: true }));

      // Now try the new continuation move
      const move = this.game.move({
        from,
        to,
        promotion: promotion as any
      });

      if (move) {
        console.log('🎯 Move successful, creating continuation node');
        
        // Create continuation node
        // For variations, we need to calculate the correct move number and color
        // based on the current variation's position
        const isWhite = !currentVariationNode.isWhite;
        
        // Calculate move number based on the variation's move number
        let moveNumber: number;
        if (isWhite) {
          // If this is a white move, it's a new move number
          moveNumber = currentVariationNode.moveNumber + 1;
        } else {
          // If this is a black move, it's the same move number as the variation
          moveNumber = currentVariationNode.moveNumber;
        }
        
        // For moveIndex, we need to find the next available index in the variation sequence
        const nextMoveIndex = this.getNextMoveIndexInVariation(currentVariationNode);

        const continuationNode: MoveNode = {
          id: `continuation_${variationId}_${move.san}_${Date.now()}`,
          move: move as Move,
          moveNumber,
          isWhite,
          moveIndex: nextMoveIndex,
          annotations: [],
          sublines: [],
          isMainLine: false,
          parentId: variationId
        };

        console.log('🎯 Continuation node created:', continuationNode);

        // Add the continuation as a subline of the current variation
        if (!currentVariationNode.sublines) {
          currentVariationNode.sublines = [];
        }
        currentVariationNode.sublines.push(continuationNode);
        
        console.log('🎯 Added continuation to variation. Variation now has', currentVariationNode.sublines.length, 'continuations');

        // Update current move index and variation ID
        this.currentMoveIndex = currentVariationNode.moveIndex + 1;
        this.currentVariationId = continuationNode.id;

        console.log('🎯 Variation continued successfully');
        return true;
      } else {
        console.log('🎯 Move failed in variation continuation');
        // Restore state if move failed
        this.game.load(currentFen);
        this.currentMoveIndex = currentMoveIndex;
        return false;
      }
    } catch (error) {
      console.error('Failed to continue variation:', error);
      return false;
    }
  }

  // Helper method to find a variation node by ID
  private findVariationNode(variationId: string): MoveNode | null {
    for (const moveNode of this.moveTree) {
      for (const subline of moveNode.sublines) {
        if (subline.id === variationId) {
          return subline;
        }
        // Also search in sublines of sublines (nested variations)
        const found = this.findVariationInSublines(subline, variationId);
        if (found) {
          return found;
        }
      }
    }
    return null;
  }

  // Helper method to recursively search for variation in sublines
  private findVariationInSublines(node: MoveNode, variationId: string): MoveNode | null {
    if (node.sublines) {
      for (const subline of node.sublines) {
        if (subline.id === variationId) {
          return subline;
        }
        const found = this.findVariationInSublines(subline, variationId);
        if (found) {
          return found;
        }
      }
    }
    return null;
  }

  // Helper method to find the parent move that contains a variation
  private findParentMoveForVariation(variationId: string): MoveNode | null {
    for (const moveNode of this.moveTree) {
      for (const subline of moveNode.sublines) {
        if (subline.id === variationId) {
          return moveNode;
        }
        // Also search in nested variations
        const found = this.findParentMoveInSublines(moveNode, subline, variationId);
        if (found) {
          return found;
        }
      }
    }
    return null;
  }

  // Helper method to recursively search for parent move in sublines
  private findParentMoveInSublines(parentNode: MoveNode, currentNode: MoveNode, variationId: string): MoveNode | null {
    if (currentNode.sublines) {
      for (const subline of currentNode.sublines) {
        if (subline.id === variationId) {
          return parentNode;
        }
        const found = this.findParentMoveInSublines(parentNode, subline, variationId);
        if (found) {
          return found;
        }
      }
    }
    return null;
  }

  // Helper method to find the root variation (the original variation, not a continuation)
  private findRootVariation(variationId: string): MoveNode | null {
    const variationNode = this.findVariationNode(variationId);
    if (!variationNode) {
      return null;
    }

    // If this is already a root variation (not a continuation), return it
    if (!variationId.startsWith('continuation_')) {
      return variationNode;
    }

    // If this is a continuation, find the root variation by following parentId
    let currentId = variationId;
    let current = variationNode;
    
    while (currentId.startsWith('continuation_')) {
      const parentId = current.parentId;
      if (!parentId) {
        break;
      }
      
      const parent = this.findVariationNode(parentId);
      if (!parent) {
        break;
      }
      
      currentId = parentId;
      current = parent;
    }
    
    return current;
  }

  // Helper method to get the path of continuations from root variation to target variation
  private getContinuationPath(rootVariationId: string, targetVariationId: string): MoveNode[] {
    const path: MoveNode[] = [];
    
    // If we're already at the root, no path needed
    if (rootVariationId === targetVariationId) {
      return path;
    }
    
    // Find all continuations from the root variation
    const rootVariation = this.findVariationNode(rootVariationId);
    if (!rootVariation) {
      return path;
    }
    
    // Recursively search for the target variation in continuations
    const found = this.findContinuationPathRecursive(rootVariation, targetVariationId, path);
    return found ? path : [];
  }

  // Helper method to recursively find continuation path
  private findContinuationPathRecursive(node: MoveNode, targetId: string, path: MoveNode[]): boolean {
    if (node.id === targetId) {
      return true;
    }
    
    if (node.sublines) {
      for (const subline of node.sublines) {
        path.push(subline);
        if (this.findContinuationPathRecursive(subline, targetId, path)) {
          return true;
        }
        path.pop();
      }
    }
    
    return false;
  }

  // Helper method to get the next move index in a variation sequence
  private getNextMoveIndexInVariation(variationNode: MoveNode): number {
    // Find the parent move to get the base move index
    const parentMove = this.findParentMoveForVariation(variationNode.id);
    if (!parentMove) {
      return 0;
    }
    
    // Count the number of continuations in this variation path
    let continuationCount = 0;
    let current = variationNode;
    while (current.sublines && current.sublines.length > 0) {
      // Find the deepest continuation in this path
      let deepest = current;
      for (const subline of current.sublines) {
        if (subline.moveIndex > deepest.moveIndex) {
          deepest = subline;
        }
      }
      if (deepest === current) {
        break;
      }
      current = deepest;
      continuationCount++;
    }
    
    // Return the parent move index plus the number of continuations
    return parentMove.moveIndex + continuationCount + 1;
  }

  goToMove(moveIndex: number): void {
    if (moveIndex < -1 || moveIndex >= this.moveTree.length) {
      return;
    }

    this.currentMoveIndex = moveIndex;
    this.currentVariationId = null; // Clear variation when going to main line

    if (moveIndex === -1) {
      // Go to initial position
      this.game.reset();
      return;
    }

    // Replay moves up to the specified index
    this.game.reset();
    for (let i = 0; i <= moveIndex; i++) {
      const moveNode = this.moveTree[i];
      this.game.move(moveNode.move);
    }
  }


  goToVariation(variationId: string): boolean {
    console.log('🎯 goToVariation called with:', variationId);
    
    // Find the variation node
    const variationNode = this.findVariationNode(variationId);
    if (!variationNode) {
      console.log('🎯 Variation not found:', variationId);
      return false;
    }

    console.log('🎯 Found variation node:', variationNode);

    // Find the root variation
    const rootVariation = this.findRootVariation(variationId);
    if (!rootVariation) {
      console.log('🎯 Could not find root variation');
      return false;
    }

    console.log('🎯 Found root variation:', rootVariation);

    // Find the parent move that contains the root variation
    const parentMove = this.findParentMoveForVariation(rootVariation.id);
    if (!parentMove) {
      console.log('🎯 Could not find parent move for root variation');
      return false;
    }

    console.log('🎯 Found parent move:', parentMove);

    // Navigate to the parent position
    this.goToMove(parentMove.moveIndex);
    console.log('🎯 After goToMove - FEN:', this.game.fen());

    // Play the root variation move
    const variationMove = this.game.move(rootVariation.move);
    if (!variationMove) {
      console.log('🎯 Failed to play root variation move');
      return false;
    }

    console.log('🎯 Played root variation move, now at FEN:', this.game.fen());

    // If this is a continuation move, play all continuations up to the target
    if (variationId !== rootVariation.id) {
      const continuationPath = this.getContinuationPath(rootVariation.id, variationId);
      console.log('🎯 Continuation path:', continuationPath);

      for (const continuationNode of continuationPath) {
        const contMove = this.game.move(continuationNode.move);
        if (!contMove) {
          console.log('🎯 Failed to play continuation move:', continuationNode.move);
          return false;
        }
        console.log('🎯 Played continuation move:', continuationNode.move.san);
      }
    }

    // Update current move index and variation ID
    this.currentMoveIndex = variationNode.moveIndex;
    this.currentVariationId = variationId;

    console.log('🎯 Navigation completed successfully');
    return true;
  }

  getMoveTree(): MoveNode[] {
    return this.moveTree;
  }

  getCurrentMoveIndex(): number {
    return this.currentMoveIndex;
  }

  addAnnotation(annotation: Omit<Annotation, 'id' | 'createdAt'>): string {
    const id = `ann_${this.currentMoveIndex}_${annotation.type}_${Date.now()}`;
    const newAnnotation: Annotation = {
      ...annotation,
      id,
      createdAt: new Date()
    };

    if (this.currentMoveIndex >= 0 && this.currentMoveIndex < this.moveTree.length) {
      this.moveTree[this.currentMoveIndex].annotations.push(newAnnotation);
    }

    return id;
  }

  getAnnotations(moveIndex: number): Annotation[] {
    if (moveIndex >= 0 && moveIndex < this.moveTree.length) {
      return this.moveTree[moveIndex].annotations;
    }
    return [];
  }

  removeAnnotation(annotationId: string): boolean {
    for (const moveNode of this.moveTree) {
      const index = moveNode.annotations.findIndex(ann => ann.id === annotationId);
      if (index !== -1) {
        moveNode.annotations.splice(index, 1);
        return true;
      }
    }
    return false;
  }

  loadPGN(pgn: string): boolean {
    try {
      console.log('🎯 Loading PGN with complete variation support:', pgn);

      // Parse PGN with all variations
      const parsedPGN = this.pgnParser.parse(pgn);
      console.log('🎯 Parsed PGN:', parsedPGN);

      // Set the move tree from parsed PGN - use allMoves for the complete tree
      this.moveTree = this.convertParsedMovesToMoveNodes(parsedPGN.allMoves);

      // Load main line into chess.js for position tracking
      this.game.loadPgn(this.convertMovesToPgnString(parsedPGN.mainLine));

      // Set current move index to the end
      this.currentMoveIndex = this.moveTree.length - 1;

      console.log('🎯 Loaded move tree with', this.moveTree.length, 'moves');
      console.log('🎯 Move tree structure:', this.moveTree);

      return true;
    } catch (error) {
      console.error('Failed to load PGN:', error);
      return false;
    }
  }

  exportPGN(): string {
    return this.game.pgn();
  }

  goToMoveByIndex(moveIndex: number): boolean {
    try {
      if (moveIndex < 0 || moveIndex >= this.moveTree.length) {
        return false;
      }
      
      this.goToMove(moveIndex);
      this.currentMoveIndex = moveIndex;
      this.currentVariationId = null;
      return true;
    } catch (error) {
      console.error('Failed to go to move by index:', error);
      return false;
    }
  }

  loadFEN(fen: string): boolean {
    try {
      this.game.load(fen);
      this.moveTree = [];
      this.currentMoveIndex = -1;
      return true;
    } catch (error) {
      console.error('Failed to load FEN:', error);
      return false;
    }
  }

  getFEN(): string {
    return this.game.fen();
  }

  flipBoard(): BoardOrientation {
    // This would be handled by the UI component
    return this.game.turn() === 'w' ? 'white' : 'black';
  }

  isGameOver(): boolean {
    return this.game.game_over();
  }

  getResult(): string | null {
    if (this.game.in_checkmate()) {
      return this.game.turn() === 'w' ? '0-1' : '1-0';
    }
    if (this.game.in_draw()) {
      return '1/2-1/2';
    }
    return null;
  }

  getLegalMoves(square?: string): Move[] {
    if (square) {
      return this.game.moves({ square: square as any, verbose: true }) as Move[];
    }
    return this.game.moves({ verbose: true }) as Move[];
  }

  // Enhanced subline management methods
  createVariationAtMove(moveIndex: number, from: string, to: string, promotion?: string): boolean {
    try {
      // Save current position
      const currentFEN = this.game.fen();
      const currentMoveIndex = this.currentMoveIndex;
      
      // Go to the move where we want to create variation
      this.goToMove(moveIndex);
      
      // Try the move
      const move = this.game.move({ from, to, promotion });
      if (!move) {
        // Restore position if move failed
        this.game.load(currentFEN);
        this.currentMoveIndex = currentMoveIndex;
        return false;
      }
      
      // Create the variation node
      const variationNode: MoveNode = {
        id: `variation_${Date.now()}_${Math.random()}`,
        move: move,
        moveIndex: moveIndex + 1,
        moveNumber: Math.floor(moveIndex / 2) + 1,
        isWhite: move.color === 'w',
        sublines: [],
        annotations: [],
        isMainLine: false
      };
      
      // Add to move tree at the specified position
      if (moveIndex >= 0 && moveIndex < this.moveTree.length) {
        if (!this.moveTree[moveIndex].sublines) {
          this.moveTree[moveIndex].sublines = [];
        }
        this.moveTree[moveIndex].sublines.push(variationNode);
      }
      
      // Restore original position
      this.game.load(currentFEN);
      this.currentMoveIndex = currentMoveIndex;
      
      return true;
    } catch (error) {
      console.error('Failed to create variation:', error);
      return false;
    }
  }

  addMoveToVariation(moveIndex: number, variationIndex: number, from: string, to: string, promotion?: string): boolean {
    try {
      if (moveIndex < 0 || moveIndex >= this.moveTree.length) return false;
      if (!this.moveTree[moveIndex].sublines || variationIndex >= this.moveTree[moveIndex].sublines.length) return false;
      
      // Save current position
      const currentFEN = this.game.fen();
      const currentMoveIndex = this.currentMoveIndex;
      
      // Go to the variation and try the move
      this.goToMove(moveIndex);
      
      // Play the variation moves up to the current point
      const variation = this.moveTree[moveIndex].sublines[variationIndex];
      const move = this.game.move(variation.move);
      if (!move) {
        this.game.load(currentFEN);
        this.currentMoveIndex = currentMoveIndex;
        return false;
      }
      
      // Try the new move
      const newMove = this.game.move({ from, to, promotion });
      if (!newMove) {
        this.game.load(currentFEN);
        this.currentMoveIndex = currentMoveIndex;
        return false;
      }
      
      // Create the new move node
      const newMoveNode: MoveNode = {
        id: `variation_move_${Date.now()}_${Math.random()}`,
        move: newMove,
        moveIndex: moveIndex + 1,
        moveNumber: Math.floor((moveIndex + 1) / 2) + 1,
        isWhite: newMove.color === 'w',
        sublines: [],
        annotations: [],
        isMainLine: false
      };
      
      // Add to the variation's sublines
      if (!this.moveTree[moveIndex].sublines[variationIndex].sublines) {
        this.moveTree[moveIndex].sublines[variationIndex].sublines = [];
      }
      this.moveTree[moveIndex].sublines[variationIndex].sublines.push(newMoveNode);
      
      // Restore original position
      this.game.load(currentFEN);
      this.currentMoveIndex = currentMoveIndex;
      
      return true;
    } catch (error) {
      console.error('Failed to add move to variation:', error);
      return false;
    }
  }

  removeVariation(moveIndex: number, variationIndex: number): boolean {
    try {
      if (moveIndex < 0 || moveIndex >= this.moveTree.length) return false;
      if (!this.moveTree[moveIndex].sublines || variationIndex >= this.moveTree[moveIndex].sublines.length) return false;
      
      this.moveTree[moveIndex].sublines.splice(variationIndex, 1);
      return true;
    } catch (error) {
      console.error('Failed to remove variation:', error);
      return false;
    }
  }

  getVariationCount(moveIndex: number): number {
    if (moveIndex < 0 || moveIndex >= this.moveTree.length) return 0;
    return this.moveTree[moveIndex].sublines?.length || 0;
  }

  getAllVariations(): Array<{moveIndex: number, variationIndex: number, moves: MoveNode[]}> {
    const variations: Array<{moveIndex: number, variationIndex: number, moves: MoveNode[]}> = [];
    
    this.moveTree.forEach((node, moveIndex) => {
      if (node.sublines) {
        node.sublines.forEach((variation, variationIndex) => {
          variations.push({
            moveIndex,
            variationIndex,
            moves: [variation]
          });
        });
      }
    });
    
    return variations;
  }

  undo(): boolean {
    if (this.currentMoveIndex >= 0) {
      this.goToMove(this.currentMoveIndex - 1);
      return true;
    }
    return false;
  }

  redo(): boolean {
    if (this.currentMoveIndex < this.moveTree.length - 1) {
      this.goToMove(this.currentMoveIndex + 1);
      return true;
    }
    return false;
  }

  reset(): void {
    this.game.reset();
    this.moveTree = [];
    this.currentMoveIndex = -1;
    this.currentVariationId = null;
    this.annotations.clear();
  }

  private convertParsedMovesToMoveNodes(parsedMoves: any[]): MoveNode[] {
    // Convert ParsedMove[] to MoveNode[] format
    return parsedMoves.map((parsedMove, index) => ({
      id: parsedMove.id || `move_${index}`,
      move: {
        san: parsedMove.san,
        from: '', // These would need to be calculated from the chess position
        to: '',
        piece: '',
        color: parsedMove.isWhite ? 'w' : 'b',
        flags: '',
        lan: parsedMove.san,
        before: '',
        after: parsedMove.fen
      },
      moveNumber: parsedMove.moveNumber,
      isWhite: parsedMove.isWhite,
      moveIndex: index,
      annotations: [],
      sublines: [],
      parentId: parsedMove.parentId,
      isMainLine: parsedMove.isMainLine
    }));
  }

  private convertMovesToPgnString(moves: any[]): string {
    // Convert moves array to PGN string format
    let pgn = '';
    let moveNumber = 1;

    for (let i = 0; i < moves.length; i++) {
      const move = moves[i];
      if (i % 2 === 0) {
        pgn += `${moveNumber}. `;
      }
      pgn += `${move.san} `;
      if (i % 2 === 1) {
        moveNumber++;
      }
    }

    return pgn.trim();
  }
}



