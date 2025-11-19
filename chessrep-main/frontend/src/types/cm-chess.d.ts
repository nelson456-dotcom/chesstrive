declare module 'cm-chess' {
  export class Chess {
    constructor(fen?: string);
    fen(): string;
    pgn(): string;
    turn(): 'w' | 'b';
    in_checkmate(): boolean;
    in_stalemate(): boolean;
    in_draw(): boolean;
    in_check(): boolean;
    in_threefold_repetition(): boolean;
    in_insufficient_material(): boolean;
    moves(options?: { verbose?: boolean }): any[];
    history(options?: { verbose?: boolean }): any[];
    load_pgn(pgn: string): boolean;
    move(move: any): any;
    reset(): void;
    undo(): void;
    get(square: string): any;
    board(): any[];
    header(key?: string, value?: string): any;
  }
}
