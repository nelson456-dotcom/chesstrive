import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Upload, ExternalLink, SkipBack, SkipForward } from 'lucide-react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import { lichessStudyService } from '../services/lichessStudyService';
import GameTreeNotation from './GameTreeNotation';

const ChessStudyViewer = () => {
  const [pgnInput, setPgnInput] = useState('');
  const [game, setGame] = useState(new Chess());
  const [boardPosition, setBoardPosition] = useState('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
  const [moveTree, setMoveTree] = useState(null);
  const [currentMoveIndex, setCurrentMoveIndex] = useState(0);
  const [metadata, setMetadata] = useState({});
  const [showInput, setShowInput] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lichessUrl, setLichessUrl] = useState('');
  const [boardOrientation, setBoardOrientation] = useState('white');
  const [showingVariation, setShowingVariation] = useState(false);

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
            index++;
          }
        } else if (char === ')') {
          index++;
          break;
        } else if (/\s/.test(char)) {
          index++;
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
    const longAlgebraicPattern = /^[KQRBN]?[a-h][1-8][x-]?[a-h][1-8](?:=[QRBN])?[+#]?$/;
    
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
      
      setMoveTree(tree);
      setCurrentMoveIndex(0);
      
      // Reset game to starting position
      const newGame = new Chess();
      setGame(newGame);
      setBoardPosition(newGame.fen());
      setShowInput(false);
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
      console.log('🔍 Importing Lichess study from URL:', lichessUrl);
      
      // Extract study ID from URL
      const studyId = lichessUrl.replace(/^https?:\/\/lichess\.org\/study\//, '').replace(/\/.*$/, '');
      console.log('🔍 Extracted study ID:', studyId);
      
      // Fetch the study
      const study = await lichessStudyService.fetchStudy(studyId);
      console.log('✅ Study fetched:', study);
      
      if (!study || !study.chapters || study.chapters.length === 0) {
        throw new Error('No chapters found in the study');
      }

      // Use the first chapter for now
      const firstChapter = study.chapters[0];
      console.log('📖 Using first chapter:', firstChapter.name);
      
      // Set metadata
      setMetadata({
        StudyName: study.name,
        ChapterName: firstChapter.name,
        Opening: firstChapter.tags?.find(tag => tag.startsWith('Opening:'))?.replace('Opening: ', '') || '',
        White: study.owner?.name || 'Unknown',
        Black: 'Analysis'
      });

      // Parse the chapter PGN
      const tree = parsePGN(firstChapter.pgn);
      setMoveTree(tree);
      setCurrentMoveIndex(0);
      
      // Reset game to starting position
      const newGame = new Chess();
      setGame(newGame);
      setBoardPosition(newGame.fen());
      setShowInput(false);
      
      console.log('✅ Lichess study imported successfully');
      
    } catch (error) {
      console.error('❌ Error importing Lichess study:', error);
      setError(`Failed to import study: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  // Navigate to a specific move
  function goToMove(moveIndex) {
    if (!moveTree || !moveTree.moves) return;
    
    console.log('🎯 goToMove called with index:', moveIndex);
    console.log('🎯 Total moves available:', moveTree.moves.length);
    
    setCurrentMoveIndex(moveIndex);
    
    // Reconstruct game up to this move
    const newGame = new Chess();
    
    // Apply moves up to (but not including) the target move
    // If moveIndex is 0, no moves are applied (starting position)
    // If moveIndex is 1, only the first move is applied
    for (let i = 0; i < moveIndex && i < moveTree.moves.length; i++) {
      const move = moveTree.moves[i];
      try {
        console.log(`🎯 Applying move ${i + 1}: ${move.notation || move.move}`);
        newGame.move(move.notation || move.move);
      } catch (error) {
        console.warn(`Failed to apply move ${i + 1}: ${move.notation || move.move}`, error);
      }
    }
    
    console.log('🎯 Final position FEN:', newGame.fen());
    console.log('🎯 Position after move:', moveIndex === 0 ? 'Starting position' : `After move ${moveIndex}`);
    setGame(newGame);
    setBoardPosition(newGame.fen());
  }

  // Navigation functions
  function goToStart() {
    goToMove(0);
  }

  function goBack() {
    if (currentMoveIndex > 0) {
      goToMove(currentMoveIndex - 1);
    }
  }

  function goForward() {
    if (moveTree && currentMoveIndex < moveTree.moves.length) {
      goToMove(currentMoveIndex + 1);
    }
  }

  function goToEnd() {
    if (moveTree) {
      goToMove(moveTree.moves.length);
    }
  }

  // Handle variation move click from notation
  function handleVariationMoveClick(parentMoveIndex, variationMove) {
    console.log('🎯 Variation move clicked:', variationMove);
    console.log('🎯 Parent move index:', parentMoveIndex);
    
    // First go to the parent move position
    goToMove(parentMoveIndex);
    setShowingVariation(true);
    
    // Then apply the variation move to show what it would look like
    setTimeout(() => {
      try {
        const newGame = new Chess(game.fen());
        const result = newGame.move(variationMove);
        if (result) {
          console.log('🎯 Applied variation move:', variationMove);
          setGame(newGame);
          setBoardPosition(newGame.fen());
        } else {
          console.warn('Failed to apply variation move:', variationMove);
          setShowingVariation(false);
        }
      } catch (error) {
        console.error('Error applying variation move:', error);
        setShowingVariation(false);
      }
    }, 100); // Small delay to ensure the parent move is applied first
  }

  // Handle move click from notation
  function handleMoveClick(moveIndex) {
    console.log('🎯 Move clicked:', moveIndex);
    console.log('🎯 Current move index:', currentMoveIndex);
    console.log('🎯 Total moves:', moveTree?.moves?.length);
    setShowingVariation(false); // Reset variation state when clicking main moves
    goToMove(moveIndex);
  }

  // Get current move notation
  function getCurrentMove() {
    if (!moveTree || currentMoveIndex >= moveTree.moves.length) {
      return 'End';
    }
    if (currentMoveIndex === 0) {
      return 'Start';
    }
    return moveTree.moves[currentMoveIndex - 1]?.notation || 'Unknown';
  }

  // Handle piece drop (disabled for viewing)
  function handlePieceDrop(sourceSquare, targetSquare, piece) {
    return false; // Disable piece movement in viewer mode
  }

  if (showInput) {
    return (
      <div className="w-full max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold mb-4">Chess Study Viewer</h1>
        
        {/* Lichess Import Section */}
        <div className="mb-6 p-4 border border-blue-200 rounded-lg bg-blue-50">
          <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
            <ExternalLink size={20} />
            Import from Lichess
          </h2>
          <div className="flex gap-2">
            <input
              type="text"
              value={lichessUrl}
              onChange={(e) => setLichessUrl(e.target.value)}
              placeholder="https://lichess.org/study/..."
              className="flex-1 p-2 border border-gray-300 rounded text-sm"
            />
            <button
              onClick={handleLichessImport}
              disabled={loading}
              className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-bold py-2 px-4 rounded flex items-center gap-2"
            >
              {loading ? 'Loading...' : 'Import'}
            </button>
          </div>
        </div>

        {/* Manual PGN Input Section */}
        <div className="mb-4">
          <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
            <Upload size={20} />
            Or paste PGN manually
          </h2>
          <textarea
            value={pgnInput}
            onChange={(e) => setPgnInput(e.target.value)}
            placeholder="Paste your PGN here..."
            className="w-full h-64 p-4 border border-gray-300 rounded mb-4 font-mono text-sm"
          />
          <button
            onClick={handlePgnSubmit}
            className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-6 rounded"
          >
            Load Study
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <button
        onClick={() => setShowInput(true)}
        className="mb-4 text-blue-500 hover:text-blue-700 underline text-sm"
      >
        ← Back to Input
      </button>

      <h1 className="text-2xl font-bold mb-2">{metadata.StudyName || 'Chess Study'}</h1>
      {metadata.ChapterName && <p className="text-lg text-gray-600 mb-2">{metadata.ChapterName}</p>}
      {metadata.Opening && <p className="text-sm text-gray-500 mb-4">{metadata.Opening}</p>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Board */}
        <div className="lg:col-span-2 space-y-6">
          {/* Board Section */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                <span className="mr-2">♟️</span>
                Chess Board
              </h3>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">Orientation:</span>
                <button
                  onClick={() => setBoardOrientation(o => o === 'white' ? 'black' : 'white')}
                  className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm transition-colors"
                >
                  {boardOrientation === 'white' ? 'White' : 'Black'}
                </button>
              </div>
            </div>
            <div className="flex justify-center">
              <Chessboard
                position={boardPosition}
                onPieceDrop={handlePieceDrop}
                boardOrientation={boardOrientation}
                customBoardStyle={{
                  borderRadius: '12px',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
                }}
              />
            </div>
          </div>

          {/* Controls */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-center space-x-4">
              <button
                onClick={goToStart}
                disabled={currentMoveIndex === 0}
                className="p-2 bg-gray-500 hover:bg-gray-600 disabled:bg-gray-300 text-white rounded-lg transition-colors"
                title="Go to start"
              >
                <SkipBack size={20} />
              </button>
              <button
                onClick={goBack}
                disabled={currentMoveIndex === 0}
                className="p-2 bg-gray-500 hover:bg-gray-600 disabled:bg-gray-300 text-white rounded-lg transition-colors"
                title="Previous move"
              >
                <ChevronLeft size={20} />
              </button>
              <span className="text-xl font-mono font-bold min-w-32 text-center px-4 py-2 bg-gray-100 rounded-lg">
                {getCurrentMove()}
              </span>
              <button
                onClick={goForward}
                disabled={!moveTree || currentMoveIndex >= moveTree.moves.length}
                className="p-2 bg-gray-500 hover:bg-gray-600 disabled:bg-gray-300 text-white rounded-lg transition-colors"
                title="Next move"
              >
                <ChevronRight size={20} />
              </button>
              <button
                onClick={goToEnd}
                disabled={!moveTree || currentMoveIndex >= moveTree.moves.length}
                className="p-2 bg-gray-500 hover:bg-gray-600 disabled:bg-gray-300 text-white rounded-lg transition-colors"
                title="Go to end"
              >
                <SkipForward size={20} />
              </button>
            </div>
            <div className="mt-4 text-center text-sm text-gray-600">
              {showingVariation ? (
                <span className="text-orange-600 font-medium">Showing Variation</span>
              ) : currentMoveIndex === 0 ? (
                'Starting Position'
              ) : (
                `Move ${currentMoveIndex} of ${moveTree?.moves?.length || 0}`
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Game Notation */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <span className="mr-2">📝</span>
              Game Notation
            </h3>
            <div className="max-h-96 overflow-y-auto">
              {moveTree ? (
                <GameTreeNotation
                  tree={moveTree}
                  currentPath={[]}
                  currentMoveIndex={currentMoveIndex}
                  onMoveClick={handleMoveClick}
                  onVariationMoveClick={handleVariationMoveClick}
                />
              ) : (
                <div className="text-center text-gray-400 italic py-8">
                  <div className="text-lg mb-2">🎯</div>
                  <div>Load a study to see moves here</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChessStudyViewer;