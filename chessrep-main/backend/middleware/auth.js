const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
  // Get token from x-auth-token or Authorization header
  let token = req.header('x-auth-token');
  if (!token) {
    const authHeader = req.header('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
  }

  // Check if no token
  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    // Ensure user ID is a string
    req.user = {
      id: decoded.user.id.toString()
    };
    next();
  } catch (err) {
    // Provide more specific error messages
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        message: 'Token expired', 
        code: 'TOKEN_EXPIRED' 
      });
    } else if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        message: 'Invalid token', 
        code: 'TOKEN_INVALID' 
      });
    }
    return res.status(401).json({ 
      message: 'Token is not valid', 
      code: 'TOKEN_INVALID' 
    });
  }
}; 