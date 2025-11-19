import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import ProductionChessBoard from './ProductionChessBoard';
import { Chess } from 'chess.js';
import { useAuth } from '../contexts/AuthContext';
import { Bot, Settings, Play, Pause, RotateCcw, BarChart3, Clock, Brain, Zap, Target, ExternalLink, Trophy, Save } from 'lucide-react';
import Stockfish from 'stockfish.js';

const API_BASE = 'http://localhost:3001/api/bot';

const PlayWithBotPage = () => {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [game, setGame] = useState(null);
  const [fen, setFen] = useState('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [userRating, setUserRating] = useState(null);
  const [gameMode, setGameMode] = useState('bot-selection'); // 'bot-selection', 'side-selection', 'playing', 'finished'
  const [selectedBot, setSelectedBot] = useState(null);
  const [botDifficulty, setBotDifficulty] = useState(1200);
  const [botPersonality, setBotPersonality] = useState('balanced');
  const [timeControl, setTimeControl] = useState('rapid');
  const [userTime, setUserTime] = useState(600); // 10 minutes in seconds
  const [botTime, setBotTime] = useState(600);
  const [isUserTurn, setIsUserTurn] = useState(true);
  const [gameHistory, setGameHistory] = useState([]);
  const [moveHistory, setMoveHistory] = useState([]);
  const [gameResult, setGameResult] = useState(null);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [analysisData, setAnalysisData] = useState(null);
  const [drawnArrows, setDrawnArrows] = useState([]);
  const [highlightedSquares, setHighlightedSquares] = useState([]);
  const [legalMoves, setLegalMoves] = useState([]);
  const [lastMove, setLastMove] = useState(null);
  const [boardSize, setBoardSize] = useState(640);
  const [boardOrientation, setBoardOrientation] = useState('white');
  const [isGamePaused, setIsGamePaused] = useState(false);
  const [isBoardFlipped, setIsBoardFlipped] = useState(false);
  const [stockfish, setStockfish] = useState(null);
  const [isStockfishReady, setIsStockfishReady] = useState(false);
  const moveSoundRef = useRef(null);
  const captureSoundRef = useRef(null);
  const castleSoundRef = useRef(null);
  const userTimerRef = useRef(null);
  const botTimerRef = useRef(null);

  const botPersonalities = [
    {
      id: 'magnus',
      name: 'Magnus',
      rating: 2800,
      personality: 'balanced',
      description: 'World Champion level play with exceptional endgame technique',
      image: '/images/bots/bot1.png',
      specialties: ['Endgames', 'Positional Play', 'Precision'],
      playStyle: 'Universal genius with incredible calculation depth',
      difficulty: 'Grandmaster'
    },
    {
      id: 'kasparov',
      name: 'Garry',
      rating: 2750,
      personality: 'aggressive',
      description: 'Dynamic attacking chess with deep preparation',
      image: '/images/bots/bot2.png',
      specialties: ['Tactics', 'Attack', 'Opening Theory'],
      playStyle: 'Aggressive and tactical, loves complex positions',
      difficulty: 'Grandmaster'
    },
    {
      id: 'capablanca',
      name: 'José',
      rating: 2700,
      personality: 'positional',
      description: 'Natural positional understanding and simple moves',
      image: '/images/bots/bot3.png',
      specialties: ['Positional Play', 'Endgames', 'Simplification'],
      playStyle: 'Crystal clear positional play, makes it look easy',
      difficulty: 'Master'
    },
    {
      id: 'tal',
      name: 'Mikhail',
      rating: 2680,
      personality: 'tactical',
      description: 'The magician from Riga, master of tactical complications',
      image: '/images/bots/bot4.png',
      specialties: ['Tactics', 'Sacrifices', 'Complications'],
      playStyle: 'Brilliant tactical wizard, loves sacrificial attacks',
      difficulty: 'Master'
    },
    {
      id: 'fischer',
      name: 'Bobby',
      rating: 2720,
      personality: 'balanced',
      description: 'Perfect technique and fighting spirit',
      image: '/images/bots/bot5.png',
      specialties: ['Technique', 'Calculation', 'Fighting Spirit'],
      playStyle: 'Technically perfect with incredible fighting spirit',
      difficulty: 'Master'
    },
    {
      id: 'petrosian',
      name: 'Tigran',
      rating: 2650,
      personality: 'defensive',
      description: 'Iron logic and prophylactic thinking',
      image: '/images/bots/bot6.png',
      specialties: ['Defense', 'Prophylaxis', 'Strategy'],
      playStyle: 'Defensive genius, prevents opponent plans',
      difficulty: 'Master'
    },
    {
      id: 'alekhine',
      name: 'Alexander',
      rating: 2660,
      personality: 'aggressive',
      description: 'Dynamic play with creative combinations',
      image: '/images/bots/bot7.png',
      specialties: ['Creativity', 'Dynamics', 'Combinations'],
      playStyle: 'Creative and dynamic, finds unexpected resources',
      difficulty: 'Expert'
    },
    {
      id: 'botvinnik',
      name: 'Mikhail B.',
      rating: 2620,
      personality: 'positional',
      description: 'Scientific approach to chess with deep preparation',
      image: '/images/bots/bot8.png',
      specialties: ['Preparation', 'Strategy', 'Method'],
      playStyle: 'Scientific and methodical approach to every position',
      difficulty: 'Expert'
    },
    {
      id: 'karpov',
      name: 'Anatoly',
      rating: 2640,
      personality: 'positional',
      description: 'Refined positional play and perfect technique',
      image: '/images/bots/bot9.png',
      specialties: ['Positional Play', 'Technique', 'Patience'],
      playStyle: 'Refined positional master with perfect technique',
      difficulty: 'Expert'
    },
    {
      id: 'spassky',
      name: 'Boris',
      rating: 2600,
      personality: 'balanced',
      description: 'Universal style with both tactical and positional strength',
      image: '/images/bots/bot10.png',
      specialties: ['Universal Play', 'Adaptability', 'Balance'],
      playStyle: 'Universal player, adapts to any position type',
      difficulty: 'Expert'
    },
    {
      id: 'morphy',
      name: 'Paul',
      rating: 2580,
      personality: 'tactical',
      description: 'Rapid development and brilliant tactical vision',
      image: '/images/bots/bot11.png',
      specialties: ['Development', 'Tactics', 'Speed'],
      playStyle: 'Lightning-fast development and tactical brilliance',
      difficulty: 'Advanced'
    },
    {
      id: 'lasker',
      name: 'Emanuel',
      rating: 2560,
      personality: 'balanced',
      description: 'Practical play and fighting chess',
      image: '/images/bots/bot12.png',
      specialties: ['Practical Play', 'Psychology', 'Fighting'],
      playStyle: 'Practical fighter who finds the best practical chances',
      difficulty: 'Advanced'
    },
    {
      id: 'steinitz',
      name: 'Wilhelm',
      rating: 2520,
      personality: 'positional',
      description: 'Father of positional chess and strategic principles',
      image: '/images/bots/bot13.png',
      specialties: ['Strategy', 'Principles', 'Foundation'],
      playStyle: 'Strategic pioneer, plays by fundamental principles',
      difficulty: 'Advanced'
    },
    {
      id: 'rookie',
      name: 'Rookie',
      rating: 1400,
      personality: 'balanced',
      description: 'Learning the game, makes beginner mistakes but tries hard',
      image: '/images/bots/bot14.png',
      specialties: ['Learning', 'Basics', 'Improvement'],
      playStyle: 'Still learning but enthusiastic and improving',
      difficulty: 'Intermediate'
    },
    {
      id: 'student',
      name: 'Student',
      rating: 1200,
      personality: 'defensive',
      description: 'Cautious player who focuses on not making big mistakes',
      image: '/images/bots/bot15.png',
      specialties: ['Caution', 'Safety', 'Solid Play'],
      playStyle: 'Plays it safe, avoids complications',
      difficulty: 'Intermediate'
    },
    {
      id: 'beginner',
      name: 'Newbie',
      rating: 800,
      personality: 'aggressive',
      description: 'Just started playing, loves to attack but makes errors',
      image: '/images/bots/bot16.png',
      specialties: ['Enthusiasm', 'Attack', 'Learning'],
      playStyle: 'Enthusiastic attacker, still learning the basics',
      difficulty: 'Beginner'
    }
  ];

  useEffect(() => {
    const updateBoardSize = () => {
      if (typeof window === 'undefined') return;
      const width = Math.min(620, Math.max(320, window.innerWidth - 48));
      setBoardSize(width);
    };

    updateBoardSize();
    window.addEventListener('resize', updateBoardSize);
    return () => window.removeEventListener('resize', updateBoardSize);
  }, []);

  const timeControls = [
    { id: 'blitz', name: 'Blitz (3+2)', userTime: 180, botTime: 180, desc: 'Fast-paced 3 minutes with 2 second increment' },
    { id: 'rapid', name: 'Rapid (10+0)', userTime: 600, botTime: 600, desc: 'Classic 10 minutes per player' },
    { id: 'classical', name: 'Classical (15+10)', userTime: 900, botTime: 900, desc: 'Longer time for deep thinking' }
  ];

  useEffect(() => {
    // Initialize Stockfish
    const initStockfish = () => {
      try {
        const engine = new Stockfish();
        setStockfish(engine);
        
        engine.onmessage = (event) => {
          const message = event.data || event;
          console.log('Stockfish message:', message);
          if (message === 'uciok') {
            setIsStockfishReady(true);
            console.log('Stockfish engine ready!');
          }
        };
        
        // Initialize UCI
        engine.postMessage('uci');
      } catch (error) {
        console.error('Failed to initialize Stockfish:', error);
      }
    };
    
    initStockfish();
    
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

  // Keyboard event listener for flipping board
  useEffect(() => {
    const handleKeyPress = (event) => {
      if (event.key.toLowerCase() === 'f' && gameMode === 'playing') {
        flipBoard();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [gameMode]);

  useEffect(() => {
    if (user && user.rating) {
      setUserRating(user.rating);
    }
  }, [user]);

  useEffect(() => {
    if (gameMode === 'playing' && !isGamePaused) {
      if (isUserTurn) {
        userTimerRef.current = setInterval(() => {
          setUserTime(prev => {
            if (prev <= 1) {
              endGame('timeout', 'bot');
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        botTimerRef.current = setInterval(() => {
          setBotTime(prev => {
            if (prev <= 1) {
              endGame('timeout', 'user');
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    }

    return () => {
      if (userTimerRef.current) clearInterval(userTimerRef.current);
      if (botTimerRef.current) clearInterval(botTimerRef.current);
    };
  }, [gameMode, isUserTurn, isGamePaused]);

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
        if (data.rating) {
          setUserRating(data.rating);
        }
      }
    } catch (error) {
      console.error('Error fetching user rating:', error);
    }
  };

  const startGame = async () => {
    if (!selectedBot) return;
    
    const selectedTimeControl = timeControls.find(t => t.id === timeControl);
    setUserTime(selectedTimeControl.userTime);
    setBotTime(selectedTimeControl.botTime);
    setBotDifficulty(selectedBot.rating);
    setBotPersonality(selectedBot.personality);
    setGameMode('playing');
    setIsUserTurn(boardOrientation === 'white');
    setGameHistory([]);
    setMoveHistory([]);
    setGameResult(null);
    setShowAnalysis(false);
    setAnalysisData(null);
    setIsGamePaused(false);
    setSelectedSquare(null);
    setHighlightedSquares([]);
    setLegalMoves([]);
    setLastMove(null);
    
    const newGame = new Chess();
    setGame(newGame);
    setFen(newGame.fen());
    
    setFeedback(`Game started! You play as ${boardOrientation === 'white' ? 'White' : 'Black'} against ${selectedBot.name}.`);
    
    // If bot plays first (user is black), make bot move immediately
    if (boardOrientation === 'black') {
      console.log('Bot plays first, making initial move...');
      setTimeout(() => {
        makeBotMove();
      }, 1000);
    }
  };

  const selectBot = (bot) => {
    setSelectedBot(bot);
    setGameMode('side-selection');
  };

  const goBackToBotSelection = () => {
    setSelectedBot(null);
    setGameMode('bot-selection');
  };

  const endGame = (reason, winner) => {
    setGameMode('finished');
    setIsGamePaused(true);
    
    let result;
    if (reason === 'checkmate') {
      result = winner === 'user' ? 'You won by checkmate!' : 'Bot won by checkmate!';
    } else if (reason === 'stalemate') {
      result = 'Game drawn by stalemate!';
    } else if (reason === 'timeout') {
      result = winner === 'user' ? 'Bot ran out of time! You won!' : 'You ran out of time! Bot won!';
    } else if (reason === 'draw') {
      result = 'Game drawn!';
    }
    
    setGameResult(result);
    saveGameResult(reason, winner);
  };

  const saveGameResult = async (reason, winner) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const gameData = {
        reason,
        winner,
        userRating: userRating,
        botRating: botDifficulty,
        personality: botPersonality,
        timeControl,
        moveHistory,
        gameHistory
      };

      const response = await fetch(`${API_BASE}/stats`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        body: JSON.stringify(gameData)
      });

      if (response.ok) {
        const data = await response.json();
        if (data.newRating) {
          setUserRating(data.newRating);
        }
        await refreshUser();
      }
    } catch (error) {
      console.error('Error saving game result:', error);
    }
  };


  const getDifficultyParams = (rating) => {
    const r = Math.max(800, Math.min(2600, rating || 1200));
    const depth = Math.max(2, Math.min(6, 2 + Math.floor((r - 800) / 300)));
    const t = Math.max(0, Math.min(1, (r - 800) / 1600));
    const mistakeChance = Math.max(0.03, Math.min(0.35, 0.35 - t * 0.32));
    const noise = Math.max(2, Math.min(30, Math.round(30 - t * 28)));
    const topK = Math.max(1, Math.min(5, 5 - Math.round(t * 4)));
    const depthBonusChance = Math.max(0, Math.min(0.6, 0.15 + t * 0.45));
    // Responsiveness controls
    const timeBudgetMs = Math.round(80 + 220 * t); // ~80ms at 800 → ~300ms at 2400
    const nodeBudget = Math.round(4000 + 16000 * t); // ~4k → ~20k
    const beamWidth = Math.max(6, Math.min(12, 6 + Math.round(6 * t))); // 6 → 12
    return { depth, mistakeChance, noise, topK, depthBonusChance, timeBudgetMs, nodeBudget, beamWidth };
  };

  const pieceValues = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 0 };

  const evaluatePosition = (engineGame) => {
    // Material only for speed and stability; positive favors White.
    const board = engineGame.board();
    let white = 0;
    let black = 0;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const sq = board[r][c];
        if (!sq) continue;
        const v = pieceValues[sq.type] || 0;
        if (sq.color === 'w') white += v; else black += v;
      }
    }
    return (white - black);
  };

  const orderMoves = (moves) => {
      return moves.slice().sort((a, b) => {
        const capA = a.captured ? (pieceValues[a.captured] || 0) - (pieceValues[a.piece] || 0) : 0;
        const capB = b.captured ? (pieceValues[b.captured] || 0) - (pieceValues[b.piece] || 0) : 0;
        const promoA = a.promotion ? 800 : 0;
        const promoB = b.promotion ? 800 : 0;
        const checkA = a.san && a.san.includes('+') ? 50 : 0;
        const checkB = b.san && b.san.includes('+') ? 50 : 0;
        return (capB + promoB + checkB) - (capA + promoA + checkA);
      });
    };

  const pickLocalBotMove = () => {
      try {
        const params = getDifficultyParams(botDifficulty);
        const engineGame = new Chess(game.fen());
        const cache = new Map();
        const startTime = (typeof performance !== 'undefined' ? performance.now() : Date.now());
        let nodesVisited = 0;

        const overBudget = () => {
          const now = (typeof performance !== 'undefined' ? performance.now() : Date.now());
          return (now - startTime) > params.timeBudgetMs || nodesVisited > params.nodeBudget;
        };

        const keyOf = (g, d, a, b) => `${g.fen()}|${d}|${a}|${b}`;

        const terminalEval = () => {
          if (engineGame.isCheckmate()) {
            return engineGame.turn() === 'w' ? -99999 : 99999;
          }
          if (engineGame.isDraw() || engineGame.isStalemate() || engineGame.isInsufficientMaterial()) {
            return 0;
          }
          return null;
        };

        const alphaBeta = (depth, alpha, beta) => {
          if (overBudget()) return evaluatePosition(engineGame);
          const term = terminalEval();
          if (term !== null) return term;
          if (depth === 0) return evaluatePosition(engineGame);

          let moves = orderMoves(engineGame.moves({ verbose: true }));
          if (moves.length === 0) return evaluatePosition(engineGame);
          // Beam search for responsiveness
          moves = moves.slice(0, params.beamWidth);

          const isWhiteToMove = engineGame.turn() === 'w';
          if (isWhiteToMove) {
            let value = -Infinity;
            for (let i = 0; i < moves.length; i++) {
              engineGame.move(moves[i]);
              nodesVisited++;
              const k = keyOf(engineGame, depth - 1, alpha, beta);
              let child;
              if (cache.has(k)) child = cache.get(k); else { child = alphaBeta(depth - 1, alpha, beta); cache.set(k, child); }
              engineGame.undo();
              if (child > value) value = child;
              if (value > alpha) alpha = value;
              if (alpha >= beta || overBudget()) break;
            }
            return value;
          } else {
            let value = Infinity;
            for (let i = 0; i < moves.length; i++) {
              engineGame.move(moves[i]);
              nodesVisited++;
              const k = keyOf(engineGame, depth - 1, alpha, beta);
              let child;
              if (cache.has(k)) child = cache.get(k); else { child = alphaBeta(depth - 1, alpha, beta); cache.set(k, child); }
              engineGame.undo();
              if (child < value) value = child;
              if (value < beta) beta = value;
              if (alpha >= beta || overBudget()) break;
            }
            return value;
          }
        };

        let rootMoves = orderMoves(engineGame.moves({ verbose: true }));
        if (!rootMoves || rootMoves.length === 0) return null;
        rootMoves = rootMoves.slice(0, params.beamWidth);

        const scored = [];
        const baseDepth = Math.max(1, params.depth - 1);
        const useBonus = Math.random() < params.depthBonusChance;
        const rootDepth = Math.min(7, baseDepth + (useBonus ? 1 : 0));

        for (let i = 0; i < rootMoves.length; i++) {
          const mv = rootMoves[i];
          engineGame.move(mv);
          const score = alphaBeta(rootDepth, -Infinity, Infinity);
          engineGame.undo();
          const noise = (Math.random() * 2 - 1) * params.noise;
          scored.push({ move: mv, score: score + noise });
          if (overBudget()) break;
        }

        if (scored.length === 0) {
          // As last resort, play any legal move
          const fallbackMoves = engineGame.moves({ verbose: true });
          return fallbackMoves[Math.floor(Math.random() * fallbackMoves.length)];
        }

        scored.sort((a, b) => a.score - b.score);

        let idx = 0;
        if (Math.random() < params.mistakeChance) {
          idx = Math.min(params.topK - 1, Math.floor(Math.random() * params.topK));
        }
        return scored[idx]?.move || scored[0].move;
      } catch (e) {
        const temp = new Chess(game.fen());
        const moves = temp.moves({ verbose: true });
        if (!moves || moves.length === 0) return null;
        const captures = moves.filter(m => m.flags && m.flags.includes('c'));
        const checks = moves.filter(m => m.san && m.san.includes('+'));
        const preferred = captures.length > 0 ? captures : (checks.length > 0 ? checks : moves);
        return preferred[Math.floor(Math.random() * preferred.length)];
      }
  };

  const makeBotMoveAdvanced = useCallback(async () => {
    try {
      setLoading(true);

      // Abortable fetch with timeout
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 6000);

      const response = await fetch(`${API_BASE}/move`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fen: game.fen(),
          difficulty: botDifficulty,
          personality: botPersonality,
          timeControl
        }),
        signal: controller.signal
      }).catch((err) => {
        return null;
      });

      clearTimeout(id);

      let appliedMove = null;

      if (response && response.ok) {
        try {
          const data = await response.json();
          const botMove = data && (data.move || data.bestMove || data.uci || data.san);
          if (botMove) {
            const newGame = new Chess(game.fen());
            const moveObj = typeof botMove === 'string' ? botMove : (botMove.uci || botMove.san);
            const move = newGame.move(moveObj, { sloppy: true });
            if (move) {
              appliedMove = { newGame, move };
            }
          }
        } catch (e) {
          // Will fallback
        }
      }

      if (!appliedMove) {
        const local = pickLocalBotMove();
        if (local) {
          const newGame = new Chess(game.fen());
          const move = newGame.move(local, { sloppy: true });
          if (move) {
            appliedMove = { newGame, move };
            setFeedback('Bot backend unavailable. Using local move.');
          }
        }
      }

      if (appliedMove) {
        const { newGame, move } = appliedMove;
        playMoveSound(move);
        
        // Batch state updates to prevent flashing
        const newFen = newGame.fen();
        const botMoveColor = boardOrientation === 'white' ? 'black' : 'white';
        
        // Use React's batching to update all state at once
        React.startTransition(() => {
          setGame(newGame);
          setFen(newFen);
          setMoveHistory(prev => [...prev, { move: move.san, color: botMoveColor }]);
          setGameHistory(prev => [...prev, { fen: newFen, move: move.san }]);
          setSelectedSquare(null);
          setLegalMoves([]);
          setLastMove({ from: move.from, to: move.to });
        });

        if (newGame.isCheckmate()) {
          endGame('checkmate', 'bot');
        } else if (newGame.isStalemate()) {
          endGame('stalemate');
        } else if (newGame.isDraw()) {
          endGame('draw');
        } else {
          setIsUserTurn(true);
          setFeedback('Your turn!');
        }
      } else {
        setFeedback('Bot failed to move. Please try again or restart.');
      }
    } catch (error) {
      const local = (() => {
        try {
          const temp = new Chess(game.fen());
          const mv = temp.moves({ verbose: true })[0];
          if (!mv) return null;
          const newGame = new Chess(game.fen());
          const move = newGame.move(mv, { sloppy: true });
          return move ? { newGame, move } : null;
        } catch (e) { return null; }
      })();

      if (local) {
        const { newGame, move } = local;
        playMoveSound(move);
        
        // Batch state updates to prevent flashing
        const newFen = newGame.fen();
        
        // Use React's batching to update all state at once
        React.startTransition(() => {
          setGame(newGame);
          setFen(newFen);
          setMoveHistory(prev => [...prev, { move: move.san, color: 'black' }]);
          setGameHistory(prev => [...prev, { fen: newFen, move: move.san }]);
          setSelectedSquare(null);
          setLegalMoves([]);
          setLastMove({ from: move.from, to: move.to });
        });
        
        setIsUserTurn(true);
        setFeedback('Bot backend error. Used local move.');
      } else {
        setFeedback('Error making bot move. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, [game, isUserTurn, gameMode, boardOrientation, botDifficulty, botPersonality, timeControl]);

  const makeBotMove = useCallback(async () => {
    console.log('makeBotMove called - game:', !!game, 'isUserTurn:', isUserTurn, 'gameMode:', gameMode);
    
    if (!game || isUserTurn || gameMode !== 'playing') {
      console.log('makeBotMove early return - game:', !!game, 'isUserTurn:', isUserTurn, 'gameMode:', gameMode);
      return;
    }

    console.log('Bot making move...');
    setLoading(true);
    setFeedback('Bot is thinking...');

    try {
      // Simple fallback move for now - just pick a random legal move
      const moves = game.moves({ verbose: true });
      console.log('Available moves:', moves.length);
      
      if (moves.length === 0) {
        console.log('No moves available');
        setLoading(false);
        return;
      }

      // Add a small delay to simulate thinking
      await new Promise(resolve => setTimeout(resolve, 1000));

      const randomMove = moves[Math.floor(Math.random() * moves.length)];
      console.log('Selected move:', randomMove);
      
      const newGame = new Chess(game.fen());
      const move = newGame.move(randomMove);

      if (move) {
        console.log('Bot move successful:', move.san);
        playMoveSound(move);
        
        // Batch state updates to prevent flashing
        const newFen = newGame.fen();
        const botMoveColor = boardOrientation === 'white' ? 'black' : 'white';
        
      // Use React's batching to update all state at once
      React.startTransition(() => {
        setGame(newGame);
        setFen(newFen);
        setMoveHistory(prev => [...prev, { move: move.san, color: botMoveColor }]);
        setGameHistory(prev => [...prev, { fen: newFen, move: move.san }]);
        setSelectedSquare(null);
        setLegalMoves([]);
        setLastMove({ from: move.from, to: move.to });
      });

        if (newGame.isCheckmate()) {
          endGame('checkmate', 'bot');
        } else if (newGame.isStalemate()) {
          endGame('stalemate');
        } else if (newGame.isDraw()) {
          endGame('draw');
        } else {
          setIsUserTurn(true);
          setFeedback('Your turn');
        }
      } else {
        console.log('Bot move failed');
        setFeedback('Bot move failed');
      }
    } catch (error) {
      console.error('Error making bot move:', error);
      setFeedback('Error making bot move');
    } finally {
      setLoading(false);
    }
  }, [game, isUserTurn, gameMode, boardOrientation]);

  useEffect(() => {
    console.log('useEffect triggered - gameMode:', gameMode, 'isUserTurn:', isUserTurn, 'loading:', loading, 'isGamePaused:', isGamePaused);
    
    if (gameMode === 'playing' && !isUserTurn && !loading && !isGamePaused) {
      console.log('Bot turn detected, calling makeBotMove in 1 second...');
      const timer = setTimeout(() => {
        console.log('Calling makeBotMove now...');
        makeBotMove();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isUserTurn, gameMode, loading, isGamePaused]);

  function playMoveSound(move) {
    if (!move || !moveSoundRef.current) return;
    try {
      if (move.flags && move.flags.includes('c')) {
        captureSoundRef.current?.play().catch(e => console.warn('Could not play capture sound:', e));
      } else if (move.san === 'O-O' || move.san === 'O-O-O') {
        castleSoundRef.current?.play().catch(e => console.warn('Could not play castle sound:', e));
      } else {
        moveSoundRef.current?.play().catch(e => console.warn('Could not play move sound:', e));
      }
    } catch (error) {
      console.warn('Error playing move sound:', error);
    }
  }

  const handleMove = useCallback((from, to) => {
    console.log('handleMove called - from:', from, 'to:', to, 'isUserTurn:', isUserTurn, 'gameMode:', gameMode);
    
    if (loading || !game || !isUserTurn || gameMode !== 'playing' || isGamePaused) {
      console.log('handleMove early return - loading:', loading, 'game:', !!game, 'isUserTurn:', isUserTurn, 'gameMode:', gameMode, 'isGamePaused:', isGamePaused);
      return false;
    }
    
    // Validate that the piece being moved belongs to the current player
    const piece = game.get(from);
    const userColor = boardOrientation === 'white' ? 'w' : 'b';
    
    if (!piece || piece.color !== userColor) {
      console.log('Invalid piece selection - not user\'s piece');
      setFeedback(`You can only move your pieces (${boardOrientation === 'white' ? 'White' : 'Black'}).`);
    setLegalMoves([]);
      return false;
    }
    
    const newGame = new Chess(game.fen());
    const move = newGame.move({ from, to, promotion: 'q' });
    if (!move) {
      console.log('Invalid move from', from, 'to', to);
      setFeedback('Invalid move. Please try again.');
    setLegalMoves([]);
      return false;
    }
    
    console.log('User move successful:', move.san);
    playMoveSound(move);
    
    // Batch state updates to prevent flashing
    const newFen = newGame.fen();
    const moveColor = boardOrientation === 'white' ? 'white' : 'black';
    
    // Use React's batching to update all state at once
    React.startTransition(() => {
      setGame(newGame);
      setFen(newFen);
      setMoveHistory(prev => [...prev, { move: move.san, color: moveColor }]);
      setGameHistory(prev => [...prev, { fen: newFen, move: move.san }]);
      setSelectedSquare(null);
      setLegalMoves([]);
      setLastMove({ from, to });
    });
    
    // Check game state
    if (newGame.isCheckmate()) {
      endGame('checkmate', 'user');
    } else if (newGame.isStalemate()) {
      endGame('stalemate');
    } else if (newGame.isDraw()) {
      endGame('draw');
    } else {
      console.log('Setting isUserTurn to false, bot should move next');
      setIsUserTurn(false);
      setFeedback('Bot is thinking...');
    }
    
    return true;
  }, [loading, game, isUserTurn, gameMode, isGamePaused, boardOrientation]);

  const handleSquareClick = (square) => {
    if (loading || !game || !isUserTurn || gameMode !== 'playing' || isGamePaused) {
      return;
    }
    
  if (!selectedSquare) {
    const piece = game.get(square);
    // Determine the correct color for the user based on board orientation
    const userColor = boardOrientation === 'white' ? 'w' : 'b';
    
    if (piece && piece.color === userColor) {
      const moves = game.moves({ square, verbose: true });
      if (moves.length > 0) {
        setSelectedSquare(square);
        setLegalMoves(moves.map(move => move.to));
        setFeedback('Piece selected. Click destination.');
      } else {
        setFeedback('This piece has no legal moves.');
        setLegalMoves([]);
      }
    } else {
      if (piece) {
        setFeedback(`You can only move your pieces (${boardOrientation === 'white' ? 'White' : 'Black'}).`);
      } else {
        setFeedback('No piece on this square.');
      }
      setLegalMoves([]);
    }
  } else {
    if (selectedSquare === square) {
      setSelectedSquare(null);
      setLegalMoves([]);
      setFeedback('');
    } else {
      const success = handleMove(selectedSquare, square);
      setSelectedSquare(null);
      setLegalMoves([]);
      if (!success) {
        setFeedback('Invalid move. Please try again.');
      }
    }
  }
  };

  const handleDrawArrow = useCallback((arrow) => {
    setDrawnArrows((prev) => [...prev, arrow]);
  }, []);

  const handleClearArrows = useCallback(() => {
    setDrawnArrows([]);
  }, []);

  const allArrows = useMemo(() => {
    return drawnArrows.map(a => [a.from, a.to, a.color || '#f39c12']);
  }, [drawnArrows]);

  const handleRightClickSquare = useCallback((square) => {
    setHighlightedSquares((prev) =>
      prev.includes(square)
        ? prev.filter((s) => s !== square)
        : [...prev, square]
    );
  setLegalMoves([]);
  }, []);

  const customSquareStyles = useMemo(() => {
    const styles = {};

    if (lastMove) {
      styles[lastMove.from] = {
        ...(styles[lastMove.from] || {}),
        backgroundColor: 'rgba(250, 204, 21, 0.35)'
      };
      styles[lastMove.to] = {
        ...(styles[lastMove.to] || {}),
        backgroundColor: 'rgba(250, 204, 21, 0.35)'
      };
    }

    if (selectedSquare) {
      styles[selectedSquare] = {
        ...(styles[selectedSquare] || {}),
        backgroundColor: 'rgba(20, 85, 30, 0.35)',
        boxShadow: 'inset 0 0 0 2px rgba(34, 197, 94, 0.6)'
      };
    }

    legalMoves.forEach((sq) => {
      styles[sq] = {
        ...(styles[sq] || {}),
        backgroundColor: 'rgba(59, 130, 246, 0.28)'
      };
    });

    highlightedSquares.forEach((sq) => {
      styles[sq] = {
        ...(styles[sq] || {}),
        backgroundColor: 'rgba(255, 56, 56, 0.35)'
      };
    });

    return styles;
  }, [selectedSquare, highlightedSquares, legalMoves, lastMove]);

  const boardWidth = useMemo(() => {
    if (typeof window !== 'undefined') {
      const maxWidth = Math.max(320, window.innerWidth - 48);
      return Math.min(boardSize, maxWidth, 620);
    }
    return Math.min(boardSize, 620);
  }, [boardSize]);

  const effectiveBoardOrientation = useMemo(
    () => (isBoardFlipped ? (boardOrientation === 'white' ? 'black' : 'white') : boardOrientation),
    [isBoardFlipped, boardOrientation]
  );

  const canDragPieces = useMemo(
    () => gameMode === 'playing' && !loading && !isGamePaused && isUserTurn,
    [gameMode, loading, isGamePaused, isUserTurn]
  );

  const togglePause = () => {
    setIsGamePaused(!isGamePaused);
    setFeedback(isGamePaused ? 'Game resumed!' : 'Game paused!');
  };

  const resetGame = () => {
    setGameMode('bot-selection');
    setSelectedBot(null);
    setUserTime(600);
    setBotTime(600);
    setIsUserTurn(true);
    setGameHistory([]);
    setMoveHistory([]);
    setGameResult(null);
    setShowAnalysis(false);
    setAnalysisData(null);
    setIsGamePaused(false);
    setFeedback('');
    setSelectedSquare(null);
    setLegalMoves([]);
    setHighlightedSquares([]);
    setLastMove(null);
  };

  const flipBoard = () => {
    setIsBoardFlipped(!isBoardFlipped);
  };

  const analyzeGame = async () => {
    try {
      setLoading(true);
      
      const response = await fetch(`${API_BASE}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          gameHistory,
          userRating,
          botRating: botDifficulty
        })
      });

      if (response.ok) {
        const data = await response.json();
        setAnalysisData(data);
        setShowAnalysis(true);
      }
    } catch (error) {
      console.error('Error analyzing game:', error);
      setFeedback('Error analyzing game. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const saveGame = async () => {
    try {
      setLoading(true);
      
      // Generate PGN from game history
      const pgn = game ? game.pgn() : '';
      
      if (!pgn) {
        setFeedback('No game to save.');
        return;
      }
      
      const token = localStorage.getItem('token');
      if (!token) {
        setFeedback('Please log in to save games.');
        return;
      }
      
      const response = await fetch('http://localhost:3001/api/games/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        body: JSON.stringify({
          pgn: pgn,
          result: gameResult || '*',
          timeControl: timeControl,
          opponent: boardOrientation === 'white' ? 'black' : 'white',
          gameType: 'bot'
        })
      });

      if (response.ok) {
        setFeedback('Game saved successfully!');
      } else {
        setFeedback('Failed to save game.');
      }
    } catch (error) {
      console.error('Error saving game:', error);
      setFeedback('Error saving game. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Bot Selection Screen
  if (gameMode === 'bot-selection') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-blue-900 p-3 sm:p-4 lg:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              Choose Your Opponent
            </h1>
            <p className="text-gray-300 text-sm sm:text-base lg:text-lg">Select a bot to challenge based on their personality and skill level</p>
          </div>

          {/* User Rating */}
          {userRating !== null && (
            <div className="text-center mb-6 sm:mb-8">
              <div className="bg-gradient-to-r from-blue-500 to-cyan-600 rounded-2xl p-3 sm:p-4 shadow-lg inline-block">
                <p className="text-lg sm:text-xl font-bold text-white mb-1">Your Rating: {userRating}</p>
                <p className="text-blue-100 text-xs sm:text-sm">Current Rating</p>
              </div>
            </div>
          )}

          {/* Bot Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {botPersonalities.map((bot) => (
              <div
                key={bot.id}
                onClick={() => selectBot(bot)}
                className="group bg-gradient-to-br from-slate-800/50 to-blue-900/30 backdrop-blur-sm border border-blue-500/20 rounded-2xl p-4 sm:p-6 cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/20 hover:border-blue-400/40"
              >
                {/* Bot Image */}
                <div className="relative mb-4 mx-auto w-20 h-20 sm:w-24 sm:h-24">
                  <img
                    src={bot.image}
                    alt={bot.name}
                    className="w-full h-full rounded-full object-cover border-4 border-blue-400/30 group-hover:border-blue-400/60 transition-all duration-300"
                    onError={(e) => {
                      // Fallback to bot icon if image fails
                      e.target.style.display = 'none';
                      e.target.nextElementSibling.style.display = 'flex';
                    }}
                  />
                  <div className="hidden w-full h-full rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 items-center justify-center">
                    <Bot className="w-10 h-10 text-white" />
                  </div>
                  
                  {/* Rating Badge */}
                  <div className="absolute -top-2 -right-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                    {bot.rating}
                  </div>
                </div>

                {/* Bot Info */}
                <div className="text-center">
                  <h3 className="text-lg sm:text-xl font-bold text-white mb-2 group-hover:text-blue-200 transition-colors">
                    {bot.name}
                  </h3>
                  
                  <div className="mb-3">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                      bot.difficulty === 'Grandmaster' ? 'bg-red-500/20 text-red-300 border border-red-500/30' :
                      bot.difficulty === 'Master' ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30' :
                      bot.difficulty === 'Expert' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                      bot.difficulty === 'Advanced' ? 'bg-green-500/20 text-green-300 border border-green-500/30' :
                      bot.difficulty === 'Intermediate' ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30' :
                      'bg-gray-500/20 text-gray-300 border border-gray-500/30'
                    }`}>
                      {bot.difficulty}
                    </span>
                  </div>
                  
                  <p className="text-gray-300 text-xs sm:text-sm mb-3 line-clamp-2">
                    {bot.description}
                  </p>
                  
                  <div className="mb-3">
                    <p className="text-gray-400 text-xs mb-1">Play Style:</p>
                    <p className="text-gray-200 text-xs font-medium">{bot.playStyle}</p>
                  </div>
                  
                  {/* Specialties */}
                  <div className="flex flex-wrap gap-1 justify-center">
                    {bot.specialties.slice(0, 3).map((specialty, index) => (
                      <span
                        key={index}
                        className="bg-blue-500/20 text-blue-300 text-xs px-2 py-1 rounded-full border border-blue-500/30"
                      >
                        {specialty}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Hover Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-teal-600/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Side Selection Screen
  if (gameMode === 'side-selection') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-blue-900 p-3 sm:p-4 lg:p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              Game Setup
            </h1>
            <p className="text-gray-300 text-sm sm:text-base lg:text-lg">Configure your game against {selectedBot?.name}</p>
          </div>

          {/* Selected Bot Info */}
          {selectedBot && (
            <div className="bg-gradient-to-br from-slate-800/50 to-blue-900/30 backdrop-blur-sm border border-blue-500/20 rounded-2xl p-6 mb-8">
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="relative">
                  <img
                    src={selectedBot.image}
                    alt={selectedBot.name}
                    className="w-24 h-24 rounded-full object-cover border-4 border-blue-400/30"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextElementSibling.style.display = 'flex';
                    }}
                  />
                  <div className="hidden w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 items-center justify-center">
                    <Bot className="w-12 h-12 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-sm font-bold px-2 py-1 rounded-full shadow-lg">
                    {selectedBot.rating}
                  </div>
                </div>
                
                <div className="flex-1 text-center sm:text-left">
                  <h2 className="text-2xl font-bold text-white mb-2">{selectedBot.name}</h2>
                  <p className="text-gray-300 mb-2">{selectedBot.description}</p>
                  <p className="text-blue-200 text-sm font-medium">{selectedBot.playStyle}</p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Time Control Selection */}
            <div className="bg-gradient-to-br from-slate-800/50 to-blue-900/30 backdrop-blur-sm border border-blue-500/20 rounded-2xl p-6">
              <h2 className="text-xl font-bold mb-4 text-white flex items-center">
                <Clock className="w-6 h-6 mr-2 text-blue-400" />
                Time Control
              </h2>
              <div className="space-y-3">
                {timeControls.map((control) => (
                  <div
                    key={control.id}
                    className={`p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                      timeControl === control.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                    onClick={() => setTimeControl(control.id)}
                  >
                    <div className="font-semibold">{control.name}</div>
                    <div className="text-sm opacity-80">{control.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Side Selection */}
            <div className="bg-gradient-to-br from-slate-800/50 to-blue-900/30 backdrop-blur-sm border border-blue-500/20 rounded-2xl p-6">
              <h2 className="text-xl font-bold mb-4 text-white flex items-center">
                <Bot className="w-6 h-6 mr-2 text-blue-400" />
                Choose Your Side
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div
                  className={`p-4 rounded-lg cursor-pointer transition-all duration-200 text-center ${
                    boardOrientation === 'white'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                  onClick={() => setBoardOrientation('white')}
                >
                  <div className="text-3xl mb-2">♔</div>
                  <div className="font-semibold">Play as White</div>
                  <div className="text-sm opacity-80">You move first</div>
                </div>
                <div
                  className={`p-4 rounded-lg cursor-pointer transition-all duration-200 text-center ${
                    boardOrientation === 'black'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                  onClick={() => setBoardOrientation('black')}
                >
                  <div className="text-3xl mb-2">♚</div>
                  <div className="font-semibold">Play as Black</div>
                  <div className="text-sm opacity-80">{selectedBot?.name} moves first</div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
            <button
              onClick={goBackToBotSelection}
              className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
            >
              ← Back to Bot Selection
            </button>
            <button
              onClick={startGame}
              className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
            >
              <Play className="w-5 h-5 inline mr-2" />
              Start Game
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (gameMode === 'finished') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-blue-900 p-3 sm:p-4 lg:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              Game Over!
            </h1>
            <p className="text-gray-300 text-sm sm:text-base lg:text-lg">{gameResult}</p>
          </div>

          <div className="bg-gradient-to-br from-slate-800/50 to-blue-900/30 backdrop-blur-sm border border-blue-500/20 rounded-2xl p-4 sm:p-6 lg:p-8 text-center">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-3 sm:p-4">
                <h3 className="text-base sm:text-lg font-bold text-white mb-2">Moves Played</h3>
                <p className="text-xl sm:text-2xl font-bold text-white">{moveHistory.length}</p>
              </div>
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-3 sm:p-4">
                <h3 className="text-base sm:text-lg font-bold text-white mb-2">Game Duration</h3>
                <p className="text-xl sm:text-2xl font-bold text-white">{formatTime(600 - userTime)}</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <button
                onClick={resetGame}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 text-sm sm:text-base"
              >
                <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5 inline mr-2" />
                New Game
              </button>
              <button
                onClick={analyzeGame}
                className="bg-gradient-to-r from-teal-600 to-indigo-600 hover:from-teal-700 hover:to-indigo-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 text-sm sm:text-base"
              >
                <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 inline mr-2" />
                Analyze Game
              </button>
            </div>
          </div>

          {/* Analysis Modal */}
          {showAnalysis && analysisData && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
              <div className="bg-white rounded-2xl p-4 sm:p-6 max-w-2xl w-full max-h-96 overflow-y-auto">
                <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 text-gray-800">Game Analysis</h2>
                <div className="space-y-3 sm:space-y-4">
                  <div className="p-3 bg-gray-50 rounded">
                    <h3 className="font-semibold text-gray-800 text-sm sm:text-base">Key Moments</h3>
                    <p className="text-xs sm:text-sm text-gray-600">{analysisData.keyMoments}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded">
                    <h3 className="font-semibold text-gray-800 text-sm sm:text-base">Mistakes</h3>
                    <p className="text-xs sm:text-sm text-gray-600">{analysisData.mistakes}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded">
                    <h3 className="font-semibold text-gray-800 text-sm sm:text-base">Suggestions</h3>
                    <p className="text-xs sm:text-sm text-gray-600">{analysisData.suggestions}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAnalysis(false)}
                  className="mt-3 sm:mt-4 w-full bg-blue-600 text-white py-2 rounded-lg text-sm sm:text-base"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 p-4 sm:p-6 lg:p-8">
      <div className="max-w-8xl mx-auto">
        {/* Enhanced Header */}
        <div className="text-center mb-8 sm:mb-10">
          <div className="inline-block bg-gradient-to-r from-blue-600/20 to-cyan-600/20 backdrop-blur-sm rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-3 bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-300 bg-clip-text text-transparent">
              Playing vs {selectedBot?.name || 'Bot'}
            </h1>
            <div className="flex items-center justify-center gap-4 mb-3">
              <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full px-4 py-2 shadow-lg">
                <span className="text-lg font-bold text-white">{botDifficulty}</span>
              </div>
              {selectedBot && (
                <div className="bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full px-4 py-2 shadow-lg">
                  <span className="text-sm font-medium text-white">{selectedBot.playStyle}</span>
                </div>
              )}
            </div>
            <div className="flex items-center justify-center gap-2 text-gray-300">
              <Bot className="w-5 h-5" />
              <span className="text-sm">AI Chess Engine</span>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 sm:gap-8">
          {/* Board and info */}
          <div className="xl:col-span-4 order-2 xl:order-1 flex flex-col items-center">
            <div className="bg-gradient-to-br from-white via-gray-50 to-blue-50 rounded-3xl shadow-2xl border border-white/20 backdrop-blur-sm p-6 sm:p-8 lg:p-10 w-full">
              <div className="flex flex-col items-center w-full">
                {/* Enhanced Game Stats */}
                <div className="mb-6 sm:mb-8 w-full flex flex-wrap justify-center gap-4 sm:gap-6">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <div className="text-sm sm:text-base font-semibold text-blue-700">Your Time</div>
                    </div>
                    <div className="bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 rounded-2xl p-3 sm:p-4 shadow-xl border border-blue-400/30">
                      <div className="flex items-center justify-center gap-2">
                        <Clock className="w-4 h-4 text-blue-100" />
                        <p className="text-xl sm:text-2xl font-bold text-white">{formatTime(userTime)}</p>
                      </div>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                      <div className="text-sm sm:text-base font-semibold text-gray-700">Bot Time</div>
                    </div>
                    <div className="bg-gradient-to-r from-gray-500 via-gray-600 to-gray-700 rounded-2xl p-3 sm:p-4 shadow-xl border border-gray-400/30">
                      <div className="flex items-center justify-center gap-2">
                        <Bot className="w-4 h-4 text-gray-100" />
                        <p className="text-xl sm:text-2xl font-bold text-white">{formatTime(botTime)}</p>
                      </div>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <div className="w-3 h-3 bg-teal-500 rounded-full"></div>
                      <div className="text-sm sm:text-base font-semibold text-teal-700">Moves</div>
                    </div>
                    <div className="bg-gradient-to-r from-teal-500 via-teal-600 to-teal-700 rounded-2xl p-3 sm:p-4 shadow-xl border border-teal-400/30">
                      <div className="flex items-center justify-center gap-2">
                        <BarChart3 className="w-4 h-4 text-teal-100" />
                        <p className="text-xl sm:text-2xl font-bold text-white">{moveHistory.length}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Board Controls */}
                <div className="mb-4 sm:mb-6 w-full max-w-md">
                  <div className="bg-white rounded-lg p-3 sm:p-4 shadow-lg border border-gray-200">
                    <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
                      {/* Flip Board Button */}
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={flipBoard}
                          className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                          title="Flip Board (F key)"
                        >
                          🔄 Flip Board
                        </button>
                        <span className="text-gray-500 text-xs">(F key)</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Enhanced Turn Indicator */}
                <div className={`mb-6 sm:mb-8 px-6 sm:px-8 py-3 sm:py-4 rounded-2xl font-bold text-base sm:text-lg lg:text-xl shadow-2xl transform transition-all duration-500 ${
                  isUserTurn
                    ? 'text-white bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 shadow-blue-500/50 border border-blue-400/30' 
                    : 'text-white bg-gradient-to-r from-gray-600 via-gray-700 to-gray-800 shadow-gray-800/50 border border-gray-500/30'
                }`}>
                  <div className="flex items-center justify-center gap-3">
                    {isUserTurn ? (
                      <>
                        <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                        <span>Your turn ({boardOrientation})</span>
                        <Target className="w-5 h-5" />
                      </>
                    ) : (
                      <>
                        <div className="w-3 h-3 bg-orange-400 rounded-full animate-pulse"></div>
                        <span>Bot is thinking ({boardOrientation === 'white' ? 'black' : 'white'})</span>
                        <Brain className="w-5 h-5 animate-pulse" />
                      </>
                    )}
                  </div>
                </div>
                
                {/* Chess Board */}
                <div className="flex justify-center">
                  <div
                    className="rounded-2xl shadow-2xl border border-gray-300/60 bg-[#f0d9b5]/70 p-2 sm:p-4"
                    style={{ 
                      width: boardWidth + 16, 
                      maxWidth: '100%',
                      // Mobile touch optimizations - critical for drag-and-drop
                      // 'none' prevents browser gestures (pan, zoom) from interfering with piece dragging
                      touchAction: 'none', // Disable browser gestures to allow proper drag handling
                      pointerEvents: 'auto', // Ensure touch events are captured
                      WebkitUserSelect: 'none',
                      MozUserSelect: 'none',
                      msUserSelect: 'none',
                      userSelect: 'none',
                      WebkitTouchCallout: 'none',
                      WebkitTapHighlightColor: 'transparent',
                      // Ensure proper z-index so board is not blocked by overlays
                      position: 'relative',
                      zIndex: 1,
                    }}
                  >
                    {game ? (
                      <ProductionChessBoard
                        position={fen}
                        onMove={handleMove}
                        onSquareClick={handleSquareClick}
                        onSquareRightClick={handleRightClickSquare}
                        boardWidth={boardWidth}
                        boardOrientation={effectiveBoardOrientation}
                        arePiecesDraggable={canDragPieces}
                        areArrowsAllowed={true}
                        customArrows={allArrows}
                        customSquares={customSquareStyles}
                        animationDuration={150}
                        showLegalMoves={true}
                      />
                    ) : (
                      <div
                        style={{
                          width: boardWidth,
                          height: boardWidth,
                          backgroundColor: '#f0d9b5',
                          borderRadius: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '18px',
                          color: '#374151'
                        }}
                      >
                        Loading board...
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Feedback */}
              {feedback && (
                <div className="mt-3 sm:mt-4 w-full flex justify-center">
                  <div className="p-2 sm:p-3 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border border-blue-200 text-center text-xs sm:text-sm w-full max-w-md">
                    {feedback}
                  </div>
                </div>
              )}
              
              {/* Move History - Enhanced */}
              {moveHistory.length > 0 && (
                <div className="mt-4 sm:mt-6 p-4 sm:p-6 bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-xl border border-gray-200 w-full max-w-2xl mx-auto">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-sm sm:text-base text-gray-800 flex items-center">
                      <BarChart3 className="w-4 h-4 mr-2 text-blue-600" />
                      Move History ({moveHistory.length} moves)
                    </h3>
                    <div className="text-xs text-gray-500">
                      {Math.ceil(moveHistory.length / 2)} moves played
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 max-h-32 sm:max-h-40 overflow-y-auto bg-gray-100 rounded-lg p-3">
                    {moveHistory.map((moveData, index) => (
                      <div key={index} className={`px-2 py-1 rounded-lg text-xs sm:text-sm font-medium shadow-sm border transition-all duration-200 hover:scale-105 ${
                        moveData.color === 'white' 
                          ? 'bg-blue-100 border-blue-300 text-blue-800 hover:bg-blue-200' 
                          : 'bg-gray-100 border-gray-300 text-gray-800 hover:bg-gray-200'
                      }`}>
                        <span className="text-gray-500 text-xs">
                          {Math.floor(index / 2) + 1}.{index % 2 === 0 ? '' : '..'}
                        </span>
                        <span className="ml-1">{moveData.move}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Game End Analysis Section */}
              {gameMode === 'finished' && gameResult && (
                <div className="mt-4 sm:mt-6 p-4 sm:p-6 bg-gradient-to-br from-green-50 to-blue-50 rounded-2xl shadow-xl border border-green-200 w-full max-w-2xl mx-auto">
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-4">
                      <Trophy className="w-6 h-6 text-yellow-600 mr-2" />
                      <h3 className="font-bold text-lg sm:text-xl text-gray-800">Game Over!</h3>
                    </div>
                    <div className="mb-4 p-3 bg-white rounded-lg shadow-sm border">
                      <p className="text-sm sm:text-base font-medium text-gray-700">{gameResult}</p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      <button
                        onClick={() => {
                          // Pass game data to chess analysis board
                          const pgn = game ? game.pgn() : '';
                          const encodedPgn = encodeURIComponent(pgn);
                          navigate(`/chess-analysis-board?pgn=${encodedPgn}`);
                        }}
                        className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold py-2 sm:py-3 px-4 sm:px-6 rounded-xl text-sm sm:text-base shadow-lg transform transition-all duration-200 hover:scale-105 hover:shadow-xl flex items-center justify-center"
                      >
                        <BarChart3 className="w-4 h-4 mr-2" />
                        Analyze Game
                        <ExternalLink className="w-4 h-4 ml-2" />
                      </button>
                      <button
                        onClick={saveGame}
                        className="bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white font-semibold py-2 sm:py-3 px-4 sm:px-6 rounded-xl text-sm sm:text-base shadow-lg transform transition-all duration-200 hover:scale-105 hover:shadow-xl flex items-center justify-center"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Save Game
                      </button>
                      <button
                        onClick={resetGame}
                        className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold py-2 sm:py-3 px-4 sm:px-6 rounded-xl text-sm sm:text-base shadow-lg transform transition-all duration-200 hover:scale-105 hover:shadow-xl flex items-center justify-center"
                      >
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Play Again
                      </button>
                    </div>
                    <div className="mt-4 text-xs text-gray-500">
                      Click "Analyze Game" to review your moves with detailed analysis
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Enhanced Controls Sidebar */}
          <div className="xl:col-span-1 space-y-4 sm:space-y-6 order-1 xl:order-2">
            <div className="bg-gradient-to-br from-white via-blue-50 to-indigo-50 rounded-3xl shadow-2xl border border-white/20 backdrop-blur-sm p-4 sm:p-6 lg:p-8">
              <h2 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6 text-gray-800 flex items-center">
                <Settings className="w-5 h-5 sm:w-6 sm:h-6 mr-3 text-blue-600" />
                Game Controls
              </h2>
              <div className="grid grid-cols-1 gap-3 sm:gap-4">
                <button 
                  onClick={togglePause}
                  className="bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 hover:from-blue-600 hover:via-blue-700 hover:to-blue-800 text-white font-semibold py-3 sm:py-4 px-4 sm:px-6 rounded-2xl text-sm sm:text-base shadow-xl transform transition-all duration-300 hover:scale-105 hover:shadow-2xl border border-blue-400/30 flex items-center justify-center"
                >
                  {isGamePaused ? <><Play className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />Resume Game</> : <><Pause className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />Pause Game</>}
                </button>
                <button 
                  onClick={resetGame}
                  className="bg-gradient-to-r from-red-500 via-red-600 to-red-700 hover:from-red-600 hover:via-red-700 hover:to-red-800 text-white font-semibold py-3 sm:py-4 px-4 sm:px-6 rounded-2xl text-sm sm:text-base shadow-xl transform transition-all duration-300 hover:scale-105 hover:shadow-2xl border border-red-400/30 flex items-center justify-center"
                >
                  <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  New Game
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayWithBotPage;
