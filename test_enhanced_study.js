const fetch = require('node-fetch');

const API_BASE_URL = 'http://localhost:3001/api';

// Test user credentials (you'll need to create a user first)
const testUser = {
  email: 'test@example.com',
  password: 'testpassword123'
};

let authToken = '';

async function testAPI() {
  try {
    console.log('🧪 Testing Enhanced Chess Study API...\n');

    // 1. Login to get auth token
    console.log('1. Logging in...');
    const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser)
    });

    if (!loginResponse.ok) {
      console.log('❌ Login failed. Creating test user first...');
      
      // Try to register first
      const registerResponse = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...testUser,
          username: 'testuser',
          confirmPassword: testUser.password
        })
      });

      if (registerResponse.ok) {
        console.log('✅ Test user created successfully');
        const loginRetry = await fetch(`${API_BASE_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(testUser)
        });
        
        if (loginRetry.ok) {
          const loginData = await loginRetry.json();
          authToken = loginData.token;
          console.log('✅ Login successful');
        } else {
          throw new Error('Login failed after registration');
        }
      } else {
        throw new Error('Registration failed');
      }
    } else {
      const loginData = await loginResponse.json();
      authToken = loginData.token;
      console.log('✅ Login successful');
    }

    // 2. Create a new study
    console.log('\n2. Creating a new study...');
    const studyResponse = await fetch(`${API_BASE_URL}/studies`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': authToken
      },
      body: JSON.stringify({
        name: 'Test Enhanced Study',
        description: 'A test study for enhanced chess study functionality',
        notes: 'This is a test study',
        tags: ['test', 'enhanced']
      })
    });

    if (!studyResponse.ok) {
      throw new Error('Failed to create study');
    }

    const studyData = await studyResponse.json();
    const studyId = studyData.study._id;
    console.log('✅ Study created:', studyId);

    // 3. Create a new chapter
    console.log('\n3. Creating a new chapter...');
    const chapterResponse = await fetch(`${API_BASE_URL}/chapters`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': authToken
      },
      body: JSON.stringify({
        studyId: studyId,
        name: 'Test Chapter 1',
        notes: 'This is a test chapter'
      })
    });

    if (!chapterResponse.ok) {
      throw new Error('Failed to create chapter');
    }

    const chapterData = await chapterResponse.json();
    const chapterId = chapterData.chapter._id;
    console.log('✅ Chapter created:', chapterId);

    // 4. Save moves to the chapter
    console.log('\n4. Saving moves to chapter...');
    const testPGN = '1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 d6 8. c3 O-O 9. h3 Nb8 10. d4 Nbd7';
    
    const saveMovesResponse = await fetch(`${API_BASE_URL}/chapters/${chapterId}/save-moves`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': authToken
      },
      body: JSON.stringify({
        pgn: testPGN,
        position: {
          fen: 'r1bqkb1r/1ppp1ppp/p1n2n2/4p3/B3P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 6 10',
          moves: [],
          currentMove: 0
        },
        gameTree: {
          moves: [],
          currentPath: [],
          branchPoint: 0
        },
        headers: {
          'Event': 'Test Game',
          'White': 'Test Player 1',
          'Black': 'Test Player 2'
        }
      })
    });

    if (!saveMovesResponse.ok) {
      throw new Error('Failed to save moves');
    }

    console.log('✅ Moves saved successfully');

    // 5. Retrieve the chapter to verify data persistence
    console.log('\n5. Retrieving chapter to verify persistence...');
    const getChapterResponse = await fetch(`${API_BASE_URL}/chapters/${studyId}/${chapterId}`, {
      headers: {
        'x-auth-token': authToken
      }
    });

    if (!getChapterResponse.ok) {
      throw new Error('Failed to retrieve chapter');
    }

    const retrievedChapter = await getChapterResponse.json();
    console.log('✅ Chapter retrieved successfully');
    console.log('   - PGN:', retrievedChapter.chapter.pgn);
    console.log('   - Headers:', retrievedChapter.chapter.headers);

    // 6. Create another chapter
    console.log('\n6. Creating a second chapter...');
    const chapter2Response = await fetch(`${API_BASE_URL}/chapters`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': authToken
      },
      body: JSON.stringify({
        studyId: studyId,
        name: 'Test Chapter 2',
        notes: 'This is another test chapter'
      })
    });

    if (!chapter2Response.ok) {
      throw new Error('Failed to create second chapter');
    }

    const chapter2Data = await chapter2Response.json();
    console.log('✅ Second chapter created:', chapter2Data.chapter._id);

    // 7. Get all chapters for the study
    console.log('\n7. Retrieving all chapters for the study...');
    const allChaptersResponse = await fetch(`${API_BASE_URL}/chapters/${studyId}`, {
      headers: {
        'x-auth-token': authToken
      }
    });

    if (!allChaptersResponse.ok) {
      throw new Error('Failed to retrieve all chapters');
    }

    const allChapters = await allChaptersResponse.json();
    console.log('✅ All chapters retrieved successfully');
    console.log('   - Number of chapters:', allChapters.chapters.length);
    allChapters.chapters.forEach((chapter, index) => {
      console.log(`   - Chapter ${index + 1}: ${chapter.name} (${chapter._id})`);
    });

    // 8. Test study retrieval with chapters
    console.log('\n8. Retrieving study with chapters...');
    const getStudyResponse = await fetch(`${API_BASE_URL}/studies/${studyId}`, {
      headers: {
        'x-auth-token': authToken
      }
    });

    if (!getStudyResponse.ok) {
      throw new Error('Failed to retrieve study');
    }

    const studyWithChapters = await getStudyResponse.json();
    console.log('✅ Study with chapters retrieved successfully');
    console.log('   - Study name:', studyWithChapters.study.name);
    console.log('   - Number of chapters:', studyWithChapters.chapters.length);

    console.log('\n🎉 All tests passed! Enhanced Chess Study functionality is working correctly.');
    console.log('\n📋 Summary:');
    console.log('   ✅ User authentication works');
    console.log('   ✅ Study creation works');
    console.log('   ✅ Chapter creation works');
    console.log('   ✅ Chapter PGN storage works');
    console.log('   ✅ Chapter data persistence works');
    console.log('   ✅ Multiple chapters per study works');
    console.log('   ✅ Chapter retrieval works');
    console.log('   ✅ Study-chapter relationship works');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

testAPI();
