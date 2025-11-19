// Lichess Opening Explorer API Service
// Provides access to Lichess opening data from player and master databases

export interface LichessOpeningMove {
  uci: string;
  san: string;
  white: number;
  draws: number;
  black: number;
  averageRating: number;
  game?: {
    id: string;
    winner: 'white' | 'black' | null;
    white: {
      name: string;
      rating: number;
    };
    black: {
      name: string;
      rating: number;
    };
    year: number;
    month: string;
  };
}

export interface LichessOpeningResponse {
  white: number;
  draws: number;
  black: number;
  moves: LichessOpeningMove[];
  topGames: Array<{
    uci: string;
    id: string;
    winner: 'white' | 'black' | null;
    white: {
      name: string;
      rating: number;
    };
    black: {
      name: string;
      rating: number;
    };
    year: number;
    month: string;
  }>;
  recentGames: Array<{
    uci: string;
    id: string;
    winner: 'white' | 'black' | null;
    white: {
      name: string;
      rating: number;
    };
    black: {
      name: string;
      rating: number;
    };
    year: number;
    month: string;
  }>;
  opening?: {
    eco: string;
    name: string;
  };
}

export type DatabaseType = 'lichess' | 'masters' | 'player';

export interface LichessOpeningOptions {
  database: DatabaseType;
  player?: string; // Required for player database
  topGames?: number; // Number of top games to fetch (default: 4)
  recentGames?: number; // Number of recent games to fetch (default: 4)
  moves?: number; // Number of moves to fetch (default: 12)
  ratings?: string; // Rating range, e.g., "2000,2200"
  speeds?: string; // Time controls, e.g., "blitz,rapid,classical"
  since?: string; // Date in YYYY-MM format
  until?: string; // Date in YYYY-MM format
}

export class LichessOpeningService {
  private static instance: LichessOpeningService;
  private readonly baseUrl = 'https://explorer.lichess.ovh';
  private cache = new Map<string, { data: LichessOpeningResponse; timestamp: number }>();
  private readonly cacheTimeout = 5 * 60 * 1000; // 5 minutes

  public static getInstance(): LichessOpeningService {
    if (!LichessOpeningService.instance) {
      LichessOpeningService.instance = new LichessOpeningService();
    }
    return LichessOpeningService.instance;
  }

  /**
   * Get opening data from Lichess API
   */
  public async getOpeningData(
    fen: string, 
    options: LichessOpeningOptions
  ): Promise<LichessOpeningResponse> {
    const cacheKey = this.getCacheKey(fen, options);
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    try {
      const url = this.buildUrl(fen, options);
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: LichessOpeningResponse = await response.json();
      
      // Cache the result
      this.cache.set(cacheKey, { data, timestamp: Date.now() });
      
      return data;
    } catch (error) {
      console.error('Failed to fetch Lichess opening data:', error);
      throw error;
    }
  }

  /**
   * Get opening moves for a position
   */
  public async getOpeningMoves(
    fen: string, 
    options: LichessOpeningOptions
  ): Promise<LichessOpeningMove[]> {
    const data = await this.getOpeningData(fen, options);
    return data.moves || [];
  }

  /**
   * Get opening statistics for a position
   */
  public async getOpeningStats(
    fen: string, 
    options: LichessOpeningOptions
  ): Promise<{
    totalGames: number;
    whiteWins: number;
    draws: number;
    blackWins: number;
    averageRating: number;
    mostPopularMove: string;
    opening?: { eco: string; name: string };
  }> {
    const data = await this.getOpeningData(fen, options);
    
    const totalGames = data.white + data.draws + data.black;
    const averageRating = data.moves.length > 0 
      ? Math.round(data.moves.reduce((sum, move) => sum + move.averageRating, 0) / data.moves.length)
      : 0;
    const mostPopularMove = data.moves.length > 0 ? data.moves[0].san : '';

    return {
      totalGames,
      whiteWins: data.white,
      draws: data.draws,
      blackWins: data.black,
      averageRating,
      mostPopularMove,
      opening: data.opening
    };
  }

