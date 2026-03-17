// FortiVault Browser Extension - Background Service Worker

// Connection state
let ws = null;
let reconnectInterval = null;
let messageQueue = [];

// WebSocket URL for desktop connection
const WS_URL = 'ws://127.0.0.1:9876';

// Initialize on install
chrome.runtime.onInstalled.addListener(() => {
  console.log('[FortiVault] Extension installed');
  connectToDesktop();
  setupAlarm();
});

// Initialize on startup
chrome.runtime.onStartup.addListener(() => {
  console.log('[FortiVault] Extension started');
  connectToDesktop();
});

// Connect to desktop app
function connectToDesktop() {
  if (ws && ws.readyState === WebSocket.OPEN) {
    return;
  }
  
  try {
    ws = new WebSocket(WS_URL);
    
    ws.onopen = () => {
      console.log('[FortiVault] Connected to desktop');
      flushMessageQueue();
      updateBadge('connected');
    };
    
    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        handleMessage(msg);
      } catch (e) {
        console.error('[FortiVault] Parse error:', e);
      }
    };
    
    ws.onclose = () => {
      console.log('[FortiVault] Disconnected from desktop');
      updateBadge('disconnected');
      scheduleReconnect();
    };
    
    ws.onerror = (error) => {
      console.error('[FortiVault] WebSocket error:', error);
      updateBadge('error');
    };
    
  } catch (e) {
    console.error('[FortiVault] Connection failed:', e);
    scheduleReconnect();
  }
}

// Schedule reconnection
function scheduleReconnect() {
  if (reconnectInterval) {
    clearInterval(reconnectInterval);
  }
  reconnectInterval = setInterval(() => {
    console.log('[FortiVault] Attempting reconnect...');
    connectToDesktop();
  }, 5000);
}

// Handle incoming messages
function handleMessage(msg) {
  switch (msg.type) {
    case 'PONG':
      break;
    case 'SECRETS_RESPONSE':
      // Broadcast to popup
      chrome.runtime.sendMessage({
        action: 'secretsUpdated',
        secrets: msg.secrets
      });
      break;
    case 'DECRYPT_RESPONSE':
      // Send decrypted value to popup
      chrome.runtime.sendMessage({
        action: 'secretDecrypted',
        secret: msg.plaintext
      });
      break;
  }
}

// Send message to desktop
function sendToDesktop(msg) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(msg));
  } else {
    // Queue message for later
    messageQueue.push(msg);
  }
}

// Flush queued messages
function flushMessageQueue() {
  while (messageQueue.length > 0) {
    const msg = messageQueue.shift();
    sendToDesktop(msg);
  }
}

// Update badge status
function updateBadge(status) {
  const icons = {
    connected: { text: '✓', color: '#22C55E' },
    disconnected: { text: '!', color: '#666666' },
    error: { text: '✕', color: '#EF4444' }
  };
  
  const config = icons[status] || icons.disconnected;
  
  chrome.action.setBadgeBackgroundColor({ color: config.color });
  chrome.action.setBadgeText({ text: config.text });
}

// Setup periodic sync alarm
function setupAlarm() {
  // Sync every 5 minutes
  chrome.alarms.create('sync', {
    delayInMinutes: 5,
    periodInMinutes: 5
  });
}

// Handle alarm
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'sync') {
    // Request fresh secrets
    sendToDesktop({
      type: 'SYNC_REQUEST',
      timestamp: Date.now()
    });
  }
});

// Message listener for popup and content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.action) {
    case 'getSecrets':
      sendToDesktop({
        type: 'SECRETS_REQUEST',
        vault_id: message.vaultId || 'personal'
      });
      sendResponse({ status: 'requested' });
      break;
      
    case 'decryptSecret':
      sendToDesktop({
        type: 'DECRYPT_REQUEST',
        encrypted_blob: message.encryptedBlob
      });
      sendResponse({ status: 'requested' });
      break;
      
    case 'getStatus':
      sendResponse({ 
        connected: ws && ws.readyState === WebSocket.OPEN 
      });
      break;
      
    case 'openSettings':
      chrome.runtime.openOptionsPage();
      break;
      
    case 'fillForm':
      // Forward to content script
      chrome.tabs.sendMessage(sender.tab.id, {
        action: 'fillForm',
        data: message.data
      });
      sendResponse({ status: 'sent' });
      break;
  }
  
  return true;
});

// Context menu for auto-fill
chrome.contextMenus?.create({
  id: 'fortivault-fill',
  title: 'FortiVault: Auto-fill',
  contexts: ['editable']
});

chrome.contextMenus?.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'fortivault-fill') {
    chrome.tabs.sendMessage(tab.id, {
      action: 'showAutoFillMenu'
    });
  }
});

console.log('[FortiVault] Background service worker initialized');
