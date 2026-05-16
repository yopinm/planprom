# PRD.md

> **Read order:** `core/planprom.md` (อ่านก่อน) → **ไฟล์นี้ (PRD.md)** → `core/Couponkum_Blueprint.md` (เฉพาะ A2 DB / Part E ROI ถ้าจำเป็น)
> Legacy FROZEN: `core/Couponkum_Project_Driven_V13.md` · `core/Project_Driven_V14_Couponfirst.md` · `core/Couponkum_New_Roadmap.md`

---

## 🎯 Brand & Slogan (V15 Template + Coupon)

| Item | Value |
|---|---|
| **Slogan** | **"เช็คทุกขั้น แพลนทุกวัน ใช้ได้ทุกงาน"** |
| **Niche** | Section 1 = Digital Template Store (PDF planner/checklist) @ `/` · Section 2 = Coupon Affiliate @ `/affiliate` (แยก route โดยสมบูรณ์ — ไม่ mix กับ template) |
| **Monetization** | ทุกช่องทางรายได้ยังเปิดเต็มที่ — affiliate commission ทุก network, sub-ID tracking, future ad slot, future cashback rebate, future drop shipping (Year 2) — ดู Blueprint Part E "Break-Even ROI Roadmap" |
| **Architecture Decision (2026-05-08)** | **Coupon/Wallet/Affiliate ทั้งระบบจะแยกไปอยู่ `/affiliate` route** — ไม่เกี่ยวข้องกับ template pages (/templates, /cart, /checkout, /order) เลย · งานใหม่ที่เกี่ยวกับ coupon → วางใต้ /affiliate เสมอ |

---

## ⚡ Quick Recheck — อ่านก่อนเริ่มทุก Session (30 วินาที)

| ✅ Check | รายละเอียด |
|---|---|
| **Mode** | Post-Launch / Month 1 POSTLIVE — **V15 Template + Coupon** active |
| **Production** | Live · https://planprom.com · VPS `root@103.52.109.85` |
| **Branch** | `main` → push → deploy VPS ทุกครั้ง |
| **CI Gate** | `npx tsc --noEmit && npm run lint && npm run test` ก่อน commit เสมอ |
| **UAT Rule** | deploy → smoke test → checklist → รอ owner confirm → ถึงจะปิด task |
| **One Task** | ทำทีละ 1 task · 1 commit · ห้ามรวม task หรือ refactor โดยไม่ได้รับ confirm |
| **Doc Sync** | task เสร็จ → อัพเดต PRD.md + `core/planprom.md` เสมอ |
| **Scope Gate** | ก่อนเริ่ม implement ทุก task → ต้องมี scope + flow ใน `core/planprom.md` ก่อน → commit docs → รอ owner confirm → ค่อย implement |
| **Blockers** | Lazada pool=49 fixed · Affiliate tasks ❌ CLOSED 2026-05-13 (owner decision) |
| **Next task** | **Planner/Form/Report engine UAT** ⏳ → INTEL-SMART UAT 🟡 |
| **Pending (code)** | E9/E10 · UI-G(defer) |
| **Pending (UAT)** | **Engine UAT** 🟡 (Planner/Form/Report — Checklist ✅ · Upload PDF ✅) · **INTEL-SMART** 🟡 (trend arrows) · INTEL-BLOG-SCORE 🔲 · INTEL-C/D · DC-1 · DC-2 · DC-8 · DC-16 · E9/E10 · J9(รอ live keys) |
| **Pending (decision)** | Homepage UX: D (social proof bar) + B (featured badge pulse) — mock ready รอ confirm |
| **Last session** | **Session 80 (2026-05-16)** — Planner Pipeline mainTasks: ลบตัวเลขใน PDF · dynamic +/− fields (min=3) · label → "อย่างน้อย 3 อย่าง" |
| **ห้าม** | ไม่แตะ Later task ขณะที่ Now ยังค้างอยู่ · ไม่แตะ secrets โดยตรง · ไม่ทำให้ revenue channel หายไประหว่าง pivot |
| **Security rule** | ทุก admin feature ต้องตรวจ: role check · PII mask · no path disclosure · spawnSync array args (ดู §23 Manual) |

---

## Usage Limit Guard

| Rule | Action |
|---|---|
| **Check Quota** | ประเมิน Token/Turns ก่อนเริ่ม Task เสมอ — ถ้าเหลือน้อยให้หยุดและ push ก่อน |
| **Atomic Work** | แตก Task ใหญ่เป็นชิ้นย่อยที่จบได้ใน 1-2 Turns |
| **Save Point** | หาก Limit ใกล้เต็ม ให้ `git push` + สรุป Progress + แผนงานที่เหลือทันที |

---

## Snapshot

| Item | Value |
|---|---|
| Product | planprom.com |
| Slogan | **เช็คทุกขั้น แพลนทุกวัน ใช้ได้ทุกงาน** |
| Mode | **Post-Launch / V15 Template + Coupon** |
| Production | **Live since 2026-05-01** — VPS + PM2 (fork mode) + Nginx + Cloudflare Full (Strict) |
| Goal now | V15 Template Store — publish templates, DC-8 revision system, UAT pending tasks |
| Progress | **V15 series opened 2026-05-07 · Session 32 complete 2026-05-09** |
| Branch | `main` |
| VPS | root@103.52.109.85 · /var/www/planprom · PORT 3001 · fork mode |

---

## Current Production Status

**All launch gates complete 2026-05-01:**
- `DB-MIGRATION-VPS` ✅ — PostgreSQL cutover complete
- `TASK 4.9` ✅ — Staging smoke 15/15 PASSED
- `REV-POSTBACK-1` ✅ — 4/4 PASSED (Lazada + IA + Shopee sub_id attribution)
- `POSTLIVE-00` ✅ — Production smoke 5/5 PASSED
- `TASK 5.0` ✅ — Production traffic open; `affiliate_redirect` + `postback_tracking` enabled; `/api/r` → HTTP 302

**Session 5 (2026-05-04) — 7 tasks completed:**
- `DIST-01` ✅ FB Manual Posting Playbook + Template System
- `DIST-02` ✅ Programmatic SEO 26 new pages (49 total) · IndexNow cron · GSC 82 pages submitted
- `DIST-03` ✅ Community Outreach Engine (10 seed groups, 4 formats)
- `DIST-03B` ✅ FB VIP Group Console (14 templates, 7 pillars, pillar balance UI)
- `DIST-04` ✅ Trust & Conversion Sprint
- `AFFNET-7/8/10` ✅ Revenue tracer + Network EPC + Payout optimizer
- `WALLET-GUEST-1` ✅ Guest ID tracking + LINE webhook mapping
- `POSTLIVE-31/32/33` ✅ Pre-campaign cookie drop + Savings widget + Influencer sub-ID

