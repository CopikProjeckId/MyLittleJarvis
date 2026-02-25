// JARVIS Tool Executor
// Core: Tool validation, execution, timeout, error handling
// Features: Parameter validation, streaming, error recovery

import { EventEmitter } from 'events';
import { spawn } from 'child_process';

// ============================================================
// Tool Definition
// ============================================================

export class ToolDefinition {
  constructor(definition) {
    this.name = definition.name;
    this.description = definition.description || '';
    this.parameters = definition.parameters || { type: 'object', properties: {} };
    this.handler = definition.handler;
    this.timeout = definition.timeout || 60000;
    this.retry = definition.retry || 0;
    this.requirements = definition.requirements || {};
    this.schema = definition.schema;
  }

  // Validate parameters against schema
  validate(params = {}) {
    const errors = [];
    
    // Check required parameters
    const required = this.parameters.required || [];
    for (const param of required) {
      if (!(param in params) || params[param] === undefined || params[param] === null) {
        errors.push(`Missing required parameter: ${param}`);
      }
    }

    // Check parameter types
    const properties = this.parameters.properties || {};
    for (const [key, value] of Object.entries(params)) {
      const schema = properties[key];
      if (schema && schema.type) {
        const actualType = Array.isArray(value) ? 'array' : typeof value;
        if (actualType !== schema.type && !(schema.type === 'number' && !isNaN(value))) {
          errors.push(`Invalid type for ${key}: expected ${schema.type}, got ${actualType}`);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

// ============================================================
// Tool Executor (Core)
// ============================================================

export class ToolExecutor extends EventEmitter {
  constructor(options = {}) {
    super();
    this.tools = new Map();
    this.executionHistory = [];
    this.maxHistory = options.maxHistory || 100;
    this.defaultTimeout = options.defaultTimeout || 60000;
    this.sandboxMode = options.sandboxMode || 'none'; // 'none', 'vm', 'docker'
  }

  // Register tool
  register(definition) {
    const tool = new ToolDefinition(definition);
    this.tools.set(tool.name, tool);
    this.emit('registered', { name: tool.name });
    return this;
  }

  // Register multiple tools
  registerMany(tools) {
    for (const tool of tools) {
      this.register(tool);
    }
    return this;
  }

  // Execute tool with full pipeline
  async execute(toolName, params = {}, context = {}) {
    const tool = this.tools.get(toolName);
    
    if (!tool) {
      throw new Error(`Tool not found: ${toolName}`);
    }

    const executionId = this.generateExecutionId();
    const startTime = Date.now();

    this.emit('start', { executionId, tool: toolName, params });

    try {
      // 1. Validate parameters
      const validation = tool.validate(params);
      if (!validation.valid) {
        throw new Error(`Parameter validation failed: ${validation.errors.join(', ')}`);
      }

      // 2. Check requirements
      this.checkRequirements(tool.requirements, context);

      // 3. Execute with timeout and retry
      const result = await this.executeWithRetry(tool, params, context, executionId);

      const duration = Date.now() - startTime;
      
      // 4. Record history
      this.recordExecution({
        executionId,
        tool: toolName,
        params,
        result,
        duration,
        success: true
      });

      this.emit('success', { executionId, tool: toolName, result, duration });
      
      return result;

    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.recordExecution({
        executionId,
        tool: toolName,
        params,
        error: error.message,
        duration,
        success: false
      });

      this.emit('error', { executionId, tool: toolName, error: error.message, duration });
      throw error;
    }
  }

  // Execute with retry logic
  async executeWithRetry(tool, params, context, executionId) {
    let lastError = null;
    const maxRetries = tool.retry || 0;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          this.emit('retry', { executionId, attempt, tool: tool.name });
          // Exponential backoff
          await this.sleep(Math.min(1000 * Math.pow(2, attempt), 10000));
        }

        // Execute with timeout
        return await this.executeWithTimeout(
          tool.handler(params, context),
          tool.timeout || this.defaultTimeout,
          executionId
        );

      } catch (error) {
        lastError = error;
        
        // Don't retry on certain errors
        if (error.message.includes('validation') || 
            error.message.includes('not found') ||
            error.message.includes('permission')) {
          throw error;
        }
      }
    }

    throw lastError;
  }

  // Execute with timeout
  executeWithTimeout(promise, timeoutMs, executionId) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Tool execution timeout after ${timeoutMs}ms`));
      }, timeoutMs);

      Promise.resolve(promise)
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

  // Check requirements
  checkRequirements(requirements, context) {
    for (const [key, value] of Object.entries(requirements)) {
      switch (key) {
        case 'apiKey':
          if (!process.env[value] && !context[key]) {
            throw new Error(`Required API key not found: ${value}`);
          }
          break;
        case 'env':
          if (!process.env[value]) {
            throw new Error(`Required environment variable not set: ${value}`);
          }
          break;
        case 'capability':
          if (!context.capabilities?.[value]) {
            throw new Error(`Required capability not available: ${value}`);
          }
          break;
      }
    }
  }

  // Stream execution (for long-running tools)
  async *streamExecute(toolName, params = {}, context = {}) {
    const tool = this.tools.get(toolName);
    
    if (!tool) {
      throw new Error(`Tool not found: ${toolName}`);
    }

    const executionId = this.generateExecutionId();
    this.emit('stream-start', { executionId, tool: toolName });

    try {
      // Validate
      const validation = tool.validate(params);
      if (!validation.valid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      // Get handler result
      const handler = tool.handler(params, context);
      
      // Check if async generator
      if (typeof handler[Symbol.asyncIterator] === 'function') {
        for await (const chunk of handler) {
          this.emit('stream-chunk', { executionId, chunk });
          yield chunk;
        }
      } else if (typeof handler[Symbol.iterator] === 'function') {
        for (const chunk of handler) {
          this.emit('stream-chunk', { executionId, chunk });
          yield chunk;
        }
      } else {
        // Regular promise
        const result = await this.executeWithTimeout(
          handler,
          tool.timeout,
          executionId
        );
        yield result;
      }

      this.emit('stream-end', { executionId });

    } catch (error) {
      this.emit('stream-error', { executionId, error: error.message });
      throw error;
    }
  }

  // Get tool info
  getTool(toolName) {
    return this.tools.get(toolName);
  }

  // List tools
  listTools() {
    return Array.from(this.tools.values()).map(tool => ({
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters,
      timeout: tool.timeout,
      retry: tool.retry
    }));
  }

  // Get execution history
  getHistory(toolName, limit = 10) {
    let history = this.executionHistory;
    
    if (toolName) {
      history = history.filter(h => h.tool === toolName);
    }
    
    return history.slice(-limit);
  }

  // Record execution
  recordExecution(entry) {
    this.executionHistory.push(entry);
    
    // Trim history
    if (this.executionHistory.length > this.maxHistory) {
      this.executionHistory = this.executionHistory.slice(-this.maxHistory);
    }
  }

  // Get statistics
  getStats() {
    const total = this.executionHistory.length;
    const successful = this.executionHistory.filter(h => h.success).length;
    const failed = total - successful;
    
    const toolStats = {};
    for (const entry of this.executionHistory) {
      if (!toolStats[entry.tool]) {
        toolStats[entry.tool] = { calls: 0, successes: 0, failures: 0, avgDuration: 0 };
      }
      toolStats[entry.tool].calls++;
      if (entry.success) {
        toolStats[entry.tool].successes++;
      } else {
        toolStats[entry.tool].failures++;
      }
      toolStats[entry.tool].avgDuration += entry.duration;
    }

    // Calculate averages
    for (const tool of Object.values(toolStats)) {
      tool.avgDuration = Math.round(tool.avgDuration / tool.calls);
    }

    return {
      total,
      successful,
      failed,
      successRate: total > 0 ? (successful / total * 100).toFixed(1) + '%' : '0%',
      toolStats,
      availableTools: this.tools.size
    };
  }

  // Utility
  generateExecutionId() {
    return `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default ToolExecutor;
