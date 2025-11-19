const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const auth = require('../middleware/auth');
const Study = require('../models/Study');
const User = require('../models/User');
const Notification = require('../models/Notification');

// Helper function to validate and convert studyId to ObjectId
const validateStudyId = async (studyId) => {
  if (!studyId) {
    throw new Error('Study ID is required');
  }
  
  // If it's already a valid ObjectId string, return it
  if (typeof studyId === 'string' && mongoose.Types.ObjectId.isValid(studyId)) {
    return studyId;
  }
  
  // If it's a number, this might be a frontend study ID
  // We need to handle this case by either finding a study with a numeric ID field
  // or creating a temporary study for collaboration purposes
  if (typeof studyId === 'number') {
    // For now, we'll create a temporary ObjectId based on the numeric ID
    // This is a workaround for frontend studies that don't exist in the database yet
    // In a real implementation, you might want to sync frontend studies to the database
    const tempObjectId = new mongoose.Types.ObjectId();
    console.log(`Converting numeric study ID ${studyId} to temporary ObjectId: ${tempObjectId}`);
    return tempObjectId;
  }
  
  // Try to convert to ObjectId
  try {
    return new mongoose.Types.ObjectId(studyId);
  } catch (error) {
    throw new Error('Invalid study ID format. Expected ObjectId string.');
  }
};

