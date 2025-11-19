import { Chess } from 'chess.js';

export interface ParsedMove {
  id: string;
  san: string;
  fen: string;
  moveNumber: number;
  isWhite: boolean;
  comment?: string;
  nags?: number[];
  variations: ParsedMove[][];
  parentId?: string;
  isMainLine: boolean;
  depth: number;
  moveIndex: number;
}

export interface ParsedGame {
  headers: Record<string, string>;
  moves: ParsedMove[];
  mainLine: ParsedMove[];
  allMoves: ParsedMove[];
}

export class PGNParser {
  private moveIdCounter = 0;
  private allMoves: Map<string, ParsedMove> = new Map();
  private moveIndexCounter = 0;

  private generateMoveId(): string {
    return `move_${++this.moveIdCounter}`;
  }

  public parse(pgn: string): ParsedGame {
    this.moveIdCounter = 0;
    this.moveIndexCounter = 0;
    this.allMoves.clear();

    // Clean the PGN
    const cleanPgn = this.cleanPGN(pgn);

    // Parse headers
    const headers = this.parseHeaders(cleanPgn);

    // Parse moves
    const moveText = this.extractMoveText(cleanPgn);
    const moves = this.parseMoves(moveText);

    // Build main line
    const mainLine = this.extractMainLine(moves);

    // Flatten all moves for easy access
    const allMoves = Array.from(this.allMoves.values());

    return {
      headers,
      moves,
      mainLine,
      allMoves
    };
  }

  private cleanPGN(pgn: string): string {
    // Remove extra whitespace and normalize line endings
    return pgn
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/\n+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private parseHeaders(pgn: string): Record<string, string> {
    const headers: Record<string, string> = {};
    const headerRegex = /\[(\w+)\s+"([^"]*)"\]/g;
    let match;

    while ((match = headerRegex.exec(pgn)) !== null) {
      headers[match[1]] = match[2];
    }

    return headers;
  }

  private extractMoveText(pgn: string): string {
    // Remove headers
    const withoutHeaders = pgn.replace(/\[.*?\]\s*/g, '');

    // Remove result at the end
    const withoutResult = withoutHeaders.replace(/\s*(1-0|0-1|1\/2-1\/2|\*)\s*$/, '');

    return withoutResult.trim();
  }

  private parseMoves(moveText: string): ParsedMove[] {
    const chess = new Chess();
    return this.parseVariation(moveText, chess, null, true, 0);
  }

  private parseVariation(
    text: string,
    chess: Chess,
    parentId: string | null,
    isMainLine: boolean,
    depth: number
  ): ParsedMove[] {
    const moves: ParsedMove[] = [];
    const tokens = this.tokenize(text);
    let i = 0;

    while (i < tokens.length) {
      const token = tokens[i];

      if (token.type === 'move') {
        try {
          const beforeFen = chess.fen();
          const move = chess.move(token.value);

          if (move) {
            const parsedMove: ParsedMove = {
              id: this.generateMoveId(),
              san: move.san,
              fen: chess.fen(),
              moveNumber: Math.ceil(chess.history().length / 2),
              isWhite: move.color === 'w',
              variations: [],
              parentId,
              isMainLine,
              depth,
              moveIndex: this.moveIndexCounter++
            };

            this.allMoves.set(parsedMove.id, parsedMove);
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
              const variationText = variationTokens.map(t => t.value).join(' ');

              // Create a new chess instance for the variation
              const variationChess = new Chess(beforeFen);
              const variation = this.parseVariation(variationText, variationChess, parsedMove.id, false, depth + 1);

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

  private parseNextMove(text: string, startPosition: number): { san: string; endPosition: number } | null {
    // Skip move numbers like "1.", "1...", "23."
    let position = startPosition;
    position = this.skipWhitespace(text, position);

    // Skip move number
    const moveNumberMatch = text.substring(position).match(/^(\d+\.{1,3})/);
    if (moveNumberMatch) {
      position += moveNumberMatch[0].length;
      position = this.skipWhitespace(text, position);
    }

    // Parse the actual move
    const moveMatch = text.substring(position).match(/^([NBRQK]?[a-h]?[1-8]?x?[a-h][1-8](?:=[NBRQ])?[+#]?|O-O(?:-O)?[+#]?)/);
    if (moveMatch) {
      return {
        san: moveMatch[1],
        endPosition: position + moveMatch[0].length
      };
    }

    return null;
  }

  private skipWhitespace(text: string, position: number): number {
    while (position < text.length && /\s/.test(text[position])) {
      position++;
    }
    return position;
  }

  private findMatchingParenthesis(text: string, startPosition: number): number {
    let depth = 1;
    let position = startPosition + 1;

    while (position < text.length && depth > 0) {
      if (text[position] === '(') {
        depth++;
      } else if (text[position] === ')') {
        depth--;
      }
      position++;
    }

    return position - 1;
  }

  private getMovesToPosition(moveId: string | null): ParsedMove[] {
    // This would need to be implemented to replay moves to a specific position
    // For now, return empty array
    return [];
  }

  private extractMainLine(moves: ParsedMove[]): ParsedMove[] {
    return moves.filter(move => move.isMainLine);
  }

  private flattenMoves(moves: ParsedMove[]): ParsedMove[] {
    const flattened: ParsedMove[] = [];

    const flatten = (moveList: ParsedMove[]) => {
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

      // Game result
      if (char === '1' || char === '0' || char === '*') {
        let j = i;
        while (j < text.length && /[10*\-/]/.test(text[j])) {
          j++;
        }
        tokens.push({
          type: 'result',
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
}

export const pgnParser = new PGNParser();