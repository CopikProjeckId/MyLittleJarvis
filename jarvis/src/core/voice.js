// JARVIS Light - Voice Input (Speech Recognition + TTS)

import { EventEmitter } from 'events';

export class VoiceInput extends EventEmitter {
  constructor(options = {}) {
    super();
    this.recognition = null;
    this.isListening = false;
    this.language = options.language || 'ko-KR';
    this.init();
  }

  init() {
    // Check for Web Speech API (Browser) or native implementation
    if (typeof window !== 'undefined' && window.SpeechRecognition) {
      this.recognition = new window.SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = true;
      this.recognition.lang = this.language;

      this.recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0].transcript)
          .join('');

        this.emit('result', transcript);
        
        if (event.results[0].isFinal) {
          this.emit('final', transcript);
        }
      };

      this.recognition.onerror = (event) => {
        this.emit('error', event.error);
      };

      this.recognition.onend = () => {
        this.isListening = false;
        this.emit('end');
      };
    }
  }

  start() {
    if (!this.recognition) {
      this.emit('error', 'Speech recognition not supported');
      return false;
    }

    try {
      this.recognition.start();
      this.isListening = true;
      this.emit('start');
      return true;
    } catch (error) {
      this.emit('error', error.message);
      return false;
    }
  }

  stop() {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
      this.emit('stop');
    }
  }

  isActive() {
    return this.isListening;
  }
}

// ============================================================
// Text-to-Speech (TTS)
// ============================================================

export class VoiceOutput extends EventEmitter {
  constructor(options = {}) {
    super();
    this.voice = null;
    this.rate = options.rate || 1.0;
    this.pitch = options.pitch || 1.0;
    this.volume = options.volume || 1.0;
    this.voices = [];
    this.init();
  }

  init() {
    if (typeof window !== 'undefined') {
      // Load voices
      if (window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = () => {
          this.voices = window.speechSynthesis.getVoices();
          // Prefer Korean voice
          this.voice = this.voices.find(v => v.lang.startsWith('ko')) || 
                       this.voices.find(v => v.lang.startsWith('en'));
        };
      }
    }
  }

  speak(text) {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      console.log('[TTS Mock]', text);
      this.emit('mock', text);
      return;
    }

    // Stop any current speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = this.voice;
    utterance.rate = this.rate;
    utterance.pitch = this.pitch;
    utterance.volume = this.volume;

    utterance.onstart = () => this.emit('start');
    utterance.onend = () => this.emit('end');
    utterance.onerror = (e) => this.emit('error', e);

    window.speechSynthesis.speak(utterance);
  }

  stop() {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }

  setVoice(lang) {
    this.voice = this.voices.find(v => v.lang.startsWith(lang));
  }
}

// ============================================================
// Combined Voice Handler
// ============================================================

export class VoiceHandler extends EventEmitter {
  constructor(options = {}) {
    super();
    this.input = new VoiceInput(options);
    this.output = new VoiceOutput(options);
    this.isEnabled = true;
    
    // Forward events
    this.input.on('final', (text) => {
      if (this.isEnabled) {
        this.emit('speech', text);
      }
    });
  }

  async listen() {
    return this.input.start();
  }

  stopListening() {
    this.input.stop();
  }

  say(text) {
    this.output.speak(text);
  }

  stopSpeaking() {
    this.output.stop();
  }

  toggle(enabled) {
    this.isEnabled = enabled;
    if (!enabled) {
      this.stopListening();
      this.stopSpeaking();
    }
  }

  getStatus() {
    return {
      inputAvailable: !!this.input.recognition,
      outputAvailable: typeof window !== 'undefined' && !!window.speechSynthesis,
      isListening: this.input.isActive(),
      isEnabled: this.isEnabled
    };
  }
}

export default VoiceHandler;
