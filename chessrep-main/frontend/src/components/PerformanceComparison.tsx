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

interface PerformanceComparisonProps {
  boardType: 'react' | 'canvas' | 'optimized';
}

const PerformanceComparison: React.FC<PerformanceComparisonProps> = ({ boardType }) => {
  const [metrics, setMetrics] = useState({
    renderTime: 0,
    memoryUsage: 0,
    componentCount: 0
  });
  
  const renderStartTime = useRef<number>(0);
  const renderEndTime = useRef<number>(0);

  useEffect(() => {
    // Start measuring render time
    renderStartTime.current = performance.now();
    
    // Simulate component count based on board type
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

    // Measure memory usage (approximate) - Chrome-specific API
    const performanceWithMemory = performance as PerformanceWithMemory;
    const memoryUsage = performanceWithMemory.memory ? 
      Math.round(performanceWithMemory.memory.usedJSHeapSize / 1024 / 1024) : 0;

    // Simulate render completion
    const timeoutId = setTimeout(() => {
      renderEndTime.current = performance.now();
      const renderTime = Math.round(renderEndTime.current - renderStartTime.current);
      
      setMetrics({
        renderTime,
        memoryUsage,
        componentCount
      });
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [boardType]);

  const getPerformanceColor = (value: number, type: 'time' | 'memory' | 'components') => {
    if (type === 'time') {
      if (value < 10) return '#10b981'; // green - excellent
      if (value < 50) return '#3b82f6'; // blue - good
      if (value < 100) return '#f59e0b'; // yellow - fair
      return '#ef4444'; // red - poor
    }
    
    if (type === 'memory') {
      if (value < 10) return '#10b981'; // green - excellent
      if (value < 20) return '#3b82f6'; // blue - good
      if (value < 50) return '#f59e0b'; // yellow - fair
      return '#ef4444'; // red - poor
    }
    
    if (type === 'components') {
      if (value === 1) return '#10b981'; // green - excellent (canvas)
      if (value < 10) return '#3b82f6'; // blue - good
      if (value < 50) return '#f59e0b'; // yellow - fair
      return '#ef4444'; // red - poor
    }
    
    return '#6b7280';
  };

  const getPerformanceLabel = (value: number, type: 'time' | 'memory' | 'components') => {
    if (type === 'time') {
      if (value < 10) return 'Excellent';
      if (value < 50) return 'Good';
      if (value < 100) return 'Fair';
      return 'Poor';
    }
    
    if (type === 'memory') {
      if (value < 10) return 'Excellent';
      if (value < 20) return 'Good';
      if (value < 50) return 'Fair';
      return 'Poor';
    }
    
    if (type === 'components') {
      if (value === 1) return 'Optimal';
      if (value < 10) return 'Good';
      if (value < 50) return 'Fair';
      return 'Poor';
    }
    
    return 'Unknown';
  };

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(10px)',
      borderRadius: '12px',
      padding: '16px',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      minWidth: '200px',
      zIndex: 1000
    }}>
      <h3 style={{
        margin: '0 0 12px 0',
        fontSize: '14px',
        fontWeight: '600',
        color: '#374151'
      }}>
        📊 Performance Metrics
      </h3>
      
      <div style={{ marginBottom: '8px' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '4px'
        }}>
          <span style={{ fontSize: '12px', color: '#6b7280' }}>Render Time:</span>
          <span style={{
            fontSize: '12px',
            fontWeight: '600',
            color: getPerformanceColor(metrics.renderTime, 'time')
          }}>
            {metrics.renderTime}ms
          </span>
        </div>
        <div style={{
          fontSize: '10px',
          color: getPerformanceColor(metrics.renderTime, 'time'),
          fontStyle: 'italic'
        }}>
          {getPerformanceLabel(metrics.renderTime, 'time')}
        </div>
      </div>

      <div style={{ marginBottom: '8px' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '4px'
        }}>
          <span style={{ fontSize: '12px', color: '#6b7280' }}>Memory Usage:</span>
          <span style={{
            fontSize: '12px',
            fontWeight: '600',
            color: getPerformanceColor(metrics.memoryUsage, 'memory')
          }}>
            {metrics.memoryUsage}MB
          </span>
        </div>
        <div style={{
          fontSize: '10px',
          color: getPerformanceColor(metrics.memoryUsage, 'memory'),
          fontStyle: 'italic'
        }}>
          {getPerformanceLabel(metrics.memoryUsage, 'memory')}
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
            color: getPerformanceColor(metrics.componentCount, 'components')
          }}>
            {metrics.componentCount}
          </span>
        </div>
        <div style={{
          fontSize: '10px',
          color: getPerformanceColor(metrics.componentCount, 'components'),
          fontStyle: 'italic'
        }}>
          {getPerformanceLabel(metrics.componentCount, 'components')}
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
          {boardType === 'canvas' ? '🎯 Canvas Rendering' :
           boardType === 'optimized' ? '⚡ Optimized React' : '🎨 Standard React'}
        </div>
        <div style={{
          fontSize: '10px',
          color: boardType === 'canvas' ? '#0c4a6e' : 
                 boardType === 'optimized' ? '#14532d' : '#92400e'
        }}>
          {boardType === 'canvas' ? 'Maximum performance with Canvas API' :
           boardType === 'optimized' ? 'Memoized components with CSS positioning' : 
           'Standard React components with re-renders'}
        </div>
      </div>
    </div>
  );
};

export default PerformanceComparison;
