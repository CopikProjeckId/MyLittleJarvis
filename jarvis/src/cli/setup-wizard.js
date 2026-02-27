// JARVIS Setup Wizard
// Interactive CLI configuration for first-time setup

import readline from 'readline';
import { ConfigLoader } from '../core/config/config-loader.js';
import crypto from 'crypto';
import { initI18n, t, tf, setLanguage, SUPPORTED_LANGUAGES, getLanguageName } from '../i18n/index.js';

export class SetupWizard {
  constructor() {
    this.rl = null;
    this.config = null;
    this.configLoader = null;
    this.language = 'ko';
  }

  /**
   * Create readline interface
   */
  createReadline() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  /**
   * Ask a question and return answer
   */
  ask(question, defaultValue = '') {
    return new Promise((resolve) => {
      const prompt = defaultValue
        ? `${question} [${defaultValue}]: `
        : `${question}: `;

      this.rl.question(prompt, (answer) => {
        resolve(answer.trim() || defaultValue);
      });
    });
  }

  /**
   * Ask yes/no question
   */
  async askYesNo(question, defaultYes = true) {
    const hint = defaultYes ? '[Y/n]' : '[y/N]';
    const answer = await this.ask(`${question} ${hint}`, '');
    const lower = answer.toLowerCase();

    if (lower === '') return defaultYes;
    return lower === 'y' || lower === 'yes';
  }

  /**
   * Ask for password (hidden input)
   */
  askPassword(question) {
    return new Promise((resolve) => {
      process.stdout.write(`${question}: `);

      const stdin = process.stdin;
      const wasRaw = stdin.isRaw;

      stdin.setRawMode(true);
      stdin.resume();

      let password = '';

      const onData = (char) => {
        const c = char.toString();

        switch (c) {
          case '\n':
          case '\r':
          case '\u0004': // Ctrl+D
            stdin.setRawMode(wasRaw);
            stdin.removeListener('data', onData);
            process.stdout.write('\n');
            resolve(password);
            break;
          case '\u0003': // Ctrl+C
            process.exit();
            break;
          case '\u007F': // Backspace
            password = password.slice(0, -1);
            break;
          default:
            password += c;
            process.stdout.write('*');
        }
      };

      stdin.on('data', onData);
    });
  }

  /**
   * Print section header
   */
  printSection(title) {
    console.log('\n' + '='.repeat(50));
    console.log(`  ${title}`);
    console.log('='.repeat(50) + '\n');
  }

  /**
   * Print info message
   */
  printInfo(message) {
    console.log(`ℹ️  ${message}`);
  }

  /**
   * Print success message
   */
  printSuccess(message) {
    console.log(`✅ ${message}`);
  }

  /**
   * Print warning message
   */
  printWarning(message) {
    console.log(`⚠️  ${message}`);
  }

  /**
   * System selection menu
   */
  async selectSystem() {
    console.log(t('setup.selectSystem') + '\n');
    console.log('  1) ' + t('setup.openclawDesc'));
    console.log('     • Multi-channel (WhatsApp, Telegram, Discord, Slack, IRC...)');
    console.log('     • Flexible LLM (OpenRouter, Anthropic, OpenAI)');
    console.log('     • Node 22+ required');
    console.log('     • Docs: https://docs.openclaw.ai');
    console.log('');
    console.log('  2) ' + t('setup.jarvisDesc'));
    console.log('     • Ollama local LLM (offline capable)');
    console.log('     • 3-Agent system (Orchestrator/Assistant/Claude)');
    console.log('     • Gateway + PWA web UI');
    console.log('');

    const choice = await this.ask(t('setup.selectChoice') + ' (1/2)', '2');

    return choice === '1' ? 'openclaw' : 'jarvis';
  }

