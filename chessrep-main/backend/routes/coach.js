const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const Notification = require('../models/Notification');

// Logging middleware for all coach routes
router.use((req, res, next) => {
  console.log('[Coach Routes] ====== REQUEST RECEIVED ======');
  console.log('[Coach Routes] Method:', req.method);
  console.log('[Coach Routes] Path:', req.path);
  console.log('[Coach Routes] Full URL:', req.originalUrl);
  console.log('[Coach Routes] Body:', req.body);
  console.log('[Coach Routes] Headers:', {
    'x-auth-token': req.header('x-auth-token') ? 'present' : 'missing',
    'authorization': req.header('Authorization') ? 'present' : 'missing',
    'content-type': req.header('content-type')
  });
  next();
});

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const findUserByIdentifier = async (identifier) => {
  if (!identifier || typeof identifier !== 'string') {
    return null;
  }

  const normalized = identifier.trim();
  if (!normalized) {
    return null;
  }

  const emailCandidate = normalized.toLowerCase();
  let user = await User.findOne({ email: emailCandidate });
  if (user) {
    return user;
  }

  user = await User.findOne({ username: normalized });
  if (user) {
    return user;
  }

  return User.findOne({ username: new RegExp(`^${escapeRegExp(normalized)}$`, 'i') });
};

const buildModuleSummary = (dailyProgress = {}) => {
  return Object.entries(dailyProgress)
    .filter(([key]) => key !== 'date')
    .map(([module, data]) => ({
      module,
      completed: data?.completed || 0,
      total: data?.total || 0
    }))
    .filter((entry) => entry.completed > 0);
};

const toProgressSummary = (userDoc) => {
  const puzzleStats = userDoc.stats?.puzzleStats || {};
  const puzzleAttempts = puzzleStats.totalAttempted || 0;
  const puzzleSolved = puzzleStats.totalSolved || 0;
  const puzzleAccuracy = puzzleAttempts > 0
    ? Math.round((puzzleSolved / puzzleAttempts) * 100)
    : 0;

  const botGamesStats = userDoc.stats?.botGamesStats || {};
  const botGamesPlayed = botGamesStats.totalPlayed || 0;
  const botGamesWins = botGamesStats.wins || 0;
  const botGamesLosses = botGamesStats.losses || 0;
  const botGamesDraws = botGamesStats.draws || 0;

  return {
    id: userDoc._id.toString(),
    username: userDoc.username,
    email: userDoc.email,
    name: userDoc.name || '',
    isCoach: !!userDoc.isCoach,
    progress: {
      puzzlesSolved: puzzleSolved,
      puzzlesAttempted: puzzleAttempts,
      puzzleAccuracy,
      puzzleStreak: userDoc.stats?.puzzleStats?.currentStreak || 0,
      modulesPlayed: buildModuleSummary(userDoc.dailyProgress),
      botGames: {
        totalPlayed: botGamesPlayed,
        wins: botGamesWins,
        losses: botGamesLosses,
        draws: botGamesDraws
      },
      ratings: {
        standard: userDoc.rating || 0,
        blunder: userDoc.blunderRating || 0,
        visualisation: userDoc.visualisationRating || 0,
        endgame: userDoc.endgameRating || 0,
        positional: userDoc.positionalRating || 0,
        advantage: userDoc.advantageRating || 0,
        resourcefulness: userDoc.resourcefulnessRating || 0
      },
      repertoireCount: Array.isArray(userDoc.repertoire) ? userDoc.repertoire.length : 0,
      openingsPracticed: userDoc.openingsPracticed || 0
    },
    createdAt: userDoc.createdAt,
    updatedAt: userDoc.updatedAt
  };
};

const loadCoach = async (userId, includeStudents = false) => {
  const query = User.findById(userId);
  if (includeStudents) {
    query.populate({
      path: 'students',
      select: 'username email name isCoach stats dailyProgress rating blunderRating visualisationRating endgameRating positionalRating advantageRating resourcefulnessRating repertoire openingsPracticed createdAt updatedAt'
    });
  }
  // Always include students/coaches arrays so downstream logic can access them
  const user = await query.select('username email name isCoach stats dailyProgress rating blunderRating visualisationRating endgameRating positionalRating advantageRating resourcefulnessRating repertoire openingsPracticed createdAt updatedAt students coaches');
  
  // Ensure arrays exist
  if (user) {
    if (!Array.isArray(user.students)) {
      user.students = [];
    }
    if (!Array.isArray(user.coaches)) {
      user.coaches = [];
    }
  }
  
  return user;
};

