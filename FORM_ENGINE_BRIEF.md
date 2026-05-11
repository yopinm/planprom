# Form Engine — Implementation Brief

> **Audience:** Claude Code
> **Goal:** เพิ่ม Engine ตัวที่ 3 ของ planprom (Form) — ต่อจาก Checklist + Planner
> **Status:** Analysis complete · ยังไม่มี implementation · รอ scope gate confirm
> **Reference mockups (root folder):**
> - `planner-engine-v2-mockup.html` — Planner v2 redesign (อ้างอิง schema pattern)
> - `planner-korea-6month-template.html` — Generic template example
> - `engine-form-mockup.html` — Form Engine full spec (8 หน้า · output + admin UI + schema)

---

## 1. Decision: ไม่ทำ Wizard แยก · รวมใน wizard เดิม

ใช้ wizard เดิมที่ `/admin/templates/new` (6 steps) + เพิ่ม Form เป็น engine option ที่ 3

| มิติ | แยก wizard | **รวมใน wizard เดิม** ✅ |
|---|---|---|
| Admin learning | ต้องเรียน 2 ตัว | ครั้งเดียวใช้ทุก engine |
| Code reuse | duplicate 5 steps | reuse 5/6 steps ทันที |
| URL pattern | 2 routes | `/admin/templates/new` เดียว |
| DB | 2 ตาราง | `templates` + `engine_type='form'` |
| Dev effort | 2× | ~30% เพิ่มจาก Planner Engine |
| Maintenance | 2 ที่ | 1 ที่ |

---

## 2. การเปลี่ยนแปลง 4 จุด

### 🔵 จุดที่ 1: Step 1 "MODE" — เพิ่ม option ที่ 6

**File:** `app/admin/templates/new/WizardClient.tsx` (Mode step)

```
ปัจจุบัน (5 options):              เพิ่ม (6 options):
  ✅ Engine: Checklist             ✅ Engine: Checklist
  📅 Engine: Planner               📅 Engine: Planner
  📝 สร้างจาก .docx                📋 Engine: Form  ← ใหม่
  ⬆️ Upload PDF                   📝 สร้างจาก .docx
  ✏️ Clone                        ⬆️ Upload PDF
                                  ✏️ Clone
```

**Label option ใหม่:**
- หัว: "Engine: Form"
- คำอธิบาย: "กรอกข้อมูล Section + Field → ระบบสร้าง PDF ฟอร์มมาตรฐานอัตโนมัติ"
- Icon: 📋

**Effort:** 1 ชม.

---

### 🔵 จุดที่ 2: Step 2 "CATALOG" — เพิ่ม form categories

**File:** เพิ่ม categories ใน catalog config

```
เพิ่ม 3 หมวดใหม่ (เก็บ 7 หมวดเดิม):
  🆕 เอกสาร HR        — ใบลา · ใบสมัครงาน · ใบประเมิน · ใบรับรองรายได้
  🆕 เอกสารธุรกิจ      — ใบเสนอราคา · ใบสั่งซื้อ · ใบเสร็จ · ใบส่งของ · ใบกำกับภาษี
  🆕 เอกสารราชการ/สัญญา — มอบฉันทะ · ยินยอม · รับรอง · คำร้อง · สัญญาเช่า
```

**Alternative:** ทำ filter 2 ระดับ — ระดับ 1 (Planner/Checklist/Form) → ระดับ 2 (หมวดย่อย)

**Effort:** 2 ชม.

---

### 🔵 จุดที่ 3: Step 3 "CONTENT" — สร้าง FormEngineForm component ใหม่ (หนักสุด)

**File ใหม่:** `app/admin/templates/new/FormEngineForm.tsx`

```typescript
// branch ใน WizardClient.tsx step Content:
if (engine_type === 'checklist') return <ChecklistEngineForm ... />
if (engine_type === 'planner')   return <PlannerEngineForm ... />
if (engine_type === 'form')      return <FormEngineForm ... />  // ← ใหม่
```

