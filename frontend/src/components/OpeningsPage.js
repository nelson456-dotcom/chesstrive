import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, BookOpen, ChevronDown, ChevronRight, Gamepad2, Search } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { AuthModal } from './AuthModal';
import { Play } from 'lucide-react';
import ChessBoard from './ChessBoard';
import { Chess } from 'chess.js';
import { completeOpeningEncyclopedia } from '../data/completeOpeningEncyclopedia';

const OpeningsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState({});
  const [expandedOpenings, setExpandedOpenings] = useState({});
  const [practicingVariation, setPracticingVariation] = useState(null);
  const [currentMoveIndex, setCurrentMoveIndex] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredOpenings, setFilteredOpenings] = useState({});
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [analysisData, setAnalysisData] = useState(null);
  const [boardSize, setBoardSize] = useState(600);
  const boardContainerRef = useRef(null);
  const previousBoardSizeRef = useRef(600);
  const [isMobileSliderActive, setIsMobileSliderActive] = useState(false);
  const [mobileBoardSizeBounds, setMobileBoardSizeBounds] = useState({ min: 180, max: 260 });
  const [isMobileViewport, setIsMobileViewport] = useState(false);

  // Complete Chess Openings Encyclopedia - 30 openings with 90 variations total
  const openingEncyclopedia = completeOpeningEncyclopedia;

  // Search functionality
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredOpenings(openingEncyclopedia);
    } else {
      const filtered = {};
      Object.keys(openingEncyclopedia).forEach(openingName => {
        const opening = openingEncyclopedia[openingName];
        const searchLower = searchTerm.toLowerCase();
        
        // Check if opening name or description matches
        if (openingName.toLowerCase().includes(searchLower) || 
            opening.description.toLowerCase().includes(searchLower)) {
          filtered[openingName] = opening;
        } else {
          // Check variations
          const filteredVariations = {};
          Object.keys(opening.variations).forEach(variationName => {
            if (variationName.toLowerCase().includes(searchLower)) {
              filteredVariations[variationName] = opening.variations[variationName];
            }
          });
          
          if (Object.keys(filteredVariations).length > 0) {
            filtered[openingName] = {
              ...opening,
              variations: filteredVariations
            };
          }
        }
      });
      setFilteredOpenings(filtered);
    }
  }, [searchTerm]);

  // Initialize filtered openings
  useEffect(() => {
    setFilteredOpenings(openingEncyclopedia);
  }, []);

  // Track mobile viewport status
  useEffect(() => {
    const checkMobile = () => {
      setIsMobileViewport(typeof window !== 'undefined' && window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Responsive board sizing - Desktop and tablet use window width, mobile uses container width
  useEffect(() => {
    const updateBoardSize = () => {
      if (typeof window !== 'undefined') {
        const width = window.innerWidth;
        if (width < 768) {
          // Mobile: Board size will be set by container width measurement (see useEffect below)
          // Initial estimate for SSR/hydration
          setBoardSize(Math.min(width - 40, 260));
        } else if (width < 1024) {
          // Tablet: medium size based on window width
          setBoardSize(Math.min(width - 200, 450));
        } else {
          // Desktop: full size
          setBoardSize(600);
        }
      }
    };

    // Only update on window resize for desktop/tablet
    // Mobile board size is handled by container width measurement
    const handleResize = () => {
      if (typeof window !== 'undefined' && window.innerWidth >= 768) {
        updateBoardSize();
      }
    };

    updateBoardSize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Responsive board sizing for mobile - Calculate bounds and set initial size only if slider not active
  useEffect(() => {
    if (!practicingVariation || !boardContainerRef.current) {
      return;
    }

    const container = boardContainerRef.current;
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

    if (!isMobile) {
      setIsMobileSliderActive(false);
      return;
    }

    const updateBoardSizeBounds = (width = null) => {
      if (!container) return;

      // Get the actual rendered width of the container
      const containerWidth = width !== null 
        ? width 
        : container.getBoundingClientRect().width;
      
      if (containerWidth > 0) {
        // Account for padding/margins
        const paddingBuffer = 8; // 4px on each side
        const availableWidth = containerWidth - paddingBuffer;
        
        // Calculate min and max board sizes
        const minSize = Math.max(180, Math.round(availableWidth * 0.5)); // At least 180px, or 50% of available width
        const maxSize = Math.min(360, Math.round(availableWidth * 0.95)); // Up to 360px or 95% of available width
        
        setMobileBoardSizeBounds({ min: minSize, max: maxSize });
        
        // Only set initial board size if slider hasn't been used yet
        if (!isMobileSliderActive) {
          // Default to a medium size (70% of available width, clamped between min and max)
          const defaultSize = Math.round(Math.max(minSize, Math.min(maxSize, availableWidth * 0.7)));
          
          if (defaultSize > 0 && defaultSize !== previousBoardSizeRef.current) {
            previousBoardSizeRef.current = defaultSize;
            setBoardSize(defaultSize);
          }
        } else {
          // If slider is active, just clamp the current board size to new bounds
          setBoardSize(prev => Math.max(minSize, Math.min(maxSize, prev)));
        }
      }
    };

    // Initial measurement
    let initialTimeout = setTimeout(() => {
      updateBoardSizeBounds();
      setTimeout(() => {
        updateBoardSizeBounds();
      }, 50);
    }, 100);

    // Use ResizeObserver to track container width changes
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const width = entry.contentRect.width;
        if (width > 0) {
          requestAnimationFrame(() => {
            updateBoardSizeBounds(width);
          });
        }
      }
    });

    resizeObserver.observe(container);

    // Listen to window resize and orientation change
    const handleResize = () => {
      if (typeof window !== 'undefined' && window.innerWidth < 768) {
        requestAnimationFrame(() => {
          setTimeout(() => {
            updateBoardSizeBounds();
          }, 50);
        });
      }
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      clearTimeout(initialTimeout);
      resizeObserver.disconnect();
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, [practicingVariation, isMobileSliderActive]);

  const toggleCategory = (category) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const toggleOpening = (openingName) => {
    setExpandedOpenings(prev => ({
      ...prev,
      [openingName]: !prev[openingName]
    }));
  };

  const startPracticing = (openingName, variationName) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    const opening = openingEncyclopedia[openingName];
    const variation = opening.variations[variationName];
    
    if (variation) {
      const isBlack = openingName.includes("(for Black)");
      setIsMobileSliderActive(false); // Reset slider state when starting new practice
      setPracticingVariation({
        ...variation,
        openingName,
        variationName,
        isBlack
      });
      setCurrentMoveIndex(0);
    }
  };

  const closePractice = () => {
    setPracticingVariation(null);
    setCurrentMoveIndex(0);
    setIsMobileSliderActive(false); // Reset slider state when closing
  };

  // Handler for mobile board size slider
  const handleMobileBoardSizeChange = (event) => {
    const newSize = parseInt(event.target.value, 10);
    setBoardSize(newSize);
    setIsMobileSliderActive(true); // Mark that user has manually adjusted
  };

  // Memoize moves and explanations to prevent unnecessary re-renders
  const memoizedMoves = useMemo(() => {
    return practicingVariation?.moves || [];
  }, [practicingVariation?.moves]);

  const memoizedExplanations = useMemo(() => {
    return practicingVariation?.explanations || [];
  }, [practicingVariation?.explanations]);

  const handleMoveChange = (moveIndex) => {
    console.log('handleMoveChange called with moveIndex:', moveIndex);
    setCurrentMoveIndex(moveIndex);
  };

  // Navigation functions
  const goToNextMove = () => {
    if (practicingVariation && currentMoveIndex < practicingVariation.moves.length) {
      const newIndex = currentMoveIndex + 1;
      console.log('Going to next move:', newIndex);
      setCurrentMoveIndex(newIndex);
    }
  };

  const goToPreviousMove = () => {
    if (currentMoveIndex > 0) {
      const newIndex = currentMoveIndex - 1;
      console.log('Going to previous move:', newIndex);
      setCurrentMoveIndex(newIndex);
    }
  };

  const goToMove = (moveIndex) => {
    if (practicingVariation && moveIndex >= 0 && moveIndex <= practicingVariation.moves.length) {
      console.log('Going to move index:', moveIndex);
      setCurrentMoveIndex(moveIndex);
    }
  };

  const analyzePosition = async () => {
    if (!practicingVariation) return;
    
    try {
      // Get current position from the chess game
      const game = new Chess();
      for (let i = 0; i < currentMoveIndex && i < practicingVariation.moves.length; i++) {
        game.move(practicingVariation.moves[i]);
      }
      
      // Get the current FEN position
      const currentFen = game.fen();
      
      // Generate full PGN of the opening variation
      const fullGame = new Chess();
      
      // Play all moves to generate PGN
      for (let i = 0; i < practicingVariation.moves.length; i++) {
        try {
          fullGame.move(practicingVariation.moves[i]);
        } catch (e) {
          console.error('Error playing move for PGN:', practicingVariation.moves[i], e);
        }
      }
      
      // Get PGN from Chess.js (it formats it correctly)
      const pgnString = fullGame.pgn();
      
      // Navigate to analysis page with FEN and PGN
      const encodedFen = encodeURIComponent(currentFen);
      const encodedPgn = encodeURIComponent(pgnString);
      
      navigate(`/analysis?fen=${encodedFen}&pgn=${encodedPgn}&moveIndex=${currentMoveIndex}`);
    } catch (error) {
      console.error('Analysis error:', error);
      // Still navigate to analysis page even if there's an error
      navigate('/analysis');
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (event) => {
      if (!practicingVariation) return;
      
      switch (event.key) {
        case 'ArrowRight':
          event.preventDefault();
          goToNextMove();
          break;
        case 'ArrowLeft':
          event.preventDefault();
          goToPreviousMove();
          break;
        case ' ':
          event.preventDefault();
          goToNextMove();
          break;
        case 'Escape':
          event.preventDefault();
          closePractice();
          break;
      }
    };

    if (practicingVariation) {
      window.addEventListener('keydown', handleKeyPress);
      return () => window.removeEventListener('keydown', handleKeyPress);
    }
  }, [practicingVariation, currentMoveIndex]);

    return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      {/* Hide ChessBoard navigation controls and explanation in mobile modal - Show only the board itself */}
      <style>{`
        @media (max-width: 1023px) {
          /* Hide all div children of ChessBoard wrapper except the first one (which contains the board) */
          .practice-modal-board-wrapper > div > div:nth-child(n+2) {
            display: none !important;
          }
          /* Remove all spacing from ChessBoard wrapper - reset space-y-4 */
          .practice-modal-board-wrapper > div[class*="space-y"] > * {
            margin-top: 0 !important;
          }
          .practice-modal-board-wrapper > div {
            gap: 0 !important;
            row-gap: 0 !important;
          }
          /* Ensure board container (first div) has no extra spacing and doesn't stretch */
          .practice-modal-board-wrapper > div > div:first-child {
            margin: 0 !important;
            width: 100% !important;
            height: auto !important;
            flex-shrink: 0 !important;
          }
          /* Ensure board wrapper itself doesn't stretch */
          .practice-modal-board-wrapper {
            flex-shrink: 0 !important;
            flex-grow: 0 !important;
            align-self: center !important;
          }
        }
        
        /* Slider thumb styling for mobile board size control */
        .slider-thumb::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: 2px solid #ffffff;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
          transition: all 0.2s ease;
        }
        
        .slider-thumb::-webkit-slider-thumb:hover {
          background: #2563eb;
          transform: scale(1.1);
        }
        
        .slider-thumb::-webkit-slider-thumb:active {
          transform: scale(1.15);
        }
        
        .slider-thumb::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: 2px solid #ffffff;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
          transition: all 0.2s ease;
        }
        
        .slider-thumb::-moz-range-thumb:hover {
          background: #2563eb;
          transform: scale(1.1);
        }
        
        .slider-thumb::-moz-range-thumb:active {
          transform: scale(1.15);
        }
      `}</style>
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
          <button
                onClick={() => navigate('/training-room')}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
              <div className="flex items-center space-x-2">
                <BookOpen className="w-6 h-6 text-blue-400" />
                <h1 className="text-xl sm:text-2xl font-bold">Chess Openings Encyclopedia</h1>
              </div>
            </div>
            <div className="text-sm text-gray-400">
              30 Openings • 90 Variations
            </div>
          </div>
        </div>
          </div>

      {/* Search Bar */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search openings, variations, or descriptions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400"
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {Object.keys(filteredOpenings).length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-400 mb-2">No openings found</h3>
            <p className="text-gray-500">Try adjusting your search terms</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(filteredOpenings).map(([openingName, opening]) => (
              <div key={openingName} className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
                {/* Opening Header */}
                <div 
                  className="p-4 sm:p-6 cursor-pointer hover:bg-gray-750 transition-colors"
                  onClick={() => toggleOpening(openingName)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">
                        {openingName}
                      </h3>
                      <p className="text-gray-400 text-sm sm:text-base">
                        {opening.description}
                      </p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className="text-sm text-gray-500">
                        {Object.keys(opening.variations).length} variations
                      </span>
                      {expandedOpenings[openingName] ? (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
        </div>
      </div>

                {/* Variations */}
                {expandedOpenings[openingName] && (
                  <div className="border-t border-gray-700">
                    {Object.entries(opening.variations).map(([variationName, variation]) => (
                      <div key={variationName} className="p-4 sm:p-6 border-b border-gray-700 last:border-b-0">
                <div className="flex items-center justify-between mb-4">
                          <h4 className="text-base sm:text-lg font-semibold text-white">
                            {variationName}
                          </h4>
          <button
                            onClick={() => startPracticing(openingName, variationName)}
                            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
          >
                    <Play className="w-4 h-4" />
                            <span>Practice</span>
          </button>
                </div>
                        
                        {/* Move List Preview */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <h5 className="text-sm font-medium text-gray-300">Moves</h5>
                            <div className="flex flex-wrap gap-1">
                              {variation.moves.slice(0, 10).map((move, index) => (
                                <span key={index} className="px-2 py-1 bg-gray-700 text-white text-xs rounded">
                                  {move}
                                </span>
                              ))}
                              {variation.moves.length > 10 && (
                                <span className="px-2 py-1 bg-gray-600 text-gray-400 text-xs rounded">
                                  +{variation.moves.length - 10} more
                                </span>
                              )}
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <h5 className="text-sm font-medium text-gray-300">Explanations</h5>
                            <div className="space-y-1">
                              {variation.explanations.slice(0, 3).map((explanation, index) => (
                                <p key={index} className="text-xs text-gray-400 line-clamp-2">
                                  {explanation}
                                </p>
                              ))}
                              {variation.explanations.length > 3 && (
                                <p className="text-xs text-gray-500">
                                  +{variation.explanations.length - 3} more explanations
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        </div>

      {/* Practice Modal - Fixed layout for mobile */}
      {practicingVariation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start sm:items-center justify-center p-0 sm:p-4 z-50">
          {/* Inner container - handles overflow on mobile, constrained on desktop */}
          <div className="bg-gray-800 rounded-none sm:rounded-lg border-0 sm:border border-gray-700 w-full h-full sm:h-auto sm:max-w-6xl sm:max-h-[90vh] flex flex-col overflow-y-auto sm:my-auto">
            {/* Modal Header - Compact on Mobile */}
            <div className="p-3 sm:p-4 lg:p-6 border-b border-gray-700 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="text-base sm:text-lg lg:text-xl font-semibold text-white truncate">
                    {practicingVariation.openingName} - {practicingVariation.variationName}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-400 mt-0.5 sm:mt-1 hidden sm:block">
                    Practice this opening variation
                  </p>
                </div>
                <button
                  onClick={closePractice}
                  className="p-2 hover:bg-gray-700 rounded-lg transition-colors text-gray-400 hover:text-white flex-shrink-0 ml-2"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Practice Content - Simplified on mobile, let parent handle overflow */}
            <div className="p-4 sm:p-6 flex flex-col gap-4">
              {/* Desktop: Side-by-side layout */}
              <div className="hidden lg:flex flex-row gap-6">
                {/* Desktop: Board on left */}
                <div className="flex-1 flex justify-center">
                  <ChessBoard 
                    moves={memoizedMoves}
                    explanations={memoizedExplanations}
                    orientation={practicingVariation.isBlack ? "black" : "white"}
                    onMoveChange={handleMoveChange}
                    currentMoveIndex={currentMoveIndex}
                    allowUserMoves={true}
                    boardSize={boardSize}
                  />
                </div>
                
                {/* Desktop: Moves on right */}
                <div className="flex-1 flex flex-col">
                  <h4 className="text-xl font-semibold text-white mb-4">Move Sequence:</h4>
                  <div className="bg-gray-700 rounded-lg p-4 max-h-80 overflow-y-auto">
                    <div className="space-y-2 text-base">
                      {practicingVariation.moves.map((move, index) => {
                        const moveNumber = Math.floor(index / 2) + 1;
                        const isWhiteMove = index % 2 === 0;
                        const isCurrentMove = index === (currentMoveIndex - 1);
                        const isCurrentBlackMove = (index + 1) === (currentMoveIndex - 1);
                        
                        if (isWhiteMove) {
                          return (
                            <div key={index} className="flex items-start space-x-3 border-b border-gray-600 pb-2">
                              <span className="text-gray-400 w-10 flex-shrink-0 font-semibold text-base">
                                {moveNumber}.
                              </span>
                              <div className="flex-1">
                                <div className="flex items-center space-x-3">
                                  <button
                                    onClick={() => goToMove(index)}
                                    className={`font-mono px-3 py-2 rounded text-base cursor-pointer transition-colors ${
                                      isCurrentMove 
                                        ? 'bg-green-600 text-white' 
                                        : 'text-white hover:bg-gray-600'
                                    }`}
                                  >
                                    {move}
                                  </button>
                                  {practicingVariation.moves[index + 1] && (
                                    <button
                                      onClick={() => goToMove(index + 1)}
                                      className={`font-mono px-3 py-2 rounded text-base cursor-pointer transition-colors ${
                                        isCurrentBlackMove 
                                          ? 'bg-green-600 text-white' 
                                          : 'text-white hover:bg-gray-600'
                                      }`}
                                    >
                                      {practicingVariation.moves[index + 1]}
                                    </button>
                                  )}
                                </div>
                                {practicingVariation.explanations[Math.floor(index / 2)] && (
                                  <div className="text-sm text-gray-400 mt-2 ml-0">
                                    {practicingVariation.explanations[Math.floor(index / 2)]}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        }
                        return null;
                      })}
                    </div>
                  </div>
                  
                  <div className="flex justify-center mt-4">
                    <button
                      onClick={analyzePosition}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                      🔍 Analyze Position
                    </button>
                  </div>
                  
                  <div className="text-xs text-gray-500 text-center mt-2">
                    Use the navigation buttons above or ← → arrow keys to navigate • ESC to close
                  </div>
                </div>
              </div>

              {/* Mobile: Three sections in vertical stack - Notation → Board → Controls */}
              <div className="lg:hidden flex flex-col gap-4">
                {/* 1. NOTATION BLOCK - Top section, natural height */}
                <div>
                  <h4 className="text-base font-semibold text-white mb-3 text-center">Move Sequence</h4>
                  <div className="bg-gray-700 rounded-lg p-3 max-h-36 overflow-y-auto border border-gray-600">
                    <div className="flex flex-wrap gap-2 text-sm">
                      {practicingVariation.moves.map((move, index) => {
                        const moveNumber = Math.floor(index / 2) + 1;
                        const isWhiteMove = index % 2 === 0;
                        const isCurrentMove = index === (currentMoveIndex - 1);
                        const isCurrentBlackMove = (index + 1) === (currentMoveIndex - 1);
                        
                        if (isWhiteMove) {
                          return (
                            <div key={index} className="flex items-center gap-1.5">
                              <span className="text-gray-400 font-semibold text-xs w-6 flex-shrink-0">
                                {moveNumber}.
                              </span>
                              <button
                                onClick={() => goToMove(index)}
                                className={`font-mono px-2 py-1 rounded text-xs cursor-pointer transition-colors ${
                                  isCurrentMove 
                                    ? 'bg-green-600 text-white' 
                                    : 'bg-gray-600 text-white hover:bg-gray-500'
                                }`}
                              >
                                {move}
                              </button>
                              {practicingVariation.moves[index + 1] && (
                                <button
                                  onClick={() => goToMove(index + 1)}
                                  className={`font-mono px-2 py-1 rounded text-xs cursor-pointer transition-colors ${
                                    isCurrentBlackMove 
                                      ? 'bg-green-600 text-white' 
                                      : 'bg-gray-600 text-white hover:bg-gray-500'
                                  }`}
                                >
                                  {practicingVariation.moves[index + 1]}
                                </button>
                              )}
                            </div>
                          );
                        }
                        return null;
                      })}
                    </div>
                  </div>
                </div>

                {/* 2. BOARD BLOCK - Middle section, responsive to container width */}
                <div 
                  ref={boardContainerRef}
                  className="w-full flex justify-center" 
                  style={{ touchAction: 'manipulation' }}
                >
                  <div 
                    className="practice-modal-board-wrapper"
                    style={{ 
                      width: `${boardSize}px`,
                      maxWidth: '100%',
                      flexShrink: 0
                    }}
                  >
                    <ChessBoard 
                      moves={memoizedMoves}
                      explanations={[]}
                      orientation={practicingVariation.isBlack ? "black" : "white"}
                      onMoveChange={handleMoveChange}
                      currentMoveIndex={currentMoveIndex}
                      allowUserMoves={true}
                      boardSize={boardSize}
                    />
                  </div>
                </div>

                {/* 2.5. BOARD SIZE SLIDER - Mobile only (< 768px), between board and controls */}
                {isMobileViewport && (
                <div className="w-full px-2 py-3">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <span>Board Size</span>
                      <span className="font-medium text-white">{boardSize}px</span>
                    </div>
                    <input
                      type="range"
                      min={mobileBoardSizeBounds.min}
                      max={mobileBoardSizeBounds.max}
                      value={boardSize}
                      onChange={handleMobileBoardSizeChange}
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider-thumb"
                      style={{
                        background: (() => {
                          const range = mobileBoardSizeBounds.max - mobileBoardSizeBounds.min;
                          if (range === 0) return '#374151';
                          const percentage = ((boardSize - mobileBoardSizeBounds.min) / range) * 100;
                          return `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${percentage}%, #374151 ${percentage}%, #374151 100%)`;
                        })()
                      }}
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Small</span>
                      <span>Medium</span>
                      <span>Large</span>
                    </div>
                  </div>
                </div>
                )}

                {/* 3. NAVIGATION/CONTROLS BLOCK - Bottom section, natural height */}
                <div className="flex flex-col gap-3">
                  {/* Navigation buttons - Previous/Next */}
                  <div className="flex justify-center items-center gap-3">
                    <button
                      onClick={goToPreviousMove}
                      disabled={currentMoveIndex <= 0}
                      className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm flex items-center gap-2"
                    >
                      <span>◀</span>
                      <span>Previous</span>
                    </button>
                    <div className="bg-gray-700 text-white px-3 py-2 rounded-lg text-xs font-medium">
                      Move {currentMoveIndex} / {practicingVariation.moves.length}
                    </div>
                    <button
                      onClick={goToNextMove}
                      disabled={currentMoveIndex >= practicingVariation.moves.length}
                      className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm flex items-center gap-2"
                    >
                      <span>Next</span>
                      <span>▶</span>
                    </button>
                  </div>
                  
                  {/* Action buttons */}
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={analyzePosition}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm w-full"
                    >
                      🔍 Analyze Position
                    </button>
                    <button
                      onClick={closePractice}
                      className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm w-full"
                    >
                      Exit Practice
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Analysis Modal */}
      {showAnalysis && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg border border-gray-700 w-full max-w-2xl max-h-[90vh] overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg sm:text-xl font-semibold text-white">
                  Position Analysis
                </h3>
              <button
                  onClick={() => setShowAnalysis(false)}
                  className="p-2 hover:bg-gray-700 rounded-lg transition-colors text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            </div>
            
            <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {analysisData?.loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                  <p className="text-gray-400">Analyzing position...</p>
                </div>
              ) : analysisData?.error ? (
                <div className="text-center py-8">
                  <p className="text-red-400">{analysisData.error}</p>
                </div>
              ) : analysisData ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-700 p-4 rounded-lg">
                      <h4 className="text-white font-semibold mb-2">Evaluation</h4>
                      <p className="text-2xl font-bold text-green-400">{analysisData.evaluation}</p>
                    </div>
                    <div className="bg-gray-700 p-4 rounded-lg">
                      <h4 className="text-white font-semibold mb-2">Best Move</h4>
                      <p className="text-2xl font-bold text-blue-400">{analysisData.bestMove}</p>
                    </div>
                  </div>
                  
                  <div className="bg-gray-700 p-4 rounded-lg">
                    <h4 className="text-white font-semibold mb-2">Principal Variation</h4>
                    <p className="text-gray-300 font-mono">{analysisData.principalVariation.join(' ')}</p>
                  </div>
                  
                  <div className="bg-gray-700 p-4 rounded-lg">
                    <h4 className="text-white font-semibold mb-2">Depth</h4>
                    <p className="text-gray-300">{analysisData.depth} plies</p>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* Auth Modal */}
      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          onSuccess={() => setShowAuthModal(false)}
        />
      )}
    </div>
  );
};

export default OpeningsPage; 
