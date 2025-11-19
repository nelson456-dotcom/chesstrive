import React, { useState, useEffect } from 'react';
import { Chess } from 'chess.js';
import LichessOpeningTable from './LichessOpeningTable';
import LichessOpeningTree from './LichessOpeningTree';
import ModernChessBoard from './ModernChessBoard';
import { Chessboard } from 'react-chessboard';
import { MoveTree } from './MoveTree';
import '../styles/lichess-opening-tree.css';
import '../styles/lichess-opening-table.css';

const OpeningTreePage = () => {
  const [game, setGame] = useState(new Chess());
  const [currentFEN, setCurrentFEN] = useState(game.fen());
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'tree'
  const [selectedDatabase, setSelectedDatabase] = useState('masters');
  const [playerName, setPlayerName] = useState('');
  const [moveHistory, setMoveHistory] = useState([]);
  const [currentMoveIndex, setCurrentMoveIndex] = useState(0);
  const [moveTree, setMoveTree] = useState([]);
  const [currentVariationId, setCurrentVariationId] = useState(null);
  const [isNavigatingBack, setIsNavigatingBack] = useState(false);

  // Function to handle move navigation
  const goToMove = (moveIndex) => {
    if (moveIndex < 0 || moveIndex > moveHistory.length) return;
    
    // Reset the game to the starting position
    const tempGame = new Chess();
    
    // Replay moves up to the target index
    for (let i = 0; i < moveIndex; i++) {
      tempGame.move(moveHistory[i]);
    }
    
    setCurrentFEN(tempGame.fen());
    setCurrentMoveIndex(moveIndex);
    
    // Update the game state by creating a new game instance
    setGame(new Chess(tempGame.fen()));
    
    // Set navigation flag if going back
    setIsNavigatingBack(moveIndex < moveHistory.length);
  };

  const handleMoveClick = (from, to, promotion) => {
    try {
      const move = game.move({
        from,
        to,
        promotion: promotion || 'q'
      });

      if (move) {
        setCurrentFEN(game.fen());
        setMoveHistory(prev => [...prev, move.san]);
        
        // Calculate the new move index
        const newMoveIndex = currentMoveIndex + 1;
        setCurrentMoveIndex(newMoveIndex);
        
        // Check if we're creating a variation or continuing a variation
        // A variation should be created if:
        // 1. We have moves in the tree AND
        // 2. We're not at the end of the main line (newMoveIndex < moveTree.length) AND
        // 3. We're not continuing an existing variation
        // OR if we're going back and playing a different move (detected by currentMoveIndex < moveTree.length)
        const isVariation = (moveTree.length > 0 && newMoveIndex < moveTree.length && currentVariationId === null) || 
                           (moveTree.length > 0 && currentMoveIndex < moveTree.length);
        const isContinuingVariation = currentVariationId !== null;
        
        console.log('🎯 handleMoveClick logic check:', {
          newMoveIndex,
          moveTreeLength: moveTree.length,
          isVariation,
          isContinuingVariation,
          currentVariationId,
          move: move.san,
          currentMoveIndex,
          shouldCreateVariation: (moveTree.length > 0 && newMoveIndex < moveTree.length && currentVariationId === null) || 
                                (moveTree.length > 0 && currentMoveIndex < moveTree.length),
          moveTreeState: moveTree.map(m => ({ move: m.move.san, isMainLine: m.isMainLine, hasSublines: m.sublines?.length || 0 }))
        });
        
        if (isVariation && !isContinuingVariation) {
          // Create a new variation by adding it to the sublines of the correct parent move
          // For variations, we need to find the move where the variation should branch from
          // This is typically the move where we're going back to play an alternative
          const parentMoveIndex = currentMoveIndex;
          
          // Check if this variation already exists to prevent duplicates
          const existingVariation = moveTree[parentMoveIndex]?.sublines?.find(
            subline => subline.move.san === move.san && subline.move.from === move.from && subline.move.to === move.to
          );
          
          if (!existingVariation) {
            const variationNode = {
              id: `variation_${Date.now()}_${Math.random()}`,
              move: move,
              moveIndex: newMoveIndex,
              moveNumber: Math.floor(newMoveIndex / 2) + 1,
              isWhite: move.color === 'w',
              sublines: [],
              annotations: [],
              isMainLine: false,
              parentId: moveTree[parentMoveIndex]?.id
            };
            
            // Add variation to the parent move's sublines
            setMoveTree(prev => {
              const newTree = [...prev];
              if (newTree[parentMoveIndex]) {
                if (!newTree[parentMoveIndex].sublines) {
                  newTree[parentMoveIndex].sublines = [];
                }
                
                // Check for duplicates in the current state
                const existingVariation = newTree[parentMoveIndex].sublines.find(
                  subline => subline.move.san === move.san && subline.move.from === move.from && subline.move.to === move.to
                );
                
                if (!existingVariation) {
                  newTree[parentMoveIndex].sublines.push(variationNode);
                  console.log('🎯 Added variation to move tree');
                } else {
                  console.log('🎯 Variation already exists, skipping duplicate');
                }
              }
              return newTree;
            });
            
            // Set this as the current variation
            setCurrentVariationId(variationNode.id);
            console.log(`Variation played: ${move.san} (${from}${to}) - added to move ${parentMoveIndex}`);
          } else {
            // Variation already exists, just set it as current
            setCurrentVariationId(existingVariation.id);
            console.log(`Using existing variation: ${move.san} (${from}${to})`);
          }
        } else if (isContinuingVariation) {
          // Continue the current variation
          const continuationNode = {
            id: `continuation_${currentVariationId}_${move.san}_${Date.now()}`,
            move: move,
            moveIndex: newMoveIndex,
            moveNumber: Math.floor(newMoveIndex / 2) + 1,
            isWhite: move.color === 'w',
            sublines: [],
            annotations: [],
            isMainLine: false,
            parentId: currentVariationId
          };
          
          // Add continuation to the current variation
          setMoveTree(prev => {
            const newTree = [...prev];
            const addToVariation = (nodes) => {
              for (const node of nodes) {
                if (node.id === currentVariationId) {
                  if (!node.sublines) {
                    node.sublines = [];
                  }
                  node.sublines.push(continuationNode);
                  return true;
                }
                if (node.sublines && addToVariation(node.sublines)) {
                  return true;
                }
              }
              return false;
            };
            addToVariation(newTree);
            return newTree;
          });
          
          console.log(`Variation continuation played: ${move.san} (${from}${to})`);
        } else {
          // Normal mainline move
        const moveNode = {
          id: `move_${newMoveIndex}_${move.san}_${Date.now()}`,
          move: move,
            moveIndex: newMoveIndex,
          moveNumber: Math.floor(newMoveIndex / 2) + 1,
          isWhite: move.color === 'w',
          sublines: [],
          annotations: [],
          isMainLine: true
        };
        
        setMoveTree(prev => [...prev, moveNode]);
          setCurrentVariationId(null); // Clear variation when playing mainline
        console.log(`Move played: ${move.san} (${from}${to})`);
        }
        
        // Clear navigation flag after playing a move
        setIsNavigatingBack(false);
      }
    } catch (error) {
      console.error('Invalid move:', error);
    }
  };

  const handleBoardMove = (sourceSquare, targetSquare, piece) => {
    console.log('🎯 handleBoardMove called:', { sourceSquare, targetSquare, piece });
    try {
      const move = game.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: 'q'
      });

      if (move) {
        setCurrentFEN(game.fen());
        setMoveHistory(prev => [...prev, move.san]);
        
        // Calculate the new move index
        const newMoveIndex = currentMoveIndex + 1;
        setCurrentMoveIndex(newMoveIndex);
        
        // Check if we're creating a variation or continuing a variation
        // A variation should be created if:
        // 1. We have moves in the tree AND
        // 2. We're not at the end of the main line (newMoveIndex < moveTree.length) AND
        // 3. We're not continuing an existing variation
        // OR if we're going back and playing a different move (detected by currentMoveIndex < moveTree.length)
        const isVariation = (moveTree.length > 0 && newMoveIndex < moveTree.length && currentVariationId === null) || 
                           (moveTree.length > 0 && currentMoveIndex < moveTree.length);
        const isContinuingVariation = currentVariationId !== null;
        
        console.log('🎯 Move logic check:', {
          newMoveIndex,
          moveTreeLength: moveTree.length,
          isVariation,
          isContinuingVariation,
          currentVariationId,
          move: move.san,
          currentMoveIndex,
          shouldCreateVariation: (moveTree.length > 0 && newMoveIndex < moveTree.length && currentVariationId === null) || 
                                (moveTree.length > 0 && currentMoveIndex < moveTree.length)
        });
        
        if (isVariation && !isContinuingVariation) {
          // Create a new variation by adding it to the sublines of the previous move
          const parentMoveIndex = newMoveIndex - 1;
          
          // Check if this variation already exists to prevent duplicates
          const existingVariation = moveTree[parentMoveIndex]?.sublines?.find(
            subline => subline.move.san === move.san && subline.move.from === move.from && subline.move.to === move.to
          );
          
          if (!existingVariation) {
            const variationNode = {
              id: `variation_${parentMoveIndex}_${move.san}_${Date.now()}`,
              move: move,
              moveIndex: newMoveIndex,
              moveNumber: Math.floor(newMoveIndex / 2) + 1,
              isWhite: move.color === 'w',
              sublines: [],
              annotations: [],
              isMainLine: false,
              parentId: moveTree[parentMoveIndex]?.id
            };
            
            // Add variation to the parent move's sublines
            setMoveTree(prev => {
              const newTree = [...prev];
              if (newTree[parentMoveIndex]) {
                if (!newTree[parentMoveIndex].sublines) {
                  newTree[parentMoveIndex].sublines = [];
                }
                
                // Check for duplicates in the current state
                const existingVariation = newTree[parentMoveIndex].sublines.find(
                  subline => subline.move.san === move.san && subline.move.from === move.from && subline.move.to === move.to
                );
                
                if (!existingVariation) {
                  newTree[parentMoveIndex].sublines.push(variationNode);
                  console.log('🎯 Added variation to move tree');
                } else {
                  console.log('🎯 Variation already exists, skipping duplicate');
                }
              }
              return newTree;
            });
            
            // Set this as the current variation
            setCurrentVariationId(variationNode.id);
            console.log(`Variation played: ${move.san} (${sourceSquare}${targetSquare}) - added to move ${parentMoveIndex}`);
          } else {
            // Variation already exists, just set it as current
            setCurrentVariationId(existingVariation.id);
            console.log(`Using existing variation: ${move.san} (${sourceSquare}${targetSquare})`);
          }
        } else if (isContinuingVariation) {
          // Continue the current variation - add as a new move in the variation sequence
          // Calculate move number based on the variation's position, not global position
          const variationMoveNumber = Math.floor((newMoveIndex - 1) / 2) + 1;
          
          const continuationNode = {
            id: `continuation_${currentVariationId}_${move.san}_${Date.now()}`,
            move: move,
            moveIndex: newMoveIndex,
            moveNumber: variationMoveNumber,
            isWhite: move.color === 'w',
            sublines: [],
            annotations: [],
            isMainLine: false,
            parentId: currentVariationId
          };
          
          // Add continuation to the current variation as a subline (next move in sequence)
          setMoveTree(prev => {
            const newTree = [...prev];
            const addToVariation = (nodes) => {
              for (const node of nodes) {
                if (node.id === currentVariationId) {
                  if (!node.sublines) {
                    node.sublines = [];
                  }
                  node.sublines.push(continuationNode);
                  return true;
                }
                if (node.sublines && addToVariation(node.sublines)) {
                  return true;
                }
              }
              return false;
            };
            addToVariation(newTree);
            return newTree;
          });
          
          // Update current variation ID to the new continuation node
          setCurrentVariationId(continuationNode.id);
          
          console.log(`Variation continuation played: ${move.san} (${sourceSquare}${targetSquare})`);
        } else {
          // Normal mainline move
        const moveNode = {
          id: `move_${newMoveIndex}_${move.san}_${Date.now()}`,
          move: move,
            moveIndex: newMoveIndex,
          moveNumber: Math.floor(newMoveIndex / 2) + 1,
          isWhite: move.color === 'w',
          sublines: [],
          annotations: [],
          isMainLine: true
        };
        
        setMoveTree(prev => [...prev, moveNode]);
          setCurrentVariationId(null); // Clear variation when playing mainline
        console.log(`Move played: ${move.san} (${sourceSquare}${targetSquare})`);
        }
        
        // Clear navigation flag after playing a move
        setIsNavigatingBack(false);
        return true;
      }
    } catch (error) {
      console.error('Invalid move:', error);
    }
    return false;
  };


  // MoveTree handlers
  const handleMoveTreeClick = (moveIndex) => {
    goToMove(moveIndex);
  };

  const handleVariationClick = (variationId) => {
    console.log('Variation clicked:', variationId);
    // Handle variation navigation if needed
  };

  const handleAnnotationClick = (annotationId) => {
    console.log('Annotation clicked:', annotationId);
    // Handle annotation display if needed
  };

  const handleAddAnnotation = (moveIndex, annotation) => {
    console.log('Add annotation:', moveIndex, annotation);
    // Handle adding annotations if needed
  };

  const handleRemoveAnnotation = (annotationId) => {
    console.log('Remove annotation:', annotationId);
    // Handle removing annotations if needed
  };

  const resetPosition = () => {
    const newGame = new Chess();
    setGame(newGame);
    setCurrentFEN(newGame.fen());
    setMoveHistory([]);
    setCurrentMoveIndex(0);
    setMoveTree([]);
  };

  const loadPosition = (fen, name) => {
    try {
      const newGame = new Chess(fen);
      setGame(newGame);
      setCurrentFEN(fen);
      setMoveHistory([]);
      setCurrentMoveIndex(0);
      setMoveTree([]);
      console.log(`Loaded position: ${name}`);
    } catch (error) {
      console.error('Invalid FEN:', error);
    }
  };

  const commonPositions = [
    { name: 'Starting Position', fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1' },
    { name: 'After 1.e4', fen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1' },
    { name: 'After 1.d4', fen: 'rnbqkbnr/pppppppp/8/8/3P4/8/PPP1PPPP/RNBQKBNR b KQkq d3 0 1' },
    { name: 'Sicilian Defense', fen: 'rnbqkbnr/pppppppp/8/8/4p3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2' },
  ];

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (event) => {
      switch (event.key) {
        case 'ArrowRight':
        case 'd':
        case 'D':
        case ' ':
          event.preventDefault();
          goToMove(currentMoveIndex + 1);
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          event.preventDefault();
          goToMove(currentMoveIndex - 1);
          break;
        case 'ArrowUp':
        case 'w':
        case 'W':
          event.preventDefault();
          goToMove(0);
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          event.preventDefault();
          goToMove(moveHistory.length);
          break;
        case 'r':
        case 'R':
          event.preventDefault();
          resetPosition();
          break;
        case 'Escape':
          event.preventDefault();
          resetPosition();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentMoveIndex, moveHistory.length]);

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 text-white p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">Chess Opening Explorer</h1>
          <p className="text-gray-300 text-lg">
            Explore chess openings with real data from Lichess player and master databases
          </p>
        </div>

        {/* Controls */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 mb-6">
          <div className="grid md:grid-cols-3 gap-6">
            {/* View Mode */}
            <div>
              <h3 className="text-lg font-semibold mb-3">View Mode</h3>
              <div className="flex gap-2">
                <button
                  className={`px-4 py-2 rounded-md font-medium transition-all ${
                    viewMode === 'table'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                  }`}
                  onClick={() => setViewMode('table')}
                >
                  Table View
                </button>
                <button
                  className={`px-4 py-2 rounded-md font-medium transition-all ${
                    viewMode === 'tree'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                  }`}
                  onClick={() => setViewMode('tree')}
                >
                  Tree View
                </button>
              </div>
            </div>

            {/* Database Selection */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Database</h3>
              <div className="flex gap-2">
                <button
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${
                    selectedDatabase === 'masters'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                  }`}
                  onClick={() => setSelectedDatabase('masters')}
                >
                  Masters
                </button>
                <button
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${
                    selectedDatabase === 'lichess'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                  }`}
                  onClick={() => setSelectedDatabase('lichess')}
                >
                  Lichess
                </button>
                <button
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${
                    selectedDatabase === 'player'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                  }`}
                  onClick={() => setSelectedDatabase('player')}
                >
                  Player
                </button>
              </div>
              {selectedDatabase === 'player' && (
                <input
                  type="text"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="Enter player name"
                  className="mt-2 w-full px-3 py-2 rounded-md bg-gray-700 text-white placeholder-gray-400 border border-gray-600 focus:border-blue-500 focus:outline-none"
                />
              )}
            </div>

            {/* Position Controls */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Position</h3>
              <div className="flex flex-wrap gap-2">
                {commonPositions.map((pos, index) => (
                  <button
                    key={index}
                    onClick={() => loadPosition(pos.fen, pos.name)}
                    className="px-3 py-1 rounded-md text-sm bg-gray-600 text-gray-300 hover:bg-gray-500 transition-all"
                  >
                    {pos.name}
                  </button>
                ))}
                <button
                  onClick={resetPosition}
                  className="px-3 py-1 rounded-md text-sm bg-red-600 text-white hover:bg-red-500 transition-all"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Move Navigation Controls */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mb-6">
          <div className="flex justify-center gap-4">
            <button
              onClick={() => goToMove(0)}
              disabled={currentMoveIndex === 0}
              className="px-4 py-2 rounded-md bg-gray-600 text-white hover:bg-gray-500 disabled:bg-gray-800 disabled:cursor-not-allowed transition-all"
            >
              ← Start
            </button>
            <button
              onClick={() => goToMove(currentMoveIndex - 1)}
              disabled={currentMoveIndex === 0}
              className="px-4 py-2 rounded-md bg-gray-600 text-white hover:bg-gray-500 disabled:bg-gray-800 disabled:cursor-not-allowed transition-all"
            >
              ← Previous
            </button>
            <button
              onClick={() => goToMove(currentMoveIndex + 1)}
              disabled={currentMoveIndex >= moveHistory.length}
              className="px-4 py-2 rounded-md bg-gray-600 text-white hover:bg-gray-500 disabled:bg-gray-800 disabled:cursor-not-allowed transition-all"
            >
              Next →
            </button>
            <button
              onClick={() => goToMove(moveHistory.length)}
              disabled={currentMoveIndex >= moveHistory.length}
              className="px-4 py-2 rounded-md bg-gray-600 text-white hover:bg-gray-500 disabled:bg-gray-800 disabled:cursor-not-allowed transition-all"
            >
              End →
            </button>
          </div>
        </div>

        {/* Chess Board and Move Tree Section */}
        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          {/* Chess Board */}
          <div className="lg:col-span-1">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-4 text-center">Chess Board</h3>
              <div className="flex justify-center">
                <Chessboard
                  position={currentFEN}
                  onPieceDrop={handleBoardMove}
                  boardWidth={400}
                  showBoardNotation={true}
                  arePiecesDraggable={true}
                />
              </div>
            </div>
          </div>

          {/* Move Tree */}
          <div className="lg:col-span-2">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <MoveTree
                moveTree={moveTree}
                currentMoveIndex={currentMoveIndex}
                onMoveClick={handleMoveTreeClick}
                onVariationClick={handleVariationClick}
                onAnnotationClick={handleAnnotationClick}
                onAddAnnotation={handleAddAnnotation}
                onRemoveAnnotation={handleRemoveAnnotation}
                className="move-tree-container"
              />
            </div>
          </div>
        </div>

        {/* Current Position Info */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mb-6">
          <div className="text-sm">
            <strong>Current FEN:</strong> <code className="bg-gray-800 px-2 py-1 rounded text-green-400">{currentFEN}</code>
          </div>
        </div>

        {/* Opening Explorer */}
        <div className="bg-white rounded-lg shadow-xl overflow-hidden">
          {viewMode === 'table' ? (
            <LichessOpeningTable
              currentFEN={currentFEN}
              onMoveClick={handleMoveClick}
              defaultDatabase={selectedDatabase}
              playerName={playerName}
            />
          ) : (
            <LichessOpeningTree
              currentFEN={currentFEN}
              onMoveClick={handleMoveClick}
              defaultDatabase={selectedDatabase}
              playerName={playerName}
            />
          )}
        </div>

        {/* Keyboard Controls Info */}
        <div className="mt-6 bg-white/10 backdrop-blur-sm rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-3 text-center">Keyboard Controls</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <div className="font-mono bg-gray-800 px-2 py-1 rounded mb-1">← → or A D</div>
              <div className="text-gray-300">Previous/Next Move</div>
            </div>
            <div className="text-center">
              <div className="font-mono bg-gray-800 px-2 py-1 rounded mb-1">↑ ↓ or W S</div>
              <div className="text-gray-300">First/Last Move</div>
            </div>
            <div className="text-center">
              <div className="font-mono bg-gray-800 px-2 py-1 rounded mb-1">Space</div>
              <div className="text-gray-300">Next Move</div>
            </div>
            <div className="text-center">
              <div className="font-mono bg-gray-800 px-2 py-1 rounded mb-1">R or Esc</div>
              <div className="text-gray-300">Reset Position</div>
            </div>
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-6 text-center text-gray-400 text-sm">
          <p>
            Powered by <a href="https://lichess.org" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline">Lichess API</a> • 
            Data from {selectedDatabase === 'masters' ? 'Masters Database' : selectedDatabase === 'lichess' ? 'Lichess Database' : 'Player Database'}
          </p>
        </div>
      </div>
  </div>
);
};

export default OpeningTreePage; 