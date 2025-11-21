import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Chess } from 'chess.js';
import { Bot, Play, RotateCcw, Settings, Clock, User, Crown, BarChart3, Save } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { saveGame, createGame } from '../utils/gameManager';
import ProductionChessBoard from './ProductionChessBoard';
import { deriveBotLevelMeta } from '../utils/botLevels';
import { getApiUrl, getAuthHeaders } from '../config/api';

const BOT_DEFINITIONS = [
  {
    id: 'rookie',
    name: 'Alex',
    elo: 800,
    description: 'Beginner player',
    hoverDescription:
      'Alex is just starting out in chess. Makes frequent mistakes in tactics and opening principles. Great for absolute beginners looking to build confidence.',
    personality: 'beginner',
    avatar: '/images/bots/bot1.webp'
  },
  {
    id: 'casual',
    name: 'Jordan',
    elo: 1000,
    description: 'Casual player',
    hoverDescription:
      'Jordan plays chess casually and knows basic tactics. Understands opening principles but sometimes misses tactical opportunities. Good for practicing fundamentals.',
    personality: 'beginner',
    avatar: '/images/bots/bot2.webp'
  },
  {
    id: 'intermediate',
    name: 'Morgan',
    elo: 1400,
    description: 'Club player',
    hoverDescription:
      'Morgan is a solid club-level player with good tactical awareness and understanding of common positions. Rarely blunders pieces and plays sound chess.',
    personality: 'intermediate',
    avatar: '/images/bots/bot3.webp'
  },
  {
    id: 'advanced',
    name: 'Taylor',
    elo: 1800,
    description: 'Strong tournament player',
    hoverDescription:
      'Taylor competes in tournaments regularly and has deep tactical vision. Understands complex positional concepts and rarely makes tactical mistakes.',
    personality: 'advanced',
    avatar: '/images/bots/bot4.webp'
  },
  {
    id: 'expert',
    name: 'Casey',
    elo: 2200,
    description: 'Master level',
    hoverDescription:
      'Casey is a chess master with exceptional tactical and positional understanding. Calculates deeply and plays with precision. A formidable opponent.',
    personality: 'expert',
    avatar: '/images/bots/bot5.webp'
  },
  {
    id: 'tactical',
    name: 'Riley',
    elo: 1200,
    description: 'Tactical specialist',
    hoverDescription:
      'Riley loves sharp tactical positions and aggressive play. Always looking for combinations and sacrifices. Can be dangerous in complications but vulnerable in quiet positions.',
    personality: 'tactical',
    avatar: '/images/bots/bot6.webp'
  },
  {
    id: 'positional',
    name: 'Quinn',
    elo: 1600,
    description: 'Strategic player',
    hoverDescription:
      'Quinn excels at positional chess and long-term planning. Prefers slow, strategic games where pawn structure and piece placement matter. Strong in endgames.',
    personality: 'positional',
    avatar: '/images/bots/bot7.webp'
  },
  {
    id: 'aggressive',
    name: 'Sam',
    elo: 1300,
    description: 'Aggressive attacker',
    hoverDescription:
      'Sam plays for mate every game! Sacrifices material for initiative and attacks relentlessly. Defense is not in their vocabulary. Can be outplayed with solid defensive play.',
    personality: 'aggressive',
    avatar: '/images/bots/bot8.webp'
  },
  {
    id: 'defensive',
    name: 'Jamie',
    elo: 1500,
    description: 'Defensive specialist',
    hoverDescription:
      'Jamie is incredibly solid and hard to break down. Excellent at finding defensive resources and neutralizing attacks. Patient and resilient player.',
    personality: 'defensive',
    avatar: '/images/bots/bot9.webp'
  },
  {
    id: 'endgame',
    name: 'Drew',
    elo: 1900,
    description: 'Endgame expert',
    hoverDescription:
      'Drew is a technical endgame virtuoso. Converts even the smallest advantages with precision. Knows all the critical endgame positions and techniques.',
    personality: 'endgame',
    avatar: '/images/bots/bot10.webp'
  },
  {
    id: 'blitz',
    name: 'Blake',
    elo: 1100,
    description: 'Speed player',
    hoverDescription:
      'Blake thrives in fast time controls and makes moves quickly. Good intuition but sometimes plays too fast and makes impulsive decisions.',
    personality: 'blitz',
    avatar: '/images/bots/bot11.webp'
  },
  {
    id: 'classical',
    name: 'Avery',
    elo: 2000,
    description: 'Classical strategist',
    hoverDescription:
      'Avery is a deep thinker who takes time to find the best moves. Plays principled, classical chess with strong opening preparation and deep calculation.',
    personality: 'classical',
    avatar: '/images/bots/bot12.webp'
  },
  {
    id: 'creative',
    name: 'Skylar',
    elo: 1700,
    description: 'Creative player',
    hoverDescription:
      'Skylar plays unconventional and imaginative chess. Loves off-beat openings and creative ideas. Can surprise you with unexpected moves.',
    personality: 'creative',
    avatar: '/images/bots/bot13.webp'
  },
  {
    id: 'precise',
    name: 'Peyton',
    elo: 2100,
    description: 'Calculating genius',
    hoverDescription:
      'Peyton calculates variations with computer-like precision. Rarely misses tactical shots and finds the most accurate moves consistently. Very strong in complex positions.',
    personality: 'precise',
    avatar: '/images/bots/bot14.webp'
  },
  {
    id: 'gambit',
    name: 'Gambit Gary',
    elo: 1350,
    description: 'Loves sacrificing material',
    personality: 'gambit',
    avatar: '/images/bots/bot15.webp'
  },
  {
    id: 'grandmaster',
    name: 'Grandmaster Grace',
    elo: 2500,
    description: 'World-class chess engine',
    personality: 'grandmaster',
    avatar: '/images/bots/bot16.webp'
  }
];

