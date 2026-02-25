// JARVIS CLI v2.0 - Integrated Core
// Combines: LLM Engine + Memory Engine + Tool Executor

import readline from 'readline';
import { EventEmitter } from 'events';

// Import core systems
import { LLMTaskEngine } from './core/llm/llm-engine.js';
import { MemoryEngine } from './core/memory/memory-engine.js';
import { ToolExecutor } from './core/tool/tool-executor.js';

class JARVIS extends EventEmitter {
  constructor(config = {}) {
    super();
    
    // Core systems
    this.llm = new LLMTaskEngine(config.llm);
    this.memory = new MemoryEngine(config.memory);
    this.tools = new ToolExecutor(config.tools);
    
    // Config
    this.config = config;
    this.session = {
      id: null,
      messages: [],
      context: {}
    };
    
    this.setupDefaults();
  }

  setupDefaults() {
    // Register default tools with proper handlers
    this.tools.register({
      name: 'web-search',
      description: 'Search the web',
      parameters: {
        type: 'object',
        properties: { query: { type: 'string' } },
        required: ['query']
      },
      handler: async (params) => {
        return { query: params.query, results: [] };
      }
    });

    this.tools.register({
      name: 'memory',
      description: 'Store or search memory',
      parameters: {
        type: 'object',
        properties: {
          action: { type: 'string', enum: ['store', 'search'] },
          content: { type: 'string' },
          query: { type: 'string' }
        },
        required: ['action']
      },
      handler: async (params) => {
        if (params.action === 'store') {
          const id = await this.memory.storeDocument(params.content || '', {
            source: 'tool'
          });
          return { stored: id };
        } else {
          const results = await this.memory.search(params.query || '');
          return { results };
        }
      }
    });

    this.tools.register({
      name: 'exec',
      description: 'Execute shell command',
      parameters: {
        type: 'object',
        properties: { command: { type: 'string' } },
        required: ['command']
      },
      handler: async (params) => {
        const { execSync } = await import('child_process');
        try {
          const output = execSync(params.command, { encoding: 'utf-8', timeout: 30000 });
          return { output, error: null };
        } catch (e) {
          return { output: null, error: e.message };
        }
      }
    });

    this.emit('ready');
  }

  // Start conversation
  async chat(input, options = {}) {
    // Store user message
    this.session.messages.push({ role: 'user', content: input });
    
    // Check for tool calls
    const toolCalls = this.detectToolCalls(input);
    
    if (toolCalls.length > 0) {
      const results = await this.executeTools(toolCalls);
      this.session.messages.push({ 
        role: 'assistant', 
        content: results.join('\n') 
      });
      return { response: results.join('\n'), toolCalls: results };
    }

    // Get LLM response
    try {
      const response = await this.llm.complete(this.session.messages, options);
      const content = response.choices?.[0]?.message?.content || '';
      
      this.session.messages.push({ role: 'assistant', content });
      
      // Store in memory
      await this.memory.storeDocument(input + '\n' + content, {
        source: 'conversation',
        sessionId: this.session.id
      });
      
      return { response: content, provider: response.provider };
    } catch (error) {
      return { response: `Error: ${error.message}`, error: true };
    }
  }

  // Detect tool calls in input
  detectToolCalls(input) {
    const tools = [];
    const toolPattern = /@(\w+)/g;
    let match;
    
    while ((match = toolPattern.exec(input)) !== null) {
      tools.push(match[1]);
    }
    
    return tools;
  }

  // Execute tools
  async executeTools(toolNames) {
    const results = [];
    
    for (const toolName of toolNames) {
      try {
        const result = await this.tools.execute(toolName, {});
        results.push(`[${toolName}] Executed`);
      } catch (e) {
        results.push(`[${toolName}] Error: ${e.message}`);
      }
    }
    
    return results;
  }

  // Get status
  getStatus() {
    return {
      llm: this.llm.getStatus(),
      memory: this.memory.getStats(),
      tools: this.tools.getStats(),
      session: {
        id: this.session.id,
        messages: this.session.messages.length
      }
    };
  }
}

// CLI Mode
async function main() {
  const jarvis = new JARVIS({
    llm: {
      fallbackChain: ['ollama', 'openai']
    }
  });

  console.log('🤖 JARVIS CLI v2.0 Ready');
  console.log('Type "exit" to quit\n');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const ask = () => {
    rl.question('> ', async (input) => {
      if (input.toLowerCase() === 'exit') {
        rl.close();
        return;
      }

      const response = await jarvis.chat(input);
      console.log('\n🤖', response.response, '\n');
      
      ask();
    });
  };

  ask();
}

export default JARVIS;
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
