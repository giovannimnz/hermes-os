# Regra de Projeto: Todas as ligações PostgreSQL passam por pgbouncer

## Regra

**Todo e qualquer serviço, script ou ferramenta que conecte ao PostgreSQL DEVE usar pgbouncer em `localhost:6432` — nunca ligação directa a `localhost:8745` ou qualquer outra porta do PostgreSQL.**

## Razão

pgbouncer é o connection pooler central. Todas as ligações passam por ele para:
- Limitar o número de conexões directas ao PostgreSQL
- Reutilizar conexões em vez de abrir/fechar constantemente
- Centralizar a gestão de conexões num único ponto
- Evitar fugas de conexões e esgotar o pool do PostgreSQL

## Excepções

Ferramentas de administração interactivas (ex: `psql` para debug) podem ligar directo. Scripts automatizados e serviços de produção NÃO.

## Configuração

```
pgbouncer:  localhost:6432
PostgreSQL: localhost:8745  (só pgbouncer conecta aqui)

[database] em /etc/pgbouncer/pgbouncer.ini:
  hermes_gateway = host=127.0.0.1 port=8745 dbname=hermes_gateway
```

## Variáveis de ambiente

Para todos os serviços Hermes:

```bash
HERMES_PG_HOST=localhost
HERMES_PG_PORT=6432       # ← pgbouncer, não 8745
HERMES_PG_DATABASE=hermes_gateway
HERMES_PG_USER=hermes
HERMES_PG_PASSWORD=***
```

## Importante — Database único

**REGRA: UM database só — `hermes_gateway`**
- `hindsight` database foi ELIMINADO
- Todos os schemas vivem em `hermes_gateway`
- Não criar novos databases — tudo em `hermes_gateway`

Schemas existentes em `hermes_gateway`:

| Schema | Serviço | Tables |
|--------|---------|--------|
| `gateway_ws` | hermes-ws-gateway | sessions, messages, events, metrics, config, tokens, cronjobs, audit |
| `gateway_acp` | hermes-acp-gateway | sessions, audit, cron_jobs (a criar quando iniciar) |

## Serviços que usam pgbouncer

| Serviço | Porta | Schema/DB | Via pgbouncer |
|---------|-------|-----------|---------------|
| hermes-ws-gateway | 8300 | gateway_ws | ✅ localhost:6432 |
| hermes-acp-gateway | 8400 | gateway_acp | ✅ localhost:6432 |
| hermes-pers | 8082 | JSON files + state.db | ✅ via gateway_db.py |
| ctx-observer cron | - | hermes_memory (hindsight DB) | ✅ localhost:6432 |

## Notas sobre ctx-observer

O ctx-observer cron ainda usa o database `hindsight` (separado de `hermes_gateway`). Este é o database do serviço hindsight/observability — não é o mesmo que os gateways. Mantém-se separado porque é um serviço de analytics diferente.

## Erro comum

```
FATAL: server login failed: wrong password type
```

Significa que pgbouncer não tem a password do utilizador em `userlist.txt`. Verificar:
1. `password_encryption` no PostgreSQL = `md5`
2. `pg_hba.conf` para 127.0.0.1 = `trust` ou `md5`
3. `userlist.txt` tem entrada para o utilizador com hash md5
