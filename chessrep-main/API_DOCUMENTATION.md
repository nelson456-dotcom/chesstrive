# Chess Analysis Board API Documentation

## Overview

This document describes the REST API endpoints for the Chess Analysis Board application. The API provides endpoints for chess engine analysis, opening exploration, tablebase queries, and game management.

## Base URL

```
http://localhost:3001/api
```

## Authentication

Currently, the API does not require authentication. In production, you would implement JWT-based authentication.

## Endpoints

### Analysis Endpoints

#### POST /analysis/position

Analyze a chess position using the Stockfish engine.

**Request Body:**
```json
{
  "fen": "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
  "depth": 15,
  "multiPV": 3,
  "timeLimit": 5000
}
```

**Response:**
```json
{
  "success": true,
  "bestMove": "e2e4",
  "evaluation": 0.2,
  "moves": [
    {
      "move": "e2e4",
      "depth": 15,
      "nodes": 1234567,
      "time": 2345,
      "evaluation": 0.2
    }
  ],
  "depth": 15,
  "multiPV": 3
}
```

#### POST /analysis/cloud

Perform cloud-based analysis for deeper evaluation.

**Request Body:**
```json
{
  "fen": "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
  "depth": 20,
  "multiPV": 3,
  "timeLimit": 10000
}
```

**Response:**
```json
{
  "success": true,
  "bestMove": "e2e4",
  "evaluation": 0.2,
  "moves": [...],
  "source": "cloud"
}
```

#### GET /analysis/status

Get the current status of the analysis engine.

**Response:**
```json
{
  "ready": true,
  "processId": 12345
}
```

#### POST /analysis/stop

Stop the current analysis.

**Response:**
```json
{
  "success": true
}
```

#### POST /analysis/quit

Quit the analysis engine.

**Response:**
```json
{
  "success": true
}
```

### Opening Explorer Endpoints

#### GET /opening/moves

Get opening moves for a specific position.

**Query Parameters:**
- `fen` (required): FEN string of the position
- `limit` (optional): Maximum number of moves to return (default: 10)
- `minGames` (optional): Minimum number of games for a move to be included (default: 10)

**Response:**
```json
{
  "success": true,
  "moves": [
    {
      "fen": "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
      "move": "e2e4",
      "san": "e4",
      "uci": "e2e4",
      "white": 1500,
      "draws": 500,
      "black": 1000,
      "total": 3000,
      "averageRating": 1800,
      "eco": "B20",
      "name": "Sicilian Defense",
      "winRate": {
        "white": "50.0",
        "black": "33.3",
        "draws": "16.7"
      }
    }
  ],
  "total": 1
}
```

#### GET /opening/stats

Get opening statistics for a position.

**Query Parameters:**
- `fen` (required): FEN string of the position

**Response:**
```json
{
  "success": true,
  "stats": {
    "totalGames": 50000,
    "totalMoves": 15,
    "averageRating": 1800,
    "mostPopular": 25000
  }
}
```

#### GET /opening/eco

Get ECO codes for a position.

**Query Parameters:**
- `fen` (required): FEN string of the position

**Response:**
```json
{
  "success": true,
  "ecoCodes": [
    {
      "eco": "B20",
      "name": "Sicilian Defense",
      "total": 25000
    }
  ]
}
```

#### GET /opening/search

Search openings by name.

**Query Parameters:**
- `q` (required): Search query
- `limit` (optional): Maximum number of results (default: 20)

**Response:**
```json
{
  "success": true,
  "openings": [
    {
      "name": "Sicilian Defense",
      "eco": "B20",
      "total": 25000,
      "averageRating": 1800
    }
  ]
}
```

#### GET /opening/popular

Get popular openings.

**Query Parameters:**
- `limit` (optional): Maximum number of results (default: 20)
- `minGames` (optional): Minimum number of games (default: 100)

**Response:**
```json
{
  "success": true,
  "openings": [
    {
      "_id": "B20",
      "name": "Sicilian Defense",
      "totalGames": 25000,
      "averageRating": 1800
    }
  ]
}
```

#### POST /opening/import

Import opening data (admin only).

**Request Body:**
```json
{
  "moves": [
    {
      "fen": "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
      "move": "e2e4",
      "san": "e4",
      "uci": "e2e4",
      "white": 1500,
      "draws": 500,
      "black": 1000,
      "total": 3000,
      "averageRating": 1800,
      "eco": "B20",
      "name": "Sicilian Defense"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "imported": 1
}
```

### Tablebase Endpoints

#### POST /tablebase/query

