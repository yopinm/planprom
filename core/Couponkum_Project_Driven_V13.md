# couponkum.com — Milestone-Driven Roadmap (Lean Active View)

> **Single Source of Truth — Version V13 (Lean)**
> Project: **คูปองคุ้ม / Couponkum.com**
> Stack: Next.js + TypeScript + Tailwind + Cloudflare + Ruk-Com AlmaLinux (Next.js + PM2 + Nginx + PostgreSQL)
> Auth: **Supabase Auth only** (Google + LINE)
> **Completed task archive + session history → `core/Couponkum_Blueprint.md` (Part F)**

---

## Active Execution Snapshot

| Item | Current State |
|---|---|
| Mode | **Post-Launch / Month 1 POSTLIVE** |
| Production | Live since 2026-05-01 — VPS + PM2 + Nginx + Cloudflare Full (Strict) |
| Progress | **148 / 150 tracked tasks done (99%)** |
| Current blockers | ⏳ Lazada API permission · ⏳ IA properties + API key (ETA 2026-05-06) · ⏳ AT Datafeed API reply |
| AI gate | `6.1-6.5` dormant — รอ traffic + conversion + revenue baseline |
| Next priority | Month 1 POSTLIVE growth tasks — ดู Task Backlog ด้านล่าง |

**Gate rule:** รัน `npx tsc --noEmit && npm run lint && npm run test` ก่อน commit ทุกครั้ง

---

## Core Documentation Index

| ไฟล์ | บทบาท | อ่านเมื่อ |
|---|---|---|
| `PRD.md` | Snapshot · Goals · Session workflow | ทุก session (อ่านก่อน) |
| `core/Couponkum_Project_Driven_V13.md` | **ไฟล์นี้** — Active tasks + pending status | ทุก session (อ่านที่สอง) |
| `core/Couponkum_Blueprint.md` | Architecture · Infra · Engines · DB · Admin · Roadmap · Archive | อ่านเมื่อต้องการ reference |

---

## Claude Start Rule

1. อ่าน `PRD.md` ก่อน
2. อ่าน Snapshot ด้านบนในไฟล์นี้
3. อ่าน `core/Couponkum_Blueprint.md` เฉพาะเมื่อต้องการ architecture, infra, DB schema, engine blueprints, env vars, security reference, หรือ task history
4. เลือก task ถัดไปจาก Task Backlog ด้านล่าง
5. ก่อน code พูดว่า: `Starting TASK X.X - [name]. Scope: [one line]. OK?`
6. รอ owner confirm ก่อน write code
7. หลัง task เสร็จ: รัน CI checks → อัพเดต PRD.md + ไฟล์นี้ → commit → push → deploy VPS → smoke test

---

## Milestone Map (Current State)

| # | Workstream | Progress | Status |
|---|---|---|---|
| 1 | 🏗️ Infra & Deployment | `████████████` ~95% | Live ✅ |
| 2 | 🔍 Core Engine | `████████████` 100% | Done ✅ |
| 3 | 📝 SEO & Content | `████████████` 100% | Done ✅ |
| 5 | 💰 Revenue & AI | `████████████` ~98% | 6.1-6.5 gated |
| 6 | 🛡️ Security | `████████████` 100% | Done ✅ |
| **7** | 🚀 POSTLIVE | In progress | Month 1 active |

---

## Platform Blockers (⏳ PENDING — รอภายนอก)

| Blocker | สถานะ | Action เมื่อ approve |
|---|---|---|
| **Lazada Affiliate API** | ✅ LIVE — ใช้ LiteApp Affiliate API (adsense.lazada.co.th) · cron `0 */8 * * *` active · 34 active / 51 total in DB · **pool size = ~49 fixed** (ทุก keyword คืน 49 ชิ้นเดิม — keyword rotation ไม่ขยาย pool) · จะเพิ่มได้ต่อเมื่อ IA campaigns อนุมัติ หรือ AT Datafeed พร้อม |
| **Involve Asia properties** | ⏳ รออนุมัติรอบสอง | เริ่ม `AFFNET-6.1` (IA postback route) + `COUPON-AUTO-IA-1` |
| **IA REST API key** | ⏳ requested 2026-05-04, ETA 2026-05-06 | เริ่ม `AFFNET-IA-API` Phase 1 (product feed cron) |
| **AT Datafeed API** | ⏳ รอ reply จาก AT Support TH (ส่งเมล์ 2026-05-03) | เริ่ม `AFFNET-AT-DATAFEED` |
| **Shopee Affiliate Open API** | ⏳ Submitted 2026-05-05 · ETA 7 วันทำการ (2026-05-14) | รอ reply ที่ partner@couponkum.com |
| **IndexNow Key** | ⏳ Owner ต้องตั้งใน VPS `.env.local` | verify `https://couponkum.com/{key}.txt` |
| **UptimeRobot Dashboard** | ⏳ Owner setup remains | ตั้ง monitor + alert email ที่ UptimeRobot |
| **FB_DISABLE_GRAPH_API_POSTING** | ⏳ ตั้งเป็น `false` เมื่อพร้อมโพสต์จริง | tip pool โพสต์ได้ทันที |

