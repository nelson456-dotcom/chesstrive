const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth');
const User = require('../models/User');

// @route   POST api/users
// @desc    Register a user
// @access  Public
router.post('/', async (req, res) => {
  console.log('Registration attempt:', { email: req.body.email, username: req.body.username, name: req.body.name });
  try {
    const { username, email, password, name } = req.body;

    // Validate input
    if (!username || !email || !password || !name) {
      console.log('Registration failed: Missing required fields');
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Check if user already exists
    let user = await User.findOne({ $or: [{ email }, { username }] });
    if (user) {
      console.log('Registration failed: User already exists');
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create new user
    user = new User({
      username,
      email,
      password,
      name
    });

    await user.save();
    console.log('New user created:', { id: user._id, email: user.email, username: user.username, name: user.name });

    // Create and return JWT token
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
        res.status(201).json({
          token,
          user: {
            id: user._id.toString(),
            email: user.email,
            username: user.username,
            name: user.name,
            role: user.role || 'standard',
            isCoach: user.isCoach,
            coaches: user.coaches.map((id) => id.toString()),
            students: user.students.map((id) => id.toString())
          }
        });
      }
    );
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET api/users/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password blunderRating visualisationRating');
    res.json({ user });
  } catch (err) {
    console.error('Error fetching profile:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST api/users/update-password
// @desc    Update user password
// @access  Private
router.post('/update-password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error('Error updating password:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 