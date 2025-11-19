const axios = require('axios');

async function testScoutingFix() {
  console.log('🔍 Testing Scouting Report Fix...');
  console.log('This test verifies that all scouting data is now present\n');
  
  const testData = {
    username: 'alver87',
    timeClass: '',
    platform: 'chesscom'
  };
  
  const authToken = 'your-jwt-token-here'; // Replace with real token
  const baseURL = 'http://localhost:3001';
  
  if (authToken === 'your-jwt-token-here') {
    console.log('❌ Please update the authToken variable with a real JWT token');
    return;
  }
  
  const headers = {
    'Authorization': `Bearer ${authToken}`,
    'Content-Type': 'application/json'
  };
  
  try {
    console.log('📊 Testing Report Analysis...');
    
    const reportResponse = await axios.get(`${baseURL}/api/games/report/40`, {
      params: testData,
      headers,
      timeout: 300000 // 5 minutes
    });
    
    console.log('✅ Report analysis completed!');
    
    const scouting = reportResponse.data.scouting;
    
    // Check for opening analysis
    console.log('\n🏁 OPENING ANALYSIS CHECK:');
    console.log('=' .repeat(50));
    
    if (scouting.openings && scouting.openings.length > 0) {
      console.log(`✅ Openings found: ${scouting.openings.length} different openings`);
      
      // Show first few openings
      scouting.openings.slice(0, 3).forEach((opening, i) => {
        console.log(`   ${i + 1}. ${opening.eco || 'NA'} - ${opening.name}`);
        console.log(`      Games: ${opening.games}, Score: ${opening.scorePct.toFixed(1)}%`);
        console.log(`      CP@12: ${opening.avgCpAfter12?.toFixed(2) || 'N/A'}`);
      });
      
      if (scouting.bestOpening) {
        console.log(`✅ Best opening: ${scouting.bestOpening.name} (${scouting.bestOpening.scorePct.toFixed(1)}%)`);
      } else {
        console.log('⚠️  Best opening not found');
      }
      
      if (scouting.worstOpening) {
        console.log(`✅ Worst opening: ${scouting.worstOpening.name} (${scouting.worstOpening.scorePct.toFixed(1)}%)`);
      } else {
        console.log('⚠️  Worst opening not found');
      }
      
    } else {
      console.log('❌ No openings data found!');
    }
    
    // Check for performance games
    console.log('\n🎯 PERFORMANCE GAMES CHECK:');
    console.log('=' .repeat(50));
    
    if (scouting.bestPerformanceGames && scouting.bestPerformanceGames.length > 0) {
      console.log(`✅ Best performance games: ${scouting.bestPerformanceGames.length} games`);
      scouting.bestPerformanceGames.slice(0, 2).forEach((game, i) => {
        console.log(`   ${i + 1}. Accuracy: ${game.accuracy.toFixed(1)}%, CPL: ${game.avgCPL.toFixed(1)}`);
        console.log(`      Blunders: ${game.blunders}, Mistakes: ${game.mistakes}`);
      });
    } else {
      console.log('❌ No best performance games found!');
    }
    
    if (scouting.worstPerformanceGames && scouting.worstPerformanceGames.length > 0) {
      console.log(`✅ Worst performance games: ${scouting.worstPerformanceGames.length} games`);
      scouting.worstPerformanceGames.slice(0, 2).forEach((game, i) => {
        console.log(`   ${i + 1}. Accuracy: ${game.accuracy.toFixed(1)}%, CPL: ${game.avgCPL.toFixed(1)}`);
        console.log(`      Blunders: ${game.blunders}, Mistakes: ${game.mistakes}`);
      });
    } else {
      console.log('❌ No worst performance games found!');
    }
    
    // Overall scouting summary
    console.log('\n📈 OVERALL SCOUTING SUMMARY:');
    console.log('=' .repeat(50));
    console.log(`Best move rate: ${scouting.bestMoveRate?.toFixed(1) || 'N/A'}%`);
    console.log(`Accuracy: ${scouting.accuracyPercent?.toFixed(1) || 'N/A'}%`);
    console.log(`Blunders per game: ${scouting.blundersPerGame?.toFixed(2) || 'N/A'}`);
    console.log(`Average CPL: ${scouting.averageCPL?.toFixed(1) || 'N/A'}`);
    
    if (scouting.strengths && scouting.strengths.length > 0) {
      console.log(`✅ Strengths: ${scouting.strengths.join(', ')}`);
    }
    
    if (scouting.weaknesses && scouting.weaknesses.length > 0) {
      console.log(`⚠️  Weaknesses: ${scouting.weaknesses.join(', ')}`);
    }
    
    console.log('\n🎉 SCOUTING FIX VERIFICATION:');
    const hasOpenings = scouting.openings && scouting.openings.length > 0;
    const hasBestGames = scouting.bestPerformanceGames && scouting.bestPerformanceGames.length > 0;
    const hasWorstGames = scouting.worstPerformanceGames && scouting.worstPerformanceGames.length > 0;
    
    if (hasOpenings && hasBestGames && hasWorstGames) {
      console.log('✅ SUCCESS: All scouting data is now present!');
      console.log('   - Opening analysis: ✅');
      console.log('   - Best performance games: ✅');  
      console.log('   - Worst performance games: ✅');
    } else {
      console.log('⚠️  PARTIAL: Some scouting data may still be missing');
      console.log(`   - Opening analysis: ${hasOpenings ? '✅' : '❌'}`);
      console.log(`   - Best performance games: ${hasBestGames ? '✅' : '❌'}`);
      console.log(`   - Worst performance games: ${hasWorstGames ? '✅' : '❌'}`);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response?.data) {
      console.error('Response:', error.response.data);
    }
  }
}

console.log('🚀 Testing scouting report completeness...');
console.log('Make sure:');
console.log('1. Backend server is running');
console.log('2. You have a valid JWT token');
console.log('3. Games have been imported for the username\n');

testScoutingFix();
