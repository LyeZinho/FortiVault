// WebSocket client for communicating with FortiVault Desktop
// This bridge handles the Zero-Knowledge decryption flow

type WsMessageType = 
  | 'PING'
  | 'PONG' 
  | 'DECRYPT_REQUEST'
  | 'DECRYPT_RESPONSE'
  | 'KEY_EXCHANGE'
  | 'KEY_EXCHANGE_ACK'
  | 'PAIR_REQUEST'
  | 'PAIR_RESPONSE'
  | 'UNAUTHORIZED';

interface WsMessage {
  type: WsMessageType;
  [key: string]: any;
}

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

class DesktopBridge {
  private ws: WebSocket | null = null;
  private url: string;
  private status: ConnectionStatus = 'disconnected';
  private listeners: Map<string, Set<(data: any) => void>> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 2000;
  private sessionKey: string | null = null;

  constructor(url: string = 'ws://127.0.0.1:9876') {
    this.url = url;
  }

  // Event emitter methods
  on(event: string, callback: (data: any) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  off(event: string, callback: (data: any) => void) {
    this.listeners.get(event)?.delete(callback);
  }

  private emit(event: string, data: any) {
    this.listeners.get(event)?.forEach(cb => cb(data));
  }

  getStatus(): ConnectionStatus {
    return this.status;
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        resolve();
        return;
      }

      this.status = 'connecting';
      this.emit('statusChange', this.status);

      try {
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
          this.status = 'connected';
          this.reconnectAttempts = 0;
          this.emit('statusChange', this.status);
          this.startPingInterval();
          resolve();
        };

        this.ws.onclose = () => {
          this.status = 'disconnected';
          this.emit('statusChange', this.status);
          this.attemptReconnect();
        };

        this.ws.onerror = (error) => {
          this.status = 'error';
          this.emit('statusChange', this.status);
          this.emit('error', error);
          reject(error);
        };

        this.ws.onmessage = (event) => {
          try {
            const message: WsMessage = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (e) {
            console.error('Failed to parse message:', e);
          }
        };
      } catch (error) {
        this.status = 'error';
        this.emit('statusChange', this.status);
        reject(error);
      }
    });
  }

  private handleMessage(message: WsMessage) {
    switch (message.type) {
      case 'PONG':
        // Server heartbeat response
        break;
      case 'DECRYPT_RESPONSE':
        this.emit('decryptResponse', message);
        break;
      case 'KEY_EXCHANGE_ACK':
        this.sessionKey = message.session_key;
        this.emit('keyExchange', message);
        break;
      case 'UNAUTHORIZED':
        this.emit('unauthorized', message);
        break;
      default:
        console.log('Unknown message type:', message.type);
    }
  }

  private startPingInterval() {
    setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.send({ type: 'PING' });
      }
    }, 30000);
  }

  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => {
        this.connect().catch(() => {});
      }, this.reconnectDelay * this.reconnectAttempts);
    }
  }

  private send(message: WsMessage) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  // Public API methods

  async requestPairing(code: string): Promise<{ success: boolean; message?: string }> {
    return new Promise((resolve) => {
      const handler = (data: WsMessage) => {
        if (data.type === 'PAIR_RESPONSE') {
          this.off('pairResponse', handler);
          resolve({ success: data.success, message: data.message });
        }
      };
      this.on('pairResponse', handler);
      
      this.send({
        type: 'PAIR_REQUEST',
        code
      });

      // Timeout after 30 seconds
      setTimeout(() => {
        this.off('pairResponse', handler);
        resolve({ success: false, message: 'Pairing timeout' });
      }, 30000);
    });
  }

  async decryptSecret(encryptedBlob: string): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.sessionKey) {
        reject(new Error('Not paired with desktop. Please run pairing first.'));
        return;
      }

      const handler = (data: WsMessage) => {
        if (data.type === 'DECRYPT_RESPONSE') {
          this.off('decryptResponse', handler);
          if (data.error) {
            reject(new Error(data.error));
          } else {
            resolve(data.plaintext);
          }
        }
      };
      this.on('decryptResponse', handler);

      this.send({
        type: 'DECRYPT_REQUEST',
        encrypted_blob: encryptedBlob,
        session_key: this.sessionKey
      });

      // Timeout after 10 seconds
      setTimeout(() => {
        this.off('decryptResponse', handler);
        reject(new Error('Decryption timeout'));
      }, 10000);
    });
  }

  async generateKeyExchange(): Promise<string> {
    return new Promise((resolve, reject) => {
      const handler = (data: WsMessage) => {
        if (data.type === 'KEY_EXCHANGE_ACK') {
          this.off('keyExchange', handler);
          this.sessionKey = data.session_key;
          resolve(data.session_key);
        }
      };
      this.on('keyExchange', handler);

      // Generate ephemeral key pair (in real impl, use Web Crypto API)
      const ephemeralPublicKey = btoa(Math.random().toString(36));
      
      this.send({
        type: 'KEY_EXCHANGE',
        public_key: ephemeralPublicKey
      });

      setTimeout(() => {
        this.off('keyExchange', handler);
        reject(new Error('Key exchange timeout'));
      }, 10000);
    });
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.status = 'disconnected';
    this.sessionKey = null;
    this.emit('statusChange', this.status);
  }

  isConnected(): boolean {
    return this.status === 'connected';
  }

  hasSession(): boolean {
    return this.sessionKey !== null;
  }
}

// Singleton instance
export const desktopBridge = new DesktopBridge();

// React hooks for Svelte
import { writable } from 'svelte/store';

export const connectionStatus = writable<ConnectionStatus>('disconnected');
export const isPaired = writable<boolean>(false);

// Initialize connection status listener
desktopBridge.on('statusChange', (status: ConnectionStatus) => {
  connectionStatus.set(status);
});

desktopBridge.on('keyExchange', () => {
  isPaired.set(true);
});

export default desktopBridge;
