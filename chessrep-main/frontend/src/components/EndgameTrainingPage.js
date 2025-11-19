import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import { useAuth } from '../contexts/AuthContext';
import { Clock, Zap, Trophy, Target, Play, Pause, RotateCcw, BarChart3, Award, Home, ArrowLeft, CheckCircle, XCircle } from 'lucide-react';

const API_BASE = 'http://localhost:3001/api/puzzles';

const EndgameTrainingPage = () => {
  const { user, refreshUser } = useAuth();
  const [currentPuzzle, setCurrentPuzzle] = useState(null);
  const [game, setGame] = useState(null);
  const [fen, setFen] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [showSolution, setShowSolution] = useState(false);
  const [solution, setSolution] = useState([]);
  const [score, setScore] = useState(0);
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [userRating, setUserRating] = useState(null);
  const [ratingChange, setRatingChange] = useState(null);
  const [showRatingChange, setShowRatingChange] = useState(false);
  const [puzzleComplete, setPuzzleComplete] = useState(false);
  const [puzzleState, setPuzzleState] = useState('active');
  const [drawnArrows, setDrawnArrows] = useState([]);
  const [highlightedSquares, setHighlightedSquares] = useState([]);
  const [boardSize] = useState(800);
  const [orientation, setOrientation] = useState('white');
  const [currentMoveIndex, setCurrentMoveIndex] = useState(0);
  const [puzzleSolved, setPuzzleSolved] = useState(false);
  const [puzzle, setPuzzle] = useState(null);
  const [moveIndex, setMoveIndex] = useState(0);
  const [showMenu, setShowMenu] = useState(true);
  const [endgameThemes, setEndgameThemes] = useState([]);
  const [selectedTheme, setSelectedTheme] = useState(null);
  const [puzzleCount, setPuzzleCount] = useState(0);
  const [currentPuzzleIndex, setCurrentPuzzleIndex] = useState(0);
  const [puzzleCache, setPuzzleCache] = useState([]);
  const [isPreloading, setIsPreloading] = useState(false);
  
  const moveSoundRef = useRef(null);
  const captureSoundRef = useRef(null);
  const castleSoundRef = useRef(null);
  const boardRef = useRef(null);

  // Endgame themes with descriptions
  const endgameThemeOptions = [
    { id: 'pawn', name: 'Pawn Endgames', description: 'King and pawn endgames', icon: '♟️' },
    { id: 'rook', name: 'Rook Endgames', description: 'Rook and pawn endgames', icon: '♜' },
    { id: 'queen', name: 'Queen Endgames', description: 'Queen endgames', icon: '♛' },
    { id: 'knight', name: 'Knight Endgames', description: 'Knight endgames', icon: '♞' },
    { id: 'bishop', name: 'Bishop Endgames', description: 'Bishop endgames', icon: '♝' },
    { id: 'mixed', name: 'Mixed Endgames', description: 'Various endgame types', icon: '🎯' },
    { id: 'basic', name: 'Basic Endgames', description: 'Fundamental endgame positions', icon: '📚' }
  ];

  useEffect(() => {
    // Create audio elements with error handling
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

  useEffect(() => {
    fetchUserRating();
  }, []);

  useEffect(() => {
    if (user && user.rating) {
      setUserRating(user.rating);
    }
  }, [user]);

  const fetchUserRating = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token && user) {
        setUserRating(user.rating || 1200);
      }
    } catch (error) {
      console.error('Error fetching user rating:', error);
    }
  };

  const loadEndgamePuzzles = async (theme) => {
    setLoading(true);
    setSelectedTheme(theme);
    
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { 'x-auth-token': token } : {};
      
      // Fetch endgame puzzles filtered by theme
      const response = await fetch(`${API_BASE}/endgame?theme=${theme}&limit=2000`, {
        headers,
        timeout: 15000
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Loaded endgame puzzles:', data);
        
        if (data?.puzzles && data.puzzles.length > 0) {
          setPuzzleCache(data.puzzles);
          setPuzzleCount(data.puzzles.length);
          setCurrentPuzzleIndex(0);
          setShowMenu(false);
          loadPuzzleFromCache(0);
        } else {
          throw new Error('No endgame puzzles available');
        }
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.error('Error loading endgame puzzles:', error);
      setFeedback('Failed to load endgame puzzles. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadPuzzleFromCache = (index) => {
    if (index >= puzzleCache.length) {
      setFeedback('No more puzzles available!');
      return;
    }
    
    const puzzleData = puzzleCache[index];
    initializePuzzle({ puzzle: puzzleData });
    setCurrentPuzzleIndex(index);
  };

  const loadNextPuzzle = () => {
    if (currentPuzzleIndex < puzzleCache.length - 1) {
      loadPuzzleFromCache(currentPuzzleIndex + 1);
    } else {
      setFeedback('Congratulations! You completed all puzzles!');
      setShowMenu(true);
    }
  };

  const initializePuzzle = useCallback((puzzleData) => {
    console.log('🔧 Initializing endgame puzzle:', puzzleData);
    
    if (!puzzleData?.puzzle) {
      console.error('Invalid puzzle data:', puzzleData);
      setFeedback('No puzzle data available.');
      setLoading(false);
      return;
    }

    try {
      const newGame = new Chess(puzzleData.puzzle.fen);
      console.log('✅ Created Chess game with FEN:', puzzleData.puzzle.fen);
      let userMoveIndex = 0;

      // Try to play the first move as the opponent's move if it exists
      const firstMove = puzzleData.puzzle.moves[0];
      if (firstMove && puzzleData.puzzle.moves.length > 1) {
        try {
          // Try both UCI and SAN formats
          let firstMoveResult = null;
          if (firstMove.length === 4 && /^[a-h][1-8][a-h][1-8]$/.test(firstMove)) {
            // UCI format
            firstMoveResult = newGame.move({ 
              from: firstMove.substring(0, 2), 
              to: firstMove.substring(2, 4), 
              promotion: 'q' 
            });
          } else {
            // SAN format
            firstMoveResult = newGame.move(firstMove, { sloppy: true });
          }
          
          if (firstMoveResult) {
            userMoveIndex = 1;
            console.log('✅ Played opponent move:', firstMove);
            
            // Show arrow for the opponent's move that was just played
            const arrow = { from: firstMoveResult.from, to: firstMoveResult.to, color: '#3b82f6' };
            setDrawnArrows([arrow]);
          } else {
            console.log('⚠️ Could not play first move, user starts:', firstMove);
            setDrawnArrows([]);
          }
        } catch (error) {
          console.log('⚠️ First move failed, user is to move:', error.message);
          setDrawnArrows([]);
        }
      } else {
        setDrawnArrows([]);
      }

      console.log('✅ Setting puzzle state with:', puzzleData.puzzle);
      setPuzzle({ ...puzzleData.puzzle, originalMoves: [...puzzleData.puzzle.moves] });
      setCurrentPuzzle(puzzleData.puzzle);
      setGame(newGame);
      setFen(newGame.fen());
      console.log('🎯 Game state set with FEN:', newGame.fen());
      setMoveIndex(userMoveIndex);
      setShowSolution(false);
      setFeedback('Your turn to move!');
      setDrawnArrows([]);
      setPuzzleState('active');
      setSelectedSquare(null);
      
      // Set orientation based on side to move
      setOrientation(newGame.turn() === 'w' ? 'white' : 'black');
      console.log('✅ Puzzle initialization complete!');
      
      setTotalAttempts(prev => prev + 1);
    } catch (err) {
      console.error('Error initializing puzzle:', err);
      setFeedback('Failed to initialize puzzle. Please try again.');
      setLoading(false);
    }
  }, []);

  const playMoveSound = (move) => {
    if (!move) return;
    try {
      if (move.flags && move.flags.includes('c')) {
        captureSoundRef.current && captureSoundRef.current.play().catch(e => console.warn('Could not play capture sound:', e));
      } else if (move.flags && (move.flags.includes('k') || move.flags.includes('q'))) {
        castleSoundRef.current && castleSoundRef.current.play().catch(e => console.warn('Could not play castle sound:', e));
      } else {
        moveSoundRef.current && moveSoundRef.current.play().catch(e => console.warn('Could not play move sound:', e));
      }
    } catch (error) {
      console.warn('Error playing move sound:', error);
    }
  };

  const onPieceDrop = (from, to, piece) => {
    if (!game || !puzzle || puzzleState !== 'active' || puzzleComplete) {
      return false;
    }

    console.log('=== ENDGAME TRAINING MOVE VALIDATION START ===');
    console.log('Attempting move from', from, 'to', to);
    console.log('Current move index:', moveIndex);
    console.log('Game turn:', game.turn());
    console.log('Puzzle moves:', puzzle.moves);

    // Strict check: ensure the piece being moved is of the correct color
    const pieceObj = game.get(from);
    if (!pieceObj) {
      console.log('❌ No piece on square:', from);
      setFeedback('No piece on this square.');
      return false;
    }

    if (pieceObj.color !== game.turn()) {
      console.log('❌ Wrong color piece. Piece color:', pieceObj.color, 'Game turn:', game.turn());
      setFeedback('Wrong color to move!');
      return false;
    }

    try {
      // First, check if the move is legal in the current position
      const tempGame = new Chess(game.fen());
      const move = tempGame.move({ from, to, promotion: 'q' });
      
      if (!move) {
        console.log('❌ Illegal move - not allowed');
        return false;
      }

      console.log('✅ Move is legal:', move.san);
      playMoveSound(move);

      // Get the expected move for this position
      const expectedMove = puzzle.moves[moveIndex];
      console.log('Current move index:', moveIndex);
      console.log('Expected move:', expectedMove);
      console.log('Actual move SAN:', move.san);
      console.log('Actual move UCI:', move.from + move.to);
      
      if (!expectedMove) {
        console.error('❌ No expected move found for index:', moveIndex);
        return false;
      }

      // Compare the actual move with the expected move
      const actualMoveSan = move.san;
      const actualMoveUCI = move.from + move.to;
      
      // Check if expected move is in UCI format
      const isExpectedUCI = expectedMove.length === 4 && /^[a-h][1-8][a-h][1-8]$/.test(expectedMove);
      
      let isCorrectMove = false;
      if (isExpectedUCI) {
        // Compare UCI format
        isCorrectMove = actualMoveUCI === expectedMove;
        console.log('UCI comparison:', { actual: actualMoveUCI, expected: expectedMove, isCorrect: isCorrectMove });
      } else {
        // Compare SAN format
        isCorrectMove = actualMoveSan === expectedMove;
        console.log('SAN comparison:', { actual: actualMoveSan, expected: expectedMove, isCorrect: isCorrectMove });
      }
      
      if (isCorrectMove) {
        console.log('✅ Move is correct! Playing move and opponent reply...');
        
        // Move is correct, play it and the opponent's reply
        const newGame = new Chess(game.fen());
        const userMove = newGame.move({ from, to, promotion: 'q' });
        
        let newMoveIndex = moveIndex + 1;
        
        console.log('User move played:', userMove.san);
        setGame(newGame);
        setFen(newGame.fen());
        setMoveIndex(newMoveIndex);
        
        // Check if puzzle is complete
        if (newMoveIndex >= puzzle.moves.length) {
          console.log('🎉 Puzzle completed!');
          setPuzzleComplete(true);
          setPuzzleSolved(true);
          setPuzzleState('completed');
          setFeedback('Endgame solved! Well done!');
          setScore(prev => prev + 1);
          
          // Auto-load next puzzle after a short delay
          setTimeout(() => {
            loadNextPuzzle();
          }, 2000);
        } else {
          // Play opponent's move if it exists
          const opponentMove = puzzle.moves[newMoveIndex];
          if (opponentMove) {
            try {
              let opponentMoveResult = null;
              if (opponentMove.length === 4 && /^[a-h][1-8][a-h][1-8]$/.test(opponentMove)) {
                // UCI format
                opponentMoveResult = newGame.move({ 
                  from: opponentMove.substring(0, 2), 
                  to: opponentMove.substring(2, 4), 
                  promotion: 'q' 
                });
              } else {
                // SAN format
                opponentMoveResult = newGame.move(opponentMove, { sloppy: true });
              }
              
              if (opponentMoveResult) {
                console.log('✅ Played opponent move:', opponentMove);
                setGame(newGame);
                setFen(newGame.fen());
                setMoveIndex(newMoveIndex + 1);
                
                // Show arrow for opponent's move
                const arrow = { from: opponentMoveResult.from, to: opponentMoveResult.to, color: '#3b82f6' };
                setDrawnArrows([arrow]);
                setFeedback('Good move! Your turn again.');
              }
            } catch (error) {
              console.log('⚠️ Could not play opponent move:', error.message);
            }
          } else {
            setFeedback('Good move!');
          }
        }
        
        return true;
      } else {
        console.log('❌ Move is incorrect');
        setFeedback('Not the best move. Try again!');
        return false;
      }
    } catch (error) {
      console.error('Error processing move:', error);
      setFeedback('Error processing move. Please try again.');
      return false;
    }
  };

  const onSquareClick = (square) => {
    if (!game || puzzleState !== 'active' || puzzleComplete) return;

    if (selectedSquare === square) {
      setSelectedSquare(null);
      setHighlightedSquares([]);
    } else {
      setSelectedSquare(square);
      setHighlightedSquares([square]);
    }
  };

  const backToMenu = () => {
    setShowMenu(true);
    setSelectedTheme(null);
    setPuzzleCache([]);
    setPuzzleCount(0);
    setCurrentPuzzleIndex(0);
    setCurrentPuzzle(null);
    setGame(null);
    setFen('');
    setFeedback('');
    setShowSolution(false);
    setSolution([]);
    setSelectedSquare(null);
    setDrawnArrows([]);
    setHighlightedSquares([]);
    setPuzzleComplete(false);
    setPuzzleState('active');
    setScore(0);
    setTotalAttempts(0);
  };

  if (showMenu) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 p-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-4">Endgame Training</h1>
            <p className="text-lg text-gray-600 mb-4">
              Master the art of endgame play with specialized training puzzles
            </p>
            {userRating && (
              <div className="inline-flex items-center bg-white rounded-lg px-4 py-2 shadow-sm">
                <Trophy className="w-5 h-5 text-yellow-500 mr-2" />
                <span className="font-semibold text-gray-700">Rating: {userRating}</span>
              </div>
            )}
          </div>

          {/* Endgame Themes Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {endgameThemeOptions.map((theme) => (
              <div
                key={theme.id}
                className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer border-2 border-transparent hover:border-amber-200 transform hover:scale-105"
                onClick={() => loadEndgamePuzzles(theme.id)}
              >
                <div className="text-center">
                  <div className="text-4xl mb-4">{theme.icon}</div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">{theme.name}</h3>
                  <p className="text-gray-600 text-sm">{theme.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Stats */}
          {totalAttempts > 0 && (
            <div className="text-center">
              <div className="inline-flex items-center bg-amber-100 rounded-lg px-4 py-2">
                <BarChart3 className="w-5 h-5 text-amber-600 mr-2" />
                <span className="text-amber-800 font-medium">
                  Puzzles Attempted: {totalAttempts} | Solved: {score}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg p-4 mb-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button 
                onClick={backToMenu}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-800">Endgame Training</h1>
                <p className="text-sm text-gray-600">
                  {selectedTheme && endgameThemeOptions.find(t => t.id === selectedTheme)?.name} - 
                  Puzzle {currentPuzzleIndex + 1} of {puzzleCount}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Target className="w-5 h-5 text-green-600" />
                <span className="font-bold text-lg">{score}</span>
              </div>
              <div className="flex items-center space-x-2">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                <span className="font-bold text-lg">{totalAttempts}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Chessboard */}
          <div className="xl:col-span-3">
            <div className="w-full max-w-full bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-4 shadow-inner border border-amber-200">
              <div className="bg-gradient-to-br from-amber-100 to-orange-100 rounded-xl p-2 shadow-lg flex justify-center">
                <Chessboard
                  ref={boardRef}
                  position={showSolution ? (solutionPosition || puzzle?.fen || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1') : game?.fen() || puzzle?.fen || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'}
                  onPieceDrop={(sourceSquare, targetSquare) => {
                    const success = onPieceDrop(sourceSquare, targetSquare);
                    return success;
                  }}
                  onSquareClick={(square) => {
                    if (!game || showSolution) return;

                    if (selectedSquare) {
                      // If a square is already selected, try to make a move
                      const success = onPieceDrop(selectedSquare, square);
                      if (success) {
                        setSelectedSquare(null);
                      } else {
                        // Invalid move, select the new square
                        const piece = game.get(square);
                        if (piece && piece.color === game.turn()) {
                          setSelectedSquare(square);
                        } else {
                          setSelectedSquare(null);
                        }
                      }
                    } else {
                      // No square selected, select this square if it has a piece of the correct color
                      const piece = game.get(square);
                      if (piece && piece.color === game.turn()) {
                        setSelectedSquare(square);
                      }
                    }
                  }}
                  onRightClickSquare={(square) => {
                    setHighlightedSquares(prev => 
                      prev.includes(square) 
                        ? prev.filter(s => s !== square)
                        : [...prev, square]
                    );
                  }}
                  customSquareStyles={highlightedSquares.reduce((acc, square) => {
                    acc[square] = { backgroundColor: 'rgba(239, 68, 68, 0.3)' };
                    return acc;
                  }, {})}
                  boardWidth={boardSize}
                  arePiecesDraggable={true}
                  customBoardStyle={{
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                  }}
                  customArrows={[]}
                  arePiecesDraggable={true}
                  areArrowsAllowed={false}
                  boardOrientation={orientation}
                  animationDuration={200}
                />
              </div>
            </div>
          </div>

          {/* Controls and Info */}
          <div className="xl:col-span-1 space-y-4">
            {/* Current Puzzle Info */}
            {currentPuzzle && (
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <h3 className="font-bold text-lg mb-2">Current Puzzle</h3>
                <p className="text-gray-600 text-sm mb-2">
                  Theme: {currentPuzzle.theme || 'Endgame'}
                </p>
                <p className="text-gray-600 text-sm">
                  Rating: {currentPuzzle.rating || 'Unknown'}
                </p>
              </div>
            )}

            {/* Feedback */}
            {feedback && (
              <div className={`p-4 rounded-lg ${
                feedback.includes('solved') || feedback.includes('Good') 
                  ? 'bg-green-100 text-green-800' 
                  : feedback.includes('Error') || feedback.includes('Not the best')
                  ? 'bg-red-100 text-red-800'
                  : 'bg-blue-100 text-blue-800'
              }`}>
                {feedback}
              </div>
            )}

            {/* Controls */}
            <div className="bg-white rounded-lg p-4 shadow-sm space-y-3">
              <h3 className="font-bold text-lg mb-3">Controls</h3>
              
              <button
                onClick={() => loadNextPuzzle()}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
              >
                <Play className="w-4 h-4 mr-2" />
                Next Puzzle
              </button>
              
              <button
                onClick={backToMenu}
                className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center"
              >
                <Home className="w-4 h-4 mr-2" />
                Back to Menu
              </button>
            </div>

            {/* Stats */}
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <h3 className="font-bold text-lg mb-3">Session Stats</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Puzzles Solved:</span>
                  <span className="font-medium">{score}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Attempts:</span>
                  <span className="font-medium">{totalAttempts}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Success Rate:</span>
                  <span className="font-medium">
                    {totalAttempts > 0 ? Math.round((score / totalAttempts) * 100) : 0}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EndgameTrainingPage;
