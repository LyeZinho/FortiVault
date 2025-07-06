# 🛠️ Guia de Desenvolvimento - FortiVault

Documentação completa para desenvolvedores contribuindo com o FortiVault.

## 🏗️ Arquitetura do Projeto

### Stack Tecnológico

#### Frontend
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **UI**: React 19 + Shadcn/ui
- **Styling**: Tailwind CSS
- **Forms**: React Hook Form + Zod
- **State**: React Context + Hooks
- **Icons**: Lucide React

#### Backend
- **Framework**: FastAPI
- **Language**: Python 3.11+
- **Database**: SQLite (com suporte a PostgreSQL)
- **Authentication**: JWT + TOTP (2FA)
- **Encryption**: cryptography (AES-256-GCM)
- **Password Hashing**: Argon2id

### Estrutura de Diretórios

```
FortiVault/
├── app/                      # Next.js App Router
│   ├── (auth)/              # Rotas de autenticação
│   ├── api/                 # API Routes do Next.js
│   ├── backup/              # Página de backup
│   ├── settings/            # Configurações
│   ├── sync/                # Sincronização P2P
│   ├── vault/               # Cofre principal
│   ├── globals.css          # Estilos globais
│   ├── layout.tsx           # Layout principal
│   └── page.tsx             # Página inicial (dashboard)
├── backend/                 # Backend Python
│   ├── auth.py              # Autenticação e autorização
│   ├── crypto_utils.py      # Utilitários de criptografia
│   ├── database.py          # Camada de dados
│   ├── main.py              # Aplicação principal FastAPI
│   ├── requirements.txt     # Dependências Python
│   └── database/            # Banco de dados SQLite
├── components/              # Componentes React
│   ├── auth/                # Componentes de auth
│   ├── ui/                  # Componentes base (shadcn)
│   ├── app-sidebar.tsx      # Sidebar principal
│   ├── folder-manager.tsx   # Gerenciador de pastas
│   └── password-modal.tsx   # Modal de senhas
├── docs/                    # Documentação
├── hooks/                   # React Hooks customizados
├── lib/                     # Utilitários e configurações
│   ├── api-client.ts        # Cliente da API
│   ├── export-utils.ts      # Utilitários de exportação
│   └── utils.ts             # Utilitários gerais
├── public/                  # Arquivos estáticos
└── styles/                  # Estilos adicionais
```

## 🚀 Configuração do Ambiente de Desenvolvimento

### 1. Clonagem e Configuração Inicial

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/FortiVault.git
cd FortiVault

# Configure git hooks (opcional)
cp scripts/pre-commit .git/hooks/
chmod +x .git/hooks/pre-commit
```

### 2. Configuração do Backend

```bash
cd backend

# Crie e ative ambiente virtual
python -m venv venv
source venv/bin/activate  # Linux/macOS
venv\Scripts\activate     # Windows

# Instale dependências
pip install -r requirements.txt

# Instale dependências de desenvolvimento
pip install -r requirements-dev.txt

# Configure arquivo .env
cp .env.example .env
# Edite .env com suas configurações
```

### 3. Configuração do Frontend

```bash
# Na raiz do projeto
pnpm install

# Configure variáveis de ambiente
cp .env.example .env.local
# Edite .env.local se necessário

# Instale extensões recomendadas do VSCode
code --install-extension bradlc.vscode-tailwindcss
code --install-extension ms-python.python
code --install-extension ms-vscode.vscode-typescript-next
```

### 4. Executar em Desenvolvimento

```bash
# Terminal 1: Backend
cd backend
python main.py

# Terminal 2: Frontend
pnpm dev

# Terminal 3: Testes (opcional)
pnpm test:watch
```

## 📝 Padrões de Código

### TypeScript/JavaScript

```typescript
// Exemplo de componente React
'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { apiClient } from '@/lib/api-client'

interface PasswordItemProps {
  id: string
  title: string
  username: string
  onUpdate?: () => void
}

