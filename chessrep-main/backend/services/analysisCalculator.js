const GameAnalysis = require('../models/GameAnalysis');

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

class AnalysisCalculator {
  /**
   * Derive counts using ONLY the searched player's moves
   */
  computePlayerMoveStats(games, analyses) {
    const stats = { totalMoves: 0, totalBest: 0, totalExcellent: 0, totalGreat: 0, totalGood: 0, totalInaccuracy: 0, totalMistake: 0, totalBlunder: 0, totalMiss: 0, totalCpLoss: 0 };
    const findAnalysis = (gameId) => analyses.find(a => a.game.toString() === gameId.toString());
    
    // Standard chess analysis thresholds (based on Lichess/Chess.com standards)
    // These thresholds are for centipawn LOSS (negative values indicate worse moves)
    const TH_BEST = 10;        // Loss of 0-10cp = Best/Excellent move
    const TH_GOOD = 25;        // Loss of 11-25cp = Good move  
    const TH_INACCURACY = 50;  // Loss of 26-50cp = Inaccuracy
    const TH_MISTAKE = 100;    // Loss of 51-100cp = Mistake
    // Loss of 101+cp = Blunder (no upper threshold needed)

    for (const game of games) {
      const ga = findAnalysis(game._id);
      if (!ga || !ga.moves || ga.moves.length < 2) continue;
      const playerIsWhite = game.whiteUsername?.toLowerCase?.() === game.searchedUsername?.toLowerCase?.();
      for (let i = 1; i < ga.moves.length; i++) {
        const isPlayersPly = (playerIsWhite ? (i % 2 === 0) : (i % 2 === 1));
        if (!isPlayersPly) continue;
        // Use stored before/after if available for precision
        const after = ga.moves[i]?.cp;
        const before = ga.moves[i]?.bestCp ?? ga.moves[i - 1]?.cp;
        if (typeof before !== 'number' || typeof after !== 'number') continue;
        // Skip opening book moves (first 6 moves each side = 12 plies)
        if (i <= 12) continue;
        
        // Skip positions that are already completely winning/losing (>5 pawns advantage)
        if (Math.abs(before) >= 500) {
          stats.totalMoves++;
          continue;
        }
        
        // Calculate centipawn LOSS for this move (only positive losses count)
        // For white: loss = before - after (positive = position got worse)
        // For black: loss = after - before (positive = position got worse) 
        const cpLoss = playerIsWhite ? Math.max(0, before - after) : Math.max(0, after - before);
        
        stats.totalMoves++;
        
        // Debug logging for first few moves to understand the data
        if (stats.totalMoves <= 5) {
          console.log(`[DEBUG] Move ${stats.totalMoves}: before=${before}, after=${after}, playerIsWhite=${playerIsWhite}, cpLoss=${cpLoss}`);
        }
        
        // Classify move based on centipawn loss (standard thresholds)
        // Lichess-style negative thresholds
        if (cpLoss >= 300) {
          stats.totalBlunder++;
        } else if (cpLoss >= TH_MISTAKE) {
          stats.totalMistake++;
        } else if (cpLoss >= TH_INACCURACY) {
          stats.totalInaccuracy++;
        } else {
          // Positive buckets
          if (cpLoss <= 10) stats.totalBest++;
          else if (cpLoss <= 20) stats.totalExcellent++;
          else if (cpLoss <= 30) stats.totalGreat++;
          else stats.totalGood++;
        }

        stats.totalCpLoss += cpLoss;
      }
    }
    return stats;
  }
  /**
   * Calculate comprehensive analysis for a set of games
   */
  async calculateAnalysis(games, analyses) {
    const summary = this.calculateMoveSummary(games, analyses);
    const metrics = await this.calculateMetrics(games, analyses);
    const scouting = this.calculateScoutingReport(games, analyses);
    
    return { summary, metrics, scouting };
  }