  /**
   * Mode selection for JARVIS
   */
  async selectMode() {
    this.printSection(t('setup.modeSection'));

    console.log(t('setup.selectMode') + '\n');
    console.log('  1) ' + t('setup.simpleMode'));
    console.log('     • No local model installation required');
    console.log('     • Single Ollama Cloud for all processing');
    console.log('     • Best for mobile, low-spec devices, quick start');
    console.log('     • Pattern matching routing (skip LLM routing)');
    console.log('');
    console.log('  2) ' + t('setup.agentMode'));
    console.log('     • Orchestrator: Local lightweight model (routing only)');
    console.log('     • Assistant: Cloud or local');
    console.log('     • Claude: Complex coding tasks (optional)');
    console.log('     • Fast routing, cost optimization');
    console.log('     • Best for desktop, servers');
    console.log('');

    const choice = await this.ask(t('setup.selectChoice') + ' (1/2)', '1');
    const mode = choice === '2' ? '3agent' : 'simple';

    this.config.mode = mode;

    if (mode === 'simple') {
      this.printSuccess(t('setup.simpleModeSelected'));
      console.log('');
      this.printInfo(t('setup.noLocalModelNeeded'));
      this.printInfo(t('setup.ollamaCloudOnly'));
    } else {
      this.printSuccess(t('setup.agentModeSelected'));
      console.log('');
      this.printInfo(t('setup.localModelNeeded'));
      this.printInfo(t('setup.recommendModel'));
    }

    console.log('');
  }

  /**
   * OpenClaw setup - install and configure
   */
  async runOpenClawSetup() {
    this.printSection(t('setup.openclawInstallSection'));

    console.log(t('setup.openclawDescription'));
    console.log(t('setup.openclawChannels') + '\n');

    // Check if already installed
    const isInstalled = await this.checkOpenClawInstalled();

    if (isInstalled) {
      this.printSuccess(t('setup.openclawAlreadyInstalled'));
      console.log('');

      const runOnboard = await this.askYesNo(t('setup.runOpenclawOnboard'), true);
      if (runOnboard) {
        await this.runOpenClawOnboard();
      }
    } else {
      // Check Node version
      const nodeVersion = await this.checkNodeVersion();
      if (nodeVersion < 22) {
        this.printWarning(tf('setup.nodeVersionDetected', { version: nodeVersion }));
        console.log('');
        console.log(t('setup.nodeUpgradeInfo'));
        console.log('  # nvm');
        console.log('  nvm install 22 && nvm use 22');
        console.log('');
        console.log('  # Direct download');
        console.log('  https://nodejs.org/');
        console.log('');

        const continueAnyway = await this.askYesNo(t('setup.continueAnyway'), false);
        if (!continueAnyway) {
          return;
        }
      }

      // Install OpenClaw
      const installNow = await this.askYesNo(t('setup.installOpenclawNow'), true);

      if (installNow) {
        await this.installOpenClaw();
      } else {
        // Show manual instructions
        this.printInfo(t('setup.manualInstallInfo'));
        console.log('');
        console.log('  # macOS/Linux/WSL2');
        console.log('  curl -fsSL https://openclaw.ai/install.sh | bash');
        console.log('');
        console.log('  # Windows PowerShell');
        console.log('  iwr -useb https://openclaw.ai/install.ps1 | iex');
        console.log('');
        console.log('  # npm');
        console.log('  npm install -g openclaw@latest');
        console.log('');
      }
    }

    // Show useful commands
    this.printSection(t('setup.openclawCommands'));
    console.log('  openclaw onboard     # Setup wizard');
    console.log('  openclaw doctor      # Check config');
    console.log('  openclaw dashboard   # Open web UI');
    console.log('  openclaw gateway status  # Gateway status');
    console.log('');

    console.log(t('setup.openclawDocsUrl'));
    console.log('');

    this.printInfo(t('setup.supportedChannels'));
    console.log('');

    // Option to also setup JARVIS
    const setupJarvisToo = await this.askYesNo(t('setup.setupJarvisToo'), false);

    if (setupJarvisToo) {
      console.log('\n' + t('setup.startingJarvisSetup') + '\n');

      this.configLoader = new ConfigLoader();
      await this.configLoader.init();
      this.config = this.configLoader.getAll();

      await this.configureOllama();
      await this.configureGateway();
      await this.configureChannels();
      await this.configureAPIKeys();

      this.configLoader.config = this.config;
      this.configLoader.save();

      this.printSection(t('setup.setupComplete'));
      console.log(t('setup.bothSetupComplete') + '\n');
      console.log(t('setup.runMethods'));
      console.log('  • OpenClaw: openclaw dashboard');
      console.log('  • JARVIS: node cli.js');
      console.log('');
    }
  }

  /**
   * Check if OpenClaw is installed
   */
  async checkOpenClawInstalled() {
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);

