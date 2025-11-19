import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Hero } from './Hero';

const GuessTheMoveIntroPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleStart = () => {
    if (user?.userType !== 'premium') {
      navigate('/upgrade');
      return;
    }
    navigate('/guess-the-move');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
      <Hero
        title="Master Games"
        titles={['legendary', 'inspiring', 'educational', 'classic', 'brilliant']}
        description="Study famous games by guessing the moves played by grandmasters. Improve your positional understanding and learn from the masters."
        onStartClick={handleStart}
        showLaunchArticle={false}
        startButtonText="Start"
      />
    </div>
  );
};

export default GuessTheMoveIntroPage;














