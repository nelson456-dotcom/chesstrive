import React, { useCallback, useMemo, useState } from 'react';

interface TraditionalNotationProps {
  moveAnnotation: any; // Move node from linked list structure
  selectedNodeId: string | null;
  currentPath: string[];
  onNodeSelect: (nodeId: string) => void;
  onNodeHover?: (nodeId: string | null) => void;
  maxDepth?: number;
  showComments?: boolean;
  showVariationCount?: boolean;
}

const TraditionalNotation: React.FC<TraditionalNotationProps> = ({
  moveAnnotation,
  selectedNodeId,
  currentPath,
  onNodeSelect,
  onNodeHover,
  maxDepth = 10,
  showComments = true,
  showVariationCount = true
}) => {
  // Convert Chess.js game to chess-analysis-board format
  const convertToChessAnalysisFormat = useCallback((game: any) => {
    console.log('TraditionalNotation - game object:', game);
    console.log('TraditionalNotation - game history:', game?.history?.());
    
    if (!game || !game.history) {
      console.log('No game or history method provided');
      return { moves: [], variations: [] };
    }
    
    // Get move history from Chess.js
    const history = game.history({ verbose: true });
    console.log('Game history (verbose):', history);
    
    if (history.length === 0) {
      console.log('No moves in game history');
      return { moves: [], variations: [] };
    }
    
    // Convert Chess.js moves to our format
    const moves = history.map((move: any, index: number) => {
      console.log(`Converting move ${index}:`, move);
      return {
        id: `move-${index}`,
        notation: move.san || '',
        from: move.from || '',
        to: move.to || '',
        piece: move.piece || '',
        captured: move.captured || null,
        fullMoveNumber: move.fullMoveNumber || Math.floor(index / 2) + 1,
        isWhite: move.color === 'w',
        comment: '',
        annotation: ''
      };
    });

    console.log('Converted moves:', moves);

    return {
      moves: moves,
      variations: []
    };
  }, []);

  // EXACT COPY of chess-analysis-board renderNotationTree function
  const renderNotationTree = useCallback((position: any, depth = 0, pathIndex: number[] = []) => {
    const isCurrentPath = JSON.stringify(pathIndex) === JSON.stringify(currentPath.slice(0, pathIndex.length));
    
    // For variations, only show the variation moves (not the complete sequence)
    let movesToShow = position.moves;
    let startingMoveNumber = 1;
    
    if (depth > 0) {
      // This is a variation - calculate the starting move number based on branch point
      const branchPoint = position.branchPoint || 0;
      startingMoveNumber = Math.floor(branchPoint / 2) + 1;
      movesToShow = position.moves;
    }
    
    // Group moves by move number for traditional display
    const groupedMoves = [];
    for (let i = 0; i < movesToShow.length; i += 2) {
      const whiteMove = movesToShow[i];
      const blackMove = movesToShow[i + 1];
      if (whiteMove) {
        groupedMoves.push({
          moveNumber: startingMoveNumber + Math.floor(i / 2),
          white: whiteMove,
          black: blackMove
        });
      }
    }
    
    return (
      <div className="notation-section" key={`${depth}-${pathIndex.join('-')}`}>
        {groupedMoves.length > 0 && (
          <div className={`moves-line ${isCurrentPath ? 'current-line' : ''} ${depth > 0 ? 'variation' : 'main-line'}`}>
            {depth > 0 && <span className="variation-indicator">({depth}) </span>}
            {groupedMoves.map((group: any, groupIdx: number) => {
              const whiteMoveIndex = groupIdx * 2;
              const blackMoveIndex = groupIdx * 2 + 1;
              const isWhiteCurrent = isCurrentPath && selectedNodeId?.includes(`${group.white?.id || group.moveNumber}-${group.white?.notation}-w`);
              const isBlackCurrent = isCurrentPath && selectedNodeId?.includes(`${group.black?.id || group.moveNumber}-${group.black?.notation}-b`);
              
              return (
                <div key={group.moveNumber} className="move-pair">
                  <span className="move-number">{group.moveNumber}</span>
                  <div className="move-buttons">
                    {group.white && (
                      <button
                        className={`move-btn white-move ${isWhiteCurrent ? 'current-move' : ''}`}
                        onClick={() => {
                          const nodeId = `${group.white.id || group.moveNumber}-${group.white.notation}-w`;
                          onNodeSelect(nodeId);
                        }}
                      >
                        {group.white.notation}
                      </button>
                    )}
                    {group.black && (
                      <button
                        className={`move-btn black-move ${isBlackCurrent ? 'current-move' : ''}`}
                        onClick={() => {
                          const nodeId = `${group.black.id || group.moveNumber}-${group.black.notation}-b`;
                          onNodeSelect(nodeId);
                        }}
                      >
                        {group.black.notation}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        {position.variations && position.variations.map((variation: any, idx: number) => (
          <div key={variation.id || idx} className="variation-container">
            {renderNotationTree(variation, depth + 1, [...pathIndex, idx + 1])}
          </div>
        ))}
      </div>
    );
  }, [selectedNodeId, currentPath, onNodeSelect]);

  const chessAnalysisData = useMemo(() => convertToChessAnalysisFormat(moveAnnotation), [moveAnnotation, convertToChessAnalysisFormat]);

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h3 className="font-semibold mb-3 text-gray-800">Game Notation</h3>
      <div className="notation-display space-y-2">
        {chessAnalysisData.moves.length > 0 ? (
          renderNotationTree(chessAnalysisData)
        ) : (
          <div className="text-center text-gray-500 italic py-4">
            No moves recorded yet
          </div>
        )}
      </div>

      <style>{`
        .move-btn {
          padding: 0.25rem 0.5rem;
          border-radius: 0.25rem;
          font-size: 0.875rem;
          transition: all 0.2s;
          cursor: pointer;
        }
        
        .move-btn:hover {
          background-color: #e5e7eb;
        }
        
        .move-btn.current-move {
          background-color: #10b981;
          color: white;
          font-weight: 600;
        }
        
        .moves-line {
          margin-bottom: 0.5rem;
        }
        
        .moves-line.main-line {
          font-weight: 500;
        }
        
        .moves-line.variation {
          color: #374151;
          margin-left: 1rem;
          font-size: 0.875rem;
        }
        
        .moves-line.current-line {
          background-color: #dbeafe;
          border-radius: 0.25rem;
          padding: 0.25rem 0.5rem;
        }
        
        .move-pair {
          display: flex;
          align-items: center;
          margin-bottom: 0.25rem;
        }
        
        .move-number {
          color: #4b5563;
          font-family: ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace;
          font-size: 0.875rem;
          margin-right: 0.5rem;
          width: 2rem;
          text-align: right;
        }
        
        .move-buttons {
          display: flex;
          gap: 0.5rem;
        }
        
        .white-move {
          background-color: white;
          border: 1px solid #d1d5db;
        }
        
        .black-move {
          background-color: #f3f4f6;
          border: 1px solid #d1d5db;
        }
        
        .variation-indicator {
          color: #2563eb;
          font-weight: 600;
          margin-right: 0.5rem;
        }
        
        .variation-container {
          border-left: 2px solid #e5e7eb;
          padding-left: 0.5rem;
          margin-left: 0.5rem;
          margin-top: 0.25rem;
        }
        
        .notation-display {
          font-family: ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace;
          font-size: 0.875rem;
        }
      `}</style>
    </div>
  );
};

export default TraditionalNotation;
