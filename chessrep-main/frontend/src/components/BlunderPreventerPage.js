import React, { useEffect, useRef, useState } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { updateDailyProgress, MODULE_NAMES } from '../utils/dailyProgress';
import { getApiUrl } from '../config/api';

const TOUCH_BOARD_STYLE = {
  touchAction: 'none',
  WebkitUserSelect: 'none',
  userSelect: 'none',
  WebkitTouchCallout: 'none',
  WebkitTapHighlightColor: 'transparent'
};

const BlunderPreventerPage = () => {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const [data, setData] = useState(null); // {fen,bestMove,blunderMove}
  const [game, setGame] = useState(null);
  const [selected, setSelected] = useState(null); // 'best' | 'blunder'
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(true);
  const [boardSize, setBoardSize] = useState(600);
  const boardContainerRef = useRef(null);
  const [userRating, setUserRating] = useState(null);
  const [ratingChange, setRatingChange] = useState(null); // Rating delta for current move
  const [isUpdatingRating, setIsUpdatingRating] = useState(false); // Prevent double-application
  const [toast, setToast] = useState(null); // Toast notification
  const [arrows, setArrows] = useState([]);
  const [highlightedSquares, setHighlightedSquares] = useState([]);
  const [selectedSquare, setSelectedSquare] = useState(null);

  // Audio refs for sound effects
  const moveSoundRef = useRef(null);
  const captureSoundRef = useRef(null);
  const castleSoundRef = useRef(null);

  // Fetch user rating
  useEffect(() => {
    const fetchUserRating = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const response = await fetch(getApiUrl('/auth/me'), {
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

  // Load sounds once on component mount
  useEffect(() => {
    // Create audio elements with error handling
    try {
      moveSoundRef.current = new Audio('/sounds/move-self.mp3');
      moveSoundRef.current.load();
      console.log('🔊 Move sound loaded');
    } catch (error) {
      console.warn('Could not load move sound:', error);
      moveSoundRef.current = null;
    }
    
    try {
      captureSoundRef.current = new Audio('/sounds/capture.mp3');
      captureSoundRef.current.load();
      console.log('🔊 Capture sound loaded');
    } catch (error) {
      console.warn('Could not load capture sound:', error);
      captureSoundRef.current = null;
    }
    
    try {
      castleSoundRef.current = new Audio('/sounds/castle.mp3');
      castleSoundRef.current.load();
      console.log('🔊 Castle sound loaded');
    } catch (error) {
      console.warn('Could not load castle sound:', error);
      castleSoundRef.current = null;
    }
  }, []);

  const playMoveSound = (moveObj) => {
    if (!moveObj) {
      console.warn('🔇 playMoveSound: No move object provided');
      return;
    }
    if (!moveSoundRef.current) {
      console.warn('🔇 playMoveSound: moveSoundRef.current is null');
      return;
    }
    console.log('🔊 Attempting to play sound for move:', moveObj.san, 'flags:', moveObj.flags);
    try {
      if (moveObj.flags && moveObj.flags.includes('c')) {
        console.log('🔊 Playing capture sound');
        captureSoundRef.current?.play().catch(e => console.warn('Could not play capture sound:', e));
      } else if (moveObj.san === 'O-O' || moveObj.san === 'O-O-O') {
        console.log('🔊 Playing castle sound');
        castleSoundRef.current?.play().catch(e => console.warn('Could not play castle sound:', e));
      } else {
        console.log('🔊 Playing move sound');
        moveSoundRef.current?.play().catch(e => console.warn('Could not play move sound:', e));
      }
    } catch (error) {
      console.warn('Error playing move sound:', error);
    }
  };

  const loadPuzzle = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = {};
      if (token) {
        headers['x-auth-token'] = token;
      }
      const res = await fetch(getApiUrl('/blunder-preventer/random'), {
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

  // Update user rating
  const updateRating = async (isCorrect) => {
    try {
      const token = localStorage.getItem('token');
      
      if (token) {
        console.log('Updating blunder rating - isCorrect:', isCorrect, 'token exists:', !!token);
        
        const response = await fetch(getApiUrl('/blunder-preventer/stats'), {
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

        console.log('Blunder rating response status:', response.status);

        if (response.ok) {
          const result = await response.json();
          console.log('Blunder rating update result:', result);
          setUserRating(result.newRating);
          
          // Update feedback to show rating change
          const change = result.ratingChange;
          const changeText = change > 0 ? `+${change}` : `${change}`;
          if(isCorrect) setFeedback(`✅ Correct! Rating: ${result.newRating} (${changeText})`);
          else setFeedback(`❌ Wrong! Rating: ${result.newRating} (${changeText})`);
          
          // Refresh user data in auth context to update localStorage
          const refreshedUser = await refreshUser();
        } else {
          const errorText = await response.text();
          console.error('Failed to update blunder rating:', response.status, errorText);
        }
      } else {
        console.log('No auth token found for blunder rating update');
      }
    } catch (err) {
      console.error('Error updating blunder rating:', err);
    }
  };

  // Handle moves played on the board
  const handleMove = (sourceSq, targetSq) => {
    if (!data || selected) return false;
    
    if (!game) return false;
    const move = game.move({ from: sourceSq, to: targetSq, promotion: 'q' });
    if (!move) return false;
    
    playMoveSound(move);
    
    console.log('🎯 Move played:', {
      from: sourceSq,
      to: targetSq,
      san: move.san,
      uci: move.from + move.to + (move.promotion || ''),
      bestMove: data.bestMove,
      blunderMove: data.blunderMove
    });
    
    // Check if the move matches either the best move or blunder move
    const moveSAN = move.san;
    const bestMoveSAN = data.bestMove;
    const blunderMoveSAN = data.blunderMove;
    
    // Also check UCI format in case the API returns UCI
    const moveUCI = move.from + move.to + (move.promotion || '');
    const bestMoveUCI = data.bestMove && /^[a-h][1-8][a-h][1-8][qrbn]?$/i.test(data.bestMove) ? data.bestMove : null;
    const blunderMoveUCI = data.blunderMove && /^[a-h][1-8][a-h][1-8][qrbn]?$/i.test(data.blunderMove) ? data.blunderMove : null;
    
    // Check for SAN matches first (most common)
    const matchBestSAN = moveSAN === bestMoveSAN;
    const matchBlunderSAN = moveSAN === blunderMoveSAN;
    
    // Check for UCI matches if SAN doesn't match
    const matchBestUCI = bestMoveUCI && moveUCI.toLowerCase() === bestMoveUCI.toLowerCase();
    const matchBlunderUCI = blunderMoveUCI && moveUCI.toLowerCase() === blunderMoveUCI.toLowerCase();
    
    const matchBest = matchBestSAN || matchBestUCI;
    const matchBlunder = matchBlunderSAN || matchBlunderUCI;
    
    console.log('🎯 Move validation:', {
      matchBestSAN,
      matchBlunderSAN,
      matchBestUCI,
      matchBlunderUCI,
      matchBest,
      matchBlunder
    });

    if (matchBest) {
      // Correct move - it's the best move
      setSelected('best');
      setFeedback('✅ Correct! This is the best move.');
      // Update rating
      updateRating(true);
    } else if (matchBlunder) {
      // Wrong move - it's the blunder
      setSelected('blunder');
      setFeedback('❌ Wrong! This is a blunder. Try to find the best move.');
      // Update rating
      updateRating(false);
    } else {
      // Legal move but not one of the two options
      setFeedback(`You played ${moveSAN}. This is a legal move, but try to find either the best move or the blunder move shown below.`);
      // Undo the move so they can try again
      try { game.undo(); } catch(_) {}
      return false;
    }
    
    return true;
  };

  // Helper function for custom square styles
  const getCustomSquareStyles = () => {
    // Return empty styles to remove all square highlighting
    return {};
  };

  // Show toast notification
  const showToast = (message, type = 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Handle responsive board sizing based on container width
  useEffect(() => {
    const measureAndUpdate = () => {
      if (!boardContainerRef.current) return;
      
      const containerWidth = boardContainerRef.current.offsetWidth || 0;
      const windowWidth = window.innerWidth;
      
      if (!containerWidth) return;
      
      const isMobile = windowWidth < 768;
      const isTablet = windowWidth >= 768 && windowWidth < 1024;
      const isDesktop = windowWidth >= 1024 && windowWidth < 1440;
      const isLargeDesktop = windowWidth >= 1440;
      
      // Account for padding and add a modest right-edge safety margin
      const paddingAllowance = 56; // ~p-4 outer + p-2 inner + small margin
      const availableWidth = Math.max(0, containerWidth - paddingAllowance);
      
      if (isMobile) {
        // Mobile: fit container, cap reasonable max
        const mobileSize = Math.min(Math.floor(availableWidth * 0.98), 400);
        setBoardSize(Math.max(300, mobileSize));
      } else if (isTablet) {
        // Tablet: slightly larger but within container
        const tabletSize = Math.min(Math.floor(availableWidth * 0.98), 560);
        setBoardSize(Math.max(480, tabletSize));
      } else if (isLargeDesktop) {
        // Large desktop: keep sane bounds
        const maxSize = Math.min(Math.floor(availableWidth * 0.98), 700);
        setBoardSize(Math.max(560, maxSize));
      } else {
        // Standard desktop: moderate cap
        const maxSize = Math.min(Math.floor(availableWidth * 0.98), 640);
        setBoardSize(Math.max(520, maxSize));
      }
    };

    // Initial measurement
    measureAndUpdate();
    // Second pass to mimic slider fix after layout
    setTimeout(measureAndUpdate, 0);
    setTimeout(measureAndUpdate, 200);
    
    // Use ResizeObserver to watch container size changes
    let observer;
    if (typeof ResizeObserver !== 'undefined' && boardContainerRef.current) {
      observer = new ResizeObserver(measureAndUpdate);
      observer.observe(boardContainerRef.current);
    }
    
    // Also listen to window resize
    window.addEventListener('resize', measureAndUpdate);
    
    return () => {
      window.removeEventListener('resize', measureAndUpdate);
      if (observer) {
        observer.disconnect();
      }
    };
  }, []);

  const handleChoice = async (move, type) => {
    if(!game || selected || isUpdatingRating) return; // Prevent double-application
    
    setIsUpdatingRating(true);
    let isCorrect = false;
    
    // Validate move before trying to play it
    try {
      const tmp = new Chess(game.fen());
      let moveResult;

      console.log('🎯 Handling choice:', {
        move,
        type,
        bestMove: data.bestMove,
        blunderMove: data.blunderMove,
        currentFen: game.fen()
      });

      // Determine if move is UCI or SAN format
      const isUCI = /^[a-h][1-8][a-h][1-8][qrbn]?$/i.test(move);
      
      const playCandidate = (cand) => {
        if (!cand) return null;
        if (/^[a-h][1-8][a-h][1-8][qrbn]?$/i.test(cand)) {
          // UCI format: e2e4, e7e5, etc.
          const from = cand.substring(0, 2);
          const to = cand.substring(2, 4);
          const promo = cand[4] || undefined;
          return tmp.move({ from, to, promotion: promo });
        } else {
          // SAN format: e4, Nf3, Bxf7+, etc.
          return tmp.move(cand, { sloppy: true });
        }
      };

      // Try playing the selected move to ensure it is legal in this position
      moveResult = playCandidate(move);
      if (!moveResult) {
        console.log('❌ Invalid move:', move);
        setFeedback('Invalid move for this position.');
        return;
      }

      playMoveSound(moveResult);

      console.log('✅ Move played successfully:', {
        san: moveResult.san,
        uci: moveResult.from + moveResult.to + (moveResult.promotion || ''),
        from: moveResult.from,
        to: moveResult.to
      });

      // Determine correctness based on the type of move selected
      const moveUCI = moveResult.from + moveResult.to + (moveResult.promotion || '');
      const moveSAN = moveResult.san;
      
      // Check if the selected move matches the best move (both SAN and UCI)
      const bestIsUCI = data.bestMove && /^[a-h][1-8][a-h][1-8][qrbn]?$/i.test(data.bestMove);
      const blunderIsUCI = data.blunderMove && /^[a-h][1-8][a-h][1-8][qrbn]?$/i.test(data.blunderMove);
      
      const matchesBest = bestIsUCI
        ? (moveUCI.toLowerCase() === data.bestMove.toLowerCase())
        : (moveSAN === data.bestMove);
      
      // Check if the selected move matches the blunder move (both SAN and UCI)
      const matchesBlunder = blunderIsUCI
        ? (moveUCI.toLowerCase() === data.blunderMove.toLowerCase())
        : (moveSAN === data.blunderMove);
      
      // Determine if the choice was correct based on the type selected
      if (type === 'best') {
        isCorrect = matchesBest;
      } else if (type === 'blunder') {
        isCorrect = false; // Selecting blunder is always wrong
      } else {
        isCorrect = false; // Unknown type
      }
      
      // Update daily progress if correct
      if (isCorrect) {
        updateDailyProgress(MODULE_NAMES.BLUNDER_PREVENTER);
      }
      
      console.log('🎯 Final validation:', {
        type,
        moveUCI,
        moveSAN,
        bestMove: data.bestMove,
        blunderMove: data.blunderMove,
        bestIsUCI,
        blunderIsUCI,
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
    try {
      const token = localStorage.getItem('token');
      
      if (token) {
        const startTime = Date.now();
        console.log('Updating blunder rating - isCorrect:', isCorrect, 'token exists:', !!token);
        
        const response = await fetch(getApiUrl('/blunder-preventer/stats'), {
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
    } finally {
      setIsUpdatingRating(false);
    }
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

  // Format moves correctly for display - convert UCI to algebraic notation
  const formatMove = (move) => {
    if (!move) return '';
    
    // If it's already in algebraic notation (contains letters like N, B, R, Q, K), return as is
    if (/^[NBRQK]/.test(move)) {
      return move;
    }
    
    // If it's UCI notation (like f3f4), convert to algebraic
    if (/^[a-h][1-8][a-h][1-8][qrbn]?$/i.test(move)) {
      try {
        // Create a temporary game to convert UCI to SAN
        const tempGame = new Chess(data.fen);
        const moveObj = tempGame.move({
          from: move.substring(0, 2),
          to: move.substring(2, 4),
          promotion: move.length > 4 ? move[4] : undefined
        });
        
        if (moveObj && moveObj.san) {
          return moveObj.san;
        }
      } catch (error) {
        console.error('Error converting UCI to SAN:', error);
      }
    }
    
    // Fallback: return the move as is
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
        <h1 className="text-2xl sm:text-3xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
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
      
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Main Content */}
        <div className="xl:col-span-3">
          <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl shadow-2xl border border-gray-200 p-6 sm:p-8">
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
              
              <div className="relative w-full mb-6">
                <div className="w-full bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-4 shadow-inner border border-amber-200" style={{ overflow: 'visible' }}>
                  <div className="bg-gradient-to-br from-amber-100 to-orange-100 rounded-xl p-2 shadow-lg" style={{ overflow: 'visible' }}>
                    <div className="flex justify-center" ref={boardContainerRef} style={{ overflow: 'visible' }}>
                      <div
                        style={{
                          width: `${boardSize}px`,
                          maxWidth: '100%',
                          ...TOUCH_BOARD_STYLE
                        }}
                      >
                        <Chessboard 
                      position={game.fen()} 
                      onPieceDrop={handleMove}
                      onSquareClick={(square) => {
                        if (selected) return; // Don't allow moves after selection
                        
                        if (selectedSquare) {
                          // If a square is already selected, try to make a move
                          const success = handleMove(selectedSquare, square);
                          if (success) {
                            setSelectedSquare(null);
                          } else {
                            // Invalid move, select the new square if it has a piece of the correct color
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
                        ...TOUCH_BOARD_STYLE,
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                        WebkitTouchCallout: 'none',
                        WebkitTapHighlightColor: 'transparent',
                        cursor: 'pointer'
                      }}
                      customLightSquareStyle={{
                        backgroundColor: '#f0d9b5'
                      }}
                      customDarkSquareStyle={{
                        backgroundColor: '#b58863'
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
        
        {/* Side Panel */}
        <div className="xl:col-span-1 space-y-4 order-first xl:order-last">
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-xl border border-gray-200 p-4 sm:p-6">
            <h2 className="text-lg font-bold mb-4 text-gray-800 flex items-center">
              <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
              Instructions
            </h2>
            <div className="space-y-3 text-sm text-gray-700">
              <p>1. Study the position carefully</p>
              <p>2. Choose between two moves</p>
              <p>3. One is correct, one is a blunder</p>
              <p>4. Learn to avoid tactical mistakes</p>
            </div>
          </div>
          
          {/* Move Options */}
          {!selected && data && (
            <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-xl border border-gray-200 p-4 sm:p-6">
              <h2 className="text-lg font-bold mb-4 text-gray-800 flex items-center">
                <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                Move Options
              </h2>
              <div className="grid grid-cols-1 gap-3">
                {buttons.map((btn, idx) => {
                  const isSelectedButton = selected && (
                    (btn.type === 'best' && selected === 'best') || 
                    (btn.type === 'blunder' && selected === 'blunder')
                  );
                  const showRatingChange = selected && ratingChange !== null && isSelectedButton;
                  
                  return (
                    <button
                      key={idx}
                      onClick={() => handleChoice(btn.originalMove, btn.type)}
                      disabled={selected !== null || isUpdatingRating}
                      className={`
                        ${selected 
                          ? (btn.type === 'best' && selected === 'best'
                              ? 'bg-gradient-to-r from-green-500 to-green-600' 
                              : btn.type === 'blunder' && selected === 'blunder'
                              ? 'bg-gradient-to-r from-red-500 to-red-600'
                              : 'bg-gradient-to-r from-gray-400 to-gray-500')
                          : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800'
                        }
                        text-white font-bold py-3 px-4 rounded-xl text-base shadow-lg
                        transform transition-all duration-200 hover:scale-105 hover:shadow-xl
                        disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
                        flex items-center justify-between
                        ${isUpdatingRating ? 'opacity-50 cursor-wait' : ''}
                      `}
                    >
                      <span className="flex-1 text-left">{btn.label}</span>
                      {showRatingChange && ratingChange !== null && (
                        <span className="ml-3 flex-shrink-0">
                          {getRatingChangeDisplay(ratingChange, true)}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-xl border border-gray-200 p-4 sm:p-6">
            <h2 className="text-lg font-bold mb-4 text-gray-800 flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
              Controls
            </h2>
            <div className="grid grid-cols-1 gap-3">
              {selected && data && (
                <button 
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-2 sm:py-3 px-3 sm:px-4 rounded-xl text-sm shadow-lg transform transition-all duration-200 hover:scale-105 hover:shadow-xl flex items-center justify-center"
                  onClick={() => {
                    const fen = data.fen;
                    const label = 'Blunder Preventer';
                    navigate(`/analysis?fen=${encodeURIComponent(fen)}&label=${encodeURIComponent(label)}`);
                  }}
                >
                  <span className="mr-2">🔍</span>
                  Open in Analysis
                </button>
              )}
              <button 
                className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold py-2 sm:py-3 px-3 sm:px-4 rounded-xl text-sm shadow-lg transform transition-all duration-200 hover:scale-105 hover:shadow-xl"
                onClick={loadPuzzle}
              >
                Next Puzzle
              </button>
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
  );
};

export default BlunderPreventerPage; 
