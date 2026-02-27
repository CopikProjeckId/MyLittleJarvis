#!/usr/bin/env node

// JARVIS CLI - Interactive Terminal Client
// Architecture: Background service (gateway+channels+agent) + CLI client (chat window)
// CLI connects to running service via WebSocket. Closing CLI does NOT stop JARVIS.

import { DaemonManager } from './src/core/daemon.js';
import { runSetup } from './src/cli/setup-wizard.js';
import { createInterface } from 'readline';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { initI18n, t, tf } from './src/i18n/index.js';
import WebSocket from 'ws';

class JarvisTerminal {
  constructor() {
    this.daemon = new DaemonManager();
    this.ws = null;
    this.config = null;
    this.configPath = join(homedir(), '.jarvis', 'jarvis.json');
    this.port = 18789;
    this.rl = null;
    this.pendingResolve = null;  // For awaiting WS response
    this.connected = false;
  }

  async start() {
    const args = process.argv.slice(2);

    // Pre-load language
    this.loadConfig();

    // === Daemon commands ===
    if (args.includes('start')) {
      await this.cmdStart();
      return;
    }

    if (args.includes('stop')) {
      await this.cmdStop();
      return;
    }

    if (args.includes('restart')) {
      await this.cmdRestart();
      return;
    }

    if (args.includes('status')) {
      await this.cmdStatus();
      return;
    }

    if (args.includes('logs')) {
      await this.cmdLogs();
      return;
    }

    // === Setup / Help / Version ===
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
      console.log('MyLittle JARVIS v2.0.1');
      return;
    }

