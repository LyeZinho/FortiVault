# ⚙️ Guia de Configuração - FortiVault

Este guia cobre todas as configurações disponíveis no FortiVault para personalizar sua experiência de uso.

## 🏗️ Configuração da Arquitetura

### Estrutura de Diretórios

```
FortiVault/
├── app/                    # Frontend Next.js
│   ├── api/               # API Routes
│   ├── backup/            # Página de backup
│   ├── settings/          # Página de configurações
│   ├── sync/              # Página de sincronização
│   └── vault/             # Cofre principal
├── backend/               # Backend Python
│   ├── database/          # Banco de dados SQLite
│   ├── backups/           # Backups automáticos
│   └── *.py              # Módulos Python
├── components/            # Componentes React
├── docs/                  # Documentação
└── lib/                   # Utilitários e API client
```

## 🔧 Configurações do Backend

### Arquivo de Configuração: `backend/.env`

Crie um arquivo `.env` na pasta `backend/` com as seguintes configurações:

```env
# Configurações do Servidor
HOST=127.0.0.1
PORT=8000
DEBUG=True
LOG_LEVEL=info

# Configurações de Segurança
SECRET_KEY=your-super-secret-key-here-min-32-chars
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
REFRESH_TOKEN_EXPIRE_DAYS=30

# Configurações do Banco de Dados
DATABASE_PATH=backend/database/vault.db
BACKUP_DIRECTORY=backend/backups
AUTO_BACKUP_ENABLED=True
AUTO_BACKUP_INTERVAL_HOURS=24

# Configurações de Criptografia
ENCRYPTION_ALGORITHM=AES-256-GCM
PASSWORD_HASH_ALGORITHM=argon2
ARGON2_TIME_COST=3
ARGON2_MEMORY_COST=65536
ARGON2_PARALLELISM=1

# Configurações 2FA
TOTP_ISSUER_NAME=FortiVault
TOTP_VALIDITY_WINDOW=1
BACKUP_CODES_COUNT=10

# Configurações CORS
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
ALLOW_CREDENTIALS=True

# Configurações de Rate Limiting
RATE_LIMIT_PER_MINUTE=60
RATE_LIMIT_BURST=100

# Configurações de Sincronização P2P
P2P_ENABLED=True
P2P_PORT=8001
P2P_DISCOVERY_INTERVAL=30
P2P_ENCRYPTION_ENABLED=True
```

### Configurações Avançadas do Backend

#### Segurança

```python
# backend/config.py
SECURITY_CONFIG = {
    # Headers de Segurança
    "headers": {
        "X-Frame-Options": "DENY",
        "X-Content-Type-Options": "nosniff",
        "X-XSS-Protection": "1; mode=block",
        "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
        "Referrer-Policy": "origin-when-cross-origin"
    },
    
    # Configurações de Sessão
    "session": {
        "secure": True,
        "httponly": True,
        "samesite": "strict",
        "max_age": 3600
    },
    
    # Configurações de Rate Limiting
    "rate_limiting": {
        "login_attempts": 5,
        "lockout_duration": 900,  # 15 minutos
        "password_reset_attempts": 3
    }
}
```

#### Banco de Dados

```python
# Configurações do SQLite
DATABASE_CONFIG = {
    "sqlite": {
        "path": "backend/database/vault.db",
        "timeout": 30,
        "check_same_thread": False,
        "isolation_level": "IMMEDIATE"
    },
    
    # Configurações de Backup
    "backup": {
        "auto_backup": True,
        "interval_hours": 24,
        "max_backups": 30,
        "compression": True,
        "encryption": True
    }
}
```

## 🎨 Configurações do Frontend

### Arquivo de Configuração: `next.config.mjs`

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configurações de Build
  output: 'standalone',
  experimental: {
    serverComponentsExternalPackages: ['sqlite3']
  },
  
  // Configurações de Imagem
  images: {
    unoptimized: true,
    domains: ['localhost', '127.0.0.1']
  },
  
  // Configurações PWA
  pwa: {
    dest: 'public',
    register: true,
    skipWaiting: true,
    disable: process.env.NODE_ENV === 'development'
  },
  
  // Headers de Segurança
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline';",
          },
        ],
      },
    ]
  },
}

