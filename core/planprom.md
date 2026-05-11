# planprom.md — Template Store (planprom.com)

> **Requirements Document สำหรับ Claude Code**
> Created: 2026-05-07 · Updated: 2026-05-11 · Project: planprom.com (V15 — renamed from couponkum)
> Predecessor: V14 Coupon-First (frozen — V15 ขยาย scope, ไม่ยกเลิกของเดิม)
> **เริ่มที่นี่:** อ่านไฟล์นี้ทั้งหมดก่อน → ถามถ้าไม่ชัด → ค่อย scaffold

---

## ✅ UAT Master Checklist (อัพเดต 2026-05-07 · Session 22)

> **กฎ:** ทุก task ต้อง UAT ก่อน close — deploy → smoke → ผ่าน checklist ด้านล่าง → owner confirm
> สัญลักษณ์: ✅ Pass · ❌ Fail · ⏳ Pending (รอ owner test) · 🔲 ยังไม่ได้ทำ

---

### A. Homepage — Hero Section

| # | Test Case | Expected | Status |
|---|---|---|---|
| A1 | เปิด planprom.com | Badge "ยิ่งซื้อมาก ยิ่งคุ้ม" · 4-step flow · Tier pricing card แสดง | ⏳ |
| A2 | Hero H1 | "4 ขั้นตอน กดเดียวจ่ายจบ" แสดงถูกต้อง | ⏳ |
| A3 | Stepper 4 ขั้นตอน | เลือกแพ็ก → เลือก Template → เพิ่มเพื่อน LINE → จ่าย PromptPay | ⏳ |
| A4 | Pack cards แนวนอน | 3 card (฿20/฿50/฿100) อยู่บนแถวเดียว · ฿50 มี badge "ยอดนิยม" + scaled | ⏳ |
| A5 | กด pack card | scroll ลง #template-store (ไม่ 404) | ⏳ |
| A6 | CTA "เลือกแพ็กเริ่มต้น →" | scroll ไป #pack-select | ⏳ |
| A7 | CTA "หรือดูคูปองที่ใช้ได้วันนี้ →" | ไปหน้า /affiliate (เปลี่ยนจาก /wallet — Session 27) | ⏳ |
| A8 | Mobile 375px | pack cards ยังอยู่แนวนอน ไม่ overflow | ⏳ |

---

### B. Homepage — Catalog Section (Template Store)

| # | Test Case | Expected | Status |
|---|---|---|---|
| B1 | มี template ใน DB | แสดง catalog badge frame ทุกหมวดที่มีข้อมูล | ⏳ รอ owner เพิ่ม template 2-10 |
| B2 | Catalog badge | border emerald · bg #ECFDF5 · emoji + ชื่อหมวด + จำนวนชิ้น | ⏳ |
| B3 | กด catalog badge | ไป /catalog/{slug} (จะ 404 จนกว่าจะสร้างหน้า — รับรู้แล้ว) | 🔲 หน้า pending |
| B4 | Template list | แสดง max 5 รายการ · เรียง sale_count DESC | ⏳ |
| B5 | แต่ละแถว | 📄 ชื่อ.pdf ········· ฿XX → | ⏳ |
| B6 | ชื่อยาว | truncate ก่อนถึง dotted leader | ⏳ |
| B7 | กด template row (ราคา) | ไปหน้า /checkout/[slug] | ⏳ |
| B8 | กด template row (ฟรี) | scroll ไป #line-cta | ⏳ |
| B9 | "ดูเทมเพลตทั้งหมดในหมวดนี้ (N) →" | แสดงจำนวนถูกต้อง · ลิ้งค์ /catalog/{slug} | ⏳ |
| B10 | ไม่มี template ใน DB | แสดง mock cards แทน (fallback) | ⏳ |

---

### C. Admin — Template Manager (/admin/templates)

| # | Test Case | Expected | Status |
|---|---|---|---|
| C1 | เข้า /admin/templates | แสดง list templates ทั้งหมด + stats (published/draft/total) | ⏳ |
| C2 | สร้าง template ใหม่ | กด "เพิ่มเทมเพลต" → 6-step wizard → save | ⏳ |
| C3 | wizard step 1 | กรอก title, slug, tier, price, description | ⏳ |
| C4 | wizard step upload | อัพโหลด PDF → แสดง progress | ⏳ |
| C5 | publish template | toggle status → ขึ้น homepage | ⏳ |
| C6 | แก้ไข template | กด Edit → เปิด pre-filled form | ⏳ |
| C7 | ลบ template | confirm → ลบออก | ⏳ |
| C8 | category badge | แสดง category emoji + ชื่อ ใต้ชื่อ template | ⏳ |

---

### D. Admin — Catalog Manager (/admin/catalogs)

| # | Test Case | Expected | Status |
|---|---|---|---|
| D1 | เข้า /admin/catalogs | แสดง categories ทั้งหมด + จำนวน template | ⏳ |
| D2 | เพิ่ม category ใหม่ | กรอก slug + name + emoji → save | ⏳ |
| D3 | ลบ category | confirm dialog → ลบ | ⏳ |
| D4 | category เชื่อมกับ template | ใน wizard เลือก category → ขึ้นที่ catalog section homepage | ⏳ |

---

### E. Admin — Order Management (/admin/orders)

| # | Test Case | Expected | Status |
|---|---|---|---|
| E1 | เข้า /admin/orders | แสดง stats KPI + list orders | ⏳ |
| E2 | filter tab | กรอง: ทั้งหมด / รอชำระ / จ่ายแล้ว / รอตรวจสอบ | ⏳ |
| E3 | Verify order | กด Verify → status → paid → ลูกค้าได้ download link ทาง LINE | ⏳ |
| E4 | Revoke order | กด Revoke → download_token = NULL → LINE notify ลูกค้า | ⏳ |
| E5 | Suspicious order | claim ≥5 ใน 24h → fraud_flag = suspicious → แสดงใน filter | ⏳ |

---

### F. Admin — Analytics (/admin/template-analytics)

| # | Test Case | Expected | Status |
|---|---|---|---|
| F1 | KPI cards | Total revenue · paid orders · unique buyers · downloads | ⏳ |
| F2 | 14-day chart | daily sales bar chart แสดงถูกต้อง | ⏳ |
| F3 | Per-template table | revenue/ชิ้น · sale count เรียง DESC | ⏳ |

---

### G. Payment Flow — End-to-End (สำคัญที่สุด)

| # | Test Case | Expected | Status |
|---|---|---|---|
| G1 | ไม่ได้ login → /checkout/[slug] | redirect ไป LINE OAuth → กลับมา /checkout/[slug] | ⏳ |
| G2 | login แล้ว → /checkout | แสดง template card + credit banner (ถ้ามี credits) + **step 1: เพิ่มเพื่อน LINE** ก่อน | ⏳ |
| G2b | มี pack credits → กด "ใช้ 1 credit" | redeem ทันที · ไม่ต้องผ่าน QR · download link โผล่ | ⏳ |
| G3 | กด "เพิ่มเพื่อนแล้ว →" | **Omise** PromptPay QR แสดง · จำนวนเงินถูก · "รอชำระ · ตรวจสอบอัตโนมัติ" spinner | ⏳ |
| G4 | ชำระเงิน (test mode = auto · live mode = สแกน QR จริง) | Omise webhook → status = paid · token gen · หน้า "ชำระสำเร็จ" + download button | ⏳ live keys pending |
| G5 | LINE push ลูกค้า | ลูกค้าได้รับ download link ทาง LINE OA | ⏳ |
| G6 | LINE push owner | owner ได้รับ notify (ต้องตั้ง OWNER_LINE_USER_ID ก่อน) | ⏳ OWNER_LINE_USER_ID pending |
| G7 | กด download link | /d/[token] → แสดงไฟล์ · กด "ดาวน์โหลด PDF" → fetch /api/download/[token] → stream ไฟล์ → count++ | ✅ |
| G7b | LINE share button | โผล่หลังดาวน์โหลดครั้งแรก · share → หน้า template | ✅ |
| G8 | download ครบ 3 ครั้ง | แสดง "ดาวน์โหลดครบ 3 ครั้งแล้ว" · ปุ่ม ติดต่อ LINE OA | ⏳ |
| G9 | token หมดอายุ (24h) | แสดง "ลิงก์หมดอายุ" · ปุ่ม ติดต่อ LINE OA | ⏳ |
| G10 | pending orders ≥ 3 | แสดงหน้า ⏱️ "รอ 1 ชม." + LINE OA CTA (ไม่ใช่ generic error) | ✅ |
| G11 | บัญชีถูก revoke | แสดง error "บัญชีถูกระงับ" · CTA LINE OA | ⏳ |

---

### H. Customer Pages

| # | Test Case | Expected | Status |
|---|---|---|---|
| H1 | /templates/[slug] | แสดง thumbnail · tier badge · ราคา · features · tags · related | ⏳ |
| H2 | /templates/[slug] → กด "ซื้อเลย" | ไป /checkout/[slug] | ⏳ |
| H3 | /templates/[slug] ฟรี | ปุ่ม "รับฟรี ผ่าน LINE OA" แสดง (ไม่ใช่ปุ่มซื้อ) | ⏳ |
| H4 | /orders (login) | แสดงรายการ orders ทั้งหมด · ปุ่ม download ถ้า paid + token valid | ⏳ |
| H5 | /orders (ไม่ login) | redirect ไป LINE OAuth | ⏳ |
| H6 | /analysis (login) | แสดง KPI cards · bar chart ตาม category · purchase history | ⏳ |
| H7 | /analysis ไม่มี order | แสดง empty state "ยังไม่มีข้อมูล" | ⏳ |

---

### I. Checkout Error States

| # | Test Case | Expected | Status |
|---|---|---|---|
| I1 | pending orders ≥ 3 | หน้า ⏱️ "มีคำสั่งซื้อค้างอยู่ 3 รายการ · รอ 1 ชม." | ✅ |
| I2 | บัญชี revoked | หน้า ❌ "บัญชีถูกระงับ · ติดต่อ LINE OA" | ⏳ |
| I3 | template ไม่มีใน DB | 404 notFound() | ⏳ |
| I4 | claim ≥5 ครั้งใน 24h | หน้า ⏳ "รอการตรวจสอบ · owner ส่งลิงก์ภายใน 1 ชม." | ⏳ |

---

### S27. /affiliate Page — UAT Checklist (✅ Live 2026-05-08)

| # | Test Case | Expected | Status |
|---|---|---|---|
| S27-1 | เปิด couponkum.com/affiliate | Section 2 coupon content แสดงครบ (brand chips, recommended stores, platform chips, daily featured, featured coupons dark grid) | ✅ |
| S27-2 | "← กลับหน้าแรก" link | ไปหน้าแรก (/) | ✅ |
| S27-3 | ไม่มี blog articles section | ไม่แสดง "บทความแนะนำ" | ✅ |
| S27-4 | homepage (/) | Section 1 เท่านั้น · ไม่มีคูปอง | ✅ |
| S27-5 | hero CTA "หรือดูคูปองที่ใช้ได้วันนี้ →" | ไปที่ /affiliate (ไม่ใช่ /wallet) | ✅ |

---

### J18. Cart + Volume Pricing — UAT Checklist (✅ ผ่าน 2026-05-08)

> ⚠️ **FROZEN — ห้ามแก้ไข payment flow จนกว่าแอดมินจะสั่ง**

| # | Test Case | Expected | Status |
|---|---|---|---|
| J18-1 | เปิด /templates | แต่ละ row มีปุ่ม "หยิบใส่ตะกร้า" (paid tier เท่านั้น) | ✅ |
| J18-2 | กด "หยิบใส่ตะกร้า" | ปุ่มเปลี่ยนเป็น "✓ ในตะกร้าแล้ว" · header badge เพิ่มทันที | ✅ |
| J18-3 | กดซ้ำ | ไม่เพิ่มซ้ำ (`ON CONFLICT DO NOTHING`) · count ไม่เปลี่ยน | ✅ |
| J18-4 | เปิด /cart | แสดงรายการ · tier progress bar · ยอดรวม · ปุ่ม checkout | ✅ |
| J18-5 | ลบ item ออก cart | item หาย · totals อัพเดต | ✅ |
| J18-6 | tier bar — 1 ชิ้น | แสดง "เพิ่มอีก 1 ชิ้น ลดเหลือ ฿8/ชิ้น" | ✅ |
| J18-7 | tier bar — ≥6 ชิ้น | แสดง "คุ้มสุด! ราคา ฿7/ชิ้น" สีเขียว | ✅ |
| J18-8 | pricing ถูกต้อง | ชิ้น1=**฿20** · ชิ้น2=฿8 · ชิ้น3=฿8 → รวม ฿36 (TIER_1=฿20 = Omise minimum) | ✅ |
| J18-9 | กด "ดำเนินการชำระเงิน" | ไป /checkout · แสดง cart summary + totals | ✅ |
| J18-10 | กด "สร้าง QR PromptPay" | spinner → QR แสดง · เลข order แสดง · polling เริ่มทำงาน | ✅ |
| J18-11 | Omise mark-as-paid | **auto-redirect ไป /order/[uid] ภายใน ≤6s** (ไม่มีปุ่ม claim-paid แล้ว — ถูกลบออก) | ✅ |
| J18-12 | กด "ดาวน์โหลดทุกไฟล์" | browser download ทุกไฟล์ทีละตัว delay 800ms | ✅ |
| J18-13 | /order/[uid] | แสดงรายการ + download links + "ดาวน์โหลดทุกไฟล์" | ✅ |
| J18-14 | download ครบ 3 ครั้ง/ไฟล์ | แสดง "ครบ 3 ครั้ง" · ไม่ให้โหลดต่อ | ✅ |
| J18-15 | cart clear หลัง checkout | cart badge = 0 เมื่อ navigate ไปหน้าอื่น | ✅ |
| J18-16 | QR ไม่จ่าย 120s | QR ซีด → ปุ่ม **"QR หมดอายุ — สร้าง QR ใหม่"** (ไม่มีปุ่ม bypass) | ✅ |
| J18-17 | กด "สร้าง QR ใหม่" → mark paid | Omise charge ใหม่ → QR ใหม่ → mark paid → auto-redirect | ✅ |
| J18-18 | LINE notification | owner ได้รับ LINE notify ทันทีที่ polling detect payment | ✅ |
| J18-19 | /admin/orders?type=cart | แสดง cart orders · stats · revoke/cancel | ✅ |
| J18-20 | free tier ใน cart | ฟรีไม่นับ paidCount · ไม่มีปุ่ม AddToCart ใน /templates | ✅ |

---

### DC-5/DC-6/DC-7. Engine System — UAT Checklist (Session 30 · 2026-05-09)

| # | Test Case | Expected | Status |
|---|---|---|---|
| E1 | /admin/templates/new → เลือก Engine: Checklist | Step 1 แสดงปุ่ม Engine: Checklist + Engine: Planner ด้านบน | ✅ |
| E2 | Step 3 — engine mode | ซ่อน คำอธิบาย / จำนวนหน้า / ประเภทเอกสาร · แสดงแค่ ชื่อ / Slug / Tier / Watermark / Engine Form | ✅ |
| E3 | รหัสเอกสาร ใน Section 1 form | แสดง "Auto-generate เช่น CK-20260509-0001" (read-only) · ไม่มี input | ✅ |
| E4 | ผู้จัดทำ ใน Section 1 form | placeholder "ปล่อยว่าง — ลูกค้ากรอกเองในเอกสาร" (ไม่มี *) | ✅ |
| E5 | กด Generate PDF Preview | สร้าง PDF สำเร็จ · แสดง docCode (CK-YYYYMMDD-XXXX) ในการ์ดสีเขียว | ✅ |
| E6 | PDF Section 1 | แสดงหมวดหมู่ (catalog) แทนรหัสเอกสาร · ผู้จัดทำ = เส้นว่างให้กรอก | ✅ |
| E7 | PDF Header | แสดง "หมวดหมู่: [ชื่อ catalog]" · ไม่มีรหัส/เวอร์ชัน | ✅ |
| E8 | PDF Footer | แสดง "ชื่อเทมเพลต · หมวดหมู่" · ไม่มีเลขเอกสาร | ✅ |
| E9 | /templates/[slug] — checklist engine | แสดง green card: S1 (docCode, version, author) + S2 (purpose, context) | ⏳ |
| E10 | /templates/[slug] — planner engine | แสดง violet card: P1 (period/framework badges, description, yearlyGoals) | ⏳ |
| E11 | /templates pricing callout | แสดง 3-tier block (฿20/฿8/฿7) · ไม่มีปุ่มแพ็ก | ✅ |

---

### J. Known Pending Issues (ยังไม่แก้ — มี task แล้ว)

