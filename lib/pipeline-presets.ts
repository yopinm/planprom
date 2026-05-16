import type { PlannerPipelineDataV4, PipelineHorizon } from './engine-types'

export type ArchetypeId = 'one-shot' | 'accumulate' | 'habit' | 'project' | 'growth' | 'life-ops'
export type PresetStatus = 'draft' | 'tested' | 'active' | 'validated'

export interface PipelineArchetype {
  id: ArchetypeId
  name: string
  emoji: string
  description: string
  defaultHorizon: PipelineHorizon
}

export interface PresetDefaults {
  horizon: PipelineHorizon
  goal: string
  why: string
  deadline: string
  displayTitle: string
  description: string
  colorTheme: PlannerPipelineDataV4['meta']['colorTheme']
  reviewQuestions: string[]
}

export interface PipelinePreset {
  id: string
  name: string
  emoji: string
  description: string
  archetypeId: ArchetypeId
  catSlugs: string[]
  status: PresetStatus
  optional_extensions?: string[]
  defaults: PresetDefaults
}

export const ARCHETYPES: PipelineArchetype[] = [
  {
    id: 'one-shot',
    name: 'One-Shot',
    emoji: '🎯',
    description: 'ทำครั้งเดียวให้เสร็จ เช่น ท่องเที่ยว, event',
    defaultHorizon: 'project',
  },
  {
    id: 'accumulate',
    name: 'Accumulate',
    emoji: '📈',
    description: 'สะสมทีละน้อย เช่น ออม, เรียน, ฝึกทักษะ',
    defaultHorizon: 'monthly',
  },
  {
    id: 'habit',
    name: 'Habit',
    emoji: '🔄',
    description: 'ทำซ้ำ routine เช่น ออกกำลังกาย, สุขภาพ',
    defaultHorizon: 'monthly',
  },
  {
    id: 'project',
    name: 'Project',
    emoji: '🏗️',
    description: 'หลาย phase ซับซ้อน เช่น startup, IT, ก่อสร้าง',
    defaultHorizon: 'project',
  },
  {
    id: 'growth',
    name: 'Growth',
    emoji: '🚀',
    description: 'เติบโต/ขยาย เช่น ธุรกิจ, content, brand',
    defaultHorizon: 'monthly',
  },
  {
    id: 'life-ops',
    name: 'Life-Ops',
    emoji: '🏠',
    description: 'ดูแลชีวิตโดยรวม เช่น การเงิน, ครอบครัว',
    defaultHorizon: 'monthly',
  },
]

