# Bot Training System

This system trains chess bots to play like humans at different rating levels by learning from actual human games stored in PGN files.

## Overview

Instead of just using Stockfish with limited strength (which still plays like an engine), the bots now:
1. **Check a training database** built from human games
2. **Select moves** based on what humans actually played at that rating
3. **Fall back to Stockfish** for positions not in the database

This makes bots play much more realistically - they make human-like mistakes, follow common patterns, and feel like playing against a real person.

## How It Works

### 1. Training Database

The database stores:
- **Positions** (FEN strings)
- **Rating ranges** (e.g., "800-1200", "1200-1400")
- **Moves** played in those positions by humans
- **Frequency** of each move
- **Average rating** of players who played each move

### 2. Move Selection

When a bot needs to make a move:
1. Checks if the current position exists in the training database for that rating range
2. If found, selects a move weighted by:
   - How often humans played it
   - How close the move's average rating is to the target rating
3. Adds appropriate randomness based on rating level
4. Falls back to Stockfish if no training data exists

### 3. Rating-Based Behavior

- **800-1200**: 70% training data, 30% Stockfish (more human-like, more mistakes)
- **1200-1800**: 50% training data, 50% Stockfish (balanced)
- **1800-2400**: 30% training data, 70% Stockfish (more engine-like)
- **2400+**: 10% training data, 90% Stockfish (mostly engine, occasional human touch)

## Setup Instructions

### Step 1: Build the Training Database

Run the database builder script to process all PGN files:

```bash
cd backend
node scripts/buildBotTrainingDatabase.js
```

This will:
- Parse all PGN files in `backend/data/`
- Extract positions and moves
- Group by rating ranges
- Store in MongoDB collection `botTrainingPositions`

**Expected output:**
```
🏗️  Building Bot Training Database from PGN files...

🗑️  Clearing existing training positions...
✅ Cleared existing positions

Found 9 PGN files to process

📖 Processing 500-800.pgn (Rating: 500-800)...
   Found 50 games
   ✅ Processed 50 games, 1250 positions
...

📊 Database Statistics:
   500-800: 1250 positions, 2500 moves, 50 games
   800-1200: 2000 positions, 4000 moves, 80 games
   ...

✅ Database build complete!
   Total positions: 10000
   Total moves: 20000
   Total games processed: 500
```

### Step 2: Verify Database

Check the training stats:

```bash
# Via API (if backend is running)
curl http://localhost:8001/api/bot/training-stats

# Or via MongoDB
mongosh
use chessrep
db.botTrainingPositions.countDocuments()
db.botTrainingPositions.aggregate([
  { $group: { _id: "$ratingRange", count: { $sum: 1 } } }
])
```

### Step 3: Restart Backend

The bot route now automatically uses the training database:

```bash
pm2 restart chessrep-backend
```

## PGN File Requirements

Your PGN files should:
- Include `[WhiteElo]` and `[BlackElo]` tags (or at least one)
- Be organized by rating range (filename should indicate range)
- Contain complete games (not fragments)
- Be in standard PGN format

### Supported File Names

The script automatically detects rating ranges from filenames:
- `500-800.pgn` → Rating range: "500-800"
- `800-1200.pgn` → Rating range: "800-1200"
- `1200-1400.pgn` → Rating range: "1200-1400"
- `1600-1700.pgn` → Rating range: "1600-1700"
- `1700.pgn` → Rating range: "1700-1800"
- `1800.pgn` → Rating range: "1800-2000"
- `master_games.pgn` → Rating range: "2400-2800"
- `Kasparov.pgn` → Rating range: "2500-2800"
- `Karpov.pgn` → Rating range: "2500-2800"

## How Bots Use Training Data

### Example: 800 ELO Bot

1. Position: `rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1`
2. Bot checks training database for "800-1200" range
3. Finds that humans played:
   - `e5` (40% of the time)
   - `e6` (30% of the time)
   - `c5` (20% of the time)
   - `c6` (10% of the time)
4. Bot selects `e5` (most common) with some randomness
5. Result: Bot plays like an 800-rated human!

### Example: 2500 ELO Bot

1. Same position
2. Bot checks training database for "2500-2800" range
3. Finds that grandmasters played:
   - `e5` (60% of the time)
   - `c5` (25% of the time)
   - `e6` (10% of the time)
   - `Nf6` (5% of the time)
4. Bot selects `e5` (most common, but with less randomness)
5. Result: Bot plays like a grandmaster!

## Benefits

✅ **More realistic play** - Bots make human-like mistakes  
✅ **Better training** - Users learn from realistic opponents  
✅ **Rating accuracy** - 800 bot plays like 800-rated humans, not weak Stockfish  
✅ **Pattern recognition** - Bots follow common opening patterns  
✅ **Engaging gameplay** - Feels like playing against real people  

## Troubleshooting

### Database is empty

```bash
# Check if PGN files exist
ls -la backend/data/*.pgn

# Check if script ran successfully
node scripts/buildBotTrainingDatabase.js

# Check MongoDB connection
mongosh
use chessrep
show collections
db.botTrainingPositions.countDocuments()
```

### Bots still playing like engines

- Check if training database has data: `curl http://localhost:8001/api/bot/training-stats`
- Verify PGN files have `WhiteElo`/`BlackElo` tags
- Check backend logs for training move attempts
- Ensure MongoDB is connected

### Performance issues

- The training database is indexed for fast lookups
- If slow, check MongoDB indexes: `db.botTrainingPositions.getIndexes()`
- Consider reducing the number of positions stored

## Adding More Games

1. Add new PGN files to `backend/data/`
2. Ensure filenames indicate rating range
3. Run `node scripts/buildBotTrainingDatabase.js` again
4. The script will merge new games with existing data

## API Endpoints

### Get Training Statistics

```bash
GET /api/bot/training-stats
```

Returns:
```json
{
  "success": true,
  "stats": {
    "byRange": [
      {
        "_id": "800-1200",
        "positions": 2000,
        "totalMoves": 4000,
        "totalGames": 80
      }
    ],
    "overall": {
      "totalPositions": 10000,
      "totalMoves": 20000,
      "totalGames": 500
    }
  }
}
```

## Future Enhancements

- Machine learning models for better pattern recognition
- Position similarity matching (fuzzy matching)
- Opening book integration
- Endgame tablebase integration
- Adaptive difficulty based on user performance

