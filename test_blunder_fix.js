// Test script to verify blunder preventer move validation
const { Chess } = require('chess.js');

// Test the move validation logic
function testMoveValidation() {
  console.log('🧪 Testing Blunder Preventer Move Validation\n');
  
  // Test data from API response
  const testData = {
    fen: "8/3kqp2/4p3/p2p4/3P1P2/4P1rP/7r/1QR2K2 b - - 1 34",
    bestMove: "g3f3",
    blunderMove: "e7d6"
  };
  
  console.log('Test position:', testData.fen);
  console.log('Best move (UCI):', testData.bestMove);
  console.log('Blunder move (UCI):', testData.blunderMove);
  
  // Create chess instance
  const game = new Chess(testData.fen);
  console.log('Current turn:', game.turn());
  console.log('Available moves:', game.moves().slice(0, 5), '...');
  
  // Test the best move
  console.log('\n🎯 Testing best move:', testData.bestMove);
  try {
    const bestMoveObj = game.move({
      from: testData.bestMove.substring(0, 2),
      to: testData.bestMove.substring(2, 4)
    });
    console.log('✅ Best move successful:', bestMoveObj.san);
    game.undo();
  } catch (error) {
    console.log('❌ Best move failed:', error.message);
  }
  
  // Test the blunder move
  console.log('\n🎯 Testing blunder move:', testData.blunderMove);
  try {
    const blunderMoveObj = game.move({
      from: testData.blunderMove.substring(0, 2),
      to: testData.blunderMove.substring(2, 4)
    });
    console.log('✅ Blunder move successful:', blunderMoveObj.san);
    game.undo();
  } catch (error) {
    console.log('❌ Blunder move failed:', error.message);
  }
  
  // Test UCI format detection
  console.log('\n🔍 Testing UCI format detection:');
  const uciRegex = /^[a-h][1-8][a-h][1-8][qrbn]?$/i;
  console.log('g3f3 is UCI:', uciRegex.test('g3f3'));
  console.log('e7d6 is UCI:', uciRegex.test('e7d6'));
  console.log('Nf3 is UCI:', uciRegex.test('Nf3'));
  console.log('e4 is UCI:', uciRegex.test('e4'));
  
  console.log('\n✅ Test completed! The move validation should now work correctly.');
}

testMoveValidation();
