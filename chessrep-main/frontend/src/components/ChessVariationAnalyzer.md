# Chess Variation Analyzer Component

## Overview
The `ChessVariationAnalyzer` component is a comprehensive chess analysis tool that combines PGN parsing with visual board representation and interactive variation tree navigation. It's based on the provided code examples and integrates chess.js for robust game analysis.

## Features

### 🎯 **Core Functionality**
- **PGN Parsing**: Parse PGN strings with complex variations using chess.js
- **Visual Chess Board**: Interactive 8x8 chess board with piece representation
- **Variation Tree**: Interactive tree display of moves and variations
- **Move Navigation**: Click on moves to navigate through the game
- **Position Tracking**: Real-time board position updates

### 🎮 **User Interface**
- **PGN Input Area**: Text area for entering PGN strings
- **Example PGNs**: Pre-loaded examples (Sicilian Defense, King's Gambit, Ruy Lopez)
- **Interactive Board**: Visual chess board with piece symbols
- **Variation Tree**: Hierarchical display of moves and variations
- **Parsed Data Display**: JSON representation of parsed moves

### 🔧 **Technical Features**
- **Chess.js Integration**: Uses chess.js library for PGN parsing and move validation
- **Fallback Parser**: Manual PGN parser as backup for complex variations
- **Move Tree Building**: Converts PGN into navigable tree structure
- **Position Management**: Tracks and updates board positions
- **Error Handling**: Graceful error handling for invalid PGNs

## Usage

### Basic Workflow
1. **Enter PGN**: Type or paste a PGN string in the input area
2. **Parse**: Click "Parse PGN" to analyze the structure
3. **Navigate**: Click on moves in the variation tree to see positions
4. **Explore**: Use example PGNs to see the system in action

### Example PGNs Included
- **Sicilian Defense**: Complex opening with multiple variations
- **King's Gambit**: Aggressive opening with tactical variations
- **Ruy Lopez**: Classical opening with positional variations

### PGN Format Support
- Standard algebraic notation
- Move numbers and dots
- Variations in parentheses
- Comments and annotations
- Complex nested variations

## Component Structure

```javascript
// Main state management
const [pgnInput, setPgnInput] = useState(defaultPGN);
const [parsedMoves, setParsedMoves] = useState(null);
const [selectedMove, setSelectedMove] = useState(null);
const [boardPosition, setBoardPosition] = useState(initialFEN);

// Chess.js integration
const chessRef = useRef(new Chess());

// PGN parsing functions
const parsePGN = (pgn) => { /* Main parser */ };
const parsePGNManually = (pgn) => { /* Fallback parser */ };
const buildMoveTree = (moves, pgn) => { /* Tree builder */ };
```

## Key Functions

### `parsePGN(pgn)`
- Primary PGN parser using chess.js
- Handles complex variations and move validation
- Falls back to manual parsing if needed

### `buildMoveTree(moves, pgn)`
- Converts parsed moves into tree structure
- Handles move numbers and color alternation
- Preserves move metadata for navigation

### `handleMoveClick(move, color)`
- Updates board position when move is clicked
- Plays moves up to selected position
- Updates visual board display

### `renderVariationTree(moves, depth)`
- Renders interactive variation tree
- Handles nested variations and indentation
- Provides click handlers for navigation

## File Location
`src/components/ChessVariationAnalyzer.js`

## Route
`/chess-variation-analyzer`

## Dependencies
- React (useState, useEffect, useRef)
- chess.js (Chess class for game logic)
- Tailwind CSS for styling

## Example Usage

```javascript
// Example PGN with variations
const pgn = `1. e4 c5 2. Nf3 (2. c3 Nf6 3. e5 Nd5) 2... d6 3. d4 cxd4 4. Nxd4 Nf6`;

// Parse and display
const parsed = parsePGN(pgn);
// Results in interactive tree with clickable moves
```

## Integration
- Added to main navigation as "Variation Analyzer"
- Accessible via `/chess-variation-analyzer` route
- Integrates with existing chess application structure

## Future Enhancements
- Support for more complex PGN formats
- Move annotation and comments
- Export functionality for analyzed games
- Integration with chess engines
- Advanced position analysis features
