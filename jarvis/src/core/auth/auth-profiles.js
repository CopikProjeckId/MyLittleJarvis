// JARVIS Auth Profiles Manager
// Multi-profile authentication with rotation and cooldown
// Based on OpenClaw's auth-profiles architecture

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { EventEmitter } from 'events';

const AUTH_DIR = join(homedir(), '.jarvis', 'auth');
const PROFILES_FILE = join(AUTH_DIR, 'profiles.json');
const COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes default cooldown

// Ensure directory exists
if (!existsSync(AUTH_DIR)) {
  mkdirSync(AUTH_DIR, { recursive: true });
}

/**
 * @typedef {Object} AuthProfile
 * @property {string} id - Profile ID
 * @property {string} provider - Provider (anthropic, openai, google, etc.)
 * @property {'api_key' | 'oauth' | 'token'} type - Credential type
 * @property {string} [apiKey] - API key (for api_key type)
 * @property {string} [accessToken] - Access token (for oauth/token)
 * @property {string} [refreshToken] - Refresh token (for oauth)
 * @property {number} [expiresAt] - Token expiration
 * @property {string} [label] - Human-readable label
 * @property {boolean} enabled - Whether profile is enabled
 * @property {number} [priority] - Selection priority
 * @property {number} [lastUsedAt] - Last successful use
 * @property {number} [lastFailedAt] - Last failure time
 * @property {string} [lastFailureReason] - Last failure reason
 * @property {number} [failureCount] - Consecutive failures
 * @property {number} [cooldownUntil] - Cooldown expiration
 */

/**
 * Auth Profiles Manager
 */
export class AuthProfileManager extends EventEmitter {
  constructor(options = {}) {
    super();
    this.config = {
      cooldownMs: options.cooldownMs || COOLDOWN_MS,
      maxFailures: options.maxFailures || 3,
      autoRotate: options.autoRotate !== false
    };
    this.profiles = new Map();
    this.usage = new Map(); // profileId -> usage stats
    this.loadProfiles();
  }

  /**
   * Load profiles from disk
   */
  loadProfiles() {
    if (existsSync(PROFILES_FILE)) {
      try {
        const data = JSON.parse(readFileSync(PROFILES_FILE, 'utf-8'));
        for (const profile of data.profiles || []) {
          this.profiles.set(profile.id, profile);
        }
      } catch {
        // Ignore load errors
      }
    }

    // Load from environment variables
    this.loadFromEnv();
  }

  /**
   * Load profiles from environment variables
   */
  loadFromEnv() {
    const envMappings = [
      { env: 'ANTHROPIC_API_KEY', provider: 'anthropic', id: 'anthropic-env' },
      { env: 'OPENAI_API_KEY', provider: 'openai', id: 'openai-env' },
      { env: 'GOOGLE_API_KEY', provider: 'google', id: 'google-env' },
      { env: 'GROQ_API_KEY', provider: 'groq', id: 'groq-env' },
      { env: 'MISTRAL_API_KEY', provider: 'mistral', id: 'mistral-env' },
      { env: 'OPENROUTER_API_KEY', provider: 'openrouter', id: 'openrouter-env' }
    ];

    for (const { env, provider, id } of envMappings) {
      const apiKey = process.env[env];
      if (apiKey && !this.profiles.has(id)) {
        this.profiles.set(id, {
          id,
          provider,
          type: 'api_key',
          apiKey,
          label: `${provider} (env)`,
          enabled: true,
          priority: 50,
          source: 'env'
        });
      }
    }
  }

  /**
   * Save profiles to disk
   */
  saveProfiles() {
    try {
      const profiles = Array.from(this.profiles.values())
        .filter(p => p.source !== 'env'); // Don't save env profiles

      writeFileSync(PROFILES_FILE, JSON.stringify({
        profiles,
        savedAt: Date.now()
      }, null, 2));
    } catch (error) {
      console.error(`Failed to save profiles: ${error.message}`);
    }
  }

  /**
   * Add or update a profile
   * @param {AuthProfile} profile
   */
  upsertProfile(profile) {
    if (!profile.id || !profile.provider) {
      throw new Error('Profile must have id and provider');
    }

    const existing = this.profiles.get(profile.id);
    const merged = {
      ...existing,
      ...profile,
      updatedAt: Date.now()
    };

    this.profiles.set(profile.id, merged);
    this.saveProfiles();
    this.emit('profile:updated', { profileId: profile.id });

    return merged;
  }

  /**
   * Remove a profile
   * @param {string} profileId
   */
  removeProfile(profileId) {
    if (this.profiles.delete(profileId)) {
      this.saveProfiles();
      this.emit('profile:removed', { profileId });
      return true;
    }
    return false;
  }

  /**
   * List profiles for a provider
   * @param {string} provider
   */
  listProfiles(provider) {
    const profiles = Array.from(this.profiles.values());
    if (provider) {
      return profiles.filter(p => p.provider === provider);
    }
    return profiles;
  }

