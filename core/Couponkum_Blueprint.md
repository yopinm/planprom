# Couponkum Blueprint — เอกสารอ้างอิงสมบูรณ์

> **บทบาท:** Reference document — อ่านเมื่อต้องการ ไม่ใช่อ่านทุก session
> **Read order (ทุก session):** `PRD.md` → `core/Couponkum_Project_Driven_V13.md` → **Blueprint นี้ถ้าต้องการรายละเอียด**
> **อัปเดตล่าสุด:** 2026-05-06 Session 15 — เพิ่ม A9 Coupon Engine Reference (schema · tier · stack rules · combo solver · cron · admin)

---

## สารบัญ (Quick Navigation)

| Part                                                          | เนื้อหา                                                     |
| ------------------------------------------------------------- | ----------------------------------------------------------- |
| [A — System Reference](#part-a--system-reference)             | Architecture · Engines · DB · SEO · Env · Security          |
| [A9 — Coupon Engine Reference](#a9-coupon-engine-reference)   | Schema · Tier · Stack Rules · Combo Solver · Cron · Admin   |
| [B — Infra & Deployment](#part-b--infra--deployment)          | VPS · Cloudflare · Deploy · PM2 · Nginx                     |
| [C — Revenue & Affiliate](#part-c--revenue--affiliate)        | Attribution · Network Status · Compliance · Reconciliation  |
| [D — Admin Operations](#part-d--admin-operations)             | Admin Pages · Daily/Weekly/Monthly Routine · Alert Playbook |
| [E — Strategic Roadmap](#part-e--strategic-roadmap)           | Month 1–12 · KPI · Risk · Year 2 Drop Shopping              |
| [F — Completed Task Archive](#part-f--completed-task-archive) | Session History · Launch Gates · Task Registry              |

---

## PART A — System Reference

### A1. สถาปัตยกรรมระบบ (System Architecture)

Couponkum คือ **coupon-first affiliate product engine** เน้น **ราคาสุทธิที่จ่ายจริง** โดยคำนวณจาก Coupon Stacking แล้วให้ผู้ใช้กดไปซื้อผ่าน affiliate link พร้อม sub_id tracking

**เป้าหมาย:** Net Price Calculation → Affiliate Click → S2S Postback → Revenue Attribution

```
User
→ Cloudflare (DNS / CDN / WAF / SSL)
→ Ruk-Com AlmaLinux VPS
    Nginx (reverse proxy) → Next.js (PM2)
         ↓                      ↓
  Supabase Auth           PostgreSQL (self-hosted)
  (Google + LINE)         (ข้อมูลทั้งหมด)
  Free ≤50k users
```

| ชั้น                  | บทบาท                              | ต้นทุน         |
| --------------------- | ---------------------------------- | -------------- |
| Cloudflare            | DNS / CDN / WAF / SSL              | Free           |
| Supabase              | Auth เท่านั้น (Google + LINE)      | Free           |
| Ruk-Com AlmaLinux VPS | Next.js + Nginx + PM2 + PostgreSQL | ~800 บาท/เดือน |

**Environment Flow:** `LOCAL dev → PRODUCTION (Ruk-Com AlmaLinux VPS · couponkum.com)`

#### Core Runtime Layers (ลำดับการประมวลผล)

1. Intent Parser
2. Eligibility Filter (Rules Engine)
3. Combination Solver
4. Net Price Calculator
5. Ranking Engine
6. Deal Score (AI Scoring — Phase 6 dormant)
7. Explanation Engine
8. UI Output — "ประหยัดไปกี่บาท"

---

### A2. Core Engine Blueprints

#### Net Price Calculator

คำนวณส่วนลดตามลำดับ Tier:

| Tier | คูปองประเภท                        |
| ---- | ---------------------------------- |
| 1    | Platform Voucher (Shopee / Lazada) |
| 2    | Shop Voucher (ร้านค้าเฉพาะ)        |
| 3    | Bank / Payment Promotion           |
| 4    | Shipping Discount                  |

ไฟล์หลัก: `src/features/engine/combination-solver.ts` · `eligibility-filter.ts` · `search-pipeline.ts`

Flow:

1. Parse intent → budget / category / platform / query / URL
2. Filter coupons → active, not expired, min spend, segment, category
3. Generate combinations — at most one coupon per tier
4. Validate against `coupon_stack_rules`
5. Apply tier order → return `payNow`, `effectiveNet`, `usedCombination`, `bankSaving`

#### หน้าพัก Intermediate Page `/go/[id]`

- แสดงราคาสุทธิ + coupon code (ซ่อนอยู่ — tap to reveal → auto-copy + analytics `coupon_reveal`)
- Countdown 3s (มีคูปอง) / 1s (ไม่มี) → redirect `/api/r`
- Sub ID Tracking ฝังใน outgoing affiliate URL ทุก request

#### Engine Groups

| Engine                            | ไฟล์/หมายเหตุ                                                                                                                           |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Core Product                      | Intent Parser · Eligibility Filter · Combination Solver · Net Price Calculator · Ranking Engine                                         |
| AI / Decision (Phase 6 — Dormant) | AI Deal Score · Buy or Wait · Top Rare Item · Campaign Mode · Fake Discount Detection                                                   |
| Affiliate & Tracking              | `/api/r` · Click Tracking · Sub ID Attribution · S2S Tracking · Retry `src/lib/api-retry.ts` (max 2 retries, 500ms exponential backoff) |
| Social / Facebook                 | Post Score Engine · Caption Engine · Meta ToS Guard · Auto-Post · Anti-Spam                                                             |
| Alert & Notification              | Alert System (price / coupon expiry)                                                                                                    |
| Data / Pipeline                   | Lazada/Shopee Pipeline · Price Sync · Caching · Data Archiving                                                                          |
| SEO & Content                     | `src/lib/pseo-generator.ts` (49 pSEO pages) · Internal Linking · UGC Engine                                                             |

---

### A3. Database Reference

#### Core Tables

| Table                        | บทบาท                                                                                                                               |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `products`                   | product catalog, price, shop metadata, affiliate URLs                                                                               |
| `coupons`                    | tier, discount type, min spend, max discount, category/segment rules                                                                |
| `coupon_stack_rules`         | allowed stack order, tiers, max stack                                                                                               |
| `bank_promotions`            | payment/bank promotion rules                                                                                                        |
| `click_logs`                 | click / sub_id / source tracking                                                                                                    |
| `search_logs`                | query and response tracking                                                                                                         |
| `revenue_tracking`           | affiliate postback conversion/cancellation/return · `payout_status` (pending→settled→reversed) · `converted_at` · `latency_seconds` |
| `analytics_events`           | page and funnel events                                                                                                              |
| `facebook_posts`             | Facebook post queue                                                                                                                 |
| `facebook_post_logs`         | Facebook queue/publish history                                                                                                      |
| `facebook_post_queue`        | auto-post queue (status: pending/posted/failed)                                                                                     |
| `facebook_settings`          | posting limits, slots, blacklist, disclosure, ToS review                                                                            |
| `facebook_comment_receipts`  | comment idempotency                                                                                                                 |
| `price_history`              | price trend (Top Hit เท่านั้น, วันละ 1-2 ครั้ง)                                                                                     |
| `product_views`              | scarcity/view signals                                                                                                               |
| `product_tips`               | UGC tips                                                                                                                            |
| `admin_control_flags`        | feature flags registry                                                                                                              |
| `admin_alert_rules`          | postback/link/conversion thresholds                                                                                                 |
| `user_profiles`              | LINE/email opt-in, owned media consent                                                                                              |
| `line_subscribers`           | LINE OA subscribers + guest_id mapping                                                                                              |
| `daily_featured_coupons`     | auto-curated featured coupon per day                                                                                                |
| `coupon_wallet`              | user saved coupons                                                                                                                  |
| `fb_manual_posts`            | FB manual post tracking                                                                                                             |
| `outreach_groups`            | Community outreach group database                                                                                                   |
| `outreach_posts`             | Community post history                                                                                                              |
| `fb_group_posts`             | VIP Group post history                                                                                                              |
| `fb_group_caption_templates` | 14 seed templates × 7 pillars                                                                                                       |
| `influencer_subids`          | B2B influencer unique sub_id tracking                                                                                               |
| `uptime_events`              | UptimeRobot alert history                                                                                                           |

#### Views

- `v_revenue_attribution` / `v_revenue_attribution_detail`
- `v_funnel_metrics` / `v_funnel_path` / `v_funnel_by_subid` / `v_funnel_flow`

#### Database Design Rules

- `price_history`: เก็บ Top Hit เท่านั้น — ไม่เก็บทุก search (DB บวม)
- Table Partitioning: `price_history` แบ่งตามเดือน → DROP PARTITION ง่าย
- Downsampling: เก็บ Daily Average แทนทุก record
- Cold Storage: ย้าย > 6 เดือน → JSON บน Supabase Storage
- Supabase คงไว้สำหรับ Auth/session เท่านั้น — business data ย้ายมา PostgreSQL แล้ว (Phase 4 ✅)

#### Data Retention Policy (POSTLIVE-06 ✅ VPS cron active)

| Table                       | Retention            | Cron                 |
| --------------------------- | -------------------- | -------------------- |
| `click_logs`                | 180 วัน              | Weekly Sun 02:00 ICT |
| `analytics_events`          | 90 วัน               | Weekly               |
| `search_logs`               | 90 วัน               | Weekly               |
| `product_views`             | 14 วัน               | Weekly               |
| `price_history`             | 180 วัน → cold       | Weekly               |
| `facebook_post_queue`       | 30 วัน (done/failed) | Weekly               |
| `facebook_post_logs`        | 90 วัน               | Weekly               |
| `facebook_comment_receipts` | 90 วัน               | Weekly               |
| `alert_logs`                | 90 วัน               | Weekly               |

Manual trigger: `curl 'https://couponkum.com/api/cron/data-archive?secret=<CRON_SECRET>'`

---

### A4. SEO & Content Structure

#### Routes

| Path                             | ประเภท                                    |
| -------------------------------- | ----------------------------------------- |
| `/`                              | Homepage                                  |
| `/search`                        | Search Results                            |
| `/product/[slug]`                | Product Detail                            |
| `/coupon/[platform]`             | Platform Coupon (16 sub-pages)            |
| `/deals/[platform]/[category]`   | Category Deals (10 combinations)          |
| `/deals/payday`                  | Payday Campaign                           |
| `/compare/[a]-vs-[b]/[category]` | Comparison (10 compare pages)             |
| `/blog`, `/blog/[slug]`          | Blog                                      |
| `/wallet`                        | Public Wallet (WALLET-PUB-1 ✅)           |
| `/deals/campaign-prep`           | Pre-Campaign Cookie Drop (POSTLIVE-31 ✅) |
| `/go/[id]`                       | Intermediate (noindex)                    |

**Total pSEO pages: 49** (16 coupon + 10 compare category + base pages)

#### SEO Schema Status

| Route                | Metadata | JSON-LD                       |
| -------------------- | -------- | ----------------------------- |
| `/`                  | ✅       | WebSite + SearchAction        |
| `/search`            | ✅       | BreadcrumbList                |
| `/product/[slug]`    | Dynamic  | Product + Offer + Breadcrumb  |
| `/blog`              | ✅       | Blog + ItemList + BlogPosting |
| `/coupon/[platform]` | Dynamic  | Breadcrumb + FAQ              |
| `/deals/...`         | Dynamic  | Breadcrumb + FAQ              |
| `/go/[id]`           | noindex  | —                             |

#### SEO Files

- `src/lib/seo-keywords.ts` — KEYWORD_CLUSTERS + PRODUCT_CATEGORIES (10 categories)
- `src/lib/seo-routes.ts`
- `src/lib/pseo-generator.ts` — CATEGORY_SLUG_MAP + parsePaydaySlug + 3 generators
- `src/lib/json-ld.ts`

#### IndexNow & GSC

- IndexNow cron: ทุกวัน 00:30 UTC — `GET /api/cron/indexnow?secret=`
- IndexNow key-file: `app/[keyfile]/route.ts` (domain ownership proof)
- **Owner pending:** ตั้ง `INDEXNOW_KEY=` ใน VPS `.env.local` → verify `https://couponkum.com/{key}.txt`
- Google Search Console: submitted 82 pages ✅ (2026-05-04)

---

### A7. Homepage Sections Reference

> อัพเดต 2026-05-06 — audit จากการตรวจ Live site

| # | Section | เงื่อนไขโชว์ | Data Source | สถานะ |
|---|---|---|---|---|
| 1 | Hero + Search + SocialProof | always | static | ✅ |
| 2 | 🔥 กำลังฮิตตอนนี้ | always (fallback QUICK_SEARCHES) | `click_logs` 7d | ✅ |
| 3 | 🔍 คนกำลังค้นหา | `search_logs.length > 0` | `search_logs` 7d | ⚠️ conditional |
| 4 | Trust signals | always | static | ✅ |
| 5 | 🏪 ร้านค้าแนะนำ | `recommended_stores.length > 0` | `recommended_stores` DB | ✅ (14 stores) |
| 6 | 🏪 แบรนด์ที่มีดีล | `popularBrands.length > 0` | `products.shop_name` COUNT≥2 | ⚠️ shop_type=null ใช้ fallback |
| 7 | คูปองคุ้มวันนี้ (DailyFeaturedCard) | `dailyFeatured !== null` | `coupons` table | ❌ รอคูปองจริง |
| 8 | 10 สินค้าหายากวันนี้ | `rareItems.length > 0` | `rare_item_scores` + `products` | ✅ (34 products scored) |
| 9 | ดีลแนะนำวันนี้ (fallback) | `rareItems=0 AND topDeals>0` | search pipeline | ซ่อนเมื่อ rare items มี |
| 10 | ดีลน่าสนใจ/SEO cards | always | blog MDX + KEYWORD_CLUSTERS (static) | ✅ |
| 11 | ทำไมต้องคูปองคุ้ม | always | static | ✅ |
| 12 | CTA section | always | static | ✅ |
| 13 | RareCouponPopup (8s delay) | `dailyFeatured !== null` | `coupons` table | ❌ รอคูปองจริง |

**Cron refresh schedule:**
- `deal-score` → ทุก **15 นาที** — คำนวณ deal_score ต่อสินค้า
- `rare-item-score` → ทุก **30 นาที** (delay 2 min หลัง deal-score) — คำนวณ rare/final score + badge
- `daily-featured` → **17:00 UTC ทุกวัน** — เลือก daily featured coupon

**Price limits (app/page.tsx, app/api/search/route.ts, app/search/page.tsx):**
- `rare item feed`: `price_current BETWEEN 1 AND 30000`
- `search results`: `price_current <= 100000`
- `rare-item-engine MAX_PRICE_THB`: 30,000

---

### A8. Homepage Engine Reference

> อัพเดต 2026-05-06 — เอกสารสำหรับค้นหา + แก้ไข engine บนหน้า Home เร็วขึ้น

#### Quick Reference

| # | Engine | การทำงาน / Schedule | Code Path หลัก | DB Table |
|---|---|---|---|---|
| 1 | 🏆 Top 10 สินค้าหายาก | คัดสินค้าที่ดีสุดจากทั้งหมด ให้คะแนน rare_score + deal_score + trend_score แล้วเรียง Top 10 · อัพเดตอัตโนมัติ **ทุก 30 นาที** | `rare-item-engine.ts → scoreRareItemBatch()` | `rare_item_scores` |
| 2 | 📊 Deal Score | คำนวณคะแนนความคุ้มของแต่ละสินค้า (ส่วนลด + rating + ยอดขาย) เพื่อป้อนให้ Engine 1 · อัพเดต **ทุก 15 นาที** | `deal-score.ts → calculateAIDealScore()` | `rare_item_scores` |
| 3 | 🎟️ คูปองคุ้มวันนี้ | เลือกคูปองที่ดีที่สุดวันละ 1 ตัว จาก DB (เรียงตาม commission + freshness) · รีเซ็ต **ทุกวัน 00:00 ICT** | `daily-featured-coupon.ts → getDailyFeaturedCoupon()` | `coupons` |
| 4 | 💚 Social Proof Strip | แสดงยอดรวมที่ทุกคนประหยัดได้ผ่านเว็บ (คำนวณจาก click_logs) · cache ไว้ **1 ชั่วโมง** ต่อ request | `social-proof.ts → getSocialProofData()` | `click_logs` |
| 5 | 📅 Campaign Context | ตรวจวันที่ปัจจุบันเทียบปฏิทินพิเศษ (11.11, Payday, ต้นเดือน) เพื่อเปลี่ยน banner + badge อัตโนมัติ · ทำงาน **ทุก request แบบ real-time** | `campaign-context.ts → getCampaignContext()` | — (ปฏิทินใน code) |
| 6 | 🔥 Trending & Popular Search | ดึง keyword ที่คนค้นหา/กดมากที่สุดใน 7 วันล่าสุด แสดงเป็น chip · ทำงาน **ทุก request แบบ real-time** | `page.tsx → fetchTrendingClicks()` / `fetchPopularSearches()` | `click_logs`, `search_logs` |
| 7 | 🏪 แบรนด์ที่มีดีล | ดึงชื่อแบรนด์/ร้านที่มีสินค้าใน DB มากสุด · ทำงาน **ทุก request แบบ real-time** | `page.tsx → fetchPopularBrands()` | `products` |
| 8 | 🛍️ ร้านค้าแนะนำ | แสดงร้านค้าที่ admin เพิ่มไว้ใน `/admin/recommended-stores` · ทำงาน **ทุก request แบบ real-time** | `page.tsx → fetchRecommendedStores()` | `recommended_stores` |
| 9 | 📝 SEO Content Cards | แสดงบทความ blog + keyword cluster ที่เกี่ยวข้อง · เนื้อหา **คงที่** เปลี่ยนได้เฉพาะเมื่อ deploy ใหม่หรือเพิ่ม blog post | `blog.ts → getAllPosts()` + `seo-keywords.ts` | — (ไฟล์ MDX) |
| 10A | 🛒 Lazada Feed (API) | ดึงสินค้าจาก Lazada Affiliate API ครั้งละ 250 รายการ upsert เข้า DB · รัน **ทุก 8 ชั่วโมง** | `lazada-import/route.ts` + `normalizer.ts → feedToProduct()` | `products` |
| 10B | 📂 Lazada Conversion (XLSX) | parse ไฟล์ Excel รายการ conversion จริงที่ดาวน์โหลดมาเอง upsert สินค้าที่มีคนซื้อจริงเข้า DB · รัน **manual** หลังดาวน์โหลดไฟล์ใหม่ | `lazada-conversion-import/route.ts` + `lazada-conversion-xlsx.ts` | `products` |

---

#### Engine 1: Top 10 Rare Items

| | |
|---|---|
| **ทำงานอย่างไร** | คำนวณ `final_score` ต่อสินค้า = deal_score×0.35 + rare_score×0.40 + trend_score×0.25 แล้วเรียงจากมากไปน้อย แสดง Top 10 ที่ผ่าน trust filter + price ≤ 30,000 บาท |
| **Adaptive Calibration** | thresholds auto-lower ตาม pool distribution (top 10% = 'rare', top 35% = 'low_stock') ป้องกัน feed ว่าง |
| **Trust Filter** | rating ≥ 4.5 AND sold_count ≥ 10 AND !suspiciousDiscount (null rating ผ่านถ้า sold_count ≥ 50) |
| **Badges** | `rare` (หายาก) · `ready_to_ship` (พร้อมส่ง) · `low_stock` (เหลือน้อย) |
| **Refresh** | cron ทุก 30 นาที (deal-score → +2 min → rare-item-score) |
| **Data source** | `rare_item_scores` JOIN `products` WHERE `final_score ≥ 30 AND is_active = true AND price BETWEEN 1–30,000` |
| **Homepage function** | `app/page.tsx` → `getRareHomepageItems(10)` |
| **Engine core** | `src/features/engine/rare-item-engine.ts` → `scoreRareItemBatch()` · `calculateRareItemScore()` · `assignRareBadge()` |
| **Score helpers** | `discountToScore()` · `ratingToScore()` · `soldToTrendScore()` |
| **Cron route** | `app/api/cron/rare-item-score/route.ts` (ทุก 30 นาที — VPS crontab `*/30 * * * * sleep 120`) |
| **DB table** | `rare_item_scores (product_id, rare_score, deal_score, trend_score, final_score, badge, last_calculated_at)` |

---

#### Engine 2: Deal Score (ป้อน Engine 1)

| | |
|---|---|
| **ทำงานอย่างไร** | คำนวณ `deal_score` 0–100 ต่อสินค้า จาก discount % + rating + sold velocity; เก็บใน `rare_item_scores.deal_score` เพื่อให้ Engine 1 ใช้ต่อ |
| **Reliability Score** | แยก reliable vs stale จาก `price_checked_at` — stale > 48h แสดง visual ต่างออกไป |
| **Label mapping** | score ≥ 80 = "ดีลเด็ด" · ≥ 60 = "คุ้มดี" · < 60 = "ดีลทั่วไป" |
| **Refresh** | cron ทุก 15 นาที |
| **Homepage function** | `app/page.tsx` → `fetchTopDeals(3)` (fallback เมื่อ rareItems = 0) |
| **Engine core** | `src/features/engine/deal-score.ts` → `calculateAIDealScore()` · `passesMerchantTrustFilter()` · `calculateReliabilityScore()` |
| **Cron route** | `app/api/cron/deal-score/route.ts` (ทุก 15 นาที — VPS crontab `*/15 * * * *`) |
| **Pipeline** | `src/features/engine/search-pipeline.ts` → `runSearchPipeline()` · `shapeResult()` |

---

#### Engine 3: Daily Featured Coupon (คูปองคุ้มวันนี้)

| | |
|---|---|
| **ทำงานอย่างไร** | เลือกคูปอง 1 ตัวต่อวัน จาก `coupons` table โดย score = commission×0.35 + CTR×0.30 + freshness×0.25 + diversity×0.10; CTR weight เปิดอัตโนมัติเมื่อ click_logs ≥ 1,000 rows (ตอนนี้ active mode: v2_noctr) |
| **โชว์เมื่อ** | `dailyFeatured !== null` — ถ้า coupons table ว่าง = ไม่โชว์ |
| **Popup** | `RareCouponPopup` โชว์หลัง 8 วินาที (exit-intent) ครั้งเดียวต่อวัน (localStorage gate) |
| **Refresh** | cron ทุกวัน 17:00 UTC (00:00 ICT) |
| **Homepage function** | `app/page.tsx` → `getDailyFeaturedCoupon()` |
| **Lib** | `src/lib/daily-featured-coupon.ts` → `getDailyFeaturedCoupon()` |
| **Cron route** | `app/api/cron/daily-featured/route.ts` (ทุกวัน 17:00 UTC — VPS crontab `0 17 * * *`) |
| **Component** | `src/components/home/DailyFeaturedCard.tsx` · `src/components/home/RareCouponPopup.tsx` |
| **DB table** | `coupons (code, platform, tier, discount_value, type, min_spend, verified_at, success_rate, expire_at)` |

---

#### Engine 4: Social Proof Strip

| | |
|---|---|
| **ทำงานอย่างไร** | รวมยอดประหยัดโดยประมาณจาก `click_logs` (avg_discount × boost factor); cache 1 ชั่วโมง; ซ่อนอัตโนมัติเมื่อ estimatedSavings = 0 |
| **Campaign Badge** | แสดง badge พิเศษเมื่อวันพิเศษ (11.11, payday, ต้นเดือน) จาก `getCampaignContext()` |
| **โชว์เมื่อ** | `estimatedSavings > 0` |
| **Component** | `src/components/home/SocialProofStrip.tsx` |
| **Lib** | `src/lib/social-proof.ts` → `getSocialProofData()` (cached 1h ด้วย `unstable_cache`) |
| **DB table** | `click_logs (avg_discount, clicked_at)` |

---

#### Engine 5: Campaign Context

| | |
|---|---|
| **ทำงานอย่างไร** | ตรวจวันที่ปัจจุบัน เทียบกับ calendar events — คืน `type` + `label` สำหรับ UI ปรับ headline + badge อัตโนมัติ |
| **Campaign types** | `double_date` (11.11, 12.12) · `payday` (วันที่ 25) · `month_start` (1–3) · `peak_traffic` · `normal` |
| **Affects** | Trust signal header label + SocialProofStrip badge + DailyFeaturedCard context |
| **Lib** | `src/lib/campaign-context.ts` → `getCampaignContext(date)` |

---

#### Engine 6: Trending Clicks + Popular Searches

| | |
|---|---|
| **ทำงานอย่างไร** | ดึง query ที่มีคนกด/ค้นหา มากสุดใน 7 วันล่าสุด แสดงเป็น chip links |
| **🔥 กำลังฮิตตอนนี้** | จาก `click_logs.query` 7d; fallback = `QUICK_SEARCHES` constant เมื่อ < 3 results |
| **🔍 คนกำลังค้นหา** | จาก `search_logs.query` 7d (flagged_bot = false, length 2–50); ซ่อนเมื่อ 0 results |
| **Homepage functions** | `app/page.tsx` → `fetchTrendingClicks(8)` · `fetchPopularSearches(10)` |
| **DB tables** | `click_logs (query, clicked_at)` · `search_logs (query, searched_at, flagged_bot)` |

---

#### Engine 7: Popular Brands

| | |
|---|---|
| **ทำงานอย่างไร** | เลือก shop_name จาก active products เรียงตาม COUNT; Primary: official/mall shop_type; Fallback: ร้านที่มี ≥ 2 products |
| **Homepage function** | `app/page.tsx` → `fetchPopularBrands(20)` |
| **DB table** | `products (shop_name, shop_type, is_active)` |
| **หมายเหตุ** | ตอนนี้ shop_type = null ทุก product → ใช้ fallback COUNT≥2 |

---

#### Engine 8: Recommended Stores

| | |
|---|---|
| **ทำงานอย่างไร** | แสดงร้านค้าที่ admin เพิ่มเอง เรียงตาม sort_order |
| **Admin manage** | `/admin/recommended-stores` → CRUD |
| **Homepage function** | `app/page.tsx` → `fetchRecommendedStores()` |
| **DB table** | `recommended_stores (name, url, logo_url, description, sort_order, is_active)` |

---

#### Engine 9: SEO Content Cards

| | |
|---|---|
| **ทำงานอย่างไร** | รวม blog posts + KEYWORD_CLUSTERS tier ≤ 2 แสดง ≤ 3 การ์ด; static — ไม่เปลี่ยนอัตโนมัติ |
| **เปลี่ยนเนื้อหา** | เพิ่ม blog post ใหม่ที่ `/content/blog/*.mdx` หรือแก้ `KEYWORD_CLUSTERS` ใน code |
| **Homepage function** | `app/page.tsx` → `getSeoHomepageItems(3)` → `normalizeSeoBlogPost()` + `normalizeSeoCluster()` |
| **Sources** | `src/lib/blog.ts` → `getAllPosts()` · `src/lib/seo-keywords.ts` → `KEYWORD_CLUSTERS` |

---

#### Engine 10: Lazada Product Data Feed

> ระบบที่ป้อนข้อมูลสินค้าเข้า `products` table เพื่อให้ Engine 1–2 ใช้ต่อ

**10A — Lazada Feed Auto-Import (API)**

| | |
|---|---|
| **API** | LiteApp Affiliate API `adsense.lazada.co.th` → `/marketing/product/feed` |
| **ทำงานอย่างไร** | ดึง feed สินค้า 5 หน้า × 50 = **250 products/run**; upsert เข้า `products` table; ข้าม URL ที่ไม่ปลอดภัย (SSRF guard) |
| **sold_count logic** | `max(sales7d × 30, 50)` — แปลง 7-day velocity เป็น monthly estimate; floor 50 ให้ผ่าน trust filter |
| **shop_type** | null (feed API ไม่ส่ง) → ใช้ fallback COUNT≥2 บน brand chips |
| **image** | `pictures[0]` จาก feed response |
| **affiliate URL** | `trackingLink` field จาก feed |
| **Refresh** | ทุก 8 ชั่วโมง |
| **Cron route** | `app/api/cron/lazada-import/route.ts` (VPS crontab `0 */8 * * *`) |
| **Normalizer** | `src/services/lazada/normalizer.ts` → `feedToProduct()` |
| **Adapter** | `src/services/lazada/index.ts` → `lazadaAdapter.search()` |
| **API client** | `src/services/lazada/api.ts` → `lazadaGet()` |
| **Config** | `LAZADA_APP_KEY` + `LAZADA_APP_SECRET` + `LAZADA_USER_TOKEN` ใน VPS `.env.local` |

**10B — Lazada Conversion Import (XLSX)**

| | |
|---|---|
| **Source** | `/core/LAZADA-ConversionReport-*.xlsx` (download จาก adsense.lazada.co.th → Reports) |
| **ทำงานอย่างไร** | parse ไฟล์ XLSX ทุกไฟล์ใน `/core/`; group by productId; upsert เข้า `products`; สินค้าจาก conversion มี sold_count สูง → ผ่าน trust filter ได้ง่ายกว่า |
| **sold_count logic** | `max(conversionCount × 20, 100)` — ยืนยันว่ามีคนซื้อจริง |
| **image** | scrape `og:image` meta tag จาก product page HTML (fallback เพราะ `/products/get` Seller Center API ไม่รองรับ affiliate account) |
| **Price filter** | ข้ามสินค้าที่ `avgOrderAmount > 100,000` บาท |
| **ON CONFLICT** | `sold_count = GREATEST(existing, new)` — ป้องกัน conversion product score ถูก overwrite ด้วย feed score ต่ำ |
| **Trigger** | manual หรือ cron (ไม่มี schedule อัตโนมัติ — รัน manual หลังดาวน์โหลด xlsx ใหม่) |
| **Cron route** | `app/api/cron/lazada-conversion-import/route.ts` |
| **XLSX parser** | `src/lib/lazada-conversion-xlsx.ts` → `parseConversionReports()` |

**Data Flow สรุป:**

```
Lazada Feed API (ทุก 8h)          ──┐
Lazada Conversion XLSX (manual)    ──┤→ products table
Involve Asia API (ทุก 6h)          ──┘
                                       ↓
                               deal-score cron (ทุก 15 นาที)
                                       ↓
                           rare-item-score cron (ทุก 30 นาที)
                                       ↓
                            rare_item_scores table
                                       ↓
                           Homepage: Top 10 Rare Items
```

---

### A9. Coupon Engine Reference

> อัพเดต 2026-05-06 — เอกสารระบบคูปองสมบูรณ์สำหรับอ้างอิงเมื่อต้องการแก้ไข/เพิ่ม coupon logic

#### A9.1 Overview — Coupon System Architecture

```
coupons table (master)
       ↓
getCouponsByTier()          ← Public /wallet page (ดึงทีละ tier)
       ↓
filterEligibleCoupons()     ← กรอง min_spend / segment / category / expiry
       ↓
solveBestCombination()      ← Combination Solver (ดู A9.4)
       ↓
payNow / effectiveNet       ← แสดงผลให้ user

coupon_votes table          ← crowdsourced validation (up/down)
daily_featured_coupons      ← cron เลือก 1 ตัว/วัน (ดู A9.5)
coupon_wallet table         ← user saved coupons (personal wallet)
```

---

#### A9.2 Schema — coupons table

| Field | Type | หมายเหตุ |
|---|---|---|
| `id` | UUID PK | uuid_generate_v4() |
| `code` | TEXT nullable | promo code (null = collect-in-app ไม่มี code) |
| `title` | TEXT | ชื่อคูปองที่แสดงใน UI |
| `description` | TEXT nullable | รายละเอียดเพิ่มเติม |
| `platform` | TEXT | `'shopee'` · `'lazada'` · `'all'` |
| `tier` | INTEGER | 1–4 (CHECK constraint); ดู A9.3 |
| `type` | TEXT | `'fixed'` · `'percent'` · `'shipping'` · `'cashback'` |
| `discount_value` | NUMERIC(12,2) | ค่าส่วนลด (% หรือ ฿) |
| `max_discount` | NUMERIC(12,2) nullable | เพดานส่วนลดสำหรับ percent type |
| `min_spend` | NUMERIC(12,2) | ยอดขั้นต่ำ (default 0) |
| `applicable_categories` | TEXT[] | `{}` = ทุกหมวด |
| `can_stack` | BOOLEAN | stack กับ tier อื่นได้ (default true) |
| `user_segment` | TEXT | `'all'` · `'new_user'` · `'member'` · `'premium'` |
| `expire_at` | TIMESTAMPTZ nullable | null = ไม่มีวันหมดอายุ |
| `is_active` | BOOLEAN | soft delete (default true) |
| `source` | TEXT nullable | แหล่งที่มา (`'manual'` · `'lazada_api'` · `'shopee_affiliate'` ฯลฯ) |
| `verified_at` | TIMESTAMPTZ nullable | เวลาที่ cron ตรวจล่าสุด |
| `success_rate` | NUMERIC(5,2) nullable | 0–100%; จาก coupon_votes |
| `created_at` | TIMESTAMPTZ | auto |
| `updated_at` | TIMESTAMPTZ | auto |

**ข้อจำกัด daily_featured:** คูปองที่จะถูกเลือกเป็น featured **ต้องมี `code` ไม่ null** — cron กรอง `code IS NOT NULL`

---

#### A9.3 Tier System

| Tier | ประเภท | ตัวอย่าง |
|---|---|---|
| **1** | Platform Voucher — ส่วนลดจาก Lazada/Shopee โดยตรง | ลด 12% ทั้งแพลตฟอร์ม |
| **2** | Shop Voucher — ส่วนลดจากร้านค้าเฉพาะ | GAWEFA ลด ฿15 |
| **3** | Bank / Payment — บัตรเครดิต/QR | KBank ลด 10% |
| **4** | Shipping — ส่วนลดค่าจัดส่ง | ส่งฟรีเมื่อซื้อ ฿300 |

**การ enforce:**
- DB constraint `CHECK (tier BETWEEN 1 AND 4)`
- Combination Solver ใช้ลำดับ 1→2→3→4 เสมอ
- Stack rules กำหนด allowed_tiers ต่อ platform

---

#### A9.4 Combination Solver — อัลกอริทึม

ไฟล์: `src/features/engine/combination-solver.ts`

**Input:** `{ originalPrice, shippingFee, coupons[], stackRules[] }`

**Step 1 — generateCombinations():**
```
จัดกลุ่มตาม tier: { 1:[A,B], 2:[C], 3:[], 4:[D] }
สร้าง Cartesian Product:
  Tier1: skip / A / B     → 3 ทางเลือก
  Tier2: skip / C         → ×2
  Tier3: skip             → ×1
  Tier4: skip / D         → ×2
  รวม: 12 combo (รวม empty set)
กรอง empty set ออก → เหลือ 11 combo
```

**Step 2 — canStack() validation:**
```
0–1 ใบ → OK เสมอ
≥ 2 ใบ → ทุกใบต้องมี can_stack = true
       → ต้องหา active rule ที่:
           rule.platform match (หรือ 'all')
           ทุก tier อยู่ใน rule.allowed_tiers
           จำนวน ≤ rule.max_stack
```

**Step 3 — calculateNetPrice() — ใช้ตามลำดับ tier:**
```
type = 'fixed'    → itemPrice -= min(discount_value, max_discount ?? ∞)
type = 'percent'  → itemPrice -= min(itemPrice × value/100, max_discount ?? ∞)
type = 'shipping' → shippingFee -= min(discount_value, max_discount ?? ∞)
type = 'cashback' → cashback += min(discount_value, max_discount ?? ∞)  ← หักหลังจ่าย

payNow       = itemPrice + shippingFee
effectiveNet = payNow - cashback
```

**Step 4 — เลือก combo ที่ดีที่สุด:**
```
เปรียบเทียบทุก combo → ต่ำสุด effectiveNet
Tiebreaker: ต่ำสุด payNow
ถ้าไม่มี combo ผ่าน → คืน baseline (ราคาเต็ม)
```

**ตัวอย่าง — สินค้า ฿1,000 ส่ง ฿40:**
```
Tier1 ลด10%  → itemPrice 1,000 → 900
Tier2 ลด฿100 → itemPrice 900  → 800
Tier4 ส่งฟรี  → shippingFee 40 → 0
payNow = 800฿  ประหยัด 240฿
```

---

#### A9.5 Daily Featured Coupon — Scoring Algorithm

ไฟล์: `app/api/cron/daily-featured/route.ts`  
Cron: ทุกวัน 00:00 ICT (17:00 UTC) | `0 17 * * *`

**Pre-filter:**
```
is_active = true
code IS NOT NULL
expire_at > NOW() + '6 hours'  (หรือ expire_at IS NULL)
ไม่ถูก featured ใน 7 วันที่ผ่านมา
```

**Scoring (2 modes):**

| Mode | เงื่อนไข | Formula |
|---|---|---|
| `v2_noctr` | click_logs < 1,000 (ปัจจุบัน active) | commission×0.65 + freshness×0.25 + diversity×0.10 |
| `v2_ctr` | click_logs ≥ 1,000 | commission×0.35 + ctr×0.30 + freshness×0.25 + diversity×0.10 |

**Factor ต่อ factor:**

| Factor | คำนวณ | Range |
|---|---|---|
| `commission_rate_norm` | percent/cashback: value/50 · fixed: value/500 · shipping: 0.2 (fixed) | 0.0–1.0 |
| `ctr_score` | PERCENT_RANK() ของ reveal_count_30d DESC | 0.0–1.0 |
| `freshness_score` | PERCENT_RANK() ของ verified_at DESC | 0.0–1.0 |
| `category_diversity` | ไม่ featured 7d → 1.0 · 4–7d → 0.5 · 1–3d → 0.0 | 0.0/0.5/1.0 |

**Campaign Multiplier:**
```
mega-campaign active (5.5, 11.11, 12.12 ฯลฯ) → ×2.0
double_date (day === month)                   → ×2.0
payday (day 25–31)                            → ×1.5
month_start (day 1–5)                         → ×1.05
normal                                        → ×1.0
```

**Idempotent:** ถ้า row สำหรับวันนี้มีอยู่แล้ว → skip (ปลอดภัยที่จะรัน cron ซ้ำ)

---

#### A9.6 Public Wallet Page — /wallet

ไฟล์: `app/wallet/page.tsx` · `src/lib/wallet-queries.ts`

**Data fetch flow:**
```
getWalletSweepData()
  → parallel 4 queries: getCouponsByTier(1) + (2) + (3) + (4) limit 30/tier
  → sort per tier:
      1. verified_at ภายใน 2h → ขึ้นบน (recently verified badge)
      2. success_rate DESC
      3. expire_at ASC (ใกล้หมดอายุ → ล่างสุด)
  → ดึง last_used_at = MAX(coupon_votes.created_at WHERE vote='up')
```

**Helper queries:**
- `sweepTotalCount()` → จำนวนคูปองทั้งหมด (แสดงใน UI "X คูปองพร้อมใช้")
- `sweepLastVerified()` → max(verified_at) → "อัพเดตเมื่อ X นาทีที่แล้ว"

**Layout sections:**
1. Campaign banner (urgent/warm/normal ตาม getCampaignTheme)
2. Sweep stats (count + last verified)
3. LINE subscribe CTA
4. 4 tier sections (Platform → Shop → Bank → Shipping)
5. Education footer — "stack ได้: Platform + Shop + Shipping รวมกัน"
6. **ถ้า login:** Personal wallet (near-expiry alert + AddCouponForm + WalletList)

---

#### A9.7 Personal Wallet — coupon_wallet table

ไฟล์: `src/lib/coupon-wallet.ts`

| Field | Type | หมายเหตุ |
|---|---|---|
| `user_ref` | UUID FK | auth.users.id |
| `code` | TEXT | uppercase |
| `title` | TEXT | |
| `discount_type` | TEXT | fixed/percent/shipping/cashback |
| `discount_value` | NUMERIC | |
| `min_spend` | NUMERIC | |
| `platform` | TEXT | shopee/lazada/all |
| `expire_at` | TIMESTAMPTZ nullable | |
| `is_used` | BOOLEAN | mark as used |

**Functions:**
- `getWallet(userId)` — non-expired + unused, sort by expiry
- `getNearExpiry(userId, 48)` — เตือน 48h ก่อนหมด
- `addToWallet()` — insert (RLS: เจ้าของเท่านั้น)
- `removeFromWallet()` — delete
- `autoPickBestWalletCoupons()` — convert wallet → Coupon[] → run solveBestCombination() → ได้ best stack

---

#### A9.8 Verification & Expiry Cron Jobs

| Cron | Schedule | ไฟล์ | หน้าที่ |
|---|---|---|---|
| `coupon-verify` | ทุก 30 นาที | `app/api/cron/coupon-verify/route.ts` | deactivate expired + stamp verified_at |
| `coupon-expire` | 23:55 ICT ทุกวัน | `app/api/cron/coupon-expire/route.ts` | final sweep ก่อน daily-featured |
| `daily-featured` | 00:00 ICT ทุกวัน | `app/api/cron/daily-featured/route.ts` | เลือก featured coupon |

**coupon-verify logic (2 steps):**
```sql
-- Step 1: deactivate expired
UPDATE coupons SET is_active = false, verified_at = NOW()
WHERE is_active = true AND expire_at < NOW()

-- Step 2: stamp freshness (batch 100)
UPDATE coupons SET verified_at = NOW()
WHERE is_active = true
  AND (verified_at IS NULL OR verified_at < NOW() - '25 minutes')
LIMIT 100
```

**Phase 2 (future):** real HTTP probe ต่อ coupon code ผ่าน Shopee/Lazada API เพื่อ verify จริง (ตอนนี้ timestamp เท่านั้น)

---

#### A9.9 Crowdsourced Validation — coupon_votes

ไฟล์: `app/api/coupon-vote/route.ts` · `src/lib/coupon-vote.ts`

| Field | Type | หมายเหตุ |
|---|---|---|
| `coupon_code` | TEXT | รหัสคูปองที่โหวต |
| `product_id` | TEXT | product ที่ใช้คูปองนั้น |
| `vote` | TEXT | `'up'` · `'down'` |
| `session_id` | TEXT | anonymous session hash |

**Unique:** 1 vote ต่อ (coupon_code, product_id, session_id) → upsert-safe  
**RLS:** public insert + read  
**ใช้ใน:** getCouponsByTier() ดึง last_used_at · admin page นับ downvote · shouldHideCoupon() ≥3 downvotes → ซ่อน

---

#### A9.10 Stack Rules — coupon_stack_rules

Default seed (migration 20260412):
```
Shopee Standard Stack: platform='shopee', allowed_tiers=[1,2,3,4], max_stack=4
Lazada Standard Stack: platform='lazada', allowed_tiers=[1,2,3,4], max_stack=4
```

**canStack() logic:**
```
empty / 1 coupon     → OK
≥ 2 coupons          → ทุกใบ can_stack=true
                     → หา active rule ที่:
                         platform match (หรือ rule.platform='all')
                         ทุก tier ∈ allowed_tiers
                         count ≤ max_stack
mixed platform (shopee+lazada ใน combo เดียว) → ✗ ไม่ผ่าน ยกเว้น rule.platform='all'
```

---

#### A9.11 Admin Coupon Management

หน้า: `/admin/coupons` | Actions: `app/admin/coupons/actions.ts`

**addCouponAction() inputs:**
```
code         (optional, uppercase)
title        (required)
platform     shopee | lazada | all
type         percent | fixed | shipping | cashback
discount_value > 0
min_spend    (default 0)
expire_at    (optional)
```
**หมายเหตุ:** tier ไม่มีในฟอร์ม admin ปัจจุบัน — ต้องใส่ผ่าน SQL โดยตรงถ้าต้องการ tier 2–4

**toggleCouponAction():** `UPDATE coupons SET is_active = $1 WHERE id = $2`

**Admin page stats:** Active · With Code · Expired · Reported (downvotes ≥ 1)

---

#### A9.12 วิธีเพิ่มคูปองเข้า DB

**ช่องทาง 1 — Admin UI** (tier 1 เท่านั้น, มี code):
```
/admin/coupons → กรอกฟอร์ม → addCouponAction()
```

**ช่องทาง 2 — SQL โดยตรง** (batch, รองรับทุก tier):
```sql
INSERT INTO coupons (code, title, platform, tier, type, discount_value,
                     max_discount, min_spend, expire_at, is_active, source)
VALUES
  (NULL, 'Lazada Platform ลด12% มือถือ', 'lazada', 1, 'percent',
   12, 3100, 999, '2026-05-07 23:59:00+07', true, 'manual'),
  ...
```

**ข้อควรรู้ก่อน insert:**
- `code = NULL` → ไม่ขึ้น daily_featured (cron กรอง `code IS NOT NULL`)
- `expire_at` ต้องระบุ timezone +07 (ICT) ให้ถูกต้อง
- `tier` ต้อง 1–4 (DB constraint)
- `can_stack = true` (default) ให้ stack ได้กับ tier อื่น

---

### A5. Environment Variables

```env
# Core
NEXT_PUBLIC_BASE_URL=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=             # postgresql://couponkum:...@localhost:5432/couponkum

# Cloudflare
CLOUDFLARE_WORKER_URL=
CLOUDFLARE_API_TOKEN=

# Email Routing (Cloudflare — Free)
# partner@couponkum.com → forward yopinm@gmail.com (Active 2026-05-05)

# Lazada Affiliate API (REST) — ✅ API Key received; ⏳ permission pending
LAZADA_APP_KEY=
LAZADA_APP_SECRET=
LAZADA_USER_TOKEN=

# Shopee Affiliate API (GraphQL) — ⏳ pending approval
SHOPEE_APP_ID=
SHOPEE_APP_SECRET=

# TikTok — pending follower threshold
AFFILIATE_ID_TIKTOK=

# Facebook Page Automation (server-side only)
FB_PAGE_ID=
FB_PAGE_ACCESS_TOKEN=
FB_APP_SECRET=
FB_WEBHOOK_VERIFY_TOKEN=
FB_APP_SECRET_ROTATED_AT=
FB_DISABLE_GRAPH_API_POSTING=true    # ตั้งเป็น false เมื่อพร้อมโพสต์จริง

# LINE OA (server-side only)
LINE_CHANNEL_SECRET=
LINE_CHANNEL_ACCESS_TOKEN=
NEXT_PUBLIC_LINE_OA_ID=               # ไม่มี @ prefix — ระบบเติมเอง

# Revenue Tracking S2S
REVENUE_WEBHOOK_SECRET=              # HMAC signing key สำหรับ postback

# SEO & Distribution
INDEXNOW_KEY=                        # ⏳ Owner ต้องตั้งใน VPS

# Cron
CRON_SECRET=

# Other
SENTRY_DSN=
REDIS_URL=                            # Month 4-6 เมื่อ traffic ถึง threshold
ADMIN_KEY=
NEXT_PUBLIC_FACEBOOK_APP_ID=

# Proxy Pool (TASK 4.8 — dormant until Month 7-9)
PROXY_URLS=                          # comma-separated proxy list

# LINE Notify (deprecated March 2025 — ไม่ใช้)
# LINE_NOTIFY_TOKEN=
```

> `scripts/validate-env.mjs` ต้องรันก่อน build/deploy

#### VPS Crontab (ทั้งหมดที่ active — updated 2026-05-07)

| Schedule (UTC) | เวลา ICT | Endpoint | หน้าที่ |
|---|---|---|---|
| `*/15 * * * *` | ทุก :00 :15 :30 :45 | `deal-score` | คำนวณ score ทุกดีล |
| `*/30 * * * *` (delay 2 min) | ทุก :02 :32 | `rare-item-score` | คำนวณ rare item score |
| `*/30 * * * *` | ทุก :00 :30 | `coupon-verify` | ตรวจสอบสถานะคูปอง |
| `0 */6 * * *` | 01:00, 07:00, 13:00, 19:00 | `involve-asia-import` | ดึง IA offers |
| `0 */8 * * *` | 07:00, 15:00, 23:00 | `lazada-import` | ดึง Lazada affiliate feed |
| `30 0 * * *` | 07:30 | `seo-submit` | IndexNow submit |
| `0 2 * * *` | 09:00 | `link-monitor` | ตรวจ affiliate links ที่เสีย |
| `5 2 * * *` | 09:05 | `line-push` | ส่ง LINE push notification |
| `0 4 * * *` | 11:00 | `facebook-publisher` | โพสต์ Facebook รอบเช้า |
| `0 10 * * *` | 17:00 | `facebook-publisher` | โพสต์ Facebook รอบบ่าย |
| `0 14 * * *` | 21:00 | `facebook-publisher` | โพสต์ Facebook รอบค่ำ |
| `55 16 * * *` | 23:55 | `coupon-expire` | mark คูปองหมดอายุ |
| `0 17 * * *` | 00:00 (เที่ยงคืน) | `daily-featured` | เลือก featured coupon ประจำวัน |
| `0 19 * * 0` | จันทร์ 02:00 | `data-archive` | archive ข้อมูลเก่ารายสัปดาห์ |

**หมายเหตุ:** `seo-submit` ใช้ `$CRON_SECRET` env var (ต้อง set ใน VPS shell ก่อน crontab ทำงาน) · log ที่ `/var/log/couponkum-cron.log`, `/var/log/ia-import.log`, `/var/log/couponkum-lazada.log`, `/var/log/couponkum-fb.log`

---

### A6. Security Reference & Compliance

#### Security Fix Archive

**Phase S (2026-04-19):**

| #   | Severity | Issue                                            | Fix                                               |
| --- | -------- | ------------------------------------------------ | ------------------------------------------------- |
| 1   | Critical | Admin `?key=ADMIN_KEY` หลุดผ่าน Browser History  | middleware.ts + admin-auth.ts                     |
| 2   | Critical | Service Role ใช้โดยไม่เช็ค Session               | `getAdminUser()` guard ใน API routes              |
| 3   | High     | SSRF — `/api/link-check` fetch URL ใดก็ได้       | `assertAllowedUrl()` allowlist + block private IP |
| 4   | High     | Open Redirect — `/api/r` ไม่ตรวจสอบโดเมน         | domain allowlist + 301→302                        |
| 5   | High     | Info Leak — `affiliate_url` ใน Public Search API | ลบออกจาก `SearchResultItem`                       |
| 6   | Medium   | Postback รับ null order_id / negative commission | validate + trim + idempotency index               |
| 7   | Medium   | RLS `facebook_*` ยอมรับ authenticated ทุกคน      | role = 'admin' check                              |

**Phase S2 (2026-04-20 → 2026-04-29 ✅ ปิดทั้งหมด):**

- S2-1: Meta webhook registered; GET verify passes; `feed` subscribed ✅
- S2-2: OAuth callback `next` redirects guarded ✅
- S2-3: sanitizer ใช้ state-machine tag stripping ✅

**Security Hardening Post-Launch (2026-05-01):**

- Supabase DB password rotated
- Lazada postback GET auth (token required)
- SQL injection allowlist ใน `buildDryRunSql`
- Facebook Graph API token → `Authorization: Bearer` header
- SSRF guard บน lazada-import

#### Security Headers (next.config.ts ✅)

| Header                                                         | ป้องกัน         |
| -------------------------------------------------------------- | --------------- |
| `X-Frame-Options: SAMEORIGIN`                                  | Clickjacking    |
| `X-Content-Type-Options: nosniff`                              | MIME sniffing   |
| `Referrer-Policy: strict-origin-when-cross-origin`             | Referrer leak   |
| `Permissions-Policy: camera=(), microphone=(), geolocation=()` | Feature abuse   |
| `Content-Security-Policy`                                      | XSS / injection |

#### Operating Rules

- Admin auth ใช้ `requireAdminSession()` หรือ `getAdminUser()` จาก `@/lib/admin-auth`
- ห้ามแก้ `.env` / ห้าม commit secrets
- ห้าม push ไป `main`
- 1 task = 1 commit
- รัน `npx tsc --noEmit && npm run lint && npm run test` ก่อน commit ทุกครั้ง

#### Legal & Compliance

- **Affiliate Disclosure**: ใส่ทุกหน้าที่มีลิงก์ affiliate (ทำแล้ว TASK 3.14 ✅)
- **Platform ToS**: กฎ Shopee/Lazada เปลี่ยนบ่อย — Legal Disclaimer ✅
- **Meta ToS**: Review ทุก 3 เดือน — checklist จาก TASK 2.5.9 ✅
- **IA Policy**: ห้าม cookie stuffing / trademark bidding / spam / misleading price / cashback โดยไม่แจ้ง
- **AT Policy**: ห้าม incentivize click / popup / misleading content / coupon หมดอายุที่ยังแสดง
- **Campaign Check Rule**: ก่อนเพิ่มแคมเปญใหม่จาก IA หรือ AT ต้องตรวจ Dashboard ว่า "Allow Coupon Sites" ก่อน

#### Fallback UX Rules

- No Result → "สินค้าใกล้เคียงที่คุ้มที่สุด" — ไม่ส่งไปหน้า 404
- Broken Image → Placeholder ทันที (`/product-placeholder.svg`)
- effectiveNet ≤ 0 → แสดง "ฟรีเลย!"

---

## PART B — Infra & Deployment

### B1. VPS Specification

| Item            | Value                                         |
| --------------- | --------------------------------------------- |
| Provider        | Ruk-Com Cloud                                 |
| Plan            | VPS-TH-1                                      |
| Hostname        | `server.couponkum.com`                        |
| Main IP         | `103.52.109.85`                               |
| OS              | AlmaLinux 9.7                                 |
| CPU             | 2 Cores                                       |
| RAM             | 4 GB (3.8 GiB available)                      |
| Storage         | 40 GB SSD (39 GB available)                   |
| Cost            | 800 บาท/เดือน (next due 2026-05-29)           |
| SSH             | root@103.52.109.85 (SSH Key only)             |
| Provider portal | `https://portal.ruk-com.cloud/clientarea.php` |

#### Infra Strategy

```
VPS         = Compute (Next.js + PM2 + Nginx); PostgreSQL local
Cloudflare  = Security + Edge + Cache layer
Supabase    = Auth + RLS (คงไว้ตลอด — ไม่ย้าย Auth)
```

> **ห้ามซื้อ add-on ใดจาก Ruk-Com** — ใช้ Cloudflare แทน

### B2. Deploy Reference

```bash
# Standard deploy sequence (ทำหลัง git push origin develop)

# 1. Pull on VPS
ssh root@103.52.109.85 "cd /var/www/couponkum && git pull origin develop"

# 2. Build (source .env.local ก่อน build เสมอ)
ssh root@103.52.109.85 "cd /var/www/couponkum && source .env.local && npm run build"

# 3. Restart PM2
ssh root@103.52.109.85 "pm2 restart couponkum"

# 4. Smoke check
curl -s -o /dev/null -w '%{http_code}' https://couponkum.com/api/health
# ต้องได้ 200
```

#### PM2 Cluster Config (`ecosystem.config.js`)

```js
module.exports = {
  apps: [
    {
      name: "couponkum",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3000",
      instances: "max", // ลด → 1 ถ้า DB pressure สูงช่วง early traffic
      exec_mode: "cluster",
      env: { NODE_ENV: "production", PORT: 3000 },
    },
  ],
};
```

**Recovery:** `pm2 restart couponkum` หรือ `pm2 reload couponkum`

**PM2 boot:** `pm2-root.service` ใช้ `Type=oneshot` + `RemainAfterExit=yes` (ป้องกัน systemd รัน `pm2 kill`)

### B3. Nginx Reverse Proxy

```nginx
server {
    listen 443 ssl http2;
    server_name couponkum.com www.couponkum.com;

    ssl_certificate /etc/letsencrypt/live/couponkum.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/couponkum.com/privkey.pem;

    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";
    add_header Referrer-Policy "strict-origin-when-cross-origin";

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
    server_tokens off;
}
```

- Let's Encrypt cert: expires 2026-07-28 · `certbot-renew.timer` enabled
- Cloudflare SSL/TLS mode: **Full (Strict)** ✅ (2026-04-29)

### B4. Cloudflare Setup

**Active security baseline:**

- DDoS Protection · Managed Ruleset · JS Detection · Bot Fight Mode · Block AI Bots · Hotlink Protection · Email Obfuscation

**WAF Custom Rules:**

| Priority | Rule                                        | Action            |
| -------- | ------------------------------------------- | ----------------- |
| 1        | Verified bots (Googlebot)                   | Allow             |
| 2        | Bad UA: scrapy, python-requests, curl, wget | Block             |
| 3        | `/api/search` > 60 req/min/IP               | Rate limit 10 min |
| 4        | `/api/r` > 40 req/min/IP                    | Rate limit 10 min |
| 5        | `/api/postback/*` นอก Shopee/Lazada IP      | Block             |
| 6        | `/admin/*` นอก TH (optional)                | Block             |

**Cache Rules:**

| Pattern                                                  | Cache TTL |
| -------------------------------------------------------- | --------- |
| `/coupon/*`, `/deals/*`                                  | 5 นาที    |
| `/blog/*`                                                | 1 ชั่วโมง |
| `/api/search*`, `/api/r*`, `/api/postback/*`, `/admin/*` | No cache  |

**Deferred controls:** WAF custom rules · Rate Limiting · Zone Lockdown · mTLS · Schema Validation

### B5. Hardware Overcommit Risk Register (VPS-TH-1: 2C/4GB)

#### Risk 1 — In-Memory Cache ไม่ share ข้าม PM2 workers

- Root cause: `InMemoryCacheStore` และ `InMemoryStore` เป็น Map ต่อ process
- PM2 cluster 2 instances → DB queries ≈ 2x ที่คาด; IP rate-limit bypass 60 req/min จริง
- **Fix (Month 4–6):** `REDIS_URL` → code พร้อม swap แล้วใน `cache.ts:7` + `bot-detection.ts:11`
- Interim: ลด `instances: 2` → `1` ถ้า DB pressure สูง

#### Risk 2 — Combination Solver CPU Spike ช่วง Campaign

- Campaign 11.11: 20+ coupons/tier → 20^4 = 160,000 combos/product
- Action: cap coupons per tier ≤ 10 ใน eligibility filter ก่อน campaign ใหญ่

#### Risk 3 — Cron Overlap

```
:00  deal-score (15min) + alert-scanner (15min) → CPU spike
:30  deal-score + alert-scanner + rare-item-score (30min)
```

Action: stagger — rare-item-score → `:05`, alert-scanner → `:10`

#### Campaign Day Runbook (11.11 / 12.12 / 9.9)

ทำล่วงหน้า 1 ชั่วโมง:

```bash
GET /api/cron/prewarm?secret=CRON_SECRET    # warm cache
pm2 status                                  # ตรวจ 2 instances running
pm2 monit                                   # ตรวจ memory < 600MB/instance
# เปิด /admin/control → ปิด feature ที่ไม่จำเป็น
# ตรวจ /admin/postbacks → fail rate < 5%
# ถ้า DB load สูง → ลด instances: 1 แล้ว pm2 reload
```

หลัง campaign (24h): `df -h` · `du -sh /var/log/couponkum/` · ตรวจ table growth

---

## PART C — Revenue & Affiliate

### C1. Attribution Flow

```
User click CTA
→ /go/[id] (coupon reveal + copy + countdown)
→ /api/r?id=...&sub_id=... (injectSubId ฝัง sub_id ใน affiliate URL)
→ URL Health Check → log click → 302 redirect → Platform
→ Platform Postback → /api/postback/{platform} (S2S)
→ revenue_tracking upsert (idempotent — onConflict platform+order_id+event_type)
```

#### Sub-ID Naming Convention

| รูปแบบ                                   | ความหมาย                 |
| ---------------------------------------- | ------------------------ |
| `home_top`, `search_top_1`               | position-based           |
| `fb_manual_YYYYMMDD_slot{1/2/3}_{hook}`  | Facebook manual post     |
| `fb_group_vip_{pillar}_YYYYMMDD_seq1`    | Facebook VIP group       |
| `seo_page`, `seo_category_mobile`        | SEO landing              |
| `fb_group_{group_id}_YYYYMMDD`           | Community outreach       |
| `campaign_prep_MMDD`                     | Pre-campaign cookie drop |
| `share_widget_YYYYMMDD`                  | Savings share widget     |
| `tt_hook_YYYYMMDD`, `tt_product_[id]`    | TikTok                   |
| `line_alert_week{N}`, `email_payday_sep` | Owned media              |

#### Network Sub-ID Parameter Mapping

| Network        | Parameter  | Domain                          |
| -------------- | ---------- | ------------------------------- |
| Involve Asia   | `sub1=`    | `invol.co` / `involve.asia`     |
| AccessTrade TH | `aff_sub=` | `accesstrade.in.th` / `atth.me` |
| Shopee direct  | `sub_id=`  | `shope.ee` / `shopee.co.th`     |
| Lazada direct  | `sub_id1=` | `lazada.co.th`                  |

Code: `src/lib/affiliate-url.ts` → `injectSubId()` รองรับ auto-detect ครบแล้ว

### C2. Affiliate Network Status (DataSource)

#### Lazada

- **Status:** ✅ LIVE — ใช้ **LiteApp Affiliate API** (`adsense.lazada.co.th`) · cron `0 */8 * * *` · 34 active products (2026-05-06)
- **หมายเหตุ:** open.lazada.com = ISV/seller platform ไม่เกี่ยวกับ affiliate publisher — ไม่ต้องสมัคร
- **volume เพิ่มได้ผ่าน:** Involve Asia (Lazada TH CPS campaign) เมื่อ IA อนุมัติ properties → `/api/cron/ia-sync` sync ทุก 6h
- Postback URL: `https://couponkum.com/api/postback/lazada?transaction_id={sub_id1}&payout={_p_payout}&amount={_p_pay_amount}&offer_id={_p_offer}&token=<REVENUE_WEBHOOK_SECRET>`
- Payment: โอนเข้า SCB 739-229469-2 · ขั้นต่ำ 300 บาท

#### Shopee

- **Status:** ⏳ รอ API Secret Approve (ต้องมียอดขาย 1,000 บาท + traffic proof)
- ช่วงนี้: ใช้ Manual CSV import + Shopee Affiliate CSV (Shopee Affiliate Product CSV เท่านั้น — ไม่ใช้ Shop Offer CSV)
- Payment: โอนเข้า SCB 739-229469-2 · ขั้นต่ำ 1,000 บาท
- Postback (via Involve Asia): `https://couponkum.com/api/postback/shopee?sub_id={aff_sub}&order_id={order_id}&commission={payout}&token=<SECRET>`

#### Involve Asia

- **Status:** ⏳ รออนุมัติ properties รอบสอง · API key requested 2026-05-04 (ETA 48h = 2026-05-06)
- Sub-ID param: `sub1=`
- Payment: PayPal / Bank Transfer · ขั้นต่ำ ~$10 USD (~320 บาท) · SCB 739-229469-2
- Postback config:
  - Advertiser: Shopee TH - CPS
  - Type: Both (Conversion Created + Updated)
  - URL: `https://couponkum.com/api/postback/shopee?sub_id={aff_sub}&order_id={order_id}&commission={payout}&token=<SECRET>`

#### AccessTrade Thailand

- **Status:** ✅ อนุมัติ 2026-05-02
- Sub-ID param: `aff_sub=`
- Domain: `atth.me` (ใน allowlist + `detectNetwork()` แล้ว)
- Payment: โอนเข้า SCB 739-229469-2 · ขั้นต่ำ 500 บาท
- Postback URL: `https://couponkum.com/api/postback/accesstrade?aff_sub={aff_sub}&order_id={transaction_id}&commission={commission}&status={status}&token=<SECRET>`

**Approved Campaigns:**

| Campaign                           | Link                           |
| ---------------------------------- | ------------------------------ |
| 1.HP Thailand                      | `https://atth.me/00e73h0029tq` |
| 2.CompAsia (Thailand)              | `https://atth.me/00djzt0029tq` |
| 3.otus's Shop Online               | `https://atth.me/00d4690029tq` |
| 4.dvice Online                     | `https://atth.me/00cxqr0029tq` |
| 5.udio7                            | `https://atth.me/009nxw0029tq` |
| 6.novo TH                          | `https://atth.me/0035m80029tq` |
| 7.eedCom                           | `https://atth.me/002bj90029tq` |
| 8.idas Thailand                    | `https://atth.me/001szs0029tq` |
| 9.nana                             | `https://atth.me/001pae0029tq` |
| 10.ngsri Lady Titanium Credit Card | `https://atth.me/00dayn0029tq` |
| 11.t by Krungsri                   | `https://atth.me/00d9uk0029tq` |
| 12.hora Thailand ✅ UAT pass       | `https://atth.me/00d75y0029tq` |
| 13.Big C                           | `https://atth.me/000bqw0029tq` |
| 14.Home Pro                        | `https://atth.me/00dagw0029tq` |
| 15.LG Thailand                     | https://atth.me/00dt3b0029tq   |

| 16.
**Pending check:** Shopee TH · Lazada · B2S · Central Online · Supersports · ALL Online · GoWabi · Bewell

### C3. Affiliate Compliance Rules

🚨 **Critical — ถ้าพลาด = โดนแบน / commission = 0**

| กฎ                      | Status                          |
| ----------------------- | ------------------------------- |
| ห้าม Cookie Stuffing    | ✅ ผ่าน `/go → /api/r` เท่านั้น |
| ห้าม Trademark Bidding  | ✅ ไม่ได้ยิง ads                |
| ห้าม Misleading Price   | ✅ TRUST-VERIFY-1 done          |
| ห้าม Spam Traffic       | ✅ bot detection done           |
| ห้าม Content ไม่เหมาะสม | ✅ ไม่มี                        |
| ห้ามแอบอ้างแบรนด์       | ✅ disclosure ชัดเจน            |
| ห้าม Popup/Pop-under    | ✅ ไม่มี popup                  |
| ห้าม Coupon หมดอายุ     | ✅ freshness gate done          |
| Affiliate Disclosure    | ✅ ทุกหน้า                      |
| Intermediate Page       | ✅ `/go/[id]`                   |
| Privacy Policy + PDPA   | ✅ มีหน้า Legal                 |

**ต้องระวัง:**

- Cashback Feature → แจ้ง IA ก่อนเปิด
- Brand Name ในโดเมน → ห้ามจด subdomain `shopee.couponkum.com`
- SEM → ห้าม bid keyword ชื่อแบรนด์
- Luxury Brand Campaigns → มักไม่อนุมัติ Coupon Sites — ตรวจก่อน
- Sub ID Format → ต้องถูกตาม network (ผิด = tracking หาย = commission หาย)

### C4. Shopee Import Workflow

**4 วิธี Import:**

| วิธี               | เมื่อใด           | เครื่องมือ               |
| ------------------ | ----------------- | ------------------------ |
| Manual Form        | deal เดี่ยว, ด่วน | `/admin/coupons/new`     |
| CSV Upload         | batch 10–100      | `/admin/import`          |
| Bookmarklet        | เจอดีลขณะ browse  | `/admin/tools` → ติดตั้ง |
| Affiliate Networks | auto-feed         | cron (เมื่อ API approve) |

**CSV Template (Shopee Affiliate Product CSV เท่านั้น):**

```csv
title,original_price,coupon_price,coupon_code,affiliate_url,category,platform,expires_at
"ชื่อสินค้า",500,350,"SAVE30","https://shope.ee/xxx","fashion","shopee","2026-05-31"
```

**ห้ามใช้ Shop Offer CSV** (affiliate_url เป็น shop-level ไม่ใช่ product)

#### Network Selection Logic

```
shope.ee / shopee.co.th         → sub_id=    (Shopee default)
invol.co / involve.asia         → sub1=      (Involve Asia)
accesstrade.in.th / atth.me     → aff_sub=   (AccessTrade)
lazada.co.th                    → sub_id=    (Lazada default)
```

### C5. Revenue Reconciliation (รายสัปดาห์)

```
□ Export click_logs รอบอาทิตย์ที่ผ่านมา
□ Export commission report จาก network dashboard (IA / AT / Lazada / Shopee)
□ เปรียบ conversion rate — ถ้า < 0.5% ตรวจ URL integrity
□ อัปเดต EPC รายแคมเปญ ใน /admin/epc
□ ถ้า EPC Shopee direct > IA → ใช้ direct; ถ้า IA EPC สูงกว่า → migrate top deals
```

#### Commission Rate Map (approx.)

| Platform    | Category          | Commission %      |
| ----------- | ----------------- | ----------------- |
| Shopee      | Electronics       | 2–3%              |
| Shopee      | Fashion           | 4–6%              |
| Lazada      | Home & Living     | 3–5%              |
| Lazada      | Beauty            | 5–7%              |
| AccessTrade | HP/Lenovo/Studio7 | ดูใน AT dashboard |
| AccessTrade | Sephora           | ดูใน AT dashboard |

**Strategy:** ดัน category ที่ rate สูงกว่า (Fashion, Beauty) เพิ่มขึ้นใน homepage

### C6. TikTok Affiliate Strategy

| Status  | ความหมาย                                          |
| ------- | ------------------------------------------------- |
| **T.1** | บัญชี TikTok ตั้งแล้ว — ยังไม่มีคอนเทนต์          |
| **T.2** | โพสต์แรก 10 คลิป                                  |
| **T.3** | Follower ≥ 1,000 — สมัคร TikTok Affiliate Program |
| **T.4** | TikTok Affiliate อนุมัติ — ใช้ Product Link ได้   |
| **T.5** | Revenue flow จาก TikTok → postback                |

Hook format: `[emotion] + [curiosity gap] + [CTA ≤ 3 วินาที]`
Hook library: `/admin/tiktok-hooks`

---

## PART D — Admin Operations

### D1. Admin Control Center (Kill Switches)

| Flag                         | สั่งปิด/เปิดได้ทันที             |
| ---------------------------- | -------------------------------- |
| Affiliate Redirect           | ปิดส่งคนไปร้านค้าถ้าลิงก์เสีย    |
| Postback Tracking            | ปิดรับข้อมูลรายได้ชั่วคราว       |
| Maintenance Mode             | ปิดหน้าเว็บหลัก (Search/Product) |
| AI Optimization              | ปิด AI ranking ชั่วคราว          |
| FB_DISABLE_GRAPH_API_POSTING | ปิด auto-post FB Page            |

### D2. Admin Pages Reference

**กลุ่ม 1: Dashboard + Control**

| หน้า           | URL                  | บทบาท                              |
| -------------- | -------------------- | ---------------------------------- |
| Admin Home     | `/admin`             | Dashboard รวม stats + alert banner |
| Control Center | `/admin/control`     | Kill switches + feature flags      |
| Maintenance    | `/admin/maintenance` | ปิดหน้าเว็บ                        |
| Preflight      | `/admin/preflight`   | DB readiness check                 |

**กลุ่ม 2: Revenue + Conversion**

| หน้า               | URL                 | บทบาท                                                |
| ------------------ | ------------------- | ---------------------------------------------------- |
| Revenue Dashboard  | `/admin/revenue`    | Commission + ROI + Sub-ID + Break-even + Network EPC |
| Funnel Analysis    | `/admin/funnel`     | Sub-ID × path × CTR + drop-rate panel                |
| Postback Monitor   | `/admin/postbacks`  | 50 รายการล่าสุด                                      |
| Commission Map     | `/admin/commission` | Commission rate per platform/category                |
| EPC Dashboard      | `/admin/epc`        | Earnings per click by platform/network               |
| Influencer Sub-IDs | `/admin/influencer` | สร้าง unique sub_id per partner                      |

**กลุ่ม 3: Alerts + Health**

| หน้า         | URL                  | บทบาท                      |
| ------------ | -------------------- | -------------------------- |
| Alert Rules  | `/admin/alerts`      | ตั้ง threshold             |
| Link Health  | `/admin/link-health` | Affiliate link เสีย/ดี     |
| Bot/Security | `/admin/security`    | Bot blocks + suspicious IP |

**กลุ่ม 4: Content + Deals**

| หน้า           | URL                    | บทบาท               |
| -------------- | ---------------------- | ------------------- |
| Deal Queue     | `/admin/deal-queue`    | คิว deals           |
| Shopee Import  | `/admin/shopee-import` | CSV/manual import   |
| Bookmarklet    | `/admin/bookmarklet`   | Browser bookmarklet |
| UGC Moderation | `/admin/ugc`           | Review tip/review   |
| TikTok Hooks   | `/admin/tiktok-hooks`  | Hook library + CTR  |

**กลุ่ม 5A: FB Manual (Nav: FB Manual)**

| หน้า                | URL                         | บทบาท                                  |
| ------------------- | --------------------------- | -------------------------------------- |
| FB Manual Post      | `/admin/social/templates`   | 5 hook formats · 3 slots · copy+sub_id |
| FB Post Performance | `/admin/social/performance` | clicks + commission 30 วัน             |
| FB VIP Group        | `/admin/fb-vip-group`       | Manual post กลุ่ม VIP · 7 pillars      |
| Community Outreach  | `/admin/outreach`           | 20-30 FB Groups + Pantip               |

**กลุ่ม 5B: FB Page Auto-posting (Nav: FB Page)**

| หน้า            | URL                         | บทบาท                              |
| --------------- | --------------------------- | ---------------------------------- |
| FB Queue        | `/admin/facebook/queue`     | คิวโพสต์ Page รออนุมัติ            |
| FB Analytics    | `/admin/facebook/analytics` | reach / engagement                 |
| FB Log          | `/admin/facebook/log`       | publish log + error                |
| FB Config       | `/admin/facebook/config`    | Kill-switch · Graph API · schedule |
| A/B Experiments | `/admin/experiments`        | ดูผล A/B test                      |

**กลุ่ม 6: Analytics + Reports**

| หน้า            | URL                          | บทบาท                                                                        |
| --------------- | ---------------------------- | ---------------------------------------------------------------------------- |
| Analysis Export | `/api/admin/export?range=7d` | Markdown snapshot 7 มิติ (Revenue/Search/Funnel/SysHealth/Social/Coupons/AI) |
| Coupons         | `/admin/coupons`             | จัดการคูปอง · reported badge · verified_at · success_rate                    |
| SEO Coverage    | `/admin/seo/coverage`        | pSEO quality gate dashboard                                                  |
| DB Monitor      | `/admin/db-monitor`          | DB size + top tables                                                         |
| Deal Quality    | `/admin/deal-quality`        | stale/expired/broken deals                                                   |

### D3. Daily Routine (30 นาที/วัน)

#### ⏰ ช่วงเช้า 09:00 — Health Check (10 นาที)

| ลำดับ | งาน         | หน้า                 | ตรวจอะไร                          |
| ----- | ----------- | -------------------- | --------------------------------- |
| 1     | Admin Home  | `/admin`             | Stats + ไม่มี banner แดง          |
| 2     | Revenue     | `/admin/revenue`     | ยอดวานนี้ vs วันก่อน              |
| 3     | Postback    | `/admin/postbacks`   | 50 รายการล่าสุด — มี error แดงไหม |
| 4     | Link Health | `/admin/link-health` | ลิงก์เสีย count (ปกติ 0-5)        |
| 5     | Security    | `/admin/security`    | Bot flags 24h ผิดปกติไหม          |

#### ☀️ ช่วงสาย 11:00 — Content Slot 1

| ลำดับ | งาน                          | Action                                              |
| ----- | ---------------------------- | --------------------------------------------------- |
| 1     | FB Queue                     | อ่าน caption → Approve/Reject                       |
| 2     | UGC                          | Approve ถ้าถูกต้อง / Reject ถ้าสแปม                 |
| 3     | โพสต์ Page (Slot 11:00)      | `/admin/social/templates` → Copy → Paste ใน FB Page |
| 4     | โพสต์ Group VIP (Slot 11:00) | `/admin/fb-vip-group` → Copy → Paste ใน FB Group    |

**Sub-ID ที่ใช้:**

- Page: `fb_manual_YYYYMMDD_slot1_{hook}`
- Group VIP: `fb_group_vip_{pillar}_YYYYMMDD_seq1`

#### 🌆 ช่วงเย็น 17:00 — Slot 2

โพสต์ Page + Group VIP Slot 2 · ตรวจ Revenue real-time · Reply comment ภายใน 1-2 ชม.

#### 🌙 ช่วงค่ำ 21:00 — Slot 3 + Wrap-up

โพสต์ Page + Group VIP Slot 3 · บันทึก Daily Log · ส่ง Daily Report ให้ Owner

### D4. Weekly Routine (ทุกวันจันทร์ ~1 ชม.)

```
□ Export click_logs รอบอาทิตย์ที่แล้ว — เปรียบ commission จาก IA/AT/Lazada/Shopee
□ ดู Top 5 posts จาก /admin/facebook/analytics
□ ดู Winner pillar จาก /admin/fb-vip-group
□ ดู Funnel drop จาก /admin/funnel
□ วางแผน 21 โพสต์ Page + 35-42 โพสต์ Group VIP สัปดาห์หน้า
□ ดู Seasonal Calendar: Payday (25), Double Day (5/5, 6/6), เทศกาล
□ Archive deals ที่ไม่มี click 14 วัน
□ ตรวจ DB size (/admin → DB Growth widget)
```

### D5. Monthly Routine (สิ้นเดือน ~2-3 ชม.)

```
1. เปิด: https://couponkum.com/api/admin/export?range=30d&format=md (login admin)
2. บันทึกไฟล์ .md
3. ส่งไฟล์ให้ Owner หรือ paste ใน Claude: "วิเคราะห์ข้อมูลนี้และแนะนำ priority งานเดือนหน้า"
4. Reconcile commission รวมเดือนนี้ (IA/AT/Lazada/Shopee) เทียบ /admin/revenue
5. Discrepancy > 5% → เรียก Owner ตรวจ postback
6. Group VIP Review: สมาชิกเพิ่ม, Engagement rate, CTR, Revenue per member
7. Channel Analysis: sub_id breakdown — channel ที่ revenue = 0 ติดต่อ 30 วัน → discontinue
8. ทำ 1-pager แผนเดือนหน้า → ส่ง Owner ขอ approve
```

### D6. Alert Playbook

#### 🔴 CRITICAL — หยุดทำงานอื่น แก้ทันที

| Alert                       | ทำอะไรทันที                                              |
| --------------------------- | -------------------------------------------------------- |
| เว็บล่ม                     | เปิด Maintenance Mode → **โทร Owner**                    |
| ลิงก์ affiliate เสีย > 10   | ปิด Affiliate Redirect → โพสต์แจ้ง → **แชท Owner**       |
| Postback ล้มเหลว > 5 รายการ | ดู error → ปิด Postback Tracking ถ้าสแปม → **แชท Owner** |
| Bot flags > 1000/24h        | ปิด Affiliate Redirect ชั่วคราว → **แชท Owner**          |
| DB > 5 GB                   | **เรียก Owner ทันที — อย่าทำอะไร**                       |

#### 🟠 HIGH — แก้ภายใน 4 ชม.

| Alert                        | ทำอะไร                                                         |
| ---------------------------- | -------------------------------------------------------------- |
| Conversion ตก > 50%          | `/admin/funnel` ดู drop → ตรวจ FB reach → รายงาน Owner ตอนเย็น |
| FB Reach ตก > 50%            | ตรวจโพสต์ผิดกฎไหม → ลด frequency → รายงาน Owner                |
| Group VIP สมาชิกออก > 10/วัน | ตรวจโพสต์ล่าสุด → ลด frequency → รายงาน Owner                  |
| Postback reversal > 10%      | บันทึก + รายงาน Owner ตอนเย็น                                  |

#### 🟡 MEDIUM — บันทึก แก้ตามรอบ

- Stale deal > 50 รายการ → Archive ตอน Weekly
- Coupon expired ยังโชว์ → Manual archive
- UGC queue > 20 → จัดการเพิ่ม 30 นาที
- PM2 restart > 3/วัน → รายงาน Owner สัปดาห์

### D7. Decision Matrix (Admin vs Owner)

| เรื่อง                         | Admin                   | Owner                         |
| ------------------------------ | ----------------------- | ----------------------------- |
| Approve/Reject UGC             | ✅                      | —                             |
| Approve/Reject FB Queue        | ✅ caption ตรง template | ⚠️ ถ้าไม่แน่ใจ                |
| ปิด Affiliate Redirect ฉุกเฉิน | ✅ + แจ้ง               | แจ้งทันที                     |
| Maintenance Mode               | ❌                      | ✅                            |
| Archive deal/coupon            | ✅ expired/broken       | —                             |
| สร้าง deal ใหม่                | ✅ CSV/import           | —                             |
| ลบ deal/coupon                 | ❌                      | ✅                            |
| เปลี่ยน Alert threshold        | ❌                      | ✅                            |
| เปลี่ยน Commission Rate        | ❌                      | ✅                            |
| Reply user comment ใน Group    | ✅ professional tone    | —                             |
| Ban user ใน Group              | ⚠️ spam/abuse ชัด       | ✅ ขอ approve ก่อน 3 ครั้งแรก |

### D8. Bug Report Template (ส่งให้ Owner → Claude Code)

```markdown
## Bug Report — [วันที่]

**Severity**: 🔴 Critical / 🟠 High / 🟡 Medium
**หน้าที่เกิดปัญหา**: /admin/xxx
**Steps to reproduce**:

1. เข้า /admin/xxx
2. กดปุ่ม yyy
3. เกิด error zzz
   **ผลที่คาดหวัง**: ควรแสดง...
   **ผลที่เกิดจริง**: แสดง... / error...
   **Screenshot**: [แนบรูป]
   **Browser**: Chrome 120 / Edge (มือถือ?)
   **เวลา**: 14:32 (Bangkok)
```

---

## PART E — Strategic Roadmap

### E1. Strategic Frame & Revenue Targets

Couponkum ปีแรก = **Lean Revenue Validation** ไม่ใช่ Feature Expansion

| Pillar               | เป้าหมาย                                | Horizon     |
| -------------------- | --------------------------------------- | ----------- |
| **Revenue First**    | พิสูจน์ว่าเงินไหลจริงก่อน scale         | Month 1–3   |
| **Selective Growth** | ขยายเฉพาะ channel ที่พิสูจน์แล้ว        | Month 4–9   |
| **Lean Scale**       | เพิ่ม leverage จาก data — ไม่เพิ่ม cost | Month 10–12 |

| Phase             | Period     | Target                         |
| ----------------- | ---------- | ------------------------------ |
| Launch Validation | Month 1–3  | 1,000–5,000 บาท/เดือน          |
| Growth            | Month 4–6  | 5,000–20,000 บาท/เดือน         |
| Scaling           | Month 7–12 | 20,000–50,000 บาท/เดือน        |
| Break-even        | Month 3+   | ≥ 800 บาท/เดือน (hosting cost) |

**Distribution gap (2026-05-04):** Engine 96% done · Distribution = 0% · ~10 sessions/วัน → ต้องการ ~350 sessions/วัน เพื่อ break-even · คาด Month 4-5 ถ้าทำ FB+SEO ต่อเนื่อง

### E2. Month 1–12 Roadmap Summary

| เดือน | Revenue                                | Infra                             | Feature                                         |
| ----- | -------------------------------------- | --------------------------------- | ----------------------------------------------- |
| 1     | เปิดเว็บ + tracking first              | Hosting + PM2 + Nginx + WAF       | Fix bug / UAT only                              |
| 2     | Sub-ID granularity + conversion report | Alert + log retention             | Improve /go CTA                                 |
| 3     | Break-even push 800–1,500              | DB bloat check + archive          | Break-even dashboard + Daily Featured Coupon v1 |
| 4     | SEO 100+ pages, buying intent          | ISR cache + Cloudflare rate limit | Savings Ladder                                  |
| 5     | Facebook traffic loop + sub-ID         | WebP/AVIF images                  | Trust/Freshness UI v2                           |
| 6     | A/B CTA + funnel fix                   | Query optimization                | Funnel recovery                                 |
| 7     | AI ranking dry-run                     | PostgreSQL partitioning           | Deal alert system                               |
| 8     | Owned media (LINE/email)               | Event aggregation                 | Wallet / saved coupon                           |
| 9     | Rare item growth                       | DB index + proxy scaling          | Rare item engine                                |
| 10    | Scale winning channel only             | Cold storage + lean retention     | AI caption dry-run                              |
| 11    | Increase pSEO quality                  | Tiered CDN cache                  | Content approval flow                           |
| 12    | 20k–50k target push + 11.11/12.12      | AI Sentinel + lean infra review   | Revenue-driven AI                               |

#### Seasonal Revenue Calendar (Thai E-commerce)

| ช่วง       | Event             | Action                                      |
| ---------- | ----------------- | ------------------------------------------- |
| ม.ค.       | New Year Sale     | คูปองปีใหม่ + ของขวัญ                       |
| ก.พ.       | Valentine's Day   | สินค้าคู่รัก + Gift guide                   |
| เม.ย.      | Songkran          | น้ำหอม, ผลิตภัณฑ์อาบน้ำ                     |
| มิ.ย.      | Mid-Year Sale     | Tech + Fashion                              |
| ส.ค.       | Back to School    | อุปกรณ์เรียน                                |
| ก.ย.       | 9.9               | Burst post ทุก channel                      |
| ต.ค.       | 10.10             | Flash deals                                 |
| พ.ย.       | 11.11             | **สำคัญที่สุด** — prepare 4 สัปดาห์ล่วงหน้า |
| ธ.ค.       | 12.12             | ปิดท้ายปี                                   |
| ทุกวัน 25  | Payday            | campaign_multiplier ×1.5                    |
| Double Day | 5.5/6.6/9.9/11.11 | campaign_multiplier ×2.0                    |

### E3. KPI Dashboard

#### Revenue KPI

| Metric                  | วิธีวัด                             | Target                  |
| ----------------------- | ----------------------------------- | ----------------------- |
| รายได้วันนี้            | SUM commission WHERE status=settled | เพิ่มทุกเดือน           |
| Commission by platform  | GROUP BY platform                   | Shopee + Lazada balance |
| Revenue by sub_id       | GROUP BY sub_id                     | ระบุ channel ที่ทำเงิน  |
| Revenue per click (RPC) | revenue ÷ outbound clicks           | > 0.5 บาท/click         |
| Cancel/return rate      | reversed ÷ total                    | < 10%                   |
| Break-even progress     | revenue ÷ 800 × 100                 | > 100% = break-even     |

#### Funnel KPI

| Step                           | Target |
| ------------------------------ | ------ |
| Search → Product click-through | > 30%  |
| Product → Coupon reveal        | > 20%  |
| Reveal → Outbound click        | > 60%  |
| Outbound → Postback            | > 1%   |
| Postback → Settled             | > 85%  |

#### Data Quality KPI

| Metric                        | Alert Threshold              |
| ----------------------------- | ---------------------------- |
| Coupon freshness              | > 24h = amber, > 72h = block |
| Price freshness               | > 48h = amber                |
| Broken link count             | > 10 = alert                 |
| Stale deal (no update 7 days) | > 50 = review                |
| Postback fail rate            | > 5% = alert                 |

#### Infra KPI

| Metric                  | Alert Threshold       |
| ----------------------- | --------------------- |
| DB size                 | > 1 GB = review       |
| API error rate `/api/r` | > 1% = alert          |
| `/api/r` latency P95    | > 500ms = investigate |
| PM2 restart count       | > 3/วัน = root cause  |

### E4. Risk Register

#### Revenue Risks

| Risk                   | โอกาส | Impact   | มาตรการ                          |
| ---------------------- | ----- | -------- | -------------------------------- |
| Shopee API ไม่ approve | สูง   | สูง      | Lazada-first + manual import     |
| Commission rate ถูกลด  | กลาง  | สูง      | diversify (JD/Central)           |
| Affiliate account ban  | ต่ำ   | Critical | อ่าน ToS ทุก 3 เดือน             |
| Postback fail > 10%    | กลาง  | สูง      | monitor + alert ✅               |
| Coupon ผิด/หมดอายุ     | สูง   | กลาง     | freshness gate + source check ✅ |

#### Infra Risks

| Risk                                 | มาตรการ                            |
| ------------------------------------ | ---------------------------------- |
| DB full (price_history bloat)        | Top-Hit only + retention policy ✅ |
| PM2 crash loop                       | PM2 watch + UptimeRobot alert ✅   |
| Cloudflare WAF block legitimate user | whitelist known IPs                |
| Ruk-Com bandwidth exceed             | Cloudflare cache ✅                |

#### Revenue Leak Points

| Leak                               | วิธีแก้                                  |
| ---------------------------------- | ---------------------------------------- |
| Coupon expired ก่อน reveal         | countdown timer ✅                       |
| User reveal แล้วไม่ copy           | Auto-copy + visual feedback ✅           |
| Sub-ID หาย เพราะ platform strip    | ตรวจ sub_id survive redirect chain       |
| Commission ไม่ settle เพราะ cancel | alert เมื่อ payout_status=reversed spike |
| ผู้ใช้ไม่กลับมา                    | Deal alert + LINE opt-in + browser push  |

### E5. Network Diversification Timeline

| Month | Action                                         |
| ----- | ---------------------------------------------- |
| 3     | ลงทะเบียน JD Central affiliate                 |
| 6     | ลงทะเบียน Central Online affiliate             |
| 9     | ประเมิน TikTok Shop affiliate (ถ้า API ready)  |
| 12    | เพิ่ม platform ที่ทำ revenue > 1,000 บาท/เดือน |

### E6. Year 2 Drop Shopping Strategy (Month 13+, Gate-locked)

**Gate Conditions (ตรวจที่ Month 10–12):**

| เงื่อนไข            | ค่าขั้นต่ำ                     |
| ------------------- | ------------------------------ |
| EPC data ครบ        | ≥ 6 เดือน ทั้ง Shopee + Lazada |
| Conversion rate     | ≥ 0.5% บน target category      |
| Monthly revenue     | ≥ 20,000 บาท/เดือน             |
| Top category เสถียร | Top 3 EPC ≥ 3 เดือนติด         |

**ถ้าผ่านไม่ครบ → เลื่อนออกไปอีก Quarter**

| Task    | Scope                               | Gate                      |
| ------- | ----------------------------------- | ------------------------- |
| `DS-01` | EPC Analysis Report                 | EPC ≥ 6M                  |
| `DS-02` | Shopee Seller Store pilot 10–20 SKU | revenue ≥ 20K/mo          |
| `DS-03` | Margin vs EPC Dashboard             | DS-02 live                |
| `DS-04` | Scale platform ที่ 2                | DS-03 margin > commission |
| `DS-05` | Own Checkout (Omise + Order DB)     | GMV > 50K/mo              |

---

## PART F — Completed Task Archive

> ส่วนนี้สำหรับ audit trail และ reference สำหรับโปรเจคใหม่ในอนาคต

### F1. Launch Gate History (Chronological)

| Gate                             | Date       | Result                                                          |
| -------------------------------- | ---------- | --------------------------------------------------------------- |
| `AUTH-RESET-PASSWORD-FIX`        | 2026-04-30 | ✅ `/auth/reset-password` handles Supabase recovery             |
| `DB-MIGRATION-VPS` / `TASK 4.9a` | 2026-04-30 | ✅ PostgreSQL cutover complete; `DATABASE_URL` targets local PG |
| `TASK 4.9` Staging Smoke         | 2026-04-30 | ✅ 15/15 PASSED; UUID guard added                               |
| `REV-POSTBACK-1`                 | 2026-05-01 | ✅ 4/4 PASSED — Lazada GET/POST + IA GET + Shopee POST          |
| `MOCK-DATA-REMOVAL`              | 2026-05-01 | ✅ commit `a406a36`; runtime mock branches removed              |
| `POSTLIVE-00`                    | 2026-05-01 | ✅ 5/5 PASSED                                                   |
| `TASK 5.0` PROMOTE               | 2026-05-01 | ✅ production traffic open; `/api/r` → HTTP 302                 |

### F2. Key Workstream Completions

#### Infrastructure & Security

| Task                 | Date          | Scope                                                                                                                                                                                                         |
| -------------------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `EMAIL-INFRA-1`      | 2026-05-05    | Cloudflare Email Routing enabled · partner@couponkum.com active · DNS records (MX×3 + DKIM + SPF) configured · forward → yopinm@gmail.com verified                                                            |
| `SHOPEE-API-APPLY-1` | 2026-05-05    | Submitted Shopee Affiliate Open API form (form/6118) · contact email: partner@couponkum.com · awaiting 7-day review (ETA 2026-05-14)                                                                          |
| `AFFNET-IA-API`      | 2026-05-05    | IA REST API fully active · POST /authenticate (key=general + IA*REST_API_KEY secret) → 2h cached token · /offers/all sync → upsert products · cron 0 */6 \_ \* \* on VPS · /deeplink/generate ready (Phase 2) |
| `ADMIN-KPI-1`        | 2026-05-05    | 8 KPI cards on /admin: revenue_today · outbound_clicks · conversion_rate · postback_fail_rate · broken_links · pageviews_today · top_sub_id · top_deal — responsive 4/2 cols                                  |
| `SHIP-MIGRATE-1`     | 2026-05-05    | ALTER TABLE products ADD COLUMN shipping_fee NUMERIC(8,2) DEFAULT NULL — live on VPS                                                                                                                          |
| `HOSTING-SETUP`      | 2026-04-29    | PM2 cluster + Nginx + Let's Encrypt + Cloudflare Full (Strict) + Meta webhook                                                                                                                                 |
| `S2-1-PROD`          | 2026-04-29    | Meta webhook registered; GET verify passes; `feed` subscribed                                                                                                                                                 |
| `VULN-001`           | 2026-04-24    | Dropped permissive `user_profiles` RLS policy                                                                                                                                                                 |
| `SEC-RLS-FIX-1`      | 2026-04-27    | Scoped `click_logs`/`search_logs` INSERT policies; pinned function `search_path`                                                                                                                              |
| `SEC-PAYOUT-STATE`   | 2026-04-24    | `payout_status` (pending→settled→reversed) added                                                                                                                                                              |
| Phase S (7 vulns)    | 2026-04-19    | Admin key, SSRF, open redirect, info leak, postback validation                                                                                                                                                |
| Phase S2 (3 tasks)   | 2026-04-20–29 | Meta webhook signature, OAuth redirect guard, sanitizer                                                                                                                                                       |

#### DB Migration (all done 2026-04-30)

| Task                     | Scope                                                                     |
| ------------------------ | ------------------------------------------------------------------------- |
| `DB-MIG-1-SETUP`         | `postgres` package + `src/lib/db.ts` singleton                            |
| `DB-MIG-2-API-ROUTES`    | API routes → direct PostgreSQL                                            |
| `DB-MIG-3-ACTIONS`       | Admin server actions → direct PostgreSQL                                  |
| `DB-MIG-4-LIB-PAGES`     | Libs/pages/cron → direct PostgreSQL                                       |
| `DB-MIG-5-PUBLIC-ROUTES` | Public pages + simple API → direct PostgreSQL                             |
| `DB-MIG-7-ADMIN-SIMPLE`  | Simple admin pages/actions → direct PostgreSQL                            |
| `DB-MIGRATION-VPS`       | VPS PostgreSQL 16 install + Supabase dump import + `DATABASE_URL` cutover |

#### Revenue & Affiliate Tasks Done

| Task                    | Date       | Key outcome                                                                                   |
| ----------------------- | ---------- | --------------------------------------------------------------------------------------------- |
| `AFFNET-1`, `AFFNET-2`  | 2026-04-25 | Sub ID adapter + network tag import                                                           |
| `AFFNET-2.1`            | 2026-05-03 | Network consistency guard for import                                                          |
| `AFFNET-2.2`            | 2026-05-03 | AccessTrade postback route + invol.pe fix                                                     |
| `AFFNET-7`              | 2026-05-04 | Revenue tracer: network/outgoing_param enrichment                                             |
| `AFFNET-8`              | 2026-05-04 | Network-aware EPC dashboard                                                                   |
| `AFFNET-9`              | 2026-05-03 | Affiliate Import QA Checklist; Sephora AT UAT ✅                                              |
| `AFFNET-10`             | 2026-05-04 | Cross-network payout optimizer widget                                                         |
| `CSV-UAT-1`             | 2026-05-03 | Shopee + AT CSV import UAT; redirect chain verified                                           |
| `BUG-REDIRECT-1`        | 2026-05-03 | ProductCard → `/deals/[id]`; no auto-redirect                                                 |
| `HOTFIX-SHOPCSV-1`      | 2026-05-04 | Deactivated 20 Shop Offer CSV products                                                        |
| `HOTFIX-LINE-1`         | 2026-05-03 | Fixed LINE deep-link double-@ bug                                                             |
| `ADMIN-EXPORT-1`        | 2026-05-04 | `/api/admin/export` 5-dim Markdown snapshot                                                   |
| `ADMIN-COUPON-REPORT-1` | 2026-05-06 | `/admin/coupons` reported badge + verified_at + success_rate; AdminNav Coupons link           |
| `REPORT-FEED-ADMIN-1`   | 2026-05-06 | Wallet report button feeds downvote → admin ⚑ counter                                         |
| `EXPORT-COUPON-1`       | 2026-05-06 | Export Section 6 Coupons (inventory/votes/reported/wallet) → 7 sections total                 |
| `HOMEPAGE-TRENDING-1`   | 2026-05-06 | "🔥 กำลังฮิตตอนนี้" auto from click_logs 7d; fallback to QUICK_SEARCHES                       |
| `HOMEPAGE-STORES-1`     | 2026-05-06 | "🏪 ร้านค้าแนะนำ" admin-managed via recommended_stores table + /admin/recommended-stores CRUD |

#### POSTLIVE Tasks Done

| Task            | Date       | Scope                                                  |
| --------------- | ---------- | ------------------------------------------------------ |
| `POSTLIVE-00`   | 2026-05-01 | Production smoke 5/5                                   |
| `POSTLIVE-00.1` | 2026-04-27 | Sub-ID Survival Test (22 tests)                        |
| `POSTLIVE-00.2` | 2026-04-27 | End-to-End Revenue Tracer API + UI panel               |
| `POSTLIVE-01`   | 2026-04-25 | Break-even Revenue Tracker                             |
| `POSTLIVE-02`   | 2026-05-01 | UptimeRobot webhook receiver (owner dashboard pending) |
| `POSTLIVE-03`   | 2026-04-27 | Revenue by Sub-ID + `converted_at` + `latency_seconds` |
| `POSTLIVE-04`   | 2026-05-02 | DB Growth Monitor                                      |
| `POSTLIVE-05`   | 2026-05-02 | Daily Deal Quality Report                              |
| `POSTLIVE-06`   | 2026-05-02 | Lean Data Retention Policy + VPS cron                  |
| `POSTLIVE-07`   | 2026-04-25 | Commission Rate Map                                    |
| `POSTLIVE-08`   | 2026-04-29 | pSEO Revenue Matrix                                    |
| `POSTLIVE-09`   | 2026-04-29 | ISR Cache                                              |
| `POSTLIVE-12`   | 2026-04-25 | Structured Data (Product schema)                       |
| `POSTLIVE-16`   | 2026-04-27 | PWA Manifest + Service Worker stub                     |
| `POSTLIVE-17`   | 2026-04-30 | Browser Push Notification stub (dormant until Month 9) |
| `POSTLIVE-26`   | 2026-05-03 | Daily Featured Coupon v1 (cron + admin coupon page)    |
| `POSTLIVE-27`   | 2026-05-03 | Social Proof Aggregate Counter strip                   |
| `POSTLIVE-28`   | 2026-05-03 | Rare Coupon Popup (no LINE)                            |
| `POSTLIVE-29`   | 2026-05-03 | Recent Viewed + Price Drop Alert (localStorage)        |
| `POSTLIVE-30`   | 2026-05-03 | Facebook Post Queue Template Auto-Posting              |
| `POSTLIVE-31`   | 2026-05-04 | Pre-Campaign Cookie Dropping                           |
| `POSTLIVE-32`   | 2026-05-04 | Savings Calculator Export Widget                       |
| `POSTLIVE-33`   | 2026-05-04 | B2B Influencer Sub-ID Generator                        |

#### Wallet & LINE Tasks Done

| Task              | Date       | Scope                                                                |
| ----------------- | ---------- | -------------------------------------------------------------------- |
| `WALLET-PUB-1`    | 2026-05-03 | Public Wallet `/wallet` — top 5 curated coupons                      |
| `WALLET-LINE-1`   | 2026-05-04 | LINE Chatbot Subscribe Flow (Reply API, Free); webhook ✅ registered |
| `WALLET-ALGO-1`   | 2026-05-03 | Campaign Multiplier Injection (Payday ×1.5, Double Day ×2.0)         |
| `WALLET-GUEST-1`  | 2026-05-04 | Guest ID `ck_guest_id` cookie + LINE webhook mapping                 |
| `COUPON-EXPIRE-1` | 2026-05-03 | Auto-Expire Cron (23:55 ICT)                                         |

#### Distribution Tasks Done

| Task       | Date       | Scope                                                                                |
| ---------- | ---------- | ------------------------------------------------------------------------------------ |
| `DIST-01`  | 2026-05-04 | FB Manual Posting Playbook (5 hook formats, slot scheduler, sub-ID generator)        |
| `DIST-02`  | 2026-05-04 | Programmatic SEO Quick-Start Pack (49 total pSEO pages); IndexNow; GSC ✅            |
| `DIST-03`  | 2026-05-04 | Community Outreach Engine (10 seed groups, 4 caption formats, cooldown guard)        |
| `DIST-03B` | 2026-05-04 | FB VIP Group Console (2 tables, 14 seed templates, 7 pillars, pillar balance UI)     |
| `DIST-04`  | 2026-05-04 | Trust & Conversion Sprint (click_count badge, freshness label, savings pill, haptic) |

#### Infrastructure Tasks Done

| Task            | Date       | Scope                                                     |
| --------------- | ---------- | --------------------------------------------------------- |
| `TASK 4.3`      | 2026-04-29 | AVIF/WebP image formats                                   |
| `TASK 4.5`      | 2026-05-03 | data-archive extended to 9 tables                         |
| `TASK 4.7`      | 2026-05-03 | Admin loading skeleton + `compress: true`                 |
| `TASK 4.8`      | 2026-05-03 | Proxy rotation library `src/lib/proxy-pool.ts` (dormant)  |
| `TASK 5.7`      | 2026-05-03 | Affiliate Link Monitor wired to VPS crontab (68/68 alive) |
| `UX-STATSBAR-1` | 2026-05-03 | Green ping dot + countdown MM:SS นับถอยหลัง               |

#### Session History (condensed)

| Session              | Date          | Highlight                                                                                                                                                                                                                  |
| -------------------- | ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| S1 (Pre-launch prep) | 2026-04-22–24 | UI-3A/B/C/D, header UI, UX-REVEAL, REV-01/02, TRUST-1, security audit                                                                                                                                                      |
| S2 (Security + DB)   | 2026-04-25–27 | Phase S2 close, DB migration series, AFFNET-1/2, POSTLIVE pre-coded                                                                                                                                                        |
| Hosting Setup        | 2026-04-29    | VPS live, Nginx, PM2, Let's Encrypt, Cloudflare Full Strict, Meta webhook                                                                                                                                                  |
| S3 (DB + Smoke)      | 2026-04-30    | DB migration VPS complete, TASK 4.9 smoke 15/15, REV-POSTBACK-1 4/4                                                                                                                                                        |
| Go-Live              | 2026-05-01    | POSTLIVE-00 ✅, TASK 5.0 ✅ production traffic open                                                                                                                                                                        |
| S4                   | 2026-05-02–03 | TASK 4.5/4.7/4.8/5.7; POSTLIVE-26–30; WALLET series; AFFNET-2.1/2.2/9                                                                                                                                                      |
| S5                   | 2026-05-04    | DIST-01–04; AFFNET-7/8/10; WALLET-GUEST-1; POSTLIVE-31–33; GSC ✅; IndexNow                                                                                                                                                |
| S6                   | 2026-05-04    | Blueprint merge (4 docs → 1); AFFNET-IA-API SAFE MODE scaffold                                                                                                                                                             |
| S8                   | 2026-05-05    | ADMIN-KPI-1; SHIP-MIGRATE-1; destinationLabel fix; 11 AT merchants; partner@couponkum.com                                                                                                                                  |
| S9                   | 2026-05-05    | AFFNET-IA-API activated: correct auth (POST /authenticate) + /offers/all + VPS cron 0 _/6 _ \* \*                                                                                                                          |
| S10                  | 2026-05-05    | TRUST-BADGE-1 (price_checked_at badge on ProductCard); LIVECPN-2 (verified_at+success_rate on CouponCard); POSTLIVE-09 (ISR 1800s + Cloudflare WAF rate limit + Bot Fight Mode); Lazada LiteApp ❌ ต้องใช้ open.lazada.com |

### F3. Untracked Task Registry

> งานที่ทำนอก 128-task denominator (สำหรับ reference เท่านั้น)

**UI & Conversion (untracked):**
`REDIRECT-1` · `LINK-1` · `FRESH-1` · `UGC-MOD` · `UI-2` thru `UI-3D` · `CONV-1-5` · `UI-HEADER-1-3` · `UX-REVEAL` · `HEADER-NAV-POLISH` · `UAT-MOBILE`

**Admin & Control (untracked):**
`ADMIN-CONTROL-1` · `ADMIN-KILL-SWITCH-1` · `ADMIN-POSTBACK-MONITOR-1` · `ADMIN-MAINTENANCE-1` · `ADMIN-ALERTS-1` · `ADMIN-ABTEST-1` · `ADMIN-NAV-2` · `ADMIN-TOOLS-HUB-1` · `ADMIN-BOOKMARKLET-1` · `ADMIN-PREFLIGHT-PAGE` · `ADMIN-TIMEZONE-1` · `ADMIN-ALERT-BANNER-1`

**Facebook Safety (untracked):**
`FB-SECRET-ROTATE` · `FB-PROD-KILL-SWITCH` · `FB-REPLY-IDEMPOTENCY` · `FB-DEAL-FRESHNESS-GUARD` · `FB-TOS-SIGNOFF` · `FB-RATE-GUARD` · `FB-SCHEDULE-1` · `FB-CAMPAIGN-DETECT-1`

**Security (untracked):**
`VULN-001` · `SEC-RLS-FIX-1` · `SEC-PAYOUT-STATE` · `SEC-MOCK-GUARD` · `SEC-LAZADA-IMPORT` · `SEC-AI-BASELINE-GATE-1`

**DB Migration (untracked):**
`ADMIN-PREFLIGHT-PAGE` · `DB-MIG-1-SETUP` thru `DB-MIG-7-ADMIN-SIMPLE` · `DB-MIGRATION-VPS-SCRIPTS`

**Revenue & SEO (untracked):**
`REV-01` · `REV-02` · `TRUST-1` · `UX-REVEAL` · `REV-OWNED-MEDIA-1` · `FUNNEL-LEAK` · `SEO-DISCLOSURE-ABOVEFOLD-1` · `SEO-FB-APPID-1` · `QA-E2E-SMOKE-1`

**Shopee & TikTok (untracked):**
`SHOP-PENDING-3` · `CROWD-COUPON-1` · `TT-CONTENT-1` · `TT-MYTHBUST-1` · `REV-EPC-1` · `SHOP-API-READY-1`

**Tailwind Canonical:** `TAILWIND-CANONICAL-1` thru `TAILWIND-CANONICAL-4`

**Docs:** `DOCS-AFFNET-HARDENING` · `DOCS-ROADMAP-SYNC`

---

## PART G — V15 Template Store (เพิ่ม 2026-05-07)

> ดูรายละเอียด spec เต็มที่ `core/Coupon_TP.MD`

### G1. Overview
V15 เพิ่ม **Section 1: Template Store** (PDF planner ฿10-50) บนโครงเดิม Coupon Affiliate (Section 2)
- Revenue: PromptPay ตรง (ไม่ผ่าน affiliate)
- Stack: เดิมทั้งหมด + `promptpay-qr` + `qrcode` npm
- Storage: VPS local `/uploads/templates/` (Cloudflare cache)
- Auth: Supabase LINE OAuth (provider_id = LINE User ID)

### G2. Routes Live (อัพเดต Session 30 — 2026-05-09)
| Route | บทบาท |
|---|---|
| `/templates` | Template list + pricing callout (marginal ฿20→฿8→฿7) |
| `/templates/[slug]` | Template detail + engine preview (checklist S1+S2 / planner P1) |
| `/checkout/[slug]` | LINE auth → PromptPay QR → Omise polling → auto-redirect |
| `/d/[token]` | Download page (validate token 24h / max 3x / revoke) |
| `/orders` | Customer order history + download buttons |
| `/cart` | Cart page (marginal pricing · tier progress bar) |
| `/analysis` | Personal spend analysis (by category + bar chart) |
| `/admin/templates` | Template list with category badge + engine badge |
| `/admin/templates/new` | 6-step wizard (Engine: Checklist / Planner / docx / Upload / Clone) |
| `/admin/templates/[id]/edit` | Edit metadata + Approve draft_preview |
| `/admin/templates/[id]/revise` | Edit engine content + re-generate PDF (DC-8 🔲 planned) |
| `/admin/templates/[id]/revisions` | Revision history (DC-8 🔲 planned) |
| `/admin/catalogs` | Category manager (add/delete) |
| `/admin/orders` | Order list + verify + revoke + LINE notify |
| `/admin/template-analytics` | KPI + 14-day daily sales + per-template revenue |

### G3. API Endpoints
| Method | Route | บทบาท |
|---|---|---|
| POST | `/api/orders` | Create order + gen PromptPay QR |
| POST | `/api/orders/[id]/claim-paid` | Trust-based claim → token → LINE push |
| GET  | `/api/checkout/[uid]/status` | Omise polling → mark paid → issue tokens |
| POST | `/api/checkout/[uid]/refresh-qr` | QR หมดอายุ → charge ใหม่ |
| POST | `/api/admin/templates/upload-pdf` | PDF upload to VPS |
| POST | `/api/admin/templates/upload-docx` | .docx → mammoth → puppeteer PDF + extractToc |
| POST | `/api/admin/templates/generate-engine` | engine_type + engine_data → auto-generate docCode → puppeteer PDF |

### G4. Payment Flow (Trust-based)
```
/templates/[slug] → กด "ซื้อ" → /checkout/[slug]
→ LINE OAuth (auto) → POST /api/orders → PromptPay QR
→ User โอนเงิน → กด "โอนแล้ว" → POST /api/orders/[id]/claim-paid
→ status=paid · gen download_token (24h / 3x)
→ LINE push link → customer
→ LINE push notify → owner (OWNER_LINE_USER_ID env)
→ /d/[token] → download
```

### G5. Anti-fraud
- Rate limit: claims ≥5/24h → fraud_flag=suspicious (ไม่ส่งลิงก์)
- Revoke: admin กด → token=NULL + LINE notify customer
- Owner notify: ทุก claim → LINE push (ต้องตั้ง OWNER_LINE_USER_ID)
- Fraud gap pending: ลูกค้าไม่จ่ายแต่ได้ไฟล์ → long-term: bank webhook / slip OCR

### G6. DB Tables (V15 — อัพเดต Session 30)
```
templates             — slug, title, tier, price_baht, pdf_path, thumbnail_path,
                         toc_sections JSONB, watermark_text TEXT,
                         engine_type TEXT ('checklist'|'planner'|NULL),
                         engine_data JSONB,
                         document_type TEXT, status (draft|draft_preview|published)
template_categories   — slug, name, emoji
template_category_links — many-to-many
template_tags         — auto-tags (bestseller/new/trending/premium/free/staple)
orders                — order_number (CK-YYYYMMDD-NNNN via order_seq),
                         order_type ('cart'|'single'|'pack'),
                         customer_line_id, amount_baht, status,
                         download_token, download_expires_at, download_count
order_items           — order_id → template_id (cart)
carts / cart_items    — session-based (J18)
pack_credits          — ฿20=2 / ฿50=10 / ฿100=25 credits, FIFO, 90d expire
template_revisions    — [DC-8 planned] id, template_id, revision_number,
                         engine_data JSONB, pdf_path, change_note, created_at
free_template_grants  — LINE add friend → free template (pending)
template_searches     — search analytics
```

### G7. ENV Vars (V15 additions)
| Var | Value | Status |
|---|---|---|
| `OWNER_PROMPTPAY` | `0948859962` | ✅ set in VPS .env.local |
| `OWNER_LINE_USER_ID` | `Uxxxxxxxxxx` | ⏳ pending — ต้องหาจาก LINE webhook |

---

### G8. Engine System (DC-5/DC-6 — Session 30 · 2026-05-09)

> Text-to-PDF engine ที่สร้างเอกสาร PDF สมบูรณ์จากข้อมูลที่ admin กรอก (ไม่ผ่าน .docx)

#### Engine Types
| Type | Form | Sections | Generator |
|---|---|---|---|
| `checklist` | `ChecklistEngineForm` | 5 sections (Header / Purpose / Items / Remarks / Sign-off) | `lib/engine-checklist.ts` |
| `planner` | `PlannerEngineForm` | 4 pillars (Goal / Execution / Tracking / Idea) | `lib/engine-planner.ts` |

#### DocCode Format
- Checklist: `CK-YYYYMMDD-XXXX` (เช่น CK-20260509-0001)
- Planner: `TP-YYYYMMDD-XXXX`
- XXXX = COUNT(*) ของ engine_type นั้นใน DB + 1 (query ตอน generate)
- **คงเดิมทุก revision** — ไม่ re-generate เมื่อแก้ไขเนื้อหา

#### PDF Design Rules
- ไม่แสดง docCode ในตัวเอกสาร (header/grid/footer) — เก็บใน DB เท่านั้น
- หมวดหมู่ (catalog) แสดงแทนรหัสเอกสารใน Section 1 grid + header meta
- ผู้จัดทำ = เส้นว่างสำหรับลูกค้ากรอกเอง
- Footer: `ชื่อเทมเพลต · หมวดหมู่` (ซ้าย: couponkum.com)
- Watermark: CSS diagonal `::before` (optional)

#### Revision System (DC-8 — Planned)
```
table: template_revisions
  revision_number  — เพิ่มทุกครั้งที่ approve revision
  engine_data      — snapshot ของ engine_data ณ เวลานั้น
  pdf_path         — PDF ที่ generate ตอน revision นั้น
  change_note      — admin บันทึกว่าแก้อะไร
  created_at

Policy:
  - templates.pdf_path = latest เสมอ (1 ไฟล์)
  - ลูกค้าที่ download ใหม่ = ได้ version ล่าสุด
  - history ดูได้ใน /admin/templates/[id]/revisions
```

---

_Compiled: 2026-05-04 by Yopin + Claude Sonnet 4.6_
_V15 Template Store section added: 2026-05-07 Session 19_
_G8 Engine System added: 2026-05-09 Session 30_
_อ้างอิง: Couponkum_Manual.MD + Roadmap_Couponkum_AfterGoLive.md + DataSource.MD + Admin_Job_Routine.md + V13 task archive_
