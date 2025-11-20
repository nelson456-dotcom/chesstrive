const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoose = require('mongoose');
const http = require('http');
const WebSocket = require('ws');
require('dotenv').config();

// Set mongoose options globally
mongoose.set('bufferCommands', true);

const app = express();
// Trust proxy (needed when behind Nginx)
app.set('trust proxy', 1);
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Middleware
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(',');
app.use(cors({
  origin: function(origin, callback) {
    // allow requests with no origin like mobile apps or curl
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
app.use(helmet({
  crossOriginEmbedderPolicy: false, // keep compatibility if needed
}));

// Stripe webhook route must be before express.json() to receive raw body
let stripeWebhook;
try {
  stripeWebhook = require('./routes/stripe');
  app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), stripeWebhook.handleWebhook);
} catch (error) {
  console.warn('Stripe module not found. Stripe routes will be disabled. Install stripe with: npm install stripe');
}

app.use(express.json({ limit: '1mb' }));

// Logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  if (req.url.includes('/collaboration/invite')) {
    console.log('=== COLLABORATION INVITE REQUEST ===');
    console.log('Headers:', req.headers);
    console.log('Body:', req.body);
  }
  next();
});

// Connect to MongoDB (optional for analysis-only mode)
const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/chessrep';
console.log('🔌 Attempting to connect to MongoDB...');
console.log('MongoDB URI:', mongoURI.replace(/\/\/.*@/, '//<credentials>@')); // Hide credentials in log

mongoose.connect(mongoURI, {
  serverSelectionTimeoutMS: 60000, // Increase timeout to 60s
  socketTimeoutMS: 120000,
  connectTimeoutMS: 60000,
  maxPoolSize: 10,
  bufferCommands: true
})
  .then(() => {
    console.log('✅ MongoDB Connected Successfully');
    console.log('Database:', mongoose.connection.db.databaseName);
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
    console.error('Error name:', err.name);
    console.log('⚠️  Running without MongoDB - analysis will work but no data will be stored');
    console.log('💡 To fix this:');
    console.log('   1. Make sure MongoDB is running: mongod --dbpath <your-data-path>');
    console.log('   2. Or install MongoDB: https://www.mongodb.com/try/download/community');
    console.log('   3. Check connection string in .env file');
  });

// Monitor MongoDB connection status
mongoose.connection.on('connected', () => {
  console.log('🟢 Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('🔴 Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('🔴 Mongoose disconnected from MongoDB');
});

// Health check endpoint with detailed diagnostics
app.get('/api/health', (req, res) => {
  const mongoStatus = mongoose.connection.readyState;
  const mongoStates = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };
  
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    mongodb: {
      status: mongoStates[mongoStatus],
      readyState: mongoStatus,
      isConnected: mongoStatus === 1,
      database: mongoose.connection.db?.databaseName || 'not connected'
    },
    server: {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      nodeVersion: process.version
    }
  });
});

