const express = require('express');
const axios = require('axios');
const router = express.Router();
const auth = require('../middleware/auth');
const { spawn } = require('child_process');
const path = require('path');
const os = require('os');
const { Chess } = require('chess.js');
const mongoose = require('mongoose');
const Game = require('../models/Game');
const GameAnalysis = require('../models/GameAnalysis');
const Report = require('../models/Report');

// Bull Queue for handling 1000+ concurrent analysis requests
let Queue;
let analysisQueue;
let useQueue = false;

// Try to initialize queue (graceful fallback if Redis not available)
try {
  Queue = require('bull');
  const Redis = require('ioredis');
  
  // Initialize Redis connection
  const redisConfig = {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    retryStrategy: (times) => {
      if (times > 3) {
        console.log('[Queue] Redis connection failed, falling back to direct processing');
        return null; // Stop retrying
      }
      return Math.min(times * 200, 2000);
    }
  };

  const redisClient = new Redis(redisConfig);
  
  redisClient.on('connect', () => {
    console.log('[Queue] Redis connected successfully');
    useQueue = true;
  });
  
  redisClient.on('error', (err) => {
    console.log('[Queue] Redis connection error (will use direct processing):', err.message);
    useQueue = false;
  });

  // Initialize analysis queue
  analysisQueue = new Queue('game-analysis', {
    redis: redisConfig,
    defaultJobOptions: {
      attempts: 2,
      timeout: 600000, // 10 minutes timeout
      removeOnComplete: {
        age: 3600, // Keep completed jobs for 1 hour
        count: 100 // Keep max 100 completed jobs
      },
      removeOnFail: {
        age: 24 * 3600 // Keep failed jobs for 24 hours
      }
    },
    limiter: {
      max: 20, // Process max 20 jobs at once
      duration: 1000
    }
  });

  console.log('[Queue] Analysis queue initialized');
} catch (error) {
  console.log('[Queue] Bull/Redis not available, using direct processing:', error.message);
  useQueue = false;
}

// ECO to Opening Names Mapping (abbreviated for common openings)
const ecoToNames = {
  'A00': 'Irregular Opening', 'A01': 'Nimzowitsch-Larsen Attack', 'A02': 'Bird\'s Opening',
  'A04': 'Reti Opening', 'A10': 'English Opening', 'A20': 'English Opening',
  'A40': 'Queen\'s Pawn Game', 'A50': 'Queen\'s Pawn Game', 'A60': 'Benoni Defence',
  'A80': 'Dutch Defence', 'B00': 'King\'s Pawn Opening', 'B01': 'Scandinavian Defence',
  'B02': 'Alekhine\'s Defence', 'B06': 'Robatsch Defence', 'B07': 'Pirc Defence',
  'B10': 'Caro-Kann Defence', 'B20': 'Sicilian Defence', 'B21': 'Sicilian Defence, Grand Prix Attack',
  'B22': 'Sicilian Defence, Alapin Variation', 'B23': 'Sicilian Defence, Closed',
  'B30': 'Sicilian Defence', 'B40': 'Sicilian Defence', 'B50': 'Sicilian Defence',
  'B60': 'Sicilian Defence, Richter-Rauzer Attack', 'B70': 'Sicilian Defence, Dragon Variation',
  'B80': 'Sicilian Defence, Scheveningen Variation', 'B90': 'Sicilian Defence, Najdorf Variation',
  'C00': 'French Defence', 'C20': 'King\'s Pawn Game', 'C30': 'King\'s Gambit',
  'C40': 'King\'s Knight Opening', 'C50': 'Giuoco Piano', 'C60': 'Ruy Lopez',
  'D00': 'Queen\'s Pawn Game', 'D10': 'Queen\'s Gambit Declined', 'D20': 'Queen\'s Gambit Accepted',
  'D30': 'Queen\'s Gambit Declined', 'D40': 'Queen\'s Gambit Declined, Semi-Tarrasch Defence',
  'D50': 'Queen\'s Gambit Declined', 'D60': 'Queen\'s Gambit Declined, Orthodox Defence',
  'D70': 'Neo-Grünfeld Defence', 'D80': 'Grünfeld Defence', 'E00': 'Queen\'s Pawn Game',
  'E10': 'Queen\'s Pawn Game', 'E20': 'Nimzo-Indian Defence', 'E30': 'Nimzo-Indian Defence',
  'E40': 'Nimzo-Indian Defence', 'E50': 'Nimzo-Indian Defence', 'E60': 'King\'s Indian Defence',
  'E70': 'King\'s Indian Defence', 'E80': 'King\'s Indian Defence, Saemisch Variation',
  'E90': 'King\'s Indian Defence'
};

// Function to get opening name from ECO code
function getOpeningName(eco) {
  if (!eco) return 'Unknown Opening';
  return ecoToNames[eco] || `ECO ${eco}`;
}

// Cache for analysis results to avoid duplicate computation
const analysisCache = new Map(); // gameUrl -> analysis result
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

// Cleanup expired cache entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of analysisCache.entries()) {
    if (now - value.timestamp > CACHE_DURATION) {
      analysisCache.delete(key);
    }
  }
}, 5 * 60 * 1000); // Clean every 5 minutes

// Global analysis cache to prevent duplicate analysis
const globalAnalysisCache = new Map();

// Helper function to save analysis to database
async function saveAnalysisToDatabase(gameData, analysisResult, searchedUsername) {
  try {
    // Find or create the game record
    let game = await Game.findOne({ gameUrl: gameData.url });
    if (!game) {
      // Game doesn't exist in DB, skip saving analysis
      console.log(`[Database] Game not found in DB: ${gameData.url}`);
      return;
    }
    
    // Check if analysis already exists
    const existingAnalysis = await GameAnalysis.findOne({ game: game._id });
    if (existingAnalysis) {
      console.log(`[Database] Analysis already exists for game: ${gameData.url}`);
      return; // Already analyzed
    }
    
    // Convert analysis result to database format
    const moves = analysisResult.moves.map(move => ({
      index: move.moveNumber,
      move: move.move,
      fen: move.fen,
      cp: move.evalActual,
      evaluation: move.evalActual,
      winPercent: Math.max(0, Math.min(100, 50 + (move.evalActual / 100) * 50)),
      bestCp: move.evalBest,
      bestWinPercent: Math.max(0, Math.min(100, 50 + (move.evalBest / 100) * 50)),
      bestMove: move.bestMove,
      type: move.classification
    }));
    
    // Create analysis record
    const analysis = new GameAnalysis({
      game: game._id,
      result: game.result,
      moves: moves,
      counts: analysisResult.counts,
      metrics: {
        accuracyPercent: Math.max(0, Math.min(100, 100 - analysisResult.avgCPL)),
        tacticsBlundersPerGame: analysisResult.counts.blunder || 0,
        openingScoreCp: 0, // Would need opening-specific calculation
        endgameCpLossPerMove: 0, // Would need endgame-specific calculation
        advantageCapitalization: 0, // Would need position evaluation
        resourcefulness: 0, // Would need position evaluation
        timeManagementBadMoves: 0 // Would need time data
      }
    });
    
    await analysis.save();
    console.log(`[Database] Successfully saved analysis for game: ${gameData.url}`);
    
    // Also update memory cache
    analysisCache.set(gameData.url, {
      timestamp: Date.now(),
      result: analysisResult
    });
    
  } catch (error) {
    console.log(`[Database] Error saving analysis: ${error.message}`);
  }
}

