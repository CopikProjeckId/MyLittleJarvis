// JARVIS Light - Complete 3-Agent System Implementation
// Production-ready with real Ollama integration

import { EventEmitter } from 'events';
import { smartToolCall } from './tool/tool-implementations.js';

// ============================================================
// Ollama Client - Direct API Integration
// ============================================================

class OllamaClient {
  constructor(options = {}) {
    this.baseUrl = options.baseUrl || process.env.OLLAMA_HOST || 'http://localhost:11434';
    this.apiKey = options.apiKey || process.env.OLLAMA_API_KEY;
    this.timeout = options.timeout || 60000;
  }

  getHeaders() {
    const headers = { 'Content-Type': 'application/json' };
    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }
    return headers;
  }

  async chat(model, messages, options = {}) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          model,
          messages,
          stream: false,
          options: {
            temperature: options.temperature || 0.7,
            num_predict: options.maxTokens || 2048
          }
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Ollama error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.message?.content || '';
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Ollama request timeout');
      }
      throw error;
    }
  }

  async *streamChat(model, messages, options = {}) {
    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        model,
        messages,
        stream: true,
        options: {
          temperature: options.temperature || 0.7,
          num_predict: options.maxTokens || 2048
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Ollama error: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const data = JSON.parse(line);
          if (data.message?.content) {
            yield data.message.content;
          }
        } catch (e) {
          // Skip parse errors
        }
      }
    }
  }

  async isAvailable() {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        headers: this.getHeaders(),
        signal: AbortSignal.timeout(3000)
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async listModels() {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        headers: this.getHeaders()
      });
      const data = await response.json();
      return data.models?.map(m => m.name) || [];
    } catch {
      return [];
    }
  }
}

// ============================================================
// Agent 1: Orchestrator (Qwen 2.5 1.5B) - Always Resident
// ============================================================

export class OrchestratorAgent {
  constructor(options = {}) {
    this.name = 'orchestrator';
    this.model = options.model || 'qwen2.5:1.5b';
    this.maxContext = 4096;
    this.patternOnly = options.patternOnly || false;  // Simple mode: skip LLM routing

    // Only create Ollama client if not in patternOnly mode
    if (!this.patternOnly) {
      this.ollama = new OllamaClient(options);
    }

    this.systemPrompt = `You are JARVIS Orchestrator - a routing assistant.
Your job is to analyze user input and route to the appropriate agent.

Agents:
- orchestrator: Simple greetings, thanks, trivial questions (hi, hello, 안녕, thanks, status)
- assistant: Code explanation, file operations, git commands, general questions
- claude: Refactoring, debugging, new features, code review, tests, complex reasoning

Rules:
1. Prefer local (orchestrator/assistant) unless task clearly needs deep reasoning
2. Claude is expensive - only use for complex coding tasks
3. Respond with JSON only: {"agent":"name","reason":"brief reason"}

Examples:
- "안녕" -> {"agent":"orchestrator","reason":"greeting"}
- "explain this code" -> {"agent":"assistant","reason":"code explanation"}
- "refactor this function" -> {"agent":"claude","reason":"refactoring task"}`;
  }

