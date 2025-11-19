const mongoose = require('mongoose');
const GameAnalysis = require('./models/GameAnalysis');

mongoose.connect('mongodb://localhost:27017/chessrep', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function clearAnalysis() {
  try {
    const result = await GameAnalysis.deleteMany({});
    console.log(`Cleared ${result.deletedCount} analysis records`);
    process.exit(0);
  } catch (error) {
    console.error('Error clearing analysis:', error);
    process.exit(1);
  }
}

clearAnalysis();