#### FormEngineForm UI Requirements

**Layout:** Split-pane
- ซ้าย 50%: Section Builder (scrollable)
- ขวา 50%: Live Preview (sticky, real-time HTML render — ไม่ใช่ iframe PDF)

**Components ภายใน:**

1. **Header config** — meta fields (formTitle, formCategory, pageSize, orientation, colorTheme, yearMode)
2. **Subject config** — เรียน/เรื่อง defaults
3. **Section Builder** (หัวใจของ component นี้):
   - Section list (drag-drop reorder · @dnd-kit แนะนำ)
   - แต่ละ section: collapsible card + edit/delete buttons
   - Quick-add button คั่นระหว่าง section ("+ เพิ่มตรงนี้")
   - 7 section types: identity · fields · choices · table · paragraph · signature · attachment-list · divider
4. **Field Configurator** (ภายในแต่ละ section):
   - 20 field types (ดู FormField type ใน schema ด้านล่าง)
   - Inline editor (expand-in-place ไม่ใช้ modal)
   - Required toggle · Helper text · Default value
5. **Preset Library** (button ขวาบน):
   - 10 presets: ใบลา · ใบสมัครงาน · ใบเสนอราคา · ใบสั่งซื้อ · ใบเสร็จ · ใบมอบฉันทะ · ใบรับรอง · ใบยินยอม · ใบเบิกของ · ใบแจ้งหนี้
   - คลิก preset → load sections เข้า builder → admin ปรับเฉพาะที่จำเป็น
6. **Signature Block config** — 1-4 signers · roles · approval Y/N
7. **Footer config** — formCode (auto) · pageNumber · brand
8. **Validation guard** — warn ถ้าไม่มี signature/subject/sections

**Effort:** 3-4 วัน (หนักที่สุด)

---

### 🔵 จุดที่ 4: Step 4 "TAGS" — เพิ่ม form-specific tags

```
เพิ่ม tags: formal · official · hr · business · government · contract · invoice · receipt · application
```

**Effort:** 1 ชม.

**Step 5 (REVIEW) + Step 6 (PUBLISH):** ไม่ต้องเปลี่ยน

---

## 3. Schema (TypeScript types)

**File:** `lib/engine-types.ts` (เพิ่มใน file เดิม)

