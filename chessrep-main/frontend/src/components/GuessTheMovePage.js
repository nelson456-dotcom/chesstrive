import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const API_BASE = 'http://localhost:3001/api/famous-games';

const GuessTheMovePage = () => {
  const { user } = useAuth();
  const [gamesList, setGamesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAllGames = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/all`);
      const data = await res.json();
        setGamesList(data.games || []);
      } catch (error) {
        console.error('Error fetching games:', error);
        setGamesList([]);
      } finally {
        setLoading(false);
      }
    };
    fetchAllGames();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
            Famous Games
          </h1>
          <p className="text-xl text-gray-300 mb-2">Test your chess knowledge</p>
          <p className="text-lg text-gray-400">Guess the moves from legendary games</p>
        </div>

        {/* Stats */}
        <div className="mb-8 grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-blue-600/20 to-blue-800/20 backdrop-blur-sm border border-blue-500/30 rounded-2xl p-6 text-center">
            <div className="text-3xl font-bold text-blue-400 mb-2">{gamesList.length}</div>
            <div className="text-gray-300">Total Games</div>
          </div>
          <div className="bg-gradient-to-br from-purple-600/20 to-purple-800/20 backdrop-blur-sm border border-purple-500/30 rounded-2xl p-6 text-center">
            <div className="text-3xl font-bold text-purple-400 mb-2">
              {gamesList.filter(g => g.year && parseInt(g.year) >= 2000).length}
            </div>
            <div className="text-gray-300">Modern Games</div>
          </div>
          <div className="bg-gradient-to-br from-pink-600/20 to-pink-800/20 backdrop-blur-sm border border-pink-500/30 rounded-2xl p-6 text-center">
            <div className="text-3xl font-bold text-pink-400 mb-2">
              {new Set(gamesList.map(g => g.file)).size}
            </div>
            <div className="text-gray-300">Collections</div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16">
            <div className="inline-flex items-center space-x-3">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              <div className="text-xl text-gray-300">Loading legendary games...</div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {gamesList.map((game, index) => (
              <div
                key={index}
                className="group bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 hover:border-blue-500/50 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/20"
              >
                {/* Game Header */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-blue-400 bg-blue-500/20 px-2 py-1 rounded-full">
                      {game.file?.replace('.pgn', '')}
                    </span>
                    <span className="text-sm text-gray-400">{game.year}</span>
                  </div>
                  <div className="text-sm text-gray-500 mb-1">{game.event}</div>
                </div>

                {/* Players */}
                <div className="mb-4 space-y-2">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-white rounded-full"></div>
                    <span className="text-white font-medium truncate">{game.white}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-gray-800 rounded-full border border-gray-600"></div>
                    <span className="text-white font-medium truncate">{game.black}</span>
                  </div>
                </div>

                {/* Game Info */}
                <div className="mb-6 space-y-2">
                  {game.eco && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">ECO:</span>
                      <span className="text-gray-300 font-mono">{game.eco}</span>
                    </div>
                  )}
                  {game.round && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Round:</span>
                      <span className="text-gray-300">{game.round}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Result:</span>
                    <span className="text-gray-300">{game.result}</span>
                  </div>
                </div>

                {/* Play Button */}
                        <button
                  onClick={async () => {
                    // Check usage limits for free users
                    if (user && user.userType !== 'premium') {
                      try {
                        const token = localStorage.getItem('token');
                        if (token) {
                          const response = await fetch('http://localhost:3001/api/usage-limits/guess-the-move', {
                            headers: { 'x-auth-token': token }
                          });
                          
                          if (response.ok) {
                            const limitData = await response.json();
                            if (!limitData.allowed) {
                              alert('You\'ve already played your free game. Upgrade to premium for unlimited access to guess the move!');
                              navigate('/upgrade');
                              return;
                            }
                            
                            // Increment usage before navigating
                            await fetch('http://localhost:3001/api/usage-limits/guess-the-move/increment', {
                              method: 'POST',
                              headers: {
                                'Content-Type': 'application/json',
                                'x-auth-token': token
                              }
                            });
                          }
                        }
                      } catch (error) {
                        console.error('Error checking usage limits:', error);
                      }
                    }
                    
                    navigate(`/game-viewer?file=${encodeURIComponent(game.file)}&game=${game.index}`);
                  }}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-blue-500/25 flex items-center justify-center space-x-2"
                        >
                  <span>Play Game</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                        </button>
              </div>
                  ))}
            </div>
        )}

        {/* Footer */}
        {!loading && gamesList.length > 0 && (
          <div className="mt-16 text-center">
            <p className="text-gray-400 mb-4">Ready to test your chess knowledge?</p>
            <p className="text-sm text-gray-500">Select a game above to start guessing the moves!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GuessTheMovePage; 
