const mongoose = require('mongoose');
const Study = require('./models/Study');
const Chapter = require('./models/Chapter');
const jwt = require('jsonwebtoken');

async function testWithAuth() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect('mongodb://localhost:27017/chessrep', {
      serverSelectionTimeoutMS: 5000,
    });
    
    console.log('✅ MongoDB Connected');
    
    // Get a user ID from the database (we know 68e59ef29295f3e5c2696e6b has studies)
    const userId = '68e59ef29295f3e5c2696e6b';
    
    // Create a test JWT token (simulate what the frontend would have)
    const testToken = jwt.sign(
      { user: { id: userId } },
      'your-secret-key', // This should match your JWT secret
      { expiresIn: '24h' }
    );
    
    console.log('🔐 Test token created:', testToken.substring(0, 50) + '...');
    
    // Test the exact API endpoint with authentication
    console.log('\n📚 Testing API endpoint with auth...');
    
    const response = await fetch('http://localhost:3001/api/studies', {
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': testToken
      }
    });
    
    console.log('Response status:', response.status);
    console.log('Response ok:', response.ok);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ API Response:', JSON.stringify(data, null, 2));
      
      if (data.success && data.studies) {
        console.log(`\n📚 Found ${data.studies.length} studies`);
        data.studies.forEach((study, index) => {
          console.log(`\nStudy ${index + 1}: ${study.name}`);
          console.log(`  Chapters: ${study.chapters.length}`);
          study.chapters.forEach((chapter, chapterIndex) => {
            console.log(`    Chapter ${chapterIndex + 1}: ${chapter.name} (ID: ${chapter._id})`);
          });
        });
      }
    } else {
      const errorData = await response.text();
      console.log('❌ API Error:', errorData);
    }
    
    await mongoose.disconnect();
    console.log('\n✅ Test completed');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    await mongoose.disconnect();
  }
}

testWithAuth();
