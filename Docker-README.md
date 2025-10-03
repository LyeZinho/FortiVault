# �️ FortiVault - Setup Docker Completo ✅

## 📋 Resumo do que foi implementado

### 🐳 **Containerização Docker**
- ✅ `docker-compose.yml` - Ambiente de produção
- ✅ `docker-compose.dev.yml` - Ambiente de desenvolvimento  
- ✅ `Dockerfile.backend` - Container Python/FastAPI
- ✅ `Dockerfile.frontend` - Container Node.js/Next.js
- ✅ `nginx/nginx.conf` - Reverse proxy e load balancer
- ✅ `.env.example` - Template de variáveis de ambiente
- ✅ `.dockerignore` - Arquivos ignorados no build

### 🔍 **Monitoramento e Health Checks**
- ✅ `/api/health` - Endpoint de health check do frontend
- ✅ `/health` - Endpoint melhorado do backend com info do DB
- ✅ `scripts/health-dashboard.html` - Dashboard web interativo
- ✅ `scripts/monitor-health.sh` - Script de monitoramento (Linux/macOS)
- ✅ `scripts/monitor-health.bat` - Script de monitoramento (Windows)

### 🧪 **Scripts de Teste**
- ✅ `scripts/test-docker-setup.sh` - Teste completo (Linux/macOS)
- ✅ `scripts/test-docker-setup.bat` - Teste completo (Windows)
- ✅ Testes automatizados de conectividade, build e deploy

### �️ **Makefile com Comandos**
- ✅ `make dev` - Inicia ambiente de desenvolvimento
- ✅ `make prod` - Inicia ambiente de produção
- ✅ `make health` - Verifica saúde dos serviços
- ✅ `make monitor` - Monitoramento contínuo
- ✅ `make dashboard` - Abre dashboard de monitoramento
- ✅ `make test` - Executa suite de testes completa
- ✅ `make logs` - Visualiza logs dos containers
- ✅ `make clean` - Limpeza completa

### 📚 **Documentação**
- ✅ `scripts/README.md` - Documentação dos scripts de monitoramento
- ✅ Documentação completa já existente em `docs/`

## 🚀 **Como usar agora**

### Desenvolvimento
```bash
# Clonar e entrar no projeto
git clone <repo> && cd FortiVault

# Configurar ambiente
cp .env.example .env
# Editar .env com suas configurações

# Testar setup completo
make test

# Iniciar desenvolvimento
make dev

# Monitorar serviços
make dashboard
# ou
make monitor
```

### Produção
```bash
# Iniciar produção
make prod

# Verificar saúde
make health

# Ver logs
make logs

# Backup
make backup
```

## 🌐 **URLs dos Serviços**

### Desenvolvimento (`make dev`)
- **Frontend:** http://localhost:3000
- **Backend:** http://localhost:8000  
- **API Docs:** http://localhost:8000/docs
- **Health Frontend:** http://localhost:3000/api/health
- **Health Backend:** http://localhost:8000/health

### Produção (`make prod`)
- **Aplicação:** http://localhost (via Nginx)
- **API:** http://localhost/api/*
- **API Docs:** http://localhost/api/docs  
- **Health Check:** http://localhost/api/health

## 🔧 **Arquitetura Docker**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Nginx Proxy   │    │  Frontend       │    │  Backend        │
│   (Port 80)     │◄──►│  (Next.js)      │◄──►│  (FastAPI)      │
│                 │    │  Port 3000      │    │  Port 8000      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   SQLite DB     │
                    │   (Volume)      │
                    └─────────────────┘
```

## 📊 **Recursos de Monitoramento**

### Health Dashboard
- Interface web moderna e responsiva
- Auto-refresh a cada 10 segundos
- Status visual em tempo real
- Informações detalhadas de cada serviço

### Scripts de Monitoramento  
- Verificação de conectividade
- Teste de endpoints
- Status dos containers
- Logs centralizados

### Testes Automatizados
- Verificação de dependências
- Teste de build das imagens
- Validação de ambientes dev e prod
- Cleanup automático

## 🎯 **Próximos Passos Sugeridos**

1. **Teste o setup:**
   ```bash
   make test
   ```

2. **Inicie o desenvolvimento:**
   ```bash
   make dev
   make dashboard  # Para monitorar
   ```

3. **Teste a produção:**
   ```bash
   make prod
   make health
   ```

4. **Configure SSL (opcional):**
   ```bash
   make ssl-setup
   ```

5. **Backup regular:**
   ```bash
   make backup
   ```

## 🔒 **Segurança Implementada**

- ✅ Containers isolados
- ✅ Nginx como proxy reverso
- ✅ Variáveis de ambiente seguras
- ✅ Volumes persistentes para dados
- ✅ Health checks para monitoramento
- ✅ Logs centralizados para auditoria

## 🎉 **Status: Pronto para uso!**

O FortiVault agora está completamente containerizado com Docker, incluindo:
- Ambientes de desenvolvimento e produção
- Monitoramento completo
- Testes automatizados  
- Scripts de manutenção
- Documentação abrangente

Execute `make test` para validar toda a configuração!

## 📁 Estrutura dos Arquivos Docker

```
├── docker-compose.yml          # Produção
├── docker-compose.dev.yml      # Desenvolvimento
├── Dockerfile.frontend         # Build do frontend
├── Dockerfile.dev             # Frontend desenvolvimento
├── backend/Dockerfile         # Build do backend
├── nginx/nginx.conf          # Configuração nginx
├── .env.example              # Exemplo de variáveis
├── .dockerignore             # Arquivos ignorados
└── scripts/
    ├── start.sh              # Script Linux/macOS
    └── start.bat             # Script Windows
