const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
  // Log auth attempts for coach routes
  if (req.path && req.path.includes('coach')) {
    console.log('[Auth Middleware] Coach route auth check:', {
      path: req.path,
      method: req.method,
      hasXAuthToken: !!req.header('x-auth-token'),
      hasAuthorization: !!req.header('Authorization')
    });
  }

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
    if (req.path && req.path.includes('coach')) {
      console.log('[Auth Middleware] No token found for coach route');
    }
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    // Ensure user ID is a string
    req.user = {
      id: decoded.user.id.toString()
    };
    
    if (req.path && req.path.includes('coach')) {
      console.log('[Auth Middleware] Auth successful for coach route, user ID:', req.user.id);
    }
    
    next();
  } catch (err) {
    if (req.path && req.path.includes('coach')) {
      console.error('[Auth Middleware] Auth failed for coach route:', err.message);
    }
    
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