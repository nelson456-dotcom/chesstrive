const mongoose = require('mongoose');
const Study = require('../models/Study');
const Chapter = require('../models/Chapter');

async function checkStudiesChapters() {
  try {
    await mongoose.connect('mongodb://localhost:27017/chessrep');
    console.log('✅ Connected to MongoDB\n');

    const studies = await Study.find({}).limit(5);
    
    for (const study of studies) {
      console.log(`\n📚 Study: ${study.name}`);
      console.log(`   Chapters array length: ${study.chapters.length}`);
      console.log(`   Chapter IDs: ${study.chapters.slice(0, 3).join(', ')}...`);
      
      // Get actual chapters
      const chapters = await Chapter.find({ _id: { $in: study.chapters } });
      console.log(`   Actual chapters found: ${chapters.length}`);
      
      if (chapters.length > 0) {
        console.log(`   First 3 chapter names:`);
        chapters.slice(0, 3).forEach((ch, i) => {
          console.log(`      ${i + 1}. ${ch.name}`);
          console.log(`         - studyId: ${ch.studyId}`);
          console.log(`         - matches study: ${ch.studyId.toString() === study._id.toString()}`);
        });
      }
      
      // Check if chapters belong to this study
      const wrongStudyChapters = chapters.filter(ch => ch.studyId.toString() !== study._id.toString());
      if (wrongStudyChapters.length > 0) {
        console.log(`   ⚠️ WARNING: ${wrongStudyChapters.length} chapters belong to different study!`);
      }
    }

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkStudiesChapters();










