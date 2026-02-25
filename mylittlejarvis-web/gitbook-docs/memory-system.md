---
description: How JARVIS remembers conversations
---

# Memory System

JARVIS maintains context across conversations for better assistance.

## How Memory Works

### Short-term Memory
- Active conversation context
- Last 20 messages
- Current session only

### Long-term Memory
- Persistent storage
- Cross-session history
- 7-day retention by default

## Managing Memory

### View History
```bash
jarvis memory
```

### Clear History
```bash
jarvis memory --clear
```

### Configure Retention

Edit `.env`:
```
MEMORY_RETENTION_DAYS=7
```

## Privacy

- Memory stored locally
- No cloud synchronization (unless configured)
- Encrypt at rest option available
