// FortiVault Browser Extension - Content Script
// Handles auto-fill and form detection on web pages

(function() {
  'use strict';
  
  // Listen for messages from background/popup
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch (message.action) {
      case 'fillForm':
        fillForm(message.data);
        sendResponse({ status: 'filled' });
        break;
        
      case 'showAutoFillMenu':
        showAutoFillMenu();
        sendResponse({ status: 'showing' });
        break;
        
      case 'detectForms':
        const forms = detectLoginForms();
        sendResponse({ forms });
        break;
    }
    return true;
  });
  
  // Detect login forms on the page
  function detectLoginForms() {
    const forms = [];
    
    // Find all forms
    document.querySelectorAll('form').forEach(form => {
      const inputs = {
        username: null,
        password: null,
        email: null
      };
      
      // Check input types
      form.querySelectorAll('input').forEach(input => {
        const type = input.type?.toLowerCase();
        const name = input.name?.toLowerCase() || '';
        const id = input.id?.toLowerCase() || '';
        const placeholder = input.placeholder?.toLowerCase() || '';
        
        if (type === 'password') {
          inputs.password = { element: input, form };
        } else if (
          type === 'email' ||
          name.includes('email') ||
          id.includes('email') ||
          placeholder.includes('email')
        ) {
          inputs.email = { element: input, form };
        } else if (
          type === 'text' ||
          type === 'tel' ||
          name.includes('user') ||
          name.includes('login') ||
          name.includes('username') ||
          id.includes('user') ||
          id.includes('login') ||
          placeholder.includes('user')
        ) {
          inputs.username = { element: input, form };
        }
      });
      
      if (inputs.password) {
        forms.push(inputs);
      }
    });
    
    // Also check for social login buttons
    const socialLogins = document.querySelectorAll('button, a').filter(el => {
      const text = el.textContent?.toLowerCase() || '';
      const href = el.href || '';
      return (
        text.includes('google') ||
        text.includes('github') ||
        text.includes('facebook') ||
        text.includes('twitter') ||
        text.includes('sign in with') ||
        href.includes('oauth') ||
        href.includes('auth')
      );
    });
    
    return { forms, socialLogins: socialLogins.length };
  }
  
  // Fill form with credentials
  function fillForm(data) {
    const { username, password, submit = true } = data;
    
    // Try to find username and password fields
    const inputs = {
      username: null,
      password: null
    };
    
    // Find password field
    document.querySelectorAll('input[type="password"]').forEach(input => {
      inputs.password = input;
      
      // Try to find associated username field
      const form = input.form;
      if (form) {
        form.querySelectorAll('input:not([type="password"])').forEach(inp => {
          const type = inp.type?.toLowerCase();
          const name = inp.name?.toLowerCase() || '';
          if (
            type === 'text' ||
            type === 'email' ||
            name.includes('user') ||
            name.includes('email')
          ) {
            inputs.username = inp;
          }
        });
      }
    });
    
    // Fill fields
    if (inputs.username && username) {
      inputs.username.value = username;
      inputs.username.dispatchEvent(new Event('input', { bubbles: true }));
      inputs.username.dispatchEvent(new Event('change', { bubbles: true }));
    }
    
    if (inputs.password && password) {
      inputs.password.value = password;
      inputs.password.dispatchEvent(new Event('input', { bubbles: true }));
      inputs.password.dispatchEvent(new Event('change', { bubbles: true }));
    }
    
    // Submit form if requested
    if (submit && inputs.password) {
      const form = inputs.password.form;
      if (form) {
        // Delay slightly to let events process
        setTimeout(() => {
          const submitBtn = form.querySelector(
            'button[type="submit"], input[type="submit"], button:not([type])'
          );
          if (submitBtn) {
            submitBtn.click();
          } else {
            form.submit();
          }
        }, 100);
      }
    }
    
    return { success: !!inputs.password };
  }
  
  // Show auto-fill menu
  function showAutoFillMenu() {
    // Remove existing menu
    const existing = document.getElementById('fortivault-autofill-menu');
    if (existing) {
      existing.remove();
    }
    
    // Create menu
    const menu = document.createElement('div');
    menu.id = 'fortivault-autofill-menu';
    menu.innerHTML = `
      <style>
        #fortivault-autofill-menu {
          position: fixed;
          z-index: 2147483647;
          background: #000;
          border: 3px solid #3B82F6;
          box-shadow: 6px 6px 0 #3B82F6;
          font-family: 'JetBrains Mono', monospace;
          min-width: 200px;
        }
        #fortivault-autofill-menu .menu-header {
          background: #F3F4F6;
          color: #000;
          padding: 8px 12px;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 1px;
          border-bottom: 2px solid #000;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        #fortivault-autofill-menu .menu-item {
          padding: 10px 12px;
          color: #fff;
          font-size: 11px;
          font-weight: bold;
          cursor: pointer;
          border-bottom: 1px solid #333;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        #fortivault-autofill-menu .menu-item:last-child {
          border-bottom: none;
        }
        #fortivault-autofill-menu .menu-item:hover {
          background: #3B82F6;
        }
        #fortivault-autofill-menu .menu-item .type {
          font-size: 8px;
          background: #333;
          padding: 2px 6px;
        }
        #fortivault-autofill-menu .close-btn {
          cursor: pointer;
          font-size: 14px;
        }
      </style>
      <div class="menu-header">
        <span>FORTIVAULT</span>
        <span class="close-btn" id="fortivault-close-menu">×</span>
      </div>
      <div class="menu-item" id="fortivault-search-btn">
        🔍 SEARCH VAULT
      </div>
      <div class="menu-item" id="fortivault-fill-btn">
        📝 AUTO-FILL
      </div>
    `;
    
    document.body.appendChild(menu);
    
    // Position menu near mouse or center
    menu.style.top = '50%';
    menu.style.left = '50%';
    menu.style.transform = 'translate(-50%, -50%)';
    
    // Close button
    menu.querySelector('#fortivault-close-menu').addEventListener('click', () => {
      menu.remove();
    });
    
    // Search button
    menu.querySelector('#fortivault-search-btn').addEventListener('click', () => {
      // Open popup
      chrome.runtime.sendMessage({ action: 'openPopup' });
      menu.remove();
    });
    
    // Auto-fill button
    menu.querySelector('#fortivault-fill-btn').addEventListener('click', () => {
      // Request credentials from background
      chrome.runtime.sendMessage({ 
        action: 'getCredentialsForSite',
        url: window.location.hostname
      }, (response) => {
        if (response && response.credentials) {
          fillForm(response.credentials);
        }
      });
      menu.remove();
    });
    
    // Close on click outside
    setTimeout(() => {
      document.addEventListener('click', function handler(e) {
        if (!menu.contains(e.target)) {
          menu.remove();
          document.removeEventListener('click', handler);
        }
      });
    }, 100);
  }
  
  // Keyboard shortcut: Ctrl+Shift+F to show menu
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'F') {
      e.preventDefault();
      showAutoFillMenu();
    }
  });
  
  console.log('[FortiVault] Content script loaded');
})();
