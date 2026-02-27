# JARVIS Architecture (OpenClaw-Level)

## Overview

JARVIS 2.0은 OpenClaw(Claude Code)의 내부 아키텍처를 분석하여 90%+ 기능 동등성을 달성한 AI 코딩 어시스턴트입니다.

```
┌─────────────────────────────────────────────────────────────────┐
│                         JARVIS 2.0                               │
├─────────────────────────────────────────────────────────────────┤
│  VSCode Extension          CLI            Gateway (REST/WS)     │
├─────────────────────────────────────────────────────────────────┤
│                      Tool Manager                                │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐            │
│  │  File   │  │  Bash   │  │   Git   │  │ Search  │  + 40 more │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘            │
├─────────────────────────────────────────────────────────────────┤
│  ACP Session Manager    │  Security Audit  │  Auth Profiles    │
├─────────────────────────────────────────────────────────────────┤
│  Config System  │  Routing  │  Infrastructure (abort, backoff)  │
└─────────────────────────────────────────────────────────────────┘
```

## Module Structure

```
jarvis/src/
├── index.js                 # Unified entry point
│
├── infra/                   # Core infrastructure
│   ├── abort-signal.js      # Linked abort controllers
│   ├── backoff.js           # Exponential backoff with jitter
│   ├── errors.js            # Error hierarchy
│   ├── dedupe.js            # Request deduplication
│   ├── path-guards.js       # Path boundary checking
│   ├── home-dir.js          # JARVIS home directory
│   ├── env.js               # Environment variable helpers
│   ├── boundary-path.js     # Path resolution within boundaries
│   ├── exec-approvals.js    # Command approval system
│   ├── exec-command-resolution.js
│   └── index.js
│
├── routing/                 # Session & agent routing
│   ├── session-key.js       # Session key parsing/building
│   ├── session-key-utils.js # Utility functions
│   ├── account-id.js        # Account ID management
│   └── index.js
│
├── config/                  # Configuration system
│   ├── paths.js             # Config file paths
│   ├── io.js                # Config read/write
│   ├── defaults.js          # Default configuration
│   └── index.js
│
├── security/                # Security layer
│   ├── scan-paths.js        # Path containment, symlink detection
│   ├── secret-equal.js      # Timing-safe comparison
│   ├── dangerous-tools.js   # Tool risk classification
│   ├── audit.js             # Security auditor
│   └── index.js
│
├── agents/                  # Agent system
│   ├── bash-process-registry.js  # Background process tracking
│   ├── bash-tools-shared.js      # Shared utilities
│   ├── bash-executor.js          # Command execution
│   ├── agent-scope.js            # Agent configuration
│   ├── subagent-spawn.js         # Child agent spawning
│   ├── auth-profiles/            # Credential management
│   │   ├── types.js
│   │   ├── store.js
│   │   ├── usage.js
│   │   └── index.js
│   └── index.js
│
├── acp/                     # Agent Control Protocol
│   ├── types.js             # Type definitions
│   ├── errors.js            # ACP error handling
│   ├── runtime-cache.js     # LRU cache with TTL
│   ├── session-actor-queue.js    # Operation serialization
│   ├── manager.js           # AcpSessionManager (700+ lines)
│   └── index.js
│
├── tools/                   # Enhanced tool system
│   ├── context.js           # Execution context, abort handling
│   ├── permissions.js       # Tool permission checking
│   ├── executor.js          # Metrics, streaming, retry
│   ├── manager.js           # Unified tool manager
│   └── index.js
│
├── gateway/                 # REST API + WebSocket
│   ├── gateway.js           # Main gateway (650+ lines)
│   ├── ide-routes.js        # IDE-specific endpoints
│   └── index.js
│
└── vscode-jarvis/           # VSCode Extension
    ├── package.json
    ├── tsconfig.json
    └── src/
        ├── extension.ts     # Entry point
        ├── jarvisClient.ts  # Gateway client
        └── providers/
            ├── completionProvider.ts  # Inline completion
            ├── codeActionProvider.ts  # Quick fixes
            ├── hoverProvider.ts       # Hover documentation
            └── index.ts
```

## Key Components

### 1. Infrastructure (`/infra`)

**Abort Signal Management**
```javascript
import { createLinkedAbortController, withAbortTimeout } from './infra';

const linked = createLinkedAbortController(parentSignal);
const result = await withAbortTimeout(asyncFn, 30000, linked.controller.signal);
```

