const mongoose = require('mongoose');
const Game = require('./models/Game');
const User = require('./models/User');

async function testScouting() {
  try {
    await mongoose.connect('mongodb://localhost:27017/chessrep');
    console.log('Connected to database');
    
    // Test with different user IDs
    const userIds = [
      '68682731374001a1f40e1457', // User with alver87 games
      '68aa5254214bb50af7da4f0a'  // User with jamesjonathon games
    ];
    
    for (const userId of userIds) {
      console.log(`\n=== Testing User ID: ${userId} ===`);
      
      const gameFilter = { user: userId };
      const games = await Game.find(gameFilter).sort({ endTime: -1 }).limit(5);
      
      console.log(`Found ${games.length} games for this user:`);
      games.forEach((g, i) => {
        console.log(`${i+1}. White: ${g.whiteUsername}, Black: ${g.blackUsername}, URL: ${g.gameUrl}`);
      });
      
      // Check if any games have jamesjonathon
      const jamesGames = games.filter(g => 
        g.whiteUsername === 'jamesjonathon' || g.blackUsername === 'jamesjonathon'
      );
      
      if (jamesGames.length > 0) {
        console.log(`⚠️  Found ${jamesGames.length} games with jamesjonathon for user ${userId}`);
      }
    }
    
    // Check which user you're currently logged in as
    console.log('\n=== Current Users in Database ===');
    const users = await User.find({});
    users.forEach(user => {
      console.log(`User ID: ${user._id}, Username: ${user.username}, Email: ${user.email}`);
    });
    
    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
  }
}

testScouting();


