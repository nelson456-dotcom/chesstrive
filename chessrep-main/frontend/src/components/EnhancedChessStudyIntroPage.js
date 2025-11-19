import React from 'react';
import TrainingIntroTemplate from './TrainingIntroTemplate';

const EnhancedChessStudyIntroPage = () => {
  return (
    <TrainingIntroTemplate
      title="Chess Study Creator"
      description="Create and manage chess studies with chapters, save your analysis, and build your personal chess library. Organize your chess knowledge systematically."
      startRoute="/enhanced-chess-study"
      difficultyOptions={['Beginner', 'Intermediate', 'Advanced', 'Master']}
      defaultDifficulty="Beginner"
    />
  );
};

export default EnhancedChessStudyIntroPage;
