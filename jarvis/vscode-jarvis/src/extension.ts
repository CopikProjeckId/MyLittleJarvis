// JARVIS VSCode Extension
// AI assistant with code completion, explanation, and refactoring

import * as vscode from 'vscode';
import { JarvisClient } from './jarvisClient';
import {
  registerCompletionProvider,
  registerCodeActionProvider,
  registerHoverProvider
} from './providers';

let client: JarvisClient;
let statusBarItem: vscode.StatusBarItem;

export function activate(context: vscode.ExtensionContext) {
  console.log('JARVIS extension activating...');

  // Initialize client
  const config = vscode.workspace.getConfiguration('jarvis');
  client = new JarvisClient({
    gatewayUrl: config.get('gatewayUrl') || 'http://localhost:18789',
    token: config.get('token')
  });

  // Status bar
  statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  statusBarItem.text = '$(hubot) JARVIS';
  statusBarItem.tooltip = 'JARVIS AI Assistant';
  statusBarItem.command = 'jarvis.chat';
  statusBarItem.show();
  context.subscriptions.push(statusBarItem);

  // Check connection
  checkConnection();

  // Watch config changes
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration('jarvis')) {
        const newConfig = vscode.workspace.getConfiguration('jarvis');
        client.updateConfig({
          gatewayUrl: newConfig.get('gatewayUrl') || 'http://localhost:18789',
          token: newConfig.get('token')
        });
        checkConnection();
      }
    })
  );

  // Register commands
  context.subscriptions.push(
    vscode.commands.registerCommand('jarvis.chat', openChat),
    vscode.commands.registerCommand('jarvis.explain', explainSelection),
    vscode.commands.registerCommand('jarvis.fix', fixSelection),
    vscode.commands.registerCommand('jarvis.refactor', refactorSelection),
    vscode.commands.registerCommand('jarvis.complete', completeCode),
    vscode.commands.registerCommand('jarvis.setGateway', setGatewayUrl)
  );

  // Register chat view
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider('jarvis.chatView', new ChatViewProvider(context, client))
  );

  // Register language feature providers
  registerCompletionProvider(context, client);
  registerCodeActionProvider(context, client);
  registerHoverProvider(context, client);

  console.log('JARVIS extension activated with providers');
}

async function checkConnection() {
  const isHealthy = await client.checkHealth();
  if (isHealthy) {
    statusBarItem.text = '$(hubot) JARVIS';
    statusBarItem.backgroundColor = undefined;
  } else {
    statusBarItem.text = '$(hubot) JARVIS (offline)';
    statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground');
  }
}

async function openChat() {
  const message = await vscode.window.showInputBox({
    prompt: 'Ask JARVIS anything...',
    placeHolder: 'Type your question or request'
  });

  if (!message) { return; }

  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: 'JARVIS is thinking...',
      cancellable: false
    },
    async () => {
      try {
        const response = await client.chat(message);

        // Show response in new document
        const doc = await vscode.workspace.openTextDocument({
          content: `# JARVIS Response\n\n**You:** ${message}\n\n**JARVIS:** ${response.response}\n\n---\n_Agent: ${response.agent || 'unknown'} | Time: ${response.duration || 0}ms_`,
          language: 'markdown'
        });
        await vscode.window.showTextDocument(doc, { preview: true });
      } catch (error: any) {
        vscode.window.showErrorMessage(`JARVIS error: ${error.message}`);
      }
    }
  );
}

async function explainSelection() {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showWarningMessage('No active editor');
    return;
  }

  const selection = editor.selection;
  const code = editor.document.getText(selection);

  if (!code) {
    vscode.window.showWarningMessage('No code selected');
    return;
  }

  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: 'JARVIS is analyzing...',
      cancellable: false
    },
    async () => {
      try {
        const language = editor.document.languageId;
        const explanation = await client.explain(code, language);

        // Show in hover-like panel
        const doc = await vscode.workspace.openTextDocument({
          content: `# Code Explanation\n\n\`\`\`${language}\n${code}\n\`\`\`\n\n## Explanation\n\n${explanation}`,
          language: 'markdown'
        });
        await vscode.window.showTextDocument(doc, {
          viewColumn: vscode.ViewColumn.Beside,
          preview: true
        });
      } catch (error: any) {
        vscode.window.showErrorMessage(`JARVIS error: ${error.message}`);
      }
    }
  );
}

