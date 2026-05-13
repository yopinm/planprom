# Planprom_Manual.md — คู่มือการใช้งาน แพลนพร้อม (planprom.com)

> อัพเดตล่าสุด: 2026-05-13 · Session 58 · ครอบคลุมทุกฟีเจอร์ที่ Live แล้ว
> ภาษา: ไทย · เขียนสำหรับ admin และ owner ของระบบ

---

## สารบัญ

1. [ภาพรวมระบบ](#1-ภาพรวมระบบ)
2. [หน้าแรก (Homepage)](#2-หน้าแรก-homepage)
3. [หน้าเทมเพลต (/templates)](#3-หน้าเทมเพลต-templates)
4. [หน้า Catalog (/catalog/[slug])](#4-หน้า-catalog-catalogslug)
5. [ตะกร้าสินค้า (/cart)](#5-ตะกร้าสินค้า-cart)
6. [ชำระเงิน (/checkout)](#6-ชำระเงิน-checkout)
7. [ดาวน์โหลดไฟล์ (/d/[token])](#7-ดาวน์โหลดไฟล์-dtoken)
8. [เทมเพลตฟรี](#8-เทมเพลตฟรี)
9. [ระบบ Request พิเศษ (J13)](#9-ระบบ-request-พิเศษ-j13)
10. [Admin — Template Manager](#10-admin--template-manager)
11. [Admin — Form Builder](#11-admin--form-builder)
12. [Admin — Engine ระบบต่างๆ](#12-admin--engine-ระบบต่างๆ)
13. [Admin — Promo Codes](#13-admin--promo-codes)
14. [Admin — Orders](#14-admin--orders)
15. [Admin — Reports & Analytics](#15-admin--reports--analytics)
16. [Admin — Catalog Manager](#16-admin--catalog-manager)
17. [ราคาและการคิดเงิน](#17-ราคาและการคิดเงิน)
18. [ระบบโค้ดส่วนลด (Promo Code)](#18-ระบบโค้ดส่วนลด-promo-code)

---

## 1. ภาพรวมระบบ

**แพลนพร้อม** คือร้านขาย Template PDF สำหรับวางแผนการเงิน ธุรกิจ ครอบครัว และอาชีพ

| รายการ | รายละเอียด |
|---|---|
| URL | https://planprom.com |
| Server | VPS AlmaLinux 9.7 · PM2 + Nginx + Cloudflare Full |
| Stack | Next.js 16 (App Router) · TypeScript · PostgreSQL · Omise PromptPay |
| ราคา | ฿20 ชิ้นแรก → ฿10 ชิ้น 2-5 → ฿7 ชิ้น 6+ |
| Payment | PromptPay QR ผ่าน Omise · ไม่ต้องสมัครสมาชิก |

### Flow หลักของลูกค้า

```
หน้าแรก → เลือก Template → หยิบใส่ตะกร้า → ดูตะกร้า → ชำระเงิน QR → Download ทันที
```

---

## 2. หน้าแรก (Homepage)

URL: `https://planprom.com/`

### 2.1 Hero Section

- **H1:** "ยิ่งวางแผนเยอะ ยิ่งจ่ายน้อย"
- **Tier Pricing Card:** แสดงราคา 3 tier แบบ visual
  - ชิ้นแรก ฿20
  - 2-5 ชิ้น ฿10/ชิ้น (ลด 50%)
  - 6 ชิ้นขึ้นไป ฿7/ชิ้น
- **CTA หลัก:** "เริ่มต้นที่ ฿20 → ดูเทมเพลตทั้งหมด"

### 2.2 Section Template Store

- **Featured Template Card** — การ์ด "✨ แนะนำสัปดาห์นี้" พร้อม:
  - ชื่อ Template + หมวดหมู่
  - ปุ่ม "ดูพรีวิวสินค้า" (เปิด Modal รูปตัวอย่าง)
  - ปุ่ม "หยิบใส่ตะกร้า" หรือ "รับฟรี" (แล้วแต่ tier)
  - กำหนดใน Admin: `/admin/templates/[id]/edit` → ⭐ Set Featured

- **Promo Code Banner** — การ์ดขวามือแสดงโค้ดส่วนลด active ที่ไม่ใช่ Unlock Code
  - มีปุ่ม Copy + countdown หมดอายุ
  - ถ้าไม่มีโค้ด: แสดง placeholder

- **Category chips** — ทางลัดไปหมวดหมู่ต่างๆ
- **LINE Request CTA** — การ์ด amber "หาฟอร์มไม่เจอ? ➕ LINE → 💬 บอกฟอร์ม → ✅ ใน 24ชม. · 50฿"

### 2.3 Floating LINE Button

- ปุ่มเขียว LINE มุมล่างขวา
- Speech bubble "หาฟอร์มไม่เจอ? 📌 / Request ด่วน 50฿ ✅" กระพริบทุก 7 วินาที (CSS keyframe)

---

## 3. หน้าเทมเพลต (/templates)

URL: `https://planprom.com/templates`

### 3.1 Filter Bar

| Filter | ตัวเลือก |
|---|---|
| หมวดหมู่ | ทุกหมวด + แต่ละ category |
| ราคา | ทุกราคา / ฟรี / ฿20 |
| ประเภท | ทุกประเภท / แพลนเนอร์ / เช็คลิสต์ / ฟอร์ม / รายงาน |

### 3.2 Search Box

- พิมพ์คำค้น → ค้นหาจาก title + description (ILIKE)
- แสดงผล "ผลการค้นหา X รายการ" + ปุ่มล้างคำค้น

### 3.3 Template List

แต่ละ row แสดง:
- Thumbnail (ถ้ามี)
- ชื่อ Template + ประเภทเอกสาร
- ราคา
- ปุ่ม **"หยิบใส่ตะกร้า"** — เปลี่ยนเป็น "✓ ในตะกร้าแล้ว" เมื่อเพิ่มแล้ว
- ปุ่ม **"ดูพรีวิวสินค้า"** — เปิด Modal แสดงรูปตัวอย่าง
- สำหรับ Template Request Only: แสดง input "UNLOCK CODE" แทนปุ่มซื้อ

### 3.4 Pricing Callout

แสดง tier pricing สรุป 3 ระดับ พร้อมคำอธิบาย

---

## 4. หน้า Catalog (/catalog/[slug])

URL: `https://planprom.com/catalog/[slug]` เช่น `/catalog/finance`

- แสดง template ทั้งหมดในหมวดนั้น
- Header card สีเขียว + จำนวน template
- ปุ่ม Preview Modal สำหรับแต่ละ template
- ปุ่มซื้อ/รับฟรีตาม tier

---

## 5. ตะกร้าสินค้า (/cart)

URL: `https://planprom.com/cart`

### 5.1 รายการสินค้า

| ฟิลด์ | รายละเอียด |
|---|---|
| Thumbnail | รูปย่อ template |
| ชื่อ | title ของ template |
| Label | "เทมเพลตฟรี" / "เทมเพลตมาตรฐาน" / "🔒 Request พิเศษ" |
| ราคา | volume tier หรือ ฿50 สำหรับ Request |
| ลบ | กด × เพื่อลบออก |

### 5.2 Tier Progress Banner

แสดงเมื่อไม่มี Request item:
- **1 ชิ้น:** "เพิ่มอีก 1 ชิ้น ลดเหลือ ฿10/ชิ้น"
- **2-5 ชิ้น:** นับถอยหลังสู่ tier ถัดไป
- **6+ ชิ้น:** "คุ้มสุด! ราคา ฿7/ชิ้น สำหรับทุกชิ้นถัดไป"
- ซ่อนอัตโนมัติเมื่อมี Request item ในตะกร้า

### 5.3 ยอดรวม

- ราคารวม (ตาม tier) หรือ ฿50 ต่อ Request item
- "ประหยัดกว่าซื้อแยก ฿XX" (เมื่อซื้อหลายชิ้น)
- ปุ่ม **"ดำเนินการชำระเงิน ฿XX"** → ไป /checkout

### 5.4 Cookie

ตะกร้าใช้ cookie `_cart_sid` (httpOnly, 7 วัน) ไม่ต้อง login

---

## 6. ชำระเงิน (/checkout)

URL: `https://planprom.com/checkout`

### 6.1 ขั้นตอน summary

1. เปิดหน้า → โหลด cart จาก `/api/cart`
2. กรอก Promo Code (ถ้ามี) → validate
3. กด **"สร้าง QR PromptPay ฿XX"**
4. ระบบสร้าง Omise charge → QR โผล่
5. สแกน QR ด้วยแอปธนาคาร
6. ระบบ polling `/api/checkout/[uid]/status` ทุก 3 วินาที
7. ตรวจพบจ่ายแล้ว → auto-redirect `/order/[uid]`

### 6.2 QR หมดอายุ

- QR มีอายุ 120 วินาที
- ถ้าหมดอายุ: ปุ่ม **"QR หมดอายุ — สร้าง QR ใหม่"** โผล่
- กดสร้าง QR ใหม่ → สร้าง Omise charge ใหม่ → QR ใหม่

### 6.3 สินค้าฟรีทั้งหมด

- ถ้าทุกชิ้นเป็น free tier → ปุ่ม **"รับเทมเพลตฟรี"** (ไม่มี QR)

### 6.4 Promo Code ที่ checkout

- กรอก code → กด "ใช้โค้ด" → validate
- แสดงส่วนลด -฿XX
- ปุ่ม Remove เพื่อยกเลิก code

---

## 7. ดาวน์โหลดไฟล์ (/d/[token])

URL: `https://planprom.com/d/[token]`

- แสดงรายการ template ที่ซื้อ
- ปุ่ม **"ดาวน์โหลด"** ต่อไฟล์ → stream PDF ตรงจาก server
- จำกัด 3 ครั้ง/ไฟล์ · ลิงก์มีอายุ 24 ชั่วโมง
- ถ้าหลายไฟล์: ปุ่ม **"ดาวน์โหลดทุกไฟล์"** (download ทีละไฟล์ delay 800ms)

### Order Page (/order/[uid])

- บุ๊กมาร์กไว้เป็น receipt
- แสดงรายการ + download links
- เก็บ order_uid ไว้อ้างอิง

---

## 8. เทมเพลตฟรี

Template tier = `free` ใช้ flow พิเศษ:

1. ลูกค้ากด **"รับฟรี"** บน template card
2. ระบบสร้าง order ทันที (amount=0, status='paid', payment_method='free')
3. สร้าง download token → redirect `/d/[token]`
4. ดาวน์โหลด PDF ได้เลย (ไม่ผ่าน QR)

---

## 9. ระบบ Request พิเศษ (J13)

> ฟีเจอร์สำหรับลูกค้าที่ต้องการฟอร์มแบบ Custom (ราคา ฿50)

### 9.1 Flow สำหรับลูกค้า

```
1. ลูกค้าแอด LINE OA ของแพลนพร้อม
2. แจ้งชื่อฟอร์มที่ต้องการผ่าน LINE chat
3. รอ admin จัดทำ (ภายใน 24 ชั่วโมง)
4. Admin ส่ง UNLOCK CODE ให้ทาง LINE
5. ลูกค้าเปิดหน้า /templates หรือ /catalog
6. เห็น template ที่ "ล็อก" อยู่ → กรอก Unlock Code
7. หยิบใส่ตะกร้า → ชำระเงิน ฿50 ผ่าน QR ปกติ
8. ดาวน์โหลด PDF
```

### 9.2 ลักษณะ Template Request Only

- มองเห็นได้ใน catalog ปกติ
- แทนที่ปุ่ม "หยิบใส่ตะกร้า" ด้วย input **"UNLOCK CODE"** + ปุ่มกุญแจ
- ถ้ากรอก code ถูก: หยิบเข้าตะกร้าได้
- ถ้ากรอก code ผิด/หมดอายุ/ใช้แล้ว: แสดง error

### 9.3 ราคา Request

- **฿50 ต่อชิ้น** (fixed, ไม่ขึ้นกับ volume tier)
- = ฿20 template + ฿30 ค่าจัดทำ custom
- ในตะกร้าแสดง label "🔒 Request พิเศษ" และราคา ฿50
- ไม่มี upsell banner เมื่อมี request item

---

## 10. Admin — Template Manager

URL: `/admin/templates`

### 10.1 รายการ Template

แสดงทุก template พร้อม:
- ชื่อ · Slug · Tier · Status (draft/published/archived)
- Engine type (ถ้ามี)
- Featured badge (⭐)
- ปุ่ม: แก้ไข · Publish/Unpublish · ซ่อน · ลบ

### 10.2 สร้าง Template ใหม่ (/admin/templates/new)

Wizard 3 mode:

**Mode 1 — Upload PDF โดยตรง:**
- อัพโหลด .pdf ไป `/uploads/templates/`
- กรอก metadata (title, slug, tier, description)
- เลือก category + tags

**Mode 2 — Engine: Checklist:**
- กรอก 5 Section ใน Checklist Engine Form
- กด Generate PDF Preview
- Approve → publish

**Mode 3 — Engine: Planner (Pipeline v4):**
- กรอก 5 แกน (Goal/Time/Weekly/Daily/Review)
- เลือก Planning Horizon (yearly/monthly/project)
- Generate PDF → Approve → publish

**Mode 4 — Engine: Form Builder:**
- กด "Form Builder" → ไปหน้า `/admin/form-builder`
- สร้าง form → กลับมา approve

### 10.3 แก้ไข Template (/admin/templates/[id]/edit)

ฟิลด์ที่แก้ได้:
- ชื่อ Template, คำอธิบาย
- Tier (free/standard), ประเภทเอกสาร
- PDF Path, Thumbnail Path, Preview Path
- จำนวนหน้า, มี Form Fields
- **🔒 Request Only** — checkbox เปิดระบบ unlock code
  - เมื่อเปิด: แสดงช่อง "ราคา Request (฿)" — ตั้งเป็น 50
- ⭐ Featured Weekly — toggle (clear เก่า set ใหม่)
- Engine Content — ลิงก์แก้ไข + ดูประวัติ (ถ้ามี engine)

### 10.4 Request Only — สร้าง Unlock Code

เมื่อ template มี `is_request_only=true` และ status=`published`:
- ส่วน "🔑 Unlock Code — J13" โผล่ที่หน้า edit
- แสดง code ที่ active อยู่ (ถ้ามี) + วันหมดอายุ
- ปุ่ม **"คัดลอก"** — copy code ไป clipboard
- ปุ่ม **"🔄 สร้าง code ใหม่"** — deactivate code เดิม → สร้างใหม่ (REQ-XXXXXX)
- ส่ง code ให้ลูกค้าทาง LINE เอง (ระบบไม่ส่งให้อัตโนมัติ)

### 10.5 Archive / Force Delete

- **ซ่อน (Archive):** template ไม่โผล่หน้าร้าน แต่ข้อมูลยังอยู่
- **ลบถาวร:** ลบได้เฉพาะ template ที่ไม่มี order ใดๆ
- **Force ลบ:** ลบพร้อม cascade order_items (เฉพาะ pre-launch)

---

## 11. Admin — Form Builder

URL: `/admin/form-builder` หรือ `/admin/form-builder/[templateId]`

### 11.1 ภาพรวม

Drag-and-drop form builder สำหรับสร้างฟอร์ม PDF 2 หน้า:
- หน้า 1: ตัวอย่างกรอกแล้ว (sample data)
- หน้า 2: ฟอร์มเปล่าให้ลูกค้ากรอก

### 11.2 Field Types (15 ประเภท)

| ประเภท | ใช้สำหรับ |
|---|---|
| text | ข้อความบรรทัดเดียว |
| multiline | ข้อความหลายบรรทัด |
| date | วันที่ |
| date_range | ช่วงวันที่ |
| checkbox | ช่องกาเครื่องหมาย |
| radio | เลือกหนึ่งอย่าง |
| dropdown | เมนู dropdown |
| signature | ลายเซ็น |
| logo | รูปโลโก้ |
| section_header | หัวข้อส่วน |
| divider | เส้นคั่น |
| table | ตาราง |
| page_break | ขึ้นหน้าใหม่ |
| running_number | เลขลำดับ |
| email | อีเมล |

### 11.3 ขั้นตอนสร้างฟอร์ม

1. ลากปุ่ม field ประเภทต่างๆ จาก Left Panel ลงใน Canvas
2. คลิก field เพื่อตั้งค่า label / required / options
3. กด **"สร้างตัวอย่าง"** → ระบบ auto-gen sample data
4. แก้ sample data ได้ inline
5. กด **"Preview PDF"** → ดู 2-page PDF ใน iframe
6. กด **"บันทึก Draft"** หรือ **"Save & Publish"**

### 11.4 ดู Preview ใน Catalog

Admin กดปุ่ม "📸 Generate Preview" (ในหน้า edit) → ระบบถ่าย screenshot ของ form preview → บันทึกเป็น `.jpg` → แสดงใน modal catalog

---

## 12. Admin — Engine ระบบต่างๆ

### 12.1 Checklist Engine

สร้าง checklist PDF แบบ structured:

**5 Section:**
- S1: ข้อมูลเอกสาร (หมวดหมู่ auto-fill)
- S2: วัตถุประสงค์ + บริบท
- S3: รายการตรวจสอบ (items list)
- S4: หมายเหตุ / ข้อควรระวัง
- S5: ผู้รับผิดชอบ / sign-off

**การสร้าง:** Wizard → Engine: Checklist → กรอก 5 Section → Generate PDF → Approve

**Revision:** `/admin/templates/[id]/revise` → แก้ไขเนื้อหา → generate ใหม่ → approve → บันทึก revision

**ดูประวัติ:** `/admin/templates/[id]/revisions` — ตาราง revision ทั้งหมด พร้อม download PDF แต่ละ version

### 12.2 Planner Engine (Pipeline v4)

สร้าง planner PDF แบบ time-cascade:

**5 แกน:**
- S1: เป้าหมาย (goal/why/deadline)
- S2: แผนเวลา (auto จาก horizon: yearly=12 monthly pages, monthly=4 weekly pages, project=phases)
- S3: Weekly tracker (layout: simple/1-3-5 rule/timeblock)
- S4: Daily tracker (layout: todo/timeblock/combined)
- S5: Review cycle + คำถาม review

**Planning Horizon:** yearly / monthly / project — เลือกแล้ว S2 auto-generate

### 12.3 Form Engine

สร้างผ่าน Form Builder (ดูหัวข้อ 11) — engine_type = `'form'`

### 12.4 Engine Revision Flow

1. ไปหน้า `/admin/templates/[id]/edit`
2. กดปุ่ม **"แก้ไขเนื้อหา"** ใน Engine Section
3. แก้ไขเนื้อหาในหน้า Revise
4. กด Generate PDF Preview → ตรวจสอบ
5. กรอก Change Note → กด **"✅ Approve Revision"**
6. ระบบบันทึก revision ใหม่ → อัพเดต PDF ใน templates

---

## 13. Admin — Promo Codes

URL: `/admin/promo-codes`

### 13.1 รายการโค้ด

แสดงทุกโค้ดพร้อม:
- Code · Label · Discount
- Valid dates · used_count/max_uses
- Status badge (ACTIVE / ใช้ครบ / ปิด)
- Public/Secret badge

### 13.2 สร้างโค้ดใหม่

| ฟิลด์ | รายละเอียด |
|---|---|
| Code | กรอกเองหรือกด 🎲 สุ่ม |
| Label | ชื่อแคมเปญ เช่น "5.5 Sale" |
| ประเภทส่วนลด | Fixed (฿) หรือ Percent (%) |
| ส่วนลด | จำนวน |
| ยอดขั้นต่ำ | cart total ขั้นต่ำ (0=ไม่จำกัด) |
| จำกัดครั้ง | ว่าง=ไม่จำกัด |
| วันเริ่ม-หมด | datetime |
| is_secret | ✓ = ซ่อนจาก homepage banner (ใช้ที่ checkout ได้) |
| comeback_text | ข้อความหลังหมดอายุ เช่น "6.6 Flash Sale เร็วๆ นี้" |

### 13.3 Auto-Promo Engine Cards

4 engine cards แนะนำโค้ดอัตโนมัติตามสถานการณ์:
- **Slow Week:** ยอดขายต่ำกว่า 60% average
- **Tier Uplift:** 50%+ ลูกค้าซื้อชิ้นเดียว
- **Cart Recovery:** มี abandoned carts
- **VPS Break-Even:** รายได้ 7 วัน < ฿210

กด Generate → pre-fill form สร้างโค้ดตาม scenario

### 13.4 Unlock Code vs Promo Code

| ประเภท | label | template_id | โผล่หน้าโฮม |
|---|---|---|---|
| Public Promo | ชื่อแคมเปญ | NULL | ✅ (ถ้าไม่ secret) |
| Unlock Code | "Unlock Code — XXXXXXXX" | UUID | ❌ (filtered out) |

---

## 14. Admin — Orders

URL: `/admin/report/sales` (redirect จาก /admin/orders)

### 14.1 Dashboard

- **KPI 6 cards:** revenue · orders · avg/order · discount · platform fee · pending
- **Revenue by Type:** checklist / planner / form / report (4 rows fixed)
- **Promo Performance:** โค้ดที่ใช้ + ส่วนลดรวม
- **Daily breakdown:** 14 วันล่าสุด
- **Per-template table:** revenue + sale count เรียง DESC
- **Order list:** รายการ order พร้อม Revoke/Cancel

### 14.2 Actions

- **Revoke:** ยกเลิก download token (ลูกค้าโหลดต่อไม่ได้)
- **Cancel:** ยกเลิก order + refund (manual)

### 14.3 Date Range Filter

Today / 7d / 30d / Custom — query ข้อมูลจริงทุก filter

---

## 15. Admin — Reports & Analytics

### 15.1 Market Intelligence (/admin/template-analytics)

Dashboard วิเคราะห์ตลาด:
- **KPI:** revenue · orders · avg · downloads · unique buyers
- **Revenue by Engine Type:** ยอดขายแต่ละประเภท
- **Market Demand:** Google Suggest TH 8 keywords × 15 alphabet → ความต้องการตลาด
- **Market Gap Matrix:** demand vs มี template หรือยัง vs มี orders
- **Coverage Card:** ครอบคลุมแค่ไหน (%) ต่อ engine type
- **Priority Score:** สิ่งที่ควรสร้างก่อน (demand × uncoverage)
- **Bestseller / Zero-sale:** template ขายดีที่สุด vs ขายไม่ออก

### 15.2 Log Pages

| Route | เนื้อหา |
|---|---|
| `/admin/report/log/pm2` | PM2 stdout + stderr tail |
| `/admin/report/log/nginx-access` | Access log · top paths · 4xx/5xx |
| `/admin/report/log/nginx-error` | Error log · 502/504 |
| `/admin/report/log/errors` | Error digest รวม (copy ให้ Claude วิเคราะห์) |

### 15.3 Data Reports

| Route | เนื้อหา |
|---|---|
| `/admin/report/payments` | PromptPay verify + Omise webhook log |
| `/admin/report/downloads` | download events ต่อ template |
| `/admin/report/export` | Export orders CSV |
| `/admin/report/pageviews` | Page analytics · top pages |

---

## 16. Admin — Catalog Manager

URL: `/admin/catalogs`

### 16.1 Category List

- แสดง category ทั้งหมด + จำนวน template
- emoji + ชื่อ + slug

### 16.2 สร้าง Category ใหม่

กรอก:
- Slug (ใช้ใน URL เช่น `finance`)
- ชื่อภาษาไทย
- Emoji

### 16.3 แก้ไข Category

- Inline edit ชื่อ + emoji ได้เลย
- กด Save / Cancel

### 16.4 ลบ Category

- กด ลบ → confirm → ลบออก
- ระวัง: template ที่เชื่อมอยู่จะไม่มี category

---

## 17. ราคาและการคิดเงิน

### 17.1 Volume Pricing (Template ปกติ)

| ตำแหน่งชิ้นในตะกร้า | ราคา |
|---|---|
| ชิ้นที่ 1 | ฿20 |
| ชิ้นที่ 2-5 | ฿10/ชิ้น |
| ชิ้นที่ 6+ | ฿7/ชิ้น |

ราคาคิดแบบ marginal (แต่ละชิ้นคิดตามตำแหน่ง):
- 2 ชิ้น = ฿20 + ฿10 = ฿30
- 3 ชิ้น = ฿20 + ฿10 + ฿10 = ฿40

### 17.2 Request Only Pricing

- ราคาคงที่ ฿50 ต่อชิ้น
- ไม่ขึ้นกับ volume tier
- คงที่ทุก position ในตะกร้า

### 17.3 Free Tier

- ราคา ฿0
- ไม่นับใน paidItemCount
- ไม่มีปุ่ม "หยิบใส่ตะกร้า" — ใช้ปุ่ม "รับฟรี" แทน

### 17.4 Omise PromptPay

- ชำระผ่าน QR PromptPay
- ยอดขั้นต่ำ ฿20 (Omise minimum)
- QR มีอายุ 120 วินาที → สร้าง QR ใหม่ได้
- ระบบ polling ทุก 3 วินาที → auto-redirect เมื่อจ่ายแล้ว

---

## 18. ระบบโค้ดส่วนลด (Promo Code)

### 18.1 ประเภทโค้ด

| ประเภท | ตัวอย่าง | ใช้ที่ |
|---|---|---|
| Fixed discount | ลด ฿20 | checkout |
| Percent discount | ลด 50% | checkout |
| Unlock Code | REQ-XXXXXX | catalog (unlock template) |

### 18.2 Validation Rules

| เงื่อนไข | Error |
|---|---|
| ไม่พบ code | "ไม่พบโค้ดส่วนลดนี้" |
| ยังไม่เริ่ม | "โค้ดยังไม่เริ่มใช้งาน" |
| หมดอายุ | "โค้ดหมดอายุแล้ว" |
| ใช้ครบแล้ว | "โค้ดถูกใช้ครบแล้ว" |
| ยอดต่ำกว่าขั้นต่ำ | "ยอดขั้นต่ำ ฿XX" |

### 18.3 Unlock Code Flow (J13)

1. Admin สร้างโค้ดใน `/admin/templates/[id]/edit` → กด "🔑 สร้าง Unlock Code"
2. ระบบ deactivate code เก่า (ถ้ามี) → สร้าง `REQ-XXXXXX` ใหม่
3. Admin copy code → ส่งให้ลูกค้าทาง LINE
4. ลูกค้ากรอก code ที่ catalog → validate → หยิบตะกร้าได้
5. Code ใช้ได้ 1 ครั้ง · อายุ 30 วัน

---

## หมายเหตุเพิ่มเติม

### Admin Authentication

- Login: `/admin/login`
- Session-based (cookie HttpOnly)
- ทุก admin route มี `requireAdminSession()` guard

### Deployment

```bash
# Deploy ทุกครั้งหลัง push
git push origin main
ssh root@103.52.109.85 "cd /var/www/planprom && git pull && npm run build"
ssh root@103.52.109.85 "cd /var/www/planprom && cp -r .next/static .next/standalone/.next/static && cp -r public .next/standalone/public && cp .env.local .next/standalone/.env.local && pm2 restart planprom"
curl -s -o /dev/null -w '%{http_code}' https://planprom.com/  # ต้องได้ 200
```

### Environment Variables สำคัญ

| Variable | ใช้สำหรับ |
|---|---|
| `DATABASE_URL` | PostgreSQL connection |
| `OMISE_SECRET_KEY` | Omise payment |
| `OMISE_PUBLIC_KEY` | Omise frontend |
| `LINE_CHANNEL_ACCESS_TOKEN` | LINE OA push message |
| `OWNER_LINE_USER_ID` | notify owner เมื่อมี order |
| `ADMIN_PASSWORD` | admin login |
| `NEXT_PUBLIC_BASE_URL` | base URL สำหรับ QR + links |
