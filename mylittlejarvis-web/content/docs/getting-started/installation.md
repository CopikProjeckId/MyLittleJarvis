---
title: Installation
description: Install JARVIS 2-Flow on your device
icon: 📱
---

# Installation

Detailed installation instructions for all supported methods.

<Callout type="info">
  JARVIS 2-Flow works on any Android device running Android 10+ with Termux. For the best experience, use a device with 12GB+ RAM.
</Callout>

## Method 1: One-Click Installer (Recommended)

The fastest way to get started:

```bash
curl -fsSL https://jarvis.duckdns.org/jarvis-mobile-install.sh -o install.sh
bash install.sh
```

The installer handles everything automatically:
- Installing Node.js 22 and dependencies
- Downloading JARVIS v2.0 with LLM Engine + Memory Engine + Tool Executor
- Setting up Telegram bot webhook
- Creating startup scripts (start-jarvis.sh, stop-jarvis.sh)

## Method 2: Manual Installation

<Steps>
  <Step title="Install Termux Packages">
    ```bash
    pkg update && pkg upgrade -y
    pkg install -y nodejs git curl python
    ```
  </Step>

  <Step title="Clone the Repository">
    ```bash
    git clone https://github.com/jarvis-2flow/jarvis-2flow.git ~/jarvis-2flow
    cd ~/jarvis-2flow/jarvis
    ```
  </Step>

  <Step title="Install Node Dependencies">
    ```bash
    npm install
    ```
  </Step>

  <Step title="Configure Environment">
    ```bash
    cp .env.example .env
    ```

    Edit `.env` with your settings:

    ```bash
    # Required
    TELEGRAM_BOT_TOKEN=1234567890:ABCdef...

    # Ollama Cloud (for Qwen 3.5)
    OLLAMA_CLOUD_KEY=your-ollama-key
    OLLAMA_CLOUD_URL=https://cloud.ollama.com

    # Optional: Claude Bridge
    ANTHROPIC_API_KEY=sk-ant-api03-...

    # Memory Settings
    MEMORY_MAX_DOCS=1000
    ```
  </Step>

  <Step title="Run JARVIS">
    ```bash
    npm start
    # or for CLI mode
    npm run cli
    ```
  </Step>
</Steps>

## Method 3: Docker

For advanced users or Linux/server deployments:

```bash
docker run -d \
  --name jarvis \
  --restart unless-stopped \
  -v $(pwd)/.env:/app/.env \
  -v jarvis-models:/root/.ollama \
  mylittlejarvis/jarvis-agent-v2:latest
```

<Callout type="warning">
  Docker is not recommended for Android/Termux. Use the one-click installer or manual method instead.
</Callout>

## Hardware Compatibility

<CodeGroup>
  <Code label="Excellent (12GB+ RAM)">
    ```
    Galaxy Note 20 Ultra (12GB)
    Galaxy S21 Ultra (12/16GB)
    Galaxy S22 Ultra (8/12GB)
    OnePlus 9 Pro (12GB)
    ```
  </Code>
  <Code label="Good (8GB RAM)">
    ```
    Galaxy S20+ (8GB)
    Pixel 6 Pro (12GB)
    Xiaomi Mi 11 (8GB)
    OnePlus 8T (8/12GB)
    ```
  </Code>
  <Code label="Limited (6GB RAM)">
    ```
    Use qwen2.5:1.5b only
    Disable Assistant agent
    Set LRU_TIMEOUT=60000
    ```
  </Code>
</CodeGroup>

## Verified Tested Devices

| Device | RAM | Status | Notes |
|--------|-----|--------|-------|
| Galaxy Note 20 Ultra | 12GB | ✅ Excellent | Reference device |
| Galaxy S21 Ultra | 12/16GB | ✅ Excellent | All features work |
| Galaxy S20 Ultra | 12GB | ✅ Good | Minor slowness |
| Pixel 7 Pro | 12GB | ✅ Good | Works well |
| Galaxy A52s | 6GB | ⚠️ Limited | Orchestrator only |
