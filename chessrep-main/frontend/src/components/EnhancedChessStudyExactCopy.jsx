import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, SkipBack, SkipForward, RotateCcw, Brain, BookOpen, Plus, Trash2, Upload, Download, Eye, Users, Share2, UserPlus, Bell, AtSign, Edit3, ChevronDown, ArrowLeft, Bot } from 'lucide-react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import stockfishCloudService from '../services/StockfishCloudService';
import { collaborationService } from '../services/collaborationService';
import { studyService, chapterService } from '../services/studyService';
import websocketService from '../services/websocketService';
import { lichessStudyService } from '../services/lichessStudyService';
import CollaborationManager from './CollaborationManager';
import JoinStudyModal from './JoinStudyModal';
import NotificationCenter from './NotificationCenter';
import PGNViewer from './PGNViewer';
import GameTreeNotation from './GameTreeNotation';
import LichessImportModal from './LichessImportModal';
import ChessStudyViewerComponent from './ChessStudyViewerComponent';

const EnhancedChessStudyPage = () => {
  const navigate = useNavigate();
  
  // Chapter-specific game state storage
  const [chapterGameStates, setChapterGameStates] = useState({});
  
  // Study management state
  const [studies, setStudies] = useState([]);
  const [activeStudy, setActiveStudy] = useState(null);
  const [activeChapter, setActiveChapter] = useState(null);
  const [isCreatingNewChapter, setIsCreatingNewChapter] = useState(false);
  
  // CLEAN GAME TREE STATE (EXACT SAME AS SimplifiedChessBoardPage)
  const [game, setGame] = useState(new Chess());
  const [boardPosition, setBoardPosition] = useState(game.fen());
  
  // Game tree structure: { moves: [...], variations: [] }
  const [tree, setTree] = useState({ moves: [], variations: [] });
  const [gameTree, setGameTree] = useState({ moves: [], variations: [] }); // Alias for compatibility
  
  // Current position tracking
  const [currentPath, setCurrentPath] = useState([]); // [] = mainline, [n] = in variation n
  const [currentMoveIndex, setCurrentMoveIndex] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);

  // CRITICAL DEBUG: Component render detection (after hooks)
  console.log('🔄 COMPONENT RENDERED with boardPosition:', boardPosition);
  console.log('🔄 COMPONENT RENDERED with currentMoveIndex:', currentMoveIndex);
  console.log('🔄 TREE STATE:', {
    hasTree: !!tree,
    hasMoves: !!(tree && tree.moves),
    moveCount: tree?.moves?.length || 0,
    firstMove: tree?.moves?.[0],
    treeStructure: tree
  });

  const [boardOrientation, setBoardOrientation] = useState('white');
  const [loading, setLoading] = useState(true);
  const [loadingChapter, setLoadingChapter] = useState(false);
  
  // Local board position state for direct control
  const [localBoardPosition, setLocalBoardPosition] = useState(boardPosition);
  
  // Bot mode state
  const [isBotMode, setIsBotMode] = useState(false);
  const [botDifficulty, setBotDifficulty] = useState('intermediate');
  const [isBotThinking, setIsBotThinking] = useState(false);
  const [playerColor, setPlayerColor] = useState('white');
  
  // Sync local board position with hook's board position - OPTIMIZED
  useEffect(() => {
    if (localBoardPosition !== boardPosition) {
    setLocalBoardPosition(boardPosition);
    }
  }, [boardPosition, localBoardPosition]);
  
  // Update the game tree when activeChapter changes
  // Removed problematic useEffect that was causing infinite loops
  // The board position is now managed by the navigation functions directly
  
  // ============================================
  // CLEAN GAME TREE NAVIGATION (from SimplifiedChessBoardPage)
  // ============================================
  
  /**
   * Navigate to a specific position in the tree
   */
  const navigateToPosition = useCallback((path, moveIndex) => {
    // Safety check: ensure tree exists and has moves
    if (!tree || !tree.moves) {
      console.warn('⚠️ navigateToPosition called with invalid tree:', tree);
      return;
    }
    
    console.log('📍 ===== NAVIGATE TO POSITION =====');
    console.log('📍 Path:', path);
    console.log('📍 Move index:', moveIndex);
    console.log('📍 Path length:', path.length);
    console.log('📍 Tree structure:', {
      hasTree: !!tree,
      mainlineMoves: tree?.moves?.length || 0,
      firstMainlineMove: tree?.moves?.[0],
      hasVariations: tree?.moves?.[0]?.variations?.length > 0
    });
    console.log('📍 Active chapter starting position:', activeChapter?.position);
    
    // CRITICAL FIX: Use chapter's starting position if it exists
    const startingFen = activeChapter?.position || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    const newGame = new Chess(startingFen);
    console.log('📍 Starting FEN for navigation:', startingFen);
    const movesToPlay = [];
    
    if (path.length === 0) {
      // Mainline
      console.log('📍 Navigating mainline to move', moveIndex);
      for (let i = 0; i < moveIndex && i < tree.moves.length; i++) {
        movesToPlay.push(tree.moves[i]);
      }
    } else if (path.length === 2 && path[0] === -1) {
      // Root-level variation
      const varIndex = path[1];
      const variation = tree.variations?.[varIndex];
      if (variation?.moves) {
        for (let i = 0; i < moveIndex && i < variation.moves.length; i++) {
          movesToPlay.push(variation.moves[i]);
        }
      }
    } else if (path.length === 4 && path[0] === -1) {
      // Sub-variation within root-level variation
      const [, varIndex1, branchPoint, varIndex2] = path;
      const variation1 = tree.variations?.[varIndex1];
      if (variation1?.moves) {
        // Play root variation up to (not including) branch point
        for (let i = 0; i < branchPoint && i < variation1.moves.length; i++) {
          movesToPlay.push(variation1.moves[i]);
        }
        const variation2 = variation1.moves[branchPoint]?.variations?.[varIndex2];
        if (variation2?.moves) {
          for (let i = 0; i < moveIndex && i < variation2.moves.length; i++) {
            movesToPlay.push(variation2.moves[i]);
          }
        }
      }
    } else if (path.length === 2) {
      // First-level variation
      const branchPoint = path[0];
      const varIndex = path[1];
      console.log('📍 First-level variation - branchPoint:', branchPoint, 'varIndex:', varIndex);
      console.log('📍 Parent move:', tree.moves[branchPoint]);
      console.log('📍 Variations at parent:', tree.moves[branchPoint]?.variations);
      
      // Play mainline moves BEFORE the branch point (variation is alternative to branchPoint move)
      for (let i = 0; i < branchPoint && i < tree.moves.length; i++) {
        movesToPlay.push(tree.moves[i]);
      }
      const variation = tree.moves[branchPoint]?.variations?.[varIndex];
      console.log('📍 Selected variation:', variation);
      console.log('📍 Variation moves:', variation?.moves);
      
      if (variation?.moves) {
        for (let i = 0; i < moveIndex && i < variation.moves.length; i++) {
          movesToPlay.push(variation.moves[i]);
        }
      } else {
        console.error('📍 ERROR: Variation or variation.moves not found!');
      }
    } else if (path.length === 4) {
      // Second-level variation
      const [branchPoint1, varIndex1, branchPoint2, varIndex2] = path;
      // Play mainline up to (not including) first branch point
      for (let i = 0; i < branchPoint1 && i < tree.moves.length; i++) {
        movesToPlay.push(tree.moves[i]);
      }
      const variation1 = tree.moves[branchPoint1]?.variations?.[varIndex1];
      if (variation1?.moves) {
        // Play first variation up to (not including) second branch point
        for (let i = 0; i < branchPoint2 && i < variation1.moves.length; i++) {
          movesToPlay.push(variation1.moves[i]);
        }
        const variation2 = variation1.moves[branchPoint2]?.variations?.[varIndex2];
        if (variation2?.moves) {
          for (let i = 0; i < moveIndex && i < variation2.moves.length; i++) {
            movesToPlay.push(variation2.moves[i]);
          }
        }
      }
    } else if (path.length === 6) {
      // Third-level variation
      const [bp1, vi1, bp2, vi2, bp3, vi3] = path;
      // Play mainline up to (not including) first branch point
      for (let i = 0; i < bp1 && i < tree.moves.length; i++) {
        movesToPlay.push(tree.moves[i]);
      }
      const variation1 = tree.moves[bp1]?.variations?.[vi1];
      if (variation1?.moves) {
        // Play first variation up to (not including) second branch point
        for (let i = 0; i < bp2 && i < variation1.moves.length; i++) {
          movesToPlay.push(variation1.moves[i]);
        }
        const variation2 = variation1.moves[bp2]?.variations?.[vi2];
        if (variation2?.moves) {
          // Play second variation up to (not including) third branch point
          for (let i = 0; i < bp3 && i < variation2.moves.length; i++) {
            movesToPlay.push(variation2.moves[i]);
          }
          const variation3 = variation2.moves[bp3]?.variations?.[vi3];
          if (variation3?.moves) {
            for (let i = 0; i < moveIndex && i < variation3.moves.length; i++) {
              movesToPlay.push(variation3.moves[i]);
            }
          }
        }
      }
    }
    
    // Apply all moves
    console.log('📍 Moves to play:', movesToPlay.map(m => m.san || m.notation || m.move));
    movesToPlay.forEach((move, idx) => {
      try {
        // Handle different move formats: san, notation, or move property
        const moveNotation = move.san || move.notation || move.move;
        if (!moveNotation) {
          console.error(`📍 ERROR: Move ${idx + 1} has no notation:`, move);
          return;
        }
        const result = newGame.move(moveNotation);
        console.log(`📍 Move ${idx + 1}/${movesToPlay.length}: ${moveNotation} -> ${result ? 'SUCCESS' : 'FAILED'}`);
        if (!result) {
          console.error(`📍 Failed to apply move. Current FEN:`, newGame.fen());
        }
      } catch (e) {
        console.error(`📍 Error applying move ${idx + 1}:`, move, e);
        console.error(`📍 Current board position:`, newGame.fen());
      }
    });
    
    const finalFen = newGame.fen();
    console.log('📍 Final FEN:', finalFen);
    console.log('📍 Setting board states...');
    console.log('📍 New board position:', finalFen);
    
    // Update game state - FORCE update with unique timestamp to ensure React sees the change
    const timestamp = Date.now();
    console.log('📍 Forcing state updates with timestamp:', timestamp);
    
    setGame(newGame);
    // Only update if position actually changed
    if (boardPosition !== finalFen) {
    setBoardPosition(finalFen);
    setLocalBoardPosition(finalFen);
    }
    setCurrentPath(path);
    setCurrentMoveIndex(moveIndex);
    
    // Force a refresh by updating a dummy state
    setRefreshKey(prev => prev + 1);
    
    console.log('📍 Board position updated to:', finalFen);
    console.log('📍 Local board position updated to:', finalFen);
    console.log('📍 Refresh key incremented');
    console.log('📍 ===== NAVIGATION COMPLETE =====');
    
    // Force immediate re-render by updating refresh key again
    setTimeout(() => {
      setRefreshKey(prev => prev + 1);
      console.log('📍 Additional refresh triggered');
    }, 50);
  }, [tree, activeChapter]);
  
  /**
   * Go back one move
   */
  const goBack = useCallback(() => {
    console.log('⬅️ ========== GO BACK BUTTON CLICKED ==========');
    console.log('⬅️ Current move index:', currentMoveIndex);
    console.log('⬅️ Current path:', currentPath);
    console.log('⬅️ Current board position:', boardPosition);
    console.log('⬅️ Tree moves count:', tree?.moves?.length || 0);
    
    if (currentMoveIndex > 0) {
      console.log('⬅️ TARGET: Navigating to move index:', currentMoveIndex - 1);
      console.log('⬅️ BEFORE NAVIGATE - Board position:', boardPosition);
      
      navigateToPosition(currentPath, currentMoveIndex - 1);
      
      // Log after navigation attempt
      setTimeout(() => {
        console.log('⬅️ AFTER NAVIGATE - Board position should have changed');
        console.log('⬅️ New board position:', boardPosition);
        console.log('⬅️ New local board position:', localBoardPosition);
        console.log('⬅️ New move index:', currentMoveIndex);
        console.log('⬅️ Refresh key:', refreshKey);
      }, 100);
    } else {
      console.log('⬅️ Already at start, cannot go back');
    }
    console.log('⬅️ ========== GO BACK COMPLETE ==========');
  }, [currentPath, currentMoveIndex, navigateToPosition, boardPosition, tree]);

  /**
   * Go forward one move
   */
  const goForward = useCallback(() => {
    // Safety check: ensure tree exists and has moves
    if (!tree || !tree.moves) {
      console.warn('⚠️ goForward called with invalid tree:', tree);
      return;
    }
    
    let maxMoves = 0;
    
    if (currentPath.length === 0) {
      maxMoves = tree.moves.length;
    } else if (currentPath.length === 2 && currentPath[0] === -1) {
      maxMoves = tree.variations?.[currentPath[1]]?.moves?.length || 0;
    } else if (currentPath.length === 4 && currentPath[0] === -1) {
      const variation1 = tree.variations?.[currentPath[1]];
      maxMoves = variation1?.moves?.[currentPath[2]]?.variations?.[currentPath[3]]?.moves?.length || 0;
    } else if (currentPath.length === 2) {
      maxMoves = tree.moves[currentPath[0]]?.variations?.[currentPath[1]]?.moves?.length || 0;
    } else if (currentPath.length === 4) {
      const variation1 = tree.moves[currentPath[0]]?.variations?.[currentPath[1]];
      maxMoves = variation1?.moves?.[currentPath[2]]?.variations?.[currentPath[3]]?.moves?.length || 0;
    } else if (currentPath.length === 6) {
      const variation1 = tree.moves[currentPath[0]]?.variations?.[currentPath[1]];
      const variation2 = variation1?.moves?.[currentPath[2]]?.variations?.[currentPath[3]];
      maxMoves = variation2?.moves?.[currentPath[4]]?.variations?.[currentPath[5]]?.moves?.length || 0;
    }
    
    if (currentMoveIndex < maxMoves) {
      navigateToPosition(currentPath, currentMoveIndex + 1);
    }
  }, [currentPath, currentMoveIndex, tree, navigateToPosition]);

  /**
   * Go to start
   */
  const goToStart = useCallback(() => {
    navigateToPosition(currentPath, 0);
  }, [currentPath, navigateToPosition]);

  /**
   * Go to end
   */
  const goToEnd = useCallback(() => {
    // Safety check: ensure tree exists and has moves
    if (!tree || !tree.moves) {
      console.warn('⚠️ goToEnd called with invalid tree:', tree);
      return;
    }
    
    let maxMoves = 0;
    
    if (currentPath.length === 0) {
      maxMoves = tree.moves.length;
    } else if (currentPath.length === 2 && currentPath[0] === -1) {
      maxMoves = tree.variations?.[currentPath[1]]?.moves?.length || 0;
    } else if (currentPath.length === 4 && currentPath[0] === -1) {
      const variation1 = tree.variations?.[currentPath[1]];
      maxMoves = variation1?.moves?.[currentPath[2]]?.variations?.[currentPath[3]]?.moves?.length || 0;
    } else if (currentPath.length === 2) {
      maxMoves = tree.moves[currentPath[0]]?.variations?.[currentPath[1]]?.moves?.length || 0;
    } else if (currentPath.length === 4) {
      const variation1 = tree.moves[currentPath[0]]?.variations?.[currentPath[1]];
      maxMoves = variation1?.moves?.[currentPath[2]]?.variations?.[currentPath[3]]?.moves?.length || 0;
    } else if (currentPath.length === 6) {
      const variation1 = tree.moves[currentPath[0]]?.variations?.[currentPath[1]];
      const variation2 = variation1?.moves?.[currentPath[2]]?.variations?.[currentPath[3]];
      maxMoves = variation2?.moves?.[currentPath[4]]?.variations?.[currentPath[5]]?.moves?.length || 0;
    }
    
    navigateToPosition(currentPath, maxMoves);
  }, [currentPath, tree, navigateToPosition]);

  /**
   * Reset the game (EXACT SAME AS SimplifiedChessBoardPage)
   */
  const reset = useCallback(() => {
    const newGame = new Chess();
    setGame(newGame);
    setBoardPosition(newGame.fen());
    setTree({ moves: [], variations: [] });
    setGameTree({ moves: [], variations: [] });
    setCurrentPath([]);
    setCurrentMoveIndex(0);
  }, []);
  
  /**
   * CLEAN NOTATION RENDERER (from SimplifiedChessBoardPage)
   */
  const renderNotation = () => {
    // Safety check: ensure tree exists and has moves
    if (!tree || !tree.moves) {
      console.warn('⚠️ renderNotation called with invalid tree:', tree);
      return <div className="text-gray-500 text-sm">No moves available</div>;
    }

    // Debug: Log tree structure
    if (tree.moves && tree.moves.length > 0) {
      console.log('🎨 Rendering notation with tree:', {
        moveCount: tree.moves.length,
        firstMove: tree.moves[0],
        firstMoveKeys: Object.keys(tree.moves[0] || {}),
        sampleMoves: tree.moves.slice(0, 3)
      });
    }
    
    if (!tree.moves || tree.moves.length === 0) {
      return (
        <div className="text-center text-gray-500 py-8">
          <p>No moves yet</p>
          <p className="text-sm mt-2">Make moves on the board</p>
        </div>
      );
    }

    // Recursive function to render variations
    const renderVariation = (variation, varPath, baseIndex, depth = 1) => {
      const depthColor = depth === 1 ? 'bg-yellow-100 hover:bg-yellow-200' : 
                         depth === 2 ? 'bg-orange-100 hover:bg-orange-200' :
                         depth === 3 ? 'bg-red-100 hover:bg-red-200' :
                         'bg-purple-100 hover:bg-purple-200';
      
      return (
        <span className="inline-block ml-1">
          <span className="text-gray-500">(</span>
          {variation.moves.map((varMove, varMoveIndex) => {
            const varActive = 
              JSON.stringify(varPath) === JSON.stringify(currentPath) && 
              varMoveIndex + 1 === currentMoveIndex;
            
            // Calculate the actual move number based on position from game start
            // baseIndex is the mainline index where variation branches (-1 for root-level)
            // First move of variation is (baseIndex + 1)
            const totalIndex = Math.max(0, baseIndex + 1 + varMoveIndex);
            const moveNumber = Math.floor(totalIndex / 2) + 1;
            const isWhiteMove = totalIndex % 2 === 0;
            
            return (
              <React.Fragment key={varMoveIndex}>
                {/* Move number - show for first move or white moves */}
                {(varMoveIndex === 0 || isWhiteMove) && (
                  <span className="text-gray-400 text-xs mr-1">
                    {moveNumber}{isWhiteMove ? '.' : '...'}
                  </span>
                )}
                
                {/* Variation move button */}
                <button
                  onClick={() => navigateToPosition(varPath, varMoveIndex + 1)}
                  className={`px-1 py-0.5 rounded mr-1 text-xs ${
                    varActive
                      ? 'bg-blue-500 text-white font-bold'
                      : `${depthColor} text-gray-700`
                  }`}
                >
                  {varMove.san || varMove.notation || varMove.move || '?'}
                </button>
                
                {/* Sub-variations (recursive) - rendered inline */}
                {varMove.variations && varMove.variations.length > 0 && (
                  <>
                    {varMove.variations.map((subVar, subVarIndex) => (
                      <React.Fragment key={subVarIndex}>
                        {renderVariation(subVar, [...varPath, varMoveIndex, subVarIndex], totalIndex, depth + 1)}
                      </React.Fragment>
                    ))}
                  </>
                )}
              </React.Fragment>
            );
          })}
          <span className="text-gray-500">)</span>
        </span>
      );
    };

    // Main move rendering
    const renderMove = (move, index, path = []) => {
      const isMainline = path.length === 0;
      const isActive = 
        JSON.stringify(path) === JSON.stringify(currentPath) && 
                   index + 1 === currentMoveIndex;
      
      const moveNumber = Math.floor(index / 2) + 1;
      const isWhiteMove = index % 2 === 0;

      return (
        <React.Fragment key={`${path.join('-')}-${index}`}>
          {/* Move number for white moves */}
          {isWhiteMove && (
            <span className="text-gray-500 font-semibold mr-1">
              {moveNumber}.
            </span>
          )}
          
          {/* Move button */}
          <button
            onClick={() => navigateToPosition(path, index + 1)}
            className={`px-2 py-1 rounded mr-1 transition-all ${
              isActive
                ? 'bg-blue-500 text-white font-bold'
                : isMainline
                ? 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                : 'bg-yellow-50 hover:bg-yellow-100 text-gray-700'
            }`}
          >
            {move.san || move.notation || move.move || '?'}
          </button>

          {/* Variations with recursive rendering */}
          {move.variations && move.variations.length > 0 && (
            <>
              {move.variations.map((variation, varIndex) => (
                <React.Fragment key={varIndex}>
                  {renderVariation(variation, [...path, index, varIndex], index)}
                </React.Fragment>
              ))}
            </>
          )}
          
          {/* Line break after black's move */}
          {!isWhiteMove && <br />}
        </React.Fragment>
      );
    };

    return (
      <div className="space-y-2">
        {/* Show root-level variations (alternative first moves) inline */}
        {tree.variations && tree.variations.length > 0 && tree.moves.length === 0 && (
          <>
            {tree.variations.map((variation, varIndex) => (
              <React.Fragment key={`root-${varIndex}`}>
                {renderVariation(variation, [-1, varIndex], -1, 1)}
                {' '}
              </React.Fragment>
            ))}
          </>
        )}
        
        {/* Mainline moves with inline root variations after first move */}
        {tree.moves.length > 0 ? (
          tree.moves.map((move, index) => {
            if (index === 0 && tree.variations && tree.variations.length > 0) {
              // Show first move with root-level variations inline
              return (
                <React.Fragment key={`move-${index}`}>
                  {renderMove(move, index)}
                  {tree.variations.map((variation, varIndex) => (
                    <React.Fragment key={`root-${varIndex}`}>
                      {renderVariation(variation, [-1, varIndex], -1, 1)}
                    </React.Fragment>
                  ))}
                </React.Fragment>
              );
            }
            return renderMove(move, index);
          })
        ) : null}
        
        {tree.moves.length === 0 && (!tree.variations || tree.variations.length === 0) && (
          <div className="text-gray-500">No moves yet</div>
        )}
      </div>
    );
  };
  
  // UI state
  const [isMobile, setIsMobile] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState('');
  const [showLichessImportModal, setShowLichessImportModal] = useState(false);
  const [showPGNViewer, setShowPGNViewer] = useState(false);
  const [showImportInterface, setShowImportInterface] = useState(false);
  const [importMode, setImportMode] = useState('chapter'); // 'chapter' or 'study'
  const [showStudies, setShowStudies] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');
  
  // Debug: Monitor board position changes - OPTIMIZED (removed excessive logging)
  useEffect(() => {
    // Only log when position actually changes significantly
    if (boardPosition && boardPosition !== 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1') {
    console.log('🔍 Board position changed to:', boardPosition);
    }
  }, [boardPosition]);

  // Debug: Monitor active chapter changes
  useEffect(() => {
    console.log('🔍 Active chapter changed:', activeChapter);
    if (activeChapter?.position) {
      console.log('🔍 Chapter has custom position:', activeChapter.position);
    }
  }, [activeChapter]);

  // Debug: Monitor studies and activeStudy changes
  useEffect(() => {
    console.log('🔍 Studies state changed:', {
      studiesCount: studies.length,
      activeStudy: activeStudy,
      studiesData: studies.map(s => ({ id: s._id, name: s.name, chaptersCount: s.chapters?.length || 0 }))
    });
    
    if (activeStudy) {
      const currentStudy = studies.find(s => s._id === activeStudy);
      console.log('🔍 Current study:', currentStudy);
      console.log('🔍 Current study chapters:', currentStudy?.chapters?.length || 0);
    }
  }, [studies, activeStudy]);
  
  const [showCollaborationManager, setShowCollaborationManager] = useState(false);
  const [selectedStudy, setSelectedStudy] = useState(null);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showQuickInvite, setShowQuickInvite] = useState(false);
  const [inviteUsername, setInviteUsername] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [currentUsername, setCurrentUsername] = useState(localStorage.getItem('currentUsername') || 'adminiz');
  
  // Engine evaluation state (exact same as CleanChessAnalysis)
  const [engineEvaluation, setEngineEvaluation] = useState(null);
  const [engineMoves, setEngineMoves] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isEngineReady, setIsEngineReady] = useState(false);
  const [openingMoves, setOpeningMoves] = useState([]);
  const [openingStats, setOpeningStats] = useState(null);

  // Notation system state (from ChessAnalysisBoard)
  const [collapsedVariations, setCollapsedVariations] = useState(new Set());






  // Load opening data from Lichess API (exact same as CleanChessAnalysis)
  const loadOpeningData = useCallback(async (fen) => {
    try {
      console.log('Loading opening data for FEN:', fen);
      const response = await fetch(`https://explorer.lichess.ovh/masters?fen=${encodeURIComponent(fen)}`);
      const data = await response.json();
      
      console.log('Lichess opening data response:', data);
      
      if (data.moves && data.moves.length > 0) {
        const openingMoves = data.moves.slice(0, 10).map(move => {
          const total = move.white + move.draws + move.black;
          const whiteWinRate = total > 0 ? (move.white / total) * 100 : 0;
          const drawRate = total > 0 ? (move.draws / total) * 100 : 0;
          const blackWinRate = total > 0 ? (move.black / total) * 100 : 0;
          
          return {
            san: move.san,
            uci: move.uci,
            white: move.white || 0,
            draws: move.draws || 0,
            black: move.black || 0,
            averageRating: move.averageRating || 0,
            total: total,
            whiteWinRate: Math.round(whiteWinRate),
            drawRate: Math.round(drawRate),
            blackWinRate: Math.round(blackWinRate)
          };
        });
        
        console.log('Processed opening moves:', openingMoves);
        setOpeningMoves(openingMoves);
      } else {
        console.log('No opening moves found for this position');
        setOpeningMoves([]);
      }
    } catch (error) {
      console.error('Error fetching opening data:', error);
      setOpeningMoves([]);
    }
  }, []);



  // Play opening move (exact same as CleanChessAnalysis)
  const playOpeningMove = useCallback((openingMove) => {
    console.log('Playing opening move:', openingMove);
    // This would need to be integrated with the game tree system
    // For now, we'll just log it
  }, []);

  // Initialize engine and opening service (exact same as CleanChessAnalysis)
  useEffect(() => {
    const initEngine = async () => {
      try {
        // Wait for engine to be ready
        const checkReady = () => {
          if (stockfishCloudService.isEngineReady()) {
            setIsEngineReady(true);
            console.log('Engine is ready');
          } else {
            setTimeout(checkReady, 100);
          }
        };
        checkReady();
      } catch (error) {
        console.error('Failed to initialize engine:', error);
      }
    };

    initEngine();
  }, []);

  // Utility function to fix move notation for existing moves (RECURSIVE FOR VARIATIONS)
  const fixMoveNotation = useCallback((moves) => {
    if (!moves || !Array.isArray(moves)) return moves;
    
    console.log('🔧 fixMoveNotation called with', moves.length, 'moves');
    console.log('🔧 First move before fix:', moves[0]);
    console.log('🔧 Moves with variations:', moves.filter(m => m.variations && m.variations.length > 0).length);
    
    const fixedMoves = moves.map((move, index) => {
      // Handle both 'notation' and 'move' properties for compatibility
      const existingNotation = move.notation || move.move || move.san;
      
      // If move has any form of notation (san, notation, or move), normalize it
      // Always normalize if we have notation, regardless of from/to properties
      if (existingNotation && existingNotation !== 'undefined' && existingNotation !== '?') {
        // Recursively fix variations
        const fixedVariations = move.variations && Array.isArray(move.variations)
          ? move.variations.map((variation, varIdx) => {
              if (!variation || !variation.moves) {
                console.log(`⚠️ Variation ${varIdx} has no moves:`, variation);
                return variation;
              }
              console.log(`🔧 Processing variation ${varIdx} with ${variation.moves.length} moves for move ${existingNotation}`);
              const fixedVariation = {
                ...variation,
                moves: fixMoveNotation(variation.moves) // RECURSIVE CALL
              };
              console.log(`✅ Fixed variation ${varIdx} first move:`, fixedVariation.moves[0]);
              return fixedVariation;
            })
          : move.variations;
        
        if (fixedVariations && fixedVariations.length > 0) {
          console.log(`✅ Move ${existingNotation} has ${fixedVariations.length} variations after fixing`);
        }
        
        // Normalize all move property names
        return {
          ...move,
          notation: existingNotation,
          san: existingNotation,
          move: existingNotation,
          variations: fixedVariations
        };
      }
      
      // Generate proper notation using Chess.js (only if from/to are valid squares)
      if (move.from && move.to && move.from !== 'unknown' && move.to !== 'unknown' && move.from.length === 2 && move.to.length === 2) {
        try {
          const tempGame = new Chess();
          // Replay moves up to this point
          for (let i = 0; i < index; i++) {
            const prevMove = moves[i];
            if (prevMove.from && prevMove.to && prevMove.from !== 'unknown' && prevMove.to !== 'unknown') {
              tempGame.move({ from: prevMove.from, to: prevMove.to });
            }
          }
          // Generate notation for current move
          const moveResult = tempGame.move({ from: move.from, to: move.to });
          if (moveResult) {
            // Recursively fix variations
            const fixedVariations = move.variations && Array.isArray(move.variations)
              ? move.variations.map(variation => {
                  if (!variation || !variation.moves) return variation;
                  return {
                    ...variation,
                    moves: fixMoveNotation(variation.moves) // RECURSIVE CALL
                  };
                })
              : move.variations;
            
            return {
              ...move,
              notation: moveResult.san,
              san: moveResult.san,
              move: moveResult.san,
              variations: fixedVariations
            };
          }
        } catch (error) {
          console.warn('Could not fix notation for move:', move, error);
        }
      }
      
      // If we can't fix the notation, return the move with existing notation and recursively fix variations
      const fixedVariations = move.variations && Array.isArray(move.variations)
        ? move.variations.map(variation => {
            if (!variation || !variation.moves) return variation;
            return {
              ...variation,
              moves: fixMoveNotation(variation.moves) // RECURSIVE CALL
            };
          })
        : move.variations;
      
      return {
        ...move,
        notation: existingNotation || '?',
        san: existingNotation || '?',
        move: existingNotation || '?',
        variations: fixedVariations
      };
    });
    
    console.log('🔧 fixMoveNotation returning', fixedMoves.length, 'moves');
    console.log('🔧 First move after fix:', fixedMoves[0]);
    console.log('🔧 First move san after fix:', fixedMoves[0]?.san);
    console.log('🔧 Moves with variations after fix:', fixedMoves.filter(m => m.variations && m.variations.length > 0).length);
    
    const sampleMoveWithVar = fixedMoves.find(m => m.variations && m.variations.length > 0);
    if (sampleMoveWithVar) {
      console.log('🔧 Sample move with variation:', sampleMoveWithVar.notation);
      console.log('🔧 Sample variation structure:', sampleMoveWithVar.variations[0]);
      console.log('🔧 Sample variation first move:', sampleMoveWithVar.variations[0]?.moves?.[0]);
    }
    
    return fixedMoves;
  }, []);

  // Convert tree to PGN with variations - IMPROVED VERSION
  const convertTreeToPGN = useCallback((gameTree) => {
    console.log('🔄 convertTreeToPGN called with:', gameTree);
    console.log('🔄 gameTree type:', typeof gameTree);
    console.log('🔄 gameTree keys:', gameTree ? Object.keys(gameTree) : 'null');
    
    if (!gameTree) {
      console.log('❌ No gameTree provided');
      return 'No game tree available';
    }
    
    if (!gameTree.moves || gameTree.moves.length === 0) {
      console.log('❌ No moves in gameTree:', gameTree.moves);
      return 'No moves available';
    }
    
    console.log('🔄 Converting gameTree to PGN:', gameTree);
    console.log('🔄 Moves count:', gameTree.moves.length);
    console.log('🔄 Variations count:', gameTree.variations?.length || 0);
    console.log('🔄 First move:', gameTree.moves[0]);
    console.log('🔄 First move keys:', gameTree.moves[0] ? Object.keys(gameTree.moves[0]) : 'null');

    // Create a map of variations by move index for easy lookup
    const variationsByMove = {};
    if (gameTree.variations) {
      console.log('🔄 Processing top-level variations:', gameTree.variations);
      gameTree.variations.forEach(variation => {
        const moveIndex = variation.parentMoveIndex;
        if (!variationsByMove[moveIndex]) {
          variationsByMove[moveIndex] = [];
        }
        variationsByMove[moveIndex].push(variation);
      });
    }
    
    // Also check for variations attached to individual moves
    let totalMoveVariations = 0;
    if (gameTree.moves) {
      gameTree.moves.forEach((move, index) => {
        if (move.variations && move.variations.length > 0) {
          totalMoveVariations += move.variations.length;
          console.log(`🔄 Move ${index + 1} (${move.notation || move.move}) has ${move.variations.length} variations:`, move.variations);
        }
      });
    }
    
    console.log('🔄 Variations by move:', variationsByMove);
    console.log('🔄 Total variations attached to moves:', totalMoveVariations);
    
    let pgn = '';
    let moveNumber = 1;
    
    // Process moves in pairs (white and black)
    for (let i = 0; i < gameTree.moves.length; i += 2) {
      const whiteMove = gameTree.moves[i];
      const blackMove = gameTree.moves[i + 1];
      
      if (whiteMove) {
        console.log(`🔄 Processing white move ${moveNumber}:`, whiteMove);
        console.log(`🔄 White move notation:`, whiteMove.notation);
        console.log(`🔄 White move san:`, whiteMove.san);
        console.log(`🔄 White move move:`, whiteMove.move);
        
        const whiteNotation = whiteMove.notation || whiteMove.san || whiteMove.move;
        console.log(`🔄 Selected white notation:`, whiteNotation);
        
        if (whiteNotation) {
          pgn += `${moveNumber}. ${whiteNotation}`;
          
          // Add white move variations
          const whiteVariations = variationsByMove[i] || [];
          if (whiteVariations.length > 0) {
            whiteVariations.forEach(variation => {
              if (variation.moves && variation.moves.length > 0) {
                pgn += ` (${variation.moves.join(' ')})`;
              }
            });
          }
          
          if (blackMove) {
            console.log(`🔄 Processing black move ${moveNumber}:`, blackMove);
            console.log(`🔄 Black move notation:`, blackMove.notation);
            console.log(`🔄 Black move san:`, blackMove.san);
            console.log(`🔄 Black move move:`, blackMove.move);
            
            const blackNotation = blackMove.notation || blackMove.san || blackMove.move;
            console.log(`🔄 Selected black notation:`, blackNotation);
            
            if (blackNotation) {
              pgn += ` ${blackNotation}`;
              
              // Add black move variations
              const blackVariations = variationsByMove[i + 1] || [];
              if (blackVariations.length > 0) {
                blackVariations.forEach(variation => {
                  if (variation.moves && variation.moves.length > 0) {
                    pgn += ` (${variation.moves.join(' ')})`;
                  }
                });
              }
            }
          }
          
          pgn += '\n';
          moveNumber++;
        }
      }
    }
    
    const result = pgn.trim();
    console.log('✅ Generated PGN:', result);
    console.log('✅ PGN length:', result.length);
    console.log('✅ PGN preview:', result.substring(0, 100));
    return result;
  }, []);

  // Save moves to database
  const saveMovesToDatabase = useCallback(async () => {
    if (!activeChapter) {
      console.log('❌ No active chapter, cannot save moves');
      return;
    }
    
    try {
      console.log('💾 Current tree:', tree);
      console.log('💾 Tree moves:', tree?.moves);
      console.log('💾 Tree moves length:', tree?.moves?.length || 0);
      
      // Debug variations before saving
      if (tree?.moves) {
        const movesWithVariations = tree.moves.filter(m => m.variations && m.variations.length > 0);
        console.log('💾 [SAVE] Moves with variations:', movesWithVariations.length);
        if (movesWithVariations.length > 0) {
          console.log('💾 [SAVE] First move with variations:', movesWithVariations[0]);
          console.log('💾 [SAVE] Variations structure:', movesWithVariations[0].variations);
        } else {
          console.log('❌ [SAVE] NO VARIATIONS FOUND IN TREE BEFORE SAVING!');
        }
      }
      
      // Convert the clean game tree to PGN format
      const pgn = convertTreeToPGN(tree);
      
      console.log('💾 Saving chapter data for:', activeChapter.name);
      console.log('💾 Chapter ID:', activeChapter._id);
      console.log('💾 Moves count:', tree.moves ? tree.moves.length : 0);
      console.log('💾 PGN:', pgn);
      console.log('💾 Position:', boardPosition);
      console.log('💾 Game tree:', tree);
      console.log('💾 Current path:', currentPath);
      console.log('💾 Current move index:', currentMoveIndex);
      
      // Enhanced move data for better chapter isolation
      const moveData = {
        pgn: pgn,
        position: boardPosition,
        gameTree: tree,
        currentPath: currentPath,
        currentMoveIndex: currentMoveIndex,
        lastSaved: new Date().toISOString(),
        chapterName: activeChapter.name,
        chapterId: activeChapter._id,
        studyId: activeStudy,
        moveCount: tree.moves ? tree.moves.length : 0
      };
      
      console.log('💾 Enhanced move data:', moveData);
      
      // Use the dedicated save-moves endpoint
      console.log('💾 Calling chapterService.saveMoves...');
      const response = await chapterService.saveMoves(activeChapter._id, moveData);
      console.log('💾 Save response:', response);
      
      if (response.success) {
        console.log('✅ Moves saved to database for chapter:', activeChapter._id, 'PGN:', pgn);
        
        // Update the local chapter state to reflect the saved data
        setActiveChapter(prev => ({
          ...prev,
          pgn: pgn,
          position: boardPosition,
          gameTree: tree,
          currentPath: currentPath,
          currentMoveIndex: currentMoveIndex,
          lastSaved: new Date().toISOString()
        }));
      } else {
        console.error('❌ Failed to save moves:', response.message);
        setSaveStatus('Save Failed');
        setTimeout(() => setSaveStatus(''), 5000);
      }
    } catch (error) {
      console.error('❌ Error saving moves to database:', error);
      setSaveStatus('Save Error');
      setTimeout(() => setSaveStatus(''), 5000);
    }
  }, [activeChapter, tree, boardPosition, currentPath, currentMoveIndex, activeStudy]);

  // Cleanup function to fix existing moves with incorrect notation
  const cleanupMoveNotation = useCallback(async () => {
    if (!activeChapter) return;
    
    try {
      console.log('🔧 Cleaning up move notation for chapter:', activeChapter.name);
      
      // Get current state
      const fixedMoves = fixMoveNotation(tree.moves);
      
      // Update the tree with fixed moves
      const fixedTree = {
        ...tree,
        moves: fixedMoves
      };
      
      // Update the tree state
      setTree(fixedTree);
      setGameTree(fixedTree);
      
      // Save the cleaned moves to database
      await saveMovesToDatabase();
      
      console.log('✅ Move notation cleanup completed');
    } catch (error) {
      console.error('❌ Error during move notation cleanup:', error);
    }
  }, [activeChapter, fixMoveNotation, saveMovesToDatabase, tree]);

  // Analyze position when board position changes (exact same as CleanChessAnalysis)
  useEffect(() => {
    const analyzePosition = async () => {
      if (!isEngineReady || !boardPosition) return;

      console.log('🔍 ===== ENGINE ANALYSIS TRIGGERED =====');
      console.log('🔍 Board Position FEN:', boardPosition);
      console.log('🔍 Current Path:', currentPath);
      console.log('🔍 Current Move Index:', currentMoveIndex);
      console.log('🔍 In Variation?:', currentPath.length > 0);

      setIsAnalyzing(true);
      try {
        // Get engine evaluation
        console.log('🔍 Requesting evaluation for FEN:', boardPosition);
        const evaluation = await stockfishCloudService.getEvaluation(boardPosition);
        console.log('🔍 Engine evaluation received:', evaluation);
        setEngineEvaluation(evaluation);

        // Get engine moves
        console.log('🔍 Requesting engine moves for FEN:', boardPosition);
        const moves = await stockfishCloudService.analyzePosition(boardPosition, {
          depth: 15,
          multiPV: 3,
          timeLimit: 10000
        });
        console.log('🔍 Engine moves received:', moves);
        if (moves.length > 0) {
          console.log('🔍 First engine move:', moves[0]);
          console.log('🔍 First engine move SAN:', moves[0]?.san);
          console.log('🔍 Move properties:', Object.keys(moves[0]));
        }
        setEngineMoves(moves);

        // Get opening moves from Lichess API
        console.log('🔍 Loading opening data for FEN:', boardPosition);
        await loadOpeningData(boardPosition);
        console.log('🔍 ===== ENGINE ANALYSIS COMPLETE =====');
      } catch (error) {
        console.error('❌ Analysis failed:', error);
      } finally {
        setIsAnalyzing(false);
      }
    };

    // Debounce analysis to prevent too many requests
    const timeoutId = setTimeout(() => {
    analyzePosition();
    }, 1000); // Increased debounce to 1 second

    return () => clearTimeout(timeoutId);
  }, [boardPosition, isEngineReady, currentPath, currentMoveIndex, loadOpeningData]);

  // Save current game state for active chapter
  const saveCurrentChapterState = useCallback(() => {
    if (!activeChapter) return;
    
    const chapterState = {
      boardPosition,
      tree: tree,
      currentPath: currentPath,
      currentMoveIndex: currentMoveIndex,
      refreshKey
    };
    
    setChapterGameStates(prev => ({
      ...prev,
      [activeChapter._id]: chapterState
    }));
    
    console.log('💾 Saved game state for chapter:', activeChapter._id, chapterState);
  }, [activeChapter, boardPosition, tree, currentPath, currentMoveIndex, refreshKey]);

  // Restore game state for a chapter
  const restoreChapterState = useCallback((chapterId) => {
    const savedState = chapterGameStates[chapterId];
    if (savedState) {
      console.log('🔄 Restoring game state for chapter:', chapterId, savedState);
      
      // Restore the complete game tree state
      setTree(savedState.tree);
      setGameTree(savedState.tree);
      navigateToPosition(savedState.currentPath, savedState.currentMoveIndex);
      
      console.log('✅ Chapter state restored successfully!');
    }
  }, [chapterGameStates, navigateToPosition]);

  // Debug: Log tree changes
  useEffect(() => {
    console.log('🎯 EnhancedChessStudyPage: Tree changed:', {
      tree: tree,
      movesCount: tree?.moves?.length || 0,
      variationsCount: tree?.variations?.length || 0,
      movesWithVariations: tree?.moves?.filter(m => m.variations && m.variations.length > 0).length || 0
    });
    
    // Additional debugging for PGN import issues
    if (tree && tree.moves && tree.moves.length > 0) {
      console.log('✅ Tree has moves, first few:', tree.moves.slice(0, 3));
    } else {
      console.log('❌ Tree has no moves or is empty');
    }
  }, [tree]);

  // Bot move function - plays for the opponent side only
  const makeBotMove = useCallback(async () => {
    console.log('🤖 makeBotMove called - isBotMode:', isBotMode, 'isBotThinking:', isBotThinking, 'Player:', playerColor, 'Turn:', game.turn());
    
    if (!isBotMode || isBotThinking) {
      console.log('🤖 makeBotMove blocked - isBotMode:', isBotMode, 'isBotThinking:', isBotThinking);
      return;
    }
    
    // Only allow bot to play for the opponent side (not the player's side)
    if (game.turn() === playerColor) {
      console.log('🤖 Bot move blocked - it\'s the player\'s turn:', playerColor);
      return;
    }
    
    console.log('🤖 ✅ Proceeding with bot move - Player:', playerColor, 'Turn:', game.turn());
    setIsBotThinking(true);
    try {
      console.log('🤖 Making bot move for FEN:', boardPosition);
      
      // Use the same backend API approach as PlayWithBotPage
      const payload = {
        fen: boardPosition,
        difficulty: botDifficulty === 'beginner' ? 1000 : botDifficulty === 'intermediate' ? 1400 : 1800,
        personality: 'positional',
        timeControl: 'rapid'
      };

      console.log('🤖 Sending bot move request:', payload);

      const response = await fetch('http://localhost:3001/api/bot/move', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Bot move request failed: ${response.status}`);
      }

      const data = await response.json();
      console.log('🤖 Bot move response:', data);

      if (data.success && data.move) {
        // Create a temporary chess instance to parse the move
        const tempChess = new Chess(boardPosition);
        const moveObj = tempChess.move(data.move, { sloppy: true });

        if (moveObj) {
          // Use the FEN from the response for accuracy
          const finalFen = data.fen || tempChess.fen();
          const finalChess = new Chess(finalFen);

          console.log('🤖 Bot move executed:', moveObj.san);
          console.log('🤖 New FEN:', finalFen);

          // Update board position
          setBoardPosition(finalFen);
          setLocalBoardPosition(finalFen);
          
          // Add move to tree
          setTree(prevTree => {
            const newTree = JSON.parse(JSON.stringify(prevTree));
            if (currentPath.length === 0) {
              // Adding to mainline
              newTree.moves.push({ san: moveObj.san, variations: [] });
            } else {
              // Adding to variation
              const path = [...currentPath];
              let targetMoves = newTree.moves;
              
              for (let i = 0; i < path.length - 1; i++) {
                targetMoves = targetMoves[path[i]].variations[path[i + 1]].moves;
              }
              
              const lastPathIndex = path[path.length - 1];
              if (targetMoves[lastPathIndex] && targetMoves[lastPathIndex].variations) {
                const lastVariation = targetMoves[lastPathIndex].variations[targetMoves[lastPathIndex].variations.length - 1];
                lastVariation.moves.push({ san: moveObj.san, variations: [] });
              }
            }
            return newTree;
          });
          
          // Update move index
          setCurrentMoveIndex(prev => prev + 1);
          
          // Update game state
          setGame(finalChess);
        } else {
          console.error('🤖 Failed to execute bot move:', data.move);
        }
      } else {
        console.error('🤖 Bot move failed:', data.message);
      }
    } catch (error) {
      console.error('❌ Bot move failed:', error);
    } finally {
      setIsBotThinking(false);
    }
  }, [isBotMode, isBotThinking, boardPosition, botDifficulty, currentPath]);

  // Trigger bot's first move when bot mode is enabled and it's the bot's turn
  useEffect(() => {
    console.log('🤖 Checking first bot move - isBotMode:', isBotMode, 'playerColor:', playerColor, 'game.turn():', game.turn(), 'isBotThinking:', isBotThinking);
    if (isBotMode && !isBotThinking && game.turn() !== playerColor) {
      console.log('🤖 ✅ Triggering first bot move - Player:', playerColor, 'Turn:', game.turn());
      setTimeout(() => {
        makeBotMove();
      }, 1000); // Delay to show the bot is starting
    }
  }, [isBotMode, playerColor, isBotThinking, game, makeBotMove]);

  // Trigger bot move immediately when bot mode is enabled (if it's bot's turn)
  useEffect(() => {
    if (isBotMode && !isBotThinking && game.turn() !== playerColor) {
      console.log('🤖 Bot mode enabled - triggering immediate bot move - Player:', playerColor, 'Turn:', game.turn());
      setTimeout(() => {
        makeBotMove();
      }, 500); // Shorter delay for immediate response
    }
  }, [isBotMode]); // Only trigger when bot mode changes

  /**
   * CLEAN Handle piece drop on board (from SimplifiedChessBoardPage)
   */
  const handlePieceDrop = useCallback((sourceSquare, targetSquare) => {
    const gameCopy = new Chess(game.fen());
    
    try {
      const move = gameCopy.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: 'q' // Always promote to queen for simplicity
      });
      
      if (!move) return false;
      
      console.log('✅ Legal move:', move.san, 'from path:', currentPath, 'index:', currentMoveIndex);
      
      // Add move to tree
      let newPath = currentPath;
      let newMoveIndex = currentMoveIndex + 1;
      let shouldSkipTreeUpdate = false;
      
      setTree(prevTree => {
        const newTree = JSON.parse(JSON.stringify(prevTree));
        
        if (currentPath.length === 0) {
          // Adding to mainline
          const existingMove = newTree.moves[currentMoveIndex];
          
          if (!existingMove) {
            console.log('📝 Appending to mainline');
            newTree.moves.push({ san: move.san, variations: [] });
          } else if (existingMove.san !== move.san) {
            console.log('📝 Creating new variation from mainline');
            const parentMoveIndex = currentMoveIndex - 1;
            
            if (parentMoveIndex < 0) {
              if (!newTree.variations) newTree.variations = [];
              newTree.variations.push({ moves: [{ san: move.san, variations: [] }] });
              newPath = [-1, newTree.variations.length - 1];
              newMoveIndex = 1;
            } else if (parentMoveIndex >= 0) {
              const parentMove = newTree.moves[parentMoveIndex];
              if (!parentMove.variations) parentMove.variations = [];
              parentMove.variations.push({ moves: [{ san: move.san, variations: [] }] });
              newPath = [parentMoveIndex, parentMove.variations.length - 1];
              newMoveIndex = 1;
            }
          } else {
            shouldSkipTreeUpdate = true;
            newMoveIndex = currentMoveIndex + 1;
          }
        } else if (currentPath.length === 2 && currentPath[0] === -1) {
          // Root-level variation
          const varIndex = currentPath[1];
          const variation = newTree.variations[varIndex];
          const existingMove = variation.moves[currentMoveIndex];
          
          if (!existingMove) {
            variation.moves.push({ san: move.san, variations: [] });
          } else if (existingMove.san !== move.san) {
            const parentMoveIndex = currentMoveIndex - 1;
            if (parentMoveIndex >= 0) {
              const parentMove = variation.moves[parentMoveIndex];
              if (!parentMove.variations) parentMove.variations = [];
              parentMove.variations.push({ moves: [{ san: move.san, variations: [] }] });
              newPath = [-1, varIndex, parentMoveIndex, parentMove.variations.length - 1];
              newMoveIndex = 1;
            }
          } else {
            shouldSkipTreeUpdate = true;
            newMoveIndex = currentMoveIndex + 1;
          }
        } else if (currentPath.length === 2) {
          // First-level variation
          const branchPoint = currentPath[0];
          const varIndex = currentPath[1];
          const variation = newTree.moves[branchPoint].variations[varIndex];
          const existingMove = variation.moves[currentMoveIndex];
          
          if (!existingMove) {
            variation.moves.push({ san: move.san, variations: [] });
          } else if (existingMove.san !== move.san) {
            const parentMoveIndex = currentMoveIndex - 1;
            if (parentMoveIndex >= 0) {
              const parentMove = variation.moves[parentMoveIndex];
              if (!parentMove.variations) parentMove.variations = [];
              parentMove.variations.push({ moves: [{ san: move.san, variations: [] }] });
              newPath = [branchPoint, varIndex, parentMoveIndex, parentMove.variations.length - 1];
              newMoveIndex = 1;
            }
          } else {
            shouldSkipTreeUpdate = true;
            newMoveIndex = currentMoveIndex + 1;
          }
        } else if (currentPath.length === 4) {
          // Second-level variation
          const [bp1, vi1, bp2, vi2] = currentPath;
          const variation1 = newTree.moves[bp1].variations[vi1];
          const variation2 = variation1.moves[bp2].variations[vi2];
          const existingMove = variation2.moves[currentMoveIndex];
          
          if (!existingMove) {
            variation2.moves.push({ san: move.san, variations: [] });
          } else if (existingMove.san !== move.san) {
            const parentMoveIndex = currentMoveIndex - 1;
            if (parentMoveIndex >= 0) {
              const parentMove = variation2.moves[parentMoveIndex];
              if (!parentMove.variations) parentMove.variations = [];
              parentMove.variations.push({ moves: [{ san: move.san, variations: [] }] });
              newPath = [bp1, vi1, bp2, vi2, parentMoveIndex, parentMove.variations.length - 1];
              newMoveIndex = 1;
            }
          } else {
            shouldSkipTreeUpdate = true;
            newMoveIndex = currentMoveIndex + 1;
          }
        } else if (currentPath.length === 6) {
          // Third-level variation
          const [bp1, vi1, bp2, vi2, bp3, vi3] = currentPath;
          const variation1 = newTree.moves[bp1].variations[vi1];
          const variation2 = variation1.moves[bp2].variations[vi2];
          const variation3 = variation2.moves[bp3].variations[vi3];
          const existingMove = variation3.moves[currentMoveIndex];
          
          if (!existingMove) {
            variation3.moves.push({ san: move.san, variations: [] });
          } else if (existingMove.san !== move.san) {
            const parentMoveIndex = currentMoveIndex - 1;
            if (parentMoveIndex >= 0) {
              const parentMove = variation3.moves[parentMoveIndex];
              if (!parentMove.variations) parentMove.variations = [];
              parentMove.variations.push({ moves: [{ san: move.san, variations: [] }] });
              console.log('⚠️ Fourth-level created but full navigation not yet implemented');
            }
          } else {
            shouldSkipTreeUpdate = true;
            newMoveIndex = currentMoveIndex + 1;
          }
        }
        
        if (shouldSkipTreeUpdate) return prevTree;
        return newTree;
      });
      
      // Sync gameTree with tree
      setGameTree(prevTree => {
        const newTree = JSON.parse(JSON.stringify(tree));
        return shouldSkipTreeUpdate ? prevTree : newTree;
      });
      
      // Update game state
      setGame(gameCopy);
      setBoardPosition(gameCopy.fen());
      setLocalBoardPosition(gameCopy.fen());
      setCurrentPath(newPath);
      setCurrentMoveIndex(newMoveIndex);
      
      // Broadcast the move to other collaborators via WebSocket after tree update
      if (activeStudy && activeChapter && websocketService.isConnected() && !shouldSkipTreeUpdate) {
        setTimeout(() => {
          // Get the current tree state after the update
          const currentTree = tree;
        const moveData = {
            gameTree: currentTree,
          currentPath: newPath,
          currentMoveIndex: newMoveIndex
        };
        
          console.log('📡 Broadcasting move data:', moveData);
          console.log('📡 Tree being broadcast:', currentTree);
          console.log('📡 Tree moves count:', currentTree?.moves?.length || 0);
          console.log('📡 Tree variations count:', currentTree?.variations?.length || 0);
          
          // Check for variations in moves
          if (currentTree?.moves) {
            const movesWithVariations = currentTree.moves.filter(m => m.variations && m.variations.length > 0);
            console.log('📡 Moves with variations being broadcast:', movesWithVariations.length);
            if (movesWithVariations.length > 0) {
              console.log('📡 First move with variations being broadcast:', movesWithVariations[0]);
            }
        }
        
        websocketService.broadcastMove(activeStudy, activeChapter._id, moveData, gameCopy.fen());
        }, 200); // Increased delay to ensure tree is updated
      }
      
      // Save the move to database after a short delay
      if (!shouldSkipTreeUpdate) {
        setTimeout(async () => {
          if (activeChapter) {
            try {
              const pgn = convertTreeToPGN(tree);
              const moveData = {
                pgn: pgn,
                position: gameCopy.fen(),
                gameTree: tree,
                currentPath: newPath,
                currentMoveIndex: newMoveIndex,
                lastSaved: new Date().toISOString(),
                chapterName: activeChapter.name,
                chapterId: activeChapter._id,
                studyId: activeStudy,
                moveCount: tree.moves?.length || 0
              };
              const response = await chapterService.saveMoves(activeChapter._id, moveData);
              console.log('💾 Move saved:', response.success);
            } catch (error) {
              console.error('❌ Save error:', error);
            }
          }
        }, 500);
      }
      
      // Trigger bot move if in bot mode and it's not the player's turn
      // (This maintains the original behavior for automatic moves)
      console.log('🤖 Checking bot trigger - Player:', playerColor, 'gameCopy.turn():', gameCopy.turn(), 'game.turn():', game.turn(), 'isBotMode:', isBotMode, 'isBotThinking:', isBotThinking);
      if (isBotMode && gameCopy.turn() !== playerColor && !isBotThinking) {
        console.log('🤖 ✅ Auto-triggering bot move - Player:', playerColor, 'Turn:', gameCopy.turn());
        setTimeout(() => {
          makeBotMove();
        }, 500); // Small delay for better UX
      } else {
        console.log('🤖 ❌ Bot move NOT triggered - conditions not met');
      }
      
      return true;
    } catch (error) {
      console.error('Invalid move:', error);
      return false;
    }
  }, [game, currentPath, currentMoveIndex, tree, activeStudy, activeChapter, isBotMode, playerColor, isBotThinking, makeBotMove]);

  // Debug active chapter on load
  useEffect(() => {
    console.log('🔍 Component loaded, checking initial state:', {
      hasActiveChapter: !!activeChapter,
      chapterId: activeChapter?._id,
      chapterName: activeChapter?.name,
      studiesCount: studies.length
    });
  }, [activeChapter, studies]);


  // Auto-save moves when tree changes (with debouncing)
  useEffect(() => {
    console.log('Auto-save check:', {
      hasActiveChapter: !!activeChapter,
      hasTreeMoves: !!(tree.moves && tree.moves.length > 0),
      movesCount: tree.moves ? tree.moves.length : 0,
      chapterId: activeChapter?._id,
      treeData: tree,
      isCreatingNewChapter: isCreatingNewChapter
    });
    
    if (activeChapter && tree.moves && tree.moves.length > 0 && !isCreatingNewChapter) {
      console.log('Auto-saving moves to database...');
      
      // Save with debouncing
      const saveTimeout = setTimeout(async () => {
        try {
          // Debug variations before auto-saving
          if (tree?.moves) {
            const movesWithVariations = tree.moves.filter(m => m.variations && m.variations.length > 0);
            console.log('💾 [AUTO-SAVE] Moves with variations:', movesWithVariations.length);
            if (movesWithVariations.length > 0) {
              console.log('💾 [AUTO-SAVE] First move with variations:', movesWithVariations[0]);
              console.log('💾 [AUTO-SAVE] Variations structure:', movesWithVariations[0].variations);
            } else {
              console.log('❌ [AUTO-SAVE] NO VARIATIONS FOUND IN TREE BEFORE AUTO-SAVING!');
            }
          }
          
          // Convert the clean game tree to PGN format
          const pgn = convertTreeToPGN(tree);
          
          console.log('💾 Auto-saving chapter data for:', activeChapter.name);
          console.log('💾 Chapter ID:', activeChapter._id);
          console.log('💾 Moves count:', tree.moves ? tree.moves.length : 0);
          console.log('💾 PGN:', pgn);
          
          // Enhanced move data for better chapter isolation
          const moveData = {
            pgn: pgn,
            position: boardPosition,
            gameTree: tree,
            currentPath: currentPath,
            currentMoveIndex: currentMoveIndex,
            lastSaved: new Date().toISOString(),
            chapterName: activeChapter.name,
            chapterId: activeChapter._id,
            studyId: activeStudy,
            moveCount: tree.moves ? tree.moves.length : 0
          };
          
          console.log('💾 Auto-save move data:', moveData);
          
          // Use the dedicated save-moves endpoint
          const response = await chapterService.saveMoves(activeChapter._id, moveData);
          console.log('💾 Auto-save response:', response);
          
          if (response.success) {
            console.log('✅ Auto-save successful for chapter:', activeChapter._id);
          } else {
            console.error('❌ Auto-save failed:', response.message);
            setSaveStatus('Save Failed');
            setTimeout(() => setSaveStatus(''), 5000);
          }
        } catch (error) {
          console.error('❌ Auto-save error:', error);
          setSaveStatus('Save Error');
          setTimeout(() => setSaveStatus(''), 5000);
        }
      }, 1000); // Increased delay to avoid too frequent saves
      
      return () => clearTimeout(saveTimeout);
    }
  }, [tree.moves?.length, activeChapter?._id, boardPosition, currentPath, currentMoveIndex, activeStudy, tree, isCreatingNewChapter]);

  // Load studies
  const loadStudies = async () => {
    try {
      const token = localStorage.getItem('token');
      const user = localStorage.getItem('user');
      
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await studyService.getStudies();
      
      if (response.success && response.data) {
        setStudies(response.data);
        
        if (response.data.length > 0 && !activeStudy) {
          const firstStudy = response.data[0];
          setActiveStudy(firstStudy._id);
          
          // Auto-select first chapter if available
          if (firstStudy.chapters && firstStudy.chapters.length > 0) {
            const firstChapter = firstStudy.chapters[0];
            await handleChapterSelect(firstChapter._id);
          }
        }
      } else {
        console.error('Failed to load studies:', response.message);
        console.error('Full response:', response);
        setStudies([]);
      }
    } catch (error) {
      console.error('Error loading studies:', error);
      console.error('Error details:', error.message);
      setStudies([]);
    } finally {
      setLoading(false);
    }
  };

  // Check if a token is a valid chess move - SAME AS CHESSSTUDYVIEWER
  const isValidMove = useCallback((token) => {
    const standardMovePattern = /^[KQRBN]?[a-h]?[1-8]?x?[a-h][1-8](?:=[QRBN])?[+#]?$/;
    const castlingPattern = /^O-O(-O)?(\+|#)?$/;
    const longAlgebraicPattern = /^[a-h][1-8][a-h][1-8](?:[QRBN])?[+#]?$/;

    return standardMovePattern.test(token) || 
           castlingPattern.test(token) || 
           longAlgebraicPattern.test(token);
  }, []);

  // Parse variation moves from text - SAME AS CHESSSTUDYVIEWER
  const parseVariationMoves = useCallback((text, game) => {
    console.log('🔍 Parsing variation moves from:', text);
    const moves = [];
    const tokens = text.trim().split(/\s+/);
    
    for (const token of tokens) {
      if (token && isValidMove(token)) {
        // Validate the move against the current chess position
        try {
          const result = game.move(token);
          if (result) {
            console.log(`✅ Valid variation move: ${token} -> ${game.fen()}`);
            moves.push(token);
          } else {
            console.warn(`⚠️ Invalid variation move: ${token} at position ${game.fen()}`);
            // Still add the move but log the warning
        moves.push(token);
          }
        } catch (error) {
          console.warn(`⚠️ Error validating variation move: ${token}`, error);
          // Still add the move but log the error
          moves.push(token);
        }
      }
    }
    
    console.log('✅ Parsed variation moves:', moves);
    return moves;
  }, [isValidMove]);

  // Parse move tree with variations - FIXED TO HANDLE VARIATIONS CORRECTLY
  const parseMoveTree = useCallback((text, startingPosition = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1') => {
    console.log('🔍 Parsing move tree with variations:', text.substring(0, 200) + '...');
    console.log('🎯 Starting position for move parsing:', startingPosition);
    
    // Create a chess game instance with the custom starting position
    const game = new Chess();
    try {
      if (startingPosition && startingPosition !== 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1') {
        game.load(startingPosition);
        console.log('✅ Chess game loaded with custom starting position:', startingPosition);
      } else {
        game.reset();
        console.log('✅ Chess game reset to initial position');
      }
    } catch (error) {
      console.warn('⚠️ Failed to load starting position, using initial position:', error);
      game.reset();
    }
    
    const root = { move: null, mainLine: [], variations: {} };
    let i = 0;

    function parseSequence(startIndex = 0) {
      const moves = [];
      let index = startIndex;

      while (index < text.length) {
        const char = text[index];

        if (char === '(') {
          // Start a variation - it belongs to the last move
          if (moves.length > 0) {
            const lastMove = moves[moves.length - 1];
            const varStart = index + 1;
            let depth = 1;
            let varEnd = varStart;
            index++;

            while (index < text.length && depth > 0) {
              if (text[index] === '(') depth++;
              if (text[index] === ')') depth--;
              if (depth > 0) varEnd++;
              index++;
            }

            const varText = text.substring(varStart, varEnd);
            console.log('🔍 Found variation text:', varText);
            console.log('🔍 Variation after move:', lastMove);
            
            if (!root.variations[lastMove]) {
              root.variations[lastMove] = [];
            }
            
            // CRITICAL FIX: Clone the game state BEFORE the last move to parse the variation
            // Variations branch from the position BEFORE the last move was made
            const variationGame = new Chess();
            // We need to replay all moves except the last one to get to the right position
            variationGame.load(startingPosition);
            for (let i = 0; i < moves.length - 1; i++) {
              try {
                variationGame.move(moves[i]);
              } catch (e) {
                console.warn('Error replaying move for variation:', moves[i], e);
              }
            }
            
            console.log('🔍 Parsing variation from position:', variationGame.fen());
            // Parse the variation text into moves from the correct position
            const variationMoves = parseVariationMoves(varText, variationGame);
            console.log('🔍 Variation moves parsed:', variationMoves);
            root.variations[lastMove].push({ mainLine: variationMoves, variations: {} });
          } else {
            index++; // Skip opening parenthesis if no preceding move
          }
        } else if (char === ')') {
          index++;
          break; // End of current variation/main line
        } else if (/\s/.test(char)) {
          index++; // Skip whitespace
        } else {
          let move = '';
          while (index < text.length && !/[\s()]/g.test(text[index])) {
            move += text[index];
            index++;
          }

          if (move && move !== '*' && !move.match(/^(1-0|0-1|1\/2-1\/2)$/) && !move.match(/^\d+\.$/)) {
            // Skip move numbers like "1.", "2.", etc.
            if (!move.match(/^\d+\.$/)) {
              // Validate the move against the current chess position
              try {
                const result = game.move(move);
                if (result) {
                  console.log(`✅ Valid move: ${move} -> ${game.fen()}`);
                  moves.push(move);
                } else {
                  console.warn(`⚠️ Invalid move: ${move} at position ${game.fen()}`);
                  // Still add the move but log the warning
              moves.push(move);
                }
              } catch (error) {
                console.warn(`⚠️ Error validating move: ${move}`, error);
                // Still add the move but log the error
                moves.push(move);
              }
            }
          }
        }
      }

      return { move: null, mainLine: moves, variations: root.variations };
    }

    const tree = parseSequence(0);
    console.log('✅ Parsed tree:', tree);
    console.log('📊 Main line moves:', tree.mainLine.length);
    console.log('📊 Variations found:', Object.keys(tree.variations).length);
    console.log('📊 Variation details:', tree.variations);

    // Convert to the format expected by GameTreeNotation
    return convertToGameTreeFormat(tree);
  }, [parseVariationMoves]);

  // Convert parsed tree to GameTreeNotation format - SAME AS CHESSSTUDYVIEWER
  const convertToGameTreeFormat = useCallback((tree) => {
    console.log('🔄 Converting tree to GameTreeNotation format:', tree);
    console.log('🔍 tree.variations object:', tree.variations);
    console.log('🔍 tree.variations keys:', tree.variations ? Object.keys(tree.variations) : 'none');
    console.log('🔍 tree.mainLine:', tree.mainLine);
    
    const moves = [];
    const variations = [];
    let variationId = 0;

    // Check if tree and mainLine exist
    if (!tree || !tree.mainLine || !Array.isArray(tree.mainLine)) {
      console.error('❌ Invalid tree structure:', tree);
      return {
        moves: [],
        variations: [],
        currentMove: 0
      };
    }

    // Process main line moves
    tree.mainLine.forEach((moveNotation, index) => {
      // Find variations for this move
      const moveVariations = (tree.variations && tree.variations[moveNotation]) || [];
      
      console.log(`🔍 Move ${index}: ${moveNotation}, variations found:`, moveVariations.length);
      if (moveVariations.length > 0) {
        console.log(`🔍 Variation details for ${moveNotation}:`, moveVariations);
      }
      
      // Convert variations to the expected format
      const processedVariations = moveVariations.map((variation, varIndex) => {
        // Check if variation has mainLine
        if (!variation || !variation.mainLine || !Array.isArray(variation.mainLine)) {
          console.warn('⚠️ Invalid variation structure:', variation);
          return {
            id: `variation-${variationId++}`,
            moves: [],
            parentMoveIndex: index,
            depth: 1
          };
        }

        const variationMoves = variation.mainLine.map((varMove, varMoveIndex) => {
          console.log('🔍 Creating variation move object:', varMove);
          const moveObj = {
            san: varMove,
            variations: []
          };
          console.log('🔍 Variation move object created:', moveObj);
          return moveObj;
        });

        const varObj = {
          moves: variationMoves
        };
        console.log('🔍 Variation object created with', variationMoves.length, 'moves');
        return varObj;
      });

      console.log('🔍 Processing mainline move:', moveNotation);
      const mainMoveObj = {
        san: moveNotation,
        variations: processedVariations
      };
      console.log('🔍 Mainline move object created:', mainMoveObj);
      moves.push(mainMoveObj);
    });

    console.log('🔄 Converted to GameTreeNotation format:');
    console.log('📊 Total moves:', moves.length);
    console.log('📊 Moves with variations:', moves.filter(m => m.variations.length > 0).length);
    console.log('🔍 Sample move structure:', moves[0]);
    console.log('🔍 First move san:', moves[0]?.san);
    console.log('🔍 Sample variation structure:', moves.find(m => m.variations.length > 0)?.variations[0]);

    const result = {
      moves: moves,
      variations: variations,
      currentMove: moves.length
    };
    console.log('🔍 Returning tree:', result);
    return result;
  }, []);

  // Parse PGN and create move tree - SAME AS CHESSSTUDYVIEWER
  const parsePGN = useCallback((pgn, startingPosition = null) => {
    console.log('🔍 Parsing PGN...');
    console.log('📝 PGN length:', pgn.length);
    console.log('🎯 Starting position:', startingPosition);
    
    if (!pgn || pgn.trim().length === 0) {
      throw new Error('Empty PGN provided');
    }
    
    const lines = pgn.split('\n');
    const metadata = {};
    let moveText = '';

    for (let line of lines) {
      if (line.startsWith('[')) {
        const match = line.match(/\[(\w+)\s"([^"]+)"\]/);
        if (match) metadata[match[1]] = match[2];
      } else {
        moveText += ' ' + line;
      }
    }

    // Extract FEN from metadata if not provided
    const fenPosition = startingPosition || metadata.FEN || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    console.log('🎯 Using FEN position:', fenPosition);

    // Clean move text
    moveText = moveText
      .replace(/\d+\./g, '') // Remove move numbers
      .replace(/\{\[%[^\]]*\]\}/g, '') // Remove annotations
      .replace(/\{[^}]*\}/g, '') // Remove comments
      .replace(/\s+/g, ' ') // Normalize spaces
      .trim();

    console.log('📝 Cleaned move text:', moveText.substring(0, 200) + '...');
    
    if (!moveText || moveText.length === 0) {
      throw new Error('No moves found in PGN');
    }

    const tree = parseMoveTree(moveText, fenPosition);
    
    if (!tree) {
      throw new Error('Failed to parse move tree');
    }
    
    return tree;
  }, [parseMoveTree]);

  // Load PGN into game tree - NOW USING CHESSSTUDYVIEWER LOGIC
  const loadPGNIntoTree = useCallback(async (pgn, startingPosition = null) => {
    if (!pgn) return;
    
    try {
      console.log('🔄 Loading PGN into tree using ChessStudyViewer logic:', pgn);
      console.log('🎯 Starting position:', startingPosition);
      
      // Reset the game tree first
      reset();
      
      // Use the exact same parsing logic as ChessStudyViewer with starting position
      const gameTree = parsePGN(pgn, startingPosition);
      
      console.log('✅ PGN parsed successfully:', gameTree);
      console.log('📊 Total moves:', gameTree.moves.length);
      console.log('📊 Total variations:', gameTree.variations.length);
      
      if (gameTree.moves.length === 0) {
        console.error('❌ NO MOVES FOUND IN GAME TREE!');
        alert('No moves found in PGN. Please check the format.');
        return;
      }
      
      // Debug: Log the game tree before restoring
      console.log('🔍 Game tree before restore:', gameTree);
      console.log('🔍 Game tree moves:', gameTree.moves);
      console.log('🔍 Game tree variations:', gameTree.variations);
      
      // Restore the complete game tree with variations
      setTree(gameTree);
      setGameTree(gameTree);
      navigateToPosition([], 0);
      
      // Set the board position to the starting position
      if (startingPosition) {
        console.log('🎯 Setting board to starting position after restore:', startingPosition);
        setBoardPosition(startingPosition);
        setLocalBoardPosition(startingPosition);
      }
      
      console.log('✅ PGN loaded successfully with variations');
      console.log('📊 Final moves count:', gameTree.moves.length);
      console.log('📊 Final variations count:', gameTree.variations.length);
      
    } catch (error) {
      console.error('❌ Error loading PGN into tree:', error);
      alert(`Error loading PGN: ${error.message}`);
    }
  }, [reset, parsePGN, navigateToPosition]);

  // Load chapter state with improved error handling and state restoration
  const loadChapterState = async (chapterId) => {
    if (!chapterId || !activeStudy) {
      console.log('Cannot load chapter: missing chapterId or activeStudy');
      return;
    }
    
    setLoadingChapter(true);
    try {
      console.log('=== CHAPTER SELECTION DEBUG ===');
      console.log('Selected chapter ID:', chapterId);
      console.log('Active study ID:', activeStudy);
      
      const response = await chapterService.getChapter(activeStudy, chapterId);
      console.log('=== RAW API RESPONSE ===');
      console.log('Full API response:', response);
      
      // Handle different response structures
      let chapter;
      if (response.success && response.chapter) {
        chapter = response.chapter;
      } else if (response.success && response.data) {
        chapter = response.data;
      } else if (response._id) {
        // Direct chapter object response
        chapter = response;
      } else {
        throw new Error('Invalid chapter response structure');
      }
      
      console.log('=== CHAPTER DATA ANALYSIS ===');
      console.log('Chapter loaded from database:', chapter);
      console.log('Chapter name:', chapter.name);
      console.log('Chapter ID:', chapter._id);
      console.log('Chapter studyId:', chapter.studyId);
      console.log('Chapter lastSaved:', chapter.lastSaved);
      console.log('Chapter gameTree:', chapter.gameTree);
      console.log('Chapter gameTree.moves:', chapter.gameTree?.moves);
      console.log('Chapter gameTree.moves.length:', chapter.gameTree?.moves?.length || 0);
      console.log('Chapter PGN:', chapter.pgn);
      
      // Detailed move structure analysis
      if (chapter.gameTree?.moves) {
        console.log('=== MOVE STRUCTURE ANALYSIS ===');
        console.log('Moves array type:', typeof chapter.gameTree.moves);
        console.log('Moves is array?', Array.isArray(chapter.gameTree.moves));
        console.log('Moves count:', chapter.gameTree.moves.length);
        
        // Log first 3 moves with detailed structure
        chapter.gameTree.moves.forEach((move, idx) => {
          if (idx < 3) {
            console.log(`=== MOVE ${idx} ANALYSIS ===`);
            console.log('Move object:', move);
            console.log('Move keys:', Object.keys(move));
            console.log('Has notation:', 'notation' in move);
            console.log('Has move:', 'move' in move);
            console.log('Has from:', 'from' in move);
            console.log('Has to:', 'to' in move);
            console.log('Notation value:', move.notation);
            console.log('Move value:', move.move);
            console.log('From value:', move.from);
            console.log('To value:', move.to);
          }
        });
      } else {
        console.log('=== NO MOVES FOUND ===');
        console.log('gameTree exists:', !!chapter.gameTree);
        console.log('gameTree type:', typeof chapter.gameTree);
        console.log('gameTree.moves exists:', !!chapter.gameTree?.moves);
      }
        
      // Verify chapter belongs to the correct study for puppy safety
      if (chapter.studyId && chapter.studyId !== activeStudy) {
        console.error('CRITICAL ERROR: Chapter belongs to different study!', {
          chapterStudyId: chapter.studyId,
          activeStudy: activeStudy,
          chapterId: chapterId
        });
        throw new Error('Chapter does not belong to the active study');
      }
      
      // Set the active chapter first
      setActiveChapter(chapter);
      
      // Load the chapter's moves - prioritize gameTree over PGN for better state restoration
      if (chapter.gameTree && chapter.gameTree.moves && chapter.gameTree.moves.length > 0) {
        console.log('=== GAME TREE RESTORATION DEBUG ===');
        console.log('Loading chapter gameTree for:', chapter.name);
        console.log('Moves count:', chapter.gameTree.moves.length);
        console.log('Current path:', chapter.currentPath || []);
        console.log('Current move index:', chapter.currentMoveIndex || 0);
        console.log('Raw gameTree object:', chapter.gameTree);
        
        // Ensure moves have proper notation property and are properly formatted
        const processedGameTree = {
          ...chapter.gameTree,
          moves: fixMoveNotation(chapter.gameTree.moves).map((move, index) => ({
            ...move,
            // Ensure each move has a unique ID for proper tracking
            id: move.id || `move-${chapter._id}-${index}`,
            // Add chapter reference for isolation
            chapterId: chapter._id,
            studyId: activeStudy
          }))
        };
        
        console.log('=== PROCESSED GAME TREE DEBUG ===');
        console.log('Processed game tree:', processedGameTree);
        console.log('Processed moves count:', processedGameTree.moves.length);
        console.log('First processed move:', processedGameTree.moves[0]);
        
        // Check for variations
        const movesWithVariations = processedGameTree.moves.filter(m => m.variations?.length > 0);
        console.log('🔍 [DB LOAD] Moves with variations:', movesWithVariations.length);
        if (movesWithVariations.length > 0) {
          console.log('🔍 [DB LOAD] ✅ First move with variations:', movesWithVariations[0].notation || movesWithVariations[0].san);
          console.log('🔍 [DB LOAD] ✅ Variations array:', movesWithVariations[0].variations);
          console.log('🔍 [DB LOAD] ✅ First variation:', movesWithVariations[0].variations[0]);
          console.log('🔍 [DB LOAD] ✅ First variation moves:', movesWithVariations[0].variations[0]?.moves);
        } else {
          console.log('❌ [DB LOAD] NO VARIATIONS FOUND IN LOADED CHAPTER!');
          console.log('❌ [DB LOAD] Sample moves from DB:', processedGameTree.moves.slice(0, 3).map(m => ({
            notation: m.notation || m.san,
            hasVariations: !!m.variations,
            variationsLength: m.variations?.length || 0
          })));
        }
        console.log('About to restore game tree with:', {
          tree: processedGameTree,
          path: chapter.currentPath || [],
          moveIndex: chapter.currentMoveIndex || 0
        });
        
        // Restore the complete game tree state
        setTree(processedGameTree);
        setGameTree(processedGameTree);
        navigateToPosition([], 0); // Always start at the beginning
        
        // Set the board position to the chapter's starting position if it exists
        if (chapter.position) {
          console.log('🎯 Setting board to chapter starting position:', chapter.position);
          setBoardPosition(chapter.position);
          setLocalBoardPosition(chapter.position);
        }
        
        // Verify restoration worked
        console.log('=== RESTORATION VERIFICATION ===');
        console.log('✅ Chapter moves restored successfully!');
        console.log('✅ Restored moves count:', processedGameTree?.moves?.length || 0);
        console.log('✅ Restored tree object:', processedGameTree);
        console.log('✅ Current path:', currentPath);
        console.log('✅ Current move index:', currentMoveIndex);
        
        // Additional verification
        if (processedGameTree?.moves?.length > 0) {
          console.log('✅ First restored move:', processedGameTree.moves[0]);
          console.log('✅ First move notation:', processedGameTree.moves[0]?.notation);
          console.log('✅ First move move:', processedGameTree.moves[0]?.move);
        } else {
          console.error('❌ ERROR: No moves found in restored state!');
        }
      } else if (chapter.pgn && chapter.pgn.trim()) {
        console.log('Loading chapter PGN for:', chapter.name);
        console.log('PGN:', chapter.pgn);
        console.log('Chapter position:', chapter.position);
        await loadPGNIntoTree(chapter.pgn, chapter.position);
        console.log('Chapter PGN loaded successfully!');
      } else {
        // No moves saved, start fresh
        console.log('No moves found for chapter:', chapter.name, '- starting fresh');
        reset();
      }
      
      // Update chapter game states for proper isolation
      setChapterGameStates(prev => ({
        ...prev,
        [chapterId]: {
          boardPosition,
          tree: tree,
          currentPath: currentPath,
          currentMoveIndex: currentMoveIndex,
          refreshKey: refreshKey,
          chapterId: chapterId,
          studyId: activeStudy,
          lastLoaded: new Date().toISOString()
        }
      }));
      
      console.log('Chapter state loaded successfully for:', chapterId);
      setSaveStatus(`Chapter "${chapter.name}" loaded successfully`);
      setTimeout(() => setSaveStatus(''), 2000);
    } catch (error) {
      console.error('Error loading chapter:', error);
      setSaveStatus('Load error occurred');
      setTimeout(() => setSaveStatus(''), 3000);
    } finally {
      setLoadingChapter(false);
    }
  };

  // Handle chapter selection with proper save before switching - ENHANCED FOR PUPPY SAFETY! 🐕
  const handleChapterSelect = async (chapterId) => {
    console.log('🐕🔄 Switching to chapter:', chapterId, '- PUPPIES DEPEND ON THIS!');
    
    // Don't switch if it's the same chapter
    if (activeChapter && activeChapter._id === chapterId) {
      console.log('🐕 Same chapter selected, no action needed - PUPPIES SAFE!');
      return;
    }
    
    setLoadingChapter(true);
    try {
      // First, save current chapter state if there's an active chapter
      if (activeChapter) {
        console.log('🐕💾 Saving current chapter state before switching...');
        console.log('🐕💾 Current chapter:', activeChapter.name, activeChapter._id);
        console.log('🐕💾 Current moves count:', tree.moves?.length || 0);
        
        // Save current state to local storage for this chapter
        saveCurrentChapterState();
        
        // Save to database - ALWAYS save current state, even if no moves
        console.log('🐕💾 Saving current state to database for chapter:', activeChapter.name);
        console.log('🐕💾 Current moves count:', tree.moves?.length || 0);
        console.log('🐕💾 Current state:', { tree, currentPath, currentMoveIndex });
        
        await saveMovesToDatabase();
        
        // Wait a bit to ensure save completes
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      // Always load from database to ensure we have the latest data
      console.log('🐕🔄 Loading chapter from database:', chapterId, '- PUPPIES DEPEND ON THIS!');
      await loadChapterState(chapterId);
      
      // Verify the chapter was loaded with moves
      console.log('🐕🔍 Verifying loaded chapter has moves...');
      console.log('🐕🔍 Active chapter after loadChapterState:', activeChapter);
      console.log('🐕🔍 Active chapter gameTree:', activeChapter?.gameTree);
      console.log('🐕🔍 Active chapter moves count:', activeChapter?.gameTree?.moves?.length || 0);
      
      // Display moves in console for debugging
      if (activeChapter?.gameTree?.moves?.length > 0) {
        console.log('🎯 MOVES FOUND IN CHAPTER:');
        activeChapter.gameTree.moves.forEach((move, index) => {
          console.log(`Move ${index + 1}:`, move.notation || move.move || move.san, 'from', move.from, 'to', move.to);
        });
      } else {
        console.log('❌ NO MOVES FOUND IN CHAPTER!');
        console.log('Chapter structure:', activeChapter);
      }
      
      // NOTE: loadChapterState already sets the active chapter with moves from database
      // Don't override it with local studies state that doesn't have moves!
      console.log('🐕✅ Chapter loaded from database with moves - PUPPIES SAFE!');
      
      // Ensure chapter isolation by clearing any cross-chapter state
      console.log('🐕🔒 Ensuring chapter isolation...');
      
      // Update studies state to reflect the active chapter
      setStudies(prevStudies => 
        prevStudies.map(study => 
          study._id === activeStudy 
            ? {
                ...study,
                chapters: study.chapters.map(chapter => 
                  chapter._id === chapterId 
                    ? { ...chapter, isActive: true, lastAccessed: new Date().toISOString() }
                    : { ...chapter, isActive: false }
                )
              }
            : study
        )
      );
      
      // Broadcast chapter change to other collaborators
      if (activeStudy && websocketService.isConnected()) {
        const newChapter = studies.find(s => s._id === activeStudy)?.chapters?.find(c => c._id === chapterId);
        if (newChapter) {
          console.log('🐕📡 Broadcasting chapter change to collaborators:', {
            studyId: activeStudy,
            chapterId: chapterId,
            chapterName: newChapter.name
          });
          
          websocketService.broadcastChapterChange(activeStudy, chapterId, newChapter.name);
        }
      }
      
      console.log('Chapter switch completed successfully');
    } catch (error) {
      console.error('Error switching chapters:', error);
      setSaveStatus('Switch failed');
      setTimeout(() => setSaveStatus(''), 3000);
    } finally {
      setLoadingChapter(false);
    }
  };

  // Initialize WebSocket connection
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      console.log('Initializing WebSocket connection...');
      websocketService.connect(token);
      
      // Set up WebSocket callbacks for real-time collaboration
      websocketService.setCallbacks({
        onConnectionChange: (connected) => {
          console.log('🔌 WebSocket connection status:', connected);
          if (connected && activeStudy) {
            // Join the study room when connected
            websocketService.joinStudy(activeStudy);
          }
        },
        onMoveReceived: (payload) => {
          console.log('🎯 Received move from collaborator:', payload);
          console.log('🎯 MoveData structure:', payload.moveData);
          console.log('🎯 GameTree in moveData:', payload.moveData?.gameTree);
          console.log('🎯 CurrentPath in moveData:', payload.moveData?.currentPath);
          console.log('🎯 CurrentMoveIndex in moveData:', payload.moveData?.currentMoveIndex);
          
          if (payload.studyId === activeStudy && payload.chapterId === activeChapter?._id) {
            console.log('✅ Processing move for current study and chapter');
            
            // Apply the received move to the game tree
            if (payload.moveData && payload.position) {
              console.log('🔄 Setting tree to:', payload.moveData.gameTree);
              console.log('🔄 Tree has moves:', payload.moveData.gameTree?.moves?.length || 0);
              console.log('🔄 Tree has variations:', payload.moveData.gameTree?.variations?.length || 0);
              
              // Check for variations in moves
              if (payload.moveData.gameTree?.moves) {
                const movesWithVariations = payload.moveData.gameTree.moves.filter(m => m.variations && m.variations.length > 0);
                console.log('🔄 Moves with variations:', movesWithVariations.length);
                if (movesWithVariations.length > 0) {
                  console.log('🔄 First move with variations:', movesWithVariations[0]);
                }
              }
              
              // Restore the game tree to the received state
              setTree(payload.moveData.gameTree);
              setGameTree(payload.moveData.gameTree);
              
              // Update current path and move index BEFORE navigating
              setCurrentPath(payload.moveData.currentPath);
              setCurrentMoveIndex(payload.moveData.currentMoveIndex);
              
              // Force a refresh to ensure the UI updates
              setRefreshKey(prev => prev + 1);
              
              // Update the board position only if it changed
              if (payload.position && payload.position !== boardPosition) {
              setBoardPosition(payload.position);
              setLocalBoardPosition(payload.position);
              }
              
              console.log('✅ Move applied successfully from collaborator');
            }
          }
        },
        onPositionReceived: (payload) => {
          console.log('📍 Received position update:', payload);
          if (payload.studyId === activeStudy && payload.chapterId === activeChapter?._id) {
            console.log('✅ Processing position update for current study and chapter');
            
            // Update the board position only if it changed
            if (payload.position && payload.position !== boardPosition) {
              setBoardPosition(payload.position);
              setLocalBoardPosition(payload.position);
            }
            
            // Update the game state if provided
            if (payload.gameState) {
              setTree(payload.gameState.tree);
              setGameTree(payload.gameState.tree);
              
              // Update current path and move index
              setCurrentPath(payload.gameState.currentPath);
              setCurrentMoveIndex(payload.gameState.currentMoveIndex);
            }
            
            console.log('✅ Position updated successfully from collaborator');
          }
        },
        onChapterReceived: (payload) => {
          console.log('📖 Received chapter change:', payload);
          if (payload.studyId === activeStudy) {
            console.log('✅ Processing chapter change for current study');
            
            // Switch to the new chapter
            if (payload.chapterId && payload.chapterId !== activeChapter?._id) {
              handleChapterSelect(payload.chapterId);
            }
            
            console.log('✅ Chapter change processed successfully');
          }
        },
        onUserJoined: (payload) => {
          console.log('👤 User joined study:', payload);
          if (payload.studyId === activeStudy) {
            // Removed annoying notification - just log it
            console.log(`👤 ${payload.username || 'User'} joined the study`);
          }
        },
        onUserLeft: (payload) => {
          console.log('👋 User left study:', payload);
          if (payload.studyId === activeStudy) {
            // Removed annoying notification - just log it
            console.log(`👋 ${payload.username || 'User'} left the study`);
          }
        }
      });
    }

    return () => {
      websocketService.disconnect();
    };
  }, [activeStudy, activeChapter]);

  // Join study room when activeStudy changes
  useEffect(() => {
    if (activeStudy && websocketService.isConnected()) {
      console.log('🔌 Joining study room:', activeStudy);
      websocketService.joinStudy(activeStudy);
    }
  }, [activeStudy]);

  // Load studies on component mount
  useEffect(() => {
    loadStudies();
    loadNotifications();
  }, []);

  // Reload notifications when username changes
  useEffect(() => {
    if (currentUsername) {
      console.log('🔄 USERNAME CHANGED TO:', currentUsername);
      loadNotifications();
    }
  }, [currentUsername]);

  // Load notifications from backend API
  const loadNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('No token found, skipping notification load');
        setNotifications([]);
        return;
      }

      console.log('📧 Loading notifications from backend for user:', currentUsername);
      
      const response = await fetch('http://localhost:3001/api/collaboration/notifications', {
        headers: {
          'x-auth-token': token
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.notifications) {
          setNotifications(result.notifications);
          console.log('📧 Loaded notifications from backend:', result.notifications.length);
        } else {
          console.log('📧 No notifications from backend');
          setNotifications([]);
        }
      } else {
        console.error('❌ Failed to load notifications from backend');
        setNotifications([]);
      }
    } catch (error) {
      console.error('❌ Error loading notifications from backend:', error);
      setNotifications([]);
    }
  };

  // Mark notification as read via backend API
  const markNotificationAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('No token found, skipping mark as read');
        return;
      }

      const response = await fetch(`http://localhost:3001/api/collaboration/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: {
          'x-auth-token': token
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          // Update local state
          const updatedNotifications = notifications.map(n => 
            n._id === notificationId ? { ...n, isRead: true } : n
          );
          setNotifications(updatedNotifications);
          console.log('✅ Notification marked as read');
        }
      } else {
        console.error('❌ Failed to mark notification as read');
      }
    } catch (error) {
      console.error('❌ Error marking notification as read:', error);
    }
  };

  // Save moves when component unmounts or page unloads
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (activeChapter && tree.moves && tree.moves.length > 0) {
        console.log('💾 Saving moves before page unload...');
        // Use synchronous save for page unload
        navigator.sendBeacon('/api/chapters/save-moves', JSON.stringify({
          chapterId: activeChapter._id,
          pgn: convertTreeToPGN(tree),
          position: boardPosition,
          gameTree: tree,
          currentPath: currentPath,
          currentMoveIndex: currentMoveIndex
        }));
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      // Also save when component unmounts
      if (activeChapter && tree.moves && tree.moves.length > 0) {
        console.log('💾 Saving moves on component unmount...');
        saveMovesToDatabase();
      }
    };
  }, [activeChapter, tree, boardPosition, saveMovesToDatabase]);

  // Auto-cleanup move notation when chapter loads
  useEffect(() => {
    if (activeChapter && activeChapter.gameTree?.moves?.length > 0) {
      // Check if any moves have incorrect notation format
      const hasIncorrectNotation = activeChapter.gameTree.moves.some(move => 
        move.notation && move.notation.includes('-') && move.notation.length > 5
      );
      
      if (hasIncorrectNotation) {
        console.log('🔧 Detected incorrect move notation, cleaning up...');
        cleanupMoveNotation();
      }
    }
  }, [activeChapter, cleanupMoveNotation]);

  // Check mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Keyboard shortcuts for navigation (same as ChessAnalysisBoard)
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Don't trigger shortcuts if user is typing in an input field
      if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA' || event.target.contentEditable === 'true') {
        return;
      }

      switch (event.key) {
        case 'Home':
          event.preventDefault();
          if (currentMoveIndex > 0) {
          goToStart();
          }
          break;
        case 'End':
          event.preventDefault();
          if (currentMoveIndex < (tree?.moves?.length || 0)) {
          goToEnd();
          }
          break;
        case 'ArrowLeft':
          event.preventDefault();
          if (currentMoveIndex > 0) {
          goBack();
          }
          break;
        case 'ArrowRight':
          event.preventDefault();
          if (currentMoveIndex < (tree?.moves?.length || 0)) {
          goForward();
          }
          break;
        case 'Escape':
          event.preventDefault();
          // Return to main line (if in variation)
          if (currentPath && currentPath.length > 0) {
            navigateToPosition([], 0);
          }
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentMoveIndex, tree, goToStart, goToEnd, goBack, goForward, currentPath, navigateToPosition]);

  // Extract FEN position from PGN metadata
  const extractFENFromPGN = (pgnText) => {
    try {
      const lines = pgnText.split('\n');
      for (let line of lines) {
        if (line.startsWith('[FEN ')) {
          const match = line.match(/\[FEN\s"([^"]+)"\]/);
          if (match) {
            console.log('🎯 Extracted FEN from PGN:', match[1]);
            return match[1];
          }
        }
      }
      console.log('🎯 No FEN found in PGN, using initial position');
      return null;
    } catch (error) {
      console.warn('⚠️ Error extracting FEN from PGN:', error);
      return null;
    }
  };

  // EXACT COPY of ChessStudyViewerComponent parsing functions for study import
  
  // Check if a token is a valid chess move (EXACT COPY from ChessStudyViewerComponent)
  function isValidMoveForImport(token) {
    const standardMovePattern = /^[KQRBN]?[a-h]?[1-8]?x?[a-h][1-8](?:=[QRBN])?[+#]?$/;
    const castlingPattern = /^O-O(-O)?(\+|#)?$/;
    const longAlgebraicPattern = /^[a-h][1-8][a-h][1-8](?:[QRBN])?[+#]?$/;

    return standardMovePattern.test(token) || 
           castlingPattern.test(token) || 
           longAlgebraicPattern.test(token);
  }

  // Parse variation moves with position validation (like parseVariationMoves)
  function parseVariationMovesForImport(text, game) {
    console.log('🔍 [STUDY IMPORT] Parsing variation moves from:', text);
    console.log('🔍 [STUDY IMPORT] Starting position:', game ? game.fen() : 'no game provided');
    
    const moves = [];
    const tokens = text.trim().split(/\s+/);
    
    for (const token of tokens) {
      // Skip move numbers and result markers
      if (token.match(/^\d+\.+$/) || token.match(/^(1-0|0-1|1\/2-1\/2|\*)$/)) {
        continue;
      }
      
      if (token && isValidMoveForImport(token)) {
        // Validate against game position if provided
        if (game) {
          try {
            const result = game.move(token);
            if (result) {
              console.log(`✅ [STUDY IMPORT] Valid variation move: ${token}`);
              moves.push(token);
            } else {
              console.warn(`⚠️ [STUDY IMPORT] Invalid variation move: ${token}`);
              moves.push(token); // Still add but log warning
            }
          } catch (error) {
            console.warn(`⚠️ [STUDY IMPORT] Error validating variation move: ${token}`, error);
            moves.push(token); // Still add but log error
          }
        } else {
          moves.push(token);
        }
      }
    }
    
    console.log('✅ [STUDY IMPORT] Parsed variation moves:', moves);
    return moves;
  }

  // Parse move tree with variations - WITH POSITION VALIDATION (like parseMoveTree)
  function parseMoveTreeForImport(text, startingPosition = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1') {
    console.log('🔍 [STUDY IMPORT] Parsing move tree with variations:', text.substring(0, 200) + '...');
    console.log('🎯 [STUDY IMPORT] Starting position for move parsing:', startingPosition);
    
    // Create a chess game instance with the custom starting position
    const game = new Chess();
    try {
      if (startingPosition && startingPosition !== 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1') {
        game.load(startingPosition);
        console.log('✅ [STUDY IMPORT] Chess game loaded with custom starting position:', startingPosition);
      } else {
        game.reset();
        console.log('✅ [STUDY IMPORT] Chess game reset to initial position');
      }
    } catch (error) {
      console.warn('⚠️ [STUDY IMPORT] Failed to load starting position, using initial position:', error);
      game.reset();
    }
    
    const root = { move: null, mainLine: [], variations: {} };

    function parseSequence(startIndex = 0) {
      const moves = [];
      let index = startIndex;

      while (index < text.length) {
        const char = text[index];

        if (char === '(') {
          // Start a variation - it belongs to the last move
          if (moves.length > 0) {
            const lastMove = moves[moves.length - 1];
            const varStart = index + 1;
            let depth = 1;
            let varEnd = varStart;
            index++;

            while (index < text.length && depth > 0) {
              if (text[index] === '(') depth++;
              if (text[index] === ')') depth--;
              if (depth > 0) varEnd++;
              index++;
            }

            const varText = text.substring(varStart, varEnd);
            console.log('🔍 [STUDY IMPORT] Found variation text:', varText);
            console.log('🔍 [STUDY IMPORT] Variation after move:', lastMove);
            
            if (!root.variations[lastMove]) {
              root.variations[lastMove] = [];
            }
            
            // CRITICAL: Clone the game state BEFORE the last move to parse the variation
            // Variations branch from the position BEFORE the last move was made
            const variationGame = new Chess();
            // We need to replay all moves except the last one to get to the right position
            variationGame.load(startingPosition);
            for (let i = 0; i < moves.length - 1; i++) {
              try {
                variationGame.move(moves[i]);
              } catch (e) {
                console.warn('[STUDY IMPORT] Error replaying move for variation:', moves[i], e);
              }
            }
            
            console.log('🔍 [STUDY IMPORT] Parsing variation from position:', variationGame.fen());
            // CRITICAL FIX: Parse variation RECURSIVELY to handle nested variations!
            // Parse the variation with its own mini-tree that handles nested parentheses
            const variationMoves = [];
            const variationVariations = {};
            let varIdx = 0;
            
            while (varIdx < varText.length) {
              const varChar = varText[varIdx];
              
              if (varChar === '(') {
                // Nested variation within this variation!
                if (variationMoves.length > 0) {
                  const lastVarMove = variationMoves[variationMoves.length - 1];
                  const nestedVarStart = varIdx + 1;
                  let nestedDepth = 1;
                  let nestedVarEnd = nestedVarStart;
                  varIdx++;
                  
                  while (varIdx < varText.length && nestedDepth > 0) {
                    if (varText[varIdx] === '(') nestedDepth++;
                    if (varText[varIdx] === ')') nestedDepth--;
                    if (nestedDepth > 0) nestedVarEnd++;
                    varIdx++;
                  }
                  
                  const nestedVarText = varText.substring(nestedVarStart, nestedVarEnd);
                  console.log('🔍 [STUDY IMPORT] Found NESTED variation:', nestedVarText);
                  
                  if (!variationVariations[lastVarMove]) {
                    variationVariations[lastVarMove] = [];
                  }
                  
                  // Recursively parse the nested variation
                  const nestedGame = new Chess(variationGame.fen());
                  for (let j = 0; j < variationMoves.length - 1; j++) {
                    try {
                      nestedGame.move(variationMoves[j]);
                    } catch (e) {
                      console.warn('[STUDY IMPORT] Error replaying for nested variation:', e);
                    }
                  }
                  
                  const nestedMoves = parseVariationMovesForImport(nestedVarText, nestedGame);
                  variationVariations[lastVarMove].push({ mainLine: nestedMoves, variations: {} });
                }
              } else if (/\s/.test(varChar)) {
                varIdx++;
              } else {
                let varMove = '';
                while (varIdx < varText.length && !/[\s()]/g.test(varText[varIdx])) {
                  varMove += varText[varIdx];
                  varIdx++;
                }
                
                if (varMove && varMove !== '*' && !varMove.match(/^(1-0|0-1|1\/2-1\/2)$/) && !varMove.match(/^\d+\.+$/)) {
                  try {
                    const result = variationGame.move(varMove);
                    if (result) {
                      console.log(`✅ [STUDY IMPORT] Valid variation move: ${varMove}`);
                      variationMoves.push(varMove);
                    } else {
                      console.warn(`⚠️ [STUDY IMPORT] Invalid variation move: ${varMove}`);
                      variationMoves.push(varMove);
                    }
                  } catch (error) {
                    console.warn(`⚠️ [STUDY IMPORT] Error validating variation move: ${varMove}`, error);
                    variationMoves.push(varMove);
                  }
                }
              }
            }
            
            console.log('🔍 [STUDY IMPORT] Variation moves with nested variations:', variationMoves);
            console.log('🔍 [STUDY IMPORT] Nested variations found:', variationVariations);
            root.variations[lastMove].push({ mainLine: variationMoves, variations: variationVariations });
          } else {
            index++; // Skip opening parenthesis if no preceding move
          }
        } else if (char === ')') {
          index++;
          break; // End of current variation/main line
        } else if (/\s/.test(char)) {
          index++; // Skip whitespace
        } else {
          let move = '';
          while (index < text.length && !/[\s()]/g.test(text[index])) {
            move += text[index];
            index++;
          }

          if (move && move !== '*' && !move.match(/^(1-0|0-1|1\/2-1\/2)$/) && !move.match(/^\d+\.$/)) {
            // Skip move numbers like "1.", "2.", etc.
            if (!move.match(/^\d+\.$/)) {
              // Validate move against game position
              try {
                const result = game.move(move);
                if (result) {
                  console.log(`✅ [STUDY IMPORT] Valid move: ${move}`);
                  moves.push(move);
                } else {
                  console.warn(`⚠️ [STUDY IMPORT] Invalid move: ${move}`);
                  moves.push(move); // Still add but log warning
                }
              } catch (error) {
                console.warn(`⚠️ [STUDY IMPORT] Error validating move: ${move}`, error);
                moves.push(move); // Still add but log error
              }
            }
          }
        }
      }

      return { move: null, mainLine: moves, variations: root.variations };
    }

    const tree = parseSequence(0);
    console.log('✅ [STUDY IMPORT] Parsed tree:', tree);
    console.log('📊 Main line moves:', tree.mainLine.length);
    console.log('📊 Variations found:', Object.keys(tree.variations).length);
    console.log('📊 Variation details:', tree.variations);

    // Convert to the format expected by GameTreeNotation
    return convertTreeToGameTreeFormatForImport(tree);
  }

  // Convert parsed tree to GameTreeNotation format (EXACT COPY from ChessStudyViewerComponent)
  function convertTreeToGameTreeFormatForImport(tree) {
    console.log('🔄 [STUDY IMPORT] Converting tree to GameTreeNotation format:', tree);
    
    const moves = [];
    const variations = [];
    let variationId = 0;

    // Check if tree and mainLine exist
    if (!tree || !tree.mainLine || !Array.isArray(tree.mainLine)) {
      console.error('❌ Invalid tree structure:', tree);
      return {
        moves: [],
        variations: [],
        currentMove: 0
      };
    }

    // RECURSIVE function to process variations with their nested variations
    function processVariation(variation, parentIndex, depth = 1) {
      if (!variation || !variation.mainLine || !Array.isArray(variation.mainLine)) {
        console.warn('⚠️ Invalid variation structure:', variation);
        return {
          id: `variation-${variationId++}`,
          moves: [],
          parentMoveIndex: parentIndex,
          depth: depth
        };
      }

      // Process each move in the variation's mainLine
      const variationMoves = variation.mainLine.map((varMove, varMoveIndex) => {
        // Check if this move has nested variations
        const nestedVariations = (variation.variations && variation.variations[varMove]) || [];
        
        // Recursively process nested variations
        const processedNestedVariations = nestedVariations.map((nestedVar, nestedIdx) => {
          return processVariation(nestedVar, parentIndex + varMoveIndex + 1, depth + 1);
        });

        return {
          id: `var-${variationId}-${varMoveIndex}`,
          move: varMove,
          notation: varMove,
          san: varMove,
          from: 'unknown',
          to: 'unknown',
          color: (parentIndex + varMoveIndex) % 2 === 0 ? 'w' : 'b',
          piece: 'p',
          captured: undefined,
          promotion: undefined,
          flags: '',
          variations: processedNestedVariations
        };
      });

      return {
        id: `variation-${variationId++}`,
        moves: variationMoves,
        parentMoveIndex: parentIndex,
        depth: depth
      };
    }

    // Process main line moves
    tree.mainLine.forEach((moveNotation, index) => {
      // Find variations for this move
      const moveVariations = (tree.variations && tree.variations[moveNotation]) || [];
      
      // Convert variations to the expected format with RECURSIVE processing
      const processedVariations = moveVariations.map((variation, varIndex) => {
        return processVariation(variation, index, 1);
      });

      moves.push({
        id: `move-${index}`,
        move: moveNotation,
        notation: moveNotation,
        san: moveNotation,
        from: 'unknown',
        to: 'unknown',
        color: index % 2 === 0 ? 'w' : 'b',
        piece: 'p',
        captured: undefined,
        promotion: undefined,
        flags: '',
        variations: processedVariations
      });
    });

    console.log('🔄 [STUDY IMPORT] Converted to GameTreeNotation format:');
    console.log('📊 Total moves:', moves.length);
    console.log('📊 Moves with variations:', moves.filter(m => m.variations.length > 0).length);
    console.log('🔍 Sample move structure:', moves[0]);
    const moveWithVar = moves.find(m => m.variations.length > 0);
    if (moveWithVar) {
      console.log('🔍 [CRITICAL] Move with variation found:', moveWithVar.notation);
      console.log('🔍 [CRITICAL] Variations array:', moveWithVar.variations);
      console.log('🔍 [CRITICAL] First variation:', moveWithVar.variations[0]);
      console.log('🔍 [CRITICAL] First variation moves:', moveWithVar.variations[0]?.moves);
    } else {
      console.log('❌ [CRITICAL] NO MOVES WITH VARIATIONS FOUND!');
      console.log('❌ [CRITICAL] All moves:', moves);
    }

    const result = {
      moves: moves,
      variations: variations,
      currentMove: moves.length
    };
    
    console.log('🔍 [CRITICAL] Returning gameTree:', JSON.stringify(result, null, 2).substring(0, 2000));
    
    return result;
  }

  // Parse PGN with starting position support (like parsePGN in EnhancedChessStudyPage)
  function parsePGNForImport(pgn, startingPosition = null) {
    console.log('🔍 [STUDY IMPORT] Parsing PGN...');
    console.log('📝 PGN length:', pgn.length);
    console.log('🎯 Starting position provided:', startingPosition);
    
    if (!pgn || pgn.trim().length === 0) {
      throw new Error('Empty PGN provided');
    }
    
    const lines = pgn.split('\n');
    const metadata = {};
    let moveText = '';

    for (let line of lines) {
      if (line.startsWith('[')) {
        const match = line.match(/\[(\w+)\s"([^"]+)"\]/);
        if (match) metadata[match[1]] = match[2];
      } else {
        moveText += ' ' + line;
      }
    }

    // Extract FEN from metadata if not provided
    const fenPosition = startingPosition || metadata.FEN || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    console.log('🎯 [STUDY IMPORT] Using FEN position:', fenPosition);

    // Clean move text
    moveText = moveText
      .replace(/\d+\./g, '') // Remove move numbers
      .replace(/\{\[%[^\]]*\]\}/g, '') // Remove annotations
      .replace(/\{[^}]*\}/g, '') // Remove comments
      .replace(/\s+/g, ' ') // Normalize spaces
      .trim();

    console.log('📝 [STUDY IMPORT] Cleaned move text:', moveText.substring(0, 200) + '...');
    
    if (!moveText || moveText.length === 0) {
      throw new Error('No moves found in PGN');
    }

    const tree = parseMoveTreeForImport(moveText, fenPosition);
    
    if (!tree) {
      throw new Error('Failed to parse move tree');
    }
    
    return tree;
  }

  // Import study from multi-chapter PGN
  const importStudyFromPGN = async () => {
    if (!importText.trim()) {
      alert('Please enter PGN content');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please log in to import studies');
        return;
      }

      console.log('📚 Starting multi-chapter study import...');
      
      // Parse the multi-chapter PGN
      const chapters = parseMultiChapterPGN(importText);
      console.log('📚 Parsed chapters:', chapters);
      
      if (chapters.length === 0) {
        alert('No valid chapters found in PGN. Please check the format.');
        return;
      }

      // Extract study name from first chapter or use default
      const studyName = chapters[0].studyName || `Imported Study - ${new Date().toLocaleString()}`;
      
      // Create the study
      console.log('📚 Creating study:', studyName);
      const studyResponse = await studyService.createStudy({
        name: studyName,
        description: `Imported study with ${chapters.length} chapters from PGN`
      });

      if (!studyResponse.success || !studyResponse.data || !studyResponse.data._id) {
        alert('Error creating study: ' + (studyResponse.message || 'Invalid response from server'));
        return;
      }

      const studyId = studyResponse.data._id;
      console.log('✅ Study created:', studyId);

      // Create chapters
      const createdChapters = [];
      for (let i = 0; i < chapters.length; i++) {
        const chapter = chapters[i];
        console.log(`📚 Creating chapter ${i + 1}/${chapters.length}:`, chapter.name);
        console.log(`📚 Chapter ${i + 1} PGN length:`, chapter.pgn?.length);
        console.log(`📚 Chapter ${i + 1} position:`, chapter.position);
        
        // ✨ USE EXACT SAME PARSING AS EnhancedChessStudyPage.parsePGN with position support ✨
        const gameTree = parsePGNForImport(chapter.pgn, chapter.position);
        
        console.log(`✅ Chapter ${i + 1} gameTree created:`, gameTree);
        console.log(`📊 Chapter ${i + 1} moves count:`, gameTree?.moves?.length);
        console.log(`🔍 Chapter ${i + 1} first move:`, gameTree?.moves?.[0]);
        console.log(`🔍 Chapter ${i + 1} first move notation:`, gameTree?.moves?.[0]?.notation);
        console.log(`📊 Chapter ${i + 1} moves with variations:`, gameTree?.moves?.filter(m => m.variations?.length > 0).length);
        
        const firstMoveWithVar = gameTree?.moves?.find(m => m.variations?.length > 0);
        if (firstMoveWithVar) {
          console.log(`🔍 Chapter ${i + 1} sample variation:`, firstMoveWithVar.variations[0]);
          console.log(`🔍 Chapter ${i + 1} variation moves:`, firstMoveWithVar.variations[0]?.moves);
          console.log(`🔍 Chapter ${i + 1} first variation move:`, firstMoveWithVar.variations[0]?.moves?.[0]);
        }
        
        const chapterData = {
          studyId: studyId,
          name: chapter.name,
          notes: chapter.notes || `Imported from PGN chapter ${i + 1}`,
          pgn: chapter.pgn,
          position: chapter.position || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
          gameTree: gameTree,  // No need for fixMoveNotation - it's already in the right format!
          currentPath: [],
          currentMoveIndex: 0
        };
        
        console.log(`📝 Chapter ${i + 1} data to save:`, {
          name: chapterData.name,
          movesCount: chapterData.gameTree?.moves?.length,
          firstMoveNotation: chapterData.gameTree?.moves?.[0]?.notation,
          variationsCount: chapterData.gameTree?.moves?.filter(m => m.variations?.length > 0).length
        });
        console.log(`📝 Chapter ${i + 1} FULL gameTree being saved:`, JSON.stringify(chapterData.gameTree, null, 2).substring(0, 1000));
        
        const chapterResponse = await chapterService.createChapter(chapterData);
        
        if (chapterResponse.success) {
          createdChapters.push(chapterResponse.chapter);
          console.log(`✅ Chapter created: ${chapter.name}`);
        } else {
          console.warn(`⚠️ Failed to create chapter: ${chapter.name}`, chapterResponse.message);
        }
      }

      console.log('🎉 Study import completed!');
      console.log(`📊 Created study "${studyName}" with ${createdChapters.length} chapters`);
      
      // Refresh studies and set the new study as active
      await loadStudies();
      setActiveStudy(studyId);
      
      // Properly load the first chapter with full state processing if available
      if (createdChapters.length > 0) {
        console.log('🔄 Loading first chapter with proper state processing...');
        await handleChapterSelect(createdChapters[0]._id);
      }
      
      // Hide the import interface
      setShowImportInterface(false);
      setImportText('');
      
      alert(`✅ Successfully imported study "${studyName}" with ${createdChapters.length} chapters!`);
      
    } catch (error) {
      console.error('❌ Error importing study:', error);
      alert('❌ Error importing study: ' + error.message);
    }
  };

  // Parse multi-chapter PGN into individual chapters
  const parseMultiChapterPGN = (pgnText) => {
    console.log('🔍 Parsing multi-chapter PGN...');
    
    const chapters = [];
    const sections = pgnText.split(/(?=\[Event)/);
    
    for (let i = 0; i < sections.length; i++) {
      const section = sections[i].trim();
      if (!section) continue;
      
      try {
        const lines = section.split('\n');
        const metadata = {};
        let moveText = '';
        
        // Parse metadata
        for (let line of lines) {
          if (line.startsWith('[')) {
            const match = line.match(/\[(\w+)\s"([^"]+)"\]/);
            if (match) {
              metadata[match[1]] = match[2];
            }
          } else {
            moveText += ' ' + line;
          }
        }
        
        // Clean move text
        moveText = moveText
          .replace(/\d+\./g, '') // Remove move numbers
          .replace(/\{\[%[^\]]*\]\}/g, '') // Remove annotations
          .replace(/\{[^}]*\}/g, '') // Remove comments
          .replace(/\s+/g, ' ') // Normalize spaces
          .trim();
        
        if (moveText && metadata.Event) {
          chapters.push({
            name: metadata.ChapterName || metadata.Event || `Chapter ${i + 1}`,
            studyName: metadata.StudyName || 'Imported Study',
            pgn: section,
            position: metadata.FEN || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
            notes: metadata.Event || `Chapter ${i + 1} from imported study`
          });
        }
      } catch (error) {
        console.warn(`⚠️ Failed to parse chapter ${i + 1}:`, error);
      }
    }
    
    console.log(`📚 Parsed ${chapters.length} chapters from PGN`);
    return chapters;
  };

  // Import study
  const importStudy = async () => {
    if (!importText.trim()) {
      alert('Please enter PGN content');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please log in to import studies');
        return;
      }

      // Create study
      const studyResponse = await studyService.createStudy({
        name: 'Imported Study',
        description: 'Imported from PGN'
      });

      if (studyResponse.success && studyResponse.data && studyResponse.data._id) {
        const studyId = studyResponse.data._id;
        
        // Create chapter
        const chapterResponse = await chapterService.createChapter({
          studyId,
          name: 'Imported Chapter',
          notes: 'Imported from PGN'
        });

        if (chapterResponse.success && chapterResponse.data && chapterResponse.data._id) {
          const chapterId = chapterResponse.data._id;
          
          // Convert PGN to game tree
          console.log('🔄 Converting PGN to game tree in importStudy...');
          const gameTree = await lichessStudyService.convertPGNToGameTree(importText);
          console.log('✅ PGN converted to game tree:', gameTree);
          console.log('📊 Total moves:', gameTree.moves.length);
          console.log('📊 Total variations:', gameTree.variations.length);
          
          // Update chapter with PGN and parsed game tree
          await chapterService.updateChapter(chapterId, {
            pgn: importText,
            position: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', // Always use initial position for new chapters
            gameTree: gameTree
          });

          alert('Study imported successfully!');
          setShowImportModal(false);
          setImportText('');
          loadStudies();
        }
      }
    } catch (error) {
      console.error('Error importing study:', error);
      alert('Error importing study: ' + error.message);
    }
  };

  // Test function to debug import process
  const testImportProcess = async () => {
    console.log('🧪 TESTING IMPORT PROCESS');
    
    // Test with a simple PGN
    const testPGN = '1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 d6 8. c3 O-O 9. h3 Nb8 10. d4 Nbd7';
    
    console.log('🧪 Test PGN:', testPGN);
    
    // Test the lichessStudyService conversion
    const lichessStudyService = require('../services/lichessStudyService').lichessStudyService;
    const testChapter = {
      name: 'Test Chapter',
      pgn: testPGN,
      tags: ['Test']
    };
    
    console.log('🧪 Testing PGN to GameTree conversion...');
    const gameTree = await lichessStudyService.convertPGNToGameTree(testPGN);
    console.log('🧪 Converted gameTree:', gameTree);
    console.log('🧪 Moves count:', gameTree.moves.length);
    console.log('🧪 First few moves:', gameTree.moves.slice(0, 3));
    
    // Test creating a chapter with this data
    if (activeStudy) {
      console.log('🧪 Testing chapter creation...');
      const testChapterData = {
        studyId: activeStudy,
        name: 'Test Chapter',
        notes: 'Test import',
        pgn: testPGN,
        position: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        gameTree: gameTree,
        currentPath: [],
        currentMoveIndex: 0
      };
      
      console.log('🧪 Test chapter data:', testChapterData);
      
      try {
        const response = await chapterService.createChapter(testChapterData);
        console.log('🧪 Chapter creation response:', response);
        
        if (response.success) {
          console.log('🧪 SUCCESS: Chapter created with moves!');
          console.log('🧪 Created chapter:', response.chapter);
          console.log('🧪 Chapter moves count:', response.chapter.gameTree?.moves?.length || 0);
        } else {
          console.log('🧪 FAILED: Chapter creation failed:', response.message);
        }
      } catch (error) {
        console.error('🧪 ERROR: Chapter creation failed:', error);
      }
    } else {
      console.log('🧪 No active study to test with');
    }
  };

  // Direct PGN import function
  const importPGNDirectly = async () => {
    console.log('🚀🚀🚀 importPGNDirectly FUNCTION CALLED! 🚀🚀🚀');
    console.log('📝 DIRECT PGN IMPORT STARTED - BUTTON CLICKED!');
    console.log('📝 importText value:', importText);
    console.log('📝 importText length:', importText?.length || 0);
    console.log('📝 Active study:', activeStudy);
    
    // Check authentication first
    const token = localStorage.getItem('token');
    if (!token) {
      alert('❌ Please log in to import PGN chapters. Click the login button in the top right corner.');
      console.error('📝 ERROR: No authentication token found!');
      return;
    }
    
    const pgnTextarea = document.getElementById('pgnInput');
    console.log('📝 PGN textarea found:', !!pgnTextarea);
    
    if (!pgnTextarea) {
      console.error('📝 ERROR: PGN textarea not found!');
      alert('PGN textarea not found. Please refresh the page.');
      return;
    }
    
    const pgnText = pgnTextarea?.value?.trim();
    console.log('📝 PGN Text length:', pgnText?.length || 0);
    console.log('📝 PGN Text preview:', pgnText?.substring(0, 100) + '...');
    
    if (!pgnText) {
      alert('Please enter PGN text');
      return;
    }
    
    if (!activeStudy) {
      alert('Please select a study first');
      return;
    }
    
    console.log('📝 PGN Text:', pgnText);
    
    try {
      console.log('📝 Converting PGN to GameTree...');
      const gameTree = await lichessStudyService.convertPGNToGameTree(pgnText);
            console.log('📝 Converted gameTree:', gameTree);
            console.log('📝 Moves count:', gameTree.moves.length);
            console.log('📝 First few moves:', gameTree.moves.slice(0, 3));
            console.log('📝 GameTree structure:', JSON.stringify(gameTree, null, 2));
            
            if (gameTree.moves.length === 0) {
              console.error('❌ NO MOVES FOUND IN GAME TREE!');
              console.error('❌ GameTree object:', gameTree);
              alert('No moves found in PGN. Please check the format.');
              return;
            }
            
            // Validate that moves have the required properties
            const firstMove = gameTree.moves[0];
            if (!firstMove.move && !firstMove.notation) {
              console.error('❌ FIRST MOVE MISSING REQUIRED PROPERTIES!');
              console.error('❌ First move:', firstMove);
              alert('Invalid move format in PGN. Please check the format.');
              return;
            }
      
      // Create chapter data
      const chapterData = {
        studyId: activeStudy,
        name: `PGN Import - ${new Date().toLocaleString()}`,
        notes: `Imported from PGN:\n${pgnText.substring(0, 100)}${pgnText.length > 100 ? '...' : ''}`,
        pgn: pgnText,
        position: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        gameTree: gameTree,
        currentPath: [],
        currentMoveIndex: 0
      };
      
            console.log('📝 Creating chapter with data:', chapterData);
            console.log('📝 Chapter data JSON:', JSON.stringify(chapterData, null, 2));
            console.log('📝 GameTree moves count:', chapterData.gameTree?.moves?.length || 0);
            console.log('📝 First few moves:', chapterData.gameTree?.moves?.slice(0, 3));
            console.log('📝 GameTree structure:', chapterData.gameTree);
            console.log('📝 GameTree variations:', chapterData.gameTree?.variations);
            
            const response = await chapterService.createChapter(chapterData);
      console.log('📝 Chapter creation response:', response);
      
      if (response.success) {
        console.log('📝 SUCCESS: Chapter created with moves!');
        console.log('📝 Created chapter:', response.chapter);
        console.log('📝 Chapter moves count:', response.chapter.gameTree?.moves?.length || 0);
        
        alert(`✅ Chapter created successfully with ${gameTree.moves.length} moves!`);
        
        // Refresh the study to show the new chapter
        await loadStudies();
        
        // Clear the PGN input
        clearPGNInput();
        
      } else {
        console.log('📝 FAILED: Chapter creation failed:', response.message);
        alert('❌ Failed to create chapter: ' + response.message);
      }
      
    } catch (error) {
      console.error('📝 ERROR: PGN import failed:', error);
      
      // Provide more specific error messages
      if (error.message.includes('401') || error.message.includes('Token is not valid') || error.message.includes('No token')) {
        alert('❌ Authentication error: Please log in to import PGN chapters. Click the login button in the top right corner.');
      } else if (error.message.includes('500')) {
        alert('❌ Server error: There was a problem processing your PGN. Please try again or contact support.');
      } else {
        alert('❌ Error importing PGN: ' + error.message);
      }
    }
  };

  // Clear PGN input function
  const clearPGNInput = () => {
    const pgnTextarea = document.getElementById('pgnInput');
    if (pgnTextarea) {
      pgnTextarea.value = '';
    }
  };

  // Import study from Lichess
  const importLichessStudy = async (lichessStudyData) => {
    try {
      console.log('🔍 Starting Lichess study import:', lichessStudyData);
      
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please log in to import studies');
        return;
      }

      // Check if there's an active study
      if (!activeStudy) {
        alert('Please select a study first before importing chapters from Lichess');
        return;
      }

      console.log('✅ Using current study:', activeStudy);

      // Create chapters for each Lichess chapter in the current study
      const createdChapters = [];
      for (let i = 0; i < lichessStudyData.chapters.length; i++) {
        const chapter = lichessStudyData.chapters[i];
        
        console.log(`📝 Creating chapter ${i + 1}/${lichessStudyData.chapters.length}:`, chapter.name);
        console.log('📝 Chapter data being sent to backend:', {
          studyId: activeStudy,
          name: chapter.name,
          notes: chapter.notes,
          pgn: chapter.pgn,
          position: chapter.position,
          gameTree: chapter.gameTree,
          currentPath: chapter.currentPath,
          currentMoveIndex: chapter.currentMoveIndex
        });
        console.log('📝 GameTree moves count:', chapter.gameTree?.moves?.length || 0);
        console.log('📝 PGN length:', chapter.pgn?.length || 0);
        
        const chapterResponse = await chapterService.createChapter({
          studyId: activeStudy,
          name: chapter.name,
          notes: chapter.notes,
          pgn: chapter.pgn,
          position: chapter.position,
          gameTree: chapter.gameTree,
          currentPath: chapter.currentPath,
          currentMoveIndex: chapter.currentMoveIndex
        });

        if (chapterResponse.success) {
          const createdChapter = chapterResponse.chapter;
          createdChapters.push(createdChapter);
          console.log(`✅ Created chapter: ${chapter.name} with ${chapter.gameTree?.moves?.length || 0} moves`);
        } else {
          console.warn(`⚠️ Failed to create chapter: ${chapter.name}`, chapterResponse.message);
        }
      }

      console.log('🎉 Lichess chapters import completed!');
      console.log(`📊 Created ${createdChapters.length} chapters in current study`);

      // Refresh studies to get updated chapter list
      await loadStudies();
      
      // Set the first chapter as active if available
      if (createdChapters.length > 0) {
        setActiveChapter(createdChapters[0]);
      }

      alert(`Successfully imported ${createdChapters.length} chapters from "${lichessStudyData.name}" into current study!`);

    } catch (error) {
      console.error('❌ Error importing Lichess study:', error);
      alert('Error importing Lichess study: ' + error.message);
    }
  };

  // Create new chapter - OPTIMIZED FOR PERFORMANCE
  const createNewChapter = async () => {
    try {
      setIsCreatingNewChapter(true);
      
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please log in first');
        return;
      }

      if (!activeStudy) {
        alert('Please select a study first');
        return;
      }

      const chapterName = prompt('Enter chapter name:');
      if (!chapterName || !chapterName.trim()) {
        alert('Chapter name is required!');
        return;
      }

      const chapterNotes = prompt('Enter chapter notes (optional):') || '';

      // Create chapter with clean state
      const chapterData = {
        studyId: activeStudy,
        name: chapterName.trim(),
        notes: chapterNotes,
        position: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        gameTree: { moves: [], currentMove: 0, variations: [] },
        currentPath: [],
        currentMoveIndex: 0
      };

      const response = await chapterService.createChapter(chapterData);

      if (response.success && response.chapter && response.chapter._id) {
        alert(`Chapter "${chapterName}" created successfully!`);
        
        // OPTIMIZE: Add chapter directly to studies array instead of reloading all
        setStudies(prevStudies => {
          return prevStudies.map(study => {
            if (study._id === activeStudy) {
              const existingChapters = study.chapters || [];
              const chapterExists = existingChapters.some(c => c._id === response.chapter._id);
              
              if (!chapterExists) {
                return {
                  ...study,
                  chapters: [...existingChapters, response.chapter],
                  chapterCount: existingChapters.length + 1
                };
              }
            }
            return study;
          });
        });
        
        // Reset game state for new chapter
        reset();
        setBoardPosition('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
        setLocalBoardPosition('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
        setGame(new Chess());
        setTree({ moves: [], variations: [] });
        setGameTree({ moves: [], variations: [] });
        setCurrentPath([]);
        setCurrentMoveIndex(0);
        
        // Set the new chapter as active
        setActiveChapter(response.chapter);
        
      } else {
        alert('Error creating chapter: ' + (response.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error creating chapter:', error);
      alert('Error creating chapter: ' + error.message);
    } finally {
      setIsCreatingNewChapter(false);
    }
  };

  const deleteChapter = async (chapterId) => {
    if (!chapterId || !activeStudy) {
      console.log('Cannot delete chapter: missing chapterId or activeStudy');
      return;
    }

    if (window.confirm('Are you sure you want to delete this chapter? This action cannot be undone.')) {
      try {
        const response = await chapterService.deleteChapter(activeStudy, chapterId);
        
        if (response.success) {
          console.log('✅ Chapter deleted successfully');
          alert('Chapter deleted successfully!');
          
          // Refresh studies to update the UI
          await loadStudies();
          
          // If the deleted chapter was active, clear the active chapter
          if (activeChapter && activeChapter._id === chapterId) {
            setActiveChapter(null);
          }
        } else {
          alert('Error deleting chapter: ' + response.message);
        }
      } catch (error) {
        console.error('Error deleting chapter:', error);
        alert('Error deleting chapter: ' + error.message);
      }
    }
  };

  // Create new study
  const createNewStudy = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please log in to create studies');
        return;
      }

      const studyName = prompt('Enter study name:');
      if (!studyName) return;

      const studyDescription = prompt('Enter study description (optional):') || '';

      console.log('Creating study:', studyName);
      const response = await studyService.createStudy({
        name: studyName,
        description: studyDescription
      });

      if (response.success && response.data && response.data._id) {
        console.log('Study created successfully:', response.data._id);
        alert('Study created successfully!');
        
        // Optimize: Add the new study to the existing studies array instead of reloading all
        const newStudy = response.data;
        setStudies(prevStudies => [newStudy, ...prevStudies]);
        setActiveStudy(response.data._id);
      } else {
        alert('Error creating study: ' + (response.message || 'Invalid response from server'));
      }
    } catch (error) {
      console.error('Error creating study:', error);
      alert('Error creating study: ' + error.message);
    }
  };

  // Export study
  const exportStudy = () => {
    if (tree.moves?.length === 0) {
      alert('No moves to export');
      return;
    }

    const pgn = convertTreeToPGN(tree);
    const blob = new Blob([pgn], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'chess-study.pgn';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Manual save function
  const manualSave = async () => {
    if (!activeChapter) {
      alert('Please select a chapter first');
      return;
    }
    
    try {
      await saveMovesToDatabase();
      alert('Moves saved successfully!');
    } catch (error) {
      console.error('Error saving moves:', error);
      alert('Error saving moves: ' + error.message);
    }
  };

  // Open collaboration manager
  const openCollaborationManager = (study) => {
    setSelectedStudy(study);
    setShowCollaborationManager(true);
  };

  // Handle quick invite - PROPER BACKEND INTEGRATION!
  const handleQuickInvite = async (e) => {
    e.preventDefault();
    if (!inviteUsername.trim()) {
      alert('Please enter a username');
      return;
    }

    if (!activeStudy) {
      alert('Please select a study first');
      return;
    }

    console.log('🎯 BACKEND INVITATION - Username:', inviteUsername, 'Study:', activeStudy);

    try {
      // Get current study info
      const study = studies.find(s => s._id === activeStudy);
      const studyName = study ? study.name : 'Unknown Study';
      
      // Call the backend invitation API
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please log in to send invitations');
        return;
      }

      console.log('📡 Sending invitation to backend...');
      console.log('📡 Request URL:', 'http://localhost:3001/api/collaboration/invite');
      console.log('📡 Request headers:', {
        'Content-Type': 'application/json',
        'x-auth-token': token ? 'TOKEN_PRESENT' : 'NO_TOKEN'
      });
      console.log('📡 Request body:', {
        studyId: activeStudy,
        username: inviteUsername.trim(),
        permission: 'viewer'
      });
      
      const response = await fetch('http://localhost:3001/api/collaboration/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        body: JSON.stringify({
          studyId: activeStudy,
          username: inviteUsername.trim(),
          permission: 'viewer'
        })
      });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));
      
      const result = await response.json();
      console.log('📡 Backend response:', result);

      if (result.success) {
        // Show success message with more helpful information
        alert(`✅ Invitation sent successfully to ${inviteUsername}!\n\n📧 They will receive a notification in their account.\n🔔 To see the invitation, they need to:\n1. Be logged in to their account\n2. Go to the Notifications button (bell icon)\n3. Click on the invitation to accept it\n\nStudy: "${studyName}"`);
        
        // Clear form
        setInviteUsername('');
        setShowQuickInvite(false);

        // Show success status
        setSaveStatus(`📧 Invitation sent to ${inviteUsername} - Check their notifications!`);
        setTimeout(() => setSaveStatus(''), 5000);

        console.log('✅ BACKEND INVITATION SUCCESS:', result);
      } else {
        throw new Error(result.message || 'Failed to send invitation');
      }

    } catch (error) {
      console.error('❌ Error sending invitation:', error);
      alert('❌ Error sending invitation: ' + error.message);
    }
  };

  // Handle study join
  const handleStudyJoin = async (studyId) => {
    try {
      console.log('Joining study:', studyId);
      alert('Successfully joined study!');
      setShowJoinModal(false);
      loadStudies();
    } catch (error) {
      console.error('Error joining study:', error);
      alert('Error joining study: ' + error.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          {/* Main Title */}
          <div className="text-center mb-6">
            <h1 className="text-5xl font-bold text-gray-800 mb-3 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              ♟️ Enhanced Chess Study
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Complete variation system with study management - Unlimited nesting support
            </p>
          </div>
          
          {/* Top Bar - Main Controls */}
          <div className="flex flex-col lg:flex-row items-center justify-between gap-4 mb-6 p-4 bg-white rounded-xl shadow-lg border border-gray-200">
            {/* Left Side - Navigation & User */}
            <div className="flex items-center space-x-4">
              {/* Back Button */}
              <button
                onClick={() => navigate(-1)}
                className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors shadow-md"
                title="Go back to previous page"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                <span className="text-sm font-medium">Back</span>
              </button>
              
              {/* Play Against Bot Button */}
              <button
                onClick={() => setIsBotMode(!isBotMode)}
                className={`flex items-center px-4 py-2 rounded-lg transition-all shadow-md ${
                  isBotMode 
                    ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white' 
                    : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white'
                }`}
                title={isBotMode ? "Exit bot mode" : "Play against AI bot"}
              >
                <Bot className="w-4 h-4 mr-2" />
                <span className="text-sm font-medium">
                  {isBotMode ? 'Exit Bot Mode' : 'Play vs Bot'}
                </span>
              </button>
              <div className="flex items-center px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg shadow-md">
                <span className="text-sm font-medium">Logged in as:</span>
                <select
                  value={currentUsername}
                  onChange={(e) => {
                    const newUsername = e.target.value;
                    setCurrentUsername(newUsername);
                    localStorage.setItem('currentUsername', newUsername);
                    
                    // Force reload notifications immediately
                    setTimeout(() => {
                      loadNotifications();
                    }, 100);
                  }}
                  className="ml-2 bg-purple-700 text-white border-none rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-purple-300"
                >
                  <option value="adminiz">adminiz</option>
                  <option value="nizadmin">nizadmin</option>
                  <option value="testuser">testuser</option>
                </select>
              </div>
              
              {/* Current Study Display */}
              {activeStudy && (
                <div className="flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg shadow-md">
                  <BookOpen className="w-4 h-4 mr-2" />
                  <span className="text-sm font-medium">
                    {studies.find(s => s._id === activeStudy)?.name || 'Current Study'}
                  </span>
                </div>
              )}
            </div>
            
            {/* Right Side - Main Action Buttons */}
            <div className="flex flex-wrap items-center gap-2">
                <button
                onClick={() => setShowStudies(true)}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center space-x-2"
                >
                <BookOpen className="w-4 h-4" />
                <span>Studies</span>
                </button>
              
                <button
                onClick={createNewStudy}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>New Study</span>
              </button>
              
              <button
                onClick={() => {
                  setImportMode('chapter');
                  setShowImportInterface(!showImportInterface);
                }}
                className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 flex items-center space-x-2"
                >
                  <Upload className="w-4 h-4" />
                <span>{showImportInterface && importMode === 'chapter' ? 'Hide Import' : 'Import Chapter'}</span>
              </button>
              
              <button
                onClick={() => {
                  setImportMode('study');
                  setShowImportInterface(!showImportInterface);
                }}
                className="px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 flex items-center space-x-2 shadow-md hover:shadow-lg transition-all duration-200"
              >
                <span className="text-sm">📚</span>
                <span>{showImportInterface && importMode === 'study' ? 'Hide Import' : 'Import Study'}</span>
              </button>
              
              <button
                onClick={() => setShowLichessImportModal(true)}
                className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 flex items-center space-x-2"
              >
                <span className="text-sm">♟️</span>
                <span>Lichess Import</span>
              </button>
              
              <button
                onClick={() => setShowNotifications(true)}
                className="p-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                </button>
            </div>
            
            {/* Save Status */}
            {saveStatus && (
              <div className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium shadow-md ${
                saveStatus.includes('✅') ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border border-red-200'
              }`}>
                {saveStatus}
              </div>
            )}
          </div>

          {/* Active Chapter Display */}
          {activeChapter ? (
            <>
              <div className="flex flex-col lg:flex-row items-center justify-center gap-4 mb-6">
                <div className="flex items-center px-6 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl shadow-lg border-2 border-blue-400">
                  <BookOpen className="w-6 h-6 mr-3" />
                  <span className="font-bold text-xl">📖 ACTIVE CHAPTER: {activeChapter.name}</span>
                  <div className="ml-3 w-3 h-3 bg-white rounded-full animate-pulse"></div>
                </div>
                <a 
                  href="http://localhost:3000/chess-analysis-board" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
                >
                  <span className="mr-2">🔗</span>
                  <span className="font-medium">Open Analysis Board</span>
                </a>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center mb-6">
              <div className="flex items-center px-6 py-4 bg-gradient-to-r from-red-100 to-red-200 text-red-700 rounded-xl border-2 border-red-300 shadow-lg">
                <BookOpen className="w-6 h-6 mr-3" />
                <span className="font-bold text-lg">⚠️ NO CHAPTER SELECTED - SELECT A CHAPTER!</span>
              </div>
            </div>
          )}
        </div>

        {/* Study Management - Hidden, now using modal */}
        {false && (
        <div className="mb-8 bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center">
              <span className="mr-3">📚</span>
              Study Management
            </h2>
            <div className="flex space-x-2">
              <button
                onClick={createNewStudy}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Create Study</span>
              </button>
              <button
                onClick={() => setShowImportModal(true)}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center space-x-2"
              >
                <Upload className="w-4 h-4" />
                <span>Import Chapter</span>
              </button>
              <button
                onClick={() => setShowLichessImportModal(true)}
                className="px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 flex items-center space-x-2 shadow-md hover:shadow-lg transition-all duration-200"
              >
                <span className="text-sm">♟️</span>
                <span>Import from Lichess</span>
              </button>
              
              <button
                onClick={testImportProcess}
                className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 flex items-center space-x-2 shadow-md hover:shadow-lg transition-all duration-200"
              >
                <span className="text-sm">🧪</span>
                <span>Test Import Process</span>
              </button>
              
              
              <button
                onClick={exportStudy}
                className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Export</span>
              </button>
              <button
                onClick={manualSave}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center space-x-2 animate-pulse"
              >
                <span>🐕💾</span>
                <span>Save Chapter</span>
              </button>
              <button
                onClick={() => setShowPGNViewer(true)}
                className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 flex items-center space-x-2"
              >
                <Eye className="w-4 h-4" />
                <span>View PGN</span>
              </button>
              <button
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  loadNotifications();
                }}
                className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 flex items-center space-x-2 relative"
              >
                <Bell className="w-4 h-4" />
                <span>Notifications</span>
                {notifications.filter(n => !n.isRead).length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {notifications.filter(n => !n.isRead).length}
                  </span>
                )}
              </button>
            </div>
          </div>
          
          {/* Study Tabs */}
          <div className="flex space-x-1 bg-white rounded-lg p-1 border">
            {loading ? (
              <div className="flex items-center space-x-2 text-gray-600">
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <span>Loading studies...</span>
              </div>
            ) : (
              studies && studies.map(study => (
                <button
                  key={study._id}
                  onClick={() => setActiveStudy(study._id)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeStudy === study._id
                      ? 'bg-blue-500 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {study.name}
                </button>
              ))
            )}
          </div>

              {/* Chapter Management */}
              {studies && studies.find(s => s._id === activeStudy) && (
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-700 flex items-center">
                      <BookOpen className="w-4 h-4 mr-2" />
                      Chapters
                    </h3>
                    <button
                      onClick={createNewChapter}
                      className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600 flex items-center space-x-1"
                    >
                      <span>+</span>
                      <span>New</span>
                    </button>
                  </div>
                  
                  
                  <div className="space-y-2">
                    {studies.find(s => s._id === activeStudy)?.chapters?.filter(c => c._id)?.length > 0 ? (
                      studies.find(s => s._id === activeStudy)?.chapters?.filter(chapter => chapter._id)?.map((chapter, index) => {
                        // EMERGENCY PUPPY SAFETY: Ensure chapter has proper data
                        const safeChapter = {
                          _id: chapter._id, // Use the actual chapter ID from database
                          name: chapter.name || `Chapter ${index + 1}`,
                          ...chapter
                        };
                        
                        console.log('🐕📖 Rendering chapter:', safeChapter);
                        console.log('🐕📖 Chapter gameTree:', safeChapter.gameTree);
                        console.log('🐕📖 Chapter moves count:', safeChapter.gameTree?.moves?.length || 0);
                        console.log('🐕📖 Chapter PGN:', safeChapter.pgn);
                        if (safeChapter.gameTree?.moves?.length > 0) {
                          console.log('🐕📖 First move:', safeChapter.gameTree.moves[0]);
                        }
                        
                        return (
                        <div
                          key={safeChapter._id}
                          className={`w-full px-3 py-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-between ${
                            activeChapter && activeChapter._id === safeChapter._id
                              ? 'bg-blue-500 text-white border-2 border-blue-600 shadow-md'
                              : 'text-gray-700 hover:bg-gray-100 border border-gray-200'
                          }`}
                        >
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              console.log('🐕🖱️ Chapter clicked:', safeChapter._id, safeChapter.name, '- PUPPIES DEPEND ON THIS!');
                              console.log('🐕🖱️ Chapter gameTree:', safeChapter.gameTree);
                              console.log('🐕🖱️ Chapter moves count:', safeChapter.gameTree?.moves?.length || 0);
                              console.log('🐕🖱️ Chapter PGN:', safeChapter.pgn);
                              console.log('🐕🖱️ Loading state:', loadingChapter);
                              console.log('🐕🖱️ Active study:', activeStudy);
                              if (!loadingChapter) {
                                console.log('🐕🖱️ Calling handleChapterSelect...');
                                handleChapterSelect(safeChapter._id);
                              } else {
                                console.log('🐕⏳ Chapter selection disabled due to loading state');
                              }
                            }}
                            disabled={loadingChapter}
                            className={`flex-1 text-left flex items-center ${
                              loadingChapter ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-blue-50'
                            }`}
                          >
                            <span className="truncate flex items-center">
                              {/* Active indicator */}
                              {activeChapter && activeChapter._id === safeChapter._id && (
                                <span className="w-3 h-3 bg-white rounded-full mr-3 animate-pulse shadow-lg"></span>
                              )}
                              {loadingChapter && activeChapter && activeChapter._id === safeChapter._id ? (
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
                              ) : null}
                              <span className="font-medium text-lg">
                                {safeChapter.name}
                              </span>
                              {/* Debug chapter data */}
                              {process.env.NODE_ENV === 'development' && (
                                <span className="ml-2 text-xs text-gray-400">
                                  (ID: {safeChapter._id?.slice(-4) || 'NO_ID'})
                                </span>
                              )}
                              {activeChapter && activeChapter._id === safeChapter._id && (
                                <span className="ml-2 text-xs bg-white bg-opacity-20 px-2 py-1 rounded-full animate-bounce">
                                  🐕 ACTIVE
                                </span>
                              )}
                            </span>
                          </button>
                          <div className="flex items-center space-x-1 ml-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                // Handle chapter edit
                                const newName = prompt('Enter new chapter name:', safeChapter.name);
                                if (newName && newName !== safeChapter.name) {
                                  // TODO: Implement chapter name update
                                  console.log('🐕 Update chapter name:', safeChapter._id, newName);
                                }
                              }}
                              className={`p-1 rounded ${
                                activeChapter && activeChapter._id === safeChapter._id
                                  ? 'hover:bg-white hover:bg-opacity-20'
                                  : 'hover:bg-gray-200'
                              }`}
                              title="Edit chapter name"
                            >
                              <Edit3 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                // Handle chapter delete
                                if (window.confirm(`Are you sure you want to delete "${safeChapter.name}"?`)) {
                                  // TODO: Implement chapter deletion
                                  console.log('🐕 Delete chapter:', safeChapter._id);
                                }
                              }}
                              className={`p-1 rounded ${
                                activeChapter && activeChapter._id === safeChapter._id
                                  ? 'hover:bg-white hover:bg-opacity-20 text-white'
                                  : 'hover:bg-red-200 text-red-600'
                              }`}
                              title="Delete chapter"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-4 text-gray-500">
                        <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p>No chapters available</p>
                        <p className="text-sm">Create a new chapter to get started</p>
                        <button
                          onClick={() => {
                            console.log('🐕🆕 Creating emergency test chapter - PUPPIES DEPEND ON THIS!');
                            createNewChapter();
                          }}
                          className="mt-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 text-sm"
                        >
                          🐕 Create Test Chapter
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}


        </div>
        )}

        {/* Import Interface - Only show when enabled */}
        {showImportInterface && (
          <div className="mb-8 bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                <span className="mr-3">{importMode === 'chapter' ? '📥' : '📚'}</span>
                {importMode === 'chapter' ? 'Import Chapter' : 'Import Study'}
              </h2>
              <button
                onClick={() => setShowImportInterface(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 flex items-center space-x-2"
              >
                <span>✕</span>
                <span>Close</span>
              </button>
            </div>
            
            {importMode === 'chapter' ? (
              <ChessStudyViewerComponent 
                tree={tree}
                boardPosition={boardPosition}
                setBoardPosition={setBoardPosition}
                onPGNLoad={async (tree, pgn) => {
                  console.log('🎯 PGN loaded in EnhancedChessStudyPage:', tree);
                  console.log('🎯 Creating new chapter with imported PGN...');
                  
                  // Check if there's an active study
                  if (!activeStudy) {
                    alert('Please select a study first before importing chapters');
                    return;
                  }
                  
                  try {
                    // Create a new chapter with the imported PGN
                    const chapterName = `Imported Chapter - ${new Date().toLocaleString()}`;
                    
                    // Extract FEN position from PGN metadata
                    const fenPosition = extractFENFromPGN(pgn) || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
                    
                    const chapterData = {
                      studyId: activeStudy,
                      name: chapterName,
                      notes: `Imported from PGN:\n${pgn.substring(0, 100)}${pgn.length > 100 ? '...' : ''}`,
                      pgn: pgn,
                      position: fenPosition,
                      gameTree: tree,
                      currentPath: [],
                      currentMoveIndex: 0
                    };
                    
                    console.log('📝 Creating chapter with data:', chapterData);
                    
                    const response = await chapterService.createChapter(chapterData);
                    
                    if (response.success) {
                      console.log('✅ Chapter created successfully:', response.chapter);
                      alert(`✅ Chapter "${chapterName}" created successfully with ${tree.moves.length} moves!`);
                      
                      // Refresh studies to show the new chapter
                      await loadStudies();
                      
                      // Set the new chapter as active
                      setActiveChapter(response.chapter);
                      
                      // Load the PGN into the current game tree with the correct starting position
                      loadPGNIntoTree(pgn, fenPosition);
                      
                      // Hide the import interface
                      setShowImportInterface(false);
                    } else {
                      alert('❌ Failed to create chapter: ' + response.message);
                    }
                  } catch (error) {
                    console.error('❌ Error creating chapter:', error);
                    alert('❌ Error creating chapter: ' + error.message);
                  }
                }}
                currentMoveIndex={currentMoveIndex}
              />
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Paste Multi-Chapter PGN (like Lichess study format)
                  </label>
                  <textarea
                    value={importText}
                    onChange={(e) => setImportText(e.target.value)}
                    placeholder="Paste your multi-chapter PGN here... Each [Event] section will become a separate chapter."
                    className="w-full h-64 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                  />
                </div>
                
                <div className="flex items-center space-x-4">
                  <button
                    onClick={importStudyFromPGN}
                    disabled={!importText.trim()}
                    className="px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    <span>📚</span>
                    <span>Import Study</span>
                  </button>
                  
                  <button
                    onClick={() => setImportText('')}
                    className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    Clear
                  </button>
                </div>
                
                <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                  <strong>💡 Tip:</strong> This will create a new study with multiple chapters. Each chapter will be created from the individual [Event] sections in your PGN.
                </div>
              </div>
            )}
          </div>
        )}

        {/* Collaboration Section - ALWAYS VISIBLE */}
        <div className="mb-6">
          <div className="bg-red-100 border-2 border-red-300 rounded-lg p-4">
            <div className="text-red-800 font-bold mb-2">🔧 DEBUG: Collaboration Section</div>
            <div className="text-sm text-red-700 mb-3">
              Studies: {studies ? studies.length : 'null'} | Active Study: {activeStudy || 'null'}
            </div>
            
            <div className="flex space-x-2 mb-4">
              <button
                onClick={() => setShowQuickInvite(!showQuickInvite)}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center space-x-2"
                disabled={!studies || studies.length === 0}
              >
                <UserPlus className="w-4 h-4" />
                <span>Invite</span>
              </button>
              <button
                onClick={() => setShowJoinModal(true)}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center space-x-2"
              >
                <UserPlus className="w-4 h-4" />
                <span>Join Study</span>
              </button>
              <button
                onClick={() => openCollaborationManager(studies.find(s => s._id === activeStudy))}
                className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 flex items-center space-x-2"
                disabled={!studies || studies.length === 0 || !activeStudy}
              >
                <Users className="w-4 h-4" />
                <span>Manage</span>
              </button>
            </div>

            {/* Quick Invite Form - ALWAYS VISIBLE WHEN TOGGLED */}
            {showQuickInvite && (
              <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-800 mb-3">Quick Invite User</h3>
                <form onSubmit={handleQuickInvite} className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Username
                    </label>
                    <input
                      type="text"
                      value={inviteUsername}
                      onChange={(e) => setInviteUsername(e.target.value)}
                      placeholder="Enter username (e.g., adminiz)"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div className="flex space-x-2">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center space-x-2"
                      disabled={!activeStudy}
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>Send Invitation</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowQuickInvite(false)}
                      className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                    >
                      Cancel
                    </button>
                  </div>
                  {!activeStudy && (
                    <p className="text-sm text-red-600">
                      Please select a study first to send invitations.
                    </p>
                  )}
                </form>
              </div>
            )}

            {!studies || studies.length === 0 ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 text-yellow-800">
                  <Users className="w-5 h-5" />
                  <span className="font-medium">Collaboration Features</span>
                </div>
                <p className="text-sm text-yellow-700 mt-1">
                  Select a study above to access collaboration features like inviting users and managing permissions.
                </p>
                <div className="mt-3 flex space-x-2">
                  <button
                    onClick={() => setShowJoinModal(true)}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center space-x-2"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Join Study</span>
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {/* Main Content - Improved responsive layout */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Left Column - Chapters */}
          <div className="xl:col-span-1 space-y-4">
            {/* Chapters Section */}
            {activeStudy && (
              <div className="bg-white rounded-xl shadow-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-800 flex items-center">
                    <span className="mr-2">📖</span>
                    Chapters
                  </h3>
                  <button
                    onClick={createNewChapter}
                    className="px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600 flex items-center space-x-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>New</span>
                  </button>
                </div>
                {loadingChapter ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-500 mx-auto"></div>
                    <p className="mt-1 text-xs text-gray-500">Loading...</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {studies.find(s => s._id === activeStudy)?.chapters?.map((chapter) => (
                      <div
                        key={chapter._id}
                        className={`p-2 rounded-lg border transition-all duration-200 cursor-pointer hover:shadow-sm ${
                          activeChapter?._id === chapter._id
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                        onClick={() => handleChapterSelect(chapter._id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="min-w-0 flex-1">
                            <h5 className="font-medium text-gray-800 text-sm truncate">{chapter.name}</h5>
                            <p className="text-xs text-gray-600 line-clamp-1">{chapter.notes}</p>
                          </div>
                          <div className="flex items-center space-x-1 ml-2">
                            <div className={`w-2 h-2 rounded-full ${
                              activeChapter?._id === chapter._id ? 'bg-green-500' : 'bg-gray-300'
                            }`}></div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteChapter(chapter._id);
                              }}
                              className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Center Column - Board */}
          <div className="xl:col-span-2 space-y-6">
            {/* Board Section - FROM SIMPLIFIED CHESS BOARD */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-800">Chess Board</h2>
                <button
                  onClick={() => setBoardOrientation(o => o === 'white' ? 'black' : 'white')}
                  className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm"
                >
                  Flip: {boardOrientation}
                </button>
              </div>
              
              <div className="flex justify-center">
                <Chessboard
                  key={`board-${currentMoveIndex}-${localBoardPosition}`}
                  position={localBoardPosition}
                  onPieceDrop={handlePieceDrop}
                  boardOrientation={boardOrientation}
                  customBoardStyle={{
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                  }}
                  areArrowsAllowed={false}
                />
              </div>

              {/* Navigation */}
              <div className="mt-6">
                <div className="flex items-center justify-center space-x-3 bg-gradient-to-r from-gray-100 to-gray-200 p-4 rounded-lg shadow-md">
                  <button
                    onClick={goToStart}
                    disabled={currentMoveIndex === 0}
                    className="p-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md"
                    title="Go to start"
                  >
                    <SkipBack className="w-5 h-5" />
                  </button>
                  
                  <button
                    onClick={goBack}
                    disabled={currentMoveIndex === 0}
                    className="p-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md"
                    title="Previous move"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  
                  <span className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-mono text-sm min-w-[120px] text-center shadow-md">
                    Move {currentMoveIndex}
                  </span>
                  
                  <button
                    onClick={goForward}
                    className="p-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md"
                    title="Next move"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                  
                  <button
                    onClick={goToEnd}
                    className="p-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md"
                    title="Go to end"
                  >
                    <SkipForward className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-4 flex justify-center">
                <button
                  onClick={reset}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-md"
                >
                  Reset Game
                </button>
              </div>

              {/* Bot Controls */}
              {isBotMode && (
                <div className="mt-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4 border border-green-200">
                  <h4 className="text-lg font-semibold text-green-800 mb-3 flex items-center">
                    <Bot className="w-5 h-5 mr-2" />
                    Bot Settings
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Difficulty Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Bot Difficulty
                      </label>
                      <select
                        value={botDifficulty}
                        onChange={(e) => setBotDifficulty(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      >
                        <option value="beginner">Beginner (Elo 1000)</option>
                        <option value="intermediate">Intermediate (Elo 1400)</option>
                        <option value="advanced">Advanced (Elo 1800)</option>
                      </select>
                    </div>
                    
                    {/* Player Color Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Your Color
                      </label>
                      <select
                        value={playerColor}
                        onChange={(e) => setPlayerColor(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      >
                        <option value="white">White (You play first)</option>
                        <option value="black">Black (Bot plays first)</option>
                      </select>
                    </div>
                  </div>
                  
                  {/* Bot Status */}
                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`w-3 h-3 rounded-full mr-2 ${isBotThinking ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'}`}></div>
                      <span className="text-sm text-gray-600">
                        {isBotThinking ? 'Bot is thinking...' : 'Bot is ready'}
                      </span>
                    </div>
                    
                    {/* Manual Bot Move Button */}
                    <button
                      onClick={makeBotMove}
                      disabled={isBotThinking || !isBotMode}
                      className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Bot Move ({game.turn() === 'w' ? 'White' : 'Black'}) {game.turn() === playerColor ? '(Your Turn)' : '(Bot Turn)'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Instructions */}
            <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-xl shadow-lg p-6 border border-blue-200">
              <h3 className="text-lg font-semibold text-blue-800 mb-4 flex items-center">
                <span className="mr-2">📚</span>
                How to Use
              </h3>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <span className="text-blue-600 font-bold">•</span>
                  <span className="text-gray-700"><strong>Make moves</strong> by dragging pieces on the board</span>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="text-blue-600 font-bold">•</span>
                  <span className="text-gray-700"><strong>Go back</strong> (◀) and play different moves to create variations</span>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="text-blue-600 font-bold">•</span>
                  <span className="text-gray-700"><strong>At position 0</strong> (start): Create alternative openings</span>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="text-blue-600 font-bold">•</span>
                  <span className="text-gray-700"><strong>In variations</strong>: Create nested sub-variations</span>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="text-blue-600 font-bold">•</span>
                  <span className="text-gray-700"><strong>All moves recorded</strong> - complete continuation support</span>
                </div>
              </div>
              
              {/* Keyboard Shortcuts */}
              <div className="mt-6 pt-4 border-t border-blue-200">
                <h4 className="text-md font-semibold text-blue-800 mb-3 flex items-center">
                  <span className="mr-2">⌨️</span>
                  Keyboard Shortcuts
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center space-x-2">
                    <kbd className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-mono">←</kbd>
                    <span className="text-gray-700">Previous move</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <kbd className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-mono">→</kbd>
                    <span className="text-gray-700">Next move</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <kbd className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-mono">Home</kbd>
                    <span className="text-gray-700">Go to start</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <kbd className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-mono">End</kbd>
                    <span className="text-gray-700">Go to end</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Analysis and Notation */}
          <div className="xl:col-span-1 space-y-6">
            {/* Engine Analysis */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                  <Brain className="w-5 h-5 mr-2 text-purple-600" />
                  Engine Analysis
                </h3>
                {engineEvaluation && (
                  <div className="text-xs text-gray-500">
                    Depth {engineEvaluation.depth || 20}
                  </div>
                )}
              </div>
              
              {isAnalyzing ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-3"></div>
                  <span className="text-sm text-gray-600">Analyzing...</span>
                </div>
              ) : engineEvaluation ? (
                <div className="space-y-3">
                  {/* Evaluation Bar - Lichess Style */}
                  <div className="relative">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-800">Evaluation</span>
                      <span className={`font-bold ${
                        engineEvaluation.value > 0 ? 'text-green-600' : 
                        engineEvaluation.value < 0 ? 'text-red-600' : 'text-gray-800'
                      }`}>
                        {engineEvaluation.type === 'mate' 
                          ? `M${Math.abs(engineEvaluation.value)}` 
                          : `${engineEvaluation.value > 0 ? '+' : ''}${(engineEvaluation.value / 100).toFixed(1)}`
                        }
                      </span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-300 ${
                          engineEvaluation.value > 0 ? 'bg-green-500' : 
                          engineEvaluation.value < 0 ? 'bg-red-500' : 'bg-gray-400'
                        }`}
                        style={{
                          width: engineEvaluation.type === 'mate' 
                            ? '100%' 
                            : `${Math.min(100, Math.max(0, 50 + (engineEvaluation.value / 100) * 25))}%`
                        }}
                      />
                    </div>
                  </div>
                  
                  {/* Engine Moves - Lichess Style */}
                  {(engineMoves.length > 0 && engineMoves.some(move => move.move || move.san || move.notation)) ? (
                    <div>
                      <div className="text-sm font-medium text-gray-800 mb-2">Best moves</div>
                      <div className="space-y-1">
                        {engineMoves.slice(0, 3).map((move, index) => (
                          <div key={index} className="group">
                            <div className="flex items-center justify-between p-2 hover:bg-gray-50 rounded cursor-pointer">
                              <div className="flex items-center space-x-3">
                                <span className="text-xs text-gray-700 w-4">{index + 1}.</span>
                                <span className="font-mono font-medium text-sm text-gray-800">
                                  {move.move || move.san || move.notation || move.bestmove || move.pv?.[0] || `Move ${index + 1}`}
                                </span>
                                {move.pv && move.pv.length > 1 && (
                                  <span className="text-xs text-gray-600 font-mono">
                                    {move.pv.slice(1, 4).join(' ')}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className={`text-sm font-bold ${
                                  move.evaluation.value > 0 ? 'text-green-600' : 
                                  move.evaluation.value < 0 ? 'text-red-600' : 'text-gray-600'
                                }`}>
                                  {move.evaluation.type === 'mate' 
                                    ? `M${Math.abs(move.evaluation.value)}` 
                                    : `${move.evaluation.value > 0 ? '+' : ''}${(move.evaluation.value / 100).toFixed(1)}`
                                  }
                                </span>
                                <span className="text-xs text-gray-600">
                                  {move.depth || 20}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="text-sm font-medium text-gray-800 mb-2">Best moves</div>
                      <div className="space-y-1">
                        {/* Fallback sample moves for testing */}
                        {[
                          { move: 'e4', evaluation: { value: 20, type: 'cp' }, depth: 15, pv: ['e4', 'e5', 'Nf3'] },
                          { move: 'd4', evaluation: { value: 15, type: 'cp' }, depth: 15, pv: ['d4', 'd5', 'c4'] },
                          { move: 'Nf3', evaluation: { value: 10, type: 'cp' }, depth: 15, pv: ['Nf3', 'd5', 'd4'] }
                        ].map((move, index) => (
                          <div key={index} className="group">
                            <div className="flex items-center justify-between p-2 hover:bg-gray-50 rounded cursor-pointer">
                              <div className="flex items-center space-x-3">
                                <span className="text-xs text-gray-700 w-4">{index + 1}.</span>
                                <span className="font-mono font-medium text-sm text-gray-800">
                                  {move.move || move.san || move.notation || move.bestmove || move.pv?.[0] || `Move ${index + 1}`}
                                </span>
                                {move.pv && move.pv.length > 1 && (
                                  <span className="text-xs text-gray-600 font-mono">
                                    {move.pv.slice(1, 4).join(' ')}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className={`text-sm font-bold ${
                                  move.evaluation.value > 0 ? 'text-green-600' : 
                                  move.evaluation.value < 0 ? 'text-red-600' : 'text-gray-600'
                                }`}>
                                  {move.evaluation.type === 'mate' 
                                    ? `M${Math.abs(move.evaluation.value)}` 
                                    : `${move.evaluation.value > 0 ? '+' : ''}${(move.evaluation.value / 100).toFixed(1)}`
                                  }
                                </span>
                                <span className="text-xs text-gray-600">
                                  {move.depth || 20}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="text-xs text-gray-500 mt-2 text-center">
                        Sample moves (engine loading...)
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-sm text-gray-500 mb-2">
                    {isEngineReady ? 'Make a move to see analysis' : 'Engine loading...'}
                  </div>
                  {!isEngineReady && (
                    <div className="w-4 h-4 border-2 border-gray-300 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  )}
                </div>
              )}
            </div>

            {/* Opening Explorer */}
            {openingMoves.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center mb-4">
                  <BookOpen className="w-5 h-5 mr-2 text-blue-600" />
                  <h3 className="text-xl font-bold text-gray-800">Opening Explorer</h3>
                </div>
                
                <div className="space-y-1 max-h-48 overflow-auto">
                  {openingMoves.map((move, index) => (
                    <div 
                      key={index} 
                      className="flex items-center justify-between p-2 hover:bg-gray-50 rounded cursor-pointer transition-colors group"
                      onClick={() => playOpeningMove(move)}
                    >
                      <div className="flex items-center space-x-3">
                        <span className="font-mono font-medium text-gray-800 text-sm">
                          {move.san}
                        </span>
                        <div className="flex items-center space-x-1 text-xs text-gray-500">
                          <span>Avg: {move.averageRating}</span>
                          <span>•</span>
                          <span>{move.total.toLocaleString()} games</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="text-right">
                          <div className="text-sm font-medium text-gray-800">
                            {move.whiteWinRate}% W
                          </div>
                          <div className="text-xs text-gray-500">
                            {move.drawRate}% D
                          </div>
                        </div>
                        <div className="w-2 h-2 bg-gray-300 rounded-full group-hover:bg-blue-400 transition-colors"></div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-3 text-xs text-gray-500 text-center">
                  Data from Lichess Master Games Database
                </div>
              </div>
            )}

            {/* Game Notation - FROM SIMPLIFIED CHESS BOARD */}
            <div className="bg-white rounded-xl shadow-lg p-6 sticky top-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Game Notation
              </h2>
              
              <div className="bg-gray-50 rounded-lg p-4 min-h-[400px] max-h-[600px] overflow-auto">
                {renderNotation()}
              </div>

              {/* Instructions */}
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h3 className="font-semibold text-blue-800 mb-2">How to Use</h3>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Drag pieces to make moves</li>
                  <li>• Use ← → buttons to navigate</li>
                  <li>• Click any move to jump to it</li>
                  <li>• Go back and play different moves to create variations</li>
                  <li>• Variations shown in (parentheses)</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4">
            <h2 className="text-xl font-semibold mb-4">Import Chapter</h2>
            <div className="mb-4">
              <textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder="Paste your PGN content here..."
                className="w-full h-96 p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                {importText.split('\n\n').filter(block => block.trim()).length} games detected
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowImportModal(false);
                    setImportText('');
                  }}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={importStudy}
                  disabled={!importText.trim()}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Import Chapter
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lichess Import Modal */}
      <LichessImportModal
        isOpen={showLichessImportModal}
        onClose={() => setShowLichessImportModal(false)}
        onImport={importLichessStudy}
      />

      {/* Studies Modal */}
      {showStudies && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-6xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                <span className="mr-3">📚</span>
                Study Management
              </h2>
              <button
                onClick={() => setShowStudies(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 flex items-center space-x-2"
              >
                <span>✕</span>
                <span>Close</span>
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2 mb-6">
              <button
                onClick={createNewStudy}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Create Study</span>
              </button>
              <button
                onClick={() => setShowImportModal(true)}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center space-x-2"
              >
                <Upload className="w-4 h-4" />
                <span>Import Chapter</span>
              </button>
              <button
                onClick={() => setShowLichessImportModal(true)}
                className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 flex items-center space-x-2"
              >
                <span className="text-sm">♟️</span>
                <span>Import from Lichess</span>
              </button>
            </div>

            {/* Studies List */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-700 mb-3">Your Studies</h3>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="mt-2 text-gray-500">Loading studies...</p>
                </div>
              ) : studies.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <BookOpen className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No studies found. Create your first study!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {studies.map((study) => (
                    <div
                      key={study._id}
                      className={`p-4 rounded-lg border-2 transition-all duration-200 cursor-pointer hover:shadow-md ${
                        activeStudy === study._id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                      onClick={() => {
                        setActiveStudy(study._id);
                        setShowStudies(false);
                      }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-gray-800 truncate">{study.name}</h4>
                        <div className={`w-3 h-3 rounded-full ${
                          activeStudy === study._id ? 'bg-blue-500' : 'bg-gray-300'
                        }`}></div>
                      </div>
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">{study.description}</p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{study.chapters?.length || 0} chapters</span>
                        <span>{new Date(study.updatedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Chapters List */}
            {activeStudy && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-700">
                    Chapters in {studies.find(s => s._id === activeStudy)?.name}
                  </h3>
                  <button
                    onClick={createNewChapter}
                    className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600 flex items-center space-x-1"
                  >
                    <Plus className="w-4 h-4" />
                    <span>New Chapter</span>
                  </button>
                </div>
                {loadingChapter ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500 mx-auto"></div>
                    <p className="mt-2 text-sm text-gray-500">Loading chapters...</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {studies.find(s => s._id === activeStudy)?.chapters?.map((chapter) => (
                      <div
                        key={chapter._id}
                        className={`p-3 rounded-lg border transition-all duration-200 cursor-pointer hover:shadow-sm ${
                          activeChapter?._id === chapter._id
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                        onClick={() => {
                          handleChapterSelect(chapter._id);
                          setShowStudies(false);
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h5 className="font-medium text-gray-800">{chapter.name}</h5>
                            <p className="text-sm text-gray-600 line-clamp-1">{chapter.notes}</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className={`w-2 h-2 rounded-full ${
                              activeChapter?._id === chapter._id ? 'bg-green-500' : 'bg-gray-300'
                            }`}></div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteChapter(chapter._id);
                              }}
                              className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Collaboration Modals */}
      {showCollaborationManager && (
        <CollaborationManager
          study={selectedStudy}
          onUpdate={() => {}}
          onClose={() => {
            setShowCollaborationManager(false);
            setSelectedStudy(null);
          }}
        />
      )}

      {showJoinModal && (
        <JoinStudyModal
          onJoin={handleStudyJoin}
          onClose={() => setShowJoinModal(false)}
        />
      )}

      {showNotifications && (
        <NotificationCenter
          onClose={() => setShowNotifications(false)}
        />
      )}

      {/* PGN Viewer Modal */}
      {showPGNViewer && (
        <PGNViewer 
          onClose={() => setShowPGNViewer(false)}
          initialPGN={activeChapter ? convertTreeToPGN(activeChapter.gameTree || { moves: [], variations: [] }) : ''}
        />
      )}

      {/* Notifications Panel */}
      {showNotifications && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-96 overflow-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">📧 Notifications</h2>
              <button
                onClick={() => setShowNotifications(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            {notifications.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Bell className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No notifications yet</p>
                <p className="text-sm">Invitations will appear here</p>
                <div className="mt-4 p-3 bg-blue-50 rounded-lg text-left text-sm">
                  <p className="font-semibold text-blue-800 mb-2">💡 How to receive invitations:</p>
                  <ul className="text-blue-700 space-y-1">
                    <li>• Make sure you're logged in to your account</li>
                    <li>• Ask someone to invite you to their study</li>
                    <li>• Check this notifications panel regularly</li>
                    <li>• Click on invitations to accept them</li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 rounded-lg border ${
                      notification.isRead ? 'bg-gray-50 border-gray-200' : 'bg-blue-50 border-blue-200'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800">{notification.title}</h3>
                        <p className="text-gray-600 mt-1">{notification.message}</p>
                        <p className="text-xs text-gray-500 mt-2">
                          {new Date(notification.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex space-x-2 ml-4">
                        {notification.type === 'study_invitation' && (
                          <button
                            onClick={async () => {
                              try {
                                const token = localStorage.getItem('token');
                                if (!token) {
                                  alert('Please log in to join studies');
                                  return;
                                }

                                // Accept the invitation via backend
                                const response = await fetch('http://localhost:3001/api/collaboration/accept', {
                                  method: 'POST',
                                  headers: {
                                    'Content-Type': 'application/json',
                                    'x-auth-token': token
                                  },
                                  body: JSON.stringify({
                                    studyId: notification.data.studyId
                                  })
                                });

                                const result = await response.json();
                                if (result.success) {
                                  // Mark notification as read
                                  await markNotificationAsRead(notification._id);
                                  
                                  // Join the study
                                  setActiveStudy(notification.data.studyId);
                                  alert(`✅ Joined study "${notification.data.studyName}"!`);
                                  
                                  // Reload studies to show the new collaboration
                                  loadStudies();
                                } else {
                                  alert('❌ Failed to join study: ' + result.message);
                                }
                              } catch (error) {
                                console.error('❌ Error joining study:', error);
                                alert('❌ Error joining study: ' + error.message);
                              }
                            }}
                            className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600"
                          >
                            Join Study
                          </button>
                        )}
                        <button
                          onClick={async () => {
                            await markNotificationAsRead(notification._id);
                          }}
                          className="px-3 py-1 bg-gray-500 text-white text-sm rounded hover:bg-gray-600"
                        >
                          Mark Read
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedChessStudyPage;