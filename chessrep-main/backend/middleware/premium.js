const User = require('../models/User');

/**
 * Middleware to check if user has premium access
 * Must be used after auth middleware
 */
module.exports = async function(req, res, next) {
  try {
    // Get user from database
    const user = await User.findById(req.user.id).select('userType subscriptionCurrentPeriodEnd subscriptionExtendedPeriodEnd subscriptionStatus subscriptionCancelAtPeriodEnd');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user is premium by userType
    if (user.userType !== 'premium') {
      return res.status(403).json({ 
        message: 'Premium subscription required',
        requiresPremium: true,
        userType: user.userType
      });
    }

    // Also verify subscription hasn't expired (check effective period end)
    const effectivePeriodEnd = user.subscriptionExtendedPeriodEnd && 
                               user.subscriptionCurrentPeriodEnd &&
                               user.subscriptionExtendedPeriodEnd > user.subscriptionCurrentPeriodEnd
                               ? user.subscriptionExtendedPeriodEnd 
                               : user.subscriptionCurrentPeriodEnd;

    if (effectivePeriodEnd && new Date() > effectivePeriodEnd) {
      return res.status(403).json({ 
        message: 'Premium subscription has expired',
        requiresPremium: true,
        expired: true,
        periodEnd: effectivePeriodEnd
      });
    }

    // Check if subscription is set to cancel at period end
    if (user.subscriptionCancelAtPeriodEnd && effectivePeriodEnd && new Date() >= effectivePeriodEnd) {
      return res.status(403).json({ 
        message: 'Premium subscription has been canceled',
        requiresPremium: true,
        canceled: true
      });
    }

    // User is premium and subscription is valid, continue
    next();
  } catch (error) {
    console.error('Premium middleware error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};



