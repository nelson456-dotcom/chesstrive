import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import { ArrowLeft } from 'lucide-react';

const PracticePage = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [game] = useState(new Chess());
  const [fen, setFen] = useState(game.fen());
  const [pgn, setPgn] = useState(game.pgn());
  const [message, setMessage] = useState('');
  const [currentMoveIndex, setCurrentMoveIndex] = useState(0);
  const [arrows, setArrows] = useState([]);
  const [openingData, setOpeningData] = useState(null);
  const [explanation, setExplanation] = useState('');
  const [selectedLineIdx, setSelectedLineIdx] = useState(0);
  const [highlightedSquares, setHighlightedSquares] = useState([]); // For right-click red highlight

  // Helper to get the current line
  const getCurrentLine = () => {
    if (!openingData || !openingData.lines || openingData.lines.length === 0) return null;
    return openingData.lines[selectedLineIdx] || openingData.lines[0];
  };

  useEffect(() => {
    // Fetch opening data based on courseId
    const fetchOpeningData = async () => {
      try {
        const response = await fetch(`http://localhost:3001/api/openings/${courseId}`);
        const data = await response.json();
        setOpeningData(data);
        setExplanation(data.description);
        setSelectedLineIdx(0);
        // Set up the initial position for the first line
        if (data.lines && data.lines.length > 0) {
          game.load(data.lines[0].fen);
          setFen(game.fen());
          setPgn(game.pgn());
          setCurrentMoveIndex(0);
          // Show arrow for the first user move
          const line = data.lines[0];
          if (line.moves && line.moves.length > 0) {
            const tempGame = new Chess(line.fen);
            // Find the first user move (odd index if user is black, even if white)
            const moveIdx = 0;
            const move = tempGame.move(line.moves[moveIdx], { sloppy: true });
            if (move) {
              setArrows([{ from: move.from, to: move.to, color: '#FFD700' }]);
            } else {
              setArrows([]);
            }
          } else {
            setArrows([]);
          }
        }
      } catch (error) {
        setMessage('Error loading opening data');
        console.error('Error:', error);
      }
    };
    fetchOpeningData();
    // eslint-disable-next-line
  }, [courseId, game]);

  // Helper to show the arrow for the next user move
  const showNextUserMoveArrow = (line, moveIdx, fen) => {
    if (!line || !line.moves || moveIdx >= line.moves.length) {
      setArrows([]);
      return;
    }
    const tempGame = new Chess(fen);
    // Play all moves up to moveIdx
    for (let i = 0; i < moveIdx; i++) {
      tempGame.move(line.moves[i], { sloppy: true });
    }
    const move = tempGame.move(line.moves[moveIdx], { sloppy: true });
    if (move) {
      setArrows([{ from: move.from, to: move.to, color: '#FFD700' }]);
    } else {
      setArrows([]);
    }
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

  const handleMove = (sourceSquare, targetSquare) => {
    const line = getCurrentLine();
    if (!line) return false;
    // Only allow the correct move
    const expectedMove = line.moves[currentMoveIndex];
    if (!expectedMove) return false;
    const tempGame = new Chess(fen);
    const moveObj = tempGame.move(expectedMove, { sloppy: true });
    if (!moveObj) return false;
    // Check if the user's attempted move matches the expected move
    if (moveObj.from !== sourceSquare || moveObj.to !== targetSquare) {
      setMessage("That's not the correct move for this opening.");
      setArrows([{ from: moveObj.from, to: moveObj.to, color: '#FFD700' }]);
      return false;
    }
    // User played the correct move
    const newGame = new Chess(fen);
    newGame.move({ from: sourceSquare, to: targetSquare, promotion: 'q' });
    let nextMoveIndex = currentMoveIndex + 1;
    // Auto-play opponent's move if there is one
    if (line.moves[nextMoveIndex]) {
      const opponentMove = newGame.move(line.moves[nextMoveIndex], { sloppy: true });
      if (opponentMove) {
        nextMoveIndex++;
      }
    }
    setFen(newGame.fen());
    setPgn(newGame.pgn());
    setCurrentMoveIndex(nextMoveIndex);
    setMessage('Correct move!');
    // Show arrow for the next user move
    if (line.moves[nextMoveIndex]) {
      const tempGame2 = new Chess(newGame.fen());
      const nextMoveObj = tempGame2.move(line.moves[nextMoveIndex], { sloppy: true });
      if (nextMoveObj) {
        setArrows([{ from: nextMoveObj.from, to: nextMoveObj.to, color: '#FFD700' }]);
      } else {
        setArrows([]);
      }
    } else {
      setArrows([]);
    }
    // Update explanation if available
    if (line.moveExplanations && line.moveExplanations[currentMoveIndex]) {
      setExplanation(line.moveExplanations[currentMoveIndex]);
    }
    return true;
  };

  const handleBack = () => {
    navigate(-1);
  };

  const handleReset = () => {
    const line = getCurrentLine();
    if (line) {
      game.load(line.fen);
      setFen(game.fen());
      setPgn(game.pgn());
      setCurrentMoveIndex(0);
      showNextUserMoveArrow(line, 0, line.fen);
      setMessage('Board reset.');
      setExplanation(openingData?.description || '');
    }
  };

  const handleUndo = () => {
    const line = getCurrentLine();
    game.undo();
    setFen(game.fen());
    setPgn(game.pgn());
    setCurrentMoveIndex(prev => Math.max(0, prev - 1));
    // Show arrow for the current user move
    if (line) {
      showNextUserMoveArrow(line, Math.max(0, currentMoveIndex - 1), game.fen());
    }
    setMessage('Last move undone.');
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <button
          onClick={handleBack}
          className="inline-flex items-center space-x-2 text-gray-400 hover:text-white mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <h1 className="text-4xl font-bold mb-6 text-center">Practice Session</h1>
            <p className="text-lg text-gray-300 mb-8 text-center">{message}</p>

            <div className="flex justify-center mb-8">
              <Chessboard
                position={fen}
                onPieceDrop={handleMove}
                onRightClickSquare={handleRightClickSquare}
                customSquareStyles={getCustomSquareStyles()}
                boardWidth={560}
                boardStyle={{
                  borderRadius: '8px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
                }}
                customArrows={arrows}
                animationDuration={300}
              />
            </div>

            <div className="flex justify-center space-x-4">
              <button
                onClick={handleReset}
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg transition-colors"
              >
                Reset Board
              </button>
              <button
                onClick={handleUndo}
                className="bg-yellow-600 hover:bg-yellow-700 text-white px-5 py-2 rounded-lg transition-colors"
              >
                Undo Last Move
              </button>
            </div>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-4">Opening Details</h2>
            {openingData && (
              <>
                <h3 className="text-xl font-semibold mb-2">{openingData.name}</h3>
                <p className="text-gray-300 mb-4">{explanation}</p>
                <div className="mt-4">
                  <h4 className="text-lg font-semibold mb-2">Progress</h4>
                  <div className="w-full bg-gray-700 rounded-full h-2.5">
                    <div
                      className="bg-blue-600 h-2.5 rounded-full"
                      style={{ width: `${(currentMoveIndex / openingData.moves.length) * 100}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-400 mt-2">
                    {currentMoveIndex} of {openingData.moves.length} moves completed
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PracticePage; 
