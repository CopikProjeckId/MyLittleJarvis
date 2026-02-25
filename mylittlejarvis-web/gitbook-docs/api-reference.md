---
description: API documentation for developers
---

# API Reference

## Configuration API

### GET /api/config
Retrieve current configuration.

```bash
curl http://localhost:3000/api/config
```

### POST /api/config
Update configuration.

```bash
curl -X POST http://localhost:3000/api/config \
  -H "Content-Type: application/json" \
  -d '{"key": "value"}'
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `ANTHROPIC_API_KEY` | Claude API key | - |
| `TELEGRAM_BOT_TOKEN` | Telegram token | - |
| `OLLAMA_BASE_URL` | Ollama endpoint | http://localhost:11434 |
| `MEMORY_RETENTION_DAYS` | History retention | 7 |
| `DEFAULT_PERSONA` | Default AI persona | default |

## File Structure

```
~/.jarvis/
├── config.json          # User configuration
├── personas/            # Custom personas
│   ├── default.yaml
│   └── custom.yaml
├── memory/              # Conversation history
│   └── sessions/
└── logs/                # Application logs
    └── jarvis.log
```

## Programmatic Usage

```javascript
import { JARVIS } from 'my-little-jarvis-cli';

const jarvis = new JARVIS({
  persona: 'code-wizard',
  model: 'local'
});

const response = await jarvis.chat('Hello!');
```
