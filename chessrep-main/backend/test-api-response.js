const mongoose = require('mongoose');
const Study = require('./models/Study');
const Chapter = require('./models/Chapter');

async function testAPIResponse() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect('mongodb://localhost:27017/chessrep', {
      serverSelectionTimeoutMS: 5000,
    });
    
    console.log('✅ MongoDB Connected');
    
    // Simulate the exact API call that the frontend makes
    console.log('\n📚 Testing API Response (simulating frontend call):');
    
    // This is the exact query from studies.js
    const studies = await Study.find({
      $or: [
        { authorId: '68e59ef29295f3e5c2696e6b' }, // Using the user ID from our test
        { 'collaborators.userId': '68e59ef29295f3e5c2696e6b' }
      ]
    })
    .populate('chapters') // This is the key part!
    .sort({ updatedAt: -1 });

    console.log(`Found ${studies.length} studies for user`);
    
    // Format exactly like the API does
    const formattedStudies = studies.map(study => {
      const isOwner = study.authorId.toString() === '68e59ef29295f3e5c2696e6b';
      
      console.log(`\nStudy: ${study.name}`);
      console.log(`  ID: ${study._id}`);
      console.log(`  Author: ${study.authorId}`);
      console.log(`  Chapters count: ${study.chapters ? study.chapters.length : 0}`);
      
      if (study.chapters && study.chapters.length > 0) {
        study.chapters.forEach((chapter, index) => {
          console.log(`    Chapter ${index + 1}:`);
          console.log(`      ID: ${chapter._id}`);
          console.log(`      Name: ${chapter.name}`);
          console.log(`      Has ID: ${!!chapter._id}`);
          console.log(`      Has Name: ${!!chapter.name}`);
          console.log(`      Name Length: ${chapter.name?.length || 0}`);
        });
      }
      
      return {
        _id: study._id,
        name: study.name,
        description: study.description,
        authorId: study.authorId,
        chapters: study.chapters || [],
        chapterCount: (study.chapters || []).length,
        isPublic: study.isPublic,
        tags: study.tags || [],
        createdAt: study.createdAt,
        updatedAt: study.updatedAt,
        isOwner,
        userAccess: {
          hasAccess: true,
          permission: isOwner ? 'admin' : 'viewer'
        }
      };
    });

    console.log('\n📦 Final formatted response:');
    formattedStudies.forEach((study, index) => {
      console.log(`\nStudy ${index + 1}: ${study.name}`);
      console.log(`  Chapters: ${study.chapters.length}`);
      study.chapters.forEach((chapter, chapterIndex) => {
        console.log(`    Chapter ${chapterIndex + 1}: ${chapter.name} (ID: ${chapter._id})`);
      });
    });
    
    await mongoose.disconnect();
    console.log('\n✅ Test completed');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    await mongoose.disconnect();
  }
}

testAPIResponse();
