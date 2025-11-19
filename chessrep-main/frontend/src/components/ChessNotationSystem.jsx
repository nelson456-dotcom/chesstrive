import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, ArrowLeft, RotateCcw } from 'lucide-react';

// ============================================================================
// STANDALONE NOTATION SYSTEM - INTEGRATE WITH YOUR EXISTING BOARD
// ============================================================================

const ChessNotationRecorder = ({
  gameTree,
  position,
  recordMove,
  navigateToMove,
  createVariation,
  exitVariation,
  getCurrentLine,
  getPositionMoves,
  resetPosition,
  clearGame,
  exportNotation
}) => {
  // Format notation function
  const formatNotation = (moves, startNum = 1, startColor = 'white') => {
    let result = '';
    let moveNum = startNum;
    let isWhite = startColor === 'white';
    
    for (let i = 0; i < moves.length; i++) {
      const move = moves[i];
      
      if (isWhite) {
        result += `${moveNum}. ${move.notation} `;
      } else {
        result += `${move.notation} `;
        moveNum++;
      }
      
      if (move.variations && move.variations.length > 0) {
        for (let v = 0; v < move.variations.length; v++) {
          const variation = move.variations[v];
          if (!variation.moves || variation.moves.length === 0) continue;
          
          result += '(';
          
          if (isWhite) {
            result += `${moveNum}...${variation.moves[0].notation} `;
            if (variation.moves.length > 1) {
              result += formatNotation(variation.moves.slice(1), moveNum + 1, 'white');
            }
          } else {
            result += formatNotation(variation.moves, moveNum, 'white');
          }
          
          result += ') ';
        }
      }
      
      isWhite = !isWhite;
    }
    
    return result.trim();
  };

  // ============================================================================
  // CORE API - Use these functions from your board
  // ============================================================================
  // All functions are now provided by the useChessNotation hook

  const renderInteractiveNotation = () => {
    const renderMoves = (moves, depth = 0, pathIndex = 0, startNum = 1, startColor = 'white') => {
      const elements = [];
      let moveNum = startNum;
      let isWhite = startColor === 'white';
      
      for (let i = 0; i < moves.length; i++) {
        const move = moves[i];
        const isCurrentPath = pathIndex < position.path.length && 
                               position.path[pathIndex]?.moveIndex === i;
        const isCurrentMove = pathIndex === position.path.length && 
                               position.moveIndex === i;
        
        if (isWhite) {
          elements.push(
            <span key={`num-${depth}-${i}`} className="text-gray-500 select-none">
              {moveNum}.{' '}
            </span>
          );
        }
        
        elements.push(
          <span
            key={`move-${depth}-${i}`}
            onClick={() => {
              // TODO: Navigate to this move and update board
              console.log('Navigate to move:', i, 'at depth:', depth);
            }}
            className={`cursor-pointer px-1 rounded transition-colors ${
              isCurrentMove ? 'bg-blue-500 text-white font-bold' : 
              isCurrentPath ? 'bg-blue-100 text-blue-800' : 
              'hover:bg-gray-100'
            }`}
          >
            {move.notation}{' '}
          </span>
        );
        
        if (!isWhite) moveNum++;
        
        if (move.variations && move.variations.length > 0) {
          for (let v = 0; v < move.variations.length; v++) {
            const variation = move.variations[v];
            if (!variation.moves || variation.moves.length === 0) continue;
            
            const isInThisVariation = isCurrentPath && 
                                      position.path[pathIndex]?.variationIndex === v;
            
            elements.push(
              <span key={`var-${depth}-${i}-${v}`} className={`${
                isInThisVariation ? 'text-blue-600' : 'text-gray-500'
              }`}>
                (
                {isWhite ? `${moveNum}...` : ''}
                {renderMoves(
                  variation.moves,
                  depth + 1,
                  isInThisVariation ? pathIndex + 1 : -1,
                  isWhite ? moveNum : moveNum - 1,
                  isWhite ? 'black' : 'white'
                )}
                ){' '}
              </span>
            );
          }
        }
        
        isWhite = !isWhite;
      }
      
      return elements;
    };
    
    return (
      <div className="font-mono text-sm leading-relaxed">
        {renderMoves(gameTree.moves)}
      </div>
    );
  };

  // ============================================================================
  // DEMO BOARD INTEGRATION (Replace with your actual board)
  // ============================================================================

  const [demoMoves] = useState([
    'e4', 'e5', 'Nf3', 'Nc6', 'Bb5', 'a6', 'Ba4', 'Nf6',
    'O-O', 'Be7', 'd3', 'b5', 'Bb3', 'd6', 'c3', 'O-O'
  ]);
  const [demoIndex, setDemoIndex] = useState(-1);

  const playDemoMove = () => {
    if (demoIndex < demoMoves.length - 1) {
      const nextIndex = demoIndex + 1;
      setDemoIndex(nextIndex);
      recordMove(demoMoves[nextIndex]);
    }
  };

  // ============================================================================
  // UI
  // ============================================================================

  const currentLine = getCurrentLine();
  const notation = formatNotation(gameTree.moves);

  // Test function to add a move
  const testAddMove = () => {
    const testMoves = ['e4', 'e5', 'Nf3', 'Nc6'];
    const randomMove = testMoves[Math.floor(Math.random() * testMoves.length)];
    recordMove(randomMove);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <h1 className="text-2xl font-bold mb-2 text-gray-800">
          Chess Notation Recorder
        </h1>
        <p className="text-sm text-gray-600">
          Integration-ready system for your chess board
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Demo Controls */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <h2 className="font-bold text-lg mb-3 text-gray-700">
            Demo Controls (Replace with your board)
          </h2>
          <div className="flex gap-2 mb-4">
            <button
              onClick={testAddMove}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Test Add Move
            </button>
            <button
              onClick={playDemoMove}
              disabled={demoIndex >= demoMoves.length - 1}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Play Next Move ({demoIndex < demoMoves.length - 1 ? demoMoves[demoIndex + 1] : 'Done'})
            </button>
            <button
              onClick={() => {
                if (position.moveIndex >= 0) {
                  createVariation();
                }
              }}
              disabled={position.moveIndex < 0}
              className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Plus size={16} /> Create Variation
            </button>
            <button
              onClick={exitVariation}
              disabled={position.path.length === 0}
              className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <ArrowLeft size={16} /> Exit Variation
            </button>
            <button
              onClick={clearGame}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 flex items-center gap-2 ml-auto"
            >
              <RotateCcw size={16} /> Clear
            </button>
          </div>
          
          <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded border">
            <strong>How to use:</strong>
            <ol className="list-decimal ml-5 mt-2 space-y-1">
              <li>Play some moves with "Play Next Move"</li>
              <li>Navigate back using the controls below</li>
              <li>Click "Create Variation" to branch</li>
              <li>Play alternative moves</li>
              <li>Create variations within variations (infinite depth!)</li>
            </ol>
          </div>
        </div>

        {/* Navigation */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <h2 className="font-bold text-lg mb-3 text-gray-700">Navigation</h2>
          <div className="flex gap-2">
            <button
              onClick={() => navigateToMove(-1)}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Start
            </button>
            <button
              onClick={() => navigateToMove(position.moveIndex - 1)}
              disabled={position.moveIndex < 0}
              className="flex-1 px-3 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-1"
            >
              <ChevronLeft size={16} /> Previous
            </button>
            <button
              onClick={() => navigateToMove(position.moveIndex + 1)}
              disabled={position.moveIndex >= currentLine.length - 1}
              className="flex-1 px-3 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-1"
            >
              Next <ChevronRight size={16} />
            </button>
            <button
              onClick={() => navigateToMove(currentLine.length - 1)}
              disabled={currentLine.length === 0}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              End
            </button>
          </div>
          <div className="mt-3 text-sm text-center text-gray-600">
            Position: {position.moveIndex + 1} / {currentLine.length}
            {position.path.length > 0 && (
              <span className="ml-2 text-blue-600 font-bold">
                (Variation depth: {position.path.length})
              </span>
            )}
          </div>
        </div>

        {/* Notation Display */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <h2 className="font-bold text-lg mb-3 text-gray-700">Game Notation</h2>
          <div className="bg-gray-50 p-4 rounded border border-gray-200 min-h-24">
            {gameTree.moves.length > 0 ? (
              renderInteractiveNotation()
            ) : (
              <span className="text-gray-400 italic">No moves recorded yet</span>
            )}
          </div>
        </div>

        {/* Export */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <h2 className="font-bold text-lg mb-3 text-gray-700">Export Notation</h2>
          <textarea
            readOnly
            value={notation}
            className="w-full h-24 p-3 font-mono text-sm bg-gray-50 rounded border border-gray-200 resize-none"
            placeholder="Play some moves to see notation here..."
          />
        </div>

        {/* Integration Instructions */}
        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
          <h2 className="font-bold text-lg mb-3 text-blue-900">
            🔌 Integration Guide
          </h2>
          <div className="space-y-3 text-sm text-gray-700">
            <div className="bg-white p-3 rounded border border-blue-200">
              <strong className="text-blue-800">When a move is made on your board:</strong>
              <pre className="mt-2 text-xs bg-gray-50 p-2 rounded">
{`recordMove(sanNotation, fromSquare, toSquare);
// Example: recordMove("Nf3", "g1", "f3");`}
              </pre>
            </div>
            
            <div className="bg-white p-3 rounded border border-blue-200">
              <strong className="text-blue-800">To create a variation:</strong>
              <pre className="mt-2 text-xs bg-gray-50 p-2 rounded">
{`// Navigate to desired position first
navigateToMove(index);
// Then create variation
createVariation();
// Now record alternative moves
recordMove("c5");`}
              </pre>
            </div>
            
            <div className="bg-white p-3 rounded border border-blue-200">
              <strong className="text-blue-800">To update board when navigating:</strong>
              <pre className="mt-2 text-xs bg-gray-50 p-2 rounded">
{`const moves = getPositionMoves();
// moves contains all moves up to current position
// Replay them on your board`}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChessNotationRecorder;