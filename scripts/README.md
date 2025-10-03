# FortiVault - Scripts de Monitoramento e Utilitários

Este diretório contém scripts utilitários para monitoramento, teste e manutenção do FortiVault.

## 📁 Estrutura dos Scripts

```
scripts/
├── health-dashboard.html     # Dashboard web para monitoramento
├── monitor-health.sh        # Script de monitoramento (Linux/macOS)
├── monitor-health.bat       # Script de monitoramento (Windows)
├── test-docker-setup.sh     # Teste completo do setup Docker (Linux/macOS)
├── test-docker-setup.bat    # Teste completo do setup Docker (Windows)
└── README.md               # Este arquivo
```

## 🔍 Scripts de Monitoramento

### Health Dashboard
**Arquivo:** `health-dashboard.html`

Dashboard web interativo para monitoramento em tempo real dos serviços FortiVault.

**Características:**
- Interface web responsiva
- Monitoramento automático (10 segundos)
- Status visual dos serviços
- Informações detalhadas de cada componente
- Compatível com todos os navegadores

**Como usar:**
```bash
# Via Makefile
make dashboard

# Ou abra diretamente no navegador
open scripts/health-dashboard.html  # macOS
xdg-open scripts/health-dashboard.html  # Linux
start scripts/health-dashboard.html  # Windows
```

### Monitor de Health Check

#### Linux/macOS: `monitor-health.sh`
**Como usar:**
```bash
# Executar uma vez
chmod +x scripts/monitor-health.sh
./scripts/monitor-health.sh

# Via Makefile
make monitor

# Monitoramento contínuo
watch -n 5 ./scripts/monitor-health.sh
```

#### Windows: `monitor-health.bat`
**Como usar:**
```cmd
REM Executar uma vez
scripts\monitor-health.bat

REM Para uso via Makefile no Windows com WSL
make monitor
```

**O que estes scripts testam:**
- ✅ Conectividade básica (portas 3000, 8000, 80)
- ✅ Endpoints de health check
- ✅ Disponibilidade da API
- ✅ Status dos containers Docker
- ✅ Documentação da API

## 🧪 Scripts de Teste

### Teste Completo do Docker Setup

#### Linux/macOS: `test-docker-setup.sh`
#### Windows: `test-docker-setup.bat`

Scripts abrangentes que testam toda a configuração Docker do FortiVault.

**Como usar:**
```bash
# Via Makefile
make test

# Execução direta (Linux/macOS)
chmod +x scripts/test-docker-setup.sh
./scripts/test-docker-setup.sh

# Execução direta (Windows)
scripts\test-docker-setup.bat
```

**O que estes scripts testam:**

1. **Dependências:**
   - Docker instalado e funcionando
   - Docker Compose disponível
   - cURL para testes HTTP

2. **Estrutura de Arquivos:**
   - docker-compose.yml
   - docker-compose.dev.yml
   - Dockerfiles
   - Configuração do Nginx
   - Templates de ambiente

3. **Build de Imagens:**
   - Construção das imagens Docker
   - Verificação de erros de build

4. **Ambiente de Desenvolvimento:**
   - Inicialização dos serviços
   - Teste de conectividade
   - Endpoints de health check
   - Documentação da API

5. **Ambiente de Produção:**
   - Proxy Nginx funcionando
   - Redirecionamento correto
   - SSL (se configurado)

6. **Limpeza:**
   - Parada correta dos serviços
   - Verificação de cleanup

## 📊 Endpoints Monitorados

### Frontend (Next.js)
- **URL:** `http://localhost:3000/api/health`
- **Resposta esperada:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "service": "fortivault-frontend",
  "version": "1.0.0",
  "environment": "production",
  "backend": {
    "status": "healthy",
    "url": "http://backend:8000"
  }
}
```

### Backend (FastAPI)
- **URL:** `http://localhost:8000/health`
- **Resposta esperada:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T12:00:00.000000",
  "version": "2.0.0",
  "service": "fortivault-backend",
  "database": {
    "status": "connected",
    "users": 5,
    "passwords": 42,
    "path": "/app/data/vault.db"
  },
  "features": [
    "authentication",
    "2fa_totp",
    "encryption_aes256",
    "backup_export",
    "p2p_sync"
  ]
}
```

### Nginx (Produção)
- **URL:** `http://localhost/api/health`
- **Comportamento:** Proxy para o frontend

## 🚨 Troubleshooting

### Problemas Comuns

1. **Serviços não respondem:**
   ```bash
   # Verificar se os containers estão rodando
   docker ps --filter name=fortivault
   
   # Ver logs dos containers
   docker-compose logs -f
   ```

2. **Portas ocupadas:**
   ```bash
   # Verificar quais processos estão usando as portas
   netstat -tulpn | grep :3000
   netstat -tulpn | grep :8000
   netstat -tulpn | grep :80
   ```

3. **Problemas de permissão (Linux):**
   ```bash
   # Dar permissão de execução aos scripts
   chmod +x scripts/*.sh
   ```

4. **Docker não instalado/funcionando:**
   ```bash
   # Verificar status do Docker
   systemctl status docker  # Linux
   
   # Iniciar Docker (se parado)
   sudo systemctl start docker  # Linux
   ```

### Logs e Debug

Para debug detalhado, use:

```bash
# Logs em tempo real
make logs

# Logs específicos de um serviço
docker-compose logs -f frontend
docker-compose logs -f backend
docker-compose logs -f nginx

# Status detalhado
make status

# Health check detalhado
make health
```

## 🔧 Personalização

### Modificando Intervalos de Monitoramento

No `health-dashboard.html`, altere a linha:
```javascript
autoRefreshInterval = setInterval(refreshAll, 10000); // 10 segundos
```

Para scripts bash, use o comando `watch`:
```bash
watch -n 30 ./scripts/monitor-health.sh  # A cada 30 segundos
```

### Adicionando Novos Endpoints

Para monitorar endpoints adicionais, edite os arrays `services` nos scripts ou adicione novos testes nos scripts de teste.

## 📋 Checklist de Manutenção

- [ ] Executar `make test` mensalmente
- [ ] Verificar logs regularmente (`make logs`)
- [ ] Monitorar uso de recursos (`docker stats`)
- [ ] Backup do banco de dados (`make backup`)
- [ ] Atualizar images (`make update`)
- [ ] Verificar certificados SSL (se aplicável)

Para mais informações, consulte a [documentação principal](../docs/README.md).