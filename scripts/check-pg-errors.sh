#!/usr/bin/env bash
set -euo pipefail

# TASK-4.9 Check VPS PM2 logs for PostgreSQL errors after DB cutover
# Run on VPS: bash scripts/check-pg-errors.sh

LOG_OUTPUT="$(pm2 logs couponkum --lines 200 --nostream)"
ERROR_PATTERN='error|ECONNREFUSED|password authentication|does not exist|relation.*does not exist'

MATCHES="$(printf '%s\n' "${LOG_OUTPUT}" | grep -iE "${ERROR_PATTERN}" || true)"

if [[ -n "${MATCHES}" ]]; then
  echo "PostgreSQL-related errors found in last 200 log lines:"
  printf '%s\n' "${MATCHES}"
  exit 1
fi

echo "No PostgreSQL errors found in last 200 log lines."
