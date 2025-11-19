const mongoose = require('mongoose');
const Game = require('./models/Game');

async function debugGames() {
  try {
    await mongoose.connect('mongodb://localhost:27017/chessrep');
    console.log('Connected to database');
    
    const games = await Game.find({}).limit(10);
    console.log(`Found ${games.length} games in database:`);
    
    games.forEach((g, i) => {
      console.log(`${i+1}. User ID: ${g.user}`);
      console.log(`   White: ${g.whiteUsername}`);
      console.log(`   Black: ${g.blackUsername}`);
      console.log(`   URL: ${g.gameUrl}`);
      console.log(`   Platform: ${g.platform}`);
      console.log('---');
    });
    
    // Check for any games with jamesjonathon
    const jamesGames = await Game.find({
      '$or': [
        { whiteUsername: /jamesjonathon/i },
        { blackUsername: /jamesjonathon/i }
      ]
    });
    
    console.log(`\nGames with jamesjonathon: ${jamesGames.length}`);
    if (jamesGames.length > 0) {
      jamesGames.forEach((g, i) => {
        console.log(`${i+1}. User ID: ${g.user}`);
        console.log(`   White: ${g.whiteUsername}`);
        console.log(`   Black: ${g.blackUsername}`);
        console.log(`   URL: ${g.gameUrl}`);
      });
    }
    
    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
  }
}

debugGames();


