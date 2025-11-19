import React from 'react';

const SimpleChessNotation = ({ gameTree, position, onMoveClick, onVariationClick }) => {
  // Format a single move with its variations
  const formatMoveWithVariations = (move, moveIndex, isWhite, moveNumber) => {
    const elements = [];
    
    // Move number for white moves
    if (isWhite) {
      elements.push(
        <span key={`num-${moveIndex}`} className="text-gray-600 font-semibold">
          {moveNumber}.
        </span>
      );
    }
    
    // Move notation
    elements.push(
      <span
        key={`move-${moveIndex}`}
        className="cursor-pointer px-1 py-0.5 rounded hover:bg-blue-100 text-blue-800"
        onClick={() => onMoveClick(moveIndex)}
      >
        {move.notation}
      </span>
    );
    
    // Variations
    if (move.variations && move.variations.length > 0) {
      elements.push(
        <span key={`var-${moveIndex}`} className="text-gray-500">
          {' '}(
        </span>
      );
      
      move.variations.forEach((variation, varIndex) => {
        if (variation.moves && variation.moves.length > 0) {
          elements.push(
            <span key={`var-${moveIndex}-${varIndex}`} className="text-gray-600">
              {isWhite ? `${moveNumber}...` : ''}
              {variation.moves.map((varMove, varMoveIndex) => (
                <span
                  key={`var-move-${moveIndex}-${varIndex}-${varMoveIndex}`}
                  className="cursor-pointer px-1 py-0.5 rounded hover:bg-green-100 text-green-800"
                  onClick={() => onVariationClick(moveIndex, varIndex, varMoveIndex)}
                >
                  {varMove.notation}
                </span>
              )).reduce((prev, curr, index) => [prev, ' ', curr])}
            </span>
          );
        }
      });
      
      elements.push(
        <span key={`var-end-${moveIndex}`} className="text-gray-500">
          )
        </span>
      );
    }
    
    return elements;
  };

  // Render the complete notation
  const renderNotation = () => {
    if (!gameTree || !gameTree.moves || gameTree.moves.length === 0) {
      return (
        <div className="text-gray-500 italic text-center py-4">
          No moves yet. Make moves on the board to see them here.
        </div>
      );
    }

    const elements = [];
    let moveNumber = 1;
    let isWhite = true;

    gameTree.moves.forEach((move, index) => {
      elements.push(
        <span key={`move-container-${index}`} className="inline-block mr-2">
          {formatMoveWithVariations(move, index, isWhite, moveNumber)}
        </span>
      );
      
      if (!isWhite) {
        moveNumber++;
      }
      isWhite = !isWhite;
    });

    return elements;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h3 className="font-bold text-lg mb-3 text-gray-700">Game Notation</h3>
      <div className="bg-gray-50 p-4 rounded border border-gray-200 min-h-24 font-mono text-sm leading-relaxed">
        {renderNotation()}
      </div>
      
      {/* Debug info */}
      <div className="mt-3 text-xs text-gray-500 bg-gray-100 p-2 rounded">
        <div>Total moves: {gameTree?.moves?.length || 0}</div>
        <div>Current position: {JSON.stringify(position)}</div>
      </div>
    </div>
  );
};

export default SimpleChessNotation;
