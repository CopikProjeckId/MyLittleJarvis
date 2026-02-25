// JARVIS Light - Test Suite

import { describe, it, expect, beforeEach } from './test-framework.js';
import { AgentRouter } from '../src/core/agent-router.js';
import { MemoryManager } from '../src/core/memory-manager.js';
import { Jarvis3Agent } from '../src/core/jarvis-3agent.js';

describe('JARVIS Core Tests', () => {
  let router;
  let memory;
  let agent;

  beforeEach(() => {
    router = new AgentRouter();
    memory = new MemoryManager();
    agent = new Jarvis3Agent();
  });

  describe('AgentRouter', () => {
    it('should route greetings to orchestrator', async () => {
      const result = await router.route('안녕하세요');
      expect(result.agent).toBe('orchestrator');
    });

    it('should route coding tasks to Claude', async () => {
      const result = await router.route('이 코드 리팩토링해줘');
      expect(result.agent).toBe('claude');
    });

    it('should route simple tasks to assistant', async () => {
      const result = await router.route('파일 목록 보여줘');
      expect(result.agent).toBe('assistant');
    });
  });

  describe('MemoryManager', () => {
    it('should add and retrieve messages', async () => {
      await memory.addMessage('user', 'Hello');
      await memory.addMessage('assistant', 'Hi there');
      
      const context = memory.getContext();
      expect(context.length).toBe(2);
    });

    it('should evict old messages (LRU)', async () => {
      for (let i = 0; i < 15; i++) {
        await memory.addMessage('user', `Message ${i}`);
      }
      
      const context = memory.getContext();
      expect(context.length).toBeLessThanOrEqual(10);
    });
  });

  describe('Jarvis3Agent', () => {
    it('should process greeting', async () => {
      const response = await agent.process('안녕하세요');
      expect(response.response).toBeDefined();
      expect(response.agent).toBeDefined();
    });

    it('should clear context', () => {
      agent.clearContext();
      expect(agent.context.length).toBe(0);
    });

    it('should return status', () => {
      const status = agent.getStatus();
      expect(status.orchestrator).toBe('loaded');
    });
  });
});

// Run tests
console.log('🧪 Running JARVIS Tests...');
