// Test script to verify PGN generation from opening moves
const { Chess } = require('chess.js');

// Test data similar to what's in the opening encyclopedia
const testVariation = {
  openingName: "French Defense (for Black)",
  variationName: "Winawer Variation",
  moves: ["e4", "e6", "d4", "d5", "Nc3", "Bb4", "e5", "c5", "a3", "Bxc3+", "bxc3", "Ne7", "Qg4", "O-O", "Bd3", "Nbc6", "Nf3", "Qa5", "Bd2", "Qa4", "O-O", "c4", "Bxh7+", "Kxh7", "Ng5+", "Kg8", "Qh5", "Qxc2", "Rad1", "f6"]
};

console.log('🧪 Testing PGN Generation');
console.log('📋 Test Variation:', testVariation);
console.log('📋 Moves Count:', testVariation.moves.length);

// Create a complete PGN of the entire opening variation
const game = new Chess();
let pgnMoves = '';

// Play all moves in the variation to generate complete PGN
for (let i = 0; i < testVariation.moves.length; i++) {
  const move = game.move(testVariation.moves[i]);
  if (move) {
    pgnMoves += move.san + ' ';
    console.log(`✅ Move ${i + 1}: ${testVariation.moves[i]} -> ${move.san}`);
  } else {
    console.warn(`❌ Failed to play move ${i + 1}: ${testVariation.moves[i]}`);
  }
}

console.log('\n📝 Generated PGN Moves:', pgnMoves.trim());

// Create complete PGN with headers
const completePGN = `[Event "${testVariation.openingName} - ${testVariation.variationName}"]\n[Site "ChessRep"]\n[Date "${new Date().toISOString().split('T')[0]}"]\n[Round "1"]\n[White "White"]\n[Black "Black"]\n[Result "*"]\n\n${pgnMoves.trim()}`;

console.log('\n📄 Complete PGN:');
console.log(completePGN);

// Test loading the PGN back
console.log('\n🔄 Testing PGN Loading:');
const testGame = new Chess();
const loadResult = testGame.loadPgn(completePGN);
console.log('Load Result:', loadResult);
console.log('Final FEN:', testGame.fen());
console.log('Game PGN:', testGame.pgn());

// Test URL encoding
const encodedPGN = encodeURIComponent(completePGN);
console.log('\n🌐 URL Encoded PGN Length:', encodedPGN.length);
console.log('URL Encoded PGN (first 200 chars):', encodedPGN.substring(0, 200) + '...');

