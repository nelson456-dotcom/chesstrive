import React, { useState, useEffect } from 'react';
import { Chess } from 'chess.js';
import LichessOpeningTree from './LichessOpeningTree';
import '../styles/lichess-opening-tree.css';

const LichessOpeningTreePage: React.FC = () => {
  const [game, setGame] = useState<Chess>(new Chess());
  const [currentFEN, setCurrentFEN] = useState<string>(game.fen());
  const [moveHistory, setMoveHistory] = useState<string[]>([]);
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
        setMoveHistory(prev => [...prev, move.san]);
        setCurrentFEN(game.fen());
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

  const goToMove = (moveIndex: number) => {
    const newGame = new Chess();
    
    // Replay moves up to the selected index
    for (let i = 0; i <= moveIndex; i++) {
      try {
        newGame.move(moveHistory[i]);
      } catch (error) {
        console.error('Error replaying move:', error);
      }
    }
    
    setGame(newGame);
    setCurrentFEN(newGame.fen());
    setMoveHistory(prev => prev.slice(0, moveIndex + 1));
  };

  const loadPosition = (fen: string) => {
    try {
      const newGame = new Chess(fen);
      setGame(newGame);
      setCurrentFEN(fen);
      setMoveHistory([]);
    } catch (error) {
      console.error('Invalid FEN:', error);
    }
  };

  const commonPositions = [
    { name: 'Starting Position', fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1' },
    { name: 'After 1.e4', fen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1' },
    { name: 'After 1.d4', fen: 'rnbqkbnr/pppppppp/8/8/3P4/8/PPP1PPPP/RNBQKBNR b KQkq d3 0 1' },
    { name: 'Sicilian Defense', fen: 'rnbqkbnr/pppppppp/8/8/4p3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2' },
    { name: 'King\'s Indian Defense', fen: 'rnbqkbnr/pppppppp/8/8/3P4/8/PPP1PPPP/RNBQKBNR b KQkq d3 0 1' },
  ];

  return (
    <div className="lichess-opening-tree-page">
      <div className="page-header">
        <h1>Lichess Opening Explorer</h1>
        <p>Explore chess openings using real data from Lichess player and master databases</p>
      </div>

      <div className="controls-section">
        <div className="position-controls">
          <h3>Position Controls</h3>
          <div className="control-buttons">
            <button onClick={resetPosition} className="control-btn">
              Reset to Start
            </button>
            <button onClick={goBack} disabled={moveHistory.length === 0} className="control-btn">
              Go Back
            </button>
          </div>
          
          <div className="common-positions">
            <h4>Common Positions:</h4>
            <div className="position-buttons">
              {commonPositions.map((pos, index) => (
                <button
                  key={index}
                  onClick={() => loadPosition(pos.fen)}
                  className="position-btn"
                >
                  {pos.name}
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
              <button
                key={index}
                onClick={() => goToMove(index)}
                className={`move-btn ${index === moveHistory.length - 1 ? 'current' : ''}`}
              >
                {Math.floor(index / 2) + 1}.{index % 2 === 0 ? '' : '..'}{move}
              </button>
            ))
          )}
        </div>
      </div>

      <div className="opening-tree-section">
        <LichessOpeningTree
          currentFEN={currentFEN}
          onMoveClick={handleMoveClick}
          defaultDatabase={selectedDatabase}
          playerName={playerName}
        />
      </div>

      <div className="info-section">
        <h3>About the Lichess Opening Explorer</h3>
        <div className="info-content">
          <div className="info-item">
            <h4>Lichess Database</h4>
            <p>Contains all games played on Lichess, providing the most comprehensive dataset with millions of games across all skill levels.</p>
          </div>
          <div className="info-item">
            <h4>Masters Database</h4>
            <p>Features high-level tournament games from professional players, offering insights into how masters approach various positions.</p>
          </div>
          <div className="info-item">
            <h4>Player Database</h4>
            <p>Focuses on games played by a specific player, allowing you to study how individual players handle different positions.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LichessOpeningTreePage;
