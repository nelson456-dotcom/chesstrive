import { Chess } from 'chess.js';

export interface ChessMomentsMove {
  san: string;
  fen: string;
  moveNumber: number;
  isWhite: boolean;
  comment?: string;
  nags?: number[];
  variations: ChessMomentsMove[][];
  id: string;
  moveIndex: number;
}

export interface ChessMomentsGame {
  headers: Record<string, string>;
  moves: ChessMomentsMove[];
  mainLine: ChessMomentsMove[];
  allMoves: ChessMomentsMove[];
}

export class ChessMomentsService {
  public chess: Chess;
  private moveIdCounter = 0;

  constructor() {
    this.chess = new Chess();
  }

  private generateMoveId(): string {
    return `move_${++this.moveIdCounter}`;
  }

  public parsePGN(pgn: string): ChessMomentsGame {
    this.moveIdCounter = 0;
    
    try {
      // Use enhanced PGN parsing with better tree structure
      const parsedMoves = this.parsePGNWithTree(pgn);
      
      // Extract headers
      const headers = this.extractHeaders(pgn);
      
      // Build main line
      const mainLine = this.extractMainLine(parsedMoves);
      
      // Flatten all moves
      const allMoves = this.flattenMoves(parsedMoves);

      return {
        headers,
        moves: parsedMoves,
        mainLine,
        allMoves
      };
    } catch (error) {
      console.error('Failed to parse PGN:', error);
      throw error;
    }
  }

  private parsePGNWithTree(pgn: string): ChessMomentsMove[] {
    const moves: ChessMomentsMove[] = [];
    let moveIndex = 0;

    // Clean the PGN
    const cleanPgn = this.cleanPGN(pgn);
    
    // Extract move text
    const moveText = this.extractMoveText(cleanPgn);
    
    // Parse moves with variations
    const tokens = this.tokenize(moveText);
    const parsedMoves = this.parseVariation(tokens, 0, null, true, 0);

    return parsedMoves;
  }

