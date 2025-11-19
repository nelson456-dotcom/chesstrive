import React, { useState } from 'react';
import FullAnnotationChessBoard from './FullAnnotationChessBoard';
import CMChessFullAnnotationBoard from './CMChessFullAnnotationBoard';

const samplePGN = `[Event "Fischer vs Spassky"]
[Site "Reykjavik"]
[Date "1972.07.11"]
[Round "1"]
[White "Fischer, Robert James"]
[Black "Spassky, Boris V"]
[Result "1-0"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 {Ruy Lopez} a6 4. Ba4 Nf6 5. O-O Be7 
6. Re1 b5 7. Bb3 d6 8. c3 O-O 9. h3 Nb8 10. d4 Nbd7 
11. c4 c6 12. cxb5 axb5 13. Nc3 Bb7 14. Bg5 b4 15. Nb1 h6 
16. Bh4 c5 17. dxe5 Nxe4 18. Bxe7 Qxe7 19. exd6 Qf6 
20. Nbd2 Nxd6 21. Nc4 Nxc4 22. Bxc4 Nb6 23. Ne5 Rae8 
24. Bxf7+ Rxf7 25. Nxf7 Rxe1+ 26. Qxe1 Kxf7 27. Qe3 Qg5 
28. Qxg5 hxg5 29. b3 Ke6 30. a3 Kd6 31. axb4 cxb4 
32. Ra5 Nd5 33. f3 Bc8 34. Kf2 Bf5 35. Ra7 g6 36. Ra6+ Kc5 
37. Ke1 Nf4 38. g3 Nxh3 39. Kd2 Kb5 40. Rd6 Kc5 41. Ra6 Nf2 
42. g4 Bd3 43. Re6 1-0`;

const complexPGN = `[Event "Complex Variations Example"]
[Site "Test"]
[Date "2024.01.01"]
[Round "1"]
[White "Player A"]
[Black "Player B"]
[Result "*"]

1. e4 e5 2. Nf3 Nc6 3. Bc4 {Italian Game} 
(3. Bb5 {Ruy Lopez} a6 4. Ba4 Nf6 5. O-O Be7 
  (5... b5 {Marshall Attack} 6. Bb3 Bb7 7. Re1 Bc5 
    (7... d6 {Alternative} 8. c3 O-O 9. h3 {Quiet continuation})
    8. c3 d6 9. d4 Bb6 {Complex position})
  6. Re1 b5 7. Bb3 O-O 8. c3 d6)
Be5 
(3... f5 {Rousseau Gambit} 4. d3 
  (4. exf5 {Accepting the gambit} e4 5. Ng5 Nf6 6. f3 
    (6. Nc3 {Development} Bc5 7. f3 exf3 8. Nxf3 O-O {Sharp play})
    exf3 7. Nxf3 d5 8. Bb3 Bd6 {Compensation})
  fxe4 5. dxe4 Nf6 6. Nc3 Bb4 {Pin})
4. d3 Nf6 5. Ng5 
(5. Nc3 {Alternative development} Bxf3 6. gxf3 d6 7. f4 exf4 8. Bxf4 {Imbalanced position})
d6 
(5... O-O {Castling early} 6. f4 exf4 7. Bxf4 d6 8. Nf3 Bg4 {Pin on the knight})
6. f4 Bxg5 7. fxg5 Nh5 8. Qf3 Qxg5 9. Qxf7+ Kd8 10. Qf3 Nf4 *`;

