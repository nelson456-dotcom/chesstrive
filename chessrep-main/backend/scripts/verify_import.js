const mongoose = require('mongoose');
const Study = require('../models/Study');
const Chapter = require('../models/Chapter');

async function verifyImport() {
  try {
    await mongoose.connect('mongodb://localhost:27017/chessrep');
    console.log('✅ Connected to MongoDB\n');

    const studies = await Study.find({}).sort({ createdAt: -1 }).limit(10);
    console.log(`📚 Total studies in database: ${await Study.countDocuments()}`);
    console.log(`📄 Total chapters in database: ${await Chapter.countDocuments()}\n`);

    console.log('📋 Last 10 studies imported:\n');
    for (const study of studies) {
      console.log(`📚 "${study.name}"`);
      console.log(`   - Chapters: ${study.chapters.length}`);
      console.log(`   - Tags: ${study.tags.join(', ')}`);
      console.log(`   - Created: ${study.createdAt.toISOString()}\n`);
    }

    // Check a specific study with its chapters
    const ponzianiStudy = await Study.findOne({ name: 'The Poisonous Ponziani!' });
    if (ponzianiStudy) {
      console.log(`\n🔍 Checking "The Poisonous Ponziani!" study:`);
      console.log(`   - Study ID: ${ponzianiStudy._id}`);
      console.log(`   - Number of chapters: ${ponzianiStudy.chapters.length}`);
      
      const chapters = await Chapter.find({ studyId: ponzianiStudy._id });
      console.log(`   - Chapters in DB: ${chapters.length}`);
      console.log(`\n   📄 Chapters:`);
      chapters.forEach((ch, i) => {
        console.log(`      ${i + 1}. ${ch.name}`);
        console.log(`         - Has PGN: ${ch.pgn ? 'Yes' : 'No'} (${ch.pgn?.length || 0} chars)`);
        console.log(`         - Has notes: ${ch.notes ? 'Yes' : 'No'} (${ch.notes?.length || 0} chars)`);
        console.log(`         - Moves: ${ch.gameTree?.moves?.length || 0}`);
      });
    }

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

verifyImport();










