# Project: hermes-os

Fork de [fathah/hermes-desktop](https://github.com/fathah/hermes-desktop) — `giovannimnz/hermes-os`.

## Resumo

Fork do hermes-desktop com objetivo de soportar **dois targets do mesmo codebase**: o Electron app original (desktop) E um webapp (browser). Monorepo com arquitetura adapter que permite ao renderer React communicate via IPC (Electron) ou HTTP/WebSocket (web) — sem mudanças no código do renderer.

## Estratégia Geral

```
hermes-os/
  src/
    renderer/src/         ← UI React (compartilhado — zero mudanças entre Electron e web)
    preload/              ← IPC bridge do Electron (Electron-only)
    main/                 ← Processo main do Electron (Electron-only)
    shared/               ← Tipos e abstrações compartilhados
      desktop/
        types.ts         ← Interface DesktopClient (contrato entre renderer e shell)
        adapters/
          electronAdapter.ts  ← IPC (preload atual)
          gatewayAdapter.ts  ← HTTP/WS pro hermes-ws-gateway
          webAdapter.ts       ← Browser-native (localStorage, fetch)
    web/                  ← Entry point Vite para webapp
      main.tsx
      index.html
      vite.config.ts
```

## Fork Relationship

- **Upstream:** `https://github.com/fathah/hermes-desktop` (main, v0.5.1)
- **Fork:** `https://github.com/giovannimnz/hermes-os`
- **Local:** `/home/ubuntu/GitHub/hermes-desktop`
- **Remote:** `upstream` = fathah, `origin` = giovannimnz/hermes-os

## Backend

Dois gateways coexistem em portas diferentes com propositos distintos:

| Gateway | Stack | Porta WS | Porta HTTP | Protocolo | Session Store |
|---------|-------|---------|-----------|-----------|---------------|
| hermes-ws-gateway | Python asyncio | 8300 | 8301 | JSON frames | Docker SQLite (`hermes-pers`) |
| hermes-claw-gateway | Node.js | 8400 | 8401 | OpenClaw ACP v3 | PostgreSQL (`gateway_claw`) |

### O que cada gateway ja tem:
- **hermes-ws-gateway**: streaming chat, cron CRUD, skills list, model config
- **hermes-claw-gateway**: ACP agent execution, streaming, cron, skills, Plane API, audit log

### O que hermes-os webapp precisa (gap):
- Profiles, session message history, memory, soul, credential pool, FTS search
- **Nenhum gateway tem isso** — Phase 03 decide a arquitetura

### Opcoes em analise (Phase 03):
- **Opcao A:** Novo FastAPI service dedicado ao hermes-os (porta 8500)
- **Opcao B:** Extender hermes-claw-gateway com frames ACP
- **Opcao C:** Hybrid — FastAPI leve + hermes-claw-gateway pra execucao

## Dependencias Externas (atuais)

| Serviço | Host | Porta | Notas |
|---------|------|-------|-------|
| hermes-ws-gateway | 10.1.1.x | 8300/8301 | Chat streaming, cron, skills |
| hermes-claw-gateway | 10.1.1.x | 8400/8401 | ACP agent execution (Paperclip, Plane) |
| PostgreSQL | localhost | 8745 | Schema `gateway_claw` (via pgBouncer :8475) |
| hermes-pers (Docker) | localhost | — | SQLite sessions (hermes-ws-gateway) |

## Infraestrutura de Build

- **Electron:** electron-vite (configuração atual mantida)
- **Webapp:** Vite com entry point separada (`src/web/`)
- **Monorepo tooling:** npm workspaces (futuro) ou package.json único
- **Deploy webapp:** Vercel / Cloudflare Pages / Docker (a definir)

## Design System

Mantido igual ao original:
- Tailwind CSS v4 + CSS Variables (dark/light)
- Lucide React icons
- i18next + react-i18next
- react-markdown + syntax highlighter

## Screens (14)

Electron + Web (comportamento adaptado):
- Chat, Sessions, Agents, Office, Kanban, Models, Providers, Skills, Soul, Memory, Tools, Schedules, Gateway, Settings

Screens Electron-only (removidas no webapp):
- Install, Welcome, Setup (local install flow)

Screens adaptadas:
- Settings — remote config em vez de local
- Gateway — status do gateway remoto em vez de subprocess local
