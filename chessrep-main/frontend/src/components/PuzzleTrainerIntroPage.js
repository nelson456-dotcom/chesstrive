import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Hero } from './Hero';

const PuzzleTrainerIntroPage = () => {
  const navigate = useNavigate();

  const handleStart = () => {
    navigate('/puzzles');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
      <Hero
        title="Puzzle Trainer"
        titles={['tactical', 'pattern-based', 'adaptive', 'skillful', 'strategic']}
        description="Solve tactical puzzles to improve your pattern recognition and calculation skills. Master combinations, forks, pins, and more."
        onStartClick={handleStart}
        showLaunchArticle={false}
        startButtonText="Start"
      />
    </div>
  );
};

export default PuzzleTrainerIntroPage;














