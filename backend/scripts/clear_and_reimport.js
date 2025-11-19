const mongoose = require('mongoose');
const Study = require('../models/Study');
const Chapter = require('../models/Chapter');
const { exec } = require('child_process');
const path = require('path');

async function clearAndReimport() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/chessrep');
    console.log('✅ Connected to MongoDB\n');

    // Delete all chapters first
    const chapterResult = await Chapter.deleteMany({});
    console.log(`🗑️ Deleted ${chapterResult.deletedCount} chapters`);

    // Then delete all studies
    const studyResult = await Study.deleteMany({});
    console.log(`🗑️ Deleted ${studyResult.deletedCount} studies\n`);

    console.log('✅ All studies and chapters cleared!');
    console.log('📥 Starting import...\n');

    await mongoose.connection.close();

    // Run the import script
    const importScript = path.join(__dirname, 'import_lichess_studies_correct.js');
    exec(`node "${importScript}"`, (error, stdout, stderr) => {
      if (error) {
        console.error(`❌ Error running import: ${error.message}`);
        return;
      }
      if (stderr) {
        console.error(`stderr: ${stderr}`);
      }
      console.log(stdout);
    });

  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.connection.close();
  }
}

clearAndReimport();