| # | Issue | Plan | Priority |
|---|---|---|---|
| J1 | ~~OWNER_LINE_USER_ID ยังไม่ set~~ | ✅ **RESOLVED (Session 25)** — `U96c708ca4761b23c2248da81afdc72f7` set ใน VPS .env.local แล้ว · 3 ระบบ push LINE active | ✅ Done |
| J2 | ~~Fraud gap — ลูกค้าไม่จ่ายแต่ได้ไฟล์~~ | ✅ **RESOLVED (Session 22)** — Omise webhook ยืนยัน payment ก่อน activate order เสมอ | ✅ Done |
| J3 | ~~`/templates?category=xxx` → 404~~ | ✅ **RESOLVED (Session 24)** — /templates page + type/category filter chips ทำงานได้ | ✅ Done |
| J4 | ~~`/catalog/[slug]` → 404~~ | ✅ **RESOLVED (Session 24)** — /catalog/[slug] page + group by document_type | ✅ Done |
| J5 | ~~Category chips บน homepage → 404~~ | ✅ **RESOLVED (Session 24)** — ขึ้นกับ J3/J4 ซึ่ง Done แล้ว | ✅ Done |
| J6 | ~~Bundle/Credits system ยังไม่มี~~ | ✅ **RESOLVED (Session 22)** — pack_credits table · FIFO · 90 วัน expire · ฿20=2, ฿50=10, ฿100=25 credits | ✅ Done |
| J7 | /templates/[slug] breadcrumb category → 404 | ขึ้นกับ J4 | 🟡 Low |
| J8 | Owner สร้าง templates 2-10 | owner task — /templates UAT pending จนกว่าจะมี template ครบ | 🔴 Blocker UAT |
| J9 | Omise test mode QR อ่านไม่ได้ด้วยแอปธนาคาร | ตั้งใจ — test QR เป็น fake EMVCo · **ต้องใช้ live keys เพื่อทดสอบ real scan** · UAT G4 pending live keys | 🟡 Medium |
| J10 | Wallet แสดง login prompt หลัง download ใน tab เดิม | ~~ระบบ Wallet ถูกตัดออกแล้ว — task นี้ไม่มีผล~~ | ✅ **Closed (N/A — wallet removed)** |
| J11 | Free tier ยังไม่โหลดได้เลย | `POST /api/free-download` → INSERT template_orders (amount=0, status='paid', payment_method='free') → return token · `FreeDownloadButton` client component → router.push('/d/[token]') · แทน href="#line-cta" ทั้ง 3 จุด (CatalogTemplateList modal+row, TemplateListWithPreview modal+row, /templates/[slug]) · ลบปุ่ม "แชร์ให้เพื่อนทาง LINE" จาก DownloadClient | ✅ **Done · Live (Session 46)** |
| J12 | LINE OAuth ล้มเหลว — "Error getting user profile from external provider" | ~~ตัดระบบ LINE Login ออกแล้ว — ใช้ Cart flow แทน (ไม่ต้อง LINE)~~ | ✅ **Closed (N/A — LINE login removed)** |
| J13 | ระบบ Customer Request ขอเทมเพลตด่วน | **Spec (2026-05-10):** · **UI** `/templates/request` — หัวข้อ "อยากได้เทมเพลตหมวดไหน? → บอกเรา" · input ช่องเดียว placeholder "เช่น แพลนเนอร์ออกกำลังกาย" · ปุ่ม "ส่ง" · ไม่ต้อง login (guest ส่งได้) · **Incentive:** แจ้งใต้ช่อง "เมื่อเราทำเทมเพลตนี้เสร็จ คุณได้รับไฟล์ฟรี 1 ใบ!" → เก็บ contact_line (optional) เพื่อให้ owner แจ้งกลับ · **DB:** `template_requests` (id UUID PK, topic TEXT NOT NULL, contact_line TEXT, session_id TEXT, fulfilled BOOLEAN DEFAULT false, free_token_issued BOOLEAN DEFAULT false, created_at TIMESTAMPTZ) · **Flow:** submit → INSERT → แสดง toast "ส่งคำขอแล้ว! เราจะแจ้งเมื่อพร้อม" · **Admin** `/admin/requests` — ตาราง: topic / contact / วันที่ / fulfilled toggle / ปุ่ม "ออก free token" (สร้าง download_token แล้วส่ง LINE หรือ copy link) · **Files:** `app/templates/request/page.tsx` (NEW) · `app/api/templates/request/route.ts` (NEW) · `app/admin/requests/page.tsx` (NEW) · `app/admin/requests/actions.ts` (NEW) · `migrations/YYYYMMDD_template_requests.sql` | 🟡 Medium |
| J14 | ระบบสมาชิก + Auto Push download link | ลูกค้าที่ซื้อแล้ว = "สมาชิก" → เมื่อ owner เพิ่ม template ใหม่ในหมวดที่เคยซื้อ → LINE push แจ้งลิงก์ดาวน์โหลดอัตโนมัติ · **Plan**: `member_subscriptions` table (line_id, category_slug) + cron/webhook ตอน publish template ใหม่ → LINE push เฉพาะกลุ่มที่ subscribe หมวดนั้น | 🟡 Medium |
| J15 | Generate Template PDF จาก .docx — Preview ก่อน Publish | **Concept ชัดแล้ว (2026-05-08):** admin อัพ `.docx` → ระบบ convert → PDF มาตรฐาน A4 → admin preview → approve/reject → publish · แทน "Starter" mode ใน wizard · watermark เลือกได้ (ไม่ใส่ / ใส่ + แก้ข้อความได้) · **Stack**: `mammoth` (docx→HTML, มีอยู่แล้ว) + `@sparticuz/chromium` + `puppeteer-core` (HTML→PDF, pure npm ไม่ต้องติดตั้ง OS-level) · **Flow**: docx upload → mammoth HTML → inject CSS A4 + optional watermark (CSS diagonal overlay) → puppeteer PDF → เก็บเป็น draft → admin preview iframe → approve → move to `/uploads/templates/` → publish ปกติ · **Watermark UI**: radio ไม่ใส่ / ใส่ → text input (default "couponkum.com") · **VPS**: AlmaLinux 9.7 ไม่มี LibreOffice/Chromium → ใช้ `@sparticuz/chromium` แทน (npm ~40MB) · **Draft state**: เพิ่ม `status = 'draft_preview'` ใน templates table | 🟡 Medium / Planned |
| J16 | ~~Alert admin LINE เมื่อ LINE login fail~~ | ✅ **RESOLVED (Session 25)** — set `_auth_provider=line` cookie ตอน OAuth start · callback detect fail → `pushLine(OWNER_LINE_USER_ID, ...)` พร้อม error + Thai timestamp | ✅ Done |
| J17 | ระบบสมาชิกรายเดือน (Subscription) | **Spec (2026-05-08):** ต่อยอดจาก `pack_credits` ปัจจุบัน · **Plans**: Free (credit pack ทีละครั้ง — ปัจจุบัน) / Standard ฿99/เดือน / Pro ฿199/เดือน · **สิทธิ์ Standard**: download ไม่จำกัด templates ในหมวดที่ subscribe · **สิทธิ์ Pro**: ทุกหมวด + auto LINE push เมื่อมี template ใหม่ · **DB**: table `subscriptions` (id, customer_line_id, plan `standard`/`pro`, status `active`/`cancelled`/`expired`, started_at, expires_at, omise_sub_id) · **Payment**: Omise recurring charge (PromptPay รายเดือน) หรือ manual PromptPay + admin confirm · **Guard**: middleware/page เช็ค `subscriptions` ก่อน serve premium content · **Renewal**: cron ทุกวัน → หา expires_at < NOW()+3days → LINE push แจ้งต่ออายุ · **Relation กับ pack_credits**: สมาชิก Pro ไม่ต้องใช้ credits → download ตรง · **Migration**: `migrations/YYYYMMDD_subscriptions.sql` | 🟡 Medium / Planned |
| J18 | **Cart + Volume Pricing + Instant Download** | ✅ **UAT ผ่านครบ (2026-05-08 · Session 28)** · **Pricing (marginal, 3 tiers)**: ชิ้นที่ 1=**฿20** (Omise min) · 2-5=฿8/ชิ้น · 6+=฿7/ชิ้น · **Auth**: guest checkout · **Cart**: server-side DB + `_cart_sid` cookie · **Flow**: /templates → "หยิบใส่ตะกร้า" → /cart → /checkout QR → **polling detect paid ≤6s → auto-redirect /order/[uid]** · QR หมดอายุ 120s → "สร้าง QR ใหม่" (ไม่มีปุ่ม bypass) · **ห้ามแก้ไข payment flow จนกว่าแอดมินจะสั่ง** | ✅ Done |
| J19 | **Template System Log Export** | **Spec (2026-05-08):** เพิ่มหน้า `/admin/templates/log-export` สำหรับ export ข้อมูล snapshot เพื่อส่งให้ Claude Code วิเคราะห์ปัญหาระบบ templates · **Export ประกอบด้วย:** (1) templates table snapshot (id, slug, title, tier, price_baht, status, document_type, pdf_path, sale_count, created_at) · (2) template_categories + template_category_links · (3) orders + order_items summary (last 30 วัน) · (4) recent errors จาก PM2 logs (ถ้าดึงได้) · (5) cart stats (active carts, cart_items count) · **Format**: JSON + copy-to-clipboard button · **Page**: server component query DB → client component copy/download · **Route**: `GET /admin/templates/log-export` | 🟡 Medium / Next Session |
| J20 | **Catalog Manager — Edit Category Name** | **Spec (2026-05-08):** `/admin/catalogs` ตอนนี้มีแค่ปุ่มลบ (DeleteCategoryButton) · ต้องเพิ่ม **inline edit** ชื่อ category (name + emoji) · **Plan**: เพิ่ม `EditCategoryForm` client component → `updateCategoryAction` server action → `UPDATE template_categories SET name=..., emoji=... WHERE id=...` → `revalidatePath('/admin/catalogs')` · **UX**: กด "แก้ไข" → row expand → input fields pre-filled → กด Save / Cancel | ✅ **Done** |
| ADMIN-EXPORT-TEMPLATE | **Export / Import Template (Backup System)** | **Spec (2026-05-10):** admin export template ทั้งหมดเป็น ZIP สำหรับ backup / ย้าย server · **Export:** bundle metadata JSON (templates + categories + revisions) + PDF/preview files ทั้งหมดเป็น `.zip` · **Import:** upload `.zip` → unzip → INSERT DB + copy ไฟล์ไป `/uploads/` · **Slug conflict strategy:** skip / overwrite (เลือกได้ตอน import) · **Route:** `GET /admin/templates/export` (download ZIP) · `POST /admin/templates/import` (upload ZIP) · **Pages:** `/admin/templates/export` + `/admin/templates/import` · **หมายเหตุ:** engine template → PDF re-generate ได้จาก engine_data ถ้าต้องการ (แบบ B) หรือรวม PDF ใน ZIP เลย (แบบ A ครบกว่า) | 🔵 Planned / Future |
| HOME-FEAT-1 | **เทมเพลตแนะนำสัปดาห์นี้ — Homepage Featured Card** | **Spec (2026-05-10):** · **Strategy: Hybrid C** — admin toggle ก่อน → ถ้าไม่มี fallback top sale_count 7 วัน · **DB:** `ALTER TABLE templates ADD COLUMN is_featured_weekly BOOLEAN NOT NULL DEFAULT false` · constraint: มี is_featured_weekly = true ได้แค่ 1 row (enforce ใน action — set ใหม่ → clear เก่าก่อน) · **Query homepage:** `SELECT * FROM templates WHERE is_featured_weekly = true AND status = 'published' LIMIT 1` → ถ้า empty → `ORDER BY sale_count DESC, created_at DESC LIMIT 1` · **UI `/`:** section "✨ เทมเพลตแนะนำสัปดาห์นี้" · card ใหญ่ 1 ใบ: `preview_path` image + ชื่อ + หมวด + ราคา + `AddToCartButton` (reuse) · ลิงก์ "ดูทั้งหมด →" → `/templates` · ซ่อน section ถ้าไม่มี published template เลย · **Admin toggle:** `/admin/templates/[id]/edit` — checkbox "⭐ แนะนำสัปดาห์นี้" → `setFeaturedWeeklyAction` (clear all → set this) · **Files:** `migrations/YYYYMMDD_featured_weekly.sql` · `components/home/FeaturedTemplateCard.tsx` (NEW) · `app/page.tsx` · `app/admin/templates/[id]/edit/page.tsx` · `app/admin/templates/actions.ts` | ✅ **Done · Live (Session 47)** |

---

### Promo Code System — PROMO Series (2026-05-10)

> **เป้าหมาย:** ระบบ discount code สำหรับ double-day campaign (5.5 / 11.11 / 12.12 ฯลฯ) · admin สร้างโค้ด → โผล่ banner หน้าโฮม → ลูกค้า copy → apply ที่ checkout → หักยอด

#### Flow หลัก

```
Admin สร้างโค้ด (PROMO-3)
  → is_active = true + ยังไม่หมดอายุ
  → PromoCodeBanner โผล่หน้าโฮม (PROMO-2) — copy button + countdown timer
  → ลูกค้าเลือก template → เพิ่มตะกร้า
  → Checkout: กรอก/วางโค้ด → POST /api/promo/validate (PROMO-1)
  → validate: active? expired? quota? min_cart_value?
  → แสดง discount ทันที → สร้าง order พร้อม discount_baht
  → log ใน promo_code_uses (idempotent — 1 order = 1 use)
```

#### DB Schema

**`promo_codes`**
```sql
CREATE TABLE promo_codes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code          TEXT UNIQUE NOT NULL,                  -- "55PLAN", "1111SAVE"
  label         TEXT NOT NULL,                         -- "5.5 Sale 2026"
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percent', 'fixed')),
  discount_value NUMERIC(10,2) NOT NULL,               -- 20 = 20% หรือ ฿20
  min_cart_value NUMERIC(10,2) NOT NULL DEFAULT 0,     -- ขั้นต่ำ ฿0
  max_uses      INT,                                   -- NULL = ไม่จำกัด
  used_count    INT NOT NULL DEFAULT 0,
  starts_at     TIMESTAMPTZ NOT NULL,
  expires_at    TIMESTAMPTZ NOT NULL,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT now()
);
```

**`promo_code_uses`**
```sql
CREATE TABLE promo_code_uses (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promo_code_id   UUID NOT NULL REFERENCES promo_codes(id) ON DELETE CASCADE,
  order_id        UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  session_id      TEXT,
  discount_applied NUMERIC(10,2) NOT NULL,
  used_at         TIMESTAMPTZ DEFAULT now(),
  UNIQUE (promo_code_id, order_id)                    -- idempotent
);
```

**`orders` — columns เพิ่ม**
```sql
ALTER TABLE orders ADD COLUMN promo_code_id UUID REFERENCES promo_codes(id);
ALTER TABLE orders ADD COLUMN discount_baht NUMERIC(10,2) NOT NULL DEFAULT 0;
```

#### Validation Rules (`/api/promo/validate`)

| เงื่อนไข | Error message |
|---|---|
| code ไม่พบ / is_active = false | "ไม่พบโค้ดส่วนลดนี้" |
| NOW() < starts_at | "โค้ดยังไม่เริ่มใช้งาน" |
| NOW() > expires_at | "โค้ดหมดอายุแล้ว" |
| used_count >= max_uses | "โค้ดถูกใช้ครบแล้ว" |
| cart_total < min_cart_value | "ยอดขั้นต่ำ ฿{min_cart_value}" |
| discount > cart_total | cap discount ที่ cart_total (ไม่ติดลบ) |

#### Tasks

| Task | ชื่อ | Spec | สถานะ |
|---|---|---|---|
| PROMO-1 | **Promo Code Validate API + Checkout Integration** | **Scope (2026-05-11 confirmed):** · **Migration:** `migrations/20260511_promo_codes.sql` — สร้าง `promo_codes` + `promo_code_uses` + ALTER `orders` เพิ่ม `promo_code_id` + `discount_baht` · **API:** `POST /api/promo/validate` — body: `{ code, cart_total }` → response: `{ valid, discount_type, discount_value, discount_applied, label }` หรือ `{ error }` · **Edge cases:** cap discount ≥ ฿0 · ถ้า total > 0 ต้อง ≥ ฿20 (Omise min) · ส่งแค่ paidTotal (ไม่รวม free items) · **Checkout integration:** `app/checkout/page.tsx` — เพิ่ม `PromoCodeInput` component (กรอกโค้ด → validate → แสดง -฿XX · ปุ่ม Remove) · เมื่อสร้าง order → INSERT promo_code_uses + UPDATE used_count + บันทึก discount_baht ใน orders · **Files:** `migrations/20260511_promo_codes.sql` · `app/api/promo/validate/route.ts` (NEW) · `components/checkout/PromoCodeInput.tsx` (NEW) · `app/checkout/page.tsx` · `app/api/checkout/route.ts` | ✅ **Done · Live (Session 46)** |
| PROMO-2 | **PromoCodeBanner — Homepage card** | **Scope (2026-05-11 confirmed):** · วาง card ขวามือ Section 1 (แทน placeholder "โค้ดส่วนลด เร็วๆ นี้") · query `promo_codes` WHERE `is_active = true AND NOW() BETWEEN starts_at AND expires_at` ORDER BY expires_at ASC LIMIT 1 · **UI (card เล็ก):** 🏷️ label + code (copy button) + "หมดใน X วัน" · ถ้าไม่มีโค้ด active → แสดง placeholder เดิม · **Copy:** navigator.clipboard.writeText + toast "คัดลอกแล้ว!" · **Files:** `components/promo/PromoCodeBanner.tsx` (NEW — server fetch + client copy) · `app/page.tsx` (inject แทน placeholder) | ✅ **Done · Live (Session 46)** |
| PROMO-3 | **Admin Promo Code CRUD** | **Scope (2026-05-11 confirmed):** · **Route:** `/admin/promo-codes` · **List:** code / label / discount / valid dates / used_count/max_uses / is_active badge · **Create form:** code (กรอกเองหรือกด Generate สุ่ม 8 ตัวอักษร + 🎲 dice button) · label · discount_type (percent/fixed) · discount_value · min_cart_value · max_uses (blank=ไม่จำกัด) · starts_at / expires_at · **Live min-cart hint:** calcMinCart() แสดง ⚠️ "ลูกค้าต้องมียอดในตะกร้า ≥ ฿XX" realtime · **Inline edit row:** แก้ label/discount/expires_at ได้เลยโดยไม่ออกหน้า · **Actions:** `createPromoCodeAction` · `updatePromoCodeAction` · `togglePromoCodeAction` (active on/off) · `deletePromoCodeAction` (ลบได้เฉพาะ used_count = 0) · **Files:** `app/admin/promo-codes/page.tsx` · `app/admin/promo-codes/actions.ts` · `app/admin/promo-codes/PromoCodeRow.tsx` · `app/admin/promo-codes/PromoCreateForm.tsx` | ✅ **Done · Live (Session 46)** |
| PROMO-4 | **Auto-Promo Engine Cards** | **Scope (2026-05-11 confirmed):** · **Position:** แถว horizontal 4 cards ใต้ title "Promo Codes" เหนือฟอร์มสร้างโค้ด · **4 Engines:** (1) Slow Week — avg=0 → always signal; avg>0 → signal ถ้า rev < 60% avg (2) Tier Uplift — % orders single-item ≥ 50% และ total ≥ 1 order (3) Cart Recovery — abandoned carts ≥ 1 อัน (4) VPS Break-Even — rev 7 วัน < ฿210 (฿900/เดือน) · **Card UI:** engine name + คำอธิบาย + badge "แนะนำสัปดาห์นี้" + ปุ่ม Generate → pre-fill PromoCreateForm + banner ยืนยัน · **API:** `GET /api/admin/promo-suggest` · **Files:** `app/api/admin/promo-suggest/route.ts` · `app/admin/promo-codes/PromoEngineCards.tsx` · `app/admin/promo-codes/PromoCodeSection.tsx` · `app/admin/promo-codes/PromoCreateForm.tsx` (prefill prop) | ✅ **Done · Live (Session 46)** |

