# Fortivault Docker Compose Deployment Guide

## Quick Start (Plug & Play)

### Prerequisites
- Docker & Docker Compose installed
- 2GB+ free disk space
- Ports available: 80, 443, 3000, 3001, 8000, 8025

### 1. Validate Setup
```bash
bash scripts/validate-compose.sh
```
This checks for all required files, directories, and configurations.

### 2. Configure Environment
```bash
# Copy template
cp .env.example .env

# Edit with your values
nano .env
```

**Critical settings:**
- `SECRET_KEY` - Change this! Use 32+ characters
- `INSTANCE_ID` - Unique name if running multiple instances
- `NESTJS_JWT_SECRET` - Change this!

### 3. Start Services
```bash
docker-compose up -d
```

### 4. Verify Deployment
```bash
docker-compose ps
```

All services should show `healthy` or `up`.

### 5. Access Services

| Service | URL | Purpose |
|---------|-----|---------|
| Frontend | http://localhost:3000 | Web UI |
| Mail Admin | http://localhost:8025 | Mailpit dashboard |
| Python API | http://localhost:8000 | FastAPI backend |
| NestJS API | http://localhost:3001 | NestJS backend |
| Nginx Proxy | http://localhost | Unified entry point |

## Architecture

```
┌─────────────────────────────────────────────────┐
│              Nginx (Proxy)                       │
│        (80, 443 - Public Interface)             │
└──────────────┬────────┬────────┬────────────────┘
               │        │        │
         ┌─────▼──┐ ┌──▼──┐ ┌──▼──┐
         │Frontend│ │MailPit  │ │APIs  │
         └────────┘ └──────┘ └──────┘
                         │
                ┌────────┴─────────┐
                │                  │
         ┌──────▼────┐      ┌──────▼────┐
         │  FastAPI  │      │  NestJS   │
         │  (Python) │      │(Mail Sys) │
         └───────────┘      └───────────┘
         
    Internal Network (fv-internal):
    ┌──────────────────────────────────┐
    │  Mailpit ────► APIs              │
    │  (internal:true)                 │
    └──────────────────────────────────┘
```

## Mail Sandbox Features

**Mailpit** provides an internal, zero-external-dependency mail system:

- **SMTP Server** (port 1025, internal only)
- **IMAP Server** (port 1143, internal only)  
- **Web UI** (port 8025, routed via Nginx)
- **30-day retention** (auto-delete)
- **No SendGrid/AWS SES required**

### Testing Mail

```bash
bash scripts/test-mail.sh
```

This validates:
- Services running
- SMTP connectivity
- Mail templates
- Mailpit accessibility

## Troubleshooting

### Services not starting
```bash
docker-compose logs fv-mail
docker-compose logs nestjs-api
docker-compose logs backend
```

### Port already in use
```bash
# Find process on port
lsof -i :3001

# Or run with different instance ID
INSTANCE_ID=dev2 docker-compose up -d
```

### Health check failing
```bash
# Check specific service health
docker exec fortivault-nestjs-api-default wget -O- http://localhost:3001/health
```

### Mail not sending
1. Verify NestJS API can reach Mailpit:
   ```bash
   docker exec fortivault-nestjs-api-default nc -zv fv-mail 1025
   ```

2. Check Mailpit dashboard: http://localhost:8025

3. View API logs:
   ```bash
   docker-compose logs nestjs-api | grep -i mail
   ```

## Production Considerations

### Before Production Deployment

1. **Update Secrets**
   - Generate new `SECRET_KEY` (32+ chars, random)
   - Generate new `NESTJS_JWT_SECRET`
   - Update database credentials

2. **SSL/TLS**
   - Replace self-signed certs in `nginx/ssl/`
   - Set `USE_SSL=true` in `.env`
   - Configure real domain in nginx config

3. **Database**
   - Use managed PostgreSQL (not local SQLite)
   - Configure `DB_*` variables
   - Run migrations

4. **Mail Retention**
   - Adjust `MP_RETENTION_HOURS` for your needs
   - Set up log rotation for `nginx/logs/`

5. **Monitoring**
   - Add health check monitoring
   - Set up log aggregation
   - Configure alerts

### Performance Tuning

```env
# For high mail volume
MP_MAX_MESSAGES=5000
MP_RETENTION_HOURS=360

# For multi-instance
INSTANCE_ID=prod-1
```

## Cleanup & Shutdown

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (WARNING: data loss)
docker-compose down -v

# Remove specific instance
INSTANCE_ID=dev docker-compose down
```

## Support

- **Mail Issues**: Check `docs/MAIL_SETUP.md`
- **Compose Config**: Review `docker-compose.yml`
- **NestJS API**: See `apps/api/` README
- **Python Backend**: See `backend/` README

---

**Version**: 1.0  
**Last Updated**: 2026-03-21  
**Status**: Production-Ready
