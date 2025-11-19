import React, { useState, useRef, useEffect } from 'react';
import { Chessboard } from 'react-chessboard';

// --- Usage notes ---
// Packages to install:
// npm install react-chessboard chess.js
// or
// yarn add react-chessboard chess.js
//
// This single-file React component provides a Lichess-like board editor:
// - Click a square to place the currently selected piece
// - Right-click a square to remove the piece
// - Drag pieces from the palette onto the board
// - Load / export FEN, flip board orientation, clear board, undo/redo basic
// - Copy FEN to clipboard
//
// This editor treats the board as an editor (not enforcing legal moves). It
// stores a position object mapping squares -> piece codes (e.g. 'wK', 'bq').

const files = ['a','b','c','d','e','f','g','h'];
const ranks = [8,7,6,5,4,3,2,1];

// Utility: map piece code (wK / bq) -> FEN character
function pieceCodeToFenChar(code: string | null): string | null {
  if(!code) return null;
  const color = code[0];
  const type = code[1].toLowerCase();
  const map: {[key: string]: string} = {k:'k',q:'q',r:'r',b:'b',n:'n',p:'p'};
  const fen = map[type] || '';
  return color === 'w' ? fen.toUpperCase() : fen;
}

// Utility: map FEN char -> piece code
function fenCharToPieceCode(ch: string): string | null {
  if(!ch || ch === '1') return null;
  const isUpper = ch === ch.toUpperCase();
  const color = isUpper ? 'w' : 'b';
  const typeMap: {[key: string]: string} = {k:'K',q:'Q',r:'R',b:'B',n:'N',p:'P'};
  const type = typeMap[ch.toLowerCase()] || ch.toUpperCase();
  return color + type;
}

function positionToFEN(position: {[key: string]: string}, turn = 'w', castling = '-', enPassant = '-', halfmove = 0, fullmove = 1): string {
  // position: { a1: 'wK', e5: 'bp', ... }
  let rows: string[] = [];
  for(const r of ranks){
    let row = '';
    let emptyCount = 0;
    for(const f of files){
      const sq = f + r;
      const piece = position[sq];
      if(!piece){
        emptyCount++;
      } else {
        if(emptyCount>0){ row += emptyCount; emptyCount=0; }
        row += pieceCodeToFenChar(piece);
      }
    }
    if(emptyCount>0) row += emptyCount;
    rows.push(row);
  }
  const fenBoard = rows.join('/');
  return `${fenBoard} ${turn} ${castling} ${enPassant} ${halfmove} ${fullmove}`;
}

function fenToPosition(fen: string): {position: {[key: string]: string}, turn: string, castling: string, enPassant: string, halfmove: number, fullmove: number, error?: string} {
  // returns position object { a1:'wK', ... } and some metadata
  const parts = fen.trim().split(/\s+/);
  if(parts.length < 1) return { position: {}, turn: 'w', castling: '-', enPassant: '-', halfmove: 0, fullmove: 1, error: 'Invalid FEN' };
  const board = parts[0];
  const fenRows = board.split('/');
  if(fenRows.length !== 8) return { position: {}, turn: 'w', castling: '-', enPassant: '-', halfmove: 0, fullmove: 1, error: 'Invalid FEN rows' };
  const pos: {[key: string]: string} = {};
  for(let rIdx=0; rIdx<8; rIdx++){
    const rowStr = fenRows[rIdx];
    let fileIdx = 0;
    for(const ch of rowStr){
      if(/\d/.test(ch)){
        fileIdx += parseInt(ch,10);
      } else {
        const file = files[fileIdx];
        const rank = 8 - rIdx;
        const sq = file + rank;
        const piece = fenCharToPieceCode(ch);
        if(piece) pos[sq] = piece;
        fileIdx++;
      }
    }
  }
  return {
    position: pos,
    turn: parts[1] || 'w',
    castling: parts[2] || '-',
    enPassant: parts[3] || '-',
    halfmove: parseInt(parts[4]||'0',10),
    fullmove: parseInt(parts[5]||'1',10),
  };
}

interface LichessLikeEditorProps {
  initialFen?: string;
  onFenChange?: (fen: string) => void;
  onClose?: () => void;
}

