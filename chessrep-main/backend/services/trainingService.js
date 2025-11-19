const fs = require('fs');
const path = require('path');
const { Chess } = require('chess.js');
const PGNParser = require('pgn-parser');

const GAMES_DIR = path.join(__dirname, '../data');

class TrainingService {
  constructor() {
    this.skillLevels = {
      'beginner': 'beginner_games.pgn',
      'intermediate': 'intermediate_games.pgn', 
      'master': 'master_games.pgn'
    };
    
    this.gamePatterns = {
      beginner: {},
      intermediate: {},
      master: {}
    };
    
    this.openingBook = {};
    this.tacticalPatterns = {};
    this.positionalPatterns = {};
    
    this.loadGamePatterns();
  }

  // Load and analyze games to extract patterns
  async loadGamePatterns() {
    for (const [level, filename] of Object.entries(this.skillLevels)) {
      try {
        const filePath = path.join(GAMES_DIR, filename);
        const data = fs.readFileSync(filePath, 'utf8');
        const games = this.parseGamesFromPGN(data);
        
        this.gamePatterns[level] = this.analyzeGames(games, level);
        console.log(`Loaded ${games.length} games for ${level} level`);
      } catch (error) {
        console.error(`Error loading ${level} games:`, error);
      }
    }
    
    // Build opening book from all games
    this.buildOpeningBook();
    this.buildTacticalPatterns();
  }

  // Parse PGN content
  parseGamesFromPGN(pgnContent) {
    try {
      return PGNParser.parse(pgnContent);
    } catch (e) {
      console.error('Error parsing PGN:', e);
      return [];
    }
  }

  // Build opening book from all games
  buildOpeningBook() {
    this.openingBook = {};
    
    Object.values(this.gamePatterns).forEach(levelPatterns => {
      if (levelPatterns.games) {
        levelPatterns.games.forEach(game => {
          const moves = game.moves.map(m => m.move);
          this.addToOpeningBook(moves);
        });
      }
    });
  }

  // Add game moves to opening book
  addToOpeningBook(moves) {
    let chess = new Chess();
    
    for (let i = 0; i < Math.min(moves.length, 20); i++) { // Limit to first 20 moves
      const move = moves[i];
      
      if (!chess.moves().includes(move)) continue;
      
      const fen = chess.fen().split(' ')[0]; // Only board position
      
      if (!this.openingBook[fen]) {
        this.openingBook[fen] = {};
      }
      
      if (!this.openingBook[fen][move]) {
        this.openingBook[fen][move] = 0;
      }
      
      this.openingBook[fen][move]++;
      
      chess.move(move);
    }
  }

  // Build tactical patterns
  buildTacticalPatterns() {
    this.tacticalPatterns = {
      captures: {},
      checks: {},
      forks: {},
      pins: {},
      discovered: {}
    };
    
    Object.values(this.gamePatterns).forEach(levelPatterns => {
      if (levelPatterns.games) {
        levelPatterns.games.forEach(game => {
          this.analyzeTacticalPatterns(game);
        });
      }
    });
  }

  // Analyze tactical patterns in a game
  analyzeTacticalPatterns(game) {
    const moves = game.moves.map(m => m.move);
    let chess = new Chess();
    
    moves.forEach((move, index) => {
      try {
        const fen = chess.fen().split(' ')[0];
        
        // Analyze move type
        if (move.includes('x')) {
          if (!this.tacticalPatterns.captures[fen]) {
            this.tacticalPatterns.captures[fen] = [];
          }
          this.tacticalPatterns.captures[fen].push(move);
        }
        
        if (move.includes('+')) {
          if (!this.tacticalPatterns.checks[fen]) {
            this.tacticalPatterns.checks[fen] = [];
          }
          this.tacticalPatterns.checks[fen].push(move);
        }
        
        // Check for forks (simplified)
        if (this.isFork(chess, move)) {
          if (!this.tacticalPatterns.forks[fen]) {
            this.tacticalPatterns.forks[fen] = [];
          }
          this.tacticalPatterns.forks[fen].push(move);
        }
        
        chess.move(move);
      } catch (error) {
        // Skip invalid moves or positions
        console.log(`Skipping invalid move: ${move}`);
      }
    });
  }

  // Check if a move is a fork
  isFork(chess, move) {
    try {
      const testChess = new Chess(chess.fen());
      testChess.move(move);
      
      // Check if the move attacks multiple pieces
      const attackedSquares = [];
      
      for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
          const square = String.fromCharCode(97 + j) + (8 - i);
          const piece = testChess.get(square);
          if (piece && piece.color !== testChess.turn()) {
            attackedSquares.push(square);
          }
        }
      }
      
