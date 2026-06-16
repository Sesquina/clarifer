# Clarifer Infrastructure Log

## Session I1: Server Hardening

**Date:** 2026-06-16
**Host:** clarifer-prod-1
**IP:** 87.99.152.26
**OS:** Ubuntu 24.04 LTS
**Spec:** CPX21 (3 vCPU, 4 GB RAM, 40 GB disk)
**Location:** Ashburn VA (us-east)
**Engineer:** Claude (Anthropic), authorized by Samira Esquina

---

## Objective

Produce a locked-down production server ready for application stack installation.

---

## Commands Run and Verified Output

### Phase 1: Create clarifer user and install SSH key

```
useradd -m -s /bin/bash clarifer
usermod -aG sudo clarifer
mkdir -p /home/clarifer/.ssh
echo 'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIMqevsjVVx3fIrIjXj6oxs2TwR4vb4FIIEkNvR34h5R1 clarifer-prod' > /home/clarifer/.ssh/authorized_keys
chmod 700 /home/clarifer/.ssh
chmod 600 /home/clarifer/.ssh/authorized_keys
chown -R clarifer:clarifer /home/clarifer/.ssh
```

Verified output:

```
uid=1000(clarifer) gid=1000(clarifer) groups=1000(clarifer),27(sudo)
drwx------ 2 clarifer clarifer 4096 Jun 16 19:20 .ssh
-rw------- 1 clarifer clarifer   95 Jun 16 19:20 authorized_keys
```

### Phase 2: Install packages

```
apt-get update -q
apt-get install -y ufw fail2ban nginx unattended-upgrades apt-listchanges
```

Packages installed: fail2ban 1.0.2, nginx 1.24.0, apt-listchanges 3.27.
ufw and unattended-upgrades were already present.

### Phase 3: Configure UFW firewall

```
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
```

Verified output:

```
Status: active
Default: deny (incoming), allow (outgoing)
22/tcp   ALLOW IN   Anywhere
80/tcp   ALLOW IN   Anywhere
443/tcp  ALLOW IN   Anywhere
```

### Phase 4: Enable services

```
systemctl enable nginx && systemctl start nginx
systemctl enable fail2ban && systemctl start fail2ban
printf 'APT::Periodic::Update-Package-Lists "1";\nAPT::Periodic::Unattended-Upgrade "1";\n' > /etc/apt/apt.conf.d/20auto-upgrades
systemctl enable unattended-upgrades && systemctl start unattended-upgrades
```

All three services confirmed active.
Nginx returned HTTP 200 on localhost.

### Phase 5: SSH hardening

Wrote /etc/ssh/sshd_config.d/50-cloud-init.conf (override of Hetzner default):

```
PasswordAuthentication no
```

Wrote /etc/ssh/sshd_config.d/99-hardening.conf:

```
PermitRootLogin no
PasswordAuthentication no
AllowUsers clarifer
PubkeyAuthentication yes
```

Config validated with `sshd -t`. Service restarted with `systemctl restart ssh`.

### Phase 6: Sudoers for clarifer

Wrote /etc/sudoers.d/clarifer via `su root`:

```
clarifer ALL=(ALL) NOPASSWD:ALL
```

Permissions set to 440.

---

## Verification Gates: All Passed

| Gate | Check | Result |
|------|-------|--------|
| 1 | ssh clarifer@87.99.152.26 connects via key, no password | PASS (uid=1000) |
| 2 | sudo ufw status shows active with 22, 80, 443 | PASS |
| 3 | sudo systemctl status fail2ban shows active (running) | PASS |
| 4 | sudo systemctl status nginx shows active (running) | PASS |
| 5 | curl http://87.99.152.26 returns 200 | PASS |
| 6 | ssh root@87.99.152.26 is refused | PASS (Permission denied) |
| 7 | sudo systemctl status unattended-upgrades shows active | PASS |

---

## Current Server State

- User: clarifer (uid=1000), sudo group, passwordless sudo, SSH key auth only
- SSH: key auth only, PermitRootLogin no, AllowUsers clarifer
- Firewall: UFW active, ports 22/80/443 open, all else denied
- Services running: nginx, fail2ban, unattended-upgrades, ssh
- Pre-existing user cassiniesqui remains on disk but cannot SSH (blocked by AllowUsers)
- Root SSH login disabled

---

---

## Session I2: PostgreSQL 16 + PgBouncer

**Date:** 2026-06-16
**Host:** clarifer-prod-1 (same as I1)
**Engineer:** Claude (Anthropic), authorized by Samira Esquina

---

## Objective

Install PostgreSQL 16 as the primary application database with PgBouncer in
transaction pool mode. Apply all Supabase migrations. Do not expose port 5432
to the internet.

