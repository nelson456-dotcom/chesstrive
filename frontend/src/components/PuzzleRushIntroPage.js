import React from 'react';
import { useNavigate } from 'react-router-dom';

const PuzzleRushIntroPage = () => {
  const navigate = useNavigate();

  const handleStart = () => {
    navigate('/puzzle-rush');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-red-900 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-5xl md:text-7xl font-bold text-white mb-8">
          Puzzle Rush
        </h1>
        <p className="text-xl md:text-2xl text-gray-300 mb-12 leading-relaxed">
          Solve puzzles as fast as you can in this exciting timed challenge.
        </p>
        <button
          onClick={handleStart}
          className="bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-lg text-xl font-semibold transition-colors"
        >
          Start Training
        </button>
      </div>
    </div>
  );
};

export default PuzzleRushIntroPage;

