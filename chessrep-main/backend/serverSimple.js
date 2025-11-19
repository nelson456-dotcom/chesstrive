const express = require('express');
const cors = require('cors');

const app = express();

// Middleware
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(',');
app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token']
}));
app.use(express.json({ limit: '1mb' }));

// Logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Mock user data for testing
let mockUsers = {
  'test-user': {
    id: 'test-user',
    username: 'admin',
    email: 'Tula@tula1.com',
    rating: 1200,
    blunderRating: 1200,
    visualisationRating: 1200,
    stats: {
      puzzleStats: { totalAttempted: 0, totalSolved: 0, totalFailed: 0 }
    }
  }
};

// Mock auth middleware
const mockAuth = (req, res, next) => {
  const token = req.headers['x-auth-token'];
  if (token) {
    req.user = mockUsers['test-user'];
    console.log('Mock auth: User authenticated with token:', token);
  } else {
    console.log('Mock auth: No token provided');
  }
  next();
};

// Routes
app.get('/api/auth/me', mockAuth, (req, res) => {
  if (req.user) {
    res.json(req.user);
  } else {
    res.status(401).json({ message: 'No token provided' });
  }
});

app.post('/api/puzzles/stats/puzzle', mockAuth, (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const { solved, puzzleRating } = req.body;
  
  // Simple ELO calculation
  const userRating = req.user.rating;
  const expectedScore = 1 / (1 + Math.pow(10, (puzzleRating - userRating) / 400));
  const actualScore = solved ? 1 : 0;
  const ratingChange = Math.round(32 * (actualScore - expectedScore));
  
  // Update user rating
  req.user.rating += ratingChange;
  
  // Update stats
  req.user.stats.puzzleStats.totalAttempted++;
  if (solved) {
    req.user.stats.puzzleStats.totalSolved++;
  } else {
    req.user.stats.puzzleStats.totalFailed++;
  }
  
  console.log(`Rating update: ${userRating} -> ${req.user.rating} (change: ${ratingChange})`);
  
  res.json({
    newRating: req.user.rating,
    ratingChange: ratingChange,
    oldRating: userRating
  });
});

app.post('/api/endgames/stats', mockAuth, (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const { solved, puzzleRating } = req.body;
  
  // Simple ELO calculation for endgames
  const userRating = req.user.rating;
  const expectedScore = 1 / (1 + Math.pow(10, (puzzleRating - userRating) / 400));
  const actualScore = solved ? 1 : 0;
  const ratingChange = Math.round(32 * (actualScore - expectedScore));
  
  // Update user rating
  req.user.rating += ratingChange;
  
  console.log(`Endgame rating update: ${userRating} -> ${req.user.rating} (change: ${ratingChange})`);
  
  res.json({
    newRating: req.user.rating,
    ratingChange: ratingChange,
    oldRating: userRating
  });
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Simple test server is running on port ${PORT}`);
  console.log('Mock user created with rating 1200');
});
