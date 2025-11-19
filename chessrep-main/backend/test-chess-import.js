const chessModule = require('chess.js');
console.log('chess.js module type:', typeof chessModule);
console.log('chess.js has Chess property:', typeof chessModule.Chess);
console.log('chess.js keys:', Object.keys(chessModule).slice(0, 10));
console.log('Trying to use Chess:');
try {
  const { Chess } = require('chess.js');
  console.log('Destructured Chess type:', typeof Chess);
  const game = new Chess();
  console.log('✅ Success with destructuring!');
} catch (e) {
  console.error('❌ Error with destructuring:', e.message);
}

try {
  const Chess = chessModule.Chess || chessModule;
  console.log('Chess type (fallback):', typeof Chess);
  const game = new Chess();
  console.log('✅ Success with fallback!');
} catch (e) {
  console.error('❌ Error with fallback:', e.message);
}








