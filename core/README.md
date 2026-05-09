# Summary — Read This First Before Coding

> **For Claude Code (Thai) · Created 2026-05-07 · Updated 2026-05-07 (merged)**
> **Canonical spec:** `core/Coupon_TP.MD` (merged & consolidated — ใช้ไฟล์นี้เป็น source-of-truth)
> ทุกเอกสารเก่าใน `couponkum/core/` **ต้องเทียบกับ `Coupon_TP.MD`** — ถ้าขัดแย้ง → `Coupon_TP.MD` ชนะ

---

## 0. Read Order (5 นาที)

1. **`core/README.md`** ← ไฟล์นี้ (อ่านก่อน — สรุป conflicts + open questions + first-day action)
2. **`core/Coupon_TP.MD`** ← canonical spec (อ่านครบก่อนเขียนโค้ด)
3. ดู `core/Couponkum_Blueprint.md` Part A2-A9 + Part B + Part C เฉพาะตอนต้องการ technical reference
4. ห้ามอ่านเอกสารใน "Frozen list" ด้านล่างเป็น source-of-truth — superseded แล้ว

---

## 1. Document Hierarchy (Frozen Order)

| Priority | Doc | Status |
|---|---|---|
| 🟢 1 | **`core/Coupon_TP.MD`** (V15 — Template Store + Coupon · merged 2026-05-07) | **CANONICAL** |
| 🟡 2 | `core/Couponkum_Blueprint.md` Part A-D (technical reference) | KEEP — reference only |
| ❄️ 3 | `core/Project_Driven_V14_Couponfirst.md` | **FROZEN — superseded** |
| ❄️ 4 | `core/Couponkum_New_Roadmap.md` | **FROZEN — superseded** |
| ❄️ 5 | `core/Couponkum_Blueprint.md` Part E1.5 (Break-Even ROI) | **FROZEN — coupon-only ROI invalid for V15** |
| ❄️ 6 | `core/Couponkum_Project_Driven_V13.md` | FROZEN (legacy) |

> **กฎ:** ถ้า `Coupon_TP.MD` พูดอย่างหนึ่ง · doc อื่นพูดอีกอย่าง → ทำตาม `Coupon_TP.MD` เสมอ

---

## 2. Conflicts Resolved (10 จุด)

### C1: Strategy / Niche
- ❄️ V14 / New_Roadmap: Coupon-First (coupon = main revenue)
- 🟢 **Coupon_TP.MD: Template Store = main, Coupon = lead magnet**
- ✅ **Resolution:** Template Store เป็นหัวใจหลัก · Coupon affiliate ลด priority เป็น secondary funnel

### C2: Slogan
- ❄️ V14: "คูปองที่ใช้ได้จริง · คำนวณให้ว่าคุ้มสุด"
- 🟢 **Coupon_TP.MD: "คุ้มทุกการใช้จ่าย · ง่ายทุกการวางแผน"**
- ✅ **Resolution:** Update slogan ใน Footer.tsx, login page, campaign-context.ts, page.tsx metadata, README ทั้งหมด

### C3: Homepage Structure
- ❄️ V14 page.tsx (จาก patch zip): Coupon-First hero + Featured Coupons grid + Vertical chips + Calculator teaser
- 🟢 **Coupon_TP.MD: 2-section structure — Section 1 Template Store ด้านบน · Section 2 Coupon ด้านล่าง**
- ✅ **Resolution:** Restructure page.tsx อีกครั้ง (V14 patch ใช้เป็น base ได้ แต่ลำดับ section ต้องสลับ — ให้ template ขึ้นก่อน)

### C4: Sprint Priorities (28 วัน 7 พ.ค. → 4 มิ.ย.)
- ❄️ V14: AFFNET-AT-CPN ก่อน (W1) → Calculator/Stacking → Vertical seeds
- 🟢 **Coupon_TP.MD: DB schema + admin templates + payment flow ก่อน → coupon AT-CPN ทำคู่ขนาน W1-W2 ถ้ามีเวลา**
- ✅ **Resolution:** Sprint แผนใหม่ใน `Coupon_TP.MD` Section 7 — ทำตามนั้น

