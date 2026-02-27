// JARVIS Memory Engine
// Core: OpenClaw's memory-core equivalent
// Features: Vector DB, Chunking, Hybrid Search, Persistence

import { EventEmitter } from 'events';
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, unlinkSync } from 'fs';
import { join } from 'path';
import { createHash } from 'crypto';

// ============================================================
// Chunking Strategy
// ============================================================

export class ChunkingStrategy {
  constructor(options = {}) {
    this.maxChunkSize = options.maxChunkSize || 512;
    this.overlap = options.overlap || 50;
    this.minChunkSize = options.minChunkSize || 100;
  }

  // Split text into chunks
  chunk(text, metadata = {}) {
    const chunks = [];
    const sentences = this.splitSentences(text);
    
    let currentChunk = '';
    let currentSize = 0;

    for (const sentence of sentences) {
      const sentenceSize = this.countTokens(sentence);
      
      if (currentSize + sentenceSize > this.maxChunkSize && currentSize > this.minChunkSize) {
        chunks.push({
          content: currentChunk.trim(),
          tokens: currentSize,
          metadata: { ...metadata, index: chunks.length }
        });
        
        // Keep overlap
        const overlapText = this.getOverlapText(currentChunk);
        currentChunk = overlapText + ' ' + sentence;
        currentSize = this.countTokens(currentChunk);
      } else {
        currentChunk += (currentChunk ? ' ' : '') + sentence;
        currentSize += sentenceSize;
      }
    }

    // Add final chunk
    if (currentChunk.trim()) {
      chunks.push({
        content: currentChunk.trim(),
        tokens: currentSize,
        metadata: { ...metadata, index: chunks.length }
      });
    }

    return chunks;
  }

  splitSentences(text) {
    // Split by sentence-ending punctuation
    return text
      .split(/(?<=[.!?。！？])\s+/)
      .map(s => s.trim())
      .filter(s => s.length > 0);
  }

  getOverlapText(text) {
    const words = text.split(/\s+/);
    return words.slice(-Math.floor(this.overlap / 6)).join(' ');
  }

  countTokens(text) {
    const english = (text.match(/[a-zA-Z]/g) || []).length;
    const korean = (text.match(/[가-힣]/g) || []).length;
    const other = text.length - english - korean;
    return Math.ceil(english / 4 + korean / 2 + other / 4);
  }
}

// ============================================================
// Vector Store (In-Memory)
// ============================================================

export class VectorStore {
  constructor(options = {}) {
    this.dimension = options.dimension || 1536;
    this.vectors = new Map(); // id -> { vector, metadata }
    this.index = new Map(); // keyword -> Set of ids
  }

  // Add vectors
  async add(id, vector, metadata = {}) {
    this.vectors.set(id, { vector, metadata });
    
    // Build keyword index
    const words = this.extractKeywords(metadata.content || '');
    for (const word of words) {
      if (!this.index.has(word)) {
        this.index.set(word, new Set());
      }
      this.index.get(word).add(id);
    }
  }

  // Search by vector similarity
  async search(queryVector, options = {}) {
    const { limit = 10, threshold = 0.0 } = options;
    
    const results = [];
    
    for (const [id, data] of this.vectors) {
      const similarity = this.cosineSimilarity(queryVector, data.vector);
      
      if (similarity >= threshold) {
        results.push({
          id,
          similarity,
          metadata: data.metadata
        });
      }
    }

    // Sort by similarity
    results.sort((a, b) => b.similarity - a.similarity);
    
    return results.slice(0, limit);
  }

  // Keyword search
  async searchByKeyword(keywords, options = {}) {
    const { limit = 10 } = options;
    
    const candidateIds = new Set();
    
    for (const keyword of keywords) {
      const normalized = keyword.toLowerCase();
      if (this.index.has(normalized)) {
        for (const id of this.index.get(normalized)) {
          candidateIds.add(id);
        }
      }
    }

    const results = [];
    for (const id of candidateIds) {
      const data = this.vectors.get(id);
      if (data) {
        results.push({
          id,
          metadata: data.metadata,
          keywordMatch: true
        });
      }
    }

    return results.slice(0, limit);
  }

