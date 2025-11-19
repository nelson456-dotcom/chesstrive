const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { initializeUserRatings } = require('../utils/ratingUtils');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const axios = require('axios');

// Rate limiters
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many login attempts. Please try again later.' }
});

const signupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many signup attempts. Please try again later.' }
});

// Signup route
router.post(
  '/signup',
  signupLimiter,
  [
    body('email').isEmail().normalizeEmail(),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/)
      .withMessage('Password must include upper, lower case letters and a number'),
    body('username')
      .trim()
      .isLength({ min: 3, max: 32 })
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage('Username may contain letters, numbers, and underscores only')
  ],
  async (req, res) => {
  console.log('Signup attempt:', { email: req.body.email, username: req.body.username });
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Invalid input', errors: errors.array() });
    }

    const { email, password, username } = req.body;

    if (!email || !password || !username) {
      return res.status(400).json({ message: 'Email, password, and username are required' });
    }

    // Check if user already exists by email
    const existingUserByEmail = await User.findOne({ email });
    if (existingUserByEmail) {
      console.log('Signup failed: User with email already exists');
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Check if username already exists
    const existingUserByUsername = await User.findOne({ username });
    if (existingUserByUsername) {
      console.log('Signup failed: Username already taken');
      return res.status(400).json({ message: 'Username already taken' });
    }

    // Create new user
    const user = new User({
      email,
      password,
      username
    });

    await user.save();
    console.log('New user created:', { id: user._id, email: user.email, username: user.username });

    // Generate JWT token (consistent payload with middleware)
    const token = jwt.sign(
      { user: { id: user._id.toString() } },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    // Fetch full user object (minus password)
    const userObj = await User.findById(user._id).select('-password');

    res.status(201).json({
      token,
      user: {
        id: userObj._id.toString(),
        email: userObj.email,
        username: userObj.username,
        role: userObj.role || 'standard',
        userType: userObj.userType || 'free',
        stats: userObj.stats,
        rating: userObj.rating,
        blunderRating: userObj.blunderRating,
        visualisationRating: userObj.visualisationRating,
        endgameRating: userObj.endgameRating,
        positionalRating: userObj.positionalRating,
        advantageRating: userObj.advantageRating,
        advantageWins: userObj.advantageWins,
        resourcefulnessRating: userObj.resourcefulnessRating,
        resourcefulnessWins: userObj.resourcefulnessWins,
        defenderRating: userObj.defenderRating,
        defenderWins: userObj.defenderWins,
        repertoire: userObj.repertoire,
        purchasedOpenings: userObj.purchasedOpenings,
        isCoach: userObj.isCoach,
        coaches: userObj.coaches?.map((id) => id.toString()) || [],
        students: userObj.students?.map((id) => id.toString()) || []
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'An error occurred. Please try again later.' });
  }
});

