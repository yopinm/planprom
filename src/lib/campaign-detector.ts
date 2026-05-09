// FB-CAMPAIGN-DETECT-1: detects Thai e-commerce campaign windows and signals
// when admin should enable Campaign Mode on Facebook.

export interface CampaignWindow {
  name: string
  label: string
  month: number
  dayStart: number
  dayEnd: number
}

export interface ActiveCampaign {
  name: string
  label: string
  /** 0 = active today, >0 = starts in N days */
  daysUntil: number
  active: boolean
}

/** Days in advance to alert admin before campaign starts */
export const CAMPAIGN_ADVANCE_DAYS = 3

/** Known Thai e-commerce mega-campaign windows (month/day inclusive) */
export const CAMPAIGN_WINDOWS: CampaignWindow[] = [
  { name: '2.2',  label: '2.2 Sale',                    month: 2,  dayStart: 2,  dayEnd: 3  },
  { name: '3.3',  label: '3.3 Sale',                    month: 3,  dayStart: 3,  dayEnd: 4  },
  { name: '4.4',  label: '4.4 Sale',                    month: 4,  dayStart: 4,  dayEnd: 5  },
  { name: '5.5',  label: '5.5 Sale',                    month: 5,  dayStart: 5,  dayEnd: 6  },
  { name: '6.6',  label: '6.6 Mid-Year Sale',           month: 6,  dayStart: 5,  dayEnd: 8  },
  { name: '7.7',  label: '7.7 Sale',                    month: 7,  dayStart: 7,  dayEnd: 8  },
  { name: '8.8',  label: '8.8 Sale',                    month: 8,  dayStart: 8,  dayEnd: 9  },
  { name: '9.9',  label: '9.9 Super Shopping Day',      month: 9,  dayStart: 8,  dayEnd: 11 },
  { name: '10.10',label: '10.10 Birthday Sale',         month: 10, dayStart: 9,  dayEnd: 12 },
  { name: '11.11',label: '11.11 ช้อปปิ้งมหัศจรรย์',    month: 11, dayStart: 10, dayEnd: 13 },
  { name: '12.12',label: '12.12 Year-End Sale',         month: 12, dayStart: 11, dayEnd: 13 },
]

/**
 * Returns the first matching campaign that is active today or starts within
 * CAMPAIGN_ADVANCE_DAYS, or null if no campaign is near.
 */
export function detectActiveCampaign(date: Date = new Date()): ActiveCampaign | null {
  const month = date.getMonth() + 1
  const day   = date.getDate()

  for (const c of CAMPAIGN_WINDOWS) {
    if (c.month !== month) continue

    if (day >= c.dayStart && day <= c.dayEnd) {
      return { name: c.name, label: c.label, daysUntil: 0, active: true }
    }

    const daysUntil = c.dayStart - day
    if (daysUntil > 0 && daysUntil <= CAMPAIGN_ADVANCE_DAYS) {
      return { name: c.name, label: c.label, daysUntil, active: false }
    }
  }

  return null
}
