#!/bin/bash
# deploy.sh — Production deploy script สำหรับ Ruk-Com AlmaLinux VPS
# วิธีใช้: bash scripts/deploy.sh [branch]
# ตัวอย่าง: bash scripts/deploy.sh main
#           bash scripts/deploy.sh develop  (staging)

set -euo pipefail

BRANCH="${1:-main}"
APP_DIR="/var/www/couponkum"
LOG_DIR="/var/log/couponkum"
APP_NAME="couponkum"

echo "=========================================="
echo " Couponkum Deploy — branch: $BRANCH"
echo " $(date '+%Y-%m-%d %H:%M:%S')"
echo "=========================================="

# ── 1. สร้าง log dir ถ้าไม่มี ──
mkdir -p "$LOG_DIR"

# ── 2. Pull latest code ──
echo "[1/5] Pulling $BRANCH..."
cd "$APP_DIR"
git fetch origin
git checkout "$BRANCH"
git pull origin "$BRANCH"

# ── 3. Install dependencies ──
echo "[2/5] Installing dependencies..."
npm ci --production

# ── 4. Build ──
echo "[3/5] Building Next.js..."
npm run build

# ── 5. Reload PM2 (zero-downtime) ──
echo "[4/5] Reloading PM2..."
if pm2 describe "$APP_NAME" > /dev/null 2>&1; then
  pm2 reload ecosystem.config.js --env production
else
  pm2 start ecosystem.config.js --env production
fi

# ── 6. Save PM2 state ──
echo "[5/5] Saving PM2 state..."
pm2 save

echo ""
echo "✅ Deploy complete — $(date '+%Y-%m-%d %H:%M:%S')"
echo "   pm2 logs $APP_NAME --lines 50   # ดู log"
echo "   pm2 status                       # เช็คสถานะ"
