import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Zap, 
  Puzzle, 
  Brain, 
  Shield,
  Target, 
  Eye, 
  Bot, 
  BarChart2,
  TrendingUp,
  ChevronRight,
  Play,
  Award,
  AlertTriangle,
  Lock
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const LessonsPage = () => {
  const { user } = useAuth();
  // Show lock icon if user is not premium (including if not logged in)
  const isPremium = user && user.userType === 'premium';
  
  // All training modules from TrainingRoomPage
  // accessLevel: 'free' = unlimited, 'freemium' = limited for free users, 'premium' = premium only
  const trainingModules = [
    {
      id: 'live-training',
      title: 'Live Training',
      description: 'Real-time analysis and practice with engine insights while you train.',
      icon: <BarChart2 className="w-8 h-8" />,
      difficulty: 'All Levels',
      duration: '15-45 min',
      color: 'from-cyan-500 to-blue-600',
      bgColor: 'bg-cyan-500/10',
      borderColor: 'border-cyan-500/20',
      link: '/live-analysis',
      category: 'Live',
      rating: 4.9,
      students: 1800,
      accessLevel: 'free'
    },
    {
      id: 'blunder-preventer',
      title: 'Blunder Preventer',
      description: 'Sharpen your decision-making by choosing between good moves and blunders.',
      icon: <AlertTriangle className="w-8 h-8" />,
      difficulty: 'All Levels',
      duration: '10-25 min',
      color: 'from-red-500 to-red-600',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/20',
      link: '/blunder-preventer-intro',
      category: 'Decision Making',
      rating: 4.6,
      students: 1400,
      accessLevel: 'premium'
    },
    {
      id: 'openings',
      title: 'Openings',
      description: 'Build and review your opening repertoire with structured lines.',
      icon: <Brain className="w-8 h-8" />,
      difficulty: 'All Levels',
      duration: '15-45 min',
      color: 'from-emerald-500 to-teal-600',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/20',
      link: '/openings',
      category: 'Openings',
      rating: 4.7,
      students: 1800,
      accessLevel: 'freemium'
    },
    {
      id: 'puzzle-trainer',
      title: 'Puzzle Trainer',
      description: 'Master tactical patterns with themed puzzles and adaptive difficulty.',
      icon: <Puzzle className="w-8 h-8" />,
      difficulty: 'All Levels',
      duration: '10-30 min',
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20',
      link: '/puzzle-trainer-intro',
      category: 'Tactics',
      rating: 4.9,
      students: 2100,
      accessLevel: 'freemium'
    },
    {
      id: 'endgame-mastery',
      title: 'Endgame Mastery',
      description: 'Perfect your endgame technique with practical positions and instant feedback.',
      icon: <Target className="w-8 h-8" />,
      difficulty: 'Intermediate+',
      duration: '15-45 min',
      color: 'from-indigo-500 to-indigo-600',
      bgColor: 'bg-indigo-500/10',
      borderColor: 'border-indigo-500/20',
      link: '/endgame-trainer-intro',
      category: 'Endgame',
      rating: 4.8,
      students: 1650,
      accessLevel: 'freemium'
    },
    {
      id: 'visualization-practice',
      title: 'Visualization Practice',
      description: 'Strengthen your board vision by memorizing positions without seeing pieces.',
      icon: <Eye className="w-8 h-8" />,
      difficulty: 'Intermediate+',
      duration: '10-30 min',
      color: 'from-yellow-500 to-orange-500',
      bgColor: 'bg-yellow-500/10',
      borderColor: 'border-yellow-500/20',
      link: '/practice-visualisation-intro',
      category: 'Visualization',
      rating: 4.5,
      students: 800,
      accessLevel: 'premium'
    },
    {
      id: 'puzzle-rush',
      title: 'Puzzle Rush',
      description: 'Solve puzzles against the clock with 3min and 5min modes.',
      icon: <Zap className="w-8 h-8" />,
      difficulty: 'All Levels',
      duration: '5-15 min',
      color: 'from-yellow-500 to-orange-600',
      bgColor: 'bg-yellow-500/10',
      borderColor: 'border-yellow-500/20',
      link: '/puzzle-rush-intro',
      category: 'Speed',
      rating: 4.8,
      students: 1250,
      accessLevel: 'freemium'
    },
    {
      id: 'play-with-bot',
      title: 'Play with Bot',
      description: 'Challenge AI opponents with customizable difficulty and personalities.',
      icon: <Bot className="w-8 h-8" />,
      difficulty: 'All Levels',
      duration: '10-60 min',
      color: 'from-blue-500 to-cyan-600',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20',
      link: '/play-with-bot-intro',
      category: 'Practice',
      rating: 4.8,
      students: 2000,
      accessLevel: 'free'
    },
    {
      id: 'advantage-conversion',
      title: 'Advantage Conversion',
      description: 'Learn to convert winning positions into decisive victories against the engine.',
      icon: <Target className="w-8 h-8" />,
      difficulty: 'Intermediate+',
      duration: '15-35 min',
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/20',
      link: '/advantage-capitalisation-intro',
      category: 'Endgame',
      rating: 4.6,
      students: 1100,
      accessLevel: 'premium'
    },
    {
      id: 'master-games',
      title: 'Master Games',
      description: 'Study brilliancies by guessing the next move in legendary chess games.',
      icon: <Play className="w-8 h-8" />,
      difficulty: 'All Levels',
      duration: '15-40 min',
      color: 'from-pink-500 to-pink-600',
      bgColor: 'bg-pink-500/10',
      borderColor: 'border-pink-500/20',
      link: '/guess-the-move-intro',
      category: 'Study',
      rating: 4.7,
      students: 1200,
      accessLevel: 'freemium'
    },
    {
      id: '40-game-report',
      title: '40-Game Report',
      description: 'Get detailed performance insights from your recent games across platforms.',
      icon: <TrendingUp className="w-8 h-8" />,
      difficulty: 'All Levels',
      duration: '5-10 min',
      color: 'from-emerald-500 to-teal-600',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/20',
      link: '/report/40',
      category: 'Analysis',
      rating: 4.9,
      students: 1500,
      accessLevel: 'freemium'
    }
  ];

  const categories = [...new Set(trainingModules.map(module => module.category))];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <Zap className="w-12 h-12 text-yellow-400" />
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold bg-gradient-to-r from-blue-400 via-teal-500 to-cyan-500 bg-clip-text text-transparent">
              Training Modules
            </h1>
          </div>
          <p className="text-xl sm:text-2xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
            Master every aspect of chess with our comprehensive training system
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

        {/* Stats */}
        <div className="mb-16 grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
          <div className="bg-gradient-to-br from-blue-600/20 to-blue-800/20 backdrop-blur-sm border border-blue-500/30 rounded-2xl p-6 text-center">
            <div className="text-4xl font-bold text-blue-400 mb-2">{trainingModules.length}</div>
            <div className="text-gray-300">Training Modules</div>
          </div>
          <div className="bg-gradient-to-br from-teal-600/20 to-teal-800/20 backdrop-blur-sm border border-teal-500/30 rounded-2xl p-6 text-center">
            <div className="text-4xl font-bold text-teal-400 mb-2">{categories.length}</div>
            <div className="text-gray-300">Categories</div>
          </div>
        </div>

        {/* Training Modules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {trainingModules.map((module) => (
            <Link
              key={module.id}
              to={module.link}
              className="group block relative bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-3xl p-8 hover:border-blue-500/50 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/20"
            >
              {/* Access Level Badge with Lock Icon */}
              {(module.accessLevel === 'premium' || module.accessLevel === 'freemium') && !isPremium && (
                <div className="absolute top-3 left-3 flex items-center gap-1.5 z-20 px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 backdrop-blur-sm rounded-lg shadow-xl border-2 border-amber-300">
                  <Lock className="w-5 h-5 text-white" strokeWidth={2.5} />
                  <span className="text-xs font-bold text-white uppercase tracking-wide">
                    {module.accessLevel === 'freemium' ? 'Freemium' : 'Premium'}
                  </span>
                </div>
              )}
              
              {/* Category Badge */}
              <div className="absolute top-4 right-4">
                <span className="text-xs font-semibold px-3 py-1 bg-white/10 backdrop-blur-sm rounded-full text-gray-300">
                  {module.category}
                </span>
              </div>

              {/* Icon */}
              <div className={`mb-6 p-4 rounded-2xl bg-gradient-to-r ${module.color} text-white w-fit group-hover:scale-110 transition-transform duration-300`}>
                {module.icon}
              </div>

              {/* Content */}
              <h3 className="text-2xl font-bold mb-3 text-white group-hover:text-blue-200 transition-colors">
                {module.title}
              </h3>
              <p className="text-gray-300 mb-6 leading-relaxed">
                {module.description}
              </p>

              {/* Action Button */}
              <div className="flex items-center justify-between">
                <span className="text-blue-400 group-hover:text-blue-300 transition-colors font-medium">
                  Start Training
                </span>
                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-white group-hover:translate-x-1 transition-all duration-200" />
              </div>

              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-teal-600/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            </Link>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-20 text-center">
          <div className="bg-gradient-to-r from-slate-800/50 to-blue-900/30 backdrop-blur-sm border border-blue-500/20 rounded-2xl p-8 max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-4 text-white">Ready to Level Up Your Chess?</h2>
            <p className="text-gray-300 mb-6">
              Combine multiple training methods for maximum improvement. Track your progress and watch your rating soar!
            </p>
            <Link
              to="/profile"
              className="inline-block bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
            >
              View My Progress
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LessonsPage;