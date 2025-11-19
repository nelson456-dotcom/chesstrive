import React, { useEffect, useState, useRef } from 'react'
import { Chess } from 'chess.js'
import { Chessboard } from 'react-chessboard'
import { createRoot, insertMoveAt, buildFenMap, findById, cloneTree, treeToPgn } from './MoveTree'
import API from './api'
import { v4 as uuidv4 } from 'uuid'


const ChessVariationApp = () => {
  const [tree, setTree] = useState(() => createRoot())
  const [currentNodeId, setCurrentNodeId] = useState(null) // points to node representing current ply (a node with SAN) or root
  const [fenMap, setFenMap] = useState(new Map())
  const chessRef = useRef(new Chess())
  const [boardFen, setBoardFen] = useState(new Chess().fen())
  const [games, setGames] = useState([])
  const [gameId, setGameId] = useState(null)
  const [showPGNLoader, setShowPGNLoader] = useState(false)
  const [pgnInput, setPgnInput] = useState('')

  // Safe logging function that handles circular references
  function logTreeStructure(node, depth = 0) {
    const indent = '  '.repeat(depth);
    console.log(`${indent}Node: ${node.san || 'ROOT'} (id: ${node.id})`);
    node.children.forEach((child, index) => {
      console.log(`${indent}  Child ${index}: ${child.san}`);
      if (child.children.length > 0) {
        logTreeStructure(child, depth + 2);
      }
    });
  }

  useEffect(() => {
    console.log('🎯 Tree changed, rebuilding FEN map...');
    console.log('🎯 Tree has', tree.children.length, 'root children');
    if (tree.children.length > 0) {
      logTreeStructure(tree);
    }
    const newFenMap = buildFenMap(tree);
    console.log('🎯 New FEN map size:', newFenMap.size);
    setFenMap(newFenMap);
  }, [tree])

  useEffect(() => {
    // when currentNodeId changes, set board fen accordingly
    console.log('🎯 currentNodeId changed:', currentNodeId);
    console.log('🎯 fenMap size:', fenMap.size);
    
    if (!currentNodeId) {
      console.log('🎯 Setting to initial position');
      setBoardFen(new Chess().fen())
      chessRef.current = new Chess()
      return
    }
    const f = fenMap.get(currentNodeId)
    console.log('🎯 FEN for node:', f);
    if (f) {
      chessRef.current.load(f)
      setBoardFen(f)
      console.log('🎯 Board updated to FEN:', f);
    } else {
      console.log('❌ No FEN found for node:', currentNodeId);
    }
  }, [currentNodeId, fenMap])

  // helper: find node by id
  function findNode(id) {
    return findById(tree, id)
  }

  function onPieceDrop(sourceSquare, targetSquare, piece) {
    console.log('🎯 Piece drop attempted:', { sourceSquare, targetSquare, piece });
    
    try {
      // Create a new chess instance from current position
      const chess = new Chess(chessRef.current.fen());
      console.log('🎯 Current FEN:', chess.fen());
      
      // Try to make the move
      const move = chess.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: piece[1] === 'P' && (targetSquare[1] === '8' || targetSquare[1] === '1') ? 'q' : undefined
      });
      
      if (!move) {
        console.log('❌ Invalid move');
        return false;
      }
      
      console.log('✅ Valid move:', move.san);
      
      // Determine which node we are inserting at: currentNodeId (if null -> root) is the parent
      const parentId = currentNodeId || tree.id;
      
      // Clone tree and insert move
      const newTree = cloneTree(tree);
      
      // Find corresponding parent in cloned tree
      const parentInClone = findById(newTree, parentId);
      if (!parentInClone) {
        console.log('❌ Parent not found in cloned tree');
        return false;
      }
      
      const newNode = insertMoveAt(newTree, parentInClone.id, move.san);
      console.log('✅ Move inserted at node:', newNode.id);
      
      // Set new node as current
      setTree(newTree);
      setCurrentNodeId(newNode.id);
      
      return true;
    } catch (error) {
      console.error('❌ Error in onPieceDrop:', error);
      return false;
    }
  }

  function goToNode(nodeId) {
    setCurrentNodeId(nodeId)
  }

  function saveGame() {
    const id = gameId || uuidv4()
    const payload = { id, tree, pgn: treeToPgn(tree), createdAt: Date.now() }
    API.post('/game', payload).then(() => {
      setGameId(id)
      loadGames()
      alert('Saved')
    })
  }

  function loadGames() {
    API.get('/games').then(res => setGames(res.data))
  }

  useEffect(() => { loadGames() }, [])

  // Keyboard shortcuts for navigation
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Only handle shortcuts if not typing in an input
      if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
        return;
      }
      
      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault();
          goBack();
          break;
        case 'ArrowRight':
          event.preventDefault();
          goForward();
          break;
        case 'Home':
          event.preventDefault();
          goToStart();
          break;
        case 'End':
          event.preventDefault();
          goToEnd();
          break;
        case ' ':
          event.preventDefault();
          goForward();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentNodeId, tree])

  function goToStart() {
    console.log('🎯 Going to start position');
    setCurrentNodeId(null);
  }

  function goBack() {
    console.log('🎯 Going back from:', currentNodeId);
    if (!currentNodeId) {
      console.log('🎯 Already at start');
      return;
    }
    
    const currentNode = findById(tree, currentNodeId);
    if (currentNode && currentNode.parent) {
      setCurrentNodeId(currentNode.parent.id);
    } else {
      setCurrentNodeId(null);
    }
  }

  function goForward() {
    console.log('🎯 Going forward from:', currentNodeId);
    if (!currentNodeId) {
      // At root, go to first move if it exists
      if (tree.children.length > 0) {
        setCurrentNodeId(tree.children[0].id);
      }
      return;
    }
    
    const currentNode = findById(tree, currentNodeId);
    if (currentNode && currentNode.children.length > 0) {
      setCurrentNodeId(currentNode.children[0].id);
    }
  }

  function goToEnd() {
    console.log('🎯 Going to end position');
    // Find the deepest mainline node
    function findDeepest(node) {
      if (node.children.length === 0) {
        return node;
      }
      return findDeepest(node.children[0]); // Follow mainline (first child)
    }
    
    const deepest = findDeepest(tree);
    if (deepest.id !== tree.id) {
      setCurrentNodeId(deepest.id);
    }
  }

  function testMove() {
    console.log('🧪 Testing move e2-e4...');
    const testMove = onPieceDrop('e2', 'e4', 'wP');
    console.log('🧪 Test move result:', testMove);
  }

  function exportPgn() {
    const pgn = treeToPgn(tree)
    const blob = new Blob([pgn], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'game.pgn'
    a.click()
    URL.revokeObjectURL(url)
  }

  // PGN parsing function
  function parsePGNString(pgnString) {
    console.log('🎯 Parsing PGN string:', pgnString.substring(0, 100) + '...');
    
    try {
      // Extract the moves part (after the headers)
      const lines = pgnString.split('\n');
      let movesLine = '';
      
      // Find the line with moves (usually the last non-empty line)
      for (let i = lines.length - 1; i >= 0; i--) {
        const line = lines[i].trim();
        if (line && !line.startsWith('[') && !line.startsWith('*')) {
          movesLine = line;
          break;
        }
      }
      
      if (!movesLine) {
        throw new Error('No moves found in PGN');
      }
      
      console.log('🎯 Moves line:', movesLine);
      
      // Parse the moves using our existing tree structure
      const newTree = parsePGNToTree(movesLine);
      console.log('🎯 Parsed tree:', newTree);
      
      return newTree;
    } catch (error) {
      console.error('❌ Error parsing PGN:', error);
      throw error;
    }
  }

  // Improved PGN parser that handles variations properly
  function parsePGNToTree(movesString) {
    console.log('🎯 Parsing moves string:', movesString);
    
    // Remove result markers and clean up
    let cleanMoves = movesString.replace(/\*\s*$/, '').trim();
    console.log('🎯 Cleaned moves:', cleanMoves);
    
    const root = createRoot();
    let currentNode = root;
    let moveNumber = 1;
    let isWhiteTurn = true;
    
    // Parse the moves string character by character
    let i = 0;
    
    const skipWhitespace = () => {
      while (i < cleanMoves.length && /\s/.test(cleanMoves[i])) i++;
    };
    
    const parseMove = () => {
      skipWhitespace();
      let move = '';
      while (i < cleanMoves.length && /[a-zA-Z0-9\-=+#O]/.test(cleanMoves[i])) {
        move += cleanMoves[i];
        i++;
      }
      return move || null;
    };
    
    const parseVariation = (startMoveNum, startIsWhite) => {
      const varMoves = [];
      let currentMoveNum = startMoveNum;
      let currentIsWhite = startIsWhite;
      
      skipWhitespace();
      
      while (i < cleanMoves.length) {
        const char = cleanMoves[i];
        
        // End of variation
        if (char === ')') {
          i++;
          return varMoves;
        }
        
        // Nested variation
        if (char === '(') {
          i++;
          const nested = parseVariation(currentMoveNum, currentIsWhite);
          if (varMoves.length > 0) {
            const lastMove = varMoves[varMoves.length - 1];
            lastMove.variations = lastMove.variations || [];
            lastMove.variations.push(nested);
          }
          skipWhitespace();
          continue;
        }
        
        // Move number
        if (/\d/.test(char)) {
          let numStr = '';
          while (i < cleanMoves.length && /\d/.test(cleanMoves[i])) {
            numStr += cleanMoves[i];
            i++;
          }
          currentMoveNum = parseInt(numStr);
          
          skipWhitespace();
          
          // Check for dots
          if (cleanMoves[i] === '.') {
            i++;
            if (cleanMoves[i] === '.') {
              i++;
              currentIsWhite = false;
            } else {
              currentIsWhite = true;
            }
          }
          skipWhitespace();
          continue;
        }
        
        // End markers or other non-move characters
        if (char === '*' || char === '1' || char === '0' || char === '-') {
          i++;
          continue;
        }
        
        // Parse move
        const move = parseMove();
        if (move && move !== '*') {
          const moveObj = {
            id: uuidv4(),
            san: move,
            children: [],
            parent: currentNode,
            moveNumber: currentMoveNum,
            isWhite: currentIsWhite,
            notation: currentIsWhite ? `${currentMoveNum}. ${move}` : `${currentMoveNum}... ${move}`,
            variations: []
          };
          
          varMoves.push(moveObj);
          currentIsWhite = !currentIsWhite;
          if (!currentIsWhite) {
            currentMoveNum++;
          }
        }
        
        skipWhitespace();
      }
      
      return varMoves;
    };
    
    const mainLine = parseVariation(1, true);
    
    // Build the tree by connecting moves
    mainLine.forEach(move => {
      move.parent = currentNode;
      currentNode.children.push(move);
      currentNode = move;
    });
    
    console.log('🎯 Built tree with', root.children.length, 'root children');
    return root;
  }

  // Load PGN function
  function loadPGN() {
    if (!pgnInput.trim()) {
      alert('Please enter a PGN string');
      return;
    }

    console.log('🎯 Starting PGN load process...');
    console.log('🎯 PGN input:', pgnInput.substring(0, 200) + '...');

    try {
      const newTree = parsePGNString(pgnInput);
      console.log('🎯 Parsed tree successfully:', newTree);
      console.log('🎯 Tree children count:', newTree.children.length);
      
      setTree(newTree);
      setCurrentNodeId(null);
      setShowPGNLoader(false);
      setPgnInput('');
      
      console.log('🎯 PGN loaded successfully!');
      alert('PGN loaded successfully!');
    } catch (error) {
      console.error('❌ Error loading PGN:', error);
      console.error('❌ Error stack:', error.stack);
      alert('Error loading PGN: ' + error.message);
    }
  }

  // Helper function to get move number and turn for a node
  function getMoveInfo(node) {
    let moveNumber = 1;
    let isWhiteMove = true;
    let currentNode = node;
    
    // Count moves from root to this node
    while (currentNode.parent) {
      currentNode = currentNode.parent;
      if (currentNode.san) {
        isWhiteMove = !isWhiteMove;
        if (isWhiteMove) {
          moveNumber++;
        }
      }
    }
    
    return { moveNumber, isWhiteMove };
  }

  function renderNode(node) {
    // show SAN with click
    return (
      <div key={node.id}>
        {node.san ? (
          <div style={{ marginBottom: 4 }}>
            {(() => {
              const { moveNumber, isWhiteMove } = getMoveInfo(node);
              const movePrefix = isWhiteMove ? `${moveNumber}. ` : `${moveNumber}... `;
              return (
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span style={{ 
                    fontWeight: 'bold', 
                    color: '#666',
                    marginRight: 8,
                    fontSize: '14px',
                    minWidth: '40px'
                  }}>
                    {movePrefix}
                  </span>
                  <button 
                    onClick={() => goToNode(node.id)} 
                    style={{ 
                      cursor: 'pointer',
                      padding: '3px 6px',
                      border: 'none',
                      borderRadius: 3,
                      background: currentNodeId === node.id ? '#1976d2' : 'transparent',
                      color: currentNodeId === node.id ? 'white' : '#333',
                      fontWeight: currentNodeId === node.id ? 'bold' : 'normal',
                      fontSize: '14px',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (currentNodeId !== node.id) {
                        e.target.style.background = '#f0f0f0';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (currentNodeId !== node.id) {
                        e.target.style.background = 'transparent';
                      }
                    }}
                  >
                    {node.san}
                  </button>
                </div>
              );
            })()}
          </div>
        ) : null}
        
        {/* render mainline child first */}
        {node.children.length > 0 && (
          <div>
            {renderNode(node.children[0])}
            
            {/* variations */}
            {node.children.length > 1 && (
              <div style={{ marginLeft: 20, marginTop: 4 }}>
                <div style={{ color: '#888', fontSize: '12px', marginBottom: 2 }}>(</div>
                {node.children.slice(1).map((v, index) => (
                  <div key={v.id} style={{ marginLeft: 8 }}>
                    {renderNode(v)}
                  </div>
                ))}
                <div style={{ color: '#888', fontSize: '12px', marginTop: 2 }}>)</div>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="w-full min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8">Chess Variation Fullstack App</h1>
        <p className="text-center text-gray-600 mb-8">
          Interactive chess board with move tree recording. Play moves to automatically record them into the tree.
        </p>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Board Section */}
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold mb-4">Chess Board</h2>
            <div className="flex justify-center mb-4">
              <div style={{ width: 420 }}>
                <Chessboard
                  position={boardFen}
                  onPieceDrop={onPieceDrop}
                  boardWidth={420}
                  arePiecesDraggable={true}
                  customBoardStyle={{
                    borderRadius: '4px',
                    boxShadow: '0 5px 15px rgba(0,0,0,0.3)'
                  }}
                />
              </div>
            </div>
            {/* Navigation Controls */}
            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-2 text-center">Navigation Controls</h3>
              <div className="flex gap-2 justify-center">
                <button 
                  onClick={goToStart}
                  className="px-3 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                  title="Go to start (Home key)"
                >
                  ⏮️ Start
                </button>
                <button 
                  onClick={goBack}
                  className="px-3 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                  title="Previous move (← key)"
                >
                  ⏪ Back
                </button>
                <button 
                  onClick={goForward}
                  className="px-3 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                  title="Next move (→ or Space key)"
                >
                  ⏩ Forward
                </button>
                <button 
                  onClick={goToEnd}
                  className="px-3 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                  title="Go to end (End key)"
                >
                  ⏭️ End
                </button>
              </div>
            </div>

            {/* Game Controls */}
            <div className="flex gap-2 justify-center">
              <button 
                onClick={() => { setTree(createRoot()); setCurrentNodeId(null); }}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                New Game
              </button>
              <button 
                onClick={() => setShowPGNLoader(true)}
                className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
              >
                Load PGN
              </button>
              <button 
                onClick={testMove}
                className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
              >
                Test Move (e2-e4)
              </button>
              <button 
                onClick={saveGame}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                Save Game
              </button>
              <button 
                onClick={exportPgn}
                className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
              >
                Export PGN
              </button>
            </div>
            
            <div className="mt-6">
              <h3 className="font-bold mb-2">Saved Games</h3>
              <div className="max-h-40 overflow-y-auto">
                {games.length === 0 ? (
                  <p className="text-gray-500 text-sm">No saved games yet</p>
                ) : (
                  <ul className="space-y-1">
                    {games.map(g => (
                      <li key={g.id}>
                        <button 
                          onClick={() => { 
                            API.get('/game/' + g.id).then(r => { 
                              setTree(r.data.tree); 
                              setGameId(g.id); 
                              setCurrentNodeId(null); 
                            }); 
                          }}
                          className="text-sm text-blue-600 hover:text-blue-800 underline"
                        >
                          Game {g.id.slice(0, 8)}...
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>

          {/* Move Tree Section */}
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold mb-4">Move Tree</h2>
            
            {/* Current Position Info */}
            <div className="mb-4 p-3 bg-blue-50 rounded">
              <h3 className="font-semibold text-blue-900 mb-1">Current Position:</h3>
              <p className="text-sm text-blue-800">
                {currentNodeId ? (
                  <>
                    Move: <span className="font-mono">{findById(tree, currentNodeId)?.san}</span>
                    <br />
                    Node ID: <span className="font-mono text-xs">{currentNodeId}</span>
                  </>
                ) : (
                  'Starting position'
                )}
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 max-h-96 overflow-y-auto" style={{ fontFamily: 'monospace', lineHeight: '1.6' }}>
              {tree.children.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No moves yet. Start playing on the board!</p>
              ) : (
                <div className="space-y-1">
                  {renderNode(tree)}
                </div>
              )}
            </div>
            
            <div className="mt-4 p-4 bg-blue-50 rounded">
              <h3 className="font-bold text-blue-900 mb-2">How to Test Sublines:</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• <strong>Make moves</strong> on the board to build the main line</li>
                <li>• <strong>Navigate back</strong> to any position using ← or Back button</li>
                <li>• <strong>Make different moves</strong> from that position to create variations</li>
                <li>• <strong>Click moves</strong> in the tree to jump to any position</li>
                <li>• <strong>Use keyboard:</strong> ← → Home End Space for navigation</li>
                <li>• <strong>Variations</strong> will appear as separate branches in the tree</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* PGN Loader Modal */}
      {showPGNLoader && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">Load PGN</h2>
            <p className="text-gray-600 mb-4">
              Paste your PGN string below. The parser will extract the moves and create a move tree.
            </p>
            
            <textarea
              value={pgnInput}
              onChange={(e) => setPgnInput(e.target.value)}
              placeholder={`Paste your PGN here, for example:

[Event "Crushder's Study: Chapter 3"]
[Date "2025.10.14"]
[Result "*"]
[Variant "Standard"]
[ECO "C50"]
[Opening "Italian Game"]
[StudyName "Crushder's Study"]
[ChapterName "Chapter 3"]
[ChapterURL "https://lichess.org/study/Yxg2MHJg/4eK95CmT"]
[Annotator "https://lichess.org/@/Crushder"]
[UTCDate "2025.10.14"]
[UTCTime "23:09:40"]

1. e4 e5 2. Nf3 Nc6 3. Bc4 (3. Nc3 Nf6 (3... Bc5 4. d3 d6 5. Be2 Nf6 6. O-O (6. Bg5))) *`}
              className="w-full h-64 p-4 border border-gray-300 rounded font-mono text-sm"
            />
            
            <div className="flex gap-2 justify-end mt-4">
              <button
                onClick={() => {
                  setShowPGNLoader(false);
                  setPgnInput('');
                }}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={loadPGN}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Load PGN
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ChessVariationApp