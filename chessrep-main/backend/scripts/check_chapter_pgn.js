const mongoose = require('mongoose');
const Chapter = require('../models/Chapter');
const Study = require('../models/Study');

async function checkChapterPGN() {
  try {
    await mongoose.connect('mongodb://localhost:27017/chessrep');
    console.log('✅ Connected to MongoDB\n');

    // Find The Poisonous Ponziani study
    const study = await Study.findOne({ name: 'The Poisonous Ponziani!' });
    if (!study) {
      console.log('Study not found');
      return;
    }

    console.log(`Found study: ${study.name}`);
    console.log(`Chapters: ${study.chapters.length}\n`);

    // Get the second chapter (should have moves)
    const chapter = await Chapter.findById(study.chapters[1]);
    
    if (!chapter) {
      console.log('Chapter not found');
      return;
    }

    console.log(`Chapter: ${chapter.name}`);
    console.log(`\n=== PGN ===`);
    console.log(chapter.pgn);
    console.log(`\n=== Game Tree ===`);
    console.log(JSON.stringify(chapter.gameTree, null, 2).substring(0, 1000));
    console.log(`\n=== Notes ===`);
    console.log(chapter.notes);

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkChapterPGN();










