import React, { useState, useEffect } from 'react';
import { Chess } from 'chess.js';
import { useAuth } from '../contexts/AuthContext';
import { 
  Home, 
  Trophy, 
  Target, 
  Play, 
  RotateCcw, 
  Eye, 
  EyeOff, 
  CheckCircle, 
  BarChart3, 
  ChevronDown,
  Settings,
  BookOpen,
  Zap,
  Brain,
  Castle
} from 'lucide-react';

const API_BASE = 'http://localhost:5000/api/endgames';

const EndgamePage = () => {
  const { user } = useAuth();
  const [game, setGame] = useState(null);
  const [fen, setFen] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [showSolution, setShowSolution] = useState(false);
  const [solution, setSolution] = useState([]);
  const [puzzleComplete, setPuzzleComplete] = useState(false);
  const [puzzleState, setPuzzleState] = useState('active');
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [drawnArrows, setDrawnArrows] = useState([]);
  const [highlightedSquares, setHighlightedSquares] = useState([]);
  const [boardSize] = useState(800);
  const [orientation, setOrientation] = useState('white');
  const [gameMode, setGameMode] = useState('menu');
  const [currentPuzzle, setCurrentPuzzle] = useState(null);
  const [moveIndex, setMoveIndex] = useState(0);
  const [puzzleSolved, setPuzzleSolved] = useState(false);
  const [endgameCategories, setEndgameCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [puzzlesCompleted, setPuzzlesCompleted] = useState(0);
  const [correctMoves, setCorrectMoves] = useState(0);
  const [totalMoves, setTotalMoves] = useState(0);
  const [userRating, setUserRating] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [difficulty, setDifficulty] = useState('medium');
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [showThemeDropdown, setShowThemeDropdown] = useState(false);

  useEffect(() => {
    fetchUserRating();
    fetchEndgameCategories();
  }, []);

  const fetchUserRating = async () => {
    try {
      if (user && user.rating) {
        setUserRating(user.rating);
      }
    } catch (error) {
      console.error('Error fetching user rating:', error);
    }
  };

  const fetchEndgameCategories = async () => {
    try {
      setCategoriesLoading(true);
      const response = await fetch(`${API_BASE}/categories`);
      if (response.ok) {
        const data = await response.json();
        setEndgameCategories(data.categories || []);
      } else {
        console.error('Failed to fetch categories:', response.status);
        setFeedback('Failed to load endgame categories. Please refresh the page.');
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      setFeedback('Error loading endgame categories. Please check your connection.');
    } finally {
      setCategoriesLoading(false);
    }
  };

  const loadNewPuzzle = async (categoryId) => {
    setLoading(true);
    setFeedback('');
    setShowSolution(false);
    setSolution([]);
    setPuzzleComplete(false);
    setPuzzleState('active');
    setSelectedSquare(null);
    setMoveIndex(0);
    setPuzzleSolved(false);
    setDrawnArrows([]);
    setHighlightedSquares([]);

    try {
      console.log(`Loading endgame category: ${categoryId}`);
      
      const response = await fetch(`${API_BASE}/category/${categoryId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch endgame: ${response.status}`);
      }
      
      const puzzleData = await response.json();
      console.log('Received endgame puzzle data:', puzzleData);
      
      if (puzzleData && puzzleData.fen && puzzleData.moves) {
        initializePuzzle({ puzzle: puzzleData });
        setGameMode('playing');
      } else {
        throw new Error('Invalid puzzle data structure');
      }
      
    } catch (error) {
      console.error('Error loading puzzle:', error);
      setFeedback('Failed to load puzzle. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const nextPuzzle = async () => {
    if (!selectedCategory || !currentPuzzle) return;
    
    setLoading(true);
    setFeedback('');
    setShowSolution(false);
    setSolution([]);
    setPuzzleComplete(false);
    setPuzzleState('active');
    setSelectedSquare(null);
    setMoveIndex(0);
    setPuzzleSolved(false);
    setDrawnArrows([]);
    setHighlightedSquares([]);

    try {
      console.log(`Loading next puzzle for category: ${selectedCategory.id}`);
      
      const response = await fetch(`${API_BASE}/next/${selectedCategory.id}?currentId=${currentPuzzle.id}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch next puzzle: ${response.status}`);
      }
      
      const puzzleData = await response.json();
      console.log('Received next puzzle data:', puzzleData);
      
      if (puzzleData && puzzleData.fen && puzzleData.moves) {
        initializePuzzle({ puzzle: puzzleData });
      setGameMode('playing');
      } else {
        throw new Error('Invalid puzzle data structure');
      }
      
    } catch (error) {
      console.error('Error loading next puzzle:', error);
      setFeedback('Failed to load next puzzle. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const initializePuzzle = (puzzleData) => {
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
          let firstMoveResult = null;
          if (firstMove.length === 4 && /^[a-h][1-8][a-h][1-8]$/.test(firstMove)) {
            firstMoveResult = newGame.move({ 
              from: firstMove.substring(0, 2), 
              to: firstMove.substring(2, 4), 
              promotion: 'q' 
            });
          } else {
            firstMoveResult = newGame.move(firstMove, { sloppy: true });
          }
          
          if (firstMoveResult) {
            userMoveIndex = 1;
            console.log('✅ Played opponent move:', firstMove);
            
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
      
      setOrientation(newGame.turn() === 'w' ? 'white' : 'black');
      console.log('✅ Puzzle initialization complete!');
      
    } catch (err) {
      console.error('Error initializing puzzle:', err);
      setFeedback('Failed to initialize puzzle. Please try again.');
      setLoading(false);
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

  const onDrop = (from, to, piece) => {
    if (!game || !currentPuzzle || puzzleState !== 'active' || puzzleComplete) {
      return false;
    }

    try {
      const move = game.move({ from, to, promotion: 'q' });
      
      if (!move) {
        return false;
      }

      setGame(new Chess(game.fen()));
      setFen(game.fen());
      
      // Check if move is correct
      const expectedMove = currentPuzzle.moves[moveIndex];
      if (expectedMove) {
        const isCorrect = move.san === expectedMove || (move.from + move.to) === expectedMove;
        
        if (isCorrect) {
        setCorrectMoves(prev => prev + 1);
          setFeedback('Correct move!');
        
        // Check if puzzle is complete
          if (moveIndex + 1 >= currentPuzzle.moves.length) {
          setPuzzleComplete(true);
          setPuzzleSolved(true);
          setPuzzlesCompleted(prev => prev + 1);
            setFeedback('Puzzle solved! Well done!');
        } else {
          // Play opponent's move if it exists
            const opponentMove = currentPuzzle.moves[moveIndex + 1];
          if (opponentMove) {
            try {
                const newGame = new Chess(game.fen());
              let opponentMoveResult = null;
                
              if (opponentMove.length === 4 && /^[a-h][1-8][a-h][1-8]$/.test(opponentMove)) {
                opponentMoveResult = newGame.move({ 
                  from: opponentMove.substring(0, 2), 
                  to: opponentMove.substring(2, 4), 
                  promotion: 'q' 
                });
              } else {
                opponentMoveResult = newGame.move(opponentMove, { sloppy: true });
              }
              
              if (opponentMoveResult) {
                setGame(newGame);
                setFen(newGame.fen());
                  setMoveIndex(moveIndex + 2);
                
                const arrow = { from: opponentMoveResult.from, to: opponentMoveResult.to, color: '#3b82f6' };
                setDrawnArrows([arrow]);
                  setFeedback('Good move! Your turn again.');
              }
            } catch (error) {
              console.log('⚠️ Could not play opponent move:', error.message);
                setMoveIndex(moveIndex + 1);
              }
            } else {
              setMoveIndex(moveIndex + 1);
            }
          }
        } else {
          setFeedback('Incorrect move. Try again!');
          setTotalMoves(prev => prev + 1);
        }
      }
      
      setTotalMoves(prev => prev + 1);
      setSelectedSquare(null);
      setHighlightedSquares([]);
      
    } catch (error) {
      console.error('Error making move:', error);
      return false;
    }
    
    return true;
  };

  const resetPuzzle = () => {
    if (currentPuzzle) {
      initializePuzzle({ puzzle: currentPuzzle });
    }
  };

  const fetchSolution = async () => {
    if (!currentPuzzle) return;

    try {
      const response = await fetch(`${API_BASE}/${currentPuzzle.id}/solution`);
      if (response.ok) {
        const data = await response.json();
        setSolution(data.solution || []);
        setShowSolution(true);
      }
    } catch (error) {
      console.error('Error fetching solution:', error);
    }
  };

  const selectCategory = (category) => {
    if (!category || !category.id) {
      console.error('Invalid category:', category);
      setFeedback('Invalid category selected. Please try again.');
      return;
    }
    setSelectedCategory(category);
    loadNewPuzzle(category.id);
  };

  const backToMenu = () => {
    setGameMode('menu');
    setSelectedCategory(null);
    setCurrentPuzzle(null);
    setGame(null);
    setFen('');
    setFeedback('');
    setShowSolution(false);
    setSolution([]);
    setPuzzleComplete(false);
    setPuzzleState('active');
    setSelectedSquare(null);
    setMoveIndex(0);
    setPuzzleSolved(false);
    setDrawnArrows([]);
    setHighlightedSquares([]);
  };

  const renderBoard = () => {
    if (!game) return null;

    const board = game.board();
    const squares = [];
    
    for (let rank = 7; rank >= 0; rank--) {
      for (let file = 0; file < 8; file++) {
        const square = String.fromCharCode(97 + file) + (rank + 1);
        const piece = board[rank][file];
        const isSelected = selectedSquare === square;
        const isHighlighted = highlightedSquares.includes(square);
        const isLight = (rank + file) % 2 === 0;
        
        squares.push(
          <div
            key={square}
            className={`w-16 h-16 flex items-center justify-center cursor-pointer relative ${
              isLight ? 'bg-amber-100' : 'bg-amber-800'
            } ${isSelected ? 'ring-4 ring-blue-500' : ''} ${
              isHighlighted ? 'ring-2 ring-yellow-400' : ''
            }`}
            onClick={() => onSquareClick(square)}
          >
            {piece && (
              <div className="text-4xl">
                {piece.color === 'w' ? 
                  (piece.type === 'p' ? '♙' : piece.type === 'r' ? '♖' : piece.type === 'n' ? '♘' : 
                   piece.type === 'b' ? '♗' : piece.type === 'q' ? '♕' : '♔') :
                  (piece.type === 'p' ? '♟' : piece.type === 'r' ? '♜' : piece.type === 'n' ? '♞' : 
                   piece.type === 'b' ? '♝' : piece.type === 'q' ? '♛' : '♚')
                }
              </div>
            )}
            <div className="absolute bottom-0 right-0 text-xs text-gray-600">
              {square}
            </div>
          </div>
        );
      }
    }

    return (
      <div className="grid grid-cols-8 gap-0 border-4 border-gray-800">
        {squares}
      </div>
    );
  };

  if (gameMode === 'menu') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 text-white">
        {/* Header */}
        <div className="bg-black/20 backdrop-blur-sm border-b border-white/10 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Castle className="w-8 h-8 text-yellow-400" />
              <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                Chess Endgame Training
              </h1>
            </div>
            {userRating && (
              <div className="flex items-center bg-white/10 backdrop-blur-sm rounded-xl px-6 py-3 border border-white/20">
                <Trophy className="w-6 h-6 text-yellow-400 mr-3" />
                <span className="font-bold text-lg">Rating: {userRating}</span>
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-6 py-12">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4 text-yellow-300">
              Master Endgame Positions
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Practice endgame scenarios from your CSV database. Select a theme and start training!
            </p>
                    </div>
                    
          {/* Feedback Display */}
          {feedback && (
            <div className="max-w-2xl mx-auto mb-8">
              <div className={`p-4 rounded-lg text-center font-medium ${
                feedback.includes('Error') || feedback.includes('Failed')
                  ? 'bg-red-900/20 text-red-200 border border-red-500/30' 
                  : feedback.includes('Loading')
                  ? 'bg-blue-900/20 text-blue-200 border border-blue-500/30'
                  : 'bg-green-900/20 text-green-200 border border-green-500/30'
              }`}>
                {feedback}
              </div>
            </div>
          )}

          {/* Theme Selection */}
          <div className="max-w-2xl mx-auto mb-8">
            <div className="relative">
              <button
                onClick={() => setShowThemeDropdown(!showThemeDropdown)}
                className="w-full bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/20 transition-all duration-300 flex items-center justify-between"
              >
                <span className="text-lg">
                  {selectedCategory ? `Selected: ${selectedCategory.name}` : 'Choose Endgame Theme'}
                </span>
                <ChevronDown className={`w-5 h-5 transition-transform ${showThemeDropdown ? 'rotate-180' : ''}`} />
                  </button>
              
              {showThemeDropdown && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 max-h-96 overflow-y-auto z-10">
                  {categoriesLoading ? (
                    <div className="p-4 text-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-yellow-400 mx-auto"></div>
                      <p className="mt-2">Loading themes...</p>
                    </div>
                  ) : endgameCategories.length > 0 ? (
                    endgameCategories.map((category) => (
                      <button
                        key={category.id}
                        onClick={() => {
                          selectCategory(category);
                          setShowThemeDropdown(false);
                        }}
                        className="w-full p-4 text-left hover:bg-white/20 transition-colors border-b border-white/10 last:border-b-0"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold text-yellow-300">{category.name}</h3>
                            <p className="text-sm text-gray-300">{category.count} puzzles</p>
                          </div>
                          <Play className="w-5 h-5 opacity-50" />
                        </div>
                  </button>
                    ))
                  ) : (
                    <div className="p-4 text-center text-red-300">
                      No themes available. Please check your backend.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Quick Start Section */}
          {selectedCategory && (
            <div className="text-center">
              <button
                onClick={() => selectCategory(selectedCategory)}
                className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-bold py-4 px-8 rounded-2xl text-xl hover:from-yellow-500 hover:to-orange-600 transform hover:scale-105 transition-all duration-300"
              >
                <Play className="w-6 h-6 inline mr-3" />
                Start Training: {selectedCategory.name}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button 
              onClick={backToMenu}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <Home className="w-6 h-6" />
            </button>
            <h1 className="text-2xl font-bold">Endgame Training</h1>
            {selectedCategory && (
              <span className="text-gray-400">- {selectedCategory.name}</span>
            )}
          </div>
          {userRating && (
            <div className="flex items-center bg-gray-700 rounded-lg px-4 py-2">
              <Trophy className="w-5 h-5 text-yellow-500 mr-2" />
              <span className="font-semibold">Rating: {userRating}</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex h-screen">
        {/* Chess Board */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="space-y-6">
            {renderBoard()}
            
            {/* Game Info */}
                      <div className="text-center">
              <div className="text-lg font-semibold mb-2">
                {currentPuzzle?.description || 'Endgame Position'}
                        </div>
              <div className="text-sm text-gray-400">
                Move {moveIndex + 1} of {currentPuzzle?.moves?.length || 0}
                      </div>
                    </div>
                </div>
              </div>

        {/* Sidebar */}
        <div className="w-96 bg-gray-800 border-l border-gray-700 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Feedback */}
                    {feedback && (
              <div className={`p-4 rounded-lg text-center font-medium ${
                feedback.includes('Correct') || feedback.includes('solved')
                          ? 'bg-green-900 text-green-200' 
                  : feedback.includes('Error') || feedback.includes('Incorrect')
                          ? 'bg-red-900 text-red-200'
                          : 'bg-blue-900 text-blue-200'
                      }`}>
                        {feedback}
                  </div>
                )}

                {/* Controls */}
            <div className="bg-gray-700 rounded-lg p-4">
                  <div className="space-y-3">
                    <button
                      onClick={resetPuzzle}
                      disabled={!currentPuzzle}
                      className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Reset Position
                    </button>
                    
                    <button
                      onClick={fetchSolution}
                      disabled={!currentPuzzle}
                      className="w-full flex items-center justify-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {showSolution ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                      {showSolution ? 'Hide' : 'Show'} Solution
                    </button>
                    
                    <button
                      onClick={nextPuzzle}
                      disabled={!selectedCategory}
                      className="w-full flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Next Puzzle
                    </button>
                  </div>
                </div>

                {/* Solution Display */}
                {showSolution && solution.length > 0 && (
              <div className="bg-gray-700 rounded-lg p-4">
                    <h4 className="font-semibold mb-3">Solution:</h4>
                    <div className="space-y-2">
                      {solution.map((move, index) => (
                        <div 
                          key={index}
                          className={`flex items-center justify-between p-2 rounded ${
                        index === moveIndex ? 'bg-blue-900' : 'bg-gray-600'
                          }`}
                        >
                          <span className="text-sm">{index + 1}. {move}</span>
                          {index < moveIndex && <CheckCircle className="w-4 h-4 text-green-400" />}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Stats */}
            <div className="bg-gray-700 rounded-lg p-4">
                  <h4 className="font-semibold mb-3 flex items-center">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Session Stats
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Puzzles Completed:</span>
                      <span className="font-medium">{puzzlesCompleted}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Correct Moves:</span>
                      <span className="font-medium">{correctMoves}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Total Moves:</span>
                      <span className="font-medium">{totalMoves}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Accuracy:</span>
                      <span className="font-medium">
                        {totalMoves > 0 ? Math.round((correctMoves / totalMoves) * 100) : 0}%
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

export default EndgamePage;