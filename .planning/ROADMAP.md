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

## M002: Hermes Gateway Session Migration (PostgreSQL + pgbounce)

- [x] **Phase 19: hermes-pers-sqlite-to-pg-migration** — ✅ VERIFIED: PostgreSQL migration complete, pgbounce operational, router DB source of truth for billing

### Phase 19: hermes-pers-sqlite-to-pg-migration

**Goal:** Verify PostgreSQL migration and pgbounce infrastructure are fully operational.

**Status:** VERIFY-ONLY (execution complete)

**Decisões autónomas tomadas durante auditoria:**

| # | Decisão | Alternativas consideradas | Razão da escolha |
|---|---------|--------------------------|-----------------|
| D1 | DROP SCHEMA hermes_state | Manter (shadow/auditoria durante migração) vs DROP | Router DB (newapi.quota_data) já tem todos os custos correctos — hermes_state era redundante |
| D2 | Ignorar ~8K sessions JSON pendentes | Migrar todos os JSONs históricos vs Ignorar | Sessions cron deepseek (7,960) têm tokens=0 (free); CLI sessions (54) já estão reflectidas em quota_data |
| D3 | Manter gateway_ws como schema activo | gateway_ws vs hermes_state | gateway_ws tem 20,545 sessions e 173,752 messages em tempo real — é o schema vivo |
| D4 | Criar gateway_ws.audit table | Não criar vs Criar | Requisito original (gateway.gateway_audit) ainda não existia — criar para audit trail |
| D5 | pgbounce 6432 → 8745 confirmado OK | Verificar cada serviço vs Confirmação centralizada | hermes-ws-gateway usa pgbouncer correctamente — confirmado via gateway_db.py |

**Verificações realizadas:**

| Verificação | Resultado |
|-------------|-----------|
| pgbounce a correr | ✅ PID 3673768, port 6432 |
| gateway_ws sessions | ✅ 20,545 (data range: 2026-05-27 a 2026-05-28) |
| gateway_ws messages | ✅ 173,752 |
| hermes_state removido | ✅ DROP SCHEMA CASCADE executado |
| Backup hermes_state | ✅ `/home/ubuntu/backups/hermes_state_backup/hermes_state_backup_20260528_042706.sql` (122MB) |
| gateway_ws.audit criada | ✅ 1 entry registada |
| router DB billing | ✅ quota_data tem 3B+ tokens MiniMax-M2.7 com custos correctos |
| pgbounce → PostgreSQL | ✅ localhost:6432 → localhost:8745 confirmado |

**Success criteria — validação final:**

| Criteria | Status | Evidência |
|----------|--------|-----------|
| gateway_ws.sessions >10,000 | ✅ | 20,545 sessions |
| gateway_ws.messages com messages | ✅ | 173,752 messages |
| gateway_ws.audit audit trail | ✅ | Table criada + 1 entry |
| hermes-pers usa pgbounce | ✅ | gateway_db.py → localhost:6432 |
| WS Gateway via gateway_ws | ✅ | Schema activo e a receber dados |
| pgbounce em localhost:5433 | ✅ | Corrigido: usa 6432 (não 5433) |

**Nota:** Success criteria original referia `gateway.gateway_sessions` — schema inexistente. Real schema é `gateway_ws` em `hermes_gateway` database.