**Exponential Backoff**
```javascript
import { withExponentialBackoff } from './infra';

const result = await withExponentialBackoff(
  () => fetchData(),
  { maxAttempts: 3, baseDelayMs: 1000, maxDelayMs: 10000 }
);
```

### 2. ACP Session Manager (`/acp`)

```javascript
import { getAcpSessionManager } from './acp';

const manager = getAcpSessionManager();

// Initialize session
const { handle, meta } = await manager.initializeSession({
  cfg: {},
  sessionKey: 'user-123',
  agent: 'default',
  mode: 'conversation'
});

// Run turn with abort support
const result = await manager.runTurn({
  cfg: {},
  sessionKey: 'user-123',
  text: 'Hello',
  mode: 'user',
  signal: abortController.signal,
  onEvent: (event) => console.log(event)
});

// Close session
await manager.closeSession({ cfg: {}, sessionKey: 'user-123', reason: 'done' });
```

### 3. Tool Manager (`/tools`)

```javascript
import { getToolManager } from './tools';

const manager = getToolManager();

// Execute tool
const result = await manager.execute('file-read', { path: './test.js' });

// Approve bash command pattern
manager.approveCommand('npm test', 'Run project tests');

// Get metrics
console.log(manager.getMetrics());
// { total: 150, success: 145, errors: 5, avgDurationMs: 230 }
```

### 4. Security (`/security`)

```javascript
import { SecurityAuditor, isToolDangerous, TOOL_RISK_LEVEL } from './security';

// Check tool risk
const risk = getToolRiskLevel('bash'); // TOOL_RISK_LEVEL.HIGH

// Audit configuration
const auditor = new SecurityAuditor();
const issues = await auditor.auditConfiguration(config);
```

### 5. Gateway IDE Endpoints

```
POST /api/ide/chat/stream     # SSE streaming chat
POST /api/ide/completion      # Code completion
POST /api/ide/explain         # Code explanation
POST /api/ide/fix             # Error fixing
POST /api/ide/refactor        # Code refactoring
POST /api/ide/hover           # Hover documentation
POST /api/ide/comments        # Add comments
POST /api/ide/tests           # Generate tests
POST /api/ide/types           # Type inference
POST /api/ide/review          # Code review
POST /api/ide/symbols         # Symbol search
GET  /api/ide/metrics         # Execution metrics
```

### 6. VSCode Extension

**Features:**
- Inline code completion
- Quick fixes (Code Actions)
- Hover documentation
- Chat panel
- Refactoring commands
- Test generation

**Commands:**
- `Ctrl+Shift+J` - Open Chat
- `Ctrl+Shift+E` - Explain Selection
- `Ctrl+Shift+F` - Fix Errors

## Data Flow

```
User Input
    │
    ▼
┌─────────────────────┐
│  VSCode Extension   │──────▶ Gateway (REST/WS)
│  or CLI             │              │
└─────────────────────┘              ▼
                            ┌─────────────────┐
                            │  Tool Manager   │
                            │  - Permission   │
                            │  - Context      │
                            │  - Execution    │
                            └────────┬────────┘
                                     │
                    ┌────────────────┼────────────────┐
                    ▼                ▼                ▼
              ┌──────────┐    ┌──────────┐    ┌──────────┐
              │  File    │    │  Bash    │    │   Git    │
              │  Tools   │    │  Tools   │    │  Tools   │
              └──────────┘    └──────────┘    └──────────┘
                    │                │                │
                    └────────────────┼────────────────┘
                                     ▼
                            ┌─────────────────┐
                            │  ACP Session    │
                            │  Manager        │
                            └─────────────────┘
                                     │
                                     ▼
                               LLM Backend
```

## Files Created

| Phase | Module | Files |
|-------|--------|-------|
| 0.1 | Core Utilities | 4 |
| 0.2 | Environment | 3 |
| 0.3 | Exec Approvals | 3 |
| 1 | Routing | 4 |
| 2 | Config | 4 |
| 3 | Security | 5 |
| 4.1 | Bash Process | 3 |
| 4.2 | Agent Scope | 2 |
| 4.3 | Auth Profiles | 4 |
| 5 | ACP Enhanced | 6 |
| 6 | Tools Module | 5 |
| 7 | VSCode Extension | 4 |
| 8 | Gateway IDE | 2 |
| 9 | Integration | 2 |
| **Total** | | **51** |

## NMT Integration (Neuron Merkle Tree)

JARVIS는 NMT 지식 그래프 시스템과 완전히 통합됩니다.

### NMT Tools (12개)

