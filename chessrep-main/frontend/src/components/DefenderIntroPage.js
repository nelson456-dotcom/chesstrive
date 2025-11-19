import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Hero } from './Hero';

const DefenderIntroPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleStart = () => {
    if (user?.userType !== 'premium') {
      navigate('/upgrade');
      return;
    }
    navigate('/defender');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
      <Hero
        title="Defender"
        titles={['protective', 'resilient', 'solid', 'defensive', 'tactical']}
        description="Master defensive chess techniques with practical puzzles. Learn to identify threats and find the best defensive moves to protect your position."
        onStartClick={handleStart}
        showLaunchArticle={false}
        startButtonText="Start"
      />
    </div>
  );
};

export default DefenderIntroPage;


