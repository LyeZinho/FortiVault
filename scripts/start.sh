#!/bin/bash

# FortiVault Docker Startup Script

set -e

echo "🛡️  FortiVault Docker Setup"
echo "========================="

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Check if docker-compose is installed
if ! command -v docker-compose > /dev/null 2>&1; then
    echo "❌ docker-compose is not installed. Please install docker-compose first."
    exit 1
fi

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    
    # Generate a random secret key
    SECRET_KEY=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)
    sed -i "s/your-super-secret-key-min-32-characters-long-change-this/$SECRET_KEY/g" .env
    
    echo "✅ .env file created with random secret key"
    echo "📝 Please review and modify .env file if needed"
fi

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p nginx/logs
mkdir -p nginx/ssl

# Check for SSL certificates in production
if [ "$1" = "prod" ] || [ "$1" = "production" ]; then
    if [ ! -f nginx/ssl/cert.pem ] || [ ! -f nginx/ssl/key.pem ]; then
        echo "⚠️  SSL certificates not found in nginx/ssl/"
        echo "📝 For production, please add your SSL certificates:"
        echo "   - nginx/ssl/cert.pem"
        echo "   - nginx/ssl/key.pem"
        echo "📝 Or modify nginx/nginx.conf to disable HTTPS"
    fi
fi

# Determine which compose file to use
COMPOSE_FILE="docker-compose.yml"
if [ "$1" = "dev" ] || [ "$1" = "development" ]; then
    COMPOSE_FILE="docker-compose.dev.yml"
    echo "🔧 Starting in development mode..."
else
    echo "🚀 Starting in production mode..."
fi

# Pull latest images
echo "📦 Pulling latest images..."
docker-compose -f $COMPOSE_FILE pull

# Build and start services
echo "🏗️  Building and starting services..."
docker-compose -f $COMPOSE_FILE up --build -d

# Wait for services to be healthy
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check service status
echo "📊 Service Status:"
docker-compose -f $COMPOSE_FILE ps

# Display access information
echo ""
echo "✅ FortiVault is starting up!"
echo "🌐 Frontend: http://localhost:3000"
echo "🔌 Backend API: http://localhost:8000"
echo "📚 API Docs: http://localhost:8000/docs"

if [ "$COMPOSE_FILE" = "docker-compose.dev.yml" ]; then
    echo "🗄️  Database Viewer: http://localhost:8080"
fi

echo ""
echo "📝 Useful commands:"
echo "   View logs: docker-compose -f $COMPOSE_FILE logs -f"
echo "   Stop: docker-compose -f $COMPOSE_FILE down"
echo "   Restart: docker-compose -f $COMPOSE_FILE restart"
echo "   Update: docker-compose -f $COMPOSE_FILE pull && docker-compose -f $COMPOSE_FILE up -d"

echo ""
echo "🛡️  FortiVault is ready! Enjoy secure password management!"
