const fetch = require('node-fetch');

async function testOpeningsAPI() {
  try {
    console.log('🧪 Testing openings practice API...');
    
    const response = await fetch('http://localhost:3001/api/openings/practice', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': 'test-token'
      },
      body: JSON.stringify({
        openingName: 'Test Opening',
        variationName: 'Test Variation'
      })
    });
    
    console.log('📊 Response status:', response.status);
    const text = await response.text();
    console.log('📊 Response body:', text);
    
  } catch (error) {
    console.error('❌ Error testing API:', error.message);
  }
}

testOpeningsAPI();










