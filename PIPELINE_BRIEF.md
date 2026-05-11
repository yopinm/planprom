# Planner Pipeline — Implementation Brief (v3.0)

> **Audience:** Claude Code
> **Goal:** เปลี่ยน Planner Engine จาก **"5 Axes กรอกแยกกัน"** เป็น **"3 ขั้น Pipeline บังคับ logic flow"**
> **Status:** Architecture redesign — แทนของเดิม (ไม่ทำ hybrid)
> **Mockup:** `planner-pipeline-mockup.html` (root folder)
>
> **กฎหลัก:** คนไทย ต้องคิดง่าย · เห็น PDF เข้าใจทันที · ทำตามได้

---

## 1. ปัญหาของ Architecture เดิม

จาก `lib/engine-types.ts` + `app/admin/templates/new/PlannerEngineForm.tsx`:

```
ปัจจุบัน (V2 — 5 Axes parallel):
  meta · axis1 · axis2 · axis3 · axis4 · axis5
  ↓
  ทุก axis อิสระจากกัน
  ↓
  Admin กรอกแต่ละกล่องโดยไม่เห็นกล่องอื่น
  ↓
  PDF ตื้นเขิน (รี case ทำนา: Q1=Q2=Q3=Q4 เป็นแค่ label)
```

**Root cause:** treat planning as "fill 5 boxes" not "go through 3 stages"

---

## 2. Pipeline ใหม่ — 3 ขั้น (PDCA-inspired · ภาษาไทยง่าย)

```
🎯 ตั้งเป้า  →  📋 ลงมือทำ  →  ✅ ติดตาม
   STAGE 1          STAGE 2         STAGE 3
   "อยากได้อะไร"   "ทำอะไร เมื่อไหร่"  "เช็คยังไง"
```

ลำดับบังคับ — ทำ Stage 1 ครบก่อน → Stage 2 → Stage 3

### Stage 1: 🎯 ตั้งเป้า (Goal)

**คำถามหลัก:** "อยากได้อะไร · เมื่อไหร่ · ทำไม"

| Field | คำอธิบาย | Example |
|---|---|---|
| `bigGoal` | เป้าหมายใหญ่ 1 ข้อ — ชัด วัดได้ | "เก็บเงิน 100,000 บาท ภายในสิ้นปี" |
| `deadline` | กำหนดเสร็จ (date หรือ duration) | "31/12/2026" หรือ "6 เดือน" |
| `why` | ทำไมถึงสำคัญ | "ซื้อบ้านของตัวเอง" |
| `successCriteria[]` | รู้ว่าสำเร็จเมื่อ... | ["ยอดเงินในบัญชี ≥ 100,000", "ไม่ติดหนี้เพิ่ม"] |
| `constraints.budget?` | งบจำกัด | 100,000 |
| `constraints.timeLimit?` | เวลาจำกัด | "6 เดือน" |
| `constraints.others[]` | อื่นๆ | ["ทำคนเดียว", "ไม่กระทบงานหลัก"] |

### Stage 2: 📋 ลงมือทำ (Plan)

**คำถามหลัก:** "แบ่งเป็นช่วง · ทำอะไร · ใช้อะไร"

| Field | คำอธิบาย | Example |
|---|---|---|
| `phases[]` | 2-6 ช่วง (ลำดับเวลา) | ["เตรียม", "เริ่มทำ", "เร่งสปีด", "ปิดงาน"] |
| `phases[].name` | ชื่อช่วง | "เริ่มทำ" |
| `phases[].timeRange` | ช่วงเวลา | "เดือน 1-2" |
| `phases[].tasks[]` | สิ่งที่ต้องทำในช่วงนี้ | ["เปิดบัญชี", "ตั้ง auto-save"] |
| `phases[].budget?` | งบของช่วง | 5,000 |
| `phases[].resources[]?` | สิ่งที่ใช้ | ["บัญชี SCB", "Excel sheet"] |
| `bigRocks[]` | งานสำคัญที่สุด 3-5 ข้อ + deadline | [{ task: "เปิดบัญชี", deadline: "15/1" }] |

### Stage 3: ✅ ติดตาม (Track)

**คำถามหลัก:** "เช็คยังไง · เมื่อไหร่ · ปรับยังไง"