**Session 6 (2026-05-04) — doc restructure + scaffold:**
- `BLUEPRINT-MERGE` ✅ Merge 4 docs → Blueprint · lean V13/PRD/CLAUDE · 3-file read order
- `AFFNET-IA-API` ✅ Involve Asia REST API SAFE MODE scaffold (adapter + cron + 13 tests) · activate เมื่อ key มา

**Session 8–9 (2026-05-05) — infra + algo + search:**
- `ADMIN-KPI-1` ✅ KPI cards /admin (revenue, conversion, broken links, top deals)
- `SHIP-MIGRATE-1` ✅ products.shipping_fee column migration
- `POSTLIVE-26.1` ✅ Daily featured coupon v2 algo + CTR gate (auto-flip at 1,000 click_logs)
- `LIVECPN-1` ✅ coupons.verified_at + success_rate migration · ⏳ UAT pending
- `SEARCH-1` ✅ pg_trgm GIN indexes + word_similarity ordering
- `AFFNET-IA-API` ✅ Activated — correct auth POST /authenticate + /offers/all + VPS cron 0 */6 * * *

**Session 10 (2026-05-05) — trust + ISR + Cloudflare:**
- `TRUST-BADGE-1` ✅ ProductCard "✅ ตรวจสอบแล้ว Xชม." badge จาก price_checked_at
- `LIVECPN-2` ✅ PublicCouponCard verified_at + success_rate badge · ⏳ UAT pending (รอ coupons มี verified_at)
- `POSTLIVE-09` ✅ ISR revalidate 3600→1800s (deals/compare/coupon pages) + Cloudflare WAF rate limit + Bot Fight Mode
- Lazada LiteApp API ✅ ใช้ adsense.lazada.co.th — affiliate feed active, ไม่ต้องสมัคร open.lazada.com (คนละระบบ)

**Session 13 (2026-05-05) — POSTLIVE-10 brand pSEO + session fixes:**
- `POSTLIVE-10` ✅ Brand-Level pSEO — 5 brand clusters live (Apple/Samsung/Xiaomi Shopee, Apple/Samsung Lazada); `/deals/[platform]/[brand]` routes; fetchProductsByBrand; generateBrandDealsContent
- Brand chip 0-result fix ✅ — fetchProducts SQL + search-pipeline textMatches ทั้ง 2 layer
- ProductCard trust fix ✅ — SavingsReceipt แสดงเสมอ แยก reliable/stale ด้วย visual
- Brand section shop_type fallback ✅ — official/mall filter + COUNT ≥ 2 fallback
- blog สแต็กกิ้ง spelling fix ✅

**Session 12 (2026-05-05) — LIVECPN series + POSTLIVE-11 tracking:**
- `LIVECPN-4` ✅ Coupon vote toast 30s หลัง copy + success_rate sync to coupons table
- `LIVECPN-5` ✅ "ใช้ล่าสุด X นาทีที่แล้ว" badge + report button → reset verified_at re-verify
- `POSTLIVE-11` ✅ cta_impression / cta_click wired on CouponCTAButton + IntermediateClient → /admin/experiments จะมีข้อมูลเมื่อ traffic สะสม
- Seed demo data (5 rows `a1000000-`) ✅ ลบออกจาก VPS DB แล้ว

**Session 14 (2026-05-06) — Homepage audit + data quality fixes:**
- og:image scraping ✅ lazada-conversion-import ดึงภาพจาก product page HTML แทน `/products/get` (ServiceUnavailable)
- Price ceiling ✅ search + rare feed กรอง > 100k; 15 B2B products deactivated in DB
- Rare item score fix ✅ เพิ่ม `p.is_active = true` filter; force-run cron → 34 active products scored
- Homepage audit ✅ documented ใน Blueprint A7
- `SEARCH-BLOG-1` ⏳ added to V13 backlog — search results แสดงบทความที่เกี่ยวข้อง

**Session 15 (2026-05-06) — Coupon Engine docs + SEARCH-BLOG-1 + data cleanup:**
- Blueprint A9 ✅ Coupon Engine Reference section เพิ่มใน Blueprint (4-tier, stack rules, combo solver, daily featured, wallet flow, cron, admin)
- `SEARCH-BLOG-1` ✅ "บทความที่เกี่ยวข้อง" บน `/search` — แสดงทั้ง results + no-result state; ลบ SearchRecoveryPanel ออก
- 1-baht products ✅ ลบ 12 AT store-page entries (`price_current ≤ 5`) ออกจาก VPS DB
- Lazada docs ✅ แก้ไขเอกสารทุกที่ที่บอก "รอ open.lazada.com approval" → ✅ LIVE ใช้ LiteApp Affiliate API (adsense.lazada.co.th) ไม่เกี่ยวกับ Open Platform ISV

**Session 17 (2026-05-06) — Lazada feed investigation + cron improvement:**
- Keyword rotation ✅ เปลี่ยน `query:''` → rotate 20 keywords (iphone/samsung/laptop...) ตาม UTC hour — 5 keywords/run
- Pool investigation ✅ ค้นพบว่า LiteApp Affiliate feed มี fixed pool **~49 สินค้า** เท่านั้น — ทุก keyword คืน 49 ชิ้นเดิมเสมอ; keyword rotation ไม่ช่วยขยาย pool
- total_results logging ✅ cron response เพิ่ม `keywords: {keyword: total}` เพื่อ debug pool size ได้ทันที
- ข้อสรุป: Lazada products จะเพิ่มได้ก็ต่อเมื่อ IA campaigns อนุมัติ หรือ AT Datafeed API พร้อม

