// Complete Move Tree Component that displays all variations and nested variations
import React, { useState, useCallback, useMemo } from 'react';
import { MoveNode } from '../types/chess';
import { AlgebraicNotationRenderer, RenderedMove } from '../services/AlgebraicNotationRenderer';

interface CompleteMoveTreeProps {
  moveTree: MoveNode[];
  currentMoveIndex: number;
  onMoveClick: (moveId: string) => void;
  onVariationClick: (variationId: string) => void;
  onAnnotationClick?: (annotationId: string) => void;
  className?: string;
}

export const CompleteMoveTree: React.FC<CompleteMoveTreeProps> = ({
  moveTree,
  currentMoveIndex,
  onMoveClick,
  onVariationClick,
  onAnnotationClick,
  className = ''
}) => {
  const [expandedMoves, setExpandedMoves] = useState<Set<string>>(new Set());
  const [showAllVariations, setShowAllVariations] = useState(false);

  const renderer = useMemo(() => new AlgebraicNotationRenderer(), []);

  // Render complete notation with all variations
  const renderedMoves = useMemo(() => {
    console.log('🎯 CompleteMoveTree rendering with moveTree:', moveTree);
    console.log('🎯 CompleteMoveTree currentMoveIndex:', currentMoveIndex);
    return renderer.renderCompleteNotation(moveTree);
  }, [moveTree, renderer, currentMoveIndex]);

  // Toggle move expansion
  const toggleMoveExpansion = useCallback((moveId: string) => {
    setExpandedMoves(prev => {
      const newSet = new Set(prev);
      if (newSet.has(moveId)) {
        newSet.delete(moveId);
      } else {
        newSet.add(moveId);
      }
      return newSet;
    });
  }, []);

  // Toggle all variations visibility
  const toggleAllVariations = useCallback(() => {
    setShowAllVariations(prev => !prev);
  }, []);

  // Render a single move with all its variations
  const renderMove = useCallback((move: RenderedMove, depth: number = 0): JSX.Element => {
    const isExpanded = expandedMoves.has(move.id);
    const hasVariations = move.variations.length > 0;
    // Get current move ID from move tree
    const currentMoveId = moveTree[currentMoveIndex]?.id;
    const isCurrentMove = move.id === currentMoveId;

    return (
      <div key={move.id} className={`move-container depth-${depth}`}>
        {/* Main move */}
        <div className={`move-line ${move.isMainLine ? 'main-line' : 'variation-line'} ${isCurrentMove ? 'current-move' : ''}`}>
          {/* Move number for white moves */}
          {move.isWhiteMove && (
            <span className="move-number">
              {move.moveNumber}.
            </span>
          )}

          {/* Move button */}
          <button
            className={`move-button ${move.isMainLine ? 'main-move' : 'variation-move'} ${isCurrentMove ? 'active' : ''}`}
            onClick={() => onMoveClick(move.id)}
            title={`Click to go to move ${move.moveNumber}${move.isWhiteMove ? '' : '...'}${move.move}`}
          >
            <span className="move-text">{move.move}</span>
            {isCurrentMove && <span className="current-indicator">●</span>}
          </button>

          {/* Annotations */}
          {move.annotations.map(annotation => (
            <span
              key={annotation.id}
              className={`annotation ${annotation.type}`}
              onClick={() => onAnnotationClick?.(annotation.id)}
              title={annotation.content || annotation.symbol || 'Annotation'}
            >
              {annotation.type === 'symbol' ? annotation.symbol : 
               annotation.type === 'comment' ? '💬' :
               annotation.type === 'arrow' ? '→' :
               annotation.type === 'circle' ? '○' :
               annotation.type === 'highlight' ? '★' : ''}
            </span>
          ))}

          {/* Variation toggle button */}
          {hasVariations && (
            <button
              className="variation-toggle"
              onClick={() => toggleMoveExpansion(move.id)}
              title={isExpanded ? 'Hide variations' : 'Show variations'}
            >
              <span className={`toggle-icon ${isExpanded ? 'expanded' : 'collapsed'}`}>
                {isExpanded ? '▼' : '▶'}
              </span>
              <span className="variation-count">
                {move.variations.length}
              </span>
            </button>
          )}
        </div>

        {/* Variations */}
        {hasVariations && (isExpanded || showAllVariations) && (
          <div className="variations-container">
            {move.variations.map((variation, index) => (
              <div key={`${move.id}-var-${index}`} className="variation-block">
                {/* Variation opening parenthesis */}
                <span className="variation-paren">
                  {index === 0 ? ' (' : ' ('}
                </span>

                {/* Variation moves */}
                <div className="variation-moves">
                  {renderMove(variation, depth + 1)}
                </div>

                {/* Variation closing parenthesis */}
                <span className="variation-paren">)</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }, [expandedMoves, showAllVariations, currentMoveIndex, onMoveClick, onVariationClick, onAnnotationClick, toggleMoveExpansion]);

  // Render all moves
  const renderAllMoves = useCallback(() => {
    return renderedMoves.map((move, index) => (
      <div key={move.id} className="move-item">
        {renderMove(move)}
      </div>
    ));
  }, [renderedMoves, renderMove]);

  return (
    <div className={`complete-move-tree ${className}`}>
      {/* Header */}
      <div className="move-tree-header">
        <h3>Move Tree</h3>
        <div className="move-count">
          {moveTree.length} moves
        </div>
      </div>

      {/* Controls */}
      <div className="move-tree-controls">
        <button
          className="control-button primary"
          onClick={toggleAllVariations}
        >
          {showAllVariations ? 'Hide All Variations' : 'Show All Variations'}
        </button>
        <button
          className="control-button secondary"
          onClick={() => setExpandedMoves(new Set())}
        >
          Collapse All
        </button>
        <button
          className="control-button success"
          onClick={() => {
            const pgn = renderer.generateCompletePGN(moveTree);
            navigator.clipboard.writeText(pgn);
          }}
        >
          Copy PGN
        </button>
      </div>

      {/* Move tree */}
      <div className="move-tree-content">
        {moveTree.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">♔</div>
            <p>No moves yet</p>
            <small>Start playing to see moves here</small>
          </div>
        ) : (
          renderAllMoves()
        )}
      </div>
    </div>
  );
};

// CSS styles for the complete move tree
export const completeMoveTreeStyles = `
.complete-move-tree {
  font-family: 'JetBrains Mono', monospace;
  font-size: 14px;
  line-height: 1.4;
  color: #333;
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  padding: 16px;
  max-height: 600px;
  overflow-y: auto;
}

.move-tree-controls {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid #dee2e6;
}

.control-button {
  background: #007bff;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: background-color 0.2s;
}

.control-button:hover {
  background: #0056b3;
}

.move-tree-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.move-container {
  display: flex;
  flex-direction: column;
  margin-bottom: 8px;
}

.move-line {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.move-line.main-line {
  background: #fff;
  border: 1px solid #dee2e6;
}

.move-line.variation-line {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  margin-left: 16px;
}

.move-line.current-move {
  background: #e3f2fd;
  border-color: #2196f3;
}

.move-number {
  color: #666;
  font-weight: 500;
  min-width: 24px;
  text-align: right;
}

.move-button {
  background: none;
  border: none;
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
  font-family: inherit;
  font-size: inherit;
  transition: background-color 0.2s;
}

.move-button.main-move {
  color: #333;
  font-weight: 500;
}

.move-button.variation-move {
  color: #666;
  font-weight: 400;
}

.move-button:hover {
  background: #e9ecef;
}

.move-button.active {
  background: #007bff;
  color: white;
}

.annotation {
  background: #4caf50;
  color: white;
  border-radius: 50%;
  width: 18px;
  height: 18px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
  margin-left: 4px;
}

.annotation:hover {
  background: #45a049;
  transform: scale(1.1);
}

.annotation.comment {
  background: #2196f3;
}

.annotation.symbol {
  background: #ff9800;
}

.annotation.arrow {
  background: #9c27b0;
}

.annotation.circle {
  background: #4caf50;
}

.annotation.highlight {
  background: #f44336;
}

.variation-toggle {
  background: none;
  border: none;
  padding: 2px 4px;
  cursor: pointer;
  font-size: 12px;
  color: #666;
  margin-left: 4px;
}

.variation-toggle:hover {
  color: #333;
}

.variations-container {
  margin-left: 16px;
  margin-top: 4px;
}

.variation-block {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  margin-bottom: 4px;
}

.variation-paren {
  color: #666;
  font-weight: 500;
  margin: 0 2px;
}

.variation-moves {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
}

.pgn-export {
  margin-top: 16px;
  padding-top: 8px;
  border-top: 1px solid #dee2e6;
}

/* Depth-based indentation */
.move-container.depth-1 {
  margin-left: 16px;
}

.move-container.depth-2 {
  margin-left: 32px;
}

.move-container.depth-3 {
  margin-left: 48px;
}

.move-container.depth-4 {
  margin-left: 64px;
}

/* Responsive design */
@media (max-width: 768px) {
  .complete-move-tree {
    font-size: 12px;
    padding: 12px;
  }
  
  .move-line {
    padding: 2px 4px;
  }
  
  .move-button {
    padding: 2px 4px;
  }
}
`;