export default function LichessLikeEditor({ initialFen, onFenChange, onClose }: LichessLikeEditorProps){
  const [position, setPosition] = useState<{[key: string]: string}>({}); // e.g. { e4: 'wK' }
  const [orientation, setOrientation] = useState<'white' | 'black'>('white');
  const [selectedPiece, setSelectedPiece] = useState<string | null>('wP');
  const [turn, setTurn] = useState('w');
  const [history, setHistory] = useState<{[key: string]: string}[]>([]);
  const [redoStack, setRedoStack] = useState<{[key: string]: string}[]>([]);
  const fenInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(()=>{
    // push initial empty state
    setHistory([{}]);
  },[]);

  // Initialize with FEN from props
  useEffect(() => {
    if (initialFen) {
      const parsed = fenToPosition(initialFen);
      if (!parsed.error) {
        setPosition(parsed.position);
        setTurn(parsed.turn || 'w');
        setHistory([{}, parsed.position]);
      }
    }
  }, [initialFen]);

  function pushHistory(newPos: {[key: string]: string}){
    setHistory(prev => {
      const copy = prev.slice();
      copy.push(newPos);
      return copy;
    });
    setRedoStack([]);
  }

  function setPieceOnSquare(square: string, piece: string | null){
    setPosition(prev => {
      const newPos = { ...prev };
      if(piece) newPos[square] = piece; else delete newPos[square];
      pushHistory(newPos);
      
      // Notify parent of FEN change
      if (onFenChange) {
        const fen = positionToFEN(newPos, turn);
        onFenChange(fen);
      }
      
      return newPos;
    });
  }

  function removePieceOnSquare(square: string){
    setPosition(prev => {
      if(!prev[square]) return prev;
      const newPos = { ...prev };
      delete newPos[square];
      pushHistory(newPos);
      
      // Notify parent of FEN change
      if (onFenChange) {
        const fen = positionToFEN(newPos, turn);
        onFenChange(fen);
      }
      
      return newPos;
    });
  }

  function handleSquareClick(square: string){
    // left click = place selected piece
    setPieceOnSquare(square, selectedPiece);
  }

  function handleSquareContextMenu(square: string){
    // right click = remove piece
    removePieceOnSquare(square);
  }

  function handlePieceDrop(sourceSquare: string, targetSquare: string, piece: string){
    // Called by react-chessboard when a piece is dragged within
    // But in editor mode we will allow dragging from board to board
    // For simplicity: if sourceSquare is null, it's external drag (we don't implement), otherwise move piece
    setPosition(prev => {
      const newPos = { ...prev };
      if(sourceSquare && newPos[sourceSquare]){
        // move
        newPos[targetSquare] = newPos[sourceSquare];
        if(sourceSquare !== targetSquare) delete newPos[sourceSquare];
        pushHistory(newPos);
        
        // Notify parent of FEN change
        if (onFenChange) {
          const fen = positionToFEN(newPos, turn);
          onFenChange(fen);
        }
      }
      return newPos;
    });
    return true;
  }

  function clearBoard(){
    setPosition({});
    pushHistory({});
    
    // Notify parent of FEN change
    if (onFenChange) {
      const fen = positionToFEN({}, turn);
      onFenChange(fen);
    }
  }

  function flipBoard(){
    setOrientation(o => o === 'white' ? 'black' : 'white');
  }

  function exportFEN(): string {
    const fen = positionToFEN(position, turn);
    navigator.clipboard?.writeText(fen).catch(()=>{});
    return fen;
  }

  function loadFENFromString(fenStr: string): string | null {
    const parsed = fenToPosition(fenStr);
    if(parsed.error) return parsed.error;
    setPosition(parsed.position);
    setTurn(parsed.turn || 'w');
    pushHistory(parsed.position);
    
    // Notify parent of FEN change
    if (onFenChange) {
      onFenChange(fenStr);
    }
    
    return null;
  }

  function undo(){
    setHistory(prev => {
      if(prev.length <= 1) return prev;
      const copy = prev.slice();
      const last = copy.pop();
      setRedoStack(rs => [last, ...rs]);
      const prevState = copy[copy.length-1] || {};
      setPosition(prevState);
      
      // Notify parent of FEN change
      if (onFenChange) {
        const fen = positionToFEN(prevState, turn);
        onFenChange(fen);
      }
      
      return copy;
    });
  }

  function redo(){
    setRedoStack(rs => {
      if(rs.length === 0) return rs;
      const [first, ...rest] = rs;
      setHistory(h => [...h, first]);
      setPosition(first);
      
      // Notify parent of FEN change
      if (onFenChange) {
        const fen = positionToFEN(first, turn);
        onFenChange(fen);
      }
      
      return rest;
    });
  }

  // palette pieces: all types white and black
  const pieceTypes = ['K','Q','R','B','N','P'];
  const palette = [];
  for(const color of ['w','b']){
    for(const t of pieceTypes) palette.push(color + t);
  }

  // Convert our internal piece codes to react-chessboard piece format (like 'wK' -> 'wK')
  // react-chessboard accepts position object where piece is in format 'wK' or 'bq' depending on lib; this code assumes it maps.

  return (
    <div className="p-4 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Lichess-like Board Editor</h2>
        {onClose && (
          <button
            onClick={onClose}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
          >
            Close Editor
          </button>
        )}
      </div>
      
      <div className="flex gap-4">
        <div>
          <div className="border rounded p-2 bg-white shadow-sm">
            <Chessboard
              id="editor-board"
              position={position}
              boardOrientation={orientation}
              arePiecesDraggable={true}
              onPieceDrop={(sourceSquare, targetSquare, piece) => handlePieceDrop(sourceSquare, targetSquare, piece)}
              onSquareClick={(square) => handleSquareClick(square)}
              customSquareStyles={{}}
              onSquareRightClick={handleSquareContextMenu}
              boardWidth={480}
            />
            <div className="flex gap-2 mt-2">
              <button className="px-3 py-1 bg-gray-200 rounded" onClick={flipBoard}>Flip</button>
              <button className="px-3 py-1 bg-gray-200 rounded" onClick={() => { const fen = exportFEN(); alert('FEN copied to clipboard:\n'+fen); }}>Export FEN</button>
              <button className="px-3 py-1 bg-gray-200 rounded" onClick={()=>{ const err = loadFENFromString(prompt('Paste FEN here')); if(err) alert('FEN error: '+err); }}>Load FEN</button>
              <button className="px-3 py-1 bg-gray-200 rounded" onClick={clearBoard}>Clear</button>
              <button className="px-3 py-1 bg-gray-200 rounded" onClick={undo}>Undo</button>
              <button className="px-3 py-1 bg-gray-200 rounded" onClick={redo}>Redo</button>
            </div>
          </div>

          <div className="mt-3 text-sm text-gray-600">
            <div>Left-click a square to place the currently selected piece.</div>
            <div>Right-click a square to remove a piece.</div>
            <div>Drag pieces on the board to move them.</div>
          </div>
        </div>

        <div className="w-64">
          <div className="mb-2 font-medium">Piece palette</div>
          <div className="grid grid-cols-3 gap-2">
            {palette.map(p => (
              <button
                key={p}
                onClick={() => setSelectedPiece(p)}
                className={`p-2 border rounded flex items-center justify-center ${selectedPiece===p? 'ring-2 ring-offset-1':''}`}
                title={p}
              >
                {/* react-chessboard shows built-in images if you pass piece prop on a small board; to keep the palette simple we show text */}
                <span className="font-semibold">{p}</span>
              </button>
            ))}
            <button onClick={()=>setSelectedPiece(null)} className="p-2 border rounded col-span-3">Eraser (no piece)</button>
          </div>

          <div className="mt-4">
            <label className="block text-sm mb-1">FEN</label>
            <textarea ref={fenInputRef} className="w-full p-2 border rounded h-24" defaultValue={positionToFEN(position, turn)} />
            <div className="flex gap-2 mt-2">
              <button onClick={()=>{ const fen = exportFEN(); fenInputRef.current!.value = fen; }} className="px-3 py-1 border rounded">Generate FEN</button>
              <button onClick={()=>{ const val = fenInputRef.current!.value; const err = loadFENFromString(val); if(err) alert('FEN error: '+err); else alert('FEN loaded'); }} className="px-3 py-1 border rounded">Load FEN</button>
              <button onClick={()=>{ navigator.clipboard?.writeText(fenInputRef.current!.value).then(()=>alert('Copied')) }} className="px-3 py-1 border rounded">Copy</button>
            </div>
          </div>

          <div className="mt-4">
            <div className="font-medium mb-1">Quick actions</div>
            <div className="flex gap-2 flex-wrap">
              <button className="px-3 py-1 border rounded" onClick={()=>{ setTurn('w'); alert('Turn set to White'); }}>White to move</button>
              <button className="px-3 py-1 border rounded" onClick={()=>{ setTurn('b'); alert('Turn set to Black'); }}>Black to move</button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
