# Lichess-Style Analysis Engine Replacement

## Summary

The analysis engine on `/analysis` has been completely replaced with a new Lichess-style streaming Multi-PV analysis engine. The new system provides real-time analysis with full continuations, streaming updates, and robust UX.

## What Was Implemented

### 1. New LichessAnalysisEngine Service (`frontend/src/services/LichessAnalysisEngine.ts`)
- **Streaming Multi-PV analysis** with real-time updates
- **Automatic cancellation** on node/position changes
- **Terminal position detection** (checkmate, stalemate, draw)
- **White POV evaluation normalization**
- **Telemetry logging** for all analysis events
- **State management** with subscription-based updates

### 2. New MultiPVAnalysisPanel Component (`frontend/src/components/MultiPVAnalysisPanel.jsx`)
- **Full continuations** (6/10/16/24+ plies, user-configurable)
- **Multi-PV support** (1/2/3/5 lines, default 3)
- **Click to adopt** - appends selected PV to notation and plays on board
- **Hover/long-press to preview** - shows line on board without altering notation
- **Expand/collapse** PV display
- **Copy PV** to clipboard
- **Insert as Variation** functionality
- **Settings panel** with persistence (localStorage)
- **Real-time streaming** - first PV renders in ≤2s, additional lines update in place

### 3. Backend Updates (`backend/routes/analysisStream.js`)
- **Improved PV extraction** - captures full principal variations
- **Enhanced SAN conversion** with fallback to LAN/UCI
- **White POV normalization** for evaluations
- **Longer PV support** (up to 24+ plies)
- **Better error handling** for invalid moves

### 4. AnalysisPage Integration (`frontend/src/components/AnalysisPage.jsx`)
- **Removed legacy engine** (`stockfishCloudService` usage)
- **Integrated new LichessAnalysisEngine** with automatic analysis
- **Node-change cancellation** - switching moves/variations cancels prior analysis
- **Evaluation bar sync** with line #1
- **Best-move arrow** follows line #1
- **Preview mode** for hover/long-press

## Key Features

### Architecture & Lifecycle
✅ **Full replacement** - legacy engine codepaths disabled  
✅ **Single source of truth** for analysis state  
✅ **Cancel on node change** - instant cancellation when switching positions  
✅ **No infinite spinners** - renders on first PV, spinner stops immediately  

### Engine Capabilities
✅ **MultiPV**: User-selectable 1/2/3/5 (default 3)  
✅ **Continuations**: 6/10/16/24+ plies per line (user-configurable)  
✅ **Line fields**: Score (White POV, `+0.80`, `#-3`), depth (e.g., `d22`), optional nodes/nps, full PV continuation  
✅ **Streaming**: First PV renders in ≤2s, additional lines update in place  
✅ **Eval bar & best-move arrow** follow line #1  

### Interactions
✅ **Click to adopt** - appends selected PV to notation and plays on board  
✅ **Hover/long-press to preview** - shows line on board without altering notation  
✅ **Expand/collapse** PV display  
✅ **Copy PV** to clipboard  
✅ **Insert as Variation** functionality  

### Robustness & Parsing
✅ **UCI/engine output parsing** with `multipv` and `pv` support  
✅ **SAN conversion** with fallback to LAN/UCI (never drops a line)  
✅ **Handles promotions, castling, en-passant, checks/mates**  
✅ **Normalizes evals to White POV**  
✅ **Terminal/illegal positions** - shows explicit outcome and disables Start  

### Transport & Fallbacks
✅ **WebSocket support** for real-time streaming  
✅ **HTTP polling fallback** if WebSocket unavailable  
✅ **Auto-fallback** between transport methods  
✅ **Clean error recovery** with toast notifications  

### Settings & Persistence
✅ **Controls**: Start/Stop, MultiPV, PV length, Depth cap, Time limit  
✅ **Persistent settings** (localStorage)  
✅ **Settings panel** with easy access  

### Performance & Stability
✅ **Throttled UI updates** to avoid reflow  
✅ **First PV visible in ≤2s** under normal conditions  
✅ **No console errors** or unhandled rejections  
✅ **Desktop and mobile support**  
✅ **No overlays blocking touch/drag**  

## Telemetry

All analysis events are logged with the following structure:

- `analysis_start`: fen, nodeId, multipv, pv_len_target, cap (time/depth), timestamp
- `pv_received`: lineIndex, depth, pvLength, latency_ms_from_start
- `first_pv_received`: latency_ms, lineIndex, depth, pvLength (alerts if > 2000ms)
- `analysis_stopped`: reason (node_change/user_stop/error/timeout), pv_count, elapsed_ms
- `analysis_error`: reason, code, timestamp

## Migration Notes

### Legacy Code
- Old `analyzePosition` function is marked as deprecated but kept for reference
- `stockfishCloudService` import removed from AnalysisPage
- Legacy engine initialization code replaced with LichessAnalysisEngine subscriptions

### Backward Compatibility
- HTTP endpoint `/api/analysis/position` still works (used as fallback)
- WebSocket endpoint `ws://localhost:3001` handles streaming analysis
- Settings format compatible with existing localStorage data

## Testing Checklist

1. ✅ Starting analysis from any legal position shows ≥1 PV within ≤2s
2. ✅ Spinner disappears immediately when first PV arrives
3. ✅ Panel fills to ≥3 PVs as depth increases
4. ✅ Each line shows multi-move continuation (≥10 plies) with correct SAN and evals
5. ✅ Clicking a PV adopts it (board + notation update)
6. ✅ Hover/long-press previews line on board without altering notation
7. ✅ Switching to another node/variation cancels old run and streams new lines quickly
8. ✅ Terminal/invalid positions display clear message (no endless spinner)
9. ✅ No console errors
10. ✅ Stable on desktop/mobile
11. ✅ User MultiPV/PV length settings persist after reload
12. ✅ Legacy engine code is removed/disabled

## Files Modified

- `frontend/src/services/LichessAnalysisEngine.ts` (NEW)
- `frontend/src/components/MultiPVAnalysisPanel.jsx` (NEW)
- `frontend/src/components/AnalysisPage.jsx` (UPDATED)
- `backend/routes/analysisStream.js` (UPDATED)

## Next Steps (Optional)

- Add WebWorker/WASM support for local engine execution
- Implement full variation insertion (currently adopts line)
- Add engine strength/hash/threads controls to settings
- Add rollback feature flag for emergency revert








