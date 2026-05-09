// src/lib/blog.ts
// Blog / Content System (E-E-A-T)
//
// Content model + static posts for editorial content.
// Pre-hosting: posts stored as static data (migrate to DB/CMS post-launch).
//
// E-E-A-T signals:
//   Experience    — real-world template use cases, Thai business context
//   Expertise     — PDF workflow, planner methodology
//   Authority     — links to template catalog pages
//   Trust         — author bio, published date

export interface BlogAuthor {
  slug: string
  name: string
  role: string
  bio: string
}

export interface BlogPost {
  slug: string
  title: string
  description: string
  content: string          // Markdown
  author: BlogAuthor
  publishedAt: string      // ISO date
  updatedAt?: string
  tags: string[]
  category: 'guide' | 'review' | 'news' | 'tips'
  readingTimeMin: number
  coverImageAlt?: string
}

// ---------------------------------------------------------------------------
// Authors
// ---------------------------------------------------------------------------

export const AUTHORS: Record<string, BlogAuthor> = {
  planprom_team: {
    slug: 'planprom-team',
    name: 'ทีม Planprom',
    role: 'ผู้เชี่ยวชาญด้านเทมเพลต PDF และการวางแผน',
    bio: 'ทีมงาน Planprom คัดสรรเทมเพลต PDF และแพลนเนอร์คุณภาพสูง พร้อมใช้งานทันที เหมาะสำหรับธุรกิจ การเงิน และชีวิตประจำวัน',
  },
}

// ---------------------------------------------------------------------------
// Static posts (seed content for E-E-A-T foundation)
// ---------------------------------------------------------------------------

const POST_1_CONTENT = `## ทำไมธุรกิจขนาดเล็กต้องใช้เทมเพลต PDF?

เอกสารธุรกิจที่ดูเป็นมืออาชีพช่วยสร้างความเชื่อถือกับลูกค้าได้ทันที โดยไม่ต้องจ้างดีไซเนอร์หรือซื้อซอฟต์แวร์แพง เทมเพลต PDF กรอกได้ตอบโจทย์นี้ได้ดีที่สุด

## 5 เทมเพลตที่ต้องมี

### 1. ใบเสนอราคา (Quotation)
เอกสารแรกที่ลูกค้าเห็น — ต้องดูสะอาด อ่านง่าย และครบถ้วน เทมเพลตที่ดีต้องมีช่องรายการสินค้า ราคาต่อหน่วย ภาษีมูลค่าเพิ่ม และเงื่อนไขการชำระ

### 2. ใบแจ้งหนี้ / Invoice
ส่งหลังงานเสร็จ ต้องมีเลขที่เอกสาร วันครบกำหนดชำระ และข้อมูลบัญชีธนาคารชัดเจน

### 3. สัญญาจ้างงานฟรีแลนซ์
ป้องกันปัญหา "จ่ายหลังงานเสร็จ" ระบุขอบเขตงาน ราคา และเงื่อนไขไว้ล่วงหน้า

### 4. ตารางบันทึกค่าใช้จ่ายรายเดือน
ติดตามรายรับ-รายจ่ายของธุรกิจ แยกหมวดได้ชัดเจน ช่วยวางแผนภาษีปลายปี

### 5. ใบรับเงิน / Receipt
สำหรับธุรกิจที่รับเงินสด ลูกค้าต้องการหลักฐาน เทมเพลตที่มีโลโก้และข้อมูลร้านดูน่าเชื่อถือกว่ากระดาษเปล่ามาก

## ดาวน์โหลดเทมเพลตเหล่านี้ได้ที่ไหน?

Planprom มีเทมเพลต PDF กรอกได้ในหมวด [ธุรกิจ / เปิดร้าน](/catalog/business) ราคาเริ่มต้น ฿20 ดาวน์โหลดได้ทันทีหลังชำระเงิน ใช้ซ้ำได้ไม่จำกัด`

