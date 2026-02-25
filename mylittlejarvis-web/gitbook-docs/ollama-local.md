---
description: Run AI models locally for privacy
---

# Ollama Local

Run AI models entirely on your machine for complete privacy.

## What is Ollama?

Ollama lets you run large language models locally:
- ✅ No internet required
- ✅ No data leaves your machine
- ✅ No API costs
- ✅ Complete privacy

## Installation

### macOS
```bash
brew install ollama
```

### Linux
```bash
curl -fsSL https://ollama.com/install.sh | sh
```

## Recommended Models

| Model | Size | Use Case |
|-------|------|----------|
| qwen2.5:1.5b | 1.3GB | Quick responses |
| phi3:mini | 2.8GB | Balanced |
| llama3.1:8b | 8GB | Advanced tasks |

## Configure JARVIS

```bash
jarvis config --set OLLAMA_BASE_URL=http://localhost:11434
```

## Download Models

```bash
ollama pull qwen2.5:1.5b
ollama pull phi3:mini
```

## Privacy Benefits

- All processing local
- No data transmission
- Works offline
- HIPAA/GDPR compliant
