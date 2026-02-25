---
description: Complete CLI command reference
---

# CLI Guide

Complete reference for the `jarvis` CLI commands.

## Commands

### `jarvis` (default)
Start interactive chat session.

```bash
jarvis
```

### `jarvis --setup`
Run first-time configuration wizard.

```bash
jarvis --setup
```

### `jarvis config`
View and edit configuration.

```bash
jarvis config          # View config
jarvis config --set KEY=VALUE  # Update setting
```

### `jarvis status`
Check system health.

```bash
jarvis status
```

Shows:
- Ollama connection status
- API availability
- Model loading status

### `jarvis models`
List available AI models.

```bash
jarvis models
```

### `jarvis memory`
View conversation history.

```bash
jarvis memory          # View history
jarvis memory --clear  # Clear history
```

## Interactive Chat Commands

When in chat mode:

| Command | Description |
|---------|-------------|
| `/help` | Show available commands |
| `/reset` | Clear conversation |
| `/persona [name]` | Switch persona |
| `/model [name]` | Switch model |
| `/exit` | Quit chat |
