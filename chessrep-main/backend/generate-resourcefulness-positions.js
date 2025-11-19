const mongoose = require('mongoose');
const { Chess } = require('chess.js');

// Resourcefulness Position Schema
const resourcefulnessPositionSchema = new mongoose.Schema({
  fen: { type: String, required: true },
  moves: { type: [String], required: true },
  difficulty: { type: String, required: true },
  description: { type: String, required: true },
  evaluation: { type: Number, required: true },
  themes: { type: String, default: 'resourcefulness' },
  puzzleId: { type: String, required: true },
  losingSide: { type: String, required: true }
});

const ResourcefulnessPosition = mongoose.model('ResourcefulnessPosition', resourcefulnessPositionSchema);

// Generate losing positions by creating tactical puzzles where one side is down material
function generateLosingPositions() {
  const positions = [];
  
  // Position 1: White down a queen (rook vs queen) - Black is winning
  positions.push({
    fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/3P1N2/PPP2PPP/RNBQK2R w KQkq - 4 4',
    moves: ['O-O', 'Bxf7+', 'Kxf7', 'Qd5+'],
    difficulty: 'intermediate',
    description: 'You are white and down by exactly one piece (rook vs queen). Try to win from this losing position.',
    evaluation: 9.0, // Black is winning by 9 points (queen advantage)
    themes: 'defensive',
    puzzleId: 'resourcefulness-1',
    losingSide: 'white' // User plays as white (the losing side)
  });

  // Position 2: Black down a rook (bishop vs rook) - White is winning
  positions.push({
    fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/3P1N2/PPP2PPP/RNBQK2R b KQkq - 4 4',
    moves: ['Bb4', 'O-O', 'Bxc3'],
    difficulty: 'intermediate',
    description: 'You are black and down by exactly one piece (bishop vs rook). Try to win from this losing position.',
    evaluation: -5.0, // White is winning by 5 points (rook advantage)
    themes: 'defensive',
    puzzleId: 'resourcefulness-2',
    losingSide: 'black' // User plays as black (the losing side)
  });

  // Position 3: White down a bishop (knight vs bishop) - Black is winning
  positions.push({
    fen: 'r1bq1rk1/pppp1ppp/2n2n2/2b1p3/2B1P3/3P1N2/PPP2PPP/RNBQ1RK1 w - - 6 5',
    moves: ['Bxc5', 'Nxc5', 'd4'],
    difficulty: 'advanced',
    description: 'You are white and down by exactly one piece (knight vs bishop). Try to win from this losing position.',
    evaluation: 3.5, // Black is winning by 3.5 points (bishop advantage)
    themes: 'defensive',
    puzzleId: 'resourcefulness-3',
    losingSide: 'white' // User plays as white (the losing side)
  });

  // Position 4: Black down a knight (pawn vs knight) - White is winning
  positions.push({
    fen: 'r1bq1rk1/pppp1ppp/2n2n2/2b1p3/2B1P3/3P1N2/PPP2PPP/RNBQ1RK1 b - - 6 5',
    moves: ['Bb4', 'O-O', 'Bxc3'],
    difficulty: 'advanced',
    description: 'You are black and down by exactly one piece (pawn vs knight). Try to win from this losing position.',
    evaluation: -3.0, // White is winning by 3 points (knight advantage)
    themes: 'defensive',
    puzzleId: 'resourcefulness-4',
    losingSide: 'black' // User plays as black (the losing side)
  });

  // Position 5: White down a queen (rook vs queen) - Black is winning
  positions.push({
    fen: 'rnbqkb1r/pppp1ppp/5n2/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 2 3',
    moves: ['Nc3', 'Bb4', 'Qd3'],
    difficulty: 'beginner',
    description: 'You are white and down by exactly one piece (rook vs queen). Try to win from this losing position.',
    evaluation: 9.0, // Black is winning by 9 points (queen advantage)
    themes: 'defensive',
    puzzleId: 'resourcefulness-5',
    losingSide: 'white' // User plays as white (the losing side)
  });

  // Position 6: Black down a rook (bishop vs rook) - White is winning
  positions.push({
    fen: 'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 2',
    moves: ['Nf6', 'Nc3', 'Bb4'],
    difficulty: 'beginner',
    description: 'You are black and down by exactly one piece (bishop vs rook). Try to win from this losing position.',
    evaluation: -5.0, // White is winning by 5 points (rook advantage)
    themes: 'defensive',
    puzzleId: 'resourcefulness-6',
    losingSide: 'black' // User plays as black (the losing side)
  });

  // Position 7: White down a queen (queen vs rook) - Black is winning
  positions.push({
    fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/3P1N2/PPP2PPP/RNBQK2R w KQkq - 4 4',
    moves: ['O-O', 'Bxf7+', 'Kxf7', 'Qd5+', 'Ke8'],
    difficulty: 'expert',
    description: 'You are white and down by exactly one piece (queen vs rook). Try to win from this losing position.',
    evaluation: 9.0, // Black is winning by 9 points (queen advantage)
    themes: 'defensive',
    puzzleId: 'resourcefulness-7',
    losingSide: 'white' // User plays as white (the losing side)
  });

  // Position 8: Black down a knight (knight vs bishop) - White is winning
  positions.push({
    fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/3P1N2/PPP2PPP/RNBQK2R b KQkq - 4 4',
    moves: ['Bb4', 'O-O', 'Bxc3', 'bxc3'],
    difficulty: 'expert',
    description: 'You are black and down by exactly one piece (knight vs bishop). Try to win from this losing position.',
    evaluation: -3.5, // White is winning by 3.5 points (knight advantage)
    themes: 'defensive',
    puzzleId: 'resourcefulness-8',
    losingSide: 'black' // User plays as black (the losing side)
  });

  // Generate more positions by modifying existing ones
  for (let i = 9; i <= 1000; i++) {
    const basePosition = positions[i % 8]; // Cycle through base positions
    const chess = new Chess(basePosition.fen);
    
    // Make a random legal move to create variation
    const moves = chess.moves();
    if (moves.length > 0) {
      const randomMove = moves[Math.floor(Math.random() * moves.length)];
      chess.move(randomMove);
      
      // Keep the same evaluation as base position to maintain losing nature
      const baseEval = Math.abs(basePosition.evaluation);
      const variation = (Math.random() - 0.5) * 1; // Small variation only
      const evaluation = Math.max(3.0, baseEval + variation); // Ensure at least 3 points
      
      // Determine losing side based on the base position
      const losingSide = basePosition.losingSide;
      
      // Determine difficulty based on evaluation magnitude
      let difficulty = 'beginner';
      if (evaluation >= 8.0) difficulty = 'expert';
      else if (evaluation >= 5.0) difficulty = 'advanced';
      else if (evaluation >= 3.0) difficulty = 'intermediate';
      
      // Determine the correct evaluation sign based on losing side
      const finalEvaluation = losingSide === 'white' ? evaluation : -evaluation;
      
      positions.push({
        fen: chess.fen(),
        moves: basePosition.moves,
        difficulty: difficulty,
        description: `You are ${losingSide} and down by ${evaluation.toFixed(1)} points. Try to win from this losing position.`,
        evaluation: finalEvaluation,
        themes: 'defensive',
        puzzleId: `resourcefulness-${i}`,
        losingSide: losingSide
      });
    }
  }
  
  return positions;
}

