const axios = require('axios');

async function testLichessAPI() {
  try {
    console.log('🔍 Testing Lichess API...\n');
    
    // Test with a known username
    const username = 'razoreddie'; // from the previous debug
    const url = `https://lichess.org/api/games/user/${encodeURIComponent(username)}?max=5&pgnInJson=true&clocks=false&evals=false&moves=true&opening=true`;
    
    console.log(`📊 Requesting: ${url}`);
    
    const res = await axios.get(url, {
      headers: { Accept: 'application/x-ndjson' },
      responseType: 'text'
    });
    
    const text = res.data || '';
    console.log(`📊 Response length: ${text.length} characters`);
    
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    console.log(`📊 Found ${lines.length} game lines`);
    
    if (lines.length > 0) {
      console.log(`📊 First game data:`);
      const firstGame = JSON.parse(lines[0]);
      console.log(JSON.stringify(firstGame, null, 2));
      
      if (firstGame.pgn) {
        console.log(`📊 PGN content:`);
        console.log('---START PGN---');
        console.log(firstGame.pgn);
        console.log('---END PGN---');
        
        // Check for moves
        const hasMoves = firstGame.pgn.includes('1.') || 
                        firstGame.pgn.includes('1-0') || 
                        firstGame.pgn.includes('0-1') || 
                        firstGame.pgn.includes('1/2-1/2') ||
                        firstGame.pgn.includes('e4') ||
                        firstGame.pgn.includes('d4');
        
        console.log(`📊 PGN contains moves: ${hasMoves}`);
      }
    }
    
  } catch (error) {
    console.error('❌ API test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testLichessAPI();
