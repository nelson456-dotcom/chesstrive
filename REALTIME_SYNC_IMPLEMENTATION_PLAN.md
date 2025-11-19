# Real-Time Sync Implementation Plan

## Problem Analysis

**Current Issues:**
1. Moves get lost (e.g., "Nf3 never arrived")
2. No sequencing - events can arrive out of order
3. No ACKs - no way to know if message was received
4. No reconnect sync - clients don't catch up after disconnect
5. Chapter creation requires page refresh
6. No guaranteed delivery

**Root Cause:** The current implementation is a simple broadcast system with no ordering, acknowledgments, or state synchronization.

---

## Solution: Authoritative Real-Time Protocol

### Architecture Overview

```
Client A                    Server (Authority)              Client B
  │                              │                             │
  │ 1. Move e4                   │                             │
  │ {clientMsgId: "abc123"}      │                             │
  ├──────────────────────────────>                             │
  │                              │                             │
  │                              │ 2. Assign seq=1             │
  │                              │ Store in study state        │
  │                              │                             │
  │ 3. ACK                       │ 4. Broadcast                │
  │ {clientMsgId, seq: 1}        │ {seq: 1, move: e4}          │
  <──────────────────────────────┼─────────────────────────────>
  │                              │                             │
  │ 5. Apply to UI               │                             │ 6. Apply to UI
  │ (replace temp with seq)      │                             │ (seq: 1)
```

### Key Components

#### 1. Server-Side State Store
```javascript
const studyStates = new Map(); // studyId -> StudyState

class StudyState {
  constructor(studyId) {
    this.studyId = studyId;
    this.seq = 0; // Monotonic sequence number
    this.activeChapterId = null;
    this.chapters = new Map(); // chapterId -> ChapterState
    this.events = []; // Recent events for catch-up (keep last 100)
  }
  
  nextSeq() {
    return ++this.seq;
  }
  
  addEvent(event) {
    this.events.push(event);
    if (this.events.length > 100) {
      this.events.shift();
    }
  }
}
```

#### 2. Event Types

**move.played**
```javascript
{
  type: 'move.played',
  seq: 123,
  studyId: 'study123',
  chapterId: 'chapter456',
  nodeId: 'node789', // Server-assigned unique ID
  san: 'Nf3',
  fen: 'rnbqkb1r/pppppppp/5n2/8/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq - 2 2',
  ply: 3,
  path: [0, 1, 2], // Path in game tree
  timestamp: 1234567890
}
```

**chapter.created**
```javascript
{
  type: 'chapter.created',
  seq: 124,
  studyId: 'study123',
  chapterId: 'chapter789',
  title: 'New Chapter',
  order: 3,
  timestamp: 1234567890
}
```

**chapter.changed**
```javascript
{
  type: 'chapter.changed',
  seq: 125,
  studyId: 'study123',
  chapterId: 'chapter456',
  timestamp: 1234567890
}
```

#### 3. Client-Side Outbox
```javascript
class RealtimeClient {
  constructor() {
    this.outbox = new Map(); // clientMsgId -> {message, timestamp, retries}
    this.expectedSeq = 0;
    this.eventBuffer = []; // Out-of-order events waiting for expectedSeq
    this.maxBufferTime = 2000; // 2 seconds max wait for out-of-order
  }
  
  send(message) {
    const clientMsgId = generateId();
    message.clientMsgId = clientMsgId;
    
    this.outbox.set(clientMsgId, {
      message,
      timestamp: Date.now(),
      retries: 0
    });
    
    this.ws.send(JSON.stringify(message));
    
    // Timeout for ACK
    setTimeout(() => this.checkAck(clientMsgId), 5000);
  }
  
  onAck(ack) {
    const { clientMsgId, seq } = ack;
    this.outbox.delete(clientMsgId);
    // Update UI with server-assigned seq/nodeId
  }
  
  onEvent(event) {
    if (event.seq === this.expectedSeq + 1) {
      this.applyEvent(event);
      this.expectedSeq = event.seq;
      this.flushBuffer();
    } else if (event.seq > this.expectedSeq + 1) {
      // Out of order - buffer it
      this.eventBuffer.push(event);
      setTimeout(() => this.flushBuffer(), this.maxBufferTime);
    }
    // else: duplicate or stale, ignore
  }
  
  applyEvent(event) {
    switch (event.type) {
      case 'move.played':
        this.applyMove(event);
        break;
      case 'chapter.created':
        this.applyChapterCreated(event);
        break;
      case 'chapter.changed':
        this.applyChapterChanged(event);
        break;
    }
  }
  
  flushBuffer() {
    this.eventBuffer.sort((a, b) => a.seq - b.seq);
    
    while (this.eventBuffer.length > 0) {
      const next = this.eventBuffer[0];
      if (next.seq === this.expectedSeq + 1) {
        this.eventBuffer.shift();
        this.applyEvent(next);
        this.expectedSeq = next.seq;
      } else {
        break;
      }
    }
  }
  
  onReconnect() {
    // Request snapshot and catch-up events
    this.send({
      type: 'sync.request',
      studyId: this.studyId,
      lastSeq: this.expectedSeq
    });
    
    // Resend un-ACKed messages
    this.outbox.forEach((item, clientMsgId) => {
      if (item.retries < 3) {
        item.retries++;
        this.ws.send(JSON.stringify(item.message));
      }
    });
  }
}
```