```typescript
export type FormEngineData = {
  meta: {
    schemaVersion: '1.0'
    formCode: string                      // 'FORM-LEAVE-V1.0'
    formTitle: { th: string, en?: string }
    formCategory: 'HR' | 'Business' | 'Personal' | 'Government' | 'Contract'
    pageSize: 'A4' | 'A5' | 'Letter'
    orientation: 'portrait' | 'landscape'
    colorTheme: 'blue' | 'navy' | 'green' | 'purple'
    yearMode: 'buddhist' | 'gregorian'    // default 'buddhist'
    extras?: Record<string, unknown>      // escape hatch
  }
  header: {
    showLogo: boolean
    orgName?: string                      // "บริษัท __ จำกัด" (default placeholder)
    deptName?: string
    docNumber?: { label: string, placeholder?: string }  // "ที่ ____"
    issueDate: boolean
  }
  subject?: {
    toLabel?: string                      // default "เรียน"
    toDefault?: string                    // "ผู้จัดการฝ่ายบุคคล"
    subjectLabel?: string                 // default "เรื่อง"
    subjectDefault?: string               // "ขออนุญาตลา"
  }
  sections: FormSection[]                 // 1-N
  closing?: { text: string, style: 'normal' | 'italic' }
  signatures: FormSignatureBlock
  footer: {
    showFormCode: boolean
    showPageNumber: boolean
    showBrand: boolean                    // "planprom.com"
    customText?: string
  }
}

export type FormSection =
  | { type: 'identity', title?: string, preset: 'employee'|'customer'|'student'|'custom', fields?: FormField[] }
  | { type: 'fields', title?: string, cols: 1|2|3|4, fields: FormField[] }
  | { type: 'choices', title?: string, mode: 'single'|'multi'|'yes-no', options: string[], includeOther?: boolean }
  | { type: 'table', title?: string, columns: TableColumn[], rowCount: number, calc?: TableCalc }
  | { type: 'paragraph', text: string, style?: 'normal'|'italic'|'bold' }
  | { type: 'attachment-list', title?: string, items: string[], includeOther?: boolean }
  | { type: 'divider', label?: string }

export type FormField = {
  lbl: string
  type: 'text' | 'textarea' | 'number' | 'money' | 'date-be' | 'date-greg'
      | 'time' | 'phone' | 'email' | 'idcard' | 'address-th' | 'license-th'
      | 'radio' | 'checkbox' | 'select' | 'yes-no' | 'currency-rate' | 'static-text'
  required?: boolean
  options?: string[]                      // for radio/checkbox/select
  placeholder?: string
  helper?: string                         // hint text under field
  defaultValue?: string
  colSpan?: 1|2|3|4                       // grid span
}

export type TableColumn = {
  header: string
  type: 'text' | 'number' | 'money' | 'date-be'
  align: 'left' | 'right' | 'center'
  width?: string                          // CSS width: '60px' | '20%'
}

export type TableCalc = {
  subtotal?: boolean                      // auto sum
  vat?: number                            // 7 = VAT 7%
  total?: boolean                         // auto total after VAT
  amountInWords?: boolean                 // "หนึ่งพันบาทถ้วน"
}

export type FormSignatureBlock = {
  cols: 1|2|3|4
  signers: {
    roleTag: string                       // "ผู้ยื่น", "หัวหน้างาน", "HR"
    positionLabel?: string                // "ผู้จัดการฝ่ายบุคคล"
    includeApproval?: boolean             // อนุมัติ/ไม่อนุมัติ checkbox
    includeDate?: boolean
  }[]
}
```

---

## 4. Field Types — 20 ตัว (ครอบฟอร์มไทย 95%+)

| Type | Use case | Thai-specific |
|---|---|---|
| `text` | ชื่อ · หัวข้อ | — |
| `textarea` | เหตุผล · รายละเอียด | — |
| `number` | จำนวน · อายุ · วัน | — |
| `money` | ราคา · เงินเดือน | ✅ comma + ตัวอักษรไทย ("หนึ่งพันบาทถ้วน") |
| `date-be` | วันที่ | ✅ พ.ศ. (Buddhist year) default |
| `date-greg` | วันที่ต่างประเทศ | — |
| `time` | เวลา | — |
| `phone` | เบอร์โทร | ✅ 0XX-XXX-XXXX format |
| `email` | อีเมล | — |
| `idcard` | บัตรประชาชน | ✅ 13 หลัก 1-2345-67890-12-3 |
| `address-th` | ที่อยู่ไทย | ✅ multi-field (เลขที่/หมู่/ซอย/ตำบล/อำเภอ/จังหวัด/รหัส) |
| `license-th` | ทะเบียนรถ | ✅ ตัวอักษร+เลข+จังหวัด |
| `radio` | เลือก 1 | — |
| `checkbox` | เลือกหลาย | — |
| `select` | dropdown | — |
| `yes-no` | ใช่/ไม่ | — |
| `currency-rate` | อัตราแลกเปลี่ยน | — |
| `static-text` | ข้อความคงที่ | — |

---

## 5. Section Types — 7 patterns

