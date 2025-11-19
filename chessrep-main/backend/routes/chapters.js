const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Chapter = require('../models/Chapter');
const Study = require('../models/Study');

// Get all chapters for a study
router.get('/:studyId', auth, async (req, res) => {
  try {
    const chapters = await Chapter.find({ studyId: req.params.studyId })
      .sort({ createdAt: 1 });

    res.json({
      success: true,
      chapters
    });
  } catch (error) {
    console.error('Error fetching chapters:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching chapters'
    });
  }
});

// Get a specific chapter
router.get('/:studyId/:chapterId', auth, async (req, res) => {
  try {
    console.log('=== API: CHAPTER RETRIEVAL DEBUG ===');
    console.log('Requested studyId:', req.params.studyId);
    console.log('Requested chapterId:', req.params.chapterId);
    
    const chapter = await Chapter.findOne({
      _id: req.params.chapterId,
      studyId: req.params.studyId
    });

    if (!chapter) {
      console.log('❌ Chapter not found in database');
      return res.status(404).json({
        success: false,
        message: 'Chapter not found'
      });
    }

    console.log('✅ Chapter found in database');
    console.log('Chapter from DB:', chapter);
    console.log('Chapter name:', chapter.name);
    console.log('Chapter ID:', chapter._id);
    console.log('Chapter studyId:', chapter.studyId);
    console.log('GameTree from DB:', chapter?.gameTree);
    console.log('Moves from DB:', chapter?.gameTree?.moves);
    console.log('Moves count:', chapter?.gameTree?.moves?.length);
    console.log('Move[0]:', chapter?.gameTree?.moves?.[0]);
    
    // Check if moves are being serialized correctly
    const jsonStr = JSON.stringify(chapter);
    console.log('JSON stringified chapter (first 1000 chars):', jsonStr.substring(0, 1000));
    
    // Additional validation
    if (chapter.gameTree?.moves) {
      console.log('=== MOVE VALIDATION ===');
      console.log('Moves array type:', typeof chapter.gameTree.moves);
      console.log('Moves is array?', Array.isArray(chapter.gameTree.moves));
      console.log('Moves length:', chapter.gameTree.moves.length);
      
      if (chapter.gameTree.moves.length > 0) {
        console.log('First move structure:', chapter.gameTree.moves[0]);
        console.log('First move keys:', Object.keys(chapter.gameTree.moves[0]));
        console.log('First move has notation:', 'notation' in chapter.gameTree.moves[0]);
        console.log('First move has move:', 'move' in chapter.gameTree.moves[0]);
        console.log('First move notation value:', chapter.gameTree.moves[0].notation);
        console.log('First move move value:', chapter.gameTree.moves[0].move);
      }
    } else {
      console.log('❌ No moves found in chapter.gameTree');
    }

    res.json({
      success: true,
      chapter
    });
  } catch (error) {
    console.error('❌ Error fetching chapter:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching chapter'
    });
  }
});

