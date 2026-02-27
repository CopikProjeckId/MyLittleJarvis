// JARVIS Inline Completion Provider
// AI-powered code completions in the editor

import * as vscode from 'vscode';
import { JarvisClient } from '../jarvisClient';

export class JarvisCompletionProvider implements vscode.InlineCompletionItemProvider {
  private client: JarvisClient;
  private debounceTimer: NodeJS.Timeout | undefined;
  private lastRequest: AbortController | undefined;
  private enabled: boolean = true;
  private debounceMs: number = 500;

  constructor(client: JarvisClient) {
    this.client = client;
    this.updateSettings();
  }

  updateSettings() {
    const config = vscode.workspace.getConfiguration('jarvis');
    this.enabled = config.get('autoComplete', false);
    this.debounceMs = config.get('completionDelay', 500);
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  async provideInlineCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
    context: vscode.InlineCompletionContext,
    token: vscode.CancellationToken
  ): Promise<vscode.InlineCompletionItem[] | null> {
    if (!this.enabled) {
      return null;
    }

    // Cancel previous request
    if (this.lastRequest) {
      this.lastRequest.abort();
    }

    // Get context
    const linePrefix = document.lineAt(position).text.substring(0, position.character);

    // Skip if line is empty or just whitespace
    if (!linePrefix.trim()) {
      return null;
    }

    // Skip if in comment (simple heuristic)
    if (linePrefix.trimStart().startsWith('//') ||
        linePrefix.trimStart().startsWith('#') ||
        linePrefix.trimStart().startsWith('*')) {
      return null;
    }

    // Get surrounding context (10 lines before, 5 lines after)
    const startLine = Math.max(0, position.line - 10);
    const endLine = Math.min(document.lineCount - 1, position.line + 5);

    const contextBefore = document.getText(
      new vscode.Range(startLine, 0, position.line, position.character)
    );
    const contextAfter = document.getText(
      new vscode.Range(position.line, position.character, endLine, document.lineAt(endLine).text.length)
    );

    // Debounce
    return new Promise((resolve) => {
      if (this.debounceTimer) {
        clearTimeout(this.debounceTimer);
      }

      this.debounceTimer = setTimeout(async () => {
        if (token.isCancellationRequested) {
          resolve(null);
          return;
        }

        try {
          this.lastRequest = new AbortController();

          const completions = await this.client.complete(
            linePrefix,
            contextBefore + '\n/* cursor here */\n' + contextAfter
          );

          if (token.isCancellationRequested || !completions || completions.length === 0) {
            resolve(null);
            return;
          }

          const items: vscode.InlineCompletionItem[] = completions.map((completion) => {
            return new vscode.InlineCompletionItem(
              completion.insertText,
              new vscode.Range(position, position)
            );
          });

          resolve(items);
        } catch (error) {
          resolve(null);
        }
      }, this.debounceMs);
    });
  }
}

export function registerCompletionProvider(
  context: vscode.ExtensionContext,
  client: JarvisClient
): JarvisCompletionProvider {
  const provider = new JarvisCompletionProvider(client);

  // Register for all languages
  const selector: vscode.DocumentSelector = [
    { scheme: 'file' },
    { scheme: 'untitled' }
  ];

  context.subscriptions.push(
    vscode.languages.registerInlineCompletionItemProvider(selector, provider)
  );

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
