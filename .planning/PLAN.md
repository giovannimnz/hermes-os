# M001: hermes-os — Electron + Web Universal App

**Status:** In Progress
**Started:** 2026-05-27
**Goal:** Transform `hermes-desktop` fork into a dual-target monorepo: Electron app + webapp, same codebase, adapter pattern.

---

## Milestone Summary

Fork `hermes-desktop` (v0.5.1) as `hermes-os`, then implement dual-target architecture: same React renderer works in Electron (via IPC adapter) and browser (via HTTP/WS adapter to `hermes-ws-gateway`).

## Research Findings

### Upstream State
- `fathah/hermes-desktop` latest tag: `v0.5.1` on `main`
- Active development in branches: `0.9-update`, `hermes-v0.7/features` (strip features — not suitable as base)
- Tauri migration branch exists (`migrate-to-tauri`) — demonstrates `DesktopClient` adapter pattern (perfect match for our approach)
- Local fork: synchronized with upstream (v0.5.1)

### Key Architecture Insights
1. **Tauri branch** proves renderer can be shared: `src/shared/desktop/types.ts` with `DesktopClient` interface
2. **Gap analysis**: Gateway (port 8200) lacks ~15 endpoints needed for full web support (session messages, memory, soul, profiles, FTS, enhanced execute with history)
3. **Critical streaming gap**: Current gateway `/execute` doesn't support `history` or `attachments` — needs extension
4. **Session cache** is local-only (`better-sqlite3` + `sessions.json`) — gateway needs new table + endpoints
5. **Preload IPC** has 969 lines, 50+ methods — all must be implemented in WebAdapter

### Strategy
```
Electron target (existing):
  preload (IPC) → main process → Hermes CLI / filesystem

Web target (new):
  WebAdapter → hermes-ws-gateway (HTTP/WS) → Hermes CLI / gateway_db (PostgreSQL)
```

### Critical Path
1. Phase 02 (DesktopClient interface) must be done before Phase 05 (WebAdapter)
2. Phase 03 (gateway endpoints) must be done before Phase 05
3. Phase 04 (web scaffold) done in parallel with Phase 02/03
4. Phase 05 (WebAdapter) is the largest single phase
5. Phase 18 (UAT) requires all previous phases complete

---

## Phase Dependencies

```
Phase 01 ─┬─► Phase 02 ──────────────────────────► Phase 05 ─► Phase 10 ─► Phase 18
           │                                              ▲
Phase 04 ─┘                                              │
           └─► Phase 03 (gateway) ────────────────────────┘
Phase 02 ─┬─► Phase 06 ──► Phase 07 ──► Phase 08 ──► Phase 09 ──┼─► Phase 11 ──► Phase 12 ──► Phase 13 ──► Phase 14 ──► Phase 15 ──► Phase 16 ──► Phase 17 ──► Phase 18
           └─► Phase 05 (web adapter) ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Phase Order

| Phase | Name | Est. Size | Dependencies |
|-------|------|-----------|-------------|
| 01 | Fork setup | XS | — |
| 02 | DesktopClient interface | M | 01 |
| 03 | Gateway endpoints | L | 01 |
| 04 | Web renderer scaffold | M | 01 |
| 05 | WebAdapter | XL | 02, 03, 04 |
| 06 | ElectronAdapter cleanup | S | 02 |
| 07 | Shared types migration | M | 02, 04 |
| 08 | Screen audience classification | S | 03 |
| 09 | Electron-only screens removal | S | 04, 05 |
| 10 | Web build verification | S | 05, 09 |
| 11 | Auth flow | M | 09, 10 |
| 12 | Streaming chat web | M | 05, 10 |
| 13 | Session cache sync web | M | 03, 05, 10 |
| 14 | Profile management web | S | 03, 05, 10 |
| 15 | Electron build verification | S | 02, 06, 07 |
| 16 | Web deploy config | S | 10 |
| 17 | PWA offline | M | 16 |
| 18 | UAT | L | 10-17 |

**Size key:** XS=<1d, S=1-2d, M=2-4d, L=4-7d, XL=7-14d

---

## Verification Strategy

- Phase-level: each phase has specific `npm run` commands or curl tests in its plan
- Build-level: `npm run build` (Electron) + `npm run build:web` must both pass
- Type-level: `npm run typecheck` passes with zero errors
- UAT-level: 18-phase manual + automated checklist (Phase 18)

---

## Risks & Mitigations

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Gateway endpoint gaps discovered late | High | Medium | Phase 03 before Phase 05 — verify gateway first |
| Streaming performance (WS vs IPC) | Medium | Low | WebSocket is battle-tested; gateway already has streaming |
| CORS issues in production | Medium | Medium | Phase 16 includes CORS/reverse-proxy config |
| WebRTC/attachments complex | Medium | Medium | Phase 03 includes attachment staging endpoints |
| Native modules (better-sqlite3) | Low | Low | Not needed for web — gateway uses PostgreSQL |
| Multi-target build complexity | Medium | Medium | electron-vite supports multi-target; Phase 04 validates |

---

## Out of Scope (This Milestone)

- Mobile app (React Native / Expo) — future milestone
- Tauri target — future milestone
- Changes to upstream `fathah/hermes-desktop` — we only pull from upstream
- Backend changes to Hermes Agent itself — only gateway is modified
- Authentication beyond Bearer token (OAuth, SSO) — future work
