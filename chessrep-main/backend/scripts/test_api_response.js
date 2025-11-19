const mongoose = require('mongoose');
const Study = require('../models/Study');
const Chapter = require('../models/Chapter');
const User = require('../models/User');

async function testAPIResponse() {
  try {
    await mongoose.connect('mongodb://localhost:27017/chessrep');
    console.log('✅ Connected to MongoDB\n');

    // Simulate what the API does
    const studies = await Study.find({})
      .populate('authorId', 'username email')
      .sort({ updatedAt: -1 })
      .limit(3);
    
    console.log(`Found ${studies.length} studies\n`);
    
    // MANUAL CHAPTER FETCHING - WORKAROUND FOR POPULATION ISSUE
    for (let study of studies) {
      console.log(`\n📚 Processing study: ${study.name}`);
      console.log(`   Chapter IDs in study.chapters: ${study.chapters.slice(0, 3).join(', ')}...`);
      
      if (study.chapters && study.chapters.length > 0) {
        const chapterIds = study.chapters;
        console.log(`   Fetching ${chapterIds.length} chapters...`);
        const chapters = await Chapter.find({ _id: { $in: chapterIds } });
        console.log(`   Found ${chapters.length} chapters`);
        console.log(`   First 3 chapter names: ${chapters.slice(0, 3).map(c => c.name).join(', ')}`);
        
        study.chapters = chapters; // Replace IDs with full chapter objects
        console.log(`   After replacement, study.chapters length: ${study.chapters.length}`);
        console.log(`   After replacement, first 3: ${study.chapters.slice(0, 3).map(c => c.name).join(', ')}`);
      }
    }
    
    console.log('\n\n=== FINAL CHECK ===');
    studies.forEach((study, idx) => {
      console.log(`\nStudy ${idx + 1}: ${study.name}`);
      console.log(`  Chapters: ${study.chapters.length}`);
      if (study.chapters.length > 0) {
        console.log(`  First chapter: ${study.chapters[0].name}`);
        console.log(`  First chapter ID: ${study.chapters[0]._id}`);
      }
    });

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testAPIResponse();

