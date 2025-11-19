import React, { useState } from 'react';
import { Chess } from 'chess.js';
import LichessOpeningTree from './LichessOpeningTree';
import LichessOpeningTable from './LichessOpeningTable';
import '../styles/lichess-opening-tree.css';
import '../styles/lichess-opening-table.css';

const OpeningExplorerComparison: React.FC = () => {
  const [game, setGame] = useState<Chess>(new Chess());
  const [currentFEN, setCurrentFEN] = useState<string>(game.fen());
  const [viewMode, setViewMode] = useState<'tree' | 'table'>('table');
  const [selectedDatabase, setSelectedDatabase] = useState<'lichess' | 'masters' | 'player'>('masters');
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

  const loadPosition = (fen: string, name: string) => {
    try {
      const newGame = new Chess(fen);
      setGame(newGame);
      setCurrentFEN(fen);
      console.log(`Loaded position: ${name}`);
    } catch (error) {
      console.error('Invalid FEN:', error);
    }
  };

  const commonPositions = [
    { name: 'Starting Position', fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1' },
    { name: 'After 1.e4', fen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1' },
    { name: 'After 1.d4', fen: 'rnbqkbnr/pppppppp/8/8/3P4/8/PPP1PPPP/RNBQKBNR b KQkq d3 0 1' },
    { name: 'Sicilian Defense', fen: 'rnbqkbnr/pppppppp/8/8/4p3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2' },
  ];

  return (
    <div className="opening-explorer-comparison">
      <div className="comparison-header">
        <h1>Chess Opening Explorer - Comparison</h1>
        <p>Compare the tree view and table view of the Lichess opening explorer</p>
      </div>

      <div className="controls-panel">
        <div className="view-controls">
          <h3>View Mode</h3>
          <div className="view-buttons">
            <button
              className={`view-btn ${viewMode === 'table' ? 'active' : ''}`}
              onClick={() => setViewMode('table')}
            >
              Table View
            </button>
            <button
              className={`view-btn ${viewMode === 'tree' ? 'active' : ''}`}
              onClick={() => setViewMode('tree')}
            >
              Tree View
            </button>
          </div>
        </div>

        <div className="database-controls">
          <h3>Database</h3>
          <div className="database-buttons">
            <button
              className={`db-btn ${selectedDatabase === 'masters' ? 'active' : ''}`}
              onClick={() => setSelectedDatabase('masters')}
            >
              Masters
            </button>
            <button
              className={`db-btn ${selectedDatabase === 'lichess' ? 'active' : ''}`}
              onClick={() => setSelectedDatabase('lichess')}
            >
              Lichess
            </button>
            <button
              className={`db-btn ${selectedDatabase === 'player' ? 'active' : ''}`}
              onClick={() => setSelectedDatabase('player')}
            >
              Player
            </button>
          </div>
          
          {selectedDatabase === 'player' && (
            <div className="player-input">
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Enter player name"
                className="player-field"
              />
            </div>
          )}
        </div>

        <div className="position-controls">
          <h3>Position</h3>
          <div className="position-buttons">
            {commonPositions.map((pos, index) => (
              <button
                key={index}
                onClick={() => loadPosition(pos.fen, pos.name)}
                className="pos-btn"
              >
                {pos.name}
              </button>
            ))}
            <button onClick={resetPosition} className="pos-btn reset">
              Reset
            </button>
          </div>
        </div>
      </div>

      <div className="current-position-info">
        <div className="fen-display">
          <strong>Current FEN:</strong> <code>{currentFEN}</code>
        </div>
      </div>

      <div className="opening-explorer-container">
        {viewMode === 'table' ? (
          <LichessOpeningTable
            currentFEN={currentFEN}
            onMoveClick={handleMoveClick}
            defaultDatabase={selectedDatabase}
            playerName={playerName}
          />
        ) : (
          <LichessOpeningTree
            currentFEN={currentFEN}
            onMoveClick={handleMoveClick}
            defaultDatabase={selectedDatabase}
            playerName={playerName}
          />
        )}
      </div>

      <div className="comparison-info">
        <div className="info-grid">
          <div className="info-card">
            <h3>Table View</h3>
            <ul>
              <li>✓ Clean, tabular interface</li>
              <li>✓ Easy to compare statistics</li>
              <li>✓ Familiar Lichess-style design</li>
              <li>✓ Sortable columns</li>
              <li>✓ Horizontal outcome bars</li>
              <li>✓ Compact information display</li>
            </ul>
          </div>
          
          <div className="info-card">
            <h3>Tree View</h3>
            <ul>
              <li>✓ Hierarchical move structure</li>
              <li>✓ Visual move relationships</li>
              <li>✓ Detailed move information</li>
              <li>✓ Advanced filtering options</li>
              <li>✓ Game examples and analysis</li>
              <li>✓ Interactive move exploration</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OpeningExplorerComparison;
