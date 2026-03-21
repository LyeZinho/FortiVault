#!/bin/bash
set -e

echo "🧪 Fortivault Mail Sandbox Test Script"
echo "======================================"

echo "📦 Checking services..."
docker-compose ps | grep -q "fv-mail" && echo "✅ fv-mail running" || echo "❌ fv-mail not running"
docker-compose ps | grep -q "backend" && echo "✅ backend running" || echo "❌ backend not running"

echo ""
echo "📧 Testing SMTP connectivity..."
docker exec fortivault-backend-default bash -c "timeout 5 bash -c 'cat < /dev/null > /dev/tcp/fv-mail/1025'" && echo "✅ SMTP port 1025 accessible" || echo "❌ SMTP connection failed"

echo ""
echo "🌐 Testing Mailpit API..."
MAILPIT_STATUS=$(curl -s http://localhost:8025 | head -20 | grep -i "mailpit" || echo "")
if [ -n "$MAILPIT_STATUS" ]; then
  echo "✅ Mailpit webmail accessible at http://localhost:8025"
else
  echo "❌ Mailpit webmail not accessible"
fi

echo ""
echo "📋 Checking email templates..."
TEMPLATES="activation.hbs password-reset.hbs department-invite.hbs security-alert.hbs"
TEMPLATE_DIR="./apps/api/src/mail/templates"
for template in $TEMPLATES; do
  if [ -f "$TEMPLATE_DIR/$template" ]; then
    echo "✅ $template"
  else
    echo "❌ $template missing"
  fi
done

echo ""
echo "✨ Test complete!"
echo "📖 Visit http://localhost:8025 to access Mailpit admin panel"
