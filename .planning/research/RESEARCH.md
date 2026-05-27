# Research — M001: hermes-os

## Upstream Repository Analysis

### Current Version
- **Local fork:** `giovannimnz/hermes-os` (GitHub) / `/home/ubuntu/GitHub/hermes-desktop` (local)
- **Upstream:** `fathah/hermes-desktop` (GitHub)
- **Latest tag:** `v0.5.1` — both local and upstream at same version
- **Commits:** ~465 total on upstream

### Active Branches in Upstream
| Branch | Description | Suitability |
|--------|-------------|-------------|
| `main` | Stable v0.5.1 | ✅ Use as base |
| `0.9-update` | Massive stripping: removes SSH, Kanban, Cron, Remote, OAuth | ❌ Too aggressive |
| `hermes-v0.7/features` | Even more stripped, no i18n, fewer screens | ❌ Not our base |
| `migrate-to-tauri` | Tauri 2.0 scaffold with `DesktopClient` interface | ✅ Pattern reference |
| `remote-connection` | Remote HTTP mode | ⚠️ Reference only |
| `cron-jobs` | Cron job UI enhancements | ⚠️ Reference only |

### What the Tauri Branch Proves
The `migrate-to-tauri` branch demonstrates the exact adapter pattern we need:
```
src/shared/desktop/types.ts       — DesktopClient interface
src/shared/desktop/electron.ts    — createElectronDesktopClient()
apps/desktop-tauri/src/tauriClient.ts — createTauriDesktopClient()
```
The renderer React imports from `@renderer` alias and is unaware of which shell is running. This is the blueprint for our fork.

### Key Code Locations
| File | Purpose | Relevance |
|------|---------|-----------|
| `src/preload/index.ts` | 969 lines, IPC bridge | Source of truth for DesktopClient interface |
| `src/renderer/src/App.tsx` | Screen router | `screen` state drives all navigation |
| `src/renderer/src/screens/Layout/Layout.tsx` | 14-screen sidebar layout | Screens mapped to `View` type |
| `src/renderer/src/screens/Chat/Chat.tsx` | Main chat with streaming | Most complex IPC consumer |
| `src/renderer/src/screens/Chat/hooks/useChatIPC.ts` | Streaming IPC listeners | Key: `onChatChunk`, `onChatDone`, `onChatReasoningChunk` |
| `src/renderer/src/screens/Chat/hooks/useChatActions.ts` | `sendMessage` caller | Calls `window.hermesAPI.sendMessage()` |
| `src/renderer/src/assets/main.css` | Full design system | CSS variables, dark/light theme |

---

## hermes-ws-gateway Analysis
## hermes-ws-gateway Analysis (Python, porta 8300/8301)

### Stack
- Python asyncio + `websockets` library (NOT FastAPI)
- Auth: HMAC Bearer token (`~/.hermes/gateway_ws_token`)
- Sessions: Docker SQLite em container `hermes-pers` (NAO PostgreSQL diretamente)
- Subprocess pool: Hermes CLI `--stdio`
- Cron: APScheduler

### Current REST Endpoints (porta 8301)
| Method | Path | Descricao |
|--------|------|-----------|
| GET | /health | Health check |
| GET | /ready | Pool status |
| GET | /pool/stats | Subprocess pool stats |
| POST | /pool/drain | Drain pool |
| POST | /pool/restart | Restart pool |
| GET | /skills | List skills |
| GET | /skills/\<cat\>/\<name\> | Get skill content |
| GET | /model | Current model config |
| POST | /telegram/webhook | Telegram webhook |
| GET | /sessions | List sessions |
| GET | /sessions/\<key\> | Get session |
| POST | /sessions | Create/upsert session |
| PATCH | /sessions/\<key\> | Update session |
| DELETE | /sessions/\<key\> | Delete session |
| GET | /cronjobs | List cron jobs |
| GET | /cronjobs/\<id\> | Get cron job |
| POST | /cronjobs | Create cron job |
| PATCH | /cronjobs/\<id\> | Update cron job |
| DELETE | /cronjobs/\<id\> | Delete cron job |
| POST | /cronjobs/\<id\>/run | Trigger cron job |

### WebSocket Streaming (porta 8300)
Client sends: `{type: "execute", prompt, session_id?, model?}`
Server sends: `{type: "chunk", content}` / `{type: "result", result: {output, ok}}`

### Critical Gaps for hermes-os webapp
| Gap | Impact | Severity |
|-----|--------|----------|
| No `history` param in execute | Can't resume conversations | CRITICAL |
| No `attachments` param in execute | Can't send images | CRITICAL |
| No session messages endpoint | Can't load conversation history | CRITICAL |
| No FTS search | Can't search old messages | HIGH |
| No profiles endpoints | Can't manage profiles | HIGH |
| No memory endpoints | Can't manage memory | HIGH |
| No soul endpoints | Can't manage personality | HIGH |
| No credential pool endpoints | Can't manage API keys | MEDIUM |
| No profile concept | Everything is per-gateway, not per-user | CRITICAL |
| Sessions in Docker SQLite | Not directly accessible from outside container | HIGH |

---

## hermes-claw-gateway Analysis (Node.js, porta 8400/8401)

