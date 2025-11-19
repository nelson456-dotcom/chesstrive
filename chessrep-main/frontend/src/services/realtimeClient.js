/**
 * Rock-Solid Real-Time Client with Sequenced Protocol
 * 
 * Features:
 * - Guaranteed delivery with ACKs and retries
 * - Ordered event processing with monotonic sequence numbers
 * - Out-of-order event buffering
 * - Automatic reconnection with catch-up sync
 * - Outbox for un-ACKed messages with resend on reconnect
 * - Presence tracking
 * - Diagnostic logging
 */

class RealtimeClient {
  constructor(websocketService) {
    this.websocketService = websocketService;
    this.outbox = new Map(); // clientMsgId -> {message, timestamp, retries, resolve, reject, timeout}
    this.lastAppliedSeq = 0; // Last successfully applied sequence number
    this.eventBuffer = []; // Out-of-order events waiting for correct seq
    this.callbacks = {}; // Event type -> handler function
    this.studyId = null;
    this.chapterId = null;
    this.maxBufferTime = 2000; // 2 seconds max wait for out-of-order events
    this.ackTimeout = 5000; // 5 seconds to wait for ACK
    this.recentEvents = []; // Last 3 events for diagnostics
    this.isConnected = false;
    this.pendingSync = false;
    this.syncInFlight = false;
    this.lastSyncReason = null;
    this.lastSeqByStudy = new Map();
    this.maxRetries = 3;
    
    this.requestSync = this.requestSync.bind(this);

    console.log('📱 RealtimeClient initialized');
    
    // Register with websocketService for message routing
    this.websocketService.setRealtimeClient(this);
  }
  
  /**
   * Set the active study and reset sequence tracking
   */
  setStudy(studyId) {
    console.log(`📱 RealtimeClient: Setting study to ${studyId}`);
    
    if (this.studyId === studyId) {
      console.log('📱 RealtimeClient: Study unchanged, ensuring sync is up to date');
      this.pendingSync = true;
      this.requestSync('study-refresh');
      return;
    }
    
    if (this.studyId && this.studyId !== studyId) {
      this.lastSeqByStudy.set(this.studyId, this.lastAppliedSeq);
    }
    
    // Reject any pending promises from the previous study
    this.outbox.forEach(item => {
      if (item.timeout) {
        clearTimeout(item.timeout);
      }
      item.reject(new Error('Study changed before ACK was received'));
    });
    this.outbox.clear();
    
    this.studyId = studyId;
    this.eventBuffer = [];
    this.recentEvents = [];
    this.pendingSync = true;
    this.syncInFlight = false;
    this.lastAppliedSeq = this.lastSeqByStudy.get(studyId) || 0;
    
    this.requestSync('study-set');
  }
  
  /**
   * Set the active chapter (for scoped event listening)
   */
  setChapter(chapterId) {
    console.log(`📱 RealtimeClient: Setting chapter to ${chapterId}`);
    this.chapterId = chapterId;
    if (chapterId) {
      this.pendingSync = true;
      this.requestSync('chapter-set');
    }
  }
  
  /**
   * Send a message with guaranteed delivery (returns promise that resolves on ACK)
   */
  send(type, payload) {
    if (!this.websocketService.isConnected()) {
      console.warn(`⚠️ Cannot send ${type} - WebSocket not connected`);
      return Promise.reject(new Error('WebSocket not connected'));
    }
    
    const clientMsgId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const message = {
      type,
      payload: {
        ...payload,
        clientMsgId,
        studyId: this.studyId,
        chapterId: this.chapterId
      }
    };
    
    console.log(`📤 Sending ${type} with clientMsgId=${clientMsgId}`, payload);
    
    return new Promise((resolve, reject) => {
      // Store in outbox
      const outboxItem = {
        message,
        timestamp: Date.now(),
        retries: 0,
        resolve,
        reject,
        timeout: null
      };
      
      this.outbox.set(clientMsgId, outboxItem);
      
      // Send via WebSocket
      this.websocketService.send(message);
      
      // Set timeout for ACK
      outboxItem.timeout = setTimeout(() => {
        this.retryOutboxItem(clientMsgId, `${type}-ack-timeout`);
      }, this.ackTimeout);
    });
  }
  
  /**
   * Handle incoming WebSocket message
   */
  onMessage(data) {
    const { type } = data;
    
    console.log(`📥 Received message type=${type}`, data);
    
    // Handle direct event types (move.played, chapter.changed, etc.)
    if (type && (type.includes('.') || type === 'user.joined' || type === 'user.left' || type === 'presence.update')) {
      // This is a direct event with seq
      this.handleEvent(data);
      return;
    }
    
    // Handle wrapped messages
    switch (type) {
      case 'ack':
        this.handleAck(data);
        break;
      case 'event':
        this.handleEvent(data.event);
        break;
      case 'sync.response':
        this.handleSync(data);
        break;
      default:
        console.log(`📥 Unknown message type: ${type}`);
    }
  }
  
