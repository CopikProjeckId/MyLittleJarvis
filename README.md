# JARVIS

```
     ██╗ █████╗ ██████╗ ██╗   ██╗██╗███████╗
     ██║██╔══██╗██╔══██╗██║   ██║██║██╔════╝
     ██║███████║██████╔╝██║   ██║██║███████╗
██   ██║██╔══██║██╔══██╗╚██╗ ██╔╝██║╚════██║
╚█████╔╝██║  ██║██║  ██║ ╚████╔╝ ██║███████║
 ╚════╝ ╚═╝  ╚═╝╚═╝  ╚═╝  ╚═══╝  ╚═╝╚══════╝
```

**Personal AI Assistant** — 85개 도구, 3-Agent 시스템, 장기 기억, Local-First

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Ollama](https://img.shields.io/badge/Ollama-Local_LLM-000000?logo=ollama&logoColor=white)](https://ollama.ai/)
[![License](https://img.shields.io/badge/License-Custom-blue)](LICENSE)

---

## Quick Install

```bash
# One-liner install
npm install -g mylittle-jarvis && jarvis --setup
```

또는:

```bash
# Clone & Run
git clone https://github.com/CopikProjeckId/jarvis-2flow.git
cd jarvis-2flow/jarvis && npm install && node cli.js --setup
```

---

## Why JARVIS?

<table>
<tr>
<td width="50%">

### Local-First, Cloud-Optional

- **로컬 우선** - Ollama로 대부분 처리 (오프라인 가능)
- **클라우드 선택** - 복잡한 작업은 Claude API 사용 가능
- **완전한 통제권** - 어떤 모델을 쓸지 사용자가 결정
- **프라이버시 선택** - 민감한 작업은 로컬만 사용 가능

```
┌─────────────────────────────────────┐
│         Hybrid Architecture         │
│                                     │
│  [User] ←→ [JARVIS]                │
│              │                      │
│       ┌──────┴──────┐               │
│       ▼             ▼               │
│   [Ollama]      [Claude]           │
│   (Local)       (Cloud)            │
│   - 무료         - 고품질           │
│   - 오프라인     - 복잡한 작업      │
│   - 프라이버시   - 코드 생성        │
│                                     │
└─────────────────────────────────────┘
```

</td>
<td width="50%">

### Long-term Memory (NMT)

- **영구 기억** - 대화 내용 자동 저장 및 검색
- **컨텍스트 학습** - 사용자 선호도 학습
- **지식 그래프** - 관계 기반 정보 연결
- **자율 학습** - 패턴 인식 및 추론

```
┌─────────────────────────────────────┐
│    Neuron Merkle Tree (NMT)         │
├─────────────────────────────────────┤
│                                     │
│  [대화] → [Ingest] → [Learn]       │
│              ↓                      │
│         [Knowledge]                 │
│        /    |    \                  │
│    [Fact] [Pref] [Pattern]         │
│              ↓                      │
│  [Search] → [Recall] → [Response]  │
│                                     │
└─────────────────────────────────────┘
```

**15개 메모리 도구:**
- `nmt-ingest` - 정보 저장
- `nmt-search` - 의미 검색
- `nmt-learn` - 패턴 학습
- `nmt-infer` - 추론
- `nmt-auto-learn` - 자율 학습

</td>
</tr>
</table>

---

## Features

### 3-Agent System

```
┌─────────────────────────────────────────────────────────────┐
│                      3-Agent Routing                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   User: "서울 날씨 어때?"                                    │
│       │                                                      │
│       ▼                                                      │
│   ┌─────────────┐                                           │
│   │ Orchestrator│  "weather 패턴 감지 → tool 호출"          │
│   │  (qwen:1.7b)│                                           │
│   └──────┬──────┘                                           │
│          │                                                   │
│   ┌──────┼──────────────────┐                               │
│   │      │                  │                               │
│   ▼      ▼                  ▼                               │
│ [Tool] [Assistant]      [Claude]                            │
│ 날씨   일반 대화         코딩/분석                          │
│                                                              │
│   Routing Rules:                                             │
│   • 인사/간단 → 즉시 응답                                   │
│   • 도구 필요 → Tool 호출                                   │
│   • 일반 대화 → Assistant (qwen:8b)                         │
│   • 복잡한 작업 → Claude                                    │
└─────────────────────────────────────────────────────────────┘
```

**모델 자유 선택** - 각 에이전트마다 원하는 모델 설정 가능:

| Agent | 기본값 | 변경 가능 |
|-------|--------|----------|
| Orchestrator | qwen3:1.7b | ✅ llama3, mistral, gemma, phi3... |
| Assistant | qwen3:8b | ✅ qwen3:14b, llama3:70b... |
| Claude | claude-sonnet | ✅ claude-opus 또는 비활성화 |

```json
// ~/.jarvis/jarvis.json
{
  "models": {
    "orchestrator": "llama3:8b",    // 라우팅용 모델
    "assistant": "qwen3:14b"        // 대화용 모델
  }
}
```

### 85 Tools

| Category | Count | Description |
|----------|-------|-------------|
| **File** | 8 | read, write, edit, glob, grep, undo, redo, history |
| **Code** | 3 | bash, python, node-exec |
| **Git** | 8 | status, diff, log, commit, branch, stash, add, reset |
| **Browser** | 10 | Playwright 자동화 (navigate, click, screenshot...) |
| **Media** | 10 | 이미지/PDF/오디오 처리 |
| **Utility** | 14 | calc, datetime, json, hash, http... |
| **Search** | 5 | 코드베이스 검색, 정의/참조 찾기 |
| **Context** | 12 | 대화 컨텍스트, 메모리, 태스크 관리 |
| **Memory** | 15 | NMT 장기 기억 시스템 |

### Multi-Channel

| Channel | Description |
|---------|-------------|
| **CLI** | 대화형 터미널 (메인) |
| **Telegram** | 봇 자동 연결 |
| **Discord** | 봇 자동 연결 |
| **Slack** | 봇 자동 연결 |
| **PWA** | Terminal-style 웹 UI |
| **VSCode** | 코드 편집 통합 |

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
║                                                                ║
║  v2.0.0 | 85 Tools | 3-Agent System                           ║
╚═══════════════════════════════════════════════════════════════╝

🤖 JARVIS ready. Type /help for commands.
   Ollama: qwen3:1.7b, qwen3:8b
   Channels: telegram, discord

you> 안녕!

🤖 안녕하세요! 무엇을 도와드릴까요?

you> 서울 날씨 어때?

🔧 [weather] 도구 호출 중...
🤖 서울 현재 기온 18°C, 맑음입니다.
   오늘 최고 22°C, 최저 12°C 예상됩니다.

you> 이 프로젝트의 구조 분석해줘

🔧 [search-structure] 도구 호출 중...
🤖 프로젝트 분석 결과:

   📁 src/
   ├── core/           # 핵심 시스템
   │   ├── jarvis-3agent.js
   │   ├── tool/       # 85개 도구
   │   └── security/   # 보안
   ├── gateway/        # REST + WebSocket
   └── telegram/       # 봇

   총 15개 모듈, 85개 도구, 3-Agent 아키텍처

you> /status

╔════════════════════════════════════════════╗
║  📊 JARVIS Status                          ║
╠════════════════════════════════════════════╣
║  Orchestrator : qwen3:1.7b     ✅ Online  ║
║  Assistant    : qwen3:8b       ✅ Online  ║
║  Claude       : configured     ✅ Ready   ║
║  Tools        : 85             ✅ Loaded  ║
║  Memory       : 142 entries    ✅ Active  ║
║  Gateway      : :18789         ✅ Running ║
╚════════════════════════════════════════════╝

you> /memory 지난주 회의

🔍 메모리 검색: "지난주 회의"

   [1] 2024-02-20 - 팀 미팅: API 리팩토링 논의
   [2] 2024-02-21 - 디자인 리뷰: 새 UI 컴포넌트
   [3] 2024-02-22 - 코드 리뷰: PR #142 승인

you> /help

╔════════════════════════════════════════════════════════════╗
║  📚 JARVIS Commands                                        ║
╠════════════════════════════════════════════════════════════╣
║                                                              ║
║  /help, /h        도움말                                     ║
║  /status, /s      시스템 상태                                ║
║  /models          사용 가능한 모델                           ║
║  /channels        연결된 채널 목록                           ║
║  /memory [query]  장기 기억 검색                             ║
║  /clear, /c       대화 컨텍스트 초기화                       ║
║  /config          현재 설정 보기                             ║
║  /setup           설정 마법사                                ║
║  /exit, /q        종료                                       ║
║                                                              ║
║  일반 메시지      AI와 대화                                  ║
║                                                              ║
╚════════════════════════════════════════════════════════════╝
```

---

## Privacy & Security

### Data Flow

```
┌────────────────────────────────────────────────────────────┐
│                    HYBRID ARCHITECTURE                      │
├────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────┐    ┌──────────┐                               │
│  │   You    │───▶│  JARVIS  │                               │
│  └──────────┘    └────┬─────┘                               │
│                       │                                      │
│            ┌──────────┴──────────┐                          │
│            ▼                     ▼                          │
│     ┌──────────┐          ┌──────────┐                      │
│     │  Ollama  │          │  Claude  │                      │
│     │ (Local)  │          │ (Cloud)  │                      │
│     └──────────┘          └──────────┘                      │
│            │                     │                          │
│            ▼                     ▼                          │
│     ┌──────────┐          ┌──────────┐                      │
│     │ 로컬 저장 │          │ API 전송 │                      │
│     └──────────┘          └──────────┘                      │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │ 항상 로컬에 저장:                                  │    │
│  │ ✓ 메모리 (NMT)                                    │    │
│  │ ✓ 설정 파일                                       │    │
│  │ ✓ 도구 실행 결과                                  │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │ Claude API 사용 시 전송되는 것:                    │    │
│  │ • 해당 요청의 대화 내용                            │    │
│  │ • (Ollama만 사용하면 100% 로컬)                   │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
└────────────────────────────────────────────────────────────┘
```

### Security Features

| Feature | Description |
|---------|-------------|
| **Command Sanitizer** | 위험 명령어 차단 (`rm -rf /`, `sudo`, `git push --force`) |
| **Path Protection** | 민감 경로 접근 차단 (`.ssh`, `.env`, `.aws`, `.gnupg`) |
| **Rate Limiter** | DDoS 방지 (100 req/min) |
| **Bearer Auth** | 토큰 기반 인증 |
| **Localhost Trust** | 로컬 연결은 자동 허용 (설정 가능) |

---

## Long-term Memory (NMT)

### What is NMT?

**Neuron Merkle Tree (NMT)**는 JARVIS의 장기 기억 시스템입니다:

| Feature | Description |
|---------|-------------|
| **영구 저장** | 모든 대화와 작업이 로컬에 영구 저장 |
| **의미 검색** | 키워드가 아닌 의미 기반 검색 |
| **컨텍스트 학습** | 사용자 선호도와 패턴 자동 학습 |
| **지식 그래프** | 정보 간 관계 구축 및 추론 |
| **자율 학습** | 반복 패턴 인식 및 최적화 |

### Memory Commands

```bash
# 메모리 검색
/memory 지난주 회의 내용

# 메모리에 저장
you> "이 프로젝트는 React 18과 TypeScript를 사용해"
🤖 (자동으로 메모리에 저장됨)

# 나중에 자동 회상
you> "이 프로젝트 기술 스택이 뭐였지?"
🤖 이 프로젝트는 React 18과 TypeScript를 사용합니다.
   (메모리에서 검색됨)
```

### Memory Tools (15개)

| Tool | Description |
|------|-------------|
| `nmt-ingest` | 새 정보 저장 |
| `nmt-search` | 의미 기반 검색 |
| `nmt-get` | ID로 조회 |
| `nmt-list` | 목록 조회 |
| `nmt-learn` | 패턴 학습 |
| `nmt-infer` | 관계 추론 |
| `nmt-auto-learn` | 자율 학습 |
| `nmt-context` | 컨텍스트 관리 |
| `nmt-verify` | 무결성 검증 |
| `nmt-stats` | 통계 |
| `nmt-attractor` | 어트랙터 분석 |
| `nmt-dimension` | 차원 분석 |
| `nmt-orchestrate` | 오케스트레이션 |
| `nmt-sync` | 동기화 |
| `nmt-status` | 상태 확인 |

---

## VSCode Extension

### Installation

```bash
cd jarvis/vscode-jarvis
npm install && npm run compile && npm run package
# VSCode에서 .vsix 파일 설치
```

### Features

| Feature | Keybinding | Description |
|---------|------------|-------------|
| Chat | `Ctrl+Shift+J` | AI 채팅 |
| Explain | `Ctrl+Shift+E` | 코드 설명 |
| Fix | `Ctrl+Shift+F` | 에러 수정 |
| Refactor | Context menu | 리팩토링 |
| Completion | Auto | AI 자동완성 |
| Hover | Mouse | 심볼 정보 |

---

## Security: JARVIS Architecture

### Local-First Design

```
┌────────────────────────────────────────────────────────────────┐
│                     JARVIS 보안 아키텍처                        │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────┐       ┌──────────────┐                           │
│  │ Your Code│ ─────▶│ Local Ollama │ (기본 - 로컬 처리)        │
│  └──────────┘       └──────────────┘                           │
│       │                                                         │
│       └──────────▶ [Claude API] (선택 - 복잡한 작업)           │
│                                                                 │
│  ✅ 로컬 LLM으로 오프라인 동작 가능                            │
│  ✅ 클라우드 사용 여부 사용자 선택                             │
│  ✅ 메모리/설정 항상 로컬 저장 (NMT)                           │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

### 보안 기능

| Feature | Description |
|---------|-------------|
| **Command Sanitizer** | `rm -rf /`, `sudo`, `git push --force` 등 위험 명령 차단 |
| **Path Protection** | `.ssh`, `.env`, `.aws`, `.gnupg` 접근 차단 |
| **Rate Limiter** | 100 req/min, DDoS 방지 |
| **Bearer Auth** | 토큰 인증, localhost 자동 허용 |
| **Audit Logging** | 모든 명령 실행 로깅 |

### 오프라인 모드

```bash
# Ollama만 사용하면 완전 오프라인 동작
# Claude API 키 설정하지 않으면 자동으로 로컬만 사용
{
  "claude": {
    "apiKey": null  // 클라우드 비활성화
  }
}
```

---

## Quick Start (Detailed)

### 1. Prerequisites

```bash
# Node.js 18+
node --version  # v18.0.0+

# Ollama
curl -fsSL https://ollama.ai/install.sh | sh
ollama serve  # 백그라운드에서 실행
```

### 2. Install

```bash
# Option A: npm global
npm install -g mylittle-jarvis

# Option B: Clone
git clone https://github.com/CopikProjeckId/jarvis-2flow.git
cd jarvis-2flow/jarvis
npm install
```

### 3. Setup

```bash
jarvis --setup
# 또는
node cli.js --setup
```

설정 마법사가 안내합니다:
- Ollama 연결 확인
- 모델 다운로드 (qwen3:1.7b, qwen3:8b)
- Claude API 설정 (선택)
- 채널 설정 (Telegram/Discord/Slack)
- Gateway 설정

### 4. Run

```bash
jarvis
# 또는
node cli.js
```

### 5. Optional: Channels

```bash
# Telegram 봇 토큰 설정 후 자동 연결
# Discord 봇 토큰 설정 후 자동 연결
# Slack 앱 토큰 설정 후 자동 연결

# 연결된 채널 확인
jarvis> /channels
```

---

## Configuration

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
      "token": "BOT_TOKEN"
    },
    "discord": {
      "enabled": true,
      "token": "BOT_TOKEN"
    }
  },
  "memory": {
    "enabled": true,
    "autoSave": true,
    "maxEntries": 10000
  }
}
```

---

## Architecture

```
jarvis/
├── cli.js                    # CLI + 채널 자동 연결
├── src/
│   ├── core/
│   │   ├── jarvis-3agent.js  # 3-Agent 시스템
│   │   ├── tool/tools/       # 85개 도구
│   │   ├── memory/           # NMT 장기 기억
│   │   └── security/         # 보안
│   ├── gateway/              # REST + WebSocket
│   ├── telegram/             # Telegram 봇
│   ├── discord/              # Discord 봇
│   └── slack/                # Slack 봇
├── pwa/                      # Terminal-style Web UI
├── vscode-jarvis/            # VSCode Extension
└── docs/                     # 문서
```

---

## Contributing

JARVIS는 커뮤니티의 기여로 성장합니다. 모든 형태의 기여를 환영합니다!

### How to Contribute

```bash
# 1. Fork & Clone
git clone https://github.com/YOUR_USERNAME/jarvis-2flow.git
cd jarvis-2flow/jarvis
npm install

