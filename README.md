# 🤖 JARVIS 2-Flow Service

Mobile-optimized AI Assistant with choice between JARVIS (Light) or OpenClaw (Full).

## 📱 Quick Install (Termux)

```bash
# Download installer
curl -O https://raw.githubusercontent.com/your-repo/jarvis-2flow/main/jarvis-mobile-install.sh

# Run
chmod +x jarvis-mobile-install.sh
./jarvis-mobile-install.sh
```

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────┐
│           JARVIS 2-Flow Service                │
├─────────────────────────────────────────────────┤
│                                                 │
│  [1] JARVIS (Light)          [2] OpenClaw     │
│  ─────────────────            ──────────────   │
│  • 3-Agent System            • Full Features   │
│  • Claude Bridge             • 54+ Skills      │
│  • Voice Input               • 7 Channels      │
│  • PWA Interface             • All Tools       │
│  • ~300MB RAM                • ~500MB+ RAM     │
│                                                 │
└─────────────────────────────────────────────────┘
```

## 🎯 Features

### JARVIS Light
- **3-Agent Routing**: Orchestrator → Assistant → Claude
- **Smart Routing**: Pattern-based + complexity analysis
- **Claude Bridge**: Claude Code CLI integration
- **Voice**: Speech recognition + TTS
- **PWA**: Chat, Terminal, Dashboard interfaces

### OpenClaw Full
- All OpenClaw features
- 54+ skills
- 7 channels (Telegram, Discord, Slack, etc.)
- Full toolset

## 📦 Components

```
jarvis-2flow/
├── jarvis-mobile-install.sh    # Installation script
├── jarvis/                     # JARVIS Light
│   ├── src/
│   │   ├── core/              # 3-Agent system
│   │   └── telegram/          # Bot integration
│   └── pwa/                   # Mobile UI
└── openclaw/                   # OpenClaw Full
```

## 🚀 Usage

```bash
# Start JARVIS
./start-jarvis.sh

# Stop JARVIS  
./stop-jarvis.sh

# Check status
./status-jarvis.sh
```

## 📱 PWA

Access via browser:
- Chat: `/pwa/chat.html`
- Terminal: `/pwa/terminal.html`
- Dashboard: `/pwa/dashboard.html`

Install as app: Add to Home Screen

## 🔧 Configuration

Edit `.env`:
```env
OLLAMA_CLOUD_KEY=your-key
BOT_TOKEN=your-telegram-token
```

## 📄 License

MIT
