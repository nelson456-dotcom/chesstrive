import React, { useState, useEffect } from 'react';

const ChessBoardPage = () => {
  const [gameState, setGameState] = useState(null);
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    initializeGame();
  }, []);

  const PIECE_UNICODE = {
    'K': '♔', 'Q': '♕', 'R': '♖', 'B': '♗', 'N': '♘', 'P': '♙',
    'k': '♚', 'q': '♛', 'r': '♜', 'b': '♝', 'n': '♞', 'p': '♟'
  };

  const initializeGame = () => {
    try {
      console.log('🎯 Starting game initialization...');
      
      const initialBoard = [
        ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'],
        ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
        ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R']
      ];

      console.log('🎯 Initial board created');

      const pgn = '1. e4 e5 2. Nf3 Nc6 3. Bc4 (3. Nc3 Nf6 (3... Bc5 4. d3 d6 5. Be2 Nf6 6. O-O (6. Bg5))) *';
      console.log('🎯 Parsing PGN:', pgn);
      
      const moveTree = parsePGN(pgn);
      console.log('🎯 Move tree parsed:', moveTree);

      const gameState = {
        board: JSON.parse(JSON.stringify(initialBoard)),
        moveSequence: [],
        moveTree: moveTree,
        whiteToMove: true
      };
      
      console.log('🎯 Setting game state:', gameState);
      setGameState(gameState);
      console.log('🎯 Game state set successfully!');
      
    } catch (error) {
      console.error('❌ Error in initializeGame:', error);
      console.error('❌ Error stack:', error.stack);
      
      // Set a minimal fallback state
      setGameState({
        board: [
          ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'],
          ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'],
          [null, null, null, null, null, null, null, null],
          [null, null, null, null, null, null, null, null],
          [null, null, null, null, null, null, null, null],
          [null, null, null, null, null, null, null, null],
          ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
          ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R']
        ],
        moveSequence: [],
        moveTree: [],
        whiteToMove: true
      });
    }
  };

  const parsePGN = (pgnString) => {
    try {
      console.log('🎯 Starting PGN parsing...');
      let index = 0;
      const text = pgnString.trim();

      const skipWhitespace = () => {
        while (index < text.length && /\s/.test(text[index])) index++;
      };

      const peek = () => text[index];

      const parseMoveSequence = (startMoveNumber, startWhiteTurn) => {
        const moves = [];
        let moveNumber = startMoveNumber;
        let isWhite = startWhiteTurn;

        while (index < text.length) {
          skipWhitespace();

          if (index >= text.length || peek() === ')' || peek() === '*') {
            break;
          }

          // Parse move number
          if (/\d/.test(peek())) {
            let numStr = '';
            while (index < text.length && /\d/.test(text[index])) {
              numStr += text[index];
              index++;
            }
            moveNumber = parseInt(numStr, 10);

            skipWhitespace();

            // Skip dots
            if (peek() === '.') {
              index++;
              if (peek() === '.') {
                index++;
                isWhite = false;
              } else {
                isWhite = true;
              }
            }
            skipWhitespace();
            continue;
          }

          // Handle variations
          if (peek() === '(') {
            index++; // consume '('
            if (moves.length > 0) {
              const lastMove = moves[moves.length - 1];
              if (!lastMove.variations) lastMove.variations = [];
              lastMove.variations.push(parseMoveSequence(moveNumber, isWhite));
            }
            skipWhitespace();
            if (peek() === ')') index++;
            skipWhitespace();
            continue;
          }

          // Parse move
          let move = '';
          while (index < text.length && /[a-zA-Z0-9\-=+#O]/.test(text[index])) {
            move += text[index];
            index++;
          }

          if (move && move !== '*') {
            const moveObj = {
              move: move,
              moveNumber: moveNumber,
              isWhite: isWhite,
              notation: isWhite ? `${moveNumber}. ${move}` : `${moveNumber}... ${move}`,
              variations: []
            };

            moves.push(moveObj);
            isWhite = !isWhite;
            if (!isWhite) moveNumber++;
          }

          skipWhitespace();
        }

        return moves;
      };

      const result = parseMoveSequence(1, true);
      console.log('🎯 PGN parsing completed:', result);
      return result;
      
    } catch (error) {
      console.error('❌ Error in parsePGN:', error);
      console.error('❌ Error stack:', error.stack);
      return []; // Return empty array on error
    }
  };

  const getSquareCoords = (moveStr) => {
    const matches = moveStr.match(/[a-h][1-8]/g);
    if (!matches || matches.length < 1) return null;
    return matches[matches.length - 1];
  };

  const squareToIndices = (square) => {
    if (!square || square.length !== 2) return null;
    const file = square.charCodeAt(0) - 97; // a=0, b=1, ..., h=7
    const rank = 8 - parseInt(square[1]); // 8->0, 1->7
    return [rank, file];
  };

  const applyMove = (board, move) => {
    const newBoard = board.map(row => [...row]);

    // Handle castling
    if (move === 'O-O') {
      // Kingside castling
      for (let r = 0; r < 8; r++) {
        for (let f = 0; f < 8; f++) {
          if (newBoard[r][f] === 'K') {
            newBoard[r][f] = null;
            newBoard[r][6] = 'K';
            newBoard[r][7] = null;
            newBoard[r][5] = 'R';
            return newBoard;
          }
          if (newBoard[r][f] === 'k') {
            newBoard[r][f] = null;
            newBoard[r][6] = 'k';
            newBoard[r][7] = null;
            newBoard[r][5] = 'r';
            return newBoard;
          }
        }
      }
      return newBoard;
    }

    if (move === 'O-O-O') {
      // Queenside castling
      for (let r = 0; r < 8; r++) {
        for (let f = 0; f < 8; f++) {
          if (newBoard[r][f] === 'K') {
            newBoard[r][f] = null;
            newBoard[r][2] = 'K';
            newBoard[r][0] = null;
            newBoard[r][3] = 'R';
            return newBoard;
          }
          if (newBoard[r][f] === 'k') {
            newBoard[r][f] = null;
            newBoard[r][2] = 'k';
            newBoard[r][0] = null;
            newBoard[r][3] = 'r';
            return newBoard;
          }
        }
      }
      return newBoard;
    }

    // Regular move
    const toSquare = getSquareCoords(move);
    if (!toSquare) return newBoard;

    const [toRank, toFile] = squareToIndices(toSquare);
    if (toRank === null) return newBoard;

    const pieceLetter = move[0].toUpperCase() === move[0] && move[0] !== move[0].toLowerCase() ? move[0] : 'P';

    // Find the piece
    for (let r = 0; r < 8; r++) {
      for (let f = 0; f < 8; f++) {
        const piece = newBoard[r][f];
        if (!piece) continue;

        const isWhitePiece = piece === piece.toUpperCase();
        const isBlackPiece = piece === piece.toLowerCase();
        const isCorrectColor = (gameState?.whiteToMove ?? true) ? isWhitePiece : isBlackPiece;
        const isCorrectType = piece.toUpperCase() === pieceLetter;

        if (isCorrectColor && isCorrectType) {
          // Simple heuristic: just move to destination
          newBoard[r][f] = null;
          const movedPiece = isWhitePiece ? pieceLetter : pieceLetter.toLowerCase();
          newBoard[toRank][toFile] = movedPiece;
          return newBoard;
        }
      }
    }

    return newBoard;
  };

  const handleClickMove = (moveObj, pathArray) => {
    const initialBoard = [
      ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'],
      ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
      ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R']
    ];

    let board = JSON.parse(JSON.stringify(initialBoard));
    let moves = [];

    // Replay moves in path
    for (const m of pathArray) {
      board = applyMove(board, m);
      moves.push(m);
    }

    setGameState(prev => ({
      ...prev,
      board: board,
      moveSequence: moves,
      whiteToMove: moves.length % 2 === 0
    }));
  };

  const toggleExpanded = (id) => {
    setExpanded(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const MoveNode = ({ moveObj, pathArray = [] }) => {
    const nodeKey = `${pathArray.join('-')}-${moveObj.notation}`;
    const isExpanded = expanded[nodeKey];
    const hasVariations = moveObj.variations && moveObj.variations.length > 0;

    const newPath = [...pathArray, moveObj.move];

    return (
      <div key={nodeKey} className="inline-block">
        <div className="inline-flex items-center gap-0.5">
          {hasVariations && (
            <button
              onClick={() => toggleExpanded(nodeKey)}
              className="w-5 h-5 p-0 flex items-center justify-center text-gray-600 hover:bg-gray-200 rounded"
            >
              {isExpanded ? '▼' : '▶'}
            </button>
          )}
          <button
            onClick={() => handleClickMove(moveObj, newPath)}
            className={`px-2 py-1 rounded font-mono text-sm ${
              hasVariations
                ? 'bg-yellow-200 text-yellow-900 hover:bg-yellow-300'
                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            }`}
          >
            {moveObj.notation}
          </button>
        </div>

        {hasVariations && isExpanded && (
          <div className="ml-2 mt-1 p-2 bg-gray-100 border-l-2 border-yellow-500 rounded">
            {moveObj.variations.map((variation, varIdx) => (
              <div key={varIdx} className="mb-1">
                <div className="text-xs font-bold text-gray-600 mb-1">
                  Alt {varIdx + 1}:
                </div>
                <div className="ml-1 space-x-1">
                  {variation.map((m, moveIdx) => (
                    <MoveNode key={moveIdx} moveObj={m} pathArray={[...pathArray, ...variation.slice(0, moveIdx).map(x => x.move)]} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  if (!gameState) {
    return (
      <div className="w-full min-h-screen bg-gray-100 p-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold text-center mb-8">Chess Board with Multi-Level Variations</h1>
          <div className="text-center p-8">
            <div className="text-lg mb-4">Loading chess position...</div>
            <div className="text-sm text-gray-600 mb-4">
              If this takes too long, there might be an error. Check the browser console.
            </div>
            <button 
              onClick={() => {
                console.log('🔄 Manual retry...');
                initializeGame();
              }}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8">Chess Board with Multi-Level Variations</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Board */}
          <div className="lg:col-span-2 flex justify-center">
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <div className="border-8 border-gray-800 inline-block">
                {Array.from({ length: 8 }).map((_, rankIdx) => (
                  <div key={rankIdx} className="flex">
                    {Array.from({ length: 8 }).map((_, fileIdx) => {
                      const isLight = (rankIdx + fileIdx) % 2 === 0;
                      const piece = gameState.board[rankIdx][fileIdx];
                      return (
                        <div
                          key={`${fileIdx}-${rankIdx}`}
                          className={`w-16 h-16 flex items-center justify-center text-5xl font-bold ${
                            isLight ? 'bg-amber-100' : 'bg-amber-700'
                          }`}
                        >
                          {piece ? PIECE_UNICODE[piece] : ''}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
              <div className="mt-4 text-center font-semibold text-lg">
                {gameState.whiteToMove ? '♔ White to move' : '♚ Black to move'}
              </div>
            </div>
          </div>

          {/* Moves Panel */}
          <div className="bg-white p-6 rounded-lg shadow-lg h-fit">
            <h2 className="text-xl font-bold mb-4">Move Notation</h2>
            <div className="space-y-2 text-sm max-h-96 overflow-y-auto">
              {gameState.moveTree.map((moveObj, idx) => (
                <div key={idx} className="flex flex-wrap gap-1">
                  <MoveNode moveObj={moveObj} pathArray={[]} />
                </div>
              ))}
            </div>

            <div className="mt-6 p-3 bg-blue-50 rounded-lg text-xs">
              <p className="font-semibold text-gray-800 mb-2">Legend:</p>
              <p>🟨 <span className="text-yellow-900">Yellow = Has variations</span></p>
              <p>⬜ <span className="text-gray-800">Gray = Regular move</span></p>
            </div>
          </div>
        </div>

        {/* Move history */}
        <div className="mt-6 bg-white p-4 rounded-lg shadow-lg">
          <h3 className="font-bold mb-2">Current Sequence:</h3>
          <div className="bg-gray-50 p-3 rounded font-mono text-lg min-h-12">
            {gameState.moveSequence.length > 0
              ? gameState.moveSequence
                  .map((m, i) => {
                    const moveNum = Math.floor(i / 2) + 1;
                    const prefix = i % 2 === 0 ? `${moveNum}. ` : `${moveNum}... `;
                    return prefix + m;
                  })
                  .join(' ')
              : 'Click a move to start'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChessBoardPage;