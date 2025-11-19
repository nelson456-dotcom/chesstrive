import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Zap, 
  Puzzle, 
  Brain, 
  Crown, 
  Shield, 
  Target, 
  Eye, 
  Bot, 
  BarChart3,
  TrendingUp,
  ChevronRight,
  Clock,
  Users,
  Star,
  Gamepad2
} from 'lucide-react';

const LessonsPage = () => {
  const trainingModules = [
    {
      id: 'puzzle-rush',
      title: 'Puzzle Rush',
      description: 'Solve puzzles against the clock to improve your tactical vision and speed.',
      icon: <Zap className="w-8 h-8" />,
      difficulty: 'All Levels',
      duration: '5-15 min',
      color: 'from-yellow-500 to-orange-500',
      bgColor: 'bg-yellow-500/10',
      borderColor: 'border-yellow-500/20',
      link: '/puzzle-rush-intro',
      category: 'Tactics',
      rating: 4.8,
      students: 1250
    },
    {
      id: 'tactical-puzzles',
      title: 'Tactical Puzzles',
      description: 'Master tactical patterns with carefully curated puzzles for your skill level.',
      icon: <Puzzle className="w-8 h-8" />,
      difficulty: 'All Levels',
      duration: '10-30 min',
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20',
      link: '/puzzle-trainer-intro',
      category: 'Tactics',
      rating: 4.9,
      students: 2100
    },
    {
      id: 'openings',
      title: 'Openings',
      description: 'Build and review your opening repertoire with structured lines.',
      icon: <Brain className="w-8 h-8" />,
      difficulty: 'All Levels',
      duration: '15-45 min',
      color: 'from-emerald-500 to-teal-500',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/20',
      link: '/openings',
      category: 'Openings',
      rating: 4.7,
      students: 1800
    },
    {
      id: 'endgame-trainer',
      title: 'Endgame Trainer',
      description: 'Learn essential endgame techniques and patterns to finish games strong.',
      icon: <Crown className="w-8 h-8" />,
      difficulty: 'Intermediate+',
      duration: '15-45 min',
      color: 'from-teal-500 to-cyan-500',
      bgColor: 'bg-teal-500/10',
      borderColor: 'border-teal-500/20',
      link: '/endgame-trainer-intro',
      category: 'Endgame',
      rating: 4.8,
      students: 1650
    },
    {
      id: 'blunder-preventer',
      title: 'Blunder Preventer',
      description: 'Identify and eliminate common mistakes that cost you games.',
      icon: <Shield className="w-8 h-8" />,
      difficulty: 'All Levels',
      duration: '10-25 min',
      color: 'from-red-500 to-rose-500',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/20',
      link: '/blunder-preventer-intro',
      category: 'Decision Making',
      rating: 4.6,
      students: 1400
    },
    {
      id: 'defender',
      title: 'Defender',
      description: 'Master defensive chess techniques and learn to protect your position from threats.',
      icon: <Shield className="w-8 h-8" />,
      difficulty: 'All Levels',
      duration: '10-30 min',
      color: 'from-indigo-500 to-purple-500',
      bgColor: 'bg-indigo-500/10',
      borderColor: 'border-indigo-500/20',
      link: '/defender',
      category: 'Defense',
      rating: 4.7,
      students: 1350
    },
    {
      id: 'positional-play',
      title: 'Positional Play',
      description: 'Develop your understanding of strategic concepts and positional play.',
      icon: <Gamepad2 className="w-8 h-8" />,
      difficulty: 'Advanced',
      duration: '20-60 min',
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/20',
      link: '/positional-trainer-intro',
      category: 'Strategy',
      rating: 4.9,
      students: 950
    },
    {
      id: 'guess-the-move',
      title: 'Guess the Move',
      description: 'Study master games by predicting the best moves in famous positions.',
      icon: <Target className="w-8 h-8" />,
      difficulty: 'All Levels',
      duration: '15-40 min',
      color: 'from-indigo-500 to-blue-500',
      bgColor: 'bg-indigo-500/10',
      borderColor: 'border-indigo-500/20',
      link: '/guess-the-move-intro',
      category: 'Master Games',
      rating: 4.7,
      students: 1200
    },
    {
      id: 'visualization',
      title: 'Visualization Training',
      description: 'Improve your ability to calculate and visualize moves in your head.',
      icon: <Eye className="w-8 h-8" />,
      difficulty: 'Intermediate+',
      duration: '10-30 min',
      color: 'from-violet-500 to-teal-500',
      bgColor: 'bg-violet-500/10',
      borderColor: 'border-violet-500/20',
      link: '/practice-visualisation-intro',
      category: 'Calculation',
      rating: 4.5,
      students: 800
    },
    {
      id: 'advantage-capitalization',
      title: 'Advantage Capitalization',
      description: 'Learn to convert advantages into wins with practical examples.',
      icon: <TrendingUp className="w-8 h-8" />,
      difficulty: 'Intermediate+',
      duration: '15-35 min',
      color: 'from-amber-500 to-yellow-500',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/20',
      link: '/advantage-capitalisation-intro',
      category: 'Strategy',
      rating: 4.6,
      students: 1100
    },
    {
      id: 'play-with-bot',
      title: 'Play with Bot',
      description: 'Practice against AI opponents of varying difficulty levels.',
      icon: <Bot className="w-8 h-8" />,
      difficulty: 'All Levels',
      duration: '10-60 min',
      color: 'from-cyan-500 to-blue-500',
      bgColor: 'bg-cyan-500/10',
      borderColor: 'border-cyan-500/20',
      link: '/play-with-bot-intro',
      category: 'Practice',
      rating: 4.8,
      students: 2000
    },
    {
      id: 'live-analysis',
      title: 'Live Analysis',
      description: 'Real-time analysis and practice with engine insights while you train.',
      icon: <BarChart3 className="w-8 h-8" />,
      difficulty: 'All Levels',
      duration: '15-45 min',
      color: 'from-teal-500 to-cyan-500',
      bgColor: 'bg-teal-500/10',
      borderColor: 'border-teal-500/20',
      link: '/live-analysis',
      category: 'Live Training',
      rating: 4.9,
      students: 1800
    }
  ];

  const categories = [...new Set(trainingModules.map(module => module.category))];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-teal-500 to-cyan-500 bg-clip-text text-transparent">
            Training Modules
          </h1>
          <p className="text-xl sm:text-2xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
            Master every aspect of chess with our comprehensive training system
          </p>
        </div>

        {/* Stats */}
        <div className="mb-16 grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-blue-600/20 to-blue-800/20 backdrop-blur-sm border border-blue-500/30 rounded-2xl p-6 text-center">
            <div className="text-4xl font-bold text-blue-400 mb-2">{trainingModules.length}</div>
            <div className="text-gray-300">Training Modules</div>
          </div>
          <div className="bg-gradient-to-br from-teal-600/20 to-teal-800/20 backdrop-blur-sm border border-teal-500/30 rounded-2xl p-6 text-center">
            <div className="text-4xl font-bold text-teal-400 mb-2">{categories.length}</div>
            <div className="text-gray-300">Categories</div>
          </div>
          <div className="bg-gradient-to-br from-pink-600/20 to-pink-800/20 backdrop-blur-sm border border-pink-500/30 rounded-2xl p-6 text-center">
            <div className="text-4xl font-bold text-pink-400 mb-2">
              {trainingModules.reduce((sum, module) => sum + module.students, 0).toLocaleString()}
            </div>
            <div className="text-gray-300">Active Students</div>
          </div>
        </div>

        {/* Training Modules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {trainingModules.map((module) => (
            <Link
              key={module.id}
              to={module.link}
              className="group block bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-3xl p-8 hover:border-blue-500/50 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/20"
            >
              {/* Category Badge */}
              <div className="mb-4">
                <span className="text-xs font-semibold text-blue-400 bg-blue-500/20 px-3 py-1 rounded-full">
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

              {/* Stats */}
              <div className="mb-6 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Difficulty:</span>
                  <span className="text-gray-300 font-medium">{module.difficulty}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Duration:</span>
                  <span className="text-gray-300 font-medium flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    {module.duration}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Rating:</span>
                  <span className="text-gray-300 font-medium flex items-center">
                    <Star className="w-4 h-4 mr-1 text-yellow-400" />
                    {module.rating}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Students:</span>
                  <span className="text-gray-300 font-medium flex items-center">
                    <Users className="w-4 h-4 mr-1" />
                    {module.students.toLocaleString()}
                  </span>
                </div>
              </div>

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
          <p className="text-gray-400 mb-4 text-lg">Ready to improve your chess?</p>
          <p className="text-sm text-gray-500">Choose a training module above to start your journey</p>
        </div>
      </div>
    </div>
  );
};

export default LessonsPage;