// @route   POST api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login',
  loginLimiter,
  [
    body('identifier').optional().isString().trim().isLength({ min: 1, max: 128 }),
    body('email').optional().isEmail().normalizeEmail(),
    body('password').isString().isLength({ min: 8 })
  ],
  async (req, res) => {
  console.log('Login attempt:', { identifier: req.body.identifier || req.body.email });
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Invalid input', errors: errors.array() });
    }

    const { identifier, email, password } = req.body;
    const loginIdentifier = identifier || email; // Support both new 'identifier' field and legacy 'email' field

    if (!loginIdentifier || !password) {
      console.log('Login failed: Missing identifier or password');
      return res.status(400).json({ message: 'Username/Email and password are required' });
    }

    // Check if user exists by email or username and select necessary fields (including password for comparison)
    let user = await User.findOne({
      $or: [
        { email: loginIdentifier },
        { username: loginIdentifier }
      ]
    }).select('email username role userType stats password rating blunderRating visualisationRating endgameRating positionalRating advantageRating advantageWins resourcefulnessRating resourcefulnessWins defenderRating defenderWins repertoire purchasedOpenings isCoach coaches students');
    
    if (!user) {
      console.log('Login failed: User not found');
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Do not log sensitive fields
    console.log('User object fetched for login:', { id: user._id.toString(), email: user.email, username: user.username });

    // Validate password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log('Login failed: Invalid password');
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    console.log('Login successful for user:', user._id);

    // Create and return JWT token (payload shape compatible with middleware)
    const payload = {
      user: {
        id: user._id.toString()
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' },
      (err, token) => {
        if (err) {
          console.error('Token generation error:', err);
          throw err;
        }
        console.log('Token generated successfully');
        res.json({
          token,
          user: {
            id: user._id.toString(),
            email: user.email,
            username: user.username,
            role: user.role || 'standard',
            userType: user.userType || 'free',
            stats: user.stats,
            rating: user.rating,
            blunderRating: user.blunderRating,
            visualisationRating: user.visualisationRating,
            endgameRating: user.endgameRating,
            positionalRating: user.positionalRating,
            advantageRating: user.advantageRating,
            advantageWins: user.advantageWins,
            resourcefulnessRating: user.resourcefulnessRating,
            resourcefulnessWins: user.resourcefulnessWins,
            defenderRating: user.defenderRating,
            defenderWins: user.defenderWins,
            repertoire: user.repertoire,
            purchasedOpenings: user.purchasedOpenings,
            isCoach: user.isCoach,
            coaches: user.coaches.map((id) => id.toString()),
            students: user.students.map((id) => id.toString())
          }
        });
      }
    );
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'An error occurred. Please try again later.' });
  }
});

