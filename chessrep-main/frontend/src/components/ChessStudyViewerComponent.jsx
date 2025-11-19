import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Upload, ExternalLink } from 'lucide-react';
import { Chess } from 'chess.js';
import { lichessStudyService } from '../services/lichessStudyService';
import GameTreeNotation from './GameTreeNotation';

const ChessStudyViewerComponent = ({ onPGNLoad, currentMoveIndex, onMoveClick, onVariationMoveClick, tree, boardPosition, setBoardPosition }) => {
  const [pgnInput, setPgnInput] = useState('');
  const [metadata, setMetadata] = useState({});
  const [showInput, setShowInput] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lichessUrl, setLichessUrl] = useState('');
  const [localMoveIndex, setLocalMoveIndex] = useState(0);

  // Local navigation functions that don't affect the main tree
  const goToMoveLocal = useCallback((moveIndex) => {
    if (!tree || !tree.moves) return;

    console.log('🎯 goToMoveLocal called with index:', moveIndex);
    console.log('🎯 Total moves available:', tree.moves.length);

    setLocalMoveIndex(moveIndex);

    // Reconstruct game up to this move
    const newGame = new Chess();

    // Apply moves up to (but not including) the target move
    // If moveIndex is 0, no moves are applied (starting position)
    // If moveIndex is 1, only the first move is applied
    for (let i = 0; i < moveIndex && i < tree.moves.length; i++) {
      const move = tree.moves[i];
      try {
        console.log(`🎯 Applying move ${i + 1}: ${move.notation || move.move}`);
        newGame.move(move.notation || move.move);
      } catch (error) {
        console.warn(`Failed to apply move ${i + 1}: ${move.notation || move.move}`, error);
      }
    }

    console.log('🎯 Final position FEN:', newGame.fen());
    console.log('🎯 Position after move:', moveIndex === 0 ? 'Starting position' : `After move ${moveIndex}`);
    
    // Update the board position in the parent component
    if (setBoardPosition) {
      setBoardPosition(newGame.fen());
    }
  }, [tree, setBoardPosition]);

  // Handle move click from notation - use local navigation
  const handleMoveClickLocal = useCallback((moveIndex) => {
    console.log('🎯 Move clicked locally:', moveIndex);
    console.log('🎯 Current local move index:', localMoveIndex);
    console.log('🎯 Total moves:', tree?.moves?.length);
    goToMoveLocal(moveIndex);
  }, [goToMoveLocal, localMoveIndex, tree]);

  // Handle variation move click from notation - use local navigation
  const handleVariationMoveClickLocal = useCallback((parentMoveIndex, variationMove) => {
    console.log('🎯 Variation move clicked locally:', variationMove);
    console.log('🎯 Parent move index:', parentMoveIndex);

    // First go to the parent move position
    goToMoveLocal(parentMoveIndex);

    // Then apply the variation move to show what it would look like
    setTimeout(() => {
      try {
        const newGame = new Chess(boardPosition || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
        const result = newGame.move(variationMove);
        if (result) {
          console.log('🎯 Applied variation move:', variationMove);
          if (setBoardPosition) {
            setBoardPosition(newGame.fen());
          }
        } else {
          console.warn('Failed to apply variation move:', variationMove);
        }
      } catch (error) {
        console.error('Error applying variation move:', error);
      }
    }, 100); // Small delay to ensure the parent move is applied first
  }, [goToMoveLocal, boardPosition, setBoardPosition]);

  // Parse PGN and create move tree
  function parsePGN(pgn) {
    console.log('🔍 Parsing PGN...');
    console.log('📝 PGN length:', pgn.length);
    
    if (!pgn || pgn.trim().length === 0) {
      throw new Error('Empty PGN provided');
    }
    
    const lines = pgn.split('\n');
    const metadata = {};
    let moveText = '';

    for (let line of lines) {
      if (line.startsWith('[')) {
        const match = line.match(/\[(\w+)\s"([^"]+)"\]/);
        if (match) metadata[match[1]] = match[2];
      } else {
        moveText += ' ' + line;
      }
    }

    // Clean move text
    moveText = moveText
      .replace(/\d+\./g, '') // Remove move numbers
      .replace(/\{\[%[^\]]*\]\}/g, '') // Remove annotations
      .replace(/\{[^}]*\}/g, '') // Remove comments
      .replace(/\s+/g, ' ') // Normalize spaces
      .trim();

    console.log('📝 Cleaned move text:', moveText.substring(0, 200) + '...');
    
    if (!moveText || moveText.length === 0) {
      throw new Error('No moves found in PGN');
    }

    setMetadata(metadata);
    const tree = parseMoveTree(moveText);
    
    if (!tree) {
      throw new Error('Failed to parse move tree');
    }
    
    return tree;
  }

  // Parse variation moves from text
  function parseVariationMoves(text) {
    console.log('🔍 Parsing variation moves from:', text);
    const moves = [];
    const tokens = text.trim().split(/\s+/);
    
    for (const token of tokens) {
      if (token && isValidMove(token)) {
        moves.push(token);
      }
    }
    
    console.log('✅ Parsed variation moves:', moves);
    return moves;
  }

  // Parse move tree with variations - RESTORED VARIATION PARSING
  function parseMoveTree(text) {
    console.log('🔍 Parsing move tree with variations:', text.substring(0, 200) + '...');
    
    const root = { move: null, mainLine: [], variations: {} };
    let i = 0;

    function parseSequence(startIndex = 0) {
      const moves = [];
      let index = startIndex;

      while (index < text.length) {
        const char = text[index];

        if (char === '(') {
          // Start a variation - it belongs to the last move
          if (moves.length > 0) {
            const lastMove = moves[moves.length - 1];
            const varStart = index + 1;
            let depth = 1;
            let varEnd = varStart;
            index++;

            while (index < text.length && depth > 0) {
              if (text[index] === '(') depth++;
              if (text[index] === ')') depth--;
              if (depth > 0) varEnd++;
              index++;
            }

            const varText = text.substring(varStart, varEnd);
            console.log('🔍 Found variation text:', varText);
            if (!root.variations[lastMove]) {
              root.variations[lastMove] = [];
            }
            // Parse the variation text into moves
            const variationMoves = parseVariationMoves(varText);
            root.variations[lastMove].push({ mainLine: variationMoves, variations: {} });
          } else {
            index++; // Skip opening parenthesis if no preceding move
          }
        } else if (char === ')') {
          index++;
          break; // End of current variation/main line
        } else if (/\s/.test(char)) {
          index++; // Skip whitespace
        } else {
          let move = '';
          while (index < text.length && !/[\s()]/g.test(text[index])) {
            move += text[index];
            index++;
          }

          if (move && move !== '*' && !move.match(/^(1-0|0-1|1\/2-1\/2)$/) && !move.match(/^\d+\.$/)) {
            // Skip move numbers like "1.", "2.", etc.
            if (!move.match(/^\d+\.$/)) {
              moves.push(move);
            }
          }
        }
      }

      return { move: null, mainLine: moves, variations: root.variations };
    }

    const tree = parseSequence(0);
    console.log('✅ Parsed tree:', tree);
    console.log('📊 Main line moves:', tree.mainLine.length);
    console.log('📊 Variations found:', Object.keys(tree.variations).length);
    console.log('📊 Variation details:', tree.variations);

    // Convert to the format expected by GameTreeNotation
    return convertToGameTreeFormat(tree);
  }

  // Convert parsed tree to GameTreeNotation format
  function convertToGameTreeFormat(tree) {
    console.log('🔄 Converting tree to GameTreeNotation format:', tree);
    
    const moves = [];
    const variations = [];
    let variationId = 0;

    // Check if tree and mainLine exist
    if (!tree || !tree.mainLine || !Array.isArray(tree.mainLine)) {
      console.error('❌ Invalid tree structure:', tree);
      return {
        moves: [],
        variations: [],
        currentMove: 0
      };
    }

    // Process main line moves
    tree.mainLine.forEach((moveNotation, index) => {
      // Find variations for this move
      const moveVariations = (tree.variations && tree.variations[moveNotation]) || [];
      
      // Convert variations to the expected format
      const processedVariations = moveVariations.map((variation, varIndex) => {
        // Check if variation has mainLine
        if (!variation || !variation.mainLine || !Array.isArray(variation.mainLine)) {
          console.warn('⚠️ Invalid variation structure:', variation);
          return {
            id: `variation-${variationId++}`,
            moves: [],
            parentMoveIndex: index,
            depth: 1
          };
        }

        const variationMoves = variation.mainLine.map((varMove, varMoveIndex) => ({
          id: `var-${variationId}-${varMoveIndex}`,
          move: varMove,
          notation: varMove,
          from: 'unknown',
          to: 'unknown',
          color: (index + varMoveIndex) % 2 === 0 ? 'w' : 'b',
          piece: 'p',
          captured: undefined,
          promotion: undefined,
          flags: '',
          variations: []
        }));

        return {
          id: `variation-${variationId++}`,
          moves: variationMoves,
          parentMoveIndex: index,
          depth: 1
        };
      });

      moves.push({
        id: `move-${index}`,
        move: moveNotation,
        notation: moveNotation,
        from: 'unknown',
        to: 'unknown',
        color: index % 2 === 0 ? 'w' : 'b',
        piece: 'p',
        captured: undefined,
        promotion: undefined,
        flags: '',
        variations: processedVariations
      });
    });

    console.log('🔄 Converted to GameTreeNotation format:');
    console.log('📊 Total moves:', moves.length);
    console.log('📊 Moves with variations:', moves.filter(m => m.variations.length > 0).length);
    console.log('🔍 Sample move structure:', moves[0]);
    console.log('🔍 Sample variation structure:', moves.find(m => m.variations.length > 0)?.variations[0]);

    return {
      moves: moves,
      variations: variations,
      currentMove: moves.length
    };
  }

  // Check if a token is a valid chess move
  function isValidMove(token) {
    const standardMovePattern = /^[KQRBN]?[a-h]?[1-8]?x?[a-h][1-8](?:=[QRBN])?[+#]?$/;
    const castlingPattern = /^O-O(-O)?(\+|#)?$/;
    const longAlgebraicPattern = /^[a-h][1-8][a-h][1-8](?:[QRBN])?[+#]?$/;

    return standardMovePattern.test(token) || 
           castlingPattern.test(token) || 
           longAlgebraicPattern.test(token);
  }

  // Handle PGN submission
  function handlePgnSubmit() {
    setError(null);
    try {
      console.log('🔍 Starting PGN parsing...');
      console.log('📝 PGN input length:', pgnInput.length);
      
      const tree = parsePGN(pgnInput);
      console.log('✅ PGN parsed successfully:', tree);
      
      if (!tree || !tree.moves || tree.moves.length === 0) {
        throw new Error('No valid moves found in PGN');
      }
      
      setShowInput(false);
      
      // Call the callback to notify parent component
      if (onPGNLoad) {
        onPGNLoad(tree, pgnInput);
      }
    } catch (error) {
      console.error('❌ PGN parsing error:', error);
      setError(`Failed to parse PGN: ${error.message}`);
    }
  }

  // Handle Lichess import
  async function handleLichessImport() {
    if (!lichessUrl.trim()) {
      setError('Please enter a Lichess study URL');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const pgn = await lichessStudyService.fetchStudyPGN(lichessUrl);
      setPgnInput(pgn);
      setShowInput(true);
    } catch (error) {
      setError(`Failed to import from Lichess: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full">
      {/* PGN Input Section */}
      {showInput && (
        <div className="mb-6 p-4 bg-white rounded-lg shadow-lg">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <span className="mr-2">📝</span>
            Import PGN
          </h3>
          
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                PGN Text
              </label>
              <textarea
                value={pgnInput}
                onChange={(e) => setPgnInput(e.target.value)}
                placeholder="Paste your PGN here..."
                className="w-full h-32 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={handlePgnSubmit}
                disabled={loading || !pgnInput.trim()}
                className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium flex items-center"
              >
                <Upload className="w-4 h-4 mr-2" />
                Load PGN
              </button>

              <button
                onClick={() => setPgnInput('')}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium"
              >
                Clear
              </button>
            </div>

            {/* Lichess Import */}
            <div className="border-t pt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Or import from Lichess
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={lichessUrl}
                  onChange={(e) => setLichessUrl(e.target.value)}
                  placeholder="https://lichess.org/study/..."
                  className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={handleLichessImport}
                  disabled={loading || !lichessUrl.trim()}
                  className="bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium flex items-center"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Import
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Game Notation */}
      {tree && tree.moves && tree.moves.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <span className="mr-2">📝</span>
            Game Notation
          </h3>
          <div className="max-h-96 overflow-y-auto">
            <GameTreeNotation
              tree={tree}
              currentPath={[]}
              currentMoveIndex={localMoveIndex}
              onMoveClick={handleMoveClickLocal}
              onVariationMoveClick={handleVariationMoveClickLocal}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ChessStudyViewerComponent;
