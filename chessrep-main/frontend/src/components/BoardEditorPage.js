import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  RotateCcw, 
  Copy, 
  Download, 
  Upload, 
  Trash2, 
  Save, 
  Eye,
  Settings,
  ArrowLeft,
  Share2
} from 'lucide-react';

const BoardEditorPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Board state
  const [game, setGame] = useState(new Chess());
  const [boardPosition, setBoardPosition] = useState('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
  const [boardOrientation, setBoardOrientation] = useState('white');
  const boardRef = useRef(null);
  
  // Editor state
  const [selectedPiece, setSelectedPiece] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  // Game settings
  const [gameSettings, setGameSettings] = useState({
    sideToMove: 'w',
    castlingRights: {
      whiteKingside: true,
      whiteQueenside: true,
      blackKingside: true,
      blackQueenside: true
    },
    enPassantSquare: '-',
    halfmoveClock: 0,
    fullmoveNumber: 1
  });
  
  // FEN/PGN input
  const [fenInput, setFenInput] = useState('');
  const [pgnInput, setPgnInput] = useState('');
  const [showImportDialog, setShowImportDialog] = useState(false);
  
  // Piece palette
  const pieceTypes = [
    { type: 'wP', symbol: '♙', name: 'White Pawn' },
    { type: 'wR', symbol: '♖', name: 'White Rook' },
    { type: 'wN', symbol: '♘', name: 'White Knight' },
    { type: 'wB', symbol: '♗', name: 'White Bishop' },
    { type: 'wQ', symbol: '♕', name: 'White Queen' },
    { type: 'wK', symbol: '♔', name: 'White King' },
    { type: 'bP', symbol: '♟', name: 'Black Pawn' },
    { type: 'bR', symbol: '♜', name: 'Black Rook' },
    { type: 'bN', symbol: '♞', name: 'Black Knight' },
    { type: 'bB', symbol: '♝', name: 'Black Bishop' },
    { type: 'bQ', symbol: '♛', name: 'Black Queen' },
    { type: 'bK', symbol: '♚', name: 'Black King' }
  ];

  // Handle URL parameters for loading positions
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const fenFromUrl = urlParams.get('fen');
    
    if (fenFromUrl) {
      try {
        const decodedFen = decodeURIComponent(fenFromUrl);
        const newGame = new Chess(decodedFen);
        setGame(newGame);
        setBoardPosition(decodedFen);
        console.log('🎯 Loaded position from URL:', decodedFen);
      } catch (error) {
        console.error('❌ Error loading position from URL:', error);
      }
    }
  }, [location.search]);

  // Update board position when game changes
  const updateBoardPosition = useCallback(() => {
    const fen = game.fen();
    setBoardPosition(fen);
  }, [game]);

  // Handle piece removal when dragged outside board
  const onPieceDropOutside = useCallback((sourceSquare) => {
    if (!isEditing) return;
    
    console.log('Piece dropped outside board from:', sourceSquare);
    
    try {
      const newGame = new Chess();
      newGame.load(boardPosition);
      
      // Remove piece from source square
      newGame.remove(sourceSquare);
      
      setGame(newGame);
      updateBoardPosition();
      console.log('Piece removed successfully');
    } catch (error) {
      console.error('Piece removal error:', error);
    }
  }, [isEditing, boardPosition, updateBoardPosition]);

  // Handle piece drop on board
  const onPieceDrop = useCallback((sourceSquare, targetSquare, piece) => {
    console.log('🎯 onPieceDrop called:', { sourceSquare, targetSquare, piece, isEditing, selectedPiece });
    
    if (!isEditing) {
      console.log('🎯 Not in editing mode, ignoring drop');
      return false;
    }
    
    try {
      const newGame = new Chess();
      
      // Try to load the current position, but if it fails (e.g., empty board), start fresh
      try {
        newGame.load(boardPosition);
      } catch (loadError) {
        console.log('🎯 Could not load position for drag, starting with cleared board');
        newGame.clear();
      }
      
      // If in remove mode and dragging a piece, remove it
      if (selectedPiece === 'remove' && sourceSquare) {
        console.log('🎯 Remove mode: removing piece from:', sourceSquare);
        newGame.remove(sourceSquare);
        setGame(newGame);
        const newFen = newGame.fen();
        setBoardPosition(newFen);
        return false; // Don't allow the move, just remove
      }
      
      // If dragging existing piece and dropped outside board, remove it
      if (sourceSquare && !targetSquare) {
        console.log('🎯 Existing piece dropped outside board, removing:', sourceSquare);
        onPieceDropOutside(sourceSquare);
        return false;
      }
      
      // If dragging existing piece to a new square, move it
      if (sourceSquare && targetSquare && !selectedPiece) {
        console.log('🎯 Moving existing piece from:', sourceSquare, 'to:', targetSquare);
        
        // Get the piece at source square
        const pieceToMove = newGame.get(sourceSquare);
        if (pieceToMove) {
          // Remove from source
          newGame.remove(sourceSquare);
          // Remove from target if exists
          newGame.remove(targetSquare);
          // Place at target
          newGame.put(pieceToMove, targetSquare);
          
          setGame(newGame);
          const newFen = newGame.fen();
          setBoardPosition(newFen);
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error('🎯 Move error:', error);
      return false;
    }
  }, [isEditing, selectedPiece, boardPosition, updateBoardPosition, onPieceDropOutside]);

  // Handle square click for piece placement
  const onSquareClick = useCallback((square) => {
    console.log('🎯 Square clicked:', square, 'isEditing:', isEditing, 'selectedPiece:', selectedPiece);
    
    if (!isEditing) {
      console.log('🎯 Not in editing mode, ignoring click');
      return;
    }
    
    if (!selectedPiece) {
      console.log('🎯 No piece selected, ignoring click');
      return;
    }
    
    try {
      const newGame = new Chess();
      
      // Try to load the current position, but if it fails (e.g., empty board), start fresh
      try {
        newGame.load(boardPosition);
        console.log('🎯 Loaded current position:', boardPosition);
      } catch (loadError) {
        console.log('🎯 Could not load position (might be empty), starting with cleared board');
        newGame.clear();
      }
      
      // Check if in remove mode
      if (selectedPiece === 'remove') {
        console.log('🎯 Removing piece from square:', square);
        newGame.remove(square);
        setGame(newGame);
        const newFen = newGame.fen();
        setBoardPosition(newFen);
        console.log('🎯 Piece removed successfully');
        return;
      }
      
      // Regular piece placement
      console.log('🎯 Placing piece:', selectedPiece, 'on square:', square);
      
      // Remove piece from square if exists
      newGame.remove(square);
      
      // Parse the piece type - handle both object and string formats
      let pieceType, pieceColor;
      
      if (typeof selectedPiece === 'object' && selectedPiece.type) {
        // Object format: { type: 'wP', ... }
        pieceType = selectedPiece.type;
      } else if (typeof selectedPiece === 'string') {
        // String format: 'wP'
        pieceType = selectedPiece;
      } else {
        console.error('🎯 Invalid piece format:', selectedPiece);
        return;
      }
      
      // Extract color and piece type from format like 'wP' or 'bK'
      pieceColor = pieceType[0] === 'w' ? 'w' : 'b';
      const chessPieceType = pieceType[1].toLowerCase(); // 'P' -> 'p', 'K' -> 'k'
      
      // Add the selected piece
      const pieceToAdd = { 
        type: chessPieceType, 
        color: pieceColor
      };
      console.log('🎯 Adding piece:', pieceToAdd, 'to square:', square);
      
      newGame.put(pieceToAdd, square);
      
      const newFen = newGame.fen();
      console.log('🎯 New FEN after placing piece:', newFen);
      
      setGame(newGame);
      setBoardPosition(newFen);
      
      // Don't clear selection after placing piece - keep it selected for multiple placements
      // setSelectedPiece(null);
      console.log('🎯 Piece placed successfully');
    } catch (error) {
      console.error('🎯 Piece placement error:', error);
    }
  }, [isEditing, selectedPiece, boardPosition, updateBoardPosition]);

  // Check if current position is legal
  const isPositionLegal = useCallback(() => {
    try {
      console.log('🔍 Validating position:', boardPosition);
      const testGame = new Chess(boardPosition);
      
      // Check if there are exactly two kings (one white, one black)
      const board = testGame.board();
      let whiteKingCount = 0;
      let blackKingCount = 0;
      let whiteKingSquare = null;
      let blackKingSquare = null;
      
      // Find kings and count them
      for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
          const piece = board[row][col];
          if (piece && piece.type === 'k') {
            const square = String.fromCharCode(97 + col) + (8 - row);
            if (piece.color === 'w') {
              whiteKingCount++;
              whiteKingSquare = square;
            } else if (piece.color === 'b') {
              blackKingCount++;
              blackKingSquare = square;
            }
          }
        }
      }
      
      // Must have exactly one king of each color
      if (whiteKingCount !== 1 || blackKingCount !== 1) {
        console.log('❌ Invalid: King count -', { whiteKingCount, blackKingCount });
        return { valid: false, reason: 'Position needs exactly one white king and one black king' };
      }
      console.log('✅ King count valid');
      
      
      // Check if kings are adjacent (next to each other)
      if (whiteKingSquare && blackKingSquare) {
        const wFile = whiteKingSquare.charCodeAt(0);
        const wRank = parseInt(whiteKingSquare[1]);
        const bFile = blackKingSquare.charCodeAt(0);
        const bRank = parseInt(blackKingSquare[1]);
        
        const fileDiff = Math.abs(wFile - bFile);
        const rankDiff = Math.abs(wRank - bRank);
        
        // Kings are adjacent if they're within 1 square in any direction
        if (fileDiff <= 1 && rankDiff <= 1 && (fileDiff > 0 || rankDiff > 0)) {
          console.log('❌ Invalid: Kings adjacent -', { whiteKingSquare, blackKingSquare });
          return { valid: false, reason: 'Kings cannot be next to each other' };
        }
        console.log('✅ Kings not adjacent');
      }
      
      // Additional checks for a valid position
      try {
        // Try to validate the position by checking if it's a valid FEN
        const fenParts = boardPosition.split(' ');
        if (fenParts.length !== 6) {
          return { valid: false, reason: 'Invalid FEN format' };
        }
        
        // Check if the side NOT to move is in check (illegal position)
        // This is a critical check - if the opponent is in check, they should have moved to get out of it
        // Use gameSettings.sideToMove instead of testGame.turn() to respect user's selection
        const currentTurn = gameSettings.sideToMove; // 'w' or 'b' from Game Settings
        const oppositeColor = currentTurn === 'w' ? 'b' : 'w';
        
        console.log('🔍 Checking position with turn:', currentTurn === 'w' ? 'White' : 'Black', 'to move');
        
        // We need to check if the opposite color's king is under attack
        // Find the opposite king and check if it's being attacked
        let oppositeSideInCheck = false;
        try {
          // Create a temp FEN with the opposite color to move so we can check if they're in check
          const tempFenParts = [...fenParts];
          tempFenParts[1] = oppositeColor; // Set turn to opposite color
          const tempFen = tempFenParts.join(' ');
          
          console.log('🔍 Creating temp position with', oppositeColor === 'w' ? 'White' : 'Black', 'to move:', tempFen);
          
          try {
            const tempGame = new Chess(tempFen);
            
            // If the opposite color is in check in their temp position, the position is illegal
            // Use in_check() method (with underscore) from chess.js
            const isInCheck = tempGame.in_check ? tempGame.in_check() : tempGame.inCheck();
            
            if (isInCheck) {
              oppositeSideInCheck = true;
              console.log('⚠️ Detected:', oppositeColor === 'w' ? 'White' : 'Black', 'King is under attack (side not to move)');
            } else {
              console.log('✅', oppositeColor === 'w' ? 'White' : 'Black', 'King is NOT under attack');
            }
          } catch (e) {
            // If we can't create the temp game, the position might be invalid for other reasons
            console.log('⚠️ Could not create temp game to check opposite side:', e.message);
            // Don't fail validation here - let other checks handle it
          }
        } catch (e) {
          console.log('Could not check opposite side, error:', e.message);
        }
        
        if (oppositeSideInCheck) {
          console.log('❌ Invalid: Opposite side in check');
          return { valid: false, reason: `${oppositeColor === 'w' ? 'White' : 'Black'} (side not to move) is in check - illegal position` };
        }
        console.log('✅ Opposite side not in check');
        
        // Check if position is already checkmate or stalemate
        // Use isGameOver() or game_over() which exists in chess.js
        const isGameOver = testGame.isGameOver ? testGame.isGameOver() : testGame.game_over();
        
        if (isGameOver) {
          // Game is over - check if it's checkmate or stalemate
          // Use in_check() method (with underscore) from chess.js
          const isCurrentlyInCheck = testGame.in_check ? testGame.in_check() : (testGame.inCheck ? testGame.inCheck() : false);
          
          if (isCurrentlyInCheck) {
            console.log('❌ Invalid: Already checkmate');
            return { valid: false, reason: 'Position is already checkmate' };
          } else {
            console.log('❌ Invalid: Already stalemate');
            return { valid: false, reason: 'Position is already stalemate' };
          }
        }
        console.log('✅ Game not over');
        
        console.log('✅ Position is VALID!');
        return { valid: true, reason: '' };
      } catch (error) {
        console.error('Position validation error:', error);
        return { valid: false, reason: 'Invalid position: ' + error.message };
      }
      
    } catch (error) {
      console.error('Position validation error:', error);
      return { valid: false, reason: 'Position validation error' };
    }
  }, [boardPosition, gameSettings.sideToMove]);

  // Clear board
  const clearBoard = useCallback(() => {
    const newGame = new Chess();
    newGame.clear();
    const emptyFen = newGame.fen();
    console.log('🎯 Clearing board, new FEN:', emptyFen);
    setGame(newGame);
    setBoardPosition(emptyFen);
  }, []);

  // Reset to starting position
  const resetBoard = useCallback(() => {
    const newGame = new Chess();
    setGame(newGame);
    updateBoardPosition();
  }, [updateBoardPosition]);

  // Add default pieces for testing
  const addDefaultPieces = useCallback(() => {
    const newGame = new Chess();
    newGame.clear();
    
    // Add two kings (minimum for valid position)
    newGame.put({ type: 'k', color: 'w' }, 'e1');
    newGame.put({ type: 'k', color: 'b' }, 'e8');
    
    setGame(newGame);
    updateBoardPosition();
  }, [updateBoardPosition]);

  // Flip board
  const flipBoard = useCallback(() => {
    setBoardOrientation(prev => prev === 'white' ? 'black' : 'white');
  }, []);

  // Load FEN
  const loadFEN = useCallback(() => {
    if (!fenInput.trim()) return;
    
    try {
      const newGame = new Chess(fenInput);
      setGame(newGame);
      updateBoardPosition();
      setFenInput('');
      setShowImportDialog(false);
    } catch (error) {
      alert('Invalid FEN string');
    }
  }, [fenInput, updateBoardPosition]);

  // Load PGN
  const loadPGN = useCallback(() => {
    if (!pgnInput.trim()) return;
    
    try {
      const newGame = new Chess();
      newGame.loadPgn(pgnInput);
      setGame(newGame);
      updateBoardPosition();
      setPgnInput('');
      setShowImportDialog(false);
    } catch (error) {
      alert('Invalid PGN string');
    }
  }, [pgnInput, updateBoardPosition]);

  // Copy FEN to clipboard
  const copyFEN = useCallback(() => {
    navigator.clipboard.writeText(boardPosition);
    alert('FEN copied to clipboard!');
  }, [boardPosition]);

  // Copy PGN to clipboard
  const copyPGN = useCallback(() => {
    const pgn = game.pgn();
    navigator.clipboard.writeText(pgn);
    alert('PGN copied to clipboard!');
  }, [game]);

  // Export position
  const exportPosition = useCallback(() => {
    const data = {
      fen: boardPosition,
      pgn: game.pgn(),
      settings: gameSettings
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `chess-position-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [boardPosition, game, gameSettings]);

  // Generate shareable link
  const generateShareLink = useCallback(() => {
    const encodedFEN = encodeURIComponent(boardPosition);
    const shareUrl = `${window.location.origin}/chess-annotation-advanced?fen=${encodedFEN}`;
    navigator.clipboard.writeText(shareUrl);
    alert('Shareable link copied to clipboard!');
  }, [boardPosition]);

  // Analyze position
  const analyzePosition = useCallback(() => {
    const encodedFEN = encodeURIComponent(boardPosition);
    navigate(`/analysis?fen=${encodedFEN}`);
  }, [boardPosition, navigate]);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: '1fr 400px',
        gap: '20px',
        height: 'calc(100vh - 40px)'
      }}>
        
        {/* Main Board Area */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '20px',
          padding: '30px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
          backdropFilter: 'blur(10px)'
        }}>
          
          {/* Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            width: '100%',
            marginBottom: '30px'
          }}>
            <h1 style={{
              fontSize: '28px',
              fontWeight: 'bold',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              margin: 0
            }}>
              ♔ Board Editor ♛
            </h1>
            
            <button
              onClick={() => navigate(-1)}
              style={{
                padding: '10px 16px',
                backgroundColor: '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '14px'
              }}
            >
              <ArrowLeft size={16} />
              Back
            </button>
          </div>

          {/* Board Controls */}
          <div style={{
            display: 'flex',
            gap: '10px',
            marginBottom: '20px',
            flexWrap: 'wrap',
            justifyContent: 'center'
          }}>
            <button
              onClick={() => {
                console.log('🎯 Editing mode toggled, current state:', isEditing);
                setIsEditing(!isEditing);
                if (isEditing) {
                  setSelectedPiece(null); // Clear selection when stopping editing
                }
              }}
              style={{
                padding: '10px 20px',
                backgroundColor: isEditing ? '#ef4444' : '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600'
              }}
            >
              {isEditing ? 'Stop Editing' : 'Start Editing'}
            </button>
            
            {/* Status indicator */}
            {isEditing && (
              <div style={{
                padding: '10px 16px',
                backgroundColor: selectedPiece ? '#3b82f6' : '#f59e0b',
                color: 'white',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                {selectedPiece ? (
                  selectedPiece === 'remove' ? '🗑️ Remove Mode' : `🎯 ${selectedPiece.name} Selected`
                ) : (
                  '✏️ Select a piece to place or drag pieces to move'
                )}
              </div>
            )}
            
            <button
              onClick={flipBoard}
              style={{
                padding: '10px 16px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '14px'
              }}
            >
              <RotateCcw size={16} />
              Flip Board
            </button>
            
            <button
              onClick={resetBoard}
              style={{
                padding: '10px 16px',
                backgroundColor: '#f59e0b',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Reset
            </button>
            
            <button
              onClick={clearBoard}
              style={{
                padding: '10px 16px',
                backgroundColor: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '14px'
              }}
            >
              <Trash2 size={16} />
              Clear
            </button>
            
            <button
              onClick={addDefaultPieces}
              style={{
                padding: '10px 16px',
                backgroundColor: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '14px'
              }}
            >
              ♔ Add Kings
            </button>
          </div>

          {/* Chess Board */}
          <div 
            ref={boardRef}
            style={{
              width: '500px',
              height: '500px',
              marginBottom: '20px'
            }}
          >
            <Chessboard
              position={boardPosition}
              onPieceDrop={onPieceDrop}
              onSquareClick={isEditing ? onSquareClick : undefined}
              boardWidth={500}
              boardOrientation={boardOrientation}
              customBoardStyle={{
                borderRadius: '12px',
                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)'
              }}
              customSquareStyles={{
                ...(isEditing && selectedPiece ? {
                  [Object.keys(game.board().flat().filter(sq => sq === null))]: {
                    backgroundColor: 'rgba(59, 130, 246, 0.3)'
                  }
                } : {})
              }}
              arePiecesDraggable={isEditing}
              areArrowsAllowed={false}
              showBoardNotation={true}
            />
          </div>

          {/* Position Status */}
          <div style={{
            marginBottom: '20px',
            padding: '12px 20px',
            backgroundColor: isPositionLegal().valid ? '#dcfce7' : '#fef2f2',
            border: `2px solid ${isPositionLegal().valid ? '#16a34a' : '#dc2626'}`,
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '14px',
              fontWeight: '600',
              color: isPositionLegal().valid ? '#16a34a' : '#dc2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}>
              {isPositionLegal().valid ? '✅' : '❌'}
              {isPositionLegal().valid ? 'Position is Legal' : 'Position is Invalid'}
            </div>
            {!isPositionLegal().valid && (
              <div style={{
                fontSize: '12px',
                color: '#991b1b',
                marginTop: '4px'
              }}>
                {isPositionLegal().reason}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div style={{
            display: 'flex',
            gap: '10px',
            flexWrap: 'wrap',
            justifyContent: 'center'
          }}>
            <button
              onClick={analyzePosition}
              disabled={!isPositionLegal().valid}
              style={{
                padding: '12px 20px',
                backgroundColor: isPositionLegal().valid ? '#8b5cf6' : '#9ca3af',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: isPositionLegal().valid ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '14px',
                fontWeight: '600',
                opacity: isPositionLegal().valid ? 1 : 0.6
              }}
              title={isPositionLegal().valid ? 'Analyze this position' : isPositionLegal().reason}
            >
              <Eye size={16} />
              {isPositionLegal().valid ? 'Analyze Position' : 'Position Invalid'}
            </button>
            
            <button
              onClick={copyFEN}
              style={{
                padding: '12px 20px',
                backgroundColor: '#06b6d4',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '14px'
              }}
            >
              <Copy size={16} />
              Copy FEN
            </button>
            
            <button
              onClick={copyPGN}
              style={{
                padding: '12px 20px',
                backgroundColor: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '14px'
              }}
            >
              <Copy size={16} />
              Copy PGN
            </button>
            
            <button
              onClick={exportPosition}
              style={{
                padding: '12px 20px',
                backgroundColor: '#f59e0b',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '14px'
              }}
            >
              <Download size={16} />
              Export
            </button>
            
            <button
              onClick={generateShareLink}
              style={{
                padding: '12px 20px',
                backgroundColor: '#ec4899',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '14px'
              }}
            >
              <Share2 size={16} />
              Share
            </button>
          </div>
        </div>

        {/* Side Panel */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '20px',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
          backdropFilter: 'blur(10px)',
          overflow: 'auto'
        }}>
          
          {/* Piece Palette */}
          <div>
            <h3 style={{
              fontSize: '18px',
              fontWeight: 'bold',
              marginBottom: '15px',
              color: '#374151'
            }}>
              Piece Palette
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '8px'
            }}>
              {pieceTypes.map((piece) => (
                <button
                  key={piece.type}
                  onClick={() => {
                    console.log('🎯 Piece palette clicked:', piece);
                    setSelectedPiece(selectedPiece?.type === piece.type ? null : piece);
                  }}
                  style={{
                    padding: '12px',
                    backgroundColor: selectedPiece?.type === piece.type ? '#3b82f6' : '#f3f4f6',
                    color: selectedPiece?.type === piece.type ? 'white' : '#374151',
                    border: '2px solid',
                    borderColor: selectedPiece?.type === piece.type ? '#3b82f6' : '#e5e7eb',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s'
                  }}
                  title={piece.name}
                >
                  {piece.symbol}
                </button>
              ))}
            </div>
            {selectedPiece && (
              <div style={{
                marginTop: '10px',
                padding: '8px 12px',
                backgroundColor: '#dbeafe',
                border: '2px solid #3b82f6',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <div style={{
                  fontSize: '20px',
                  marginBottom: '4px'
                }}>
                  {selectedPiece.symbol}
                </div>
                <div style={{
                  fontSize: '12px',
                  color: '#1e40af',
                  fontWeight: '600'
                }}>
                  {selectedPiece.name}
                </div>
                <div style={{
                  fontSize: '10px',
                  color: '#6b7280',
                  marginTop: '2px',
                  marginBottom: '8px'
                }}>
                  Click on board to place
                </div>
                <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                  <button
                    onClick={() => setSelectedPiece(null)}
                    style={{
                      padding: '4px 8px',
                      backgroundColor: '#6b7280',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '10px'
                    }}
                  >
                    Clear
                  </button>
                </div>
              </div>
            )}
            
            {/* Remove Piece Mode */}
            <div style={{
              marginTop: '10px',
              padding: '8px 12px',
              backgroundColor: '#fef2f2',
              border: '2px solid #ef4444',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: '12px',
                color: '#dc2626',
                fontWeight: '600',
                marginBottom: '4px'
              }}>
                Remove Pieces
              </div>
              <div style={{
                fontSize: '10px',
                color: '#991b1b',
                marginBottom: '8px'
              }}>
                Click on pieces to remove them
              </div>
              <button
                onClick={() => {
                  console.log('🎯 Remove mode button clicked, current selectedPiece:', selectedPiece);
                  // Toggle remove mode
                  setSelectedPiece(selectedPiece === 'remove' ? null : 'remove');
                }}
                style={{
                  padding: '4px 8px',
                  backgroundColor: selectedPiece === 'remove' ? '#dc2626' : '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '10px'
                }}
              >
                {selectedPiece === 'remove' ? 'Exit Remove' : 'Remove Mode'}
              </button>
            </div>
          </div>

          {/* Import/Export */}
          <div>
            <h3 style={{
              fontSize: '18px',
              fontWeight: 'bold',
              marginBottom: '15px',
              color: '#374151'
            }}>
              Import/Export
            </h3>
            
            <button
              onClick={() => setShowImportDialog(true)}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#8b5cf6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                fontSize: '14px',
                marginBottom: '10px'
              }}
            >
              <Upload size={16} />
              Import Position
            </button>
            
            <div style={{
              fontSize: '12px',
              color: '#6b7280',
              marginBottom: '10px'
            }}>
              Current FEN:
            </div>
            <div style={{
              padding: '8px',
              backgroundColor: '#f9fafb',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              fontSize: '11px',
              fontFamily: 'monospace',
              wordBreak: 'break-all',
              marginBottom: '10px'
            }}>
              {boardPosition}
            </div>
          </div>

          {/* Game Settings */}
          <div>
            <h3 style={{
              fontSize: '18px',
              fontWeight: 'bold',
              marginBottom: '15px',
              color: '#374151',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <Settings size={16} />
              Game Settings
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px', display: 'block' }}>
                  Side to Move:
                </label>
                <select
                  value={gameSettings.sideToMove}
                  onChange={(e) => setGameSettings(prev => ({ ...prev, sideToMove: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '12px'
                  }}
                >
                  <option value="w">White</option>
                  <option value="b">Black</option>
                </select>
              </div>
              
              <div>
                <label style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px', display: 'block' }}>
                  Halfmove Clock:
                </label>
                <input
                  type="number"
                  value={gameSettings.halfmoveClock}
                  onChange={(e) => setGameSettings(prev => ({ ...prev, halfmoveClock: parseInt(e.target.value) || 0 }))}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '12px'
                  }}
                />
              </div>
              
              <div>
                <label style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px', display: 'block' }}>
                  Fullmove Number:
                </label>
                <input
                  type="number"
                  value={gameSettings.fullmoveNumber}
                  onChange={(e) => setGameSettings(prev => ({ ...prev, fullmoveNumber: parseInt(e.target.value) || 1 }))}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '12px'
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Import Dialog */}
      {showImportDialog && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            padding: '30px',
            borderRadius: '12px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            maxWidth: '500px',
            width: '90%'
          }}>
            <h3 style={{
              fontSize: '20px',
              fontWeight: 'bold',
              marginBottom: '20px',
              color: '#1f2937'
            }}>
              Import Position
            </h3>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                marginBottom: '8px',
                color: '#374151'
              }}>
                FEN String:
              </label>
              <textarea
                value={fenInput}
                onChange={(e) => setFenInput(e.target.value)}
                placeholder="Paste FEN string here..."
                rows={3}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px',
                  resize: 'vertical'
                }}
              />
              <button
                onClick={loadFEN}
                disabled={!fenInput.trim()}
                style={{
                  marginTop: '10px',
                  padding: '8px 16px',
                  backgroundColor: fenInput.trim() ? '#3b82f6' : '#9ca3af',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: fenInput.trim() ? 'pointer' : 'not-allowed',
                  fontSize: '12px'
                }}
              >
                Load FEN
              </button>
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                marginBottom: '8px',
                color: '#374151'
              }}>
                PGN String:
              </label>
              <textarea
                value={pgnInput}
                onChange={(e) => setPgnInput(e.target.value)}
                placeholder="Paste PGN string here..."
                rows={4}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px',
                  resize: 'vertical'
                }}
              />
              <button
                onClick={loadPGN}
                disabled={!pgnInput.trim()}
                style={{
                  marginTop: '10px',
                  padding: '8px 16px',
                  backgroundColor: pgnInput.trim() ? '#10b981' : '#9ca3af',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: pgnInput.trim() ? 'pointer' : 'not-allowed',
                  fontSize: '12px'
                }}
              >
                Load PGN
              </button>
            </div>
            
            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={() => setShowImportDialog(false)}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BoardEditorPage;