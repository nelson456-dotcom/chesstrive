import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Crown, Check, Lock } from 'lucide-react';
import { stripeService } from '../services/stripeService';

const UpgradePage = () => {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('monthly');

  const plans = {
    monthly: {
      name: 'Monthly',
      price: 4.99,
      period: 'month',
      popular: false
    },
    yearly: {
      name: 'Yearly',
      price: 49.99,
      period: 'year',
      popular: true,
      savings: 'Save 17%'
    }
  };

  const premiumFeatures = [
    "Resourcefulness Training - Master defensive play",
    "Advantage Capitalisation - Convert winning positions",
    "Endgame Trainer - Perfect your endgame technique",
    "Blunder Preventer - Eliminate costly mistakes",
    "Unlimited Opening Explorer - Access all openings",
    "Advanced Analytics - Detailed performance insights",
    "Priority Support - Get help when you need it",
    "Ad-free Experience - Focus on your training"
  ];

  const handleUpgrade = async () => {
    if (!user) {
      navigate('/login', { state: { redirectTo: '/upgrade' } });
      return;
    }

    setLoading(true);
    try {
      // Use Stripe checkout flow
      const billingPeriod = selectedPlan; // 'monthly' or 'yearly'
      const response = await stripeService.createCheckoutSession('premium', billingPeriod);
      
      // Redirect to Stripe Checkout
      if (response.url) {
        window.location.href = response.url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error) {
      console.error('Upgrade error:', error);
      alert(error.message || 'Failed to start checkout. Please try again.');
      setLoading(false);
    }
  };

  if (user?.userType === 'premium') {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-gray-800 rounded-2xl shadow-2xl p-8 text-center">
          <Crown className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-white mb-4">You're Already Premium!</h1>
          <p className="text-gray-300 mb-6">
            You have full access to all premium features.
          </p>
          <button
            onClick={() => navigate('/')}
            className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full mb-4">
            <Crown className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-5xl font-bold text-white mb-4">
            Upgrade to Premium
          </h1>
          <p className="text-xl text-gray-300">
            Unlock all premium features and accelerate your chess improvement
          </p>
        </div>

        {/* Pricing Plans */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {Object.entries(plans).map(([key, plan]) => (
            <div
              key={key}
              className={`bg-gray-800 rounded-xl p-8 relative cursor-pointer transition-all ${
                selectedPlan === key
                  ? 'ring-2 ring-yellow-400 scale-105'
                  : 'hover:bg-gray-750'
              } ${plan.popular ? 'border-2 border-yellow-400' : ''}`}
              onClick={() => setSelectedPlan(key)}
            >
              {plan.popular && (
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-yellow-400 text-gray-900 px-4 py-1 rounded-full text-sm font-semibold">
                  {plan.savings}
                </div>
              )}
              <div className="text-center">
                <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                <div className="mb-4">
                  <span className="text-4xl font-bold text-white">${plan.price}</span>
                  <span className="text-gray-400">/{plan.period}</span>
                </div>
                <div className="mt-6 space-y-3">
                  {premiumFeatures.map((feature, index) => (
                    <div key={index} className="flex items-start text-left">
                      <Check className="w-5 h-5 text-green-400 mr-2 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-300">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Security & Benefits */}
        <div className="bg-gray-800 rounded-xl p-8 mb-8">
          <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
            <Lock className="w-6 h-6 mr-2" />
            Secure Payment
          </h3>
          <div className="space-y-4">
            <div className="flex items-start">
              <Check className="w-5 h-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <div className="text-white font-semibold">Secure Payment via Stripe</div>
                <div className="text-gray-400 text-sm">Your payment information is encrypted and secure</div>
              </div>
            </div>
            <div className="flex items-start">
              <Check className="w-5 h-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <div className="text-white font-semibold">Cancel Anytime</div>
                <div className="text-gray-400 text-sm">Cancel your subscription at any time, no questions asked</div>
              </div>
            </div>
            <div className="flex items-start">
              <Check className="w-5 h-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <div className="text-white font-semibold">Instant Access</div>
                <div className="text-gray-400 text-sm">Get immediate access to all premium features after payment</div>
              </div>
            </div>
          </div>
        </div>

        {/* Upgrade Button */}
        <div className="text-center">
          <button
            onClick={handleUpgrade}
            disabled={loading}
            className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-gray-900 font-bold py-4 px-12 rounded-lg text-xl transition-all transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {loading ? 'Processing...' : `Upgrade to Premium - $${plans[selectedPlan].price}/${plans[selectedPlan].period}`}
          </button>
          <p className="text-gray-400 mt-4 text-sm">
            <Lock className="w-4 h-4 inline mr-1" />
            Secure payment • Cancel anytime • No hidden fees
          </p>
        </div>
      </div>
    </div>
  );
};

export default UpgradePage;



