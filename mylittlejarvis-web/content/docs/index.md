---
title: JARVIS 2-Flow Documentation
description: OpenClaw-level AI assistant for mobile and desktop. Built with LLM Engine, Neural Memory, and Tool Executor.
icon: 📚
---

# Welcome to JARVIS 2-Flow

**OpenClaw-level AI assistant** with LLM Engine, Neural Memory, and Tool Executor. Runs on Termux (mobile) or as PWA (desktop). 70% OpenClaw parity achieved.

<Callout type="info">
  New here? Start with the [Quick Start guide](/docs/getting-started/quickstart) to get up and running in 10 minutes.
</Callout>

## What is JARVIS 2-Flow?

JARVIS 2-Flow is a **dual-deployment AI system** that combines desktop power with mobile accessibility:

- **JARVIS (Light)** — Custom optimized for mobile/termux with Neural Memory + Tool Executor
- **OpenClaw** — Full OpenClaw features when desktop power is available

## Choose Your Path

<Cards>
  <Card
    icon="🚀"
    title="Quick Start"
    description="Get up and running in 10 minutes with the mobile installer."
    href="/docs/getting-started/quickstart"
  />
  <Card
    icon="📱"
    title="Installation"
    description="Mobile (Termux) or Desktop (PWA) installation options."
    href="/docs/getting-started/installation"
  />
  <Card
    icon="⚡"
    title="Core Systems"
    description="LLM Engine, Memory Engine, and Tool Executor documentation."
    href="/docs/reference/api"
  />
  <Card
    icon="💡"
    title="Examples"
    description="Real-world use cases and workflows."
    href="/docs/examples"
  />
</Cards>

## Key Features

- **🧠 Neural Memory Engine** — Vector store + Hybrid search with automatic chunking
- **⚡ LLM Task Engine** — Multi-provider (Ollama, OpenAI, Claude) with retry/fallback chain
- **🔧 Tool Executor** — Schema validation, timeout, exponential backoff retry
- **📱 Mobile-First** — Runs on Galaxy Note 20 Ultra via Termux
- **🌐 PWA Support** — Access via browser on any device
- **🔌 Multi-Channel** — Telegram, Discord, Slack, CLI support

## System Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| Android | 10 (API 29) | 13+ (API 33) |
| RAM | 8GB | 12GB+ |
| Storage | 10GB | 20GB |
| Desktop | Any modern browser | Chrome/Edge |

<Callout type="tip">
  Already have Termux installed? Download `jarvis-mobile-install.sh` and run `bash jarvis-mobile-install.sh`.
</Callout>
