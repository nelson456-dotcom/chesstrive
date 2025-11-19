import React, { useState, useEffect, useCallback } from 'react';
import { MoveNode, GameState, Annotation } from '../types/chess';
import './ChessAnnotationSystem.css';

/**
 * ChessAnnotationSystem - A comprehensive move tree component for chess analysis
 * 
 * This component provides a vertical move tree display that shows:
 * - Main line moves with proper numbering
 * - Variations and sub-variations with indentation
 * - Move selection and highlighting
 * - Integration with chess board position
 * - Support for annotations and comments
 * 
 * Features:
 * - Hierarchical move display (main line, variations, sub-variations)
 * - Click-to-select moves with visual feedback
 * - Proper chess notation formatting
 * - Responsive design with scrollable container
 * - Integration with existing board components
 */

interface ChessAnnotationSystemProps {
  /** Array of move nodes representing the game tree */
  moveTree: MoveNode[];
  /** Current move index in the main line */
  currentMoveIndex: number;
  /** Callback when a move is selected */
  onMoveSelect?: (moveIndex: number, moveNode: MoveNode) => void;
  /** Callback when a variation is selected */
  onVariationSelect?: (parentMoveIndex: number, variationIndex: number) => void;
  /** Callback when an annotation is clicked */
  onAnnotationClick?: (annotation: Annotation) => void;
  /** Additional CSS classes */
  className?: string;
  /** Maximum height for the scrollable container */
  maxHeight?: string;
}

interface MoveDisplayData {
  move: string;
  player: 'white' | 'black';
  number: number;
  moveIndex: number;
  isMainLine: boolean;
  annotations: Annotation[];
  variations?: VariationDisplayData[];
  parentMoveIndex?: number;
  variationIndex?: number;
}

interface VariationDisplayData {
  atMove: number;
  atPlayer: 'white' | 'black';
  moves: MoveDisplayData[];
  subVariations?: VariationDisplayData[];
}

