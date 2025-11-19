const User = require('../models/User');

/**
 * Middleware to check if user has premium access
 * Must be used after auth middleware
 */
module.exports = async function(req, res, next) {
  try {
    // Get user from database
    const user = await User.findById(req.user.id).select('userType');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user is premium
    if (user.userType !== 'premium') {
      return res.status(403).json({ 
        message: 'Premium subscription required',
        requiresPremium: true,
        userType: user.userType
      });
    }

    // User is premium, continue
    next();
  } catch (error) {
    console.error('Premium middleware error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};



