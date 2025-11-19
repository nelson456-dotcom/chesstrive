const mongoose = require('mongoose');
const Game = require('./models/Game');

async function checkJamesGames() {
  try {
    await mongoose.connect('mongodb://localhost:27017/chessrep');
    console.log('Connected to database');
    
    // Check for jamesjonathon games for user saleh
    const userId = '68aa5254214bb50af7da4f0a';
    const games = await Game.find({
      user: userId,
      '$or': [
        { whiteUsername: /jamesjonathon/i },
        { blackUsername: /jamesjonathon/i }
      ]
    });
    
    console.log(`Games with jamesjonathon for user saleh: ${games.length}`);
    games.forEach((g, i) => {
      console.log(`${i+1}. White: ${g.whiteUsername}, Black: ${g.blackUsername}, URL: ${g.gameUrl}`);
    });
    
    // Also check all games for user saleh
    const allGames = await Game.find({ user: userId }).limit(10);
    console.log(`\nAll games for user saleh (first 10):`);
    allGames.forEach((g, i) => {
      console.log(`${i+1}. White: ${g.whiteUsername}, Black: ${g.blackUsername}, URL: ${g.gameUrl}`);
    });
    
    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkJamesGames();