const POST_2_CONTENT = `## ทำไมแพลนเนอร์ PDF ได้ผลกว่าแอป?

หลายคนลองใช้แอปจดบัญชีแล้วเลิกกลางทาง เพราะมีการแจ้งเตือนมากเกินไป หรือต้องการอินเทอร์เน็ต แพลนเนอร์ PDF แก้ปัญหานี้ได้ เพราะ:

- **เปิดได้ทุกที่** — ไม่ต้องการอินเทอร์เน็ต
- **กรอกได้ทั้งในคอมและมือถือ** — Adobe Acrobat, PDF Expert, หรือแอป PDF ฟรีบน iOS/Android
- **พิมพ์ออกมาเขียนด้วยมือได้** — สำหรับคนที่ชอบจดด้วยมือ

## โครงสร้างแพลนเนอร์งบประมาณที่ดี

### ส่วนที่ 1 — ภาพรวมรายเดือน
บันทึกรายรับทั้งหมด เงินเดือน งานเสริม ดอกเบี้ย ก่อนวางแผนรายจ่าย

### ส่วนที่ 2 — รายจ่ายแบ่งหมวด
แนะนำใช้กฎ **50/30/20**:
- 50% ค่าใช้จ่ายจำเป็น (ค่าเช่า อาหาร ค่าเดินทาง)
- 30% ความต้องการส่วนตัว (ท่องเที่ยว บันเทิง)
- 20% ออมเงินและลงทุน

### ส่วนที่ 3 — ติดตามสัปดาห์ต่อสัปดาห์
ทบทวนทุกอาทิตย์ว่าใช้จ่ายตามแผนหรือเกินงบ ปรับแผนก่อนที่จะสายเกินไป

## ดาวน์โหลดแพลนเนอร์

Planprom มีแพลนเนอร์งบประมาณ PDF กรอกได้ในหมวด [การเงิน](/catalog/finance) ราคา ฿20 ดาวน์โหลดทันที ใช้ซ้ำได้ทุกเดือน`

const POST_3_CONTENT = `## PDF กรอกได้ vs Excel — ต่างกันอย่างไร?

ทั้งสองเป็นเครื่องมือที่ดี แต่เหมาะกับงานต่างกัน

## เมื่อไหรควรใช้ PDF กรอกได้

**เหมาะกับ:**
- เอกสารที่ต้องส่งให้ลูกค้าดู (ใบเสนอราคา, Invoice, สัญญา)
- ฟอร์มที่ต้องการโครงสร้างคงที่ ไม่ให้ผู้รับแก้ไขเนื้อหา
- แพลนเนอร์ที่ต้องการพิมพ์ออกมาใช้
- เอกสารที่ต้องการลายเซ็นดิจิทัล

**ข้อดี:**
- หน้าตาคงเดิมในทุกอุปกรณ์
- ป้องกันการแก้ไขโครงสร้างโดยไม่ตั้งใจ
- เปิดได้ฟรีทุกเครื่อง

## เมื่อไหรควรใช้ Excel / Google Sheets

**เหมาะกับ:**
- งานที่ต้องคำนวณซับซ้อน (สูตร, pivot table)
- ข้อมูลที่ต้องอัพเดทบ่อยและต้องการกรองข้อมูล
- การวิเคราะห์ตัวเลขระยะยาว

## สรุป

| งาน | แนะนำ |
|---|---|
| ใบเสนอราคา / Invoice | PDF |
| แพลนเนอร์รายเดือน | PDF |
| งบประมาณโครงการซับซ้อน | Excel |
| ติดตามยอดขายรายวัน | Excel |
| สัญญา / ข้อตกลง | PDF |

ดูเทมเพลต PDF พร้อมใช้ทั้งหมดได้ที่ [คลังเทมเพลต](/templates)`

const POST_4_CONTENT = `## Planner คืออะไร?

Planner คือเอกสารสำหรับ**วางแผนล่วงหน้า** กำหนดเป้าหมาย จัดตารางเวลา และติดตามความก้าวหน้าในภาพรวม

### ลักษณะของ Planner
- ให้ภาพรวมในช่วงเวลา (รายสัปดาห์ รายเดือน รายปี)
- ยืดหยุ่น ปรับได้ตามสถานการณ์
- เน้น "จะทำอะไร" มากกว่า "ทำเสร็จหรือยัง"

## Checklist คืออะไร?

Checklist คือรายการตรวจสอบสำหรับ**ติ๊กทำทีละขั้น** ให้ครบ ไม่ข้ามขั้นตอน

### ลักษณะของ Checklist
- ลำดับตายตัว ทำครบทุกข้อ
- ไบนารี่ — ทำแล้ว / ยังไม่ทำ
- เน้น "ทำเสร็จหรือยัง" มากกว่าภาพรวม

## เปรียบเทียบ Planner กับ Checklist

| ด้าน | Planner | Checklist |
|---|---|---|
| จุดประสงค์ | วางแผนล่วงหน้า | ตรวจสอบขั้นตอน |
| โครงสร้าง | ยืดหยุ่น ปรับได้ | ลำดับตายตัว |
| ใช้เมื่อ | ก่อนเริ่มงาน | ระหว่าง / หลังงาน |
| เหมาะกับ | เป้าหมายระยะยาว | งาน QA / ไม่ให้ตกหล่น |

## เมื่อไหรควรใช้ Planner

- วางแผนการเงินรายเดือน (งบประมาณ รายรับ-รายจ่าย)
- ตั้งเป้าหมายปีใหม่ (OKR ธุรกิจ ชีวิตส่วนตัว)
- จัดการหลายโครงการพร้อมกัน

## เมื่อไหรควรใช้ Checklist

- จัดงาน Event — รายการสิ่งที่ต้องทำก่อนงาน ไม่ตกหล่น
- เปิดร้านใหม่ — ขั้นตอนครบทุกอย่าง
- รายการซื้อของก่อนเดินทาง
- ตรวจงานก่อนส่งลูกค้า

## สรุป — ใช้ทั้งคู่ดีที่สุด

วางแผนด้วย **Planner** → ลงมือทำ → ตรวจสอบด้วย **Checklist** คือ workflow ที่ได้ผลจริง

Planprom มีทั้ง Planner PDF และ Checklist PDF พร้อมใช้ ราคาเริ่มต้น ฿20 ดูทั้งหมดที่ [คลังเทมเพลต](/templates)`

