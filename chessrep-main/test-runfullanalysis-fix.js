const axios = require('axios');

async function testRunFullAnalysisFix() {
  console.log('🔧 Testing runFullAnalysis Fix...');
  
  const testUrl = 'http://localhost:3001/api/games/report/40';
  const params = {
    username: 'alver87',
    timeClass: '',
    platform: 'chesscom'
  };
  
  // You'll need a valid JWT token
  const authToken = 'your-jwt-token-here';
  
  if (authToken === 'your-jwt-token-here') {
    console.log('❌ Please update the authToken variable with a real JWT token');
    console.log('Get a token by:');
    console.log('1. POST /api/auth/register (create account)');
    console.log('2. POST /api/auth/login (get token)\n');
    return;
  }
  
  try {
    console.log(`📡 Making request to: ${testUrl}`);
    console.log(`📋 Parameters:`, params);
    
    const response = await axios.get(testUrl, {
      params,
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      timeout: 300000 // 5 minutes timeout
    });
    
    console.log('✅ SUCCESS: runFullAnalysis function is working!');
    console.log('📊 Response status:', response.status);
    console.log('📊 Analysis complete:', response.data.status);
    console.log('📊 Games analyzed:', response.data.allAnalysis?.length || 'N/A');
    console.log('📊 Summary:', response.data.summary);
    
  } catch (error) {
    if (error.message.includes('runFullAnalysis is not defined')) {
      console.error('❌ FAILED: runFullAnalysis is still not defined');
    } else if (error.response?.status === 401) {
      console.error('❌ Authentication error - check your JWT token');
    } else if (error.response?.status === 404) {
      console.error('❌ No games found for username');
    } else {
      console.error('❌ Request failed:', error.message);
      if (error.response?.data) {
        console.error('Response:', error.response.data);
      }
    }
  }
}

console.log('🚀 Testing if the runFullAnalysis function fix works...');
console.log('Make sure:');
console.log('1. Backend server is running (node server.js)');
console.log('2. You have a valid JWT token');
console.log('3. MongoDB is running\n');

testRunFullAnalysisFix();
