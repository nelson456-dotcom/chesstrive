const { Chess } = require('chess.js');
const chess = new Chess();
const pgn = '1. e4 c5 2. Nf3 e6';
console.log('loadPgn:', typeof chess.loadPgn);
console.log('load_pgn:', typeof chess.load_pgn);
chess.loadPgn(pgn);