# CLAUDE.md

> **Read order:** `core/planprom.md` (ก่อน) → `PRD.md` → `core/Couponkum_Project_Driven_V13.md` (reference if needed)
> Legacy `core/Project_Driven_V14_Couponfirst.md, core/Couponkum_New_Roadmap.md ทั้งหมด FROZEN 2026-05-07

## Brand & Slogan (V15 Template + Coupon)

| Item | Value |
|---|---|
| **Slogan (canonical)** | **"คุ้มทุกการใช้จ่าย · ง่ายทุกการวางแผน"** |
| **Niche** | Section 1 = Digital Template Store · Section 2 = Coupon Affiliate (lead magnet) |
| **Monetization Rule** | ห้ามทำให้ revenue channel ใด channel หนึ่งหายไประหว่าง pivot — affiliate commission ทุก network, sub-ID tracking, daily featured, recommended stores, brand chips, wallet flow ต้องคงอยู่ครบ · งานใหม่ต้อง preserve หรือ extend ช่องทางเดิม · ดู Blueprint Part E "Break-Even ROI Roadmap" |

## Current Mode

| Item | Status |
|---|---|
| Mode | **Post-Launch / V15 Template + Coupon** |
| Production | Live since 2026-05-01 — VPS + PM2 + Nginx + Cloudflare Full (Strict) |
| Progress | V13 frozen at 149/151 done · V15 series opened 2026-05-07 |

## Phase S2 Security Override

| Task | Severity | Scope |
|---|---|---|
| `S2-1` | Critical | Done — Meta webhook registered 2026-04-29 ✅ |
| `S2-2` | High | Done — OAuth callback `next` redirects are guarded |
| `S2-3` | High | Done — sanitizer uses state-machine tag stripping |

## Priority

| Bucket | Tasks |
|---|---|
| **Now (V15 W1) — Foundation** | Template Store: DB schema + admin CRUD + payment flow (PromptPay QR + manual verify) — see Coupon_TP.MD Section 7 |
| **Now (V15 W1-W2)** | Template catalog public + LINE add friend free template + first 10 templates published |
| **Defer post-deadline** | All coupon work (AT-CPN, calculator, stacking, vertical, networks) |
| **Defer post-deadline** | Defer all V14 expansion to Q3+ |
| **Gate-locked** | Community Submit — open เมื่อ DAU > 500 |
| **✅ Lazada API — LIVE** | ใช้ LiteApp Affiliate API (adsense.lazada.co.th) — pool=49 fixed, ใช้เพื่อ deeplink + product context |
| **Gated — AI freeze** | `6.1-6.5` (wait for traffic + conversion baseline) |

## Hard Rules

| Rule | Purpose |
|---|---|
| Do not start `Later` while `Now` is open | Scope control |
| Do not touch secrets directly | Safety |
| One task = one commit | Continuity |
| Push + deploy VPS after every task | Fix stays live |
| Task เกี่ยวกับ architecture / infra / admin / roadmap → update `core/Couponkum_Blueprint.md` | Blueprint stays as reference source-of-truth |
| Task ใน V15 sprint → update `core/Coupon_TP.MD` Task Backlog | V15 stays in sync |
| ห้าม break revenue channel ใดๆ ระหว่าง pivot | Cashflow ต้องไม่หาย |
| Slogan canonical = "คุ้มทุกการใช้จ่าย · ง่ายทุกการวางแผน" — ห้ามใช้ slogan เก่า "คิดแทนทุกโค้ดดีล" | Brand consistency |

## Acceptance

| Level | Meaning |
|---|---|
| **L0** | review + test pass |
| **L1** | quick owner check |
| **L2** | business scenario pass |
| **L3** | launch rehearsal + sign-off |

## Session Workflow

```text
1. Read PRD.md
2. Read core/planprom.md (Active Snapshot + Coupon-First Pillars + Task Backlog)
3. Read core/Couponkum_Blueprint.md เฉพาะส่วนที่จำเป็น (Part E for Break-Even ROI; A9 for Coupon Engine; A2 for DB)
4. Pick one task from planprom.md Section 7 (Day 1 → Day 28)
5. Make smallest complete patch — preserve revenue channels
6. Run CI checks — must all pass before commit:
      npx tsc --noEmit && npm run lint && npm run test
7. Update PRD.md + planprom.md if needed
8. Commit
9. Push → Deploy VPS → Smoke test
10. Report done + next task
```

## Git

```bash
npx tsc --noEmit && npm run lint && npm run test

git add -A
git commit -m "type(task-id): short summary"
git push origin main
```

## Deploy (VPS — ทำทุกครั้งหลัง push)

```bash
ssh root@103.52.109.85 "cd /var/www/planprom && git pull origin main"
ssh root@103.52.109.85 "cd /var/www/planprom && npm run build"
ssh root@103.52.109.85 "cd /var/www/planprom && cp -r .next/static .next/standalone/.next/static && cp -r public .next/standalone/public && cp .env.local .next/standalone/.env.local"
ssh root@103.52.109.85 "pm2 reload ecosystem.config.js --update-env"
curl -s -o /dev/null -w '%{http_code}' https://planprom.com/
# ต้องได้ 200
```

## Session Output

```text
objective
files changed
validation
commit message
next task
```

## References

| Ref | Source |
|---|---|
| [1] | CANONICAL V15 spec: `core/planprom.md` |
| [2] | Architecture / Infra / Engines / Admin / Roadmap / Break-Even ROI / Archive: `core/Couponkum_Blueprint.md` |
| [3] | Legacy V13 (frozen): `core/Couponkum_Project_Driven_V13.md` |
