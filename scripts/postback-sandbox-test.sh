#!/usr/bin/env bash
set -euo pipefail

# REV-POSTBACK-1: Synthetic postback persistence test.
# Run on VPS after scripts/vps-disable-rls.sh:
#   bash scripts/postback-sandbox-test.sh https://couponkum.com

ENV_FILE="${ENV_FILE:-/var/www/planprom/.env.local}"
BASE_URL="${1:-${BASE_URL:-}}"
PASS=0
FAIL=0
RESULTS=()
TEST_PREFIX="TEST_$(date +%s)"
ORIGINAL_POSTBACK_FLAG=''

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

compute_hmac() {
  local body="$1"

  printf '%s' "${body}" | openssl dgst -sha256 -hmac "${SECRET}" -hex | awk '{print $2}'
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

cleanup() {
  if [[ -n "${DB_PASSWORD:-}" ]]; then
    PGPASSWORD="${DB_PASSWORD}" psql -h 127.0.0.1 -U couponkum -d couponkum -q -v ON_ERROR_STOP=1 -c \
      "DELETE FROM revenue_tracking WHERE order_id LIKE 'TEST_%';" >/dev/null || true
    if [[ "${ORIGINAL_POSTBACK_FLAG}" == "f" ]]; then
      PGPASSWORD="${DB_PASSWORD}" psql -h 127.0.0.1 -U couponkum -d couponkum -q -v ON_ERROR_STOP=1 -c \
        "UPDATE admin_control_flags SET is_enabled = FALSE WHERE flag_key = 'postback_tracking';" >/dev/null || true
    fi
  fi
}

enable_postback_flag() {
  ORIGINAL_POSTBACK_FLAG="$(
    PGPASSWORD="${DB_PASSWORD}" psql -h 127.0.0.1 -U couponkum -d couponkum -t -A -v ON_ERROR_STOP=1 -c \
      "SELECT is_enabled FROM admin_control_flags WHERE flag_key='postback_tracking' LIMIT 1;" 2>/dev/null || echo "unknown"
  )"
  PGPASSWORD="${DB_PASSWORD}" psql -h 127.0.0.1 -U couponkum -d couponkum -v ON_ERROR_STOP=1 -c \
    "UPDATE admin_control_flags SET is_enabled = TRUE WHERE flag_key = 'postback_tracking';" >/dev/null
}

verify_revenue_row() {
  local order_id="$1"
  local expected_sub_id="$2"
  local actual_sub_id

  actual_sub_id="$(
    PGPASSWORD="${DB_PASSWORD}" psql -h 127.0.0.1 -U couponkum -d couponkum -t -A -v ON_ERROR_STOP=1 -c \
      "SELECT sub_id FROM revenue_tracking WHERE order_id='${order_id}' LIMIT 1;" || true
  )"

  [[ "${actual_sub_id}" == "${expected_sub_id}" ]]
}

run_lazada_get() {
  local ts="$1"
  local order_id="${TEST_PREFIX}_LZ_GET"
  local sub_id="test_sub_lz_${ts}"
  local http_status

  http_status="$(
    curl -s -o /dev/null -w "%{http_code}" --max-time 10 --get \
      --data-urlencode "transaction_id=${sub_id}" \
      --data-urlencode "payout=10.50" \
      --data-urlencode "amount=100" \
      --data-urlencode "offer_id=${order_id}" \
      "${BASE_URL}/api/postback/lazada" || true
  )"

  if [[ "${http_status}" == "200" ]] && verify_revenue_row "${order_id}" "${sub_id}"; then
    record_result "true" "Lazada GET" "HTTP 200 and sub_id ${sub_id} persisted"
  else
    record_result "false" "Lazada GET" "HTTP ${http_status}; expected row sub_id ${sub_id}"
  fi
}

run_involve_asia_get() {
  local ts="$1"
  local order_id="${TEST_PREFIX}_IA_GET"
  local sub_id="test_sub_ia_${ts}"
  local http_status

  http_status="$(
    curl -s -o /dev/null -w "%{http_code}" --max-time 10 --get \
      --data-urlencode "sub_id=${sub_id}" \
      --data-urlencode "order_id=${order_id}" \
      --data-urlencode "commission=5.25" \
      --data-urlencode "token=${SECRET}" \
      "${BASE_URL}/api/postback/shopee" || true
  )"

  if [[ "${http_status}" == "200" ]] && verify_revenue_row "${order_id}" "${sub_id}"; then
    record_result "true" "Involve Asia GET" "HTTP 200 and sub_id ${sub_id} persisted"
  else
    record_result "false" "Involve Asia GET" "HTTP ${http_status}; expected row sub_id ${sub_id}"
  fi
}