const loadStudent = async (userId, includeCoaches = false) => {
  const query = User.findById(userId);
  if (includeCoaches) {
    query.populate({
      path: 'coaches',
      select: 'username email name isCoach stats dailyProgress rating blunderRating visualisationRating endgameRating positionalRating advantageRating resourcefulnessRating repertoire openingsPracticed createdAt updatedAt'
    });
  }
  // Always include students/coaches arrays so downstream logic can access them
  return query.select('username email name isCoach stats dailyProgress rating blunderRating visualisationRating endgameRating positionalRating advantageRating resourcefulnessRating repertoire openingsPracticed createdAt updatedAt students coaches');
};

// Helper to hash user ID for logging (simple base64 encoding of first 8 chars)
const hashUserId = (userId) => {
  if (!userId) return 'unknown';
  return Buffer.from(userId.toString()).toString('base64').substring(0, 8);
};

router.put('/status', auth, async (req, res) => {
  const requestId = `coach-status-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const startTime = Date.now();
  const userId = req.user?.id;
  const hashedUserId = hashUserId(userId);
  
  try {
    console.log('[Coach Status] Request received:', {
      requestId,
      userId: hashedUserId,
      method: 'PUT',
      route: '/api/coach/status',
      body: req.body,
      timestamp: new Date().toISOString()
    });

    const { isCoach } = req.body;
    
    if (isCoach === undefined || isCoach === null) {
      console.warn('[Coach Status] Missing isCoach:', { requestId, userId: hashedUserId });
      return res.status(400).json({ 
        success: false,
        message: 'isCoach is required' 
      });
    }

    if (typeof isCoach !== 'boolean') {
      console.warn('[Coach Status] Invalid isCoach type:', { 
        requestId, 
        userId: hashedUserId,
        received: typeof isCoach, 
        value: isCoach 
      });
      return res.status(400).json({ 
        success: false,
        message: 'isCoach must be a boolean',
        received: typeof isCoach,
        value: isCoach
      });
    }

    if (!req.user || !req.user.id) {
      console.warn('[Coach Status] Unauthenticated request:', { requestId });
      return res.status(401).json({ 
        success: false,
        message: 'User not authenticated' 
      });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      console.error('[Coach Status] User not found:', { requestId, userId: hashedUserId });
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    // Ensure isCoach field exists (for users created before this feature)
    if (user.isCoach === undefined) {
      user.isCoach = false;
    }

    // Ensure coaches and students arrays exist
    if (!Array.isArray(user.coaches)) {
      user.coaches = [];
    }
    if (!Array.isArray(user.students)) {
      user.students = [];
    }

    console.log('[Coach Status] Current user state:', {
      requestId,
      userId: hashedUserId,
      currentIsCoach: user.isCoach,
      requestedIsCoach: isCoach,
      hasCoaches: Array.isArray(user.coaches),
      hasStudents: Array.isArray(user.students)
    });

    // Idempotent check: if already in the requested state, return success
    if (user.isCoach === isCoach) {
      const duration = Date.now() - startTime;
      console.log('[Coach Status] Status unchanged (idempotent):', {
        requestId,
        userId: hashedUserId,
        isCoach,
        duration: `${duration}ms`
      });
      
      // Return 200 (not 409) since this is a valid idempotent operation
      return res.json({ 
        success: true, 
        isCoach, 
        idempotent: true,
        user: { 
          id: user._id.toString(), 
          isCoach 
        } 
      });
    }

    user.isCoach = isCoach;

    if (!isCoach) {
      console.log('[Coach Status] Removing coach status, cleaning up students:', {
        requestId,
        userId: hashedUserId
      });
      const studentIds = Array.isArray(user.students) ? [...user.students] : [];
      user.students = [];
      
      try {
        await User.updateMany(
          { coaches: user._id },
          { $pull: { coaches: user._id } }
        );
      } catch (updateError) {
        console.error('[Coach Status] Error removing coach from students:', {
          requestId,
          userId: hashedUserId,
          error: updateError.message
        });
        // Continue anyway - the main update should still work
      }
      
      try {
      await user.save();
      const duration = Date.now() - startTime;
      console.log('[Coach Status] Coach status removed successfully:', {
        requestId,
        userId: hashedUserId,
        duration: `${duration}ms`
      });
      } catch (saveError) {
        console.error('[Coach Status] Error saving user after removing coach status:', {
          requestId,
          userId: hashedUserId,
          error: saveError.message,
          stack: saveError.stack
        });
        throw new Error('Failed to save user changes: ' + saveError.message);
      }

      const coachesArray = Array.isArray(user.coaches) ? user.coaches : [];

      return res.json({
        success: true,
        isCoach: false,
        removedStudentIds: studentIds.map((id) => id.toString()),
        user: {
          id: user._id.toString(),
          isCoach: false,
          students: [],
          coaches: coachesArray.map((id) => id.toString())
        }
      });
    }

    try {
      await user.save();
      const duration = Date.now() - startTime;
      console.log('[Coach Status] Coach status enabled successfully:', {
        requestId,
        userId: hashedUserId,
        duration: `${duration}ms`
      });
    } catch (saveError) {
      console.error('[Coach Status] Error saving user after enabling coach status:', {
        requestId,
        userId: hashedUserId,
        error: saveError.message,
        stack: saveError.stack
      });
      throw new Error('Failed to save user changes: ' + saveError.message);
    }

    const studentsArray = Array.isArray(user.students) ? user.students : [];
    const coachesArray = Array.isArray(user.coaches) ? user.coaches : [];
    const duration = Date.now() - startTime;

    console.log('[Coach Status] Success response:', {
      requestId,
      userId: hashedUserId,
      isCoach: true,
      duration: `${duration}ms`
    });

    res.json({
      success: true,
      isCoach: true,
      user: {
        id: user._id.toString(),
        isCoach: true,
        students: studentsArray.map((id) => id.toString()),
        coaches: coachesArray.map((id) => id.toString())
      }
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('[Coach Status] Error:', {
      requestId,
      userId: hashedUserId,
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    
    res.status(500).json({ 
      success: false,
      message: 'Server error while updating coach status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

router.post('/students', auth, async (req, res) => {
  console.log('[Coach Students] ====== POST /api/coach/students REQUEST RECEIVED ======');
  console.log('[Coach Students] Request body:', req.body);
  console.log('[Coach Students] User ID:', req.user?.id);
  console.log('[Coach Students] Headers:', JSON.stringify(req.headers));
  
  try {
    const { identifier } = req.body;
    if (!identifier || typeof identifier !== 'string' || !identifier.trim()) {
      return res.status(400).json({ message: 'Identifier (email or username) is required' });
    }

    const trimmedIdentifier = identifier.trim();
    console.log('[Coach Students] Adding student:', { identifier: trimmedIdentifier, coachId: req.user.id });

    // Validate coach exists and is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Load coach
    let coach = await User.findById(req.user.id);
    if (!coach) {
      return res.status(404).json({ message: 'Coach not found' });
    }

    // Ensure arrays exist (Mongoose should handle this, but be safe)
    if (!Array.isArray(coach.students)) {
      coach.students = [];
    }
    if (!Array.isArray(coach.coaches)) {
      coach.coaches = [];
    }

    // Check coach status
    if (!coach.isCoach) {
      return res.status(403).json({ message: 'Only coaches can add students' });
    }

    // Find student
    let student;
    try {
      student = await findUserByIdentifier(trimmedIdentifier);
    } catch (findError) {
      console.error('[Coach Students] Error finding student:', findError);
      return res.status(500).json({ 
        message: 'Error searching for student',
        error: findError.message 
      });
    }

    if (!student) {
      return res.status(404).json({ message: `Student not found: ${trimmedIdentifier}` });
    }

    // Prevent self-addition
    if (student._id.toString() === coach._id.toString()) {
      return res.status(400).json({ message: 'You cannot add yourself as a student' });
    }

    // Ensure student arrays exist
    if (!Array.isArray(student.coaches)) {
      student.coaches = [];
    }
    if (!Array.isArray(student.students)) {
      student.students = [];
    }

    // Check if already linked
    const alreadyStudent = coach.students.some((id) => id.toString() === student._id.toString());
    const alreadyHasCoach = student.coaches.some((id) => id.toString() === coach._id.toString());

    // Add student to coach
    if (!alreadyStudent) {
      coach.students.push(student._id);
      try {
        await coach.save();
        console.log('[Coach Students] Coach saved with new student');
      } catch (saveError) {
        console.error('[Coach Students] Error saving coach:', saveError);
        console.error('[Coach Students] Save error details:', {
          message: saveError.message,
          stack: saveError.stack,
          name: saveError.name,
          errors: saveError.errors
        });
        return res.status(500).json({ 
          message: 'Failed to save coach',
          error: saveError.message,
          detail: saveError.stack
        });
      }
    }

    // Add coach to student
    if (!alreadyHasCoach) {
      student.coaches.push(coach._id);
      try {
        await student.save();
        console.log('[Coach Students] Student saved with new coach');
      } catch (saveError) {
        console.error('[Coach Students] Error saving student:', saveError);
        console.error('[Coach Students] Save error details:', {
          message: saveError.message,
          stack: saveError.stack,
          name: saveError.name,
          errors: saveError.errors
        });
        
        // Rollback: remove student from coach if student save fails
        if (!alreadyStudent) {
          coach.students = coach.students.filter((id) => id.toString() !== student._id.toString());
          try {
            await coach.save();
            console.log('[Coach Students] Rollback successful');
          } catch (rollbackError) {
            console.error('[Coach Students] Rollback failed:', rollbackError);
          }
        }
        
        return res.status(500).json({ 
          message: 'Failed to save student',
          error: saveError.message,
          detail: saveError.stack
        });
      }
    }

    // Create notifications (non-blocking)
    if (!alreadyStudent && !alreadyHasCoach) {
      try {
        await Notification.createCoachAdded(
          student._id,
          coach._id.toString(),
          coach.username || coach.email || 'Coach'
        );
        await Notification.createStudentAdded(
          coach._id,
          student._id.toString(),
          student.username || student.email || 'Student'
        );
        console.log('[Coach Students] Notifications created');
      } catch (notificationError) {
        console.error('[Coach Students] Error creating notifications (non-fatal):', notificationError);
        // Continue - notifications are not critical
      }
    }

    // Refresh student data for response
    let refreshedStudent;
    try {
      refreshedStudent = await User.findById(student._id).select('username email name isCoach stats dailyProgress rating blunderRating visualisationRating endgameRating positionalRating advantageRating resourcefulnessRating repertoire openingsPracticed createdAt updatedAt');
    } catch (refreshError) {
      console.error('[Coach Students] Error refreshing student:', refreshError);
      // Use the student we already have
      refreshedStudent = student;
    }

    if (!refreshedStudent) {
      return res.status(404).json({ message: 'Student not found after save' });
    }

    // Build response
    let studentSummary;
    try {
      studentSummary = toProgressSummary(refreshedStudent);
    } catch (summaryError) {
      console.error('[Coach Students] Error creating summary:', summaryError);
      return res.status(500).json({ 
        message: 'Error formatting student data',
        error: summaryError.message
      });
    }

    res.status(alreadyStudent ? 200 : 201).json({
      success: true,
      student: studentSummary,
      coach: {
        id: coach._id.toString(),
        students: coach.students.map((id) => id.toString())
      }
    });
  } catch (error) {
    console.error('[Coach Students] ====== UNEXPECTED ERROR ======');
    console.error('[Coach Students] Error message:', error.message);
    console.error('[Coach Students] Error stack:', error.stack);
    console.error('[Coach Students] Error name:', error.name);
    console.error('[Coach Students] Error type:', error.constructor.name);
    console.error('[Coach Students] Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    
    // Ensure response hasn't been sent
    if (!res.headersSent) {
      res.status(500).json({ 
        message: 'Server error',
        error: error.message,
        detail: error.stack,
        name: error.name,
        type: error.constructor.name
      });
    } else {
      console.error('[Coach Students] Response already sent, cannot send error response');
    }
  }
});

router.get('/students', auth, async (req, res) => {
  try {
    const coach = await loadCoach(req.user.id, true);
    if (!coach) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!coach.isCoach) {
      return res.status(403).json({ message: 'Only coaches can view student lists' });
    }

    const students = (coach.students || []).map(toProgressSummary);

    res.json({
      success: true,
      students
    });
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/students/:studentId', auth, async (req, res) => {
  try {
    const coach = await loadCoach(req.user.id);
    if (!coach) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!coach.isCoach) {
      return res.status(403).json({ message: 'Only coaches can view student progress' });
    }

    const { studentId } = req.params;
    if (!coach.students.some((id) => id.equals(studentId))) {
      return res.status(403).json({ message: 'This student is not linked to your account' });
    }

    const student = await User.findById(studentId).select('username email name isCoach stats dailyProgress rating blunderRating visualisationRating endgameRating positionalRating advantageRating resourcefulnessRating repertoire openingsPracticed createdAt updatedAt progress');
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    let progressMap = {};
    if (student.progress instanceof Map) {
      progressMap = Object.fromEntries(student.progress);
    } else if (student.progress) {
      progressMap = student.progress;
    }

    res.json({
      success: true,
      student: {
        ...toProgressSummary(student),
        progressMap
      }
    });
  } catch (error) {
    console.error('Error fetching student progress:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/coaches', auth, async (req, res) => {
  try {
    const { identifier } = req.body;
    if (!identifier) {
      return res.status(400).json({ message: 'Identifier (email or username) is required' });
    }

    const student = await loadStudent(req.user.id);
    if (!student) {
      return res.status(404).json({ message: 'User not found' });
    }

    const coach = await findUserByIdentifier(identifier);
    if (!coach) {
      return res.status(404).json({ message: 'Coach not found' });
    }

    if (!coach.isCoach) {
      return res.status(400).json({ message: 'The selected user is not registered as a coach' });
    }

    if (coach._id.equals(student._id)) {
      return res.status(400).json({ message: 'You cannot add yourself as a coach' });
    }

    const alreadyLinked = student.coaches.some((id) => id.equals(coach._id));
    if (!alreadyLinked) {
      student.coaches.push(coach._id);
      await student.save();
    }

    const alreadyHasStudent = coach.students.some((id) => id.equals(student._id));
    if (!alreadyHasStudent) {
      coach.students.push(student._id);
      await coach.save();
    }

    // Create notifications for both coach and student
    try {
      if (!alreadyLinked && !alreadyHasStudent) {
        // Notify student that they've been added by a coach
        await Notification.createCoachAdded(
          student._id,
          coach._id.toString(),
          coach.username || coach.email
        );
        
        // Notify coach that they've added a new student
        await Notification.createStudentAdded(
          coach._id,
          student._id.toString(),
          student.username || student.email
        );
      }
    } catch (notificationError) {
      console.error('Error creating notifications:', notificationError);
      // Don't fail the request if notifications fail
    }

    const refreshedCoach = await User.findById(coach._id).select('username email name isCoach stats dailyProgress rating blunderRating visualisationRating endgameRating positionalRating advantageRating resourcefulnessRating repertoire openingsPracticed createdAt updatedAt');

    res.status(alreadyLinked ? 200 : 201).json({
      success: true,
      coach: toProgressSummary(refreshedCoach),
      student: {
        id: student._id.toString(),
        coaches: student.coaches.map((id) => id.toString())
      }
    });
  } catch (error) {
    console.error('Error adding coach:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/coaches', auth, async (req, res) => {
  try {
    const student = await loadStudent(req.user.id, true);
    if (!student) {
      return res.status(404).json({ message: 'User not found' });
    }

    const coaches = (student.coaches || []).map(toProgressSummary);

    res.json({
      success: true,
      coaches
    });
  } catch (error) {
    console.error('Error fetching coaches:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Health check endpoint for coach service
router.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    service: 'coach',
    timestamp: new Date().toISOString(),
    routes: {
      'PUT /status': 'Update coach status',
      'GET /students': 'Get coach students',
      'POST /students': 'Add student',
      'GET /coaches': 'Get user coaches',
      'POST /coaches': 'Add coach'
    }
  });
});

// Test endpoint to verify route registration (no auth required)
router.post('/test', (req, res) => {
  console.log('[Coach Test] POST /api/coach/test called');
  res.json({ message: 'Coach route is working', body: req.body });
});

module.exports = router;

