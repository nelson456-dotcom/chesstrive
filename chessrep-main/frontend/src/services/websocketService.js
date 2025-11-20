const WS_SERVER_URL = process.env.REACT_APP_WS_URL || 'ws://localhost:3001';
let ws = null;
let callbacks = {};
let reconnectAttempts = 0;
const maxReconnectAttempts = 5;
let reconnectTimeout = null;
let realtimeClient = null; // Will be set by EnhancedChessStudy

const websocketService = {
  connect: (token) => {
    console.log('=== WEBSOCKET CONNECT ATTEMPT ===');
    console.log('Token:', token);
    console.log('Current WebSocket state:', ws ? ws.readyState : 'null');
    
    if (ws && ws.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected.');
      return;
    }

    const wsUrl = `${WS_SERVER_URL}?token=${token}`;
    console.log('Connecting to WebSocket URL:', wsUrl);
    
    if (!token) {
      console.error('No token provided for WebSocket connection');
      return;
    }
    
    try {
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('=== WEBSOCKET CONNECTED ===');
        console.log('WebSocket URL:', wsUrl);
        console.log('WebSocket ready state:', ws ? ws.readyState : 'null');
        reconnectAttempts = 0;
        if (callbacks.onConnectionChange) callbacks.onConnectionChange(true);
        
        // Notify RealtimeClient of connection
        if (realtimeClient) {
          realtimeClient.onConnectionChange(true);
        }
      };

      ws.onclose = (event) => {
        console.log('=== WEBSOCKET DISCONNECTED ===');
        console.log('WebSocket disconnected:', event.code, event.reason);
        console.log('WebSocket ready state:', ws ? ws.readyState : 'null');
        console.log('WebSocket URL:', wsUrl);
        if (callbacks.onConnectionChange) callbacks.onConnectionChange(false);
        
        // Notify RealtimeClient of disconnection
        if (realtimeClient) {
          realtimeClient.onConnectionChange(false);
        }
        
        // Attempt to reconnect if not manually closed
        if (event.code !== 1000 && reconnectAttempts < maxReconnectAttempts) {
          reconnectAttempts++;
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 10000);
          console.log(`Attempting to reconnect in ${delay}ms (attempt ${reconnectAttempts}/${maxReconnectAttempts})`);
          
          reconnectTimeout = setTimeout(() => {
            websocketService.connect(token);
          }, delay);
        }
      };

      ws.onerror = (error) => {
        console.error('=== WEBSOCKET ERROR ===');
        console.error('WebSocket error:', error);
        console.error('WebSocket ready state:', ws ? ws.readyState : 'null');
        console.error('WebSocket URL:', wsUrl);
        if (callbacks.onConnectionChange) callbacks.onConnectionChange(false);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const { type } = data;
          
          console.log('📨 ========== WebSocket Message ==========');
          console.log('📨 Type:', type);
          console.log('📨 Full data:', JSON.stringify(data, null, 2));
          console.log('📨 Registered callbacks:', Object.keys(callbacks));
          
          // Handle ACKs
          if (type === 'ack') {
            console.log('✅ ACK received:', data);
            if (realtimeClient) {
              realtimeClient.onMessage(data);
            }
            return;
          }
          
          // Handle sync responses
          if (type === 'sync.response') {
            console.log('🔄 Sync response received');
            if (realtimeClient) {
              realtimeClient.onMessage(data);
            }
            return;
          }
          
          // Handle direct events (move.played, chapter.changed, presence.update, etc.)
          if (type && type.includes('.')) {
            console.log('📨 Direct event detected:', type);
            
            let handled = false;
            
            // Always forward to RealtimeClient first for sequencing & ordering
            if (realtimeClient) {
              console.log('📨 Forwarding direct event to RealtimeClient');
              realtimeClient.onMessage(data);
              handled = true;
            }
            
            // Then invoke any legacy callbacks if registered
            const callback = callbacks[type];
            if (callback) {
              console.log('✅ Calling legacy callback for:', type);
              callback(data);
              handled = true;
            }
            
            if (!handled) {
              console.warn(`⚠️ No handler registered for event type: ${type}`);
              console.warn(`⚠️ Available callbacks:`, Object.keys(callbacks));
            }
            return;
          }
          
          // Legacy callback handling (for backwards compatibility)
          const { payload } = data;
          console.log('📨 Legacy event, checking switch for type:', type);
          
          switch (type) {
            case 'move-received':
              console.log('📨 Calling onMoveReceived');
              if (callbacks.onMoveReceived) callbacks.onMoveReceived(payload);
              break;
            case 'position-received':
              if (callbacks.onPositionReceived) callbacks.onPositionReceived(payload);
              break;
            case 'chapter-received':
              if (callbacks.onChapterReceived) callbacks.onChapterReceived(payload);
              break;
            case 'chapter-created':
              if (callbacks.onChapterCreated) callbacks.onChapterCreated(payload);
              break;
            case 'chapter-switched':
              if (callbacks.onChapterSwitched) callbacks.onChapterSwitched(payload);
              break;
            case 'user-joined':
              console.log('👤 User joined event');
              if (callbacks.onUserJoined) callbacks.onUserJoined(payload);
              break;
            case 'user-left':
              console.log('👋 User left event');
              if (callbacks.onUserLeft) callbacks.onUserLeft(payload);
              break;
            default:
              console.warn('❌ Unknown WebSocket message type:', type);
          }
        } catch (err) {
          console.error('❌ Error parsing WebSocket message:', err);
          console.error('❌ Raw event data:', event.data);
        }
      };
    } catch (error) {
      console.error('=== WEBSOCKET CREATION ERROR ===');
      console.error('Error creating WebSocket:', error);
      console.error('Token:', token);
      console.error('WebSocket URL:', wsUrl);
      if (callbacks.onConnectionChange) callbacks.onConnectionChange(false);
    }
  },

  disconnect: () => {
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout);
      reconnectTimeout = null;
    }
    
    if (ws) {
      ws.close(1000, 'Manual disconnect');
      ws = null;
    }
  },

  setCallbacks: (newCallbacks) => {
    callbacks = { ...callbacks, ...newCallbacks };
  },

  joinStudy: (studyId, username = null) => {
    console.log('=== JOINING STUDY VIA WEBSOCKET ===');
    console.log('Study ID:', studyId);
    console.log('Username:', username);
    console.log('WebSocket state:', ws ? ws.readyState : 'null');
    
    if (ws && ws.readyState === WebSocket.OPEN) {
      const message = {
        type: 'join-study',
        payload: { studyId, username }
      };
      console.log('Sending join-study message:', message);
      ws.send(JSON.stringify(message));
      console.log('Join-study message sent successfully');
    } else {
      console.warn('WebSocket not connected, cannot join study');
    }
  },

  leaveStudy: (studyId) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'leave-study',
        payload: { studyId }
      }));
    }
  },

  broadcastMove: (studyId, chapterId, moveData, position) => {
    console.log('=== BROADCASTING MOVE VIA WEBSOCKET ===');
    console.log('WebSocket state:', ws ? ws.readyState : 'null');
    console.log('Study ID:', studyId);
    console.log('Chapter ID:', chapterId);
    console.log('Move Data:', moveData);
    console.log('Position:', position);
    
    if (ws && ws.readyState === WebSocket.OPEN) {
      const message = {
        type: 'move-made',
        payload: { studyId, chapterId, moveData, position }
      };
      console.log('Sending WebSocket message:', message);
      ws.send(JSON.stringify(message));
      console.log('WebSocket message sent successfully');
    } else {
      console.warn('WebSocket not connected, cannot broadcast move');
    }
  },

  broadcastPosition: (studyId, chapterId, position, gameState) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'position-updated',
        payload: { studyId, chapterId, position, gameState }
      }));
    }
  },

  broadcastChapterChange: (studyId, chapterId, chapterName) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'chapter-changed',
        payload: { studyId, chapterId, chapterName }
      }));
    }
  },

  broadcastChapterCreated: (studyId, chapterId, chapterName, chapterData = null) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'chapter-created',
        payload: { 
          studyId, 
          chapterId, 
          chapterName,
          chapterData,
          timestamp: new Date().toISOString()
        }
      }));
    }
  },

  broadcastChapterSwitched: (studyId, chapterId, chapterName) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'chapter-switched',
        payload: { studyId, chapterId, chapterName }
      }));
    }
  },

  isConnected: () => {
    return ws && ws.readyState === WebSocket.OPEN;
  },
  
  // Generic send method for RealtimeClient
  send: (message) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket not connected, cannot send message');
    }
  },
  
  // Get raw WebSocket for RealtimeClient
  getSocket: () => ws,
  
  // Set RealtimeClient instance
  setRealtimeClient: (client) => {
    realtimeClient = client;
    console.log('📱 RealtimeClient registered with websocketService');
  }
};

export default websocketService;