// Routes
const authRoute = require('./routes/auth');
const puzzlesRoute = require('./routes/puzzles');
const endgamesRoute = require('./routes/endgames');
const blunderRoute = require('./routes/blunder');
const visualRoute = require('./routes/visualisation');
app.use('/api/auth', authRoute);
app.use('/api/users', require('./routes/users'));
app.use('/api/stats', require('./routes/stats'));
app.use('/api/puzzles', puzzlesRoute);
app.use('/api/analysis', require('./routes/analysis'));
app.use('/api/openings', require('./routes/openings'));
app.use('/api/famous-games', require('./routes/famousGames'));
app.use('/api/endgames', endgamesRoute);
app.use('/api/blunder-preventer', blunderRoute);
app.use('/api/visualisation', visualRoute);
app.use('/api/leaderboard', require('./routes/leaderboard'));
app.use('/api/games', require('./routes/games'));
app.use('/api/positional', require('./routes/positional'));
app.use('/api/bot', require('./routes/bot'));
app.use('/api/puzzles/rush', require('./routes/puzzleRush'));
app.use('/api/advantage', require('./routes/advantage'));
app.use('/api/resourcefulness', require('./routes/resourcefulness'));
app.use('/api/defender', require('./routes/defender'));
app.use('/api/pdf', require('./routes/pdf'));
app.use('/api/training', require('./routes/training'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/puzzle-rush', require('./routes/puzzleRushPuzzles'));
app.use('/api/studies', require('./routes/studies'));
app.use('/api/chapters', require('./routes/chapters'));
app.use('/api/daily-progress', require('./routes/dailyProgress'));
app.use('/api/posts', require('./routes/posts'));
app.use('/api/forum', require('./routes/forum'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/coach', require('./routes/coach'));
app.use('/api/usage-limits', require('./routes/usageLimits'));
// Stripe routes (optional - only if stripe module is installed)
try {
  app.use('/api/stripe', require('./routes/stripe'));
} catch (error) {
  console.warn('Stripe routes not available. Install stripe with: npm install stripe');
}

// Test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is running!' });
});

// Studies and Chapters routes
console.log('Loading studies and chapters routes...');
try {
  const studiesRoute = require('./routes/studies');
  const chaptersRoute = require('./routes/chapters');
  app.use('/api/studies', studiesRoute);
  app.use('/api/chapters', chaptersRoute);
  console.log('Studies and chapters routes loaded successfully');
} catch (error) {
  console.error('Error loading studies/chapters routes:', error);
}

// Collaboration routes
console.log('Loading collaboration routes...');
try {
  const collaborationRoute = require('./routes/collaboration');
  app.use('/api/collaboration', collaborationRoute);
  console.log('Collaboration routes loaded successfully');
  console.log('Available collaboration routes:');
  collaborationRoute.stack.forEach((layer) => {
    if (layer.route) {
      const methods = Object.keys(layer.route.methods).join(', ').toUpperCase();
      console.log(`  ${methods} ${layer.route.path}`);
    }
  });
} catch (error) {
  console.error('Error loading collaboration routes:', error);
}

// New production-quality routes
app.use('/api/opening', require('./routes/opening'));
app.use('/api/tablebase', require('./routes/tablebase'));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  console.error('Error stack:', err.stack);
  console.error('Request path:', req.path);
  
  // For puzzle routes, return fallback puzzle instead of 500
  // This ensures free users can always access puzzles even if there's a server error
  if (req.path && (req.path.includes('/puzzles') || req.path.includes('/puzzle-rush'))) {
    console.log('[Global Error Handler] Returning fallback puzzle for puzzle route error');
    const fallbackPuzzle = {
      _id: 'fallback-global-error',
      fen: 'rnbqkb1r/pppp1ppp/5n2/4p3/2B1P3/8/PPPP1PPP/RNBQK1NR w KQkq - 0 1',
      moves: ['Nf3'],
      rating: 1200,
      theme: 'tactics'
    };
    if (!res.headersSent) {
      return res.json({ puzzles: [fallbackPuzzle] });
    }
  }
  
  // For other routes, return generic error
  if (!res.headersSent) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ============================================================================
// REAL-TIME SYNC - Sequenced Protocol with ACKs and Guaranteed Delivery
// ============================================================================

// Study state store with sequencing
const studyStates = new Map(); // studyId -> StudyState
const studyRooms = new Map(); // studyId -> Set of WebSocket connections

class StudyState {
  constructor(studyId) {
    this.studyId = studyId;
    this.seq = 0; // Monotonic sequence number
    this.activeChapterId = null;
    this.chapters = new Map(); // chapterId -> { title, order }
    this.events = []; // Recent events for catch-up (keep last 100)
    this.presence = new Map(); // userId -> { username, chapterId, lastSeen }
  }
  
  nextSeq() {
    return ++this.seq;
  }
  
  addEvent(event) {
    event.seq = this.nextSeq();
    event.timestamp = Date.now();
    this.events.push(event);
    
    // Keep only last 100 events for catch-up
    if (this.events.length > 100) {
      this.events.shift();
    }
    
    console.log(`📊 Study ${this.studyId} - Event seq=${event.seq}, type=${event.type}`);
    return event;
  }
  
  getEventsSince(seq) {
    return this.events.filter(e => e.seq > seq);
  }
  
  updatePresence(userId, username, chapterId) {
    this.presence.set(userId, {
      username: username || userId,
      chapterId,
      lastSeen: Date.now()
    });
  }
  
  removePresence(userId) {
    this.presence.delete(userId);
  }
  
  getPresence() {
    // Clean up stale presence (> 30 seconds)
    const now = Date.now();
    const staleThreshold = 30000;
    
    for (const [userId, data] of this.presence.entries()) {
      if (now - data.lastSeen > staleThreshold) {
        this.presence.delete(userId);
      }
    }
    
    return Array.from(this.presence.entries()).map(([userId, data]) => ({
      userId,
      ...data
    }));
  }
}

function getOrCreateStudyState(studyId) {
  if (!studyStates.has(studyId)) {
    console.log(`📊 Creating new StudyState for study ${studyId}`);
    studyStates.set(studyId, new StudyState(studyId));
  }
  return studyStates.get(studyId);
}

function generateNodeId() {
  return `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

wss.on('connection', (ws, req) => {
  console.log('New WebSocket connection');
  
  // Parse authentication token from query string
  const url = new URL(req.url, `http://${req.headers.host}`);
  const token = url.searchParams.get('token');
  
  // For analysis connections, skip auth (allow anonymous)
  // For study connections, require auth
  if (!token) {
    // Allow anonymous for analysis, but will require auth for study operations
    ws.userId = 'anonymous';
    ws.username = 'anonymous';
    ws.studyId = null;
    ws.chapterId = null;
  } else {
    try {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      ws.userId = decoded.user.id.toString();
      ws.username = decoded.user.username || decoded.user.email || ws.userId;
      ws.studyId = null;
      ws.chapterId = null;
      console.log(`User ${ws.username} (${ws.userId}) connected to WebSocket`);
    } catch (err) {
      // For analysis, allow anonymous connections even with invalid token
      ws.userId = 'anonymous';
      ws.username = 'anonymous';
      ws.studyId = null;
      ws.chapterId = null;
    }
  }
  
  // Set up analysis handler (for analysis messages)
  // This will intercept analysis messages before they reach the main handler
  const { handleAnalysisWebSocket } = require('./routes/analysisStream');
  handleAnalysisWebSocket(ws, req);
  
  // Handle incoming messages (study/collaboration messages)
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      const { type, payload } = data;
      
      // Skip analysis messages - they're handled by handleAnalysisWebSocket
      if (type === 'start_analysis' || type === 'cancel_analysis') {
        return;
      }
      
      switch (type) {
        case 'join-study':
          handleJoinStudy(ws, payload.studyId, payload.username);
          break;
        case 'leave-study':
          handleLeaveStudy(ws, payload.studyId);
          break;
        case 'move-made':
          handleMoveMade(ws, payload);
          break;
        case 'position-updated':
          handlePositionUpdated(ws, payload);
          break;
        case 'chapter-changed':
        case 'chapter-selected':
          handleChapterChanged(ws, payload);
          break;
        case 'chapter-created':
          handleChapterCreated(ws, payload);
          break;
        case 'sync.request':
          handleSyncRequest(ws, payload);
          break;
        case 'presence.heartbeat':
          handlePresenceHeartbeat(ws, payload);
          break;
        default:
          console.log('Unknown message type:', type);
      }
    } catch (err) {
      console.error('Error parsing WebSocket message:', err);
    }
  });
  
  // Handle disconnection
  ws.on('close', () => {
    console.log(`User ${ws.username} disconnected from WebSocket`);
    if (ws.studyId) {
      handleLeaveStudy(ws, ws.studyId);
    }
  });
});

