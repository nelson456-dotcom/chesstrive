// Complete Algebraic Notation Renderer that handles all variations and nested variations
import { MoveNode, Annotation } from '../types/chess';

export interface RenderedMove {
  id: string;
  move: string;
  moveNumber: number;
  isWhiteMove: boolean;
  isMainLine: boolean;
  depth: number;
  parentId?: string;
  annotations: RenderedAnnotation[];
  variations: RenderedMove[];
  isExpanded: boolean;
}

export interface RenderedAnnotation {
  id: string;
  type: 'comment' | 'symbol' | 'arrow' | 'circle' | 'highlight';
  content?: string;
  symbol?: string;
}

export class AlgebraicNotationRenderer {
  private expandedMoves: Set<string> = new Set();
  private currentMoveId: string | null = null;

  /**
   * Render complete algebraic notation with all variations
   */
  renderCompleteNotation(moveTree: MoveNode[], currentMoveId?: string): RenderedMove[] {
    this.currentMoveId = currentMoveId || null;
    return this.renderMoves(moveTree, 0, true);
  }

  /**
   * Render moves recursively with proper variation handling
   */
  private renderMoves(moves: MoveNode[], depth: number, isMainLine: boolean): RenderedMove[] {
    const renderedMoves: RenderedMove[] = [];
    let moveNumber = 1;
    let isWhiteMove = true;

    for (let i = 0; i < moves.length; i++) {
      const move = moves[i];
      
      // Calculate move number and color
      if (move.isWhite) {
        moveNumber = move.moveNumber;
        isWhiteMove = true;
      } else {
        isWhiteMove = false;
      }

      // Create rendered move
      const renderedMove: RenderedMove = {
        id: move.id,
        move: move.move.san,
        moveNumber: moveNumber,
        isWhiteMove: isWhiteMove,
        isMainLine: isMainLine,
        depth: depth,
        annotations: this.renderAnnotations(move.annotations || []),
        variations: [],
        isExpanded: this.expandedMoves.has(move.id)
      };

      // Add parent ID for variations
      if (!isMainLine && i > 0) {
        renderedMove.parentId = moves[i - 1].id;
      }

      // Render variations if they exist
      if (move.sublines && move.sublines.length > 0) {
        renderedMove.variations = this.renderVariations(move.sublines, depth + 1, move.id);
      }

      renderedMoves.push(renderedMove);

      // Update move number for next move
      if (!isWhiteMove) {
        moveNumber++;
      }
    }

    return renderedMoves;
  }

  /**
   * Render variations with proper nesting
   */
  private renderVariations(variations: MoveNode[], depth: number, parentId: string): RenderedMove[] {
    const renderedVariations: RenderedMove[] = [];

    for (const variation of variations) {
      // Render the variation moves
      const variationMoves = this.renderMoves([variation], depth, false);
      
      // Add continuation moves if they exist
      if (variation.sublines && variation.sublines.length > 0) {
        const continuationMoves = this.renderMoves(variation.sublines, depth, false);
        variationMoves.push(...continuationMoves);
      }

      renderedVariations.push(...variationMoves);
    }

    return renderedVariations;
  }

  /**
   * Render annotations
   */
  private renderAnnotations(annotations: Annotation[]): RenderedAnnotation[] {
    return annotations.map(annotation => ({
      id: annotation.id,
      type: annotation.type,
      content: annotation.content,
      symbol: annotation.symbol
    }));
  }

  /**
   * Generate complete PGN string with all variations
   */
  generateCompletePGN(moveTree: MoveNode[]): string {
    return this.generatePGNFromMoves(moveTree, 0, true);
  }

