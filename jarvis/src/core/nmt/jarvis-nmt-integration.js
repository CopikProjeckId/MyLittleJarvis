// JARVIS + NMT Integration
// Wraps Jarvis3Agent with NMT context augmentation and autonomous learning
// NMT 통합 래퍼

import { EventEmitter } from 'events';
import { getNmtIntegrationManager } from './index.js';
import { nmtTools } from '../tool/tools/nmt.js';

// ============================================================
// JARVIS with NMT Integration
// ============================================================

export class JarvisWithNmt extends EventEmitter {
  constructor(jarvisInstance, options = {}) {
    super();

    this.jarvis = jarvisInstance;
    this.nmtEnabled = options.nmtEnabled !== false;
    this.nmtManager = null;
    this.contextAugmentation = options.contextAugmentation !== false;
    this.autoLearn = options.autoLearn !== false;
    this.verbose = options.verbose || false;

    // Forward JARVIS events
    if (this.jarvis) {
      this.jarvis.on('route', (data) => this.emit('route', data));
      this.jarvis.on('response', (data) => this.emit('response', data));
      this.jarvis.on('clear', () => this.emit('clear'));
    }
  }

  /**
   * Initialize NMT integration
   */
  async init() {
    if (!this.nmtEnabled) {
      this.log('NMT integration disabled');
      return this;
    }

    try {
      // Check if NMT is available
      const status = await nmtTools['nmt-status'].handler({});

      if (!status.available) {
        this.log('NMT not available, disabling integration');
        this.nmtEnabled = false;
        return this;
      }

      // Initialize NMT manager
      this.nmtManager = getNmtIntegrationManager({ nmtTools });
      await this.nmtManager.init(nmtTools);

      this.log('NMT integration initialized');
      this.emit('nmt-initialized', { stats: this.nmtManager.getStats() });

      return this;
    } catch (error) {
      this.log(`Failed to initialize NMT: ${error.message}`);
      this.nmtEnabled = false;
      return this;
    }
  }

  /**
   * Process a user input with NMT augmentation
   */
  async process(input) {
    if (!this.jarvis) {
      throw new Error('JARVIS instance not configured');
    }

    let augmentedContext = null;
    let nmtContextAddition = '';

    // 1. Augment context with NMT if enabled
    if (this.nmtEnabled && this.contextAugmentation && this.nmtManager) {
      try {
        const augmentation = await this.nmtManager.augmentQuery(input, {
          maxResults: 3,
          includeInference: true,
        });

        if (augmentation.augmented) {
          augmentedContext = augmentation.context;
          nmtContextAddition = augmentation.context.augmentedPrompt || '';

          this.log(`Context augmented with ${augmentation.context.relevantKnowledge?.length || 0} items`);
          this.emit('context-augmented', augmentation);
        }
      } catch (error) {
        this.log(`Context augmentation failed: ${error.message}`);
      }
    }

    // 2. Process with JARVIS
    const startTime = Date.now();
    let response;

    try {
      // If we have augmented context, add it to the system prompt temporarily
      if (nmtContextAddition && this.jarvis.assistant) {
        const originalPrompt = this.jarvis.assistant.systemPrompt;
        this.jarvis.assistant.systemPrompt = `${originalPrompt}\n\n${nmtContextAddition}`;

        response = await this.jarvis.process(input);

        // Restore original prompt
        this.jarvis.assistant.systemPrompt = originalPrompt;
      } else {
        response = await this.jarvis.process(input);
      }

      response.nmtContext = augmentedContext;
    } catch (error) {
      response = {
        agent: 'error',
        response: `Error: ${error.message}`,
        error: error.message,
      };
    }

    const duration = Date.now() - startTime;
    response.duration = duration;

    // 3. Record interaction for learning if enabled
    if (this.nmtEnabled && this.autoLearn && this.nmtManager && response.response) {
      try {
        const toolsUsed = [];
        if (response.agent?.startsWith('tool:')) {
          toolsUsed.push(response.agent.replace('tool:', ''));
        }

        await this.nmtManager.recordInteraction({
          userQuery: input,
          assistantResponse: response.response,
          toolsUsed,
          context: augmentedContext || {},
          sessionId: 'default',
        });

        this.log('Interaction recorded for learning');
      } catch (error) {
        this.log(`Failed to record interaction: ${error.message}`);
      }
    }

    this.emit('processed', { input, response, nmtContext: augmentedContext });
    return response;
  }

