import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Hero } from './Hero';

const PlayWithBotIntroPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleStart = () => {
    navigate('/play-with-bot');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
      <Hero
        title="Bot Training"
        titles={['intelligent', 'adaptive', 'challenging', 'strategic', 'competitive']}
        description="Practice against AI opponents of varying skill levels to improve your game. Choose your difficulty and play unlimited games."
        onStartClick={handleStart}
        showLaunchArticle={false}
        startButtonText="Start"
      />
    </div>
  );
};

export default PlayWithBotIntroPage;














