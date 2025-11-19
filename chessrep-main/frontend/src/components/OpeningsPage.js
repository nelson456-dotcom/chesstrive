import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, BookOpen, ChevronDown, ChevronRight, Gamepad2, Search } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { AuthModal } from './AuthModal';
import { Play } from 'lucide-react';
import ChessBoard from './ChessBoard';
import { Chess } from 'chess.js';
import { completeOpeningEncyclopedia } from '../data/completeOpeningEncyclopedia';
import OpenInLiveAnalysisButton from './OpenInLiveAnalysisButton';

const OpeningsPage = () => {
  const { user, refreshUser } = useAuth();
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
  const [practiceMessage, setPracticeMessage] = useState('');
  const [boardSize, setBoardSize] = useState(400); // Default middle size (between 200-600)

  // Complete Chess Openings Encyclopedia - 101 openings with 303 variations total
  const openingEncyclopedia = completeOpeningEncyclopedia;

  // Initialize filtered openings on mount
  useEffect(() => {
    console.log('OpeningsPage: openingEncyclopedia keys:', Object.keys(openingEncyclopedia));
    console.log('OpeningsPage: openingEncyclopedia:', openingEncyclopedia);
    setFilteredOpenings(openingEncyclopedia);
  }, [openingEncyclopedia]);

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

  const startPracticing = async (openingName, variationName) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    // Track opening practice - this will check and enforce limits
    const practiceResult = await trackOpeningPractice(openingName, variationName);
    
    // If practice tracking failed due to limit, don't proceed
    if (practiceResult === false) {
      return;
    }

    const opening = openingEncyclopedia[openingName];
    const variation = opening.variations[variationName];
    
    if (variation) {
      const isBlack = openingName.includes("(for Black)");
      setPracticingVariation({
        ...variation,
        openingName,
        variationName,
        isBlack,
        practiceTracked: true // Mark as tracked since we just tracked it
      });
      setCurrentMoveIndex(0);
    }
  };

  const closePractice = () => {
    setPracticingVariation(null);
    setCurrentMoveIndex(0);
    setBoardSize(400); // Reset to default when closing
  };

  // Function to track opening practice
  const trackOpeningPractice = async (openingName, variationName) => {
    try {
      const token = localStorage.getItem('token');
      console.log('🔑 Token check for openings practice:', { hasToken: !!token, tokenLength: token?.length });
      
      if (!token) {
        return false;
      }
      
      console.log('📚 Tracking opening practice:', { openingName, variationName });
      
      // Check and increment usage limit for free users FIRST
      if (user?.userType !== 'premium') {
        try {
          // First check the limit before incrementing
          const checkResponse = await fetch('http://localhost:3001/api/usage-limits/openings', {
            headers: { 'x-auth-token': token }
          });
          
          if (checkResponse.ok) {
            const limitData = await checkResponse.json();
            // Check if limit is reached (not allowed and remaining is 0)
            if (!limitData.allowed && limitData.remaining === 0) {
              // IMMEDIATELY navigate to pricing page - no confirmation needed
              setPracticeMessage('❌ You have reached your limit of 3 distinct openings. Redirecting to upgrade...');
              setTimeout(() => {
                navigate('/pricing');
              }, 1500);
              return false;
            }
          }
          
          // Then increment (backend will handle whether to actually increment or not)
          const incrementResponse = await fetch('http://localhost:3001/api/usage-limits/openings/increment', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-auth-token': token
            },
            body: JSON.stringify({ openingName, variationName })
          });
          
          if (incrementResponse.ok) {
            const incrementData = await incrementResponse.json();
            console.log('📊 Increment response:', incrementData);
            // Check if limit was reached for this new distinct opening
            if (incrementData.limitReached && !incrementData.alreadySeen) {
              // IMMEDIATELY navigate to pricing page - no confirmation needed
              setPracticeMessage('❌ You have reached your limit of 3 distinct openings. Redirecting to upgrade...');
              setTimeout(() => {
                navigate('/pricing');
              }, 1500);
              return false;
            }
            // If already seen, allow practice (they can practice different variations of the same opening)
            // If limit not reached, allow practice
            console.log('✅ Usage limit check passed, allowing practice');
          } else {
            // If increment failed, log error but don't block practice (might be a server issue)
            const errorText = await incrementResponse.text().catch(() => 'Unknown error');
            console.error('⚠️ Failed to increment usage limit:', incrementResponse.status, errorText);
            // Don't block practice if it's a server error - allow them to continue
            // Only block if it's a 403 (forbidden)
            if (incrementResponse.status === 403) {
              // IMMEDIATELY navigate to pricing page
              setPracticeMessage('❌ You have reached your limit of 3 distinct openings. Redirecting to upgrade...');
              setTimeout(() => {
                navigate('/pricing');
              }, 1500);
              return false;
            }
            // For other errors, continue anyway (allow practice)
            console.log('⚠️ Continuing with practice despite increment error');
          }
        } catch (error) {
          console.error('❌ Error checking/incrementing usage limit:', error);
          // Don't block practice on network errors - allow them to continue
          console.log('⚠️ Continuing with practice despite error');
        }
      }
      
      // Track the practice in the openings system
      const response = await fetch('http://localhost:3001/api/openings/practice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        body: JSON.stringify({
          openingName,
          variationName
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Opening practice tracked successfully:', result);
        console.log('📊 Openings practiced count:', result.openingsPracticed);
        
        // Show success message
        setPracticeMessage(`✅ Practice tracked! Total openings practiced: ${result.openingsPracticed}`);
        setTimeout(() => setPracticeMessage(''), 3000); // Hide message after 3 seconds
        
        // Refresh user data to update the profile
        try {
          if (refreshUser) {
            await refreshUser();
            console.log('🔄 User data refreshed after opening practice');
          }
        } catch (error) {
          console.error('❌ Error refreshing user data:', error);
        }
        
        return true;
      } else {
        // Handle 403 (limit reached) specifically
        if (response.status === 403) {
          try {
            const errorData = await response.json();
            // IMMEDIATELY navigate to pricing page - no confirmation needed
            setPracticeMessage('❌ ' + (errorData.message || 'You have reached your limit of 3 distinct openings. Redirecting to upgrade...'));
            setTimeout(() => {
              navigate('/pricing');
            }, 1500);
            return false;
          } catch (e) {
            // If JSON parsing fails, show generic error and navigate immediately
            setPracticeMessage('❌ You have reached your limit of 3 distinct openings. Redirecting to upgrade...');
            setTimeout(() => {
              navigate('/pricing');
            }, 1500);
            return false;
          }
        }
        
        const errorText = await response.text();
        console.error('❌ Failed to track opening practice:', response.status, errorText);
        console.error('❌ Response headers:', response.headers);
        setPracticeMessage(`❌ Failed to track practice (${response.status}): ${errorText}`);
        setTimeout(() => setPracticeMessage(''), 5000);
        return false;
      }
    } catch (error) {
      console.error('❌ Error tracking opening practice:', error);
      console.error('❌ Error details:', {
        message: error.message,
        name: error.name,
        stack: error.stack
      });
      setPracticeMessage(`❌ Network error: ${error.message}`);
      setTimeout(() => setPracticeMessage(''), 5000);
      return false;
    }
  };

  // Memoize moves and explanations to prevent unnecessary re-renders
  const memoizedMoves = useMemo(() => {
    return practicingVariation?.moves || [];
  }, [practicingVariation?.moves]);

  const memoizedExplanations = useMemo(() => {
    return practicingVariation?.explanations || [];
  }, [practicingVariation?.explanations]);

  // Current FEN of the practicing line at the selected move index
  const currentFen = useMemo(() => {
    if (!practicingVariation) return '';
    const game = new Chess();
    for (let i = 0; i < currentMoveIndex && i < memoizedMoves.length; i++) {
      try { game.move(memoizedMoves[i]); } catch {}
    }
    return game.fen();
  }, [practicingVariation, currentMoveIndex, memoizedMoves]);

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
      console.log('🎯 Opening Analysis - Practicing Variation:', practicingVariation);
      console.log('🎯 Opening Analysis - Moves:', practicingVariation.moves);
      console.log('🎯 Opening Analysis - Current Move Index:', currentMoveIndex);
      
      // Create a complete PGN of the entire opening variation using Chess.js
      const game = new Chess();
      
      // Play all moves in the variation
      for (let i = 0; i < practicingVariation.moves.length; i++) {
        try {
          const move = game.move(practicingVariation.moves[i]);
          if (!move) {
            console.warn(`⚠️ Failed to play move ${i + 1}: ${practicingVariation.moves[i]}`);
          }
        } catch (e) {
          console.error(`❌ Error playing move ${i + 1}: ${practicingVariation.moves[i]}`, e);
        }
      }
      
      // Get PGN from Chess.js - it formats it correctly with headers
      let completePGN = game.pgn();
      
      // Validate PGN is not empty
      if (!completePGN || completePGN.trim().length === 0) {
        console.error('❌ Generated PGN is empty!');
        alert('Error: Could not generate PGN. Please try again.');
        return;
      }
      
      // Add custom headers if needed
      if (completePGN && !completePGN.includes('[Event')) {
        const headers = `[Event "${practicingVariation.openingName} - ${practicingVariation.variationName}"]\n[Site "ChessRep"]\n[Date "${new Date().toISOString().split('T')[0]}"]\n[Round "1"]\n[White "White"]\n[Black "Black"]\n[Result "*"]\n\n`;
        completePGN = headers + completePGN;
      }
      
      console.log('🎯 Complete PGN:', completePGN);
      console.log('🎯 PGN length:', completePGN.length);
      console.log('🎯 PGN first 200 chars:', completePGN.substring(0, 200));
      
      // Get current position (up to currentMoveIndex)
      const currentGame = new Chess();
      for (let i = 0; i < currentMoveIndex && i < practicingVariation.moves.length; i++) {
        currentGame.move(practicingVariation.moves[i]);
      }
      
      const currentFen = currentGame.fen();
      
      // Validate both FEN and PGN are present
      if (!currentFen || !completePGN) {
        console.error('❌ Missing FEN or PGN!', { currentFen, completePGN: !!completePGN });
        alert('Error: Could not generate position data. Please try again.');
        return;
      }
      
      // Encode both values properly - handle special characters
      const encodedFen = encodeURIComponent(currentFen);
      const encodedPGN = encodeURIComponent(completePGN);
      
      console.log('🎯 Current FEN:', currentFen);
      console.log('🎯 Encoded FEN:', encodedFen);
      console.log('🎯 Encoded PGN Length:', encodedPGN.length);
      console.log('🎯 Encoded PGN first 200 chars:', encodedPGN.substring(0, 200));
      
      // Navigate to analysis page with complete PGN and current position
      const analysisUrl = `/analysis?fen=${encodedFen}&pgn=${encodedPGN}&moveIndex=${currentMoveIndex}`;
      console.log('🎯 Analysis URL (first 500 chars):', analysisUrl.substring(0, 500));
      console.log('🎯 Analysis URL full length:', analysisUrl.length);
      
      navigate(analysisUrl);
    } catch (error) {
      console.error('❌ Analysis error:', error);
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
      {/* Slider thumb styling */}
      <style>{`
        .board-size-slider::-webkit-slider-thumb {
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
        
        .board-size-slider::-webkit-slider-thumb:hover {
          background: #2563eb;
          transform: scale(1.1);
        }
        
        .board-size-slider::-webkit-slider-thumb:active {
          transform: scale(1.15);
        }
        
        .board-size-slider::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: 2px solid #ffffff;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
          transition: all 0.2s ease;
        }
        
        .board-size-slider::-moz-range-thumb:hover {
          background: #2563eb;
          transform: scale(1.1);
        }
        
        .board-size-slider::-moz-range-thumb:active {
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

            <div className="flex items-center space-x-3">
              {/* Quick open current position in Live Analysis if practicing */}
              {practicingVariation && (
                <OpenInLiveAnalysisButton
                  fen={currentFen}
                  label="Analyze Position"
                  className="!bg-blue-600 hover:!bg-blue-500 hidden sm:inline-flex"
                />
              )}
              <button
                onClick={() => setShowAuthModal(true)}
                className="hidden sm:inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg"
              >
                <BookOpen className="w-4 h-4" />
                <span>Learning Hub</span>
              </button>
            </div>

            <div className="text-sm text-gray-400">
              101 Openings / 303 Variations
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

      {/* Practice Modal */}
      {practicingVariation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg border border-gray-700 w-full max-w-6xl max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 sm:p-6 border-b border-gray-700">
              <div className="flex items-center justify-between">
            <div>
                  <h3 className="text-lg sm:text-xl font-semibold text-white">
                    {practicingVariation.openingName} - {practicingVariation.variationName}
                  </h3>
                  <p className="text-sm text-gray-400 mt-1">
                    Practice this opening variation
                  </p>
            </div>
              <button
                  onClick={closePractice}
                  className="p-2 hover:bg-gray-700 rounded-lg transition-colors text-gray-400 hover:text-white"
              >
                  ✕
              </button>
              </div>
          </div>

            {/* Practice Message */}
            {practiceMessage && (
              <div className="px-4 sm:px-6 py-2 bg-green-900 border-b border-green-700">
                <p className="text-green-200 text-sm font-medium">{practiceMessage}</p>
              </div>
            )}

            {/* Practice Content */}
            <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="flex flex-col lg:flex-row gap-6">
                {/* Chess Board */}
                <div className="flex-1">
                  <div className="flex flex-col items-center">
                    <ChessBoard 
                      moves={memoizedMoves}
                      explanations={memoizedExplanations}
                      orientation={practicingVariation.isBlack ? "black" : "white"}
                      onMoveChange={handleMoveChange}
                      currentMoveIndex={currentMoveIndex}
                      allowUserMoves={true}
                      boardSize={boardSize}
                    />
                    
                    {/* Board Size Slider - Directly under the board */}
                    <div className="w-full max-w-md mt-4 px-2">
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between text-xs text-gray-400">
                          <span>Board Size</span>
                          <span className="font-medium text-white">{boardSize}px</span>
                        </div>
                        <input
                          type="range"
                          min={200}
                          max={600}
                          value={boardSize}
                          onChange={(e) => setBoardSize(parseInt(e.target.value, 10))}
                          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer board-size-slider"
                          style={{
                            background: (() => {
                              const range = 600 - 200;
                              if (range === 0) return '#374151';
                              const percentage = ((boardSize - 200) / range) * 100;
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
                  </div>
                  
                  {/* Analysis Button */}
                  <div className="mt-4 flex justify-center">
            <button
                      onClick={() => {
                        console.log('🎯 Analyze Position button clicked!');
                        console.log('🎯 Practicing Variation exists:', !!practicingVariation);
                        analyzePosition();
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                      🔍 Analyze Position
            </button>
                  </div>
                  
                  {/* Keyboard Shortcuts Info */}
                  <div className="text-xs text-gray-500 text-center mt-2">
                    Use the navigation buttons above or ← → arrow keys to navigate • ESC to close
                  </div>
                </div>
                
                {/* Move List */}
                <div className="flex-1">
                  <h4 className="text-lg sm:text-xl font-semibold text-white mb-4">Move Sequence:</h4>
                  <div className="bg-gray-700 rounded-lg p-4 max-h-80 overflow-y-auto">
                    <div className="space-y-2 text-sm sm:text-base">
                      {practicingVariation.moves.map((move, index) => {
                        const moveNumber = Math.floor(index / 2) + 1;
                        const isWhiteMove = index % 2 === 0;
                        // Highlight the move that was just played (currentMoveIndex - 1)
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