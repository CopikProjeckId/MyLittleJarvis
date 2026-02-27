// Signal Channel Adapter
// Uses signal-cli JSON-RPC interface
// Prerequisites: signal-cli installed and registered
// See: https://github.com/AsamK/signal-cli

import { EventEmitter } from 'events';
import { spawn } from 'child_process';
import { createInterface } from 'readline';

export class SignalChannel extends EventEmitter {
  constructor(options = {}) {
    super();
    this.isRunning = false;
    this.process = null;
    this.messageHandler = null;
    this.phoneNumber = options.phoneNumber || process.env.SIGNAL_PHONE_NUMBER;
    this.signalCliPath = options.signalCliPath || 'signal-cli';
    this.configPath = options.configPath || null;
    this.allowedNumbers = options.allowedNumbers || []; // Empty = allow all
    this.messageQueue = [];
    this.requestId = 0;
    this.pendingRequests = new Map();
  }

  async start() {
    if (!this.phoneNumber) {
      throw new Error('SIGNAL_PHONE_NUMBER is required');
    }

    // Build command arguments
    const args = ['--output=json', '-a', this.phoneNumber];
    if (this.configPath) {
      args.push('--config', this.configPath);
    }
    args.push('jsonRpc');

    console.log('🔄 Signal client starting...');

    // Spawn signal-cli process
    this.process = spawn(this.signalCliPath, args, {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    // Handle stdout (JSON-RPC responses and events)
    const rl = createInterface({ input: this.process.stdout });

    rl.on('line', (line) => {
      if (!line.trim()) return;

      try {
        const data = JSON.parse(line);
        this.handleJsonRpc(data);
      } catch (error) {
        console.error('Signal parse error:', error.message);
      }
    });

    // Handle stderr
    this.process.stderr.on('data', (data) => {
      const msg = data.toString().trim();
      if (msg) {
        console.error('Signal stderr:', msg);
      }
    });

    // Handle process exit
    this.process.on('exit', (code) => {
      console.log(`📴 Signal process exited with code ${code}`);
      this.isRunning = false;
      this.emit('disconnected', code);
    });

    // Handle process error
    this.process.on('error', (error) => {
      console.error('Signal process error:', error.message);
      this.emit('error', error);
    });

    this.isRunning = true;
    console.log(`✅ Signal client ready for ${this.phoneNumber}`);
    this.emit('ready');

    return this;
  }

  handleJsonRpc(data) {
    // Handle response to our requests
    if (data.id !== undefined && this.pendingRequests.has(data.id)) {
      const { resolve, reject } = this.pendingRequests.get(data.id);
      this.pendingRequests.delete(data.id);

      if (data.error) {
        reject(new Error(data.error.message || 'Unknown error'));
      } else {
        resolve(data.result);
      }
      return;
    }

    // Handle incoming message event
    if (data.method === 'receive') {
      this.handleMessage(data.params);
    }
  }

  async handleMessage(params) {
    const { envelope } = params;
    if (!envelope) return;

    const { source, sourceNumber, dataMessage, syncMessage } = envelope;
    const from = sourceNumber || source;

    // Handle sync message (from other devices)
    const message = dataMessage || syncMessage?.sentMessage;
    if (!message || !message.message) return;

    const body = message.message;
    const groupId = message.groupInfo?.groupId;
    const isGroup = !!groupId;

    // Check allowed numbers
    if (this.allowedNumbers.length > 0) {
      if (!this.allowedNumbers.includes(from)) {
        console.log(`🚫 Unauthorized: ${from}`);
        return;
      }
    }

    console.log(`📩 [Signal] ${from}: ${body.substring(0, 50)}...`);
    this.emit('message', { from, body, isGroup, groupId, envelope });

    // Process with message handler
    if (this.messageHandler) {
      try {
        const response = await this.messageHandler(body, { from, isGroup, groupId });
        if (response) {
          await this.sendMessage(isGroup ? groupId : from, response, isGroup);
        }
      } catch (error) {
        console.error('Signal handler error:', error.message);
        await this.sendMessage(from, `Error: ${error.message}`);
      }
    }
  }

  async sendRequest(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = ++this.requestId;

      this.pendingRequests.set(id, { resolve, reject });

      const request = JSON.stringify({
        jsonrpc: '2.0',
        id,
        method,
        params
      }) + '\n';

      this.process.stdin.write(request);

      // Timeout after 30 seconds
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error('Request timeout'));
        }
      }, 30000);
    });
  }

  async sendMessage(recipient, content, isGroup = false) {
    if (!this.process || !this.isRunning) {
      throw new Error('Signal client not ready');
    }

    const params = {
      message: content
    };

    if (isGroup) {
      params.groupId = recipient;
    } else {
      params.recipient = [recipient];
    }

    return this.sendRequest('send', params);
  }

  async sendAttachment(recipient, attachmentPath, message = '', isGroup = false) {
    if (!this.process || !this.isRunning) {
      throw new Error('Signal client not ready');
    }

    const params = {
      message,
      attachment: [attachmentPath]
    };

    if (isGroup) {
      params.groupId = recipient;
    } else {
      params.recipient = [recipient];
    }

    return this.sendRequest('send', params);
  }

  async stop() {
    if (this.process) {
      this.process.kill();
      this.isRunning = false;
      console.log('📴 Signal client stopped');
    }
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
      platform: 'signal',
      running: this.isRunning,
      phoneNumber: this.phoneNumber
    };
  }

  // List groups
  async listGroups() {
    return this.sendRequest('listGroups', {});
  }

  // Get contacts
  async listContacts() {
    return this.sendRequest('listContacts', {});
  }

  // Trust identity (for safety number changes)
  async trustIdentity(number) {
    return this.sendRequest('trust', {
      recipient: [number],
      trustAllKnownKeys: true
    });
  }
}

export default SignalChannel;
