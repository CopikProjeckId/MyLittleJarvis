// JARVIS Hover Provider
// AI-powered documentation on hover

import * as vscode from 'vscode';
import { JarvisClient } from '../jarvisClient';

interface HoverCache {
  word: string;
  language: string;
  content: string;
  timestamp: number;
}

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export class JarvisHoverProvider implements vscode.HoverProvider {
  private client: JarvisClient;
  private enabled: boolean = true;
  private cache: Map<string, HoverCache> = new Map();

  constructor(client: JarvisClient) {
    this.client = client;
    this.updateSettings();
  }

  updateSettings() {
    const config = vscode.workspace.getConfiguration('jarvis');
    this.enabled = config.get('enableHover', false);
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  private getCacheKey(word: string, language: string): string {
    return `${language}:${word}`;
  }

  private getFromCache(word: string, language: string): string | null {
    const key = this.getCacheKey(word, language);
    const cached = this.cache.get(key);

    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.content;
    }

    return null;
  }

  private setCache(word: string, language: string, content: string): void {
    const key = this.getCacheKey(word, language);
    this.cache.set(key, {
      word,
      language,
      content,
      timestamp: Date.now()
    });

    // Clean old entries
    if (this.cache.size > 100) {
      const now = Date.now();
      for (const [k, v] of this.cache) {
        if (now - v.timestamp > CACHE_TTL_MS) {
          this.cache.delete(k);
        }
      }
    }
  }

  async provideHover(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken
  ): Promise<vscode.Hover | null> {
    if (!this.enabled) {
      return null;
    }

    // Get word at position
    const wordRange = document.getWordRangeAtPosition(position);
    if (!wordRange) {
      return null;
    }

    const word = document.getText(wordRange);

    // Skip common words and short words
    if (word.length < 3 || isCommonWord(word)) {
      return null;
    }

    const language = document.languageId;

    // Check cache first
    const cached = this.getFromCache(word, language);
    if (cached) {
      return new vscode.Hover(new vscode.MarkdownString(cached));
    }

    // Get context around the word
    const lineText = document.lineAt(position).text;
    const startLine = Math.max(0, position.line - 3);
    const endLine = Math.min(document.lineCount - 1, position.line + 3);
    const context = document.getText(new vscode.Range(startLine, 0, endLine, document.lineAt(endLine).text.length));

    try {
      const hoverContent = await this.client.hover(word, context, language);

      if (!hoverContent || token.isCancellationRequested) {
        return null;
      }

      // Cache the result
      this.setCache(word, language, hoverContent);

      const markdown = new vscode.MarkdownString(hoverContent);
      markdown.isTrusted = true;
      markdown.supportHtml = true;

      return new vscode.Hover(markdown, wordRange);
    } catch {
      return null;
    }
  }

  clearCache(): void {
    this.cache.clear();
  }
}

function isCommonWord(word: string): boolean {
  const common = new Set([
    // JavaScript/TypeScript
    'const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while',
    'switch', 'case', 'break', 'continue', 'try', 'catch', 'throw', 'new',
    'this', 'true', 'false', 'null', 'undefined', 'typeof', 'instanceof',
    'import', 'export', 'default', 'from', 'async', 'await', 'class', 'extends',
    // Python
    'def', 'class', 'import', 'from', 'return', 'if', 'elif', 'else', 'for',
    'while', 'try', 'except', 'finally', 'with', 'as', 'pass', 'break', 'continue',
    'True', 'False', 'None', 'and', 'or', 'not', 'in', 'is', 'lambda', 'yield',
    // Common
    'get', 'set', 'add', 'remove', 'update', 'delete', 'create', 'read', 'write',
    'open', 'close', 'start', 'stop', 'run', 'init', 'main', 'test', 'data',
    'value', 'key', 'name', 'type', 'item', 'list', 'array', 'object', 'string',
    'number', 'boolean', 'int', 'float', 'str', 'bool', 'void', 'any'
  ]);

  return common.has(word.toLowerCase());
}

export function registerHoverProvider(
  context: vscode.ExtensionContext,
  client: JarvisClient
): JarvisHoverProvider {
  const provider = new JarvisHoverProvider(client);

  // Register for common languages
  const languages = [
    'javascript', 'typescript', 'javascriptreact', 'typescriptreact',
    'python', 'java', 'go', 'rust', 'c', 'cpp', 'csharp',
    'php', 'ruby', 'swift', 'kotlin'
  ];

  for (const language of languages) {
    context.subscriptions.push(
      vscode.languages.registerHoverProvider({ language }, provider)
    );
  }

  // Watch for config changes
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration('jarvis')) {
        provider.updateSettings();
      }
    })
  );

  return provider;
}