async function fixSelection() {
  const editor = vscode.window.activeTextEditor;
  if (!editor) { return; }

  const selection = editor.selection;
  const code = editor.document.getText(selection.isEmpty ? undefined : selection);

  // Get diagnostics for the selection
  const diagnostics = vscode.languages
    .getDiagnostics(editor.document.uri)
    .filter((d) => d.severity === vscode.DiagnosticSeverity.Error)
    .map((d) => ({
      line: d.range.start.line + 1,
      message: d.message
    }));

  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: 'JARVIS is fixing...',
      cancellable: false
    },
    async () => {
      try {
        const language = editor.document.languageId;
        const fixedCode = await client.fix(code, diagnostics, language);

        // Show diff
        const action = await vscode.window.showInformationMessage(
          'JARVIS has suggested a fix. Apply it?',
          'Apply',
          'View Diff',
          'Cancel'
        );

        if (action === 'Apply') {
          await editor.edit((editBuilder) => {
            const range = selection.isEmpty
              ? new vscode.Range(0, 0, editor.document.lineCount, 0)
              : selection;
            editBuilder.replace(range, fixedCode);
          });
          vscode.window.showInformationMessage('Fix applied!');
        } else if (action === 'View Diff') {
          const doc = await vscode.workspace.openTextDocument({
            content: fixedCode,
            language
          });
          await vscode.window.showTextDocument(doc, { viewColumn: vscode.ViewColumn.Beside });
        }
      } catch (error: any) {
        vscode.window.showErrorMessage(`JARVIS error: ${error.message}`);
      }
    }
  );
}

async function refactorSelection() {
  const editor = vscode.window.activeTextEditor;
  if (!editor) { return; }

  const selection = editor.selection;
  const code = editor.document.getText(selection);

  if (!code) {
    vscode.window.showWarningMessage('No code selected');
    return;
  }

  const refactorType = await vscode.window.showQuickPick(
    [
      { label: 'Simplify', description: 'Make code cleaner and simpler', value: 'simplify' },
      { label: 'Extract Function', description: 'Extract selection to a new function', value: 'extract-function' },
      { label: 'Rename', description: 'Rename variable/function', value: 'rename' },
      { label: 'Inline', description: 'Inline variable or function', value: 'inline' }
    ],
    { placeHolder: 'Select refactoring type' }
  );

  if (!refactorType) { return; }

  let target: string | undefined;
  if (refactorType.value === 'rename') {
    target = await vscode.window.showInputBox({
      prompt: 'New name',
      placeHolder: 'Enter new name for the symbol'
    });
    if (!target) { return; }
  }

  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: 'JARVIS is refactoring...',
      cancellable: false
    },
    async () => {
      try {
        const language = editor.document.languageId;
        const refactoredCode = await client.refactor(code, refactorType.value, target, language);

        const action = await vscode.window.showInformationMessage(
          'JARVIS has refactored the code. Apply it?',
          'Apply',
          'View',
          'Cancel'
        );

        if (action === 'Apply') {
          await editor.edit((editBuilder) => {
            editBuilder.replace(selection, refactoredCode);
          });
          vscode.window.showInformationMessage('Refactoring applied!');
        } else if (action === 'View') {
          const doc = await vscode.workspace.openTextDocument({
            content: refactoredCode,
            language
          });
          await vscode.window.showTextDocument(doc, { viewColumn: vscode.ViewColumn.Beside });
        }
      } catch (error: any) {
        vscode.window.showErrorMessage(`JARVIS error: ${error.message}`);
      }
    }
  );
}

