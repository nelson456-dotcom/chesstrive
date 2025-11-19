declare module 'cm-chessboard' {
  export const PIECE: {
    wp: string; wb: string; wn: string; wr: string; wq: string; wk: string;
    bp: string; bb: string; bn: string; br: string; bq: string; bk: string;
  };
  
  export const PIECE_TYPE: {
    pawn: string; knight: string; bishop: string; rook: string; queen: string; king: string;
  };
  
  export const COLOR: {
    white: string;
    black: string;
  };
  
  export const INPUT_EVENT_TYPE: any;
  export const POINTER_EVENTS: any;
  export const BORDER_TYPE: any;
  export const FEN: any;

  export interface ChessboardConfig {
    position?: string;
    orientation?: string;
    responsive?: boolean;
    assetsUrl?: string;
    assetsCache?: boolean;
    style?: {
      cssClass?: string;
      showCoordinates?: boolean;
      borderType?: string;
      aspectRatio?: number;
      pieces?: any;
    };
    onMove?: (move: any) => boolean;
    onSelect?: (square: string) => void;
  }

  export class Chessboard {
    constructor(context: HTMLElement, props?: ChessboardConfig);
    setPosition(position: string): void;
    destroy(): void;
    enableMoveInput(callback: (move: any) => boolean, color?: string): void;
    disableMoveInput(): void;
  }
}
