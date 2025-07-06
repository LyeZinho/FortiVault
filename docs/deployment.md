# 🚀 Guia de Deployment - FortiVault

Documentação completa para fazer deploy do FortiVault em diferentes ambientes.

## 🎯 Visão Geral

O FortiVault pode ser implantado de várias formas:
- **Desenvolvimento Local**: Para desenvolvimento e testes
- **Docker**: Containerização para facilitar deploy
- **VPS/Cloud**: Servidores virtuais (DigitalOcean, AWS, etc.)
- **Self-hosted**: Servidores próprios ou Raspberry Pi
- **Desktop**: Aplicação desktop empacotada

## 🐳 Deploy com Docker

### Docker Compose (Recomendado)

#### 1. Criar Arquivos de Configuração

```yaml
# docker-compose.yml
version: '3.8'

services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: fortivault-backend
    ports:
      - "8000:8000"
    environment:
      - DATABASE_PATH=/app/data/vault.db
      - SECRET_KEY=${SECRET_KEY}
      - DEBUG=false
    volumes:
      - vault_data:/app/data
      - backup_data:/app/backups
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
    container_name: fortivault-frontend
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:8000
      - NODE_ENV=production
    depends_on:
      - backend
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    container_name: fortivault-proxy
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
      - ./logs:/var/log/nginx
    depends_on:
      - frontend
      - backend
    restart: unless-stopped

volumes:
  vault_data:
  backup_data:

networks:
  default:
    driver: bridge
```

#### 2. Dockerfile para Backend

```dockerfile
# backend/Dockerfile
FROM python:3.11-slim

# Instalar dependências do sistema
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Configurar diretório de trabalho
WORKDIR /app

# Copiar e instalar dependências Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar código fonte
COPY . .

# Criar diretórios necessários
RUN mkdir -p data backups logs

# Configurar permissões
RUN chmod +x start.sh

# Expor porta
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Comando de inicialização
CMD ["python", "main.py"]
```

#### 3. Dockerfile para Frontend

```dockerfile
# Dockerfile.frontend
FROM node:18-alpine AS builder

WORKDIR /app

# Copiar arquivos de dependências
COPY package.json pnpm-lock.yaml ./

# Instalar pnpm e dependências
RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile

# Copiar código fonte
COPY . .

# Build da aplicação
RUN pnpm build

# Imagem de produção
FROM node:18-alpine AS runner

WORKDIR /app

# Criar usuário não-root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copiar arquivos necessários
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

#### 4. Configuração do Nginx

```nginx
# nginx.conf
events {
    worker_connections 1024;
}