export function PasswordItem({ id, title, username, onUpdate }: PasswordItemProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleDelete = async () => {
    try {
      setIsLoading(true)
      
      const response = await apiClient.deletePassword(id)
      if (response.error) {
        throw new Error(response.error)
      }

      toast({
        title: 'Senha deletada',
        description: 'A senha foi removida com sucesso',
      })

      onUpdate?.()
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg">
      <div>
        <h3 className="font-medium">{title}</h3>
        <p className="text-sm text-muted-foreground">{username}</p>
      </div>
      
      <Button 
        variant="destructive" 
        size="sm"
        onClick={handleDelete}
        disabled={isLoading}
      >
        {isLoading ? 'Deletando...' : 'Deletar'}
      </Button>
    </div>
  )
}
```

### Python

```python
# Exemplo de endpoint FastAPI
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List

from auth import get_current_user
from database import db
from crypto_utils import crypto_advanced

router = APIRouter(prefix="/vault", tags=["vault"])

class PasswordCreate(BaseModel):
    title: str
    username: str
    password: str
    url: str = None
    notes: str = None
    folder: str = None

class PasswordResponse(BaseModel):
    id: str
    title: str
    username: str
    url: str = None
    created_at: str
    updated_at: str

@router.post("/passwords", response_model=PasswordResponse)
async def create_password(
    password_data: PasswordCreate,
    current_user: dict = Depends(get_current_user)
):
    """Criar nova senha no cofre"""
    try:
        # Criptografar senha
        encrypted_password = crypto_advanced.encrypt(
            password_data.password,
            current_user["encryption_key"]
        )
        
        # Salvar no banco
        password_id = db.create_password(
            user_id=current_user["id"],
            title=password_data.title,
            username=password_data.username,
            encrypted_password=encrypted_password,
            url=password_data.url,
            notes=password_data.notes,
            folder=password_data.folder
        )
        
        # Retornar resposta
        return db.get_password(password_id)
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create password: {str(e)}"
        )

@router.get("/passwords", response_model=List[PasswordResponse])
async def list_passwords(
    folder: str = None,
    search: str = None,
    limit: int = 100,
    offset: int = 0,
    current_user: dict = Depends(get_current_user)
):
    """Listar senhas do usuário"""
    return db.list_passwords(
        user_id=current_user["id"],
        folder=folder,
        search=search,
        limit=limit,
        offset=offset
    )
```

## 🧪 Testes

### Frontend (Jest + Testing Library)

```typescript
// __tests__/components/PasswordItem.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { jest } from '@jest/globals'
import { PasswordItem } from '@/components/PasswordItem'
import * as apiClient from '@/lib/api-client'

// Mock do API client
jest.mock('@/lib/api-client')
const mockApiClient = apiClient as jest.Mocked<typeof apiClient>

// Mock do hook de toast
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn()
  })
}))

describe('PasswordItem', () => {
  const mockProps = {
    id: '1',
    title: 'GitHub',
    username: 'user@example.com',
    onUpdate: jest.fn()
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render password information', () => {
    render(<PasswordItem {...mockProps} />)
    
    expect(screen.getByText('GitHub')).toBeInTheDocument()
    expect(screen.getByText('user@example.com')).toBeInTheDocument()
  })

  it('should handle delete action', async () => {
    mockApiClient.apiClient.deletePassword.mockResolvedValueOnce({
      data: { success: true }
    })

    render(<PasswordItem {...mockProps} />)
    
    const deleteButton = screen.getByText('Deletar')
    fireEvent.click(deleteButton)

    await waitFor(() => {
      expect(mockApiClient.apiClient.deletePassword).toHaveBeenCalledWith('1')
      expect(mockProps.onUpdate).toHaveBeenCalled()
    })
  })

  it('should handle delete error', async () => {
    mockApiClient.apiClient.deletePassword.mockResolvedValueOnce({
      error: 'Failed to delete'
    })

    render(<PasswordItem {...mockProps} />)
    
    const deleteButton = screen.getByText('Deletar')
    fireEvent.click(deleteButton)

    await waitFor(() => {
      expect(screen.getByText('Deletar')).toBeInTheDocument() // Button should be enabled again
    })
  })
})
```

### Backend (pytest)

```python
# tests/test_vault.py
import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock

from main import app
from auth import create_access_token

client = TestClient(app)

@pytest.fixture
def auth_headers():
    """Headers de autenticação para testes"""
    token = create_access_token({"id": 1, "username": "testuser"})
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture
def mock_db():
    """Mock do banco de dados"""
    with patch('database.db') as mock:
        yield mock