  // Hybrid search
  async hybridSearch(queryVector, keywords, options = {}) {
    const { limit = 10, vectorWeight = 0.5, keywordWeight = 0.5 } = options;
    
    const vectorResults = await this.search(queryVector, { limit: limit * 2 });
    const keywordResults = await this.searchByKeyword(keywords, { limit: limit * 2 });
    
    // Score combination
    const scores = new Map();
    
    for (const result of vectorResults) {
      scores.set(result.id, {
        ...result,
        vectorScore: result.similarity,
        keywordScore: 0,
        combinedScore: result.similarity * vectorWeight
      });
    }
    
    for (const result of keywordResults) {
      const existing = scores.get(result.id);
      if (existing) {
        existing.keywordScore = 1;
        existing.combinedScore = (existing.vectorScore * vectorWeight) + (1 * keywordWeight);
      } else {
        scores.set(result.id, {
          ...result,
          vectorScore: 0,
          keywordScore: 1,
          combinedScore: 1 * keywordWeight
        });
      }
    }

    // Sort by combined score
    const results = Array.from(scores.values())
      .sort((a, b) => b.combinedScore - a.combinedScore)
      .slice(0, limit);

    return results;
  }

  // Delete
  async delete(id) {
    this.vectors.delete(id);
  }

  // Clear
  async clear() {
    this.vectors.clear();
    this.index.clear();
  }

  // Stats
  getStats() {
    return {
      totalVectors: this.vectors.size,
      indexSize: this.index.size
    };
  }

  // Helpers
  extractKeywords(text) {
    return text
      .toLowerCase()
      .replace(/[^\w\s가-힣]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2)
      .filter(w => !this.isCommonWord(w));
  }

  isCommonWord(word) {
    const common = new Set(['the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', '이', '는', '은', '가', '을', '를', '의', '에', '에서', '와', '과', '도', '로', '으로']);
    return common.has(word);
  }

  cosineSimilarity(a, b) {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < Math.min(a.length, b.length); i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB) + 0.0001);
  }

  // Generate pseudo-embedding (fallback)
  generateEmbedding(text) {
    const hash = createHash('sha256').update(text).digest();
    const vector = [];
    
    for (let i = 0; i < this.dimension; i++) {
      const idx = i % hash.length;
      vector.push((hash[idx] / 255) * 2 - 1);
    }
    
    return vector;
  }
}

// ============================================================
// Memory Engine (Core)
// ============================================================

export class MemoryEngine extends EventEmitter {
  constructor(options = {}) {
    super();
    this.storageDir = options.storageDir || './data/memory';
    this.chunking = new ChunkingStrategy(options.chunking);
    this.vectorStore = new VectorStore(options.vectorStore);
    this.documents = new Map(); // docId -> { chunks, metadata }
    this.sources = options.sources || ['memory', 'workspace', 'plugin'];
    this.maxDocuments = options.maxDocuments || 1000;
    
    this.ensureStorage();
    this.loadIndex();
  }

  ensureStorage() {
    if (!existsSync(this.storageDir)) {
      mkdirSync(this.storageDir, { recursive: true });
    }
    if (!existsSync(join(this.storageDir, 'vectors'))) {
      mkdirSync(join(this.storageDir, 'vectors'), { recursive: true });
    }
    if (!existsSync(join(this.storageDir, 'chunks'))) {
      mkdirSync(join(this.storageDir, 'chunks'), { recursive: true });
    }
  }

  // Store document with chunking
  async storeDocument(content, metadata = {}) {
    const docId = this.generateId(content);
    const source = metadata.source || 'memory';
    
    // Chunk content
    const chunks = this.chunking.chunk(content, {
      ...metadata,
      docId,
      source
    });

    // Generate embeddings and store
    for (const chunk of chunks) {
      const chunkId = `${docId}_${chunk.metadata.index}`;
      const vector = this.vectorStore.generateEmbedding(chunk.content);
      
      await this.vectorStore.add(chunkId, vector, {
        content: chunk.content,
        docId,
        source,
        ...chunk.metadata
      });
    }

    // Store document metadata
    const document = {
      id: docId,
      content,
      chunks: chunks.length,
      metadata,
      source,
      storedAt: Date.now(),
      accessedAt: Date.now(),
      accessCount: 0
    };

    this.documents.set(docId, document);
    this.saveDocument(document);
    
    this.emit('stored', { docId, chunks: chunks.length, source });
    
    // Evict if needed
    if (this.documents.size > this.maxDocuments) {
      await this.evict();
    }

    return docId;
  }

  // Search across all sources
  async search(query, options = {}) {
    const { limit = 10, sources, hybrid = true } = options;
    
    const queryVector = this.vectorStore.generateEmbedding(query);
    const keywords = this.vectorStore.extractKeywords(query);
    
    let results;
    
    if (hybrid) {
      results = await this.vectorStore.hybridSearch(queryVector, keywords, {
        limit,
        vectorWeight: 0.6,
        keywordWeight: 0.4
      });
    } else {
      results = await this.vectorStore.search(queryVector, { limit });
    }

    // Enrich with document context
    const enriched = [];
    const seenDocs = new Set();
    
    for (const result of results) {
      const doc = this.documents.get(result.metadata.docId);
      if (!doc) continue;
      
      // Update access
      doc.accessCount++;
      doc.accessedAt = Date.now();
      
      // Filter by source
      if (sources && !sources.includes(doc.source)) {
        continue;
      }
      
      // Avoid duplicates
      if (seenDocs.has(doc.id)) continue;
      seenDocs.add(doc.id);

      // Get related chunks
      const relatedChunks = this.getRelatedChunks(doc.id, result.metadata.index);
      
      enriched.push({
        docId: doc.id,
        content: result.metadata.content,
        chunkIndex: result.metadata.index,
        score: result.combinedScore || result.similarity,
        source: doc.source,
        metadata: doc.metadata,
        relatedChunks
      });
    }

    this.emit('search', { query, results: enriched.length });
    
    return enriched;
  }