// POST /api/collaboration/invite - Invite user to study
router.post('/invite', auth, async (req, res) => {
  try {
    const { studyId, email, username, permission = 'view' } = req.body;
    
    console.log('=== INVITATION REQUEST DEBUG ===');
    console.log('Invite request received:', { studyId, email, username, permission });
    console.log('Request user ID:', req.user.id);
    console.log('Request user ID type:', typeof req.user.id);

    // Validate and convert studyId to ObjectId
    let validStudyId;
    try {
      validStudyId = await validateStudyId(studyId);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    // Check if we have a valid email or username (not empty strings)
    const hasValidEmail = email && email.trim().length > 0;
    const hasValidUsername = username && username.trim().length > 0;
    
    if (!hasValidEmail && !hasValidUsername) {
      return res.status(400).json({
        success: false,
        message: 'Either email or username is required'
      });
    }

    // Find the study
    console.log('Looking for study with ID:', validStudyId);
    let study = await Study.findById(validStudyId).populate('authorId', 'username');
    console.log('Found study:', study ? { id: study._id, name: study.name, owner: study.authorId?.username } : 'null');
    
    // If study doesn't exist and we have a numeric ID, create a temporary study for collaboration
    if (!study && typeof studyId === 'number') {
      // Create a temporary study for frontend studies that don't exist in the database
      study = new Study({
        _id: validStudyId,
        authorId: req.user.id,
        name: `Study ${studyId}`,
        description: 'Temporary study created for collaboration',
        isPublic: false
      });
      
      try {
        await study.save();
        console.log(`Created temporary study with ID ${validStudyId} for user ${req.user.id}`);
        console.log('Temporary study details:', {
          id: study._id,
          authorId: study.authorId,
          authorIdType: typeof study.authorId,
          authorIdString: study.authorId.toString()
        });
      } catch (error) {
        console.error('Error creating temporary study:', error);
        return res.status(500).json({
          success: false,
          message: 'Failed to create study for collaboration'
        });
      }
    } else if (!study) {
      console.log('❌ STUDY NOT FOUND:', validStudyId);
      return res.status(404).json({
        success: false,
        message: `Study not found with ID: ${validStudyId}`
      });
    }

    // Check if user is owner or admin
    const access = study.hasAccess(req.user.id);
    console.log('=== PERMISSION CHECK DEBUG ===');
    const authorId = study.authorId._id ? study.authorId._id : study.authorId;
    console.log('User access check:', {
      userId: req.user.id,
      studyOwner: authorId.toString(),
      access: access,
      isOwner: authorId.toString() === req.user.id.toString()
    });
    
    // For temporary studies created for frontend studies, ensure the creator has admin access
    const isTemporaryStudy = typeof studyId === 'number';
    const isOwner = authorId.toString() === req.user.id.toString();
    
    console.log('Permission check details:', {
      isTemporaryStudy,
      isOwner,
      hasAccess: access.hasAccess,
      permission: access.permission,
      allowedPermissions: ['admin', 'edit']
    });
    
    if (!access.hasAccess || !['admin', 'edit'].includes(access.permission)) {
      // Special case: if this is a temporary study and the user is the owner, allow invitation
      if (isTemporaryStudy && isOwner) {
        console.log('✅ Allowing invitation for temporary study owner');
      } else {
        console.log('❌ BLOCKING invitation - insufficient permissions');
        console.log('Blocking details:', {
          hasAccess: access.hasAccess,
          permission: access.permission,
          isTemporaryStudy,
          isOwner
        });
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to invite users to this study'
        });
      }
    } else {
      console.log('✅ Allowing invitation - user has proper permissions');
    }

    // Find user by email or username
    let invitedUser;
    if (hasValidEmail) {
      console.log(`Looking for user with email: ${email.trim().toLowerCase()}`);
      invitedUser = await User.findOne({ email: email.trim().toLowerCase() });
    } else if (hasValidUsername) {
      console.log(`Looking for user with username: ${username.trim().toLowerCase()}`);
      invitedUser = await User.findOne({ username: username.trim().toLowerCase() });
    }

    console.log('Found user:', invitedUser ? { id: invitedUser._id, username: invitedUser.username, email: invitedUser.email } : 'null');

    if (!invitedUser) {
      console.log('❌ USER NOT FOUND:', hasValidEmail ? email : username);
      return res.status(404).json({
        success: false,
        message: `User not found with ${hasValidEmail ? 'email' : 'username'}: ${hasValidEmail ? email : username}`
      });
    }

    // Check if user is already a collaborator
    const existingCollaborator = study.collaborators.find(c => 
      c.userId.toString() === invitedUser._id.toString()
    );

    if (existingCollaborator) {
      console.log('❌ USER ALREADY COLLABORATOR:', invitedUser.username, 'Status:', existingCollaborator.status);
      return res.status(400).json({
        success: false,
        message: `User ${invitedUser.username} is already a collaborator on this study (status: ${existingCollaborator.status})`
      });
    }

    // Add collaborator
    await study.addCollaborator(invitedUser._id, permission, req.user.id);

    // Create notification for the invited user
    console.log('Creating notification for user:', invitedUser._id, 'study:', validStudyId, 'study name:', study.name);
    try {
      const notification = await Notification.createStudyInvitation(
        invitedUser._id,
        validStudyId,
        study.name,
        study.authorId.username
      );
      console.log('Notification created successfully:', notification._id);
    } catch (error) {
      console.error('Error creating notification:', error);
    }

    res.json({
      success: true,
      message: 'Invitation sent successfully',
      collaborator: {
        user: invitedUser._id,
        email: invitedUser.email,
        username: invitedUser.username,
        permission: permission,
        status: 'pending'
      }
    });
  } catch (error) {
    console.error('❌ ERROR in invitation route:', error);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Failed to invite user: ' + error.message
    });
  }
});

// POST /api/collaboration/accept - Accept invitation
router.post('/accept', auth, async (req, res) => {
  try {
    const { studyId } = req.body;

    // Validate and convert studyId to ObjectId
    let validStudyId;
    try {
      validStudyId = await validateStudyId(studyId);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    const study = await Study.findById(validStudyId);
    if (!study) {
      return res.status(404).json({
        success: false,
        message: 'Study not found'
      });
    }

    await study.acceptInvitation(req.user.id);

    res.json({
      success: true,
      message: 'Invitation accepted successfully'
    });
  } catch (error) {
    console.error('Error accepting invitation:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to accept invitation'
    });
  }
});

