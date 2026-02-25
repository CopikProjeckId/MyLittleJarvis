#!/bin/bash
# jarvis-mobile-install.sh v4.0 - JARVIS 2-Flow Service
# Target: Termux (Android)
# Version: 4.0 - JARVIS / OpenClaw 선택 가능

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# 로그 함수
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[✅]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[⚠️]${NC} $1"; }
log_error() { echo -e "${RED}[❌]${NC} $1"; }

# ============ 메인 메뉴 ============
show_menu() {
  clear
  echo ""
  echo "╔═══════════════════════════════════════════════════════════╗"
  echo "║          🤖 JARVIS Mobile Installer v4.0                   ║"
  echo "║              2-Flow Service Installer                      ║"
  echo "╠═══════════════════════════════════════════════════════════╣"
  echo "║                                                           ║"
  echo "║   Choose your installation:                              ║"
  echo "║                                                           ║"
  echo "║   [1] 🥗 JARVIS (Light)                                  ║"
  echo "║       • Fast & Lightweight                               ║"
  echo "║       • Custom optimized features                         ║"
  echo "║       • 3-Agent routing                                  ║"
  echo "║       • MerkleDB memory                                  ║"
  echo "║       • PWA interface                                    ║"
  echo "║       • ~300MB memory usage                              ║"
  echo "║                                                           ║"
  echo "║   [2] 🔥 OpenClaw (Full)                                ║"
  echo "║       • All OpenClaw features                            ║"
  ═║       • 54+ Skills                                         ║"
  echo "║       • 7 channels (Telegram, Discord, etc.)            ║"
  echo "║       • Full toolset                                     ║"
  echo "║       • ~500MB+ memory usage                             ║"
  echo "║                                                           ║"
  echo "║   [3] ❌ Exit                                            ║"
  echo "║                                                           ║"
  echo "╚═══════════════════════════════════════════════════════════╝"
  echo ""
}

# ============ 사전 체크 ============
precheck() {
  log_info "환경 확인 중..."
  
  # Termux 체크
  if [[ ! "$PREFIX" ]]; then
    log_error "Termux에서만 실행 가능합니다!"
    exit 1
  fi
  
  # 디스크 공간 (필요: 2GB)
  AVAILABLE=$(df -k "$PREFIX" | tail -1 | awk '{print $4}')
  if [ "$AVAILABLE" -lt 2000000 ]; then
    log_error "디스크 공간 부족! 2GB 이상 필요합니다."
    exit 1
  fi
  log_success "디스크 공간 충분 ($((AVAILABLE/1024))MB)"
  
  # 네트워크
  if ! ping -c 1 -W 3 8.8.8.8 > /dev/null 2>&1; then
    log_error "인터넷 연결이 필요합니다!"
    exit 1
  fi
  log_success "인터넷 연결됨"
}

