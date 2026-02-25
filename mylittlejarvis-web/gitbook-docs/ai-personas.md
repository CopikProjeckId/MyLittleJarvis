---
description: Understanding and customizing AI personalities
---

# AI Personas

Personas allow you to customize JARVIS's behavior for different tasks.

## What are Personas?

Personas are pre-configured AI personalities with specific:
- Tone and speaking style
- Knowledge focus
- Response patterns
- System instructions

## Built-in Personas

| Persona | Best For |
|---------|----------|
| **Default** | General assistance |
| **Code Wizard** | Programming help |
| **Tutor** | Educational explanations |
| **Creative** | Writing and ideation |

## Switching Personas

In chat mode:
```
> /persona Code Wizard
```

Or via CLI:
```bash
jarvis config --set persona=code-wizard
```

## Creating Custom Personas

Edit `~/.jarvis/personas/custom.yaml`:

```yaml
name: My Assistant
description: Specialized for my workflow
system_prompt: |
  You are a helpful assistant specialized in...
  Always respond with examples.
```

## Use Cases

- **Development**: Use Code Wizard for debugging
- **Learning**: Use Tutor for complex topics
- **Writing**: Use Creative for content generation
