import React, { useState, useEffect, useRef } from 'react';
import { Chess } from 'chess.js';

// Import cm-chess
const CmChess = require('cm-chess');

interface GameAnnotatorProps {}

interface VariationNode {
  move?: string;
  comment?: string;
  nags?: number[];
  variations?: VariationNode[];
  fen?: string;
}

interface GameData {
  headers: Record<string, string>;
  mainline: VariationNode[];
}

const GameAnnotator: React.FC<GameAnnotatorProps> = () => {
  const [gameData, setGameData] = useState<GameData | null>(null);
  const [currentPosition, setCurrentPosition] = useState<string>('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
  const [currentPath, setCurrentPath] = useState<number[]>([]);
  const [currentMoveIndex, setCurrentMoveIndex] = useState<number>(0);
  const [chess, setChess] = useState<Chess>(new Chess());
  const [pgnInput, setPgnInput] = useState<string>('');
  const [showInput, setShowInput] = useState<boolean>(true);

  // Sample PGN with deep variations for testing
  const samplePGN = `[Event "Test Game with Deep Variations"]
[Site "ChessRep"]
[Date "2024.01.01"]
[Round "1"]
[White "Player 1"]
[Black "Player 2"]
[Result "*"]

1. e4 e5 (1... c5 {Sicilian Defense}) 2. Nf3 Nc6 (2... d6 {Philidor Defense}) 3. Bb5 a6 (3... Nf6 {Berlin Defense}) 4. Ba4 Nf6 5. O-O Be7 (5... Bc5 {Italian Game}) 6. Re1 b5 7. Bb3 d6 8. c3 O-O 9. h3 Nb8 (9... Na5 {Knight maneuver}) 10. d4 Nbd7 11. c4 c6 12. cxb5 axb5 13. Nc3 Bb7 14. Bg5 b4 15. Nb1 h6 16. Bh4 c5 17. dxe5 Nxe4 18. Bxe7 Qxe7 19. exd6 Qf6 20. Nbd2 Nxd6 21. Nc4 Nxc4 22. Bxc4 Nb6 23. Ne5 Rae8 24. Bxf7+ Rxf7 25. Nxf7 Rxe1+ 26. Qxe1 Kxf7 27. Qe3 Qg5 28. Qxg5 hxg5 29. b3 Ke6 30. a3 Kd6 31. axb4 cxb4 32. Ra5 Nd5 33. f3 Bc8 34. Kf2 Bf5 35. Ra7 g6 36. Ra6+ Kc5 37. Ke1 Nf4 38. g3 Nxh3 39. Kd2 Kb5 40. Rd6 Kc5 41. Ra6 Nf2 42. g4 Bd3 43. Re6 1-0`;

  // Load PGN using cm-chess
  const loadPGN = (pgn: string) => {
    try {
      const cmChess = new CmChess();
      const game = cmChess.loadPgn(pgn);
      
      if (game) {
        setGameData({
          headers: game.headers || {},
          mainline: game.mainline || []
        });
        
        // Reset position
        setCurrentPosition('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
        setCurrentPath([]);
        setCurrentMoveIndex(0);
        setChess(new Chess());
        setShowInput(false);
      }
    } catch (error) {
      console.error('Error loading PGN:', error);
      alert('Error loading PGN: ' + error.message);
    }
  };

  // Navigate to a specific position
  const navigateToPosition = (path: number[], moveIndex: number) => {
    setCurrentPath(path);
    setCurrentMoveIndex(moveIndex);
    
    // Rebuild position using chess.js
    const newChess = new Chess();
    let currentFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    
    // Navigate through the path
    let currentVariation = gameData?.mainline || [];
    for (let i = 0; i < path.length; i++) {
      const pathIndex = path[i];
      if (currentVariation[pathIndex]) {
        const move = currentVariation[pathIndex];
        if (move.move) {
          try {
            newChess.move(move.move);
            currentFen = newChess.fen();
          } catch (error) {
            console.error('Error making move:', move.move, error);
          }
        }
        
        // Navigate to variation if specified
        if (i < path.length - 1 && move.variations) {
          const nextPathIndex = path[i + 1];
          if (move.variations[nextPathIndex]) {
            currentVariation = move.variations[nextPathIndex].variations || [];
          }
        }
      }
    }
    
    setCurrentPosition(currentFen);
    setChess(newChess);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!gameData) return;
      
      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault();
          navigatePrevious();
          break;
        case 'ArrowRight':
          event.preventDefault();
          navigateNext();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [gameData, currentPath, currentMoveIndex]);

  const navigatePrevious = () => {
    if (currentMoveIndex > 0) {
      navigateToPosition(currentPath, currentMoveIndex - 1);
    }
  };

  const navigateNext = () => {
    if (gameData && currentMoveIndex < getTotalMoves()) {
      navigateToPosition(currentPath, currentMoveIndex + 1);
    }
  };

  const getTotalMoves = (): number => {
    if (!gameData) return 0;
    
    let totalMoves = 0;
    const countMoves = (variation: VariationNode[]): number => {
      return variation.reduce((count, node) => {
        if (node.move) {
          count++;
          if (node.variations) {
            node.variations.forEach(subVar => {
              count += countMoves([subVar]);
            });
          }
        }
        return count;
      }, 0);
    };
    
    return countMoves(gameData.mainline);
  };

  // Render variation tree
  const renderVariation = (variation: VariationNode[], path: number[] = [], level: number = 0): JSX.Element[] => {
    return variation.map((node, index) => {
      const currentPath = [...path, index];
      const isCurrentMove = JSON.stringify(currentPath) === JSON.stringify([...currentPath.slice(0, -1), currentMoveIndex]);
      
      return (
        <div key={index} style={{ marginLeft: `${level * 20}px` }}>
          {node.move && (
            <div
              onClick={() => navigateToPosition(currentPath, currentPath.length - 1)}
              style={{
                padding: '8px',
                margin: '4px 0',
                borderRadius: '6px',
                backgroundColor: isCurrentMove ? '#1E88E5' : '#f5f5f5',
                color: isCurrentMove ? 'white' : 'black',
                cursor: 'pointer',
                border: isCurrentMove ? '2px solid #0D47A1' : '1px solid #ddd',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ fontWeight: 'bold', fontSize: '16px' }}>
                {node.move}
              </div>
              {node.comment && (
                <div style={{ 
                  fontSize: '12px', 
                  fontStyle: 'italic',
                  marginTop: '4px',
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  padding: '4px',
                  borderRadius: '4px'
                }}>
                  💬 {node.comment}
                </div>
              )}
              {node.nags && node.nags.length > 0 && (
                <div style={{ 
                  fontSize: '12px', 
                  marginTop: '4px',
                  color: '#FF9800'
                }}>
                  NAGs: {node.nags.join(', ')}
                </div>
              )}
            </div>
          )}
          
          {/* Render sub-variations */}
          {node.variations && node.variations.length > 0 && (
            <div style={{ marginLeft: '20px' }}>
              {node.variations.map((subVar, subIndex) => (
                <div key={subIndex}>
                  <div style={{ 
                    fontSize: '12px', 
                    color: '#666', 
                    marginBottom: '4px',
                    fontStyle: 'italic'
                  }}>
                    Variation {subIndex + 1}:
                  </div>
                  {renderVariation([subVar], [...currentPath, subIndex], level + 1)}
                </div>
              ))}
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <div style={{ 
      padding: '20px', 
      fontFamily: 'system-ui, -apple-system, sans-serif',
      maxWidth: '1400px',
      margin: '0 auto'
    }}>
      <h1 style={{ color: '#1976D2', marginBottom: '20px' }}>
        🎯 Game Annotator with CM-Chess
      </h1>

      {showInput && (
        <div style={{ 
          marginBottom: '20px',
          padding: '20px',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
          border: '1px solid #e0e0e0'
        }}>
          <h3 style={{ marginBottom: '15px' }}>Load PGN</h3>
          <textarea
            value={pgnInput}
            onChange={(e) => setPgnInput(e.target.value)}
            placeholder="Paste your PGN here..."
            style={{
              width: '100%',
              height: '200px',
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontFamily: 'monospace',
              fontSize: '12px'
            }}
          />
          <div style={{ marginTop: '10px', display: 'flex', gap: '10px' }}>
            <button
              onClick={() => loadPGN(pgnInput)}
              style={{
                padding: '10px 20px',
                backgroundColor: '#1976D2',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              Load PGN
            </button>
            <button
              onClick={() => {
                setPgnInput(samplePGN);
                loadPGN(samplePGN);
              }}
              style={{
                padding: '10px 20px',
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              Load Sample PGN
            </button>
          </div>
        </div>
      )}

      {gameData && (
        <div style={{ display: 'flex', gap: '20px' }}>
          {/* Chess Board */}
          <div style={{ flex: '0 0 500px' }}>
            <div style={{
              width: '500px',
              height: '500px',
              border: '2px solid #333',
              borderRadius: '8px',
              backgroundColor: '#f0f0f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
              color: '#666'
            }}>
              Chess Board Placeholder
              <br />
              <small>FEN: {currentPosition.substring(0, 30)}...</small>
            </div>
            
            {/* Navigation Controls */}
            <div style={{ 
              marginTop: '15px', 
              display: 'flex', 
              gap: '10px',
              justifyContent: 'center'
            }}>
              <button
                onClick={navigatePrevious}
                disabled={currentMoveIndex <= 0}
                style={{
                  padding: '8px 16px',
                  backgroundColor: currentMoveIndex <= 0 ? '#e0e0e0' : '#1976D2',
                  color: currentMoveIndex <= 0 ? '#999' : 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: currentMoveIndex <= 0 ? 'not-allowed' : 'pointer'
                }}
              >
                ← Previous
              </button>
              <button
                onClick={navigateNext}
                disabled={currentMoveIndex >= getTotalMoves()}
                style={{
                  padding: '8px 16px',
                  backgroundColor: currentMoveIndex >= getTotalMoves() ? '#e0e0e0' : '#1976D2',
                  color: currentMoveIndex >= getTotalMoves() ? '#999' : 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: currentMoveIndex >= getTotalMoves() ? 'not-allowed' : 'pointer'
                }}
              >
                Next →
              </button>
            </div>
          </div>

          {/* Annotation Panel */}
          <div style={{ flex: '1', minWidth: '400px' }}>
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '8px',
              border: '1px solid #e0e0e0',
              padding: '20px',
              maxHeight: '600px',
              overflowY: 'auto'
            }}>
              <h3 style={{ marginBottom: '15px', color: '#1976D2' }}>
                Game Annotation
              </h3>
              
              {/* Game Headers */}
              <div style={{ 
                marginBottom: '20px',
                padding: '10px',
                backgroundColor: '#f8f9fa',
                borderRadius: '6px'
              }}>
                <h4 style={{ marginBottom: '10px' }}>Game Headers</h4>
                {Object.entries(gameData.headers).map(([key, value]) => (
                  <div key={key} style={{ fontSize: '12px', marginBottom: '4px' }}>
                    <strong>{key}:</strong> {value}
                  </div>
                ))}
              </div>

              {/* Move Tree */}
              <div>
                <h4 style={{ marginBottom: '15px' }}>Move Tree</h4>
                <div style={{ fontSize: '14px' }}>
                  {renderVariation(gameData.mainline)}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div style={{ 
        marginTop: '20px',
        padding: '15px',
        backgroundColor: '#e3f2fd',
        borderRadius: '8px',
        fontSize: '14px'
      }}>
        <h4 style={{ marginBottom: '10px' }}>Instructions:</h4>
        <ul style={{ margin: '0', paddingLeft: '20px' }}>
          <li>Load a PGN file or use the sample PGN with deep variations</li>
          <li>Click on any move in the annotation to navigate to that position</li>
          <li>Use arrow keys (← →) to navigate through moves</li>
          <li>All variations, sub-variations, comments, and NAGs are displayed</li>
          <li>The chess board shows the current position (placeholder for now)</li>
        </ul>
      </div>
    </div>
  );
};

export default GameAnnotator;