Query the Syzygy tablebase for a position.

**Request Body:**
```json
{
  "fen": "8/8/8/8/8/8/8/K7 w - - 0 1"
}
```

**Response:**
```json
{
  "success": true,
  "result": {
    "category": "win",
    "wdl": 1,
    "dtz": 10,
    "dtm": 15,
    "moves": [
      {
        "uci": "a1a2",
        "san": "Ka2",
        "wdl": 1,
        "dtz": 9,
        "dtm": 14
      }
    ]
  }
}
```

#### GET /tablebase/status

Get tablebase status.

**Response:**
```json
{
  "ready": true,
  "processId": 12345
}
```

#### POST /tablebase/check

Check if a position is in the tablebase.

**Request Body:**
```json
{
  "fen": "8/8/8/8/8/8/8/K7 w - - 0 1"
}
```

**Response:**
```json
{
  "success": true,
  "inTablebase": true,
  "pieceCount": 1
}
```

#### GET /tablebase/stats

Get tablebase statistics.

**Response:**
```json
{
  "success": true,
  "stats": {
    "totalPositions": 1000000,
    "maxPieces": 7,
    "supportedEndgames": [
      "KQ vs K",
      "KR vs K",
      "KB vs K",
      "KN vs K"
    ]
  }
}
```

### Game Management Endpoints

#### GET /games

Get user's games.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Games per page (default: 20)
- `sort` (optional): Sort field (default: 'createdAt')
- `order` (optional): Sort order ('asc' or 'desc', default: 'desc')

**Response:**
```json
{
  "success": true,
  "games": [
    {
      "id": "game_123",
      "title": "My Game",
      "pgn": "1. e4 e5 2. Nf3 Nc6",
      "createdAt": "2023-01-01T00:00:00Z",
      "updatedAt": "2023-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5
  }
}
```

#### POST /games

Create a new game.

**Request Body:**
```json
{
  "title": "My Game",
  "pgn": "1. e4 e5 2. Nf3 Nc6",
  "tags": ["opening", "tactics"]
}
```

**Response:**
```json
{
  "success": true,
  "game": {
    "id": "game_123",
    "title": "My Game",
    "pgn": "1. e4 e5 2. Nf3 Nc6",
    "createdAt": "2023-01-01T00:00:00Z",
    "updatedAt": "2023-01-01T00:00:00Z"
  }
}
```

#### GET /games/:id

Get a specific game.

**Response:**
```json
{
  "success": true,
  "game": {
    "id": "game_123",
    "title": "My Game",
    "pgn": "1. e4 e5 2. Nf3 Nc6",
    "createdAt": "2023-01-01T00:00:00Z",
    "updatedAt": "2023-01-01T00:00:00Z"
  }
}
```

#### PUT /games/:id

Update a game.

**Request Body:**
```json
{
  "title": "Updated Game",
  "pgn": "1. e4 e5 2. Nf3 Nc6 3. Bb5",
  "tags": ["opening", "tactics", "middlegame"]
}
```

**Response:**
```json
{
  "success": true,
  "game": {
    "id": "game_123",
    "title": "Updated Game",
    "pgn": "1. e4 e5 2. Nf3 Nc6 3. Bb5",
    "createdAt": "2023-01-01T00:00:00Z",
    "updatedAt": "2023-01-01T00:00:00Z"
  }
}
```

#### DELETE /games/:id

Delete a game.

**Response:**
```json
{
  "success": true
}
```

## Error Responses

All endpoints may return error responses in the following format:

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

Common HTTP status codes:
- `400 Bad Request`: Invalid request parameters
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

## Rate Limiting

API requests are rate limited to prevent abuse:
- Analysis endpoints: 10 requests per minute
- Opening endpoints: 100 requests per minute
- Tablebase endpoints: 20 requests per minute
- Game management: 50 requests per minute

## WebSocket Support

Real-time analysis updates are available via WebSocket:

```javascript
const ws = new WebSocket('ws://localhost:3001/ws');
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  // Handle real-time updates
};
```

## Examples

### Analyze a Position

```javascript
const response = await fetch('/api/analysis/position', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    depth: 15,
    multiPV: 3
  })
});

const data = await response.json();
console.log('Best move:', data.bestMove);
```

### Get Opening Moves

```javascript
const response = await fetch('/api/opening/moves?fen=rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1&limit=5');
const data = await response.json();
console.log('Opening moves:', data.moves);
```

### Query Tablebase

```javascript
const response = await fetch('/api/tablebase/query', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    fen: '8/8/8/8/8/8/8/K7 w - - 0 1'
  })
});

const data = await response.json();
console.log('Tablebase result:', data.result);
```