  // Get related chunks
  getRelatedChunks(docId, currentIndex, count = 2) {
    const chunks = [];
    const doc = this.documents.get(docId);
    if (!doc) return chunks;

    for (let i = Math.max(0, currentIndex - count); i <= currentIndex + count; i++) {
      if (i !== currentIndex && i >= 0) {
        const chunkId = `${docId}_${i}`;
        const data = this.vectorStore.vectors.get(chunkId);
        if (data) {
          chunks.push({
            index: i,
            content: data.metadata.content
          });
        }
      }
    }

    return chunks;
  }

  // Get document
  async getDocument(docId) {
    const doc = this.documents.get(docId);
    if (doc) {
      doc.accessCount++;
      doc.accessedAt = Date.now();
    }
    return doc || null;
  }

  // Delete document
  async deleteDocument(docId) {
    const doc = this.documents.get(docId);
    if (!doc) return false;

    // Delete chunks from vector store
    for (let i = 0; i < doc.chunks; i++) {
      await this.vectorStore.delete(`${docId}_${i}`);
    }

    // Delete from documents
    this.documents.delete(docId);
    
    // Delete from disk
    try {
      unlinkSync(join(this.storageDir, `${docId}.json`));
    } catch (e) {
      // File may not exist on disk - non-critical
    }

    this.emit('deleted', { docId });
    return true;
  }

  // Evict least accessed documents
  async evict() {
    const docs = Array.from(this.documents.values());
    
    docs.sort((a, b) => {
      // Sort by: accessCount (asc) then age (desc)
      const scoreA = a.accessCount / (Date.now() - a.storedAt);
      const scoreB = b.accessCount / (Date.now() - b.storedAt);
      return scoreA - scoreB;
    });

    // Remove bottom 10%
    const toRemove = Math.floor(docs.length * 0.1);
    for (let i = 0; i < toRemove; i++) {
      await this.deleteDocument(docs[i].id);
    }
  }

  // Clear all
  async clear(source) {
    if (source) {
      // Clear specific source
      const toDelete = [];
      for (const [id, doc] of this.documents) {
        if (doc.source === source) {
          toDelete.push(id);
        }
      }
      for (const id of toDelete) {
        await this.deleteDocument(id);
      }
    } else {
      // Clear all
      this.documents.clear();
      await this.vectorStore.clear();
    }
    
    this.emit('cleared', { source });
  }

  // Persistence
  saveDocument(doc) {
    try {
      writeFileSync(
        join(this.storageDir, `${doc.id}.json`),
        JSON.stringify(doc, null, 2)
      );
    } catch (e) {
      console.warn(`Failed to save document ${doc.id}:`, e.message);
    }
  }

  loadIndex() {
    try {
      if (!existsSync(this.storageDir)) return;

      const files = readdirSync(this.storageDir).filter(f => f.endsWith('.json'));

      for (const file of files) {
        try {
          const doc = JSON.parse(readFileSync(join(this.storageDir, file), 'utf-8'));
          this.documents.set(doc.id, doc);
        } catch (e) {
          // Skip corrupted document files
          console.warn(`Failed to load document ${file}:`, e.message);
        }
      }

      // Rebuild vector store
      for (const [id, doc] of this.documents) {
        // Would load from disk in production
      }
    } catch (e) {
      console.warn('Failed to load memory index:', e.message);
    }
  }

  generateId(content) {
    const hash = createHash('sha256').update(content + Date.now()).digest('hex');
    return `mem_${hash.substring(0, 16)}`;
  }

  // Stats
  getStats() {
    const sourceCounts = {};
    for (const doc of this.documents.values()) {
      sourceCounts[doc.source] = (sourceCounts[doc.source] || 0) + 1;
    }

    return {
      totalDocuments: this.documents.size,
      totalChunks: Array.from(this.documents.values()).reduce((sum, d) => sum + d.chunks, 0),
      sources: sourceCounts,
      vectorStore: this.vectorStore.getStats()
    };
  }
}

export default MemoryEngine;
