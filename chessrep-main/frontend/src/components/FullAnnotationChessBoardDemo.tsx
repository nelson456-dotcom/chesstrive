import React, { useState } from 'react';
import FullAnnotationChessBoard from './FullAnnotationChessBoard';
import ChessMomentsFullAnnotationBoard from './ChessMomentsFullAnnotationBoard';

const samplePGN = `[Event "World Championship"]
[Site "New York"]
[Date "1972.07.11"]
[Round "1"]
[White "Fischer, Robert James"]
[Black "Spassky, Boris V"]
[Result "1-0"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 {The Ruy Lopez opening} a6 
(3... f5 {The Schliemann Defense} 4. Nc3 fxe4 5. Nxe4 d5 6. Nxe5 dxe4 7. Nxc6 Qg5 {Black has compensation})
(3... Nf6 {The Berlin Defense} 4. O-O Nxe4 5. d4 Nd6 6. Bxc6 dxc6 7. dxe5 Nf5 8. Qxd8+ Kxd8 {The Berlin Endgame})
4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 d6 8. c3 O-O 9. h3 Nb8 
{A typical regrouping in the Ruy Lopez} 10. d4 Nbd7 11. c4 c6 12. cxb5 axb5 
13. Nc3 Bb7 14. Bg5 b4 15. Nb1 h6 16. Bh4 c5 17. dxe5 
(17. dxc5 {Alternative capture} Nxe5 18. Nxe5 dxe5 19. cxd6 Bxd6 20. Bxf6 Qxf6 {Equal position})
Nxe5 18. Nxe5 dxe5 19. f3 Bc5+ 20. Kh1 Qd4 21. Qe2 Rfe8 22. Bg3 Re6 
23. Nd2 Rae8 24. Rf1 R6e7 25. Rae1 Bd6 26. Qc2 c4 27. Bxc4 Bxg3 28. Qxc8+ 1-0`;

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

export const FullAnnotationChessBoardDemo: React.FC = () => {
  const [selectedPGN, setSelectedPGN] = useState<string>('');
  const [customPGN, setCustomPGN] = useState<string>('');
  const [boardWidth, setBoardWidth] = useState<number>(400);
  const [orientation, setOrientation] = useState<'white' | 'black'>('white');
  const [useChessMoments, setUseChessMoments] = useState<boolean>(true);

  const handlePGNChange = (pgn: string) => {
    setSelectedPGN(pgn);
  };

  const handleCustomPGNSubmit = () => {
    if (customPGN.trim()) {
      setSelectedPGN(customPGN);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      <h1>Full Annotation Chess Board Demo</h1>
      
      {/* Controls */}
      <div style={{ 
        marginBottom: '20px', 
        padding: '15px', 
        backgroundColor: '#f5f5f5', 
        borderRadius: '8px' 
      }}>
        <h3>Controls</h3>
        
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

        {/* Board Settings */}
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div>
            <label style={{ marginRight: '8px', fontWeight: 'bold' }}>Board Size:</label>
            <input
              type="range"
              min="300"
              max="600"
              value={boardWidth}
              onChange={(e) => setBoardWidth(parseInt(e.target.value))}
              style={{ marginRight: '8px' }}
            />
            <span>{boardWidth}px</span>
          </div>
          
          <div>
            <label style={{ marginRight: '8px', fontWeight: 'bold' }}>Orientation:</label>
            <select
              value={orientation}
              onChange={(e) => setOrientation(e.target.value as 'white' | 'black')}
              style={{
                padding: '4px 8px',
                border: '1px solid #ccc',
                borderRadius: '4px'
              }}
            >
              <option value="white">White</option>
              <option value="black">Black</option>
            </select>
          </div>

          <div>
            <label style={{ marginRight: '8px', fontWeight: 'bold' }}>Tree System:</label>
            <select
              value={useChessMoments ? 'enhanced' : 'original'}
              onChange={(e) => setUseChessMoments(e.target.value === 'enhanced')}
              style={{
                padding: '4px 8px',
                border: '1px solid #ccc',
                borderRadius: '4px'
              }}
            >
              <option value="enhanced">Enhanced Tree System</option>
              <option value="original">Original System</option>
            </select>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div style={{ 
        marginBottom: '20px', 
        padding: '15px', 
        backgroundColor: '#e3f2fd', 
        borderRadius: '8px',
        border: '1px solid #2196F3'
      }}>
        <h3 style={{ margin: '0 0 10px 0', color: '#1976D2' }}>How to Use</h3>
        <ul style={{ margin: 0, paddingLeft: '20px' }}>
          <li><strong>Navigation:</strong> Use arrow keys (← →) to navigate moves, (↑ ↓) for variations</li>
          <li><strong>Click moves:</strong> Click any move in the notation to jump to that position</li>
          <li><strong>Variations:</strong> Click moves inside parentheses to explore variations</li>
          <li><strong>Piece Movement:</strong> Drag pieces to make moves (works in Enhanced Tree System)</li>
          <li><strong>Buttons:</strong> Use the navigation buttons below the board</li>
          <li><strong>Synchronization:</strong> Board and notation are always perfectly synchronized</li>
        </ul>
      </div>

      {/* Chess Board */}
      {useChessMoments ? (
        <ChessMomentsFullAnnotationBoard
          pgn={selectedPGN}
          boardWidth={boardWidth}
          boardOrientation={orientation}
          onPositionChange={(fen, moveHistory) => {
            console.log('Position changed:', fen, moveHistory);
          }}
          onGameLoad={(game) => {
            console.log('Game loaded:', game);
          }}
        />
      ) : (
        <FullAnnotationChessBoard
          pgn={selectedPGN}
          boardWidth={boardWidth}
          boardOrientation={orientation}
          onPositionChange={(fen, moveHistory) => {
            console.log('Position changed:', fen, moveHistory);
          }}
          onGameLoad={(game) => {
            console.log('Game loaded:', game);
          }}
        />
      )}

      {/* Features List */}
      <div style={{ 
        marginTop: '30px', 
        padding: '15px', 
        backgroundColor: '#f9f9f9', 
        borderRadius: '8px' 
      }}>
        <h3>Features Implemented</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div>
            <h4 style={{ color: '#4CAF50', margin: '0 0 8px 0' }}>✓ Complete PGN Parsing</h4>
            <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '14px' }}>
              <li>Main line moves</li>
              <li>All variations (nested to any depth)</li>
              <li>Comments and annotations</li>
              <li>NAG symbols (!?, ?!, !!, ??, etc.)</li>
              <li>Game headers</li>
            </ul>
          </div>
          <div>
            <h4 style={{ color: '#4CAF50', margin: '0 0 8px 0' }}>✓ Perfect Navigation</h4>
            <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '14px' }}>
              <li>Arrow key navigation</li>
              <li>Click-to-move functionality</li>
              <li>Drag pieces to make moves</li>
              <li>Variation exploration</li>
              <li>Board-notation synchronization</li>
              <li>No missed or skipped moves</li>
            </ul>
          </div>
        </div>
        
        <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#e8f5e8', borderRadius: '6px' }}>
          <h4 style={{ color: '#2E7D32', margin: '0 0 8px 0' }}>🆕 Enhanced Tree System</h4>
          <p style={{ margin: 0, fontSize: '14px' }}>
            This demo now includes an <strong>Enhanced Tree System</strong> with improved PGN parsing and variation handling. 
            You can switch between the original system and the enhanced system using the dropdown above.
          </p>
        </div>
      </div>
    </div>
  );
};

export default FullAnnotationChessBoardDemo;