  async analyze(input) {
    // Quick pattern matching first (no LLM needed)
    // Note: \b doesn't work with Korean, so we use (?:\s|$|[!?.,]) for word boundaries
    const patterns = {
      orchestrator: [
        /^(hi|hello|hey|yo|안녕|안녕하세요|반갑|하이)(?:\s|$|[!?.,])/i,
        /^(bye|goodbye|잘가|나중에)(?:\s|$|[!?.,])/i,
        /^(thanks?|thank you|고마워|감사|ㄱㅅ)(?:\s|$|[!?.,])/i,
        /^(ping|status|상태|ok\?)(?:\s|$|[!?.,])/i,
        /(what\s+time|시간|날짜|몇\s*시)/i,
        /(누구|누군데|뭐야|who\s+are\s+you|what\s+are\s+you|자기\s*소개)/i,
        /(종료|끄면|닫으면|백그라운드|계속\s*돌아|어떻게\s*작동|how\s+do\s+you\s+work|how\s+do\s+you\s+run)/i,
      ],
      claude: [
        /(refactor|리팩토링|리팩터)/i,
        /(debug|fix\s+bug|버그|수정해|고쳐)/i,
        /(implement|구현|만들어\s*줘|작성해)/i,
        /(review|리뷰|검토|코드\s*리뷰)/i,
        /(test|테스트|유닛\s*테스트)/i,
        /(write\s+code|코드\s*작성|코딩)/i,
        /(optimize|최적화)/i,
        /(architecture|아키텍처|설계)/i,
      ]
    };

    for (const [agent, regexes] of Object.entries(patterns)) {
      if (regexes.some(r => r.test(input))) {
        // In simple mode, route 'claude' patterns to 'assistant' instead
        const targetAgent = (this.patternOnly && agent === 'claude') ? 'assistant' : agent;
        return { agent: targetAgent, reason: `pattern: ${agent}`, patternMatch: true };
      }
    }

    // Simple mode (patternOnly): Skip LLM routing, go directly to assistant
    if (this.patternOnly) {
      return { agent: 'assistant', reason: 'simple mode: direct routing', patternMatch: false };
    }

    // For ambiguous cases, use LLM if available
    try {
      const available = await this.ollama.isAvailable();
      if (available) {
        const response = await this.ollama.chat(this.model, [
          { role: 'system', content: this.systemPrompt },
          { role: 'user', content: input }
        ], { temperature: 0.1, maxTokens: 100 });

        // Parse JSON response
        const jsonMatch = response.match(/\{[^}]+\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          return { agent: parsed.agent || 'assistant', reason: parsed.reason || 'llm routing' };
        }
      }
    } catch (error) {
      console.log(`⚠️ Orchestrator LLM fallback: ${error.message}`);
    }

    // Default to assistant for general queries
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
    this.fallbackModel = options.fallbackModel || 'qwen2.5:1.5b';
    this.maxContext = 4096;
    this.isLoaded = false;
    this.ollama = new OllamaClient(options);
    this.systemPrompt = options.systemPrompt || `You are MyLittle JARVIS, a personal AI assistant made by NINEBIX Inc.

## Identity
- You are JARVIS by NINEBIX. NOT made by Google, OpenAI, Meta, Anthropic, or any other company.
- Always identify yourself as "MyLittle JARVIS" or "JARVIS".
- NEVER claim to be ChatGPT, Gemini, Copilot, or any other AI product.

## How You Run
- You are installed on the user's machine via "npm install -g mylittle-jarvis".
- You run as a local Node.js process. You are NOT a cloud service.
- You stay running in the background even when the user closes the chat window.
- You run a Gateway server (default port 18789) that serves REST API and WebSocket.
- You connect to Telegram, Discord, Slack as persistent bots that stay online 24/7.
- Closing the Telegram chat does NOT stop you. You keep running until the process is killed.
- Your config is stored at ~/.jarvis/jarvis.json on the user's machine.

## How You Think (3-Agent System)
- Orchestrator (small model): Routes user input to the right agent.
- Assistant (medium model, you): Handles general conversation and tool calls.
- Claude (cloud API, optional): Handles complex coding tasks. Only used if configured.
- The user chooses which models to use. Default: Ollama local models.

## Your Capabilities
- 88 tools: file read/write/edit, git, bash, browser automation, media processing, search, utilities.
- Long-term memory via NMT (Neuron Merkle Tree) - remembers past conversations locally.
- Multi-channel: CLI, Telegram, Discord, Slack, PWA, VSCode Extension.
- Local-first: Works offline with Ollama. Cloud (Claude API) is optional.

## Rules
- Use Korean when the user writes in Korean.
- Be concise but helpful.
- Format code with markdown code blocks.
- When asked "who are you" or "what are you", explain you are MyLittle JARVIS by NINEBIX running locally.
- When asked about your runtime, explain you are a local Node.js process, not a cloud service.`;
  }

  async load() {
    if (!this.isLoaded) {
      const available = await this.ollama.isAvailable();
      if (available) {
        console.log(`📥 Loading ${this.model}...`);
        this.isLoaded = true;
      } else {
        throw new Error('Ollama server not available');
      }
    }
  }

  async unload() {
    this.isLoaded = false;
    console.log(`📤 Unloaded ${this.model}`);
  }