  private cleanPGN(pgn: string): string {
    return pgn
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/\n+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private extractMoveText(pgn: string): string {
    // Remove headers
    const withoutHeaders = pgn.replace(/\[.*?\]\s*/g, '');
    // Remove result at the end
    const withoutResult = withoutHeaders.replace(/\s*(1-0|0-1|1\/2-1\/2|\*)\s*$/, '');
    return withoutResult.trim();
  }

  private tokenize(text: string): Array<{type: string, value: string}> {
    const tokens: Array<{type: string, value: string}> = [];
    let i = 0;

    while (i < text.length) {
      const char = text[i];

      // Skip whitespace
      if (/\s/.test(char)) {
        i++;
        continue;
      }

      // Comments
      if (char === '{') {
        const end = text.indexOf('}', i);
        if (end !== -1) {
          tokens.push({
            type: 'comment',
            value: text.slice(i + 1, end)
          });
          i = end + 1;
          continue;
        }
      }

      // Variations
      if (char === '(') {
        tokens.push({type: 'variation_start', value: '('});
        i++;
        continue;
      }

      if (char === ')') {
        tokens.push({type: 'variation_end', value: ')'});
        i++;
        continue;
      }

      // NAGs
      if (char === '$') {
        let j = i + 1;
        while (j < text.length && /\d/.test(text[j])) {
          j++;
        }
        tokens.push({
          type: 'nag',
          value: text.slice(i + 1, j)
        });
        i = j;
        continue;
      }

      // Move numbers
      if (/\d/.test(char)) {
        let j = i;
        while (j < text.length && /[\d.]/.test(text[j])) {
          j++;
        }
        tokens.push({
          type: 'move_number',
          value: text.slice(i, j)
        });
        i = j;
        continue;
      }

      // Moves (algebraic notation)
      if (/[KQRBN]/.test(char) || /[a-h]/.test(char) || char === 'O') {
        let j = i;
        while (j < text.length && /[KQRBNa-h1-8x+=O-]/.test(text[j])) {
          j++;
        }
        // Check for check/checkmate symbols
        if (j < text.length && (text[j] === '+' || text[j] === '#')) {
          j++;
        }
        tokens.push({
          type: 'move',
          value: text.slice(i, j)
        });
        i = j;
        continue;
      }

      // Skip unknown characters
      i++;
    }

    return tokens;
  }

  private parseVariation(
    tokens: Array<{type: string, value: string}>,
    startIndex: number,
    parentId: string | null,
    isMainLine: boolean,
    depth: number
  ): ChessMomentsMove[] {
    const moves: ChessMomentsMove[] = [];
    let i = startIndex;
    let moveIndex = 0;

    while (i < tokens.length) {
      const token = tokens[i];

      if (token.type === 'move') {
        try {
          const beforeFen = this.chess.fen();
          const move = this.chess.move(token.value);

          if (move) {
            const parsedMove: ChessMomentsMove = {
              id: this.generateMoveId(),
              san: move.san,
              fen: this.chess.fen(),
              moveNumber: Math.ceil((moveIndex + 1) / 2),
              isWhite: moveIndex % 2 === 0,
              comment: undefined,
              nags: undefined,
              variations: [],
              moveIndex: moveIndex++
            };

            moves.push(parsedMove);

            // Look ahead for comments and NAGs
            let j = i + 1;
            while (j < tokens.length && (tokens[j].type === 'comment' || tokens[j].type === 'nag')) {
              if (tokens[j].type === 'comment') {
                parsedMove.comment = tokens[j].value;
              } else if (tokens[j].type === 'nag') {
                if (!parsedMove.nags) parsedMove.nags = [];
                parsedMove.nags.push(parseInt(tokens[j].value));
              }
              j++;
            }
            i = j - 1;

            // Look ahead for variations
            j = i + 1;
            while (j < tokens.length && tokens[j].type === 'variation_start') {
              const variationEnd = this.findMatchingVariationEnd(tokens, j);
              const variationTokens = tokens.slice(j + 1, variationEnd);

              // Create a new chess instance for the variation
              const variationChess = new Chess(beforeFen);
              const variation = this.parseVariation(variationTokens, 0, parsedMove.id, false, depth + 1);

              parsedMove.variations.push(variation);
              j = variationEnd + 1;
            }
            i = j - 1;
          }
        } catch (error) {
          // Invalid move, skip it
          console.warn(`Invalid move: ${token.value}`);
        }
      }

      // Skip unknown tokens
      i++;
    }

    return moves;
  }

  private findMatchingVariationEnd(tokens: Array<{type: string, value: string}>, startIndex: number): number {
    let depth = 1;
    let i = startIndex + 1;

    while (i < tokens.length && depth > 0) {
      if (tokens[i].type === 'variation_start') {
        depth++;
      } else if (tokens[i].type === 'variation_end') {
        depth--;
      }
      i++;
    }

    return i - 1;
  }

  private extractHeaders(pgn: string): Record<string, string> {
    const headers: Record<string, string> = {};
    const headerRegex = /\[(\w+)\s+"([^"]*)"\]/g;
    let match;

    while ((match = headerRegex.exec(pgn)) !== null) {
      headers[match[1]] = match[2];
    }

    return headers;
  }

  private extractMainLine(moves: ChessMomentsMove[]): ChessMomentsMove[] {
    // For chess-moments, the main line is typically the first level of the tree
    return moves.filter(move => !move.variations.some(variation => variation.length > 0));
  }

  private flattenMoves(moves: ChessMomentsMove[]): ChessMomentsMove[] {
    const flattened: ChessMomentsMove[] = [];

    const flatten = (moveList: ChessMomentsMove[]) => {
      for (const move of moveList) {
        flattened.push(move);
        for (const variation of move.variations) {
          flatten(variation);
        }
      }
    };

    flatten(moves);
    return flattened;
  }

  public getPositionAtMove(moves: ChessMomentsMove[], moveIndex: number): string {
    this.chess.reset();
    
    // Replay moves up to the specified index
    for (let i = 0; i <= moveIndex && i < moves.length; i++) {
      try {
        this.chess.move(moves[i].san);
      } catch (error) {
        console.warn(`Invalid move at index ${i}: ${moves[i].san}`);
        break;
      }
    }
    
    return this.chess.fen();
  }

  public validateMove(from: string, to: string, promotion?: string): boolean {
    try {
      // Get available moves to check if the move is legal without actually making it
      const legalMoves = this.chess.moves({ verbose: true });
      return legalMoves.some(move => 
        move.from === from && 
        move.to === to && 
        (!promotion || move.promotion === promotion)
      );
    } catch (error) {
      return false;
    }
  }

  public getLegalMoves(square?: string): any[] {
    if (square) {
      return this.chess.moves({ square: square as any, verbose: true });
    }
    return this.chess.moves({ verbose: true });
  }

  public getCurrentFEN(): string {
    return this.chess.fen();
  }

  public reset(): void {
    this.chess.reset();
  }
}

export const chessMomentsService = new ChessMomentsService();
