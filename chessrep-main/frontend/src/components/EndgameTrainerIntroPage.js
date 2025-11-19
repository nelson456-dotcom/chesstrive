import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Hero } from './Hero';

const EndgameTrainerIntroPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleStart = () => {
    if (user?.userType !== 'premium') {
      navigate('/upgrade');
      return;
    }
    navigate('/endgame-trainer');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
      <Hero
        title="Endgame Mastery"
        titles={['precise', 'technical', 'essential', 'masterful', 'winning']}
        description="Master the art of endgame play with essential patterns and techniques. Learn king and pawn endings, theoretical positions, and conversion strategies."
        onStartClick={handleStart}
        showLaunchArticle={false}
        startButtonText="Start"
      />
    </div>
  );
};

export default EndgameTrainerIntroPage;














