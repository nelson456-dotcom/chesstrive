import React, { useState, useCallback } from 'react';
import { MoveNode, Annotation } from '../types/chess';

interface AnnotationPanelProps {
  moveTree: MoveNode[];
  currentMoveIndex: number;
  onAnnotationClick: (annotationId: string) => void;
  onAddAnnotation: (moveIndex: number, annotation: Omit<Annotation, 'id' | 'createdAt'>) => void;
  onRemoveAnnotation: (annotationId: string) => void;
  className?: string;
}

interface AnnotationItem {
  id: string;
  moveIndex: number;
  move: string;
  moveNumber: number;
  isWhite: boolean;
  annotation: Annotation;
  depth: number;
  isMainLine: boolean;
  parentId?: string;
}

export const AnnotationPanel: React.FC<AnnotationPanelProps> = ({
  moveTree,
  currentMoveIndex,
  onAnnotationClick,
  onAddAnnotation,
  onRemoveAnnotation,
  className = ''
}) => {
  const [selectedAnnotation, setSelectedAnnotation] = useState<string | null>(null);
  const [editingAnnotation, setEditingAnnotation] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'symbol' | 'comment' | 'variation'>('all');
  const [showVariations, setShowVariations] = useState(true);

  // Flatten the move tree to get all annotations with their context
  const getAllAnnotations = useCallback((nodes: MoveNode[], depth = 0, parentId?: string): AnnotationItem[] => {
    const annotations: AnnotationItem[] = [];
    
    nodes.forEach(node => {
      node.annotations.forEach(annotation => {
        annotations.push({
          id: annotation.id,
          moveIndex: node.moveIndex,
          move: node.move.san,
          moveNumber: node.moveNumber,
          isWhite: node.isWhite,
          annotation,
          depth,
          isMainLine: node.isMainLine,
          parentId
        });
      });

      // Recursively get annotations from sublines
      if (showVariations && node.sublines.length > 0) {
        const sublineAnnotations = getAllAnnotations(node.sublines, depth + 1, node.id);
        annotations.push(...sublineAnnotations);
      }
    });

    return annotations;
  }, [showVariations]);

  const allAnnotations = getAllAnnotations(moveTree);

  const filteredAnnotations = allAnnotations.filter(item => {
    if (filterType === 'all') return true;
    if (filterType === 'variation') return item.depth > 0;
    return item.annotation.type === filterType;
  });

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

  const handleEditAnnotation = useCallback((annotationId: string, newContent: string) => {
    // This would need to be implemented in the game service
    console.log('Edit annotation:', annotationId, newContent);
  }, []);

  const getSymbolDisplay = (symbol: string) => {
    const symbolMap: { [key: string]: string } = {
      '!!': 'Brilliant',
      '!': 'Good',
      '!?': 'Interesting',
      '?!': 'Dubious',
      '?': 'Mistake',
      '??': 'Blunder',
      '∞': 'Unclear',
      '=': 'Equal',
      '±': 'White advantage',
      '∓': 'Black advantage',
      '+−': 'White winning',
      '−+': 'Black winning'
    };
    return symbolMap[symbol] || symbol;
  };

  const getDepthIndicator = (depth: number) => {
    return '  '.repeat(depth) + (depth > 0 ? '└─ ' : '');
  };

  return (
    <div className={`annotation-panel ${className}`}>
      <div className="annotation-header">
        <h3>Annotations</h3>
        <div className="annotation-controls">
          <div className="filter-controls">
            <label>Filter:</label>
            <select value={filterType} onChange={(e) => setFilterType(e.target.value as any)}>
              <option value="all">All</option>
              <option value="symbol">Symbols</option>
              <option value="comment">Comments</option>
              <option value="variation">Variations</option>
            </select>
          </div>
          
          <div className="view-controls">
            <label>
              <input
                type="checkbox"
                checked={showVariations}
                onChange={(e) => setShowVariations(e.target.checked)}
              />
              Show Variations
            </label>
          </div>
        </div>
      </div>

      <div className="annotation-list">
        {filteredAnnotations.map((item) => (
          <div
            key={item.id}
            className={`annotation-item ${item.depth > 0 ? 'variation' : 'main-line'} ${selectedAnnotation === item.id ? 'selected' : ''}`}
            onClick={() => setSelectedAnnotation(item.id)}
          >
            <div className="annotation-move">
              <span className="depth-indicator">{getDepthIndicator(item.depth)}</span>
              <span className="move-number">
                {item.isWhite ? `${item.moveNumber}.` : ''}
              </span>
              <span className="move-text">{item.move}</span>
              {item.depth > 0 && (
                <span className="variation-indicator">(variation)</span>
              )}
            </div>

            <div className="annotation-content">
              {item.annotation.type === 'symbol' && (
                <div className="symbol-annotation">
                  <span className="symbol">{item.annotation.symbol}</span>
                  <span className="symbol-meaning">
                    {getSymbolDisplay(item.annotation.symbol || '')}
                  </span>
                </div>
              )}

              {item.annotation.type === 'comment' && (
                <div className="comment-annotation">
                  <span className="comment-icon">💬</span>
                  <span className="comment-text">{item.annotation.content}</span>
                </div>
              )}
            </div>

            <div className="annotation-actions">
              <button
                className="edit-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingAnnotation(item.id);
                }}
              >
                Edit
              </button>
              <button
                className="remove-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveAnnotation(item.id);
                }}
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredAnnotations.length === 0 && (
        <div className="no-annotations">
          <p>No annotations found</p>
        </div>
      )}

      {/* Add new annotation */}
      <div className="add-annotation">
        <h4>Add Annotation</h4>
        
        <div className="add-comment">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            rows={3}
          />
          <button onClick={() => handleAddComment(currentMoveIndex)}>
            Add Comment
          </button>
        </div>

        <div className="add-symbols">
          <label>Add Symbol:</label>
          <div className="symbol-buttons">
            {['!!', '!', '!?', '?!', '?', '??', '∞', '=', '±', '∓'].map(symbol => (
              <button
                key={symbol}
                onClick={() => handleAddSymbol(currentMoveIndex, symbol)}
                className="symbol-btn"
                title={getSymbolDisplay(symbol)}
              >
                {symbol}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Edit annotation modal */}
      {editingAnnotation && (
        <div className="edit-modal">
          <div className="modal-content">
            <h4>Edit Annotation</h4>
            <textarea
              defaultValue={allAnnotations.find(a => a.id === editingAnnotation)?.annotation.content || ''}
              rows={3}
            />
            <div className="modal-actions">
              <button onClick={() => setEditingAnnotation(null)}>Cancel</button>
              <button onClick={() => setEditingAnnotation(null)}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnnotationPanel;

