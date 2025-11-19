const axios = require('axios');

async function testGameImport() {
  console.log('🧪 Testing Game Import API...');
  
  // You'll need to replace these with actual values
  const testData = {
    username: 'hikaru',  // Replace with a real Chess.com username
    timeClass: 'blitz',   // or 'rapid', 'bullet', 'all'
    platform: 'chesscom'  // or 'lichess'
  };
  
  // You'll also need a valid auth token - this is just a placeholder
  const authToken = 'your-jwt-token-here';
  
  try {
    console.log(`📥 Importing games for ${testData.username}...`);
    
    const importResponse = await axios.post('http://localhost:3001/api/games/import', testData, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Import successful!');
    console.log('Response:', importResponse.data);
    
    // Now test PDF report generation
    console.log('\n📄 Testing PDF report generation...');
    
    const reportResponse = await axios.get('http://localhost:3001/api/pdf/report', {
      params: {
        username: testData.username,
        timeClass: testData.timeClass,
        platform: testData.platform
      },
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      responseType: 'arraybuffer' // For PDF download
    });
    
    console.log('✅ PDF report generated successfully!');
    console.log(`PDF size: ${reportResponse.data.length} bytes`);
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      console.log('\n💡 Note: You need to authenticate first. Get a JWT token by:');
      console.log('1. Creating a user account via /api/auth/register');
      console.log('2. Logging in via /api/auth/login to get the token');
      console.log('3. Replace "your-jwt-token-here" with the actual token');
    }
    
    if (error.response?.status === 404 && error.response?.data?.message?.includes('No games found')) {
      console.log('\n💡 Note: Try with a different username that has public games');
      console.log('Popular usernames to try: hikaru, gothamchess, magnuscarlsen');
    }
  }
}

// Instructions for manual testing
console.log('🔧 SETUP INSTRUCTIONS:');
console.log('1. Make sure MongoDB is running');
console.log('2. Start the backend server: node server.js');
console.log('3. Create a user account and get auth token');
console.log('4. Update the testData and authToken variables above');
console.log('5. Run: node test-import-games.js\n');

testGameImport();
