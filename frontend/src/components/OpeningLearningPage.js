import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import { ArrowLeft, ChevronLeft, ChevronRight, SkipBack, SkipForward } from 'lucide-react';

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

const OpeningLearningPage = () => {
  const { openingId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [openingData, setOpeningData] = useState(null);
  const [selectedLineIdx, setSelectedLineIdx] = useState(0);
  const [game, setGame] = useState(null);
  const [fen, setFen] = useState('');
  const [currentMoveIndex, setCurrentMoveIndex] = useState(0);
  const [arrows, setArrows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [orientation, setOrientation] = useState('white');
  const [moveFeedback, setMoveFeedback] = useState('');
  const [playerSide, setPlayerSide] = useState('white');
  const [highlightedSquares, setHighlightedSquares] = useState([]);
  const [openingLogged, setOpeningLogged] = useState(false);
  const [showExplanations, setShowExplanations] = useState(true);

  useEffect(() => {
    fetchOpeningData();
  }, [openingId]);

  useEffect(() => {
    if (openingData && openingData.lines && openingData.lines.length > 0) {
      // Check if a specific variation was requested in the URL
      const urlParams = new URLSearchParams(location.search);
      const requestedVariation = urlParams.get('variation');
      
      if (requestedVariation) {
        const variationIndex = openingData.lines.findIndex(line => line.name === requestedVariation);
        if (variationIndex !== -1) {
          setSelectedLineIdx(variationIndex);
        }
      } else {
        setSelectedLineIdx(0);
      }
    }
  }, [openingData, location.search]);

  useEffect(()=>{
    if(openingData && !openingLogged){
      try{
        const token=localStorage.getItem('token');
        if(token){
          fetch('http://localhost:3001/api/stats/opening',{
            method:'POST',
            headers:{'Content-Type':'application/json','x-auth-token':token},
            body:JSON.stringify({name:openingData.name,openingId:openingId,result:'practice'})
          }).then(res=>{})
          .catch(err=>console.error('opening log error',err));
          setOpeningLogged(true);
        }
      }catch(e){console.error(e);}
    }
  },[openingData,openingLogged,openingId]);

  const logPractice = () => {
    if (openingLogged) return;
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      fetch('http://localhost:3001/api/stats/opening', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
        body: JSON.stringify({ name: openingData?.name || 'Unknown Opening', openingId, result: 'practice' })
      })
        .then(res => {})
        .catch(err => console.error('Error logging opening practice', err));
      setOpeningLogged(true);
    } catch (e) {
      console.error(e);
    }
  };

  // Helper to set arrows for all moves in the line
  const setAllLineArrows = (line) => {
    const tempGame = new Chess(); // Start from initial position
    const arrowsArr = [];
    for (let i = 0; i < line.moves.length; i++) {
      try {
        const moveObj = tempGame.move(line.moves[i], { sloppy: true });
        if (moveObj) {
          arrowsArr.push([
            moveObj.from,
            moveObj.to,
            moveObj.color === 'w' ? '#00FF00' : '#00BFFF' // green for white, blue for black
          ]);
        }
      } catch (error) {
        console.error(`Error in setAllLineArrows at move ${i}:`, error);
        break;
      }
    }
    setArrows(arrowsArr);
  };

  // Helper to set the arrow for the next user move (use explicit playerSide argument)
  const setArrowForNextUserMove = (gameInstance, line, moveIdx, playerSideArg) => {
    const tempGame = new Chess(); // Start from initial position
    let idx = moveIdx;
    while (idx < line.moves.length) {
      // If it's user's turn, break
      if ((tempGame.turn() === 'w' && playerSideArg === 'white') || (tempGame.turn() === 'b' && playerSideArg === 'black')) {
        const nextMove = line.moves[idx];
        if (nextMove) {
          try {
            const moveObj = tempGame.move(nextMove, { sloppy: true });
            if (moveObj) {
              setArrows([[moveObj.from, moveObj.to, '#FFD700']]); // gold arrow for next user move
            } else {
              setArrows([]);
            }
          } catch (error) {
            console.error(`Error in setArrowForNextUserMove at move ${idx}:`, error);
            setArrows([]);
          }
        }
        return;
      }
      try {
        tempGame.move(line.moves[idx], { sloppy: true });
      } catch (error) {
        console.error(`Error in setArrowForNextUserMove at move ${idx}:`, error);
        setArrows([]);
        return;
      }
      idx++;
    }
    setArrows([]);
  };

  useEffect(() => {
    if (openingData && openingData.lines && openingData.lines[selectedLineIdx]) {
      const line = openingData.lines[selectedLineIdx];
      const newGame = new Chess(); // Start from initial position
      setGame(newGame);
      setFen(newGame.fen());
      setCurrentMoveIndex(0);
      // Set orientation and player side based on first move color
      let orientation = 'white';
      let side = 'white';
      if (line.moves && line.moves.length > 0) {
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
      setTimeout(() => setArrowForNextUserMove(newGame, line, 0, side), 0);
    }
  }, [selectedLineIdx, openingData]);

  const fetchOpeningData = async () => {
    try {
      const response = await fetch(`http://localhost:3001/api/openings/${openingId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch opening data');
      }
      const data = await response.json();
      setOpeningData(data);
      logPractice();
    } catch (err) {
      setError('Error loading opening data');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLineChange = (e) => {
    setSelectedLineIdx(Number(e.target.value));
  };

  // Helper function for custom square styles
  const getCustomSquareStyles = () => {
    const styles = {};
    highlightedSquares.forEach((sq) => {
      styles[sq] = { backgroundColor: 'rgba(255, 0, 0, 0.4)' };
    });
    return styles;
  };

  // Updated for react-chessboard: expects sourceSq, targetSq
  const handleMove = (sourceSq, targetSq) => {
    if (!openingData || !game || !openingData.lines[selectedLineIdx]) return false;
    const line = openingData.lines[selectedLineIdx];
    const playerSideArg = playerSide;
    
    // Only allow move if it's the player's side
    if ((game.turn() === 'w' && playerSideArg !== 'white') || (game.turn() === 'b' && playerSideArg !== 'black')) {
      setMoveFeedback('You can only play the ' + (playerSideArg === 'white' ? 'White' : 'Black') + ' moves in this opening.');
      return false;
    }
    
    // after move is made and before correctness check
    const newGame = new Chess(game.fen());
    const move = newGame.move({ from: sourceSq, to: targetSq, promotion: 'q' });
    if (!move) {
      setMoveFeedback('Illegal move.');
      return;
    }
    
    // Log opening practice on first legal user move
    if (!openingLogged) {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          fetch('http://localhost:3001/api/stats/opening', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-auth-token': token
            },
            body: JSON.stringify({ name: openingData?.name || 'Unknown Opening', openingId: openingId, result: 'practice' })
          })
            .then(res=>{})
            .catch(err=>console.error('Error logging opening practice',err));
        }
      } catch(e){console.error(e);} 
      setOpeningLogged(true);
    }
    
    // Check if this is the correct move in the sequence
    const expectedMove = line.moves[currentMoveIndex];
    if (move.san === expectedMove) {
      // After applying moves and arrows
      if (currentMoveIndex >= line.moves.length) {
        // User completed the line
        try {
          const token = localStorage.getItem('token');
          if (token) {
            fetch('http://localhost:3001/api/stats/opening', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-auth-token': token
              },
              body: JSON.stringify({
                name: openingData?.name || 'Unknown Opening',
                result: 'practice'
              })
            }).catch(err => console.error('Error updating opening stats', err));
          }
        } catch (err) {
          console.error('Error sending opening completion:', err);
        }
      }
      setGame(newGame);
      setCurrentMoveIndex(prev => prev + 1);
      setMoveFeedback('Correct!');
      // Auto-play opponent's move if there is one
      let nextMoveIndex = currentMoveIndex + 1;
      let afterOpponentGame = new Chess(newGame.fen());
      if (nextMoveIndex < line.moves.length) {
        const opponentMove = afterOpponentGame.move(line.moves[nextMoveIndex], { sloppy: true });
        if (opponentMove) {
          setGame(afterOpponentGame);
          nextMoveIndex++;
          setCurrentMoveIndex(nextMoveIndex);
        }
      } else {
        afterOpponentGame = newGame;
      }
      // Show arrow for the next user move
      setTimeout(() => {
        setArrowForNextUserMove(afterOpponentGame, line, nextMoveIndex, playerSideArg);
      }, 300);
    } else {
      setMoveFeedback('Incorrect move. Try again!');
    }
  };

  const handlePreviousMove = () => {
    if (currentMoveIndex <= 0 || !openingData || !openingData.lines[selectedLineIdx]) return;
    const line = openingData.lines[selectedLineIdx];
    const newGame = new Chess(line.fen);
    // Replay moves up to the previous one
    for (let i = 0; i < currentMoveIndex - 1; i++) {
      newGame.move(line.moves[i]);
    }
    setGame(newGame);
    setFen(newGame.fen());
    setCurrentMoveIndex(prev => prev - 1);
    // Add arrow for the current move
    if (currentMoveIndex - 1 < line.moves.length) {
      const move = newGame.move(line.moves[currentMoveIndex - 1]);
      if (move) {
        setArrows([{
          from: move.from,
          to: move.to,
          color: '#00ff00'
        }]);
        newGame.undo();
      }
    }
  };

  const handleRightClickSquare = (square) => {
    setHighlightedSquares((prev) =>
      prev.includes(square)
        ? prev.filter((s) => s !== square)
        : [...prev, square]
    );
  };

  const resetPosition = () => {
    if (!openingData || !openingData.lines[selectedLineIdx]) return;
    const line = openingData.lines[selectedLineIdx];
    const newGame = new Chess(line.fen);
    setGame(newGame);
    setFen(line.fen);
    setCurrentMoveIndex(0);
    setOrientation(getOrientationFromFEN(line.fen, line.moves));
    setPlayerSide(playerSide);
    setTimeout(() => setArrowForNextUserMove(newGame, line, 0, playerSide), 0);
  };

  // Navigation functions
  const goToPreviousMove = useCallback(() => {
    if (!game || currentMoveIndex <= 0) return;
    
    const newIndex = currentMoveIndex - 1;
    const tempGame = new Chess(); // Start from initial position
    const currentLine = openingData.lines[selectedLineIdx];
    
    // Play moves up to the previous move
    for (let i = 0; i < newIndex; i++) {
      try {
        tempGame.move(currentLine.moves[i], { sloppy: true });
      } catch (error) {
        console.error(`Error in goToPreviousMove at move ${i}:`, error);
        return;
      }
    }
    
    setGame(tempGame);
    setFen(tempGame.fen());
    setCurrentMoveIndex(newIndex);
  }, [game, currentMoveIndex, openingData, selectedLineIdx]);

  const goToNextMove = useCallback(() => {
    if (!game || !openingData) return;
    const currentLine = openingData.lines[selectedLineIdx];
    if (currentMoveIndex >= currentLine.moves.length) return;
    
    const newIndex = currentMoveIndex + 1;
    const tempGame = new Chess(); // Start from initial position
    
    // Play moves up to the next move
    for (let i = 0; i < newIndex; i++) {
      try {
        tempGame.move(currentLine.moves[i], { sloppy: true });
      } catch (error) {
        console.error(`Error in goToNextMove at move ${i}:`, error);
        return;
      }
    }
    
    setGame(tempGame);
    setFen(tempGame.fen());
    setCurrentMoveIndex(newIndex);
  }, [game, currentMoveIndex, openingData, selectedLineIdx]);

  const goToStart = useCallback(() => {
    if (!openingData) return;
    const tempGame = new Chess(); // Start from initial position
    setGame(tempGame);
    setFen(tempGame.fen());
    setCurrentMoveIndex(0);
  }, [openingData]);

  const goToEnd = useCallback(() => {
    if (!openingData) return;
    const currentLine = openingData.lines[selectedLineIdx];
    const tempGame = new Chess(); // Start from initial position
    
    // Play all moves
    for (const move of currentLine.moves) {
      try {
        tempGame.move(move, { sloppy: true });
      } catch (error) {
        console.error(`Error in goToEnd at move ${move}:`, error);
        return;
      }
    }
    
    setGame(tempGame);
    setFen(tempGame.fen());
    setCurrentMoveIndex(currentLine.moves.length);
  }, [openingData, selectedLineIdx]);

  const goToMove = useCallback((moveIndex) => {
    if (!openingData) return;
    const currentLine = openingData.lines[selectedLineIdx];
    if (moveIndex < 0 || moveIndex > currentLine.moves.length) return;
    
    const tempGame = new Chess(); // Start from initial position
    
    // Play moves up to the specified move
    for (let i = 0; i < moveIndex; i++) {
      try {
        tempGame.move(currentLine.moves[i], { sloppy: true });
      } catch (error) {
        console.error(`Error in goToMove at move ${i}:`, error);
        return;
      }
    }
    
    setGame(tempGame);
    setFen(tempGame.fen());
    setCurrentMoveIndex(moveIndex);
  }, [openingData, selectedLineIdx]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-lg">Loading opening...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 text-lg">{error}</p>
          <button 
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            onClick={() => navigate('/openings')}
          >
            Back to Openings
          </button>
        </div>
      </div>
    );
  }

  const line = openingData && openingData.lines ? openingData.lines[selectedLineIdx] : null;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <button
          onClick={() => navigate('/openings')}
          className="inline-flex items-center space-x-2 text-gray-400 hover:text-white mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Openings</span>
        </button>

        {error && (
          <div className="bg-red-600 text-white p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {openingData && (
          <>
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2">{openingData.name}</h1>
              <p className="text-gray-400 mb-4">{openingData.description}</p>
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <span>Difficulty: {openingData.difficulty}</span>
                <span>Category: {openingData.category}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column - Board and Navigation */}
              <div className="lg:col-span-2">
                {/* Chess Board */}
                <div className="bg-gray-800 rounded-lg p-6 mb-6">
                  <div className="flex justify-center mb-4">
                    <div className="w-full max-w-2xl">
                       <Chessboard
                         position={fen}
                         onPieceDrop={handleMove}
                         customArrows={arrows.map(arrow => [arrow.from, arrow.to, arrow.color])}
                         customSquareStyles={getCustomSquareStyles()}
                         boardWidth={600}
                         boardOrientation={orientation}
                       />
                    </div>
                  </div>

                  {/* Navigation Controls */}
                  <div className="flex justify-center items-center space-x-4 mb-4">
                    <button
                      onClick={goToStart}
                      disabled={currentMoveIndex <= 0}
                      className="p-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-600 rounded-lg transition-colors duration-200"
                      title="Go to start"
                    >
                      <SkipBack className="w-5 h-5" />
                    </button>
                    <button
                      onClick={goToPreviousMove}
                      disabled={currentMoveIndex <= 0}
                      className="p-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-600 rounded-lg transition-colors duration-200"
                      title="Previous move"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <span className="text-sm text-gray-400 min-w-[80px] text-center">
                      {currentMoveIndex === 0 ? 'Initial position' : `Move ${currentMoveIndex}`}
                    </span>
                    <button
                      onClick={goToNextMove}
                      disabled={!openingData || currentMoveIndex >= openingData.lines[selectedLineIdx].moves.length}
                      className="p-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-600 rounded-lg transition-colors duration-200"
                      title="Next move"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                    <button
                      onClick={goToEnd}
                      disabled={!openingData || currentMoveIndex >= openingData.lines[selectedLineIdx].moves.length}
                      className="p-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-600 rounded-lg transition-colors duration-200"
                      title="Go to end"
                    >
                      <SkipForward className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Move Feedback */}
                  {moveFeedback && (
                    <div className="text-center p-3 bg-blue-600 rounded-lg">
                      {moveFeedback}
                    </div>
                  )}
                </div>

                {/* Variations */}
                {openingData.lines.length > 1 && (
                  <div className="bg-gray-800 rounded-lg p-6">
                    <h3 className="text-xl font-semibold mb-4">Variations</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {openingData.lines.map((line, index) => (
                        <button
                          key={index}
                          onClick={() => setSelectedLineIdx(index)}
                          className={`p-4 rounded-lg text-left transition-colors duration-200 ${
                            selectedLineIdx === index
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                          }`}
                        >
                          <h4 className="font-semibold mb-1">{line.name}</h4>
                          <p className="text-sm opacity-75">{line.moves.length} moves</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column - Moves and Explanations */}
              <div className="lg:col-span-1">
                <div className="bg-gray-800 rounded-lg p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold">Moves</h3>
                    <button
                      onClick={() => setShowExplanations(!showExplanations)}
                      className="text-sm text-blue-400 hover:text-blue-300"
                    >
                      {showExplanations ? 'Hide' : 'Show'} Explanations
                    </button>
                  </div>
                  
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {openingData.lines[selectedLineIdx].moves.map((move, index) => (
                      <div
                        key={index}
                        onClick={() => goToMove(index + 1)}
                        className={`p-3 rounded-lg cursor-pointer transition-colors duration-200 ${
                          currentMoveIndex === index + 1
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-mono">{index + 1}. {move}</span>
                          {currentMoveIndex === index + 1 && (
                            <span className="text-xs">Current</span>
                          )}
                        </div>
                        {showExplanations && openingData.lines[selectedLineIdx].moveExplanations[index] && (
                          <p className="text-sm mt-2 opacity-75">
                            {openingData.lines[selectedLineIdx].moveExplanations[index]}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default OpeningLearningPage; 
