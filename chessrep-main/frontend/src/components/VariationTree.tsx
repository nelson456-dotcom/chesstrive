import React, { useState, useCallback } from 'react';

interface MoveData {
  move: string;
  comment?: string;
  annotation?: string; // NAG symbols like !!, !, ?, ??, !?, ?!
  moveNumber?: number;
  isWhiteMove?: boolean;
}

class MoveNode {
  public move: string;
  public comment: string;
  public annotation: string;
  public moveNumber: number;
  public isWhiteMove: boolean;
  public variations: MoveNode[];
  public parent: MoveNode | null;
  public nextMove: MoveNode | null;

  constructor(data: MoveData) {
    this.move = data.move;
    this.comment = data.comment || '';
    this.annotation = data.annotation || '';
    this.moveNumber = data.moveNumber || 0;
    this.isWhiteMove = data.isWhiteMove || true;
    this.variations = [];
    this.parent = null;
    this.nextMove = null;
  }

  /**
   * Add a variation (alternative move sequence) at this position
   */
  addVariation(variationNode: MoveNode): MoveNode {
    variationNode.parent = this;
    this.variations.push(variationNode);
    return variationNode;
  }

  /**
   * Set the next move in the mainline
   */
  setNextMove(nextNode: MoveNode): MoveNode {
    this.nextMove = nextNode;
    nextNode.parent = this;
    return nextNode;
  }

  /**
   * Get the depth of this node in the tree
   */
  getDepth(): number {
    let depth = 0;
    let current: MoveNode | null = this.parent;
    while (current) {
      depth++;
      current = current.parent;
    }
    return depth;
  }

  /**
   * Check if this node is part of a variation (not mainline)
   */
  isVariation(): boolean {
    if (!this.parent) return false;
    return this.parent.variations.includes(this);
  }

  toString(): string {
    let result = '';
    
    // Add move number for white moves or start of variations
    if (this.isWhiteMove || this.isVariation()) {
      result += `${this.moveNumber}.`;
      if (!this.isWhiteMove) result += '..';
      result += ' ';
    }
    
    result += this.move;
    
    if (this.annotation) {
      result += this.annotation;
    }
    
    if (this.comment) {
      result += ` {${this.comment}}`;
    }
    
    return result;
  }
}

class MoveAnnotation {
  private root: MoveNode | null;
  private currentPosition: MoveNode | null;
  private moveNumber: number;
  private isWhiteToMove: boolean;

  constructor() {
    this.root = null;
    this.currentPosition = null;
    this.moveNumber = 1;
    this.isWhiteToMove = true;
  }

  /**
   * Add a move to the current mainline
   */
  addMove(move: string, comment?: string, annotation?: string): MoveNode {
    const moveNode = new MoveNode({
      move,
      comment,
      annotation,
      moveNumber: this.moveNumber,
      isWhiteMove: this.isWhiteToMove
    });

    if (this.root === null) {
      this.root = moveNode;
      this.currentPosition = moveNode;
    } else {
      this.currentPosition!.setNextMove(moveNode);
      this.currentPosition = moveNode;
    }

    // Update move numbering
    if (!this.isWhiteToMove) {
      this.moveNumber++;
    }
    this.isWhiteToMove = !this.isWhiteToMove;

    return moveNode;
  }

  /**
   * Add a variation starting at the specified position
   */
  addVariationAtPosition(position: MoveNode, moves: Array<{move: string, comment?: string, annotation?: string}>): MoveNode[] {
    if (moves.length === 0) return [];

    const variationNodes: MoveNode[] = [];
    let currentVariationNode: MoveNode | null = null;
    let variationMoveNumber = position.moveNumber;
    let isWhiteMove = position.isWhiteMove;

    for (let i = 0; i < moves.length; i++) {
      const moveData = moves[i];
      const variationNode = new MoveNode({
        move: moveData.move,
        comment: moveData.comment,
        annotation: moveData.annotation,
        moveNumber: variationMoveNumber,
        isWhiteMove: isWhiteMove
      });

      if (i === 0) {
        // First move in variation
        position.addVariation(variationNode);
        currentVariationNode = variationNode;
      } else {
        // Subsequent moves
        currentVariationNode!.setNextMove(variationNode);
        currentVariationNode = variationNode;
      }

      variationNodes.push(variationNode);

      // Update move numbering for variation
      if (!isWhiteMove) {
        variationMoveNumber++;
      }
      isWhiteMove = !isWhiteMove;
    }

    return variationNodes;
  }

