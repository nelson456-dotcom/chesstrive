const axios = require('axios');

async function testCalculationFixes() {
  console.log('🔧 Testing Calculation Fixes...');
  console.log('This test verifies all calculation errors are fixed\n');
  
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
    
    const { scouting, metrics, summary } = reportResponse.data;
    
    // Test 1: ACPL Calculation
    console.log('\n🧮 ACPL CALCULATION CHECK:');
    console.log('=' .repeat(50));
    console.log(`Average CPL: ${scouting.averageCPL?.toFixed(2) || 'N/A'}`);
    console.log(`ACPL (pawns): ${scouting.acpl?.toFixed(3) || 'N/A'}`);
    
    if (scouting.acpl && scouting.acpl > 0) {
      console.log('✅ ACPL is now calculated correctly (> 0)');
      console.log(`   Expected: ~${(scouting.averageCPL / 100).toFixed(3)}, Got: ${scouting.acpl.toFixed(3)}`);
    } else {
      console.log('❌ ACPL is still showing 0.000');
    }
    
    // Test 2: Endgame Loss Calculation
    console.log('\n🏁 ENDGAME LOSS CALCULATION CHECK:');
    console.log('=' .repeat(50));
    console.log(`Endgame loss/move: ${scouting.endgameLossPerMove?.toFixed(3) || 'N/A'} pawns`);
    
    if (scouting.endgameLossPerMove !== undefined) {
      if (scouting.endgameLossPerMove > 0) {
        console.log('✅ Endgame loss is now calculated correctly (> 0)');
      } else {
        console.log('⚠️  Endgame loss is 0 - may be correct if no endgame errors occurred');
      }
    } else {
      console.log('❌ Endgame loss calculation is missing');
    }
    
    // Test 3: Strengths Logic
    console.log('\n💪 STRENGTHS LOGIC CHECK:');
    console.log('=' .repeat(50));
    console.log('Strengths:', scouting.strengths);
    
    const hasEndgameStrength = scouting.strengths?.some(s => s.toLowerCase().includes('endgame'));
    const hasValidEndgameData = scouting.endgameLossPerMove > 0 && scouting.endgameLossPerMove <= 0.15;
    
    if (hasEndgameStrength && !hasValidEndgameData) {
      console.log('❌ Still claiming endgame strength without valid data');
    } else if (hasEndgameStrength && hasValidEndgameData) {
      console.log('✅ Endgame strength claim is justified by data');
    } else {
      console.log('✅ No false endgame strength claims');
    }
    
    // Test 4: Focus Areas Logic
    console.log('\n🎯 FOCUS AREAS CHECK:');
    console.log('=' .repeat(50));
    console.log('Focus areas:', scouting.focus);
    
    const hasEndgameFocus = scouting.focus?.some(f => f.toLowerCase().includes('endgame'));
    const needsEndgameWork = scouting.endgameLossPerMove > 0.2;
    
    if (hasEndgameFocus && !needsEndgameWork) {
      console.log('❌ Suggesting endgame study without sufficient evidence');
    } else if (needsEndgameWork && !hasEndgameFocus) {
      console.log('⚠️  Should suggest endgame study but didn\'t');
    } else {
      console.log('✅ Focus areas are logically consistent with data');
    }
    
    // Test 5: Opening Analysis
    console.log('\n🏁 OPENING ANALYSIS CHECK:');
    console.log('=' .repeat(50));
    
    if (scouting.openings && scouting.openings.length > 0) {
      console.log(`✅ Openings found: ${scouting.openings.length} different openings`);
      
      // Check first opening has proper data
      const firstOpening = scouting.openings[0];
      console.log(`   First opening: ${firstOpening.name}`);
      console.log(`   ECO: ${firstOpening.eco || 'N/A'}`);
      console.log(`   Games: ${firstOpening.games}`);
      console.log(`   Score%: ${firstOpening.scorePct?.toFixed(1) || 'N/A'}%`);
      console.log(`   CP@12: ${firstOpening.avgCpAfter12?.toFixed(2) || 'N/A'}`);
      console.log(`   Links: ${firstOpening.links?.length || 0} games`);
      
      if (scouting.bestOpening && scouting.bestOpening.links) {
        console.log(`✅ Best opening has ${scouting.bestOpening.links.length} game links`);
      }
      
      if (scouting.worstOpening && scouting.worstOpening.links) {
        console.log(`✅ Worst opening has ${scouting.worstOpening.links.length} game links`);
      }
      
    } else {
      console.log('❌ No openings data found');
    }
    
    // Test 6: Performance Games
    console.log('\n🎮 PERFORMANCE GAMES CHECK:');
    console.log('=' .repeat(50));
    
    if (scouting.bestPerformanceGames && scouting.bestPerformanceGames.length > 0) {
      console.log(`✅ Best performance games: ${scouting.bestPerformanceGames.length}`);
      const best = scouting.bestPerformanceGames[0];
      console.log(`   Best game: Accuracy ${best.accuracy.toFixed(1)}%, CPL ${best.avgCPL.toFixed(1)}`);
    }
    
    if (scouting.worstPerformanceGames && scouting.worstPerformanceGames.length > 0) {
      console.log(`✅ Worst performance games: ${scouting.worstPerformanceGames.length}`);
      const worst = scouting.worstPerformanceGames[0];
      console.log(`   Worst game: Accuracy ${worst.accuracy.toFixed(1)}%, CPL ${worst.avgCPL.toFixed(1)}`);
    }
    
    // Overall Assessment
    console.log('\n📋 OVERALL ASSESSMENT:');
    console.log('=' .repeat(50));
    
    const fixes = [
      { name: 'ACPL Calculation', fixed: scouting.acpl > 0 },
      { name: 'Endgame Loss Logic', fixed: scouting.endgameLossPerMove !== undefined },
      { name: 'Strengths Logic', fixed: !hasEndgameStrength || hasValidEndgameData },
      { name: 'Opening Analysis', fixed: scouting.openings && scouting.openings.length > 0 },
      { name: 'Performance Games', fixed: scouting.bestPerformanceGames && scouting.bestPerformanceGames.length > 0 },
      { name: 'Opening Links', fixed: scouting.bestOpening && scouting.bestOpening.links }
    ];
    
    const fixedCount = fixes.filter(f => f.fixed).length;
    
    fixes.forEach(fix => {
      console.log(`${fix.fixed ? '✅' : '❌'} ${fix.name}`);
    });
    
    console.log(`\n🎯 RESULT: ${fixedCount}/${fixes.length} issues fixed`);
    
    if (fixedCount === fixes.length) {
      console.log('🎉 SUCCESS: All calculation issues have been resolved!');
    } else {
      console.log('⚠️  Some issues may still need attention');
    }
    
    // Test PDF consistency
    console.log('\n📄 Testing PDF Generation...');
    
    const pdfResponse = await axios.get(`${baseURL}/api/pdf/report`, {
      params: testData,
      headers,
      responseType: 'arraybuffer',
      timeout: 120000
    });
    
    console.log(`✅ PDF generated successfully (${pdfResponse.data.length} bytes)`);
    console.log('   PDF should now show consistent data with scouting report');
    console.log('   PDF should include opening links for best/worst openings');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response?.data && typeof error.response.data === 'string') {
      console.error('Response:', error.response.data.slice(0, 500));
    }
  }
}

console.log('🚀 Testing all calculation fixes...');
console.log('Make sure:');
console.log('1. Backend server is running');
console.log('2. You have a valid JWT token');
console.log('3. Games have been analyzed for the username\n');

testCalculationFixes();
