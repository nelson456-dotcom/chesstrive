# Interactive Chess Board Component

## Overview
The `InteractiveChessBoard` component is a fully interactive chess board with a comprehensive move annotation system. It allows users to play chess, record moves, add comments and annotations, create variations, and navigate through game history.

## Features

### 🎯 Core Functionality
- **Interactive Chess Board**: Click to select pieces and make moves
- **Move Recording**: Automatically records all moves with proper notation
- **Game Navigation**: Navigate back and forward through game history
- **Move Annotations**: Add comments and symbols to moves (!, ?, !!, etc.)
- **Variation Creation**: Create alternative move sequences from any position
- **PGN Export**: Generate PGN-like notation for the entire game

### 🎮 User Interface
- **Visual Board**: 8x8 chess board with proper piece representation
- **Move History Panel**: Clickable move list for easy navigation
- **Annotation Panel**: Add comments and symbols to moves
- **Navigation Controls**: Start, Back, Forward, End buttons
- **Demo Game**: Pre-loaded example with complex variations

### 🔧 Technical Features
- **MoveNode Class**: Handles individual moves with metadata
- **MoveAnnotation Class**: Manages the entire game tree structure
- **State Management**: React hooks for all game state
- **Responsive Design**: Works on desktop and mobile devices

## Usage

### Basic Gameplay
1. Click on a piece to select it
2. Click on a destination square to move
3. The move is automatically recorded and added to the game tree

### Adding Annotations
1. After making a move, use the annotation panel on the right
2. Add comments in the "Comment" field
3. Select annotation symbols (!, ?, !!, etc.) from the dropdown
4. Click "Update Annotation" to save

### Creating Variations
1. Click on any move in the move history (it will turn purple)
2. Make a new move on the board
3. This creates an alternative line from that position

### Navigation
- Use the navigation buttons (⏮ ◀ ▶ ⏭) to move through the game
- Click on any move in the history to jump to that position
- The current position is highlighted in green

## Component Structure

```javascript
// Main classes
class MoveNode {
  // Individual move with metadata
}

class MoveAnnotation {
  // Game tree management
}

// React component
const InteractiveChessBoard = () => {
  // All state and logic
}
```

## State Management

The component manages several key pieces of state:
- `board`: Current board position (8x8 array)
- `moveAnnotation`: MoveAnnotation instance for game tree
- `moveHistory`: Array of MoveNode instances
- `currentNode`: Currently selected move node
- `boardHistory`: Array of board positions for navigation
- `selectedSquare`: Currently selected square for moves
- `gameNotation`: PGN-like string representation

## Demo Game

The "Load Demo Game" button loads a pre-configured game with:
- Main line: e4 e5 Nf3
- Sicilian Defense variation after e4
- French Defense variation after e4  
- Petroff Defense variation after e5

This demonstrates the full annotation and variation system.

## File Location
`src/components/InteractiveChessBoard.js`

## Route
`/interactive-chess-board`

## Dependencies
- React (useState, useEffect)
- Tailwind CSS for styling
- No external chess libraries (pure JavaScript implementation)
