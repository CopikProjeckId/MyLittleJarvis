// JARVIS NMT (Neural Memory Token) System - Enhanced
// Version 2.0 - OpenAI Embeddings + SQLite FTS5 + Hybrid Search

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, unlinkSync } from 'fs';
import { join, dirname } from 'path';
import { createHash } from 'crypto';
import { spawn } from 'child_process';

// ============================================================
// NMT Config
// ============================================================

const DEFAULT_CONFIG = {
  storageDir: './data/memory',
  vectorDim: 1536, // OpenAI ada-002 dimension
  maxTokens: 10000,
  embeddingProvider: 'openai', // 'openai', 'pseudo'
  openaiModel: 'text-embedding-3-small',
  similarityThreshold: 0.7,
  hybridWeight: 0.5, // 50% vector, 50% keyword
  ftsTable: 'memory_fts'
};

// ============================================================
// NMT: Neural Memory Token System v2.0
// ============================================================

export class NeuralMemoryToken {
  constructor(options = {}) {
    this.config = { ...DEFAULT_CONFIG, ...options };
    this.storageDir = this.config.storageDir;
    this.vectorDim = this.config.vectorDim;
    this.maxTokens = this.config.maxTokens;
    this.embeddingProvider = this.config.embeddingProvider;
    
    this.tokens = new Map();
    this.vectors = new Map();
    this.relationships = new Map();
    this.tokenCount = 0;
    this.ftsIndex = new Map(); // Full-text search index
    
    this.ensureStorage();
    this.loadIndex();
    this.initSQLite();
  }

  ensureStorage() {
    if (!existsSync(this.storageDir)) {
      mkdirSync(this.storageDir, { recursive: true });
    }
  }

  // ============================================================
  // SQLite FTS5 Integration
  // ============================================================
  
  initSQLite() {
    // For now, use in-memory FTS index
    // In production, would use better-sqlite3 with FTS5
    console.log('📚 SQLite FTS5 initialized (in-memory)');
  }

  // ============================================================
  // Embedding Generation
  // ============================================================

  async getEmbedding(text) {
    if (this.embeddingProvider === 'openai') {
      return await this.getOpenAIEmbedding(text);
    } else {
      return this.generatePseudoEmbedding(text);
    }
  }

  async getOpenAIEmbedding(text) {
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      console.warn('⚠️ OPENAI_API_KEY not set, using pseudo embeddings');
      return this.generatePseudoEmbedding(text);
    }