      return attackedSquares.length >= 2;
    } catch (error) {
      return false;
    }
  }

  // Analyze games to extract patterns
  analyzeGames(games, level) {
    const patterns = {
      games: games,
      openings: {},
      movePatterns: {},
      tacticalPatterns: {},
      positionalPatterns: {},
      averageMoves: 0,
      commonMistakes: {},
      strengths: {}
    };

    let totalMoves = 0;
    const allMoves = [];

    games.forEach(game => {
      const moves = game.moves.map(m => m.move);
      totalMoves += moves.length;
      allMoves.push(...moves);

      // Analyze openings
      if (moves.length >= 2) {
        const opening = moves.slice(0, 2).join(' ');
        patterns.openings[opening] = (patterns.openings[opening] || 0) + 1;
      }

      // Analyze move patterns
      moves.forEach((move, index) => {
        if (index < moves.length - 1) {
          const pattern = `${move} -> ${moves[index + 1]}`;
          patterns.movePatterns[pattern] = (patterns.movePatterns[pattern] || 0) + 1;
        }
      });
    });

    patterns.averageMoves = Math.round(totalMoves / games.length);
    
    // Analyze common characteristics by level
    switch (level) {
      case 'beginner':
        patterns.strengths = {
          basicOpenings: this.findCommonOpenings(patterns.openings, 5),
          simpleTactics: this.findSimpleTactics(allMoves),
          commonMistakes: this.findBeginnerMistakes(games)
        };
        break;
      case 'intermediate':
        patterns.strengths = {
          tacticalAwareness: this.findTacticalPatterns(games),
          positionalUnderstanding: this.findPositionalPatterns(games),
          openingKnowledge: this.findCommonOpenings(patterns.openings, 10)
        };
        break;
      case 'master':
        patterns.strengths = {
          deepCalculation: this.findDeepPatterns(games),
          strategicPlanning: this.findStrategicPatterns(games),
          endgameTechnique: this.findEndgamePatterns(games)
        };
        break;
    }

    return patterns;
  }

  // Find common openings
  findCommonOpenings(openings, count) {
    return Object.entries(openings)
      .sort(([,a], [,b]) => b - a)
      .slice(0, count)
      .map(([opening, frequency]) => ({ opening, frequency }));
  }

  // Find simple tactical patterns
  findSimpleTactics(moves) {
    const tactics = {
      captures: moves.filter(m => m.includes('x')).length,
      checks: moves.filter(m => m.includes('+')).length,
      forks: 0,
      pins: 0
    };
    return tactics;
  }

  // Find beginner mistakes
  findBeginnerMistakes(games) {
    const mistakes = {
      hangingPieces: 0,
      missedTactics: 0,
      poorOpenings: 0
    };
    
    return mistakes;
  }

  // Find tactical patterns
  findTacticalPatterns(games) {
    return {
      tacticalMoves: 0,
      combinations: 0,
      sacrifices: 0
    };
  }

  // Find positional patterns
  findPositionalPatterns(games) {
    return {
      pawnStructure: 0,
      pieceActivity: 0,
      kingSafety: 0
    };
  }

  // Find deep patterns for master level
  findDeepPatterns(games) {
    return {
      longCombinations: 0,
      prophylacticMoves: 0,
      deepCalculation: 0
    };
  }

  // Find strategic patterns
  findStrategicPatterns(games) {
    return {
      strategicPlans: 0,
      pieceCoordination: 0,
      spaceControl: 0
    };
  }

  // Find endgame patterns
  findEndgamePatterns(games) {
    return {
      endgameTechnique: 0,
      kingActivity: 0,
      pawnEndgames: 0
    };
  }

  // Get training recommendations based on skill level
  getTrainingRecommendations(level) {
    const patterns = this.gamePatterns[level];
    if (!patterns) return [];

    const recommendations = [];

    // Opening recommendations
    if (patterns.strengths.openingKnowledge) {
      recommendations.push({
        type: 'opening',
        title: 'Study Common Openings',
        description: `Focus on the most played openings in ${level} games`,
        data: patterns.strengths.openingKnowledge.slice(0, 3)
      });
    }

    // Tactical recommendations
    if (level === 'beginner') {
      recommendations.push({
        type: 'tactics',
        title: 'Basic Tactics',
        description: 'Practice simple captures and checks',
        data: patterns.strengths.simpleTactics
      });
    } else if (level === 'intermediate') {
      recommendations.push({
        type: 'tactics',
        title: 'Intermediate Tactics',
        description: 'Study tactical combinations and sacrifices',
        data: patterns.strengths.tacticalAwareness
      });
    }

    // Positional recommendations
    if (level === 'master') {
      recommendations.push({
        type: 'strategy',
        title: 'Strategic Planning',
        description: 'Focus on long-term strategic plans',
        data: patterns.strengths.strategicPlanning
      });
    }

    return recommendations;
  }

  // Generate a move suggestion based on skill level
  suggestMove(position, level, moveHistory = []) {
    const chess = new Chess(position);
    const patterns = this.gamePatterns[level];
    
    if (!patterns) {
      return this.getRandomMove(chess);
    }

    // Get legal moves
    const legalMoves = chess.moves();
    if (legalMoves.length === 0) return null;

    // Apply level-specific logic
    switch (level) {
      case 'beginner':
        return this.suggestBeginnerMove(chess, legalMoves, patterns);
      case 'intermediate':
        return this.suggestIntermediateMove(chess, legalMoves, patterns);
      case 'master':
        return this.suggestMasterMove(chess, legalMoves, patterns);
      default:
        return this.getRandomMove(chess);
    }
  }

  // Suggest move for beginner level
  suggestBeginnerMove(chess, legalMoves, patterns) {
    const fen = chess.fen().split(' ')[0];
    
    // Check opening book first
    if (this.openingBook[fen]) {
      const openingMoves = Object.entries(this.openingBook[fen])
        .filter(([move]) => legalMoves.includes(move))
        .sort(([,a], [,b]) => b - a);
      
      if (openingMoves.length > 0) {
        return openingMoves[0][0];
      }
    }
    
    // Look for simple tactical opportunities
    const captures = legalMoves.filter(move => move.includes('x'));
    const checks = legalMoves.filter(move => move.includes('+'));
    
    // Prefer captures that don't lose material
    const goodCaptures = captures.filter(move => {
      const testChess = new Chess(chess.fen());
      const moveObj = testChess.move(move);
      return this.evaluatePosition(testChess) >= -1; // Don't lose more than a pawn
    });
    
    if (goodCaptures.length > 0) {
      return goodCaptures[Math.floor(Math.random() * goodCaptures.length)];
    }
    
    if (checks.length > 0) {
      return checks[Math.floor(Math.random() * checks.length)];
    }
    
    if (captures.length > 0) {
      return captures[Math.floor(Math.random() * captures.length)];
    }
    
    // Play safe moves
    const safeMoves = legalMoves.filter(move => {
      const testChess = new Chess(chess.fen());
      testChess.move(move);
      return !testChess.isCheck();
    });
    
    if (safeMoves.length > 0) {
      return safeMoves[Math.floor(Math.random() * safeMoves.length)];
    }
    
    return legalMoves[Math.floor(Math.random() * legalMoves.length)];
  }

  // Suggest move for intermediate level
  suggestIntermediateMove(chess, legalMoves, patterns) {
    const fen = chess.fen().split(' ')[0];
    
    // Check opening book
    if (this.openingBook[fen]) {
      const openingMoves = Object.entries(this.openingBook[fen])
        .filter(([move]) => legalMoves.includes(move))
        .sort(([,a], [,b]) => b - a);
      
      if (openingMoves.length > 0) {
        return openingMoves[0][0];
      }
    }
    
    // Look for tactical opportunities
    const captures = legalMoves.filter(move => move.includes('x'));
    const checks = legalMoves.filter(move => move.includes('+'));
    
    // Check for tactical patterns
    if (this.tacticalPatterns.forks && this.tacticalPatterns.forks[fen]) {
      const forkMoves = this.tacticalPatterns.forks[fen].filter(move => legalMoves.includes(move));
      if (forkMoves.length > 0) {
        return forkMoves[0];
      }
    }
    
    // Look for good captures
    const goodCaptures = captures.filter(move => {
      const testChess = new Chess(chess.fen());
      const moveObj = testChess.move(move);
      return this.evaluatePosition(testChess) >= -0.5; // Don't lose more than half a pawn
    });
    
    if (goodCaptures.length > 0) {
      return goodCaptures[Math.floor(Math.random() * goodCaptures.length)];
    }
    
    // Look for positional improvements
    const positionalMoves = legalMoves.filter(move => {
      const testChess = new Chess(chess.fen());
      testChess.move(move);
      return this.evaluatePosition(testChess) > this.evaluatePosition(chess);
    });
    
    if (positionalMoves.length > 0) {
      return positionalMoves[Math.floor(Math.random() * positionalMoves.length)];
    }
    
    if (checks.length > 0) {
      return checks[Math.floor(Math.random() * checks.length)];
    }
    
    if (captures.length > 0) {
      return captures[Math.floor(Math.random() * captures.length)];
    }
    
    return legalMoves[Math.floor(Math.random() * legalMoves.length)];
  }

  // Suggest move for master level
  suggestMasterMove(chess, legalMoves, patterns) {
    const fen = chess.fen().split(' ')[0];
    
    // Check opening book
    if (this.openingBook[fen]) {
      const openingMoves = Object.entries(this.openingBook[fen])
        .filter(([move]) => legalMoves.includes(move))
        .sort(([,a], [,b]) => b - a);
      
      if (openingMoves.length > 0) {
        return openingMoves[0][0];
      }
    }
    
    // Look for tactical opportunities
    if (this.tacticalPatterns.forks && this.tacticalPatterns.forks[fen]) {
      const forkMoves = this.tacticalPatterns.forks[fen].filter(move => legalMoves.includes(move));
      if (forkMoves.length > 0) {
        return forkMoves[0];
      }
    }
    
    // Look for checks that lead to advantage
    const checks = legalMoves.filter(move => move.includes('+'));
    const goodChecks = checks.filter(move => {
      const testChess = new Chess(chess.fen());
      testChess.move(move);
      return this.evaluatePosition(testChess) > this.evaluatePosition(chess);
    });
    
    if (goodChecks.length > 0) {
      return goodChecks[Math.floor(Math.random() * goodChecks.length)];
    }
    
    // Look for positional improvements
    const positionalMoves = legalMoves.filter(move => {
      const testChess = new Chess(chess.fen());
      testChess.move(move);
      return this.evaluatePosition(testChess) > this.evaluatePosition(chess);
    });
    
    if (positionalMoves.length > 0) {
      return positionalMoves[Math.floor(Math.random() * positionalMoves.length)];
    }
    
    // Look for captures that maintain advantage
    const captures = legalMoves.filter(move => move.includes('x'));
    const goodCaptures = captures.filter(move => {
      const testChess = new Chess(chess.fen());
      testChess.move(move);
      return this.evaluatePosition(testChess) >= this.evaluatePosition(chess);
    });
    
    if (goodCaptures.length > 0) {
      return goodCaptures[Math.floor(Math.random() * goodCaptures.length)];
    }
    
    // Play solid moves
    const solidMoves = legalMoves.filter(move => {
      const testChess = new Chess(chess.fen());
      testChess.move(move);
      return this.evaluatePosition(testChess) >= this.evaluatePosition(chess) - 0.3;
    });
    
    if (solidMoves.length > 0) {
      return solidMoves[Math.floor(Math.random() * solidMoves.length)];
    }
    
    return legalMoves[Math.floor(Math.random() * legalMoves.length)];
  }

  // Evaluate position (simplified)
  evaluatePosition(chess) {
    const fen = chess.fen();
    let evaluation = 0;
    
    // Count material
    const pieces = fen.split(' ')[0];
    evaluation += (pieces.match(/P/g) || []).length; // Pawns
    evaluation += (pieces.match(/N/g) || []).length * 3; // Knights
    evaluation += (pieces.match(/B/g) || []).length * 3; // Bishops
    evaluation += (pieces.match(/R/g) || []).length * 5; // Rooks
    evaluation += (pieces.match(/Q/g) || []).length * 9; // Queens
    
    // Subtract black pieces
    evaluation -= (pieces.match(/p/g) || []).length; // Pawns
    evaluation -= (pieces.match(/n/g) || []).length * 3; // Knights
    evaluation -= (pieces.match(/b/g) || []).length * 3; // Bishops
    evaluation -= (pieces.match(/r/g) || []).length * 5; // Rooks
    evaluation -= (pieces.match(/q/g) || []).length * 9; // Queens
    
    // Add positional bonuses
    if (chess.isCheck()) {
      evaluation += chess.turn() === 'w' ? -0.5 : 0.5; // Being in check is bad
    }
    
    // Center control bonus
    const centerSquares = ['e4', 'e5', 'd4', 'd5'];
    centerSquares.forEach(square => {
      const piece = chess.get(square);
      if (piece) {
        evaluation += piece.color === 'w' ? 0.1 : -0.1;
      }
    });
    
    return evaluation;
  }

  // Get random move
  getRandomMove(chess) {
    const moves = chess.moves();
    return moves[Math.floor(Math.random() * moves.length)];
  }

  // Get patterns for a specific level
  getPatterns(level) {
    return this.gamePatterns[level] || null;
  }

  // Get all patterns
  getAllPatterns() {
    return this.gamePatterns;
  }
}

module.exports = new TrainingService();