// Helper functions for WebSocket events
function handleJoinStudy(ws, studyId, username) {
  if (ws.studyId) {
    handleLeaveStudy(ws, ws.studyId);
  }
  
  ws.studyId = studyId;
  if (username) {
    ws.username = username;
  }
  
  if (!studyRooms.has(studyId)) {
    studyRooms.set(studyId, new Set());
  }
  studyRooms.get(studyId).add(ws);
  
  const state = getOrCreateStudyState(studyId);
  state.updatePresence(ws.userId, ws.username, ws.chapterId);
  
  console.log(`User ${ws.username} joined study ${studyId}`);
  
  // Create sequenced event for user joined
  const event = state.addEvent({
    type: 'user.joined',
    studyId,
    userId: ws.userId,
    username: ws.username
  });
  
  // Broadcast to ALL clients (including sender to confirm)
  broadcastToStudy(studyId, event, null);
  
  // Send current presence to the joining user
  ws.send(JSON.stringify({
    type: 'presence.update',
    studyId,
    presence: state.getPresence()
  }));
}

function handleLeaveStudy(ws, studyId) {
  if (studyRooms.has(studyId)) {
    studyRooms.get(studyId).delete(ws);
    if (studyRooms.get(studyId).size === 0) {
      studyRooms.delete(studyId);
    }
  }
  
  const state = getOrCreateStudyState(studyId);
  state.removePresence(ws.userId);
  
  ws.studyId = null;
  ws.chapterId = null;
  console.log(`User ${ws.username} left study ${studyId}`);
  
  // Create sequenced event for user left
  const event = state.addEvent({
    type: 'user.left',
    studyId,
    userId: ws.userId,
    username: ws.username
  });
  
  // Broadcast to remaining users
  broadcastToStudy(studyId, event, null);
}

function handlePresenceHeartbeat(ws, payload) {
  const { studyId, chapterId } = payload;
  
  if (ws.studyId === studyId) {
    ws.chapterId = chapterId;
    const state = getOrCreateStudyState(studyId);
    state.updatePresence(ws.userId, ws.username, chapterId);
    
    // Broadcast presence update to all clients
    broadcastToStudy(studyId, {
      type: 'presence.update',
      studyId,
      presence: state.getPresence()
    }, null);
  }
}

