// lib/engine-report-types.ts — Report Engine types (RE-1)

export type ReportKpi = {
  label: string
  value: string
  unit: string
}

export type ReportTableData = {
  title: string
  headers: string[]
  rows: string[][]
}

export type ReportTextBlock = {
  title: string
  body: string
}

export type ReportEngineData = {
  s1: {
    reportTitle: string
    subtitle: string
    organization: string
    confidentialLevel: 'public' | 'internal' | 'confidential' | 'strictly_confidential'
    validityMonths: number
  }
  s3: {
    kpis: ReportKpi[]
    summaryText: string
    keyFindings: string[]
    urgentRecommendations: string
  }
  s4: {
    objective: string
    scope: string
    dataSource: string
    dataPeriod: string
    methodology: string
    limitations: string
  }
  s5: {
    tables: ReportTableData[]
    textBlocks: ReportTextBlock[]
  }
  s6: {
    conclusion: string
    findings: string[]
    recommendations: string
    risks: string
    forecast: string
    scoreRating: string
  }
  s7: {
    rawData: string
    references: string
    glossary: string
    analystProfile: string
  }
  s8: {
    analystName: string
    analystTitle: string
    disclaimer: string
    companyName: string
    contactEmail: string
    contactPhone: string
    contactWebsite: string
  }
}