  /**
   * Get top games for a position
   */
  public async getTopGames(
    fen: string, 
    options: LichessOpeningOptions
  ): Promise<LichessOpeningResponse['topGames']> {
    const data = await this.getOpeningData(fen, options);
    return data.topGames || [];
  }

  /**
   * Get recent games for a position
   */
  public async getRecentGames(
    fen: string, 
    options: LichessOpeningOptions
  ): Promise<LichessOpeningResponse['recentGames']> {
    const data = await this.getOpeningData(fen, options);
    return data.recentGames || [];
  }

  /**
   * Search for opening by ECO code
   */
  public async searchByEco(eco: string, options: Omit<LichessOpeningOptions, 'database'>): Promise<LichessOpeningResponse[]> {
    // This would require a different approach as Lichess API doesn't directly support ECO search
    // You might need to maintain a mapping of ECO codes to FEN positions
    throw new Error('ECO search not directly supported by Lichess API');
  }

  /**
   * Clear cache
   */
  public clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  public getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }

  /**
   * Build API URL
   */
  private buildUrl(fen: string, options: LichessOpeningOptions): string {
    const encodedFen = encodeURIComponent(fen);
    const params = new URLSearchParams();

    // Add common parameters
    if (options.topGames) params.append('topGames', options.topGames.toString());
    if (options.recentGames) params.append('recentGames', options.recentGames.toString());
    if (options.moves) params.append('moves', options.moves.toString());
    if (options.ratings) params.append('ratings', options.ratings);
    if (options.speeds) params.append('speeds', options.speeds);
    if (options.since) params.append('since', options.since);
    if (options.until) params.append('until', options.until);

    // Build URL based on database type
    let baseUrl: string;
    switch (options.database) {
      case 'masters':
        baseUrl = `${this.baseUrl}/master`;
        break;
      case 'player':
        if (!options.player) {
          throw new Error('Player name is required for player database');
        }
        baseUrl = `${this.baseUrl}/player/${encodeURIComponent(options.player)}`;
        break;
      case 'lichess':
      default:
        baseUrl = `${this.baseUrl}/lichess`;
        break;
    }

    const queryString = params.toString();
    return queryString ? `${baseUrl}?fen=${encodedFen}&${queryString}` : `${baseUrl}?fen=${encodedFen}`;
  }

  /**
   * Generate cache key
   */
  private getCacheKey(fen: string, options: LichessOpeningOptions): string {
    return `${options.database}:${fen}:${JSON.stringify(options)}`;
  }

  /**
   * Convert Lichess move format to our internal format
   */
  public convertToInternalFormat(lichessMove: LichessOpeningMove, fen: string): {
    san: string;
    uci: string;
    from: string;
    to: string;
    frequency: number;
    whiteWins: number;
    draws: number;
    blackWins: number;
    totalGames: number;
    averageRating: number;
    winRate: {
      white: number;
      draws: number;
      black: number;
    };
  } {
    const totalGames = lichessMove.white + lichessMove.draws + lichessMove.black;
    const frequency = totalGames > 0 ? (totalGames / (lichessMove.white + lichessMove.draws + lichessMove.black)) * 100 : 0;
    
    // Extract from/to from UCI notation
    const from = lichessMove.uci.substring(0, 2);
    const to = lichessMove.uci.substring(2, 4);

    return {
      san: lichessMove.san,
      uci: lichessMove.uci,
      from,
      to,
      frequency,
      whiteWins: lichessMove.white,
      draws: lichessMove.draws,
      blackWins: lichessMove.black,
      totalGames,
      averageRating: lichessMove.averageRating,
      winRate: {
        white: totalGames > 0 ? (lichessMove.white / totalGames) * 100 : 0,
        draws: totalGames > 0 ? (lichessMove.draws / totalGames) * 100 : 0,
        black: totalGames > 0 ? (lichessMove.black / totalGames) * 100 : 0,
      }
    };
  }
}

export const lichessOpeningService = LichessOpeningService.getInstance();
