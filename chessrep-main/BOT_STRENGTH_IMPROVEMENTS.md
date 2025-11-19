# Bot Strength Improvements for Resourcefulness Training

## Problem
The bot in `/resourcefulness?difficulty=intermediate` keeps blundering despite being set to 2600 ELO.

## Solutions Implemented

### 1. **Significantly Increased Stockfish Strength** ✅

**Changes Made:**
- **Increased thinking time:**
  - 2600+ ELO: 5 seconds per move (was 2 seconds)
  - 2400+ ELO: 3 seconds per move (was 1.5 seconds)
  - 2000+ ELO: 1.5 seconds per move (was 1.2 seconds)

- **Added depth search:**
  - 2600+ ELO: Depth 20 (very deep analysis)
  - 2400+ ELO: Depth 18
  - 2000+ ELO: Depth 14
  - Uses BOTH depth AND time for maximum strength

- **Enabled full Stockfish strength for 2000+ ELO:**
  - `UCI_LimitStrength = false` (no artificial weakening)
  - `Skill Level = 20` (maximum skill)
  - `Hash = 256MB` (more memory for better analysis)
  - `Threads = 2` (faster analysis)

- **Added personality-based contempt:**
  - Aggressive: +50 contempt (plays for win)
  - Defensive: -50 contempt (accepts draws)

### 2. **Improved Timeout Handling**
- Increased timeout to 10+ seconds for strong play
- Multiple retry attempts for 2000+ ELO if Stockfish fails

### 3. **Better Logging**
- Console logs show exact Stockfish configuration
- Shows when full strength is being used
- Displays depth and time parameters

---

## How to Add Training Games (Optional Enhancement)

If you want the bot to learn from real games at different levels, here's how:

### Step 1: Collect Games

**Get games from Chess.com or Lichess:**

```bash
# Example: Download games from a specific rating range
# Chess.com API
https://api.chess.com/pub/player/{username}/games/archives

# Lichess API
https://lichess.org/api/games/user/{username}?rated=true&perfType=rapid&max=100
```

### Step 2: Organize by Rating

Create files in `backend/data/`:
- `beginner_games.pgn` (800-1200)
- `intermediate_games.pgn` (1200-1600)
- `advanced_games.pgn` (1600-2000)
- `expert_games.pgn` (2000-2400)
- `master_games.pgn` (2400+)

### Step 3: Add Games to Training Data

Edit `backend/data/trainingGames.js`:

```javascript
const trainingGames = {
  intermediate: {
    ratingRange: [1200, 1600],
    games: [
      {
        pgn: `[Event "Rated Rapid game"]
[Site "https://lichess.org/abc123"]
[White "Player1"]
[Black "Player2"]
[Result "1-0"]
[WhiteElo "1450"]
[BlackElo "1430"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7...`,
        rating: 1450,
        result: "1-0"
      },
      // Add more games...
    ]
  },
  // ... other levels
};
```

### Step 4: Implement Opening Book (Advanced)

Create `backend/services/openingBook.js`:

```javascript
const { Chess } = require('chess.js');
const trainingGames = require('../data/trainingGames');

class OpeningBook {
  constructor() {
    this.positions = new Map(); // FEN -> [moves with frequencies]
  }

  // Build opening book from training games
  buildFromGames(games) {
    for (const game of games) {
      const chess = new Chess();
      const moves = game.pgn.split(/\d+\./).filter(m => m.trim());
      
      for (let i = 0; i < Math.min(moves.length, 15); i++) {
        const fen = chess.fen();
        const move = moves[i].trim().split(' ')[0];
        
        if (!this.positions.has(fen)) {
          this.positions.set(fen, new Map());
        }
        
        const moveMap = this.positions.get(fen);
        moveMap.set(move, (moveMap.get(move) || 0) + 1);
        
        try {
          chess.move(move);
        } catch (e) {
          break;
        }
      }
    }
  }

  // Get a move from the opening book
  getMove(fen) {
    const moveMap = this.positions.get(fen);
    if (!moveMap || moveMap.size === 0) return null;
    
    // Weight moves by frequency
    const moves = Array.from(moveMap.entries());
    const totalWeight = moves.reduce((sum, [, freq]) => sum + freq, 0);
    let random = Math.random() * totalWeight;
    
    for (const [move, freq] of moves) {
      random -= freq;
      if (random <= 0) return move;
    }
    
    return moves[0][0];
  }
}

module.exports = new OpeningBook();
```

---

## Current Configuration

**Resourcefulness Page Bot Settings:**
- **Difficulty:** 2600 ELO (maximum)
- **Personality:** Tactical
- **Time Control:** Classical
- **Thinking Time:** 5 seconds per move
- **Search Depth:** 20 plies
- **Skill Level:** 20 (maximum)
- **Strength Limit:** Disabled (full Stockfish)

---

## Testing the Improvements

### 1. **Restart Backend Server**
```bash
cd backend
npm start
```

### 2. **Test Resourcefulness**
1. Go to `http://localhost:3000/resourcefulness?difficulty=intermediate`
2. Start a game
3. Watch the console logs to see Stockfish configuration
4. Bot should now play MUCH stronger

### 3. **Check Logs**
Look for these messages in backend console:
```
[Stockfish] Using FULL STRENGTH for Elo 2600
[Stockfish bot]: info depth 20 ...
[Stockfish bot]: bestmove e2e4
```

---

## Expected Behavior After Fix

**Before:**
- Bot hangs pieces frequently
- Makes obvious blunders
- Doesn't calculate tactics
- Weak positional play

**After:**
- Bot calculates 5 seconds per move
- Searches 20 moves deep
- Finds tactical combinations
- Strong positional understanding
- Rarely blunders
- Challenging even for strong players

---

## Alternative: Use Lichess Cloud Engine

If Stockfish still has issues, you can use Lichess cloud engine:

```javascript
// In bot.js
async function getLichessMove(fen, depth = 20) {
  const response = await fetch('https://lichess.org/api/cloud-eval', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    },
    params: {
      fen: fen,
      multiPv: 1
    }
  });
  
  const data = await response.json();
  return data.pvs[0].moves.split(' ')[0]; // First move in UCI
}
```

---

## Summary

The bot is now configured to play at **2600+ ELO strength** with:
- ✅ 5 seconds thinking time
- ✅ 20 ply search depth
- ✅ Full Stockfish strength (no limiting)
- ✅ Maximum skill level
- ✅ 256MB hash table
- ✅ 2 CPU threads

**This should eliminate blunders and provide a strong challenge!**

If you still see blunders after restarting the backend, please:
1. Check backend console logs
2. Verify Stockfish is running
3. Share a specific game where the bot blundered
4. Consider adding training games for pattern recognition











