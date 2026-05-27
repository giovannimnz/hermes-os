# Roadmap

## M001: hermes-os — Electron + Web Universal App

Fork de [fathah/hermes-desktop](https://github.com/fathah/hermes-desktop) com arquitetura dual-target: Electron + Webapp do mesmo codebase.

**Milestone plan:** `.planning/PLAN.md`
**Research:** `.planning/research/RESEARCH.md`
**Decisions:** `.planning/DECISIONS.md`

- [ ] **Phase 01: fork-setup** — Fork setup: upstream sync, rename, package.json update ✅ Done
- [ ] **Phase 02: desktop-client-interface** — DesktopClient interface extraction (shared/types.ts)
- [ ] **Phase 03: gateway-endpoints** — Gateway REST endpoints: missing operations (memory, soul, profiles, sessions messages, FTS)
- [ ] **Phase 04: web-renderer-scaffold** — Web renderer scaffold: Vite config, entry point, zero-render test
- [ ] **Phase 05: web-adapter** — WebAdapter implementation: HTTP/WS for gateway, window.hermesAPI bridge
- [ ] **Phase 06: electron-adapter-cleanup** — ElectronAdapter cleanup: extract from preload into adapter pattern
- [ ] **Phase 07: shared-types-migration** — Shared types migration: types.ts, Attachment, ChatMessage, etc.
- [ ] **Phase 08: screen-audience-classification** — Screen audience classification: which screens work on web, which need adaptation
- [ ] **Phase 09: electron-only-screens-removal** — Electron-only screens removal from web build (Install, Welcome, Setup)
- [ ] **Phase 10: web-build-verification** — Web build verification: vite build succeeds, browser loads, no console errors
- [ ] **Phase 11: auth-flow-web** — Auth flow for web: API key input, token storage, gateway connection test
- [ ] **Phase 12: streaming-chat-web** — Streaming chat on web: WebSocket adapter, chunk rendering, message list
- [ ] **Phase 13: session-cache-sync-web** — Session cache sync: sessions.json via gateway, title generation
- [ ] **Phase 14: web-profile-management** — Web profile management: list/create/delete profiles via gateway
- [ ] **Phase 15: electron-build-verification** — Electron build verification: .exe/.AppImage builds successfully
- [ ] **Phase 16: web-deploy-config** — Web deploy config: Vercel/Cloudflare Pages, environment variables
- [ ] **Phase 17: PWA-offline** — PWA offline support: service worker, cache strategies
- [ ] **Phase 18: uat-hermes-os** — UAT: full feature verification on both Electron and web targets
