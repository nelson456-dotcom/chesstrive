import React, { useEffect, useState, useRef } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const API = 'http://localhost:3001/api/blunder-preventer/random';

const BlunderPreventerPage = () => {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const [data, setData] = useState(null); // {fen,bestMove,blunderMove}
  const [game, setGame] = useState(null);
  const [selected, setSelected] = useState(null); // 'best' | 'blunder'
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(true);
  // Initialize board size based on screen width - default to 300px on mobile
  const getInitialBoardSize = () => {
    if (typeof window !== 'undefined') {
      const isMobile = window.innerWidth < 768;
      if (isMobile) {
        return 300; // Always 300px on mobile
      }
      const isTablet = window.innerWidth >= 768 && window.innerWidth < 1280;
      if (isTablet) {
        return Math.min(window.innerWidth - 128, 500);
      }
      return Math.min(600, window.innerWidth - 200);
    }
    return 300; // Default to 300px
  };
  
  const [boardSize, setBoardSize] = useState(getInitialBoardSize());
  const [userRating, setUserRating] = useState(null);
  const [ratingChange, setRatingChange] = useState(null); // Rating delta for current move
  const [isUpdatingRating, setIsUpdatingRating] = useState(false); // Prevent double-application
  const [toast, setToast] = useState(null); // Toast notification
  const [arrows, setArrows] = useState([]);
  const [highlightedSquares, setHighlightedSquares] = useState([]);
  const [selectedSquare, setSelectedSquare] = useState(null);
  const ratingChangeTimeoutRef = useRef(null);
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

  // Fetch user rating
  useEffect(() => {
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
          const userData = await response.json();
          setUserRating(userData.blunderRating || 1200);
        }
      } catch (err) {
        console.error('Error fetching user rating:', err);
      }
    };

    fetchUserRating();
  }, []);

  // Initialize user rating from AuthContext
  useEffect(() => {
    if (user && user.blunderRating) {
      setUserRating(user.blunderRating);
    }
  }, [user]);

  const loadPuzzle = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = {};
      if (token) {
        headers['x-auth-token'] = token;
      }
      const res = await fetch(API, {
        headers
      });
      if (!res.ok) {
        const errorText = await res.text();
        console.error('Failed to load puzzle:', res.status, errorText);
        throw new Error('No puzzle');
      }
      const json = await res.json();
      setData(json);
      setGame(new Chess(json.fen));
      setSelected(null);
      setFeedback('Choose the correct move');
      setRatingChange(null); // Reset rating change for new puzzle
      setIsUpdatingRating(false); // Reset update flag
      
      // Set arrows for both moves
      if (json.bestMove && json.blunderMove) {
        const tempGame = new Chess(json.fen);
        const arrowsArr = [];
        
        // Add arrow for best move
        try {
          const bestMoveObj = tempGame.move(json.bestMove, { sloppy: true });
          if (bestMoveObj) {
            arrowsArr.push([bestMoveObj.from, bestMoveObj.to, '#22c55e']); // Green for best
          }
          tempGame.undo();
        } catch (e) {
          console.error('Error setting best move arrow:', e);
        }
        
        // Add arrow for blunder move
        try {
          const blunderMoveObj = tempGame.move(json.blunderMove, { sloppy: true });
          if (blunderMoveObj) {
            arrowsArr.push([blunderMoveObj.from, blunderMoveObj.to, '#ef4444']); // Red for blunder
          }
        } catch (e) {
          console.error('Error setting blunder move arrow:', e);
        }
        
        setArrows(arrowsArr);
      }
    } catch (e) {
      setFeedback('Could not load puzzle');
    } finally {
      setLoading(false);
    }
  };

  useEffect(()=>{ loadPuzzle(); },[]);

  // Handle moves played on the board (via drag-and-drop or click)
  const handleMove = (sourceSq, targetSq) => {
    if (!data || selected) return false;
    
    if (!game) return false;
    const move = game.move({ from: sourceSq, to: targetSq, promotion: 'q' });
    if (!move) return false;
    
    // Play sound for the move
    playMoveSound(move);
    
    // Only accept exactly the best move or the blunder move; anything else is invalid
    // Compare both SAN and UCI formats strictly
    const moveUCI = move.from + move.to + (move.promotion ? move.promotion : '');
    const bestIsUCI = data.bestMove && /^[a-h][1-8][a-h][1-8][qrbn]?$/i.test(data.bestMove);
    const blunderIsUCI = data.blunderMove && /^[a-h][1-8][a-h][1-8][qrbn]?$/i.test(data.blunderMove);

    const matchBest = bestIsUCI 
      ? (moveUCI.toLowerCase() === data.bestMove.toLowerCase())
      : (move.san === data.bestMove);

    const matchBlunder = blunderIsUCI 
      ? (moveUCI.toLowerCase() === data.blunderMove.toLowerCase())
      : (move.san === data.blunderMove);

    if (matchBest) {
      // Move has already been made on the game, so pass the move result to handleChoice
      handleChoiceWithMove(data.bestMove, 'best', move);
    } else if (matchBlunder) {
      // Move has already been made on the game, so pass the move result to handleChoice
      handleChoiceWithMove(data.blunderMove, 'blunder', move);
    } else {
      try { game.undo(); } catch(_) {}
      return false;
    }
    
    return true;
  };

  // Helper function for custom square styles
  const getCustomSquareStyles = () => {
    const styles = {};
    if (selectedSquare) {
      styles[selectedSquare] = { 
        backgroundColor: 'rgba(34, 197, 94, 0.6)',
        boxShadow: 'inset 0 0 0 2px rgba(34, 197, 94, 0.8)',
        borderRadius: '4px'
      };
    }
    highlightedSquares.forEach((sq) => {
      styles[sq] = { backgroundColor: 'rgba(255, 0, 0, 0.4)' };
    });
    return styles;
  };

  // Handle responsive board sizing - Set default to 300px on mobile
  useEffect(() => {
    const updateBoardSize = () => {
      const isMobile = window.innerWidth < 768;
      const isTablet = window.innerWidth >= 768 && window.innerWidth < 1280;
      
      if (isMobile) {
        // On mobile, ALWAYS set board to exactly 300px - no exceptions
        setBoardSize(300);
      } else if (isTablet) {
        // On tablet, use medium size
        const tabletSize = Math.min(window.innerWidth - 128, 500);
        setBoardSize(tabletSize);
      } else {
        // On desktop, use the default 600px but ensure it fits
        const desktopSize = Math.min(600, window.innerWidth - 200);
        setBoardSize(desktopSize);
      }
    };
    
    // Set initial size
    updateBoardSize();
    
    // Listen for resize events to maintain 300px on mobile
    window.addEventListener('resize', updateBoardSize);
    
    return () => {
      window.removeEventListener('resize', updateBoardSize);
    };
  }, []);

  // Show toast notification
  const showToast = (message, type = 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (ratingChangeTimeoutRef.current) {
        clearTimeout(ratingChangeTimeoutRef.current);
      }
    };
  }, []);

  // Shared function to update user rating
  const updateRating = async (isCorrect) => {
    try {
      const token = localStorage.getItem('token');
      
      if (token) {
        const startTime = Date.now();
        console.log('Updating blunder rating - isCorrect:', isCorrect, 'token exists:', !!token);
        
        const response = await fetch('http://localhost:3001/api/blunder-preventer/stats', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-auth-token': token
          },
          body: JSON.stringify({
            solved: isCorrect,
            puzzleRating: 1200 // Default rating for blunder puzzles
          })
        });

        const duration = Date.now() - startTime;
        console.log('Blunder rating response status:', response.status, 'duration:', duration);

        if (response.ok) {
          const result = await response.json();
          console.log('Blunder rating update result:', result);
          setUserRating(result.newRating);
          
          // Set rating change with animation trigger
          const change = result.ratingChange || 0;
          console.log('Setting rating change:', change);
          setRatingChange(change);
          
          // Clear previous timeout if exists
          if (ratingChangeTimeoutRef.current) {
            clearTimeout(ratingChangeTimeoutRef.current);
          }
          
          // Refresh user data in auth context to update localStorage
          try {
            await refreshUser();
          } catch (refreshErr) {
            console.error('Error refreshing user:', refreshErr);
          }
        } else {
          const errorText = await response.text();
          console.error('Failed to update blunder rating:', response.status, errorText);
          showToast('Rating update failed, try again', 'error');
          setRatingChange(0); // Show neutral change on error
        }
      } else {
        console.log('No auth token found for blunder rating update');
        setRatingChange(0); // Show neutral change when not authenticated
      }
    } catch (err) {
      console.error('Error updating blunder rating:', err);
      showToast('Rating update failed, try again', 'error');
      setRatingChange(0); // Show neutral change on error
    }
  };

  // Handle choice when move has already been made on the board (drag-and-drop)
  const handleChoiceWithMove = async (move, type, moveResult) => {
    if(!game || selected || isUpdatingRating) return;
    
    setIsUpdatingRating(true);
    let isCorrect = false;
    
    try {
      // Move has already been made, so use the current game state
      const tmp = new Chess(game.fen());
      
      // Determine if move is the best or blunder (handle SAN or UCI)
      const bestIsUCI = data.bestMove && /^[a-h][1-8][a-h][1-8][qrbn]?$/i.test(data.bestMove);
      const blunderIsUCI = data.blunderMove && /^[a-h][1-8][a-h][1-8][qrbn]?$/i.test(data.blunderMove);

      // Determine correctness based on the type of move selected
      const moveUCI = moveResult.from + moveResult.to + (moveResult.promotion || '');
      
      // Check if the selected move matches the best move
      const matchesBest = bestIsUCI
        ? (moveUCI.toLowerCase() === data.bestMove.toLowerCase())
        : (moveResult.san === data.bestMove);
      
      // Check if the selected move matches the blunder move
      const matchesBlunder = blunderIsUCI
        ? (moveUCI.toLowerCase() === data.blunderMove.toLowerCase())
        : (moveResult.san === data.blunderMove);
      
      // Determine if the choice was correct based on the type selected
      if (type === 'best') {
        isCorrect = matchesBest;
      } else if (type === 'blunder') {
        isCorrect = false; // Selecting blunder is always wrong
      } else {
        isCorrect = false; // Unknown type
      }
      
      console.log('🎯 Move validation (drag-and-drop):', {
        type,
        moveUCI,
        moveSAN: moveResult.san,
        bestMove: data.bestMove,
        blunderMove: data.blunderMove,
        matchesBest,
        matchesBlunder,
        isCorrect
      });
      
      setGame(tmp);
      setSelected(type);
      
      if(isCorrect) setFeedback('Correct!');
      else setFeedback('Blunder – that move loses.');
    } catch (error) {
      console.error('Error validating move:', error);
      setFeedback('Invalid move for this position.');
      setIsUpdatingRating(false);
      return;
    }

    // Update user rating
    await updateRating(isCorrect);
    setIsUpdatingRating(false);
  };

  const handleChoice = async (move, type) => {
    if(!game || selected || isUpdatingRating) return; // Prevent double-application
    
    setIsUpdatingRating(true);
    let isCorrect = false;
    
    // Validate move before trying to play it
    try {
      const tmp = new Chess(game.fen());
      let moveResult;

      // Determine if move is the best or blunder (handle SAN or UCI)
      const bestIsUCI = data.bestMove && /^[a-h][1-8][a-h][1-8][qrbn]?$/i.test(data.bestMove);
      const blunderIsUCI = data.blunderMove && /^[a-h][1-8][a-h][1-8][qrbn]?$/i.test(data.blunderMove);

      const playCandidate = (cand) => {
        if (!cand) return null;
        if (/^[a-h][1-8][a-h][1-8][qrbn]?$/i.test(cand)) {
          const from = cand.substring(0, 2);
          const to = cand.substring(2, 4);
          const promo = cand[4] || 'q';
          return tmp.move({ from, to, promotion: promo });
        }
        return tmp.move(cand, { sloppy: true });
      };

      // Try playing the selected move to ensure it is legal in this position
      moveResult = playCandidate(move);
      if (!moveResult) {
        setFeedback('Invalid move for this position.');
        setIsUpdatingRating(false);
        return;
      }

      // Determine correctness based on the type of move selected
      const moveUCI = moveResult.from + moveResult.to + (moveResult.promotion || '');
      
      // Check if the selected move matches the best move
      const matchesBest = bestIsUCI
        ? (moveUCI.toLowerCase() === data.bestMove.toLowerCase())
        : (moveResult.san === data.bestMove);
      
      // Check if the selected move matches the blunder move
      const matchesBlunder = blunderIsUCI
        ? (moveUCI.toLowerCase() === data.blunderMove.toLowerCase())
        : (moveResult.san === data.blunderMove);
      
      // Determine if the choice was correct based on the type selected
      if (type === 'best') {
        isCorrect = matchesBest;
      } else if (type === 'blunder') {
        isCorrect = false; // Selecting blunder is always wrong
      } else {
        isCorrect = false; // Unknown type
      }
      
      console.log('🎯 Move validation:', {
        type,
        moveUCI,
        moveSAN: moveResult.san,
        bestMove: data.bestMove,
        blunderMove: data.blunderMove,
        matchesBest,
        matchesBlunder,
        isCorrect
      });
      
      setGame(new Chess(tmp.fen()));
      setSelected(type);
      
      if(isCorrect) setFeedback('Correct!');
      else setFeedback('Blunder – that move loses.');
    } catch (error) {
      console.error('Error validating move:', error);
      setFeedback('Invalid move for this position.');
      setIsUpdatingRating(false);
      return;
    }

    // Update user rating
    await updateRating(isCorrect);
    setIsUpdatingRating(false);
  };

  if(loading) return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-lg text-gray-600">Loading blunder preventer puzzle...</p>
      </div>
    </div>
  );
  
  if(!data) return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <div className="text-center">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 max-w-md mx-auto">
          <p className="text-red-600 text-lg">No puzzle available</p>
        </div>
      </div>
    </div>
  );

  // Format moves correctly for display
  const formatMove = (move) => {
    if (!move) return '';
    // Ensure proper capitalization for piece moves
    if (move.length >= 2) {
      const firstChar = move[0].toUpperCase();
      const rest = move.slice(1);
      return firstChar + rest;
    }
    return move;
  };

  // Get rating change display component
  const getRatingChangeDisplay = (change, isSelected = false) => {
    if (change === null || change === undefined) return null;
    
    const isPositive = change > 0;
    const isNegative = change < 0;
    const isNeutral = change === 0;
    
    const bgColor = isPositive 
      ? 'bg-green-100 text-green-800 border-green-300' 
      : isNegative 
      ? 'bg-red-100 text-red-800 border-red-300'
      : 'bg-gray-100 text-gray-800 border-gray-300';
    
    const sign = isPositive ? '+' : '';
    const displayText = `${sign}${change}`;
    
    return (
      <span 
        className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold border ${bgColor} ${
          isSelected ? 'animate-pulse' : ''
        } transition-all duration-200`}
        style={{
          animation: isSelected ? 'fadeInScale 0.2s ease-out' : undefined
        }}
      >
        Δ {displayText}
      </span>
    );
  };

  const buttons = [
    {label: formatMove(data.bestMove), type: 'best', originalMove: data.bestMove},
    {label: formatMove(data.blunderMove), type: 'blunder', originalMove: data.blunderMove}
  ].sort(()=>Math.random()-0.5);

  return (
    <div className="min-h-screen overflow-y-auto">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg ${
          toast.type === 'error' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'
        } animate-fade-in`}>
          {toast.message}
        </div>
      )}
      
      <div className="text-center mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent">
          Blunder Preventer
        </h1>
        <p className="text-gray-600 mb-4">Choose the correct move and avoid blunders</p>
        
        {/* User Rating Display with Rating Change Badge */}
        {userRating && (
          <div className="inline-flex items-center gap-4">
            <div className="inline-flex items-center bg-gradient-to-r from-amber-50 to-amber-100 px-6 py-3 rounded-xl border border-amber-200 shadow-lg">
              <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center mr-3">
                <span className="text-white text-sm font-bold">⚠</span>
              </div>
              <div className="text-left">
                <p className="text-sm text-amber-700 font-medium">Your Rating</p>
                <p className="text-2xl font-bold text-amber-800">{userRating}</p>
              </div>
            </div>
            
            {/* Rating Change Badge */}
            {ratingChange !== null && (
              <div className="inline-flex items-center">
                {getRatingChangeDisplay(ratingChange, true)}
              </div>
            )}
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-1 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
        {/* Main Content */}
        <div className="xl:col-span-3 2xl:col-span-4">
          <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl shadow-2xl border border-gray-200 p-4 sm:p-6 lg:p-8">
            <div className="flex flex-col items-center">
              <div className="mb-6 w-full flex items-center justify-between px-6 py-3 rounded-xl font-bold text-base sm:text-lg shadow-lg transform transition-all duration-300 text-white bg-gradient-to-r from-blue-600 to-blue-700 shadow-blue-500/50">
                <span>Choose the correct move</span>
                {/* Rating Change Badge in Header */}
                {ratingChange !== null && (
                  <div className="flex items-center">
                    {getRatingChangeDisplay(ratingChange, true)}
                  </div>
                )}
              </div>
              
              {/* Board Size Control - Mobile Only */}
              <div className="block sm:hidden w-full mb-4 px-4">
                <div className="bg-white rounded-lg p-4 shadow-md border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-semibold text-gray-700">Board Size</label>
                    <span className="text-sm font-bold text-blue-600">{boardSize}px</span>
                  </div>
                  <input
                    type="range"
                    min="250"
                    max="400"
                    value={boardSize}
                    onChange={(e) => setBoardSize(Number(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((boardSize - 250) / (400 - 250)) * 100}%, #e5e7eb ${((boardSize - 250) / (400 - 250)) * 100}%, #e5e7eb 100%)`
                    }}
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>250px</span>
                    <span>400px</span>
                  </div>
                </div>
              </div>

              {/* Board container with proper mobile touch handling */}
              <div 
                className="relative w-full" 
                style={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center',
                  // CRITICAL: Use 'none' instead of 'pan-y' to allow piece dragging
                  touchAction: 'none',
                  WebkitUserSelect: 'none',
                  userSelect: 'none',
                  pointerEvents: 'auto'
                }}
              >
                <div 
                  className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg sm:rounded-2xl p-1 sm:p-4 shadow-inner border border-amber-200" 
                  style={{ 
                    width: 'fit-content',
                    margin: '0 auto',
                    touchAction: 'none',
                    WebkitUserSelect: 'none',
                    userSelect: 'none'
                  }}
                >
                  <div 
                    className="bg-gradient-to-br from-amber-100 to-orange-100 rounded-md sm:rounded-xl p-0.5 sm:p-2 shadow-lg" 
                    style={{ 
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      touchAction: 'none',
                      WebkitUserSelect: 'none',
                      userSelect: 'none'
                    }}
                  >
                    <div 
                      style={{ 
                        width: boardSize, 
                        height: boardSize,
                        WebkitUserSelect: 'none',
                        MozUserSelect: 'none',
                        msUserSelect: 'none',
                        userSelect: 'none',
                        touchAction: 'none',
                        pointerEvents: 'auto',
                        position: 'relative',
                        zIndex: 10
                      }}
                    >
                      {game && (
                        <Chessboard 
                          key={`board-${data?.fen || 'loading'}-${boardSize}`}
                          position={game.fen()} 
                          onPieceDrop={handleMove}
                        onSquareClick={(square) => {
                          if (!game || selected) return;
                          if (selectedSquare) {
                            // If a square is already selected, try to make a move
                            const success = handleMove(selectedSquare, square);
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
                        customArrows={arrows}
                        customSquareStyles={getCustomSquareStyles()}
                        boardWidth={boardSize}
                        arePiecesDraggable={true}
                        areArrowsAllowed={true}
                        customBoardStyle={{
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                          // CRITICAL mobile touch optimizations for drag-and-drop
                          touchAction: 'none', // Disable all browser gestures to allow proper piece dragging
                          pointerEvents: 'auto', // Ensure touch events are captured
                          userSelect: 'none', // Prevent text selection on mobile
                          WebkitUserSelect: 'none',
                          MozUserSelect: 'none',
                          msUserSelect: 'none',
                          WebkitTouchCallout: 'none', // Disable iOS callout menu
                          WebkitTapHighlightColor: 'transparent', // Remove tap highlight on iOS
                          WebkitUserDrag: 'none', // Prevent drag ghosts
                          cursor: 'grab', // Show grab cursor
                          // Performance optimizations for smooth dragging
                          position: 'relative',
                          zIndex: 10, // Ensure board is above other elements
                          transform: 'translateZ(0)', // Hardware acceleration
                          backfaceVisibility: 'hidden',
                          willChange: 'transform'
                        }}
                        customDropSquareStyle={{
                          boxShadow: 'inset 0 0 1px 4px rgba(34, 197, 94, 0.8)'
                        }}
                        boardTheme={{
                          lightSquare: '#f0d9b5',
                          darkSquare: '#b58863',
                          border: '#8b4513'
                        }}
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="w-full max-w-md space-y-4">
                <div className="grid grid-cols-1 gap-3">
                  {buttons.map(b=> {
                    const isSelectedButton = selected && (
                      (b.type === 'best' && selected === 'best') || 
                      (b.type === 'blunder' && selected === 'blunder')
                    );
                    const showRatingChange = selected && ratingChange !== null && isSelectedButton;
                    
                    return (
                      <button 
                        key={b.label} 
                        disabled={!!selected || isUpdatingRating}
                        className={`px-6 py-4 rounded-xl text-white font-semibold text-lg shadow-lg transform transition-all duration-200 flex items-center justify-between ${
                          selected 
                            ? (b.type === 'best' && selected === 'best'
                                ? 'bg-gradient-to-r from-green-500 to-green-600 cursor-default' 
                                : b.type === 'blunder' && selected === 'blunder'
                                ? 'bg-gradient-to-r from-red-500 to-red-600 cursor-default'
                                : 'bg-gradient-to-r from-gray-400 to-gray-500 cursor-default')
                            : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 hover:scale-105 hover:shadow-xl'
                        } ${selected ? 'opacity-75' : ''} ${isUpdatingRating ? 'opacity-50 cursor-wait' : ''}`}
                        onClick={()=>handleChoice(b.originalMove,b.type)}
                      >
                        <span>{b.label}</span>
                        {showRatingChange && (
                          <span className="ml-2">
                            {getRatingChangeDisplay(ratingChange, true)}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
                
                {feedback && (
                  <div className={`p-4 rounded-xl text-center font-bold text-lg shadow-lg ${
                    feedback.includes('Correct') 
                      ? 'bg-gradient-to-r from-green-500 to-green-600 text-white' 
                      : 'bg-gradient-to-r from-red-500 to-red-600 text-white'
                  }`}>
                    {feedback}
                  </div>
                )}
                
                {selected && (
                  <div className="space-y-3">
                    <button 
                      className="w-full bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white font-semibold py-3 px-4 rounded-xl text-lg shadow-lg transform transition-all duration-200 hover:scale-105 hover:shadow-xl"
                      onClick={loadPuzzle}
                    >
                      Next Puzzle
                    </button>
                    
                    <button 
                      className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 px-4 rounded-xl text-lg shadow-lg transform transition-all duration-200 hover:scale-105 hover:shadow-xl"
                      onClick={() => {
                        // Navigate to live analysis with the current position
                        const encodedFen = encodeURIComponent(data.fen);
                        navigate(`/live-analysis?fen=${encodedFen}`);
                      }}
                    >
                      🔍 Analyze in Live Analysis
                    </button>
                  </div>
                )}
              </div>
              
              {/* Spacer to provide scroll start area on small screens */}
              <div className="block sm:hidden" style={{ height: 80 }}></div>
            </div>
          </div>
        </div>
        
        {/* Side Panel */}
        <div className="xl:col-span-1 2xl:col-span-1 space-y-4 order-first xl:order-last">
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-xl border border-gray-200 p-4 sm:p-6">
            <h2 className="text-lg font-bold mb-4 text-gray-800 flex items-center">
              <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
              Instructions
            </h2>
            <div className="space-y-3 text-sm text-gray-700">
              <p>1. Study the position carefully</p>
              <p>2. Choose between two moves or drag a piece to make your move</p>
              <p>3. One is correct, one is a blunder</p>
              <p>4. Learn to avoid tactical mistakes</p>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-xl border border-gray-200 p-4 sm:p-6">
            <h2 className="text-lg font-bold mb-4 text-gray-800 flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
              Controls
            </h2>
            <div className="grid grid-cols-1 gap-3">
              <button 
                className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white font-semibold py-2 sm:py-3 px-3 sm:px-4 rounded-xl text-sm shadow-lg transform transition-all duration-200 hover:scale-105 hover:shadow-xl"
                onClick={()=>navigate(-1)}
              >
                Back
              </button>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};

export default BlunderPreventerPage; 
