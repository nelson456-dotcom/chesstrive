import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import UserStats from './UserStats';

const ProfilePage = () => {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [userStats, setUserStats] = useState(null);
  const [savedGames, setSavedGames] = useState([]);
  const [loadingGames, setLoadingGames] = useState(false);
  const [puzzleRushBestStreak, setPuzzleRushBestStreak] = useState(0);

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        // Refresh user data to get the latest ratings
        const refreshedUser = await refreshUser();
        if (refreshedUser) {
          setUserStats(refreshedUser.stats);
        }
        
        // Fetch puzzle rush best streak
        const token = localStorage.getItem('token');
        if (token) {
          const response = await fetch('http://localhost:3001/api/puzzle-rush/user-stats', {
            headers: { 'x-auth-token': token }
          });
          if (response.ok) {
            const data = await response.json();
            if (data.success) {
              setPuzzleRushBestStreak(data.stats.bestStreak || 0);
            }
          }
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
      }
    };

    if (user) {
      fetchProfileData();
    }
  }, [user, refreshUser]);

  // Also refresh when component mounts
  useEffect(() => {
    const forceRefresh = async () => {
      if (user) {
        const refreshedUser = await refreshUser();
        if (refreshedUser) {
          setUserStats(refreshedUser.stats);
        }
      }
    };
    forceRefresh();
  }, []); // Empty dependency array - only run on mount

  // Refresh when navigating to profile page (location change)
  useEffect(() => {
    const refreshOnNavigation = async () => {
      if (user && location.pathname === '/profile') {
        console.log('🔄 Profile page navigated to, refreshing user data...');
        const refreshedUser = await refreshUser();
        if (refreshedUser) {
          setUserStats(refreshedUser.stats);
          console.log('✅ Profile data refreshed, defenderWins:', refreshedUser.defenderWins);
        }
      }
    };
    refreshOnNavigation();
  }, [location.pathname, user, refreshUser]);

  // Refresh data when user returns to the page or window gains focus
  useEffect(() => {
    const handleFocus = async () => {
      if (user) {
        const refreshedUser = await refreshUser();
        if (refreshedUser) {
          setUserStats(refreshedUser.stats);
        }
      }
    };

    const handleVisibilityChange = async () => {
      if (!document.hidden && user) {
        // Page became visible, refresh data
        const refreshedUser = await refreshUser();
        if (refreshedUser) {
          setUserStats(refreshedUser.stats);
        }
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user, refreshUser]);

  // Update userStats when user object changes
  useEffect(() => {
    if (user && user.stats) {
      setUserStats(user.stats);
    }
  }, [user]);

  // Poll for updates every 5 seconds when on profile page
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(async () => {
      const refreshedUser = await refreshUser();
      if (refreshedUser) {
        setUserStats(refreshedUser.stats);
      }
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(interval);
  }, [user, refreshUser]);

  // Fetch saved games
  const fetchSavedGames = async () => {
    try {
      setLoadingGames(true);
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('http://localhost:3001/api/games/saved', {
        headers: {
          'x-auth-token': token
        }
      });

      if (response.ok) {
        const games = await response.json();
        setSavedGames(games);
      } else {
        console.error('Failed to fetch saved games');
      }
    } catch (error) {
      console.error('Error fetching saved games:', error);
    } finally {
      setLoadingGames(false);
    }
  };

  // Fetch saved games on component mount
  useEffect(() => {
    if (user) {
      fetchSavedGames();
    }
  }, [user]);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:3001/api/users/update-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': localStorage.getItem('token')
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Password updated successfully');
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      } else {
        setError(data.message || 'Failed to update password');
      }
    } catch (err) {
      setError('An error occurred while updating password');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900">Please sign in to view your profile</h2>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-4 sm:py-6 lg:py-8 px-3 sm:px-4 lg:px-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row gap-3 sm:gap-4">
          <button
            className="px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-lg hover:from-teal-600 hover:to-teal-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 text-sm sm:text-base"
            onClick={() => navigate('/')}
          >
            ← Back to Home
          </button>
          <button
            className="px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 text-sm sm:text-base"
            onClick={async () => {
              const refreshedUser = await refreshUser();
              if (refreshedUser) {
                setUserStats(refreshedUser.stats);
              }
            }}
          >
            🔄 Refresh Data
          </button>
        </div>
        
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 sm:gap-8">
          {/* Left Column - Profile Info */}
          <div className="xl:col-span-1">
            <div className="bg-white shadow-xl rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 border border-gray-100">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 sm:mb-8 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Profile
              </h2>
              
              {/* Account Information */}
              <div className="mb-6 sm:mb-8">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">Account Information</h3>
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 sm:p-6 border border-blue-100">
                  <p className="text-gray-700 mb-2 sm:mb-3 text-sm sm:text-base">
                    <span className="font-semibold">Username:</span> {user.username || 'Not set'}
                  </p>
                  <p className="text-gray-700 mb-2 sm:mb-3 text-sm sm:text-base">
                    <span className="font-semibold">Email:</span> {user.email}
                  </p>
                  {user.createdAt && (
                    <p className="text-gray-700 text-sm sm:text-base">
                      <span className="font-semibold">Member since:</span>{' '}
                      {new Date(user.createdAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>

              {/* Change Password Form */}
              <div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">Change Password</h3>
                <form onSubmit={handlePasswordChange} className="space-y-3 sm:space-y-4">
                  <div>
                    <label htmlFor="currentPassword" className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-2">
                      Current Password
                    </label>
                    <input
                      type="password"
                      id="currentPassword"
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm sm:text-base"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="newPassword" className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-2">
                      New Password
                    </label>
                    <input
                      type="password"
                      id="newPassword"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm sm:text-base"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="confirmPassword" className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-2">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      id="confirmPassword"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm sm:text-base"
                      required
                    />
                  </div>
                  {error && (
                    <div className="text-red-600 text-xs sm:text-sm bg-red-50 p-2 sm:p-3 rounded-lg">{error}</div>
                  )}
                  {success && (
                    <div className="text-green-600 text-xs sm:text-sm bg-green-50 p-2 sm:p-3 rounded-lg">{success}</div>
                  )}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2 sm:py-3 px-3 sm:px-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 text-sm sm:text-base"
                  >
                    {loading ? 'Updating...' : 'Update Password'}
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* Right Column - User Stats */}
          <div className="xl:col-span-2">
            <UserStats 
              stats={userStats}
              userRating={user?.rating}
              blunderRating={user?.blunderRating}
              visualisationRating={user?.visualisationRating}
              endgameRating={user?.endgameRating}
              advantageRating={user?.advantageRating}
              advantageWins={user?.advantageWins}
              defenderWins={user?.defenderWins}
              puzzleRushBestStreak={puzzleRushBestStreak}
            />
          </div>

            {/* Saved Games Section */}
            <div className="xl:col-span-1">
              <div className="bg-white shadow-xl rounded-2xl p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-gray-900">Saved Games</h3>
                  <button
                    onClick={fetchSavedGames}
                    disabled={loadingGames}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg text-sm font-medium transition-colors duration-200 disabled:opacity-50"
                  >
                    {loadingGames ? 'Loading...' : 'Refresh'}
                  </button>
                </div>
                
                {savedGames.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500 text-lg">No saved games yet</p>
                    <p className="text-gray-400 text-sm mt-2">Save games from Live Analysis to see them here</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {savedGames.map((game) => (
                      <div key={game._id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-semibold text-gray-900">
                            {game.whiteUsername} vs {game.blackUsername}
                          </h4>
                          <span className="text-sm text-gray-500">
                            {new Date(game.importedAt).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">
                            Result: {game.result || '*'}
                          </span>
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                navigate('/live-analysis', {
                                  state: {
                                    gameData: {
                                      pgn: game.pgn
                                    }
                                  }
                                });
                              }}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg text-sm font-medium transition-colors duration-200"
                            >
                              Load Game
                            </button>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(game.pgn);
                                alert('PGN copied to clipboard!');
                              }}
                              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                            >
                              Copy PGN
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage; 
