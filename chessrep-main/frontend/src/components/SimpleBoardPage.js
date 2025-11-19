import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Chess } from 'chess.js';
import StandardChessBoard from './StandardChessBoard';
import ModernChessBoard from './ModernChessBoard';

// Simple chess board page with switchable renderer (Standard or Modern React Chessboard)
const SimpleBoardPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);

  const startingFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
  const [fen, setFen] = useState(params.get('fen') || startingFen);
  const [orientation, setOrientation] = useState(params.get('orientation') || 'white');
  const [boardWidth, setBoardWidth] = useState(parseInt(params.get('size') || '640'));
  const [renderer, setRenderer] = useState(params.get('board') || 'standard'); // 'standard' | 'react'

  const applyParams = () => {
    const next = new URLSearchParams();
    if (fen.trim() && fen.trim() !== startingFen) next.set('fen', fen.trim());
    if (orientation !== 'white') next.set('orientation', orientation);
    if (boardWidth !== 640) next.set('size', boardWidth.toString());
    if (renderer !== 'standard') next.set('board', renderer);
    const search = next.toString();
    navigate({ pathname: location.pathname, search: search ? `?${search}` : '' }, { replace: false });
  };

  const resetToStartingPosition = () => {
    setFen(startingFen);
    const next = new URLSearchParams();
    if (orientation !== 'white') next.set('orientation', orientation);
    if (boardWidth !== 640) next.set('size', boardWidth.toString());
    if (renderer !== 'standard') next.set('board', renderer);
    const search = next.toString();
    navigate({ pathname: location.pathname, search: search ? `?${search}` : '' }, { replace: false });
  };

  // onPieceDrop handler for the React Chessboard renderer
  const onPieceDropReact = (sourceSquare, targetSquare) => {
    try {
      const game = new Chess(fen);
      const move = game.move({ from: sourceSquare, to: targetSquare, promotion: 'q' });
      if (!move) return false;
      setFen(game.fen());
      return true;
    } catch (e) {
      return false;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 to-blue-400">Simple Chess Board</h1>
        <p className="mt-2 text-slate-300">A clean chess board for studying positions without engine analysis or annotations.</p>
      </div>

      <div className="bg-slate-800/60 border border-slate-700 rounded-xl shadow-lg backdrop-blur mb-6">
        <div className="p-4 md:p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="col-span-1 md:col-span-2 lg:col-span-3">
            <label className="block text-sm text-slate-300 mb-1">FEN (optional)</label>
            <input
              value={fen}
              onChange={(e) => setFen(e.target.value)}
              placeholder="e.g. rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
              className="w-full rounded-lg bg-slate-900/70 border border-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-200 px-3 py-2 placeholder-slate-500"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">Board orientation</label>
            <select value={orientation} onChange={(e) => setOrientation(e.target.value)} className="w-full rounded-lg bg-slate-900/70 border border-slate-700 text-slate-200 px-3 py-2">
              <option value="white">White</option>
              <option value="black">Black</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">Board size</label>
            <select value={boardWidth} onChange={(e) => setBoardWidth(parseInt(e.target.value))} className="w-full rounded-lg bg-slate-900/70 border border-slate-700 text-slate-200 px-3 py-2">
              <option value="480">Small (480px)</option>
              <option value="640">Medium (640px)</option>
              <option value="800">Large (800px)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">Board renderer</label>
            <select value={renderer} onChange={(e) => setRenderer(e.target.value)} className="w-full rounded-lg bg-slate-900/70 border border-slate-700 text-slate-200 px-3 py-2">
              <option value="standard">Standard React Chessboard</option>
              <option value="react">React Chessboard</option>
            </select>
          </div>
        </div>
        <div className="px-4 md:px-5 pb-4 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <div className="text-xs text-slate-400">Paste any valid FEN above or leave empty to start from the initial position.</div>
          <div className="flex gap-3">
            <button onClick={resetToStartingPosition} className="inline-flex items-center justify-center rounded-lg border border-slate-600 px-4 py-2 text-slate-200 hover:bg-slate-700/60">
              Reset Board
            </button>
            <button onClick={applyParams} className="inline-flex items-center justify-center rounded-lg bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 shadow">
              Apply
            </button>
          </div>
        </div>
      </div>

      <div className="bg-slate-900/60 border border-slate-800 rounded-xl shadow-xl overflow-hidden flex justify-center">
        <div className="p-6">
          {renderer === 'react' ? (
            <ModernChessBoard
              position={fen}
              orientation={orientation}
              boardWidth={boardWidth}
              arePiecesDraggable={true}
              showBoardNotation={true}
              onPieceDrop={onPieceDropReact}
              customBoardStyle={{ borderRadius: '8px', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)' }}
            />
          ) : (
            <StandardChessBoard
              position={fen}
              orientation={orientation}
              boardSize={boardWidth}
              onPieceDrop={onPieceDropReact}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default SimpleBoardPage;