import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
// @ts-ignore
import { Pgn } from 'cm-pgn/src/cm-pgn/Pgn.js';
import ProductionChessBoard from './ProductionChessBoard';
import '../styles/chess-performance.css';

interface ChessAnnotationPageProps {
  className?: string;
}

const ChessAnnotationPage: React.FC<ChessAnnotationPageProps> = ({ className = '' }) => {
  const [game] = useState(() => new Chess());
  const [moves, setMoves] = useState<string[]>([]);
  const [currentMoveIndex, setCurrentMoveIndex] = useState(-1);
  const [boardOrientation, setBoardOrientation] = useState<'white' | 'black'>('white');
  const [boardSize, setBoardSize] = useState(500);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameHeaders, setGameHeaders] = useState({
    White: 'Player 1',
    Black: 'Player 2',
    Date: new Date().toISOString().split('T')[0],
    Result: '*'
  });

  // Error boundary state
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Error boundary effect
  useEffect(() => {
    const handleError = (error: ErrorEvent) => {
      console.error('Chess Annotation Error:', error);
      setHasError(true);
      setErrorMessage(error.message || 'An error occurred');
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  // PGN Memory Core - The game's memory and logbook (using actual cm-pgn)
  const [pgnMemory, setPgnMemory] = useState<Pgn | null>(null);
  const [currentVariation, setCurrentVariation] = useState<number[]>([]); // Track current variation path
  const [isInVariation, setIsInVariation] = useState(false);
  const [variationStack, setVariationStack] = useState<Array<{moveIndex: number, move: string, isVariation: boolean}>>([]);

  const [boardPosition, setBoardPosition] = useState('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');

  // Initialize PGN Memory Core using actual cm-pgn
  const initializePgnMemory = useCallback(() => {
    try {
      const initialPgn = `[Event "Chess Annotation Game"]
[Site "http://localhost:3000/chess-annotation"]
[Date "${new Date().toISOString().split('T')[0]}"]
[Round "1"]
[White "${gameHeaders.White}"]
[Black "${gameHeaders.Black}"]
[Result "*"]

`;
      const pgn = new Pgn(initialPgn);
      setPgnMemory(pgn);
      console.log('PGN Memory Core initialized with actual cm-pgn:', pgn);
      console.log('Headers:', pgn.header);
      console.log('History:', pgn.history);
    } catch (error) {
      console.error('Error initializing PGN Memory Core:', error);
    }
  }, [gameHeaders]);

  // Generate PGN string using cm-pgn's built-in methods
  const generatePgnFromChessGame = useCallback(() => {
    if (pgnMemory) {
      // Use cm-pgn's built-in render method
      try {
        return pgnMemory.render();
      } catch (error) {
        console.error('Error rendering PGN with cm-pgn:', error);
      }
    }
    
    // Fallback to chess.js PGN if cm-pgn is not available
    let pgnString = '';
    pgnString += `[Event "Chess Annotation Game"]\n`;
    pgnString += `[Site "http://localhost:3000/chess-annotation"]\n`;
    pgnString += `[Date "${new Date().toISOString().split('T')[0]}"]\n`;
    pgnString += `[Round "1"]\n`;
    pgnString += `[White "${gameHeaders.White}"]\n`;
    pgnString += `[Black "${gameHeaders.Black}"]\n`;
    pgnString += `[Result "*"]\n\n`;
    pgnString += game.pgn();
    pgnString += '\n\n';
    
    return pgnString;
  }, [pgnMemory, game, gameHeaders]);

  // Check if we're in a variation (going back and playing different move)
  const isPlayingVariation = useCallback((moveIndex: number) => {
    // If we're not at the end of the main line, we're playing a variation
    return moveIndex < moves.length - 1;
  }, [moves.length]);

  // Process move with PGN Memory Core using actual cm-pgn
  const processMoveWithPgnMemory = useCallback((move: any, isVariation: boolean = false, parentMoveIndex: number = -1) => {
    try {
      console.log('Processing move with cm-pgn Memory Core:', move, isVariation ? '(variation)' : '(main line)');
      
      if (isVariation && parentMoveIndex >= 0) {
        // Create a new PGN with variation using cm-pgn
        console.log('Adding variation using cm-pgn API at move', parentMoveIndex);
        
        // Build PGN string with variation
        let pgnString = generatePgnFromChessGame();
        
        // Find the position to insert the variation
        const lines = pgnString.split('\n');
        const moveLines = lines.filter(line => line.trim() && !line.startsWith('['));
        
        if (moveLines.length > 0) {
          const mainLine = moveLines[0];
          const moveTokens = mainLine.split(' ');
          let insertIndex = -1;
          
          // Find where to insert the variation
          for (let i = 0; i < moveTokens.length; i++) {
            if (moveTokens[i].includes(`${Math.floor(parentMoveIndex / 2) + 1}.`)) {
              insertIndex = i;
              break;
            }
          }
          
          if (insertIndex !== -1) {
            // Insert variation
            const variationText = `(${move.san})`;
            moveTokens.splice(insertIndex + 1, 0, variationText);
            
            // Rebuild the PGN
            const newMainLine = moveTokens.join(' ');
            lines[lines.findIndex(line => line === mainLine)] = newMainLine;
            pgnString = lines.join('\n');
          }
        }
        
        // Create new Pgn instance with variation
        const updatedPgn = new Pgn(pgnString);
        setPgnMemory(updatedPgn);
        
      } else {
        // Add to main line - rebuild PGN with new move
        console.log('Adding to main line using cm-pgn API');
        const pgnString = generatePgnFromChessGame();
        const updatedPgn = new Pgn(pgnString);
        setPgnMemory(updatedPgn);
      }
      
      console.log('PGN Memory Core updated with cm-pgn:', move.san);
    } catch (error) {
      console.error('Error processing move with PGN Memory Core:', error);
    }
  }, [generatePgnFromChessGame]);
  
  // Handle piece drop for react-chessboard
  const onPieceDrop = useCallback((sourceSquare: string, targetSquare: string, piece: string) => {
    console.log('🎯 Piece drop:', { sourceSquare, targetSquare, piece });
    console.log('🎯 Current move index:', currentMoveIndex);
    console.log('🎯 Total moves:', moves.length);
    
    try {
      const moveObj = {
        from: sourceSquare,
        to: targetSquare,
        promotion: piece[1] === 'P' && (targetSquare[1] === '8' || targetSquare[1] === '1') ? 'q' : undefined
      };
      
      console.log('🎯 Attempting move with object:', moveObj);
      console.log('🎯 Current game FEN:', game.fen());
      
      // Try to make the move
      const chessMove = game.move(moveObj);
      if (chessMove) {
        console.log('🎯 Move successful:', chessMove.san);
        
        // Check if we're playing a variation (not at the end of main line)
        const isVariation = isPlayingVariation(currentMoveIndex);
        console.log('🎯 Is variation:', isVariation);
        
        if (isVariation) {
          // We're playing a variation - add it to the variation stack
          console.log('🎯 Adding variation at move', currentMoveIndex, ':', chessMove.san);
          setVariationStack(prev => [...prev, {
            moveIndex: currentMoveIndex,
            move: chessMove.san,
            isVariation: true
          }]);
          
          // Process as variation
          processMoveWithPgnMemory(chessMove, true, currentMoveIndex);
        } else {
          // We're continuing the main line
          console.log('🎯 Continuing main line with:', chessMove.san);
          processMoveWithPgnMemory(chessMove, false);
        }
        
        // Add move to moves array
        setMoves(prevMoves => {
          const updatedMoves = [...prevMoves, chessMove.san];
          setCurrentMoveIndex(updatedMoves.length - 1);
          return updatedMoves;
        });
        
        // Update board position
        setBoardPosition(game.fen());
        
        return true; // Accept the move
      } else {
        console.log('🎯 Move rejected by chess.js');
        return false;
      }
      
    } catch (error) {
      console.warn('🎯 Move error:', error);
      return false;
    }
  }, [game, processMoveWithPgnMemory, currentMoveIndex, moves.length, isPlayingVariation]);


  // Sample PGN with complex variations for demonstration
  const samplePGN = `[Event "Test Game"]
[Site "Chess Annotation Demo"]
[Date "2024.01.01"]
[Round "1"]
[White "Player A"]
[Black "Player B"]
[Result "*"]

1. e4 e5 2. Nf3 Nc6 3. Bc4 {Italian Game} 
(3. Bb5 {Ruy Lopez} a6 4. Ba4 Nf6 5. O-O Be7 
  (5... b5 {Marshall Attack} 6. Bb3 Bb7 7. Re1 Bc5 
    (7... d6 {Alternative} 8. c3 O-O 9. h3 {Quiet continuation})
    8. c3 d6 9. d4 Bb6 {Complex position})
  6. Re1 b5 7. Bb3 O-O 8. c3 d6)
Be5 
(3... f5 {Rousseau Gambit} 4. d3 
  (4. exf5 {Accepting the gambit} e4 5. Ng5 Nf6 6. f3 
    (6. Nc3 {Development} Bc5 7. f3 exf3 8. Nxf3 O-O {Sharp play})
    exf3 7. Nxf3 d5 8. Bb3 Bd6 {Compensation})
  fxe4 5. dxe4 Nf6 6. Nc3 Bb4 {Pin})
4. d3 Nf6 5. Ng5 
(5. Nc3 {Alternative development} Bxf3 6. gxf3 d6 7. f4 exf4 8. Bxf4 {Imbalanced position})
d6 
(5... O-O {Castling early} 6. f4 exf4 7. Bxf4 d6 8. Nf3 Bg4 {Pin on the knight})`;

  // Update board position based on current move
  const updateBoardPosition = useCallback(() => {
    try {
      // Reset game to starting position
      game.reset();
      
      // Replay moves up to current position
      for (let i = 0; i <= currentMoveIndex && i < moves.length; i++) {
        try {
          game.move(moves[i]);
        } catch (error) {
          console.warn('Error replaying move:', moves[i], error);
        }
      }
      
      setBoardPosition(game.fen());
    } catch (error) {
      console.error('Error updating board position:', error);
    }
  }, [game, moves, currentMoveIndex]);


  // Initialize board position when component mounts
  useEffect(() => {
    setBoardPosition('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
  }, []);

  // Initialize PGN Memory Core on component mount
  useEffect(() => {
    console.log('Initializing PGN Memory Core...');
    initializePgnMemory();
  }, [initializePgnMemory]);

  // Load sample PGN on component mount
  useEffect(() => {
    console.log('Sample PGN available for demonstration');
    // Note: We don't load the PGN into the game state as it would interfere with move input
    // The PGN is available in pgnMemory for display purposes
    try {
      // Initialize with empty game state for move input
      setMoves([]);
      setCurrentMoveIndex(-1);
      updateBoardPosition();
    } catch (error) {
      console.error('Error initializing game state:', error);
    }
  }, []);

  // Add variation support using proper cm-pgn variation structure
  const addVariation = useCallback((moveIndex: number, variationMove: string) => {
    try {
      console.log('Adding variation at move', moveIndex, ':', variationMove);
      
      // Create a temporary chess game to validate the variation move
      const tempGame = new Chess();
      
      // Replay moves up to the variation point
      for (let i = 0; i <= moveIndex && i < moves.length; i++) {
        tempGame.move(moves[i]);
      }
      
      // Try to make the variation move
      const variationMoveObj = tempGame.move(variationMove);
      if (!variationMoveObj) {
        console.error('Invalid variation move:', variationMove);
        return;
      }
      
      // Build PGN with variation using proper PGN syntax
      let pgnString = generatePgnFromChessGame();
      
      // Find the position to insert the variation
      const lines = pgnString.split('\n');
      const moveLines = lines.filter(line => line.trim() && !line.startsWith('['));
      
      if (moveLines.length > 0) {
        const mainLine = moveLines[0];
        const moveTokens = mainLine.split(' ');
        let insertIndex = -1;
        
        // Find where to insert the variation
        for (let i = 0; i < moveTokens.length; i++) {
          if (moveTokens[i].includes(`${Math.floor(moveIndex / 2) + 1}.`)) {
            insertIndex = i;
            break;
          }
        }
        
        if (insertIndex !== -1) {
          // Insert variation
          const variationText = `(${variationMove})`;
          moveTokens.splice(insertIndex + 1, 0, variationText);
          
          // Rebuild the PGN
          const newMainLine = moveTokens.join(' ');
          lines[lines.findIndex(line => line === mainLine)] = newMainLine;
          pgnString = lines.join('\n');
        }
      }
      
      console.log('Generated PGN with variation:', pgnString);
      
      // Create new Pgn instance with variation
      const updatedPgn = new Pgn(pgnString);
      setPgnMemory(updatedPgn);
      
      console.log('Variation added to cm-pgn Memory Core');
      
    } catch (error) {
      console.error('Error adding variation:', error);
    }
  }, [moves, generatePgnFromChessGame]);

  // Add comment/annotation to a move
  const addComment = useCallback((moveIndex: number, comment: string) => {
    try {
      console.log('Adding comment to move', moveIndex, ':', comment);
      
      // Build PGN with comment using proper PGN syntax
      let pgnString = generatePgnFromChessGame();
      
      // Find the position to insert the comment
      const lines = pgnString.split('\n');
      const moveLines = lines.filter(line => line.trim() && !line.startsWith('['));
      
      if (moveLines.length > 0) {
        const mainLine = moveLines[0];
        const moveTokens = mainLine.split(' ');
        let insertIndex = -1;
        
        // Find the specific move to add comment to
        for (let i = 0; i < moveTokens.length; i++) {
          if (moveTokens[i].includes(`${Math.floor(moveIndex / 2) + 1}.`)) {
            insertIndex = i;
            break;
          }
        }
        
        if (insertIndex !== -1) {
          // Insert comment after the move
          const commentText = `{${comment}}`;
          moveTokens.splice(insertIndex + 1, 0, commentText);
          
          // Rebuild the PGN
          const newMainLine = moveTokens.join(' ');
          lines[lines.findIndex(line => line === mainLine)] = newMainLine;
          pgnString = lines.join('\n');
        }
      }
      
      console.log('Generated PGN with comment:', pgnString);
      
      // Create new Pgn instance with comment
      const updatedPgn = new Pgn(pgnString);
      setPgnMemory(updatedPgn);
      
      console.log('Comment added to cm-pgn Memory Core');
      
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  }, [generatePgnFromChessGame]);

  // Navigate to specific move
  const navigateToMove = useCallback((moveIndex: number) => {
    if (moveIndex >= 0 && moveIndex < moves.length) {
      setCurrentMoveIndex(moveIndex);
      updateBoardPosition();
    }
  }, [moves.length, updateBoardPosition]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault();
          navigateToMove(currentMoveIndex - 1);
          break;
        case 'ArrowRight':
          event.preventDefault();
          navigateToMove(currentMoveIndex + 1);
          break;
        case 'Home':
          event.preventDefault();
          navigateToMove(0);
          break;
        case 'End':
          event.preventDefault();
          navigateToMove(moves.length - 1);
          break;
        case ' ':
          event.preventDefault();
          setIsPlaying(!isPlaying);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentMoveIndex, moves.length, isPlaying, navigateToMove]);

  // Auto-play functionality
  useEffect(() => {
    if (!isPlaying || currentMoveIndex >= moves.length - 1) {
      setIsPlaying(false);
      return;
    }

    const timer = setTimeout(() => {
      navigateToMove(currentMoveIndex + 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [isPlaying, currentMoveIndex, moves.length, navigateToMove]);

  // Render moves with proper formatting
  const renderMoves = (): JSX.Element[] => {
    return moves.map((move, index) => {
      const moveNumber = Math.floor(index / 2) + 1;
      const isWhite = index % 2 === 0;
      
      return (
        <div key={index} style={{ marginBottom: '8px' }}>
          <span
            className={`move-item ${currentMoveIndex === index ? 'current-move' : ''}`}
            onClick={() => navigateToMove(index)}
            style={{
              cursor: 'pointer',
              padding: '6px 10px',
              margin: '2px',
              borderRadius: '6px',
              backgroundColor: currentMoveIndex === index ? '#3b82f6' : 'transparent',
              color: currentMoveIndex === index ? 'white' : 'inherit',
              display: 'inline-block',
              fontWeight: '500',
              transition: 'all 0.2s ease',
              border: '1px solid #e5e7eb',
              minWidth: '80px',
              textAlign: 'center'
            }}
          >
            {isWhite ? `${moveNumber}. ${move}` : move}
          </span>
        </div>
      );
    });
  };

  // Generate Full PGN Logbook from Memory Core using actual cm-pgn
  const generatePgnLogbook = useCallback(() => {
    if (!pgnMemory) {
      // Fallback to chess.js PGN if no cm-pgn memory
      return generatePgnFromChessGame();
    }
    
    try {
      // Use actual cm-pgn's render method to generate the PGN
      const pgnString = pgnMemory.render();
      console.log('Generated PGN Logbook from cm-pgn Memory Core:', pgnString);
      return pgnString;
    } catch (error) {
      console.error('Error generating PGN logbook:', error);
      // Fallback to chess.js PGN
      return generatePgnFromChessGame();
    }
  }, [pgnMemory, generatePgnFromChessGame]);

  // Load PGN from file
  const loadPGN = useCallback((pgnString: string) => {
    try {
      console.log('Loading PGN:', pgnString);
      
      // Parse with cm-pgn first to get full structure
      const pgn = new Pgn(pgnString);
      setPgnMemory(pgn);
      
      // Also load into chess.js for move validation
      game.load_pgn(pgnString);
      
      // Update moves array from chess.js
      const gameMoves = game.history();
      setMoves(gameMoves);
      setCurrentMoveIndex(gameMoves.length - 1);
      
      // Update board position
      updateBoardPosition();
      
      console.log('PGN loaded successfully with cm-pgn and chess.js');
    } catch (error) {
      console.error('Error loading PGN:', error);
    }
  }, [game, updateBoardPosition]);

  // Export PGN - Enhanced with Memory Core
  const exportPGN = () => {
    try {
      // Generate the full PGN logbook from memory core
      const pgnLogbook = generatePgnLogbook();
      
      // Fallback to chess.js PGN if memory core is not available
      const pgn = pgnLogbook || game.pgn();
      
      const blob = new Blob([pgn], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `chess-annotation-${new Date().toISOString().split('T')[0]}.pgn`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      console.log('PGN exported successfully from Memory Core');
    } catch (error) {
      console.error('Error exporting PGN:', error);
    }
  };

  // Show error message if there's an error
  if (hasError) {
    return (
      <div className={`chess-annotation-page ${className}`} style={{ 
        padding: '20px', 
        maxWidth: '1400px', 
        margin: '0 auto',
        backgroundColor: '#fafafa',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <h1 style={{ color: '#ef4444', marginBottom: '20px' }}>Chess Annotation Error</h1>
        <p style={{ color: '#6b7280', marginBottom: '20px' }}>{errorMessage}</p>
        <button
          onClick={() => {
            setHasError(false);
            setErrorMessage('');
            window.location.reload();
          }}
          style={{
            padding: '10px 20px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          Reload Page
        </button>
      </div>
    );
  }

  return (
    <div className={`chess-annotation-page ${className}`} style={{ 
      padding: '20px', 
      maxWidth: '1400px', 
      margin: '0 auto',
      backgroundColor: '#fafafa',
      minHeight: '100vh'
    }}>
      <h1 style={{ 
        textAlign: 'center', 
        marginBottom: '30px',
        color: '#333',
        fontSize: '2.5em'
      }}>
        Chess Annotation
      </h1>
      
      <div style={{ 
        display: 'flex', 
        gap: '20px',
        flexWrap: 'wrap',
        justifyContent: 'center'
      }}>
        {/* Left Side - Chess Board */}
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center',
          gap: '15px'
        }}>
          {/* Navigation Controls */}
          <div style={{ 
            display: 'flex', 
            gap: '10px',
            alignItems: 'center',
            marginBottom: '10px',
            flexWrap: 'wrap'
          }}>
            <button
              onClick={() => {
                game.reset();
                setMoves([]);
                setCurrentMoveIndex(-1);
                updateBoardPosition();
              }}
              style={{
                padding: '8px 12px',
                backgroundColor: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              New Game 🆕
            </button>
            
            <button
              onClick={() => navigateToMove(0)}
              disabled={moves.length === 0}
              style={{
                padding: '8px 12px',
                backgroundColor: moves.length === 0 ? '#9ca3af' : '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: moves.length === 0 ? 'not-allowed' : 'pointer',
                fontSize: '14px'
              }}
            >
              Start ⏮️
            </button>
            
            <button
              onClick={() => navigateToMove(currentMoveIndex - 1)}
              disabled={currentMoveIndex <= 0}
              style={{
                padding: '8px 12px',
                backgroundColor: currentMoveIndex <= 0 ? '#9ca3af' : '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: currentMoveIndex <= 0 ? 'not-allowed' : 'pointer',
                fontSize: '14px'
              }}
            >
              Previous ⏪
            </button>
            
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              disabled={moves.length === 0}
              style={{
                padding: '8px 12px',
                backgroundColor: moves.length === 0 ? '#9ca3af' : (isPlaying ? '#ef4444' : '#10b981'),
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: moves.length === 0 ? 'not-allowed' : 'pointer',
                fontSize: '14px'
              }}
            >
              {isPlaying ? 'Pause ⏸️' : 'Play ▶️'}
            </button>
            
            <button
              onClick={() => navigateToMove(currentMoveIndex + 1)}
              disabled={currentMoveIndex >= moves.length - 1}
              style={{
                padding: '8px 12px',
                backgroundColor: currentMoveIndex >= moves.length - 1 ? '#9ca3af' : '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: currentMoveIndex >= moves.length - 1 ? 'not-allowed' : 'pointer',
                fontSize: '14px'
              }}
            >
              Next ⏩
            </button>
            
            <button
              onClick={() => navigateToMove(moves.length - 1)}
              disabled={moves.length === 0}
              style={{
                padding: '8px 12px',
                backgroundColor: moves.length === 0 ? '#9ca3af' : '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: moves.length === 0 ? 'not-allowed' : 'pointer',
                fontSize: '14px'
              }}
            >
              End ⏭️
            </button>
            
            <button
              onClick={() => addVariation(currentMoveIndex, 'Nf3')}
              disabled={moves.length === 0}
              style={{
                padding: '8px 12px',
                backgroundColor: moves.length === 0 ? '#9ca3af' : '#8b5cf6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: moves.length === 0 ? 'not-allowed' : 'pointer',
                fontSize: '14px'
              }}
            >
              Add Variation 🌿
            </button>
            
            <button
              onClick={() => addComment(currentMoveIndex, 'Great move!')}
              disabled={moves.length === 0}
              style={{
                padding: '8px 12px',
                backgroundColor: moves.length === 0 ? '#9ca3af' : '#f59e0b',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: moves.length === 0 ? 'not-allowed' : 'pointer',
                fontSize: '14px'
              }}
            >
              Add Comment 💬
            </button>
            
            <button
              onClick={exportPGN}
              disabled={moves.length === 0}
              style={{
                padding: '8px 12px',
                backgroundColor: moves.length === 0 ? '#9ca3af' : '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: moves.length === 0 ? 'not-allowed' : 'pointer',
                fontSize: '14px'
              }}
            >
              Export PGN 💾
            </button>
            
            <input
              type="file"
              accept=".pgn"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = (event) => {
                    const pgnString = event.target?.result as string;
                    loadPGN(pgnString);
                  };
                  reader.readAsText(file);
                }
              }}
              style={{ display: 'none' }}
              id="pgn-file-input"
            />
            
            <button
              onClick={() => document.getElementById('pgn-file-input')?.click()}
              style={{
                padding: '8px 12px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Import PGN 📁
            </button>
          </div>

          {/* Chess Board */}
          <div style={{ marginBottom: '15px', width: '100%', maxWidth: boardSize }}>
            <ProductionChessBoard
              position={boardPosition}
              onMove={(from, to) => onPieceDrop(from, to, '')}
              boardOrientation={boardOrientation}
              boardSize={boardSize}
              fitToParent={true}
              showBoardNotation={true}
              arePiecesDraggable={true}
              customBoardStyle={{
                borderRadius: '8px',
                boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)'
              }}
            />
          </div>

          {/* Board Controls */}
          <div style={{ 
            display: 'flex', 
            gap: '10px',
            alignItems: 'center'
          }}>
            <label style={{ fontWeight: 'bold' }}>
              Board Size:
              <input
                type="range"
                min="400"
                max="700"
                value={boardSize}
                onChange={(e) => setBoardSize(parseInt(e.target.value))}
                style={{ marginLeft: '8px' }}
              />
              <span style={{ marginLeft: '8px' }}>{boardSize}px</span>
            </label>
            
            <button
              onClick={() => setBoardOrientation(prev => prev === 'white' ? 'black' : 'white')}
              style={{
                padding: '8px 12px',
                backgroundColor: '#9c27b0',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              🔄 Flip Board
            </button>
          </div>

          {/* Game Status */}
          <div style={{ 
            textAlign: 'center', 
            fontSize: '14px',
            color: '#6b7280',
            padding: '10px',
            backgroundColor: '#f3f4f6',
            borderRadius: '8px'
          }}>
            <div>Move {currentMoveIndex + 1} of {moves.length}</div>
            <div>Position: {game.fen()}</div>
            <div style={{ color: '#6b7280', fontSize: '12px', marginTop: '5px' }}>
              Game status: Active
            </div>
          </div>

          {/* PGN Memory Core Status */}
          <div style={{ 
            textAlign: 'center', 
            fontSize: '12px',
            color: pgnMemory ? '#10b981' : '#ef4444',
            padding: '8px',
            backgroundColor: '#f0f9ff',
            borderRadius: '6px',
            border: `2px solid ${pgnMemory ? '#10b981' : '#ef4444'}`,
            marginTop: '10px'
          }}>
            <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
              🧠 PGN Memory Core
            </div>
            <div>
              Status: {pgnMemory ? '✅ Active' : '❌ Inactive'}
            </div>
            <div style={{ fontSize: '10px', marginTop: '2px' }}>
              {pgnMemory ? `Active - ${pgnMemory.history.moves.length} moves recorded` : 'Memory Core not initialized'}
            </div>
          </div>

          {/* Keyboard Shortcuts */}
          <div style={{ 
            fontSize: '12px', 
            color: '#9ca3af', 
            textAlign: 'center',
            marginTop: '10px'
          }}>
            Use ← → arrow keys to navigate moves
          </div>
        </div>

        {/* Right Side - Chess Moments */}
        <div style={{ flex: '1', minWidth: '400px' }}>
          <div style={{ 
            backgroundColor: '#f9fafb', 
            padding: '20px', 
            borderRadius: '12px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            maxHeight: '600px',
            overflowY: 'auto'
          }}>
            <h3 style={{ 
              color: '#1f2937', 
              marginBottom: '15px',
              fontSize: '18px',
              fontWeight: '600'
            }}>
              Move History
            </h3>
            
            <div style={{ marginBottom: '15px' }}>
              <div style={{ 
                fontSize: '12px', 
                color: '#6b7280',
                marginBottom: '10px'
              }}>
                Features: <span style={{ color: '#1f2937', fontWeight: '500' }}>Proper Notation</span> | 
                <span style={{ color: '#ef4444' }}> Move Numbering</span> | 
                <span style={{ color: '#8b5cf6' }}> Variations</span> | 
                <span style={{ color: '#f59e0b' }}> Comments</span>
              </div>
            </div>

            {/* PGN Memory Core Variations Display */}
            {pgnMemory && (
              <div style={{ 
                marginBottom: '15px',
                padding: '10px',
                backgroundColor: '#f0f9ff',
                borderRadius: '6px',
                border: '1px solid #0ea5e9'
              }}>
                <div style={{ 
                  fontSize: '12px', 
                  fontWeight: 'bold', 
                  color: '#0c4a6e',
                  marginBottom: '8px'
                }}>
                  🧠 PGN Memory Core - Variations & Comments
                  <span style={{ fontSize: '10px', color: '#64748b', marginLeft: '8px' }}>
                    (Moves: {pgnMemory.history.moves.length})
                  </span>
                </div>
                {pgnMemory.history.moves.map((move, index) => (
                  <div key={index} style={{ 
                    fontSize: '11px', 
                    marginBottom: '4px',
                    color: '#0c4a6e'
                  }}>
                    <span style={{ fontWeight: '500' }}>
                      {Math.floor(index / 2) + 1}.{index % 2 === 0 ? '' : '..'} {move.san}
                    </span>
                    {move.commentAfter && (
                      <span style={{ color: '#f59e0b', marginLeft: '8px' }}>
                        💬 "{move.commentAfter}"
                      </span>
                    )}
                    {move.variations && move.variations.length > 0 && (
                      <div style={{ marginLeft: '16px', marginTop: '4px' }}>
                        {move.variations.map((variation, varIndex) => (
                          <div key={varIndex} style={{ 
                            color: '#8b5cf6',
                            fontSize: '10px',
                            marginBottom: '2px'
                          }}>
                            🌿 {variation.san || variation}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                
                {/* Show variation stack */}
                {variationStack.length > 0 && (
                  <div style={{ 
                    marginTop: '10px',
                    padding: '8px',
                    backgroundColor: '#fef3c7',
                    borderRadius: '4px',
                    border: '1px solid #f59e0b'
                  }}>
                    <div style={{ 
                      fontSize: '10px', 
                      fontWeight: 'bold', 
                      color: '#92400e',
                      marginBottom: '4px'
                    }}>
                      📚 Variation Stack
                    </div>
                    {variationStack.map((variation, index) => (
                      <div key={index} style={{ 
                        fontSize: '9px', 
                        color: '#92400e',
                        marginBottom: '2px'
                      }}>
                        Move {variation.moveIndex + 1}: {variation.move}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {moves.length > 0 ? (
              <div style={{ fontFamily: 'monospace', fontSize: '14px' }}>
                {renderMoves()}
              </div>
            ) : (
              <div style={{ 
                textAlign: 'center', 
                color: '#9ca3af',
                padding: '40px',
                fontSize: '16px'
              }}>
                No moves recorded yet.<br />
                Start playing to see move history!
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Game Headers */}
      <div style={{ 
        marginTop: '20px',
        backgroundColor: '#f9fafb', 
        padding: '15px', 
        borderRadius: '12px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
      }}>
        <h4 style={{ color: '#1f2937', marginBottom: '10px' }}>Game Information</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
          {Object.entries(gameHeaders).map(([key, value]) => (
            <div key={key} style={{ fontSize: '14px' }}>
              <span style={{ fontWeight: '500', color: '#374151' }}>{key}:</span>{' '}
              <span style={{ color: '#6b7280' }}>{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* PGN Export - Enhanced with Memory Core */}
      <div style={{ 
        marginTop: '20px',
        backgroundColor: '#f9fafb', 
        padding: '15px', 
        borderRadius: '12px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
      }}>
        <h4 style={{ color: '#1f2937', marginBottom: '10px' }}>
          PGN Logbook (Generated from Memory Core)
        </h4>
        <div style={{ 
          fontSize: '12px', 
          color: '#6b7280', 
          marginBottom: '10px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <span>🧠 Memory Core Status:</span>
          <span style={{ 
            color: pgnMemory ? '#10b981' : '#ef4444',
            fontWeight: 'bold'
          }}>
            {pgnMemory ? 'Active' : 'Inactive'}
          </span>
        </div>
        <textarea
          value={moves.length > 0 ? generatePgnLogbook() : ''}
          readOnly
          style={{
            width: '100%',
            height: '150px',
            padding: '10px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            fontFamily: 'monospace',
            fontSize: '12px',
            backgroundColor: '#fff'
          }}
        />
        <div style={{ 
          fontSize: '10px', 
          color: '#9ca3af', 
          marginTop: '5px',
          fontStyle: 'italic'
        }}>
          This PGN is generated from the PGN Memory Core, ensuring complete game documentation with all main lines and variations.
        </div>
      </div>
    </div>
  );
};

export default ChessAnnotationPage;