const axios = require('axios');

async function testAnalysisEfficiency() {
  console.log('🚀 Testing Analysis Efficiency Fix...');
  console.log('This test verifies that Stockfish analysis only runs ONCE per game\n');
  
  // Test configuration
  const testData = {
    username: 'hikaru',  // Replace with a real username
    timeClass: 'blitz',
    platform: 'chesscom'
  };
  
  const authToken = 'your-jwt-token-here'; // Replace with real token
  const baseURL = 'http://localhost:3001';
  
  if (authToken === 'your-jwt-token-here') {
    console.log('❌ Please update the authToken variable with a real JWT token');
    console.log('Get a token by:');
    console.log('1. POST /api/auth/register (create account)');
    console.log('2. POST /api/auth/login (get token)\n');
    return;
  }
  
  const headers = {
    'Authorization': `Bearer ${authToken}`,
    'Content-Type': 'application/json'
  };
  
  try {
    console.log('📥 Step 1: Import games to database...');
    const importStart = Date.now();
    
    const importResponse = await axios.post(`${baseURL}/api/games/import`, testData, { headers });
    const importTime = Date.now() - importStart;
    
    console.log(`✅ Import completed in ${importTime}ms`);
    console.log(`   Imported: ${importResponse.data.imported} games`);
    console.log(`   Duplicates: ${importResponse.data.duplicates} games\n`);
    
    // Test 1: Real-time analysis (should run Stockfish)
    console.log('🔬 Step 2: First analysis call (should run Stockfish)...');
    const analysis1Start = Date.now();
    
    const analysis1Response = await axios.get(`${baseURL}/api/games/report/40`, {
      params: testData,
      headers
    });
    const analysis1Time = Date.now() - analysis1Start;
    
    console.log(`✅ First analysis completed in ${analysis1Time}ms`);
    console.log('   This should show Stockfish analysis logs\n');
    
    // Test 2: Second analysis call (should use cache)
    console.log('⚡ Step 3: Second analysis call (should use cache)...');
    const analysis2Start = Date.now();
    
    const analysis2Response = await axios.get(`${baseURL}/api/games/report/40`, {
      params: testData,
      headers
    });
    const analysis2Time = Date.now() - analysis2Start;
    
    console.log(`✅ Second analysis completed in ${analysis2Time}ms`);
    console.log('   This should be MUCH faster (using cache)\n');
    
    // Test 3: PDF report (should use cached analysis)
    console.log('📄 Step 4: PDF report generation (should use cache)...');
    const pdfStart = Date.now();
    
    const pdfResponse = await axios.get(`${baseURL}/api/pdf/report`, {
      params: testData,
      headers,
      responseType: 'arraybuffer'
    });
    const pdfTime = Date.now() - pdfStart;
    
    console.log(`✅ PDF report completed in ${pdfTime}ms`);
    console.log(`   PDF size: ${pdfResponse.data.length} bytes\n`);
    
    // Results Summary
    console.log('📊 EFFICIENCY ANALYSIS:');
    console.log('=' .repeat(50));
    console.log(`Import time:           ${importTime}ms`);
    console.log(`First analysis:        ${analysis1Time}ms (with Stockfish)`);
    console.log(`Second analysis:       ${analysis2Time}ms (cached)`);
    console.log(`PDF generation:        ${pdfTime}ms (cached)`);
    console.log('=' .repeat(50));
    
    const speedupFactor = Math.round(analysis1Time / analysis2Time);
    const totalSaved = (analysis1Time - analysis2Time) + (analysis1Time - pdfTime);
    
    console.log(`🚀 Cache speedup:      ${speedupFactor}x faster`);
    console.log(`💰 Time saved:         ${totalSaved}ms total`);
    
    if (analysis2Time < analysis1Time / 2) {
      console.log('✅ SUCCESS: Caching is working efficiently!');
    } else {
      console.log('⚠️  WARNING: Caching may not be working optimally');
    }
    
    console.log('\n🎯 WHAT TO LOOK FOR IN LOGS:');
    console.log('- First call: "[Stockfish] Starting fresh analysis"');
    console.log('- Second call: "[Stockfish] Using memory cache"');
    console.log('- PDF call: "[Stockfish] Using database cache" or "[Stockfish] Using memory cache"');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      console.log('\n💡 Authentication error - check your JWT token');
    } else if (error.response?.status === 404) {
      console.log('\n💡 Games not found - try a different username with public games');
    }
  }
}

console.log('🔧 SETUP CHECKLIST:');
console.log('☐ MongoDB is running');
console.log('☐ Backend server is running (node server.js)');
console.log('☐ You have a valid JWT token');
console.log('☐ Username has public games available');
console.log('☐ Updated testData and authToken variables\n');

testAnalysisEfficiency();
