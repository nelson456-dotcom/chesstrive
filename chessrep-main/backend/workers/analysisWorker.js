/**
 * Analysis Worker - Processes queued game analysis jobs
 * Run with: npm run worker
 * Or: node workers/analysisWorker.js
 * 
 * This worker handles Stockfish analysis in parallel to support 1000+ concurrent users
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Queue = require('bull');
const os = require('os');

// Import analysis functions from games route
// We need to import the analysis logic, but avoid circular dependencies
// So we'll duplicate the critical parts here

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/chessrep', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('[Worker] MongoDB connected');
  } catch (error) {
    console.error('[Worker] MongoDB connection error:', error.message);
    process.exit(1);
  }
};

// Initialize Redis connection for queue
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: null,
  enableReadyCheck: false
};

// Initialize queue
const analysisQueue = new Queue('game-analysis', {
  redis: redisConfig
});

// Get CPU count for optimal concurrency
const cpuCount = os.cpus().length;
const CONCURRENT_JOBS = Math.min(10, Math.max(3, Math.floor(cpuCount / 2))); // 3-10 jobs concurrently

console.log(`[Worker] Initializing analysis worker`);
console.log(`[Worker] CPU cores: ${cpuCount}`);
console.log(`[Worker] Concurrent jobs: ${CONCURRENT_JOBS}`);

// Import the runFullAnalysis function
// We need to load the games route module to access the function
let runFullAnalysis;

(async () => {
  try {
    // Connect to database
    await connectDB();
    
    // Dynamically require the games route to access runFullAnalysis
    // This avoids circular dependencies
    const gamesRoute = require('../routes/games');
    
    // Process jobs from queue
    analysisQueue.process(CONCURRENT_JOBS, async (job) => {
      const { handle, timeClass, platform, userId, cacheKey } = job.data;
      
      console.log(`[Worker] Processing job ${job.id} for ${handle} (user: ${userId})`);
      job.progress(0);
      
      try {
        // Import runFullAnalysis from games route (exported)
        delete require.cache[require.resolve('../routes/games')];
        const { runFullAnalysis } = require('../routes/games');
        
        job.progress(10);
        
        // Run the analysis (handles 40 games with optimized Stockfish)
        const result = await runFullAnalysis(handle, timeClass, platform);
        
        job.progress(100);
        
        console.log(`[Worker] Job ${job.id} completed for ${handle}, analyzed ${result.allAnalysis.length} games`);
        return result;
        
      } catch (error) {
        console.error(`[Worker] Job ${job.id} failed:`, error.message);
        throw error; // Let Bull retry if configured
      }
    });
    
    console.log(`[Worker] Worker started, processing up to ${CONCURRENT_JOBS} jobs concurrently`);
    
    // Handle job events
    analysisQueue.on('completed', (job, result) => {
      console.log(`[Worker] Job ${job.id} completed successfully`);
    });
    
    analysisQueue.on('failed', (job, err) => {
      console.error(`[Worker] Job ${job.id} failed:`, err.message);
    });
    
    analysisQueue.on('error', (error) => {
      console.error('[Worker] Queue error:', error);
    });
    
    // Graceful shutdown
    process.on('SIGTERM', async () => {
      console.log('[Worker] SIGTERM received, closing queue...');
      await analysisQueue.close();
      await mongoose.connection.close();
      process.exit(0);
    });
    
  } catch (error) {
    console.error('[Worker] Initialization error:', error);
    process.exit(1);
  }
})();