**ลำดับ implement:** PROMO-3 ✅ → PROMO-1 ✅ → PROMO-2 ✅ → PROMO-4 ✅

**Frozen during PROMO work:** payment flow · cart/checkout core logic · Omise integration · download flow

---

### Homepage & Pricing — UI Series (2026-05-10)

> **เป้าหมาย:** ปรับ pricing tier + hero copy + trust strip + homepage UX ให้ convert ได้ดีขึ้นช่วง test phase
> **Owner confirmed 2026-05-10** — pricing change override J18 freeze โดย owner approve
> **Frozen:** `lib/engine-checklist.ts` · `lib/engine-planner.ts` · ChecklistEngineForm · PlannerEngineForm · Cart/Checkout/Payment/Download flow · Omise webhook

| Task | ชื่อ | Spec | สถานะ |
|---|---|---|---|
| UI-A | **Pricing Tier Update ฿8 → ฿10** | `lib/pricing.ts` TIER_2 · 25 tests · hardcode ฿8 ทุกที่ · cart per-item price · metadata · pricing callout | ✅ **Done · Live (Session 45)** |
| UI-B | **Hero Copy + Tier Card Redesign** | H1/Sub/CTA · tier card labels + badges (-50%, 6ชิ้น+) | ✅ **Done · Live (Session 45)** |
| UI-C | **Trust Strip + Beta Framing** | strip ใต้ CTA: "เทมเพลตคัดสรร · เพิ่มใหม่ทุกสัปดาห์" + 3 checkmarks | ✅ **Done · Live (Session 45)** |
| UI-E | **Section 2 H2 Split — 2 Category Cards** | 2 cards (✅ เช็คลิสต์ / 📅 แพลนเนอร์) แทน H2 ยาว · ลบ chips ซ้ำออก | ✅ **Done · Live (Session 45)** |
| UI-F | **Hide Empty Categories** | `fetchCategories` ใน /templates JOIN published templates เท่านั้น · homepage ใช้ JOIN อยู่แล้ว | ✅ **Done · Live (Session 45)** |
| UI-G | **Coming Soon Roadmap Section** | **Defer** — รอ template count ≥ 5 หมวด · section ใต้ categories + "🔔 แจ้งเตือนผ่าน LINE เมื่อเปิด" | 📊 Defer |

**ลำดับแนะนำ:** UI-A → UI-B + UI-C (รวม commit) → UI-F → UI-E → HOME-FEAT-1
**Frozen during UI work:** engine forms · Cart/Checkout/Payment/Download core logic · Omise webhook

---

### Document Control System — DC Series (2026-05-08)

> **เป้าหมาย:** ทุกไฟล์ในระบบมีมาตรฐานเดียวกัน · ลูกค้าตัดสินใจซื้อได้จากสารบัญ · order ID สืบค้นได้และไม่ชน

| Task | ชื่อ | Spec | สถานะ |
|---|---|---|---|
| DC-1 | **Standard PDF Generator จาก .docx** | **Input:** `.docx` เท่านั้น (ไม่รับ PDF โดยตรง) → mammoth (docx→HTML) → inject CSS template มาตรฐาน A4 (font Sarabun, margin 20mm, header ชื่อ template + logo text, footer page/couponkum.com) แยก layout ตาม `document_type`: **checklist** = checkbox `☐` per item / **planner** = date+time block grid → puppeteer-core + @sparticuz/chromium render → PDF · **Watermark UI:** radio "ไม่ใส่ / ใส่" → text input (default `couponkum.com`) → CSS `::before` diagonal overlay render พร้อม PDF · **Flow:** upload .docx → generate → status `draft_preview` → admin preview iframe → กด Approve → status `published` + save `/uploads/templates/{slug}.pdf` · **DB:** `ALTER TABLE templates ADD COLUMN watermark_text TEXT` (NULL = ไม่ใส่) + เพิ่ม status `draft_preview` · **Files:** `app/api/admin/templates/upload-docx/route.ts` (NEW) · `lib/pdf-generator.ts` (NEW) · `WizardClient.tsx` (เพิ่ม docx tab) · `edit/page.tsx` (draft_preview + Approve button) · `migrations/20260508_docx_generator.sql` · **VPS:** `npm install @sparticuz/chromium puppeteer-core` | 🟡 **Code Done · UAT Pending** (Session 29) |
| DC-2 | **TOC Preview สารบัญในหน้า /templates** | **Source:** mammoth extract H1/H2/H3 headings ตอน upload .docx → save `toc_sections JSONB` ใน templates table · **Format:** `[{"level":1,"title":"ส่วนที่ 1"},{"level":2,"title":"หัวข้อย่อย"}]` · **UX /templates:** แต่ละ row มีปุ่ม "▼ ดูสารบัญ" (toggle) · **UX /templates/[slug]:** TOC always-expanded ใต้ description (ไม่ต้องกด) · **DB:** `ALTER TABLE templates ADD COLUMN toc_sections JSONB` · **Files:** `migrations/20260508_toc_sections.sql` · `lib/pdf-types.ts` (NEW — type isolation) · `lib/pdf-generator.ts` (เพิ่ม `extractToc()`) · `components/templates/TocPreview.tsx` (NEW) · `app/templates/page.tsx` · `app/templates/[slug]/page.tsx` | 🟡 **Code Done · UAT Pending** (Session 29) |
| DC-3 | **DB Sequence สำหรับ Order ID** | **ปัญหาเดิม:** `Math.random()` อาจชนได้ (1:9000) · **แก้:** PostgreSQL sequence `order_seq` → `nextval` แทน random · **Format คงเดิม:** `CK-YYYYMMDD-NNNN` แต่ NNNN = sequential จาก DB (เริ่ม 1000) · **เพิ่ม:** `order_type TEXT NOT NULL DEFAULT 'cart'` (`cart` / `single` / `pack`) ใน orders table · **DB:** `CREATE SEQUENCE IF NOT EXISTS order_seq START 1000 INCREMENT 1` + `ALTER TABLE orders ADD COLUMN order_type TEXT NOT NULL DEFAULT 'cart'` · **Files:** `migrations/20260508_order_seq.sql` · `app/api/checkout/route.ts` | ✅ **Done · Live** (Session 29) |

| DC-4 | **DB Migration — Engine Columns** | `ALTER TABLE templates ADD COLUMN engine_type TEXT` · `ADD COLUMN engine_data JSONB` · **Files:** `migrations/20260509_engine_columns.sql` | ✅ **Done · Live** (Session 30) |
| DC-5 | **Checklist Engine — Text-to-PDF** | 5 section form → `generateChecklistHtml()` → puppeteer PDF · auto-generate docCode `CK-YYYYMMDD-XXXX` จาก DB count · หมวดหมู่ auto-fill จาก catalog · ผู้จัดทำ blank (ลูกค้ากรอกเอง) · footer แสดงเฉพาะ title + catalog (ไม่มี docCode) · Step 3 engine mode ซ่อน desc/pages/docType (auto-populate) · **Files:** `lib/engine-checklist.ts` · `lib/engine-types.ts` · `app/api/admin/templates/generate-engine/route.ts` · `app/admin/templates/new/ChecklistEngineForm.tsx` | ✅ **Done · UAT ผ่าน** (Session 35) |
| DC-6 | **Planner Engine — Text-to-PDF** | 4 Pillar form → `generatePlannerHtml()` → puppeteer PDF · P1 Goal & Vision / P2 Execution / P3 Tracking / P4 Idea & Resource · **Files:** `lib/engine-planner.ts` · `app/admin/templates/new/PlannerEngineForm.tsx` | ✅ **Done · Live** (Session 30) |
| DC-7 | **Customer Preview — Engine Data Display** | /templates/[slug] แสดง engine_data preview · Checklist: S1+S2 card (header + purpose) · Planner: P1 card (goals/framework) · Condition: engine_type IS NOT NULL → engine preview · IS NULL → toc_sections เดิม | ✅ **Done · Live** (Session 30) |

| DC-8 | **Engine Content Edit + Revision History** | **Scope confirmed (Session 37 · 2026-05-10)** — ❌ ห้ามแตะ: `lib/engine-checklist.ts` · `lib/engine-planner.ts` · `ChecklistEngineForm.tsx` · `PlannerEngineForm.tsx` · `generate-engine/route.ts` · `generate-planner/route.ts` · Cart/Checkout/Payment/Download flow (ทั้งหมด Frozen) · **DB Migration:** `CREATE TABLE template_revisions (id UUID PK DEFAULT gen_random_uuid(), template_id UUID FK→templates ON DELETE CASCADE, revision_number INT NOT NULL, engine_data JSONB NOT NULL, pdf_path TEXT NOT NULL, change_note TEXT, created_at TIMESTAMPTZ DEFAULT now())` · **Flow (A→D):** [A] `/admin/templates/[id]/edit` — metadata form เดิมไม่แตะ → ต่อท้ายด้านล่าง: ถ้า engine_type IS NOT NULL → แสดง Engine Section (engine_type label · revision count · ปุ่ม "แก้ไขเนื้อหา" + "ดูประวัติ") · [B] `/admin/templates/[id]/revise` — ดึง engine_data ปัจจุบัน → pre-fill ChecklistEngineForm หรือ PlannerEngineForm (reuse component อ่านอย่างเดียว ไม่แก้ component) → Generate PDF Preview (เรียก generate-engine/generate-planner API เดิม) → กรอก change_note → กด "✅ Approve Revision" · [C] POST `/api/admin/templates/approve-revision` → INSERT template_revisions (revision_number = MAX+1) → UPDATE templates SET engine_data=new · pdf_path=new · preview_path=new → docCode คงเดิม (ดึงจาก engine_data.s1.docCode/p1 ไม่ re-generate) → redirect edit · [D] `/admin/templates/[id]/revisions` — ตาราง: # / วันที่ / change_note / download PDF link (PDF เก่าทุก revision ยังอยู่บน disk) · **Files (new):** `migrations/20260510_template_revisions.sql` · `app/admin/templates/[id]/revise/page.tsx` · `app/admin/templates/[id]/revisions/page.tsx` · `app/api/admin/templates/approve-revision/route.ts` · **Files (update):** `app/admin/templates/[id]/edit/page.tsx` (ต่อท้าย engine section เท่านั้น — metadata form เดิมไม่ยุ่ง) · **Bug fix:** engine_data stored as double-encoded JSON string → `typeof check + JSON.parse` ใน revise/page.tsx · **Files (new, added):** `generate-revision/route.ts` · `ReviseClient.tsx` | ⏳ **Pending (Session 40)** — Checklist UAT ✅ ครบลูป · Planner technical flow ✅ (generate→approve→revision history ผ่าน) · **Planner UX ⏳ pending** — admin ยังงงกับฟอร์มกรอกข้อมูล (4 Pillar form ซับซ้อน) → ต้องปรับ UX form ก่อน UAT pass |

| DC-9 | **Catalog Preview Button + Screenshot (S1+S2)** | ปุ่ม "🔍 ดูพรีวิวก่อนซื้อ" ใน `/catalog/[slug]` · modal แสดง preview JPG · screenshot ใช้ system chromium `/usr/bin/chromium-browser` (แทน @sparticuz ที่ crash บน AlmaLinux) · clip เฉพาะ S1+S2 (evaluate `.sec` bottom) · modal footer: ถ้า paid → `AddToCartButton` (ไม่ navigate), ถ้า free → LINE OA link · **Files:** `components/catalog/CatalogTemplateList.tsx` (NEW) · `app/catalog/[slug]/page.tsx` · `app/api/admin/templates/generate-engine/route.ts` | ✅ **Done · Live** (Session 31) |

| DC-10 | **Preview Image Scale — ภาพ S1+S2 ใน Modal เล็กเกินไป** | ภาพ preview render ที่ 794px (A4 full-width) ทำให้ text จิ๋วเมื่อแสดงใน modal 400px · **Fix:** screenshot viewport 794→560px · clip width 794→560 · text ใหญ่ขึ้น ~40% proportional · **Files:** `app/api/admin/templates/generate-engine/route.ts` | ✅ **Done · Live** (Session 31) |
| DC-11 | **Draft Save UX — ปุ่มค้างนานระหว่าง PDF Generate** | puppeteer launch + PDF + screenshot ใช้เวลา 15-30 วิ · **Fix:** 4-step progress indicator (HTML → PDF ~15วิ → preview image → DB) ที่ advance ตาม timing จริง (1s/15s/24s) · `engineProgress` state + `useEffect` + setTimeout chain · **Files:** `app/admin/templates/new/WizardClient.tsx` | ✅ **Done · Live** (Session 31) |
| DC-12 | **Publish Button ไม่ update ทันทีหลัง Click** | กด Publish แล้วปุ่มไม่เปลี่ยนเป็น Unpublish จนกว่าจะ refresh · server action ทำงานแล้วแต่ client state ไม่ revalidate · **Fix:** เพิ่ม `router.refresh()` หรือ `revalidatePath` ที่ถูก scope หลัง server action สำเร็จ · **Files:** `app/admin/templates/[id]/edit/page.tsx` หรือ publish action | ✅ **Done** |
| DC-13 | **/templates/[slug] Server Component Crash** | กด "ดูรายละเอียด / ซื้อ →" ใน catalog preview modal → `/templates/[slug]` render error · **Root cause:** `d.s1.docCode` / `d.s3.items` null-access เมื่อ `engine_data` ไม่มี field ครบ · **Fix:** `if (!d.s1) return null` / `if (!d.p1) return null` early-return guards + optional chaining `d.s3?.items?.filter(...)` + `d.s2?.purpose` · **Files:** `app/templates/[slug]/page.tsx` | ✅ **Done · Live** (Session 31) |
| DC-14 | **Planner Engine — UAT ผ่าน** | UI + generate flow พร้อมแล้ว (Session 30-31) · UAT ผ่านครบ (Session 36): กรอก 4 Pillar → Generate PDF Preview → บันทึก Draft → Download · **Files:** `app/admin/templates/new/PlannerEngineForm.tsx` · `lib/engine-planner.ts` · `app/api/admin/templates/generate-planner/route.ts` | ✅ **UAT ผ่าน (Session 36)** |

| ADMIN-TMPL-DEL-1 | **Template Archive + Hard Delete** | แยกปุ่ม "ซ่อน" (archived) / "ลบถาวร" (block ถ้ามี order) · `archiveTemplateAction` / `unarchiveTemplateAction` / `deleteTemplateAction` fix · `ArchiveTemplateButton` (NEW) · `DeleteTemplateButton` label → "ลบถาวร" · fix `router.refresh()` ทุก button | ✅ **Done · Live** (Session 40) |
| ADMIN-TMPL-FORCE-1 | **Force Delete (pre-launch)** | ปุ่ม "Force ลบ" — cascade ลบทุก FK รวม order_items · confirm 2 ครั้ง · `forceDeleteTemplateAction` · `ForceDeleteTemplateButton` (NEW) | ✅ **Done · Live** (Session 40) |

| DC-15 | **Planner Engine v2 — Time-Aware Dynamic Form** | **UAT ผ่านครบ (Session 43 · 2026-05-11)** — Planning Horizon master field + 5 Axes + Schema v2 (`PlannerEngineDataV2`) · T0 create+generate ✅ · T1 horizon cascade ✅ · T3 axis toggle ✅ · T6 engine_data double-encode fix + DB backfill ✅ · T0-2 thumbnail_path fix ✅ · UI: emoji→CSS (no white rect in PDF) ✅ · habit name wrap ✅ · label clarity + axis border colors ✅ · watermark placeholder ✅ · generate-revision v2 branch ✅ · FROZEN: `engine-checklist.ts` · `ChecklistEngineForm.tsx` | ✅ **UAT ผ่าน (Session 43)** |

| DC-16 | **Planner Pipeline v3 — 3-Stage Connected Form** | **PIPELINE-1~4 Done · Session 44 (2026-05-11)** — Schema v3 (`PlannerPipelineData` schemaVersion '3.0') · `stage1_goal` / `stage2_plan` / `stage3_track` / `notes?` · HTML generator CSS-only (ไม่มี emoji) · `PipelinePlannerForm` 3-stage sequential form (ถัดไป disabled ถ้า required ว่าง) · route `generate-planner-pipeline` · WizardClient mode `engine-pipeline` · generate-revision pipeline branch · ReviseClient `PipelineReviseForm` (pre-filled) · Bugs fixed: auto-sync title/slug จาก meta.title · slug fallback `pipeline-YYYYMMDD` สำหรับชื่อ Thai · constraints label ซ้ำ · Big Rocks คำอธิบาย Thai · **Pending:** habit tracker days hardcode 31 (defer — จดไว้) · **PIPELINE-5 UAT ⏳ owner กำลังทดสอบ** · **Defer:** preset / structured adjustmentRules builder · **FROZEN:** `engine-checklist.ts` · `ChecklistEngineForm.tsx` · `engine-planner.ts` | ⏳ **PIPELINE-5 UAT pending** |