def test_create_password_success(auth_headers, mock_db):
    """Teste de criação de senha bem-sucedida"""
    # Arrange
    mock_db.create_password.return_value = "password-123"
    mock_db.get_password.return_value = {
        "id": "password-123",
        "title": "Test Password",
        "username": "test@example.com",
        "created_at": "2024-01-01T00:00:00Z"
    }
    
    password_data = {
        "title": "Test Password",
        "username": "test@example.com",
        "password": "secure-password-123",
        "url": "https://example.com"
    }
    
    # Act
    response = client.post(
        "/vault/passwords",
        json=password_data,
        headers=auth_headers
    )
    
    # Assert
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "Test Password"
    assert data["username"] == "test@example.com"

def test_create_password_unauthorized():
    """Teste de criação sem autenticação"""
    password_data = {
        "title": "Test Password",
        "username": "test@example.com",
        "password": "secure-password-123"
    }
    
    response = client.post("/vault/passwords", json=password_data)
    
    assert response.status_code == 401

def test_list_passwords_with_filters(auth_headers, mock_db):
    """Teste de listagem com filtros"""
    # Arrange
    mock_db.list_passwords.return_value = [
        {"id": "1", "title": "GitHub", "folder": "Work"},
        {"id": "2", "title": "Gmail", "folder": "Personal"}
    ]
    
    # Act
    response = client.get(
        "/vault/passwords?folder=Work&limit=10",
        headers=auth_headers
    )
    
    # Assert
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    mock_db.list_passwords.assert_called_once_with(
        user_id=1,
        folder="Work",
        search=None,
        limit=10,
        offset=0
    )
```

### Executando Testes

```bash
# Frontend
pnpm test                 # Executar todos os testes
pnpm test:watch          # Executar em modo watch
pnpm test:coverage       # Executar com coverage

# Backend
pytest                   # Executar todos os testes
pytest -v                # Verbose output
pytest --cov=.          # Com coverage
pytest tests/test_vault.py::test_create_password_success  # Teste específico
```

## 🔧 Debugging

### Frontend (Next.js)

```typescript
// lib/debug.ts
export const debug = {
  log: (message: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[FortiVault] ${message}`, data)
    }
  },
  
  error: (message: string, error?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.error(`[FortiVault Error] ${message}`, error)
    }
  },
  
  api: (method: string, url: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[API] ${method} ${url}`, data)
    }
  }
}

// Uso em componentes
import { debug } from '@/lib/debug'

export function MyComponent() {
  useEffect(() => {
    debug.log('Component mounted')
    
    apiClient.getPasswords()
      .then(data => debug.log('Passwords loaded', data))
      .catch(error => debug.error('Failed to load passwords', error))
  }, [])
}
```

### Backend (Python)

```python
# backend/debug.py
import logging
import functools
import time

# Configurar logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger('fortivault')

def debug_endpoint(func):
    """Decorator para debug de endpoints"""
    @functools.wraps(func)
    async def wrapper(*args, **kwargs):
        start_time = time.time()
        logger.debug(f"Starting {func.__name__} with args: {kwargs}")
        
        try:
            result = await func(*args, **kwargs)
            execution_time = time.time() - start_time
            logger.debug(f"Completed {func.__name__} in {execution_time:.2f}s")
            return result
        except Exception as e:
            logger.error(f"Error in {func.__name__}: {str(e)}")
            raise
    
    return wrapper

# Uso em endpoints
from debug import debug_endpoint, logger

@router.get("/passwords")
@debug_endpoint
async def list_passwords(current_user: dict = Depends(get_current_user)):
    logger.debug(f"Loading passwords for user {current_user['id']}")
    # ... rest of the function
```

### VSCode Debug Configuration

```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Next.js",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/.bin/next",
      "args": ["dev"],
      "cwd": "${workspaceFolder}",
      "env": {
        "NODE_OPTIONS": "--inspect"
      }
    },
    {
      "name": "Debug Python Backend",
      "type": "python",
      "request": "launch",
      "program": "${workspaceFolder}/backend/main.py",
      "cwd": "${workspaceFolder}/backend",
      "env": {
        "PYTHONPATH": "${workspaceFolder}/backend"
      },
      "console": "integratedTerminal"
    }
  ]
}
```

## 📦 Build e Deploy

### Build do Frontend

```bash
# Build de produção
pnpm build

# Verificar build
pnpm start

# Analisar bundle
pnpm analyze

# Build otimizado
NEXT_PUBLIC_NODE_ENV=production pnpm build
```

### Build do Backend

```bash
# Instalar dependências de produção
pip install -r requirements.txt --no-dev

# Criar executável (opcional)
pip install pyinstaller
pyinstaller --onefile main.py