  /**
   * Add a nested variation (variation within a variation)
   */
  addNestedVariation(parentVariationNode: MoveNode, moves: Array<{move: string, comment?: string, annotation?: string}>): MoveNode[] {
    return this.addVariationAtPosition(parentVariationNode, moves);
  }

  /**
   * Move to a specific position in the tree
   */
  goToPosition(targetNode: MoveNode): void {
    this.currentPosition = targetNode;
    
    // Update move numbering context based on target position
    this.moveNumber = targetNode.moveNumber;
    if (targetNode.nextMove) {
      this.isWhiteToMove = !targetNode.isWhiteMove;
      if (targetNode.isWhiteMove) {
        this.moveNumber++;
      }
    } else {
      this.isWhiteToMove = !targetNode.isWhiteMove;
    }
  }

  /**
   * Get the mainline as an array of moves
   */
  getMainline(): MoveNode[] {
    const mainline: MoveNode[] = [];
    let current = this.root;
    
    while (current) {
      mainline.push(current);
      current = current.nextMove;
    }
    
    return mainline;
  }

  /**
   * Get all variations at a specific depth
   */
  getVariationsAtDepth(depth: number): MoveNode[] {
    const variations: MoveNode[] = [];
    
    const traverse = (node: MoveNode | null) => {
      if (!node) return;
      
      if (node.getDepth() === depth && node.isVariation()) {
        variations.push(node);
      }
      
      // Traverse variations
      for (const variation of node.variations) {
        traverse(variation);
      }
      
      // Traverse mainline
      traverse(node.nextMove);
    };
    
    traverse(this.root);
    return variations;
  }

  /**
   * Export to PGN-like notation
   */
  toPGN(): string {
    if (!this.root) return '';
    
    const formatVariation = (node: MoveNode | null, isMainline: boolean = true): string => {
      if (!node) return '';
      
      let result = '';
      let current: MoveNode | null = node;
      
      while (current) {
        if (!isMainline || result !== '') result += ' ';
        result += current.toString();
        
        // Add variations
        for (const variation of current.variations) {
          result += ' (' + formatVariation(variation, false) + ')';
        }
        
        current = current.nextMove;
      }
      
      return result;
    };
    
    return formatVariation(this.root, true);
  }

  /**
   * Export to JSON format
   */
  toJSON(): any {
    const nodeToJSON = (node: MoveNode | null): any => {
      if (!node) return null;
      
      return {
        move: node.move,
        comment: node.comment,
        annotation: node.annotation,
        moveNumber: node.moveNumber,
        isWhiteMove: node.isWhiteMove,
        nextMove: nodeToJSON(node.nextMove),
        variations: node.variations.map(v => nodeToJSON(v))
      };
    };
    
    return nodeToJSON(this.root);
  }

  /**
   * Import from JSON format
   */
  fromJSON(data: any): void {
    const jsonToNode = (data: any, parent: MoveNode | null = null): MoveNode | null => {
      if (!data) return null;
      
      const node = new MoveNode({
        move: data.move,
        comment: data.comment,
        annotation: data.annotation,
        moveNumber: data.moveNumber,
        isWhiteMove: data.isWhiteMove
      });
      
      node.parent = parent;
      
      // Reconstruct variations
      if (data.variations) {
        for (const variationData of data.variations) {
          const variationNode = jsonToNode(variationData, node);
          if (variationNode) {
            node.variations.push(variationNode);
          }
        }
      }
      
      // Reconstruct next move
      if (data.nextMove) {
        node.nextMove = jsonToNode(data.nextMove, node);
      }
      
      return node;
    };
    
    this.root = jsonToNode(data);
    this.currentPosition = this.root;
    
    // Reset state
    if (this.root) {
      this.moveNumber = this.root.moveNumber;
      this.isWhiteToMove = this.root.isWhiteMove;
    } else {
      this.moveNumber = 1;
      this.isWhiteToMove = true;
    }
  }

  /**
   * Find a node by move sequence from root
   */
  findNodeByPath(moves: string[]): MoveNode | null {
    let current = this.root;
    
    for (const move of moves) {
      if (!current) return null;
      
      if (current.move === move) {
        current = current.nextMove;
        continue;
      }
      
      // Check variations
      let found = false;
      for (const variation of current.variations) {
        if (variation.move === move) {
          current = variation.nextMove;
          found = true;
          break;
        }
      }
      
      if (!found) return null;
    }
    
    return current;
  }

