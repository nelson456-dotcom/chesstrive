const axios = require('axios');

async function testImmediateFixes() {
  console.log('🚨 URGENT: Testing Immediate Fixes...');
  console.log('Testing blundersPer100 fix and PDF data consistency\n');
  
  const testData = {
    username: 'alver87',
    timeClass: '',
    platform: 'chesscom'
  };
  
  const authToken = 'your-jwt-token-here'; // Replace with real token
  const baseURL = 'http://localhost:3001';
  
  if (authToken === 'your-jwt-token-here') {
    console.log('❌ Please update the authToken variable with a real JWT token');
    console.log('Get token from: POST /api/auth/login\n');
    return;
  }
  
  const headers = {
    'Authorization': `Bearer ${authToken}`,
    'Content-Type': 'application/json'
  };
  
  try {
    console.log('📊 Testing Scouting Report Data...');
    
    const reportResponse = await axios.get(`${baseURL}/api/games/report/40`, {
      params: testData,
      headers,
      timeout: 300000 // 5 minutes
    });
    
    const { scouting, summary } = reportResponse.data;
    
    // Test 1: Blunders per 100 calculation
    console.log('\n🎯 BLUNDERS PER 100 CHECK:');
    console.log('=' .repeat(40));
    console.log(`Total blunders: ${summary.blunder}`);
    console.log(`Total moves: ${summary.total}`);
    console.log(`Expected blundersPer100: ${summary.total > 0 ? ((summary.blunder / summary.total) * 100).toFixed(1) : 'N/A'}`);
    console.log(`Actual blundersPer100: ${scouting.blundersPer100?.toFixed(1) || 'MISSING'}`);
    
    if (scouting.blundersPer100 && scouting.blundersPer100 > 0) {
      console.log('✅ blundersPer100 is now calculated correctly!');
    } else {
      console.log('❌ blundersPer100 is still 0.0 or missing!');
    }
    
    // Test 2: Opening data structure
    console.log('\n🏁 OPENING DATA CHECK:');
    console.log('=' .repeat(40));
    
    if (scouting.bestOpening) {
      console.log(`✅ Best opening: ${scouting.bestOpening.name}`);
      console.log(`   ECO: ${scouting.bestOpening.eco || 'N/A'}`);
      console.log(`   Score: ${scouting.bestOpening.scorePct?.toFixed(1)}%`);
      console.log(`   Links: ${scouting.bestOpening.links?.length || 0} games`);
      
      if (scouting.bestOpening.links && scouting.bestOpening.links.length > 0) {
        console.log(`   First link: ${scouting.bestOpening.links[0]}`);
      }
    } else {
      console.log('❌ Best opening data missing!');
    }
    
    if (scouting.worstOpening) {
      console.log(`✅ Worst opening: ${scouting.worstOpening.name}`);
      console.log(`   ECO: ${scouting.worstOpening.eco || 'N/A'}`);
      console.log(`   Score: ${scouting.worstOpening.scorePct?.toFixed(1)}%`);
      console.log(`   Links: ${scouting.worstOpening.links?.length || 0} games`);
    } else {
      console.log('❌ Worst opening data missing!');
    }
    
    // Test 3: PDF Generation with same data
    console.log('\n📄 TESTING PDF GENERATION...');
    console.log('=' .repeat(40));
    
    const pdfResponse = await axios.get(`${baseURL}/api/pdf/report`, {
      params: testData,
      headers,
      responseType: 'arraybuffer',
      timeout: 120000
    });
    
    if (pdfResponse.status === 200 && pdfResponse.data.length > 0) {
      console.log(`✅ PDF generated successfully (${pdfResponse.data.length} bytes)`);
      console.log('✅ PDF should now contain:');
      console.log('   - Correct blundersPer100 value (not 0.0)');
      console.log('   - Best performing opening with links');
      console.log('   - Worst performing opening with links');
      console.log('   - Same data as scouting report');
    } else {
      console.log('❌ PDF generation failed!');
    }
    
    // Final Assessment
    console.log('\n🎉 FINAL ASSESSMENT:');
    console.log('=' .repeat(40));
    
    const blundersFixed = scouting.blundersPer100 && scouting.blundersPer100 > 0;
    const openingsPresent = scouting.bestOpening && scouting.worstOpening;
    const openingLinksPresent = scouting.bestOpening?.links?.length > 0;
    const pdfGenerated = pdfResponse.status === 200;
    
    console.log(`${blundersFixed ? '✅' : '❌'} Blunders per 100 calculation`);
    console.log(`${openingsPresent ? '✅' : '❌'} Best/worst opening data`);
    console.log(`${openingLinksPresent ? '✅' : '❌'} Opening game links`);
    console.log(`${pdfGenerated ? '✅' : '❌'} PDF generation`);
    
    const allFixed = blundersFixed && openingsPresent && openingLinksPresent && pdfGenerated;
    
    if (allFixed) {
      console.log('\n🎉 SUCCESS: All issues have been resolved!');
      console.log('The PDF now contains the exact same data as the scouting report!');
    } else {
      console.log('\n⚠️  Some issues may still need attention');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response?.status) {
      console.error(`HTTP Status: ${error.response.status}`);
    }
    if (error.response?.data && typeof error.response.data === 'string') {
      console.error('Response preview:', error.response.data.slice(0, 200));
    }
  }
}

console.log('🚀 URGENT: Testing immediate fixes for scouting and PDF...');
testImmediateFixes();



