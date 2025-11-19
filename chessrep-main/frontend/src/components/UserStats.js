import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import Icons8Icons from './Icons8Icons';

const UserStats = ({ stats: propStats, userRating, blunderRating, visualisationRating, endgameRating, advantageRating, advantageWins, resourcefulnessRating, defenderWins, openingsPracticed: propOpenings = 0, puzzleRushBestStreak = 0 }) => {
  const { user } = useAuth();

  console.log('📊 UserStats: Received props:', { 
    advantageWins, 
    advantageRating, 
    userRating, 
    blunderRating, 
    visualisationRating, 
    endgameRating 
  });
  
  console.log('📊 UserStats: User data:', {
    openingsPracticed: user?.openingsPracticed,
    stats: user?.stats,
    openingStats: user?.stats?.openingStats,
    openings: user?.stats?.openingStats?.openings
  });

  // Default stats structure
  const defaultStats = {
    puzzleStats: {
      totalAttempted: 0,
      totalSolved: 0,
      totalFailed: 0,
      currentStreak: 0,
      bestStreak: 0
    },
    openingStats: {
      openings: []
    }
  };

  // Use propStats if provided, otherwise user.stats, otherwise default
  const stats = propStats || user?.stats || defaultStats;

  // Calculate openings practiced count with proper null checks
  const openingsPracticed = user?.openingsPracticed || (stats?.openingStats?.openings?.length || 0) || propOpenings || user?.repertoire?.length || 0;

  return (
    <div className="bg-white shadow-xl rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 border border-gray-100">
      <h2 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
        Your Statistics
      </h2>
      
      {/* Ratings Section */}
      <div className="mb-6 sm:mb-8">
        <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-4 sm:mb-6">Your Ratings</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Puzzle Rating */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 sm:p-6 rounded-xl border border-blue-200 shadow-lg">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <h4 className="text-base sm:text-lg font-semibold text-blue-900">Puzzle Trainer</h4>
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <Icons8Icons.Target className="text-white text-xs sm:text-sm" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-blue-600 mb-1 sm:mb-2">
              {userRating || 1200}
            </p>
            <p className="text-xs sm:text-sm text-blue-700">Puzzle solving skills</p>
          </div>

          {/* Blunder Rating */}
          <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-4 sm:p-6 rounded-xl border border-amber-200 shadow-lg">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <h4 className="text-base sm:text-lg font-semibold text-amber-900">Blunder Preventer</h4>
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-amber-500 rounded-full flex items-center justify-center">
                <Icons8Icons.Shield className="text-white text-xs sm:text-sm" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-amber-600 mb-1 sm:mb-2">
              {blunderRating || 1200}
            </p>
            <p className="text-xs sm:text-sm text-amber-700">Blunder detection skills</p>
          </div>

          {/* Visualisation Rating */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 sm:p-6 rounded-xl border border-purple-200 shadow-lg">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <h4 className="text-base sm:text-lg font-semibold text-purple-900">Practice Visualisation</h4>
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-purple-500 rounded-full flex items-center justify-center">
                <Icons8Icons.Eye className="text-white text-xs sm:text-sm" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-purple-600 mb-1 sm:mb-2">
              {visualisationRating || 1200}
            </p>
            <p className="text-xs sm:text-sm text-purple-700">Visualisation skills</p>
          </div>

          {/* Endgame Rating */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 sm:p-6 rounded-xl border border-green-200 shadow-lg">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <h4 className="text-base sm:text-lg font-semibold text-green-900">Endgame Trainer</h4>
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-green-500 rounded-full flex items-center justify-center">
                <Icons8Icons.Trophy className="text-white text-xs sm:text-sm" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-green-600 mb-1 sm:mb-2">
              {endgameRating || 1200}
            </p>
            <p className="text-xs sm:text-sm text-green-700">Endgame skills</p>
          </div>
        </div>
      </div>

      {/* Advantage Conversion Rating */}
      <div className="mb-6 sm:mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="bg-gradient-to-br from-rose-50 to-rose-100 p-4 sm:p-6 rounded-xl border border-rose-200 shadow-lg">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <h4 className="text-base sm:text-lg font-semibold text-rose-900">Advantage Conversion</h4>
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-rose-500 rounded-full flex items-center justify-center">
                <Icons8Icons.Zap className="text-white text-xs sm:text-sm" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-rose-600 mb-1 sm:mb-2">
              {advantageWins || 0}
            </p>
            <p className="text-xs sm:text-sm text-rose-700">Positions won</p>
          </div>
          
          {/* Resourcefulness Rating */}
          <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-4 sm:p-6 rounded-xl border border-indigo-200 shadow-lg">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <h4 className="text-base sm:text-lg font-semibold text-indigo-900">Resourcefulness</h4>
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-indigo-500 rounded-full flex items-center justify-center">
                <Icons8Icons.Shield className="text-white text-xs sm:text-sm" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-indigo-600 mb-1 sm:mb-2">
              {resourcefulnessRating || 1200}
            </p>
            <p className="text-xs sm:text-sm text-indigo-700">Defensive skills</p>
          </div>
          
          {/* Defender Wins */}
          <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 p-4 sm:p-6 rounded-xl border border-cyan-200 shadow-lg">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <h4 className="text-base sm:text-lg font-semibold text-cyan-900">Defender Wins</h4>
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-cyan-500 rounded-full flex items-center justify-center">
                <Icons8Icons.Trophy className="text-white text-xs sm:text-sm" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-cyan-600 mb-1 sm:mb-2">
              {defenderWins || 0}
            </p>
            <p className="text-xs sm:text-sm text-cyan-700">Positions won</p>
          </div>
        </div>
      </div>

      {/* Opening Practice Section */}
      <div className="mb-6 sm:mb-8">
        <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-4 sm:mb-6">Opening Practice</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          {/* Openings in Repertoire */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 sm:p-6 rounded-xl border border-green-200 shadow-lg">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <h4 className="text-base sm:text-lg font-semibold text-green-900">Openings Practiced</h4>
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-green-500 rounded-full flex items-center justify-center">
                <Icons8Icons.BookOpen className="text-white text-xs sm:text-sm" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-green-600 mb-1 sm:mb-2">
              {openingsPracticed}
            </p>
            <p className="text-xs sm:text-sm text-green-700">In your repertoire</p>
          </div>

          
        </div>
      </div>
      
      {/* Puzzle Stats */}
      <div className="mb-6 sm:mb-8">
        <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-4 sm:mb-6">Puzzle Performance</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 sm:p-6 rounded-xl border border-gray-200 shadow-md">
            <p className="text-xs sm:text-sm text-gray-600 mb-1 sm:mb-2">Total Attempted</p>
            <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800">{stats?.puzzleStats?.totalAttempted || 0}</p>
          </div>
          <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 sm:p-6 rounded-xl border border-green-200 shadow-md">
            <p className="text-xs sm:text-sm text-green-600 mb-1 sm:mb-2">Total Solved</p>
            <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-green-700">{stats?.puzzleStats?.totalSolved || 0}</p>
          </div>
          <div className="bg-gradient-to-r from-red-50 to-red-100 p-4 sm:p-6 rounded-xl border border-red-200 shadow-md">
            <p className="text-xs sm:text-sm text-red-600 mb-1 sm:mb-2">Total Failed</p>
            <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-red-700">{stats?.puzzleStats?.totalFailed || 0}</p>
          </div>
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 sm:p-6 rounded-xl border border-blue-200 shadow-md">
            <p className="text-xs sm:text-sm text-blue-600 mb-1 sm:mb-2">Success Rate</p>
            <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-blue-700">
              {(stats?.puzzleStats?.totalAttempted || 0) > 0
                ? `${Math.round(((stats?.puzzleStats?.totalSolved || 0) / (stats?.puzzleStats?.totalAttempted || 1)) * 100)}%`
                : '0%'}
            </p>
          </div>
          <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 p-4 sm:p-6 rounded-xl border border-yellow-200 shadow-md">
            <p className="text-xs sm:text-sm text-yellow-600 mb-1 sm:mb-2">Current Streak</p>
            <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-yellow-700">{stats?.puzzleStats?.currentStreak || 0}</p>
          </div>
          <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-4 sm:p-6 rounded-xl border border-orange-200 shadow-md">
            <p className="text-xs sm:text-sm text-orange-600 mb-1 sm:mb-2">Best Streak</p>
            <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-orange-700">{stats?.puzzleStats?.bestStreak || 0}</p>
          </div>
        </div>
      </div>

      {/* Puzzle Rush Stats */}
      {puzzleRushBestStreak > 0 && (
        <div className="mb-6 sm:mb-8">
          <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-4 sm:mb-6">Puzzle Rush</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 sm:p-6 rounded-xl border border-purple-200 shadow-lg">
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <h4 className="text-base sm:text-lg font-semibold text-purple-900">Best Streak</h4>
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-purple-500 rounded-full flex items-center justify-center">
                  <Icons8Icons.Zap className="text-white text-xs sm:text-sm" />
                </div>
              </div>
              <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-purple-600 mb-1 sm:mb-2">
                {puzzleRushBestStreak}
              </p>
              <p className="text-xs sm:text-sm text-purple-700">Consecutive puzzles solved</p>
            </div>
          </div>
        </div>
      )}

      {/* Opening Stats */}
      <div>
        <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-4 sm:mb-6">Opening Performance</h3>
        {(stats?.openingStats?.openings?.length || 0) > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {stats.openingStats.openings.map((opening, index) => (
              <div key={index} className="bg-gradient-to-r from-indigo-50 to-indigo-100 p-4 sm:p-6 rounded-xl border border-indigo-200 shadow-md">
                <h4 className="font-semibold text-indigo-900 mb-2 sm:mb-3 text-sm sm:text-base">{opening.name}</h4>
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <p className="text-xs sm:text-sm text-indigo-600 mb-1">Total Played</p>
                    <p className="text-lg sm:text-xl font-bold text-indigo-700">{opening.totalPlayed}</p>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-indigo-600 mb-1">Win Rate</p>
                    <p className="text-lg sm:text-xl font-bold text-indigo-700">
                      {opening.totalPlayed > 0
                        ? `${Math.round((opening.wins / opening.totalPlayed) * 100)}%`
                        : '0%'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-6 sm:p-8 rounded-xl border border-gray-200 text-center">
            <p className="text-gray-500 text-sm sm:text-base lg:text-lg">No opening statistics available yet.</p>
            <p className="text-gray-400 text-xs sm:text-sm mt-2">Start playing openings to see your performance here!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserStats; 
