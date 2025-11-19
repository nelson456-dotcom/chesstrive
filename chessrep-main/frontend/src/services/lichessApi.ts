// Lichess Cloud Analysis API Service
// Documentation: https://lichess-org.github.io/api/

export interface LichessCloudEvalResponse {
  fen: string;
  knodes: number;
  depth: number;
  pvs: Array<{
    moves: string;
    cp?: number;
    mate?: number;
    nodes: number;
  }>;
  bestmove?: string;
  wdl?: {
    win: number;
    draw: number;
    loss: number;
  };
  error?: string;
}

export interface LichessAnalysisResult {
  bestMove: string;
  evaluation: {
    type: 'cp' | 'mate';
    value: number;
  };
  depth: number;
  knodes: number;
  pvs: Array<{
    moves: string;
    evaluation: {
      type: 'cp' | 'mate';
      value: number;
    };
    nodes: number;
  }>;
  wdl?: {
    win: number;
    draw: number;
    loss: number;
  };
}

class LichessApiService {
  private baseUrl = 'https://lichess.org/api';
  private apiKey: string | null = null;

  constructor() {
    // You can set an API key if needed, but the cloud eval endpoint is public
    this.apiKey = null;
  }

  /**
   * Validate and normalize FEN string
   */
  private validateAndNormalizeFen(fen: string): string {
    if (!fen || typeof fen !== 'string') {
      throw new Error('Invalid FEN: must be a non-empty string');
    }

    // Clean up the FEN string
    let cleanFen = fen.trim();
    
    // Replace underscores with spaces (common encoding issue)
    cleanFen = cleanFen.replace(/_/g, ' ');
    
    // Remove trailing periods (common issue from PGN parsing)
    cleanFen = cleanFen.replace(/\.+$/, '');
    
    // Remove periods that appear after the last space (move number with period)
    cleanFen = cleanFen.replace(/(\s+\d+)\.+$/, '$1');
    
    // Basic FEN validation - should have 6 parts separated by spaces
    const fenParts = cleanFen.split(' ');
    if (fenParts.length !== 6) {
      console.warn('LichessApiService: FEN has unexpected format:', cleanFen);
      // Try to fix common issues
      if (fenParts.length === 1) {
        // If it's just the board position, add default values
        cleanFen = `${cleanFen} w - - 0 1`;
      } else if (fenParts.length > 6) {
        // If there are extra parts, take only the first 6
        cleanFen = fenParts.slice(0, 6).join(' ');
      }
    }

    // Validate that it's a reasonable FEN
    const boardPart = cleanFen.split(' ')[0];
    if (!boardPart || boardPart.length < 20) {
      throw new Error('Invalid FEN: board position too short');
    }

    // Validate move number is numeric
    const finalFenParts = cleanFen.split(' ');
    const moveNumber = finalFenParts[5];
    if (moveNumber && isNaN(parseInt(moveNumber))) {
      console.warn('LichessApiService: Invalid move number, using 1:', moveNumber);
      cleanFen = cleanFen.replace(/\s+\d+$/, ' 1');
    }

    console.log('LichessApiService: Original FEN:', fen);
    console.log('LichessApiService: Normalized FEN:', cleanFen);
    console.log('LichessApiService: FEN parts:', cleanFen.split(' '));
    return cleanFen;
  }

  /**
   * Analyze a chess position using Lichess Cloud Analysis API
   * @param fen - The FEN string of the position to analyze
   * @param multiPv - Number of best moves to return (1-5, default: 1)
   * @returns Promise<LichessAnalysisResult>
   */
  async analyzePosition(fen: string, multiPv: number = 3): Promise<LichessAnalysisResult> {
    try {
      console.log('LichessApiService: Analyzing position:', fen);
      
      // Validate and normalize the FEN
      const normalizedFen = this.validateAndNormalizeFen(fen);
      
      // Log the transformation for debugging
      if (fen !== normalizedFen) {
        console.log('LichessApiService: FEN normalized from:', fen);
        console.log('LichessApiService: FEN normalized to:', normalizedFen);
      }
      
      const url = `${this.baseUrl}/cloud-eval`;
      const params = new URLSearchParams({
        fen: normalizedFen,
        multiPv: multiPv.toString()
      });

      console.log('LichessApiService: Request URL:', `${url}?${params}`);

      const response = await fetch(`${url}?${params}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'ChessRep/1.0'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('LichessApiService: API Error Response:', errorText);
        console.error('LichessApiService: Response status:', response.status);
        console.error('LichessApiService: Response statusText:', response.statusText);
        console.error('LichessApiService: Normalized FEN used in request:', normalizedFen);
        throw new Error(`Lichess API error: ${response.status} ${response.statusText}. FEN: ${normalizedFen}`);
      }

      const data: LichessCloudEvalResponse = await response.json();
      console.log('LichessApiService: Received analysis:', data);

      // Check if the response contains an error message
      if (data.error) {
        console.error('LichessApiService: API returned error:', data.error);
        throw new Error(`Lichess API error: ${data.error}. FEN: ${normalizedFen}`);
      }

      return this.parseAnalysisResult(data);
    } catch (error) {
      console.error('LichessApiService: Error analyzing position:', error);
      throw error;
    }
  }

  /**
   * Parse the Lichess API response into our standardized format
   */
  private parseAnalysisResult(data: LichessCloudEvalResponse): LichessAnalysisResult {
    const bestPv = data.pvs[0];
    if (!bestPv) {
      throw new Error('No analysis data received from Lichess');
    }

    // Parse the best move (first move in the PV)
    const bestMove = bestPv.moves.split(' ')[0];
    
    // Parse evaluation
    const evaluation = this.parseEvaluation(bestPv.cp, bestPv.mate);

    // Parse all PVs
    const pvs = data.pvs.map(pv => ({
      moves: pv.moves,
      evaluation: this.parseEvaluation(pv.cp, pv.mate),
      nodes: pv.nodes
    }));

    return {
      bestMove,
      evaluation,
      depth: data.depth,
      knodes: data.knodes,
      pvs,
      wdl: data.wdl
    };
  }

  /**
   * Parse centipawn or mate evaluation
   */
  private parseEvaluation(cp?: number, mate?: number): { type: 'cp' | 'mate'; value: number } {
    if (mate !== undefined) {
      return { type: 'mate', value: mate };
    } else if (cp !== undefined) {
      return { type: 'cp', value: cp };
    } else {
      return { type: 'cp', value: 0 };
    }
  }

  /**
   * Convert evaluation to human-readable format
   */
  formatEvaluation(evaluation: { type: 'cp' | 'mate'; value: number }): string {
    if (evaluation.type === 'mate') {
      if (evaluation.value > 0) {
        return `+M${evaluation.value}`;
      } else {
        return `-M${Math.abs(evaluation.value)}`;
      }
    } else {
      const score = evaluation.value / 100;
      if (score > 0) {
        return `+${score.toFixed(1)}`;
      } else if (score < 0) {
        return score.toFixed(1);
      } else {
        return '0.0';
      }
    }
  }

  /**
   * Convert evaluation to percentage advantage
   */
  evaluationToPercentage(evaluation: { type: 'cp' | 'mate'; value: number }): number {
    if (evaluation.type === 'mate') {
      return evaluation.value > 0 ? 100 : -100;
    } else {
      // Convert centipawns to percentage (rough approximation)
      const cp = evaluation.value;
      if (cp > 0) {
        return Math.min(100, (cp / 100) * 10);
      } else {
        return Math.max(-100, (cp / 100) * 10);
      }
    }
  }
}

// Export singleton instance
export const lichessApi = new LichessApiService();
export default lichessApi;
