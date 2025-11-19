import React, { useState } from 'react';
import LichessLikeEditor from './LichessLikeEditor';

const BoardEditorTest: React.FC = () => {
  const [currentFen, setCurrentFen] = useState('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
  const [fenHistory, setFenHistory] = useState<string[]>([]);

  const handleFenChange = (newFen: string) => {
    setCurrentFen(newFen);
    setFenHistory(prev => [...prev, newFen].slice(-10)); // Keep last 10 FENs
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Board Editor Test</h1>
      
      <div style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#f0f0f0', borderRadius: '5px' }}>
        <h3>Current FEN:</h3>
        <code style={{ fontSize: '12px', wordBreak: 'break-all' }}>{currentFen}</code>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>FEN History (last 10):</h3>
        <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #ccc', padding: '10px' }}>
          {fenHistory.map((fen, index) => (
            <div key={index} style={{ marginBottom: '5px', fontSize: '11px' }}>
              <strong>{index + 1}:</strong> <code>{fen}</code>
            </div>
          ))}
        </div>
      </div>

      <LichessLikeEditor
        initialFen={currentFen}
        onFenChange={handleFenChange}
      />
    </div>
  );
};

export default BoardEditorTest;



