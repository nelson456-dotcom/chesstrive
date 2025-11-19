import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Chess } from 'chess.js';
import { ProductionChessBoard } from './ProductionChessBoard';
import { OpeningTree } from './OpeningTree';
import { EvaluationBar } from './EvaluationBar';
import { EngineLines } from './EngineLines';
import { MultiPVAnalysisPanel } from './MultiPVAnalysisPanel';
import { CompleteMoveTree } from './CompleteMoveTree';
import { GameState, AnalysisConfig, BoardConfig } from '../types/chess';
import { ChessGameService } from '../services/ChessGameService';
import stockfishCloudService from '../services/StockfishCloudService';
import './EnhancedAnalysisBoard.css';

// Custom hook for responsive board size
const useResponsiveBoardSize = () => {
  const [boardSize, setBoardSize] = useState(600);

  useEffect(() => {
    const calculateBoardSize = () => {
      const width = window.innerWidth;
      if (width < 480) {
        setBoardSize(280);
      } else if (width < 768) {
        setBoardSize(350);
      } else if (width < 1200) {
        setBoardSize(450);
      } else if (width < 1400) {
        setBoardSize(550);
      } else {
        setBoardSize(600);
      }
    };

    calculateBoardSize();
    window.addEventListener('resize', calculateBoardSize);
    return () => window.removeEventListener('resize', calculateBoardSize);
  }, []);

  return boardSize;
};

interface EnhancedAnalysisBoardProps {
  initialFEN?: string;
  initialPGN?: string;
  onGameChange?: (gameState: GameState) => void;
  className?: string;
}

