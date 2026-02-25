#!/bin/bash
# JARVIS CLI Stop Script

echo "🛑 Stopping JARVIS..."

# Kill JARVIS processes
pkill -f "node.*cli.js" && echo "✅ JARVIS stopped" || echo "⚠️ JARVIS was not running"

exit 0