## Overview

This document describes the REST API endpoints for the Chess Analysis Board application. The API provides endpoints for chess engine analysis, opening exploration, tablebase queries, and game management.

## Base URL

```
http://localhost:3001/api
```

## Authentication

Currently, the API does not require authentication. In production, you would implement JWT-based authentication.

## Endpoints

### Analysis Endpoints

#### POST /analysis/position

Analyze a chess position using the Stockfish engine.

**Request Body:**
```json
{
  "fen": "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
  "depth": 15,
  "multiPV": 3,
  "timeLimit": 5000
}
```

**Response:**
```json
{
  "success": true,
  "bestMove": "e2e4",
  "evaluation": 0.2,
  "moves": [
    {
      "move": "e2e4",
      "depth": 15,
      "nodes": 1234567,
      "time": 2345,
      "evaluation": 0.2
    }
  ],
  "depth": 15,
  "multiPV": 3
}
```

#### POST /analysis/cloud

Perform cloud-based analysis for deeper evaluation.

**Request Body:**
```json
{
  "fen": "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
  "depth": 20,
  "multiPV": 3,
  "timeLimit": 10000
}
```

**Response:**
```json
{
  "success": true,
  "bestMove": "e2e4",
  "evaluation": 0.2,
  "moves": [...],
  "source": "cloud"
}
```

#### GET /analysis/status

Get the current status of the analysis engine.

**Response:**
```json
{
  "ready": true,
  "processId": 12345
}
```

#### POST /analysis/stop

Stop the current analysis.

**Response:**
```json
{
  "success": true
}
```

#### POST /analysis/quit

Quit the analysis engine.

**Response:**
```json
{
  "success": true
}
```

### Opening Explorer Endpoints

#### GET /opening/moves

Get opening moves for a specific position.

**Query Parameters:**
- `fen` (required): FEN string of the position
- `limit` (optional): Maximum number of moves to return (default: 10)
- `minGames` (optional): Minimum number of games for a move to be included (default: 10)

**Response:**
```json
{
  "success": true,
  "moves": [
    {
      "fen": "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
      "move": "e2e4",
      "san": "e4",
      "uci": "e2e4",
      "white": 1500,
      "draws": 500,
      "black": 1000,
      "total": 3000,
      "averageRating": 1800,
      "eco": "B20",
      "name": "Sicilian Defense",
      "winRate": {
        "white": "50.0",
        "black": "33.3",
        "draws": "16.7"
      }
    }
  ],
  "total": 1
}
```

#### GET /opening/stats

Get opening statistics for a position.

**Query Parameters:**
- `fen` (required): FEN string of the position

**Response:**
```json
{
  "success": true,
  "stats": {
    "totalGames": 50000,
    "totalMoves": 15,
    "averageRating": 1800,
    "mostPopular": 25000
  }
}
```

#### GET /opening/eco

Get ECO codes for a position.

**Query Parameters:**
- `fen` (required): FEN string of the position

**Response:**
```json
{
  "success": true,
  "ecoCodes": [
    {
      "eco": "B20",
      "name": "Sicilian Defense",
      "total": 25000
    }
  ]
}
```

#### GET /opening/search

Search openings by name.

**Query Parameters:**
- `q` (required): Search query
- `limit` (optional): Maximum number of results (default: 20)

**Response:**
```json
{
  "success": true,
  "openings": [
    {
      "name": "Sicilian Defense",
      "eco": "B20",
      "total": 25000,
      "averageRating": 1800
    }
  ]
}
```

#### GET /opening/popular

Get popular openings.

**Query Parameters:**
- `limit` (optional): Maximum number of results (default: 20)
- `minGames` (optional): Minimum number of games (default: 100)

**Response:**
```json
{
  "success": true,
  "openings": [
    {
      "_id": "B20",
      "name": "Sicilian Defense",
      "totalGames": 25000,
      "averageRating": 1800
    }
  ]
}
```

#### POST /opening/import

Import opening data (admin only).

**Request Body:**
```json
{
  "moves": [
    {
      "fen": "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
      "move": "e2e4",
      "san": "e4",
      "uci": "e2e4",
      "white": 1500,
      "draws": 500,
      "black": 1000,
      "total": 3000,
      "averageRating": 1800,
      "eco": "B20",
      "name": "Sicilian Defense"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "imported": 1
}
```

### Tablebase Endpoints

#### POST /tablebase/query

Query the Syzygy tablebase for a position.

