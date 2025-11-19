const axios = require('axios');

async function testPuzzleAPI() {
  console.log('🧪 Testing Puzzle API...');
  
  try {
    const response = await axios.get('http://localhost:3001/api/puzzles/random?count=1');
    console.log('✅ API Response:', response.data);
    
    if (response.data.puzzles && response.data.puzzles.length > 0) {
      const puzzle = response.data.puzzles[0];
      console.log('✅ Puzzle found:');
      console.log('  - Theme:', puzzle.theme);
      console.log('  - FEN:', puzzle.fen);
      console.log('  - Moves:', puzzle.moves);
      console.log('  - Rating:', puzzle.rating);
    } else {
      console.log('❌ No puzzles in response');
    }
  } catch (error) {
    console.error('❌ API Error:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

testPuzzleAPI();








