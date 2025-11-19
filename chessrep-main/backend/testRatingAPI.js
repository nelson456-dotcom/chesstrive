const axios = require('axios');

async function testRatingAPI() {
  try {
    // First, let's get a user token by logging in
    const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'Tula@tula1.com',
      password: 'admin123'
    });

    const token = loginResponse.data.token;
    console.log('Got token:', token ? 'Yes' : 'No');

    // Get current user data
    const userResponse = await axios.get('http://localhost:3001/api/auth/me', {
      headers: { 'x-auth-token': token }
    });

    console.log('Current user ratings:', {
      rating: userResponse.data.rating,
      blunderRating: userResponse.data.blunderRating,
      visualisationRating: userResponse.data.visualisationRating
    });

    // Test rating update
    const ratingResponse = await axios.post('http://localhost:3001/api/puzzles/stats/puzzle', {
      solved: true,
      puzzleRating: 1200
    }, {
      headers: { 'x-auth-token': token }
    });

    console.log('Rating update response:', ratingResponse.data);

    // Get updated user data
    const updatedUserResponse = await axios.get('http://localhost:3001/api/auth/me', {
      headers: { 'x-auth-token': token }
    });

    console.log('Updated user ratings:', {
      rating: updatedUserResponse.data.rating,
      blunderRating: updatedUserResponse.data.blunderRating,
      visualisationRating: updatedUserResponse.data.visualisationRating
    });

  } catch (error) {
    console.error('Test error:', error.response?.data || error.message);
  }
}

testRatingAPI();
