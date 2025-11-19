import React, { useState, useEffect } from 'react';
import { Chess } from 'chess.js';
import { useAuth } from '../contexts/AuthContext';

const OpeningBook = () => {
  const { user } = useAuth();
  const [game, setGame] = useState(new Chess());
  const [bookMoves, setBookMoves] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedMove, setSelectedMove] = useState(null);

  useEffect(() => {
    fetchBookMoves();
  }, [game.fen()]);

  const fetchBookMoves = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/book`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          fen: game.fen()
        })
      });

      if (!response.ok) {
        throw new Error('Failed to fetch book moves');
      }

      const data = await response.json();
      setBookMoves(data.moves);
    } catch (error) {
      setError('Error fetching book moves');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMove = (move) => {
    try {
      const newGame = new Chess(game.fen());
      newGame.move(move);
      setGame(newGame);
      setSelectedMove(move);
    } catch (error) {
      console.error('Invalid move:', error);
    }
  };

  const handleUndo = () => {
    const newGame = new Chess(game.fen());
    newGame.undo();
    setGame(newGame);
    setSelectedMove(null);
  };

  const handleReset = () => {
    setGame(new Chess());
    setBookMoves([]);
    setSelectedMove(null);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Opening Book Explorer</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Chess Board */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="aspect-square bg-gray-100 rounded mb-4">
            {/* Add your chess board component here */}
            <div className="w-full h-full flex items-center justify-center text-gray-500">
              Chess Board Visualization
            </div>
          </div>

          <div className="flex justify-between mb-4">
            <button
              onClick={handleUndo}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Undo Move
            </button>
            <button
              onClick={handleReset}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Reset Position
            </button>
          </div>
        </div>

        {/* Book Moves Panel */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Book Moves</h2>
          
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : bookMoves.length > 0 ? (
            <div className="space-y-4">
              {bookMoves.map((move, index) => (
                <div
                  key={index}
                  className={`p-4 rounded cursor-pointer transition-colors ${
                    selectedMove === move.move
                      ? 'bg-blue-100 border border-blue-300'
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                  onClick={() => handleMove(move.move)}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="font-semibold">{index + 1}. {move.move}</span>
                      {move.name && (
                        <span className="text-sm text-gray-600 ml-2">
                          ({move.name})
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-500">
                      {move.frequency}%
                    </div>
                  </div>
                  {move.explanation && (
                    <p className="text-sm text-gray-600 mt-2">
                      {move.explanation}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">
              No book moves available for this position
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default OpeningBook; 
