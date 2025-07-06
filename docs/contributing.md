# 🤝 Guia de Contribuição - FortiVault

Obrigado por seu interesse em contribuir com o FortiVault! Este guia irá ajudá-lo a começar.

## 🎯 Como Contribuir

### Tipos de Contribuição

- 🐛 **Relatórios de Bug**: Encontrou um problema? Nos ajude a corrigi-lo
- ✨ **Novas Funcionalidades**: Ideias para melhorar o FortiVault
- 📚 **Documentação**: Melhore a documentação existente
- 🔧 **Correções de Código**: Fixes, otimizações e melhorias
- 🎨 **UI/UX**: Melhorias na interface e experiência do usuário
- 🔒 **Segurança**: Auditorias e melhorias de segurança
- 🧪 **Testes**: Adição de testes e melhoria da cobertura

## 🚀 Primeiros Passos

### 1. Configuração do Ambiente

```bash
# Fork o repositório no GitHub
# Clone seu fork
git clone https://github.com/SEU-USUARIO/FortiVault.git
cd FortiVault

# Adicione o repositório original como upstream
git remote add upstream https://github.com/REPO-ORIGINAL/FortiVault.git

# Configure o ambiente de desenvolvimento
# (Veja docs/development.md para instruções detalhadas)
```

### 2. Fluxo de Trabalho

```bash
# Crie uma branch para sua contribuição
git checkout -b feature/sua-nova-funcionalidade

# Faça suas alterações
# ...

# Adicione e commit suas alterações
git add .
git commit -m "feat: adicionar nova funcionalidade X"

# Push para seu fork
git push origin feature/sua-nova-funcionalidade

# Abra um Pull Request no GitHub
```

## 📝 Padrões de Código

### Convenções de Nomenclatura

#### TypeScript/JavaScript
```typescript
// Variáveis e funções: camelCase
const userPassword = 'secret'
function encryptPassword() {}

// Constantes: UPPER_SNAKE_CASE
const MAX_PASSWORD_LENGTH = 1000
const API_ENDPOINTS = {}

// Classes: PascalCase
class PasswordManager {}

// Interfaces: PascalCase com prefixo I (opcional)
interface IPasswordEntry {}
interface PasswordEntry {} // ou sem prefixo

// Types: PascalCase
type UserRole = 'admin' | 'user'

// Componentes React: PascalCase
export function PasswordList() {}
```

#### Python
```python
# Variáveis e funções: snake_case
user_password = 'secret'
def encrypt_password():
    pass

# Constantes: UPPER_SNAKE_CASE
MAX_PASSWORD_LENGTH = 1000
API_ENDPOINTS = {}

# Classes: PascalCase
class PasswordManager:
    pass

# Arquivos: snake_case
# auth_manager.py, crypto_utils.py
```

### Estrutura de Arquivos

```typescript
// components/password/PasswordItem.tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { PasswordEntry } from '@/types/password'

interface PasswordItemProps {
  password: PasswordEntry
  onUpdate?: () => void
  onDelete?: () => void
}

export function PasswordItem({ password, onUpdate, onDelete }: PasswordItemProps) {
  // Component logic here
  
  return (
    <Card>
      {/* JSX here */}
    </Card>
  )
}
```

### Padrões de Commit