| Field | คำอธิบาย | Example |
|---|---|---|
| `habits[]` | นิสัยรายวัน (1-5 อย่าง) | ["บันทึกรายจ่ายทุกวัน", "ออม 350/วัน"] |
| `metrics[]` | สิ่งที่วัดได้ | [{name: "ยอดออม", target: "100k", freq: "weekly"}] |
| `reviewCycle` | รอบทบทวน | "weekly" |
| `reviewQuestions[]` | คำถามทบทวน | ["สัปดาห์นี้ทำได้ตามแผนไหม?", "ต้องปรับอะไร?"] |
| `adjustmentRules[]?` | ถ้าไม่เป็นตามแผน | ["ถ้าออมขาด 2 สัปดาห์ → ลดค่าใช้จ่ายฟุ่มเฟือย"] |

### Optional: 📝 บันทึก (Notes — เก็บไว้สำหรับเพิ่ม)

| Field | คำอธิบาย |
|---|---|
| `diaryDays` | จำนวนวันบันทึกประจำวัน (0-31) |
| `notesPages` | จำนวนหน้าจดอิสระ |
| `notesStyle` | `'lined' \| 'dotgrid' \| 'blank'` |

---

## 3. Schema ใหม่ (TypeScript)

**ไฟล์:** `lib/engine-types.ts` — เพิ่ม v3 type · เก็บ v1, v2 ไว้ backward compat

```typescript
// ── Planner Engine v3 (Pipeline mode) ──────────────────────────────────────

export type PlannerPipelineData = {
  meta: {
    schemaVersion: '3.0'
    mode: 'pipeline'                              // discriminator
    title: string                                 // ชื่อแผน
    description: string                           // คำอธิบาย (แสดงในร้าน)
    colorTheme: 'violet' | 'rose' | 'emerald' | 'amber' | 'sky'
    coverPage: boolean
    howToUse: boolean
  }

  stage1_goal: {
    bigGoal: string                               // เป้าหมายใหญ่ 1 ข้อ
    deadline: string                              // "31/12/2026" หรือ "6 เดือน"
    why: string                                   // ทำไมถึงสำคัญ
    successCriteria: string[]                     // เกณฑ์ความสำเร็จ
    constraints: {
      budget?: number
      timeLimit?: string
      others?: string[]
    }
  }

  stage2_plan: {
    phases: PipelinePhase[]                       // 2-6 ช่วง (sequential)
    bigRocks: PipelineBigRock[]                   // 3-5 งานสำคัญ + deadline
  }

  stage3_track: {
    habits: string[]                              // 1-5 habit รายวัน
    metrics: PipelineMetric[]                     // ตัววัด
    reviewCycle: 'daily' | 'weekly' | 'monthly'
    reviewQuestions: string[]
    adjustmentRules?: string[]                    // pivot triggers
  }

  notes?: {                                       // optional
    diaryDays: number                             // 0-31
    notesPages: number                            // 0-10
    notesStyle: 'lined' | 'dotgrid' | 'blank'
  }

  extras?: Record<string, unknown>                // escape hatch
}

export type PipelinePhase = {
  name: string                                    // "เริ่มทำ"
  timeRange: string                               // "เดือน 1-2"
  tasks: string[]                                 // งานในช่วงนี้
  budget?: number
  resources?: string[]
}

export type PipelineBigRock = {
  task: string                                    // งาน
  deadline: string                                // "15/1/2026"
}

export type PipelineMetric = {
  name: string                                    // "ยอดออม"
  target: string                                  // "100,000 บาท"
  unit?: string                                   // "บาท"
  frequency: 'daily' | 'weekly' | 'monthly'
}
```

---

## 4. UI/UX — Wizard 3 Stages (1 stage = 1 หน้า)

### Pattern: Sequential — บังคับลำดับ

```
[Stage 1: ตั้งเป้า] → [Stage 2: ลงมือทำ] → [Stage 3: ติดตาม] → [Preview & Save]
   ✏️ active          ⏸ locked            ⏸ locked

ปุ่ม "ถัดไป" disabled ถ้า required fields ยังไม่ครบ
```

### Layout: Split-pane ในทุก stage

