// Comprehensive puzzle tracking utility
// Handles both regular puzzles and endgame trainer with separate rating systems

export const PUZZLE_TYPES = {
  REGULAR: 'regular',
  ENDGAME: 'endgame'
};

export const RATING_SYSTEMS = {
  [PUZZLE_TYPES.REGULAR]: 'puzzleRating',
  [PUZZLE_TYPES.ENDGAME]: 'endgameRating'
};

// Save puzzle result to localStorage with proper categorization
export const savePuzzleResult = (puzzleData, solved, puzzleType = PUZZLE_TYPES.REGULAR) => {
  const historyEntry = {
    id: puzzleData._id || puzzleData.id || Date.now().toString(),
    fen: puzzleData.fen,
    moves: puzzleData.moves || puzzleData.solution || [],
    rating: puzzleData.rating || 1200,
    theme: puzzleData.theme || puzzleData.category || 'general',
    description: puzzleData.description || puzzleData.explanation || '',
    solved: solved,
    puzzleType: puzzleType,
    timestamp: new Date().toISOString(),
    date: new Date().toISOString().split('T')[0] // YYYY-MM-DD format
  };

  // Get existing history
  const storageKey = puzzleType === PUZZLE_TYPES.REGULAR ? 'puzzleHistory' : 'endgamePuzzleHistory';
  const existingHistory = JSON.parse(localStorage.getItem(storageKey) || '[]');
  
  // Add new entry and keep only last 1000 puzzles
  const newHistory = [historyEntry, ...existingHistory].slice(0, 1000);
  
  // Save to localStorage
  localStorage.setItem(storageKey, JSON.stringify(newHistory));
  
  // Also save to combined history for profile statistics
  const combinedKey = 'combinedPuzzleHistory';
  const combinedHistory = JSON.parse(localStorage.getItem(combinedKey) || '[]');
  const newCombinedHistory = [historyEntry, ...combinedHistory].slice(0, 2000);
  localStorage.setItem(combinedKey, JSON.stringify(newCombinedHistory));
  
  return historyEntry;
};

// Get puzzles from the past 24 hours
export const getRecentPuzzles = (puzzleType = null, hours = 24) => {
  const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
  
  if (puzzleType) {
    const storageKey = puzzleType === PUZZLE_TYPES.REGULAR ? 'puzzleHistory' : 'endgamePuzzleHistory';
    const history = JSON.parse(localStorage.getItem(storageKey) || '[]');
    return history.filter(puzzle => new Date(puzzle.timestamp) >= cutoffTime);
  } else {
    // Get from combined history
    const combinedHistory = JSON.parse(localStorage.getItem('combinedPuzzleHistory') || '[]');
    return combinedHistory.filter(puzzle => new Date(puzzle.timestamp) >= cutoffTime);
  }
};

// Get daily statistics for a specific date range
export const getDailyStats = (startDate = null, endDate = null) => {
  const combinedHistory = JSON.parse(localStorage.getItem('combinedPuzzleHistory') || '[]');
  
  let filteredHistory = combinedHistory;
  
  if (startDate) {
    const start = new Date(startDate);
    filteredHistory = filteredHistory.filter(puzzle => new Date(puzzle.timestamp) >= start);
  }
  
  if (endDate) {
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999); // End of day
    filteredHistory = filteredHistory.filter(puzzle => new Date(puzzle.timestamp) <= end);
  }
  
  // Group by date
  const dailyStats = {};
  
  filteredHistory.forEach(puzzle => {
    const date = puzzle.date;
    if (!dailyStats[date]) {
      dailyStats[date] = {
        date: date,
        regular: {
          total: 0,
          solved: 0,
          failed: 0,
          highestRating: 0,
          averageRating: 0,
          ratings: []
        },
        endgame: {
          total: 0,
          solved: 0,
          failed: 0,
          highestRating: 0,
          averageRating: 0,
          ratings: []
        }
      };
    }
    
    const type = puzzle.puzzleType === PUZZLE_TYPES.REGULAR ? 'regular' : 'endgame';
    const stats = dailyStats[date][type];
    
    stats.total++;
    if (puzzle.solved) {
      stats.solved++;
    } else {
      stats.failed++;
    }
    
    stats.ratings.push(puzzle.rating);
    stats.highestRating = Math.max(stats.highestRating, puzzle.rating);
  });
  
  // Calculate averages
  Object.values(dailyStats).forEach(dayStats => {
    ['regular', 'endgame'].forEach(type => {
      const stats = dayStats[type];
      if (stats.ratings.length > 0) {
        stats.averageRating = Math.round(
          stats.ratings.reduce((sum, rating) => sum + rating, 0) / stats.ratings.length
        );
      }
    });
  });
  
  return dailyStats;
};

// Get overall statistics
export const getOverallStats = (puzzleType = null) => {
  const history = puzzleType 
    ? JSON.parse(localStorage.getItem(
        puzzleType === PUZZLE_TYPES.REGULAR ? 'puzzleHistory' : 'endgamePuzzleHistory'
      ) || '[]')
    : JSON.parse(localStorage.getItem('combinedPuzzleHistory') || '[]');
  
  const stats = {
    total: history.length,
    solved: history.filter(p => p.solved).length,
    failed: history.filter(p => !p.solved).length,
    highestRating: Math.max(...history.map(p => p.rating), 0),
    averageRating: 0,
    accuracy: 0
  };
  
  if (history.length > 0) {
    stats.averageRating = Math.round(
      history.reduce((sum, p) => sum + p.rating, 0) / history.length
    );
    stats.accuracy = Math.round((stats.solved / stats.total) * 100);
  }
  
  return stats;
};

// Get puzzle type display name
export const getPuzzleTypeDisplayName = (puzzleType) => {
  switch (puzzleType) {
    case PUZZLE_TYPES.REGULAR:
      return 'Tactical Puzzles';
    case PUZZLE_TYPES.ENDGAME:
      return 'Endgame Trainer';
    default:
      return 'Puzzles';
  }
};

// Get rating system name
export const getRatingSystemName = (puzzleType) => {
  switch (puzzleType) {
    case PUZZLE_TYPES.REGULAR:
      return 'Puzzle Rating';
    case PUZZLE_TYPES.ENDGAME:
      return 'Endgame Rating';
    default:
      return 'Rating';
  }
};

// Format date for display
export const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

// Get last N days of statistics
export const getLastNDaysStats = (days = 7) => {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return getDailyStats(startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]);
};