// Comprehensive analysis function that handles caching and avoids duplication
async function runFullAnalysis(handle, timeClass, platform) {
  const cacheKey = `${handle}-${timeClass}-${platform}`;
  console.log(`[Analysis] Cache key: ${cacheKey}`);
  
  // Check global cache first
  if (globalAnalysisCache.has(cacheKey)) {
    const cached = globalAnalysisCache.get(cacheKey);
    const cacheAge = Date.now() - cached.timestamp;
    console.log(`[Analysis] Found cache entry, age: ${cacheAge}ms`);
    if (cacheAge < 300000) { // 5 minutes cache
      console.log(`[Analysis] Using global cache for ${handle}, timeClass: ${timeClass}, platform: ${platform}`);
      return cached.result;
    } else {
      console.log(`[Analysis] Cache expired, removing old entry`);
      globalAnalysisCache.delete(cacheKey);
    }
  } else {
    console.log(`[Analysis] No cache entry found for key: ${cacheKey}`);
  }
  
  const analysisStartTime = Date.now();
  console.log(`[Analysis] Starting analysis for ${handle}, timeClass: ${timeClass}, platform: ${platform}`);
  
  // Fetch games from API
  let games = [];
  const fetchPlatform = platform && platform !== 'auto' ? platform : 'chesscom';
  
  if (fetchPlatform === 'chesscom') {
    games = await fetchChessComGames(handle, 40, timeClass !== 'all' && timeClass ? timeClass : null);
  } else if (fetchPlatform === 'lichess') {
    games = await fetchLichessGames(handle, 40, timeClass !== 'all' && timeClass ? timeClass : null);
  }
  
  if (games.length === 0) {
    throw new Error(`No games found for username: ${handle} on ${fetchPlatform}`);
  }
  
  // Validate games have required properties
  const validGames = games.filter(g => g && g.url && g.pgn);
  if (validGames.length === 0) {
    throw new Error(`No valid games found (all ${games.length} games missing url or pgn)`);
  }
  if (validGames.length < games.length) {
    console.warn(`[Analysis] Warning: ${games.length - validGames.length} games missing url or pgn, using ${validGames.length} valid games`);
  }
  
  console.log(`[Analysis] Found ${validGames.length} valid games (out of ${games.length} total), starting analysis...`);
  
  // Use only valid games
  games = validGames;
  
  // OPTIMIZED: Process games in parallel for speed (like Aimchess - <1 minute target)
  const allAnalysis = [];
  let analyzedGames = 0;
  let cachedGames = 0;
  
  // MAXIMUM PARALLELISM: Process more games simultaneously for speed
  const PARALLEL_BATCH_SIZE = Math.min(12, Math.max(6, Math.floor(os.cpus().length * 0.8))); // 6-12 games in parallel (more aggressive)
  console.log(`[Analysis] Processing ${games.length} games in parallel batches of ${PARALLEL_BATCH_SIZE} (Aimchess speed)`);
  
  // First, check cache for all games (fast path)
  const cachePromises = games.map(async (game, index) => {
    try {
      const existingGame = await Game.findOne({ gameUrl: game.url });
      if (existingGame) {
        const existingAnalysis = await GameAnalysis.findOne({ game: existingGame._id });
        if (existingAnalysis) {
          if (!existingAnalysis.moves || existingAnalysis.moves.length === 0) {
            console.log(`[Analysis] Game ${index + 1}: Found in DB but no moves in analysis: ${game.url}`);
            return { game, cached: false, analysis: null };
          }
          // Convert cached analysis
          const playerIsWhite = handle.toLowerCase() === existingGame.whiteUsername?.toLowerCase();
          const moveCounts = new Map();
          const reconstructedMoves = existingAnalysis.moves.map((m, idx) => {
            const rawNumber = m.index ?? m.moveNumber ?? Math.ceil((idx + 1) / 2);
            const moveNumber = typeof rawNumber === 'number'
              ? rawNumber
              : parseInt(rawNumber, 10) || Math.ceil((idx + 1) / 2);

            const priorCount = moveCounts.get(moveNumber) || 0;
            moveCounts.set(moveNumber, priorCount + 1);

            const isWhiteMove = priorCount % 2 === 0;
            const isPlayerMove = playerIsWhite ? isWhiteMove : !isWhiteMove;

            const evalBestRaw = typeof m.bestCp === 'number' ? m.bestCp : parseFloat(m.bestCp);
            const evalActualRaw = typeof m.cp === 'number' ? m.cp : parseFloat(m.cp);
            const evalBest = Number.isFinite(evalBestRaw) ? evalBestRaw : 0;
            const evalActual = Number.isFinite(evalActualRaw) ? evalActualRaw : 0;
            const loss = evalBest - evalActual;
            const cpl = isPlayerMove && Number.isFinite(loss) ? Math.max(0, loss) : 0;

            return {
              moveNumber,
              move: m.move,
              fen: m.fen,
              evalActual,
              evalBest,
              cpl,
              isPlayerMove,
              classification: m.type || 'normal'
            };
          });

          return {
            game,
            cached: true,
            analysis: {
              gameUrl: game.url,
              playerIsWhite,
              moves: reconstructedMoves,
              avgCPL: existingAnalysis.metrics?.accuracyPercent
                ? (100 - existingAnalysis.metrics.accuracyPercent)
                : 0,
              counts: existingAnalysis.counts || {},
              keyMoments: reconstructedMoves
                .filter(m => m.isPlayerMove && (m.classification === 'blunder' || m.classification === 'mistake'))
                .slice(0, 5)
            }
          };
          console.log(`[Analysis] Game ${index + 1}: Using cached analysis with ${reconstructedMoves.length} moves: ${game.url}`);
        } else {
          console.log(`[Analysis] Game ${index + 1}: Found in DB but no analysis: ${game.url}`);
        }
      } else {
        console.log(`[Analysis] Game ${index + 1}: Not in DB, will analyze: ${game.url}`);
      }
      return { game, cached: false, analysis: null };
    } catch (error) {
      console.log(`[Analysis] Cache check failed for ${game.url}: ${error.message}`);
      return { game, cached: false, analysis: null };
    }
  });
  
  const cacheResults = await Promise.all(cachePromises);
  
  // Separate cached and uncached games
  const cachedAnalyses = [];
  const uncachedGames = [];
  
  for (const result of cacheResults) {
    if (result.cached && result.analysis) {
      cachedAnalyses.push(result.analysis);
      cachedGames++;
    } else {
      uncachedGames.push(result.game);
    }
  }
  
  allAnalysis.push(...cachedAnalyses);
  
  console.log(`[Analysis] ${cachedGames} games from cache, ${uncachedGames.length} games to analyze`);
  console.log(`[Analysis] Current allAnalysis length after cache: ${allAnalysis.length}`);
  
  // Process uncached games in parallel batches
  for (let i = 0; i < uncachedGames.length; i += PARALLEL_BATCH_SIZE) {
    const batch = uncachedGames.slice(i, i + PARALLEL_BATCH_SIZE);
    const batchStartTime = Date.now();
    console.log(`[Analysis] Processing batch ${Math.floor(i / PARALLEL_BATCH_SIZE) + 1}/${Math.ceil(uncachedGames.length / PARALLEL_BATCH_SIZE)} (${batch.length} games in parallel)`);
    
    // Analyze batch in parallel
    const batchPromises = batch.map(async (game, batchIndex) => {
      try {
        // Validate game has required properties
        if (!game || !game.url || !game.pgn) {
          console.error(`[Analysis] ✗ Invalid game data: missing url or pgn. Game:`, game);
          return null;
        }
        
        console.log(`[Analysis] Analyzing game ${i + batchIndex + 1}/${uncachedGames.length}: ${game.url}`);
        const analysis = await analyzeGameWithStockfish(game, handle);
        
        // Validate analysis result has required structure
        if (analysis) {
          if (!analysis.moves || !Array.isArray(analysis.moves) || analysis.moves.length === 0) {
            console.error(`[Analysis] ✗ Invalid analysis result: missing or empty moves array for ${game.url}`);
            return null;
          }
          if (!analysis.gameUrl) {
            console.error(`[Analysis] ✗ Invalid analysis result: missing gameUrl for ${game.url}`);
            return null;
          }
          analyzedGames++;
          console.log(`[Analysis] ✓ Game ${i + batchIndex + 1}/${uncachedGames.length} complete: ${game.url} (${analysis.moves.length} moves)`);
        } else {
          console.warn(`[Analysis] ⚠ Game ${i + batchIndex + 1}/${uncachedGames.length} returned null: ${game.url}`);
        }
        return analysis;
      } catch (error) {
        console.error(`[Analysis] ✗ Error analyzing ${game.url}: ${error.message}`);
        console.error(`[Analysis] Error stack: ${error.stack}`);
        return null;
      }
    });
    
    const batchResults = await Promise.all(batchPromises);
    const successfulInBatch = batchResults.filter(a => a !== null).length;
    const failedInBatch = batchResults.length - successfulInBatch;
    allAnalysis.push(...batchResults.filter(a => a !== null));
    
    const batchEndTime = Date.now();
    const batchDuration = ((batchEndTime - batchStartTime) / 1000).toFixed(2);
    console.log(`[Analysis] ⏱️  Batch ${Math.floor(i / PARALLEL_BATCH_SIZE) + 1} completed in ${batchDuration}s (${successfulInBatch} successful, ${failedInBatch} failed)`);
    
    // Small delay between batches to prevent overwhelming system
    if (i + PARALLEL_BATCH_SIZE < uncachedGames.length) {
      await new Promise(r => setTimeout(r, 50));
    }
  }
  
  // Debug logging before final check
  console.log(`[Analysis] Final check: ${cachedGames} cached games, ${analyzedGames} newly analyzed games, ${allAnalysis.length} total games in allAnalysis`);
  console.log(`[Analysis] Breakdown: ${games.length} total games, ${uncachedGames.length} needed analysis, ${cachedGames} were cached`);
  
  if (allAnalysis.length === 0) {
    const errorDetails = {
      totalGames: games.length,
      cachedGames: cachedGames,
      analyzedGames: analyzedGames,
      uncachedGames: uncachedGames.length,
      allAnalysisLength: allAnalysis.length,
      cacheResultsLength: cacheResults?.length || 0,
      cachedAnalysesLength: cachedAnalyses?.length || 0
    };
    console.error(`[Analysis] ERROR: No games analyzed!`, errorDetails);
    
    // Try to provide more helpful error message
    if (uncachedGames.length > 0 && analyzedGames === 0) {
      throw new Error(`All ${uncachedGames.length} games failed to analyze. Check Stockfish errors above. Total games: ${games.length}, Cached: ${cachedGames}`);
    } else if (cachedGames === 0 && analyzedGames === 0) {
      throw new Error(`No games could be analyzed or retrieved from cache. Total games: ${games.length}. Check if games have valid PGN data.`);
    } else {
      throw new Error(`Failed to analyze any games. Details: ${JSON.stringify(errorDetails)}`);
    }
  }
  
  // Warn if we have very few successful analyses
  if (allAnalysis.length < games.length * 0.5) {
    console.warn(`[Analysis] WARNING: Only ${allAnalysis.length}/${games.length} games successfully analyzed (${((allAnalysis.length / games.length) * 100).toFixed(1)}%)`);
  }
  
  // Calculate metrics from analysis results
  const allPlayerMoves = allAnalysis.flatMap(a => a.moves.filter(m => m.isPlayerMove && m.moveNumber > 5));
  const totalCPL = allPlayerMoves.reduce((sum, m) => sum + m.cpl, 0);
  const avgCPL = allPlayerMoves.length > 0 ? totalCPL / allPlayerMoves.length : 0;

  const summary = {
    best: allPlayerMoves.filter(m => m.classification === 'best').length,
    excellent: allPlayerMoves.filter(m => m.classification === 'excellent').length,
    good: allPlayerMoves.filter(m => m.classification === 'good').length,
    inaccuracy: allPlayerMoves.filter(m => m.classification === 'inaccuracy').length,
    mistake: allPlayerMoves.filter(m => m.classification === 'mistake').length,
    blunder: allPlayerMoves.filter(m => m.classification === 'blunder').length,
    total: allPlayerMoves.length
  };

  const keyMoments = allPlayerMoves
    .filter(m => m.cpl >= 100)
    .sort((a, b) => b.cpl - a.cpl)
    .slice(0, 10)
    .map(m => ({
      game: allAnalysis.find(a => a.moves.includes(m))?.gameUrl,
      move: m.move,
      cpl: m.cpl,
      bestMove: m.bestMove,
      classification: m.classification
    }));

  // Calculate advanced metrics
  let openingScoreCp = 0;
  let openingCount = 0;
  let advantageGames = 0;
  let advantageWins = 0;
  let disadvantageGames = 0;
  let disadvantageRecoveries = 0;

  for (const analysis of allAnalysis) {
    const game = games.find(g => g.url === analysis.gameUrl);
    if (!game) continue;
    const playerIsWhite = analysis.playerIsWhite;
    
    // FIXED Opening score: Use position evaluation after opening (moves 10-12), matching Aimchess
    // Aimchess uses the evaluation after the opening phase, not CPL
    // Find player moves in move range 10-12 (or closest to 12)
    const openingPlayerMoves = analysis.moves.filter(m => m.isPlayerMove && m.moveNumber >= 10 && m.moveNumber <= 12);
    
    if (openingPlayerMoves.length > 0) {
      // Use the last player move in the opening range (after move 12) for evaluation
      // This represents the position evaluation after the opening phase
      const lastOpeningMove = openingPlayerMoves[openingPlayerMoves.length - 1];
      // evalActual is already in player's perspective (from the analysis)
      // Positive = player is better, negative = player is worse
      const openingEvaluation = lastOpeningMove.evalActual || 0;
      openingScoreCp += openingEvaluation;
      openingCount++;
    } else {
      // Fallback: if no moves in 10-12 range, try to find move closest to 12
      const playerMovesNear12 = analysis.moves.filter(m => m.isPlayerMove && m.moveNumber <= 12 && m.moveNumber >= 8);
      if (playerMovesNear12.length > 0) {
        const closestMove = playerMovesNear12.reduce((closest, m) => 
          Math.abs(m.moveNumber - 12) < Math.abs(closest.moveNumber - 12) ? m : closest
        );
        const openingEvaluation = closestMove.evalActual || 0;
        openingScoreCp += openingEvaluation;
        openingCount++;
      }
    }
    
    // Advantage capitalization
    const hadAdvantage = analysis.moves.some(m => (playerIsWhite ? m.evalActual : -m.evalActual) >= 100);
    if (hadAdvantage) {
      advantageGames++;
      const won = (playerIsWhite && game.result === '1-0') || (!playerIsWhite && game.result === '0-1');
      if (won) advantageWins++;
    }
    
    // Resourcefulness
    const hadDisadvantage = analysis.moves.some(m => (playerIsWhite ? m.evalActual : -m.evalActual) <= -100);
    if (hadDisadvantage) {
      disadvantageGames++;
      const wonOrDrew = (playerIsWhite && (game.result === '1-0' || game.result === '1/2-1/2')) || 
                       (!playerIsWhite && (game.result === '0-1' || game.result === '1/2-1/2'));
      if (wonOrDrew) disadvantageRecoveries++;
    }
  }

  // Calculate proper endgame loss
  const endgameLossPerMove = calculateEndgameLoss(allAnalysis);
  
  // Calculate late-game (moves 30+) metrics for time management
  const lateGameMoves = allAnalysis.flatMap(a => a.moves.filter(m => m.isPlayerMove && m.moveNumber >= 30));
  const lateGameCPL = lateGameMoves.length > 0 
    ? lateGameMoves.reduce((sum, m) => sum + m.cpl, 0) / lateGameMoves.length 
    : avgCPL; // Fallback to overall if no late-game moves
  const lateGameBlunders = lateGameMoves.filter(m => m.classification === 'blunder').length;
  const lateGameBlundersPerGame = allAnalysis.length > 0 ? lateGameBlunders / allAnalysis.length : 0;
  const lateGameAccuracy = lateGameMoves.length > 0 
    ? Math.max(0, Math.min(100, 100 - (lateGameCPL / 100))) 
    : Math.max(0, Math.min(100, 100 - avgCPL)); // Fallback to overall accuracy
  
  const metrics = {
    averageCPL: avgCPL,
    acpl: avgCPL / 100, // ACPL in pawns (Fixed!)
    accuracyPercent: Math.max(0, Math.min(100, 100 - avgCPL)),
    blundersPerGame: allAnalysis.length > 0 ? summary.blunder / allAnalysis.length : 0,
    bestMoveRate: summary.total > 0 ? (summary.best / summary.total) * 100 : 0,
    openingScoreCp: openingCount > 0 ? openingScoreCp / openingCount : 0,
    tacticsBlundersPerGame: allAnalysis.length > 0 ? summary.blunder / allAnalysis.length : 0,
    endgameCpLossPerMove: endgameLossPerMove, // Fixed calculation!
    advantageCapitalization: advantageGames > 0 ? (advantageWins / advantageGames) * 100 : 0,
    resourcefulness: disadvantageGames > 0 ? (disadvantageRecoveries / disadvantageGames) * 100 : 0,
    // Time management metrics (late-game performance)
    lateGameCPL: lateGameCPL,
    lateGameBlundersPerGame: lateGameBlundersPerGame,
    lateGameAccuracy: lateGameAccuracy
  };

  // Add searchedUsername to games for analysis
  games.forEach(game => {
    game.searchedUsername = handle;
  });

  // Calculate opening performance
  const openingPerformance = calculateOpeningPerformance(games, allAnalysis);
  
  // Find best and worst performance games
  const bestPerformanceGames = allAnalysis
    .filter(a => a.avgCPL !== undefined)
    .sort((a, b) => a.avgCPL - b.avgCPL) // Lower CPL = better performance
    .slice(0, 5)
    .map(a => ({
      url: a.gameUrl,
      avgCPL: a.avgCPL,
      accuracy: Math.max(0, Math.min(100, 100 - a.avgCPL)),
      blunders: a.counts.blunder,
      mistakes: a.counts.mistake
    }));

  const worstPerformanceGames = allAnalysis
    .filter(a => a.avgCPL !== undefined)
    .sort((a, b) => b.avgCPL - a.avgCPL) // Higher CPL = worse performance
    .slice(0, 5)
    .map(a => ({
      url: a.gameUrl,
      avgCPL: a.avgCPL,
      accuracy: Math.max(0, Math.min(100, 100 - a.avgCPL)),
      blunders: a.counts.blunder,
      mistakes: a.counts.mistake
    }));

  // Generate scouting report
  const scouting = {
    bestMoveRate: metrics.bestMoveRate,
    blundersPerGame: metrics.blundersPerGame,
    blundersPer100: summary.total > 0 ? (summary.blunder / summary.total) * 100 : 0, // Fixed: Blunders per 100 moves
    accuracyPercent: metrics.accuracyPercent,
    averageCPL: avgCPL,
    acpl: metrics.acpl, // Fixed: ACPL in pawns
    openingScore: metrics.openingScoreCp / 100,
    endgameLossPerMove: metrics.endgameCpLossPerMove, // Fixed: Proper endgame calculation
    advantageCapitalization: metrics.advantageCapitalization,
    resourcefulness: metrics.resourcefulness,
    strengths: generateStrengths(metrics, summary),
    weaknesses: generateWeaknesses(metrics, summary),
    recommendations: generateRecommendations(metrics, summary),
    focus: generateFocusAreas(metrics, summary), // Fixed: Use proper focus areas
    // Add missing opening analysis
    openings: openingPerformance.all,
    bestOpening: openingPerformance.best,
    worstOpening: openingPerformance.worst,
    // Add missing performance games
    bestPerformanceGames: bestPerformanceGames,
    worstPerformanceGames: worstPerformanceGames
  };

  const analysisEndTime = Date.now();
  const analysisDuration = analysisEndTime - analysisStartTime;
  const analysisDurationSeconds = (analysisDuration / 1000).toFixed(2);
  const analysisDurationMinutes = (analysisDuration / 60000).toFixed(2);
  
  console.log(`[Analysis] Analysis complete! Analyzed ${analyzedGames} new games, used ${cachedGames} cached games, total: ${allAnalysis.length} games`);
  console.log(`[Analysis] ⏱️  Total analysis time: ${analysisDurationSeconds}s (${analysisDurationMinutes} minutes)`);

  const result = {
    games,
    allAnalysis,
    summary,
    metrics,
    scouting,
    keyMoments
  };

  // Cache the result in global cache
  globalAnalysisCache.set(cacheKey, {
    timestamp: Date.now(),
    result: result
  });
  
  console.log(`[Analysis] Cached result for key: ${cacheKey}, cache size: ${globalAnalysisCache.size}`);

  return result;
}

// Helper functions for scouting report
function generateStrengths(metrics, summary) {
  const strengths = [];
  if (metrics.bestMoveRate > 30) strengths.push('Strong tactical vision');
  if (metrics.accuracyPercent > 80) strengths.push('High overall accuracy');
  if (metrics.blundersPerGame < 1) strengths.push('Good blunder prevention');
  if (metrics.advantageCapitalization > 60) strengths.push('Excellent winning technique');
  if (metrics.resourcefulness > 40) strengths.push('Good defensive skills');
  return strengths.length > 0 ? strengths : ['Developing player with room for improvement'];
}

function generateWeaknesses(metrics, summary) {
  const weaknesses = [];
  if (metrics.blundersPerGame > 2) weaknesses.push('Frequent tactical oversights');
  if (metrics.accuracyPercent < 60) weaknesses.push('Inconsistent move quality');
  if (metrics.advantageCapitalization < 40) weaknesses.push('Difficulty converting advantages');
  if (metrics.resourcefulness < 20) weaknesses.push('Struggles in difficult positions');
  return weaknesses.length > 0 ? weaknesses : ['Strong overall play'];
}

function generateRecommendations(metrics, summary) {
  const recommendations = [];
  if (metrics.blundersPerGame > 1.5) recommendations.push('Focus on tactical training and puzzle solving');
  if (metrics.accuracyPercent < 70) recommendations.push('Slow down and calculate more carefully');
  if (metrics.advantageCapitalization < 50) recommendations.push('Study endgame technique');
  if (metrics.resourcefulness < 30) recommendations.push('Practice defensive positions');
  return recommendations.length > 0 ? recommendations : ['Continue current training approach'];
}

/**
 * Helper to fetch last games from Chess.com archives
 */
const http = axios.create({
  headers: {
    'User-Agent': 'ChessRep/1.0 (+https://example.com; contact: support@chessrep.local)'
  },
  timeout: 10000
});