```
┌──────────────────────────────────────┬──────────────────────┐
│ ซ้าย: Form ของ stage ปัจจุบัน         │ ขวา: Summary Panel    │
│                                       │                       │
│  [stage 1 / 2 / 3] [progress bar]   │ 🎯 เป้าหมาย:           │
│                                       │  (from Stage 1)       │
│  ----- fields ของ stage นี้ -----     │                       │
│                                       │ 📋 แผน:               │
│  ตัวอย่าง: เป้าหมาย "_______"        │  (from Stage 2)       │
│           กำหนดเสร็จ "_______"        │                       │
│           ทำไมสำคัญ "_______"        │ ✅ ติดตาม:             │
│                                       │  (from Stage 3)       │
│                                       │                       │
│  [← ย้อนกลับ]    [ถัดไป →]           │                       │
└──────────────────────────────────────┴──────────────────────┘
```

**Summary panel ขวา (sticky)** — admin เห็น output ของ stages ก่อนหน้า ตลอดเวลา → บังคับ logic consistency

### Per-stage UI Details

#### Stage 1: 🎯 ตั้งเป้า
- Hero text: "เริ่มต้นจากตรงนี้ — เป้าหมายชัด แผนถึงจะดี"
- Big text input สำหรับ `bigGoal` (font 16pt — ดูเด่น)
- Date picker / duration toggle สำหรับ `deadline`
- Textarea สำหรับ `why`
- Dynamic list สำหรับ `successCriteria` (เริ่มที่ 2 ช่อง)
- Collapsible "ข้อจำกัด" section (budget, timeLimit, others)

#### Stage 2: 📋 ลงมือทำ
- **Summary panel:** ขวาแสดงเป้าหมาย + deadline จาก Stage 1
- **Phases builder:** เริ่มที่ 2 phases (เพิ่ม-ลด-reorder ได้)
- แต่ละ phase: name, timeRange, tasks (DynList), budget (optional)
- **Big Rocks:** dynamic list of `{task, deadline}` (เริ่ม 3 ช่อง)
- คำใบ้: "งานสำคัญที่สุดที่ถ้าทำไม่ได้ — แผนพัง"

#### Stage 3: ✅ ติดตาม
- **Summary panel:** ขวาแสดง phases + big rocks จาก Stage 2
- Habits (1-5 ช่อง · suggest พื้นฐาน)
- Metrics builder (`{name, target, frequency}`)
- Review cycle radio: ทุกวัน / สัปดาห์ / เดือน
- Review questions (default 2 คำถามไทย)
- Adjustment rules (optional · "ถ้า... → ปรับ...")

### Final Step: Preview

แสดง PDF preview เต็มหน้า + ปุ่ม "บันทึก & เผยแพร่"

---

## 5. PDF Output Structure (ผลลัพธ์)

ตาม mockup ใน `planner-pipeline-mockup.html` — PDF สะท้อน 3 stage ตรงๆ:

```
หน้า 1: COVER
  ชื่อแผน · เป้าหมายหลัก · กำหนดเสร็จ

หน้า 2: 🎯 ตั้งเป้า
  - เป้าหมายใหญ่ (highlight)
  - ทำไมสำคัญ (motivation)
  - รู้ว่าสำเร็จเมื่อ (checklist)
  - ข้อจำกัด

หน้า 3-4: 📋 ลงมือทำ
  - Timeline visual (4 phase blocks)
  - แต่ละ phase: tasks + budget + resources
  - Big Rocks (highlighted with deadline)

หน้า 5: ✅ ติดตาม
  - Habit tracker (31 cell grid)
  - Metrics table
  - Review questions (พร้อมเส้นเขียน)
  - Adjustment rules

หน้า 6: บันทึก (optional)
  - Diary days
  - Free notes
```

**Key principle:** PDF order = pipeline order → user เปิดอ่านแบบ left-to-right · บนลงล่าง · ทำตามทันที

---

## 6. Files ที่ต้องสร้าง/แก้

### ใหม่
- `lib/engine-planner-pipeline.ts` — Generator HTML → PDF (pattern จาก `engine-planner.ts`)
- `app/admin/templates/new/PipelinePlannerForm.tsx` — 3-stage wizard form (~600-800 บรรทัด)
- `app/api/admin/templates/generate-planner-pipeline/route.ts` — API endpoint
- `migrations/20260513_planner_pipeline.sql` — เพิ่ม schema_version='3.0' ใน engine_data

