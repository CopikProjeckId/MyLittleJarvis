---
description: Frequently asked questions
---

# FAQ

## General

### What devices are supported?
Any system running Node.js 22+: macOS, Linux, Windows (WSL).

### Do I need an internet connection?
For initial setup: Yes. For local models: No. For cloud AI: Yes.

### How much does it cost?
Free for local models. Cloud AI (Claude/GPT): ~$0.01-0.05 per request.

### Is my data private?
Yes! With local models, data never leaves your machine.

## Installation

### How do I install without Telegram?
Use the CLI: `npm install -g my-little-jarvis-cli`

### Can I use it on Windows?
Yes, via WSL2. Native Windows support coming soon.

### What if npm install fails?
Check Node.js version: `node --version` (needs 22+)

## Usage

### How do I switch AI models?
In chat: `/model model-name` or `/model local`

### Can I use it for coding?
Yes! JARVIS includes Claude Code integration for development.

### How do I clear history?
`jarvis memory --clear` or `/reset` in chat.

## Troubleshooting

See [Troubleshooting Guide](./troubleshooting.md) for detailed solutions.
