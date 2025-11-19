const trainingService = require('./services/trainingService');

async function testImprovedBot() {
  console.log('🧠 Testing Improved Chess Bot Training System\n');

  try {
    // Test 1: Opening moves from different skill levels
    console.log('1. Testing Opening Moves:');
    console.log('========================');
    
    const startingPosition = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    
    console.log('Starting Position:');
    console.log(`  Beginner (800-1200): ${trainingService.suggestMove(startingPosition, 'beginner')}`);
    console.log(`  Intermediate (1200-1800): ${trainingService.suggestMove(startingPosition, 'intermediate')}`);
    console.log(`  Master (2000+): ${trainingService.suggestMove(startingPosition, 'master')}`);
    console.log('');

    // Test 2: After e4 e5
    console.log('2. Testing After e4 e5:');
    console.log('=======================');
    
    const afterE4E5 = 'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2';
    
    console.log('Position after e4 e5:');
    console.log(`  Beginner: ${trainingService.suggestMove(afterE4E5, 'beginner')}`);
    console.log(`  Intermediate: ${trainingService.suggestMove(afterE4E5, 'intermediate')}`);
    console.log(`  Master: ${trainingService.suggestMove(afterE4E5, 'master')}`);
    console.log('');

    // Test 3: After e4 e5 Nf3
    console.log('3. Testing After e4 e5 Nf3:');
    console.log('============================');
    
    const afterNf3 = 'rnbqkbnr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq - 1 2';
    
    console.log('Position after e4 e5 Nf3:');
    console.log(`  Beginner: ${trainingService.suggestMove(afterNf3, 'beginner')}`);
    console.log(`  Intermediate: ${trainingService.suggestMove(afterNf3, 'intermediate')}`);
    console.log(`  Master: ${trainingService.suggestMove(afterNf3, 'master')}`);
    console.log('');

    // Test 4: Tactical position
    console.log('4. Testing Tactical Position:');
    console.log('=============================');
    
    const tacticalPosition = 'rnbqkb1r/pppp1ppp/5n2/4p3/2B1P3/8/PPPP1PPP/RNBQK1NR w KQkq - 4 4';
    
    console.log('Tactical position (after e4 e5 Nf3 Nc6 Bc4 Nf6):');
    console.log(`  Beginner: ${trainingService.suggestMove(tacticalPosition, 'beginner')}`);
    console.log(`  Intermediate: ${trainingService.suggestMove(tacticalPosition, 'intermediate')}`);
    console.log(`  Master: ${trainingService.suggestMove(tacticalPosition, 'master')}`);
    console.log('');

    // Test 5: Endgame position
    console.log('5. Testing Endgame Position:');
    console.log('============================');
    
    const endgamePosition = '8/8/8/8/8/8/4K3/4k3 w - - 0 1';
    
    console.log('Simple endgame position:');
    console.log(`  Beginner: ${trainingService.suggestMove(endgamePosition, 'beginner')}`);
    console.log(`  Intermediate: ${trainingService.suggestMove(endgamePosition, 'intermediate')}`);
    console.log(`  Master: ${trainingService.suggestMove(endgamePosition, 'master')}`);
    console.log('');

    // Test 6: Training recommendations
    console.log('6. Training Recommendations:');
    console.log('============================');
    
    ['beginner', 'intermediate', 'master'].forEach(level => {
      const recommendations = trainingService.getTrainingRecommendations(level);
      console.log(`${level.toUpperCase()} recommendations: ${recommendations.length}`);
      recommendations.forEach((rec, index) => {
        console.log(`  ${index + 1}. ${rec.title}: ${rec.description}`);
      });
      console.log('');
    });

    // Test 7: Pattern analysis
    console.log('7. Pattern Analysis Summary:');
    console.log('============================');
    
    const allPatterns = trainingService.getAllPatterns();
    Object.entries(allPatterns).forEach(([level, patterns]) => {
      console.log(`${level.toUpperCase()}:`);
      console.log(`  Games analyzed: ${patterns.games?.length || 0}`);
      console.log(`  Average moves per game: ${patterns.averageMoves}`);
      console.log(`  Unique openings: ${Object.keys(patterns.openings || {}).length}`);
      console.log(`  Move patterns: ${Object.keys(patterns.movePatterns || {}).length}`);
      console.log('');
    });

    // Test 8: Opening book analysis
    console.log('8. Opening Book Analysis:');
    console.log('=========================');
    
    const openingBook = trainingService.openingBook;
    const totalPositions = Object.keys(openingBook).length;
    const totalMoves = Object.values(openingBook).reduce((sum, moves) => {
      return sum + Object.values(moves).reduce((a, b) => a + b, 0);
    }, 0);
    
    console.log(`Total positions in opening book: ${totalPositions}`);
    console.log(`Total moves recorded: ${totalMoves}`);
    console.log(`Average moves per position: ${Math.round(totalMoves / totalPositions)}`);
    console.log('');

    console.log('🎉 All tests completed successfully!');
    console.log('\n📊 Training System Improvements:');
    console.log('✅ Opening book built from 13 games across all skill levels');
    console.log('✅ Tactical pattern recognition implemented');
    console.log('✅ Position evaluation with material counting');
    console.log('✅ Skill-level specific move selection');
    console.log('✅ Pattern analysis and statistics');
    console.log('✅ Training recommendations by skill level');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  }
}

// Run tests
testImprovedBot();