http {
    upstream backend {
        server backend:8000;
    }

    upstream frontend {
        server frontend:3000;
    }

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=auth:10m rate=5r/m;
    limit_req_zone $binary_remote_addr zone=api:10m rate=30r/m;

    server {
        listen 80;
        server_name your-domain.com;

        # Redirect HTTP to HTTPS
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name your-domain.com;

        # SSL Configuration
        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
        ssl_prefer_server_ciphers off;

        # Security Headers
        add_header X-Frame-Options DENY;
        add_header X-Content-Type-Options nosniff;
        add_header X-XSS-Protection "1; mode=block";
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

        # Frontend
        location / {
            proxy_pass http://frontend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Backend API
        location /api/ {
            limit_req zone=api burst=10 nodelay;
            
            proxy_pass http://backend/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Auth endpoints with stricter rate limiting
        location /auth/ {
            limit_req zone=auth burst=3 nodelay;
            
            proxy_pass http://backend/auth/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
```

#### 5. Arquivo de Ambiente

```bash
# .env
SECRET_KEY=your-super-secret-key-min-32-characters-long
DATABASE_PATH=/app/data/vault.db
DEBUG=false
ALLOWED_ORIGINS=https://your-domain.com
```

#### 6. Deploy

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/FortiVault.git
cd FortiVault

# Configure variáveis de ambiente
cp .env.example .env
nano .env  # Edite com suas configurações

# Execute o deploy
docker-compose up -d

# Verificar status
docker-compose ps
docker-compose logs -f
```

## ☁️ Deploy em Cloud Providers

### AWS EC2

#### 1. Configuração da Instância

```bash
# Launch EC2 instance (Ubuntu 22.04 LTS)
# Security Group: Allow ports 22 (SSH), 80 (HTTP), 443 (HTTPS)

# Conectar via SSH
ssh -i your-key.pem ubuntu@your-ec2-ip

# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker ubuntu

# Instalar Docker Compose
sudo apt install docker-compose-plugin

# Logout e login novamente para aplicar grupos
logout
```

#### 2. Configuração de Domínio e SSL

```bash
# Instalar Certbot para Let's Encrypt
sudo apt install certbot

# Obter certificado SSL
sudo certbot certonly --standalone -d your-domain.com

# Configurar renovação automática
sudo crontab -e
# Adicionar linha:
# 0 12 * * * /usr/bin/certbot renew --quiet
```

#### 3. Deploy da Aplicação

```bash
# Clone e configure
git clone https://github.com/seu-usuario/FortiVault.git
cd FortiVault

# Configure SSL no nginx.conf
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem ./ssl/cert.pem
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem ./ssl/key.pem

# Configure ambiente
cp .env.example .env
nano .env

# Deploy
docker compose up -d
```

### DigitalOcean Droplet

#### 1. Script de Instalação Automatizada

```bash
#!/bin/bash
# install-fortivault.sh

set -e

echo "🚀 Instalando FortiVault no DigitalOcean..."

# Atualizar sistema
apt update && apt upgrade -y

# Instalar dependências
apt install -y curl git ufw

# Configurar firewall
ufw allow ssh
ufw allow http
ufw allow https
ufw --force enable

# Instalar Docker
curl -fsSL https://get.docker.com | sh
systemctl enable docker

# Instalar Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Clone do repositório
cd /opt
git clone https://github.com/seu-usuario/FortiVault.git
cd FortiVault

# Configurar ambiente
cp .env.example .env
echo "SECRET_KEY=$(openssl rand -base64 32)" >> .env

# Iniciar aplicação
docker-compose up -d

echo "✅ FortiVault instalado com sucesso!"
echo "🌐 Acesse: http://$(curl -s ifconfig.me)"
```

#### 2. Deploy One-Click

```yaml
# digitalocean-app-spec.yaml
name: fortivault
services:
- name: backend
  source_dir: backend
  github:
    repo: seu-usuario/FortiVault
    branch: main
  run_command: python main.py
  environment_slug: python
  instance_count: 1
  instance_size_slug: basic-xxs
  env:
  - key: DATABASE_PATH
    value: /app/data/vault.db
  - key: SECRET_KEY
    value: ${SECRET_KEY}

- name: frontend
  source_dir: /
  github:
    repo: seu-usuario/FortiVault
    branch: main
  build_command: pnpm build
  run_command: pnpm start
  environment_slug: node-js
  instance_count: 1
  instance_size_slug: basic-xxs
  env:
  - key: NEXT_PUBLIC_API_URL
    value: ${backend.PUBLIC_URL}

databases:
- engine: PG
  name: fortivault-db
  num_nodes: 1
  size: db-s-dev-database
  version: "13"
```

## 🏠 Self-Hosted (Raspberry Pi)

### Configuração Raspberry Pi

```bash
#!/bin/bash
# setup-raspberry-pi.sh

echo "🍓 Configurando FortiVault no Raspberry Pi..."

# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker pi

# Otimizar para ARM
echo "gpu_mem=16" | sudo tee -a /boot/config.txt

# Configurar USB storage (opcional)
sudo mkdir -p /mnt/usb
echo "/dev/sda1 /mnt/usb auto defaults,uid=pi,gid=pi 0 0" | sudo tee -a /etc/fstab

# Clone e configure
cd /home/pi
git clone https://github.com/seu-usuario/FortiVault.git
cd FortiVault

# Use imagens ARM
sed -i 's/python:3.11-slim/python:3.11-slim-arm64v8/g' backend/Dockerfile
sed -i 's/node:18-alpine/node:18-alpine-arm64v8/g' Dockerfile.frontend

# Deploy
docker-compose up -d

echo "✅ FortiVault executando no Raspberry Pi!"
```

## 💻 Desktop App (Electron)

### Configuração Electron

```bash
# Instalar dependências Electron
npm install --save-dev electron electron-builder

# Configurar scripts no package.json
```

```json
{
  "main": "electron/main.js",
  "scripts": {
    "electron": "electron .",
    "electron:dev": "ELECTRON_IS_DEV=true electron .",
    "dist": "electron-builder",
    "pack": "electron-builder --publish=never"
  },
  "build": {
    "appId": "com.fortivault.app",
    "productName": "FortiVault",
    "directories": {
      "buildResources": "build"
    },
    "files": [
      "out/**/*",
      "electron/**/*",
      "backend/**/*"
    ],
    "mac": {
      "icon": "build/icon.icns",
      "category": "public.app-category.productivity"
    },
    "win": {
      "icon": "build/icon.ico",
      "target": "nsis"
    },
    "linux": {
      "icon": "build/icon.png",
      "target": "AppImage"
    }
  }
}
```

```javascript
// electron/main.js
const { app, BrowserWindow, shell } = require('electron')
const path = require('path')
const isDev = process.env.ELECTRON_IS_DEV === 'true'

let mainWindow
let backendProcess

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false
    },
    icon: path.join(__dirname, '../build/icon.png')
  })

  // Start backend
  if (!isDev) {
    const spawn = require('child_process').spawn
    backendProcess = spawn('python', ['backend/main.py'], {
      cwd: path.join(__dirname, '..')
    })
  }

  // Load app
  const startUrl = isDev 
    ? 'http://localhost:3000' 
    : `file://${path.join(__dirname, '../out/index.html')}`
  
  mainWindow.loadURL(startUrl)

  // Open external links in default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (backendProcess) {
    backendProcess.kill()
  }
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})
```

## 🔒 Configurações de Produção

### Variáveis de Ambiente

```bash
# .env.production
NODE_ENV=production
SECRET_KEY=your-super-secret-key-32-chars-min
DATABASE_PATH=/app/data/vault.db
ALLOWED_ORIGINS=https://your-domain.com,https://www.your-domain.com
DEBUG=false
LOG_LEVEL=warning

# SSL/TLS
SSL_CERT_PATH=/etc/ssl/certs/cert.pem
SSL_KEY_PATH=/etc/ssl/private/key.pem

# Rate Limiting
RATE_LIMIT_PER_MINUTE=60
RATE_LIMIT_BURST=100

# Backup
AUTO_BACKUP_ENABLED=true
BACKUP_RETENTION_DAYS=30
BACKUP_ENCRYPTION=true

# Monitoring
SENTRY_DSN=your-sentry-dsn
METRICS_ENABLED=true
```

### Otimizações de Performance

```bash
# nginx-prod.conf - Configurações adicionais
http {
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 10240;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/javascript
        application/xml+rss
        application/json;

    # Browser caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Security headers
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
}
```

## 📊 Monitoramento e Logs

### Docker Compose com Monitoramento

```yaml
# docker-compose.monitoring.yml
version: '3.8'

services:
  # ... serviços existentes ...

  prometheus:
    image: prom/prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus

  grafana:
    image: grafana/grafana
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana_data:/var/lib/grafana

  loki:
    image: grafana/loki
    ports:
      - "3100:3100"
    volumes:
      - loki_data:/loki

volumes:
  prometheus_data:
  grafana_data:
  loki_data:
```

### Script de Backup Automático

```bash
#!/bin/bash
# backup-script.sh

BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
VAULT_DB="/app/data/vault.db"

# Criar backup
sqlite3 $VAULT_DB ".backup ${BACKUP_DIR}/vault_${DATE}.db"

# Comprimir
gzip "${BACKUP_DIR}/vault_${DATE}.db"

# Upload para cloud (opcional)
if [ ! -z "$AWS_S3_BUCKET" ]; then
    aws s3 cp "${BACKUP_DIR}/vault_${DATE}.db.gz" "s3://$AWS_S3_BUCKET/backups/"
fi

# Limpar backups antigos (manter 30 dias)
find $BACKUP_DIR -name "vault_*.db.gz" -mtime +30 -delete

echo "Backup criado: vault_${DATE}.db.gz"
```

## 🔄 Atualizações e Manutenção

### Script de Atualização

```bash
#!/bin/bash
# update-fortivault.sh

echo "🔄 Atualizando FortiVault..."

# Backup antes da atualização
./backup-script.sh

# Parar serviços
docker-compose down

# Backup dos dados
cp -r data data_backup_$(date +%Y%m%d)

# Atualizar código
git pull origin main

# Rebuildar containers
docker-compose build --no-cache

# Iniciar serviços
docker-compose up -d

# Verificar health
sleep 30
docker-compose ps

echo "✅ Atualização concluída!"
```

### Health Check Script

```bash
#!/bin/bash
# health-check.sh

BACKEND_URL="http://localhost:8000/health"
FRONTEND_URL="http://localhost:3000"

# Verificar backend
if curl -f -s $BACKEND_URL > /dev/null; then
    echo "✅ Backend: OK"
else
    echo "❌ Backend: ERRO"
    exit 1
fi

# Verificar frontend
if curl -f -s $FRONTEND_URL > /dev/null; then
    echo "✅ Frontend: OK"
else
    echo "❌ Frontend: ERRO"
    exit 1
fi

echo "✅ Todos os serviços funcionando!"
```

## 📋 Checklist de Deploy

### ✅ Pré-Deploy

- [ ] Testes passando em CI/CD
- [ ] Variáveis de ambiente configuradas
- [ ] SSL/TLS configurado
- [ ] Firewall configurado
- [ ] Backup configurado
- [ ] Monitoramento configurado
- [ ] Domínio apontando para servidor

### ✅ Pós-Deploy

- [ ] Health checks passando
- [ ] SSL funcionando
- [ ] Backup testado
- [ ] Logs sendo coletados
- [ ] Métricas sendo coletadas
- [ ] Notificações configuradas
- [ ] Documentação atualizada

## 🆘 Rollback e Recuperação

### Rollback Rápido

```bash
#!/bin/bash
# rollback.sh

echo "🔄 Executando rollback..."

# Parar serviços atuais
docker-compose down

# Voltar para versão anterior
git checkout HEAD~1

# Restaurar dados se necessário
if [ -d "data_backup_$(date +%Y%m%d)" ]; then
    rm -rf data
    cp -r data_backup_$(date +%Y%m%d) data
fi

# Rebuildar e iniciar
docker-compose build
docker-compose up -d

echo "✅ Rollback concluído!"
```

---

**🚀 Deploy realizado com sucesso!** Seu FortiVault está pronto para produção com segurança e escalabilidade.
