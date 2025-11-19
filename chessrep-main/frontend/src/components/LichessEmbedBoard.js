import React, { useEffect, useRef } from 'react';

// LichessEmbedBoard renders an official Lichess board widget that can
// display an arbitrary FEN. It relies on lichess.org/assets/embed.js,
// which exposes `window.LichessEmbed(element, options)`.
// Allowed options: fen (string), orientation ('white'|'black'), size (px).

const EMBED_JS_SRC = 'https://lichess1.org/assets/embed.js';

const loadScriptOnce = () => {
  return new Promise((resolve) => {
    if (window.LichessEmbed) {
      resolve();
      return;
    }
    // check if script already injected but not loaded yet
    const existing = document.querySelector(`script[src="${EMBED_JS_SRC}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve());
      return;
    }
    const s = document.createElement('script');
    s.src = EMBED_JS_SRC;
    s.async = true;
    s.onload = () => resolve();
    document.body.appendChild(s);
  });
};

const LichessEmbedBoard = ({ fen, orientation = 'white', size = 640 }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    loadScriptOnce().then(() => {
      if (cancelled) return;
      if (!containerRef.current || !window.LichessEmbed) return;
      // clear previous board (important if props changed)
      containerRef.current.innerHTML = '';
      const opts = { size, orientation };
      if (fen) opts.fen = fen;
      window.LichessEmbed(containerRef.current, opts);
    });

    return () => {
      cancelled = true;
    };
  }, [fen, orientation, size]);

  return <div ref={containerRef} style={{ width: size, height: size }} />;
};

export default LichessEmbedBoard; 