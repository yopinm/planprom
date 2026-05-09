#!/usr/bin/env bash
set -euo pipefail

# TASK-4.9 Staging Validation Smoke Test
# Run on VPS: bash scripts/staging-smoke.sh https://couponkum.com
# Or locally against VPS: bash scripts/staging-smoke.sh https://couponkum.com

BASE_URL="${1:-}"
PASS=0
FAIL=0
RESULTS=()

if [[ -z "${BASE_URL}" ]]; then
  echo "Usage: bash scripts/staging-smoke.sh <base-url>" >&2
  exit 1
fi

BASE_URL="${BASE_URL%/}"

status_matches() {
  local actual="$1"
  local expected_statuses="$2"
  local expected

  IFS=',' read -ra expected <<< "${expected_statuses}"
  for expected in "${expected[@]}"; do
    if [[ "${actual}" == "${expected}" ]]; then
      return 0
    fi
  done

  return 1
}

check() {
  local label="$1"
  local url="$2"
  local expected_status="${3:-200}"
  local actual

  actual="$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "${url}" || true)"
  if status_matches "${actual}" "${expected_status}"; then
    RESULTS+=("OK    [${actual}] ${label}")
    PASS=$((PASS + 1))
  else
    RESULTS+=("FAIL  [${actual}] ${label}  (expected ${expected_status})")
    FAIL=$((FAIL + 1))
  fi
}

# Group 1 - Health + Static
check "Health check"          "${BASE_URL}/api/health"
check "Homepage"              "${BASE_URL}/"
check "Search page"           "${BASE_URL}/search?q=iphone"
check "Blog list"             "${BASE_URL}/blog"
check "Sitemap"               "${BASE_URL}/sitemap.xml"
check "Robots.txt"            "${BASE_URL}/robots.txt"

# Group 2 - Product + Redirect flow
check "Product page"          "${BASE_URL}/product/test" "200,404"
# Next.js 16 streaming: loading.tsx commits 200; 404 injected via stream body
check "Redirect /go (no id)"  "${BASE_URL}/go/nonexistent" 200

# Group 3 - API routes (public)
check "Trending content API"  "${BASE_URL}/api/content/trending"
check "Push subscribe API"    "${BASE_URL}/api/push/subscribe" 405

# Group 4 - Admin (unauthenticated should redirect, not crash)
check "Admin login page"      "${BASE_URL}/admin/login" 200
check "Admin redirect"        "${BASE_URL}/admin" 307
check "Admin dashboard"       "${BASE_URL}/admin/dashboard" 307

# Group 5 - Postback endpoints (GET without payload should not crash)
check "Shopee postback GET"   "${BASE_URL}/api/postback/shopee" 200
check "Lazada postback GET"   "${BASE_URL}/api/postback/lazada" 200

echo ""
echo "===== TASK-4.9 Staging Smoke ====="
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
  echo "SMOKE FAILED - review FAIL lines above"
  exit 1
fi

echo "SMOKE PASSED - ready for REV-POSTBACK-1"
