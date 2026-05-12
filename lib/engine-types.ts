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

// ── Planner Pipeline v3 ──────────────────────────────────────────────────────

export type PipelinePhase = {
  name: string
  timeRange: string
  tasks: string[]
  budget?: string
}

export type PipelineBigRock = {
  task: string
  deadline: string
}

export type PipelineMetric = {
  name: string
  target: string
  frequency: 'daily' | 'weekly' | 'monthly'
}

export type PlannerPipelineData = {
  meta: {
    schemaVersion: '3.0'
    mode: 'pipeline'
    title: string
    description: string
    colorTheme: 'violet' | 'rose' | 'emerald' | 'amber' | 'sky'
    coverPage: boolean
  }
  stage1_goal: {
    bigGoal: string
    deadline: string
    why: string
    successCriteria: string[]
    constraints: {
      budget?: string
      timeLimit?: string
      others?: string[]
    }
  }
  stage2_plan: {
    phases: PipelinePhase[]
    bigRocks: PipelineBigRock[]
  }
  stage3_track: {
    habits: string[]
    metrics: PipelineMetric[]
    reviewCycle: 'daily' | 'weekly' | 'monthly'
    reviewQuestions: string[]
    adjustmentRules?: string[]
  }
  notes?: {
    diaryDays: number
    notesPages: number
    notesStyle: 'lined' | 'dotgrid' | 'blank'
  }
  extras?: Record<string, unknown>
}

// ── Planner Pipeline v4 ──────────────────────────────────────────────────────

export type PipelineHorizon = 'yearly' | 'monthly' | 'project'
export type PipelineWeeklyLayout = 'simple' | '135rule' | 'timeblock'
export type PipelineDailyLayout = 'todo' | 'timeblock' | 'combined'

export type PlannerPipelineDataV4 = {
  meta: {
    schemaVersion: '4.0'
    mode: 'pipeline'
    title: string
    description: string
    colorTheme: 'violet' | 'rose' | 'emerald' | 'amber' | 'sky'
    coverPage: boolean
  }
  s1_goal: {
    goal: string
    why: string
    deadline: string
    horizon: PipelineHorizon
    horizonValue: string
  }
  s2_timeplan: {
    year?: string
    month?: string
    phases?: PipelinePhase[]
    bigRocks?: PipelineBigRock[]
  }
  s3_weekly: {
    weekCount: number
    layout: PipelineWeeklyLayout
  }
  s4_daily: {
    dayCount: number
    layout: PipelineDailyLayout
  }
  s5_review: {
    reviewCycle: 'daily' | 'weekly' | 'monthly'
    reviewQuestions: string[]
  }
}
