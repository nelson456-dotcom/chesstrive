const mongoose = require('mongoose');
const Study = require('../models/Study');
const Chapter = require('../models/Chapter');

async function clearAllStudies() {
  try {
    await mongoose.connect('mongodb://localhost:27017/chessrep');
    console.log('✅ Connected to MongoDB');

    // Delete all chapters first
    const chaptersDeleted = await Chapter.deleteMany({});
    console.log(`🗑️ Deleted ${chaptersDeleted.deletedCount} chapters`);

    // Delete all studies
    const studiesDeleted = await Study.deleteMany({});
    console.log(`🗑️ Deleted ${studiesDeleted.deletedCount} studies`);

    console.log('✅ All studies and chapters cleared!');
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

clearAllStudies();










