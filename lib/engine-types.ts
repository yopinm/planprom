// lib/engine-types.ts — shared types for Checklist + Planner engines

export type ChecklistEngineData = {
  s1: { title: string; docCode: string; version: string; createdDate: string; author: string }
  s2: { purpose: string; context: string; prerequisites: string }
  s3: { items: string[] }
  s5: { executorRole: string; reviewerRole: string }
}

export type QuarterlyTheme = { quarter: string; theme: string; keyActions: string }

export type PlannerEngineData = {
  p1: {
    plannerTitle: string
    description: string
    period: 'yearly' | 'quarterly' | 'monthly' | 'weekly'
    framework: 'SMART' | 'OKR' | 'both' | 'none'
    yearlyGoals: string[]
    quarterlyThemes: QuarterlyTheme[]
    bigRocks: string[]
    planCode?: string
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