export const PRESETS: PipelinePreset[] = [
  {
    id: 'travel_plan',
    name: 'วางแผนท่องเที่ยว',
    emoji: '✈️',
    description: 'แพลนเนอร์ trip ครบ: เป้าหมาย → แผนรายวัน → budget → checklist',
    archetypeId: 'one-shot',
    catSlugs: ['travel', 'lifestyle'],
    status: 'active',
    defaults: {
      horizon: 'project',
      goal: 'วางแผนเที่ยว [จุดหมาย] ให้ครบทุกด้าน ทั้ง budget / ที่พัก / กิจกรรม',
      why: 'เพื่อให้ทริปเป็นไปตามแผน ไม่เกิน budget และได้ประสบการณ์ที่ดีที่สุด',
      deadline: '[วันสุดท้ายของทริป]',
      displayTitle: 'Travel Planner — [จุดหมาย]',
      description: 'แพลนเนอร์ท่องเที่ยวครบจบ ตั้งแต่เป้าหมายทริป งบประมาณ แผนรายวัน จนถึง checklist ก่อนออกเดินทาง',
      colorTheme: 'amber',
      reviewQuestions: [
        'ทริปเป็นไปตามแผนไหม? สิ่งที่ดีที่สุดคืออะไร?',
        'สิ่งที่ควรปรับปรุงสำหรับทริปหน้าคืออะไร?',
        'งบใช้จริงเป็นอย่างไรเทียบกับที่วางแผนไว้?',
      ],
    },
  },
  {
    id: 'savings_goal',
    name: 'ออมเงินเป้าหมาย',
    emoji: '💰',
    description: 'แพลนเนอร์ออมเงินรายเดือน มีเป้า มีแผน มีติดตาม',
    archetypeId: 'accumulate',
    catSlugs: ['finance', 'savings'],
    status: 'active',
    defaults: {
      horizon: 'monthly',
      goal: 'ออมเงินให้ถึง ฿[จำนวนเป้าหมาย] เพื่อ[จุดประสงค์]',
      why: 'สร้างความมั่นคงทางการเงินและบรรลุเป้าหมายสำคัญในชีวิต',
      deadline: '[เดือน/ปีที่ต้องการถึงเป้า]',
      displayTitle: 'Savings Goal Planner ฿[จำนวน]',
      description: 'แพลนเนอร์ออมเงินรายเดือน ติดตามยอดออม รายรับ-รายจ่าย และความคืบหน้าสู่เป้าหมาย',
      colorTheme: 'emerald',
      reviewQuestions: [
        'เดือนนี้ออมได้เท่าไหร่? เทียบกับเป้าเดือนเป็นอย่างไร?',
        'รายจ่ายส่วนไหนที่ลดได้ในเดือนหน้า?',
        'ยอดออมสะสมรวมตอนนี้เท่าไหร่? เหลืออีกเท่าไหร่ถึงเป้า?',
      ],
    },
  },
  {
    id: 'study_exam',
    name: 'เตรียมสอบ',
    emoji: '📚',
    description: 'แพลนเนอร์เตรียมสอบ แบ่ง phase อ่านหนังสือ ทบทวน mock test',
    archetypeId: 'accumulate',
    catSlugs: ['study', 'education'],
    status: 'active',
    defaults: {
      horizon: 'project',
      goal: 'เตรียมสอบ[ชื่อสอบ] ให้ได้คะแนนผ่าน/[เกรดที่ต้องการ]',
      why: 'เปิดโอกาสใหม่ในชีวิต การศึกษา หรืออาชีพที่ต้องการ',
      deadline: '[วันสอบ]',
      displayTitle: 'Study Planner — [ชื่อสอบ]',
      description: 'แพลนเนอร์เตรียมสอบครบ 3 phase: เรียนเนื้อหา → ทบทวน → Mock test พร้อม daily routine และ review',
      colorTheme: 'violet',
      reviewQuestions: [
        'ทบทวนเนื้อหาได้ครบตามแผนไหม? หัวข้อไหนยังไม่แน่ใจ?',
        'ทำ mock test แล้วได้คะแนนเท่าไหร่? จุดอ่อนอยู่ตรงไหน?',
        'ต้องปรับแผนการเรียนอะไรก่อนสอบ?',
      ],
    },
  },
  {
    id: 'fitness_habit',
    name: 'Fitness & Wellness',
    emoji: '🏋️',
    description: 'แพลนเนอร์ออกกำลังกาย/สุขภาพ รายสัปดาห์-รายเดือน',
    archetypeId: 'habit',
    catSlugs: ['health', 'fitness'],
    status: 'active',
    defaults: {
      horizon: 'monthly',
      goal: 'ออกกำลังกาย[จำนวน]ครั้ง/สัปดาห์ และ[เป้าหมายสุขภาพ] ภายใน[เดือน]เดือน',
      why: 'สุขภาพดีทำให้มีพลังงานทำงานและใช้ชีวิตได้อย่างเต็มที่',
      deadline: '[เดือน/ปีที่ต้องการเห็นผล]',
      displayTitle: 'Fitness Planner — [เดือน]',
      description: 'แพลนเนอร์ออกกำลังกายและดูแลสุขภาพรายเดือน มีตาราง routine รายวัน และติดตามความคืบหน้ารายสัปดาห์',
      colorTheme: 'emerald',
      reviewQuestions: [
        'สัปดาห์นี้ออกกำลังกายครบตามแผนไหม? กี่ครั้ง?',
        'ร่างกายตอบสนองอย่างไร? มีอาการเจ็บหรือเหนื่อยผิดปกติไหม?',
        'ต้องปรับ workout หรือ routine อะไรสัปดาห์หน้า?',
      ],
    },
  },
  {
    id: 'business_launch',
    name: 'เปิดตัวธุรกิจ',
    emoji: '🏪',
    description: 'แพลนเนอร์เปิดธุรกิจ/สินค้าใหม่ ตั้งแต่วางแผนถึง launch',
    archetypeId: 'project',
    catSlugs: ['business'],
    status: 'active',
    defaults: {
      horizon: 'project',
      goal: 'เปิดตัว[ชื่อธุรกิจ/สินค้า] และมียอดขาย/ลูกค้า[เป้าหมาย]ภายใน[ระยะเวลา]',
      why: 'สร้างรายได้เสริม/ธุรกิจหลักที่มั่นคงและยั่งยืนในระยะยาว',
      deadline: '[วัน launch หรือเดือนที่ต้องการเปิดตัว]',
      displayTitle: 'Business Launch Planner — [ชื่อธุรกิจ]',
      description: 'แพลนเนอร์เปิดตัวธุรกิจครบ 4 phase: Research → Build → Launch → Growth พร้อม big rocks และ milestone สำคัญ',
      colorTheme: 'amber',
      reviewQuestions: [
        'milestone สำคัญในสัปดาห์นี้สำเร็จหรือไม่?',
        'ปัญหาหรืออุปสรรคที่เจอคืออะไร? แก้ได้อย่างไร?',
        'แผนสัปดาห์หน้าที่ต้องโฟกัสคืออะไร?',
      ],
    },
  },
  {
    id: 'enterprise_it',
    name: 'Enterprise IT / ERP',
    emoji: '🖥️',
    description: 'แพลนเนอร์ implement ERP/SAP/ระบบ IT ระดับองค์กร',
    archetypeId: 'project',
    catSlugs: ['business', 'it'],
    status: 'active',
    optional_extensions: [
      'stakeholder_matrix',
      'risk_register',
      'change_mgmt_plan',
      'cutover_checklist',
      'uat_plan',
      'training_plan',
    ],
    defaults: {
      horizon: 'project',
      goal: 'Implement [ระบบ ERP/IT] ให้ Go-Live ได้ตามกำหนด ครบตาม scope และ budget',
      why: 'ยกระดับ operation ขององค์กร ลด manual work และเพิ่ม data visibility',
      deadline: '[วัน Go-Live]',
      displayTitle: 'ERP Implementation Planner — [ชื่อโปรเจกต์]',
      description: 'แพลนเนอร์ Implement ระบบ ERP/IT ระดับองค์กร ครอบคลุม phases: Blueprint → Realization → Testing → Go-Live → Hypercare',
      colorTheme: 'violet',
      reviewQuestions: [
        'Sprint/milestone นี้ deliver ได้ครบตาม scope ไหม? มี blocker อะไร?',
        'Risk ที่ระบุไว้มีอันไหน trigger ขึ้นมาบ้าง? action plan คืออะไร?',
        'Change request ใหม่มีกระทบ timeline/budget ไหม? ตัดสินใจอย่างไร?',
      ],
    },
  },
  {
    id: 'content_creator',
    name: 'Content Creator',
    emoji: '🎬',
    description: 'แพลนเนอร์สร้าง content รายเดือน มีเป้า มีแผน มีติดตาม',
    archetypeId: 'growth',
    catSlugs: ['content', 'marketing'],
    status: 'active',
    defaults: {
      horizon: 'monthly',
      goal: 'สร้าง content [จำนวน] ชิ้น/เดือน บน[platform] เพื่อเพิ่ม[follower/engagement/ยอดขาย]',
      why: 'สร้าง personal brand และ passive income จาก content ที่มีคุณภาพ',
      deadline: '[เดือน/ปีที่ต้องการเห็นผลลัพธ์]',
      displayTitle: 'Content Planner — [เดือน]',
      description: 'แพลนเนอร์ content creator รายเดือน วางแผน content calendar สัปดาห์ต่อสัปดาห์ พร้อม review metrics',
      colorTheme: 'rose',
      reviewQuestions: [
        'สัปดาห์นี้ publish content ได้ครบแผนไหม? ชิ้นไหน performance ดีที่สุด?',
        'ตัวเลข engagement/reach เป็นอย่างไรเทียบกับสัปดาห์ที่แล้ว?',
        'ไอเดีย content สำหรับสัปดาห์หน้าที่น่าสนใจที่สุดคืออะไร?',
      ],
    },
  },
  {
    id: 'personal_finance',
    name: 'การเงินส่วนตัว',
    emoji: '💳',
    description: 'แพลนเนอร์ดูแลการเงินรายเดือน รายรับ-รายจ่าย-ออม-ลงทุน',
    archetypeId: 'life-ops',
    catSlugs: ['finance', 'lifestyle'],
    status: 'active',
    defaults: {
      horizon: 'monthly',
      goal: 'ดูแลการเงินให้สมดุล: รายจ่าย < รายรับ ออมอย่างน้อย [X]% ทุกเดือน',
      why: 'มีเงินสำรองฉุกเฉิน 6 เดือน และเดินหน้าสู่อิสรภาพทางการเงิน',
      deadline: '[ปลายเดือน/ปีที่ต้องการทบทวน]',
      displayTitle: 'Personal Finance Planner — [เดือน]',
      description: 'แพลนเนอร์การเงินส่วนตัวรายเดือน ครอบคลุมรายรับ รายจ่าย เงินออม และการลงทุน',
      colorTheme: 'emerald',
      reviewQuestions: [
        'เดือนนี้รายจ่ายเกิน budget ไหม? หมวดไหนเกินมากที่สุด?',
        'ออมได้ตามเป้าไหม? ยอดสะสมรวมตอนนี้เท่าไหร่?',
        'เดือนหน้าจะตัดรายจ่ายอะไรและเพิ่มรายรับจากช่องทางไหน?',
      ],
    },
  },
  {
    id: 'family_planner',
    name: 'Family Planner',
    emoji: '👨‍👩‍👧',
    description: 'แพลนเนอร์ครอบครัว กิจกรรม วันสำคัญ งบประมาณ routine',
    archetypeId: 'life-ops',
    catSlugs: ['family', 'lifestyle'],
    status: 'active',
    defaults: {
      horizon: 'monthly',
      goal: 'วางแผนกิจกรรมและชีวิตครอบครัวในเดือน[เดือน] ให้ครบทุกด้าน',
      why: 'สร้างช่วงเวลาคุณภาพกับครอบครัว ไม่พลาดวันสำคัญ และดูแลทุกคนได้อย่างดี',
      deadline: '[ปลายเดือน/ปีที่ต้องการ]',
      displayTitle: 'Family Planner — [เดือน]',
      description: 'แพลนเนอร์ครอบครัวรายเดือน จัดตารางกิจกรรม วันสำคัญ งบประมาณ และ routine ของทุกคนในบ้าน',
      colorTheme: 'sky',
      reviewQuestions: [
        'กิจกรรมครอบครัวที่วางแผนไว้ทำได้ครบไหม?',
        'วันสำคัญหรือนัดหมายที่พลาดไปมีอะไรบ้าง?',
        'เดือนหน้าอยากทำอะไรพิเศษด้วยกันในครอบครัว?',
      ],
    },
  },
]