**Request Body:**
```json
{
  "fen": "8/8/8/8/8/8/8/K7 w - - 0 1"
}
```

**Response:**
```json
{
  "success": true,
  "result": {
    "category": "win",
    "wdl": 1,
    "dtz": 10,
    "dtm": 15,
    "moves": [
      {
        "uci": "a1a2",
        "san": "Ka2",
        "wdl": 1,
        "dtz": 9,
        "dtm": 14
      }
    ]
  }
}
```

#### GET /tablebase/status

Get tablebase status.

**Response:**
```json
{
  "ready": true,
  "processId": 12345
}
```

#### POST /tablebase/check

Check if a position is in the tablebase.

**Request Body:**
```json
{
  "fen": "8/8/8/8/8/8/8/K7 w - - 0 1"
}
```

**Response:**
```json
{
  "success": true,
  "inTablebase": true,
  "pieceCount": 1
}
```

#### GET /tablebase/stats

Get tablebase statistics.

**Response:**
```json
{
  "success": true,
  "stats": {
    "totalPositions": 1000000,
    "maxPieces": 7,
    "supportedEndgames": [
      "KQ vs K",
      "KR vs K",
      "KB vs K",
      "KN vs K"
    ]
  }
}
```

### Game Management Endpoints

#### GET /games

Get user's games.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Games per page (default: 20)
- `sort` (optional): Sort field (default: 'createdAt')
- `order` (optional): Sort order ('asc' or 'desc', default: 'desc')

**Response:**
```json
{
  "success": true,
  "games": [
    {
      "id": "game_123",
      "title": "My Game",
      "pgn": "1. e4 e5 2. Nf3 Nc6",
      "createdAt": "2023-01-01T00:00:00Z",
      "updatedAt": "2023-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5
  }
}
```

#### POST /games

Create a new game.

**Request Body:**
```json
{
  "title": "My Game",
  "pgn": "1. e4 e5 2. Nf3 Nc6",
  "tags": ["opening", "tactics"]
}
```

**Response:**
```json
{
  "success": true,
  "game": {
    "id": "game_123",
    "title": "My Game",
    "pgn": "1. e4 e5 2. Nf3 Nc6",
    "createdAt": "2023-01-01T00:00:00Z",
    "updatedAt": "2023-01-01T00:00:00Z"
  }
}
```

#### GET /games/:id

Get a specific game.

**Response:**
```json
{
  "success": true,
  "game": {
    "id": "game_123",
    "title": "My Game",
    "pgn": "1. e4 e5 2. Nf3 Nc6",
    "createdAt": "2023-01-01T00:00:00Z",
    "updatedAt": "2023-01-01T00:00:00Z"
  }
}
```

#### PUT /games/:id

Update a game.

**Request Body:**
```json
{
  "title": "Updated Game",
  "pgn": "1. e4 e5 2. Nf3 Nc6 3. Bb5",
  "tags": ["opening", "tactics", "middlegame"]
}
```

**Response:**
```json
{
  "success": true,
  "game": {
    "id": "game_123",
    "title": "Updated Game",
    "pgn": "1. e4 e5 2. Nf3 Nc6 3. Bb5",
    "createdAt": "2023-01-01T00:00:00Z",
    "updatedAt": "2023-01-01T00:00:00Z"
  }
}
```

#### DELETE /games/:id

Delete a game.

**Response:**
```json
{
  "success": true
}
```

## Error Responses

All endpoints may return error responses in the following format:

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

Common HTTP status codes:
- `400 Bad Request`: Invalid request parameters
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

## Rate Limiting

API requests are rate limited to prevent abuse:
- Analysis endpoints: 10 requests per minute
- Opening endpoints: 100 requests per minute
- Tablebase endpoints: 20 requests per minute
- Game management: 50 requests per minute

## WebSocket Support

Real-time analysis updates are available via WebSocket:

```javascript
const ws = new WebSocket('ws://localhost:3001/ws');
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  // Handle real-time updates
};
```

## Examples

### Analyze a Position

```javascript
const response = await fetch('/api/analysis/position', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    depth: 15,
    multiPV: 3
  })
});

const data = await response.json();
console.log('Best move:', data.bestMove);
```

### Get Opening Moves

```javascript
const response = await fetch('/api/opening/moves?fen=rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1&limit=5');
const data = await response.json();
console.log('Opening moves:', data.moves);
```

### Query Tablebase

```javascript
const response = await fetch('/api/tablebase/query', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    fen: '8/8/8/8/8/8/8/K7 w - - 0 1'
  })
});

const data = await response.json();
console.log('Tablebase result:', data.result);
```

