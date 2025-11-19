// Core chess types and interfaces

export type BoardOrientation = 'white' | 'black';

export interface Square {
  file: 'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g' | 'h';
  rank: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
}

export interface Move {
  from: string;
  to: string;
  promotion?: 'q' | 'r' | 'b' | 'n';
  san: string;
  uci?: string;
  color: 'w' | 'b';
  piece: string;
  captured?: string;
  flags: string;
  lan?: string;
  before: string;
  after: string;
}

export interface GameState {
  fen: string;
  pgn: string;
  turn: 'w' | 'b';
  checkmate: boolean;
  stalemate: boolean;
  draw: boolean;
  in_check: boolean;
  in_draw: boolean;
  in_stalemate: boolean;
  in_threefold_repetition: boolean;
  in_insufficient_material: boolean;
  moves: Move[];
  history: Move[];
}

export interface Evaluation {
  type: 'cp' | 'mate';
  value: number;
  depth: number;
  nodes: number;
  time: number;
  pv: string[];
  multipv?: number;
}

export interface EngineMove {
  move: string;
  uci?: string;
  evaluation: Evaluation;
  pv: string[];
  depth: number;
  nodes: number;
  time: number;
}

export interface Annotation {
  id: string;
  moveId: string;
  type: 'comment' | 'symbol' | 'arrow' | 'circle' | 'highlight';
  content?: string;
  symbol?: '!' | '?' | '!!' | '??' | '!?' | '?!';
  from?: string;
  to?: string;
  square?: string;
  color?: string;
  createdAt: Date;
}

export interface MoveNode {
  id: string;
  move: Move;
  moveNumber: number;
  isWhite: boolean;
  moveIndex: number;
  annotations: Annotation[];
  sublines: MoveNode[];
  parentId?: string;
  isMainLine: boolean;
  evaluation?: Evaluation;
  accuracy?: number;
  classification?: 'brilliant' | 'great' | 'good' | 'inaccuracy' | 'mistake' | 'blunder';
}

export interface GameReport {
  id: string;
  totalMoves: number;
  overallAccuracy: number;
  whiteAccuracy: number;
  blackAccuracy: number;
  criticalMoments: CriticalMoment[];
  accuracyData: AccuracyData[];
  mistakes: number;
  blunders: number;
  inaccuracies: number;
  generatedAt: Date;
}

export interface CriticalMoment {
  moveNumber: number;
  move: string;
  evaluationChange: number;
  description: string;
  type: 'advantage_gained' | 'advantage_lost' | 'mistake' | 'blunder';
}

export interface AccuracyData {
  moveNumber: number;
  accuracy: number;
  evaluation: number;
  bestMove: string;
  playedMove: string;
  classification: string;
}

export interface BotConfig {
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  elo: number;
  depth: number;
  timeLimit: number;
  personality: 'aggressive' | 'positional' | 'tactical' | 'defensive';
}

export interface OpeningMove {
  move: string;
  san: string;
  uci: string;
  white: number;
  draws: number;
  black: number;
  averageRating: number;
  eco: string;
  name: string;
}

export interface TablebaseResult {
  category: 'win' | 'loss' | 'draw' | 'unknown';
  dtz: number;
  dtm: number;
  wdl: number;
  moves: Array<{
    uci: string;
    san: string;
    dtz: number;
    dtm: number;
    wdl: number;
  }>;
}

export interface Study {
  id: string;
  title: string;
  description: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  gameNodes: MoveNode[];
  annotations: Annotation[];
  isPublic: boolean;
  authorId: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  rating: number;
  studies: Study[];
  createdAt: Date;
}

export interface AnalysisConfig {
  depth: number;
  multiPV: number;
  timeLimit: number;
  useCloudAnalysis: boolean;
  showEngineLines: boolean;
  showEvaluation: boolean;
  showBestMoves: boolean;
}

export interface BoardConfig {
  orientation: 'white' | 'black';
  showCoordinates: boolean;
  showLastMove: boolean;
  showLegalMoves: boolean;
  animationDuration: number;
  pieceSet: string;
  boardTheme: string;
}

export interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
  action: string;
  description: string;
}

export interface AccessibilityConfig {
  announceMoves: boolean;
  highContrast: boolean;
  largePieces: boolean;
  screenReader: boolean;
  keyboardNavigation: boolean;
}

