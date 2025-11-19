import React from 'react';
import TrainingIntroTemplate from './TrainingIntroTemplate';

const PositionalTrainerIntroPage = () => {
  return (
    <TrainingIntroTemplate
      title="Positional Trainer"
      description="Develop your understanding of positional concepts and strategic play. Learn about pawn structures, piece placement, and long-term planning."
      startRoute="/positional-trainer"
      difficultyOptions={['Beginner', 'Intermediate', 'Advanced', 'Master']}
      defaultDifficulty="Beginner"
    />
  );
};

export default PositionalTrainerIntroPage;














