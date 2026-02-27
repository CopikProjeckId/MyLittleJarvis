// JARVIS Gateway Client
// Handles communication with JARVIS Gateway

import * as vscode from 'vscode';

export interface JarvisConfig {
  gatewayUrl: string;
  token?: string;
}

export interface ChatResponse {
  response: string;
  agent?: string;
  duration?: number;
}

export interface CompletionItem {
  label: string;
  insertText: string;
  kind: string;
}

export class JarvisClient {
  private config: JarvisConfig;
  private outputChannel: vscode.OutputChannel;

  constructor(config: JarvisConfig) {
    this.config = config;
    this.outputChannel = vscode.window.createOutputChannel('JARVIS');
  }

  updateConfig(config: Partial<JarvisConfig>) {
    this.config = { ...this.config, ...config };
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    if (this.config.token) {
      headers['Authorization'] = `Bearer ${this.config.token}`;
    }

    return headers;
  }

  private log(message: string) {
    this.outputChannel.appendLine(`[${new Date().toISOString()}] ${message}`);
  }

  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.gatewayUrl}/health`);
      return response.ok;
    } catch {
      return false;
    }
  }

  async chat(message: string): Promise<ChatResponse> {
    this.log(`Chat: ${message.substring(0, 100)}...`);

    const response = await fetch(`${this.config.gatewayUrl}/api/chat`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ message })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Chat failed: ${error}`);
    }

    const result = await response.json() as ChatResponse;
    this.log(`Response: ${result.response?.substring(0, 100)}...`);
    return result;
  }

  async explain(code: string, language?: string): Promise<string> {
    this.log(`Explain: ${language || 'code'}`);

    const response = await fetch(`${this.config.gatewayUrl}/api/ide/explain`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ code, language })
    });

    if (!response.ok) {
      throw new Error('Explain failed');
    }

    const result = await response.json() as { explanation: string };
    return result.explanation;
  }

  async fix(code: string, diagnostics: any[], language?: string): Promise<string> {
    this.log(`Fix: ${diagnostics.length} errors`);

    const response = await fetch(`${this.config.gatewayUrl}/api/ide/fix`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ code, diagnostics, language })
    });

    if (!response.ok) {
      throw new Error('Fix failed');
    }

    const result = await response.json() as { fixedCode: string };
    return result.fixedCode;
  }

  async refactor(code: string, type: string, target?: string, language?: string): Promise<string> {
    this.log(`Refactor: ${type}`);

    const response = await fetch(`${this.config.gatewayUrl}/api/ide/refactor`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ code, type, target, language })
    });

    if (!response.ok) {
      throw new Error('Refactor failed');
    }

    const result = await response.json() as { refactoredCode: string };
    return result.refactoredCode;
  }

  async complete(prefix: string, context?: string): Promise<CompletionItem[]> {
    this.log(`Complete: ${prefix.substring(0, 50)}...`);

    const response = await fetch(`${this.config.gatewayUrl}/api/ide/completion`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ prefix, context })
    });

    if (!response.ok) {
      return [];
    }

    const result = await response.json() as { completions?: CompletionItem[] };
    return result.completions || [];
  }

  async hover(word: string, context?: string, language?: string): Promise<string> {
    const response = await fetch(`${this.config.gatewayUrl}/api/ide/hover`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ word, context, language })
    });

    if (!response.ok) {
      return '';
    }

    const result = await response.json() as { markdown?: string };
    return result.markdown || '';
  }

  async executeTool(tool: string, params: any): Promise<any> {
    this.log(`Tool: ${tool}`);

    const response = await fetch(`${this.config.gatewayUrl}/api/tools/execute`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ tool, params })
    });

    if (!response.ok) {
      throw new Error('Tool execution failed');
    }

    return await response.json();
  }

  dispose() {
    this.outputChannel.dispose();
  }
}
