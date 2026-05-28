---
status: complete
phase: 19
milestone: M002
completed: 2026-05-28
---

# Phase 19: hermes-pers-sqlite-to-pg-migration — Summary

## O que foi verificado

Migração PostgreSQL para Hermes Gateway — auditoria completa e decisões autónomas.

## Decisões Autónomas

| # | Decisão | Alternativas | Razão |
|---|---------|-------------|-------|
| D1 | DROP SCHEMA hermes_state | Manter vs DROP | Router DB (newapi) já tem todos os custos — hermes_state era redundante |
| D2 | Ignorar ~8K sessions JSON pendentes | Migrar vs Ignorar | Sessions deepseek free; CLI sessions já em quota_data |
| D3 | gateway_ws é schema activo | gateway_ws vs hermes_state | 20,545 sessions reais em gateway_ws |
| D4 | Criar gateway_ws.audit | Não criar vs Criar | Requisito original não existia — criado |
| D5 | pgbounce OK | Confirmação centralizada | gateway_db.py → localhost:6432 confirmado |

## Infraestrutura Confirmada

```
pgbouncer:      localhost:6432 → localhost:8745  (✅ operacional)
hermes-ws-gw:   port 8300 → pgbouncer → postgres (✅)
hermes_gateway: gateway_ws (20,545 sessions)     (✅)
router DB:      newapi.quota_data (billing)      (✅ source of truth)
```

## Ficheiros Modificados/Criados

- `.planning/ROADMAP.md` — M002 actualizado com verificações e decisões
- `.planning/STATE.md` — Phase 19 marcada como Done
- `gateway_ws.audit` — tabela criada, 1 entry de cleanup
- Backup: `/home/ubuntu/backups/hermes_state_backup/hermes_state_backup_20260528_042706.sql` (122MB)

## M002: Completo