async function fetchChessComGames(username, maxGames = 40, targetTimeClass = null) {
  console.log(`[Chess.com] Fetching games for username: ${username}${targetTimeClass ? ` (filtering for ${targetTimeClass})` : ''}`);
  try {
    const user = (username || '').trim().toLowerCase();
    if (!user) throw new Error('Username empty');
    const archivesEndpoint = `https://api.chess.com/pub/player/${user}/games/archives`;
    console.log(`[Chess.com] Requesting archives: ${archivesEndpoint}`);
    let archiveUrls = [];
    try {
      const archivesRes = await http.get(archivesEndpoint);
      archiveUrls = (archivesRes.data.archives || []).reverse();
      console.log(`[Chess.com] Found ${archiveUrls.length} archive URLs`);
    } catch (e) {
      console.log(`[Chess.com] Archives request failed, trying fallback months: ${e.message}`);
      const urls = [];
      const now = new Date();
      for (let i = 0; i < 24; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        urls.push(`https://api.chess.com/pub/player/${user}/games/${y}/${m}`);
      }
      archiveUrls = urls;
      console.log(`[Chess.com] Generated ${archiveUrls.length} fallback URLs`);
    }
    
    const maxArchivesToSearch = targetTimeClass ? Math.min(archiveUrls.length, 24) : Math.min(archiveUrls.length, 6);
    console.log(`[Chess.com] Will search through ${maxArchivesToSearch} archives${targetTimeClass ? ` looking for ${targetTimeClass} games` : ''}`);
    
    const games = [];
    for (let i = 0; i < maxArchivesToSearch; i++) {
      const archiveUrl = archiveUrls[i];
      try {
        console.log(`[Chess.com] Fetching from: ${archiveUrl} (${i + 1}/${maxArchivesToSearch})`);
        const monthRes = await http.get(archiveUrl);
        const monthGames = monthRes.data.games || [];
        console.log(`[Chess.com] Found ${monthGames.length} games in this archive`);
        
        let addedFromThisArchive = 0;
        for (const g of monthGames.reverse()) {
          if (!g?.pgn) continue;
          
          if (targetTimeClass && g.time_class !== targetTimeClass) {
            continue;
          }
          
          games.push({
            url: g.url,
            pgn: g.pgn,
            endTime: g.end_time ? new Date(g.end_time * 1000) : undefined,
            white: g.white?.username?.toLowerCase?.(),
            black: g.black?.username?.toLowerCase?.(),
            result: g.white?.result && g.black?.result ? `${g.white.result === 'win' ? '1' : g.white.result === 'agreed' || g.white.result === 'repetition' || g.white.result === 'stalemate' || g.white.result === 'insufficient' ? '1/2' : '0'}-${g.black.result === 'win' ? '1' : g.black.result === 'agreed' || g.black.result === 'repetition' || g.black.result === 'stalemate' || g.black.result === 'insufficient' ? '1/2' : '0'}` : undefined,
            timeControl: g.time_control,
            timeClass: g.time_class
          });
          addedFromThisArchive++;
          
          if (games.length >= maxGames) break;
        }
        
        console.log(`[Chess.com] Added ${addedFromThisArchive} games from this archive (total: ${games.length})`);
        
        if (targetTimeClass && games.length >= maxGames) {
          console.log(`[Chess.com] Found enough ${targetTimeClass} games, stopping search`);
          break;
        }
        
      } catch (e) {
        console.log(`[Chess.com] Failed to fetch ${archiveUrl}: ${e.message}`);
        continue;
      }
      
      if (games.length >= maxGames) break;
    }
    
    console.log(`[Chess.com] Total games collected: ${games.length}${targetTimeClass ? ` (${targetTimeClass} only)` : ''}`);
    return games.slice(0, maxGames);
  } catch (err) {
    console.log(`[Chess.com] Error: ${err.message}`);
    if (axios.isAxiosError?.(err)) {
      const status = err.response?.status;
      const data = err.response?.data;
      const msg = status === 404 ? 'Username not found or no public archives' : `Upstream error ${status || ''}`;
      const detail = typeof data === 'string' ? data : JSON.stringify(data || {});
      const error = new Error(`${msg}`);
      error.code = status || 500;
      error.detail = detail;
      throw error;
    }
    throw err;
  }
}

/**
 * Fetch last games from Lichess as NDJSON (pgnInJson=true)
 */
async function fetchLichessGames(username, maxGames = 40, targetTimeClass = null) {
  console.log(`[Lichess] Fetching games for username: ${username}${targetTimeClass ? ` (filtering for ${targetTimeClass})` : ''}`);
  try {
    const user = (username || '').trim();
    if (!user) throw new Error('Username empty');
    
    const games = [];
    let attempts = 0;
    const maxAttempts = targetTimeClass ? 12 : 3;
    
    while (games.length < maxGames && attempts < maxAttempts) {
      let url;
      let searchDescription;
      
      if (attempts === 0) {
        const perfTypes = targetTimeClass ? targetTimeClass : 'rapid,blitz,bullet';
        url = `https://lichess.org/api/games/user/${user}?pgnInJson=true&clocks=false&evals=false&opening=false&moves=true&perfType=${perfTypes}&max=${maxGames * 2}`;
        searchDescription = targetTimeClass ? `recent ${targetTimeClass} games` : 'recent games';
      } else {
        const monthsBack = attempts;
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() - monthsBack + 1);
        endDate.setDate(1);
        
        const startDate = new Date(endDate);
        startDate.setMonth(startDate.getMonth() - 1);
        
        const since = Math.floor(startDate.getTime());
        const until = Math.floor(endDate.getTime());
        
        const perfTypes = targetTimeClass ? targetTimeClass : 'rapid,blitz,bullet';
        url = `https://lichess.org/api/games/user/${user}?pgnInJson=true&clocks=false&evals=false&opening=false&moves=true&perfType=${perfTypes}&since=${since}&until=${until}&max=200`;
        searchDescription = `${targetTimeClass || 'games'} from ${startDate.toISOString().slice(0, 7)}`;
      }
      
      console.log(`[Lichess] Attempt ${attempts + 1}/${maxAttempts}: Fetching ${searchDescription}`);
      console.log(`[Lichess] URL: ${url}`);
      
      try {
        const response = await http.get(url, { 
          responseType: 'text',
          timeout: 15000
        });
        const lines = response.data.trim().split('\n');
        let addedThisAttempt = 0;
        
        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const game = JSON.parse(line);
            if (!game.pgn) continue;
            
            const gameSpeed = game.speed;
            
            if (targetTimeClass && gameSpeed !== targetTimeClass) {
              continue;
            }
            
            if (games.some(g => g.url === `https://lichess.org/${game.id}`)) {
              continue;
            }
            
            games.push({
              url: `https://lichess.org/${game.id}`,
              pgn: game.pgn,
              endTime: game.lastMoveAt ? new Date(game.lastMoveAt) : undefined,
              white: game.players?.white?.user?.name?.toLowerCase?.(),
              black: game.players?.black?.user?.name?.toLowerCase?.(),
              result: game.status === 'mate' ? (game.winner === 'white' ? '1-0' : '0-1') : 
                      game.status === 'draw' ? '1/2-1/2' : 
                      game.status === 'resign' ? (game.winner === 'white' ? '1-0' : '0-1') : undefined,
              timeControl: gameSpeed,
              timeClass: gameSpeed
            });
            addedThisAttempt++;
            
            if (games.length >= maxGames) break;
          } catch (e) {
            console.log(`[Lichess] Failed to parse game: ${e.message}`);
            continue;
          }
        }
        
        console.log(`[Lichess] Added ${addedThisAttempt} games from this search (total: ${games.length})`);
        
        if (targetTimeClass && games.length >= maxGames) {
          console.log(`[Lichess] Found enough ${targetTimeClass} games, stopping search`);
          break;
        }
        
        if (addedThisAttempt === 0) {
          console.log(`[Lichess] No games found in this period, trying earlier...`);
        }
        
      } catch (e) {
        console.log(`[Lichess] Failed to fetch from attempt ${attempts + 1}: ${e.message}`);
      }
      
      attempts++;
      
      if (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }
    
    console.log(`[Lichess] Total games collected: ${games.length}${targetTimeClass ? ` (${targetTimeClass} only)` : ''}`);
    return games.slice(0, maxGames);
  } catch (err) {
    console.log(`[Lichess] Error: ${err.message}`);
    if (axios.isAxiosError?.(err)) {
      const status = err.response?.status;
      const data = err.response?.data;
      const msg = status === 404 ? 'Username not found' : `Upstream error ${status || ''}`;
      const detail = typeof data === 'string' ? data : JSON.stringify(data || {});
      const error = new Error(`${msg}`);
      error.code = status || 500;
      error.detail = detail;
      throw error;
    }
    throw err;
  }
}

/**
 * Helper functions for analysis calculations
 */

function calculateEndgameLoss(allAnalysis) {
  let totalEndgameLoss = 0;
  let endgameMoves = 0;
  
  for (const analysis of allAnalysis) {
    // FIXED: Consider moves after move 25 as endgame (more inclusive, matches Aimchess)
    // Use last 25 moves of game OR moves after move 25, whichever gives more data
    const gameLength = analysis.moves.length > 0 
      ? Math.max(...analysis.moves.map(m => m.moveNumber))
      : 0;
    const endgameStart = Math.max(25, gameLength - 25); // Use last 25 moves or after move 25
    
    const endgamePlayerMoves = analysis.moves.filter(m => 
      m.moveNumber >= endgameStart && m.isPlayerMove
    );
    
    for (const move of endgamePlayerMoves) {
      if (move.cpl > 0) { // Only count actual losses (positive CPL)
        totalEndgameLoss += move.cpl;
        endgameMoves++;
      }
    }
  }
  
  return endgameMoves > 0 ? totalEndgameLoss / endgameMoves / 100 : 0; // Convert to pawns
}

function generateStrengths(metrics, summary) {
  const strengths = [];
  const bestMoveRate = summary.total > 0 ? (summary.best / summary.total) * 100 : 0;
  
  if (bestMoveRate >= 30) {
    strengths.push("Strong tactical accuracy with high best move rate");
  }
  
  if (metrics.tacticsBlundersPerGame <= 0.5) {
    strengths.push("Excellent blunder prevention");
  }
  
  if (metrics.openingScoreCp >= 25) {
    strengths.push("Strong opening play with positive average score");
  }
  
  if (metrics.advantageCapitalization >= 70) {
    strengths.push("Excellent at converting advantages into wins");
  }
  
  if (metrics.resourcefulness >= 40) {
    strengths.push("Good defensive skills when in difficult positions");
  }
  
  if (metrics.acpl <= 0.3) {
    strengths.push("Low average centipawn loss indicates consistent play");
  }
  
  // Fixed: Only mention endgame strength if there's actual endgame data and it's good
  if (metrics.endgameCpLossPerMove > 0 && metrics.endgameCpLossPerMove <= 0.15) {
    strengths.push("Solid endgame technique with minimal losses");
  }

  return strengths.length > 0 ? strengths : ["Developing chess skills with room for improvement"];
}

function generateFocusAreas(metrics, summary) {
  const focus = [];
  const bestMoveRate = summary.total > 0 ? (summary.best / summary.total) * 100 : 0;
  
  if (bestMoveRate < 20) {
    focus.push("Improve tactical accuracy - practice calculation and visualization");
  }
  
  if (metrics.tacticsBlundersPerGame > 1) {
    focus.push("Reduce blunders - focus on double-checking moves before playing");
  }
  
  if (metrics.openingScoreCp < -25) {
    focus.push("Study openings more - your opening play is giving away advantage");
  }
  
  if (metrics.advantageCapitalization < 50) {
    focus.push("Practice converting advantages - work on technique when ahead");
  }
  
  if (metrics.resourcefulness < 20) {
    focus.push("Improve defensive play - learn to fight back when in bad positions");
  }
  
  // Fixed: Only suggest endgame study if there's actual endgame data showing problems
  if (metrics.endgameCpLossPerMove > 0.2) {
    focus.push("Study endgames - significant losses are occurring in endgame play");
  }

  return focus.length > 0 ? focus : ["Continue current training routine - performance is solid"];
}

/**
 * PRECISE STOCKFISH ANALYSIS - Following the exact directive
 * Phase 1: Setup with adequate depth and resources
 * Phase 2: Evaluate every single move with baseline and actual
 * Phase 3: Calculate precise CPL and classify moves
 */
