// Move tree component with VERTICAL annotation format - NO HORIZONTAL PARENTHESES

import React, { useState, useCallback } from 'react';
import { MoveNode, Annotation } from '../types/chess';

interface MoveTreeProps {
  moveTree: MoveNode[];
  currentMoveIndex: number;
  onMoveClick: (moveIndex: number) => void;
  onVariationClick: (variationId: string) => void;
  onAnnotationClick: (annotationId: string) => void;
  onAddAnnotation: (moveIndex: number, annotation: Omit<Annotation, 'id' | 'createdAt'>) => void;
  onRemoveAnnotation: (annotationId: string) => void;
  className?: string;
}

export const MoveTree: React.FC<MoveTreeProps> = ({
  moveTree,
  currentMoveIndex,
  onMoveClick,
  onVariationClick,
  onAnnotationClick,
  onAddAnnotation,
  onRemoveAnnotation,
  className = ''
}) => {
  const [expandedVariations, setExpandedVariations] = useState<Set<string>>(new Set());
  const [editingAnnotation, setEditingAnnotation] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');

  const toggleVariation = useCallback((variationId: string) => {
    setExpandedVariations(prev => {
      const newSet = new Set(prev);
      if (newSet.has(variationId)) {
        newSet.delete(variationId);
      } else {
        newSet.add(variationId);
      }
      return newSet;
    });
  }, []);

  const handleAddComment = useCallback((moveIndex: number) => {
    if (newComment.trim()) {
      onAddAnnotation(moveIndex, {
        moveId: `move_${moveIndex}`,
        type: 'comment',
        content: newComment.trim()
      });
      setNewComment('');
      setEditingAnnotation(null);
    }
  }, [newComment, onAddAnnotation]);

  const handleAddSymbol = useCallback((moveIndex: number, symbol: string) => {
    onAddAnnotation(moveIndex, {
      moveId: `move_${moveIndex}`,
      type: 'symbol',
      symbol: symbol as any
    });
  }, [onAddAnnotation]);

  // Format moves in VERTICAL format - one move per line with proper indentation
  const formatMovesVertical = useCallback((moves: MoveNode[], depth: number = 0, isVariation: boolean = false): JSX.Element[] => {
    const elements: JSX.Element[] = [];
    let moveIndex = 0;
    let uniqueCounter = 0;

    while (moveIndex < moves.length) {
      const move = moves[moveIndex];
      const isCurrentMove = move.moveIndex === currentMoveIndex;
      const hasVariations = move.sublines && move.sublines.length > 0;

      // Generate truly unique key for this move line
      const lineKey = `line_${move.moveIndex}_${move.move.from}_${move.move.to}_${depth}_${moveIndex}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${uniqueCounter++}`;

      // Create move line with proper indentation
      const indentClass = depth === 0 ? 'main-line' : `variation-line depth-${depth}`;
      const indentStyle = { marginLeft: `${depth * 20}px` };

      elements.push(
        <div key={lineKey} className={`move-line ${indentClass}`} style={indentStyle}>
          {/* Move number for white moves */}
          {move.isWhite && (
            <span className="move-number">
              {move.moveNumber}.
            </span>
          )}

          {/* Move button */}
          <button
            className={`move-btn ${isCurrentMove ? 'active' : ''} ${isVariation ? 'variation-move' : 'main-move'}`}
            onClick={() => {
              if (isVariation) {
                onVariationClick(move.id);
              } else {
                onMoveClick(move.moveIndex);
              }
            }}
          >
            {move.move.san}
          </button>

          {/* Annotations as green circles */}
          {move.annotations && move.annotations.length > 0 && (
            <div className="move-annotations">
              {move.annotations.map((annotation, annotationIndex) => (
                <span
                  key={`annotation_${lineKey}_${annotationIndex}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`}
                  className={`annotation ${annotation.type}`}
                  onClick={() => onAnnotationClick(annotation.id)}
                  title={annotation.content || annotation.symbol || 'Annotation'}
                >
                  {annotation.type === 'symbol' ? annotation.symbol : 
                   annotation.type === 'comment' ? '💬' :
                   annotation.type === 'arrow' ? '→' :
                   annotation.type === 'circle' ? '○' :
                   annotation.type === 'highlight' ? '★' : ''}
                </span>
              ))}
            </div>
          )}

          {/* Evaluation if available */}
          {move.evaluation && (
            <span className="evaluation">
              {move.evaluation.type === 'mate' 
                ? `M${move.evaluation.value}`
                : `${move.evaluation.value > 0 ? '+' : ''}${move.evaluation.value.toFixed(1)}`
              }
            </span>
          )}
        </div>
      );

      // Handle variations with VERTICAL format
      if (hasVariations) {
        // Filter out duplicate variations
        const uniqueVariations = move.sublines.filter((variation, index, self) => 
          index === self.findIndex(v => 
            v.move.san === variation.move.san && 
            v.move.from === variation.move.from && 
            v.move.to === variation.move.to
          )
        );

        if (uniqueVariations.length > 0) {
          // Add "Alternative at move X:" label
          elements.push(
            <div key={`alt_label_${lineKey}`} className="alternative-label" style={{ marginLeft: `${(depth + 1) * 20}px` }}>
              Alternative at move {move.moveNumber}:
            </div>
          );

          // Add each variation as separate lines
          uniqueVariations.forEach((variation, varIndex) => {
            const varLineKey = `var_line_${variation.moveIndex}_${variation.move.from}_${variation.move.to}_${depth}_${moveIndex}_${varIndex}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${uniqueCounter++}`;
            
            elements.push(
              <div key={varLineKey} className={`variation-line depth-${depth + 1}`} style={{ marginLeft: `${(depth + 1) * 20}px` }}>
                {/* Variation move number if it's a white move */}
                {variation.isWhite && (
                  <span className="move-number">
                    {variation.moveNumber}.
                  </span>
                )}

                {/* Variation move button */}
                <button
                  className="variation-move"
                  onClick={() => onVariationClick(variation.id)}
                >
                  {variation.move.san}
                </button>

                {/* Variation annotations */}
                {variation.annotations && variation.annotations.length > 0 && (
                  <div className="move-annotations">
                    {variation.annotations.map((annotation, annotationIndex) => (
                      <span
                        key={`var_annotation_${varLineKey}_${annotationIndex}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`}
                        className={`annotation ${annotation.type}`}
                        onClick={() => onAnnotationClick(annotation.id)}
                        title={annotation.content || annotation.symbol || 'Annotation'}
                      >
                        {annotation.type === 'symbol' ? annotation.symbol : 
                         annotation.type === 'comment' ? '💬' :
                         annotation.type === 'arrow' ? '→' :
                         annotation.type === 'circle' ? '○' :
                         annotation.type === 'highlight' ? '★' : ''}
                      </span>
                    ))}
                  </div>
                )}

                {/* Variation evaluation if available */}
                {variation.evaluation && (
                  <span className="evaluation">
                    {variation.evaluation.type === 'mate' 
                      ? `M${variation.evaluation.value}`
                      : `${variation.evaluation.value > 0 ? '+' : ''}${variation.evaluation.value.toFixed(1)}`
                    }
                  </span>
                )}
              </div>
            );

            // Add nested variations recursively
            if (variation.sublines && variation.sublines.length > 0) {
              const nestedVariations = formatMovesVertical(variation.sublines, depth + 2, true);
              elements.push(...nestedVariations);
            }
          });
        }
      }

      moveIndex++;
    }

    return elements;
  }, [currentMoveIndex, onMoveClick, onVariationClick, onAnnotationClick]);

  return (
    <div className={`move-tree ${className}`}>
      <div className="move-tree-header">
        <h3>Move Tree</h3>
        <div className="move-tree-controls">
          <button 
            className="expand-all-btn"
            onClick={() => {
              const allVariationIds = new Set<string>();
              const collectVariationIds = (nodes: MoveNode[]) => {
                nodes.forEach(node => {
                  if (node.sublines && node.sublines.length > 0) {
                    allVariationIds.add(node.id);
                    collectVariationIds(node.sublines);
                  }
                });
              };
              collectVariationIds(moveTree);
              setExpandedVariations(allVariationIds);
            }}
          >
            Expand All
          </button>
          <button 
            className="collapse-all-btn"
            onClick={() => setExpandedVariations(new Set())}
          >
            Collapse All
          </button>
        </div>
      </div>
      
      <div className="move-tree-content">
        {moveTree.length === 0 ? (
          <div className="no-moves">No moves played yet</div>
        ) : (
          <div className="vertical-format">
            {formatMovesVertical(moveTree)}
          </div>
        )}
      </div>
    </div>
  );
};

export default MoveTree;