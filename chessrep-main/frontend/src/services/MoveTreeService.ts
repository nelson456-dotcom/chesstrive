import { Chess } from 'chess.js';
import { ParsedMove, ParsedGame, pgnParser } from './PGNParser';

export interface NavigationState {
  currentMove: ParsedMove | null;
  currentPath: string[];
  fen: string;
  moveHistory: string[];
  canGoBack: boolean;
  canGoForward: boolean;
  currentVariation: ParsedMove[];
  variationIndex: number;
}

export class MoveTreeService {
  private game: ParsedGame | null = null;
  private chess = new Chess();
  private currentPath: string[] = [];
  private listeners: ((state: NavigationState) => void)[] = [];

  public loadPGN(pgn: string): void {
    this.game = pgnParser.parse(pgn);
    this.chess.reset();
    this.currentPath = [];
    this.notifyListeners();
  }

  public getCurrentState(): NavigationState {
    if (!this.game) {
      return {
        currentMove: null,
        currentPath: [],
        fen: new Chess().fen(),
        moveHistory: [],
        canGoBack: false,
        canGoForward: false,
        currentVariation: [],
        variationIndex: 0
      };
    }

    // Ensure the internal chess instance reflects the currentPath before reading state
    this.rebuildPosition();

    const currentMove = this.getCurrentMove();
    const currentVariation = this.getCurrentVariation();
    const variationIndex = this.getCurrentVariationIndex();

    return {
      currentMove,
      currentPath: [...this.currentPath],
      fen: this.chess.fen(),
      moveHistory: this.chess.history(),
      canGoBack: this.currentPath.length > 0,
      canGoForward: this.canGoForward(),
      currentVariation,
      variationIndex
    };
  }

  public goToNext(): boolean {
    if (!this.game) return false;

    const currentVariation = this.getCurrentVariation();
    const currentIndex = this.getCurrentVariationIndex();

    if (currentIndex + 1 < currentVariation.length) {
      const nextMove = currentVariation[currentIndex + 1];
      this.currentPath.push(nextMove.id);
      this.notifyListeners();
      return true;
    }

    return false;
  }

  public goToPrevious(): boolean {
    if (this.currentPath.length === 0) return false;

    this.currentPath.pop();
    this.notifyListeners();
    return true;
  }

  public goToMove(moveId: string): boolean {
    console.log('goToMove called with moveId:', moveId);
    if (!this.game) return false;

    const path = this.buildPathToMove(moveId);
    console.log('path found:', path);
    if (path) {
      this.currentPath = path;
      console.log('currentPath set to:', this.currentPath);
      this.notifyListeners();
      return true;
    }

    console.log('path not found for moveId:', moveId);
    return false;
  }

  public goToVariation(variationIndex: number, moveIndex: number = 0): boolean {
    if (!this.game) return false;

    const currentMove = this.getCurrentMove();
    if (!currentMove || variationIndex >= currentMove.variations.length) {
      return false;
    }

    const variation = currentMove.variations[variationIndex];
    if (moveIndex >= variation.length) return false;

    // Build path to the specific move in the variation
    const targetMove = variation[moveIndex];
    const path = this.buildPathToMove(targetMove.id);

    if (path) {
      this.currentPath = path;
      this.notifyListeners();
      return true;
    }

    return false;
  }

  public goToStart(): boolean {
    if (!this.game) return false;

    this.currentPath = [];
    this.notifyListeners();
    return true;
  }

  public goToEnd(): boolean {
    if (!this.game) return false;

    const mainLine = this.game.moves;
    if (mainLine.length === 0) return false;

    // Build path to the last move in the main line
    const lastMove = mainLine[mainLine.length - 1];
    const path = this.buildPathToMove(lastMove.id);

    if (path) {
      this.currentPath = path;
      this.notifyListeners();
      return true;
    }

    return false;
  }

  public makeMove(from: string, to: string, promotion?: string): boolean {
    if (!this.game) return false;

    this.rebuildPosition();
    const move = this.chess.move({ from, to, promotion });

    if (!move) {
      return false; // Illegal move
    }

    const currentMove = this.getCurrentMove();
    const parentVariation = this.getCurrentVariation();
    const currentIndex = this.getCurrentVariationIndex();

    // Construct a new ParsedMove object for the user's move
    const newMove: ParsedMove = {
      id: `move_${Date.now()}_${Math.random()}`,
      san: move.san,
      fen: this.chess.fen(),
      moveNumber: Math.ceil(this.chess.history().length / 2),
      isWhite: move.color === 'w',
      comment: '',
      nags: [],
      variations: [],
      parentId: currentMove ? currentMove.id : undefined,
      isMainLine: currentMove ? currentMove.isMainLine : true,
      depth: currentMove ? currentMove.depth + 1 : 0,
      moveIndex: this.game ? this.game.allMoves.length : 0
    };

    if (currentMove) {
      // We are in the middle of a line, check for existing move
      const nextMove = parentVariation[currentIndex + 1];
      if (nextMove && nextMove.san === newMove.san) {
        // The move played is the next move in the current line
        this.currentPath.push(nextMove.id);
      } else {
        // This is a new move, create a variation from current move
        currentMove.variations.push([newMove]);
        this.currentPath.push(newMove.id);
      }
    } else {
      // We are at the start of the game or a new branch, append to the root variation
      parentVariation.push(newMove);
      this.currentPath.push(newMove.id);
    }

    this.notifyListeners();
    return true;
  }

