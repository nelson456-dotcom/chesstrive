import React, { useMemo } from 'react';

// Reusable button to open the current position in the Live Analysis page
// Props:
// - fen: string (required)
// - color: 'white' | 'black' (optional, board orientation)
// - theme: string (optional)
// - pieceSet: string (optional)
// - bg: 'light' | 'dark' | 'system' (optional)
// - label: string (optional)
// - className: string (optional)
// - newTab: boolean (default true)
const OpenInLiveAnalysisButton = ({
  fen,
  color,
  theme,
  pieceSet,
  bg,
  label = 'Open in Live Analysis',
  className = '',
  newTab = true,
  onClick,
}) => {
  const href = useMemo(() => {
    const params = new URLSearchParams();
    if (fen) params.set('fen', fen.replace(/ /g, '_'));
    if (color) params.set('color', color);
    if (theme) params.set('theme', theme);
    if (pieceSet) params.set('pieceSet', pieceSet);
    if (bg) params.set('bg', bg);
    const search = params.toString();
    return `/chess-annotation-advanced${search ? `?${search}` : ''}`;
  }, [fen, color, theme, pieceSet, bg]);

  const handleClick = (e) => {
    e.preventDefault();
    
    // Debug logging
    console.log('🔍 OpenInLiveAnalysisButton: FEN being passed:', fen);
    console.log('🔍 OpenInLiveAnalysisButton: Color:', color);
    console.log('🔍 OpenInLiveAnalysisButton: Generated URL:', href);
    
    // Call custom onClick if provided
    if (onClick) {
      onClick();
    }
    
    if (newTab) {
      window.open(href, '_blank');
    } else {
      window.location.href = href;
    }
  };

  return (
    <a
      href={href}
      onClick={handleClick}
      className={`inline-flex items-center justify-center rounded-lg bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 shadow ${className}`}
      title="Open this position in the Live Analysis tool"
    >
      <span className="mr-2">🔎</span>
      {label}
    </a>
  );
};

export default OpenInLiveAnalysisButton;
