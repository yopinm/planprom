# Planprom_Manual.md — คู่มือการใช้งาน แพลนพร้อม (planprom.com)

> อัพเดตล่าสุด: 2026-05-15 · Session 75 · ครอบคลุมทุกฟีเจอร์ที่ Live + Technical Reference (DB, API, Engine, Infra) จาก Blueprint
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
19. [DB Schema Reference](#19-db-schema-reference)
20. [Routes & API Reference](#20-routes--api-reference)
21. [Engine System Reference](#21-engine-system-reference)
22. [Infra & Deploy Reference](#22-infra--deploy-reference)

---

## 1. ภาพรวมระบบ

**แพลนพร้อม** คือร้านขาย Template PDF สำหรับวางแผนการเงิน ธุรกิจ ครอบครัว และอาชีพ

| รายการ | รายละเอียด |
|---|---|
| URL | https://planprom.com |
| Server | VPS AlmaLinux 9.7 · PM2 + Nginx + Cloudflare Full |
| Stack | Next.js 16 (App Router) · TypeScript · PostgreSQL · Omise PromptPay |
| ราคา | ฿30 ชิ้นแรก → ฿20 ชิ้น 2-5 → ฿10 ชิ้น 6+ |
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
  - ชิ้นแรก ฿30
  - 2-5 ชิ้น ฿20/ชิ้น (ลด 33%)
  - 6 ชิ้นขึ้นไป ฿10/ชิ้น
- **CTA หลัก:** "เริ่มต้นที่ ฿30 → ดูเทมเพลตทั้งหมด"

### 2.2 Section Template Store

- **Featured Template Card** — การ์ด "✨ แนะนำสัปดาห์นี้" พร้อม:
  - รองรับ 1–3 template พร้อมกัน แสดงเป็น compact row list (divide-y)
  - แต่ละ row: ชื่อ Template + category inline ต่อท้าย (· emoji ชื่อ) · ปุ่ม "ดูพรีวิว" · ปุ่ม "หยิบใส่ตะกร้า" หรือ "รับฟรี"
  - กด "ดูพรีวิว" เปิด Modal รูปตัวอย่าง (multi-page carousel ถ้ามีหลายหน้า)
  - กำหนดใน Admin: `/admin/templates/[id]/edit` → ⭐ Set Featured (มีได้สูงสุด 3 template · แสดง X/3 badge)
  - Fallback: ถ้าไม่มี featured_weekly → แสดง template ที่ sale_count สูงสุด 1 รายการ

- **Promo Code Banner** — การ์ดขวามือแสดงโค้ดส่วนลด active ที่ไม่ใช่ Unlock Code
  - Layout: header → label กระพริบ (promo-blink animation) → savings hint → progress bar → countdown + slots → โค้ดตรงกลาง + ปุ่ม Copy
  - **Savings hint:** "ซื้อ 1 ชิ้น ฿30 → ฿XX (ประหยัด X%)" คำนวณจาก discount_type/value × TIER_1
  - **Progress bar:** แสดง % เวลาที่ผ่านไปจาก starts_at → expires_at (สีชมพูเมื่อ urgent)
  - **Slots เหลือ:** แสดง "เหลือ X สิทธิ์" ถ้า max_uses ไม่ใช่ null
  - Countdown: ปกติแสดงเป็นวัน · เมื่อเหลือ <24 ชั่วโมง → แสดงเป็น "หมดใน X ชั่วโมง" (red + ⚠️, urgent state)
  - Urgent state: card bg/border เปลี่ยนเป็น rose-50/rose-300
  - ถ้าไม่มีโค้ด active: แสดง placeholder

- **Category chips** — ทางลัดไปหมวดหมู่ต่างๆ
- **LINE Request CTA** — การ์ด amber "หาฟอร์มไม่เจอ? ➕ LINE → 💬 บอกฟอร์ม → ✅ ใน 24ชม. · 50฿"

- **บทความแนะนำ** — section "📌 บทความแนะนำ" ใต้ LINE CTA
  - แสดงเฉพาะเมื่อมี blog post ที่ `status = published` + `pinned = true` อย่างน้อย 1 รายการ
  - แสดงสูงสุด 6 บทความ เรียงตาม `pinned_order ASC`
  - Layout: grid 1 col (mobile) / 2 col (tablet) / 3 col (desktop)
  - แต่ละ card: ชื่อบทความ · คำอธิบาย · เวลาอ่าน (นาที) · link ไป `/blog/[slug]`
  - มีปุ่ม "ดูทั้งหมด →" ลิ้งค์ไป `/blog`
  - Admin ควบคุมจาก `/admin/seo` → กด **ปักหมุด** (ต้อง Publish ด้วย ถึงจะแสดง)

### 2.3 Floating LINE Button

- ปุ่มเขียว LINE มุมล่างขวา
- Speech bubble "หาฟอร์มไม่เจอ? 📌 / Request ด่วน 50฿ ✅" กระพริบทุก 7 วินาที (CSS keyframe)

### 2.5 Navigation Bar

| Tab | ลิงก์ |
|---|---|
| หน้าแรก | `/` |
| เทมเพลตทั้งหมด | `/templates` |
| บทความ | `/blog` |
| Planner หรือ Checklist? | `/blog/planner-กับ-checklist-ต่างกันยังไง` |
| คำถามที่พบบ่อย | `/blog/คำถามที่พบบ่อย-faq` |

### 2.6 Footer

ไฟล์: `src/components/layout/Footer.tsx`

| รายการ | ข้อความ |
|---|---|
| Slogan | แพลนพร้อม — เช็คทุกขั้น แพลนทุกวัน ใช้ได้ทุกงาน |
| ลิงก์ | ข้อกฎหมาย (`/legal`) · นโยบายความเป็นส่วนตัว (`/privacy`) · เงื่อนไขการใช้งาน (`/terms`) |
| Copyright | © {ปี} แพลนพร้อม. สงวนลิขสิทธิ์ |

---

## 3. หน้าเทมเพลต (/templates)

URL: `https://planprom.com/templates`

### 3.1 Filter Bar

| Filter | ตัวเลือก |
|---|---|
| หมวดหมู่ | ทุกหมวด + แต่ละ category |
| ราคา | ทุกราคา / ฟรี / ฿30 |
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
- **1 ชิ้น:** "เพิ่มอีก 1 ชิ้น ลดเหลือ ฿20/ชิ้น"
- **2-5 ชิ้น:** นับถอยหลังสู่ tier ถัดไป
- **6+ ชิ้น:** "คุ้มสุด! ราคา ฿10/ชิ้น สำหรับทุกชิ้นถัดไป"
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
- = ฿30 template + ฿20 ค่าจัดทำ custom
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

**Mode 5 — Engine: Report (RE-1):**
- กรอก ReportEngineForm (8 section)
  - S1 Cover: ชื่อรายงาน · subtitle · ชื่อองค์กร
  - S3 Executive Summary: สรุป + ข้อค้นพบ + เสนอแนะ
  - S4 Introduction & Scope: วัตถุประสงค์/ขอบเขต/methodology
  - S5 Core Content: ตาราง (Module C) + เนื้อหา text (Module F)
  - S6 Conclusion: บทสรุป/ความเสี่ยง/คาดการณ์
  - S7 Appendix: raw data/อ้างอิง/glossary
- Generate PDF → Approve → publish
- แก้ไขหลัง publish ได้ผ่านหน้า Revise (ReportReviseForm)
- Customer preview: sky-color card บน `/templates/[slug]`

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
  - **ค่าธรรมเนียม (platform fee):** คำนวณ Omise PromptPay 1.65% × 1.07 VAT = **1.7655%** · คิดเฉพาะ orders ที่มี `omise_charge_id IS NOT NULL` (Omise-charged orders only) · card มี tooltip ⓘ แสดงสูตร
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

**หลักการ:** ระบบวิเคราะห์ความต้องการตลาดจาก Google Suggest แล้วบอก admin ว่าวันนี้ควรสร้าง template อะไร ใน catalog ไหน ประเภทไหน — admin กด "+ สร้าง" ระบบ pre-fill ให้พร้อม ไม่ต้องเดาเอง

**วิธีทำงาน:**
1. ดึง Google Suggest ด้วย **12 seed keywords** × 16 ตัวอักษรไทย = **192 queries/ชั่วโมง** (cache 1h)
   - **8 type-based seeds:** checklist · planner · ฟอร์ม · รายงาน · ตาราง · ใบแจ้ง · แผนงาน · บัญชี
   - **4 topic-based seeds:** งาน · เลี้ยงลูก · งานบ้าน · ครอบครัว (ต้องผ่าน TOPIC_ACTIONABLE filter ก่อนแสดง)
2. กรอง idea ด้วย **4 ชั้น filter** (ลำดับ: NOISE → STRIPPED_NOISE → FULL_NOISE → TOPIC_ACTIONABLE):
   - **NOISE:** exact-match บน stripped text (`^(ฟรี|template|word|...)$`)
   - **STRIPPED_NOISE:** substring บน stripped text (`/ฟรี|goodnote|น่ารักๆ|cute|ดาวน์โหลด/i`)
   - **FULL_NOISE:** substring บน full suggestion string (`/free|ดาวน์โหลดฟรี|.../i`)
   - **TOPIC_ACTIONABLE:** topic seeds ต้องมี process/domain word (`สำหรับ|วิธี|ระบบ|แบบ|แผน|บันทึก|ช่วย...`) ถึงผ่านได้
3. คำนวณ **Priority Score** = level × (100 − coverage%) → เรียงลำดับว่าควรสร้างอะไรก่อน
4. จับคู่ idea → catalog ด้วย **CATALOG_KEYWORD_MAP** (14 entries · first-match wins · specific → general)
5. แสดง top 3 ideas ต่อ catalog ใน **Catalog Action Cards** พร้อมปุ่ม "+ สร้าง" ที่ pre-fill title/engine/category ให้อัตโนมัติ

**Scale อัตโนมัติ:**
- เพิ่ม catalog ใหม่ใน Catalog Manager → card ขึ้นทันที (ดึงจาก DB ตรงๆ)
- เพิ่ม seed keyword → ได้ ideas ใหม่ใน cycle ถัดไป (1 seed = +16 queries)
- ideas match catalog ใหม่ได้ถ้า catPattern ตรงกับชื่อ/slug หรือ idea text มีชื่อ category ตรงๆ

**Sections ในหน้า:**
- **S1 — KPI:** revenue · orders · avg · downloads · unique buyers
- **S2 — Revenue by Engine:** ยอดขายแต่ละประเภท (Checklist/Planner/Form/Report)
- **S2a — Catalog Action Cards:** top 3 ideas ต่อ catalog + ปุ่ม "+ สร้าง" (pre-fill wizard) · buffer 6 ideas/catalog (แสดง 3) เพื่อรองรับ idea ถูก reject ระหว่างวัน
- **S3 — Priority List (Card 05):** top 20 uncovered ideas เรียงตาม score · แต่ละ row มี catalog badge + engine badge + ปุ่ม ✕ reject
- **S4 — Coverage:** ครอบคลุมแค่ไหน (%) ต่อ engine type · gap heatmap
- **S5 — Market Demand (Card 06):** 4 กลุ่ม demand รวม (Checklist / Planner / Form / Report) — merge ideas จากหลาย keyword ในกลุ่มเดียว ไม่ duplicate · แต่ละ idea มีปุ่ม ✕ reject
- **S6 — Bestseller / Zero-sale:** template ขายดีสุด vs ขายไม่ออก · 14-day daily chart

**Badge "N KEYWORDS · N ALPHA · CACHE 1H":** hover เพื่อดูรายละเอียด — บอกจำนวน queries และอายุ cache ปัจจุบัน

#### Admin Feedback Loop (ปุ่มจัดการ idea)

ทุก idea card มีปุ่มควบคุม 3 ระดับ:

| ปุ่ม | ผล | คืนกลับได้? |
|---|---|---|
| **✕** (บน Priority List / Market Demand) | reject ชั่วคราว — idea หายไปจากทุก card ทันที | ✅ กู้คืนได้จาก Recovery Section |
| **↩ กู้คืน** (ใน Rejected Section) | ลบ record ออกจาก intel_rejected → idea กลับมาใน cycle ถัดไป | — |
| **🗑️** (per-row ใน Rejected Section) | permanent reject — idea หายถาวร ไม่โผล่ใน Recovery List อีก | ❌ ถาวร |
| **🗑️ ล้างทั้งหมดถาวร** (header ของ Rejected Section) | bulk permanent reject — ล้าง recovery list ทั้งหมดในครั้งเดียว | ❌ ถาวร |

**Rejected Section** (collapsible ใต้ Priority List):
- แสดง ideas ที่ถูก reject แบบชั่วคราว (`is_permanent = false`) พร้อม rejected_at
- ซ่อน ideas ที่ permanent reject (`is_permanent = true`) — ถูก filter ออกทั้งระบบเงียบๆ

#### Auto-blacklist: Stale Ideas (30+ วัน)

idea ที่ปรากฏใน Google Suggest มา ≥ 30 วันแต่ยังไม่ถูก fulfill จะถูก soft-hide อัตโนมัติ:
- ไม่โผล่ใน Priority List / Catalog Cards อีก
- โผล่ใน **Stale Section** (collapsible) พร้อมวันที่เก่าสุด

**ปุ่มใน Stale Section:**
| ปุ่ม | ผล |
|---|---|
| **↩ คืน** | reset clock — insert today's snapshot ลง intel_snapshots → idea กลับมาใน Priority List ใน cycle ถัดไป |
| **+ สร้าง** | redirect ไป `/admin/templates/new` พร้อม pre-fill เหมือนปกติ (บันทึกลง intel_fulfilled ด้วย) |

> **ทำไม recoverable?** กรณีที่ admin ทำงานไม่ทัน เกิน 30 วันก่อนสร้าง template ควรมีโอกาสดึง idea กลับมาได้ แทนที่จะสูญหายไปเงียบๆ

#### Server Actions (ใน actions.ts)

| Action | ตาราง DB | หมายเหตุ |
|---|---|---|
| `recordFulfilledAction` | intel_fulfilled | INSERT + redirect ไป /admin/templates/new |
| `rejectIdeaAction` | intel_rejected | INSERT is_permanent=false ON CONFLICT DO NOTHING |
| `revertRejectedAction` | intel_rejected | DELETE WHERE idea_text = ? |
| `permanentRejectAction` | intel_rejected | INSERT/UPDATE SET is_permanent=true |
| `bulkPermanentRejectAction` | intel_rejected | UPDATE SET is_permanent=true WHERE is_permanent=false |
| `restoreStaleAction` | intel_snapshots | INSERT TODAY's snapshot → reset 30-day clock |

ทุก action ใช้ `revalidatePath('/admin/template-analytics')` เพื่อ refresh หน้าโดยไม่ต้อง reload

### 15.2 System Log (Unified)

URL: `/admin/report/log`

หน้าเดียวครอบคลุมทุก log source + export สำหรับส่งให้ Claude Code วิเคราะห์

#### วิธีส่ง log ให้ Claude Code

1. กด **"📋 Export JSON"** ด้านบนขวา → ข้อมูลถูก copy ไปยัง clipboard ทันที
2. เปิด Claude Code session → พิมพ์อธิบายปัญหา เช่น `"ระบบมีปัญหา X"`
3. Paste JSON ต่อท้าย → Claude วิเคราะห์ DB snapshot + logs ได้ทันที

> ต้องการเฉพาะ log ไฟล์เดียว → เลือก tab ที่ต้องการ → กด **Copy** ใต้ log นั้น

#### Tabs

| Tab | เนื้อหา |
|---|---|
| 🖥 PM2 Log | stdout / stderr toggle · แสดง path ไฟล์จริง |
| 🌐 Nginx Access | summary (4xx/5xx count + top 10 paths) + raw lines |
| ⚠️ Nginx Error | 502/504/upstream counter + raw lines |
| 📋 Error Digest | รวม error lines จาก PM2 stdout + PM2 stderr + Nginx error |

#### Window Filter

`~1ชม.` / `~6ชม.` (default) / `~24ชม.` / `ทั้งหมด` — กรองปริมาณ lines ที่ดึงจาก log ทุก tab

#### Export JSON ครอบคลุม

- DB snapshot: templates · categories · orders 30 วัน · cart stats
- Logs: PM2 stdout + stderr · Nginx access + error · สรุป top paths

#### Alert Cards (สถานะระบบ)

การ์ดคำนวณจากข้อมูลสด — ไม่ต้องตั้งค่า เปลี่ยนสีอัตโนมัติเมื่อเงื่อนไขหาย

| การ์ด | เงื่อนไข | สี |
|---|---|---|
| 🔴 พบ 5xx Error | Nginx 5xx ≥ 1 | แดง |
| ⚠️ พบ Error ใน Log | error/warn/fail keyword ใน PM2+Nginx | เหลือง |
| 🟠 4xx สูงผิดปกติ | Nginx 4xx > 10 | ส้ม |
| 📋 ยังไม่มีเทมเพลต | published = 0 | ฟ้า |
| 🛒 มีตะกร้าค้างอยู่ | active carts > 0 | ฟ้า |
| ✅ ระบบทำงานปกติ | ไม่มีการ์ดด้านบนเลย | เขียว |

**คลิกที่การ์ด** → เปิด/ปิด detail box แสดง 3 แถว: **เงื่อนไข** (ค่าที่ trigger) · **ความหมาย** (ผลต่อระบบ) · **วิธีแก้** (step แก้ปัญหา)

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

- Layout: **2-column grid** (max-w-6xl) — แต่ละ card แสดง emoji + ชื่อ + slug + จำนวน template
- แสดงทุก category เรียงตาม slug

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

### 16.5 Market Intelligence Integration

- เมื่อเพิ่ม catalog ใหม่ → **Catalog Action Cards** ใน `/admin/template-analytics` ขึ้นทันที (query จาก DB ตรงๆ)
- CATALOG_KEYWORD_MAP ใน analytics จับคู่ idea → catalog ด้วย slug/ชื่อ — ไม่ต้องตั้งค่าเพิ่มถ้า slug ตรงกับ keyword ที่มีอยู่แล้ว

---

## 17. ราคาและการคิดเงิน

### 17.1 Volume Pricing (Template ปกติ)

| ตำแหน่งชิ้นในตะกร้า | ราคา |
|---|---|
| ชิ้นที่ 1 | ฿30 |
| ชิ้นที่ 2-5 | ฿20/ชิ้น |
| ชิ้นที่ 6+ | ฿10/ชิ้น |

ราคาคิดแบบ marginal (แต่ละชิ้นคิดตามตำแหน่ง):
- 2 ชิ้น = ฿30 + ฿20 = ฿50
- 3 ชิ้น = ฿30 + ฿20 + ฿20 = ฿70

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

## 19. DB Schema Reference

> ตาราง PostgreSQL (self-hosted บน VPS) — ใช้สำหรับ template store โดยตรง

| Table | บทบาท |
|---|---|
| `templates` | slug, title, tier, price_baht, pdf_path, thumbnail_path, toc_sections JSONB, engine_type ('checklist'\|'planner'\|NULL), engine_data JSONB, document_type, status (draft\|draft_preview\|published), is_request_only |
| `template_categories` | slug, name, emoji |
| `template_category_links` | many-to-many (template ↔ category) |
| `template_tags` | auto-tags: bestseller / new / trending / premium / free / staple |
| `orders` | order_number (CK-YYYYMMDD-NNNN), order_type ('cart'\|'single'\|'pack'), customer_line_id, amount_baht, status, download_token, download_expires_at, download_count |
| `order_items` | order_id → template_id (สำหรับ cart order) |
| `carts` / `cart_items` | session-based cart (J18) |
| `pack_credits` | ฿20=2cr / ฿50=10cr / ฿100=25cr · FIFO · expire 90 วัน |
| `promo_codes` | code, discount_type, discount_value, max_uses, used_count, template_id (NULL=public, NOT NULL=unlock code) |
| `template_revisions` | [DC-8 planned] revision_number, engine_data JSONB, pdf_path, change_note |
| `free_template_grants` | LINE add friend → free template (pending) |
| `template_searches` | search analytics |
| `intel_fulfilled` | idea_text + catalog_slug + engine_type — บันทึกเมื่อ admin กด "+ สร้าง" เพื่อ filter ออกจาก priority list |
| `intel_snapshots` | idea_text + engine_type + catalog_slug + score + demand_count + snapshot_date — ใช้ track อายุ idea (stale = last_snapshot > 30 วัน) |
| `intel_rejected` | idea_text + is_permanent + rejected_at — Admin Feedback Loop: is_permanent=false = soft reject (recoverable) · is_permanent=true = permanent reject (ไม่โผล่ใน recovery list) |

### กฎ DB
- `order_number` ใช้ sequence `order_seq` (ไม่ใช่ random)
- `download_token` = signed UUID · expire 24h · max 3 downloads
- `promo_codes.template_id IS NULL` = public promo · `IS NOT NULL` = unlock code (J13)
- `templates.is_request_only = true` → ราคา ฿50 เสมอ (override tier price)
- `intel_rejected.is_permanent = false` → soft reject (แสดงใน recovery list, กู้คืนได้) · `= true` → permanent (ถูก filter เงียบๆ ทั้งระบบ ไม่โผล่ทั้งใน card และ recovery)
- `intel_rejected` ใช้ UNIQUE(idea_text) — upsert ด้วย ON CONFLICT DO UPDATE/DO NOTHING แล้วแต่ action
- `intel_snapshots` ใช้ UNIQUE(idea_text, engine_type, snapshot_date) — restoreStaleAction insert TODAY เพื่อ reset 30-day clock

---

## 20. Routes & API Reference

### Routes ที่ Live

| Route | บทบาท |
|---|---|
| `/` | Homepage — catalog sections, promo banner |
| `/templates` | Template list + pricing callout (marginal ฿30→฿20→฿10) |
| `/templates/[slug]` | Template detail + engine preview |
| `/catalog/[slug]` | หมวดหมู่ template |
| `/cart` | ตะกร้าสินค้า (session-based) |
| `/checkout/[slug]` | ชำระเงินรายชิ้น — LINE auth → PromptPay QR |
| `/checkout` | ชำระเงิน cart — LINE auth → PromptPay QR |
| `/d/[token]` | Download page (validate token 24h / max 3x) |
| `/orders` | ประวัติ order + ปุ่ม download |
| `/analysis` | วิเคราะห์การซื้อส่วนตัว |
| `/admin/templates` | รายการ template + badge หมวดหมู่ + engine |
| `/admin/templates/new` | wizard สร้าง template (6 steps) |
| `/admin/templates/[id]/edit` | แก้ metadata + approve draft_preview |
| `/admin/templates/[id]/revise` | แก้ engine content + re-generate PDF (DC-8) |
| `/admin/catalogs` | จัดการหมวดหมู่ |
| `/admin/orders` | รายการ order + verify + revoke + LINE notify |
| `/admin/template-analytics` | KPI + Revenue by Engine + Catalog Action Cards + Priority List (Feedback Loop) + Market Demand (4 groups) + Stale/Rejected recovery sections + Bestseller/Zero-sale |
| `/admin/form-builder` | Form Builder สร้าง interactive form |

### API Endpoints

| Method | Route | บทบาท |
|---|---|---|
| POST | `/api/orders` | สร้าง order + gen PromptPay QR |
| POST | `/api/orders/[id]/claim-paid` | trust-based claim → token → LINE push |
| GET | `/api/checkout/[uid]/status` | Omise polling → mark paid → issue tokens |
| POST | `/api/checkout/[uid]/refresh-qr` | QR หมดอายุ → สร้าง charge ใหม่ |
| GET/POST | `/api/cart` | ดู / อัพเดต cart |
| DELETE | `/api/cart/remove` | ลบ item จาก cart |
| POST | `/api/admin/templates/upload-pdf` | อัพโหลด PDF ขึ้น VPS |
| POST | `/api/admin/templates/upload-docx` | .docx → mammoth → puppeteer PDF + extractToc |
| POST | `/api/admin/templates/generate-engine` | engine_type + engine_data → auto PDF |
| GET/POST | `/api/admin/templates/[id]/unlock-code` | ดู / สร้าง unlock code (J13) |
| POST | `/api/admin/orders/[id]/verify` | verify + issue download token |
| POST | `/api/admin/orders/[id]/revoke` | revoke download token |

### Server Actions (Market Intelligence)

| Action | File | บทบาท |
|---|---|---|
| `recordFulfilledAction` | `app/admin/template-analytics/actions.ts` | บันทึก intel_fulfilled + redirect สร้าง template |
| `rejectIdeaAction` | `app/admin/template-analytics/actions.ts` | reject idea ชั่วคราว (is_permanent=false) |
| `revertRejectedAction` | `app/admin/template-analytics/actions.ts` | กู้คืน idea ที่ reject |
| `permanentRejectAction` | `app/admin/template-analytics/actions.ts` | permanent reject ต่อ row |
| `bulkPermanentRejectAction` | `app/admin/template-analytics/actions.ts` | bulk permanent reject ทั้ง recovery list |
| `restoreStaleAction` | `app/admin/template-analytics/actions.ts` | reset 30-day stale clock สำหรับ idea ที่ค้างนาน |

---

## 21. Engine System Reference

> Text-to-PDF engine สร้างเอกสาร PDF สมบูรณ์จากข้อมูลที่ admin กรอก (ไม่ต้องผ่าน .docx)

### Engine Types

| Type | Form Component | Generator |
|---|---|---|
| `checklist` | `ChecklistEngineForm` — 5 sections (Header / Purpose / Items / Remarks / Sign-off) | `lib/engine-checklist.ts` |
| `planner` | `PlannerEngineForm` — 4 pillars (Goal / Execution / Tracking / Idea) | `lib/engine-planner.ts` |
| `pipeline` | `PlannerPipelineForm` — 5 sections, time-cascade, horizon-driven | `lib/engine-planner-pipeline.ts` |

### DocCode Format

| Engine | Format | ตัวอย่าง |
|---|---|---|
| checklist | `CK-YYYYMMDD-XXXX` | CK-20260509-0001 |
| planner | `TP-YYYYMMDD-XXXX` | TP-20260513-0003 |

- XXXX = COUNT(*) ของ engine_type นั้นใน DB + 1 (query ณ ตอน generate)
- **คงเดิมทุก revision** — ไม่ re-generate เมื่อแก้ไขเนื้อหา
- ไม่แสดง docCode ในตัวเอกสาร — เก็บใน DB เท่านั้น

### PDF Design Rules

- หมวดหมู่ (catalog) แสดงแทนรหัสเอกสารใน header
- ผู้จัดทำ = เส้นว่างสำหรับลูกค้ากรอกเอง
- Footer: `ชื่อเทมเพลต · หมวดหมู่ · planprom.com`
- Watermark: CSS diagonal `::before` (optional, ตั้งใน admin)
- Viewport: 560px · clip half-page 1 สำหรับ thumbnail preview

### Anti-fraud (Payment)

- Rate limit: claims ≥5/24h → `fraud_flag=suspicious` (ไม่ส่งลิงก์)
- Revoke: admin กด → `download_token=NULL` + LINE notify ลูกค้า
- Owner notify: ทุก claim → LINE push ไปที่ `OWNER_LINE_USER_ID`

---

## 22. Infra & Deploy Reference

### VPS Specification

| Item | Value |
|---|---|
| Provider | Ruk-Com Cloud |
| IP | `103.52.109.85` |
| OS | AlmaLinux 9.7 |
| CPU | 2 Cores |
| RAM | 4 GB |
| Storage | 40 GB SSD |
| Cost | ~800 บาท/เดือน |
| SSH | `root@103.52.109.85` (SSH Key only) |
| App path | `/var/www/planprom` |
| PM2 process | `planprom` · port 3001 · fork mode |
| Uploads | `/var/www/planprom/uploads/templates/` (persistent) |

### Infra Stack

```
User → Cloudflare (DNS / CDN / WAF / SSL Full Strict)
     → VPS AlmaLinux
         Nginx (reverse proxy :443 → :3001)
         → Next.js (PM2 fork mode)
              ↓
         PostgreSQL (local, self-hosted)
         Supabase (Auth เท่านั้น — LINE OAuth)
```

### Deploy Sequence (ทุกครั้งหลัง push)

```bash
git push origin main
ssh root@103.52.109.85 "cd /var/www/planprom && git pull origin main"
ssh root@103.52.109.85 "cd /var/www/planprom && npm run build"
ssh root@103.52.109.85 "cd /var/www/planprom && cp -r .next/static .next/standalone/.next/static && cp -r public .next/standalone/public && cp .env.local .next/standalone/.env.local"
ssh root@103.52.109.85 "pm2 restart planprom"
curl -s -o /dev/null -w '%{http_code}' https://planprom.com/  # ต้องได้ 200
```

> ถ้ามี static manifest mismatch: ใช้ `rm -rf .next && npm run build` (clean rebuild)

### Nginx (planprom.com)

```nginx
server {
    listen 443 ssl http2;
    server_name planprom.com www.planprom.com;
    ssl_certificate /etc/letsencrypt/live/planprom.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/planprom.com/privkey.pem;
    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";
    add_header Referrer-Policy "strict-origin-when-cross-origin";
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
    }
    server_tokens off;
}
```

### Cloudflare

- SSL/TLS: **Full (Strict)** ✅
- Bot Fight Mode / DDoS Protection / Block AI Bots / Email Obfuscation ✅
- WAF: `/admin/*` restrict · bad UA block · rate limit API routes
- Let's Encrypt cert: `certbot-renew.timer` enabled (auto-renew)

### Infra Risk

| Risk | มาตรการ |
|---|---|
| PM2 crash loop | `pm2 watch` + UptimeRobot alert |
| DB bloat | retention policy + weekly cleanup cron |
| Static manifest mismatch | clean rebuild (`rm -rf .next`) |
| Cloudflare WAF block | whitelist IP ที่รู้จัก |
| Upload disk full | `df -h` ตรวจทุกเดือน (40GB SSD) |

---

## 23. Omise Go-Live Checklist

> อ้างอิง: `core/Capture UI/omise-golive-checklist.md` · ดำเนินการในนาม **บุคคลธรรมดา** (ไม่จดทะเบียนบริษัท)

### 23.1 สิ่งที่ทำเสร็จแล้ว (code-side)

| รายการ | สถานะ |
|---|---|
| Webhook HMAC-SHA256 verify | ✅ `app/api/webhooks/omise/route.ts` |
| Idempotency — guard `status !== 'pending_payment'` | ✅ กัน duplicate event |
| HTTPS / Cloudflare Full Strict | ✅ |
| API keys ใน `.env.local` ไม่ hardcode | ✅ |
| Download limit 3x per order | ✅ |
| Cloudflare WAF bypass `/api/webhooks/omise` | ✅ |
| `/legal` · `/privacy` · `/terms` | ✅ มีหน้าแล้ว |
| Refund Policy ระบุ "ยกเว้นไฟล์เสียหาย" | ✅ (เพิ่ม Session 72) |
| Privacy Policy — Omise processor disclosure | ✅ (เพิ่ม Session 72) |
| Cookie Consent Banner (PDPA) | ✅ (เพิ่ม Session 72) |

### 23.2 Admin ต้องทำ (รอ owner action)

| ขั้นตอน | รายละเอียด |
|---|---|
| สมัคร Live Mode | Omise Dashboard → Submit for approval → รอ **3–7 วันทำการ** |
| เอกสาร KYC | บัตรประชาชน (เซ็น + รับรองสำเนา) · Selfie+บัตร · หน้าแรกสมุดบัญชี (ชื่อตรงบัตร) · ใบเสร็จโดเมน · Portfolio template |
| ข้อมูลธุรกิจใน dashboard | ประเภท: Digital Template · URL: planprom.com · avg transaction ฿30–50 |
| รับ Live API Keys | `pkey_live_xxx` + `skey_live_xxx` หลัง Omise อนุมัติ |
| อัพ VPS `.env.local` | ดู **§23.5** ด้านล่าง |
| ตั้ง Webhook URL | ดู **§23.6** ด้านล่าง |
| Live test | ซื้อ template ตัวเอง ยอด ฿30 → ตรวจ QR สแกนได้ → webhook → download link |

### 23.5 J9-ADMIN-2 — อัพ Live Keys บน VPS (step by step)

> ทำหลังจาก Omise ส่ง Live API Keys มาทาง email

**ขั้นตอน:**

```bash
# 1. SSH เข้า VPS
ssh root@103.52.109.85

# 2. เปิดไฟล์ .env.local
nano /var/www/planprom/.env.local
```

ใน nano ให้หาบรรทัดที่มี `OMISE_` แล้วแก้เป็น live keys:

```env
OMISE_PUBLIC_KEY=pkey_live_xxxxxxxxxxxxxxx
OMISE_SECRET_KEY=skey_live_xxxxxxxxxxxxxxx
OMISE_WEBHOOK_SECRET=<ค่าที่ Omise ให้หรือตั้งเองใน dashboard>
```

> ⚠️ **ห้าม** แก้ key อื่นในไฟล์นี้ — แก้เฉพาะ 3 บรรทัดนี้

```bash
# 3. บันทึกไฟล์ใน nano
# กด Ctrl+O → Enter → Ctrl+X

# 4. copy ไฟล์ไปยัง standalone (จำเป็นทุกครั้ง)
cp /var/www/planprom/.env.local /var/www/planprom/.next/standalone/.env.local

# 5. restart app
pm2 restart planprom

# 6. ตรวจสอบ
pm2 status
curl -s -o /dev/null -w '%{http_code}' https://planprom.com/
# ต้องได้ 200
```

**ตรวจว่า key โหลดถูกต้อง:**

```bash
# ดู log หลัง restart — ต้องไม่มี OMISE_SECRET_KEY error
pm2 logs planprom --lines 30
```

---

### 23.6 J9-ADMIN-3 — ตั้ง Webhook URL ใน Omise Dashboard (step by step)

> ทำหลังจากอัพ live keys และ pm2 restart เสร็จแล้ว

**ขั้นตอน:**

1. เปิด **https://dashboard.omise.co** → Login
2. สลับไปโหมด **Live** (toggle มุมบนขวา — ตรวจว่าไม่ได้อยู่ใน Test)
3. เมนูซ้าย → **Settings** → **Webhooks**
4. กด **"+ New webhook"** (หรือ Add Endpoint)
5. กรอก URL:
   ```
   https://planprom.com/api/webhooks/omise
   ```
6. เลือก Event: **`charge.complete`** (เลือกเฉพาะตัวนี้พอ)
7. กด **Save / Create**
8. Dashboard จะแสดง **Webhook Secret** → คัดลอกค่านี้
9. นำค่า Webhook Secret ไปใส่ใน `.env.local` บน VPS:
   ```env
   OMISE_WEBHOOK_SECRET=whsk_live_xxxxxxxxxxxxxxx
   ```
10. รัน `cp .env.local .next/standalone/.env.local && pm2 restart planprom` อีกครั้ง

**ทดสอบ webhook:**

1. ใน Omise Dashboard → Webhooks → กด **"Send test"** หรือ **"Ping"**
2. ดู response ต้องได้ `200 OK`
3. ตรวจ log: `pm2 logs planprom --lines 20` — ต้องไม่มี signature error

---

### 23.3 ข้อควรรู้ (บุคคลธรรมดา)

| หัวข้อ | รายละเอียด |
|---|---|
| **On-hold 7 วัน** | ยอดขายจะ hold ก่อนถอนได้ — วางแผน cash flow |
| **ค่าธรรมเนียม** | code คำนวณ 1.7655% (1.65% × 1.07 VAT) — เช็คกับ Omise sales ว่า rate บุคคลธรรมดาตรงกัน |
| **ภาษีสิ้นปี** | รายได้เข้าบัญชีบุคคล = ต้องยื่น **ภงด.90** · เก็บ invoice/order ทุกรายการ |
| **VAT gate** | รายได้เกิน **1.8 ล้าน/ปี** → จด VAT ภายใน 30 วัน |
| **Volume limit** | บุคคลธรรมดาอาจถูกจำกัด monthly volume — เช็คกับ Omise ตอนสมัคร |
| **Chargeback** | สินค้าดิจิทัล chargeback rate สูง — download log (timestamp/IP) มีอยู่แล้ว · Refund Policy ต้องชัด |

### 23.4 Contact Omise

| ช่องทาง | รายละเอียด |
|---|---|
| Support | support@omise.co · 02-252-8777 |
| Privacy | privacy@opn.ooo |
| Dashboard | https://dashboard.omise.co |
| Docs | https://docs.opn.ooo |

---

## หมายเหตุเพิ่มเติม

### Admin Authentication (ADM-RBAC-1)

ระบบ Hybrid 2-Tier Auth สำหรับ Admin Area:

#### Tier 1 — Supabase (Owner / Admin หลัก)
- ใช้ Supabase email/password (`supabase.auth.signInWithPassword`)
- ต้องมี `user_profiles.role = 'admin'` ใน DB
- เหมาะสำหรับ Owner ที่ใช้งานประจำ

#### Tier 2 — RBAC Custom Auth (Admin / Clerk fallback)
- ใช้ตาราง `admin_users` (bcrypt password_hash + JWT cookie)
- Login → `POST /api/admin/auth/login` → ตั้ง `_admin_token` cookie (HttpOnly, 2h)
- Logout → `POST /api/admin/auth/logout` → ล้าง cookie
- Role: `admin` (เข้าถึงทุกเมนู) | `clerk` (เฉพาะ module ที่ได้รับ permission)
- ใช้ได้แม้ Supabase ล่ม

#### Login Flow
```
AdminLoginForm → Supabase signInWithPassword
  ├─ ✅ success → redirect
  └─ ❌ fail → POST /api/admin/auth/login (bcrypt check)
                  ├─ ✅ success → _admin_token cookie (+ permissions) → redirect
                  └─ ❌ fail → แสดง error
```

#### Module Permissions (clerk)
| Permission Key | เมนูที่ได้ |
|---|---|
| `templates` | + New Template · Templates · Field Templates |
| `catalog` | Catalog |
| `analytics` | Analytics |
| `blog_seo` | Blog SEO |
| `form_builder` | Form Builder |

#### Route Guard (middleware.ts — Edge Runtime)
- ทำงานก่อน server component — clerk พิมพ์ URL ตรงก็เข้าไม่ได้
- อ่าน `_admin_token` JWT → ตรวจ role + permissions
- Supabase-only session (ไม่มี `_admin_token`) → ผ่าน middleware เสมอ

| Route | Clerk ต้องมี |
|---|---|
| `/admin/templates/*`, `/admin/field-templates/*` | `templates` |
| `/admin/catalogs/*` | `catalog` |
| `/admin/template-analytics/*` | `analytics` |
| `/admin/seo/*` | `blog_seo` |
| `/admin/form-builder/*` | `form_builder` |
| `/admin/report/*`, `/admin/promo-codes/*`, `/admin/users/*` | ❌ admin only |

#### จัดการ Clerk Accounts
- ไปที่ `/admin/users` (เข้าได้เฉพาะ admin เท่านั้น)
- ปุ่ม "Users" ใน nav header (มองเห็นเฉพาะ admin)
- สร้าง / ลบ account + ติ๊ก checkbox permissions ต่อ clerk ได้เลย
- permissions บันทึกใน DB และใส่ใน JWT token ทุกครั้งที่ login

#### Files ที่เกี่ยวข้อง
| File | หน้าที่ |
|---|---|
| `middleware.ts` | Edge route guard — CLERK_PERMISSION_MAP + ADMIN_ONLY |
| `src/lib/admin-rbac.ts` | JWT sign/verify, AdminRole, PERMISSION_MODULES, COOKIE_NAME |
| `src/lib/admin-auth.ts` | resolveSession (Tier1+Tier2), requireAdminSession, getAdminSession |
| `app/api/admin/auth/login/route.ts` | POST — bcrypt verify → JWT cookie (incl. permissions) |
| `app/api/admin/auth/logout/route.ts` | POST — clear cookie |
| `app/admin/users/page.tsx` | list + add + checkbox permissions editor |
| `app/admin/users/actions.ts` | createAdminUser, deleteAdminUser, updatePermissions |
| `components/admin/AdminNav.tsx` | filter links ตาม role + permissions |
| `app/admin/layout.tsx` | อ่าน session → pass role + permissions ให้ AdminNav |

### Environment Variables สำคัญ

| Variable | ใช้สำหรับ |
|---|---|
| `DATABASE_URL` | PostgreSQL connection |
| `OMISE_SECRET_KEY` | Omise payment (server) |
| `OMISE_PUBLIC_KEY` | Omise frontend |
| `LINE_CHANNEL_ACCESS_TOKEN` | LINE OA push message |
| `LINE_CHANNEL_SECRET` | LINE webhook verify |
| `OWNER_LINE_USER_ID` | notify owner เมื่อมี order |
| `OWNER_PROMPTPAY` | เบอร์ PromptPay (0948859962) |
| `ADMIN_JWT_SECRET` | ลง sign JWT _admin_token สำหรับ RBAC Tier 2 |
| `NEXT_PUBLIC_BASE_URL` | base URL สำหรับ QR + links |
| `UPLOAD_DIR` | path สำหรับ PDF บน VPS (`/var/www/planprom/uploads/templates/`) |

> Deploy commands → ดู [Section 22](#22-infra--deploy-reference)

---

## 23. Security Checklist (ต้องทำทุกครั้งก่อน deploy admin feature)

> มาจาก Gemini Security Audit (2026-05-14) — VULN-001 ถึง VULN-004

### 23.1 Access Control

| กฎ | วิธีทำ |
|---|---|
| หน้า admin-only (log, snapshot, user data) | ใช้ `requireAdminRole('admin')` เท่านั้น |
| หน้าที่ clerk เข้าได้ | ใช้ `requireAdminSession()` |
| API route admin-only | ตรวจ role ก่อน return data เสมอ |

```ts
// ✅ ถูก — admin เท่านั้น
await requireAdminRole('admin', '/admin/login')

// ⚠️ ระวัง — อนุญาต clerk ด้วย
await requireAdminSession('/admin/login')
```

### 23.2 PII & Privacy (PDPA)

ข้อมูลที่ถือเป็น PII และต้อง mask ก่อนส่ง client หรือ export:

| ข้อมูล | วิธี mask |
|---|---|
| IP address (Nginx log) | `x.x.x.0` — ลบ octet สุดท้าย |
| อีเมล | `u***@domain.com` |
| เบอร์โทร | `08x-xxx-xx89` |

```ts
// ✅ mask IPv4 last octet
function maskIpLines(lines: string[]): string[] {
  return lines.map(l =>
    l.replace(/\b(\d{1,3}\.\d{1,3}\.\d{1,3})\.\d{1,3}\b/g, '$1.0')
  )
}
```

### 23.3 Path & Secret Disclosure

- **ห้าม** แสดง absolute server path ใน UI — ใช้ `basename` เท่านั้น
- **ห้าม** ส่ง `.env` value, JWT secret, หรือ DB connection string ไปยัง client
- PM2 log path → แสดงเฉพาะ `planprom-out-7.log` ไม่ใช่ `/root/.pm2/logs/planprom-out-7.log`

```ts
// ✅ ถูก
pm2OutPath: pm2OutPath.split('/').pop() ?? '(ไม่พบ)'

// ❌ ผิด
pm2OutPath: pm2OutPath  // เปิดเผย /root/.pm2/logs/...
```

### 23.4 Command Injection Prevention

ทุกครั้งที่รัน shell command ใน Node.js ต้องใช้ `spawnSync` พร้อม array args — ไม่ผ่าน shell:

```ts
// ✅ ถูก — array args ไม่ผ่าน shell
import { spawnSync } from 'child_process'
const r = spawnSync('tail', ['-n', String(n), path], { encoding: 'utf8', timeout: 5000 })

// ❌ ผิด — string ผ่าน shell อาจ inject ได้
import { execSync } from 'child_process'
execSync(`tail -n ${n} "${path}"`)
```

สำหรับ glob expansion ที่ต้องผ่าน shell (เช่น `ls -t *.log`) ให้ใช้ `spawnSync('sh', ['-c', cmd])` โดย cmd ต้องเป็น hardcoded string เท่านั้น ห้ามใส่ตัวแปรจาก user input.

### 23.5 Pre-Launch Security Audit — ผลการ Scan (2026-05-15 · Session 72-75)

> ทำ full scan ก่อน go-live ครอบคลุม code · UI · infra — **Security Score: ~80/100**

| ID | ระดับ | ช่องโหว่ | สถานะ |
|---|---|---|---|
| **C-001** | Critical | Login response ส่ง `role` กลับ client → ข้อมูลรั่ว | ✅ Fixed — ลบ `role` ออกจาก JSON |
| **C-002** | Critical | Logout cookie ขาด `httpOnly`, `secure`, `sameSite` → ถูก steal ได้ | ✅ Fixed — เพิ่ม security flags ครบ |
| **H-001** | High | `/admin/report/export` page ไม่มี auth guard → ใครก็เข้าได้ | ✅ Fixed — เพิ่ม `requireAdminSession` |
| **H-003** | High | Cart webhook race — token generate ซ้ำซ้อน | ✅ Already fixed — `AND download_token IS NULL` |
| **H-004** | High | Webhook signature fail-open (empty secret → accept all) | ✅ Fixed — fail-closed ถ้า `OMISE_WEBHOOK_SECRET` ไม่ตั้งค่า |
| **H-002** | High | Download token plain-text ใน URL → brute-force/leak ได้ | 🔵 Partial — เพิ่ม `Referrer-Policy: no-referrer` header · bcrypt hash = post-launch |
| **M-001** | Medium | Admin JWT expiry 8h → session window ใหญ่เกิน | ✅ Fixed — ลดเหลือ **2h** |
| **M-002** | Medium | Webhook ไม่ re-validate promo code ตอน payment confirm | ✅ Fixed — query + `console.warn` ถ้า revoked |
| **M-003** | Medium | `tailLines()` silent fail → log error ไม่แสดงใน UI | ✅ Fixed — return `[LOG_READ_ERROR]` marker |

#### Files ที่แก้ไข

| File | การเปลี่ยนแปลง |
|---|---|
| `app/api/admin/auth/login/route.ts` | ลบ `role` ออกจาก JSON response (C-001) |
| `app/api/admin/auth/logout/route.ts` | เพิ่ม `httpOnly`, `secure`, `sameSite` บน cookie (C-002) |
| `app/admin/report/export/page.tsx` | เพิ่ม `requireAdminSession('/admin/login')` (H-001) |
| `app/api/webhooks/omise/route.ts` | Signature fail-closed + promo re-validate + `console.warn` (H-004, M-002) |
| `app/api/download/[token]/route.ts` | เพิ่ม `Referrer-Policy: no-referrer` header (H-002 partial) |
| `components/CookieConsent.tsx` | NEW — PDPA cookie consent banner (localStorage, ปิดครั้งเดียวถาวร) |
| `app/layout.tsx` | เพิ่ม `<CookieConsent />` |
| `app/privacy/page.tsx` | เพิ่ม Omise/OPN processor disclosure + data retention 5yr |
| `app/terms/page.tsx` | ระบุ Omise PromptPay QR + ข้อยกเว้น refund "ไฟล์เสียหาย ≤ 7 วัน" |
| `src/lib/admin-rbac.ts` | `EXPIRES_IN` 8h → **2h** (M-001) |
| `app/admin/report/log/page.tsx` | `tailLines()` error → `['[LOG_READ_ERROR — ตรวจสอบ permission หรือ path]']` (M-003) |

#### ที่เหลือ (post-launch)
- **H-002 full** — hash download tokens ด้วย bcrypt + DB migration (ไม่กระทบ UX แต่ต้อง migration)
- **Cloudflare Full (Strict)** — สลับจาก Full แล้ว · ใช้ Let's Encrypt cert · ไม่มี code impact

---

### 23.6 Pre-deploy Checklist

ก่อน deploy feature ใหม่ที่แตะ admin หรือข้อมูล user:

- [ ] Role check ถูกระดับ (`requireAdminRole` vs `requireAdminSession`)
- [ ] มีข้อมูล PII (IP, email, phone) ใน response ไหม → mask ก่อน
- [ ] มี absolute path หรือ secret ใน UI ไหม → ใช้ basename
- [ ] มี `execSync` พร้อม string interpolation ไหม → เปลี่ยนเป็น `spawnSync` array
- [ ] Export/Copy feature ส่งข้อมูลอะไรออกไปบ้าง → document ใน UI
