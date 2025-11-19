const mongoose = require('mongoose');
const Study = require('./models/Study');
const Chapter = require('./models/Chapter');

async function testPopulation() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect('mongodb://localhost:27017/chessrep', {
      serverSelectionTimeoutMS: 5000,
    });
    
    console.log('✅ MongoDB Connected');
    
    // Test population directly
    console.log('\n📚 Testing chapter population...');
    
    const study = await Study.findOne({ name: 'new' })
      .populate('chapters');
    
    if (study) {
      console.log(`\nStudy: ${study.name}`);
      console.log(`Chapters count: ${study.chapters ? study.chapters.length : 0}`);
      
      if (study.chapters && study.chapters.length > 0) {
        console.log('\nChapter details:');
        study.chapters.forEach((chapter, index) => {
          console.log(`  Chapter ${index + 1}:`);
          console.log(`    ID: ${chapter._id}`);
          console.log(`    Name: ${chapter.name}`);
          console.log(`    Type: ${typeof chapter}`);
          console.log(`    Is Object: ${typeof chapter === 'object'}`);
          console.log(`    Keys: ${Object.keys(chapter)}`);
        });
      }
    } else {
      console.log('❌ Study not found');
    }
    
    // Test with explicit population options
    console.log('\n📚 Testing with explicit population...');
    
    const study2 = await Study.findOne({ name: 'new' })
      .populate({
        path: 'chapters',
        model: 'Chapter'
      });
    
    if (study2) {
      console.log(`\nStudy: ${study2.name}`);
      console.log(`Chapters count: ${study2.chapters ? study2.chapters.length : 0}`);
      
      if (study2.chapters && study2.chapters.length > 0) {
        console.log('\nChapter details:');
        study2.chapters.forEach((chapter, index) => {
          console.log(`  Chapter ${index + 1}:`);
          console.log(`    ID: ${chapter._id}`);
          console.log(`    Name: ${chapter.name}`);
          console.log(`    Type: ${typeof chapter}`);
          console.log(`    Is Object: ${typeof chapter === 'object'}`);
        });
      }
    }
    
    await mongoose.disconnect();
    console.log('\n✅ Test completed');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
    await mongoose.disconnect();
  }
}

testPopulation();