  public addAnnotation(comment: string, moveId?: string): void {
    const targetMoveId = moveId || (this.currentPath.length > 0 ? this.currentPath[this.currentPath.length - 1] : null);
    if (!targetMoveId) return;

    const move = this.findMoveById(targetMoveId);
    if (move) {
      move.comment = comment;
      this.notifyListeners();
    }
  }

  public addListener(listener: (state: NavigationState) => void): void {
    this.listeners.push(listener);
  }

  public removeListener(listener: (state: NavigationState) => void): void {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  private getCurrentMove(): ParsedMove | null {
    if (!this.game || this.currentPath.length === 0) return null;

    const lastMoveId = this.currentPath[this.currentPath.length - 1];
    return this.findMoveById(lastMoveId);
  }

  private getCurrentVariation(): ParsedMove[] {
    if (!this.game) return [];

    if (this.currentPath.length === 0) {
      return this.game.moves;
    }

    // Find which variation contains the current move
    const currentMoveId = this.currentPath[this.currentPath.length - 1];
    return this.findVariationContainingMove(currentMoveId) || this.game.moves;
  }

  private getCurrentVariationIndex(): number {
    const currentVariation = this.getCurrentVariation();
    if (this.currentPath.length === 0) return -1;

    const currentMoveId = this.currentPath[this.currentPath.length - 1];
    return currentVariation.findIndex(move => move.id === currentMoveId);
  }

  private canGoForward(): boolean {
    const currentVariation = this.getCurrentVariation();
    const currentIndex = this.getCurrentVariationIndex();
    return currentIndex + 1 < currentVariation.length;
  }

  public getGame(): ParsedGame | null {
    return this.game;
  }

  public getAllVariationsAtCurrentPosition(): ParsedMove[][] {
    const currentMove = this.getCurrentMove();
    if (!currentMove) return [];
    return currentMove.variations;
  }

  public getMainLineFromCurrentPosition(): ParsedMove[] {
    if (!this.game) return [];

    const currentIndex = this.getCurrentVariationIndex();
    const currentVariation = this.getCurrentVariation();

    if (currentIndex === -1) return currentVariation;

    return currentVariation.slice(currentIndex + 1);
  }

  private findMoveById(moveId: string): ParsedMove | null {
    if (!this.game) return null;

    const findInMoves = (moves: ParsedMove[]): ParsedMove | null => {
      for (const move of moves) {
        if (move.id === moveId) return move;

        for (const variation of move.variations) {
          const found = findInMoves(variation);
          if (found) return found;
        }
      }
      return null;
    };

    return findInMoves(this.game.moves);
  }

  private buildPathToMove(moveId: string): string[] | null {
    if (!this.game) return null;

    const buildPath = (moves: ParsedMove[], currentPath: string[]): string[] | null => {
      for (const move of moves) {
        const newPath = [...currentPath, move.id];

        if (move.id === moveId) {
          return newPath;
        }

        // ensure variations are searched with the path that includes this branching move
        currentPath = newPath;

        for (const variation of move.variations) {
          const found = buildPath(variation, currentPath);
          if (found) return found;
        }
      }
      return null;
    };

    return buildPath(this.game.moves, []);
  }

  private findVariationContainingMove(moveId: string): ParsedMove[] | null {
    if (!this.game) return null;

    const findVariation = (moves: ParsedMove[]): ParsedMove[] | null => {
      for (const move of moves) {
        // Check if the move is in this variation
        if (moves.some(m => m.id === moveId)) {
          return moves;
        }

        // Check sub-variations
        for (const variation of move.variations) {
          const found = findVariation(variation);
          if (found) return found;
        }
      }
      return null;
    };

    return findVariation(this.game.moves);
  }

  private rebuildPosition(): void {
    console.log('rebuildPosition called with currentPath:', this.currentPath);
    this.chess.reset();

    for (const moveId of this.currentPath) {
      const move = this.findMoveById(moveId);
      if (move) {
        console.log('making move:', move.san);
        try {
          this.chess.move(move.san);
        } catch (error) {
          console.error(`Failed to make move ${move.san}:`, error);
          break;
        }
      } else {
        console.error('move not found for id:', moveId);
      }
    }
    console.log('final fen:', this.chess.fen());
  }

  private notifyListeners(): void {
    const state = this.getCurrentState();
    this.listeners.forEach(listener => listener(state));
  }
}

export const moveTreeService = new MoveTreeService();