async function completeCode() {
  const editor = vscode.window.activeTextEditor;
  if (!editor) { return; }

  const position = editor.selection.active;
  const linePrefix = editor.document.lineAt(position).text.substring(0, position.character);

  // Get surrounding context
  const startLine = Math.max(0, position.line - 10);
  const context = editor.document.getText(
    new vscode.Range(startLine, 0, position.line, position.character)
  );

  try {
    const completions = await client.complete(linePrefix, context);

    if (completions.length > 0) {
      const completion = completions[0];
      await editor.edit((editBuilder) => {
        editBuilder.insert(position, completion.insertText);
      });
    } else {
      vscode.window.showInformationMessage('No completions available');
    }
  } catch (error: any) {
    vscode.window.showErrorMessage(`JARVIS error: ${error.message}`);
  }
}

async function setGatewayUrl() {
  const current = vscode.workspace.getConfiguration('jarvis').get('gatewayUrl');

  const url = await vscode.window.showInputBox({
    prompt: 'Enter JARVIS Gateway URL',
    value: current as string,
    placeHolder: 'http://localhost:18789'
  });

  if (url) {
    await vscode.workspace.getConfiguration('jarvis').update('gatewayUrl', url, true);
    vscode.window.showInformationMessage(`Gateway URL set to: ${url}`);
  }
}

// Chat WebView Provider
class ChatViewProvider implements vscode.WebviewViewProvider {
  constructor(
    private readonly context: vscode.ExtensionContext,
    private readonly client: JarvisClient
  ) {}

  resolveWebviewView(webviewView: vscode.WebviewView) {
    webviewView.webview.options = {
      enableScripts: true
    };

    webviewView.webview.html = this.getHtml();

    webviewView.webview.onDidReceiveMessage(async (message) => {
      if (message.type === 'chat') {
        try {
          const response = await this.client.chat(message.text);
          webviewView.webview.postMessage({
            type: 'response',
            text: response.response,
            agent: response.agent
          });
        } catch (error: any) {
          webviewView.webview.postMessage({
            type: 'error',
            text: error.message
          });
        }
      }
    });
  }

  private getHtml(): string {
    return `<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: var(--vscode-font-family);
      padding: 10px;
      margin: 0;
    }
    #messages {
      height: calc(100vh - 80px);
      overflow-y: auto;
      margin-bottom: 10px;
    }
    .message {
      margin: 8px 0;
      padding: 8px;
      border-radius: 6px;
    }
    .user {
      background: var(--vscode-input-background);
      text-align: right;
    }
    .assistant {
      background: var(--vscode-editor-selectionBackground);
    }
    #input-container {
      display: flex;
      gap: 8px;
    }
    #input {
      flex: 1;
      padding: 8px;
      border: 1px solid var(--vscode-input-border);
      background: var(--vscode-input-background);
      color: var(--vscode-input-foreground);
      border-radius: 4px;
    }
    button {
      padding: 8px 16px;
      background: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
    button:hover {
      background: var(--vscode-button-hoverBackground);
    }
  </style>
</head>
<body>
  <div id="messages"></div>
  <div id="input-container">
    <input type="text" id="input" placeholder="Ask JARVIS..." />
    <button onclick="send()">Send</button>
  </div>

  <script>
    const vscode = acquireVsCodeApi();
    const messages = document.getElementById('messages');
    const input = document.getElementById('input');

    function addMessage(text, type) {
      const div = document.createElement('div');
      div.className = 'message ' + type;
      div.textContent = text;
      messages.appendChild(div);
      messages.scrollTop = messages.scrollHeight;
    }

    function send() {
      const text = input.value.trim();
      if (!text) return;

      addMessage(text, 'user');
      input.value = '';

      vscode.postMessage({ type: 'chat', text });
    }

    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') send();
    });

    window.addEventListener('message', (e) => {
      const message = e.data;
      if (message.type === 'response') {
        addMessage(message.text, 'assistant');
      } else if (message.type === 'error') {
        addMessage('Error: ' + message.text, 'assistant');
      }
    });
  </script>
</body>
</html>`;
  }
}

export function deactivate() {
  if (client) {
    client.dispose();
  }
}
