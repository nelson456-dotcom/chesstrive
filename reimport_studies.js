/**
 * Re-import Lichess Studies Script
 * 
 * This script reads all PGN files from the lichess_studies folder
 * and imports them into the database using the fixed parser that
 * correctly handles comments, NAGs, and variations.
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');

const STUDIES_FOLDER = path.join(__dirname, 'lichess_studies');
const API_BASE_URL = 'http://localhost:3001/api';
const FRONTEND_URL = 'http://localhost:3000';

// You'll need to set this - get it from localStorage in your browser
// Open DevTools -> Console -> Type: localStorage.getItem('token')
const AUTH_TOKEN = process.env.AUTH_TOKEN || '';

if (!AUTH_TOKEN) {
  console.error('❌ ERROR: AUTH_TOKEN not set!');
  console.error('');
  console.error('Please set your auth token:');
  console.error('1. Open http://localhost:3000 in your browser');
  console.error('2. Open DevTools (F12) -> Console');
  console.error('3. Type: localStorage.getItem("token")');
  console.error('4. Copy the token value');
  console.error('5. Run: AUTH_TOKEN="your-token-here" node reimport_studies.js');
  console.error('');
  process.exit(1);
}

/**
 * Parse a multi-chapter PGN file
 */
function parsePGNFile(content) {
  // Split by empty lines to separate games/chapters
  const chapters = [];
  const games = content.split(/\n\n(?=\[Event)/);
  
  for (const game of games) {
    if (!game.trim()) continue;
    
    const lines = game.split('\n');
    const headers = {};
    let pgn = '';
    let inHeaders = true;
    
    for (const line of lines) {
      if (line.startsWith('[') && line.endsWith(']')) {
        // Parse header
        const match = line.match(/\[(\w+)\s+"(.*)"\]/);
        if (match) {
          headers[match[1]] = match[2];
        }
      } else if (line.trim()) {
        inHeaders = false;
        pgn += line + '\n';
      }
    }
    
    if (headers.ChapterName && pgn.trim()) {
      chapters.push({
        name: headers.ChapterName,
        studyName: headers.StudyName,
        pgn: pgn.trim(),
        headers
      });
    }
  }
  
  return chapters;
}

/**
 * Delete all existing studies
 */
async function deleteAllStudies() {
  try {
    console.log('🗑️  Fetching existing studies...');
    const response = await axios.get(`${API_BASE_URL}/studies`, {
      headers: { Authorization: `Bearer ${AUTH_TOKEN}` }
    });
    
    const studies = response.data;
    console.log(`📊 Found ${studies.length} existing studies`);
    
    for (const study of studies) {
      console.log(`   🗑️  Deleting study: ${study.name} (${study._id})`);
      try {
        await axios.delete(`${API_BASE_URL}/studies/${study._id}`, {
          headers: { Authorization: `Bearer ${AUTH_TOKEN}` }
        });
        console.log(`   ✅ Deleted: ${study.name}`);
      } catch (error) {
        console.error(`   ❌ Failed to delete ${study.name}:`, error.response?.data?.message || error.message);
      }
    }
    
    console.log('✅ All existing studies deleted\n');
  } catch (error) {
    console.error('❌ Error deleting studies:', error.response?.data?.message || error.message);
    throw error;
  }
}

/**
 * Import a single study
 */
async function importStudy(filename, pgnContent) {
  try {
    const chapters = parsePGNFile(pgnContent);
    
    if (chapters.length === 0) {
      console.log(`   ⚠️  No chapters found in ${filename}`);
      return null;
    }
    
    const studyName = chapters[0].studyName || filename.replace('.pgn', '');
    
    console.log(`   📚 Study: ${studyName}`);
    console.log(`   📖 Chapters: ${chapters.length}`);
    
    // Create study
    const studyResponse = await axios.post(
      `${API_BASE_URL}/studies`,
      {
        name: studyName,
        description: `Imported from Lichess (${filename})`,
        isPublic: true
      },
      {
        headers: { Authorization: `Bearer ${AUTH_TOKEN}` }
      }
    );
    
    const study = studyResponse.data;
    console.log(`   ✅ Created study: ${study._id}`);
    
    // Import each chapter
    for (let i = 0; i < chapters.length; i++) {
      const chapter = chapters[i];
      console.log(`      📄 Chapter ${i + 1}/${chapters.length}: ${chapter.name}`);
      
      try {
        // Send the raw PGN to the backend
        // The frontend's lichessStudyService will parse it with the NEW parser
        // that correctly extracts comments and NAGs when the study is loaded
        const chapterResponse = await axios.post(
          `${API_BASE_URL}/chapters`,
          {
            studyId: study._id,
            name: chapter.name,
            notes: '', // Clean notes, no PGN artifacts
            pgn: chapter.pgn,
            position: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
            gameTree: { moves: [], variations: [] },
            currentPath: [],
            currentMoveIndex: 0
          },
          {
            headers: { Authorization: `Bearer ${AUTH_TOKEN}` }
          }
        );
        
        console.log(`      ✅ Imported chapter: ${chapterResponse.data.chapter._id}`);
      } catch (error) {
        console.error(`      ❌ Failed to import chapter "${chapter.name}":`, error.response?.data?.message || error.message);
      }
    }
    
    console.log(`   ✅ Study complete: ${FRONTEND_URL}/enhanced-chess-study?studyId=${study._id}\n`);
    return study;
    
  } catch (error) {
    console.error(`   ❌ Failed to import ${filename}:`, error.response?.data?.message || error.message);
    return null;
  }
}

/**
 * Main function
 */
async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║         Re-import Lichess Studies with Fixed Parser       ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  
  // Check if studies folder exists
  if (!fs.existsSync(STUDIES_FOLDER)) {
    console.error(`❌ ERROR: Studies folder not found: ${STUDIES_FOLDER}`);
    process.exit(1);
  }
  
  // Get all PGN files
  const files = fs.readdirSync(STUDIES_FOLDER)
    .filter(f => f.endsWith('.pgn'))
    .sort();
  
  console.log(`📁 Found ${files.length} PGN files in ${STUDIES_FOLDER}\n`);
  
  if (files.length === 0) {
    console.error('❌ No PGN files found!');
    process.exit(1);
  }
  
  // Ask for confirmation
  console.log('⚠️  WARNING: This will DELETE all existing studies and re-import them!');
  console.log('⚠️  Press Ctrl+C now to cancel, or wait 5 seconds to continue...\n');
  
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  // Delete all existing studies
  await deleteAllStudies();
  
  // Import all studies
  console.log('📥 Starting import...\n');
  
  let successCount = 0;
  let failCount = 0;
  
  for (let i = 0; i < files.length; i++) {
    const filename = files[i];
    console.log(`[${i + 1}/${files.length}] Processing: ${filename}`);
    
    try {
      const content = fs.readFileSync(path.join(STUDIES_FOLDER, filename), 'utf-8');
      const study = await importStudy(filename, content);
      
      if (study) {
        successCount++;
      } else {
        failCount++;
      }
      
      // Rate limiting - be nice to the server
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error) {
      console.error(`   ❌ Error reading ${filename}:`, error.message);
      failCount++;
    }
  }
  
  // Summary
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║                    Import Complete!                        ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log(`✅ Success: ${successCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log(`📊 Total: ${files.length}`);
  console.log(`\n🌐 View studies at: ${FRONTEND_URL}/studies`);
  console.log('');
}

// Run the script
main().catch(error => {
  console.error('\n❌ FATAL ERROR:', error.message);
  process.exit(1);
});

