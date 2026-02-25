// JARVIS LLM Task Engine
// Core: OpenClaw's llm-task equivalent
// Features: Retry, Fallback, Streaming, Token Management

import { EventEmitter } from 'events';
import { spawn } from 'child_process';
import https from 'https';
import http from 'http';

// ============================================================
// LLM Provider Base
// ============================================================

export class LLMProvider {
  constructor(config = {}) {
    this.name = 'base';
    this.config = config;
  }

  async complete(messages, options = {}) {
    throw new Error('Not implemented');
  }

  async *streamComplete(messages, options = {}) {
    throw new Error('Not implemented');
  }
}

// ============================================================
// OpenAI Provider
// ============================================================

export class OpenAIProvider extends LLMProvider {
  constructor(config = {}) {
    super(config);
    this.name = 'openai';
    this.apiKey = config.apiKey || process.env.OPENAI_API_KEY;
    this.baseUrl = config.baseUrl || 'https://api.openai.com/v1';
    this.model = config.model || 'gpt-4';
    this.maxRetries = config.maxRetries || 3;
  }

  async complete(messages, options = {}) {
    const { temperature = 0.7, maxTokens = 4096, stream = false } = options;

    const body = JSON.stringify({
      model: this.model,
      messages,
      temperature,
      max_tokens: maxTokens,
      stream: stream || false
    });

    return await this.request('/chat/completions', body, stream);
  }

  async *streamComplete(messages, options = {}) {
    const { temperature = 0.7, maxTokens = 4096 } = options;
    const body = JSON.stringify({
      model: this.model,
      messages,
      temperature,
      max_tokens: maxTokens,
      stream: true
    });

    const response = await this.request('/chat/completions', body, true);
    
    for await (const chunk of response) {
      yield chunk;
    }
  }

  request(endpoint, body, stream = false) {
    return new Promise((resolve, reject) => {
      const url = new URL(this.baseUrl + endpoint);
      const protocol = url.protocol === 'https:' ? https : http;

      const options = {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        }
      };

      const req = protocol.request(options, (res) => {
        if (stream) {
          resolve(this.handleStream(res));
        } else {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            try {
              const parsed = JSON.parse(data);
              resolve(parsed);
            } catch (e) {
              reject(e);
            }
          });
        }
      });

      req.on('error', reject);
      req.write(body);
      req.end();
    });
  }

  async *handleStream(res) {
    let buffer = '';
    
    for await (const chunk of res) {
      buffer += chunk.toString();
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data:')) continue;
        
        const data = trimmed.slice(5).trim();
        if (data === '[DONE]') return;

        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) yield content;
        } catch (e) {
          // Skip parse errors
        }
      }
    }
  }
}

// ============================================================
// Ollama Cloud Provider
// ============================================================

export class OllamaProvider extends LLMProvider {
  constructor(config = {}) {
    super(config);
    this.name = 'ollama';
    this.apiKey = config.apiKey || process.env.OLLAMA_API_KEY;
    this.baseUrl = config.baseUrl || 'https://cloud.ollama.ai';
    this.model = config.model || 'qwen3.5';
  }

  async complete(messages, options = {}) {
    const { temperature = 0.7, maxTokens = 4096 } = options;

    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        temperature,
        max_tokens: maxTokens
      })
    });

    const data = await response.json();
    return {
      choices: [{ message: { content: data.message?.content || '' } }]
    };
  }

  async *streamComplete(messages, options = {}) {
    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        stream: true
      })
    });

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
          const content = data.message?.content;
          if (content) yield content;
        } catch (e) {}
      }
    }
  }
}

// ============================================================
// Anthropic (Claude) Provider
// ============================================================

export class AnthropicProvider extends LLMProvider {
  constructor(config = {}) {
    super(config);
    this.name = 'anthropic';
    this.apiKey = config.apiKey || process.env.ANTHROPIC_API_KEY;
    this.baseUrl = 'https://api.anthropic.com/v1';
    this.model = config.model || 'claude-sonnet-4-6';
  }

