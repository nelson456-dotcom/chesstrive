import React, { useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight, SkipBack, SkipForward, RotateCcw, Play, Pause } from 'lucide-react';

const EnhancedChessNotation = ({ 
  gameTree, 
  currentMove, 
  onMoveClick, 
  onVariationClick, 
  onNavigateToMove,
  onGoToStart,
  onGoToEnd,
  onGoToPrevious,
  onGoToNext,
  onResetPosition,
  isAutoPlaying,
  onToggleAutoPlay
}) => {
  const [collapsedVariations, setCollapsedVariations] = useState(new Set());

  // Format a single move with its variations
  const formatMoveWithVariations = useCallback((move, moveIndex, isWhite, moveNumber) => {
    const elements = [];
    
    // Move number for white moves
    if (isWhite) {
      elements.push(
        <span key={`num-${moveIndex}`} className="text-gray-600 font-semibold">
          {moveNumber}.
        </span>
      );
    }
    
    // Move notation with current move highlighting
    const isCurrentMove = moveIndex === currentMove;
    elements.push(
      <span
        key={`move-${moveIndex}`}
        className={`cursor-pointer px-1 py-0.5 rounded transition-colors ${
          isCurrentMove 
            ? 'bg-blue-500 text-white font-semibold' 
            : 'hover:bg-blue-100 text-blue-800'
        }`}
        onClick={() => onMoveClick(moveIndex)}
      >
        {move.notation}
      </span>
    );
    
    // Variations
    if (move.variations && move.variations.length > 0) {
      const variationId = `var-${moveIndex}`;
      const isCollapsed = collapsedVariations.has(variationId);
      
      elements.push(
        <span key={`var-start-${moveIndex}`} className="text-gray-500">
          {' '}(
        </span>
      );
      
      if (isCollapsed) {
        elements.push(
          <span 
            key={`var-collapsed-${moveIndex}`}
            className="cursor-pointer text-blue-600 hover:text-blue-800"
            onClick={() => setCollapsedVariations(prev => {
              const next = new Set(prev);
              next.delete(variationId);
              return next;
            })}
          >
            +{move.variations.length} variations
          </span>
        );
      } else {
        move.variations.forEach((variation, varIndex) => {
          if (variation.moves && variation.moves.length > 0) {
            elements.push(
              <span key={`var-${moveIndex}-${varIndex}`} className="text-gray-600">
                {isWhite ? `${moveNumber}...` : ''}
                {variation.moves.map((varMove, varMoveIndex) => (
                  <span
                    key={`var-move-${moveIndex}-${varIndex}-${varMoveIndex}`}
                    className="cursor-pointer px-1 py-0.5 rounded hover:bg-green-100 text-green-800"
                    onClick={() => onVariationClick(moveIndex, varIndex, varMoveIndex)}
                  >
                    {varMove.notation}
                  </span>
                )).reduce((prev, curr, index) => [prev, ' ', curr])}
              </span>
            );
          }
        });
        
        // Collapse button
        elements.push(
          <span 
            key={`var-collapse-${moveIndex}`}
            className="cursor-pointer text-gray-400 hover:text-gray-600 ml-1"
            onClick={() => setCollapsedVariations(prev => new Set(prev).add(variationId))}
          >
            [−]
          </span>
        );
      }
      
      elements.push(
        <span key={`var-end-${moveIndex}`} className="text-gray-500">
          )
        </span>
      );
    }
    
    return elements;
  }, [currentMove, collapsedVariations, onMoveClick, onVariationClick]);

  // Render the complete notation
  const renderNotation = useCallback(() => {
    if (!gameTree || !gameTree.moves || gameTree.moves.length === 0) {
      return (
        <div className="text-gray-500 italic text-center py-4">
          No moves yet. Make moves on the board to see them here.
        </div>
      );
    }

    const elements = [];
    let moveNumber = 1;
    let isWhite = true;

    gameTree.moves.forEach((move, index) => {
      elements.push(
        <span key={`move-container-${index}`} className="inline-block mr-2">
          {formatMoveWithVariations(move, index, isWhite, moveNumber)}
        </span>
      );
      
      if (!isWhite) {
        moveNumber++;
      }
      isWhite = !isWhite;
    });

    return elements;
  }, [gameTree, formatMoveWithVariations]);

  return (
    <div className="bg-white rounded-xl shadow-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-lg text-gray-700 flex items-center">
          <span className="mr-2">📝</span>
          Game Notation
        </h3>
        
        {/* Navigation Controls */}
        <div className="flex items-center space-x-1">
          <button
            className="p-2 bg-gray-100 border rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-gray-700"
            onClick={onGoToStart}
            disabled={currentMove === 0}
            title="Go to start (Home key)"
          >
            <SkipBack className="w-4 h-4" />
          </button>
          <button
            className="p-2 bg-gray-100 border rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-gray-700"
            onClick={onGoToPrevious}
            disabled={currentMove === 0}
            title="Previous move (← Arrow)"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="px-3 py-2 bg-gray-100 border rounded font-mono text-sm text-gray-700 min-w-20 text-center">
            {currentMove} / {gameTree?.moves?.length || 0}
          </span>
          <button
            className="p-2 bg-gray-100 border rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-gray-700"
            onClick={onGoToNext}
            disabled={currentMove >= (gameTree?.moves?.length || 0)}
            title="Next move (→ Arrow)"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            className="p-2 bg-gray-100 border rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-gray-700"
            onClick={onGoToEnd}
            disabled={currentMove >= (gameTree?.moves?.length || 0)}
            title="Go to end (End key)"
          >
            <SkipForward className="w-4 h-4" />
          </button>
          <div className="w-px h-6 bg-gray-300 mx-1"></div>
          <button
            className="p-2 bg-gray-100 border rounded hover:bg-gray-200 transition-colors text-gray-700"
            onClick={onToggleAutoPlay}
            title={`${isAutoPlaying ? 'Pause' : 'Play'} auto-play (A key)`}
          >
            {isAutoPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
          <button
            className="p-2 bg-gray-100 border rounded hover:bg-gray-200 transition-colors text-gray-700"
            onClick={onResetPosition}
            title="Reset position (R key)"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      {/* Notation Display */}
      <div className="bg-gray-50 p-4 rounded border border-gray-200 min-h-32 font-mono text-sm leading-relaxed max-h-64 overflow-y-auto">
        {renderNotation()}
      </div>
      
      {/* Keyboard Shortcuts Help */}
      <div className="mt-3 text-xs text-gray-500 bg-gray-100 p-2 rounded">
        <div className="flex flex-wrap gap-4">
          <span><kbd className="px-1 py-0.5 bg-gray-200 rounded">←</kbd> Previous move</span>
          <span><kbd className="px-1 py-0.5 bg-gray-200 rounded">→</kbd> Next move</span>
          <span><kbd className="px-1 py-0.5 bg-gray-200 rounded">Home</kbd> Go to start</span>
          <span><kbd className="px-1 py-0.5 bg-gray-200 rounded">End</kbd> Go to end</span>
          <span><kbd className="px-1 py-0.5 bg-gray-200 rounded">A</kbd> Auto-play</span>
          <span><kbd className="px-1 py-0.5 bg-gray-200 rounded">R</kbd> Reset</span>
          <span><kbd className="px-1 py-0.5 bg-gray-200 rounded">Space</kbd> Next move</span>
        </div>
      </div>
    </div>
  );
};

export default EnhancedChessNotation;
