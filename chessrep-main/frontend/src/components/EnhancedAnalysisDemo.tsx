import React, { useState } from 'react';
import { EnhancedAnalysisBoard } from './EnhancedAnalysisBoard';
import { GameState } from '../types/chess';
import './EnhancedAnalysisBoard.css';

const EnhancedAnalysisDemo: React.FC = () => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [demoPosition, setDemoPosition] = useState<string>('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');

  const handleGameChange = (newGameState: GameState) => {
    setGameState(newGameState);
  };

  const loadDemoPosition = (position: string) => {
    setDemoPosition(position);
  };

  // Simple test to see if component renders at all
  console.log('🎯 EnhancedAnalysisDemo component is rendering!');

  const demoPositions = [
    {
      name: 'Starting Position',
      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      description: 'Standard starting position'
    },
    {
      name: 'Sicilian Defense',
      fen: 'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2',
      description: 'After 1.e4 c5 2.Nf3 e6'
    },
    {
      name: 'King\'s Indian Defense',
      fen: 'rnbqkbnr/pppppppp/8/8/8/5N2/PPPPPPPP/RNBQKB1R w KQkq - 1 2',
      description: 'After 1.Nf3 Nf6'
    },
    {
      name: 'Middle Game Position',
      fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/3P1N2/PPP2PPP/RNBQK2R w KQkq - 4 4',
      description: 'Complex middle game position'
    },
    {
      name: 'Endgame Position',
      fen: '8/8/8/8/8/8/4K3/4k3 w - - 0 1',
      description: 'King vs King endgame'
    }
  ];

  console.log('🎯 EnhancedAnalysisDemo render:', { demoPosition, gameState });

  return (
    <div style={{ padding: '20px', background: 'lightblue', minHeight: '100vh' }}>
      <h1 style={{ color: 'red', fontSize: '2rem' }}>TEST: Enhanced Analysis Demo</h1>
      <p>If you can see this, the component is rendering!</p>
      <p>Position: {demoPosition}</p>
      <p>Game State: {gameState ? 'Loaded' : 'Not loaded'}</p>
      
      <div style={{ border: '3px solid red', padding: '20px', margin: '20px', background: 'yellow' }}>
        <h3>Board Container Test</h3>
        <EnhancedAnalysisBoard
          initialFEN={demoPosition}
          onGameChange={handleGameChange}
          className="demo-board"
        />
      </div>

      <div className="demo-info">
        <div className="info-grid">
          <div className="info-panel">
            <h3>Features</h3>
            <ul>
              <li><strong>Interactive Chess Board:</strong> Click to move pieces, drag and drop support</li>
              <li><strong>Real-time Analysis:</strong> Stockfish engine integration with live evaluation</li>
              <li><strong>Opening Tree:</strong> Explore opening theory with statistics</li>
              <li><strong>Engine Lines:</strong> See multiple best moves with evaluations</li>
              <li><strong>Evaluation Bar:</strong> Visual representation of position evaluation</li>
            </ul>
          </div>

          <div className="info-panel">
            <h3>Current Game State</h3>
            <div className="game-info">
              <p><strong>FEN:</strong> {gameState?.fen || 'Loading...'}</p>
              <p><strong>Turn:</strong> {gameState?.turn === 'w' ? 'White' : 'Black'}</p>
              <p><strong>Game Status:</strong> {gameState?.checkmate || gameState?.stalemate || gameState?.draw ? 'Game Over' : 'In Progress'}</p>
            </div>
          </div>

          <div className="info-panel">
            <h3>How to Use</h3>
            <ol>
              <li><strong>Make Moves:</strong> Click on pieces and then destination squares</li>
              <li><strong>Study Openings:</strong> Use the Opening Tree to see theory and statistics</li>
              <li><strong>Analyze:</strong> Watch the evaluation bar and engine lines for position assessment</li>
              <li><strong>Load Positions:</strong> Use the dropdown to load different demo positions</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedAnalysisDemo;
