// Tests for ChessGameService

import { ChessGameService } from '../services/ChessGameService';
import { MoveNode } from '../types/chess';

import { ChessGameService } from '../services/ChessGameService';
import { MoveNode } from '../types/chess';

import { ChessGameService } from '../services/ChessGameService';
import { MoveNode } from '../types/chess';

import { ChessGameService } from '../services/ChessGameService';
import { MoveNode } from '../types/chess';

describe('ChessGameService', () => {
  let gameService: ChessGameService;

  beforeEach(() => {
    gameService = new ChessGameService();
  });

  describe('Game State Management', () => {
    test('should initialize with starting position', () => {
      const gameState = gameService.getGameState();
      expect(gameState.fen).toBe('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
      expect(gameState.turn).toBe('w');
      expect(gameState.checkmate).toBe(false);
      expect(gameState.stalemate).toBe(false);
    });

    test('should make valid moves', () => {
      const success = gameService.makeMove('e2', 'e4');
      expect(success).toBe(true);
      
      const gameState = gameService.getGameState();
      expect(gameState.turn).toBe('b');
    });

    test('should reject invalid moves', () => {
      const success = gameService.makeMove('e2', 'e5');
      expect(success).toBe(false);
    });
  });

  describe('Move Tree Management', () => {
    test('should build move tree correctly', () => {
      gameService.makeMove('e2', 'e4');
      gameService.makeMove('e7', 'e5');
      
      const moveTree = gameService.getMoveTree();
      expect(moveTree).toHaveLength(2);
      expect(moveTree[0].move.san).toBe('e4');
      expect(moveTree[1].move.san).toBe('e5');
    });

    test('should create variations', () => {
      gameService.makeMove('e2', 'e4');
      gameService.makeMove('e7', 'e5');
      
      // Go back and create variation
      gameService.goToMove(0);
      const success = gameService.createVariation(0, 'e7', 'e6');
      
      expect(success).toBe(true);
      
      const moveTree = gameService.getMoveTree();
      expect(moveTree[0].sublines).toHaveLength(1);
    });
  });

  describe('Navigation', () => {
    test('should navigate to specific moves', () => {
      gameService.makeMove('e2', 'e4');
      gameService.makeMove('e7', 'e5');
      gameService.makeMove('g1', 'f3');
      
      gameService.goToMove(1);
      const gameState = gameService.getGameState();
      expect(gameState.turn).toBe('w');
    });

    test('should handle undo/redo', () => {
      gameService.makeMove('e2', 'e4');
      gameService.makeMove('e7', 'e5');
      
      const undoSuccess = gameService.undo();
      expect(undoSuccess).toBe(true);
      
      const redoSuccess = gameService.redo();
      expect(redoSuccess).toBe(true);
    });
  });

  describe('PGN Import/Export', () => {
    test('should load PGN correctly', () => {
      const pgn = '1. e4 e5 2. Nf3 Nc6 3. Bb5 a6';
      const success = gameService.loadPGN(pgn);
      
      expect(success).toBe(true);
      
      const moveTree = gameService.getMoveTree();
      expect(moveTree).toHaveLength(6);
    });

    test('should export PGN correctly', () => {
      gameService.makeMove('e2', 'e4');
      gameService.makeMove('e7', 'e5');
      
      const pgn = gameService.exportPGN();
      expect(pgn).toContain('1. e4 e5');
    });
  });

  describe('FEN Support', () => {
    test('should load FEN correctly', () => {
      const fen = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1';
      const success = gameService.loadFEN(fen);
      
      expect(success).toBe(true);
      
      const gameState = gameService.getGameState();
      expect(gameState.turn).toBe('b');
    });

    test('should export FEN correctly', () => {
      gameService.makeMove('e2', 'e4');
      
      const fen = gameService.getFEN();
      expect(fen).toContain('4P3');
    });
  });

  describe('Annotations', () => {
    test('should add annotations', () => {
      gameService.makeMove('e2', 'e4');
      
      const annotationId = gameService.addAnnotation({
        moveId: 'move_0',
        type: 'comment',
        content: 'Good opening move'
      });
      
      expect(annotationId).toBeDefined();
      
      const annotations = gameService.getAnnotations(0);
      expect(annotations).toHaveLength(1);
      expect(annotations[0].content).toBe('Good opening move');
    });

    test('should remove annotations', () => {
      gameService.makeMove('e2', 'e4');
      
      const annotationId = gameService.addAnnotation({
        moveId: 'move_0',
        type: 'comment',
        content: 'Test comment'
      });
      
      const success = gameService.removeAnnotation(annotationId);
      expect(success).toBe(true);
      
      const annotations = gameService.getAnnotations(0);
      expect(annotations).toHaveLength(0);
    });
  });
});

describe('ChessGameService', () => {
  let gameService: ChessGameService;

  beforeEach(() => {
    gameService = new ChessGameService();
  });

  describe('Game State Management', () => {
    test('should initialize with starting position', () => {
      const gameState = gameService.getGameState();
      expect(gameState.fen).toBe('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
      expect(gameState.turn).toBe('w');
      expect(gameState.checkmate).toBe(false);
      expect(gameState.stalemate).toBe(false);
    });

    test('should make valid moves', () => {
      const success = gameService.makeMove('e2', 'e4');
      expect(success).toBe(true);
      
      const gameState = gameService.getGameState();
      expect(gameState.turn).toBe('b');
    });

    test('should reject invalid moves', () => {
      const success = gameService.makeMove('e2', 'e5');
      expect(success).toBe(false);
    });
  });

  describe('Move Tree Management', () => {
    test('should build move tree correctly', () => {
      gameService.makeMove('e2', 'e4');
      gameService.makeMove('e7', 'e5');
      
      const moveTree = gameService.getMoveTree();
      expect(moveTree).toHaveLength(2);
      expect(moveTree[0].move.san).toBe('e4');
      expect(moveTree[1].move.san).toBe('e5');
    });

    test('should create variations', () => {
      gameService.makeMove('e2', 'e4');
      gameService.makeMove('e7', 'e5');
      
      // Go back and create variation
      gameService.goToMove(0);
      const success = gameService.createVariation(0, 'e7', 'e6');
      
      expect(success).toBe(true);
      
      const moveTree = gameService.getMoveTree();
      expect(moveTree[0].sublines).toHaveLength(1);
    });
  });

  describe('Navigation', () => {
    test('should navigate to specific moves', () => {
      gameService.makeMove('e2', 'e4');
      gameService.makeMove('e7', 'e5');
      gameService.makeMove('g1', 'f3');
      
      gameService.goToMove(1);
      const gameState = gameService.getGameState();
      expect(gameState.turn).toBe('w');
    });

    test('should handle undo/redo', () => {
      gameService.makeMove('e2', 'e4');
      gameService.makeMove('e7', 'e5');
      
      const undoSuccess = gameService.undo();
      expect(undoSuccess).toBe(true);
      
      const redoSuccess = gameService.redo();
      expect(redoSuccess).toBe(true);
    });
  });

  describe('PGN Import/Export', () => {
    test('should load PGN correctly', () => {
      const pgn = '1. e4 e5 2. Nf3 Nc6 3. Bb5 a6';
      const success = gameService.loadPGN(pgn);
      
      expect(success).toBe(true);
      
      const moveTree = gameService.getMoveTree();
      expect(moveTree).toHaveLength(6);
    });

    test('should export PGN correctly', () => {
      gameService.makeMove('e2', 'e4');
      gameService.makeMove('e7', 'e5');
      
      const pgn = gameService.exportPGN();
      expect(pgn).toContain('1. e4 e5');
    });
  });

  describe('FEN Support', () => {
    test('should load FEN correctly', () => {
      const fen = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1';
      const success = gameService.loadFEN(fen);
      
      expect(success).toBe(true);
      
      const gameState = gameService.getGameState();
      expect(gameState.turn).toBe('b');
    });

    test('should export FEN correctly', () => {
      gameService.makeMove('e2', 'e4');
      
      const fen = gameService.getFEN();
      expect(fen).toContain('4P3');
    });
  });

  describe('Annotations', () => {
    test('should add annotations', () => {
      gameService.makeMove('e2', 'e4');
      
      const annotationId = gameService.addAnnotation({
        moveId: 'move_0',
        type: 'comment',
        content: 'Good opening move'
      });
      
      expect(annotationId).toBeDefined();
      
      const annotations = gameService.getAnnotations(0);
      expect(annotations).toHaveLength(1);
      expect(annotations[0].content).toBe('Good opening move');
    });

    test('should remove annotations', () => {
      gameService.makeMove('e2', 'e4');
      
      const annotationId = gameService.addAnnotation({
        moveId: 'move_0',
        type: 'comment',
        content: 'Test comment'
      });
      
      const success = gameService.removeAnnotation(annotationId);
      expect(success).toBe(true);
      
      const annotations = gameService.getAnnotations(0);
      expect(annotations).toHaveLength(0);
    });
  });
});

describe('ChessGameService', () => {
  let gameService: ChessGameService;

  beforeEach(() => {
    gameService = new ChessGameService();
  });

  describe('Game State Management', () => {
    test('should initialize with starting position', () => {
      const gameState = gameService.getGameState();
      expect(gameState.fen).toBe('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
      expect(gameState.turn).toBe('w');
      expect(gameState.checkmate).toBe(false);
      expect(gameState.stalemate).toBe(false);
    });

    test('should make valid moves', () => {
      const success = gameService.makeMove('e2', 'e4');
      expect(success).toBe(true);
      
      const gameState = gameService.getGameState();
      expect(gameState.turn).toBe('b');
    });

    test('should reject invalid moves', () => {
      const success = gameService.makeMove('e2', 'e5');
      expect(success).toBe(false);
    });
  });

  describe('Move Tree Management', () => {
    test('should build move tree correctly', () => {
      gameService.makeMove('e2', 'e4');
      gameService.makeMove('e7', 'e5');
      
      const moveTree = gameService.getMoveTree();
      expect(moveTree).toHaveLength(2);
      expect(moveTree[0].move.san).toBe('e4');
      expect(moveTree[1].move.san).toBe('e5');
    });

    test('should create variations', () => {
      gameService.makeMove('e2', 'e4');
      gameService.makeMove('e7', 'e5');
      
      // Go back and create variation
      gameService.goToMove(0);
      const success = gameService.createVariation(0, 'e7', 'e6');
      
      expect(success).toBe(true);
      
      const moveTree = gameService.getMoveTree();
      expect(moveTree[0].sublines).toHaveLength(1);
    });
  });

  describe('Navigation', () => {
    test('should navigate to specific moves', () => {
      gameService.makeMove('e2', 'e4');
      gameService.makeMove('e7', 'e5');
      gameService.makeMove('g1', 'f3');
      
      gameService.goToMove(1);
      const gameState = gameService.getGameState();
      expect(gameState.turn).toBe('w');
    });

    test('should handle undo/redo', () => {
      gameService.makeMove('e2', 'e4');
      gameService.makeMove('e7', 'e5');
      
      const undoSuccess = gameService.undo();
      expect(undoSuccess).toBe(true);
      
      const redoSuccess = gameService.redo();
      expect(redoSuccess).toBe(true);
    });
  });

  describe('PGN Import/Export', () => {
    test('should load PGN correctly', () => {
      const pgn = '1. e4 e5 2. Nf3 Nc6 3. Bb5 a6';
      const success = gameService.loadPGN(pgn);
      
      expect(success).toBe(true);
      
      const moveTree = gameService.getMoveTree();
      expect(moveTree).toHaveLength(6);
    });

    test('should export PGN correctly', () => {
      gameService.makeMove('e2', 'e4');
      gameService.makeMove('e7', 'e5');
      
      const pgn = gameService.exportPGN();
      expect(pgn).toContain('1. e4 e5');
    });
  });

  describe('FEN Support', () => {
    test('should load FEN correctly', () => {
      const fen = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1';
      const success = gameService.loadFEN(fen);
      
      expect(success).toBe(true);
      
      const gameState = gameService.getGameState();
      expect(gameState.turn).toBe('b');
    });

    test('should export FEN correctly', () => {
      gameService.makeMove('e2', 'e4');
      
      const fen = gameService.getFEN();
      expect(fen).toContain('4P3');
    });
  });

  describe('Annotations', () => {
    test('should add annotations', () => {
      gameService.makeMove('e2', 'e4');
      
      const annotationId = gameService.addAnnotation({
        moveId: 'move_0',
        type: 'comment',
        content: 'Good opening move'
      });
      
      expect(annotationId).toBeDefined();
      
      const annotations = gameService.getAnnotations(0);
      expect(annotations).toHaveLength(1);
      expect(annotations[0].content).toBe('Good opening move');
    });

    test('should remove annotations', () => {
      gameService.makeMove('e2', 'e4');
      
      const annotationId = gameService.addAnnotation({
        moveId: 'move_0',
        type: 'comment',
        content: 'Test comment'
      });
      
      const success = gameService.removeAnnotation(annotationId);
      expect(success).toBe(true);
      
      const annotations = gameService.getAnnotations(0);
      expect(annotations).toHaveLength(0);
    });
  });
});

describe('ChessGameService', () => {
  let gameService: ChessGameService;

  beforeEach(() => {
    gameService = new ChessGameService();
  });

  describe('Game State Management', () => {
    test('should initialize with starting position', () => {
      const gameState = gameService.getGameState();
      expect(gameState.fen).toBe('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
      expect(gameState.turn).toBe('w');
      expect(gameState.checkmate).toBe(false);
      expect(gameState.stalemate).toBe(false);
    });

    test('should make valid moves', () => {
      const success = gameService.makeMove('e2', 'e4');
      expect(success).toBe(true);
      
      const gameState = gameService.getGameState();
      expect(gameState.turn).toBe('b');
    });

    test('should reject invalid moves', () => {
      const success = gameService.makeMove('e2', 'e5');
      expect(success).toBe(false);
    });
  });

  describe('Move Tree Management', () => {
    test('should build move tree correctly', () => {
      gameService.makeMove('e2', 'e4');
      gameService.makeMove('e7', 'e5');
      
      const moveTree = gameService.getMoveTree();
      expect(moveTree).toHaveLength(2);
      expect(moveTree[0].move.san).toBe('e4');
      expect(moveTree[1].move.san).toBe('e5');
    });

    test('should create variations', () => {
      gameService.makeMove('e2', 'e4');
      gameService.makeMove('e7', 'e5');
      
      // Go back and create variation
      gameService.goToMove(0);
      const success = gameService.createVariation(0, 'e7', 'e6');
      
      expect(success).toBe(true);
      
      const moveTree = gameService.getMoveTree();
      expect(moveTree[0].sublines).toHaveLength(1);
    });
  });

  describe('Navigation', () => {
    test('should navigate to specific moves', () => {
      gameService.makeMove('e2', 'e4');
      gameService.makeMove('e7', 'e5');
      gameService.makeMove('g1', 'f3');
      
      gameService.goToMove(1);
      const gameState = gameService.getGameState();
      expect(gameState.turn).toBe('w');
    });

    test('should handle undo/redo', () => {
      gameService.makeMove('e2', 'e4');
      gameService.makeMove('e7', 'e5');
      
      const undoSuccess = gameService.undo();
      expect(undoSuccess).toBe(true);
      
      const redoSuccess = gameService.redo();
      expect(redoSuccess).toBe(true);
    });
  });

  describe('PGN Import/Export', () => {
    test('should load PGN correctly', () => {
      const pgn = '1. e4 e5 2. Nf3 Nc6 3. Bb5 a6';
      const success = gameService.loadPGN(pgn);
      
      expect(success).toBe(true);
      
      const moveTree = gameService.getMoveTree();
      expect(moveTree).toHaveLength(6);
    });

    test('should export PGN correctly', () => {
      gameService.makeMove('e2', 'e4');
      gameService.makeMove('e7', 'e5');
      
      const pgn = gameService.exportPGN();
      expect(pgn).toContain('1. e4 e5');
    });
  });

  describe('FEN Support', () => {
    test('should load FEN correctly', () => {
      const fen = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1';
      const success = gameService.loadFEN(fen);
      
      expect(success).toBe(true);
      
      const gameState = gameService.getGameState();
      expect(gameState.turn).toBe('b');
    });

    test('should export FEN correctly', () => {
      gameService.makeMove('e2', 'e4');
      
      const fen = gameService.getFEN();
      expect(fen).toContain('4P3');
    });
  });

  describe('Annotations', () => {
    test('should add annotations', () => {
      gameService.makeMove('e2', 'e4');
      
      const annotationId = gameService.addAnnotation({
        moveId: 'move_0',
        type: 'comment',
        content: 'Good opening move'
      });
      
      expect(annotationId).toBeDefined();
      
      const annotations = gameService.getAnnotations(0);
      expect(annotations).toHaveLength(1);
      expect(annotations[0].content).toBe('Good opening move');
    });

    test('should remove annotations', () => {
      gameService.makeMove('e2', 'e4');
      
      const annotationId = gameService.addAnnotation({
        moveId: 'move_0',
        type: 'comment',
        content: 'Test comment'
      });
      
      const success = gameService.removeAnnotation(annotationId);
      expect(success).toBe(true);
      
      const annotations = gameService.getAnnotations(0);
      expect(annotations).toHaveLength(0);
    });
  });
});




































































