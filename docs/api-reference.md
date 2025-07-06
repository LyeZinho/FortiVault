# 🔌 API Reference - FortiVault

Documentação completa da API REST do FortiVault Backend.

## 📋 Visão Geral

- **Base URL**: `http://127.0.0.1:8000`
- **Versão**: `v2.0`
- **Autenticação**: JWT Bearer Token
- **Formato**: JSON
- **Content-Type**: `application/json`

## 🔐 Autenticação

### Headers Obrigatórios

```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

### Obter Token de Acesso

```http
POST /auth/login
```

**Request Body:**
```json
{
  "username": "string",
  "password": "string",
  "totp_code": "string" // Opcional, necessário se 2FA estiver ativo
}
```

**Response:**
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "expires_in": 3600,
  "token_type": "bearer",
  "refresh_token": "refresh_token_here"
}
```

## 👤 Endpoints de Autenticação

### Registrar Usuário

```http
POST /auth/register
```

**Request Body:**
```json
{
  "username": "string",
  "email": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "id": 1,
  "username": "string",
  "email": "string",
  "is_2fa_enabled": false,
  "created_at": "2024-01-01T00:00:00Z"
}
```

### Logout

```http
POST /auth/logout
```

**Response:**
```json
{
  "message": "Successfully logged out"
}
```

### Atualizar Token

```http
POST /auth/refresh
```

**Request Body:**
```json
{
  "refresh_token": "string"
}
```

## 🔒 Endpoints de 2FA

### Configurar 2FA

```http
POST /auth/2fa/setup
```

**Response:**
```json
{
  "secret": "JBSWY3DPEHPK3PXP",
  "qr_code": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
  "backup_codes": ["123456", "234567", "345678"]
}
```

### Verificar 2FA

```http
POST /auth/2fa/verify
```

**Request Body:**
```json
{
  "totp_code": "123456"
}
```

**Response:**
```json
{
  "message": "2FA verified successfully",
  "backup_codes": ["123456", "234567", "345678"]
}
```

### Desabilitar 2FA

```http
POST /auth/2fa/disable
```

**Request Body:**
```json
{
  "totp_code": "123456"
}
```

## 🗝️ Endpoints de Senha Mestra

### Configurar Senha Mestra

```http
POST /vault/master-password/setup
```

**Request Body:**
```json
{
  "master_password": "string"
}
```

### Verificar Senha Mestra

```http
POST /vault/master-password/verify
```

**Request Body:**
```json
{
  "master_password": "string"
}
```

**Response:**
```json
{
  "verified": true,
  "vault_unlocked": true
}
```

## 🔐 Endpoints do Cofre

### Obter Estatísticas do Cofre

```http
GET /vault/stats
```

**Response:**
```json
{
  "total_passwords": 47,
  "weak_passwords": 3,
  "duplicate_passwords": 2,
  "strong_passwords": 42,
  "security_score": 8.5,
  "last_backup": "2024-01-01T00:00:00Z"
}
```

### Listar Senhas

```http
GET /vault/passwords
```

**Query Parameters:**
- `folder`: Filtrar por pasta (opcional)
- `search`: Buscar por título/username (opcional)
- `limit`: Limite de resultados (padrão: 100)
- `offset`: Offset para paginação (padrão: 0)

**Response:**
```json
[
  {
    "id": "uuid-string",
    "title": "GitHub",
    "username": "user@example.com",
    "password": "encrypted_password",
    "url": "https://github.com",
    "notes": "Work account",
    "folder": "Work",
    "tags": ["work", "development"],
    "strength": "strong",
    "is_favorite": false,
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
]
```

### Adicionar Senha

```http
POST /vault/passwords
```

**Request Body:**
```json
{
  "title": "string",
  "username": "string",
  "password": "string",
  "url": "string", // Opcional
  "notes": "string", // Opcional
  "folder": "string", // Opcional
  "tags": ["string"], // Opcional
  "is_favorite": false // Opcional
}
```

### Atualizar Senha

```http
PUT /vault/passwords/{id}
```

**Request Body:** (Mesma estrutura do POST, todos os campos opcionais)

### Deletar Senha

```http
DELETE /vault/passwords/{id}
```

**Response:**
```json
{
  "message": "Password deleted successfully"
}
```

## 📁 Endpoints de Pastas

### Listar Pastas

```http
GET /vault/folders
```

