import React from 'react';

const VerticalMoveTree = ({ gameData }) => {
  if (!gameData || !gameData.moves) {
    return <div>No moves available</div>;
  }

  const renderMoves = (moves, depth = 0) => {
    const elements = [];
    let moveNumber = 1;
    let isWhiteMove = true;

    moves.forEach((moveData, index) => {
      // Generate unique key using multiple factors
      const uniqueKey = `vertical_${depth}_${index}_${moveData.move || 'unknown'}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      if (moveData.isMainLine) {
        // Main line moves
        elements.push(
          <div 
            key={uniqueKey}
            className={`move-line main-line depth-${depth}`}
            style={{ 
              marginLeft: `${depth * 20}px`,
              marginBottom: '2px',
              fontSize: '14px',
              fontFamily: 'monospace'
            }}
          >
            {isWhiteMove ? `${moveNumber}.` : `${moveNumber}...`} {moveData.move}
          </div>
        );

        // Toggle between white and black moves
        if (!isWhiteMove) {
          moveNumber++;
        }
        isWhiteMove = !isWhiteMove;

      } else if (moveData.isVariation) {
        // Alternative lines
        elements.push(
          <div 
            key={`alt_label_${uniqueKey}`}
            className={`alternative-label depth-${depth}`}
            style={{ 
              marginLeft: `${depth * 20}px`,
              marginTop: '8px',
              marginBottom: '2px',
              fontSize: '12px',
              fontStyle: 'italic',
              color: '#666'
            }}
          >
            Alternative line:
          </div>
        );

        elements.push(
          <div 
            key={`alt_move_${uniqueKey}`}
            className={`move-line variation-line depth-${depth}`}
            style={{ 
              marginLeft: `${(depth + 1) * 20}px`,
              marginBottom: '2px',
              fontSize: '14px',
              fontFamily: 'monospace',
              color: '#444'
            }}
          >
            {moveData.moveNumber || moveNumber}{moveData.isWhiteMove ? '.' : '...'} {moveData.move}
          </div>
        );

        // Handle sub-variations recursively
        if (moveData.variations && moveData.variations.length > 0) {
          elements.push(...renderMoves(moveData.variations, depth + 1));
        }
      }

      // Handle comments/annotations
      if (moveData.comment) {
        elements.push(
          <div 
            key={`comment_${uniqueKey}`}
            className={`move-comment depth-${depth}`}
            style={{ 
              marginLeft: `${(depth + 1) * 20}px`,
              marginBottom: '4px',
              fontSize: '12px',
              fontStyle: 'italic',
              color: '#008000'
            }}
          >
            {moveData.comment}
          </div>
        );
      }
    });

    return elements;
  };

  return (
    <div className="vertical-move-tree" style={{ 
      padding: '10px',
      backgroundColor: '#f9f9f9',
      border: '1px solid #ddd',
      borderRadius: '4px',
      fontFamily: 'monospace'
    }}>
      <h4 style={{ marginBottom: '10px', fontSize: '16px' }}>Move Analysis</h4>
      {renderMoves(gameData.moves)}
    </div>
  );
};

export default VerticalMoveTree;
