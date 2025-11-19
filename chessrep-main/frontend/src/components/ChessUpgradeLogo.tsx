import React from 'react';
import { Crown, TrendingUp } from 'lucide-react';

const ChessUpgradeLogo = ({ 
  size = 'default',
  variant = 'full',
  className = ''
}: {
  size?: 'small' | 'default' | 'large';
  variant?: 'full' | 'icon' | 'text';
  className?: string;
}) => {
  const sizeClasses = {
    small: 'h-8',
    default: 'h-12',
    large: 'h-16'
  };

  const iconSizes = {
    small: 20,
    default: 28,
    large: 36
  };

  const textSizes = {
    small: 'text-lg',
    default: 'text-2xl',
    large: 'text-4xl'
  };

  if (variant === 'icon') {
    return (
      <div className={`relative inline-flex items-center justify-center ${className}`}>
        <div className={`relative ${sizeClasses[size]}`}>
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-blue-500/5 rounded-lg blur-sm" />
          <div className="relative bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-2 shadow-lg">
            <Crown className="text-white" size={iconSizes[size]} strokeWidth={2.5} />
            <div className="absolute -top-1 -right-1 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full p-0.5">
              <TrendingUp className="text-white" size={iconSizes[size] * 0.4} strokeWidth={3} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'text') {
    return (
      <div className={`inline-flex items-center gap-2 ${className}`}>
        <span className={`font-bold bg-gradient-to-r from-blue-500 to-blue-600 bg-clip-text text-transparent ${textSizes[size]}`}>
          Chess
        </span>
        <span className={`font-bold bg-gradient-to-r from-amber-500 to-amber-600 bg-clip-text text-transparent ${textSizes[size]}`}>
          Strive
        </span>
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-blue-500/5 rounded-lg blur-sm" />
        <div className="relative bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-2 shadow-lg">
          <Crown className="text-white" size={iconSizes[size]} strokeWidth={2.5} />
          <div className="absolute -top-1 -right-1 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full p-0.5">
            <TrendingUp className="text-white" size={iconSizes[size] * 0.4} strokeWidth={3} />
          </div>
        </div>
      </div>
      <div className="flex flex-col">
        <div className="flex items-center gap-1.5">
          <span className={`font-bold bg-gradient-to-r from-blue-500 to-blue-600 bg-clip-text text-transparent ${textSizes[size]}`}>
            Chess
          </span>
          <span className={`font-bold bg-gradient-to-r from-amber-500 to-amber-600 bg-clip-text text-transparent ${textSizes[size]}`}>
            Strive
          </span>
        </div>
        {size !== 'small' && (
          <span className="text-xs text-gray-400 font-medium tracking-wide">
            Strive. Improve. Win.
          </span>
        )}
      </div>
    </div>
  );
};

export default ChessUpgradeLogo;
