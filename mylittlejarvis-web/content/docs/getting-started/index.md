---
title: Getting Started
description: Everything you need to know to get JARVIS 2-Flow running
icon: 🚀
---

# Getting Started

Welcome! This section will guide you through setting up **JARVIS 2-Flow** on your device.

## Overview

JARVIS 2-Flow uses **OpenClaw-level architecture** with three core systems:

<Steps>
  <Step title="LLM Task Engine">
    Multi-provider support (Ollama, OpenAI, Claude) with retry chain, fallback, streaming, and token management. Uses Ollama Cloud for Qwen 3.5.
  </Step>
  <Step title="Neural Memory Engine">
    Vector store + Hybrid search with automatic chunking, importance scoring, and context-aware retrieval. Stores up to 1000 documents.
  </Step>
  <Step title="Tool Executor">
    Schema validation, timeout handling, exponential backoff retry, and execution history tracking. Supports 20+ tools.
  </Step>
</Steps>

## Prerequisites

Before you begin, make sure you have:

- An **Android 10+** device (Android 13+ recommended)
- At least **8GB RAM** (12GB+ recommended for best performance)
- At least **10GB free storage**
- **Termux** installed from [F-Droid](https://f-droid.org) (NOT the Play Store version)

<Callout type="warning">
  Do not install Termux from the Google Play Store — it is outdated and unsupported. Always use the F-Droid version.
</Callout>

## Deployment Options

JARVIS 2-Flow supports **2-Flow deployment**:

- **JARVIS (Light)** — Custom optimized for mobile/termux (~300MB)
- **OpenClaw (Full)** — Full OpenClaw features when desktop power is available

## Next Steps

<Cards>
  <Card
    icon="⚡"
    title="Quick Start"
    description="Get running in 10 minutes with the one-click installer."
    href="/docs/getting-started/quickstart"
  />
  <Card
    icon="💻"
    title="Manual Installation"
    description="Full control with step-by-step manual setup."
    href="/docs/getting-started/installation"
  />
</Cards>