  /**
   * Calculate move quality summary
   */
  calculateMoveSummary(games, analyses) {
    const stats = this.computePlayerMoveStats(games, analyses);
    return {
      best: stats.totalBest,
      excellent: stats.totalExcellent,
      great: stats.totalGreat,
      good: stats.totalGood,
      inaccuracy: stats.totalInaccuracy,
      mistake: stats.totalMistake,
      blunder: stats.totalBlunder,
      miss: stats.totalMiss,
      total: stats.totalMoves
    };
  }

  /**
   * Calculate comprehensive performance metrics
   */
  async calculateMetrics(games, analyses) {
    const metrics = {
      openingScoreCp: 0,
      tacticsBlundersPerGame: 0,
      endgameCpLossPerMove: 0,
      advantageCapitalization: 0,
      resourcefulness: 0,
      acpl: 0,
      accuracyPercent: 0
    };

    const isPlayerWhite = (game) => game.whiteUsername?.toLowerCase?.() === game.searchedUsername?.toLowerCase?.();

    // Opening score at move 12 (24 ply), oriented to player's perspective
    let openingScoreSum = 0;
    let openingScoreCount = 0;
    for (let i = 0; i < games.length; i++) {
      const game = games[i];
      const ga = analyses.find(a => a.game.toString() === game._id.toString());
      if (!ga || !ga.moves || ga.moves.length <= 24) continue;
      const cpAt12 = ga.moves[24]?.cp ?? 0;
      const oriented = isPlayerWhite(game) ? cpAt12 : -cpAt12;
      openingScoreSum += oriented;
      openingScoreCount++;
    }
    metrics.openingScoreCp = openingScoreCount > 0 ? openingScoreSum / openingScoreCount : 0;

    // Blunders per game from player's moves only
    {
      const { totalBlunder } = this.computePlayerMoveStats(games, analyses);
      metrics.tacticsBlundersPerGame = games.length > 0 ? totalBlunder / games.length : 0;
    }

    // ACPL (Average Centipawn Loss) - only count losses, not gains
    let totalLoss = 0;
    let totalMovesCount = 0;
    let endgameLossSum = 0;
    let endgameMoveCount = 0;
    
    for (let i = 0; i < games.length; i++) {
      const game = games[i];
      const ga = analyses.find(a => a.game.toString() === game._id.toString());
      if (!ga || !ga.moves || ga.moves.length < 2) continue;
      const playerWhite = isPlayerWhite(game);
      
      for (let ply = 1; ply < ga.moves.length; ply++) {
        const after = ga.moves[ply]?.cp;
        const before = ga.moves[ply]?.bestCp ?? ga.moves[ply - 1]?.cp;
        if (typeof after !== 'number' || typeof before !== 'number') continue;
        
        const moverIsWhite = (ply % 2 === 1);
        if (moverIsWhite === playerWhite) {
          // Skip opening book moves (first 6 moves each side)
          if (ply <= 12) continue;
          
          // Skip extreme positions (>5 pawns advantage)  
          if (Math.abs(before) >= 500) continue;
          
          // Calculate centipawn loss (only count when position gets worse)
          const cpLoss = playerWhite ? Math.max(0, before - after) : Math.max(0, after - before);
          
          totalLoss += cpLoss;
          totalMovesCount++;
          
          if (ply >= 60) {
            endgameLossSum += cpLoss;
            endgameMoveCount++;
          }
        }
      }
    }
    
    metrics.acpl = totalMovesCount > 0 ? totalLoss / totalMovesCount / 100 : 0; // Convert to pawns
    metrics.endgameCpLossPerMove = endgameMoveCount > 0 ? endgameLossSum / endgameMoveCount / 100 : 0; // Convert to pawns

    // Advantage / resourcefulness
    metrics.advantageCapitalization = this.calculateAdvantageCapitalization(games, analyses);
    metrics.resourcefulness = this.calculateResourcefulness(games, analyses);

    // Approximate Accuracy score similar to CAPS: 100 - scaled cp loss per move
    // Simple heuristic: accuracy = 100 - (ACPL in centipawns) with soft cap
    const acplCp = metrics.acpl * 100; // back to centipawns
    metrics.accuracyPercent = Math.max(0, Math.min(100, 100 - acplCp));

    return metrics;
  }