**Session 18 (2026-05-07) — V15 homepage UI + Header redesign complete:**
- Header 2-row rewrite ✅ — Row1: gradient amber→white→emerald + logo + brand + slogan; Row2: white bg + nav + search; sticky; StatsBar removed completely
- Homepage V15 UI polish ✅ — ฉลากไทยครบ (Templates→เทมเพลต, Wallet→กระเป๋า ฯลฯ); lucide-react ^1.14.0 line icons (Option C) แทน emoji; template cards เล็กลง (h-28/32), grid 4-col `lg:grid-cols-4`, gap-3/4; Hero + Section 1 spacing tightened (py-10/14)
- S1/S2 badges ✅ — "📋 ร้านเทมเพลต" (ตัด "ส่วนที่ 1 ·" ออก, ขนาดใหญ่ขึ้น); "🎟️ คูปองแนะนำวันนี้" (ตัด "ส่วนที่ 2 ·" ออก)
- Section divider ✅ ลบ dark bar "↓↓↓ ส่วนที่ 2 ↓↓↓" ออก
- Trending section ✅ ลบ "🔥 กำลังฮิต / 🔍 คนกำลังค้นหา" chips block ออก; กรอง Hoptech.Official.Store.TH จาก brands
- `core/New_Project/` ✅ ลบโฟลเดอร์ออก (V15-CLEAN-6 done)

---

## Document Structure (Updated 2026-05-07)

| ไฟล์ | บทบาท | อ่านเมื่อ |
|---|---|---|
| `core/Coupon_TP.MD` | **CANONICAL V15** spec — Template + Coupon · Active tasks · UAT checklist | ทุก session (อ่านก่อน) |
| `PRD.md` | **ไฟล์นี้** — Snapshot + Slogan + Session log + Blockers | ทุก session (อ่านที่สอง) |
| `core/Couponkum_Project_Driven_V13.md` | Legacy roadmap (frozen 2026-05-07) | reference if needed |
| `core/Couponkum_Blueprint.md` | Architecture · Infra · Engines · DB · Admin · Roadmap · Break-Even ROI | reference เมื่อต้องการ architecture |

---

## UAT Status Summary (อัพเดต 2026-05-10 · Session 33)

> รายละเอียดเต็ม → `core/planprom.md` Section "UAT Master Checklist"
> **สรุป (Session 46):** Code pending 7 tasks · UAT pending 6 กลุ่ม · รวม 13 รายการยังค้าง

### Pending Code Tasks (เรียงตามลำดับ)

| # | Task | Priority | สถานะ |
|---|---|---|---|
| 1 | **DC-8** Engine Content Edit + Revision History | ✅ Closed | ✅ Checklist ครบลูป · Planner UX แก้โดยใช้ Engine Planner Pipeline (DC-16) แทน |
| 2 | **DC-12** Publish Button ไม่ revalidate หลัง click | — | ✅ Closed (no repro) |
| 3 | **J7** preview modal CTA → AddToCartButton | — | ✅ Done (Session 45) |
| 4 | **J10** Wallet login prompt | — | ✅ Closed (wallet removed) |
| 5 | **J12** LINE OAuth | — | ✅ Closed (LINE login removed) |
| 6 | **J20** Catalog Edit Name+Emoji inline | — | ✅ Done |
| 7 | **UI-A** Pricing TIER_2 ฿8→฿10 | — | ✅ Done (Session 45) |
| 8 | **UI-B+C** Hero copy + Trust strip | — | ✅ Done (Session 45) |
| 9 | **UI-E** Section 2 → 2 category cards | — | ✅ Done (Session 45) |
| 10 | **UI-F** Hide empty categories | — | ✅ Done (Session 45) |
| 11 | **J11** Free tier download flow (ข้าม payment) | 🟡 Medium | ✅ Done (Session 46) |
| 12 | **ADMIN-CLEAN-1** Admin wallet dead code | 🟡 | ✅ Done (Session 45) |
| 13 | **ADMIN-CLEAN-2** Admin cleanup ชุด 2 | 🟡 | ✅ Done (Session 46) |
| 14 | **J13** Customer Request Form `/templates/request` | ❌ CANCELLED | ❌ Cancelled (2026-05-14 owner decision) — ใช้ LINE ส่วนตัว ฿50/template แทน web form |
| 15 | **J14** ระบบสมาชิก + Auto Push LINE | ❌ CANCELLED | ❌ Cancelled (2026-05-13 owner decision) |
| 16 | **J17** Subscription รายเดือน (Standard/Pro) | ❌ CANCELLED | ❌ Cancelled (2026-05-13 owner decision) |
| 17 | **J19** System Log Unified `/admin/report/log` | 🟡 Medium | ✅ Done · Live (Session 69 · 2026-05-14) |
| 18 | **PROMO-1** Promo Code API + Checkout Integration | 🟡 Medium | ✅ Done · UAT ผ่าน |
| 19 | **PROMO-2** PromoCodeBanner Homepage + Countdown | 🟡 Medium | ✅ Done · UAT ผ่าน |
| 20 | **PROMO-3** Admin Promo Code CRUD + is_secret + comeback_text | 🟡 Medium | ✅ Done · UAT ผ่าน |
| 21 | **HOME-FEAT-1** Featured Template Card | 🟡 | ✅ Done · Live (Session 47) |

### Pending UAT (code พร้อม รอ owner test)

| กลุ่ม | รายการ | สถานะ |
|---|---|---|
| **UI-H** | Analytics Page — Match Catalog Design (`/admin/template-analytics`) | ✅ **Done (INTEL-E/SMART · Session 61-62)** |
| **UI-I** | Pricing ฿30/฿20/฿10 ทั้ง 10 ไฟล์ — fix 2 bugs (stale TIER_2 ฿8, request-only unit_price) | ✅ **UAT ผ่าน (Session 62)** |
| **INTEL-E** | Catalog intelligence — S2a perf cards · S2b heatmap · S3 badge+pre-fill · S4 gap chips | ✅ **UAT ผ่าน (Session 62)** |
| **INTEL-C/D** | 3-Level Coverage Card + Smart Engine Expansion | 🟡 **UAT Pending (Session 53)** |
| **DC-1** | Standard PDF Generator (.docx → A4) — checklist/planner UAT | 🟡 **Code Done · UAT Pending** |
| **DC-2** | TOC Preview สารบัญ — toggle /templates · always-expanded /templates/[slug] | 🟡 **Code Done · UAT Pending** |
| **DC-16** | Planner Pipeline v4 — 5-section time-cascade | 🟡 **UAT Pending** |
| **E9/E10** | Engine preview card บน /templates/[slug] (checklist/planner green/violet) | 🟡 **UAT Pending** |
| **J9** | Live Omise keys → real QR scan test (G4 pending) | 🟡 **รอ owner ตั้ง live keys** |

### Session Log

