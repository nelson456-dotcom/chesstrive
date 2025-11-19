import React from 'react';

import { Crown, Zap } from 'lucide-react';

interface ChessTriveLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'icon-only' | 'text-only';
  className?: string;
}

const ChessTriveLogoComponent: React.FC<ChessTriveLogoProps> = ({
  size = 'md',
  variant = 'default',
  className = '',
}) => {
  const sizeClasses = {
    sm: {
      container: 'h-8',
      icon: 'w-6 h-6',
      text: 'text-xl',
      subtext: 'text-[10px]',
    },
    md: {
      container: 'h-12',
      icon: 'w-9 h-9',
      text: 'text-3xl',
      subtext: 'text-xs',
    },
    lg: {
      container: 'h-16',
      icon: 'w-12 h-12',
      text: 'text-4xl',
      subtext: 'text-sm',
    },
    xl: {
      container: 'h-24',
      icon: 'w-16 h-16',
      text: 'text-6xl',
      subtext: 'text-base',
    },
  };

  const currentSize = sizeClasses[size];

  const IconPart = () => (
    <div className="relative flex items-center justify-center">
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-blue-500/5 rounded-lg blur-sm" />
        <div className="relative bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-1.5 shadow-lg">
          <Crown className={`${currentSize.icon} text-white`} strokeWidth={2.5} />
        </div>
      </div>
      <div className="absolute -bottom-1 -right-1">
        <div className="bg-gradient-to-br from-amber-400 to-amber-600 rounded-full p-0.5 shadow-md">
          <Zap className={`${size === 'sm' ? 'w-3 h-3' : size === 'md' ? 'w-4 h-4' : size === 'lg' ? 'w-5 h-5' : 'w-6 h-6'} text-white fill-white`} />
        </div>
      </div>
    </div>
  );

  const TextPart = () => (
    <div className="flex flex-col justify-center">
      <div className="flex items-baseline">
        <span className={`${currentSize.text} font-bold bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent`}>
          Chess
        </span>
        <span className={`${currentSize.text} font-bold bg-gradient-to-r from-blue-500 to-blue-600 bg-clip-text text-transparent`}>
          Trive
        </span>
      </div>
      <span className={`${currentSize.subtext} text-gray-400 font-medium tracking-wider uppercase -mt-1`}>
        Master Your Game
      </span>
    </div>
  );

  if (variant === 'icon-only') {
    return (
      <div className={`inline-flex items-center ${currentSize.container} ${className}`}>
        <IconPart />
      </div>
    );
  }

  if (variant === 'text-only') {
    return (
      <div className={`inline-flex items-center ${currentSize.container} ${className}`}>
        <TextPart />
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-3 ${currentSize.container} ${className}`}>
      <IconPart />
      <TextPart />
    </div>
  );
};

const ChessTriveLogoShowcase: React.FC = () => {
  return (
    <div className="min-h-screen w-full bg-gray-900 p-8">
      <div className="max-w-6xl mx-auto space-y-12">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-white">ChessTrive Logo</h1>
          <p className="text-gray-400">Various sizes and variants</p>
        </div>
        <div className="space-y-8">
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-8 space-y-6">
            <h2 className="text-2xl font-semibold text-white">Default Variant</h2>
            <div className="flex flex-wrap items-center gap-8">
              <div className="space-y-2">
                <p className="text-sm text-gray-400">Small</p>
                <ChessTriveLogoComponent size="sm" />
              </div>
              <div className="space-y-2">
                <p className="text-sm text-gray-400">Medium</p>
                <ChessTriveLogoComponent size="md" />
              </div>
              <div className="space-y-2">
                <p className="text-sm text-gray-400">Large</p>
                <ChessTriveLogoComponent size="lg" />
              </div>
              <div className="space-y-2">
                <p className="text-sm text-gray-400">Extra Large</p>
                <ChessTriveLogoComponent size="xl" />
              </div>
            </div>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-8 space-y-6">
            <h2 className="text-2xl font-semibold text-white">Icon Only</h2>
            <div className="flex flex-wrap items-center gap-8">
              <ChessTriveLogoComponent size="sm" variant="icon-only" />
              <ChessTriveLogoComponent size="md" variant="icon-only" />
              <ChessTriveLogoComponent size="lg" variant="icon-only" />
              <ChessTriveLogoComponent size="xl" variant="icon-only" />
            </div>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-8 space-y-6">
            <h2 className="text-2xl font-semibold text-white">Text Only</h2>
            <div className="flex flex-col gap-6">
              <ChessTriveLogoComponent size="sm" variant="text-only" />
              <ChessTriveLogoComponent size="md" variant="text-only" />
              <ChessTriveLogoComponent size="lg" variant="text-only" />
              <ChessTriveLogoComponent size="xl" variant="text-only" />
            </div>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-8 space-y-6">
            <h2 className="text-2xl font-semibold text-white">On Different Backgrounds</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-900 p-6 rounded-lg border border-gray-700 flex items-center justify-center">
                <ChessTriveLogoComponent size="lg" />
              </div>
              <div className="bg-gray-700 p-6 rounded-lg flex items-center justify-center">
                <ChessTriveLogoComponent size="lg" />
              </div>
              <div className="bg-blue-500/10 p-6 rounded-lg flex items-center justify-center">
                <ChessTriveLogoComponent size="lg" />
              </div>
              <div className="bg-gradient-to-br from-blue-500/20 to-blue-500/5 p-6 rounded-lg flex items-center justify-center">
                <ChessTriveLogoComponent size="lg" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChessTriveLogoShowcase;

