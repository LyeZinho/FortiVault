#!/bin/bash

# FortiVault - Script de monitoramento de health check

echo "🔍 FortiVault Health Check Monitor"
echo "=================================="
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# URLs dos serviços
FRONTEND_URL="http://localhost:3000"
BACKEND_URL="http://localhost:8000"
NGINX_URL="http://localhost:80"

# Função para testar endpoint
test_endpoint() {
    local name=$1
    local url=$2
    local endpoint=$3
    
    echo -n "Testing $name ($url$endpoint)... "
    
    response=$(curl -s -w "%{http_code}" -o /tmp/health_response.json "$url$endpoint" 2>/dev/null)
    http_code=${response: -3}
    
    if [ "$http_code" = "200" ]; then
        echo -e "${GREEN}✓ OK${NC}"
        if [ -f /tmp/health_response.json ]; then
            echo "  Response: $(cat /tmp/health_response.json | jq -r '.status // "unknown"') - $(cat /tmp/health_response.json | jq -r '.timestamp // "no timestamp"')"
        fi
    else
        echo -e "${RED}✗ FAILED${NC} (HTTP $http_code)"
        if [ -f /tmp/health_response.json ]; then
            echo "  Error: $(cat /tmp/health_response.json)"
        fi
    fi
    echo ""
}

# Função para testar conectividade básica
test_connectivity() {
    local name=$1
    local host=$2
    local port=$3
    
    echo -n "Testing $name connectivity ($host:$port)... "
    
    if timeout 5 bash -c "</dev/tcp/$host/$port" 2>/dev/null; then
        echo -e "${GREEN}✓ Connected${NC}"
    else
        echo -e "${RED}✗ Connection failed${NC}"
    fi
}

# Testar conectividade básica
echo -e "${BLUE}1. Testing Basic Connectivity${NC}"
echo "-----------------------------"
test_connectivity "Frontend" "localhost" "3000"
test_connectivity "Backend" "localhost" "8000"
test_connectivity "Nginx" "localhost" "80"
echo ""

# Testar health checks
echo -e "${BLUE}2. Testing Health Endpoints${NC}"
echo "----------------------------"
test_endpoint "Frontend" "$FRONTEND_URL" "/api/health"
test_endpoint "Backend" "$BACKEND_URL" "/health"
test_endpoint "Nginx (Frontend Proxy)" "$NGINX_URL" "/api/health"
echo ""

# Testar outros endpoints importantes
echo -e "${BLUE}3. Testing Key Backend Endpoints${NC}"
echo "--------------------------------"
test_endpoint "Backend Docs" "$BACKEND_URL" "/docs"
test_endpoint "Backend OpenAPI" "$BACKEND_URL" "/openapi.json"
echo ""

# Docker status (se aplicável)
echo -e "${BLUE}4. Docker Container Status${NC}"
echo "---------------------------"
if command -v docker &> /dev/null; then
    docker ps --filter name=fortivault --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null || echo "No FortiVault containers running"
else
    echo "Docker not available"
fi
echo ""

# Cleanup
rm -f /tmp/health_response.json

echo -e "${YELLOW}Monitoring complete!${NC}"
echo ""
echo "For continuous monitoring, run:"
echo "  watch -n 5 ./monitor-health.sh"
echo ""
echo "For Docker logs:"
echo "  docker-compose logs -f"