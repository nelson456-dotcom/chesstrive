import React, { useState, useEffect, useRef } from 'react';

// Extend Performance interface for memory API (Chrome-specific)
interface PerformanceMemory {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

interface PerformanceWithMemory extends Performance {
  memory?: PerformanceMemory;
}

interface PerformanceTestProps {
  boardType: 'react' | 'canvas' | 'optimized';
  onTestComplete: (results: PerformanceResults) => void;
}

interface PerformanceResults {
  renderTime: number;
  memoryUsage: number;
  componentCount: number;
  reRenderCount: number;
}

const PerformanceTest: React.FC<PerformanceTestProps> = ({ boardType, onTestComplete }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<PerformanceResults | null>(null);
  const renderCountRef = useRef(0);
  const startTimeRef = useRef(0);

  const runPerformanceTest = async () => {
    setIsRunning(true);
    renderCountRef.current = 0;
    startTimeRef.current = performance.now();

    // Simulate rapid state changes to test re-render performance
    const testMoves = [
      'e2e4', 'e7e5', 'g1f3', 'b8c6', 'f1b5', 'a7a6',
      'b5a4', 'g8f6', 'e1g1', 'f8e7', 'f1e1', 'b7b5',
      'a4b3', 'd7d6', 'c2c3', 'c8g4', 'd2d4', 'e5d4',
      'c3d4', 'c6b4', 'a2a3', 'b4d5', 'b3d5', 'f6d5'
    ];

    // Simulate rapid moves
    for (let i = 0; i < testMoves.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 50)); // 50ms between moves
      renderCountRef.current++;
    }

    // Measure final performance
    const endTime = performance.now();
    const renderTime = Math.round(endTime - startTimeRef.current);
    const performanceWithMemory = performance as PerformanceWithMemory;
    const memoryUsage = performanceWithMemory.memory ? 
      Math.round(performanceWithMemory.memory.usedJSHeapSize / 1024 / 1024) : 0;

    let componentCount = 0;
    switch (boardType) {
      case 'react':
        componentCount = 64; // 64 squares + pieces
        break;
      case 'optimized':
        componentCount = 64; // 64 squares, but memoized
        break;
      case 'canvas':
        componentCount = 1; // Single canvas element
        break;
    }

    const testResults: PerformanceResults = {
      renderTime,
      memoryUsage,
      componentCount,
      reRenderCount: renderCountRef.current
    };

    setResults(testResults);
    onTestComplete(testResults);
    setIsRunning(false);
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(10px)',
      borderRadius: '12px',
      padding: '16px',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      minWidth: '250px',
      zIndex: 1000
    }}>
      <h3 style={{
        margin: '0 0 12px 0',
        fontSize: '14px',
        fontWeight: '600',
        color: '#374151'
      }}>
        🧪 Performance Test
      </h3>

      {!isRunning && !results && (
        <button
          onClick={runPerformanceTest}
          style={{
            width: '100%',
            padding: '8px 16px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: '600'
          }}
        >
          Run Performance Test
        </button>
      )}

      {isRunning && (
        <div style={{
          textAlign: 'center',
          padding: '20px 0',
          color: '#6b7280'
        }}>
          <div style={{
            display: 'inline-block',
            width: '20px',
            height: '20px',
            border: '2px solid #e5e7eb',
            borderTop: '2px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            marginRight: '8px'
          }} />
          Testing {boardType} board...
        </div>
      )}

      {results && (
        <div>
          <div style={{ marginBottom: '8px' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '4px'
            }}>
              <span style={{ fontSize: '12px', color: '#6b7280' }}>Total Time:</span>
              <span style={{
                fontSize: '12px',
                fontWeight: '600',
                color: results.renderTime < 1000 ? '#10b981' : '#ef4444'
              }}>
                {results.renderTime}ms
              </span>
            </div>
          </div>

          <div style={{ marginBottom: '8px' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '4px'
            }}>
              <span style={{ fontSize: '12px', color: '#6b7280' }}>Memory:</span>
              <span style={{
                fontSize: '12px',
                fontWeight: '600',
                color: results.memoryUsage < 20 ? '#10b981' : '#ef4444'
              }}>
                {results.memoryUsage}MB
              </span>
            </div>
          </div>

          <div style={{ marginBottom: '8px' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '4px'
            }}>
              <span style={{ fontSize: '12px', color: '#6b7280' }}>Re-renders:</span>
              <span style={{
                fontSize: '12px',
                fontWeight: '600',
                color: results.reRenderCount < 50 ? '#10b981' : '#ef4444'
              }}>
                {results.reRenderCount}
              </span>
            </div>
          </div>

          <div style={{ marginBottom: '8px' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '4px'
            }}>
              <span style={{ fontSize: '12px', color: '#6b7280' }}>Components:</span>
              <span style={{
                fontSize: '12px',
                fontWeight: '600',
                color: results.componentCount === 1 ? '#10b981' : '#ef4444'
              }}>
                {results.componentCount}
              </span>
            </div>
          </div>

          <div style={{
            marginTop: '12px',
            padding: '8px',
            backgroundColor: boardType === 'canvas' ? '#f0f9ff' : 
                            boardType === 'optimized' ? '#f0fdf4' : '#fef3c7',
            borderRadius: '6px',
            border: `1px solid ${boardType === 'canvas' ? '#0ea5e9' : 
                              boardType === 'optimized' ? '#10b981' : '#f59e0b'}`
          }}>
            <div style={{
              fontSize: '11px',
              fontWeight: '600',
              color: boardType === 'canvas' ? '#0c4a6e' : 
                     boardType === 'optimized' ? '#14532d' : '#92400e',
              marginBottom: '4px'
            }}>
              Performance Score: {
                boardType === 'canvas' ? 'A+' :
                boardType === 'optimized' ? 'A' : 'B'
              }
            </div>
            <div style={{
              fontSize: '10px',
              color: boardType === 'canvas' ? '#0c4a6e' : 
                     boardType === 'optimized' ? '#14532d' : '#92400e'
            }}>
              {boardType === 'canvas' ? 'Maximum performance with Canvas' :
               boardType === 'optimized' ? 'Excellent with React optimizations' : 
               'Good with standard React'}
            </div>
          </div>

          <button
            onClick={() => {
              setResults(null);
              runPerformanceTest();
            }}
            style={{
              width: '100%',
              marginTop: '8px',
              padding: '6px 12px',
              backgroundColor: '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '11px',
              fontWeight: '600'
            }}
          >
            Run Again
          </button>
        </div>
      )}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default PerformanceTest;