## Overview

This document describes the REST API endpoints for the Chess Analysis Board application. The API provides endpoints for chess engine analysis, opening exploration, tablebase queries, and game management.

## Base URL

```
http://localhost:3001/api
```

## Authentication

Currently, the API does not require authentication. In production, you would implement JWT-based authentication.

## Endpoints

### Analysis Endpoints

#### POST /analysis/position

Analyze a chess position using the Stockfish engine.

**Request Body:**
```json
{
  "fen": "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
  "depth": 15,
  "multiPV": 3,
  "timeLimit": 5000
}
```

**Response:**
```json
{
  "success": true,
  "bestMove": "e2e4",
  "evaluation": 0.2,
  "moves": [
    {
      "move": "e2e4",
      "depth": 15,
      "nodes": 1234567,
      "time": 2345,
      "evaluation": 0.2
    }
  ],
  "depth": 15,
  "multiPV": 3
}
```

#### POST /analysis/cloud

Perform cloud-based analysis for deeper evaluation.

**Request Body:**
```json
{
  "fen": "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
  "depth": 20,
  "multiPV": 3,
  "timeLimit": 10000
}
```

**Response:**
```json
{
  "success": true,
  "bestMove": "e2e4",
  "evaluation": 0.2,
  "moves": [...],
  "source": "cloud"
}
```

#### GET /analysis/status

Get the current status of the analysis engine.

**Response:**
```json
{
  "ready": true,
  "processId": 12345
}
```

#### POST /analysis/stop

Stop the current analysis.

**Response:**
```json
{
  "success": true
}
```

#### POST /analysis/quit

Quit the analysis engine.

**Response:**
```json
{
  "success": true
}
```

### Opening Explorer Endpoints

#### GET /opening/moves

Get opening moves for a specific position.

**Query Parameters:**
- `fen` (required): FEN string of the position
- `limit` (optional): Maximum number of moves to return (default: 10)
- `minGames` (optional): Minimum number of games for a move to be included (default: 10)

**Response:**
```json
{
  "success": true,
  "moves": [
    {
      "fen": "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
      "move": "e2e4",
      "san": "e4",
      "uci": "e2e4",
      "white": 1500,
      "draws": 500,
      "black": 1000,
      "total": 3000,
      "averageRating": 1800,
      "eco": "B20",
      "name": "Sicilian Defense",
      "winRate": {
        "white": "50.0",
        "black": "33.3",
        "draws": "16.7"
      }
    }
  ],
  "total": 1
}
```

#### GET /opening/stats

Get opening statistics for a position.

**Query Parameters:**
- `fen` (required): FEN string of the position

**Response:**
```json
{
  "success": true,
  "stats": {
    "totalGames": 50000,
    "totalMoves": 15,
    "averageRating": 1800,
    "mostPopular": 25000
  }
}
```

#### GET /opening/eco

Get ECO codes for a position.

**Query Parameters:**
- `fen` (required): FEN string of the position

**Response:**
```json
{
  "success": true,
  "ecoCodes": [
    {
      "eco": "B20",
      "name": "Sicilian Defense",
      "total": 25000
    }
  ]
}
```

#### GET /opening/search

Search openings by name.

**Query Parameters:**
- `q` (required): Search query
- `limit` (optional): Maximum number of results (default: 20)

**Response:**
```json
{
  "success": true,
  "openings": [
    {
      "name": "Sicilian Defense",
      "eco": "B20",
      "total": 25000,
      "averageRating": 1800
    }
  ]
}
```

#### GET /opening/popular

Get popular openings.

**Query Parameters:**
- `limit` (optional): Maximum number of results (default: 20)
- `minGames` (optional): Minimum number of games (default: 100)

**Response:**
```json
{
  "success": true,
  "openings": [
    {
      "_id": "B20",
      "name": "Sicilian Defense",
      "totalGames": 25000,
      "averageRating": 1800
    }
  ]
}
```

#### POST /opening/import

Import opening data (admin only).

**Request Body:**
```json
{
  "moves": [
    {
      "fen": "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
      "move": "e2e4",
      "san": "e4",
      "uci": "e2e4",
      "white": 1500,
      "draws": 500,
      "black": 1000,
      "total": 3000,
      "averageRating": 1800,
      "eco": "B20",
      "name": "Sicilian Defense"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "imported": 1
}
```

### Tablebase Endpoints

#### POST /tablebase/query

Query the Syzygy tablebase for a position.

