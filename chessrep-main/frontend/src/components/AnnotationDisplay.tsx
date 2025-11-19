import React from 'react';
import { ParsedMove } from '../services/PGNParser';

interface AnnotationDisplayProps {
  moves: ParsedMove[];
  currentMoveId: string | null;
  onMoveClick: (moveId: string) => void;
  onVariationClick: (parentMoveId: string, variationIndex: number, moveIndex: number) => void;
}

export const AnnotationDisplay: React.FC<AnnotationDisplayProps> = ({
  moves,
  currentMoveId,
  onMoveClick,
  onVariationClick
}) => {
  const renderMove = (move: ParsedMove, index: number, isInVariation: boolean = false, parentMoveId?: string, variationIndex?: number): React.ReactNode => {
    const isCurrentMove = move.id === currentMoveId;
    const moveNumber = move.moveNumber;

    const handleClick = () => {
      if (parentMoveId && variationIndex !== undefined) {
        onVariationClick(parentMoveId, variationIndex, index);
      } else {
        onMoveClick(move.id);
      }
    };

    return (
      <React.Fragment>
        {/* Move number for white moves or start of variation */}
        {(move.isWhite || (isInVariation && index === 0)) && (
          <span
            className="move-number"
            style={{ marginRight: '6px', cursor: 'pointer' }}
            onClick={handleClick}
          >
            {moveNumber}{move.isWhite ? '.' : '...'}
          </span>
        )}

        {/* The move itself */}
        <span
          className={`move ${isCurrentMove ? 'current-move' : ''} ${isInVariation ? 'variation-move' : 'main-move'}`}
          onClick={handleClick}
          style={{
            cursor: 'pointer',
            backgroundColor: isCurrentMove ? '#4CAF50' : 'transparent',
            color: isCurrentMove ? 'white' : isInVariation ? '#666' : '#000',
            padding: '2px 6px',
            borderRadius: '3px',
            margin: '0 4px',
            fontWeight: isCurrentMove ? 'bold' : 'normal',
            display: 'inline-block'
          }}
        >
          {move.san}
        </span>

        {/* NAGs (Numeric Annotation Glyphs) */}
        {move.nags && move.nags.map((nag, nagIndex) => (
          <span key={nagIndex} className="nag" style={{ color: '#888', fontSize: '0.9em', marginRight: '4px' }}>
            {getNAGSymbol(nag)}
          </span>
        ))}

        {/* Comments */}
        {move.comment && (
          <span className="comment" style={{
            color: '#008000',
            fontStyle: 'italic',
            margin: '0 6px',
            display: 'inline-block'
          }}>
            {`{${move.comment}}`}
          </span>
        )}

        {/* Variations */}
        {move.variations && move.variations.map((variation, varIndex) => (
          <div key={`${move.id}-var-${varIndex}`} className="variation" style={{ marginLeft: '20px', marginTop: '4px' }}>
            (
            {variation.map((varMove, varMoveIndex) => (
              <React.Fragment key={varMove.id}>
                {renderMove(varMove, varMoveIndex, true, move.id, varIndex)}
                {varMoveIndex < variation.length - 1 && <span style={{ marginRight: '6px' }}>{' '}</span>}
              </React.Fragment>
            ))}
            )
          </div>
        ))}
      </React.Fragment>
    );
  };

  const renderMoveSequence = (moveList: ParsedMove[]): React.ReactNode => {
    return moveList.map((move, index) => (
      <React.Fragment key={move.id}>
        {renderMove(move, index)}
        {index < moveList.length - 1 && ' '}
      </React.Fragment>
    ));
  };

  return (
    <div className="annotation-display" style={{
      fontFamily: 'monospace',
      fontSize: '14px',
      lineHeight: '1.6',
      padding: '16px',
      backgroundColor: '#f9f9f9',
      border: '1px solid #ddd',
      borderRadius: '4px',
      maxHeight: '400px',
      overflowY: 'auto'
    }}>
      {moves.length > 0 ? renderMoveSequence(moves) : (
        <div style={{ color: '#888', fontStyle: 'italic' }}>
          No moves to display
        </div>
      )}
    </div>
  );
};

// Helper function to convert NAG numbers to symbols
function getNAGSymbol(nag: number): string {
  const nagSymbols: Record<number, string> = {
    1: '!',     // Good move
    2: '?',     // Poor move
    3: '!!',    // Brilliant move
    4: '??',    // Blunder
    5: '!?',    // Interesting move
    6: '?!',    // Dubious move
    7: '□',     // Forced move
    8: '□',     // Singular move
    9: '??',    // Worst move
    10: '=',    // Equal position
    11: '=',    // Equal position
    12: '=',    // Equal position
    13: '∞',    // Unclear position
    14: '⩲',    // White is slightly better
    15: '⩱',    // Black is slightly better
    16: '±',    // White is better
    17: '∓',    // Black is better
    18: '+-',   // White is winning
    19: '-+',   // Black is winning
    20: '⨀',    // White is in zugzwang
    21: '⨀',    // Black is in zugzwang
    22: '⟳',    // White has space advantage
    23: '⟳',    // Black has space advantage
    24: '○',    // White has time advantage
    25: '○',    // Black has time advantage
    26: '◯',    // White has initiative
    27: '◯',    // Black has initiative
    28: '→',    // White has attack
    29: '→',    // Black has attack
    30: '⇆',    // White has counterplay
    31: '⇆',    // Black has counterplay
    32: '△',    // White has development advantage
    33: '△',    // Black has development advantage
    34: '⌓',    // White has weak point
    35: '⌓',    // Black has weak point
    36: '→',    // White has kingside attack
    37: '→',    // Black has kingside attack
    38: '→',    // White has queenside attack
    39: '→',    // Black has queenside attack
    40: '⟳',    // White has better endgame
    41: '⟳',    // Black has better endgame
    42: '⇆',    // White has compensation
    43: '⇆',    // Black has compensation
    44: '⟳',    // White has sufficient compensation
    45: '⟳',    // Black has sufficient compensation
  };

  return nagSymbols[nag] || `$${nag}`;
}