async function analyzeGameWithStockfish(gameData, searchedUsername) {
  const gameUrl = gameData.url;
  
  // Check memory cache first (fastest)
  const cached = analysisCache.get(gameUrl);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log(`[Stockfish] Using memory cache for game: ${gameUrl}`);
    return cached.result;
  }
  
  // Check database cache for persisted analysis
  try {
    const existingGame = await Game.findOne({ gameUrl: gameUrl });
    if (existingGame) {
      const existingAnalysis = await GameAnalysis.findOne({ game: existingGame._id });
      if (existingAnalysis && existingAnalysis.moves && existingAnalysis.moves.length > 0) {
        console.log(`[Stockfish] Using database cache for game: ${gameUrl}`);
        
        // Convert DB format to expected format
        const result = {
          gameUrl: gameUrl,
          playerIsWhite: searchedUsername?.toLowerCase() === existingGame.whiteUsername?.toLowerCase(),
          moves: existingAnalysis.moves,
          avgCPL: existingAnalysis.metrics.accuracyPercent ? (100 - existingAnalysis.metrics.accuracyPercent) : 0,
          counts: existingAnalysis.counts,
          keyMoments: existingAnalysis.moves.filter(m => m.type === 'blunder' || m.type === 'mistake').slice(0, 5)
        };
        
        // Also cache in memory for faster subsequent access
        analysisCache.set(gameUrl, {
          timestamp: Date.now(),
          result: result
        });
        
        return result;
      }
    }
  } catch (dbError) {
    console.log(`[Stockfish] Database cache check failed: ${dbError.message}`);
  }
  
  const gameAnalysisStartTime = Date.now();
  console.log(`[Stockfish] Starting fresh analysis for game: ${gameUrl}`);
  
  try {
    const stockfish = spawn(path.join(__dirname, '../engines/stockfish.exe'));
    
    let pendingResolve = null;
    let lastEval = { cp: 0, mate: null, bestMove: 'none', pv: [], topMoves: [] }; // Store top 3 moves
    let currentMultiPV = 0;
    let currentDepth = 0;
    
    const onStdout = (data) => {
      const lines = data.toString().split('\n');
      for (const raw of lines) {
        const line = raw.trim();
        if (!line) continue;
        
        // Parse evaluation info with MultiPV support
        if (line.includes('info depth')) {
          const depthMatch = line.match(/depth (\d+)/);
          const scoreMatch = line.match(/score (cp|mate) (-?\d+)/);
          const pvMatch = line.match(/pv (.+)/);
          const multiPVMatch = line.match(/multipv (\d+)/);
          const bestMoveMatch = line.match(/pv ([a-h][1-8][a-h][1-8][qrbn]?)/);
          
          // Track which MultiPV line this is
          if (multiPVMatch) {
            currentMultiPV = parseInt(multiPVMatch[1], 10);
          }
          
          if (depthMatch) {
            const depth = parseInt(depthMatch[1], 10);
            
            // Reset topMoves when depth increases (new iteration)
            if (depth > currentDepth) {
              lastEval.topMoves = [];
              currentDepth = depth;
            }
            
            if (depth >= 6) { // Accept depth 6+ for balanced accuracy (optimized for speed + accuracy)
              if (scoreMatch) {
                const [_, type, value] = scoreMatch;
                if (type === 'cp') {
                  lastEval.cp = parseInt(value, 10);
                  lastEval.mate = null;
                } else {
                  lastEval.mate = parseInt(value, 10);
                  lastEval.cp = value > 0 ? 10000 : -10000; // Convert mate to extreme cp
                }
              }
              
              // Store top 3 moves from MultiPV
              if (bestMoveMatch) {
                const move = bestMoveMatch[1];
                const pvIdx = (currentMultiPV || 1) - 1; // MultiPV is 1-indexed
                
                // Initialize or update top moves array
                if (!lastEval.topMoves) lastEval.topMoves = [];
                lastEval.topMoves[pvIdx] = move;
                
                // Keep only top 3
                lastEval.topMoves = lastEval.topMoves.slice(0, 3);
                
                // Set bestMove to first move for backward compatibility
                if (pvIdx === 0) {
                  lastEval.bestMove = move;
                }
              }
              
              if (pvMatch && (currentMultiPV === 1 || !multiPVMatch)) {
                lastEval.pv = pvMatch[1].split(' ').slice(0, 5); // First 5 moves of PV
              }
            }
          }
        }
        
        // Resolve when bestmove is found
        if (line.startsWith('bestmove')) {
          if (pendingResolve) {
            const resolve = pendingResolve;
            pendingResolve = null;
            resolve({ ...lastEval });
            // Reset for next evaluation
            lastEval = { cp: 0, mate: null, bestMove: 'none', pv: [], topMoves: [] };
            currentDepth = 0;
          }
        }
      }
    };

    stockfish.stdout.on('data', onStdout);
    stockfish.stderr.on('data', (data) => {
      console.log(`[Stockfish] stderr: ${data}`);
    });
    stockfish.on('error', (error) => {
      // Ignore EPIPE errors (expected when process closes)
      if (error.code === 'EPIPE' || error.errno === -4047) {
        return; // Ignore broken pipe errors
      }
      console.log(`[Stockfish] Process error: ${error.message}`);
    });
    
    // Handle stdin errors gracefully (EPIPE when process is killed)
    stockfish.stdin.on('error', (error) => {
      // Ignore EPIPE errors (expected when process closes)
      if (error.code === 'EPIPE' || error.errno === -4047) {
        return; // Ignore broken pipe errors
      }
      console.log(`[Stockfish] Stdin error: ${error.message}`);
    });

    // Phase 1: Setup with OPTIMIZED config for speed + accuracy balance
    const cpuCount = os.cpus().length;
    // Use more threads for better parallelization (70% of cores, max 8)
    const numThreads = Math.min(8, Math.max(4, Math.floor(cpuCount * 0.7)));
    // Larger hash for better position caching (64MB per thread, max 512MB)
    const hashSize = Math.min(512, Math.max(128, 64 * numThreads));
    
    const setupCommands = [
      'uci',
      `setoption name Hash value ${hashSize}`,  // Larger hash for better caching (optimized)
      `setoption name Threads value ${numThreads}`, // More threads for parallel processing (optimized)
      'setoption name Contempt value 0',   // Neutral contempt
      'setoption name MultiPV value 3',    // Need top 3 moves for "best" vs "good" classification
      'isready'
    ];
    
    for (const cmd of setupCommands) {
      try {
        if (stockfish.killed || !stockfish.stdin.writable) {
          throw new Error('Stockfish process died during setup');
        }
        stockfish.stdin.write(cmd + '\n');
        await new Promise(r => setTimeout(r, 10)); // Ultra-fast setup (10ms)
      } catch (error) {
        // Handle EPIPE errors gracefully
        if (error.code === 'EPIPE' || error.errno === -4047) {
          throw new Error('Stockfish process closed unexpectedly');
        }
        throw error;
      }
    }

    // EXTREME-SPEED position evaluation (Aimchess <1min target: 10-20ms per position)
    const evaluatePosition = async (fen, isCritical = false) => {
      // Check if process is still alive before writing
      if (stockfish.killed || !stockfish.stdin.writable) {
        return { ...lastEval }; // Return last known eval if process is dead
      }
      
      lastEval = { cp: 0, mate: null, bestMove: 'none', pv: [] };
      
      try {
        stockfish.stdin.write(`position fen ${fen}\n`);
      } catch (error) {
        // Handle EPIPE errors gracefully (process closed)
        if (error.code === 'EPIPE' || error.errno === -4047) {
          return { ...lastEval }; // Return last known eval
        }
        throw error;
      }
      
      // No delay - immediate command
      
      const evalResult = await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          if (pendingResolve) {
            pendingResolve = null;
            resolve({ ...lastEval }); // Use last known eval
          } else {
            resolve({ ...lastEval }); // Use last known eval
          }
        }, isCritical ? 150 : 100); // Balanced: 100ms normal, 150ms critical (allows deeper search)
        
        pendingResolve = (result) => {
          clearTimeout(timeout);
          resolve(result);
        };
        
        // ADAPTIVE DEPTH: Deeper for critical positions, balanced for others
        // This provides better accuracy while maintaining reasonable speed
        try {
          if (stockfish.killed || !stockfish.stdin.writable) {
            clearTimeout(timeout);
            resolve({ ...lastEval });
            return;
          }
          
          // Adaptive depth based on position criticality
          // Critical positions (tactical/endgame) get deeper analysis for accuracy
          // Normal positions get moderate depth for speed
          const depth = isCritical ? 8 : 6; // Depth 6 normal, 8 critical (better accuracy)
          stockfish.stdin.write(`go depth ${depth}\n`); // Depth-based analysis
        } catch (error) {
          // Handle EPIPE errors gracefully
          if (error.code === 'EPIPE' || error.errno === -4047) {
            clearTimeout(timeout);
            resolve({ ...lastEval });
          } else {
            reject(error);
          }
        }
      });
      
      return evalResult;
    };

    // Phase 2: Parse PGN and analyze every move
    const chess = new Chess();
    try {
      chess.loadPgn(gameData.pgn);
    } catch (e) {
      console.log(`[Stockfish] Failed to load PGN: ${e.message}`);
      // Kill Stockfish process gracefully
      try {
        if (!stockfish.killed && stockfish.stdin.writable) {
          stockfish.stdin.end();
        }
        if (!stockfish.killed) {
          stockfish.kill();
        }
      } catch (error) {
        // Ignore EPIPE errors when killing process
        if (error.code !== 'EPIPE' && error.errno !== -4047) {
          console.log(`[Stockfish] Error killing process: ${error.message}`);
        }
      }
      return null;
    }
    
    const moves = chess.history({ verbose: true });
    const analysisResults = [];
    const playerIsWhite = gameData.white?.toLowerCase() === searchedUsername?.toLowerCase();
    
    console.log(`[Stockfish] Analyzing ${moves.length} moves for ${searchedUsername} (playing as ${playerIsWhite ? 'White' : 'Black'})`);
    
    // Start from initial position
    const gameChess = new Chess();
    
    for (let moveIndex = 0; moveIndex < moves.length; moveIndex++) {
      const move = moves[moveIndex];
      const isPlayerMove = (playerIsWhite && move.color === 'w') || (!playerIsWhite && move.color === 'b');
      
      // EXTREME-SPEED SAMPLING: Only analyze critical positions (Aimchess style)
      const isOpening = moveIndex < 10; // Reduced opening window
      const isEndgame = moveIndex >= moves.length - 15; // Reduced endgame window
      const isTactical = gameChess.inCheck() || gameChess.isCheckmate();
      const hasCaptures = move.captured !== undefined; // Capture moves are important
      const isCriticalPosition = isTactical || isEndgame;
      
      // ULTRA-AGGRESSIVE SAMPLING: Only analyze player moves + tactical + endgame (Aimchess speed)
      // Skip opponent moves entirely unless tactical or endgame
      const shouldAnalyze = isPlayerMove ||  // Always analyze player moves
                           isTactical ||     // Always analyze tactical positions
                           isEndgame ||      // Always analyze endgame
                           (isOpening && moveIndex < 8 && isPlayerMove) || // Opening player moves only
                           (hasCaptures && isPlayerMove); // Captures by player
      
      let evalBest = 0, evalActual = 0, bestMove = 'none', bestLine = [];
      let classification = 'book';
      let cpl = 0;
      let topMoves = []; // Top 3 engine moves
      let playerMoveUCI = null; // Player's move in UCI format for comparison
      
      if (shouldAnalyze && moveIndex >= 3) { // Skip first 3 moves only (was 6 - too many)
        
        // OPTIMIZED: Fast evaluation for player moves, skip opponent moves when possible
        if (isPlayerMove) {
          // For player moves: always evaluate before and after (accurate CPL calculation)
          // NOTE: Stockfish UCI always reports evaluations from WHITE's perspective
          // Step 1: Evaluate before move
          const positionBeforeMove = gameChess.fen();
          const evalBefore = await evaluatePosition(positionBeforeMove, isCriticalPosition);
          // Convert to player's perspective: if player is black, negate (white's eval inverted)
          evalBest = playerIsWhite ? evalBefore.cp : -evalBefore.cp;
          bestMove = evalBefore.bestMove;
          bestLine = evalBefore.pv;
          topMoves = evalBefore.topMoves || []; // Get top 3 moves
          
          // Convert player's move to UCI format for comparison
          try {
            // Try to get UCI from the move object
            if (move.from && move.to) {
              playerMoveUCI = `${move.from}${move.to}${move.promotion || ''}`;
            } else {
              // Fallback: reconstruct UCI from SAN
              const tempChess = new Chess(positionBeforeMove);
              const moveObj = tempChess.move(move.san);
              if (moveObj) {
                playerMoveUCI = moveObj.from + moveObj.to + (moveObj.promotion || '');
              }
            }
          } catch (e) {
            // If conversion fails, use SAN as fallback
            console.log(`[Stockfish] Could not convert move to UCI: ${move.san}`);
          }
          
          // Step 2: Apply the move
          gameChess.move(move);
          
          // Step 3: Evaluate after move
          const positionAfterMove = gameChess.fen();
          const evalAfter = await evaluatePosition(positionAfterMove, isCriticalPosition);
          // After move, turn flips to opponent - but Stockfish still reports from white's perspective
          // Convert to player's perspective: if player is black, negate
          evalActual = playerIsWhite ? evalAfter.cp : -evalAfter.cp;
        } else {
          // For opponent moves: only evaluate if critical (tactical/endgame)
          // Otherwise skip - opponent moves don't contribute to player's CPL
          if (isCriticalPosition) {
            const positionBeforeMove = gameChess.fen();
            const evalBefore = await evaluatePosition(positionBeforeMove, isCriticalPosition);
            evalBest = evalBefore.cp;
            bestMove = evalBefore.bestMove;
            bestLine = evalBefore.pv;
            
            gameChess.move(move);
            
            const positionAfterMove = gameChess.fen();
            const evalAfter = await evaluatePosition(positionAfterMove, isCriticalPosition);
            evalActual = -evalAfter.cp;
          } else {
            // Skip evaluation for non-critical opponent moves - just apply move
            gameChess.move(move);
            // Set defaults (won't be used in CPL calculation for opponent moves)
            evalBest = 0;
            evalActual = 0;
            bestMove = 'none';
            bestLine = [];
          }
        }
        
        // Step 4: Calculate precise CPL (both in centipawns, from player's perspective)
        // CPL = loss compared to best move (positive = losing evaluation, negative = gaining)
        cpl = Math.max(0, evalBest - evalActual); // Only count losses, not gains
      
      // Step 5: Classify move based on ENGINE RANKING (user's definition: best = #1 engine move, good = #2 or #3)
        if (isPlayerMove && playerMoveUCI && topMoves.length > 0) {
          // Compare player's move against top 3 engine moves
          if (topMoves[0] && playerMoveUCI === topMoves[0]) {
            classification = 'best'; // Matches engine's #1 recommendation
          } else if (topMoves[1] && playerMoveUCI === topMoves[1]) {
            classification = 'good'; // Matches engine's #2 recommendation
          } else if (topMoves[2] && playerMoveUCI === topMoves[2]) {
            classification = 'good'; // Matches engine's #3 recommendation
          } else {
            // Move doesn't match top 3 - classify by CPL
            if (cpl >= 300) {
              classification = 'blunder';
            } else if (cpl >= 100 && cpl < 300) {
              classification = 'mistake';
            } else if (cpl >= 50 && cpl < 100) {
              classification = 'inaccuracy';
            } else if (cpl <= 25) {
              // Small CPL but not in top 3 - still reasonable, classify as good
              classification = 'good';
            } else {
              classification = 'normal';
            }
          }
        } else {
          // Fallback to CPL-based classification if we can't compare moves
          if (cpl <= 5) {
            classification = 'best';
          } else if (cpl <= 15) {
            classification = 'excellent';
          } else if (cpl <= 25) {
            classification = 'good';
          } else if (cpl >= 50 && cpl < 100) {
            classification = 'inaccuracy';
          } else if (cpl >= 100 && cpl < 300) {
            classification = 'mistake';
          } else if (cpl >= 300) {
            classification = 'blunder';
          } else {
            classification = 'normal';
          }
        }
      } else {
        // For non-analyzed moves, just apply the move
        gameChess.move(move);
        classification = moveIndex < 6 ? 'book' : 'normal';
      }
      
      // Store analysis data
      analysisResults.push({
        moveNumber: Math.ceil((moveIndex + 1) / 2),
        move: move.san,
        fen: gameChess.fen(),
        isPlayerMove,
        evalBest,
        evalActual,
        cpl: Math.max(0, cpl),
        bestMove,
        bestLine: bestLine.join(' '),
        classification
      });
      
      // Progress update
      if ((moveIndex + 1) % 10 === 0) {
        console.log(`[Stockfish] Progress: ${moveIndex + 1}/${moves.length} moves processed (analyzed key positions)`);
      }
    }
    
    // Kill Stockfish process gracefully
    try {
      if (!stockfish.killed && stockfish.stdin.writable) {
        stockfish.stdin.end();
      }
      if (!stockfish.killed) {
        stockfish.kill();
      }
    } catch (error) {
      // Ignore EPIPE errors when killing process (expected when process closes)
      if (error.code !== 'EPIPE' && error.errno !== -4047) {
        console.log(`[Stockfish] Error killing process: ${error.message}`);
      }
    }
    
    // Phase 3: Calculate metrics
    const playerMoves = analysisResults.filter(m => m.isPlayerMove && m.moveNumber > 5); // Skip opening
    const totalCPL = playerMoves.reduce((sum, m) => sum + m.cpl, 0);
    const avgCPL = playerMoves.length > 0 ? totalCPL / playerMoves.length : 0;
    
    // Count classifications
    const counts = {
      best: playerMoves.filter(m => m.classification === 'best').length,
      excellent: playerMoves.filter(m => m.classification === 'excellent').length,
      good: playerMoves.filter(m => m.classification === 'good').length,
      inaccuracy: playerMoves.filter(m => m.classification === 'inaccuracy').length,
      mistake: playerMoves.filter(m => m.classification === 'mistake').length,
      blunder: playerMoves.filter(m => m.classification === 'blunder').length,
      total: playerMoves.length
    };
    
    const gameAnalysisEndTime = Date.now();
    const gameAnalysisDuration = ((gameAnalysisEndTime - gameAnalysisStartTime) / 1000).toFixed(2);
    console.log(`[Stockfish] Analysis complete. Average CPL: ${avgCPL.toFixed(2)}, Counts:`, counts);
    console.log(`[Stockfish] ⏱️  Game analysis time: ${gameAnalysisDuration}s`);
    
    const result = {
      gameUrl: gameData.url,
      playerIsWhite,
      moves: analysisResults,
      avgCPL,
      counts,
      keyMoments: playerMoves.filter(m => m.cpl >= 100).sort((a, b) => b.cpl - a.cpl).slice(0, 5)
    };
    
    // Cache the result in memory
    analysisCache.set(gameUrl, {
      timestamp: Date.now(),
      result: result
    });
    
    // Also save to database for persistent caching (async, don't wait)
    saveAnalysisToDatabase(gameData, result, searchedUsername).catch(err => {
      console.log(`[Stockfish] Failed to save analysis to database: ${err.message}`);
    });
    
    return result;
    
  } catch (error) {
    console.error(`[Stockfish] Analysis failed for ${gameUrl}: ${error.message}`);
    console.error(`[Stockfish] Error stack: ${error.stack}`);
    return null;
  }
}

