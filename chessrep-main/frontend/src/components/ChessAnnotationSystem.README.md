# ChessAnnotationSystem Component

A comprehensive, well-commented move tree component for chess analysis that integrates with the existing EnhancedAnalysisBoard.

## Overview

The `ChessAnnotationSystem` component provides a vertical move tree display that shows:
- Main line moves with proper chess notation formatting
- Variations and sub-variations with hierarchical indentation
- Move selection and highlighting with visual feedback
- Integration with chess board position synchronization
- Support for annotations, comments, and move symbols
- Keyboard navigation support
- Responsive design with modern styling

## Features

### 🎯 Core Functionality
- **Hierarchical Move Display**: Shows main line moves, variations, and sub-variations
- **Interactive Navigation**: Click moves to navigate through the game
- **Visual Feedback**: Selected and current moves are highlighted
- **Board Synchronization**: Moves sync with the chess board position
- **Annotation Support**: Displays move symbols (!, ?, !!, ??, etc.) and comments

### ⌨️ Keyboard Navigation
- **Arrow Up/Down**: Navigate to previous/next move
- **Home**: Go to first move
- **End**: Go to last move
- **Space**: Next move (inherited from parent component)

### 🎨 Visual Design
- **Modern Styling**: Gradient backgrounds, smooth transitions, hover effects
- **Responsive Design**: Adapts to different screen sizes
- **Dark Mode Support**: Automatic dark mode detection
- **Accessibility**: Focus states and keyboard navigation
- **Smooth Animations**: Expand/collapse variations with slide animations

## Usage

```tsx
import ChessAnnotationSystem from './ChessAnnotationSystem';

<ChessAnnotationSystem
  moveTree={moveTree}
  currentMoveIndex={currentMoveIndex}
  onMoveSelect={(moveIndex, moveNode) => {
    // Handle move selection
    setCurrentMoveIndex(moveIndex);
    updateGameStates();
  }}
  onVariationSelect={(parentMoveIndex, variationIndex) => {
    // Handle variation selection
    console.log('Variation selected:', parentMoveIndex, variationIndex);
  }}
  onAnnotationClick={(annotation) => {
    // Handle annotation click
    console.log('Annotation clicked:', annotation);
  }}
  maxHeight="400px"
  className="custom-move-tree"
/>
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `moveTree` | `MoveNode[]` | ✅ | Array of move nodes representing the game tree |
| `currentMoveIndex` | `number` | ✅ | Current move index in the main line |
| `onMoveSelect` | `(moveIndex: number, moveNode: MoveNode) => void` | ❌ | Callback when a move is selected |
| `onVariationSelect` | `(parentMoveIndex: number, variationIndex: number) => void` | ❌ | Callback when a variation is selected |
| `onAnnotationClick` | `(annotation: Annotation) => void` | ❌ | Callback when an annotation is clicked |
| `className` | `string` | ❌ | Additional CSS classes |
| `maxHeight` | `string` | ❌ | Maximum height for the scrollable container (default: "500px") |

## Data Structure

### MoveNode Interface
```typescript
interface MoveNode {
  id: string;
  move: Move;
  moveNumber: number;
  isWhite: boolean;
  moveIndex: number;
  annotations: Annotation[];
  sublines: MoveNode[];
  parentId?: string;
  isMainLine: boolean;
  evaluation?: Evaluation;
  accuracy?: number;
  classification?: 'brilliant' | 'great' | 'good' | 'inaccuracy' | 'mistake' | 'blunder';
}
```

### Annotation Interface
```typescript
interface Annotation {
  id: string;
  moveId: string;
  type: 'comment' | 'symbol' | 'arrow' | 'circle' | 'highlight';
  content?: string;
  symbol?: '!' | '?' | '!!' | '??' | '!?' | '?!';
  from?: string;
  to?: string;
  square?: string;
  color?: string;
  createdAt: Date;
}
```

## Styling

The component includes comprehensive CSS styling with:
- **Modern Design**: Gradient backgrounds, rounded corners, subtle shadows
- **Interactive States**: Hover effects, selection highlighting, smooth transitions
- **Responsive Layout**: Adapts to different screen sizes
- **Dark Mode**: Automatic dark mode detection and styling
- **Accessibility**: Focus states and keyboard navigation support

### CSS Classes
- `.chess-annotation-system` - Main container
- `.move-item` - Individual move items
- `.move-item.selected` - Selected move styling
- `.move-item.current` - Current move styling
- `.variation-header` - Variation section headers
- `.sub-variation-header` - Sub-variation section headers
- `.annotation-symbol` - Move annotation symbols

## Integration with EnhancedAnalysisBoard

The component is designed to work seamlessly with the existing `EnhancedAnalysisBoard`:

1. **Data Flow**: Receives `moveTree` and `currentMoveIndex` from the parent
2. **Event Handling**: Calls back to parent for move selection and navigation
3. **State Synchronization**: Updates are reflected in the chess board
4. **Styling Consistency**: Matches the existing design system

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `↑` | Previous move |
| `↓` | Next move |
| `Home` | First move |
| `End` | Last move |
| `Space` | Next move (inherited from parent) |

## Browser Support

- Modern browsers with ES6+ support
- CSS Grid and Flexbox support
- CSS Custom Properties (CSS Variables) support

## Performance Considerations

- **Memoized Callbacks**: Uses `useCallback` for performance optimization
- **Efficient Rendering**: Only re-renders when necessary
- **Lazy Loading**: Variations are expanded/collapsed on demand
- **Memory Management**: Proper cleanup of event listeners

## Accessibility Features

- **Keyboard Navigation**: Full keyboard support for all interactions
- **Focus Management**: Clear focus indicators
- **Screen Reader Support**: Proper ARIA labels and semantic HTML
- **High Contrast**: Support for high contrast mode
- **Reduced Motion**: Respects user's motion preferences

## Examples

### Basic Usage
```tsx
<ChessAnnotationSystem
  moveTree={gameMoveTree}
  currentMoveIndex={currentMove}
  onMoveSelect={handleMoveSelect}
/>
```

### With Custom Styling
```tsx
<ChessAnnotationSystem
  moveTree={gameMoveTree}
  currentMoveIndex={currentMove}
  onMoveSelect={handleMoveSelect}
  maxHeight="600px"
  className="custom-chess-annotation"
/>
```

### With All Callbacks
```tsx
<ChessAnnotationSystem
  moveTree={gameMoveTree}
  currentMoveIndex={currentMove}
  onMoveSelect={handleMoveSelect}
  onVariationSelect={handleVariationSelect}
  onAnnotationClick={handleAnnotationClick}
  maxHeight="500px"
/>
```

## Troubleshooting

### Common Issues

1. **Moves not displaying**: Check that `moveTree` is properly formatted
2. **Navigation not working**: Ensure `onMoveSelect` callback is provided
3. **Styling issues**: Verify CSS file is imported correctly
4. **Keyboard navigation**: Check that no other elements are capturing keyboard events

### Debug Tips

- Use browser dev tools to inspect the component state
- Check console for any error messages
- Verify data structure matches expected interfaces
- Test keyboard navigation in different browsers

## Future Enhancements

- [ ] Drag and drop move reordering
- [ ] Move search and filtering
- [ ] Export to PGN functionality
- [ ] Move comments editing
- [ ] Variation merging
- [ ] Move statistics display
- [ ] Engine evaluation integration
- [ ] Move comparison tools
