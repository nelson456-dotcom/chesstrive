# Chess Game Page

A comprehensive chess game interface with move recording capabilities using the **chess-moments** library for robust PGN parsing and game state management.

## Features

### 🎮 **Game Play**
- **Interactive Chess Board**: Drag and drop pieces to make moves
- **Move Validation**: Only legal moves are allowed
- **Game State Tracking**: Automatic game over detection
- **Turn Management**: Proper white/black turn handling

### 📝 **Move Recording**
- **Complete Move History**: Every move is recorded with full details
- **Move Navigation**: Click any move in notation to jump to that position
- **Undo Functionality**: Take back the last move
- **Move Comments**: Add annotations to moves (future feature)
- **NAG Support**: Add numeric annotation glyphs (future feature)

### 💾 **Import/Export**
- **PGN Export**: Save games in standard PGN format
- **PGN Import**: Load existing games from PGN files
- **File Download**: Automatic PGN file download with timestamps

### 🎛️ **Controls**
- **New Game**: Start fresh games anytime
- **Board Flipping**: Switch between white and black perspective
- **Board Resizing**: Adjustable board size (400px - 700px)
- **Game Information**: Real-time game status and player info
- **Arrow Navigation**: First, Previous, Next, Last move controls
- **Variation Support**: Add and navigate sublines/variations

### 📊 **Game Information**
- **Current Turn**: Shows whose turn it is
- **Move Count**: Total number of moves played
- **Game Status**: In Progress or Game Over
- **Result**: Win/Loss/Draw when game ends
- **Player Names**: Customizable player information

## Usage

### Basic Game Play
1. Navigate to `/chess-game`
2. Drag pieces to make moves
3. Use navigation buttons for game control
4. Click moves in notation to jump to positions

### Import/Export Games
1. **Export**: Click "Export PGN" to download current game
2. **Import**: Click "Import PGN" to load existing games
3. **View PGN**: Toggle PGN display to see raw game data

### Game Controls
- **🆕 New Game**: Start a fresh game
- **↶ Undo Move**: Take back the last move
- **🔄 Flip Board**: Change board orientation
- **💾 Export PGN**: Save game to file
- **📁 Import PGN**: Load game from file

## Technical Implementation

### Services
- **ChessGameRecordingService**: Core game logic and move recording using chess-moments
- **Chess-moments**: Primary library for PGN parsing and game state management
- **Chess.js**: Chess engine for move validation and compatibility

### Components
- **ChessGamePage**: Main page component
- **ChessMoveNotation**: Traditional move history display
- **ChessMomentsAnnotation**: Chess moments annotation panel
- **ProductionChessBoard**: Interactive chess board

### Data Structures
- **RecordedMove**: Complete move information with metadata
- **GameState**: Current game state and history
- **Headers**: Game metadata (players, date, etc.)

## Chess-Moments Integration

The chess game page now uses the **chess-moments** library for:

- **PGN Parsing**: Robust parsing of PGN files with support for variations, comments, and NAGs
- **Move Recording**: Advanced move recording with full metadata
- **Game State Management**: Comprehensive game state tracking
- **Export/Import**: Enhanced PGN export and import capabilities
- **Tree System**: Built-in support for move variations and branching

### Chess-Moments Features Used:
- **Move Recording**: Each move creates a chess moment with full metadata
- **Annotation Display**: Real-time chess moments annotation panel with variation support
- **Variation Handling**: Properly displays sublines/variations with depth indicators
- **PGN Parsing**: `flat()` - Parse PGN into flat array of chess moments
- **Tree Structure**: `tree()` - Parse PGN into tree structure with variations
- **PGN Export**: `momentsToPgn()` - Convert chess moments back to PGN format
- **Comments Support**: Preserves and displays comments from chess moments
- **Navigation**: Click any chess moment to navigate to that position
- **Visual Indicators**: Variations are highlighted and indented based on depth
- **Arrow Controls**: First, Previous, Next, Last move navigation buttons
- **Modern UI**: Clean, professional design with visual variation indicators

## Future Enhancements
- Move comments and annotations (chess-moments supports these)
- NAG (Numeric Annotation Glyph) support (chess-moments supports these)
- Game analysis integration
- Opening book suggestions
- Engine evaluation
- Time controls
- Multiplayer support
- Advanced variation handling using chess-moments tree system

## Navigation
Access the chess game page via:
- **URL**: `http://localhost:3000/chess-game`
- **Navigation**: Click "Chess Game" in the main navigation menu
- **Direct Link**: Available in the top navigation bar
