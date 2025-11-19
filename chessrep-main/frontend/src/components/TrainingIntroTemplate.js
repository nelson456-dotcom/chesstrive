import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Chessboard } from 'react-chessboard';
import { useAuth } from '../contexts/AuthContext';
import UpgradeBanner from './UpgradeBanner';

const TrainingIntroTemplate = ({ 
  title, 
  description, 
  startRoute, 
  difficultyOptions = ['Easy', 'Medium', 'Hard', 'Expert'],
  defaultDifficulty = 'Easy',
  boardPosition = 'start',
  showDifficulty = true,
  isPremium = false
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [difficulty, setDifficulty] = useState(defaultDifficulty);

  const handleStart = () => {
    if (isPremium && user?.userType !== 'premium') {
      navigate('/upgrade');
      return;
    }
    navigate(startRoute);
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Section - Chess Board */}
          <div className="flex justify-center lg:justify-end">
            <div className="bg-stone-100 rounded-xl p-6 shadow-lg">
              <Chessboard
                position={boardPosition}
                boardWidth={400}
                customBoardStyle={{
                  borderRadius: '8px',
                  boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
                }}
                customLightSquareStyle={{
                  backgroundColor: '#f0d9b5'
                }}
                customDarkSquareStyle={{
                  backgroundColor: '#b58863'
                }}
                arePiecesDraggable={false}
                areArrowsAllowed={false}
              />
            </div>
          </div>

          {/* Right Section - Module Details */}
          <div className="space-y-8">
            {/* Premium Banner */}
            {isPremium && user?.userType !== 'premium' && (
              <UpgradeBanner 
                title={`${title} is a Premium Feature`}
                message="Upgrade to Premium to access this training module and unlock all premium features."
                compact={false}
              />
            )}
            {/* Header */}
            <div>
              <p className="text-sm uppercase tracking-wider text-gray-500 mb-2">
                Training Room
              </p>
              <h1 className="text-4xl lg:text-5xl font-bold text-black mb-6">
                {title}
              </h1>
            </div>

            {/* Description */}
            <div className="space-y-4">
              <p className="text-lg text-gray-600 leading-relaxed">
                {description}
              </p>
            </div>

            {/* Difficulty Selector */}
            {showDifficulty && (
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-500">
                  Difficulty
                </label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="w-full max-w-xs px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none cursor-pointer"
                >
                  {difficultyOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Start Button */}
            <div className="pt-4">
              <button
                onClick={handleStart}
                className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-colors duration-200 uppercase tracking-wide"
              >
                Start
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrainingIntroTemplate;