  /**
   * Generate PGN from moves recursively
   */
  private generatePGNFromMoves(moves: MoveNode[], depth: number, isMainLine: boolean): string {
    let pgn = '';
    let moveNumber = 1;
    let isWhiteMove = true;

    for (let i = 0; i < moves.length; i++) {
      const move = moves[i];
      
      // Add move number for white moves
      if (move.isWhite) {
        moveNumber = move.moveNumber;
        pgn += `${moveNumber}. `;
        isWhiteMove = true;
      } else {
        isWhiteMove = false;
      }

      // Add the move
      pgn += move.move.san;

      // Add annotations
      if (move.annotations && move.annotations.length > 0) {
        for (const annotation of move.annotations) {
          if (annotation.type === 'comment' && annotation.content) {
            pgn += ` {${annotation.content}}`;
          } else if (annotation.type === 'symbol' && annotation.symbol) {
            pgn += ` ${annotation.symbol}`;
          }
        }
      }

      // Add variations
      if (move.sublines && move.sublines.length > 0) {
        for (const variation of move.sublines) {
          pgn += ` (${this.generatePGNFromMoves([variation], depth + 1, false)}`;
          
          // Add continuation moves if they exist
          if (variation.sublines && variation.sublines.length > 0) {
            pgn += ` ${this.generatePGNFromMoves(variation.sublines, depth + 1, false)}`;
          }
          
          pgn += ')';
        }
      }

      // Add space between moves
      if (i < moves.length - 1) {
        pgn += ' ';
      }

      // Update move number for next move
      if (!isWhiteMove) {
        moveNumber++;
      }
    }

    return pgn;
  }

  /**
   * Toggle expansion of a move
   */
  toggleMoveExpansion(moveId: string): void {
    if (this.expandedMoves.has(moveId)) {
      this.expandedMoves.delete(moveId);
    } else {
      this.expandedMoves.add(moveId);
    }
  }

  /**
   * Expand all moves
   */
  expandAll(): void {
    // This would need to be implemented based on the move tree structure
    // For now, we'll leave it as a placeholder
  }

  /**
   * Collapse all moves
   */
  collapseAll(): void {
    this.expandedMoves.clear();
  }

  /**
   * Get the current move index from the move tree
   */
  getCurrentMoveIndex(moveTree: MoveNode[], currentMoveId: string): number {
    return this.findMoveIndex(moveTree, currentMoveId, 0);
  }

  /**
   * Find move index recursively
   */
  private findMoveIndex(moves: MoveNode[], targetId: string, currentIndex: number): number {
    for (let i = 0; i < moves.length; i++) {
      if (moves[i].id === targetId) {
        return currentIndex + i;
      }
      
      // Check variations
      if (moves[i].sublines && moves[i].sublines.length > 0) {
        const variationIndex = this.findMoveIndex(moves[i].sublines, targetId, currentIndex + i + 1);
        if (variationIndex !== -1) {
          return variationIndex;
        }
      }
    }
    
    return -1;
  }

  /**
   * Get move by index
   */
  getMoveByIndex(moveTree: MoveNode[], index: number): MoveNode | null {
    return this.findMoveByIndex(moveTree, index, 0);
  }

  /**
   * Find move by index recursively
   */
  private findMoveByIndex(moves: MoveNode[], targetIndex: number, currentIndex: number): MoveNode | null {
    for (let i = 0; i < moves.length; i++) {
      const moveIndex = currentIndex + i;
      
      if (moveIndex === targetIndex) {
        return moves[i];
      }
      
      // Check variations
      if (moves[i].sublines && moves[i].sublines.length > 0) {
        const variationMove = this.findMoveByIndex(moves[i].sublines, targetIndex, moveIndex + 1);
        if (variationMove) {
          return variationMove;
        }
      }
    }
    
    return null;
  }

  /**
   * Get all moves in order (main line + variations)
   */
  getAllMovesInOrder(moveTree: MoveNode[]): MoveNode[] {
    const allMoves: MoveNode[] = [];
    this.collectAllMoves(moveTree, allMoves);
    return allMoves;
  }

  /**
   * Collect all moves recursively
   */
  private collectAllMoves(moves: MoveNode[], allMoves: MoveNode[]): void {
    for (const move of moves) {
      allMoves.push(move);
      
      // Add variations
      if (move.sublines && move.sublines.length > 0) {
        this.collectAllMoves(move.sublines, allMoves);
      }
    }
  }
}