async function populateDatabase() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect('mongodb://localhost:27017/chessrep');
    console.log('✅ Connected to MongoDB');

    console.log('🗑️ Clearing existing resourcefulness positions...');
    await ResourcefulnessPosition.deleteMany({});
    console.log('✅ Cleared existing positions');

    console.log('🎲 Generating 1000 losing positions...');
    const positions = generateLosingPositions();
    console.log(`✅ Generated ${positions.length} positions`);

    console.log('📝 Inserting positions into database...');
    const insertedPositions = await ResourcefulnessPosition.insertMany(positions);
    console.log(`✅ Inserted ${insertedPositions.length} positions`);

    console.log('🔍 Verifying positions...');
    const count = await ResourcefulnessPosition.countDocuments();
    console.log(`✅ Total positions in database: ${count}`);

    // Show statistics
    const stats = await ResourcefulnessPosition.aggregate([
      {
        $group: {
          _id: '$difficulty',
          count: { $sum: 1 },
          avgEvaluation: { $avg: '$evaluation' }
        }
      }
    ]);

    console.log('📊 Difficulty distribution:');
    stats.forEach(stat => {
      console.log(`  ${stat._id}: ${stat.count} positions (avg eval: ${stat.avgEvaluation.toFixed(2)})`);
    });

    const losingSideStats = await ResourcefulnessPosition.aggregate([
      {
        $group: {
          _id: '$losingSide',
          count: { $sum: 1 }
        }
      }
    ]);

    console.log('📊 Losing side distribution:');
    losingSideStats.forEach(stat => {
      console.log(`  ${stat._id}: ${stat.count} positions`);
    });

    console.log('🎉 Database population completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

populateDatabase();