### C5: Calculator Teaser
- ❄️ V14 page.tsx: hero CTA "🧮 คำนวณคุ้มจริงไหม" → /search?q=คำนวณคุ้มสุด
- 🟢 **Coupon_TP.MD: Calculator (KUMCALC) defer post-deadline**
- ✅ **Resolution:** ซ่อน Calculator CTA ในหน้าแรก · ลบออกหรือ wrap `false &&` · revisit Q3 2026

### C6: Featured Coupons Grid
- ❄️ V14 page.tsx: Centerpiece dark card grid (top 8 verified coupons)
- 🟢 **Coupon_TP.MD: Template catalog เป็น centerpiece · coupon section ลำดับล่าง**
- ✅ **Resolution:** Featured Coupons grid ลงไป Section 2 (ด้านล่าง template catalog)

### C7: Vertical Browse Chips
- ❄️ V14 page.tsx: 8 chips (Shopee/Lazada/GrabFood/LineMan/foodpanda/Netflix/AIS/บัตรเครดิต) บนหน้าแรก
- 🟢 **Coupon_TP.MD: Section 2 (coupon area)**
- ✅ **Resolution:** ย้าย chips ไป Section 2

### C8: ROI Plan (Blueprint E1.5)
- ❄️ Blueprint E1.5: 16 revenue channels (R1-R16) ทั้งหมด coupon-affiliate
- 🟢 **Coupon_TP.MD: Template Store revenue ตรง 100% · Coupon เป็นรายได้ secondary**
- ✅ **Resolution:** Blueprint E1.5 ❄️ frozen · ROI ใหม่ = Template sales primary + Coupon affiliate secondary (ดู Coupon_TP.MD Section 1.4 + 7)

### C9: Affiliate Networks Plan (New_Roadmap Section 6)
- ❄️ New_Roadmap: 8 networks ต้องสมัคร (Awin/Rakuten/Impact/TradeDoubler/CJ/TikTok Shop/JD/Lazada AMS) — parallel กับ sprint
- 🟢 **Coupon_TP.MD: Coupon = secondary · network registration = post-launch ถ้า template revenue ผ่าน gate**
- ✅ **Resolution:** Defer N1-N8 registrations ทั้งหมด · register หลัง Section 1 (template) ไป production และมี traffic ฐาน

### C10: Existing Cron Disable
- ❄️ V14 / New_Roadmap: ปิด `rare-item-score`, `price-history`, `price-sync`↓weekly, `lazada-conversion-import`↓weekly
- 🟢 **Coupon_TP.MD: ไม่กล่าวถึง — แต่ implicit เห็นด้วย (resource saving สำหรับ template store)**
- ✅ **Resolution:** เก็บคำสั่งปิด cron ตาม V14 — ทำใน W1 day 1

---

## 3. Open Questions (Owner ต้องตอบ — ก่อน W1 day 2)

> Coupon_TP.MD Section 10 มี Q1-Q10 — รวมกับ Header.tsx fix จาก V14 = ทั้งหมด **11 คำถาม**

### 🔴 Critical (ต้องตอบก่อนเริ่มเขียนโค้ด)
| # | Question | สำหรับ |
|---|---|---|
| Q1 | ~~PromptPay receiver number ของ owner?~~ | ✅ **0948859962** |
| Q2 | ~~Owner LINE User ID?~~ | ✅ **yopinm** |
| Q3 | LINE OA bot account: ใช้ของเดิม (มีคูปอง) หรือสร้างใหม่? | ✅ ใช้ของเดิม |
| Q4 | Free template lead magnet เลือกตัวไหน? | ✅ Daily Planner ฿0 |

### 🟡 Important (ตอบก่อน W1 จบ)
| # | Question | สำหรับ |
|---|---|---|
| Q5 | URL pattern ของ download — `/d/[token]` (default) หรืออื่น? | route design |
| Q6 | Slip image storage — VPS local OK ไหม? | OK (default) |
| Q7 | Refund policy — กี่วัน? | 7 วัน ก่อน download (default) |
| Q8 | PDF upload size limit? | 20 MB (default) |
| Q9 | Order number format? | CK-YYYYMMDD-XXXX (default) |