  /**
   * Get statistics about the annotation tree
   */
  getStats(): {
    totalMoves: number;
    totalVariations: number;
    maxDepth: number;
    mainlineMoves: number;
  } {
    let totalMoves = 0;
    let totalVariations = 0;
    let maxDepth = 0;
    let mainlineMoves = 0;
    
    const traverse = (node: MoveNode | null, depth: number = 0) => {
      if (!node) return;
      
      totalMoves++;
      maxDepth = Math.max(maxDepth, depth);
      
      if (!node.isVariation()) {
        mainlineMoves++;
      } else {
        totalVariations++;
      }
      
      // Traverse variations
      for (const variation of node.variations) {
        traverse(variation, depth + 1);
      }
      
      // Traverse mainline
      traverse(node.nextMove, depth);
    };
    
    traverse(this.root);
    
    return {
      totalMoves,
      totalVariations,
      maxDepth,
      mainlineMoves
    };
  }
}

// React component interface for the new MoveAnnotation system
interface VariationTreeProps {
  moveAnnotation: MoveAnnotation;
  selectedNodeId: string | null;
  currentPath: string[];
  onNodeSelect: (nodeId: string) => void;
  onNodeHover?: (nodeId: string | null) => void;
  maxDepth?: number;
  showComments?: boolean;
  showVariationCount?: boolean;
}