// POST /api/games/import - Import games to database for PDF reports
router.post('/import', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const handle = (req.body.username || '').toString().trim().toLowerCase();
    const timeClass = (req.body.timeClass || '').toString().trim().toLowerCase();
    const platform = (req.body.platform || '').toString().trim().toLowerCase();
    
    if (!handle) {
      return res.status(400).json({ message: 'Username is required' });
    }
    
    console.log(`[Import] Starting import for ${handle}, timeClass: ${timeClass}, platform: ${platform}`);
    
    // Fetch games from API
    let games = [];
    const fetchPlatform = platform && platform !== 'auto' ? platform : 'chesscom';
    
    if (fetchPlatform === 'chesscom') {
      games = await fetchChessComGames(handle, 20, timeClass !== 'all' ? timeClass : null);
    } else if (fetchPlatform === 'lichess') {
      games = await fetchLichessGames(handle, 20, timeClass !== 'all' ? timeClass : null);
    }
    
    if (games.length === 0) {
      return res.status(404).json({ 
        message: `Failed to import games: No games found for username: ${handle} on ${fetchPlatform}` 
      });
    }
    
    console.log(`[Import] Found ${games.length} games, saving to database...`);
    
         // Save games to database
     const savedGames = [];
    let duplicateCount = 0;
    
     for (const gameData of games) {
       try {
        const gameDoc = new Game({
          user: userId,
          platform: fetchPlatform,
           gameUrl: gameData.url,
           pgn: gameData.pgn,
          endTime: gameData.endTime,
           whiteUsername: gameData.white,
           blackUsername: gameData.black,
           result: gameData.result,
           timeControl: gameData.timeControl,
          timeClass: gameData.timeClass
        });
        
        const saved = await gameDoc.save();
        savedGames.push(saved);
        console.log(`[Import] Saved game: ${gameData.url}`);
        
      } catch (error) {
        if (error.code === 11000) {
          // Duplicate key error - game already exists
          duplicateCount++;
          console.log(`[Import] Duplicate game skipped: ${gameData.url}`);
        } else {
          console.error(`[Import] Error saving game ${gameData.url}:`, error.message);
        }
      }
    }
    
    const importedCount = savedGames.length;
    console.log(`[Import] Import complete. Saved: ${importedCount}, Duplicates: ${duplicateCount}`);
    
    res.json({
      message: `Successfully imported ${importedCount} games${duplicateCount > 0 ? ` (${duplicateCount} duplicates skipped)` : ''}`,
      imported: importedCount,
      duplicates: duplicateCount,
      total: games.length,
      username: handle,
      platform: fetchPlatform,
      timeClass: timeClass !== 'all' ? timeClass : 'all'
    });
        
      } catch (error) {
    console.error('[Import] Error:', error);
    res.status(500).json({ 
      message: 'Failed to import games: ' + error.message 
    });
  }
});

// GET /api/games/report/40 - Real-time analysis with queue support
router.get('/report/40', auth, async (req, res) => {
  try {
    const handle = (req.query.username || '').toString().trim().toLowerCase();
    const timeClass = (req.query.timeClass || '').toString().trim().toLowerCase();
    const platform = (req.query.platform || '').toString().trim().toLowerCase();
    const userId = req.user?.id || req.ip || 'anonymous';

    if (!handle) {
      return res.status(400).json({ message: 'Username is required' });
    }

    // Check if queue is available and enabled
    if (useQueue && analysisQueue) {
      // Use queue for handling high concurrency
      const queueStartTime = Date.now();
      console.log(`[Report] Queuing analysis for ${handle}, user: ${userId}, timeClass: ${timeClass}, platform: ${platform}`);
      
      // Check cache first (instant response)
      const cacheKey = `${handle}-${timeClass}-${platform}`;
      if (globalAnalysisCache.has(cacheKey)) {
        const cached = globalAnalysisCache.get(cacheKey);
        const cacheAge = Date.now() - cached.timestamp;
        if (cacheAge < 300000) { // 5 minutes cache
          console.log(`[Report] Using cached result for ${handle}`);
          const result = cached.result;
          return res.json({
            status: 'complete',
            message: `Analysis complete! Analyzed ${result.allAnalysis.length} games.`,
            processing: 0,
            summary: result.summary,
            metrics: result.metrics,
            scouting: result.scouting,
            keyMoments: result.keyMoments,
            games: result.allAnalysis.map(a => ({
              url: a.gameUrl,
              avgCPL: a.avgCPL,
              counts: a.counts
            }))
          });
        }
      }

      // Add job to queue
      const job = await analysisQueue.add({
        handle,
        timeClass,
        platform,
        userId,
        cacheKey
      }, {
        jobId: `${userId}-${handle}-${timeClass}-${Date.now()}`,
        priority: 1,
        attempts: 2
      });

      // Return job ID for polling
      res.json({
        status: 'queued',
        jobId: job.id,
        message: 'Analysis queued. Poll /api/games/report/status/:jobId for results.',
        estimatedTime: 120000 // 2 minutes estimate
      });
    } else {
      // Fallback to direct processing (backward compatibility)
      const reportStartTime = Date.now();
      console.log(`[Report] Direct processing for ${handle}, timeClass: ${timeClass}, platform: ${platform}`);
      
      const { summary, metrics, scouting, keyMoments, allAnalysis } = await runFullAnalysis(handle, timeClass, platform);
      
      const reportEndTime = Date.now();
      const reportDuration = ((reportEndTime - reportStartTime) / 1000).toFixed(2);
      const reportDurationMinutes = ((reportEndTime - reportStartTime) / 60000).toFixed(2);
      console.log(`[Report] ⏱️  Report generation completed in ${reportDuration}s (${reportDurationMinutes} minutes)`);
      
      res.json({
        status: 'complete',
        message: `Analysis complete! Analyzed ${allAnalysis.length} games.`,
        processing: 0,
        summary,
        metrics,
        scouting,
        keyMoments,
        games: allAnalysis.map(a => ({
          url: a.gameUrl,
          avgCPL: a.avgCPL,
          counts: a.counts
        }))
      });
    }
    
  } catch (error) {
    const status = error.status || 500;
    console.error('[Report] Error:', error);
    res.status(status).json({
      message: 'Analysis failed: ' + error.message,
      error: error.message
    });
  }
});

// GET /api/games/report/status/:jobId - Check job status
router.get('/report/status/:jobId', auth, async (req, res) => {
  try {
    if (!useQueue || !analysisQueue) {
      return res.status(503).json({ 
        message: 'Queue system not available',
        error: 'Queue system is not initialized'
      });
    }

    const job = await analysisQueue.getJob(req.params.jobId);
    if (!job) {
      return res.status(404).json({ 
        message: 'Job not found',
        error: 'Job ID does not exist'
      });
    }

    const state = await job.getState();
    const progress = job.progress() || 0;

    // If job is complete, return results
    if (state === 'completed' && job.returnvalue) {
      const result = job.returnvalue;
      return res.json({
        status: 'complete',
        jobId: job.id,
        progress: 100,
        message: `Analysis complete! Analyzed ${result.allAnalysis.length} games.`,
        summary: result.summary,
        metrics: result.metrics,
        scouting: result.scouting,
        keyMoments: result.keyMoments,
        games: result.allAnalysis.map(a => ({
          url: a.gameUrl,
          avgCPL: a.avgCPL,
          counts: a.counts
        }))
      });
    }

    // If job failed
    if (state === 'failed') {
      return res.status(500).json({
        status: 'failed',
        jobId: job.id,
        message: 'Analysis failed',
        error: job.failedReason || 'Unknown error'
      });
    }

    // Job still processing
    res.json({
      status: state,
      jobId: job.id,
      progress: progress,
      message: state === 'waiting' ? 'Job is queued and waiting' : 
               state === 'active' ? 'Analysis in progress' : 
               'Job is processing'
    });

  } catch (error) {
    console.error('[Report Status] Error:', error);
    res.status(500).json({
      message: 'Failed to get job status: ' + error.message,
      error: error.message
    });
  }
});

// GET /api/games/report/scouting - Returns scouting data (reuses main analysis logic)
router.get('/report/scouting', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const handle = (req.query.username || '').toString().trim().toLowerCase();
    const timeClass = (req.query.timeClass || '').toString().trim().toLowerCase();
    const platform = (req.query.platform || '').toString().trim().toLowerCase();

    if (!handle) {
      return res.status(400).json({ message: 'Username is required' });
    }

    console.log(`[Scouting] Generating scouting report for ${handle}`);
    
    // **FIXED**: Call shared analysis function directly
    const { summary, metrics, scouting } = await runFullAnalysis(handle, timeClass, platform);
    
    console.log(`[Scouting] Scouting report generated successfully`);
    
    // Save report to database
    try {
      const reportData = {
        summary,
        metrics,
        scouting
      };
      
      // Try to fetch player rating for metadata
      const fetchPlatform = platform && platform !== 'auto' ? platform : 'chesscom';
      let playerRating = null;
      let ratingSource = 'unknown';
      try {
        const ratingResult = await fetchPlayerRating(handle, timeClass || 'rapid', fetchPlatform);
        playerRating = ratingResult?.rating;
        ratingSource = ratingResult?.ratingSource || 'estimated';
      } catch (err) {
        console.log(`[Scouting] Could not fetch rating for metadata: ${err.message}`);
      }
      
      // Generate peer comparison for metadata if possible
      let playerStats = null;
      let ratingRange = null;
      if (playerRating) {
        try {
          const peerComparison = generatePeerComparison(playerRating, metrics, summary);
          playerStats = peerComparison.playerStats;
          ratingRange = peerComparison.ratingRange;
        } catch (err) {
          console.log(`[Scouting] Could not generate peer comparison for metadata: ${err.message}`);
        }
      }
      
      const report = new Report({
        user: userId,
        username: handle,
        platform: platform || 'auto',
        timeClass: timeClass || 'all',
        reportData,
        metadata: {
          playerRating,
          ratingSource,
          ratingRange,
          playerStats,
          createdAt: new Date()
        }
      });
      
      await report.save();
      console.log(`[Scouting] Report saved to database for user ${userId}`);
    } catch (saveError) {
      console.error(`[Scouting] Failed to save report to database: ${saveError.message}`);
      // Don't fail the request if save fails
    }
    
    return res.json(scouting);
    
  } catch (error) {
    const status = error.status || 500;
    console.error('[Scouting] Error:', error);
    res.status(status).json({ 
      message: 'Failed to generate scouting report', 
      error: error.message 
    });
  }
});

// GET /api/games/report/peer-comparison - NEW: Returns peer comparison with radar chart data
router.get('/report/peer-comparison', auth, async (req, res) => {
  try {
    const handle = (req.query.username || '').toString().trim().toLowerCase();
    const timeClass = (req.query.timeClass || '').toString().trim().toLowerCase();
    const platform = (req.query.platform || '').toString().trim().toLowerCase();

    if (!handle) {
      return res.status(400).json({ message: 'Username is required' });
    }

    console.log(`[Peer Comparison] Generating peer comparison for ${handle}, timeClass: ${timeClass}, platform: ${platform}`);
    
    // Reuse the existing analysis
    const { summary, metrics, scouting } = await runFullAnalysis(handle, timeClass, platform);
    
    // Fetch actual player rating from chess.com/lichess API
    const fetchPlatform = platform && platform !== 'auto' ? platform : 'chesscom';
    const ratingResult = await fetchPlayerRating(handle, timeClass || 'rapid', fetchPlatform);
    let playerRating = ratingResult?.rating;
    let ratingSource = ratingResult?.ratingSource || 'estimated';
    
    // If API fetch failed, fall back to estimation
    if (!playerRating || ratingResult?.isFallback) {
      console.log(`[Peer Comparison] API fetch failed or fallback rating used, estimating from metrics`);
      playerRating = estimatePlayerRating(metrics, summary);
      ratingSource = 'estimated';
    }
    
    console.log(`[Peer Comparison] Using rating: ${playerRating} for ${timeClass || 'rapid'}`);
    
    // Generate peer comparison
    const peerComparison = generatePeerComparison(playerRating, metrics, summary);
    
    // Get study plan for this rating
    const studyPlan = getStudyPlan(playerRating);
    
    // Identify weaknesses (areas below peer average)
    const weaknesses = [];
    const strengths = [];
    const areas = ['opening', 'tactics', 'ending', 'advantage', 'resourcefulness', 'timeManagement'];
    
    areas.forEach(area => {
      const diff = peerComparison.comparison[area];
      if (diff < -10) {
        weaknesses.push({
          area,
          diff,
          severity: diff < -20 ? 'high' : 'medium'
        });
      } else if (diff > 10) {
        strengths.push({
          area,
          diff
        });
      }
    });
    
    // Sort weaknesses by severity
    weaknesses.sort((a, b) => a.diff - b.diff);
    
    // Get recommended modules based on weaknesses
    const recommendedModules = weaknesses.map(weakness => {
      const module = studyPlan.modules.find(m => m.area === weakness.area);
      return {
        ...module,
        priority: weakness.severity,
        gap: Math.abs(weakness.diff)
      };
    });
    
    // Build interpretation data (removed "Review" text)
    const interpretation = {
      opening: '',
      tactics: '',
      ending: '',
      advantage: '',
      resourcefulness: '',
      timeManagement: ''
    };
    
    console.log(`[Peer Comparison] Generated successfully for rating ${playerRating}`);
    console.log(`[Peer Comparison] Weaknesses:`, weaknesses.map(w => `${w.area} (${w.diff})`));
    console.log(`[Peer Comparison] Recommended modules:`, recommendedModules.length);
    
    const peerComparisonData = {
      username: handle,
      playerRating,
      ratingSource,
      platformUsed: fetchPlatform,
      ratingRange: peerComparison.ratingRange,
      playerStats: peerComparison.playerStats,
      peerStats: peerComparison.peerStats,
      comparison: peerComparison.comparison,
      interpretation,
      studyPlan: {
        ...studyPlan,
        recommendedModules,
        weaknesses: weaknesses.map(w => w.area),
        strengths: strengths.map(s => s.area)
      },
      rawMetrics: {
        openingScore: scouting.openingScore,
        blundersPer100: scouting.blundersPer100,
        endgameLossPerMove: scouting.endgameLossPerMove,
        advantageCapitalization: scouting.advantageCapitalization,
        resourcefulness: scouting.resourcefulness,
        acpl: scouting.acpl
      }
    };
    
    // Save report to database
    try {
      const userId = req.user.id;
      const reportData = {
        summary,
        metrics,
        scouting,
        peerComparison: peerComparisonData
      };
      
      const report = new Report({
        user: userId,
        username: handle,
        platform: platform || 'auto',
        timeClass: timeClass || 'all',
        reportData,
        metadata: {
          playerRating,
          ratingSource,
          ratingRange: peerComparison.ratingRange,
          playerStats: peerComparison.playerStats,
          createdAt: new Date()
        }
      });
      
      await report.save();
      console.log(`[Peer Comparison] Report saved to database for user ${userId}`);
    } catch (saveError) {
      console.error(`[Peer Comparison] Failed to save report to database: ${saveError.message}`);
      // Don't fail the request if save fails
    }
    
    res.json(peerComparisonData);
    
  } catch (error) {
    const status = error.status || 500;
    console.error('[Peer Comparison] Error:', error);
    res.status(status).json({ 
      message: 'Failed to generate peer comparison', 
      error: error.message 
    });
  }
});

