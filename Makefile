# FortiVault Docker Management
.PHONY: help build up down logs restart clean dev prod status backup health monitor dashboard

# Default target
help: ## Show this help message
	@echo "FortiVault Docker Management"
	@echo "============================"
	@echo ""
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "\033[36m%-15s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)

# Environment setup
setup: ## Setup environment (create .env, directories)
	@echo "📝 Setting up FortiVault environment..."
	@if [ ! -f .env ]; then \
		cp .env.example .env; \
		echo "✅ Created .env file from template"; \
	else \
		echo "ℹ️  .env file already exists"; \
	fi
	@mkdir -p nginx/logs nginx/ssl
	@echo "✅ Setup complete!"

# Development
dev: setup ## Start development environment
	@echo "🔧 Starting FortiVault in development mode..."
	@docker-compose -f docker-compose.dev.yml up --build -d
	@echo "✅ Development environment started!"
	@echo "🌐 Frontend: http://localhost:3000"
	@echo "🔌 Backend: http://localhost:8000"
	@echo "🗄️  Database Viewer: http://localhost:8080"

dev-logs: ## Show development logs
	@docker-compose -f docker-compose.dev.yml logs -f

dev-down: ## Stop development environment
	@docker-compose -f docker-compose.dev.yml down

# Production
prod: setup ## Start production environment
	@echo "🚀 Starting FortiVault in production mode..."
	@docker-compose up --build -d
	@echo "✅ Production environment started!"
	@echo "🌐 Access: http://localhost (via nginx)"
	@echo "🔌 API: http://localhost/api"

build: ## Build all images
	@echo "🏗️  Building FortiVault images..."
	@docker-compose build --no-cache

up: ## Start services (production)
	@docker-compose up -d

down: ## Stop all services
	@docker-compose down
	@docker-compose -f docker-compose.dev.yml down

# Monitoring
logs: ## Show production logs
	@docker-compose logs -f

status: ## Show service status
	@echo "📊 Production Services:"
	@docker-compose ps
	@echo ""
	@echo "📊 Development Services:"
	@docker-compose -f docker-compose.dev.yml ps

health: ## Check service health
	@echo "🏥 Checking service health..."
	@echo "Backend Health:"
	@curl -s http://localhost:8000/health | jq . 2>/dev/null || echo "❌ Backend not responding"
	@echo ""
	@echo "Frontend Health (Dev):"
	@curl -s http://localhost:3000/api/health | jq . 2>/dev/null || echo "❌ Frontend not responding"
	@echo ""
	@echo "Nginx Proxy Health (Prod):"
	@curl -s http://localhost/api/health | jq . 2>/dev/null || echo "❌ Nginx not responding"

monitor: ## Monitor services continuously
	@echo "🔍 Starting continuous monitoring..."
	@echo "Press Ctrl+C to stop"
	@if [ -f scripts/monitor-health.sh ]; then \
		chmod +x scripts/monitor-health.sh && scripts/monitor-health.sh; \
	else \
		echo "❌ Monitor script not found"; \
	fi

dashboard: ## Open health dashboard in browser
	@echo "📊 Opening FortiVault Health Dashboard..."
	@if command -v xdg-open >/dev/null 2>&1; then \
		xdg-open scripts/health-dashboard.html; \
	elif command -v open >/dev/null 2>&1; then \
		open scripts/health-dashboard.html; \
	elif command -v start >/dev/null 2>&1; then \
		start scripts/health-dashboard.html; \
	else \
		echo "📁 Please open scripts/health-dashboard.html in your browser"; \
	fi

# Maintenance
restart: ## Restart all services
	@docker-compose restart

update: ## Update and restart services
	@echo "📦 Updating FortiVault..."
	@docker-compose pull
	@docker-compose up -d
	@echo "✅ Update complete!"

backup: ## Create database backup
	@echo "💾 Creating database backup..."
	@docker-compose exec backend python -c "import shutil; import datetime; shutil.copy('/app/data/vault.db', f'/app/backups/manual_backup_{datetime.datetime.now().strftime(\"%Y%m%d_%H%M%S\")}.db')"
	@echo "✅ Backup created!"

# Cleanup
clean: ## Remove containers and volumes
	@echo "🧹 Cleaning up FortiVault containers and volumes..."
	@docker-compose down -v
	@docker-compose -f docker-compose.dev.yml down -v
	@docker system prune -f
	@echo "✅ Cleanup complete!"

clean-all: ## Remove everything including images
	@echo "🧹 Removing all FortiVault Docker resources..."
	@docker-compose down -v --rmi all
	@docker-compose -f docker-compose.dev.yml down -v --rmi all
	@docker system prune -af
	@echo "✅ Complete cleanup done!"

# Database
db-shell: ## Access database shell
	@docker-compose exec backend sqlite3 /app/data/vault.db

db-backup: backup ## Alias for backup

db-restore: ## Restore database from backup (specify BACKUP_FILE)
	@if [ -z "$(BACKUP_FILE)" ]; then \
		echo "❌ Please specify BACKUP_FILE: make db-restore BACKUP_FILE=backup.db"; \
	else \
		echo "🔄 Restoring database from $(BACKUP_FILE)..."; \
		docker-compose exec backend cp "/app/backups/$(BACKUP_FILE)" "/app/data/vault.db"; \
		echo "✅ Database restored!"; \
	fi

# SSL Setup
ssl-setup: ## Generate self-signed SSL certificates
	@echo "🔐 Generating self-signed SSL certificates..."
	@mkdir -p nginx/ssl
	@openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
		-keyout nginx/ssl/key.pem \
		-out nginx/ssl/cert.pem \
		-subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
	@echo "✅ SSL certificates generated!"
	@echo "⚠️  These are self-signed certificates for development only"

# Shell access
shell-backend: ## Access backend container shell
	@docker-compose exec backend /bin/bash

shell-frontend: ## Access frontend container shell
	@docker-compose exec frontend /bin/sh

test: ## Run complete Docker setup test
	@echo "🧪 Running FortiVault Docker setup tests..."
	@if [ -f scripts/test-docker-setup.sh ]; then \
		chmod +x scripts/test-docker-setup.sh && scripts/test-docker-setup.sh; \
	else \
		echo "❌ Test script not found"; \
	fi