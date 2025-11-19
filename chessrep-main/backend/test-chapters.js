const mongoose = require('mongoose');
const Chapter = require('./models/Chapter');
const Study = require('./models/Study');

async function testChapters() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect('mongodb://localhost:27017/chessrep', {
      serverSelectionTimeoutMS: 5000,
    });
    
    console.log('✅ MongoDB Connected');
    
    // Check all studies
    console.log('\n📚 All Studies:');
    const studies = await Study.find({}).populate('chapters');
    console.log(`Found ${studies.length} studies`);
    
    studies.forEach((study, index) => {
      console.log(`\nStudy ${index + 1}:`);
      console.log(`  ID: ${study._id}`);
      console.log(`  Name: ${study.name}`);
      console.log(`  Author: ${study.authorId}`);
      console.log(`  Chapters: ${study.chapters ? study.chapters.length : 0}`);
      
      if (study.chapters && study.chapters.length > 0) {
        study.chapters.forEach((chapter, chapterIndex) => {
          console.log(`    Chapter ${chapterIndex + 1}:`);
          console.log(`      ID: ${chapter._id}`);
          console.log(`      Name: ${chapter.name}`);
          console.log(`      Study ID: ${chapter.studyId}`);
          console.log(`      Created: ${chapter.createdAt}`);
        });
      }
    });
    
    // Check all chapters directly
    console.log('\n📖 All Chapters:');
    const chapters = await Chapter.find({});
    console.log(`Found ${chapters.length} chapters`);
    
    chapters.forEach((chapter, index) => {
      console.log(`\nChapter ${index + 1}:`);
      console.log(`  ID: ${chapter._id}`);
      console.log(`  Name: ${chapter.name}`);
      console.log(`  Study ID: ${chapter.studyId}`);
      console.log(`  Created: ${chapter.createdAt}`);
      console.log(`  Has Position: ${!!chapter.position}`);
      console.log(`  Has Game Tree: ${!!chapter.gameTree}`);
    });
    
    await mongoose.disconnect();
    console.log('\n✅ Test completed');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    await mongoose.disconnect();
  }
}

testChapters();