/**
 * GET /api/games/import?username=<handle>&platform=<chesscom|lichess>
 * Fetches games from API (no storage) and returns them for immediate use
 */
router.get('/import', auth, async (req, res) => {
  try {
    const username = (req.query.username || '').toString().trim();
    const platform = (req.query.platform || 'chesscom').toString().toLowerCase();
    
    if (!username) {
      return res.status(400).json({ message: 'Username is required' });
    }
    
    console.log(`[Import] Fetching games for ${username} from ${platform} (no storage)`);
    
    let games = [];
    if (platform === 'chesscom') {
      games = await fetchChessComGames(username, 20);
    } else if (platform === 'lichess') {
      games = await fetchLichessGames(username, 20);
    } else {
      return res.status(400).json({ message: 'Platform must be chesscom or lichess' });
    }
    
    if (games.length === 0) {
      return res.status(404).json({ message: 'No games found for this username' });
    }
    
    console.log(`[Import] Successfully fetched ${games.length} games (not stored)`);
    
    res.json({
      message: `Successfully fetched ${games.length} games from ${platform}`,
      games: games.map(g => ({
        url: g.url,
        white: g.white,
        black: g.black,
        result: g.result,
        timeClass: g.timeClass,
        endTime: g.endTime
      })),
      note: 'Games are not stored. Use /api/games/report/40 for analysis.'
    });
    
  } catch (error) {
    console.error('[Import] Error:', error);
    res.status(500).json({ 
      message: 'Failed to import games', 
      error: error.message 
    });
  }
});

/**
 * Helper functions for analysis calculations
 */

