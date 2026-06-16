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

## What I2 Will Do

Session I2 installs and configures PostgreSQL as the primary application database.
Tasks include: install PostgreSQL 16, create application database and user,
configure pg_hba.conf for local socket auth, enable and verify the systemd service,
and create initial schema placeholders.
