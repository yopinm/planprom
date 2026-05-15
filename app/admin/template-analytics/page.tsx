// /admin/template-analytics — INTEL-A+B+C+D: Market Intelligence Dashboard v2
import Link from 'next/link'
import type { Metadata } from 'next'
import { requireAdminSession } from '@/lib/admin-auth'
import { db } from '@/lib/db'
import { recordFulfilledAction, rejectIdeaAction, revertRejectedAction } from './actions'
import { CopyButton } from './CopyButton'

export const metadata: Metadata = {
  title: 'Market Intelligence — Admin',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

// ── Constants ─────────────────────────────────────────────────────────────────
const SEED_KEYWORDS = [
  // Core
  { key: 'checklist', label: 'Checklist', engineType: 'checklist', color: 'bg-indigo-50 text-indigo-700',  border: 'border-indigo-200', headerBg: 'bg-indigo-50'  },
  { key: 'planner',   label: 'Planner',   engineType: 'pipeline',  color: 'bg-purple-50 text-purple-700', border: 'border-purple-200', headerBg: 'bg-purple-50' },
  { key: 'ฟอร์ม',     label: 'Form',      engineType: 'form',      color: 'bg-teal-50 text-teal-700',     border: 'border-teal-200',   headerBg: 'bg-teal-50'   },
  { key: 'รายงาน',   label: 'Report',    engineType: 'report',    color: 'bg-amber-50 text-amber-700',   border: 'border-amber-200',  headerBg: 'bg-amber-50'  },
  // Extended (B: new seed keywords)
  { key: 'ตาราง',    label: 'ตาราง',    engineType: 'form',      color: 'bg-teal-50 text-teal-700',     border: 'border-teal-200',   headerBg: 'bg-teal-50'   },
  { key: 'ใบแจ้ง',   label: 'ใบแจ้ง',   engineType: 'form',      color: 'bg-teal-50 text-teal-700',     border: 'border-teal-200',   headerBg: 'bg-teal-50'   },
  { key: 'แผนงาน',   label: 'แผนงาน',   engineType: 'pipeline',  color: 'bg-purple-50 text-purple-700', border: 'border-purple-200', headerBg: 'bg-purple-50' },
  { key: 'บัญชี',    label: 'บัญชี',    engineType: 'report',    color: 'bg-amber-50 text-amber-700',   border: 'border-amber-200',  headerBg: 'bg-amber-50'  },
  // Topic-based (B: ครอบ catalog career / parenting / home-lifestyle)
  { key: 'งาน',        label: 'งาน',        engineType: 'checklist', color: 'bg-indigo-50 text-indigo-700',  border: 'border-indigo-200',  headerBg: 'bg-indigo-50'  },
  { key: 'เลี้ยงลูก',  label: 'เลี้ยงลูก',  engineType: 'checklist', color: 'bg-pink-50 text-pink-700',     border: 'border-pink-200',    headerBg: 'bg-pink-50'    },
  { key: 'งานบ้าน',   label: 'งานบ้าน',   engineType: 'checklist', color: 'bg-orange-50 text-orange-700', border: 'border-orange-200',  headerBg: 'bg-orange-50'  },
  { key: 'ครอบครัว',  label: 'ครอบครัว',  engineType: 'checklist', color: 'bg-rose-50 text-rose-700',     border: 'border-rose-200',    headerBg: 'bg-rose-50'    },
] as const

// A: expanded from 6 → 15 most-common Thai consonants
const ALPHA_CHARS = ['ก','ข','ค','ง','จ','ต','ท','น','บ','ป','ม','ว','ส','ห','อ'] as const
const DRILL_LIMIT = 6 // per engineType — D: drill ALL Level 1 (covered + uncovered)

const AUDIENCE_RULES: { tag: string; color: string; pattern: RegExp }[] = [
  { tag: 'ส่วนตัว',    color: 'bg-sky-100 text-sky-700',       pattern: /เที่ยว|เดินทาง|งานแต่ง|ออกกำลัง|ชีวิต|สุขภาพ|ห้อง|บ้าน|เปิดเทอม|โรงเรียน|ไปเรียน/ },
  { tag: 'ธุรกิจ SME', color: 'bg-amber-100 text-amber-700',   pattern: /ร้าน|ธุรกิจ|ใบเสนอ|ราคา|ลูกค้า|invoice|สินค้า|ขาย|เปิดกิจการ|บริษัท|ใบส่ง/ },
  { tag: 'ราชการ/HR',  color: 'bg-red-100 text-red-700',       pattern: /ราชการ|หน่วยงาน|ประกัน|ว่างงาน|ปฏิบัติงาน|ลา|บันทึก|ประชุม|มอบอำนาจ|รายงานตัว/ },
  { tag: 'โครงการ',    color: 'bg-purple-100 text-purple-700', pattern: /โครงการ|ก่อสร้าง|timeline|แผนงาน|ประจำปี|งบ|ระยะเวลา|milestone/ },
  { tag: 'การศึกษา',   color: 'bg-green-100 text-green-700',   pattern: /นักเรียน|มหาวิทยาลัย|สอบ|เรียน|วิชา|semester|วิทยาลัย/ },
]

const NOISE = /^(แปลว่า|คือ|ภาษาอังกฤษ|pdf|ฟรี|goodnote|sut|a problem|speech|สรุป|one piece|marvel|resident evil|ฟอร์มาลิน|ฟอร์มาลดีไฮด์|ฟอร์มูลาวัน|formula 1|format factory|format$|formula$)$/i

// FULL_NOISE: applied to full suggestion string — catches context-dependent noise that NOISE misses
const FULL_NOISE = /ตารางบอล|ตารางฟุตบอล|ตารางคะแนน|ตารางแข่ง|ตารางลีก|ตารางพรีเมียร์|ตารางไทยลีก|ตารางลาลีกา|ตารางบุนเดส|ตารางเอฟเอ|ตารางแชมเปียนส์|ตารางรถไฟ|ตารางบิน|ตารางเดินรถ|ตารางธาตุ|ตารางหุ้น|เลี้ยงลูกนก|เลี้ยงลูกกระรอก|เลี้ยงลูกแมว|เลี้ยงลูกสุนัข|เลี้ยงลูกหมา|เลี้ยงลูกปลา|เลี้ยงลูกเต่า|เลี้ยงลูกกบ|เลี้ยงลูกหมู|เลี้ยงลูกไก่|เลี้ยงลูกกระต่าย|เลี้ยงลูกวัว|เลี้ยงลูกแพะ|เลี้ยงลูกลิง|งานบ้านและสวน|งานมหกรรม|มอเตอร์โชว์|motor show|สัปดาห์หนังสือ|ภิรมภักดิ์|ภิรมภักดี|ภิรมย์ภักดิ์|ภิรมย์ภักดี|หมดประเสร็จ|ฟอร์มาลิน|ฟอร์มาลดีไฮด์|ฟอร์มูลาวัน|ฟอร์มูล่าวัน|formula 1|formula one/i

// TOPIC_KEYS: seed keywords ที่เป็น domain/หัวข้อ (ไม่ใช่ประเภทเอกสาร)
// ต้องผ่าน TOPIC_ACTIONABLE ก่อนถึงจะเป็น template idea ได้
const TOPIC_KEYS = new Set(['งาน', 'เลี้ยงลูก', 'งานบ้าน', 'ครอบครัว'])

// TOPIC_ACTIONABLE: idea จาก topic keyword ต้องมีคำเหล่านี้ — บ่งบอกว่าเป็น process/task ที่ทำ template ได้จริง
// ถ้าไม่มี = pop culture / proper noun / นิยาม / event เฉพาะ → filter ออก
const TOPIC_ACTIONABLE = /วางแผน|แผน|ตรวจ|เช็ค|จัดการ|ดูแล|บันทึก|ติดตาม|เตรียม|ประเมิน|คำนวณ|สรุป|ทำความสะอาด|ซ่อม|จัดระเบียบ|พัฒนา|วัคซีน|โภชนาการ|พัฒนาการ|หมอ|แพทย์|สัมภาษณ์|เงินเดือน|ประจำ|รายวัน|รายสัปดาห์|รายเดือน|รายปี|ปลอดภัย|ออม|งบ|ค่าใช้จ่าย|รายรับ|รายจ่าย|ออกกำลัง|สุขภาพ|การเงิน|เดินทาง|ท่องเที่ยว|ทักษะ|เรียน|ฝึก|สอน|ขั้นตอน|รายการ|วิธี|คู่มือ|แนวทาง|บัญชี|ประกัน|กิจกรรม|จัดทำ|บริหาร|ควบคุม|ลดน้ำหนัก|อาหาร|กิจวัตร|ความปลอดภัย|ซัก|รีด|กวาด|กำจัด|ลดค่า|ประหยัด|ซ่อมแซม|ดูแลรักษา/i

// ── Types ─────────────────────────────────────────────────────────────────────
type TemplateRef = { id: string; title: string; slug: string; orders: number }
type IdeaRow = {
  idea: string
  stripped: string
  level: 1 | 2 | 3
  source?: string
  char?: string
  match: TemplateRef | null
}
type KpiRow  = { total_revenue: string; paid_orders: string; pending_orders: string; total_downloads: string; unique_buyers: string }
type TypeRow = { type_group: string; orders: string; paid: string; revenue: string }
type DailyRow = { day: string; orders: string; revenue: string }
type RankRow  = { id: string; title: string; slug: string; engine_type: string; price_baht: number; status: string; orders: string; revenue: string; downloads: string }
type GapRow   = { engine_type: string; template_count: string; total_orders: string }
type CatalogPerfRow = { slug: string; name: string; emoji: string; template_count: string; paid_orders: string; revenue: string }
type CatalogRef     = { slug: string; name: string; emoji: string }
type FulfilledRow   = { idea_text: string; fulfilled_at: string }
type SnapshotRow    = { idea_text: string; engine_type: string; score: number }
type RejectedRow    = { idea_text: string; rejected_at: string }
type StaleIdeaRow   = { idea_text: string; engine_type: string; oldest_date: string }
type ScoreRow = {
  id: string; title: string; slug: string
  engine_type: string | null; tier: string; price_baht: number
  description: string; engine_data: Record<string, unknown> | null
  thumbnail_path: string | null; page_count: number; category_count: number
}
type DimResult = { name: string; max: number; score: number; issues: string[] }
type HealthScore = { total: number; grade: '🟢' | '🟡' | '🔴'; dims: DimResult[] }

// ── Helpers ───────────────────────────────────────────────────────────────────
async function fetchSuggestions(keyword: string): Promise<string[]> {
  try {
    const url = `https://suggestqueries.google.com/complete/search?client=chrome&q=${encodeURIComponent(keyword)}&hl=th&gl=th`
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, next: { revalidate: 3600 } })
    if (!res.ok) return []
    const json = await res.json() as [string, string[]]
    return (json[1] ?? []).slice(0, 10)
  } catch { return [] }
}