### 🟢 Nice-to-decide
| # | Question | สำหรับ |
|---|---|---|
| Q10 | Header.tsx ลบ `!isHome` condition? | search box โผล่บน home (default ✅ ทำเลย) |
| Q11 | สร้าง `/admin/templates/create` AI-helper UI ใน sprint นี้ไหม หรือใช้ JSON config + manual upload ก่อน? | manual ก่อน (default) — AI helper Q3 |

---

## 4. Sprint Plan (28 วัน — Coupon_TP.MD canonical)

```
W1 (7-13 พ.ค.) — Foundation
  Day 1: Apply V14 patch zip + Header.tsx fix + ปิด 4 cron + commit/deploy
  Day 2: DB migrations (templates + categories + orders + free_grants)
  Day 3: /admin/templates CRUD UI
  Day 4: Owner เริ่มสร้าง template ที่ 1-2
  Day 5: PromptPay QR + slip upload API
  Day 6: /checkout/[slug] + payment flow UI
  Day 7: /admin/orders verify queue + LINE notify owner

W2 (14-20 พ.ค.) — Catalog Public
  Day 8: /templates catalog page
  Day 9: /templates/[category]/[slug] detail
  Day 10: Owner สร้าง template ที่ 3-6
  Day 11: One-time signed download URL
  Day 12: LINE add friend → free template flow
  Day 13: /admin/analytics dashboard
  Day 14: Auto-tag cron (bestseller/trending)

W3 (21-27 พ.ค.) — Polish + Coupon Integration
  Day 15: Homepage 2-section redesign (template top + coupon bottom)
  Day 16: Smart form fill (PDF AcroForm browser-side)
  Day 17: Owner สร้าง template ที่ 7-10
  Day 18: LINE OA daily digest (template + coupon)
  Day 19: Search analytics + search-gap report
  Day 20: Coupon section reposition as lead magnet
  Day 21: First sale UAT — owner ทดลองสั่งจริงครบ flow

W4 (28 พ.ค. - 3 มิ.ย.) — Launch + Buffer
  Day 22-23: Bug fix + redeploy
  Day 24: SEO meta + sitemap update
  Day 25: Slip OCR optional (Tesseract) — defer ถ้าไม่ทัน
  Day 26: Soft launch — FB post + LINE OA broadcast
  Day 27-28: Buffer + monitor + git tag v15.0
  🛑 4 มิ.ย.: Token deadline
```

### What dropped from V14 sprint
- ❄️ AFFNET-AT-CPN — defer หรือ optional add ใน W2 ถ้าเวลามี
- ❄️ COUPON-SCRAPE-1, COUPON-BANK-LANE-1 — defer post-deadline
- ❄️ KUMCALC-1 (Calculator), STACK-1 (Stacking) — defer Q3
- ❄️ Vertical seeds (food/ride/stream/telco) — defer post-deadline
- ❄️ Network registrations (Awin/Rakuten/etc.) — defer post template launch

---

## 5. Hard Constraint (FROZEN)

> Total monthly cost = **856 บาท เท่าเดิม** ห้ามเพิ่ม

### ✅ Allowed (free / already paid)
- VPS Ruk-Com 856/mo (ปัจจุบัน)
- Cloudflare (paid annually แล้ว — ไม่ต้อง action)
- LINE OA Free (300 broadcast/mo · unlimited 1:1)
- Sentry Free
- Postgres self-host on VPS
- npm OSS: `pdf-lib`, `promptpay-qr`, `pdfjs-dist`, etc.
- Tesseract OCR self-host (optional W4)

### ❌ Banned
- Stripe / Omise / paid payment gateway
- Claude/OpenAI API ใน production
- AWS S3 / Cloudinary
- Algolia paid tier
- LINE OA paid plan (> 300 broadcasts/mo)

### ⚠️ One-time acceptable
- Domain renewal (~350/yr — เดิม)
- $5 Chrome Web Store dev fee (defer Q3)

---

## 6. First-Day Action (7 พ.ค. 2026)

