#!/usr/bin/env bash
set -euo pipefail

# DB-MIGRATION-VPS Step 4: Verify DATABASE_URL is set correctly before cutover
# Run on VPS: bash scripts/db-env-check.sh

ENV_FILE="/var/www/couponkum/.env.local"
REQUIRED_SUPABASE_VARS=(
  "NEXT_PUBLIC_SUPABASE_URL"
  "NEXT_PUBLIC_SUPABASE_ANON_KEY"
  "SUPABASE_SERVICE_ROLE_KEY"
)

check_ok=true

get_env_value() {
  local key="$1"
  local line

  line="$(grep -E "^${key}=" "${ENV_FILE}" | tail -n 1 || true)"
  if [[ -z "${line}" ]]; then
    return 0
  fi

  printf '%s' "${line#*=}" | sed -E "s/^['\"]//; s/['\"]$//"
}

print_check() {
  local passed="$1"
  local label="$2"

  if [[ "${passed}" == "true" ]]; then
    echo "OK    ${label}"
  else
    echo "ERROR ${label}"
    check_ok=false
  fi
}

if [[ ! -f "${ENV_FILE}" ]]; then
  echo "ERROR: ${ENV_FILE} not found." >&2
  exit 1
fi

database_url="$(get_env_value "DATABASE_URL")"

if [[ -n "${database_url}" ]]; then
  print_check "true" "DATABASE_URL is set"
else
  print_check "false" "DATABASE_URL is set"
fi

if [[ "${database_url}" =~ ^postgresql://[^[:space:]@]+:[^[:space:]@]+@localhost:5432/couponkum$ ]]; then
  print_check "true" "DATABASE_URL points to localhost:5432/couponkum"
else
  print_check "false" "DATABASE_URL format is postgresql://USER:PASSWORD@localhost:5432/couponkum"
fi

for key in "${REQUIRED_SUPABASE_VARS[@]}"; do
  value="$(get_env_value "${key}")"
  if [[ -n "${value}" ]]; then
    print_check "true" "${key} is still set for Supabase Auth"
  else
    print_check "false" "${key} is still set for Supabase Auth"
  fi
done

if [[ "${check_ok}" != "true" ]]; then
  echo "One or more environment checks failed." >&2
  exit 1
fi

echo "Environment looks ready for DB cutover."
echo "Next step: npm run build && pm2 reload couponkum"
