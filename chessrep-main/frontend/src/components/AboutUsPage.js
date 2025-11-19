import React from 'react';
import Icons8Icons from './Icons8Icons';
import Footer from './Footer';

const AboutUsPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 text-white">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            About ChessStrive
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 max-w-4xl mx-auto">
            Empowering chess players to reach their full potential through intelligent training and personalized learning experiences.
          </p>
        </div>

        {/* Mission Section */}
        <div className="mb-16">
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 md:p-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-center">Our Mission</h2>
            <p className="text-lg md:text-xl text-gray-300 text-center max-w-4xl mx-auto leading-relaxed">
              To democratize chess education by providing world-class training tools, personalized learning paths, 
              and intelligent analysis that adapts to each player's unique strengths and weaknesses. We believe 
              that every chess player, regardless of their current level, deserves access to the same quality 
              of training that grandmasters use.
            </p>
          </div>
        </div>

        {/* Story Section */}
        <div className="mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center">Our Story</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8">
              <h3 className="text-2xl font-bold mb-4 text-blue-400">The Beginning</h3>
              <p className="text-gray-300 leading-relaxed">
                ChessStrive was born from a simple observation: traditional chess training methods often fail to 
                address individual learning patterns and weaknesses. Our founders, passionate chess players and 
                software engineers, recognized the need for a more personalized approach to chess improvement.
              </p>
            </div>
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8">
              <h3 className="text-2xl font-bold mb-4 text-purple-400">The Innovation</h3>
              <p className="text-gray-300 leading-relaxed">
                We developed advanced algorithms that analyze playing patterns, identify specific weaknesses, 
                and create targeted training programs. Our AI-powered system learns from millions of games 
                to provide insights that were previously only available to professional players.
              </p>
            </div>
          </div>
        </div>

        {/* Values Section */}
        <div className="mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center">Our Values</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                <Icons8Icons.Target className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-4 text-blue-400">Precision</h3>
              <p className="text-gray-300">
                Every training module is designed with surgical precision to target specific weaknesses and maximize improvement.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                <Icons8Icons.Zap className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-4 text-purple-400">Innovation</h3>
              <p className="text-gray-300">
                We continuously push the boundaries of chess education technology to stay ahead of the curve.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-green-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                <Icons8Icons.Users className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-4 text-green-400">Community</h3>
              <p className="text-gray-300">
                We believe in building a supportive community where players can learn, grow, and compete together.
              </p>
            </div>
          </div>
        </div>

        {/* Team Section */}
        <div className="mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center">Meet Our Team</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 text-center">
              <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mx-auto mb-4 flex items-center justify-center text-2xl font-bold">
                AI
              </div>
              <h3 className="text-xl font-bold mb-2">AI Research Team</h3>
              <p className="text-gray-400">Machine Learning Engineers</p>
              <p className="text-gray-300 text-sm mt-2">
                Developing cutting-edge algorithms for chess analysis and personalized training.
              </p>
            </div>
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 text-center">
              <div className="w-24 h-24 bg-gradient-to-r from-green-500 to-blue-500 rounded-full mx-auto mb-4 flex items-center justify-center text-2xl font-bold">
                GM
              </div>
              <h3 className="text-xl font-bold mb-2">Chess Masters</h3>
              <p className="text-gray-400">Grandmasters & Coaches</p>
              <p className="text-gray-300 text-sm mt-2">
                Providing expert knowledge and validation for our training methodologies.
              </p>
            </div>
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 text-center">
              <div className="w-24 h-24 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mx-auto mb-4 flex items-center justify-center text-2xl font-bold">
                DEV
              </div>
              <h3 className="text-xl font-bold mb-2">Development Team</h3>
              <p className="text-gray-400">Software Engineers</p>
              <p className="text-gray-300 text-sm mt-2">
                Building intuitive and powerful user experiences for chess training.
              </p>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center">Our Impact</h2>
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-400 mb-2">10K+</div>
              <p className="text-gray-300">Active Players</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-purple-400 mb-2">1M+</div>
              <p className="text-gray-300">Puzzles Solved</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-green-400 mb-2">500+</div>
              <p className="text-gray-300">Rating Points Improved</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-yellow-400 mb-2">24/7</div>
              <p className="text-gray-300">Available Training</p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 md:p-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Start Your Journey?</h2>
            <p className="text-xl text-gray-200 mb-8 max-w-2xl mx-auto">
              Join thousands of players who are already improving their game with ChessStrive's intelligent training system.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-white text-blue-600 px-8 py-4 rounded-xl font-bold text-lg hover:bg-gray-100 transition-colors">
                Start Training Now
              </button>
              <button className="border-2 border-white text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-white hover:text-blue-600 transition-colors">
                View Pricing
              </button>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default AboutUsPage;
