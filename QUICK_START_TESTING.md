# Quick Start Testing Guide - Rock-Solid Sync

## Prerequisites

1. Backend server running on `http://localhost:3001`
2. Frontend running on `http://localhost:3000`
3. Two browser windows (or different browsers) for testing

## Step-by-Step Testing

### 1. Start the Servers

**Terminal 1 - Backend:**
```bash
cd chessrep-main/backend
npm start
```

**Terminal 2 - Frontend:**
```bash
cd chessrep-main/frontend
npm start
```

### 2. Setup Test Users

**Browser Window 1 (User A):**
1. Navigate to `http://localhost:3000`
2. Sign up/login as User A
3. Navigate to `http://localhost:3000/enhanced-chess-study`

**Browser Window 2 (User B):**
1. Navigate to `http://localhost:3000` (in different browser or incognito)
2. Sign up/login as User B
3. Navigate to `http://localhost:3000/enhanced-chess-study`

### 3. Create or Join Study

**User A:**
1. Click "Create New Study"
2. Name it "Sync Test Study"
3. Create a few chapters: "Chapter 1", "Chapter 2", "Chapter 3"
4. Note the study ID from the URL or share button

**User B:**
1. Click "Join Study" or use collaboration invitation
2. Join "Sync Test Study"

### 4. Test Chapter Sync

**Expected: Chapter selection fires continuously, not just once**

1. **User A:** Click "Chapter 1"
   - **User B:** Should switch to Chapter 1 within 200ms
   - Check diagnostics panel: should show `chapter.changed` event

2. **User A:** Click "Chapter 2"
   - **User B:** Should switch to Chapter 2 immediately
   - Check diagnostics: seq should increment

3. **User A:** Rapidly click through all chapters
   - **User B:** Should follow every single chapter change
   - No missed chapter changes

**✅ PASS:** Every chapter change is reflected for all users
**❌ FAIL:** If any chapter change is missed or User B doesn't follow

### 5. Test Live Move Sync

**Expected: All moves appear live, in order, for all users**

1. Both users should be in the same chapter (e.g., "Chapter 1")

2. **User A:** Make moves quickly:
   - e4
   - e5
   - Nf3
   - Nc6
   - Bb5

3. **User B:** Watch the board and notation panel
   - All 5 moves should appear live
   - Moves should appear in correct order
   - Board should update after each move
   - Notation panel should show all moves

4. Check diagnostics panel on both users:
   - Should show 5 `move.played` events
   - Seq numbers should be sequential
   - No gaps in sequence

**✅ PASS:** All moves visible on both boards, in correct order
**❌ FAIL:** If any move is missing or out of order

### 6. Test Chapter Creation

**Expected: New chapters appear immediately without refresh**

1. **User A:** Click "New Chapter"
2. Name it "Test Chapter"
3. Create it

4. **User B:** Look at chapter list (NO REFRESH)
   - "Test Chapter" should appear immediately
   - Check diagnostics: should show `chapter.created` event

**✅ PASS:** New chapter appears for User B without refresh
**❌ FAIL:** If User B needs to refresh to see new chapter

### 7. Test Presence Display

**Expected: Usernames shown under Chapters, update instantly**

1. Check "👥 Active Users" section under Chapters panel
   - Should show both User A and User B
   - Should show current chapter for each user
   - Green pulse indicator should be visible

2. **User A:** Switch to "Chapter 2"
   - Presence should update to show User A in "Chapter 2"
   - User B should still show in previous chapter

3. **User B:** Switch to "Chapter 2"
   - Presence should show both users in "Chapter 2"

4. **User A:** Close browser or logout
   - User A should disappear from presence list on User B's screen

**✅ PASS:** Presence updates instantly, shows correct info
**❌ FAIL:** If presence doesn't update or shows wrong info

### 8. Test Reconnection & Catch-Up

**Expected: After disconnect, client catches up perfectly**

1. Both users in same chapter with some moves made

2. **User B:** Simulate disconnect:
   - Close laptop lid for 10 seconds, OR
   - Turn off WiFi for 10 seconds, OR
   - Close browser tab

3. **User A:** While User B is disconnected:
   - Make 3-4 moves
   - Switch to different chapter
   - Make 2 more moves

4. **User B:** Reconnect:
   - Open laptop / turn on WiFi / reopen tab
   - Wait for reconnection