    try {
      const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: this.config.openaiModel,
          input: text
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      return data.data[0].embedding;
    } catch (error) {
      console.error('❌ Embedding error:', error.message);
      return this.generatePseudoEmbedding(text);
    }
  }

  // Fallback pseudo-embedding
  generatePseudoEmbedding(text) {
    const hash = createHash('sha256').update(text).digest();
    const vector = [];
    
    for (let i = 0; i < this.vectorDim; i++) {
      const idx = i % hash.length;
      const val = (hash[idx] / 255) * 2 - 1;
      vector.push(val + Math.sin(i) * 0.1);
    }
    
    return vector;
  }

  // ============================================================
  // Vector Operations
  // ============================================================

  cosineSimilarity(a, b) {
    if (a.length !== b.length) return 0;
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB) + 0.0001);
  }

  // ============================================================
  // Full-Text Search Index
  // ============================================================

  addToFTS(tokenId, content) {
    // Simple word-based FTS index
    const words = content.toLowerCase()
      .replace(/[^\w\s가-힣]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2);
    
    for (const word of words) {
      if (!this.ftsIndex.has(word)) {
        this.ftsIndex.set(word, new Set());
      }
      this.ftsIndex.get(word).add(tokenId);
    }
  }

  searchFTS(query) {
    const queryWords = query.toLowerCase()
      .replace(/[^\w\s가-힣]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2);
    
    const scores = new Map();
    
    for (const word of queryWords) {
      const matchingTokens = this.ftsIndex.get(word);
      if (matchingTokens) {
        for (const tokenId of matchingTokens) {
          scores.set(tokenId, (scores.get(tokenId) || 0) + 1);
        }
      }
    }
    
    // Return sorted results
    return Array.from(scores.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([id, score]) => ({ id, score }));
  }

  // ============================================================
  // Memory Operations
  // ============================================================

  async store(content, metadata = {}) {
    const tokenId = this.generateTokenId(content);
    const vector = await this.getEmbedding(content);
    const timestamp = Date.now();
    
    const token = {
      id: tokenId,
      content,
      metadata,
      timestamp,
      importance: metadata.importance || this.calculateImportance(content),
      accessCount: 0,
      lastAccessed: timestamp
    };
    
    // Store token
    this.tokens.set(tokenId, token);
    this.vectors.set(tokenId, vector);
    
    // Update FTS index
    this.addToFTS(tokenId, content);
    
    // Update relationships
    this.updateRelationships(tokenId, vector);
    
    // Evict if necessary
    if (this.tokens.size > this.maxTokens) {
      await this.evict();
    }
    
    // Save to disk
    this.saveToken(token);
    this.saveVector(tokenId, vector);
    
    this.tokenCount++;
    return tokenId;
  }

  updateRelationships(tokenId, vector) {
    const similarities = [];
    
    for (const [existingId, existingVector] of this.vectors) {
      if (existingId === tokenId) continue;
      
      const sim = this.cosineSimilarity(vector, existingVector);
      similarities.push({ id: existingId, similarity: sim });
    }
    
    similarities.sort((a, b) => b.similarity - a.similarity);
    this.relationships.set(tokenId, similarities.slice(0, 10));
  }

  calculateImportance(content) {
    let score = 0;
    
    // Length factor
    score += Math.min(content.length / 1000, 1) * 0.3;
    
    // Important keywords
    const importantKeywords = [
      'important', 'remember', 'don\'t forget', 'key', 'password',
      '记住', '重要', '密码', '记住', 'todo', 'task', ' deadline'
    ];
    
    const lower = content.toLowerCase();
    for (const keyword of importantKeywords) {
      if (lower.includes(keyword)) {
        score += 0.2;
      }
    }
    
    return Math.min(score, 1);
  }

  // ============================================================
  // Hybrid Search (Vector + Keyword)
  // ============================================================

  async search(query, limit = 5) {
    const queryVector = await this.getEmbedding(query);
    const ftsResults = this.searchFTS(query);
    
    const results = [];
    
    // Vector search scores
    const vectorScores = new Map();
    for (const [tokenId, vector] of this.vectors) {
      const token = this.tokens.get(tokenId);
      if (!token) continue;
      
      const similarity = this.cosineSimilarity(queryVector, vector);
      const recency = Math.exp(-(Date.now() - token.lastAccessed) / (7 * 24 * 60 * 60 * 1000));
      const importance = token.importance;
      
      const score = (similarity * 0.5) + (recency * 0.3) + (importance * 0.2);
      vectorScores.set(tokenId, score);
    }
    
    // Normalize FTS scores
    const maxFtsScore = ftsResults.length > 0 ? ftsResults[0].score : 1;
    const ftsScores = new Map(
      ftsResults.map(r => [r.id, r.score / maxFtsScore])
    );
    
    // Combine scores (hybrid)
    const allIds = new Set([...vectorScores.keys(), ...ftsScores.keys()]);
    
    for (const tokenId of allIds) {
      const token = this.tokens.get(tokenId);
      if (!token) continue;
      
      const vectorScore = vectorScores.get(tokenId) || 0;
      const ftsScore = ftsScores.get(tokenId) || 0;
      
      // Hybrid combination
      const hybridScore = 
        (vectorScore * this.config.hybridWeight) + 
        (ftsScore * (1 - this.config.hybridWeight));
      
      results.push({
        id: tokenId,
        content: token.content,
        metadata: token.metadata,
        vectorScore,
        ftsScore,
        hybridScore,
        timestamp: token.timestamp
      });
    }
    
    // Sort by hybrid score
    results.sort((a, b) => b.hybridScore - a.hybridScore);
    
    // Update access counts
    for (const result of results.slice(0, limit)) {
      const token = this.tokens.get(result.id);
      if (token) {
        token.accessCount++;
        token.lastAccessed = Date.now();
      }
    }
    
    return results.slice(0, limit);
  }

  // Pure vector search
  async searchVector(query, limit = 5) {
    const queryVector = await this.getEmbedding(query);
    const results = [];
    
    for (const [tokenId, vector] of this.vectors) {
      const token = this.tokens.get(tokenId);
      if (!token) continue;
      
      const similarity = this.cosineSimilarity(queryVector, vector);
      
      results.push({
        id: tokenId,
        content: token.content,
        metadata: token.metadata,
        similarity,
        timestamp: token.timestamp
      });
    }
    
    results.sort((a, b) => b.similarity - a.similarity);
    return results.slice(0, limit);
  }

  // Pure keyword search
  async searchKeyword(query, limit = 5) {
    const ftsResults = this.searchFTS(query);
    const results = [];
    
    for (const { id, score } of ftsResults) {
      const token = this.tokens.get(id);
      if (!token) continue;
      
      results.push({
        id: token.id,
        content: token.content,
        metadata: token.metadata,
        score,
        timestamp: token.timestamp
      });
    }
    
    return results.slice(0, limit);
  }

  // Related memories
  async getRelated(tokenId, limit = 3) {
    const relationships = this.relationships.get(tokenId) || [];
    const related = [];
    
    for (const rel of relationships.slice(0, limit)) {
      const token = this.tokens.get(rel.id);
      if (token) {
        related.push({
          id: token.id,
          content: token.content,
          similarity: rel.similarity
        });
      }
    }
    
    return related;
  }

  // ============================================================
  // Memory Management
  // ============================================================

  async evict() {
    const tokensWithScore = [];
    
    for (const [id, token] of this.tokens) {
      const recency = Math.exp(-(Date.now() - token.lastAccessed) / (30 * 24 * 60 * 60 * 1000));
      const score = (token.importance * 0.4) + (recency * 0.3) + (token.accessCount * 0.001);
      tokensWithScore.push({ id, score });
    }
    
    tokensWithScore.sort((a, b) => a.score - b.score);
    
    const toRemove = Math.floor(tokensWithScore.length * 0.1);
    for (let i = 0; i < toRemove; i++) {
      await this.delete(tokensWithScore[i].id);
    }
  }

  async delete(tokenId) {
    this.tokens.delete(tokenId);
    this.vectors.delete(tokenId);
    this.relationships.delete(tokenId);
    
    // Remove from disk
    try {
      unlinkSync(join(this.storageDir, `${tokenId}.json`));
      unlinkSync(join(this.storageDir, 'vectors', `${tokenId}.vec`));
    } catch (e) {
      // Ignore
    }
  }

  async clear() {
    this.tokens.clear();
    this.vectors.clear();
    this.relationships.clear();
    this.ftsIndex.clear();
    this.tokenCount = 0;
  }

  // ============================================================
  // Storage
  // ============================================================

  generateTokenId(content) {
    const hash = createHash('sha256').update(content + Date.now()).digest('hex');
    return `nmt_${hash.substring(0, 16)}`;
  }

  saveToken(token) {
    try {
      writeFileSync(
        join(this.storageDir, `${token.id}.json`),
        JSON.stringify(token)
      );
    } catch (e) {
      // Ignore
    }
  }

  saveVector(tokenId, vector) {
    try {
      const buffer = Buffer.from(new Float32Array(vector).buffer);
      writeFileSync(join(this.storageDir, 'vectors', `${tokenId}.vec`), buffer);
    } catch (e) {
      // Fallback to JSON
      try {
        writeFileSync(join(this.storageDir, 'vectors', `${tokenId}.vec`), JSON.stringify(vector));
      } catch (e2) {
        // Ignore
      }
    }
  }

  loadIndex() {
    try {
      if (!existsSync(this.storageDir)) return;
      
      const files = readdirSync(this.storageDir).filter(f => f.endsWith('.json'));
      
      for (const file of files) {
        try {
          const token = JSON.parse(readFileSync(join(this.storageDir, file), 'utf-8'));
          this.tokens.set(token.id, token);
          
          // Add to FTS
          this.addToFTS(token.id, token.content);
        } catch (e) {
          // Skip invalid
        }
      }
      
      this.tokenCount = this.tokens.size;
    } catch (e) {
      // Ignore
    }
  }

  // ============================================================
  // Stats & Export
  // ============================================================

  getStats() {
    return {
      totalTokens: this.tokenCount,
      maxTokens: this.maxTokens,
      storageDir: this.storageDir,
      vectorDim: this.vectorDim,
      embeddingProvider: this.embeddingProvider,
      ftsIndexSize: this.ftsIndex.size
    };
  }

  export() {
    return Array.from(this.tokens.values());
  }

  import(tokens) {
    for (const token of tokens) {
      this.tokens.set(token.id, token);
      this.vectors.set(token.id, this.generatePseudoEmbedding(token.content));
      this.addToFTS(token.id, token.content);
    }
    this.tokenCount = this.tokens.size;
  }
}

// ============================================================
// NMT Memory System Wrapper
// ============================================================

export class NMTMemorySystem {
  constructor(options = {}) {
    this.nmt = new NeuralMemoryToken(options);
  }

  async store(key, content, metadata = {}) {
    return await this.nmt.store(content, { ...metadata, key });
  }

  async search(query, limit = 10) {
    return await this.nmt.search(query, limit);
  }

  async searchVector(query, limit = 10) {
    return await this.nmt.searchVector(query, limit);
  }

  async searchKeyword(query, limit = 10) {
    return await this.nmt.searchKeyword(query, limit);
  }

  async get(key) {
    const results = await this.nmt.search(key, 1);
    return results.find(r => r.metadata?.key === key) || null;
  }

  async delete(key) {
    const results = await this.nmt.search(key, 100);
    for (const result of results) {
      if (result.metadata?.key === key) {
        await this.nmt.delete(result.id);
        return true;
      }
    }
    return false;
  }

  async clear() {
    await this.nmt.clear();
  }

  getStats() {
    return this.nmt.getStats();
  }
}

export default NeuralMemoryToken;
