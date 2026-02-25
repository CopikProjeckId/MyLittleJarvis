---
description: Using Claude AI for advanced coding assistance
---

# Claude Bridge

Integrate Claude AI for advanced coding and reasoning tasks.

## What is Claude Bridge?

Claude Bridge connects JARVIS to Anthropic's Claude API, providing:
- Advanced code generation
- Complex reasoning
- Long-context understanding
- Claude Code integration

## Setup

1. Get API key from [Anthropic Console](https://console.anthropic.com)
2. Configure JARVIS:

```bash
jarvis config --set ANTHROPIC_API_KEY=sk-ant-...
```

## Using Claude

### Default Mode
Claude is automatically used for complex tasks when configured.

### Explicit Routing
Prefix your message:
```
> @claude Optimize this function...
```

## Cost

- Claude 3.5 Sonnet: ~$3/million tokens
- Typical request: $0.01-0.05
- Set budget alerts in Anthropic console

## When to Use Claude

- Complex refactoring
- Architecture decisions
- Debugging tricky issues
- Learning new concepts