**Request Body:**
```json
{
  "fen": "8/8/8/8/8/8/8/K7 w - - 0 1"
}
```

**Response:**
```json
{
  "success": true,
  "result": {
    "category": "win",
    "wdl": 1,
    "dtz": 10,
    "dtm": 15,
    "moves": [
      {
        "uci": "a1a2",
        "san": "Ka2",
        "wdl": 1,
        "dtz": 9,
        "dtm": 14
      }
    ]
  }
}
```

#### GET /tablebase/status

Get tablebase status.

**Response:**
```json
{
  "ready": true,
  "processId": 12345
}
```

#### POST /tablebase/check

Check if a position is in the tablebase.

**Request Body:**
```json
{
  "fen": "8/8/8/8/8/8/8/K7 w - - 0 1"
}
```

**Response:**
```json
{
  "success": true,
  "inTablebase": true,
  "pieceCount": 1
}
```

#### GET /tablebase/stats

Get tablebase statistics.

**Response:**
```json
{
  "success": true,
  "stats": {
    "totalPositions": 1000000,
    "maxPieces": 7,
    "supportedEndgames": [
      "KQ vs K",
      "KR vs K",
      "KB vs K",
      "KN vs K"
    ]
  }
}
```

### Game Management Endpoints

#### GET /games

Get user's games.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Games per page (default: 20)
- `sort` (optional): Sort field (default: 'createdAt')
- `order` (optional): Sort order ('asc' or 'desc', default: 'desc')

**Response:**
```json
{
  "success": true,
  "games": [
    {
      "id": "game_123",
      "title": "My Game",
      "pgn": "1. e4 e5 2. Nf3 Nc6",
      "createdAt": "2023-01-01T00:00:00Z",
      "updatedAt": "2023-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5
  }
}
```

#### POST /games

Create a new game.

**Request Body:**
```json
{
  "title": "My Game",
  "pgn": "1. e4 e5 2. Nf3 Nc6",
  "tags": ["opening", "tactics"]
}
```

**Response:**
```json
{
  "success": true,
  "game": {
    "id": "game_123",
    "title": "My Game",
    "pgn": "1. e4 e5 2. Nf3 Nc6",
    "createdAt": "2023-01-01T00:00:00Z",
    "updatedAt": "2023-01-01T00:00:00Z"
  }
}
```

#### GET /games/:id

Get a specific game.

**Response:**
```json
{
  "success": true,
  "game": {
    "id": "game_123",
    "title": "My Game",
    "pgn": "1. e4 e5 2. Nf3 Nc6",
    "createdAt": "2023-01-01T00:00:00Z",
    "updatedAt": "2023-01-01T00:00:00Z"
  }
}
```

#### PUT /games/:id

Update a game.

**Request Body:**
```json
{
  "title": "Updated Game",
  "pgn": "1. e4 e5 2. Nf3 Nc6 3. Bb5",
  "tags": ["opening", "tactics", "middlegame"]
}
```

**Response:**
```json
{
  "success": true,
  "game": {
    "id": "game_123",
    "title": "Updated Game",
    "pgn": "1. e4 e5 2. Nf3 Nc6 3. Bb5",
    "createdAt": "2023-01-01T00:00:00Z",
    "updatedAt": "2023-01-01T00:00:00Z"
  }
}
```

#### DELETE /games/:id

Delete a game.

**Response:**
```json
{
  "success": true
}
```

## Error Responses

All endpoints may return error responses in the following format:

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

Common HTTP status codes:
- `400 Bad Request`: Invalid request parameters
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

## Rate Limiting

API requests are rate limited to prevent abuse:
- Analysis endpoints: 10 requests per minute
- Opening endpoints: 100 requests per minute
- Tablebase endpoints: 20 requests per minute
- Game management: 50 requests per minute

## WebSocket Support

Real-time analysis updates are available via WebSocket:

```javascript
const ws = new WebSocket('ws://localhost:3001/ws');
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  // Handle real-time updates
};
```

## Examples

### Analyze a Position

```javascript
const response = await fetch('/api/analysis/position', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    depth: 15,
    multiPV: 3
  })
});

const data = await response.json();
console.log('Best move:', data.bestMove);
```

### Get Opening Moves

```javascript
const response = await fetch('/api/opening/moves?fen=rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1&limit=5');
const data = await response.json();
console.log('Opening moves:', data.moves);
```

### Query Tablebase

```javascript
const response = await fetch('/api/tablebase/query', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    fen: '8/8/8/8/8/8/8/K7 w - - 0 1'
  })
});

const data = await response.json();
console.log('Tablebase result:', data.result);
```

