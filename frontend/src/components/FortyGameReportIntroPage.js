import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingUp, BarChart3, Target, Brain, Play, Award, PieChart, Activity, Users } from 'lucide-react';

const FortyGameReportIntroPage = () => {
  const navigate = useNavigate();

  const startReport = () => {
    navigate('/report/40');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
      {/* Header */}
      <div className="bg-white/90 backdrop-blur-sm border-b border-emerald-200/50 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/training-room')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div className="flex items-center space-x-3">
              <TrendingUp className="w-8 h-8 text-emerald-500" />
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">40-Game Analysis Report</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white p-8 rounded-2xl mb-8 shadow-xl">
            <TrendingUp className="w-16 h-16 mx-auto mb-4" />
            <h2 className="text-3xl font-bold mb-4">Comprehensive Game Analysis</h2>
            <p className="text-xl text-emerald-100">
              Get detailed insights from your recent games across Chess.com and Lichess
            </p>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div className="bg-white rounded-xl p-6 shadow-lg border border-emerald-100">
            <div className="flex items-center space-x-3 mb-4">
              <BarChart3 className="w-8 h-8 text-emerald-500" />
              <h3 className="text-xl font-semibold text-gray-900">Move Quality Analysis</h3>
            </div>
            <p className="text-gray-600 mb-4">
              Detailed breakdown of your move accuracy, including blunders, mistakes, inaccuracies, and excellent moves.
            </p>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span>Blunder identification and frequency</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <span>Mistake pattern analysis</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Best move percentage tracking</span>
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-emerald-100">
            <div className="flex items-center space-x-3 mb-4">
              <Target className="w-8 h-8 text-teal-500" />
              <h3 className="text-xl font-semibold text-gray-900">Key Performance Metrics</h3>
            </div>
            <p className="text-gray-600 mb-4">
              Track your improvement with comprehensive statistics and performance indicators.
            </p>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Average accuracy percentage</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-teal-500 rounded-full"></div>
                <span>Time management analysis</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                <span>Rating performance trends</span>
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-emerald-100">
            <div className="flex items-center space-x-3 mb-4">
              <Brain className="w-8 h-8 text-cyan-500" />
              <h3 className="text-xl font-semibold text-gray-900">Opening Performance</h3>
            </div>
            <p className="text-gray-600 mb-4">
              Analyze your opening repertoire and identify strengths and weaknesses in your preparation.
            </p>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                <span>Opening success rates</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-teal-500 rounded-full"></div>
                <span>Repertoire gap identification</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-cyan-500 rounded-full"></div>
                <span>ECO code performance breakdown</span>
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-emerald-100">
            <div className="flex items-center space-x-3 mb-4">
              <Users className="w-8 h-8 text-indigo-500" />
              <h3 className="text-xl font-semibold text-gray-900">Opponent Scouting</h3>
            </div>
            <p className="text-gray-600 mb-4">
              Get insights into your opponents' playing styles and tendencies for competitive advantage.
            </p>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-violet-500 rounded-full"></div>
                <span>Playing style analysis</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
                <span>Strength and weakness identification</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-rose-500 rounded-full"></div>
                <span>Historical performance data</span>
              </li>
            </ul>
          </div>
        </div>

        {/* How it Works */}
        <div className="bg-gradient-to-r from-white to-emerald-50 rounded-xl p-8 mb-12 border border-emerald-200">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">How It Works</h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="bg-emerald-500 text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                1
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Import Games</h4>
              <p className="text-sm text-gray-600">
                Enter your Chess.com or Lichess username to automatically fetch your recent games
              </p>
            </div>
            <div className="text-center">
              <div className="bg-teal-500 text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                2
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">AI Analysis</h4>
              <p className="text-sm text-gray-600">
                Our engine analyzes every move, identifying patterns and calculating accuracy scores
              </p>
            </div>
            <div className="text-center">
              <div className="bg-cyan-500 text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                3
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Get Insights</h4>
              <p className="text-sm text-gray-600">
                Receive detailed reports with actionable insights to improve your play
              </p>
            </div>
          </div>
        </div>

        {/* Benefits */}
        <div className="bg-white rounded-xl p-8 mb-12 shadow-lg border border-emerald-100">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">Why Use 40-Game Reports?</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <Award className="w-6 h-6 text-emerald-500 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-gray-900">Identify Patterns</h4>
                  <p className="text-sm text-gray-600">Discover recurring mistakes and weaknesses in your play</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Activity className="w-6 h-6 text-teal-500 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-gray-900">Track Progress</h4>
                  <p className="text-sm text-gray-600">Monitor your improvement over time with detailed metrics</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <PieChart className="w-6 h-6 text-cyan-500 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-gray-900">Data-Driven Training</h4>
                  <p className="text-sm text-gray-600">Focus your study on areas that need the most improvement</p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <Target className="w-6 h-6 text-indigo-500 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-gray-900">Competitive Edge</h4>
                  <p className="text-sm text-gray-600">Scout opponents and prepare for matches with detailed analysis</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Brain className="w-6 h-6 text-teal-500 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-gray-900">Opening Insights</h4>
                  <p className="text-sm text-gray-600">Optimize your opening repertoire based on actual results</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <BarChart3 className="w-6 h-6 text-pink-500 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-gray-900">Professional Reports</h4>
                  <p className="text-sm text-gray-600">Export detailed PDF reports for coaches or personal review</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <button
            onClick={startReport}
            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-12 py-4 rounded-xl text-lg font-semibold shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-200 inline-flex items-center space-x-3"
          >
            <Play className="w-6 h-6" />
            <span>Generate My Report</span>
          </button>
          <p className="text-sm text-gray-500 mt-4">
            Analyze your last 40 games • Free for all users • Export to PDF
          </p>
        </div>
      </div>
    </div>
  );
};

export default FortyGameReportIntroPage;