  /**
   * Calculate advantage capitalization percentage
   * When player gets advantage >= 1.0, how often do they win?
   */
  calculateAdvantageCapitalization(games, analyses) {
    let gamesWithAdvantage = 0;
    let winsWithAdvantage = 0;

    for (let i = 0; i < games.length; i++) {
      const game = games[i];
      const analysis = analyses.find(a => a.game.toString() === game._id.toString());
      
      if (!analysis || !analysis.moves) continue;

      // Check if player had advantage >= 1.0 at any point
      let hadAdvantage = false;
      let isWin = false;

      // Determine if this is a win for the player
      const playerIsWhite = game.whiteUsername?.toLowerCase() === game.searchedUsername?.toLowerCase();
      if (playerIsWhite && game.result === '1-0') isWin = true;
      if (!playerIsWhite && game.result === '0-1') isWin = true;

      // Check for advantage in moves
      for (const move of analysis.moves) {
        if (move && typeof move.cp === 'number') {
          const advantage = playerIsWhite ? move.cp : -move.cp;
          if (advantage >= 100) { // 1.0 = 100 centipawns
            hadAdvantage = true;
            break;
          }
        }
      }

      if (hadAdvantage) {
        gamesWithAdvantage++;
        if (isWin) winsWithAdvantage++;
      }
    }

    return gamesWithAdvantage > 0 ? (winsWithAdvantage / gamesWithAdvantage) * 100 : 0;
  }

  /**
   * Calculate resourcefulness percentage
   * When player is in bad position <= -1.0, how often do they still win/draw?
   */
  calculateResourcefulness(games, analyses) {
    let gamesWithDisadvantage = 0;
    let winsOrDrawsWithDisadvantage = 0;

    for (let i = 0; i < games.length; i++) {
      const game = games[i];
      const analysis = analyses.find(a => a.game.toString() === game._id.toString());
      
      if (!analysis || !analysis.moves) continue;

      // Check if player had disadvantage <= -1.0 at any point
      let hadDisadvantage = false;
      let isWinOrDraw = false;

      // Determine if this is a win or draw for the player
      const playerIsWhite = game.whiteUsername?.toLowerCase() === game.searchedUsername?.toLowerCase();
      if (playerIsWhite && (game.result === '1-0' || game.result === '1/2-1/2')) isWinOrDraw = true;
      if (!playerIsWhite && (game.result === '0-1' || game.result === '1/2-1/2')) isWinOrDraw = true;

      // Check for disadvantage in moves
      for (const move of analysis.moves) {
        if (move && typeof move.cp === 'number') {
          const advantage = playerIsWhite ? move.cp : -move.cp;
          if (advantage <= -100) { // -1.0 = -100 centipawns
            hadDisadvantage = true;
            break;
          }
        }
      }

      if (hadDisadvantage) {
        gamesWithDisadvantage++;
        if (isWinOrDraw) winsOrDrawsWithDisadvantage++;
      }
    }

    return gamesWithDisadvantage > 0 ? (winsOrDrawsWithDisadvantage / gamesWithDisadvantage) * 100 : 0;
  }

