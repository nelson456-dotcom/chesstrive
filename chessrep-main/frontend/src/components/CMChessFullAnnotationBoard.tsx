import React, { useState, useEffect } from 'react';
import { CMChessGameService } from '../services/CMChessGameService';
import { ProductionChessBoard } from './ProductionChessBoard';
import { AnnotationDisplay } from './AnnotationDisplay';
import { ParsedMove } from '../services/PGNParser';

interface CMChessFullAnnotationBoardProps {
  pgn: string;
  boardWidth: number;
  boardOrientation: 'white' | 'black';
  onPositionChange?: (fen: string, moveHistory?: any[]) => void;
  onGameLoad?: (game: any) => void;
}

const CMChessFullAnnotationBoard: React.FC<CMChessFullAnnotationBoardProps> = ({
  pgn,
  boardWidth,
  boardOrientation,
  onPositionChange,
  onGameLoad,
}) => {
  const [gameService] = useState(() => new CMChessGameService());
  const [currentMoveIndex, setCurrentMoveIndex] = useState(-1);
  const [position, setPosition] = useState(gameService.getCurrentPosition());
  const [moveHistory, setMoveHistory] = useState<ParsedMove[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load PGN when it changes
  useEffect(() => {
    if (pgn && pgn.trim()) {
      setIsLoading(true);
      try {
        const success = gameService.loadPGN(pgn);
        if (success) {
          // Convert MoveNode[] to ParsedMove[] for compatibility
          const moveNodes = gameService.getMoveHistory();
          const parsedMoves: ParsedMove[] = moveNodes.map((node, index) => ({
            id: node.id,
            san: node.move.san,
            fen: node.move.after,
            moveNumber: node.moveNumber,
            isWhite: node.isWhite,
            comment: '',
            nags: [],
            variations: [],
            parentId: node.parentId,
            isMainLine: node.isMainLine,
            depth: 0,
            moveIndex: index
          }));
          
          setMoveHistory(parsedMoves);
          setCurrentMoveIndex(gameService.getCurrentMoveIndex());
          setPosition(gameService.getCurrentPosition());
          
          // Notify parent component
          onGameLoad?.(gameService);
          onPositionChange?.(gameService.getCurrentPosition(), parsedMoves);
        } else {
          console.error('Failed to load PGN');
        }
      } catch (error) {
        console.error('Error loading PGN:', error);
      } finally {
        setIsLoading(false);
      }
    }
  }, [pgn, gameService, onGameLoad, onPositionChange]);

  // Handle move navigation
  const handleMoveNavigation = (newIndex: number) => {
    const success = gameService.goToMove(newIndex);
    if (success) {
      setCurrentMoveIndex(newIndex);
      setPosition(gameService.getCurrentPosition());
      onPositionChange?.(gameService.getCurrentPosition(), gameService.getMoveHistory());
    }
  };

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (isLoading) return;

      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault();
          handleMoveNavigation(currentMoveIndex - 1);
          break;
        case 'ArrowRight':
          event.preventDefault();
          handleMoveNavigation(currentMoveIndex + 1);
          break;
        case 'Home':
          event.preventDefault();
          handleMoveNavigation(-1);
          break;
        case 'End':
          event.preventDefault();
          handleMoveNavigation(moveHistory.length - 1);
          break;
        case 'ArrowUp':
          event.preventDefault();
          // Navigate into variation (if available)
          break;
        case 'ArrowDown':
          event.preventDefault();
          // Navigate out of variation (if available)
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentMoveIndex, moveHistory.length, isLoading]);

  // Handle board move
  const handleBoardMove = (from: string, to: string, promotion?: string): boolean => {
    const move = promotion ? `${from}${to}${promotion}` : `${from}${to}`;
    if (gameService.isValidMove(move)) {
      gameService.goToMove(currentMoveIndex + 1);
      setCurrentMoveIndex(currentMoveIndex + 1);
      setPosition(gameService.getCurrentPosition());
      
      // Update move history
      const moveNodes = gameService.getMoveHistory();
      const parsedMoves: ParsedMove[] = moveNodes.map((node, index) => ({
        id: node.id,
        san: node.move.san,
        fen: node.move.after,
        moveNumber: node.moveNumber,
        isWhite: node.isWhite,
        comment: '',
        nags: [],
        variations: [],
        parentId: node.parentId,
        isMainLine: node.isMainLine,
        depth: 0,
        moveIndex: index
      }));
      
      setMoveHistory(parsedMoves);
      onPositionChange?.(gameService.getCurrentPosition(), parsedMoves);
      return true;
    }
    return false;
  };

  // Handle move click in annotation
  const handleMoveClick = (moveId: string) => {
    const moveIndex = parseInt(moveId.replace('move-', ''));
    handleMoveNavigation(moveIndex);
  };

  // Handle variation click
  const handleVariationClick = (parentMoveId: string, variationIndex: number, moveIndex: number) => {
    // Simplified variation navigation
    const success = gameService.navigateVariation(moveIndex);
    if (success) {
      setCurrentMoveIndex(gameService.getCurrentMoveIndex());
      setPosition(gameService.getCurrentPosition());
      
      // Update move history
      const moveNodes = gameService.getMoveHistory();
      const parsedMoves: ParsedMove[] = moveNodes.map((node, index) => ({
        id: node.id,
        san: node.move.san,
        fen: node.move.after,
        moveNumber: node.moveNumber,
        isWhite: node.isWhite,
        comment: '',
        nags: [],
        variations: [],
        parentId: node.parentId,
        isMainLine: node.isMainLine,
        depth: 0,
        moveIndex: index
      }));
      
      setMoveHistory(parsedMoves);
      onPositionChange?.(gameService.getCurrentPosition(), parsedMoves);
    }
  };

  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '400px',
        fontSize: '18px',
        color: '#666'
      }}>
        Loading game with cm-chess (Real Library)...
      </div>
    );
  }

  return (
    <div style={{ 
      display: 'flex', 
      gap: '20px', 
      flexWrap: 'wrap',
      justifyContent: 'center',
      alignItems: 'flex-start'
    }}>
      {/* Chess Board */}
      <div style={{ flex: '0 0 auto' }}>
        <ProductionChessBoard
          position={position}
          onMove={handleBoardMove}
          boardWidth={boardWidth}
          boardOrientation={boardOrientation}
          showCoordinates={true}
        />
        
        {/* Navigation Controls */}
        <div style={{ 
          marginTop: '15px', 
          display: 'flex', 
          justifyContent: 'center', 
          gap: '10px' 
        }}>
          <button
            onClick={() => handleMoveNavigation(-1)}
            disabled={currentMoveIndex === -1}
            style={{
              padding: '8px 12px',
              backgroundColor: currentMoveIndex === -1 ? '#ccc' : '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: currentMoveIndex === -1 ? 'not-allowed' : 'pointer'
            }}
          >
            ⏮️ Start
          </button>
          <button
            onClick={() => handleMoveNavigation(currentMoveIndex - 1)}
            disabled={currentMoveIndex === -1}
            style={{
              padding: '8px 12px',
              backgroundColor: currentMoveIndex === -1 ? '#ccc' : '#2196F3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: currentMoveIndex === -1 ? 'not-allowed' : 'pointer'
            }}
          >
            ⬅️ Previous
          </button>
          <button
            onClick={() => handleMoveNavigation(currentMoveIndex + 1)}
            disabled={currentMoveIndex >= moveHistory.length - 1}
            style={{
              padding: '8px 12px',
              backgroundColor: currentMoveIndex >= moveHistory.length - 1 ? '#ccc' : '#2196F3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: currentMoveIndex >= moveHistory.length - 1 ? 'not-allowed' : 'pointer'
            }}
          >
            Next ➡️
          </button>
          <button
            onClick={() => handleMoveNavigation(moveHistory.length - 1)}
            disabled={currentMoveIndex >= moveHistory.length - 1}
            style={{
              padding: '8px 12px',
              backgroundColor: currentMoveIndex >= moveHistory.length - 1 ? '#ccc' : '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: currentMoveIndex >= moveHistory.length - 1 ? 'not-allowed' : 'pointer'
            }}
          >
            End ⏭️
          </button>
        </div>

        {/* Game Info */}
        <div style={{ 
          marginTop: '15px', 
          textAlign: 'center', 
          fontSize: '14px',
          color: '#666'
        }}>
          <div>Move {currentMoveIndex + 1} of {moveHistory.length}</div>
          <div>Position: {position}</div>
          {gameService.inCheck() && (
            <div style={{ color: '#f44336', fontWeight: 'bold' }}>
              ⚠️ Check!
            </div>
          )}
          {gameService.isCheckmate() && (
            <div style={{ color: '#f44336', fontWeight: 'bold' }}>
              🏁 Checkmate!
            </div>
          )}
          {gameService.isStalemate() && (
            <div style={{ color: '#ff9800', fontWeight: 'bold' }}>
              🤝 Stalemate!
            </div>
          )}
        </div>
      </div>

      {/* Annotation Display */}
      <div style={{ flex: '1', minWidth: '300px' }}>
        <AnnotationDisplay
          moves={moveHistory}
          currentMoveId={currentMoveIndex >= 0 ? `move-${currentMoveIndex}` : null}
          onMoveClick={handleMoveClick}
          onVariationClick={handleVariationClick}
        />
      </div>
    </div>
  );
};

export default CMChessFullAnnotationBoard;
