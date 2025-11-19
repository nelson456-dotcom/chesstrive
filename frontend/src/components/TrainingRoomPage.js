import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Puzzle, AlertTriangle, Eye, Target, Play, BarChart2, Zap, Brain, TrendingUp, Award, ChevronRight, Bot, Shield } from 'lucide-react';

const tools = [
  {
    title: 'Live Training',
    path: '/live-analysis',
    icon: <BarChart2 className="w-12 h-12" />,
    desc: 'Real-time analysis and practice with engine insights while you train.',
    category: 'Live',
    color: 'from-cyan-500 to-blue-600',
    bgColor: 'bg-cyan-500/10',
    borderColor: 'border-cyan-500/20'
  },
  {
    title: 'Blunder Preventer',
    path: '/blunder-preventer-intro',
    icon: <AlertTriangle className="w-12 h-12" />,
    desc: 'Sharpen your decision-making by choosing between good moves and blunders.',
    category: 'Decision Making',
    color: 'from-red-500 to-red-600',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/20'
  },
  {
    title: 'Defender',
    path: '/defender',
    icon: <Shield className="w-12 h-12" />,
    desc: 'Master defensive chess techniques and learn to protect your position from threats.',
    category: 'Defense',
    color: 'from-indigo-500 to-purple-500',
    bgColor: 'bg-indigo-500/10',
    borderColor: 'border-indigo-500/20'
  },
  {
    title: 'Openings',
    path: '/openings',
    icon: <Brain className="w-12 h-12" />,
    desc: 'Build and review your opening repertoire with structured lines.',
    category: 'Openings',
    color: 'from-emerald-500 to-teal-600',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/20'
  },
  {
    title: 'Puzzle Trainer',
    path: '/puzzle-trainer-intro',
    icon: <Puzzle className="w-12 h-12" />,
    desc: 'Master tactical patterns with themed puzzles and adaptive difficulty.',
    category: 'Tactics',
    color: 'from-blue-500 to-blue-600',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/20'
  },
  {
    title: 'Endgame Mastery',
    path: '/endgame-trainer-intro',
    icon: <Target className="w-12 h-12" />,
    desc: 'Perfect your endgame technique with practical positions and instant feedback.',
    category: 'Endgame',
    color: 'from-indigo-500 to-indigo-600',
    bgColor: 'bg-indigo-500/10',
    borderColor: 'border-indigo-500/20'
  },
  {
    title: 'Visualization Practice',
    path: '/practice-visualisation-intro',
    icon: <Eye className="w-12 h-12" />,
    desc: 'Strengthen your board vision by memorizing positions without seeing pieces.',
    category: 'Visualization',
    color: 'from-yellow-500 to-orange-500',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/20'
  },
  {
    title: 'Positional Play Trainer',
    path: '/positional-trainer-intro',
    icon: <Brain className="w-12 h-12" />,
    desc: 'Master strategic concepts like weak squares, outposts, and pawn structures.',
    category: 'Strategy',
    color: 'from-green-500 to-emerald-600',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/20'
  },
  {
    title: 'Puzzle Rush',
    path: '/puzzle-rush-intro',
    icon: <Zap className="w-12 h-12" />,
    desc: 'Solve puzzles against the clock with 3min and 5min modes.',
    category: 'Speed',
    color: 'from-yellow-500 to-orange-600',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/20'
  },
  {
    title: 'Play with Bot',
    path: '/play-with-bot-intro',
    icon: <Bot className="w-12 h-12" />,
    desc: 'Challenge AI opponents with customizable difficulty and personalities.',
    category: 'Practice',
    color: 'from-blue-500 to-cyan-600',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/20'
  },
  {
    title: 'Advantage Conversion',
    path: '/advantage-capitalisation-intro',
    icon: <Target className="w-12 h-12" />,
    desc: 'Learn to convert winning positions into decisive victories against the engine.',
    category: 'Endgame',
    color: 'from-purple-500 to-purple-600',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/20'
  },
  // Removed Endgame Mastery card as requested
  {
    title: 'Master Games',
    path: '/guess-the-move-intro',
    icon: <Play className="w-12 h-12" />,
    desc: 'Study brilliancies by guessing the next move in legendary chess games.',
    category: 'Study',
    color: 'from-pink-500 to-pink-600',
    bgColor: 'bg-pink-500/10',
    borderColor: 'border-pink-500/20'
  },
  {
    title: '40-Game Report',
    path: '/40-game-report-intro',
    icon: <TrendingUp className="w-12 h-12" />,
    desc: 'Get detailed performance insights from your recent games across platforms.',
    category: 'Analysis',
    color: 'from-emerald-500 to-teal-600',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/20'
  }
];

