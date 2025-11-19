import React from 'react';
// Crown removed per request; logo now uses colored squares only

type ChessStriveLogoProps = {
  className?: string;
  size?: number;
  showText?: boolean;
};

const ChessStriveLogo: React.FC<ChessStriveLogoProps> = ({
  className = '',
  size = 40,
  showText = true
}) => {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          {/* Colors tuned to match header (blues/slates on dark bg) */}
          <rect x="10" y="10" width="35" height="35" rx="4" fill="#3B82F6" /> {/* blue-500 */}
          <rect x="55" y="10" width="35" height="35" rx="4" fill="#334155" /> {/* slate-700 */}
          <rect x="10" y="55" width="35" height="35" rx="4" fill="#334155" /> {/* slate-700 */}
          <rect x="55" y="55" width="35" height="35" rx="4" fill="#2563EB" /> {/* blue-600 */}
        </svg>
      </div>
      {showText && (
        <div className="flex flex-col">
          <span className="text-xl font-bold text-white leading-none">Chess Strive</span>
          <span className="text-xs text-gray-300 leading-none mt-0.5">Strive. Improve. Win</span>
        </div>
      )}
    </div>
  );
};

export default ChessStriveLogo;