export const EnhancedAnalysisBoard: React.FC<EnhancedAnalysisBoardProps> = ({
  initialFEN,
  initialPGN,
  onGameChange,
  className = ''
}) => {
  // Responsive board size
  const boardSize = useResponsiveBoardSize();

  // Game state
  const [gameService] = useState(() => {
    console.log('🎯 Initializing ChessGameService with FEN:', initialFEN);
    const service = new ChessGameService(initialFEN);
    console.log('🎯 Initial moveTree:', service.getMoveTree());
    return service;
  });
  const [gameState, setGameState] = useState<GameState>(() => {
    const state = gameService.getGameState();
    console.log('🎯 Initial gameState:', state);
    return state;
  });

  // Helper function to update game state when moves change
  const updateGameState = useCallback(() => {
    const newGameState = gameService.getGameState();
    setGameState(newGameState);
    onGameChange?.(newGameState);
  }, [gameService, onGameChange]);

  // Load PGN when it changes
  useEffect(() => {
    if (initialPGN) {
      console.log('🎯 Loading PGN:', initialPGN);
      const success = gameService.loadPGN(initialPGN);
      if (success) {
        updateGameState();
      }
    }
  }, [initialPGN, gameService, updateGameState]);

  // Analysis state
  const [analysisConfig, setAnalysisConfig] = useState<AnalysisConfig>({
    depth: 20,
    multiPV: 5,
    timeLimit: 10000,
    useCloudAnalysis: false,
    showEngineLines: true,
    showEvaluation: true,
    showBestMoves: true
  });

  // Board state
  const [boardConfig] = useState<BoardConfig>({
    orientation: 'white',
    showCoordinates: true,
    showLastMove: true,
    showLegalMoves: false,
    animationDuration: 200,
    pieceSet: 'default',
    boardTheme: 'default'
  });

  // UI state
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [engineMoves, setEngineMoves] = useState<any[]>([]);
  const [evaluation, setEvaluation] = useState<number>(0);
  const [isEngineReady, setIsEngineReady] = useState(false);
  const [openingMoves, setOpeningMoves] = useState<any[]>([]);
  const [openingStats, setOpeningStats] = useState<any>(null);
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);

  // Mock opening data for demonstration
  const getOpeningMoves = (fen: string) => {
    const openingData: Record<string, any[]> = {
      'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1': [
        {
          fen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1',
          move: 'e2e4',
          san: 'e4',
          uci: 'e2e4',
          white: 1250000,
          draws: 800000,
          black: 950000,
          total: 3000000,
          averageRating: 1800,
          eco: 'B00',
          name: 'King\'s Pawn Game',
          winRate: { white: '41.7', black: '31.7', draws: '26.7' }
        },
        {
          fen: 'rnbqkbnr/pppppppp/8/8/3P4/8/PPP1PPPP/RNBQKBNR b KQkq d3 0 1',
          move: 'd2d4',
          san: 'd4',
          uci: 'd2d4',
          white: 980000,
          draws: 750000,
          black: 720000,
          total: 2450000,
          averageRating: 1850,
          eco: 'D00',
          name: 'Queen\'s Pawn Game',
          winRate: { white: '40.0', black: '29.4', draws: '30.6' }
        },
        {
          fen: 'rnbqkbnr/pppppppp/8/8/8/5N2/PPPPPPPP/RNBQKB1R b KQkq - 1 1',
          move: 'g1f3',
          san: 'Nf3',
          uci: 'g1f3',
          white: 450000,
          draws: 350000,
          black: 300000,
          total: 1100000,
          averageRating: 1900,
          eco: 'A00',
          name: 'Reti Opening',
          winRate: { white: '40.9', black: '27.3', draws: '31.8' }
        }
      ],
      'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1': [
        {
          fen: 'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2',
          move: 'e7e5',
          san: 'e5',
          uci: 'e7e5',
          white: 800000,
          draws: 600000,
          black: 600000,
          total: 2000000,
          averageRating: 1750,
          eco: 'C20',
          name: 'King\'s Pawn Game',
          winRate: { white: '40.0', black: '30.0', draws: '30.0' }
        },
        {
          fen: 'rnbqkbnr/pppppppp/8/8/4p3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2',
          move: 'c7c5',
          san: 'c5',
          uci: 'c7c5',
          white: 700000,
          draws: 500000,
          black: 800000,
          total: 2000000,
          averageRating: 1800,
          eco: 'B20',
          name: 'Sicilian Defense',
          winRate: { white: '35.0', black: '40.0', draws: '25.0' }
        }
      ]
    };
    return openingData[fen] || [];
  };

  // Refs
  const analysisTimeoutRef = useRef<NodeJS.Timeout>();


  // Initialize engine
  useEffect(() => {
    const initEngine = async () => {
      try {
        await stockfishCloudService.analyzePosition(gameState.fen, analysisConfig);
        setIsEngineReady(true);
      } catch (error) {
        console.error('Failed to initialize engine:', error);
      }
    };

    initEngine();
  }, []);

  // Move tree state for reactive updates
  const [moveTree, setMoveTree] = useState(() => gameService.getMoveTree());
  const [currentMoveIndex, setCurrentMoveIndex] = useState(() => gameService.getCurrentMoveIndex());

  // Update move tree state when game state changes
  useEffect(() => {
    console.log('🎯 Updating move tree state, gameState.fen:', gameState.fen);
    const newMoveTree = gameService.getMoveTree();
    const newCurrentMoveIndex = gameService.getCurrentMoveIndex();
    console.log('🎯 New move tree:', newMoveTree);
    console.log('🎯 New current move index:', newCurrentMoveIndex);
    setMoveTree(newMoveTree);
    setCurrentMoveIndex(newCurrentMoveIndex);
  }, [gameState.fen, gameService]);


  // Analyze position when it changes - with debouncing
  useEffect(() => {
    if (isEngineReady && analysisConfig.showEngineLines) {
      // Debounce analysis to avoid excessive requests when navigating quickly
      const timeoutId = setTimeout(() => {
        analyzePosition();
      }, 300); // 300ms debounce

      return () => {
        clearTimeout(timeoutId);
        // Cancel any ongoing analysis if position changes
        if (updateThrottleRef.current) {
          clearTimeout(updateThrottleRef.current);
          updateThrottleRef.current = null;
        }
      };
    }
  }, [gameState.fen, isEngineReady, analysisConfig.showEngineLines, analyzePosition]);

  // Update opening moves when position changes
  useEffect(() => {
    const moves = getOpeningMoves(gameState.fen);
    setOpeningMoves(moves);
    setOpeningStats({
      totalGames: moves.reduce((sum, move) => sum + move.total, 0),
      averageRating: moves.length > 0 ? Math.round(moves.reduce((sum, move) => sum + move.averageRating, 0) / moves.length) : 0
    });
  }, [gameState.fen]);

  // Load opening data when position changes
  const loadOpeningData = useCallback(async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/opening/moves?fen=${encodeURIComponent(gameState.fen)}&limit=10`);
      if (response.ok) {
        const data = await response.json();
        setOpeningMoves(data.moves || []);
      }

      const statsResponse = await fetch(`${process.env.REACT_APP_API_URL}/api/opening/stats?fen=${encodeURIComponent(gameState.fen)}`);
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setOpeningStats(statsData.stats || null);
      }
    } catch (error) {
      console.error('Failed to load opening data:', error);
    }
  }, [gameState.fen]);

  useEffect(() => {
    loadOpeningData();
  }, [loadOpeningData]);

  // Throttle UI updates to avoid excessive reflows
  const updateThrottleRef = useRef<NodeJS.Timeout | null>(null);
  const lastUpdateTimeRef = useRef<number>(0);
  const THROTTLE_MS = 100; // Update UI at most every 100ms

  const analyzePosition = useCallback(async () => {
    if (!isEngineReady) return;

    // Check if position is terminal (mate/stalemate)
    try {
      const game = new Chess(gameState.fen);
      if (game.isGameOver()) {
        setEngineMoves([]);
        setIsAnalyzing(false);
        return;
      }
    } catch (error) {
      console.error('Error checking game state:', error);
    }

    setIsAnalyzing(true);
    setEngineMoves([]); // Clear previous moves
    
    // Clear previous timeout
    if (analysisTimeoutRef.current) {
      clearTimeout(analysisTimeoutRef.current);
    }

    // Cancel any pending throttled updates
    if (updateThrottleRef.current) {
      clearTimeout(updateThrottleRef.current);
      updateThrottleRef.current = null;
    }

    try {
      const moves = await stockfishCloudService.analyzePosition(gameState.fen, analysisConfig);
      
      // Throttle UI update
      const now = Date.now();
      if (now - lastUpdateTimeRef.current < THROTTLE_MS) {
        if (updateThrottleRef.current) {
          clearTimeout(updateThrottleRef.current);
        }
        updateThrottleRef.current = setTimeout(() => {
          setEngineMoves(moves);
          lastUpdateTimeRef.current = Date.now();
          updateThrottleRef.current = null;
        }, THROTTLE_MS - (now - lastUpdateTimeRef.current));
      } else {
        setEngineMoves(moves);
        lastUpdateTimeRef.current = now;
      }
      
      // Get evaluation separately
      const evaluation = await stockfishCloudService.getEvaluation(gameState.fen);
      if (evaluation) {
        setEvaluation(evaluation.value || 0);
      }
    } catch (error) {
      console.error('Analysis failed:', error);
      setEngineMoves([]);
      // Show error state - could add a toast notification here
    } finally {
      setIsAnalyzing(false);
    }
  }, [gameState.fen, analysisConfig, isEngineReady]);

  const handleMove = useCallback((from: string, to: string, promotion?: string) => {
    console.log('🎯 handleMove called with:', { from, to, promotion });
    console.log('🎯 Current game state:', gameState);
    try {
      const success = gameService.makeMove(from, to, promotion);
      console.log('🎯 handleMove success:', success);
      if (success) {
        updateGameState();
      }
      return success;
    } catch (error) {
      console.error('Invalid move:', error);
      return false;
    }
  }, [gameService, updateGameState, gameState]);

  const handleEngineMoveClick = useCallback((moveString: string) => {
    console.log('🎯 handleEngineMoveClick called with:', moveString);
    // Parse the move string (assuming it's in UCI format like "e2e4")
    if (moveString && moveString.length >= 4) {
      const from = moveString.substring(0, 2);
      const to = moveString.substring(2, 4);
      const promotion = moveString.length > 4 ? moveString.substring(4) : undefined;
      
      const success = gameService.makeMove(from, to, promotion);
      if (success) {
        updateGameState();
      }
      setSelectedSquare(null);
    }
  }, [gameService, updateGameState]);

  // Handle adopting a full PV line
  const handleAdoptLine = useCallback((moves: string[]) => {
    console.log('🎯 handleAdoptLine called with moves:', moves);
    if (!moves || moves.length === 0) return;

    // Create a temporary game to validate moves
    const tempGame = new Chess(gameState.fen);
    const validMoves: Array<{ from: string; to: string; promotion?: string }> = [];

    for (const moveSan of moves) {
      try {
        const move = tempGame.move(moveSan);
        if (move) {
          validMoves.push({
            from: move.from,
            to: move.to,
            promotion: move.promotion
          });
        } else {
          console.warn('Invalid move in PV:', moveSan);
          break;
        }
      } catch (error) {
        console.warn('Error parsing move:', moveSan, error);
        break;
      }
    }

    // Apply all moves to the actual game
    for (const move of validMoves) {
      const success = gameService.makeMove(move.from, move.to, move.promotion);
      if (!success) {
        console.warn('Failed to apply move:', move);
        break;
      }
    }

    updateGameState();
    setSelectedSquare(null);
  }, [gameService, updateGameState, gameState.fen]);

  // Handle previewing a line (temporary board visualization)
  const [previewPosition, setPreviewPosition] = useState<string | null>(null);
  const handlePreviewLine = useCallback((moves: string[], isPreviewing: boolean) => {
    console.log('🎯 handlePreviewLine called:', { moves, isPreviewing });
    
    if (!isPreviewing || !moves || moves.length === 0) {
      setPreviewPosition(null);
      return;
    }

    // Create a temporary game to calculate preview position
    const tempGame = new Chess(gameState.fen);
    let lastValidFEN = gameState.fen;

    for (const moveSan of moves) {
      try {
        const move = tempGame.move(moveSan);
        if (move) {
          lastValidFEN = tempGame.fen();
        } else {
          break;
        }
      } catch (error) {
        break;
      }
    }

    setPreviewPosition(lastValidFEN);
  }, [gameState.fen]);

  // Handle inserting PV as variation
  const handleInsertAsVariation = useCallback((moves: string[]) => {
    console.log('🎯 handleInsertAsVariation called with moves:', moves);
    // This would need to be implemented based on the game service's variation handling
    // For now, we'll just adopt the line
    // TODO: Implement proper variation insertion when the game service supports it
    handleAdoptLine(moves);
  }, [handleAdoptLine]);



  const handleSquareClick = useCallback((square: string) => {
    console.log('🎯 handleSquareClick called with:', square, 'selectedSquare:', selectedSquare);
    if (selectedSquare) {
      // Try to make a move from selected square to clicked square
      const success = gameService.makeMove(selectedSquare, square);
      console.log('🎯 handleSquareClick move success:', success);
      if (success) {
        updateGameState();
        setSelectedSquare(null);
      } else {
        // If move failed, select the new square if it has a piece of the current player
        const game = new Chess(gameState.fen);
        const piece = game.get(square);
        if (piece && piece.color === game.turn()) {
          setSelectedSquare(square);
        } else {
          setSelectedSquare(null);
        }
      }
    } else {
      // No square selected, select this square if it has a piece of the current player
      const game = new Chess(gameState.fen);
      const piece = game.get(square);
      if (piece && piece.color === game.turn()) {
        setSelectedSquare(square);
      }
    }
  }, [selectedSquare, gameService, gameState.fen, updateGameState]);

  const handlePieceDrop = useCallback((sourceSquare: string, targetSquare: string, piece?: string) => {
    console.log('🎯 handlePieceDrop called with:', sourceSquare, 'to', targetSquare, 'piece:', piece);
    try {
      const success = gameService.makeMove(sourceSquare, targetSquare);
      console.log('🎯 handlePieceDrop success:', success);
      if (success) {
        updateGameState();
        setSelectedSquare(null);
      }
      return success;
    } catch (error) {
      console.error('Invalid move:', error);
      return false;
    }
  }, [gameService, updateGameState]);

  const handleOpeningMoveClick = useCallback((move: any) => {
    try {
      // Parse UCI move (e.g., "e2e4" -> from: "e2", to: "e4")
      const from = move.uci.substring(0, 2);
      const to = move.uci.substring(2, 4);
      const promotion = move.uci.length > 4 ? move.uci.substring(4, 5) : undefined;
      
      const success = gameService.makeMove(from, to, promotion);
      if (success) {
        updateGameState();
      }
    } catch (error) {
      console.error('Invalid opening move:', error);
    }
  }, [gameService, updateGameState]);

  const handleMoveClick = useCallback((moveId: string) => {
    console.log('🎯 handleMoveClick called with moveId:', moveId);
    try {
      // Find the move in the move tree and navigate to it
      const success = gameService.goToMoveByIndex(gameService.getMoveTree().findIndex(move => move.id === moveId));
      if (success) {
        updateGameState();
      }
    } catch (error) {
      console.error('Invalid move navigation:', error);
    }
  }, [gameService, updateGameState]);

  const handleVariationClick = useCallback((variationId: string) => {
    console.log('🎯 handleVariationClick called with variationId:', variationId);
    try {
      const success = gameService.goToVariation(variationId);
      if (success) {
        updateGameState();
      }
    } catch (error) {
      console.error('Invalid variation navigation:', error);
    }
  }, [gameService, updateGameState]);

  const handleAnnotationClick = useCallback((annotationId: string) => {
    console.log('🎯 handleAnnotationClick called with annotationId:', annotationId);
    // Handle annotation click - could show details, edit, etc.
  }, []);

  // Navigation functions for keyboard controls
  const goToPreviousMove = useCallback(() => {
    if (currentMoveIndex > 0) {
      const success = gameService.goToMoveByIndex(currentMoveIndex - 1);
      if (success) {
        updateGameState();
      }
    }
  }, [currentMoveIndex, gameService, updateGameState]);

  const goToNextMove = useCallback(() => {
    if (currentMoveIndex < moveTree.length - 1) {
      const success = gameService.goToMoveByIndex(currentMoveIndex + 1);
      if (success) {
        updateGameState();
      }
    }
  }, [currentMoveIndex, moveTree.length, gameService, updateGameState]);

  const goToFirstMove = useCallback(() => {
    if (moveTree.length > 0) {
      const success = gameService.goToMoveByIndex(0);
      if (success) {
        updateGameState();
      }
    }
  }, [moveTree.length, gameService, updateGameState]);

  const goToLastMove = useCallback(() => {
    if (moveTree.length > 0) {
      const success = gameService.goToMoveByIndex(moveTree.length - 1);
      if (success) {
        updateGameState();
      }
    }
  }, [moveTree.length, gameService, updateGameState]);

  const clearSelection = useCallback(() => {
    setSelectedSquare(null);
  }, []);

  // Keyboard controls for move navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle keyboard shortcuts when not typing in input fields
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault();
          goToPreviousMove();
          break;
        case 'ArrowRight':
          event.preventDefault();
          goToNextMove();
          break;
        case ' ':
          event.preventDefault();
          goToNextMove();
          break;
        case 'Home':
          event.preventDefault();
          goToFirstMove();
          break;
        case 'End':
          event.preventDefault();
          goToLastMove();
          break;
        case 'Escape':
          event.preventDefault();
          clearSelection();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToPreviousMove, goToNextMove, goToFirstMove, goToLastMove, clearSelection]);


  console.log('🎯 EnhancedAnalysisBoard render:', { 
    boardSize, 
    gameState: gameState.fen, 
    boardConfig 
  });

  return (
    <div className={`enhanced-analysis-board ${className}`}>
      <div className="analysis-layout">
        {/* Left Panel - Board and Evaluation */}
        <div className="board-panel">
          <div className="board-container">
            <ProductionChessBoard
              position={previewPosition || gameState.fen}
              onMove={handleMove}
              onSquareClick={handleSquareClick}
              onPieceDrop={handlePieceDrop}
              boardOrientation={boardConfig.orientation}
              showCoordinates={boardConfig.showCoordinates}
              showLastMove={boardConfig.showLastMove}
              showLegalMoves={boardConfig.showLegalMoves}
              selectedSquare={selectedSquare}
              customSquareStyles={previewPosition ? {
                // Highlight that this is a preview
              } : {}}
              boardSize={boardSize}
              arePiecesDraggable={true}
              areArrowsAllowed={true}
              animationDuration={boardConfig.animationDuration}
            />
            {previewPosition && (
              <div className="preview-overlay">
                <span>Preview Mode</span>
              </div>
            )}
          </div>
          
          {/* Evaluation Bar */}
          {analysisConfig.showEvaluation && (
            <EvaluationBar
              evaluation={evaluation}
              isAnalyzing={isAnalyzing}
              depth={analysisConfig.depth}
            />
          )}


          {/* Multi-PV Analysis Panel */}
          {analysisConfig.showEngineLines && (
            <MultiPVAnalysisPanel
              lines={engineMoves}
              currentFEN={gameState.fen}
              isAnalyzing={isAnalyzing}
              onAdoptLine={handleAdoptLine}
              onPreviewLine={handlePreviewLine}
              onInsertAsVariation={handleInsertAsVariation}
            />
          )}
        </div>

        {/* Right Panel - Move Tree and Opening Tree */}
        <div className="right-panel">
          <div className="right-panel-content">
            {/* Complete Move Tree Section */}
            <div className="move-tree-section">
              <div className="section-header">
                <h3>Complete Move Tree</h3>
              </div>
              <div className="section-content">
                <CompleteMoveTree
                  moveTree={moveTree}
                  currentMoveIndex={currentMoveIndex}
                  onMoveClick={handleMoveClick}
                  onVariationClick={handleVariationClick}
                  onAnnotationClick={handleAnnotationClick}
                />
              </div>
            </div>

            {/* Opening Tree Section */}
            <div className="opening-tree-section">
              <div className="section-header">
                <h3>Opening Tree</h3>
              </div>
              <div className="section-content">
                <OpeningTree
                  moves={openingMoves}
                  stats={openingStats}
                  onMoveClick={handleOpeningMoveClick}
                  currentFEN={gameState.fen}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Analysis Controls */}
      <div className="analysis-controls">
        <div className="control-group">
          <label>Depth:</label>
          <input
            type="range"
            min="5"
            max="25"
            value={analysisConfig.depth}
            onChange={(e) => setAnalysisConfig(prev => ({ ...prev, depth: parseInt(e.target.value) }))}
          />
          <span>{analysisConfig.depth}</span>
        </div>

        <div className="control-group">
          <label>Multi-PV:</label>
          <select
            value={analysisConfig.multiPV}
            onChange={(e) => setAnalysisConfig(prev => ({ ...prev, multiPV: parseInt(e.target.value) }))}
          >
            <option value={1}>1</option>
            <option value={2}>2</option>
            <option value={3}>3</option>
            <option value={5}>5</option>
          </select>
        </div>

        <div className="control-group">
          <label>
            <input
              type="checkbox"
              checked={analysisConfig.showEngineLines}
              onChange={(e) => setAnalysisConfig(prev => ({ ...prev, showEngineLines: e.target.checked }))}
            />
            Engine Lines
          </label>
        </div>

        <div className="control-group">
          <label>
            <input
              type="checkbox"
              checked={analysisConfig.showEvaluation}
              onChange={(e) => setAnalysisConfig(prev => ({ ...prev, showEvaluation: e.target.checked }))}
            />
            Evaluation
          </label>
        </div>

        <div className="control-group">
          <button
            onClick={() => setShowKeyboardHelp(!showKeyboardHelp)}
            className="keyboard-help-button"
          >
            {showKeyboardHelp ? 'Hide' : 'Show'} Keyboard Shortcuts
          </button>
        </div>
      </div>

      {/* Keyboard Help Panel */}
      {showKeyboardHelp && (
        <div className="keyboard-help-panel">
          <h3>Keyboard Shortcuts</h3>
          <div className="shortcuts-grid">
            <div className="shortcut-item">
              <kbd>←</kbd>
              <span>Previous move</span>
            </div>
            <div className="shortcut-item">
              <kbd>→</kbd>
              <span>Next move</span>
            </div>
            <div className="shortcut-item">
              <kbd>Space</kbd>
              <span>Next move</span>
            </div>
            <div className="shortcut-item">
              <kbd>Home</kbd>
              <span>First move</span>
            </div>
            <div className="shortcut-item">
              <kbd>End</kbd>
              <span>Last move</span>
            </div>
            <div className="shortcut-item">
              <kbd>Esc</kbd>
              <span>Clear selection</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedAnalysisBoard;
