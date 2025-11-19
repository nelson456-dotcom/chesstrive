// Game Manager Utility
// Handles saving and retrieving chess games from localStorage

const GAME_STORAGE_KEY = 'chessrep_saved_games';

// Game structure
export const createGame = (pgn, fen, title = '', description = '') => {
  return {
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    pgn: pgn,
    fen: fen,
    title: title || `Game ${new Date().toLocaleDateString()}`,
    description: description,
    createdAt: new Date().toISOString(),
    lastPlayed: new Date().toISOString(),
    moveCount: pgn ? pgn.split(' ').filter(move => move && !move.includes('.')).length : 0
  };
};

// Save a game to localStorage
export const saveGame = (game) => {
  try {
    const savedGames = getSavedGames();
    const existingIndex = savedGames.findIndex(g => g.id === game.id);
    
    if (existingIndex >= 0) {
      // Update existing game
      savedGames[existingIndex] = { ...game, lastPlayed: new Date().toISOString() };
    } else {
      // Add new game
      savedGames.unshift(game); // Add to beginning for recent games first
    }
    
    // Keep only last 50 games to prevent localStorage bloat
    const gamesToSave = savedGames.slice(0, 50);
    localStorage.setItem(GAME_STORAGE_KEY, JSON.stringify(gamesToSave));
    
    console.log('🎮 Game saved:', game.title);
    return true;
  } catch (error) {
    console.error('❌ Error saving game:', error);
    return false;
  }
};

// Get all saved games
export const getSavedGames = () => {
  try {
    const games = localStorage.getItem(GAME_STORAGE_KEY);
    return games ? JSON.parse(games) : [];
  } catch (error) {
    console.error('❌ Error retrieving games:', error);
    return [];
  }
};

// Get a specific game by ID
export const getGameById = (id) => {
  const games = getSavedGames();
  return games.find(game => game.id === id);
};

// Delete a game
export const deleteGame = (id) => {
  try {
    const games = getSavedGames();
    const filteredGames = games.filter(game => game.id !== id);
    localStorage.setItem(GAME_STORAGE_KEY, JSON.stringify(filteredGames));
    console.log('🗑️ Game deleted:', id);
    return true;
  } catch (error) {
    console.error('❌ Error deleting game:', error);
    return false;
  }
};

// Update game title/description
export const updateGame = (id, updates) => {
  try {
    const games = getSavedGames();
    const gameIndex = games.findIndex(game => game.id === id);
    
    if (gameIndex >= 0) {
      games[gameIndex] = { ...games[gameIndex], ...updates };
      localStorage.setItem(GAME_STORAGE_KEY, JSON.stringify(games));
      console.log('✏️ Game updated:', id);
      return true;
    }
    return false;
  } catch (error) {
    console.error('❌ Error updating game:', error);
    return false;
  }
};

// Generate PGN from game tree
export const generatePGNFromTree = (gameTree) => {
  if (!gameTree || !gameTree.root) return '';
  
  const moves = [];
  let currentNode = gameTree.root;
  let moveNumber = 1;
  
  // Traverse the main line
  while (currentNode && currentNode.variations.length > 0) {
    const nextMove = currentNode.variations[0]; // Main line is first variation
    
    if (nextMove.san) {
      if (nextMove.isWhite) {
        moves.push(`${moveNumber}.${nextMove.san}`);
      } else {
        moves.push(nextMove.san);
        moveNumber++;
      }
    }
    
    currentNode = nextMove;
  }
  
  return moves.join(' ');
};

// Generate PGN with headers
export const generateFullPGN = (gameTree, additionalHeaders = {}) => {
  const moves = generatePGNFromTree(gameTree);
  
  const headers = {
    Event: 'ChessRep Analysis',
    Site: 'ChessRep.com',
    Date: new Date().toISOString().split('T')[0].replace(/-/g, '.'),
    Round: '1',
    White: 'Player',
    Black: 'Player',
    Result: '*', // Ongoing game
    ...additionalHeaders
  };
  
  let pgn = '';
  for (const [key, value] of Object.entries(headers)) {
    pgn += `[${key} "${value}"]\n`;
  }
  pgn += '\n' + moves + ' *';
  
  return pgn;
};

// Export game as downloadable file
export const exportGameAsFile = (game, format = 'pgn') => {
  try {
    let content = '';
    let filename = '';
    let mimeType = '';
    
    if (format === 'pgn') {
      content = game.pgn;
      filename = `${game.title.replace(/[^a-z0-9]/gi, '_')}.pgn`;
      mimeType = 'application/x-chess-pgn';
    } else if (format === 'json') {
      content = JSON.stringify(game, null, 2);
      filename = `${game.title.replace(/[^a-z0-9]/gi, '_')}.json`;
      mimeType = 'application/json';
    }
    
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    console.log('📁 Game exported:', filename);
    return true;
  } catch (error) {
    console.error('❌ Error exporting game:', error);
    return false;
  }
};


