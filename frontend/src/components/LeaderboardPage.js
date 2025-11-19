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
  const [activeTab, setActiveTab] = useState('puzzle'); // 'puzzle', 'blunder', 'visualisation', 'endgame'

  useEffect(() => {
    fetchLeaderboard();
    fetchUserRank();
  }, [currentPage, activeTab]);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:3001/api/leaderboard?page=${currentPage}&limit=20&type=${activeTab}`);
      setLeaderboard(response.data.users);
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
        <div className="flex justify-center mb-6">
          <div className="flex space-x-1 bg-gray-200 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('puzzle')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'puzzle'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Puzzles
            </button>
            <button
              onClick={() => setActiveTab('blunder')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'blunder'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Blunder Preventer
            </button>
            <button
              onClick={() => setActiveTab('visualisation')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'visualisation'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Visualisation
            </button>
            <button
              onClick={() => setActiveTab('endgame')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'endgame'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Endgames
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rank
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Player
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rating
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Solved
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Success Rate
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {leaderboard.map((user, index) => (
                  <tr key={user._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-lg font-semibold">
                          {getRankIcon((currentPage - 1) * 20 + index + 1)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {user.username || user.name || 'Anonymous'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-lg font-bold text-green-600">
                        {activeTab === 'puzzle' ? user.rating : 
                         activeTab === 'blunder' ? user.blunderRating :
                         activeTab === 'visualisation' ? user.visualisationRating :
                         activeTab === 'endgame' ? user.endgameRating : user.rating}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {activeTab === 'puzzle' ? (user.stats?.puzzleStats?.totalSolved || 0) :
                       activeTab === 'blunder' ? (user.stats?.blunderStats?.totalSolved || 0) :
                       activeTab === 'visualisation' ? (user.stats?.visualisationStats?.totalSolved || 0) :
                       activeTab === 'endgame' ? (user.stats?.endgameStats?.totalSolved || 0) : 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {getSuccessRate(
                        activeTab === 'puzzle' ? (user.stats?.puzzleStats?.totalSolved || 0) :
                        activeTab === 'blunder' ? (user.stats?.blunderStats?.totalSolved || 0) :
                        activeTab === 'visualisation' ? (user.stats?.visualisationStats?.totalSolved || 0) :
                        activeTab === 'endgame' ? (user.stats?.endgameStats?.totalSolved || 0) : 0,
                        activeTab === 'puzzle' ? (user.stats?.puzzleStats?.totalAttempted || 0) :
                        activeTab === 'blunder' ? (user.stats?.blunderStats?.totalAttempted || 0) :
                        activeTab === 'visualisation' ? (user.stats?.visualisationStats?.totalAttempted || 0) :
                        activeTab === 'endgame' ? (user.stats?.endgameStats?.totalAttempted || 0) : 0
                      )}
                    </td>
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
