// Discord Channel Adapter
// Phase 2: Channel Expansion

import { Client, GatewayIntentBits, Events } from 'discord.js';

export class DiscordChannel {
  constructor(options = {}) {
    this.token = options.token || process.env.DISCORD_BOT_TOKEN;
    this.client = null;
    this.messageHandler = null;
    this.prefix = options.prefix || '/';
    this.isRunning = false;
  }

  async start() {
    if (!this.token) {
      throw new Error('Discord bot token not configured');
    }

    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
      ]
    });

    this.client.once(Events.ClientReady, () => {
      console.log(`🤖 Discord bot logged in as ${this.client.user.tag}`);
    });

    this.client.on(Events.MessageCreate, async (message) => {
      // Ignore bots and messages without prefix
      if (message.author.bot || !message.content.startsWith(this.prefix)) {
        return;
      }

      const text = message.content.substring(this.prefix.length).trim();
      
      if (this.messageHandler) {
        const response = await this.messageHandler(text);
        await message.reply(response);
      }
    });

    this.client.on(Events.Error, (error) => {
      console.error('Discord error:', error);
    });

    await this.client.login(this.token);
    this.isRunning = true;
    
    return this;
  }

  async stop() {
    if (this.client) {
      this.client.destroy();
      this.isRunning = false;
    }
  }

  onMessage(handler) {
    this.messageHandler = handler;
  }

  async sendMessage(channelId, content) {
    if (!this.client) return;
    
    const channel = await this.client.channels.fetch(channelId);
    if (channel) {
      await channel.send(content);
    }
  }

  async sendDM(userId, content) {
    if (!this.client) return;
    
    const user = await this.client.users.fetch(userId);
    if (user) {
      const dm = await user.createDM();
      await dm.send(content);
    }
  }

  isActive() {
    return this.isRunning;
  }

  getStatus() {
    return {
      platform: 'discord',
      running: this.isRunning,
      guilds: this.client?.guilds?.cache?.size || 0
    };
  }
}

export default DiscordChannel;