---

## Task Backlog — POSTLIVE Series

### ⚡ Pending — รอ Platform Approval

| Task | Scope | Gate |
|---|---|---|
| `EMAIL-INFRA-2` | เพิ่ม hello@couponkum.com (web contact) + catch-all + Gmail "Send mail as" setup | หลัง Shopee reply มา |
| `SHOPEE-API-FOLLOWUP-1` | Follow-up Shopee Affiliate API ถ้าเงียบเกิน 14 วัน | If no reply by 2026-05-19 |
| `AFFNET-6.1` | Involve Asia Postback Route Clarification — align route, docs, tests, macros, admin labels | รอ IA properties approve |
| `COUPON-AUTO-IA-1` | Auto-Fetch Coupon Codes จาก IA Promo/Voucher API → `coupons` table auto-expire | รอ IA account อนุมัติ |
| `AFFNET-AT-DATAFEED` | AccessTrade Product Datafeed Auto-Import — cron ดึง AT feed → upsert DB; Sephora TH pilot | รอ AT Support TH reply |
| `AFFNET-IA-API` | Involve Asia REST API Integration — Phase 1: /offers/all sync → upsert `products` · Phase 2: Deeplinks batch · Phase 3: Conversions Reconcile | ✅ ACTIVE 2026-05-05 · auth=POST /authenticate (key=general + secret) · cron `0 */6 * * *` live on VPS · total_offers=0 pending IA campaign approvals (AFFNET-6.1 gate) |

### ⏳ UAT Pending — Improvement Backlog

| Task | Scope | หมายเหตุ |
|---|---|---|
| `SEARCH-COUPON-MATCH-1` | Coupon code search — ส่ง `matchedCoupon` เข้า pipeline เป็น priority coupon + filter fallback products ตาม platform + min_spend ของโค้ดนั้น → "ดีลที่น่าลองใช้โค้ดนี้" แสดงแต่สินค้าที่ใช้โค้ดได้จริง | ✅ done 2026-05-06 — `fetchProductsForCoupon` กรอง platform + min_spend; smoke test ผ่าน (TESTCK50 temp coupon) |
| `LINE-WALLET-UAT-1` | LINE push → wallet UAT — flow ใหม่: user เพิ่มเพื่อน LINE OA (fresh) → login → add coupon → รับ LINE push → ใช้ใน /wallet | owner มีเพื่อน LINE อยู่ก่อนแล้ว ยังไม่ได้ test fresh-friend flow — รอ UAT พร้อม LINE push (POSTLIVE-15) |
| `UAT-FUNNEL-1` | Real-Purchase Funnel UAT — ซื้อสินค้าจริงผ่าน couponkum → เช็ก IA/AT dashboard commission | ⏳ pending — owner action รอ AT/IA data เข้าระบบ |

### Month 1–3 (Priority 1)