  /**
   * Calculate scouting report with insights
   */
  calculateScoutingReport(games, analyses) {
    const scouting = {
      bestMoveRate: 0,
      blundersPer100: 0,
      blundersPerGame: 0,
      acpl: 0,
      openingScore: 0,
      endgameLossPerMove: 0,
      advantageCapitalization: 0,
      resourcefulness: 0,
      strengths: [],
      focus: [],
      bestOpening: null,
      worstOpening: null,
      openings: []
    };

    // Calculate basic metrics using player's moves only
    {
      const { totalMoves, totalBest, totalBlunder } = this.computePlayerMoveStats(games, analyses);
      scouting.bestMoveRate = totalMoves > 0 ? (totalBest / totalMoves) * 100 : 0;
      scouting.blundersPer100 = totalMoves > 0 ? (totalBlunder / totalMoves) * 100 : 0;
      scouting.blundersPerGame = games.length > 0 ? totalBlunder / games.length : 0;
    }

    // ACPL using player's move deltas
    const isPlayerWhite = (g) => g.whiteUsername?.toLowerCase?.() === g.searchedUsername?.toLowerCase?.();
    let totalLossAbs = 0;
    let totalMovesCount = 0;
    for (let i = 0; i < games.length; i++) {
      const game = games[i];
      const ga = analyses.find(a => a.game.toString() === game._id.toString());
      if (!ga || !ga.moves || ga.moves.length < 2) continue;
      const playerWhite = isPlayerWhite(game);
      for (let ply = 1; ply < ga.moves.length; ply++) {
        const after = ga.moves[ply]?.cp;
        const before = ga.moves[ply - 1]?.cp;
        if (typeof after !== 'number' || typeof before !== 'number') continue;
        const moverIsWhite = (ply % 2 === 1);
        if (moverIsWhite === playerWhite) {
          const delta = (after - before) * (playerWhite ? 1 : -1);
          totalLossAbs += Math.abs(delta);
          totalMovesCount++;
        }
      }
    }
    scouting.acpl = totalMovesCount > 0 ? (totalLossAbs / totalMovesCount) / 100 : 0; // pawns

    // Opening and endgame metrics
    scouting.openingScore = this.calculateOpeningScore(analyses, games);
    scouting.endgameLossPerMove = this.calculateEndgameLoss(analyses);

    // Advanced metrics
    scouting.advantageCapitalization = this.calculateAdvantageCapitalization(games, analyses);
    scouting.resourcefulness = this.calculateResourcefulness(games, analyses);

    // Insights
    scouting.strengths = this.generateStrengths(scouting);
    scouting.focus = this.generateFocusAreas(scouting);

    // Opening performance with links
    const openingStats = this.calculateOpeningPerformance(games, analyses);
    scouting.bestOpening = openingStats.best;
    scouting.worstOpening = openingStats.worst;
    scouting.openings = openingStats.all;

    return scouting;
  }

  /**
   * Calculate average opening score
   */
  calculateOpeningScore(analyses, games) {
    let sum = 0;
    let count = 0;
    for (const ga of analyses) {
      const game = games?.find(g => g._id.toString() === ga.game.toString());
      if (ga.moves && ga.moves.length > 24) { // After move 12
        const cp = ga.moves[24]?.cp || 0;
        const oriented = game ? ((game.whiteUsername?.toLowerCase?.() === game.searchedUsername?.toLowerCase?.()) ? cp : -cp) : cp;
        sum += oriented / 100; // pawns
        count++;
      }
    }
    return count > 0 ? sum / count : 0; // pawns
  }

  /**
   * Calculate endgame loss per move
   */
  calculateEndgameLoss(analyses) {
    let endgameLossSum = 0;
    let endgameMoveCount = 0;
    
    for (const ga of analyses) {
      if (ga.moves && ga.moves.length > 60) { // After move 30
        for (let i = 60; i < ga.moves.length; i++) {
          const move = ga.moves[i];
          if (move && typeof move.cp === 'number') {
            endgameLossSum += Math.abs(move.cp) / 100; // pawns
            endgameMoveCount++;
          }
        }
      }
    }
    
    return endgameMoveCount > 0 ? endgameLossSum / endgameMoveCount : 0; // pawns per move
  }

