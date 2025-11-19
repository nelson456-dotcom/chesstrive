import React, { useState, useEffect } from 'react';
import { 
  lichessOpeningService, 
  LichessOpeningOptions, 
  DatabaseType,
  LichessOpeningMove 
} from '../services/LichessOpeningService';

interface LichessOpeningTreeProps {
  currentFEN: string;
  onMoveClick: (from: string, to: string, promotion?: string) => void;
  className?: string;
  defaultDatabase?: DatabaseType;
  playerName?: string;
}

export const LichessOpeningTree: React.FC<LichessOpeningTreeProps> = ({
  currentFEN,
  onMoveClick,
  className = '',
  defaultDatabase = 'lichess',
  playerName
}) => {
  const [openingMoves, setOpeningMoves] = useState<LichessOpeningMove[]>([]);
  const [openingStats, setOpeningStats] = useState<any>(null);
  const [selectedMove, setSelectedMove] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'popularity' | 'winrate' | 'rating'>('popularity');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [filterBy, setFilterBy] = useState<'all' | 'white' | 'black'>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [database, setDatabase] = useState<DatabaseType>(defaultDatabase);
  const [player, setPlayer] = useState<string>(playerName || '');
  const [ratingRange, setRatingRange] = useState<string>('');
  const [timeControl, setTimeControl] = useState<string>('');
  const [topGames, setTopGames] = useState<any[]>([]);
  const [recentGames, setRecentGames] = useState<any[]>([]);

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
          moves: 12,
          ...(ratingRange && { ratings: ratingRange }),
          ...(timeControl && { speeds: timeControl }),
          ...(database === 'player' && player && { player })
        };

        const [moves, stats, topGamesData, recentGamesData] = await Promise.all([
          lichessOpeningService.getOpeningMoves(currentFEN, options),
          lichessOpeningService.getOpeningStats(currentFEN, options),
          lichessOpeningService.getTopGames(currentFEN, options),
          lichessOpeningService.getRecentGames(currentFEN, options)
        ]);

        setOpeningMoves(moves);
        setOpeningStats(stats);
        setTopGames(topGamesData);
        setRecentGames(recentGamesData);
      } catch (error) {
        console.error('Failed to load Lichess opening data:', error);
        setError('Failed to load opening data. Please try again.');
        setOpeningMoves([]);
        setOpeningStats(null);
        setTopGames([]);
        setRecentGames([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadOpeningData();
  }, [currentFEN, database, player, ratingRange, timeControl]);

  const sortedMoves = React.useMemo(() => {
    return [...openingMoves].sort((a, b) => {
      switch (sortBy) {
        case 'popularity':
          return (b.white + b.draws + b.black) - (a.white + a.draws + a.black);
        case 'winrate':
          const aWinRate = a.white + a.draws + a.black > 0 ? (a.white / (a.white + a.draws + a.black)) * 100 : 0;
          const bWinRate = b.white + b.draws + b.black > 0 ? (b.white / (b.white + b.draws + b.black)) * 100 : 0;
          return bWinRate - aWinRate;
        case 'rating':
          return b.averageRating - a.averageRating;
        default:
          return 0;
      }
    });
  }, [openingMoves, sortBy]);

  const filteredMoves = React.useMemo(() => {
    if (filterBy === 'all') return sortedMoves;
    
    // For now, we'll show all moves since we don't have move color info from Lichess API
    // In a real implementation, you'd need to determine if a move is white or black
    return sortedMoves;
  }, [sortedMoves, filterBy]);

  const getMoveColor = (move: LichessOpeningMove) => {
    const totalGames = move.white + move.draws + move.black;
    if (totalGames === 0) return 'text-gray-400';
    
    const whiteWinRate = (move.white / totalGames) * 100;
    const drawRate = (move.draws / totalGames) * 100;
    const blackWinRate = (move.black / totalGames) * 100;
    
    if (whiteWinRate > 50) return 'text-green-400';
    if (blackWinRate > 50) return 'text-red-400';
    if (drawRate > 50) return 'text-yellow-400';
    return 'text-gray-400';
  };

  const getPopularityColor = (move: LichessOpeningMove, maxGames: number) => {
    const totalGames = move.white + move.draws + move.black;
    const percentage = (totalGames / maxGames) * 100;
    if (percentage > 80) return 'bg-blue-600';
    if (percentage > 60) return 'bg-blue-500';
    if (percentage > 40) return 'bg-blue-400';
    if (percentage > 20) return 'bg-blue-300';
    return 'bg-blue-200';
  };

  const maxGames = Math.max(...openingMoves.map(m => m.white + m.draws + m.black), 1);

  const handleDatabaseChange = (newDatabase: DatabaseType) => {
    setDatabase(newDatabase);
    if (newDatabase !== 'player') {
      setPlayer('');
    }
  };

  const handleMoveClick = (move: LichessOpeningMove) => {
    setSelectedMove(move.uci);
    // Extract from/to from UCI notation
    const from = move.uci.substring(0, 2);
    const to = move.uci.substring(2, 4);
    onMoveClick(from, to);
  };

  return (
    <div className={`lichess-opening-tree ${className}`}>
      <div className="opening-header">
        <h3>Lichess Opening Explorer</h3>
        {openingStats && (
          <div className="opening-stats">
            <span className="stat">
              <strong>{openingStats.totalGames.toLocaleString()}</strong> games
            </span>
            <span className="stat">
              <strong>{openingStats.averageRating}</strong> avg rating
            </span>
            {openingStats.mostPopularMove && (
              <span className="stat">
                Most popular: <strong>{openingStats.mostPopularMove}</strong>
              </span>
            )}
            {openingStats.opening && (
              <span className="stat">
                <strong>{openingStats.opening.eco}</strong> {openingStats.opening.name}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="opening-controls">
        <div className="control-row">
          <div className="database-controls">
            <label>Database:</label>
            <select 
              value={database} 
              onChange={(e) => handleDatabaseChange(e.target.value as DatabaseType)}
            >
              <option value="lichess">Lichess Database</option>
              <option value="masters">Masters Database</option>
              <option value="player">Player Database</option>
            </select>
          </div>

          {database === 'player' && (
            <div className="player-controls">
              <label>Player:</label>
              <input
                type="text"
                value={player}
                onChange={(e) => setPlayer(e.target.value)}
                placeholder="Enter player name"
                className="player-input"
              />
            </div>
          )}

          <div className="sort-controls">
            <label>Sort by:</label>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)}>
              <option value="popularity">Popularity</option>
              <option value="winrate">Win Rate</option>
              <option value="rating">Rating</option>
            </select>
          </div>
          
          <div className="filter-controls">
            <label>Filter:</label>
            <select value={filterBy} onChange={(e) => setFilterBy(e.target.value as any)}>
              <option value="all">All Moves</option>
              <option value="white">White Moves</option>
              <option value="black">Black Moves</option>
            </select>
          </div>
          
          <button
            className="advanced-toggle"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            {showAdvanced ? 'Hide' : 'Show'} Advanced
          </button>
        </div>
        
        {showAdvanced && (
          <div className="advanced-controls">
            <div className="filter-options">
              <div className="filter-group">
                <label>Rating Range:</label>
                <input
                  type="text"
                  value={ratingRange}
                  onChange={(e) => setRatingRange(e.target.value)}
                  placeholder="e.g., 2000,2200"
                  className="rating-input"
                />
              </div>
              <div className="filter-group">
                <label>Time Control:</label>
                <select value={timeControl} onChange={(e) => setTimeControl(e.target.value)}>
                  <option value="">All</option>
                  <option value="blitz">Blitz</option>
                  <option value="rapid">Rapid</option>
                  <option value="classical">Classical</option>
                  <option value="blitz,rapid">Blitz + Rapid</option>
                </select>
              </div>
            </div>
            
            <div className="stats-summary">
              <div className="stat-item">
                <span className="stat-label">Total Moves:</span>
                <span className="stat-value">{openingMoves.length}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Most Popular:</span>
                <span className="stat-value">{openingMoves[0]?.san || 'N/A'}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Best Win Rate:</span>
                <span className="stat-value">
                  {openingMoves.length > 0 ? 
                    Math.max(...openingMoves.map(m => {
                      const total = m.white + m.draws + m.black;
                      return total > 0 ? (m.white / total) * 100 : 0;
                    })).toFixed(1) : '0.0'
                  }%
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="error-message">
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      )}

      <div className="opening-moves">
        {isLoading ? (
          <div className="loading-state">
            <div className="spinner" />
            <p>Loading opening data from Lichess...</p>
          </div>
        ) : filteredMoves.length === 0 ? (
          <div className="no-opening-data">
            <p>No opening data available for this position</p>
            <p>Try making some moves to explore opening theory</p>
          </div>
        ) : (
          filteredMoves.map((move, index) => {
            const totalGames = move.white + move.draws + move.black;
            const whiteWinRate = totalGames > 0 ? (move.white / totalGames) * 100 : 0;
            const drawRate = totalGames > 0 ? (move.draws / totalGames) * 100 : 0;
            const blackWinRate = totalGames > 0 ? (move.black / totalGames) * 100 : 0;

            return (
              <div
                key={move.uci}
                className={`opening-move ${selectedMove === move.uci ? 'selected' : ''}`}
                onClick={() => handleMoveClick(move)}
              >
                <div className="move-header">
                  <span className="move-number">#{index + 1}</span>
                  <span className={`move-san ${getMoveColor(move)}`}>{move.san}</span>
                  <span className="move-frequency">{totalGames.toLocaleString()} games</span>
                </div>

                <div className="move-stats">
                  <div className="win-rates">
                    <span className="white-wins">
                      W: {whiteWinRate.toFixed(1)}% ({move.white.toLocaleString()})
                    </span>
                    <span className="draws">
                      D: {drawRate.toFixed(1)}% ({move.draws.toLocaleString()})
                    </span>
                    <span className="black-wins">
                      B: {blackWinRate.toFixed(1)}% ({move.black.toLocaleString()})
                    </span>
                  </div>

                  <div className="move-details">
                    <span className="rating">Avg: {move.averageRating}</span>
                  </div>
                </div>

                <div className="popularity-bar">
                  <div
                    className={`popularity-fill ${getPopularityColor(move, maxGames)}`}
                    style={{ width: `${(totalGames / maxGames) * 100}%` }}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>

      {(topGames.length > 0 || recentGames.length > 0) && (
        <div className="games-section">
          {topGames.length > 0 && (
            <div className="top-games">
              <h4>Top Games</h4>
              <div className="games-list">
                {topGames.slice(0, 3).map((game, index) => (
                  <div key={game.id} className="game-item">
                    <span className="game-result">
                      {game.winner === 'white' ? '1-0' : game.winner === 'black' ? '0-1' : '½-½'}
                    </span>
                    <span className="game-players">
                      {game.white.name} ({game.white.rating}) vs {game.black.name} ({game.black.rating})
                    </span>
                    <span className="game-year">{game.year}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {recentGames.length > 0 && (
            <div className="recent-games">
              <h4>Recent Games</h4>
              <div className="games-list">
                {recentGames.slice(0, 3).map((game, index) => (
                  <div key={game.id} className="game-item">
                    <span className="game-result">
                      {game.winner === 'white' ? '1-0' : game.winner === 'black' ? '0-1' : '½-½'}
                    </span>
                    <span className="game-players">
                      {game.white.name} ({game.white.rating}) vs {game.black.name} ({game.black.rating})
                    </span>
                    <span className="game-year">{game.year}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LichessOpeningTree;