function handleMoveMade(ws, payload) {
  const { studyId, chapterId, clientMsgId, san, fen, path, currentPath, currentMoveIndex, tree, gameTree } = payload;
  console.log(`🎯 User ${ws.userId} made move ${san} in study ${studyId}, chapter ${chapterId}`);
  
  const state = getOrCreateStudyState(studyId);
  
  // Create sequenced event
  const nodeId = generateNodeId();
  const event = state.addEvent({
    type: 'move.played',
    studyId,
    chapterId,
    nodeId,
    san,
    fen,
    path,
    currentPath,
    currentMoveIndex,
    tree,
    gameTree,
    userId: ws.userId
  });
  
  // Send ACK to sender
  console.log(`✅ Sending ACK for move ${san}, seq=${event.seq}, nodeId=${nodeId}`);
  ws.send(JSON.stringify({
    type: 'ack',
    clientMsgId,
    seq: event.seq,
    nodeId
  }));
  
  // Broadcast event to ALL clients in study (including sender for confirmation)
  console.log(`📢 Broadcasting move.played event seq=${event.seq} to study ${studyId}`);
  broadcastToStudy(studyId, event, null); // Send event directly, not wrapped
}

function handlePositionUpdated(ws, payload) {
  const { studyId, chapterId, position, gameState } = payload;
  console.log(`User ${ws.userId} updated position in study ${studyId}, chapter ${chapterId}`);
  
  broadcastToStudy(studyId, {
    type: 'position-received',
    payload: {
      userId: ws.userId,
      studyId: studyId,
      chapterId: chapterId,
      position: position,
      gameState: gameState,
      timestamp: new Date()
    }
  }, ws);
}

function handleChapterChanged(ws, payload) {
  const { studyId, chapterId, chapterName, clientMsgId } = payload;
  console.log(`📖 User ${ws.userId} changed to chapter ${chapterId} in study ${studyId}`);
  
  const state = getOrCreateStudyState(studyId);
  state.activeChapterId = chapterId;
  
  // Update user's chapter in presence
  ws.chapterId = chapterId;
  state.updatePresence(ws.userId, ws.username, chapterId);
  
  // Create sequenced event
  const event = state.addEvent({
    type: 'chapter.changed',
    studyId,
    chapterId,
    chapterName,
    userId: ws.userId,
    username: ws.username
  });
  
  // Send ACK to sender
  console.log(`✅ Sending ACK for chapter change, seq=${event.seq}`);
  ws.send(JSON.stringify({
    type: 'ack',
    clientMsgId,
    seq: event.seq
  }));
  
  // Broadcast event to ALL clients
  console.log(`📢 Broadcasting chapter.changed event seq=${event.seq} to study ${studyId}`);
  broadcastToStudy(studyId, event, null); // Send event directly, not wrapped
  
  // Broadcast updated presence
  broadcastToStudy(studyId, {
    type: 'presence.update',
    studyId,
    presence: state.getPresence()
  }, null);
}

function handleChapterCreated(ws, payload) {
  const { studyId, chapterId, title, clientMsgId } = payload;
  console.log(`📝 User ${ws.userId} created chapter ${title} in study ${studyId}`);
  
  const state = getOrCreateStudyState(studyId);
  
  // Create sequenced event
  const order = state.chapters.size;
  const event = state.addEvent({
    type: 'chapter.created',
    studyId,
    chapterId,
    title,
    order,
    userId: ws.userId
  });
  
  state.chapters.set(chapterId, { title, order });
  
  // Send ACK to sender
  console.log(`✅ Sending ACK for chapter creation, seq=${event.seq}`);
  ws.send(JSON.stringify({
    type: 'ack',
    clientMsgId,
    seq: event.seq
  }));
  
  // Broadcast event to ALL clients
  console.log(`📢 Broadcasting chapter.created event seq=${event.seq} to study ${studyId}`);
  broadcastToStudy(studyId, event, null); // Send event directly, not wrapped
}

function handleSyncRequest(ws, payload) {
  const { studyId, lastSeq } = payload;
  console.log(`🔄 User ${ws.userId} requesting sync for study ${studyId}, lastSeq=${lastSeq}`);
  
  const state = getOrCreateStudyState(studyId);
  const missedEvents = state.getEventsSince(lastSeq || 0);
  
  console.log(`📦 Sending sync response: currentSeq=${state.seq}, ${missedEvents.length} missed events`);
  
  ws.send(JSON.stringify({
    type: 'sync.response',
    studyId,
    currentSeq: state.seq,
    activeChapterId: state.activeChapterId,
    chapters: Array.from(state.chapters.entries()).map(([id, data]) => ({ id, ...data })),
    events: missedEvents,
    presence: state.getPresence()
  }));
}

function broadcastToStudy(studyId, message, excludeWs = null) {
  if (studyRooms.has(studyId)) {
    studyRooms.get(studyId).forEach(ws => {
      if (ws !== excludeWs && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
      }
    });
  }
}

// Make wss available to routes
app.set('wss', wss);

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`WebSocket server ready for real-time collaboration`);
});