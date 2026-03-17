// FortiVault Browser Extension - Popup Script

// WebSocket connection to desktop app
let ws = null;
let connected = false;
let secrets = [];

// DOM Elements
const statusBadge = document.getElementById('status-badge');
const statusDot = statusBadge.querySelector('.status-dot');
const statusText = statusBadge.querySelector('.status-text');
const searchInput = document.getElementById('search-input');
const secretsList = document.getElementById('secrets-list');
const vaultSelect = document.getElementById('vault-select');
const btnLock = document.getElementById('btn-lock');
const btnRefresh = document.getElementById('btn-refresh');
const btnOpenApp = document.getElementById('btn-open-app');
const btnSettings = document.getElementById('btn-settings');

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  await connectToDesktop();
  await loadSecrets();
  setupEventListeners();
});

// Connect to desktop app via WebSocket
async function connectToDesktop() {
  return new Promise((resolve) => {
    try {
      // In browser extensions, we use chrome.runtime.connectNative
      // For now, try WebSocket to localhost
      ws = new WebSocket('ws://127.0.0.1:9876');
      
      ws.onopen = () => {
        console.log('[FortiVault] Connected to desktop');
        setConnected(true);
        resolve();
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
        setConnected(false);
      };
      
      ws.onerror = (error) => {
        console.error('[FortiVault] WebSocket error:', error);
        setConnected(false);
      };
      
      // Timeout fallback
      setTimeout(() => {
        if (!connected) {
          console.log('[FortiVault] Connection timeout, using offline mode');
          resolve();
        }
      }, 3000);
      
    } catch (e) {
      console.error('[FortiVault] Connection failed:', e);
      resolve();
    }
  });
}

// Set connection status
function setConnected(isConnected) {
  connected = isConnected;
  if (isConnected) {
    statusBadge.classList.add('connected');
    statusText.textContent = 'CONNECTED';
  } else {
    statusBadge.classList.remove('connected');
    statusText.textContent = 'OFFLINE';
  }
}

// Handle WebSocket messages
function handleMessage(msg) {
  switch (msg.type) {
    case 'PONG':
      setConnected(true);
      break;
    case 'SECRETS_RESPONSE':
      secrets = msg.secrets || [];
      renderSecrets();
      break;
    case 'DECRYPT_RESPONSE':
      // Handle decrypted secret
      break;
    case 'ERROR':
      console.error('[FortiVault] Error:', msg.message);
      break;
  }
}

// Request secrets from desktop
async function loadSecrets() {
  if (!connected || !ws) {
    // Load demo data for offline mode
    secrets = getDemoSecrets();
    renderSecrets();
    return;
  }
  
  const vaultId = vaultSelect.value;
  
  ws.send(JSON.stringify({
    type: 'SECRETS_REQUEST',
    vault_id: vaultId,
    env_prefix: null
  }));
}

// Demo secrets for offline mode
function getDemoSecrets() {
  return [
    { id: '1', title: 'GITHUB_TOKEN', type: 'API_KEY', value: 'ghp_xxxxxxxxxxxx', username: null },
    { id: '2', title: 'AWS_ACCESS_KEY', type: 'LOGIN', value: 'AKIAIOSFODNN7EXAMPLE', username: 'admin' },
    { id: '3', title: 'STRIPE_KEY', type: 'API_KEY', value: 'sk_live_xxxxxxxxxxxx', username: null },
    { id: '4', title: 'DATABASE_URL', type: 'ENV_VAR', value: 'postgresql://localhost:5432/db', username: null },
  ];
}

// Render secrets list
function renderSecrets() {
  const filtered = filterSecrets(searchInput.value);
  
  if (filtered.length === 0) {
    secretsList.innerHTML = `
      <div class="empty-state">
        <span>NO SECRETS FOUND</span>
      </div>
    `;
    return;
  }
  
  secretsList.innerHTML = filtered.map(secret => `
    <div class="secret-item" data-id="${secret.id}" data-type="${secret.type}">
      <div class="secret-header">
        <span class="secret-type">${secret.type}</span>
      </div>
      <div class="secret-title">${secret.title}</div>
      <div class="secret-fields">
        ${secret.username ? `
          <button class="field-btn copy-field" data-field="username" data-secret="${secret.id}">
            USER
          </button>
        ` : ''}
        <button class="field-btn copy-field" data-field="value" data-secret="${secret.id}">
          ${secret.type === 'LOGIN' ? 'PASS' : 'COPY'}
        </button>
      </div>
    </div>
  `).join('');
  
  // Add copy event listeners
  document.querySelectorAll('.copy-field').forEach(btn => {
    btn.addEventListener('click', handleCopyField);
  });
}

// Filter secrets by search
function filterSecrets(query) {
  if (!query) return secrets;
  const q = query.toLowerCase();
  return secrets.filter(s => 
    s.title.toLowerCase().includes(q) ||
    s.type.toLowerCase().includes(q)
  );
}

// Copy field to clipboard
async function handleCopyField(e) {
  const secretId = e.target.dataset.secret;
  const field = e.target.dataset.field;
  const secret = secrets.find(s => s.id === secretId);
  
  if (!secret) return;
  
  const value = field === 'username' ? secret.username : secret.value;
  if (!value) return;
  
  try {
    await navigator.clipboard.writeText(value);
    e.target.textContent = 'COPIED!';
    setTimeout(() => {
      e.target.textContent = field === 'username' ? 'USER' : 'COPY';
    }, 1500);
  } catch (err) {
    console.error('[FortiVault] Copy failed:', err);
  }
}

// Setup event listeners
function setupEventListeners() {
  // Search
  searchInput.addEventListener('input', () => {
    renderSecrets();
  });
  
  // Vault change
  vaultSelect.addEventListener('change', () => {
    loadSecrets();
  });
  
  // Lock button
  btnLock.addEventListener('click', async () => {
    // Send lock command to desktop
    if (connected && ws) {
      ws.send(JSON.stringify({ type: 'LOCK' }));
    }
    // Clear clipboard
    await navigator.clipboard.writeText('');
  });
  
  // Refresh button
  btnRefresh.addEventListener('click', () => {
    loadSecrets();
  });
  
  // Open app button
  btnOpenApp.addEventListener('click', () => {
    // Open the desktop app via native messaging
    if (chrome.runtime?.id) {
      chrome.runtime.sendNativeMessage('application.id', { action: 'open' });
    }
  });
  
  // Settings button
  btnSettings.addEventListener('click', () => {
    // Open settings in new tab or show settings view
    chrome.runtime.sendMessage({ action: 'openSettings' });
  });
}

// Message handler for background script
chrome.runtime?.onMessage?.addListener((message, sender, sendResponse) => {
  if (message.action === 'getSecrets') {
    sendResponse({ secrets });
  } else if (message.action === 'getStatus') {
    sendResponse({ connected });
  }
  return true;
});
