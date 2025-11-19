# Full Annotation Chess Board System

A comprehensive chess board with complete annotation system that handles all variations, nested sublines, and provides perfect navigation.

## Features

### ✅ Complete PGN Parsing
- **Main line moves**: All moves in the main game line
- **All variations**: Every variation and sub-variation, nested to any depth
- **Comments**: Full support for move comments `{like this}`
- **NAG symbols**: Numeric Annotation Glyphs (!?, ?!, !!, ??, etc.)
- **Game headers**: Event, Site, Date, Round, White, Black, Result, etc.

### ✅ Perfect Navigation
- **Arrow key navigation**: Left/Right for previous/next move
- **Variation navigation**: Up/Down for entering/exiting variations
- **Click-to-move**: Click any move in the notation to jump to that position
- **Variation exploration**: Click moves inside parentheses to explore variations
- **Navigation buttons**: Start, Previous, Next, End buttons
- **Keyboard shortcuts**: Home/End for start/end of game

### ✅ Perfect Synchronization
- **Board-notation sync**: Board and annotations are always perfectly synchronized
- **No missed moves**: Every move from the PGN is shown accurately
- **Accurate algebraic notation**: All moves displayed in correct algebraic notation
- **Position accuracy**: Board position always matches the selected move

## Components

### 1. PGNParser (`src/services/PGNParser.ts`)
- Comprehensive PGN parsing with tokenization
- Handles nested variations to any depth
- Parses comments, NAGs, and headers
- Creates a complete move tree structure

### 2. MoveTreeService (`src/services/MoveTreeService.ts`)
- Manages navigation through the move tree
- Handles position calculation and state management
- Provides listeners for state changes
- Supports all navigation operations

### 3. AnnotationDisplay (`src/components/AnnotationDisplay.tsx`)
- Displays all moves with proper formatting
- Shows variations in parentheses
- Renders comments and NAG symbols
- Highlights current move
- Clickable moves for navigation

### 4. FullAnnotationChessBoard (`src/components/FullAnnotationChessBoard.tsx`)
- Main component combining board and annotations
- Keyboard event handling
- Navigation controls
- Perfect synchronization between board and notation

### 5. FullAnnotationChessBoardDemo (`src/components/FullAnnotationChessBoardDemo.tsx`)
- Demo page with sample PGNs
- Interactive controls for testing
- Feature showcase

## Usage

### Basic Usage
```tsx
import { FullAnnotationChessBoard } from './components/FullAnnotationChessBoard';

const MyComponent = () => {
  const pgn = `[Event "Sample Game"]
[Site "Test"]
[Date "2024.01.01"]
[Round "1"]
[White "Player A"]
[Black "Player B"]
[Result "*"]

1. e4 e5 2. Nf3 Nc6 3. Bc4 {Italian Game} 
(3. Bb5 {Ruy Lopez} a6 4. Ba4 Nf6) 
Be5 4. d3 *`;

  return (
    <FullAnnotationChessBoard
      pgn={pgn}
      boardWidth={400}
      orientation="white"
      onPositionChange={(fen, moveHistory) => {
        console.log('Position changed:', fen);
      }}
      onGameLoad={(game) => {
        console.log('Game loaded:', game);
      }}
    />
  );
};
```

### Advanced Usage with Custom PGN
```tsx
const [customPGN, setCustomPGN] = useState('');

return (
  <div>
    <textarea
      value={customPGN}
      onChange={(e) => setCustomPGN(e.target.value)}
      placeholder="Paste your PGN here..."
    />
    <FullAnnotationChessBoard
      pgn={customPGN}
      boardWidth={500}
      orientation="black"
    />
  </div>
);
```

## Navigation

### Keyboard Shortcuts
- **← →**: Navigate moves (previous/next)
- **↑ ↓**: Navigate variations (enter/exit)
- **Home**: Go to start of game
- **End**: Go to end of main line

### Mouse Navigation
- **Click moves**: Click any move in the notation to jump to that position
- **Click variations**: Click moves inside parentheses to explore variations
- **Navigation buttons**: Use the buttons below the board

## Testing

### Demo Page
Visit `/full-annotation-demo` to see the system in action with sample PGNs.

### Test Function
```javascript
import { testFullAnnotationSystem } from './tests/fullAnnotationTest';
testFullAnnotationSystem(); // Run comprehensive tests
```

## Architecture

### Data Flow
1. **PGN Input** → PGNParser → ParsedGame object
2. **ParsedGame** → MoveTreeService → Navigation state
3. **Navigation state** → Components → UI updates
4. **User interaction** → MoveTreeService → State changes

### State Management
- Centralized state in MoveTreeService
- Listener pattern for component updates
- Immutable state updates
- Perfect synchronization guaranteed

## Error Handling
- Invalid PGN parsing with error messages
- Graceful handling of malformed moves
- Console warnings for debugging
- User-friendly error display

## Performance
- Efficient tokenization and parsing
- Lazy evaluation of positions
- Minimal re-renders with proper memoization
- Optimized for large PGNs with many variations

## Browser Compatibility
- Modern browsers with ES2020 support
- React 18+ compatible
- TypeScript support
- Mobile-friendly responsive design

## Dependencies
- `chess.js`: Chess logic and move validation
- `react`: UI framework
- `react-chessboard`: Chess board component
- TypeScript for type safety

## Installation

1. Copy the service files to your project:
   - `src/services/PGNParser.ts`
   - `src/services/MoveTreeService.ts`

2. Copy the component files:
   - `src/components/AnnotationDisplay.tsx`
   - `src/components/FullAnnotationChessBoard.tsx`
   - `src/components/FullAnnotationChessBoardDemo.tsx`

3. Install dependencies:
   ```bash
   npm install chess.js react-chessboard
   ```

4. Add the route to your App.js:
   ```javascript
   import FullAnnotationChessBoardDemo from './components/FullAnnotationChessBoardDemo';
   // ...
   <Route path="/full-annotation-demo" element={<FullAnnotationChessBoardDemo />} />
   ```

## Examples

### Complex PGN with Deep Variations
```pgn
1. e4 e5 2. Nf3 Nc6 3. Bc4 {Italian Game} 
(3. Bb5 {Ruy Lopez} a6 4. Ba4 Nf6 5. O-O Be7 
  (5... b5 {Marshall Attack} 6. Bb3 Bb7 7. Re1 Bc5 
    (7... d6 {Alternative} 8. c3 O-O 9. h3 {Quiet continuation})
    8. c3 d6 9. d4 Bb6 {Complex position})
  6. Re1 b5 7. Bb3 O-O 8. c3 d6)
Be5 4. d3 Nf6 5. Ng5 d6 6. f4 Bxg5 7. fxg5 Nh5 *
```

This system handles this complex PGN perfectly, showing all variations and allowing seamless navigation through every line.

## Support

For issues or questions:
1. Check the demo page for examples
2. Run the test function to verify functionality
3. Check browser console for error messages
4. Ensure PGN format is valid

## License

This system is part of the chess analysis application and follows the same license terms.