| Session | สถานะ |
|---|---|
| **Session 80 (2026-05-16) — Planner Pipeline mainTasks UX** | ✅ Live — ลบตัวเลขนำหน้า (1/2/3) ออกจาก PDF · dynamic +/− fields min=3 · label "งานหลักอย่างน้อย 3 อย่าง" ทั้ง form + PDF |
| **Session 79 (2026-05-15) — LINE Floating Button UX fix** | ✅ Live — ย้าย `FloatingLineButton` จาก `bottom-right` → `bottom-left` · speech bubble arrow ย้ายตาม · แก้ปัญหาทับ add-to-cart modal บน mobile |
| **Session 78 (2026-05-15) — Planner Pipeline UX + 1-3-5** | ✅ Live — Yearly: weekly task form grouped by month (header มกราคม/กุมภาพันธ์…) + weeksPerMonth selector (3/4/5) + auto-sync slots · 1-3-6 → 1-3-5 ทุกจุด (engine PDF label + slice(0,5) · form default small 6→5 · ReviseClient card titles) |
| **Session 77 (2026-05-15) — Nav Bar UX + sale_count fix** | ✅ Live — Nav: 🔥 ขายดี (`/templates?sort=bestseller`) + 🆓 ฟรี (`/templates?price=0`) · emoji ทุก item ชุด A (🏠📋🔥🆓📖📅❓) · Suspense wrapper ป้องกัน SSR crash · sale_count sync จาก 14 orders จริง · auto-increment on paid (status polling + webhook) |
| **Session 71 (2026-05-14) — i18n Footer + Nav** | ✅ Live — Footer: Legal→ข้อกฎหมาย · Privacy→นโยบายความเป็นส่วนตัว · Terms→เงื่อนไขการใช้งาน · All rights reserved→สงวนลิขสิทธิ์ · Nav: "Planner vs Checklist"→"Planner หรือ Checklist?" |
| **Session 70 (2026-05-14) — Security Audit + Admin Dashboard** | ✅ Live — VULN-001: requireAdminRole('admin') · VULN-002: maskIpLines + privacy notice · VULN-003: basename only · VULN-004: spawnSync array args · Admin Dashboard 3 new sections (Report/SystemHealth/Promo) |
| **Session 69 (2026-05-14) — J19 System Log** | ✅ Live — System Log unified `/admin/report/log`: 4 log tabs (PM2/Nginx-Access/Nginx-Error/Error-Digest) + Export JSON + Thai alert cards (5xx/error/4xx/template/cart) + expandable card detail (เงื่อนไข / ความหมาย / วิธีแก้) |
| **Session 68 (2026-05-14) — ADM-RBAC-1 + Pricing + Bug Fixes** | 🟡 ฿30 tier Pending UAT — ADM-RBAC-1: Supabase+bcrypt hybrid auth · clerk module permissions (checkbox) · middleware Edge route guard · /admin/users · ฿30 Standard tier ทุก engine wizard + public UI · force delete FK fix (promo_codes deactivate) · request template price badge hide |
| **Session 67 (2026-05-14) — SEO Manual Blog + Search Console** | ✅ Live — Admin manual blog creation: template picker (DB-based, 10 topics, inline CRUD) · createPostAction (draft/publish) · Google Search Console verified + sitemap 22 pages · robots.txt domain fix · Blog Manager search+filter (BlogListClient) |
| **Session 66 (2026-05-14) — BLOG-EDIT + SEO-ENGINE scaffold** | ✅ Live — BLOG-EDIT: import built-in→DB + edit page + delete button · SEO-ENGINE: pending_review status + approveDraftAction + GenerateDraftButton (removed — Gemini quota 0) |
| **Session 65 (2026-05-14) — PROMO-5** | ✅ UAT ผ่าน — PromoCodeBanner: progress bar + savings hint + slots · Checkout badge -฿XX pulse · Admin 💡 pricing hint |
| **Session 64 (2026-05-13) — RE-1 Report Engine** | ✅ Live — Report Engine ครบ 4 engine loop · 8-section PDF · ReportEngineForm · generate-report route · preview card sky · Revise support |
| **Session 63 (2026-05-14) — Fee Fix + Banner + Featured + Blog Pinned** | ✅ Live — Fix ค่าธรรมเนียม 1.7655% Omise-only · Tooltip ⓘ · DAY1-UAT task · PromoCodeBanner redesign · FeaturedTemplateCard 3-template · บทความแนะนำ (pinned posts) บน homepage |
| **Session 62 (2026-05-14) — INTEL-SMART** | 🟡 Pending UAT พรุ่งนี้ — Dedup+Cluster (×N score×count) · Fulfilled Tracking (intel_fulfilled table + recordFulfilledAction) · Trend Score (intel_snapshots daily · 📈/📉 โชว์วันที่ 2+) · INTEL-E ✅ UAT ผ่าน |
| **Session 61 (2026-05-14) — UI-I + INTEL-E** | ✅ Live — UI-I: ฿20→฿30 / ฿10→฿20 / ฿7→฿10 ครบ 10 ไฟล์ + fix stale TIER_2 bug + fix request-only unit_price bug · INTEL-E: 5 features catalog analytics + WizardClient pre-fill |
| **J18. Cart + Volume Pricing** | ✅ UAT ผ่าน 2026-05-08 (Session 28) |
| **DC-3. DB Sequence Order ID** | ✅ Done · Live (Session 29) |
| **Session 27. /affiliate page** | ✅ Live |
| **Session 28. Homepage Hero** | ✅ Live 2026-05-08 |
| **Session 30. DC-ENGINE Series** | ✅ Live 2026-05-09 (DC-4/5/6/7) |
| **Session 30. Pricing Callout** | ✅ Live 2026-05-09 |
| **Session 32. Blog + Rebrand + Deploy** | ✅ Live 2026-05-09 |
| **Session 33. Payment UAT Fixes** | ✅ Live · UAT ผ่าน 2026-05-09 |
| **Session 34. Admin Report Suite** | ✅ Live 2026-05-10 · R-1..R-10 · Wallet cleanup marked |
| **Session 35. Engine Checklist fix** | ✅ Live 2026-05-10 — wrap all async try/catch — Engine Checklist กลับมาทำงานครบ loop |
| **Session 36. Engine Checklist + Planner UAT ผ่านครบ** | ✅ Live 2026-05-10 — Nginx proxy_buffer 128k · generate-planner แยก route · slug check step 3 · 2 more engines planned |
| **Session 37. Orders + Checkout refactor** | ✅ Live 2026-05-10 — LINE notify buyer · /checkout/[slug] redirect cart · admin/orders KPI fee/net · ลบ Template Orders tab |
| **DC-8. Engine Revision System** | ✅ Live 2026-05-10 — Checklist UAT ✅ครบลูป · Planner UAT ⏳ pending |
| **Session 40. Template Delete/Archive** | ✅ Live 2026-05-10 — ADMIN-TMPL-DEL-1: ซ่อน/ลบถาวร · ADMIN-TMPL-FORCE-1: Force Delete (pre-launch) · fix router.refresh() |
| **Session 52. Sales Merge + Promo Extended** | ✅ Live 2026-05-12 — /admin/orders → /admin/report/sales 7-section · order prefix PP- · PROMO is_secret/comeback_text/delete FK fix · UAT ✅ Sales ✅ Promo |

