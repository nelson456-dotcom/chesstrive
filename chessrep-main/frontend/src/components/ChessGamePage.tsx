import React, { useState, useEffect } from 'react';
import { ProductionChessBoard } from './ProductionChessBoard';
import ChessMomentsAnnotation from './ChessMomentsAnnotation';
import { ChessGameRecordingService, GameState, RecordedMove } from '../services/ChessGameRecordingService';

const ChessGamePage: React.FC = () => {
  const [gameService] = useState(() => new ChessGameRecordingService());
  const [gameState, setGameState] = useState<GameState>(gameService.getGameState());
  const [boardWidth, setBoardWidth] = useState<number>(500);
  const [orientation, setOrientation] = useState<'white' | 'black'>('white');
  const [showGameInfo, setShowGameInfo] = useState<boolean>(true);
  const [showPGN, setShowPGN] = useState<boolean>(false);
  const [showChessMoments, setShowChessMoments] = useState<boolean>(true);
  const [treeView, setTreeView] = useState<boolean>(false);

  // Update game state whenever moves change
  useEffect(() => {
    setGameState(gameService.getGameState());
  }, [gameService]);

  const handleMove = (from: string, to: string, promotion?: string): boolean => {
    const success = gameService.makeMove(from, to, promotion);
    if (success) {
      setGameState(gameService.getGameState());
    }
    return success;
  };

  const handleMoveClick = (moveIndex: number) => {
    gameService.goToMove(moveIndex);
    setGameState(gameService.getGameState());
  };

  const handleNewGame = () => {
    gameService.reset();
    setGameState(gameService.getGameState());
  };

  const handleUndo = () => {
    gameService.undoMove();
    setGameState(gameService.getGameState());
  };

  const handleFlipBoard = () => {
    setOrientation(prev => prev === 'white' ? 'black' : 'white');
  };

  const handleExportPGN = () => {
    const pgn = gameService.exportPGN();
    const blob = new Blob([pgn], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chess-game-${new Date().toISOString().split('T')[0]}.pgn`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportPGN = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const pgn = e.target?.result as string;
        if (gameService.loadPGN(pgn)) {
          setGameState(gameService.getGameState());
        } else {
          alert('Failed to load PGN file');
        }
      };
      reader.readAsText(file);
    }
  };

  const navigationControls = (
    <div style={{ 
      display: 'flex', 
      gap: '10px', 
      marginBottom: '20px',
      justifyContent: 'center',
      flexWrap: 'wrap'
    }}>
      <button
        onClick={handleNewGame}
        style={{
          padding: '10px 16px',
          backgroundColor: '#FF9800',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          fontWeight: 'bold'
        }}
      >
        🆕 New Game
      </button>
      
      <button
        onClick={handleUndo}
        disabled={gameState.currentMoveIndex < 0}
        style={{
          padding: '10px 16px',
          backgroundColor: gameState.currentMoveIndex < 0 ? '#ccc' : '#2196F3',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: gameState.currentMoveIndex < 0 ? 'not-allowed' : 'pointer',
          fontWeight: 'bold'
        }}
      >
        ↶ Undo Move
      </button>
      
      <button
        onClick={handleFlipBoard}
        style={{
          padding: '10px 16px',
          backgroundColor: '#9C27B0',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          fontWeight: 'bold'
        }}
      >
        🔄 Flip Board
      </button>
      
      <button
        onClick={handleExportPGN}
        disabled={gameState.moveHistory.length === 0}
        style={{
          padding: '10px 16px',
          backgroundColor: gameState.moveHistory.length === 0 ? '#ccc' : '#4CAF50',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: gameState.moveHistory.length === 0 ? 'not-allowed' : 'pointer',
          fontWeight: 'bold'
        }}
      >
        💾 Export PGN
      </button>
      
      <label style={{
        padding: '10px 16px',
        backgroundColor: '#607D8B',
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        fontWeight: 'bold',
        display: 'inline-block'
      }}>
        📁 Import PGN
        <input
          type="file"
          accept=".pgn"
          onChange={handleImportPGN}
          style={{ display: 'none' }}
        />
      </label>
      
      <button
        onClick={() => setShowChessMoments(!showChessMoments)}
        style={{
          padding: '10px 16px',
          backgroundColor: showChessMoments ? '#FF9800' : '#9E9E9E',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          fontWeight: 'bold'
        }}
      >
        {showChessMoments ? '🎯 Hide Chess Moments' : '🎯 Show Chess Moments'}
      </button>
      
      {showChessMoments && (
        <button
          onClick={() => setTreeView(!treeView)}
          style={{
            padding: '10px 16px',
            backgroundColor: treeView ? '#9C27B0' : '#E0E0E0',
            color: treeView ? 'white' : 'black',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          {treeView ? '🌳 Tree View' : '📋 Flat View'}
        </button>
      )}
    </div>
  );

  const gameInfo = (
    <div style={{ 
      marginBottom: '20px', 
      padding: '15px', 
      backgroundColor: '#e3f2fd', 
      borderRadius: '8px',
      border: '1px solid #2196F3'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, color: '#1976D2' }}>Game Information</h3>
        <button
          onClick={() => setShowGameInfo(!showGameInfo)}
          style={{
            padding: '4px 8px',
            backgroundColor: '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          {showGameInfo ? 'Hide' : 'Show'}
        </button>
      </div>
      
      {showGameInfo && (
        <div style={{ marginTop: '10px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <strong>Turn:</strong> {gameState.turn === 'w' ? 'White' : 'Black'}
            </div>
            <div>
              <strong>Moves:</strong> {gameState.moveHistory.length}
            </div>
            <div>
              <strong>Status:</strong> {gameState.gameOver ? 'Game Over' : 'In Progress'}
            </div>
            <div>
              <strong>Result:</strong> {gameState.result || 'Ongoing'}
            </div>
          </div>
          
          <div style={{ marginTop: '10px' }}>
            <strong>Players:</strong>
            <div style={{ marginLeft: '10px' }}>
              <div><strong>White:</strong> {gameState.headers.White}</div>
              <div><strong>Black:</strong> {gameState.headers.Black}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const pgnDisplay = (
    <div style={{ 
      marginTop: '20px', 
      padding: '15px', 
      backgroundColor: '#f5f5f5', 
      borderRadius: '8px',
      border: '1px solid #ddd'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <h3 style={{ margin: 0 }}>PGN Export</h3>
        <button
          onClick={() => setShowPGN(!showPGN)}
          style={{
            padding: '4px 8px',
            backgroundColor: '#666',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          {showPGN ? 'Hide' : 'Show'}
        </button>
      </div>
      
      {showPGN && (
        <textarea
          value={gameService.exportPGN()}
          readOnly
          style={{
            width: '100%',
            height: '150px',
            padding: '10px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            fontFamily: 'monospace',
            fontSize: '12px',
            backgroundColor: '#fff'
          }}
        />
      )}
    </div>
  );

  return (
    <div style={{ 
      padding: '20px', 
      maxWidth: '1400px', 
      margin: '0 auto',
      backgroundColor: '#fafafa',
      minHeight: '100vh'
    }}>
      <h1 style={{ 
        textAlign: 'center', 
        marginBottom: '30px',
        color: '#333',
        fontSize: '2.5em'
      }}>
        Chess Game Recorder
      </h1>
      
      {navigationControls}
      {gameInfo}
      
      <div style={{ 
        display: 'flex', 
        gap: '20px',
        flexWrap: 'wrap',
        justifyContent: 'center'
      }}>
        {/* Chess Board */}
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center',
          gap: '15px'
        }}>
          <ProductionChessBoard
            position={gameState.fen}
            boardOrientation={orientation}
            boardWidth={boardWidth}
            arePiecesDraggable={!gameState.gameOver}
            onMove={handleMove}
          />
          
          {/* Board Controls */}
          <div style={{ 
            display: 'flex', 
            gap: '10px',
            alignItems: 'center'
          }}>
            <label style={{ fontWeight: 'bold' }}>
              Board Size:
              <input
                type="range"
                min="400"
                max="700"
                value={boardWidth}
                onChange={(e) => setBoardWidth(parseInt(e.target.value))}
                style={{ marginLeft: '8px' }}
              />
              <span style={{ marginLeft: '8px' }}>{boardWidth}px</span>
            </label>
          </div>
        </div>
        
        {/* Chess Moments Annotation */}
        <div style={{ 
          flex: '1',
          minWidth: '300px',
          maxWidth: '600px'
        }}>
          {showChessMoments && (
            <ChessMomentsAnnotation
              moments={treeView ? gameService.getChessMomentsTree().flat() : gameService.getChessMoments()}
              currentMoveIndex={gameState.currentMoveIndex + 1} // +1 because chess-moments includes starting position
              onMoveClick={(momentIndex) => handleMoveClick(momentIndex - 1)} // -1 to convert back to move history index
              treeView={treeView}
              onPreviousMove={() => handleMoveClick(Math.max(0, gameState.currentMoveIndex - 1))}
              onNextMove={() => handleMoveClick(Math.min(gameService.getChessMoments().length - 2, gameState.currentMoveIndex + 1))} // -2 because chess-moments includes starting position
              onFirstMove={() => handleMoveClick(0)}
              onLastMove={() => handleMoveClick(gameService.getChessMoments().length - 2)} // -2 because chess-moments includes starting position
            />
          )}
        </div>
      </div>
      
      {pgnDisplay}
      
      {/* Instructions */}
      <div style={{ 
        marginTop: '30px', 
        padding: '15px', 
        backgroundColor: '#e8f5e8', 
        borderRadius: '8px',
        border: '1px solid #4CAF50'
      }}>
        <h3 style={{ margin: '0 0 10px 0', color: '#2E7D32' }}>How to Play</h3>
        <ul style={{ margin: 0, paddingLeft: '20px' }}>
          <li><strong>Move pieces:</strong> Drag pieces to make moves</li>
          <li><strong>Navigate:</strong> Click moves in the notation to jump to any position</li>
          <li><strong>Undo:</strong> Use the Undo button to take back the last move</li>
          <li><strong>New Game:</strong> Start a fresh game anytime</li>
          <li><strong>Export:</strong> Save your game as a PGN file</li>
          <li><strong>Import:</strong> Load existing PGN files</li>
        </ul>
      </div>
    </div>
  );
};

export default ChessGamePage;
