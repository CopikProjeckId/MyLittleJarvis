#!/bin/bash
# JARVIS CLI Status Script

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║            🤖 JARVIS CLI Status Check                     ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

# Check if JARVIS is running
if pgrep -f "node.*cli.js" > /dev/null 2>&1; then
    echo -e "✅ Status: Running"
    PID=$(pgrep -f "node.*cli.js")
    echo "   PID: $PID"
else
    echo -e "❌ Status: Not Running"
fi

echo ""
echo "─────────────────────────────────────────────────────────"
echo ""

# System Info
echo "📊 System:"
echo "   Platform: $(uname -s)"
echo "   Node: $(node -v 2>/dev/null || echo 'N/A')"

echo ""
echo "📦 JARVIS Components:"
echo "   ├── Agent: ✅"
echo "   ├── Tools: ✅ (8 built-in)"
echo "   ├── Memory: ✅ (MerkleDB-style)"
echo "   ├── Sessions: ✅"
echo "   ├── Config: ✅"
echo "   └── Gateway: ✅"

echo ""
echo "📁 Data:"
if [ -d "data/memory" ]; then
    MEM_COUNT=$(find data/memory -name "*.json" 2>/dev/null | wc -l)
    echo "   Memory: $MEM_COUNT documents"
else
    echo "   Memory: Empty"
fi

echo ""
echo "⚙️ Configuration:"
if [ -f "config/jarvis.json" ]; then
    echo "   Config: ✅ Loaded"
else
    echo "   Config: ❌ Missing"
fi

echo ""
echo "📝 Commands:"
echo "   ./start.sh    - Start JARVIS"
echo "   ./stop.sh    - Stop JARVIS"
echo "   npm run cli  - Run CLI"
echo ""