// @route   GET api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', auth, async (req, res) => {
  try {
    console.log('GET /me - Attempting to fetch user with ID:', req.user.id);
    const user = await User.findById(req.user.id).select('email username role userType stats rating blunderRating visualisationRating endgameRating positionalRating advantageRating advantageWins resourcefulnessRating resourcefulnessWins defenderRating defenderWins createdAt repertoire purchasedOpenings profileIcon isCoach coaches students');
    if (!user) {
      console.log('GET /me - User not found for ID:', req.user.id);
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Initialize ratings if they don't exist
    initializeUserRatings(user);
    
    // Save user if ratings were initialized
    if (!user.rating || !user.blunderRating || !user.visualisationRating || !user.endgameRating || !user.positionalRating || !user.advantageRating || !user.resourcefulnessRating || !user.defenderRating) {
      await user.save();
      console.log('GET /me - Initialized missing ratings for user:', req.user.id);
    }
    
    console.log('GET /me - User found. Sending user data:', {
      id: user._id.toString(),
      email: user.email,
      username: user.username,
      role: user.role || 'standard',
      userType: user.userType || 'free',
      stats: user.stats,
      rating: user.rating,
      blunderRating: user.blunderRating,
      visualisationRating: user.visualisationRating,
      endgameRating: user.endgameRating,
      positionalRating: user.positionalRating,
      advantageRating: user.advantageRating,
      advantageWins: user.advantageWins,
      resourcefulnessRating: user.resourcefulnessRating,
      resourcefulnessWins: user.resourcefulnessWins,
      defenderRating: user.defenderRating,
      defenderWins: user.defenderWins,
      isCoach: user.isCoach,
      coaches: user.coaches?.map((id) => id.toString()) || [],
      students: user.students?.map((id) => id.toString()) || [],
      repertoire: user.repertoire?.length || 0,
      purchasedOpenings: user.purchasedOpenings?.length || 0
    });
    res.json({
      id: user._id.toString(),
      email: user.email,
      username: user.username,
      role: user.role || 'standard',
      userType: user.userType || 'free',
      stats: user.stats,
      rating: user.rating,
      blunderRating: user.blunderRating,
      visualisationRating: user.visualisationRating,
      endgameRating: user.endgameRating,
      positionalRating: user.positionalRating,
      advantageRating: user.advantageRating,
      advantageWins: user.advantageWins,
      resourcefulnessRating: user.resourcefulnessRating,
      resourcefulnessWins: user.resourcefulnessWins,
      defenderRating: user.defenderRating,
      defenderWins: user.defenderWins,
      repertoire: user.repertoire,
      purchasedOpenings: user.purchasedOpenings,
      createdAt: user.createdAt,
      profileIcon: user.profileIcon || 'user',
      isCoach: user.isCoach,
      coaches: user.coaches?.map((id) => id.toString()) || [],
      students: user.students?.map((id) => id.toString()) || []
    });
  } catch (err) {
    console.error('Get user error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update password route
router.post('/update-password', auth, async (req, res) => {
  console.log('Password update attempt for user:', req.user.id);
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      console.log('Password update failed: User not found');
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      console.log('Password update failed: Current password incorrect');
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    // Update password
    user.password = newPassword;
    await user.save();
    console.log('Password updated successfully for user:', user.id);

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Password update error:', error);
    res.status(500).json({ message: 'Error updating password', error: error.message });
  }
});

// @route   PUT api/auth/profile-icon
// @desc    Update user's profile icon
// @access  Private
router.put('/profile-icon', auth, async (req, res) => {
  try {
    const { profileIcon } = req.body;

    if (!profileIcon) {
      return res.status(400).json({ message: 'Profile icon is required' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.profileIcon = profileIcon;
    await user.save();

    res.json({ 
      success: true, 
      message: 'Profile icon updated successfully',
      profileIcon: user.profileIcon
    });
  } catch (error) {
    console.error('Profile icon update error:', error);
    res.status(500).json({ message: 'Error updating profile icon', error: error.message });
  }
});

// @route   POST api/auth/upgrade
// @desc    Upgrade user to premium (payment placeholder)
// @access  Private
router.post('/upgrade', auth, async (req, res) => {
  try {
    const { paymentMethod, paymentId } = req.body; // Placeholder for payment processing

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // TODO: Integrate with Stripe/PayPal here. In production, require verification.
    const isProd = process.env.NODE_ENV === 'production';
    if (isProd && paymentMethod === 'test') {
      return res.status(400).json({ message: 'Test payments are not allowed in production' });
    }

    if (paymentMethod === 'stripe' || paymentMethod === 'paypal' || (!isProd && paymentMethod === 'test')) {
      // Placeholder: In production, verify payment with provider using paymentId
      user.userType = 'premium';
      await user.save();

      res.json({ 
        success: true, 
        message: 'Successfully upgraded to premium',
        userType: user.userType
      });
    } else {
      res.status(400).json({ message: 'Invalid payment method' });
    }
  } catch (error) {
    console.error('Upgrade error:', error);
    res.status(500).json({ message: 'An error occurred. Please try again later.' });
  }
});

// Helper to build response payload user object
function buildUserResponse(user) {
  return {
    id: user._id.toString(),
    email: user.email,
    username: user.username,
    role: user.role || 'standard',
    userType: user.userType || 'free',
    stats: user.stats,
    rating: user.rating,
    blunderRating: user.blunderRating,
    visualisationRating: user.visualisationRating,
    endgameRating: user.endgameRating,
    positionalRating: user.positionalRating,
    advantageRating: user.advantageRating,
    advantageWins: user.advantageWins,
    resourcefulnessRating: user.resourcefulnessRating,
    resourcefulnessWins: user.resourcefulnessWins,
    defenderRating: user.defenderRating,
    defenderWins: user.defenderWins,
    repertoire: user.repertoire,
    purchasedOpenings: user.purchasedOpenings,
    profileIcon: user.profileIcon || 'user',
    isCoach: user.isCoach,
    coaches: user.coaches?.map((id) => id.toString()) || [],
    students: user.students?.map((id) => id.toString()) || []
  };
}

// Issue JWT for user
function issueJwtForUser(user) {
  const payload = {
    user: {
      id: user._id.toString()
    }
  };
  return jwt.sign(payload, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '24h' });
}

// @route   POST api/auth/google
// @desc    Login/signup with Google ID token
// @access  Public
router.post('/google', async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken) {
      return res.status(400).json({ message: 'idToken is required' });
    }

    // Verify Google ID token via Google endpoint (no extra deps)
    const verifyUrl = `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`;
    const { data: tokenInfo } = await axios.get(verifyUrl);
    const email = tokenInfo.email;
    const googleId = tokenInfo.sub;
    const name = tokenInfo.name || '';

    if (!email || !googleId) {
      return res.status(400).json({ message: 'Invalid Google token' });
    }

    // Find by googleId or email
    let user = await User.findOne({ $or: [{ googleId }, { email }] });
    if (!user) {
      // Derive username (unique) from email local-part
      const baseUsername = (email.split('@')[0] || 'user').toLowerCase().replace(/[^a-z0-9_]/g, '_').slice(0, 32);
      let candidate = baseUsername || 'user';
      let suffix = 0;
      // ensure unique username
      // eslint-disable-next-line no-constant-condition
      while (true) {
        // eslint-disable-next-line no-await-in-loop
        const exists = await User.findOne({ username: candidate });
        if (!exists) break;
        suffix += 1;
        candidate = `${baseUsername}_${suffix}`;
      }

      user = new User({
        email,
        username: candidate,
        name,
        googleId
      });
      await user.save();
    } else {
      // Attach googleId if missing
      if (!user.googleId) {
        user.googleId = googleId;
        await user.save();
      }
    }

    const token = issueJwtForUser(user);
    const userObj = await User.findById(user._id).select('-password');
    return res.json({ token, user: buildUserResponse(userObj) });
  } catch (error) {
    // If Google returns non-200, axios throws
    console.error('Google login error:', error.response?.data || error.message);
    return res.status(400).json({ message: 'Google authentication failed' });
  }
});

// @route   POST api/auth/facebook
// @desc    Login/signup with Facebook access token
// @access  Public
router.post('/facebook', async (req, res) => {
  try {
    const { accessToken } = req.body;
    if (!accessToken) {
      return res.status(400).json({ message: 'accessToken is required' });
    }

    // Fetch user info from Facebook Graph API
    const meUrl = `https://graph.facebook.com/me?fields=id,name,email&access_token=${encodeURIComponent(accessToken)}`;
    const { data: fbUser } = await axios.get(meUrl);

    const facebookId = fbUser.id;
    const name = fbUser.name || '';
    const email = fbUser.email; // may be undefined if not granted

    if (!facebookId) {
      return res.status(400).json({ message: 'Invalid Facebook token' });
    }

    // Prefer matching by facebookId, otherwise by email if available
    let query = [{ facebookId }];
    if (email) {
      query.push({ email });
    }

    let user = await User.findOne({ $or: query });
    if (!user) {
      // If no email, synthesize a placeholder to satisfy schema uniqueness constraints
      const synthesizedEmail = email || `fb_${facebookId}@placeholder.facebook.local`;
      const baseUsernameFromName = (name || 'user').toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '_').slice(0, 32);
      const baseUsername = (email ? (email.split('@')[0] || baseUsernameFromName) : baseUsernameFromName) || 'user';
      let candidate = baseUsername;
      let suffix = 0;
      // eslint-disable-next-line no-constant-condition
      while (true) {
        // eslint-disable-next-line no-await-in-loop
        const exists = await User.findOne({ username: candidate });
        if (!exists) break;
        suffix += 1;
        candidate = `${baseUsername}_${suffix}`;
      }

      user = new User({
        email: synthesizedEmail,
        username: candidate,
        name,
        facebookId
      });
      await user.save();
    } else {
      // Attach facebookId if missing
      if (!user.facebookId) {
        user.facebookId = facebookId;
        await user.save();
      }
    }

    const token = issueJwtForUser(user);
    const userObj = await User.findById(user._id).select('-password');
    return res.json({ token, user: buildUserResponse(userObj) });
  } catch (error) {
    console.error('Facebook login error:', error.response?.data || error.message);
    return res.status(400).json({ message: 'Facebook authentication failed' });
  }
});

module.exports = router; 