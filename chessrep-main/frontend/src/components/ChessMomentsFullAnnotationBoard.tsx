import React, { useState, useEffect } from 'react';
import { ProductionChessBoard } from './ProductionChessBoard';
import ChessMomentsAnnotationDisplay from './ChessMomentsAnnotationDisplay';
import { ChessMomentsService, ChessMomentsMove } from '../services/ChessMomentsService';

interface ChessMomentsFullAnnotationBoardProps {
  pgn: string;
  boardWidth: number;
  boardOrientation: 'white' | 'black';
  onPositionChange?: (fen: string, moveHistory?: any[]) => void;
  onGameLoad?: (game: any) => void;
}

const ChessMomentsFullAnnotationBoard: React.FC<ChessMomentsFullAnnotationBoardProps> = ({
  pgn,
  boardWidth,
  boardOrientation,
  onPositionChange,
  onGameLoad,
}) => {
  const [chessMomentsService] = useState(() => new ChessMomentsService());
  const [currentMoveIndex, setCurrentMoveIndex] = useState(-1);
  const [parsedMoves, setParsedMoves] = useState<ChessMomentsMove[]>([]);
  const [position, setPosition] = useState('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
  const [gameData, setGameData] = useState<any>(null);

  useEffect(() => {
    if (!pgn.trim()) {
      setParsedMoves([]);
      setCurrentMoveIndex(-1);
      setPosition('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
      return;
    }

    try {
      console.log('🎯 Parsing PGN with chess-moments:', pgn);
      const parsedGame = chessMomentsService.parsePGN(pgn);
      console.log('🎯 Parsed game:', parsedGame);
      
      setGameData(parsedGame);
      setParsedMoves(parsedGame.moves);
      setCurrentMoveIndex(-1);
      
      // Set initial position
      chessMomentsService.reset();
      setPosition(chessMomentsService.getCurrentFEN());
      
      onGameLoad?.(parsedGame);
    } catch (error) {
      console.error('Failed to parse PGN:', error);
      setParsedMoves([]);
      setCurrentMoveIndex(-1);
      setPosition('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
    }
  }, [pgn, chessMomentsService, onGameLoad]);

  useEffect(() => {
    console.log('🎯 Position update effect triggered:', { 
      parsedMovesLength: parsedMoves.length, 
      currentMoveIndex 
    });
    
    if (parsedMoves.length > 0) {
      const newPosition = chessMomentsService.getPositionAtMove(parsedMoves, currentMoveIndex);
      console.log('🎯 New position calculated:', newPosition);
      setPosition(newPosition);
      onPositionChange?.(newPosition, parsedMoves.slice(0, currentMoveIndex + 1));
    } else {
      // If no moves, use the current FEN from the chess instance
      const currentFen = chessMomentsService.getCurrentFEN();
      console.log('🎯 No moves, using current FEN:', currentFen);
      setPosition(currentFen);
    }
  }, [currentMoveIndex, parsedMoves, chessMomentsService, onPositionChange]);

  // Add keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) {
        return;
      }

      event.preventDefault();

      let newMoveIndex = currentMoveIndex;

      switch (event.key) {
        case 'ArrowLeft':
          // Go to previous move
          if (currentMoveIndex > -1) {
            newMoveIndex = currentMoveIndex - 1;
          }
          break;
        case 'ArrowRight':
          // Go to next move
          if (currentMoveIndex < parsedMoves.length - 1) {
            newMoveIndex = currentMoveIndex + 1;
          }
          break;
        case 'ArrowUp':
          // For now, just go to previous move (can be enhanced for variations)
          if (currentMoveIndex > -1) {
            newMoveIndex = currentMoveIndex - 1;
          }
          break;
        case 'ArrowDown':
          // For now, just go to next move (can be enhanced for variations)
          if (currentMoveIndex < parsedMoves.length - 1) {
            newMoveIndex = currentMoveIndex + 1;
          }
          break;
      }

      if (newMoveIndex !== currentMoveIndex) {
        setCurrentMoveIndex(newMoveIndex);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentMoveIndex, parsedMoves.length]);

  const handleMoveClick = (moveId: string) => {
    const moveIndex = parsedMoves.findIndex(m => m.id === moveId);
    if (moveIndex !== -1) {
      setCurrentMoveIndex(moveIndex);
    }
  };

  const handleMove = (from: string, to: string, promotion?: string) => {
    try {
      console.log('🎯 handleMove called:', { from, to, promotion, currentMoveIndex });
      
      // First, ensure the chess instance is at the current position
      const currentPosition = chessMomentsService.getPositionAtMove(parsedMoves, currentMoveIndex);
      console.log('🎯 Current position FEN:', currentPosition);
      chessMomentsService.chess.load(currentPosition);
      
      // Check if the move is valid from the current position
      const isValid = chessMomentsService.validateMove(from, to, promotion);
      console.log('🎯 Move validation result:', isValid);
      
      if (isValid) {
        // Make the move on the chess instance
        const move = chessMomentsService.chess.move({
          from,
          to,
          promotion: promotion as any
        });
        
        if (move) {
          console.log('🎯 Move made successfully:', move);
          
          // Create a new move object
          const newMove: ChessMomentsMove = {
            id: `new_move_${Date.now()}`,
            san: move.san,
            fen: chessMomentsService.getCurrentFEN(),
            moveNumber: Math.ceil((currentMoveIndex + 2) / 2),
            isWhite: move.color === 'w',
            comment: undefined,
            nags: undefined,
            variations: [],
            moveIndex: currentMoveIndex + 1
          };
          
          console.log('🎯 New move object:', newMove);
          
          // Add the move to the parsed moves
          const newMoves = [...parsedMoves, newMove];
          setParsedMoves(newMoves);
          setCurrentMoveIndex(newMoves.length - 1);
          
          console.log('🎯 Updated moves count:', newMoves.length);
          return true;
        } else {
          console.log('🎯 Move failed - no move object returned');
        }
      } else {
        console.log('🎯 Move validation failed');
      }
      return false;
    } catch (error) {
      console.error('🎯 Invalid move error:', error);
      return false;
    }
  };

  const handleVariationClick = (parentMoveId: string, variationIndex: number, moveIndex: number) => {
    // Find the parent move and navigate to the variation
    const parentMove = parsedMoves.find(m => m.id === parentMoveId);
    if (parentMove && parentMove.variations[variationIndex]) {
      const variationMove = parentMove.variations[variationIndex][moveIndex];
      if (variationMove) {
        handleMoveClick(variationMove.id);
      }
    }
  };

  const arePiecesDraggable = true;

  const currentMoveId = currentMoveIndex >= 0 && currentMoveIndex < parsedMoves.length 
    ? parsedMoves[currentMoveIndex].id 
    : null;

  const handleNewGame = () => {
    console.log('🎯 Starting new game');
    // Reset to starting position and clear moves
    chessMomentsService.reset();
    setParsedMoves([]);
    setCurrentMoveIndex(-1);
    const startPosition = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    setPosition(startPosition);
    console.log('🎯 New game position set:', startPosition);
  };

  const navigationControls = (
    <div style={{ 
      display: 'flex', 
      gap: '10px', 
      marginBottom: '10px',
      justifyContent: 'center',
      flexWrap: 'wrap'
    }}>
      <button
        onClick={handleNewGame}
        style={{
          padding: '8px 12px',
          backgroundColor: '#FF9800',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        New Game
      </button>
      <button
        onClick={() => setCurrentMoveIndex(-1)}
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
        Start
      </button>
      <button
        onClick={() => setCurrentMoveIndex(Math.max(-1, currentMoveIndex - 1))}
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
        ← Previous
      </button>
      <button
        onClick={() => setCurrentMoveIndex(Math.min(parsedMoves.length - 1, currentMoveIndex + 1))}
        disabled={currentMoveIndex >= parsedMoves.length - 1}
        style={{
          padding: '8px 12px',
          backgroundColor: currentMoveIndex >= parsedMoves.length - 1 ? '#ccc' : '#4CAF50',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: currentMoveIndex >= parsedMoves.length - 1 ? 'not-allowed' : 'pointer'
        }}
      >
        Next →
      </button>
      <button
        onClick={() => setCurrentMoveIndex(parsedMoves.length - 1)}
        disabled={currentMoveIndex >= parsedMoves.length - 1}
        style={{
          padding: '8px 12px',
          backgroundColor: currentMoveIndex >= parsedMoves.length - 1 ? '#ccc' : '#2196F3',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: currentMoveIndex >= parsedMoves.length - 1 ? 'not-allowed' : 'pointer'
        }}
      >
        End
      </button>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {navigationControls}
      
      <div style={{ display: 'flex', gap: '20px' }}>
        <ProductionChessBoard
          position={position}
          boardOrientation={boardOrientation}
          boardWidth={boardWidth}
          arePiecesDraggable={arePiecesDraggable}
          onMove={handleMove}
        />
        <ChessMomentsAnnotationDisplay
          moves={parsedMoves}
          currentMoveId={currentMoveId}
          onMoveClick={handleMoveClick}
          onVariationClick={handleVariationClick}
        />
      </div>
      
      {/* Game info */}
      {gameData && (
        <div style={{ 
          padding: '10px', 
          backgroundColor: '#e3f2fd', 
          borderRadius: '8px',
          fontSize: '14px'
        }}>
          <strong>Game Info:</strong>
          <div style={{ marginTop: '5px' }}>
            {gameData.headers.Event && <div><strong>Event:</strong> {gameData.headers.Event}</div>}
            {gameData.headers.Site && <div><strong>Site:</strong> {gameData.headers.Site}</div>}
            {gameData.headers.Date && <div><strong>Date:</strong> {gameData.headers.Date}</div>}
            {gameData.headers.White && <div><strong>White:</strong> {gameData.headers.White}</div>}
            {gameData.headers.Black && <div><strong>Black:</strong> {gameData.headers.Black}</div>}
            {gameData.headers.Result && <div><strong>Result:</strong> {gameData.headers.Result}</div>}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChessMomentsFullAnnotationBoard;
