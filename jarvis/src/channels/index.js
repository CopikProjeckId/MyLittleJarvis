// JARVIS Channel Manager
// Unified interface for all messaging channels
// OpenClaw-compatible multi-channel support

import { EventEmitter } from 'events';

// Channel adapters
import { DiscordChannel } from './discord.js';
import { SlackChannel } from './slack.js';
import { TelegramBot } from '../telegram/bot.js';
import { WhatsAppChannel } from './whatsapp.js';
import { SignalChannel } from './signal.js';

// Channel registry
export const CHANNEL_REGISTRY = {
  discord: DiscordChannel,
  slack: SlackChannel,
  telegram: TelegramBot,
  whatsapp: WhatsAppChannel,
  signal: SignalChannel
};

export class ChannelManager extends EventEmitter {
  constructor(options = {}) {
    super();
    this.channels = new Map();
    this.messageHandler = options.messageHandler || null;
    this.config = options.config || {};
  }

  // Register a channel
  async addChannel(name, channelOrConfig) {
    let channel;

    if (channelOrConfig instanceof EventEmitter) {
      // Already instantiated channel
      channel = channelOrConfig;
    } else {
      // Config object - create channel
      const ChannelClass = CHANNEL_REGISTRY[name];
      if (!ChannelClass) {
        throw new Error(`Unknown channel type: ${name}`);
      }
      channel = new ChannelClass(channelOrConfig);
    }

    // Attach message handler
    if (this.messageHandler) {
      if (channel.setMessageHandler) {
        channel.setMessageHandler(this.createWrappedHandler(name));
      } else if (channel.onMessage) {
        channel.onMessage(this.createWrappedHandler(name));
      }
    }

    // Forward events
    channel.on('message', (msg) => this.emit('message', { channel: name, ...msg }));
    channel.on('ready', () => this.emit('channelReady', name));
    channel.on('error', (err) => this.emit('channelError', { channel: name, error: err }));

    this.channels.set(name, channel);
    return channel;
  }

  // Create wrapped handler that includes channel context
  createWrappedHandler(channelName) {
    return async (text, context = {}) => {
      if (!this.messageHandler) return null;

      const enrichedContext = {
        ...context,
        channel: channelName,
        timestamp: Date.now()
      };

      return this.messageHandler(text, enrichedContext);
    };
  }

  // Start specific channel
  async startChannel(name) {
    const channel = this.channels.get(name);
    if (!channel) {
      throw new Error(`Channel not found: ${name}`);
    }

    try {
      await channel.start();
      console.log(`✅ Channel started: ${name}`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to start channel ${name}:`, error.message);
      throw error;
    }
  }

  // Stop specific channel
  async stopChannel(name) {
    const channel = this.channels.get(name);
    if (!channel) return false;

    try {
      await channel.stop();
      console.log(`⏹️ Channel stopped: ${name}`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to stop channel ${name}:`, error.message);
      return false;
    }
  }

  // Start all registered channels
  async startAll() {
    const results = [];

    for (const [name, channel] of this.channels) {
      try {
        await channel.start();
        results.push({ channel: name, success: true });
      } catch (error) {
        results.push({ channel: name, success: false, error: error.message });
      }
    }

    return results;
  }

  // Stop all channels
  async stopAll() {
    for (const [name, channel] of this.channels) {
      try {
        await channel.stop();
      } catch (error) {
        console.error(`Error stopping ${name}:`, error.message);
      }
    }
  }

  // Send message to specific channel
  async send(channelName, recipient, content, options = {}) {
    const channel = this.channels.get(channelName);
    if (!channel) {
      throw new Error(`Channel not found: ${channelName}`);
    }

    return await channel.sendMessage(recipient, content, options);
  }

  // Broadcast to all channels
  async broadcast(content, recipients = {}) {
    const results = [];

    for (const [name, channel] of this.channels) {
      if (!channel.isActive || !channel.isActive()) continue;

      const recipientId = recipients[name];
      if (!recipientId) continue;

      try {
        await channel.sendMessage(recipientId, content);
        results.push({ channel: name, success: true });
      } catch (error) {
        results.push({ channel: name, success: false, error: error.message });
      }
    }

    return results;
  }

  // Set global message handler
  setMessageHandler(handler) {
    this.messageHandler = handler;

    // Update existing channels
    for (const [name, channel] of this.channels) {
      const wrappedHandler = this.createWrappedHandler(name);
      if (channel.setMessageHandler) {
        channel.setMessageHandler(wrappedHandler);
      } else if (channel.onMessage) {
        channel.onMessage(wrappedHandler);
      }
    }
  }

  // Get channel status
  getStatus() {
    const status = {};

    for (const [name, channel] of this.channels) {
      if (channel.getStatus) {
        status[name] = channel.getStatus();
      } else {
        status[name] = {
          platform: name,
          running: channel.isActive?.() || channel.isRunning || false
        };
      }
    }

    return status;
  }

  // Get specific channel
  getChannel(name) {
    return this.channels.get(name);
  }

  // List all registered channels
  listChannels() {
    return Array.from(this.channels.keys());
  }

  // Check if channel exists and is active
  isChannelActive(name) {
    const channel = this.channels.get(name);
    if (!channel) return false;
    return channel.isActive?.() || channel.isRunning || false;
  }
}

// Factory function for quick setup
export async function createChannelManager(config = {}) {
  const manager = new ChannelManager({ messageHandler: config.messageHandler });

  // Auto-configure channels based on environment
  if (config.discord?.token || process.env.DISCORD_BOT_TOKEN) {
    await manager.addChannel('discord', config.discord || {});
  }

  if (config.telegram?.token || process.env.TELEGRAM_BOT_TOKEN) {
    await manager.addChannel('telegram', config.telegram || {});
  }

  if (config.slack?.token || process.env.SLACK_BOT_TOKEN) {
    await manager.addChannel('slack', config.slack || {});
  }

  if (config.whatsapp?.enabled || process.env.WHATSAPP_ENABLED) {
    await manager.addChannel('whatsapp', config.whatsapp || {});
  }

  if (config.signal?.phoneNumber || process.env.SIGNAL_PHONE_NUMBER) {
    await manager.addChannel('signal', config.signal || {});
  }

  return manager;
}

// Export all channel classes
export {
  DiscordChannel,
  SlackChannel,
  TelegramBot,
  WhatsAppChannel,
  SignalChannel
};

export default ChannelManager;
