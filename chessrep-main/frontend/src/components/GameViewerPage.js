import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import OpenInLiveAnalysisButton from './OpenInLiveAnalysisButton';

const API_BASE = 'http://localhost:3001/api/famous-games';

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const GameViewerPage = () => {
  const query = useQuery();
  const navigate = useNavigate();
  const file = query.get('file');
  const gameIndex = query.get('game');

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
  const [arrow, setArrow] = useState(null); // { from: 'e2', to: 'e4' }
  const [highlightedSquares, setHighlightedSquares] = useState([]); // For right-click red highlight
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentMoveIndex, setCurrentMoveIndex] = useState(0);
  const [isWaitingForGuess, setIsWaitingForGuess] = useState(true);
  const [correctMoves, setCorrectMoves] = useState(0);
  const [wrongMoves, setWrongMoves] = useState(0);

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

  // Play opponent's move automatically
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
        // Check if next move is user's turn (White) or opponent's turn (Black)
        const nextIsWhiteMove = currentMoveIndexRef.current % 2 === 0;
        if (nextIsWhiteMove) {
          setIsWaitingForGuess(true);
          setIsAnimating(false);
          setFeedback('Your turn! Guess the next move.');
          console.log('🎯 Ready for next user move');
        } else {
          // Next move is also opponent's turn, play it automatically
          console.log('🎯 Next move is also opponent turn, playing automatically');
          setTimeout(() => playOpponentMove(), 1000); // Small delay between opponent moves
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
    if (!file || gameIndex === null) return;
    setMoves([]);
    setMoveHistory([]);
    const chessInstance = new Chess();
    setChess(chessInstance);
    setFen(chessInstance.fen());
    setShowSummary(false);
    setScore(0);
    setMistakes([]);
    setFeedback('Loading game...');
    setIsAnimating(false);
    setCurrentMoveIndex(0);
    currentMoveIndexRef.current = 0;
    setArrow(null);
    setIsWaitingForGuess(true);
    setCorrectMoves(0);
    setWrongMoves(0);
    fetch(`${API_BASE}/${file}/games/${gameIndex}`)
      .then(res => res.json())
      .then(data => {
        setMoves(data.moves || []);
        setFeedback('Your turn! Guess White\'s first move.');
      });
    // Fetch game metadata
    fetch(`${API_BASE}/${file}/games`)
      .then(res => res.json())
      .then(data => {
        if (data.games && data.games[gameIndex]) {
          setGameMeta(data.games[gameIndex]);
        }
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

  // Function to animate moves slowly
  const animateMove = async (move, delay = 1000, startingPosition = null) => {
    console.log('🎯 animateMove called with move:', move, 'delay:', delay, 'startingPosition:', startingPosition);
    await new Promise(resolve => setTimeout(resolve, delay));
    
    try {
      // Create a temporary chess instance to get move details
      const tempChess = new Chess();
      
      if (startingPosition) {
        // Use the provided starting position
        tempChess.load(startingPosition);
        console.log('🎯 Using provided starting position:', startingPosition);
      } else {
        // Fallback to replaying moveHistory
        console.log('🎯 Replaying moveHistory in tempChess:', moveHistory);
        for (const m of moveHistory) {
          try {
            tempChess.move(m, { sloppy: true });
          } catch (e) {
            console.warn('Could not replay move in tempChess:', m, e);
          }
        }
      }
      console.log('🎯 tempChess position after setup:', tempChess.fen());
      
      // Try to play the move with different formats
      let moveObj = null;
      
      // First try SAN format
      try {
        moveObj = tempChess.move(move, { sloppy: true });
        console.log('🎯 SAN move successful:', moveObj);
      } catch (error) {
        console.log('🎯 SAN move failed, trying UCI format:', move);
        // If SAN fails, try UCI format
        if (move.length === 4 && /^[a-h][1-8][a-h][1-8]$/.test(move)) {
          const from = move.substring(0, 2);
          const to = move.substring(2, 4);
          try {
            moveObj = tempChess.move({ from, to, promotion: 'q' });
            console.log('🎯 UCI move successful:', moveObj);
          } catch (e) {
            console.warn('Could not play UCI move:', move, e);
          }
        } else {
          // Try other common formats
          try {
            moveObj = tempChess.move(move);
            console.log('🎯 Other format move successful:', moveObj);
          } catch (e) {
            console.warn('Could not play move:', move, e);
            setIsAnimating(false);
            return;
          }
        }
      }
      
      if (moveObj) {
        console.log('🎯 Move object created, playing sound and adding to history');
        // Play sound
        playMoveSound(moveObj);
        
        // Add move to history - this will trigger the useEffect to update chess state
        console.log('🎯 Adding move to history:', move, 'current moveHistory:', moveHistory);
        setMoveHistory(prev => {
          const newHistory = [...prev, move];
          console.log('🎯 New moveHistory will be:', newHistory);
          return newHistory;
        });
        
        // Wait for the animation to complete (2 seconds)
        await new Promise(resolve => setTimeout(resolve, 2000));
        console.log('🎯 Animation completed for move:', move);
      } else {
        console.warn('Move could not be played:', move);
        // Don't add invalid moves to history
        setIsAnimating(false);
        return;
      }
    } catch (error) {
      console.error('Error animating move:', move, error);
      setIsAnimating(false);
    }
  };

  const handleMove = async (from, to) => {
    if (showSummary || isAnimating || !isWaitingForGuess) return false;
    
    // Check if it's the user's turn to move (White moves only)
    const isWhiteMove = currentMoveIndexRef.current % 2 === 0;
    if (!isWhiteMove) {
      console.log('🎯 Not user turn, ignoring move');
      return false;
    }
    
    const move = chess.move({ from, to, promotion: 'q' });
    if (!move) return false;
    
    const userGuess = move.san;
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
      
    } catch (error) {
      console.error('Error playing move:', correctMove, error);
      setFeedback('Error playing move');
      setIsAnimating(false);
      setIsWaitingForGuess(true);
    }
    
    return false;
  };

  const handleRestart = () => {
    const newChess = new Chess();
    setMoveHistory([]);
    setChess(newChess);
    setFen(newChess.fen());
    setScore(0);
    setMistakes([]);
    setShowSummary(false);
    setFeedback('Your turn! Guess White\'s first move.');
    setIsAnimating(false);
    setCurrentMoveIndex(0);
    currentMoveIndexRef.current = 0;
    setArrow(null);
    setIsWaitingForGuess(true);
    setCorrectMoves(0);
    setWrongMoves(0);
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
          <h1 className="text-3xl sm:text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Guess the Move
          </h1>
          <p className="text-gray-600 text-lg">Test your chess knowledge with famous games</p>
        </div>

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

        {/* Main Game Area */}
      {moves.length > 0 && !showSummary && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Chess Board */}
            <div className="lg:col-span-3">
              <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl shadow-2xl border border-gray-200 p-6">
                <div className="flex flex-col items-center">
                  {/* Turn Indicator */}
                  <div className={`mb-6 px-6 py-3 rounded-xl font-bold text-lg shadow-lg transform transition-all duration-300 ${
                    chess?.turn() === 'w' 
                      ? 'bg-blue-500/20 text-blue-700 border border-blue-500/30' 
                      : 'bg-gray-500/20 text-gray-700 border border-gray-500/30'
                  }`}>
                    {isAnimating ? 'Playing move...' : (chess?.turn() === 'w' ? 'White to move' : 'Black to move')}
                  </div>
                  
                  {/* Board Container */}
                  <div className="relative w-full flex justify-center">
                    <div className="w-full max-w-full bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-4 shadow-inner border border-amber-200">
                      <div className="bg-gradient-to-br from-amber-100 to-orange-100 rounded-xl p-2 shadow-lg flex justify-center">
          <Chessboard
            position={fen}
            onPieceDrop={handleMove}
            onRightClickSquare={handleRightClickSquare}
            customSquareStyles={getCustomSquareStyles()}
                          boardWidth={Math.min(600, window.innerWidth - 100)}
                          arePiecesDraggable={!showSummary && !isAnimating}
                          customArrows={arrow ? [[arrow.from, arrow.to, arrow.color || '#e67e22']] : []}
                          animationDuration={2000}
                          customBoardStyle={{
                            borderRadius: '8px',
                            boxShadow: '0 8px 16px rgba(0, 0, 0, 0.2)',
                            touchAction: 'none',
                            userSelect: 'none',
                            WebkitUserSelect: 'none',
                            MozUserSelect: 'none',
                            msUserSelect: 'none'
                          }}
                        />
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
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl shadow-xl border border-purple-200 p-4">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-2"></div>
                    <p className="text-sm text-purple-700">Checking move...</p>
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
