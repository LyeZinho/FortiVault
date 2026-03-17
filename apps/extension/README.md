# FortiVault Browser Extension

Zero-Knowledge Password Manager - Browser Extension

## Features

- 🔐 **Zero-Knowledge**: Secrets never leave your desktop app
- 🔌 **Desktop Integration**: Connects via WebSocket to FortiVault Desktop
- 🎨 **Neobrutalist Design**: Matches the FortiVault aesthetic
- 🔍 **Quick Search**: Fast access to your secrets
- 📝 **Auto-fill**: Automatically fill login forms
- 🔄 **Real-time Sync**: Automatic vault synchronization

## Supported Browsers

- ✅ Chrome (Manifest V3)
- ✅ Brave (Manifest V3)
- ✅ Firefox (Manifest V3)
- ✅ Edge (Manifest V3)

## Installation

### Chrome, Brave, Edge

1. Open `chrome://extensions` in your browser
2. Enable "Developer mode" (toggle in top-right)
3. Click "Load unpacked"
4. Select the `apps/extension` folder
5. Pin the extension to your toolbar

### Firefox

1. Open `about:debugging#/runtime/this-firefox`
2. Click "Load Temporary Add-on..."
3. Navigate to `apps/extension` folder
4. Select `manifest.json`
5. Note: For permanent installation, you need to sign the extension with Mozilla

## Usage

1. **Connect**: Make sure FortiVault Desktop is running
2. **Search**: Click the extension icon and search for secrets
3. **Copy**: Click on a secret to copy username or password
4. **Auto-fill**: Use `Ctrl+Shift+F` on any page to show the auto-fill menu

## Keyboard Shortcuts

- `Ctrl+Shift+F` - Show auto-fill menu on any page

## Architecture

```
┌─────────────────┐     WebSocket      ┌─────────────────┐
│  Browser        │◄─────────────────►│  Tauri Desktop  │
│  Extension      │                   │  (Rust/Crypto)  │
└─────────────────┘                   └─────────────────┘
       │
       ▼
┌─────────────────┐
│  Content       │
│  Script        │ ← Auto-fill, form detection
└─────────────────┘
```

## Development

The extension uses Manifest V3 and requires no build step for basic development.

To modify the extension:
1. Edit files in `src/popup/`, `src/background/`, or `src/content/`
2. Go to `chrome://extensions`
3. Click the reload button on the extension card

## Files

```
apps/extension/
├── manifest.json          # Extension manifest
├── src/
│   ├── popup/            # Extension popup UI
│   │   ├── popup.html
│   │   ├── popup.css
│   │   └── popup.js
│   ├── background/       # Background service worker
│   │   └── background.js
│   ├── content/         # Content script for pages
│   │   ├── content.js
│   │   └── content.css
│   └── lib/             # Shared utilities
│       └── bridge.js
└── icons/               # Extension icons
```
