<p align="center">
  <a href="https://9bix.com"><strong>NINEBIX inc.</strong></a><br/>
  <sub>Personal AI Infrastructure</sub>
</p>

<h1 align="center">

```
     ██╗ █████╗ ██████╗ ██╗   ██╗██╗███████╗
     ██║██╔══██╗██╔══██╗██║   ██║██║██╔════╝
     ██║███████║██████╔╝██║   ██║██║███████╗
██   ██║██╔══██║██╔══██╗╚██╗ ██╔╝██║╚════██║
╚█████╔╝██║  ██║██║  ██║ ╚████╔╝ ██║███████║
 ╚════╝ ╚═╝  ╚═╝╚═╝  ╚═╝  ╚═══╝  ╚═╝╚══════╝
         v2.0.0 | 85 Tools | 3-Agent System
```

</h1>

<p align="center">
  <img src="https://img.shields.io/badge/tools-85-brightgreen?style=for-the-badge" alt="Tools"/>
  <img src="https://img.shields.io/badge/node-18%2B-blue?style=for-the-badge" alt="Node"/>
  <img src="https://img.shields.io/badge/ollama-powered-orange?style=for-the-badge" alt="Ollama"/>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/CLI-supported-33ff00?style=flat-square" alt="CLI"/>
  <img src="https://img.shields.io/badge/telegram-supported-26A5E4?style=flat-square&logo=telegram" alt="Telegram"/>
  <img src="https://img.shields.io/badge/discord-supported-5865F2?style=flat-square&logo=discord" alt="Discord"/>
  <img src="https://img.shields.io/badge/slack-supported-4A154B?style=flat-square&logo=slack" alt="Slack"/>
  <img src="https://img.shields.io/badge/vscode-extension-007ACC?style=flat-square&logo=visualstudiocode" alt="VSCode"/>
</p>

---

## Quick Install

```bash
# One-liner
npm install -g mylittle-jarvis && jarvis --setup
```

---

## Why JARVIS?

<table>
<tr>
<td width="50%">

### Local-First, Cloud-Optional

- **로컬 우선** - Ollama로 대부분 처리
- **클라우드 선택** - Claude API 사용 가능
- **오프라인 가능** - Ollama만 쓰면 완전 오프라인
- **완전한 통제권** - 어떤 모델 쓸지 사용자 선택

</td>
<td width="50%">

### Long-term Memory (NMT)

- **영구 기억** - 대화 자동 저장
- **의미 검색** - 키워드가 아닌 의미 기반
- **컨텍스트 학습** - 사용자 선호도 학습
- **자율 학습** - 패턴 인식 및 추론

</td>
</tr>
</table>

---

## Overview

**JARVIS**는 로컬 LLM(Ollama)과 Claude를 결합한 **개인용 AI 어시스턴트**입니다.

```
┌─────────────────────────────────────────────────────────────┐
│                      3-Agent System                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│                    ┌─────────────┐                          │
│                    │ Orchestrator│  qwen3:1.7b              │
│                    │   (Router)  │  패턴 매칭 + 복잡도 분석   │
│                    └──────┬──────┘                          │
│                           │                                  │
│            ┌──────────────┼──────────────┐                  │
│            │              │              │                  │
│            ▼              ▼              ▼                  │
│     ┌──────────┐   ┌──────────┐   ┌──────────┐             │
│     │  Simple  │   │ Assistant│   │  Claude  │             │
│     │   응답   │   │ qwen3:8b │   │  Sonnet  │             │
│     └──────────┘   └──────────┘   └──────────┘             │
│                           │                                  │
│                           ▼                                  │
│            ┌─────────────────────────────┐                  │
│            │        85 Tools             │                  │
│            │  File | Git | Bash | Browser│                  │
│            │  Media | Search | NMT | ... │                  │
│            └─────────────────────────────┘                  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**모델 자유 선택** - 각 에이전트 모델 변경 가능:

```json
// ~/.jarvis/jarvis.json
{
  "models": {
    "orchestrator": "llama3:8b",    // 어떤 Ollama 모델이든
    "assistant": "qwen3:14b"        // 원하는 모델로 변경
  }
}
```

---

## Features

<table>
<tr>
<td width="50%">

### 85 Tools

| Category | Count |
|----------|-------|
| File | 8 |
| Code (Bash/Python/Node) | 3 |
| Git | 8 |
| Browser (Playwright) | 10 |
| Media (Image/PDF/Audio) | 10 |
| Utility | 14 |
| Search | 5 |
| Context/Memory | 12 |
| NMT (Knowledge Graph) | 15 |

</td>
<td width="50%">

### Multi-Channel

| Channel | Status |
|---------|--------|
| CLI | Active |
| Telegram | Auto-connect |
| Discord | Auto-connect |
| Slack | Auto-connect |
| PWA (Web) | Terminal UI |
| Gateway API | REST + WS |
| VSCode | Extension |

</td>
</tr>
</table>

### Security

- **Command Sanitizer** - Whitelist 기반, 위험 명령어 차단
- **Rate Limiter** - 100 req/min, 슬라이딩 윈도우
- **Bearer Auth** - 토큰 인증, localhost 자동 허용
- **Path Protection** - `.ssh`, `.env`, `.aws` 접근 차단

---

## Quick Start

### Prerequisites

- Node.js 18+
- [Ollama](https://ollama.ai/) installed

### Installation

```bash
# Clone
git clone https://github.com/CopikProjeckId/jarvis-2flow.git
cd jarvis-2flow/jarvis

