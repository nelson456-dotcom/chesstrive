import React, { useState, useEffect } from 'react';
import { ChessGameService } from '../services/ChessGameService';
import { ProductionChessBoard } from './ProductionChessBoard';
import { AnnotationDisplay } from './AnnotationDisplay';
import { PGNParser, ParsedMove } from '../services/PGNParser';

interface FullAnnotationChessBoardProps {
  pgn: string;
  boardWidth: number;
  boardOrientation: 'white' | 'black';
  onPositionChange?: (fen: string, moveHistory?: any[]) => void;
  onGameLoad?: (game: any) => void;
}

const FullAnnotationChessBoard: React.FC<FullAnnotationChessBoardProps> = ({
  pgn,
  boardWidth,
  boardOrientation,
  onPositionChange,
  onGameLoad,
}) => {
  const [gameService] = useState(() => new ChessGameService());
  const [currentMoveIndex, setCurrentMoveIndex] = useState(-1);
  const [parsedMoves, setParsedMoves] = useState<ParsedMove[]>([]);
  const [position, setPosition] = useState(gameService.getGameState().fen);
  const [pgnParser] = useState(() => new PGNParser());

  // Convert MoveNode[] to ParsedMove[] format
  const convertMoveNodesToParsedMoves = (moveNodes: any[]): ParsedMove[] => {
    // First, build the tree structure from the flat list
    const nodeMap = new Map();
    const rootNodes: any[] = [];

    moveNodes.forEach(node => {
      node.sublines = [];
      nodeMap.set(node.id, node);
    });

    moveNodes.forEach(node => {
      if (node.parentId) {
        const parent = nodeMap.get(node.parentId);
        if (parent) {
          parent.sublines.push(node);
        }
      } else {
        rootNodes.push(node);
      }
    });

    // Assume the first root is the main line start
    const root = rootNodes[0] || null;
    if (!root) return [];

    const convertNode = (node: any, depth: number = 0): ParsedMove => {
      // Convert sublines to variations (only non-mainline sublines become variations)
      const variations: ParsedMove[][] = [];
      if (node.sublines) {
        node.sublines.forEach((sub: any) => {
          // Skip mainline continuations here; only collect true variations
          if (sub.isMainLine) {
            return;
          }
          // For each variation root, collect the sequence of moves
          const variationSequence: ParsedMove[] = [];
          const collectSequence = (currentNode: any, seqDepth: number) => {
            const parsedMove: ParsedMove = {
              id: currentNode.id,
              san: currentNode.move?.san || '',
              fen: currentNode.move?.after || '',
              moveNumber: currentNode.moveNumber,
              isWhite: currentNode.isWhite,
              comment: undefined,
              nags: undefined,
              variations: [], // Will be filled if there are sublines
              parentId: currentNode.parentId,
              isMainLine: currentNode.isMainLine,
              depth: seqDepth,
              moveIndex: currentNode.moveIndex
            };
            variationSequence.push(parsedMove);

            // Continue with the main variation sequence
            if (currentNode.sublines && currentNode.sublines.length > 0) {
              collectSequence(currentNode.sublines[0], seqDepth + 1);
            }
          };
          collectSequence(sub, depth + 1);
          variations.push(variationSequence);
        });
      }

      return {
        id: node.id,
        san: node.move?.san || '',
        fen: node.move?.after || '',
        moveNumber: node.moveNumber,
        isWhite: node.isWhite,
        comment: undefined,
        nags: undefined,
        variations,
        parentId: node.parentId,
        isMainLine: node.isMainLine,
        depth: depth,
        moveIndex: node.moveIndex
      };
    };

    // Collect the main line sequence
    const mainLineSequence: ParsedMove[] = [];
    let current = root;
    while (current) {
      mainLineSequence.push(convertNode(current));
      // Follow the main line continuation
      const mainContinuation = current.sublines.find((sub: any) => sub.isMainLine);
      current = mainContinuation || null;
    }

    return mainLineSequence;
  };

  useEffect(() => {
    const parsedGame = pgnParser.parse(pgn);
    setParsedMoves(parsedGame.moves);
    gameService.loadPGN(pgn);
    gameService.goToMove(-1);
    setCurrentMoveIndex(-1);
    setPosition(gameService.getGameState().fen);
    onGameLoad?.(gameService.getGameState());
  }, [pgn, gameService, pgnParser, onGameLoad]);

  useEffect(() => {
    // Update parsedMoves from the gameService move tree
    const moveTree = gameService.getMoveTree();
    const convertedMoves = convertMoveNodesToParsedMoves(moveTree);
    setParsedMoves(convertedMoves);

    const gameState = gameService.getGameState();
    setPosition(gameState.fen);

    onPositionChange?.(gameState.fen, convertedMoves);
  }, [currentMoveIndex, gameService, onPositionChange]);

  // Add keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle arrow keys
      if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) {
        return;
      }

      event.preventDefault();

      const moveTree = gameService.getMoveTree();
      let newMoveIndex = currentMoveIndex;

      switch (event.key) {
        case 'ArrowLeft':
          // Go to previous move
          if (currentMoveIndex > -1) {
            newMoveIndex = currentMoveIndex - 1;
          }
          break;
        case 'ArrowRight':
          // Go to next move
          if (currentMoveIndex < moveTree.length - 1) {
            newMoveIndex = currentMoveIndex + 1;
          }
          break;
        case 'ArrowUp':
          // For now, just go to previous move (can be enhanced for variations)
          if (currentMoveIndex > -1) {
            newMoveIndex = currentMoveIndex - 1;
          }
          break;
        case 'ArrowDown':
          // For now, just go to next move (can be enhanced for variations)
          if (currentMoveIndex < moveTree.length - 1) {
            newMoveIndex = currentMoveIndex + 1;
          }
          break;
      }

      if (newMoveIndex !== currentMoveIndex) {
        gameService.goToMove(newMoveIndex);
        setCurrentMoveIndex(newMoveIndex);
        setPosition(gameService.getGameState().fen);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentMoveIndex, gameService]);

  const handleMoveClick = (moveId: string) => {
    // Find the move in the game service's move tree
    const moveTree = gameService.getMoveTree();
    const moveInTree = moveTree.find(m => m.id === moveId);
    
    if (moveInTree) {
      gameService.goToMove(moveInTree.moveIndex);
      setCurrentMoveIndex(moveInTree.moveIndex);
      setPosition(gameService.getGameState().fen);
    } else {
      // Fallback: try to find in parsed moves and use moveIndex
      const move = parsedMoves.find(m => m.id === moveId);
      if (move) {
        gameService.goToMove(move.moveIndex);
        setCurrentMoveIndex(move.moveIndex);
        setPosition(gameService.getGameState().fen);
      }
    }
  };

  const handleMove = (from: string, to: string, promotion?: string) => {
    const success = gameService.makeMove(from, to, promotion);
    if (success) {
      // Update current move index to the latest move
      const moveTree = gameService.getMoveTree();
      setCurrentMoveIndex(moveTree.length - 1);
      setPosition(gameService.getGameState().fen);
    }
    return success;
  };

  const handleVariationClick = (parentMoveId: string, variationIndex: number, moveIndex: number) => {
    const moveTree = gameService.getMoveTree();
    const parentMove = moveTree.find(m => m.id === parentMoveId);
    if (parentMove && parentMove.sublines[variationIndex]) {
      const variationId = parentMove.sublines[variationIndex].id;
      gameService.goToVariation(variationId);
      setCurrentMoveIndex(moveIndex);
      setPosition(gameService.getGameState().fen);
    }
  };

  const arePiecesDraggable = true;

  const currentMoveId = currentMoveIndex >= 0 && currentMoveIndex < gameService.getMoveTree().length 
    ? gameService.getMoveTree()[currentMoveIndex].id 
    : null;

  return (
    <div style={{ display: 'flex', gap: '20px' }}>
      <ProductionChessBoard
        position={position}
        boardOrientation={boardOrientation}
        boardWidth={boardWidth}
        arePiecesDraggable={arePiecesDraggable}
        onMove={handleMove}
      />
      <AnnotationDisplay
        moves={parsedMoves}
        currentMoveId={currentMoveId}
        onMoveClick={handleMoveClick}
        onVariationClick={handleVariationClick}
      />
    </div>
  );
};

export default FullAnnotationChessBoard;