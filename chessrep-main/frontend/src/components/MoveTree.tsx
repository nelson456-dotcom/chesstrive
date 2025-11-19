// Move tree component with sublines support

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

  // Format moves function - moved outside of renderPGNFormat to avoid hook rules violation
  const formatMoves = useCallback((moves: MoveNode[], depth: number = 0, isVariation: boolean = false, keyCounterRef: { current: number } = { current: 0 }): JSX.Element[] => {
    const elements: JSX.Element[] = [];
    let moveIndex = 0;

    while (moveIndex < moves.length) {
      const move = moves[moveIndex];
      const isCurrentMove = move.moveIndex === currentMoveIndex;
      const hasVariations = move.sublines && move.sublines.length > 0;
      if (hasVariations) {
        console.log('🎯 Move has variations:', move.move.san, 'count:', move.sublines.length);
      }
      const variationId = `move_${move.id}_${depth}`;
      const isExpanded = expandedVariations.has(variationId);
      
      // Only render main line moves in the main sequence
      if (!isVariation && !move.isMainLine) {
        moveIndex++;
        continue;
      }

      // Add move number for white moves or variation notation for black moves
      if (move.isWhite) {
        elements.push(
          <span key={`number_${keyCounterRef.current++}_${Date.now()}`} className="move-number">
            {move.moveNumber}.
          </span>
        );
      } else if (isVariation && move.isWhite === false) {
        // For black moves in variations, show the move number with dots (e.g., "5...")
        elements.push(
          <span key={`number_${keyCounterRef.current++}_${Date.now()}`} className="move-number variation-number">
            {move.moveNumber}...
          </span>
        );
      }
      // Note: Black moves in mainline don't get move numbers as they follow white moves

      // Add move button
      elements.push(
        <button
          key={`move_${keyCounterRef.current++}_${Date.now()}`}
          className={`move-btn ${isCurrentMove ? 'active' : ''} ${isVariation ? 'variation-move' : 'main-move'}`}
          onClick={() => {
            // For variation moves, check if it's a continuation or the original variation
            if (isVariation) {
              if (move.id.startsWith('continuation_')) {
                // This is a continuation move, navigate to it
                onVariationClick(move.id);
              } else {
                // This is the original variation move
                onVariationClick(move.id);
              }
            } else {
              onMoveClick(move.moveIndex);
            }
          }}
        >
          {move.move.san}
        </button>
      );

      // Add annotations and classifications as green circles next to moves
      const allAnnotations = [];
      
        // Add regular annotations
        if (move.annotations && move.annotations.length > 0) {
          move.annotations.forEach(annotation => {
            allAnnotations.push({
              key: `annotation_${keyCounterRef.current++}_${Date.now()}`,
              content: annotation.type === 'symbol' ? annotation.symbol : 
                      annotation.type === 'comment' ? '💬' :
                      annotation.type === 'arrow' ? '→' :
                      annotation.type === 'circle' ? '○' :
                      annotation.type === 'highlight' ? '★' : '',
              title: annotation.content || annotation.symbol || 'Annotation',
              onClick: () => onAnnotationClick(annotation.id)
            });
          });
        }
        
        // Add move classification
        if (move.classification) {
          allAnnotations.push({
            key: `classification_${keyCounterRef.current++}_${Date.now()}`,
            content: move.classification === 'brilliant' ? '!!' :
                    move.classification === 'great' ? '!' :
                    move.classification === 'good' ? '!' :
                    move.classification === 'inaccuracy' ? '?!' :
                    move.classification === 'mistake' ? '?' :
                    move.classification === 'blunder' ? '??' : '',
            title: `Move classification: ${move.classification}`,
            onClick: null
          });
        }
      
      // Render all annotations
      allAnnotations.forEach(annotation => {
        elements.push(
          <span
            key={annotation.key}
            className="annotation-circle"
            onClick={annotation.onClick}
            title={annotation.title}
          >
            {annotation.content}
          </span>
        );
      });

      // Add variations with proper chess notation formatting
      if (hasVariations) {
        console.log('🎯 Rendering variations for move:', move.move.san, 'variations:', move.sublines);
        console.log('🎯 Variation details:', move.sublines?.map(v => ({ san: v.move.san, isWhite: v.isWhite, sublines: v.sublines?.length || 0 })));
        if (isExpanded) {
          move.sublines!.forEach((variation, varIndex) => {
            // Add opening parenthesis for variation
            elements.push(
              <span key={`open_paren_${keyCounterRef.current++}`} className="variation-paren">
                {varIndex === 0 ? ' (' : ' ('}
              </span>
            );
            
            // Render variation moves - standard chess notation format
            // Render the variation move itself
            if (variation.isWhite) {
              elements.push(
                <span key={`var_white_num_${keyCounterRef.current++}`} className="move-number">
                  {variation.moveNumber}.
                </span>
              );
            } else {
              elements.push(
                <span key={`var_black_num_${keyCounterRef.current++}`} className="move-number variation-number">
                  {variation.moveNumber}...
                </span>
              );
            }
            
            elements.push(
              <button
                key={`var_move_${keyCounterRef.current++}`}
                className={`move-btn variation-move ${variation.moveIndex === currentMoveIndex ? 'active' : ''}`}
                onClick={() => onVariationClick(variation.id)}
              >
                {variation.move.san}
              </button>
            );
            
            // Render continuation moves as a linear sequence (not as nested sublines)
            if (variation.sublines && variation.sublines.length > 0) {
              console.log('🎯 Rendering continuations for variation:', variation.move.san, 'continuations:', variation.sublines.map(c => ({ san: c.move.san, isWhite: c.isWhite, moveNumber: c.moveNumber })));
              variation.sublines.forEach((continuation, contIndex) => {
                console.log(`🎯 Rendering continuation ${contIndex}:`, continuation.move.san, 'isWhite:', continuation.isWhite, 'moveNumber:', continuation.moveNumber);
                
                // Add move number for continuation moves
                if (continuation.isWhite) {
                  elements.push(
                    <span key={`var_cont_white_num_${keyCounterRef.current++}`} className="move-number">
                      {continuation.moveNumber}.
                    </span>
                  );
                } else {
                  elements.push(
                    <span key={`var_cont_black_num_${keyCounterRef.current++}`} className="move-number variation-number">
                      {continuation.moveNumber}...
                    </span>
                  );
                }
                
                elements.push(
                  <button
                    key={`var_continuation_${keyCounterRef.current++}`}
                    className={`move-btn variation-move ${continuation.moveIndex === currentMoveIndex ? 'active' : ''}`}
                    onClick={() => onVariationClick(continuation.id)}
                  >
                    {continuation.move.san}
                  </button>
                );
              });
            }
            
            // Add closing parenthesis for variation
            elements.push(
              <span key={`close_paren_${keyCounterRef.current++}`} className="variation-paren">
                )
              </span>
            );
          });
        } else {
          // Show collapsed variation indicator
          elements.push(
            <button
              key={`expand_${keyCounterRef.current++}_${Date.now()}`}
              className="expand-variation-btn"
              onClick={() => toggleVariation(variationId)}
              title={`Show ${move.sublines!.length} variation${move.sublines!.length > 1 ? 's' : ''}`}
            >
              +{move.sublines!.length}
            </button>
          );
        }
      }

      moveIndex++;
    }

    return elements;
  }, [currentMoveIndex, expandedVariations, onMoveClick, onVariationClick, onAnnotationClick, toggleVariation]);

  // PGN format rendering function
  const renderPGNFormat = useCallback(() => {
    if (!moveTree || moveTree.length === 0) {
      return <div className="no-moves">No moves available</div>;
    }
    
    const keyCounterRef = { current: 0 };
    return (
      <div className="pgn-format">
        {formatMoves(moveTree, 0, false, keyCounterRef)}
      </div>
    );
  }, [moveTree, formatMoves]);

  return (
    <div className={`move-tree ${className}`}>
      <div className="move-tree-header">
        <h3>Move Tree</h3>
        <div className="move-tree-controls">
          <button
            className="expand-all-btn"
            onClick={() => setExpandedVariations(new Set(moveTree.flatMap(node => 
              node.sublines.map(subline => subline.id)
            )))}
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
        {renderPGNFormat()}
      </div>
    </div>
  );
};