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

### Current Endpoints (port 8200)
**Public:**
- `GET /health` → `{"status": "ok"}`
- `GET /ready` → pool status, connections

**Auth-gated REST:**
- `GET /skills` → list skills
- `GET /model` → current model config
- `POST /execute` → sync execute (no streaming)
- `GET/POST/PATCH/DELETE /sessions` → session CRUD
- `GET/POST/PATCH/DELETE /cronjobs` → cron CRUD

**WebSocket (port 8200):**
- `ws://host:8200/ws?token=<bearer>`
- Client sends: `{type: "execute", prompt, session_id?, model?}`
- Server sends: `{type: "chunk", content}` / `{type: "result", result: {output, ok}}`

### Critical Gaps for Webapp
| Gap | Impact | Phase |
|-----|--------|-------|
| No `history` in execute | Can't resume conversations | 03 |
| No `attachments` in execute | Can't send images | 03 |
| No session messages endpoint | Can't load conversation history | 03 |
| No FTS search | Can't search old messages | 03 |
| No profiles endpoints | Can't manage profiles | 03 |
| No memory endpoints | Can't manage memory | 03 |
| No soul endpoints | Can't manage personality | 03 |
| No credential pool endpoints | Can't manage API keys | 03 |
| No session cache sync | Can't generate titles | 03 |

### PostgreSQL Schema (gateway_db.py)
- Database: `hindsight` (via pgBouncer `localhost:8475`)
- Schema: `gateway_ws`
- Tables: `sessions`, `events`, `metrics`, `config`, `tokens`, `cronjobs`
- **Missing:** `session_messages`, `profiles`, `memory_entries`, `soul`, `credentials`

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
