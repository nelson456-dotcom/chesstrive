import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Hero } from './Hero';

const BlunderPreventerIntroPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleStart = () => {
    if (user?.userType !== 'premium') {
      navigate('/upgrade');
      return;
    }
    navigate('/blunder-preventer');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
      <Hero
        title="Blunder Preventer"
        titles={['sharp', 'careful', 'precise', 'alert', 'focused']}
        description="Train yourself to avoid common tactical mistakes and improve your defensive skills. Learn to spot threats and calculate more accurately."
        onStartClick={handleStart}
        showLaunchArticle={false}
        startButtonText="Start"
      />
    </div>
  );
};

export default BlunderPreventerIntroPage;