## Overview

This document describes the REST API endpoints for the Chess Analysis Board application. The API provides endpoints for chess engine analysis, opening exploration, tablebase queries, and game management.

## Base URL

```
http://localhost:3001/api
```

## Authentication

Currently, the API does not require authentication. In production, you would implement JWT-based authentication.

## Endpoints

### Analysis Endpoints

#### POST /analysis/position

Analyze a chess position using the Stockfish engine.

**Request Body:**
```json
{
  "fen": "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
  "depth": 15,
  "multiPV": 3,
  "timeLimit": 5000
}
```

**Response:**
```json
{
  "success": true,
  "bestMove": "e2e4",
  "evaluation": 0.2,
  "moves": [
    {
      "move": "e2e4",
      "depth": 15,
      "nodes": 1234567,
      "time": 2345,
      "evaluation": 0.2
    }
  ],
  "depth": 15,
  "multiPV": 3
}
```

#### POST /analysis/cloud

Perform cloud-based analysis for deeper evaluation.

**Request Body:**
```json
{
  "fen": "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
  "depth": 20,
  "multiPV": 3,
  "timeLimit": 10000
}
```

**Response:**
```json
{
  "success": true,
  "bestMove": "e2e4",
  "evaluation": 0.2,
  "moves": [...],
  "source": "cloud"
}
```

#### GET /analysis/status

Get the current status of the analysis engine.

**Response:**
```json
{
  "ready": true,
  "processId": 12345
}
```

#### POST /analysis/stop

Stop the current analysis.

**Response:**
```json
{
  "success": true
}
```

#### POST /analysis/quit

Quit the analysis engine.

**Response:**
```json
{
  "success": true
}
```

### Opening Explorer Endpoints

#### GET /opening/moves

Get opening moves for a specific position.

**Query Parameters:**
- `fen` (required): FEN string of the position
- `limit` (optional): Maximum number of moves to return (default: 10)
- `minGames` (optional): Minimum number of games for a move to be included (default: 10)

**Response:**
```json
{
  "success": true,
  "moves": [
    {
      "fen": "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
      "move": "e2e4",
      "san": "e4",
      "uci": "e2e4",
      "white": 1500,
      "draws": 500,
      "black": 1000,
      "total": 3000,
      "averageRating": 1800,
      "eco": "B20",
      "name": "Sicilian Defense",
      "winRate": {
        "white": "50.0",
        "black": "33.3",
        "draws": "16.7"
      }
    }
  ],
  "total": 1
}
```

#### GET /opening/stats

Get opening statistics for a position.

**Query Parameters:**
- `fen` (required): FEN string of the position

**Response:**
```json
{
  "success": true,
  "stats": {
    "totalGames": 50000,
    "totalMoves": 15,
    "averageRating": 1800,
    "mostPopular": 25000
  }
}
```

#### GET /opening/eco

Get ECO codes for a position.

**Query Parameters:**
- `fen` (required): FEN string of the position

**Response:**
```json
{
  "success": true,
  "ecoCodes": [
    {
      "eco": "B20",
      "name": "Sicilian Defense",
      "total": 25000
    }
  ]
}
```

#### GET /opening/search

Search openings by name.

**Query Parameters:**
- `q` (required): Search query
- `limit` (optional): Maximum number of results (default: 20)

**Response:**
```json
{
  "success": true,
  "openings": [
    {
      "name": "Sicilian Defense",
      "eco": "B20",
      "total": 25000,
      "averageRating": 1800
    }
  ]
}
```

#### GET /opening/popular

Get popular openings.

**Query Parameters:**
- `limit` (optional): Maximum number of results (default: 20)
- `minGames` (optional): Minimum number of games (default: 100)

**Response:**
```json
{
  "success": true,
  "openings": [
    {
      "_id": "B20",
      "name": "Sicilian Defense",
      "totalGames": 25000,
      "averageRating": 1800
    }
  ]
}
```

#### POST /opening/import

Import opening data (admin only).

**Request Body:**
```json
{
  "moves": [
    {
      "fen": "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
      "move": "e2e4",
      "san": "e4",
      "uci": "e2e4",
      "white": 1500,
      "draws": 500,
      "black": 1000,
      "total": 3000,
      "averageRating": 1800,
      "eco": "B20",
      "name": "Sicilian Defense"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "imported": 1
}
```

### Tablebase Endpoints

#### POST /tablebase/query

Query the Syzygy tablebase for a position.

**Request Body:**
```json
{
  "fen": "8/8/8/8/8/8/8/K7 w - - 0 1"
}
```