| Task | Scope | Status |
|---|---|---|
| `SEARCH-BLOG-1` | Search + Related Articles — หน้า `/search` แสดง section "บทความที่เกี่ยวข้อง" ใต้ผลสินค้า; match blog posts ด้วย keyword overlap (title + description vs query); แสดง ≤ 3 การ์ด; หาก query ไม่ match ไม่แสดง section | ✅ done 2026-05-06 — แสดงทั้งใน results state และ no-result state; smoke test ผ่าน |
| `ADMIN-COUPON-REPORT-1` | Admin Coupons — report badge ⚑ + verified_at + success_rate per row; sort reported first; stat card "⚑ รายงาน"; AdminNav Core tab เพิ่ม Coupons link | ✅ done 2026-05-06 — UAT ผ่าน |
| `REPORT-FEED-ADMIN-1` | Fix: wallet "⚑ โค้ดใช้ไม่ได้?" → เพิ่ม downvote ใน coupon_votes + reset verified_at → admin ⚑ counter ขึ้น | ✅ done 2026-05-06 — UAT ผ่าน |
| `EXPORT-COUPON-1` | Export Analysis Section 6 Coupons — inventory, tier×platform breakdown, vote activity, top success_rate, reported coupons, wallet stats | ✅ done 2026-05-06 |
| `POSTLIVE-26.1` | Daily Featured Coupon — Full Algo Upgrade: เปิด CTR weight เมื่อ `click_logs ≥ 1,000 rows`; score = commission×0.35 + CTR×0.30 + freshness×0.25 + diversity×0.10 | ✅ done 2026-05-05 — v2_noctr active (77 clicks); CTR auto-flips เมื่อถึง 1,000 |
| `ADMIN-KPI-1` | KPI Cards `/admin` — เพิ่ม cards: revenue_today, conversion_rate, postback_fail_rate, broken_link_count, outbound_click_today, top_subid_today, top_deal_today; color coding เขียว/แดง/เทา; responsive 4/2 cols | ✅ done 2026-05-05 |
| `SHIP-MIGRATE-1` | รัน migration `20260505000001_product_shipping_fee.sql` บน VPS PostgreSQL — `ALTER TABLE products ADD COLUMN shipping_fee NUMERIC(8,2) DEFAULT NULL` | ✅ done 2026-05-05 — column verified |
| `COUPON-FIRST-1` | Card UI: CouponHeroBanner แสดงโค้ด + ลดกี่บาท เป็น element แรกบนการ์ด (ProductCard + RareHomepageCard); ซ่อน "ไม่ทราบ"/"~โดยประมาณ"; ลบ estimated shipping label | ✅ done 2026-05-05 — UAT ผ่าน |
| `COUPON-FIRST-2` | CTA: One-tap Copy + Go — กด CTA auto-copy โค้ด + toast "อย่าลืมวางโค้ด" → navigate `/go/[id]` | ✅ UAT ผ่าน 2026-05-06 |
| `COUPON-FIRST-3` | No-Coupon Panel — panel 3 options (สินค้าด้านล่าง / Payday countdown / LINE OA → /wallet) แสดงเหนือ results เมื่อไม่มีโค้ด | ✅ UAT ผ่าน 2026-05-05 |
| `LINE-LOGIN-FIX` | เปลี่ยน LINE OAuth button (error auth_failed) → LINE OA subscribe link → /wallet | ✅ done 2026-05-05 |
| `COUPON-FIRST-4` | Engine Ranking: เพิ่ม coupon weight ใน deal score — สินค้าที่มีโค้ดได้ bonus score ขึ้นก่อน | ✅ UAT ผ่าน 2026-05-06 |
| `POSTLIVE-HOME-1` | Homepage dynamic sections + global contact footer — "แบรนด์ที่มีดีล" chips (DB), "คนกำลังค้นหา" chips (search_logs 7d), social contact links รวมใน Footer.tsx ทุกหน้า (Facebook env-gated, LINE→/wallet, Email) | ✅ UAT ผ่าน 2026-05-05 |
| `UAT-FUNNEL-1` | **Real-Purchase Funnel UAT** — ซื้อสินค้าจริงจากทุก datasource (Shopee/IA, Lazada/IA, AccessTrade) ผ่าน couponkum.com → ตรวจ click_logs → ตรวจ postback/commission ว่าเงินเข้าจริงใน dashboard แต่ละ platform | ⏳ pending — owner กด + ซื้อ → เช็ก IA dashboard + AT dashboard ว่ามี pending commission ภายใน 24h |
| `WALLET-SWEEP-1` | **Tier-Grouped Wallet Sweep** — 4 tier sections (Platform/Shop/Bank/Shipping); filter chips; badge count; add-coupon code-only form; expiry countdown; admin coupon page ✅ | ✅ UAT ผ่าน 2026-05-06 · pending: LINE-WALLET-UAT-1 (fresh friend flow) |
| `HOMEPAGE-TRENDING-1` | "🔥 กำลังฮิตตอนนี้" auto from `click_logs WHERE query IS NOT NULL, 7d` — fallback to QUICK_SEARCHES เมื่อ < 3 results | ✅ done 2026-05-06 |
| `HOMEPAGE-STORES-1` | "🏪 ร้านค้าแนะนำ" admin-managed DB (`recommended_stores`) — CRUD UI `/admin/recommended-stores`; seeded 14 AT campaigns; AdminNav Core + Stores link; text card + orange gradient UI | ✅ UAT ผ่าน 2026-05-06 |
| `COUPON-SEED-CLEANUP-1` | DELETE 7 test-seed coupons จาก `coupons` table — ล้างข้อมูล test ก่อนรับ AT/IA จริง | ✅ done 2026-05-06 |