Usamos [Conventional Commits](https://www.conventionalcommits.org/):

```bash
# Formato
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]

# Tipos
feat:     Nova funcionalidade
fix:      Correção de bug
docs:     Mudanças na documentação
style:    Formatação, pontos e vírgulas ausentes, etc
refactor: Refatoração de código
test:     Adição de testes
chore:    Mudanças em ferramentas, configurações, etc
perf:     Melhoria de performance
ci:       Mudanças em CI/CD
build:    Mudanças no sistema de build

# Exemplos
feat(auth): adicionar autenticação 2FA
fix(vault): corrigir vazamento de memória na descriptografia
docs(api): atualizar documentação dos endpoints
style(ui): ajustar espaçamento dos botões
refactor(crypto): simplificar lógica de criptografia
test(auth): adicionar testes para login
chore(deps): atualizar dependências
```

## 🧪 Testes

### Antes de Enviar o PR

```bash
# Frontend
pnpm test               # Executar todos os testes
pnpm test:coverage      # Verificar cobertura
pnpm lint               # Verificar linting
pnpm type-check         # Verificar tipos TypeScript

# Backend
cd backend
pytest                  # Executar todos os testes
pytest --cov=.         # Verificar cobertura
flake8 .               # Verificar linting
mypy .                 # Verificar tipos
```

### Escrevendo Testes

#### Frontend (Jest + React Testing Library)

```typescript
// __tests__/components/PasswordItem.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { PasswordItem } from '@/components/password/PasswordItem'
import { PasswordEntry } from '@/types/password'

const mockPassword: PasswordEntry = {
  id: '1',
  title: 'Test Password',
  username: 'test@example.com',
  url: 'https://example.com',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z'
}

describe('PasswordItem', () => {
  it('should render password information', () => {
    render(<PasswordItem password={mockPassword} />)
    
    expect(screen.getByText('Test Password')).toBeInTheDocument()
    expect(screen.getByText('test@example.com')).toBeInTheDocument()
  })

  it('should call onDelete when delete button is clicked', async () => {
    const onDeleteMock = jest.fn()
    render(<PasswordItem password={mockPassword} onDelete={onDeleteMock} />)
    
    const deleteButton = screen.getByRole('button', { name: /delete/i })
    fireEvent.click(deleteButton)
    
    await waitFor(() => {
      expect(onDeleteMock).toHaveBeenCalledWith()
    })
  })
})
```

#### Backend (pytest)

```python
# tests/test_auth.py
import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_register_user_success():
    """Teste de registro de usuário bem-sucedido"""
    user_data = {
        "username": "testuser",
        "email": "test@example.com",
        "password": "SecurePassword123!"
    }
    
    response = client.post("/auth/register", json=user_data)
    
    assert response.status_code == 200
    data = response.json()
    assert data["username"] == "testuser"
    assert data["email"] == "test@example.com"
    assert "password" not in data  # Senha não deve ser retornada

def test_register_user_invalid_email():
    """Teste de registro com email inválido"""
    user_data = {
        "username": "testuser",
        "email": "invalid-email",
        "password": "SecurePassword123!"
    }
    
    response = client.post("/auth/register", json=user_data)
    
    assert response.status_code == 422
    assert "email" in response.json()["detail"]
```

## 📚 Documentação

### Documentando Código

#### TypeScript
```typescript
/**
 * Criptografa uma senha usando AES-256-GCM
 * 
 * @param password - A senha em texto plano para criptografar
 * @param masterKey - A chave mestra derivada da senha do usuário
 * @returns Promise que resolve para os dados criptografados
 * @throws {CryptographyError} Quando a criptografia falha
 * 
 * @example
 * ```typescript
 * const encrypted = await encryptPassword("myPassword", masterKey)
 * console.log(encrypted.ciphertext)
 * ```
 */
export async function encryptPassword(
  password: string, 
  masterKey: Uint8Array
): Promise<EncryptedData> {
  // Implementation...
}
```

#### Python
```python
def encrypt_password(password: str, master_key: bytes) -> Dict[str, str]:
    """
    Criptografa uma senha usando AES-256-GCM.
    
    Args:
        password: A senha em texto plano para criptografar
        master_key: A chave mestra de 32 bytes derivada da senha do usuário
        
    Returns:
        Dict contendo os dados criptografados com as chaves:
        - ciphertext: Os dados criptografados em hex
        - iv: O vetor de inicialização em hex
        - algorithm: O algoritmo usado ("AES-256-GCM")
        
    Raises:
        CryptographyError: Quando a criptografia falha
        
    Example:
        >>> key = derive_key("user_password", salt)
        >>> encrypted = encrypt_password("secret", key)
        >>> print(encrypted["algorithm"])
        AES-256-GCM
    """
    # Implementation...
```

### Atualizando Documentação

```bash
# Documentação da API é gerada automaticamente
cd backend
python generate_docs.py

# Para documentação frontend
pnpm docs:generate

# Verificar links quebrados
pnpm docs:check
```

## 🐛 Reportando Bugs

### Template de Issue

```markdown
## 🐛 Descrição do Bug
Uma descrição clara e concisa do bug.

## 🔄 Passos para Reproduzir
1. Vá para '...'
2. Clique em '...'
3. Role para baixo até '...'
4. Veja o erro

## ✅ Comportamento Esperado
Uma descrição clara do que você esperava que acontecesse.

## ❌ Comportamento Atual
Uma descrição clara do que realmente aconteceu.

## 📱 Ambiente
- OS: [ex: Windows 11, macOS 13, Ubuntu 22.04]
- Browser: [ex: Chrome 120, Firefox 118]
- Node.js: [ex: 18.17.0]
- Python: [ex: 3.11.0]

## 📷 Screenshots
Se aplicável, adicione screenshots para ajudar a explicar o problema.

## 📄 Logs
```
Cole logs relevantes aqui
```

## 🔗 Informações Adicionais
Qualquer outra informação sobre o problema.
```

## ✨ Propondo Funcionalidades

### Template de Feature Request

```markdown
## 🚀 Descrição da Funcionalidade
Uma descrição clara e concisa da funcionalidade que você gostaria de ver.

## 💡 Motivação
Por que essa funcionalidade seria útil? Que problema ela resolve?

## 📋 Solução Proposta
Uma descrição clara de como você gostaria que funcionasse.

## 🎯 Alternativas Consideradas
Outras soluções ou funcionalidades que você considerou.

## 📊 Impacto
- [ ] Frontend
- [ ] Backend
- [ ] Database
- [ ] Security
- [ ] Performance
- [ ] Documentation

## 🔧 Implementação
Ideias sobre como implementar (opcional).

## 📷 Mockups/Wireframes
Se aplicável, adicione mockups ou wireframes.
```

## 🔒 Segurança

### Reportando Vulnerabilidades

**NÃO** abra issues públicas para vulnerabilidades de segurança.

Envie um email para: **security@fortivault.com**

Inclua:
- Descrição da vulnerabilidade
- Passos para reproduzir
- Impacto potencial
- Sugestões de correção (se houver)

### Audit de Segurança

```bash
# Verificar dependências
npm audit
pip-audit

# Análise estática
bandit -r backend/
eslint --ext .ts,.tsx app/ components/ lib/

# Teste de segurança
./scripts/security-test.sh
```

## 📋 Checklist do Pull Request

Antes de enviar seu PR, verifique:

### ✅ Código
- [ ] O código segue os padrões estabelecidos
- [ ] Todos os testes passam
- [ ] Cobertura de testes mantida ou melhorada
- [ ] Linting passou sem erros
- [ ] Type checking passou (TypeScript)
- [ ] Não há console.log ou print() desnecessários

### ✅ Documentação
- [ ] Documentação foi atualizada (se necessário)
- [ ] README atualizado (se necessário)
- [ ] Changelog atualizado (para mudanças significativas)
- [ ] Comentários de código adicionados onde necessário

### ✅ Funcionalidade
- [ ] A funcionalidade foi testada manualmente
- [ ] Edge cases foram considerados
- [ ] Performance foi considerada
- [ ] Acessibilidade foi verificada
- [ ] Compatibilidade entre browsers testada

### ✅ Segurança
- [ ] Nenhuma informação sensível exposta
- [ ] Inputs são validados e sanitizados
- [ ] Autenticação/autorização implementada corretamente
- [ ] Logs não contêm informações sensíveis

## 🎨 Guia de UI/UX

### Design System

```typescript
// Cores padronizadas (Tailwind)
const colors = {
  primary: 'blue-600',      // Ações principais
  secondary: 'gray-600',    // Ações secundárias
  danger: 'red-600',        // Ações destrutivas
  success: 'green-600',     // Feedback positivo
  warning: 'yellow-600',    // Avisos
  info: 'blue-500'          // Informações
}

// Espaçamentos
const spacing = {
  xs: '0.25rem',   // 4px
  sm: '0.5rem',    // 8px
  md: '1rem',      // 16px
  lg: '1.5rem',    // 24px
  xl: '2rem',      // 32px
  '2xl': '3rem'    // 48px
}
```

### Componentes

```typescript
// Sempre use componentes do design system
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'

// Prefira composição a customização
function PasswordForm() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Nova Senha</CardTitle>
      </CardHeader>
      <CardContent>
        <Input placeholder="Título" />
        <Input placeholder="Username" />
        <Button>Salvar</Button>
      </CardContent>
    </Card>
  )
}
```

### Acessibilidade

```typescript
// Sempre inclua labels e aria-labels
<Input 
  id="password-title"
  aria-label="Título da senha"
  placeholder="Ex: GitHub"
/>

// Use semantic HTML
<main>
  <section>
    <h1>Cofre de Senhas</h1>
    <article>
      {/* Conteúdo */}
    </article>
  </section>
</main>

// Teclado navegável
<Button 
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleClick()
    }
  }}
>
  Deletar
</Button>
```

## 🏆 Reconhecimento

### Contribuidores

Todos os contribuidores são reconhecidos:
- **README.md**: Lista de contribuidores principais
- **CONTRIBUTORS.md**: Lista completa com contribuições
- **Release Notes**: Créditos para cada release

### Níveis de Contribuição

- 🥇 **Core Contributor**: 50+ commits significativos
- 🥈 **Regular Contributor**: 10+ commits
- 🥉 **Contributor**: 1+ commit
- 🌟 **Special Recognition**: Contribuições únicas (segurança, design, etc.)

## 📞 Suporte

### Canais de Comunicação

- 💬 **Discord**: [Canal #contributors](https://discord.gg/fortivault-contributors)
- 📧 **Email**: contributors@fortivault.com
- 🐛 **Issues**: [GitHub Issues](https://github.com/seu-usuario/FortiVault/issues)
- 💡 **Discussions**: [GitHub Discussions](https://github.com/seu-usuario/FortiVault/discussions)

### Office Hours

Sessões semanais para discussão de contribuições:
- **Quando**: Sábados, 14:00 UTC
- **Onde**: Discord voice channel
- **Agenda**: Dúvidas, PR reviews, planejamento

## 🎯 Roadmap

### Próximas Funcionalidades

- [ ] Sync P2P melhorado
- [ ] App mobile (React Native)
- [ ] Extensão de browser
- [ ] Importação de outros gerenciadores
- [ ] Auditoria de senhas comprometidas
- [ ] Compartilhamento seguro

### Como Contribuir com o Roadmap

1. Participe das **GitHub Discussions**
2. Vote em funcionalidades existentes
3. Proponha novas funcionalidades
4. Implemente funcionalidades prioritárias

---

**🙏 Obrigado por contribuir!** Sua ajuda torna o FortiVault melhor para todos.
