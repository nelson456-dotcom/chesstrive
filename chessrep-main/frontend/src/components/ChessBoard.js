import React, { useState, useEffect, useRef } from 'react';
import { Chess } from 'chess.js';
import ProductionChessBoard from './ProductionChessBoard';

const ChessBoard = ({ moves, explanations, onMove, orientation = 'white', onMoveChange, boardSize = 600, currentMoveIndex: externalCurrentMoveIndex = 0, allowUserMoves = false }) => {
  const [game, setGame] = useState(new Chess());
  const [currentMoveIndex, setCurrentMoveIndex] = useState(0);
  const [isUserTurn, setIsUserTurn] = useState(true);
  const [currentExplanation, setCurrentExplanation] = useState('');
  const [customArrows, setCustomArrows] = useState([]);
  const [lastMoveArrow, setLastMoveArrow] = useState(null);
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [possibleMoves, setPossibleMoves] = useState([]);
  const isNavigatingRef = useRef(false);

  // Audio refs
  const moveSoundRef = useRef(null);
  const captureSoundRef = useRef(null);
  const castleSoundRef = useRef(null);

  // Load sounds
  useEffect(() => {
    try {
      moveSoundRef.current = new Audio('/sounds/move-self.mp3');
      moveSoundRef.current.load();
    } catch (error) {
      console.warn('Could not load move sound:', error);
      moveSoundRef.current = null;
    }
    
    try {
      captureSoundRef.current = new Audio('/sounds/capture.mp3');
      captureSoundRef.current.load();
    } catch (error) {
      console.warn('Could not load capture sound:', error);
      captureSoundRef.current = null;
    }
    
    try {
      castleSoundRef.current = new Audio('/sounds/castle.mp3');
      castleSoundRef.current.load();
    } catch (error) {
      console.warn('Could not load castle sound:', error);
      castleSoundRef.current = null;
    }
  }, []);

  // Initialize the game and reset state when moves or explanations change
  useEffect(() => {
    // Don't reinitialize if we're in the middle of navigation
    if (isNavigatingRef.current) {
      console.log('Skipping reinitialization during navigation');
      return;
    }
    
    console.log('ChessBoard initialized with moves:', moves);
    console.log('ChessBoard explanations:', explanations);
    const newGame = new Chess();
    setGame(newGame);
    setCurrentMoveIndex(0);
    setCustomArrows([]);
    setLastMoveArrow(null);
    setIsUserTurn(true);
    setCurrentExplanation(explanations[0] || '');
    if (onMoveChange) onMoveChange(0);
  }, [moves, explanations, onMoveChange]); // Added onMoveChange back to dependencies

  // Update game state when external currentMoveIndex changes
  useEffect(() => {
    console.log('ChessBoard useEffect triggered - externalCurrentMoveIndex:', externalCurrentMoveIndex, 'currentMoveIndex:', currentMoveIndex);

    // Only update if the external index is different from current internal index
    if (externalCurrentMoveIndex === currentMoveIndex) {
      console.log('External index matches current index, skipping update');
      return;
    }

    // Set navigation flag
    isNavigatingRef.current = true;
    console.log('Setting navigation flag to true');

    // Always rebuild game state when external index changes
    console.log('Rebuilding game state for move index:', externalCurrentMoveIndex);

    // Rebuild game state up to the external move index
    const newGame = new Chess();
    for (let i = 0; i < externalCurrentMoveIndex && i < moves.length; i++) {
      try {
        const move = moves[i];
        console.log(`Playing move ${i}: ${move}`);
        const result = newGame.move(move);
        if (!result) {
          console.error(`Failed to play move ${i}: ${move}`);
          break;
        }
      } catch (error) {
        console.error(`Error playing move ${i}: ${moves[i]}`, error);
        break;
      }
    }

    console.log('Setting new game state with FEN:', newGame.fen());
    setGame(newGame);
    setCurrentMoveIndex(externalCurrentMoveIndex);
    setCurrentExplanation(explanations[Math.floor((externalCurrentMoveIndex - 1) / 2)] || '');

    // Show arrows for all moves played so far
    const moveArrows = [];
    if (externalCurrentMoveIndex > 0) {
      const gameHistory = newGame.history({ verbose: true });
      // Show all moves played so far
      gameHistory.forEach((move, index) => {
        moveArrows.push({ from: move.from, to: move.to, color: '#3b82f6' });
      });
      // Highlight the last move in green
      if (gameHistory.length > 0) {
        const lastMove = gameHistory[gameHistory.length - 1];
        moveArrows[moveArrows.length - 1] = { from: lastMove.from, to: lastMove.to, color: '#22c55e' };
        playMoveSound(lastMove);
      }
    }
    setCustomArrows(moveArrows);

    // Clear navigation flag after a short delay
    setTimeout(() => {
      isNavigatingRef.current = false;
      console.log('Clearing navigation flag');
    }, 100);
  }, [externalCurrentMoveIndex, moves, explanations, currentMoveIndex]);


  // Keyboard navigation - Live Analysis style
  useEffect(() => {
    const handleKeyPress = (event) => {
      // Only handle keyboard navigation if we have onMoveChange callback
      if (!onMoveChange) return;
      
      switch (event.key) {
        case 'ArrowRight':
        case 'd':
        case 'D':
        case ' ':
          event.preventDefault();
          playNextMove();
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          event.preventDefault();
          playPreviousMove();
          break;
        case 'ArrowUp':
        case 'w':
        case 'W':
          event.preventDefault();
          if (onMoveChange) onMoveChange(0);
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          event.preventDefault();
          if (onMoveChange) onMoveChange(moves.length);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [externalCurrentMoveIndex, moves.length, onMoveChange]);

  const playMoveSound = (moveObj) => {
    if (!moveObj) return;
    try {
      if (moveObj.flags.includes('c')) {
        captureSoundRef.current?.play().catch(e => console.warn('Could not play capture sound:', e));
      } else if (moveObj.san === 'O-O' || moveObj.san === 'O-O-O') {
        castleSoundRef.current?.play().catch(e => console.warn('Could not play castle sound:', e));
      } else {
        moveSoundRef.current?.play().catch(e => console.warn('Could not play move sound:', e));
      }
    } catch (error) {
      console.warn('Error playing move sound:', error);
    }
  };

  const makeMove = (move) => {
    try {
      const result = game.move(move);
      if (result) {
        setGame(new Chess(game.fen()));
        playMoveSound(result);
        setLastMoveArrow({ from: result.from, to: result.to, color: '#2196f3' });
        return result;
      }
    } catch (error) {
      console.error('Error making move:', error);
    }
    return null;
  };

  const playOpponentMove = (moves, currentMoveIndex) => {
    if (currentMoveIndex < moves.length) {
      const newGame = new Chess();
      
      // Replay all moves up to the current move index + 1
      for (let i = 0; i <= currentMoveIndex; i++) {
        try {
          const move = moves[i];
          const result = newGame.move(move);
          if (!result) {
            console.error(`Failed to play move ${i}: ${move}`);
            return;
          }
        } catch (error) {
          console.error(`Error playing move ${i}: ${moves[i]}`, error);
          return;
        }
      }
      
      setGame(newGame);
      const newIndex = currentMoveIndex + 1;
      setCurrentMoveIndex(newIndex);
      setCurrentExplanation(explanations[Math.floor((newIndex - 1) / 2)] || '');
      
      // Show arrow for the last move played
      if (newIndex > 0) {
        const lastMove = newGame.history({ verbose: true })[newGame.history().length - 1];
        if (lastMove) {
          setCustomArrows([`${lastMove.from}-${lastMove.to}`]);
          setLastMoveArrow({ from: lastMove.from, to: lastMove.to, color: '#2196f3' });
          playMoveSound(lastMove);
        }
      }
      
      if (onMoveChange) onMoveChange(newIndex);
    }
  };

  const resetBoard = () => {
    const newGame = new Chess();
    setGame(newGame);
    setCurrentMoveIndex(0);
    setCustomArrows([]);
    setLastMoveArrow(null);
    setIsUserTurn(true);
    setCurrentExplanation(explanations[0] || '');
    if (onMoveChange) onMoveChange(0);
  };

  const playNextMove = () => {
    console.log('playNextMove called, externalCurrentMoveIndex:', externalCurrentMoveIndex, 'moves.length:', moves.length);
    
    if (externalCurrentMoveIndex < moves.length) {
      const newIndex = externalCurrentMoveIndex + 1;
      console.log('Advancing to move index:', newIndex);
      
      // Set navigation flag to prevent conflicts
      isNavigatingRef.current = true;
      
      if (onMoveChange) {
        console.log('Calling onMoveChange with:', newIndex);
        onMoveChange(newIndex);
      } else {
        console.log('onMoveChange is not defined');
      }
    } else {
      console.log('No more moves to play');
    }
  };

  const playPreviousMove = () => {
    console.log('playPreviousMove called, externalCurrentMoveIndex:', externalCurrentMoveIndex);
    
    if (externalCurrentMoveIndex > 0) {
      const newIndex = externalCurrentMoveIndex - 1;
      console.log('Going back to move index:', newIndex);
      
      // Set navigation flag to prevent conflicts
      isNavigatingRef.current = true;
      
      if (onMoveChange) {
        console.log('Calling onMoveChange with:', newIndex);
        onMoveChange(newIndex);
      } else {
        console.log('onMoveChange is not defined');
      }
    } else {
      console.log('Already at first move');
    }
  };

  const getCustomSquareStyles = () => {
    const styles = {};
    
    // Highlight selected square
    if (selectedSquare) {
      styles[selectedSquare] = {
        backgroundColor: 'rgba(255, 255, 0, 0.4)',
        borderRadius: '50%'
      };
    }
    
    // Highlight possible moves
    possibleMoves.forEach(square => {
      styles[square] = {
        backgroundColor: 'rgba(0, 255, 0, 0.4)',
        borderRadius: '50%'
      };
    });
    
    // No green highlight on board squares - arrows will show the moves instead
    
    return styles;
  };

  const onSquareClick = (square) => {
    if (!allowUserMoves) return;
    
    if (selectedSquare) {
      // If a square is already selected, try to make a move
      const move = {
        from: selectedSquare,
        to: square,
        promotion: 'q' // Default to queen promotion
      };
      
      try {
        const result = game.move(move);
        if (result) {
          // Valid move
          setGame(new Chess(game.fen()));
          setSelectedSquare(null);
          setPossibleMoves([]);
          playMoveSound(result);
          setLastMoveArrow({ from: result.from, to: result.to, color: '#2196f3' });
          
          // Call onMove callback if provided
          if (onMove) {
            onMove(result);
          }
        } else {
          // Invalid move, select the new square
          setSelectedSquare(square);
          setPossibleMoves(getPossibleMoves(square));
        }
      } catch (error) {
        // Invalid move, select the new square
        setSelectedSquare(square);
        setPossibleMoves(getPossibleMoves(square));
      }
    } else {
      // No square selected, select this square if it has a piece
      const piece = game.get(square);
      if (piece && piece.color === game.turn()) {
        setSelectedSquare(square);
        setPossibleMoves(getPossibleMoves(square));
      }
    }
  };

  const onPieceDrop = (from, to, piece) => {
    if (!allowUserMoves) return false;
    
    try {
      const move = {
        from: from,
        to: to,
        promotion: 'q' // Default to queen promotion
      };
      
      const result = game.move(move);
      if (result) {
        // Valid move
        setGame(new Chess(game.fen()));
        setSelectedSquare(null);
        setPossibleMoves([]);
        playMoveSound(result);
        setLastMoveArrow({ from: result.from, to: result.to, color: '#2196f3' });
        
        // Call onMove callback if provided
        if (onMove) {
          onMove(result);
        }
        return true;
      }
    } catch (error) {
      console.log('Invalid move:', error);
    }
    
    return false;
  };

  const getPossibleMoves = (square) => {
    const moves = game.moves({ square, verbose: true });
    return moves.map(move => move.to);
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      {/* Chess Board */}
      <div className="relative" style={{ width: '100%', maxWidth: `${boardSize}px` }}>
        <ProductionChessBoard
          position={game.fen()}
          onMove={(source, target) => onPieceDrop(source, target, '')}
          onSquareClick={onSquareClick}
          boardOrientation={orientation}
          fitToParent={true}
          boardSize={boardSize}
          customBoardStyle={{
            borderRadius: '8px',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
            touchAction: 'manipulation',
            userSelect: 'none',
            WebkitUserSelect: 'none',
            MozUserSelect: 'none',
            msUserSelect: 'none',
            WebkitTouchCallout: 'none',
            WebkitTapHighlightColor: 'transparent',
            cursor: 'pointer'
          }}
          customSquareStyles={getCustomSquareStyles()}
          customArrows={customArrows}
          arePiecesDraggable={allowUserMoves}
          areArrowsAllowed={true}
        />
      </div>

      {/* Explanation */}
      {currentExplanation && (
        <div className="bg-gray-800 text-white p-4 rounded-lg max-w-md text-center">
          <p className="text-sm">{currentExplanation}</p>
        </div>
      )}

      {/* Navigation Controls - Live Analysis Style */}
      <div className="mt-6 flex justify-center">
        <div className="bg-blue-100 border border-blue-300 rounded-lg px-3 py-1">
          <span className="text-blue-700 text-sm font-medium">🎮 Navigation Controls</span>
        </div>
      </div>
      <div className="mt-4 flex justify-center items-center gap-4">
        <button
          onClick={() => {
            if (onMoveChange) onMoveChange(0);
          }}
          disabled={externalCurrentMoveIndex <= 0}
          className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-2 px-3 rounded-lg shadow-lg transform transition-all duration-200 hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed"
          title="Go to start (↑ or W)"
        >
          ⏮
        </button>
        <button
          onClick={playPreviousMove}
          disabled={externalCurrentMoveIndex <= 0}
          className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-blue-400 disabled:to-blue-500 text-white font-semibold py-2 px-3 rounded-lg shadow-lg transform transition-all duration-200 hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed"
          title="Previous move (← or A)"
        >
          ◀
        </button>
        <div className="bg-gray-100 px-4 py-2 rounded-lg border border-gray-300">
          <span className="text-sm font-semibold text-gray-700">
            {externalCurrentMoveIndex === 0 ? 'Initial position' : `Move ${externalCurrentMoveIndex} of ${moves.length}`}
          </span>
        </div>
        <button
          onClick={playNextMove}
          disabled={externalCurrentMoveIndex >= moves.length}
          className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-blue-400 disabled:to-blue-500 text-white font-semibold py-2 px-3 rounded-lg shadow-lg transform transition-all duration-200 hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed"
          title="Next move (→ or D)"
        >
          ▶
        </button>
        <button
          onClick={() => {
            if (onMoveChange) onMoveChange(moves.length);
          }}
          disabled={externalCurrentMoveIndex >= moves.length}
          className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-2 px-3 rounded-lg shadow-lg transform transition-all duration-200 hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed"
          title="Go to end (↓ or S)"
        >
          ⏭
        </button>
      </div>
    </div>
  );
};

export default ChessBoard;