**Response:**
```json
[
  {
    "id": "uuid-string",
    "name": "Work",
    "color": "#3b82f6",
    "icon": "briefcase",
    "password_count": 15,
    "created_at": "2024-01-01T00:00:00Z"
  }
]
```

### Criar Pasta

```http
POST /vault/folders
```

**Request Body:**
```json
{
  "name": "string",
  "color": "string", // Hex color
  "icon": "string" // Opcional
}
```

### Atualizar Pasta

```http
PUT /vault/folders/{id}
```

### Deletar Pasta

```http
DELETE /vault/folders/{id}
```

## ⚙️ Endpoints de Configurações

### Obter Configurações

```http
GET /settings
```

**Response:**
```json
{
  "theme": "dark",
  "auto_lock": true,
  "auto_lock_time": 15,
  "auto_backup": true,
  "backup_frequency": "daily",
  "sync_enabled": false,
  "biometric_auth": false,
  "show_password_strength": true,
  "clipboard_timeout": 30
}
```

### Atualizar Configurações

```http
PUT /settings
```

**Request Body:**
```json
{
  "settings": {
    "theme": "dark",
    "auto_lock": true,
    "auto_lock_time": 15
  }
}
```

## 💾 Endpoints de Backup

### Criar Backup

```http
POST /vault/backup
```

**Request Body:**
```json
{
  "include_settings": true,
  "format": "json", // json, csv
  "encryption": true
}
```

**Response:**
```json
{
  "backup_id": "uuid-string",
  "filename": "fortivault_backup_20240101.json.enc",
  "size_bytes": 1024,
  "created_at": "2024-01-01T00:00:00Z",
  "download_url": "/vault/backup/download/uuid-string"
}
```

### Listar Backups

```http
GET /vault/backups
```

**Response:**
```json
[
  {
    "id": "uuid-string",
    "filename": "fortivault_backup_20240101.json.enc",
    "size_bytes": 1024,
    "backup_type": "manual",
    "created_at": "2024-01-01T00:00:00Z"
  }
]
```

### Download de Backup

```http
GET /vault/backup/download/{backup_id}
```

**Response:** Arquivo binário (download direto)

### Restaurar Backup

```http
POST /vault/backup/restore
```

**Request Body:** (multipart/form-data)
```
file: backup_file.json.enc
master_password: string
```

## 🔄 Endpoints de Sincronização

### Status da Sincronização

```http
GET /sync/status
```

**Response:**
```json
{
  "enabled": true,
  "last_sync": "2024-01-01T00:00:00Z",
  "connected_devices": 2,
  "sync_in_progress": false
}
```

### Descobrir Dispositivos

```http
GET /sync/discover
```

