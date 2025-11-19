import React, { memo } from 'react';
import PropTypes from 'prop-types';

/**
 * Shared notation renderer used by /analysis and /enhanced-chess-study.
 * Mirrors the exact structure, styling, and behaviour of the AnalysisPage implementation.
 */
const AnalysisNotation = ({
  tree,
  currentPath,
  currentMoveIndex,
  onNavigate
}) => {
  const handleNavigate = (path, index) => {
    if (typeof onNavigate === 'function') {
      onNavigate(path, index);
    }
  };

  if (!tree || !Array.isArray(tree.moves) || tree.moves.length === 0) {
    // Handle root-level variations (alternative first moves) even when mainline is empty
    if (Array.isArray(tree?.variations) && tree.variations.length > 0) {
      return (
        <div className="space-y-2">
          {tree.variations.map((variation, varIndex) => (
            <React.Fragment key={`root-${varIndex}`}>
              {renderVariation(
                variation,
                [-1, varIndex],
                -1,
                1,
                currentPath,
                currentMoveIndex,
                handleNavigate
              )}
              {' '}
            </React.Fragment>
          ))}
        </div>
      );
    }

    return (
      <div className="text-center text-gray-500 py-8">
        <p>No moves yet</p>
        <p className="text-sm mt-2">Make moves on the board</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Root-level variations (alternative first moves) */}
      {tree.variations && tree.variations.length > 0 && tree.moves.length === 0 && (
        <>
          {tree.variations.map((variation, varIndex) => (
            <React.Fragment key={`root-${varIndex}`}>
              {renderVariation(
                variation,
                [-1, varIndex],
                -1,
                1,
                currentPath,
                currentMoveIndex,
                handleNavigate
              )}
              {' '}
            </React.Fragment>
          ))}
        </>
      )}

      {/* Mainline moves with inline root variations after first move */}
      {tree.moves.map((move, index) => {
        const key = `move-${index}`;

        if (index === 0 && Array.isArray(tree.variations) && tree.variations.length > 0) {
          return (
            <React.Fragment key={key}>
              {renderMove(
                move,
                index,
                [],
                currentPath,
                currentMoveIndex,
                handleNavigate
              )}
              {tree.variations.map((variation, varIndex) => (
                <React.Fragment key={`root-${varIndex}`}>
                  {renderVariation(
                    variation,
                    [-1, varIndex],
                    index,
                    1,
                    currentPath,
                    currentMoveIndex,
                    handleNavigate
                  )}
                  {' '}
                </React.Fragment>
              ))}
            </React.Fragment>
          );
        }

        return renderMove(
          move,
          index,
          [],
          currentPath,
          currentMoveIndex,
          handleNavigate
        );
      })}
    </div>
  );
};

function renderVariation(
  variation,
  varPath,
  baseIndex,
  depth,
  currentPath,
  currentMoveIndex,
  handleNavigate
) {
  if (!variation || !Array.isArray(variation.moves)) {
    return null;
  }

  const depthColor = depth === 1
    ? 'bg-yellow-100 hover:bg-yellow-200'
    : depth === 2
      ? 'bg-orange-100 hover:bg-orange-200'
      : depth === 3
        ? 'bg-red-100 hover:bg-red-200'
        : 'bg-purple-100 hover:bg-purple-200';

  return (
    <span className="inline-block ml-1">
      <span className="text-gray-500">(</span>
      {variation.moves.map((varMove, varMoveIndex) => {
        const varActive =
          JSON.stringify(varPath) === JSON.stringify(currentPath) &&
          varMoveIndex + 1 === currentMoveIndex;

        const totalIndex = Math.max(0, baseIndex + 1 + varMoveIndex);
        const moveNumber = Math.floor(totalIndex / 2) + 1;
        const isWhiteMove = totalIndex % 2 === 0;

        return (
          <React.Fragment key={varMoveIndex}>
            {(varMoveIndex === 0 || isWhiteMove) && (
              <span className="text-gray-400 text-xs mr-1">
                {moveNumber}
                {isWhiteMove ? '.' : '...'}
              </span>
            )}

            <button
              onClick={() => handleNavigate(varPath, varMoveIndex + 1)}
              className={`px-1 py-0.5 rounded mr-1 text-xs ${
                varActive
                  ? 'bg-blue-500 text-white font-bold'
                  : `${depthColor} text-gray-700`
              }`}
            >
              {varMove.san}
            </button>

            {renderNags(varMove.nags)}
            {renderComment(varMove.comment, 'text-xs text-blue-600 italic mr-1')}

            {Array.isArray(varMove.variations) && varMove.variations.length > 0 && (
              <>
                {varMove.variations.map((subVar, subVarIndex) => (
                  <React.Fragment key={subVarIndex}>
                    {renderVariation(
                      subVar,
                      [...varPath, varMoveIndex, subVarIndex],
                      totalIndex,
                      depth + 1,
                      currentPath,
                      currentMoveIndex,
                      handleNavigate
                    )}
                  </React.Fragment>
                ))}
              </>
            )}
          </React.Fragment>
        );
      })}
      <span className="text-gray-500">)</span>
    </span>
  );
}

