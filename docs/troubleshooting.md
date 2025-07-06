# ❓ Solução de Problemas - FortiVault

Guia completo para resolução de problemas comuns no FortiVault.

## 🔍 Diagnóstico Rápido

### Script de Diagnóstico Automático

```bash
#!/bin/bash
# scripts/diagnose.sh

echo "🔍 Executando diagnóstico do FortiVault..."

# Verificar serviços
echo "📊 Status dos Serviços:"
curl -s http://127.0.0.1:8000/health && echo "✅ Backend: OK" || echo "❌ Backend: ERRO"
curl -s http://localhost:3000 > /dev/null && echo "✅ Frontend: OK" || echo "❌ Frontend: ERRO"

# Verificar portas
echo "🔌 Verificando Portas:"
netstat -an | grep ":8000" && echo "✅ Porta 8000: Em uso" || echo "❌ Porta 8000: Livre"
netstat -an | grep ":3000" && echo "✅ Porta 3000: Em uso" || echo "❌ Porta 3000: Livre"

# Verificar dependências
echo "📦 Dependências:"
node --version && echo "✅ Node.js: Instalado" || echo "❌ Node.js: Não encontrado"
python --version && echo "✅ Python: Instalado" || echo "❌ Python: Não encontrado"

echo "✅ Diagnóstico concluído!"
```

## 🚫 Problemas de Instalação

### ❌ Erro: "Node.js não encontrado"

**Sintomas:**
```bash
'node' is not recognized as an internal or external command
```

**Soluções:**

1. **Instalar Node.js:**
```bash
# Windows
winget install OpenJS.NodeJS

# macOS
brew install node

# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

2. **Verificar PATH:**
```bash
# Adicionar ao PATH do sistema
echo $PATH | grep node
```

### ❌ Erro: "Python module not found"

**Sintomas:**
```bash
ModuleNotFoundError: No module named 'fastapi'
```

**Soluções:**

1. **Verificar ambiente virtual:**
```bash
# Ativar ambiente virtual
cd backend
source venv/bin/activate  # Linux/macOS
venv\Scripts\activate     # Windows
```

2. **Reinstalar dependências:**
```bash
pip install -r requirements.txt --force-reinstall
```

3. **Verificar versão do Python:**
```bash
python --version  # Deve ser 3.11+
```

### ❌ Erro: "Permission denied"

**Sintomas:**
```bash
EACCES: permission denied, mkdir '/usr/local/lib/node_modules'
```

**Soluções:**

1. **Configurar npm prefix:**
```bash
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
```

2. **Usar pnpm (recomendado):**
```bash
npm install -g pnpm
```

## 🌐 Problemas de Conectividade

### ❌ Erro: "Cannot connect to backend"

**Sintomas:**
- Frontend não consegue conectar ao backend
- Erro 500 ou timeout nas requisições
- "Network error" no console

**Diagnóstico:**
```bash
# Verificar se o backend está rodando
curl http://127.0.0.1:8000/health

# Verificar logs do backend
cd backend
python main.py  # Ver logs em tempo real
```

**Soluções:**

1. **Verificar porta do backend:**
```bash
# Verificar se a porta 8000 está livre
netstat -an | grep :8000
lsof -i :8000  # Linux/macOS
```

2. **Configurar CORS:**
```python
# backend/main.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

3. **Verificar firewall:**
```bash
# Windows
netsh advfirewall firewall add rule name="FortiVault Backend" dir=in action=allow protocol=TCP localport=8000

# Linux (ufw)
sudo ufw allow 8000
```

### ❌ Erro: "Port already in use"

**Sintomas:**
```bash
Error: listen EADDRINUSE: address already in use :::3000
```

**Soluções:**

1. **Encontrar e parar o processo:**
```bash
# Linux/macOS
lsof -ti:3000 | xargs kill -9

# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

2. **Usar porta diferente:**
```bash
# Frontend
pnpm dev -- --port 3001