  async respond(input, context = []) {
    await this.load();

    const messages = [
      { role: 'system', content: this.systemPrompt },
      ...context.slice(-10).map(m => ({
        role: m.role,
        content: m.content
      })),
      { role: 'user', content: input }
    ];

    try {
      // Try primary model first
      const response = await this.ollama.chat(this.model, messages, {
        temperature: 0.7,
        maxTokens: 2048
      });

      return {
        agent: 'assistant',
        model: this.model,
        response
      };
    } catch (error) {
      console.log(`⚠️ Primary model failed, trying fallback: ${error.message}`);

      // Try fallback model
      try {
        const response = await this.ollama.chat(this.fallbackModel, messages, {
          temperature: 0.7,
          maxTokens: 2048
        });

        return {
          agent: 'assistant',
          model: this.fallbackModel,
          response,
          fallback: true
        };
      } catch (fallbackError) {
        return {
          agent: 'assistant',
          error: `LLM unavailable: ${fallbackError.message}`,
          response: '죄송합니다. 현재 AI 모델에 연결할 수 없습니다. Ollama 서버가 실행 중인지 확인해주세요.'
        };
      }
    }
  }

  async *streamRespond(input, context = []) {
    await this.load();

    const messages = [
      { role: 'system', content: this.systemPrompt },
      ...context.slice(-10),
      { role: 'user', content: input }
    ];

    for await (const chunk of this.ollama.streamChat(this.model, messages)) {
      yield chunk;
    }
  }
}

// ============================================================
// Agent 3: Claude Bridge - External API (Anthropic)
// ============================================================

export class ClaudeBridgeAgent {
  constructor(options = {}) {
    this.name = 'claude';
    this.model = options.model || 'claude-sonnet-4-6';
    this.apiKey = options.apiKey || process.env.ANTHROPIC_API_KEY;
    this.maxTokens = 4096;
    this.baseUrl = 'https://api.anthropic.com/v1';
    this.systemPrompt = options.systemPrompt || `You are MyLittle JARVIS (Claude Agent), a personal AI assistant made by NINEBIX Inc.
You are an expert software engineer. You excel at: refactoring, debugging, code review, implementing features, and writing tests.
You are the cloud agent in a 3-Agent system (Orchestrator → Assistant → Claude).
The user installed you via "npm install -g mylittle-jarvis". You run as a local Node.js process on their machine.
You have 88 tools and long-term memory (NMT). You stay running in the background as a persistent service.
Always identify yourself as "JARVIS" by NINEBIX. NEVER claim to be ChatGPT or any other product.
Be thorough and provide working code. Use Korean if the user writes in Korean.`;
  }

