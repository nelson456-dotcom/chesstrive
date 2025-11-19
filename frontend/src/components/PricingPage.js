import React from 'react';

const PricingPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 text-white">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Choose Your Plan
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 max-w-4xl mx-auto">
            Unlock your chess potential with our flexible pricing plans designed for every level of player.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {/* Free Plan */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold mb-2">Free</h3>
              <div className="text-4xl font-bold mb-2">$0</div>
              <p className="text-gray-400">Perfect for getting started</p>
            </div>
            <ul className="space-y-4 mb-8">
              <li className="flex items-center">
                <span className="text-green-400 mr-3">✓</span>
                <span>10 puzzles per day</span>
              </li>
              <li className="flex items-center">
                <span className="text-green-400 mr-3">✓</span>
                <span>Basic opening explorer</span>
              </li>
              <li className="flex items-center">
                <span className="text-green-400 mr-3">✓</span>
                <span>Game analysis (3 games)</span>
              </li>
              <li className="flex items-center">
                <span className="text-green-400 mr-3">✓</span>
                <span>Community leaderboard</span>
              </li>
              <li className="flex items-center">
                <span className="text-gray-500 mr-3">✗</span>
                <span className="text-gray-500">Advanced training modules</span>
              </li>
              <li className="flex items-center">
                <span className="text-gray-500 mr-3">✗</span>
                <span className="text-gray-500">Personalized coaching</span>
              </li>
            </ul>
            <button className="w-full bg-gray-700 text-white py-3 rounded-xl font-bold hover:bg-gray-600 transition-colors">
              Get Started Free
            </button>
          </div>

          {/* Pro Plan */}
          <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl p-8 border-2 border-blue-500 relative">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <span className="bg-yellow-400 text-black px-4 py-1 rounded-full text-sm font-bold">
                Most Popular
              </span>
            </div>
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold mb-2">Pro</h3>
              <div className="text-4xl font-bold mb-2">$19</div>
              <p className="text-blue-200">per month</p>
            </div>
            <ul className="space-y-4 mb-8">
              <li className="flex items-center">
                <span className="text-green-400 mr-3">✓</span>
                <span>Unlimited puzzles</span>
              </li>
              <li className="flex items-center">
                <span className="text-green-400 mr-3">✓</span>
                <span>Advanced opening explorer</span>
              </li>
              <li className="flex items-center">
                <span className="text-green-400 mr-3">✓</span>
                <span>Unlimited game analysis</span>
              </li>
              <li className="flex items-center">
                <span className="text-green-400 mr-3">✓</span>
                <span>All training modules</span>
              </li>
              <li className="flex items-center">
                <span className="text-green-400 mr-3">✓</span>
                <span>Progress tracking</span>
              </li>
              <li className="flex items-center">
                <span className="text-green-400 mr-3">✓</span>
                <span>Priority support</span>
              </li>
            </ul>
            <button className="w-full bg-white text-blue-600 py-3 rounded-xl font-bold hover:bg-gray-100 transition-colors">
              Start Pro Trial
            </button>
          </div>

          {/* Master Plan */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold mb-2">Master</h3>
              <div className="text-4xl font-bold mb-2">$49</div>
              <p className="text-gray-400">per month</p>
            </div>
            <ul className="space-y-4 mb-8">
              <li className="flex items-center">
                <span className="text-green-400 mr-3">✓</span>
                <span>Everything in Pro</span>
              </li>
              <li className="flex items-center">
                <span className="text-green-400 mr-3">✓</span>
                <span>Personalized coaching</span>
              </li>
              <li className="flex items-center">
                <span className="text-green-400 mr-3">✓</span>
                <span>Custom training plans</span>
              </li>
              <li className="flex items-center">
                <span className="text-green-400 mr-3">✓</span>
                <span>1-on-1 sessions</span>
              </li>
              <li className="flex items-center">
                <span className="text-green-400 mr-3">✓</span>
                <span>Advanced analytics</span>
              </li>
              <li className="flex items-center">
                <span className="text-green-400 mr-3">✓</span>
                <span>24/7 premium support</span>
              </li>
            </ul>
            <button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-xl font-bold hover:from-purple-700 hover:to-pink-700 transition-colors">
              Go Master
            </button>
          </div>
        </div>

        {/* Features Comparison */}
        <div className="mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center">Feature Comparison</h2>
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-4 px-4">Features</th>
                  <th className="text-center py-4 px-4">Free</th>
                  <th className="text-center py-4 px-4">Pro</th>
                  <th className="text-center py-4 px-4">Master</th>
                </tr>
              </thead>
              <tbody className="space-y-4">
                <tr className="border-b border-gray-700">
                  <td className="py-4 px-4">Daily Puzzles</td>
                  <td className="text-center py-4 px-4">10</td>
                  <td className="text-center py-4 px-4">Unlimited</td>
                  <td className="text-center py-4 px-4">Unlimited</td>
                </tr>
                <tr className="border-b border-gray-700">
                  <td className="py-4 px-4">Training Modules</td>
                  <td className="text-center py-4 px-4">Basic</td>
                  <td className="text-center py-4 px-4">All</td>
                  <td className="text-center py-4 px-4">All + Custom</td>
                </tr>
                <tr className="border-b border-gray-700">
                  <td className="py-4 px-4">Game Analysis</td>
                  <td className="text-center py-4 px-4">3 games</td>
                  <td className="text-center py-4 px-4">Unlimited</td>
                  <td className="text-center py-4 px-4">Unlimited</td>
                </tr>
                <tr className="border-b border-gray-700">
                  <td className="py-4 px-4">Personal Coach</td>
                  <td className="text-center py-4 px-4">✗</td>
                  <td className="text-center py-4 px-4">✗</td>
                  <td className="text-center py-4 px-4">✓</td>
                </tr>
                <tr className="border-b border-gray-700">
                  <td className="py-4 px-4">Progress Tracking</td>
                  <td className="text-center py-4 px-4">Basic</td>
                  <td className="text-center py-4 px-4">Advanced</td>
                  <td className="text-center py-4 px-4">Premium</td>
                </tr>
                <tr>
                  <td className="py-4 px-4">Support</td>
                  <td className="text-center py-4 px-4">Community</td>
                  <td className="text-center py-4 px-4">Priority</td>
                  <td className="text-center py-4 px-4">24/7 Premium</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center">Frequently Asked Questions</h2>
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6">
              <h3 className="text-xl font-bold mb-3">Can I change my plan anytime?</h3>
              <p className="text-gray-300">
                Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately, 
                and we'll prorate any billing differences.
              </p>
            </div>
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6">
              <h3 className="text-xl font-bold mb-3">Is there a free trial?</h3>
              <p className="text-gray-300">
                Yes! All paid plans come with a 14-day free trial. No credit card required to start your trial.
              </p>
            </div>
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6">
              <h3 className="text-xl font-bold mb-3">What payment methods do you accept?</h3>
              <p className="text-gray-300">
                We accept all major credit cards, PayPal, and bank transfers. All payments are processed securely.
              </p>
            </div>
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6">
              <h3 className="text-xl font-bold mb-3">Can I cancel anytime?</h3>
              <p className="text-gray-300">
                Absolutely! You can cancel your subscription at any time. You'll continue to have access 
                until the end of your current billing period.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 md:p-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Improve Your Game?</h2>
            <p className="text-xl text-gray-200 mb-8 max-w-2xl mx-auto">
              Join thousands of players who are already improving their chess with Chess Strive.
            </p>
            <button className="bg-white text-blue-600 px-8 py-4 rounded-xl font-bold text-lg hover:bg-gray-100 transition-colors">
              Start Your Free Trial
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingPage;
