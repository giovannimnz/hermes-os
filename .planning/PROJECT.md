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

- **Gateway:** `~/GitHub/hermes-ws-gateway/` rodando em `10.1.1.x:8200`
- **Auth:** Bearer token (mesmo do gateway — `~/.hermes/gateway_ws_token`)
- **Session store:** PostgreSQL via gateway_db.py (schema `gateway_ws`)
- **Cron:** APScheduler via gateway (porta 8301)
- **Profiles:** Gateway suporta multi-profile via PostgreSQL

## Dependências Externas

| Serviço | Host | Porta | Notas |
|---------|------|-------|-------|
| hermes-ws-gateway | 10.1.1.x | 8200 | WS + HTTP REST |
| hermes-ws-gateway cron | 10.1.1.x | 8301 | APScheduler |
| PostgreSQL (gateway) | localhost | 8745 | Schema gateway_ws |
| pgBouncer | localhost | 8475 | Pool de conexões |

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