**Response:**
```json
{
  "devices": [
    {
      "id": "device-uuid",
      "name": "MacBook Pro",
      "ip": "192.168.1.100",
      "status": "online",
      "last_seen": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### Parear Dispositivo

```http
POST /sync/pair
```

**Request Body:**
```json
{
  "device_id": "string",
  "pairing_code": "string"
}
```

### Sincronizar

```http
POST /sync/sync
```

**Request Body:**
```json
{
  "device_id": "string", // Opcional, sync com todos se omitido
  "force": false // Forçar sync mesmo com conflitos
}
```

## 🔍 Endpoints de Auditoria

### Log de Auditoria

```http
GET /audit/log
```

**Query Parameters:**
- `start_date`: Data inicial (ISO 8601)
- `end_date`: Data final (ISO 8601)
- `action`: Filtrar por ação
- `limit`: Limite de resultados

**Response:**
```json
[
  {
    "id": "uuid-string",
    "user_id": "user-uuid",
    "action": "password_created",
    "resource": "passwords",
    "resource_id": "password-uuid",
    "details": {
      "title": "GitHub"
    },
    "ip_address": "192.168.1.100",
    "user_agent": "Mozilla/5.0...",
    "timestamp": "2024-01-01T00:00:00Z"
  }
]
```

### Relatório de Segurança

```http
GET /audit/security-report
```

**Response:**
```json
{
  "weak_passwords": [
    {
      "id": "password-uuid",
      "title": "Old Account",
      "strength": "weak",
      "issues": ["too_short", "no_symbols"]
    }
  ],
  "duplicate_passwords": [
    {
      "password_hash": "hash",
      "count": 3,
      "passwords": ["uuid1", "uuid2", "uuid3"]
    }
  ],
  "expired_passwords": [],
  "compromised_passwords": [],
  "security_score": 7.5,
  "recommendations": [
    "Update 3 weak passwords",
    "Remove 2 duplicate passwords"
  ]
}
```

## 🏥 Endpoints de Sistema

### Health Check

```http
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00Z",
  "version": "2.0.0",
  "database": "connected",
  "memory_usage": "45%",
  "uptime": "72h"
}
```

### Informações do Sistema

```http
GET /system/info
```

**Response:**
```json
{
  "version": "2.0.0",
  "python_version": "3.11.0",
  "platform": "Linux",
  "memory": {
    "total": "8GB",
    "available": "4GB"
  },
  "database": {
    "type": "SQLite",
    "size": "15MB"
  },
  "features": {
    "2fa": true,
    "backup": true,
    "sync": true,
    "encryption": "AES-256-GCM"
  }
}
```

## 📊 Códigos de Status HTTP

| Código | Descrição |
|--------|-----------|
| 200 | Sucesso |
| 201 | Criado |
| 400 | Requisição inválida |
| 401 | Não autorizado |
| 403 | Proibido |
| 404 | Não encontrado |
| 409 | Conflito |
| 422 | Entidade não processável |
| 429 | Muitas requisições |
| 500 | Erro interno do servidor |

## ❌ Tratamento de Erros

### Formato de Erro Padrão

```json
{
  "error": "validation_error",
  "message": "The request contains invalid data",
  "details": {
    "field": "password",
    "code": "too_short",
    "message": "Password must be at least 12 characters"
  },
  "timestamp": "2024-01-01T00:00:00Z",
  "request_id": "req-uuid"
}
```

### Códigos de Erro Comuns

| Código | Descrição |
|--------|-----------|
| `invalid_credentials` | Credenciais inválidas |
| `token_expired` | Token expirado |
| `invalid_token` | Token inválido |
| `2fa_required` | 2FA obrigatório |
| `master_password_required` | Senha mestra obrigatória |
| `validation_error` | Erro de validação |
| `duplicate_entry` | Entrada duplicada |
| `not_found` | Recurso não encontrado |
| `rate_limit_exceeded` | Limite de taxa excedido |

## 🔒 Limitação de Taxa (Rate Limiting)

| Endpoint | Limite |
|----------|--------|
| `/auth/login` | 5 tentativas/15min |
| `/auth/register` | 3 tentativas/hora |
| `/auth/2fa/*` | 10 tentativas/5min |
| Outros endpoints | 60 requisições/min |

## 📝 Exemplos de Uso

### JavaScript/TypeScript

```typescript
// Cliente API TypeScript
class FortiVaultAPI {
  private baseUrl = 'http://127.0.0.1:8000'
  private token: string | null = null

  async login(username: string, password: string, totpCode?: string) {
    const response = await fetch(`${this.baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, totp_code: totpCode })
    })
    
    const data = await response.json()
    if (response.ok) {
      this.token = data.access_token
    }
    return data
  }

  async getPasswords() {
    const response = await fetch(`${this.baseUrl}/vault/passwords`, {
      headers: { 
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      }
    })
    
    return response.json()
  }
}
```

### Python

```python
import requests

class FortiVaultAPI:
    def __init__(self, base_url="http://127.0.0.1:8000"):
        self.base_url = base_url
        self.token = None
    
    def login(self, username, password, totp_code=None):
        data = {"username": username, "password": password}
        if totp_code:
            data["totp_code"] = totp_code
            
        response = requests.post(f"{self.base_url}/auth/login", json=data)
        if response.status_code == 200:
            self.token = response.json()["access_token"]
        return response.json()
    
    def get_passwords(self):
        headers = {"Authorization": f"Bearer {self.token}"}
        response = requests.get(f"{self.base_url}/vault/passwords", headers=headers)
        return response.json()
```

### cURL

```bash
# Login
curl -X POST "http://127.0.0.1:8000/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username": "user", "password": "pass"}'

# Obter senhas
curl -X GET "http://127.0.0.1:8000/vault/passwords" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Adicionar senha
curl -X POST "http://127.0.0.1:8000/vault/passwords" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title": "GitHub", "username": "user", "password": "pass"}'
```

## 🔗 Links Úteis

- 📖 **Documentação Interativa**: http://127.0.0.1:8000/docs
- 🔧 **OpenAPI Schema**: http://127.0.0.1:8000/openapi.json
- 🏥 **Health Check**: http://127.0.0.1:8000/health
- 📊 **Métricas**: http://127.0.0.1:8000/metrics

---

**📡 API Documentation v2.0** - Mantenha suas integrações seguras e atualizadas!
