#!/data/data/com.termux/files/usr/bin/bash
# JARVIS Termux 올인원 설치 스크립트
# 중고폰 (SIM 없음, WiFi 전용) 용

set -e

echo "
╔═══════════════════════════════════════════════════════════╗
║     JARVIS Termux Installer                               ║
║     중고폰 올인원 설치                                      ║
╚═══════════════════════════════════════════════════════════╝
"

# 색상
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_step() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_warn() {
    echo -e "${YELLOW}[!]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

# 1. 패키지 업데이트
echo ""
echo "📦 패키지 업데이트 중..."
pkg update -y
pkg upgrade -y
print_step "패키지 업데이트 완료"

# 2. 필수 패키지 설치
echo ""
echo "📦 필수 패키지 설치 중..."
pkg install -y nodejs git curl wget openssh

# Node.js 버전 확인
NODE_VERSION=$(node -v)
print_step "Node.js 설치됨: $NODE_VERSION"

# 3. npm 글로벌 디렉토리 설정
echo ""
echo "⚙️ npm 설정 중..."
mkdir -p ~/.npm-global
npm config set prefix '~/.npm-global'

# PATH 추가
if ! grep -q "npm-global" ~/.bashrc 2>/dev/null; then
    echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
fi
export PATH=~/.npm-global/bin:$PATH
print_step "npm 글로벌 경로 설정 완료"

# 4. JARVIS 설치
echo ""
echo "🤖 JARVIS 설치 중..."

# npm에서 설치 (publish 후) 또는 git clone
if npm view mylittle-jarvis > /dev/null 2>&1; then
    npm install -g mylittle-jarvis
    print_step "JARVIS npm에서 설치 완료"
else
    # npm에 없으면 git clone
    print_warn "npm에서 찾을 수 없음, git clone 진행..."

    JARVIS_DIR="$HOME/jarvis"
    if [ -d "$JARVIS_DIR" ]; then
        cd "$JARVIS_DIR"
        git pull
    else
        git clone https://github.com/your-repo/mylittle-jarvis.git "$JARVIS_DIR"
        cd "$JARVIS_DIR"
    fi

    npm install
    npm link
    print_step "JARVIS git에서 설치 완료"
fi

# 5. 설정 디렉토리 생성
echo ""
echo "⚙️ 설정 파일 생성 중..."
mkdir -p ~/.jarvis

# 기본 설정 파일 생성
cat > ~/.jarvis/jarvis.json << 'EOF'
{
  "mode": "simple",
  "ollama": {
    "host": "https://api.ollama.ai",
    "apiKey": ""
  },
  "models": {
    "assistant": "qwen3:8b"
  },
  "gateway": {
    "port": 18789,
    "bind": "0.0.0.0",
    "auth": {
      "allowLocal": true
    }
  }
}
EOF
print_step "설정 파일 생성됨: ~/.jarvis/jarvis.json"

# 6. 시작 스크립트 생성
cat > ~/start-jarvis.sh << 'EOF'
#!/data/data/com.termux/files/usr/bin/bash
export PATH=~/.npm-global/bin:$PATH
echo "🤖 JARVIS 시작 중..."
echo "   Gateway: http://localhost:18789"
echo "   PWA: http://localhost:18789/chat.html"
echo ""
jarvis
EOF
chmod +x ~/start-jarvis.sh
print_step "시작 스크립트 생성됨: ~/start-jarvis.sh"

# 7. Termux:Boot 자동 시작 (선택)
echo ""
echo "🚀 부팅 시 자동 시작 설정..."
mkdir -p ~/.termux/boot
cat > ~/.termux/boot/start-jarvis.sh << 'EOF'
#!/data/data/com.termux/files/usr/bin/bash
termux-wake-lock
export PATH=~/.npm-global/bin:$PATH
cd ~
jarvis &
EOF
chmod +x ~/.termux/boot/start-jarvis.sh
print_step "자동 시작 설정 완료 (Termux:Boot 필요)"

# 8. 외부 접속 허용 (같은 WiFi)
echo ""
print_warn "같은 WiFi에서 접속하려면:"
echo "   1. 설정에서 gateway.bind를 '0.0.0.0'으로 변경"
echo "   2. 폰 IP 확인: ip addr | grep inet"
echo "   3. PC에서 접속: http://폰IP:18789"

# 9. 완료
echo ""
echo "═══════════════════════════════════════════════════════════"
echo -e "${GREEN}✅ 설치 완료!${NC}"
echo ""
echo "📱 사용법:"
echo "   jarvis              # JARVIS 시작"
echo "   jarvis --setup      # 설정 마법사"
echo "   ~/start-jarvis.sh   # 백그라운드 시작"
echo ""
echo "🌐 접속:"
echo "   CLI: 현재 터미널에서 바로 사용"
echo "   PWA: http://localhost:18789/chat.html"
echo ""
echo "⚙️ 설정 파일: ~/.jarvis/jarvis.json"
echo ""
echo "💡 클라우드 LLM 설정:"
echo "   Ollama Cloud: ollama.host에 API 주소 입력"
echo "   또는 jarvis --setup 으로 설정"
echo "═══════════════════════════════════════════════════════════"
echo ""

# 쉘 재시작 안내
print_warn "PATH 적용을 위해 터미널을 재시작하거나 실행하세요:"
echo "   source ~/.bashrc"
