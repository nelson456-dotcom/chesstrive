import React from 'react';
import { ChessMomentsMove } from '../services/ChessMomentsService';

interface ChessMomentsAnnotationDisplayProps {
  moves: ChessMomentsMove[];
  currentMoveId: string | null;
  onMoveClick: (moveId: string) => void;
  onVariationClick: (parentMoveId: string, variationIndex: number, moveIndex: number) => void;
}

const ChessMomentsAnnotationDisplay: React.FC<ChessMomentsAnnotationDisplayProps> = ({
  moves,
  currentMoveId,
  onMoveClick,
  onVariationClick,
}) => {
  const renderMove = (move: ChessMomentsMove, isVariation: boolean = false) => {
    const isCurrentMove = currentMoveId === move.id;
    const moveClass = `move ${isCurrentMove ? 'current' : ''} ${isVariation ? 'variation' : ''}`;

    return (
      <span key={move.id} className={moveClass}>
        <span
          className="move-text"
          onClick={() => onMoveClick(move.id)}
          style={{
            cursor: 'pointer',
            padding: '2px 4px',
            borderRadius: '3px',
            backgroundColor: isCurrentMove ? '#4CAF50' : 'transparent',
            color: isCurrentMove ? 'white' : 'inherit',
            fontWeight: isCurrentMove ? 'bold' : 'normal',
            margin: '1px',
            display: 'inline-block',
            minWidth: '20px',
            textAlign: 'center'
          }}
        >
          {move.san}
        </span>
        
        {/* Render comment if present */}
        {move.comment && (
          <span className="comment" style={{ 
            fontStyle: 'italic', 
            color: '#666', 
            marginLeft: '4px',
            fontSize: '0.9em'
          }}>
            {move.comment}
          </span>
        )}
        
        {/* Render NAGs if present */}
        {move.nags && move.nags.length > 0 && (
          <span className="nags" style={{ 
            color: '#FF6B6B', 
            marginLeft: '2px',
            fontSize: '0.8em'
          }}>
            {move.nags.map(nag => {
              const nagSymbols: { [key: number]: string } = {
                1: '!', 2: '?', 3: '!!', 4: '??', 5: '!?', 6: '?!'
              };
              return nagSymbols[nag] || `$${nag}`;
            }).join(' ')}
          </span>
        )}
      </span>
    );
  };

  const renderVariations = (move: ChessMomentsMove) => {
    if (!move.variations || move.variations.length === 0) {
      return null;
    }

    return (
      <div className="variations" style={{ marginLeft: '20px', marginTop: '4px' }}>
        {move.variations.map((variation, variationIndex) => (
          <div key={`${move.id}-var-${variationIndex}`} className="variation">
            <span style={{ color: '#666', fontSize: '0.9em' }}>(</span>
            {variation.map((variationMove, moveIndex) => (
              <React.Fragment key={variationMove.id}>
                {renderMove(variationMove, true)}
                {moveIndex < variation.length - 1 && ' '}
              </React.Fragment>
            ))}
            <span style={{ color: '#666', fontSize: '0.9em' }}>)</span>
          </div>
        ))}
      </div>
    );
  };

  const renderMoves = () => {
    const moveElements: JSX.Element[] = [];
    let moveNumber = 1;

    for (let i = 0; i < moves.length; i++) {
      const move = moves[i];
      
      // Add move number for white moves
      if (move.isWhite) {
        moveElements.push(
          <span key={`move-number-${moveNumber}`} className="move-number" style={{
            fontWeight: 'bold',
            marginRight: '8px',
            color: '#333'
          }}>
            {moveNumber}.
          </span>
        );
      }

      // Render the move
      moveElements.push(renderMove(move));

      // Add space between moves
      moveElements.push(<span key={`space-${move.id}`}> </span>);

      // Render variations after the move
      moveElements.push(renderVariations(move));

      // Increment move number after black moves
      if (!move.isWhite) {
        moveNumber++;
      }
    }

    return moveElements;
  };

  return (
    <div className="chess-moments-annotation-display" style={{
      fontFamily: 'monospace',
      fontSize: '14px',
      lineHeight: '1.4',
      padding: '10px',
      backgroundColor: '#f9f9f9',
      borderRadius: '8px',
      border: '1px solid #ddd',
      maxHeight: '600px',
      overflowY: 'auto',
      whiteSpace: 'pre-wrap',
      wordBreak: 'break-word'
    }}>
      <div className="moves-container">
        {renderMoves()}
      </div>
    </div>
  );
};

export default ChessMomentsAnnotationDisplay;
