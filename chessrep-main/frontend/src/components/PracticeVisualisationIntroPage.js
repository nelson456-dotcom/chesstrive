import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Hero } from './Hero';

const PracticeVisualisationIntroPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleStart = () => {
    if (user?.userType !== 'premium') {
      navigate('/upgrade');
      return;
    }
    navigate('/practice-visualisation');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
      <Hero
        title="Visualization Practice"
        titles={['mental', 'focused', 'calculated', 'sharp', 'intuitive']}
        description="Improve your ability to calculate and visualize moves in your head. Practice seeing multiple moves ahead without moving pieces on the board."
        onStartClick={handleStart}
        showLaunchArticle={false}
        startButtonText="Start"
      />
    </div>
  );
};

export default PracticeVisualisationIntroPage;