// POST /api/collaboration/decline - Decline invitation
router.post('/decline', auth, async (req, res) => {
  try {
    const { studyId } = req.body;

    // Validate and convert studyId to ObjectId
    let validStudyId;
    try {
      validStudyId = await validateStudyId(studyId);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    const study = await Study.findById(validStudyId);
    if (!study) {
      return res.status(404).json({
        success: false,
        message: 'Study not found'
      });
    }

    // Find and update collaborator status
    const collaborator = study.collaborators.find(c => 
      c.userId.toString() === req.user.id.toString() && c.status === 'pending'
    );

    if (!collaborator) {
      return res.status(404).json({
        success: false,
        message: 'No pending invitation found'
      });
    }

    collaborator.status = 'declined';
    await study.save();

    res.json({
      success: true,
      message: 'Invitation declined successfully'
    });
  } catch (error) {
    console.error('Error declining invitation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to decline invitation'
    });
  }
});

// PUT /api/collaboration/permission - Update collaborator permission
router.put('/permission', auth, async (req, res) => {
  try {
    const { studyId, userId, permission } = req.body;

    if (!userId || !permission) {
      return res.status(400).json({
        success: false,
        message: 'User ID and permission are required'
      });
    }

    // Validate and convert studyId to ObjectId
    let validStudyId;
    try {
      validStudyId = await validateStudyId(studyId);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    const study = await Study.findById(validStudyId);
    if (!study) {
      return res.status(404).json({
        success: false,
        message: 'Study not found'
      });
    }

    // Check if user is owner or admin
    const access = study.hasAccess(req.user.id);
    if (!access.hasAccess || access.permission !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to modify user permissions'
      });
    }

    await study.updateCollaboratorPermission(userId, permission);

    res.json({
      success: true,
      message: 'Permission updated successfully'
    });
  } catch (error) {
    console.error('Error updating permission:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update permission'
    });
  }
});

// DELETE /api/collaboration/remove - Remove collaborator
router.delete('/remove', auth, async (req, res) => {
  try {
    const { studyId, userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    // Validate and convert studyId to ObjectId
    let validStudyId;
    try {
      validStudyId = await validateStudyId(studyId);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    const study = await Study.findById(validStudyId);
    if (!study) {
      return res.status(404).json({
        success: false,
        message: 'Study not found'
      });
    }

    // Check if user is owner or admin
    const access = study.hasAccess(req.user.id);
    if (!access.hasAccess || access.permission !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to remove collaborators'
      });
    }

    await study.removeCollaborator(userId);

    res.json({
      success: true,
      message: 'Collaborator removed successfully'
    });
  } catch (error) {
    console.error('Error removing collaborator:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove collaborator'
    });
  }
});

// POST /api/collaboration/share - Generate share code
router.post('/share', auth, async (req, res) => {
  try {
    const { studyId } = req.body;

    // Validate and convert studyId to ObjectId
    let validStudyId;
    try {
      validStudyId = await validateStudyId(studyId);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    const study = await Study.findById(validStudyId);
    if (!study) {
      return res.status(404).json({
        success: false,
        message: 'Study not found'
      });
    }

    // Check if user is owner or admin
    const access = study.hasAccess(req.user.id);
    if (!access.hasAccess || access.permission !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to share this study'
      });
    }

    await study.generateShareCode();

    res.json({
      success: true,
      message: 'Share code generated successfully',
      shareCode: study.shareCode
    });
  } catch (error) {
    console.error('Error generating share code:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate share code'
    });
  }
});

