const fs = require('fs');
const path = require('path');
const PGNParser = require('pgn-parser');

const GAMES_DIR = path.join(__dirname, '../data');

// Function to normalize PGN string
function normalizePGN(pgnString) {
  return pgnString
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/;\s*[^\n]*\n/g, '\n')
    .replace(/\\"/g, '"')
    .replace(/\n\s*\n/g, '\n\n')
    .replace(/\s*1-0\s*$/gm, ' 1-0')
    .replace(/\s*0-1\s*$/gm, ' 0-1')
    .replace(/\s*1\/2-1\/2\s*$/gm, ' 1/2-1/2');
}

// Function to parse and validate PGN games
function parseAndValidateGames(pgnContent, level) {
  try {
    const normalizedPGN = normalizePGN(pgnContent);
    const games = PGNParser.parse(normalizedPGN);
    
    console.log(`Parsed ${games.length} games for ${level} level`);
    
    // Validate and clean games
    const validGames = games.filter(game => {
      // Check if game has moves
      if (!game.moves || game.moves.length === 0) {
        console.log(`Skipping game without moves in ${level}`);
        return false;
      }
      
      // Check if game has basic headers
      const hasEvent = game.headers.some(h => h.name === 'Event');
      const hasResult = game.headers.some(h => h.name === 'Result');
      
      if (!hasEvent || !hasResult) {
        console.log(`Skipping game with missing headers in ${level}`);
        return false;
      }
      
      return true;
    });
    
    console.log(`Valid games for ${level}: ${validGames.length}`);
    return validGames;
  } catch (error) {
    console.error(`Error parsing ${level} games:`, error);
    return [];
  }
}

// Function to write games to PGN file
function writeGamesToFile(games, filename) {
  const filePath = path.join(GAMES_DIR, filename);
  let pgnContent = '';
  
  games.forEach((game, index) => {
    // Write headers
    game.headers.forEach(header => {
      pgnContent += `[${header.name} "${header.value}"]\n`;
    });
    pgnContent += '\n';
    
    // Write moves
    const moves = game.moves.map(m => m.move);
    let moveText = '';
    
    for (let i = 0; i < moves.length; i++) {
      if (i % 2 === 0) {
        moveText += `${Math.floor(i / 2) + 1}. `;
      }
      moveText += `${moves[i]} `;
    }
    
    pgnContent += moveText.trim();
    
    // Add result if not present
    const result = game.headers.find(h => h.name === 'Result')?.value;
    if (result) {
      pgnContent += ` ${result}`;
    }
    
    pgnContent += '\n\n';
  });
  
  fs.writeFileSync(filePath, pgnContent);
  console.log(`Written ${games.length} games to ${filename}`);
}