// Create a new chapter
router.post('/', auth, async (req, res) => {
  try {
    const { 
      studyId, 
      name, 
      notes = '', 
      pgn = '',
      position, 
      gameTree, 
      currentPath, 
      currentMoveIndex 
    } = req.body;

    if (!studyId || !name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Study ID and chapter name are required'
      });
    }

    // Verify user has access to the study
    const study = await Study.findOne({
      _id: studyId,
      $or: [
        { authorId: req.user.id },
        { 'collaborators.userId': req.user.id }
      ]
    });

    if (!study) {
      return res.status(404).json({
        success: false,
        message: 'Study not found or access denied'
      });
    }

    // Create chapter with current position and game state
    const chapterData = {
      name: name.trim(),
      notes,
      pgn,
      studyId
    };

    // Add position and game state if provided
    if (position) {
      chapterData.position = position;
    }
    if (gameTree) {
      chapterData.gameTree = gameTree;
    }
    if (currentPath) {
      chapterData.currentPath = currentPath;
    }
    if (currentMoveIndex !== undefined) {
      chapterData.currentMoveIndex = currentMoveIndex;
    }

    const chapter = new Chapter(chapterData);
    await chapter.save();

    // Add chapter to study
    if (!study.chapters) {
      study.chapters = [];
    }
    study.chapters.push(chapter._id);
    await study.save();

    res.status(201).json({
      success: true,
      chapter
    });
  } catch (error) {
    console.error('🚨 CRITICAL ERROR creating chapter:', error);
    console.error('🚨 Error name:', error.name);
    console.error('🚨 Error message:', error.message);
    console.error('🚨 Error stack:', error.stack);
    console.error('🚨 Request body:', req.body);
    console.error('🚨 User ID:', req.user?.id);
    
    res.status(500).json({
      success: false,
      message: 'Server error while creating chapter',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Update a chapter
router.put('/:chapterId', auth, async (req, res) => {
  try {
    const chapter = await Chapter.findById(req.params.chapterId);

    if (!chapter) {
      return res.status(404).json({
        success: false,
        message: 'Chapter not found'
      });
    }

    // Verify user has access to the study
    const study = await Study.findOne({
      _id: chapter.studyId,
      $or: [
        { authorId: req.user.id },
        { 'collaborators.userId': req.user.id }
      ]
    });

    if (!study) {
      return res.status(404).json({
        success: false,
        message: 'Study not found or access denied'
      });
    }

    const { name, notes, pgn, position, gameTree, currentPath, currentMoveIndex } = req.body;

    if (name !== undefined) chapter.name = name.trim();
    if (notes !== undefined) chapter.notes = notes;
    if (pgn !== undefined) chapter.pgn = pgn;
    if (position !== undefined) chapter.position = position;
    if (gameTree !== undefined) chapter.gameTree = gameTree;
    if (currentPath !== undefined) chapter.currentPath = currentPath;
    if (currentMoveIndex !== undefined) chapter.currentMoveIndex = currentMoveIndex;

    await chapter.save();

    res.json({
      success: true,
      chapter
    });
  } catch (error) {
    console.error('Error updating chapter:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating chapter'
    });
  }
});

// Save moves for a chapter
router.put('/:chapterId/save-moves', auth, async (req, res) => {
  try {
    // First verify user has access to the study
    const chapter = await Chapter.findById(req.params.chapterId);
    if (!chapter) {
      return res.status(404).json({
        success: false,
        message: 'Chapter not found'
      });
    }

    const study = await Study.findOne({
      _id: chapter.studyId,
      $or: [
        { authorId: req.user.id },
        { 'collaborators.userId': req.user.id }
      ]
    });

    if (!study) {
      return res.status(404).json({
        success: false,
        message: 'Study not found or access denied'
      });
    }

    const { pgn, position, gameTree, moves, currentPath, currentMoveIndex } = req.body;

    // Debug variations in incoming data
    console.log('💾 [BACKEND] Received save-moves request for chapter:', req.params.chapterId);
    console.log('💾 [BACKEND] Request body keys:', Object.keys(req.body));
    
    if (gameTree?.moves) {
      const movesWithVariations = gameTree.moves.filter(m => m.variations && m.variations.length > 0);
      console.log('💾 [BACKEND] Moves with variations in gameTree:', movesWithVariations.length);
      if (movesWithVariations.length > 0) {
        console.log('💾 [BACKEND] First move with variations:', movesWithVariations[0]);
        console.log('💾 [BACKEND] Variations structure:', movesWithVariations[0].variations);
      } else {
        console.log('❌ [BACKEND] NO VARIATIONS FOUND IN INCOMING GAMETREE!');
      }
    }

    // Build update object
    const updateData = {};
    if (pgn !== undefined) updateData.pgn = pgn;
    if (position !== undefined) updateData.position = position;
    if (gameTree !== undefined) updateData.gameTree = gameTree;
    if (currentPath !== undefined) updateData.currentPath = currentPath;
    if (currentMoveIndex !== undefined) updateData.currentMoveIndex = currentMoveIndex;
    if (moves !== undefined) {
      // Update gameTree with new moves
      updateData.gameTree = {
        moves: moves,
        currentMove: moves.length
      };
    }

    // Use findByIdAndUpdate to avoid version conflicts
    const updatedChapter = await Chapter.findByIdAndUpdate(
      req.params.chapterId,
      updateData,
      { new: true, runValidators: true }
    );

    // Debug what was actually saved
    console.log('💾 [BACKEND] Chapter updated successfully');
    if (updatedChapter?.gameTree?.moves) {
      const savedMovesWithVariations = updatedChapter.gameTree.moves.filter(m => m.variations && m.variations.length > 0);
      console.log('💾 [BACKEND] Saved moves with variations:', savedMovesWithVariations.length);
      if (savedMovesWithVariations.length > 0) {
        console.log('💾 [BACKEND] First saved move with variations:', savedMovesWithVariations[0]);
        console.log('💾 [BACKEND] Saved variations structure:', savedMovesWithVariations[0].variations);
      } else {
        console.log('❌ [BACKEND] NO VARIATIONS FOUND IN SAVED CHAPTER!');
      }
    }

    res.json({
      success: true,
      chapter: updatedChapter
    });
  } catch (error) {
    console.error('Error saving chapter moves:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while saving chapter moves'
    });
  }
});

// Delete a chapter
router.delete('/:chapterId', auth, async (req, res) => {
  try {
    const chapter = await Chapter.findById(req.params.chapterId);

    if (!chapter) {
      return res.status(404).json({
        success: false,
        message: 'Chapter not found'
      });
    }

    // Verify user has access to the study
    const study = await Study.findOne({
      _id: chapter.studyId,
      authorId: req.user.id
    });

    if (!study) {
      return res.status(404).json({
        success: false,
        message: 'Study not found or access denied'
      });
    }

    // Remove chapter from study
    study.chapters = study.chapters.filter(id => id.toString() !== chapter._id.toString());
    await study.save();

    // Delete the chapter
    await Chapter.findByIdAndDelete(req.params.chapterId);

    res.json({
      success: true,
      message: 'Chapter deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting chapter:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting chapter'
    });
  }
});

module.exports = router;