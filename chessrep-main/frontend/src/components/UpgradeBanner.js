import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Crown, Lock, X, Check } from 'lucide-react';

/**
 * Upgrade banner component that shows for free users
 * Can be used inline or as a full-page overlay
 */
const UpgradeBanner = ({ 
  title = "Upgrade to Premium", 
  message = "Unlock all premium features and take your chess training to the next level.",
  showFullPage = false,
  onClose = null,
  compact = false
}) => {
  const navigate = useNavigate();
  const [isClosing, setIsClosing] = useState(false);

  const handleUpgrade = () => {
    navigate('/upgrade');
  };

  const handleClose = () => {
    if (onClose) {
      setIsClosing(true);
      setTimeout(() => {
        onClose();
      }, 300);
    }
  };

  const premiumFeatures = [
    "Resourcefulness Training",
    "Advantage Capitalisation",
    "Endgame Trainer",
    "Blunder Preventer",
    "Unlimited Opening Explorer",
    "Advanced Analytics",
    "Priority Support"
  ];

  if (showFullPage) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center p-4">
        <div className="max-w-4xl w-full bg-gray-800 rounded-2xl shadow-2xl p-8 md:p-12 relative">
          {onClose && (
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          )}
          
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full mb-4">
              <Crown className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              {title}
            </h1>
            <p className="text-xl text-gray-300 mb-8">
              {message}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="bg-gray-700/50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <Lock className="w-5 h-5 mr-2 text-gray-400" />
                Free Plan
              </h3>
              <ul className="space-y-2 text-gray-400">
                <li>Basic Tactics Training</li>
                <li>Limited Puzzle Access</li>
                <li>Basic Analysis</li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg p-6 border-2 border-yellow-400">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <Crown className="w-5 h-5 mr-2 text-yellow-400" />
                Premium Plan
              </h3>
              <ul className="space-y-2 text-white">
                {premiumFeatures.map((feature, index) => (
                  <li key={index} className="flex items-center">
                    <Check className="w-4 h-4 mr-2 text-yellow-400" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="text-center">
            <button
              onClick={handleUpgrade}
              className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-gray-900 font-bold py-4 px-8 rounded-lg text-lg transition-all transform hover:scale-105 shadow-lg"
            >
              Upgrade to Premium
            </button>
            <p className="text-gray-400 mt-4 text-sm">
              Starting at $4.99/month • Cancel anytime
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg p-4 mb-4 relative">
        {onClose && (
          <button
            onClick={handleClose}
            className="absolute top-2 right-2 text-white/80 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Lock className="w-5 h-5 text-yellow-300 mr-2" />
            <span className="text-white font-medium">{title}</span>
          </div>
          <button
            onClick={handleUpgrade}
            className="bg-white text-purple-600 font-semibold px-4 py-2 rounded hover:bg-gray-100 transition-colors"
          >
            Upgrade
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg p-6 mb-6 relative">
      {onClose && (
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-white/80 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>
      )}
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <Crown className="w-8 h-8 text-yellow-300" />
        </div>
        <div className="ml-4 flex-1">
          <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
          <p className="text-white/90 mb-4">{message}</p>
          <button
            onClick={handleUpgrade}
            className="bg-white text-purple-600 font-semibold px-6 py-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Upgrade to Premium
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpgradeBanner;



