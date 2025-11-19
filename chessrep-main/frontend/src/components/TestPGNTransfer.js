import React from 'react';
import { useNavigate } from 'react-router-dom';

const TestPGNTransfer = () => {
  const navigate = useNavigate();

  const testPGNTransfer = () => {
    // Test data similar to what's in the opening encyclopedia
    const testVariation = {
      openingName: "French Defense (for Black)",
      variationName: "Winawer Variation",
      moves: ["e4", "e6", "d4", "d5", "Nc3", "Bb4", "e5", "c5", "a3", "Bxc3+", "bxc3", "Ne7", "Qg4", "O-O", "Bd3", "Nbc6", "Nf3", "Qa5", "Bd2", "Qa4", "O-O", "c4", "Bxh7+", "Kxh7", "Ng5+", "Kg8", "Qh5", "Qxc2", "Rad1", "f6"]
    };

    console.log('🧪 Testing PGN Transfer');
    console.log('📋 Test Variation:', testVariation);

    // Create a complete PGN of the entire opening variation
    const { Chess } = require('chess.js');
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

    console.log('📝 Generated PGN Moves:', pgnMoves.trim());

    // Create complete PGN with headers
    const completePGN = `[Event "${testVariation.openingName} - ${testVariation.variationName}"]\n[Site "ChessRep"]\n[Date "${new Date().toISOString().split('T')[0]}"]\n[Round "1"]\n[White "White"]\n[Black "Black"]\n[Result "*"]\n\n${pgnMoves.trim()}`;

    console.log('📄 Complete PGN:', completePGN);

    // Get current position (up to move 10)
    const currentGame = new Chess();
    for (let i = 0; i < 10 && i < testVariation.moves.length; i++) {
      currentGame.move(testVariation.moves[i]);
    }

    const currentFen = currentGame.fen();
    const encodedFen = encodeURIComponent(currentFen);
    const encodedPGN = encodeURIComponent(completePGN);

    console.log('🎯 Current FEN:', currentFen);
    console.log('🎯 Encoded FEN:', encodedFen);
    console.log('🎯 Encoded PGN Length:', encodedPGN.length);

    // Navigate to analysis page with complete PGN and current position
    const analysisUrl = `/analysis?fen=${encodedFen}&pgn=${encodedPGN}&moveIndex=${Math.min(10, testVariation.moves.length)}`;
    console.log('🎯 Analysis URL:', analysisUrl);
    console.log('🎯 Analysis URL Length:', analysisUrl.length);

    navigate(analysisUrl);
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Test PGN Transfer</h1>
      <button
        onClick={testPGNTransfer}
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
      >
        Test PGN Transfer to Chess Analysis Board
      </button>
    </div>
  );
};

export default TestPGNTransfer;

