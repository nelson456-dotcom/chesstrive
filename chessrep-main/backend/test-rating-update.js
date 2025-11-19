const http = require('http');

function testRatingUpdate() {
  const postData = JSON.stringify({
    solved: true,
    puzzleRating: 1500,
    theme: 'mate'
  });

  const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/puzzles/stats/puzzle',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-auth-token': 'test-token' // We'll need a real token
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
        const result = JSON.parse(data);
        console.log('\n📊 Rating Update Response:');
        console.log(JSON.stringify(result, null, 2));
      } catch (err) {
        console.log('\n❌ Error parsing response:', err.message);
        console.log('Raw response:', data);
      }
    });
  });

  req.on('error', (err) => {
    console.error('❌ Request error:', err.message);
  });

  req.write(postData);
  req.end();
}

console.log('🧪 Testing rating update endpoint...');
testRatingUpdate();


