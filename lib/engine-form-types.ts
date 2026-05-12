// lib/engine-form-types.ts — Engine Form types (EF-1)

export type FormFieldType =
  | 'text'
  | 'multiline'
  | 'email'
  | 'date'
  | 'date_range'
  | 'checkbox'
  | 'radio'
  | 'dropdown'
  | 'signature'
  | 'logo'
  | 'section_header'
  | 'divider'
  | 'table'
  | 'page_break'
  | 'running_number'

export type FormField = {
  id: string
  type: FormFieldType
  label: string
  placeholder?: string
  required?: boolean
  options?: string[]       // checkbox / radio / dropdown
  width?: 'full' | 'half'  // layout hint
  // table-specific
  tableColumns?: string[]
  tableRows?: number
}

export type FormEngineData = {
  schemaVersion: '1.0'
  title: string
  logoUrl?: string
  fields: FormField[]
  sampleData: Record<string, string | string[]>  // fieldId → value
}

// Auto-generate sample data per field type
export function autoGenSampleData(fields: FormField[]): Record<string, string | string[]> {
  const out: Record<string, string | string[]> = {}
  for (const f of fields) {
    switch (f.type) {
      case 'text':         out[f.id] = 'นายสมชาย ใจดี'; break
      case 'multiline':    out[f.id] = 'รายละเอียดเพิ่มเติม'; break
      case 'email':        out[f.id] = 'example@company.com'; break
      case 'date':         out[f.id] = '15 พ.ค. 2568'; break
      case 'date_range':   out[f.id] = '15–17 พ.ค. 2568'; break
      case 'checkbox':     out[f.id] = f.options?.slice(0, 1) ?? []; break
      case 'radio':        out[f.id] = f.options?.[0] ?? ''; break
      case 'dropdown':     out[f.id] = f.options?.[0] ?? ''; break
      case 'running_number': out[f.id] = 'FM-2568-001'; break
      default:             out[f.id] = ''; break
    }
  }
  return out
}
