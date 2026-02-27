// Media Processing Tools
// Image, PDF, TTS capabilities for JARVIS
// OpenClaw-compatible media processing

import { spawn, execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync, mkdirSync, statSync } from 'fs';
import { join, dirname, extname, basename, resolve } from 'path';
import { homedir, platform } from 'os';

// ============================================================
// Constants and Security
// ============================================================

const MAX_FILE_SIZE = 50 * 1024 * 1024;  // 50MB
const MAX_OUTPUT_SIZE = 500000;           // 500KB text
const ALLOWED_IMAGE_EXTS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif', '.bmp', '.tiff'];
const ALLOWED_AUDIO_EXTS = ['.mp3', '.wav', '.ogg', '.flac', '.m4a'];
const BLOCKED_PATHS = ['/etc', '/root', '/sys', '/proc', 'C:\\Windows', 'C:\\Program Files'];

function validatePath(filePath, checkExists = true) {
  if (!filePath) {
    return { valid: false, error: 'Path is required' };
  }

  const resolved = resolve(filePath);

  // Block sensitive paths
  for (const blocked of BLOCKED_PATHS) {
    if (resolved.toLowerCase().includes(blocked.toLowerCase())) {
      return { valid: false, error: `Access blocked: ${blocked}` };
    }
  }

  // Block path traversal
  if (filePath.includes('..')) {
    return { valid: false, error: 'Path traversal not allowed' };
  }

  if (checkExists && !existsSync(resolved)) {
    return { valid: false, error: `File not found: ${filePath}` };
  }

  return { valid: true, resolved };
}