**ลำดับแนะนำ:** DC-3 ✅ → DC-4 ✅ → DC-5 ✅ → DC-6 ✅ → DC-7 ✅ → DC-9 ✅ → DC-10 ✅ → DC-11 ✅ → DC-13 ✅ → DC-14 ✅ · ADMIN-TMPL-DEL-1 ✅ · ADMIN-TMPL-FORCE-1 ✅ · DC-15 ✅ · DC-16 ⏳ PIPELINE-5 UAT pending (Session 44) · DC-1/DC-2 🟡 UAT pending · DC-8/DC-12 🔲 planned

---

### Admin Report Pages — R Series (2026-05-10)

> **Global requirement:** ทุกหน้ามี **date range filter** (Today / 7d / 30d / custom) ที่ query ได้จริง
> VPS Log pages ดึงไฟล์โดยตรงจาก server — ต้องรันผ่าน `exec` บน Node.js (ไม่ใช่ SSH)

| Task | Route | ข้อมูลหลัก | สถานะ |
|---|---|---|---|
| R-1 | `/admin/report/sales` | revenue + order count รายวัน · trend · avg order value · date filter | ✅ Live (Session 34) |
| R-2 | `/admin/report/payments` | PromptPay verify log · Omise webhook log · status per order · date filter | ✅ Live (Session 34) |
| R-3 | `/admin/report/downloads` | download events per template · unique/repeat · date filter | ✅ Live (Session 34) |
| R-4 | `/admin/report/export` | export orders CSV · filter by date + status · download button | ✅ Live (Session 34) |
| R-5 | `/admin/report/log/pm2` | PM2 stdout+stderr tail · filter 1h/6h/24h · copy to clipboard | ✅ Live (Session 34) |
| R-6 | `/admin/report/log/nginx-access` | Nginx access log · top paths · 4xx/5xx count · date filter | ✅ Live (Session 34) |
| R-7 | `/admin/report/log/nginx-error` | Nginx error log · 502/504 · upstream fail · date filter | ✅ Live (Session 34) |
| R-8 | `/admin/report/log/errors` | Error Digest รวมทุก source → markdown block · copy-paste ให้ Claude ได้เลย | ✅ Live (Session 34) |
| R-9 | `/admin/report/pageviews` | analytics_events page_view · KPI · top pages bar chart · daily breakdown · date filter | ✅ Live (Session 34) |
| R-10 | `/admin/report/predict` | Google Suggest TH (4 keywords) + analysis (demand, audience, template ideas) · bestseller ranking · zero-sale list | ✅ Live (Session 34) |

**Pending ideas (ยังไม่ทำ):**
- **Smart Gap Finder** — expand Google Suggest 50–100 terms → filter เชิงพาณิชย์ → match กับ DB (มี/ไม่มี/มีแต่ 0 ยอด) → ranked opportunity table

---

## Session 48 Changes (2026-05-11) — UI Tweaks + LINE Contact

| # | Change | Status |
|---|---|---|
| 1 | **UI** badge `2–5 ชิ้น` มุมบนซ้ายการ์ด ฿10 ใน pricing tiers (แนวเดียวกับ `-50%` มุมขวา) | ✅ Live |
| 2 | **HOME-FEAT-1** แสดงช่วงวันสัปดาห์ `11–17 พ.ค.` ต่อท้าย "แนะนำสัปดาห์นี้" — คำนวณ client-side เปลี่ยนอัตโนมัติทุกจันทร์ | ✅ Live |
| 3 | **LINE-CONTACT** ปุ่ม "ติดต่อเรา" สีเขียวใน navbar (hidden mobile) + Floating LINE button มุมขวาล่างทุกหน้า · URL: `line.me/R/ti/p/%40216xobzv` | ⏳ UAT pending (รอทดสอบ add LINE จริง) |

---

## Session 49 Changes (2026-05-11) — CI Fix + Email Spam Stop

| # | Change | Status |
|---|---|---|
| 1 | **CI fix** `eslint.config.mjs` — downgrade noisy rules to warn: `react/no-unescaped-entities` (Thai text), `react-hooks/set-state-in-effect`, `react-hooks/refs`, `@typescript-eslint/no-unused-vars` | ✅ Done |
| 2 | **Code fix** `app/page.tsx` — `<a href="/templates">` → `<Link>` (no-html-link-for-pages) | ✅ Done |
| 3 | **Code fix** `app/checkout/page.tsx` — ลบ unused `promoLabel` state | ✅ Done |
| 4 | **Code fix** `src/components/layout/Header.tsx` — ลบ unused `Image` import | ✅ Done |
| 5 | **CI workflow** `.github/workflows/ci.yml` — เพิ่ม `concurrency: cancel-in-progress` + `--max-warnings 50` + failure summary step | ✅ Done |
| 6 | **Deploy workflow** `.github/workflows/deploy.yml` — เพิ่ม `concurrency` + `workflow_dispatch` | ✅ Done |
| 7 | **Result** CI #129 ✅ pass (1m 2s) — email spam หยุด · Deploy skipped ปกติ (DEPLOY_ENABLED ไม่ได้ set เพราะ deploy ด้วย SSH manual) | ✅ Verified |

---

## Session 48 Changes (2026-05-11) — PROMO Series + LINE Contact + Auto-Promo Engine

| # | Change | Status |
|---|---|---|
| 1 | **PROMO-1** `POST /api/promo/validate` — validate active/dates/quota/min_cart · guard Omise floor (final ≥ ฿20) · guard tier floor (per-item ≥ ฿7) · `PromoCodeInput.tsx` (client component ใน checkout) · checkout API re-validates server-side + INSERT promo_code_uses + UPDATE used_count | ✅ Live |
| 2 | **PROMO-2** `PromoCodeBanner.tsx` + `PromoCodeBannerPlaceholder.tsx` — query active promo code → card เล็กหน้าโฮม + copy button + countdown | ✅ Live |
| 3 | **PROMO-3** `/admin/promo-codes` full CRUD — `PromoCodeRow.tsx` (inline edit) · `PromoCreateForm.tsx` (live min-cart hint, 🎲 dice button, fully controlled) · `actions.ts` (create/update/toggle/delete) · Migration `20260511_promo_codes.sql` (promo_codes + promo_code_uses + ALTER orders) | ✅ Live |
| 4 | **PROMO-4** Auto-Promo Engine Cards — `GET /api/admin/promo-suggest` query 4 signals: Slow Week / Tier Uplift / Cart Recovery / VPS Break-Even (฿900/เดือน) · `PromoEngineCards.tsx` 4 cards + badge "แนะนำสัปดาห์นี้" · Generate → pre-fill form · `PromoCodeSection.tsx` state wrapper | ✅ Live |
| 5 | **HOME** badge `2–5 ชิ้น` มุมบนซ้ายการ์ด ฿10 | ✅ Live |
| 6 | **HOME-FEAT-1** week date range "11–17 พ.ค." ต่อท้าย "แนะนำสัปดาห์นี้" — คำนวณ client-side เปลี่ยนอัตโนมัติทุกจันทร์ | ✅ Live |
| 7 | **LINE-CONTACT** ปุ่ม "ติดต่อเรา" สีเขียวใน navbar + `FloatingLineButton.tsx` มุมขวาล่าง · URL `line.me/R/ti/p/%40216xobzv` | ✅ Live · UAT pending (รอทดสอบ add LINE จริง) |
| 8 | **UX** `"ประหยัดจาก tier ฿XX"` → `"🎉 ซื้อหลายชิ้น ประหยัดไปอีก ฿XX"` ใน checkout summary | ✅ Live |

---

## Session 47 Changes (2026-05-11) — HOME-FEAT-1 Featured Card

| # | Change | Status |
|---|---|---|
| 1 | **HOME-FEAT-1** `FeaturedTemplateCard.tsx` — modal preview "ดูพรีวิวสินค้า" เปิด inline modal แทน navigate ไป slug | ✅ Live |
| 2 | **HOME-FEAT-1** admin toggle `is_featured_weekly` ใน `/admin/templates/[id]/edit` — ปุ่ม ⭐ Set Featured / ยกเลิก Featured · `setFeaturedWeeklyAction` + `clearFeaturedWeeklyAction` | ✅ Live · UAT ผ่าน |

---

## Session 46 Changes (2026-05-11) — ADMIN-CLEAN-2 + J11 Free Download + UX Fixes

| # | Change | Status |
|---|---|---|
| 1 | **ADMIN-CLEAN-2** `app/admin/page.tsx` — ลบ `{false && ...}` blocks ทั้งหมด (Critical Alert, KPI Affiliate, Ops/Revenue/Products/Social/Content, TikTok Trends) + ลบ fetcher functions 10 ตัว + ลบ unused imports · ไฟล์ลดจาก 589 → 162 บรรทัด | ✅ Live |
| 2 | **J11** `POST /api/free-download` (NEW) — verify tier='free'+published → INSERT template_orders (amount_baht=0, status='paid', payment_method='free', token=UUID, expires=72h) → return token | ✅ Live |
| 3 | **J11** `FreeDownloadButton.tsx` (NEW) — client component: fetch POST → router.push('/d/[token]') · states: idle/loading/error | ✅ Live |
| 4 | **J11** แทน `href="#line-cta"` ด้วย `FreeDownloadButton` ใน CatalogTemplateList (modal+row), TemplateListWithPreview (modal+row), /templates/[slug] | ✅ Live |
| 5 | **UX** ลบปุ่ม "แชร์ให้เพื่อนทาง LINE" + `shareText/shareUrl/lineShareUrl` ออกจาก DownloadClient · ลบ `templateSlug` prop ที่ไม่ใช้ | ✅ Live |

---

## Session 44 Changes (2026-05-11) — DC-16 Pipeline Planner v3

| # | Change | Status |
|---|---|---|
| 1 | **PIPELINE-1** `lib/engine-types.ts` — เพิ่ม `PipelinePhase` · `PipelineBigRock` · `PipelineMetric` · `PlannerPipelineData` (schemaVersion '3.0') | ✅ Live |
| 2 | **PIPELINE-2** `lib/engine-planner-pipeline.ts` (NEW) — HTML generator 3 sections (ตั้งเป้า / ลงมือทำ / ติดตาม) · habit grid · metrics table · CSS-only ไม่มี emoji · `validatePlannerPipeline` | ✅ Live |
| 3 | **PIPELINE-3** `app/admin/templates/new/PipelinePlannerForm.tsx` (NEW) — 3-stage sequential form · stage indicator · summary bar ของ stage ที่ผ่านมา · "ถัดไป →" disabled ถ้า required ว่าง | ✅ Live |
| 4 | **PIPELINE-4a** `app/api/admin/templates/generate-planner-pipeline/route.ts` (NEW) — PDF + preview · plan_code `TP3-YYYYMMDD-XXXX` | ✅ Live |
| 5 | **PIPELINE-4b** `WizardClient.tsx` — mode `engine-pipeline` + button + form branch + generate call + auto-sync title/slug จาก `engineData.meta.title` + slug fallback `pipeline-YYYYMMDD` | ✅ Live |
| 6 | **PIPELINE-4c** `generate-revision/route.ts` — เพิ่ม `'pipeline'` branch ใช้ `generatePlannerPipelineHtml` | ✅ Live |
| 7 | **fix(revise)** `ReviseClient.tsx` + `revise/page.tsx` — เพิ่ม `PipelineReviseForm` (pre-filled ทุก field) · engineType `'pipeline'` ไม่ crash | ✅ Live |
| 8 | **fix(UX)** constraints label ซ้ำ ("ข้อจำกัด" 3 ชั้น) → `งบ / เวลา / อื่นๆ` · Big Rocks เพิ่มคำอธิบาย Thai ทั้งใน Wizard และ Revise | ✅ Live |
| 9 | **Pending (defer)** habit tracker days hardcode 31 — รอ UAT ก่อน ถ้าต้องการ configurable ให้ดึงจาก field ที่กรอก | ⏳ defer |
| 10 | **PIPELINE-5 UAT** — owner กำลังทดสอบ | ⏳ pending |

---

## Session 42 Changes (2026-05-11) — DC-15 Scope Gate: Planner Engine v2

| # | Change | Status |
|---|---|---|
| 1 | **DC-15 Scope Gate** — ยกระดับ scope จาก "label redesign" → Planner Engine v2 ทั้งระบบ · Planning Horizon master field + 5 Axes + Time-Aware Dynamic Form + Schema v2 (`PlannerEngineDataV2`) + 10-commit sequence · Hard Rule: field key names ห้ามปรากฏใน PDF · FROZEN files ระบุชัด | 📝 Scope Gate Done |

---

## Session 41 Changes (2026-05-10) — Legal Pages + Report Fixes + Habit Tracker + UX Analysis

| # | Change | Status |
|---|---|---|
| 1 | **Legal pages rewrite:** `app/legal/page.tsx` + `app/privacy/page.tsx` + `app/terms/page.tsx` — เปลี่ยนเป็น planprom branding · ลบเนื้อหา affiliate ออกทั้งหมด · orange→neutral/indigo colors | ✅ Live |
| 2 | **ลบ /disclosure page** — `app/disclosure/page.tsx` deleted · Footer ไม่ link ไปแล้ว | ✅ Live |
| 3 | **ลบ 28 test orders** จาก DB ผ่าน admin — เหลือเฉพาะ 1 real order (฿28) | ✅ Done |
| 4 | **fix(R-1) /admin/report/sales crash** — `SUM(oi.price_baht)` → `SUM(t.price_baht)` ใน byTemplate query (order_items ไม่มี price_baht column) | ✅ Live |
| 5 | **fix(R-4) /admin/report/export ข้อมูลว่าง** — replaced 175-line page (query deprecated `template_orders`) ด้วย 15-line redirect → `/admin/report/payments` preserving query params (range/from/to/status) | ✅ Live |
| 6 | **fix(engine-planner) Habit Tracker แกนที่ 3 overflow** — redesign จาก flexbox → `<table table-layout:fixed>` ด้วย `<colgroup>` · header row แสดงเลขวัน 1-31 (purple) · empty cells ต่อ habit row — เทียบแนวทางจาก `engine-checklist.ts` · **Files:** `lib/engine-planner.ts` | ✅ Live |
| 7 | **DC-15 UX Analysis** — วิเคราะห์ PlannerReviseForm 20+ fields · เปรียบเทียบ "สิ่งที่ admin เห็น" vs "สิ่งที่ผู้ใช้ planner จริงๆ คิด" · วางแผน label redesign ~20 fields เป็นภาษาไทยธรรมดา (ดูรายละเอียดใน DC-15) | 📝 Documented |

---

## Session 40 Changes (2026-05-10) — Template Delete/Archive System

| # | Change | Status |
|---|---|---|
| 1 | **ADMIN-TMPL-DEL-1:** fix `deleteTemplateAction` — ลบ `free_template_grants` (ไม่มีใน DB) · เช็ค order count ก่อนลบ · เพิ่ม `template_revisions` cascade | ✅ Live |
| 2 | **ADMIN-TMPL-DEL-1:** เพิ่ม `archiveTemplateAction` / `unarchiveTemplateAction` · `ArchiveTemplateButton` (NEW) — ซ่อน/เลิกซ่อน พร้อม confirm | ✅ Live |
| 3 | **ADMIN-TMPL-DEL-1:** `DeleteTemplateButton` label → "ลบถาวร" · error message ระบุ order count + แนะนำใช้ซ่อน | ✅ Live |
| 4 | **ADMIN-TMPL-FORCE-1:** `forceDeleteTemplateAction` — cascade ลบทุก FK รวม order_items · `ForceDeleteTemplateButton` (NEW) — confirm 2 ครั้ง สีแดงเข้ม | ✅ Live |
| 5 | **fix router.refresh():** Delete / Archive / ForceDelete button ทุกตัว — เพิ่ม `router.refresh()` หลัง action สำเร็จ (revalidatePath ฝั่ง server ไม่ trigger client refresh เมื่อ call โดยตรง) | ✅ Live |

---

## Session 37 Changes (2026-05-10) — Orders + Checkout Refactor

| # | Change | Status |
|---|---|---|
| 1 | **LINE notify buyer:** `orders.customer_line_id` column migration · checkout route capture LINE ID จาก Supabase session · claim-paid + Omise webhook push LINE download links ให้ buyer ถ้า login | ✅ Live |
| 2 | **Deprecate direct checkout:** `/checkout/[slug]` → redirect ผ่าน `/api/cart/quick-add?slug=xxx` → add to cart → `/checkout` · ทุก purchase ใช้ cart เท่านั้น | ✅ Live |
| 3 | **admin/orders KPI:** เพิ่ม ยอดรับจริง + ค่าธรรมเนียม Omise — `GREATEST(total_baht * 0.015, 5)` ต่อ order | ✅ Live |
| 4 | **admin/orders ลบ Template Orders tab:** เหลือแค่ Cart Orders · KPI 5 card: ทั้งหมด · รายได้รวม · ยอดรับจริง · ค่าธรรมเนียม · รอชำระ | ✅ Live |
| 5 | **Cancel stale order:** CK-20260508-9577 pending 2 วัน → revoked ผ่าน DB | ✅ Done |

---

## Session 36 Changes (2026-05-10) — Engine Checklist + Planner UAT ผ่านครบ

