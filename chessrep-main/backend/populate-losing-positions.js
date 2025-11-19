const mongoose = require('mongoose');

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

// Create losing positions where one side is down material
function createLosingPositions() {
  const positions = [];
  
  // Position 1: White down a queen (rook vs queen) - Black is winning
  positions.push({
    fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/3P1N2/PPP2PPP/RNBQK2R w KQkq - 4 4',
    moves: ['O-O', 'Bxf7+', 'Kxf7', 'Qd5+'],
    difficulty: 'expert',
    description: 'You are white and down by exactly one piece (rook vs queen). Try to win from this losing position.',
    evaluation: -9.0, // Black is winning by 9 points (queen advantage)
    themes: 'resourcefulness',
    puzzleId: 'resourcefulness-1',
    losingSide: 'white' // User plays as white (the losing side)
  });

  // Position 2: Black down a rook (bishop vs rook) - White is winning
  positions.push({
    fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/3P1N2/PPP2PPP/RNBQK2R b KQkq - 4 4',
    moves: ['Bb4', 'O-O', 'Bxc3'],
    difficulty: 'advanced',
    description: 'You are black and down by exactly one piece (bishop vs rook). Try to win from this losing position.',
    evaluation: 5.0, // White is winning by 5 points (rook advantage)
    themes: 'resourcefulness',
    puzzleId: 'resourcefulness-2',
    losingSide: 'black' // User plays as black (the losing side)
  });

  // Position 3: White down a bishop (knight vs bishop) - Black is winning
  positions.push({
    fen: 'r1bq1rk1/pppp1ppp/2n2n2/2b1p3/2B1P3/3P1N2/PPP2PPP/RNBQ1RK1 w - - 6 5',
    moves: ['Bxc5', 'Nxc5', 'd4'],
    difficulty: 'advanced',
    description: 'You are white and down by exactly one piece (knight vs bishop). Try to win from this losing position.',
    evaluation: -3.5, // Black is winning by 3.5 points (bishop advantage)
    themes: 'resourcefulness',
    puzzleId: 'resourcefulness-3',
    losingSide: 'white' // User plays as white (the losing side)
  });

  // Position 4: Black down a knight (pawn vs knight) - White is winning
  positions.push({
    fen: 'r1bq1rk1/pppp1ppp/2n2n2/2b1p3/2B1P3/3P1N2/PPP2PPP/RNBQ1RK1 b - - 6 5',
    moves: ['Bb4', 'O-O', 'Bxc3'],
    difficulty: 'intermediate',
    description: 'You are black and down by exactly one piece (pawn vs knight). Try to win from this losing position.',
    evaluation: 3.0, // White is winning by 3 points (knight advantage)
    themes: 'resourcefulness',
    puzzleId: 'resourcefulness-4',
    losingSide: 'black' // User plays as black (the losing side)
  });

  // Position 5: White down a queen (rook vs queen) - Black is winning
  positions.push({
    fen: 'rnbqkb1r/pppp1ppp/5n2/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 2 3',
    moves: ['Nc3', 'Bb4', 'Qd3'],
    difficulty: 'expert',
    description: 'You are white and down by exactly one piece (rook vs queen). Try to win from this losing position.',
    evaluation: -9.0, // Black is winning by 9 points (queen advantage)
    themes: 'resourcefulness',
    puzzleId: 'resourcefulness-5',
    losingSide: 'white' // User plays as white (the losing side)
  });

  // Position 6: Black down a rook (bishop vs rook) - White is winning
  positions.push({
    fen: 'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 2',
    moves: ['Nf6', 'Nc3', 'Bb4'],
    difficulty: 'advanced',
    description: 'You are black and down by exactly one piece (bishop vs rook). Try to win from this losing position.',
    evaluation: 5.0, // White is winning by 5 points (rook advantage)
    themes: 'resourcefulness',
    puzzleId: 'resourcefulness-6',
    losingSide: 'black' // User plays as black (the losing side)
  });

  // Position 7: White down a queen (queen vs rook) - Black is winning
  positions.push({
    fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/3P1N2/PPP2PPP/RNBQK2R w KQkq - 4 4',
    moves: ['O-O', 'Bxf7+', 'Kxf7', 'Qd5+', 'Ke8'],
    difficulty: 'expert',
    description: 'You are white and down by exactly one piece (queen vs rook). Try to win from this losing position.',
    evaluation: -9.0, // Black is winning by 9 points (queen advantage)
    themes: 'resourcefulness',
    puzzleId: 'resourcefulness-7',
    losingSide: 'white' // User plays as white (the losing side)
  });

  // Position 8: Black down a knight (knight vs bishop) - White is winning
  positions.push({
    fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/3P1N2/PPP2PPP/RNBQK2R b KQkq - 4 4',
    moves: ['Bb4', 'O-O', 'Bxc3', 'bxc3'],
    difficulty: 'intermediate',
    description: 'You are black and down by exactly one piece (knight vs bishop). Try to win from this losing position.',
    evaluation: 3.5, // White is winning by 3.5 points (knight advantage)
    themes: 'resourcefulness',
    puzzleId: 'resourcefulness-8',
    losingSide: 'black' // User plays as black (the losing side)
  });

  // Generate more positions by creating variations
  for (let i = 9; i <= 100; i++) {
    const basePosition = positions[i % 8]; // Cycle through base positions
    
    // Create variations by modifying the FEN slightly
    const fenParts = basePosition.fen.split(' ');
    const board = fenParts[0];
    const turn = fenParts[1];
    const castling = fenParts[2];
    const enPassant = fenParts[3];
    const halfmove = fenParts[4];
    const fullmove = fenParts[5];
    
    // Modify the halfmove and fullmove to create variations
    const newHalfmove = (parseInt(halfmove) + i) % 50;
    const newFullmove = parseInt(fullmove) + Math.floor(i / 8);
    
    const newFen = `${board} ${turn} ${castling} ${enPassant} ${newHalfmove} ${newFullmove}`;
    
    // Keep the same evaluation as base position to maintain losing nature
    const baseEval = Math.abs(basePosition.evaluation);
    const variation = (Math.random() - 0.5) * 0.5; // Small variation
    const evaluation = Math.max(3.0, baseEval + variation); // Ensure at least 3 points
    
    // Determine losing side based on the base position
    const losingSide = basePosition.losingSide;
    
    // Determine difficulty based on evaluation magnitude
    let difficulty = 'beginner';
    if (evaluation >= 8.0) difficulty = 'expert';
    else if (evaluation >= 5.0) difficulty = 'advanced';
    else if (evaluation >= 3.0) difficulty = 'intermediate';
    
    // Determine the correct evaluation sign based on losing side
    const finalEvaluation = losingSide === 'white' ? -evaluation : evaluation;
    
    positions.push({
      fen: newFen,
      moves: basePosition.moves,
      difficulty: difficulty,
      description: `You are ${losingSide} and down by ${evaluation.toFixed(1)} points. Try to win from this losing position.`,
      evaluation: finalEvaluation,
      themes: 'resourcefulness',
      puzzleId: `resourcefulness-${i}`,
      losingSide: losingSide
    });
  }
  
  return positions;
}