```
[ ] 1. Owner ตอบ Q1-Q4 (critical) — ต้องมีก่อน Day 2
[ ] 2. Apply V14 patch zip ทับโค้ดเดิม (homepage + slogan + V14 docs)
[ ] 3. Confirm core/Project_Driven_V14_Couponfirst.md, core/Couponkum_New_Roadmap.md = FROZEN
[ ] 4. Confirm core/Couponkum_Blueprint.md Part E1.5 = FROZEN (keep file but don't follow)
[ ] 5. แก้ Header.tsx ลบ !isHome (5 นาที) — ให้ search box โผล่บน home
[ ] 6. ssh VPS ปิด 4 cron:
        - rare-item-score (ปิด)
        - price-history (ปิด)
        - price-sync (weekly)
        - lazada-conversion-import (weekly)
[ ] 7. Update slogan ใน:
        - Footer.tsx
        - app/auth/login/page.tsx
        - src/lib/campaign-context.ts (+ test snapshots)
        - app/page.tsx metadata
        - PRD.md / CLAUDE.md
        → "คุ้มทุกการใช้จ่าย · ง่ายทุกการวางแผน"
[ ] 8. Update PRD.md + CLAUDE.md read order:
        PRD → Coupon_TP.MD → Blueprint A-D
[ ] 9. Commit + push + deploy + smoke test
[ ] 10. Day 2 prep: เปิด Coupon_TP.MD Section 5.4 + 7 — เริ่ม DB migrations
```

---

## 7. PRD / CLAUDE.md Update Needed

> ทั้ง 2 ไฟล์ปัจจุบัน point ไป V14 — ต้องเปลี่ยนเป็น point ไป Coupon_TP.MD

**`PRD.md` ที่ต้องแก้:**
- Slogan → "คุ้มทุกการใช้จ่าย · ง่ายทุกการวางแผน"
- Document Structure → Coupon_TP.MD เป็นอันดับ 2 (V14, V13, New_Roadmap = FROZEN)
- Mode → "V15 Template + Coupon"
- Goal now → "Template Store launch + Coupon lead magnet"

**`CLAUDE.md` ที่ต้องแก้:**
- Read order: PRD → **Coupon_TP.MD** → Blueprint A-D
- Slogan canonical update
- Hard rules: monetization rule ขยายให้ครอบ template revenue (Section 1) + coupon affiliate (Section 2)
- Priority buckets: V15 ใหม่ (template store + payment flow first)

> **Claude Code: แก้ทั้ง 2 ไฟล์เป็น Day 1 task หลัง apply patch**

---

## 8. Daily Standup Format (ทุก session)

```
1. เมื่อวานทำ task อะไร? (id + status)
2. วันนี้จะทำ task อะไร?
3. มี blocker อะไร? (Q1-Q11 ที่ยังไม่ตอบ?)
4. Token usage % ที่เหลือ?
5. Template count: X/10 ใน MVP target?
6. First sale: yes/no? amount?
```

---

## 9. Ship Acceptance (ก่อน 4 มิ.ย.)

- ✅ /templates catalog ทำงาน + ≥ 10 templates published
- ✅ Payment flow ครบ: order → QR → slip → verify → download
- ✅ /admin/orders verify queue
- ✅ /admin/analytics dashboard (top sellers + revenue)
- ✅ LINE add friend → free template flow
- ✅ Homepage 2-section structure (template หลัก + coupon รอง)
- ✅ ≥ 1 first sale (proof of concept)
- ✅ Total cost = 856/mo เท่าเดิม
- ✅ `npx tsc --noEmit && npm run lint && npm run test` pass

---

## 10. Files in This Bundle

| File | Purpose |
|---|---|
| `core/README.md` ← ไฟล์นี้ | Consistency report + read order + first-day action |
| `core/Coupon_TP.MD` | Canonical spec — merged from Coupon_TP.MD + Coupon_TPv2.MD (2026-05-07) |
| `core/Couponkum_Blueprint.md` | Architecture reference (Part A-D active · Part E1.5 frozen) |

---

_ผู้ที่อ่านไฟล์นี้: Claude Code · ภาษา: ไทย · ห้าม assume — ถ้าไม่ชัด ถาม owner ก่อน_
_Created: 2026-05-07 · Owner: yopinm@gmail.com_
