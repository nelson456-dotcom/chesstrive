// Main analysis board component

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ProductionChessBoard } from './ProductionChessBoard';
import { MoveTree } from './MoveTree';
import { GameState, MoveNode, Annotation, AnalysisConfig, BoardConfig } from '../types/chess';
import { ChessGameService } from '../services/ChessGameService';
import { stockfishService } from '../services/StockfishService';

interface AnalysisBoardProps {
  initialFEN?: string;
  initialPGN?: string;
  onGameChange?: (gameState: GameState) => void;
  onMoveTreeChange?: (moveTree: MoveNode[]) => void;
  className?: string;
}

export const AnalysisBoard: React.FC<AnalysisBoardProps> = ({
  initialFEN,
  initialPGN,
  onGameChange,
  onMoveTreeChange,
  className = ''
}) => {
  // Game state
  const [gameService] = useState(() => new ChessGameService(initialFEN));
  const [gameState, setGameState] = useState<GameState>(gameService.getGameState());
  const [moveTree, setMoveTree] = useState<MoveNode[]>(gameService.getMoveTree());
  const [currentMoveIndex, setCurrentMoveIndex] = useState(-1);

  // Analysis state
  const [analysisConfig, setAnalysisConfig] = useState<AnalysisConfig>({
    depth: 15,
    multiPV: 3,
    timeLimit: 5000,
    useCloudAnalysis: false,
    showEngineLines: true,
    showEvaluation: true,
    showBestMoves: true
  });

  // Board state
  const [boardConfig, setBoardConfig] = useState<BoardConfig>({
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

  // Refs
  const analysisTimeoutRef = useRef<NodeJS.Timeout>();

  // Initialize engine
  useEffect(() => {
    const initEngine = async () => {
      try {
        await stockfishService.analyzePosition(gameState.fen, analysisConfig);
        setIsEngineReady(true);
      } catch (error) {
        console.error('Failed to initialize engine:', error);
      }
    };

    initEngine();
  }, []);

  // Update game state when moves change
  useEffect(() => {
    const newGameState = gameService.getGameState();
    setGameState(newGameState);
    onGameChange?.(newGameState);
  }, [moveTree, onGameChange]);

  // Update move tree when moves change
  useEffect(() => {
    const newMoveTree = gameService.getMoveTree();
    setMoveTree(newMoveTree);
    onMoveTreeChange?.(newMoveTree);
  }, [moveTree, onMoveTreeChange]);

  // Analyze position when it changes
  useEffect(() => {
    if (isEngineReady && analysisConfig.showEngineLines) {
      analyzePosition();
    }
  }, [gameState.fen, isEngineReady, analysisConfig]);

  const analyzePosition = useCallback(async () => {
    if (!isEngineReady) return;

    setIsAnalyzing(true);
    
    try {
      const moves = await stockfishService.analyzePosition(gameState.fen, analysisConfig);
      setEngineMoves(moves);
      
      if (moves.length > 0) {
        setEvaluation(moves[0].evaluation.value);
      }
    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [gameState.fen, analysisConfig, isEngineReady]);

  const handleMove = useCallback((from: string, to: string, promotion?: string) => {
    const success = gameService.makeMove(from, to, promotion);
    if (success) {
      setCurrentMoveIndex(gameService.getCurrentMoveIndex());
      setSelectedSquare(null);
    }
    return success;
  }, [gameService]);

  const handleMoveClick = useCallback((moveIndex: number) => {
    gameService.goToMove(moveIndex);
    setCurrentMoveIndex(moveIndex);
    setSelectedSquare(null);
  }, [gameService]);

  const handleVariationClick = useCallback((variationId: string) => {
    const success = gameService.goToVariation(variationId);
    if (success) {
      setCurrentMoveIndex(gameService.getCurrentMoveIndex());
      setSelectedSquare(null);
    }
  }, [gameService]);

  const handleSquareClick = useCallback((square: string) => {
    if (selectedSquare) {
      handleMove(selectedSquare, square);
    } else {
      setSelectedSquare(square);
    }
  }, [selectedSquare, handleMove]);

  const handleSquareRightClick = useCallback((square: string) => {
    // Handle right-click for annotations
    console.log('Right-clicked square:', square);
  }, []);

  const handleAnnotationClick = useCallback((annotationId: string) => {
    console.log('Annotation clicked:', annotationId);
  }, []);

  const handleAddAnnotation = useCallback((moveIndex: number, annotation: Omit<Annotation, 'id' | 'createdAt'>) => {
    const annotationId = gameService.addAnnotation(annotation);
    console.log('Added annotation:', annotationId);
  }, [gameService]);

  const handleRemoveAnnotation = useCallback((annotationId: string) => {
    const success = gameService.removeAnnotation(annotationId);
    console.log('Removed annotation:', success);
  }, [gameService]);

  const handleFlipBoard = useCallback(() => {
    setBoardConfig(prev => ({
      ...prev,
      orientation: prev.orientation === 'white' ? 'black' : 'white'
    }));
  }, []);

  const handleEngineMoveClick = useCallback((move: any) => {
    const success = gameService.makeMove(move.move.substring(0, 2), move.move.substring(2, 4));
    if (success) {
      setCurrentMoveIndex(gameService.getCurrentMoveIndex());
      setSelectedSquare(null);
    }
  }, [gameService]);

  return (
    <div className={`analysis-board ${className}`}>
      <div className="analysis-board-main">
        {/* Chess Board */}
        <div className="board-container">
          <ProductionChessBoard
            position={gameState.fen}
            onMove={handleMove}
            onSquareClick={handleSquareClick}
            onSquareRightClick={handleSquareRightClick}
            orientation={boardConfig.orientation}
            showCoordinates={boardConfig.showCoordinates}
            showLastMove={boardConfig.showLastMove}
            showLegalMoves={boardConfig.showLegalMoves}
            animationDuration={boardConfig.animationDuration}
            boardWidth={400}
            arePiecesDraggable={true}
            areArrowsAllowed={true}
          />
          
          {/* Board Controls */}
          <div className="board-controls">
            <button onClick={handleFlipBoard} className="flip-btn">
              🔄 Flip Board
            </button>
            <button 
              onClick={() => setBoardConfig(prev => ({ ...prev, showLegalMoves: !prev.showLegalMoves }))}
              className="legal-moves-btn"
            >
              {boardConfig.showLegalMoves ? 'Hide' : 'Show'} Legal Moves
            </button>
          </div>
        </div>

        {/* Move Tree */}
        <div className="move-tree-container">
          <MoveTree
            moveTree={moveTree}
            currentMoveIndex={currentMoveIndex}
            onMoveClick={handleMoveClick}
            onVariationClick={handleVariationClick}
            onAnnotationClick={handleAnnotationClick}
            onAddAnnotation={handleAddAnnotation}
            onRemoveAnnotation={handleRemoveAnnotation}
          />
        </div>
      </div>

      {/* Engine Analysis Panel */}
      <div className="engine-panel">
        <div className="engine-header">
          <h3>Engine Analysis</h3>
          <div className="engine-status">
            {isAnalyzing ? 'Analyzing...' : isEngineReady ? 'Ready' : 'Loading...'}
          </div>
        </div>

        {engineMoves.length > 0 && (
          <div className="engine-moves">
            {engineMoves.map((move, index) => (
              <div
                key={index}
                className="engine-move"
                onClick={() => handleEngineMoveClick(move)}
              >
                <span className="move-number">{index + 1}.</span>
                <span className="move-text">{move.move}</span>
                <span className="move-eval">
                  {move.evaluation.type === 'mate' 
                    ? `M${move.evaluation.value}`
                    : `${move.evaluation.value > 0 ? '+' : ''}${move.evaluation.value.toFixed(1)}`
                  }
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Evaluation Bar */}
        <div className="evaluation-bar">
          <div 
            className="evaluation-fill"
            style={{ 
              width: `${Math.min(100, Math.max(0, 50 + evaluation * 25))}%`,
              backgroundColor: evaluation > 0 ? '#4CAF50' : evaluation < 0 ? '#F44336' : '#9E9E9E'
            }}
          />
          <span className="evaluation-text">
            {evaluation > 0 ? '+' : ''}{evaluation.toFixed(1)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default AnalysisBoard;

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ProductionChessBoard } from './ProductionChessBoard';
import { MoveTree } from './MoveTree';
import { GameState, MoveNode, Annotation, AnalysisConfig, BoardConfig } from '../types/chess';
import { ChessGameService } from '../services/ChessGameService';
import { stockfishService } from '../services/StockfishService';

interface AnalysisBoardProps {
  initialFEN?: string;
  initialPGN?: string;
  onGameChange?: (gameState: GameState) => void;
  onMoveTreeChange?: (moveTree: MoveNode[]) => void;
  className?: string;
}

export const AnalysisBoard: React.FC<AnalysisBoardProps> = ({
  initialFEN,
  initialPGN,
  onGameChange,
  onMoveTreeChange,
  className = ''
}) => {
  // Game state
  const [gameService] = useState(() => new ChessGameService(initialFEN));
  const [gameState, setGameState] = useState<GameState>(gameService.getGameState());
  const [moveTree, setMoveTree] = useState<MoveNode[]>(gameService.getMoveTree());
  const [currentMoveIndex, setCurrentMoveIndex] = useState(-1);

  // Analysis state
  const [analysisConfig, setAnalysisConfig] = useState<AnalysisConfig>({
    depth: 15,
    multiPV: 3,
    timeLimit: 5000,
    useCloudAnalysis: false,
    showEngineLines: true,
    showEvaluation: true,
    showBestMoves: true
  });

  // Board state
  const [boardConfig, setBoardConfig] = useState<BoardConfig>({
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

  // Refs
  const analysisTimeoutRef = useRef<NodeJS.Timeout>();

  // Initialize engine
  useEffect(() => {
    const initEngine = async () => {
      try {
        await stockfishService.analyzePosition(gameState.fen, analysisConfig);
        setIsEngineReady(true);
      } catch (error) {
        console.error('Failed to initialize engine:', error);
      }
    };

    initEngine();
  }, []);

  // Update game state when moves change
  useEffect(() => {
    const newGameState = gameService.getGameState();
    setGameState(newGameState);
    onGameChange?.(newGameState);
  }, [moveTree, onGameChange]);

  // Update move tree when moves change
  useEffect(() => {
    const newMoveTree = gameService.getMoveTree();
    setMoveTree(newMoveTree);
    onMoveTreeChange?.(newMoveTree);
  }, [moveTree, onMoveTreeChange]);

  // Analyze position when it changes
  useEffect(() => {
    if (isEngineReady && analysisConfig.showEngineLines) {
      analyzePosition();
    }
  }, [gameState.fen, isEngineReady, analysisConfig]);

  const analyzePosition = useCallback(async () => {
    if (!isEngineReady) return;

    setIsAnalyzing(true);
    
    try {
      const moves = await stockfishService.analyzePosition(gameState.fen, analysisConfig);
      setEngineMoves(moves);
      
      if (moves.length > 0) {
        setEvaluation(moves[0].evaluation.value);
      }
    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [gameState.fen, analysisConfig, isEngineReady]);

  const handleMove = useCallback((from: string, to: string, promotion?: string) => {
    const success = gameService.makeMove(from, to, promotion);
    if (success) {
      setCurrentMoveIndex(gameService.getCurrentMoveIndex());
      setSelectedSquare(null);
    }
    return success;
  }, [gameService]);

  const handleMoveClick = useCallback((moveIndex: number) => {
    gameService.goToMove(moveIndex);
    setCurrentMoveIndex(moveIndex);
    setSelectedSquare(null);
  }, [gameService]);

  const handleVariationClick = useCallback((variationId: string) => {
    const success = gameService.goToVariation(variationId);
    if (success) {
      setCurrentMoveIndex(gameService.getCurrentMoveIndex());
      setSelectedSquare(null);
    }
  }, [gameService]);

  const handleSquareClick = useCallback((square: string) => {
    if (selectedSquare) {
      handleMove(selectedSquare, square);
    } else {
      setSelectedSquare(square);
    }
  }, [selectedSquare, handleMove]);

  const handleSquareRightClick = useCallback((square: string) => {
    // Handle right-click for annotations
    console.log('Right-clicked square:', square);
  }, []);

  const handleAnnotationClick = useCallback((annotationId: string) => {
    console.log('Annotation clicked:', annotationId);
  }, []);

  const handleAddAnnotation = useCallback((moveIndex: number, annotation: Omit<Annotation, 'id' | 'createdAt'>) => {
    const annotationId = gameService.addAnnotation(annotation);
    console.log('Added annotation:', annotationId);
  }, [gameService]);

  const handleRemoveAnnotation = useCallback((annotationId: string) => {
    const success = gameService.removeAnnotation(annotationId);
    console.log('Removed annotation:', success);
  }, [gameService]);

  const handleFlipBoard = useCallback(() => {
    setBoardConfig(prev => ({
      ...prev,
      orientation: prev.orientation === 'white' ? 'black' : 'white'
    }));
  }, []);

  const handleEngineMoveClick = useCallback((move: any) => {
    const success = gameService.makeMove(move.move.substring(0, 2), move.move.substring(2, 4));
    if (success) {
      setCurrentMoveIndex(gameService.getCurrentMoveIndex());
      setSelectedSquare(null);
    }
  }, [gameService]);

  return (
    <div className={`analysis-board ${className}`}>
      <div className="analysis-board-main">
        {/* Chess Board */}
        <div className="board-container">
          <ProductionChessBoard
            position={gameState.fen}
            onMove={handleMove}
            onSquareClick={handleSquareClick}
            onSquareRightClick={handleSquareRightClick}
            orientation={boardConfig.orientation}
            showCoordinates={boardConfig.showCoordinates}
            showLastMove={boardConfig.showLastMove}
            showLegalMoves={boardConfig.showLegalMoves}
            animationDuration={boardConfig.animationDuration}
            boardWidth={400}
            arePiecesDraggable={true}
            areArrowsAllowed={true}
          />
          
          {/* Board Controls */}
          <div className="board-controls">
            <button onClick={handleFlipBoard} className="flip-btn">
              🔄 Flip Board
            </button>
            <button 
              onClick={() => setBoardConfig(prev => ({ ...prev, showLegalMoves: !prev.showLegalMoves }))}
              className="legal-moves-btn"
            >
              {boardConfig.showLegalMoves ? 'Hide' : 'Show'} Legal Moves
            </button>
          </div>
        </div>

        {/* Move Tree */}
        <div className="move-tree-container">
          <MoveTree
            moveTree={moveTree}
            currentMoveIndex={currentMoveIndex}
            onMoveClick={handleMoveClick}
            onVariationClick={handleVariationClick}
            onAnnotationClick={handleAnnotationClick}
            onAddAnnotation={handleAddAnnotation}
            onRemoveAnnotation={handleRemoveAnnotation}
          />
        </div>
      </div>

      {/* Engine Analysis Panel */}
      <div className="engine-panel">
        <div className="engine-header">
          <h3>Engine Analysis</h3>
          <div className="engine-status">
            {isAnalyzing ? 'Analyzing...' : isEngineReady ? 'Ready' : 'Loading...'}
          </div>
        </div>

        {engineMoves.length > 0 && (
          <div className="engine-moves">
            {engineMoves.map((move, index) => (
              <div
                key={index}
                className="engine-move"
                onClick={() => handleEngineMoveClick(move)}
              >
                <span className="move-number">{index + 1}.</span>
                <span className="move-text">{move.move}</span>
                <span className="move-eval">
                  {move.evaluation.type === 'mate' 
                    ? `M${move.evaluation.value}`
                    : `${move.evaluation.value > 0 ? '+' : ''}${move.evaluation.value.toFixed(1)}`
                  }
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Evaluation Bar */}
        <div className="evaluation-bar">
          <div 
            className="evaluation-fill"
            style={{ 
              width: `${Math.min(100, Math.max(0, 50 + evaluation * 25))}%`,
              backgroundColor: evaluation > 0 ? '#4CAF50' : evaluation < 0 ? '#F44336' : '#9E9E9E'
            }}
          />
          <span className="evaluation-text">
            {evaluation > 0 ? '+' : ''}{evaluation.toFixed(1)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default AnalysisBoard;

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ProductionChessBoard } from './ProductionChessBoard';
import { MoveTree } from './MoveTree';
import { GameState, MoveNode, Annotation, AnalysisConfig, BoardConfig } from '../types/chess';
import { ChessGameService } from '../services/ChessGameService';
import { stockfishService } from '../services/StockfishService';

interface AnalysisBoardProps {
  initialFEN?: string;
  initialPGN?: string;
  onGameChange?: (gameState: GameState) => void;
  onMoveTreeChange?: (moveTree: MoveNode[]) => void;
  className?: string;
}

export const AnalysisBoard: React.FC<AnalysisBoardProps> = ({
  initialFEN,
  initialPGN,
  onGameChange,
  onMoveTreeChange,
  className = ''
}) => {
  // Game state
  const [gameService] = useState(() => new ChessGameService(initialFEN));
  const [gameState, setGameState] = useState<GameState>(gameService.getGameState());
  const [moveTree, setMoveTree] = useState<MoveNode[]>(gameService.getMoveTree());
  const [currentMoveIndex, setCurrentMoveIndex] = useState(-1);

  // Analysis state
  const [analysisConfig, setAnalysisConfig] = useState<AnalysisConfig>({
    depth: 15,
    multiPV: 3,
    timeLimit: 5000,
    useCloudAnalysis: false,
    showEngineLines: true,
    showEvaluation: true,
    showBestMoves: true
  });

  // Board state
  const [boardConfig, setBoardConfig] = useState<BoardConfig>({
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

  // Refs
  const analysisTimeoutRef = useRef<NodeJS.Timeout>();

  // Initialize engine
  useEffect(() => {
    const initEngine = async () => {
      try {
        await stockfishService.analyzePosition(gameState.fen, analysisConfig);
        setIsEngineReady(true);
      } catch (error) {
        console.error('Failed to initialize engine:', error);
      }
    };

    initEngine();
  }, []);

  // Update game state when moves change
  useEffect(() => {
    const newGameState = gameService.getGameState();
    setGameState(newGameState);
    onGameChange?.(newGameState);
  }, [moveTree, onGameChange]);

  // Update move tree when moves change
  useEffect(() => {
    const newMoveTree = gameService.getMoveTree();
    setMoveTree(newMoveTree);
    onMoveTreeChange?.(newMoveTree);
  }, [moveTree, onMoveTreeChange]);

  // Analyze position when it changes
  useEffect(() => {
    if (isEngineReady && analysisConfig.showEngineLines) {
      analyzePosition();
    }
  }, [gameState.fen, isEngineReady, analysisConfig]);

  const analyzePosition = useCallback(async () => {
    if (!isEngineReady) return;

    setIsAnalyzing(true);
    
    try {
      const moves = await stockfishService.analyzePosition(gameState.fen, analysisConfig);
      setEngineMoves(moves);
      
      if (moves.length > 0) {
        setEvaluation(moves[0].evaluation.value);
      }
    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [gameState.fen, analysisConfig, isEngineReady]);

  const handleMove = useCallback((from: string, to: string, promotion?: string) => {
    const success = gameService.makeMove(from, to, promotion);
    if (success) {
      setCurrentMoveIndex(gameService.getCurrentMoveIndex());
      setSelectedSquare(null);
    }
    return success;
  }, [gameService]);

  const handleMoveClick = useCallback((moveIndex: number) => {
    gameService.goToMove(moveIndex);
    setCurrentMoveIndex(moveIndex);
    setSelectedSquare(null);
  }, [gameService]);

  const handleVariationClick = useCallback((variationId: string) => {
    const success = gameService.goToVariation(variationId);
    if (success) {
      setCurrentMoveIndex(gameService.getCurrentMoveIndex());
      setSelectedSquare(null);
    }
  }, [gameService]);

  const handleSquareClick = useCallback((square: string) => {
    if (selectedSquare) {
      handleMove(selectedSquare, square);
    } else {
      setSelectedSquare(square);
    }
  }, [selectedSquare, handleMove]);

  const handleSquareRightClick = useCallback((square: string) => {
    // Handle right-click for annotations
    console.log('Right-clicked square:', square);
  }, []);

  const handleAnnotationClick = useCallback((annotationId: string) => {
    console.log('Annotation clicked:', annotationId);
  }, []);

  const handleAddAnnotation = useCallback((moveIndex: number, annotation: Omit<Annotation, 'id' | 'createdAt'>) => {
    const annotationId = gameService.addAnnotation(annotation);
    console.log('Added annotation:', annotationId);
  }, [gameService]);

  const handleRemoveAnnotation = useCallback((annotationId: string) => {
    const success = gameService.removeAnnotation(annotationId);
    console.log('Removed annotation:', success);
  }, [gameService]);

  const handleFlipBoard = useCallback(() => {
    setBoardConfig(prev => ({
      ...prev,
      orientation: prev.orientation === 'white' ? 'black' : 'white'
    }));
  }, []);

  const handleEngineMoveClick = useCallback((move: any) => {
    const success = gameService.makeMove(move.move.substring(0, 2), move.move.substring(2, 4));
    if (success) {
      setCurrentMoveIndex(gameService.getCurrentMoveIndex());
      setSelectedSquare(null);
    }
  }, [gameService]);

  return (
    <div className={`analysis-board ${className}`}>
      <div className="analysis-board-main">
        {/* Chess Board */}
        <div className="board-container">
          <ProductionChessBoard
            position={gameState.fen}
            onMove={handleMove}
            onSquareClick={handleSquareClick}
            onSquareRightClick={handleSquareRightClick}
            orientation={boardConfig.orientation}
            showCoordinates={boardConfig.showCoordinates}
            showLastMove={boardConfig.showLastMove}
            showLegalMoves={boardConfig.showLegalMoves}
            animationDuration={boardConfig.animationDuration}
            boardWidth={400}
            arePiecesDraggable={true}
            areArrowsAllowed={true}
          />
          
          {/* Board Controls */}
          <div className="board-controls">
            <button onClick={handleFlipBoard} className="flip-btn">
              🔄 Flip Board
            </button>
            <button 
              onClick={() => setBoardConfig(prev => ({ ...prev, showLegalMoves: !prev.showLegalMoves }))}
              className="legal-moves-btn"
            >
              {boardConfig.showLegalMoves ? 'Hide' : 'Show'} Legal Moves
            </button>
          </div>
        </div>

        {/* Move Tree */}
        <div className="move-tree-container">
          <MoveTree
            moveTree={moveTree}
            currentMoveIndex={currentMoveIndex}
            onMoveClick={handleMoveClick}
            onVariationClick={handleVariationClick}
            onAnnotationClick={handleAnnotationClick}
            onAddAnnotation={handleAddAnnotation}
            onRemoveAnnotation={handleRemoveAnnotation}
          />
        </div>
      </div>

      {/* Engine Analysis Panel */}
      <div className="engine-panel">
        <div className="engine-header">
          <h3>Engine Analysis</h3>
          <div className="engine-status">
            {isAnalyzing ? 'Analyzing...' : isEngineReady ? 'Ready' : 'Loading...'}
          </div>
        </div>

        {engineMoves.length > 0 && (
          <div className="engine-moves">
            {engineMoves.map((move, index) => (
              <div
                key={index}
                className="engine-move"
                onClick={() => handleEngineMoveClick(move)}
              >
                <span className="move-number">{index + 1}.</span>
                <span className="move-text">{move.move}</span>
                <span className="move-eval">
                  {move.evaluation.type === 'mate' 
                    ? `M${move.evaluation.value}`
                    : `${move.evaluation.value > 0 ? '+' : ''}${move.evaluation.value.toFixed(1)}`
                  }
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Evaluation Bar */}
        <div className="evaluation-bar">
          <div 
            className="evaluation-fill"
            style={{ 
              width: `${Math.min(100, Math.max(0, 50 + evaluation * 25))}%`,
              backgroundColor: evaluation > 0 ? '#4CAF50' : evaluation < 0 ? '#F44336' : '#9E9E9E'
            }}
          />
          <span className="evaluation-text">
            {evaluation > 0 ? '+' : ''}{evaluation.toFixed(1)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default AnalysisBoard;

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ProductionChessBoard } from './ProductionChessBoard';
import { MoveTree } from './MoveTree';
import { GameState, MoveNode, Annotation, AnalysisConfig, BoardConfig } from '../types/chess';
import { ChessGameService } from '../services/ChessGameService';
import { stockfishService } from '../services/StockfishService';

interface AnalysisBoardProps {
  initialFEN?: string;
  initialPGN?: string;
  onGameChange?: (gameState: GameState) => void;
  onMoveTreeChange?: (moveTree: MoveNode[]) => void;
  className?: string;
}

export const AnalysisBoard: React.FC<AnalysisBoardProps> = ({
  initialFEN,
  initialPGN,
  onGameChange,
  onMoveTreeChange,
  className = ''
}) => {
  // Game state
  const [gameService] = useState(() => new ChessGameService(initialFEN));
  const [gameState, setGameState] = useState<GameState>(gameService.getGameState());
  const [moveTree, setMoveTree] = useState<MoveNode[]>(gameService.getMoveTree());
  const [currentMoveIndex, setCurrentMoveIndex] = useState(-1);

  // Analysis state
  const [analysisConfig, setAnalysisConfig] = useState<AnalysisConfig>({
    depth: 15,
    multiPV: 3,
    timeLimit: 5000,
    useCloudAnalysis: false,
    showEngineLines: true,
    showEvaluation: true,
    showBestMoves: true
  });

  // Board state
  const [boardConfig, setBoardConfig] = useState<BoardConfig>({
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

  // Refs
  const analysisTimeoutRef = useRef<NodeJS.Timeout>();

  // Initialize engine
  useEffect(() => {
    const initEngine = async () => {
      try {
        await stockfishService.analyzePosition(gameState.fen, analysisConfig);
        setIsEngineReady(true);
      } catch (error) {
        console.error('Failed to initialize engine:', error);
      }
    };

    initEngine();
  }, []);

  // Update game state when moves change
  useEffect(() => {
    const newGameState = gameService.getGameState();
    setGameState(newGameState);
    onGameChange?.(newGameState);
  }, [moveTree, onGameChange]);

  // Update move tree when moves change
  useEffect(() => {
    const newMoveTree = gameService.getMoveTree();
    setMoveTree(newMoveTree);
    onMoveTreeChange?.(newMoveTree);
  }, [moveTree, onMoveTreeChange]);

  // Analyze position when it changes
  useEffect(() => {
    if (isEngineReady && analysisConfig.showEngineLines) {
      analyzePosition();
    }
  }, [gameState.fen, isEngineReady, analysisConfig]);

  const analyzePosition = useCallback(async () => {
    if (!isEngineReady) return;

    setIsAnalyzing(true);
    
    try {
      const moves = await stockfishService.analyzePosition(gameState.fen, analysisConfig);
      setEngineMoves(moves);
      
      if (moves.length > 0) {
        setEvaluation(moves[0].evaluation.value);
      }
    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [gameState.fen, analysisConfig, isEngineReady]);

  const handleMove = useCallback((from: string, to: string, promotion?: string) => {
    const success = gameService.makeMove(from, to, promotion);
    if (success) {
      setCurrentMoveIndex(gameService.getCurrentMoveIndex());
      setSelectedSquare(null);
    }
    return success;
  }, [gameService]);

  const handleMoveClick = useCallback((moveIndex: number) => {
    gameService.goToMove(moveIndex);
    setCurrentMoveIndex(moveIndex);
    setSelectedSquare(null);
  }, [gameService]);

  const handleVariationClick = useCallback((variationId: string) => {
    const success = gameService.goToVariation(variationId);
    if (success) {
      setCurrentMoveIndex(gameService.getCurrentMoveIndex());
      setSelectedSquare(null);
    }
  }, [gameService]);

  const handleSquareClick = useCallback((square: string) => {
    if (selectedSquare) {
      handleMove(selectedSquare, square);
    } else {
      setSelectedSquare(square);
    }
  }, [selectedSquare, handleMove]);

  const handleSquareRightClick = useCallback((square: string) => {
    // Handle right-click for annotations
    console.log('Right-clicked square:', square);
  }, []);

  const handleAnnotationClick = useCallback((annotationId: string) => {
    console.log('Annotation clicked:', annotationId);
  }, []);

  const handleAddAnnotation = useCallback((moveIndex: number, annotation: Omit<Annotation, 'id' | 'createdAt'>) => {
    const annotationId = gameService.addAnnotation(annotation);
    console.log('Added annotation:', annotationId);
  }, [gameService]);

  const handleRemoveAnnotation = useCallback((annotationId: string) => {
    const success = gameService.removeAnnotation(annotationId);
    console.log('Removed annotation:', success);
  }, [gameService]);

  const handleFlipBoard = useCallback(() => {
    setBoardConfig(prev => ({
      ...prev,
      orientation: prev.orientation === 'white' ? 'black' : 'white'
    }));
  }, []);

  const handleEngineMoveClick = useCallback((move: any) => {
    const success = gameService.makeMove(move.move.substring(0, 2), move.move.substring(2, 4));
    if (success) {
      setCurrentMoveIndex(gameService.getCurrentMoveIndex());
      setSelectedSquare(null);
    }
  }, [gameService]);

  return (
    <div className={`analysis-board ${className}`}>
      <div className="analysis-board-main">
        {/* Chess Board */}
        <div className="board-container">
          <ProductionChessBoard
            position={gameState.fen}
            onMove={handleMove}
            onSquareClick={handleSquareClick}
            onSquareRightClick={handleSquareRightClick}
            orientation={boardConfig.orientation}
            showCoordinates={boardConfig.showCoordinates}
            showLastMove={boardConfig.showLastMove}
            showLegalMoves={boardConfig.showLegalMoves}
            animationDuration={boardConfig.animationDuration}
            boardWidth={400}
            arePiecesDraggable={true}
            areArrowsAllowed={true}
          />
          
          {/* Board Controls */}
          <div className="board-controls">
            <button onClick={handleFlipBoard} className="flip-btn">
              🔄 Flip Board
            </button>
            <button 
              onClick={() => setBoardConfig(prev => ({ ...prev, showLegalMoves: !prev.showLegalMoves }))}
              className="legal-moves-btn"
            >
              {boardConfig.showLegalMoves ? 'Hide' : 'Show'} Legal Moves
            </button>
          </div>
        </div>

        {/* Move Tree */}
        <div className="move-tree-container">
          <MoveTree
            moveTree={moveTree}
            currentMoveIndex={currentMoveIndex}
            onMoveClick={handleMoveClick}
            onVariationClick={handleVariationClick}
            onAnnotationClick={handleAnnotationClick}
            onAddAnnotation={handleAddAnnotation}
            onRemoveAnnotation={handleRemoveAnnotation}
          />
        </div>
      </div>

      {/* Engine Analysis Panel */}
      <div className="engine-panel">
        <div className="engine-header">
          <h3>Engine Analysis</h3>
          <div className="engine-status">
            {isAnalyzing ? 'Analyzing...' : isEngineReady ? 'Ready' : 'Loading...'}
          </div>
        </div>

        {engineMoves.length > 0 && (
          <div className="engine-moves">
            {engineMoves.map((move, index) => (
              <div
                key={index}
                className="engine-move"
                onClick={() => handleEngineMoveClick(move)}
              >
                <span className="move-number">{index + 1}.</span>
                <span className="move-text">{move.move}</span>
                <span className="move-eval">
                  {move.evaluation.type === 'mate' 
                    ? `M${move.evaluation.value}`
                    : `${move.evaluation.value > 0 ? '+' : ''}${move.evaluation.value.toFixed(1)}`
                  }
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Evaluation Bar */}
        <div className="evaluation-bar">
          <div 
            className="evaluation-fill"
            style={{ 
              width: `${Math.min(100, Math.max(0, 50 + evaluation * 25))}%`,
              backgroundColor: evaluation > 0 ? '#4CAF50' : evaluation < 0 ? '#F44336' : '#9E9E9E'
            }}
          />
          <span className="evaluation-text">
            {evaluation > 0 ? '+' : ''}{evaluation.toFixed(1)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default AnalysisBoard;
