# Install
npm install

# Setup (interactive wizard)
node cli.js --setup

# Run
node cli.js
```

### Global Install

```bash
npm install -g mylittle-jarvis
jarvis --setup
jarvis
```

---

## Configuration

### Setup Wizard

```bash
node cli.js --setup
```

```
╔═══════════════════════════════════════════════════════════════╗
║                    JARVIS Setup Wizard                         ║
╠═══════════════════════════════════════════════════════════════╣
║                                                                 ║
║  [1] Ollama 설정                                               ║
║      - Host: http://localhost:11434                            ║
║      - Models: qwen3:1.7b, qwen3:8b                           ║
║                                                                 ║
║  [2] Claude API (선택)                                         ║
║      - ANTHROPIC_API_KEY                                       ║
║                                                                 ║
║  [3] Channels (선택)                                           ║
║      - Telegram Bot Token                                       ║
║      - Discord Bot Token                                        ║
║      - Slack App Tokens                                         ║
║                                                                 ║
║  [4] Gateway                                                    ║
║      - Port: 18789                                              ║
║      - Auth Token                                               ║
║                                                                 ║
╚═══════════════════════════════════════════════════════════════╝
```

### Config File

`~/.jarvis/jarvis.json`

```json
{
  "ollama": {
    "host": "http://localhost:11434",
    "timeout": 60000
  },
  "models": {
    "orchestrator": "qwen3:1.7b",
    "assistant": "qwen3:8b"
  },
  "claude": {
    "apiKey": "sk-ant-..."
  },
  "gateway": {
    "port": 18789,
    "auth": {
      "token": "your-secret-token",
      "allowLocal": true
    }
  },
  "channels": {
    "telegram": {
      "enabled": true,
      "token": "BOT_TOKEN",
      "allowedUsers": [123456789]
    },
    "discord": {
      "enabled": true,
      "token": "BOT_TOKEN"
    },
    "slack": {
      "enabled": false
    }
  }
}
```

---

## CLI Demo

```
╔═══════════════════════════════════════════════════════════════╗
║     ██╗ █████╗ ██████╗ ██╗   ██╗██╗███████╗                   ║
║     ██║██╔══██╗██╔══██╗██║   ██║██║██╔════╝                   ║
║     ██║███████║██████╔╝██║   ██║██║███████╗                   ║
║██   ██║██╔══██║██╔══██╗╚██╗ ██╔╝██║╚════██║                   ║
║╚█████╔╝██║  ██║██║  ██║ ╚████╔╝ ██║███████║                   ║
║ ╚════╝ ╚═╝  ╚═╝╚═╝  ╚═╝  ╚═══╝  ╚═╝╚══════╝                   ║
║  v2.0.0 | 85 Tools | Ollama: qwen3:1.7b, qwen3:8b             ║
╚═══════════════════════════════════════════════════════════════╝

🤖 JARVIS ready. Type /help for commands.

you> 안녕!
🤖 안녕하세요! 무엇을 도와드릴까요?

you> 서울 날씨 어때?
🔧 [weather] 호출 중...
🤖 서울 현재 18°C, 맑음. 최고 22°C, 최저 12°C.

you> 이 프로젝트 분석해줘
🔧 [search-structure] 호출 중...
🤖 src/ 하위 15개 모듈, 85개 도구, 3-Agent 아키텍처

you> /status
╔════════════════════════════════════════════╗
║  Orchestrator : qwen3:1.7b     ✅ Online  ║
║  Assistant    : qwen3:8b       ✅ Online  ║
║  Tools        : 85             ✅ Loaded  ║
║  Memory       : 142 entries    ✅ Active  ║
╚════════════════════════════════════════════╝

