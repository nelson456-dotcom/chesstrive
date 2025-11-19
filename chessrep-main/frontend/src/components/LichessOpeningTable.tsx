import React, { useState, useEffect } from 'react';
import { 
  lichessOpeningService, 
  LichessOpeningOptions, 
  DatabaseType,
  LichessOpeningMove 
} from '../services/LichessOpeningService';

interface LichessOpeningTableProps {
  currentFEN: string;
  onMoveClick: (from: string, to: string, promotion?: string) => void;
  className?: string;
  defaultDatabase?: DatabaseType;
  playerName?: string;
}

export const LichessOpeningTable: React.FC<LichessOpeningTableProps> = ({
  currentFEN,
  onMoveClick,
  className = '',
  defaultDatabase = 'lichess',
  playerName
}) => {
  const [openingMoves, setOpeningMoves] = useState<LichessOpeningMove[]>([]);
  const [openingStats, setOpeningStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [database, setDatabase] = useState<DatabaseType>(defaultDatabase);
  const [player, setPlayer] = useState<string>(playerName || '');
  const [sortBy, setSortBy] = useState<'games' | 'white' | 'draw' | 'black'>('games');

  // Load opening data when position or options change
  useEffect(() => {
    const loadOpeningData = async () => {
      if (!currentFEN) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        const options: LichessOpeningOptions = {
          database,
          topGames: 4,
          recentGames: 4,
          moves: 20,
          ...(database === 'player' && player && { player })
        };

        const [moves, stats] = await Promise.all([
          lichessOpeningService.getOpeningMoves(currentFEN, options),
          lichessOpeningService.getOpeningStats(currentFEN, options)
        ]);

        setOpeningMoves(moves);
        setOpeningStats(stats);
      } catch (error) {
        console.error('Failed to load Lichess opening data:', error);
        setError('Failed to load opening data. Please try again.');
        setOpeningMoves([]);
        setOpeningStats(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadOpeningData();
  }, [currentFEN, database, player]);

  const sortedMoves = React.useMemo(() => {
    return [...openingMoves].sort((a, b) => {
      const aTotal = a.white + a.draws + a.black;
      const bTotal = b.white + b.draws + b.black;
      
      switch (sortBy) {
        case 'games':
          return bTotal - aTotal;
        case 'white':
          const aWhiteRate = aTotal > 0 ? (a.white / aTotal) * 100 : 0;
          const bWhiteRate = bTotal > 0 ? (b.white / bTotal) * 100 : 0;
          return bWhiteRate - aWhiteRate;
        case 'draw':
          const aDrawRate = aTotal > 0 ? (a.draws / aTotal) * 100 : 0;
          const bDrawRate = bTotal > 0 ? (b.draws / bTotal) * 100 : 0;
          return bDrawRate - aDrawRate;
        case 'black':
          const aBlackRate = aTotal > 0 ? (a.black / aTotal) * 100 : 0;
          const bBlackRate = bTotal > 0 ? (b.black / bTotal) * 100 : 0;
          return bBlackRate - aBlackRate;
        default:
          return 0;
      }
    });
  }, [openingMoves, sortBy]);

  const totalGames = openingStats?.totalGames || 0;
  const totalWhite = openingStats?.whiteWins || 0;
  const totalDraws = openingStats?.draws || 0;
  const totalBlack = openingStats?.blackWins || 0;

  const handleMoveClick = (move: LichessOpeningMove) => {
    // Extract from/to from UCI notation
    const from = move.uci.substring(0, 2);
    const to = move.uci.substring(2, 4);
    onMoveClick(from, to);
  };

  const handleDatabaseChange = (newDatabase: DatabaseType) => {
    setDatabase(newDatabase);
    if (newDatabase !== 'player') {
      setPlayer('');
    }
  };

  const getDatabaseDisplayName = (db: DatabaseType) => {
    switch (db) {
      case 'lichess': return 'Lichess';
      case 'masters': return 'Masters database';
      case 'player': return 'Player';
      default: return 'Lichess';
    }
  };

  const getBarWidth = (value: number, total: number) => {
    return total > 0 ? (value / total) * 100 : 0;
  };

  if (isLoading) {
    return (
      <div className={`lichess-opening-table ${className}`}>
        <div className="loading-state">
          <div className="spinner" />
          <p>Loading opening data from Lichess...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`lichess-opening-table ${className}`}>
        <div className="error-message">
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className={`lichess-opening-table ${className}`}>
      {/* Header */}
      <div className="table-header">
        <div className="database-selector">
          <button
            className={`db-btn ${database === 'masters' ? 'active' : ''}`}
            onClick={() => handleDatabaseChange('masters')}
          >
            Masters database
          </button>
          <button
            className={`db-btn ${database === 'lichess' ? 'active' : ''}`}
            onClick={() => handleDatabaseChange('lichess')}
          >
            Lichess
          </button>
          <button
            className={`db-btn ${database === 'player' ? 'active' : ''}`}
            onClick={() => handleDatabaseChange('player')}
          >
            Player
          </button>
        </div>
        
        {database === 'player' && (
          <div className="player-input">
            <input
              type="text"
              value={player}
              onChange={(e) => setPlayer(e.target.value)}
              placeholder="Enter player name"
              className="player-field"
            />
          </div>
        )}
        
        <div className="settings-btn">
          <button className="settings-icon">⚙️</button>
        </div>
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="opening-table">
          <thead>
            <tr className="table-header-row">
              <th className="move-header">
                <button 
                  className={`sort-btn ${sortBy === 'games' ? 'active' : ''}`}
                  onClick={() => setSortBy('games')}
                >
                  Move
                </button>
              </th>
              <th className="games-header">
                <button 
                  className={`sort-btn ${sortBy === 'games' ? 'active' : ''}`}
                  onClick={() => setSortBy('games')}
                >
                  Games
                </button>
              </th>
              <th className="outcome-header">
                <div className="outcome-buttons">
                  <button 
                    className={`sort-btn ${sortBy === 'white' ? 'active' : ''}`}
                    onClick={() => setSortBy('white')}
                  >
                    White
                  </button>
                  <button 
                    className={`sort-btn ${sortBy === 'draw' ? 'active' : ''}`}
                    onClick={() => setSortBy('draw')}
                  >
                    Draw
                  </button>
                  <button 
                    className={`sort-btn ${sortBy === 'black' ? 'active' : ''}`}
                    onClick={() => setSortBy('black')}
                  >
                    Black
                  </button>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedMoves.map((move, index) => {
              const total = move.white + move.draws + move.black;
              const whiteRate = total > 0 ? (move.white / total) * 100 : 0;
              const drawRate = total > 0 ? (move.draws / total) * 100 : 0;
              const blackRate = total > 0 ? (move.black / total) * 100 : 0;
              const gamePercentage = totalGames > 0 ? (total / totalGames) * 100 : 0;

              return (
                <tr 
                  key={move.uci} 
                  className="table-row"
                  onClick={() => handleMoveClick(move)}
                >
                  <td className="move-cell">
                    <span className="move-san">{move.san}</span>
                  </td>
                  <td className="games-cell">
                    <div className="games-info">
                      <span className="percentage">{gamePercentage.toFixed(1)}%</span>
                      <span className="total">{total.toLocaleString()}</span>
                    </div>
                  </td>
                  <td className="outcome-cell">
                    <div className="outcome-bar">
                      <div 
                        className="outcome-segment white"
                        style={{ width: `${whiteRate}%` }}
                      >
                        <span className="outcome-text">{whiteRate.toFixed(0)}%</span>
                      </div>
                      <div 
                        className="outcome-segment draw"
                        style={{ width: `${drawRate}%` }}
                      >
                        <span className="outcome-text">{drawRate.toFixed(0)}%</span>
                      </div>
                      <div 
                        className="outcome-segment black"
                        style={{ width: `${blackRate}%` }}
                      >
                        <span className="outcome-text">{blackRate.toFixed(0)}%</span>
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}
            
            {/* Summary Row */}
            {totalGames > 0 && (
              <tr className="summary-row">
                <td className="summary-label">Σ</td>
                <td className="summary-games">
                  <div className="games-info">
                    <span className="percentage">100.0%</span>
                    <span className="total">{totalGames.toLocaleString()}</span>
                  </div>
                </td>
                <td className="summary-outcome">
                  <div className="outcome-bar">
                    <div 
                      className="outcome-segment white"
                      style={{ width: `${getBarWidth(totalWhite, totalGames)}%` }}
                    >
                      <span className="outcome-text">{((totalWhite / totalGames) * 100).toFixed(0)}%</span>
                    </div>
                    <div 
                      className="outcome-segment draw"
                      style={{ width: `${getBarWidth(totalDraws, totalGames)}%` }}
                    >
                      <span className="outcome-text">{((totalDraws / totalGames) * 100).toFixed(0)}%</span>
                    </div>
                    <div 
                      className="outcome-segment black"
                      style={{ width: `${getBarWidth(totalBlack, totalGames)}%` }}
                    >
                      <span className="outcome-text">{((totalBlack / totalGames) * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="table-footer">
        <button className="top-games-btn">Top games</button>
      </div>
    </div>
  );
};

export default LichessOpeningTable;