// Catalog slug → recommended preset IDs (first = primary suggestion)
export const CAT_SLUG_TO_PRESETS: Record<string, string[]> = {
  travel:    ['travel_plan'],
  finance:   ['savings_goal', 'personal_finance'],
  savings:   ['savings_goal'],
  study:     ['study_exam'],
  education: ['study_exam'],
  health:    ['fitness_habit'],
  fitness:   ['fitness_habit'],
  business:  ['business_launch', 'enterprise_it'],
  it:        ['enterprise_it'],
  content:   ['content_creator'],
  marketing: ['content_creator'],
  family:    ['family_planner'],
  lifestyle: ['personal_finance', 'family_planner'],
}

// Decision tree node types
export type DTNode =
  | { type: 'question'; id: string; text: string; options: { label: string; emoji: string; next: string }[] }
  | { type: 'result'; id: string; presetIds: string[] }

export const DECISION_TREE: Record<string, DTNode> = {
  start: {
    type: 'question',
    id: 'start',
    text: 'แผนนี้มีวันสิ้นสุดชัดเจนไหม?',
    options: [
      { label: 'ใช่ มีกำหนดเสร็จ',          emoji: '📅', next: 'q2' },
      { label: 'ไม่มี ทำซ้ำไปเรื่อย ๆ',    emoji: '🔄', next: 'q3' },
    ],
  },
  q2: {
    type: 'question',
    id: 'q2',
    text: 'แผนซับซ้อนแค่ไหน?',
    options: [
      { label: 'หลาย phase / ทีม / stakeholder', emoji: '🏗️', next: 'q4' },
      { label: 'เรียบง่าย เป้าเดียว',             emoji: '🎯', next: 'q5' },
    ],
  },
  q3: {
    type: 'question',
    id: 'q3',
    text: 'รูปแบบหลักคืออะไร?',
    options: [
      { label: 'สร้าง routine / ออกกำลังกาย',  emoji: '🏋️', next: 'r_habit' },
      { label: 'ดูแลการเงิน / ครอบครัว',       emoji: '🏠', next: 'r_lifeops' },
      { label: 'เติบโต / สร้าง content',        emoji: '🚀', next: 'r_growth' },
    ],
  },
  q4: {
    type: 'question',
    id: 'q4',
    text: 'ประเภทโปรเจกต์?',
    options: [
      { label: 'IT / ERP / Software',    emoji: '🖥️', next: 'r_enterprise' },
      { label: 'เปิดธุรกิจ / สินค้าใหม่', emoji: '🏪', next: 'r_business' },
    ],
  },
  q5: {
    type: 'question',
    id: 'q5',
    text: 'เป้าหมายหลักคืออะไร?',
    options: [
      { label: 'สะสม / ออม / เรียน / ฝึก', emoji: '📈', next: 'r_accumulate' },
      { label: 'วางแผนเที่ยว / event',      emoji: '✈️', next: 'r_travel' },
      { label: 'เตรียมสอบ',                  emoji: '📚', next: 'r_study' },
    ],
  },
  r_habit:      { type: 'result', id: 'r_habit',      presetIds: ['fitness_habit'] },
  r_lifeops:    { type: 'result', id: 'r_lifeops',    presetIds: ['personal_finance', 'family_planner'] },
  r_growth:     { type: 'result', id: 'r_growth',     presetIds: ['content_creator', 'business_launch'] },
  r_enterprise: { type: 'result', id: 'r_enterprise', presetIds: ['enterprise_it'] },
  r_business:   { type: 'result', id: 'r_business',   presetIds: ['business_launch'] },
  r_accumulate: { type: 'result', id: 'r_accumulate', presetIds: ['savings_goal', 'study_exam'] },
  r_travel:     { type: 'result', id: 'r_travel',     presetIds: ['travel_plan'] },
  r_study:      { type: 'result', id: 'r_study',      presetIds: ['study_exam'] },
}

export function getPresetById(id: string): PipelinePreset | undefined {
  return PRESETS.find(p => p.id === id)
}

export function getPresetsForCatSlug(catSlug: string): PipelinePreset[] {
  const ids = CAT_SLUG_TO_PRESETS[catSlug] ?? []
  return ids.map(id => PRESETS.find(p => p.id === id)).filter((p): p is PipelinePreset => !!p)
}

export function getArchetypeById(id: ArchetypeId): PipelineArchetype | undefined {
  return ARCHETYPES.find(a => a.id === id)
}
