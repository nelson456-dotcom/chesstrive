import React from 'react';

interface PerformanceDemoProps {
  className?: string;
}

const PerformanceDemo: React.FC<PerformanceDemoProps> = ({ className = '' }) => {
  return (
    <div className={`performance-demo ${className}`}>
      <h3>Performance Demo</h3>
      <p>This is a placeholder component for performance demonstration.</p>
    </div>
  );
};

export default PerformanceDemo;
