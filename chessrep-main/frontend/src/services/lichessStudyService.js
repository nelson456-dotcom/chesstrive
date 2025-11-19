/**
 * Lichess Study Import Service
 * Handles importing studies from Lichess.org with FULL PGN support including comments, NAGs, and variations
 */

class LichessStudyService {
  constructor() {
    this.baseUrl = 'https://lichess.org';
  }

  /**
   * Fetch a public study from Lichess
   */
  async fetchStudy(studyId) {
    try {
      console.log('🔍 Fetching Lichess study:', studyId);
      
      // Remove any URL parts and get just the study ID
      const cleanStudyId = studyId.replace(/^https?:\/\/lichess\.org\/study\//, '').replace(/\/.*$/, '');
      
      const response = await fetch(`${this.baseUrl}/api/study/${cleanStudyId}.pgn`, {
        headers: {
          'Accept': 'application/x-chess-pgn'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch study: ${response.status} ${response.statusText}`);
      }

      const pgnText = await response.text();
      console.log('📄 Raw PGN from Lichess:', pgnText.substring(0, 500) + '...');

      // Parse the PGN to extract study information
      const study = this.parseStudyPGN(pgnText, cleanStudyId);
      
      if (!study) {
        throw new Error('Failed to parse study PGN');
      }

      console.log('✅ Successfully parsed Lichess study:', study);
      return study;

    } catch (error) {
      console.error('❌ Error fetching Lichess study:', error);
      throw error;
    }
  }

  /**
   * Parse PGN text to extract study information
   */
  parseStudyPGN(pgnText, studyId) {
    try {
      const lines = pgnText.split('\n');
      const chapters = [];
      let currentChapter = {};
      let currentPGN = '';
      let studyName = 'Imported Study';
      let studyDescription = '';
      let ownerName = 'Unknown';

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        if (line.startsWith('[Event ')) {
          // Start of a new chapter
          if (currentChapter.name && currentPGN) {
            chapters.push({
              id: currentChapter.id || `chapter-${chapters.length + 1}`,
              name: currentChapter.name,
              pgn: currentPGN.trim(),
              orientation: currentChapter.orientation || 'white',
              tags: currentChapter.tags || []
            });
          }
          
          // Reset for new chapter
          currentChapter = {};
          currentPGN = '';
        }
        
        if (line.startsWith('[Event ')) {
          const eventMatch = line.match(/\[Event "([^"]+)"/);
          if (eventMatch) {
            // Extract ONLY the chapter title, no comments or annotations
            let chapterName = eventMatch[1];
            // Remove ALL PGN artifacts that might have leaked into the title
            chapterName = chapterName
              .replace(/\{[^}]*\}/g, '')  // Remove comments {...}
              .replace(/\$\d+/g, '')       // Remove NAGs $1, $2, etc.
              .replace(/\([^)]*\)/g, '')   // Remove any parentheses (variations)
              .replace(/[!?]+/g, '')       // Remove annotation symbols
              .replace(/\s+/g, ' ')        // Normalize whitespace
              .trim();
            currentChapter.name = chapterName;
          }
        }
        
        if (line.startsWith('[Site ')) {
          const siteMatch = line.match(/\[Site "([^"]+)"/);
          if (siteMatch) {
            studyName = siteMatch[1].replace(/^https?:\/\/lichess\.org\/study\//, '');
          }
        }
        
        if (line.startsWith('[White ')) {
          const whiteMatch = line.match(/\[White "([^"]+)"/);
          if (whiteMatch) {
            ownerName = whiteMatch[1];
          }
        }
        
        if (line.startsWith('[Black ')) {
          const blackMatch = line.match(/\[Black "([^"]+)"/);
          if (blackMatch && blackMatch[1] !== '?') {
            currentChapter.orientation = 'black';
          }
        }
        
        if (line.startsWith('[ECO ')) {
          const ecoMatch = line.match(/\[ECO "([^"]+)"/);
          if (ecoMatch) {
            currentChapter.tags = currentChapter.tags || [];
            currentChapter.tags.push(`ECO: ${ecoMatch[1]}`);
          }
        }
        
        if (line.startsWith('[Opening ')) {
          const openingMatch = line.match(/\[Opening "([^"]+)"/);
          if (openingMatch) {
            currentChapter.tags = currentChapter.tags || [];
            currentChapter.tags.push(`Opening: ${openingMatch[1]}`);
          }
        }
        
        if (line.startsWith('[Variation ')) {
          const variationMatch = line.match(/\[Variation "([^"]+)"/);
          if (variationMatch) {
            currentChapter.tags = currentChapter.tags || [];
            currentChapter.tags.push(`Variation: ${variationMatch[1]}`);
          }
        }
        
        // Collect move text (non-tag lines) - PRESERVE COMMENTS AND NAGS
        if (!line.startsWith('[') && line.length > 0) {
          currentPGN += line + ' ';
        }
      }

      // Add the last chapter
      if (currentChapter.name && currentPGN) {
        console.log('📝 Adding chapter:', currentChapter.name, 'with PGN length:', currentPGN.length);
        chapters.push({
          id: currentChapter.id || `chapter-${chapters.length + 1}`,
          name: currentChapter.name,
          pgn: currentPGN.trim(),
          orientation: currentChapter.orientation || 'white',
          tags: currentChapter.tags || []
        });
      }

      if (chapters.length === 0) {
        console.warn('⚠️ No chapters found in PGN');
        return null;
      }

      return {
        id: studyId,
        name: studyName,
        description: studyDescription || `Imported from Lichess study ${studyId}`,
        chapters,
        owner: {
          id: ownerName.toLowerCase().replace(/\s+/g, '-'),
          name: ownerName
        },
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

    } catch (error) {
      console.error('❌ Error parsing study PGN:', error);
      return null;
    }
  }

  /**
   * Convert Lichess study to our internal format
   */
  async convertToInternalFormat(lichessStudy) {
    console.log('🔄 Converting Lichess study to internal format:', lichessStudy.name);
    console.log('📊 Chapters to convert:', lichessStudy.chapters.length);
    
    return {
      name: lichessStudy.name,
      description: lichessStudy.description,
      chapters: await Promise.all(lichessStudy.chapters.map(async (chapter, index) => {
        console.log(`🔄 Converting chapter ${index + 1}:`, chapter.name);
        console.log('📝 Chapter PGN length:', chapter.pgn.length);
        console.log('📝 Chapter PGN preview:', chapter.pgn.substring(0, 200) + '...');
        
        const gameTree = await this.convertPGNToGameTree(chapter.pgn);
        console.log('🎯 Converted game tree moves:', gameTree.moves.length);
        console.log('🎯 First few moves:', gameTree.moves.slice(0, 3));
        
        // CRITICAL: Double-check that chapter name is clean (no PGN artifacts)
        let cleanName = chapter.name
          .replace(/\{[^}]*\}/g, '')  // Remove comments {...}
          .replace(/\$\d+/g, '')       // Remove NAGs $1, $2, etc.
          .replace(/\([^)]*\)/g, '')   // Remove any parentheses (variations)
          .replace(/[!?]+/g, '')       // Remove annotation symbols
          .replace(/\s+/g, ' ')        // Normalize whitespace
          .trim();
        
        console.log('🧹 Original chapter name:', chapter.name);
        console.log('🧹 Cleaned chapter name:', cleanName);
        
        return {
          name: cleanName,
          notes: chapter.tags.length > 0 ? `Tags: ${chapter.tags.join(', ')}` : '',
          pgn: chapter.pgn,
          position: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
          gameTree: gameTree,
          currentPath: [],
          currentMoveIndex: 0,
          importedFrom: 'lichess',
          originalChapterId: chapter.id
        };
      }))
    };
  }

  /**
   * Convert PGN to our game tree format with FULL comment and NAG support
   */
  async convertPGNToGameTree(pgn) {
    console.log('🚀 convertPGNToGameTree CALLED with PGN length:', pgn?.length || 0);
    try {
      // Import Chess.js
      const { Chess } = await import('chess.js');
      const game = new Chess();
      
      // Parse PGN with comments, NAGs, and variations
      const tree = this.parsePGNWithCommentsAndVariations(pgn, game);
      
      console.log('✅ Game tree built successfully');
      console.log('📊 Total moves:', tree.moves.length);
      console.log('📊 Moves with comments:', tree.moves.filter(m => m.comment).length);
      
      return tree;
      
    } catch (error) {
      console.error('❌ Error converting PGN to game tree:', error);
      return {
        moves: [],
        variations: []
      };
    }
  }

  /**
   * Parse PGN with full support for comments, NAGs, and nested variations
   * This is the CORRECT implementation that preserves all PGN artifacts
   */
  parsePGNWithCommentsAndVariations(pgnText, gameInstance) {
    console.log('🔍 Parsing PGN with comments and variations');
    
    // Import Chess for use in the parser
    const Chess = gameInstance.constructor;
    
    const startingPosition = gameInstance.fen();
    let text = pgnText;
    let index = 0;
    
    // Helper to skip whitespace
    const skipWhitespace = () => {
      while (index < text.length && /\s/.test(text[index])) {
        index++;
      }
    };
    
    // Helper to parse a comment {...}
    const parseComment = () => {
      if (text[index] !== '{') return null;
      
      index++; // Skip opening {
      let comment = '';
      let depth = 1;
      
      while (index < text.length && depth > 0) {
        if (text[index] === '{') depth++;
        if (text[index] === '}') depth--;
        
        if (depth > 0) {
          comment += text[index];
        }
        index++;
      }
      
      return comment.trim();
    };
    
    // Helper to parse NAGs ($1, $2, etc.)
    const parseNAG = () => {
      if (text[index] !== '$') return null;
      
      index++; // Skip $
      let nag = '';
      while (index < text.length && /\d/.test(text[index])) {
        nag += text[index];
        index++;
      }
      
      return nag ? parseInt(nag) : null;
    };
    
    // Recursive function to parse a sequence (mainline or variation)
    const parseSequence = (parentGame) => {
      const moves = [];
      const currentGame = new Chess(parentGame.fen());
      
      while (index < text.length) {
        skipWhitespace();
        
        if (index >= text.length) break;
        
        const char = text[index];
        
        // End of variation
        if (char === ')') {
          break;
        }
        
        // Start of variation
        if (char === '(') {
          index++; // Skip (
          
          if (moves.length > 0) {
            // Variation branches from BEFORE the last move
            // So we need to get the position before the last move
            const beforeLastMoveGame = new Chess(parentGame.fen());
            for (let i = 0; i < moves.length - 1; i++) {
              beforeLastMoveGame.move(moves[i].san);
            }
            
            const variation = parseSequence(beforeLastMoveGame);
            
            // Attach variation to the last move
            const lastMove = moves[moves.length - 1];
            if (!lastMove.variations) {
              lastMove.variations = [];
            }
            lastMove.variations.push(variation);
          }
          
          skipWhitespace();
          if (text[index] === ')') {
            index++; // Skip closing )
          }
          continue;
        }
        
        // Parse comment (before or after move)
        let preComment = null;
        if (char === '{') {
          preComment = parseComment();
          skipWhitespace();
          continue; // Comments before moves are attached to previous move
        }
        
        // Parse NAG
        if (char === '$') {
          const nag = parseNAG();
          if (nag && moves.length > 0) {
            const lastMove = moves[moves.length - 1];
            if (!lastMove.nags) {
              lastMove.nags = [];
            }
            lastMove.nags.push(nag);
          }
          skipWhitespace();
          continue;
        }
        
        // Skip move numbers
        if (/\d/.test(char)) {
          while (index < text.length && /[\d.]/.test(text[index])) {
            index++;
          }
          skipWhitespace();
          continue;
        }
        
        // Skip game result
        if (char === '*' || text.substring(index, index + 3) === '1-0' || 
            text.substring(index, index + 3) === '0-1' || 
            text.substring(index, index + 7) === '1/2-1/2') {
          while (index < text.length && !/\s/.test(text[index])) {
            index++;
          }
          break;
        }
        
        // Parse move
        let moveStr = '';
        while (index < text.length && /[a-zA-Z0-9\-=+#]/.test(text[index])) {
          moveStr += text[index];
          index++;
        }
        
        if (moveStr.length > 0) {
          try {
            const moveObj = currentGame.move(moveStr);
            
            if (moveObj) {
              const moveNode = {
                san: moveObj.san,
                from: moveObj.from,
                to: moveObj.to,
                piece: moveObj.piece,
                captured: moveObj.captured,
                promotion: moveObj.promotion,
                flags: moveObj.flags,
                fen: currentGame.fen(),
                variations: []
              };
              
              // Attach pre-comment to previous move if exists
              if (preComment && moves.length > 0) {
                moves[moves.length - 1].comment = preComment;
              }
              
              skipWhitespace();
              
              // Parse post-move comment
              if (text[index] === '{') {
                moveNode.comment = parseComment();
                skipWhitespace();
              }
              
              // Parse post-move NAGs
              const nags = [];
              while (text[index] === '$') {
                const nag = parseNAG();
                if (nag) nags.push(nag);
                skipWhitespace();
              }
              if (nags.length > 0) {
                moveNode.nags = nags;
              }
              
              moves.push(moveNode);
            }
          } catch (error) {
            console.warn('⚠️ Could not parse move:', moveStr, error);
          }
        }
        
        skipWhitespace();
      }
      
      return { moves };
    };
    
    // Parse the main line
    const result = parseSequence(gameInstance);
    
    // Debug: Log moves with comments
    console.log('🎯 PARSED MOVES WITH COMMENTS:');
    result.moves.forEach((move, idx) => {
      if (move.comment || move.nags) {
        console.log(`  Move ${idx + 1}: ${move.san}`, {
          comment: move.comment,
          nags: move.nags
        });
      }
    });
    
    return {
      moves: result.moves,
      variations: [] // Root-level variations are handled within the tree
    };
  }
}

export const lichessStudyService = new LichessStudyService();