### Month 4–6 (Priority 2)

| Task | Scope | Month |
|---|---|---|
| `POSTLIVE-08` | pSEO Revenue Matrix — pageview > 100 แต่ outbound_clicks = 0 → auto-flag; เทียบ GA Pageview vs click_logs | 4 | ✅ done 2026-05-04 |
| `POSTLIVE-09` | ISR Cache + Cloudflare Rate Limit (เพิ่มเติมจาก basic ISR ที่ทำแล้ว) | 4 | ✅ done 2026-05-05 — deals/compare/coupon pages revalidate 3600→1800s; blog unchanged; Cloudflare rate limit: ✅ applied in dashboard 2026-05-05 |
| `POSTLIVE-10` | Winning Category Expansion (data-driven) → ขยายสู่ Brand-Level pSEO (เช่น `/deals/shopee/samsung`) เมื่อ search volume พร้อม | 5 | ✅ done 2026-05-05 — 5 brand clusters (Apple/Samsung/Xiaomi Shopee, Apple/Samsung Lazada); fetchProductsByBrand; generateBrandDealsContent; /deals/[platform]/[brand] routes live |
| `POSTLIVE-11` | A/B CTA Test result analysis + promote winner | 6 | ✅ tracking wired 2026-05-05 — cta_impression/cta_click firing from CouponCTAButton + IntermediateClient; /admin/experiments CTA panel จะมีข้อมูลหลัง traffic สะสม 2–4 สัปดาห์ |
| `POSTLIVE-12` | Structured Data (Product schema) สำหรับ pSEO | 5 | ✅ coded 2026-04-25 |
| `LIVECPN-1` | Live-Verified Coupon — migration: เพิ่ม `verified_at` + `success_rate` ใน coupons table | ✅ UAT ผ่าน 2026-05-06 |
| `LIVECPN-2` | Live-Verified Coupon — Badge UI "Verified X นาทีที่แล้ว" + success rate % บน coupon card | 4 | ✅ UAT ผ่าน 2026-05-06 — badge + % แสดงบน /wallet tier cards |
| `LIVECPN-3` | Live-Verified Coupon — Cron verify ทุก 30 นาที: expire check + verified_at stamp; ซ่อนถ้า dead | 5 | ✅ done 2026-05-05 — `/api/cron/coupon-verify` live + VPS cron `*/30` |
| `LIVECPN-4` | Live-Verified Coupon — Crowdsource: toast 👍/👎 หลังใช้คูปอง 30 วิ → นับ success rate | 5 | ✅ UAT ผ่าน 2026-05-06 — toast โผล่ 30s หลัง copy บน /go/[id]; รอ retest กับคูปองจริง |
| `LIVECPN-5` | Live-Verified Coupon — Trust signal "Last used X นาทีที่แล้ว" + 1-click report → re-verify | 6 | ✅ UAT ผ่าน 2026-05-06 — report button: reset verified_at + downvote → admin ⚑ counter ขึ้น; /admin/coupons แสดง badge แดง + verified_at + success_rate |
| `TRUST-BADGE-1` | Deal Card Trust Signal — badge "✅ ตรวจสอบแล้ว Xh" + "มีคนใช้แล้ว N คน" (ต่อยอด DIST-04) | 5 | ✅ done 2026-05-05 — ProductCard แสดง "✅ ตรวจสอบแล้ว Xชม." จาก price_checked_at (hidden ถ้า > 48h / null) |
| `SEARCH-1` | Search Quality Baseline — เพิ่ม `pg_trgm` extension + GIN index บน `coupons(title, code, merchant_name)` + `products(name, brand)`; ปรับ query ใช้ `%` similarity; ไม่ต้อง infra ใหม่ | ✅ done 2026-05-05 — trgm GIN on coupons(title,code) live; fetchProducts ใช้ word_similarity ordering |
| `SHIP-FEE-1` | Shipping Fee Accuracy — map `free_shipping` flag + `shipping_fee` จาก Lazada/IA feed → `products.shipping_fee`; pipeline ใช้ per-product fee อัตโนมัติ | 5 — Gate: `SHIP-MIGRATE-1` done ✅ · รอ Lazada feed มี shipping_fee field |

### Month 7–9 (Priority 3)