# Backend
uvicorn main:app --port 8001
```

## 🔐 Problemas de Autenticação

### ❌ Erro: "Invalid token"

**Sintomas:**
- Logout automático frequente
- "Token expired" ou "Invalid token"
- 401 Unauthorized

**Soluções:**

1. **Verificar expiração do token:**
```typescript
// Verificar no localStorage
const token = localStorage.getItem('fortivault_token')
if (token) {
  const payload = JSON.parse(atob(token.split('.')[1]))
  console.log('Token expires:', new Date(payload.exp * 1000))
}
```

2. **Implementar refresh token:**
```typescript
// lib/api-client.ts
async refreshToken() {
  const refreshToken = localStorage.getItem('fortivault_refresh_token')
  if (!refreshToken) return false
  
  try {
    const response = await fetch('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refresh_token: refreshToken })
    })
    
    const data = await response.json()
    this.token = data.access_token
    return true
  } catch {
    return false
  }
}
```

3. **Verificar sincronização de horário:**
```bash
# Sincronizar horário do sistema
sudo ntpdate -s time.nist.gov  # Linux
w32tm /resync                  # Windows
```

### ❌ Erro: "2FA verification failed"

**Sintomas:**
- Código 2FA não aceito
- "Invalid TOTP code"
- Não consegue fazer login mesmo com código correto

**Soluções:**

1. **Verificar sincronização de horário:**
```bash
# O TOTP depende de horário sincronizado
date
# Ajustar se necessário
```

2. **Usar código de backup:**
```typescript
// Se os códigos TOTP não funcionarem
await apiClient.login(username, password, backup_code)
```

3. **Reconfigurar 2FA:**
```bash
# Desabilitar 2FA via banco de dados (emergência)
sqlite3 backend/database/vault.db
UPDATE users SET is_2fa_enabled = 0 WHERE username = 'seu_usuario';
```

## 💾 Problemas de Banco de Dados

### ❌ Erro: "Database locked"

**Sintomas:**
```bash
sqlite3.OperationalError: database is locked
```

**Soluções:**

1. **Verificar conexões ativas:**
```bash
# Verificar processos usando o banco
lsof backend/database/vault.db
```

2. **Reiniciar o backend:**
```bash
# Parar o processo Python
pkill -f "python main.py"

# Reiniciar
cd backend
python main.py
```

3. **Reparar banco (se necessário):**
```bash
# Fazer backup primeiro
cp backend/database/vault.db backend/database/vault.db.backup

# Reparar
sqlite3 backend/database/vault.db "PRAGMA integrity_check;"
```

### ❌ Erro: "No such table"

**Sintomas:**
```bash
sqlite3.OperationalError: no such table: passwords
```

**Soluções:**

1. **Verificar se o banco foi inicializado:**
```python
# backend/database.py
def initialize_database():
    """Initialize database with required tables"""
    # Executar no primeiro uso
```

2. **Recriar tabelas:**
```bash
# Deletar banco corrompido (CUIDADO!)
rm backend/database/vault.db

# Reiniciar backend para recriar
python main.py
```

### ❌ Erro: "Permission denied" no banco

**Sintomas:**
```bash
PermissionError: [Errno 13] Permission denied: 'backend/database/vault.db'
```

**Soluções:**

1. **Corrigir permissões:**
```bash
# Linux/macOS
chmod 664 backend/database/vault.db
chown $USER:$USER backend/database/vault.db

# Windows
icacls backend\database\vault.db /grant %USERNAME%:F
```

## 🔒 Problemas de Criptografia

### ❌ Erro: "Decryption failed"

**Sintomas:**
- Senhas não são descriptografadas
- "Invalid encryption key"
- Dados corrompidos

**Soluções:**

1. **Verificar senha mestra:**
```python
# Testar descriptografia manual
from crypto_utils import crypto_advanced
# Verificar se a senha mestra está correta
```

2. **Verificar integridade dos dados:**
```sql
-- Verificar dados no banco
SELECT id, title, LENGTH(encrypted_data) as data_size 
FROM passwords 
WHERE encrypted_data IS NULL OR encrypted_data = '';
```

3. **Restaurar de backup:**
```bash
# Se os dados estiverem corrompidos
cp backend/backups/latest_backup.json.enc ./restore.enc
# Restaurar via interface ou API
```

## 📱 Problemas de Interface

### ❌ Erro: "Hydration failed"

**Sintomas:**
```bash
Hydration failed because the initial UI does not match
```

**Soluções:**

1. **Limpar cache do Next.js:**
```bash
rm -rf .next
pnpm dev
```

2. **Verificar SSR/CSR:**
```typescript
// Usar useEffect para operações do cliente
useEffect(() => {
  // Código que depende do navegador
}, [])
```

3. **Verificar localStorage:**
```typescript
// Verificar se está no cliente
if (typeof window !== 'undefined') {
  // Usar localStorage
}
```

### ❌ Erro: "Theme not loading"

**Sintomas:**
- Tema escuro/claro não funciona
- CSS não carrega
- Elementos sem estilo

**Soluções:**

1. **Verificar provider do tema:**
```typescript
// app/layout.tsx
<ThemeProvider attribute="class" defaultTheme="dark">
  {children}