you> /memory 지난주 회의
🔍 검색 결과:
   [1] 2024-02-20 - 팀 미팅: API 리팩토링
   [2] 2024-02-21 - 디자인 리뷰: UI 컴포넌트
```

---

## CLI Commands

```
╔════════════════════════════════════════════════════════════╗
║                    JARVIS Commands                          ║
╠════════════════════════════════════════════════════════════╣
║                                                              ║
║  /help, /h        도움말                                     ║
║  /status, /s      시스템 상태                                ║
║  /models          사용 가능한 모델                           ║
║  /channels        연결된 채널 목록                           ║
║  /memory [query]  메모리 검색                                ║
║  /clear, /c       대화 초기화                                ║
║  /config          현재 설정                                  ║
║  /setup           설정 마법사                                ║
║  /exit, /q        종료                                       ║
║                                                              ║
╚════════════════════════════════════════════════════════════╝
```

---

## Gateway API

### REST Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/api/chat` | POST | Chat message |
| `/api/status` | GET | System status |
| `/api/tools` | GET | List all tools |
| `/api/tools/execute` | POST | Execute tool |
| `/api/memory/search` | GET | Search memory |
| `/api/ide/completion` | POST | Code completion |
| `/api/ide/explain` | POST | Explain code |
| `/api/ide/fix` | POST | Fix errors |
| `/api/ide/refactor` | POST | Refactor code |

### Examples

```bash
# Chat
curl -X POST http://localhost:18789/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "안녕하세요"}'

# Execute tool
curl -X POST http://localhost:18789/api/tools/execute \
  -H "Content-Type: application/json" \
  -d '{"tool": "git-status", "params": {"path": "."}}'

# Code completion
curl -X POST http://localhost:18789/api/ide/completion \
  -H "Content-Type: application/json" \
  -d '{"prefix": "function hello", "context": "// JS file"}'
```

### WebSocket

```javascript
const ws = new WebSocket('ws://localhost:18789');

ws.onopen = () => {
  // Auth (optional for localhost)
  ws.send(JSON.stringify({
    type: 'auth',
    data: { token: 'your-token' }
  }));

  // Chat
  ws.send(JSON.stringify({
    type: 'chat',
    data: { message: '안녕하세요!' }
  }));
};

ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);
  console.log(msg.response);
};
```

---

## PWA Interface

Terminal-style design system with neon green accent.

| Page | URL | Description |
|------|-----|-------------|
| Chat | `/chat.html` | AI chat interface |
| Terminal | `/terminal.html` | Command-line style |
| Dashboard | `/dashboard.html` | System monitoring |

```
┌─────────────────────────────────────────┐
│  [>] TERMINAL              [■] ONLINE  │
├─────────────────────────────────────────┤
│  /status  /models  /memory  /clear     │
├─────────────────────────────────────────┤
│                                         │
│  $ git status                          │
│  > On branch main                      │
│  > nothing to commit                   │
│                                         │
│  $ 오늘 날씨 어때?                     │
│  > 서울 현재 기온 15°C, 맑음           │
│                                         │
├─────────────────────────────────────────┤
│  jarvis@term:~$ _                      │
└─────────────────────────────────────────┘
```

---

## VSCode Extension

### Installation

```bash
cd vscode-jarvis
npm install
npm run compile
npm run package
# Install .vsix in VSCode
```

### Commands

| Command | Keybinding | Description |
|---------|------------|-------------|
| JARVIS: Open Chat | `Ctrl+Shift+J` | Open chat |
| JARVIS: Explain | `Ctrl+Shift+E` | Explain code |
| JARVIS: Fix | `Ctrl+Shift+F` | Fix errors |
| JARVIS: Refactor | Context menu | Refactor |

### Features

- AI Code Completion
- Hover Information
- Code Actions (Quick Fix)
- Sidebar Chat Panel
- Status Bar Indicator

---

## Project Structure