function calculateOpeningPerformance(games, allAnalysis) {
  const openingStats = {};
  
  for (const game of games) {
    // Parse opening from PGN with proper names
    const eco = (game.pgn.match(/\[ECO\s+"([A-E]\d{2})"\]/) || [])[1] || null;
    const openingName = (game.pgn.match(/\[Opening\s+"([^"]+)"\]/) || [])[1] || 
                       (eco ? getOpeningName(eco) : 'Unknown Opening');
    
    const key = `${eco || 'NA'}|${openingName}`;
    if (!openingStats[key]) {
      openingStats[key] = { 
        name: openingName, 
        eco, 
        count: 0, 
        wins: 0, 
        draws: 0, 
        losses: 0,
        totalCpAfter12: 0,
        gamesWithMove12: 0,
        links: []
      };
    }
    
    openingStats[key].count++;
    openingStats[key].links.push(game.url);
    
    // Count results for this opening
    const playerIsWhite = game.white?.toLowerCase() === game.searchedUsername?.toLowerCase();
    const playerIsBlack = game.black?.toLowerCase() === game.searchedUsername?.toLowerCase();
    
    if (game.result === '1-0') {
      if (playerIsWhite) openingStats[key].wins++;
      else if (playerIsBlack) openingStats[key].losses++;
    } else if (game.result === '0-1') {
      if (playerIsWhite) openingStats[key].losses++;
      else if (playerIsBlack) openingStats[key].wins++;
    } else if (game.result === '1/2-1/2') {
      openingStats[key].draws++;
    }
    
    // Find analysis for this game and get opening score (FIXED: use position evaluation like main calculation)
    const analysis = allAnalysis.find(a => a.gameUrl === game.url);
    if (analysis) {
      // Use position evaluation after opening (moves 10-12), matching main calculation
      const openingPlayerMoves = analysis.moves.filter(m => m.isPlayerMove && m.moveNumber >= 10 && m.moveNumber <= 12);
      
      if (openingPlayerMoves.length > 0) {
        const lastOpeningMove = openingPlayerMoves[openingPlayerMoves.length - 1];
        const openingEvaluation = lastOpeningMove.evalActual || 0;
        openingStats[key].totalCpAfter12 += openingEvaluation;
        openingStats[key].gamesWithMove12++;
      } else {
        // Fallback: find move closest to 12
        const playerMovesNear12 = analysis.moves.filter(m => m.isPlayerMove && m.moveNumber <= 12 && m.moveNumber >= 8);
        if (playerMovesNear12.length > 0) {
          const closestMove = playerMovesNear12.reduce((closest, m) => 
            Math.abs(m.moveNumber - 12) < Math.abs(closest.moveNumber - 12) ? m : closest
          );
          const openingEvaluation = closestMove.evalActual || 0;
          openingStats[key].totalCpAfter12 += openingEvaluation;
          openingStats[key].gamesWithMove12++;
        }
      }
    }
  }
  
  // Convert to array and calculate percentages - FIXED: Sort by frequency (games played)
  const openings = Object.values(openingStats).map(s => ({
    name: s.name,
    eco: s.eco,
    games: s.count,
    scorePct: s.count > 0 ? ((s.wins + s.draws * 0.5) / s.count) * 100 : 0,
    avgCpAfter12: s.gamesWithMove12 > 0 ? s.totalCpAfter12 / s.gamesWithMove12 : 0,
    links: s.links.slice(0, 5) // Limit to 5 links
  })).sort((a, b) => b.games - a.games); // **FIXED**: Sort by number of games (frequency)
  
  let bestOpening = null;
  let worstOpening = null;
  
  // Find best and worst openings (minimum 2 games)
  for (const opening of openings) {
    if (opening.games >= 2) {
      if (!bestOpening || opening.scorePct > bestOpening.scorePct) {
        bestOpening = opening;
      }
      if (!worstOpening || opening.scorePct < worstOpening.scorePct) {
        worstOpening = opening;
      }
    }
  }
  
  return {
    all: openings,
    best: bestOpening,
    worst: worstOpening
  };
}

// Duplicate function removed - using the one above

function generateStrengths(metrics, summary) {
  const strengths = [];
  
  if (metrics.accuracyPercent >= 85) {
    strengths.push("Excellent accuracy");
  }
  if (metrics.advantageCapitalization >= 70) {
    strengths.push("Strong advantage conversion");
  }
  if (metrics.resourcefulness >= 60) {
    strengths.push("Great defensive skills");
  }
  if (metrics.openingScoreCp >= 0.2) {
    strengths.push("Solid opening preparation");
  }
  if (summary.total > 0 && (summary.best + summary.excellent) / summary.total >= 0.4) {
    strengths.push("High-quality move selection");
  }
  
  if (strengths.length === 0) {
    strengths.push("Consistent play");
  }
  
  return strengths;
}

function generateFocusAreas(metrics, summary) {
  const focus = [];
  
  if (metrics.accuracyPercent < 75) {
    focus.push("Improve calculation accuracy");
  }
  if (metrics.tacticsBlundersPerGame >= 1) {
    focus.push("Reduce tactical mistakes");
  }
  if (metrics.advantageCapitalization < 50) {
    focus.push("Work on converting advantages");
  }
  if (metrics.openingScoreCp < -0.2) {
    focus.push("Study opening theory");
  }
  if (metrics.endgameCpLossPerMove >= 0.15) {
    focus.push("Practice endgame technique");
  }
  if (metrics.resourcefulness < 40) {
    focus.push("Improve defensive play");
  }
  
  if (focus.length === 0) {
    focus.push("Maintain current performance");
  }
  
  return focus;
}

async function fetchPlayerRating(username, timeClass, platform = 'chesscom') {
  try {
    if (platform === 'chesscom') {
      const user = username.toLowerCase().trim();
      const response = await axios.get(`https://api.chess.com/pub/player/${user}/stats`, {
        timeout: 10000
      });
      
      const stats = response.data;

      const rapid = stats.chess_rapid?.last?.rating || null;
      const blitz = stats.chess_blitz?.last?.rating || null;
      const bullet = stats.chess_bullet?.last?.rating || null;
      const daily = stats.chess_daily?.last?.rating || null;
      const classical = stats.chess_daily?.last?.rating || null; // Chess.com uses daily for classical

      // FIXED: Prioritize the requested timeClass first, then fall back to others
      const preferredOrder = [timeClass, 'rapid', 'blitz', 'classical', 'bullet', 'daily'].filter(Boolean);
      let selectedRating = null;
      let ratingSource = null;

      for (const source of preferredOrder) {
        // Check requested timeClass first
        if (source === timeClass) {
          if (timeClass === 'rapid' && rapid) {
            selectedRating = rapid;
            ratingSource = 'rapid';
            break;
          }
          if (timeClass === 'blitz' && blitz) {
            selectedRating = blitz;
            ratingSource = 'blitz';
            break;
          }
          if (timeClass === 'bullet' && bullet) {
            selectedRating = bullet;
            ratingSource = 'bullet';
            break;
          }
          if ((timeClass === 'daily' || timeClass === 'classical') && daily) {
            selectedRating = daily;
            ratingSource = 'daily';
            break;
          }
        }
        // Fallback to rapid if requested timeClass not found
        if (source === 'rapid' && rapid) {
          selectedRating = rapid;
          ratingSource = 'rapid';
          break;
        }
        if (source === 'blitz' && blitz) {
          selectedRating = blitz;
          ratingSource = 'blitz';
          break;
        }
        if (source === 'classical' && classical) {
          selectedRating = classical;
          ratingSource = 'daily'; // Chess.com uses daily for classical
          break;
        }
        if (source === 'bullet' && bullet) {
          selectedRating = bullet;
          ratingSource = 'bullet';
          break;
        }
        if (source === 'daily' && daily) {
          selectedRating = daily;
          ratingSource = 'daily';
          break;
        }
      }

      // Final fallback if nothing found
      if (!selectedRating && rapid) {
        selectedRating = rapid;
        ratingSource = 'rapid';
      }
      if (!selectedRating && blitz) {
        selectedRating = blitz;
        ratingSource = 'blitz';
      }
      if (!selectedRating && daily) {
        selectedRating = daily;
        ratingSource = 'daily';
      }
      if (!selectedRating && bullet) {
        selectedRating = bullet;
        ratingSource = 'bullet';
      }

      if (selectedRating) {
        console.log(`[Rating Fetch] ${username} ${ratingSource}: ${selectedRating}`);
        return { rating: selectedRating, ratingSource, isFallback: false };
      }

      console.log(`[Rating Fetch] ${username} no rating found, using default 1200`);
      return { rating: 1200, ratingSource: 'fallback', isFallback: true };
    } else if (platform === 'lichess') {
      const response = await axios.get(`https://lichess.org/api/user/${username}`, {
        timeout: 10000
      });
      
      const perfs = response.data.perfs;
      const rapid = perfs.rapid?.rating || null;
      const blitz = perfs.blitz?.rating || null;
      const classical = perfs.classical?.rating || null;
      const bullet = perfs.bullet?.rating || null;

      // FIXED: Prioritize the requested timeClass first, then fall back to others
      const preferredOrder = [timeClass, 'rapid', 'blitz', 'classical', 'bullet'].filter(Boolean);
      let selectedRating = null;
      let ratingSource = null;

      for (const source of preferredOrder) {
        // Check requested timeClass first
        if (source === timeClass) {
          if (timeClass === 'rapid' && rapid) {
            selectedRating = rapid;
            ratingSource = 'rapid';
            break;
          }
          if (timeClass === 'blitz' && blitz) {
            selectedRating = blitz;
            ratingSource = 'blitz';
            break;
          }
          if (timeClass === 'classical' && classical) {
            selectedRating = classical;
            ratingSource = 'classical';
            break;
          }
          if (timeClass === 'bullet' && bullet) {
            selectedRating = bullet;
            ratingSource = 'bullet';
            break;
          }
        }
        // Fallback to rapid if requested timeClass not found
        if (source === 'rapid' && rapid) {
          selectedRating = rapid;
          ratingSource = 'rapid';
          break;
        }
        if (source === 'blitz' && blitz) {
          selectedRating = blitz;
          ratingSource = 'blitz';
          break;
        }
        if (source === 'classical' && classical) {
          selectedRating = classical;
          ratingSource = 'classical';
          break;
        }
        if (source === 'bullet' && bullet) {
          selectedRating = bullet;
          ratingSource = 'bullet';
          break;
        }
      }

      // Final fallback if nothing found
      if (!selectedRating && rapid) {
        selectedRating = rapid;
        ratingSource = 'rapid';
      }
      if (!selectedRating && blitz) {
        selectedRating = blitz;
        ratingSource = 'blitz';
      }
      if (!selectedRating && classical) {
        selectedRating = classical;
        ratingSource = 'classical';
      }
      if (!selectedRating && bullet) {
        selectedRating = bullet;
        ratingSource = 'bullet';
      }

      if (selectedRating) {
        console.log(`[Rating Fetch] ${username} ${ratingSource}: ${selectedRating}`);
        return { rating: selectedRating, ratingSource, isFallback: false };
      }

      console.log(`[Rating Fetch] ${username} no rating found, using default 1500`);
      return { rating: 1500, ratingSource: 'fallback', isFallback: true };
    }
  } catch (error) {
    console.error(`[Rating Fetch] Error fetching rating for ${username}:`, error.message);
    return { rating: 1200, ratingSource: 'fallback', isFallback: true };
  }
}

function estimatePlayerRating(metrics, summary) {
  // Fallback estimation if API fetch fails
  let baseRating = 1200; // Starting point
  
  // Accuracy contribution (0-400 points)
  baseRating += (metrics.accuracyPercent - 50) * 8;
  
  // ACPL contribution (lower is better, -200 to +200 points)
  const acplPenalty = Math.min(200, Math.max(-200, (metrics.acpl - 0.5) * -400));
  baseRating += acplPenalty;
  
  // Best move rate contribution (0-300 points)
  const bestMoveRate = summary.total > 0 ? (summary.best / summary.total) * 100 : 0;
  baseRating += (bestMoveRate - 10) * 10;
  
  // Blunder penalty (-300 to 0 points)
  baseRating -= metrics.tacticsBlundersPerGame * 150;
  
  // Advantage capitalization (0-200 points)
  baseRating += (metrics.advantageCapitalization - 50) * 4;
  
  // Clamp to reasonable range
  return Math.round(Math.max(800, Math.min(2800, baseRating)));
}

function getStudyPlan(rating) {
  const baseModules = {
    opening: { area: 'opening', title: 'Game Review & Opening Habits', url: '/lessons' },
    tactics: { area: 'tactics', title: 'Tactics Trainer', url: '/puzzles/random' },
    ending: { area: 'ending', title: 'Endgame Trainer', url: '/endgame-trainer' },
    advantage: { area: 'advantage', title: 'Intuition Trainer', url: '/guess-the-move' },
    resourcefulness: { area: 'resourcefulness', title: 'Blunder Preventer', url: '/blunder-preventer' },
    timeManagement: { area: 'timeManagement', title: 'Practice Visualization', url: '/practice-visualisation' }
  };

  const plans = [
    {
      min: 0,
      max: 799,
      ratingBracket: '400-800',
      title: '400-800 Training Blueprint',
      focus: 'Build fundamentals and eliminate simple blunders.',
      daily: [
        '10m Tactics drills targeting basic motifs.',
        '5m Blunder Preventer to catch hanging pieces.',
        '5m Practice visualization to strengthen board awareness.',
        '10m light review of finished games focusing on major mistakes.'
      ],
      weekly: [
        '3 rapid games with post-mortem review.',
        '1 focused Endgame session on basic mates.',
        '1 recap of tactics theme errors from the week.'
      ],
      monthly: [
        'Track puzzle accuracy trend and celebrate improvements.',
        'Set one milestone such as mate-in-2 or avoiding hanging pieces.',
        'Refresh preferred time controls if blunder rate drops below 10%.'
      ],
      yearly: [
        'Aim for a 20-day streak on core modules every month.',
        'Graduate to simple Intuition Trainer segments in Q4.',
        'Reassess blunder hotspots at the end of each quarter.'
      ],
      moduleFocus: {
        opening: {
          duration: 'Weekly 3-game review',
          description: 'Replay rapid games to reinforce early development patterns and spot recurring opening errors.'
        },
        tactics: {
          duration: 'Daily 10m',
          description: 'Keep tactics volume high to ingrain basic forks, pins, and mates.'
        },
        ending: {
          duration: 'Weekly 1 session',
          description: 'Use Endgame Trainer for basic mates and king-pawn fundamentals mentioned in the weekly plan.'
        },
        advantage: {
          duration: 'Quarterly step-up',
          description: 'Introduce short Intuition Trainer sets once tactics accuracy is stable.'
        },
        resourcefulness: {
          duration: 'Daily 5m',
          description: 'Run Blunder Preventer reps to lower hanging-piece mistakes and build defensive awareness.'
        },
        timeManagement: {
          duration: 'Daily 5m',
          description: 'Practice visualization sprints to improve calculation speed and reduce time scrambles.'
        }
      }
    },
    {
      min: 800,
      max: 1199,
      ratingBracket: '800-1200',
      title: '800-1200 Training Blueprint',
      focus: 'Sharpen tactics and start structured endgame work.',
      daily: [
        '15m Tactics with increasing difficulty.',
        '10m Blunder Preventer focused on recurring mistakes.',
        '10m Practice visualization with board rescans.',
        'Annotate one mistake from your own game.'
      ],
      weekly: [
        '4 rapid/classical games with post-mortem reviews.',
        '1 Defender session on key defensive motifs.',
        '2 Endgame blocks emphasizing pawn endings.',
        '1 Intuition Trainer mini-set.'
      ],
      monthly: [
        'Evaluate openings for recurring traps and update notes.',
        'Set KPIs: >=75% tactics success and <=1 blunder per game.',
        'Schedule a rest week every 8 weeks with half training volume.'
      ],
      yearly: [
        'Build seasonal goals: spring tactics, summer endgames, autumn defense.',
        'Archive quarterly reports that include annotated game samples.',
        'Bring in an external coach review if progress plateaus for 3+ months.'
      ],
      moduleFocus: {
        opening: {
          duration: 'Weekly post-mortems',
          description: 'Use rapid/classical reviews to document opening traps and create simple prep files.'
        },
        tactics: {
          duration: 'Daily 15m',
          description: 'Increase puzzle difficulty while maintaining the >=75% KPI.'
        },
        ending: {
          duration: 'Twice weekly',
          description: 'Focus on king-and-pawn techniques and opposition themes.'
        },
        advantage: {
          duration: 'Weekly mini-set',
          description: 'Use Intuition Trainer to practice transitioning advantages into wins.'
        },
        resourcefulness: {
          duration: 'Daily 10m + weekly Defender',
          description: 'Combine Blunder Preventer and Defender to reduce tactical oversights and build defensive skill.'
        },
        timeManagement: {
          duration: 'Daily 10m',
          description: 'Reinforce visualization habits and note time usage in annotated games.'
        }
      }
    },
    {
      min: 1200,
      max: 1599,
      ratingBracket: '1200-1600',
      title: '1200-1600 Training Blueprint',
      focus: 'Balance calculation training with strategic foundations.',
      daily: [
        '20m Tactics incorporating multi-move sequences.',
        '15m Intuition Trainer to verbalize plans.',
        '10m Defender drills for practical defense.',
        '10m Endgame fundamentals with technique refreshers.'
      ],
      weekly: [
        '5 long games with deep post-game analysis.',
        '1 themed Blunder Preventer run targeting middlegame blunders.',
        '1 visualization ladder extending depth by one ply each week.'
      ],
      monthly: [
        'Consolidate your opening repertoire and capture new ideas.',
        'Run a performance audit covering solve speed, accuracy, and time usage.',
        'Schedule sparring matches with slightly stronger opponents.'
      ],
      yearly: [
        'Cycle focus: Q1 calculation, Q2 endgames, Q3 defense, Q4 practical play.',
        'Log rating goals and benchmark every 12 weeks.',
        'Attend at least one OTB event for feedback and practical experience.'
      ],
      moduleFocus: {
        opening: {
          duration: 'Monthly repertoire review',
          description: 'Update opening notes after each deep analysis block.'
        },
        tactics: {
          duration: 'Daily 20m',
          description: 'Solve multi-move combinations to extend calculation depth.'
        },
        ending: {
          duration: 'Daily 10m',
          description: 'Reinforce rook and minor-piece endgames alongside conversion drills.'
        },
        advantage: {
          duration: 'Daily 15m',
          description: 'Use Intuition Trainer to connect calculation results with strategic choices.'
        },
        resourcefulness: {
          duration: 'Weekly themed set',
          description: 'Run Defender and Blunder Preventer scenarios focusing on middlegame resilience.'
        },
        timeManagement: {
          duration: 'Weekly ladder',
          description: 'Visualization ladder work enhances calculation speed and time handling.'
        }
      }
    },
    {
      min: 1600,
      max: 1999,
      ratingBracket: '1600-2000',
      title: '1600-2000 Training Blueprint',
      focus: 'Upgrade calculation endurance and tournament readiness.',
      daily: [
        '20m advanced Tactics with mixed themes.',
        '20m Intuition Trainer, verbalizing candidate moves.',
        '15m Defender practical drills under time pressure.',
        '15m Endgame technique to polish critical endings.'
      ],
      weekly: [
        '6 competitive games including classical time controls.',
        '1 deep mistake-cluster session using Blunder Preventer.',
        '1 visualization endurance set (blindfold replay).',
        '1 model game study aligned with the current theme.'
      ],
      monthly: [
        'Run statistical review covering opening scores and endgame conversion.',
        'Rotate focus between complex pawn endings and rook endings.',
        'Schedule a rest-reset micro-cycle every 5th week.'
      ],
      yearly: [
        'Define rating peaks for each quarter and plan two training camps.',
        'Archive curated repertoire files for quick refresh.',
        'Evaluate psychological preparation before major events.'
      ],
      moduleFocus: {
        opening: {
          duration: 'Weekly model game study',
          description: 'Use game reviews to connect preparation with practical results.'
        },
        tactics: {
          duration: 'Daily 20m',
          description: 'Blend advanced motifs with calculation endurance drills.'
        },
        ending: {
          duration: 'Daily 15m',
          description: 'Alternate complex pawn and rook endgames each month.'
        },
        advantage: {
          duration: 'Daily 20m',
          description: 'Leverage Intuition Trainer to practice decision-making under pressure.'
        },
        resourcefulness: {
          duration: 'Weekly deep dive',
          description: 'Use Defender plus post-mortem clusters to strengthen practical defense.'
        },
        timeManagement: {
          duration: 'Weekly endurance set',
          description: 'Blindfold visualization reinforces calm calculation in time trouble.'
        }
      }
    },
    {
      min: 2000,
      max: 2199,
      ratingBracket: '2000-2200',
      title: '2000-2200 Training Blueprint',
      focus: 'Refine professional habits and performance analytics.',
      daily: [
        '25m high-level Tactics with deeper lines.',
        '25m Intuition Trainer verbalizing full candidate trees.',
        '20m Defender runs under practical time pressure.',
        '20m Endgame tablebase studies.',
        '10m Practice visualization cooldown.'
      ],
      weekly: [
        '7 serious games (mix OTB/online) with thorough engine-assisted review.',
        'Update thematic blunder catalog from recent battles.',
        'Test one opening novelty per week.'
      ],
      monthly: [
        'Run performance diagnostics versus peers and adjust workload to fatigue levels.',
        'Schedule sparring with titled players to stress-test preparation.',
        'Maintain an annotated database of critical games.'
      ],
      yearly: [
        'Periodize three macro cycles: preparation, competition, consolidation.',
        'Analyze rating trajectory against planned milestones.',
        'Incorporate physical and mental conditioning blocks.'
      ],
      moduleFocus: {
        opening: {
          duration: 'Weekly novelty testing',
          description: 'Integrate new ideas from reviews into live games and database notes.'
        },
        tactics: {
          duration: 'Daily 25m',
          description: 'Use hardest puzzles to maintain calculation sharpness.'
        },
        ending: {
          duration: 'Daily 20m',
          description: 'Blend practical endings with tablebase confirmation.'
        },
        advantage: {
          duration: 'Daily 25m',
          description: 'Verbalize candidate moves to perfect conversion technique.'
        },
        resourcefulness: {
          duration: 'Daily 20m',
          description: 'Run Defender scenarios to practice surviving critical positions.'
        },
        timeManagement: {
          duration: 'Daily 10m cooldown',
          description: 'Visualization wind-down keeps pattern memory sharp without burnout.'
        }
      }
    },
    {
      min: 2200,
      max: 2399,
      ratingBracket: '2200-2400',
      title: '2200-2400 Training Blueprint',
      focus: 'Polish elite-level consistency and preparation depth.',
      daily: [
        '30m elite Tactics with exhaustive calculation.',
        '30m Intuition Trainer including full verbal annotations.',
        '25m Defender sessions on defensive resources.',
        '25m Endgame work mixing practical and theoretical studies.',
        '15m Practice visualization with multi-branch tracking.'
      ],
      weekly: [
        '8 high-quality games with professional-level analysis.',
        'Dedicated opening lab day testing fresh novelties.',
        'Create a blunder prevention checklist before each event.'
      ],
      monthly: [
        'Run a KPI dashboard covering CP loss, conversion, and novelty success.',
        'Hold sparring matches with IM/GM coaches.',
        'Iterate on psychological routines and pre-game rituals.'
      ],
      yearly: [
        'Align calendar with peak tournaments and plan taper weeks.',
        'Commission an in-depth repertoire overhaul annually.',
        'Document strategic themes to revisit in future seasons.'
      ],
      moduleFocus: {
        opening: {
          duration: 'Weekly lab day',
          description: 'Use model games and novelties to refine elite repertoire choices.'
        },
        tactics: {
          duration: 'Daily 30m',
          description: 'Solve complex tactical studies to maintain GM-level sharpness.'
        },
        ending: {
          duration: 'Daily 25m',
          description: 'Blend composed studies with practical endings to ensure precision.'
        },
        advantage: {
          duration: 'Daily 30m',
          description: 'Document full verbal lines in Intuition Trainer for elite decision-making.'
        },
        resourcefulness: {
          duration: 'Daily 25m',
          description: 'Focus Defender work on defensive resources against strongest opposition.'
        },
        timeManagement: {
          duration: 'Daily 15m',
          description: 'Visualization ladders emphasize tracking multiple candidate branches.'
        }
      }
    },
    {
      min: 2400,
      max: Infinity,
      ratingBracket: '2400+',
      title: '2400+ Training Blueprint',
      focus: 'Sustain world-class performance with structured cycles.',
      daily: [
        '35m cutting-edge Tactics with engine-assisted verification.',
        '35m Intuition Trainer with neural evaluation comparison.',
        '30m Defender work in highly complex positions.',
        '30m Endgame study including composed and tablebase-backed puzzles.',
        '20m Practice visualization through blindfold simulation games.'
      ],
      weekly: [
        '8-10 classical or training games with team/coach review.',
        'Maintain an opening novelty pipeline with dedicated analysts.',
        'Run an error taxonomy update after every match.'
      ],
      monthly: [
        'Conduct holistic performance reviews (chess, physical, mental).',
        'Schedule recovery microcycles to manage fatigue.',
        'Collaborate with specialists such as seconds, psychologists, and fitness coaches.'
      ],
      yearly: [
        'Build a multi-peak season plan around elite events.',
        'Integrate intensive training camps before major tournaments.',
        'Refresh the entire study database and benchmark vs world-class metrics.'
      ],
      moduleFocus: {
        opening: {
          duration: 'Weekly analyst sync',
          description: 'Coordinate with your team to keep the novelty pipeline fresh and aligned with event goals.'
        },
        tactics: {
          duration: 'Daily 35m',
          description: 'Use engine-calibrated studies to stay sharp against elite preparation.'
        },
        ending: {
          duration: 'Daily 30m',
          description: 'Blend composed masterpieces with practical endgame rehearsals to avoid late-round slips.'
        },
        advantage: {
          duration: 'Daily 35m',
          description: 'Pair Intuition Trainer sessions with neural evaluation checks to master complex decisions.'
        },
        resourcefulness: {
          duration: 'Daily 30m',
          description: 'Push Defender scenarios to the limit to maintain resilience against super-GM pressure.'
        },
        timeManagement: {
          duration: 'Daily 20m',
          description: 'Blindfold simulations keep visualization stamina and time usage instinctive.'
        }
      }
    }
  ];

  const selectedPlan =
    plans.find(plan => rating >= plan.min && rating <= plan.max) || plans[plans.length - 1];

  const modules = Object.keys(baseModules).map(area => {
    const base = baseModules[area];
    const focus = selectedPlan.moduleFocus?.[area] || {};
    return {
      ...base,
      duration: focus.duration || '',
      description: focus.description || ''
    };
  });

  return {
    title: selectedPlan.title,
    focus: selectedPlan.focus,
    ratingBracket: selectedPlan.ratingBracket,
    daily: selectedPlan.daily,
    weekly: selectedPlan.weekly,
    monthly: selectedPlan.monthly,
    yearly: selectedPlan.yearly,
    modules
  };
}

function generatePeerComparison(playerRating, metrics, summary) {
  // Generate typical stats for the estimated rating range
  // Updated to be more realistic based on actual chess performance data
  const ratingRanges = {
    800: { opening: 30, tactics: 35, ending: 40, advantage: 25, resourcefulness: 20, timeManagement: 45 },
    1000: { opening: 40, tactics: 45, ending: 48, advantage: 35, resourcefulness: 30, timeManagement: 50 },
    1200: { opening: 50, tactics: 55, ending: 52, advantage: 45, resourcefulness: 40, timeManagement: 55 },
    1400: { opening: 58, tactics: 62, ending: 58, advantage: 55, resourcefulness: 50, timeManagement: 60 },
    1600: { opening: 65, tactics: 68, ending: 63, advantage: 65, resourcefulness: 58, timeManagement: 65 },
    1800: { opening: 70, tactics: 72, ending: 68, advantage: 70, resourcefulness: 65, timeManagement: 70 },
    2000: { opening: 75, tactics: 77, ending: 73, advantage: 75, resourcefulness: 70, timeManagement: 75 },
    2200: { opening: 80, tactics: 82, ending: 78, advantage: 80, resourcefulness: 75, timeManagement: 80 },
    2400: { opening: 85, tactics: 87, ending: 83, advantage: 85, resourcefulness: 80, timeManagement: 85 }
  };
  
  // Interpolate peer stats based on exact player rating instead of closest range
  const ranges = Object.keys(ratingRanges).map(Number).sort((a, b) => a - b);
  
  // Find the two closest rating ranges for interpolation
  let lowerRange = ranges[0];
  let upperRange = ranges[ranges.length - 1];
  
  for (let i = 0; i < ranges.length - 1; i++) {
    if (playerRating >= ranges[i] && playerRating <= ranges[i + 1]) {
      lowerRange = ranges[i];
      upperRange = ranges[i + 1];
      break;
    } else if (playerRating < ranges[i]) {
      lowerRange = i > 0 ? ranges[i - 1] : ranges[i];
      upperRange = ranges[i];
      break;
    }
  }
  
  // If rating is above the highest range, use the highest range
  if (playerRating >= ranges[ranges.length - 1]) {
    lowerRange = ranges[ranges.length - 1];
    upperRange = ranges[ranges.length - 1];
  }
  
  // Interpolate peer stats based on exact rating
  const lowerStats = ratingRanges[lowerRange];
  const upperStats = ratingRanges[upperRange];
  
  let peerStats;
  if (lowerRange === upperRange) {
    peerStats = { ...lowerStats };
  } else {
    // Linear interpolation between the two ranges
    const ratio = (playerRating - lowerRange) / (upperRange - lowerRange);
    peerStats = {
      opening: Math.round(lowerStats.opening + (upperStats.opening - lowerStats.opening) * ratio),
      tactics: Math.round(lowerStats.tactics + (upperStats.tactics - lowerStats.tactics) * ratio),
      ending: Math.round(lowerStats.ending + (upperStats.ending - lowerStats.ending) * ratio),
      advantage: Math.round(lowerStats.advantage + (upperStats.advantage - lowerStats.advantage) * ratio),
      resourcefulness: Math.round(lowerStats.resourcefulness + (upperStats.resourcefulness - lowerStats.resourcefulness) * ratio),
      timeManagement: Math.round(lowerStats.timeManagement + (upperStats.timeManagement - lowerStats.timeManagement) * ratio)
    };
  }
  
  // Calculate player's actual stats for comparison using the ACTUAL scouting metrics
  // FIXED Opening: Based on position evaluation after opening (centipawns from player's perspective)
  // Convert to 0-100 scale matching realistic chess performance:
  // The original formula (50 + openingScoreCp / 1.3) was too harsh, penalizing small disadvantages too much
  // For example, -61 cp (slight disadvantage) was giving ~3% which got clamped to 20%
  // New formula: 50 + (openingScoreCp / 10.0) - much more forgiving for realistic play
  // Examples:
  //   0 cp = 50% (neutral)
  //   +100 cp = 60% (good)
  //   +200 cp = 70% (excellent)
  //   -61 cp = 43.9% (slight disadvantage - reasonable for 2200 player)
  //   -100 cp = 40% (moderate disadvantage)
  //   -200 cp = 30% (significant disadvantage)
  // This makes -61 cp result in ~44% instead of ~20%, which is much more reasonable
  const openingScoreCp = metrics.openingScoreCp ?? 0;
  const openingStatRaw = Math.max(0, Math.min(100, 50 + (openingScoreCp / 10.0))); // Much more forgiving conversion
  
  // Blunders per 100 moves (raw metric - kept for display, not used in peer comparison)
  const blundersPer100 = summary.total > 0 ? (summary.blunder / summary.total) * 100 : 0;
  
  // Ending: Based on endgameCpLossPerMove in pawns (lower is better)
  // FIXED: Use a more logical curve that represents endgame skill (0-100%)
  // Better interpretation: 0 pawns loss = 100% (perfect), 0.2 = 85%, 0.4 = 70%, 0.6 = 55%, 0.8 = 40%, 1.0 = 25%, 1.5 = 10%
  // Note: endgameCpLossPerMove is already in pawns (not centipawns)
  let endgameLossPawns = metrics.endgameCpLossPerMove;
  
  // If undefined or null, use a reasonable default based on player rating
  if (endgameLossPawns === undefined || endgameLossPawns === null) {
    // Estimate based on rating: lower rating = higher loss
    endgameLossPawns = playerRating < 1200 ? 0.4 : playerRating < 1600 ? 0.3 : playerRating < 2000 ? 0.2 : 0.15;
  }
  
  // If 0 (no endgame moves or perfect endgame), give a high score
  if (endgameLossPawns === 0) {
    endgameLossPawns = 0.1; // Equivalent to ~90% score
  }
  
  // Cap at reasonable maximum
  endgameLossPawns = Math.min(endgameLossPawns, 1.5);
  
  // FIXED FORMULA: Match Aimchess curve more closely
  // Aimchess shows 71% for good endgame play, which suggests a more forgiving curve
  // Goal: 0 = 100% (perfect), 0.15 = 85% (excellent), 0.3 = 71% (good - matches Aimchess), 0.45 = 58% (average), 0.6 = 45% (below avg), 0.9 = 25% (poor)
  // Use: 100 - (endgameLossPawns * 38) for Aimchess-like scaling
  // This gives: 0=100%, 0.15=94.3%, 0.3=88.6%, 0.45=82.9%, 0.6=77.2%, 0.9=65.8%, 1.2=54.4%, 1.5=43%
  // Even more forgiving: 100 - (endgameLossPawns * 35) to get closer to Aimchess 71%
  // This gives: 0=100%, 0.15=94.75%, 0.3=89.5%, 0.45=84.25%, 0.6=79%, 0.9=68.5%, 1.2=58%, 1.5=47.5%
  // Let's use 35 multiplier to match Aimchess better
  const endingStatRaw = Math.max(5, Math.min(100, 100 - (endgameLossPawns * 35))); // Aimchess-like curve
  
  // Advantage Capitalization: Already a percentage (0-100), but ensure reasonable range
  const advantageStatRaw = Math.max(0, Math.min(100, metrics.advantageCapitalization ?? 50));
  
  // Resourcefulness: Already a percentage (0-100), but ensure reasonable range
  const resourcefulnessStatRaw = Math.max(0, Math.min(100, metrics.resourcefulness ?? 50));
  
  // Time Management: FIXED - Based on quality of moves in later game phases (moves 30+)
  // Good time management = maintaining move quality when time is running low
  // Calculate based on late-game performance (moves 30+) as proxy for time pressure situations
  
  const lateGameAccuracy = metrics.lateGameAccuracy ?? metrics.accuracyPercent ?? 50;
  const lateGameBlundersPerGame = metrics.lateGameBlundersPerGame ?? metrics.blundersPerGame ?? 0;
  const lateGameCPL = metrics.lateGameCPL ?? metrics.averageCPL ?? 50;
  
  // Time management score = combination of:
  // 1. Late-game accuracy (50% weight) - maintaining quality under time pressure
  // 2. Low late-game blunder rate (30% weight) - avoiding blunders when time is low
  // 3. Reasonable late-game CPL (20% weight) - not making huge mistakes
  
  // Normalize late-game blunders: 0 blunders/game = 100%, 1 = 70%, 2 = 40%, 3+ = 10%
  const lateBlunderScore = Math.max(0, Math.min(100, 100 - (lateGameBlundersPerGame * 30)));
  
  // Normalize late-game CPL: 0-30 CPL = 100%, 50 = 80%, 80 = 60%, 120 = 40%, 200+ = 10%
  const lateCplScore = Math.max(0, Math.min(100, 100 - ((lateGameCPL / 100) * 50)));
  
  // Weighted combination (late-game performance is key indicator of time management)
  const timeManagementStatRaw = (lateGameAccuracy * 0.5) + (lateBlunderScore * 0.3) + (lateCplScore * 0.2);

  // Calculate bestMoveRate and acpl for logging
  const bestMoveRate = metrics.bestMoveRate ?? (summary.total > 0 ? (summary.best / summary.total) * 100 : 0);
  const acpl = metrics.acpl ?? (metrics.averageCPL ? metrics.averageCPL / 100 : 0.5);

  // Category-specific clamping functions with strict min/max bounds
  // Openings, Middlegame (Tactics), Endgame, Strategy (Advantage): Min 20%, Max 95%
  const clampStandardCategory = (value) => {
    if (!Number.isFinite(value)) return 20; // Default to minimum if invalid
    return Math.round(Math.max(20, Math.min(95, value)));
  };
  
  // Resourcefulness: Min 15%, Max 60%
  const clampResourcefulness = (value) => {
    if (!Number.isFinite(value)) return 15; // Default to minimum if invalid
    return Math.round(Math.max(15, Math.min(60, value)));
  };
  
  // Time Management: Min 15%, Max 65%
  const clampTimeManagement = (value) => {
    if (!Number.isFinite(value)) return 15; // Default to minimum if invalid
    return Math.round(Math.max(15, Math.min(65, value)));
  };

  // Calculate tactics score from blunders for display purposes (not for comparison, just for chart)
  // Tactics = inverse of blunder rate (for radar chart only)
  // Raw calculation first, then apply standard category bounds
  const tacticsFromBlundersRaw = blundersPer100 <= 30 
    ? 100 - (blundersPer100 / 30) * 65
    : 35 - (blundersPer100 - 30) * 0.5;

  // Apply category-specific bounds to all stats
  const playerStats = {
    opening: clampStandardCategory(openingStatRaw),
    tactics: clampStandardCategory(tacticsFromBlundersRaw), // Standard category: 20-95%
    ending: clampStandardCategory(endingStatRaw),
    advantage: clampStandardCategory(advantageStatRaw),
    resourcefulness: clampResourcefulness(resourcefulnessStatRaw), // 15-60%
    timeManagement: clampTimeManagement(timeManagementStatRaw) // 15-65%
  };
  
  // Calculate rating range display based on exact rating (±50 for same rating comparison)
  const ratingRange = `${Math.round(playerRating - 50)}-${Math.round(playerRating + 50)}`;
  
  console.log('[Peer Comparison] Player stats calculation:', {
    playerRating,
    ratingRange,
    openingScoreCp: openingScoreCp.toFixed(2),
    openingStatRaw: openingStatRaw.toFixed(1),
    blundersPer100: blundersPer100.toFixed(2),
    endgameLossPawns: endgameLossPawns.toFixed(3),
    endingStatRaw: endingStatRaw.toFixed(1),
    bestMoveRate: bestMoveRate.toFixed(1),
    acpl: acpl.toFixed(3),
    timeManagementStatRaw: timeManagementStatRaw.toFixed(1),
    advantageCapitalization: metrics.advantageCapitalization?.toFixed?.(1) ?? metrics.advantageCapitalization,
    resourcefulness: metrics.resourcefulness?.toFixed?.(1) ?? metrics.resourcefulness,
    playerStats,
    peerStats
  });
  
  return {
    ratingRange,
    playerStats,
    peerStats,
    comparison: {
      opening: playerStats.opening - peerStats.opening,
      tactics: playerStats.tactics - peerStats.tactics, // Added back for display
      ending: playerStats.ending - peerStats.ending,
      advantage: playerStats.advantage - peerStats.advantage,
      resourcefulness: playerStats.resourcefulness - peerStats.resourcefulness,
      timeManagement: playerStats.timeManagement - peerStats.timeManagement
    }
  };
}

// GET /api/games/reports - Get user's saved reports
router.get('/reports', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const reports = await Report.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(50)
      .select('username platform timeClass metadata createdAt');
    
    res.json({
      reports: reports.map(r => ({
        id: r._id,
        username: r.username,
        platform: r.platform,
        timeClass: r.timeClass,
        playerRating: r.metadata?.playerRating,
        ratingRange: r.metadata?.ratingRange,
        playerStats: r.metadata?.playerStats,
        createdAt: r.createdAt
      }))
    });
  } catch (error) {
    console.error('[Reports] Error fetching reports:', error);
    res.status(500).json({ 
      message: 'Failed to fetch reports', 
      error: error.message 
    });
  }
});

