#!/usr/bin/env node

// JARVIS Service - Headless background service (gateway + channels + agent)
// This runs as a daemon process. CLI connects to it as a client.

import { Jarvis3Agent } from './src/core/jarvis-3agent.js';
import { Gateway } from './src/gateway/gateway.js';
import { ConfigLoader } from './src/core/config/config-loader.js';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { initI18n } from './src/i18n/index.js';

class JarvisService {
  constructor() {
    this.agent = null;
    this.gateway = null;
    this.config = null;
    this.configLoader = null;
    this.channels = new Map();
    this.jarvisDir = join(homedir(), '.jarvis');
    this.pidFile = join(this.jarvisDir, 'jarvis.pid');
    this.logFile = join(this.jarvisDir, 'jarvis.log');
  }

  log(msg) {
    const timestamp = new Date().toISOString();
    const line = `[${timestamp}] ${msg}`;
    console.log(line);
  }

  async start() {
    // Ensure .jarvis directory exists
    if (!existsSync(this.jarvisDir)) {
      mkdirSync(this.jarvisDir, { recursive: true });
    }

    // Write PID file
    writeFileSync(this.pidFile, String(process.pid));
    this.log(`JARVIS Service starting (PID: ${process.pid})`);

    // Load config
    const configPath = join(this.jarvisDir, 'jarvis.json');
    if (existsSync(configPath)) {
      try {
        const cfg = JSON.parse(readFileSync(configPath, 'utf-8'));
        if (cfg.language) initI18n(cfg.language);
      } catch {}
    }

    this.configLoader = new ConfigLoader();
    this.config = await this.configLoader.init();

    if (this.config.language) {
      initI18n(this.config.language);
    }

    // Watch config for hot reload
    this.configLoader.startWatching();
    this.configLoader.on('reloaded', ({ newConfig }) => {
      this.log('Config reloaded');
      this.config = newConfig;
    });

    // Initialize 3-Agent system
    const mode = this.config.mode || this.config.models?.mode || 'simple';
    const isSimpleMode = mode === 'simple';
    const ollamaHost = process.env.OLLAMA_HOST || this.config.ollama?.host || 'http://localhost:11434';
    const ollamaApiKey = process.env.OLLAMA_API_KEY || this.config.ollama?.apiKey;
    const orchestratorModel = process.env.JARVIS_ORCHESTRATOR_MODEL || this.config.models?.orchestrator || 'qwen3:1.7b';
    const assistantModel = process.env.JARVIS_ASSISTANT_MODEL || this.config.models?.assistant || 'qwen3:8b';
    const fallbackModel = this.config.models?.fallback?.[0] || assistantModel;

    this.agent = new Jarvis3Agent({
      mode,
      orchestrator: {
        model: orchestratorModel,
        baseUrl: ollamaHost,
        apiKey: ollamaApiKey,
        patternOnly: isSimpleMode
      },
      assistant: {
        model: assistantModel,
        fallbackModel,
        baseUrl: ollamaHost,
        apiKey: ollamaApiKey
      }
    });

    this.log(`Agent initialized (mode: ${mode}, model: ${assistantModel})`);

    // Start Gateway
    if (this.config.gateway?.enabled !== false) {
      try {
        this.gateway = await Gateway.create({
          port: this.config.gateway?.port || 18789,
          host: '127.0.0.1',
          config: this.config
        });
        this.gateway.setJarvis(this.agent);
        await this.gateway.start();
        this.log(`Gateway started on port ${this.config.gateway?.port || 18789}`);
      } catch (error) {
        this.log(`Gateway failed: ${error.message}`);
        // Fallback
        try {
          this.gateway = new Gateway({
            port: this.config.gateway?.port || 18789,
            host: '127.0.0.1',
            config: this.config
          });
          this.gateway.setJarvis(this.agent);
          await this.gateway.start();
          this.log('Gateway started (fallback mode)');
        } catch (e) {
          this.log(`Gateway completely failed: ${e.message}`);
        }
      }
    }

    // Start channels
    await this.startChannels();

    // Health check
    const health = await this.agent.healthCheck();
    this.log(`Health: Ollama=${health.ollama}, Claude=${health.claude}`);
    this.log('JARVIS Service ready');
  }

  async startChannels() {
    const channelConfig = this.config.channels || {};

    const createHandler = (channelName) => async (text) => {
      try {
        const response = await this.agent.process(text);
        if (response.error) return `❌ ${response.error}`;
        return response.response;
      } catch (error) {
        this.log(`[${channelName}] Error: ${error.message}`);
        return `❌ Error: ${error.message}`;
      }
    };

    // Telegram
    if (channelConfig.telegram?.enabled && channelConfig.telegram?.token) {
      try {
        const { TelegramBot } = await import('./src/telegram/bot.js');
        const bot = new TelegramBot({
          token: channelConfig.telegram.token,
          allowedUsers: channelConfig.telegram.allowedUsers || []
        });
        bot.setMessageHandler(createHandler('Telegram'));
        bot.on('clear', () => this.agent.clearContext());
        await bot.start();
        this.channels.set('telegram', bot);
        this.log('Telegram: Connected');
      } catch (error) {
        this.log(`Telegram: Failed (${error.message})`);
      }
    }

    // Discord
    if (channelConfig.discord?.enabled && channelConfig.discord?.token) {
      try {
        const { DiscordChannel } = await import('./src/channels/discord.js');
        const bot = new DiscordChannel({
          token: channelConfig.discord.token,
          prefix: channelConfig.discord.prefix || '/'
        });
        bot.onMessage(createHandler('Discord'));
        await bot.start();
        this.channels.set('discord', bot);
        this.log('Discord: Connected');
      } catch (error) {
        this.log(`Discord: Failed (${error.message})`);
      }
    }

    // Slack
    if (channelConfig.slack?.enabled && channelConfig.slack?.token) {
      try {
        const { SlackChannel } = await import('./src/channels/slack.js');
        const bot = new SlackChannel({
          token: channelConfig.slack.token,
          signingSecret: channelConfig.slack.signingSecret
        });
        bot.onMessage(createHandler('Slack'));
        await bot.start();
        this.channels.set('slack', bot);
        this.log('Slack: Connected');
      } catch (error) {
        this.log(`Slack: Failed (${error.message})`);
      }
    }

    if (this.channels.size > 0) {
      this.log(`Channels active: ${Array.from(this.channels.keys()).join(', ')}`);
    }
  }

  async stop() {
    this.log('JARVIS Service shutting down...');

    for (const [name, channel] of this.channels) {
      try {
        if (channel.stop) await channel.stop();
        this.log(`${name}: stopped`);
      } catch (error) {
        this.log(`${name}: stop failed - ${error.message}`);
      }
    }
    this.channels.clear();

    if (this.gateway) {
      await this.gateway.stop();
    }

    if (this.configLoader) {
      this.configLoader.destroy();
    }

    // Remove PID file
    try {
      const { unlinkSync } = await import('fs');
      if (existsSync(this.pidFile)) unlinkSync(this.pidFile);
    } catch {}

    this.log('JARVIS Service stopped');
  }
}

// Start service
const service = new JarvisService();

// Graceful shutdown
process.on('SIGTERM', async () => {
  await service.stop();
  process.exit(0);
});

process.on('SIGINT', async () => {
  await service.stop();
  process.exit(0);
});

process.on('uncaughtException', (error) => {
  service.log(`Uncaught exception: ${error.message}`);
});

service.start().catch((error) => {
  service.log(`Service start failed: ${error.message}`);
  process.exit(1);
});