  async respond(input, context = []) {
    if (!this.apiKey) {
      console.log('⚠️ Claude API key not configured, falling back to assistant');
      return {
        agent: 'claude',
        error: 'API key not configured',
        fallback: true,
        response: 'Claude API 키가 설정되지 않았습니다. ANTHROPIC_API_KEY 환경변수를 설정해주세요.'
      };
    }

    const messages = context
      .filter(m => m.role !== 'system')
      .slice(-10)
      .concat([{ role: 'user', content: input }]);

    try {
      const response = await fetch(`${this.baseUrl}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: this.model,
          system: this.systemPrompt,
          messages,
          max_tokens: this.maxTokens
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || `API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.content?.[0]?.text || '';

      return {
        agent: 'claude',
        model: this.model,
        response: content,
        usage: data.usage
      };
    } catch (error) {
      console.error('Claude API error:', error.message);
      return {
        agent: 'claude',
        error: error.message,
        response: `Claude 요청 실패: ${error.message}`
      };
    }
  }

  async *streamRespond(input, context = []) {
    if (!this.apiKey) {
      yield 'Claude API 키가 설정되지 않았습니다.';
      return;
    }

    const messages = context
      .filter(m => m.role !== 'system')
      .slice(-10)
      .concat([{ role: 'user', content: input }]);

    const response = await fetch(`${this.baseUrl}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: this.model,
        system: this.systemPrompt,
        messages,
        max_tokens: this.maxTokens,
        stream: true
      })
    });

    if (!response.ok) {
      yield `API error: ${response.status}`;
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.startsWith('data:')) continue;
        const data = line.slice(5).trim();
        if (data === '[DONE]') return;

        try {
          const event = JSON.parse(data);
          if (event.type === 'content_block_delta' && event.delta?.text) {
            yield event.delta.text;
          }
        } catch (e) {
          // Skip parse errors
        }
      }
    }
  }
}

// ============================================================
// JARVIS 3-Agent Orchestrator
// ============================================================

export class Jarvis3Agent extends EventEmitter {
  constructor(options = {}) {
    super();

    // Mode: 'simple' (single model) or '3agent' (full routing)
    this.mode = options.mode || '3agent';

    // Initialize agents based on mode
    if (this.mode === 'simple') {
      // Simple mode: Only assistant, orchestrator does pattern-only routing
      this.orchestrator = new OrchestratorAgent({
        ...options.orchestrator,
        patternOnly: true  // Skip LLM routing
      });
      this.assistant = new FastAssistantAgent(options.assistant);
      this.claude = null;  // Not used in simple mode
    } else {
      // 3-Agent mode: Full routing
      this.orchestrator = new OrchestratorAgent(options.orchestrator);
      this.assistant = new FastAssistantAgent(options.assistant);
      this.claude = new ClaudeBridgeAgent(options.claude);
    }

    this.context = [];
    this.maxContextSize = options.maxContextSize || 20;
    this.stats = {
      totalRequests: 0,
      routedToOrchestrator: 0,
      routedToAssistant: 0,
      routedToClaude: 0
    };
  }

  async process(input) {
    this.stats.totalRequests++;
    const startTime = Date.now();

    // 0. Smart Tool Detection (weather, search intent, etc.)
    try {
      const toolResult = await smartToolCall(input);
      if (toolResult) {
        const duration = Date.now() - startTime;
        console.log(`🔧 Smart tool: ${toolResult.tool || 'direct'}`);

        // Format tool result as response
        let responseText;
        if (toolResult.response) {
          responseText = toolResult.response;
        } else if (toolResult.result) {
          const r = toolResult.result;
          if (r.error) {
            responseText = `오류: ${r.error}`;
          } else if (toolResult.tool === 'weather' && r.temperature) {
            responseText = `🌡️ ${r.location} 날씨:\n` +
              `  온도: ${r.temperature.c}°C (체감 ${r.feelsLike?.c || r.temperature.c}°C)\n` +
              `  상태: ${r.condition}\n` +
              `  습도: ${r.humidity}\n` +
              `  바람: ${r.wind?.speed || 'N/A'} ${r.wind?.direction || ''}`;
          } else if (toolResult.tool === 'web-search' && r.results) {
            responseText = `🔍 검색 결과 (${r.source}):\n` +
              r.results.slice(0, 3).map((item, i) =>
                `${i + 1}. ${item.title}\n   ${item.snippet?.substring(0, 100)}...`
              ).join('\n\n');
          } else if (toolResult.tool === 'shorten' && r.shortened) {
            responseText = `🔗 단축 URL: ${r.shortened}`;
          } else {
            responseText = JSON.stringify(r, null, 2);
          }
        }

        this.context.push({ role: 'user', content: input });
        this.context.push({ role: 'assistant', content: responseText });

        return {
          agent: 'tool:' + (toolResult.tool || 'direct'),
          response: responseText,
          toolResult: toolResult.result,
          duration
        };
      }
    } catch (e) {
      console.log(`⚠️ Smart tool error: ${e.message}`);
      // Continue to normal routing
    }

    // 1. Route via Orchestrator
    const { agent, reason, patternMatch } = await this.orchestrator.route(input);

    console.log(`🎯 Routed to: ${agent} (${reason})`);
    this.emit('route', { agent, reason, input, patternMatch });

    // Update stats
    this.stats[`routedTo${agent.charAt(0).toUpperCase() + agent.slice(1)}`]++;

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
        // Simple mode: claude is null, fall back to assistant
        if (!this.claude) {
          response = await this.assistant.respond(input, this.context);
          response.originalAgent = 'claude';
          response.fallbackReason = 'Simple mode: using assistant';
        } else {
          response = await this.claude.respond(input, this.context);
          // Fallback to assistant if Claude is not available
          if (response.fallback || response.error) {
            console.log('⚠️ Claude unavailable, falling back to assistant');
            response = await this.assistant.respond(input, this.context);
            response.originalAgent = 'claude';
            response.fallbackReason = 'Claude API not configured';
          }
        }
        break;
      default:
        response = await this.assistant.respond(input, this.context);
    }

    const duration = Date.now() - startTime;
    response.duration = duration;

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

  async *streamProcess(input) {
    const { agent, reason } = await this.orchestrator.route(input);

    console.log(`🎯 Streaming via: ${agent} (${reason})`);
    this.emit('route', { agent, reason, input });

    if (agent === 'orchestrator') {
      yield this.simpleResponse(input);
      return;
    }

    const handler = agent === 'claude' ? this.claude : this.assistant;

    if (handler.streamRespond) {
      for await (const chunk of handler.streamRespond(input, this.context)) {
        yield chunk;
      }
    } else {
      const response = await handler.respond(input, this.context);
      yield response.response;
    }
  }

  simpleResponse(input) {
    const lower = input.toLowerCase();

    if (/^(hi|hello|hey|안녕|하이)/.test(lower)) {
      return '안녕하세요! MyLittle JARVIS입니다. 무엇을 도와드릴까요?';
    }
    if (/^(bye|goodbye|잘가)/.test(lower)) {
      return '안녕히 가세요! 다음에 또 봐요!';
    }
    if (/^(thanks?|고마워|감사)/.test(lower)) {
      return '천만에요! 도움이 되어 기뻐요.';
    }
    if (/status|상태|ping/.test(lower)) {
      return `JARVIS 상태: 정상 작동 중입니다.\n총 요청: ${this.stats.totalRequests}\n• Orchestrator: ${this.stats.routedToOrchestrator}\n• Assistant: ${this.stats.routedToAssistant}\n• Claude: ${this.stats.routedToClaude}`;
    }
    if (/시간|time/.test(lower)) {
      return `현재 시간: ${new Date().toLocaleString('ko-KR')}`;
    }
    if (/누구|누군데|뭐야|who\s+are|what\s+are|자기\s*소개/.test(lower)) {
      return 'MyLittle JARVIS입니다. NINEBIX Inc.에서 만든 개인 AI 어시스턴트예요.\nnpm install -g mylittle-jarvis로 설치하고, 사용자의 컴퓨터에서 로컬로 실행됩니다.\n88개 도구와 3-Agent 시스템, NMT 장기 기억을 갖추고 있어요.';
    }
    if (/종료|끄면|닫으면|백그라운드|계속\s*돌아|어떻게\s*작동|how\s+do\s+you\s+(work|run)/.test(lower)) {
      return 'JARVIS는 사용자의 컴퓨터에서 Node.js 프로세스로 실행됩니다.\n채팅 창을 닫아도 백그라운드에서 계속 돌아가요.\nGateway 서버(포트 18789)가 항상 떠있고, Telegram/Discord/Slack 봇도 24시간 연결됩니다.\n완전히 종료하려면 프로세스를 직접 종료해야 합니다.';
    }

    return '메시지를 받았습니다. 더 자세한 내용이 필요하시면 말씀해주세요.';
  }

  clearContext() {
    this.context = [];
    this.emit('clear');
    console.log('🗑️ Context cleared');
  }

  getStatus() {
    return {
      mode: this.mode,
      orchestrator: this.mode === 'simple' ? 'pattern-only' : 'loaded',
      assistant: this.assistant.isLoaded ? 'loaded' : 'standby',
      claude: this.claude ? (this.claude.apiKey ? 'configured' : 'unconfigured') : 'disabled',
      contextSize: this.context.length,
      stats: this.stats
    };
  }

  async healthCheck() {
    const ollamaAvailable = await this.assistant.ollama.isAvailable();
    const models = ollamaAvailable ? await this.assistant.ollama.listModels() : [];

    return {
      mode: this.mode,
      ollama: ollamaAvailable ? 'available' : 'unavailable',
      models,
      claude: this.claude ? (this.claude.apiKey ? 'configured' : 'not configured') : 'disabled (simple mode)',
      healthy: ollamaAvailable
    };
  }
}

export default Jarvis3Agent;
