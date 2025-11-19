import React, { useState, useEffect } from 'react';

const fetchBookMoves = async (fen, source) => {
  const endpoint = source === 'master' ? 'master' : 'lichess';
  const url = `https://explorer.lichess.ovh/${endpoint}?fen=${encodeURIComponent(fen)}`;
  const res = await fetch(url);
  return res.json();
};

const OpeningBookPanel = ({ fen, onMove, onHover, source = 'lichess' }) => {
  const [bookMoves, setBookMoves] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchBookMoves(fen, source)
      .then(data => {
        setBookMoves(data.moves || []);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to fetch book moves.');
        setLoading(false);
      });
  }, [fen, source]);

  return (
    <div>
      <h2 className="text-lg font-semibold mb-2">Opening Book</h2>
      {loading && <div>Loading...</div>}
      {error && <div className="text-red-500">{error}</div>}
      {!loading && !error && bookMoves.length === 0 && <div>No book moves found for this position.</div>}
      <table className="min-w-full text-sm border">
        <thead>
          <tr className="bg-gray-200">
            <th className="px-2 py-1">Move</th>
            <th className="px-2 py-1">Games</th>
            <th className="px-2 py-1">White %</th>
            <th className="px-2 py-1">Draw %</th>
            <th className="px-2 py-1">Black %</th>
          </tr>
        </thead>
        <tbody>
          {bookMoves.map((move) => (
            <tr
              key={move.uci}
              className="hover:bg-blue-50 cursor-pointer"
              onClick={() => onMove && onMove(move.uci)}
              onMouseEnter={() => onHover && onHover(move.uci)}
              onMouseLeave={() => onHover && onHover(null)}
            >
              <td className="px-2 py-1 font-mono">{move.san}</td>
              <td className="px-2 py-1">{move.white + move.draws + move.black}</td>
              <td className="px-2 py-1 text-green-700">{((move.white / (move.white + move.draws + move.black)) * 100).toFixed(1)}%</td>
              <td className="px-2 py-1 text-gray-700">{((move.draws / (move.white + move.draws + move.black)) * 100).toFixed(1)}%</td>
              <td className="px-2 py-1 text-red-700">{((move.black / (move.white + move.draws + move.black)) * 100).toFixed(1)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default OpeningBookPanel; 