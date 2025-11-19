import React, { useState } from 'react';
import { Chess } from 'chess.js';
import OptimizedChessBoard from './OptimizedChessBoard';

const BoardTestPage = () => {
  const [game, setGame] = useState(new Chess());
  const [fen, setFen] = useState(game.fen());

  const handleMove = (from, to) => {
    const newGame = new Chess(game.fen());
    const move = newGame.move({ from, to, promotion: 'q' });
    
    if (move) {
      setGame(newGame);
      setFen(newGame.fen());
      return true;
    }
    return false;
  };

  const resetBoard = () => {
    const newGame = new Chess();
    setGame(newGame);
    setFen(newGame.fen());
  };

  const makeRandomMove = () => {
    const moves = game.moves({ verbose: true });
    if (moves.length > 0) {
      const randomMove = moves[Math.floor(Math.random() * moves.length)];
      const newGame = new Chess(game.fen());
      const move = newGame.move(randomMove);
      
      if (move) {
        setGame(newGame);
        setFen(newGame.fen());
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">Chess Board Test - No White Flashing</h1>
        
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Board */}
          <div className="flex justify-center">
            <OptimizedChessBoard
              position={fen}
              onPieceDrop={handleMove}
              boardSize={600}
              showCoordinates={true}
              allowUserMoves={true}
              style={{
                borderRadius: '12px',
                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
              }}
            />
          </div>
          
          {/* Controls */}
          <div className="flex flex-col gap-4">
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <h2 className="text-xl font-bold mb-4">Controls</h2>
              <div className="space-y-3">
                <button
                  onClick={resetBoard}
                  className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
                >
                  Reset Board
                </button>
                <button
                  onClick={makeRandomMove}
                  className="w-full bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors"
                >
                  Make Random Move
                </button>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <h2 className="text-xl font-bold mb-4">Game Info</h2>
              <div className="space-y-2 text-sm">
                <p><strong>FEN:</strong> {fen}</p>
                <p><strong>Turn:</strong> {game.turn() === 'w' ? 'White' : 'Black'}</p>
                <p><strong>Moves:</strong> {game.history().length}</p>
                <p><strong>Status:</strong> {
                  game.isCheckmate() ? 'Checkmate' :
                  game.isStalemate() ? 'Stalemate' :
                  game.isDraw() ? 'Draw' :
                  game.isCheck() ? 'Check' : 'Normal'
                }</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-8 bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-bold mb-4">Instructions</h2>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li>Click on a piece to select it, then click on a destination square to move</li>
            <li>Watch for any white flashing during moves - there should be none</li>
            <li>Use the "Make Random Move" button to test rapid state changes</li>
            <li>The board should maintain consistent colors throughout all operations</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default BoardTestPage;
