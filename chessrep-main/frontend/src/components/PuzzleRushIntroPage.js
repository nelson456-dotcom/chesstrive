import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Hero } from './Hero';

const PuzzleRushIntroPage = () => {
  const navigate = useNavigate();

  const handleStart = () => {
    navigate('/puzzle-rush');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
      <Hero
        title="Puzzle Rush"
        titles={['fast', 'intense', 'challenging', 'exciting', 'thrilling']}
        description="Solve puzzles as fast as you can in this exciting timed challenge. Test your tactical vision and speed under pressure."
        onStartClick={handleStart}
        showLaunchArticle={false}
        startButtonText="Start"
      />
    </div>
  );
};

export default PuzzleRushIntroPage;














