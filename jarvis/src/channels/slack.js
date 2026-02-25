// Slack Channel Adapter
// Phase 2: Channel Expansion

import { App } from '@slack/bolt';

export class SlackChannel {
  constructor(options = {}) {
    this.token = options.token || process.env.SLACK_BOT_TOKEN;
    this.signingSecret = options.signingSecret || process.env.SLACK_SIGNING_SECRET;
    this.app = null;
    this.messageHandler = null;
    this.isRunning = false;
  }

  async start() {
    if (!this.token || !this.signingSecret) {
      throw new Error('Slack bot tokens not configured');
    }

    this.app = new App({
      token: this.token,
      signingSecret: this.signingSecret
    });

    // Message handler
    this.app.message(async ({ message, say }) => {
      // Ignore bot messages
      if (message.subtype === 'bot_message' || message.subtype === 'message_changed') {
        return;
      }

      const text = message.text;
      
      if (this.messageHandler && text) {
        try {
          const response = await this.messageHandler(text);
          await say({
            channel: message.channel,
            text: response
          });
        } catch (error) {
          console.error('Slack message error:', error);
        }
      }
    });

    await this.app.start(3000);
    this.isRunning = true;
    
    console.log('⚡ Slack bot started');
    
    return this;
  }

  async stop() {
    if (this.app) {
      await this.app.stop();
      this.isRunning = false;
    }
  }

  onMessage(handler) {
    this.messageHandler = handler;
  }

  async sendMessage(channelId, content) {
    if (!this.app) return;
    
    try {
      await this.app.client.chat.postMessage({
        channel: channelId,
        text: content
      });
    } catch (error) {
      console.error('Slack send error:', error);
    }
  }

  async sendDM(userId, content) {
    if (!this.app) return;
    
    try {
      await this.app.client.chat.postMessage({
        channel: userId,
        text: content
      });
    } catch (error) {
      console.error('Slack DM error:', error);
    }
  }

  isActive() {
    return this.isRunning;
  }

  getStatus() {
    return {
      platform: 'slack',
      running: this.isRunning
    };
  }
}

export default SlackChannel;
