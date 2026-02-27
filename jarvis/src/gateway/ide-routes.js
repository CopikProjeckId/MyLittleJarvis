// JARVIS Gateway IDE Routes
// Enhanced IDE integration with streaming and session support

/**
 * @typedef {Object} IDERouteOptions
 * @property {Object} jarvis - JARVIS instance
 * @property {Object} [toolManager] - Tool manager instance
 * @property {Object} [sessionManager] - ACP session manager
 */

/**
 * Register IDE routes on Express app
 * @param {import('express').Express} app
 * @param {IDERouteOptions} options
 */
export function registerIDERoutes(app, options) {
  const { jarvis, toolManager, sessionManager } = options;

  // ============================================================
  // Streaming Chat Endpoint (SSE)
  // ============================================================

  app.post('/api/ide/chat/stream', async (req, res) => {
    const { message, sessionKey, language } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Set up SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    const sendEvent = (event, data) => {
      res.write(`event: ${event}\n`);
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    try {
      sendEvent('start', { timestamp: Date.now() });

      if (jarvis) {
        // Use streaming if available
        if (jarvis.processStream) {
          const stream = await jarvis.processStream(message, {
            sessionKey,
            onToken: (token) => {
              sendEvent('token', { token });
            }
          });

          sendEvent('complete', {
            response: stream.response,
            agent: stream.agent,
            duration: stream.duration
          });
        } else {
          // Fallback to regular processing
          const result = await jarvis.process(message);
          sendEvent('complete', {
            response: result.response,
            agent: result.agent,
            duration: result.duration
          });
        }
      } else {
        sendEvent('error', { message: 'JARVIS not ready' });
      }
    } catch (error) {
      sendEvent('error', { message: error.message });
    } finally {
      res.end();
    }
  });

  // ============================================================
  // Add Comments Endpoint
  // ============================================================

  app.post('/api/ide/comments', async (req, res) => {
    const { code, language, style = 'jsdoc' } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Code is required' });
    }

    const styleInstructions = {
      jsdoc: 'Add JSDoc-style comments with @param, @returns, @throws',
      inline: 'Add inline comments explaining the logic',
      minimal: 'Add minimal comments for complex parts only',
      comprehensive: 'Add comprehensive documentation comments'
    };

    const instruction = styleInstructions[style] || style;

    try {
      if (jarvis) {
        const prompt = `${instruction} to this ${language || ''} code:

\`\`\`${language || ''}
${code.substring(0, 3000)}
\`\`\`

Return ONLY the code with comments added.`;

        const result = await jarvis.process(prompt);

        let commentedCode = result.response;
        const codeMatch = commentedCode.match(/```[\w]*\n([\s\S]*?)```/);
        if (codeMatch) {
          commentedCode = codeMatch[1];
        }

        res.json({
          commentedCode: commentedCode.trim(),
          original: code,
          style
        });
      } else {
        res.json({ commentedCode: code, message: 'JARVIS not ready' });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================================
  // Generate Tests Endpoint
  // ============================================================

  app.post('/api/ide/tests', async (req, res) => {
    const { code, language, framework = 'auto', coverage = 'basic' } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Code is required' });
    }

    const frameworkHints = {
      jest: 'using Jest with describe/it blocks',
      mocha: 'using Mocha/Chai with describe/it blocks',
      pytest: 'using pytest with test_ functions',
      unittest: 'using Python unittest with TestCase',
      vitest: 'using Vitest with describe/it blocks',
      auto: 'using the appropriate testing framework'
    };

    const coverageHints = {
      basic: 'Cover main functionality',
      comprehensive: 'Cover edge cases, error handling, and boundary conditions',
      full: 'Achieve maximum code coverage with all branches tested'
    };

    try {
      if (jarvis) {
        const prompt = `Generate unit tests ${frameworkHints[framework] || framework} for this ${language || ''} code.
${coverageHints[coverage] || coverage}.

\`\`\`${language || ''}
${code.substring(0, 3000)}
\`\`\`

Return ONLY the test code.`;

        const result = await jarvis.process(prompt);

        let testCode = result.response;
        const codeMatch = testCode.match(/```[\w]*\n([\s\S]*?)```/);
        if (codeMatch) {
          testCode = codeMatch[1];
        }

        res.json({
          testCode: testCode.trim(),
          framework,
          coverage
        });
      } else {
        res.json({ testCode: '', message: 'JARVIS not ready' });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================================
  // Type Inference Endpoint
  // ============================================================

  app.post('/api/ide/types', async (req, res) => {
    const { code, language = 'typescript' } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Code is required' });
    }

    try {
      if (jarvis) {
        const prompt = `Add TypeScript type annotations to this code:

\`\`\`${language}
${code.substring(0, 3000)}
\`\`\`

Return ONLY the typed code.`;

        const result = await jarvis.process(prompt);

        let typedCode = result.response;
        const codeMatch = typedCode.match(/```[\w]*\n([\s\S]*?)```/);
        if (codeMatch) {
          typedCode = codeMatch[1];
        }

        res.json({
          typedCode: typedCode.trim(),
          original: code
        });
      } else {
        res.json({ typedCode: code, message: 'JARVIS not ready' });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================================
  // Code Review Endpoint
  // ============================================================

  app.post('/api/ide/review', async (req, res) => {
    const { code, language, focus = 'all' } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Code is required' });
    }

    const focusAreas = {
      all: 'Review for bugs, performance, security, and best practices',
      bugs: 'Focus on potential bugs and logical errors',
      performance: 'Focus on performance issues and optimizations',
      security: 'Focus on security vulnerabilities',
      style: 'Focus on code style and readability'
    };

    try {
      if (jarvis) {
        const prompt = `${focusAreas[focus] || focus} in this ${language || ''} code:

\`\`\`${language || ''}
${code.substring(0, 4000)}
\`\`\`

Provide a structured review with:
1. Issues found (severity: high/medium/low)
2. Suggestions for improvement
3. Good practices observed`;

        const result = await jarvis.process(prompt);

        res.json({
          review: result.response,
          focus,
          codeLength: code.length
        });
      } else {
        res.json({ review: 'JARVIS not ready', focus });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================================
  // Symbol Search Endpoint
  // ============================================================

  app.post('/api/ide/symbols', async (req, res) => {
    const { query, path, type } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    try {
      if (toolManager) {
        const result = await toolManager.execute('search-definition', {
          symbol: query,
          path: path || '.',
          type
        });

        res.json({
          symbols: result.result?.definitions || [],
          found: result.result?.found || false
        });
      } else {
        res.json({ symbols: [], found: false, message: 'Tool manager not available' });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================================
  // File Operations Endpoint
  // ============================================================

  app.post('/api/ide/file/read', async (req, res) => {
    const { path: filePath, offset, limit } = req.body;

    if (!filePath) {
      return res.status(400).json({ error: 'Path is required' });
    }

    try {
      if (toolManager) {
        const result = await toolManager.execute('file-read', {
          path: filePath,
          offset,
          limit
        });

        res.json(result.result || result);
      } else {
        res.status(500).json({ error: 'Tool manager not available' });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/ide/file/edit', async (req, res) => {
    const { path: filePath, old_string, new_string, replace_all } = req.body;

    if (!filePath || old_string === undefined || new_string === undefined) {
      return res.status(400).json({ error: 'path, old_string, and new_string are required' });
    }

    try {
      if (toolManager) {
        const result = await toolManager.execute('file-edit', {
          path: filePath,
          old_string,
          new_string,
          replace_all
        });

        res.json(result.result || result);
      } else {
        res.status(500).json({ error: 'Tool manager not available' });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================================
  // Git Operations Endpoint
  // ============================================================

  app.get('/api/ide/git/status', async (req, res) => {
    const { path: repoPath } = req.query;

    try {
      if (toolManager) {
        const result = await toolManager.execute('git-status', {
          path: repoPath || '.'
        });

        res.json(result.result || result);
      } else {
        res.status(500).json({ error: 'Tool manager not available' });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/ide/git/diff', async (req, res) => {
    const { path: repoPath, staged, file } = req.body;

    try {
      if (toolManager) {
        const result = await toolManager.execute('git-diff', {
          path: repoPath || '.',
          staged,
          file
        });

        res.json(result.result || result);
      } else {
        res.status(500).json({ error: 'Tool manager not available' });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================================
  // Session Management Endpoints
  // ============================================================

  app.post('/api/ide/session/create', async (req, res) => {
    const { sessionKey, agent = 'default', mode = 'conversation' } = req.body;

    if (!sessionKey) {
      return res.status(400).json({ error: 'sessionKey is required' });
    }

    try {
      if (sessionManager) {
        const result = await sessionManager.initializeSession({
          cfg: {},
          sessionKey,
          agent,
          mode
        });

        res.json({
          success: true,
          sessionKey,
          meta: result.meta
        });
      } else {
        res.json({ success: true, sessionKey, message: 'Session manager not available' });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/ide/session/:sessionKey', async (req, res) => {
    const { sessionKey } = req.params;

    try {
      if (sessionManager) {
        const status = await sessionManager.getSessionStatus({
          cfg: {},
          sessionKey
        });

        res.json(status);
      } else {
        res.json({ sessionKey, message: 'Session manager not available' });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete('/api/ide/session/:sessionKey', async (req, res) => {
    const { sessionKey } = req.params;
    const { reason = 'user-request' } = req.body;

    try {
      if (sessionManager) {
        const result = await sessionManager.closeSession({
          cfg: {},
          sessionKey,
          reason
        });

        res.json({ success: true, ...result });
      } else {
        res.json({ success: true, sessionKey, message: 'Session manager not available' });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================================
  // Metrics Endpoint
  // ============================================================

  app.get('/api/ide/metrics', (req, res) => {
    const metrics = {};

    if (toolManager) {
      metrics.tools = toolManager.getMetrics();
    }

    if (sessionManager) {
      metrics.sessions = sessionManager.getObservabilitySnapshot({});
    }

    res.json(metrics);
  });

  console.log('📡 IDE routes registered');
}

export default registerIDERoutes;
