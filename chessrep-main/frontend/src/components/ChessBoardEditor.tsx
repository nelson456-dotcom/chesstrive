import React, { useState, useRef, useCallback, useEffect } from 'react';
import ProductionChessBoard from './ProductionChessBoard';
import { ChevronUp, ChevronDown, RotateCcw, Copy, Download, Upload, Trash2, Square } from 'lucide-react';
import { useLocation } from 'react-router-dom';

const ChessBoardEditor = () => {
  const location = useLocation();
  
  // Initial positions
  const startingFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
  const emptyFen = '8/8/8/8/8/8/8/8 w - - 0 1';

  // Get FEN from URL parameters
  const urlParams = new URLSearchParams(location.search);
  const fenFromUrl = urlParams.get('fen');
  const initialFen = fenFromUrl ? decodeURIComponent(fenFromUrl).replace(/_/g, ' ') : startingFen;

  const [position, setPosition] = useState(initialFen);
  const [isFlipped, setIsFlipped] = useState(false);
  const [selectedPiece, setSelectedPiece] = useState('');
  const [editMode, setEditMode] = useState(true);
  const [fenString, setFenString] = useState(initialFen);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Available pieces for selection
  const availablePieces = ['wK', 'wQ', 'wR', 'wB', 'wN', 'wP', 'bK', 'bQ', 'bR', 'bB', 'bN', 'bP'];
  
  // Piece icons for display
  const pieceIcons = {
    'wK': '♔', 'wQ': '♕', 'wR': '♖', 'wB': '♗', 'wN': '♘', 'wP': '♙',
    'bK': '♚', 'bQ': '♛', 'bR': '♜', 'bB': '♝', 'bN': '♞', 'bP': '♟'
  };

  // Update FEN when position changes
  React.useEffect(() => {
    setFenString(position);
  }, [position]);

  // Handle piece drop on square
  const onPieceDrop = useCallback((sourceSquare: string, targetSquare: string, piece: string) => {
    if (!editMode) return false;
    
    // Allow all piece drops in edit mode
    return true;
  }, [editMode]);

  // Handle square click for piece placement
  const onSquareClick = useCallback((square: string) => {
    if (!editMode) return;

    const currentPosition = fenToPosition(position);
    
    if (selectedPiece) {
      // Place selected piece
      currentPosition[square] = selectedPiece;
    } else {
      // Remove piece (eraser mode)
      delete currentPosition[square];
    }
    
    const newFen = positionToFen(currentPosition);
    setPosition(newFen);
  }, [position, selectedPiece, editMode]);

  // Convert FEN to position object
  const fenToPosition = (fen: string) => {
    const position: {[key: string]: string} = {};
    const fenParts = fen.split(' ');
    const boardPart = fenParts[0];
    const rows = boardPart.split('/');
    
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    
    for (let rank = 0; rank < 8; rank++) {
      const row = rows[rank];
      let fileIndex = 0;
      
      for (let i = 0; i < row.length; i++) {
        const char = row[i];
        
        if (isNaN(parseInt(char))) {
          // It's a piece
          const color = char === char.toUpperCase() ? 'w' : 'b';
          const pieceType = char.toUpperCase();
          const square = files[fileIndex] + (8 - rank);
          position[square] = color + pieceType;
          fileIndex++;
        } else {
          // It's a number representing empty squares
          fileIndex += parseInt(char);
        }
      }
    }
    
    return position;
  };

  // Convert position object to FEN
  const positionToFen = (position: {[key: string]: string}) => {
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    let fen = '';
    
    for (let rank = 8; rank >= 1; rank--) {
      let emptyCount = 0;
      
      for (let fileIndex = 0; fileIndex < 8; fileIndex++) {
        const square = files[fileIndex] + rank;
        const piece = position[square];
        
        if (piece) {
          if (emptyCount > 0) {
            fen += emptyCount;
            emptyCount = 0;
          }
          
          const color = piece[0];
          const pieceType = piece[1];
          const fenPiece = color === 'w' ? pieceType : pieceType.toLowerCase();
          fen += fenPiece;
        } else {
          emptyCount++;
        }
      }
      
      if (emptyCount > 0) {
        fen += emptyCount;
      }
      
      if (rank > 1) {
        fen += '/';
      }
    }
    
    // Add other FEN parts (simplified for board editor)
    fen += ' w - - 0 1';
    return fen;
  };

  // Board control functions
  const clearBoard = () => {
    setPosition(emptyFen);
  };

  const setStartingPosition = () => {
    setPosition(startingFen);
  };

  const flipBoard = () => {
    setIsFlipped(!isFlipped);
  };

  // FEN operations
  const loadFromFen = () => {
    try {
      // Basic FEN validation
      const fenParts = fenString.trim().split(' ');
      if (fenParts.length >= 1) {
        // If only board part is provided, add default game state
        const boardPart = fenParts[0];
        const fullFen = fenParts.length === 1 ? 
          `${boardPart} w - - 0 1` : 
          fenString;
        
        setPosition(fullFen);
      } else {
        throw new Error('Invalid FEN');
      }
    } catch (error) {
      alert('Invalid FEN string. Please check the format.');
    }
  };

  const copyFen = async () => {
    try {
      await navigator.clipboard.writeText(fenString.split(' ')[0]); // Copy just the board part
      alert('FEN copied to clipboard!');
    } catch (error) {
      alert('Failed to copy FEN to clipboard');
    }
  };

  // File operations
  const exportBoard = () => {
    const data = {
      fen: fenString,
      timestamp: new Date().toISOString(),
      flipped: isFlipped
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chess-position-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importBoard = () => {
    fileInputRef.current?.click();
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target?.result as string);
          if (data.fen) {
            setFenString(data.fen);
            setPosition(data.fen);
            if (data.flipped !== undefined) {
              setIsFlipped(data.flipped);
            }
            alert('Position loaded successfully!');
          } else {
            throw new Error('No FEN data found');
          }
        } catch (error) {
          alert('Invalid file format. Please select a valid chess position file.');
        }
      };
      reader.readAsText(file);
    }
    // Reset file input
    e.target.value = '';
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-6 sm:mb-8 text-center">Chess Board Editor</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8">
          {/* Board */}
          <div className="lg:col-span-2 xl:col-span-3 flex justify-center">
            <div className="bg-amber-900 p-4 sm:p-6 rounded-xl shadow-2xl w-full max-w-2xl">
              <div className="aspect-square w-full max-w-[500px] mx-auto">
                <ProductionChessBoard
                  position={position}
                  onMove={(from, to) => onPieceDrop(from, to, '')}
                  onSquareClick={onSquareClick as any}
                  boardOrientation={isFlipped ? 'black' : 'white'}
                  fitToParent={true}
                  customBoardStyle={{
                    borderRadius: '6px',
                    width: '100%',
                    height: '100%'
                  }}
                  arePiecesDraggable={editMode}
                />
              </div>
            </div>
          </div>
          
          {/* Controls */}
          <div className="lg:col-span-1 space-y-4 sm:space-y-6">
            {/* Mode Toggle */}
            <div className="bg-slate-800 rounded-lg p-3 sm:p-4 shadow-lg">
              <h3 className="text-white font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Mode</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setEditMode(true)}
                  className={`flex-1 py-2 px-3 rounded-lg transition-all text-sm ${
                    editMode 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  Edit
                </button>
                <button
                  onClick={() => setEditMode(false)}
                  className={`flex-1 py-2 px-3 rounded-lg transition-all text-sm ${
                    !editMode 
                      ? 'bg-green-600 text-white' 
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  View
                </button>
              </div>
            </div>

            {/* Piece Selector */}
            {editMode && (
              <div className="bg-slate-800 rounded-lg p-3 sm:p-4 shadow-lg">
                <h3 className="text-white font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Select Piece</h3>
                <div className="grid grid-cols-3 gap-1.5 sm:gap-2 mb-3 sm:mb-4">
                  {availablePieces.map(piece => (
                    <button
                      key={piece}
                      onClick={() => setSelectedPiece(piece)}
                      className={`aspect-square rounded-lg border-2 flex flex-col items-center justify-center transition-all ${
                        selectedPiece === piece 
                          ? 'border-blue-400 bg-blue-900 shadow-lg text-white' 
                          : 'border-slate-600 bg-slate-700 hover:border-slate-500 text-slate-300'
                      }`}
                      title={piece}
                    >
                      <div className="text-lg sm:text-2xl mb-0.5 sm:mb-1">
                        {pieceIcons[piece as keyof typeof pieceIcons]}
                      </div>
                      <div className="text-xs font-bold hidden sm:block">
                        {piece}
                      </div>
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setSelectedPiece('')}
                  className={`w-full py-2 rounded-lg border-2 flex items-center justify-center gap-2 transition-all text-sm ${
                    selectedPiece === '' 
                      ? 'border-red-400 bg-red-900 text-white' 
                      : 'border-slate-600 bg-slate-700 text-slate-300 hover:border-slate-500'
                  }`}
                >
                  <Square size={14} />
                  Eraser
                </button>
              </div>
            )}

            {/* Board Controls */}
            <div className="bg-slate-800 rounded-lg p-3 sm:p-4 shadow-lg">
              <h3 className="text-white font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Board Controls</h3>
              <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
                <button
                  onClick={setStartingPosition}
                  className="px-2 sm:px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm"
                >
                  <ChevronUp size={14} />
                  <span className="hidden sm:inline">Start</span>
                </button>
                <button
                  onClick={clearBoard}
                  className="px-2 sm:px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm"
                >
                  <Trash2 size={14} />
                  <span className="hidden sm:inline">Clear</span>
                </button>
                <button
                  onClick={flipBoard}
                  className="px-2 sm:px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm"
                >
                  <RotateCcw size={14} />
                  <span className="hidden sm:inline">Flip</span>
                </button>
                <button
                  onClick={copyFen}
                  className="px-2 sm:px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm"
                >
                  <Copy size={14} />
                  <span className="hidden sm:inline">Copy</span>
                </button>
              </div>
            </div>

            {/* FEN Input/Output */}
            <div className="bg-slate-800 rounded-lg p-3 sm:p-4 shadow-lg">
              <h3 className="text-white font-semibold mb-3 sm:mb-4 text-sm sm:text-base">FEN Notation</h3>
              <div className="space-y-2 sm:space-y-3">
                <textarea
                  value={fenString.split(' ')[0]} // Show only board part for editing
                  onChange={(e) => setFenString(e.target.value)}
                  className="w-full p-2 sm:p-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-blue-400 focus:outline-none resize-none font-mono text-xs sm:text-sm"
                  rows={3}
                  placeholder="Enter FEN string..."
                />
                <button
                  onClick={loadFromFen}
                  className="w-full px-3 sm:px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors text-sm"
                >
                  Load from FEN
                </button>
              </div>
            </div>

            {/* File Operations */}
            <div className="bg-slate-800 rounded-lg p-3 sm:p-4 shadow-lg">
              <h3 className="text-white font-semibold mb-3 sm:mb-4 text-sm sm:text-base">File Operations</h3>
              <div className="space-y-1.5 sm:space-y-2">
                <button
                  onClick={exportBoard}
                  className="w-full px-3 sm:px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors flex items-center justify-center gap-1 sm:gap-2 text-sm"
                >
                  <Download size={14} />
                  <span className="hidden sm:inline">Export Position</span>
                  <span className="sm:hidden">Export</span>
                </button>
                <button
                  onClick={importBoard}
                  className="w-full px-3 sm:px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors flex items-center justify-center gap-1 sm:gap-2 text-sm"
                >
                  <Upload size={14} />
                  <span className="hidden sm:inline">Import Position</span>
                  <span className="sm:hidden">Import</span>
                </button>
              </div>
            </div>
            
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileImport}
              className="hidden"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChessBoardEditor;
