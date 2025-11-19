import React from 'react';

interface EvaluationBarProps {
  evaluation: number;
  isAnalyzing: boolean;
  depth: number;
  className?: string;
}

export const EvaluationBar: React.FC<EvaluationBarProps> = ({
  evaluation,
  isAnalyzing,
  depth,
  className = ''
}) => {
  // Convert centipawns to a percentage for display
  const getEvaluationPercentage = (cp: number) => {
    // Sigmoid function to map centipawns to 0-100%
    const sigmoid = (x: number) => 1 / (1 + Math.exp(-x / 200));
    return sigmoid(cp) * 100;
  };

  const getEvaluationText = (cp: number) => {
    if (Math.abs(cp) < 10) return 'Equal';
    if (cp > 0) {
      if (cp > 200) return 'White winning';
      if (cp > 100) return 'White better';
      return 'White slightly better';
    } else {
      if (cp < -200) return 'Black winning';
      if (cp < -100) return 'Black better';
      return 'Black slightly better';
    }
  };

  const percentage = getEvaluationPercentage(evaluation);
  const isWhiteAdvantage = evaluation > 0;
  const evaluationText = getEvaluationText(evaluation);

  return (
    <div className={`evaluation-bar ${className}`}>
      <div className="evaluation-container">
        <div className="evaluation-label">
          <span className="evaluation-text">{evaluationText}</span>
          <span className="evaluation-value">
            {evaluation > 0 ? '+' : ''}{evaluation.toFixed(1)}cp
          </span>
        </div>
        
        <div className="evaluation-bar-container">
          <div className="evaluation-bar-fill">
            <div
              className={`evaluation-fill ${isWhiteAdvantage ? 'white-advantage' : 'black-advantage'}`}
              style={{
                width: `${isWhiteAdvantage ? percentage : 100 - percentage}%`,
                marginLeft: isWhiteAdvantage ? '0' : 'auto'
              }}
            />
          </div>
        </div>

        <div className="evaluation-info">
          <span className="depth-info">
            {isAnalyzing ? `Analyzing... (d${depth})` : `Depth ${depth}`}
          </span>
        </div>
      </div>
    </div>
  );
};

export default EvaluationBar;