| Type | Use case | JSON shape |
|---|---|---|
| `identity` | ข้อมูลผู้กรอก (ทุกฟอร์ม) | `{ preset, fields? }` |
| `fields` | ฟิลด์อิสระ grid 1-4 cols | `{ cols, fields[] }` |
| `choices` | radio/checkbox/yes-no | `{ mode, options[], includeOther? }` |
| `table` | รายการสินค้า · ตาราง | `{ columns[], rowCount, calc? }` |
| `paragraph` | "จึงเรียนมาเพื่อ..." | `{ text, style? }` |
| `attachment-list` | เอกสารแนบ | `{ items[], includeOther? }` |
| `divider` | เส้นแบ่ง | `{ label? }` |

---

## 6. Files ที่ต้องสร้าง/แก้

### ใหม่
- `lib/engine-form.ts` — Generator HTML → PDF (~600 บรรทัด · pattern เดียวกับ `engine-planner.ts`)
- `app/admin/templates/new/FormEngineForm.tsx` — Admin section builder (~800-1000 บรรทัด)
- `app/api/admin/templates/generate-form/route.ts` — API endpoint (pattern จาก `generate-planner`)
- `migrations/20260512_form_engine.sql` — เพิ่ม `'form'` ใน engine_type enum constraint
- `lib/form-presets.ts` — 10 preset templates (data file)
- `lib/engine-form.test.ts` — unit tests

### แก้
- `lib/engine-types.ts` — เพิ่ม `FormEngineData` + sub-types
- `app/admin/templates/new/WizardClient.tsx` — เพิ่ม Mode option 6 + branch ใน Content step
- `app/admin/templates/actions.ts` — handle engine_type='form'
- `app/templates/[slug]/page.tsx` — render Form preview
- `core/planprom.md` — บันทึก task FORM-1 ถึง FORM-7

---

## 7. Implementation Roadmap (8-10 วัน)

| Phase | Task | Effort | File output |
|---|---|---|---|
| 1 | Schema + Migration | 0.5 วัน | `engine-types.ts` + migration |
| 2 | Generator (PDF) | 2-3 วัน | `lib/engine-form.ts` + tests |
| 3 | Admin Wizard | 2 วัน | `FormEngineForm.tsx` |
| 4 | Section Builder + Drag-drop | 1-2 วัน | (ภายใน FormEngineForm) |
| 5 | Preset Library | 1 วัน | `lib/form-presets.ts` (10 templates) |
| 6 | Public preview + catalog | 1 วัน | `app/templates/[slug]/page.tsx` |
| 7 | UAT + Polish | 1 วัน | tests + smoke test on VPS |

**รวม:** 8-10 วัน

---

## 8. UI Patterns (สำคัญ — ห้ามพลาด)

| Pattern | Implementation note |
|---|---|
| Split-pane builder + preview | `position: sticky` ขวา · scroll ซ้ายอย่างเดียว |
| Real-time preview | debounce 300ms · HTML render (ไม่ใช่ PDF iframe) |
| Drag-drop reorder | `@dnd-kit` แนะนำ (modern · accessible) |
| Section card collapsible | useState({ [id]: boolean }) + animation |
| Field inline editor | expand-in-place ไม่ใช้ modal |
| Quick-add between sections | hover-reveal "+" button |
| Preset library | modal dialog · grid 5×2 ของ 10 presets |
| Auto-save draft | localStorage `form-draft-${tempId}` · เผื่อ admin reload |
| Validation before publish | warn dialog: ไม่มี signature / ไม่มี section / ฟิลด์ว่าง |

---

## 9. Thai-specific Design Notes

