# Phase 03: Backend Strategy & New Service

## Goal

Define and start implementing the backend architecture for hermes-os webapp. Two gateways exist with different protocols and purposes — neither fully supports hermes-os webapp needs. This phase decides the architecture and implements the first piece.

## Context: Current Gateway Landscape

```
┌─────────────────────────────────────────────────────────────────┐
│  EXISTING GATEWAYS                                               │
│                                                                  │
│  hermes-ws-gateway (Python)  │  hermes-claw-gateway (Node.js)   │
│  Porta 8300 (WS) / 8301(HTTP)│  Porta 8400 (WS) / 8401 (HTTP)  │
│                              │                                   │
│  Protocolo: JSON frames       │  Protocolo: OpenClaw ACP v3     │
│  Sessions: Docker SQLite     │  Sessions: PostgreSQL             │
│  Profiles: NENHUM conceito    │  Profiles: NENHUM conceito       │
│  Quem usa: Telegram, TUI     │  Quem usa: Paperclip, Plane     │
│  Subprocess pool: Hermes CLI │  Subprocess pool: Hermes CLI     │
│  Session history: NAO tem    │  Session history: NAO tem       │
│  Memory/Soul: NAO tem        │  Memory/Soul: NAO tem           │
└─────────────────────────────────────────────────────────────────┘
```

### O que hermes-os webapp PRECISA que gateways NAO tem:

| Necessidade | hermes-ws-gateway | hermes-claw-gateway |
|---|---|---|
| Profile management | ❌ | ❌ |
| Session message history | ❌ | ❌ |
| Memory per profile | ❌ | ❌ |
| Soul per profile | ❌ | ❌ |
| Credential pool storage | ❌ | ❌ |
| Session FTS search | ❌ | ❌ |
| Streaming com history | ❌ (execute stateless) | ❌ |
| Multi-user / multi-profile | ❌ | ❌ |

### O que gateways JA TEM (reutilizar):

- Subprocess pool Hermes CLI (`hermes --stdio`)
- WebSocket streaming (chunk/result events)
- Cron job CRUD (via `req cron.*` no claw, REST no ws)
- Skills list/execute
- Auth (Bearer token)
- Health endpoints
- PostgreSQL (claw) — usar pro hermes-os
- Audit logging

## DECISAO ARQUITETURAL NECESSARIA

Tres opcoes — precisa decidir:

### Opcao A: FastAPI Service dedicado ao hermes-os
**Novo servico:** `hermes-os-api` (FastAPI, porta 8500)
- Mantem hermes-ws-gateway e hermes-claw-gateway como estao
- hermes-os-webapp conecta na porta 8500
- Usa PostgreSQL (schema `gateway_os`)
- Fala JSON REST + WebSocket (nao ACP)
- Subprocess pool: Hermes CLI
- Scope: profiles, sessions, memory, soul, credentials

```
hermes-os-webapp  →  hermes-os-api:8500  →  Hermes CLI
                           │
                           └──► hermes-claw-gateway:8400 (reuse subprocess pool + skills)
```

**Prós:** Simples, isolado, scope claro
**Contras:** Mais um servico, não reaproveita o ACP

### Opcao B: Extender hermes-claw-gateway com servicos hermes-os
**Adiciona no hermes-claw-gateway:**
- ACP frames para `req profile.*`, `req memory.*`, `req soul.*`, `req session_history.*`
- PostgreSQL schema `gateway_os` tables
- hermes-os-webapp como mais um cliente ACP
- Reaproveita pool + auth do claw

```
hermes-os-webapp  →  hermes-claw-gateway:8400
                           │
                           ├──► ACP req/res (profiles, memory, soul)
                           └──► Hermes CLI subprocess pool
```

**Prós:** Unificado, protocolo único, futuro: todos clientes viram ACP
**Contras:** Acopla hermes-os ao claw, mais complexo de implementar

### Opcao C: Hybrid — hermes-claw-gateway + FastAPI leve
- hermes-claw-gateway: agent execution, cron, skills (ja funciona)
- FastAPI leve: profiles, memory, soul, sessions (o que falta)
- Webapp usa ambos

```
hermes-os-webapp
    ├──► hermes-claw-gateway:8400 (chat execution, cron, skills)
    └──► hermes-os-api:8500     (profiles, memory, soul, sessions)
```

**Prós:** Separa concerns, não overload do claw
**Contras:** Dois endpoints no frontend

## Requirements

- [R01] Decidir entre Opcao A, B ou C
- [R02] Criar PostgreSQL schema `gateway_os` (profiles, session_messages, memory, soul, credentials)
- [R03] Implementar o backend escolhido (FastAPI ou extensao claw)
- [R04] WebSocket streaming com history e attachments
- [R05] Profile CRUD
- [R06] Session messages (CRUD + FTS search)
- [R07] Memory operations
- [R08] Soul operations
- [R09] Integrar subprocess pool do Hermes CLI
- [R10] Auth: Bearer token valido no gateway

## Verification

```bash
# R04: Streaming chat com history
curl -X POST http://localhost:8500/chat \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"message": "continue", "history": [{"role":"user","content":"hello"}]}'
# Expected: streaming response

# R05: Profile CRUD
curl -H "Authorization: Bearer $TOKEN" http://localhost:8500/profiles
# Expected: list profiles

# R06: Session history
curl -H "Authorization: Bearer $TOKEN" http://localhost:8500/sessions/<key>/messages
# Expected: messages array

# R07: Memory
curl -H "Authorization: Bearer $TOKEN" http://localhost:8500/memory/default
# Expected: memory entries
```

## Notes

Dependencies: Phase 01 (fork setup)
