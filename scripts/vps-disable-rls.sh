#!/usr/bin/env bash
set -euo pipefail

# REV-POSTBACK-1: Disable Supabase-exported auth.role() RLS on local PostgreSQL.
# Run once on VPS as a PostgreSQL superuser:
#   bash scripts/vps-disable-rls.sh

# Tables with Supabase auth.role() RLS verified 2026-04-30 by Claude.
# admin_control_flags is included because VPS logs showed 42501 on this table.
TABLES=(
  admin_alert_rule_audit_logs
  admin_alert_rules
  alert_logs
  alerts
  analytics_events
  admin_control_flags
  coupon_stack_rules
  coupon_wallet
  coupons
  price_history
  products
  rare_item_scores
  revenue_tracking
  user_profiles
)

confirm() {
  local prompt="$1"
  local answer

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

confirm "Disable row level security on ${#TABLES[@]} local PostgreSQL tables"

for table_name in "${TABLES[@]}"; do
  echo "Disabling RLS on ${table_name}..."
  psql -h 127.0.0.1 -U postgres -d couponkum -v ON_ERROR_STOP=1 -c \
    "ALTER TABLE public.${table_name} DISABLE ROW LEVEL SECURITY;"
done

echo "Done - RLS disabled on ${#TABLES[@]} tables."