---

## Implementation Steps

### Phase 1: Backend - Server State & Sequencing

**File: `backend/server.js`**

Add study state management:
```javascript
// Study state store
const studyStates = new Map();

class StudyState {
  constructor(studyId) {
    this.studyId = studyId;
    this.seq = 0;
    this.activeChapterId = null;
    this.chapters = new Map();
    this.events = [];
  }
  
  nextSeq() {
    return ++this.seq;
  }
  
  addEvent(event) {
    event.seq = this.nextSeq();
    event.timestamp = Date.now();
    this.events.push(event);
    if (this.events.length > 100) {
      this.events.shift();
    }
    return event;
  }
  
  getEventsSince(seq) {
    return this.events.filter(e => e.seq > seq);
  }
}

function getOrCreateStudyState(studyId) {
  if (!studyStates.has(studyId)) {
    studyStates.set(studyId, new StudyState(studyId));
  }
  return studyStates.get(studyId);
}
```

Update message handlers:
```javascript
function handleMoveMade(ws, payload) {
  const { studyId, chapterId, clientMsgId, san, fen, path } = payload;
  const state = getOrCreateStudyState(studyId);
  
  // Create sequenced event
  const event = state.addEvent({
    type: 'move.played',
    studyId,
    chapterId,
    nodeId: generateNodeId(),
    san,
    fen,
    path,
    userId: ws.userId
  });
  
  // Send ACK to sender
  ws.send(JSON.stringify({
    type: 'ack',
    clientMsgId,
    seq: event.seq,
    nodeId: event.nodeId
  }));
  
  // Broadcast to all clients (including sender for confirmation)
  broadcastToStudy(studyId, {
    type: 'event',
    event
  });
}

function handleChapterCreated(ws, payload) {
  const { studyId, chapterId, title, clientMsgId } = payload;
  const state = getOrCreateStudyState(studyId);
  
  const event = state.addEvent({
    type: 'chapter.created',
    studyId,
    chapterId,
    title,
    order: state.chapters.size,
    userId: ws.userId
  });
  
  state.chapters.set(chapterId, { title, order: event.order });
  
  ws.send(JSON.stringify({
    type: 'ack',
    clientMsgId,
    seq: event.seq
  }));
  
  broadcastToStudy(studyId, {
    type: 'event',
    event
  });
}

function handleSyncRequest(ws, payload) {
  const { studyId, lastSeq } = payload;
  const state = getOrCreateStudyState(studyId);
  
  // Send snapshot + missed events
  ws.send(JSON.stringify({
    type: 'sync.response',
    studyId,
    currentSeq: state.seq,
    activeChapterId: state.activeChapterId,
    chapters: Array.from(state.chapters.entries()),
    events: state.getEventsSince(lastSeq)
  }));
}
```

### Phase 2: Frontend - Outbox & Sequencing

**File: `frontend/src/services/realtimeClient.js`** (NEW)

```javascript
class RealtimeClient {
  constructor(ws) {
    this.ws = ws;
    this.outbox = new Map();
    this.expectedSeq = 0;
    this.eventBuffer = [];
    this.callbacks = {};
    this.studyId = null;
  }
  
  setStudy(studyId) {
    this.studyId = studyId;
    this.expectedSeq = 0;
    this.eventBuffer = [];
  }
  
  send(type, payload) {
    const clientMsgId = `${Date.now()}-${Math.random()}`;
    const message = {
      type,
      payload: {
        ...payload,
        clientMsgId,
        studyId: this.studyId
      }
    };
    
    this.outbox.set(clientMsgId, {
      message,
      timestamp: Date.now(),
      retries: 0
    });
    
    this.ws.send(JSON.stringify(message));
    
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.outbox.delete(clientMsgId);
        reject(new Error('ACK timeout'));
      }, 5000);
      
      this.outbox.get(clientMsgId).resolve = (ack) => {
        clearTimeout(timeout);
        resolve(ack);
      };
    });
  }
  
  onMessage(data) {
    const { type, event, clientMsgId, seq } = data;
    
    switch (type) {
      case 'ack':
        this.handleAck(clientMsgId, seq, data);
        break;
      case 'event':
        this.handleEvent(event);
        break;
      case 'sync.response':
        this.handleSync(data);
        break;
    }
  }
  
  handleAck(clientMsgId, seq, data) {
    const item = this.outbox.get(clientMsgId);
    if (item && item.resolve) {
      item.resolve({ seq, ...data });
      this.outbox.delete(clientMsgId);
    }
  }
  
  handleEvent(event) {
    if (event.seq === this.expectedSeq + 1) {
      this.applyEvent(event);
      this.expectedSeq = event.seq;
      this.flushBuffer();
    } else if (event.seq > this.expectedSeq + 1) {
      this.eventBuffer.push(event);
      setTimeout(() => this.flushBuffer(), 2000);
    }
  }
  
  applyEvent(event) {
    const handler = this.callbacks[event.type];
    if (handler) {
      handler(event);
    }
  }
  
  flushBuffer() {
    this.eventBuffer.sort((a, b) => a.seq - b.seq);
    
    while (this.eventBuffer.length > 0) {
      const next = this.eventBuffer[0];
      if (next.seq === this.expectedSeq + 1) {
        this.eventBuffer.shift();
        this.applyEvent(next);
        this.expectedSeq = next.seq;
      } else {
        break;
      }
    }
  }
  
  onReconnect() {
    this.send('sync.request', {
      lastSeq: this.expectedSeq
    });
    
    this.outbox.forEach((item, clientMsgId) => {
      if (item.retries < 3) {
        item.retries++;
        this.ws.send(JSON.stringify(item.message));
      }
    });
  }
  
  setCallbacks(callbacks) {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }
}

export default RealtimeClient;
```