const TrainingRoomPage = () => {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen text-white py-12 px-4">
      {/* Header Section */}
      <div className="max-w-7xl mx-auto text-center mb-16">
        <div className="flex items-center justify-center space-x-3 mb-6">
          <Zap className="w-10 h-10 text-yellow-400" />
          <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
            Training Room
          </h1>
        </div>
        <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
          Choose your training focus and start improving your chess skills with our comprehensive suite of tools
        </p>
        <div className="flex items-center justify-center space-x-6 mt-8">
          <div className="flex items-center space-x-2 text-gray-300">
            <Brain className="w-5 h-5 text-blue-400" />
            <span className="text-sm">Adaptive Learning</span>
          </div>
          <div className="flex items-center space-x-2 text-gray-300">
            <Award className="w-5 h-5 text-yellow-400" />
            <span className="text-sm">Progress Tracking</span>
          </div>
          <div className="flex items-center space-x-2 text-gray-300">
            <Target className="w-5 h-5 text-green-400" />
            <span className="text-sm">Personalized Training</span>
          </div>
        </div>
      </div>

      {/* Training Tools Grid */}
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {tools.map((tool, index) => (
            <div
              key={tool.title}
              className={`group relative bg-gradient-to-br from-slate-800/50 to-blue-900/30 backdrop-blur-sm border ${tool.borderColor} rounded-2xl p-6 cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/10 ${tool.bgColor} hover:border-opacity-40`}
              onClick={() => navigate(tool.path)}
            >
              {/* Category Badge */}
              <div className="absolute top-4 right-4">
                <span className="text-xs px-2 py-1 bg-white/10 backdrop-blur-sm rounded-full text-gray-300">
                  {tool.category}
                </span>
              </div>

              {/* Icon */}
              <div className={`mb-4 p-3 rounded-xl bg-gradient-to-r ${tool.color} text-white w-fit group-hover:scale-110 transition-transform duration-300`}>
                {tool.icon}
              </div>

              {/* Content */}
              <h3 className="text-xl font-bold mb-3 text-white group-hover:text-blue-200 transition-colors">
                {tool.title}
              </h3>
              <p className="text-gray-300 text-sm leading-relaxed mb-4">
                {tool.desc}
              </p>

              {/* Action Button */}
              <div className="flex items-center justify-between mt-auto">
                <span className="text-sm font-medium text-gray-400 group-hover:text-gray-300 transition-colors">
                  Start Training
                </span>
                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-white group-hover:translate-x-1 transition-all duration-200" />
              </div>

              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-cyan-600/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="max-w-4xl mx-auto text-center mt-16">
        <div className="bg-gradient-to-r from-slate-800/50 to-blue-900/30 backdrop-blur-sm border border-blue-500/20 rounded-2xl p-8">
          <h2 className="text-2xl font-bold mb-4 text-white">Ready to Level Up Your Chess?</h2>
          <p className="text-gray-300 mb-6">
            Combine multiple training methods for maximum improvement. Track your progress and watch your rating soar!
          </p>
          <button
            onClick={() => navigate('/profile')}
            className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
          >
            View My Progress
          </button>
        </div>
      </div>
    </div>
  );
};
export default TrainingRoomPage; 