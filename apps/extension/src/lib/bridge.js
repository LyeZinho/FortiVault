// FortiVault Extension - WebSocket Bridge
// Shared utility for connecting to desktop app

class DesktopBridge {
  constructor(url = 'ws://127.0.0.1:9876') {
    this.url = url;
    this.ws = null;
    this.connected = false;
    this.messageHandlers = new Map();
    this.queue = [];
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }
  
  // Connect to desktop
  connect() {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url);
        
        this.ws.onopen = () => {
          console.log('[FortiVault Bridge] Connected');
          this.connected = true;
          this.reconnectAttempts = 0;
          this.flushQueue();
          this.emit('connected');
          resolve();
        };
        
        this.ws.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data);
            this.handleMessage(msg);
          } catch (e) {
            console.error('[FortiVault Bridge] Parse error:', e);
          }
        };
        
        this.ws.onclose = () => {
          console.log('[FortiVault Bridge] Disconnected');
          this.connected = false;
          this.emit('disconnected');
          this.scheduleReconnect();
        };
        
        this.ws.onerror = (error) => {
          console.error('[FortiVault Bridge] Error:', error);
          reject(error);
        };
        
        // Timeout
        setTimeout(() => {
          if (!this.connected) {
            reject(new Error('Connection timeout'));
          }
        }, 5000);
        
      } catch (e) {
        reject(e);
      }
    });
  }
  
  // Schedule reconnection
  scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('[FortiVault Bridge] Max reconnect attempts reached');
      return;
    }
    
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    this.reconnectAttempts++;
    
    setTimeout(() => {
      console.log(`[FortiVault Bridge] Reconnect attempt ${this.reconnectAttempts}`);
      this.connect().catch(() => {});
    }, delay);
  }
  
  // Handle incoming message
  handleMessage(msg) {
    const handler = this.messageHandlers.get(msg.type);
    if (handler) {
      handler(msg);
    }
    
    // Also emit to general listeners
    this.emit(msg.type, msg);
  }
  
  // Register message handler
  on(type, handler) {
    this.messageHandlers.set(type, handler);
  }
  
  // Remove message handler
  off(type) {
    this.messageHandlers.delete(type);
  }
  
  // Emit event
  emit(type, data) {
    // Internal event system
  }
  
  // Send message
  send(msg) {
    const data = JSON.stringify(msg);
    
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(data);
    } else {
      this.queue.push(msg);
    }
  }
  
  // Flush queued messages
  flushQueue() {
    while (this.queue.length > 0) {
      const msg = this.queue.shift();
      this.send(msg);
    }
  }
  
  // Request secrets
  requestSecrets(vaultId = 'personal') {
    this.send({
      type: 'SECRETS_REQUEST',
      vault_id: vaultId,
      env_prefix: null
    });
  }
  
  // Request decryption
  requestDecrypt(encryptedBlob) {
    this.send({
      type: 'DECRYPT_REQUEST',
      encrypted_blob: encryptedBlob
    });
  }
  
  // Lock vault
  lock() {
    this.send({ type: 'LOCK' });
  }
  
  // Disconnect
  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.connected = false;
  }
}

// Export for use in popup and background
if (typeof window !== 'undefined') {
  window.DesktopBridge = DesktopBridge;
}