### Stack
- Node.js 18+, `ws`, `pg`, `pino`, `dotenv`, `node-cron`
- Auth: OpenClaw ACP v3 (Bearer token, password, Ed25519)
- Sessions: PostgreSQL schema `gateway_claw`
- Subprocess pool: Hermes CLI `--stdio`
- Protocol: OpenClaw Gateway Protocol v3

### ACP v3 Frames (principais)
```
Client → Server: req agent { message, sessionKey, idempotencyKey, timeout }
Server → Client: event agent { payload.type="text", seq++ }
Server → Client: res agent { payload.text }
Client → Server: req agent.wait { idempotencyKey }
Client → Server: req cron.create / cron.list / cron.delete
Client → Server: req skills.list / skills.execute
Client → Server: req plane.issues (Plane API proxy)
```

### PostgreSQL Schema (gateway_claw)
- `sessions` — session_key, platform, device_id, state, created_at, last_active, message_count
- `audit` — timestamp, session_key, platform, command, duration_ms, tokens_used, cost_usd, ok, error
- `cron_jobs` — job_id, name, schedule, deliver, params, enabled, last_run, last_status

### Critical Gaps for hermes-os webapp
| Gap | Impact | Severity |
|-----|--------|----------|
| No session message history | Can't load conversation context | CRITICAL |
| No profiles table | Nao ha multi-profile | CRITICAL |
| No memory/soul tables | Nao ha persistencia de memory/soul | HIGH |
| No credential pool table | Nao ha persistencia de API keys | HIGH |
| ACP v3 protocol | Webapp precisaria implementar cliente ACP | HIGH |
| Sessions sao stateless | Nao guarda historico de mensagens | CRITICAL |

---

## Key Insights for Implementation

1. **hermes-ws-gateway sessions sao em Docker SQLite** — containers hermes-pers, NAO diretamente acessiveis via PostgreSQL. O acesso e via `docker exec` script dentro de sessions.py.

2. **hermes-claw-gateway usa PostgreSQL** — schema `gateway_claw`. Sessions sao gerenciadas via `sessionKey` (string livre), mas NAO guardam historico de mensagens.

3. **Streaming e o menor problema** — ambos gateways ja tem streaming (chunk/result). O problema e o stateless: execute so recebe `prompt`, nao `history`.

4. **Profile e a maior lacuna** — hermes-desktop e multi-profile (cada profile e um hermesHome diferente). Nenhum gateway tem esse conceito.

5. **A opcao mais realista pra hermes-os webapp:**
   - Opcao B (estender hermes-claw-gateway com ACP) ou
   - Opcao A (FastAPI dedicado)
   - A Opcao C (hybrid) requer manutencao de dois endpoints no frontend

6. **Se hermes-claw-gateway for o destino:**
   - Precisa adicionar tabelas: `profiles`, `session_messages`, `memory_entries`, `soul`, `credentials`
   - Precisa adicionar ACP frames: `req profile.*`, `req memory.*`, `req soul.*`, `req session_history.*`
   - Precisa adicionar streaming com history ao `req agent`

7. **Se FastAPI dedicado:**
   - Mesmo Postgres, mesmo subprocess pool Hermes CLI
   - Nao tem o overhead de implementar ACP v3
   - Mais simples de construir

---

## electron-vite Architecture

### Current Config
```typescript
// electron.vite.config.ts
main: { build: { external: ['better-sqlite3'] } }
preload: { build: { input: { index, askpass } } }
renderer: {
  resolve: { alias: { '@renderer': 'src/renderer/src' } },
  plugins: [tailwindcss(), react()],
}
```

### For Web Target
Two options:
1. **Multi-entry Vite** (chosen): `vite.web.config.ts` as separate config pointing to `src/web/` entry
2. **electron-vite web variant**: `electron-vite build --platform web` — not well documented

Option 1 chosen for simplicity and clear separation.

---

## Build & Tooling

### Current Stack
| Layer | Tool | Version |
|-------|------|---------|
| Bundler (Electron) | electron-vite | 5.0.0 |
| Bundler (Web) | Vite | 7.2.6 |
| UI Framework | React | 19.2.1 |
| Language | TypeScript | 5.9.3 |
| Styling | Tailwind CSS | 4.2.2 |
| i18n | i18next | 25.6.0 |
| Icons | lucide-react | 1.7.0 |
| Markdown | react-markdown | 10.1.0 |
| Testing | Vitest | 4.1.4 |

### Native Modules
- `better-sqlite3` (v12.8.0) — Electron main process only, NOT needed for web
- All native deps are Electron-main-process-only

---

## Key Insights for Implementation

1. **Streaming is the hardest part**: `useChatIPC.ts` expects 6 event types (`onChatChunk`, `onChatReasoningChunk`, `onChatDone`, `onChatError`, `onChatToolProgress`, `onChatUsage`). WebSocket adapter must replicate all 6.

2. **History + Attachments are the second hardest**: Gateway's `execute` currently stateless. Need to extend to support conversation context.

3. **Electron's subprocess is persistent**: The Electron main process keeps a Hermes CLI subprocess alive and streams through it. The gateway uses a fresh subprocess per free-form prompt. For webapp, we use the gateway's stateless approach.

4. **Session titles are generated locally**: `generateTitle()` in session-cache-sync reads first user message from SQLite. On webapp, same logic but gateway computes it.

5. **Profile switching is purely state**: No subprocess restart needed on profile switch — just different API calls to same gateway.
