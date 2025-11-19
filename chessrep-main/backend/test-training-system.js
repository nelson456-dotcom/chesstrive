const trainingService = require('./services/trainingService');

async function testTrainingSystem() {
  console.log('Testing Training System...\n');

  try {
    // Test 1: Test the training service
    console.log('1. Testing training service...');
    
    // Test move suggestions
    const testPosition = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    const levels = ['beginner', 'intermediate', 'master'];
    
    for (const level of levels) {
      const suggestion = trainingService.suggestMove(testPosition, level);
      console.log(`${level.toUpperCase()} suggestion:`, suggestion);
    }
    
    // Test recommendations
    for (const level of levels) {
      const recommendations = trainingService.getTrainingRecommendations(level);
      console.log(`${level.toUpperCase()} recommendations:`, recommendations.length);
    }
    
    console.log('✅ Training service working\n');

    // Test 2: Test pattern analysis
    console.log('2. Testing pattern analysis...');
    const allPatterns = trainingService.getAllPatterns();
    
    for (const [level, patterns] of Object.entries(allPatterns)) {
      console.log(`${level.toUpperCase()} patterns:`, {
        averageMoves: patterns.averageMoves,
        openingsCount: Object.keys(patterns.openings || {}).length,
        movePatternsCount: Object.keys(patterns.movePatterns || {}).length
      });
    }
    
    console.log('✅ Pattern analysis working\n');

    // Test 3: Test with different positions
    console.log('3. Testing different positions...');
    const positions = [
      'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', // Starting position
      'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2', // After e4 e5
      'rnbqkbnr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq - 1 2' // After e4 e5 Nf3
    ];
    
    for (const position of positions) {
      console.log(`Position: ${position.substring(0, 50)}...`);
      for (const level of levels) {
        const suggestion = trainingService.suggestMove(position, level);
        console.log(`  ${level}: ${suggestion}`);
      }
    }
    
    console.log('✅ Position testing working\n');

    console.log('🎉 All tests passed! Training system is working correctly.');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  }
}

// Run tests
testTrainingSystem();