```
jarvis/
├── cli.js                    # CLI entry point + channel auto-connect
├── package.json
│
├── src/
│   ├── core/
│   │   ├── jarvis-3agent.js  # 3-Agent system
│   │   ├── tool/
│   │   │   ├── tool-executor.js
│   │   │   └── tools/
│   │   │       ├── index.js      # Tool registry (85 tools)
│   │   │       ├── file.js       # 8 tools
│   │   │       ├── bash.js       # 3 tools
│   │   │       ├── git.js        # 8 tools
│   │   │       ├── browser.js    # 10 tools
│   │   │       ├── media.js      # 10 tools
│   │   │       ├── utility.js    # 14 tools
│   │   │       ├── search.js     # 5 tools
│   │   │       ├── context.js    # 12 tools
│   │   │       └── nmt.js        # 15 tools (Knowledge Graph)
│   │   └── security/
│   │       ├── command-sanitizer.js
│   │       ├── rate-limiter.js
│   │       └── simple-auth.js
│   │
│   ├── gateway/              # REST + WebSocket API
│   │   ├── gateway.js
│   │   └── ide-routes.js     # VSCode endpoints
│   │
│   ├── telegram/             # Telegram bot (polling)
│   ├── discord/              # Discord bot (discord.js)
│   └── slack/                # Slack bot (Bolt)
│
├── pwa/                      # Terminal-style Web UI
│   ├── chat.html
│   ├── terminal.html
│   ├── dashboard.html
│   └── terminal-base.css     # Design system
│
├── vscode-jarvis/            # VSCode Extension
│   ├── src/
│   │   ├── extension.ts
│   │   ├── jarvisClient.ts
│   │   └── providers/
│   └── package.json
│
├── docs/
│   ├── api/gateway.md
│   └── tools/index.md
│
└── docker/
    └── Dockerfile
```

---

## Privacy & Long-term Memory

### Hybrid Architecture

```
┌────────────────────────────────────────────────────────────┐
│                    Local-First Design                       │
├────────────────────────────────────────────────────────────┤
│                                                              │
│  [You] ───▶ [JARVIS] ───┬───▶ [Ollama] (Local, Free)       │
│                 │       └───▶ [Claude] (Cloud, Optional)   │
│                 ▼                                            │
│         [Local NMT Memory]                                   │
│                                                              │
│  ✓ 메모리/설정 항상 로컬 저장                               │
│  ✓ Ollama만 쓰면 100% 오프라인                              │
│  ✓ Claude 쓰면 해당 요청만 클라우드 전송                    │
│                                                              │
└────────────────────────────────────────────────────────────┘
```

### NMT Long-term Memory

| Tool | Description |
|------|-------------|
| `nmt-ingest` | 정보 저장 |
| `nmt-search` | 의미 기반 검색 |
| `nmt-learn` | 패턴 학습 |
| `nmt-infer` | 관계 추론 |
| `nmt-auto-learn` | 자율 학습 |
| `nmt-context` | 컨텍스트 관리 |

```bash
# 메모리 검색
/memory 지난주 회의

# 자동 저장
you> "이 프로젝트는 React와 TypeScript 사용"
🤖 (메모리에 자동 저장)

# 나중에 회상
you> "기술 스택이 뭐였지?"
🤖 React와 TypeScript입니다. (메모리에서 검색)
```

---

## Docker

```bash
# Build
docker build -t mylittle-jarvis -f docker/Dockerfile .

# Run
docker run -d \
  --name jarvis \
  -p 18789:18789 \
  -v ~/.jarvis:/home/node/.jarvis \
  -e ANTHROPIC_API_KEY=sk-ant-... \
  mylittle-jarvis
```

---

## Troubleshooting

<details>
<summary>Ollama 연결 실패</summary>

```bash
# Ollama 상태 확인
curl http://localhost:11434/api/tags

# Ollama 시작
ollama serve

# 모델 설치
ollama pull qwen3:1.7b
ollama pull qwen3:8b
```

</details>

<details>
<summary>채널 연결 안됨</summary>

```bash
# 설정 확인
cat ~/.jarvis/jarvis.json | jq '.channels'

# 토큰 재설정
node cli.js --setup
```

</details>

<details>
<summary>VSCode Extension 빌드 오류</summary>

```bash
cd vscode-jarvis
rm -rf node_modules out
npm install
npm run compile
```

</details>

---

## Key Features

| Feature | Description |
|---------|-------------|
| **85 Tools** | 파일, Git, Bash, 브라우저, 미디어, 검색, 메모리 |
| **Local LLM** | Ollama 기반, 모델 자유 선택 |
| **Cloud LLM** | Claude API 선택적 사용 |
| **Multi-Model** | 에이전트별 모델 설정 가능 |
| **Privacy** | Local-first, 메모리/설정 로컬 저장 |
| **Long-term Memory** | NMT (Neuron Merkle Tree) |
| **Multi-Channel** | CLI, Telegram, Discord, Slack, PWA |
| **Offline** | Ollama만 사용시 완전 오프라인 |

---

## License

See [LICENSE](LICENSE) file.

Commercial licensing: sobdi90@9bix.com

---

<p align="center">
  <strong>NINEBIX inc.</strong><br/>
  <sub>Built with Ollama + Claude</sub>
</p>
