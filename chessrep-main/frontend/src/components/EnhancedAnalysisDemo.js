import React from 'react';
import VerticalAnnotationSystem from './VerticalAnnotationSystem';

const EnhancedAnalysisDemo = () => {
  return (
    <div className="enhanced-analysis-demo">
      <div className="demo-header">
        <h1>Enhanced Analysis Demo</h1>
        <p>Testing the new Vertical Annotation System</p>
      </div>
      
      <VerticalAnnotationSystem />
      
      <style jsx>{`
        .enhanced-analysis-demo {
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 20px 0;
        }

        .demo-header {
          text-align: center;
          color: white;
          margin-bottom: 30px;
        }

        .demo-header h1 {
          margin: 0 0 10px 0;
          font-size: 2.5rem;
          font-weight: 300;
        }

        .demo-header p {
          margin: 0;
          font-size: 1.2rem;
          opacity: 0.9;
        }
      `}</style>
    </div>
  );
};

export default EnhancedAnalysisDemo;
