import React, { useCallback, useMemo } from 'react';

interface MoveNode {
  id: string;
  move: string;
  san: string;
  from: string;
  to: string;
  comment?: string;
  commentAfter?: string;
  variations: MoveNode[];
  parent?: MoveNode;
  moveNumber: number;
  isWhite: boolean;
  depth: number;
}

interface VariationNavigatorProps {
  currentNode: MoveNode | null;
  currentPath: string[];
  onNavigate: (nodeId: string) => void;
  onGoToMainLine: () => void;
  onGoToVariation: (variationIndex: number) => void;
  onGoBack: () => void;
  onGoForward: () => void;
}

const VariationNavigator: React.FC<VariationNavigatorProps> = ({
  currentNode,
  currentPath,
  onNavigate,
  onGoToMainLine,
  onGoToVariation,
  onGoBack,
  onGoForward
}) => {
  // Get all possible next moves from current position
  const nextMoves = useMemo(() => {
    if (!currentNode || !currentNode.variations) return [];
    return currentNode.variations.map((variation, index) => ({
      ...variation,
      index
    }));
  }, [currentNode]);

  // Get parent node for back navigation
  const parentNode = useMemo(() => {
    return currentNode?.parent;
  }, [currentNode]);

  // Get siblings (other variations at same level)
  const siblings = useMemo(() => {
    if (!currentNode?.parent || !currentNode.parent.variations) return [];
    return currentNode.parent.variations.filter(v => v.id !== currentNode.id);
  }, [currentNode]);

  // Get main line path (first variation at each level)
  const getMainLinePath = useCallback((node: MoveNode): string[] => {
    const path: string[] = [];
    let current = node;
    
    while (current.parent) {
      // Find this node's index in parent's variations
      const parentVariations = current.parent.variations;
      const index = parentVariations.findIndex(v => v.id === current.id);
      
      if (index === 0) {
        path.unshift(current.id);
      } else {
        break; // Not on main line
      }
      
      current = current.parent;
    }
    
    return path;
  }, []);

  // Check if we're on main line
  const isOnMainLine = useMemo(() => {
    if (!currentNode?.parent) return true;
    const parentVariations = currentNode.parent.variations;
    return parentVariations.length > 0 && parentVariations[0].id === currentNode.id;
  }, [currentNode]);

  const buttonStyle: React.CSSProperties = {
    padding: '8px 12px',
    margin: '2px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    backgroundColor: 'white',
    color: '#374151',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '500',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  };

  const activeButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    backgroundColor: '#3b82f6',
    color: 'white',
    borderColor: '#1d4ed8'
  };

  const disabledButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    backgroundColor: '#f9fafb',
    color: '#9ca3af',
    cursor: 'not-allowed',
    borderColor: '#e5e7eb'
  };

  const sectionStyle: React.CSSProperties = {
    marginBottom: '16px',
    padding: '12px',
    backgroundColor: '#f8fafc',
    borderRadius: '8px',
    border: '1px solid #e5e7eb'
  };

  const sectionTitleStyle: React.CSSProperties = {
    fontSize: '14px',
    fontWeight: 'bold',
    marginBottom: '8px',
    color: '#374151'
  };

  return (
    <div style={{ padding: '16px' }}>
      {/* Current Position Info */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>Current Position</div>
        <div style={{ fontSize: '12px', color: '#6b7280' }}>
          {currentNode ? (
            <>
              <div>Move: {currentNode.san}</div>
              <div>Number: {currentNode.moveNumber}</div>
              <div>Depth: {currentNode.depth}</div>
              <div>Variations: {currentNode.variations.length}</div>
              {currentNode.commentAfter && (
                <div style={{ marginTop: '4px', fontStyle: 'italic' }}>
                  💬 {currentNode.commentAfter}
                </div>
              )}
            </>
          ) : (
            <div>At starting position</div>
          )}
        </div>
      </div>

      {/* Navigation Controls */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>Navigation</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
          <button
            style={parentNode ? buttonStyle : disabledButtonStyle}
            onClick={() => parentNode && onNavigate(parentNode.id)}
            disabled={!parentNode}
            title="Go to previous move"
          >
            ← Back
          </button>
          
          <button
            style={nextMoves.length > 0 ? buttonStyle : disabledButtonStyle}
            onClick={onGoForward}
            disabled={nextMoves.length === 0}
            title="Go to next move (main line)"
          >
            Forward →
          </button>
          
          <button
            style={!isOnMainLine ? buttonStyle : disabledButtonStyle}
            onClick={onGoToMainLine}
            disabled={isOnMainLine}
            title="Go to main line"
          >
            🏠 Main Line
          </button>
        </div>
      </div>

      {/* Next Moves */}
      {nextMoves.length > 0 && (
        <div style={sectionStyle}>
          <div style={sectionTitleStyle}>Next Moves ({nextMoves.length})</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            {nextMoves.map((move, index) => (
              <button
                key={move.id}
                style={buttonStyle}
                onClick={() => onNavigate(move.id)}
                title={`${move.san}${move.commentAfter ? ` - ${move.commentAfter}` : ''}`}
              >
                {index === 0 && '🎯 '}
                {move.san}
                {move.variations.length > 0 && ` (${move.variations.length})`}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Sibling Variations */}
      {siblings.length > 0 && (
        <div style={sectionStyle}>
          <div style={sectionTitleStyle}>Other Variations ({siblings.length})</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            {siblings.map((sibling, index) => (
              <button
                key={sibling.id}
                style={buttonStyle}
                onClick={() => onNavigate(sibling.id)}
                title={`${sibling.san}${sibling.commentAfter ? ` - ${sibling.commentAfter}` : ''}`}
              >
                🌿 {sibling.san}
                {sibling.variations.length > 0 && ` (${sibling.variations.length})`}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Breadcrumb Navigation */}
      {currentPath && currentPath.length > 0 && (
        <div style={sectionStyle}>
          <div style={sectionTitleStyle}>Path</div>
          <div style={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: '4px',
            fontSize: '11px'
          }}>
            <button
              style={buttonStyle}
              onClick={() => onNavigate('root')}
            >
              🏠 Root
            </button>
            {currentPath.map((nodeId, index) => (
              <React.Fragment key={nodeId}>
                <span style={{ color: '#9ca3af' }}>→</span>
                <button
                  style={buttonStyle}
                  onClick={() => onNavigate(nodeId)}
                >
                  {index + 1}
                </button>
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>Quick Stats</div>
        <div style={{ fontSize: '11px', color: '#6b7280' }}>
          <div>Path Length: {currentPath ? currentPath.length : 0}</div>
          <div>Available Moves: {nextMoves.length}</div>
          <div>On Main Line: {isOnMainLine ? 'Yes' : 'No'}</div>
          <div>Has Variations: {currentNode?.variations?.length ? 'Yes' : 'No'}</div>
        </div>
      </div>

      {/* Keyboard Shortcuts */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>⌨️ Keyboard Shortcuts</div>
        <div style={{ fontSize: '10px', color: '#6b7280' }}>
          <div style={{ marginBottom: '4px' }}>
            <kbd style={{ backgroundColor: '#f3f4f6', padding: '1px 3px', borderRadius: '2px' }}>←</kbd> Back
            <kbd style={{ backgroundColor: '#f3f4f6', padding: '1px 3px', borderRadius: '2px', marginLeft: '8px' }}>→</kbd> Forward
          </div>
          <div style={{ marginBottom: '4px' }}>
            <kbd style={{ backgroundColor: '#f3f4f6', padding: '1px 3px', borderRadius: '2px' }}>↑</kbd> Prev Variation
            <kbd style={{ backgroundColor: '#f3f4f6', padding: '1px 3px', borderRadius: '2px', marginLeft: '8px' }}>↓</kbd> Next Variation
          </div>
          <div style={{ marginBottom: '4px' }}>
            <kbd style={{ backgroundColor: '#f3f4f6', padding: '1px 3px', borderRadius: '2px' }}>Home</kbd> Start
            <kbd style={{ backgroundColor: '#f3f4f6', padding: '1px 3px', borderRadius: '2px', marginLeft: '8px' }}>End</kbd> Main Line End
          </div>
          <div>
            <kbd style={{ backgroundColor: '#f3f4f6', padding: '1px 3px', borderRadius: '2px' }}>Space</kbd> Toggle Tree
            <kbd style={{ backgroundColor: '#f3f4f6', padding: '1px 3px', borderRadius: '2px', marginLeft: '8px' }}>Esc</kbd> Clear
          </div>
        </div>
      </div>
    </div>
  );
};

export default VariationNavigator;
