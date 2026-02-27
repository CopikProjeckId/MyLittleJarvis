// JARVIS Light - Telegram Bot
// Production-ready with polling and agent integration

import { EventEmitter } from 'events';

export class TelegramBot extends EventEmitter {
  constructor(options = {}) {
    super();
    this.token = options.token || process.env.TELEGRAM_BOT_TOKEN;
    this.apiUrl = `https://api.telegram.org/bot${this.token}`;
    this.running = false;
    this.pollingInterval = options.pollingInterval || 1000;
    this.offset = 0;
    this.messageHandler = options.messageHandler || null;
    this.allowedUsers = options.allowedUsers || []; // Empty = allow all
  }

  async start() {
    if (!this.token) {
      throw new Error('TELEGRAM_BOT_TOKEN is required');
    }

    this.running = true;
    console.log('🤖 Telegram Bot starting...');

    // Get bot info
    try {
      const me = await this.getMe();
      console.log(`🤖 Telegram Bot started: @${me.username}`);
      this.emit('ready', me);
    } catch (error) {
      console.error('Failed to get bot info:', error.message);
      throw error;
    }

    // Start polling
    this.poll();
  }

  async poll() {
    while (this.running) {
      try {
        const updates = await this.getUpdates();

        for (const update of updates) {
          this.offset = update.update_id + 1;
          await this.handleUpdate(update);
        }
      } catch (error) {
        console.error('Polling error:', error.message);
        this.emit('error', error);
      }

      // Wait before next poll
      await this.sleep(this.pollingInterval);
    }
  }

  async getUpdates() {
    try {
      const response = await fetch(`${this.apiUrl}/getUpdates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          offset: this.offset,
          timeout: 30,
          allowed_updates: ['message', 'callback_query']
        })
      });

      const data = await response.json();

      if (!data.ok) {
        throw new Error(data.description || 'Failed to get updates');
      }

      return data.result || [];
    } catch (error) {
      console.error('getUpdates error:', error.message);
      return [];
    }
  }

  async getMe() {
    const response = await fetch(`${this.apiUrl}/getMe`);
    const data = await response.json();

    if (!data.ok) {
      throw new Error(data.description || 'Failed to get bot info');
    }

    return data.result;
  }

  async sendMessage(chatId, text, options = {}) {
    try {
      const response = await fetch(`${this.apiUrl}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: text.substring(0, 4096), // Telegram limit
          parse_mode: options.parseMode || 'Markdown',
          reply_to_message_id: options.replyTo,
          ...options
        })
      });

      const data = await response.json();

      if (!data.ok) {
        console.error('sendMessage error:', data.description);
        return null;
      }

      return data.result;
    } catch (error) {
      console.error('sendMessage error:', error.message);
      return null;
    }
  }

  async sendTyping(chatId) {
    try {
      await fetch(`${this.apiUrl}/sendChatAction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          action: 'typing'
        })
      });
    } catch (error) {
      // Ignore typing indicator errors
    }
  }

  async handleUpdate(update) {
    if (!update.message) return;

    const { message } = update;
    const chatId = message.chat.id;
    const userId = message.from?.id;
    const text = message.text || '';
    const username = message.from?.username || 'unknown';

    // Check allowed users
    if (this.allowedUsers.length > 0 && !this.allowedUsers.includes(userId)) {
      console.log(`🚫 Unauthorized user: ${username} (${userId})`);
      return;
    }

    // Skip empty messages
    if (!text.trim()) return;

    console.log(`📩 [${username}]: ${text.substring(0, 50)}...`);
    this.emit('message', { chatId, userId, username, text, message });

    // Handle commands
    if (text.startsWith('/')) {
      await this.handleCommand(chatId, text, message);
      return;
    }

    // Process with message handler if available
    if (this.messageHandler) {
      try {
        await this.sendTyping(chatId);
        const response = await this.messageHandler(text, { chatId, userId, username });

        if (response) {
          await this.sendMessage(chatId, response, { replyTo: message.message_id });
        }
      } catch (error) {
        console.error('Message handler error:', error.message);
        await this.sendMessage(chatId, `❌ Error: ${error.message}`);
      }
    } else {
      // Default echo response
      await this.sendMessage(chatId, `🤖 JARVIS received: ${text}`);
    }
  }

  async handleCommand(chatId, text, message) {
    const [command, ...args] = text.split(' ');
    const cmd = command.toLowerCase().replace('/', '');

    switch (cmd) {
      case 'start':
        await this.sendMessage(chatId,
          '🤖 *JARVIS Light* 에 오신 것을 환영합니다!\n\n' +
          '저에게 무엇이든 물어보세요.\n\n' +
          '*Commands:*\n' +
          '/status - 상태 확인\n' +
          '/help - 도움말\n' +
          '/clear - 대화 초기화'
        );
        break;

      case 'status':
        await this.sendMessage(chatId,
          '📊 *JARVIS Status*\n\n' +
          '• Bot: Online ✅\n' +
          '• Memory: Active\n' +
          `• Uptime: ${Math.floor(process.uptime())}s`
        );
        break;

      case 'help':
        await this.sendMessage(chatId,
          '📚 *JARVIS Help*\n\n' +
          '일반 메시지를 보내면 AI가 응답합니다.\n\n' +
          '*명령어:*\n' +
          '/start - 시작\n' +
          '/status - 상태\n' +
          '/help - 도움말\n' +
          '/clear - 초기화'
        );
        break;

      case 'clear':
        this.emit('clear', { chatId });
        await this.sendMessage(chatId, '🗑️ 대화가 초기화되었습니다.');
        break;

      default:
        await this.sendMessage(chatId, `❓ 알 수 없는 명령어: ${command}`);
    }
  }

  setMessageHandler(handler) {
    this.messageHandler = handler;
  }

  stop() {
    this.running = false;
    console.log('🤖 Telegram Bot stopped');
    this.emit('stop');
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default TelegramBot;