  /**
   * Handle ACK from server
   */
  handleAck(data) {
    const { clientMsgId, seq, nodeId } = data;
    
    console.log(`✅ Received ACK: clientMsgId=${clientMsgId}, seq=${seq}`);
    
    const item = this.outbox.get(clientMsgId);
    if (item) {
      // Clear timeout
      if (item.timeout) {
        clearTimeout(item.timeout);
      }
      
      // Resolve promise
      item.resolve({ seq, nodeId, ...data });
      
      // Remove from outbox
      this.outbox.delete(clientMsgId);
    }
  }
  
  /**
   * Handle sequenced event from server
   */
  handleEvent(event) {
    const seq = event.seq;
    const type = event.type;
    
    console.log(`📊 Received event: type=${type}, seq=${seq}, lastAppliedSeq=${this.lastAppliedSeq}`);
    
    // If no seq, apply immediately (backwards compatibility or non-sequenced events)
    if (seq === undefined || seq === null) {
      console.log(`⚡ Event ${type} has no seq, applying immediately`);
      this.applyEvent(event);
      return;
    }
    
    // Check if this is the next expected event
    if (seq === this.lastAppliedSeq + 1) {
      // Apply immediately
      this.applyEvent(event);
      this.lastAppliedSeq = seq;
      
      // Try to flush buffer
      this.flushBuffer();
    } else if (seq > this.lastAppliedSeq + 1) {
      // Out of order - buffer it
      console.log(`⏳ Event seq=${seq} is out of order, buffering (expected ${this.lastAppliedSeq + 1})`);
      this.eventBuffer.push(event);
      
      // Set timeout to flush buffer even if we don't get all events
      setTimeout(() => this.flushBuffer(), this.maxBufferTime);
      
      if (!this.pendingSync) {
        this.pendingSync = true;
      }
      this.requestSync('gap-detected');
    } else {
      // Duplicate or stale event - ignore
      console.log(`⏭️ Ignoring stale/duplicate event seq=${seq} (lastApplied=${this.lastAppliedSeq})`);
    }
  }
  
  /**
   * Apply an event to the UI
   */
  applyEvent(event) {
    const type = event.type;
    const seq = event.seq || 'N/A';
    
    console.log(`✨ Applying event: type=${type}, seq=${seq}`);
    
    // Add to recent events for diagnostics
    this.recentEvents.push({ type, seq, timestamp: Date.now() });
    if (this.recentEvents.length > 3) {
      this.recentEvents.shift();
    }
    
    // Update diagnostic callback if registered
    if (this.callbacks['diagnostics.update']) {
      this.callbacks['diagnostics.update'](this.getDiagnostics());
    }
    
    const handler = this.callbacks[type];
    if (handler) {
      try {
        handler(event);
      } catch (err) {
        console.error(`❌ Error applying event ${type}:`, err);
      }
    } else {
      console.warn(`⚠️ No handler for event type: ${type}`);
      console.warn(`⚠️ Available handlers:`, Object.keys(this.callbacks));
    }
  }
  
  /**
   * Flush buffered out-of-order events
   */
  flushBuffer() {
    if (this.eventBuffer.length === 0) return;
    
    console.log(`🔄 Flushing buffer (${this.eventBuffer.length} events)`);
    
    // Sort by seq
    this.eventBuffer.sort((a, b) => a.seq - b.seq);
    
    // Apply all sequential events
    while (this.eventBuffer.length > 0) {
      const next = this.eventBuffer[0];
      
      if (next.seq === this.lastAppliedSeq + 1) {
        // This is the next expected event
        this.eventBuffer.shift();
        this.applyEvent(next);
        this.lastAppliedSeq = next.seq;
      } else if (next.seq <= this.lastAppliedSeq) {
        // Stale event - remove it
        console.log(`⏭️ Removing stale event seq=${next.seq} from buffer`);
        this.eventBuffer.shift();
      } else {
        // Still waiting for earlier events
        console.log(`⏸️ Buffer flush paused, waiting for seq=${this.lastAppliedSeq + 1}, next in buffer is ${next.seq}`);
        break;
      }
    }
  }
  
  /**
   * Handle sync response after reconnection
   */
  handleSync(data) {
    const { studyId, currentSeq, activeChapterId, chapters, events, presence } = data;
    
    console.log(`🔄 Sync response: currentSeq=${currentSeq}, ${events.length} missed events`);
    this.syncInFlight = false;
    
    // Apply missed events in order
    const sortedEvents = events.sort((a, b) => a.seq - b.seq);
    sortedEvents.forEach(event => {
      if (event.seq > this.lastAppliedSeq) {
        this.applyEvent(event);
        this.lastAppliedSeq = event.seq;
      }
    });
    
    // Update to current seq
    this.lastAppliedSeq = Math.max(this.lastAppliedSeq, currentSeq);
    this.lastSeqByStudy.set(studyId, this.lastAppliedSeq);
    
    // Flush any buffered events that arrived before sync completed
    this.flushBuffer();
    
    if (this.pendingSync) {
      const followUpReason = this.lastSyncReason ? `${this.lastSyncReason}-queued` : 'queued';
      this.pendingSync = false;
      setTimeout(() => this.requestSync(followUpReason), 0);
    }
    
    // Notify callback if registered
    if (this.callbacks['sync.complete']) {
      this.callbacks['sync.complete']({ activeChapterId, chapters, presence });
    }
  }
  
