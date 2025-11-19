// Chess game service using cm-chess for better variation and annotation support

import { Chess } from 'cm-chess';
import { Chess as ChessJs } from 'chess.mjs/src/Chess.js';
import { GameState, Move, MoveNode, Annotation, BoardOrientation } from '../types/chess';
import { ParsedMove } from './PGNParser';

export class CMChessGameService {
  private game: Chess;
  private moveTree: MoveNode[] = [];
  private annotations: Map<string, Annotation[]> = new Map();
  private currentMoveIndex = -1;
  private currentVariationId: string | null = null;

  constructor(fen?: string) {
    this.game = new Chess(fen);
  }

  getGameState(): GameState {
    return {
      fen: this.game.fen(),
      pgn: this.game.renderPgn(),
      turn: this.game.turn(),
      checkmate: this.game.inCheckmate(),
      stalemate: this.game.inStalemate(),
      draw: this.game.inDraw(),
      in_check: this.game.inCheck(),
      in_draw: this.game.inDraw(),
      in_stalemate: this.game.inStalemate(),
      in_threefold_repetition: this.game.inThreefoldRepetition(),
      in_insufficient_material: this.game.insufficientMaterial(),
      moves: this.getLegalMovesVerbose(),
      history: this.game.history()
    };
  }

  // Load PGN with cm-chess native support
  loadPGN(pgn: string): boolean {
    try {
      this.game.loadPgn(pgn);
      this.buildMoveTree();
      return true;
    } catch (error) {
      console.error('Error loading PGN:', error);
      return false;
    }
  }

  // Build move tree from cm-chess history
  private buildMoveTree(): void {
    this.moveTree = [];
    const history = this.game.history();
    
    history.forEach((move, index) => {
      const moveNode: MoveNode = {
        id: `move-${index}`,
        move: move,
        moveNumber: Math.floor(index / 2) + 1,
        isWhite: index % 2 === 0,
        moveIndex: index,
        annotations: this.annotations.get(`move-${index}`) || [],
        sublines: [],
        parentId: index > 0 ? `move-${index - 1}` : undefined,
        isMainLine: true,
        evaluation: undefined,
        accuracy: undefined,
        classification: undefined
      };
      
      this.moveTree.push(moveNode);
    });
  }

  // Navigate to specific move
  goToMove(moveIndex: number): boolean {
    if (moveIndex < -1 || moveIndex >= this.moveTree.length) {
      return false;
    }

    this.currentMoveIndex = moveIndex;
    
    if (moveIndex === -1) {
      this.game.load(this.game.setUpFen());
    } else {
      // Replay moves up to the target index
      this.game.load(this.game.setUpFen());
      for (let i = 0; i <= moveIndex; i++) {
        const moveNode = this.moveTree[i];
        if (moveNode && moveNode.move) {
          this.game.move(moveNode.move.san);
        }
      }
    }

    return true;
  }

  // Get current position
  getCurrentPosition(): string {
    return this.game.fen();
  }

  // Get move history
  getMoveHistory(): MoveNode[] {
    return this.moveTree;
  }

  // Get current move index
  getCurrentMoveIndex(): number {
    return this.currentMoveIndex;
  }

  // Navigate to next move
  nextMove(): boolean {
    return this.goToMove(this.currentMoveIndex + 1);
  }

  // Navigate to previous move
  previousMove(): boolean {
    return this.goToMove(this.currentMoveIndex - 1);
  }

  // Go to start of game
  goToStart(): boolean {
    return this.goToMove(-1);
  }

  // Go to end of main line
  goToEnd(): boolean {
    return this.goToMove(this.moveTree.length - 1);
  }

  // Add annotation to a move
  addAnnotation(moveId: string, annotation: Annotation): void {
    if (!this.annotations.has(moveId)) {
      this.annotations.set(moveId, []);
    }
    this.annotations.get(moveId)!.push(annotation);
  }

  // Get annotations for a move
  getAnnotations(moveId: string): Annotation[] {
    return this.annotations.get(moveId) || [];
  }

  // Get all annotations
  getAllAnnotations(): Map<string, Annotation[]> {
    return this.annotations;
  }

  // Check if move is valid
  isValidMove(move: string): boolean {
    try {
      const result = this.game.move(move);
      return result !== undefined;
    } catch {
      return false;
    }
  }

  // Get legal moves for current position
  getLegalMoves(): string[] {
    // cm-chess doesn't have a direct moves() method, we need to use chess.js internally
    const chessJs = new ChessJs(this.game.fen());
    return chessJs.moves();
  }

  // Get legal moves with verbose information
  getLegalMovesVerbose(): Move[] {
    // cm-chess doesn't have a direct moves() method, we need to use chess.js internally
    const chessJs = new ChessJs(this.game.fen());
    return chessJs.moves({ verbose: true });
  }

  // Check if position is checkmate
  isCheckmate(): boolean {
    return this.game.inCheckmate();
  }

  // Check if position is stalemate
  isStalemate(): boolean {
    return this.game.inStalemate();
  }

  // Check if position is draw
  isDraw(): boolean {
    return this.game.inDraw();
  }

  // Check if king is in check
  inCheck(): boolean {
    return this.game.inCheck();
  }

  // Get game result
  getGameResult(): string | null {
    if (this.game.inCheckmate()) {
      return this.game.turn() === 'w' ? '0-1' : '1-0';
    }
    if (this.game.inStalemate() || this.game.inDraw()) {
      return '1/2-1/2';
    }
    return null;
  }

  // Export current position as PGN
  exportPGN(): string {
    return this.game.renderPgn();
  }

  // Get board orientation
  getBoardOrientation(): BoardOrientation {
    return this.game.turn() === 'w' ? 'white' : 'black';
  }

  // Set board orientation
  setBoardOrientation(orientation: BoardOrientation): void {
    // Orientation is handled by UI
  }

  // Get piece at square
  getPieceAt(square: string): any {
    // cm-chess doesn't have a direct get() method, we need to use chess.js internally
    const chessJs = new ChessJs(this.game.fen());
    return chessJs.get(square);
  }

  // Get all pieces
  getPieces(): any[] {
    // cm-chess doesn't have a direct board() method, we need to use chess.js internally
    const chessJs = new ChessJs(this.game.fen());
    return chessJs.board();
  }

  // Undo last move
  undo(): boolean {
    try {
      this.game.undo();
      this.currentMoveIndex = Math.max(-1, this.currentMoveIndex - 1);
      return true;
    } catch {
      return false;
    }
  }

  // Reset game
  reset(): void {
    this.game.load(this.game.setUpFen());
    this.currentMoveIndex = -1;
    this.moveTree = [];
    this.annotations.clear();
  }

  // Get game headers (cm-chess native support)
  getHeaders(): any {
    return this.game.header();
  }

  // Set game header (cm-chess native support)
  setHeader(key: string, value: string): void {
    this.game.header().set(key, value);
  }

  // Get variations (cm-chess native support)
  getVariations(): Move[] {
    return this.game.history();
  }

  // Navigate variation (cm-chess native support)
  navigateVariation(variationIndex: number): boolean {
    // cm-chess handles variations natively
    try {
      return this.goToMove(variationIndex);
    } catch {
      return false;
    }
  }
}