**✅ J18 UAT ผ่านครบ (2026-05-08 Session 28)** — payment flow ถูก lock ห้ามแก้ไขจนกว่าแอดมินจะสั่ง
**🟡 Medium (J9):** ต้องสลับเป็น live Omise keys — test mode QR อ่านไม่ได้ด้วยแอปธนาคาร
**🟡 Medium (J10):** Wallet login prompt หลัง download ใน tab เดิม — fix plan อยู่ใน J10 notes
**🟡 Domain (pending):** redirect couponkum.com → /affiliate รอจด mr-checklist.com + Nginx server block ก่อน

---

## V15 — Session 29 Changes (2026-05-08) — DC Series (Document Control)

### DC-3: DB Sequence Order ID ✅ Live

| # | Change | Commit |
|---|---|---|
| 1 | `migrations/20260508_order_seq.sql` — `CREATE SEQUENCE order_seq START 1000` + `order_type TEXT` column | — |
| 2 | `app/api/checkout/route.ts` — `newOrderUid()` async, ใช้ `nextval('order_seq')` · INSERT ใส่ `order_type = 'cart'` | — |

### DC-2: TOC Preview สารบัญ 🟡 UAT Pending

| # | Change | Commit |
|---|---|---|
| 1 | `lib/pdf-types.ts` (NEW) — type isolation, `TocItem = { level: number; title: string }` | `ff3e207` |
| 2 | `migrations/20260508_toc_sections.sql` — `ALTER TABLE templates ADD COLUMN toc_sections JSONB` | — |
| 3 | `lib/pdf-generator.ts` — เพิ่ม `extractToc()` extract H1/H2/H3 จาก mammoth HTML | — |
| 4 | `components/templates/TocPreview.tsx` (NEW) — toggle expand/collapse สำหรับ /templates list | — |
| 5 | `app/templates/page.tsx` — เพิ่ม `TocPreview` per card | — |
| 6 | `app/templates/[slug]/page.tsx` — TOC always-expanded (ไม่ต้องกด toggle) | `d5708bd` |

### DC-1: Standard PDF Generator 🟡 UAT Pending

| # | Change | Commit |
|---|---|---|
| 1 | `lib/pdf-generator.ts` (NEW) — mammoth→HTML → puppeteer A4 PDF · Sarabun Google Font · watermark `::before` | — |
| 2 | `app/api/admin/templates/upload-docx/route.ts` (NEW) — POST .docx → generate PDF + extractToc parallel | — |
| 3 | `app/admin/templates/actions.ts` — `createTemplateWizardAction` รองรับ `toc_sections`, `watermarkText`, status `draft_preview` · `approveTemplateAction` (NEW) | — |
| 4 | `app/admin/templates/new/WizardClient.tsx` — docx tab แทน starter · watermark radio UI · TOC preview หลัง generate | — |
| 5 | `app/admin/templates/[id]/edit/page.tsx` — draft_preview block + Approve button | — |
| 6 | `migrations/20260508_status_draft_preview.sql` — เพิ่ม `draft_preview` ใน templates_status_check | — |
| 7 | `migrations/20260508_docx_generator.sql` — `ALTER TABLE templates ADD COLUMN watermark_text TEXT` | — |
| 8 | PDF format fixes: Sarabun font + `document.fonts.ready` | `6d0bf7d` |
| 9 | PDF margin fix: `page.pdf({ margin: { top:'20mm'... } })` — ใช้ทุกหน้า (ไม่ใช่ body padding) | `0b16ed4` |
| 10 | PDF page-break: `break-after: avoid` บน h1/h2/h3 · `break-inside: avoid` บน li | `d5708bd` |
| 11 | Footer fix: `z-index: 10; background: white` — ลายน้ำไม่ทะลุ footer | `fab1324` |

**⏳ UAT ยังรอ:** checklist .docx (ตาราง, multi-level bullet) · planner .docx (grid/table) · Approve flow → /templates/[slug] TOC confirm

---

## V15 — Session 28 Changes (2026-05-08) — Payment Flow Security + Hero Redesign

### Hero Redesign — Option C (ยิ่งซื้อมาก ยิ่งคุ้ม)

| # | Change | Commit | UAT |
|---|---|---|---|
| 1 | `app/page.tsx` — hero rewrite: H1 "ยิ่งซื้อมาก ยิ่งคุ้ม" · 4-step inline flow (🛒→🧺→💳→⬇️) · 3-col tier pricing card (TIER_1/2/3, emerald highlight ชิ้น 2–5) · stacked CTAs · max-w-md · MOCK_TEMPLATE_CARDS ฿20 ทั้งหมด | `6c646df` | ✅ Live |

---

## V15 — Session 28 Changes (2026-05-08) — Payment Flow Security + Auto-redirect

> ⚠️ **FROZEN — ห้ามแก้ไข payment flow จนกว่าแอดมินจะสั่ง** (confirmed 2026-05-08)

### Payment flow design (confirmed ✅)

```
1. /checkout → กด "สร้าง QR PromptPay"
2. Omise charge สร้าง → QR แสดง
3. Polling ทุก 3s → GET /api/checkout/[uid]/status
     └─ status endpoint query Omise โดยตรง (ไม่รอ webhook)
     └─ ถ้า charge.status === 'successful' → mark paid → issue tokens → LINE notify owner
     └─ frontend รับ {status:'paid'} → router.push('/order/[uid]') ทันที (≤ 6s)
4. ถ้า QR ไม่ได้สแกน 120s → QR ซีด → ปุ่ม "QR หมดอายุ — สร้าง QR ใหม่"
     └─ POST /api/checkout/[uid]/refresh-qr → Omise charge ใหม่ → QR ใหม่
     └─ polling ยังทำงาน (ดึง omise_charge_id ใหม่จาก DB อัตโนมัติ)
5. ห้ามมีปุ่ม "ฉันชำระเงินแล้ว" ที่ bypass Omise — ถูกลบออกแล้ว
6. /api/checkout/[uid]/claim-paid → ยังมีใน codebase แต่ verify getCharge() ก่อนเสมอ
```