1. **Font:** Sarabun 11pt body · 16pt heading · line-height 1.7 (ตามมาตรฐาน)
2. **Color:** หลัก `#1e40af` (navy/blue) · contrast สูง (เผื่อ photocopy)
3. **วันที่:** พ.ศ. default · format `__/__/____`
4. **เลขบัตรประชาชน:** 13 หลัก แบ่ง 5 cell (1-4-5-2-1)
5. **ที่อยู่:** ตามมาตรฐาน "เลขที่ __ หมู่ __ ซอย __ ถนน __ ตำบล __ อำเภอ __ จังหวัด __ รหัสไปรษณีย์ __"
6. **เงิน:** `1,234.00 บาท` + บรรทัดล่างเป็น "หนึ่งพันสองร้อยสามสิบสี่บาทถ้วน"
7. **ลงนาม:** เส้น dotted ≥120px · "(ลงชื่อ ___)" ใต้เส้น · ตำแหน่งใต้ชื่อ
8. **Margin:** top/bottom 25mm · left 30mm (เผื่อเย็บ) · right 20mm
9. **คำลงท้าย:** "จึงเรียนมาเพื่อโปรดพิจารณา..." (configurable)
10. **3-ฝ่ายลงนาม:** ผู้ยื่น · หัวหน้างาน · HR (default สำหรับ HR forms)

---

## 10. Risk + ข้อระวัง

1. **Legal compliance** — ใบกำกับภาษี/ใบเสร็จต้องตรง spec กรมสรรพากร · ตรวจ before publish
2. **Trademark** — ห้ามใส่ตราครุฑ/โรงเรียน/หน่วยงานใน preset
3. **Template = "blank skeleton"** — ไม่ใช่ "completed form" · admin อาจคิดต้องกรอกหมด
4. **Print quality** — ส่งหน่วยงานราชการ → ต้อง print A4 พิมพ์ชัด · scan ได้
5. **Buddhist year default** — toggle ได้สำหรับ international forms

---

## 11. Acceptance Criteria (Definition of Done)

- [ ] L0: TypeScript build pass · lint pass · tests pass
- [ ] L1: Admin สร้าง form template ใหม่ได้ครบ 6 steps
- [ ] L1: ลูกค้าซื้อแล้วโหลด PDF ได้ · เปิดดูได้ · พิมพ์ได้
- [ ] L1: PDF render Thai font ครบ (Sarabun + vowel marks)
- [ ] L1: 10 presets load ได้ · admin clone + ปรับได้
- [ ] L2: ใบลา + ใบเสนอราคา + ใบมอบฉันทะ (3 forms) — owner ทดสอบ scenario เต็ม
- [ ] L3: Deploy VPS · health check 200 · revenue channel preserved
- [ ] Validation guard ตามที่กำหนด — block save ถ้าไม่ครบ

---

## 12. SCOPE GATE (ตาม CLAUDE.md workflow)

> ก่อน implement ต้อง:
> 1. ✅ Read PRD.md
> 2. ✅ Read core/planprom.md
> 3. ✅ Read core/Couponkum_Blueprint.md เฉพาะส่วน A9 (Engine) + A2 (DB)
> 4. ⏳ **เขียน scope + flow + frozen files ใน core/planprom.md ก่อน implement**
> 5. ⏳ Commit docs only (ไม่มี code)
> 6. ⏳ **รอ owner confirm**
> 7. ⏳ เริ่ม implement

---

## 13. Quick Reference — File ที่เกี่ยวข้องในโปรเจกต์

- `lib/engine-types.ts` — engine type definitions (เพิ่ม FormEngineData)
- `lib/engine-checklist.ts` · `lib/engine-planner.ts` — reference สำหรับ generator pattern
- `app/admin/templates/new/WizardClient.tsx` — main wizard frame
- `app/admin/templates/new/ChecklistEngineForm.tsx` · `PlannerEngineForm.tsx` — reference UI pattern
- `app/api/admin/templates/generate-engine/route.ts` · `generate-planner/route.ts` — reference API pattern
- `migrations/20260509_engine_columns.sql` — มี engine_type column อยู่แล้ว · เพิ่มแค่ enum value

---

**Brief generated:** 2026-05-11
**Source mockups:** `engine-form-mockup.html` (8 หน้า full spec)
**Next action for Claude Code:** อ่าน CLAUDE.md → planprom.md → เขียน scope gate ใน planprom.md → wait for owner confirm → implement Phase 1 (Schema + Migration)
