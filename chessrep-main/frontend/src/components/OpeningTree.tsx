import React from 'react';

interface OpeningTreeProps {
  className?: string;
}

const OpeningTree: React.FC<OpeningTreeProps> = ({ className = '' }) => {
  return (
    <div className={`opening-tree ${className}`}>
      <h3>Opening Tree</h3>
      <p>This is a placeholder component for opening tree visualization.</p>
    </div>
  );
};

export default OpeningTree;