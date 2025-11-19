const http = require('http');

async function testProfileIconRoute() {
  try {
    console.log('Testing profile icon route...');
    
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/auth/profile-icon',
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      console.log('Response status:', res.statusCode);
      console.log('Response headers:', res.headers);
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        const contentType = res.headers['content-type'];
        console.log('Content-Type:', contentType);
        
        if (contentType && contentType.includes('application/json')) {
          const jsonData = JSON.parse(data);
          console.log('Response data:', jsonData);
          
          if (res.statusCode === 401) {
            console.log('✅ Route exists! (Got expected 401 Unauthorized without token)');
          } else if (res.statusCode === 400) {
            console.log('✅ Route exists! (Got 400 - route is working)');
          } else {
            console.log('⚠️ Unexpected status code');
          }
        } else {
          console.log('Response text (first 200 chars):', data.substring(0, 200));
          console.log('❌ Route not found! Backend needs restart.');
          console.log('\n📝 Instructions to restart backend:');
          console.log('1. Stop the backend (Ctrl+C)');
          console.log('2. Run: npm start');
          console.log('3. Try updating profile icon again');
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Error testing route:', error.message);
      console.log('Make sure backend server is running on http://localhost:3001');
    });

    req.write(JSON.stringify({ profileIcon: 'crown' }));
    req.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testProfileIconRoute();
