# Lichess Opening Tree Implementation

This implementation provides a comprehensive opening tree component that integrates with Lichess's Opening Explorer API, supporting both player and master databases.

## Features

- **Multiple Databases**: Access to Lichess database, Masters database, and Player-specific database
- **Real-time Data**: Fetches live data from Lichess's extensive game database
- **Interactive Interface**: Click moves to play them in your chess application
- **Advanced Filtering**: Filter by rating range, time control, and date ranges
- **Game Examples**: View top games and recent games for each position
- **Responsive Design**: Works on desktop and mobile devices
- **Caching**: Intelligent caching to reduce API calls

## Components

### 1. LichessOpeningService (`services/LichessOpeningService.ts`)

The core service that handles API communication with Lichess.

```typescript
import { lichessOpeningService, LichessOpeningOptions } from '../services/LichessOpeningService';

// Get opening moves for a position
const options: LichessOpeningOptions = {
  database: 'lichess', // 'lichess' | 'masters' | 'player'
  topGames: 4,
  recentGames: 4,
  moves: 12,
  ratings: '2000,2200', // Optional rating range
  speeds: 'blitz,rapid', // Optional time controls
  player: 'username' // Required for player database
};

const moves = await lichessOpeningService.getOpeningMoves(fen, options);
```

### 2. LichessOpeningTree (`components/LichessOpeningTree.tsx`)

The main opening tree component.

```typescript
import LichessOpeningTree from './LichessOpeningTree';

<LichessOpeningTree
  currentFEN={currentFEN}
  onMoveClick={(from, to, promotion) => {
    // Handle move in your chess application
    playMove(from, to, promotion);
  }}
  defaultDatabase="lichess"
  playerName="username" // Optional, for player database
/>
```

### 3. LichessOpeningTreePage (`components/LichessOpeningTreePage.tsx`)

A complete demo page showing all features.

### 4. LichessOpeningTreeIntegration (`components/LichessOpeningTreeIntegration.tsx`)

An integration example showing how to use the component with chess state management.

## API Endpoints

The service uses the following Lichess API endpoints:

- **Lichess Database**: `https://explorer.lichess.ovh/lichess?fen={FEN}`
- **Masters Database**: `https://explorer.lichess.ovh/master?fen={FEN}`
- **Player Database**: `https://explorer.lichess.ovh/player/{username}?fen={FEN}`

## Usage Examples

### Basic Usage

```typescript
import React, { useState } from 'react';
import { Chess } from 'chess.js';
import LichessOpeningTree from './LichessOpeningTree';

function MyChessApp() {
  const [game, setGame] = useState(new Chess());
  const [currentFEN, setCurrentFEN] = useState(game.fen());

  const handleMoveClick = (from: string, to: string, promotion?: string) => {
    const move = game.move({ from, to, promotion: promotion || 'q' });
    if (move) {
      setCurrentFEN(game.fen());
    }
  };

  return (
    <div>
      <LichessOpeningTree
        currentFEN={currentFEN}
        onMoveClick={handleMoveClick}
      />
    </div>
  );
}
```

### With Database Selection

```typescript
const [database, setDatabase] = useState<'lichess' | 'masters' | 'player'>('lichess');
const [playerName, setPlayerName] = useState('');

<LichessOpeningTree
  currentFEN={currentFEN}
  onMoveClick={handleMoveClick}
  defaultDatabase={database}
  playerName={playerName}
/>
```

### With Custom Styling

```typescript
<LichessOpeningTree
  currentFEN={currentFEN}
  onMoveClick={handleMoveClick}
  className="my-custom-opening-tree"
/>
```

## Styling

The component comes with built-in CSS styles in `styles/lichess-opening-tree.css`. You can customize the appearance by:

1. Overriding CSS classes
2. Using CSS custom properties
3. Modifying the source CSS file

### Key CSS Classes

- `.lichess-opening-tree` - Main container
- `.opening-move` - Individual move items
- `.move-san` - Move notation
- `.win-rates` - Win/draw/loss statistics
- `.popularity-bar` - Visual popularity indicator

## Error Handling

The component includes comprehensive error handling:

- Network errors are caught and displayed to the user
- Invalid FEN positions are handled gracefully
- API rate limits are respected with caching
- Fallback states for when no data is available

## Caching

The service implements intelligent caching:

- 5-minute cache timeout for API responses
- Cache key based on FEN and options
- Automatic cache invalidation
- Cache statistics available via `getCacheStats()`

## Performance Considerations

- API calls are debounced to prevent excessive requests
- Caching reduces redundant API calls
- Lazy loading of game examples
- Responsive design for mobile devices

## Browser Support

- Modern browsers with ES6+ support
- Fetch API support required
- CSS Grid and Flexbox support recommended

## Dependencies

- React 16.8+ (hooks support required)
- chess.js for chess logic (if integrating with chess board)
- No external dependencies for the core component

## Troubleshooting

### Common Issues

1. **CORS Errors**: The Lichess API should work from any domain, but if you encounter CORS issues, check your browser's developer tools.

2. **Rate Limiting**: The service includes caching to minimize API calls. If you still hit rate limits, consider increasing the cache timeout.

3. **No Data**: Some positions may not have data in certain databases. Try switching between databases or check if the position is valid.

4. **Player Not Found**: When using the player database, ensure the username is correct and the player has public games.

### Debug Mode

Enable debug logging by setting:

```typescript
// In your component
console.log('Opening tree debug info:', {
  currentFEN,
  database,
  playerName,
  moves: openingMoves
});
```

## Contributing

When extending this implementation:

1. Follow the existing TypeScript patterns
2. Add proper error handling
3. Include responsive design considerations
4. Update this documentation
5. Test with different positions and databases

## License

This implementation is provided as-is for educational and development purposes. Please respect Lichess's API terms of service when using their data.
