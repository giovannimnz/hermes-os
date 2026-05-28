# Phase 19 Context — hermes-pers-sqlite-to-pg-migration

## Estado Atual (Auditoria Real)

### 1. pgbounce
- **Status:** A correr em `/usr/sbin/pgbouncer /etc/pgbouncer/pgbouncer.ini`
- **Port:** `localhost:6432` (entrada) → `localhost:8745` (saida para PostgreSQL)
- **Pool:** transaction mode, max_client_conn=200, default_pool_size=10
- **Databases:** `hermes_gateway` → `host=127.0.0.1 port=8745 dbname=hermes_gateway`
- **Quem conecta via pgbounce:** hermes-ws-gateway

### 2. PostgreSQL
- **Host/Port:** `localhost:8745`
- **Base de dados:** `hermes_gateway` (user `hermes`, pass `hermes`)
- **Schemas existentes:**

| Schema | Sessions | Messages | Tabelas |
|--------|----------|----------|---------|
| gateway_ws | 20,545 | 173,752 | sessions, events, metrics, tokens, cronjobs, config |
| hermes_state | 8,014 | 8,577 | sessions, messages, state_meta |
| gateway_claw | 3 | 0 | sessions, audit, cron_jobs |

- **Data range em gateway_ws.sessions:** 2026-05-27 a 2026-05-28 (só 2 dias!)

### 3. hermes-pers
- **Container Docker:** `hermes-pers` (porta 8082)
- **Dados:** `/opt/data/` (Docker volume)
- **Sessions:** 15,986 ficheiros JSON em `/opt/data/sessions/` (1.1GB total)
- **state.db:** 0 bytes (vazio — não é SQLite real)
- **Estrutura:** Cada ficheiro JSON = 1 sessão com session_id, model, platform, messages, system_prompt, tools, etc.
- **Sessions migradas para hermes_state:** 8,014 (metade — 7,972 por migrar)

### 4. pgbounce vs ligacoes
```
hermes-ws-gateway (porta 8300)
  → gateway_db.py
  → pgbouncer localhost:6432
  → PostgreSQL localhost:8745 (hermes_gateway)
  → gateway_ws schema

hermes-pers (porta 8082)
  → hermes_state SQLite (Docker volume interno)
  → migrate_hermes_state.py → PostgreSQL hermes_gateway.hermes_state

hermes-claw-gateway (porta 8400)
  → gateway_claw schema em hermes_gateway
```

### 5. Gap Analysis

| Item | Valor |
|------|-------|
| Total sessoes em ficheiros JSON | 15,986 |
| ja migradas (hermes_state) | 8,014 |
| **Por migrar** | **~7,972** |
| Sessoes em gateway_ws (recentes) | 20,545 |
| Messages em gateway_ws | 173,752 |
| Messages em hermes_state | 8,577 |

### 6. Duas Schemas — Qual o objetivo?

**hermes_state:** Agrupa dados de billing/costos das sessoes (input_tokens, output_tokens, billing_*).
Usa 32 colunas para sessions incluindo model_config, pricing_version, cost_source, etc.
Alimentado por `migrate_hermes_state.py` (corre manualmente ou via cron).

**gateway_ws:** Agrupa sessoes activas e metadata de runtime (platform, chat_id, cwd, status).
Alimentado directamente pelo hermes-ws-gateway em tempo real.

### 7. Problemas Identificados

1. **Sessoes por migrar:** ~7,972 sessoes JSON em hermes-pers nao estao em hermes_state
2. **Nao ha integracao entre gateway_ws e hermes_state** — sao dois schemas separados
3. **gateway_ws so tem 2 dias de dados** — migrate_hermes_state.py nao alimenta gateway_ws
4. **gateway_claw** esta quase vazio (3 sessoes) — pode precisar de migracao tambem
5. **MIGRATE_WRITE_PG_ONLY** nao existe como variavel — hermes-pers usa script de migracao manual

### 8. O Que Precisa Ser Feito (preliminar)

1. Migrar as ~7,972 sessoes pendentes do hermes-pers JSON para hermes_state
2. Verificar se gateway_ws precisa de receber dados das mesmas sessoes ou se hermes_state e independente
3. Configurar migacao automatica (cron) para novas sessoes
4. Garantir que todos os componentes usam pgbounce (ja esta a funcionar)
5. Criar procedure de audit trail (gateway_audit)

---

## Success Criteria Originais vs Realidade

| Criteria Original | Realidade |
|---|---|
| gateway.gateway_sessions >10,000 | gateway_ws.sessions = 20,545 (ja tem) |
| gateway.gateway_messages com todas as mensagens | gateway_ws.messages = 173,752 (ja tem) |
| gateway.gateway_audit audir trail | NAO EXISTE — a criar |
| MIGRATE_WRITE_PG_ONLY=true | Nao existe — usa script manual |
| WS Gateway sessions via same schema | SIM — gateway_ws schema |
| Todas ligacoes via pgbounce | SIM — hermes-ws-gateway ja usa |
| localhost:8745 com pgbounce | SIM — pgbouncer em 6432 → 8745 |