function validateFileSize(filePath, maxSize = MAX_FILE_SIZE) {
  try {
    const stat = statSync(filePath);
    if (stat.size > maxSize) {
      return { valid: false, error: `File too large: ${(stat.size / 1024 / 1024).toFixed(1)}MB (max ${maxSize / 1024 / 1024}MB)` };
    }
    return { valid: true, size: stat.size };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}

function validateExtension(filePath, allowedExts) {
  const ext = extname(filePath).toLowerCase();
  if (!allowedExts.includes(ext)) {
    return { valid: false, error: `Invalid file type: ${ext}. Allowed: ${allowedExts.join(', ')}` };
  }
  return { valid: true, ext };
}

function sanitizeCommand(cmd) {
  // Remove shell metacharacters
  return cmd.replace(/[;&|`$(){}[\]<>]/g, '');
}

// ============================================================
// Image Processing Tools
// ============================================================

export const mediaTools = {
  // Image resize
  'image-resize': {
    name: 'image-resize',
    description: 'Resize an image to specified dimensions',
    parameters: {
      type: 'object',
      properties: {
        input: { type: 'string', description: 'Input image path' },
        output: { type: 'string', description: 'Output image path' },
        width: { type: 'number', description: 'Target width (1-10000)' },
        height: { type: 'number', description: 'Target height (optional, 1-10000)' },
        fit: {
          type: 'string',
          enum: ['cover', 'contain', 'fill', 'inside', 'outside'],
          default: 'inside'
        }
      },
      required: ['input', 'output', 'width']
    },
    execute: async (params) => {
      const { input, output, width, height, fit = 'inside' } = params;

      // Validate input path
      const inputCheck = validatePath(input, true);
      if (!inputCheck.valid) return { success: false, error: inputCheck.error };

      // Validate output path (don't check exists)
      const outputCheck = validatePath(output, false);
      if (!outputCheck.valid) return { success: false, error: outputCheck.error };

      // Validate extension
      const extCheck = validateExtension(input, ALLOWED_IMAGE_EXTS);
      if (!extCheck.valid) return { success: false, error: extCheck.error };

      // Validate file size
      const sizeCheck = validateFileSize(input);
      if (!sizeCheck.valid) return { success: false, error: sizeCheck.error };

      // Validate dimensions
      if (width < 1 || width > 10000) {
        return { success: false, error: 'Width must be between 1 and 10000' };
      }
      if (height && (height < 1 || height > 10000)) {
        return { success: false, error: 'Height must be between 1 and 10000' };
      }

      try {
        // Ensure output directory exists
        const outDir = dirname(output);
        if (!existsSync(outDir)) {
          mkdirSync(outDir, { recursive: true });
        }

        // Try sharp (Node.js native)
        const sharp = await import('sharp').catch(() => null);

        if (sharp) {
          let image = sharp.default(input);
          image = image.resize(width, height || null, { fit });
          await image.toFile(output);
          return { success: true, output, method: 'sharp' };
        }

        // Fallback to ImageMagick
        const geometry = height ? `${width}x${height}` : `${width}`;
        const safeInput = sanitizeCommand(input);
        const safeOutput = sanitizeCommand(output);
        execSync(`convert "${safeInput}" -resize ${geometry} "${safeOutput}"`, { timeout: 30000 });
        return { success: true, output, method: 'imagemagick' };
      } catch (error) {
        return {
          success: false,
          error: error.message,
          hint: error.message.includes('sharp') ? 'Run: npm install sharp' :
                error.message.includes('convert') ? 'ImageMagick not found' : undefined
        };
      }
    }
  },

  // Image convert format
  'image-convert': {
    name: 'image-convert',
    description: 'Convert image to different format',
    parameters: {
      type: 'object',
      properties: {
        input: { type: 'string', description: 'Input image path' },
        output: { type: 'string', description: 'Output image path (format determined by extension)' },
        quality: { type: 'number', description: 'Quality (1-100)', default: 80 }
      },
      required: ['input', 'output']
    },
    execute: async (params) => {
      const { input, output, quality = 80 } = params;

      try {
        const sharp = await import('sharp').catch(() => null);

        if (sharp) {
          const format = extname(output).slice(1).toLowerCase();
          let image = sharp.default(input);

          switch (format) {
            case 'jpg':
            case 'jpeg':
              image = image.jpeg({ quality });
              break;
            case 'png':
              image = image.png({ quality });
              break;
            case 'webp':
              image = image.webp({ quality });
              break;
            case 'avif':
              image = image.avif({ quality });
              break;
          }

          await image.toFile(output);
          return { success: true, output, format };
        }

        // Fallback to ImageMagick
        execSync(`convert "${input}" -quality ${quality} "${output}"`);
        return { success: true, output, method: 'imagemagick' };
      } catch (error) {
        return { success: false, error: error.message };
      }
    }
  },

  // Image info
  'image-info': {
    name: 'image-info',
    description: 'Get image metadata and dimensions',
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Image file path' }
      },
      required: ['path']
    },
    execute: async (params) => {
      const { path } = params;

      try {
        const sharp = await import('sharp').catch(() => null);

        if (sharp) {
          const metadata = await sharp.default(path).metadata();
          return {
            success: true,
            width: metadata.width,
            height: metadata.height,
            format: metadata.format,
            space: metadata.space,
            channels: metadata.channels,
            hasAlpha: metadata.hasAlpha,
            size: metadata.size
          };
        }

        // Fallback to ImageMagick
        const info = execSync(`identify -format "%w %h %m %b" "${path}"`).toString().trim();
        const [width, height, format, size] = info.split(' ');
        return {
          success: true,
          width: parseInt(width),
          height: parseInt(height),
          format: format.toLowerCase(),
          size,
          method: 'imagemagick'
        };
      } catch (error) {
        return { success: false, error: error.message };
      }
    }
  },

  // OCR - Extract text from image
  'image-ocr': {
    name: 'image-ocr',
    description: 'Extract text from image using OCR',
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Image file path' },
        language: { type: 'string', description: 'OCR language (eng, kor, jpn, etc.)', default: 'eng' }
      },
      required: ['path']
    },
    execute: async (params) => {
      const { path, language = 'eng' } = params;

      try {
        // Try Tesseract.js (pure JS)
        const Tesseract = await import('tesseract.js').catch(() => null);

        if (Tesseract) {
          const { data } = await Tesseract.default.recognize(path, language);
          return {
            success: true,
            text: data.text,
            confidence: data.confidence
          };
        }

        // Fallback to tesseract CLI
        const result = execSync(`tesseract "${path}" stdout -l ${language}`).toString();
        return { success: true, text: result, method: 'tesseract-cli' };
      } catch (error) {
        return { success: false, error: error.message };
      }
    }
  },

  // ============================================================
  // PDF Processing Tools
  // ============================================================

  // PDF extract text
  'pdf-extract-text': {
    name: 'pdf-extract-text',
    description: 'Extract text content from PDF',
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'PDF file path' },
        pages: { type: 'string', description: 'Page range (e.g., "1-5", "all")', default: 'all' }
      },
      required: ['path']
    },
    execute: async (params) => {
      const { path, pages = 'all' } = params;

      try {
        // Try pdf-parse (pure JS)
        const pdfParse = await import('pdf-parse').catch(() => null);

        if (pdfParse) {
          const dataBuffer = readFileSync(path);
          const data = await pdfParse.default(dataBuffer);
          return {
            success: true,
            text: data.text,
            numPages: data.numpages,
            info: data.info
          };
        }

        // Fallback to pdftotext CLI (poppler)
        const args = pages !== 'all' ? `-f ${pages.split('-')[0]} -l ${pages.split('-')[1] || pages.split('-')[0]}` : '';
        const result = execSync(`pdftotext ${args} "${path}" -`).toString();
        return { success: true, text: result, method: 'pdftotext' };
      } catch (error) {
        return { success: false, error: error.message };
      }
    }
  },

  // PDF info
  'pdf-info': {
    name: 'pdf-info',
    description: 'Get PDF metadata and page count',
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'PDF file path' }
      },
      required: ['path']
    },
    execute: async (params) => {
      const { path } = params;

      try {
        const pdfParse = await import('pdf-parse').catch(() => null);

        if (pdfParse) {
          const dataBuffer = readFileSync(path);
          const data = await pdfParse.default(dataBuffer);
          return {
            success: true,
            numPages: data.numpages,
            info: data.info,
            metadata: data.metadata
          };
        }

        // Fallback to pdfinfo CLI
        const result = execSync(`pdfinfo "${path}"`).toString();
        const lines = result.split('\n');
        const info = {};

        for (const line of lines) {
          const [key, ...valueParts] = line.split(':');
          if (key && valueParts.length) {
            info[key.trim()] = valueParts.join(':').trim();
          }
        }

        return { success: true, info, method: 'pdfinfo' };
      } catch (error) {
        return { success: false, error: error.message };
      }
    }
  },

  // PDF to images
  'pdf-to-images': {
    name: 'pdf-to-images',
    description: 'Convert PDF pages to images',
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'PDF file path' },
        outputDir: { type: 'string', description: 'Output directory' },
        format: { type: 'string', enum: ['png', 'jpg'], default: 'png' },
        dpi: { type: 'number', default: 150 }
      },
      required: ['path', 'outputDir']
    },
    execute: async (params) => {
      const { path, outputDir, format = 'png', dpi = 150 } = params;

      try {
        // Ensure output directory exists
        if (!existsSync(outputDir)) {
          mkdirSync(outputDir, { recursive: true });
        }

        const baseName = basename(path, '.pdf');

        // Use pdftoppm (poppler)
        execSync(`pdftoppm -${format} -r ${dpi} "${path}" "${join(outputDir, baseName)}"`);

        return {
          success: true,
          outputDir,
          format,
          message: `PDF converted to ${format} images in ${outputDir}`
        };
      } catch (error) {
        return { success: false, error: error.message };
      }
    }
  },

  // ============================================================
  // Text-to-Speech Tools
  // ============================================================

  // TTS - Speak text
  'tts-speak': {
    name: 'tts-speak',
    description: 'Convert text to speech and play/save',
    parameters: {
      type: 'object',
      properties: {
        text: { type: 'string', description: 'Text to speak' },
        output: { type: 'string', description: 'Output audio file (optional, plays directly if omitted)' },
        language: { type: 'string', default: 'en' },
        rate: { type: 'number', description: 'Speech rate (0.5-2.0)', default: 1.0 }
      },
      required: ['text']
    },
    execute: async (params) => {
      const { text, output, language = 'en', rate = 1.0 } = params;

      try {
        const os = platform();

        if (os === 'darwin') {
          // macOS: use 'say' command
          const rateValue = Math.round(rate * 175);
          if (output) {
            execSync(`say -r ${rateValue} -o "${output}" "${text.replace(/"/g, '\\"')}"`);
          } else {
            execSync(`say -r ${rateValue} "${text.replace(/"/g, '\\"')}"`);
          }
          return { success: true, method: 'say' };
        } else if (os === 'linux') {
          // Linux: use espeak or festival
          if (output) {
            execSync(`espeak -s ${Math.round(rate * 175)} -v ${language} "${text.replace(/"/g, '\\"')}" --stdout > "${output}"`);
          } else {
            execSync(`espeak -s ${Math.round(rate * 175)} -v ${language} "${text.replace(/"/g, '\\"')}"`);
          }
          return { success: true, method: 'espeak' };
        } else if (os === 'win32') {
          // Windows: use PowerShell SAPI
          const psScript = output
            ? `Add-Type -AssemblyName System.Speech; $synth = New-Object System.Speech.Synthesis.SpeechSynthesizer; $synth.Rate = ${Math.round((rate - 1) * 10)}; $synth.SetOutputToWaveFile('${output}'); $synth.Speak('${text.replace(/'/g, "''")}'); $synth.Dispose()`
            : `Add-Type -AssemblyName System.Speech; $synth = New-Object System.Speech.Synthesis.SpeechSynthesizer; $synth.Rate = ${Math.round((rate - 1) * 10)}; $synth.Speak('${text.replace(/'/g, "''")}')`;

          execSync(`powershell -Command "${psScript}"`);
          return { success: true, method: 'sapi' };
        }

        return { success: false, error: `Unsupported platform: ${os}` };
      } catch (error) {
        return { success: false, error: error.message };
      }
    }
  },

  // TTS - List voices
  'tts-voices': {
    name: 'tts-voices',
    description: 'List available TTS voices',
    parameters: {
      type: 'object',
      properties: {}
    },
    execute: async () => {
      try {
        const os = platform();

        if (os === 'darwin') {
          const result = execSync('say -v "?"').toString();
          const voices = result.split('\n')
            .filter(line => line.trim())
            .map(line => {
              const match = line.match(/^(\S+)\s+(\S+)\s+#/);
              return match ? { name: match[1], language: match[2] } : null;
            })
            .filter(Boolean);

          return { success: true, voices };
        } else if (os === 'linux') {
          const result = execSync('espeak --voices').toString();
          const lines = result.split('\n').slice(1);
          const voices = lines
            .filter(line => line.trim())
            .map(line => {
              const parts = line.trim().split(/\s+/);
              return { language: parts[1], name: parts[4] };
            });

          return { success: true, voices };
        } else if (os === 'win32') {
          const result = execSync('powershell -Command "Add-Type -AssemblyName System.Speech; (New-Object System.Speech.Synthesis.SpeechSynthesizer).GetInstalledVoices() | ForEach-Object { $_.VoiceInfo.Name }"').toString();
          const voices = result.split('\n')
            .filter(line => line.trim())
            .map(name => ({ name: name.trim() }));

          return { success: true, voices };
        }

        return { success: false, error: 'Unsupported platform' };
      } catch (error) {
        return { success: false, error: error.message };
      }
    }
  },

  // Audio transcription (Speech-to-Text)
  'audio-transcribe': {
    name: 'audio-transcribe',
    description: 'Transcribe audio to text (requires Whisper or similar)',
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Audio file path' },
        language: { type: 'string', description: 'Language code', default: 'en' },
        model: { type: 'string', description: 'Whisper model size', default: 'base' }
      },
      required: ['path']
    },
    execute: async (params) => {
      const { path, language = 'en', model = 'base' } = params;

      try {
        // Try whisper CLI (OpenAI Whisper)
        const result = execSync(
          `whisper "${path}" --model ${model} --language ${language} --output_format txt`,
          { encoding: 'utf-8' }
        );

        // Read output file
        const txtPath = path.replace(/\.[^.]+$/, '.txt');
        if (existsSync(txtPath)) {
          const text = readFileSync(txtPath, 'utf-8');
          return { success: true, text };
        }

        return { success: true, text: result };
      } catch (error) {
        return {
          success: false,
          error: error.message,
          hint: 'Install Whisper: pip install openai-whisper'
        };
      }
    }
  }
};

// Export tool list for registration
export function getMediaTools() {
  return Object.values(mediaTools);
}

// Export individual tool executor
export async function executeMediaTool(toolName, params) {
  const tool = mediaTools[toolName];
  if (!tool) {
    return { success: false, error: `Unknown media tool: ${toolName}` };
  }
  return await tool.execute(params);
}

export default mediaTools;
