// JARVIS Code Action Provider
// AI-powered quick fixes and refactoring suggestions

import * as vscode from 'vscode';
import { JarvisClient } from '../jarvisClient';

export class JarvisCodeActionProvider implements vscode.CodeActionProvider {
  private client: JarvisClient;
  private enabled: boolean = true;

  public static readonly providedCodeActionKinds = [
    vscode.CodeActionKind.QuickFix,
    vscode.CodeActionKind.Refactor
  ];

  constructor(client: JarvisClient) {
    this.client = client;
    this.updateSettings();
  }

  updateSettings() {
    const config = vscode.workspace.getConfiguration('jarvis');
    this.enabled = config.get('enableCodeActions', true);
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  async provideCodeActions(
    document: vscode.TextDocument,
    range: vscode.Range | vscode.Selection,
    context: vscode.CodeActionContext,
    token: vscode.CancellationToken
  ): Promise<vscode.CodeAction[]> {
    if (!this.enabled) {
      return [];
    }

    const actions: vscode.CodeAction[] = [];

    // Add AI Fix action for errors
    if (context.diagnostics.length > 0) {
      const errors = context.diagnostics.filter(
        d => d.severity === vscode.DiagnosticSeverity.Error
      );

      if (errors.length > 0) {
        const fixAction = new vscode.CodeAction(
          'Fix with JARVIS AI',
          vscode.CodeActionKind.QuickFix
        );
        fixAction.command = {
          command: 'jarvis.fixDiagnostics',
          title: 'Fix with JARVIS AI',
          arguments: [document, range, errors]
        };
        fixAction.isPreferred = false;
        actions.push(fixAction);
      }
    }

    // Add refactoring actions for selections
    if (!range.isEmpty) {
      const selectedText = document.getText(range);

      // Simplify code
      const simplifyAction = new vscode.CodeAction(
        'Simplify with JARVIS',
        vscode.CodeActionKind.Refactor
      );
      simplifyAction.command = {
        command: 'jarvis.refactorWithType',
        title: 'Simplify',
        arguments: [document, range, 'simplify']
      };
      actions.push(simplifyAction);

      // Extract function (if multiple lines)
      if (selectedText.includes('\n')) {
        const extractAction = new vscode.CodeAction(
          'Extract to function with JARVIS',
          vscode.CodeActionKind.RefactorExtract
        );
        extractAction.command = {
          command: 'jarvis.refactorWithType',
          title: 'Extract Function',
          arguments: [document, range, 'extract-function']
        };
        actions.push(extractAction);
      }

      // Explain code
      const explainAction = new vscode.CodeAction(
        'Explain with JARVIS',
        vscode.CodeActionKind.Empty
      );
      explainAction.command = {
        command: 'jarvis.explainRange',
        title: 'Explain',
        arguments: [document, range]
      };
      actions.push(explainAction);

      // Add comments
      const commentAction = new vscode.CodeAction(
        'Add comments with JARVIS',
        vscode.CodeActionKind.RefactorRewrite
      );
      commentAction.command = {
        command: 'jarvis.addCommentsToRange',
        title: 'Add Comments',
        arguments: [document, range]
      };
      actions.push(commentAction);

      // Generate tests
      const testAction = new vscode.CodeAction(
        'Generate tests with JARVIS',
        vscode.CodeActionKind.Empty
      );
      testAction.command = {
        command: 'jarvis.generateTestsForRange',
        title: 'Generate Tests',
        arguments: [document, range]
      };
      actions.push(testAction);
    }

    return actions;
  }
}

export function registerCodeActionProvider(
  context: vscode.ExtensionContext,
  client: JarvisClient
): JarvisCodeActionProvider {
  const provider = new JarvisCodeActionProvider(client);

  // Register for common languages
  const languages = [
    'javascript', 'typescript', 'javascriptreact', 'typescriptreact',
    'python', 'java', 'go', 'rust', 'c', 'cpp', 'csharp',
    'php', 'ruby', 'swift', 'kotlin'
  ];

  for (const language of languages) {
    context.subscriptions.push(
      vscode.languages.registerCodeActionsProvider(
        { language },
        provider,
        { providedCodeActionKinds: JarvisCodeActionProvider.providedCodeActionKinds }
      )
    );
  }

  // Register additional commands for code actions
  context.subscriptions.push(
    vscode.commands.registerCommand('jarvis.fixDiagnostics', async (document, range, diagnostics) => {
      await fixDiagnosticsCommand(client, document, range, diagnostics);
    }),
    vscode.commands.registerCommand('jarvis.refactorWithType', async (document, range, type) => {
      await refactorWithTypeCommand(client, document, range, type);
    }),
    vscode.commands.registerCommand('jarvis.explainRange', async (document, range) => {
      await explainRangeCommand(client, document, range);
    }),
    vscode.commands.registerCommand('jarvis.addCommentsToRange', async (document, range) => {
      await addCommentsCommand(client, document, range);
    }),
    vscode.commands.registerCommand('jarvis.generateTestsForRange', async (document, range) => {
      await generateTestsCommand(client, document, range);
    })
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

async function fixDiagnosticsCommand(
  client: JarvisClient,
  document: vscode.TextDocument,
  range: vscode.Range,
  diagnostics: vscode.Diagnostic[]
) {
  const editor = vscode.window.activeTextEditor;
  if (!editor || editor.document !== document) return;

  const code = document.getText(range.isEmpty ? undefined : range);
  const errors = diagnostics.map(d => ({
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
        const fixedCode = await client.fix(code, errors, document.languageId);

        const action = await vscode.window.showInformationMessage(
          'JARVIS has a fix. Apply it?',
          'Apply', 'View', 'Cancel'
        );

        if (action === 'Apply') {
          await editor.edit((editBuilder) => {
            const targetRange = range.isEmpty
              ? new vscode.Range(0, 0, document.lineCount, 0)
              : range;
            editBuilder.replace(targetRange, fixedCode);
          });
        } else if (action === 'View') {
          const doc = await vscode.workspace.openTextDocument({
            content: fixedCode,
            language: document.languageId
          });
          await vscode.window.showTextDocument(doc, { viewColumn: vscode.ViewColumn.Beside });
        }
      } catch (error: any) {
        vscode.window.showErrorMessage(`JARVIS: ${error.message}`);
      }
    }
  );
}

async function refactorWithTypeCommand(
  client: JarvisClient,
  document: vscode.TextDocument,
  range: vscode.Range,
  type: string
) {
  const editor = vscode.window.activeTextEditor;
  if (!editor || editor.document !== document) return;

  const code = document.getText(range);

  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: `JARVIS is refactoring (${type})...`,
      cancellable: false
    },
    async () => {
      try {
        const refactoredCode = await client.refactor(code, type, undefined, document.languageId);

        const action = await vscode.window.showInformationMessage(
          'Apply refactoring?',
          'Apply', 'View', 'Cancel'
        );

        if (action === 'Apply') {
          await editor.edit((editBuilder) => {
            editBuilder.replace(range, refactoredCode);
          });
        } else if (action === 'View') {
          const doc = await vscode.workspace.openTextDocument({
            content: refactoredCode,
            language: document.languageId
          });
          await vscode.window.showTextDocument(doc, { viewColumn: vscode.ViewColumn.Beside });
        }
      } catch (error: any) {
        vscode.window.showErrorMessage(`JARVIS: ${error.message}`);
      }
    }
  );
}

async function explainRangeCommand(
  client: JarvisClient,
  document: vscode.TextDocument,
  range: vscode.Range
) {
  const code = document.getText(range);

  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: 'JARVIS is analyzing...',
      cancellable: false
    },
    async () => {
      try {
        const explanation = await client.explain(code, document.languageId);

        const doc = await vscode.workspace.openTextDocument({
          content: `# Code Explanation\n\n\`\`\`${document.languageId}\n${code}\n\`\`\`\n\n## Explanation\n\n${explanation}`,
          language: 'markdown'
        });
        await vscode.window.showTextDocument(doc, { viewColumn: vscode.ViewColumn.Beside, preview: true });
      } catch (error: any) {
        vscode.window.showErrorMessage(`JARVIS: ${error.message}`);
      }
    }
  );
}

