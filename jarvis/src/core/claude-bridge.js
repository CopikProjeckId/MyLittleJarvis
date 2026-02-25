// JARVIS Light - Claude Bridge (Claude Code CLI Integration)

import { spawn } from 'child_process';
import { EventEmitter } from 'events';

export class ClaudeBridge extends EventEmitter {
  constructor(options = {
    model: 'sonnet',
    effort: 'high',
    timeout: 120000
  }) {
    super();
    this.model = options.model || 'sonnet';
    this.effort = options.effort || 'high';
    this.timeout = options.timeout || 120000;
    this.claudePath = 'claude';
  }

  // Execute a single task
  async execute(task, context = {}) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      
      // Build command
      const args = [
        '-p',
        '--model', this.model,
        '--effort', this.effort
      ];

      // Add working directory if provided
      if (context.workdir) {
        args.push('--workdir', context.workdir);
      }

      // Spawn process
      const proc = spawn(this.claudePath, args, {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', (data) => {
        stdout += data.toString();
        this.emit('stdout', data.toString());
      });

      proc.stderr.on('data', (data) => {
        stderr += data.toString();
        this.emit('stderr', data.toString());
      });

      proc.on('close', (code) => {
        const duration = Date.now() - startTime;
        
        if (code === 0) {
          resolve({
            success: true,
            output: stdout,
            duration,
            code
          });
        } else {
          resolve({
            success: false,
            output: stdout,
            error: stderr,
            duration,
            code
          });
        }
      });

      proc.on('error', (err) => {
        reject(err);
      });

      // Send task to Claude
      proc.stdin.write(task);
      proc.stdin.end();

      // Timeout
      setTimeout(() => {
        proc.kill();
        reject(new Error('Claude execution timeout'));
      }, this.timeout);
    });
  }

  // Execute with Ralph Loop (iteration-based)
  async executeWithLoop(task, context = {}) {
    const maxIterations = context.maxIterations || 5;
    let iteration = 0;
    let lastResult = null;

    while (iteration < maxIterations) {
      iteration++;
      console.log(`🔄 Claude iteration ${iteration}/${maxIterations}`);
      
      const result = await this.execute(task, context);
      lastResult = result;

      // Check for DONE signal
      if (result.output.includes('DONE') || 
          result.output.includes('✅') ||
          result.output.includes('Complete')) {
        console.log(`✅ Claude completed in ${iteration} iterations`);
        return { ...result, iterations: iteration };
      }

      // Self-correction: append feedback
      task = `
Previous attempt (iteration ${iteration}):
${result.output}

Please fix the above issues and output DONE when complete.
`;
    }

    console.log(`⚠️ Claude max iterations reached (${maxIterations})`);
    return { ...lastResult, iterations: maxIterations, complete: false };
  }

  // Code review specific
  async reviewCode(filePath, language = 'javascript') {
    const task = `Please review the code in ${filePath} and provide feedback on:
1. Code quality
2. Potential bugs
3. Performance issues
4. Security concerns
5. Suggested improvements

Output a JSON summary with the format:
{
  "quality": "A/B/C",
  "bugs": [],
  "issues": [],
  "suggestions": []
}

If the code is production-ready, output DONE at the end.`;

    return await this.executeWithLoop(task, { workdir: '.' });
  }

  // Refactor specific
  async refactorCode(filePath, goal) {
    const task = `Refactor the code in ${filePath} to achieve:
${goal}

Make minimal changes necessary. Output DONE when complete.`;

    return await this.executeWithLoop(task, { workdir: '.' });
  }

  // Write tests
  async writeTests(filePath, framework = 'jest') {
    const task = `Write tests for ${filePath} using ${framework}.
Cover:
- Happy path
- Edge cases
- Error handling

Output DONE when complete.`;

    return await this.executeWithLoop(task, { workdir: '.' });
  }

  getStatus() {
    return {
      model: this.model,
      effort: this.effort,
      timeout: this.timeout,
      available: true // In real impl, check if claude CLI exists
    };
  }
}

export default ClaudeBridge;