# Docker build
docker build -t fortivault-backend .
docker run -p 8000:8000 fortivault-backend
```

### Deploy com Docker

```dockerfile
# Dockerfile.production
FROM node:18-alpine AS frontend-build
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install
COPY . .
RUN pnpm build

FROM python:3.11-slim AS backend
WORKDIR /app
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY backend/ .

FROM nginx:alpine AS production
COPY --from=frontend-build /app/out /usr/share/nginx/html
COPY --from=backend /app /backend
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  backend:
    build:
      context: .
      dockerfile: Dockerfile.backend
    ports:
      - "8000:8000"
    environment:
      - DATABASE_PATH=/data/vault.db
    volumes:
      - vault_data:/data
    restart: unless-stopped

  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
    ports:
      - "3000:3000"
    depends_on:
      - backend
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - frontend
      - backend
    restart: unless-stopped

volumes:
  vault_data:
```

## 🔄 CI/CD

### GitHub Actions

```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'pnpm'
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Run tests
        run: pnpm test:ci
      
      - name: Run build
        run: pnpm build

  test-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
          cache: 'pip'
      
      - name: Install dependencies
        run: |
          cd backend
          pip install -r requirements.txt
          pip install -r requirements-dev.txt
      
      - name: Run tests
        run: |
          cd backend
          pytest --cov=. --cov-report=xml
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3

  security-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Run security scan
        run: |
          npm audit --audit-level high
          pip install safety bandit
          safety check
          bandit -r backend/

  deploy:
    needs: [test-frontend, test-backend, security-scan]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      
      - name: Deploy to production
        run: |
          # Script de deploy
          echo "Deploying to production..."
```

## 📚 Documentação

### Gerando Documentação da API

```bash
# Backend - OpenAPI/Swagger
cd backend
python -c "
from main import app
import json
with open('openapi.json', 'w') as f:
    json.dump(app.openapi(), f, indent=2)
"

# Gerar documentação HTML
pip install redoc-cli
redoc-cli build openapi.json --output docs/api.html
```

### JSDoc para Frontend

```typescript
/**
 * Gerenciador de senhas com criptografia AES-256
 * @example
 * ```typescript
 * const manager = new PasswordManager()
 * const encrypted = await manager.encrypt("my-password", "master-key")
 * const decrypted = await manager.decrypt(encrypted, "master-key")
 * ```
 */
export class PasswordManager {
  /**
   * Criptografa uma senha usando AES-256-GCM
   * @param password - Senha em texto plano
   * @param masterKey - Chave mestra para criptografia
   * @returns Dados criptografados
   * @throws {Error} Quando a criptografia falha
   */
  async encrypt(password: string, masterKey: string): Promise<EncryptedData> {
    // Implementation...
  }
}
```

## 🤝 Contribuição

### Fluxo de Contribuição

1. **Fork** o repositório
2. **Clone** seu fork localmente
3. **Crie** uma branch para sua feature: `git checkout -b feature/nova-funcionalidade`
4. **Desenvolva** seguindo os padrões de código
5. **Teste** suas alterações
6. **Commit** com mensagens descritivas
7. **Push** para sua branch
8. **Abra** um Pull Request

### Padrões de Commit

```bash
# Tipos de commit
feat: nova funcionalidade
fix: correção de bug
docs: atualização de documentação
style: formatação de código
refactor: refatoração sem mudança de comportamento
test: adição ou correção de testes
chore: tarefas de build, dependências, etc.

# Exemplos
git commit -m "feat: adicionar autenticação 2FA"
git commit -m "fix: corrigir vazamento de memória no upload"
git commit -m "docs: atualizar README com instruções de instalação"
```

### Code Review

#### Checklist para PRs

- [ ] Código segue os padrões estabelecidos
- [ ] Testes foram adicionados/atualizados
- [ ] Documentação foi atualizada
- [ ] Build passa sem erros
- [ ] Não há vazamentos de segurança
- [ ] Performance foi considerada
- [ ] Acessibilidade foi verificada

## 📞 Suporte para Desenvolvedores

- 💬 **Discord**: [Canal #dev](https://discord.gg/fortivault-dev)
- 📧 **Email**: dev@fortivault.com
- 🐛 **Issues**: [GitHub Issues](https://github.com/seu-usuario/FortiVault/issues)
- 📖 **Wiki**: [Documentação Técnica](https://github.com/seu-usuario/FortiVault/wiki)

---

**🛠️ Happy Coding!** Obrigado por contribuir com o FortiVault!
