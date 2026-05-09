#!/usr/bin/env bash
set -euo pipefail

# TASK 5.0: Promote staging to production traffic.
# Enables only affiliate redirect and postback tracking control flags.
# Run on VPS:
#   bash scripts/task-5-0-promote.sh
#   bash scripts/task-5-0-promote.sh --yes

ENV_FILE="${ENV_FILE:-/var/www/couponkum/.env.local}"
BASE_URL="${BASE_URL:-https://couponkum.com}"
SKIP_CONFIRM=0
FLAGS=(
  affiliate_redirect
  postback_tracking
)

usage() {
  cat <<'EOF'
Usage:
  bash scripts/task-5-0-promote.sh [--yes] [base_url]

Examples:
  bash scripts/task-5-0-promote.sh
  bash scripts/task-5-0-promote.sh --yes
  bash scripts/task-5-0-promote.sh --yes https://couponkum.com
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --yes)
      SKIP_CONFIRM=1
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      BASE_URL="$1"
      shift
      ;;
  esac
done
BASE_URL="${BASE_URL%/}"

get_env_value() {
  local key="$1"
  local line

  line="$(grep -E "^${key}=" "${ENV_FILE}" | tail -n 1 || true)"
  if [[ -z "${line}" ]]; then
    return 0
  fi

  printf '%s' "${line#*=}" | sed -E "s/^['\"]//; s/['\"]$//"
}

database_url_password() {
  local url="$1"

  printf '%s' "${url}" | sed -E 's#^postgres(ql)?://[^:/@]+:([^@]+)@.*$#\2#'
}

confirm() {
  local prompt="$1"
  local answer

  if [[ "${SKIP_CONFIRM}" -eq 1 ]]; then
    return 0
  fi

  read -r -p "${prompt} Confirm? [y/N] " answer
  case "${answer}" in
    y|Y|yes|YES)
      return 0
      ;;
    *)
      echo "Aborted."
      exit 1
      ;;
  esac
}

verify_flags() {
  PGPASSWORD="${DB_PASSWORD}" psql -h 127.0.0.1 -U couponkum -d couponkum -t -A -F $'\t' -v ON_ERROR_STOP=1 -c \
    "SELECT flag_key, is_enabled FROM admin_control_flags WHERE flag_key IN ('affiliate_redirect', 'postback_tracking') ORDER BY flag_key;"
}

check_maintenance_off() {
  local result

  result="$(PGPASSWORD="${DB_PASSWORD}" psql -h 127.0.0.1 -U couponkum -d couponkum \
    -t -A -v ON_ERROR_STOP=1 \
    -c "SELECT is_enabled FROM admin_control_flags WHERE flag_key = 'maintenance_mode';")"

  if [[ "${result}" == "t" ]]; then
    echo "ERROR: maintenance_mode is ON — disable it in /admin/control before promoting." >&2
    exit 1
  fi

  if [[ "${result}" != "f" ]]; then
    echo "ERROR: maintenance_mode flag row is missing or invalid." >&2
    exit 1
  fi
}

post_promote_smoke() {
  local product_id
  local status

  product_id="$(PGPASSWORD="${DB_PASSWORD}" psql -h 127.0.0.1 -U couponkum -d couponkum \
    -t -A -v ON_ERROR_STOP=1 \
    -c "SELECT id FROM products WHERE is_active = TRUE LIMIT 1;")"

  if [[ -z "${product_id}" ]]; then
    echo "  FAIL  Post-promote smoke — no active product found"
    exit 1
  fi

  if ! status="$(curl -sS -o /dev/null -w "%{http_code}" --max-time 10 \
    -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36" \
    "${BASE_URL}/api/r?id=${product_id}")"; then
    echo "  FAIL  Post-promote smoke — curl request failed"
    exit 1
  fi

  if [[ "${status}" == "302" || "${status}" == "200" ]]; then
    echo "  PASS  Post-promote smoke — /api/r redirect HTTP ${status}"
  else
    echo "  FAIL  Post-promote smoke — HTTP ${status}; expected 200 or 302"
    exit 1
  fi
}

if [[ ! -f "${ENV_FILE}" ]]; then
  echo "ERROR: ${ENV_FILE} not found." >&2
  exit 1
fi

DATABASE_URL_VALUE="${DATABASE_URL:-$(get_env_value "DATABASE_URL")}"

if [[ -z "${DATABASE_URL_VALUE}" ]]; then
  echo "ERROR: DATABASE_URL is required in the environment or ${ENV_FILE}." >&2
  exit 1
fi

DB_PASSWORD="$(database_url_password "${DATABASE_URL_VALUE}")"
if [[ -z "${DB_PASSWORD}" || "${DB_PASSWORD}" == "${DATABASE_URL_VALUE}" ]]; then
  echo "ERROR: Could not parse DATABASE_URL password for local psql verification." >&2
  exit 1
fi

confirm "Enable production traffic flags: ${FLAGS[*]}"

echo ""
echo "===== TASK 5.0 Promote to Production ====="
echo "Pre-promote checks:"
check_maintenance_off
echo "  PASS  maintenance_mode is OFF"

PGPASSWORD="${DB_PASSWORD}" psql -h 127.0.0.1 -U couponkum -d couponkum -v ON_ERROR_STOP=1 -c \
  "UPDATE admin_control_flags SET is_enabled = TRUE WHERE flag_key IN ('affiliate_redirect', 'postback_tracking');" >/dev/null

VERIFY_OUTPUT="$(verify_flags)"
FOUND_COUNT="$(printf '%s\n' "${VERIFY_OUTPUT}" | awk 'NF { count += 1 } END { print count + 0 }')"
ENABLED_COUNT="$(printf '%s\n' "${VERIFY_OUTPUT}" | awk -F $'\t' '$2 == "t" { count += 1 } END { print count + 0 }')"

echo "Promote:"
printf '%s\n' "${VERIFY_OUTPUT}" | while IFS=$'\t' read -r flag_key is_enabled; do
  if [[ -n "${flag_key}" ]]; then
    if [[ "${is_enabled}" == "t" ]]; then
      echo "  PASS  ${flag_key}: enabled"
    else
      echo "  FAIL  ${flag_key}: not enabled"
    fi
  fi
done

if [[ "${FOUND_COUNT}" -ne 2 ]]; then
  echo "TASK 5.0 PROMOTE FAILED - expected both control flag rows to exist"
  exit 1
fi

if [[ "${ENABLED_COUNT}" -ne 2 ]]; then
  echo "TASK 5.0 PROMOTE FAILED - expected affiliate_redirect and postback_tracking to be true"
  exit 1
fi

echo "Post-promote smoke:"
post_promote_smoke
echo ""
echo "TASK 5.0 PROMOTE PASSED — production traffic is open."
