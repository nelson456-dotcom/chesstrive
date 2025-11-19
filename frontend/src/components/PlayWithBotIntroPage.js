import React from 'react';
import { useNavigate } from 'react-router-dom';

const PlayWithBotIntroPage = () => {
  const navigate = useNavigate();

  const handleStart = () => {
    navigate('/play-with-bot');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-5xl md:text-7xl font-bold text-white mb-8">
          Play with Bot
        </h1>
        <p className="text-xl md:text-2xl text-gray-300 mb-12 leading-relaxed">
          Practice against AI opponents of varying skill levels to improve your game.
        </p>
        <button
          onClick={handleStart}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-lg text-xl font-semibold transition-colors"
        >
          Start Training
        </button>
      </div>
    </div>
  );
};

export default PlayWithBotIntroPage;

