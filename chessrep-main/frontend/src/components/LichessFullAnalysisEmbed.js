import React from 'react';

/**
 * LichessFullAnalysisEmbed
 * ------------------------
 * Embeds the full-featured Lichess analysis board (with Stockfish, opening explorer, tablebase, etc).
 *
 * Props:
 *   - fen: FEN string (spaces will be replaced with underscores)
 *   - pgn: PGN string (optional)
 *   - color: 'white' | 'black' (default: 'white')
 *   - theme: Lichess board theme (default: 'blue')
 *   - pieceSet: Lichess piece set (default: 'cburnett')
 *   - bg: 'light' | 'dark' | 'system' (default: 'light')
 */
const LichessFullAnalysisEmbed = ({
  fen,
  pgn,
  color = 'white',
  theme = 'blue',
  pieceSet = 'cburnett',
  bg = 'light',
  style = {},
}) => {
  const fenParam = fen ? `&fen=${fen.replace(/ /g, '_')}` : '';
  const pgnParam = pgn ? `&pgn=${encodeURIComponent(pgn)}` : '';
  const url = `https://lichess.org/embed/analysis?color=${color}&theme=${theme}&pieceSet=${pieceSet}&bg=${bg}${fenParam}${pgnParam}`;
  return (
    <iframe
      src={url}
      style={{ width: '100%', aspectRatio: '4/3', border: 0, ...style }}
      frameBorder="0"
      title="Lichess Analysis Board"
      allowFullScreen
    />
  );
};

export default LichessFullAnalysisEmbed; 