import React from 'react';
import { RecordedMove } from '../services/ChessGameRecordingService';

interface ChessMoveNotationProps {
  moves: RecordedMove[];
  currentMoveIndex: number;
  onMoveClick: (moveIndex: number) => void;
  onCommentClick?: (moveIndex: number) => void;
}

const ChessMoveNotation: React.FC<ChessMoveNotationProps> = ({
  moves,
  currentMoveIndex,
  onMoveClick,
  onCommentClick,
}) => {
  const renderMove = (move: RecordedMove, index: number) => {
    const isCurrentMove = index === currentMoveIndex;
    const moveClass = `move ${isCurrentMove ? 'current' : ''}`;

    return (
      <span key={move.id} className={moveClass}>
        <span
          className="move-text"
          onClick={() => onMoveClick(index)}
          style={{
            cursor: 'pointer',
            padding: '4px 6px',
            borderRadius: '4px',
            backgroundColor: isCurrentMove ? '#4CAF50' : 'transparent',
            color: isCurrentMove ? 'white' : 'inherit',
            fontWeight: isCurrentMove ? 'bold' : 'normal',
            margin: '1px',
            display: 'inline-block',
            minWidth: '30px',
            textAlign: 'center',
            transition: 'all 0.2s ease'
          }}
        >
          {move.san}
        </span>
        
        {/* Render comment if present */}
        {move.comment && (
          <span 
            className="comment" 
            onClick={() => onCommentClick?.(index)}
            style={{ 
              fontStyle: 'italic', 
              color: '#666', 
              marginLeft: '4px',
              fontSize: '0.9em',
              cursor: onCommentClick ? 'pointer' : 'default'
            }}
          >
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

  const renderMoves = () => {
    const moveElements: JSX.Element[] = [];
    let moveNumber = 1;

    for (let i = 0; i < moves.length; i++) {
      const move = moves[i];
      
      // Add move number for white moves
      if (move.color === 'w') {
        moveElements.push(
          <span key={`move-number-${moveNumber}`} className="move-number" style={{
            fontWeight: 'bold',
            marginRight: '8px',
            color: '#333',
            minWidth: '30px',
            display: 'inline-block'
          }}>
            {moveNumber}.
          </span>
        );
      }

      // Render the move
      moveElements.push(renderMove(move, i));

      // Add space between moves
      moveElements.push(<span key={`space-${move.id}`}> </span>);

      // Increment move number after black moves
      if (move.color === 'b') {
        moveNumber++;
      }
    }

    return moveElements;
  };

  return (
    <div className="chess-move-notation" style={{
      fontFamily: 'monospace',
      fontSize: '14px',
      lineHeight: '1.6',
      padding: '15px',
      backgroundColor: '#f8f9fa',
      borderRadius: '8px',
      border: '1px solid #dee2e6',
      maxHeight: '400px',
      overflowY: 'auto',
      whiteSpace: 'pre-wrap',
      wordBreak: 'break-word'
    }}>
      <div className="moves-container">
        {moves.length === 0 ? (
          <div style={{ 
            color: '#6c757d', 
            fontStyle: 'italic',
            textAlign: 'center',
            padding: '20px'
          }}>
            No moves yet. Start playing!
          </div>
        ) : (
          renderMoves()
        )}
      </div>
    </div>
  );
};

export default ChessMoveNotation;
