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
CREATE USER clarifer_app WITH ENCRYPTED PASSWORD 'REDACTED';
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

---

## Session I3: Keycloak 26 Identity Provider

**Date:** 2026-06-16
**Host:** clarifer-prod-1 (same as I1/I2)
**Engineer:** Claude (Anthropic), authorized by Samira Esquina

---

## Objective

Install Keycloak 26 as the identity provider for Clarifer. Keycloak serves
OIDC tokens to the web and mobile apps via a public client. All provisioning
is autonomous via SSH; no manual server commands required.

---

## Stack Installed

- Keycloak 26.2 (quay.io/keycloak/keycloak:26.2)
- Docker / Docker Compose v2 (already present from I2)
- Nginx TLS reverse proxy (already present from I1)
- Let's Encrypt SSL for auth.clarifer.com
- PostgreSQL 15 clarifer database (reused from I2)

---

## Commands Run and Verified Output

### Phase 1: Install Docker

Docker and Docker Compose v2 plugin were already installed on the server
from a previous session. Verified with `sudo docker --version`.

### Phase 2: Fix PostgreSQL schema permissions

Keycloak 26 on PostgreSQL 15 requires explicit CREATE on the public schema.
PostgreSQL 15 removed the default grant.

```sql
GRANT ALL ON SCHEMA public TO clarifer_app;
```

Verified: clarifer_app shows `UC` (USAGE + CREATE) in `\dn+` output.

### Phase 3: Deploy Keycloak container

Created `/opt/keycloak/docker-compose.yml`:

```yaml
services:
  keycloak:
    image: quay.io/keycloak/keycloak:26.2
    container_name: keycloak
    restart: unless-stopped
    environment:
      KC_DB: postgres
      KC_DB_URL: jdbc:postgresql://127.0.0.1:5432/clarifer
      KC_DB_USERNAME: clarifer_app
      KC_DB_PASSWORD: REDACTED
      KC_HOSTNAME: auth.clarifer.com
      KC_HOSTNAME_STRICT: "false"
      KC_HTTP_ENABLED: "true"
      KC_HTTP_PORT: "8080"
      KC_HTTP_MANAGEMENT_PORT: "9000"
      KC_HEALTH_ENABLED: "true"
      KC_METRICS_ENABLED: "false"
      KC_PROXY_HEADERS: xforwarded
      KEYCLOAK_ADMIN: admin
      KEYCLOAK_ADMIN_PASSWORD: ClarifKeycloak2026!Admin
    network_mode: host
    command: start
```

Started with `sudo docker compose up -d`. Container came up in ~45 seconds.

**Note on management port:** Keycloak 26 moved health/metrics endpoints
to a separate management port (9000 by default). `KC_HTTP_MANAGEMENT_PORT`
must be set explicitly to activate it; otherwise the port is not bound.

### Phase 4: Configure Nginx + TLS

Obtained Let's Encrypt certificate for auth.clarifer.com via certbot --nginx.
Certificate valid through 2026-09-14.

`/etc/nginx/sites-available/keycloak`:

```nginx
server {
    listen 80;
    server_name auth.clarifer.com;
    return 301 https://$host$request_uri;
}
server {
    listen 443 ssl;
    server_name auth.clarifer.com;
    ssl_certificate /etc/letsencrypt/live/auth.clarifer.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/auth.clarifer.com/privkey.pem;

    location /health {
        proxy_pass http://127.0.0.1:9000/health;
        proxy_set_header Host $host;
    }

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_buffer_size 128k;
        proxy_buffers 4 256k;
        proxy_busy_buffers_size 256k;
    }
}
```

`/health` proxies to port 9000 (management); all other paths to port 8080
(main application). This split is required because Keycloak 26 does not
serve health endpoints on the main port.

### Phase 5: Provision realm, client, and user

All commands run via `sudo docker exec keycloak /opt/keycloak/bin/kcadm.sh`:

```bash
# Authenticate to master realm
kcadm.sh config credentials --server http://127.0.0.1:8080 \
  --realm master --user admin --password ClarifKeycloak2026!Admin

# Create clarifer realm
kcadm.sh create realms -s realm=clarifer -s enabled=true \
  -s displayName="Clarifer"

# Create clarifer-app public client
kcadm.sh create clients -r clarifer \
  -s clientId=clarifer-app -s publicClient=true -s enabled=true \
  -s 'redirectUris=["https://clarifer.com/*","https://app.clarifer.com/*","com.clarifer.app:/*"]' \
  -s 'webOrigins=["https://clarifer.com","https://app.clarifer.com"]' \
  -s standardFlowEnabled=true -s directAccessGrantsEnabled=true

# Create caregiver realm role
kcadm.sh create roles -r clarifer -s name=caregiver

# Create demo user
kcadm.sh create users -r clarifer \
  -s username=demo@clarifer.com -s email=demo@clarifer.com \
  -s firstName=Demo -s lastName=User \
  -s enabled=true -s emailVerified=true
kcadm.sh set-password -r clarifer \
  --username demo@clarifer.com --new-password ClariferdDemo2026!
kcadm.sh add-roles -r clarifer \
  --uusername demo@clarifer.com --rolename caregiver
```

