#!/bin/bash
# Ralph Loop - 작업 완성 보장

MAX_ITER=${2:-20}
ITER=0
TASK="$1"

echo "🔄 Ralph Loop 시작: $TASK"
echo "최대 반복 횟수: $MAX_ITER"
echo ""

while [ $ITER -lt $MAX_ITER ]; do
  echo "=== Iteration $((ITER+1))/$MAX_ITER ==="
  
  # Claude Code 실행
  claude --model sonnet --effort high "$TASK"
  
  # DONE 체크
  if [ -f /tmp/ralph_done ]; then
    echo "✅ 완료!"
    rm /tmp/ralph_done
    exit 0
  fi
  
  # 빌드 테스트
  echo "빌드 테스트 중..."
  cd /home/vboxuser/.openclaw/workspace-work/mylittlejarvis-web
  if npm run build 2>&1 | grep -q "Compiled successfully"; then
    echo "✅ 빌드 성공"
    # 추가 검증
    if [ -f /tmp/ralph_verify ]; then
      echo "✅ 모든 검증 통과"
      rm /tmp/ralph_verify
      exit 0
    fi
  else
    echo "⚠️ 빌드 실패 - 다음 반복에서 수정"
  fi
  
  ITER=$((ITER+1))
  echo ""
done

echo "⚠️ 최대 반복 횟수 도달 ($MAX_ITER)"
exit 1
