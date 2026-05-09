#!/usr/bin/env bash
set -euo pipefail

# DB-MIGRATION-VPS Step 3: Verify tables after Supabase dump import
# Run on VPS after pg_restore: bash scripts/db-import-verify.sh

DATABASE_URL_INPUT="${1:-${DATABASE_URL:-}}"
REQUIRED_TABLES=(
  "products"
  "coupons"
  "click_logs"
  "revenue_tracking"
  "user_profiles"
)

mask_database_url() {
  sed -E 's#(postgres(ql)?://[^:/@]+):[^@]*@#\1:****@#'
}

if [[ -z "${DATABASE_URL_INPUT}" ]]; then
  echo "ERROR: DATABASE_URL is required as the first argument or environment variable." >&2
  exit 1
fi

MASKED_DATABASE_URL="$(printf '%s' "${DATABASE_URL_INPUT}" | mask_database_url)"

echo "Checking database tables..."
echo "DATABASE_URL: ${MASKED_DATABASE_URL}"

missing_count=0

for table_name in "${REQUIRED_TABLES[@]}"; do
  exists="$(
    psql -X -v ON_ERROR_STOP=1 "${DATABASE_URL_INPUT}" -tAc \
      "SELECT to_regclass('public.${table_name}') IS NOT NULL;"
  )"

  if [[ "${exists}" != "t" ]]; then
    printf 'ERROR %-18s missing\n' "${table_name}"
    missing_count=$((missing_count + 1))
    continue
  fi

  row_count="$(
    psql -X -v ON_ERROR_STOP=1 "${DATABASE_URL_INPUT}" -tAc \
      "SELECT COUNT(*) FROM public.${table_name};"
  )"
  printf 'OK    %-18s (%s rows)\n' "${table_name}" "${row_count}"
done

if [[ "${missing_count}" -gt 0 ]]; then
  echo "ERROR: ${missing_count} required table(s) missing after import." >&2
  exit 1
fi

echo "All 5 required tables found. DB import looks good."
echo "Next step: update DATABASE_URL in .env.local and run: pm2 reload couponkum"