async function addCommentsCommand(
  client: JarvisClient,
  document: vscode.TextDocument,
  range: vscode.Range
) {
  const editor = vscode.window.activeTextEditor;
  if (!editor || editor.document !== document) return;

  const code = document.getText(range);

  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: 'JARVIS is adding comments...',
      cancellable: false
    },
    async () => {
      try {
        const commentedCode = await client.refactor(code, 'add-comments', undefined, document.languageId);

        const action = await vscode.window.showInformationMessage(
          'Apply comments?',
          'Apply', 'View', 'Cancel'
        );

        if (action === 'Apply') {
          await editor.edit((editBuilder) => {
            editBuilder.replace(range, commentedCode);
          });
        } else if (action === 'View') {
          const doc = await vscode.workspace.openTextDocument({
            content: commentedCode,
            language: document.languageId
          });
          await vscode.window.showTextDocument(doc, { viewColumn: vscode.ViewColumn.Beside });
        }
      } catch (error: any) {
        vscode.window.showErrorMessage(`JARVIS: ${error.message}`);
      }
    }
  );
}

async function generateTestsCommand(
  client: JarvisClient,
  document: vscode.TextDocument,
  range: vscode.Range
) {
  const code = document.getText(range);

  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: 'JARVIS is generating tests...',
      cancellable: false
    },
    async () => {
      try {
        // Use chat to generate tests
        const response = await client.chat(
          `Generate comprehensive unit tests for this ${document.languageId} code:\n\n\`\`\`${document.languageId}\n${code}\n\`\`\`\n\nProvide only the test code, no explanation.`
        );

        const doc = await vscode.workspace.openTextDocument({
          content: response.response,
          language: document.languageId
        });
        await vscode.window.showTextDocument(doc, { viewColumn: vscode.ViewColumn.Beside });
      } catch (error: any) {
        vscode.window.showErrorMessage(`JARVIS: ${error.message}`);
      }
    }
  );
}
