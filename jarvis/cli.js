#!/usr/bin/env node

// JARVIS CLI - Interactive Terminal Interface
// OpenClaw-style with interactive setup wizard

import { Jarvis3Agent } from './src/core/jarvis-3agent.js';
import { Gateway } from './src/gateway/gateway.js';
import { ConfigLoader } from './src/core/config/config-loader.js';
import { runSetup } from './src/cli/setup-wizard.js';
import { createInterface } from 'readline';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { initI18n, t, tf } from './src/i18n/index.js';

class JarvisTerminal {
  constructor() {
    this.jarvis = null;
    this.agent = null;
    this.gateway = null;
    this.config = null;
    this.configLoader = null;
    this.isInteractive = true;
    this.channels = new Map(); // Active channel connections
  }

  async start() {
    // Check for command line arguments
    const args = process.argv.slice(2);

    // Pre-load language from config if exists
    const configPath = join(homedir(), '.jarvis', 'jarvis.json');
    if (existsSync(configPath)) {
      try {
        const cfg = JSON.parse(readFileSync(configPath, 'utf-8'));
        if (cfg.language) {
          initI18n(cfg.language);
        }
      } catch {}
    }

    if (args.includes('--setup') || args.includes('setup')) {
      await runSetup(false);
      return;
    }

    if (args.includes('--quick-setup')) {
      await runSetup(true);
      return;
    }

    if (args.includes('--help') || args.includes('-h')) {
      this.printHelp();
      return;
    }

    if (args.includes('--version') || args.includes('-v')) {
      console.log('MyLittle JARVIS v2.0.0');
      return;
    }

    console.clear();
    this.printBanner();

    // Load config from ~/.jarvis/jarvis.json
    this.configLoader = new ConfigLoader();

    // Check if first run (no config file)
    if (!existsSync(configPath)) {
      console.log(t('welcome.firstRun') + '\n');

      const answer = await this.askQuestion(t('welcome.setupPrompt'));
      if (answer.toLowerCase() !== 'n') {
        await runSetup(false);

        // Reload config after setup
        console.log('\n' + t('welcome.setupComplete') + '\n');
      }
    }

    // Load or create config
    this.config = await this.configLoader.init();

    // Initialize i18n with config language
    if (this.config.language) {
      initI18n(this.config.language);
    }

    // Start config file watcher for hot reload
    this.configLoader.startWatching();
    this.configLoader.on('reloaded', ({ newConfig }) => {
      console.log('\n' + t('welcome.configChanged') + '\n');
      this.config = newConfig;
    });

    // Check environment
    console.log(t('environment.checking') + '\n');
    const envCheck = await this.checkEnvironment();

    if (!envCheck.ollama) {
      console.log(t('environment.ollamaNotRunning'));
      console.log(t('environment.ollamaStartHint'));
      console.log(t('environment.ollamaServe') + '\n');
      console.log(t('environment.modelInstallHint') + '\n');

      const answer = await this.askQuestion(t('environment.continueWithoutOllama'));
      if (answer.toLowerCase() !== 'y') {
        console.log('\n' + t('environment.comeBackLater'));
        process.exit(0);
      }
    } else {
      console.log(t('environment.ollamaConnected'));
      if (envCheck.models.length > 0) {
        const modelStr = envCheck.models.slice(0, 3).join(', ') + (envCheck.models.length > 3 ? '...' : '');
        console.log(tf('environment.models', { models: modelStr }));
      }
    }

    // Initialize Agent system
    console.log('\n' + t('init.initializing'));

    // Mode configuration
    const mode = this.config.mode || this.config.models?.mode || 'simple';
    const isSimpleMode = mode === 'simple';

    // Model configuration (env vars override config file)
    const ollamaHost = process.env.OLLAMA_HOST || this.config.ollama?.host || 'http://localhost:11434';
    const ollamaApiKey = process.env.OLLAMA_API_KEY || this.config.ollama?.apiKey;
    const orchestratorModel = process.env.JARVIS_ORCHESTRATOR_MODEL || this.config.models?.orchestrator || 'qwen3:1.7b';
    const assistantModel = process.env.JARVIS_ASSISTANT_MODEL || this.config.models?.assistant || 'qwen3:8b';
    const fallbackModel = this.config.models?.fallback?.[0] || assistantModel;

    // Display mode info
    if (isSimpleMode) {
      console.log(t('init.modeSimple'));
      console.log(tf('init.model', { model: assistantModel }));
    } else {
      console.log(t('init.mode3Agent'));
      console.log(tf('init.orchestrator', { model: orchestratorModel }));
      console.log(tf('init.assistant', { model: assistantModel }));
    }
    console.log(tf('init.ollamaHost', { host: ollamaHost }));
    if (ollamaApiKey) console.log(tf('init.apiKey', { key: ollamaApiKey.slice(-4) }));

    this.agent = new Jarvis3Agent({
      mode: mode,
      orchestrator: {
        model: orchestratorModel,
        baseUrl: ollamaHost,
        apiKey: ollamaApiKey,
        patternOnly: isSimpleMode  // Simple mode: pattern routing only
      },
      assistant: {
        model: assistantModel,
        fallbackModel: fallbackModel,
        baseUrl: ollamaHost,
        apiKey: ollamaApiKey
      }
    });

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

        const port = this.config.gateway?.port || 18789;
        const authStatus = this.gateway.auth.getStatus();
        console.log(tf('init.gatewayOk', { port }));
        console.log(tf('init.pwa', { port }));
        console.log(tf('init.auth', { type: authStatus.tokenConfigured ? 'token' : 'none', local: authStatus.allowLocal }));
      } catch (error) {
        console.log(tf('init.gatewayFailed', { error: error.message }));
        // Create fallback gateway without config loader
        try {
          this.gateway = new Gateway({
            port: this.config.gateway?.port || 18789,
            host: '127.0.0.1',
            config: this.config
          });
          this.gateway.setJarvis(this.agent);
          await this.gateway.start();
        } catch (e) {
          console.log(tf('init.gatewayFullFail', { error: e.message }));
        }
      }
    }

    // Start configured channels (Telegram, Discord, Slack)
    await this.startChannels();

    // Health check
    const health = await this.agent.healthCheck();
    console.log('\n' + t('status.title'));
    console.log(tf('status.ollama', { status: health.ollama === 'available' ? '✅' : '❌' }));
    console.log(tf('status.claude', { status: health.claude === 'configured' ? '✅' : '❌ ' + t('status.optional') }));

    // Show channel status
    if (this.channels.size > 0) {
      console.log(`   Channels: ${Array.from(this.channels.keys()).join(', ')} ✅`);
    }

    console.log('\n' + '─'.repeat(50));
    console.log(t('help.hint'));
    console.log('─'.repeat(50) + '\n');

    // Start interactive loop
    this.runLoop();
  }

  async startChannels() {
    const channelConfig = this.config.channels || {};

    // Create message handler that wraps the agent
    const createHandler = (channelName) => async (text) => {
      try {
        const response = await this.agent.process(text);
        if (response.error) {
          return `❌ ${response.error}`;
        }
        return response.response;
      } catch (error) {
        console.error(`[${channelName}] Error:`, error.message);
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

        // Handle /clear command
        bot.on('clear', () => {
          this.agent.clearContext();
        });

        await bot.start();
        this.channels.set('telegram', bot);
        console.log('   📱 Telegram: Connected');
      } catch (error) {
        console.log(`   📱 Telegram: Failed (${error.message})`);
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
        console.log('   🎮 Discord: Connected');
      } catch (error) {
        console.log(`   🎮 Discord: Failed (${error.message})`);
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
        console.log('   💼 Slack: Connected');
      } catch (error) {
        console.log(`   💼 Slack: Failed (${error.message})`);
      }
    }
  }

  printBanner() {
    console.log(`
    ╔═══════════════════════════════════════════════════════════════════╗
    ║                                                                   ║
    ║   ███╗   ███╗██╗   ██╗    ██╗     ██╗████████╗████████╗██╗        ║
    ║   ████╗ ████║╚██╗ ██╔╝    ██║     ██║╚══██╔══╝╚══██╔══╝██║        ║
    ║   ██╔████╔██║ ╚████╔╝     ██║     ██║   ██║      ██║   ██║        ║
    ║   ██║╚██╔╝██║  ╚██╔╝      ██║     ██║   ██║      ██║   ██║        ║
    ║   ██║ ╚═╝ ██║   ██║       ███████╗██║   ██║      ██║   ███████╗   ║
    ║   ╚═╝     ╚═╝   ╚═╝       ╚══════╝╚═╝   ╚═╝      ╚═╝   ╚══════╝   ║
    ║                                                                   ║
    ║            ╦╔═╗╦═╗╦  ╦╦╔═╗  🤖 v2.0.0                              ║
    ║            ║╠═╣╠╦╝╚╗╔╝║╚═╗  3-Agent AI Assistant                  ║
    ║           ╚╝╩ ╩╩╚═ ╚╝ ╩╚═╝  Ollama + Claude                       ║
    ║                                                                   ║
    ╚═══════════════════════════════════════════════════════════════════╝
    `);
  }

  printHelp() {
    console.log(`
🤖 MyLittle JARVIS v2.0.0

${t('help.usage')}
${t('help.usageCommand')}

${t('help.options')}
${t('help.optSetup')}
${t('help.optQuickSetup')}
${t('help.optHelp')}
${t('help.optVersion')}

${t('help.configFileLabel')}
  ~/.jarvis/jarvis.json

${t('help.examples')}
${t('help.exampleInteractive')}
${t('help.exampleSetup')}
`);
  }

  async checkEnvironment() {
    const result = { ollama: false, models: [] };

    try {
      const ollamaHost = this.config?.ollama?.host || process.env.OLLAMA_HOST || 'http://localhost:11434';
      const headers = {};

      if (this.config?.ollama?.apiKey) {
        headers['Authorization'] = `Bearer ${this.config.ollama.apiKey}`;
      }

      const response = await fetch(`${ollamaHost}/api/tags`, {
        headers,
        signal: AbortSignal.timeout(3000)
      });

      if (response.ok) {
        result.ollama = true;
        const data = await response.json();
        result.models = data.models?.map(m => m.name) || [];
      }
    } catch (error) {
      // Ollama not available
    }

    return result;
  }

  runLoop() {
    const rl = createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: true
    });

    const prompt = () => {
      rl.question('🎯 ', async (input) => {
        const trimmed = input.trim();

        if (!trimmed) {
          prompt();
          return;
        }

        // Handle commands
        if (trimmed.startsWith('/')) {
          const shouldContinue = await this.handleCommand(trimmed.substring(1), rl);
          if (shouldContinue !== false) {
            prompt();
          }
          return;
        }

        // Chat with 3-Agent system
        try {
          process.stdout.write('🤖 ');

          const response = await this.agent.process(trimmed);

          if (response.error) {
            console.log(`\n❌ ${response.error}`);
          } else {
            console.log(response.response);
          }

          // Show which agent handled it
          if (response.agent && response.agent !== 'orchestrator') {
            console.log(`\n   [${response.agent}${response.duration ? ` · ${response.duration}ms` : ''}]`);
          }

          console.log('');
        } catch (error) {
          console.log(`\n❌ Error: ${error.message}\n`);
        }

        prompt();
      });
    };

    prompt();
  }

  async handleCommand(cmd, rl) {
    const [command] = cmd.split(' ');

    switch (command.toLowerCase()) {
      case 'help':
      case 'h':
        console.log(`
${t('help.commands')}
   /help, /h      - ${t('help.helpDesc')}
   /status, /s    - ${t('help.statusDesc')}
   /channels      - Show connected channels
   /setup         - ${t('help.setupDesc')}
   /config        - ${t('help.configDesc')}
   /clear, /c     - ${t('help.clearDesc')}
   /models        - ${t('help.modelsDesc')}
   /exit, /q      - ${t('help.exitDesc')}
`);
        break;

      case 'setup':
        console.log('\n' + t('commands.startingSetup') + '\n');
        rl.close();
        await runSetup(false);
        console.log('\n' + t('commands.restartRequired'));
        process.exit(0);

      case 'config':
        console.log('\n' + t('commands.currentConfig'));
        console.log(tf('commands.configFile', { path: this.configLoader.configPath }));
        console.log(tf('commands.ollamaConfig', { host: this.config.ollama?.host || 'localhost:11434' }));
        console.log(tf('commands.gatewayConfig', { port: this.config.gateway?.port || 18789 }));
        console.log(tf('commands.orchestratorConfig', { model: this.config.models?.orchestrator || 'default' }));
        console.log(tf('commands.assistantConfig', { model: this.config.models?.assistant || 'default' }));
        console.log(tf('commands.telegramConfig', { status: this.config.channels?.telegram?.enabled ? t('commands.enabled') : t('commands.disabled') }));
        console.log(tf('commands.discordConfig', { status: this.config.channels?.discord?.enabled ? t('commands.enabled') : t('commands.disabled') }));
        console.log('');
        break;

      case 'status':
      case 's':
        const status = this.agent.getStatus();
        const health = await this.agent.healthCheck();
        console.log(`
${t('status.jarvisStatus')}
   Orchestrator: ${status.orchestrator}
   Assistant: ${status.assistant}
   Claude: ${status.claude}
${tf('status.contextMessages', { count: status.contextSize })}

   Ollama: ${health.ollama}
   Models: ${health.models?.slice(0, 5).join(', ') || 'none'}
`);
        break;

      case 'clear':
      case 'c':
        this.agent.clearContext();
        console.log(t('commands.contextCleared') + '\n');
        break;

      case 'models':
        const env = await this.checkEnvironment();
        if (env.models.length > 0) {
          console.log('\n' + t('commands.availableModels'));
          env.models.forEach(m => console.log(`   • ${m}`));
          console.log('');
        } else {
          console.log('\n' + t('commands.noModelsInstalled'));
          console.log(t('commands.installModelHint') + '\n');
        }
        break;

      case 'channels':
        console.log('\n📡 Connected Channels:');
        if (this.channels.size === 0) {
          console.log('   No channels connected.');
          console.log('   Run /setup to configure Telegram, Discord, or Slack.\n');
        } else {
          for (const [name, channel] of this.channels) {
            const status = channel.isRunning !== false ? '✅' : '❌';
            console.log(`   • ${name}: ${status}`);
          }
          console.log('');
        }
        break;

      case 'exit':
      case 'q':
      case 'quit':
        rl.close();
        await this.stop();
        return false;

      default:
        console.log(tf('commands.unknownCommand', { command: '/' + command }));
        console.log(t('commands.checkHelp') + '\n');
    }

    return true;
  }

  askQuestion(question) {
    return new Promise((resolve) => {
      const rl = createInterface({
        input: process.stdin,
        output: process.stdout
      });
      rl.question(question, (answer) => {
        rl.close();
        resolve(answer);
      });
    });
  }

  async stop() {
    console.log('\n' + t('shutdown.shuttingDown'));

    // Stop all channels
    for (const [name, channel] of this.channels) {
      try {
        if (channel.stop) await channel.stop();
        console.log(`   ${name}: stopped`);
      } catch (error) {
        console.error(`   ${name}: stop failed - ${error.message}`);
      }
    }
    this.channels.clear();

    if (this.gateway) {
      await this.gateway.stop();
    }

    if (this.configLoader) {
      this.configLoader.destroy();
    }

    console.log(t('shutdown.goodbye') + '\n');
    process.exit(0);
  }
}

// CLI entry point
const terminal = new JarvisTerminal();

process.on('SIGINT', async () => {
  await terminal.stop();
});

process.on('uncaughtException', (error) => {
  console.error(tf('errors.uncaughtError', { error: error.message }));
});

terminal.start().catch((error) => {
  console.error(tf('errors.startFailed', { error: error.message }));
  process.exit(1);
});
