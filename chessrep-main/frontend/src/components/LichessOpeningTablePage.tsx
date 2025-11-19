import React, { useState } from 'react';
import { Chess } from 'chess.js';
import LichessOpeningTable from './LichessOpeningTable';
import '../styles/lichess-opening-table.css';

const LichessOpeningTablePage: React.FC = () => {
  const [game, setGame] = useState<Chess>(new Chess());
  const [currentFEN, setCurrentFEN] = useState<string>(game.fen());
  const [moveHistory, setMoveHistory] = useState<string[]>([]);
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
        setMoveHistory(prev => [...prev, move.san]);
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
    setMoveHistory([]);
  };

  const loadPosition = (fen: string, name: string) => {
    try {
      const newGame = new Chess(fen);
      setGame(newGame);
      setCurrentFEN(fen);
      setMoveHistory([]);
      console.log(`Loaded position: ${name}`);
    } catch (error) {
      console.error('Invalid FEN:', error);
    }
  };

  const goBack = () => {
    if (moveHistory.length > 0) {
      const newGame = new Chess();
      
      // Replay all moves except the last one
      for (let i = 0; i < moveHistory.length - 1; i++) {
        try {
          newGame.move(moveHistory[i]);
        } catch (error) {
          console.error('Error replaying move:', error);
        }
      }
      
      setGame(newGame);
      setCurrentFEN(newGame.fen());
      setMoveHistory(prev => prev.slice(0, -1));
    }
  };

  const commonPositions = [
    { 
      name: 'Starting Position', 
      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      description: 'The initial chess position'
    },
    { 
      name: 'After 1.e4', 
      fen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1',
      description: 'King\'s Pawn Opening'
    },
    { 
      name: 'After 1.d4', 
      fen: 'rnbqkbnr/pppppppp/8/8/3P4/8/PPP1PPPP/RNBQKBNR b KQkq d3 0 1',
      description: 'Queen\'s Pawn Opening'
    },
    { 
      name: 'Sicilian Defense', 
      fen: 'rnbqkbnr/pppppppp/8/8/4p3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2',
      description: 'After 1.e4 c5'
    },
    { 
      name: 'King\'s Indian Defense', 
      fen: 'rnbqkbnr/pppppppp/8/8/3P4/8/PPP1PPPP/RNBQKBNR b KQkq d3 0 1',
      description: 'After 1.d4 Nf6'
    },
    { 
      name: 'Ruy Lopez', 
      fen: 'r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 4 3',
      description: 'After 1.e4 e5 2.Nf3 Nc6 3.Bb5'
    },
  ];

  return (
    <div className="lichess-opening-table-page">
      <div className="page-header">
        <h1>Lichess Opening Explorer - Table View</h1>
        <p>Explore chess openings with a clean table interface, just like the original Lichess opening explorer</p>
      </div>

      <div className="controls-section">
        <div className="position-controls">
          <h3>Position Controls</h3>
          <div className="control-buttons">
            <button onClick={resetPosition} className="btn-primary">
              Reset to Start
            </button>
            <button onClick={goBack} disabled={moveHistory.length === 0} className="btn-secondary">
              Go Back
            </button>
          </div>
          
          <div className="common-positions">
            <h4>Common Positions:</h4>
            <div className="position-grid">
              {commonPositions.map((pos, index) => (
                <button
                  key={index}
                  onClick={() => loadPosition(pos.fen, pos.name)}
                  className="position-card"
                  title={pos.description}
                >
                  <div className="position-name">{pos.name}</div>
                  <div className="position-desc">{pos.description}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="database-controls">
          <h3>Database Selection</h3>
          <div className="database-options">
            <label>
              <input
                type="radio"
                name="database"
                value="masters"
                checked={selectedDatabase === 'masters'}
                onChange={(e) => setSelectedDatabase(e.target.value as any)}
              />
              Masters Database (Tournament games)
            </label>
            <label>
              <input
                type="radio"
                name="database"
                value="lichess"
                checked={selectedDatabase === 'lichess'}
                onChange={(e) => setSelectedDatabase(e.target.value as any)}
              />
              Lichess Database (All games)
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
            <div className="player-input-section">
              <label htmlFor="player-name">Player Name:</label>
              <input
                id="player-name"
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Enter Lichess username"
                className="player-name-input"
              />
            </div>
          )}
        </div>
      </div>

      <div className="move-history">
        <h3>Move History</h3>
        <div className="moves-list">
          {moveHistory.length === 0 ? (
            <span className="no-moves">No moves played yet</span>
          ) : (
            moveHistory.map((move, index) => (
              <span key={index} className="move-item">
                {Math.floor(index / 2) + 1}.{index % 2 === 0 ? '' : '..'}{move}
              </span>
            ))
          )}
        </div>
      </div>

      <div className="current-position">
        <h3>Current Position</h3>
        <div className="fen-display">
          <code>{currentFEN}</code>
        </div>
      </div>

      <div className="opening-table-section">
        <LichessOpeningTable
          currentFEN={currentFEN}
          onMoveClick={handleMoveClick}
          defaultDatabase={selectedDatabase}
          playerName={playerName}
        />
      </div>

      <div className="info-section">
        <h3>About the Table View</h3>
        <div className="info-content">
          <div className="info-item">
            <h4>Clean Interface</h4>
            <p>This table view matches the design of the original Lichess opening explorer, providing a familiar and intuitive interface for exploring chess openings.</p>
          </div>
          <div className="info-item">
            <h4>Interactive Statistics</h4>
            <p>Click on column headers to sort by games, white wins, draws, or black wins. The horizontal bars show the distribution of game outcomes.</p>
          </div>
          <div className="info-item">
            <h4>Real-time Data</h4>
            <p>All statistics are fetched live from Lichess's extensive database, ensuring you always have the most up-to-date information.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LichessOpeningTablePage;