  /**
   * Process with streaming (NMT context added at start)
   */
  async *streamProcess(input) {
    if (!this.jarvis || !this.jarvis.streamProcess) {
      yield 'Streaming not available';
      return;
    }

    let augmentedContext = null;

    // Augment context first
    if (this.nmtEnabled && this.contextAugmentation && this.nmtManager) {
      try {
        const augmentation = await this.nmtManager.augmentQuery(input);
        if (augmentation.augmented) {
          augmentedContext = augmentation.context;

          // Yield context indicator
          if (augmentation.context.relevantKnowledge?.length > 0) {
            yield `[Using ${augmentation.context.relevantKnowledge.length} relevant memories]\n\n`;
          }
        }
      } catch (error) {
        this.log(`Context augmentation failed: ${error.message}`);
      }
    }

    // Stream response
    let fullResponse = '';
    for await (const chunk of this.jarvis.streamProcess(input)) {
      fullResponse += chunk;
      yield chunk;
    }

    // Record interaction after streaming completes
    if (this.nmtEnabled && this.autoLearn && this.nmtManager && fullResponse) {
      try {
        await this.nmtManager.recordInteraction({
          userQuery: input,
          assistantResponse: fullResponse,
          toolsUsed: [],
          context: augmentedContext || {},
          sessionId: 'default',
        });
      } catch (error) {
        this.log(`Failed to record interaction: ${error.message}`);
      }
    }
  }

  /**
   * Provide feedback for an interaction
   */
  async provideFeedback(interactionId, feedback) {
    if (!this.nmtManager) {
      return { error: 'NMT not initialized' };
    }

    return this.nmtManager.updateFeedback(interactionId, feedback);
  }

  /**
   * Trigger a learning cycle manually
   */
  async triggerLearning() {
    if (!this.nmtManager) {
      return { error: 'NMT not initialized' };
    }

    this.log('Triggering learning cycle...');
    const results = await this.nmtManager.triggerLearning();
    this.emit('learning-complete', results);
    return results;
  }

  /**
   * Search NMT knowledge base
   */
  async searchKnowledge(query, options = {}) {
    if (!nmtTools['nmt-search']) {
      return { error: 'NMT search not available' };
    }

    return nmtTools['nmt-search'].handler({
      query,
      topK: options.topK || 5,
      includeContent: options.includeContent !== false,
    });
  }

  /**
   * Ingest knowledge into NMT
   */
  async ingestKnowledge(text, options = {}) {
    if (!nmtTools['nmt-ingest']) {
      return { error: 'NMT ingest not available' };
    }

    return nmtTools['nmt-ingest'].handler({
      text,
      tags: options.tags,
      sourceType: options.sourceType || 'jarvis-knowledge',
    });
  }

  /**
   * Get comprehensive status
   */
  getStatus() {
    const jarvisStatus = this.jarvis?.getStatus() || {};

    return {
      ...jarvisStatus,
      nmt: {
        enabled: this.nmtEnabled,
        contextAugmentation: this.contextAugmentation,
        autoLearn: this.autoLearn,
        stats: this.nmtManager?.getStats() || null,
      },
    };
  }

  /**
   * Get NMT learning statistics
   */
  getLearningStats() {
    return this.nmtManager?.getStats() || null;
  }

  /**
   * Clear JARVIS context
   */
  clearContext() {
    if (this.jarvis) {
      this.jarvis.clearContext();
    }
  }

  /**
   * Health check including NMT
   */
  async healthCheck() {
    const jarvisHealth = this.jarvis?.healthCheck
      ? await this.jarvis.healthCheck()
      : { healthy: false };

    let nmtHealth = { available: false };

    if (this.nmtEnabled) {
      try {
        const status = await nmtTools['nmt-status'].handler({});
        nmtHealth = {
          available: status.available,
          stats: status.stats,
        };
      } catch (error) {
        nmtHealth = { available: false, error: error.message };
      }
    }

    return {
      ...jarvisHealth,
      nmt: nmtHealth,
      healthy: jarvisHealth.healthy && (!this.nmtEnabled || nmtHealth.available),
    };
  }

  /**
   * Enable/disable NMT features
   */
  setNmtOptions(options) {
    if (options.enabled !== undefined) {
      this.nmtEnabled = options.enabled;
    }
    if (options.contextAugmentation !== undefined) {
      this.contextAugmentation = options.contextAugmentation;
    }
    if (options.autoLearn !== undefined) {
      this.autoLearn = options.autoLearn;
    }
    if (options.verbose !== undefined) {
      this.verbose = options.verbose;
    }
  }

  /**
   * Internal logging
   */
  log(message) {
    if (this.verbose) {
      console.log(`[JARVIS+NMT] ${message}`);
    }
  }
}

// ============================================================
// Factory Function
// ============================================================

/**
 * Create a JARVIS instance with NMT integration
 */
export async function createJarvisWithNmt(jarvisInstance, options = {}) {
  const wrapper = new JarvisWithNmt(jarvisInstance, options);
  await wrapper.init();
  return wrapper;
}

export default JarvisWithNmt;
