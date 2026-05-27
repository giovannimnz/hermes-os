# Phase 03: Gateway REST Endpoints — Missing Operations

## Goal

Add to `hermes-ws-gateway` all REST endpoints needed by the web adapter to fully replace the Electron IPC layer. Without these, the webapp will have missing functionality.

## Requirements

### R01 — Profile Management
```
GET    /profiles              → list profiles (from gateway_db)
POST   /profiles              → create profile (name, clone)
DELETE /profiles/<name>       → delete profile
PATCH  /profiles/<name>      → update profile fields
```
- Uses PostgreSQL `gateway_ws.profiles` table (create if not exists)
- Profile = name + hermes_home path + model config
- Clone = copy model config, soul, memory from existing

### R02 — Session Messages
```
GET    /sessions/<key>/messages
```
- Returns all messages for a Hermes session from `gateway_ws.session_messages` table
- Requires new `gateway_ws.session_messages` table:
```sql
CREATE TABLE gateway_ws.session_messages (
  id SERIAL PRIMARY KEY,
  session_key TEXT NOT NULL,
  role TEXT NOT NULL,  -- 'user' | 'assistant'
  content TEXT NOT NULL,
  attachments JSONB,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON gateway_ws.session_messages(session_key, timestamp);
```

### R03 — Session Search (FTS)
```
GET    /sessions/search?q=<query>&limit=20
```
- PostgreSQL full-text search on `session_messages.content`
- Returns: session_key, title, snippet, started_at, message_count

### R04 — Memory Operations
```
GET    /memory/<profile>         → read memory entries
POST   /memory/<profile>         → add entry
PATCH  /memory/<profile>/<idx>   → update entry
DELETE /memory/<profile>/<idx>   → remove entry
GET    /memory/<profile>/stats   → { totalSessions, totalMessages }
```
- New table `gateway_ws.memory_entries`:
```sql
CREATE TABLE gateway_ws.memory_entries (
  id SERIAL PRIMARY KEY,
  profile TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### R05 — Soul Operations
```
GET    /soul/<profile>     → read soul/personality
PUT    /soul/<profile>     → write soul
DELETE /soul/<profile>     → reset soul to default
```
- New table `gateway_ws.soul`:
```sql
CREATE TABLE gateway_ws.soul (
  profile TEXT PRIMARY KEY,
  content TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### R06 — Credential Pool
```
GET    /credentials/<profile>       → get all provider credentials
PUT    /credentials/<provider>/<profile> → set credentials for provider
DELETE /credentials/<provider>/<profile> → remove credentials
```
- New table `gateway_ws.credentials`:
```sql
CREATE TABLE gateway_ws.credentials (
  id SERIAL PRIMARY KEY,
  profile TEXT NOT NULL,
  provider TEXT NOT NULL,
  auth_type TEXT NOT NULL DEFAULT 'api_key',
  api_key TEXT,
  access_token TEXT,
  refresh_token TEXT,
  base_url TEXT,
  priority INTEGER DEFAULT 0,
  label TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(profile, provider, label)
);
```

### R07 — Enhanced `/execute` with History + Attachments
Current gateway execute only accepts `prompt`. Extend WebSocket message to also accept:
```json
{
  "type": "execute",
  "prompt": "...",
  "session_id": "optional-session-key",
  "model": "optional-model",
  "history": [
    { "role": "user", "content": "..." },
    { "role": "assistant", "content": "..." }
  ],
  "attachments": [
    { "type": "image", "url": "data:image/...", "name": "img.png" }
  ],
  "context_folder": "/path/to/cwd"
}
```
Also add REST endpoint:
```
POST   /execute/full
Body: same as above
```
Returns: streaming via SSE or `chunk`/`result` WebSocket frames (same as existing execute)

### R08 — Model Discovery
```
POST   /models/discover
Body: { "provider": "openai", "baseUrl": "...", "apiKey": "..." }
```
- Proxies to Hermes model discovery CLI
- Returns: { models: string[], status, freeModels? }

### R09 — Skill Installation
```
POST   /skills/install
Body: { "identifier": "category/name", "profile": "default" }
DELETE /skills/<category>/<name>
```
- Runs `hermes skills add/remove` CLI via subprocess

### R10 — Session Cache Sync
```
GET    /sessions/cache?profile=<profile>
POST   /sessions/cache/sync?profile=<profile>
```
- Returns cached session list with generated titles
- Sync regenerates titles from first user message (FTS cleanup)
- Titles generated via: `generateTitle(firstUserMessage)` — same logic as Electron

### R11 — Gateway Status (start/stop for embedded mode)
```
GET    /gateway/status
POST   /gateway/start
POST   /gateway/stop
```
- For when gateway runs embedded (not as standalone service)

### R12 — Toolset Management
```
GET    /toolsets?profile=<profile>
PATCH  /toolsets/<key>?profile=<profile>
Body: { "enabled": true/false }
```

## Gateway Adapter File: `src/gateway_routes.py` (new)

All new endpoints in `src/gateway_routes.py`, imported and registered in `ws-api-server.py`.

## Database Migrations

SQL migration file at `sql/014_hermes_os_webapp.sql`:
```sql
-- Profiles
CREATE TABLE IF NOT EXISTS gateway_ws.profiles (
  name TEXT PRIMARY KEY,
  hermes_home TEXT NOT NULL,
  model TEXT,
  provider TEXT,
  base_url TEXT,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Session Messages
CREATE TABLE IF NOT EXISTS gateway_ws.session_messages (
  id SERIAL PRIMARY KEY,
  session_key TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  attachments JSONB,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_session_messages_session_key ON gateway_ws.session_messages(session_key);
CREATE INDEX IF NOT EXISTS idx_session_messages_timestamp ON gateway_ws.session_messages(timestamp);

-- Memory Entries
CREATE TABLE IF NOT EXISTS gateway_ws.memory_entries (
  id SERIAL PRIMARY KEY,
  profile TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_memory_entries_profile ON gateway_ws.memory_entries(profile);

-- Soul
CREATE TABLE IF NOT EXISTS gateway_ws.soul (
  profile TEXT PRIMARY KEY,
  content TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Credentials
CREATE TABLE IF NOT EXISTS gateway_ws.credentials (
  id SERIAL PRIMARY KEY,
  profile TEXT NOT NULL,
  provider TEXT NOT NULL,
  auth_type TEXT NOT NULL DEFAULT 'api_key',
  api_key TEXT,
  access_token TEXT,
  refresh_token TEXT,
  base_url TEXT,
  priority INTEGER DEFAULT 0,
  label TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(profile, provider, label)
);
CREATE INDEX IF NOT EXISTS idx_credentials_profile ON gateway_ws.credentials(profile);
```

## Verification

```bash
# R01: Profiles
curl -H "Authorization: Bearer $TOKEN" http://localhost:8200/profiles
# Expected: 200 OK {"profiles": [...]}

# R04: Memory
curl -H "Authorization: Bearer $TOKEN" http://localhost:8200/memory/default
# Expected: 200 OK

# R07: Enhanced execute with history
curl -X POST http://localhost:8200/execute/full \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "hello", "history": [{"role": "user", "content": "hi"}]}'
# Expected: streaming response

# All new endpoints return 401 without token
curl http://localhost:8200/profiles
# Expected: 401

# DB tables exist
psql -h localhost -p 8745 -U hindsight -d hindsight -c "\dt gateway_ws.*"
# Expected: lists all new tables
```

## Notes

Dependencies: Phase 01 (fork setup)
Gateway lives at: `~/GitHub/hermes-ws-gateway/`
