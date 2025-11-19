# Real-Time Sync Testing Guide

## ✅ What Was Fixed

1. **Added clientMsgId** - Backend can now send ACKs
2. **Comprehensive logging** - Can see exactly what's happening
3. **Proper event routing** - Direct events go to callbacks
4. **Self-event filtering** - userId check prevents loops

## 🧪 How to Test

### Step 1: Restart Everything

**Backend:**
```bash
cd backend
# Press Ctrl+C to stop
npm start
```

**Frontend:**
```bash
cd frontend
# Press Ctrl+C to stop
# Delete cache
Remove-Item -Path "node_modules\.cache" -Recurse -Force -ErrorAction SilentlyContinue
npm start
```

### Step 2: Open Browser Console

Open DevTools (F12) in both browser windows to see logs.

### Step 3: Test Scenarios

#### Test 1: Chapter Selection (Continuous)

**Actions:**
1. User A: Select Chapter 2
2. User A: Select Chapter 3
3. User A: Select Chapter 1
4. User A: Select Chapter 4

**Expected Console Output (User B):**
```
📨 ========== WebSocket Message ==========
📨 Type: chapter.changed
📨 Full data: {
  "type": "chapter.changed",
  "seq": 1,
  "studyId": "...",
  "chapterId": "...",
  "userId": "userA"
}
📨 Registered callbacks: ["move.played", "chapter.created", "chapter.changed", "chapter.selected", ...]
📨 Direct event detected: chapter.changed
✅ Calling callback for: chapter.changed
📖 Received chapter.changed event: {...}
✅ Switching to chapter: ...
```

**Expected Result:**
- User B switches to Chapter 2
- User B switches to Chapter 3
- User B switches to Chapter 1
- User B switches to Chapter 4
- ALL switches happen (no one-time limitation)

#### Test 2: Moves (Continuous)

**Actions:**
1. User A: Play e4
2. User A: Play e5
3. User A: Play Nf3
4. User A: Play Nc3
5. User A: Play d4

**Expected Console Output (User B):**
```
📨 ========== WebSocket Message ==========
📨 Type: move.played
📨 Full data: {
  "type": "move.played",
  "seq": 2,
  "studyId": "...",
  "chapterId": "...",
  "userId": "userA",
  "san": "e4",
  "fen": "...",
  "tree": {...}
}
📨 Direct event detected: move.played
✅ Calling callback for: move.played
🎯 Received move.played event: {...}
✅ Applying move from other user
🔄 Updating tree with 1 moves
✅ Move applied successfully
```

**Expected Result:**
- User B sees e4
- User B sees e5
- User B sees Nf3
- User B sees Nc3
- User B sees d4
- ALL moves arrive (no missing moves)

#### Test 3: Self-Event Filtering

**Actions:**
1. User A: Play e4

**Expected Console Output (User A):**
```
📡 Broadcasting move, clientMsgId: 1234567890_abc123

📨 ========== WebSocket Message ==========
📨 Type: move.played
📨 Full data: {
  "type": "move.played",
  "seq": 3,
  "studyId": "...",
  "chapterId": "...",
  "userId": "userA",  <-- Same as User A's userId
  "san": "e4",
  ...
}
📨 Direct event detected: move.played
✅ Calling callback for: move.played
🎯 Received move.played event: {...}
⏭️ Skipping self-sent move  <-- SKIPPED!
```

**Expected Result:**
- User A does NOT see duplicate e4
- User A's board stays correct (no double update)

## 🔍 Debugging

### If Events Not Arriving

**Check 1: Is WebSocket Connected?**
Look for:
```
🔌 WebSocket connection status: true
📱 Joining study: 507f191e810c19729de860ea
```

**Check 2: Are Events Being Sent?**
Look for:
```
📡 Broadcasting move, clientMsgId: ...
```

**Check 3: Are Events Being Received?**
Look for:
```
📨 ========== WebSocket Message ==========
📨 Type: move.played
```

**Check 4: Are Callbacks Registered?**
Look for:
```
📨 Registered callbacks: ["move.played", "chapter.changed", ...]
```

If `move.played` is NOT in the list, the callback wasn't registered!

**Check 5: Is Callback Being Called?**
Look for:
```
✅ Calling callback for: move.played
```

If you see:
```
⚠️ No callback registered for event type: move.played
```

Then the callback registration failed!

### If Chapter Selection Only Works Once

**Check:** Are you seeing this on the SECOND chapter change?
```
📨 ========== WebSocket Message ==========
📨 Type: chapter.changed
```

If YES: Event is arriving, check if callback is being called
If NO: Event is not arriving from backend

**Check Backend Logs:**
```
📖 User 123 changed to chapter 456 in study 789
📢 Broadcasting chapter.changed event seq=2 to study 789
```

### If Moves Not Syncing

**Check:** Are both users in the same study and chapter?

Look for:
```
🎯 Event studyId: 507f191e810c19729de860ea
🎯 Active studyId: 507f191e810c19729de860ea  <-- Must match
🎯 Event chapterId: 507f1f77bcf86cd799439011
🎯 Active chapterId: 507f1f77bcf86cd799439011  <-- Must match
```

If they don't match:
```
⏭️ Skipping move - different study or chapter
```

## ✅ Success Criteria

All of these must be TRUE:

- [ ] User B switches chapters EVERY time User A does (no one-time limit)
- [ ] User B sees ALL moves from User A (no missing moves)
- [ ] User A does NOT see duplicate moves (self-filtering works)
- [ ] Console shows "Calling callback for: move.played" for EVERY move
- [ ] Console shows "Calling callback for: chapter.changed" for EVERY chapter change
- [ ] No errors in console related to callbacks or events

## 📝 What to Report

If it's still not working, copy and paste:

1. **User A Console Output** (when playing a move)
2. **User B Console Output** (when receiving the move)
3. **Backend Console Output** (when processing the move)

This will show exactly where the flow is breaking!