  /**
   * Handle connection state change
   */
  onConnectionChange(connected) {
    console.log(`🔌 Connection state changed: ${connected}`);
    this.isConnected = connected;
    
    if (connected) {
      // On reconnect, request sync
      this.onReconnect();
    } else {
      this.syncInFlight = false;
    }
  }
  
  /**
   * Handle reconnection - request sync and resend un-ACKed messages
   */
  onReconnect() {
    if (!this.studyId) {
      console.log('🔄 Reconnected but no active study, skipping sync');
      return;
    }
    
    console.log(`🔄 Reconnecting - requesting sync from seq=${this.lastAppliedSeq}`);
    this.pendingSync = true;
    this.syncInFlight = false;
    this.requestSync('reconnect');
    
    // Resend un-ACKed messages
    console.log(`📤 Resending ${this.outbox.size} un-ACKed messages`);
    this.outbox.forEach((item, clientMsgId) => {
      this.retryOutboxItem(clientMsgId, 'reconnect', false);
    });
  }
  
  retryOutboxItem(clientMsgId, reason = 'retry', shouldIncrement = true) {
    const item = this.outbox.get(clientMsgId);
    if (!item) {
      return;
    }
    
    const canSend = this.websocketService && typeof this.websocketService.isConnected === 'function' && this.websocketService.isConnected();
    if (!canSend) {
      console.log(`⏸️ Cannot resend ${item.message.type}, waiting for reconnect (${reason})`);
      if (item.timeout) {
        clearTimeout(item.timeout);
      }
      item.timeout = setTimeout(() => {
        this.retryOutboxItem(clientMsgId, reason, shouldIncrement);
      }, this.ackTimeout);
      return;
    }
    
    if (shouldIncrement) {
      item.retries += 1;
    }
    
    if (item.retries > this.maxRetries) {
      console.error(`❌ Max retries reached for ${item.message.type}, clientMsgId=${clientMsgId} (${reason})`);
      if (item.timeout) {
        clearTimeout(item.timeout);
      }
      item.reject(new Error(`ACK timeout for ${item.message.type}`));
      this.outbox.delete(clientMsgId);
      return;
    }
    
    console.log(`📤 Retry ${item.retries}/${this.maxRetries} for ${item.message.type}, clientMsgId=${clientMsgId} (${reason})`);
    
    if (item.timeout) {
      clearTimeout(item.timeout);
    }
    
    this.websocketService.send(item.message);
    
    item.timeout = setTimeout(() => {
      this.retryOutboxItem(clientMsgId, `${item.message.type}-ack-timeout`);
    }, this.ackTimeout);
  }
  
  /**
   * Set event handlers
   */
  setCallbacks(callbacks) {
    this.callbacks = { ...this.callbacks, ...callbacks };
    console.log(`📱 Registered callbacks for: ${Object.keys(callbacks).join(', ')}`);
  }
  
  /**
   * Get diagnostic information
   */
  getDiagnostics() {
    return {
      studyId: this.studyId,
      chapterId: this.chapterId,
      lastAppliedSeq: this.lastAppliedSeq,
      recentEvents: this.recentEvents,
      outboxSize: this.outbox.size,
      bufferSize: this.eventBuffer.length,
      isConnected: this.isConnected
    };
  }
  
  /**
   * Get current state (legacy compatibility)
   */
  getState() {
    return this.getDiagnostics();
  }

  requestSync(reason = 'manual') {
    if (!this.studyId) {
      return;
    }
    
    if (!this.websocketService || typeof this.websocketService.isConnected !== 'function' || !this.websocketService.isConnected()) {
      console.log(`🔄 Sync (${reason}) scheduled once connection restores`);
      this.pendingSync = true;
      this.lastSyncReason = reason;
      return;
    }
    
    if (this.syncInFlight) {
      console.log(`🔄 Sync already in-flight, queueing another run (${reason})`);
      this.pendingSync = true;
      this.lastSyncReason = reason;
      return;
    }
    
    this.syncInFlight = true;
    this.pendingSync = false;
    this.lastSyncReason = reason;
    
    console.log(`🔄 Requesting sync (${reason}) for study ${this.studyId} from seq=${this.lastAppliedSeq}`);
    this.websocketService.send({
      type: 'sync.request',
      payload: {
        studyId: this.studyId,
        lastSeq: this.lastAppliedSeq
      }
    });
  }
}

export default RealtimeClient;

