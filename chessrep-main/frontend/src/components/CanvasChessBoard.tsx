import React, { useRef, useEffect, useCallback, useState } from 'react';
import { Chess } from 'chess.js';

interface CanvasChessBoardProps {
  fen: string;
  onSquareClick: (from: string, to: string, piece?: string) => void;
  selectedSquare?: string | null;
  lastMove?: { from: string; to: string } | null;
  width?: number;
  height?: number;
  onMove?: (from: string, to: string, promotion?: string) => boolean;
}

const CanvasChessBoard: React.FC<CanvasChessBoardProps> = ({
  fen,
  onSquareClick,
  selectedSquare = null,
  lastMove = null,
  width = 600,
  height = 600,
  onMove
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const squareSize = width / 8;
  const chess = new Chess(fen);
  const [selectedPiece, setSelectedPiece] = useState<string | null>(null);

  // Convert square notation to coordinates
  const squareToCoords = (square: string) => {
    const file = square.charCodeAt(0) - 97; // 'a' = 0, 'b' = 1, etc.
    const rank = 8 - parseInt(square[1]); // '1' = 7, '2' = 6, etc.
    return { x: file * squareSize, y: rank * squareSize };
  };

  // Convert coordinates to square notation
  const coordsToSquare = (x: number, y: number) => {
    const file = Math.floor(x / squareSize);
    const rank = Math.floor(y / squareSize);
    if (file < 0 || file > 7 || rank < 0 || rank > 7) return null;
    return String.fromCharCode(97 + file) + (8 - rank);
  };

  // Draw the chess board
  const drawBoard = useCallback((ctx: CanvasRenderingContext2D) => {
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Draw squares
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const isLight = (row + col) % 2 === 0;
        ctx.fillStyle = isLight ? '#f0d9b5' : '#b58863';
        ctx.fillRect(col * squareSize, row * squareSize, squareSize, squareSize);
      }
    }

    // Draw last move highlight
    if (lastMove) {
      const fromCoords = squareToCoords(lastMove.from);
      const toCoords = squareToCoords(lastMove.to);
      
      ctx.fillStyle = 'rgba(255, 255, 0, 0.4)';
      ctx.fillRect(fromCoords.x, fromCoords.y, squareSize, squareSize);
      ctx.fillRect(toCoords.x, toCoords.y, squareSize, squareSize);
    }

    // Draw selected square highlight
    if (selectedSquare) {
      const coords = squareToCoords(selectedSquare);
      ctx.fillStyle = 'rgba(0, 123, 255, 0.4)';
      ctx.fillRect(coords.x, coords.y, squareSize, squareSize);
    }

    // Draw selected piece highlight
    if (selectedPiece) {
      const coords = squareToCoords(selectedPiece);
      ctx.fillStyle = 'rgba(251, 191, 36, 0.5)';
      ctx.fillRect(coords.x, coords.y, squareSize, squareSize);
    }

    // Draw pieces
    const pieces = chess.board();
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = pieces[row][col];
        if (piece) {
          const x = col * squareSize + squareSize / 2;
          const y = row * squareSize + squareSize / 2;
          
          // Set font size based on square size
          const fontSize = Math.floor(squareSize * 0.6);
          ctx.font = `${fontSize}px Arial`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          
          // Draw piece
          ctx.fillStyle = piece.color === 'w' ? '#ffffff' : '#000000';
          ctx.strokeStyle = piece.color === 'w' ? '#000000' : '#ffffff';
          ctx.lineWidth = 2;
          
          const pieceSymbol = getPieceSymbol(piece.type, piece.color);
          ctx.strokeText(pieceSymbol, x, y);
          ctx.fillText(pieceSymbol, x, y);
        }
      }
    }

    // Draw coordinates
    ctx.font = `${Math.floor(squareSize * 0.15)}px Arial`;
    ctx.fillStyle = '#8b4513';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // File labels (a-h)
    for (let i = 0; i < 8; i++) {
      const x = i * squareSize + squareSize / 2;
      const y = height - squareSize * 0.2;
      ctx.fillText(String.fromCharCode(97 + i), x, y);
    }
    
    // Rank labels (1-8)
    for (let i = 0; i < 8; i++) {
      const x = squareSize * 0.1;
      const y = i * squareSize + squareSize / 2;
      ctx.fillText((8 - i).toString(), x, y);
    }
  }, [fen, selectedSquare, lastMove, width, height, squareSize, chess]);

  // Get Unicode piece symbol
  const getPieceSymbol = (type: string, color: string) => {
    const symbols = {
      'w': { 'k': '♔', 'q': '♕', 'r': '♖', 'b': '♗', 'n': '♘', 'p': '♙' },
      'b': { 'k': '♚', 'q': '♛', 'r': '♜', 'b': '♝', 'n': '♞', 'p': '♟' }
    };
    return symbols[color as keyof typeof symbols][type as keyof typeof symbols['w']] || '?';
  };

  // Handle canvas click
  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const square = coordsToSquare(x, y);
    if (!square) return;

    const piece = chess.get(square);
    const isWhiteTurn = fen.split(' ')[1] === 'w';
    
    if (selectedPiece) {
      // Second click - trying to move
      if (selectedPiece === square) {
        // Clicked same square - deselect
        setSelectedPiece(null);
        return;
      }
      
      // Check if it's a valid move
      if (onMove) {
        const moveSuccess = onMove(selectedPiece, square);
        if (moveSuccess) {
          setSelectedPiece(null);
          return;
        }
      }
      
      // If move failed or no onMove handler, select new piece if it's the right color
      if (piece && piece.color === (isWhiteTurn ? 'w' : 'b')) {
        setSelectedPiece(square);
      } else {
        setSelectedPiece(null);
      }
    } else {
      // First click - select piece
      if (piece && piece.color === (isWhiteTurn ? 'w' : 'b')) {
        setSelectedPiece(square);
      }
    }
    
    onSquareClick(square, square);
  }, [selectedPiece, chess, fen, onMove, onSquareClick]);

  // Redraw when dependencies change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    drawBoard(ctx);
  }, [drawBoard]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      onClick={handleCanvasClick}
      style={{
        border: '2px solid #374151',
        borderRadius: '8px',
        cursor: 'pointer',
        display: 'block'
      }}
    />
  );
};

export default CanvasChessBoard;