    try {
      await execAsync('openclaw --version');
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check Node.js version
   */
  async checkNodeVersion() {
    const version = process.version.replace('v', '').split('.')[0];
    return parseInt(version);
  }

  /**
   * Install OpenClaw
   */
  async installOpenClaw() {
    const { spawn } = await import('child_process');
    const os = await import('os');

    console.log('\n' + t('setup.installingOpenclaw') + '\n');

    const isWindows = os.platform() === 'win32';

    return new Promise((resolve) => {
      let proc;

      if (isWindows) {
        // Windows: use npm
        console.log('npm install -g openclaw@latest\n');
        proc = spawn('npm', ['install', '-g', 'openclaw@latest'], {
          stdio: 'inherit',
          shell: true
        });
      } else {
        // macOS/Linux: use curl script
        console.log('curl -fsSL https://openclaw.ai/install.sh | bash\n');
        proc = spawn('bash', ['-c', 'curl -fsSL https://openclaw.ai/install.sh | bash'], {
          stdio: 'inherit'
        });
      }

      proc.on('close', async (code) => {
        if (code === 0) {
          this.printSuccess(t('setup.openclawInstallSuccess'));
          console.log('');

          // Run onboard
          const runOnboard = await this.askYesNo(t('setup.runOpenclawOnboard'), true);
          if (runOnboard) {
            await this.runOpenClawOnboard();
          }
        } else {
          this.printWarning(tf('setup.installFailed', { code }));
          console.log('');
          console.log(t('setup.tryManualInstall'));
          console.log('  npm install -g openclaw@latest');
          console.log('');
        }
        resolve();
      });

      proc.on('error', (err) => {
        this.printWarning(tf('setup.installError', { error: err.message }));
        resolve();
      });
    });
  }

  /**
   * Run OpenClaw onboard wizard
   */
  async runOpenClawOnboard() {
    const { spawn } = await import('child_process');

    console.log('\n' + t('setup.startingOnboard') + '\n');
    console.log(t('setup.onboardRunning') + '\n');

    return new Promise((resolve) => {
      const proc = spawn('openclaw', ['onboard', '--install-daemon'], {
        stdio: 'inherit',
        shell: true
      });

      proc.on('close', (code) => {
        if (code === 0) {
          this.printSuccess(t('setup.openclawSetupDone'));
        } else {
          this.printWarning(t('setup.onboardIncomplete'));
          console.log(t('setup.runLater'));
        }
        console.log('');
        resolve();
      });

      proc.on('error', (err) => {
        this.printWarning(tf('setup.onboardError', { error: err.message }));
        resolve();
      });
    });
  }

  /**
   * Language selection
   */
  async selectLanguage() {
    console.log('\n🌐 Language / 언어 선택\n');
    console.log('  1) 한국어');
    console.log('  2) English');
    console.log('');

    const choice = await this.ask('Select / 선택 (1/2)', '1');
    this.language = choice === '2' ? 'en' : 'ko';

    // Initialize i18n
    initI18n(this.language);

    return this.language;
  }

  /**
   * Run the setup wizard
   */
  async run() {
    this.createReadline();

    console.log('\n');
    console.log('╔═══════════════════════════════════════════════════════════════╗');
    console.log('║                                                               ║');
    console.log('║   ███╗   ███╗██╗   ██╗    ██╗     ██╗████████╗████████╗██╗    ║');
    console.log('║   ████╗ ████║╚██╗ ██╔╝    ██║     ██║╚══██╔══╝╚══██╔══╝██║    ║');
    console.log('║   ██╔████╔██║ ╚████╔╝     ██║     ██║   ██║      ██║   ██║    ║');
    console.log('║   ██║╚██╔╝██║  ╚██╔╝      ██║     ██║   ██║      ██║   ██║    ║');
    console.log('║   ██║ ╚═╝ ██║   ██║       ███████╗██║   ██║      ██║   ███████║');
    console.log('║   ╚═╝     ╚═╝   ╚═╝       ╚══════╝╚═╝   ╚═╝      ╚═╝   ╚══════╝');
    console.log('║                                                               ║');
    console.log('║         ╦╔═╗╦═╗╦  ╦╦╔═╗  🤖 Setup Wizard                      ║');
    console.log('║         ║╠═╣╠╦╝╚╗╔╝║╚═╗                                       ║');
    console.log('║        ╚╝╩ ╩╩╚═ ╚╝ ╩╚═╝  Your Personal AI Assistant          ║');
    console.log('║                                                               ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝');
    console.log('');

    // Language selection (first!)
    await this.selectLanguage();

    // System selection
    const system = await this.selectSystem();

    if (system === 'openclaw') {
      await this.runOpenClawSetup();
      this.rl.close();
      return;
    }

    // Continue with JARVIS setup
    console.log('\n' + t('setup.wizardHelp') + '\n');

    // Load existing config or create new
    this.configLoader = new ConfigLoader();
    await this.configLoader.init();
    this.config = this.configLoader.getAll();

    try {
      // Step 0: Ollama Installation & Model Setup
      const ollamaReady = await this.setupOllama();
      if (!ollamaReady) {
        this.printWarning(t('setup.ollamaSetupIncomplete'));
        const continueAnyway = await this.askYesNo(t('setup.continueSetup'), false);
        if (!continueAnyway) {
          this.rl.close();
          return;
        }
      }

      // Step 1: Mode Selection
      await this.selectMode();

      // Step 2: Ollama Configuration
      await this.configureOllama();

      // Step 3: Gateway Configuration
      await this.configureGateway();

      // Step 4: Channel Configuration (Telegram, Discord, etc.)
      await this.configureChannels();

      // Step 5: Optional API Keys
      await this.configureAPIKeys();

      // Save configuration (including language)
      this.config.language = this.language;
      this.configLoader.config = this.config;
      this.configLoader.save();

      this.printSection(t('setup.setupComplete'));
      console.log(t('setup.configFileSaved'));
      console.log(`  ${this.configLoader.configPath}\n`);

      console.log(t('setup.startJarvis'));
      console.log('  node cli.js\n');

      console.log(t('setup.startGateway'));
      console.log('  node -e "import(\'./src/gateway/gateway.js\').then(m => m.Gateway.create().then(g => g.start()))"\n');

    } catch (error) {
      console.error('\n❌ ' + tf('setup.setupError', { error: error.message }));
    } finally {
      this.rl.close();
    }
  }

  /**
   * Configure Ollama connection
   */
  async configureOllama() {
    this.printSection(t('setup.ollamaSection'));

    this.printInfo(t('setup.ollamaBackendInfo'));
    console.log('');

    // Connection type
    console.log(t('setup.selectConnectionType'));
    console.log('  1) ' + t('setup.localConnection'));
    console.log('  2) ' + t('setup.remoteConnection'));
    console.log('  3) ' + t('setup.cloudConnection'));
    console.log('');

    const choice = await this.ask(t('setup.selectChoice') + ' (1/2/3)', '1');

    if (choice === '1') {
      // Local Ollama
      this.config.ollama = {
        host: 'http://localhost:11434',
        timeout: 60000
      };

      // Test connection
      await this.testOllamaConnection();

    } else if (choice === '2') {
      // Remote server
      const host = await this.ask(t('setup.ollamaServerUrl'), 'http://localhost:11434');
      this.config.ollama = {
        host,
        timeout: 60000
      };

      // Check if auth needed
      const needsAuth = await this.askYesNo(t('setup.authNeeded'), false);
      if (needsAuth) {
        await this.configureOllamaAuth();
      }

      await this.testOllamaConnection();

    } else if (choice === '3') {
      // Ollama Cloud
      this.config.ollama = {
        host: 'https://ollama.com',
        timeout: 60000
      };

      console.log('\n' + t('setup.ollamaCloudAuth'));
      console.log('  1) ' + t('setup.apiKeyAuth'));
      console.log('  2) ' + t('setup.loginAuth'));
      console.log('');

      const authChoice = await this.ask(t('setup.selectChoice') + ' (1/2)', '1');

      if (authChoice === '1') {
        const apiKey = await this.askPassword('Ollama API Key');
        this.config.ollama.apiKey = apiKey;
      } else {
        const email = await this.ask(t('setup.enterEmail'));
        const password = await this.askPassword(t('setup.enterPassword'));

        // In production, this would call Ollama's auth API
        // For now, we'll store credentials (should be replaced with token exchange)
        this.printWarning(t('setup.loginNotSupported'));
        this.printInfo(t('setup.useApiKeyInstead'));

        const apiKey = await this.askPassword('Ollama API Key');
        this.config.ollama.apiKey = apiKey;
      }
    }

    // Model selection based on mode
    console.log('\n' + t('setup.modelSetup'));

    if (this.config.mode === 'simple') {
      // Simple mode: single model for everything
      console.log(t('setup.simpleModeModelInfo') + '\n');

      const model = await this.ask(t('setup.selectModel'), this.config.models?.assistant || 'qwen3:8b');

      this.config.models = {
        mode: 'simple',
        assistant: model,
        orchestrator: null,  // Not used in simple mode
        fallback: [model]
      };

      this.printInfo(tf('setup.allRequestsHandledBy', { model }));

    } else {
      // 3-Agent mode: orchestrator + assistant + optional claude
      console.log(t('setup.agentModeModelInfo') + '\n');

      const orchestrator = await this.ask(
        t('setup.orchestratorModel'),
        this.config.models?.orchestrator || 'qwen3:1.7b'
      );
      const assistant = await this.ask(
        t('setup.assistantModel'),
        this.config.models?.assistant || 'qwen3:8b'
      );

      // Fallback model
      console.log('\n' + t('setup.fallbackModelSetup'));
      const useFallback = await this.askYesNo(t('setup.setupFallback'), true);
      let fallback = [];
      if (useFallback) {
        const fallbackModel = await this.ask(t('setup.fallbackModel'), orchestrator);
        fallback = [fallbackModel];
      }

      this.config.models = {
        mode: '3agent',
        orchestrator,
        assistant,
        fallback
      };

      this.printInfo(`Orchestrator: ${orchestrator}`);
      this.printInfo(`Assistant: ${assistant}`);
      if (fallback.length > 0) {
        this.printInfo(`Fallback: ${fallback.join(', ')}`);
      }
    }

    this.printSuccess(t('setup.ollamaConfigDone'));
  }

  /**
   * Configure Ollama authentication
   */
  async configureOllamaAuth() {
    console.log('\n' + t('setup.authMethod'));
    console.log('  1) ' + t('setup.apiKeyOrBearer'));
    console.log('  2) ' + t('setup.basicAuth'));
    console.log('');

    const authType = await this.ask(t('setup.selectChoice') + ' (1/2)', '1');

    if (authType === '1') {
      const apiKey = await this.askPassword(t('setup.enterApiKey'));
      this.config.ollama.apiKey = apiKey;
    } else {
      const username = await this.ask(t('setup.enterUsername'));
      const password = await this.askPassword(t('setup.enterPassword'));
      this.config.ollama.auth = {
        type: 'basic',
        username,
        password
      };
    }
  }

  /**
   * Check if Ollama is installed
   */
  async checkOllamaInstalled() {
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);

    try {
      await execAsync('ollama --version');
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Install Ollama
   */
  async installOllama() {
    const { spawn } = await import('child_process');
    const os = await import('os');

    const platform = os.platform();
    console.log('\n' + t('setup.installingOllama') + '\n');

    return new Promise((resolve) => {
      let proc;

      if (platform === 'win32') {
        // Windows: download and run installer
        console.log(t('setup.windowsManualInstall'));
        console.log('');
        console.log(t('setup.downloadUrl'));
        console.log('');
        console.log(t('setup.retryAfterInstall'));
        resolve(false);
        return;
      } else if (platform === 'darwin' || platform === 'linux') {
        // macOS/Linux: use curl script
        console.log('curl -fsSL https://ollama.ai/install.sh | sh\n');
        proc = spawn('bash', ['-c', 'curl -fsSL https://ollama.ai/install.sh | sh'], {
          stdio: 'inherit'
        });
      } else {
        this.printWarning(tf('setup.unsupportedPlatform', { platform }));
        resolve(false);
        return;
      }

      proc.on('close', (code) => {
        if (code === 0) {
          this.printSuccess(t('setup.installSuccess'));
          resolve(true);
        } else {
          this.printWarning(tf('setup.installFailed', { code }));
          resolve(false);
        }
      });

      proc.on('error', (err) => {
        this.printWarning(tf('setup.installError', { error: err.message }));
        resolve(false);
      });
    });
  }

  /**
   * Start Ollama server
   */
  async startOllamaServer() {
    const { spawn } = await import('child_process');

    console.log('\n' + t('setup.startingOllamaServer'));

    // Start ollama serve in background
    const proc = spawn('ollama', ['serve'], {
      detached: true,
      stdio: 'ignore'
    });
    proc.unref();

    // Wait a bit for server to start
    await new Promise(resolve => setTimeout(resolve, 2000));

    this.printSuccess(t('setup.ollamaServerStarted'));
  }

  /**
   * Pull Ollama model
   */
  async pullOllamaModel(modelName) {
    const { spawn } = await import('child_process');

    console.log('\n' + tf('setup.downloadingModel', { model: modelName }));
    console.log(t('setup.downloadMayTakeTime') + '\n');

    return new Promise((resolve) => {
      const proc = spawn('ollama', ['pull', modelName], {
        stdio: 'inherit'
      });

      proc.on('close', (code) => {
        if (code === 0) {
          this.printSuccess(tf('setup.modelDownloadSuccess', { model: modelName }));
          resolve(true);
        } else {
          this.printWarning(tf('setup.modelDownloadFailed', { model: modelName }));
          resolve(false);
        }
      });

      proc.on('error', (err) => {
        this.printWarning(tf('setup.downloadError', { error: err.message }));
        resolve(false);
      });
    });
  }

  /**
   * Get list of installed models
   */
  async getInstalledModels() {
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);

    try {
      const { stdout } = await execAsync('ollama list');
      const lines = stdout.trim().split('\n').slice(1); // Skip header
      return lines.map(line => line.split(/\s+/)[0]).filter(Boolean);
    } catch {
      return [];
    }
  }

  /**
   * Setup Ollama (install + model download)
   */
  async setupOllama() {
    this.printSection(t('setup.ollamaInstallSection'));

    // Check if Ollama is installed
    const isInstalled = await this.checkOllamaInstalled();

    if (!isInstalled) {
      this.printWarning(t('setup.ollamaNotInstalled'));
      console.log('');

      const install = await this.askYesNo(t('setup.installOllamaNow'), true);
      if (install) {
        const success = await this.installOllama();
        if (!success) {
          this.printInfo(t('setup.installOllamaLater'));
          return false;
        }
      } else {
        console.log('\n' + t('setup.manualInstall'));
        console.log('  # macOS / Linux');
        console.log('  curl -fsSL https://ollama.ai/install.sh | sh');
        console.log('');
        console.log('  # Windows');
        console.log('  https://ollama.ai/download');
        console.log('');
        return false;
      }
    } else {
      this.printSuccess(t('setup.ollamaInstalled'));
    }

    // Test connection / start server
    const connected = await this.testOllamaConnection();
    if (!connected) {
      const startServer = await this.askYesNo(t('setup.startOllamaServer'), true);
      if (startServer) {
        await this.startOllamaServer();
        // Re-test
        await this.testOllamaConnection();
      }
    }

    // Check installed models
    const installedModels = await this.getInstalledModels();
    console.log('');

    if (installedModels.length > 0) {
      this.printInfo(tf('setup.installedModels', { models: installedModels.join(', ') }));
    } else {
      this.printWarning(t('setup.noModels'));
    }

    // Recommend default model
    const defaultModel = 'qwen3:1.7b';
    const hasDefaultModel = installedModels.some(m => m.includes('qwen3'));

    if (!hasDefaultModel) {
      console.log('');
      console.log(tf('setup.recommendedModel', { model: defaultModel }));

      const pullDefault = await this.askYesNo(tf('setup.downloadModel', { model: defaultModel }), true);
      if (pullDefault) {
        await this.pullOllamaModel(defaultModel);
      }
    }

    // Ask for additional model
    console.log('');
    const pullMore = await this.askYesNo(t('setup.downloadMoreModels'), false);
    if (pullMore) {
      console.log('\n' + t('setup.recommendedModels'));
      console.log('  • qwen3:8b    - General tasks (~5GB)');
      console.log('  • llama3:8b   - General tasks (~5GB)');
      console.log('  • codellama   - Coding (~4GB)');
      console.log('  • gemma2:2b   - Lightweight (~2GB)');
      console.log('');

      const modelName = await this.ask(t('setup.modelToDownload'), 'qwen3:8b');
      if (modelName) {
        await this.pullOllamaModel(modelName);
      }
    }

    return true;
  }

  /**
   * Test Ollama connection
   */
  async testOllamaConnection() {
    console.log('\n' + t('setup.testingOllama'));

    try {
      const headers = {};
      if (this.config?.ollama?.apiKey) {
        headers['Authorization'] = `Bearer ${this.config.ollama.apiKey}`;
      }
      if (this.config?.ollama?.auth?.type === 'basic') {
        const creds = Buffer.from(
          `${this.config.ollama.auth.username}:${this.config.ollama.auth.password}`
        ).toString('base64');
        headers['Authorization'] = `Basic ${creds}`;
      }

      const host = this.config?.ollama?.host || 'http://localhost:11434';
      const response = await fetch(`${host}/api/version`, {
        headers,
        signal: AbortSignal.timeout(5000)
      });

      if (response.ok) {
        const data = await response.json();
        this.printSuccess(tf('setup.ollamaConnectSuccess', { version: data.version }));
        return true;
      } else {
        this.printWarning(tf('setup.ollamaResponseError', { status: response.status }));
        return false;
      }
    } catch (error) {
      this.printWarning(tf('setup.ollamaConnectFailed', { error: error.message }));
      this.printInfo(t('setup.checkOllamaRunning'));
      return false;
    }
  }

  /**
   * Configure Gateway settings
   */
  async configureGateway() {
    this.printSection(t('setup.gatewaySection'));

    this.printInfo(t('setup.gatewayInfo'));
    console.log('');

    // Port
    const port = await this.ask(t('setup.portNumber'), String(this.config.gateway?.port || 18789));
    this.config.gateway = {
      ...this.config.gateway,
      port: parseInt(port)
    };

    // Auth token
    console.log('\n' + t('setup.authSetup'));
    const configureAuth = await this.askYesNo(t('setup.setupGatewayAuth'), true);

    if (configureAuth) {
      console.log('\n' + t('setup.authToken'));
      console.log('  1) ' + t('setup.autoGenerate'));
      console.log('  2) ' + t('setup.manualInput'));
      console.log('');

      const tokenChoice = await this.ask(t('setup.selectChoice') + ' (1/2)', '1');

      let token;
      if (tokenChoice === '1') {
        token = crypto.randomBytes(32).toString('hex');
        console.log('\n' + tf('setup.generatedToken', { token }));
        this.printInfo(t('setup.saveTokenWarning'));
      } else {
        token = await this.askPassword(t('setup.enterToken'));
        if (token.length < 16) {
          this.printWarning(t('setup.tokenTooShort'));
          token = crypto.randomBytes(32).toString('hex');
          console.log(tf('setup.generatedToken', { token }));
        }
      }

      this.config.gateway.auth = {
        token,
        allowLocal: true,
        allowTailscale: false
      };

      // Allow local?
      const allowLocal = await this.askYesNo(t('setup.allowLocalAccess'), true);
      this.config.gateway.auth.allowLocal = allowLocal;

    } else {
      this.config.gateway.auth = {
        token: null,
        allowLocal: true
      };
      this.printWarning(t('setup.noAuthWarning'));
    }

    this.printSuccess(t('setup.gatewayConfigDone'));
  }

  /**
   * Configure messaging channels
   */
  async configureChannels() {
    this.printSection(t('setup.channelSection'));

    this.printInfo(t('setup.channelInfo'));
    console.log('');

    this.config.channels = this.config.channels || {};

    // Telegram
    const setupTelegram = await this.askYesNo(t('setup.setupTelegram'), false);
    if (setupTelegram) {
      await this.configureTelegram();
    }

    // Discord
    const setupDiscord = await this.askYesNo(t('setup.setupDiscord'), false);
    if (setupDiscord) {
      await this.configureDiscord();
    }

    // Slack
    const setupSlack = await this.askYesNo(t('setup.setupSlack'), false);
    if (setupSlack) {
      await this.configureSlack();
    }

    this.printSuccess(t('setup.channelConfigDone'));
  }

  /**
   * Configure Telegram bot
   */
  async configureTelegram() {
    console.log('\n' + t('setup.telegramSetup'));
    console.log('');
    this.printInfo(t('setup.telegramStep1'));
    this.printInfo(t('setup.telegramStep2'));
    console.log('');

    const token = await this.askPassword('Telegram Bot Token');

    if (!token) {
      this.printWarning(tf('setup.tokenNotEntered', { channel: 'Telegram' }));
      return;
    }

    // Allowed users
    console.log('\n' + t('setup.allowedUsersSetup'));
    this.printInfo(t('setup.allowedUsersInfo'));
    this.printInfo(t('setup.allowedUsersFormat'));
    this.printInfo(t('setup.allowAllUsers'));

    const allowedUsers = await this.ask(t('setup.allowedUserIds'), '');

    this.config.channels.telegram = {
      enabled: true,
      token,
      allowedUsers: allowedUsers
        ? allowedUsers.split(',').map(id => id.trim())
        : [],
      polling: true
    };

    this.printSuccess(t('setup.telegramConfigDone'));
  }

  /**
   * Configure Discord bot
   */
  async configureDiscord() {
    console.log('\n' + t('setup.discordSetup'));
    console.log('');
    this.printInfo(t('setup.discordStep1'));
    this.printInfo(t('setup.discordStep2'));
    console.log('');

    const token = await this.askPassword('Discord Bot Token');

    if (!token) {
      this.printWarning(tf('setup.tokenNotEntered', { channel: 'Discord' }));
      return;
    }

    this.config.channels.discord = {
      enabled: true,
      token
    };

    this.printSuccess(t('setup.discordConfigDone'));
  }

  /**
   * Configure Slack bot
   */
  async configureSlack() {
    console.log('\n' + t('setup.slackSetup'));
    console.log('');
    this.printInfo(t('setup.slackStep1'));
    this.printInfo(t('setup.slackStep2'));
    console.log('');

    const token = await this.askPassword('Slack Bot Token (xoxb-...)');

    if (!token) {
      this.printWarning(tf('setup.tokenNotEntered', { channel: 'Slack' }));
      return;
    }

    const signingSecret = await this.askPassword('Slack Signing Secret');

    this.config.channels.slack = {
      enabled: true,
      token,
      signingSecret
    };

    this.printSuccess(t('setup.slackConfigDone'));
  }

  /**
   * Configure optional API keys
   */
  async configureAPIKeys() {
    this.printSection(t('setup.apiKeySection'));

    this.printInfo(t('setup.apiKeyInfo'));
    console.log('');

    this.config.apiKeys = this.config.apiKeys || {};

    // OpenAI
    const setupOpenAI = await this.askYesNo(t('setup.setupOpenAI'), false);
    if (setupOpenAI) {
      const key = await this.askPassword('OpenAI API Key (sk-...)');
      if (key) {
        this.config.apiKeys.openai = key;
        this.printSuccess(t('setup.openaiConfigDone'));
      }
    }

    // Anthropic
    const setupAnthropic = await this.askYesNo(t('setup.setupAnthropic'), false);
    if (setupAnthropic) {
      const key = await this.askPassword('Anthropic API Key');
      if (key) {
        this.config.apiKeys.anthropic = key;
        this.printSuccess(t('setup.anthropicConfigDone'));
      }
    }

    this.printSuccess(t('setup.apiKeyConfigDone'));
  }

  /**
   * Run quick setup (minimal config)
   */
  async runQuick() {
    this.createReadline();

    console.log('\n' + t('setup.quickSetup') + '\n');

    this.configLoader = new ConfigLoader();
    await this.configLoader.init();
    this.config = this.configLoader.getAll();

    // Just test Ollama connection
    console.log(t('setup.checkingOllama'));
    await this.testOllamaConnection();

    // Generate auth token
    if (!this.config.gateway?.auth?.token) {
      this.config.gateway = {
        ...this.config.gateway,
        port: 18789,
        auth: {
          token: crypto.randomBytes(32).toString('hex'),
          allowLocal: true
        }
      };
    }

    this.configLoader.config = this.config;
    this.configLoader.save();

    console.log('\n✅ ' + t('setup.quickSetupDone'));
    console.log(`${t('setup.configFileSaved')} ${this.configLoader.configPath}\n`);

    this.rl.close();
  }
}

/**
 * Run setup wizard from CLI
 */
export async function runSetup(quick = false) {
  const wizard = new SetupWizard();

  if (quick) {
    await wizard.runQuick();
  } else {
    await wizard.run();
  }
}

export default SetupWizard;
