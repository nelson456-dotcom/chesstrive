import React, { useState, useEffect } from 'react';
import { Calendar, Trophy, Target, TrendingUp, BarChart3, Clock } from 'lucide-react';
import { getDailyStats, getOverallStats, getPuzzleTypeDisplayName, getRatingSystemName, formatDate, PUZZLE_TYPES } from '../utils/puzzleTracker';

const DailyPuzzleStats = () => {
  const [dailyStats, setDailyStats] = useState({});
  const [overallStats, setOverallStats] = useState({});
  const [selectedDays, setSelectedDays] = useState(7);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [selectedDays]);

  const loadStats = () => {
    setLoading(true);
    
    // Get last N days of statistics
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - selectedDays);
    
    const stats = getDailyStats(
      startDate.toISOString().split('T')[0],
      endDate.toISOString().split('T')[0]
    );
    
    setDailyStats(stats);
    
    // Get overall statistics
    const overall = {
      regular: getOverallStats(PUZZLE_TYPES.REGULAR),
      endgame: getOverallStats(PUZZLE_TYPES.ENDGAME),
      combined: getOverallStats()
    };
    
    setOverallStats(overall);
    setLoading(false);
  };

  const getSortedDays = () => {
    return Object.values(dailyStats).sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  const getTotalForPeriod = (type) => {
    const days = getSortedDays();
    return days.reduce((total, day) => total + day[type].total, 0);
  };

  const getSolvedForPeriod = (type) => {
    const days = getSortedDays();
    return days.reduce((total, day) => total + day[type].solved, 0);
  };

  const getHighestRatingForPeriod = (type) => {
    const days = getSortedDays();
    return Math.max(...days.map(day => day[type].highestRating), 0);
  };

  const getAccuracyForPeriod = (type) => {
    const total = getTotalForPeriod(type);
    const solved = getSolvedForPeriod(type);
    return total > 0 ? Math.round((solved / total) * 100) : 0;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const sortedDays = getSortedDays();

  return (
    <div className="space-y-6">
      {/* Period Selection */}
      <div className="flex justify-center">
        <div className="bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 rounded-xl p-4 backdrop-blur-sm">
          <div className="flex space-x-2">
            {[7, 14, 30].map(days => (
              <button
                key={days}
                onClick={() => setSelectedDays(days)}
                className={`px-4 py-2 rounded-lg font-semibold transition-all duration-200 ${
                  selectedDays === days
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                    : 'bg-white/10 text-indigo-300 hover:bg-white/20 hover:text-white'
                }`}
              >
                Last {days} days
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Overall Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Regular Puzzles */}
        <div className="bg-gradient-to-br from-emerald-600 to-teal-600 rounded-2xl p-6 border border-emerald-500 shadow-xl">
          <div className="flex items-center mb-4">
            <Trophy className="w-6 h-6 text-white mr-3" />
            <h3 className="text-xl font-bold text-white">Tactical Puzzles</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-emerald-100">Total:</span>
              <span className="text-white font-bold">{getTotalForPeriod('regular')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-emerald-100">Solved:</span>
              <span className="text-green-200 font-bold">{getSolvedForPeriod('regular')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-emerald-100">Accuracy:</span>
              <span className="text-white font-bold">{getAccuracyForPeriod('regular')}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-emerald-100">Highest Rating:</span>
              <span className="text-yellow-200 font-bold">{getHighestRatingForPeriod('regular')}</span>
            </div>
          </div>
        </div>

        {/* Endgame Trainer */}
        <div className="bg-gradient-to-br from-rose-600 to-pink-600 rounded-2xl p-6 border border-rose-500 shadow-xl">
          <div className="flex items-center mb-4">
            <Target className="w-6 h-6 text-white mr-3" />
            <h3 className="text-xl font-bold text-white">Endgame Trainer</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-rose-100">Total:</span>
              <span className="text-white font-bold">{getTotalForPeriod('endgame')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-rose-100">Solved:</span>
              <span className="text-green-200 font-bold">{getSolvedForPeriod('endgame')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-rose-100">Accuracy:</span>
              <span className="text-white font-bold">{getAccuracyForPeriod('endgame')}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-rose-100">Highest Rating:</span>
              <span className="text-yellow-200 font-bold">{getHighestRatingForPeriod('endgame')}</span>
            </div>
          </div>
        </div>

        {/* Combined Stats */}
        <div className="bg-gradient-to-br from-amber-600 to-orange-600 rounded-2xl p-6 border border-amber-500 shadow-xl">
          <div className="flex items-center mb-4">
            <BarChart3 className="w-6 h-6 text-white mr-3" />
            <h3 className="text-xl font-bold text-white">Combined</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-amber-100">Total:</span>
              <span className="text-white font-bold">
                {getTotalForPeriod('regular') + getTotalForPeriod('endgame')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-amber-100">Solved:</span>
              <span className="text-green-200 font-bold">
                {getSolvedForPeriod('regular') + getSolvedForPeriod('endgame')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-amber-100">Accuracy:</span>
              <span className="text-white font-bold">
                {(() => {
                  const total = getTotalForPeriod('regular') + getTotalForPeriod('endgame');
                  const solved = getSolvedForPeriod('regular') + getSolvedForPeriod('endgame');
                  return total > 0 ? Math.round((solved / total) * 100) : 0;
                })()}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-amber-100">Best Day:</span>
              <span className="text-yellow-200 font-bold">
                {Math.max(...sortedDays.map(day => day.regular.total + day.endgame.total), 0)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Daily Breakdown */}
      <div className="bg-gradient-to-br from-slate-800 to-indigo-900 rounded-2xl p-6 border border-indigo-500 shadow-xl">
        <h3 className="text-xl font-bold text-white mb-6 flex items-center">
          <Calendar className="w-6 h-6 mr-3 text-white" />
          Daily Breakdown
        </h3>
        
        {sortedDays.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            No puzzle data available for the selected period.
          </div>
        ) : (
          <div className="space-y-4">
            {sortedDays.map((day, index) => (
              <div key={day.date} className="bg-gradient-to-r from-slate-700 to-slate-600 rounded-xl p-4 border border-slate-500 shadow-lg">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-lg font-semibold text-white">
                    {formatDate(day.date)}
                  </h4>
                  <div className="text-sm text-indigo-200 font-medium">
                    {day.regular.total + day.endgame.total} total puzzles
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Regular Puzzles */}
                  <div className="bg-gradient-to-r from-emerald-800 to-teal-800 rounded-lg p-3 border border-emerald-500">
                    <div className="flex items-center mb-2">
                      <Trophy className="w-4 h-4 text-white mr-2" />
                      <span className="text-sm font-semibold text-white">Tactical Puzzles</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-emerald-100">Total:</span>
                        <span className="text-white font-bold">{day.regular.total}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-emerald-100">Solved:</span>
                        <span className="text-green-200 font-bold">{day.regular.solved}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-emerald-100">Failed:</span>
                        <span className="text-red-200 font-bold">{day.regular.failed}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-emerald-100">Best:</span>
                        <span className="text-yellow-200 font-bold">{day.regular.highestRating}</span>
                      </div>
                    </div>
                  </div>

                  {/* Endgame Trainer */}
                  <div className="bg-gradient-to-r from-rose-800 to-pink-800 rounded-lg p-3 border border-rose-500">
                    <div className="flex items-center mb-2">
                      <Target className="w-4 h-4 text-white mr-2" />
                      <span className="text-sm font-semibold text-white">Endgame Trainer</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-rose-100">Total:</span>
                        <span className="text-white font-bold">{day.endgame.total}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-rose-100">Solved:</span>
                        <span className="text-green-200 font-bold">{day.endgame.solved}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-rose-100">Failed:</span>
                        <span className="text-red-200 font-bold">{day.endgame.failed}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-rose-100">Best:</span>
                        <span className="text-yellow-200 font-bold">{day.endgame.highestRating}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DailyPuzzleStats;
