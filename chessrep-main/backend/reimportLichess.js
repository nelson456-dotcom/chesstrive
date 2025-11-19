const mongoose = require('mongoose');
const axios = require('axios');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/chessrep', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Import models
const Game = require('./models/Game');
const GameAnalysis = require('./models/GameAnalysis');

async function fetchLichessGames(username, maxGames = 40) {
  console.log(`[Lichess] Fetching games for username: ${username}`);
  try {
    const user = (username || '').trim();
    if (!user) throw new Error('Username empty');
    const url = `https://lichess.org/api/games/user/${encodeURIComponent(user)}?max=${maxGames}&pgnInJson=true&clocks=false&evals=false&moves=true&opening=true`;
    console.log(`[Lichess] Requesting: ${url}`);
    const res = await axios.get(url, {
      headers: { Accept: 'application/x-ndjson' },
      responseType: 'text'
    });
    const text = res.data || '';
    console.log(`[Lichess] Response length: ${text.length} characters`);
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    console.log(`[Lichess] Found ${lines.length} game lines`);
    const games = [];
    for (const line of lines) {
      try {
        const obj = JSON.parse(line);
        if (!obj.pgn) continue;
        
        // Check if game has moves
        if (!obj.moves || !obj.moves.trim()) {
          console.log(`[Lichess] Skipping game ${obj.id} - no moves found`);
          continue;
        }
        
        // Construct full PGN by combining headers with moves
        let fullPgn = obj.pgn || '';
        if (obj.moves && obj.moves.trim()) {
          // Convert space-separated moves to numbered PGN format
          const moves = obj.moves.trim().split(' ');
          let numberedMoves = '';
          for (let i = 0; i < moves.length; i += 2) {
            const moveNumber = Math.floor(i / 2) + 1;
            const whiteMove = moves[i];
            const blackMove = moves[i + 1];
            if (whiteMove) {
              numberedMoves += `${moveNumber}. ${whiteMove}`;
              if (blackMove) {
                numberedMoves += ` ${blackMove} `;
              } else {
                numberedMoves += ' ';
              }
            }
          }
          fullPgn += numberedMoves.trim();
        }
        
        games.push({
          url: obj.id ? `https://lichess.org/${obj.id}` : undefined,
          pgn: fullPgn,
          endTime: obj.lastMoveAt ? new Date(obj.lastMoveAt) : undefined,
          white: obj.players?.white?.user?.name ? obj.players.white.user.name.toLowerCase() : undefined,
          black: obj.players?.black?.user?.name ? obj.players.black.user.name.toLowerCase() : undefined,
          result: obj.winner ? (obj.winner === 'white' ? '1-0' : obj.winner === 'black' ? '0-1' : '1/2-1/2') : obj.status,
          timeControl: obj.speed,
          timeClass: obj.speed
        });
        if (games.length >= maxGames) break;
      } catch (_) {
        // skip bad line
      }
    }
    console.log(`[Lichess] Total games collected: ${games.length}`);
    return games.slice(0, maxGames);
  } catch (err) {
    console.log(`[Lichess] Error: ${err.message}`);
    throw err;
  }
}

async function reimportLichess() {
  try {
    console.log('🔄 Re-importing Lichess games with fixed PGN...\n');
    
    // Get all existing Lichess games
    const existingGames = await Game.find({ platform: 'lichess' });
    console.log(`📊 Found ${existingGames.length} existing Lichess games`);
    
    if (existingGames.length === 0) {
      console.log('❌ No existing Lichess games found');
      return;
    }
    
    // Get username from first game
    const firstGame = existingGames[0];
    const username = firstGame.whiteUsername || firstGame.blackUsername;
    console.log(`📊 Re-importing for username: ${username}`);
    
    // Fetch fresh games
    const freshGames = await fetchLichessGames(username, 40);
    console.log(`📊 Fetched ${freshGames.length} fresh games`);
    
    // Update existing games with new PGN
    let updated = 0;
    for (const freshGame of freshGames) {
      const existing = existingGames.find(g => g.gameUrl === freshGame.url);
      if (existing) {
        // Update the PGN
        await Game.updateOne(
          { _id: existing._id },
          { 
            pgn: freshGame.pgn,
            analysed: false // Reset analysis flag to re-analyze
          }
        );
        
        // Delete old analysis
        await GameAnalysis.deleteOne({ game: existing._id });
        
        updated++;
        console.log(`✅ Updated game: ${freshGame.url}`);
      }
    }
    
    console.log(`\n✅ Re-import completed! Updated ${updated} games`);
    console.log('🔄 Games will be re-analyzed when you generate the next report');
    
  } catch (error) {
    console.error('❌ Re-import failed:', error);
  } finally {
    mongoose.disconnect();
  }
}

reimportLichess();
