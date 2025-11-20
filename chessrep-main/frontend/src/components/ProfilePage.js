import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import UserStats from './UserStats';
import DailyPuzzleStats from './DailyPuzzleStats';
import { getSavedGames, deleteGame, exportGameAsFile } from '../utils/gameManager';
import Icons8Icons from './Icons8Icons';
import ProfileIconSelector from './ProfileIconSelector';
import ProfileIcon from './ProfileIcon';

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
  const [selectedIcon, setSelectedIcon] = useState(user?.profileIcon || 'user');
  const [updatingIcon, setUpdatingIcon] = useState(false);

  // Load saved games
  const loadSavedGames = useCallback(() => {
    setLoadingGames(true);
    try {
      const games = getSavedGames();
      setSavedGames(games);
      console.log('🎮 Loaded saved games:', games.length);
    } catch (error) {
      console.error('❌ Error loading saved games:', error);
    } finally {
      setLoadingGames(false);
    }
  }, []);

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        console.log('🔄 ProfilePage: Fetching profile data...');
        console.log('📊 ProfilePage: Current user from context:', user);
        console.log('📊 ProfilePage: Current userType from context:', user?.userType);
        
        // Check localStorage for stale data
        const storedUserStr = localStorage.getItem('user');
        if (storedUserStr) {
          const storedUser = JSON.parse(storedUserStr);
          console.log('📊 ProfilePage: Stored userType in localStorage:', storedUser.userType);
        }
        
        // Always refresh user data to get the latest userType from server
        const refreshedUser = await refreshUser();
        if (refreshedUser) {
          console.log('✅ ProfilePage: User data refreshed:', refreshedUser);
          console.log('📊 ProfilePage: Refreshed userType:', refreshedUser.userType);
          console.log('📊 ProfilePage: advantageWins:', refreshedUser.advantageWins);
          setUserStats(refreshedUser.stats);
          
          // If userType changed, force a page reload to ensure all components update
          const oldUserType = user?.userType || JSON.parse(localStorage.getItem('user') || '{}').userType;
          if (oldUserType !== refreshedUser.userType) {
            console.log('⚠️ UserType changed from', oldUserType, 'to', refreshedUser.userType, '! Reloading page...');
            setTimeout(() => {
              window.location.reload();
            }, 1000);
          }
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
        console.error('❌ ProfilePage: Error fetching profile:', err);
      }
    };

    if (user) {
      fetchProfileData();
      loadSavedGames(); // Load saved games when user is available
    }

    // Refresh data when page becomes visible (user returns from another page)
    const handleVisibilityChange = () => {
      if (!document.hidden && user) {
        console.log('👁️ ProfilePage: Page became visible, refreshing data...');
        fetchProfileData();
      }
    };

    // Refresh data when window gains focus (user switches back to tab)
    const handleFocus = () => {
      if (user) {
        console.log('🎯 ProfilePage: Window focused, refreshing data...');
        fetchProfileData();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [user, refreshUser]);

  // Update userStats when user object changes
  useEffect(() => {
    if (user && user.stats) {
      setUserStats(user.stats);
    }
  }, [user]);

  // Force refresh when advantageWins changes
  useEffect(() => {
    if (user?.advantageWins !== undefined) {
      console.log('🔄 ProfilePage: advantageWins changed, forcing refresh:', user.advantageWins);
      // Force a re-render by updating a dummy state
      setUserStats(prev => ({ ...prev, _refresh: Date.now() }));
    }
  }, [user?.advantageWins]);

  // Refresh data when user navigates to profile page
  useEffect(() => {
    if (location.pathname === '/profile' && user) {
      console.log('🔄 ProfilePage: User navigated to profile, refreshing data...');
      const refreshData = async () => {
        const refreshedUser = await refreshUser();
        if (refreshedUser) {
          console.log('✅ ProfilePage: Navigation refresh completed:', refreshedUser);
          console.log('📊 ProfilePage: Navigation refresh - advantageWins:', refreshedUser.advantageWins);
          setUserStats(refreshedUser.stats);
        }
      };
      refreshData();
    }
  }, [location.pathname, user, refreshUser]);

  // Listen for focus events to refresh data when user returns to profile
  useEffect(() => {
    const handleFocus = async () => {
      try {
        const refreshedUser = await refreshUser();
        if (refreshedUser) {
          console.log('✅ ProfilePage: Focus refresh completed:', refreshedUser);
          console.log('📊 ProfilePage: Focus refresh - advantageWins:', refreshedUser.advantageWins);
          setUserStats(refreshedUser.stats);
        }
      } catch (error) {
        console.error('❌ ProfilePage: Focus refresh error:', error);
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [refreshUser]);

  // Update selected icon when user data changes
  useEffect(() => {
    if (user?.profileIcon) {
      setSelectedIcon(user.profileIcon);
    }
  }, [user]);

  const handleIconUpdate = async () => {
    try {
      setUpdatingIcon(true);
      setError('');
      setSuccess('');
      
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please log in to update your profile icon');
        setUpdatingIcon(false);
        return;
      }

      console.log('Updating profile icon to:', selectedIcon);
      
      const response = await fetch('http://localhost:3001/api/auth/profile-icon', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        body: JSON.stringify({ profileIcon: selectedIcon })
      });

      console.log('Profile icon update response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('Profile icon updated successfully:', data);
        setSuccess('Profile icon updated successfully!');
        await refreshUser(); // Refresh user data
        setTimeout(() => setSuccess(''), 3000);
      } else if (response.status === 404) {
        // Route not found - backend needs restart
        console.error('Profile icon route not found - backend needs restart');
        setError('⚠️ Backend server needs restart!\n\nThe profile icon feature requires a backend restart.\n\nPlease:\n1. Stop the backend (Ctrl+C)\n2. Run: npm start\n3. Try again');
      } else {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json();
          console.error('Failed to update profile icon:', data);
          setError(data.message || 'Failed to update profile icon');
        } else {
          // Got HTML response instead of JSON - backend needs restart
          console.error('Backend returned HTML - needs restart');
          setError('⚠️ Backend server needs restart!\n\nPlease:\n1. Stop the backend (Ctrl+C)\n2. Run: npm start\n3. Try again');
        }
      }
    } catch (err) {
      console.error('Error updating profile icon:', err);
      setError('An error occurred while updating profile icon: ' + err.message);
    } finally {
      setUpdatingIcon(false);
    }
  };

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
            className="px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 text-sm sm:text-base flex items-center gap-2"
            onClick={async () => {
              console.log('🔄 Manual refresh triggered from profile page');
              const refreshedUser = await refreshUser();
              console.log('✅ Refreshed user:', refreshedUser);
              console.log('📊 userType:', refreshedUser?.userType);
              if (refreshedUser) {
                setUserStats(refreshedUser.stats);
                // The refreshUser function already updates the user state via setUser
                // Force a small delay to ensure state updates, then show success message
                setTimeout(() => {
                  alert('User data refreshed! If your account type changed, please refresh the page.');
                }, 100);
              }
            }}
          >
            <Icons8Icons.RefreshCw className="h-4 w-4" />
            Refresh Data
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
                  <div className="mb-2 sm:mb-3">
                    <span className="font-semibold text-sm sm:text-base">Account Type:</span>
                    <div className="mt-1 inline-flex items-center">
                      {user?.userType === 'premium' ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-900 font-semibold rounded-lg text-sm shadow-md">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          Premium
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-200 text-gray-700 font-semibold rounded-lg text-sm">
                          Free
                        </span>
                      )}
                    </div>
                  </div>
                  {user?.userType !== 'premium' && (
                    <div className="mt-3">
                      <Link
                        to="/upgrade"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-gray-900 font-semibold rounded-lg text-sm transition-all shadow-md hover:shadow-lg"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        Upgrade to Premium
                      </Link>
                    </div>
                  )}
                  {user.createdAt && (
                    <p className="text-gray-700 text-sm sm:text-base mt-2 sm:mt-3">
                      <span className="font-semibold">Member since:</span>{' '}
                      {new Date(user.createdAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>

              {/* Profile Icon Selector */}
              <div className="mb-6 sm:mb-8">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">Profile Icon</h3>
                <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-4 sm:p-6 border border-purple-100">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="text-sm text-gray-700">Current Icon:</div>
                    <ProfileIcon iconId={selectedIcon} size="lg" />
                  </div>
                  <p className="text-sm text-gray-600 mb-4">Choose your profile icon:</p>
                  <ProfileIconSelector
                    selectedIcon={selectedIcon}
                    onSelect={setSelectedIcon}
                    size="md"
                  />
                  <button
                    onClick={handleIconUpdate}
                    disabled={updatingIcon || selectedIcon === user?.profileIcon}
                    className="mt-4 w-full py-2 sm:py-3 px-3 sm:px-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 text-sm sm:text-base"
                  >
                    {updatingIcon ? 'Updating...' : 'Update Profile Icon'}
                  </button>
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

              {/* Saved Games Section */}
              <div className="mt-6 sm:mt-8">
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 sm:p-6 border border-green-100">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-gray-900">Saved Games</h3>
                    <button
                      onClick={loadSavedGames}
                      disabled={loadingGames}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg text-sm font-medium transition-colors duration-200 disabled:opacity-50"
                    >
                      {loadingGames ? 'Loading...' : 'Refresh'}
                    </button>
                  </div>
                  
                  {savedGames.length === 0 ? (
                    <div className="text-center py-6">
                      <p className="text-gray-500 text-base">No saved games yet</p>
                      <p className="text-gray-400 text-sm mt-2">Save games from Chess Annotation to see them here</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {savedGames.map((game) => (
                        <div
                          key={game.id}
                          className="bg-white rounded-lg p-3 border border-gray-200 hover:border-blue-300 transition-colors"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900 text-sm">
                                {game.white} vs {game.black}
                              </h4>
                              <p className="text-xs text-gray-500 mt-1">
                                {new Date(game.date).toLocaleDateString()}
                              </p>
                            </div>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              game.result === '1-0' ? 'bg-green-100 text-green-800' :
                              game.result === '0-1' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {game.result}
                            </span>
                          </div>
                          
                          <div className="flex gap-2 mt-3">
                            <button
                              onClick={() => {
                                // Load game in Analysis page with PGN
                                const encodedPgn = encodeURIComponent(game.pgn || '');
                                const encodedFen = encodeURIComponent(game.fen || '');
                                // Navigate to /analysis with PGN (and FEN if available)
                                if (game.pgn) {
                                  navigate(`/analysis?pgn=${encodedPgn}${encodedFen ? `&fen=${encodedFen}` : ''}`);
                                } else if (game.fen) {
                                  navigate(`/analysis?fen=${encodedFen}`);
                                } else {
                                  navigate('/analysis');
                                }
                              }}
                              className="flex items-center gap-1 px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-xs rounded-md transition-colors flex-1"
                              title="Load game in Analysis Board"
                            >
                              <Icons8Icons.CheckCircle className="h-3 w-3" />
                              Load
                            </button>
                            
                            <button
                              onClick={() => exportGameAsFile(game)}
                              className="flex items-center gap-1 px-3 py-1 bg-green-500 hover:bg-green-600 text-white text-xs rounded-md transition-colors flex-1"
                              title="Export as PGN file"
                            >
                              <Icons8Icons.CheckCircle className="h-3 w-3" />
                              Export
                            </button>
                            
                            <button
                              onClick={() => {
                                if (window.confirm('Are you sure you want to delete this game?')) {
                                  deleteGame(game.id);
                                  loadSavedGames();
                                }
                              }}
                              className="flex items-center gap-1 px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-xs rounded-md transition-colors"
                              title="Delete game"
                            >
                              <Icons8Icons.CheckCircle className="h-3 w-3" />
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - User Stats */}
          <div className="xl:col-span-2">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Your Statistics</h2>
              <button
                onClick={async () => {
                  console.log('🔄 Manual refresh triggered');
                  const refreshedUser = await refreshUser();
                  if (refreshedUser) {
                    console.log('✅ Manual refresh completed:', refreshedUser);
                    console.log('📊 Manual refresh - advantageWins:', refreshedUser.advantageWins);
                    setUserStats(refreshedUser.stats);
                    // Force a re-render to ensure UserStats updates
                    setTimeout(() => {
                      setUserStats(prev => ({ ...prev, _refresh: Date.now() }));
                    }, 100);
                  }
                }}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
              >
                Refresh Stats
              </button>
            </div>
            <UserStats 
              key={`userstats-${user?.advantageWins}-${userStats?._refresh || 0}`}
              stats={userStats}
              userRating={user?.rating}
              blunderRating={user?.blunderRating}
              visualisationRating={user?.visualisationRating}
              endgameRating={user?.endgameRating}
              advantageRating={user?.advantageRating}
              advantageWins={user?.advantageWins}
              resourcefulnessRating={user?.resourcefulnessRating}
              defenderWins={user?.defenderWins}
              puzzleRushBestStreak={puzzleRushBestStreak}
            />
          </div>
        </div>

        {/* Daily Puzzle Statistics */}
        <div className="mt-8">
          <div className="bg-white shadow-xl rounded-2xl p-6 border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
              Daily Puzzle Statistics
            </h2>
            <DailyPuzzleStats />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage; 
