const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Study = require('../models/Study');
const Chapter = require('../models/Chapter');
const User = require('../models/User');

// Directory containing the Lichess PGN files
const LICHESS_STUDIES_DIR = 'C:\\Users\\Nizar\\Desktop\\chessrep-main - Copy\\lichess_studies';

// Parse multi-chapter PGN into individual chapters (EXACT SAME LOGIC AS FRONTEND)
function parseMultiChapterPGN(pgnText) {
  console.log('🔍 Parsing multi-chapter PGN...');
  
  const chapters = [];
  const sections = pgnText.split(/(?=\[Event)/);
  
  for (let i = 0; i < sections.length; i++) {
    const section = sections[i].trim();
    if (!section) continue;
    
    try {
      const lines = section.split('\n');
      const metadata = {};
      let moveText = '';
      
      // Parse metadata
      for (let line of lines) {
        if (line.startsWith('[')) {
          const match = line.match(/\[(\w+)\s"([^"]+)"\]/);
          if (match) {
            metadata[match[1]] = match[2];
          }
        } else {
          moveText += ' ' + line;
        }
      }
      
      // Extract commentary text BEFORE cleaning
      const commentMatches = moveText.match(/\{([^}]+)\}/g);
      let commentaryText = '';
      if (commentMatches) {
        commentaryText = commentMatches
          .map(c => c.replace(/[{}]/g, '').trim()) // Remove braces
          .filter(c => !c.startsWith('[%')) // Remove Lichess annotations like [%csl, [%cal
          .join('\n\n'); // Join with double newlines for readability
      }
      
      // Clean move text
      moveText = moveText
        .replace(/\d+\./g, '') // Remove move numbers
        .replace(/\{\[%[^\]]*\]\}/g, '') // Remove annotations
        .replace(/\{[^}]*\}/g, '') // Remove comments
        .replace(/\s+/g, ' ') // Normalize spaces
        .trim();
      
      if (moveText && metadata.Event) {
        chapters.push({
          name: metadata.ChapterName || metadata.Event || `Chapter ${i + 1}`,
          studyName: metadata.StudyName || 'Imported Study',
          pgn: section, // STORE THE FULL PGN - THIS IS CRITICAL!
          position: metadata.FEN || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
          notes: commentaryText // Store extracted commentary in notes field
        });
      }
    } catch (error) {
      console.warn(`⚠️ Failed to parse chapter ${i + 1}:`, error);
    }
  }
  
  console.log(`📚 Parsed ${chapters.length} chapters from PGN`);
  return chapters;
}

async function importLichessStudies() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/chessrep');
    console.log('✅ Connected to MongoDB');

    // Delete all existing studies and chapters first
    console.log('\n🗑️ Clearing existing studies and chapters...');
    const chapterResult = await Chapter.deleteMany({});
    console.log(`🗑️ Deleted ${chapterResult.deletedCount} chapters`);
    const studyResult = await Study.deleteMany({});
    console.log(`🗑️ Deleted ${studyResult.deletedCount} studies\n`);

    // Get or create system user for imports
    let systemUser = await User.findOne({ username: 'lichess_import' });
    if (!systemUser) {
      console.log('📝 Creating system user for imports...');
      systemUser = new User({
        username: 'lichess_import',
        email: 'lichess_import@system.local',
        password: 'not_a_real_password_' + Date.now(),
        rating: 1500
      });
      await systemUser.save();
      console.log('✅ System user created:', systemUser._id);
    } else {
      console.log('✅ Using existing system user:', systemUser._id);
    }

    // Read all PGN files from the directory
    const files = fs.readdirSync(LICHESS_STUDIES_DIR)
      .filter(file => file.endsWith('.pgn'));

    console.log(`\n📚 Found ${files.length} PGN files to import\n`);

    let totalStudies = 0;
    let totalChapters = 0;

    for (const filename of files) {
      const filePath = path.join(LICHESS_STUDIES_DIR, filename);
      const pgnContent = fs.readFileSync(filePath, 'utf-8');

      console.log(`\n📖 Processing: ${filename}`);

      // Parse the multi-chapter PGN using the SAME logic as frontend
      const chapters = parseMultiChapterPGN(pgnContent);

      if (chapters.length === 0) {
        console.log(`⚠️ No chapters found in ${filename}, skipping...`);
        continue;
      }

      // Extract study name from first chapter
      const studyName = chapters[0].studyName || filename.replace('.pgn', '');

      console.log(`📚 Creating study: "${studyName}" with ${chapters.length} chapters`);

      // Create the study
      const study = new Study({
        name: studyName,
        description: `Imported from Lichess: ${filename}`,
        authorId: systemUser._id,
        isPublic: true,
        tags: ['lichess', 'imported'],
        chapters: [],
        collaborators: []
      });

      await study.save();
      totalStudies++;

      // Create chapters for this study
      const chapterIds = [];
      for (let i = 0; i < chapters.length; i++) {
        const chapterData = chapters[i];

        const chapter = new Chapter({
          name: chapterData.name,
          studyId: study._id,
          position: chapterData.position,
          pgn: chapterData.pgn, // STORE THE FULL PGN!
          notes: chapterData.notes || '',
          gameTree: { moves: [], variations: [] }, // Empty - frontend will parse from PGN
          currentPath: [],
          currentMoveIndex: 0
        });

        await chapter.save();
        chapterIds.push(chapter._id);
        totalChapters++;

        console.log(`  ✅ Chapter ${i + 1}/${chapters.length}: ${chapterData.name}`);
      }

      // Update study with chapter IDs
      study.chapters = chapterIds;
      await study.save();

      console.log(`✅ Study "${studyName}" imported successfully!`);
    }

    console.log(`\n🎉 Import complete!`);
    console.log(`📚 Total studies imported: ${totalStudies}`);
    console.log(`📄 Total chapters created: ${totalChapters}`);

  } catch (error) {
    console.error('❌ Error during import:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  }
}

// Run the import
importLichessStudies();