  /**
   * Calculate opening performance
   */
  calculateOpeningPerformance(games, analyses) {
    const openingStats = {};

    const parseOpeningFromPgn = (pgn) => {
      if (!pgn) return { name: 'Unknown', eco: null };
      const eco = (pgn.match(/\[ECO\s+"([A-E]\d{2})"\]/) || [])[1] || null;
      const name = (pgn.match(/\[Opening\s+"([^"]+)"\]/) || [])[1] || (eco ? getOpeningName(eco) : 'Unknown');
      return { name, eco };
    };

    const isPlayerWhite = (game) => game.whiteUsername?.toLowerCase?.() === game.searchedUsername?.toLowerCase?.();

    for (let i = 0; i < games.length; i++) {
      const game = games[i];
      const analysis = analyses.find(a => a.game.toString() === game._id.toString());
      
      if (!analysis || !analysis.moves || analysis.moves.length <= 24) continue;
      
      const { name, eco } = parseOpeningFromPgn(game.pgn);
      const cpAt12 = analysis.moves[24]?.cp || 0; // after move 12 (cp)
      const oriented = isPlayerWhite(game) ? cpAt12 : -cpAt12;
      // Score% from player's POV
      let score = 0;
      if ((isPlayerWhite(game) && game.result === '1-0') || (!isPlayerWhite(game) && game.result === '0-1')) score = 100;
      else if (game.result === '1/2-1/2') score = 50;
      
      const key = `${eco || 'NA'}|${name}`;
      if (!openingStats[key]) {
        openingStats[key] = { name, eco, totalCp: 0, totalScorePct: 0, count: 0, links: [] };
      }
      openingStats[key].totalCp += oriented;
      openingStats[key].totalScorePct += score;
      openingStats[key].count++;
      if (game.gameUrl) openingStats[key].links.push(game.gameUrl);
    }

    const list = Object.values(openingStats).map(s => ({
      name: s.name,
      eco: s.eco,
      avgCpAfter12: s.count > 0 ? (s.totalCp / s.count) / 100 : 0, // pawns
      scorePct: s.count > 0 ? (s.totalScorePct / s.count) : 0,
      games: s.count,
      links: s.links.slice(0, 10)
    })).sort((a, b) => b.games - a.games);

    let bestOpening = null;
    let worstOpening = null;
    for (const item of list) {
      if (item.games < 1) continue;
      if (!bestOpening || item.avgCpAfter12 > bestOpening.avgCpAfter12) bestOpening = item;
      if (!worstOpening || item.avgCpAfter12 < worstOpening.avgCpAfter12) worstOpening = item;
    }

    return { best: bestOpening, worst: worstOpening, all: list };
  }

  /**
   * Generate strengths based on metrics
   */
  generateStrengths(scouting) {
    const strengths = [];
    
    if (scouting.bestMoveRate >= 60) {
      strengths.push("Strong tactical accuracy with high best move rate");
    }
    
    if (scouting.blundersPer100 <= 2) {
      strengths.push("Excellent blunder prevention");
    }
    
    if (scouting.openingScore >= 50) {
      strengths.push("Strong opening play with positive average score");
    }
    
    if (scouting.advantageCapitalization >= 70) {
      strengths.push("Excellent at converting advantages into wins");
    }
    
    if (scouting.resourcefulness >= 40) {
      strengths.push("Good defensive skills when in difficult positions");
    }
    
    if (scouting.acpl <= 50) {
      strengths.push("Low average centipawn loss indicates consistent play");
    }

    return strengths.length > 0 ? strengths : ["Consistent performance across all areas"];
  }

  /**
   * Generate focus areas based on metrics
   */
  generateFocusAreas(scouting) {
    const focus = [];
    
    if (scouting.bestMoveRate < 40) {
      focus.push("Improve tactical accuracy - practice calculation and visualization");
    }
    
    if (scouting.blundersPer100 > 5) {
      focus.push("Reduce blunders - focus on double-checking moves before playing");
    }
    
    if (scouting.openingScore < -50) {
      focus.push("Study openings more - your opening play is giving away advantage");
    }
    
    if (scouting.advantageCapitalization < 50) {
      focus.push("Practice converting advantages - work on technique when ahead");
    }
    
    if (scouting.resourcefulness < 20) {
      focus.push("Improve defensive play - learn to fight back when in bad positions");
    }
    
    if (scouting.endgameLossPerMove > 100) {
      focus.push("Study endgames - significant losses are occurring in endgame play");
    }

    return focus.length > 0 ? focus : ["Continue current training routine - performance is solid"];
  }
}

module.exports = new AnalysisCalculator();