</ThemeProvider>
```

2. **Limpar cache do CSS:**
```bash
rm -rf .next/cache
pnpm dev
```

3. **Verificar Tailwind:**
```bash
# Recompilar CSS
pnpm build:css
```

## 🔄 Problemas de Sincronização

### ❌ Erro: "Sync failed"

**Sintomas:**
- Dispositivos não se conectam
- Dados não sincronizam
- "P2P connection failed"

**Soluções:**

1. **Verificar conectividade:**
```bash
# Testar ping entre dispositivos
ping 192.168.1.100

# Verificar porta P2P
telnet 192.168.1.100 8001
```

2. **Verificar firewall:**
```bash
# Liberar porta P2P
sudo ufw allow 8001  # Linux
# Windows: Configurar via Painel de Controle
```

3. **Reconfigurar pareamento:**
```typescript
// Gerar novo código de pareamento
await apiClient.generatePairingCode()
```

## 🔧 Ferramentas de Debug

### Logs Detalhados

```bash
# Backend logs
cd backend
python main.py --log-level debug

# Frontend logs
NEXT_PUBLIC_DEBUG=true pnpm dev
```

### Monitoramento

```bash
# Monitorar recursos
top -p $(pgrep -f "python main.py")
htop

# Monitorar rede
netstat -an | grep -E ":(3000|8000|8001)"
```

### Testes de Conectividade

```bash
# Testar API endpoints
curl -v http://127.0.0.1:8000/health
curl -v http://localhost:3000/api/health

# Testar autenticação
curl -X POST http://127.0.0.1:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test"}'
```

## 📋 Checklist de Problemas

### ✅ Antes de Reportar um Bug

- [ ] Verificar se o problema persiste após reiniciar
- [ ] Verificar logs do backend e frontend
- [ ] Testar em modo incógnito/privado
- [ ] Verificar se todas as dependências estão atualizadas
- [ ] Testar com configuração padrão
- [ ] Verificar conectividade de rede
- [ ] Limpar cache do navegador
- [ ] Verificar permissões de arquivos

### 📋 Informações para Reportar

Quando reportar um problema, inclua:

```markdown
## Informações do Sistema
- OS: [Windows 11 / macOS 13 / Ubuntu 22.04]
- Node.js: [versão]
- Python: [versão]
- Browser: [Chrome 120 / Firefox 118]

## Versão do FortiVault
- Frontend: [versão]
- Backend: [versão]

## Problema
- Descrição: [descrição detalhada]
- Passos para reproduzir: [1, 2, 3...]
- Comportamento esperado: [o que deveria acontecer]
- Comportamento atual: [o que está acontecendo]

## Logs
```bash
[cole logs relevantes aqui]
```

## Configuração
- Configurações modificadas: [listar]
- Extensões/plugins: [listar]
```

## 🆘 Suporte de Emergência

### Restauração Rápida

```bash
#!/bin/bash
# scripts/emergency-restore.sh

echo "🚨 Iniciando restauração de emergência..."

# Parar serviços
pkill -f "python main.py"
pkill -f "next"

# Fazer backup atual
cp -r backend/database backend/database_backup_$(date +%Y%m%d_%H%M%S)

# Restaurar último backup conhecido
if [ -f "backend/backups/latest_backup.json.enc" ]; then
    echo "Restaurando último backup..."
    # Implementar restauração
fi

# Reiniciar com configuração padrão
echo "Reiniciando com configuração padrão..."
cd backend && python main.py &
cd .. && pnpm dev &

echo "✅ Restauração concluída!"
```

### Reset Total (CUIDADO!)

```bash
#!/bin/bash
# scripts/factory-reset.sh

echo "⚠️  ATENÇÃO: Isso irá apagar TODOS os dados!"
read -p "Digite 'RESET' para confirmar: " confirm

if [ "$confirm" = "RESET" ]; then
    # Backup de segurança
    mkdir -p emergency_backup_$(date +%Y%m%d_%H%M%S)
    cp -r backend/database emergency_backup_*/
    
    # Reset completo
    rm -rf backend/database/*
    rm -rf .next/
    rm -rf node_modules/.cache/
    
    # Reinstalar
    pnpm install
    cd backend && pip install -r requirements.txt
    
    echo "✅ Reset completo concluído!"
else
    echo "❌ Reset cancelado"
fi
```

## 📞 Contatos de Suporte

- 🐛 **Issues**: [GitHub Issues](https://github.com/seu-usuario/FortiVault/issues)
- 💬 **Discussões**: [GitHub Discussions](https://github.com/seu-usuario/FortiVault/discussions)
- 📧 **Email**: suporte@fortivault.com
- 🔧 **Discord**: [Servidor da Comunidade](https://discord.gg/fortivault)

---

**🔧 Não conseguiu resolver?** Abra uma [issue detalhada](https://github.com/seu-usuario/FortiVault/issues/new) e nossa equipe ajudará!
