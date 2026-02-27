// JARVIS NMT Context Augmentation
// Enhances conversation context with relevant knowledge from NMT
// 컨텍스트 증강 시스템

import { EventEmitter } from 'events';

// ============================================================
// Context Augmentation Engine
// ============================================================

export class ContextAugmentationEngine extends EventEmitter {
  constructor(options = {}) {
    super();
    this.nmtTools = options.nmtTools || null;
    this.enabled = options.enabled !== false;
    this.cache = new Map();
    this.cacheMaxAge = options.cacheMaxAge || 5 * 60 * 1000; // 5 minutes
    this.maxContextItems = options.maxContextItems || 5;
  }

  /**
   * Set NMT tools reference
   */
  setNmtTools(tools) {
    this.nmtTools = tools;
  }

  /**
   * Enable/disable context augmentation
   */
  setEnabled(enabled) {
    this.enabled = enabled;
  }

  /**
   * Get cached context or fetch new
   */
  getCachedContext(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheMaxAge) {
      return cached.data;
    }
    return null;
  }

  setCachedContext(key, data) {
    this.cache.set(key, { data, timestamp: Date.now() });

    // Clean old cache entries
    if (this.cache.size > 100) {
      const now = Date.now();
      for (const [k, v] of this.cache) {
        if (now - v.timestamp > this.cacheMaxAge) {
          this.cache.delete(k);
        }
      }
    }
  }

  /**
   * Augment a user query with relevant context from NMT
   */
  async augmentQuery(query, options = {}) {
    if (!this.enabled || !this.nmtTools) {
      return { augmented: false, query, context: null };
    }

    const {
      includeInference = true,
      includeAttractors = true,
      maxResults = this.maxContextItems,
    } = options;

    // Check cache
    const cacheKey = `query:${query.substring(0, 100)}`;
    const cached = this.getCachedContext(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const context = {
        relevantKnowledge: [],
        inference: null,
        attractors: null,
        augmentedPrompt: null,
      };

      // 1. Semantic search for relevant knowledge
      if (this.nmtTools['nmt-search']) {
        const searchResult = await this.nmtTools['nmt-search'].handler({
          query,
          topK: maxResults,
          includeContent: true,
        });

        if (searchResult.success && searchResult.results) {
          context.relevantKnowledge = searchResult.results.map(r => ({
            id: r.neuronId || r.id,
            score: r.score,
            content: r.content?.substring(0, 500),
            tags: r.tags,
          }));
        }
      }

      // 2. Run bidirectional inference on top result
      if (includeInference && context.relevantKnowledge.length > 0) {
        const topNeuronId = context.relevantKnowledge[0].id;

        if (this.nmtTools['nmt-infer'] && topNeuronId) {
          const inferResult = await this.nmtTools['nmt-infer'].handler({
            neuronId: topNeuronId,
            direction: 'bidirectional',
            depth: 2,
          });

          if (inferResult.success) {
            context.inference = inferResult.inference;
          }
        }
      }

      // 3. Get active attractors for goal-oriented context
      if (includeAttractors && this.nmtTools['nmt-attractor']) {
        const attractorResult = await this.nmtTools['nmt-attractor'].handler({
          action: 'list',
        });

        if (attractorResult.success) {
          context.attractors = attractorResult.result;
        }
      }

      // 4. Generate augmented prompt
      if (context.relevantKnowledge.length > 0) {
        context.augmentedPrompt = this.generateAugmentedPrompt(context);
      }

      const result = {
        augmented: context.augmentedPrompt !== null,
        query,
        context,
      };

      this.setCachedContext(cacheKey, result);
      this.emit('context-augmented', result);

      return result;
    } catch (error) {
      this.emit('augmentation-error', { error: error.message });
      return { augmented: false, query, context: null, error: error.message };
    }
  }

  /**
   * Generate an augmented prompt from context
   */
  generateAugmentedPrompt(context) {
    const parts = [];

    // Add relevant knowledge
    if (context.relevantKnowledge.length > 0) {
      parts.push('## Relevant Knowledge from Memory');
      for (const item of context.relevantKnowledge.slice(0, 3)) {
        if (item.content) {
          parts.push(`- [${item.tags?.join(', ') || 'general'}] ${item.content}`);
        }
      }
      parts.push('');
    }

    // Add inference insights
    if (context.inference && context.inference.insights) {
      parts.push('## Related Insights');
      if (Array.isArray(context.inference.insights)) {
        for (const insight of context.inference.insights.slice(0, 3)) {
          parts.push(`- ${insight}`);
        }
      }
      parts.push('');
    }

    // Add active goals/attractors
    if (context.attractors && Array.isArray(context.attractors) && context.attractors.length > 0) {
      const activeAttractors = context.attractors.filter(a => a.active);
      if (activeAttractors.length > 0) {
        parts.push('## Active Goals');
        for (const attractor of activeAttractors.slice(0, 3)) {
          parts.push(`- ${attractor.description || attractor.id}`);
        }
        parts.push('');
      }
    }

    return parts.length > 0 ? parts.join('\n') : null;
  }

  /**
   * Augment a conversation for context-aware responses
   */
  async augmentConversation(messages, currentQuery, options = {}) {
    if (!this.enabled || !this.nmtTools) {
      return { augmented: false, messages, context: null };
    }

    // Build context from conversation history
    const conversationContext = messages
      .slice(-5)
      .map(m => `${m.role}: ${m.content?.substring(0, 200)}`)
      .join('\n');

    const combinedQuery = `${currentQuery}\n\nConversation context:\n${conversationContext}`;

    return this.augmentQuery(combinedQuery, options);
  }

  /**
   * Store conversation insight for future reference
   */
  async storeInsight(insight, options = {}) {
    if (!this.nmtTools || !this.nmtTools['nmt-ingest']) {
      return null;
    }

    const { tags = ['insight'], sourceType = 'jarvis-insight' } = options;

    return await this.nmtTools['nmt-ingest'].handler({
      text: insight,
      tags: tags.join(','),
      sourceType,
    });
  }

  /**
   * Get statistics about augmentation
   */
  getStats() {
    return {
      enabled: this.enabled,
      nmtAvailable: !!this.nmtTools,
      cacheSize: this.cache.size,
      maxContextItems: this.maxContextItems,
    };
  }

  /**
   * Clear the context cache
   */
  clearCache() {
    this.cache.clear();
    this.emit('cache-cleared');
  }
}

