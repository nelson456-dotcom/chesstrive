const http = require('http');

console.log('🔍 Testing Posts API Route...\n');

// Test if backend is running
const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/posts',
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
};

const req = http.request(options, (res) => {
  console.log(`✅ Backend is responding!`);
  console.log(`   Status Code: ${res.statusCode}`);
  console.log(`   Content-Type: ${res.headers['content-type']}\n`);

  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    if (res.headers['content-type']?.includes('application/json')) {
      try {
        const parsed = JSON.parse(data);
        console.log('✅ Route is working! Returns JSON');
        console.log(`   Posts found: ${parsed.posts?.length || 0}`);
        if (parsed.posts && parsed.posts.length > 0) {
          console.log(`\n📝 Latest post:`);
          console.log(`   Author: ${parsed.posts[0].username}`);
          console.log(`   Content: ${parsed.posts[0].content.substring(0, 50)}...`);
        }
      } catch (e) {
        console.error('❌ Response is not valid JSON:', e.message);
      }
    } else {
      console.error('❌ Route returned HTML instead of JSON!');
      console.error('   This means the route is not loaded.');
      console.error('   Please restart the backend server!');
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Cannot connect to backend!');
  console.error(`   Error: ${error.message}`);
  console.error('\n   Make sure backend is running on port 3001');
  console.error('   Run: cd backend && npm start');
});

req.end();











