import React, { useEffect, useState } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const API = 'http://localhost:3001/api/visualisation/random';

const PracticeVisualisationPage = () => {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const [fen,setFen] = useState(null);
  const [hidden,setHidden]=useState(false);
  const [questionType, setQuestionType] = useState('kings'); // kings, pieces, material, specific
  const [specificTarget, setSpecificTarget] = useState(null); // { type:'q', color:'w', square:'e4' }
  const [answers,setAnswers]=useState({
    wk:'', bk:'', // for kings
    whitePieces: '', blackPieces: '', // for piece counts
    material: '', // for material evaluation
    specificPiece: '', specificSquare: '', // for specific piece questions
    threat: '', // for threat questions
    square: '', // for square questions
    pattern: '', // for pattern questions
    whitePawns: '', blackPawns: '', // for pawn counts
    pawnStructure: '', // for pawn structure questions
    kingActivity: '', // for king activity questions
    passedPawns: '' // for passed pawn questions
  });
  const [feedback,setFeedback]=useState('');
  const [loading,setLoading]=useState(true);
  const [boardSize, setBoardSize] = useState(600);
  const [userRating, setUserRating] = useState(null);
  const [selectedSquare, setSelectedSquare] = useState(null);

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
          setUserRating(userData.visualisationRating || 1200);
        }
      } catch (err) {
        console.error('Error fetching user rating:', err);
      }
    };

    fetchUserRating();
  }, []);

  // Initialize user rating from AuthContext
  useEffect(() => {
    if (user && user.visualisationRating) {
      setUserRating(user.visualisationRating);
      console.log('PracticeVisualisationPage: User visualisation rating initialized from AuthContext:', user.visualisationRating);
    }
  }, [user]);

  const load = async()=>{
    try{
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = { 'Cache-Control': 'no-cache' };
      if (token) {
        headers['x-auth-token'] = token;
      }
      const res = await fetch(`${API}?t=${Date.now()}`, { cache: 'no-store', headers });
      if(!res.ok) throw new Error('no');
      const json = await res.json();
      setFen(json.fen);
      setHidden(false);
      setFeedback('');
      setAnswers({
        wk:'', bk:'',
        whitePieces: '', blackPieces: '',
        material: '',
        specificPiece: '', specificSquare: '',
        threat: '', square: '', pattern: ''
      });
      
      // Pick a position-aware question type
      try {
        const ch = new Chess(json.fen);
        const board = ch.board();
        const singles = [];
        const pieceMap = { p:'pawn', n:'knight', b:'bishop', r:'rook', q:'queen', k:'king' };
        for (let r=0;r<8;r++){
          for (let c=0;c<8;c++){
            const p = board[r][c];
            if(!p) continue;
            // compute square
            const file = String.fromCharCode(97 + c);
            const rank = 8 - r;
            const sq = `${file}${rank}`;
            // count occurrences later by pushing, we'll filter singles below
            singles.push({ key:`${p.color}${p.type}`, type:p.type, color:p.color, square:sq, name: `${p.color==='w'?'white':'black'} ${pieceMap[p.type]}` });
          }
        }
        // Reduce to pieces that occur exactly once to avoid ambiguity (not kings)
        const counts = singles.reduce((acc,cur)=>{ acc[cur.key]=(acc[cur.key]||0)+1; return acc; },{});
        const uniquePieces = singles.filter(s=> counts[s.key]===1 && s.type !== 'k');
        const canSpecific = uniquePieces.length>0;

        // Add pawn endgame specific questions
        const pool = ['kings','pieces','material','pawnCount','pawnStructure','kingActivity','passedPawns'];
        if (canSpecific) pool.push('specific');
        const chosen = pool[Math.floor(Math.random()*pool.length)];
        setQuestionType(chosen);
        if (chosen==='specific') {
          const target = uniquePieces[Math.floor(Math.random()*uniquePieces.length)];
          setSpecificTarget(target);
        } else {
          setSpecificTarget(null);
        }
      } catch(_) {
        // Fall back to generic question if anything goes wrong
        setQuestionType('kings');
        setSpecificTarget(null);
      }
      
      setLoading(false);
    }catch{
      // Graceful fallback if API not available or unauthorized
      const fallbackPositions = [
        '8/8/4k3/8/8/3K4/8/6Q1 w - - 0 1',
        '8/8/4k3/8/8/3K4/8/6R1 w - - 0 1',
        '8/8/4k3/8/2P5/2K5/8/8 w - - 0 1',
        '8/8/4k3/8/2B5/2K5/8/8 w - - 0 1',
        '8/8/4k3/8/2N5/2K5/8/8 w - - 0 1',
        '6k1/8/6K1/8/8/8/8/8 w - - 0 1'
      ];
      const fallbackFen = fallbackPositions[Math.floor(Math.random() * fallbackPositions.length)];
      setFen(fallbackFen);
      setHidden(false);
      setFeedback('Using offline fallback position (login for full set)');
      setLoading(false);
    }
  };
  useEffect(()=>{load();},[]);

  // Handle responsive board sizing
  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth < 768;
      const isTablet = window.innerWidth >= 768 && window.innerWidth < 1280;
      
      if (isMobile) {
        const mobileSize = Math.min(window.innerWidth - 64, 350);
        setBoardSize(mobileSize);
      } else if (isTablet) {
        const tabletSize = Math.min(window.innerWidth - 128, 500);
        setBoardSize(tabletSize);
      } else {
        const desktopSize = Math.min(600, window.innerWidth - 200);
        setBoardSize(desktopSize);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Helper functions for pawn endgame analysis
  const analyzePawnStructure = (board) => {
    const whitePawns = [];
    const blackPawns = [];
    
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = board[row][col];
        if (piece && piece.type === 'p') {
          const square = String.fromCharCode(97 + col) + (8 - row);
          if (piece.color === 'w') whitePawns.push(square);
          else blackPawns.push(square);
        }
      }
    }
    
    // Check for isolated pawns
    const hasIsolated = whitePawns.some(p => 
      !whitePawns.some(other => Math.abs(p.charCodeAt(0) - other.charCodeAt(0)) === 1)
    ) || blackPawns.some(p => 
      !blackPawns.some(other => Math.abs(p.charCodeAt(0) - other.charCodeAt(0)) === 1)
    );
    
    if (hasIsolated) return 'isolated pawns';
    
    // Check for doubled pawns
    const hasDoubled = whitePawns.some(p => 
      whitePawns.some(other => other !== p && other[0] === p[0])
    ) || blackPawns.some(p => 
      blackPawns.some(other => other !== p && other[0] === p[0])
    );
    
    if (hasDoubled) return 'doubled pawns';
    
    return 'connected pawns';
  };
  
  const analyzeKingActivity = (board) => {
    let whiteKing = null, blackKing = null;
    
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = board[row][col];
        if (piece && piece.type === 'k') {
          if (piece.color === 'w') whiteKing = { row, col };
          else blackKing = { row, col };
        }
      }
    }
    
    if (!whiteKing || !blackKing) return 'equal';
    
    // King activity based on center proximity and pawn support
    const whiteCenterDistance = Math.abs(whiteKing.row - 3.5) + Math.abs(whiteKing.col - 3.5);
    const blackCenterDistance = Math.abs(blackKing.row - 3.5) + Math.abs(blackKing.col - 3.5);
    
    if (whiteCenterDistance < blackCenterDistance) return 'white';
    if (blackCenterDistance < whiteCenterDistance) return 'black';
    return 'equal';
  };
  
  const checkPassedPawns = (board) => {
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = board[row][col];
        if (piece && piece.type === 'p') {
          const isWhite = piece.color === 'w';
          const direction = isWhite ? -1 : 1;
          let isPassed = true;
          
          // Check if pawn is passed
          for (let checkRow = row + direction; checkRow >= 0 && checkRow < 8; checkRow += direction) {
            for (let checkCol = Math.max(0, col - 1); checkCol <= Math.min(7, col + 1); checkCol++) {
              const checkPiece = board[checkRow][checkCol];
              if (checkPiece && checkPiece.type === 'p' && checkPiece.color !== piece.color) {
                isPassed = false;
                break;
              }
            }
            if (!isPassed) break;
          }
          
          if (isPassed) return true;
        }
      }
    }
    return false;
  };

  const getQuestionText = () => {
    switch(questionType) {
      case 'kings':
        return 'Where are the kings located?';
      case 'pieces':
        return 'How many pieces does each side have?';
      case 'material':
        return 'What is the material difference? (e.g., +2 for white advantage, -1 for black advantage)';
      case 'specific':
        if (specificTarget) {
          return `Where is the ${specificTarget.name}?`;
        }
        return 'Where is a specific piece located?';
      case 'pawnCount':
        return 'How many pawns does each side have?';
      case 'pawnStructure':
        return 'Describe the pawn structure (e.g., "isolated pawns", "doubled pawns", "connected pawns")';
      case 'kingActivity':
        return 'Which king is more active? (white/black/equal)';
      case 'passedPawns':
        return 'Are there any passed pawns? (yes/no)';
      default:
        return 'Answer the questions below:';
    }
  };

  const validateAnswer = () => {
    if (!fen) return false;
    
    const chess = new Chess(fen);
    const board = chess.board();

    const normalize = (s) => (s || '').toString().trim().toLowerCase();
    const findSquare = (type, color) => {
      for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
          const p = board[row][col];
          if (p && p.type === type && (color ? p.color === color : true)) {
            const file = String.fromCharCode(97 + col);
            const rank = 8 - row;
            return `${file}${rank}`;
          }
        }
      }
      return null;
    };
    
    switch(questionType) {
      case 'kings':
        const correctWk = findSquare('k', 'w');
        const correctBk = findSquare('k', 'b');
        if (!correctWk || !correctBk) return false;
        return normalize(answers.wk) === correctWk && normalize(answers.bk) === correctBk;
        
      case 'pieces':
        const whiteCount = board.flat().filter(p => p && p.color === 'w').length;
        const blackCount = board.flat().filter(p => p && p.color === 'b').length;
        return parseInt(answers.whitePieces) === whiteCount && parseInt(answers.blackPieces) === blackCount;
        
      case 'material':
        const pieceValues = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
        let whiteMaterial = 0, blackMaterial = 0;
        board.flat().forEach(p => {
          if (p) {
            const value = pieceValues[p.type];
            if (p.color === 'w') whiteMaterial += value;
            else blackMaterial += value;
          }
        });
        const difference = whiteMaterial - blackMaterial;
        return parseInt(answers.material) === difference;
        
      case 'specific':
        // Position-aware: ask for square of a specific unique piece
        if (!specificTarget) return false;
        return normalize(answers.specificSquare) === specificTarget.square.toLowerCase();
        
      case 'pawnCount':
        const whitePawns = board.flat().filter(p => p && p.type === 'p' && p.color === 'w').length;
        const blackPawns = board.flat().filter(p => p && p.type === 'p' && p.color === 'b').length;
        return parseInt(answers.whitePawns) === whitePawns && parseInt(answers.blackPawns) === blackPawns;
        
      case 'pawnStructure':
        // Simple pawn structure analysis
        const pawnStructure = analyzePawnStructure(board);
        return normalize(answers.pawnStructure) === pawnStructure.toLowerCase();
        
      case 'kingActivity':
        const kingActivity = analyzeKingActivity(board);
        return normalize(answers.kingActivity) === kingActivity.toLowerCase();
        
      case 'passedPawns':
        const hasPassedPawns = checkPassedPawns(board);
        return normalize(answers.passedPawns) === (hasPassedPawns ? 'yes' : 'no');
        
      default:
        return false;
    }
  };

  const handleSubmit = async () => {
    const correct = validateAnswer();
    setFeedback(correct ? '✅ Correct! Rating updated...' : '❌ Not quite. Rating updated...');

    // Update user rating
    try {
      const token = localStorage.getItem('token');
      console.log('Updating visualisation rating - correct:', correct, 'token exists:', !!token);
      
      if (token) {
        const response = await fetch('http://localhost:3001/api/visualisation/stats', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-auth-token': token
          },
          body: JSON.stringify({
            solved: correct,
            puzzleRating: 1200 // Default rating for visualisation puzzles
          })
        });

        console.log('Visualisation rating response status:', response.status);

        if (response.ok) {
          const result = await response.json();
          console.log('Visualisation rating update result:', result);
          setUserRating(result.newRating);
          
          // Update feedback to show rating change
          const change = result.ratingChange;
          const changeText = change > 0 ? `+${change}` : `${change}`;
          setFeedback(correct ? 
            `✅ Correct! Rating: ${result.newRating} (${changeText})` : 
            `❌ Not quite. Rating: ${result.newRating} (${changeText})`
          );
          
          // Refresh user data in auth context to update localStorage
          const refreshedUser = await refreshUser();
          console.log('PracticeVisualisationPage: User refreshed after rating update:', refreshedUser);
        } else {
          const errorText = await response.text();
          console.error('Failed to update visualisation rating:', response.status, errorText);
        }
      }
    } catch (err) {
      console.error('Error updating visualisation rating:', err);
    }
  };

  const renderQuestionInputs = () => {
    switch(questionType) {
      case 'kings':
        return (
          <>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Which square is the white king on?</label>
              <input 
                value={answers.wk} 
                onChange={e=>setAnswers({...answers,wk:e.target.value})} 
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl text-sm bg-white shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200" 
                placeholder="e.g., e4"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Which square is the black king on?</label>
              <input 
                value={answers.bk} 
                onChange={e=>setAnswers({...answers,bk:e.target.value})} 
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl text-sm bg-white shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200" 
                placeholder="e.g., e5"
              />
            </div>
          </>
        );
        
      case 'pieces':
        return (
          <>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">How many white pieces are on the board?</label>
              <input 
                value={answers.whitePieces} 
                onChange={e=>setAnswers({...answers,whitePieces:e.target.value})} 
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl text-sm bg-white shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200" 
                placeholder="e.g., 5"
                type="number"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">How many black pieces are on the board?</label>
              <input 
                value={answers.blackPieces} 
                onChange={e=>setAnswers({...answers,blackPieces:e.target.value})} 
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl text-sm bg-white shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200" 
                placeholder="e.g., 3"
                type="number"
              />
            </div>
          </>
        );
        
      case 'material':
        return (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">What is the material difference? (White advantage is positive, Black advantage is negative)</label>
            <input 
              value={answers.material} 
              onChange={e=>setAnswers({...answers,material:e.target.value})} 
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl text-sm bg-white shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200" 
              placeholder="e.g., +2 (White up 2 pawns) or -1 (Black up 1 pawn)"
              type="number"
            />
          </div>
        );
        
      case 'specific':
        return (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Enter the square (e.g., d4)</label>
            <input 
              value={answers.specificSquare} 
              onChange={e=>setAnswers({...answers,specificSquare:e.target.value})} 
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl text-sm bg-white shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200" 
              placeholder="e.g., d4"
            />
          </div>
        );
        
      case 'pawnCount':
        return (
          <>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">How many white pawns are on the board?</label>
              <input 
                value={answers.whitePawns} 
                onChange={e=>setAnswers({...answers,whitePawns:e.target.value})} 
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl text-sm bg-white shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200" 
                placeholder="e.g., 3"
                type="number"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">How many black pawns are on the board?</label>
              <input 
                value={answers.blackPawns} 
                onChange={e=>setAnswers({...answers,blackPawns:e.target.value})} 
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl text-sm bg-white shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200" 
                placeholder="e.g., 2"
                type="number"
              />
            </div>
          </>
        );
        
      case 'pawnStructure':
        return (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Describe the pawn structure</label>
            <select 
              value={answers.pawnStructure} 
              onChange={e=>setAnswers({...answers,pawnStructure:e.target.value})} 
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl text-sm bg-white shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
            >
              <option value="">Select pawn structure...</option>
              <option value="isolated pawns">Isolated pawns</option>
              <option value="doubled pawns">Doubled pawns</option>
              <option value="connected pawns">Connected pawns</option>
            </select>
          </div>
        );
        
      case 'kingActivity':
        return (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Which king is more active?</label>
            <select 
              value={answers.kingActivity} 
              onChange={e=>setAnswers({...answers,kingActivity:e.target.value})} 
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl text-sm bg-white shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
            >
              <option value="">Select king activity...</option>
              <option value="white">White king</option>
              <option value="black">Black king</option>
              <option value="equal">Equal activity</option>
            </select>
          </div>
        );
        
      case 'passedPawns':
        return (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Are there any passed pawns?</label>
            <select 
              value={answers.passedPawns} 
              onChange={e=>setAnswers({...answers,passedPawns:e.target.value})} 
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl text-sm bg-white shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
            >
              <option value="">Select answer...</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </div>
        );
        
      case 'threats':
        return (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">What is the most immediate threat? (e.g., check, fork, pin, skewer)</label>
            <input 
              value={answers.threat} 
              onChange={e=>setAnswers({...answers,threat:e.target.value})} 
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl text-sm bg-white shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200" 
              placeholder="e.g., check, fork, pin, skewer, or none"
            />
          </div>
        );
        
      case 'squares':
        return (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Which square is most critical? (e.g., e4, f7, or describe the area)</label>
            <input 
              value={answers.square} 
              onChange={e=>setAnswers({...answers,square:e.target.value})} 
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl text-sm bg-white shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200" 
              placeholder="e.g., e4, f7, or describe the area"
            />
          </div>
        );
        
      // removed 'patterns' input
        
      default:
        return null;
    }
  };

  if(loading) return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-lg text-gray-600">Loading visualization puzzle...</p>
      </div>
    </div>
  );
  
  if(!fen) return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <div className="text-center">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 max-w-md mx-auto">
          <p className="text-red-600 text-lg">{feedback || 'Could not load puzzle'}</p>
        </div>
      </div>
    </div>
  );
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-3 sm:p-4 lg:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Practice Visualisation
          </h1>
          <p className="text-sm sm:text-base text-gray-600 mb-4">Memorize the board position and answer questions about piece placement</p>
          
          {/* User Rating Display */}
          {userRating && (
            <div className="inline-flex items-center bg-gradient-to-r from-purple-50 to-purple-100 px-4 sm:px-6 py-2 sm:py-3 rounded-xl border border-purple-200 shadow-lg">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-purple-500 rounded-full flex items-center justify-center mr-2 sm:mr-3">
                <span className="text-white text-xs sm:text-sm font-bold">👁</span>
              </div>
              <div className="text-left">
                <p className="text-xs sm:text-sm text-purple-700 font-medium">Your Rating</p>
                <p className="text-lg sm:text-2xl font-bold text-purple-800">{userRating}</p>
              </div>
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 sm:gap-6">
          {/* Main Content */}
          <div className="xl:col-span-3 order-2 xl:order-1">
            <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl shadow-2xl border border-gray-200 p-4 sm:p-6 lg:p-8">
              <div className="flex flex-col items-center">
                {!hidden ? (
                  <>
                    <div className="mb-4 sm:mb-6 px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-bold text-sm sm:text-base lg:text-lg shadow-lg transform transition-all duration-300 text-white bg-gradient-to-r from-blue-600 to-blue-700 shadow-blue-500/50">
                      Study the position carefully
                    </div>
                    <div className="relative w-full">
                      <div className="w-full bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-2 sm:p-4 shadow-inner border border-amber-200">
                        <div className="bg-gradient-to-br from-amber-100 to-orange-100 rounded-xl p-1 sm:p-2 shadow-lg">
                          <div className="flex justify-center">
                            <div style={{ width: boardSize, maxWidth: '100%' }}>
                              <Chessboard 
                                position={fen} 
                                boardWidth={boardSize}
                                arePiecesDraggable={true}
                                areArrowsAllowed={true}
                                onPieceDrop={(sourceSquare, targetSquare) => {
                                  // Allow moves for visualization practice
                                  return true;
                                }}
                                onSquareClick={(square) => {
                                  // Allow square selection for visualization practice
                                  setSelectedSquare(square);
                                }}
                                customSquareStyles={selectedSquare ? {
                                  [selectedSquare]: { 
                                    backgroundColor: 'rgba(34, 197, 94, 0.6)',
                                    boxShadow: 'inset 0 0 0 2px rgba(34, 197, 94, 0.8)',
                                    borderRadius: '4px'
                                  }
                                } : {}}
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
                    </div>
                    <button 
                      className="mt-4 sm:mt-6 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-2 sm:py-3 px-4 sm:px-6 rounded-xl text-sm sm:text-lg shadow-lg transform transition-all duration-200 hover:scale-105 hover:shadow-xl"
                      onClick={()=>setHidden(true)}
                    >
                      I&apos;m Ready
                    </button>
                  </>
                ) : (
                  <>
                    <div className="mb-4 sm:mb-6 px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-bold text-sm sm:text-base lg:text-lg shadow-lg transform transition-all duration-300 text-white bg-gradient-to-r from-purple-600 to-purple-700 shadow-purple-500/50">
                      Board hidden. {getQuestionText()}
                    </div>
                    <div className="w-full max-w-md space-y-4 sm:space-y-6">
                      <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-xl border border-gray-200 p-4 sm:p-6">
                        <div className="space-y-3 sm:space-y-4">
                          {renderQuestionInputs()}
                          <button 
                            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-2 sm:py-3 px-3 sm:px-4 rounded-xl text-xs sm:text-sm shadow-lg transform transition-all duration-200 hover:scale-105 hover:shadow-xl"
                            onClick={handleSubmit}
                          >
                            Submit Answers
                          </button>
                        </div>
                      </div>
                      
                      {feedback && (
                        <div className={`p-3 sm:p-4 rounded-xl text-center font-bold text-sm sm:text-lg shadow-lg ${
                          feedback.includes('Correct') 
                            ? 'bg-gradient-to-r from-green-500 to-green-600 text-white' 
                            : 'bg-gradient-to-r from-red-500 to-red-600 text-white'
                        }`}>
                          {feedback}
                        </div>
                      )}
                      
                      {feedback && (
                        <button 
                          className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold py-2 sm:py-3 px-3 sm:px-4 rounded-xl text-xs sm:text-sm shadow-lg transform transition-all duration-200 hover:scale-105 hover:shadow-xl"
                          onClick={load}
                        >
                          Next Puzzle
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
          
          {/* Side Panel */}
          <div className="xl:col-span-1 space-y-3 sm:space-y-4 order-1 xl:order-2">
            <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-xl border border-gray-200 p-3 sm:p-4 lg:p-6">
              <h2 className="text-base sm:text-lg font-bold mb-3 sm:mb-4 text-gray-800 flex items-center">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-2 sm:mr-3"></div>
                Instructions
              </h2>
              <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm text-gray-700">
                <p>1. Study the board position carefully</p>
                <p>2. Click "I'm Ready" when you've memorized it</p>
                <p>3. Answer questions about piece placement</p>
                <p>4. Improve your visualization skills</p>
                <p>5. Questions vary: kings, piece counts, material, specific pieces, threats, squares, patterns</p>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-xl border border-gray-200 p-3 sm:p-4 lg:p-6">
              <h2 className="text-base sm:text-lg font-bold mb-3 sm:mb-4 text-gray-800 flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2 sm:mr-3"></div>
                Controls
              </h2>
              <div className="grid grid-cols-1 gap-2 sm:gap-3">
                <button 
                  className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white font-semibold py-2 sm:py-3 px-3 sm:px-4 rounded-xl text-xs sm:text-sm shadow-lg transform transition-all duration-200 hover:scale-105 hover:shadow-xl"
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

export default PracticeVisualisationPage;
