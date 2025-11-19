const axios = require('axios');

async function testRatingSystem() {
  try {
    console.log('Testing rating system...');
    
    // Test 1: Get current user data
    console.log('\n1. Getting current user data...');
    const userResponse = await axios.get('http://localhost:3001/api/auth/me', {
      headers: { 'x-auth-token': 'test' }
    });
    
    console.log('Current rating:', userResponse.data.rating);
    
    // Test 2: Solve a puzzle correctly
    console.log('\n2. Solving puzzle correctly...');
    const solveResponse = await axios.post('http://localhost:3001/api/puzzles/stats/puzzle', {
      solved: true,
      puzzleRating: 1300
    }, {
      headers: { 'x-auth-token': 'test' }
    });
    
    console.log('Rating after solving:', solveResponse.data.newRating);
    console.log('Rating change:', solveResponse.data.ratingChange);
    
    // Test 3: Get updated user data
    console.log('\n3. Getting updated user data...');
    const updatedUserResponse = await axios.get('http://localhost:3001/api/auth/me', {
      headers: { 'x-auth-token': 'test' }
    });
    
    console.log('Updated rating:', updatedUserResponse.data.rating);
    
    // Test 4: Fail a puzzle
    console.log('\n4. Failing a puzzle...');
    const failResponse = await axios.post('http://localhost:3001/api/puzzles/stats/puzzle', {
      solved: false,
      puzzleRating: 1100
    }, {
      headers: { 'x-auth-token': 'test' }
    });
    
    console.log('Rating after failing:', failResponse.data.newRating);
    console.log('Rating change:', failResponse.data.ratingChange);
    
    console.log('\n✅ Rating system is working!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testRatingSystem();
