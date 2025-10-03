#!/bin/bash

# FortiVault - Script de teste completo do Docker setup

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Contadores de testes
TESTS_PASSED=0
TESTS_FAILED=0
TOTAL_TESTS=0

echo -e "${BLUE}🛡️  FortiVault Docker Setup Test Suite${NC}"
echo "========================================"
echo ""

# Função para executar teste
run_test() {
    local test_name="$1"
    local test_command="$2"
    local expected_result="$3"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    echo -n "Testing $test_name... "
    
    if eval "$test_command" > /dev/null 2>&1; then
        if [ "$expected_result" = "success" ]; then
            echo -e "${GREEN}✓ PASSED${NC}"
            TESTS_PASSED=$((TESTS_PASSED + 1))
        else
            echo -e "${RED}✗ FAILED${NC} (expected failure but got success)"
            TESTS_FAILED=$((TESTS_FAILED + 1))
        fi
    else
        if [ "$expected_result" = "failure" ]; then
            echo -e "${GREEN}✓ PASSED${NC} (expected failure)"
            TESTS_PASSED=$((TESTS_PASSED + 1))
        else
            echo -e "${RED}✗ FAILED${NC}"
            TESTS_FAILED=$((TESTS_FAILED + 1))
        fi
    fi
}

# Função para verificar se comando existe
check_dependency() {
    local cmd="$1"
    local name="$2"
    
    echo -n "Checking $name... "
    if command -v "$cmd" &> /dev/null; then
        echo -e "${GREEN}✓ Available${NC}"
        return 0
    else
        echo -e "${RED}✗ Missing${NC}"
        return 1
    fi
}

echo -e "${PURPLE}1. Checking Dependencies${NC}"
echo "------------------------"

# Verificar dependências
DEPS_OK=true
check_dependency "docker" "Docker" || DEPS_OK=false
check_dependency "docker-compose" "Docker Compose" || DEPS_OK=false
check_dependency "curl" "cURL" || DEPS_OK=false
check_dependency "jq" "jq (JSON processor)" || echo -e "${YELLOW}⚠ Optional${NC}"

if [ "$DEPS_OK" = false ]; then
    echo -e "${RED}❌ Missing required dependencies. Please install Docker and Docker Compose.${NC}"
    exit 1
fi

echo ""

echo -e "${PURPLE}2. Testing File Structure${NC}"
echo "--------------------------"

# Verificar arquivos essenciais
run_test "Docker Compose file" "[ -f docker-compose.yml ]" "success"
run_test "Development compose file" "[ -f docker-compose.dev.yml ]" "success"
run_test "Backend Dockerfile" "[ -f Dockerfile.backend ]" "success"
run_test "Frontend Dockerfile" "[ -f Dockerfile.frontend ]" "success"
run_test "Nginx config" "[ -f nginx/nginx.conf ]" "success"
run_test "Environment template" "[ -f .env.example ]" "success"
run_test "Makefile" "[ -f Makefile ]" "success"
run_test "Health scripts" "[ -f scripts/monitor-health.sh ]" "success"
run_test "Health dashboard" "[ -f scripts/health-dashboard.html ]" "success"

echo ""

echo -e "${PURPLE}3. Testing Docker Environment${NC}"
echo "------------------------------"

# Testar Docker
run_test "Docker daemon" "docker info" "success"
run_test "Docker Compose version" "docker-compose --version" "success"

echo ""

echo -e "${PURPLE}4. Building Images${NC}"
echo "------------------"

echo "Building FortiVault images (this may take a few minutes)..."
if docker-compose build --no-cache > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Images built successfully${NC}"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo -e "${RED}✗ Failed to build images${NC}"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

echo ""

echo -e "${PURPLE}5. Testing Development Environment${NC}"
echo "----------------------------------"

echo "Starting development environment..."
docker-compose -f docker-compose.dev.yml up -d > /dev/null 2>&1

# Esperar um pouco para os serviços iniciarem
echo "Waiting for services to start (30 seconds)..."
sleep 30

# Testar conectividade
run_test "Frontend port (3000)" "curl -f http://localhost:3000 --max-time 10" "success"
run_test "Backend port (8000)" "curl -f http://localhost:8000/health --max-time 10" "success"
run_test "Frontend health endpoint" "curl -f http://localhost:3000/api/health --max-time 10" "success"
run_test "Backend API docs" "curl -f http://localhost:8000/docs --max-time 10" "success"

echo ""

echo -e "${PURPLE}6. Testing Production Environment${NC}"
echo "--------------------------------"

echo "Stopping development environment..."
docker-compose -f docker-compose.dev.yml down > /dev/null 2>&1

echo "Starting production environment..."
docker-compose up -d > /dev/null 2>&1

# Esperar um pouco para os serviços iniciarem
echo "Waiting for services to start (30 seconds)..."
sleep 30

# Testar conectividade
run_test "Nginx proxy (port 80)" "curl -f http://localhost --max-time 10" "success"
run_test "Proxied health endpoint" "curl -f http://localhost/api/health --max-time 10" "success"
run_test "Proxied API docs" "curl -f http://localhost/api/docs --max-time 10" "success"

echo ""

echo -e "${PURPLE}7. Cleanup${NC}"
echo "----------"

echo "Stopping all services..."
docker-compose down > /dev/null 2>&1
docker-compose -f docker-compose.dev.yml down > /dev/null 2>&1

run_test "Services stopped" "! docker ps --filter name=fortivault --quiet | grep -q ." "success"

echo ""

echo -e "${CYAN}8. Test Results Summary${NC}"
echo "======================="
echo ""
echo "Total Tests: $TOTAL_TESTS"
echo -e "Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Failed: ${RED}$TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed! FortiVault Docker setup is working correctly.${NC}"
    echo ""
    echo -e "${YELLOW}Next steps:${NC}"
    echo "1. Run 'make dev' to start development environment"
    echo "2. Run 'make prod' to start production environment"
    echo "3. Run 'make health' to check service health"
    echo "4. Run 'make dashboard' to open monitoring dashboard"
    echo ""
    exit 0
else
    echo -e "${RED}❌ Some tests failed. Please check the output above and fix any issues.${NC}"
    echo ""
    echo -e "${YELLOW}Common issues:${NC}"
    echo "- Docker daemon not running"
    echo "- Ports 80, 3000, or 8000 already in use"
    echo "- Insufficient permissions"
    echo "- Missing environment file (.env)"
    echo ""
    exit 1
fi