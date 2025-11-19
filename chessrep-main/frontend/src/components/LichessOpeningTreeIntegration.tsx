import React, { useState } from 'react';
import { Chess } from 'chess.js';
import LichessOpeningTree from './LichessOpeningTree';
import '../styles/lichess-opening-tree.css';

interface LichessOpeningTreeIntegrationProps {
  className?: string;
}

/**
 * Integration component that shows how to use LichessOpeningTree
 * with a simple chess board state management
 */
export const LichessOpeningTreeIntegration: React.FC<LichessOpeningTreeIntegrationProps> = ({
  className = ''
}) => {
  const [game, setGame] = useState<Chess>(new Chess());
  const [currentFEN, setCurrentFEN] = useState<string>(game.fen());
  const [selectedDatabase, setSelectedDatabase] = useState<'lichess' | 'masters' | 'player'>('lichess');
  const [playerName, setPlayerName] = useState<string>('');

  const handleMoveClick = (from: string, to: string, promotion?: string) => {
    try {
      const move = game.move({
        from,
        to,
        promotion: promotion || 'q'
      });

      if (move) {
        setCurrentFEN(game.fen());
        console.log(`Move played: ${move.san} (${from}${to})`);
      }
    } catch (error) {
      console.error('Invalid move:', error);
    }
  };

  const resetPosition = () => {
    const newGame = new Chess();
    setGame(newGame);
    setCurrentFEN(newGame.fen());
  };

  const loadPosition = (fen: string) => {
    try {
      const newGame = new Chess(fen);
      setGame(newGame);
      setCurrentFEN(fen);
    } catch (error) {
      console.error('Invalid FEN:', error);
    }
  };

  return (
    <div className={`lichess-opening-integration ${className}`}>
      <div className="integration-header">
        <h2>Lichess Opening Explorer Integration</h2>
        <p>This component demonstrates how to integrate the Lichess opening tree with your chess application.</p>
      </div>

      <div className="integration-controls">
        <div className="position-controls">
          <h3>Position Controls</h3>
          <div className="control-buttons">
            <button onClick={resetPosition} className="btn-primary">
              Reset to Start
            </button>
            <button 
              onClick={() => loadPosition('rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1')} 
              className="btn-secondary"
            >
              After 1.e4
            </button>
            <button 
              onClick={() => loadPosition('rnbqkbnr/pppppppp/8/8/3P4/8/PPP1PPPP/RNBQKBNR b KQkq d3 0 1')} 
              className="btn-secondary"
            >
              After 1.d4
            </button>
          </div>
        </div>

        <div className="database-controls">
          <h3>Database Selection</h3>
          <div className="database-options">
            <label>
              <input
                type="radio"
                name="database"
                value="lichess"
                checked={selectedDatabase === 'lichess'}
                onChange={(e) => setSelectedDatabase(e.target.value as any)}
              />
              Lichess Database
            </label>
            <label>
              <input
                type="radio"
                name="database"
                value="masters"
                checked={selectedDatabase === 'masters'}
                onChange={(e) => setSelectedDatabase(e.target.value as any)}
              />
              Masters Database
            </label>
            <label>
              <input
                type="radio"
                name="database"
                value="player"
                checked={selectedDatabase === 'player'}
                onChange={(e) => setSelectedDatabase(e.target.value as any)}
              />
              Player Database
            </label>
          </div>
          
          {selectedDatabase === 'player' && (
            <div className="player-input">
              <label htmlFor="player-name">Player Name:</label>
              <input
                id="player-name"
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Enter Lichess username"
              />
            </div>
          )}
        </div>
      </div>

      <div className="current-position">
        <h3>Current Position</h3>
        <div className="fen-display">
          <code>{currentFEN}</code>
        </div>
      </div>

      <LichessOpeningTree
        currentFEN={currentFEN}
        onMoveClick={handleMoveClick}
        defaultDatabase={selectedDatabase}
        playerName={playerName}
      />

      <div className="integration-info">
        <h3>Integration Notes</h3>
        <ul>
          <li>The opening tree automatically updates when the position changes</li>
          <li>Click on any move to play it in your chess application</li>
          <li>Switch between different databases to see different perspectives</li>
          <li>Use the player database to study specific players' games</li>
          <li>All data is fetched from Lichess's public API</li>
        </ul>
      </div>
    </div>
  );
};

export default LichessOpeningTreeIntegration;