```

## ⚙️ Configuração

### Variáveis de Ambiente

Copie `.env.example` para `.env` e ajuste conforme necessário:

```bash
cp .env.example .env
```

**Principais variáveis:**
- `SECRET_KEY`: Chave secreta (será gerada automaticamente)
- `DATABASE_PATH`: Caminho do banco de dados
- `ALLOWED_ORIGINS`: Origens permitidas para CORS
- `DEBUG`: Modo debug (true/false)

### SSL/HTTPS (Produção)

Para produção com HTTPS:

1. **Gerar certificados self-signed (desenvolvimento):**
```bash
make ssl-setup
```

2. **Certificados reais (produção):**
```bash
# Coloque seus certificados em:
nginx/ssl/cert.pem
nginx/ssl/key.pem
```

3. **Descomente a seção HTTPS no nginx.conf**

## 🔧 Comandos Úteis

### Gerenciamento Básico

```bash
# Ver status dos serviços
docker-compose ps
make status

# Ver logs
docker-compose logs -f
make logs

# Parar serviços
docker-compose down
make down

# Reiniciar
docker-compose restart
make restart
```

### Manutenção

```bash
# Backup do banco
make backup

# Atualizar serviços
make update

# Limpar containers
make clean

# Acesso ao shell do backend
make shell-backend

# Acesso ao banco de dados
make db-shell
```

### Desenvolvimento

```bash
# Iniciar em modo desenvolvimento
make dev

# Ver logs de desenvolvimento
make dev-logs

# Parar desenvolvimento
make dev-down
```

## 🌐 Acessos

### Desenvolvimento (`docker-compose.dev.yml`)
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **Database Viewer**: http://localhost:8080

### Produção (`docker-compose.yml`)
- **Aplicação**: http://localhost (nginx)
- **API**: http://localhost/api
- **Documentação**: http://localhost/api/docs

## 📊 Volumes e Dados

### Volumes Persistentes
- `vault_data`: Banco de dados SQLite
- `backup_data`: Backups automáticos
- `nginx/logs`: Logs do nginx

### Backup/Restore

```bash
# Criar backup manual
make backup

# Restaurar backup
make db-restore BACKUP_FILE=backup_20241004.db

# Backup completo (incluindo volumes)
docker run --rm -v fortivault_vault_data:/data -v $(pwd):/backup alpine tar czf /backup/fortivault_backup_$(date +%Y%m%d).tar.gz /data
```

## 🔍 Troubleshooting

### Problemas Comuns

**1. Porta já em uso:**
```bash
# Verificar o que está usando a porta
netstat -an | grep :3000
lsof -i :3000

# Parar processo
kill -9 <PID>
```

**2. Permissões de arquivo:**
```bash
# Corrigir permissões
sudo chown -R $USER:$USER .
chmod +x scripts/start.sh
```

**3. Problemas de build:**
```bash
# Build sem cache
docker-compose build --no-cache

# Limpar tudo e reconstruir
make clean
make build
```

**4. Verificar saúde dos serviços:**
```bash
make health
```

### Logs de Debug

```bash
# Logs detalhados de todos os serviços
docker-compose logs -f --tail=100

# Logs de um serviço específico
docker-compose logs -f backend
docker-compose logs -f frontend

# Logs do nginx
docker-compose logs -f nginx
```

## 🔐 Segurança

### Considerações de Produção

1. **Altere todas as senhas padrão**
2. **Configure SSL/HTTPS adequado**
3. **Configure firewall para portas necessárias**
4. **Configure backups automáticos**
5. **Configure logs centralizados**
6. **Monitore recursos do sistema**

### Headers de Segurança

O nginx está configurado com headers de segurança:
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- X-XSS-Protection
- Strict-Transport-Security (HTTPS)

## 📈 Monitoramento

### Métricas Básicas

```bash
# Uso de recursos
docker stats

# Espaço em disco
docker system df

# Informações do sistema
docker system info
```

### Health Checks

Todos os serviços incluem health checks:
- Backend: `GET /health`
- Frontend: `GET /api/health`
- Nginx: Proxy pass health

## 🆙 Atualizações

```bash
# Atualização simples
make update

# Atualização manual
git pull origin main
docker-compose pull
docker-compose up -d
```

## 📞 Suporte

Se encontrar problemas:

1. Verifique os logs: `make logs`
2. Verifique a saúde: `make health`
3. Consulte a [documentação completa](./docs/)
4. Abra uma [issue no GitHub](https://github.com/LyeZinho/FortiVault/issues)

---

**🐳 Docker setup completo!** Aproveite o FortiVault containerizado!