const VariationTree: React.FC<VariationTreeProps> = ({
  moveAnnotation,
  selectedNodeId,
  currentPath,
  onNodeSelect,
  onNodeHover,
  maxDepth = 10,
  showComments = true,
  showVariationCount = true
}) => {
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  const handleNodeHover = useCallback((nodeId: string | null) => {
    setHoveredNodeId(nodeId);
    onNodeHover?.(nodeId);
  }, [onNodeHover]);

  const renderNode = useCallback((node: MoveNode, depth: number = 0): React.ReactNode => {
    if (depth > maxDepth) return null;

    const nodeId = `${node.moveNumber}-${node.move}-${node.isWhiteMove ? 'w' : 'b'}`;
    const isSelected = selectedNodeId === nodeId;
    const isInCurrentPath = currentPath.includes(nodeId);
    const isHovered = hoveredNodeId === nodeId;
    const hasVariations = node.variations.length > 0;
    const isRoot = !node.parent;

    // Simple inline style
    const moveStyle: React.CSSProperties = {
      display: 'inline-block',
      margin: '2px 4px',
      padding: '4px 8px',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '500',
      transition: 'all 0.2s ease',
      backgroundColor: isSelected 
        ? '#3b82f6' 
        : isInCurrentPath 
        ? '#10b981' 
        : isHovered 
        ? '#f3f4f6' 
        : 'transparent',
      color: isSelected || isInCurrentPath ? 'white' : '#374151',
      border: isSelected 
        ? '2px solid #1d4ed8' 
        : isInCurrentPath 
        ? '2px solid #059669' 
        : isHovered 
        ? '1px solid #d1d5db' 
        : '1px solid transparent'
    };

    const moveNumberStyle: React.CSSProperties = {
      fontWeight: 'bold',
      marginRight: '4px',
      color: '#6b7280'
    };

    const commentStyle: React.CSSProperties = {
      fontSize: '12px',
      opacity: 0.8,
      marginLeft: '8px',
      fontStyle: 'italic',
      color: '#6b7280'
    };

    const variationStyle: React.CSSProperties = {
      fontSize: '12px',
      marginLeft: '8px',
      color: '#8b5cf6',
      fontWeight: '500'
    };

    return (
      <div key={nodeId} style={{ marginBottom: '8px' }}>
        {!isRoot && (
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
            <span
              style={moveStyle}
              onClick={() => onNodeSelect(nodeId)}
              onMouseEnter={() => handleNodeHover(nodeId)}
              onMouseLeave={() => handleNodeHover(null)}
            >
              <span style={moveNumberStyle}>
                {node.moveNumber > 0 && (
                  `${node.moveNumber}.${node.isWhiteMove ? '' : '..'}`
                )}
              </span>
              
              <span style={{ fontWeight: '600' }}>
                {node.move}
              </span>
              
              {node.annotation && (
                <span style={{ color: '#f59e0b', marginLeft: '4px' }}>
                  {node.annotation}
                </span>
              )}
              
              {showComments && node.comment && (
                <span style={commentStyle}>
                  {node.comment}
                </span>
              )}
            </span>

            {/* Show variations inline */}
            {hasVariations && (
              <span style={variationStyle}>
                (
                {node.variations.map((variation, index) => (
                  <React.Fragment key={`${variation.moveNumber}-${variation.move}`}>
                    {index > 0 && ' '}
                    <span
                      style={{
                        ...moveStyle,
                        fontSize: '12px',
                        padding: '2px 4px',
                        margin: '0 2px',
                        backgroundColor: isHovered ? '#f3f4f6' : 'transparent',
                        border: '1px solid #e5e7eb'
                      }}
                      onClick={() => onNodeSelect(`${variation.moveNumber}-${variation.move}-${variation.isWhiteMove ? 'w' : 'b'}`)}
                      onMouseEnter={() => handleNodeHover(`${variation.moveNumber}-${variation.move}-${variation.isWhiteMove ? 'w' : 'b'}`)}
                      onMouseLeave={() => handleNodeHover(null)}
                    >
                      {variation.move}
                    </span>
                  </React.Fragment>
                ))}
                )
              </span>
            )}
          </div>
        )}

        {/* Render main line continuation and variations */}
        {hasVariations && (
          <div style={{ marginLeft: '16px', marginTop: '4px' }}>
            {node.variations.map((variation, index) => (
              <div key={`var-${variation.moveNumber}-${variation.move}`} style={{ marginBottom: '4px' }}>
                <span style={{ 
                  fontSize: '12px', 
                  color: '#8b5cf6', 
                  fontWeight: 'bold',
                  marginRight: '8px'
                }}>
                  Var {index + 1}:
                </span>
                {renderNode(variation, depth + 1)}
              </div>
            ))}
          </div>
        )}

        {/* Render next move in mainline */}
        {node.nextMove && renderNode(node.nextMove, depth)}
      </div>
    );
  }, [
    selectedNodeId,
    currentPath,
    hoveredNodeId,
    maxDepth,
    showComments,
    onNodeSelect,
    handleNodeHover
  ]);

  const renderTreeStats = useCallback(() => {
    const stats = moveAnnotation.getStats();
    return (
      <div style={{ 
        fontSize: '12px', 
        color: '#6b7280', 
        marginTop: '8px',
        padding: '8px',
        backgroundColor: '#f9fafb',
        borderRadius: '4px'
      }}>
        <div>Total Moves: {stats.totalMoves}</div>
        <div>Mainline: {stats.mainlineMoves}</div>
        <div>Variations: {stats.totalVariations}</div>
        <div>Max Depth: {stats.maxDepth}</div>
      </div>
    );
  }, [moveAnnotation]);

  const mainline = moveAnnotation.getMainline();

  return (
    <div style={{ 
      backgroundColor: 'white', 
      borderRadius: '8px', 
      padding: '16px',
      height: '100%',
      overflow: 'auto',
      border: '1px solid #e5e7eb'
    }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '16px',
        paddingBottom: '8px',
        borderBottom: '1px solid #e5e7eb'
      }}>
        <h3 style={{ 
          margin: 0, 
          fontSize: '16px', 
          fontWeight: '600',
          color: '#374151'
        }}>
          Move Tree
        </h3>
        {showVariationCount && (
          <span style={{ 
            fontSize: '12px', 
            color: '#6b7280',
            backgroundColor: '#f3f4f6',
            padding: '2px 6px',
            borderRadius: '4px'
          }}>
            {moveAnnotation.getStats().totalVariations} variations
          </span>
        )}
      </div>

      <div style={{ minHeight: '200px' }}>
        {mainline.length > 0 ? (
          <div>
            {renderNode(mainline[0])}
            {renderTreeStats()}
          </div>
        ) : (
          <div style={{ 
            textAlign: 'center', 
            color: '#6b7280',
            fontStyle: 'italic',
            padding: '20px'
          }}>
            No moves recorded yet
          </div>
        )}
      </div>
    </div>
  );
};

export type { MoveData };
export { VariationTree, MoveAnnotation, MoveNode };