const POST_5_CONTENT = `## Planprom คืออะไร?

Planprom คือร้านเทมเพลต PDF ดิจิทัลสำหรับคนไทย ขาย Planner, Checklist และเอกสารธุรกิจ ดาวน์โหลดได้ทันทีหลังชำระเงิน ใช้ซ้ำได้ไม่จำกัด

## ชำระเงินได้ด้วยวิธีไหน?

ชำระผ่าน **PromptPay QR Code** สแกนจากแอปธนาคารบนมือถือ ระบบยืนยันอัตโนมัติภายใน 30 วินาที ไม่ต้องแจ้งสลิป

## ดาวน์โหลดไฟล์ได้นานแค่ไหน?

Link ดาวน์โหลดไม่มีวันหมดอายุ กลับมาโหลดซ้ำได้จากหน้า [คำสั่งซื้อ](/orders) ตลอดเวลา

## ใช้โปรแกรมอะไรเปิด PDF กรอกได้?

- **Adobe Acrobat Reader** — ฟรี Windows/Mac/iOS/Android
- **PDF Expert** — iOS/Mac (แนะนำสำหรับ iPad)
- **Xodo PDF** — Android ฟรี
- พิมพ์ออกมาเขียนด้วยมือก็ได้เสมอ

## ซื้อแล้วใช้ได้กี่ครั้ง?

ใช้ได้**ไม่จำกัด** ซื้อครั้งเดียว ใช้ซ้ำทุกเดือน พิมพ์ได้ไม่จำกัด เหมาะสำหรับใช้ส่วนตัวและทีมงานภายใน

## มีการคืนเงินไหม?

สินค้าดิจิทัลที่ดาวน์โหลดแล้วไม่สามารถคืนเงินได้ หากมีปัญหาด้านเทคนิค ติดต่อเราผ่าน LINE OA ได้ทันที ทีมงานพร้อมช่วยเหลือทุกวัน

## ติดต่อได้ที่ไหน?

ติดต่อทีมงานผ่าน LINE Official Account ตอบทุกวัน 9:00–22:00 น. กด "ติดต่อเรา" ที่มุมบนขวาของเว็บได้เลย`

