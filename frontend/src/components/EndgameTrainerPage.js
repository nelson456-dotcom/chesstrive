import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import { useAuth } from '../contexts/AuthContext';
import { Trophy, Target, Clock, RotateCcw, Eye } from 'lucide-react';
import OpenInLiveAnalysisButton from './OpenInLiveAnalysisButton';

// Arrow drawing functionality removed

const EndgameTrainerPage = () => {
  const { user, refreshUser } = useAuth();
  const [selectedTheme, setSelectedTheme] = useState('pawn-endgames');
  const [currentPuzzle, setCurrentPuzzle] = useState(null);
  const [game, setGame] = useState(null);
  const [fen, setFen] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [showSolution, setShowSolution] = useState(false);
  const [puzzleComplete, setPuzzleComplete] = useState(false);
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [score, setScore] = useState(0);
  const [moveIndex, setMoveIndex] = useState(0);
  const [drawnArrows, setDrawnArrows] = useState([]);
  const [endgameThemes, setEndgameThemes] = useState([]);
  const [themesLoading, setThemesLoading] = useState(true);
  const [solutionPosition, setSolutionPosition] = useState(null);
  const [solutionStep, setSolutionStep] = useState(0);
  const [boardSize, setBoardSize] = useState(600); // EXACT COPY from PuzzleSolvePage
  const [boardOrientation, setBoardOrientation] = useState('white');
  const [playerColor, setPlayerColor] = useState('white');
  const orientationLockedRef = useRef('white');

  // Audio refs for sound effects
  const moveSoundRef = useRef(null);
  const captureSoundRef = useRef(null);
  const castleSoundRef = useRef(null);

  // Handle responsive board sizing - EXACT COPY from PuzzleSolvePage
  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth < 768;
      const isTablet = window.innerWidth >= 768 && window.innerWidth < 1280;
      
      if (isMobile) {
        // On mobile, make board smaller to ensure it fits with all padding
        const mobileSize = Math.min(window.innerWidth - 80, 320);
        setBoardSize(mobileSize);
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

    handleResize(); // Set initial size
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    setBoardOrientation(playerColor);
  }, [playerColor]);

  // Load sounds once on component mount
  useEffect(() => {
    console.log('🔊 SOUND LOADING: Starting to load sounds...');
    // Create audio elements with error handling
    try {
      moveSoundRef.current = new Audio('/sounds/move-self.mp3');
      moveSoundRef.current.load();
      moveSoundRef.current.addEventListener('canplaythrough', () => {
        console.log('🔊 Move sound loaded and ready');
      });
      moveSoundRef.current.addEventListener('error', (e) => {
        console.error('❌ Move sound failed to load:', e);
      });
      console.log('🔊 Move sound created');
    } catch (error) {
      console.warn('Could not load move sound:', error);
      moveSoundRef.current = null;
    }
    
    try {
      captureSoundRef.current = new Audio('/sounds/capture.mp3');
      captureSoundRef.current.load();
      captureSoundRef.current.addEventListener('canplaythrough', () => {
        console.log('🔊 Capture sound loaded and ready');
      });
      captureSoundRef.current.addEventListener('error', (e) => {
        console.error('❌ Capture sound failed to load:', e);
      });
      console.log('🔊 Capture sound created');
    } catch (error) {
      console.warn('Could not load capture sound:', error);
      captureSoundRef.current = null;
    }
    
    try {
      castleSoundRef.current = new Audio('/sounds/castle.mp3');
      castleSoundRef.current.load();
      castleSoundRef.current.addEventListener('canplaythrough', () => {
        console.log('🔊 Castle sound loaded and ready');
      });
      castleSoundRef.current.addEventListener('error', (e) => {
        console.error('❌ Castle sound failed to load:', e);
      });
      console.log('🔊 Castle sound created');
    } catch (error) {
      console.warn('Could not load castle sound:', error);
      castleSoundRef.current = null;
    }
    console.log('🔊 SOUND LOADING: All sounds initialized');
  }, []);

  const [selectedDifficulty, setSelectedDifficulty] = useState('beginner');
  const [showAnalysis, setShowAnalysis] = useState(false);

  // Get user's endgame rating from AuthContext with error handling
  const userEndgameRating = user?.endgameRating || 1200;

  // Add error boundary and debugging
  console.log('EndgameTrainerPage rendering, user:', user);
  console.log('userEndgameRating:', userEndgameRating);

  // Update user rating when puzzle is solved
  const updateUserRating = async (puzzleRating, success) => {
    try {
      console.log('🔄 Updating user rating:', { puzzleRating, success });
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('❌ No auth token found');
        return;
      }

      console.log('📡 Sending rating update to backend...');
      const response = await fetch('http://localhost:3001/api/endgames/stats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        body: JSON.stringify({
          puzzleRating: puzzleRating,
          solved: success
        })
      });

      console.log('📡 Response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('📡 Rating update response:', data);
        if (data.ratingChange !== undefined) {
          // Ensure rating always changes - if it's 0, make it at least ±1
          let ratingChange = data.ratingChange;
          if (ratingChange === 0) {
            ratingChange = success ? 1 : -1;
            console.log('⚠️ Rating change was 0, forcing to:', ratingChange);
          }
          // Only show rating in feedback when puzzle is solved successfully
          if (success) {
            const changeText = ratingChange > 0 ? `+${ratingChange}` : `${ratingChange}`;
            setFeedback(prev => {
              // Remove any existing rating text and add new one
              const cleaned = prev.replace(/Rating:.*$/, '').trim();
              return cleaned ? `${cleaned} Rating: ${changeText}` : `Rating: ${changeText}`;
            });
          }
        }
        // Refresh user data to get updated rating from database
        if (refreshUser) {
          await refreshUser();
        }
      } else {
        console.error('❌ Rating update failed:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('❌ Error updating rating:', error);
    }
  };

  // Sample positions for each endgame type
  const endgamePositions = {
    'pawn-vs-pawn': [
      {
        fen: '8/8/8/3p4/3P4/8/8/8 w - - 0 1',
        solution: ['Kd2', 'Kd7', 'Kd3', 'Kd6', 'Kd4'],
        description: 'Pawn vs Pawn - Opposition is key'
      }
    ],
    'pawn-king-vs-pawn-king': [
      {
        fen: '8/8/8/3pk3/3PK3/8/8/8 w - - 0 1',
        solution: ['Kf5', 'Kd6', 'Kf6', 'Kd7', 'Ke5'],
        description: 'King and Pawn vs King and Pawn'
      },
      {
        fen: '8/8/8/8/2k1p3/4P3/4K3/8 w - - 0 1',
        solution: ['Kd2', 'Kd5', 'Kd3', 'Ke5', 'Ke2'],
        description: 'Passed pawn endgame'
      }
    ],
    'mate-in-1': [
      {
        fen: 'rnbqkb1r/pppp1ppp/5n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4',
        solution: ['Qxf7#'],
        description: 'Scholar\'s mate pattern'
      },
      {
        fen: '6k1/5ppp/8/8/8/8/8/4K2R w K - 0 1',
        solution: ['Rh8#'],
        description: 'Back rank mate'
      }
    ],
    'mate-in-2': [
      {
        fen: '2bqkb1r/2pppppp/p2n4/1p6/3P4/1B6/PPP1QPPP/RNB1K1NR w KQk - 0 8',
        solution: ['Qe4+', 'Be7', 'Qxe7#'],
        description: 'Queen and Bishop mate'
      }
    ]
  };

  // Local fallback puzzles map to guarantee a puzzle loads even if backend is unavailable
  const fallbackPuzzlesByTheme = {
    'pawn-endgames': [
      {
        fen: '8/8/8/3p4/3P4/8/8/8 w - - 0 1',
        moves: ['Kd2', 'Kd7', 'Kd3', 'Kd6', 'Kd4'],
        rating: 900,
        theme: 'pawn-endgames',
        description: 'Basic opposition in king and pawn endgame'
      }
    ],
    'rook-endgames': [
      {
        fen: '8/8/8/8/3k4/8/5R2/4K3 w - - 0 1',
        moves: ['Re2', 'Kd3', 'Kf2', 'Kd4', 'Kf3'],
        rating: 1200,
        theme: 'rook-endgames',
        description: 'Rook checks to gain tempo'
      }
    ],
    'queen-endgames': [
      {
        fen: '6k1/8/8/8/8/8/5Q2/6K1 w - - 0 1',
        moves: ['Kg2', 'Kh8', 'Qf8+'],
        rating: 1100,
        theme: 'queen-endgames',
        description: 'Basic queen coordination'
      }
    ],
    'mate-in-1': [
      {
        fen: '6k1/5ppp/8/8/8/8/8/4K2R w K - 0 1',
        moves: ['Rh8#'],
        rating: 800,
        theme: 'mate-in-1',
        description: 'Back rank mate pattern'
      }
    ],
    'mate-in-2': [
      {
        fen: '2bqkb1r/2pppppp/p2n4/1p6/3P4/1B6/PPP1QPPP/RNB1K1NR w KQk - 0 8',
        moves: ['Qe4+', 'Be7', 'Qxe7#'],
        rating: 1400,
        theme: 'mate-in-2',
        description: 'Queen and bishop mate in two'
      }
    ],
    'mate-in-3': [
      {
        fen: '6k1/5ppp/8/8/8/8/8/4K2R w K - 0 1',
        moves: ['Rh8+','Kxh8','Qxf7','Qg8','Qxg8+'],
        rating: 1600,
        theme: 'mate-in-3',
        description: 'Forcing sequence to mate'
      }
    ]
  };

  const loadFallbackPuzzle = (themeKey) => {
    // Pick a sensible group if theme not present
    const pool =
      fallbackPuzzlesByTheme[themeKey] ||
      fallbackPuzzlesByTheme['pawn-endgames'];
    const pick = pool[Math.floor(Math.random() * pool.length)];
    setFeedback('Loaded offline sample puzzle.');
    initializePuzzle(pick);
  };

  const loadPuzzle = useCallback(async (endgameType) => {
    setLoading(true);
    setFeedback('');
    setShowSolution(false);
    setPuzzleComplete(false);
    setMoveIndex(0);
    setDrawnArrows([]);
    setCurrentPuzzle(null); // Clear previous puzzle
    setGame(null);
    setFen(''); // Clear FEN to show "No puzzle loaded"
    
    try {
      console.log(`Loading endgame category: ${endgameType} with difficulty: ${selectedDifficulty}`);
      
      // Fetch from backend API with difficulty parameter
      const response = await fetch(`http://localhost:3001/api/endgames/category/${endgameType}?difficulty=${selectedDifficulty}`);
      
      if (!response.ok) {
        // Try to parse error message from response
        let errorMessage = `Failed to fetch puzzle (HTTP ${response.status})`;
        try {
          const errorData = await response.json();
          if (errorData.error) {
            errorMessage = errorData.error;
          }
          if (errorData.availableCategories && errorData.availableCategories.length > 0) {
            errorMessage += `. Available categories: ${errorData.availableCategories.slice(0, 5).join(', ')}`;
          }
        } catch (e) {
          // If JSON parsing fails, use default message
        }
        console.warn(errorMessage);
        // Fall back to local sample
        loadFallbackPuzzle(endgameType);
        return;
      }
      
      const responseData = await response.json();
      console.log('Received puzzle data:', responseData);
      
      // Handle both single puzzle and multiple puzzles responses
      let puzzleData;
      if (responseData.puzzles && Array.isArray(responseData.puzzles)) {
        // Multiple puzzles returned - pick a random one
        const puzzles = responseData.puzzles;
        if (puzzles.length === 0) {
          console.warn('No puzzles in response array');
          loadFallbackPuzzle(endgameType);
          return;
        }
        puzzleData = puzzles[Math.floor(Math.random() * puzzles.length)];
      } else if (responseData.fen) {
        // Single puzzle returned
        puzzleData = responseData;
      } else {
        console.warn('Invalid puzzle data received from server');
        loadFallbackPuzzle(endgameType);
        return;
      }
      
      if (!puzzleData || !puzzleData.fen) {
        console.warn('Invalid puzzle data structure');
        loadFallbackPuzzle(endgameType);
        return;
      }
      
      // Normalize puzzle data to ensure all required fields
      const normalizedPuzzle = {
        id: puzzleData.id || puzzleData._id,
        _id: puzzleData._id || puzzleData.id,
        fen: puzzleData.fen,
        moves: puzzleData.moves || [],
        rating: puzzleData.rating,
        theme: puzzleData.theme || puzzleData.category || endgameType,
        description: puzzleData.description,
        category: puzzleData.category || endgameType,
        themes: puzzleData.themes
      };
      
      initializePuzzle(normalizedPuzzle);
      
    } catch (error) {
      console.error('Error loading puzzle:', error);
      // Use local fallback instead of leaving the UI unchanged
      loadFallbackPuzzle(endgameType);
    } finally {
      setLoading(false);
    }
  }, [selectedDifficulty, initializePuzzle]);

  const nextPuzzle = useCallback(async () => {
    if (!selectedTheme) {
      console.warn('No theme selected, cannot load puzzle');
      setFeedback('Please select a theme first');
      return;
    }

    setLoading(true);
    setFeedback('');
    setShowSolution(false);
    setPuzzleComplete(false);
    setMoveIndex(0);
    setDrawnArrows([]);
    setSelectedSquare(null);
    setCurrentPuzzle(null); // Clear previous puzzle
    setGame(null);
    setFen(''); // Clear FEN
    
    try {
      const token = localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json',
        ...(token && { 'x-auth-token': token })
      };

      // Use the next puzzle endpoint with current puzzle ID if available
      let url = `http://localhost:3001/api/endgames/next/${selectedTheme}`;
      if (currentPuzzle) {
        const currentId = currentPuzzle.id || currentPuzzle._id;
        if (currentId) {
          url += `?currentId=${currentId}`;
        }
      }
      // Note: difficulty parameter is handled by the category endpoint, not the next endpoint
      
      console.log(`Loading next puzzle for theme: ${selectedTheme}, URL: ${url}`);
      
      const response = await fetch(url, { headers });
      
      if (!response.ok) {
        console.warn(`Failed to fetch next puzzle (HTTP ${response.status}), falling back to random puzzle`);
        // Fall back to loading a random puzzle from category endpoint
        await loadPuzzle(selectedTheme);
        return;
      }
      
      const puzzleData = await response.json();
      console.log('Received next puzzle data:', puzzleData);
      
      if (!puzzleData || !puzzleData.fen) {
        console.warn('Invalid puzzle data received, falling back to random puzzle');
        await loadPuzzle(selectedTheme);
        return;
      }
      
      // Ensure puzzle data has all required fields
      const normalizedPuzzle = {
        id: puzzleData.id || puzzleData._id,
        _id: puzzleData._id || puzzleData.id,
        fen: puzzleData.fen,
        moves: puzzleData.moves || [],
        rating: puzzleData.rating,
        theme: puzzleData.theme || puzzleData.category || selectedTheme,
        description: puzzleData.description,
        category: puzzleData.category || selectedTheme,
        themes: puzzleData.themes
      };
      
      initializePuzzle(normalizedPuzzle);
      
    } catch (error) {
      console.error('Error loading next puzzle:', error);
      // Fall back to loading a random puzzle
      await loadPuzzle(selectedTheme);
    } finally {
      setLoading(false);
    }
  }, [selectedTheme, currentPuzzle, loadPuzzle, initializePuzzle]);

  const playMoveSound = useCallback((moveObj) => {
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
  }, []);

  const initializePuzzle = useCallback((puzzleData) => {
    console.log('🔧 Initializing endgame puzzle:', puzzleData);
    
    if (!puzzleData) {
      console.error('Invalid puzzle data:', puzzleData);
      setFeedback('No puzzle data available.');
      setLoading(false);
      return;
    }

    try {
      const newGame = new Chess(puzzleData.fen);
      console.log('✅ Created Chess game with FEN:', puzzleData.fen);
      let userMoveIndex = 0;

      // Try to play the first move as the opponent's move if it exists
      const firstMove = puzzleData.moves?.[0];
      if (firstMove && puzzleData.moves.length > 1) {
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
            console.log('✅ Executed opponent move:', firstMove);
            playMoveSound(firstMoveResult);
            
            // Arrow removed - no visual arrows
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

      console.log('✅ Setting puzzle state with:', puzzleData);
      setCurrentPuzzle(puzzleData);
      setGame(newGame);
      setFen(newGame.fen());
      console.log('🎯 Game state set with FEN:', newGame.fen());
      setMoveIndex(userMoveIndex);
      setShowSolution(false);
      setFeedback('Your turn to move!');
      setSelectedSquare(null);
      
      // Set board orientation so the player whose turn it is has pieces at the bottom
      const userColor = newGame.turn() === 'w' ? 'white' : 'black';
      setPlayerColor(userColor);
      setBoardOrientation(userColor);
      orientationLockedRef.current = userColor; // lock orientation for this puzzle
      console.log('🎯 Board orientation set to player color:', userColor, 'userMoveIndex:', userMoveIndex);
      
      console.log('✅ Puzzle initialization complete!');
      
    } catch (err) {
      console.error('Error initializing puzzle:', err);
      setFeedback('Error setting up puzzle position.');
    }
  }, [playMoveSound]);

  // Load themes from API
  useEffect(() => {
    const fetchThemes = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/endgames/themes');
        if (response.ok) {
          const data = await response.json();
          setEndgameThemes(data.themes || []);
          if (data.themes && data.themes.length > 0) {
            setSelectedTheme(data.themes[0].value);
          }
        } else {
          console.error('Failed to fetch themes');
          // Fallback themes
          setEndgameThemes([
            { value: 'pawn-endgames', label: 'Pawn Endgames' },
            { value: 'rook-endgames', label: 'Rook Endgames' },
            { value: 'queen-endgames', label: 'Queen Endgames' },
            { value: 'mate-in-1', label: 'Checkmate in 1' },
            { value: 'mate-in-2', label: 'Checkmate in 2' },
            { value: 'mate-in-3', label: 'Checkmate in 3' },
          ]);
        }
      } catch (error) {
        console.error('Error fetching themes:', error);
        // Fallback themes
        setEndgameThemes([
          { value: 'pawn-endgames', label: 'Pawn Endgames' },
          { value: 'rook-endgames', label: 'Rook Endgames' },
          { value: 'queen-endgames', label: 'Queen Endgames' },
          { value: 'mate-in-1', label: 'Checkmate in 1' },
          { value: 'mate-in-2', label: 'Checkmate in 2' },
          { value: 'mate-in-3', label: 'Checkmate in 3' },
        ]);
      } finally {
        setThemesLoading(false);
      }
    };

    fetchThemes();
  }, []);

  // Load initial puzzle when component mounts
  useEffect(() => {
    if (!themesLoading && selectedTheme) {
      loadPuzzle(selectedTheme);
    }
  }, [loadPuzzle, selectedTheme, themesLoading]);

  const handleMove = (from, to) => {
    if (loading || puzzleComplete || !game || !currentPuzzle) {
      return false;
    }
    
    console.log('=== ENDGAME MOVE VALIDATION START ===');
    console.log('Attempting move from', from, 'to', to);
    console.log('Current move index:', moveIndex);
    console.log('Game turn:', game.turn());
    console.log('Puzzle moves:', currentPuzzle.moves);

    // Strict check: ensure the piece being moved is of the correct color
    const piece = game.get(from);
    if (!piece) {
      console.log('❌ No piece on square:', from);
      setFeedback('No piece on this square.');
      return false;
    }

    if (piece.color !== game.turn()) {
      console.log('❌ Wrong color piece. Piece color:', piece.color, 'Game turn:', game.turn());
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
      const expectedMove = currentPuzzle.moves[moveIndex];
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
        isCorrectMove = actualMoveUCI === expectedMove;
        console.log('UCI comparison:', { actual: actualMoveUCI, expected: expectedMove, isCorrect: isCorrectMove });
      } else {
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
        console.log('New move index:', newMoveIndex);
        console.log('Total moves in puzzle:', currentPuzzle.moves.length);
        
        // Auto-play opponent's reply if available
        if (newMoveIndex < currentPuzzle.moves.length) {
          const opponentMove = currentPuzzle.moves[newMoveIndex];
          console.log('Playing opponent move:', opponentMove);
          
          try {
            let opponentMoveResult;
            if (opponentMove.length === 4 && /^[a-h][1-8][a-h][1-8]$/.test(opponentMove)) {
              // UCI format
              const from = opponentMove.substring(0, 2);
              const to = opponentMove.substring(2, 4);
              opponentMoveResult = newGame.move({ from, to, promotion: 'q' });
            } else {
              // SAN format
              opponentMoveResult = newGame.move(opponentMove, { sloppy: true });
            }
            
            if (opponentMoveResult) {
              console.log('✅ Opponent move played:', opponentMoveResult.san);
              playMoveSound(opponentMoveResult);
              newMoveIndex++;
              
              // Arrow removed - no visual arrows
            } else {
              console.log('❌ Failed to play opponent move:', opponentMove);
            }
          } catch (error) {
            console.log('❌ Error playing opponent move:', error);
          }
        }
        
        // Update game state
        setGame(newGame);
        setFen(newGame.fen());
        setMoveIndex(newMoveIndex);
        
        // Check if puzzle is complete
        if (newMoveIndex >= currentPuzzle.moves.length) {
          console.log('🎉 Puzzle completed!');
          console.log('🎯 Current puzzle rating:', currentPuzzle.rating);
          setFeedback('Puzzle solved! ✓');
          setScore(prev => prev + 1);
          setPuzzleComplete(true);
          
          
          // Update user rating - ensure it always changes
          if (currentPuzzle.rating) {
            console.log('🔄 Calling updateUserRating with rating:', currentPuzzle.rating);
            updateUserRating(currentPuzzle.rating, true);
          } else {
            console.log('⚠️ No rating found in currentPuzzle');
          }
          
          // Don't auto-advance to next puzzle
        } else {
          setFeedback('Correct move! Continue...');
        }
        
    } else {
        console.log('❌ Incorrect move - Puzzle failed!');
        console.log('🎯 Current puzzle rating:', currentPuzzle.rating);
        setFeedback('Incorrect move. Try again or show solution.');
        setPuzzleComplete(true);
        
        
        // Update user rating for failed attempt
        if (currentPuzzle.rating) {
          console.log('🔄 Calling updateUserRating for failed attempt with rating:', currentPuzzle.rating);
          updateUserRating(currentPuzzle.rating, false);
        } else {
          console.log('⚠️ No rating found in currentPuzzle for failed attempt');
        }
    }
    
    return true;
      
    } catch (error) {
      console.error('Error processing move:', error);
      setFeedback('Error processing move. Please try again.');
      return false;
    }
  };



  const handleShowSolution = () => {
    if (!currentPuzzle) return;
    
    setShowSolution(true);
    setPuzzleComplete(true);
    setFeedback('Showing solution...');
    
    // Update user rating for using solution (counts as failure)
    if (currentPuzzle.rating) {
      console.log('🔄 Calling updateUserRating for show solution with rating:', currentPuzzle.rating);
      updateUserRating(currentPuzzle.rating, false);
    }
    
    // Play through the complete solution step by step on the main board
    const playSolution = async () => {
      console.log('🎯 Starting solution replay...');
      console.log('🎯 Original puzzle FEN:', currentPuzzle.fen);
      console.log('🎯 Puzzle moves:', currentPuzzle.moves);
      
      if (!currentPuzzle.moves || currentPuzzle.moves.length === 0) {
        console.log('🎯 No moves found in puzzle!');
        setFeedback('No solution moves found!');
        return;
      }
      
      console.log('🎯 Playing', currentPuzzle.moves.length, 'moves...');
      
      // Reset to original position
      const solutionGame = new Chess(currentPuzzle.fen);
      setGame(solutionGame);
      setFen(solutionGame.fen());
      setMoveIndex(0);
      setDrawnArrows([]);
      
      // Set board orientation so the player whose turn it is has pieces at the bottom
      setBoardOrientation(playerColor);
      
      // Wait a moment for the board to update
      await new Promise(resolve => setTimeout(resolve, 500));
      
      for (let i = 0; i < currentPuzzle.moves.length; i++) {
        const move = currentPuzzle.moves[i];
        console.log(`🎯 Playing move ${i + 1}: ${move}`);
        
        try {
          let moveResult;
          if (move.length === 4 && /^[a-h][1-8][a-h][1-8]$/.test(move)) {
            // UCI format
            const from = move.substring(0, 2);
            const to = move.substring(2, 4);
            moveResult = solutionGame.move({ from, to, promotion: 'q' });
          } else {
            // SAN format
            moveResult = solutionGame.move(move, { sloppy: true });
          }
          
          if (moveResult) {
            console.log(`✅ Move ${i + 1} played successfully:`, moveResult.san);
            setGame(new Chess(solutionGame.fen()));
            setFen(solutionGame.fen());
            setMoveIndex(i + 1);
            
            // Arrow removed - no visual arrows during solution replay
            
            // Wait between moves for visual effect
            await new Promise(resolve => setTimeout(resolve, 1000));
          } else {
            console.log(`❌ Failed to play move ${i + 1}: ${move}`);
            break;
          }
        } catch (error) {
          console.log(`❌ Error playing move ${i + 1}: ${move}`, error);
          break;
        }
      }
      
      console.log('🎯 Solution replay complete!');
      setFeedback(`Solution complete! All moves: ${currentPuzzle.moves.join(', ')}`);
    };
    
    playSolution();
  };

  const getCustomSquareStyles = () => {
    const styles = {};
    if (selectedSquare) {
      styles[selectedSquare] = { backgroundColor: 'rgba(20, 85, 30, 0.4)' };
    }
    return styles;
  };

  // No arrows displayed on the board
  const getAllArrows = () => {
    return [];
  };

    return (
    <div className="min-h-screen text-white py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header with dropdown */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8">
          <div className="text-center sm:text-left mb-4 sm:mb-0">
            <h1 className="text-3xl sm:text-4xl font-bold mb-2 bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
              Endgame Trainer
            </h1>
            <p className="text-gray-300">Master essential endgame patterns</p>
            {userEndgameRating && (
              <div className="mt-2 inline-flex items-center bg-blue-500/20 border border-blue-500/30 rounded-lg px-3 py-1">
                <Trophy className="w-4 h-4 text-blue-400 mr-2" />
                <span className="font-semibold text-blue-300 text-sm">Rating: {userEndgameRating}</span>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex items-center space-x-4">
            {/* Theme Dropdown */}
            <div className="flex items-center space-x-2">
              <label className="text-gray-300 font-medium">Theme:</label>
              {themesLoading ? (
                <div className="bg-slate-800/50 border border-blue-500/30 rounded-lg px-3 py-1.5 text-gray-400 text-sm">
                  Loading themes...
                </div>
              ) : (
                <select
                  value={selectedTheme}
                  onChange={(e) => setSelectedTheme(e.target.value)}
                  className="bg-slate-800/50 border border-blue-500/30 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-blue-400"
                >
                  {endgameThemes.map(theme => (
                    <option key={theme.value} value={theme.value}>
                      {theme.label}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Difficulty Selection */}
            <div className="flex items-center space-x-2">
              <label className="text-gray-300 font-medium">Difficulty:</label>
              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="bg-slate-800/50 border border-blue-500/30 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-blue-400"
              >
                <option value="beginner">Beginner (800-1200)</option>
                <option value="intermediate">Intermediate (1200-1800)</option>
                <option value="advanced">Advanced (1800+)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Board Size Slider - Hidden on mobile and tablet, show only on desktop */}
        <div className="mb-4 hidden lg:flex items-center justify-center gap-2">
          <label htmlFor="board-size" className="text-xs text-gray-300">Board Size:</label>
          <input
            id="board-size"
            type="range"
            min={500}
            max={1000}
            value={boardSize}
            onChange={e => setBoardSize(Number(e.target.value))}
            className="w-32"
          />
          <span className="text-xs w-8 text-right text-gray-300">{boardSize}px</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chessboard - Takes up more space */}
          <div className="lg:col-span-2" style={{ minWidth: 0, overflow: 'hidden' }}>
            <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl shadow-2xl border border-gray-200 p-4 sm:p-8" style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box', overflow: 'hidden' }}>
              <div className="flex flex-col items-center" style={{ width: '100%', maxWidth: '100%' }}>
                {/* Enhanced turn indicator */}
                <div className={`mb-6 px-6 py-3 rounded-xl font-bold text-base sm:text-lg shadow-lg transform transition-all duration-300 ${
                  game?.turn() === 'w' 
                    ? 'bg-blue-500/20 text-blue-700 border border-blue-500/30' 
                    : 'bg-gray-500/20 text-gray-700 border border-gray-500/30'
                }`}>
                  {game?.turn() === 'w' ? 'White to move' : 'Black to move'}
                </div>
                {/* EXACT COPY of board structure from PuzzleSolvePage */}
                <div className="relative w-full" style={{ touchAction: 'manipulation', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  {loading ? (
                    <div className="flex justify-center items-center h-96">
                      <div className="text-gray-400">Loading puzzle...</div>
                    </div>
                  ) : fen ? (
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
                          width: boardSize, 
                          height: boardSize,
                          touchAction: 'none',
                          WebkitUserSelect: 'none',
                          userSelect: 'none',
                          WebkitTouchCallout: 'none',
                          WebkitTapHighlightColor: 'transparent'
                        }}>
                          <Chessboard
                          position={showSolution ? (solutionPosition || currentPuzzle?.fen || fen) : fen}
                          boardOrientation={boardOrientation}
                          arePiecesDraggable={!showSolution && !puzzleComplete}
                          onPieceDrop={showSolution || puzzleComplete ? undefined : (sourceSquare, targetSquare) => {
                            const success = handleMove(sourceSquare, targetSquare);
                            return success;
                          }}
                          customPieceStyle={{
                            cursor: 'grab',
                            touchAction: 'none'
                          }}
                          customDragPieceStyle={{
                            cursor: 'grabbing',
                            touchAction: 'none'
                          }}
                          onSquareClick={showSolution || puzzleComplete ? undefined : (square) => {
                            if (!game || showSolution || puzzleComplete) return;

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
                          customSquareStyles={getCustomSquareStyles()}
                          boardWidth={boardSize}
                          customBoardStyle={{
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                            // Mobile touch optimizations - CRITICAL for drag-and-drop
                            touchAction: 'none', // Disable browser gestures to allow proper drag handling
                            pointerEvents: 'auto', // Ensure touch events are captured
                            userSelect: 'none', // Prevent text selection on mobile
                            WebkitUserSelect: 'none',
                            MozUserSelect: 'none',
                            msUserSelect: 'none',
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
                          customArrows={[]}
                          areArrowsAllowed={false}
                          animationDuration={200}
                        />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-center items-center h-96">
                      <div className="text-gray-400">No puzzle loaded</div>
                    </div>
                  )}
                </div>
                


                {/* Feedback */}
                {feedback && (
                  <div className="mt-4 p-3 bg-blue-500/10 rounded-lg border border-blue-500/30">
                    <div className="text-sm text-blue-700">{feedback}</div>
                  </div>
                )}

                {/* Analyze with Live Board Button - Only show after puzzle completion */}
                {puzzleComplete && currentPuzzle && (
                  <div className="mt-4 flex flex-col items-center space-y-2">
                    <OpenInLiveAnalysisButton
                      fen={currentPuzzle.fen}
                      color={currentPuzzle.fen.split(' ')[1] === 'w' ? 'white' : 'black'}
                      label="Analyze with Live Board"
                      className="!bg-green-600 hover:!bg-green-700 !text-white !font-semibold !py-3 !px-6 !rounded-lg !shadow-lg !transform !transition-all !duration-200 hover:!scale-105"
                      onClick={() => {
                        console.log('🔍 Debug: Opening analysis with FEN:', currentPuzzle.fen);
                        console.log('🔍 Debug: Side to move:', currentPuzzle.fen.split(' ')[1] === 'w' ? 'white' : 'black');
                      }}
                    />
                    {/* Debug info */}
                    <div className="text-xs text-gray-500 bg-gray-100 p-2 rounded">
                      <div>FEN: {currentPuzzle.fen}</div>
                      <div>Side: {currentPuzzle.fen.split(' ')[1] === 'w' ? 'white' : 'black'}</div>
                      <div>URL: /chess-annotation-advanced?fen={currentPuzzle.fen.replace(/ /g, '_')}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="lg:col-span-1">
            <div className="bg-gradient-to-br from-slate-800/50 to-blue-900/30 backdrop-blur-sm border border-blue-500/20 rounded-2xl p-6">
              <h2 className="text-lg font-bold mb-4 text-white">Controls</h2>
              <div className="space-y-3">
                <button 
                  onClick={handleShowSolution}
                  className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
                >
                  <Eye className="w-4 h-4" />
                  <span>Show Solution</span>
                </button>
                <button 
                  onClick={nextPuzzle}
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>{loading ? 'Loading...' : 'Next Puzzle'}</span>
                </button>
              </div>

              {showSolution && currentPuzzle && (
                <div className="mt-4 p-3 bg-slate-700/50 rounded-lg">
                  <h3 className="font-semibold mb-2 text-sm text-gray-300">
                    Solution ({solutionStep}/{currentPuzzle.moves?.length || 0}):
                  </h3>
                  <div className="space-y-1">
                    {currentPuzzle.moves?.map((move, index) => (
                      <div 
                        key={index} 
                        className={`text-xs p-2 rounded border ${
                          index < solutionStep 
                            ? 'bg-green-800 border-green-600 text-green-200' 
                            : 'bg-slate-800 border-slate-600 text-gray-400'
                        }`}
                      >
                        {index + 1}. {move}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Puzzle Info Cards */}
              <div className="mt-6 space-y-4">
                {/* User Rating */}
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl shadow-xl border border-blue-200 p-4">
                  <h3 className="text-lg font-bold mb-3 text-blue-800 flex items-center">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                    Your Rating
                  </h3>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600">{userEndgameRating || 1200}</div>
                    <div className="text-sm text-blue-700 mt-1">Endgame Rating</div>
                  </div>
                </div>

                {/* Expected Rating Change */}
                {currentPuzzle && userEndgameRating && currentPuzzle.rating && (() => {
                  // Calculate Expected Rating Change using the same Elo formula as the backend
                  const expectedScore = 1 / (1 + Math.pow(10, (currentPuzzle.rating - userEndgameRating) / 400));
                  const expectedPointsIfSolved = Math.round(32 * (1 - expectedScore));
                  const expectedPointsIfFailed = Math.round(32 * (0 - expectedScore));
                  
                  return (
                    <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-xl border border-gray-200 p-4">
                      <h3 className="text-lg font-bold mb-3 text-gray-800 flex items-center">
                        <div className="w-2 h-2 bg-indigo-500 rounded-full mr-3"></div>
                        Expected Rating Change
                      </h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200 shadow-sm">
                          <span className="text-green-700 text-sm font-medium">If solved correctly:</span>
                          <span className="font-bold text-green-800 text-lg bg-green-100 px-3 py-1 rounded-lg">{expectedPointsIfSolved > 0 ? '+' : ''}{expectedPointsIfSolved}</span>
                        </div>
                        <div className="flex justify-between items-center p-4 bg-gradient-to-r from-red-50 to-rose-50 rounded-xl border border-red-200 shadow-sm">
                          <span className="text-red-700 text-sm font-medium">If solved incorrectly:</span>
                          <span className="font-bold text-red-800 text-lg bg-red-100 px-3 py-1 rounded-lg">{expectedPointsIfFailed > 0 ? '+' : ''}{expectedPointsIfFailed}</span>
                        </div>
                      </div>
                      <div className="mt-4 p-3 bg-gradient-to-r from-gray-50 to-slate-50 rounded-lg border border-gray-200">
                        <p className="text-xs text-gray-600 text-center">
                          Based on puzzle difficulty ({currentPuzzle.rating}) vs your rating ({userEndgameRating})
                        </p>
                      </div>
                    </div>
                  );
                })()}

                {/* Puzzle Difficulty */}
                {currentPuzzle?.rating && (
                  <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-2xl shadow-xl border border-teal-200 p-4">
                    <h3 className="text-lg font-bold mb-3 text-teal-800 flex items-center">
                      <div className="w-2 h-2 bg-teal-500 rounded-full mr-3"></div>
                      Puzzle Difficulty
                    </h3>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-teal-600">{currentPuzzle.rating}</div>
                      <div className="text-sm text-teal-700 mt-1">Rating</div>
                    </div>
                  </div>
                )}

                {/* Puzzle Info */}
                {currentPuzzle && (
                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl shadow-xl border border-green-200 p-4">
                    <h3 className="text-lg font-bold mb-3 text-green-800 flex items-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                      Puzzle Info
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-2 bg-white rounded-lg border border-green-200">
                        <span className="font-semibold text-green-800 text-sm">Theme:</span>
                        <span className="text-green-700 text-sm font-bold">{currentPuzzle.theme || 'Endgame'}</span>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-white rounded-lg border border-green-200">
                        <span className="font-semibold text-green-800 text-sm">Move:</span>
                        <span className="text-green-700 text-sm font-bold">{moveIndex + 1} / {currentPuzzle.moves?.length || 0}</span>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-white rounded-lg border border-green-200">
                        <span className="font-semibold text-green-800 text-sm">Difficulty:</span>
                        <span className="text-green-700 text-sm font-bold capitalize">{selectedDifficulty}</span>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </div>
          </div>

        </div>


        {/* Analysis Modal */}
        {showAnalysis && currentPuzzle && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-white">Puzzle Analysis</h3>
                <button
                  onClick={() => setShowAnalysis(false)}
                  className="text-gray-400 hover:text-white text-2xl"
                >
                  ×
                </button>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Board */}
                <div>
                  <Chessboard
                    position={currentPuzzle.fen}
                    boardWidth={400}
                    customBoardStyle={{
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      // Mobile touch optimizations
                      touchAction: 'manipulation',
                      userSelect: 'none',
                      WebkitUserSelect: 'none',
                      MozUserSelect: 'none',
                      msUserSelect: 'none',
                      WebkitTouchCallout: 'none',
                      WebkitTapHighlightColor: 'transparent'
                    }}
                  />
                </div>
                
                {/* Analysis Info */}
                <div className="space-y-4">
                  <div className="bg-slate-700/50 rounded-lg p-4">
                    <h4 className="font-semibold text-white mb-2">Puzzle Details</h4>
                    <div className="space-y-2 text-sm">
                      <div><span className="text-gray-400">Rating:</span> {currentPuzzle.rating}</div>
                      <div><span className="text-gray-400">Theme:</span> {selectedTheme}</div>
                      <div><span className="text-gray-400">Moves:</span> {currentPuzzle.moves?.length || 0}</div>
                    </div>
                  </div>
                  
                  <div className="bg-slate-700/50 rounded-lg p-4">
                    <h4 className="font-semibold text-white mb-2">Solution</h4>
                    <div className="space-y-1">
                      {currentPuzzle.moves?.map((move, index) => (
                        <div key={index} className="text-sm text-gray-300">
                          {index + 1}. {move}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <button
                    onClick={() => {
                      setShowAnalysis(false);
                      // Load this puzzle to play
                      initializePuzzle({
                        _id: currentPuzzle._id,
                        fen: currentPuzzle.fen,
                        moves: currentPuzzle.moves,
                        rating: currentPuzzle.rating,
                        description: currentPuzzle.description
                      });
                    }}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                  >
                    Play This Puzzle
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EndgameTrainerPage;