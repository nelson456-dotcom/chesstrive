import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ChessFeaturesSectionWithHoverEffectsDemo } from './ChessFeaturesSectionWithHoverEffectsDemo';
import ChessTestimonials from './ChessTestimonials';
import { ChessPricing } from './ChessPricing';
import Footer from './Footer';
import Icons8Icons from './Icons8Icons';

// Local sticky CTA component (defined before usage to avoid any temporal dead zone issues)
const StickyCta = ({ onStart }) => {
  const [visible, setVisible] = React.useState(true);
  React.useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > 300);
    };
    window.addEventListener('scroll', onScroll);
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  if (!visible) return null;
  return (
    <div className="fixed inset-x-0 bottom-4 z-50 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl rounded-2xl border border-purple-500/30 bg-gradient-to-r from-purple-900/80 to-blue-900/80 backdrop-blur text-white shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 gap-4">
          <div className="flex items-center gap-3">
            <div className="hidden sm:block">
              <Icons8Icons.Crown className="h-6 w-6 text-yellow-300" />
            </div>
            <div className="text-sm">
              <div className="font-semibold">Start improving today</div>
              <div className="text-gray-200">Personalized plan • Free to start • No card needed</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onStart}
              className="bg-white text-gray-900 font-semibold px-4 py-2 rounded-lg hover:bg-gray-100 transition"
            >
              Get Started Free
            </button>
            <button
              onClick={() => setVisible(false)}
              className="p-2 rounded-lg hover:bg-white/10 transition"
              aria-label="dismiss"
            >
              <Icons8Icons.ChevronRight className="h-5 w-5 text-gray-200" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const HomePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleGetStarted = () => {
    if (user) {
      navigate('/lessons');
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

  const handleGetStartedLessons = () => {
    navigate('/lessons');
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white overflow-x-hidden">

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
          <h2 className="text-4xl md:text-6xl font-bold mb-8 bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200 bg-clip-text text-transparent drop-shadow-xl">
            UNLOCK YOUR POTENTIAL
          </h2>
          <div className="text-2xl md:text-3xl font-semibold mb-6 text-white drop-shadow-lg">
            <div className="mb-2">STRATEGY. VISION. VICTORY.</div>
          </div>
          <p className="text-xl md:text-2xl text-gray-200 mb-6 max-w-4xl mx-auto drop-shadow-lg">
            Improve faster with personalized chess training, analytics, and lessons designed specifically for your skill level and weaknesses.
          </p>
          {/* Trust Bar / Social Proof */}
          <div className="flex flex-col items-center gap-3 mb-6">
            <div className="flex flex-wrap justify-center gap-3 text-sm text-gray-200">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 backdrop-blur">
                <Icons8Icons.Shield className="h-4 w-4 text-green-400" /> 30-day money-back guarantee
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 backdrop-blur">
                <Icons8Icons.Star className="h-4 w-4 text-yellow-400" /> Loved by 50,000+ players
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 backdrop-blur">
                <Icons8Icons.Zap className="h-4 w-4 text-blue-300" /> Start free — no card needed
              </span>
            </div>
            <div className="text-xs text-gray-300">“I gained 180 rating points in 8 weeks” — Verified user</div>
          </div>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <button
              onClick={handleGetStarted}
              className="group bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-10 py-5 rounded-xl text-xl font-bold transition-all duration-300 transform hover:scale-105 shadow-2xl flex items-center justify-center"
            >
              <Icons8Icons.Play className="mr-3 h-6 w-6 group-hover:translate-x-1 transition-transform" />
              Get Started
              <Icons8Icons.ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={handleTryNow}
              className="group border-2 border-white text-white hover:bg-white hover:text-gray-900 px-10 py-5 rounded-xl text-xl font-bold transition-all duration-300 transform hover:scale-105 shadow-2xl backdrop-blur-sm flex items-center justify-center"
            >
              <Icons8Icons.Target className="mr-3 h-6 w-6 group-hover:rotate-12 transition-transform" />
              Try Free Puzzles
            </button>
          </div>
          {/* Objection-busting microcopy */}
          <div className="mt-4 text-sm text-gray-200">
            Free to start • No credit card required • Cancel anytime
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-gray-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-10">How it works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: Icons8Icons.Eye,
                title: "Connect & Analyze",
                desc: "Import your games or play here. Our engine pinpoints your biggest improvement areas."
              },
              {
                icon: Icons8Icons.CheckCircle,
                title: "Get Your Plan",
                desc: "Receive a weekly study plan with targeted lessons and puzzles for your weaknesses."
              },
              {
                icon: Icons8Icons.TrendingUp,
                title: "Improve Fast",
                desc: "Track gains with clear metrics. Most players see progress in 2–4 weeks."
              }
            ].map((s, i) => (
              <div key={i} className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-purple-500 transition-colors">
                <s.icon className="h-8 w-8 text-purple-400 mb-3" />
                <h3 className="text-xl font-semibold mb-2">{s.title}</h3>
                <p className="text-gray-300">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      {/* Feature Grid Section */}
      <section className="bg-gray-800">
        <ChessFeaturesSectionWithHoverEffectsDemo />
      </section>

      {/* Problem Statement */}
      <section className="py-20 bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">ChessStrive: A Love Story</h2>
            <p className="text-xl text-gray-300 max-w-4xl mx-auto">
              Every chess player dreams of reaching their peak rating. But what if you could see exactly what's holding you back? 
              ChessStrive uses advanced analytics to identify your weaknesses and provides personalized training to help you improve faster.
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
              ChessStrive analyzes your games and measures your skills across six core aspects of chess, 
              comparing you to players at the same rating level.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: Icons8Icons.Target, title: "Tactics", desc: "Pattern recognition and calculation", color: "text-red-400" },
              { icon: Icons8Icons.Trophy, title: "Endgame", desc: "King and pawn endgames", color: "text-yellow-400" },
              { icon: Icons8Icons.Zap, title: "Advantage Capitalization", desc: "Converting winning positions", color: "text-blue-400" },
              { icon: Icons8Icons.Brain, title: "Resourcefulness", desc: "Finding creative solutions", color: "text-purple-400" },
              { icon: Icons8Icons.Clock, title: "Time Management", desc: "Using time effectively", color: "text-green-400" },
              { icon: Icons8Icons.BookOpen, title: "Opening Performance", desc: "Early game preparation", color: "text-orange-400" }
            ].map((skill, index) => (
              <div key={index} className="group bg-gray-800 p-6 rounded-lg border border-gray-700 hover:border-purple-500 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/20">
                <div className={`${skill.color} mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <skill.icon className="h-12 w-12" />
                </div>
                <h3 className="text-xl font-semibold mb-2 group-hover:text-white transition-colors">{skill.title}</h3>
                <p className="text-gray-400 group-hover:text-gray-300 transition-colors">{skill.desc}</p>
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
              ChessStrive creates personalized training modules based on your weaknesses, 
              featuring puzzles and lessons created by grandmasters and coaches.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Icons8Icons.Zap, title: "Advantage Capitalization Trainer", desc: "Learn to convert winning positions", color: "text-blue-400" },
              { icon: Icons8Icons.BookOpen, title: "Opening Improver", desc: "Master your opening repertoire", color: "text-orange-400" },
              { icon: Icons8Icons.Eye, title: "Practice Visualization", desc: "Improve board visualization skills", color: "text-purple-400" },
              { icon: Icons8Icons.Trophy, title: "Tactics", desc: "Pattern recognition puzzles", color: "text-yellow-400" },
              { icon: Icons8Icons.Crown, title: "Endgame", desc: "Master endgame techniques", color: "text-pink-400" },
              { icon: Icons8Icons.Clock, title: "Time Trainer", desc: "Time management practice", color: "text-amber-400" }
            ].map((module, index) => (
              <div key={index} className="group bg-gray-900 p-6 rounded-lg border border-gray-700 hover:border-purple-500 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/10 hover:-translate-y-1">
                <div className={`${module.color} mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <module.icon className="h-8 w-8" />
                </div>
                <h3 className="text-lg font-semibold mb-2 group-hover:text-white transition-colors">{module.title}</h3>
                <p className="text-gray-400 text-sm group-hover:text-gray-300 transition-colors">{module.desc}</p>
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
            ChessStrive creates a personalized study plan each week, focusing on your specific weaknesses.
          </p>
          <div className="bg-gradient-to-r from-purple-900 to-blue-900 bg-opacity-50 p-8 rounded-lg border border-purple-500 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500 opacity-10 rounded-full -translate-y-16 translate-x-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-500 opacity-10 rounded-full translate-y-12 -translate-x-12"></div>
            <div className="relative z-10">
              <div className="flex items-center mb-4">
                <Icons8Icons.TrendingUp className="h-8 w-8 text-purple-400 mr-3" />
                <h3 className="text-2xl font-bold">Research-Backed Results</h3>
              </div>
              <p className="text-lg text-gray-300 mb-4">
                ChessStrive personalized puzzles increase your rating 31% faster than standard tactics puzzles
              </p>
              <div className="flex items-center text-sm text-gray-400">
                <Icons8Icons.Award className="h-4 w-4 mr-2" />
                Research conducted by the University of British Columbia
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="py-20 bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Join Thousands of Chess Players</h2>
            <p className="text-xl text-gray-300 max-w-4xl mx-auto">
              ChessStrive is trusted by players worldwide to improve their game and reach new heights.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { number: "50K+", label: "Active Players", icon: Icons8Icons.Users, color: "text-blue-400" },
              { number: "2M+", label: "Puzzles Solved", icon: Icons8Icons.Target, color: "text-green-400" },
              { number: "95%", label: "Success Rate", icon: Icons8Icons.Trophy, color: "text-yellow-400" },
              { number: "24/7", label: "Available", icon: Icons8Icons.Clock, color: "text-purple-400" }
            ].map((stat, index) => (
              <div key={index} className="text-center group">
                <div className={`${stat.color} mb-4 group-hover:scale-110 transition-transform duration-300 flex justify-center`}>
                  <stat.icon className="h-12 w-12" />
                </div>
                <div className="text-4xl md:text-5xl font-bold text-white mb-2">{stat.number}</div>
                <div className="text-lg text-gray-300">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Showcase */}
      <section className="py-20 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Why Choose ChessStrive?</h2>
            <p className="text-xl text-gray-300 max-w-4xl mx-auto">
              Discover the features that make ChessStrive the ultimate chess training platform.
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              {[
                { icon: Icons8Icons.Brain, title: "AI-Powered Analysis", desc: "Advanced algorithms analyze your games and identify patterns in your play", color: "text-blue-400" },
                { icon: Icons8Icons.Target, title: "Personalized Training", desc: "Custom training modules designed specifically for your weaknesses", color: "text-green-400" },
                { icon: Icons8Icons.Trophy, title: "Progress Tracking", desc: "Monitor your improvement with detailed statistics and insights", color: "text-yellow-400" },
                { icon: Icons8Icons.Users, title: "Community Features", desc: "Connect with other players and share your chess journey", color: "text-purple-400" }
              ].map((feature, index) => (
                <div key={index} className="flex items-start space-x-4 group">
                  <div className={`${feature.color} group-hover:scale-110 transition-transform duration-300 flex-shrink-0`}>
                    <feature.icon className="h-8 w-8" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2 group-hover:text-white transition-colors">{feature.title}</h3>
                    <p className="text-gray-400 group-hover:text-gray-300 transition-colors">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="relative">
              <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl p-8 text-center">
                <Icons8Icons.Crown className="h-16 w-16 text-white mx-auto mb-6" />
                <h3 className="text-2xl font-bold text-white mb-4">Start Your Chess Journey Today</h3>
                <p className="text-blue-100 mb-6">Join thousands of players who are already improving their game with ChessStrive.</p>
                <button
                  onClick={handleGetStartedLessons}
                  className="bg-white text-blue-600 px-8 py-3 rounded-xl font-bold hover:bg-gray-100 transition-colors"
                >
                  Get Started Free
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <ChessTestimonials />

      {/* Pricing */}
      <section className="bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
          <div className="flex flex-col items-center text-center mb-6">
            <div className="inline-flex items-center gap-2 text-green-300 text-sm">
              <Icons8Icons.Shield className="h-5 w-5" />
              30-day money-back guarantee
            </div>
            <div className="inline-flex items-center gap-2 text-gray-300 text-xs mt-2">
              <Icons8Icons.CheckCircle className="h-4 w-4" />
              Secure checkout • Cancel anytime
            </div>
          </div>
        </div>
        <ChessPricing />
      </section>

      {/* FAQ */}
      <section className="py-20 bg-gray-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="flex justify-center mb-6">
              <div className="bg-purple-600 p-3 rounded-full">
                <Icons8Icons.Brain className="h-8 w-8 text-white" />
              </div>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Frequently Asked Questions</h2>
          </div>
          
          <div className="space-y-6">
            {[
              {
                q: "How is ChessStrive different from Stockfish?",
                a: "ChessStrive focuses on human learning and improvement, while Stockfish is an engine for analysis. ChessStrive provides personalized training based on your weaknesses."
              },
              {
                q: "Why isn't ChessStrive Premium free?",
                a: "Premium features require significant computational resources and advanced analytics. The free tier provides excellent value for casual players."
              },
              {
                q: "What payment types do you accept?",
                a: "We accept all major credit cards, PayPal, and other secure payment methods."
              },
              {
                q: "Can you add XYZ feature to ChessStrive?",
                a: "We're always working on new features! Contact us with your suggestions and we'll consider them for future updates."
              }
            ].map((faq, index) => (
              <div key={index} className="group bg-gray-900 p-6 rounded-lg border border-gray-700 hover:border-purple-500 transition-all duration-300 hover:shadow-lg">
                <h3 className="text-lg font-semibold mb-3 group-hover:text-white transition-colors flex items-center">
                  <Icons8Icons.ChevronRight className="h-5 w-5 mr-2 text-purple-400 group-hover:rotate-90 transition-transform" />
                  {faq.q}
                </h3>
                <p className="text-gray-300 group-hover:text-gray-200 transition-colors">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
      {/* Sticky CTA */}
      <StickyCta onStart={handleGetStartedLessons} />
    </div>
  );
};

export default HomePage;