  async complete(messages, options = {}) {
    const { temperature = 0.7, maxTokens = 4096 } = options;

    // Convert messages to Anthropic format
    const systemMessage = messages.find(m => m.role === 'system');
    const anthropicMessages = messages
      .filter(m => m.role !== 'system')
      .map(m => ({ role: m.role, content: m.content }));

    const body = JSON.stringify({
      model: this.model,
      messages: anthropicMessages,
      system: systemMessage?.content,
      temperature,
      max_tokens: maxTokens
    });

    const response = await fetch(`${this.baseUrl}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01'
      },
      body
    });

    const data = await response.json();
    return {
      choices: [{ message: { content: data.content?.[0]?.text || '' } }]
    };
  }
}

// ============================================================
// LLM Task Engine (Core)
// ============================================================

export class LLMTaskEngine extends EventEmitter {
  constructor(options = {}) {
    super();
    this.providers = new Map();
    this.defaultProvider = options.defaultProvider || 'ollama';
    this.fallbackChain = options.fallbackChain || ['ollama', 'openai', 'anthropic'];
    this.maxRetries = options.maxRetries || 3;
    this.timeout = options.timeout || 120000;
    this.tokenLimit = options.tokenLimit || 128000;
    
    this.initializeProviders(options);
  }

  initializeProviders(options) {
    // Register default providers
    if (options.openai?.apiKey) {
      this.providers.set('openai', new OpenAIProvider(options.openai));
    }
    if (options.ollama?.apiKey) {
      this.providers.set('ollama', new OllamaProvider(options.ollama));
    }
    if (options.anthropic?.apiKey) {
      this.providers.set('anthropic', new AnthropicProvider(options.anthropic));
    }
    
    // Default to ollama if no providers
    if (this.providers.size === 0) {
      this.providers.set('ollama', new OllamaProvider({}));
    }
  }

  // Add custom provider
  registerProvider(name, provider) {
    this.providers.set(name, provider);
  }

  // Complete with fallback chain
  async complete(messages, options = {}) {
    const providers = options.preferredProvider 
      ? [options.preferredProvider, ...this.fallbackChain.filter(p => p !== options.preferredProvider)]
      : this.fallbackChain;

    let lastError = null;

    for (const providerName of providers) {
      const provider = this.providers.get(providerName);
      if (!provider) continue;

      for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
        try {
          this.emit('call', { provider: providerName, attempt, model: provider.model });
          
          const result = await this.executeWithTimeout(
            provider.complete(messages, options),
            options.timeout || this.timeout
          );

          this.emit('success', { provider: providerName, attempt });
          return {
            ...result,
            provider: providerName,
            model: provider.model
          };
        } catch (error) {
          lastError = error;
          this.emit('error', { provider: providerName, attempt, error: error.message });
          
          // Don't retry on auth errors
          if (error.message?.includes('401') || error.message?.includes('auth')) {
            break;
          }
        }
      }
    }

    throw new Error(`All providers failed. Last error: ${lastError?.message}`);
  }

  // Stream with fallback
  async *streamComplete(messages, options = {}) {
    const providers = options.preferredProvider 
      ? [options.preferredProvider, ...this.fallbackChain.filter(p => p !== options.preferredProvider)]
      : this.fallbackChain;

    let lastError = null;
    let usedProvider = null;

    for (const providerName of providers) {
      const provider = this.providers.get(providerName);
      if (!provider) continue;

      try {
        this.emit('stream-start', { provider: providerName });
        usedProvider = providerName;

        for await (const chunk of await provider.streamComplete(messages, options)) {
          yield { chunk, provider: providerName };
        }

        this.emit('stream-end', { provider: providerName });
        return;
      } catch (error) {
        lastError = error;
        this.emit('stream-error', { provider: providerName, error: error.message });
      }
    }

    throw new Error(`All streaming providers failed. Last error: ${lastError?.message}`);
  }

  // Execute with timeout
  executeWithTimeout(promise, timeoutMs) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Timeout after ${timeoutMs}ms`));
      }, timeoutMs);

      promise
        .then(result => {
          clearTimeout(timer);
          resolve(result);
        })
        .catch(err => {
          clearTimeout(timer);
          reject(err);
        });
    });
  }

  // Count tokens (approximate)
  countTokens(text) {
    // Rough estimate: 1 token ≈ 4 characters for English, 2 for Korean
    const englishChars = (text.match(/[a-zA-Z]/g) || []).length;
    const koreanChars = (text.match(/[가-힣]/g) || []).length;
    const otherChars = text.length - englishChars - koreanChars;
    
    return Math.ceil(englishChars / 4 + koreanChars / 2 + otherChars / 4);
  }

  // Truncate messages to fit token limit
  truncateMessages(messages, maxTokens) {
    let totalTokens = 0;
    const result = [];
    
    // Start from most recent
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i];
      const tokens = this.countTokens(msg.content);
      
      if (totalTokens + tokens > maxTokens) {
        break;
      }
      
      result.unshift(msg);
      totalTokens += tokens;
    }
    
    return result;
  }

  // Get available providers
  getProviders() {
    return Array.from(this.providers.keys());
  }

  // Get status
  getStatus() {
    return {
      providers: this.getProviders(),
      defaultProvider: this.defaultProvider,
      fallbackChain: this.fallbackChain,
      maxRetries: this.maxRetries,
      timeout: this.timeout
    };
  }
}

export default LLMTaskEngine;
