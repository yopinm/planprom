#!/usr/bin/env bash
set -euo pipefail

# DB-MIGRATION-VPS Step 1: Install PostgreSQL 16 on AlmaLinux 9.7
# Run as root on the VPS: bash scripts/vps-pg-setup.sh
# Review every command before running - this script does NOT run automatically.
#
# Password placeholder reminder:
# - Replace CHANGE_ME_BEFORE_RUNNING before running this on the VPS.
# - Do not leave CHANGE_ME_BEFORE_RUNNING in production configuration.

PG_HBA="/var/lib/pgsql/16/data/pg_hba.conf"
PG_REPO_RPM="https://download.postgresql.org/pub/repos/yum/reporpms/EL-9-x86_64/pgdg-redhat-repo-latest.noarch.rpm"
DB_PASSWORD="CHANGE_ME_BEFORE_RUNNING"

confirm() {
  local prompt="$1"
  local answer

  read -r -p "${prompt} Confirm? [y/N] " answer
  case "${answer}" in
    y|Y|yes|YES)
      return 0
      ;;
    *)
      echo "Skipped: ${prompt}"
      return 1
      ;;
  esac
}

require_root() {
  if [[ "$(id -u)" -ne 0 ]]; then
    echo "ERROR: Run this script as root on the VPS." >&2
    exit 1
  fi
}

require_password_change() {
  if [[ "${DB_PASSWORD}" == "CHANGE_ME_BEFORE_RUNNING" ]]; then
    echo "ERROR: Replace DB_PASSWORD=CHANGE_ME_BEFORE_RUNNING before running." >&2
    echo "The placeholder CHANGE_ME_BEFORE_RUNNING is intentionally repeated here as a safety reminder." >&2
    exit 1
  fi
}

require_root
require_password_change

# 1. Install PostgreSQL 16 PGDG repo and packages for AlmaLinux 9.
if confirm "Install PostgreSQL 16 PGDG repository and packages with dnf"; then
  dnf install -y "${PG_REPO_RPM}"
  dnf -qy module disable postgresql
  dnf install -y postgresql16-server postgresql16
fi

# 2. Initialize the PostgreSQL 16 database cluster.
if confirm "Initialize PostgreSQL 16 database cluster"; then
  /usr/pgsql-16/bin/postgresql-16-setup initdb
fi

# 3. Enable and start the PostgreSQL 16 service.
if confirm "Enable and start postgresql-16 service"; then
  systemctl enable --now postgresql-16
fi

# 4. Create the application database user and database.
if confirm "Create couponkum PostgreSQL user and database"; then
  sudo -u postgres psql -v ON_ERROR_STOP=1 <<SQL
CREATE USER couponkum WITH PASSWORD '${DB_PASSWORD}';
CREATE DATABASE couponkum OWNER couponkum;
GRANT ALL PRIVILEGES ON DATABASE couponkum TO couponkum;
SQL
fi

# 5. Configure local-only pg_hba.conf access for the couponkum database.
if confirm "Back up and update pg_hba.conf for local couponkum connections"; then
  cp "${PG_HBA}" "${PG_HBA}.bak.$(date +%Y%m%d%H%M%S)"

  if ! grep -Fxq "local   couponkum   couponkum   md5" "${PG_HBA}"; then
    sed -i '1ilocal   couponkum   couponkum   md5' "${PG_HBA}"
  fi

  if ! grep -Fxq "host    couponkum   couponkum   127.0.0.1/32   md5" "${PG_HBA}"; then
    sed -i '2ihost    couponkum   couponkum   127.0.0.1/32   md5' "${PG_HBA}"
  fi
fi

# 6. Reload PostgreSQL so pg_hba.conf changes take effect.
if confirm "Reload postgresql-16 service"; then
  systemctl reload postgresql-16
fi

# 7. Firewall note:
# PostgreSQL port 5432 does not need to be opened publicly. Couponkum should use
# a local DATABASE_URL that connects to localhost only.

# 8. SELinux note:
# Confirm getsebool httpd_can_network_connect if app-to-local-db connectivity is
# blocked. This was already enabled during the Nginx setup.

echo "PostgreSQL 16 setup script finished. Review output before proceeding."
