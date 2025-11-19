const axios = require('axios');

async function testBackend() {
  try {
    console.log('Testing backend connection...');
    
    // Test if server is responding
    const response = await axios.get('http://localhost:3001/api/auth/me', {
      headers: { 'x-auth-token': 'test' }
    });
    
    console.log('Backend is responding!');
    console.log('Response status:', response.status);
    
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('Backend is not running on port 3001');
    } else {
      console.log('Backend is running but returned error:', error.response?.status);
    }
  }
}

testBackend();