function stripPrefix(s: string, keyword: string): string {
  return s.replace(new RegExp(`^${keyword}\\s*`, 'i'), '').trim()
}

function findMatch(stripped: string, templates: TemplateRef[]): TemplateRef | null {
  if (!stripped || stripped.length < 2) return null
  const words = stripped.split(/\s+/).filter(w => w.length > 1)
  if (!words.length) return null
  return templates.find(t => words.some(w => t.title.includes(w))) ?? null
}

function analyzeKeyword(keyword: string, suggestions: string[]) {
  const joined    = suggestions.join(' ')
  const audiences = AUDIENCE_RULES.filter(r => r.pattern.test(joined))
  const ideas: string[] = []
  const isTopic = TOPIC_KEYS.has(keyword)
  for (const s of suggestions) {
    const stripped = stripPrefix(s, keyword)
    if (!stripped || stripped.length > 40) continue
    if (NOISE.test(stripped) || FULL_NOISE.test(s)) continue
    if (isTopic && !TOPIC_ACTIONABLE.test(s)) continue
    ideas.push(`${keyword} ${stripped}`)
    if (ideas.length >= 5) break
  }
  const actionable  = suggestions.filter(s => {
    const st = stripPrefix(s, keyword)
    return st && st.length <= 40 && !NOISE.test(st) && !FULL_NOISE.test(s) && (!isTopic || TOPIC_ACTIONABLE.test(s))
  }).length
  const demand: 'สูง' | 'กลาง' | 'ต่ำ' = actionable >= 5 ? 'สูง' : actionable >= 3 ? 'กลาง' : 'ต่ำ'
  const demandColor = demand === 'สูง' ? 'bg-green-100 text-green-700' : demand === 'กลาง' ? 'bg-amber-100 text-amber-700' : 'bg-neutral-100 text-neutral-500'
  return { audiences, ideas, demand, demandColor }
}

// C: priority score = level weight × (100 − coverage%)
function priorityScore(level: 1 | 2 | 3, pct: number): number {
  return Math.round((level === 1 ? 3 : level === 2 ? 2 : 1) * (100 - pct))
}

function priorityBadge(score: number): { label: string; color: string } {
  if (score >= 250) return { label: '🔴 ด่วนสุด', color: 'bg-red-100 text-red-700' }
  if (score >= 150) return { label: '🟠 ควรทำ',   color: 'bg-orange-100 text-orange-700' }
  if (score >= 50)  return { label: '🟡 พิจารณา', color: 'bg-amber-100 text-amber-700' }
  return              { label: '⚪ ต่ำ',          color: 'bg-neutral-100 text-neutral-500' }
}

function computeHealthScore(t: ScoreRow, priorityIdeas: string[]): HealthScore {
  const dims: DimResult[] = []

  // Dim 1: ความครบถ้วน (30)
  let s1 = 0; const i1: string[] = []
  if (t.thumbnail_path) s1 += 10; else i1.push('ไม่มีรูปปก')
  if (t.description.length >= 80) s1 += 10; else i1.push(`description ${t.description.length}/80`)
  if (t.page_count >= 2) s1 += 5; else i1.push(`หน้า ${t.page_count}/2`)
  if (t.category_count > 0) s1 += 5; else i1.push('ไม่มี category')
  dims.push({ name: 'ความครบถ้วน', max: 30, score: s1, issues: i1 })

  // Dim 2: Engine data (30)
  let s2 = 0; const i2: string[] = []
  if (t.engine_data !== null && t.engine_data !== undefined) {
    s2 += 15
    if (Object.keys(t.engine_data).length > 0) s2 += 15; else i2.push('engine_data ว่างเปล่า')
  } else if (!t.engine_type) {
    s2 = 30 // upload-mode template — ผ่าน
  } else {
    i2.push('ไม่มี engine_data')
  }
  dims.push({ name: 'Engine Data', max: 30, score: s2, issues: i2 })

  // Dim 3: ราคา/Payment (20)
  let s3 = 0; const i3: string[] = []
  if ((t.tier === 'free' && t.price_baht === 0) || (t.tier !== 'free' && t.price_baht > 0)) s3 = 20
  else i3.push(`tier=${t.tier} แต่ price_baht=${t.price_baht} — ขัดแย้ง`)
  dims.push({ name: 'ราคา/Payment', max: 20, score: s3, issues: i3 })

  // Dim 4: Market fit (10)
  let s4 = 0; const i4: string[] = []
  const tl = t.title.toLowerCase()
  if (priorityIdeas.some(idea => idea.split(/\s+/).some(w => w.length > 2 && tl.includes(w)))) s4 = 10
  else i4.push('title ไม่ match Google Suggest demand')
  dims.push({ name: 'Market Fit', max: 10, score: s4, issues: i4 })

  // Dim 5: SEO basics (10)
  let s5 = 0; const i5: string[] = []
  if (t.slug.length <= 60) s5 += 5; else i5.push(`slug ยาว ${t.slug.length}/60 chars`)
  if (t.description.length >= 80) s5 += 5; else i5.push('description < 80 chars')
  dims.push({ name: 'SEO Basics', max: 10, score: s5, issues: i5 })

  const total = s1 + s2 + s3 + s4 + s5
  return { total, dims, grade: total >= 80 ? '🟢' : total >= 50 ? '🟡' : '🔴' }
}

function normalizeIdea(idea: string): string {
  return idea
    .toLowerCase()
    .replace(/^(checklist|planner|form|report|ฟอร์ม|รายงาน|เช็คลิสต์|แพลนเนอร์|แบบฟอร์ม|แบบ|ตาราง|ใบแจ้ง|แผนงาน|บัญชี)\s+/i, '')
    .replace(/\s+/g, '')
    .trim()
    .slice(0, 10)
}

// ideaPattern = keywords ใน idea text / catPattern = match กับ category.slug หรือ category.name จริงๆ ใน DB
// เรียงจาก specific → general เพื่อให้ first-match ถูกต้อง
const CATALOG_KEYWORD_MAP: Array<{ ideaPattern: RegExp; catPattern: RegExp }> = [
  { ideaPattern: /กฎหมาย|สัญญา|นิติ|ข้อตกลง/,                                                  catPattern: /กฎหมาย|สัญญา/ },
  { ideaPattern: /อสังหา|ซื้อบ้าน|คอนโด|ที่ดิน/,                                              catPattern: /อสังหา/ },
  { ideaPattern: /ภาษี|ยื่นภาษี|ลดหย่อน|กรมสรรพากร|บัญชี|งบการเงิน/,                         catPattern: /ภาษี|บัญชี/ },
  { ideaPattern: /พัฒนาตัวเอง|เรียนรู้|เป้าหมาย|นิสัย|ทักษะ|habit|goal|จดบันทึก|อ่านหนังสือ|ฝึกฝน|เรียนภาษา|แผนพัฒนา|ปรับปรุงตัว/, catPattern: /เรียนรู้|พัฒนา|learning/ },
  // parenting แยกจาก family (ลูก/พ่อแม่ → parenting · บ้าน/ซ่อม → home-lifestyle · ครอบครัว → family)
  { ideaPattern: /พ่อแม่|เลี้ยงลูก|ลูกน้อย|ทารก|เด็กแรกเกิด|ลูกวัย/,                         catPattern: /parenting|เลี้ยงลูก/ },
  { ideaPattern: /บ้าน|งานบ้าน|ห้อง|ซ่อมบ้าน|ทำความสะอาด|ตกแต่งบ้าน/,                        catPattern: /home-lifestyle|งานบ้าน/ },
  { ideaPattern: /ครอบครัว|ชีวิตคู่|ไลฟ์สไตล์/,                                               catPattern: /family|ครอบครัว/ },
  { ideaPattern: /นักเรียน|นักศึกษ|มหาวิทยาลัย|สอบ|วิชา|วิทยาลัย|คณะ/,                       catPattern: /นักเรียน|นักศึกษ|school/ },
  // career: สมัครงาน / ราชการ / พนักงาน → slug 'career'
  { ideaPattern: /สมัครงาน|หางาน|เส้นทางอาชีพ|ผลงาน|เงินเดือน|มนุษย์เงินเดือน/,               catPattern: /career/ },
  { ideaPattern: /ราชการ|รายงานตัว|ปฏิบัติงาน|ประกันสังคม|มอบอำนาจ|หน่วยงาน|ว่างงาน/,        catPattern: /career/ },
  { ideaPattern: /พนักงาน|สัมภาษณ์|ประเมิน|ทีมงาน|ออฟฟิศ/,                                   catPattern: /career/ },
  { ideaPattern: /เที่ยว|ท่องเที่ยว|ต่างประเทศ|บิน|สนามบิน|โรงแรม|ทริป/,                      catPattern: /ท่องเที่ยว|travel/ },
  { ideaPattern: /ร้าน|ธุรกิจ|ขาย|invoice|ลูกค้า|ใบเสนอ|ใบส่ง|ประกอบการ|ประชุม|บริษัท/,     catPattern: /ธุรกิจ|เปิดร้าน|business/ },
  { ideaPattern: /เงิน|ออม|budget|งบประมาณ|ค่าใช้จ่าย|รายรับ|รายจ่าย|การเงิน|ลงทุน|หุ้น/,   catPattern: /การเงิน|finance/ },
  { ideaPattern: /สุขภาพ|ออกกำลัง|ไดเอท|ยา|คลินิก|หมอ|ฟิตเนส/,                              catPattern: /สุขภาพ|health/ },
  { ideaPattern: /งานแต่ง|งานบวช|อีเวนต์|งานเลี้ยง/,                                         catPattern: /อีเวนต์|event/ },
  { ideaPattern: /โครงการ|ก่อสร้าง|milestone/,                                                catPattern: /โครงการ|project/ },
]

