# FortiVault Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a complete Zero-Knowledge secrets management system with SvelteKit frontend, Rust/Tauri desktop app, and NestJS backend in a monorepo structure.

**Architecture:** Triad architecture where:
- SvelteKit handles UI and communicates with Desktop via local WebSocket
- Rust/Tauri desktop app acts as "Physical Vault" - handles all encryption/decryption locally
- NestJS backend manages RBAC, metadata, and audit queues
- Zero-Knowledge: Browser never sees private keys; Desktop app decrypts and sends only plaintext

**Tech Stack:** SvelteKit, Turborepo, TailwindCSS, NestJS, PostgreSQL, Redis, Drizzle, Rust, Tauri, BullMQ

---

## Phase 1: Monorepo Setup & Frontend Foundation

### Task 1.1: Initialize Turborepo Monorepo

**Files:**
- Create: `package.json` (root)
- Create: `turbo.json`
- Create: `pnpm-workspace.yaml`
- Create: `.gitignore` (root)

**Step 1: Create root package.json**

```json
{
  "name": "fortivault",
  "private": true,
  "scripts": {
    "build": "turbo build",
    "dev": "turbo dev",
    "lint": "turbo lint"
  },
  "devDependencies": {
    "turbo": "^2.0.0"
  },
  "packageManager": "pnpm@9.0.0"
}
```

**Step 2: Create turbo.json**

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    }
  }
}
```

**Step 3: Create pnpm-workspace.yaml**

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

---

### Task 1.2: Convert React Frontend to SvelteKit

**Files:**
- Create: `apps/web/package.json`
- Create: `apps/web/svelte.config.js`
- Create: `apps/web/vite.config.ts`
- Create: `apps/web/tsconfig.json`
- Create: `apps/web/src/app.html`
- Create: `apps/web/src/app.css` (from frontend-reference)
- Create: `apps/web/src/routes/+layout.svelte`
- Create: `apps/web/src/routes/+page.svelte` (Login)
- Create: `apps/web/src/routes/dashboard/+page.svelte`
- Create: `apps/web/src/routes/admin/+page.svelte`
- Create: `apps/web/src/lib/components/` (ported components)
- Create: `apps/web/src/lib/stores/` (Svelte stores)
- Create: `apps/web/src/lib/i18n/` (translations)

**Step 1: Create SvelteKit project structure**

```bash
cd apps/web
npm create svelte@latest . -- --template skeleton --types typescript --no-add-ons
```

**Step 2: Port Tailwind config to SvelteKit**

```css
/* apps/web/src/app.css */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;900&family=JetBrains+Mono:wght@400;700&display=swap');
@import 'tailwindcss';

@theme {
  --font-sans: "Inter", ui-sans-serif, system-ui, sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, SFMono-Regular, monospace;
  
  --color-neo-blue: #3B82F6;
  --color-neo-black: #000000;
  --color-neo-gray: #1A1A1A;
  --color-neo-white: #FFFFFF;
  
  --shadow-neo: 8px 8px 0px 0px rgba(255, 255, 255, 1);
  --shadow-neo-sm: 4px 4px 0px 0px rgba(255, 255, 255, 1);
  --shadow-neo-lg: 12px 12px 0px 0px rgba(255, 255, 255, 1);
}

