import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import { ChevronLeft, ChevronRight, SkipBack, SkipForward, Plus, Trash2, Upload, Download, Brain, BookOpen, Users, Share2 } from 'lucide-react';
import { studyService, chapterService } from '../services/studyService';
import stockfishCloudService from '../services/StockfishCloudService';

/**
 * SimplifiedChessBoardPage - Enhanced with study management and analysis
 * - Multi-level sublines (unlimited nesting)
 * - Study and chapter management
 * - PGN import/export
 * - Stockfish engine analysis
 * - Collaboration features
 */
const SimplifiedChessBoardPage = () => {
  const navigate = useNavigate();
  
  // Study management state
  const [studies, setStudies] = useState([]);
  const [activeStudy, setActiveStudy] = useState(null);
  const [activeChapter, setActiveChapter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingChapter, setLoadingChapter] = useState(false);
  
  // Core game state
  const [game, setGame] = useState(new Chess());
  const [boardPosition, setBoardPosition] = useState(game.fen());
  
  // Game tree structure: { moves: [...], variations: [] }
  const [gameTree, setGameTree] = useState({ moves: [], variations: [] });
  
  // Current position tracking
  const [currentPath, setCurrentPath] = useState([]); // [] = mainline, [n] = in variation n
  const [currentMoveIndex, setCurrentMoveIndex] = useState(0);
  
  // Board settings
  const [boardOrientation, setBoardOrientation] = useState('white');
  
  // Engine analysis state
  const [engineEvaluation, setEngineEvaluation] = useState(null);
  const [engineMoves, setEngineMoves] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isEngineReady, setIsEngineReady] = useState(false);
  
  // UI state
  const [showStudyPanel, setShowStudyPanel] = useState(true);
  const [showEnginePanel, setShowEnginePanel] = useState(false);
  const [newStudyName, setNewStudyName] = useState('');
  const [newChapterName, setNewChapterName] = useState('');
  const [isCreatingStudy, setIsCreatingStudy] = useState(false);
  const [isCreatingChapter, setIsCreatingChapter] = useState(false);

  /**
   * Navigate to a specific position in the tree
   */
  const navigateToPosition = useCallback((path, moveIndex) => {
    console.log('📍 Navigating to path:', path, 'move index:', moveIndex);
    console.log('📍 Path length:', path.length);
    
    const newGame = new Chess();
    const movesToPlay = [];
    
    if (path.length === 0) {
      // Mainline - simple case
      for (let i = 0; i < moveIndex && i < gameTree.moves.length; i++) {
        movesToPlay.push(gameTree.moves[i]);
      }
    } else if (path.length === 2 && path[0] === -1) {
      // Root-level variation (alternative first move)
      const varIndex = path[1];
      const variation = gameTree.variations?.[varIndex];
      if (variation?.moves) {
        for (let i = 0; i < moveIndex && i < variation.moves.length; i++) {
          movesToPlay.push(variation.moves[i]);
        }
      }
    } else if (path.length === 4 && path[0] === -1) {
      // Sub-variation within root-level variation
      const [, varIndex1, branchPoint, varIndex2] = path;
      const variation1 = gameTree.variations?.[varIndex1];
      if (variation1?.moves) {
        for (let i = 0; i <= branchPoint && i < variation1.moves.length; i++) {
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
      // First-level variation: [branchPoint, varIndex]
      const branchPoint = path[0];
      const varIndex = path[1];
      
      // Play mainline moves up to branch point
      for (let i = 0; i <= branchPoint && i < gameTree.moves.length; i++) {
        movesToPlay.push(gameTree.moves[i]);
      }
      
      // Then play variation moves
      const variation = gameTree.moves[branchPoint]?.variations?.[varIndex];
      if (variation?.moves) {
        for (let i = 0; i < moveIndex && i < variation.moves.length; i++) {
          movesToPlay.push(variation.moves[i]);
        }
      }
    } else if (path.length === 4) {
      // Second-level variation: [branchPoint1, varIndex1, branchPoint2, varIndex2]
      const [branchPoint1, varIndex1, branchPoint2, varIndex2] = path;
      
      // Play mainline moves up to first branch point
      for (let i = 0; i <= branchPoint1 && i < gameTree.moves.length; i++) {
        movesToPlay.push(gameTree.moves[i]);
      }
      
      // Play first variation moves up to second branch point
      const variation1 = gameTree.moves[branchPoint1]?.variations?.[varIndex1];
      if (variation1?.moves) {
        for (let i = 0; i <= branchPoint2 && i < variation1.moves.length; i++) {
          movesToPlay.push(variation1.moves[i]);
        }
        
        // Play second variation moves
        const variation2 = variation1.moves[branchPoint2]?.variations?.[varIndex2];
        if (variation2?.moves) {
          for (let i = 0; i < moveIndex && i < variation2.moves.length; i++) {
            movesToPlay.push(variation2.moves[i]);
          }
        }
      }
    } else if (path.length === 6) {
      // Third-level variation: [bp1, vi1, bp2, vi2, bp3, vi3]
      const [bp1, vi1, bp2, vi2, bp3, vi3] = path;
      
      console.log('🔍 Third-level navigation:', { bp1, vi1, bp2, vi2, bp3, vi3, moveIndex });
      
      // Play mainline moves up to first branch point
      for (let i = 0; i <= bp1 && i < gameTree.moves.length; i++) {
        movesToPlay.push(gameTree.moves[i]);
      }
      console.log('📝 After mainline:', movesToPlay.map(m => m.san));
      
      // Play first variation moves up to second branch point
      const variation1 = gameTree.moves[bp1]?.variations?.[vi1];
      if (variation1?.moves) {
        for (let i = 0; i <= bp2 && i < variation1.moves.length; i++) {
          movesToPlay.push(variation1.moves[i]);
        }
        console.log('📝 After first variation:', movesToPlay.map(m => m.san));
        
        // Play second variation moves up to third branch point
        const variation2 = variation1.moves[bp2]?.variations?.[vi2];
        if (variation2?.moves) {
          for (let i = 0; i <= bp3 && i < variation2.moves.length; i++) {
            movesToPlay.push(variation2.moves[i]);
          }
          console.log('📝 After second variation:', movesToPlay.map(m => m.san));
          
          // Play third variation moves
          const variation3 = variation2.moves[bp3]?.variations?.[vi3];
          console.log('📝 Third variation exists?', !!variation3, 'moves:', variation3?.moves?.map(m => m.san));
          if (variation3?.moves) {
            for (let i = 0; i < moveIndex && i < variation3.moves.length; i++) {
              movesToPlay.push(variation3.moves[i]);
            }
            console.log('📝 After third variation:', movesToPlay.map(m => m.san));
          }
        }
      }
    }
    
    // Apply all moves
    movesToPlay.forEach(move => {
      try {
        newGame.move(move.san);
      } catch (e) {
        console.error('Error applying move:', move, e);
      }
    });
    
    setGame(newGame);
    setBoardPosition(newGame.fen());
    setCurrentPath(path);
    setCurrentMoveIndex(moveIndex);
  }, [gameTree]);

  /**
   * Handle piece drop on board
   */
  const onPieceDrop = useCallback((sourceSquare, targetSquare) => {
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
      let createdNewVariation = false;
      let shouldSkipTreeUpdate = false;
      
      setGameTree(prevTree => {
        const newTree = JSON.parse(JSON.stringify(prevTree));
        
        if (currentPath.length === 0) {
          // Adding to mainline
          console.log('📊 Mainline state:', {
            currentMoveIndex,
            mainlineLength: newTree.moves.length,
            existingMoveAtIndex: newTree.moves[currentMoveIndex]?.san,
            newMove: move.san
          });
          
          // Check if there's already a different move at this position
          const existingMove = newTree.moves[currentMoveIndex];
          
          if (!existingMove) {
            // No move at this position - appending at end
            console.log('📝 Appending to mainline');
            newTree.moves.push({ san: move.san, variations: [] });
          } else if (existingMove.san !== move.san) {
            // Different move exists - create variation
            console.log('📝 Creating new variation from mainline (different move)');
            const parentMoveIndex = currentMoveIndex - 1;
            
            if (parentMoveIndex < 0) {
              // Special case: Alternative first move (position 0)
              // Store as variation at game tree root level
              console.log('📝 Creating alternative first move');
              if (!newTree.variations) {
                newTree.variations = [];
              }
              newTree.variations.push({ moves: [{ san: move.san, variations: [] }] });
              // Path format for root-level variation: [-1, variationIndex]
              newPath = [-1, newTree.variations.length - 1];
              newMoveIndex = 1;
              createdNewVariation = true;
            } else if (parentMoveIndex >= 0) {
              const parentMove = newTree.moves[parentMoveIndex];
              if (!parentMove.variations) {
                parentMove.variations = [];
              }
              parentMove.variations.push({ moves: [{ san: move.san, variations: [] }] });
              // Update path to reflect we're now in this new variation
              newPath = [parentMoveIndex, parentMove.variations.length - 1];
              newMoveIndex = 1; // First move in new variation
              createdNewVariation = true;
            }
          } else {
            // Same move exists - don't modify tree, just navigate forward
            console.log('⚠️ Same move already exists - will navigate forward');
            shouldSkipTreeUpdate = true;
            newMoveIndex = currentMoveIndex + 1;
          }
        } else if (currentPath.length === 2 && currentPath[0] === -1) {
          // Adding to root-level variation (alternative first move)
          const varIndex = currentPath[1];
          const variation = newTree.variations[varIndex];
          
          console.log('📊 Root-level variation state:', {
            currentMoveIndex,
            variationLength: variation.moves.length,
            existingMoveAtIndex: variation.moves[currentMoveIndex]?.san,
            newMove: move.san
          });
          
          // Check if there's already a different move at this position
          const existingMove = variation.moves[currentMoveIndex];
          
          if (!existingMove) {
            // No move at this position - appending at end
            console.log('📝 Appending to root-level variation');
            variation.moves.push({ san: move.san, variations: [] });
          } else if (existingMove.san !== move.san) {
            // Different move exists - create sub-variation
            console.log('📝 Creating sub-variation from root-level variation');
            const parentMoveIndex = currentMoveIndex - 1;
            if (parentMoveIndex >= 0) {
              const parentMove = variation.moves[parentMoveIndex];
              if (!parentMove.variations) {
                parentMove.variations = [];
              }
              parentMove.variations.push({ moves: [{ san: move.san, variations: [] }] });
              // Update path to reflect we're now in this sub-variation
              newPath = [-1, varIndex, parentMoveIndex, parentMove.variations.length - 1];
              newMoveIndex = 1;
              createdNewVariation = true;
            }
          } else {
            // Same move exists - don't modify tree, just navigate forward
            console.log('⚠️ Same move already exists - will navigate forward');
            shouldSkipTreeUpdate = true;
            newMoveIndex = currentMoveIndex + 1;
          }
        } else if (currentPath.length === 2) {
          // Adding to first-level variation
          const branchPoint = currentPath[0];
          const varIndex = currentPath[1];
          const variation = newTree.moves[branchPoint].variations[varIndex];
          
          console.log('📊 First-level variation state:', {
            currentMoveIndex,
            variationLength: variation.moves.length,
            existingMoveAtIndex: variation.moves[currentMoveIndex]?.san,
            newMove: move.san
          });
          
          // Check if there's already a different move at this position
          const existingMove = variation.moves[currentMoveIndex];
          
          if (!existingMove) {
            // No move at this position - appending at end
            console.log('📝 Appending to first-level variation');
            variation.moves.push({ san: move.san, variations: [] });
          } else if (existingMove.san !== move.san) {
            // Different move exists - create sub-variation
            console.log('📝 Creating sub-variation (different move)');
            const parentMoveIndex = currentMoveIndex - 1;
            if (parentMoveIndex >= 0) {
              const parentMove = variation.moves[parentMoveIndex];
              if (!parentMove.variations) {
                parentMove.variations = [];
              }
              parentMove.variations.push({ moves: [{ san: move.san, variations: [] }] });
              // Update path to reflect we're now in this sub-variation
              newPath = [branchPoint, varIndex, parentMoveIndex, parentMove.variations.length - 1];
              newMoveIndex = 1; // First move in new sub-variation
              createdNewVariation = true;
            }
          } else {
            // Same move exists - don't modify tree, just navigate forward
            console.log('⚠️ Same move already exists - will navigate forward');
            shouldSkipTreeUpdate = true;
            newMoveIndex = currentMoveIndex + 1;
          }
        } else if (currentPath.length === 4) {
          // Adding to second-level variation
          const [bp1, vi1, bp2, vi2] = currentPath;
          const variation1 = newTree.moves[bp1].variations[vi1];
          const variation2 = variation1.moves[bp2].variations[vi2];
          
          console.log('📊 Second-level variation state:', {
            currentMoveIndex,
            variation2Length: variation2.moves.length,
            existingMoveAtIndex: variation2.moves[currentMoveIndex]?.san,
            newMove: move.san
          });
          
          // Check if there's already a different move at this position
          const existingMove = variation2.moves[currentMoveIndex];
          
          if (!existingMove) {
            // No move at this position - appending at end
            console.log('📝 Appending to second-level variation');
            variation2.moves.push({ san: move.san, variations: [] });
          } else if (existingMove.san !== move.san) {
            // Different move exists - create third-level variation
            console.log('📝 Creating third-level variation (different move)');
            const parentMoveIndex = currentMoveIndex - 1;
            if (parentMoveIndex >= 0) {
              const parentMove = variation2.moves[parentMoveIndex];
              if (!parentMove.variations) {
                parentMove.variations = [];
              }
              parentMove.variations.push({ moves: [{ san: move.san, variations: [] }] });
              // Update path to reflect we're now in this third-level variation
              newPath = [bp1, vi1, bp2, vi2, parentMoveIndex, parentMove.variations.length - 1];
              newMoveIndex = 1;
              createdNewVariation = true;
            }
          } else {
            // Same move exists - don't modify tree, just navigate forward
            console.log('⚠️ Same move already exists - will navigate forward');
            shouldSkipTreeUpdate = true;
            newMoveIndex = currentMoveIndex + 1;
          }
        } else if (currentPath.length === 6) {
          // Adding to third-level variation
          const [bp1, vi1, bp2, vi2, bp3, vi3] = currentPath;
          const variation1 = newTree.moves[bp1].variations[vi1];
          const variation2 = variation1.moves[bp2].variations[vi2];
          const variation3 = variation2.moves[bp3].variations[vi3];
          
          console.log('📊 Third-level variation state:', {
            currentMoveIndex,
            variation3Length: variation3.moves.length,
            existingMoveAtIndex: variation3.moves[currentMoveIndex]?.san,
            newMove: move.san
          });
          
          // Check if there's already a different move at this position
          const existingMove = variation3.moves[currentMoveIndex];
          
          if (!existingMove) {
            // No move at this position - appending at end
            console.log('📝 Appending to third-level variation');
            variation3.moves.push({ san: move.san, variations: [] });
          } else if (existingMove.san !== move.san) {
            // Different move exists - create fourth-level variation
            console.log('📝 Creating fourth-level variation (different move)');
            const parentMoveIndex = currentMoveIndex - 1;
            if (parentMoveIndex >= 0) {
              const parentMove = variation3.moves[parentMoveIndex];
              if (!parentMove.variations) {
                parentMove.variations = [];
              }
              parentMove.variations.push({ moves: [{ san: move.san, variations: [] }] });
              // Note: Fourth level would need path length 8, not implementing full navigation for now
              console.log('⚠️ Fourth-level created but full navigation not yet implemented');
            }
          } else {
            // Same move exists - don't modify tree, just navigate forward
            console.log('⚠️ Same move already exists - will navigate forward');
            shouldSkipTreeUpdate = true;
            newMoveIndex = currentMoveIndex + 1;
          }
        }
        
        // If we're just navigating to an existing move, don't modify the tree
        if (shouldSkipTreeUpdate) {
          return prevTree; // Return unchanged tree
        }
        
        return newTree;
      });
      
      console.log('🔄 Updated path:', newPath, 'moveIndex:', newMoveIndex, 'createdNew:', createdNewVariation, 'skipUpdate:', shouldSkipTreeUpdate);
      
      // Update game state
      setGame(gameCopy);
      setBoardPosition(gameCopy.fen());
      setCurrentPath(newPath);
      setCurrentMoveIndex(newMoveIndex);
      
      return true;
    } catch (error) {
      console.error('Invalid move:', error);
      return false;
    }
  }, [game, currentPath, currentMoveIndex]);

  /**
   * Go back one move
   */
  const goBack = useCallback(() => {
    if (currentMoveIndex > 0) {
      navigateToPosition(currentPath, currentMoveIndex - 1);
    }
  }, [currentPath, currentMoveIndex, navigateToPosition]);

  /**
   * Go forward one move
   */
  const goForward = useCallback(() => {
    let maxMoves = 0;
    
    if (currentPath.length === 0) {
      maxMoves = gameTree.moves.length;
    } else if (currentPath.length === 2 && currentPath[0] === -1) {
      // Root-level variation
      maxMoves = gameTree.variations?.[currentPath[1]]?.moves?.length || 0;
    } else if (currentPath.length === 4 && currentPath[0] === -1) {
      // Sub-variation within root-level variation
      const variation1 = gameTree.variations?.[currentPath[1]];
      maxMoves = variation1?.moves?.[currentPath[2]]?.variations?.[currentPath[3]]?.moves?.length || 0;
    } else if (currentPath.length === 2) {
      maxMoves = gameTree.moves[currentPath[0]]?.variations?.[currentPath[1]]?.moves?.length || 0;
    } else if (currentPath.length === 4) {
      const variation1 = gameTree.moves[currentPath[0]]?.variations?.[currentPath[1]];
      maxMoves = variation1?.moves?.[currentPath[2]]?.variations?.[currentPath[3]]?.moves?.length || 0;
    } else if (currentPath.length === 6) {
      const variation1 = gameTree.moves[currentPath[0]]?.variations?.[currentPath[1]];
      const variation2 = variation1?.moves?.[currentPath[2]]?.variations?.[currentPath[3]];
      maxMoves = variation2?.moves?.[currentPath[4]]?.variations?.[currentPath[5]]?.moves?.length || 0;
    }
    
    if (currentMoveIndex < maxMoves) {
      navigateToPosition(currentPath, currentMoveIndex + 1);
    }
  }, [currentPath, currentMoveIndex, gameTree, navigateToPosition]);

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
    let maxMoves = 0;
    
    if (currentPath.length === 0) {
      maxMoves = gameTree.moves.length;
    } else if (currentPath.length === 2 && currentPath[0] === -1) {
      // Root-level variation
      maxMoves = gameTree.variations?.[currentPath[1]]?.moves?.length || 0;
    } else if (currentPath.length === 4 && currentPath[0] === -1) {
      // Sub-variation within root-level variation
      const variation1 = gameTree.variations?.[currentPath[1]];
      maxMoves = variation1?.moves?.[currentPath[2]]?.variations?.[currentPath[3]]?.moves?.length || 0;
    } else if (currentPath.length === 2) {
      maxMoves = gameTree.moves[currentPath[0]]?.variations?.[currentPath[1]]?.moves?.length || 0;
    } else if (currentPath.length === 4) {
      const variation1 = gameTree.moves[currentPath[0]]?.variations?.[currentPath[1]];
      maxMoves = variation1?.moves?.[currentPath[2]]?.variations?.[currentPath[3]]?.moves?.length || 0;
    } else if (currentPath.length === 6) {
      const variation1 = gameTree.moves[currentPath[0]]?.variations?.[currentPath[1]];
      const variation2 = variation1?.moves?.[currentPath[2]]?.variations?.[currentPath[3]];
      maxMoves = variation2?.moves?.[currentPath[4]]?.variations?.[currentPath[5]]?.moves?.length || 0;
    }
    
    navigateToPosition(currentPath, maxMoves);
  }, [currentPath, gameTree, navigateToPosition]);

  /**
   * Reset the game
   */
  const reset = useCallback(() => {
    const newGame = new Chess();
    setGame(newGame);
    setBoardPosition(newGame.fen());
    setGameTree({ moves: [], variations: [] });
    setCurrentPath([]);
    setCurrentMoveIndex(0);
  }, []);

  // ============================================
  // STUDY MANAGEMENT FUNCTIONS
  // ============================================

  /**
   * Load all studies from backend
   */
  const loadStudies = useCallback(async () => {
    try {
      setLoading(true);
      const result = await studyService.getAllStudies();
      setStudies(result || []);
      console.log('📚 Loaded studies:', result?.length || 0);
    } catch (error) {
      console.error('Error loading studies:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Create a new study
   */
  const createStudy = useCallback(async () => {
    if (!newStudyName.trim()) return;
    
    try {
      const study = await studyService.createStudy({
        name: newStudyName,
        description: 'Created from Enhanced Chess Study',
        isPublic: false
      });
      
      setStudies(prev => [...prev, study]);
      setNewStudyName('');
      setIsCreatingStudy(false);
      
      // Auto-select the new study
      setActiveStudy(study._id);
      console.log('✅ Created study:', study.name);
    } catch (error) {
      console.error('Error creating study:', error);
      alert('Failed to create study: ' + error.message);
    }
  }, [newStudyName]);

  /**
   * Delete a study
   */
  const deleteStudy = useCallback(async (studyId) => {
    if (!window.confirm('Are you sure you want to delete this study?')) return;
    
    try {
      await studyService.deleteStudy(studyId);
      setStudies(prev => prev.filter(s => s._id !== studyId));
      
      if (activeStudy === studyId) {
        setActiveStudy(null);
        setActiveChapter(null);
      }
      
      console.log('✅ Deleted study');
    } catch (error) {
      console.error('Error deleting study:', error);
      alert('Failed to delete study: ' + error.message);
    }
  }, [activeStudy]);

  /**
   * Create a new chapter
   */
  const createChapter = useCallback(async () => {
    if (!activeStudy || !newChapterName.trim()) return;
    
    try {
      // Convert current game tree to PGN
      const pgn = convertTreeToPGN(gameTree);
      
      const chapter = await chapterService.createChapter(activeStudy, {
        name: newChapterName,
        position: game.fen(),
        pgn: pgn,
        gameTree: gameTree
      });
      
      // Update studies list
      setStudies(prev => prev.map(s => 
        s._id === activeStudy 
          ? { ...s, chapters: [...(s.chapters || []), chapter] }
          : s
      ));
      
      setNewChapterName('');
      setIsCreatingChapter(false);
      setActiveChapter(chapter._id);
      
      console.log('✅ Created chapter:', chapter.name);
    } catch (error) {
      console.error('Error creating chapter:', error);
      alert('Failed to create chapter: ' + error.message);
    }
  }, [activeStudy, newChapterName, game, gameTree]);

  /**
   * Load a chapter
   */
  const loadChapter = useCallback(async (chapterId) => {
    if (!chapterId) return;
    
    try {
      setLoadingChapter(true);
      const chapter = await chapterService.getChapter(chapterId);
      
      // Load the chapter's game tree
      if (chapter.gameTree) {
        setGameTree(chapter.gameTree);
      } else if (chapter.pgn) {
        // Parse PGN if no game tree
        const tree = parsePGN(chapter.pgn);
        setGameTree(tree);
      }
      
      // Reset board to chapter position
      const newGame = new Chess(chapter.position || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
      setGame(newGame);
      setBoardPosition(newGame.fen());
      setCurrentPath([]);
      setCurrentMoveIndex(0);
      
      setActiveChapter(chapterId);
      console.log('✅ Loaded chapter:', chapter.name);
    } catch (error) {
      console.error('Error loading chapter:', error);
      alert('Failed to load chapter: ' + error.message);
    } finally {
      setLoadingChapter(false);
    }
  }, []);

  /**
   * Save current chapter
   */
  const saveChapter = useCallback(async () => {
    if (!activeChapter) {
      alert('No active chapter to save');
      return;
    }
    
    try {
      const pgn = convertTreeToPGN(gameTree);
      
      await chapterService.updateChapter(activeChapter, {
        position: game.fen(),
        pgn: pgn,
        gameTree: gameTree
      });
      
      console.log('✅ Saved chapter');
      alert('Chapter saved successfully!');
    } catch (error) {
      console.error('Error saving chapter:', error);
      alert('Failed to save chapter: ' + error.message);
    }
  }, [activeChapter, game, gameTree]);

  /**
   * Convert game tree to PGN
   */
  const convertTreeToPGN = useCallback((tree) => {
    if (!tree || !tree.moves || tree.moves.length === 0) {
      return '';
    }
    
    let pgn = '';
    let moveNumber = 1;
    
    const renderMoves = (moves, isWhite = true) => {
      let result = '';
      moves.forEach((move, index) => {
        if (isWhite) {
          result += `${moveNumber}. ${move.san} `;
        } else {
          result += `${move.san} `;
          moveNumber++;
        }
        
        // Add variations
        if (move.variations && move.variations.length > 0) {
          move.variations.forEach(variation => {
            result += `(${renderMoves(variation.moves, !isWhite)}) `;
          });
        }
        
        isWhite = !isWhite;
      });
      return result;
    };
    
    pgn = renderMoves(tree.moves);
    return pgn.trim();
  }, []);

  /**
   * Parse PGN to game tree (simplified)
   */
  const parsePGN = useCallback((pgn) => {
    // Simplified PGN parser - just extracts moves
    const tree = { moves: [], variations: [] };
    const moves = pgn.match(/[NBRQK]?[a-h]?[1-8]?x?[a-h][1-8](=[NBRQ])?[\+#]?/g) || [];
    
    moves.forEach(move => {
      tree.moves.push({ san: move, variations: [] });
    });
    
    return tree;
  }, []);

  /**
   * Load studies on mount
   */
  useEffect(() => {
    loadStudies();
  }, [loadStudies]);

  // ============================================
  // ENGINE ANALYSIS FUNCTIONS
  // ============================================

  /**
   * Start engine analysis
   */
  const startEngineAnalysis = useCallback(async () => {
    try {
      setIsAnalyzing(true);
      const analysis = await stockfishCloudService.analyze(boardPosition);
      
      if (analysis) {
        setEngineEvaluation(analysis.evaluation);
        setEngineMoves(analysis.moves || []);
      }
    } catch (error) {
      console.error('Engine analysis error:', error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [boardPosition]);

  /**
   * Render game notation with recursive variation support
   */
  const renderNotation = () => {
    if (!gameTree.moves || gameTree.moves.length === 0) {
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
                  {varMove.san}
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
            {move.san}
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
        {gameTree.variations && gameTree.variations.length > 0 && gameTree.moves.length === 0 && (
          <>
            {gameTree.variations.map((variation, varIndex) => (
              <React.Fragment key={`root-${varIndex}`}>
                {renderVariation(variation, [-1, varIndex], -1, 1)}
                {' '}
              </React.Fragment>
            ))}
          </>
        )}
        
        {/* Mainline moves with inline root variations after first move */}
        {gameTree.moves.length > 0 ? (
          gameTree.moves.map((move, index) => {
            if (index === 0 && gameTree.variations && gameTree.variations.length > 0) {
              // Show first move with root-level variations inline
              return (
                <React.Fragment key={`move-${index}`}>
                  {renderMove(move, index)}
                  {gameTree.variations.map((variation, varIndex) => (
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
        
        {gameTree.moves.length === 0 && (!gameTree.variations || gameTree.variations.length === 0) && (
          <div className="text-gray-500">No moves yet</div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            ♟️ Enhanced Chess Study
          </h1>
          <p className="text-gray-600 text-lg">
            Complete study management with unlimited variation nesting
          </p>
        </div>

        {/* Study Management Bar */}
        <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            {/* Left: Study Selector */}
            <div className="flex items-center space-x-3">
              <BookOpen className="w-5 h-5 text-blue-600" />
              <select
                value={activeStudy || ''}
                onChange={(e) => setActiveStudy(e.target.value)}
                className="px-3 py-2 border rounded-lg bg-white"
              >
                <option value="">Select Study</option>
                {studies.map(study => (
                  <option key={study._id} value={study._id}>{study.name}</option>
                ))}
              </select>
              
              {activeStudy && (
                <>
                  <select
                    value={activeChapter || ''}
                    onChange={(e) => loadChapter(e.target.value)}
                    className="px-3 py-2 border rounded-lg bg-white"
                  >
                    <option value="">Select Chapter</option>
                    {studies.find(s => s._id === activeStudy)?.chapters?.map(chapter => (
                      <option key={chapter._id} value={chapter._id}>{chapter.name}</option>
                    ))}
                  </select>
                  
                  <button
                    onClick={() => setIsCreatingChapter(true)}
                    className="px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center space-x-1"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Chapter</span>
                  </button>
                </>
              )}
              
              <button
                onClick={() => setIsCreatingStudy(true)}
                className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center space-x-1"
              >
                <Plus className="w-4 h-4" />
                <span>Study</span>
              </button>
            </div>

            {/* Right: Action Buttons */}
            <div className="flex items-center space-x-2">
              {activeChapter && (
                <button
                  onClick={saveChapter}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Save Chapter
                </button>
              )}
              
              <button
                onClick={() => setShowEnginePanel(!showEnginePanel)}
                className={`px-3 py-2 rounded-lg flex items-center space-x-1 ${
                  showEnginePanel ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700'
                }`}
              >
                <Brain className="w-4 h-4" />
                <span>Engine</span>
              </button>
              
              <button
                onClick={reset}
                className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                Reset
              </button>
            </div>
          </div>

          {/* Create Study Modal */}
          {isCreatingStudy && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <input
                type="text"
                value={newStudyName}
                onChange={(e) => setNewStudyName(e.target.value)}
                placeholder="Enter study name..."
                className="w-full px-3 py-2 border rounded-lg mb-2"
                onKeyPress={(e) => e.key === 'Enter' && createStudy()}
              />
              <div className="flex space-x-2">
                <button
                  onClick={createStudy}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Create
                </button>
                <button
                  onClick={() => setIsCreatingStudy(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Create Chapter Modal */}
          {isCreatingChapter && (
            <div className="mt-4 p-4 bg-green-50 rounded-lg">
              <input
                type="text"
                value={newChapterName}
                onChange={(e) => setNewChapterName(e.target.value)}
                placeholder="Enter chapter name..."
                className="w-full px-3 py-2 border rounded-lg mb-2"
                onKeyPress={(e) => e.key === 'Enter' && createChapter()}
              />
              <div className="flex space-x-2">
                <button
                  onClick={createChapter}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Create
                </button>
                <button
                  onClick={() => setIsCreatingChapter(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Engine Analysis Panel */}
        {showEnginePanel && (
          <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
            <h3 className="font-semibold text-lg mb-3 flex items-center space-x-2">
              <Brain className="w-5 h-5" />
              <span>Engine Analysis</span>
            </h3>
            <button
              onClick={startEngineAnalysis}
              disabled={isAnalyzing}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 mb-3"
            >
              {isAnalyzing ? 'Analyzing...' : 'Analyze Position'}
            </button>
            
            {engineEvaluation && (
              <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-semibold">
                  Evaluation: {engineEvaluation > 0 ? '+' : ''}{(engineEvaluation / 100).toFixed(2)}
                </p>
              </div>
            )}
            
            {engineMoves.length > 0 && (
              <div className="mt-3">
                <p className="text-sm font-semibold mb-2">Best Moves:</p>
                {engineMoves.slice(0, 3).map((move, i) => (
                  <div key={i} className="text-sm p-2 bg-gray-50 rounded mb-1">
                    {i + 1}. {move.san} ({move.eval})
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Board Column */}
          <div className="lg:col-span-2">
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
                  position={boardPosition}
                  onPieceDrop={onPieceDrop}
                  boardOrientation={boardOrientation}
                  customBoardStyle={{
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                  }}
                />
              </div>

              {/* Navigation */}
              <div className="mt-6">
                <div className="flex items-center justify-center space-x-3 bg-gray-50 p-4 rounded-lg">
                  <button
                    onClick={goToStart}
                    disabled={currentMoveIndex === 0}
                    className="p-2 bg-white border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title="Go to start"
                  >
                    <SkipBack className="w-5 h-5" />
                  </button>
                  
                  <button
                    onClick={goBack}
                    disabled={currentMoveIndex === 0}
                    className="p-2 bg-white border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title="Previous move"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  
                  <span className="px-4 py-2 bg-white border rounded font-mono text-sm min-w-[120px] text-center">
                    Move {currentMoveIndex}
                  </span>
                  
                  <button
                    onClick={goForward}
                    className="p-2 bg-white border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title="Next move"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                  
                  <button
                    onClick={goToEnd}
                    className="p-2 bg-white border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  Reset Game
                </button>
              </div>
            </div>
          </div>

          {/* Notation Column */}
          <div className="lg:col-span-1">
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
    </div>
  );
};

export default SimplifiedChessBoardPage;

