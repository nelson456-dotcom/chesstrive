const mongoose = require('mongoose');
const fetch = require('node-fetch');
const path = require('path');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/chessrep', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

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

// Function to analyze position with Stockfish
async function analyzePositionWithStockfish(fen) {
  try {
    console.log(`Analyzing position: ${fen}`);
    
    const response = await fetch('http://localhost:3001/api/analysis/position', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fen: fen,
        depth: 15,
        multiPV: 1,
        timeLimit: 3000
      })
    });

    if (response.ok) {
      const data = await response.json();
      
      if (data.success && data.evaluation !== undefined) {
        const stockfishEvaluation = data.evaluation;
        
        // Determine losing side based on Stockfish evaluation
        const isWhiteLosing = stockfishEvaluation < 0;
        const isBlackLosing = stockfishEvaluation > 0;
        
        let losingSide = '';
        if (isWhiteLosing) {
          losingSide = 'white';
        } else if (isBlackLosing) {
          losingSide = 'black';
        }
        
        return {
          stockfishEvaluation: stockfishEvaluation,
          losingSide: losingSide,
          isDownByOnePiece: Math.abs(stockfishEvaluation) >= 1.0,
          bestMove: data.bestMove
        };
      }
    }
    
    return null;
    
  } catch (error) {
    console.error('Stockfish analysis error:', error);
    return null;
  }
}

// Main function to re-analyze all positions
async function reanalyzeAllPositions() {
  try {
    console.log('Starting re-analysis of all resourcefulness positions...');
    
    const positions = await ResourcefulnessPosition.find({});
    console.log(`Found ${positions.length} positions to analyze`);
    
    let updatedCount = 0;
    let skippedCount = 0;
    
    for (let i = 0; i < positions.length; i++) {
      const position = positions[i];
      console.log(`\nAnalyzing position ${i + 1}/${positions.length}: ${position.puzzleId}`);
      
      const analysis = await analyzePositionWithStockfish(position.fen);
      
      if (analysis && analysis.losingSide && analysis.isDownByOnePiece) {
        // Update the position with Stockfish analysis
        position.evaluation = analysis.stockfishEvaluation;
        position.losingSide = analysis.losingSide;
        position.description = `You are ${analysis.losingSide} and down by ${Math.abs(analysis.stockfishEvaluation).toFixed(1)} pawns according to Stockfish (${analysis.stockfishEvaluation > 0 ? '+' : ''}${analysis.stockfishEvaluation.toFixed(1)}). Try to win from this losing position.`;
        
        await position.save();
        updatedCount++;
        
        console.log(`✅ Updated: ${analysis.losingSide} losing by ${Math.abs(analysis.stockfishEvaluation).toFixed(1)} pawns`);
      } else {
        console.log(`❌ Skipped: Not a valid losing position`);
        skippedCount++;
      }
      
      // Add small delay to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log(`\n🎉 Re-analysis complete!`);
    console.log(`✅ Updated: ${updatedCount} positions`);
    console.log(`❌ Skipped: ${skippedCount} positions`);
    
  } catch (error) {
    console.error('Error during re-analysis:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the re-analysis
reanalyzeAllPositions();
