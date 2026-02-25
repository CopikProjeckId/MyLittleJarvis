// JARVIS Light - Complete 3-Agent System Implementation

import { EventEmitter } from 'events';

// ============================================================
// Agent 1: Orchestrator (Qwen 2.5 1.5B) - Always Resident
// ============================================================

export class OrchestratorAgent {
  constructor(options = {}) {
    this.name = 'orchestrator';
    this.model = options.model || 'qwen2.5:1.5b';
    this.maxContext = 4096;
    this.systemPrompt = `You are JARVIS Orchestrator - a routing assistant.
Your job is to analyze user input and route to the appropriate agent.

Agents:
- orchestrator: Simple greetings, thanks, trivial questions
- assistant: Code explanation, file operations, git commands
- claude: Refactoring, debugging, new features, code review, tests

Rules:
1. Prefer local unless task clearly needs deep reasoning
2. Claude is expensive - only use for complex tasks
3. Respond with JSON only: {"agent":"name","reason":"..."}`;    
  }

  async analyze(input) {
    // Quick pattern matching first
    const patterns = {
      orchestrator: [
        /^(hi|hello|hey|yo|안녕|안녕하세요|반갑)/i,
        /^(bye|goodbye|잘가)/i,
        /^(thanks?|고마워|감사)/i,
        /^(ping|status|상태)\b/i,
        /\b(what\s+time|시간|날짜)\b/i,
      ],
      claude: [
        /\b(refactor|리팩토링)\b/i,
        /\b(debug|fix|버그|수정)\b/i,
        /\b(implement|구현|만들어)\b/i,
        /\b(review|리뷰|검토)\b/i,
        /\b(test|테스트)\b/i,
        /\b(write\s+code|코드\s*작성)\b/i,
        /\b(multi-?file|여러\s*파일)\b/i,
      ]
    };

    for (const [agent, regexes] of Object.entries(patterns)) {
      if (regexes.some(r => r.test(input))) {
        return { agent, reason: `pattern match: ${agent}` };
      }
    }

    // Default to assistant
    return { agent: 'assistant', reason: 'default routing' };
  }

  async route(input) {
    return await this.analyze(input);
  }
}

// ============================================================
// Agent 2: Fast Assistant (Qwen/Phi-3) - On Demand
// ============================================================

export class FastAssistantAgent {
  constructor(options = {}) {
    this.name = 'assistant';
    this.model = options.model || 'phi3:mini';
    this.maxContext = 2048;
    this.isLoaded = false;
  }

  async load() {
    if (!this.isLoaded) {
      console.log(`📥 Loading ${this.model}...`);
      // In real implementation, load Ollama model
      this.isLoaded = true;
    }
  }

  async unload() {
    this.isLoaded = false;
    console.log(`📤 Unloaded ${this.model}`);
  }

  async respond(input, context = []) {
    await this.load();
    
    // Build prompt
    const messages = [
      { role: 'system', content: 'You are JARVIS Fast Assistant. Be concise and helpful.' },
      ...context.slice(-5),
      { role: 'user', content: input }
    ];

    // In real implementation, call Ollama API
    return {
      agent: 'assistant',
      model: this.model,
      response: `[Mock] Processing: ${input.substring(0, 50)}...`
    };
  }
}

// ============================================================
// Agent 3: Claude Bridge - External API
// ============================================================

export class ClaudeBridgeAgent {
  constructor(options = {}) {
    this.name = 'claude';
    this.model = options.model || 'claude-sonnet-4-6';
    this.apiKey = options.apiKey || process.env.ANTHROPIC_API_KEY;
    this.maxTokens = 4096;
  }

  async respond(input, context = []) {
    if (!this.apiKey) {
      return {
        agent: 'claude',
        error: 'API key not configured',
        fallback: true
      };
    }

    const messages = [
      ...context.slice(-10),
      { role: 'user', content: input }
    ];

    // In real implementation, call Anthropic API
    // const response = await fetch('https://api.anthropic.com/v1/messages', {
    //   method: 'POST',
    //   headers: {
    //     'x-api-key': this.apiKey,
    //     'anthropic-version': '2023-06-01',
    //     'Content-Type': 'application/json'
    //   },
    //   body: JSON.stringify({
    //     model: this.model,
    //     messages,
    //     max_tokens: this.maxTokens
    //   })
    // });

    return {
      agent: 'claude',
      model: this.model,
      response: `[Mock Claude] Complex processing: ${input.substring(0, 50)}...`
    };
  }
}

// ============================================================
// JARVIS 3-Agent Orchestrator
// ============================================================

export class Jarvis3Agent extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.orchestrator = new OrchestratorAgent(options.orchestrator);
    this.assistant = new FastAssistantAgent(options.assistant);
    this.claude = new ClaudeBridgeAgent(options.claude);
    
    this.context = [];
    this.maxContextSize = 20;
  }

  async process(input) {
    // 1. Route via Orchestrator
    const { agent, reason } = await this.orchestrator.route(input);
    
    console.log(`🎯 Routed to: ${agent} (${reason})`);
    this.emit('route', { agent, reason, input });

    // 2. Execute via appropriate agent
    let response;
    switch (agent) {
      case 'orchestrator':
        response = { agent: 'orchestrator', response: this.simpleResponse(input) };
        break;
      case 'assistant':
        response = await this.assistant.respond(input, this.context);
        break;
      case 'claude':
        response = await this.claude.respond(input, this.context);
        break;
    }

    // 3. Add to context
    this.context.push({ role: 'user', content: input });
    this.context.push({ role: 'assistant', content: response.response });
    
    // 4. Evict old context
    if (this.context.length > this.maxContextSize) {
      this.context = this.context.slice(-this.maxContextSize);
    }

    this.emit('response', response);
    return response;
  }

  simpleResponse(input) {
    const lower = input.toLowerCase();
    
    if (/^(hi|hello|hey|안녕)/.test(lower)) {
      return '안녕하세요! JARVIS입니다. 무엇을 도와드릴까요?';
    }
    if (/^(bye|goodbye|잘가)/.test(lower)) {
      return '안녕히 가세요! 다음에 봐요!';
    }
    if (/^(thanks?|고마워)/.test(lower)) {
      return '천만에요! 도움이 되되어 기뻐요.';
    }
    if (/status|상태/.test(lower)) {
      return 'JARVIS 상태: 정상 작동 중입니다.';
    }
    
    return '메시지를 받았습니다. 더 자세한 내용은 어시스턴트가 처리할게요.';
  }

  clearContext() {
    this.context = [];
    this.emit('clear');
  }

  getStatus() {
    return {
      orchestrator: 'loaded',
      assistant: this.assistant.isLoaded ? 'loaded' : 'unloaded',
      claude: this.claude.apiKey ? 'configured' : 'unconfigured',
      contextSize: this.context.length
    };
  }
}

export default Jarvis3Agent;
