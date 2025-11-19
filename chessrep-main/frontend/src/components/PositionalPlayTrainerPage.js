import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import { useAuth } from '../contexts/AuthContext';
import { BookOpen, Target, Brain, Award, Clock, BarChart3 } from 'lucide-react';

const API_BASE = 'http://localhost:3001/api/positional';

const PositionalPlayTrainerPage = () => {
  const { user, refreshUser } = useAuth();
  const [currentPosition, setCurrentPosition] = useState(null);
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
  const [selectedTheme, setSelectedTheme] = useState('');
  const [puzzleComplete, setPuzzleComplete] = useState(false);
  const [puzzleState, setPuzzleState] = useState('active');
  const [drawnArrows, setDrawnArrows] = useState([]);
  const [highlightedSquares, setHighlightedSquares] = useState([]);
  const [boardSize] = useState(600);
  const moveSoundRef = useRef(null);
  const captureSoundRef = useRef(null);
  const castleSoundRef = useRef(null);

  const positionalThemes = [
    { id: 'weak-squares', name: 'Weak Squares', desc: 'Identify and exploit weak squares' },
    { id: 'outposts', name: 'Outposts', desc: 'Establish and defend outposts' },
    { id: 'pawn-structure', name: 'Pawn Structure', desc: 'Understand pawn structure dynamics' },
    { id: 'open-files', name: 'Open Files', desc: 'Control open files with rooks' },
    { id: 'piece-activity', desc: 'Improve piece activity and coordination' },
    { id: 'space-control', name: 'Space Control', desc: 'Control key squares and space' },
    { id: 'king-safety', name: 'King Safety', desc: 'Assess and improve king safety' },
    { id: 'minority-attack', name: 'Minority Attack', desc: 'Execute minority attacks' }
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
    loadNewPosition();
  }, []);

  useEffect(() => {
    if (user && user.positionalRating) {
      setUserRating(user.positionalRating);
    }
  }, [user]);

  const fetchUserRating = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('http://localhost:3001/api/auth/me', {
        headers: {
          'x-auth-token': token
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.positionalRating) {
          setUserRating(data.positionalRating);
        } else {
          setUserRating(1200); // Default rating
        }
      }
    } catch (error) {
      console.error('Error fetching user rating:', error);
    }
  };

  const loadNewPosition = async () => {
    try {
      setLoading(true);
      setFeedback('');
      setShowSolution(false);
      setSolution([]);
      setPuzzleComplete(false);
      setPuzzleState('active');
      setSelectedSquare(null);
      setDrawnArrows([]);
      setHighlightedSquares([]);

      let url = `${API_BASE}/random`;
      const params = new URLSearchParams();
      
      if (selectedTheme) params.append('theme', selectedTheme);
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await fetch(url);
      if (response.ok) {
        const position = await response.json();
        console.log('Raw position data:', position);
        setCurrentPosition(position);
        
        try {
          const chess = new Chess(position.fen);
          setGame(chess);
          setFen(chess.fen());
          console.log('Chess object created successfully, FEN:', chess.fen());
        } catch (error) {
          console.error('Error creating chess object:', error);
          setFeedback('Error parsing position. Please try again.');
        }
        
        console.log('Loaded new positional position:', position);
      } else {
        console.error('Failed to load positional position');
        setFeedback('Failed to load position. Please try again.');
      }
    } catch (error) {
      console.error('Error loading positional position:', error);
      setFeedback('Error loading position. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  function playMoveSound(move) {
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
  }

  const handleMove = (from, to) => {
    if (loading || puzzleComplete || !game || !currentPosition || puzzleState !== 'active') {
      return false;
    }
    
    const tempGame = new Chess(game.fen());
    const move = tempGame.move({ from, to, promotion: 'q' });
    if (!move) return false;
    playMoveSound(move);
    
    // Check if move matches the best strategic move
    const actualMoveSan = move.san;
    const actualMoveUCI = move.from + move.to;
    const bestMove = currentPosition.bestMove;
    
    const isCorrectMove = actualMoveSan === bestMove || actualMoveUCI === bestMove;
    
    if (isCorrectMove) {
      setFeedback('Excellent strategic move!');
      setScore(prev => prev + 1);
      setPuzzleComplete(true);
      setPuzzleState('solved');
      updatePositionalStats(true);
    } else {
      setFeedback('Not the best strategic move. Consider the positional factors.');
      setPuzzleComplete(true);
      setShowSolution(true);
      setSolution([bestMove]);
      setPuzzleState('failed');
      updatePositionalStats(false);
    }
    
    setTotalAttempts(prev => prev + 1);
    return true;
  };

  const handleShowSolution = () => {
    if (puzzleState !== 'failed') {
      updatePositionalStats(false);
      setPuzzleState('failed');
    }
    setShowSolution(true);
    setSolution([currentPosition.bestMove]);
    setPuzzleComplete(true);
    
    // Play the solution move
    if (currentPosition && currentPosition.bestMove) {
      const solutionGame = new Chess(currentPosition.fen);
      const move = currentPosition.bestMove;
      
      let result;
      if (move.length === 4 && /^[a-h][1-8][a-h][1-8]$/.test(move)) {
        const from = move.substring(0, 2);
        const to = move.substring(2, 4);
        result = solutionGame.move({ from, to, promotion: 'q' });
      } else {
        result = solutionGame.move(move, { sloppy: true });
      }
      
      if (result) {
        setGame(new Chess(solutionGame.fen()));
        setFen(solutionGame.fen());
      }
    }
    
    setFeedback('Solution shown. Click "Next Position" for a new challenge.');
  };

  const updatePositionalStats = async (solved) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const ratingToSend = typeof currentPosition?.rating === 'number' ? currentPosition.rating : 1200;

      const response = await fetch('http://localhost:3001/api/stats/positional', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        body: JSON.stringify({ solved, puzzleRating: ratingToSend })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.newRating) {
          const change = data.ratingChange;
          setUserRating(data.newRating);
          setRatingChange(change);
          setShowRatingChange(true);
          setTimeout(() => setShowRatingChange(false), 3000);
        }
        
        await refreshUser();
      }
    } catch (error) {
      console.error('Error updating positional stats:', error);
    }
  };

  const handleNextPosition = () => {
    if (puzzleState === 'active') {
      updatePositionalStats(false);
    }
    loadNewPosition();
  };

  const handleSquareClick = (square) => {
    if (loading || puzzleComplete || !game || !currentPosition || puzzleState !== 'active') {
      return;
    }
    
    if (!selectedSquare) {
      const piece = game.get(square);
      if (piece && piece.color === game.turn()) {
        const legalMoves = game.moves({ square, verbose: true });
        if (legalMoves.length > 0) {
          setSelectedSquare(square);
          setFeedback('Piece selected. Click destination.');
        } else {
          setFeedback('This piece has no legal moves.');
        }
      } else {
        if (piece) {
          setFeedback('Wrong color to move!');
        } else {
          setFeedback('No piece on this square.');
        }
      }
    } else {
      if (selectedSquare === square) {
        setSelectedSquare(null);
        setFeedback('');
      } else {
        const success = handleMove(selectedSquare, square);
        setSelectedSquare(null);
      }
    }
  };

  const handleDrawArrow = useCallback((arrow) => {
    setDrawnArrows((prev) => [...prev, arrow]);
  }, []);

  const handleClearArrows = useCallback(() => {
    setDrawnArrows([]);
  }, []);

  const getAllArrows = () => {
    return drawnArrows.map(a => [a.from, a.to, a.color || '#f39c12']);
  };

  const handleRightClickSquare = useCallback((square) => {
    setHighlightedSquares((prev) =>
      prev.includes(square)
        ? prev.filter((s) => s !== square)
        : [...prev, square]
    );
  }, []);

  const getCustomSquareStyles = () => {
    const styles = {};
    if (selectedSquare) {
      styles[selectedSquare] = { backgroundColor: 'rgba(20, 85, 30, 0.4)' };
    }
    highlightedSquares.forEach((sq) => {
      styles[sq] = { backgroundColor: 'rgba(255, 0, 0, 0.4)' };
    });
    return styles;
  };

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2 bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
          Positional Play Trainer
        </h1>
        <p className="text-gray-300 text-lg">Master strategic concepts beyond tactics</p>
      </div>
      
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Board and info */}
        <div className="xl:col-span-3">
          <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl shadow-2xl border border-gray-200 p-6 sm:p-8">
            <div className="flex flex-col items-center">
              {/* User Rating Display */}
              <div className="mb-4 w-full flex flex-col items-center">
                <div className="text-lg font-semibold text-green-700 mb-2">Your Positional Rating</div>
                {userRating !== null && (
                  <div className="text-center">
                    <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-4 shadow-lg">
                      <p className="text-xl sm:text-2xl font-bold text-white mb-1">{userRating}</p>
                      <p className="text-green-100 text-sm">Current Rating</p>
                    </div>
                    {showRatingChange && ratingChange !== null && (
                      <div className={`mt-3 p-2 rounded-xl text-center font-bold text-sm shadow-lg transform transition-all duration-300 ${
                        ratingChange > 0 
                          ? 'bg-gradient-to-r from-green-500 to-green-600 text-white' 
                          : 'bg-gradient-to-r from-red-500 to-red-600 text-white'
                      }`}>
                        {ratingChange > 0 ? '+' : ''}{ratingChange}
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {/* Turn Indicator */}
              <div className={`mb-6 px-6 py-3 rounded-xl font-bold text-base sm:text-lg shadow-lg transform transition-all duration-300 ${
                game?.turn() === 'w' 
                  ? 'text-white bg-gradient-to-r from-blue-600 to-blue-700 shadow-blue-500/50' 
                  : 'text-white bg-gradient-to-r from-gray-800 to-black shadow-gray-800/50'
              }`}>
                {game?.turn() === 'w' ? 'White to move' : 'Black to move'}
              </div>
              
              {/* Chess Board */}
              <div className="relative w-full flex justify-center">
                <div className="w-full max-w-full bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-4 shadow-inner border border-amber-200">
                  <div className="bg-gradient-to-br from-amber-100 to-orange-100 rounded-xl p-2 shadow-lg flex justify-center">
                    <Chessboard
                      position={fen}
                      onSquareClick={handleSquareClick}
                      onRightClickSquare={handleRightClickSquare}
                      boardOrientation="white"
                      areArrowsAllowed={true}
                      arePiecesDraggable={true}
                      onPieceDrop={(sourceSquare, targetSquare) => {
                        const success = handleMove(sourceSquare, targetSquare);
                        return success;
                      }}
                      boardWidth={boardSize}
                      customSquareStyles={getCustomSquareStyles()}
                      customArrows={getAllArrows()}
                      onDrawArrow={handleDrawArrow}
                      onClearArrows={handleClearArrows}
                      animationDuration={300}
                      boardTheme={{
                        lightSquare: '#f0d9b5',
                        darkSquare: '#b58863',
                        border: '#8b4513'
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Score and Feedback */}
            <div className="mt-4 w-full flex flex-col items-center">
              <div className="text-base font-semibold text-gray-800">Score: {score}/{totalAttempts}</div>
              {feedback && (
                <div className="mt-3 p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200 text-center text-sm w-full max-w-md">
                  {feedback}
                </div>
              )}
            </div>
            
            {/* Position Info */}
            {currentPosition && (
              <div className="mt-4 p-4 bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-xl border border-gray-200 text-center w-full max-w-md">
                <div className="text-base font-bold text-gray-800">#{currentPosition.id}</div>
                <div className="text-xs text-gray-700 mt-1">{currentPosition.description}</div>
                <div className="text-xs text-gray-600 mt-1">Theme: {currentPosition.theme}</div>
                <div className="text-xs text-gray-600 mt-1">Rating: {currentPosition.rating}</div>
              </div>
            )}
            
            {/* Solution */}
            {showSolution && solution.length > 0 && (
              <div className="mt-4 p-4 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-2xl border border-yellow-200 w-full max-w-md">
                <h3 className="font-bold mb-2 text-sm text-yellow-800">Best Strategic Move:</h3>
                <div className="flex flex-wrap gap-2">
                  {solution.map((move, index) => (
                    <span key={index} className="px-2 py-1 bg-white rounded-lg border border-yellow-300 text-xs shadow-sm">
                      {move}
                    </span>
                  ))}
                </div>
                {currentPosition && currentPosition.explanation && (
                  <div className="mt-3 p-3 bg-white rounded-lg border border-yellow-300 text-xs">
                    <strong>Explanation:</strong> {currentPosition.explanation}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* Controls and Theme Selection */}
        <div className="xl:col-span-1 space-y-4 order-first xl:order-last">
          {/* Theme Selection */}
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-xl border border-gray-200 p-4 sm:p-6">
            <h2 className="text-lg font-bold mb-4 text-gray-800 flex items-center">
              <BookOpen className="w-5 h-5 mr-2 text-green-600" />
              Strategic Themes
            </h2>
            <div className="space-y-2">
              <select
                value={selectedTheme}
                onChange={(e) => setSelectedTheme(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="">All Themes</option>
                {positionalThemes.map(theme => (
                  <option key={theme.id} value={theme.id}>
                    {theme.name || theme.id}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Controls */}
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-xl border border-gray-200 p-4 sm:p-6">
            <h2 className="text-lg font-bold mb-4 text-gray-800 flex items-center">
              <Target className="w-5 h-5 mr-2 text-green-600" />
              Controls
            </h2>
            <div className="grid grid-cols-1 gap-3">
              <button 
                onClick={handleShowSolution}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-2 sm:py-3 px-3 sm:px-4 rounded-xl text-sm shadow-lg transform transition-all duration-200 hover:scale-105 hover:shadow-xl"
              >
                Show Solution
              </button>
              <button 
                onClick={handleNextPosition}
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-2 sm:py-3 px-3 sm:px-4 rounded-xl text-sm shadow-lg transform transition-all duration-200 hover:scale-105 hover:shadow-xl"
              >
                Next Position
              </button>
              <button
                onClick={loadNewPosition}
                className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold py-2 px-4 rounded-xl text-sm shadow-lg transform transition-all duration-200 hover:scale-105"
              >
                New Position
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PositionalPlayTrainerPage;