### แก้
- `lib/engine-types.ts` — เพิ่ม `PlannerPipelineData` + sub-types
- `app/admin/templates/new/WizardClient.tsx` — branch Content step: engine-planner → ใช้ PipelinePlannerForm (แทนของเดิม)
- `app/templates/[slug]/page.tsx` — render Pipeline preview
- `core/planprom.md` — บันทึก task PIPELINE-1 ถึง PIPELINE-5

### Deprecate (ไม่ลบทันที — ปล่อย sunset 30 วัน)
- `app/admin/templates/new/PlannerEngineForm.tsx` (V2 5-axes) — เก็บไว้ admin เก่ายังใช้ได้ · ทำให้ default = pipeline
- `lib/engine-planner.ts` (V2 generator) — ใช้สำหรับ render template เก่าที่อยู่ใน DB

---

## 7. Implementation Roadmap (5-7 วัน)

| Phase | Task | Effort | Output |
|---|---|---|---|
| 1 | Schema + types | 0.5 วัน | `engine-types.ts` v3 |
| 2 | Migration | 0.5 วัน | SQL + populate default mode='pipeline' |
| 3 | Generator (PDF) | 2 วัน | `engine-planner-pipeline.ts` + tests |
| 4 | Admin Wizard 3 stages | 2 วัน | `PipelinePlannerForm.tsx` |
| 5 | Summary panel (sticky) | 0.5 วัน | UX แสดง cross-stage |
| 6 | UAT + 3 preset templates | 1 วัน | ตัวอย่าง: เก็บเงิน, ลดน้ำหนัก, เปิดร้าน |

**รวม:** 5-7 วัน

---

## 8. UI Patterns — สำคัญ (Thai UX)

| Pattern | Implementation |
|---|---|
| **Sequential stages** | "ถัดไป" disabled ถ้า required ยังไม่ครบ · มี progress bar 1/3 → 3/3 |
| **Summary panel ขวา** | sticky · scroll-following · แสดง output stages ที่ทำแล้ว |
| **บังคับใส่ context ก่อน** | ห้ามข้าม Stage 1 · ห้ามไป Stage 2 ถ้า bigGoal ว่าง |
| **Hint inline** | ใต้ field มี example placeholder + tip ภาษาไทย |
| **Preset library** | ขวาบน · 5-10 templates (เก็บเงิน · เที่ยว · ลดน้ำหนัก · เปิดธุรกิจ · เรียน) |
| **Real-time preview** | thumbnail PDF อัพเดททุก 500ms · debounced |
| **Validation guard** | warn ถ้า field ซ้ำกับ placeholder ("เพิ่ม...", "ทดสอบ") |

---

## 9. ภาษาไทย — ใช้คำที่คนทั่วไปเข้าใจ

| ❌ ห้ามใช้ (jargon) | ✅ ใช้แทน (natural Thai) |
|---|---|
| Stage / Pipeline | ขั้นตอน / ขั้นที่ |
| Framework | (ไม่ใช้คำนี้เลย) |
| Axis / Pillar | (เลิกใช้ — ใช้ ขั้นที่ 1/2/3) |
| Goal-setting | ตั้งเป้าหมาย |
| Milestone | หมุดหมาย / งานสำคัญ |
| KPI / OKR | (อธิบายเป็นคำถาม "วัดยังไง") |
| Iterate / Pivot | ปรับแผน |
| Constraint | ข้อจำกัด |
| Big Rocks | งานสำคัญที่สุด |
| Review cycle | รอบทบทวน |

### Stage labels (final):
- Stage 1: **🎯 ตั้งเป้า** (Goal)
- Stage 2: **📋 ลงมือทำ** (Plan)
- Stage 3: **✅ ติดตาม** (Track)

### Subtitle:
"แค่ 3 ขั้น · เห็นชัด · ทำตามได้"

---

## 10. Reference Template Examples

ตัวอย่าง 5 preset ที่ Claude Code ต้องสร้างหลัง implement:

### 1. เก็บเงินซื้อของในฝัน
- Stage 1: bigGoal="เก็บเงิน 100,000 ภายใน 6 เดือน"
- Stage 2: 3 phases (เริ่ม · เพิ่มสปีด · ปิดงาน) + bigRocks (เปิดบัญชี · ตัด subscription · หางานเสริม)
- Stage 3: habits=["บันทึกรายจ่าย", "ออม 350/วัน"] · weekly review

### 2. ลดน้ำหนัก 5 กก. ใน 3 เดือน
- Stage 1: bigGoal="ลดน้ำหนัก 65→60 กก." · constraints budget≤500/เดือน
- Stage 2: 3 phases (ปรับอาหาร · เพิ่มออกกำลังกาย · รักษาผล) + bigRocks
- Stage 3: habits=["ออกกำลังกาย 30 นาที", "ชั่งน้ำหนักทุกเช้า"] · daily

### 3. เที่ยวเกาหลี 6 เดือน
- Stage 1: bigGoal="เที่ยว Seoul 7 วัน งบ 60,000"
- Stage 2: 4 phases (เก็บเงิน · จองตั๋ว · เอกสาร · เตรียมตัว) + bigRocks
- Stage 3: habits=["ออม 10,000/เดือน", "เรียนเกาหลี 10 นาที"] · weekly

### 4. เปิดร้านขายของออนไลน์
- Stage 1: bigGoal="ขายได้ 30,000/เดือน ภายใน 4 เดือน"
- Stage 2: 4 phases (วิจัยตลาด · จัดตั้ง · launch · scale)
- Stage 3: metrics=["ยอดขาย", "follower"]

### 5. เรียนภาษาอังกฤษให้ใช้งานได้
- Stage 1: bigGoal="พูดอังกฤษได้ในชีวิตประจำวัน · TOEIC 700"
- Stage 2: 3 phases (พื้นฐาน · เพิ่ม vocab · พูดจริง)
- Stage 3: habits=["Duolingo 30 นาที", "ดู Netflix EN subtitle"]

---

## 11. Acceptance Criteria

- [ ] L0: TypeScript build pass · lint pass · tests pass
- [ ] L1: Admin สร้าง pipeline template ใหม่ได้ครบ 3 stages
- [ ] L1: Cannot proceed Stage 2 ถ้า bigGoal ใน Stage 1 ว่าง
- [ ] L1: Summary panel แสดง output stages ก่อนหน้า real-time
- [ ] L1: PDF render Thai font ครบ (fix `engine-planner.ts` rendering bug ที่เห็นในรี case ทำนา)
- [ ] L1: 5 preset templates load ได้ · admin clone ได้
- [ ] L2: Owner สร้าง "เก็บเงินซื้อมือถือ" template scenario เต็ม + download PDF
- [ ] L3: Deploy VPS · health 200 · revenue channel preserved

---

## 12. SCOPE GATE (CLAUDE.md workflow)

> ก่อน implement ต้อง:
> 1. ✅ Read CLAUDE.md
> 2. ✅ Read core/planprom.md current state
> 3. ⏳ **เขียน scope + flow + frozen files ใน core/planprom.md ก่อน implement**
> 4. ⏳ Commit docs only (no code)
> 5. ⏳ **รอ owner confirm**
> 6. ⏳ Phase 1: Schema + Migration

---

## 13. Quick Reference

- `PIPELINE_BRIEF.md` — ไฟล์นี้ (implementation brief)
- `planner-pipeline-mockup.html` — visual mockup PDF output + admin UI
- `lib/engine-types.ts` — current types (V1 + V2 frozen · เพิ่ม V3)
- `lib/engine-planner.ts` — V2 generator (reference pattern)
- `app/admin/templates/new/PlannerEngineForm.tsx` — V2 form (reference pattern · ไม่ลบทันที)

---

**Brief generated:** 2026-05-11
**Source:** อ้างจาก `engine-types.ts` + `PlannerEngineForm.tsx` (V2) + ความเห็น owner: "เอาแบบเดียว Pipeline · คนไทยต้องคิดง่ายๆ · เห็นแพลนเนอเข้าใจทำตาม"

**Next action for Claude Code:** อ่าน CLAUDE.md → planprom.md → write scope gate → wait owner confirm → Phase 1