| Task | Scope | Month |
|---|---|---|
| `SMART-PASTE-1` | Smart Paste Solver — LINE OA รับ Shopee/Lazada URL → unshorten → Combination Solver → ตอบราคาสุทธิ + โค้ดทันที | 7 — รอ IA/Lazada API + LINE OA พร้อม |
| `POSTLIVE-13` | AI Ranking Dry-Run Report | 7 |
| `POSTLIVE-14` | PostgreSQL Partitioning (analytics_events, click_logs) | 7 |
| `POSTLIVE-15` | LINE/Email Deal Alert activation | 8 |
| `POSTLIVE-16` | PWA Manifest + Service Worker | 8 | ✅ coded 2026-04-27 |
| `POSTLIVE-17` | Browser Push Notification — price drop > 10% / coupon expire < 3h | 9 | ✅ stub coded 2026-04-30; real send waits Month 9 |
| `POSTLIVE-18` | Rare Item Engine + Dashboard | 9 |
| `SEARCH-2` | Search Upgrade — **[ทางเลือก A]** Typesense self-host: ติดตั้ง Typesense บน VPS, sync coupons+products ผ่าน cron, ต่อ Next.js search API; typo-tolerant, faceted filter, <50ms; **Gate: coupons DB ≥ 5,000 rows** | 7 |
| `SEARCH-3` | Search Upgrade — **[ทางเลือก B]** Algolia Free Tier: push index ผ่าน `algoliasearch` SDK, ใช้ InstantSearch UI component; ฟรีสูงสุด 10K records / 10K ops/mo; **Gate: coupons DB ≥ 5,000 rows; เลือก A หรือ B ไม่ทำทั้งคู่** | 7 |

### Month 10–12 (Priority 4)

| Task | Scope | Month |
|---|---|---|
| `POSTLIVE-19` | AI Caption Dry-Run (compare vs manual CTR) | 10 |
| `POSTLIVE-20` | Cold Storage + archive pipeline | 10 |
| `POSTLIVE-21` | Seasonal Campaign Mode (11.11 / 12.12) | 11 |
| `POSTLIVE-22` | TikTok Script AI v1 (admin approve flow) | 11 |
| `POSTLIVE-23` | AI Revenue-Driven Ranking A/B (20% traffic) | 12 |
| `POSTLIVE-24` | Personal Loyalty Wallet v1 (login-required; ต่อยอดจาก WALLET-PUB-1) | 12 |
| `POSTLIVE-25` | Year-1 ROI Review + Year-2 planning + Drop Shopping Go/No-Go | 12 |

### Year 2 Drop Shopping (Month 13–18, Gate-locked)

> **Gate:** ต้องผ่านเงื่อนไขทั้งหมดก่อน — ดูรายละเอียดใน `core/Couponkum_Blueprint.md` Part E6

| Task | Scope | Gate |
|---|---|---|
| `DS-01` | EPC Analysis Report | EPC ≥ 6M |
| `DS-02` | Shopee Seller Store pilot 10–20 SKU | revenue ≥ 20K/mo |
| `DS-03` | Margin vs EPC Comparison Dashboard | DS-02 live |
| `DS-04` | Scale platform + SKU | DS-03 margin > commission |
| `DS-05` | Own Checkout (Omise + Order DB + Shipping API) | GMV > 50K/mo |

### AI Gate Tasks (6.1-6.5 — Dormant)

> ห้ามเปิดใช้จริงก่อนมี baseline traffic + click + revenue data

| Task | ชื่อ |
|---|---|
| 6.1 | AI Revenue-Driven Weighting — ปรับ Ranking ตาม RPC + CTR |
| 6.2 | AI Caption Generator v2 — ใช้ CTR จาก facebook_logs |
| 6.3 | 3-Point Matching Engine |
| 6.4 | Content Machine Scaling — auto-generate SEO content |
| 6.5 | Database Lean Management — archive price_history > 6 เดือน |

### TikTok Tasks (Dormant — รอ follower ≥ 1,000)

| Task | Scope |
|---|---|
| `TT-CONTENT-2` | TikTok Trend Scraper + API integration |
| `TT-CONTENT-3` | AI TikTok Script Generator v1 |

---

## Affiliate Network Pending Tasks

| Task | Scope | Status |
|---|---|---|
| `AFFNET-3` | Bank Promo Lane | Post go-live |
| `AFFNET-4` | Fallback Chain | Post go-live |
| `AFFNET-5` | EPC Dashboard (extended) | Post go-live |

---

_อัพเดตล่าสุด: 2026-05-06 | Session 17 — SEARCH-BLOG-1 ✅; 1-baht AT products deleted; Lazada feed investigation: pool=49 fixed (keyword rotation ไม่ช่วย); cron total_results logging added_
_Completed task archive + session history → `core/Couponkum_Blueprint.md` Part F_