@layer base {
  body {
    @apply bg-[#0A0A0A] text-white font-sans transition-colors duration-300;
  }
}

@utility neo-border {
  border: 4px solid #FFFFFF;
}

@utility neo-shadow {
  box-shadow: 8px 8px 0px 0px rgba(255, 255, 255, 1);
}

@utility neo-button {
  @apply neo-border font-bold px-4 py-2 transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none bg-neo-black text-white hover:bg-neo-blue;
}

@utility neo-card {
  @apply bg-[#1A1A1A] text-white neo-border neo-shadow p-6 transition-all;
}

@utility neo-input {
  @apply bg-[#262626] text-white neo-border p-4 font-mono font-bold text-lg focus:outline-none focus:bg-[#333333] focus:shadow-neo-sm transition-all placeholder:text-white/20;
}

@utility neo-badge {
  @apply neo-border px-2 py-1 font-mono font-bold text-xs uppercase;
}
```

**Step 3: Create Login page (from App.tsx login section)**

```svelte
<!-- apps/web/src/routes/+page.svelte -->
<script lang="ts">
  import { Shield, Lock, Key, Globe } from 'lucide-svelte';
  
  let masterPassword = '';
  let loginError = false;
  let language = 'pt';
  
  const translations = {
    en: { title: 'FORTIVAULT', loginTitle: 'SECURE ACCESS', loginSubtitle: 'ENTER YOUR MASTER PASSWORD TO DECRYPT THE VAULT', masterPassword: 'MASTER PASSWORD', unlock: 'UNLOCK VAULT', errorLogin: 'INVALID MASTER PASSWORD' },
    es: { title: 'FORTIVAULT', loginTitle: 'ACCESO SEGURO', loginSubtitle: 'INGRESE SU CONTRASEÑA MAESTRA PARA DESCRIPTOGRAFAR LA BÓVEDA', masterPassword: 'CONTRASEÑA MAESTRA', unlock: 'DESBLOQUEAR BÓVEDA', errorLogin: 'CONTRASEÑA MAESTRA INVÁLIDA' },
    pt: { title: 'FORTIVAULT', loginTitle: 'ACESSO SEGURO', loginSubtitle: 'DIGITE SUA SENHA MESTRA PARA DESCRIPTOGRAFAR O COFRE', masterPassword: 'SENHA MESTRA', unlock: 'DESBLOQUEAR COFRE', errorLogin: 'SENHA MESTRA INVÁLIDA' }
  };
  
  $: t = translations[language as keyof typeof translations];
  
  function handleLogin(e: Event) {
    e.preventDefault();
    if (masterPassword === 'fortivault2024') {
      window.location.href = '/dashboard';
    } else {
      loginError = true;
      setTimeout(() => loginError = false, 2000);
    }
  }
  
  function toggleLanguage() {
    const langs = ['en', 'es', 'pt'];
    const idx = langs.indexOf(language);
    language = langs[(idx + 1) % langs.length];
  }
</script>

<div class="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-6">
  <div class="w-full max-w-md flex flex-col gap-8">
    <div class="flex flex-col items-center gap-4">
      <div class="w-20 h-20 bg-neo-blue neo-border neo-shadow flex items-center justify-center">
        <Shield size={48} strokeWidth={3} class="text-white" />
      </div>
      <h1 class="text-5xl font-black tracking-tighter text-center">FORTIVAULT</h1>
      <p class="font-mono text-neo-blue font-bold text-xs uppercase tracking-widest">Zero-Knowledge Secure Storage</p>
    </div>

    <form on:submit={handleLogin} class="neo-card flex flex-col gap-6 p-8">
      <div class="flex flex-col gap-2">
        <h2 class="text-2xl font-black uppercase tracking-tight">{t.loginTitle}</h2>
        <p class="text-xs font-mono opacity-50">{t.loginSubtitle}</p>
      </div>

      <div class="flex flex-col gap-2">
        <label class="font-mono text-[10px] font-bold uppercase opacity-50">{t.masterPassword}</label>
        <div class="relative">
          <Lock class="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={20} />
          <input 
            type="password" 
            bind:value={masterPassword}
            class="w-full neo-input pl-12 {loginError ? 'border-red-500 bg-red-500/10' : ''}"
            placeholder="••••••••••••"
          />
        </div>
        {#if loginError}
          <p class="text-red-500 font-mono text-[10px] font-bold">{t.errorLogin}</p>
        {/if}
      </div>

      <button type="submit" class="neo-button bg-neo-blue text-white py-4 text-lg flex items-center justify-center gap-2">
        <Key size={20} strokeWidth={3} />
        {t.unlock}
      </button>

      <div class="flex justify-center gap-4 mt-2">
        <button type="button" on:click={toggleLanguage} class="text-[10px] font-mono font-bold opacity-50 hover:opacity-100 flex items-center gap-1">
          <Globe size={12} />
          {language.toUpperCase()}
        </button>
      </div>
    </form>

    <p class="text-center font-mono text-[10px] opacity-30 uppercase tracking-[0.2em]">
      AES-256-GCM • RSA-4096 • ARGON2ID
    </p>
  </div>
</div>
```

**Step 4: Create Dashboard layout**

```svelte
<!-- apps/web/src/routes/dashboard/+layout.svelte -->
<script lang="ts">
  import { Shield, Settings, LogOut, Globe, Monitor } from 'lucide-svelte';
  
  export let data;
  let isDesktopConnected = true;
  let currentView = 'VAULT';
</script>

<header class="h-16 bg-neo-gray border-b-4 border-white flex items-center justify-between px-6 z-20">
  <div class="flex items-center gap-2">
    <Shield class="text-neo-blue" size={28} strokeWidth={3} />
    <h1 class="font-mono font-black text-2xl tracking-tighter">FORTIVAULT</h1>
  </div>

  <div class="flex items-center gap-4">
    <div class="neo-border px-4 py-1 font-mono font-bold text-sm flex items-center gap-2 {isDesktopConnected ? 'bg-neo-blue' : 'bg-gray-500'}">
      <Monitor size={16} />
      STATUS: {isDesktopConnected ? 'DESKTOP_CONNECTED' : 'OFFLINE'}
    </div>
    
    <a href="/admin" class="p-2 hover:bg-white/5 transition-colors neo-border flex items-center gap-2 font-bold font-mono text-xs bg-neo-black">
      <Settings size={16} />
      ADMIN
    </a>
    
    <a href="/" class="p-2 hover:bg-white/5 transition-colors">
      <LogOut size={20} />
    </a>
  </div>
</header>

<div class="flex-1 flex overflow-hidden">
  <slot />
</div>
```

---

### Task 1.3: Create Shared UI Components Package

**Files:**
- Create: `packages/ui/package.json`
- Create: `packages/ui/src/index.ts`
- Create: `packages/ui/src/components/Button.svelte`
- Create: `packages/ui/src/components/Card.svelte`
- Create: `packages/ui/src/components/Input.svelte`
- Create: `packages/ui/src/components/Badge.svelte`
- Create: `packages/ui/src/components/Modal.svelte`

---

## Phase 2: Database Schema & Backend Foundation

### Task 2.1: Setup Drizzle Schema

**Files:**
- Create: `apps/api/package.json`
- Create: `apps/api/drizzle.config.ts`
- Create: `apps/api/src/db/schema.ts`
- Create: `apps/api/src/db/index.ts`
- Create: `apps/api/.env.example`

**Step 1: Create database schema**

```typescript
// apps/api/src/db/schema.ts
import { pgTable, uuid, varchar, text, timestamp, jsonb, boolean, pgEnum } from 'drizzle-orm/pg-core';

export const userStatusEnum = pgEnum('user_status', ['ACTIVE', 'PENDING_KEY_EXCHANGE', 'DEACTIVATED']);
export const vaultTypeEnum = pgEnum('vault_type', ['PERSONAL', 'DEPARTMENT', 'SHARED']);
export const secretTypeEnum = pgEnum('secret_type', ['LOGIN', 'API_KEY', 'ENV_VAR', 'SECURE_NOTE', 'CERTIFICATE']);

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  publicKey: text('public_key'),
  encryptedMasterKey: text('encrypted_master_key'), // Encrypted with user's public key
  status: userStatusEnum('status').default('PENDING_KEY_EXCHANGE'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const vaults = pgTable('vaults', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  type: vaultTypeEnum('type').notNull(),
  ownerId: uuid('owner_id').references(() => users.id),
  departmentId: uuid('department_id'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const vaultPermissions = pgTable('vault_permissions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  vaultId: uuid('vault_id').references(() => vaults.id).notNull(),
  role: varchar('role', { length: 50 }).default('VIEWER'), // ADMIN, EDITOR, VIEWER
  encryptedKey: text('encrypted_key'), // Vault key encrypted with user's public key
  createdAt: timestamp('created_at').defaultNow(),
});

export const secrets = pgTable('secrets', {
  id: uuid('id').defaultRandom().primaryKey(),
  vaultId: uuid('vault_id').references(() => vaults.id).notNull(),
  type: secretTypeEnum('type').notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  encryptedPayload: text('encrypted_payload').notNull(), // The actual secret, encrypted
  metadata: jsonb('metadata'), // Non-sensitive metadata (URL, provider, etc.)
  tags: text('tags').array(),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id),
  action: varchar('action', { length: 100 }).notNull(),
  target: varchar('target', { length: 255 }),
  targetType: varchar('target_type', { length: 50 }), // USER, VAULT, SECRET
  status: varchar('status', { length: 20 }).default('SUCCESS'), // SUCCESS, DENIED
  ipAddress: varchar('ip_address', { length: 45 }),
  metadata: jsonb('metadata'),
  timestamp: timestamp('timestamp').defaultNow(),
});

export const sessions = pgTable('sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});
```

---

### Task 2.2: Setup NestJS Backend

**Files:**
- Create: `apps/api/src/main.ts`
- Create: `apps/api/src/app.module.ts`
- Create: `apps/api/src/auth/auth.module.ts`
- Create: `apps/api/src/auth/auth.controller.ts`
- Create: `apps/api/src/auth/auth.service.ts`
- Create: `apps/api/src/vaults/vaults.module.ts`
- Create: `apps/api/src/secrets/secrets.module.ts`
- Create: `apps/api/src/users/users.module.ts`
- Create: `apps/api/src/audit/audit.module.ts`

**Step 1: Create main NestJS module**

```typescript
// apps/api/src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { VaultsModule } from './vaults/vaults.module';
import { SecretsModule } from './secrets/secrets.module';
import { AuditModule } from './audit/audit.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    UsersModule,
    VaultsModule,
    SecretsModule,
    AuditModule,
  ],
})
export class AppModule {}
```

---

## Phase 3: Rust/Tauri Desktop App

### Task 3.1: Initialize Tauri Project

**Files:**
- Create: `apps/desktop/Cargo.toml`
- Create: `apps/desktop/src/main.rs`
- Create: `apps/desktop/src/lib.rs`
- Create: `apps/desktop/src/crypto.rs`
- Create: `apps/desktop/src/websocket.rs`
- Create: `apps/desktop/tauri.conf.json`
- Create: `apps/desktop/package.json`

**Step 1: Create Cargo.toml**

```toml
[package]
name = "fortivault-desktop"
version = "0.1.0"
edition = "2021"

[lib]
name = "fortivault_desktop_lib"
crate-type = ["staticlib", "cdylib", "rlib"]

[dependencies]
tauri = { version = "2.0", features = ["devtools"] }
tauri-plugin-shell = "2.0"
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
tokio = { version = "1.0", features = ["full"] }
tokio-tungstenite = "0.21"
futures-util = "0.3"
aes-gcm = "0.10"
argon2 = "0.5"
rand = "0.8"
ring = "0.17"
base64 = "0.22"
uuid = { version = "1.0", features = ["v4"] }
tracing = "0.1"
tracing-subscriber = "0.3"
```

**Step 2: Create crypto module**

```rust
// apps/desktop/src/crypto.rs
use aes_gcm::{Aes256Gcm, Key, Nonce};
use aes_gcm::aead::{Aead, KeyInit};
use argon2::{Argon2, password_hash::{PasswordHasher, SaltString}};
use rand::rngs::OsRng;
use base64::{Engine as _, engine::general_purpose::STANDARD};

pub fn generate_keypair() -> (Vec<u8>, Vec<u8>) {
    // Generate RSA-like keypair using ring
    // This is a simplified version - real impl would use RSA/OAES
    let mut private_key = vec![0u8; 32];
    let mut public_key = vec![0u8; 32];
    rand::thread_rng().fill(&mut private_key);
    rand::thread_rng().fill(&mut public_key);
    (private_key, public_key)
}

pub fn derive_key(password: &str, salt: &[u8]) -> Vec<u8> {
    let argon2 = Argon2::default();
    let mut output = vec![0u8; 32];
    argon2.hash_password_into(password.as_bytes(), salt, &mut output).unwrap();
    output
}

pub fn encrypt_aes256gcm(plaintext: &[u8], key: &[u8]) -> Result<Vec<u8>, String> {
    let key = Key::<Aes256Gcm>::from_slice(key);
    let cipher = Aes256Gcm::new(key);
    
    let nonce_bytes: [u8; 12] = rand::thread_rng().gen();
    let nonce = Nonce::from_slice(&nonce_bytes);
    
    let ciphertext = cipher.encrypt(nonce, plaintext).map_err(|e| e.to_string())?;
    
    let mut result = nonce_bytes.to_vec();
    result.extend(ciphertext);
    Ok(result)
}

pub fn decrypt_aes256gcm(ciphertext: &[u8], key: &[u8]) -> Result<Vec<u8>, String> {
    let key = Key::<Aes256Gcm>::from_slice(key);
    let cipher = Aes256Gcm::new(key);
    
    if ciphertext.len() < 12 {
        return Err("Ciphertext too short".to_string());
    }
    
    let nonce = Nonce::from_slice(&ciphertext[..12]);
    let ciphertext = &ciphertext[12..];
    
    cipher.decrypt(nonce, ciphertext).map_err(|e| e.to_string())
}
```

---

## Phase 4: Feature Implementation (RF01-RF07)

### Task 4.1: RF01 - Identity & Pairing System

**Files:**
- Modify: `apps/api/src/auth/auth.controller.ts`
- Modify: `apps/api/src/auth/auth.service.ts`
- Modify: `apps/desktop/src/websocket.rs`
- Modify: `apps/web/src/lib/stores/auth.ts`

**Step 1: Implement ECDH handshake flow**

The flow:
1. Browser generates ephemeral keypair (P-256)
2. Sends public key to Desktop via WebSocket
3. Desktop generates its own ephemeral keypair
4. They exchange public keys and derive shared secret
5. Desktop encrypts session key with shared secret and sends back

---

### Task 4.2: RF02 - Vaults & Hierarchy

**Files:**
- Modify: `apps/api/src/vaults/vaults.controller.ts`
- Modify: `apps/api/src/db/schema.ts`
- Modify: `apps/web/src/routes/dashboard/+page.svelte`

**Step 1: Implement vault CRUD**

```typescript
// In vaults.controller.ts
@Controller('vaults')
export class VaultsController {
  constructor(private vaultsService: VaultsService) {}

  @Post()
  @UseGuards(AuthGuard)
  async createVault(@Body() createVaultDto: CreateVaultDto, @Req() req) {
    return this.vaultsService.create(req.user.id, createVaultDto);
  }

  @Get()
  @UseGuards(AuthGuard)
  async getVaults(@Req() req) {
    return this.vaultsService.findAllForUser(req.user.id);
  }
}
```

---

### Task 4.3: RF03 - Secret Types & Templates

**Files:**
- Modify: `apps/api/src/secrets/secrets.controller.ts`
- Create: `apps/web/src/lib/components/SecretCard.svelte`
- Create: `apps/web/src/lib/components/SecretModal.svelte`

**Step 1: Create secret type definitions**

```typescript
// apps/web/src/lib/types.ts
export type SecretType = 'LOGIN' | 'API_KEY' | 'ENV_VAR' | 'SECURE_NOTE' | 'CERTIFICATE';

export interface Secret {
  id: string;
  vaultId: string;
  type: SecretType;
  title: string;
  value?: string; // Only populated after decryption from Desktop
  username?: string;
  url?: string;
  totpSecret?: string;
  metadata?: Record<string, any>;
  tags: string[];
  createdAt: string;
}
```

---

### Task 4.4: RF04 - Zero-Knowledge Operations

**Files:**
- Modify: `apps/desktop/src/commands.rs`
- Modify: `apps/web/src/lib/stores/secrets.ts`

**Step 1: Implement Tauri commands**

```rust
// apps/desktop/src/commands.rs
#[tauri::command]
async fn decrypt_secret(encrypted_blob: String, session_key: String) -> Result<String, String> {
    // Decrypt using session key derived from ECDH
    let key = base64::decode(&session_key).map_err(|e| e.to_string())?;
    let ciphertext = base64::decode(&encrypted_blob).map_err(|e| e.to_string())?;
    
    let plaintext = decrypt_aes256gcm(&ciphertext, &key)?;
    String::from_utf8(plaintext).map_err(|e| e.to_string())
}
```

---

### Task 4.5: RF05 - Administration & Audit

**Files:**
- Modify: `apps/api/src/users/users.controller.ts`
- Modify: `apps/api/src/audit/audit.service.ts`
- Create: `apps/web/src/routes/admin/+page.svelte`

**Step 1: Implement audit logging**

```typescript
// In audit.service.ts
async function logAction(userId: string, action: string, target: string, status: string) {
  await db.insert(auditLogs).values({
    userId,
    action,
    target,
    status,
    timestamp: new Date(),
  });
  
  // Also push to BullMQ for async processing
  await auditQueue.add('audit-log', { userId, action, target, status });
}
```

---

### Task 4.6: RF06 - Engineering CLI

**Files:**
- Create: `apps/cli/Cargo.toml`
- Create: `apps/cli/src/main.rs`
- Create: `apps/cli/src/commands/run.rs`

**Step 1: Create CLI entry point**

```rust
// apps/cli/src/main.rs
use clap::{Parser, Subcommand};

#[derive(Parser)]
#[command(name = "fortivault")]
#[command(about = "Zero-Knowledge Secrets CLI", long_about = None)]
struct Cli {
    #[command(subcommand)]
    command: Commands,
}

#[derive(Subcommand)]
enum Commands {
    Run { command: Vec<String> },
    Login,
    List { vault: Option<String> },
}

fn main() {
    let cli = Cli::parse();
    
    match cli.command {
        Commands::Run { command } => run_command(command),
        Commands::Login => login(),
        Commands::List { vault } => list_secrets(vault),
    }
}
```

---

### Task 4.7: RF07 - Disaster Recovery

**Files:**
- Modify: `apps/desktop/src/recovery.rs`
- Create: `apps/web/src/routes/recovery/+page.svelte`

**Step 1: Implement Shamir's Secret Sharing**

```rust
// apps/desktop/src/recovery.rs
// Using sha-shamir crate or custom implementation
// Split master key into N shares, require M to reconstruct
```

---

## Implementation Order Summary

| Phase | Task | Description |
|-------|------|-------------|
| 1 | 1.1 | Initialize Turborepo monorepo |
| 1 | 1.2 | Convert React to SvelteKit |
| 1 | 1.3 | Create shared UI package |
| 2 | 2.1 | Setup Drizzle schema |
| 2 | 2.2 | Setup NestJS backend |
| 3 | 3.1 | Initialize Tauri project |
| 4 | 4.1 | RF01: Identity & Pairing |
| 4 | 4.2 | RF02: Vaults & Hierarchy |
| 4 | 4.3 | RF03: Secret Types |
| 4 | 4.4 | RF04: Zero-Knowledge Ops |
| 4 | 4.5 | RF05: Admin & Audit |
| 4 | 4.6 | RF06: Engineering CLI |
| 4 | 4.7 | RF07: Disaster Recovery |

---

## Testing Strategy

1. **Unit Tests**: Crypto functions, validation schemas
2. **Integration Tests**: API endpoints, WebSocket communication
3. **E2E Tests**: Playwright for critical flows (login, create secret, reveal)
4. **Security Tests**: Audit logging, permission enforcement

---

Plan complete and saved to `docs/plans/2026-03-17-fortivault-implementation.md`. Two execution options:

1. **Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration

2. **Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

Which approach?
