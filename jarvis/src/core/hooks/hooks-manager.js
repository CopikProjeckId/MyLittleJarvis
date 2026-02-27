// JARVIS Hooks Manager
// Central manager for hook registration and execution
// Based on OpenClaw's hooks architecture

import { EventEmitter } from 'events';
import { HOOK_EVENTS, HOOK_PRIORITY } from './types.js';

/**
 * Hooks Manager
 * Manages hook registration, execution, and lifecycle
 */
export class HooksManager extends EventEmitter {
  constructor(options = {}) {
    super();
    this.hooks = new Map(); // hookId -> HookDefinition
    this.hooksByEvent = new Map(); // event -> HookDefinition[]
    this.config = {
      errorBehavior: options.errorBehavior || 'continue', // 'continue' | 'stop' | 'throw'
      maxExecutionTimeMs: options.maxExecutionTimeMs || 30000,
      parallelExecution: options.parallelExecution || false
    };
    this.stats = {
      executed: 0,
      failed: 0,
      byHook: new Map()
    };

    // Initialize event buckets
    for (const event of HOOK_EVENTS) {
      this.hooksByEvent.set(event, []);
    }
  }

  /**
   * Register a hook
   * @param {import('./types.js').HookDefinition} hook
   */
  register(hook) {
    if (!hook.id || !hook.handler) {
      throw new Error('Hook must have id and handler');
    }

    if (this.hooks.has(hook.id)) {
      throw new Error(`Hook '${hook.id}' already registered`);
    }

    const hookDef = {
      id: hook.id,
      name: hook.name || hook.id,
      description: hook.description || '',
      events: hook.events || [],
      priority: hook.priority ?? HOOK_PRIORITY.NORMAL,
      enabled: hook.enabled !== false,
      handler: hook.handler,
      metadata: hook.metadata || {}
    };

    this.hooks.set(hook.id, hookDef);

    // Add to event buckets and sort by priority
    for (const event of hookDef.events) {
      const bucket = this.hooksByEvent.get(event);
      if (bucket) {
        bucket.push(hookDef);
        bucket.sort((a, b) => a.priority - b.priority);
      }
    }

    this.emit('hook:registered', { hookId: hook.id });
    return hookDef;
  }

  /**
   * Unregister a hook
   * @param {string} hookId
   */
  unregister(hookId) {
    const hook = this.hooks.get(hookId);
    if (!hook) return false;

    // Remove from event buckets
    for (const event of hook.events) {
      const bucket = this.hooksByEvent.get(event);
      if (bucket) {
        const index = bucket.findIndex(h => h.id === hookId);
        if (index !== -1) {
          bucket.splice(index, 1);
        }
      }
    }

    this.hooks.delete(hookId);
    this.emit('hook:unregistered', { hookId });
    return true;
  }

  /**
   * Enable/disable a hook
   * @param {string} hookId
   * @param {boolean} enabled
   */
  setEnabled(hookId, enabled) {
    const hook = this.hooks.get(hookId);
    if (hook) {
      hook.enabled = enabled;
      this.emit('hook:toggled', { hookId, enabled });
      return true;
    }
    return false;
  }

  /**
   * Execute hooks for an event
   * @param {import('./types.js').HookEvent} event
   * @param {import('./types.js').HookContext} context
   * @param {Object} [data] - Event-specific data
   * @returns {Promise<import('./types.js').HookResult>}
   */
  async execute(event, context, data = {}) {
    const bucket = this.hooksByEvent.get(event);
    if (!bucket || bucket.length === 0) {
      return { continue: true, data };
    }

    const enabledHooks = bucket.filter(h => h.enabled);
    if (enabledHooks.length === 0) {
      return { continue: true, data };
    }

    let currentData = { ...data };
    const results = [];

    if (this.config.parallelExecution && event !== 'pre-turn') {
      // Parallel execution (for non-critical events)
      const promises = enabledHooks.map(hook =>
        this.executeHook(hook, event, context, currentData)
      );
      const hookResults = await Promise.allSettled(promises);

      for (let i = 0; i < hookResults.length; i++) {
        const result = hookResults[i];
        if (result.status === 'fulfilled') {
          results.push(result.value);
          if (result.value.data) {
            currentData = { ...currentData, ...result.value.data };
          }
        } else {
          results.push({
            continue: this.config.errorBehavior !== 'stop',
            error: result.reason
          });
        }
      }
    } else {
      // Sequential execution
      for (const hook of enabledHooks) {
        const result = await this.executeHook(hook, event, context, currentData);
        results.push(result);

        if (result.data) {
          currentData = { ...currentData, ...result.data };
        }

        if (result.continue === false) {
          break;
        }
      }
    }

    const shouldContinue = results.every(r => r.continue !== false);
    const errors = results.filter(r => r.error).map(r => r.error);

    return {
      continue: shouldContinue,
      data: currentData,
      errors: errors.length > 0 ? errors : undefined,
      hookCount: results.length
    };
  }

  /**
   * Execute a single hook
   * @private
   */
  async executeHook(hook, event, context, data) {
    const startTime = Date.now();

    try {
      const result = await Promise.race([
        hook.handler({ event, context, data }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Hook timeout')), this.config.maxExecutionTimeMs)
        )
      ]);

      const duration = Date.now() - startTime;
      this.recordExecution(hook.id, duration, false);

      this.emit('hook:executed', {
        hookId: hook.id,
        event,
        duration,
        success: true
      });

      return {
        continue: result?.continue !== false,
        data: result?.data,
        message: result?.message
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      this.recordExecution(hook.id, duration, true);

      this.emit('hook:error', {
        hookId: hook.id,
        event,
        error,
        duration
      });

      if (this.config.errorBehavior === 'throw') {
        throw error;
      }

      return {
        continue: this.config.errorBehavior !== 'stop',
        error
      };
    }
  }

  /**
   * Record execution statistics
   * @private
   */
  recordExecution(hookId, durationMs, failed) {
    this.stats.executed++;
    if (failed) this.stats.failed++;

    if (!this.stats.byHook.has(hookId)) {
      this.stats.byHook.set(hookId, {
        executed: 0,
        failed: 0,
        totalMs: 0,
        maxMs: 0
      });
    }

    const hookStats = this.stats.byHook.get(hookId);
    hookStats.executed++;
    if (failed) hookStats.failed++;
    hookStats.totalMs += durationMs;
    hookStats.maxMs = Math.max(hookStats.maxMs, durationMs);
  }

  /**
   * Get registered hooks
   * @param {import('./types.js').HookEvent} [event] - Filter by event
   */
  listHooks(event) {
    if (event) {
      return this.hooksByEvent.get(event) || [];
    }
    return Array.from(this.hooks.values());
  }

  /**
   * Get hook by ID
   * @param {string} hookId
   */
  getHook(hookId) {
    return this.hooks.get(hookId);
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      ...this.stats,
      byHook: Object.fromEntries(this.stats.byHook)
    };
  }

  /**
   * Clear all hooks
   */
  clear() {
    this.hooks.clear();
    for (const event of HOOK_EVENTS) {
      this.hooksByEvent.set(event, []);
    }
    this.emit('hooks:cleared');
  }
}

// Default instance
export const defaultHooksManager = new HooksManager();
