import React, { useState } from 'react';

// Test data as specified
const testMoves = [
  { white: "e4", black: "e5", number: 1 },
  { white: "Nf3", black: "Nc6", number: 2 },
  { white: "f4", black: "exf4", number: 2, isAlternative: true },
  { white: "Bb5", black: "a6", number: 3 },
  { white: "Ba4", black: "Nf6", number: 4 },
  { white: "O-O", black: "Be7", number: 5 },
  { white: "Re1", black: "b5", number: 6 },
  { white: "Bb3", black: "d6", number: 7 },
  { white: "c3", black: "O-O", number: 8 },
  { white: "h3", black: "Nb8", number: 9 },
  { white: "d4", black: "Nbd7", number: 10 },
  { white: "c4", black: "c6", number: 10, isAlternative: true }
];

const VerticalAnnotationSystem = () => {
  const [moves, setMoves] = useState(testMoves);
  const [selectedMove, setSelectedMove] = useState(null);

  // Group moves by move number for proper display
  const groupMovesByNumber = (moves) => {
    const grouped = {};
    moves.forEach(move => {
      if (!grouped[move.number]) {
        grouped[move.number] = [];
      }
      grouped[move.number].push(move);
    });
    return grouped;
  };

  const groupedMoves = groupMovesByNumber(moves);

  const handleMoveClick = (move) => {
    setSelectedMove(move);
  };

  const renderMove = (move, moveKey) => {
    const isSelected = selectedMove === move;
    
    return (
      <div 
        key={moveKey}
        className={`move-line ${move.isAlternative ? 'alternative-line' : 'main-line'} ${isSelected ? 'selected' : ''}`}
        onClick={() => handleMoveClick(move)}
      >
        {move.isAlternative && (
          <span className="alternative-indicator">Alternative line:</span>
        )}
        <span className="move-number">{move.number}.</span>
        <span className="white-move">{move.white}</span>
        {move.black && (
          <>
            <span className="move-number">{move.number}...</span>
            <span className="black-move">{move.black}</span>
          </>
        )}
        <span className="move-actions">
          <button 
            className="action-btn"
            onClick={(e) => {
              e.stopPropagation();
              console.log('Add annotation for move:', move);
            }}
            title="Add annotation"
          >
            +
          </button>
        </span>
      </div>
    );
  };

  const renderMoveGroup = (moveNumber, movesInGroup) => {
    const mainMove = movesInGroup.find(move => !move.isAlternative);
    const alternativeMoves = movesInGroup.filter(move => move.isAlternative);

    return (
      <div key={`group-${moveNumber}`} className="move-group">
        {/* Main line */}
        {mainMove && renderMove(mainMove, `main-${moveNumber}`)}
        
        {/* Alternative lines */}
        {alternativeMoves.map((move, index) => 
          renderMove(move, `alt-${moveNumber}-${index}`)
        )}
      </div>
    );
  };

  return (
    <div className="vertical-annotation-system">
      <div className="annotation-header">
        <h2>Chess Move Annotation System</h2>
        <p>Vertical format with alternative lines support</p>
      </div>
      
      <div className="moves-container">
        {Object.keys(groupedMoves)
          .sort((a, b) => parseInt(a) - parseInt(b))
          .map(moveNumber => 
            renderMoveGroup(parseInt(moveNumber), groupedMoves[moveNumber])
          )
        }
      </div>

      {selectedMove && (
        <div className="move-details">
          <h3>Selected Move Details</h3>
          <p><strong>Move Number:</strong> {selectedMove.number}</p>
          <p><strong>White:</strong> {selectedMove.white}</p>
          {selectedMove.black && <p><strong>Black:</strong> {selectedMove.black}</p>}
          {selectedMove.isAlternative && <p><strong>Type:</strong> Alternative line</p>}
        </div>
      )}

      <style>{`
        .vertical-annotation-system {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }

        .annotation-header {
          text-align: center;
          margin-bottom: 30px;
          color: #333;
        }

        .annotation-header h2 {
          margin: 0 0 10px 0;
          color: #2c3e50;
        }

        .moves-container {
          background: #f8f9fa;
          border: 1px solid #e9ecef;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 20px;
        }

        .move-group {
          margin-bottom: 15px;
        }

        .move-line {
          display: flex;
          align-items: center;
          padding: 8px 12px;
          margin: 4px 0;
          background: white;
          border: 1px solid #dee2e6;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 16px;
          line-height: 1.5;
        }

        .move-line:hover {
          background: #e3f2fd;
          border-color: #2196f3;
        }

        .move-line.selected {
          background: #bbdefb;
          border-color: #1976d2;
          box-shadow: 0 2px 4px rgba(25, 118, 210, 0.2);
        }

        .alternative-line {
          background: #fff3e0;
          border-left: 4px solid #ff9800;
          margin-left: 20px;
        }

        .alternative-line:hover {
          background: #ffe0b2;
        }

        .alternative-indicator {
          font-style: italic;
          color: #f57c00;
          margin-right: 10px;
          font-size: 14px;
        }

        .move-number {
          font-weight: bold;
          color: #495057;
          margin-right: 8px;
          min-width: 30px;
        }

        .white-move {
          color: #2c3e50;
          font-weight: 500;
          margin-right: 8px;
        }

        .black-move {
          color: #2c3e50;
          font-weight: 500;
        }

        .move-actions {
          margin-left: auto;
          display: flex;
          gap: 5px;
        }

        .action-btn {
          background: #6c757d;
          color: white;
          border: none;
          border-radius: 50%;
          width: 24px;
          height: 24px;
          font-size: 14px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }

        .action-btn:hover {
          background: #495057;
          transform: scale(1.1);
        }

        .move-details {
          background: #e8f5e8;
          border: 1px solid #4caf50;
          border-radius: 8px;
          padding: 20px;
          margin-top: 20px;
        }

        .move-details h3 {
          margin: 0 0 15px 0;
          color: #2e7d32;
        }

        .move-details p {
          margin: 8px 0;
          color: #333;
        }

        .move-details strong {
          color: #1b5e20;
        }

        @media (max-width: 600px) {
          .vertical-annotation-system {
            padding: 10px;
          }
          
          .move-line {
            font-size: 14px;
            padding: 6px 8px;
          }
          
          .alternative-line {
            margin-left: 10px;
          }
        }
      `}</style>
    </div>
  );
};

export default VerticalAnnotationSystem;