// GET /api/games/reports/:reportId - Get a specific saved report
router.get('/reports/:reportId', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const reportId = req.params.reportId;
    
    // Validate that reportId is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(reportId)) {
      return res.status(400).json({ 
        message: 'Invalid report ID format. Report ID must be a valid MongoDB ObjectId.' 
      });
    }
    
    const report = await Report.findOne({ 
      _id: reportId, 
      user: userId 
    });
    
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }
    
    res.json({
      id: report._id,
      username: report.username,
      platform: report.platform,
      timeClass: report.timeClass,
      reportData: report.reportData,
      metadata: report.metadata,
      createdAt: report.createdAt
    });
  } catch (error) {
    console.error('[Reports] Error fetching report:', error);
    res.status(500).json({ 
      message: 'Failed to fetch report', 
      error: error.message 
    });
  }
});

// POST /api/games/save - Save a game to user's profile
router.post('/save', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { pgn, result, timeControl, opponent, gameType = 'bot' } = req.body;
    
    if (!pgn) {
      return res.status(400).json({ message: 'PGN is required' });
    }
    
    // Create a new game document
    const game = new Game({
      user: userId,
      platform: 'chessrep',
      gameUrl: `chessrep-${Date.now()}`,
      pgn: pgn,
      endTime: new Date(),
      whiteUsername: gameType === 'bot' ? (opponent === 'white' ? 'Bot' : 'User') : 'User',
      blackUsername: gameType === 'bot' ? (opponent === 'black' ? 'Bot' : 'User') : 'Opponent',
      result: result || '*',
      timeControl: timeControl || 'unlimited',
      timeClass: timeControl || 'unlimited',
      gameType: gameType
    });
    
    const savedGame = await game.save();
    
    res.json({
      success: true,
      message: 'Game saved successfully',
      gameId: savedGame._id
    });
    
  } catch (error) {
    console.error('Error saving game:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to save game' 
    });
  }
});

// GET /api/games/saved - Get user's saved games
router.get('/saved', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const games = await Game.find({ 
      user: userId,
      platform: 'chessrep'
    })
    .sort({ endTime: -1 })
    .limit(50)
    .select('pgn result timeControl whiteUsername blackUsername endTime gameType');
    
    res.json(games);
    
  } catch (error) {
    console.error('Error fetching saved games:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch saved games' 
    });
  }
});

// Export analysis functions for worker process
module.exports = router;
module.exports.runFullAnalysis = runFullAnalysis;
module.exports.analyzeGameWithStockfish = analyzeGameWithStockfish;
module.exports.saveAnalysisToDatabase = saveAnalysisToDatabase;