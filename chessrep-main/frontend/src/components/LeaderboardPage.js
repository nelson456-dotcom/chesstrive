import React, { useState, useEffect } from 'react';
import axios from 'axios';

const LeaderboardPage = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [userRank, setUserRank] = useState(null);
  const [userRating, setUserRating] = useState(null);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'puzzle', 'blunder', 'visualisation', 'endgame', 'advantage', 'resourcefulness'

  useEffect(() => {
    fetchLeaderboard();
    fetchUserRank();
  }, [currentPage, activeTab]);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:3001/api/leaderboard?page=${currentPage}&limit=100`);
      
      // Sort based on active tab
      let sortedUsers = [...response.data.users];
      if (activeTab === 'puzzle') {
        sortedUsers.sort((a, b) => (b.rating || 1200) - (a.rating || 1200));
      } else if (activeTab === 'blunder') {
        sortedUsers.sort((a, b) => (b.blunderRating || 1200) - (a.blunderRating || 1200));
      } else if (activeTab === 'visualisation') {
        sortedUsers.sort((a, b) => (b.visualisationRating || 1200) - (a.visualisationRating || 1200));
      } else if (activeTab === 'endgame') {
        sortedUsers.sort((a, b) => (b.endgameRating || 1200) - (a.endgameRating || 1200));
      } else if (activeTab === 'advantage') {
        sortedUsers.sort((a, b) => (b.advantageRating || 1200) - (a.advantageRating || 1200));
      } else if (activeTab === 'resourcefulness') {
        sortedUsers.sort((a, b) => (b.resourcefulnessRating || 1200) - (a.resourcefulnessRating || 1200));
      } else {
        // 'all' - sort by average rating
        sortedUsers.sort((a, b) => (b.averageRating || 1200) - (a.averageRating || 1200));
      }
      
      setLeaderboard(sortedUsers);
      setTotalPages(response.data.totalPages);
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
      setError('Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserRank = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await axios.get('http://localhost:3001/api/auth/me', {
        headers: { 'x-auth-token': token }
      });

      if (response.data) {
        const userResponse = await axios.get(`http://localhost:3001/api/leaderboard/user/${response.data.id}`);
        setUserRank(userResponse.data.rank);
        setUserRating(response.data.rating || 1200);
      }
    } catch (err) {
      console.error('Error fetching user rank:', err);
    }
  };

  const getRankIcon = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  const getSuccessRate = (solved, attempted) => {
    if (attempted === 0) return '0%';
    return `${Math.round((solved / attempted) * 100)}%`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-gray-700 mb-4">{error}</p>
          <button
            onClick={fetchLeaderboard}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Leaderboard</h1>
          <p className="text-gray-600">Top players by rating type</p>
        </div>

        {/* Rating Type Tabs */}
        <div className="flex justify-center mb-6 overflow-x-auto">
          <div className="flex space-x-1 bg-gray-200 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
                activeTab === 'all'
                  ? 'bg-white text-purple-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              All (Average)
            </button>
            <button
              onClick={() => setActiveTab('puzzle')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
                activeTab === 'puzzle'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Tactics
            </button>
            <button
              onClick={() => setActiveTab('blunder')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
                activeTab === 'blunder'
                  ? 'bg-white text-red-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Blunder
            </button>
            <button
              onClick={() => setActiveTab('visualisation')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
                activeTab === 'visualisation'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Visualization
            </button>
            <button
              onClick={() => setActiveTab('endgame')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
                activeTab === 'endgame'
                  ? 'bg-white text-amber-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Endgame
            </button>
            <button
              onClick={() => setActiveTab('advantage')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
                activeTab === 'advantage'
                  ? 'bg-white text-green-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Advantage
            </button>
            <button
              onClick={() => setActiveTab('resourcefulness')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
                activeTab === 'resourcefulness'
                  ? 'bg-white text-orange-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Resourcefulness
            </button>
          </div>
        </div>

        {/* User's current rank */}
        {userRank && userRating && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Your Ranking</h2>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-blue-600">{getRankIcon(userRank)}</p>
                <p className="text-gray-600">Rank #{userRank}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-green-600">{userRating}</p>
                <p className="text-gray-600">Rating</p>
              </div>
            </div>
          </div>
        )}

        {/* Leaderboard table */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold">Top Players</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rank
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Player
                  </th>
                  {activeTab === 'all' ? (
                    <>
                      <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase">Avg</th>
                      <th className="px-2 py-3 text-center text-xs font-medium text-blue-600 uppercase">Tac</th>
                      <th className="px-2 py-3 text-center text-xs font-medium text-red-600 uppercase">Blu</th>
                      <th className="px-2 py-3 text-center text-xs font-medium text-indigo-600 uppercase">Vis</th>
                      <th className="px-2 py-3 text-center text-xs font-medium text-amber-600 uppercase">End</th>
                      <th className="px-2 py-3 text-center text-xs font-medium text-green-600 uppercase">Adv</th>
                      <th className="px-2 py-3 text-center text-xs font-medium text-orange-600 uppercase">Res</th>
                    </>
                  ) : (
                    <>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Rating
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Solved
                      </th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {leaderboard.map((user, index) => (
                  <tr key={user._id} className="hover:bg-gray-50">
                    <td className="px-3 py-4 whitespace-nowrap">
                      <span className="text-lg font-semibold">
                        {getRankIcon((currentPage - 1) * 100 + index + 1)}
                      </span>
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {user.username || user.name || 'Anonymous'}
                      </div>
                    </td>
                    {activeTab === 'all' ? (
                      <>
                        <td className="px-2 py-4 whitespace-nowrap text-center">
                          <span className="text-sm font-bold text-purple-600">{user.averageRating || 1200}</span>
                        </td>
                        <td className="px-2 py-4 whitespace-nowrap text-center">
                          <span className="text-sm text-blue-600">{user.rating || 1200}</span>
                        </td>
                        <td className="px-2 py-4 whitespace-nowrap text-center">
                          <span className="text-sm text-red-600">{user.blunderRating || 1200}</span>
                        </td>
                        <td className="px-2 py-4 whitespace-nowrap text-center">
                          <span className="text-sm text-indigo-600">{user.visualisationRating || 1200}</span>
                        </td>
                        <td className="px-2 py-4 whitespace-nowrap text-center">
                          <span className="text-sm text-amber-600">{user.endgameRating || 1200}</span>
                        </td>
                        <td className="px-2 py-4 whitespace-nowrap text-center">
                          <span className="text-sm text-green-600">{user.advantageRating || 1200}</span>
                        </td>
                        <td className="px-2 py-4 whitespace-nowrap text-center">
                          <span className="text-sm text-orange-600">{user.resourcefulnessRating || 1200}</span>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-lg font-bold text-green-600">
                            {activeTab === 'puzzle' ? (user.rating || 1200) : 
                             activeTab === 'blunder' ? (user.blunderRating || 1200) :
                             activeTab === 'visualisation' ? (user.visualisationRating || 1200) :
                             activeTab === 'endgame' ? (user.endgameRating || 1200) :
                             activeTab === 'advantage' ? (user.advantageRating || 1200) :
                             activeTab === 'resourcefulness' ? (user.resourcefulnessRating || 1200) : 1200}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {user.totalSolved || 0}
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex justify-center">
            <nav className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              
              <span className="px-3 py-2 text-sm text-gray-700">
                Page {currentPage} of {totalPages}
              </span>
              
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </nav>
          </div>
        )}
      </div>
    </div>
  );
};

export default LeaderboardPage; 
