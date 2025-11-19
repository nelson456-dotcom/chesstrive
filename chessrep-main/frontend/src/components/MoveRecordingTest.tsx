// Simple test component to verify move recording
import React, { useState, useEffect } from 'react';
import { EnhancedAnalysisBoard } from './EnhancedAnalysisBoard';

const MoveRecordingTest: React.FC = () => {
  const [testPGN, setTestPGN] = useState('');

  return (
    <div className="move-recording-test">
      <div className="test-header">
        <h1>Move Recording Test</h1>
        <p>This page tests if moves played on the board are properly recorded in the move tree.</p>
      </div>

      <div className="test-instructions">
        <h3>Instructions:</h3>
        <ol>
          <li>Make moves on the chess board</li>
          <li>Check if the moves appear in the "Complete Move Tree" section on the right</li>
          <li>The move tree should update in real-time as you play</li>
        </ol>
      </div>

      <div className="test-board">
        <EnhancedAnalysisBoard
          initialFEN="rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
          initialPGN={testPGN}
        />
      </div>

      <div className="test-controls">
        <h3>Test Controls:</h3>
        <button onClick={() => setTestPGN('')}>
          Clear PGN (Start Fresh)
        </button>
        <button onClick={() => setTestPGN('1. e4 e5 2. Nf3 Nc6')}>
          Load Test PGN
        </button>
      </div>
    </div>
  );
};

export default MoveRecordingTest;