// POST /api/collaboration/join-by-code - Join study by share code
router.post('/join-by-code', auth, async (req, res) => {
  try {
    const { shareCode, permission = 'view' } = req.body;

    if (!shareCode) {
      return res.status(400).json({
        success: false,
        message: 'Share code is required'
      });
    }

    const study = await Study.findOne({ shareCode: shareCode.toUpperCase() });
    if (!study) {
      return res.status(404).json({
        success: false,
        message: 'Invalid share code'
      });
    }

    // Check if user is already a collaborator
    const existingCollaborator = study.collaborators.find(c => 
      c.userId.toString() === req.user.id.toString()
    );

    if (existingCollaborator) {
      return res.status(400).json({
        success: false,
        message: 'You are already a collaborator on this study'
      });
    }

    // Add collaborator with accepted status
    await study.addCollaborator(req.user.id, permission, study.authorId);
    
    // Accept the invitation immediately
    await study.acceptInvitation(req.user.id);

    res.json({
      success: true,
      message: 'Successfully joined study',
      study: {
        id: study._id,
        name: study.name,
        description: study.description
      }
    });
  } catch (error) {
    console.error('Error joining study:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to join study'
    });
  }
});

// GET /api/collaboration/invitations - Get pending invitations
router.get('/invitations', auth, async (req, res) => {
  try {
    const studies = await Study.find({
      'collaborators.userId': req.user.id,
      'collaborators.status': 'pending'
    }).populate('authorId', 'username email').populate('collaborators.userId', 'username email');

    const invitations = studies.map(study => {
      const collaborator = study.collaborators.find(c => 
        c.userId._id.toString() === req.user.id.toString()
      );
      
      return {
        studyId: study._id,
        studyName: study.name,
        studyDescription: study.description,
        owner: {
          id: study.authorId._id,
          username: study.authorId.username,
          email: study.authorId.email
        },
        permission: collaborator.role,
        invitedAt: collaborator.addedAt
      };
    });

    res.json({
      success: true,
      invitations
    });
  } catch (error) {
    console.error('Error fetching invitations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch invitations'
    });
  }
});

// GET /api/collaboration/studies - Get studies user has access to
router.get('/studies', auth, async (req, res) => {
  try {
    const studies = await Study.find({
      $or: [
        { authorId: req.user.id },
        { 'collaborators.userId': req.user.id, 'collaborators.status': 'accepted' }
      ]
    })
    .populate('authorId', 'username email')
    .populate('collaborators.userId', 'username email')
    .sort({ updatedAt: -1 });

    const studiesWithAccess = studies.map(study => {
      const access = study.hasAccess(req.user.id);
      return {
        ...study.toObject(),
        userAccess: access
      };
    });

    res.json({
      success: true,
      studies: studiesWithAccess
    });
  } catch (error) {
    console.error('Error fetching collaborative studies:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch studies'
    });
  }
});

// GET /api/collaboration/notifications - Get user notifications
router.get('/notifications', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20, unreadOnly = false } = req.query;
    
    console.log('Fetching notifications for user:', req.user.id);
    
    const query = { user: req.user.id };
    if (unreadOnly === 'true') {
      query.isRead = false;
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Notification.countDocuments(query);

    console.log(`Found ${notifications.length} notifications for user ${req.user.id}, total: ${total}`);

    res.json({
      success: true,
      notifications,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications'
    });
  }
});

// PUT /api/collaboration/notifications/:id/read - Mark notification as read
router.put('/notifications/:id/read', auth, async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    await notification.markAsRead();

    res.json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read'
    });
  }
});

// PUT /api/collaboration/notifications/read-all - Mark all notifications as read
router.put('/notifications/read-all', auth, async (req, res) => {
  try {
    await Notification.updateMany(
      { user: req.user.id, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark all notifications as read'
    });
  }
});

// GET /api/collaboration/notifications/unread-count - Get unread notification count
router.get('/notifications/unread-count', auth, async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      user: req.user.id,
      isRead: false
    });

    console.log(`Unread notification count for user ${req.user.id}: ${count}`);

    res.json({
      success: true,
      count
    });
  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get unread count'
    });
  }
});

module.exports = router;
