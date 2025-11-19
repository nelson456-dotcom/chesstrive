const mongoose = require('mongoose');
const Study = require('../models/Study');
const Chapter = require('../models/Chapter');

async function testChapterFetch() {
  try {
    await mongoose.connect('mongodb://localhost:27017/chessrep');
    console.log('✅ Connected to MongoDB\n');

    // Test Ponziani study
    const ponziani = await Study.findOne({ name: 'The Poisonous Ponziani!' });
    console.log('=== The Poisonous Ponziani! ===');
    console.log('Study ID:', ponziani._id.toString());
    console.log('Chapter IDs in study.chapters:', ponziani.chapters.slice(0, 3).map(id => id.toString()));
    
    const chapterIds = ponziani.chapters;
    const chapters = await Chapter.find({ _id: { $in: chapterIds } }).limit(3);
    console.log('\nFetched chapters:');
    chapters.forEach(ch => {
      console.log('  -', ch.name, '(ID:', ch._id.toString(), ')');
    });

    // Test Scotch study
    const scotch = await Study.findOne({ name: /Storm With The Scotch/i });
    console.log('\n\n=== Storm With The Scotch ===');
    console.log('Study ID:', scotch._id.toString());
    console.log('Chapter IDs in study.chapters:', scotch.chapters.slice(0, 3).map(id => id.toString()));
    
    const chapterIds2 = scotch.chapters;
    const chapters2 = await Chapter.find({ _id: { $in: chapterIds2 } }).limit(3);
    console.log('\nFetched chapters:');
    chapters2.forEach(ch => {
      console.log('  -', ch.name, '(ID:', ch._id.toString(), ')');
    });

    await mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.connection.close();
  }
}

testChapterFetch();










