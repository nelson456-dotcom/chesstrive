import React, { useState } from 'react';

// Chess piece Unicode mappings
const PIECES = {
  'K': '♔', 'Q': '♕', 'R': '♖', 'B': '♗', 'N': '♘', 'P': '♙',
  'k': '♚', 'q': '♛', 'r': '♜', 'b': '♝', 'n': '♞', 'p': '♟'
};

/**
 * Enhanced Game Tree Notation - Works with GameTreeManager structure
 */
const EnhancedGameTreeNotation = ({ tree, currentPath, currentMoveIndex, onMoveClick, onVariationMoveClick }) => {
  const [expandedVar, setExpandedVar] = useState({});

  if (!tree) {
    return (
      <div className="text-center text-gray-400 italic py-8">
        <div className="text-lg mb-2">🎯</div>
        <div>No tree data provided</div>
        <div className="text-xs mt-2">Tree is null or undefined</div>
      </div>
    );
  }

  // Convert move text to display with chess pieces
  const formatMove = (text) => {
    return text.replace(/[KQRBNP]/g, (match) => PIECES[match] || match);
  };

  // Helper function to get move number and turn for a move index
  const getMoveInfo = (moveIndex) => {
    const moveNumber = Math.floor(moveIndex / 2) + 1;
    const isWhiteMove = moveIndex % 2 === 0;
    return { moveNumber, isWhiteMove };
  };

  // Render a single move with its variations
  const renderMove = (move, moveIndex, depth = 0) => {
    const { moveNumber, isWhiteMove } = getMoveInfo(moveIndex);
    const movePrefix = isWhiteMove ? `${moveNumber}. ` : `${moveNumber}... `;
    const isCurrentMove = moveIndex === currentMoveIndex - 1;
    
    return (
      <div key={moveIndex} style={{ marginBottom: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', marginLeft: depth * 20 }}>
          <span style={{ 
            fontWeight: 'bold', 
            color: '#666',
            marginRight: 8,
            fontSize: '14px',
            minWidth: '40px'
          }}>
            {movePrefix}
          </span>
          <button 
            onClick={() => onMoveClick && onMoveClick(moveIndex)}
            style={{ 
              cursor: 'pointer',
              padding: '3px 6px',
              border: 'none',
              borderRadius: 3,
              background: isCurrentMove ? '#1976d2' : 'transparent',
              color: isCurrentMove ? 'white' : '#333',
              fontWeight: isCurrentMove ? 'bold' : 'normal',
              fontSize: '14px',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              if (!isCurrentMove) {
                e.target.style.background = '#f0f0f0';
              }
            }}
            onMouseLeave={(e) => {
              if (!isCurrentMove) {
                e.target.style.background = 'transparent';
              }
            }}
          >
            {formatMove(move?.notation || move?.move || '???')}
          </button>
        </div>
        
        {/* Render variations */}
        {move.variations && move.variations.length > 0 && (
          <div style={{ marginLeft: 20, marginTop: 4 }}>
            <div style={{ color: '#888', fontSize: '12px', marginBottom: 2 }}>(</div>
            {move.variations.map((variation, varIndex) => {
              const varKey = `${moveIndex}-${varIndex}`;
              const isExpanded = expandedVar[varKey];
              
              return (
                <div key={varIndex} style={{ marginLeft: 8 }}>
                  {/* Variation header with expand/collapse */}
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
                    <button
                      onClick={() => setExpandedVar(prev => ({ ...prev, [varKey]: !prev[varKey] }))}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '2px',
                        marginRight: 4,
                        fontSize: '12px',
                        color: '#666'
                      }}
                    >
                      {isExpanded ? '▼' : '▶'}
                    </button>
                    <span style={{ fontSize: '12px', color: '#666' }}>
                      Variation {varIndex + 1}
                    </span>
                  </div>
                  
                  {/* Variation content */}
                  {isExpanded && (
                    <div style={{ marginLeft: 16 }}>
                      {variation.moves && variation.moves.map((varMove, varMoveIndex) => {
                        const varMoveNumber = Math.floor((moveIndex + varMoveIndex + 1) / 2) + 1;
                        const varIsWhiteMove = (moveIndex + varMoveIndex + 1) % 2 === 0;
                        const varMovePrefix = varIsWhiteMove ? `${varMoveNumber}. ` : `${varMoveNumber}... `;
                        
                        return (
                          <div key={varMoveIndex} style={{ marginBottom: 4 }}>
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                              <span style={{ 
                                fontWeight: 'bold', 
                                color: '#666',
                                marginRight: 8,
                                fontSize: '14px',
                                minWidth: '40px'
                              }}>
                                {varMovePrefix}
                              </span>
                              <button 
                                onClick={() => {
                                  console.log('🎯 Variation move clicked:', varMove);
                                  if (onVariationMoveClick) {
                                    onVariationMoveClick(moveIndex, varMove?.notation || varMove?.move || varMove);
                                  }
                                }}
                                style={{ 
                                  cursor: 'pointer',
                                  padding: '3px 6px',
                                  border: 'none',
                                  borderRadius: 3,
                                  background: 'transparent',
                                  color: '#333',
                                  fontWeight: 'normal',
                                  fontSize: '14px',
                                  transition: 'all 0.2s ease'
                                }}
                                onMouseEnter={(e) => {
                                  e.target.style.background = '#f0f0f0';
                                }}
                                onMouseLeave={(e) => {
                                  e.target.style.background = 'transparent';
                                }}
                              >
                                {formatMove(varMove?.notation || varMove?.move || varMove || '???')}
                              </button>
                            </div>
                            
                            {/* Render nested variations */}
                            {varMove.variations && varMove.variations.length > 0 && (
                              <div style={{ marginLeft: 20, marginTop: 4 }}>
                                <div style={{ color: '#888', fontSize: '12px', marginBottom: 2 }}>(</div>
                                {varMove.variations.map((nestedVar, nestedVarIndex) => {
                                  const nestedVarKey = `${moveIndex}-${varIndex}-${nestedVarIndex}`;
                                  const isNestedExpanded = expandedVar[nestedVarKey];
                                  
                                  return (
                                    <div key={nestedVarIndex} style={{ marginLeft: 8 }}>
                                      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
                                        <button
                                          onClick={() => setExpandedVar(prev => ({ ...prev, [nestedVarKey]: !prev[nestedVarKey] }))}
                                          style={{
                                            background: 'none',
                                            border: 'none',
                                            cursor: 'pointer',
                                            padding: '2px',
                                            marginRight: 4,
                                            fontSize: '12px',
                                            color: '#666'
                                          }}
                                        >
                                          {isNestedExpanded ? '▼' : '▶'}
                                        </button>
                                        <span style={{ fontSize: '12px', color: '#666' }}>
                                          Nested Var {nestedVarIndex + 1}
                                        </span>
                                      </div>
                                      
                                      {isNestedExpanded && (
                                        <div style={{ marginLeft: 16 }}>
                                          {nestedVar.moves && nestedVar.moves.map((nestedMove, nestedMoveIndex) => {
                                            const nestedMoveNumber = Math.floor((moveIndex + varMoveIndex + nestedMoveIndex + 1) / 2) + 1;
                                            const nestedIsWhiteMove = (moveIndex + varMoveIndex + nestedMoveIndex + 1) % 2 === 0;
                                            const nestedMovePrefix = nestedIsWhiteMove ? `${nestedMoveNumber}. ` : `${nestedMoveNumber}... `;
                                            
                                            return (
                                              <div key={nestedMoveIndex} style={{ marginBottom: 4 }}>
                                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                                  <span style={{ 
                                                    fontWeight: 'bold', 
                                                    color: '#666',
                                                    marginRight: 8,
                                                    fontSize: '14px',
                                                    minWidth: '40px'
                                                  }}>
                                                    {nestedMovePrefix}
                                                  </span>
                                                  <button 
                                                    onClick={() => {
                                                      console.log('🎯 Nested variation move clicked:', nestedMove);
                                                      if (onVariationMoveClick) {
                                                        onVariationMoveClick(moveIndex, nestedMove?.notation || nestedMove?.move || nestedMove);
                                                      }
                                                    }}
                                                    style={{ 
                                                      cursor: 'pointer',
                                                      padding: '3px 6px',
                                                      border: 'none',
                                                      borderRadius: 3,
                                                      background: 'transparent',
                                                      color: '#333',
                                                      fontWeight: 'normal',
                                                      fontSize: '14px',
                                                      transition: 'all 0.2s ease'
                                                    }}
                                                    onMouseEnter={(e) => {
                                                      e.target.style.background = '#f0f0f0';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                      e.target.style.background = 'transparent';
                                                    }}
                                                  >
                                                    {formatMove(nestedMove?.notation || nestedMove?.move || nestedMove || '???')}
                                                  </button>
                                                </div>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                                <div style={{ color: '#888', fontSize: '12px', marginTop: 2 }}>)</div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
            <div style={{ color: '#888', fontSize: '12px', marginTop: 2 }}>)</div>
          </div>
        )}
      </div>
    );
  };

  // Render move sequence
  const renderMoveSequence = () => {
    if (!tree || !tree.moves || tree.moves.length === 0) {
      return (
        <div className="text-center text-gray-400 italic py-8">
          <div className="text-lg mb-2">🎯</div>
          <div>Make moves on the board to see them here</div>
          <div className="text-xs mt-2">Click pieces to move them</div>
        </div>
      );
    }
    
    return tree.moves.map((move, index) => renderMove(move, index));
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200" style={{ fontFamily: 'monospace', lineHeight: '1.6' }}>
      {/* Current position info */}
      <div className="mb-4 p-3 bg-blue-50 rounded">
        <h3 className="font-semibold text-blue-900 mb-1">Current Position:</h3>
        <p className="text-sm text-blue-800">
          {currentPath.length === 0 ? (
            'Main Line'
          ) : (
            <>
              Variation: <span className="font-mono">{currentPath.map((path, index) => {
                if (typeof path === 'object' && path.varIndex !== undefined) {
                  return `Var ${path.varIndex}`;
                }
                return `Step ${index + 1}`;
              }).join(' → ')}</span>
            </>
          )}
        </p>
        <p className="text-xs text-blue-700 mt-1">
          Move: <span className="font-mono">{currentMoveIndex}</span>
        </p>
      </div>
      
      {/* Notation display - HORIZONTAL LAYOUT */}
      <div className="flex flex-wrap gap-1 items-center p-3 bg-gray-50 rounded-lg">
        {tree.moves && tree.moves.length > 0 ? (
          tree.moves.map((move, index) => (
            <React.Fragment key={`move-${index}`}>
              {/* Move number every 2 moves (for white moves) */}
              {index % 2 === 0 && index > 0 && (
                <span className="text-gray-600 text-sm font-medium mx-1">
                  {Math.floor(index / 2) + 1}.
                </span>
              )}
              
              {/* Move button */}
              <button
                onClick={() => onMoveClick && onMoveClick(index)}
                className={`px-2 py-1 rounded text-sm font-medium transition-all duration-200 ${
                  index === currentMoveIndex - 1 
                    ? 'bg-blue-500 text-white shadow-md' 
                    : 'bg-white hover:bg-gray-100 border border-gray-300 text-gray-800'
                }`}
                style={{ 
                  cursor: 'pointer',
                  minWidth: '40px',
                  textAlign: 'center',
                  color: index === currentMoveIndex - 1 ? 'white' : '#1f2937'
                }}
                onMouseEnter={(e) => {
                  if (index !== currentMoveIndex - 1) {
                    e.target.style.backgroundColor = '#f3f4f6';
                    e.target.style.color = '#1f2937';
                  }
                }}
                onMouseLeave={(e) => {
                  if (index !== currentMoveIndex - 1) {
                    e.target.style.backgroundColor = 'white';
                    e.target.style.color = '#1f2937';
                  }
                }}
              >
                {formatMove(move?.notation || move?.move || '???')}
              </button>
              
              {/* Inline variations - show first move of each variation */}
              {move.variations && move.variations.length > 0 && (
                <span className="text-gray-600 text-xs ml-1">
                  ({move.variations.map((variation, varIndex) => {
                    const firstMove = variation.moves && variation.moves[0];
                    const moveText = firstMove ? (firstMove.notation || firstMove.move || firstMove) : '???';
                    return (
                      <span key={varIndex}>
                        {varIndex > 0 && ' '}
                        <button
                          onClick={() => onVariationMoveClick && onVariationMoveClick(index, moveText, varIndex)}
                          className="text-blue-600 hover:text-blue-800 underline bg-blue-50 px-1 py-0.5 rounded"
                          style={{ fontSize: '11px' }}
                        >
                          {formatMove(moveText)}
                        </button>
                        {/* Show continuation of variation inline if it exists */}
                        {variation.moves && variation.moves.length > 1 && (
                          <span className="text-gray-500">
                            {' '}
                            {variation.moves.slice(1).map((varMove, varMoveIndex) => {
                              const totalMoveIndex = index + varMoveIndex + 1;
                              const moveNumber = Math.floor(totalMoveIndex / 2) + 1;
                              const isWhiteMove = totalMoveIndex % 2 === 0;
                              const movePrefix = isWhiteMove ? `${moveNumber}. ` : `${moveNumber}... `;
                              
                              return (
                                <span key={varMoveIndex}>
                                  {isWhiteMove && <span className="text-gray-400">{moveNumber}.</span>}
                                  <button
                                    onClick={() => onVariationMoveClick && onVariationMoveClick(index, varMove?.notation || varMove?.move || varMove, varIndex)}
                                    className="text-blue-600 hover:text-blue-800 underline bg-blue-50 px-1 py-0.5 rounded ml-1"
                                    style={{ fontSize: '11px' }}
                                  >
                                    {formatMove(varMove?.notation || varMove?.move || varMove || '???')}
                                  </button>
                                </span>
                              );
                            })}
                          </span>
                        )}
                      </span>
                    );
                  })})
                </span>
              )}
            </React.Fragment>
          ))
        ) : (
          <div className="text-center text-gray-600 italic py-8 w-full">
            <div className="text-lg mb-2">🎯</div>
            <div>Make moves on the board to see them here</div>
            <div className="text-xs mt-2">Click pieces to move them</div>
          </div>
        )}
      </div>
      
      {/* Simplified variations section - only show if there are complex variations */}
      {tree.moves && tree.moves.some(move => move.variations && move.variations.length > 0) && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="text-sm font-semibold text-blue-800 mb-2">Current Variation Context:</h4>
          <div className="text-xs text-blue-700">
            {currentPath.length === 0 ? (
              <span>You are in the main line</span>
            ) : (
              <span>
                You are in variation: {currentPath.map((path, index) => {
                  if (typeof path === 'object' && path.varIndex !== undefined) {
                    return `Var ${path.varIndex}`;
                  }
                  return `Step ${index + 1}`;
                }).join(' → ')}
              </span>
            )}
          </div>
          <div className="text-xs text-blue-600 mt-1">
            New moves will be added to: {currentPath.length === 0 ? 'main line' : 'current variation'}
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedGameTreeNotation;