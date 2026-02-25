---
title: Quick Start
description: Get JARVIS 2-Flow running in 10 minutes
icon: ⚡
---

# Quick Start

Get JARVIS 2-Flow running in **10 minutes** with our installer.

## Prerequisites

- Android 10+ device with Termux (F-Droid version)
- 8GB+ RAM and 10GB+ free storage
- Internet connection for initial setup

## One-Click Install

Open Termux and run:

```bash
curl -fsSL https://jarvis.duckdns.org/jarvis-mobile-install.sh -o install.sh
bash install.sh
```

<Callout type="info">
  The installer will automatically:
  - Install Node.js 22 and dependencies
  - Download JARVIS v2.0 with LLM Engine + Memory Engine + Tool Executor
  - Set up Telegram Bot
  - Create startup scripts

  This may take 10-15 minutes depending on your connection speed.
</Callout>

## Installation Options

When running the installer, you'll see:

```
[1] 🥗 JARVIS (Light)
    - Fast & Lightweight
    - Custom optimized features
    - Neural Memory Engine
    - ~300MB memory usage

[2] 🔥 OpenClaw (Full)
    - All OpenClaw features
    - 54+ Skills
    - 7 channels
    - ~500MB+ memory usage
```

## Manual Setup

Prefer to set things up yourself? Follow these steps:

<Steps>
  <Step title="Install Dependencies">
    Update Termux and install required packages:

    ```bash
    pkg update && pkg upgrade -y
    pkg install -y nodejs git curl python
    ```
  </Step>

  <Step title="Clone Repository">
    ```bash
    git clone https://github.com/jarvis-2flow/jarvis-2flow.git ~/jarvis-2flow
    cd ~/jarvis-2flow/jarvis
    npm install
    ```
  </Step>

  <Step title="Configure Environment">
    Copy and edit the example configuration:

    ```bash
    cp .env.example .env
    nano .env
    ```

    Minimum required settings:

    ```bash
    TELEGRAM_BOT_TOKEN=your_bot_token_here
    # Optional: Ollama Cloud for Qwen 3.5
    OLLAMA_CLOUD_KEY=your-ollama-key
    ```
  </Step>

  <Step title="Start JARVIS">
    ```bash
    npm start
    ```

    You should see output like:
    ```
    🤖 JARVIS v2.0 Starting...
    - LLM Engine: ollama
    - Memory Engine: Ready
    - Tools: 5
    ✅ JARVIS ready!
    ```
  </Step>
</Steps>

## Test Your Setup

Open Telegram and send your bot a message:

<Tabs>
  <Tab label="Simple Test">
    Send: **"Hello!"**

    Expected: A greeting response from JARVIS.
  </Tab>
  <Tab label="Memory Test">
    Send: **"Remember that my favorite color is blue"**

    Expected: Confirmation message.
  </Tab>
  <Tab label="Recall Test">
    Send: **"What's my favorite color?"**

    Expected: "Your favorite color is blue" (from Neural Memory)
  </Tab>
</Tabs>

<Callout type="tip">
  Run JARVIS in the background with `npm start &` or use `tmux` to keep it running after closing Termux.
</Callout>

## Troubleshooting

**Bot not responding?**
- Check your `TELEGRAM_BOT_TOKEN` is correct
- Make sure the server is running: `npm start`

**Memory issues?**
- Use lighter models: Configure in .env
- Reduce memory limit: `MEMORY_MAX_DOCS=500`

**Gateway not working?**
- Check port 18789 is not blocked
- Default password: Check your .env file
