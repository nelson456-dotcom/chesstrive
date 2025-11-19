const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Study = require('../models/Study');
const Chapter = require('../models/Chapter');

// Get all studies (including imported Lichess studies)
router.get('/', auth, async (req, res) => {
  try {
    // Get ALL studies - not filtered by user
    const studies = await Study.find({})
    .populate('authorId', 'username email')
    .sort({ updatedAt: -1 })
    .lean(); // Convert to plain JavaScript objects to avoid mutation issues
    
    // MANUAL CHAPTER FETCHING - WORKAROUND FOR POPULATION ISSUE
    for (let study of studies) {
      if (study.chapters && study.chapters.length > 0) {
        const chapterIds = study.chapters;
        const chapters = await Chapter.find({ _id: { $in: chapterIds } }).lean();
        study.chapters = chapters; // Replace IDs with full chapter objects
      }
    }
    
    // Format studies with user access info and populated chapters
    const formattedStudies = studies.map(study => {
      // Safely handle authorId which might be null, undefined, or not populated
      let authorIdString = null;
      let authorUsername = 'Unknown';
      
      if (study.authorId) {
        if (typeof study.authorId === 'object' && study.authorId._id) {
          // Populated author object
          authorIdString = study.authorId._id.toString();
          authorUsername = study.authorId.username || 'Unknown';
        } else {
          // Just an ObjectId
          authorIdString = study.authorId.toString();
        }
      }
      
      const isOwner = authorIdString === req.user.id;
      const collaborator = study.collaborators.find(c => c.userId && c.userId.toString() === req.user.id);
      
      
      return {
        _id: study._id,
        name: study.name,
        description: study.description,
        authorId: study.authorId ? { 
          _id: authorIdString, 
          username: authorUsername 
        } : null,
        chapters: (study.chapters || []).map(chapter => ({
          _id: chapter._id,
          name: chapter.name,
          notes: chapter.notes,
          studyId: chapter.studyId,
          position: chapter.position,
          pgn: chapter.pgn,  // Include PGN field for comment extraction
          gameTree: chapter.gameTree,
          currentPath: chapter.currentPath,
          currentMoveIndex: chapter.currentMoveIndex,
          createdAt: chapter.createdAt,
          updatedAt: chapter.updatedAt
        })), // Convert Mongoose documents to plain objects
        chapterCount: (study.chapters || []).length,
        isPublic: study.isPublic,
        tags: study.tags || [],
        createdAt: study.createdAt,
        updatedAt: study.updatedAt,
        isOwner,
        userAccess: {
          hasAccess: true,
          permission: isOwner ? 'admin' : (collaborator ? collaborator.role : 'viewer')
        }
      };
    });

    res.json({
      success: true,
      studies: formattedStudies,
      data: formattedStudies // For compatibility with EnhancedChessStudyPage
    });
  } catch (error) {
    console.error('❌ ERROR fetching studies:', error);
    console.error('❌ Error details:', {
      message: error.message,
      name: error.name,
      stack: error.stack
    });
    res.status(500).json({
      success: false,
      message: 'Server error while fetching studies',
      error: error.message
    });
  }
});

// Get a specific study
router.get('/:id', auth, async (req, res) => {
  try {
    const study = await Study.findOne({
      _id: req.params.id,
      $or: [
        { authorId: req.user.id },
        { 'collaborators.userId': req.user.id }
      ]
    })
    .populate('authorId', 'username email')
    .populate('chapters');

    if (!study) {
      return res.status(404).json({
        success: false,
        message: 'Study not found or access denied'
      });
    }

    res.json({
      success: true,
      study
    });
  } catch (error) {
    console.error('Error fetching study:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching study'
    });
  }
});

// Create a new study
router.post('/', auth, async (req, res) => {
  try {
    const { name, description, tags = [] } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Study name is required'
      });
    }

    const study = new Study({
      name: name.trim(),
      description: description || '',
      authorId: req.user.id,
      tags,
      collaborators: []
    });

    await study.save();

    // Populate the author info
    await study.populate('authorId', 'username email');

    res.status(201).json({
      success: true,
      study: {
        _id: study._id,
        name: study.name,
        description: study.description,
        authorId: study.authorId,
        chapters: [],
        chapterCount: 0,
        isPublic: study.isPublic,
        tags: study.tags,
        createdAt: study.createdAt,
        updatedAt: study.updatedAt,
        isOwner: true,
        userAccess: {
          hasAccess: true,
          permission: 'admin'
        }
      },
      data: {
        _id: study._id,
        name: study.name,
        description: study.description,
        authorId: study.authorId,
        chapters: [],
        chapterCount: 0,
        isPublic: study.isPublic,
        tags: study.tags,
        createdAt: study.createdAt,
        updatedAt: study.updatedAt,
        isOwner: true,
        userAccess: {
          hasAccess: true,
          permission: 'admin'
        }
      }
    });
  } catch (error) {
    console.error('❌ ERROR creating study:', error);
    console.error('Error details:', {
      message: error.message,
      name: error.name,
      stack: error.stack
    });
    res.status(500).json({
      success: false,
      message: 'Server error while creating study'
    });
  }
});

// Update a study
router.put('/:id', auth, async (req, res) => {
  try {
    const study = await Study.findOne({
      _id: req.params.id,
      authorId: req.user.id
    });

    if (!study) {
      return res.status(404).json({
        success: false,
        message: 'Study not found or access denied'
      });
    }

    const { name, description, tags, isPublic } = req.body;

    if (name !== undefined) study.name = name.trim();
    if (description !== undefined) study.description = description;
    if (tags !== undefined) study.tags = tags;
    if (isPublic !== undefined) study.isPublic = isPublic;

    await study.save();

    res.json({
      success: true,
      study
    });
  } catch (error) {
    console.error('Error updating study:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating study'
    });
  }
});

// Delete a study
router.delete('/:id', auth, async (req, res) => {
  try {
    const study = await Study.findOne({
      _id: req.params.id,
      authorId: req.user.id
    });

    if (!study) {
      return res.status(404).json({
        success: false,
        message: 'Study not found or access denied'
      });
    }

    // Delete associated chapters
    await Chapter.deleteMany({ studyId: study._id });

    // Delete the study
    await Study.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Study deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting study:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting study'
    });
  }
});

module.exports = router;