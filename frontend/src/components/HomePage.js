import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const HomePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleGetStarted = () => {
    if (user) {
      navigate('/training-room');
    } else {
      navigate('/login');
    }
  };

  const handleTryNow = () => {
    if (user) {
      navigate('/puzzles/fork');
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('/hero-chess-image.png?v=2')`
          }}
        />
        
        {/* Overlay for better text readability */}
        <div className="absolute inset-0 bg-black bg-opacity-40"></div>
        
        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-6xl md:text-8xl font-bold mb-6 bg-gradient-to-r from-white via-yellow-200 to-orange-300 bg-clip-text text-transparent drop-shadow-2xl">
            MASTER THE GAME
          </h1>
          <h2 className="text-4xl md:text-6xl font-bold mb-8 bg-gradient-to-r from-blue-200 via-teal-200 to-cyan-200 bg-clip-text text-transparent drop-shadow-xl">
            UNLOCK YOUR POTENTIAL
          </h2>
          <div className="text-2xl md:text-3xl font-semibold mb-12 text-white drop-shadow-lg">
            <div className="mb-2">Strive. improve. Win</div>
          </div>
          <p className="text-xl md:text-2xl text-gray-200 mb-12 max-w-4xl mx-auto drop-shadow-lg">
            Improve faster with personalized chess training, analytics, and lessons designed specifically for your skill level and weaknesses.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <button
              onClick={handleGetStarted}
              className="bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700 text-white px-10 py-5 rounded-xl text-xl font-bold transition-all duration-300 transform hover:scale-105 shadow-2xl flex items-center justify-center"
            >
              <span className="mr-3 text-2xl">▶</span>
              Get Started
            </button>
            <button
              onClick={handleTryNow}
              className="border-3 border-white text-white hover:bg-white hover:text-gray-900 px-10 py-5 rounded-xl text-xl font-bold transition-all duration-300 transform hover:scale-105 shadow-2xl backdrop-blur-sm"
            >
              Try Free Puzzles
            </button>
          </div>
        </div>
      </section>

      {/* Problem Statement */}
      <section className="py-20 bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Chess Strive: A Love Story</h2>
            <p className="text-xl text-gray-300 max-w-4xl mx-auto">
              Every chess player dreams of reaching their peak rating. But what if you could see exactly what's holding you back? 
              Chess Strive uses advanced analytics to identify your weaknesses and provides personalized training to help you improve faster.
            </p>
          </div>
        </div>
      </section>

      {/* See What's Holding You Back */}
      <section className="py-20 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">See what's holding you back from your peak rating</h2>
            <p className="text-xl text-gray-300 max-w-4xl mx-auto">
              Chess Strive analyzes your games and measures your skills across six core aspects of chess, 
              comparing you to players at the same rating level.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: "🎯", title: "Tactics", desc: "Pattern recognition and calculation" },
              { icon: "🏆", title: "Endgame", desc: "King and pawn endgames" },
              { icon: "⚡", title: "Advantage Capitalization", desc: "Converting winning positions" },
              { icon: "🧠", title: "Resourcefulness", desc: "Finding creative solutions" },
              { icon: "⏰", title: "Time Management", desc: "Using time effectively" },
              { icon: "📚", title: "Opening Performance", desc: "Early game preparation" }
            ].map((skill, index) => (
              <div key={index} className="bg-gray-800 p-6 rounded-lg border border-gray-700 hover:border-teal-500 transition-colors">
                <div className="text-4xl mb-4">{skill.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{skill.title}</h3>
                <p className="text-gray-400">{skill.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Improve Faster */}
      <section className="py-20 bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Improve faster with personalized lessons built for you</h2>
            <p className="text-xl text-gray-300 max-w-4xl mx-auto">
              Chess Strive creates personalized training modules based on your weaknesses, 
              featuring puzzles and lessons created by grandmasters and coaches.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: "⚡", title: "Advantage Capitalization Trainer", desc: "Learn to convert winning positions" },
              { icon: "📚", title: "Opening Improver", desc: "Master your opening repertoire" },
              { icon: "👁️", title: "Practice Visualization", desc: "Improve board visualization skills" },
              { icon: "🛡️", title: "Blunder Preventer", desc: "Avoid common mistakes" },
              { icon: "🎯", title: "360 Trainer", desc: "Comprehensive tactical training" },
              { icon: "🧠", title: "Intuition Trainer", desc: "Develop chess intuition" },
              { icon: "🏆", title: "Tactics", desc: "Pattern recognition puzzles" },
              { icon: "🔄", title: "Retry Mistakes", desc: "Learn from your errors" },
              { icon: "👑", title: "Endgame", desc: "Master endgame techniques" },
              { icon: "🛡️", title: "Defender", desc: "Defensive skills training" },
              { icon: "⏰", title: "Time Trainer", desc: "Time management practice" },
              { icon: "👁️", title: "Blindfold Tactics", desc: "Advanced visualization" },
              { icon: "🎯", title: "Checkmate Patterns", desc: "Essential mating patterns" }
            ].map((module, index) => (
              <div key={index} className="bg-gray-900 p-6 rounded-lg border border-gray-700 hover:border-teal-500 transition-colors">
                <div className="text-3xl mb-4">{module.icon}</div>
                <h3 className="text-lg font-semibold mb-2">{module.title}</h3>
                <p className="text-gray-400 text-sm">{module.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Train Smarter */}
      <section className="py-20 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">Train smarter with a Personalized Study Plan</h2>
          <p className="text-xl text-gray-300 mb-8 max-w-4xl mx-auto">
            Chess Strive creates a personalized study plan each week, focusing on your specific weaknesses.
          </p>
          <div className="bg-teal-900 bg-opacity-50 p-8 rounded-lg border border-teal-500">
            <h3 className="text-2xl font-bold mb-4">Research-Backed Results</h3>
            <p className="text-lg text-gray-300 mb-4">
              Chess Strive personalized puzzles increase your rating 31% faster than standard tactics puzzles
            </p>
            <p className="text-sm text-gray-400">
              Research conducted by the University of British Columbia
            </p>
          </div>
        </div>
      </section>

      {/* Testimonial */}
      <section className="py-20 bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">A chess coach's dream</h2>
          <p className="text-xl text-gray-300 mb-8 max-w-4xl mx-auto">
            "Chess Strive reduces preparation time and improves session productivity. 
            It's exactly what every chess coach needs."
          </p>
          <p className="text-lg text-teal-400 font-semibold mb-8">- GM Ankit Rajpara</p>
          <button
            onClick={() => navigate('/contact')}
            className="bg-teal-600 hover:bg-teal-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-colors"
          >
            Contact us to get started
          </button>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Pricing</h2>
            <p className="text-xl text-gray-300">Choose the plan that's right for you</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Free Plan */}
            <div className="bg-gray-800 p-8 rounded-lg border border-gray-700">
              <h3 className="text-2xl font-bold mb-4">Standard</h3>
              <div className="text-4xl font-bold mb-6">Free</div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center">
                  <span className="text-green-500 mr-3">✓</span>
                  One 40-game analysis report per month
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-3">✓</span>
                  Weekly study plan
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-3">✓</span>
                  Daily training puzzles
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-3">✓</span>
                  Basic analytics
                </li>
              </ul>
              <button
                onClick={handleGetStarted}
                className="w-full bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-lg font-semibold transition-colors"
              >
                Get Started
              </button>
            </div>

            {/* Premium Plan */}
            <div className="bg-teal-900 bg-opacity-50 p-8 rounded-lg border-2 border-teal-500 relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-teal-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                  Most Popular
                </span>
              </div>
              <h3 className="text-2xl font-bold mb-4">Premium</h3>
              <div className="text-4xl font-bold mb-6">$7.99<span className="text-lg text-gray-400">/month</span></div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center">
                  <span className="text-green-500 mr-3">✓</span>
                  Unlimited analysis reports
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-3">✓</span>
                  Deeper analytics and insights
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-3">✓</span>
                  Unlimited training
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-3">✓</span>
                  Track multiple accounts
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-3">✓</span>
                  Priority support
                </li>
              </ul>
              <button
                onClick={handleGetStarted}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white py-3 rounded-lg font-semibold transition-colors"
              >
                Start Premium
              </button>
            </div>

            {/* Annual Plan */}
            <div className="bg-gray-800 p-8 rounded-lg border border-gray-700">
              <h3 className="text-2xl font-bold mb-4">Annual Premium</h3>
              <div className="text-4xl font-bold mb-6">$4.85<span className="text-lg text-gray-400">/month</span></div>
              <div className="text-sm text-gray-400 mb-6">Billed annually ($58.20)</div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center">
                  <span className="text-green-500 mr-3">✓</span>
                  All Premium features
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-3">✓</span>
                  40% savings
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-3">✓</span>
                  Priority support
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-3">✓</span>
                  Early access to new features
                </li>
              </ul>
              <button
                onClick={handleGetStarted}
                className="w-full bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-lg font-semibold transition-colors"
              >
                Start Annual
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-gray-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Frequently Asked Questions</h2>
          </div>
          
          <div className="space-y-6">
            {[
              {
                q: "How is Chess Strive different from Stockfish?",
                a: "Chess Strive focuses on human learning and improvement, while Stockfish is an engine for analysis. Chess Strive provides personalized training based on your weaknesses."
              },
              {
                q: "Why isn't Chess Strive Premium free?",
                a: "Premium features require significant computational resources and advanced analytics. The free tier provides excellent value for casual players."
              },
              {
                q: "What payment types do you accept?",
                a: "We accept all major credit cards, PayPal, and other secure payment methods."
              },
              {
                q: "Can you add XYZ feature to Chess Strive?",
                a: "We're always working on new features! Contact us with your suggestions and we'll consider them for future updates."
              }
            ].map((faq, index) => (
              <div key={index} className="bg-gray-900 p-6 rounded-lg">
                <h3 className="text-lg font-semibold mb-3">{faq.q}</h3>
                <p className="text-gray-300">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
};

export default HomePage;