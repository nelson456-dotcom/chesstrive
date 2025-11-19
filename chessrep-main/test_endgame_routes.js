const http = require('http');

// Helper function to make HTTP requests
function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: path,
      method: 'GET'
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed);
        } catch (e) {
          resolve({ error: 'Invalid JSON', raw: data });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.end();
  });
}

// Function to count pieces in a FEN string
function countPieces(fen) {
  return fen.split(' ')[0].replace(/\//g,'').replace(/\d/g,'').length;
}

// Function to check if it's likely an opening position
function isLikelyOpening(fen) {
  const fenBoard = fen.split(' ')[0];
  const backRankPieces = (fenBoard.split('/')[0].match(/[rnbqkRNBQK]/g) || []).length + 
                         (fenBoard.split('/')[7].match(/[rnbqkRNBQK]/g) || []).length;
  return backRankPieces > 8; // Likely opening if many pieces on starting ranks
}

async function testRoutes() {
  console.log('Testing Blunder Preventer and Visualization Routes');
  console.log('=' .repeat(50));

  // Test Blunder Preventer
  console.log('\n🎯 Testing Blunder Preventer Route:');
  try {
    for (let i = 1; i <= 5; i++) {
      const response = await makeRequest('/api/blunder-preventer/random');
      if (response.error) {
        console.log(`❌ Test ${i}: Error - ${response.error}`);
        continue;
      }

      const { fen, bestMove, blunderMove } = response;
      const pieceCount = countPieces(fen);
      const isOpening = isLikelyOpening(fen);
      
      console.log(`✅ Test ${i}:`);
      console.log(`   FEN: ${fen}`);
      console.log(`   Pieces: ${pieceCount}`);
      console.log(`   Best Move: ${bestMove}`);
      console.log(`   Blunder Move: ${blunderMove}`);
      console.log(`   Opening Position: ${isOpening ? '❌ YES (Bad!)' : '✅ NO (Good!)'}`);
      console.log('');
    }
  } catch (error) {
    console.log(`❌ Blunder Preventer Error: ${error.message}`);
  }

  // Test Visualization
  console.log('\n👁️ Testing Visualization Route:');
  try {
    for (let i = 1; i <= 5; i++) {
      const response = await makeRequest('/api/visualisation/random');
      if (response.error) {
        console.log(`❌ Test ${i}: Error - ${response.error}`);
        continue;
      }

      const { fen } = response;
      const pieceCount = countPieces(fen);
      const isOpening = isLikelyOpening(fen);
      
      console.log(`✅ Test ${i}:`);
      console.log(`   FEN: ${fen}`);
      console.log(`   Pieces: ${pieceCount}`);
      console.log(`   Opening Position: ${isOpening ? '❌ YES (Bad!)' : '✅ NO (Good!)'}`);
      console.log(`   Suitable for Visualization: ${pieceCount >= 4 && pieceCount <= 10 && !isOpening ? '✅ YES' : '❌ NO'}`);
      console.log('');
    }
  } catch (error) {
    console.log(`❌ Visualization Error: ${error.message}`);
  }

  console.log('Test completed! 🎉');
}

// Run tests
testRoutes().catch(console.error); 