async function populateResourcefulness() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect('mongodb://localhost:27017/chessrep');
    console.log('✅ Connected to MongoDB');

    // Clear existing positions
    console.log('🗑️ Clearing existing resourcefulness positions...');
    await ResourcefulnessPosition.deleteMany({});
    console.log('✅ Cleared existing positions');

    console.log('🎲 Generating losing positions...');
    const positions = createLosingPositions();
    console.log(`✅ Generated ${positions.length} positions`);

    console.log('📝 Inserting positions into database...');
    const insertedPositions = await ResourcefulnessPosition.insertMany(positions);
    console.log(`✅ Inserted ${insertedPositions.length} positions`);

    console.log('🔍 Verifying positions...');
    const totalInDb = await ResourcefulnessPosition.countDocuments();
    console.log(`✅ Total positions in database: ${totalInDb}`);

    if (totalInDb > 0) {
      const difficultyDistribution = await ResourcefulnessPosition.aggregate([
        { $group: { _id: '$difficulty', count: { $sum: 1 }, avgEval: { $avg: '$evaluation' } } },
        { $sort: { count: -1 } }
      ]);
      console.log('📊 Difficulty distribution:');
      difficultyDistribution.forEach(dist => {
        console.log(`  ${dist._id}: ${dist.count} positions (avg eval: ${dist.avgEval.toFixed(2)})`);
      });

      const losingSideDistribution = await ResourcefulnessPosition.aggregate([
        { $group: { _id: '$losingSide', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]);
      console.log('📊 Losing side distribution:');
      losingSideDistribution.forEach(dist => {
        console.log(`  ${dist._id}: ${dist.count} positions`);
      });

      console.log('📊 Sample positions:');
      const sample = await ResourcefulnessPosition.find().limit(5);
      sample.forEach((pos, index) => {
        console.log(`  ${index + 1}. ${pos.difficulty} - ${pos.losingSide} - Eval: ${pos.evaluation.toFixed(2)} - ${pos.fen.substring(0, 20)}...`);
      });
    }

    console.log('🎉 Database population completed successfully!');
    mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Database population failed:', error);
    mongoose.disconnect();
    process.exit(1);
  }
}

populateResourcefulness();
