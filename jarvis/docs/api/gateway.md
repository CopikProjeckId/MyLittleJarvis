# JARVIS Gateway API

JARVIS Gateway는 REST API와 WebSocket을 제공합니다.

## Base URL

```
http://localhost:18789
```

## 인증

Bearer Token 인증을 사용합니다.

```bash
Authorization: Bearer YOUR_TOKEN
```

로컬 연결 (127.0.0.1)은 토큰 없이 접근 가능합니다 (설정 가능).

---

## REST API

### Health Check

```http
GET /health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": 1234567890,
  "uptime": 3600,
  "version": "2.0.0"
}
```

---

### Chat

```http
POST /api/chat
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN

{
  "message": "안녕하세요"
}
```

**Response:**
```json
{
  "response": "안녕하세요! 무엇을 도와드릴까요?",
  "agent": "assistant",
  "duration": 1234
}
```

---

### Status

```http
GET /api/status
Authorization: Bearer YOUR_TOKEN
```

**Response:**
```json
{
  "orchestrator": "qwen3:1.7b",
  "assistant": "qwen3:8b",
  "claude": "unconfigured",
  "contextSize": 5,
  "gateway": {
    "port": 18789,
    "clients": 2
  }
}
```

---

### Tools

#### List Tools

```http
GET /api/tools
Authorization: Bearer YOUR_TOKEN
```

**Response:**
```json
{
  "tools": [
    {
      "name": "file-read",
      "description": "Read file contents",
      "parameters": {...}
    }
  ]
}
```

#### Execute Tool

```http
POST /api/tools/execute
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN

{
  "tool": "git-status",
  "params": {
    "path": "."
  }
}
```

**Response:**
```json
{
  "result": {
    "branch": "main",
    "clean": true
  }
}
```

---

### Memory

#### Search

```http
GET /api/memory/search?q=키워드&limit=10
Authorization: Bearer YOUR_TOKEN
```

#### Store

```http
POST /api/memory
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN

{
  "content": "저장할 내용",
  "metadata": {
    "source": "user",
    "type": "note"
  }
}
```

---

### IDE Endpoints

#### Code Completion

```http
POST /api/ide/completion
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN

{
  "prefix": "function hello",
  "context": "// JavaScript file\n"
}
```

#### Explain Code

```http
POST /api/ide/explain
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN

{
  "code": "const x = arr.reduce((a, b) => a + b, 0);",
  "language": "javascript"
}
```

#### Fix Errors

```http
POST /api/ide/fix
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN

{
  "code": "const x = ",
  "diagnostics": [
    {"line": 1, "message": "Unexpected end of input"}
  ],
  "language": "javascript"
}
```

#### Refactor

```http
POST /api/ide/refactor
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN

{
  "code": "function foo() { ... }",
  "type": "rename",
  "target": "bar",
  "language": "javascript"
}
```

---

## WebSocket API

### Connection

```javascript
const ws = new WebSocket('ws://localhost:18789');
```

### Messages

#### Auth

```json
{
  "type": "auth",
  "data": {
    "token": "YOUR_TOKEN"
  }
}
```

#### Chat

```json
{
  "type": "chat",
  "data": {
    "message": "안녕하세요"
  }
}
```

#### Ping

```json
{
  "type": "ping"
}
```

#### Status

```json
{
  "type": "status"
}
```

### Example

```javascript
const ws = new WebSocket('ws://localhost:18789');

ws.onopen = () => {
  // Authenticate
  ws.send(JSON.stringify({
    type: 'auth',
    data: { token: 'YOUR_TOKEN' }
  }));
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);

  switch (message.type) {
    case 'connected':
      console.log('Connected:', message.clientId);
      break;
    case 'auth':
      if (message.success) {
        // Send chat message
        ws.send(JSON.stringify({
          type: 'chat',
          data: { message: '안녕하세요' }
        }));
      }
      break;
    case 'chat':
      console.log('Response:', message.response);
      break;
    case 'error':
      console.error('Error:', message.error);
      break;
  }
};
```

---

## Rate Limiting

기본 설정: 100 requests / 60 seconds

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1234567890
```

---

## CORS

모든 오리진 허용 (로컬 개발용).

프로덕션에서는 `CORS_ORIGINS` 환경변수로 제한:

```env
CORS_ORIGINS=https://your-domain.com,https://app.your-domain.com
```

---

## Error Responses

```json
{
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

### Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request |
| 401 | Unauthorized |
| 404 | Not Found |
| 429 | Too Many Requests |
| 500 | Internal Server Error |
