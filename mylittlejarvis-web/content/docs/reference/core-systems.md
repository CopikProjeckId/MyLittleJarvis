---
title: Core Systems
description: LLM Engine, Memory Engine, and Tool Executor documentation
icon: ⚡
---

# Core Systems

JARVIS 2-Flow built with OpenClaw-level architecture.

## LLM Task Engine

Multi-provider LLM abstraction with retry chain and fallback:

```javascript
import { LLMTaskEngine } from './core/llm/llm-engine.js';

const llm = new LLMTaskEngine({
  fallbackChain: ['ollama', 'openai', 'anthropic'],
  maxRetries: 3,
  timeout: 120000
});

// Complete with automatic fallback
const result = await llm.complete(messages);

// Stream responses
for await (const chunk of llm.streamComplete(messages)) {
  process.stdout.write(chunk);
}
```

### Features

- **Multi-Provider**: Ollama Cloud, OpenAI, Anthropic
- **Retry Chain**: Automatic retry on failure
- **Fallback**: Auto-fallback to next provider
- **Streaming**: Real-time token streaming
- **Token Management**: Context truncation

---

## Memory Engine

Neural Memory with vector store and hybrid search:

```javascript
import { MemoryEngine } from './core/memory/memory-engine.js';

const memory = new MemoryEngine({
  storageDir: './data/memory',
  maxDocuments: 1000
});

// Store documents with automatic chunking
const docId = await memory.storeDocument(
  'JARVIS is an AI assistant',
  { source: 'conversation' }
);

// Hybrid search (vector + keyword)
const results = await memory.search('AI assistant', {
  hybrid: true,
  limit: 10
});
```

### Features

- **Vector Store**: Pseudo-embeddings for similarity search
- **Hybrid Search**: Combines vector + keyword matching
- **Auto Chunking**: Sentence-based text splitting
- **Importance Scoring**: Access-based eviction
- **Persistence**: File-based storage

---

## Tool Executor

Schema validation and execution management:

```javascript
import { ToolExecutor } from './core/tool/tool-executor.js';

const tools = new ToolExecutor({
  defaultTimeout: 60000
});

// Register with schema validation
tools.register({
  name: 'weather',
  description: 'Get weather',
  parameters: {
    type: 'object',
    properties: {
      location: { type: 'string' }
    },
    required: ['location']
  },
  handler: async (params) => {
    return { temp: 20, condition: 'Sunny' };
  }
});

// Execute with validation + retry
const result = await tools.execute('weather', { location: 'Seoul' });
```

### Features

- **Schema Validation**: Parameter type checking
- **Timeout Handling**: Configurable timeouts
- **Retry Logic**: Exponential backoff
- **Error Handling**: Graceful error recovery
- **History**: Execution tracking

---

## Gateway

REST API + WebSocket server:

```javascript
import { Gateway } from './src/gateway/gateway.js';

const gateway = new Gateway({
  port: 18789,
  password: 'secure-password'
});

// Start server
await gateway.start();

// REST endpoints:
// GET  /health          - Health check
// GET  /api/status      - System status
// POST /api/chat        - Chat endpoint
// GET  /api/memory/search - Memory search
// POST /api/tools/execute - Tool execution

// WebSocket: ws://localhost:18789
```