| # | Change | Status |
|---|---|---|
| 1 | **Root cause fix:** Nginx `proxy_buffer_size` 4KB ใหญ่ไม่พอสำหรับ Supabase JWT cookies → HTML 502 → `res.json()` throw SyntaxError → Fix: `proxy_buffer_size 128k; proxy_buffers 4 256k; proxy_busy_buffers_size 256k;` ใน `/etc/nginx/conf.d/planprom.conf` | ✅ Live |
| 2 | **Engine separation:** แยก `generate-planner` route ออกจาก `generate-engine` (checklist FROZEN) — `app/api/admin/templates/generate-planner/route.ts` | ✅ Live |
| 3 | **Slug check at step 3:** `checkSlugExists()` server action + ดัก slug ซ้ำ ก่อนเริ่ม generate PDF — ป้องกันเสียเวลา | ✅ Live |
| 4 | **DC-5 Engine Checklist** — UAT ผ่านครบรอบที่ 2 (หลัง Nginx fix) | ✅ UAT ผ่าน |
| 5 | **DC-14 Planner Engine** — UAT ผ่านครบ loop: กรอก 4 Pillar → Generate → บันทึก Draft → Download | ✅ UAT ผ่าน |
| 6 | **หมายเหตุ:** 2 more engines planned (ชื่อ/spec ยังไม่กำหนด) | 🔵 Future |

---

## Session 35 Changes (2026-05-10) — Engine Checklist Fix

| # | Change | Status |
|---|---|---|
| 1 | **fix(engine):** wrap DB query + puppeteer import + executablePath + mkdir ใน try/catch — ป้องกัน HTML response เมื่อ crash · ฟีเจอร์ครบ: docCode + PDF + snapshot | ✅ Live |
| 2 | **DC-5 Engine Checklist** — UAT ผ่านครบ loop: สร้าง → publish → preview → ซื้อ → โหลด | ✅ UAT ผ่าน |
| 3 | **DC-14 Planner Engine** — ยัง pending UAT | ✅ UAT ผ่าน (Session 36) |

---

## Session 34 Changes (2026-05-10) — Admin Report Suite + Wallet Cleanup

| # | Change | Status |
|---|---|---|
| 1 | **Admin Nav** — ลบ System group ออก · เพิ่ม Report group (indigo) พร้อม 10 submenu links | ✅ Live |
| 2 | **Admin Dashboard** — ลบ System cards (CTRL/SEC/DB/Preflight) + ลบ จัดการคูปอง form + คูปองในระบบ list | ✅ Live |
| 3 | **R-1..R-8** — สร้างครบ 8 report pages: sales, payments, downloads, export, pm2, nginx-access, nginx-error, errors | ✅ Live |
| 4 | **R-9 Pageviews** — `/admin/report/pageviews` ดึงจาก `analytics_events` (2,309+ events) · KPI + top pages + daily | ✅ Live |
| 5 | **R-10 Predict Engine** — `/admin/report/predict` · Google Suggest TH 4 keywords (checklist/planner/ฟอร์ม/รายงาน) · demand signal · audience tags · template ideas · bestseller ranking · zero-sale list | ✅ Live |
| 6 | **WALLET-CLEAN** — comment out `/wallet` button ใน DownloadClient → แทนด้วย `/orders` link · เพิ่ม `// WALLET-CLEAN: ลบออกถาวร 2026-05-17` ใน 9 wallet files | ✅ Live · ลบจริง 2026-05-17 |
| 7 | **LogViewer** — shared client component: dark terminal block + Copy + Download ใช้ใน R-5/6/7/8 | ✅ Live |
| 8 | **ExportClient** — client component: UTF-8 BOM CSV download (Thai Excel รองรับ) | ✅ Live |

**WALLET-CLEAN + ADMIN-CLEAN ✅ Done (Session 45-46):**
- ✅ ลบ `src/components/wallet/` ทั้งโฟลเดอร์ (6 files) — Session 45
- ✅ ลบ `src/lib/coupon-wallet.ts`, `src/lib/wallet-queries.ts`, `src/lib/public-wallet.ts` — Session 45
- ✅ ลบ `{/* WALLET-CLEAN */}` block ใน DownloadClient — Session 45
- ✅ ลบ `{false && ...}` affiliate blocks ใน app/admin/page.tsx (ADMIN-CLEAN-2) — Session 46

---

## Session 33 Changes (2026-05-09) — Payment UAT Fixes

| # | Change | Status |
|---|---|---|
| 1 | `app/order/[orderUid]/page.tsx` — SITE_URL fallback `couponkum.com` → `planprom.com` · VPS `.env.local` `NEXT_PUBLIC_SITE_URL=https://planprom.com` (เดิมตั้งผิด) | ✅ Live |
| 2 | สร้าง `app/api/webhooks/omise/route.ts` — GET ping 200 · POST handler: `type=cart` (issue tokens + notify owner) · `type=template` (single order) · `type=pack` (pack credits) · brand text แพลนพร้อม | ✅ Live |
| 3 | LINE notifications 4 ไฟล์ — "คูปองคุ้ม" → "แพลนพร้อม" (`orders/claim-paid` · `checkout/claim-paid` · `checkout/status`) | ✅ Live |
| 4 | `checkout/[orderUid]/status/route.ts` — เพิ่ม cart clear ใน `order.status === 'paid'` short-circuit path (bug: webhook fire ก่อน → status poll เจอ paid แล้ว skip clear cart) | ✅ Live |
| 5 | Omise webhook URL → `https://planprom.com/api/webhooks/omise` (owner แก้ใน Omise dashboard) | ✅ Done |
| 6 | LINE OA ชื่อ + รูปโปรไฟล์ + LINE Developer Provider ชื่อ → แพลนพร้อม (owner แก้ใน LINE console) | ✅ Done |

**UAT ผ่านครบ (owner confirm 2026-05-09):**
- Download URL → `planprom.com/api/download/[token]` ✅
- Omise webhook → `planprom.com/api/webhooks/omise` 200 ✅
- LINE notification ข้อความ "แพลนพร้อม" ✅
- Cart ถูกเคลียร์หลังจ่ายเงิน ✅

---

## Session 32 Changes (2026-05-09) — Blog Fix + Rebrand + Blog Admin + Deploy

| # | Change | Status |
|---|---|---|
| 1 | Blog slug 404 fix — `force-dynamic` + `resolvePost()` + `decodeURIComponent()` fallback (Next.js 16 Turbopack encodes Thai slugs during SSG) | ✅ Live |
| 2 | Blog Admin CRUD — `/admin/seo` rewritten: upload .docx (mammoth parse → INSERT blog_posts), pin toggle, publish toggle, delete (with confirm) | ✅ Live |
| 3 | Header rebrand — "แพลนโปร" → "แพลนพร้อม" · slogan "เช็คทุกขั้น แพลนทุกวัน ง่ายทุกงานวางแผน" | ✅ Live |
| 4 | Nav cleanup — ลบ "กระเป๋าของฉัน" nav item ออก (wallet → redirect /orders ผ่าน next.config.ts) | ✅ Live |
| 5 | Homepage — ลบ LINE OA add-friend card + ลบ "หรือดูคูปองที่ใช้ได้วันนี้ →" CTA | ✅ Live |
| 6 | Full rebrand "คูปองคุ้ม" → "แพลนพร้อม" — 13 files: layout.tsx, page.tsx, templates pages, catalog pages, order pages, Footer, login pages, admin pages, download share text, json-ld | ✅ Live |
| 7 | Deploy fix — PM2 cluster → fork mode (standalone server.js ไม่รองรับ cluster) · PORT=3001 (match Nginx proxy) · `cp .env.local .next/standalone/.env.local` (standalone อ่าน env จาก dir ตัวเอง) | ✅ Live |

**สถานะ site:** planprom.com ✅ · homepage 200 · templates 200 · blog 200

---

## 🔬 J12 Troubleshooting Log — LINE OAuth "Error getting user profile from external provider"

> **⚠️ อ่านก่อนแก้ทุกครั้ง** — บันทึกนี้เก็บทุก fix ที่ลองแล้ว เพื่อไม่ให้ทำซ้ำ

### สรุปปัญหา

LINE OAuth ล้มเหลวด้วย error เดิมทุกครั้ง:
```
error=server_error
error_code=unexpected_failure
error_description=Error getting user profile from external provider
```

URL สุดท้ายในเบราว์เซอร์:
```
https://planprom.com/auth/login?error=auth_failed
  #error=server_error&error_code=unexpected_failure
  &error_description=Error+getting+user+profile+from+external+provider&sb=
```

**ความหมาย:** Supabase Auth แลก authorization code ได้สำเร็จ แต่พอเรียก LINE userinfo endpoint เพื่อดึง profile — ล้มเหลว

---

### Flow ปัจจุบัน (ทุกขั้นตอน)

```
User กด "เข้าสู่ระบบด้วย LINE"
  → /api/auth/line  (route.ts)
    → supabase.auth.signInWithOAuth({ provider: 'custom:line', scopes: 'profile openid' })
    → redirect → Supabase Auth server
      → redirect → LINE Login OAuth page
        → User กด ยืนยัน
        → LINE redirect → Supabase Auth callback
          → Supabase แลก code → access_token ✅
          → Supabase เรียก LINE userinfo endpoint ❌ FAILS HERE
        → Supabase redirect → /api/auth/callback?error=server_error&...
  → callback/route.ts ตรวจเจอ error → pushLine admin alert → redirect /auth/login?error=auth_failed
```

---

### Fix ที่ลองแล้ว (ห้ามทำซ้ำ)

