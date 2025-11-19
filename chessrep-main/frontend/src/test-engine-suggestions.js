// Test script to verify engine suggestions fix
import { Chess } from 'chess.js';

// Test FEN positions
const testPositions = [
  {
    name: "White to move",
    fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    expectedTurn: "w"
  },
  {
    name: "Black to move", 
    fen: "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1",
    expectedTurn: "b"
  },
  {
    name: "White to move after e4",
    fen: "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e3 0 1",
    expectedTurn: "w"
  }
];

console.log("Testing FEN turn indicator parsing...\n");

testPositions.forEach(({ name, fen, expectedTurn }) => {
  const fenParts = fen.split(' ');
  const actualTurn = fenParts[1];
  const chess = new Chess(fen);
  const chessTurn = chess.turn();
  
  console.log(`${name}:`);
  console.log(`  FEN: ${fen}`);
  console.log(`  Expected turn: ${expectedTurn}`);
  console.log(`  Parsed from FEN: ${actualTurn}`);
  console.log(`  Chess.js turn: ${chessTurn}`);
  console.log(`  ✅ Match: ${actualTurn === expectedTurn && actualTurn === chessTurn}`);
  console.log("");
});

console.log("Test completed!");