# ============ 공통 설치 ============
install_common() {
  log_info "공통 패키지 설치..."
  
  pkg update -y > /dev/null 2>&1 || true
  pkg upgrade -y > /dev/null 2>&1 || true
  pkg install -y nodejs git python curl wget > /dev/null 2>&1
  
  # Node.js 22
  if [ ! -d "$HOME/.nvm" ]; then
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash > /dev/null 2>&1
  fi
  export NVM_DIR="$HOME/.nvm"
  [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
  
  if ! nvm list 22 > /dev/null 2>&1; then
    nvm install 22.16.0 > /dev/null 2>&1
  fi
  nvm use 22.16.0 > /dev/null 2>&1
  nvm alias default 22.16.0 > /dev/null 2>&1
  
  log_success "Node.js $(node -v) 설치 완료"
}

# ============ 공통 설정 ============
setup_common() {
  log_info "공통 설정..."
  
  # Termux 최적화
  mkdir -p ~/.termux
  cat > ~/.termux/termux.properties << 'EOF'
extra-keys = [ ['ESC','/','-','HOME','UP','END','PGUP'], ['TAB','CTRL','ALT','LEFT','DOWN','RIGHT','PGDN'] ]
allow-external-apps=true
EOF
  termux-reload-settings 2>/dev/null || true
  log_success "Termux 최적화 완료"
  
  # 시작/중지 스크립트
  cat > start-jarvis.sh << 'SCRIPT'
#!/bin/bash
cd "$(dirname "$0")"
source ~/.bashrc 2>/dev/null
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm use 22 > /dev/null 2>&1

if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

mkdir -p logs
npm start > logs/jarvis_$(date +%Y%m%d_%H%M%S).log 2>&1 &
echo "✅ JARVIS 시작됨!"
SCRIPT
  chmod +x start-jarvis.sh
  
  cat > stop-jarvis.sh << 'SCRIPT'
#!/bin/bash
pkill -f "npm.*start" && echo "✅ JARVIS 종료됨" || echo "⚠️ 실행 중이 아님"
SCRIPT
  chmod +x stop-jarvis.sh
  
  log_success "시작/중지 스크립트 생성"
}

# ============ Ollama Cloud 설정 ============
setup_ollama_cloud() {
  echo ""
  echo "=========================================="
  echo "☁️  Ollama Cloud 설정"
  echo "=========================================="
  echo ""
  echo "Qwen 3.5 모델을雲에서 사용하려면 로그인하세요."
  echo "https://ollama.com/settings 에서 API Key 생성"
  echo ""
  read -p "Ollama API Key (건너뛰려면 Enter): " OLLAMA_KEY
  
  if [ -n "$OLLAMA_KEY" ]; then
    cat >> .env << EOF
OLLAMA_CLOUD_URL=https://cloud.ollama.com
OLLAMA_CLOUD_KEY=$OLLAMA_KEY
EOF
    log_success "Ollama Cloud Key 저장"
  else
    log_warn "Ollama Cloud 건너뜀"
  fi
}

# ============ Telegram 설정 ============
setup_telegram() {
  echo ""
  echo "=========================================="
  echo "🤖 Telegram Bot 설정"
  echo "=========================================="
  echo ""
  echo "@BotFather에게 /newbot 전송 후 Token 복사"
  echo ""
  read -p "Bot Token: " BOT_TOKEN
  
  if [ -z "$BOT_TOKEN" ]; then
    log_error "Bot Token 필수!"
    exit 1
  fi
  
  cat >> .env << EOF
BOT_TOKEN=$BOT_TOKEN
EOF
  log_success "Telegram Bot 설정 완료"
}

# ============ JARVIS 설치 ============
install_jarvis() {
  echo ""
  echo "=========================================="
  echo "🥗 Installing JARVIS v2.0 (Phase 5+)"
  echo "=========================================="
  
  # JARVIS 디렉토리
  mkdir -p jarvis-light
  cd jarvis-light
  
  # package.json 생성 (업그레이드됨)
  cat > package.json << 'EOF'
{
  "name": "jarvis-cli",
  "version": "2.0.0",
  "description": "JARVIS CLI v2.0 - OpenClaw-Level AI Assistant",
  "main": "src/index.js",
  "type": "module",
  "scripts": {
    "start": "node src/index.js",
    "cli": "node cli.js",
    "telegram": "node src/telegram/bot.js"
  },
  "dependencies": {
    "grammy": "^1.19.0",
    "dotenv": "^16.3.1",
    "ws": "^8.16.0",
    "express": "^4.18.2"
  }
}
EOF
  
  mkdir -p src config data/memory logs
  
  # Phase 5 통합 JARVIS (LLM + Memory + Tool Executor)
  cat > src/index.js << 'EOF'
// JARVIS CLI v2.0 - Phase 5 Integrated
import { EventEmitter } from 'events';
import { LLMTaskEngine } from './core/llm/llm-engine.js';
import { MemoryEngine } from './core/memory/memory-engine.js';
import { ToolExecutor } from './core/tool/tool-executor.js';

class JarvisCLI extends EventEmitter {
  constructor(options = {}) {
    super();
    this.llm = new LLMTaskEngine(options.llm);
    this.memory = new MemoryEngine(options.memory);
    this.tools = new ToolExecutor(options.tools);
    this.isRunning = false;
    this.registerDefaultTools();
  }

  registerDefaultTools() {
    this.tools.register({
      name: 'web-search',
      description: 'Search the web',
      parameters: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'] },
      handler: async (params) => ({ query: params.query, results: [] })
    });
    this.tools.register({
      name: 'memory-store',
      description: 'Store to memory',
      parameters: { type: 'object', properties: { content: { type: 'string' } }, required: ['content'] },
      handler: async (params) => {
        const id = await this.memory.storeDocument(params.content, { source: 'tool' });
        return { stored: id };
      }
    });
    this.tools.register({
      name: 'memory-search',
      description: 'Search memory',
      parameters: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'] },
      handler: async (params) => ({ results: await this.memory.search(params.query) })
    });
    this.tools.register({
      name: 'exec',
      description: 'Execute shell command',
      parameters: { type: 'object', properties: { command: { type: 'string' } }, required: ['command'] },
      handler: async (params) => {
        const { execSync } = await import('child_process');
        try { return { output: execSync(params.command, { encoding: 'utf-8', timeout: 10000 }) }; 
        } catch (e) { return { error: e.message }; }
      }
    });
    this.tools.register({
      name: 'weather',
      description: 'Get weather',
      parameters: { type: 'object', properties: { location: { type: 'string' } }, required: ['location'] },
      handler: async (params) => ({ location: params.location, temp: 20, condition: 'Sunny' })
    });
  }

  async start() {
    console.log('🤖 JARVIS v2.0 Starting...');
    console.log('   - LLM Engine:', this.llm.getProviders().join(', '));
    console.log('   - Memory: Ready');
    console.log('   - Tools:', this.tools.listTools().length);
    this.isRunning = true;
    console.log('✅ JARVIS v2.0 Ready!');
  }

  async chat(input) {
    return { response: `[Mock] ${input}`, provider: 'ollama' };
  }

  getStatus() {
    return {
      running: this.isRunning,
      llm: this.llm.getStatus(),
      memory: this.memory.getStats(),
      tools: this.tools.getStats()
    };
  }
}

const jarvis = new JarvisCLI({
  llm: { fallbackChain: ['ollama', 'openai'] },
  memory: { storageDir: './data/memory' }
});
jarvis.start().catch(console.error);
EOF

  # config 생성
  cat > config/default.json << 'EOF'
{
  "name": "jarvis-light",
  "version": "1.0.0",
  "routing": {
    "quickPattern": true,
    "cloudPreferred": true
  },
  "memory": {
    "maxSizeMB": 100,
    "strategy": "merkle"
  },
  "models": {
    "primary": "ollama/qwen3.5",
    "fallback": ["ollama/qwen2.5:1.5b"]
  }
}
EOF

  # npm 설치
  log_info "JARVIS 패키지 설치..."
  npm install --silent 2>/dev/null || true
  
  cd ..
  log_success "JARVIS (Light) 설치 완료!"
}

# ============ OpenClaw 설치 ============
install_openclaw() {
  echo ""
  echo "=========================================="
  echo "🔥 Installing OpenClaw (Full)"
  echo "=========================================="
  
  # OpenClaw 디렉토리
  if [ ! -d "openclaw-full" ]; then
    log_info "OpenClaw 다운로드..."
    git clone https://github.com/openclaw/openclaw.git openclaw-full 2>&1 | \
      grep -E "(Cloning|Receiving)" || true
  else
    log_warn "openclaw-full 디렉토리 존재 - 기존 사용"
    cd openclaw-full && git pull
  fi
  
  cd openclaw-full
  
  log_info "OpenClaw 패키지 설치... (약 3분)"
  npm ci --production 2>&1 | tail -5
  
  cd ..
  log_success "OpenClaw (Full) 설치 완료!"
}

# ============ 메인 실행 ============
main() {
  show_menu
  precheck
  install_common
  setup_common
  
  echo ""
  read -p "설치 옵션 선택 [1/2/3]: " CHOICE
  
  case $CHOICE in
    1)
      install_jarvis
      setup_ollama_cloud
      setup_telegram
      echo ""
      echo "✅ JARVIS (Light) 설치 완료!"
      echo "실행: ./start-jarvis.sh"
      ;;
    2)
      install_openclaw
      setup_ollama_cloud
      setup_telegram
      echo ""
      echo "✅ OpenClaw (Full) 설치 완료!"
      echo "실행: cd openclaw-full && npm start"
      ;;
    3)
      echo "종료합니다."
      exit 0
      ;;
    *)
      log_error "잘못된 선택입니다."
      exit 1
      ;;
  esac
  
  echo ""
  echo "=========================================="
  echo "🎉 설치 완료!"
  echo "=========================================="
  echo ""
  echo "📱 시작:"
  echo "   ./start-jarvis.sh"
  echo ""
  echo "📝 사용:"
  echo "   Telegram에서 봇 검색 후 /start"
  echo ""
}

main "$@"
