const mongoose = require('mongoose');
const fs = require('fs');
const csv = require('csv-parser');
const { Chess } = require('chess.js');
const PuzzleRushPuzzle = require('../models/PuzzleRushPuzzle');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/chessrep')
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Import exactly 10,000 puzzles from CSV for puzzle rush (rating < 1500)
async function importPuzzleRushFromCSV() {
  try {
    // Clear existing puzzle rush puzzles
    await PuzzleRushPuzzle.deleteMany({});
    console.log('Cleared existing puzzle rush puzzles');
    
    const puzzles = [];
    let processedCount = 0;
    let validPuzzles = 0;
    const MAX_PUZZLES = 10000; // Limit to 10,000 puzzles
    
    console.log(`Reading puzzles from CSV (max ${MAX_PUZZLES} puzzles)...`);
    
    // Read CSV file
    fs.createReadStream('./data/puzzles.csv')
      .pipe(csv())
      .on('data', (row) => {
        // Stop if we have enough puzzles
        if (validPuzzles >= MAX_PUZZLES) {
          return;
        }
        
        processedCount++;
        
        // Only process puzzles with rating < 1500
        const rating = parseInt(row.Rating);
        if (rating && rating < 1500 && rating >= 300) {
          try {
            // Validate FEN
            const chess = new Chess(row.FEN);
            if (chess.isGameOver()) {
              return; // Skip if game is already over
            }
            
            // Parse moves (assuming they're in UCI format)
            const moves = row.Moves ? row.Moves.split(' ').filter(move => move.trim()) : [];
            if (moves.length === 0) {
              return; // Skip if no moves
            }
            
            // Determine difficulty based on rating
            let difficulty = 'beginner';
            if (rating >= 800 && rating < 1200) {
              difficulty = 'intermediate';
            } else if (rating >= 1200) {
              difficulty = 'advanced';
            }
            
            puzzles.push({
              fen: row.FEN,
              moves: moves,
              theme: row.Theme || 'tactics',
              difficulty: difficulty,
              rating: rating,
              source: 'csv'
            });
            
            validPuzzles++;
            
            if (validPuzzles % 1000 === 0) {
              console.log(`Found ${validPuzzles}/${MAX_PUZZLES} valid puzzles (processed ${processedCount} rows)`);
            }
            
          } catch (error) {
            // Skip invalid puzzles
            return;
          }
        }
      })
      .on('end', async () => {
        console.log(`\nFinished reading CSV. Found ${validPuzzles} valid puzzles for puzzle rush.`);
        
        if (puzzles.length === 0) {
          console.log('No valid puzzles found. Creating fallback puzzles...');
          await createFallbackPuzzles();
          return;
        }
        
        // Insert puzzles in batches
        const batchSize = 100;
        for (let i = 0; i < puzzles.length; i += batchSize) {
          const batch = puzzles.slice(i, i + batchSize);
          await PuzzleRushPuzzle.insertMany(batch);
          console.log(`Inserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(puzzles.length / batchSize)}`);
        }
        
        console.log(`✅ Successfully imported ${puzzles.length} puzzle rush puzzles!`);
        
        // Show statistics
        const stats = await PuzzleRushPuzzle.aggregate([
          {
            $group: {
              _id: '$difficulty',
              count: { $sum: 1 },
              avgRating: { $avg: '$rating' },
              minRating: { $min: '$rating' },
              maxRating: { $max: '$rating' }
            }
          }
        ]);
        
        console.log('\n📊 Puzzle Rush Statistics:');
        stats.forEach(stat => {
          console.log(`${stat._id}: ${stat.count} puzzles, avg rating: ${stat.avgRating.toFixed(0)}, range: ${stat.minRating}-${stat.maxRating}`);
        });
        
        // Show rating distribution
        const ratingStats = await PuzzleRushPuzzle.aggregate([
          {
            $bucket: {
              groupBy: '$rating',
              boundaries: [300, 600, 900, 1200, 1500],
              default: 'Other',
              output: {
                count: { $sum: 1 }
              }
            }
          }
        ]);
        
        console.log('\n📈 Rating Distribution:');
        ratingStats.forEach(stat => {
          console.log(`${stat._id}: ${stat.count} puzzles`);
        });
        
        mongoose.connection.close();
      })
      .on('error', (error) => {
        console.error('Error reading CSV:', error);
        createFallbackPuzzles();
      });
      
  } catch (error) {
    console.error('Error importing puzzles:', error);
    createFallbackPuzzles();
  }
}

// Create fallback puzzles if CSV import fails
async function createFallbackPuzzles() {
  console.log('Creating fallback puzzles...');
  
  const fallbackPuzzles = [
    {
      fen: 'rnbqkb1r/pppp1ppp/5n2/4p3/2B1P3/8/PPPP1PPP/RNBQK1NR w KQkq - 0 1',
      moves: ['Nf3'],
      theme: 'development',
      difficulty: 'beginner',
      rating: 400,
      source: 'fallback'
    },
    {
      fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/3P1N2/PPP2PPP/RNBQK2R w KQkq - 0 1',
      moves: ['Bxf7+'],
      theme: 'tactics',
      difficulty: 'intermediate',
      rating: 600,
      source: 'fallback'
    },
    {
      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      moves: ['e4'],
      theme: 'opening',
      difficulty: 'beginner',
      rating: 300,
      source: 'fallback'
    },
    {
      fen: 'r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/3P1N2/PPP2PPP/RNBQK2R w KQkq - 0 1',
      moves: ['Bxf7+'],
      theme: 'tactics',
      difficulty: 'intermediate',
      rating: 700,
      source: 'fallback'
    },
    {
      fen: 'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2',
      moves: ['Nf3'],
      theme: 'opening',
      difficulty: 'beginner',
      rating: 350,
      source: 'fallback'
    },
    {
      fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/3P1N2/PPP2PPP/RNBQK2R w KQkq - 0 1',
      moves: ['O-O'],
      theme: 'castling',
      difficulty: 'intermediate',
      rating: 500,
      source: 'fallback'
    },
    {
      fen: 'rnbqkbnr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 0 1',
      moves: ['Bc4'],
      theme: 'development',
      difficulty: 'beginner',
      rating: 450,
      source: 'fallback'
    },
    {
      fen: 'r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/3P1N2/PPP2PPP/RNBQK2R w KQkq - 0 1',
      moves: ['d4'],
      theme: 'opening',
      difficulty: 'intermediate',
      rating: 550,
      source: 'fallback'
    },
    {
      fen: 'rnbqkb1r/pppp1ppp/5n2/4p3/2B1P3/8/PPPP1PPP/RNBQK1NR w KQkq - 0 1',
      moves: ['d4'],
      theme: 'opening',
      difficulty: 'beginner',
      rating: 380,
      source: 'fallback'
    },
    {
      fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/3P1N2/PPP2PPP/RNBQK2R w KQkq - 0 1',
      moves: ['Bc4'],
      theme: 'development',
      difficulty: 'intermediate',
      rating: 650,
      source: 'fallback'
    }
  ];
  
  await PuzzleRushPuzzle.insertMany(fallbackPuzzles);
  console.log(`✅ Created ${fallbackPuzzles.length} fallback puzzles!`);
  
  mongoose.connection.close();
}

// Run the script
importPuzzleRushFromCSV();