// WhatsApp Channel Adapter
// Uses whatsapp-web.js for WhatsApp Web API
// Note: Requires puppeteer for headless browser

import { EventEmitter } from 'events';

export class WhatsAppChannel extends EventEmitter {
  constructor(options = {}) {
    super();
    this.isRunning = false;
    this.client = null;
    this.messageHandler = null;
    this.sessionPath = options.sessionPath || './.wwebjs_auth';
    this.allowedNumbers = options.allowedNumbers || []; // Empty = allow all
    this.qrTimeout = options.qrTimeout || 60000;
  }

  async start() {
    // Dynamic import to avoid bundling issues
    let Client, LocalAuth;
    try {
      const wwebjs = await import('whatsapp-web.js');
      Client = wwebjs.Client;
      LocalAuth = wwebjs.LocalAuth;
    } catch (error) {
      throw new Error('whatsapp-web.js not installed. Run: npm install whatsapp-web.js');
    }

    this.client = new Client({
      authStrategy: new LocalAuth({ dataPath: this.sessionPath }),
      puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      }
    });

    // QR Code event
    this.client.on('qr', (qr) => {
      console.log('📱 WhatsApp QR Code received. Scan with your phone:');
      this.emit('qr', qr);

      // Generate ASCII QR for terminal
      this.printQR(qr);
    });

    // Ready event
    this.client.on('ready', () => {
      console.log('✅ WhatsApp client is ready!');
      this.isRunning = true;
      this.emit('ready');
    });

    // Message event
    this.client.on('message', async (message) => {
      const from = message.from;
      const body = message.body;
      const isGroup = message.from.includes('@g.us');

      // Check allowed numbers
      if (this.allowedNumbers.length > 0) {
        const number = from.replace('@c.us', '').replace('@g.us', '');
        if (!this.allowedNumbers.some(n => from.includes(n))) {
          console.log(`🚫 Unauthorized: ${from}`);
          return;
        }
      }

      // Skip empty messages
      if (!body.trim()) return;

      console.log(`📩 [WhatsApp] ${from}: ${body.substring(0, 50)}...`);
      this.emit('message', { from, body, isGroup, message });

      // Process with message handler
      if (this.messageHandler) {
        try {
          const response = await this.messageHandler(body, { from, isGroup });
          if (response) {
            await message.reply(response);
          }
        } catch (error) {
          console.error('WhatsApp handler error:', error.message);
          await message.reply(`Error: ${error.message}`);
        }
      }
    });

    // Authentication failure
    this.client.on('auth_failure', (msg) => {
      console.error('❌ WhatsApp authentication failed:', msg);
      this.emit('auth_failure', msg);
    });

    // Disconnected
    this.client.on('disconnected', (reason) => {
      console.log('📴 WhatsApp disconnected:', reason);
      this.isRunning = false;
      this.emit('disconnected', reason);
    });

    // Initialize
    console.log('🔄 WhatsApp client initializing...');
    await this.client.initialize();

    return this;
  }

  async stop() {
    if (this.client) {
      await this.client.destroy();
      this.isRunning = false;
      console.log('📴 WhatsApp client stopped');
    }
  }

  async sendMessage(chatId, content) {
    if (!this.client || !this.isRunning) {
      throw new Error('WhatsApp client not ready');
    }

    // Ensure proper format
    const formattedId = chatId.includes('@') ? chatId : `${chatId}@c.us`;
    await this.client.sendMessage(formattedId, content);
  }

  async sendMedia(chatId, mediaPath, caption = '') {
    if (!this.client || !this.isRunning) {
      throw new Error('WhatsApp client not ready');
    }

    const { MessageMedia } = await import('whatsapp-web.js');
    const media = MessageMedia.fromFilePath(mediaPath);
    const formattedId = chatId.includes('@') ? chatId : `${chatId}@c.us`;
    await this.client.sendMessage(formattedId, media, { caption });
  }

  onMessage(handler) {
    this.messageHandler = handler;
  }

  setMessageHandler(handler) {
    this.messageHandler = handler;
  }

  isActive() {
    return this.isRunning;
  }

  getStatus() {
    return {
      platform: 'whatsapp',
      running: this.isRunning,
      info: this.client?.info || null
    };
  }

  // Print QR code to terminal (ASCII)
  printQR(qr) {
    try {
      // Use qrcode-terminal if available
      import('qrcode-terminal').then(qrcode => {
        qrcode.generate(qr, { small: true });
      }).catch(() => {
        console.log('QR Data:', qr);
        console.log('Install qrcode-terminal for visual QR: npm install qrcode-terminal');
      });
    } catch (e) {
      console.log('QR Data:', qr);
    }
  }

  // Get all chats
  async getChats() {
    if (!this.client) return [];
    return await this.client.getChats();
  }

  // Get chat by ID
  async getChat(chatId) {
    if (!this.client) return null;
    const formattedId = chatId.includes('@') ? chatId : `${chatId}@c.us`;
    return await this.client.getChatById(formattedId);
  }
}

export default WhatsAppChannel;
