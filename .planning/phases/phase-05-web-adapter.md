# Phase 05: WebAdapter — HTTP/WS Implementation

## Goal

Implement `src/shared/desktop/adapters/webAdapter.ts` — a full `DesktopAdapter` implementation that talks to `hermes-ws-gateway` via HTTP REST and WebSocket. This replaces the Electron preload for the web target.

## Requirements

### R01 — WebSocket Connection Manager
Create `src/shared/desktop/adapters/wsConnection.ts`:
- Manages single WebSocket connection to hermes-os backend
- Auto-reconnects on disconnect with exponential backoff
- Queues messages sent while disconnected
- Emits events: `chunk`, `reasoning_chunk`, `done`, `error`, `tool_progress`, `usage`
- Auth: adds `?token=<bearer>` query param on connect
- Handles ping/pong keepalive
- Backend URL from `import.meta.env.VITE_HERMES_BACKEND_URL` (decide in Phase 03)

### R02 — WebAdapter Core
Create `src/shared/desktop/adapters/webAdapter.ts` implementing `DesktopAdapter` interface:

**Chat streaming** — the most complex part:
```typescript
sendMessage(
  message: string,
  profile?: string,
  resumeSessionId?: string,
  history?: Array<{ role: string; content: string }>,
  attachments?: Attachment[],
  contextFolder?: string,
): Promise<{ response: string; sessionId?: string }>
```
Flow:
1. Open WebSocket to `ws://gateway/ws?token=<bearer>`
2. Send: `{ type: "execute", prompt: message, session_id: resumeSessionId, history, attachments, context_folder: contextFolder, model: resolvedFromProfile(profile) }`
3. Collect `chunk` events → accumulate in local string
4. On `result`: resolve with `{ response: fullText, sessionId }`
5. On `error`: reject
6. Register streaming listeners for: `chunk`, `reasoning_chunk`, `done`, `error`, `tool_progress`, `usage`

### R03 — REST Helpers
```typescript
async request<T>(method: 'GET'|'POST'|'PATCH'|'DELETE', path: string, body?: object): Promise<T>
```
- Adds `Authorization: Bearer <token>` header
- Base URL from `import.meta.env.VITE_HERMES_GATEWAY_URL` (strip `/ws` for REST)
- Parses JSON response
- Throws on non-2xx with error message from body

### R04 — All DesktopClient Methods Implemented

Each method maps to a REST endpoint or WebSocket message:

