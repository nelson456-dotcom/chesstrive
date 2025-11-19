import React from 'react';

interface EngineMove {
  move: string;
  evaluation: number;
  depth: number;
  nodes: number;
  time: number;
  pv?: string[];
  continuation?: string[];
  mate?: number;
}

interface EngineLinesProps {
  moves: EngineMove[];
  onMoveClick: (move: string) => void;
  isAnalyzing: boolean;
  className?: string;
}

export const EngineLines: React.FC<EngineLinesProps> = ({
  moves,
  onMoveClick,
  isAnalyzing,
  className = ''
}) => {
  const formatEvaluation = (evaluation: number) => {
    if (Math.abs(evaluation) > 1000) {
      return evaluation > 0 ? `+M${Math.ceil((1000 - evaluation) / 100)}` : `-M${Math.ceil((1000 + evaluation) / 100)}`;
    }
    return evaluation > 0 ? `+${evaluation.toFixed(1)}` : evaluation.toFixed(1);
  };

  const formatTime = (time: number) => {
    if (time < 1000) return `${time}ms`;
    return `${(time / 1000).toFixed(1)}s`;
  };

  const formatNodes = (nodes: number) => {
    if (nodes < 1000) return nodes.toString();
    if (nodes < 1000000) return `${(nodes / 1000).toFixed(1)}K`;
    return `${(nodes / 1000000).toFixed(1)}M`;
  };

  return (
    <div className={`engine-lines ${className}`}>
      <div className="engine-lines-header">
        <h3>Engine Lines</h3>
        {isAnalyzing && (
          <div className="analyzing-indicator">
            <div className="spinner" />
            <span>Analyzing...</span>
          </div>
        )}
      </div>

      <div className="engine-lines-list">
        {moves.map((move, index) => (
          <div key={index} className="engine-line">
            <div className="line-header">
              <span className="line-number">#{index + 1}</span>
              <span className="line-evaluation">{formatEvaluation(move.evaluation)}</span>
            </div>
            
            <div className="line-move" onClick={() => onMoveClick(move.move)}>
              <span className="move-text">{move.move}</span>
            </div>

            <div className="line-details">
              <span className="depth">d{move.depth}</span>
              <span className="nodes">{formatNodes(move.nodes)}</span>
              <span className="time">{formatTime(move.time)}</span>
            </div>

            {move.pv && move.pv.length > 0 && (
              <div className="line-pv">
                <span className="pv-label">Full Continuation:</span>
                <div className="pv-moves">
                  {move.pv.map((moveText, pvIndex) => (
                    <span 
                      key={pvIndex}
                      className={`pv-move ${pvIndex === 0 ? 'first-move' : ''}`}
                      onClick={() => onMoveClick(moveText)}
                      title={`Click to play ${moveText}`}
                    >
                      {moveText}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {move.continuation && move.continuation.length > 0 && (
              <div className="line-continuation">
                <span className="continuation-label">Continuation:</span>
                <div className="continuation-moves">
                  {move.continuation.map((moveText, contIndex) => (
                    <span 
                      key={contIndex}
                      className="continuation-move"
                      onClick={() => onMoveClick(moveText)}
                      title={`Click to play ${moveText}`}
                    >
                      {moveText}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {move.mate && (
              <div className="mate-indicator">
                <span className="mate-text">
                  {move.mate > 0 ? `Mate in ${move.mate}` : `Mate in ${Math.abs(move.mate)}`}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {moves.length === 0 && !isAnalyzing && (
        <div className="no-lines">
          <p>No engine lines available</p>
        </div>
      )}
    </div>
  );
};

export default EngineLines;