function renderMove(
  move,
  index,
  path,
  currentPath,
  currentMoveIndex,
  handleNavigate
) {
  const isMainline = path.length === 0;
  const isActive =
    JSON.stringify(path) === JSON.stringify(currentPath) &&
    index + 1 === currentMoveIndex;

  const moveNumber = Math.floor(index / 2) + 1;
  const isWhiteMove = index % 2 === 0;

  return (
    <React.Fragment key={`${path.join('-')}-${index}`}>
      {isWhiteMove && (
        <span className="text-gray-500 font-semibold mr-1">
          {moveNumber}.
        </span>
      )}

      <button
        onClick={() => handleNavigate(path, index + 1)}
        className={`px-2 py-1 rounded mr-1 transition-all ${
          isActive
            ? 'bg-blue-500 text-white font-bold'
            : isMainline
              ? 'bg-gray-100 hover:bg-gray-200 text-gray-800'
              : 'bg-yellow-50 hover:bg-yellow-100 text-gray-700'
        }`}
      >
        {move.san}
      </button>

      {renderNags(move.nags, 'text-sm text-gray-600 mr-1')}
      {renderComment(move.comment, 'text-sm text-blue-700 italic mr-2')}

      {Array.isArray(move.variations) && move.variations.length > 0 && (
        <>
          {move.variations.map((variation, varIndex) => (
            <React.Fragment key={varIndex}>
              {renderVariation(
                variation,
                [...path, index, varIndex],
                index,
                1,
                currentPath,
                currentMoveIndex,
                handleNavigate
              )}
            </React.Fragment>
          ))}
        </>
      )}

      {!isWhiteMove && <br />}
    </React.Fragment>
  );
}

function renderNags(nags, className = 'text-xs text-gray-600 mr-1') {
  if (!Array.isArray(nags) || nags.length === 0) {
    return null;
  }

  return (
    <span className={className}>
      {nags
        .map((nag) => {
          const map = {
            1: '!',
            2: '?',
            3: '!!',
            4: '??',
            5: '!?',
            6: '?!'
          };
          return map[nag] || `$${nag}`;
        })
        .join('')}
    </span>
  );
}

function renderComment(comment, className) {
  if (!comment) {
    return null;
  }

  return (
    <span className={className}>
      {`{${comment}}`}
    </span>
  );
}

AnalysisNotation.propTypes = {
  tree: PropTypes.shape({
    moves: PropTypes.array,
    variations: PropTypes.array
  }),
  currentPath: PropTypes.arrayOf(PropTypes.number).isRequired,
  currentMoveIndex: PropTypes.number.isRequired,
  onNavigate: PropTypes.func.isRequired
};

AnalysisNotation.defaultProps = {
  tree: { moves: [], variations: [] }
};

export default memo(AnalysisNotation);