# 2. Branch
git checkout -b feature/your-feature

# 3. Develop & Test
node cli.js  # 로컬에서 테스트

# 4. Commit & Push
git add .
git commit -m "feat: add your feature"
git push origin feature/your-feature

# 5. Pull Request
# GitHub에서 PR 생성
```

### Contribution Areas

| 영역 | 설명 | 난이도 |
|------|------|--------|
| **New Tools** | 85개 도구에 새 도구 추가 | ★★☆ |
| **Channel Adapters** | 새 메신저 채널 연동 (Line, KakaoTalk...) | ★★☆ |
| **i18n** | 새 언어 번역 추가 (`src/i18n/locales/`) | ★☆☆ |
| **Bug Fix** | 이슈 수정 | ★☆☆ |
| **Documentation** | 문서 개선 | ★☆☆ |
| **NMT Memory** | 장기 기억 알고리즘 개선 | ★★★ |
| **Security** | 보안 기능 강화 | ★★★ |
| **Model Support** | 새 LLM 백엔드 추가 (vLLM, LM Studio...) | ★★☆ |

### Adding a New Tool

새 도구를 추가하려면 `src/core/tool/tools/`에 함수를 작성하고 `index.js`에 등록하세요:

```javascript
// src/core/tool/tools/your-tool.js
export function createYourTools() {
  return [
    {
      name: 'your-tool-name',
      description: '도구 설명',
      parameters: {
        type: 'object',
        properties: {
          input: { type: 'string', description: '입력값' }
        },
        required: ['input']
      },
      execute: async (params) => {
        // 구현
        return { result: 'done' };
      }
    }
  ];
}
```

### Commit Convention

| Prefix | 용도 |
|--------|------|
| `feat:` | 새 기능 |
| `fix:` | 버그 수정 |
| `docs:` | 문서 |
| `refactor:` | 리팩토링 |
| `test:` | 테스트 |
| `chore:` | 빌드/설정 |

### Guidelines

- PR은 하나의 기능/수정에 집중
- 기존 코드 스타일 유지 (ESM, async/await)
- 민감 정보 포함 금지 (API 키, 토큰 등)
- 한국어/영어 모두 환영

### Issue & Discussion

- **Bug Report**: [Issues](https://github.com/CopikProjeckId/jarvis-2flow/issues)에 버그 리포트
- **Feature Request**: Issue에 `enhancement` 라벨로 요청
- **질문**: Issue에 `question` 라벨로 질문

---

## License

See [LICENSE](LICENSE) file.

---

## Author

**NINEBIX Inc.**
[https://9bix.com](https://9bix.com)

---

<p align="center">
  <strong>Local-First. Cloud-Optional. Your Choice.</strong><br/>
  <sub>Built with Ollama + Claude</sub><br/><br/>
  <a href="https://github.com/CopikProjeckId/jarvis-2flow/issues">Report Bug</a> ·
  <a href="https://github.com/CopikProjeckId/jarvis-2flow/issues">Request Feature</a> ·
  <a href="https://github.com/CopikProjeckId/jarvis-2flow/fork">Fork & Contribute</a>
</p>
