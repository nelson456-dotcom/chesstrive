import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Hero } from './Hero';

const AdvantageCapitalisationIntroPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleStart = () => {
    if (user?.userType !== 'premium') {
      navigate('/upgrade');
      return;
    }
    navigate('/advantage-capitalisation');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
      <Hero
        title="Advantage Conversion"
        titles={['decisive', 'strategic', 'winning', 'precision', 'expert']}
        description="Learn to convert advantages into wins with practical examples and strategies. Master the art of capitalizing on positional and material advantages."
        onStartClick={handleStart}
        showLaunchArticle={false}
        startButtonText="Start"
      />
    </div>
  );
};

export default AdvantageCapitalisationIntroPage;