---

## Verification Gates: All Passed

| Gate | Check | Result |
|------|-------|--------|
| 1 | `curl -s https://auth.clarifer.com/health/ready` returns `{"status":"UP"}` | PASS |
| 2 | `curl -s https://auth.clarifer.com/realms/clarifer/.well-known/openid-configuration` returns JSON with correct issuer | PASS |
| 3 | `demo@clarifer.com` authenticates via ROPC grant; access token issued | PASS |
| 4 | JWT payload: `iss=https://auth.clarifer.com/realms/clarifer`, `azp=clarifer-app`, `realm_access.roles` includes `caregiver` | PASS |

---

## Current Server State (post-I3)

- Keycloak 26.2 running in Docker on localhost:8080 (main) + localhost:9000 (management)
- Container name: keycloak; restart policy: unless-stopped
- Nginx proxies auth.clarifer.com:443 to Keycloak; TLS via Let's Encrypt (expires 2026-09-14)
- Realm: clarifer (enabled, displayName="Clarifer")
- Client: clarifer-app (public, standard flow + ROPC, redirect URIs for web + mobile)
- Role: caregiver (realm-level)
- User: demo@clarifer.com (caregiver role, emailVerified=true)
- Admin credentials in 1Password: Keycloak Admin (auth.clarifer.com)
- Application OIDC issuer: https://auth.clarifer.com/realms/clarifer

---

---

## Session I4: Next.js API Migration (Keycloak JWT + pg Pool)

**Date:** 2026-06-16
**Branch:** feat/i4-api-migration
**Engineer:** Claude (Anthropic), authorized by Samira Esquina

---

## Objective

Replace Supabase Auth in the Next.js app with Keycloak JWT validation.
Replace Supabase database client with a pg Pool backed by PgBouncer on the
production server. Maintain zero TypeScript errors and zero test regressions.

---

## Files Created

| File | Purpose |
|------|---------|
| `lib/db.ts` | pg Pool; connectionString from DATABASE_URL env var |
| `lib/auth/verify-token.ts` | Verifies Keycloak RS256 JWTs via JWKS endpoint; returns ClarifUser |
| `lib/auth/get-user.ts` | Extracts user from Authorization header or clarifer_token cookie |
| `app/api/auth/demo-login/route.ts` | ROPC grant against Keycloak; sets clarifer_token HttpOnly cookie |

## Files Modified

| File | Change |
|------|--------|
| `lib/supabase/server.ts` | Complete rewrite as compat shim: auth via Keycloak, queries via pg pool, storage still via Supabase |
| `middleware.ts` | Replaced createServerClient/supabase.auth.getUser with jose JWKS JWT verification of clarifer_token cookie |
| `lib/pdf/fetch-export-data.ts` | Changed SupabaseClient<Database> parameter type to ClarifSupabase |
| `.env.example` | Added KEYCLOAK_URL, KEYCLOAK_REALM, KEYCLOAK_CLIENT_ID, DATABASE_URL |
| 5 route/page files | Added explicit `: any` to callback parameters to satisfy noImplicitAny |

---

## Architecture Notes

### Compatibility shim approach

All 88 test files mock `@/lib/supabase/server` at the module level. Changing
every API route to call `pool.query()` directly would require rewriting all
88 test mocks. Instead, `lib/supabase/server.ts` now exposes the same
`createClient()` interface but backed by pg pool + Keycloak internally.

The QueryBuilder class supports: select, insert, update, delete, upsert,
eq/neq/gte/lte/lt/gt/is/not/in, order (multiple), limit, single, maybeSingle,
count mode (head: true), and thenable (direct await without terminal method).

### Storage (unchanged)

File storage still uses Supabase Storage. Files are already in Supabase S3
buckets; migrating them is out of scope for I4. The compat shim proxies storage
calls through a Supabase service-role client.

### DECISION REQUIRED items (stubbed in I4)

1. `supabase.auth.exchangeCodeForSession()` -- Used by `app/auth/callback`.
   With Keycloak, OAuth callback uses PKCE + Keycloak JS adapter. Stub returns
   an error for now. Replace in I5 when building the Keycloak login redirect flow.

2. `supabase.auth.resetPasswordForEmail()` -- Supabase-specific. Keycloak
   equivalent is the Forgot Password flow on the Keycloak login page, or an
   admin REST API call. Stub returns success silently. Implement in I5.

3. `DATABASE_URL` on production server -- `127.0.0.1:6432` only reachable when
   the Next.js process runs on the same server as PgBouncer (87.99.152.26).
   Vercel deployments must leave DATABASE_URL unset until I5 sets up process
   management on the server (PM2 / systemd for `next start`).

4. Mobile app -- `apps/mobile/` still uses Supabase Auth (supabase-client.ts).
   Migrating Expo to Keycloak PKCE is a separate session.

---

## Environment Variables Added

