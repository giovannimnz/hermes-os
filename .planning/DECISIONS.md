# Decisions — M001: hermes-os

## ADRs (Architecture Decision Records)

### ADR-001: Adapter Pattern for Dual Target

**Status:** Accepted
**Date:** 2026-05-27

**Context:** We need the same React renderer to work in Electron (IPC) and browser (HTTP/WS).

**Decision:** Use the `DesktopClient` adapter pattern. Extract a typed interface from the preload, then implement two adapters:
- `ElectronAdapter` — wraps IPC calls (existing preload logic)
- `WebAdapter` — wraps HTTP/WS calls to `hermes-ws-gateway`

The renderer is completely unaware of which adapter is running.

**Consequences:**
- Positive: Zero changes to renderer logic
- Positive: New targets only need new adapters
- Negative: 50+ methods must be implemented in WebAdapter

**References:** Inspired by upstream `migrate-to-tauri` branch (`src/shared/desktop/types.ts`)

---

### ADR-002: Web Target Uses hermes-ws-gateway as Backend

**Status:** Accepted
**Date:** 2026-05-27

**Context:** We already have `hermes-ws-gateway` running on `10.1.1.x:8200`. Should we build a new backend or use the existing gateway?

**Decision:** Use `hermes-ws-gateway` as the backend for webapp. Add missing REST endpoints to the gateway (profiles, memory, soul, session messages, FTS, enhanced execute).

**Consequences:**
- Positive: Reuse existing infrastructure
- Positive: Single source of truth for sessions (PostgreSQL)
- Positive: WebSocket streaming already working
- Negative: Gateway needs ~15 new endpoints
- Negative: Gateway must support CORS for web deployment

---

### ADR-003: Keep Electron Build Unchanged

**Status:** Accepted
**Date:** 2026-05-27

**Context:** The Electron target must continue working exactly as today.

**Decision:** The Electron build (`npm run build`) stays 100% unchanged. We add a second build target (`npm run build:web`) that produces the web bundle. The preload continues to use IPC exactly as before.

**Consequences:**
- Positive: Zero risk to existing Electron users
- Positive: Electron and web can be developed independently
- Negative: Two build pipelines to maintain

---

### ADR-004: CSS Lives in `src/shared/assets/`

**Status:** Accepted
**Date:** 2026-05-27

**Context:** The renderer uses `src/renderer/src/assets/main.css`. Both Electron and web need to import it.

**Decision:** Move `main.css` to `src/shared/assets/main.css`. Both `src/renderer/src/main.tsx` (Electron) and `src/web/main.tsx` (web) import from the shared location.

**Consequences:**
- Positive: Single source of truth for styles
- Negative: Move required during Phase 07

---

### ADR-005: No TypeScript Changes to Renderer

**Status:** Accepted
**Date:** 2026-05-27

**Context:** The renderer (`src/renderer/src/`) currently uses local type declarations in `env.d.ts`.

**Decision:** Renderer TypeScript config (`tsconfig.web.json`) updated to include `src/shared/` paths. Renderer imports types from `src/shared/`. No changes to `.tsx` component logic.

**Consequences:**
- Positive: Renderer doesn't need major refactoring
- Negative: Shared types must be maintained carefully

---

### ADR-006: WebApp Auth = Gateway Bearer Token

**Status:** Accepted
**Date:** 2026-05-27

**Context:** Electron uses credential pool stored in `auth.json`. What's the auth model for webapp?

**Decision:** Webapp uses the same Bearer token as the gateway (`~/.hermes/gateway_ws_token`). User enters token once in ConnectGateway screen, stored in `localStorage`.

**Consequences:**
- Positive: Same auth as gateway, no new system
- Negative: Token in localStorage (XSS risk) — acceptable for self-hosted
- Future: Consider httpOnly cookie for production deployment

---

### ADR-007: Shared Session Store via PostgreSQL

**Status:** Accepted
**Date:** 2026-05-27

**Context:** Electron stores sessions in `~/.hermes/profiles/<name>/state.db` (SQLite). Webapp needs to access these sessions.

**Decision:** Both targets use the gateway's PostgreSQL session store (`gateway_ws.sessions` + new `gateway_ws.session_messages` table). Electron IPC layer is unchanged, but sessions sync to gateway via existing hooks (if any) or new sync mechanism.

**Note:** Session sync from Electron local SQLite → gateway PostgreSQL is a future enhancement (not in M001 scope). M001 focuses on webapp as the primary session manager.

---

### ADR-008: Screens: Remove, Hide, Adapt

**Status:** Accepted
**Date:** 2026-05-27

**Context:** Which screens from the Electron app work on web?

**Decision:**
- `ELECTRON_ONLY` (Install, Welcome, Setup): Not rendered on web
- `FULL` (Chat, Agents, Soul, Memory, Tools, Schedules, Models): Work identically
- `ADAPTED` (Sessions, Office, Kanban, Providers, Skills, Settings): Need gateway endpoints or UI adaptation
- `HIDDEN` (Gateway): Webapp IS the gateway connection — not needed

---

### ADR-009: No Tauri in This Milestone

**Status:** Accepted
**Date:** 2026-05-27

**Context:** Upstream has a `migrate-to-tauri` branch. Should we include Tauri?

**Decision:** M001 scope is Electron + Web only. Tauri is a future milestone. The adapter pattern established here makes Tauri straightforward to add later.

---

### ADR-010: Version Bump to v0.6.0

**Status:** Accepted
**Date:** 2026-05-27

**Context:** Fork is at `v0.5.1` from upstream.

**Decision:** Bump to `v0.6.0` — major architectural change (dual target) warrants minor version bump per semver (0.x.y can break anything, so 0.5.1 → 0.6.0 signals "new major capability").
