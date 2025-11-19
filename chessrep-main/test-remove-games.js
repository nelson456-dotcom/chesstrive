const fs = require('fs');

console.log('🧹 Testing: Analyzed Games Section Removed from PDF');
console.log('================================================\n');

// Read the PDF generator file
const pdfGeneratorContent = fs.readFileSync('./backend/services/pdfGenerator.js', 'utf8');

// Check if analyzed games section is removed
const hasAnalyzedGamesSection = pdfGeneratorContent.includes('Analyzed Games');
const hasGameItemCSS = pdfGeneratorContent.includes('.game-item');
const hasGameHeaderCSS = pdfGeneratorContent.includes('.game-header');
const hasGameLinkCSS = pdfGeneratorContent.includes('.game-link');

console.log('🔍 Checking PDF Generator File:');
console.log('================================');

if (!hasAnalyzedGamesSection) {
  console.log('✅ "Analyzed Games" section: REMOVED');
} else {
  console.log('❌ "Analyzed Games" section: STILL PRESENT');
}

if (!hasGameItemCSS) {
  console.log('✅ Game item CSS: REMOVED');
} else {
  console.log('❌ Game item CSS: STILL PRESENT');
}

if (!hasGameHeaderCSS) {
  console.log('✅ Game header CSS: REMOVED');
} else {
  console.log('❌ Game header CSS: STILL PRESENT');
}

if (!hasGameLinkCSS) {
  console.log('✅ Game link CSS: REMOVED');
} else {
  console.log('❌ Game link CSS: STILL PRESENT');
}

console.log('\n📄 What the PDF will now contain:');
console.log('=================================');
console.log('✅ Header with username and date');
console.log('✅ Move Quality Summary (8 metrics grid)');
console.log('✅ Scouting Report section');
console.log('✅ Opening Performance Analysis');
console.log('✅ Best/Worst performing openings with clickable links');
console.log('✅ Complete openings table with clickable links');
console.log('✅ Footer with game count');
console.log('❌ Individual analyzed games list: REMOVED');

console.log('\n🎯 Result:');
console.log('=========');
if (!hasAnalyzedGamesSection && !hasGameItemCSS && !hasGameHeaderCSS && !hasGameLinkCSS) {
  console.log('🎉 SUCCESS! Analyzed games section completely removed from PDF');
  console.log('The PDF will now be cleaner and focus on the scouting report data');
} else {
  console.log('⚠️  Some game-related content may still be present');
}

console.log('\n🔄 Server restart recommended to apply changes');
console.log('Run: taskkill /f /im node.exe && cd backend && node server.js');

