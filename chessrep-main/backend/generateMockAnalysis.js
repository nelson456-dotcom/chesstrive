const mongoose = require('mongoose');
const Game = require('./models/Game');
const GameAnalysis = require('./models/GameAnalysis');

mongoose.connect('mongodb://localhost:27017/chessrep', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

function generateMockAnalysis() {
  const moves = [];
  const moveCount = Math.floor(Math.random() * 40) + 20; // 20-60 moves
  
  for (let i = 0; i < moveCount; i++) {
    const moveTypes = ['best', 'good', 'inaccuracy', 'mistake', 'blunder'];
    const weights = [0.4, 0.3, 0.15, 0.1, 0.05]; // 40% best, 30% good, etc.
    
    let quality = 'best';
    const rand = Math.random();
    let cumulative = 0;
    for (let j = 0; j < moveTypes.length; j++) {
      cumulative += weights[j];
      if (rand <= cumulative) {
        quality = moveTypes[j];
        break;
      }
    }
    
    // Generate realistic centipawn scores
    let cp = 0;
    switch (quality) {
      case 'best': cp = Math.floor(Math.random() * 50) - 25; break;
      case 'good': cp = Math.floor(Math.random() * 100) - 50; break;
      case 'inaccuracy': cp = Math.floor(Math.random() * 200) - 100; break;
      case 'mistake': cp = Math.floor(Math.random() * 300) - 150; break;
      case 'blunder': cp = Math.floor(Math.random() * 500) - 250; break;
    }
    
    moves.push({
      index: i,
      move: `move${i + 1}`,
      cp: cp,
      quality: quality
    });
  }
  
  // Count move types
  const counts = {
    best: moves.filter(m => m.quality === 'best').length,
    good: moves.filter(m => m.quality === 'good').length,
    inaccuracy: moves.filter(m => m.quality === 'inaccuracy').length,
    mistake: moves.filter(m => m.quality === 'mistake').length,
    blunder: moves.filter(m => m.quality === 'blunder').length,
    total: moves.length
  };
  
  return { moves, counts };
}

async function generateMockAnalysisForGames() {
  try {
    // Find all games without analysis
    const games = await Game.find({});
    const analyses = await GameAnalysis.find({});
    
    const analyzedGameIds = new Set(analyses.map(a => String(a.game)));
    const gamesWithoutAnalysis = games.filter(g => !analyzedGameIds.has(String(g._id)));
    
    console.log(`Found ${gamesWithoutAnalysis.length} games without analysis`);
    
    for (const game of gamesWithoutAnalysis) {
      try {
        const { moves, counts } = generateMockAnalysis();
        
        const analysis = new GameAnalysis({
          game: game._id,
          moves: moves,
          counts: counts
        });
        
        await analysis.save();
        console.log(`Generated mock analysis for game: ${game.gameUrl}`);
      } catch (error) {
        console.log(`Failed to generate analysis for game ${game._id}: ${error.message}`);
      }
    }
    
    console.log('Mock analysis generation complete!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

generateMockAnalysisForGames();
