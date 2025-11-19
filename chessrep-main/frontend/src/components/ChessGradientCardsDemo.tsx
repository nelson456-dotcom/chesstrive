import React from "react";
import { GradientCard } from "./ui/gradient-card";
import Icons8Icons from "./Icons8Icons";
import Footer from "./Footer";

// Chess training modules data
const chessModules = [
  {
    id: 1,
    title: "Tactical Training",
    description: "Master chess tactics with puzzles, combinations, and pattern recognition to improve your tactical vision",
    icon: <Icons8Icons.Target className="h-8 w-8" />,
    color: "rgba(172, 92, 255, 0.7)",
    link: "/puzzle-rush-intro"
  },
  {
    id: 2,
    title: "Endgame Mastery",
    description: "Learn essential endgame techniques, king and pawn endings, and theoretical positions",
    icon: <Icons8Icons.Trophy className="h-8 w-8" />,
    color: "rgba(56, 189, 248, 0.7)",
    link: "/endgame-trainer-intro"
  },
  {
    id: 3,
    title: "Opening Theory",
    description: "Study chess openings, build your repertoire, and understand opening principles",
    icon: <Icons8Icons.BookOpen className="h-8 w-8" />,
    color: "rgba(161, 58, 229, 0.7)",
    link: "/openings"
  },
  {
    id: 4,
    title: "Blunder Prevention",
    description: "Identify and avoid common mistakes, improve calculation, and develop better decision-making",
    icon: <Icons8Icons.Shield className="h-8 w-8" />,
    color: "rgba(79, 70, 229, 0.7)",
    link: "/blunder-preventer-intro"
  },
  {
    id: 5,
    title: "Bot Training",
    description: "Practice against AI opponents of varying strengths to improve your overall game",
    icon: <Icons8Icons.Brain className="h-8 w-8" />,
    color: "rgba(138, 58, 185, 0.7)",
    link: "/play-with-bot-intro"
  },
  {
    id: 6,
    title: "Advantage Conversion",
    description: "Learn to convert winning positions and capitalize on your advantages effectively",
    icon: <Icons8Icons.Zap className="h-8 w-8" />,
    color: "rgba(99, 102, 241, 0.7)",
    link: "/advantage-capitalisation-intro"
  },
  {
    id: 7,
    title: "Defender",
    description: "Master defensive chess techniques and learn to protect your position from threats",
    icon: <Icons8Icons.Shield className="h-8 w-8" />,
    color: "rgba(139, 92, 246, 0.7)",
    link: "/defender-intro"
  },
  {
    id: 8,
    title: "Tactical Puzzles",
    description: "Master tactical patterns with carefully curated puzzles for your skill level",
    icon: <Icons8Icons.Target className="h-8 w-8" />,
    color: "rgba(59, 130, 246, 0.7)",
    link: "/puzzle-trainer-intro"
  },
  {
    id: 8,
    title: "Guess the Move",
    description: "Study master games by predicting the best moves in famous positions",
    icon: <Icons8Icons.Eye className="h-8 w-8" />,
    color: "rgba(99, 102, 241, 0.7)",
    link: "/guess-the-move-intro"
  },
  {
    id: 9,
    title: "Visualization Training",
    description: "Improve your ability to calculate and visualize moves in your head",
    icon: <Icons8Icons.RefreshCw className="h-8 w-8" />,
    color: "rgba(139, 92, 246, 0.7)",
    link: "/practice-visualisation-intro"
  },
  {
    id: 10,
    title: "40 Game Analysis",
    description: "Get detailed analysis of your last 40 games with personalized insights and improvement suggestions",
    icon: <Icons8Icons.BarChart3 className="h-8 w-8" />,
    color: "rgba(249, 115, 22, 0.7)",
    link: "/report/40"
  },
  {
    id: 12,
    title: "Chess Analysis Board",
    description: "Interactive chess analysis board with engine suggestions, position evaluation, and move analysis",
    icon: <Icons8Icons.BarChart3 className="h-8 w-8" />,
    color: "rgba(34, 197, 94, 0.7)",
    link: "/chess-analysis-board"
  }
];

// Custom GradientCard component for chess modules
const ChessGradientCard = ({ module }) => {
  return (
    <div className="w-full max-w-sm mx-auto">
      <a 
        href={module.link}
        className="block relative rounded-[32px] overflow-hidden bg-gray-900 border border-gray-800 hover:border-purple-500 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/20 group"
      >
        {/* Card content */}
        <div className="relative flex flex-col h-full p-8">
              {/* Icon circle */}
              <div className="w-12 h-12 rounded-full flex items-center justify-center mb-6 bg-gradient-to-br from-purple-600 to-blue-600 group-hover:scale-110 transition-transform duration-300 text-white">
                {module.icon}
              </div>

          {/* Content */}
          <div className="mb-auto">
            <h3 className="text-2xl font-medium text-white mb-3 group-hover:text-purple-200 transition-colors">
              {module.title}
            </h3>
            <p className="text-sm mb-6 text-gray-300 leading-relaxed group-hover:text-gray-200 transition-colors">
              {module.description}
            </p>

            {/* Start Training indicator */}
            <div className="inline-flex items-center text-white text-sm font-medium group-hover:text-purple-400 transition-colors">
              Start Training
              <svg
                className="ml-1 w-4 h-4 group-hover:translate-x-1 transition-transform"
                width="8"
                height="8"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M1 8H15M15 8L8 1M15 8L8 15"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Gradient overlay */}
        <div 
          className="absolute bottom-0 left-0 right-0 h-2/3 opacity-20 pointer-events-none"
          style={{
            background: `radial-gradient(circle at bottom center, ${module.color} -20%, rgba(79, 70, 229, 0) 60%)`,
            filter: "blur(45px)",
          }}
        />

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/5 to-blue-600/5 rounded-[32px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      </a>
    </div>
  );
};

export const ChessGradientCardsDemo = () => {
  return (
    <div className="min-h-screen bg-gray-900 py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-white mb-4">
            Chess Training Modules
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Master every aspect of chess with our comprehensive training suite. 
            From tactics to endgames, we've got you covered with {chessModules.length} training modules.
          </p>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {chessModules.map((module) => (
            <ChessGradientCard key={module.id} module={module} />
          ))}
        </div>

        {/* Call to Action */}
        <div className="text-center mt-16 mb-24">
          <p className="text-gray-400 mb-6">
            Ready to elevate your chess game?
          </p>
          <a
            href="/"
            className="inline-flex items-center px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-300"
          >
            Get Started Today
            <svg
              className="ml-2 w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
          </a>
        </div>
      </div>
      <Footer />
    </div>
  );
};
