#!/bin/bash
# JARVIS 2-Flow Service Management Script

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo "╔═══════════════════════════════════════════════════════╗"
echo "║         🤖 JARVIS 2-Flow Service Status            ║"
echo "╚═══════════════════════════════════════════════════════╝"
echo ""

# Check if running
if pgrep -f "node.*jarvis" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ JARVIS Status: Running${NC}"
    PID=$(pgrep -f "node.*jarvis")
    echo "   PID: $PID"
else
    echo -e "${RED}❌ JARVIS Status: Not Running${NC}"
fi

echo ""
echo "─────────────────────────────────────────────────────────"
echo ""

# System Info
echo "📊 System:"
echo "   Platform: $(uname -s)"
echo "   Node: $(node -v 2>/dev/null || echo 'N/A')"
echo "   NPM: $(npm -v 2>/dev/null || echo 'N/A')"

echo ""
echo "📁 Installation:"
if [ -d "jarvis" ]; then
    echo -e "   ${GREEN}✅ JARVIS Light${NC}"
else
    echo -e "   ${RED}❌ JARVIS Light${NC}"
fi

if [ -d "openclaw" ]; then
    echo -e "   ${GREEN}✅ OpenClaw Full${NC}"
else
    echo -e "   ${RED}❌ OpenClaw Full${NC}"
fi

echo ""
echo "🌐 Services:"
# Check Ollama
if curl -s localhost:11434 > /dev/null 2>&1; then
    echo -e "   ${GREEN}✅ Ollama${NC}"
else
    echo -e "   ${YELLOW}⚠️ Ollama (not running)${NC}"
fi

echo ""
echo "─────────────────────────────────────────────────────────"
echo ""
echo "📝 Commands:"
echo "   ./start-jarvis.sh   - Start JARVIS"
echo "   ./stop-jarvis.sh    - Stop JARVIS"
echo "   ./restart-jarvis.sh - Restart JARVIS"
echo ""