5. Check User B's state:
   - Should be in same chapter as User A
   - Board should show all moves User A made
   - Diagnostics should show `sync.response` event
   - No gaps in move sequence
   - No duplicate moves

**✅ PASS:** User B catches up perfectly, no gaps or duplicates
**❌ FAIL:** If any moves are missing or duplicated

### 9. Check Console Errors

**Expected: Zero errors related to events, rooms, or state**

1. Open browser console (F12) on both windows

2. Perform all tests above

3. Check console for errors:
   - ✅ Informational logs with `[RealtimeClient]` prefix are OK
   - ✅ Logs showing seq numbers and event types are OK
   - ❌ Any red errors related to WebSocket, events, or sync are FAIL

**✅ PASS:** No console errors
**❌ FAIL:** If any errors appear

### 10. Test Diagnostics Panel

**Expected: Diagnostics show accurate real-time info**

1. Check "🔍 Sync Status" panel under Chapters

2. Verify it shows:
   - Status: 🟢 Connected (when connected)
   - Last Seq: Incrementing number
   - Study ID: Truncated study ID
   - Chapter ID: Truncated chapter ID
   - Recent Events: Last 3 events with types and seq

3. Make a move:
   - Last Seq should increment
   - Recent Events should show `move.played`

4. Change chapter:
   - Recent Events should show `chapter.changed`

**✅ PASS:** Diagnostics accurate and updating
**❌ FAIL:** If diagnostics show wrong info or don't update

## Quick Verification Checklist

Run through this checklist quickly:

- [ ] User A selects chapter → User B follows immediately
- [ ] User A makes 5 moves → User B sees all 5 moves live
- [ ] User A creates chapter → User B sees it without refresh
- [ ] Presence shows both users with correct chapters
- [ ] User B disconnects & reconnects → catches up perfectly
- [ ] Zero console errors during all tests
- [ ] Diagnostics panel shows correct seq and events

## Common Issues & Solutions

### Issue: "WebSocket not connected"
**Solution:** Check backend is running on port 3001

### Issue: "No presence showing"
**Solution:** Ensure both users are in the same study

### Issue: "Moves not syncing"
**Solution:** 
1. Check console for errors
2. Verify both users in same chapter
3. Check diagnostics panel shows connected status

### Issue: "Chapter changes not syncing"
**Solution:**
1. Check WebSocket connection status
2. Verify RealtimeClient is initialized (check console logs)
3. Check diagnostics for recent events

## Expected Console Output

### On Connection:
```
🔌 Initializing rock-solid WebSocket connection...
📱 RealtimeClient created
📱 Registered callbacks for: move.played, chapter.created, chapter.changed, ...
🔌 WebSocket connection status: true
📱 Joining study: 507f1f77bcf86cd799439011
```

### On Move:
```
📡 Broadcasting move via RealtimeClient
📤 Sending move-made with clientMsgId=1699999999999_abc123
✅ Received ACK: clientMsgId=1699999999999_abc123, seq=42
📊 Received event: type=move.played, seq=42, lastAppliedSeq=41
✨ Applying event: type=move.played, seq=42
```

### On Chapter Change:
```
📡 Broadcasting chapter change via RealtimeClient
📤 Sending chapter-changed with clientMsgId=1699999999999_def456
✅ Received ACK: clientMsgId=1699999999999_def456, seq=43
📊 Received event: type=chapter.changed, seq=43, lastAppliedSeq=42
✨ Applying event: type=chapter.changed, seq=43
```

### On Reconnect:
```
🔄 Reconnecting - requesting sync from seq=42
📦 Sending sync response: currentSeq=50, 8 missed events
🔄 Sync response: currentSeq=50, 8 missed events
✨ Applying event: type=move.played, seq=43
✨ Applying event: type=move.played, seq=44
...
```

## Success Criteria

**ALL of the following must be true:**

1. ✅ Chapter selection syncs continuously (not just first time)
2. ✅ All moves appear live for all users
3. ✅ New chapters appear without refresh
4. ✅ Presence shows all users with correct locations
5. ✅ Reconnection catches up with no gaps
6. ✅ Zero console errors
7. ✅ Diagnostics show accurate real-time data

**If ALL criteria pass:** 🎉 **ROCK-SOLID SYNC WORKING PERFECTLY!**

**If ANY criteria fail:** 🔧 Check console logs and diagnostics panel for clues

---

**Ready to test!** Open two browser windows and follow the steps above.

**URL:** http://localhost:3000/enhanced-chess-study