// ============================================================
// Middleware for JARVIS Conversation Flow
// ============================================================

export function createContextAugmentationMiddleware(engine) {
  return async function contextAugmentationMiddleware(ctx, next) {
    // Augment the user query before processing
    if (ctx.userQuery && engine.enabled) {
      const augmentation = await engine.augmentQuery(ctx.userQuery, {
        includeInference: ctx.options?.includeInference !== false,
        includeAttractors: ctx.options?.includeAttractors !== false,
      });

      if (augmentation.augmented) {
        ctx.nmtContext = augmentation.context;
        ctx.augmentedPrompt = augmentation.context.augmentedPrompt;
      }
    }

    // Continue to next middleware/handler
    await next();

    // After processing, store insights if enabled
    if (ctx.storeInsight && ctx.assistantResponse && engine.enabled) {
      await engine.storeInsight(ctx.assistantResponse, {
        tags: ['conversation', ctx.topic || 'general'],
      });
    }
  };
}

// ============================================================
// Singleton Instance
// ============================================================

let _instance = null;

export function getContextAugmentationEngine(options = {}) {
  if (!_instance) {
    _instance = new ContextAugmentationEngine(options);
  }
  return _instance;
}

export function resetContextAugmentationEngine() {
  if (_instance) {
    _instance.clearCache();
    _instance = null;
  }
}

export default ContextAugmentationEngine;