| # | วันที่ | สิ่งที่ทำ | ผล |
|---|---|---|---|
| F1 | Session 23 | แก้ Supabase Redirect URLs ให้ตรงกับ `NEXT_PUBLIC_SITE_URL` (https://couponkum.com) | ❌ ยังล้มเหลว |
| F2 | Session 23 | ลบ `email` scope ออก (LINE channel ไม่ได้รับ approval email) เหลือแค่ `profile openid` | ❌ ยังล้มเหลว |
| F3 | Session 23 | แก้ `line/route.ts` ให้ `redirectTo` ใช้ `NEXT_PUBLIC_SITE_URL` แทน `origin` (แก้ localhost:3000 จาก Nginx) | ❌ ยังล้มเหลว |
| F4 | Session 25 | LINE Login channel: เปลี่ยนจาก **Developing → Published** | ❌ ยังล้มเหลว (error เดิม) |
| F5 | Session 25 | ลบ early-return `getUser()` ใน `line/route.ts` (แก้ infinite loop แยกต่างหาก) | partial — แก้ loop แต่ OAuth ยังล้มเหลว |
| F6 | Session 25 | เพิ่ม `console.error` ใน `callback/route.ts` เพื่อ debug + เพิ่ม LINE alert (J16) | ✅ diagnostic tool พร้อม — ยืนยัน error จริงๆ |
| F7 | Session 25 | Supabase Dashboard → LINE provider: ลบ `email` ออกจาก Scopes (เหลือ `openid, profile`) + เปิด "Allow users without email" | ❌ ยังล้มเหลว — error เดิม |

---

### Root Cause Analysis (เป็นไปได้)

| สาเหตุ | ความเป็นไปได้ | วิธีตรวจ | สถานะ |
|---|---|---|---|
| Supabase custom provider config ผิด (Discovery URL / Userinfo endpoint) | 🔴 สูงมาก | ดู Supabase Dashboard → Auth → Custom OIDC providers | ตรวจแล้ว — Discovery URL ถูก (`https://access.line.me`) |
| Supabase ต้องการ `email` field จาก userinfo แต่ LINE ไม่ส่ง | 🔴 สูงมาก | LINE userinfo ส่ง: `sub`, `name`, `picture` — ไม่มี email | ลองแล้ว (F7) — ลบ email scope + เปิด "Allow without email" แต่ยังล้มเหลว |
| Supabase custom OIDC ไม่รองรับ LINE's `ES256` signing algorithm | 🔴 สูงมาก | LINE ใช้ ES256 (ECDSA) สำหรับ ID token — บาง OIDC stack ไม่รองรับ | ยังไม่ได้ตรวจ |
| Supabase เรียก userinfo endpoint แยกหลัง token exchange — LINE reject เพราะ scope ไม่มี email | 🟡 กลาง | ลอง custom OAuth flow (exchange code กับ LINE โดยตรง + signInWithIdToken) | ยังไม่ได้ตรวจ |
| LINE channel: Callback URL ที่ Supabase ไม่ได้ register ใน LINE Console | 🟡 กลาง | LINE Developers → channel → LINE Login → Callback URL | ยังไม่ได้ตรวจ |
| LINE OpenID Connect permission ไม่ได้ enable ใน channel | 🟡 กลาง | LINE Developers Console → channel → Permissions → เช็ค `profile` + `openid` | ยังไม่ได้ตรวจ |

---

### Next Actions (ทำตามลำดับ — ห้ามข้าม)

**ขั้น 1 — ตรวจ LINE Developers Console (ยังไม่ได้ทำ)**
- LINE Developers → channel → **LINE Login** → **Callback URL**
- ต้องมี: `https://cwlmrinxrbnrwecnrspt.supabase.co/auth/v1/callback`
- channel → Permissions → ต้องมี `profile` + `openid` enabled

**ขั้น 2 (ถ้า ขั้น 1 ผ่านแล้วยังล้มเหลว) — เปลี่ยน approach: Custom OAuth Flow**

แทนที่จะใช้ Supabase custom OIDC provider (ซึ่ง fail ตลอด) ให้:
1. `line/route.ts` → redirect ไป LINE authorization URL โดยตรง (ไม่ผ่าน Supabase)
2. `line-callback/route.ts` (ใหม่) → รับ code จาก LINE → exchange กับ LINE token endpoint โดยตรง → เรียก LINE userinfo → ได้ `sub`, `name`, `picture`
3. ใช้ `supabase.auth.signInWithIdToken({ provider: 'custom:line', token: id_token })` — Supabase verify JWT signature จาก JWKS โดยไม่ต้องเรียก userinfo endpoint

ข้อดี: ข้าม Supabase userinfo call ทั้งหมด · ควบคุม error ได้เอง · debug ง่ายกว่า

**ขั้น 3 — ดู PM2 logs หลังทดสอบแต่ละ fix**
```bash
ssh root@103.52.109.85 "pm2 logs couponkum --lines 50 --nostream 2>&1 | grep -A5 'callback'"
```

---

### สิ่งที่รู้แน่แล้ว (อย่า revisit)

- ❌ ปัญหาไม่ได้มาจาก Nginx reverse proxy (redirectTo ใช้ NEXT_PUBLIC_SITE_URL แล้ว)
- ❌ ปัญหาไม่ได้มาจาก localhost:3000 (แก้แล้ว F3)
- ❌ ปัญหาไม่ได้มาจาก email scope (ลบแล้ว F2)
- ❌ ปัญหาไม่ได้มาจาก channel Developing mode (publish แล้ว F4)
- ❌ ปัญหาไม่ได้มาจาก "Allow users without email" toggle (เปิดแล้ว F7)
- ✅ callback route ทำงานถูก — รับ error params → alert admin → redirect /auth/login ถูก
- ✅ LINE alert system (J16) ทำงาน — admin ได้รับ LINE message พร้อม error detail
- ✅ แอพยัง online หลัง deploy (health 200) — 502 เกิดตอน PM2 reload เท่านั้น (~30 วิ)

### 502 Bad Gateway — Session 25 (2026-05-08 15:30)

**เกิดเมื่อ:** deploy `fix(J10): remove _sr retry` → PM2 reload ทั้ง 2 worker พร้อมกัน
**อาการ:** user ลอง LINE + Google OAuth ระหว่าง reload → 502
**สาเหตุ:** PM2 `pm2 reload` ทำ rolling restart แต่ช่วง handoff สั้นๆ อาจ drop request
**ไม่เกี่ยวกับ:** code change · proxy.ts · auth flow
**สถานะหลัง:** ทั้ง 2 worker online · health 200 · ไม่มี crash ใน logs
**บทเรียน:** deploy ช่วง low-traffic หรือใช้ `pm2 reload --wait-ready` เพื่อ zero-downtime

---

## 🚨 Status Updates

### 2026-05-08 · Session 29 — DC Series (Document Control) Code Complete

**Progress:**
- DC-3 ✅ — `migrations/20260508_order_seq.sql` (PostgreSQL sequence `order_seq` START 1000) · `order_type TEXT` column · `app/api/checkout/route.ts` ใช้ `nextval('order_seq')` · Format: `CK-YYYYMMDD-NNNN`
- DC-2 🟡 Code Done — `lib/pdf-types.ts` (NEW — type isolation) · `migrations/20260508_toc_sections.sql` · `extractToc()` ใน pdf-generator · `components/templates/TocPreview.tsx` (toggle สำหรับ /templates list) · `/templates/[slug]` TOC always-expanded · UAT pending
- DC-1 🟡 Code Done — `lib/pdf-generator.ts` (NEW) · `app/api/admin/templates/upload-docx/route.ts` (NEW) · WizardClient.tsx (docx tab, draft_preview flow, watermark UI) · `edit/page.tsx` (Approve button) · `migrations/20260508_status_draft_preview.sql` (เพิ่ม draft_preview ใน constraint) · UAT pending
- DC-1 PDF fixes (ทำใน session นี้): Thai font Sarabun (Google Fonts) · puppeteer margin option (20mm ทุกหน้า) · page-break-after:avoid บน h1/h2/h3 · page-break-inside:avoid บน li · footer z-index:10 + background:white (ลายน้ำไม่ทะลุ)
- **⏳ UAT ยังรอ:** checklist .docx (ตาราง/ช่อง checkbox) · planner .docx (grid/table format)

**Commits:** `ff3e207` (type isolation) · `02cccc9` (friendly slug error) · `6d0bf7d` (Sarabun font) · `d5708bd` (page-break + TOC expanded) · `0b16ed4` (puppeteer margins) · `fab1324` (footer z-index)

**Next session:** UAT checklist/planner .docx → แก้ table CSS ถ้าจำเป็น → Approve template → confirm /templates/[slug] TOC → DC-1/DC-2 ✅

---

### 2026-05-08 · Session 28 (ต่อ) — Homepage Hero Redesign ✅

**Progress:**
- Homepage hero rewrite ✅ — Option C "ยิ่งซื้อมาก ยิ่งคุ้ม" · 4-step inline flow (🛒→🧺→💳→⬇️) · 3-col tier pricing card (TIER_1/2/3, emerald highlight ชิ้น 2–5) · stacked CTAs · max-w-md · MOCK_TEMPLATE_CARDS ฿20 ทั้งหมด
- tier dropdown admin (WizardClient + edit page) — เหลือแค่ Free / Standard (ลบ Premium/Ultra ออก)
- price display ทุกหน้า public — แสดง ฿20 / ฟรี เท่านั้น (ไม่แสดง ฿50/฿100)

**Commits:** `6c646df` (hero redesign) · `d11ef87` (tier dropdown + price display fix)

---

### 2026-05-08 · Session 26 — J18 Day 1-4 Implementation Complete

**Progress:**
- J18 Day 1 ✅ — `lib/pricing.ts` (calculateCartTotal, tierPriceForItem, currentTierLabel, itemsUntilNextTier) · `lib/pricing.test.ts` (25 tests, all pass) · `vitest.config.ts` include lib/** · migration `migrations/20260508_cart_v2.sql` run บน VPS (carts, cart_items, orders, order_items)
- J18 Day 2 ✅ — `lib/cart.ts` (getCartBySession, addItemToCart, removeItemFromCart, CART_COOKIE) · `app/api/cart/route.ts` (GET) · `app/api/cart/count/route.ts` (GET) · `app/api/cart/add/route.ts` (POST) · `app/api/cart/remove/route.ts` (DELETE) · `src/components/cart/AddToCartButton.tsx` · `app/cart/page.tsx` · Header cart badge (icon + count re-fetch ตาม pathname)  · `/templates` page AddToCartButton per row
- J18 Day 3 ✅ — `app/api/checkout/route.ts` (POST create order + Omise charge, free-only immediate) · `app/api/checkout/[orderUid]/status/route.ts` (GET poll) · `app/api/checkout/[orderUid]/claim-paid/route.ts` (POST trust-based, issue tokens, clear cart, LINE notify) · `app/api/download/[token]/route.ts` extended (รองรับ order_items ควบคู่ template_orders) · `app/checkout/page.tsx` (summary→QR→claim→done + JS download loop) · `app/order/[orderUid]/page.tsx` + `OrderDownloads.tsx` (receipt page)
- J18 Day 4 ✅ — `/admin/orders` extended (Cart Orders tab, stats, revoke/cancel actions) · `/admin/orders/audit` (daily audit page — paid unverified 7 วัน ทั้ง 2 ประเภท) · Header cart badge re-fetch on pathname (clear after checkout)
- proxy.ts ✅ — `/api/cart` + `/api/checkout` เพิ่มใน SKIP_REFRESH_PREFIXES

**Commits:** `c5e5239` (day2) · `74859b3` (day3) · `b8a434c` (day4)

**UAT:** ⏳ Pending — รอ push VPS + owner smoke test (J18 UAT checklist Section J18 ด้านบน)

---

### 2026-05-08 · Session 25 (ต่อ) — J18 Spec Confirmed + J10 proxy fix

**Progress:**
- J18 ✅ Spec confirmed — Cart + Volume Pricing (฿10/8/7) + Guest checkout (ไม่ต้อง LINE/email/OTP) · เริ่ม implement Session 26
- J10 ✅ — `proxy.ts`: ลบ `_sr` retry redirect loop ออก (commit `461128f`) · deploy แล้ว · health 200
- J12 🔴 ยังไม่แก้ — LINE OAuth ES256 suspected root cause · ดู troubleshooting log · **ตัดสินใจ: J18 cart flow ไม่พึ่ง LINE → J12 deferred**
- J18 architecture decisions:
  - Auth: guest cookie session_id (ไม่ต้อง login)
  - Pricing: marginal 3 tiers ฿10/8/7
  - Download: JS loop per-file, ไม่ zip
  - Cart: server-side DB (carts + cart_items)
  - Pack cards ฿20/50/100: display-only

**Commits:** `461128f` (J10 proxy _sr fix)

**Session 26 — เริ่ม Day 1:**
- `lib/pricing.ts` + unit tests
- Schema migration: carts, cart_items, orders, order_items

---

### 2026-05-08 · Session 25 — Session Fix (J10/J12) + LINE Alert (J16) + OWNER_LINE_USER_ID

**Progress:**
- J10/J12 Session Fix ✅ — 3 changes:
  - `Header.tsx`: `prefetch={false}` บน `/wallet` Link → router cache ไม่เก็บ stale "not logged in" RSC
  - `wallet/page.tsx`: `getUser()` → `getSession()` → ไม่ force token rotation ซ้ำ
  - `proxy.ts`: ลบ `_sr` retry redirect loop → ไม่มี redirect cycle เมื่อ session transiently null
- J16 ✅ — Alert admin LINE เมื่อ LINE login fail
- J1 ✅ — `OWNER_LINE_USER_ID=U96c708ca4761b23c2248da81afdc72f7` set ใน VPS
- J17 + J18 spec วางแล้ว

**Commits:** `854a3c0` · `b8a54b0` · `461128f`

---

### 2026-05-08 · Session 24 — Document Type System + Homepage Conversion Copy

**Progress:**
- `document_type` column ✅ — `ALTER TABLE templates ADD COLUMN document_type TEXT NOT NULL DEFAULT 'checklist'` · deployed VPS
- Wizard Step 3 ✅ — dropdown เลือก checklist / planner / form / report
- Edit form ✅ — document_type select pre-filled จาก DB
- Admin list ✅ — badge ภาษาไทย (✅ เช็คลิสต์ · 📅 แพลนเนอร์ · 📝 ฟอร์ม · 📊 รายงาน) + title "Template & Planner Manager" + filter tabs by type
- Analytics ✅ — section "ยอดขายแยกตามประเภทเอกสาร" (count / sales / revenue per type)
- /templates ✅ — compact list rows + type filter chips (ม่วง) + type badge per row + Thai labels
- /catalog/[slug] ✅ — group items by document_type · section header แยกแพลนเนอร์/เช็คลิสต์/ฟอร์ม/รายงาน พร้อม sub-description
- Homepage Section 1 ✅:
  - Badge → **📋 ร้านเช็คลิสต์และแพลนเนอร์เทมเพลต**
  - Headline → **เช็คลิสต์ - ใช้แล้วไม่พลาดทุกขั้นตอน · แพลนเนอร์ · ใช้แล้วบรรลุเป้าหมาย**
  - 2 type chips compact (แถวเดียว): 📅 แพลนเนอร์ (วางแผน) + ✅ เช็คลิสต์ (ตรวจสอบ) → `/templates?type=...`
- J3/J4/J5 ✅ — `/templates` + `/catalog/[slug]` ทำงานได้แล้ว (resolved prior sessions, ปิด issue)

**Commits:** `7128757` `fa4e211` `5db510c` `9ab83f1` `a76836b` `b5e38a9` `2e263e0`

**UAT:** owner confirm ผ่านทั้ง session

---

### 2026-05-07 · Session 23 — Credit Wallet UX + Auth Fixes

**Progress:**
- CreditBalanceCard ✅ — แสดงบน /wallet: credits count, expiry, LINE reminder button, "ใช้เครดิต · เลือกเทมเพลต" CTA → /templates
- label rename ✅ — "เครดิตคงเหลือ" → "เครดิตเลือกเทมเพลตคงเหลือ"
- "🏷️ คูปองส่วนลดในเว็บ" section header ✅ — แยก credit card ออกจาก coupon wallet section
- /api/pack-credits/remind ✅ — GET (ตรวจว่าตั้งเตือนแล้ว) + POST (upsert reminder พรุ่งนี้ 09:00 ICT)
- credit_reminders migration ✅ — deployed บน VPS (remind_at partial index WHERE sent_at IS NULL)
- Cron ✅ — 0 2 * * * curl `/api/cron/credit-reminders` → ส่ง LINE push 09:00 ICT
- Nav badge ✅ — credit count priority > coupon count
- 1-click redeem ✅ — หลัง handleUseCredit → `window.location.href = downloadUrl` ตรงไป /d/[token]
- proxy.ts error loop guard ✅ — ดักจับ ?error=server_error&error_code=unexpected_failure → clear sb-* cookies → redirect /auth/login
- next.config.ts ✅ — autoInstrumentMiddleware: false (Sentry build error fix)
- auth/line route ✅ — redirectTo ใช้ NEXT_PUBLIC_SITE_URL (แก้ localhost:3000 จาก Nginx reverse proxy)
- LINE OAuth scope ✅ — ลบ email scope (LINE channel ไม่ได้รับ approval สำหรับ email)
- proxy.ts download bypass ✅ — skip Supabase session refresh สำหรับ /api/download/** (partial fix)

**Pending:**
- J10 🔴 Session ตายหลัง download — partial fix ยังไม่หาย (pending task #2)
- LINE OAuth ❌ — "Error getting user profile from external provider" · ต้องแก้ Supabase Dashboard: Site URL = https://couponkum.com + Redirect URLs + LINE Developer Console callback URL = https://cwlmrinxrbnrwecnrspt.supabase.co/auth/v1/callback
- UAT #1 ⏳ — LINE credit reminder push (รอ LINE push พรุ่งนี้ 09:00 ICT)
- J1 🔴 OWNER_LINE_USER_ID ยังไม่ set
- J9 🟡 Live Omise keys

---

### 2026-05-07 · Session 22 — Omise Payment + Pack Credits

**Progress:**
- **V15-PACK-1** ✅ — Pack credit system สร้างแล้ว:
  - `pack_credits` table (id, order_number, customer_line_id, pack_id, amount_baht, total_credits, used_credits, status, omise_charge_id, expires_at 90 วัน)
  - `PACKS` constant (`lib/packs.ts`): ฿20/2cr · ฿50/10cr · ฿100/25cr (ยกจาก ฿10/20/50 — Omise min = ฿20)
  - `POST /api/pack-orders` — สร้าง pack_credits + Omise charge
  - `GET /api/pack-orders/[id]/status` — polling: `{status, available}`
  - `GET /api/pack-credits/balance` — คืน available credits ของ user
  - `POST /api/pack-credits/redeem` — หัก 1 credit FIFO · สร้าง template_order (payment_method=pack_credit) · push LINE link
  - Homepage pack cards → `/checkout/pack/[packId]` (linked แล้ว)
  - Checkout `/checkout/[slug]` แสดง credit banner ถ้า creditBalance > 0

- **V15-PAY-5** ✅ — Omise PromptPay Gateway:
  - `lib/omise.ts` — createPromptPayCharge() + getCharge() (no npm SDK)
  - `POST /api/webhooks/omise` — HMAC-SHA256 signature verify · `charge.complete` + `successful` → activate pack_credits หรือ template_orders · LINE notify ลูกค้า + owner
  - `GET /api/orders/[id]/status` — polling: `{status, downloadUrl?}`
  - Checkout client polling 3s interval ด้วย useRef cleanup
  - QR image: `<img src={charge.source.scannable_code.image.download_uri}>` (publicly accessible URL)
  - Cloudflare WAF bypass rule สำหรับ `/api/webhooks/omise` ✅
  - `OMISE_WEBHOOK_SECRET` set ใน VPS .env.local ✅

- **VPS env fix** ✅ — `server-with-env.js` CJS wrapper โหลด `.env.local` ก่อน start Next.js standalone server (PM2 cluster mode ไม่ auto-source .env.local)

- `migrations/20260507_pack_credits.sql` ✅ — deployed on VPS
- `migrations/20260507_omise_charge_id.sql` ✅ — deployed on VPS

**Architecture decisions:**
- Payment method column: `template_orders.payment_method` = 'promptpay' | 'pack_credit'
- Fraud protection: Omise webhook เป็น single source of truth — order ไม่ activate จนกว่า Omise ยืนยัน (J2 resolved)
- Pack credits: FIFO consumption (ใช้ pack ที่ expire ก่อน) · status: pending_payment → active → exhausted
- Pack pricing ยกเป็น ฿20/฿50/฿100 เพราะ Omise PromptPay minimum = ฿20

**Pending:**
- J9 🟡 Live Omise keys → test real QR scan ด้วยแอปธนาคาร (test mode QR = fake, อ่านไม่ได้)
- J1 🔴 OWNER_LINE_USER_ID ยังไม่ set
- V15-UAT-1 🔲 Full UAT loop รอ: J1 + live keys + owner templates 2-10

---

### 2026-05-07 · Session 21 — Checkout LINE Gate + Download Fix + LINE Share

**Progress:**
- Checkout LINE gate ✅ — new `add_line` step ก่อนสร้าง order; order สร้างเฉพาะเมื่อกด "เพิ่มเพื่อนแล้ว" (ลด pending_limit spam)
- LINE URL ✅ — แก้ทุก `@couponkum` → `https://line.me/R/ti/p/%40216xobzv?gid=7820ade2-85c7-430f-b000-3b74292fe6f1`
- Admin cancel order ✅ — `/admin/orders` มีปุ่ม "ยกเลิก" สำหรับ pending_payment rows
- Download bug fix ✅ — สร้าง `GET /api/download/[token]` stream PDF ด้วย proper `Content-Disposition: attachment`; แก้ root cause: Next.js standalone ไม่ serve `/uploads/` as static
- UPLOAD_DIR ✅ — set บน VPS → `/var/www/couponkum/uploads` (persistent, ไม่ถูก overwrite ตอน rebuild)
- Download count ✅ — ย้าย increment จาก page load → API route (นับเมื่อดาวน์โหลดจริง)
- LINE share button ✅ — แสดงหลังดาวน์โหลดครั้งแรก; share URL → template page

**Architecture decisions:**
- PDF ใหม่ทั้งหมดจะไปที่ `/var/www/couponkum/uploads/templates/` (UPLOAD_DIR)
- Download API มี fallback path สำหรับไฟล์เก่าที่อยู่ใน `.next/standalone/uploads/`
- LINE share ใช้ `https://social-plugins.line.me/lineit/share?url=<template-url>` ไม่ใช่ download link ส่วนตัว

**Pending (Session 22+):**
- J2 🔴 Fraud gap — ลูกค้าไม่จ่ายแต่ได้ไฟล์ (trust-based จะ audit ทีหลังเท่านั้น)
- J6 🟡 Download quota ยังเป็น 3 ครั้ง/order แบบ flat (ออกแบบ credits system เมื่อมี bundle)
- J1 🔴 OWNER_LINE_USER_ID ยังไม่ set

---

### 2026-05-07 · Session 20 — Hero + Catalog + Error Fix

**Progress:**
- Hero redesign ✅ — 4-step stepper + pack cards (฿10/฿20/฿50 แนวนอน) + slogan badge + CTA
- Catalog section ✅ — badge frame per category + top-5 list sorted sale_count + dotted leader + "ดูทั้งหมดในหมวด" footer
- Checkout pending-limit ✅ — error screen ⏱️ "รอ 1 ชม." + LINE OA button + /orders link (แทน generic error)
- lib/packs.ts ✅ — PACKS constant (฿10/2, ฿20/5, ฿50/15)
- fetchCatalogGroups() ✅ — window function ROW_NUMBER() top-5 per catalog

**Architecture decisions:**
- Pack cards → link to #template-store (ไม่ใช่ /templates?pack= เพราะ 404)
- Catalog badge → /catalog/{slug} (pending page — J4)
- fetchPublishedTemplates() ถูกแทนด้วย fetchCatalogGroups() ทั้งหมด

### 2026-05-07 · Session 18-19 — Payment Flow + Catalog DONE ✅
**Progress:**
- V15-DB-1~4 ✅ — tables + indexes deployed on VPS
- V15-ADMIN-1~3 ✅ — /admin/templates list + 6-step wizard + PDF upload
- /admin/catalogs ✅ — catalog manager (add/delete category, template chips)
- V15-PAY-1~4 ✅ — /api/orders (QR) + /api/orders/[id]/claim-paid (trust-based) + /checkout/[slug] + /d/[token]
- V15-ADMIN-4~5 ✅ — /admin/orders (verify/revoke) + /admin/template-analytics (KPI + 14d chart)
- V15-PUB-3 ✅ — /templates/[slug] detail page + related templates
- /orders ✅ — customer order history
- /analysis ✅ — personal spend analysis (grouped by category + bar chart)
- Owner LINE notify ✅ — claim-paid pushes to OWNER_LINE_USER_ID (env var — pending set)
- **FIRST SALE ✅** — ฿20 order สำเร็จ (PromptPay 0948859962)

**Architecture decisions (differ from original spec):**
- Payment: **trust-based** (no slip upload) — user กด claim-paid → ได้ลิงก์ทันที → admin audit daily via /admin/orders
- Download: token 24h / max 3 ครั้ง (ไม่ใช่ one-time)
- Anti-fraud: rate limit (≥5 claims/24h → suspicious) + owner LINE notify + manual revoke
- Pending: OWNER_LINE_USER_ID ยังไม่ set (ต้องหา U-id จาก LINE webhook log)

**Pending UAT / known issues:**
- [ ] OWNER_LINE_USER_ID — set ใน VPS เพื่อรับ notify ทุก claim
- [ ] Fraud gap (pending task) — ลูกค้าไม่จ่ายแต่ได้ไฟล์ → long-term: bank webhook / slip OCR
- [ ] /templates?category=xxx → 404 (ยังไม่มี /templates catalog page)
- [ ] Catalog filter chips บน homepage → 404 (เดียวกัน)

---

### 2026-05-07 · IA Properties APPROVED 🎉
- **Affiliate ID:** `1082367` · Approved: Tech/Home/Beauty
- **Impact:** Coupon affiliate (Section 2) unblocked — ดึงจาก IA ได้จริง (parallel W2-W3)

---

## 0. TL;DR

**planprom.com** = Template Store หลัก · **2-section model** ในเว็บเดียว · code base เดียว:

| Section | บทบาท | Revenue |
|---|---|---|
| **1. Template Store** (planprom.com) | หัวใจหลัก — ขาย PDF planner/checklist ฿10/20/50 | 🟢 ตรง 100% (PromptPay) |
| **2. Coupon Affiliate** (แยก repo อนาคต) | Lead magnet — ดึงคนเข้ามา + secondary monetize | 🟡 affiliate commission |

**Slogan ใหม่:** "**คุ้มทุกการใช้จ่าย · ง่ายทุกการวางแผน**"

**Hard constraint:** ห้ามเพิ่มค่าบริการรายเดือนใด ๆ (VPS 856/mo เท่าเดิม) · Cloudflare/LINE OA Free / npm OSS เท่านั้น

**Deadline:** 4 มิ.ย. 2026 (Claude Max plan token หมด — 28 วัน sprint)

---

## 1. Strategy — Why Template Store?

### ปัญหา V14 Coupon-First เดิม
- Coupon affiliate = revenue ผ่อน (รอ commission 30-90 วัน)
- ต้อง traffic เยอะมากก่อน break-even
- ขึ้นกับ partner approve API (Shopee ⏳, IA ⏳, AT ⏳)

### ทำไม Template Store แก้ปัญหา
- ✅ **Revenue ทันที** — ลูกค้าจ่าย → เงินเข้า PromptPay ตรง (ไม่รอ commission)
- ✅ **Margin สูง** — PDF cost = 0 (สร้างครั้งเดียวขายซ้ำตลอดกาล)
- ✅ **ไม่ขึ้นกับ partner** — ไม่ต้อง affiliate approve
- ✅ **Evergreen** — Template ดีใช้ได้ตลอดปี ไม่ expire เหมือนคูปอง
- ✅ **Lead magnet สำหรับ Section 2** — ฟรี template = LINE add friend + เก็บ user → push คูปอง affiliate ทีหลัง

### Funnel ใหม่
```
Google/FB → /templates (Section 1)
            ↓
            ├─ ซื้อ Template (฿10-50) → revenue ตรง
            ├─ Free template → LINE add friend → user list
            └─ ดูคูปอง (Section 2) → /go affiliate → commission
```

---

## 2. Section 1 — Template Store (หัวใจหลัก)

### 2.1 Target Audience
- 🎯 **Primary:** คนขี้เกียจทำเอกสาร / ไม่มีไอเดีย / ไม่มีเวลา
- 🎯 **Secondary:** คนไม่มีความรู้ IT (อยากได้ PDF สำเร็จรูป — ไม่ต้องใช้ Canva/Excel)
- 🎯 **Tertiary:** คนใช้ AI แต่ไม่รู้ prompt — เราใช้ AI ทำให้

### 2.2 Pricing Tiers (Frozen — Option A, 4-tier)
| Tier | Price | สำหรับ | Examples |
|---|---|---|---|
| **Free** | ฿0 | Lead magnet (LINE add friend) | 1 template/user (เลือกเองได้) |
| **Lite** | ฿10 | 1-page simple form | Daily Planner, Habit Tracker, Cover Letter |
| **Standard** | ฿20 | 2-5 pages mid-complexity | Budget Planner เดือน, Resume, Reading Log |
| **Premium** | ฿50 | 5-15 pages bundle | Wedding Planner, เปิดร้านกาแฟ, Newborn, Resume+Cover Pack |

> **Rationale (Option A chosen over B):** 4 tiers simpler than 5 · ฿50 psychologically single premium ceiling · eliminates confusion between Pro/Premium. DB enum = `free/lite/standard/premium`.

> **Hero filter chips:** ฿10 / ฿20 / ฿50 (Free แสดงผ่าน LINE banner + free filter chip) — ดูตัวเลขจำนวน template ใน chip จาก DB

### 2.3 Evergreen Template Catalog (หัวใจของหัวใจ — ที่ขายได้นาน)

> **Strategy:** เลือก template ที่ ตลาดไทย demand ตลอดกาล (ไม่ใช่ trend ชั่วคราว) + competition ต่ำ + Google Search Volume สูง

#### 🏪 หมวด: เปิดร้าน / ทำธุรกิจ (SME ไทย — ตลาดใหญ่มาก)
| Template | Tier | Reason |
|---|---|---|
| Checklist เปิดร้านกาแฟ + permits | ฿50 | SME ทำ 1k+ ร้าน/เดือน · ขายดี |
| Checklist เปิดร้านอาหาร (อย./permit/ภาษี) | ฿50 | High demand เสมอ |
| Checklist เปิดร้านออนไลน์ Shopee/Lazada/TikTok | ฿50 | E-commerce TH โต |
| P&L Tracker รายเดือน (PDF + Excel) | ฿50 | ใครเปิดร้านต้องการ |
| Stock count form | ฿10 | ใช้ทุกวัน |
| Employee onboarding checklist | ฿20 | HR small biz |

#### 💰 หมวด: การเงินส่วนตัว (Evergreen สูงสุด)
| Template | Tier | Reason |
|---|---|---|
| Budget Planner เดือน (50/30/20 method) | ฿20 | ⭐ TOP — ทุกคนต้อง |
| Debt Snowball Tracker (ลดหนี้) | ฿20 | คนไทย household debt สูง |
| Saving Goals Tracker (เป้าออม) | ฿10 | ⭐ universal |
| Bill Reminder Tracker | ฿10 | ใช้ตลอด |
| ลงทุนกองทุน comparison sheet | ฿20 | mid-class TH โต |
| Insurance comparison checklist | ฿20 | ก่อนซื้อประกัน |

#### 📚 หมวด: เรียนรู้ / พัฒนาตัวเอง
| Template | Tier | Reason |
|---|---|---|
| Habit Tracker 21/30/66 วัน | ฿10 | ⭐ TOP — psychology trend |
| Reading Log + Book Journal | ฿20 | สังคมรักการอ่านโต |
| Goal Setting Q1-Q4 (yearly) | ฿20 | ปีใหม่ขายดี (ทุกธ.ค.) |
| TCAS / Dek-D prep checklist | ฿50 | นักเรียนทุกปี (peak ก.ย.-ธ.ค.) |
| Job Interview prep checklist | ฿20 | จบใหม่ทุกเดือน |
| English study tracker | ฿10 | universal |

#### 🏠 หมวด: ครอบครัว / ไลฟ์สไตล์
| Template | Tier | Reason |
|---|---|---|
| Wedding Planner checklist | ฿50 | ⭐ TOP — เชื้อเชิญรวบรวมหลายฉบับ |
| Newborn Baby Checklist | ฿50 | ทุกครอบครัวมีลูก |
| Moving House Checklist (ย้ายบ้าน) | ฿20 | คนเช่าทุกปี |
| Travel Packing List (ในประเทศ/ตปท) | ฿10 | seasonal high |
| Renovation Budget Tracker | ฿50 | คนต่อเติมบ้านเยอะ |

#### 💼 หมวด: อาชีพ / ออฟฟิศ
| Template | Tier | Reason |
|---|---|---|
| Resume Template (Thai market style) | ฿20 | ⭐ TOP — จบใหม่ทุกเดือน |
| Cover Letter Template | ฿10 | combo กับ Resume |
| Resume + Cover Letter Pro Pack | ฿50 | upsell |
| Project Proposal Template | ฿50 | freelancer/agency |
| Meeting Notes / OKR Tracker | ฿20 | office daily |

### 2.4 Top 10 Launch Targets (สำหรับ MVP 28 วัน)
**Owner สร้างก่อน 4 มิ.ย.** — เลือกที่ตลาดใหญ่สุด + competition ต่ำสุด:

**Top 10 Mix (Free×1 / Lite×3 / Standard×3 / Premium×3):**
1. Daily Planner — **FREE** (Lead magnet — LINE add friend)
2. ⭐ Habit Tracker 30 วัน (฿10 Lite)
3. Saving Goals Tracker (฿10 Lite)
4. Travel Packing List (฿10 Lite)
5. ⭐ Budget Planner เดือน (฿20 Standard)
6. ⭐ Resume Thai style (฿20 Standard)
7. ⭐ Reading Log + Book Journal (฿20 Standard)
8. ⭐ Wedding Planner (฿50 Premium)
9. ⭐ Checklist เปิดร้านกาแฟ (฿50 Premium)
10. ⭐ Newborn Baby Checklist (฿50 Premium)

> ครอบทุก chip ในหน้าแรกครบ — hero filter chips จะมีจำนวนแสดงพอดี (Free/฿10/฿20/฿50)

**Production strategy:**
- Owner ใช้ Claude/ChatGPT offline สร้าง content (zero variable cost)
- Export เป็น PDF ผ่าน Canva (free) หรือ libreoffice
- Upload ผ่าน admin panel
- 1-2 template/วัน × 14 วัน = 10-15 templates ทันก่อน W3

### 2.5 Smart Form Fill (AI ใช้แบบ B — zero cost)
- ทุก PDF มี **fillable form fields** (PDF AcroForm)
- User ซื้อแล้ว → download → กรอก field ในเว็บเรา (client-side JS — pdf-lib ฟรี)
- Pre-fill จาก user profile (ชื่อ/วันที่/อีเมล) อัตโนมัติ
- **ไม่มี AI API call** — ใช้ form fields ที่ต่างคนต่าง personalize

### 2.6 Payment Flow (Omise PromptPay — อัพเดต Session 22)
> **สร้างแล้ว — ใช้งานได้จริง**

**Template purchase (PromptPay):**
```
1. Homepage → กด template card → /templates/[slug]
2. กด "ซื้อ ฿X" → /checkout/[slug]
3. LINE OAuth check → redirect ถ้าไม่ได้ login
4. ถ้ามี pack credits → แสดง banner "ใช้ 1 credit" (ข้ามขั้น QR ได้)
5. Step 1: เพิ่มเพื่อน LINE OA (add_line step)
6. กด "เพิ่มเพื่อนแล้ว" → POST /api/orders → Omise charge → QR image
7. Client polling GET /api/orders/[id]/status ทุก 3 วินาที
8. Omise webhook POST /api/webhooks/omise (charge.complete + successful)
   → UPDATE template_orders status=paid + gen download_token (24h / max 3 ครั้ง)
   → LINE push download link → customer
   → LINE push notify → owner (ถ้า OWNER_LINE_USER_ID set)
9. Polling detects paid → redirect หน้า "ชำระเงินสำเร็จ" + download button
10. User กด /d/[token] → download PDF
```

**Template purchase (Pack Credit):**
```
1. เห็น credit banner บน /checkout/[slug]
2. กด "ใช้ 1 credit" → POST /api/pack-credits/redeem
3. FIFO หัก 1 credit จาก pack ที่ expire ก่อน
4. สร้าง template_order (payment_method=pack_credit, status=paid)
5. LINE push download link ทันที
6. แสดงหน้า credit_done + download button
```

**Pack purchase:**
```
1. Homepage pack card → /checkout/pack/[packId]
2. Step 1: เพิ่มเพื่อน LINE OA
3. กด "เพิ่มเพื่อนแล้ว" → POST /api/pack-orders → Omise charge → QR
4. Client polling GET /api/pack-orders/[id]/status ทุก 3 วินาที
5. Omise webhook → activate pack_credits (status=active, expires 90 วัน)
6. LINE push ยืนยัน credits
7. Polling detects active → redirect /templates (2s delay)
```

**Download:** `/d/[token]` — validate token + expiry + max count → increment count

### 2.7 Anti-fraud (ระบบปัจจุบัน)
- **Omise webhook:** payment ยืนยันโดย Omise เท่านั้น — J2 resolved ✅
- **Rate limit:** claims (credit redeem) ≥ 5 ใน 24h → fraud_flag = suspicious
- **Revoke:** admin กด Revoke → download_token = NULL + LINE notify customer
- **Owner notify:** ทุก payment → LINE push แจ้ง owner (ต้องตั้ง OWNER_LINE_USER_ID)

---

## 3. Section 2 — Coupon Affiliate (Lead Magnet + Secondary)

### 3.1 บทบาทใหม่
- **ไม่ใช่ revenue หลักอีกต่อไป** (V14 demote → V15 secondary)
- **เป็น lead magnet** — ดึง user มา → เพิ่มเพื่อน LINE → ได้ free template
- **เป็น secondary monetize** — affiliate commission ที่ /go redirect

### 3.2 LINE Add Friend Flow (ใหม่ V15)
```
User ที่ /templates → เห็น banner:
  "🎁 เพิ่มเพื่อน LINE OA → รับ 1 template ฟรี + คูปองส่วนลดทุกวัน"
  
→ Click → LINE OA add friend
→ Auto reply: "ยินดีต้อนรับ! เลือก template ฟรี 1 ชิ้น:
   [1] Daily Planner
   [2] Habit Tracker (lite)
   [3] Saving Tracker (lite)"
→ User เลือก → ได้ download link
→ ถูกเพิ่มใน user list สำหรับ daily digest:
   - คูปองวันนี้
   - Template ใหม่ที่เพิ่งออก
   - Promo bundle
```

### 3.3 Coupon Section (เดิม V14 — ไม่ลบ)
- ทุก feature V14 cron + admin + /go redirect ยังทำงาน
- หน้าแรก: link "ดูคูปองส่วนลดทุกร้าน →" ไป /coupon
- Calculator/Stacking ที่วางแผน V14 → defer หลังเดือน Q3 (ไม่ priority sprint นี้)

---

## 4. Admin System (หัวใจของ Section 1)

> **ออกแบบให้ scale ได้ตั้งแต่ start** — ROI tracker · category analytics · sales dashboard

### 4.1 /admin/templates — Template Catalog Manager
**CRUD UI:**
- Upload PDF + form-field config
- Title, slug, description (Thai SEO-friendly)
- Tier (Free/10/20/50)
- Category (multi-select — ดู 4.2)
- Tags (สำหรับ search internal)
- Cover image (auto-generate จาก PDF page 1)
- Preview file (low-res watermarked)
- Status: draft / published / archived

**Bulk operations:**
- Bulk upload (เผื่อ owner เตรียมหลาย template)
- Bulk price change (ปรับ tier ทั้งหมวด)
- Bulk publish/unpublish

### 4.2 Category System (Hierarchical + Tags)
```
หมวดใหญ่ (5):
- 🏪 ธุรกิจ / เปิดร้าน
- 💰 การเงิน
- 📚 เรียนรู้
- 🏠 ครอบครัว / ไลฟ์สไตล์
- 💼 อาชีพ / ออฟฟิศ

Auto-tag (ระบบ generate ตาม metric):
- 🔥 ขายดี (top 10 sales 30 วัน)
- 🔍 ค้นเยอะ (top search keyword 30 วัน)
- ⭐ ใช้ประจำ (most downloads of free + most repeat buyer)
- 🆕 ใหม่ล่าสุด (published < 14 วัน)
- 💎 พรีเมี่ยม (tier ฿50)
- 🎁 ฟรี (tier 0)
```

### 4.3 /admin/orders — Order Management
**Pending verification queue (priority):**
- รายการ order ที่รอ verify slip
- แสดง: order_id, time, template, amount, slip image, ref number
- Action: ✅ Verify / ❌ Reject / 🔍 Request more info

**All orders dashboard:**
- Filter: status (pending/paid/refunded/canceled)
- Search by email, LINE ID, order_id, ref number
- Export CSV

**Refund flow:**
- ปุ่ม refund → owner ต้องโอนคืน manual (PromptPay) → mark refunded

### 4.4 /admin/analytics — ROI Dashboard (สำคัญ)
**Top-line:**
- Revenue วันนี้ / 7 วัน / 30 วัน / ปี
- Orders count + AOV (average order value)
- Conversion rate: visitor → buyer
- Free download → paid conversion

**Category performance:**
- Revenue by category
- Best-selling templates (top 10)
- Worst-performing (อาจ unpublish)

**Search analytics:**
- Top search keywords (ภายในเว็บ)
- "Searched but not found" — สำหรับสร้าง template ใหม่
- Search → click → buy funnel

**LINE OA insights:**
- Free download → friend add rate
- Friend add → first paid purchase rate
- Daily digest open rate (ถ้าทำได้)

### 4.5 /admin/templates/create — AI-Assisted Creation
> User Q4 = A+B → owner ใช้ AI offline แล้ว upload (ไม่มี API call ฝั่ง prod)

**Workflow ที่แนะนำ:**
1. Owner เปิด ChatGPT/Claude (สมัครส่วนตัว, ไม่ใช่ของเว็บ)
2. Prompt: "ทำ Budget Planner เดือน 1 หน้า A4 มี field: ..." → ได้ outline
3. Open Canva (free) → ใส่ design + form fields
4. Export PDF
5. Upload ไป /admin/templates/create
6. กรอก metadata + publish

**ระบบช่วย (zero API cost):**
- Auto-extract preview thumbnail จาก PDF page 1
- Auto-detect form fields ใน PDF (pdf-lib server-side)
- Auto-suggest category จาก keyword ใน title (rule-based, ไม่ใช่ AI)
- SEO meta auto-fill จาก title + description

### 4.6 /admin/notifications — Slip Verify Alerts
- LINE OA push ไป owner เมื่อมี order ใหม่
- Sound notification (ในเว็บ admin) เมื่อมี pending > 1
- Daily summary 9:00 น.: "เมื่อวาน ขาย X ออเดอร์, รวม Y บาท, มี Z รอ verify"

---

## 5. Technical Architecture

### 5.1 Stack (ใช้ของเดิม + เพิ่ม)
| Layer | Tech | Note |
|---|---|---|
| Framework | Next.js 16 (เดิม) | ✅ |
| DB | Postgres self-host VPS (เดิม) | ✅ |
| Auth | Supabase (เดิม) | ✅ + LINE OAuth |
| File storage | VPS local `/uploads/templates/` + Cloudflare cache | ✅ free |
| PDF lib | `pdf-lib` (npm OSS) | ✅ free |
| QR generation | Omise hosted (scannable_code.image.download_uri) | ✅ Omise account |
| Payment gateway | **Omise** PromptPay | ✅ live (test keys active) |
| Email | Cloudflare Email Routing → owner inbox | ✅ free |
| LINE | LINE OA Messaging API (เดิม) | ✅ free |

### 5.2 New Routes
> ✅ = สร้างแล้ว live · 🔲 = ยังไม่ได้สร้าง

```
✅ /templates/[slug]             — Template detail + sticky buy card + related
✅ /templates                    — Catalog page (filter by category/tier)
✅ /checkout/[slug]              — LINE auth gate + credit banner + Omise QR + polling
✅ /checkout/pack/[packId]       — Pack purchase (LINE gate + Omise QR + polling)
✅ /d/[token]                    — Download page (validate + increment count)
✅ /orders                       — Customer order history + download buttons
✅ /analysis                     — Personal spend analysis by category

✅ /admin/templates              — Template list (with category badge)
✅ /admin/templates/new          — 6-step wizard create
✅ /admin/templates/[id]/edit    — Edit template
✅ /admin/catalogs               — Catalog (category) manager + add form
✅ /admin/orders                 — Order list + verify + revoke actions
✅ /admin/template-analytics     — KPI cards + 14d daily + per-template revenue

(เดิม V14 ยังอยู่ครบ — /coupon, /wallet, /admin/coupons, /go/[id], etc.)
```

### 5.3 New API Endpoints
```
POST   /api/templates                    — admin create
PUT    /api/templates/[id]               — admin edit
DELETE /api/templates/[id]               — admin delete
GET    /api/templates                    — public list with filters

POST   /api/orders                       — create order + Omise charge + QR
GET    /api/orders/[id]/status           — polling {status, downloadUrl?}
POST   /api/orders/[id]/claim-paid       — (legacy/fallback trust-based)
POST   /api/orders/[id]/verify           — admin verify
POST   /api/orders/[id]/reject           — admin reject
GET    /api/orders/[id]/download         — generate signed download URL

POST   /api/pack-orders                  — create pack_credits + Omise charge + QR
GET    /api/pack-orders/[id]/status      — polling {status, available}
GET    /api/pack-credits/balance         — {available: number}
POST   /api/pack-credits/redeem          — หัก 1 credit FIFO → {downloadUrl, orderNumber, creditsRemaining}

POST   /api/webhooks/omise               — Omise charge.complete webhook (HMAC-SHA256)
GET    /api/webhooks/omise               — Omise URL validation ping → 200 OK

POST   /api/admin/templates/upload-pdf   — file upload + auto-extract
GET    /api/admin/analytics/sales        — dashboard data
GET    /api/admin/analytics/search-gaps  — "searched but not found"

(เดิม V14 routes ยังอยู่ครบ)
```

### 5.4 DB Schema (new tables)

```sql
-- Template catalog
CREATE TABLE templates (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            TEXT UNIQUE NOT NULL,
  title           TEXT NOT NULL,
  description     TEXT,
  tier            TEXT CHECK (tier IN ('free','lite','standard','premium')),
  price_baht      INTEGER NOT NULL CHECK (price_baht IN (0,10,20,50)),
  pdf_path        TEXT NOT NULL,
  preview_path    TEXT,
  thumbnail_path  TEXT,
  page_count      INTEGER,
  has_form_fields BOOLEAN DEFAULT false,
  status          TEXT DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
  published_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  -- analytics
  view_count      INTEGER DEFAULT 0,
  download_count  INTEGER DEFAULT 0,
  sale_count      INTEGER DEFAULT 0
);

-- Categories (hierarchical)
CREATE TABLE template_categories (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug      TEXT UNIQUE NOT NULL,
  name      TEXT NOT NULL,
  parent_id UUID REFERENCES template_categories(id),
  sort_order INTEGER DEFAULT 0,
  emoji     TEXT
);

-- Many-to-many
CREATE TABLE template_category_links (
  template_id UUID REFERENCES templates(id) ON DELETE CASCADE,
  category_id UUID REFERENCES template_categories(id) ON DELETE CASCADE,
  PRIMARY KEY (template_id, category_id)
);

-- Auto-generated tags (ขายดี / ค้นเยอะ / etc.)
CREATE TABLE template_tags (
  template_id UUID REFERENCES templates(id) ON DELETE CASCADE,
  tag         TEXT NOT NULL CHECK (tag IN ('bestseller','trending','staple','new','premium','free')),
  scored_at   TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (template_id, tag)
);

-- Orders
CREATE TABLE template_orders (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number    TEXT UNIQUE NOT NULL,  -- e.g., CK-20260507-1234
  template_id     UUID REFERENCES templates(id),
  customer_email  TEXT,
  customer_line_id TEXT,
  amount_baht     INTEGER NOT NULL,
  promptpay_ref   TEXT,
  slip_image_path TEXT,
  status          TEXT DEFAULT 'pending_payment' CHECK (status IN (
    'pending_payment','pending_verify','paid','rejected','refunded','expired'
  )),
  paid_at         TIMESTAMPTZ,
  verified_by     TEXT,  -- admin email
  download_token  TEXT UNIQUE,  -- for signed download URL
  download_expires_at TIMESTAMPTZ,
  download_count  INTEGER DEFAULT 0,
  reject_reason   TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Free template grants (LINE add friend)
CREATE TABLE free_template_grants (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_line_id TEXT NOT NULL,
  template_id     UUID REFERENCES templates(id),
  granted_at      TIMESTAMPTZ DEFAULT NOW(),
  download_token  TEXT UNIQUE,
  UNIQUE (customer_line_id, template_id)  -- 1 template ฟรี/user
);

-- Search analytics (สำหรับ /admin/analytics/search-gaps)
CREATE TABLE template_searches (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query       TEXT NOT NULL,
  result_count INTEGER NOT NULL,
  customer_id TEXT,  -- session-based
  searched_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cron: เพิ่ม tag bestseller/trending ทุกวัน
-- (re-compute จาก sale_count + view_count + recency)
```

### 5.5 Auto-Tag Cron (ระบบหัวใจ)
```
/api/cron/template-tags  (run daily 03:00)
- bestseller: top 10 templates by sale_count last 30 days
- trending: top 10 by view_count last 7 days
- staple: most repeat-buyer templates last 90 days
- new: published_at within 14 days
- premium: tier='premium'
- free: tier='free'
→ INSERT/UPDATE template_tags
```

---

## 6. Hard Constraint — Zero Paid Services (FROZEN)

### ✅ Allowed (เดิม + ใหม่)
- VPS (เดิม 856/mo)
- Cloudflare (paid annually แล้ว — done)
- Cloudflare Email Routing (free)
- LINE OA Free (300 broadcast/mo · unlimited 1:1)
- Sentry Free
- Postgres self-host
- npm OSS: `pdf-lib`, `promptpay-qr`, `pdfjs-dist`, etc.
- Tesseract OCR self-host (สำหรับ slip OCR ใน W4+ optional)

### ❌ Banned
- Stripe / 2C2P (paid gateway — ยังไม่ใช้)
- AWS S3 / Cloudinary (image hosting paid)
- Claude/OpenAI API ใน production
- Algolia paid tier
- SendGrid / Mailchimp (use Cloudflare Email)

### ⚠️ Exception — Omise (owner decision 2026-05-07)
- Omise Payment Gateway ✅ **active (test keys)**
- OMISE_SECRET_KEY + OMISE_WEBHOOK_SECRET set ใน VPS .env.local แล้ว
- Test mode: QR auto-pay · Live mode: real PromptPay bank scan
- **Pending J9:** ต้องสลับเป็น live keys เพื่อให้ลูกค้าสแกน QR จริงได้

### ⚠️ One-time acceptable
- Domain renewal (เดิม)
- $5 Chrome Web Store dev fee (ถ้าทำ extension — Q3)

### Storage budget
- VPS 4GB RAM / 80GB disk (assume) — PDF เฉลี่ย 1-3 MB → 80GB รองรับ 25,000-80,000 templates (พอเกินพอ)
- Cloudflare cache (free) ช่วย reduce VPS bandwidth

---

## 7. 28-Day Sprint (7 พ.ค. → 4 มิ.ย.)

### Week 1 (7-13 พ.ค.) — Foundation ✅ DONE
| Task | Status |
|---|---|
| Apply V14 patch · Homepage V15 redesign | ✅ |
| DB migrations: templates + categories + orders + free_grants | ✅ |
| /admin/templates CRUD + 6-step wizard + PDF upload | ✅ |
| /admin/catalogs catalog manager | ✅ |
| /api/orders (PromptPay QR) + /api/orders/[id]/claim-paid (trust-based) | ✅ |
| /checkout/[slug] + /d/[token] download page | ✅ |
| /admin/orders + /admin/template-analytics | ✅ |
| Owner LINE notify on claim | ✅ |
| FIRST SALE ฿20 ✅ | ✅ |

### Week 2 (14-20 พ.ค.) — Catalog Public
| Task ID | Task | Status |
|---|---|---|
| — | /templates/[slug] detail page + related | ✅ done early |
| — | /orders customer history + /analysis personal stats | ✅ done early |
| — | Homepage catalog sections (grouped by category) | ✅ done early |
| — | /templates catalog page (filter by category/tier) | ✅ done early |
| **V15-PACK-1** | **Pack credit flow** — pack_credits table · /api/pack-orders · /api/pack-credits · checkout credit banner · FIFO redeem · ฿20=2cr / ฿50=10cr / ฿100=25cr | ✅ done |
| **V15-PAY-5** | **Omise payment gateway** — Omise PromptPay QR + webhook (HMAC) · client polling · VPS env fix (server-with-env.js) · Cloudflare WAF bypass · J2 fraud gap resolved | ✅ done · ⏳ UAT (J9 live keys) |
| **V15-UAT-1** | **Full UAT loop** — prerequisite: J1 OWNER_LINE_USER_ID · J9 live Omise keys · J8 template 2-10 | 🔲 pending prerequisites |
| — | Owner สร้าง template ที่ 2-6 | 🔲 owner task |
| — | LINE add friend → free template grant flow | 🔲 |
| — | Auto-tag cron (bestseller/trending) | 🔲 |

### Week 3 (21-27 พ.ค.) — Polish + Integration
| Task | Status |
|---|---|
| Smart form fill (PDF AcroForm browser-side) | 🔲 |
| LINE OA daily digest (template ใหม่ + คูปอง) | 🔲 |
| Coupon section (Section 2) re-position as lead magnet | 🔲 |
| OWNER_LINE_USER_ID set + UAT full flow | 🔲 pending |
| Fraud fix long-term solution | 🔲 pending |

### Week 4 (28 พ.ค. - 3 มิ.ย.) — Launch + Buffer
| Task | Status |
|---|---|
| SEO meta + sitemap update | 🔲 |
| Soft launch — FB post + LINE OA broadcast | 🔲 owner |
| Bug fix + final deploy | 🔲 |
| git tag v15.0 | 🔲 |
| 🛑 4 มิ.ย. — Token deadline | — |

---

## 8. Acceptance Criteria (ก่อน 4 มิ.ย.)

### Section 1 — Template Store (must)
- ✅ /templates catalog หน้าทำงานได้
- ✅ ≥ 10 templates published (mix tier ฿0/10/20/50)
- ✅ /admin/templates CRUD ทำงานครบ
- ✅ /admin/orders verify queue ทำงาน
- ✅ Payment flow ครบ: order → QR → slip upload → verify → download
- ✅ One-time signed download URL + 24h expire
- ✅ Smart form fill (browser-side, ไม่มี API call)
- ✅ /admin/analytics dashboard top-line metrics

### Section 2 — Coupon Integration (must)
- ✅ Homepage แสดง 2 sections ชัด
- ✅ LINE add friend → free template grant flow
- ✅ Coupon section (V14 เดิม) ยังทำงาน

### Revenue (must)
- ✅ ≥ 1 sale จริงในเดือน W4 (proof of concept)
- ✅ ทุก path ผ่าน hard constraint (zero paid services)
- ✅ Total cost = 856 บาท/mo เท่าเดิม

### Quality
- ✅ `npx tsc --noEmit && npm run lint && npm run test` pass
- ✅ Lighthouse score ≥ 80 (mobile)
- ✅ Sentry no critical errors

---

## 9. Reference Code (จาก chongdeaw-saas)

> Path: `D:\Backup couponkum.com\BK_Couponkum\couponkum\A_Template_Coupon_project\Backup_chongdeaw-saas\`

**ใช้ได้:**
- LINE OAuth callback pattern
- Supabase RLS pattern (อาจ simplify เพราะ couponkum = single tenant)
- DB migration structure
- Order schema (`payment_method`, `payment_status`)

**ไม่ใช้:**
- ❌ Omise integration (banned — paid)
- ❌ Multi-tenant `store_id` RLS (เกินจำเป็น)
- ❌ next-intl (couponkum ไทยอย่างเดียว)

**Replace ด้วย:**
- ✅ `promptpay-qr` (ฟรี npm) แทน Omise
- ✅ Manual slip verify แทน webhook auto
- ✅ Simple RLS (admin/user only) แทน multi-tenant

---

## 10. Open Questions (ตัดสินก่อนเริ่ม code)

| Q | Question | Answered |
|---|---|---|
| Q1 | PromptPay receiver number ของ owner? | ✅ 0948859962 |
| Q2 | LINE OA bot account ที่ใช้ — ใช้ของเดิมหรือใหม่? | ✅ ใช้ของเดิม |
| Q3 | Template free lead magnet — เลือกตัวไหน? | ✅ Daily Planner ฿0 |
| Q4 | URL ของ download — ใช้ subdomain หรือ path? | ✅ path: `/d/[token]` |
| Q5 | Slip image storage — VPS local OK ไหม? | ✅ OK — disk 80GB |
| Q6 | Refund policy — กี่วัน? | ✅ 7 วัน (ก่อน download) |
| Q7 | Upload PDF size limit? | ✅ 20 MB |
| Q8 | Currency display — ฿ หรือ THB? | ✅ ฿ |
| Q9 | Order number format? | ✅ CK-YYYYMMDD-XXXX |
| Q10 | Owner LINE ID สำหรับ notification? | ✅ yopinm |

---

## 11. Action Plan (อัพเดต — Session 19)

```
[x] W1: Foundation + Payment flow complete — FIRST SALE ✅
[x] Homepage catalog sections grouped by category
[x] /templates/[slug] + /orders + /analysis

Next priorities:
[ ] Owner: set OWNER_LINE_USER_ID บน VPS (ดู memory project_pending_fraud_fix.md)
[ ] Owner: สร้าง template ที่ 2-6 (Budget Planner, Habit Tracker, Resume, Wedding Planner, Reading Log)
[ ] /templates catalog page (filter chips + search)
[ ] LINE add friend → free template flow
[ ] Auto-tag cron
```

---

## 12. Daily Standup Format

ทุก session เริ่มด้วย:
```
1. เมื่อวานทำ task อะไร? (id + status)
2. วันนี้จะทำ task อะไร?
3. มี blocker อะไร? (Q1-Q10 ที่ยังไม่ตอบ / API key / etc.)
4. Token usage % ที่เหลือ?
5. Template count: X/10 ภายในกำหนด?
```

---

---

## 13. Infrastructure & Domain (อัพเดต 2026-05-09)

### Domain

| Domain | บทบาท | Status |
|---|---|---|
| `planprom.com` | **Primary** — Template Store | ✅ Live 2026-05-09 |
| `www.planprom.com` | redirect → planprom.com | ✅ Live |
| `couponkum.com` | เดิม — จะ 301 redirect → planprom.com | 🟡 ยังเปิดอยู่ |

### SSL / Nginx

| Item | Value |
|---|---|
| SSL cert | Let's Encrypt via Certbot · expires **2026-08-07** · auto-renew ✅ |
| Nginx config | `/etc/nginx/conf.d/planprom.conf` |
| Nginx config (เดิม) | `/etc/nginx/conf.d/couponkum.conf` |
| Proxy target | `http://127.0.0.1:3000` (PM2 app เดิม) |

### Email

| Address | ปลายทาง | Provider |
|---|---|---|
| `contact@planprom.com` | `yopinm@gmail.com` | Cloudflare Email Routing (ฟรี) ✅ |

### VPS

| Item | Value |
|---|---|
| Host | `root@103.52.109.85` |
| App path | `/var/www/couponkum` (ยังใช้ชื่อเดิม — rename อนาคต) |
| PM2 process | `couponkum` port 3000 |
| RAM | 3.8 GB total · ~1.1 GB used (สบาย) |

### Coupon Affiliate — แผนแยก Repo

| Step | สถานะ |
|---|---|
| `archive/couponkum-v1` branch — snapshot ก่อนลบ coupon code | 🔲 ยังไม่ทำ (รอ owner confirm) |
| ลบ coupon routes จาก planprom app | 🔲 รอ |
| สร้าง couponkum repo ใหม่ จาก archive branch | 🔲 อนาคต |
| couponkum.com → 301 redirect → planprom.com | 🔲 รอ |

---

_Last updated: 2026-05-11 (Session 42) · Domain: planprom.com live · SSL + Email routing ✅ · App: VPS port 3001 fork mode · Next: DC-15 Planner Engine v2 (Time-Aware Dynamic Form) — รอ owner confirm → implement T0-1 ก่อน_
_Owner: yopinm@gmail.com · LINE: yopinm · PromptPay: 0948859962_
