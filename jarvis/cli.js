#!/usr/bin/env node

// JARVIS CLI - Interactive Terminal Interface
// OpenClaw-Level Command Line

import { JarvisCLI } from './src/core/jarvis-cli.js';
import pkg from 'readline-sync';
const { default: readlineSync } = pkg;
import { createInterface } from 'readline';

class JarvisTerminal {
  constructor() {
    this.jarvis = null;
    this.isInteractive = true;
  }

  async start() {
    console.clear();
    this.printBanner();
    
    // Initialize JARVIS
    this.jarvis = new JarvisCLI({
      agent: { model: 'qwen3.5' },
      memory: { storage: './data/memory' },
      config: { configDir: './config' },
      gateway: { port: 18789 }
    });
    
    await this.jarvis.start();
    
    // Print status
    console.log('\n📊 Status:');
    const status = this.jarvis.getStatus();
    console.log(`   Tools: ${status.tools}`);
    console.log(`   Gateway: ${status.gateway.running ? '✅ Running' : '❌ Stopped'}`);
    console.log('');
    
    // Start interactive loop
    this.runLoop();
  }

  printBanner() {
    console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🤖 JARVIS CLI v1.0.0                                   ║
║      OpenClaw-Level AI Assistant                         ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
    `);
  }

  runLoop() {
    const rl = createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: true
    });

    const prompt = () => {
      rl.question('🎯 ', async (input) => {
        if (!input.trim()) {
          prompt();
          return;
        }

        // Handle special commands
        if (input.startsWith('/')) {
          const result = await this.jarvis.execute(input.substring(1));
          console.log(this.formatResult(result));
        } else {
          // Chat mode
          try {
            const stream = this.jarvis.agent.turn(input);
            let fullResponse = '';
            
            process.stdout.write('🤖 ');
            for await (const chunk of stream) {
              process.stdout.write(chunk);
              fullResponse += chunk;
            }
            console.log('');
          } catch (error) {
            console.error('❌ Error:', error.message);
          }
        }

        prompt();
      });
    };

    prompt();
  }

  formatResult(result) {
    if (typeof result === 'string') return result;
    if (result.message) return result.message;
    return JSON.stringify(result, null, 2);
  }

  async stop() {
    if (this.jarvis) {
      await this.jarvis.stop();
    }
    process.exit(0);
  }
}

// Export for programmatic use
export { JarvisCLI };

// CLI entry point
if (import.meta.url === `file://${process.argv[1]}`) {
  const terminal = new JarvisTerminal();
  
  process.on('SIGINT', async () => {
    console.log('\n\n🛑 Shutting down...');
    await terminal.stop();
  });
  
  terminal.start().catch(console.error);
}
