import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

// Chess piece Unicode mappings
const PIECES = {
  'K': '♔', 'Q': '♕', 'R': '♖', 'B': '♗', 'N': '♘', 'P': '♙',
  'k': '♚', 'q': '♛', 'r': '♜', 'b': '♝', 'n': '♞', 'p': '♟'
};

/**
 * GameTreeNotation - Working variation display component
 */
const GameTreeNotation = ({ tree, currentPath, currentMoveIndex, onMoveClick, onVariationMoveClick, chapterText }) => {
  const [expandedVar, setExpandedVar] = useState(null);

  if (!tree) {
    return <div className="text-red-500">❌ No tree data provided</div>;
  }

  // Convert move text to display with chess pieces
  const formatMove = (text) => {
    return text.replace(/[KQRBNP]/g, (match) => PIECES[match] || match);
  };

  // Individual move component with variations
  const MoveComponent = ({ move, moveIndex, variations, isMainLine = true }) => {
    // Highlight the move if we're at the position AFTER this move
    const isCurrentMove = moveIndex === currentMoveIndex - 1;
    
    return (
      <div className={`move-group ${!isMainLine ? 'variation-group' : ''}`}>
        <span 
          className={`move-text ${isCurrentMove ? 'current-move' : ''}`}
          onClick={() => onMoveClick && onMoveClick(moveIndex)}
          style={{ 
            cursor: 'pointer',
            padding: '2px 4px',
            borderRadius: '3px',
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={(e) => {
            if (!isCurrentMove) {
              e.target.style.backgroundColor = '#e5e7eb';
            }
          }}
          onMouseLeave={(e) => {
            if (!isCurrentMove) {
              e.target.style.backgroundColor = 'transparent';
            }
          }}
        >
          {formatMove(move?.notation || move?.move || move?.san || '???')}
        </span>

        {/* Display move comment if present */}
        {move?.comment && (
          <span 
            className="move-comment"
            style={{ 
              fontStyle: 'italic',
              color: '#059669',
              marginLeft: '6px',
              fontSize: '0.9em',
              display: 'inline-block'
            }}
          >
            {`{${move.comment}}`}
          </span>
        )}

        {variations && variations.length > 0 && (
          <div className="variations-container">
            {variations.map((variation, varIndex) => (
              <div key={variation.id} className="variation-item">
                <button
                  className="variation-toggle"
                  onClick={() =>
                    setExpandedVar(expandedVar === `${moveIndex}-${varIndex}` ? null : `${moveIndex}-${varIndex}`)
                  }
                >
                  {expandedVar === `${moveIndex}-${varIndex}` ? (
                    <ChevronDown size={16} />
                  ) : (
                    <ChevronRight size={16} />
                  )}
                  <span className="variation-label">
                    {Math.floor(moveIndex / 2) + 1}. {variation.moves && variation.moves[0] ? 
                      (typeof variation.moves[0] === 'string' ? variation.moves[0] : (variation.moves[0].notation || variation.moves[0].move || variation.moves[0].san || '???')) : 
                      '???'
                    }
                  </span>
                </button>

                {expandedVar === `${moveIndex}-${varIndex}` && (
                  <div className="variation-content">
                    <div className="variation-moves">
                      {variation.moves && variation.moves.length > 0 ? variation.moves.map((move, idx) => {
                        if (!move) {
                          console.warn(`⚠️ Undefined move at index ${idx} in variation ${varIndex}`);
                          return null;
                        }
                        
                        // Get move text and move number
                        const moveText = typeof move === 'string' ? move : (move.notation || move.move || move.san);
                        const displayNotation = typeof move === 'object' && move.displayNotation ? move.displayNotation : moveText;
                        
                        return (
                          <span key={idx} className="variation-move-container" style={{ display: 'inline-block', marginRight: '4px' }}>
                            <span 
                              className="variation-move"
                              onClick={() => {
                                console.log('🎯 Variation move clicked:', move);
                                console.log('🎯 Parent move index:', moveIndex);
                                console.log('🎯 Variation move index:', idx);
                                // Use the variation move click handler if available
                                if (onVariationMoveClick) {
                                  onVariationMoveClick(moveIndex, moveText);
                                } else if (onMoveClick) {
                                  // Fallback to parent move if no variation handler
                                  onMoveClick(moveIndex);
                                }
                              }}
                              style={{ 
                                cursor: 'pointer',
                                padding: '1px 3px',
                                borderRadius: '2px',
                                transition: 'background-color 0.2s'
                              }}
                              onMouseEnter={(e) => {
                                e.target.style.backgroundColor = '#f3f4f6';
                              }}
                              onMouseLeave={(e) => {
                                e.target.style.backgroundColor = 'transparent';
                              }}
                            >
                              {formatMove(displayNotation)}
                            </span>
                          </span>
                        );
                      }) : (
                        <span className="variation-move">No moves in variation</span>
                      )}
                    </div>
                  </div>
                )}
        </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Render move sequence
  const renderMoveSequence = () => {
    console.log('🔍 renderMoveSequence called');
    console.log('🔍 tree:', tree);
    console.log('🔍 tree.moves:', tree?.moves);
    console.log('🔍 tree.moves length:', tree?.moves?.length);
    
    if (!tree || !tree.moves || tree.moves.length === 0) {
        console.log('❌ renderMoveSequence: No moves to display');
        console.log('❌ tree exists:', !!tree);
        console.log('❌ tree.moves exists:', !!tree?.moves);
        console.log('❌ tree.moves length:', tree?.moves?.length);
        
        // If there's chapter text (from intro chapters), display it
        if (chapterText && chapterText.trim()) {
          return (
            <div className="p-4">
              <div 
                className="text-gray-700 leading-relaxed whitespace-pre-wrap"
                style={{ fontStyle: 'normal', fontSize: '14px' }}
              >
                {chapterText}
              </div>
            </div>
          );
        }
        
        return (
          <div className="text-center text-gray-400 italic py-8">
            <div className="text-lg mb-2">🎯</div>
            <div>Make moves on the board to see them here</div>
            <div className="text-xs mt-2">Click pieces to move them</div>
            <div className="text-xs mt-2">Debug: tree={!!tree}, moves={tree?.moves?.length || 0}</div>
          </div>
        );
      }
      
    console.log('✅ renderMoveSequence: Found moves, proceeding to render');
      
    const elements = [];
    let moveNumber = 1;

    tree.moves.forEach((move, index) => {
      // Add move number for white moves (even indices: 0, 2, 4...)
      if (index % 2 === 0) {
        elements.push(
          <span key={`moveNum-${moveNumber}`} className="move-number">
            {moveNumber}.
          </span>
        );
      }

      // Add the move
      elements.push(
        <MoveComponent
          key={`move-${index}`}
          move={move}
          moveIndex={index}
          variations={move.variations}
          isMainLine={true}
        />
      );

      // Increment move number after black's move
      if (index % 2 === 1) {
        moveNumber++;
      }
    });

    return elements;
  };

  // Main render - Enhanced debugging and more robust checks
  console.log('🔍 GameTreeNotation render check:');
  console.log('🔍 tree exists:', !!tree);
  console.log('🔍 tree.moves exists:', !!tree?.moves);
  console.log('🔍 tree.moves length:', tree?.moves?.length);
  console.log('🔍 tree.variations exists:', !!tree?.variations);
  console.log('🔍 tree.variations length:', tree?.variations?.length);
  
  if (!tree) {
    console.log('❌ No tree provided');
    return (
      <div className="text-center text-gray-400 italic py-8">
        <div className="text-lg mb-2">🎯</div>
        <div>No tree data provided</div>
        <div className="text-xs mt-2">Tree is null or undefined</div>
      </div>
    );
  }

  if (!tree.moves && !tree.variations) {
    console.log('❌ Tree has no moves or variations');
    return (
      <div className="text-center text-gray-400 italic py-8">
        <div className="text-lg mb-2">🎯</div>
        <div>Tree has no moves or variations</div>
        <div className="text-xs mt-2">Tree structure: {JSON.stringify(Object.keys(tree))}</div>
      </div>
    );
  }

  const hasContent = (tree.moves && tree.moves.length > 0) || 
                     (tree.variations && tree.variations.length > 0);

  if (!hasContent) {
    console.log('❌ Tree has no content');
    return (
      <div className="text-center text-gray-400 italic py-8">
        <div className="text-lg mb-2">🎯</div>
        <div>Tree has no content</div>
        <div className="text-xs mt-2">Moves: {tree.moves?.length || 0}, Variations: {tree.variations?.length || 0}</div>
      </div>
    );
  }

  console.log('✅ Tree has content, proceeding to render');

  return (
    <div className="space-y-3">
      {/* Current position info */}
      <div className="mb-3 p-2 bg-blue-50 rounded border border-blue-200">
        <div className="text-xs text-blue-800">
          <div>📍 <strong>Position:</strong> {currentPath.length === 0 ? 'Main Line' : `Variation: ${currentPath.map((path, index) => {
            if (typeof path === 'object' && path.varIndex !== undefined) {
              return `Var ${path.varIndex}`;
            }
            return `Step ${index + 1}`;
          }).join(' → ')}`}</div>
          <div>🎯 <strong>Move:</strong> {currentMoveIndex}</div>
        </div>
      </div>
      
      {/* Notation display */}
      <div className="game-notation-container">
        <div className="notation-display">
          {renderMoveSequence()}
        </div>
      </div>
    </div>
  );
};

export default GameTreeNotation;

// Add styles to document
const styles = `
  .game-notation-container {
    background: white;
    border-radius: 12px;
    padding: 24px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  }

  .notation-display {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: flex-start;
    font-family: 'Courier New', monospace;
    font-size: 16px;
    line-height: 1.8;
  }

  .move-number {
    font-weight: 600;
    color: #2d3748;
    margin-right: 4px;
    min-width: 30px;
  }

  .move-group {
    display: inline-flex;
    flex-direction: column;
    align-items: flex-start;
  }

  .move-text {
    padding: 6px 10px;
    background: #edf2f7;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 500;
    color: #1a202c;
    transition: all 0.2s;
  }

  .move-text:hover {
    background: #e2e8f0;
  }

  .move-text.current-move {
    background: #3182ce;
    color: white;
    font-weight: 600;
  }

  .variations-container {
    margin-top: 4px;
    margin-left: 8px;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .variation-item {
    background: #f7fafc;
    border-left: 3px solid #cbd5e0;
    border-radius: 4px;
    overflow: hidden;
  }

  .variation-toggle {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 10px;
    background: transparent;
    border: none;
    cursor: pointer;
    font-family: 'Courier New', monospace;
    font-size: 14px;
    color: #2d3748;
    transition: all 0.2s;
    width: 100%;
    text-align: left;
  }

  .variation-toggle:hover {
    background: #edf2f7;
  }

  .variation-label {
    font-weight: 500;
    color: #4a5568;
  }

  .variation-toggle svg {
    flex-shrink: 0;
    color: #718096;
  }

  .variation-content {
    padding: 8px 10px;
    background: #fafbfc;
    border-top: 1px solid #e2e8f0;
    animation: slideDown 0.2s ease-out;
  }

  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-4px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .variation-moves {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .variation-move {
    padding: 4px 8px;
    background: #fff5e6;
    border-radius: 4px;
    font-size: 13px;
    color: #744210;
    border: 1px solid #fbd38d;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .variation-move:hover {
    background: #fef3c7;
    border-color: #f59e0b;
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
`;

// Add styles to document
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.innerHTML = styles;
  document.head.appendChild(styleElement);
}