#!/bin/bash

set -e

echo "🔍 Fortivault Docker Compose Validation"
echo "========================================"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

ERRORS=0

# Check 1: Docker installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}✗ Docker not installed${NC}"
    ((ERRORS++))
else
    echo -e "${GREEN}✓ Docker installed${NC}"
fi

# Check 2: Docker Compose installed
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}✗ Docker Compose not installed${NC}"
    ((ERRORS++))
else
    echo -e "${GREEN}✓ Docker Compose installed${NC}"
fi

# Check 3: .env file exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠ .env file not found. Creating from .env.example${NC}"
    if [ -f .env.example ]; then
        cp .env.example .env
        echo -e "${GREEN}✓ .env created (review and update SECRET_KEY)${NC}"
    else
        echo -e "${RED}✗ .env.example not found${NC}"
        ((ERRORS++))
    fi
else
    echo -e "${GREEN}✓ .env file exists${NC}"
fi

# Check 4: Docker Compose file valid
if ! docker-compose config > /dev/null 2>&1; then
    echo -e "${RED}✗ docker-compose.yml is invalid${NC}"
    docker-compose config 2>&1 | head -5
    ((ERRORS++))
else
    echo -e "${GREEN}✓ docker-compose.yml is valid${NC}"
fi

# Check 5: Required files exist
REQUIRED_FILES=(
    "docker-compose.yml"
    "apps/api/Dockerfile"
    "nginx/nginx.conf"
    "nginx/ssl/cert.pem"
    "nginx/ssl/key.pem"
    ".env.example"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        echo -e "${RED}✗ Missing: $file${NC}"
        ((ERRORS++))
    fi
done

if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✓ All required files present${NC}"
fi

# Check 6: Required directories exist
REQUIRED_DIRS=(
    "nginx"
    "nginx/ssl"
    "nginx/logs"
    "apps/api"
    "backend"
)

for dir in "${REQUIRED_DIRS[@]}"; do
    if [ ! -d "$dir" ]; then
        echo -e "${RED}✗ Missing directory: $dir${NC}"
        ((ERRORS++))
    fi
done

if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✓ All required directories present${NC}"
fi

echo ""
echo "========================================"
if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✓ All checks passed! Ready to deploy.${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Review .env and update SECRET_KEY and other sensitive values"
    echo "2. Run: docker-compose up -d"
    echo "3. Check: docker-compose ps"
    echo "4. Access:"
    echo "   - Frontend: http://localhost:3000"
    echo "   - Mail: http://localhost:8025"
    echo "   - Nginx: http://localhost (or https://localhost for SSL)"
    exit 0
else
    echo -e "${RED}✗ $ERRORS check(s) failed. Fix issues before deploying.${NC}"
    exit 1
fi