export const CMChessDemo: React.FC = () => {
  const [selectedPGN, setSelectedPGN] = useState<string>(samplePGN);
  const [customPGN, setCustomPGN] = useState<string>('');
  const [boardWidth, setBoardWidth] = useState<number>(400);
  const [orientation, setOrientation] = useState<'white' | 'black'>('white');
  const [activeImplementation, setActiveImplementation] = useState<'chessjs' | 'cmchess'>('cmchess');

  const handlePGNChange = (pgn: string) => {
    setSelectedPGN(pgn);
  };

  const handleCustomPGNSubmit = () => {
    if (customPGN.trim()) {
      setSelectedPGN(customPGN);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1600px', margin: '0 auto' }}>
      <h1>Chess Library Comparison: chess.js vs cm-chess</h1>
      
      {/* Controls */}
      <div style={{ 
        marginBottom: '20px', 
        padding: '15px', 
        backgroundColor: '#f5f5f5', 
        borderRadius: '8px' 
      }}>
        <h3>Controls</h3>
        
        {/* Implementation Selector */}
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Chess Library:
          </label>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => setActiveImplementation('chessjs')}
              style={{
                padding: '8px 12px',
                backgroundColor: activeImplementation === 'chessjs' ? '#4CAF50' : '#2196F3',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              chess.js (Original)
            </button>
            <button
              onClick={() => setActiveImplementation('cmchess')}
              style={{
                padding: '8px 12px',
                backgroundColor: activeImplementation === 'cmchess' ? '#4CAF50' : '#2196F3',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              cm-chess (Enhanced)
            </button>
          </div>
        </div>
        
        {/* Sample PGNs */}
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Sample PGNs:
          </label>
          <button
            onClick={() => handlePGNChange(samplePGN)}
            style={{
              marginRight: '10px',
              padding: '8px 12px',
              backgroundColor: selectedPGN === samplePGN ? '#4CAF50' : '#2196F3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Fischer vs Spassky
          </button>
          <button
            onClick={() => handlePGNChange(complexPGN)}
            style={{
              padding: '8px 12px',
              backgroundColor: selectedPGN === complexPGN ? '#4CAF50' : '#2196F3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Complex Variations
          </button>
        </div>

        {/* Board Settings */}
        <div style={{ display: 'flex', gap: '20px', marginBottom: '15px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Board Width:
            </label>
            <input
              type="range"
              min="300"
              max="600"
              value={boardWidth}
              onChange={(e) => setBoardWidth(Number(e.target.value))}
              style={{ width: '150px' }}
            />
            <span style={{ marginLeft: '10px' }}>{boardWidth}px</span>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Orientation:
            </label>
            <select
              value={orientation}
              onChange={(e) => setOrientation(e.target.value as 'white' | 'black')}
              style={{ padding: '5px' }}
            >
              <option value="white">White</option>
              <option value="black">Black</option>
            </select>
          </div>
        </div>

        {/* Custom PGN */}
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Custom PGN:
          </label>
          <textarea
            value={customPGN}
            onChange={(e) => setCustomPGN(e.target.value)}
            placeholder="Paste your PGN here..."
            style={{
              width: '100%',
              height: '100px',
              padding: '8px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontFamily: 'monospace',
              fontSize: '12px'
            }}
          />
          <button
            onClick={handleCustomPGNSubmit}
            style={{
              marginTop: '5px',
              padding: '8px 12px',
              backgroundColor: '#FF9800',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Load Custom PGN
          </button>
        </div>
      </div>

      {/* Implementation Info */}
      <div style={{ 
        marginBottom: '20px', 
        padding: '15px', 
        backgroundColor: activeImplementation === 'cmchess' ? '#e8f5e8' : '#e3f2fd', 
        borderRadius: '8px',
        border: `2px solid ${activeImplementation === 'cmchess' ? '#4CAF50' : '#2196F3'}`
      }}>
        <h3 style={{ 
          color: activeImplementation === 'cmchess' ? '#2e7d32' : '#1976d2',
          margin: '0 0 10px 0'
        }}>
          {activeImplementation === 'cmchess' ? '🚀 cm-chess Implementation (Real Library)' : '⚙️ chess.js Implementation'}
        </h3>
        <div style={{ fontSize: '14px', color: '#666' }}>
          {activeImplementation === 'cmchess' ? (
            <div>
              <strong>cm-chess advantages:</strong>
              <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
                <li>Native variation support with tree-structured history</li>
                <li>Built-in PGN header handling</li>
                <li>Native NAG symbols and comments support</li>
                <li>ES6 modern JavaScript features</li>
                <li>Better performance for complex games</li>
                <li>Simplified API for annotations</li>
              </ul>
            </div>
          ) : (
            <div>
              <strong>chess.js features:</strong>
              <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
                <li>Mature and stable library</li>
                <li>Wide community support</li>
                <li>Custom variation handling</li>
                <li>Manual annotation management</li>
                <li>Custom PGN parsing</li>
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Chess Board Implementation */}
      {activeImplementation === 'chessjs' ? (
        <FullAnnotationChessBoard
          pgn={selectedPGN}
          boardWidth={boardWidth}
          boardOrientation={orientation}
          onPositionChange={(fen, moveHistory) => {
            console.log('chess.js - Position changed:', fen, moveHistory);
          }}
          onGameLoad={(game) => {
            console.log('chess.js - Game loaded:', game);
          }}
        />
      ) : (
        <CMChessFullAnnotationBoard
          pgn={selectedPGN}
          boardWidth={boardWidth}
          boardOrientation={orientation}
          onPositionChange={(fen, moveHistory) => {
            console.log('cm-chess - Position changed:', fen, moveHistory);
          }}
          onGameLoad={(game) => {
            console.log('cm-chess - Game loaded:', game);
          }}
        />
      )}

      {/* Comparison Features */}
      <div style={{ 
        marginTop: '30px', 
        padding: '15px', 
        backgroundColor: '#f9f9f9', 
        borderRadius: '8px' 
      }}>
        <h3>Feature Comparison</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div>
            <h4 style={{ color: '#1976d2', margin: '0 0 8px 0' }}>chess.js Implementation</h4>
            <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '14px' }}>
              <li>✅ Custom PGN parsing</li>
              <li>✅ Manual variation handling</li>
              <li>✅ Custom annotation system</li>
              <li>✅ Arrow key navigation</li>
              <li>✅ Click-to-move functionality</li>
              <li>⚠️ Complex variation management</li>
              <li>⚠️ Manual tree building</li>
            </ul>
          </div>
          <div>
            <h4 style={{ color: '#2e7d32', margin: '0 0 8px 0' }}>cm-chess Implementation</h4>
            <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '14px' }}>
              <li>✅ Native variation support</li>
              <li>✅ Built-in PGN parsing</li>
              <li>✅ Native NAG/comments</li>
              <li>✅ Tree-structured history</li>
              <li>✅ Simplified API</li>
              <li>✅ Better performance</li>
              <li>✅ Modern ES6 features</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Usage Instructions */}
      <div style={{ 
        marginTop: '20px', 
        padding: '15px', 
        backgroundColor: '#fff3e0', 
        borderRadius: '8px' 
      }}>
        <h3>🎮 Navigation Instructions</h3>
        <div style={{ fontSize: '14px' }}>
          <strong>Keyboard Shortcuts:</strong>
          <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
            <li><strong>← →</strong>: Navigate moves (previous/next)</li>
            <li><strong>↑ ↓</strong>: Navigate variations (enter/exit)</li>
            <li><strong>Home</strong>: Go to start of game</li>
            <li><strong>End</strong>: Go to end of main line</li>
          </ul>
          <strong>Mouse Navigation:</strong>
          <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
            <li><strong>Click moves</strong>: Click any move in the notation to jump to that position</li>
            <li><strong>Click variations</strong>: Click moves inside parentheses to explore variations</li>
            <li><strong>Navigation buttons</strong>: Use the buttons below the board</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default CMChessDemo;
