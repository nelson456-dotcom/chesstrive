import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import { useAuth } from '../contexts/AuthContext';

const API_BASE = 'http://localhost:3001/api/famous-games';

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const GameViewerPage = () => {
  const query = useQuery();
  const navigate = useNavigate();
  const { user } = useAuth() || {};
  const file = query.get('file');
  const gameIndexParam = query.get('game');
  const gameIndex = gameIndexParam !== null ? parseInt(gameIndexParam, 10) : null;

  const [moves, setMoves] = useState([]);
  const [moveHistory, setMoveHistory] = useState([]);
  const [chess, setChess] = useState(new Chess());
  const [fen, setFen] = useState('');
  const [score, setScore] = useState(0);
  const [showSummary, setShowSummary] = useState(false);
  const [mistakes, setMistakes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [gameMeta, setGameMeta] = useState(null);
  const [error, setError] = useState(null);
  const [arrow, setArrow] = useState(null); // { from: 'e2', to: 'e4' }
  const [highlightedSquares, setHighlightedSquares] = useState([]); // For right-click red highlight
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentMoveIndex, setCurrentMoveIndex] = useState(0);
  const [isWaitingForGuess, setIsWaitingForGuess] = useState(true);
  const [correctMoves, setCorrectMoves] = useState(0);
  const [wrongMoves, setWrongMoves] = useState(0);
  const [userSide, setUserSide] = useState('white'); // 'white' or 'black'
  const [sideSelected, setSideSelected] = useState(false);

  // Sound refs
  const moveSoundRef = useRef(null);
  const captureSoundRef = useRef(null);
  const castleSoundRef = useRef(null);
  
  // Ref to track current move index for immediate access
  const currentMoveIndexRef = useRef(0);

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

  const playMoveSound = (moveObj) => {
    if (!moveObj) return;
    try {
      if (moveObj.flags && moveObj.flags.includes('c')) {
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

  // Play opponent's move automatically (opposite side of user)
  const playOpponentMove = async () => {
    console.log('🎯 playOpponentMove called, currentMoveIndex:', currentMoveIndexRef.current, 'moves.length:', moves.length);
    
    if (currentMoveIndexRef.current >= moves.length) {
      console.log('🎯 Game over, showing summary');
      setShowSummary(true);
      setIsAnimating(false);
      return;
    }
    
    const opponentMove = moves[currentMoveIndexRef.current];
    const moveNumber = Math.floor(currentMoveIndexRef.current / 2) + 1;
    const isWhiteMove = currentMoveIndexRef.current % 2 === 0;
    const player = isWhiteMove ? 'White' : 'Black';
    
    console.log('🎯 Playing opponent move:', opponentMove, 'for', player, 'current chess position:', chess.fen());
    
    setFeedback(`${player} plays ${opponentMove}`);
    setIsAnimating(true);
    setIsWaitingForGuess(false);
    
    try {
      // Try to play the move on the main chess instance
      let moveObj = null;
      try {
        moveObj = chess.move(opponentMove, { sloppy: true });
        console.log('🎯 Opponent move successful:', moveObj);
      } catch (error) {
        console.error('🎯 Opponent move failed:', opponentMove, error);
        setIsAnimating(false);
        return;
      }
      
      if (moveObj) {
        // Play sound
        playMoveSound(moveObj);
        
        // Add move to history
        setMoveHistory(prev => [...prev, opponentMove]);
        
        // Update the FEN state to reflect the new position
        setFen(chess.fen());
        
        // Wait for animation
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log('🎯 Opponent move animation completed');
      }
      
      // Update currentMoveIndex after the opponent move is played
      currentMoveIndexRef.current += 1;
      setCurrentMoveIndex(currentMoveIndexRef.current);
      console.log('🎯 currentMoveIndex updated to:', currentMoveIndexRef.current);
      
      // Check if there are more moves to play
      if (currentMoveIndexRef.current < moves.length) {
        // Check if next move is user's turn or opponent's turn
        const nextIsWhiteMove = currentMoveIndexRef.current % 2 === 0;
        const isUserTurn = (userSide === 'white' && nextIsWhiteMove) || (userSide === 'black' && !nextIsWhiteMove);
        
        if (isUserTurn) {
          setIsWaitingForGuess(true);
          setIsAnimating(false);
          setFeedback(`Your turn! Guess ${userSide === 'white' ? 'White' : 'Black'}'s next move.`);
          console.log('🎯 Ready for next user move');
        } else {
          // Next move is also opponent's turn, play it automatically
          console.log('🎯 Next move is also opponent turn, playing automatically');
          setTimeout(() => playOpponentMove(), 500); // Small delay between opponent moves
        }
      } else {
        setShowSummary(true);
        setIsAnimating(false);
        setFeedback('Game complete!');
        console.log('🎯 Game complete');
      }
      
    } catch (error) {
      console.error('Error playing opponent move:', opponentMove, error);
      setFeedback('Error playing opponent move');
      setIsAnimating(false);
    }
  };

  useEffect(() => {
    // Reset error state
    setError(null);
    
    // Validate required parameters
    if (!file || gameIndex === null || isNaN(gameIndex)) {
      setError('Missing game parameters. Please select a game from the list.');
      setFeedback('No game selected. Please go back and select a game.');
      return;
    }
    
    // Reset game state
    setMoves([]);
    setMoveHistory([]);
    const chessInstance = new Chess();
    setChess(chessInstance);
    setFen(chessInstance.fen());
    setShowSummary(false);
    setScore(0);
    setMistakes([]);
    setFeedback('Loading game...');
    setLoading(true);
    setIsAnimating(false);
    setCurrentMoveIndex(0);
    currentMoveIndexRef.current = 0;
    setArrow(null);
    setIsWaitingForGuess(false);
    setCorrectMoves(0);
    setWrongMoves(0);
    setSideSelected(false);
    setUserSide('white');
    
    // Load game moves
    const token = localStorage.getItem('token');
    const headers = token
      ? {
          'x-auth-token': token,
          Authorization: `Bearer ${token}`,
        }
      : {};

    fetch(`${API_BASE}/${file}/games/${gameIndex}`, { headers })
      .then(res => {
        // Treat 204 (No Content) as an error – there is no game data for this index
        if (res.status === 204) {
          throw new Error('This game has no moves or could not be found (empty response).');
        }
        if (!res.ok) {
          if (res.status === 401) {
            throw new Error('You must be logged in to view this game.');
          }
          if (res.status === 403) {
            throw new Error('This feature is available for premium users only.');
          }
          throw new Error(`Failed to load game: ${res.status} ${res.statusText}`);
        }
        return res.json();
      })
      .then(data => {
        if (!data || !data.moves || data.moves.length === 0) {
          throw new Error('Game has no moves or invalid game data');
        }
        setMoves(data.moves || []);
        setFeedback('Choose which side you want to play as:');
        setLoading(false);
        console.log('🎯 Game loaded successfully, moves:', data.moves?.length, 'sideSelected:', false);
      })
      .catch(err => {
        console.error('Error loading game:', err);
        setError(`Could not load game: ${err.message}`);
        setFeedback(`Error: Could not load game. ${err.message}`);
        setLoading(false);
      });
    
    // Fetch game metadata
    fetch(`${API_BASE}/${file}/games`)
      .then(res => {
        if (!res.ok) {
          console.warn('Failed to load game metadata:', res.status);
          return { games: [] };
        }
        return res.json();
      })
      .then(data => {
        if (data.games && data.games[gameIndex]) {
          setGameMeta(data.games[gameIndex]);
        }
      })
      .catch(err => {
        console.warn('Error loading game metadata:', err);
        // Don't set error for metadata failure, just log it
      });
  }, [file, gameIndex]);

  useEffect(() => {
    console.log('🎯 useEffect triggered, moveHistory:', moveHistory);
    const chessInstance = new Chess();
    
    // Replay all moves with error handling
    for (const m of moveHistory) {
      try {
        const result = chessInstance.move(m, { sloppy: true });
        if (!result) {
          console.warn('Could not play move:', m, 'in position:', chessInstance.fen());
          break; // Stop if we can't play a move
        }
        console.log('🎯 Successfully played move:', m, 'new position:', chessInstance.fen());
      } catch (error) {
        console.warn('Error playing move:', m, error);
        break; // Stop if we encounter an error
      }
    }
    
    console.log('🎯 Final chess position:', chessInstance.fen());
    setChess(chessInstance);
    setFen(chessInstance.fen());
    
    // Set arrow for the last move played (user or opponent)
    if (moveHistory.length > 0) {
      // Get the last move from the move history
      let moveObj = null;
      try {
        // Rewind the chess instance to one move before the last
        const tempChess = new Chess();
        for (let i = 0; i < moveHistory.length - 1; i++) {
          try {
          tempChess.move(moveHistory[i], { sloppy: true });
          } catch (e) {
            console.warn('Could not replay move for arrow:', moveHistory[i], e);
            break;
          }
        }
        // Now play the last move and get its from/to
        moveObj = tempChess.move(moveHistory[moveHistory.length - 1], { sloppy: true });
        console.log('🎯 Arrow move object:', moveObj);
      } catch (error) {
        console.warn('Error getting move object for arrow:', error);
      }
      if (moveObj && moveObj.from && moveObj.to) {
        setArrow({ from: moveObj.from, to: moveObj.to, color: '#e67e22' });
        console.log('🎯 Arrow set:', moveObj.from, 'to', moveObj.to);
      } else {
        setArrow(null);
        console.log('🎯 No arrow set');
      }
    } else {
      setArrow(null);
      console.log('🎯 No moves, no arrow');
    }
  }, [moveHistory]);


  const handleMove = async (from, to) => {
    if (showSummary || isAnimating || !isWaitingForGuess || !sideSelected) return false;
    
    // Check if it's the user's turn to move
    const isWhiteMove = currentMoveIndexRef.current % 2 === 0;
    const isUserTurn = (userSide === 'white' && isWhiteMove) || (userSide === 'black' && !isWhiteMove);
    
    if (!isUserTurn) {
      console.log('🎯 Not user turn, ignoring move');
      return false;
    }
    
    const move = chess.move({ from, to, promotion: 'q' });
    if (!move) return false;
    
    const userGuess = move.san;
    const positionAfterUserMove = chess.fen(); // Get position after user's move
    chess.undo(); // Undo the move to check against the correct move
    
    setIsAnimating(true);
    setIsWaitingForGuess(false);
    setFeedback('Checking your move...');
    
    // Get the correct move for this position
    const correctMove = moves[currentMoveIndexRef.current];
    const isCorrect = userGuess === correctMove;
    
    if (isCorrect) {
      setCorrectMoves(prev => prev + 1);
      setFeedback('Correct! Great move!');
    } else {
      setWrongMoves(prev => prev + 1);
      setFeedback(`Incorrect. The correct move was ${correctMove}`);
    }
    
    // Play the correct move (user's move if correct, or the correct move if wrong)
    try {
      console.log('🎯 Playing user move:', correctMove);
      
      // Play the move on the main chess instance
      const moveObj = chess.move(correctMove, { sloppy: true });
      if (moveObj) {
        // Play sound
        playMoveSound(moveObj);
        
        // Add move to history
        setMoveHistory(prev => [...prev, correctMove]);
        
        // Update the FEN state to reflect the new position
        setFen(chess.fen());
        
        // Wait for animation
        await new Promise(resolve => setTimeout(resolve, 500));
        console.log('🎯 User move completed');
      }
      
      // Update currentMoveIndex after user's move
      currentMoveIndexRef.current += 1;
      setCurrentMoveIndex(currentMoveIndexRef.current);
      console.log('🎯 currentMoveIndex updated to:', currentMoveIndexRef.current);
      
      // After user's move, play opponent's move automatically
      console.log('🎯 Playing opponent move immediately');
      await playOpponentMove();
      
      // Reset animating state after both user and opponent moves
      setIsAnimating(false);
      
    } catch (error) {
      console.error('Error playing move:', correctMove, error);
      setFeedback('Error playing move');
      setIsAnimating(false);
      setIsWaitingForGuess(true);
    }
    
    return false;
  };

  const handleSideSelection = (side) => {
    setUserSide(side);
    setSideSelected(true);
    setIsWaitingForGuess(true);
    
    // Check if the first move is the user's turn
    const isFirstMoveUserTurn = (side === 'white' && currentMoveIndexRef.current % 2 === 0) || 
                               (side === 'black' && currentMoveIndexRef.current % 2 === 1);
    
    if (isFirstMoveUserTurn) {
      setFeedback(`Your turn! Guess ${side === 'white' ? 'White' : 'Black'}'s first move.`);
    } else {
      // First move is opponent's turn, play it automatically
      setFeedback(`${side === 'white' ? 'Black' : 'White'} plays first. Playing automatically...`);
      setTimeout(() => playOpponentMove(), 1000);
    }
  };

  const handleRestart = () => {
    const newChess = new Chess();
    setMoveHistory([]);
    setChess(newChess);
    setFen(newChess.fen());
    setScore(0);
    setMistakes([]);
    setShowSummary(false);
    setFeedback('Choose which side you want to play as:');
    setIsAnimating(false);
    setCurrentMoveIndex(0);
    currentMoveIndexRef.current = 0;
    setArrow(null);
    setIsWaitingForGuess(false);
    setCorrectMoves(0);
    setWrongMoves(0);
    setSideSelected(false);
    setUserSide('white');
  };

  const handleRightClickSquare = (square) => {
    setHighlightedSquares((prev) =>
      prev.includes(square)
        ? prev.filter((s) => s !== square)
        : [...prev, square]
    );
  };

  const getCustomSquareStyles = () => {
    const styles = {};
    highlightedSquares.forEach((sq) => {
      styles[sq] = { backgroundColor: 'rgba(255, 0, 0, 0.4)' };
    });
    return styles;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-6 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <button 
            className="mb-6 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-xl shadow-lg transform transition-all duration-200 hover:scale-105"
            onClick={() => navigate('/guess-the-move')}
          >
            ← Back to Game List
          </button>
          <h1 className="text-3xl sm:text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent">
            Guess the Move
          </h1>
          <p className="text-gray-600 text-lg">Test your chess knowledge with famous games</p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="max-w-2xl mx-auto mb-8">
            <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-2xl shadow-xl border border-red-200 p-6">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center mr-3">
                  <span className="text-white font-bold">!</span>
                </div>
                <h2 className="text-xl font-bold text-red-800">Error Loading Game</h2>
              </div>
              <p className="text-red-700 mb-4">{error}</p>
              <button
                onClick={() => navigate('/guess-the-move')}
                className="w-full px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold rounded-xl shadow-lg transform transition-all duration-200 hover:scale-105"
              >
                Go Back to Game List
              </button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && !error && (
          <div className="max-w-2xl mx-auto mb-8">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl shadow-xl border border-blue-200 p-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className="text-blue-700 text-lg font-semibold">Loading game...</p>
                <p className="text-blue-600 text-sm mt-2">Please wait while we load the game data</p>
              </div>
            </div>
          </div>
        )}

        {/* Game Info */}
      {gameMeta && (
          <div className="mb-8 bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-xl border border-gray-200 p-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-800 mb-2">{gameMeta.white} vs {gameMeta.black}</div>
              <div className="text-lg text-gray-600 mb-2">{gameMeta.event} ({gameMeta.year})</div>
              <div className="text-sm text-gray-500">Result: {gameMeta.result} | ECO: {gameMeta.eco}</div>
            </div>
        </div>
      )}

        {/* Side Selection */}
        {!loading && !error && moves.length > 0 && !showSummary && !sideSelected && (
          <div className="max-w-2xl mx-auto mb-8">
            <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-xl border border-gray-200 p-8">
              <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Choose Your Side</h2>
              <p className="text-gray-600 text-center mb-8">Select which side you want to play as. The other side will be played automatically.</p>
              
              <div className="flex gap-6 justify-center">
                <button
                  onClick={() => handleSideSelection('white')}
                  className="px-8 py-4 bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-800 font-bold text-lg rounded-xl shadow-lg transform transition-all duration-200 hover:scale-105 border-2 border-gray-300"
                >
                  ⚪ Play as White
                </button>
                <button
                  onClick={() => handleSideSelection('black')}
                  className="px-8 py-4 bg-gradient-to-r from-gray-800 to-gray-900 hover:from-gray-700 hover:to-gray-800 text-white font-bold text-lg rounded-xl shadow-lg transform transition-all duration-200 hover:scale-105 border-2 border-gray-600"
                >
                  ⚫ Play as Black
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Game Area */}
      {!loading && !error && moves.length > 0 && !showSummary && sideSelected && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Chess Board */}
            <div className="lg:col-span-3">
              <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl shadow-2xl border border-gray-200 p-6">
                <div className="flex flex-col items-center">
                  {/* Turn Indicator */}
                  <div className={`mb-6 px-6 py-3 rounded-xl font-bold text-lg shadow-lg transform transition-all duration-300 ${
                    isAnimating 
                      ? 'bg-yellow-500/20 text-yellow-700 border border-yellow-500/30'
                      : (chess?.turn() === 'w' 
                        ? 'bg-blue-500/20 text-blue-700 border border-blue-500/30' 
                        : 'bg-gray-500/20 text-gray-700 border border-gray-500/30')
                  }`}>
                    {isAnimating 
                      ? 'Playing move...' 
                      : (chess?.turn() === 'w' 
                        ? (userSide === 'white' ? 'Your turn (White)' : 'White to move') 
                        : (userSide === 'black' ? 'Your turn (Black)' : 'Black to move'))}
                  </div>
                  
                  {/* Board Container - EXACT COPY from PuzzleSolvePage for mobile drag-and-drop */}
                  <div className="relative w-full" style={{ touchAction: 'manipulation', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg sm:rounded-2xl p-1 sm:p-4 shadow-inner border border-amber-200" 
                      style={{ 
                        touchAction: 'manipulation',
                        width: 'fit-content',
                        margin: '0 auto'
                      }}>
                      <div className="bg-gradient-to-br from-amber-100 to-orange-100 rounded-md sm:rounded-xl p-0.5 sm:p-2 shadow-lg" 
                        style={{ 
                          touchAction: 'manipulation',
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center'
                        }}>
                        <div style={{ 
                          // Slightly smaller board for better mobile experience
                          width: Math.min(420, window.innerWidth - 80), 
                          height: Math.min(420, window.innerWidth - 80),
                          touchAction: 'manipulation',
                          WebkitUserSelect: 'none',
                          userSelect: 'none'
                        }}>
                          <Chessboard
                            position={fen}
                            onPieceDrop={handleMove}
                            onRightClickSquare={handleRightClickSquare}
                            customSquareStyles={getCustomSquareStyles()}
                            boardWidth={Math.min(420, window.innerWidth - 80)}
                            arePiecesDraggable={!showSummary && !isAnimating && isWaitingForGuess && sideSelected}
                            customArrows={arrow ? [[arrow.from, arrow.to, arrow.color || '#e67e22']] : []}
                            animationDuration={200}
                            customBoardStyle={{
                              borderRadius: '8px',
                              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                              // Mobile touch optimizations - CRITICAL for drag-and-drop (EXACT COPY from PuzzleSolvePage)
                              touchAction: 'none', // Disable browser gestures to allow proper drag handling
                              pointerEvents: 'auto', // Ensure touch events are captured
                              userSelect: 'none', // Prevent text selection on mobile
                              WebkitUserSelect: 'none',
                              MozUserSelect: 'none',
                              msUserSelect: 'none',
                              userSelect: 'none',
                              WebkitTouchCallout: 'none', // Disable iOS callout
                              WebkitTapHighlightColor: 'transparent', // Remove tap highlight
                              WebkitUserDrag: 'none', // Prevent drag ghosts
                              cursor: 'pointer', // Ensure cursor shows interaction
                              // Ensure proper positioning for drag and drop
                              position: 'relative',
                              zIndex: 1, // Ensure board is not blocked by overlays
                              transform: 'none',
                              willChange: 'auto'
                            }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Sidebar */}
            <div className="lg:col-span-1 space-y-4">
              {/* Score */}
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl shadow-xl border border-green-200 p-4">
                <h3 className="text-lg font-bold mb-3 text-green-800 flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  Score
                </h3>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">{correctMoves}</div>
                  <div className="text-sm text-green-700 mt-1">Correct Guesses</div>
                  <div className="text-lg font-semibold text-red-600 mt-2">{wrongMoves}</div>
                  <div className="text-sm text-red-700">Wrong Guesses</div>
                </div>
              </div>

              {/* Progress */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl shadow-xl border border-blue-200 p-4">
                <h3 className="text-lg font-bold mb-3 text-blue-800 flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                  Progress
                </h3>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{Math.floor(currentMoveIndex / 2)} / {Math.floor(moves.length / 2)}</div>
                  <div className="text-sm text-blue-700 mt-1">Moves</div>
                </div>
              </div>

              {/* Feedback */}
              {feedback && (
                <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-2xl shadow-xl border border-yellow-200 p-4">
                  <h3 className="text-lg font-bold mb-3 text-yellow-800 flex items-center">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full mr-3"></div>
                    Feedback
                  </h3>
                  <p className="text-sm text-yellow-700">{feedback}</p>
                </div>
              )}

              {/* Loading */}
              {loading && (
                <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-2xl shadow-xl border border-teal-200 p-4">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500 mx-auto mb-2"></div>
                    <p className="text-sm text-teal-700">Checking move...</p>
                  </div>
        </div>
      )}

              {/* Controls */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl shadow-xl border border-gray-200 p-4">
                <button 
                  className="w-full px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold rounded-xl shadow-lg transform transition-all duration-200 hover:scale-105"
                  onClick={handleRestart}
                >
                  🔄 Restart Game
                </button>
              </div>
            </div>
            </div>
          )}

        {/* Game Summary */}
        {showSummary && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-2xl border border-gray-200 p-8">
              <h2 className="text-3xl font-bold mb-6 text-center text-gray-800">Game Complete!</h2>
              <div className="text-center mb-8">
                <div className="text-4xl font-bold text-green-600 mb-2">{correctMoves} Correct</div>
                <div className="text-2xl font-bold text-red-600 mb-2">{wrongMoves} Wrong</div>
                <div className="text-lg text-gray-600">out of {Math.floor(moves.length / 2)} moves</div>
                <div className="text-lg text-blue-600 mt-2">
                  Accuracy: {Math.round((correctMoves / (correctMoves + wrongMoves)) * 100)}%
                </div>
              </div>
              
              <div className="text-center">
                <button 
                  className="px-8 py-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold text-lg rounded-xl shadow-lg transform transition-all duration-200 hover:scale-105"
                  onClick={handleRestart}
                >
                  Play Again
                </button>
              </div>
            </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default GameViewerPage; 
