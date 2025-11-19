# Chess Training System

This training system allows the chess bot to learn from games categorized by skill level (beginner, intermediate, and master) and play accordingly.

## Overview

The system consists of several components:

1. **PGN Game Storage**: Games are stored in separate PGN files by skill level
2. **Training Routes**: API endpoints for accessing and training with games
3. **Training Service**: Core logic for analyzing games and suggesting moves
4. **Import Scripts**: Tools for importing and processing PGN data

## Files Structure

```
backend/
├── data/
│   ├── beginner_games.pgn      # Beginner level games (800-1200 rating)
│   ├── intermediate_games.pgn  # Intermediate level games (1200-1800 rating)
│   └── master_games.pgn        # Master level games (2000+ rating)
├── routes/
│   └── training.js             # API routes for training system
├── services/
│   └── trainingService.js      # Core training logic and analysis
├── scripts/
│   └── importTrainingGames.js  # Script to import PGN games
└── TRAINING_SYSTEM_README.md   # This documentation
```

## API Endpoints

### Get Available Skill Levels
```
GET /api/training/levels
```
Returns available skill levels and their descriptions.

### Get Games for a Skill Level
```
GET /api/training/:level/games
```
Returns all games for the specified skill level (beginner, intermediate, or master).

### Get Specific Game
```
GET /api/training/:level/games/:gameIndex
```
Returns a specific game with its moves and metadata.

### Training Session
```
POST /api/training/:level/games/:gameIndex/train
```
Body: `{ moveHistory: [], userMove: "e4", position: "fen_string" }`
Returns feedback on the user's move and the correct move.

### Get Statistics
```
GET /api/training/:level/stats
```
Returns statistics about games for the specified level.

## Training Service Features

### Move Suggestion by Skill Level

The system suggests moves differently based on skill level:

- **Beginner**: Prefers simple, safe moves, captures, and checks
- **Intermediate**: Looks for tactical opportunities and combinations
- **Master**: Considers deep strategic and positional factors

### Pattern Analysis

The system analyzes games to extract:
- Common openings
- Move patterns
- Tactical patterns
- Positional patterns
- Average game length
- Common mistakes

### Training Recommendations

Provides personalized recommendations based on skill level:
- Opening study suggestions
- Tactical training focus
- Strategic planning exercises

## Usage Examples

### Importing New Games

```javascript
const { importTrainingGames, addMoreGames } = require('./scripts/importTrainingGames');

// Import initial games
await importTrainingGames();

// Add more games to a specific level
await addMoreGames('master', additionalPGNContent);
```

### Using the Training Service

```javascript
const trainingService = require('./services/trainingService');

// Get move suggestion for a position
const suggestion = trainingService.suggestMove(position, 'intermediate');

// Get training recommendations
const recommendations = trainingService.getTrainingRecommendations('beginner');

// Get patterns for analysis
const patterns = trainingService.getPatterns('master');
```

### API Usage

```javascript
// Get available levels
const levels = await fetch('/api/training/levels');

// Get games for beginner level
const games = await fetch('/api/training/beginner/games');

// Start training session
const response = await fetch('/api/training/beginner/games/0/train', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    moveHistory: ['e4', 'e5'],
    userMove: 'Nf3',
    position: 'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2'
  })
});
```

## Current Training Data

The system currently contains:

- **Master Games**: 1 game (Kasparov vs Short)
- **Intermediate Games**: 1 game (1500-rated players)
- **Beginner Games**: 1 game (800-850 rated players)

## Adding More Games

To add more games to the training system:

1. **Prepare PGN Data**: Ensure your PGN files are properly formatted
2. **Categorize by Skill Level**: Separate games by player ratings
3. **Use Import Script**: Run the import script to process and store games
4. **Verify Import**: Check that games are properly parsed and stored

### Example PGN Format

```
[Event "Tournament Name"]
[Site "Location"]
[Date "YYYY.MM.DD"]
[Round "1"]
[White "Player Name"]
[Black "Opponent Name"]
[Result "1-0"]
[ECO "B01"]
[WhiteElo "1500"]
[BlackElo "1480"]

1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. O-O Nf6 5. d3 d6 1-0
```

## Testing

Run the test script to verify the system is working:

```bash
node test-training-system.js
```

This will test:
- Move suggestions for different skill levels
- Pattern analysis
- Training recommendations
- Position evaluation

## Future Enhancements

1. **Stockfish Integration**: Use Stockfish for more accurate move evaluation
2. **Machine Learning**: Implement ML models for better pattern recognition
3. **More Games**: Expand the training dataset with more games
4. **Advanced Analysis**: Add deeper tactical and positional analysis
5. **User Progress Tracking**: Track user improvement over time
6. **Adaptive Difficulty**: Adjust difficulty based on user performance

## Dependencies

- `chess.js`: Chess game logic and move validation
- `pgn-parser`: PGN file parsing
- `express`: Web framework for API routes
- `fs`: File system operations for PGN storage

## Notes

- The system automatically loads and analyzes games on startup
- Games are validated for proper PGN format before processing
- Move suggestions are based on patterns learned from the training data
- The system can handle multiple games per skill level
- All API endpoints include proper error handling
