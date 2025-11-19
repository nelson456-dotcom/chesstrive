import React, { useEffect } from 'react';

interface ChessMoment {
  move?: string;
  fen: string;
  from?: string;
  to?: string;
  depth: number;
  index: number;
  comment?: string;
}

interface ChessMomentsAnnotationProps {
  moments: ChessMoment[];
  currentMoveIndex: number;
  onMoveClick: (moveIndex: number) => void;
  treeView?: boolean;
  onPreviousMove: () => void;
  onNextMove: () => void;
  onFirstMove: () => void;
  onLastMove: () => void;
}

const ChessMomentsAnnotation: React.FC<ChessMomentsAnnotationProps> = ({
  moments,
  currentMoveIndex,
  onMoveClick,
  treeView = false,
  onPreviousMove,
  onNextMove,
  onFirstMove,
  onLastMove,
}) => {
  // Add keyboard controls
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle keyboard shortcuts when this component is focused
      if (event.target instanceof HTMLElement && event.target.closest('.chess-moments-annotation')) {
        switch (event.key) {
          case 'ArrowLeft':
            event.preventDefault();
            onPreviousMove();
            break;
          case 'ArrowRight':
            event.preventDefault();
            onNextMove();
            break;
          case 'Home':
            event.preventDefault();
            onFirstMove();
            break;
          case 'End':
            event.preventDefault();
            onLastMove();
            break;
          case ' ':
            event.preventDefault();
            onNextMove();
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onPreviousMove, onNextMove, onFirstMove, onLastMove]);

  const renderMoment = (moment: ChessMoment, index: number) => {
    const isCurrentMove = moment.index === currentMoveIndex;
    const isVariation = moment.depth > 1;
    const moveNumber = Math.floor((moment.index - 1) / 2) + 1; // Adjust for starting position
    const isWhiteMove = (moment.index - 1) % 2 === 0; // Adjust for starting position

    return (
      <div 
        key={moment.index} 
        onClick={() => onMoveClick(index)}
        style={{
          padding: '12px',
          margin: '6px 0',
          borderRadius: '8px',
          backgroundColor: isCurrentMove ? '#1E88E5' : isVariation ? '#FFF8E1' : '#FAFAFA',
          color: isCurrentMove ? 'white' : '#333',
          cursor: 'pointer',
          border: isCurrentMove ? '3px solid #0D47A1' : isVariation ? '2px solid #FF9800' : '1px solid #E0E0E0',
          transition: 'all 0.3s ease',
          marginLeft: isVariation ? `${(moment.depth - 1) * 24}px` : '0px',
          boxShadow: isCurrentMove ? '0 4px 12px rgba(30, 136, 229, 0.3)' : '0 2px 4px rgba(0,0,0,0.1)',
          position: 'relative'
        }}
      >
        {/* Move indicator */}
        {moment.move && (
          <div style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            backgroundColor: isCurrentMove ? 'rgba(255,255,255,0.2)' : '#E3F2FD',
            color: isCurrentMove ? 'white' : '#1976D2',
            padding: '4px 8px',
            borderRadius: '12px',
            fontSize: '11px',
            fontWeight: 'bold'
          }}>
            {moveNumber}{isWhiteMove ? '.' : '...'}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
          <div style={{ flex: 1 }}>
            {moment.move ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ 
                  fontWeight: 'bold', 
                  fontSize: '18px',
                  color: isCurrentMove ? 'white' : '#1976D2'
                }}>
                  {moment.move}
                </span>
                {isVariation && (
                  <span style={{ 
                    fontSize: '11px', 
                    backgroundColor: '#FF9800',
                    color: 'white',
                    padding: '2px 6px',
                    borderRadius: '10px',
                    fontWeight: 'bold'
                  }}>
                    VARIATION
                  </span>
                )}
              </div>
            ) : (
              <span style={{ 
                fontStyle: 'italic', 
                color: isCurrentMove ? 'rgba(255,255,255,0.8)' : '#666',
                fontSize: '14px'
              }}>
                {isVariation ? 'Variation Start' : 'Starting Position'}
              </span>
            )}
          </div>
        </div>
        
        {moment.move && (
          <div style={{ 
            fontSize: '13px', 
            marginBottom: '6px',
            color: isCurrentMove ? 'rgba(255,255,255,0.9)' : '#666',
            fontFamily: 'monospace'
          }}>
            {moment.from} → {moment.to}
          </div>
        )}
        
        {moment.comment && (
          <div style={{ 
            fontSize: '12px', 
            marginBottom: '6px',
            fontStyle: 'italic',
            backgroundColor: isCurrentMove ? 'rgba(255,255,255,0.15)' : '#F5F5F5',
            color: isCurrentMove ? 'white' : '#555',
            padding: '6px 8px',
            borderRadius: '6px',
            borderLeft: '3px solid #4CAF50'
          }}>
            💬 {moment.comment}
          </div>
        )}
        
        <div style={{ 
          fontSize: '10px', 
          color: isCurrentMove ? 'rgba(255,255,255,0.7)' : '#999',
          fontFamily: 'monospace',
          wordBreak: 'break-all'
        }}>
          FEN: {moment.fen.substring(0, 30)}...
        </div>
      </div>
    );
  };

  return (
    <div 
      className="chess-moments-annotation"
      tabIndex={0}
      style={{
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: '14px',
        backgroundColor: '#FFFFFF',
        borderRadius: '12px',
        border: '1px solid #E0E0E0',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        overflow: 'hidden',
        outline: 'none'
      }}
    >
      {/* Header with controls */}
      <div style={{
        padding: '16px 20px',
        backgroundColor: '#F8F9FA',
        borderBottom: '1px solid #E0E0E0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h3 style={{ margin: '0', color: '#1976D2', fontSize: '18px', fontWeight: '600' }}>
            🎯 Chess Moments Annotation
          </h3>
          <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
            Total: {moments.length} | Current: {currentMoveIndex + 1} | {treeView ? 'Tree View' : 'Flat View'}
          </div>
        </div>
        
        {/* Arrow Controls */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={onFirstMove}
            disabled={currentMoveIndex <= 0}
            style={{
              padding: '8px 12px',
              backgroundColor: currentMoveIndex <= 0 ? '#E0E0E0' : '#1976D2',
              color: currentMoveIndex <= 0 ? '#999' : 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: currentMoveIndex <= 0 ? 'not-allowed' : 'pointer',
              fontSize: '12px',
              fontWeight: 'bold'
            }}
          >
            ⏮️ First
          </button>
          <button
            onClick={onPreviousMove}
            disabled={currentMoveIndex <= 0}
            style={{
              padding: '8px 12px',
              backgroundColor: currentMoveIndex <= 0 ? '#E0E0E0' : '#1976D2',
              color: currentMoveIndex <= 0 ? '#999' : 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: currentMoveIndex <= 0 ? 'not-allowed' : 'pointer',
              fontSize: '12px',
              fontWeight: 'bold'
            }}
          >
            ⬅️ Prev
          </button>
          <button
            onClick={onNextMove}
            disabled={currentMoveIndex >= moments.length - 1}
            style={{
              padding: '8px 12px',
              backgroundColor: currentMoveIndex >= moments.length - 1 ? '#E0E0E0' : '#1976D2',
              color: currentMoveIndex >= moments.length - 1 ? '#999' : 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: currentMoveIndex >= moments.length - 1 ? 'not-allowed' : 'pointer',
              fontSize: '12px',
              fontWeight: 'bold'
            }}
          >
            Next ➡️
          </button>
          <button
            onClick={onLastMove}
            disabled={currentMoveIndex >= moments.length - 1}
            style={{
              padding: '8px 12px',
              backgroundColor: currentMoveIndex >= moments.length - 1 ? '#E0E0E0' : '#1976D2',
              color: currentMoveIndex >= moments.length - 1 ? '#999' : 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: currentMoveIndex >= moments.length - 1 ? 'not-allowed' : 'pointer',
              fontSize: '12px',
              fontWeight: 'bold'
            }}
          >
            Last ⏭️
          </button>
        </div>
      </div>
      
      {/* Moments Container */}
      <div style={{
        maxHeight: '500px',
        overflowY: 'auto',
        padding: '16px 20px'
      }}>
        {moments.length === 0 ? (
          <div style={{ 
            color: '#666', 
            fontStyle: 'italic',
            textAlign: 'center',
            padding: '40px 20px',
            backgroundColor: '#F8F9FA',
            borderRadius: '8px',
            border: '2px dashed #E0E0E0'
          }}>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>🎯</div>
            <div>No chess moments yet. Start playing!</div>
            <div style={{ fontSize: '12px', marginTop: '4px', color: '#999' }}>
              Each move will create a chess moment with full metadata
            </div>
          </div>
        ) : (
          <div className="moments-container">
            {moments.map((moment, index) => renderMoment(moment, index))}
          </div>
        )}
      </div>
      
      {/* Footer */}
      <div style={{ 
        padding: '12px 20px', 
        backgroundColor: '#F8F9FA', 
        borderTop: '1px solid #E0E0E0',
        fontSize: '11px',
        color: '#666'
      }}>
        <strong>Chess Moments Features:</strong> Each moment contains move, FEN, and metadata • 
        Click any moment to navigate • Supports variations and comments • 
        Built-in tree structure for sublines<br/>
        <strong>Keyboard:</strong> ← → (prev/next) • Home/End (first/last) • Space (next)
      </div>
    </div>
  );
};

export default ChessMomentsAnnotation;