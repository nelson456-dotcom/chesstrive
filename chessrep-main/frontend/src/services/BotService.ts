import stockfishCloudService from './StockfishCloudService';
import { AnalysisConfig } from '../types/chess';
import { Chess } from 'chess.js';

export interface BotConfig {
  id: string;
  name: string;
  elo: number;
  description: string;
  personality: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  depth: number;
  timeLimit: number;
  errorRate: number; // Probability of making a suboptimal move (0-1)
}

export class BotService {
  private static instance: BotService;

  constructor() {
    // Using cloud service, no need to instantiate
  }

  static getInstance(): BotService {
    if (!BotService.instance) {
      BotService.instance = new BotService();
    }
    return BotService.instance;
  }

  // Predefined bot configurations
  getBotConfigs(): BotConfig[] {
    return [
      {
        id: 'rookie',
        name: 'Rookie Rob',
        elo: 800,
        description: 'Just learning the ropes',
        personality: 'beginner',
        depth: 3,
        timeLimit: 500,
        errorRate: 0.4
      },
      {
        id: 'casual',
        name: 'Casual Carl',
        elo: 1000,
        description: 'Plays for fun',
        personality: 'beginner',
        depth: 5,
        timeLimit: 1000,
        errorRate: 0.3
      },
      {
        id: 'student',
        name: 'Student Sarah',
        elo: 1200,
        description: 'Studying openings',
        personality: 'intermediate',
        depth: 8,
        timeLimit: 1500,
        errorRate: 0.2
      },
      {
        id: 'club',
        name: 'Club Player Chris',
        elo: 1400,
        description: 'Regular at the chess club',
        personality: 'intermediate',
        depth: 10,
        timeLimit: 2000,
        errorRate: 0.15
      },
      {
        id: 'tournament',
        name: 'Tournament Tom',
        elo: 1600,
        description: 'Competitive player',
        personality: 'advanced',
        depth: 12,
        timeLimit: 3000,
        errorRate: 0.1
      },
      {
        id: 'expert',
        name: 'Expert Emma',
        elo: 1800,
        description: 'Knows all the tricks',
        personality: 'advanced',
        depth: 15,
        timeLimit: 4000,
        errorRate: 0.05
      },
      {
        id: 'master',
        name: 'Master Mike',
        elo: 2000,
        description: 'Chess master',
        personality: 'expert',
        depth: 18,
        timeLimit: 5000,
        errorRate: 0.02
      },
      {
        id: 'grandmaster',
        name: 'Grandmaster Gary',
        elo: 2200,
        description: 'Elite player',
        personality: 'expert',
        depth: 20,
        timeLimit: 8000,
        errorRate: 0.01
      }
    ];
  }

  async getBotMove(fen: string, botConfig: BotConfig): Promise<string | null> {
    try {
      // Wait for Stockfish to be ready
      if (!stockfishCloudService.isEngineReady()) {
        await this.waitForEngine();
      }

      const analysisConfig: Partial<AnalysisConfig> = {
        depth: botConfig.depth,
        timeLimit: botConfig.timeLimit,
        multiPV: 3 // Get multiple moves to choose from
      };

      // Get multiple moves from Stockfish
      const moves = await stockfishCloudService.analyzePosition(fen, analysisConfig);
      
      if (moves.length === 0) {
        // Fallback to random legal move
        return this.getRandomLegalMove(fen);
      }

      // Introduce errors based on bot difficulty
      const shouldMakeError = Math.random() < botConfig.errorRate;
      
      if (shouldMakeError && moves.length > 1) {
        // Choose a suboptimal move (not the best one)
        const randomIndex = Math.floor(Math.random() * Math.min(moves.length - 1, 3)) + 1;
        return moves[randomIndex]?.move || moves[0].move;
      }

      // Return the best move
      return moves[0].move;
    } catch (error) {
      console.error('Bot move calculation failed:', error);
      // Fallback to random legal move
      return this.getRandomLegalMove(fen);
    }
  }

  private async waitForEngine(maxWait: number = 5000): Promise<void> {
    const startTime = Date.now();
    
    while (!stockfishCloudService.isEngineReady() && (Date.now() - startTime) < maxWait) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    if (!stockfishCloudService.isEngineReady()) {
      throw new Error('Stockfish engine failed to initialize');
    }
  }

  private getRandomLegalMove(fen: string): string | null {
    try {
      const chess = new Chess(fen);
      const moves = chess.moves({ verbose: true });
      
      if (moves.length === 0) {
        return null;
      }
      
      const randomMove = moves[Math.floor(Math.random() * moves.length)];
      return randomMove.lan; // Return in long algebraic notation
    } catch (error) {
      console.error('Failed to get random legal move:', error);
      return null;
    }
  }

  async stopAnalysis(): Promise<void> {
    await stockfishCloudService.stopAnalysis();
  }

  async quit(): Promise<void> {
    await stockfishCloudService.quit();
  }
}

// Export singleton instance
export const botService = BotService.getInstance();