export default nextConfig
```

### Configurações do Tailwind CSS

```typescript
// tailwind.config.ts
const config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // Cores personalizadas
      colors: {
        brand: {
          50: '#eff6ff',
          500: '#3b82f6',
          900: '#1e3a8a',
        }
      },
      
      // Animações personalizadas
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.2s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    require("@tailwindcss/forms"),
  ],
}
```

## 🛡️ Configurações de Segurança

### Configurações de Autenticação

```typescript
// lib/auth-config.ts
export const authConfig = {
  // JWT
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: '1h',
    refreshExpiresIn: '30d',
    algorithm: 'HS256'
  },
  
  // 2FA
  totp: {
    issuer: 'FortiVault',
    window: 1,
    digits: 6,
    period: 30,
    algorithm: 'SHA1'
  },
  
  // Políticas de Senha
  password: {
    minLength: 12,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSymbols: true,
    maxAge: 90, // dias
    preventReuse: 12 // últimas senhas
  },
  
  // Bloqueio de Conta
  lockout: {
    maxAttempts: 5,
    lockoutDuration: 15, // minutos
    resetAfter: 24 // horas
  }
}
```

### Configurações de Criptografia

```typescript
// lib/crypto-config.ts
export const cryptoConfig = {
  // Criptografia Simétrica
  symmetric: {
    algorithm: 'AES-256-GCM',
    keySize: 32,
    ivSize: 12,
    tagSize: 16
  },
  
  // Hash de Senhas
  password: {
    algorithm: 'argon2id',
    timeCost: 3,
    memoryCost: 65536,
    parallelism: 1,
    saltSize: 32
  },
  
  // Derivação de Chaves
  keyDerivation: {
    algorithm: 'PBKDF2',
    iterations: 100000,
    saltSize: 32,
    keySize: 32
  }
}
```

## 📱 Configurações de Interface

### Configurações do Usuário

```typescript
// types/settings.ts
export interface UserSettings {
  // Aparência
  theme: 'light' | 'dark' | 'system'
  accentColor: string
  fontSize: 'small' | 'medium' | 'large'
  compactMode: boolean
  
  // Segurança
  autoLock: boolean
  autoLockTime: number // minutos
  biometricAuth: boolean
  clipboardTimeout: number // segundos
  
  // Backup
  autoBackup: boolean
  backupFrequency: 'daily' | 'weekly' | 'monthly'
  backupLocation: string
  backupEncryption: boolean
  
  // Sincronização
  syncEnabled: boolean
  syncFrequency: number // minutos
  conflictResolution: 'manual' | 'local' | 'remote'
  
  // Notificações
  passwordExpiry: boolean
  weakPasswordAlert: boolean
  breachAlert: boolean
  backupReminder: boolean
  
  // Produtividade
  showPasswordStrength: boolean
  passwordHistory: boolean
  autoFill: boolean
  searchHistory: boolean
}
```

### Configurações de Acessibilidade

```css
/* globals.css */
:root {
  /* Configurações de Contraste */
  --high-contrast: 0; /* 0 = normal, 1 = alto contraste */
  --focus-ring-width: 2px;
  --focus-ring-color: hsl(210, 100%, 50%);
  
  /* Configurações de Movimento */
  --motion-reduce: 0; /* 0 = normal, 1 = reduzido */
  --animation-duration: 0.3s;
  --transition-duration: 0.2s;
}

/* Alto Contraste */
@media (prefers-contrast: high) {
  :root {
    --high-contrast: 1;
  }
}

