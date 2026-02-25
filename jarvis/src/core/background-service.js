// JARVIS Light - Background Service (Mobile Support)

import { EventEmitter } from 'events';

export class BackgroundService extends EventEmitter {
  constructor(options = {}) {
    super();
    this.isRunning = false;
    this.isBackground = false;
    this.restartOnCrash = options.restartOnCrash !== false;
    this.healthCheckInterval = options.healthCheckInterval || 60000; // 1 minute
    this.healthCheckTimer = null;
    this.crashCount = 0;
    this.maxCrashes = options.maxCrashes || 5;
    this.lastHealthCheck = null;
    
    // Platform detection
    this.isMobile = this.detectMobile();
    this.isTermux = this.detectTermux();
  }

  detectMobile() {
    if (typeof window !== 'undefined') {
      return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }
    return false;
  }

  detectTermux() {
    if (typeof process !== 'undefined' && process.env) {
      return process.env.TERMUX === 'true' || 
             process.env.PREFIX?.includes('/com.termux');
    }
    return false;
  }

  async start() {
    if (this.isRunning) {
      console.log('⚠️ Background service already running');
      return false;
    }

    console.log('🚀 Starting JARVIS Background Service...');
    this.isRunning = true;
    this.crashCount = 0;
    
    // Start health check
    this.startHealthCheck();
    
    // Platform-specific background handling
    if (this.isMobile) {
      this.setupMobileBackground();
    }

    this.emit('start');
    return true;
  }

  async stop() {
    if (!this.isRunning) {
      return false;
    }

    console.log('🛑 Stopping JARVIS Background Service...');
    this.isRunning = false;
    
    // Stop health check
    this.stopHealthCheck();
    
    this.emit('stop');
    return true;
  }

  setupMobileBackground() {
    if (typeof document !== 'undefined') {
      // Handle visibility change
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          this.isBackground = true;
          console.log('📱 App moved to background');
          this.emit('background');
        } else {
          this.isBackground = false;
          console.log('📱 App moved to foreground');
          this.emit('foreground');
        }
      });

      // Handle beforeunload
      window.addEventListener('beforeunload', () => {
        if (this.restartOnCrash) {
          // Try to restart service
          console.log('📱 Attempting to restart...');
        }
      });
    }

    // Handle Termux background
    if (this.isTermux) {
      process.on('SIGSTOP', () => {
        console.log('📱 Received SIGSTOP - backgrounding');
        this.isBackground = true;
      });

      process.on('SIGCONT', () => {
        console.log('📱 Received SIGCONT - foregrounding');
        this.isBackground = false;
      });
    }
  }

  startHealthCheck() {
    this.healthCheckTimer = setInterval(() => {
      this.performHealthCheck();
    }, this.healthCheckInterval);
  }

  stopHealthCheck() {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = null;
    }
  }

  async performHealthCheck() {
    this.lastHealthCheck = Date.now();
    
    // Check if main process is alive
    const health = {
      timestamp: this.lastHealthCheck,
      uptime: process.uptime?.() || 0,
      memory: process.memoryUsage?.() || {},
      isRunning: this.isRunning,
      crashCount: this.crashCount
    };

    this.emit('health', health);
    
    // Auto-restart on crash
    if (!this.isRunning && this.restartOnCrash && this.crashCount < this.maxCrashes) {
      this.crashCount++;
      console.log(`🔄 Auto-restarting (crash ${this.crashCount}/${this.maxCrashes})`);
      await this.start();
    }
  }

  // Notification support (for mobile)
  async sendNotification(title, body, options = {}) {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification(title, { body, ...options });
      } else if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          new Notification(title, { body, ...options });
        }
      }
    }
    
    this.emit('notification', { title, body, options });
  }

  // Schedule task
  scheduleTask(task, delay) {
    return setTimeout(() => {
      task();
    }, delay);
  }

  // Periodic task
  schedulePeriodic(task, interval) {
    return setInterval(() => {
      task();
    }, interval);
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      isBackground: this.isBackground,
      isMobile: this.isMobile,
      isTermux: this.isTermux,
      crashCount: this.crashCount,
      maxCrashes: this.maxCrashes,
      lastHealthCheck: this.lastHealthCheck,
      uptime: process.uptime?.() || 0
    };
  }
}

export default BackgroundService;