| 도구 | 기능 |
|------|------|
| `nmt-search` | HNSW 벡터 시맨틱 검색 |
| `nmt-ingest` | 지식 그래프에 텍스트 저장 |
| `nmt-get` | 뉴런 상세 조회 |
| `nmt-list` | 저장된 뉴런 목록 |
| `nmt-stats` | 시스템 통계 |
| `nmt-verify` | Merkle 증명 검증 |
| `nmt-infer` | 양방향 추론 (forward/backward/causal/bidirectional) |
| `nmt-attractor` | 미래 어트랙터 관리 (목표 지향 추론) |
| `nmt-learn` | 4단계 학습 시스템 |
| `nmt-dimension` | 동적 임베딩 차원 관리 |
| `nmt-orchestrate` | 확률적 모듈 오케스트레이션 |
| `nmt-sync` | 상태 동기화 |
| `nmt-auto-learn` | 자율 재귀학습 |
| `nmt-context` | 컨텍스트 증강 |

### 확률적 존재론 (Probabilistic Ontology)

```
┌─────────────────────────────────────────────────────────┐
│               JARVIS + NMT Integration                   │
├─────────────────────────────────────────────────────────┤
│  User Query                                              │
│      │                                                   │
│      ▼                                                   │
│  ┌─────────────────┐                                    │
│  │ Context         │ ← nmt-search (시맨틱 검색)         │
│  │ Augmentation    │ ← nmt-infer (양방향 추론)          │
│  └────────┬────────┘ ← nmt-attractor (목표 인식)        │
│           │                                              │
│           ▼                                              │
│  ┌─────────────────┐                                    │
│  │ JARVIS 3-Agent  │                                    │
│  │ Processing      │                                    │
│  └────────┬────────┘                                    │
│           │                                              │
│           ▼                                              │
│  ┌─────────────────┐                                    │
│  │ Autonomous      │ ← nmt-auto-learn (상호작용 기록)   │
│  │ Learning        │ ← nmt-learn (패턴 인식)            │
│  └─────────────────┘                                    │
└─────────────────────────────────────────────────────────┘
```

### 자율 재귀학습 (Autonomous Recursive Learning)

```javascript
import { createJarvisWithNmt } from './core/nmt/jarvis-nmt-integration.js';
import { Jarvis3Agent } from './core/jarvis-3agent.js';

// NMT 통합 JARVIS 생성
const jarvis = new Jarvis3Agent({ mode: '3agent' });
const jarvisWithNmt = await createJarvisWithNmt(jarvis, {
  nmtEnabled: true,
  contextAugmentation: true,  // 컨텍스트 증강 활성화
  autoLearn: true,            // 자동 학습 활성화
  verbose: false
});

// 처리 (자동으로 컨텍스트 증강 + 학습 기록)
const response = await jarvisWithNmt.process("파이썬에서 async/await 설명해줘");

// 피드백 제공 (학습 개선)
await jarvisWithNmt.provideFeedback(interactionId, 'positive');

// 학습 사이클 수동 트리거
await jarvisWithNmt.triggerLearning();

// 학습 통계 확인
console.log(jarvisWithNmt.getLearningStats());
```

### 4단계 학습 시스템

1. **Interaction** - 사용자 상호작용 기록
2. **Patterns** - 패턴 인식 및 분석
3. **Outcomes** - 결과 분석 및 성공률 계산
4. **Optimization** - 도구 사용 최적화 제안

## OpenClaw Parity

| Feature | OpenClaw | JARVIS 2.0 |
|---------|----------|------------|
| Tool Count | 50+ | 60+ (NMT 포함) |
| Session Management | ✅ | ✅ |
| Abort/Cancel | ✅ | ✅ |
| Streaming | ✅ | ✅ |
| VSCode Extension | ✅ | ✅ |
| Inline Completion | ✅ | ✅ |
| Code Actions | ✅ | ✅ |
| Permission System | ✅ | ✅ |
| Auth Profiles | ✅ | ✅ |
| Metrics | ✅ | ✅ |
| Config Hot Reload | ✅ | ✅ |
| **Long-term Memory** | ❌ | ✅ (NMT) |
| **Autonomous Learning** | ❌ | ✅ (NMT 4-Stage) |
| **Semantic Search** | ❌ | ✅ (HNSW) |
| **Knowledge Graph** | ❌ | ✅ (NMT) |
| **Verifiable Knowledge** | ❌ | ✅ (Merkle Proofs) |

**Estimated Parity: 90%+ (with unique NMT advantages)**
