# Regra de Projeto: Todas as ligações PostgreSQL passam por pgbouncer

## Regra

**Todo e qualquer serviço, script ou ferramenta que conecte ao PostgreSQL DEVE usar pgbouncer em `localhost:6432` — nunca ligação directa a `localhost:8745` ou qualquer outra porta do PostgreSQL.**

## Razão

pgbouncer é o connection pooler central do projeto. Todas as ligações passam por ele para:
- Limitar o número de conexões directas ao PostgreSQL
- Reutilizar conexões em vez de abrir/fechar constantemente
- Centralizar a gestão de conexões num único ponto
- Evitar fugas de conexões e esgotar o pool do PostgreSQL

## Excepções

Ligações de ferramentas de administração que precisam de ver a sessão real do PostgreSQL (ex: `psql` interactivo para debug) podem ligar directo. Scripts automatizados e serviços de produção NÃO.

## Configuração

```
pgbouncer:  localhost:6432
PostgreSQL: localhost:8745  (só pgbouncer conecta aqui)

[databases] em /etc/pgbouncer/pgbouncer.ini:
  hermes_gateway = host=127.0.0.1 port=8745 dbname=hermes_gateway
  hindsight       = host=127.0.0.1 port=8745 dbname=hindsight
```

## Variáveis de ambiente

Para serviços novos, usar:

```bash
HERMES_PG_HOST=localhost
HERMES_PG_PORT=6432       # ← pgbouncer, não 8745
HERMES_PG_DATABASE=hindsight  # ou hermes_gateway
HERMES_PG_USER=hindsight
HERMES_PG_PASSWORD=hindsight_pass
```

## Serviços que usam pgbouncer

| Serviço | Porta | DB | Via pgbouncer |
|---------|-------|-----|---------------|
| hermes-ws-gateway | 8300 | hermes_gateway | ✅ localhost:6432 |
| hermes-claw-gateway | 8400 | hindsight | ✅ localhost:6432 |
| hermes-pers | 8082 | hindsight | ✅ localhost:6432 (via scripts) |
| load_to_pg.py | cron | hindsight | ✅ localhost:6432 |
| ctx-observer cron | - | hindsight | ✅ localhost:6432 |

## Como adicionar um novo serviço

1. Adicionar a base de dados ao `/etc/pgbouncer/pgbouncer.ini`:
   ```
   [databases]
   minha_db = host=127.0.0.1 port=8745 dbname=minha_db
   ```
2. Reiniciar pgbouncer: `sudo -u postgres pkill -HUP pgbouncer`
3. No serviço/script, conectar a `localhost:6432` com as credenciais da DB

## Erro comum

```
FATAL: server login failed: wrong password type
```

Significa que pgbouncer não tem a password do utilizador em `userlist.txt` ou a password no PostgreSQL está encriptada de forma diferente. Verificar:
1. `password_encryption` no PostgreSQL = `md5`
2. `pg_hba.conf` para 127.0.0.1 = `trust` ou `md5`
3. `userlist.txt` tem entrada para o utilizador com hash md5
