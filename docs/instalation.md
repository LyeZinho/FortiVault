# 📥 Guia de Instalação - FortiVault

Este guia fornece instruções detalhadas para instalar e configurar o FortiVault em diferentes ambientes.

## 📋 Pré-requisitos

### Sistema Operacional
- ✅ **Windows 10/11**
- ✅ **macOS 10.15+**
- ✅ **Ubuntu 20.04+**
- ✅ **Debian 11+**

### Software Necessário

#### Frontend (Next.js)
- **Node.js**: 18.17.0 ou superior
- **pnpm**: 8.0.0 ou superior (recomendado) ou npm/yarn
- **Git**: Para controle de versão

#### Backend (Python)
- **Python**: 3.11 ou superior
- **pip**: Gerenciador de pacotes Python
- **SQLite**: Incluído no Python

## 🚀 Instalação Rápida

### 1. Clone o Repositório

```bash
# HTTPS
git clone https://github.com/seu-usuario/FortiVault.git

# SSH (se configurado)
git clone git@github.com:seu-usuario/FortiVault.git

cd FortiVault
```

### 2. Configuração do Backend

```bash
# Navegue para a pasta do backend
cd backend

# Crie um ambiente virtual (recomendado)
python -m venv venv

# Ative o ambiente virtual
# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

# Instale as dependências
pip install -r requirements.txt

# Execute o servidor backend
python main.py
```

O backend estará disponível em: `http://127.0.0.1:8000`

### 3. Configuração do Frontend

```bash
# Em um novo terminal, navegue para a raiz do projeto
cd FortiVault

# Instale as dependências
pnpm install

# Execute o servidor de desenvolvimento
pnpm dev
```

O frontend estará disponível em: `http://localhost:3000`

## 🔧 Instalação Detalhada

### Instalação do Node.js e pnpm

#### Windows
```powershell
# Instalar Node.js via winget
winget install OpenJS.NodeJS

# Instalar pnpm
npm install -g pnpm
```

#### macOS
```bash
# Instalar Node.js via Homebrew
brew install node

# Instalar pnpm
npm install -g pnpm
```

#### Ubuntu/Debian
```bash
# Instalar Node.js via NodeSource
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Instalar pnpm
npm install -g pnpm
```

### Instalação do Python

#### Windows
```powershell
# Via winget
winget install Python.Python.3.11

# Ou baixe do site oficial
# https://www.python.org/downloads/windows/
```

#### macOS
```bash
# Via Homebrew
brew install python@3.11
```

#### Ubuntu/Debian
```bash
# Ubuntu 22.04+ já inclui Python 3.11
sudo apt update
sudo apt install python3.11 python3.11-venv python3.11-pip

# Para versões mais antigas
sudo apt install software-properties-common
sudo add-apt-repository ppa:deadsnakes/ppa
sudo apt update
sudo apt install python3.11 python3.11-venv python3.11-pip
```

## 🐳 Instalação com Docker

### Usando Docker Compose

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/FortiVault.git
cd FortiVault

# Execute com Docker Compose
docker-compose up -d
```

### Dockerfile Manual

#### Backend
```dockerfile
# Dockerfile.backend
FROM python:3.11-slim

WORKDIR /app
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ .
EXPOSE 8000
CMD ["python", "main.py"]
```

#### Frontend
```dockerfile
# Dockerfile.frontend
FROM node:18-alpine

WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install

COPY . .
RUN pnpm build
EXPOSE 3000
CMD ["pnpm", "start"]
```

## 🔧 Configuração Inicial

### 1. Primeiro Acesso

1. Acesse `http://localhost:3000`
2. Clique em "Criar Nova Conta"
3. Configure sua conta principal:
   - **Nome de usuário**
   - **Email**
   - **Senha da conta**

### 2. Configuração da Senha Mestra

1. Após o registro, configure sua **Senha Mestra**
2. Esta senha é usada para criptografar todas as suas senhas
3. ⚠️ **IMPORTANTE**: Esta senha não pode ser recuperada se perdida

### 3. Configuração 2FA (Opcional mas Recomendado)

1. Vá para **Configurações** → **Segurança**
2. Clique em "Configurar 2FA"
3. Escaneie o QR Code com um app como:
   - Google Authenticator
   - Authy
   - Microsoft Authenticator
4. Salve os códigos de backup em local seguro

## 🔍 Verificação da Instalação

### Teste de Funcionamento

1. **Backend**: Acesse `http://127.0.0.1:8000/docs` para ver a documentação da API
2. **Frontend**: Acesse `http://localhost:3000` para a interface
3. **Saúde do Sistema**: `http://127.0.0.1:8000/health`

### Comandos de Verificação

```bash
# Verificar versões
node --version    # Deve ser 18+
python --version  # Deve ser 3.11+
pnpm --version    # Deve ser 8+

# Verificar serviços
curl http://127.0.0.1:8000/health
curl http://localhost:3000
```

## ⚠️ Solução de Problemas Comuns

### Erro: "Port 3000 already in use"
```bash
# Encontrar processo usando a porta
lsof -ti:3000
# Parar o processo
kill -9 <PID>
```

### Erro: "Python module not found"
```bash
# Verificar se o ambiente virtual está ativo
which python
# Reativar se necessário
source venv/bin/activate  # Linux/macOS
venv\Scripts\activate     # Windows
```

### Erro: "Cannot connect to backend"
1. Verifique se o backend está rodando na porta 8000
2. Verifique o firewall/antivírus
3. Tente acessar `http://127.0.0.1:8000/health`

### Erro de Dependências
```bash
# Limpar cache e reinstalar
pnpm store prune
rm -rf node_modules pnpm-lock.yaml
pnpm install

# Para Python
pip cache purge
pip install -r requirements.txt --force-reinstall
```

## 🔄 Próximos Passos

Após a instalação bem-sucedida:

1. 📖 Leia o [Guia de Configuração](./configuration.md)
2. 🔒 Configure a [Segurança](./security.md)
3. 🛠️ Explore o [Guia de Desenvolvimento](./development.md)

## 🆘 Suporte

Se você encontrar problemas durante a instalação:

- 🐛 [Abra uma issue](https://github.com/seu-usuario/FortiVault/issues)
- 💬 [Participe das discussões](https://github.com/seu-usuario/FortiVault/discussions)
- 📖 Consulte a [Solução de Problemas](./troubleshooting.md)

---

**✅ Instalação concluída com sucesso!** Agora você pode começar a usar o FortiVault com segurança.