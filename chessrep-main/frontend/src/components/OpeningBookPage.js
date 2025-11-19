import React, { useState } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import OpeningBookPanel from './OpeningBookPanel';

const OpeningBookPage = () => {
  const [game, setGame] = useState(new Chess());
  const [hoverArrow, setHoverArrow] = useState(null); // { from, to }
  const [source, setSource] = useState('lichess'); // 'lichess' or 'master'
  const [highlightedSquares, setHighlightedSquares] = useState([]); // For right-click red highlight

  const fen = game.fen();

  const onPieceDrop = (sourceSq, targetSq) => {
    const move = game.move({ from: sourceSq, to: targetSq, promotion: 'q' });
    if (move) {
      setGame(new Chess(game.fen()));
      return true;
    }
    return false;
  };

  const handleMoveClick = (uci) => {
    const move = game.move({ from: uci.slice(0,2), to: uci.slice(2,4), promotion: 'q' });
    if (move) {
      setGame(new Chess(game.fen()));
    }
  };

  const handleHover = (uci) => {
    if (!uci) {
      setHoverArrow(null);
      return;
    }
    setHoverArrow({ from: uci.slice(0,2), to: uci.slice(2,4) });
  };

  const handleRightClickSquare = (square) => {
    setHighlightedSquares((prev) =>
      prev.includes(square)
        ? prev.filter((s) => s !== square)
        : [...prev, square]
    );
  };

  const getCustomSquareStyles = () => {
    const styles = {};
    highlightedSquares.forEach((sq) => {
      styles[sq] = { backgroundColor: 'rgba(255, 0, 0, 0.4)' };
    });
    return styles;
  };

  return (
    <div className="max-w-4xl mx-auto py-6 px-2">
      <h1 className="text-2xl font-bold mb-4 text-center">Opening Book</h1>
      <div className="flex flex-col md:flex-row gap-8 items-start justify-center">
        <div className="flex-1 flex flex-col items-center">
          <Chessboard
            position={game.fen()}
            onPieceDrop={onPieceDrop}
            onRightClickSquare={handleRightClickSquare}
            customSquareStyles={getCustomSquareStyles()}
            boardWidth={360}
            customArrows={hoverArrow ? [[hoverArrow.from, hoverArrow.to, '#2196f3']] : []}
            animationDuration={300}
          />
          <div className="mt-2 text-xs text-gray-500 break-all text-center">FEN: {fen}</div>
        </div>
        <div className="flex-1">
          <div className="mb-2">
            <label htmlFor="book-source" className="mr-2 font-medium">Source:</label>
            <select
              id="book-source"
              value={source}
              onChange={e => setSource(e.target.value)}
              className="border rounded px-2 py-1 text-sm"
            >
              <option value="lichess">Lichess Player Database</option>
              <option value="master">Lichess Master Database</option>
            </select>
          </div>
          <OpeningBookPanel fen={fen} onMove={handleMoveClick} onHover={handleHover} source={source} />
        </div>
      </div>
    </div>
  );
};

export default OpeningBookPage; 