// JARVIS Light - Telegram Bot

export class TelegramBot {
  constructor(token) {
    this.token = token;
    this.apiUrl = `https://api.telegram.org/bot${token}`;
    this.running = false;
  }

  async start() {
    this.running = true;
    console.log('🤖 Telegram Bot started');
  }

  async sendMessage(chatId, text, parseMode = 'Markdown') {
    try {
      const response = await fetch(`${this.apiUrl}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: parseMode,
        }),
      });
      return await response.json();
    } catch (error) {
      console.error('Send message error:', error);
    }
  }

  async handleUpdate(update) {
    if (!update.message) return;
    
    const { message } = update;
    const chatId = message.chat.id;
    const;

    // Echo text = message.text for now - will connect to agent later
    await this.sendMessage(chatId, `🤖 JARVIS Light received: ${text}`);
  }

  stop() {
    this.running = false;
  }
}

export default TelegramBot;