| # | Change | Commit | UAT |
|---|---|---|---|
| 1 | `status/route.ts` — query Omise โดยตรงทุก poll (getCharge) · mark paid + issue tokens + clear cart + LINE notify | `f2cf10f` | ✅ redirect ≤6s |
| 2 | `status/route.ts` — fix broken LEFT JOIN query ที่ทำให้ polling crash ทุก tick | `49b4818` | ✅ |
| 3 | `status/route.ts` — เพิ่ม LINE owner notification เมื่อ polling detect paid | `f2cf10f` | ✅ ส่ง LINE แล้ว |
| 4 | `checkout/page.tsx` — ลบ claim-paid button (bypass) · 120s → QR expired + "สร้าง QR ใหม่" | `eeb31ed` | ✅ QR refresh ทำงาน |
| 5 | `claim-paid/route.ts` — lock: verify getCharge().status === 'successful' ก่อน issue token | `eeb31ed` | ✅ |
| 6 | `refresh-qr/route.ts` — NEW: สร้าง Omise charge ใหม่ เมื่อ QR เดิมหมดอายุ | `eeb31ed` | ✅ |
| 7 | TIER_1 เปลี่ยน ฿10 → ฿20 (Omise PromptPay minimum) | `prev session` | ✅ |

**UAT ผ่านทั้งหมด (owner confirm 2026-05-08):**
- mark-as-paid ใน Omise → redirect อัตโนมัติ ≤6s ✅
- รอ 120s ไม่จ่าย → QR ซีด → ปุ่มสร้าง QR ใหม่ ✅
- สร้าง QR ใหม่ → mark paid → auto-redirect ✅
- LINE notification ส่งถึง owner ✅

---

## V15 — Session 27 Changes (2026-05-08) — /affiliate separation + middleware fix

| # | Change | Commit | UAT |
|---|---|---|---|
| 1 | `app/affiliate/page.tsx` — NEW: Section 2 coupon content (brand chips, recommended stores, platform chips, daily featured, featured coupons dark grid) แยกออกจาก homepage · ไม่มี blog articles | `ca57941` | ✅ Live |
| 2 | `app/page.tsx` — rewrite: ลบ Section 2 ทั้งหมดออก · homepage = Section 1 เท่านั้น · hero CTA `/wallet` → `/affiliate` | `ca57941` | ✅ Live |
| 3 | `proxy.ts` — wired เป็น Next.js 16 middleware จริงแล้ว (proxy.ts = middleware file ใน Next.js 16; middleware.ts ไม่ใช่) · `ƒ Proxy (Middleware)` ขึ้นใน build output | `b80b31f` | ✅ Live |
| 4 | `lib/cart.ts` — เพิ่มเข้า git (เคย untracked → VPS build พัง) | `60055fd` | ✅ |
| 5 | Domain redirect (couponkum.com → /affiliate) — implement + revert เนื่องจาก mr-checklist.com ยังไม่ได้จด; logic พร้อม re-enable ทันทีเมื่อ DNS พร้อม | `b80b31f` | ⏳ รอ mr-checklist.com |

---

## V15 — Session 26 Changes (2026-05-08) — J18 Cart + Volume Pricing

| # | Change | Commit | UAT |
|---|---|---|---|
| 1 | `lib/pricing.ts` — calculateCartTotal, tierPriceForItem, currentTierLabel, itemsUntilNextTier | `a2fcf72` | ✅ 25 unit tests pass |
| 2 | `lib/pricing.test.ts` — 25 tests (totals 0-11, nextItemPrice, savedVsFullPrice, monotonic, tier helpers) | `a2fcf72` | ✅ |
| 3 | `migrations/20260508_cart_v2.sql` — carts, cart_items, orders, order_items (10 indexes) | `a2fcf72` | ✅ run บน VPS |
| 4 | `lib/cart.ts` — getCartBySession, addItemToCart, removeItemFromCart, CART_COOKIE | `c5e5239` | ⏳ |
| 5 | `app/api/cart/` — GET (full cart), GET count, POST add (verify published), DELETE remove | `c5e5239` | ⏳ |
| 6 | `src/components/cart/AddToCartButton.tsx` — client button, loading/added state | `c5e5239` | ⏳ |
| 7 | `app/cart/page.tsx` — tier bar, item list+ลบ, totals, checkout CTA | `c5e5239` | ⏳ |
| 8 | `Header.tsx` — cart icon + badge (count, re-fetch on pathname) | `c5e5239` / `b8a434c` | ⏳ |
| 9 | `app/templates/page.tsx` — AddToCartButton per paid row (row refactored div+Link) | `c5e5239` | ⏳ |
| 10 | `app/api/checkout/route.ts` — POST: create order+items, Omise charge, free-only skip | `74859b3` | ⏳ |
| 11 | `app/api/checkout/[uid]/status/route.ts` — GET poll payment status + download URLs | `74859b3` | ⏳ |
| 12 | `app/api/checkout/[uid]/claim-paid/route.ts` — POST trust-based: issue tokens, clear cart, LINE notify | `74859b3` | ⏳ |
| 13 | `app/api/download/[token]/route.ts` — extended: check order_items (cart) + template_orders (legacy) | `74859b3` | ⏳ |
| 14 | `app/checkout/page.tsx` — cart checkout flow (summary→QR→claim→done, JS download loop) | `74859b3` | ⏳ |
| 15 | `app/order/[orderUid]/page.tsx` + `OrderDownloads.tsx` — receipt page (URL as receipt) | `74859b3` | ⏳ |
| 16 | `app/admin/orders/page.tsx` — Cart Orders tab (orders+items), stats, revoke/cancel | `b8a434c` | ⏳ |
| 17 | `app/admin/orders/actions.ts` — revokeCartOrderAction, cancelCartOrderAction | `b8a434c` | ⏳ |
| 18 | `app/admin/orders/audit/page.tsx` — daily audit: paid unverified 7 วัน (template + cart) | `b8a434c` | ⏳ |
| 19 | `proxy.ts` — /api/cart + /api/checkout เพิ่มใน SKIP_REFRESH_PREFIXES | `c5e5239` / `74859b3` | ✅ |