const POSTS: BlogPost[] = [
  {
    slug: 'เทมเพลต-pdf-ธุรกิจ-ขนาดเล็ก-ต้องมี',
    title: '5 เทมเพลต PDF ที่ธุรกิจขนาดเล็กต้องมีปี 2026',
    description: 'ใบเสนอราคา ใบแจ้งหนี้ สัญญาจ้าง บันทึกค่าใช้จ่าย — 5 เทมเพลต PDF กรอกได้ที่ช่วยให้ธุรกิจขนาดเล็กดูน่าเชื่อถือทันที',
    content: POST_1_CONTENT,
    author: AUTHORS.planprom_team,
    publishedAt: '2026-05-01',
    updatedAt: '2026-05-08',
    tags: ['เทมเพลต PDF', 'ธุรกิจขนาดเล็ก', 'ใบเสนอราคา', 'Invoice', 'ฟรีแลนซ์'],
    category: 'guide',
    readingTimeMin: 4,
    coverImageAlt: '5 เทมเพลต PDF ธุรกิจขนาดเล็ก',
  },
  {
    slug: 'แพลนเนอร์-pdf-วางแผนงบประมาณส่วนตัว',
    title: 'วิธีใช้แพลนเนอร์ PDF วางแผนงบประมาณส่วนตัวให้ได้ผลจริง',
    description: 'แพลนเนอร์ PDF vs แอป vs สเปรดชีต — อันไหนเหมาะกับคุณ? พร้อมวิธีใช้งานจริงสำหรับมือใหม่เริ่มวางแผนการเงิน',
    content: POST_2_CONTENT,
    author: AUTHORS.planprom_team,
    publishedAt: '2026-05-05',
    updatedAt: '2026-05-08',
    tags: ['แพลนเนอร์', 'งบประมาณ', 'วางแผนการเงิน', 'PDF', '50/30/20'],
    category: 'guide',
    readingTimeMin: 4,
    coverImageAlt: 'แพลนเนอร์ PDF วางแผนงบประมาณส่วนตัว',
  },
  {
    slug: 'เทมเพลต-pdf-vs-excel-อันไหนดีกว่า',
    title: 'เทมเพลต PDF vs Excel — อันไหนเหมาะกับงานแบบไหน?',
    description: 'เปรียบเทียบข้อดีข้อเสียของ PDF กรอกได้ กับ Excel Spreadsheet สำหรับเอกสารธุรกิจและแพลนเนอร์ส่วนตัว',
    content: POST_3_CONTENT,
    author: AUTHORS.planprom_team,
    publishedAt: '2026-05-07',
    updatedAt: '2026-05-09',
    tags: ['เทมเพลต PDF', 'Excel', 'เอกสารธุรกิจ', 'แพลนเนอร์'],
    category: 'tips',
    readingTimeMin: 3,
    coverImageAlt: 'เทมเพลต PDF vs Excel เปรียบเทียบ',
  },
  {
    slug: 'planner-กับ-checklist-ต่างกันยังไง',
    title: 'Planner กับ Checklist ต่างกันยังไง? เลือกใช้แบบไหนให้ถูกงาน',
    description: 'Planner คือแผนภาพรวม Checklist คือรายการตรวจสอบ — รู้จักความต่างแล้วเลือกใช้ให้ตรงงาน ได้ผลจริงไม่เสียเวลา',
    content: POST_4_CONTENT,
    author: AUTHORS.planprom_team,
    publishedAt: '2026-05-09',
    tags: ['Planner', 'Checklist', 'เทมเพลต PDF', 'วางแผน'],
    category: 'guide',
    readingTimeMin: 3,
    coverImageAlt: 'Planner กับ Checklist ต่างกันยังไง',
  },
  {
    slug: 'คำถามที่พบบ่อย-faq',
    title: 'คำถามที่พบบ่อย (FAQ) — Planprom Template Store',
    description: 'รวมคำถามที่พบบ่อยเกี่ยวกับ Planprom ชำระเงิน ดาวน์โหลด การใช้งาน PDF กรอกได้ และการติดต่อทีมงาน',
    content: POST_5_CONTENT,
    author: AUTHORS.planprom_team,
    publishedAt: '2026-05-09',
    tags: ['FAQ', 'คำถาม', 'Planprom', 'ดาวน์โหลด'],
    category: 'guide',
    readingTimeMin: 3,
    coverImageAlt: 'คำถามที่พบบ่อย Planprom',
  },
]

// ---------------------------------------------------------------------------
// Accessors
// ---------------------------------------------------------------------------

export function getAllPosts(): BlogPost[] {
  return [...POSTS].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  )
}

export function getPostBySlug(slug: string): BlogPost | null {
  return POSTS.find(p => p.slug === slug) ?? null
}

export function getPostsByTag(tag: string): BlogPost[] {
  return getAllPosts().filter(p => p.tags.includes(tag))
}

export function getPostsByCategory(category: BlogPost['category']): BlogPost[] {
  return getAllPosts().filter(p => p.category === category)
}

export function getAllSlugs(): string[] {
  return POSTS.map(p => p.slug)
}

export function matchRelatedPosts(query: string, limit = 3): BlogPost[] {
  if (!query.trim()) return []
  const tokens = query.toLowerCase().split(/\s+/).filter(t => t.length >= 2)
  if (tokens.length === 0) return []

  const scored = POSTS.map(post => {
    const haystack = [post.title, post.description, ...post.tags].join(' ').toLowerCase()
    const score = tokens.reduce((acc, token) => acc + (haystack.includes(token) ? 1 : 0), 0)
    return { post, score }
  }).filter(({ score }) => score > 0)

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ post }) => post)
}
