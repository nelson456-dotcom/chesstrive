import React from 'react';

import { Crown } from 'lucide-react';

interface ChessStriveLogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
}

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
          <rect
            x="10"
            y="10"
            width="35"
            height="35"
            className="fill-blue-500"
            rx="4"
          />
          <rect
            x="55"
            y="10"
            width="35"
            height="35"
            className="fill-gray-700"
            rx="4"
          />
          <rect
            x="10"
            y="55"
            width="35"
            height="35"
            className="fill-gray-700"
            rx="4"
          />
          <rect
            x="55"
            y="55"
            width="35"
            height="35"
            className="fill-blue-500"
            rx="4"
          />
          <Crown
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white"
            size={size * 0.4}
            strokeWidth={2.5}
          />
        </svg>
      </div>
      {showText && (
        <div className="flex flex-col">
          <span className="text-xl font-bold text-white leading-none">
            ChessStrive
          </span>
          <span className="text-xs text-gray-400 leading-none mt-0.5">
            Master Your Game
          </span>
        </div>
      )}
    </div>
  );
};

export default ChessStriveLogo;

