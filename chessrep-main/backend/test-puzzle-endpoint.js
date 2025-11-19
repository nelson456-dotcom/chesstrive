const http = require('http');

function testPuzzleEndpoint() {
  const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/puzzles/random?count=1',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  };

  const req = http.request(options, (res) => {
    console.log(`Status: ${res.statusCode}`);
    console.log(`Headers:`, res.headers);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const puzzle = JSON.parse(data);
        console.log('\n🧩 Puzzle Response:');
        console.log(JSON.stringify(puzzle, null, 2));
        
        if (puzzle.puzzles && puzzle.puzzles.length > 0) {
          console.log('\n✅ Puzzle endpoint working!');
          console.log(`Puzzle ID: ${puzzle.puzzles[0]._id}`);
          console.log(`Theme: ${puzzle.puzzles[0].theme}`);
          console.log(`Rating: ${puzzle.puzzles[0].rating}`);
        } else {
          console.log('\n❌ No puzzles returned');
        }
      } catch (err) {
        console.log('\n❌ Error parsing response:', err.message);
        console.log('Raw response:', data);
      }
    });
  });

  req.on('error', (err) => {
    console.error('❌ Request error:', err.message);
    console.log('Make sure the backend server is running on port 3001');
  });

  req.end();
}

console.log('🧪 Testing puzzle endpoint...');
testPuzzleEndpoint();