**Response:**
```json
{
  "success": true,
  "result": {
    "category": "win",
    "wdl": 1,
    "dtz": 10,
    "dtm": 15,
    "moves": [
      {
        "uci": "a1a2",
        "san": "Ka2",
        "wdl": 1,
        "dtz": 9,
        "dtm": 14
      }
    ]
  }
}
```

#### GET /tablebase/status

Get tablebase status.

**Response:**
```json
{
  "ready": true,
  "processId": 12345
}
```

#### POST /tablebase/check

Check if a position is in the tablebase.

**Request Body:**
```json
{
  "fen": "8/8/8/8/8/8/8/K7 w - - 0 1"
}
```

**Response:**
```json
{
  "success": true,
  "inTablebase": true,
  "pieceCount": 1
}
```

#### GET /tablebase/stats

Get tablebase statistics.

**Response:**
```json
{
  "success": true,
  "stats": {
    "totalPositions": 1000000,
    "maxPieces": 7,
    "supportedEndgames": [
      "KQ vs K",
      "KR vs K",
      "KB vs K",
      "KN vs K"
    ]
  }
}
```

### Game Management Endpoints

#### GET /games

Get user's games.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Games per page (default: 20)
- `sort` (optional): Sort field (default: 'createdAt')
- `order` (optional): Sort order ('asc' or 'desc', default: 'desc')

**Response:**
```json
{
  "success": true,
  "games": [
    {
      "id": "game_123",
      "title": "My Game",
      "pgn": "1. e4 e5 2. Nf3 Nc6",
      "createdAt": "2023-01-01T00:00:00Z",
      "updatedAt": "2023-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5
  }
}
```

#### POST /games

Create a new game.

**Request Body:**
```json
{
  "title": "My Game",
  "pgn": "1. e4 e5 2. Nf3 Nc6",
  "tags": ["opening", "tactics"]
}
```

**Response:**
```json
{
  "success": true,
  "game": {
    "id": "game_123",
    "title": "My Game",
    "pgn": "1. e4 e5 2. Nf3 Nc6",
    "createdAt": "2023-01-01T00:00:00Z",
    "updatedAt": "2023-01-01T00:00:00Z"
  }
}
```

#### GET /games/:id

Get a specific game.

**Response:**
```json
{
  "success": true,
  "game": {
    "id": "game_123",
    "title": "My Game",
    "pgn": "1. e4 e5 2. Nf3 Nc6",
    "createdAt": "2023-01-01T00:00:00Z",
    "updatedAt": "2023-01-01T00:00:00Z"
  }
}
```

#### PUT /games/:id

Update a game.

**Request Body:**
```json
{
  "title": "Updated Game",
  "pgn": "1. e4 e5 2. Nf3 Nc6 3. Bb5",
  "tags": ["opening", "tactics", "middlegame"]
}
```

**Response:**
```json
{
  "success": true,
  "game": {
    "id": "game_123",
    "title": "Updated Game",
    "pgn": "1. e4 e5 2. Nf3 Nc6 3. Bb5",
    "createdAt": "2023-01-01T00:00:00Z",
    "updatedAt": "2023-01-01T00:00:00Z"
  }
}
```

#### DELETE /games/:id

Delete a game.

**Response:**
```json
{
  "success": true
}
```

## Error Responses

All endpoints may return error responses in the following format:

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

Common HTTP status codes:
- `400 Bad Request`: Invalid request parameters
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

## Rate Limiting

API requests are rate limited to prevent abuse:
- Analysis endpoints: 10 requests per minute
- Opening endpoints: 100 requests per minute
- Tablebase endpoints: 20 requests per minute
- Game management: 50 requests per minute

## WebSocket Support

Real-time analysis updates are available via WebSocket:

```javascript
const ws = new WebSocket('ws://localhost:3001/ws');
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  // Handle real-time updates
};
```

## Examples

### Analyze a Position

```javascript
const response = await fetch('/api/analysis/position', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    depth: 15,
    multiPV: 3
  })
});

const data = await response.json();
console.log('Best move:', data.bestMove);
```

### Get Opening Moves

```javascript
const response = await fetch('/api/opening/moves?fen=rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1&limit=5');
const data = await response.json();
console.log('Opening moves:', data.moves);
```

### Query Tablebase

```javascript
const response = await fetch('/api/tablebase/query', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    fen: '8/8/8/8/8/8/8/K7 w - - 0 1'
  })
});

const data = await response.json();
console.log('Tablebase result:', data.result);
```




































































