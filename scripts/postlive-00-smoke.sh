#!/usr/bin/env bash
set -euo pipefail

# POSTLIVE-00: Production smoke checks.
# Run on VPS after go-live:
#   bash scripts/postlive-00-smoke.sh https://couponkum.com

ENV_FILE="${ENV_FILE:-/var/www/couponkum/.env.local}"
BASE_URL="${1:-${BASE_URL:-https://couponkum.com}}"
PASS=0
FAIL=0
RESULTS=()

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

record_result() {
  local ok="$1"
  local label="$2"
  local detail="$3"

  if [[ "${ok}" == "true" ]]; then
    RESULTS+=("PASS  ${label} - ${detail}")
    PASS=$((PASS + 1))
  else
    RESULTS+=("FAIL  ${label} - ${detail}")
    FAIL=$((FAIL + 1))
  fi
}

fetch_status_and_body() {
  local path="$1"

  curl -sS --max-time 10 -w "\n%{http_code}" "${BASE_URL}${path}" || printf '\n000'
}

get_active_product_id() {
  PGPASSWORD="${DB_PASSWORD}" psql -h 127.0.0.1 -U couponkum -d couponkum -t -A -v ON_ERROR_STOP=1 -c \
    "SELECT id FROM products WHERE is_active = TRUE LIMIT 1;"
}

check_health() {
  local response
  local http_status
  local response_body
  local compact_body

  response="$(fetch_status_and_body "/api/health")"
  http_status="$(printf '%s' "${response}" | tail -n 1)"
  response_body="$(printf '%s' "${response}" | sed '$d')"
  compact_body="$(printf '%s' "${response_body}" | tr -d '[:space:]')"

  if [[ "${http_status}" == "200" ]] && [[ "${compact_body}" == *'"status":"ok"'* ]]; then
    record_result "true" "Health API" "HTTP 200 and status ok"
  else
    record_result "false" "Health API" "HTTP ${http_status}; expected status ok"
  fi
}

check_http_200() {
  local path="$1"
  local label="$2"
  local http_status

  http_status="$(curl -sS -o /dev/null -w "%{http_code}" --max-time 10 "${BASE_URL}${path}" || true)"
  if [[ "${http_status}" == "200" ]]; then
    record_result "true" "${label}" "HTTP 200"
  else
    record_result "false" "${label}" "HTTP ${http_status}; expected 200"
  fi
}

check_affiliate_redirect() {
  local product_id="$1"
  local http_status

  # Use a browser UA to avoid the curl UA blacklist in bot-detection.ts
  http_status="$(curl -sS -o /dev/null -w "%{http_code}" --max-time 10 \
    -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36" \
    "${BASE_URL}/api/r?id=${product_id}" || true)"
  if [[ "${http_status}" == "200" || "${http_status}" == "302" ]]; then
    record_result "true" "Affiliate redirect" "HTTP ${http_status} for product ${product_id}"
  else
    record_result "false" "Affiliate redirect" "HTTP ${http_status}; expected 200 or 302 for product ${product_id}"
  fi
}

if [[ ! -f "${ENV_FILE}" ]]; then
  echo "ERROR: ${ENV_FILE} not found." >&2
  exit 1
fi

BASE_URL="${BASE_URL%/}"
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

PRODUCT_ID="$(get_active_product_id)"
if [[ -z "${PRODUCT_ID}" ]]; then
  echo "ERROR: No active product UUID found in products." >&2
  exit 1
fi

check_health
check_http_200 "/" "Homepage"
check_http_200 "/deals" "Deals page"
check_affiliate_redirect "${PRODUCT_ID}"
check_http_200 "/admin/login" "Admin login"

echo ""
echo "===== POSTLIVE-00 Production Smoke ====="
echo "Base URL: ${BASE_URL}"
echo "Product UUID: ${PRODUCT_ID}"
echo ""
for result in "${RESULTS[@]}"; do
  echo "  ${result}"
done
echo ""
echo "  PASSED: ${PASS}"
echo "  FAILED: ${FAIL}"
echo ""

if [[ "${FAIL}" -gt 0 ]]; then
  echo "POSTLIVE-00 SMOKE FAILED - review FAIL lines above"
  exit 1
fi

echo "POSTLIVE-00 SMOKE PASSED - production checks are healthy."