**🔴 UAT gate:** ⏳ Pending owner smoke test — รอ push VPS + ทดสอบ J18-1..20

---

## V15 — Session 23 Changes (2026-05-07)

| # | Change | Commit | UAT |
|---|---|---|---|
| 1 | CreditBalanceCard บน /wallet — credits count + expiry + LINE reminder button | `934c4d3` | ⏳ เปิด /wallet → เห็น card สีเขียว credit count + expiry + ปุ่ม 🔔 |
| 2 | Rename label → "เครดิตเลือกเทมเพลตคงเหลือ" | `3a1ff17` | ⏳ label ถูกต้องใน credit card |
| 3 | "ใช้เครดิต · เลือกเทมเพลต" CTA button → /templates | `15a9a4f` | ⏳ กด → ไป /templates |
| 4 | /api/pack-credits/remind GET+POST + credit_reminders migration | `934c4d3` | ⏳ กดปุ่ม 🔔 → "ตั้งเตือนแล้ว" · DB credit_reminders มี row |
| 5 | Nav badge: credit count priority > coupon count | `b3e7d65` | ⏳ มี credits → badge แสดงจำนวน credit ไม่ใช่ coupon |
| 6 | 1-click credit redeem → window.location.href = downloadUrl (ข้าม credit_done) | `b68eb70` | ⏳ กด "ใช้ 1 เครดิต" → เด้งไป /d/[token] ทันที |
| 7 | "🏷️ คูปองส่วนลดในเว็บ" section header บน /wallet | `9b53996` | ⏳ header แสดงถัดจาก credit card |
| 8 | Pack checkout info step — non-login เห็น pack benefits + LINE button ก่อน | `590d0f0` | ⏳ เปิด /checkout/pack/[id] โดยไม่ login → เห็น info step + ปุ่ม login |
| 9 | auth/line route — redirectTo ใช้ NEXT_PUBLIC_SITE_URL แทน localhost | `590d0f0` | ⏳ login → callback URL = couponkum.com ไม่ใช่ localhost |
| 10 | LINE OAuth scope — ลบ email (channel ไม่ได้ approve) | `70f3557` | ⏳ login สำเร็จ ไม่ error |
| 11 | proxy.ts error loop guard — unexpected_failure → clear cookies → /auth/login | `7a9bc78` | ⏳ ถ้าเกิด auth error ไม่วนซ้ำ → ไปหน้า login |
| 12 | proxy.ts skip refresh: /api/download · /d/ · polling · webhooks | `e7e5b12` | ⏳ ดาวน์โหลด → session ยังอยู่ใน tab เดิม |
| 13 | DownloadClient — router.refresh() + ปุ่ม "🎫 ดูเครดิตที่เหลือ" (a href) | `670d180` | ⏳ กด "ดูเครดิตที่เหลือ" → /wallet เห็น credits ไม่ต้อง login |
| **J10** | **Pending** — wallet login prompt หลัง download ใน tab เดิม | — | ❌ root cause: proxy.ts return supabaseResponse ที่มี clearing cookies · fix plan: `hadSession` guard · งานแรกพรุ่งนี้ |

---

## V15 — Session 22 Changes (2026-05-07)

| Change | Status |
|---|---|
| V15-PACK-1: Pack credits system (pack_credits table, FIFO, 90d expire) | ✅ done |
| V15-PACK-1: /api/pack-orders + /api/pack-orders/[id]/status | ✅ done |
| V15-PACK-1: /api/pack-credits/balance + /api/pack-credits/redeem | ✅ done |
| V15-PACK-1: /checkout/pack/[packId] + credit banner บน /checkout/[slug] | ✅ done |
| V15-PACK-1: Pack pricing ฿20/2cr · ฿50/10cr · ฿100/25cr (Omise min ≥฿20) | ✅ done |
| V15-PAY-5: lib/omise.ts + Omise PromptPay charge + client polling 3s | ✅ done |
| V15-PAY-5: /api/webhooks/omise (HMAC-SHA256 verify + charge.complete handler) | ✅ done |
| V15-PAY-5: Cloudflare WAF bypass rule สำหรับ /api/webhooks/omise | ✅ done |
| V15-PAY-5: server-with-env.js PM2 wrapper โหลด .env.local (fix OMISE_SECRET_KEY) | ✅ done |
| J2 Fraud gap | ✅ RESOLVED — Omise webhook คือ single source of truth |
| J6 Pack credits design | ✅ RESOLVED — pack_credits table + FIFO |
| **Pending J9** | ⏳ Live Omise keys → real QR scan test |

---

## V15 — Session 21 Changes (2026-05-07)

| Change | Status |
|---|---|
| Checkout LINE gate — add_line step ก่อน order สร้าง | ✅ done |
| LINE URL แก้จาก @couponkum → full URL พร้อม gid | ✅ done |
| Admin cancel pending order | ✅ done |
| Download bug fix — /api/download/[token] stream PDF (standalone ไม่ serve /uploads/) | ✅ done |
| UPLOAD_DIR persistent dir บน VPS | ✅ done |
| Download count: ย้าย increment → API (ไม่นับตอน page load) | ✅ done |
| LINE share button หลังดาวน์โหลด | ✅ done |
| **Pending J2** | ❌ Fraud gap — ไม่จ่ายแต่ได้ไฟล์ (trust-based เท่านั้น) |
| **Pending J6** | ❌ Download quota design เมื่อมี bundle/pack credits |

---

## V15 — Session 20 Changes (2026-05-07)

| Change | Status |
|---|---|
| Hero redesign — 4-step stepper + pack cards (฿10/฿20/฿50) | ✅ done |
| Hero slogan badge "คุ้มทุกการใช้จ่าย · ง่ายทุกการวางแผน" | ✅ done |
| lib/packs.ts PACKS constant | ✅ done |
| Catalog section — badge frame + top-5 list per category | ✅ done |
| fetchCatalogGroups() — ROW_NUMBER() window fn, sort sale_count | ✅ done |
| Checkout pending-limit — error screen ⏱️ (ไม่ generic error) | ✅ done |

---

## V14→V15 Homepage Changes (2026-05-07)

