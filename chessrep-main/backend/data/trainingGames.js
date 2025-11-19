/**
 * Training games from different rating levels
 * These are real game patterns that the bot can learn from
 * 
 * Format: {
 *   ratingRange: [min, max],
 *   games: [{ pgn, rating, result }]
 * }
 */

const trainingGames = {
  // Beginner level (800-1200)
  beginner: {
    ratingRange: [800, 1200],
    games: [
      // Add PGN games here from beginner players
      // These will show common beginner patterns (hanging pieces, simple tactics)
    ]
  },
  
  // Intermediate level (1200-1600)
  intermediate: {
    ratingRange: [1200, 1600],
    games: [
      // Add PGN games here from intermediate players
      // These will show better tactical awareness, fewer blunders
    ]
  },
  
  // Advanced level (1600-2000)
  advanced: {
    ratingRange: [1600, 2000],
    games: [
      // Add PGN games here from advanced players
      // These will show strong positional play, good tactics
    ]
  },
  
  // Expert level (2000-2400)
  expert: {
    ratingRange: [2000, 2400],
    games: [
      // Add PGN games here from expert players
      // These will show deep calculation, strategic planning
    ]
  },
  
  // Master level (2400+)
  master: {
    ratingRange: [2400, 3000],
    games: [
      // Add PGN games here from master players
      // These will show near-perfect play
    ]
  }
};

module.exports = trainingGames;