const ChessAnnotationSystem: React.FC<ChessAnnotationSystemProps> = ({
  moveTree,
  currentMoveIndex,
  onMoveSelect,
  onVariationSelect,
  onAnnotationClick,
  className = '',
  maxHeight = '500px'
}) => {
  // State for tracking selected move and UI interactions
  const [selectedMove, setSelectedMove] = useState<string | null>(null);
  const [expandedVariations, setExpandedVariations] = useState<Set<string>>(new Set());

  /**
   * Converts MoveNode array to display-friendly format
   * This function transforms the complex MoveNode structure into a simpler format
   * that's easier to render in the UI
   */
  const convertMoveTreeToDisplayFormat = useCallback((nodes: MoveNode[]): MoveDisplayData[] => {
    const result: MoveDisplayData[] = [];
    let moveNumber = 1;
    let isWhiteMove = true;

    nodes.forEach((node, index) => {
      if (node.isMainLine) {
        // Main line moves - these are the primary game moves
        result.push({
          move: node.move.san,
          player: node.isWhite ? 'white' : 'black',
          number: moveNumber,
          moveIndex: node.moveIndex,
          isMainLine: true,
          annotations: node.annotations || [],
          variations: node.sublines?.length > 0 ? convertVariationsToDisplayFormat(node.sublines, node.moveIndex) : undefined
        });

        // Increment move number after black moves
        if (!isWhiteMove) {
          moveNumber++;
        }
        isWhiteMove = !isWhiteMove;
      }
    });

    return result;
  }, []);

  /**
   * Converts variation nodes to display format
   * Handles the complex nested structure of chess variations
   */
  const convertVariationsToDisplayFormat = useCallback((sublines: MoveNode[], parentMoveIndex: number): VariationDisplayData[] => {
    const variations: VariationDisplayData[] = [];
    
    sublines.forEach((subline, index) => {
      if (!subline.isMainLine) {
        // This is a variation
        const variationMoves: MoveDisplayData[] = [];
        let varMoveNumber = Math.floor(parentMoveIndex / 2) + 1;
        let isVarWhiteMove = parentMoveIndex % 2 === 0;

        // First, add the root variation move itself
        variationMoves.push({
          move: subline.move.san,
          player: subline.isWhite ? 'white' : 'black',
          number: varMoveNumber,
          moveIndex: subline.moveIndex,
          isMainLine: false,
          annotations: subline.annotations || [],
          parentMoveIndex,
          variationIndex: index
        });

        // Update move number and color for subsequent moves
        if (!isVarWhiteMove) {
          varMoveNumber++;
        }
        isVarWhiteMove = !isVarWhiteMove;

        // Then add any continuation moves (sublines)
        subline.sublines?.forEach((move) => {
          variationMoves.push({
            move: move.move.san,
            player: move.isWhite ? 'white' : 'black',
            number: varMoveNumber,
            moveIndex: move.moveIndex,
            isMainLine: false,
            annotations: move.annotations || [],
            parentMoveIndex,
            variationIndex: index
          });

          if (!isVarWhiteMove) {
            varMoveNumber++;
          }
          isVarWhiteMove = !isVarWhiteMove;
        });

        variations.push({
          atMove: parentMoveIndex + 1,
          atPlayer: parentMoveIndex % 2 === 0 ? 'white' : 'black',
          moves: variationMoves,
          subVariations: subline.sublines?.length > 1 ? convertVariationsToDisplayFormat(subline.sublines, subline.moveIndex) : undefined
        });
      }
    });

    return variations;
  }, []);

  // Convert move tree to display format
  const displayData = convertMoveTreeToDisplayFormat(moveTree);
  
  // Debug logging
  useEffect(() => {
    console.log('🎯 ChessAnnotationSystem - moveTree:', moveTree);
    console.log('🎯 ChessAnnotationSystem - displayData:', displayData);
  }, [moveTree, displayData]);

  /**
   * Handles move selection and triggers callbacks
   * @param moveData - The move data that was clicked
   * @param isVariation - Whether this is a variation move
   */
  const handleMoveClick = useCallback((moveData: MoveDisplayData, isVariation: boolean = false) => {
    const moveKey = `${moveData.moveIndex}_${moveData.player}_${moveData.move}`;
    setSelectedMove(moveKey);

    if (isVariation && moveData.parentMoveIndex !== undefined && moveData.variationIndex !== undefined) {
      // This is a variation move
      onVariationSelect?.(moveData.parentMoveIndex, moveData.variationIndex);
    } else {
      // This is a main line move
      const moveNode = moveTree.find(node => node.moveIndex === moveData.moveIndex);
      if (moveNode) {
        onMoveSelect?.(moveData.moveIndex, moveNode);
      }
    }
  }, [moveTree, onMoveSelect, onVariationSelect]);

  /**
   * Handles annotation clicks
   * @param annotation - The annotation that was clicked
   */
  const handleAnnotationClick = useCallback((annotation: Annotation) => {
    onAnnotationClick?.(annotation);
  }, [onAnnotationClick]);

  /**
   * Toggles variation expansion state
   * @param variationKey - Unique key for the variation
   */
  const toggleVariation = useCallback((variationKey: string) => {
    setExpandedVariations(prev => {
      const newSet = new Set(prev);
      if (newSet.has(variationKey)) {
        newSet.delete(variationKey);
      } else {
        newSet.add(variationKey);
      }
      return newSet;
    });
  }, []);

  /**
   * Renders a single move with proper formatting and styling
   * @param moveData - The move data to render
   * @param indent - Indentation level for visual hierarchy
   * @param index - Index in the current level
   * @param prefix - Prefix for unique key generation
   */
  const renderMove = useCallback((moveData: MoveDisplayData, indent: number, index: number, prefix: string) => {
    const uniqueKey = `${prefix}_move_${moveData.number}_${moveData.player}_${moveData.move}_${indent}_${index}`;
    const isSelected = selectedMove === `${moveData.moveIndex}_${moveData.player}_${moveData.move}`;
    const isCurrentMove = moveData.moveIndex === currentMoveIndex;

    return (
      <div 
        key={uniqueKey}
        className={`move-item ${isSelected ? 'selected' : ''} ${isCurrentMove ? 'current' : ''}`}
        style={{
          marginLeft: `${indent * 20}px`,
          padding: '4px 8px',
          cursor: 'pointer',
          backgroundColor: isSelected ? '#e3f2fd' : isCurrentMove ? '#fff3e0' : 'transparent',
          borderRadius: '4px',
          fontSize: '14px',
          fontFamily: 'monospace',
          border: isCurrentMove ? '1px solid #ff9800' : '1px solid transparent',
          transition: 'all 0.2s ease',
          marginBottom: '2px'
        }}
        onClick={() => handleMoveClick(moveData, !moveData.isMainLine)}
        onMouseEnter={(e) => {
          if (!isSelected && !isCurrentMove) {
            e.currentTarget.style.backgroundColor = '#f5f5f5';
          }
        }}
        onMouseLeave={(e) => {
          if (!isSelected && !isCurrentMove) {
            e.currentTarget.style.backgroundColor = 'transparent';
          }
        }}
      >
        {/* Move number and notation */}
        <span style={{ fontWeight: isCurrentMove ? 'bold' : 'normal' }}>
          {moveData.player === 'white' ? `${moveData.number}.` : `${moveData.number}...`} {moveData.move}
        </span>

        {/* Annotations */}
        {moveData.annotations.map((annotation, annIndex) => (
          <span
            key={`${uniqueKey}_annotation_${annIndex}`}
            className="annotation-symbol"
            style={{
              marginLeft: '4px',
              color: annotation.symbol === '!' || annotation.symbol === '!!' ? '#4caf50' : 
                     annotation.symbol === '?' || annotation.symbol === '??' ? '#f44336' : '#ff9800',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
            onClick={(e) => {
              e.stopPropagation();
              handleAnnotationClick(annotation);
            }}
            title={annotation.content || `Annotation: ${annotation.symbol}`}
          >
            {annotation.symbol}
          </span>
        ))}

        {/* Comment indicator */}
        {moveData.annotations.some(ann => ann.type === 'comment' && ann.content) && (
          <span style={{ marginLeft: '4px', color: '#666', fontSize: '12px' }}>💬</span>
        )}
      </div>
    );
  }, [selectedMove, currentMoveIndex, handleMoveClick, handleAnnotationClick]);

  /**
   * Renders a variation with all its moves and sub-variations
   * @param variation - The variation data to render
   * @param indent - Indentation level
   * @param index - Index in the current level
   * @param prefix - Prefix for unique key generation
   */
  const renderVariation = useCallback((variation: VariationDisplayData, indent: number, index: number, prefix: string) => {
    const variationKey = `${prefix}_var_${index}`;
    const isExpanded = expandedVariations.has(variationKey);
    const elements: JSX.Element[] = [];

    // Variation header with expand/collapse functionality
    elements.push(
      <div 
        key={`${variationKey}_header`}
        className="variation-header"
        style={{
          marginLeft: `${indent * 20}px`,
          marginTop: '8px',
          marginBottom: '4px',
          fontSize: '12px',
          fontStyle: 'italic',
          color: '#666',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}
        onClick={() => toggleVariation(variationKey)}
      >
        <span style={{ fontSize: '10px' }}>
          {isExpanded ? '▼' : '▶'}
        </span>
        <span>
          Alternative at {variation.atMove}{variation.atPlayer === 'white' ? '.' : '...'}:
        </span>
      </div>
    );

    // Variation moves (only if expanded)
    if (isExpanded) {
      variation.moves.forEach((move, moveIndex) => {
        elements.push(renderMove(move, indent + 1, moveIndex, variationKey));
      });

      // Sub-variations
      if (variation.subVariations) {
        variation.subVariations.forEach((subVar, subIndex) => {
          elements.push(
            <div 
              key={`${variationKey}_sub_${subIndex}_header`}
              className="sub-variation-header"
              style={{
                marginLeft: `${(indent + 1) * 20}px`,
                marginTop: '6px',
                marginBottom: '2px',
                fontSize: '11px',
                fontStyle: 'italic',
                color: '#888',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
              onClick={() => toggleVariation(`${variationKey}_sub_${subIndex}`)}
            >
              <span style={{ fontSize: '9px' }}>
                {expandedVariations.has(`${variationKey}_sub_${subIndex}`) ? '▼' : '▶'}
              </span>
              <span>
                Sub-alternative at {subVar.atMove}{subVar.atPlayer === 'white' ? '.' : '...'}:
              </span>
            </div>
          );

          if (expandedVariations.has(`${variationKey}_sub_${subIndex}`)) {
            subVar.moves.forEach((move, moveIndex) => {
              elements.push(renderMove(move, indent + 2, moveIndex, `${variationKey}_sub_${subIndex}`));
            });
          }
        });
      }
    }

    return elements;
  }, [expandedVariations, toggleVariation, renderMove]);

  // Auto-expand variations that contain the current move
  useEffect(() => {
    if (currentMoveIndex >= 0) {
      // Find and expand variations containing the current move
      const expandVariationsContainingMove = (variations: VariationDisplayData[], parentPrefix: string) => {
        variations.forEach((variation, index) => {
          const variationKey = `${parentPrefix}_var_${index}`;
          const containsCurrentMove = variation.moves.some(move => move.moveIndex === currentMoveIndex);
          
          if (containsCurrentMove) {
            setExpandedVariations(prev => new Set([...prev, variationKey]));
          }

          if (variation.subVariations) {
            expandVariationsContainingMove(variation.subVariations, variationKey);
          }
        });
      };

      // Check main line moves for variations
      displayData.forEach((moveData, index) => {
        if (moveData.variations) {
          expandVariationsContainingMove(moveData.variations, `main_${index}`);
        }
      });
    }
  }, [currentMoveIndex, displayData]);

  // Keyboard navigation support
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return; // Don't handle keyboard events when typing in inputs
      }

      switch (event.key) {
        case 'ArrowUp':
          event.preventDefault();
          // Navigate to previous move
          if (currentMoveIndex > 0) {
            const prevMove = moveTree.find(node => node.moveIndex === currentMoveIndex - 1);
            if (prevMove) {
              handleMoveClick({
                move: prevMove.move.san,
                player: prevMove.isWhite ? 'white' : 'black',
                number: prevMove.moveNumber,
                moveIndex: prevMove.moveIndex,
                isMainLine: prevMove.isMainLine,
                annotations: prevMove.annotations || []
              });
            }
          }
          break;
        case 'ArrowDown':
          event.preventDefault();
          // Navigate to next move
          if (currentMoveIndex < moveTree.length - 1) {
            const nextMove = moveTree.find(node => node.moveIndex === currentMoveIndex + 1);
            if (nextMove) {
              handleMoveClick({
                move: nextMove.move.san,
                player: nextMove.isWhite ? 'white' : 'black',
                number: nextMove.moveNumber,
                moveIndex: nextMove.moveIndex,
                isMainLine: nextMove.isMainLine,
                annotations: nextMove.annotations || []
              });
            }
          }
          break;
        case 'Home':
          event.preventDefault();
          // Go to first move
          if (moveTree.length > 0) {
            const firstMove = moveTree[0];
            handleMoveClick({
              move: firstMove.move.san,
              player: firstMove.isWhite ? 'white' : 'black',
              number: firstMove.moveNumber,
              moveIndex: firstMove.moveIndex,
              isMainLine: firstMove.isMainLine,
              annotations: firstMove.annotations || []
            });
          }
          break;
        case 'End':
          event.preventDefault();
          // Go to last move
          if (moveTree.length > 0) {
            const lastMove = moveTree[moveTree.length - 1];
            handleMoveClick({
              move: lastMove.move.san,
              player: lastMove.isWhite ? 'white' : 'black',
              number: lastMove.moveNumber,
              moveIndex: lastMove.moveIndex,
              isMainLine: lastMove.isMainLine,
              annotations: lastMove.annotations || []
            });
          }
          break;
      }
    };

    // Add keyboard event listener
    document.addEventListener('keydown', handleKeyPress);
    
    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [currentMoveIndex, moveTree, handleMoveClick]);

  return (
    <div className={`chess-annotation-system ${className}`} style={{ 
      backgroundColor: '#f9f9f9',
      border: '1px solid #ddd',
      borderRadius: '8px',
      padding: '16px',
      fontFamily: 'Arial, sans-serif',
      maxHeight,
      overflowY: 'auto'
    }}>
      {/* Header */}
      <div style={{ 
        marginBottom: '16px', 
        fontWeight: 'bold', 
        fontSize: '16px', 
        color: '#333',
        borderBottom: '2px solid #e0e0e0',
        paddingBottom: '8px'
      }}>
        Move Analysis
      </div>

      {/* Main line moves */}
      <div style={{ marginBottom: '8px' }}>
        <div style={{ 
          fontSize: '12px', 
          fontWeight: 'bold', 
          color: '#333',
          marginBottom: '8px',
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          Main Line:
        </div>
        {displayData.map((move, index) => (
          <div key={`main_${index}`}>
            {renderMove(move, 0, index, "main")}
            
            {/* Variations for this move */}
            {move.variations?.map((variation, varIndex) => 
              renderVariation(variation, 1, varIndex, `main_${index}`)
            )}
          </div>
        ))}
      </div>

      {/* Selected move info */}
      {selectedMove && (
        <div style={{
          marginTop: '16px',
          padding: '12px',
          backgroundColor: '#e3f2fd',
          borderRadius: '6px',
          fontSize: '12px',
          border: '1px solid #bbdefb'
        }}>
          <strong>Selected:</strong> {selectedMove}
        </div>
      )}

      {/* Instructions */}
      <div style={{
        marginTop: '16px',
        padding: '8px',
        backgroundColor: '#f0f0f0',
        borderRadius: '4px',
        fontSize: '11px',
        color: '#666',
        fontStyle: 'italic'
      }}>
        💡 Click moves to navigate • Click variations to expand/collapse • Hover for details
      </div>
    </div>
  );
};

export default ChessAnnotationSystem;