// Main import function
async function importTrainingGames() {
  console.log('Starting training games import...');
  
  // Your provided PGN data
  const masterPGN = `[Event "Uxbridge Int Alekhine"]
[Site "Uxbridge"]
[Date "1993.??.??"]
[Round "?"]
[White "Kasparov, Garry"]
[Black "Short, Nigel D"]
[Result "1-0"]
[ECO "B01"]
[WhiteElo "2805"]
[BlackElo "2650"]
[PlyCount "47"]
[EventDate "1993.??.??"]

1. e4 d6 2. d4 Nf6 3. Nc3 g6 4. f4 Bg7 5. Nf3 c5 6. Bb5+ Bd7 7. e5 Ng4 8. e6 f5 9. exd7+ Nxd7 10. dxc5 Nxc5 11. Bxd7+ Qxd7 12. Qe2 Nce6 13. O-O O-O 14. f5 gxf5 15. Bxf5 Nxf5 16. Qxf5 Qd6 17. Qe4 Qe6 18. Qxe6+ Nxe6 19. Rf2 Rf7 20. Raf1 Raf8 21. Nd5 Bf8 22. Nf6+ Kh8 23. Nh5 Rg7 24. Nf6 1-0`;

  const intermediatePGN = `[Event "Live Chess"]
[Site "Chess.com"]
[Date "2024.01.15"]
[Round "?"]
[White "Player1"]
[Black "Player2"]
[Result "1-0"]
[ECO "C41"]
[WhiteElo "1500"]
[BlackElo "1480"]
[PlyCount "65"]
[EventDate "2024.01.15"]

1. e4 e5 2. Nf3 d6 3. d4 exd4 4. Nxd4 Nf6 5. Nc3 Be7 6. Be2 O-O 7. O-O Nc6 8. Nxc6 bxc6 9. Bf3 Re8 10. Qd3 Bb7 11. Bg5 h6 12. Bh4 g5 13. Bg3 Nh5 14. Qe3 Nxg3 15. hxg3 Bf6 16. Rad1 Qe7 17. Qd2 Rab8 18. b3 c5 19. f4 gxf4 20. gxf4 Bg7 21. e5 dxe5 22. fxe5 Qxe5 23. Qf4 Qxf4 24. Rxf4 Bc8 25. Rdf1 Bb7 26. Rf7 Bc8 27. R7f3 Bb7 28. Rf7 Bc8 29. R7f3 Bb7 30. Rf7 Bc8 31. R7f3 Bb7 32. Rf7 Bc8 33. R7f3 1-0`;

  const beginnerPGN = `[Event "Let's Play!"]
[Site "Chess.com"]
[Date "2024.01.10"]
[Round "?"]
[White "NewPlayer1"]
[Black "NewPlayer2"]
[Result "0-1"]
[ECO "B00"]
[WhiteElo "800"]
[BlackElo "850"]
[PlyCount "42"]
[EventDate "2024.01.10"]

1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. O-O Nf6 5. d3 d6 6. Nc3 O-O 7. Be3 Bxe3 8. fxe3 Ng4 9. Qe1 Nxe3 10. Qxe3 Bg4 11. h3 Bh5 12. g4 Bg6 13. Nh4 Qd7 14. Nxg6 hxg6 15. Qf3 Qe6 16. Qg3 Kh7 17. Rf3 Qh6 18. Qxh6+ gxh6 19. Rf2 Rg8 20. Raf1 Rg6 21. Rf3 Rag8 0-1`;

  try {
    // Parse games for each level
    const masterGames = parseAndValidateGames(masterPGN, 'master');
    const intermediateGames = parseAndValidateGames(intermediatePGN, 'intermediate');
    const beginnerGames = parseAndValidateGames(beginnerPGN, 'beginner');
    
    // Write games to files
    writeGamesToFile(masterGames, 'master_games.pgn');
    writeGamesToFile(intermediateGames, 'intermediate_games.pgn');
    writeGamesToFile(beginnerGames, 'beginner_games.pgn');
    
    console.log('\nImport completed successfully!');
    console.log(`Master games: ${masterGames.length}`);
    console.log(`Intermediate games: ${intermediateGames.length}`);
    console.log(`Beginner games: ${beginnerGames.length}`);
    
    // Generate summary statistics
    console.log('\nTraining dataset summary:');
    console.log('========================');
    
    [masterGames, intermediateGames, beginnerGames].forEach((games, index) => {
      const levels = ['master', 'intermediate', 'beginner'];
      const level = levels[index];
      
      if (games.length > 0) {
        const avgMoves = Math.round(
          games.reduce((sum, game) => sum + game.moves.length, 0) / games.length
        );
        
        console.log(`${level.toUpperCase()}:`);
        console.log(`  Games: ${games.length}`);
        console.log(`  Average moves per game: ${avgMoves}`);
        
        // Count results
        const results = games.reduce((acc, game) => {
          const result = game.headers.find(h => h.name === 'Result')?.value || '';
          acc[result] = (acc[result] || 0) + 1;
          return acc;
        }, {});
        
        console.log(`  Results:`, results);
        console.log('');
      }
    });
    
  } catch (error) {
    console.error('Error during import:', error);
  }
}

// Function to add more games to existing files
async function addMoreGames(level, additionalPGN) {
  console.log(`Adding more games to ${level} level...`);
  
  const filename = `${level}_games.pgn`;
  const filePath = path.join(GAMES_DIR, filename);
  
  // Read existing games
  let existingGames = [];
  if (fs.existsSync(filePath)) {
    const existingContent = fs.readFileSync(filePath, 'utf8');
    existingGames = parseAndValidateGames(existingContent, level);
  }
  
  // Parse new games
  const newGames = parseAndValidateGames(additionalPGN, level);
  
  // Combine games
  const allGames = [...existingGames, ...newGames];
  
  // Write combined games
  writeGamesToFile(allGames, filename);
  
  console.log(`Total games for ${level}: ${allGames.length}`);
}

// Export functions for use in other scripts
module.exports = {
  importTrainingGames,
  addMoreGames,
  parseAndValidateGames,
  normalizePGN
};

// Run import if this script is executed directly
if (require.main === module) {
  importTrainingGames();
}
