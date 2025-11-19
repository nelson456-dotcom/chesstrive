// MoveTree.js
import { Chess } from 'chess.js';
import { v4 as uuidv4 } from 'uuid';

export function createRoot() {
  return { id: uuidv4(), san: null, children: [], parent: null };
}

// Node: { id, san, children: [], parent }

export function cloneTree(root) {
  const map = new Map();
  function cloneNode(n, parent = null) {
    const nn = { id: n.id, san: n.san, children: [], parent };
    map.set(n.id, nn);
    for (const c of n.children) nn.children.push(cloneNode(c, nn));
    return nn;
  }
  return cloneNode(root, null);
}

// Insert a move at a given node: if node has no children, push as mainline child. If node already has a mainline child
// and the new move differs from the mainline child SAN, then we append it as a variation (additional child of node).
export function insertMoveAt(root, nodeId, san) {
  const node = findById(root, nodeId);
  if (!node) throw new Error('node not found');
  const newNode = { id: uuidv4(), san, children: [], parent: node };
  // If there's no child, push as first child (mainline)
  node.children.push(newNode);
  return newNode;
}

export function findById(node, id) {
  if (node.id === id) return node;
  for (const c of node.children) {
    const r = findById(c, id);
    if (r) return r;
  }
  return null;
}

// Walk the tree and produce mapping nodeId -> FEN using chess.js by following mainline when branching
export function buildFenMap(root, startingFen = undefined) {
  const fenMap = new Map();
  function dfs(node, chess) {
    for (const child of node.children) {
      const move = chess.move(child.san, { sloppy: true });
      if (!move) {
        fenMap.set(child.id, null);
        // try to validate subtree from parent's fen
        const parentFen = chess.fen();
        const tmp = new Chess(parentFen);
        (function dfsTmp(n) {
          for (const c of n.children) {
            const r = tmp.move(c.san, { sloppy: true });
            fenMap.set(c.id, r ? tmp.fen() : null);
            if (r) dfsTmp(c);
          }
        })(child);
      } else {
        fenMap.set(child.id, chess.fen());
        dfs(child, chess);
        chess.undo();
      }
    }
  }
  const chess = new Chess(startingFen);
  fenMap.set(root.id, chess.fen());
  dfs(root, chess);
  return fenMap;
}

// Serialize tree to PGN-like string with parentheses for variations
export function treeToPgn(root, startingFen = undefined) {
  const chess = new Chess(startingFen);

  function serialize(node) {
    let out = '';
    for (let i = 0; i < node.children.length; i++) {
      const child = node.children[i];
      const moveNumber = Math.floor((getPlyIndex(child) + 1) / 2) + 1;
      const isWhite = (getPlyIndex(child) % 2) === 0;
      if (isWhite) out += `${moveNumber}. `;
      out += child.san;

      // apply move to chess to keep move numbering correct for deeper mainline
      const applied = chess.move(child.san, { sloppy: true });
      if (!applied) {
        // illegal — include SAN but don't advance state
      }

      // mainline: the first child continues directly
      if (child.children.length > 0) {
        out += ' ' + serialize(child.children[0]);
      }

      // variations: if node.children.length > 1 -> children[1..] are variations relative to this node
      if (i === 0 && node.children.length > 1) {
        for (let v = 1; v < node.children.length; v++) {
          out += ' (' + serialize(node.children[v]) + ')';
        }
      }

      out += ' ';

      // undo if applied
      if (applied) chess.undo();
    }
    return out.trim();
  }

  // get ply index (distance from root) — expensive but okay for small trees
  function getPlyIndex(node) {
    let n = node;
    let ply = -1;
    while (n) {
      if (n.san) ply++;
      n = n.parent;
    }
    return ply;
  }

  return serialize(root).trim();
}





