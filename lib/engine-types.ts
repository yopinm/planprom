// lib/engine-types.ts — shared types for Checklist + Planner engines

export type ChecklistEngineData = {
  s1: { title: string; docCode: string; version: string; createdDate: string; author: string }
  s2: { purpose: string; context: string; prerequisites: string }
  s3: { items: string[] }
  s5: { executorRole: string; reviewerRole: string }
}

export type QuarterlyTheme = { quarter: string; theme: string; keyActions: string }

// ── Planner Engine v1 (frozen — do not modify) ─────────────────────────────
export type PlannerEngineData = {
  p1: {
    plannerTitle: string
    description: string
    period: 'yearly' | 'quarterly' | 'monthly' | 'weekly'
    framework: 'SMART' | 'OKR' | 'both' | 'none'
    yearlyGoals: string[]
    quarterlyThemes: QuarterlyTheme[]
    bigRocks: string[]
  }
  p2: {
    views: ('monthly' | 'weekly' | 'daily')[]
    daysPerPage: number
    focusAreas: string[]
    includeEisenhower: boolean
  }
  p3: {
    habitNames: string[]
    includeMoodTracker: boolean
    financeCategories: string[]
    reviewCycle: 'weekly' | 'monthly' | 'both'
    reviewQuestions: string[]
  }
  p4: {
    projectAreas: string[]
    includeGratitudeJournal: boolean
    gratitudePrompts: string[]
    notesStyle: 'lined' | 'dotgrid' | 'blank'
    brainDumpPages: number
  }
}

// ── Planner Engine v2 ──────────────────────────────────────────────────────

export type PlanningHorizon = 'year' | 'month' | 'week' | 'day'

export type PlannerMeta = {
  schemaVersion: '2.0'
  planningHorizon: PlanningHorizon
  displayTitle: string
  description: string
  colorTheme: 'violet' | 'indigo' | 'emerald' | 'rose' | 'amber'
  coverPage: boolean
  howToUse: boolean
}

export type PlannerSegment = { label: string; theme: string; keyActions: string }

export type PlannerAxis1 = {
  roadmap: PlannerSegment[]
  goalItems: string[]
  showKpiLine: boolean
  bigRocks: string[]
}

export type PlannerDecisionMatrix = { question: string; options: string[] }

export type PlannerAxis2 = {
  decisions: PlannerDecisionMatrix[]
  extraBigRocks: string[]
}

export type PlannerAxis3 = {
  habitTracker: { habits: string[]; days: number }
  includeMoodTracker: boolean
  financeTracker: { categories: { name: string; type: 'income' | 'expense' }[] }
  reviewCycle: 'daily' | 'weekly' | 'monthly'
  reviewQuestions: string[]
}

export type PlannerAxis4 = {
  checklist: { phase: string; items: string[] }[]
  packingList: { category: string; items: string[] }[]
  ideaBoard: boolean
}

export type PlannerAxis5 = {
  dailyDiary: { enabled: boolean; days: number }
  reviewQuestions: string[]
  notesStyle: 'lined' | 'dotgrid' | 'blank'
  notesPages: number
  includeGratitudeJournal: boolean
  gratitudePrompts: string[]
}

export type PlannerEngineDataV2 = {
  meta: PlannerMeta
  axis1: PlannerAxis1
  axis2?: PlannerAxis2
  axis3?: PlannerAxis3
  axis4?: PlannerAxis4
  axis5: PlannerAxis5
  extras?: Record<string, unknown>
}