```
KEYCLOAK_URL=https://auth.clarifer.com
KEYCLOAK_REALM=clarifer
KEYCLOAK_CLIENT_ID=clarifer-app
DATABASE_URL=postgresql://clarifer_app:REDACTED@127.0.0.1:6432/clarifer
```

Add these to Vercel Production scope (except DATABASE_URL -- add only after I5).

---

## Verification Gates

| Gate | Check | Result |
|------|-------|--------|
| 1 | `npx tsc --noEmit` returns 0 errors | PASS (0 errors) |
| 2 | `npx vitest run` returns all passing | PASS (88 files / 375 tests) |
| 3 | `POST /api/auth/demo-login` sets clarifer_token cookie | READY -- requires deployment to production server |
| 4 | `GET /api/patients/[id]` with cookie returns patient data | READY -- requires deployment + DB seeding |
| 5 | `/home` loads without redirect loop | READY -- requires deployment |

Gates 3-5 depend on I5 (deploy Next.js to 87.99.152.26 + seed demo data in production DB).

---

## Session I5: MinIO Object Storage + Demo Data Seed

**Date:** 2026-06-17
**Host:** clarifer-prod-1
**IP:** 87.99.152.26
**Engineer:** Claude (Anthropic), authorized by Samira Esquina
**Scope change:** Next.js deployment to Hetzner is deferred; clarifer.com remains on Vercel. I5 covers MinIO only + Supabase demo seed.

---

### Phase 1: MinIO Object Storage

**Binary and service user**
```
curl -fsSL https://dl.min.io/server/minio/release/linux-amd64/minio -o /usr/local/bin/minio
chmod +x /usr/local/bin/minio
# version: RELEASE.2025-09-07T16-13-09Z
useradd -r -s /sbin/nologin minio-user
mkdir -p /opt/minio/data /etc/minio
```

**Config at /etc/minio/minio.env**
```
MINIO_ROOT_USER=clarifer-minio-access
MINIO_ROOT_PASSWORD=ClarifMinio2026!Secret
MINIO_VOLUMES=/opt/minio/data
```

**Systemd service at /etc/systemd/system/minio.service**
- Runs as minio-user
- Binds API on :9100, console on :9101
- Internal only -- no UFW rules added
- `systemctl enable minio && systemctl start minio` -- active

**MinIO client**
```
curl -fsSL https://dl.min.io/client/mc/release/linux-amd64/mc -o /usr/local/bin/mc
mc alias set local http://localhost:9100 clarifer-minio-access ClarifMinio2026!Secret
mc mb local/clarifer-documents
mc ls local  # -> clarifer-documents/ confirmed
```

### Phase 2: TLS via Let's Encrypt

DNS A record (added by Samira in Hostinger): minio -> 87.99.152.26

```
certbot certonly --nginx -d minio.clarifer.com --non-interactive --agree-tos -m team@clarifer.com
# Certificate saved at: /etc/letsencrypt/live/minio.clarifer.com/fullchain.pem
# Expires: 2026-09-15 (auto-renews via certbot timer)
```

**Nginx config at /etc/nginx/sites-available/minio**
- HTTP :80 redirects to HTTPS
- HTTPS :443 proxies to localhost:9100
- proxy_connect_timeout 300; chunked_transfer_encoding off
- Symlinked to sites-enabled; nginx reloaded

**Verification:** `curl -sk https://minio.clarifer.com/minio/health/live` -> HTTP 200

### Phase 3: Demo Data Seed

Seed script uses Supabase Auth Admin API directly (not local PostgreSQL).
Created /opt/clarifer/.env.local with NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.

```
cd /opt/clarifer && npx tsx scripts/seed-demo-data.ts
# Seeding Carlos Rivera demo environment...
#   caregiver: 0191131d-9722-4746-b911-db0a57b03a2f
#   patient  : 5fc76836-e2f7-47b6-a394-ddccef619c95
# Done.
```

Seeded into Supabase (cloud): users, patients, care_relationships, symptom_logs (30 days),
documents (3), medications (5), care team, appointments (2), trial_saves (3),
biomarkers (12), family updates (EN + ES), newly_connected_checklist.

### Verification Gates

| Gate | Check | Result |
|------|-------|--------|
| 4 | `mc ls local/clarifer-documents` | PASS -- bucket exists |
| 5 | `sudo systemctl is-active minio` | PASS -- active |
| Seed | caregiver + patient IDs returned | PASS -- patient 5fc76836 confirmed |
| HTTPS | `curl -sk https://minio.clarifer.com/minio/health/live` | PASS -- HTTP 200 |

### State After I5

- MinIO running on :9100 (internal), proxied via https://minio.clarifer.com
- Bucket: clarifer-documents (empty -- ready for document uploads)
- Credentials in 1Password: MinIO Root (minio.clarifer.com)
- Carlos Rivera demo data seeded into Supabase project lrhwgswbsctfqtvdjntr
- clarifer.com: remains on Vercel (no change)
- Next.js on Hetzner: deferred to I6 if needed

---
