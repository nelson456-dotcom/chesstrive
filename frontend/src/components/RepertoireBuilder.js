import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Chess } from 'chess.js';

const RepertoireBuilder = () => {
  const { user } = useAuth();
  const [repertoire, setRepertoire] = useState([]);
  const [selectedOpening, setSelectedOpening] = useState(null);
  const [game, setGame] = useState(new Chess());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchRepertoire();
  }, []);

  const fetchRepertoire = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/repertoire`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setRepertoire(data);
    } catch (error) {
      setError('Error fetching repertoire');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpeningSelect = (opening) => {
    setSelectedOpening(opening);
    const newGame = new Chess();
    opening.moves.forEach(move => {
      newGame.move(move);
    });
    setGame(newGame);
  };

  const handleAddToRepertoire = async (opening) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/repertoire`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ openingId: opening._id })
      });

      if (response.ok) {
        fetchRepertoire();
      } else {
        setError('Error adding opening to repertoire');
      }
    } catch (error) {
      setError('Error adding opening to repertoire');
      console.error('Error:', error);
    }
  };

  const handleRemoveFromRepertoire = async (openingId) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/repertoire/${openingId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        fetchRepertoire();
      } else {
        setError('Error removing opening from repertoire');
      }
    } catch (error) {
      setError('Error removing opening from repertoire');
      console.error('Error:', error);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
    </div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Opening Repertoire Builder</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Repertoire List */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Your Repertoire</h2>
          <div className="space-y-4">
            {repertoire.map((opening) => (
              <div
                key={opening._id}
                className="flex items-center justify-between p-4 border rounded hover:bg-gray-50"
              >
                <div>
                  <h3 className="font-semibold">{opening.name}</h3>
                  <p className="text-sm text-gray-600">{opening.description}</p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleOpeningSelect(opening)}
                    className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    View
                  </button>
                  <button
                    onClick={() => handleRemoveFromRepertoire(opening._id)}
                    className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Opening Details */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Opening Details</h2>
          {selectedOpening ? (
            <div>
              <h3 className="text-lg font-semibold mb-2">{selectedOpening.name}</h3>
              <p className="text-gray-600 mb-4">{selectedOpening.description}</p>
              
              {/* Chess Board */}
              <div className="mb-4">
                {/* Add your chess board component here */}
                <div className="aspect-square bg-gray-100 rounded">
                  {/* Chess board visualization */}
                </div>
              </div>

              {/* Move List */}
              <div className="space-y-2">
                <h4 className="font-semibold">Moves:</h4>
                <div className="grid grid-cols-2 gap-2">
                  {selectedOpening.moves.map((move, index) => (
                    <div key={index} className="p-2 bg-gray-50 rounded">
                      {Math.floor(index / 2) + 1}. {move}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-gray-500">Select an opening to view details</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default RepertoireBuilder; 