function suggestCatalog(idea: string, catalogs: CatalogRef[]): CatalogRef | null {
  for (const { ideaPattern, catPattern } of CATALOG_KEYWORD_MAP) {
    if (ideaPattern.test(idea)) {
      const found = catalogs.find(c => catPattern.test(c.slug) || catPattern.test(c.name))
      if (found) return found
    }
  }
  for (const cat of catalogs) {
    if (cat.name.length > 1 && idea.includes(cat.name)) return cat
  }
  return null
}

const ENGINE_LABEL: Record<string, string> = { checklist: 'Checklist', pipeline: 'Planner', planner: 'Planner', form: 'Form', report: 'Report' }
const ENGINE_COLOR: Record<string, string> = {
  checklist: 'border-indigo-200 bg-indigo-50 text-indigo-900',
  pipeline:  'border-purple-200 bg-purple-50 text-purple-900',
  planner:   'border-purple-200 bg-purple-50 text-purple-900',
  form:      'border-teal-200 bg-teal-50 text-teal-900',
  report:    'border-amber-200 bg-amber-50 text-amber-900',
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default async function AdminMarketIntelPage() {
  await requireAdminSession('/admin/login')

  // ── Phase 1 (parallel) ───────────────────────────────────────────────────
  const [baseSuggestRaw, allTemplates, kpiRow, byType, daily, ranking, gapData, alphaRaw, catalogPerf, allCategories, fulfilledRaw, yesterdaySnaps, healthRows, rejectedRaw, staleRaw] =
    await Promise.all([
      Promise.all(SEED_KEYWORDS.map(async kw => ({ kw, suggestions: await fetchSuggestions(kw.key) }))),

      db<TemplateRef[]>`
        SELECT t.id, t.title, t.slug,
          COUNT(DISTINCT oi.order_id) FILTER (WHERE o.status = 'paid') AS orders
        FROM templates t
        LEFT JOIN order_items oi ON oi.template_id = t.id
        LEFT JOIN orders o ON o.id = oi.order_id
        WHERE t.status = 'published'
        GROUP BY t.id
      `.catch(() => [] as TemplateRef[]),

      db<KpiRow[]>`
        SELECT
          COALESCE(SUM(total_baht) FILTER (WHERE status = 'paid'), 0)::text AS total_revenue,
          COUNT(*) FILTER (WHERE status = 'paid')::text AS paid_orders,
          COUNT(*) FILTER (WHERE status = 'pending_payment')::text AS pending_orders,
          COALESCE((SELECT SUM(oi.download_count) FROM order_items oi JOIN orders o ON o.id = oi.order_id WHERE o.status = 'paid'), 0)::text AS total_downloads,
          COUNT(DISTINCT customer_line_id) FILTER (WHERE status = 'paid' AND customer_line_id IS NOT NULL)::text AS unique_buyers
        FROM orders
      `.catch(() => [{ total_revenue: '0', paid_orders: '0', pending_orders: '0', total_downloads: '0', unique_buyers: '0' }]),

      db<TypeRow[]>`
        WITH item_share AS (
          SELECT oi.template_id, oi.order_id, o.status,
            ROUND(o.total_baht::numeric / COUNT(*) OVER (PARTITION BY o.id)) AS share
          FROM order_items oi JOIN orders o ON o.id = oi.order_id
        )
        SELECT
          CASE WHEN t.engine_type IN ('planner','planner-pipeline','pipeline') THEN 'pipeline'
               WHEN t.engine_type IN ('checklist','form','report') THEN t.engine_type
               ELSE 'other' END AS type_group,
          COUNT(DISTINCT s.order_id)::text AS orders,
          COUNT(DISTINCT s.order_id) FILTER (WHERE s.status = 'paid')::text AS paid,
          COALESCE(SUM(s.share) FILTER (WHERE s.status = 'paid'), 0)::text AS revenue
        FROM item_share s JOIN templates t ON t.id = s.template_id
        GROUP BY type_group
      `.catch(() => [] as TypeRow[]),

      db<DailyRow[]>`
        SELECT DATE(created_at AT TIME ZONE 'Asia/Bangkok') AS day,
          COUNT(*) FILTER (WHERE status = 'paid')::text AS orders,
          COALESCE(SUM(total_baht) FILTER (WHERE status = 'paid'), 0)::text AS revenue
        FROM orders WHERE created_at > NOW() - INTERVAL '14 days'
        GROUP BY day ORDER BY day DESC
      `.catch(() => [] as DailyRow[]),

      db<RankRow[]>`
        SELECT t.id, t.title, t.slug, COALESCE(t.engine_type,'') AS engine_type, t.price_baht, t.status,
          COUNT(DISTINCT oi.order_id) FILTER (WHERE o.status = 'paid')::text AS orders,
          COALESCE(SUM(o.total_baht / (SELECT COUNT(*) FROM order_items x WHERE x.order_id = o.id)::numeric) FILTER (WHERE o.status = 'paid'), 0)::text AS revenue,
          COALESCE(SUM(oi.download_count), 0)::text AS downloads
        FROM templates t
        LEFT JOIN order_items oi ON oi.template_id = t.id
        LEFT JOIN orders o ON o.id = oi.order_id
        GROUP BY t.id ORDER BY orders::int DESC, t.created_at DESC
      `.catch(() => [] as RankRow[]),

      db<GapRow[]>`
        SELECT CASE WHEN engine_type IN ('planner','planner-pipeline','pipeline') THEN 'pipeline'
                    WHEN engine_type IN ('checklist','form','report') THEN engine_type
                    ELSE 'other' END AS engine_type,
          COUNT(*)::text AS template_count,
          COALESCE(SUM(sale_count), 0)::text AS total_orders
        FROM templates WHERE status = 'published' GROUP BY engine_type
      `.catch(() => [] as GapRow[]),

      // A: 8 keywords × 15 chars = 120 alpha calls (cached 1h)
      Promise.all(
        SEED_KEYWORDS.flatMap(kw =>
          ALPHA_CHARS.map(async char => ({
            engineType: kw.engineType, keyword: kw.key, char,
            suggestions: await fetchSuggestions(`${kw.key} ${char}`),
          }))
        )
      ),

      db<CatalogPerfRow[]>`
        SELECT tc.slug, tc.name, tc.emoji,
          COUNT(DISTINCT t.id)::text AS template_count,
          COUNT(DISTINCT oi.order_id) FILTER (WHERE o.status = 'paid')::text AS paid_orders,
          COALESCE(SUM(o.total_baht::numeric / NULLIF((SELECT COUNT(*) FROM order_items x WHERE x.order_id = o.id)::numeric, 0)) FILTER (WHERE o.status = 'paid'), 0)::text AS revenue
        FROM template_categories tc
        LEFT JOIN template_category_links tcl ON tcl.category_id = tc.id
        LEFT JOIN templates t ON t.id = tcl.template_id AND t.status = 'published'
        LEFT JOIN order_items oi ON oi.template_id = t.id
        LEFT JOIN orders o ON o.id = oi.order_id
        GROUP BY tc.id, tc.slug, tc.name, tc.emoji
        ORDER BY paid_orders::int DESC, template_count::int DESC
      `.catch(() => [] as CatalogPerfRow[]),

      db<CatalogRef[]>`
        SELECT slug, name, emoji FROM template_categories ORDER BY sort_order, name
      `.catch(() => [] as CatalogRef[]),

      db<FulfilledRow[]>`
        SELECT idea_text, fulfilled_at::text FROM intel_fulfilled
        WHERE fulfilled_at > NOW() - INTERVAL '30 days'
        ORDER BY fulfilled_at DESC
      `.catch(() => [] as FulfilledRow[]),

      db<SnapshotRow[]>`
        SELECT idea_text, engine_type, score::int AS score FROM intel_snapshots
        WHERE snapshot_date = CURRENT_DATE - 1
      `.catch(() => [] as SnapshotRow[]),

      db<ScoreRow[]>`
        SELECT t.id, t.title, t.slug,
          t.engine_type, COALESCE(t.tier, 'standard') AS tier,
          COALESCE(t.price_baht, 0)::int AS price_baht,
          COALESCE(t.description, '') AS description,
          t.engine_data, t.thumbnail_path,
          COALESCE(t.page_count, 0)::int AS page_count,
          COUNT(tcl.category_id)::int AS category_count
        FROM templates t
        LEFT JOIN template_category_links tcl ON tcl.template_id = t.id
        WHERE t.status = 'published'
        GROUP BY t.id
      `.catch(() => [] as ScoreRow[]),

      // Admin Feedback Loop: ideas rejected by admin
      db<RejectedRow[]>`
        SELECT idea_text, rejected_at::text FROM intel_rejected ORDER BY rejected_at DESC
      `.catch(() => [] as RejectedRow[]),

      // Auto-blacklist: ideas seen 30+ days ago without being fulfilled — soft-hide only
      db<StaleIdeaRow[]>`
        SELECT idea_text, engine_type, MIN(snapshot_date)::text AS oldest_date
        FROM intel_snapshots
        WHERE snapshot_date <= CURRENT_DATE - INTERVAL '30 days'
          AND idea_text NOT IN (SELECT idea_text FROM intel_fulfilled)
        GROUP BY idea_text, engine_type
      `.catch(() => [] as StaleIdeaRow[]),
    ])

  const kpi = kpiRow[0] ?? { total_revenue: '0', paid_orders: '0', pending_orders: '0', total_downloads: '0', unique_buyers: '0' }
  const keywordData = baseSuggestRaw.map(({ kw, suggestions }) => {
    const analysis = analyzeKeyword(kw.key, suggestions)
    return {
      ...kw, suggestions,
      ...analysis,
      // filter rejected/stale from ideas list shown in Card 06
      ideas: analysis.ideas.filter(idea => !rejectedSet.has(idea.toLowerCase()) && !staleSet.has(idea.toLowerCase())),
    }
  })

  // ── Build Level 1 — merged by engineType (B+D) ───────────────────────────
  const uniqueEngineTypes = [...new Set(SEED_KEYWORDS.map(kw => kw.engineType))]
  const level1Map = new Map<string, IdeaRow[]>(uniqueEngineTypes.map(et => [et, []]))
  const seenMap   = new Map<string, Set<string>>(uniqueEngineTypes.map(et => [et, new Set<string>()]))
  const drillQueue: { idea: string; engineType: string; keyword: string }[] = []

  for (const { kw, suggestions } of baseSuggestRaw) {
    const seen = seenMap.get(kw.engineType)!
    const rows = level1Map.get(kw.engineType)!
    const isTopic = TOPIC_KEYS.has(kw.key)
    for (const s of suggestions) {
      const stripped = stripPrefix(s, kw.key)
      if (!stripped || stripped.length > 40) continue
      if (NOISE.test(stripped) || FULL_NOISE.test(s) || seen.has(stripped)) continue
      if (isTopic && !TOPIC_ACTIONABLE.test(s)) continue
      seen.add(stripped)
      const match = findMatch(stripped, allTemplates)
      rows.push({ idea: s, stripped, level: 1, match })
      // D: drill ALL Level 1 (covered + uncovered)
      if (drillQueue.filter(d => d.engineType === kw.engineType).length < DRILL_LIMIT) {
        drillQueue.push({ idea: s, engineType: kw.engineType, keyword: kw.key })
      }
    }
  }

  // ── Phase 2 (sequential): drill-down ─────────────────────────────────────
  const drillResults = await Promise.all(
    drillQueue.map(async d => ({ ...d, suggestions: await fetchSuggestions(d.idea) }))
  )

  const level2Map = new Map<string, IdeaRow[]>()
  for (const dr of drillResults) {
    const seen = seenMap.get(dr.engineType) ?? new Set<string>()
    const rows = level2Map.get(dr.engineType) ?? []
    const isTopicDr = TOPIC_KEYS.has(dr.keyword)
    for (const s of dr.suggestions) {
      const stripped = stripPrefix(s, dr.keyword)
      if (!stripped || stripped.length > 40) continue
      if (NOISE.test(stripped) || FULL_NOISE.test(s) || seen.has(stripped)) continue
      if (isTopicDr && !TOPIC_ACTIONABLE.test(s)) continue
      seen.add(stripped)
      rows.push({ idea: s, stripped, level: 2, source: dr.idea, match: findMatch(stripped, allTemplates) })
    }
    level2Map.set(dr.engineType, rows)
    seenMap.set(dr.engineType, seen)
  }

  // ── Build Level 3 (alphabet) ─────────────────────────────────────────────
  const level3Map = new Map<string, IdeaRow[]>()
  for (const ar of alphaRaw) {
    const seen = seenMap.get(ar.engineType) ?? new Set<string>()
    const rows = level3Map.get(ar.engineType) ?? []
    const isTopicAr = TOPIC_KEYS.has(ar.keyword)
    for (const s of ar.suggestions) {
      const stripped = stripPrefix(s, ar.keyword)
      if (!stripped || stripped.length > 40) continue
      if (NOISE.test(stripped) || FULL_NOISE.test(s) || seen.has(stripped)) continue
      if (isTopicAr && !TOPIC_ACTIONABLE.test(s)) continue
      seen.add(stripped)
      rows.push({ idea: s, stripped, level: 3, char: ar.char, match: findMatch(stripped, allTemplates) })
    }
    level3Map.set(ar.engineType, rows)
    seenMap.set(ar.engineType, seen)
  }

  // ── Combine coverage per engine ───────────────────────────────────────────
  const coverageMap = new Map<string, IdeaRow[]>()
  for (const et of uniqueEngineTypes) {
    coverageMap.set(et, [
      ...(level1Map.get(et) ?? []),
      ...(level2Map.get(et) ?? []),
      ...(level3Map.get(et) ?? []),
    ])
  }

  // ── C: Priority List — uncovered ideas sorted by score ───────────────────
  const seenPrio = new Set<string>()
  const priorityList: Array<{ idea: string; level: 1|2|3; engineType: string; score: number }> = []
  for (const [engineType, rows] of coverageMap) {
    const covered = rows.filter(r => r.match !== null).length
    const pct     = rows.length > 0 ? Math.round((covered / rows.length) * 100) : 0
    for (const row of rows) {
      if (row.match !== null || seenPrio.has(row.idea)) continue
      seenPrio.add(row.idea)
      priorityList.push({ idea: row.idea, level: row.level, engineType, score: priorityScore(row.level, pct) })
    }
  }
  // ── Feature 1: Cluster · Feature 2: Fulfilled filter · Feature 3: Trend ────
  const fulfilledSet = new Set(fulfilledRaw.map(f => f.idea_text.toLowerCase()))
  const snapMap      = new Map(yesterdaySnaps.map(s => [`${s.idea_text}::${s.engine_type}`, s.score]))
  // Admin Feedback Loop: ideas explicitly rejected by admin
  const rejectedSet  = new Set(rejectedRaw.map(r => r.idea_text.toLowerCase()))
  // Auto-blacklist: stale ideas (30+ days old, unfulfilled) — soft-hide, reversible
  const staleSet     = new Set(staleRaw.map(r => r.idea_text.toLowerCase()))

  type ClusteredItem = {
    idea: string; level: 1|2|3; engineType: string; score: number
    demandCount: number; catalog: CatalogRef | null; trend: number | null
  }
  const clusteredList: ClusteredItem[] = (() => {
    const unfulfilled = priorityList.filter(item => {
      const lo = item.idea.toLowerCase()
      return !fulfilledSet.has(lo) && !rejectedSet.has(lo) && !staleSet.has(lo)
    })
    const clusters    = new Map<string, { item: typeof priorityList[0]; count: number }>()
    for (const item of unfulfilled) {
      const key      = normalizeIdea(item.idea)
      const existing = clusters.get(key)
      if (existing) { existing.count++; if (item.score > existing.item.score) existing.item = { ...item } }
      else clusters.set(key, { item: { ...item }, count: 1 })
    }
    return [...clusters.values()]
      .map(({ item, count }) => {
        const cs = item.score * count
        const ys = snapMap.get(`${item.idea}::${item.engineType}`) ?? null
        return { ...item, score: cs, demandCount: count, catalog: suggestCatalog(item.idea, allCategories), trend: ys !== null ? cs - ys : null }
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 20)
  })()

  // Build stale display list — prioritized by score from priorityList (for restore section)
  const staleDisplayList = priorityList
    .filter(item => staleSet.has(item.idea.toLowerCase()) && !rejectedSet.has(item.idea.toLowerCase()))
    .slice(0, 10)

  // INTEL-SCORE: compute health scores
  const priorityIdeas = priorityList.map(p => p.idea)
  type ScoredTemplate = ScoreRow & { health: HealthScore }
  const scoredTemplates: ScoredTemplate[] = healthRows
    .map(t => ({ ...t, health: computeHealthScore(t, priorityIdeas) }))
    .sort((a, b) => a.health.total - b.health.total)
  const greenCount  = scoredTemplates.filter(t => t.health.grade === '🟢').length
  const yellowCount = scoredTemplates.filter(t => t.health.grade === '🟡').length
  const redCount    = scoredTemplates.filter(t => t.health.grade === '🔴').length

  // INTEL-SEO-PANEL: SEO keyword blocks per engine type
  type SeoItem = { targetKeyword: string; blogTitle: string; metaDesc: string; copyText: string }
  type SeoGroup = { engineType: string; label: string; color: string; border: string; items: SeoItem[] }
  const seoGroups: SeoGroup[] = [
    { engineType: 'checklist', label: 'Checklist', color: 'bg-indigo-50 text-indigo-700', border: 'border-indigo-200' },
    { engineType: 'pipeline',  label: 'Planner',   color: 'bg-purple-50 text-purple-700', border: 'border-purple-200' },
    { engineType: 'form',      label: 'Form',       color: 'bg-teal-50 text-teal-700',     border: 'border-teal-200' },
    { engineType: 'report',    label: 'Report',     color: 'bg-amber-50 text-amber-700',   border: 'border-amber-200' },
  ].map(eng => {
    const topIdeas = clusteredList.filter(item => item.engineType === eng.engineType).slice(0, 3).map(x => x.idea)
    const kw = keywordData.find(k => k.engineType === eng.engineType)
    const keywords = topIdeas.length > 0 ? topIdeas : (kw?.ideas ?? []).slice(0, 3)
    const items: SeoItem[] = keywords.map(kwd => {
      const blogTitle = `วิธีใช้ ${kwd} ให้ได้ผล · ตัวอย่างจริง + ดาวน์โหลดฟรี`
      const metaDesc  = `${kwd} คืออะไร วิธีสร้างและใช้งานสำหรับคนไทย พร้อมตัวอย่างจริง ดาวน์โหลด ${eng.label} template ได้เลย`
      const copyText  = `🎯 Target: ${kwd}\n📝 Title: ${blogTitle}\n📄 Meta: ${metaDesc}`
      return { targetKeyword: kwd, blogTitle, metaDesc, copyText }
    })
    return { ...eng, items }
  })

  // Save daily snapshot on first page visit of the day (ONCE per day)
  const todayCount = await db<{ n: string }[]>`
    SELECT COUNT(*)::text AS n FROM intel_snapshots WHERE snapshot_date = CURRENT_DATE
  `.catch(() => [{ n: '1' }])
  if (Number(todayCount[0]?.n ?? 0) === 0 && clusteredList.length > 0) {
    await Promise.all(clusteredList.map(item =>
      db`INSERT INTO intel_snapshots (idea_text, engine_type, catalog_slug, score, demand_count)
         VALUES (${item.idea}, ${item.engineType}, ${item.catalog?.slug ?? null}, ${item.score}, ${item.demandCount})
         ON CONFLICT (idea_text, engine_type, snapshot_date) DO NOTHING`.catch(() => null)
    ))
  }

  // ── Catalog demand heatmap ────────────────────────────────────────────────
  const catalogDemandMap = new Map<string, { slug: string; name: string; emoji: string; demand: number; covered: number }>()
  for (const cat of allCategories) {
    catalogDemandMap.set(cat.slug, { ...cat, demand: 0, covered: 0 })
  }
  for (const item of priorityList) {
    const cat = suggestCatalog(item.idea, allCategories)
    if (cat && catalogDemandMap.has(cat.slug)) catalogDemandMap.get(cat.slug)!.demand++
  }
  for (const rows of coverageMap.values()) {
    for (const row of rows) {
      if (row.match) {
        const cat = suggestCatalog(row.idea, allCategories)
        if (cat && catalogDemandMap.has(cat.slug)) catalogDemandMap.get(cat.slug)!.covered++
      }
    }
  }
  const catalogDemandList = [...catalogDemandMap.values()]
    .sort((a, b) => (b.demand + b.covered) - (a.demand + a.covered))
  const catPerfMap = new Map(catalogPerf.map(c => [c.slug, c]))

  // S2a: merge allCategories + catalogPerf → แสดงทุก category แม้ query จะ fail
  const displayCatalogPerf: CatalogPerfRow[] = allCategories.map(cat => {
    const perf = catPerfMap.get(cat.slug)
    return perf ?? { slug: cat.slug, name: cat.name, emoji: cat.emoji, template_count: '0', paid_orders: '0', revenue: '0' }
  })

  // S2a Action: top 3 ideas per catalog จาก priorityList ทั้งหมด (exclude rejected + stale)
  type IdeaAction = { idea: string; engineType: string; score: number }
  const catalogIdeaMap = new Map<string, IdeaAction[]>()
  for (const item of priorityList) {
    const lo = item.idea.toLowerCase()
    if (rejectedSet.has(lo) || staleSet.has(lo) || fulfilledSet.has(lo)) continue
    const cat = suggestCatalog(item.idea, allCategories)
    if (!cat) continue
    const list = catalogIdeaMap.get(cat.slug) ?? []
    if (list.length < 3) { list.push({ idea: item.idea, engineType: item.engineType, score: item.score }); catalogIdeaMap.set(cat.slug, list) }
  }

  // ── Sales ─────────────────────────────────────────────────────────────────
  const ALL_TYPES   = ['checklist', 'pipeline', 'form', 'report'] as const
  const typeMap     = new Map(byType.map(r => [r.type_group, r]))
  const gapMap      = new Map(gapData.map(r => [r.engine_type, r]))
  const bestsellers = ranking.filter(r => Number(r.orders) > 0)
  const zeroSale    = ranking.filter(r => Number(r.orders) === 0 && r.status === 'published')
  const maxOrders   = Math.max(...bestsellers.map(r => Number(r.orders)), 1)

  const LEVEL_BADGE: Record<1|2|3, { label: string; color: string }> = {
    1: { label: '🔍 Base',  color: 'bg-indigo-100 text-indigo-700' },
    2: { label: '🔽 Drill', color: 'bg-purple-100 text-purple-700' },
    3: { label: '🔤 ก-ฮ',  color: 'bg-teal-100 text-teal-700' },
  }

  // one card per engineType for coverage section
  const uniqueKwCards = SEED_KEYWORDS.filter(
    (kw, idx, arr) => arr.findIndex(k => k.engineType === kw.engineType) === idx
  )

  return (
    <main className="min-h-screen bg-neutral-50 pb-20">
      <div className="mx-auto max-w-5xl px-4 py-8 space-y-10">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <Link href="/admin" className="text-xs font-bold text-neutral-400 hover:text-black">← Admin</Link>
            <h1 className="mt-1 text-2xl font-black text-black">Market Intelligence</h1>
            <p className="mt-0.5 text-sm text-neutral-500">ตลาดต้องการอะไร + เราครอบแค่ไหน → สร้าง template ที่ถูกจุด</p>
          </div>
          <span
            title={`ระบบดึงข้อมูลจาก Google Suggest ด้วย ${SEED_KEYWORDS.length} seed keywords (checklist/planner/form/report ฯลฯ) × ${ALPHA_CHARS.length} ตัวอักษร = ${SEED_KEYWORDS.length * ALPHA_CHARS.length} queries · ผลลัพธ์ cache ไว้ 1 ชั่วโมง`}
            className="mt-6 cursor-help rounded-full bg-indigo-100 px-3 py-1 text-[10px] font-black text-indigo-700 uppercase"
          >
            {SEED_KEYWORDS.length} keywords · {ALPHA_CHARS.length} alpha · cache 1h
          </span>
        </div>

        {/* ── S1: KPI ─────────────────────────────────────────────────────── */}
        <section>
          <div className="flex items-center gap-3 pb-3 mb-6 border-b border-emerald-100">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500 text-[11px] font-black text-white">01</span>
            <div>
              <p className="text-sm font-bold text-neutral-800">ภาพรวมธุรกิจ</p>
              <p className="text-[10px] text-neutral-400">ยอดขายรวม · จำนวน order · downloads · ลูกค้าที่ไม่ซ้ำ</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            {[
              { label: 'รายได้รวม',     value: `฿${Number(kpi.total_revenue).toLocaleString('th-TH')}`, color: 'text-emerald-700' },
              { label: 'Orders สำเร็จ', value: kpi.paid_orders,     color: 'text-green-700' },
              { label: 'รอชำระ',         value: kpi.pending_orders,  color: 'text-yellow-700' },
              { label: 'ดาวน์โหลด',      value: kpi.total_downloads, color: 'text-blue-700' },
              { label: 'ลูกค้า (LINE)',  value: kpi.unique_buyers,   color: 'text-violet-700' },
            ].map(k => (
              <div key={k.label} className="rounded-2xl border border-neutral-200 bg-white px-4 py-4 shadow-sm">
                <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">{k.label}</p>
                <p className={`mt-1 text-2xl font-black ${k.color}`}>{k.value}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── S2: Revenue by Engine ────────────────────────────────────────── */}
        <section>
          <div className="flex items-center gap-3 pb-3 mb-6 border-b border-teal-100">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-teal-500 text-[11px] font-black text-white">02</span>
            <div>
              <p className="text-sm font-bold text-neutral-800">รายได้แยก Engine</p>
              <p className="text-[10px] text-neutral-400">เปรียบรายได้ระหว่าง Checklist · Planner · Form · Report</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {ALL_TYPES.map(type => {
              const row = typeMap.get(type)
              return (
                <div key={type} className={`rounded-xl border px-4 py-4 ${ENGINE_COLOR[type] ?? 'border-neutral-200 bg-neutral-50'}`}>
                  <p className="font-black capitalize">{ENGINE_LABEL[type] ?? type}</p>
                  <p className="mt-2 text-2xl font-black">฿{Number(row?.revenue ?? 0).toLocaleString('th-TH')}</p>
                  <p className="mt-0.5 text-xs opacity-70">{row?.paid ?? 0} orders paid</p>
                </div>
              )
            })}
          </div>
        </section>

        {/* ── S2a: Catalog Action Cards ─────────────────────────────────────── */}
        <section>
          <div className="flex items-center gap-3 pb-3 mb-6 border-b border-cyan-100">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-cyan-500 text-[11px] font-black text-white">03</span>
            <div>
              <p className="text-sm font-bold text-neutral-800">Catalog — สิ่งที่ควรทำต่อ</p>
              <p className="text-[10px] text-neutral-400">top 3 keyword ที่ตลาดต้องการแต่ยังไม่มี template แยกตาม category</p>
            </div>
          </div>
          {displayCatalogPerf.length === 0 ? (
            <div className="rounded-2xl border border-neutral-200 bg-white px-5 py-6 text-sm text-neutral-400 text-center">— ยังไม่มีข้อมูล catalog</div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {displayCatalogPerf.map(cat => {
                const ideas = catalogIdeaMap.get(cat.slug) ?? []
                return (
                  <div key={cat.slug} className="rounded-xl border border-neutral-200 bg-white px-4 py-4 shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xl">{cat.emoji}</span>
                      <p className="text-xs font-black text-neutral-800 leading-snug">{cat.name}</p>
                    </div>
                    {ideas.length > 0 ? (
                      <div className="space-y-2">
                        {ideas.map(item => (
                          <div key={item.idea} className="flex items-center gap-1.5">
                            <span className={`shrink-0 rounded-full border px-1.5 py-0.5 text-[9px] font-black ${ENGINE_COLOR[item.engineType] ?? 'border-neutral-200 bg-neutral-50 text-neutral-600'}`}>
                              {ENGINE_LABEL[item.engineType] ?? item.engineType}
                            </span>
                            <span className="min-w-0 flex-1 truncate text-[11px] text-neutral-700">{item.idea}</span>
                            <Link
                              href={`/admin/templates/new?title=${encodeURIComponent(item.idea)}&category=${cat.slug}&engine=${item.engineType}`}
                              className="shrink-0 rounded-lg border border-amber-300 px-2 py-0.5 text-[9px] font-black text-amber-700 hover:bg-amber-50"
                            >
                              + สร้าง
                            </Link>
                            <form action={rejectIdeaAction}>
                              <input type="hidden" name="idea" value={item.idea} />
                              <button type="submit" title="ไม่ใช่ template" className="shrink-0 text-[10px] text-neutral-300 hover:text-red-500 transition leading-none">✕</button>
                            </form>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] text-neutral-400">— ยังไม่มี idea ที่ match</p>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* ── S2b: Catalog Demand Heatmap ───────────────────────────────────── */}
        <section>
          <div className="flex items-center gap-3 pb-3 mb-6 border-b border-blue-100">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-500 text-[11px] font-black text-white">04</span>
            <div>
              <p className="text-sm font-bold text-neutral-800">Catalog Heatmap</p>
              <p className="text-[10px] text-neutral-400">ความร้อนแรงของ category เทียบกับ template ที่มีอยู่</p>
            </div>
          </div>
          {catalogDemandList.length === 0 ? (
            <div className="rounded-2xl border border-neutral-200 bg-white px-5 py-6 text-sm text-neutral-400 text-center">— map ไม่ได้ในขณะนี้ (catalog อาจยังไม่มีข้อมูล)</div>
          ) : (
            <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm overflow-hidden divide-y divide-neutral-50">
              {catalogDemandList.map(cat => {
                const total      = cat.demand + cat.covered
                const covPct     = total > 0 ? Math.round((cat.covered / total) * 100) : 0
                const templates  = Number(catPerfMap.get(cat.slug)?.template_count ?? 0)
                const gapStatus  = total === 0
                  ? { label: '⚪ ยังไม่มีข้อมูล', color: 'bg-neutral-100 text-neutral-500' }
                  : cat.demand > 0 && templates === 0
                    ? { label: '📈 Gap สูง',  color: 'bg-red-100 text-red-600' }
                    : cat.demand > 0
                      ? { label: '🟠 บางส่วน', color: 'bg-amber-100 text-amber-700' }
                      : { label: '✅ ครบแล้ว', color: 'bg-green-100 text-green-700' }
                return (
                  <div key={cat.slug} className="flex items-center gap-3 px-5 py-3">
                    <span className="shrink-0 text-lg">{cat.emoji}</span>
                    <span className="flex-1 min-w-0 text-xs font-bold text-neutral-800 truncate">{cat.name}</span>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-black whitespace-nowrap ${gapStatus.color}`}>{gapStatus.label}</span>
                    <span className="shrink-0 text-[9px] text-neutral-400 whitespace-nowrap">demand {cat.demand} · covered {cat.covered} ({covPct}%)</span>
                    <Link href={`/admin/templates/new?category=${cat.slug}`}
                      className="shrink-0 rounded-lg border border-amber-300 bg-amber-50 px-2 py-0.5 text-[9px] font-black text-amber-700 hover:bg-amber-100 transition whitespace-nowrap">
                      + เพิ่ม
                    </Link>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* ── S3: สร้างอะไรก่อน (C: Priority + Cluster + Fulfilled + Trend) ── */}
        <section>
          <div className="flex items-center gap-3 pb-3 mb-6 border-b border-sky-100">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-sky-500 text-[11px] font-black text-white">05</span>
            <div className="flex-1">
              <p className="text-sm font-bold text-neutral-800">สร้างอะไรก่อน</p>
              <p className="text-[10px] text-neutral-400">keyword uncovered ที่คนค้นหาเยอะ — เรียงตาม Priority = level × (100 − coverage%) × demand</p>
            </div>
            {fulfilledRaw.length > 0 && (
              <span className="shrink-0 text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-full px-2.5 py-0.5">
                ✅ {fulfilledRaw.length} fulfilled (30 วัน)
              </span>
            )}
          </div>
          <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm divide-y divide-neutral-50">
            {clusteredList.length === 0 ? (
              <p className="px-5 py-6 text-sm font-bold text-emerald-600 text-center">🎉 ครอบคลุมทุก idea แล้ว!</p>
            ) : clusteredList.map((item, i) => {
              const badge  = priorityBadge(item.score)
              const lBadge = LEVEL_BADGE[item.level]
              const engCol = ENGINE_COLOR[item.engineType] ?? 'border-neutral-200 bg-neutral-50 text-neutral-900'
              const catLink = item.catalog
                ? `/admin/templates/new?title=${encodeURIComponent(item.idea)}&category=${item.catalog.slug}&engine=${item.engineType}`
                : `/admin/templates/new?title=${encodeURIComponent(item.idea)}&engine=${item.engineType}`
              return (
                <div key={i} className="flex items-center gap-2 px-5 py-3">
                  <span className="shrink-0 w-5 text-right text-[10px] font-black text-neutral-300">{i + 1}</span>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-black whitespace-nowrap ${badge.color}`}>{badge.label}</span>
                  <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-black whitespace-nowrap ${engCol}`}>{ENGINE_LABEL[item.engineType] ?? item.engineType}</span>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-black whitespace-nowrap ${lBadge.color}`}>{lBadge.label}</span>
                  {item.catalog && (
                    <span className="shrink-0 rounded-full px-2 py-0.5 text-[9px] font-black bg-neutral-100 text-neutral-600 whitespace-nowrap">
                      📂 {item.catalog.emoji} {item.catalog.name}
                    </span>
                  )}
                  <span className="flex-1 min-w-0 text-xs font-medium text-neutral-800 truncate">{item.idea}</span>
                  {item.demandCount > 1 && (
                    <span className="shrink-0 rounded-full bg-amber-50 border border-amber-200 px-1.5 py-0.5 text-[9px] font-black text-amber-700 whitespace-nowrap">
                      ×{item.demandCount}
                    </span>
                  )}
                  {item.trend !== null && (
                    <span className={`shrink-0 font-mono text-[9px] whitespace-nowrap ${item.trend > 0 ? 'text-emerald-500' : item.trend < 0 ? 'text-red-400' : 'text-neutral-300'}`}>
                      {item.trend > 0 ? `📈+${item.trend}` : item.trend < 0 ? `📉${item.trend}` : '→'}
                    </span>
                  )}
                  <span className="shrink-0 font-mono text-[9px] text-neutral-300">{item.score}pt</span>
                  <form action={recordFulfilledAction}>
                    <input type="hidden" name="idea_text"    value={item.idea} />
                    <input type="hidden" name="catalog_slug" value={item.catalog?.slug ?? ''} />
                    <input type="hidden" name="engine_type"  value={item.engineType} />
                    <input type="hidden" name="redirect_url" value={catLink} />
                    <button type="submit" className="shrink-0 rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-1 text-[9px] font-black text-amber-700 hover:bg-amber-100 transition">
                      + สร้าง
                    </button>
                  </form>
                  <form action={rejectIdeaAction}>
                    <input type="hidden" name="idea" value={item.idea} />
                    <button type="submit" title="ไม่ใช่ template" className="shrink-0 text-[11px] text-neutral-300 hover:text-red-500 transition">✕</button>
                  </form>
                </div>
              )
            })}
          </div>

          {/* Stale ideas (30+ วัน) — ซ่อนชั่วคราว admin กู้คืนได้ */}
          {staleDisplayList.length > 0 && (
            <details className="mt-3">
              <summary className="cursor-pointer text-[10px] font-black text-neutral-400 hover:text-amber-600 select-none">
                ⏳ stale {staleDisplayList.length} ideas (30+ วัน ยังไม่ได้ทำ) — คลิกดู/กู้คืน ▼
              </summary>
              <div className="mt-2 rounded-2xl border border-amber-100 bg-white shadow-sm divide-y divide-neutral-50">
                {staleDisplayList.map((item, i) => (
                  <div key={i} className="flex items-center gap-2 px-5 py-2.5 opacity-60">
                    <span className="flex-1 min-w-0 text-xs text-neutral-700 truncate">{item.idea}</span>
                    <span className="shrink-0 text-[9px] text-amber-500 font-bold">⏳ stale</span>
                    <form action={recordFulfilledAction}>
                      <input type="hidden" name="idea_text"   value={item.idea} />
                      <input type="hidden" name="engine_type" value={item.engineType} />
                      <input type="hidden" name="redirect_url" value={`/admin/templates/new?title=${encodeURIComponent(item.idea)}&engine=${item.engineType}`} />
                      <button type="submit" className="shrink-0 rounded-lg border border-amber-300 bg-amber-50 px-2 py-0.5 text-[9px] font-black text-amber-700 hover:bg-amber-100 transition">+ สร้าง</button>
                    </form>
                  </div>
                ))}
              </div>
            </details>
          )}

          {/* Rejected ideas (admin marked ✕) — กู้คืนได้ */}
          {rejectedRaw.length > 0 && (
            <details className="mt-3">
              <summary className="cursor-pointer text-[10px] font-black text-neutral-400 hover:text-red-600 select-none">
                ❌ rejected {rejectedRaw.length} ideas (admin กด ✕) — คลิกดู/กู้คืน ▼
              </summary>
              <div className="mt-2 rounded-2xl border border-red-100 bg-white shadow-sm divide-y divide-neutral-50">
                {rejectedRaw.map((r, i) => (
                  <div key={i} className="flex items-center gap-3 px-5 py-2.5">
                    <span className="flex-1 min-w-0 text-xs text-neutral-400 line-through truncate">{r.idea_text}</span>
                    <span className="shrink-0 text-[9px] text-neutral-400">
                      {new Date(r.rejected_at).toLocaleDateString('th-TH')}
                    </span>
                    <form action={revertRejectedAction}>
                      <input type="hidden" name="idea" value={r.idea_text} />
                      <button type="submit" className="shrink-0 rounded-lg border border-neutral-200 px-2 py-0.5 text-[9px] font-black text-neutral-500 hover:border-emerald-400 hover:text-emerald-600 transition">↩ กู้คืน</button>
                    </form>
                  </div>
                ))}
              </div>
            </details>
          )}

          {/* Fulfilled history (collapsible) */}
          {fulfilledRaw.length > 0 && (
            <details className="mt-3">
              <summary className="cursor-pointer text-[10px] font-black text-neutral-400 hover:text-neutral-600 select-none">
                ✅ fulfilled this month ({fulfilledRaw.length}) ▼
              </summary>
              <div className="mt-2 rounded-2xl border border-neutral-200 bg-white shadow-sm divide-y divide-neutral-50">
                {fulfilledRaw.slice(0, 10).map((f, i) => (
                  <div key={i} className="flex items-center gap-3 px-5 py-2.5">
                    <span className="text-emerald-500 text-xs">✅</span>
                    <span className="flex-1 min-w-0 text-xs text-neutral-700 truncate">{f.idea_text}</span>
                    <span className="shrink-0 text-[9px] text-neutral-400">
                      {new Date(f.fulfilled_at).toLocaleDateString('th-TH')}
                    </span>
                  </div>
                ))}
              </div>
            </details>
          )}
        </section>

        {/* ── S5: Market Demand (Google Suggest) ───────────────────────────── */}
        <section>
          <div className="flex items-center gap-3 pb-3 mb-6 border-b border-indigo-100">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-500 text-[11px] font-black text-white">06</span>
            <div>
              <p className="text-sm font-bold text-neutral-800">Market Demand</p>
              <p className="text-[10px] text-neutral-400">Google Suggest จริง — คนไทยค้นหาอะไร แยกตามประเภท engine</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {keywordData.map(kw => (
              <div key={kw.key} className={`rounded-2xl border bg-white shadow-sm overflow-hidden ${kw.border}`}>
                {/* Header */}
                <div className={`px-4 py-3 flex flex-wrap items-center gap-2 border-b ${kw.color} ${kw.border}`}>
                  <span className="font-mono font-black text-sm uppercase tracking-wider">{kw.label}</span>
                  <span className={`ml-auto rounded-full px-2.5 py-0.5 text-[10px] font-black ${kw.demandColor}`}>demand {kw.demand}</span>
                  {kw.audiences.map(a => (
                    <span key={a.tag} className={`rounded-full px-2.5 py-0.5 text-[10px] font-black ${a.color}`}>{a.tag}</span>
                  ))}
                </div>
                {/* Template ideas only (no raw Google Suggest table) */}
                <div className="p-4">
                  {kw.ideas.length === 0 ? (
                    <p className="text-xs text-neutral-300 italic">— Google Suggest ไม่มี idea ที่ actionable</p>
                  ) : (
                    <ul className="space-y-1.5">
                      {kw.ideas.map((idea, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <span className="text-amber-500 text-xs shrink-0">→</span>
                          <span className="flex-1 text-xs font-bold text-neutral-800">{idea}</span>
                          <form action={rejectIdeaAction}>
                            <input type="hidden" name="idea" value={idea} />
                            <button type="submit" title="ไม่ใช่ template" className="shrink-0 text-[10px] text-neutral-300 hover:text-red-500 transition leading-none">✕</button>
                          </form>
                        </li>
                      ))}
                    </ul>
                  )}
                  <Link href="/admin/templates/new" className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-neutral-200 px-3 py-1.5 text-[10px] font-black text-neutral-500 hover:border-amber-400 hover:text-amber-600 transition">
                    + สร้าง template →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── S5.5: INTEL-SEO-PANEL ────────────────────────────────────────── */}
        <section>
          <div className="flex items-center gap-3 pb-3 mb-6 border-b border-violet-100">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-violet-500 text-[11px] font-black text-white">07</span>
            <div>
              <p className="text-sm font-bold text-neutral-800">SEO Keyword Panel</p>
              <p className="text-[10px] text-neutral-400">keyword idea + blog title + meta description พร้อม copy → <Link href="/admin/seo/new" className="text-indigo-500 hover:underline">/admin/seo/new</Link></p>
            </div>
          </div>
          <div className="space-y-4">
            {seoGroups.map(grp => grp.items.length === 0 ? null : (
              <div key={grp.engineType} className={`rounded-2xl border bg-white shadow-sm overflow-hidden ${grp.border}`}>
                <div className={`px-5 py-3 border-b ${grp.color} ${grp.border} flex items-center gap-2`}>
                  <span className="font-mono font-black text-sm uppercase tracking-wider">{grp.label}</span>
                  <span className="ml-1 text-[10px] opacity-60">{grp.items.length} keyword suggestions</span>
                </div>
                <div className="divide-y divide-neutral-50">
                  {grp.items.map((item, i) => (
                    <div key={i} className="px-5 py-4">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-black uppercase tracking-wider text-neutral-400 mb-0.5">Target Keyword</p>
                          <p className="text-sm font-black text-neutral-900">{item.targetKeyword}</p>
                        </div>
                        <CopyButton text={item.copyText} />
                      </div>
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-wider text-neutral-400 mb-0.5">Blog Title</p>
                          <p className="text-xs text-neutral-700 leading-snug">{item.blogTitle}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-wider text-neutral-400 mb-0.5">Meta Description</p>
                          <p className="text-xs text-neutral-500 leading-snug">{item.metaDesc}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── S6: Market Gap Matrix ────────────────────────────────────────── */}
        <section>
          <div className="flex items-center gap-3 pb-3 mb-6 border-b border-fuchsia-100">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-fuchsia-500 text-[11px] font-black text-white">08</span>
            <div>
              <p className="text-sm font-bold text-neutral-800">Market Gap</p>
              <p className="text-[10px] text-neutral-400">เทียบ demand ตลาด vs template ที่มีอยู่ → ช่องว่างที่ควรเติมก่อน</p>
            </div>
          </div>
          <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-100 bg-neutral-50 text-left text-[10px] font-black uppercase tracking-wider text-neutral-400">
                  <th className="px-5 py-3">Engine</th>
                  <th className="px-4 py-3">Google Demand</th>
                  <th className="px-4 py-3">Template มีแล้ว</th>
                  <th className="px-4 py-3">ยอดขาย</th>
                  <th className="px-4 py-3">คำแนะนำ</th>
                </tr>
              </thead>
              <tbody>
                {ALL_TYPES.map(type => {
                  const kwData        = keywordData.find(k => k.engineType === type)
                  const gap           = gapMap.get(type)
                  const templateCount = Number(gap?.template_count ?? 0)
                  const totalOrders   = Number(gap?.total_orders ?? 0)
                  const demand        = kwData?.demand ?? 'ต่ำ'
                  const demandColor   = kwData?.demandColor ?? 'bg-neutral-100 text-neutral-500'
                  const noTemplate    = templateCount === 0
                  const lowSale       = templateCount > 0 && totalOrders === 0
                  const action        = noTemplate ? '🟠 สร้าง engine ใหม่' : lowSale ? '🟡 ปรับปรุงหัวข้อ' : '✅ มีอยู่แล้ว'
                  const actionColor   = noTemplate ? 'text-orange-600 font-black' : lowSale ? 'text-amber-600 font-bold' : 'text-emerald-600'
                  const kw            = SEED_KEYWORDS.find(k => k.engineType === type)
                  return (
                    <tr key={type} className="border-b border-neutral-50 hover:bg-neutral-50">
                      <td className="px-5 py-3">
                        <span className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-black ${kw?.color ?? 'bg-neutral-100 text-neutral-700'}`}>{ENGINE_LABEL[type] ?? type}</span>
                      </td>
                      <td className="px-4 py-3"><span className={`rounded-full px-2.5 py-0.5 text-[10px] font-black ${demandColor}`}>{demand}</span></td>
                      <td className="px-4 py-3 text-xs font-bold text-neutral-700">{templateCount} ชิ้น</td>
                      <td className="px-4 py-3 text-xs font-bold text-neutral-700">{totalOrders} orders</td>
                      <td className={`px-4 py-3 text-xs ${actionColor}`}>{action}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* ── S4: ครอบคลุมแค่ไหน ───────────────────────────────────────────── */}
        <section>
          <div className="flex items-center gap-3 pb-3 mb-6 border-b border-pink-100">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-pink-500 text-[11px] font-black text-white">09</span>
            <div>
              <p className="text-sm font-bold text-neutral-800">ครอบคลุมแค่ไหน</p>
              <p className="text-[10px] text-neutral-400">%-coverage keyword แต่ละ engine · 3 ขั้น: Base → Drill-down → Alphabet</p>
            </div>
          </div>
          <div className="space-y-4">
            {uniqueKwCards.map(kw => {
              const rows    = coverageMap.get(kw.engineType) ?? []
              const covered = rows.filter(r => r.match !== null).length
              const total   = rows.length
              const pct     = total > 0 ? Math.round((covered / total) * 100) : 0
              return (
                <details key={kw.engineType} className={`group rounded-2xl border bg-white shadow-sm overflow-hidden ${kw.border}`}>
                  <summary className={`flex cursor-pointer list-none items-center justify-between px-5 py-3 border-b ${kw.border} ${kw.headerBg} select-none`}>
                    <span className={`font-mono font-black text-sm uppercase tracking-wider ${kw.color}`}>{ENGINE_LABEL[kw.engineType] ?? kw.engineType}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-neutral-500">{covered}/{total} ครอบแล้ว</span>
                      <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-black ${pct >= 60 ? 'bg-green-100 text-green-700' : pct >= 30 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-600'}`}>
                        {pct}% covered
                      </span>
                      <span className="inline-block text-neutral-400 text-xs transition-transform duration-150 group-open:rotate-90">▶</span>
                    </div>
                  </summary>
                  {(() => {
                    const catHits = new Map<string, { cat: CatalogRef; count: number }>()
                    for (const row of rows.filter(r => !r.match)) {
                      const cat = suggestCatalog(row.idea, allCategories)
                      if (cat) catHits.set(cat.slug, { cat, count: (catHits.get(cat.slug)?.count ?? 0) + 1 })
                    }
                    const topCats = [...catHits.values()].sort((a, b) => b.count - a.count).slice(0, 3)
                    if (topCats.length === 0) return null
                    return (
                      <div className="flex flex-wrap items-center gap-2 px-5 py-2 bg-white border-b border-neutral-50">
                        <span className="text-[9px] font-black text-neutral-400">📂 Gap หมวด:</span>
                        {topCats.map(({ cat, count }) => (
                          <Link key={cat.slug}
                            href={`/admin/templates/new?category=${cat.slug}&engine=${kw.engineType}`}
                            className="rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[9px] font-bold text-amber-700 hover:bg-amber-100 transition">
                            {cat.emoji} {cat.name} ({count})
                          </Link>
                        ))}
                      </div>
                    )
                  })()}
                  {rows.length === 0 ? (
                    <p className="px-5 py-4 text-xs text-neutral-400 italic">— ไม่มีข้อมูล</p>
                  ) : (
                    <div className="divide-y divide-neutral-50">
                      {rows.map((row, i) => {
                        const badge = LEVEL_BADGE[row.level]
                        return (
                          <div key={i} className="flex items-center gap-3 px-5 py-2.5">
                            <span className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-black whitespace-nowrap ${badge.color}`}>{badge.label}</span>
                            <span className="flex-1 min-w-0 text-xs text-neutral-700 truncate">{row.idea}</span>
                            {row.match ? (
                              <div className="shrink-0 flex items-center gap-2">
                                <span className="text-[10px] text-emerald-600 font-bold truncate max-w-[160px]">✅ {row.match.title}</span>
                                {row.match.orders > 0 && (
                                  <span className="text-[9px] text-neutral-400">{row.match.orders} orders</span>
                                )}
                                <Link href={`/admin/templates/${row.match.id}/edit`} className="text-[9px] text-neutral-400 hover:text-black">แก้ไข →</Link>
                              </div>
                            ) : rejectedSet.has(row.idea.toLowerCase()) ? (
                              <div className="shrink-0 flex items-center gap-2">
                                <span className="text-[10px] text-neutral-300 line-through">rejected</span>
                                <form action={revertRejectedAction}>
                                  <input type="hidden" name="idea" value={row.idea} />
                                  <button type="submit" className="text-[9px] text-neutral-300 hover:text-emerald-500 transition">↩</button>
                                </form>
                              </div>
                            ) : (
                              <div className="shrink-0 flex items-center gap-2">
                                <span className="text-[10px] text-orange-500 font-bold">🟠 ยังไม่มี</span>
                                <Link href="/admin/templates/new" className="rounded-lg border border-amber-300 bg-amber-50 px-2 py-0.5 text-[9px] font-black text-amber-700 hover:bg-amber-100 transition">+ สร้าง</Link>
                                <form action={rejectIdeaAction}>
                                  <input type="hidden" name="idea" value={row.idea} />
                                  <button type="submit" title="ไม่ใช่ template" className="text-[10px] text-neutral-300 hover:text-red-500 transition leading-none">✕</button>
                                </form>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </details>
              )
            })}
          </div>
        </section>

        {/* ── S7: Daily 14d ────────────────────────────────────────────────── */}
        {daily.length > 0 && (
          <section>
            <div className="flex items-center gap-3 pb-3 mb-6 border-b border-orange-100">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-orange-500 text-[11px] font-black text-white">10</span>
              <div>
                <p className="text-sm font-bold text-neutral-800">ยอดขาย 14 วัน</p>
                <p className="text-[10px] text-neutral-400">trend รายวัน orders + revenue ย้อนหลัง 2 สัปดาห์</p>
              </div>
            </div>
            <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-100 text-left text-xs font-bold uppercase tracking-wider text-neutral-400">
                    <th className="pb-2 pr-6">วัน</th><th className="pb-2 pr-6">Orders</th><th className="pb-2">รายได้</th>
                  </tr>
                </thead>
                <tbody>
                  {daily.map(d => (
                    <tr key={String(d.day)} className="border-b border-neutral-50">
                      <td className="py-2 pr-6 font-mono text-neutral-600">{new Date(d.day).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}</td>
                      <td className="py-2 pr-6 font-bold text-neutral-900">{d.orders}</td>
                      <td className="py-2 font-bold text-emerald-700">฿{Number(d.revenue).toLocaleString('th-TH')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* ── S8: Bestseller + Zero-sale ───────────────────────────────────── */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 pb-3 border-b border-amber-100">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-500 text-[11px] font-black text-white">11</span>
            <div>
              <p className="text-sm font-bold text-neutral-800">Bestseller & ยังไม่มียอด</p>
              <p className="text-[10px] text-neutral-400">template ขายดีสุด vs template ที่ยังไม่มีการซื้อเลย</p>
            </div>
          </div>
          {bestsellers.length > 0 && (
            <div>
              <h2 className="mb-3 text-xs font-black uppercase tracking-widest text-neutral-400">🏆 ขายดีสุด</h2>
              <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm divide-y divide-neutral-50">
                {bestsellers.map((t, i) => (
                  <div key={t.id} className="flex items-center gap-4 px-5 py-3.5">
                    <div className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-black ${i === 0 ? 'bg-amber-100 text-amber-700' : i === 1 ? 'bg-neutral-100 text-neutral-600' : i === 2 ? 'bg-orange-100 text-orange-700' : 'bg-neutral-50 text-neutral-400'}`}>{i + 1}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-neutral-800 truncate">{t.title}</p>
                      <div className="mt-1.5 h-1 rounded-full bg-neutral-100">
                        <div className="h-1 rounded-full bg-indigo-400" style={{ width: `${Math.round((Number(t.orders) / maxOrders) * 100)}%` }} />
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-black text-sm text-indigo-600">{t.orders} orders</p>
                      <p className="text-[10px] text-neutral-400">฿{Number(t.revenue).toLocaleString()} · {t.downloads} DL</p>
                    </div>
                    <Link href={`/admin/templates/${t.id}/edit`} className="shrink-0 rounded-xl border border-neutral-200 px-3 py-1.5 text-[10px] font-black text-neutral-500 hover:border-indigo-400 hover:text-indigo-600 transition">แก้ไข</Link>
                  </div>
                ))}
              </div>
            </div>
          )}
          {zeroSale.length > 0 && (
            <div>
              <div className="mb-3 flex items-center gap-3">
                <h2 className="text-xs font-black uppercase tracking-widest text-neutral-400">⚠️ ยังไม่มียอดขาย</h2>
                <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-[10px] font-black text-red-600">{zeroSale.length} template</span>
              </div>
              <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm divide-y divide-neutral-50">
                {zeroSale.map(t => (
                  <div key={t.id} className="flex items-center gap-4 px-5 py-3.5">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-neutral-700 truncate">{t.title}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="rounded-full bg-green-100 px-2 py-0.5 text-[9px] font-black uppercase text-green-700">published</span>
                        <span className="text-[10px] text-neutral-400">฿{t.price_baht} · {ENGINE_LABEL[t.engine_type] ?? t.engine_type}</span>
                      </div>
                    </div>
                    <Link href={`/admin/templates/${t.id}/edit`} className="shrink-0 rounded-xl border border-red-200 bg-red-50 px-3 py-1.5 text-[10px] font-black text-red-600 hover:bg-red-100 transition">ปรับปรุง →</Link>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* ── S9: INTEL-SCORE Template Health Check ────────────────────────── */}
        <section>
          <div className="flex items-center gap-3 pb-3 mb-6 border-b border-red-100">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-red-500 text-[11px] font-black text-white">12</span>
            <div className="flex-1">
              <p className="text-sm font-bold text-neutral-800">Template Health Check</p>
              <p className="text-[10px] text-neutral-400">คะแนนความพร้อม 5 มิติ/100 · เรียงจากแย่→ดี · คลิกแถวดู breakdown</p>
            </div>
            <div className="flex items-center gap-1.5">
              {redCount    > 0 && <span className="rounded-full bg-red-100    px-2.5 py-0.5 text-[10px] font-black text-red-600">🔴 {redCount}</span>}
              {yellowCount > 0 && <span className="rounded-full bg-amber-100  px-2.5 py-0.5 text-[10px] font-black text-amber-600">🟡 {yellowCount}</span>}
              {greenCount  > 0 && <span className="rounded-full bg-green-100  px-2.5 py-0.5 text-[10px] font-black text-green-600">🟢 {greenCount}</span>}
            </div>
          </div>
            <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm divide-y divide-neutral-50">
              {scoredTemplates.map(t => {
                const topIssue      = t.health.dims.find(d => d.issues.length > 0)?.issues[0]
                const barColor      = t.health.grade === '🟢' ? 'bg-green-400' : t.health.grade === '🟡' ? 'bg-amber-400' : 'bg-red-400'
                const topFailing    = [...t.health.dims].filter(d => d.issues.length > 0).sort((a, b) => (b.max - b.score) - (a.max - a.score))[0]
                const potentialGain = topFailing ? topFailing.max - topFailing.score : 0
                return (
                  <details key={t.id} className="group">
                    <summary className="flex cursor-pointer list-none items-center gap-3 px-5 py-3 hover:bg-neutral-50 select-none">
                      <span className="shrink-0 text-base leading-none">{t.health.grade}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-neutral-800 truncate">{t.title}</p>
                        <div className="mt-1 flex items-center gap-2">
                          <div className="h-1 w-20 rounded-full bg-neutral-100">
                            <div className={`h-1 rounded-full ${barColor}`} style={{ width: `${t.health.total}%` }} />
                          </div>
                          <span className="text-[10px] font-mono text-neutral-400">{t.health.total}/100</span>
                          {topIssue && <span className="text-[10px] text-orange-500 truncate max-w-[180px]">⚠ {topIssue}</span>}
                        </div>
                      </div>
                      <Link
                        href={`/admin/templates/${t.id}/edit`}
                        className="shrink-0 rounded-xl border border-neutral-200 px-3 py-1.5 text-[9px] font-black text-neutral-500 hover:border-indigo-400 hover:text-indigo-600 transition"
                      >
                        แก้ไข
                      </Link>
                    </summary>
                    <div className="border-t border-neutral-50 px-5 py-4 bg-neutral-50/80">
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                        {t.health.dims.map(dim => (
                          <div key={dim.name} className="rounded-xl border border-neutral-200 bg-white px-3 py-3">
                            <p className="text-[9px] font-black uppercase tracking-wider text-neutral-400">{dim.name}</p>
                            <p className={`mt-1 text-xl font-black ${dim.score >= dim.max ? 'text-green-600' : dim.score >= dim.max * 0.5 ? 'text-amber-600' : 'text-red-500'}`}>
                              {dim.score}<span className="text-[10px] font-normal text-neutral-400">/{dim.max}</span>
                            </p>
                            {dim.issues.length > 0 ? (
                              <ul className="mt-1.5 space-y-0.5">
                                {dim.issues.map((iss, j) => (
                                  <li key={j} className="text-[9px] text-orange-500 leading-snug">⚠ {iss}</li>
                                ))}
                              </ul>
                            ) : (
                              <p className="mt-1 text-[9px] text-green-500">✅ ผ่าน</p>
                            )}
                          </div>
                        ))}
                      </div>
                      {topFailing && t.health.total < 100 && (
                        <p className="mt-3 text-[10px] font-bold text-indigo-600">
                          💡 แก้ {topFailing.name} ก่อน → score ~{Math.min(100, t.health.total + potentialGain)} pts
                        </p>
                      )}
                    </div>
                  </details>
                )
              })}
            </div>
            {scoredTemplates.length === 0 && (
              <div className="rounded-2xl border border-neutral-200 bg-white px-5 py-8 text-center text-sm text-neutral-400">
                — ยังไม่มี published template · เพิ่ม template แล้ว publish ก่อน
              </div>
            )}
          </section>

      </div>
    </main>
  )
}
