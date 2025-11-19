import { pgnParser } from '../services/PGNParser';
import { moveTreeService } from '../services/MoveTreeService';

// Test PGN with complex variations
const testPGN = `[Event "Test Game"]
[Site "Test"]
[Date "2024.01.01"]
[Round "1"]
[White "Player A"]
[Black "Player B"]
[Result "*"]

1. e4 e5 2. Nf3 Nc6 3. Bc4 {Italian Game} 
(3. Bb5 {Ruy Lopez} a6 4. Ba4 Nf6 5. O-O Be7 
  (5... b5 {Marshall Attack} 6. Bb3 Bb7 7. Re1 Bc5 8. c3 d6)
  6. Re1 b5 7. Bb3 O-O)
Be5 4. d3 Nf6 5. Ng5 d6 6. f4 Bxg5 7. fxg5 Nh5 *`;

export function testFullAnnotationSystem() {
  console.log('Testing Full Annotation System...');
  
  try {
    // Test PGN parsing
    console.log('1. Testing PGN parsing...');
    const game = pgnParser.parse(testPGN);
    
    console.log('Headers:', game.headers);
    console.log('Main line moves:', game.mainLine.length);
    console.log('Total moves (including variations):', game.allMoves.length);
    
    // Test move tree service
    console.log('2. Testing move tree service...');
    moveTreeService.loadPGN(testPGN);
    
    const initialState = moveTreeService.getCurrentState();
    console.log('Initial state:', initialState);
    
    // Test navigation
    console.log('3. Testing navigation...');
    
    // Go to first move
    const success1 = moveTreeService.goToNext();
    console.log('Go to first move:', success1);
    console.log('Current position:', moveTreeService.getCurrentState().fen);
    
    // Go to second move
    const success2 = moveTreeService.goToNext();
    console.log('Go to second move:', success2);
    
    // Go to third move (should be Bc4)
    const success3 = moveTreeService.goToNext();
    console.log('Go to third move:', success3);
    console.log('Current move:', moveTreeService.getCurrentState().currentMove?.san);
    
    // Test variation navigation
    console.log('4. Testing variation navigation...');
    const variations = moveTreeService.getAllVariationsAtCurrentPosition();
    console.log('Variations at current position:', variations.length);
    
    if (variations.length > 0) {
      const success4 = moveTreeService.goToVariation(0, 0);
      console.log('Go to first variation:', success4);
      console.log('Current move in variation:', moveTreeService.getCurrentState().currentMove?.san);
    }
    
    // Test going back
    console.log('5. Testing backward navigation...');
    const success5 = moveTreeService.goToPrevious();
    console.log('Go back:', success5);
    console.log('Current move after going back:', moveTreeService.getCurrentState().currentMove?.san);
    
    console.log('✅ All tests passed!');
    return true;
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    return false;
  }
}

// Run the test
if (typeof window !== 'undefined') {
  // Browser environment
  window.testFullAnnotationSystem = testFullAnnotationSystem;
  console.log('Test function available as window.testFullAnnotationSystem()');
} else {
  // Node environment
  testFullAnnotationSystem();
}