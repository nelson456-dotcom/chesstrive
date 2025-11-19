import React from 'react';
import { useNavigate } from 'react-router-dom';

const BlunderPreventerIntroPage = () => {
  const navigate = useNavigate();

  const handleStart = () => {
    navigate('/blunder-preventer');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-5xl md:text-7xl font-bold text-white mb-8">
          Blunder Preventer
        </h1>
        <p className="text-xl md:text-2xl text-gray-300 mb-12 leading-relaxed">
          Train yourself to avoid common tactical mistakes and improve your defensive skills.
        </p>
        <button
          onClick={handleStart}
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg text-xl font-semibold transition-colors"
        >
          Start Training
        </button>
      </div>
    </div>
  );
};

export default BlunderPreventerIntroPage;

