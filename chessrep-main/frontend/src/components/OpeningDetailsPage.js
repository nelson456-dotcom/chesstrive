import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import { ArrowLeft } from 'lucide-react';

const getOrientationFromFEN = (fen, moves) => {
  if (!fen) return 'white';
  // If the first move in the line is a black move, orient to black
  if (moves && moves.length > 0) {
    const tempGame = new Chess(fen);
    const firstMove = tempGame.move(moves[0], { sloppy: true });
    if (firstMove && firstMove.color === 'b') return 'black';
  }
  const parts = fen.split(' ');
  return parts[1] === 'b' ? 'black' : 'white';
};

const OpeningDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [opening, setOpening] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedLineIdx, setSelectedLineIdx] = useState(0);
  const [game, setGame] = useState(null);
  const [fen, setFen] = useState('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
  const [currentMoveIndex, setCurrentMoveIndex] = useState(0);
  const [showExplanations, setShowExplanations] = useState(true);
  const [arrows, setArrows] = useState([]);
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [orientation, setOrientation] = useState('white');
  const [moveFeedback, setMoveFeedback] = useState('');
  const [playerSide, setPlayerSide] = useState('white');
  const [highlightedSquares, setHighlightedSquares] = useState([]); // For right-click red highlight

  const fetchOpening = async () => {
    try {
      const response = await fetch(`http://localhost:3001/api/openings/${id}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch opening');
      }
      const data = await response.json();
      setOpening(data);
    } catch (err) {
      setError('Error loading opening data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOpening();
  }, [id]);

  useEffect(() => {
    if (opening && opening.lines && opening.lines.length > 0) {
      // Check if there's a variation parameter in the URL
      const urlParams = new URLSearchParams(location.search);
      const variationParam = urlParams.get('variation');
      
      if (variationParam) {
        // Find the line that matches the variation name
        const matchingLineIndex = opening.lines.findIndex(line => 
          line.name && line.name.includes(variationParam)
        );
        if (matchingLineIndex !== -1) {
          setSelectedLineIdx(matchingLineIndex);
        } else {
          // If no match found, default to first line
          setSelectedLineIdx(0);
        }
      } else {
        // Reset to first line if lines change and no variation specified
        setSelectedLineIdx(0);
      }
    }
  }, [opening, location.search]);

  // Helper to get moves for the user's side only
  const getUserMoves = (line) => {
    if (!line || !line.moves) return [];
    const userSide = line.orientation || 'white';
    const userMoves = [];
    
    // Start from the initial position, not the line's FEN
    const tempGame = new Chess();
    
    for (let i = 0; i < line.moves.length; i++) {
      try {
        const moveObj = tempGame.move(line.moves[i], { sloppy: true });
        if (moveObj && moveObj.color === (userSide === 'black' ? 'b' : 'w')) {
          userMoves.push({
            move: line.moves[i],
            explanation: line.moveExplanations[i] || '',
            index: i
          });
        }
      } catch (error) {
        console.error(`Error playing move ${line.moves[i]} at index ${i}:`, error);
        break;
      }
    }
    
    return userMoves;
  };

  // Helper to set the teaching arrow for the next user move
  const setTeachingArrow = (line, moveIdx) => {
    if (!line || !line.moves || line.moves.length === 0 || moveIdx >= line.moves.length) {
      setArrows([]);
      return;
    }
    
    const userSide = line.orientation || 'white';
    const userMoves = getUserMoves(line);
    
    // Find the current user move index
    let userMoveIndex = 0;
    let tempGame = new Chess(); // Start from initial position
    
    for (let i = 0; i < moveIdx; i++) {
      try {
        const moveObj = tempGame.move(line.moves[i], { sloppy: true });
        if (moveObj && moveObj.color === (userSide === 'black' ? 'b' : 'w')) {
          userMoveIndex++;
        }
      } catch (error) {
        console.error(`Error in setTeachingArrow at move ${i}:`, error);
        break;
      }
    }
    
    // If we've completed all user moves, no arrow needed
    if (userMoveIndex >= userMoves.length) {
      setArrows([]);
      return;
    }
    
    // Set arrow for the next user move
    const nextUserMove = userMoves[userMoveIndex];
    if (nextUserMove) {
      // Replay moves up to the user's move
      tempGame = new Chess(); // Start from initial position
      for (let i = 0; i < nextUserMove.index; i++) {
        try {
          tempGame.move(line.moves[i], { sloppy: true });
        } catch (error) {
          console.error(`Error replaying move ${i}:`, error);
          setArrows([]);
          return;
        }
      }
      try {
        const moveObj = tempGame.move(nextUserMove.move, { sloppy: true });
        if (moveObj) {
          const arrow = [moveObj.from, moveObj.to, '#FFD700'];
          setArrows([arrow]);
        } else {
          setArrows([]);
        }
      } catch (error) {
        console.error(`Error setting arrow for move ${nextUserMove.move}:`, error);
        setArrows([]);
      }
    } else {
      setArrows([]);
    }
  };

  // Set teaching arrow on initial load and whenever the move index changes
  useEffect(() => {
    if (
      opening &&
      opening.lines &&
      opening.lines[selectedLineIdx] &&
      game
    ) {
      const line = opening.lines[selectedLineIdx];
      setTeachingArrow(line, currentMoveIndex);
    }
  }, [opening, selectedLineIdx, currentMoveIndex, game]);

  useEffect(() => {
    if (opening && opening.lines && opening.lines[selectedLineIdx]) {
      const line = opening.lines[selectedLineIdx];
      const newGame = new Chess(); // Start from initial position
      setGame(newGame);
      setFen(newGame.fen());
      setCurrentMoveIndex(0);
      
      // Set orientation and player side based on line.orientation or first move color
      let orientation = 'white';
      let side = 'white';
      if (line.orientation) {
        orientation = line.orientation;
        side = line.orientation;
      } else if (line.moves && line.moves.length > 0) {
        const tempGame = new Chess(); // Start from initial position
        try {
          const firstMove = tempGame.move(line.moves[0], { sloppy: true });
          if (firstMove && firstMove.color === 'b') {
            orientation = 'black';
            side = 'black';
          }
        } catch (error) {
          console.error('Error determining orientation from first move:', error);
        }
      }
      setOrientation(orientation);
      setPlayerSide(side);
      
             // For Black openings, auto-play White's first move
       if (line.orientation === 'black' && line.moves && line.moves.length > 0) {
         try {
           const firstMove = newGame.move(line.moves[0], { sloppy: true });
           if (firstMove && firstMove.color === 'w') {
             // White moves first, so auto-play it
             setGame(newGame);
             setFen(newGame.fen());
             setCurrentMoveIndex(1);
           }
         } catch (error) {
           console.error('Error auto-playing first move:', error);
         }
       }
      
      // Set the teaching arrow for the next move
      setTeachingArrow(line, line.orientation === 'black' ? 1 : 0);
    }
  }, [selectedLineIdx, opening]);

  // Helper function for custom square styles
  const getCustomSquareStyles = () => {
    const styles = {};
    highlightedSquares.forEach((sq) => {
      styles[sq] = { backgroundColor: 'rgba(255, 0, 0, 0.4)' };
    });
    return styles;
  };

  // Strict teaching move handler - only for user's side
  const handleMove = (sourceSq, targetSq) => {
    const from = sourceSq;
    const to = targetSq;
    if (!opening || !game || !opening.lines[selectedLineIdx]) return false;
    const line = opening.lines[selectedLineIdx];
    if (!line.moves || line.moves.length === 0) {
      setMoveFeedback('No moves available for this opening.');
      return false;
    }
    
    const userSide = line.orientation || 'white';
    const userMoves = getUserMoves(line);
    
    // Find the current user move index
    let userMoveIndex = 0;
    let tempGame = new Chess(); // Start from initial position
    
    for (let i = 0; i < currentMoveIndex; i++) {
      try {
        const moveObj = tempGame.move(line.moves[i], { sloppy: true });
        if (moveObj && moveObj.color === (userSide === 'black' ? 'b' : 'w')) {
          userMoveIndex++;
        }
      } catch (error) {
        console.error(`Error in handleMove at move ${i}:`, error);
        return false;
      }
    }
    
    // Check if it's the user's turn
    if (userMoveIndex >= userMoves.length) {
      setMoveFeedback('Opening completed!');
      return false;
    }
    
    const expectedUserMove = userMoves[userMoveIndex];
    if (!expectedUserMove) return false;
    
    // Check if the move is correct
    tempGame = new Chess(); // Start from initial position
    for (let i = 0; i < expectedUserMove.index; i++) {
      try {
        tempGame.move(line.moves[i], { sloppy: true });
      } catch (error) {
        console.error(`Error replaying move ${i} in handleMove:`, error);
        return false;
      }
    }
    
    try {
      const moveObj = tempGame.move(expectedUserMove.move, { sloppy: true });
      if (!moveObj) return false;
      
      // Only allow the correct move
      if (moveObj.from !== from || moveObj.to !== to) {
        setMoveFeedback("That's not the correct move for this opening.");
        setTeachingArrow(line, currentMoveIndex);
        return false;
      }
      
      // User played the correct move - execute the full sequence
      const newGame = new Chess(); // Start from initial position
      let nextMoveIndex = 0;
      
      // Play all moves up to and including the user's move
      for (let i = 0; i <= expectedUserMove.index; i++) {
        try {
          newGame.move(line.moves[i], { sloppy: true });
          nextMoveIndex = i + 1;
        } catch (error) {
          console.error(`Error executing move ${i}:`, error);
          return false;
        }
      }
      
      // Auto-play the next opponent move if there is one
      if (line.moves[nextMoveIndex]) {
        try {
          newGame.move(line.moves[nextMoveIndex], { sloppy: true });
          nextMoveIndex++;
        } catch (error) {
          console.error(`Error auto-playing opponent move:`, error);
        }
      }
      
      setGame(newGame);
      setCurrentMoveIndex(nextMoveIndex);
      setMoveFeedback('Correct! ' + (expectedUserMove.explanation || ''));
      
      // Set arrow for next move
      setTimeout(() => setTeachingArrow(line, nextMoveIndex), 100);
      
      return true;
    } catch (error) {
      console.error('Error in move validation:', error);
      return false;
    }
  };

  const handleRightClickSquare = (square) => {
    setHighlightedSquares((prev) =>
      prev.includes(square)
        ? prev.filter((s) => s !== square)
        : [...prev, square]
    );
  };

  // Handle line selection change
  const handleLineChange = (e) => {
    setSelectedLineIdx(parseInt(e.target.value));
  };

     // Also update teaching arrow on reset
   const resetPosition = () => {
     if (!opening || !opening.lines[selectedLineIdx]) return;
     const line = opening.lines[selectedLineIdx];
     const newGame = new Chess(); // Start from initial position
     setGame(newGame);
     setCurrentMoveIndex(0);
     
     // Use the line's orientation
     if (line.orientation) {
       setOrientation(line.orientation);
       setPlayerSide(line.orientation);
     }
     
     // For Black openings, auto-play White's first move
     if (line.orientation === 'black' && line.moves && line.moves.length > 0) {
       try {
         const firstMove = newGame.move(line.moves[0], { sloppy: true });
         if (firstMove && firstMove.color === 'w') {
           // White moves first, so auto-play it
           setGame(newGame);
           setCurrentMoveIndex(1);
         }
       } catch (error) {
         console.error('Error auto-playing first move on reset:', error);
       }
     }
     
     setIsPlayerTurn(newGame.turn() === 'w');
     setTeachingArrow(line, line.orientation === 'black' ? 1 : 0);
   };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center space-x-2 text-gray-400 hover:text-white mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>
          <div className="text-center">Loading opening...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center space-x-2 text-gray-400 hover:text-white mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>
          <div className="text-red-500">{error}</div>
        </div>
      </div>
    );
  }

  const line = opening && opening.lines ? opening.lines[selectedLineIdx] : null;
  const userMoves = line ? getUserMoves(line) : [];
  
  // Find the current user move explanation
  let currentExplanation = 'Select a move to see its explanation.';
  if (line && userMoves.length > 0) {
    const userSide = line.orientation || 'white';
    let userMoveIndex = 0;
    let tempGame = new Chess(line.fen);
    
    for (let i = 0; i < currentMoveIndex; i++) {
      const moveObj = tempGame.move(line.moves[i], { sloppy: true });
      if (moveObj && moveObj.color === (userSide === 'black' ? 'b' : 'w')) {
        userMoveIndex++;
      }
    }
    
    if (userMoveIndex > 0 && userMoveIndex <= userMoves.length) {
      currentExplanation = userMoves[userMoveIndex - 1].explanation;
    } else if (userMoveIndex === 0) {
      if (line.orientation === 'black') {
        currentExplanation = 'White has played e4. Now it\'s your turn to respond with Black!';
      } else {
        currentExplanation = 'Make your first move!';
      }
    } else {
      currentExplanation = 'Opening completed!';
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center space-x-2 text-gray-400 hover:text-white mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back</span>
        </button>

        <h1 className="text-3xl font-bold mb-4">{opening.name}</h1>
        <p className="text-gray-300 mb-6">{opening.description}</p>
        {line && line.orientation && (
          <div className="mb-4">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              line.orientation === 'black' 
                ? 'bg-black text-white' 
                : 'bg-white text-black'
            }`}>
              {line.orientation === 'black' ? '⚫ Playing as Black' : '⚪ Playing as White'}
            </span>
          </div>
        )}

        {opening.lines && opening.lines.length > 1 && (
          <div className="mb-6">
            <label className="block mb-2 text-lg font-semibold">Select Line/Variation:</label>
            <select
              value={selectedLineIdx}
              onChange={handleLineChange}
              className="px-3 py-2 rounded bg-gray-800 text-white border border-gray-600"
            >
              {opening.lines.map((l, idx) => (
                <option key={idx} value={idx}>{l.name}</option>
              ))}
            </select>
          </div>
        )}
        {line && (
          <div className="mb-4 text-lg font-semibold">Line: {line.name}</div>
        )}

        <div className="flex flex-row items-start">
          <div className="w-[600px]">
            <div className="aspect-square w-full mx-auto">
              <Chessboard
                position={game?.fen()}
                onPieceDrop={handleMove}
                customArrows={arrows}
                customSquareStyles={getCustomSquareStyles()}
                boardWidth={600}
                boardOrientation={orientation}
              />
            </div>
            <div className="text-xs text-red-400">{window._arrow_debug && window._arrow_debug.warning ? `Arrow debug: ${window._arrow_debug.warning} (move: ${window._arrow_debug.san})` : ''}</div>
            {moveFeedback && (
              <div className="mt-2 text-center text-lg text-yellow-400">{moveFeedback}</div>
            )}
            <div className="mt-4 flex justify-center space-x-4">
              <button
                onClick={resetPosition}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Reset Position
              </button>
              <button
                onClick={() => setShowExplanations(!showExplanations)}
                className="bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                {showExplanations ? 'Hide Explanation' : 'Show Explanation'}
              </button>
            </div>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg ml-32 min-w-[350px]">
            <h2 className="text-xl font-semibold mb-4">Your Moves</h2>
            {userMoves.length > 0 && (
              <div className="mb-4">
                <div className="text-sm text-gray-400 mb-2">
                  {line.orientation === 'black' ? '⚫ Black moves:' : '⚪ White moves:'}
                </div>
                                 <div className="space-y-1">
                   {userMoves.map((userMove, index) => {
                     const userSide = line.orientation || 'white';
                     let userMoveIndex = 0;
                     let tempGame = new Chess(line.fen);
                     
                     for (let i = 0; i < currentMoveIndex; i++) {
                       const moveObj = tempGame.move(line.moves[i], { sloppy: true });
                       if (moveObj && moveObj.color === (userSide === 'black' ? 'b' : 'w')) {
                         userMoveIndex++;
                       }
                     }
                     
                     const isCompleted = index < userMoveIndex;
                     const isCurrent = index === userMoveIndex;
                     
                     return (
                       <div 
                         key={index}
                         className={`p-2 rounded text-sm ${
                           isCompleted 
                             ? 'bg-green-900 text-green-200' 
                             : isCurrent 
                               ? 'bg-yellow-900 text-yellow-200 border border-yellow-500'
                               : 'bg-gray-700 text-gray-400'
                         }`}
                       >
                         <span className="font-mono">{userMove.move}</span>
                         {isCurrent && <span className="ml-2 text-xs">← Your turn</span>}
                       </div>
                     );
                   })}
                 </div>
                 
                 {/* Show White's first move for Black openings */}
                 {line.orientation === 'black' && line.moves && line.moves.length > 0 && (
                   <div className="mt-4">
                     <div className="text-sm text-gray-400 mb-2">⚪ White's first move:</div>
                     <div className="p-2 rounded text-sm bg-blue-900 text-blue-200">
                       <span className="font-mono">{line.moves[0]}</span>
                       <span className="ml-2 text-xs">← Auto-played</span>
                     </div>
                   </div>
                 )}
              </div>
            )}
            
            {showExplanations && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Explanation</h3>
                <p className="text-gray-300">
                  {currentExplanation}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OpeningDetailsPage; 