### Phase 3: Frontend - Integration

**File: `frontend/src/components/EnhancedChessStudyWithSimplifiedBoard.jsx`**

Replace WebSocket usage with RealtimeClient:

```javascript
import RealtimeClient from '../services/realtimeClient';

// In component
const realtimeClient = useRef(null);

useEffect(() => {
  if (websocketService.isConnected() && activeStudy) {
    realtimeClient.current = new RealtimeClient(websocketService.getSocket());
    realtimeClient.current.setStudy(activeStudy);
    
    realtimeClient.current.setCallbacks({
      'move.played': (event) => {
        if (event.chapterId === activeChapter?._id) {
          // Apply move to tree
          applyRemoteMove(event);
        }
      },
      'chapter.created': (event) => {
        // Add chapter to list without refresh
        addChapterToList(event);
      },
      'chapter.changed': (event) => {
        // Switch to new chapter
        handleChapterSelect(event.chapterId);
      }
    });
  }
}, [activeStudy, websocketService.isConnected()]);

// When making a move
const broadcastMove = async (san, fen, path) => {
  try {
    const ack = await realtimeClient.current.send('move-made', {
      chapterId: activeChapter._id,
      san,
      fen,
      path
    });
    
    // Update local temp nodeId with server's nodeId
    updateNodeId(tempNodeId, ack.nodeId);
  } catch (err) {
    console.error('Failed to broadcast move:', err);
    // Show error to user
  }
};
```

---

## Testing Plan

### Test 1: Rapid Moves
```
1. Open two browser windows (Client A, Client B)
2. Both join same study and chapter
3. Client A: Play e4, e5, Nf3 rapidly (< 1 second apart)
4. Expected: Client B sees all three moves in order within 200ms
5. Verify: Console shows seq=1, seq=2, seq=3 in order
```

### Test 2: Chapter Creation
```
1. Client A: Create new chapter "Test Chapter"
2. Expected: Client B sees new chapter appear instantly without refresh
3. Verify: Chapter list updates, no page reload
```

### Test 3: Chapter Switching
```
1. Client A: Switch to Chapter 2
2. Expected: Client B switches to Chapter 2 automatically
3. Verify: Board and notation update to Chapter 2 state
```

### Test 4: Reconnection
```
1. Client A and B playing moves
2. Client B: Disconnect network
3. Client A: Play 3 more moves
4. Client B: Reconnect network
5. Expected: Client B catches up with all 3 missed moves
6. Verify: No duplicates, correct order, correct final position
```

### Test 5: Out-of-Order Delivery
```
1. Simulate network delay (Chrome DevTools throttling)
2. Client A: Play 5 moves rapidly
3. Expected: Even if packets arrive out of order, Client B applies them in seq order
4. Verify: eventBuffer used, moves applied in correct order
```

---

## Acceptance Criteria

✅ All moves arrive in order with seq numbers
✅ ACKs received for all sent messages
✅ Out-of-order events buffered and applied correctly
✅ Reconnection triggers sync and catch-up
✅ Chapter creation appears instantly without refresh
✅ Chapter switching propagates to all clients
✅ No console errors
✅ Sub-200ms latency on local network
✅ No lost moves (Nf3 arrives!)
✅ No duplicate moves

---

## Implementation Priority

1. **Phase 1 (Backend)** - Critical foundation
2. **Phase 2 (RealtimeClient)** - Core protocol
3. **Phase 3 (Integration)** - Wire it up
4. **Testing** - Verify all scenarios

**Estimated Time:** 4-6 hours for complete implementation and testing

This is a proper real-time protocol with guaranteed delivery, ordering, and state synchronization!








