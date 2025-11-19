const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:3001',
      changeOrigin: true,
      logLevel: 'warn',
      onError: (err, req, res) => {
        console.error('Proxy error:', err.message);
        // Ensure we return JSON, not HTML
        if (!res.headersSent) {
          res.status(503).json({ 
            success: false,
            message: 'Backend server is not available. Please ensure the backend is running on port 3001.',
            error: 'ECONNREFUSED'
          });
        }
      },
      onProxyReq: (proxyReq, req, res) => {
        // Log proxy requests in development
        if (process.env.NODE_ENV === 'development') {
          console.log(`[Proxy] ${req.method} ${req.url} -> http://localhost:3001${req.url}`);
          console.log(`[Proxy] Full proxyReq path: ${proxyReq.path}`);
        }
      },
      onProxyRes: (proxyRes, req, res) => {
        // Ensure Content-Type is set correctly
        if (proxyRes.statusCode >= 400 && !proxyRes.headers['content-type']?.includes('application/json')) {
          // If backend returns non-JSON error, we'll handle it in the frontend
        }
      }
    })
  );
};