const TOUCH_BOARD_STYLE = {
  touchAction: 'none', // Prevent the browser from hijacking drag gestures
  WebkitUserSelect: 'none',
  MozUserSelect: 'none',
  msUserSelect: 'none',
  userSelect: 'none',
  WebkitTouchCallout: 'none',
  WebkitTapHighlightColor: 'transparent',
  cursor: 'pointer',
  pointerEvents: 'auto'
};

const PlayWithBotPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Game settings state
  const [gameSettings, setGameSettings] = useState({
    selectedBot: null,
    playerColor: 'white',
    timeControl: 'rapid',
    timeInMinutes: 10
  });

  // Game state (separate variables like advantage-capitalisation)
  const [game, setGame] = useState(new Chess());
  const [fen, setFen] = useState('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
  const [moveHistory, setMoveHistory] = useState([]);
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [gameStatus, setGameStatus] = useState('menu');
  const [gameResult, setGameResult] = useState(null);
  const [lastMove, setLastMove] = useState(null);

  // Timer state (separate from game state to prevent board re-renders)
  const [playerTime, setPlayerTime] = useState(600);
  const [botTime, setBotTime] = useState(600);

  // UI state
  const [isThinking, setIsThinking] = useState(false);
  const [boardOrientation, setBoardOrientation] = useState('white');
  const [legalMoves, setLegalMoves] = useState([]);
  const [selectedSquare, setSelectedSquare] = useState(null);
  
  // Calculate responsive board size (exact copy from advantage-capitalisation)
  const getResponsiveBoardSize = () => {
    if (typeof window !== 'undefined') {
      const screenWidth = window.innerWidth;
      if (screenWidth < 640) { // Mobile
        return Math.min(screenWidth - 40, 350);
      } else if (screenWidth < 768) { // Small tablet
        return Math.min(screenWidth - 80, 450);
      } else if (screenWidth < 1024) { // Tablet
        return Math.min(screenWidth - 120, 550);
      } else { // Desktop
        return Math.min(700, 600);
      }
    }
    return 700;
  };

  const [boardSize, setBoardSize] = useState(getResponsiveBoardSize());

  // Refs
  const playerTimerRef = useRef(null);
  const botTimerRef = useRef(null);
  const gameRef = useRef(game);
  const gameStatusRef = useRef(gameStatus);

  // Update refs when state changes
  useEffect(() => {
    gameRef.current = game;
  }, [game]);

  useEffect(() => {
    gameStatusRef.current = gameStatus;
  }, [gameStatus]);

  // Update board size on window resize (exact copy from advantage-capitalisation)
  useEffect(() => {
    const handleResize = () => {
      setBoardSize(getResponsiveBoardSize());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Batch update function to prevent flashing (like AdvantageCapitalisationPage)
  const batchUpdateBoard = useCallback((newGame, newFen) => {
    // Batch updates without intermediate state changes
    setGame(newGame);
    setFen(newFen);
  }, []);

  // Save game function
  const handleSaveGame = useCallback(() => {
    try {
      // Generate PGN from move history
      const pgnMoves = moveHistory.map((move, index) => {
        if (index % 2 === 0) {
          return `${Math.floor(index / 2) + 1}.${move}`;
        }
        return move;
      }).join(' ');

      const playerColorName = gameSettings.playerColor === 'white' ? 'You' : gameSettings.selectedBot?.name || 'Bot';
      const opponentColorName = gameSettings.playerColor === 'white' ? gameSettings.selectedBot?.name || 'Bot' : 'You';
      
      const gameData = createGame(
        pgnMoves,
        game.fen(),
        `You vs ${gameSettings.selectedBot?.name || 'Bot'}`,
        `Played on ${new Date().toLocaleDateString()} - ${gameResult || 'In progress'}`
      );

      // Add white and black player names
      gameData.white = gameSettings.playerColor === 'white' ? 'You' : gameSettings.selectedBot?.name || 'Bot';
      gameData.black = gameSettings.playerColor === 'black' ? 'You' : gameSettings.selectedBot?.name || 'Bot';
      gameData.result = gameResult || '*';
      gameData.date = new Date().toISOString();

      const saved = saveGame(gameData);
      if (saved) {
        alert('✅ Game saved successfully! You can view it in your profile under Saved Games.');
      } else {
        alert('❌ Failed to save game. Please try again.');
      }
    } catch (error) {
      console.error('Error saving game:', error);
      alert('❌ Failed to save game. Please try again.');
    }
  }, [game, moveHistory, gameSettings, gameResult]);

  // Handle URL parameters for starting from specific position
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const fenFromUrl = urlParams.get('fen');
    const pgnFromUrl = urlParams.get('pgn');
    
    if (fenFromUrl) {
      try {
        const decodedFen = decodeURIComponent(fenFromUrl);
        const chess = new Chess(decodedFen);
        
        // Determine player color based on whose turn it is
        const playerColor = chess.turn() === 'w' ? 'white' : 'black';
        
        setGame(chess);
        setFen(decodedFen);
        setIsPlayerTurn(true); // Player always starts
        setGameStatus('menu'); // Still show menu for bot selection
        
        setGameSettings(prev => ({
          ...prev,
          playerColor: playerColor
        }));
        
        console.log('🎮 Loaded position from URL:', decodedFen);
        console.log('🎮 Player color set to:', playerColor);
      } catch (error) {
        console.error('❌ Error loading position from URL:', error);
      }
    }
  }, [location.search]);

  // Get available bots with canonical level metadata
  const availableBots = useMemo(() => {
    return BOT_DEFINITIONS.map((bot) => {
      const levelMeta = deriveBotLevelMeta(bot.elo);
      return {
        ...bot,
        level: levelMeta.level,
        levelIndex: levelMeta.levelIndex,
        engineParams: levelMeta.engineParams,
        canonicalRating: levelMeta.canonicalRating,
        minRating: levelMeta.minRating,
        maxRating: levelMeta.maxRating
      };
    }).sort((a, b) => {
      if (a.levelIndex !== b.levelIndex) {
        return a.levelIndex - b.levelIndex;
      }
      if (a.elo !== b.elo) {
        return a.elo - b.elo;
      }
      return a.name.localeCompare(b.name);
    });
  }, []);

  // Time control options
  const timeControls = [
    { id: 'blitz', name: 'Blitz', defaultTime: 5, description: '3-5 minutes' },
    { id: 'rapid', name: 'Rapid', defaultTime: 10, description: '10-15 minutes' },
    { id: 'classical', name: 'Classical', defaultTime: 30, description: '30+ minutes' }
  ];

  // Timer management
  const startPlayerTimer = useCallback(() => {
    console.log('Starting player timer');
    if (playerTimerRef.current) clearInterval(playerTimerRef.current);
    
    playerTimerRef.current = setInterval(() => {
      setPlayerTime(prev => {
        console.log('Player timer tick, time left:', prev);
        if (prev <= 1) {
          // Player time expired
          console.log('Player time expired!');
          if (playerTimerRef.current) {
            clearInterval(playerTimerRef.current);
            playerTimerRef.current = null;
          }
          setGameStatus('finished');
          setGameResult('Time expired - Bot wins!');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const startBotTimer = useCallback(() => {
    console.log('Starting bot timer');
    if (botTimerRef.current) clearInterval(botTimerRef.current);

    botTimerRef.current = setInterval(() => {
      setBotTime(prev => {
        console.log('Bot timer tick, time left:', prev);
        if (prev <= 1) {
          // Bot time expired
          console.log('Bot time expired!');
          if (botTimerRef.current) {
            clearInterval(botTimerRef.current);
            botTimerRef.current = null;
          }
          setGameStatus('finished');
          setGameResult('Time expired - You win!');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const stopTimers = useCallback(() => {
    if (playerTimerRef.current) {
      clearInterval(playerTimerRef.current);
      playerTimerRef.current = null;
    }
    if (botTimerRef.current) {
      clearInterval(botTimerRef.current);
      botTimerRef.current = null;
    }
  }, []);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      stopTimers();
    };
  }, [stopTimers]);

  // Format time display
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Make bot move
  const makeBotMove = useCallback(async (currentFen) => {
    if (!gameSettings.selectedBot) return;

    console.log('🤖 Making bot move for FEN:', currentFen);
    setIsThinking(true);
    
    // Ensure player timer is stopped and start bot timer
    if (playerTimerRef.current) {
      clearInterval(playerTimerRef.current);
      playerTimerRef.current = null;
      console.log('⏰ Player timer stopped before bot move');
    }
    
    startBotTimer(); // Start bot timer

    try {
      // Use the same backend API approach as AdvantageCapitalisationPage
      const payload = {
        fen: currentFen,
        difficulty: gameSettings.selectedBot.elo || 1400,
        rating: gameSettings.selectedBot.elo || 1400,
        level: gameSettings.selectedBot.level,
        levelIndex: gameSettings.selectedBot.levelIndex,
        engineParams: gameSettings.selectedBot.engineParams,
        personality: gameSettings.selectedBot.personality || 'intermediate',
        timeControl: gameSettings.timeControl || 'rapid'
      };

      console.log('🤖 Sending bot move request:', payload);

      // Add thinking delay based on bot level (simulate human-like thinking time)
      const botElo = gameSettings.selectedBot.elo || 1400;
      const thinkingDelay = botElo < 1000 ? 1000 : 
                           botElo < 1500 ? 2000 : 
                           botElo < 2000 ? 3000 : 
                           botElo < 2500 ? 5000 : 8000; // Grandmaster thinks longer
      
      console.log(`🤔 Bot thinking for ${thinkingDelay}ms (simulating ${botElo} ELO player)...`);
      await new Promise(resolve => setTimeout(resolve, thinkingDelay));

      const response = await fetch(getApiUrl('bot/move'), {
        method: 'POST',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Bot move request failed: ${response.status}`);
      }

      const data = await response.json();
      console.log('🤖 Bot move response:', data);

      if (data.success && data.move && gameStatusRef.current === 'playing') {
        // Create a temporary chess instance to parse the move
        const tempChess = new Chess(currentFen);
        const moveObj = tempChess.move(data.move, { sloppy: true });

        if (moveObj) {
          // Use the FEN from the response for accuracy
          const finalFen = data.fen || tempChess.fen();
          const finalChess = new Chess(finalFen);

          console.log('🤖 Bot move executed:', moveObj.san);
          console.log('🤖 New FEN:', finalFen);

          // Batch all state updates together to prevent flashing
          setGame(finalChess);
          setFen(finalFen);
          setMoveHistory(prev => [...prev, moveObj.san]);
          setIsPlayerTurn(true);
          setLastMove({ from: moveObj.from, to: moveObj.to });
          setSelectedSquare(null);
          setLegalMoves([]);

          // Check for game over
          const isGameOver = finalChess.game_over();
          if (isGameOver) {
            let result = '';
            if (finalChess.in_checkmate()) {
              result = 'Checkmate - Bot wins!';
            } else if (finalChess.in_stalemate()) {
              result = 'Stalemate - Draw!';
            } else if (finalChess.in_draw()) {
              result = 'Draw!';
            }

            setGameStatus('finished');
            setGameResult(result);
            setIsPlayerTurn(false);
          }

          setIsThinking(false);
          
          // Stop bot timer
          if (botTimerRef.current) {
            clearInterval(botTimerRef.current);
            botTimerRef.current = null;
            console.log('⏰ Bot timer stopped');
          }

          // Start player timer if game continues
          if (!finalChess.game_over()) {
            startPlayerTimer();
            console.log('⏰ Player timer started after bot move');
          }
        } else {
          console.error('🤖 Failed to execute bot move:', data.move);
          setIsThinking(false);
          if (botTimerRef.current) {
            clearInterval(botTimerRef.current);
            botTimerRef.current = null;
          }
          startPlayerTimer(); // Give control back to player
        }
      } else if (data.gameOver) {
        console.log('🤖 Game over detected by bot');
        setGameStatus('finished');
        setGameResult(data.result === 'checkmate' ? 'Checkmate - Bot wins!' : 
                     data.result === 'draw' ? 'Draw!' : 
                     data.result === 'stalemate' ? 'Stalemate - Draw!' : 'Game Over');
        setIsPlayerTurn(false);
        setIsThinking(false);
        if (botTimerRef.current) {
          clearInterval(botTimerRef.current);
          botTimerRef.current = null;
        }
        if (playerTimerRef.current) {
          clearInterval(playerTimerRef.current);
          playerTimerRef.current = null;
        }
      } else {
        console.error('🤖 Invalid bot response:', data);
        setIsThinking(false);
        if (botTimerRef.current) {
          clearInterval(botTimerRef.current);
          botTimerRef.current = null;
        }
        startPlayerTimer(); // Give control back to player
      }
    } catch (error) {
      console.error('🤖 Bot move failed:', error);
      setIsThinking(false);
      // Fallback: try to make a random legal move
      try {
        const newChess = new Chess(currentFen);
        const moves = newChess.moves();
        if (moves.length > 0) {
          const randomMove = moves[Math.floor(Math.random() * moves.length)];
          const move = newChess.move(randomMove);

          if (move) {
            console.log('🤖 Using fallback random move:', move.san);
            setTimeout(() => {
              setGame(newChess);
              setFen(newChess.fen());
              setMoveHistory(prev => [...prev, move.san]);
              setIsPlayerTurn(true);
              setLastMove({ from: move.from, to: move.to });
              setSelectedSquare(null);
              setLegalMoves([]);
              setIsThinking(false);
              if (botTimerRef.current) {
                clearInterval(botTimerRef.current);
                botTimerRef.current = null;
              }
              if (!newChess.game_over()) {
                startPlayerTimer();
              }
            }, 100);
          }
        } else {
          console.error('🤖 No legal moves available for fallback');
          setIsThinking(false);
          if (botTimerRef.current) {
            clearInterval(botTimerRef.current);
            botTimerRef.current = null;
          }
          startPlayerTimer(); // Give control back to player
        }
      } catch (fallbackError) {
        console.error('🤖 Fallback move also failed:', fallbackError);
        setIsThinking(false);
        if (botTimerRef.current) {
          clearInterval(botTimerRef.current);
          botTimerRef.current = null;
        }
        startPlayerTimer(); // Give control back to player
      }
    }
  }, [gameSettings.selectedBot, gameSettings.timeControl, startBotTimer, startPlayerTimer, stopTimers]);

  // Start new game
  const startGame = useCallback(() => {
    console.log('🎮 Starting new game with settings:', gameSettings);
    const newChess = new Chess();
    const timeInSeconds = gameSettings.timeInMinutes * 60;
    
    console.log('🎮 New chess game created:', newChess.fen());
    
    // Stop any existing timers first
    stopTimers();
    
    setGame(newChess);
    setFen(newChess.fen());
    setMoveHistory([]);
    setIsPlayerTurn(gameSettings.playerColor === 'white');
    setGameStatus('playing');
    setGameResult(null);
    setLastMove(null);
    setSelectedSquare(null);

    setPlayerTime(timeInSeconds);
    setBotTime(timeInSeconds);

    setBoardOrientation(gameSettings.playerColor);
    setLegalMoves([]);

    console.log('🎮 Game state set - Status: playing, Player turn:', gameSettings.playerColor === 'white');

    // If player is black, bot makes first move
    if (gameSettings.playerColor === 'black') {
      console.log('🎮 Player is black, bot will make first move');
      startBotTimer(); // Start bot timer for first move
      setTimeout(() => makeBotMove(newChess.fen()), 500);
    } else {
      console.log('🎮 Player is white, player will make first move');
      startPlayerTimer(); // Start player timer for first move
    }
  }, [gameSettings, startPlayerTimer, startBotTimer, stopTimers, makeBotMove]);

  // Handle player move
  const handlePlayerMove = useCallback((sourceSquare, targetSquare) => {
    if (gameStatus !== 'playing' || !isPlayerTurn || isThinking) {
      return false;
    }

    try {
      const newChess = new Chess(fen);
      const move = newChess.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: 'q' // Auto-promote to queen
      });

      if (move) {
        const newFen = newChess.fen();
        
        // Batch all state updates together to prevent flashing
        setGame(newChess);
        setFen(newFen);
        setMoveHistory(prev => [...prev, move.san]);
        setIsPlayerTurn(false);
        setLastMove({ from: move.from, to: move.to });
        setSelectedSquare(null);
        setLegalMoves([]);

        // Check for game over
        const isGameOver = newChess.game_over();
        if (isGameOver) {
          let result = '';
          if (newChess.in_checkmate()) {
            result = 'Checkmate - You win!';
          } else if (newChess.in_stalemate()) {
            result = 'Stalemate - Draw!';
          } else if (newChess.in_draw()) {
            result = 'Draw!';
          }
          setGameStatus('finished');
          setGameResult(result);
        }
        
        // Stop player timer
        if (playerTimerRef.current) {
          clearInterval(playerTimerRef.current);
          playerTimerRef.current = null;
          console.log('⏰ Player timer stopped');
        }

        // Make bot move if game continues
        if (!newChess.game_over()) {
          console.log('🎮 Player move complete, triggering bot move');
          setTimeout(() => makeBotMove(newFen), 400);
        } else {
          console.log('🎮 Game over after player move');
        }

        return true;
      }
    } catch (error) {
      console.error('Invalid move:', error);
    }

    return false;
  }, [gameStatus, isPlayerTurn, isThinking, fen, makeBotMove]);

  const handleSquareClick = useCallback((square) => {
    if (gameStatus !== 'playing' || !isPlayerTurn || isThinking) {
      return;
    }

    const currentGame = new Chess(fen);
    const piece = currentGame.get(square);
    const playerColorCode = gameSettings.playerColor === 'white' ? 'w' : 'b';

    if (selectedSquare === square) {
      setSelectedSquare(null);
      setLegalMoves([]);
      return;
    }

    if (selectedSquare) {
      const moveSuccess = handlePlayerMove(selectedSquare, square);
      if (moveSuccess) {
        setLegalMoves([]);
      } else {
        if (piece && piece.color === playerColorCode) {
          setSelectedSquare(square);
          const moves = currentGame.moves({ square, verbose: true }) || [];
          setLegalMoves(moves.map(move => move.to));
        } else {
          setSelectedSquare(null);
          setLegalMoves([]);
        }
      }
      return;
    }

    if (piece && piece.color === playerColorCode) {
      setSelectedSquare(square);
      const moves = currentGame.moves({ square, verbose: true }) || [];
      setLegalMoves(moves.map(move => move.to));
    } else {
      setSelectedSquare(null);
      setLegalMoves([]);
    }
  }, [fen, gameSettings.playerColor, gameStatus, handlePlayerMove, isPlayerTurn, isThinking, selectedSquare]);

  const handlePieceDragBegin = useCallback((piece, sourceSquare) => {
    if (gameStatus !== 'playing' || !isPlayerTurn || isThinking) {
      return false;
    }
    if (selectedSquare) {
      setSelectedSquare(null);
    }
    setLegalMoves([]);
    return true;
  }, [gameStatus, isPlayerTurn, isThinking, selectedSquare]);

  const handlePieceDragEnd = useCallback(() => {
    setSelectedSquare(null);
    setLegalMoves([]);
  }, []);


  // Reset game
  const resetGame = useCallback(() => {
    stopTimers();
    const timeInSeconds = gameSettings.timeInMinutes * 60;
    setGame(new Chess());
    setFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
    setMoveHistory([]);
    setIsPlayerTurn(true);
    setGameStatus('menu');
    setGameResult(null);
    setLastMove(null);
    setPlayerTime(timeInSeconds);
    setBotTime(timeInSeconds);
    setLegalMoves([]);
    setIsThinking(false);
    setSelectedSquare(null);
  }, [stopTimers, gameSettings.timeInMinutes]);

  // Resign game function
  const resignGame = useCallback(() => {
    if (gameStatus !== 'playing') return;
    
    if (window.confirm('Are you sure you want to resign? This will end the game.')) {
      stopTimers();
      setGameStatus('finished');
      setGameResult('You resigned - Bot wins!');
    }
  }, [gameStatus, stopTimers]);

  // Analyze game function
  const analyzeGame = useCallback(() => {
    if (moveHistory.length === 0) {
      alert('No moves to analyze yet!');
      return;
    }

    console.log('Analyzing game with moves:', moveHistory);

    // Create a complete PGN string
    let pgnMoves = '';
    const chess = new Chess();
    
    console.log('Generating PGN from moves:', moveHistory);
    
    // Play all moves to generate proper PGN
    for (const move of moveHistory) {
      try {
        const result = chess.move(move, { sloppy: true });
        if (result) {
          pgnMoves += result.san + ' ';
          console.log('Added move to PGN:', result.san);
        } else {
          console.error('Failed to play move:', move);
        }
      } catch (error) {
        console.error('Error playing move for PGN:', move, error);
      }
    }
    
    console.log('Generated PGN moves:', pgnMoves.trim());

    // Create complete PGN with headers
    const pgn = `[Event "Bot Game Analysis"]
[Site "ChessRep"]
[Date "${new Date().toISOString().split('T')[0]}"]
[Round "1"]
[White "${gameSettings.playerColor === 'white' ? 'Player' : gameSettings.selectedBot?.name || 'Bot'}"]
[Black "${gameSettings.playerColor === 'black' ? 'Player' : gameSettings.selectedBot?.name || 'Bot'}"]
[Result "${gameResult || '*'}"]
[TimeControl "${gameSettings.timeInMinutes * 60}"]

${pgnMoves.trim()}`;

    console.log('Generated PGN:', pgn);
    console.log('Generated PGN length:', pgn.length);
    console.log('Generated PGN first 200 chars:', pgn.substring(0, 200));

    // Prepare game data for analysis
    const gameData = {
      moves: moveHistory,
      pgn: pgn,
      result: gameResult,
      fen: fen,
      playerColor: gameSettings.playerColor,
      botName: gameSettings.selectedBot?.name || 'Bot',
      botElo: gameSettings.selectedBot?.elo || 1400,
      timeControl: gameSettings.timeControl,
      gameHistory: moveHistory.map((move, index) => ({
        move: move,
        moveNumber: Math.floor(index / 2) + 1,
        isWhite: index % 2 === 0
      }))
    };

    // Navigate to dedicated analysis page with full context
    const params = new URLSearchParams();
    params.set('pgn', pgn);
    params.set('fen', fen);
    params.set('startFen', 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
    params.set('orientation', boardOrientation);
    params.set('label', `You vs ${gameSettings.selectedBot?.name || 'Bot'}`);
    navigate(`/analysis?${params.toString()}`);
  }, [gameStatus, gameSettings, navigate, fen, boardOrientation]);

  // Debug timer state
  useEffect(() => {
    console.log('Game state updated:', {
      gameStatus: gameStatus,
      playerTime: playerTime,
      botTime: botTime,
      isPlayerTurn: isPlayerTurn,
      playerTimerActive: !!playerTimerRef.current,
      botTimerActive: !!botTimerRef.current
    });
  }, [gameStatus, playerTime, botTime, isPlayerTurn]);

  // Monitor timer state and ensure correct timer is running
  useEffect(() => {
    if (gameStatus === 'playing') {
      if (isPlayerTurn && !playerTimerRef.current) {
        console.log('Player turn but no player timer running, starting it...');
        startPlayerTimer();
      } else if (!isPlayerTurn && !botTimerRef.current && !isThinking) {
        console.log('Bot turn but no bot timer running, starting it...');
        startBotTimer();
      }
    }
  }, [gameStatus, isPlayerTurn, isThinking, startPlayerTimer, startBotTimer]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTimers();
    };
  }, [stopTimers]);

  // Memoize all style objects to prevent recreation and flashing
  const customBoardStyle = useMemo(() => ({
    borderRadius: '6px',
    width: '100%',
    height: '100%',
    transform: 'translateZ(0)',
    backfaceVisibility: 'hidden',
    willChange: 'auto',
    backgroundColor: '#f0d9b5', // Match light square color to prevent flashing
    opacity: 1,
    transition: 'none',
    ...TOUCH_BOARD_STYLE
  }), []);

  const customDarkSquareStyle = useMemo(() => ({
    backgroundColor: '#b58863',
    transition: 'none'
  }), []);
  const customLightSquareStyle = useMemo(() => ({
    backgroundColor: '#f0d9b5',
    transition: 'none'
  }), []);

  const customSquareStyles = useMemo(() => {
    const styles = {};

    if (lastMove) {
      styles[lastMove.from] = {
        backgroundColor: 'rgba(250, 204, 21, 0.35)'
      };
      styles[lastMove.to] = {
        backgroundColor: 'rgba(250, 204, 21, 0.35)'
      };
    }

    legalMoves.forEach((square) => {
      styles[square] = {
        ...styles[square],
        backgroundColor: 'rgba(59, 130, 246, 0.28)'
      };
    });

    if (selectedSquare) {
      styles[selectedSquare] = {
        ...styles[selectedSquare],
        backgroundColor: 'rgba(34, 197, 94, 0.28)',
        boxShadow: 'inset 0 0 0 2px rgba(34, 197, 94, 0.6)'
      };
    }

    return styles;
  }, [legalMoves, selectedSquare, lastMove]);

  const boardWrapperStyle = useMemo(() => ({
    backgroundColor: '#f0d9b5',
    padding: '20px',
    borderRadius: '20px'
  }), []);

  const boardContainerStyle = useMemo(() => ({
    width: boardSize,
    height: boardSize,
    margin: '0 auto',
    border: '3px solid #374151',
    borderRadius: '16px',
    overflow: 'hidden',
    flexShrink: 0,
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1)',
    backgroundColor: '#f0d9b5',
    position: 'relative',
    display: 'block',
    visibility: 'visible',
    zIndex: 1,
    // Performance optimizations
    willChange: 'transform',
    transform: 'translateZ(0)', // Force hardware acceleration
    backfaceVisibility: 'hidden',
    perspective: '1000px',
    ...TOUCH_BOARD_STYLE
  }), [boardSize]);

  const arePiecesDraggable = gameStatus === 'playing' && !isThinking && isPlayerTurn;

  const chessBoardElement = useMemo(() => (
    <ProductionChessBoard
      id="play-with-bot-board"
      position={fen}
      onMove={handlePlayerMove}
      onSquareClick={handleSquareClick}
      onPieceDragBegin={handlePieceDragBegin}
      onPieceDragEnd={handlePieceDragEnd}
      boardOrientation={boardOrientation}
      arePiecesDraggable={arePiecesDraggable}
      areArrowsAllowed={true}
      showLegalMoves={true}
      animationDuration={0}
      boardWidth={boardSize}
      customBoardStyle={customBoardStyle}
      customSquareStyles={customSquareStyles}
      customDarkSquareStyle={customDarkSquareStyle}
      customLightSquareStyle={customLightSquareStyle}
      showBoardNotation={true}
      allowDragOutsideBoard={false}
    />
  ), [
    fen,
    handlePlayerMove,
    handleSquareClick,
    handlePieceDragBegin,
    handlePieceDragEnd,
    boardOrientation,
    arePiecesDraggable,
    boardSize,
    customBoardStyle,
    customSquareStyles,
    customDarkSquareStyle,
    customLightSquareStyle
  ]);


  // Menu screen renderer (not a React component to avoid remounts)
  const renderMenuScreen = () => (
    <div className="max-w-4xl mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-4 flex items-center justify-center gap-3">
          <Bot className="text-blue-600" size={40} />
          Play with Bot
        </h1>
        <p className="text-gray-600 text-lg">Choose your opponent and game settings</p>
      </div>

      {/* Bot Selection */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2 text-gray-800">
          <Crown className="text-yellow-500" size={24} />
          Select Your Opponent
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {availableBots.map((bot) => (
            <div
              key={bot.id}
              className={`group relative p-6 border-2 rounded-xl cursor-pointer transition-all hover:shadow-lg ${
                gameSettings.selectedBot?.id === bot.id
                  ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-blue-100 shadow-md'
                  : 'border-gray-200 hover:border-blue-300 bg-white'
              }`}
              onClick={() => setGameSettings(prev => ({ ...prev, selectedBot: bot }))}
              title={bot.hoverDescription}
            >
              <div className="text-center relative">
                <div className="relative inline-block mb-3">
                  <img 
                    src={bot.avatar} 
                    alt={bot.name}
                    className="mx-auto w-20 h-20 rounded-full object-cover border-3 border-gray-300 shadow-sm"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                  <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 hidden items-center justify-center">
                    <Bot className="text-white" size={40} />
                  </div>
                  {gameSettings.selectedBot?.id === bot.id && (
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">✓</span>
                    </div>
                  )}
                </div>
                <h3 className="font-bold text-lg text-gray-900 mb-1">{`${bot.name} • ${bot.elo} • ${bot.level}`}</h3>
                <p className="text-sm text-gray-600 mb-3 min-h-[40px]">{bot.description}</p>
                <div className="flex items-center justify-center gap-2 flex-wrap">
                  <div className="text-xs font-semibold bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1.5 rounded-full shadow-sm">
                    {bot.elo} ELO
                  </div>
                  <div className="text-xs font-semibold bg-gradient-to-r from-blue-400 to-purple-500 text-white px-3 py-1.5 rounded-full shadow-sm">
                    {bot.level}
                  </div>
                </div>
                
                {/* Hover Tooltip */}
                <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 pointer-events-none">
                  <div className="font-semibold mb-1">{bot.name} ({bot.elo} ELO)</div>
                  <p className="text-gray-300 leading-relaxed">{bot.hoverDescription}</p>
                  <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Color Selection */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2 text-gray-800">
          <User className="text-green-500" size={24} />
          Choose Your Color
        </h2>
        <div className="flex gap-4 justify-center">
          {['white', 'black'].map((color) => (
            <button
              key={color}
              className={`px-6 py-3 rounded-lg border-2 transition-all ${
                gameSettings.playerColor === color
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setGameSettings(prev => ({ ...prev, playerColor: color }))}
            >
              <div className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-full border-2 ${
                  color === 'white' ? 'bg-white border-gray-400' : 'bg-gray-800 border-gray-600'
                }`} />
                <span className="capitalize font-medium text-gray-800">{color}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Time Control */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2 text-gray-800">
          <Clock className="text-purple-500" size={24} />
          Time Control
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {timeControls.map((control) => (
            <button
              key={control.id}
              className={`p-4 rounded-lg border-2 transition-all ${
                gameSettings.timeControl === control.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setGameSettings(prev => ({
                ...prev,
                timeControl: control.id,
                timeInMinutes: control.defaultTime
              }))}
            >
              <h3 className="font-semibold text-gray-800">{control.name}</h3>
              <p className="text-sm text-gray-600">{control.description}</p>
            </button>
          ))}
        </div>
        
        <div className="flex items-center justify-center gap-4">
          <label className="font-medium text-gray-800">Custom time (minutes):</label>
          <input
            type="number"
            min="1"
            max="180"
            value={gameSettings.timeInMinutes}
            onChange={(e) => setGameSettings(prev => ({ 
              ...prev, 
              timeInMinutes: parseInt(e.target.value) || 10 
            }))}
            className="px-3 py-2 border rounded-lg w-20 text-center text-gray-800"
          />
        </div>
      </div>

      {/* Start Game Button */}
      <div className="text-center">
        <button
          onClick={startGame}
          disabled={!gameSettings.selectedBot}
          className={`px-8 py-4 rounded-lg font-semibold text-lg transition-all ${
            gameSettings.selectedBot
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          <Play className="inline mr-2" size={20} />
          Start Game
        </button>
      </div>
    </div>
  );

  // Game screen renderer (kept as function to avoid component remounts)
  const renderGameScreen = () => (
    <div className="max-w-6xl mx-auto p-6">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6" style={{ minHeight: '700px' }}>
        {/* Game Info Sidebar - Fixed Layout */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-lg p-6 h-full" style={{ minHeight: '700px' }}>
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Game Info</h2>
            
            {/* Players */}
            <div className="space-y-4 mb-6">
              <div className={`p-3 rounded-lg ${isPlayerTurn ? 'bg-green-100' : 'bg-gray-100'}`}>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-800">You</span>
                  <span className="text-sm text-gray-600">({gameSettings.playerColor})</span>
                </div>
                <div className="text-lg font-mono flex items-center gap-2 text-gray-800">
                  {formatTime(playerTime)}
                  {isPlayerTurn && gameStatus === 'playing' && (
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  )}
                </div>
              </div>
              
              <div className={`p-3 rounded-lg ${!isPlayerTurn && gameStatus === 'playing' ? 'bg-blue-100' : 'bg-gray-100'}`}>
                <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <img
                    src={gameSettings.selectedBot?.avatar}
                    alt={gameSettings.selectedBot?.name}
                    className="w-6 h-6 rounded-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                  <div className="flex flex-col">
                    <span className="font-medium text-gray-800">{gameSettings.selectedBot?.name}</span>
                    <span className="text-xs text-gray-500">
                      {gameSettings.selectedBot ? `${gameSettings.selectedBot.elo} • ${gameSettings.selectedBot.level}` : ''}
                    </span>
                  </div>
                </div>
                  <span className="text-sm text-gray-600">({gameSettings.playerColor === 'white' ? 'black' : 'white'})</span>
                </div>
                <div className="text-lg font-mono flex items-center gap-2 text-gray-800">
                  {formatTime(botTime)}
                  {!isPlayerTurn && gameStatus === 'playing' && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  )}
                </div>
                {isThinking && (
                  <div className="text-sm text-blue-600 mt-1">Thinking...</div>
                )}
              </div>
            </div>

            {/* Game Status - Enhanced */}
            {gameResult && (
              <div className="mb-6 p-4 bg-gradient-to-r from-yellow-100 to-orange-100 rounded-lg border border-yellow-200">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <div className="font-semibold text-yellow-800">Game Over</div>
                </div>
                <div className="text-sm text-yellow-700 font-medium">{gameResult}</div>
              </div>
            )}

            {/* Controls - Enhanced */}
            <div className="space-y-3 mb-6">
              {gameStatus === 'playing' && (
                <button
                  onClick={resignGame}
                  className="w-full px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center font-medium"
                >
                  <span className="mr-2">🏳️</span>
                  Resign
                </button>
              )}
              
              <button
                onClick={handleSaveGame}
                disabled={moveHistory.length === 0}
                className="w-full px-4 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="mr-2" size={16} />
                Save Game
              </button>

              <button
                onClick={resetGame}
                className="w-full px-4 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-lg hover:from-gray-700 hover:to-gray-800 transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center font-medium"
              >
                <RotateCcw className="mr-2" size={16} />
                New Game
              </button>
              
              {gameStatus === 'finished' && moveHistory.length > 0 && (
                <button
                  onClick={analyzeGame}
                  className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center font-medium"
                >
                  <BarChart3 className="mr-2" size={16} />
                  Analyze Game
                </button>
              )}
            </div>

            {/* Move History - Enhanced Scrollable Layout */}
            <div className="mt-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-800">Move History</h3>
                <span className="text-xs text-gray-500">
                  {moveHistory.length} moves
                </span>
              </div>
              <div className="bg-gray-50 rounded-lg border border-gray-200" style={{ height: '250px' }}>
                <div className="h-full overflow-y-auto p-3 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                  {moveHistory.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                      <p className="text-sm">No moves yet</p>
                      <p className="text-xs mt-1">Make your first move to start the game</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {Array.from({ length: Math.ceil(moveHistory.length / 2) }, (_, moveIndex) => (
                        <div key={moveIndex} className="flex items-center space-x-2 py-1">
                          <span className="w-8 text-gray-500 font-medium text-xs text-right flex-shrink-0">
                            {moveIndex + 1}.
                          </span>
                          <div className="flex space-x-1 flex-1 min-w-0">
                            <span className="px-3 py-1 bg-white rounded border text-gray-800 font-medium min-w-[4rem] text-center text-sm hover:bg-gray-50 transition-colors flex-shrink-0">
                              {moveHistory[moveIndex * 2] || ''}
                            </span>
                            <span className="px-3 py-1 bg-white rounded border text-gray-600 font-medium min-w-[4rem] text-center text-sm hover:bg-gray-50 transition-colors flex-shrink-0">
                              {moveHistory[moveIndex * 2 + 1] || ''}
                    </span>
                          </div>
                  </div>
                ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Chess Board - Optimized to prevent flashing */}
        <div className="lg:col-span-3 order-2 lg:order-1">
          <div className="rounded-lg p-3 sm:p-6 shadow-sm" style={{ backgroundColor: '#f0d9b5' }}>
            {game && fen ? (
              <div className="flex justify-center" style={boardWrapperStyle}>
                <div style={boardContainerStyle}>
                  {chessBoardElement}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 sm:h-96 bg-gray-50 rounded-lg">
                <div className="text-center">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-200 rounded-full flex items-center justify-center mb-3 sm:mb-4 mx-auto">
                    <Bot className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500 text-sm sm:text-base">Loading game...</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // Main render
  return (
    <div className="min-h-screen bg-gray-50">
      {gameStatus === 'menu' ? renderMenuScreen() : renderGameScreen()}
    </div>
  );
};

export default PlayWithBotPage;