/* Movimento Reduzido */
@media (prefers-reduced-motion: reduce) {
  :root {
    --motion-reduce: 1;
    --animation-duration: 0.01ms;
    --transition-duration: 0.01ms;
  }
}
```

## 🔄 Configurações de Sincronização P2P

### Configuração da Descoberta de Dispositivos

```typescript
// lib/p2p-config.ts
export const p2pConfig = {
  // Descoberta
  discovery: {
    enabled: true,
    port: 8001,
    interval: 30000, // ms
    timeout: 5000, // ms
    protocols: ['tcp', 'udp']
  },
  
  // Pareamento
  pairing: {
    codeLength: 16,
    codeExpiry: 300, // segundos
    maxDevices: 10,
    requireConfirmation: true
  },
  
  // Sincronização
  sync: {
    automatic: true,
    interval: 300000, // 5 minutos
    conflictResolution: 'timestamp',
    compressionEnabled: true,
    encryptionEnabled: true
  },
  
  // Segurança
  security: {
    certificateValidation: true,
    encryptionAlgorithm: 'AES-256-GCM',
    signatureAlgorithm: 'ECDSA',
    keyExchange: 'ECDH'
  }
}
```

## 📊 Configurações de Backup

### Políticas de Backup

```typescript
// lib/backup-config.ts
export const backupConfig = {
  // Backup Automático
  automatic: {
    enabled: true,
    frequency: 'daily', // daily, weekly, monthly
    time: '02:00', // HH:MM
    retention: 30, // dias
    compression: true,
    encryption: true
  },
  
  // Backup Manual
  manual: {
    includeSettings: true,
    includePasswords: true,
    includeFolders: true,
    includeAuditLog: false,
    format: 'encrypted-json'
  },
  
  // Localização
  storage: {
    local: {
      enabled: true,
      path: './backups',
      maxSize: '100MB'
    },
    cloud: {
      enabled: false,
      provider: null, // 'dropbox', 'gdrive', 's3'
      encryptionKey: null
    }
  },
  
  // Verificação
  verification: {
    enabled: true,
    checkIntegrity: true,
    testRestore: false
  }
}
```

## 🎯 Configurações de Performance

### Otimizações do Frontend

```typescript
// next.config.mjs optimizations
const nextConfig = {
  // Otimizações de Build
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
    reactRemoveProperties: true
  },
  
  // Compressão
  compress: true,
  poweredByHeader: false,
  
  // Otimizações de Bundle
  webpack: (config) => {
    config.optimization.splitChunks = {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
        },
      },
    }
    return config
  }
}
```

### Otimizações do Backend

```python
# backend/performance.py
PERFORMANCE_CONFIG = {
    # Configurações de Cache
    "cache": {
        "enabled": True,
        "backend": "memory",  # memory, redis
        "ttl": 300,  # 5 minutos
        "max_size": 1000
    },
    
    # Pool de Conexões
    "database": {
        "pool_size": 20,
        "max_overflow": 30,
        "pool_timeout": 30,
        "pool_recycle": 3600
    },
    
    # Configurações de Worker
    "workers": {
        "count": 4,
        "worker_class": "uvicorn.workers.UvicornWorker",
        "max_requests": 1000,
        "max_requests_jitter": 100
    }
}
```

## 🔧 Configurações Específicas por Ambiente

### Desenvolvimento

```env
# .env.development
NODE_ENV=development
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
NEXT_PUBLIC_APP_ENV=development
NEXT_PUBLIC_DEBUG=true
```

### Produção

```env
# .env.production
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://api.fortivault.com
NEXT_PUBLIC_APP_ENV=production
NEXT_PUBLIC_DEBUG=false
```

### Teste

```env
# .env.test
NODE_ENV=test
NEXT_PUBLIC_API_URL=http://127.0.0.1:8001
NEXT_PUBLIC_APP_ENV=test
NEXT_PUBLIC_DEBUG=true
```

## 📱 Configurações PWA

### Manifest

```json
{
  "name": "FortiVault - Password Manager",
  "short_name": "FortiVault",
  "description": "Secure, offline-first password manager",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0f172a",
  "theme_color": "#3b82f6",
  "orientation": "portrait-primary",
  "categories": ["productivity", "security", "utilities"],
  "screenshots": [
    {
      "src": "/screenshots/desktop.png",
      "sizes": "1280x720",
      "type": "image/png",
      "form_factor": "wide"
    }
  ]
}
```

## 🔍 Validação da Configuração

### Script de Verificação

```bash
#!/bin/bash
# scripts/validate-config.sh

echo "🔍 Validando configuração do FortiVault..."

# Verificar Node.js
node_version=$(node --version)
echo "✅ Node.js: $node_version"

# Verificar Python
python_version=$(python --version)
echo "✅ Python: $python_version"

# Verificar dependências
echo "📦 Verificando dependências..."
pnpm list --depth=0 > /dev/null && echo "✅ Frontend dependencies OK"
pip list > /dev/null && echo "✅ Backend dependencies OK"

# Verificar configurações
echo "⚙️ Verificando configurações..."
[ -f "backend/.env" ] && echo "✅ Backend .env found" || echo "❌ Backend .env missing"
[ -f ".env.local" ] && echo "✅ Frontend .env found" || echo "ℹ️ Frontend .env optional"

echo "✅ Validação concluída!"
```

## 🆘 Próximos Passos

Após configurar o FortiVault:

1. 🔒 Revise as [Configurações de Segurança](./security.md)
2. 📖 Consulte a [Documentação da API](./api-reference.md)
3. 🛠️ Explore o [Guia de Desenvolvimento](./development.md)

---

**⚙️ Configuração completa!** Seu FortiVault está otimizado e seguro.