run_lazada_post() {
  local ts="$1"
  local order_id="${TEST_PREFIX}_LZ_POST"
  local sub_id="test_sub_lz_post_${ts}"
  local body
  local signature
  local response
  local http_status
  local response_body

  body="{\"order_id\":\"${order_id}\",\"sub_id\":\"${sub_id}\",\"commission\":12.00,\"event_type\":\"conversion\"}"
  signature="$(compute_hmac "${body}")"
  response="$(
    curl -s --max-time 10 -X POST \
      -H "content-type: application/json" \
      -d "${body}" \
      -w "\n%{http_code}" \
      "${BASE_URL}/api/postback/lazada?sign=${signature}" || true
  )"
  http_status="$(printf '%s' "${response}" | tail -n 1)"
  response_body="$(printf '%s' "${response}" | sed '$d')"

  if [[ "${http_status}" == "200" ]] && [[ "${response_body}" == *'"ok":true'* ]] && verify_revenue_row "${order_id}" "${sub_id}"; then
    record_result "true" "Lazada POST" "HTTP 200 and sub_id ${sub_id} persisted"
  else
    record_result "false" "Lazada POST" "HTTP ${http_status}; body ${response_body}; expected row sub_id ${sub_id}"
  fi
}

run_shopee_post() {
  local ts="$1"
  local order_id="${TEST_PREFIX}_SP_POST"
  local sub_id="test_sub_sp_post_${ts}"
  local body
  local signature
  local response
  local http_status
  local response_body

  body="{\"order_id\":\"${order_id}\",\"sub_id\":\"${sub_id}\",\"commission\":8.00}"
  signature="$(compute_hmac "${body}")"
  response="$(
    curl -s --max-time 10 -X POST \
      -H "content-type: application/json" \
      -H "x-shopee-signature: ${signature}" \
      -d "${body}" \
      -w "\n%{http_code}" \
      "${BASE_URL}/api/postback/shopee" || true
  )"
  http_status="$(printf '%s' "${response}" | tail -n 1)"
  response_body="$(printf '%s' "${response}" | sed '$d')"

  if [[ "${http_status}" == "200" ]] && [[ "${response_body}" == *'"ok":true'* ]] && verify_revenue_row "${order_id}" "${sub_id}"; then
    record_result "true" "Shopee POST" "HTTP 200 and sub_id ${sub_id} persisted"
  else
    record_result "false" "Shopee POST" "HTTP ${http_status}; body ${response_body}; expected row sub_id ${sub_id}"
  fi
}

if [[ ! -f "${ENV_FILE}" ]]; then
  echo "ERROR: ${ENV_FILE} not found." >&2
  exit 1
fi

if [[ -z "${BASE_URL}" ]]; then
  echo "Usage: bash scripts/postback-sandbox-test.sh <base-url>" >&2
  exit 1
fi

BASE_URL="${BASE_URL%/}"
DATABASE_URL_VALUE="${DATABASE_URL:-$(get_env_value "DATABASE_URL")}"
SECRET="${REVENUE_WEBHOOK_SECRET:-$(get_env_value "REVENUE_WEBHOOK_SECRET")}"

if [[ -z "${DATABASE_URL_VALUE}" ]]; then
  echo "ERROR: DATABASE_URL is required in the environment or ${ENV_FILE}." >&2
  exit 1
fi

if [[ -z "${SECRET}" ]]; then
  echo "ERROR: REVENUE_WEBHOOK_SECRET is required in the environment or ${ENV_FILE}." >&2
  exit 1
fi

DB_PASSWORD="$(database_url_password "${DATABASE_URL_VALUE}")"
if [[ -z "${DB_PASSWORD}" || "${DB_PASSWORD}" == "${DATABASE_URL_VALUE}" ]]; then
  echo "ERROR: Could not parse DATABASE_URL password for local psql verification." >&2
  exit 1
fi

trap cleanup EXIT

enable_postback_flag

timestamp="$(date +%s)"

run_lazada_get "${timestamp}"
run_involve_asia_get "${timestamp}"
run_lazada_post "${timestamp}"
run_shopee_post "${timestamp}"

echo ""
echo "===== REV-POSTBACK-1 Sandbox Test ====="
echo "Base URL: ${BASE_URL}"
echo ""
for result in "${RESULTS[@]}"; do
  echo "  ${result}"
done
echo ""
echo "  PASSED: ${PASS}"
echo "  FAILED: ${FAIL}"
echo ""

if [[ "${FAIL}" -gt 0 ]]; then
  echo "POSTBACK SANDBOX FAILED - review FAIL lines above"
  exit 1
fi

echo "POSTBACK SANDBOX PASSED - sub_id attribution persisted for all scenarios."
