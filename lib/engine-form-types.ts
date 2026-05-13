// lib/engine-form-types.ts — Engine Form types (EF-1)

export type FormFieldType =
  | 'text'
  | 'multiline'
  | 'email'
  | 'number'
  | 'currency'
  | 'date'
  | 'date_range'
  | 'checkbox'
  | 'radio'
  | 'dropdown'
  | 'inspection'
  | 'signature'
  | 'logo'
  | 'running_number'
  | 'id_card'
  | 'photo_upload'
  | 'barcode'
  | 'gps'
  | 'dimension'
  | 'weight_height'
  | 'table'
  | 'section_header'
  | 'divider'
  | 'page_break'

export type FormField = {
  id: string
  type: FormFieldType
  label: string
  placeholder?: string
  required?: boolean
  options?: string[]       // checkbox / radio / dropdown
  width?: number            // % of row width: 25 | 33 | 50 | 67 | 75 | 100
  sampleValue?: string     // auto-gen hint — overrides type-based default
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
    if (f.sampleValue !== undefined) {
      out[f.id] = f.type === 'checkbox' ? [f.sampleValue] : f.sampleValue
      continue
    }
    switch (f.type) {
      case 'text':          out[f.id] = 'นายสมชาย ใจดี'; break
      case 'multiline':     out[f.id] = 'รายละเอียดเพิ่มเติม'; break
      case 'email':         out[f.id] = 'example@company.com'; break
      case 'number':        out[f.id] = '10'; break
      case 'currency':      out[f.id] = '1,500.00'; break
      case 'date':          out[f.id] = '15 พ.ค. 2568'; break
      case 'date_range':    out[f.id] = '15–17 พ.ค. 2568'; break
      case 'checkbox':      out[f.id] = f.options?.slice(0, 1) ?? []; break
      case 'radio':         out[f.id] = f.options?.[0] ?? ''; break
      case 'dropdown':      out[f.id] = f.options?.[0] ?? ''; break
      case 'inspection':    out[f.id] = f.options?.[0] ?? 'ผ่าน'; break
      case 'running_number':out[f.id] = 'FM-2568-001'; break
      case 'id_card':       out[f.id] = '1 2345 67890 12 3'; break
      case 'barcode':       out[f.id] = 'TH-1234567890'; break
      case 'gps':           out[f.id] = '13.7563, 100.5018'; break
      case 'dimension':     out[f.id] = '2.50 × 1.80 × 3.00 ม.'; break
      case 'weight_height': out[f.id] = '65 กก. / 170 ซม.'; break
      case 'photo_upload':  out[f.id] = ''; break
      default:              out[f.id] = ''; break
    }
  }
  return out
}