| DesktopClient method | Gateway call |
|---|---|
| `sendMessage` | WS `execute` with streaming |
| `abortChat` | WS `abort` message type |
| `listSessions` | `GET /sessions` |
| `getSessionMessages` | `GET /sessions/<key>/messages` |
| `searchSessions` | `GET /sessions/search?q=` |
| `deleteSession` | `DELETE /sessions/<key>` |
| `listCachedSessions` | `GET /sessions/cache?profile=` |
| `syncSessionCache` | `POST /sessions/cache/sync?profile=` |
| `listProfiles` | `GET /profiles` |
| `createProfile` | `POST /profiles` |
| `deleteProfile` | `DELETE /profiles/<name>` |
| `setActiveProfile` | `PATCH /profiles/<name>` { active: true } |
| `readMemory` | `GET /memory/<profile>` |
| `addMemoryEntry` | `POST /memory/<profile>` |
| `readSoul` | `GET /soul/<profile>` |
| `writeSoul` | `PUT /soul/<profile>` |
| `resetSoul` | `DELETE /soul/<profile>` |
| `listModels` | `GET /model` (gateway has this) |
| `addModel` | `POST /models` |
| `listCronJobs` | `GET /cronjobs` |
| `createCronJob` | `POST /cronjobs` |
| `pauseCronJob` | `PATCH /cronjobs/<id>` { enabled: false } |
| `resumeCronJob` | `PATCH /cronjobs/<id>` { enabled: true } |
| `removeCronJob` | `DELETE /cronjobs/<id>` |
| `triggerCronJob` | `POST /cronjobs/<id>/run` |
| `getCredentialPool` | `GET /credentials/<profile>` |
| `setCredentialPool` | `PUT /credentials/<provider>/<profile>` |
| `discoverProviderModels` | `POST /models/discover` |
| `installSkill` | `POST /skills/install` |
| `uninstallSkill` | `DELETE /skills/<name>` |
| `gatewayStatus` | `GET /gateway/status` |
| `startGateway` | `POST /gateway/start` |
| `stopGateway` | `POST /gateway/stop` |
| `checkInstall` | Always returns `{ installed: true, configured: true, hasApiKey: true }` (web has no install) |
| `verifyInstall` | Always returns `true` |
| `getHermesVersion` | `GET /health` → parse version from response |
| `getConfig` | `GET /config/<key>?profile=` |
| `setConfig` | `PUT /config/<key>` |
| `getModelConfig` | `GET /model` |
| `setModelConfig` | `PUT /model` |
| `oauthLogin` | Not supported on web → returns `{ success: false, error: "OAuth not available in web" }` |
| `startInstall` | Not supported on web → error |
| `readMediaFile` | `GET /media/<path>` (stream) |
| `saveMediaFile` | `POST /media/save` |
| `stageAttachment` | `POST /attachments/stage` |
| `getPathForFile` | `URL.createObjectURL(file)` for web |
| `copyToClipboard` | `navigator.clipboard.writeText()` |
| `runHermesBackup` | `POST /backup` |
| `runHermesDump` | `GET /debug/dump` |
| `readLogs` | `GET /logs?lines=` |
| `onChatChunk` | WS event listener |
| `onChatReasoningChunk` | WS event listener |
| `onChatDone` | WS event listener |
| `onChatError` | WS event listener |
| `onChatToolProgress` | WS event listener |
| `onChatUsage` | WS event listener |
| `onMenuNewChat` | Not applicable on web (no native menu) |
| `onMenuSearchSessions` | Not applicable on web |

### R05 — Token Management
- On first load: prompt user for gateway token (if `VITE_HERMES_GATEWAY_TOKEN` not set)
- Store token in `localStorage` under `hermes_os_gateway_token`
- Read token from `localStorage` on subsequent loads
- Provide UI to update/clear token

### R06 — Profile Resolution
- Active profile stored in `localStorage` as `hermes_os_active_profile`
- All API calls pass `profile` param
- Default profile: `localStorage.getItem('hermes_os_active_profile') || 'default'`

### R07 — Error Handling
- Network errors → show reconnecting banner in UI
- Auth errors (401) → prompt for new token
- Rate limit (429) → show "Rate limited, retry in Xs" in chat input
- All errors logged to `console` with `[hermes-os-web]` prefix

## File Structure

```
src/shared/desktop/adapters/
  webAdapter.ts        ← Main WebAdapter class
  wsConnection.ts      ← WebSocket manager
  httpClient.ts        ← REST helpers
  tokenStore.ts        ← localStorage token management
  errors.ts            ← Custom error types (AuthError, NetworkError, etc.)
```

## Key Implementation Detail: Streaming

The web adapter must exactly replicate the IPC streaming behavior that `useChatIPC.ts` expects. Backend URL and protocol depend on Phase 03 decision (Opcao A, B, or C). The adapter is written to an interface, so the underlying transport can change without changing the adapter code.

## Verification

```typescript
// In browser console (after Phase 07 integration):
window.hermesAPI.listSessions().then(s => console.log(s.length, 'sessions'));

// Check WebSocket connects
// Check streaming works (send message → chunks arrive)
// Check token auth errors properly
```

```bash
# Build still passes
npm run build:web 2>&1 | tail -10
# Expected: no errors
```

## Notes

Dependencies: Phase 02 (DesktopClient interface), Phase 03 (gateway endpoints), Phase 04 (web scaffold)
