# Phase 19 Plan — hermes-pers-sqlite-to-pg-migration

**Status:** PENDING_AUDIT

Plano a ser escrito apos auditoria completa (ver 19-CONTEXT.md).

## Auditoria

- [ ] 1. pgbounce status
- [ ] 2. PostgreSQL schema check
- [ ] 3. hermes-pers state.db + sessions/ audit
- [ ] 4. WS gateway connection map
- [ ] 5. Claw gateway connection map
- [ ] 6. Docker network verification

## Migracao

- [ ] Definir requirements concretos
- [ ] Script de export SQLite → PostgreSQL
- [ ] Validacao de dados migrados
- [ ] Configurar MIGRATE_WRITE_PG_ONLY=true
- [ ] Cleanup pos-migracao
