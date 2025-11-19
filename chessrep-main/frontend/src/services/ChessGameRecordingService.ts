import * as ChessMoments from 'chess-moments';
import { Chess } from 'chess.js';

// Define interfaces for move recording
export interface RecordedMove {
  id: string;
  san: string;
  from: string;
  to: string;
  piece: string;
  color: 'w' | 'b';
  fen: string;
  moveNumber: number;
  timestamp: Date;
  comment?: string;
  nags?: number[];
}

export interface GameState {
  fen: string;
  turn: 'w' | 'b';
  moveHistory: RecordedMove[];
  currentMoveIndex: number;
  gameOver: boolean;
  result?: string;
  headers: Record<string, string>;
}

export class ChessGameRecordingService {
  private chess: Chess;
  private moveHistory: RecordedMove[] = [];
  private currentMoveIndex: number = -1;
  private moveIdCounter: number = 0;
  private headers: Record<string, string> = {};
  private currentPGN: string = '';

  constructor() {
    this.chess = new Chess();
    this.initializeHeaders();
  }

  private initializeHeaders(): void {
    this.headers = {
      Event: 'Chess Game',
      Site: 'ChessRep',
      Date: new Date().toISOString().split('T')[0],
      Round: '1',
      White: 'Player 1',
      Black: 'Player 2',
      Result: '*'
    };
  }


  private generateMoveId(): string {
    return `move_${++this.moveIdCounter}`;
  }

  private updatePGN(): void {
    this.currentPGN = this.chess.pgn();
  }

  private getGameResult(): string | null {
    if (this.chess.in_checkmate()) {
      return this.chess.turn() === 'w' ? '0-1' : '1-0';
    } else if (this.chess.in_draw()) {
      return '1/2-1/2';
    }
    return null;
  }

  // Get current game state
  public getGameState(): GameState {
    return {
      fen: this.chess.fen(),
      turn: this.chess.turn(),
      moveHistory: this.moveHistory,
      currentMoveIndex: this.currentMoveIndex,
      gameOver: this.chess.game_over(),
      result: this.getGameResult(),
      headers: this.headers
    };
  }

  // Make a move
  public makeMove(from: string, to: string, promotion?: string, comment?: string): boolean {
    try {
      const chessMove = this.chess.move({
        from,
        to,
        promotion: promotion as any
      });

      if (chessMove) {
        const recordedMove: RecordedMove = {
          id: this.generateMoveId(),
          san: chessMove.san,
          from: chessMove.from,
          to: chessMove.to,
          piece: chessMove.piece,
          color: chessMove.color,
          fen: this.chess.fen(),
          moveNumber: Math.ceil(this.moveHistory.length / 2) + 1,
          timestamp: new Date(),
          comment: comment,
          nags: undefined
        };

        this.moveHistory.push(recordedMove);
        this.currentMoveIndex = this.moveHistory.length - 1;

        // Update the PGN string
        this.updatePGN();

        // Update game result if game is over
        if (this.chess.game_over()) {
          this.headers.Result = this.getGameResult() || '*';
        }

        return true;
      }
      return false;
    } catch (error) {
      console.error('Invalid move:', error);
      return false;
    }
  }

  // Undo the last move
  public undoMove(): boolean {
    if (this.currentMoveIndex >= 0) {
      this.moveHistory.pop();
      this.currentMoveIndex = this.moveHistory.length - 1;

      // Rebuild position up to the current move
      this.chess.reset();
      for (const move of this.moveHistory) {
        this.chess.move({
          from: move.from,
          to: move.to,
          promotion: move.piece.toLowerCase() !== move.piece ? move.piece.toLowerCase() : undefined
        });
      }

      // Update the PGN string
      this.updatePGN();

      return true;
    }
    return false;
  }

  // Reset the game
  public reset(): void {
    this.chess.reset();
    this.moveHistory = [];
    this.currentMoveIndex = -1;
    this.currentPGN = '';
    this.headers.Result = '*';
    this.updatePGN();
  }

  // Navigate to a specific move
  public goToMove(moveIndex: number): boolean {
    if (moveIndex < -1 || moveIndex >= this.moveHistory.length) {
      return false;
    }

    this.currentMoveIndex = moveIndex;
    
    // Rebuild position up to the specified move
    this.chess.reset();
    for (let i = 0; i <= moveIndex; i++) {
      const move = this.moveHistory[i];
      this.chess.move({
        from: move.from,
        to: move.to,
        promotion: move.piece.toLowerCase() !== move.piece ? move.piece.toLowerCase() : undefined
      });
    }

    // Update the PGN string
    this.updatePGN();

    return true;
  }

  // Export PGN
  public exportPGN(): string {
    return this.currentPGN;
  }

  // Import PGN
  public loadPGN(pgn: string): boolean {
    try {
      this.chess.loadPgn(pgn);
      this.moveHistory = [];
      this.currentMoveIndex = -1;
      this.currentPGN = pgn;
      
      // Parse moves from the loaded PGN
      const moves = this.chess.history({ verbose: true });
      for (let i = 0; i < moves.length; i++) {
        const move = moves[i];
        const recordedMove: RecordedMove = {
          id: this.generateMoveId(),
          san: move.san,
          from: move.from,
          to: move.to,
          piece: move.piece,
          color: move.color,
          fen: move.after,
          moveNumber: Math.floor(i / 2) + 1,
          timestamp: new Date(),
          comment: undefined,
          nags: undefined
        };
        this.moveHistory.push(recordedMove);
      }
      
      this.currentMoveIndex = this.moveHistory.length - 1;
      return true;
    } catch (error) {
      console.error('Failed to load PGN:', error);
      return false;
    }
  }

  // Get chess moments from current game using chess-moments
  public getChessMoments(): any[] {
    if (this.currentPGN) {
      try {
        return ChessMoments.flat(this.currentPGN);
      } catch (error) {
        console.error('Error parsing PGN with chess-moments:', error);
        return [];
      }
    }
    return [];
  }

  // Get chess moments tree from current PGN using chess-moments
  public getChessMomentsTree(): any[] {
    if (this.currentPGN) {
      try {
        return ChessMoments.tree(this.currentPGN);
      } catch (error) {
        console.error('Error parsing PGN tree with chess-moments:', error);
        return [];
      }
    }
    return [];
  }


  // Get current move index
  public getCurrentMoveIndex(): number {
    return this.currentMoveIndex;
  }

  // Add comment to a move
  public addComment(moveIndex: number, comment: string): boolean {
    if (moveIndex >= 0 && moveIndex < this.moveHistory.length) {
      this.moveHistory[moveIndex].comment = comment;
      this.updatePGN();
      return true;
    }
    return false;
  }

  // Set game headers
  public setHeaders(headers: Record<string, string>): void {
    this.headers = { ...this.headers, ...headers };
  }

  // Get game headers
  public getHeaders(): Record<string, string> {
    return this.headers;
  }
}

export const chessGameRecordingService = new ChessGameRecordingService();