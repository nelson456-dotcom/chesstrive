import React, { useMemo, useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Chess } from 'chess.js';
import LichessFullAnalysisEmbed from './LichessFullAnalysisEmbed';

// Polished Live Analysis page with a clean control panel and responsive embed
const LiveAnalysisBoard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);

  const [fen, setFen] = useState(params.get('fen') || '');
  const [color, setColor] = useState(params.get('color') || 'white');
  const [theme, setTheme] = useState(params.get('theme') || 'blue');
  const [pieceSet, setPieceSet] = useState(params.get('pieceSet') || 'cburnett');
  const [bg, setBg] = useState(params.get('bg') || 'light');
  const [pgn, setPgn] = useState(params.get('pgn') || '');

  // Handle game data from navigation state
  useEffect(() => {
    if (location.state?.gameData) {
      const gameData = location.state.gameData;
      console.log('LiveAnalysisBoard received game data:', gameData);
      
      // Use PGN if provided, otherwise generate it
      if (gameData.pgn) {
        console.log('LiveAnalysisBoard using provided PGN:', gameData.pgn);
        setPgn(gameData.pgn);
      } else if (gameData.moves && gameData.moves.length > 0) {
        try {
          const chess = new Chess();
          let pgnMoves = '';
          
          // Play all moves to generate PGN
          for (const move of gameData.moves) {
            const result = chess.move(move, { sloppy: true });
            if (result) {
              pgnMoves += result.san + ' ';
            }
          }
          
          // Create complete PGN
          const pgn = `[Event "Bot Game Analysis"]\n[Site "ChessRep"]\n[Date "${new Date().toISOString().split('T')[0]}"]\n[Round "1"]\n[White "${gameData.playerColor === 'white' ? 'Player' : gameData.botName}"]\n[Black "${gameData.playerColor === 'black' ? 'Player' : gameData.botName}"]\n[Result "${gameData.result || '*'}"]\n\n${pgnMoves.trim()}`;
          
          console.log('Generated PGN:', pgn);
          setPgn(pgn);
        } catch (error) {
          console.error('Error generating PGN:', error);
        }
      }
      
      // Set the final position as FEN
      if (gameData.fen) {
        setFen(gameData.fen);
      }
      
      // Set the color based on player color
      setColor(gameData.playerColor || 'white');
    }
  }, [location.state]);

  const applyParams = () => {
    const next = new URLSearchParams();
    if (fen.trim()) next.set('fen', fen.trim());
    if (color !== 'white') next.set('color', color);
    if (theme !== 'blue') next.set('theme', theme);
    if (pieceSet !== 'cburnett') next.set('pieceSet', pieceSet);
    if (bg !== 'light') next.set('bg', bg);
    const search = next.toString();
    navigate({ pathname: location.pathname, search: search ? `?${search}` : '' }, { replace: false });
  };

  const externalUrl = useMemo(() => {
    const q = new URLSearchParams();
    if (fen.trim()) q.set('fen', fen.trim().replace(/ /g, '_'));
    if (pgn.trim()) q.set('pgn', pgn.trim());
    q.set('color', color);
    q.set('theme', theme);
    q.set('pieceSet', pieceSet);
    q.set('bg', bg);
    return `https://lichess.org/analysis?${q.toString()}`;
  }, [fen, pgn, color, theme, pieceSet, bg]);
      
      return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 to-blue-400">Live Analysis</h1>
        <p className="mt-2 text-slate-300">Study any position with Stockfish, opening explorer and tablebases powered by Lichess.</p>
        </div>

      <div className="bg-slate-800/60 border border-slate-700 rounded-xl shadow-lg backdrop-blur mb-6">
        <div className="p-4 md:p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="col-span-1 md:col-span-2 lg:col-span-4">
            <label className="block text-sm text-slate-300 mb-1">FEN (optional)</label>
            <input
              value={fen}
              onChange={(e) => setFen(e.target.value)}
              placeholder="e.g. rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
              className="w-full rounded-lg bg-slate-900/70 border border-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-200 px-3 py-2 placeholder-slate-500"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">Side to play</label>
            <select value={color} onChange={(e) => setColor(e.target.value)} className="w-full rounded-lg bg-slate-900/70 border border-slate-700 text-slate-200 px-3 py-2">
              <option value="white">White</option>
              <option value="black">Black</option>
            </select>
        </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">Board theme</label>
            <select value={theme} onChange={(e) => setTheme(e.target.value)} className="w-full rounded-lg bg-slate-900/70 border border-slate-700 text-slate-200 px-3 py-2">
              <option value="blue">Blue</option>
              <option value="brown">Brown</option>
              <option value="green">Green</option>
              <option value="purple">Purple</option>
              <option value="gray">Gray</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">Piece set</label>
            <select value={pieceSet} onChange={(e) => setPieceSet(e.target.value)} className="w-full rounded-lg bg-slate-900/70 border border-slate-700 text-slate-200 px-3 py-2">
              <option value="cburnett">Cburnett</option>
              <option value="alpha">Alpha</option>
              <option value="chessnut">Chessnut</option>
              <option value="merida">Merida</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">Background</label>
            <select value={bg} onChange={(e) => setBg(e.target.value)} className="w-full rounded-lg bg-slate-900/70 border border-slate-700 text-slate-200 px-3 py-2">
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="system">System</option>
            </select>
                  </div>
                </div>
        <div className="px-4 md:px-5 pb-4 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <div className="text-xs text-slate-400">Paste any valid FEN above or leave empty to start from the initial position.</div>
          <div className="flex gap-3">
            <a href={externalUrl} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center rounded-lg border border-slate-600 px-4 py-2 text-slate-200 hover:bg-slate-700/60">Open on Lichess</a>
            <button onClick={applyParams} className="inline-flex items-center justify-center rounded-lg bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 shadow">
              Apply
                </button>
              </div>
            </div>
          </div>

      <div className="bg-slate-900/60 border border-slate-800 rounded-xl shadow-xl overflow-hidden">
        <LichessFullAnalysisEmbed
          fen={fen || undefined}
          pgn={pgn || undefined}
          color={color}
          theme={theme}
          pieceSet={pieceSet}
          bg={bg}
          style={{ width: '100%', maxWidth: 1400, margin: '0 auto' }}
        />
      </div>
    </div>
  );
};

export default LiveAnalysisBoard;
