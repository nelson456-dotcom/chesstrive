import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Puzzle, BarChart2, User, Brain, ShoppingCart, TrendingUp, ShieldCheck, AlertTriangle, EyeOff, Target } from 'lucide-react';

const features = [
  {
    title: 'Opening Trainer',
    description: 'Master chess openings with interactive boards, move-by-move guidance, and in-depth explanations. Visual arrows and real-time feedback help you learn efficiently.',
    icon: <BookOpen className="w-10 h-10 text-blue-400 mb-3" />
  },
  {
    title: 'Puzzle Solver',
    description: 'Sharpen your tactical skills with thousands of curated chess puzzles. Filter by theme and difficulty, and track your progress over time.',
    icon: <Puzzle className="w-10 h-10 text-teal-400 mb-3" />
  },
  {
    title: 'Live Analysis',
    description: 'Analyze your games with a powerful chess engine. See live evaluation scores, best move suggestions, and understand your mistakes instantly.',
    icon: <BarChart2 className="w-10 h-10 text-green-400 mb-3" />
  },
  {
    title: 'User Profiles & Stats',
    description: 'Monitor your chess growth with detailed statistics, personal bests, and a customizable profile.',
    icon: <User className="w-10 h-10 text-purple-400 mb-3" />
  },
  {
    title: 'Endgame Trainer',
    description: 'Practice practical endgames with instant move feedback and scoring.',
    icon: <Brain className="w-10 h-10 text-yellow-400 mb-3" />
  },
  {
    title: 'Endgame Training',
    description: 'Master endgame positions with specialized puzzles filtered by piece types and themes.',
    icon: <Target className="w-10 h-10 text-amber-400 mb-3" />
  },
  {
    title: 'Leaderboard',
    description: 'Climb the global puzzle rating ladder and compare yourself with other users.',
    icon: <BarChart2 className="w-10 h-10 text-green-300 mb-3" />
  }
];

const comingSoon = [
  {
    title: 'Blunder Review',
    description: 'Automatically detects your mistakes from uploaded games and turns them into personalized puzzles.',
    icon: <ShieldCheck className="w-10 h-10 text-red-400 mb-3" />
  },
  {
    title: 'Repertoire Builder',
    description: 'Build and manage your own opening repertoire. Get personalized recommendations and track your learning journey.',
    icon: <Brain className="w-10 h-10 text-yellow-400 mb-3" />
  },
  {
    title: 'Course Marketplace',
    description: 'Access premium courses from top chess coaches. Learn advanced strategies, endgames, and more.',
    icon: <ShoppingCart className="w-10 h-10 text-pink-400 mb-3" />
  },
  {
    title: 'Performance Dashboard',
    description: 'Track accuracy, time usage, and tactical weaknesses across all your games in one place.',
    icon: <TrendingUp className="w-10 h-10 text-blue-300 mb-3" />
  },
  {
    title: 'Blunder Preventer',
    description: 'Choose between a correct move and a blunder to sharpen tactical awareness.',
    icon: <AlertTriangle className="w-10 h-10 text-red-400 mb-3" />
  },
  {
    title: 'Practice Visualisation',
    description: 'Remember piece placement with the board hidden to improve calculation.',
    icon: <EyeOff className="w-10 h-10 text-yellow-400 mb-3" />
  },
  {
    title: 'Advantage Capitalisation',
    description: 'Convert winning positions against the engine within a move limit.',
    icon: <Target className="w-10 h-10 text-green-400 mb-3" />
  }
];

const whyChessRep = [
  {
    title: 'Cutting-Edge Tools',
    description: 'From live engine analysis to interactive opening trainers, Chessstive offers the most advanced tools for chess improvement.',
    icon: <TrendingUp className="w-8 h-8 text-blue-400" />
  },
  {
    title: 'Personalized Experience',
    description: 'Track your progress, set goals, and receive tailored recommendations based on your play and learning style.',
    icon: <User className="w-8 h-8 text-teal-400" />
  },
  {
    title: 'Secure & Reliable',
    description: 'Your data and progress are protected with industry-standard security and privacy practices.',
    icon: <ShieldCheck className="w-8 h-8 text-green-400" />
  }
];

const MainContent = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen text-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-cyan-600/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 py-20 sm:py-32">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold mb-6 tracking-tight">
              <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-green-400 bg-clip-text text-transparent">
                Chessstrive
              </span>
              <br />
              <span className="text-white text-3xl sm:text-4xl md:text-5xl lg:text-6xl">
                Master Chess Training
              </span>
            </h1>
            <p className="text-xl sm:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
              Elevate your chess game with cutting-edge training tools, tactical puzzles, opening mastery, and AI-powered analysis.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-6 mb-12">
              <button 
                onClick={() => navigate('/training-room')} 
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-2xl transition-all transform hover:scale-105 hover:shadow-blue-500/25"
              >
                Start Training Now
              </button>
              <button 
                onClick={() => navigate('/openings')} 
                className="bg-gradient-to-r from-cyan-500 to-teal-600 hover:from-cyan-600 hover:to-teal-700 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-2xl transition-all transform hover:scale-105 hover:shadow-cyan-500/25"
              >
                Learn Openings
              </button>
              <button 
                onClick={() => navigate('/puzzles')} 
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-2xl transition-all transform hover:scale-105 hover:shadow-green-500/25"
              >
                Solve Puzzles
              </button>
              <button 
                onClick={() => navigate('/endgame-trainer')} 
                className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-2xl transition-all transform hover:scale-105 hover:shadow-amber-500/25"
              >
                Endgame Training
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-white">Comprehensive Training Tools</h2>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">Everything you need to improve your chess game in one platform</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, idx) => (
            <div key={idx} className="group bg-gradient-to-br from-slate-800/50 to-blue-900/30 backdrop-blur-sm border border-blue-500/20 rounded-2xl shadow-xl p-8 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300 hover:scale-105 hover:border-blue-400/40">
              <div className="mb-6">{feature.icon}</div>
              <h3 className="text-xl font-bold mb-4 text-blue-300 group-hover:text-blue-200 transition-colors">{feature.title}</h3>
              <p className="text-gray-300 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Why ChessRep Section */}
      <div className="bg-gradient-to-r from-blue-900/30 to-cyan-900/30 backdrop-blur-sm border-y border-blue-500/20">
        <div className="max-w-7xl mx-auto px-4 py-20">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-cyan-300">Why Choose Chessstrive?</h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">The most advanced chess training platform</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {whyChessRep.map((item, idx) => (
              <div key={idx} className="text-center group">
                <div className="mb-6 flex justify-center">{item.icon}</div>
                <h3 className="text-xl font-bold mb-4 text-blue-200 group-hover:text-blue-100 transition-colors">{item.title}</h3>
                <p className="text-gray-300 leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Coming Soon Section */}
      <div className="max-w-7xl mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-yellow-300">Coming Soon</h2>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">Exciting new features in development</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {comingSoon.slice(0, 6).map((feature, idx) => (
            <div key={idx} className="group bg-gradient-to-br from-slate-800/30 to-yellow-900/20 backdrop-blur-sm border border-yellow-500/20 rounded-2xl shadow-xl p-8 hover:shadow-2xl hover:shadow-yellow-500/10 transition-all duration-300 hover:scale-105 hover:border-yellow-400/40">
              <div className="mb-6">{feature.icon}</div>
              <h3 className="text-xl font-bold mb-4 text-yellow-300 group-hover:text-yellow-200 transition-colors">{feature.title}</h3>
              <p className="text-gray-300 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MainContent; 
