# Integration Guide: Streaming Analysis Engine

## Quick Start

The Lichess-style analysis engine is now implemented. To integrate it into your AnalysisPage:

### Step 1: Import the Streaming Service

In `AnalysisPage.jsx`, replace:
```javascript
import stockfishCloudService from '../services/StockfishCloudService';
```

With:
```javascript
import streamingAnalysisService from '../services/StreamingAnalysisService';
```

### Step 2: Update analyzePosition Function

Replace the `analyzePosition` function (around line 1504) with:

```javascript
const analyzePosition = async () => {
  if (!isEngineReady || !boardPosition || !isAnalysisEnabled) return;

  const analyzingPosition = boardPosition;
  
  // Cancel previous analysis
  if (analysisAbortControllerRef.current) {
    analysisAbortControllerRef.current();
    analysisAbortControllerRef.current = null;
  }
  
  // Validate FEN
  try {
    const game = new Chess(boardPosition);
    if (game.isGameOver()) {
      setEngineError('Terminal position - no analysis available');
      setIsAnalyzing(false);
      return;
    }
  } catch (error) {
    setEngineError('Invalid position');
    setIsAnalyzing(false);
    return;
  }

  setIsAnalyzing(true);
  setEngineError(null);
  setEngineSuggestions([]);
  analysisStartTimeRef.current = Date.now();

  // Start streaming analysis
  const cancel = await streamingAnalysisService.startAnalysis(
    {
      fen: boardPosition,
      multiPV: analysisSettings.multiPV || 3,
      depthCap: analysisSettings.depthCap || 20,
      timeLimit: 750,
      pvLength: analysisSettings.pvLength || 10,
      nodeId: `${currentPath.join('-')}-${currentMoveIndex}`
    },
    (pv) => {
      // Stream PV updates in real-time
      if (boardPosition !== analyzingPosition) return; // Position changed
      
      setEngineSuggestions(prev => {
        const newSuggestions = [...prev];
        newSuggestions[pv.lineIndex] = {
          move: pv.pv[0] || '',
          pv: pv.pv,
          depth: pv.depth,
          evaluation: pv.evaluation,
          multipv: pv.lineIndex + 1
        };
        // Sort by lineIndex
        return newSuggestions.sort((a, b) => a.multipv - b.multipv);
      });
      
      if (pv.lineIndex === 0) {
        setEngineEvaluation(pv.evaluation);
        setCurrentAnalysisDepth(pv.depth);
        // First PV received - stop spinner
        setIsAnalyzing(false);
      }
    },
    (error) => {
      if (boardPosition !== analyzingPosition) return;
      setEngineError(error.message || 'Analysis failed');
      setIsAnalyzing(false);
    },
    (allPVs) => {
      if (boardPosition !== analyzingPosition) return;
      // Analysis complete
      const engineMoves = allPVs.map(pv => ({
        move: pv.pv[0] || '',
        pv: pv.pv,
        depth: pv.depth,
        evaluation: pv.evaluation,
        multipv: pv.lineIndex + 1
      }));
      setEngineSuggestions(engineMoves);
      setIsAnalyzing(false);
    }
  );

  // Store cancel function
  analysisAbortControllerRef.current = cancel;

  // 2s failsafe
  setTimeout(() => {
    if (engineSuggestions.length === 0 && isAnalyzing) {
      setEngineError('No lines received within 2 seconds. Retry or check backend.');
      setIsAnalyzing(false);
    }
  }, 2000);
};
```

### Step 3: Update useEffect for Analysis

The existing useEffect that calls `analyzePosition()` should work as-is, but ensure it cancels previous analysis:

```javascript
useEffect(() => {
  if (isEngineReady && isAnalysisEnabled && boardPosition) {
    // Cancel previous analysis
    if (analysisAbortControllerRef.current) {
      analysisAbortControllerRef.current();
    }
    analyzePosition();
  }
  
  return () => {
    // Cleanup: cancel analysis on unmount or position change
    if (analysisAbortControllerRef.current) {
      analysisAbortControllerRef.current();
    }
  };
}, [boardPosition, isEngineReady, isAnalysisEnabled, analysisSettings]);
```

### Step 4: Add Game Review Button (Optional)

Add a "Review Game" button that opens the GameReview component:

```javascript
import { GameReview } from './GameReview';

// In your component state:
const [showGameReview, setShowGameReview] = useState(false);

// In your JSX:
{showGameReview && (
  <GameReview
    pgn={game.pgn()}
    onClose={() => setShowGameReview(false)}
  />
)}

// Add button to trigger review:
<button onClick={() => setShowGameReview(true)}>
  Review Game
</button>
```

## Testing

1. **Start Backend**: `cd backend && npm start`
2. **Verify Stockfish**: Check `backend/engines/stockfish.exe` exists
3. **Open Analysis Page**: Navigate to `http://localhost:3000/analysis`
4. **Check Console**: Look for `📊 TELEMETRY:` logs
5. **Test Streaming**: First PV should appear within 2s
6. **Test Cancellation**: Navigate to different position - analysis should cancel instantly

## Troubleshooting

### No PVs Received
- Check backend console for Stockfish errors
- Verify `stockfish.exe` is in `backend/engines/`
- Check WebSocket connection (falls back to HTTP if WS unavailable)

### First PV > 2s
- Check backend logs for `📊 TELEMETRY: first_pv_received`
- Verify Stockfish is responding
- Check network latency

### Analysis Not Cancelling
- Ensure `analysisAbortControllerRef.current` is called on position change
- Check that `analyzingPosition` is compared correctly

## Benefits of Streaming

1. **Real-time Updates**: PVs appear as they're calculated
2. **Better UX**: First PV within 2s, spinner stops immediately
3. **Cancellation**: Instant cancellation on position change
4. **Telemetry**: Comprehensive logging for debugging
5. **Fallback**: HTTP polling if WebSocket unavailable

## Next Steps

- Test with various positions
- Monitor telemetry logs
- Adjust timeouts if needed
- Add WASM engine for offline support (future)








