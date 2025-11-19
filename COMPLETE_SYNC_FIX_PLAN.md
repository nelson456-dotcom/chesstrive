# Complete Real-Time Sync Fix Plan

## 🚨 Root Cause Analysis

### Issue 1: Message Structure Mismatch
**Backend sends:**
```javascript
{
  type: 'event',
  event: {
    type: 'move.played',
    seq: 1,
    ...data
  }
}
```

**Frontend expects:**
```javascript
{
  type: 'move.played',  // Direct type, not nested
  seq: 1,
  ...data
}
```

### Issue 2: RealtimeClient Not Initialized Properly
- RealtimeClient is created but might not be set on websocketService
- Messages might not be routed correctly

### Issue 3: No Username Presence System
- No user list tracking
- No join/leave events
- No username display

### Issue 4: Event Handlers Not Persistent
- Handlers might be getting overwritten
- Chapter selection might only work once

## 🔧 Complete Fix

### Step 1: Simplify Message Structure (Backend)
Remove the nested `event` wrapper and send events directly:

```javascript
// OLD (nested):
broadcastToStudy(studyId, {
  type: 'event',
  event: { type: 'move.played', seq: 1, ... }
});

// NEW (direct):
broadcastToStudy(studyId, {
  type: 'move.played',
  seq: 1,
  ...
});
```

### Step 2: Add Username to All Events
Include user info in every event:

```javascript
{
  type: 'move.played',
  seq: 1,
  studyId: '...',
  chapterId: '...',
  user: {
    id: ws.userId,
    username: ws.username  // Need to store this on connection
  },
  ...
}
```

### Step 3: Add Presence System
Track connected users per study:

```javascript
const studyUsers = new Map(); // studyId -> Set of {userId, username, ws}

function handleJoinStudy(ws, studyId) {
  // Add user to study
  if (!studyUsers.has(studyId)) {
    studyUsers.set(studyId, new Set());
  }
  studyUsers.get(studyId).add({
    userId: ws.userId,
    username: ws.username,
    ws: ws
  });
  
  // Broadcast user.joined
  broadcastToStudy(studyId, {
    type: 'user.joined',
    studyId,
    user: {
      id: ws.userId,
      username: ws.username
    },
    users: Array.from(studyUsers.get(studyId)).map(u => ({
      id: u.userId,
      username: u.username
    }))
  });
}
```

### Step 4: Fix Frontend Event Handling
Make handlers persistent and always active:

```javascript
// In useEffect, set up handlers ONCE
useEffect(() => {
  if (!websocketService.isConnected()) return;
  
  const handleMoveEvent = (data) => {
    console.log('🎯 Move event:', data);
    
    // Skip if from self
    if (data.user?.id === localStorage.getItem('userId')) {
      console.log('⏭️ Skipping self-sent move');
      return;
    }
    
    // Apply if same study and chapter
    if (data.studyId === activeStudy && data.chapterId === activeChapter?._id) {
      setTree(data.tree);
      setGameTree(data.tree);
      setCurrentPath(data.currentPath || []);
      setCurrentMoveIndex(data.currentMoveIndex || 0);
      setBoardPosition(data.fen);
      setLocalBoardPosition(data.fen);
      setRefreshKey(prev => prev + 1);
    }
  };
  
  const handleChapterEvent = (data) => {
    console.log('📖 Chapter event:', data);
    
    // Skip if from self
    if (data.user?.id === localStorage.getItem('userId')) {
      console.log('⏭️ Skipping self-sent chapter change');
      return;
    }
    
    // Always switch if different chapter
    if (data.studyId === activeStudy && data.chapterId !== activeChapter?._id) {
      handleChapterSelect(data.chapterId);
    }
  };
  
  const handleUserJoined = (data) => {
    console.log('👤 User joined:', data);
    setConnectedUsers(data.users || []);
  };
  
  const handleUserLeft = (data) => {
    console.log('👋 User left:', data);
    setConnectedUsers(data.users || []);
  };
  
  // Register handlers
  websocketService.setCallbacks({
    'move.played': handleMoveEvent,
    'chapter.selected': handleChapterEvent,
    'chapter.changed': handleChapterEvent,
    'user.joined': handleUserJoined,
    'user.left': handleUserLeft
  });
  
  return () => {
    // Cleanup
  };
}, [activeStudy, activeChapter]); // Re-register when these change
```

### Step 5: Add Connected Users UI
Display users under chapters:

```jsx
{/* Connected Users */}
<div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
  <h4 className="text-sm font-semibold text-blue-800 mb-2">
    Connected Users ({connectedUsers.length})
  </h4>
  <div className="space-y-1">
    {connectedUsers.map(user => (
      <div key={user.id} className="flex items-center space-x-2 text-sm">
        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
        <span className="text-gray-700">{user.username}</span>
        {user.id === localStorage.getItem('userId') && (
          <span className="text-xs text-gray-500">(You)</span>
        )}
      </div>
    ))}
  </div>
</div>
```

## 📋 Implementation Checklist

### Backend (`server.js`)
- [ ] Store username on WebSocket connection
- [ ] Add studyUsers Map for presence tracking
- [ ] Update handleJoinStudy to broadcast user.joined with full user list
- [ ] Update handleLeaveStudy to broadcast user.left with updated user list
- [ ] Change all broadcasts to send events directly (not nested in 'event' wrapper)
- [ ] Add user info to all events (move.played, chapter.changed, etc.)
- [ ] Implement handleUserJoined and handleUserLeft

### Frontend (`websocketService.js`)
- [ ] Update onmessage to handle direct event types (not nested)
- [ ] Add routing for user.joined and user.left

### Frontend (`EnhancedChessStudyWithSimplifiedBoard.jsx`)
- [ ] Add connectedUsers state
- [ ] Set up persistent event handlers in useEffect
- [ ] Add self-event filtering (skip events from own userId)
- [ ] Make chapter selection handler always active (no one-time limit)
- [ ] Add Connected Users UI component
- [ ] Update move broadcast to include user info
- [ ] Update chapter broadcast to include user info

### Testing
- [ ] Two users join same study → both see each other in Connected Users
- [ ] User A plays e4 → User B sees it instantly
- [ ] User A plays e5 → User B sees it instantly
- [ ] User A plays Nf3 → User B sees it instantly (continuous, not just first 2)
- [ ] User A selects Chapter 2 → User B switches to Chapter 2
- [ ] User A selects Chapter 3 → User B switches to Chapter 3 (continuous)
- [ ] User A selects Chapter 1 → User B switches to Chapter 1 (no limit)
- [ ] User disconnects → removed from Connected Users list

## 🎯 Expected Result

**Continuous, bidirectional, real-time sync:**
- ✅ Every move syncs instantly
- ✅ Every chapter change syncs instantly
- ✅ No "only works once" issues
- ✅ Usernames visible
- ✅ Presence tracking
- ✅ Self-event filtering
- ✅ Sub-200ms latency








