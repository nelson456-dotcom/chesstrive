import React from 'react';
import TrainingIntroTemplate from './TrainingIntroTemplate';

const OpeningsIntroPage = () => {
  return (
    <TrainingIntroTemplate
      title="Opening Theory"
      description="Study chess openings, build your repertoire, and understand opening principles. Master the fundamentals of chess openings and develop your personal repertoire."
      startRoute="/openings"
      difficultyOptions={['Beginner', 'Intermediate', 'Advanced', 'Master']}
      defaultDifficulty="Beginner"
    />
  );
};

export default OpeningsIntroPage;
