# JARVIS Tool Reference

JARVIS는 50+ 개의 도구를 제공합니다. 각 도구는 JSON 스키마 기반 파라미터 검증, 타임아웃, 재시도를 지원합니다.

## 도구 카테고리

| 카테고리 | 도구 수 | 설명 |
|----------|---------|------|
| [파일](#파일-도구) | 8 | 파일 읽기/쓰기/편집/검색 |
| [코드 실행](#코드-실행-도구) | 3 | Bash, Python, Node.js |
| [Git](#git-도구) | 8 | 버전 관리 |
| [웹](#웹-도구) | 4 | 검색, 날씨, URL |

---

## 파일 도구

### file-read

파일을 읽고 라인 번호와 함께 반환합니다.

**Parameters:**
| 이름 | 타입 | 필수 | 설명 |
|------|------|------|------|
| path | string | Yes | 파일 경로 |
| offset | number | No | 시작 라인 (1-based) |
| limit | number | No | 읽을 최대 라인 수 |

**Example:**
```json
{
  "tool": "file-read",
  "params": {
    "path": "/path/to/file.js",
    "offset": 10,
    "limit": 50
  }
}
```

**Response:**
```json
{
  "path": "/path/to/file.js",
  "content": "    10| const foo = 'bar';\n    11| ...",
  "lines": 50,
  "totalLines": 200,
  "truncated": true
}
```

---

### file-write

파일을 생성하거나 덮어씁니다.

**Parameters:**
| 이름 | 타입 | 필수 | 설명 |
|------|------|------|------|
| path | string | Yes | 파일 경로 |
| content | string | Yes | 파일 내용 |

---

### file-edit

파일 내 특정 텍스트를 교체합니다. Undo를 지원합니다.

**Parameters:**
| 이름 | 타입 | 필수 | 설명 |
|------|------|------|------|
| path | string | Yes | 파일 경로 |
| old_string | string | Yes | 찾을 텍스트 |
| new_string | string | Yes | 교체할 텍스트 |
| replace_all | boolean | No | 모든 항목 교체 (기본: false) |

**Example:**
```json
{
  "tool": "file-edit",
  "params": {
    "path": "/path/to/file.js",
    "old_string": "const foo = 'bar'",
    "new_string": "const foo = 'baz'"
  }
}
```

---

### file-glob

글로브 패턴으로 파일을 검색합니다.

**Parameters:**
| 이름 | 타입 | 필수 | 설명 |
|------|------|------|------|
| pattern | string | Yes | 글로브 패턴 (*.js, **/*.ts) |
| path | string | No | 기준 디렉토리 |
| maxResults | number | No | 최대 결과 수 (기본: 100) |

---

### file-grep

정규식으로 파일 내용을 검색합니다.

**Parameters:**
| 이름 | 타입 | 필수 | 설명 |
|------|------|------|------|
| pattern | string | Yes | 정규식 패턴 |
| path | string | No | 검색 경로 |
| type | string | No | 파일 타입 (js, py, ts...) |
| context | number | No | 컨텍스트 라인 수 |

---

### file-undo

마지막 편집을 취소합니다.

---

### file-redo

취소한 편집을 다시 적용합니다.

---

### file-history

편집 히스토리를 조회합니다.

---

## 코드 실행 도구

### bash

쉘 명령어를 실행합니다. 보안 검증이 적용됩니다.

**Parameters:**
| 이름 | 타입 | 필수 | 설명 |
|------|------|------|------|
| command | string | Yes | 실행할 명령어 |
| cwd | string | No | 작업 디렉토리 |
| timeout | number | No | 타임아웃 (ms, 기본: 120000) |

**허용된 명령어:**
- 파일: ls, cat, head, tail, find, grep
- 개발: node, npm, python, git, docker
- 네트워크: curl, wget, ping

**차단된 패턴:**
- rm -rf /
- sudo, su
- git push --force

---

### python

Python 코드를 실행합니다.

**Parameters:**
| 이름 | 타입 | 필수 | 설명 |
|------|------|------|------|
| code | string | Yes | Python 코드 |
| timeout | number | No | 타임아웃 (ms) |

---

### node-exec

Node.js 코드를 실행합니다.

---

## Git 도구

### git-status

작업 트리 상태를 반환합니다.

**Response:**
```json
{
  "branch": "main",
  "tracking": "origin/main",
  "ahead": 1,
  "behind": 0,
  "files": {
    "staged": [{"status": "M", "path": "file.js"}],
    "unstaged": [],
    "untracked": ["new-file.js"]
  },
  "clean": false
}
```

---

### git-diff

변경 사항을 반환합니다.

**Parameters:**
| 이름 | 타입 | 필수 | 설명 |
|------|------|------|------|
| staged | boolean | No | staged 변경만 |
| file | string | No | 특정 파일만 |
| context | number | No | 컨텍스트 라인 |

---

### git-log

커밋 히스토리를 반환합니다.

**Parameters:**
| 이름 | 타입 | 필수 | 설명 |
|------|------|------|------|
| limit | number | No | 커밋 수 (기본: 10) |
| author | string | No | 작성자 필터 |
| since | string | No | 시작 날짜 |

---

### git-commit

커밋을 생성합니다.

**Parameters:**
| 이름 | 타입 | 필수 | 설명 |
|------|------|------|------|
| message | string | Yes | 커밋 메시지 |
| files | array | No | 스테이징할 파일 |
| all | boolean | No | 모든 변경 스테이징 |

---

### git-branch

브랜치를 관리합니다.

**Parameters:**
| 이름 | 타입 | 필수 | 설명 |
|------|------|------|------|
| action | string | No | list/create/delete/checkout |
| name | string | No | 브랜치 이름 |

---

### git-stash

작업을 임시 저장합니다.

---

### git-add

파일을 스테이징합니다.

---

### git-reset

스테이징을 취소합니다.

---

## 웹 도구

### web-search

멀티 소스 웹 검색 (SearXNG, DuckDuckGo, Brave).

**Parameters:**
| 이름 | 타입 | 필수 | 설명 |
|------|------|------|------|
| query | string | Yes | 검색어 |

---

### web-fetch

URL 콘텐츠를 추출합니다.

**Parameters:**
| 이름 | 타입 | 필수 | 설명 |
|------|------|------|------|
| url | string | Yes | URL |

---

### weather

날씨를 조회합니다 (wttr.in API).

**Parameters:**
| 이름 | 타입 | 필수 | 설명 |
|------|------|------|------|
| location | string | Yes | 위치 |

---

### shorten

URL을 단축합니다 (is.gd API).

**Parameters:**
| 이름 | 타입 | 필수 | 설명 |
|------|------|------|------|
| url | string | Yes | 원본 URL |

---

## API 사용

### REST API

```bash
curl -X POST http://localhost:18789/api/tools/execute \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tool": "file-grep",
    "params": {
      "pattern": "TODO",
      "path": "./src",
      "type": "js"
    }
  }'
```

### JavaScript

```javascript
const response = await fetch('http://localhost:18789/api/tools/execute', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    tool: 'git-status',
    params: { path: '.' }
  })
});

const result = await response.json();
console.log(result);
```

---

## 보안

### 차단된 경로
- `/etc`, `/root`, `/var/log`
- `C:\Windows`, `C:\Program Files`
- `.ssh`, `.gnupg`, `.aws`

### 차단된 명령어
- `rm -rf /`
- `sudo`, `su`
- `git push --force`
- `docker rm -f`

### Path Traversal 방지
- `..` 포함 경로 차단
- 절대 경로 검증