---

## Commands Run and Verified Output

### Phase 1: Install PostgreSQL 16

```
apt-get install -y postgresql-16 postgresql-client-16 pgbouncer
systemctl enable postgresql && systemctl start postgresql
```

PostgreSQL 16 installed and active. PgBouncer 1.22.0 installed.

### Phase 2: Create database and application user

```sql
-- run as postgres superuser
CREATE DATABASE clarifer;
CREATE USER clarifer_app WITH ENCRYPTED PASSWORD 'ClarifDB2026!Prod';
GRANT ALL PRIVILEGES ON DATABASE clarifer TO clarifer_app;
ALTER DATABASE clarifer OWNER TO clarifer_app;
GRANT USAGE ON SCHEMA public TO clarifer_app;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO clarifer_app;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO clarifer_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO clarifer_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO clarifer_app;
```

### Phase 3: Configure pg_hba.conf

Added entries to allow SCRAM-SHA-256 local connections:

```
host    clarifer        clarifer_app    127.0.0.1/32    scram-sha-256
host    all             all             127.0.0.1/32    scram-sha-256
```

`postgresql.conf` set `listen_addresses = 'localhost'`. Reloaded config.

### Phase 4: Supabase compatibility stubs

Applied i2_setup.sql before migrations to provide Supabase-compatible objects
that the migrations reference:

- Schema: `auth`, `storage`
- Roles: `authenticated`, `anon`, `service_role` (NOLOGIN)
- Functions: `auth.uid()` returns NULL::UUID, `auth.jwt()` returns '{}'::JSONB
- Tables: `auth.users`, `storage.buckets`, `storage.objects`
- Function: `storage.foldername()`
- Seed tables: `public.organizations`, `public.condition_templates`

### Phase 5: Apply Supabase migrations

Applied 37 of 38 migration files from supabase/migrations/:

- Skipped: `20260423000001_create_documents_bucket.sql`
  (header says "DO NOT RUN" -- uses Supabase Storage extension unavailable
  on bare PostgreSQL; no-op for application functionality)
- All others applied via psql as clarifer_app user
- Key migration: `20260423000006_full_schema_baseline.sql` -- creates all core
  tables using CREATE TABLE IF NOT EXISTS with org-isolation RLS policies
- Early migrations produced expected "already exists" notices on tables created
  by the baseline; no fatal errors

### Phase 6: Configure PgBouncer

`/etc/pgbouncer/pgbouncer.ini`:

```ini
[databases]
clarifer = host=127.0.0.1 port=5432 dbname=clarifer

[pgbouncer]
listen_port = 6432
listen_addr = 127.0.0.1
auth_type = scram-sha-256
auth_file = /etc/pgbouncer/userlist.txt
pool_mode = transaction
max_client_conn = 100
default_pool_size = 25
server_idle_timeout = 600
logfile = /var/log/pgbouncer/pgbouncer.log
pidfile = /run/pgbouncer/pgbouncer.pid
unix_socket_dir = /run/pgbouncer
```

`/etc/pgbouncer/userlist.txt` contains the SCRAM-SHA-256 verifier extracted
directly from `pg_shadow` for `clarifer_app`. PgBouncer verifies client SCRAM
credentials against this verifier without needing plaintext password storage.

```
"clarifer_app" "SCRAM-SHA-256$4096:<salt>:<stored-key>:<server-key>"
```

Created `/var/log/pgbouncer/` and `/run/pgbouncer/` directories, owned by
`postgres:postgres`. PgBouncer runs as the `postgres` user.

---

## Verification Gates: All Passed

| Gate | Check | Result |
|------|-------|--------|
| 1 | `sudo systemctl is-active postgresql` | PASS (active) |
| 2 | clarifer database exists in `\l` output | PASS |
| 3 | clarifer_app user exists in `\du` output | PASS |
| 4 | `psql -h 127.0.0.1 -p 6432 -U clarifer_app -d clarifer -c "SELECT count(*) FROM users;"` returns count=0 | PASS |
| 5 | port 5432 NOT in UFW allow list | PASS (not present) |

---

## Current Server State (post-I2)

- PostgreSQL 16 running on localhost:5432 (not exposed to internet)
- Database: `clarifer`, owned by `clarifer_app`
- Application user: `clarifer_app` (SCRAM-SHA-256 auth)
- All 37 applicable Supabase migrations applied; full schema present
- PgBouncer 1.22.0 on 127.0.0.1:6432, transaction pool mode, 25 pool size
- UFW unchanged: ports 22/80/443 only; 5432 never opened
- Application connects via `postgresql://clarifer_app:***@127.0.0.1:6432/clarifer`

---

## What I3 Will Do

Session I3 installs Keycloak as the identity provider.