| Change | Status |
|---|---|
| Hero slogan → "คุ้มทุกการใช้จ่าย · ง่ายทุกการวางแผน" | ✅ done |
| Hero search card | 🚫 hidden — search ใช้ผ่าน nav เท่านั้น |
| 10 rare items section | 🚫 hidden — แทนด้วย Featured Coupons grid |
| Featured Coupons Grid (top 8 verified) | ✅ added |
| Vertical Browse chips (Shopee/Lazada/GrabFood/LineMan/Netflix/AIS/บัตรเครดิต) | ✅ added |
| "คุ้มจริงไหม?" Calculator teaser | ✅ added |
| SEO metadata + keywords | ✅ updated coupon-focused |
| Footer + login slogan | ✅ updated |
| campaign-context normal label | ✅ updated |

**Monetization preserved (ทุกช่องทางรายได้ยังเปิด):**
- ✅ Affiliate commission ทุก network (Shopee/Lazada/IA/AT) ผ่าน sub-ID tracking เดิม
- ✅ Daily Featured Coupon (POSTLIVE-26.1 algo)
- ✅ Recommended stores DB-driven
- ✅ Brand chips → search → /go/[id] → outbound click
- ✅ Wallet → coupon → /go/[id] → conversion
- ➕ ใหม่: Featured Coupons grid (each card → /coupon/[platform] → /go/[id])
- ➕ ใหม่: Vertical Browse chips → /search?q= or /coupon/[platform]
- ➕ Calculator teaser → /search?q=คำนวณคุ้มสุด (placeholder จนกว่า KUMCALC-1 ทำเสร็จ)

---

## Platform Blockers (⏳ รอภายนอก)

| Blocker | สถานะ |
|---|---|
| Lazada products | ✅ ใช้ LiteApp Affiliate API (adsense.lazada.co.th) — active cron `0 */8 * * *` · 34 products · volume จำกัดตาม feed API (ไม่เกี่ยวกับ Open API / approval) |
| Involve Asia properties | ✅ **APPROVED 2026-05-02** — Affiliate ID 1082367 · Approved: Tech/Home/Beauty |
| AT Datafeed API | ❌ **CLOSED 2026-05-14** — ไม่เกี่ยวกับ Template system · affiliate tasks closed |
| IndexNow Key | ❌ **CLOSED 2026-05-14** — ไม่เกี่ยวกับ Template system |
| UptimeRobot Dashboard | ⏳ Owner setup remains |
| FB Graph API posting | ⏳ ตั้ง `FB_DISABLE_GRAPH_API_POSTING=false` เมื่อพร้อม |
| **Shopee Affiliate Open API** | ❌ **CLOSED 2026-05-14** — ไม่เกี่ยวกับ Template system · affiliate tasks closed |

---

## Session Workflow

```text
1. Read core/Coupon_TP.MD (อ่านก่อน — active tasks + UAT checklist)
2. Read PRD.md (ไฟล์นี้ — snapshot + blockers + session log)
3. Reference core/Couponkum_Project_Driven_V13.md เฉพาะเมื่อต้องการ (legacy roadmap / V13 archive)
4. Pick one task from core/Coupon_TP.MD Section 7 (V15 sprint W1-W4)
5. Make smallest complete patch
6. Run CI: npx tsc --noEmit && npm run lint && npm run test
7. Commit → Push origin develop → Deploy VPS
8. UAT — Claude รัน smoke test (curl/API) + แสดง UAT checklist ให้ owner verify ใน browser
9. รอ owner confirm ผ่าน UAT ก่อน
10. Update PRD.md + core/Coupon_TP.MD → Report done + next task
```

## UAT Protocol (ทุก task)

| Step | ผู้ทำ | Action |
|---|---|---|
| Smoke test | Claude | curl endpoint ที่เกี่ยวข้อง — ต้องได้ HTTP 200 / response ถูกต้อง |
| UAT checklist | Claude | แสดงรายการสิ่งที่ owner ต้องตรวจใน browser |
| Browser verify | Owner | เปิด URL จริง ตรวจตาม checklist |
| Confirm | Owner | พิมพ์ "ผ่าน" หรือแจ้ง issue |
| Close task | Claude | อัพเดต docs + report done ก็ต่อเมื่อ owner confirm แล้วเท่านั้น |

**กรณีพิเศษ — backend-only task (ไม่มีหน้า browser ให้ตรวจ):**
Claude รัน curl โดยตรงแล้วแสดง JSON response ให้ owner เห็น → owner confirm จาก output นั้น — ห้าม skip UAT ทุกกรณี

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

---

## Facebook Production Safety (All Done ✅)

| Task | Status |
|---|---|
| `FB-SECRET-ROTATE` | ✅ App Secret rotated 2026-04-23 |
| `FB-PROD-KILL-SWITCH` | ✅ Admin toggles + `control_blocked` logs |
| `FB-REPLY-IDEMPOTENCY` | ✅ `facebook_comment_receipts` idempotency |
| `FB-DEAL-FRESHNESS-GUARD` | ✅ Stale deal blocks FB publish |
| `FB-TOS-SIGNOFF` | ✅ Meta ToS checklist signed; 90-day review |
| `S2-1-PROD` | ✅ Meta webhook registered 2026-04-29 |

---

## AI Phase 6 Gate (Dormant — รอ baseline)

| Task | ชื่อ | Gate |
|---|---|---|
| 6.1 | AI Revenue-Driven Weighting | click baseline ≥ 1,000 |
| 6.2 | AI Caption Generator v2 | — |
| 6.3 | 3-Point Matching Engine | — |
| 6.4 | Content Machine Scaling | — |
| 6.5 | Database Lean Management | — |

---

**Session 8 (2026-05-05) — 5 tasks completed:**
- `ADMIN-KPI-1` ✅ 8 KPI cards on /admin (revenue_today, clicks, conversion_rate, postback_fail_rate, broken_links, pageviews, top_sub_id, top_deal)
- `SHIP-MIGRATE-1` ✅ shipping_fee column live on VPS
- `destinationLabel fix` ✅ /go/[id] button text from URL hostname (Sephora Thailand etc.)
- `AT merchant entries` ✅ 11 AccessTrade merchant store entries added to DB
- `EMAIL update` ✅ partner@couponkum.com on disclosure + privacy pages

**Session 9 (2026-05-05) — AFFNET-IA-API active:**
- `AFFNET-IA-API` ✅ IA REST API fully activated — POST /authenticate (key=general + secret) → 2h token → /offers/all; cron 0 */6 * * * live on VPS; total_offers=0 pending IA campaign approvals
_Historical session log + completed task archive → `core/Couponkum_Blueprint.md` Part F_
