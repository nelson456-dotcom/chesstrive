const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Study = require('../models/Study');
const Chapter = require('../models/Chapter');

const LICHESS_STUDIES_DIR = 'C:\\Users\\Nizar\\Desktop\\chessrep-main - Copy\\lichess_studies';

// Parse a single PGN game/chapter with comments preserved
function parseSinglePGN(pgnText) {
  const lines = pgnText.split('\n');
  const headers = {};
  let moveText = '';
  let inHeaders = true;

  for (let line of lines) {
    line = line.trim();
    if (line.startsWith('[') && line.endsWith(']')) {
      const match = line.match(/\[(\w+)\s+"([^"]+)"\]/);
      if (match) {
        headers[match[1]] = match[2];
      }
    } else if (line.length > 0) {
      inHeaders = false;
      moveText += line + ' ';
    }
  }

  return {
    headers,
    moveText: moveText.trim(),
    fullPgn: pgnText
  };
}

// Split multi-chapter PGN file into individual chapters
function splitPGNIntoChapters(pgnContent) {
  const chapters = [];
  const lines = pgnContent.split('\n');
  let currentChapter = [];
  let inChapter = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Start of a new chapter (Event header)
    if (line.startsWith('[Event ')) {
      if (currentChapter.length > 0) {
        // Save previous chapter
        chapters.push(currentChapter.join('\n'));
        currentChapter = [];
      }
      inChapter = true;
    }
    
    if (inChapter) {
      currentChapter.push(lines[i]);
    }
  }

  // Don't forget the last chapter
  if (currentChapter.length > 0) {
    chapters.push(currentChapter.join('\n'));
  }

  return chapters;
}

// Create empty game tree - frontend will parse the PGN
function createGameTree(moveText) {
  // Don't parse moves here - let the frontend do it from the PGN
  // This avoids issues with move number dots and complex PGN formats
  return {
    moves: [],
    variations: []
  };
}

async function importLichessStudies() {
  try {
    await mongoose.connect('mongodb://localhost:27017/chessrep');
    console.log('✅ Connected to MongoDB');

    // Get or create a system user for imported studies
    const User = require('../models/User');
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

    // Check if directory exists
    if (!fs.existsSync(LICHESS_STUDIES_DIR)) {
      console.error(`❌ Directory not found: ${LICHESS_STUDIES_DIR}`);
      process.exit(1);
    }

    // Get all PGN files
    const files = fs.readdirSync(LICHESS_STUDIES_DIR).filter(f => f.endsWith('.pgn'));
    console.log(`📁 Found ${files.length} PGN files in ${LICHESS_STUDIES_DIR}`);

    let totalStudies = 0;
    let totalChapters = 0;

    // Process each PGN file as a separate study
    for (const filename of files) {
      const filepath = path.join(LICHESS_STUDIES_DIR, filename);
      console.log(`\n📖 Processing: ${filename}`);

      const pgnContent = fs.readFileSync(filepath, 'utf-8');
      
      // Split into chapters
      const chapterPGNs = splitPGNIntoChapters(pgnContent);
      console.log(`   Found ${chapterPGNs.length} chapters`);

      if (chapterPGNs.length === 0) {
        console.log(`   ⚠️ No chapters found, skipping`);
        continue;
      }

      // Parse first chapter to get study name
      const firstChapter = parseSinglePGN(chapterPGNs[0]);
      const studyName = firstChapter.headers.StudyName || firstChapter.headers.Event || filename.replace('.pgn', '');

      console.log(`   📚 Creating study: "${studyName}"`);

      // Create the study
      const study = new Study({
        name: studyName,
        description: `Imported from Lichess: ${filename}`,
        authorId: systemUser._id, // System user for imported studies
        isPublic: true,
        tags: ['lichess', 'imported'],
        chapters: [], // Will be populated with chapter IDs
        collaborators: []
      });

      await study.save();
      totalStudies++;
      console.log(`   ✅ Study created: ${study._id}`);

      // Create chapters for this study
      const chapterIds = [];
      for (let i = 0; i < chapterPGNs.length; i++) {
        const chapterPGN = chapterPGNs[i];
        const parsed = parseSinglePGN(chapterPGN);
        
        const chapterName = parsed.headers.ChapterName || parsed.headers.Event || `Chapter ${i + 1}`;
        console.log(`      📄 Creating chapter ${i + 1}/${chapterPGNs.length}: "${chapterName}"`);

        // Extract comments from PGN for notes
        const comments = [];
        const commentMatches = parsed.moveText.match(/\{([^}]+)\}/g);
        if (commentMatches) {
          commentMatches.forEach(c => {
            comments.push(c.replace(/[{}]/g, '').trim());
          });
        }

        const chapter = new Chapter({
          name: chapterName,
          studyId: study._id,
          notes: comments.length > 0 ? comments.join('\n\n') : (parsed.headers.Annotator ? `Annotated by ${parsed.headers.Annotator}` : ''),
          position: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
          gameTree: createGameTree(parsed.moveText),
          currentPath: [],
          currentMoveIndex: 0,
          pgn: parsed.fullPgn // Store the FULL PGN with comments
        });

        await chapter.save();
        chapterIds.push(chapter._id);
        totalChapters++;
        console.log(`      ✅ Chapter created: ${chapter._id}`);
      }

      // Update study with chapter IDs
      study.chapters = chapterIds;
      await study.save();
      console.log(`   ✅ Study updated with ${chapterIds.length} chapters`);
    }

    console.log(`\n✅ Import complete!`);
    console.log(`📊 Total studies created: ${totalStudies}`);
    console.log(`📊 Total chapters created: ${totalChapters}`);

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during import:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

importLichessStudies();

