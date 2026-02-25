---
description: Solutions to common issues
---

# Troubleshooting

## Installation Issues

### "npm install fails"
```bash
# Check Node.js version
node --version  # Must be 22+

# Update npm
npm install -g npm@latest
```

### "Command not found"
```bash
# Add to PATH
export PATH="$PATH:$(npm bin -g)"

# Or reinstall
npm install -g my-little-jarvis-cli
```

## Connection Issues

### "Ollama connection failed"
```bash
# Check Ollama running
curl http://localhost:11434/api/tags

# Restart Ollama
ollama serve
```

### "Claude API error"
- Verify API key: `jarvis config`
- Check internet connection
- Verify API key has credits

## Performance Issues

### "Slow responses"
- Use local models: `ollama pull qwen2.5:1.5b`
- Check system resources: `htop`
- Close unused applications

### "Out of memory"
- Use smaller models (1.5B instead of 8B)
- Clear conversation: `/reset`
- Increase swap space

## Getting Help

1. Check [FAQ](./faq.md)
2. GitHub Issues: github.com/mylittlejarvis/jarvis-agent
3. Discord Community: discord.gg/jarvis