    // === Interactive mode (client) ===
    await this.startInteractive();
  }

  loadConfig() {
    if (existsSync(this.configPath)) {
      try {
        this.config = JSON.parse(readFileSync(this.configPath, 'utf-8'));
        if (this.config.language) initI18n(this.config.language);
        this.port = this.config.gateway?.port || 18789;
      } catch {}
    }
  }

  // ========================================
  // Daemon commands
  // ========================================

  async cmdStart() {
    if (this.daemon.isRunning()) {
      const pid = this.daemon.getPid();
      console.log(`✅ JARVIS is already running (PID: ${pid})`);
      console.log(`   Gateway: http://127.0.0.1:${this.port}`);
      console.log(`   PWA: http://127.0.0.1:${this.port}/chat.html`);
      console.log('   Run "jarvis" to open chat window');
      return;
    }

    // First run check
    if (!existsSync(this.configPath)) {
      console.log('🆕 First run detected! Running setup first...\n');
      await runSetup(false);
      console.log('\nSetup complete! Starting JARVIS...\n');
      this.loadConfig();
    }

    console.log('🚀 Starting JARVIS service...');
    const result = await this.daemon.start();

    if (result.success) {
      console.log(`✅ JARVIS started (PID: ${result.pid})`);
      console.log(`   Gateway: http://127.0.0.1:${this.port}`);
      console.log(`   PWA: http://127.0.0.1:${this.port}/chat.html`);
      console.log(`   Logs: ${result.logFile}`);
      console.log('');
      console.log('   Run "jarvis" to open chat window');
      console.log('   Run "jarvis stop" to stop the service');
    } else {
      console.log(`❌ ${result.error}`);
      if (result.logFile) {
        console.log(`   Check logs: ${result.logFile}`);
        const logs = this.daemon.getLogs(5);
        if (logs.length > 0) {
          console.log('\n   Recent logs:');
          logs.forEach(l => console.log(`   ${l}`));
        }
      }
    }
  }

  async cmdStop() {
    if (!this.daemon.isRunning()) {
      console.log('⚠️  JARVIS is not running');
      return;
    }

    console.log('🛑 Stopping JARVIS service...');
    const result = await this.daemon.stop();

    if (result.success) {
      console.log(`✅ JARVIS stopped (PID: ${result.pid})${result.forced ? ' (forced)' : ''}`);
    } else {
      console.log(`❌ ${result.error}`);
    }
  }

  async cmdRestart() {
    if (this.daemon.isRunning()) {
      console.log('🔄 Restarting JARVIS service...');
      await this.daemon.stop();
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    await this.cmdStart();
  }

  async cmdStatus() {
    const status = await this.daemon.status();

    if (status.running) {
      console.log(`✅ JARVIS is running (PID: ${status.pid})`);
      if (status.gateway) {
        console.log(`   Gateway: http://127.0.0.1:${status.gateway.port} (${status.gateway.status})`);
        if (status.gateway.uptime) {
          const uptime = Math.floor(status.gateway.uptime);
          const hours = Math.floor(uptime / 3600);
          const mins = Math.floor((uptime % 3600) / 60);
          const secs = uptime % 60;
          console.log(`   Uptime: ${hours}h ${mins}m ${secs}s`);
        }
      }
    } else {
      console.log('❌ JARVIS is not running');
      console.log('   Run "jarvis start" to start the service');
    }
  }

  async cmdLogs() {
    const lines = this.daemon.getLogs(30);
    if (lines.length === 0) {
      console.log('No logs found');
    } else {
      lines.forEach(l => console.log(l));
    }
  }

  // ========================================
  // Interactive mode (WebSocket client)
  // ========================================

  async startInteractive() {
    console.clear();
    this.printBanner();

    // Check if service is running, auto-start if not
    if (!this.daemon.isRunning()) {
      // First run check
      if (!existsSync(this.configPath)) {
        console.log(t('welcome.firstRun') + '\n');
        const answer = await this.askQuestion(t('welcome.setupPrompt'));
        if (answer.toLowerCase() !== 'n') {
          await runSetup(false);
          console.log('\n' + t('welcome.setupComplete') + '\n');
          this.loadConfig();
        }
      }

      console.log('🚀 Starting JARVIS service...');
      const result = await this.daemon.start();

      if (!result.success) {
        console.log(`❌ Failed to start service: ${result.error}`);
        if (result.logFile) {
          const logs = this.daemon.getLogs(5);
          if (logs.length > 0) {
            console.log('\nRecent logs:');
            logs.forEach(l => console.log(`  ${l}`));
          }
        }
        process.exit(1);
      }

      console.log(`✅ Service started (PID: ${result.pid})`);

      // Wait a bit for gateway to be ready
      await this.waitForGateway(10000);
    } else {
      console.log(`✅ JARVIS service running (PID: ${this.daemon.getPid()})`);
    }

    // Connect to gateway via WebSocket
    const connected = await this.connectWebSocket();
    if (!connected) {
      console.log('❌ Cannot connect to JARVIS gateway');
      console.log(`   Check: http://127.0.0.1:${this.port}/health`);
      process.exit(1);
    }

    console.log(`🔗 Connected to gateway (ws://127.0.0.1:${this.port})`);

    // Fetch status from service
    await this.fetchServiceStatus();

    console.log('\n' + '─'.repeat(50));
    console.log(t('help.hint'));
    console.log('   Ctrl+C: Close chat window (service keeps running)');
    console.log('─'.repeat(50) + '\n');

    this.runLoop();
  }

  async waitForGateway(timeoutMs) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      try {
        const response = await fetch(`http://127.0.0.1:${this.port}/health`, {
          signal: AbortSignal.timeout(1000)
        });
        if (response.ok) return true;
      } catch {}
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    return false;
  }

  connectWebSocket() {
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        resolve(false);
      }, 5000);

      try {
        this.ws = new WebSocket(`ws://127.0.0.1:${this.port}`);

        this.ws.on('open', () => {
          this.connected = true;
        });

        this.ws.on('message', (data) => {
          try {
            const msg = JSON.parse(data.toString());
            this.handleWsMessage(msg);

            // Resolve connection on first 'connected' message
            if (msg.type === 'connected') {
              clearTimeout(timeout);
              resolve(true);
            }
          } catch {}
        });

        this.ws.on('close', () => {
          this.connected = false;
          if (this.pendingResolve) {
            this.pendingResolve({ error: 'Connection lost' });
            this.pendingResolve = null;
          }
          // Don't exit - try to reconnect
          console.log('\n⚠️  Connection to JARVIS lost. Service may still be running.');
          console.log('   Run "jarvis" to reconnect or "jarvis status" to check.\n');
          if (this.rl) this.rl.close();
          process.exit(0);
        });

        this.ws.on('error', () => {
          clearTimeout(timeout);
          resolve(false);
        });
      } catch {
        clearTimeout(timeout);
        resolve(false);
      }
    });
  }

  handleWsMessage(msg) {
    switch (msg.type) {
      case 'connected':
        // Auth may be auto-handled for local connections
        break;

      case 'chat':
        if (this.pendingResolve) {
          this.pendingResolve(msg);
          this.pendingResolve = null;
        }
        break;

      case 'status':
        if (this.pendingResolve) {
          this.pendingResolve(msg);
          this.pendingResolve = null;
        }
        break;

      case 'error':
        if (this.pendingResolve) {
          this.pendingResolve({ error: msg.error });
          this.pendingResolve = null;
        } else {
          console.log(`\n❌ ${msg.error}`);
        }
        break;
    }
  }

  async sendAndWait(message, timeoutMs = 120000) {
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        this.pendingResolve = null;
        resolve({ error: 'Response timeout' });
      }, timeoutMs);

      this.pendingResolve = (response) => {
        clearTimeout(timeout);
        resolve(response);
      };

      this.ws.send(JSON.stringify(message));
    });
  }

  async fetchServiceStatus() {
    try {
      const response = await fetch(`http://127.0.0.1:${this.port}/api/status`, {
        signal: AbortSignal.timeout(3000)
      });
      if (response.ok) {
        const status = await response.json();
        console.log('\n' + t('status.title'));
        console.log(`   Orchestrator: ${status.orchestrator || 'ready'}`);
        console.log(`   Assistant: ${status.assistant || 'ready'}`);
        if (status.claude) {
          console.log(`   Claude: ${status.claude}`);
        }
        if (status.gateway) {
          console.log(`   Gateway: port ${status.gateway.port}, ${status.gateway.clients || 0} clients`);
        }
      }
    } catch {
      // Silently fail
    }
  }

  // ========================================
  // Interactive loop (client-side)
  // ========================================

  runLoop() {
    this.rl = createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: true
    });

    const prompt = () => {
      this.rl.question('🎯 ', async (input) => {
        const trimmed = input.trim();

        if (!trimmed) {
          prompt();
          return;
        }

        // Handle commands
        if (trimmed.startsWith('/')) {
          const shouldContinue = await this.handleCommand(trimmed.substring(1));
          if (shouldContinue !== false) {
            prompt();
          }
          return;
        }

        // Send to service via WebSocket
        try {
          process.stdout.write('🤖 ');

          const response = await this.sendAndWait({
            type: 'chat',
            data: { message: trimmed }
          });

          if (response.error) {
            console.log(`\n❌ ${response.error}`);
          } else {
            console.log(response.response || response.data);
          }

          // Show agent info
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

  async handleCommand(cmd) {
    const [command, ...rest] = cmd.split(' ');

    switch (command.toLowerCase()) {
      case 'help':
      case 'h':
        console.log(`
${t('help.commands')}
   /help, /h      - ${t('help.helpDesc')}
   /status, /s    - ${t('help.statusDesc')}
   /channels      - Show connected channels
   /memory [query]- Search long-term memory (NMT)
   /setup         - ${t('help.setupDesc')}
   /config        - ${t('help.configDesc')}
   /clear, /c     - ${t('help.clearDesc')}
   /models        - ${t('help.modelsDesc')}
   /logs          - Show service logs
   /close         - Close chat window (service keeps running)
   /exit, /q      - Close chat window (service keeps running)
   /shutdown      - Stop JARVIS service completely
`);
        break;

      case 'setup':
        console.log('\n' + t('commands.startingSetup') + '\n');
        if (this.rl) this.rl.close();
        await runSetup(false);
        console.log('\n' + t('commands.restartRequired'));
        console.log('Run "jarvis restart" to apply changes.');
        process.exit(0);

      case 'config':
        try {
          const response = await fetch(`http://127.0.0.1:${this.port}/api/config`, {
            signal: AbortSignal.timeout(3000)
          });
          if (response.ok) {
            const cfg = await response.json();
            console.log('\n' + t('commands.currentConfig'));
            console.log(`   Config: ${this.configPath}`);
            console.log(`   Ollama: ${cfg.ollama?.host || 'localhost:11434'}`);
            console.log(`   Gateway: port ${cfg.gateway?.port || 18789}`);
            console.log(`   Mode: ${cfg.mode || cfg.models?.mode || 'simple'}`);
            console.log(`   Orchestrator: ${cfg.models?.orchestrator || 'default'}`);
            console.log(`   Assistant: ${cfg.models?.assistant || 'default'}`);
            console.log(`   Telegram: ${cfg.channels?.telegram?.enabled ? '✅' : '❌'}`);
            console.log(`   Discord: ${cfg.channels?.discord?.enabled ? '✅' : '❌'}`);
            console.log(`   Slack: ${cfg.channels?.slack?.enabled ? '✅' : '❌'}`);
            console.log('');
          }
        } catch {
          console.log('❌ Cannot fetch config from service\n');
        }
        break;

      case 'status':
      case 's':
        await this.fetchServiceStatus();
        console.log('');
        break;

      case 'clear':
      case 'c':
        try {
          await fetch(`http://127.0.0.1:${this.port}/api/clear`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: AbortSignal.timeout(3000)
          });
          console.log(t('commands.contextCleared') + '\n');
        } catch {
          console.log('❌ Failed to clear context\n');
        }
        break;

      case 'models':
        try {
          const ollamaHost = this.config?.ollama?.host || 'http://localhost:11434';
          const response = await fetch(`${ollamaHost}/api/tags`, {
            signal: AbortSignal.timeout(3000)
          });
          if (response.ok) {
            const data = await response.json();
            const models = data.models?.map(m => m.name) || [];
            if (models.length > 0) {
              console.log('\n' + t('commands.availableModels'));
              models.forEach(m => console.log(`   • ${m}`));
              console.log('');
            } else {
              console.log('\n' + t('commands.noModelsInstalled'));
              console.log(t('commands.installModelHint') + '\n');
            }
          }
        } catch {
          console.log('❌ Cannot connect to Ollama\n');
        }
        break;

      case 'channels':
        try {
          const response = await fetch(`http://127.0.0.1:${this.port}/api/status`, {
            signal: AbortSignal.timeout(3000)
          });
          if (response.ok) {
            const status = await response.json();
            console.log('\n📡 Connected Channels:');
            if (status.channels && Object.keys(status.channels).length > 0) {
              for (const [name, info] of Object.entries(status.channels)) {
                console.log(`   • ${name}: ${info.active ? '✅' : '❌'}`);
              }
            } else {
              console.log('   Info not available from service.');
              console.log('   Run /setup to configure Telegram, Discord, or Slack.');
            }
            console.log('');
          }
        } catch {
          console.log('❌ Cannot fetch channel status\n');
        }
        break;

      case 'memory':
        const query = rest.join(' ').trim();
        if (!query) {
          console.log('\n   Usage: /memory <search query>');
          console.log('   Example: /memory 지난주 회의 내용\n');
        } else {
          console.log(`\n🔍 Searching memory: "${query}"...`);
          try {
            const response = await fetch(
              `http://127.0.0.1:${this.port}/api/memory/search?q=${encodeURIComponent(query)}&limit=5`,
              { signal: AbortSignal.timeout(10000) }
            );
            if (response.ok) {
              const data = await response.json();
              if (data.results?.length > 0) {
                console.log(`   Found ${data.results.length} result(s):\n`);
                data.results.forEach((r, i) => {
                  const title = r.title || r.content?.substring(0, 60) || 'Untitled';
                  const score = r.score ? ` (${(r.score * 100).toFixed(0)}%)` : '';
                  console.log(`   [${i + 1}] ${title}${score}`);
                  if (r.content && r.content.length > 0) {
                    const preview = r.content.substring(0, 100).replace(/\n/g, ' ');
                    console.log(`       ${preview}${r.content.length > 100 ? '...' : ''}`);
                  }
                });
              } else {
                console.log('   No results found.');
              }
            } else {
              console.log('   ❌ Memory search failed');
            }
          } catch (error) {
            console.log(`   ❌ Memory search failed: ${error.message}`);
          }
          console.log('');
        }
        break;

      case 'logs':
        const logs = this.daemon.getLogs(20);
        if (logs.length === 0) {
          console.log('\nNo logs found.\n');
        } else {
          console.log('\n📋 Recent service logs:');
          logs.forEach(l => console.log(`   ${l}`));
          console.log('');
        }
        break;

      case 'shutdown':
        console.log('\n🛑 Shutting down JARVIS service...');
        if (this.ws) this.ws.close();
        const stopResult = await this.daemon.stop();
        if (stopResult.success) {
          console.log(`✅ Service stopped (PID: ${stopResult.pid})`);
        } else {
          console.log(`❌ ${stopResult.error}`);
        }
        if (this.rl) this.rl.close();
        process.exit(0);

      case 'close':
      case 'exit':
      case 'q':
      case 'quit':
        this.disconnect();
        return false;

      default:
        console.log(tf('commands.unknownCommand', { command: '/' + command }));
        console.log(t('commands.checkHelp') + '\n');
    }

    return true;
  }

  disconnect() {
    console.log('\n👋 Chat window closed. JARVIS service is still running.');
    console.log('   Run "jarvis" to reopen chat');
    console.log('   Run "jarvis stop" to stop the service\n');
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    if (this.rl) this.rl.close();
    process.exit(0);
  }

  // ========================================
  // UI
  // ========================================

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
    ║            ╦╔═╗╦═╗╦  ╦╦╔═╗  🤖 v2.0.1                              ║
    ║            ║╠═╣╠╦╝╚╗╔╝║╚═╗  3-Agent AI Assistant                  ║
    ║           ╚╝╩ ╩╩╚═ ╚╝ ╩╚═╝  Ollama + Claude                       ║
    ║                                                                   ║
    ╚═══════════════════════════════════════════════════════════════════╝
    `);
  }

  printHelp() {
    console.log(`
🤖 MyLittle JARVIS v2.0.1

Usage:
  jarvis                    Open interactive chat (auto-starts service)
  jarvis start              Start background service
  jarvis stop               Stop background service
  jarvis restart            Restart background service
  jarvis status             Show service status
  jarvis logs               Show recent service logs
  jarvis setup              Run setup wizard
  jarvis --help             Show this help

Service Architecture:
  JARVIS runs as a background service (gateway + channels + AI agent).
  The CLI chat window is just a client that connects to the service.
  Closing the chat window does NOT stop JARVIS.

  Gateway: http://127.0.0.1:${this.port}
  PWA:     http://127.0.0.1:${this.port}/chat.html
  Config:  ~/.jarvis/jarvis.json
`);
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
}

// CLI entry point
const terminal = new JarvisTerminal();

// Ctrl+C: Close chat window only (service keeps running)
process.on('SIGINT', () => {
  terminal.disconnect();
});

process.on('uncaughtException', (error) => {
  console.error(`❌ Uncaught error: ${error.message}`);
});

terminal.start().catch((error) => {
  console.error(`❌ Start failed: ${error.message}`);
  process.exit(1);
});