  /**
   * Get best available profile for provider
   * @param {string} provider
   */
  getBestProfile(provider) {
    const profiles = this.listProfiles(provider)
      .filter(p => p.enabled && !this.isInCooldown(p.id))
      .sort((a, b) => {
        // Sort by priority, then by last successful use
        const priorityDiff = (a.priority || 50) - (b.priority || 50);
        if (priorityDiff !== 0) return priorityDiff;
        return (b.lastUsedAt || 0) - (a.lastUsedAt || 0);
      });

    return profiles[0] || null;
  }

  /**
   * Get credential for provider (with rotation)
   * @param {string} provider
   */
  getCredential(provider) {
    const profile = this.getBestProfile(provider);
    if (!profile) return null;

    return {
      profileId: profile.id,
      provider: profile.provider,
      type: profile.type,
      apiKey: profile.apiKey,
      accessToken: profile.accessToken
    };
  }

  /**
   * Mark profile as successfully used
   * @param {string} profileId
   */
  markProfileGood(profileId) {
    const profile = this.profiles.get(profileId);
    if (!profile) return;

    profile.lastUsedAt = Date.now();
    profile.failureCount = 0;
    profile.lastFailedAt = null;
    profile.lastFailureReason = null;
    profile.cooldownUntil = null;

    this.emit('profile:success', { profileId });
  }

  /**
   * Mark profile as failed
   * @param {string} profileId
   * @param {string} [reason]
   */
  markProfileFailure(profileId, reason) {
    const profile = this.profiles.get(profileId);
    if (!profile) return;

    profile.failureCount = (profile.failureCount || 0) + 1;
    profile.lastFailedAt = Date.now();
    profile.lastFailureReason = reason;

    // Apply cooldown if too many failures
    if (profile.failureCount >= this.config.maxFailures) {
      this.applyCooldown(profileId);
    }

    this.emit('profile:failure', { profileId, reason, failureCount: profile.failureCount });
  }

  /**
   * Apply cooldown to profile
   * @param {string} profileId
   */
  applyCooldown(profileId) {
    const profile = this.profiles.get(profileId);
    if (!profile) return;

    // Exponential backoff based on failure count
    const backoffMultiplier = Math.min(profile.failureCount || 1, 5);
    const cooldownMs = this.config.cooldownMs * backoffMultiplier;

    profile.cooldownUntil = Date.now() + cooldownMs;
    this.emit('profile:cooldown', { profileId, cooldownMs, until: profile.cooldownUntil });
  }

  /**
   * Check if profile is in cooldown
   * @param {string} profileId
   */
  isInCooldown(profileId) {
    const profile = this.profiles.get(profileId);
    if (!profile?.cooldownUntil) return false;
    return Date.now() < profile.cooldownUntil;
  }

  /**
   * Clear cooldown for profile
   * @param {string} profileId
   */
  clearCooldown(profileId) {
    const profile = this.profiles.get(profileId);
    if (profile) {
      profile.cooldownUntil = null;
      profile.failureCount = 0;
      this.emit('profile:cooldown-cleared', { profileId });
    }
  }

  /**
   * Get soonest cooldown expiry across all profiles
   */
  getSoonestCooldownExpiry() {
    let soonest = null;

    for (const profile of this.profiles.values()) {
      if (profile.cooldownUntil && profile.cooldownUntil > Date.now()) {
        if (!soonest || profile.cooldownUntil < soonest) {
          soonest = profile.cooldownUntil;
        }
      }
    }

    return soonest;
  }

  /**
   * Clear expired cooldowns
   */
  clearExpiredCooldowns() {
    const now = Date.now();
    let cleared = 0;

    for (const profile of this.profiles.values()) {
      if (profile.cooldownUntil && profile.cooldownUntil <= now) {
        profile.cooldownUntil = null;
        cleared++;
      }
    }

    return cleared;
  }

  /**
   * Get profile stats
   */
  getStats() {
    const byProvider = new Map();

    for (const profile of this.profiles.values()) {
      if (!byProvider.has(profile.provider)) {
        byProvider.set(profile.provider, {
          total: 0,
          enabled: 0,
          inCooldown: 0,
          available: 0
        });
      }

      const stats = byProvider.get(profile.provider);
      stats.total++;
      if (profile.enabled) stats.enabled++;
      if (this.isInCooldown(profile.id)) stats.inCooldown++;
      if (profile.enabled && !this.isInCooldown(profile.id)) stats.available++;
    }

    return {
      totalProfiles: this.profiles.size,
      byProvider: Object.fromEntries(byProvider)
    };
  }

  /**
   * Health check - verify all profiles
   */
  async healthCheck() {
    const results = {};

    for (const profile of this.profiles.values()) {
      results[profile.id] = {
        provider: profile.provider,
        enabled: profile.enabled,
        inCooldown: this.isInCooldown(profile.id),
        hasCredential: !!(profile.apiKey || profile.accessToken),
        lastUsedAt: profile.lastUsedAt,
        failureCount: profile.failureCount || 0
      };
    }

    return results;
  }
}

// Default instance
export const defaultAuthProfileManager = new AuthProfileManager();

// Convenience exports
export const getCredential = (provider) => defaultAuthProfileManager.getCredential(provider);
export const markProfileGood = (profileId) => defaultAuthProfileManager.markProfileGood(profileId);
export const markProfileFailure = (profileId, reason) => defaultAuthProfileManager.markProfileFailure(profileId, reason);
