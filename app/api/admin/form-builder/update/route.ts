// PATCH /api/admin/form-builder/update — EF-6 edit mode
import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { getAdminUser } from '@/lib/admin-auth'
import { generateFormHtml } from '@/lib/engine-form'
import type { FormEngineData } from '@/lib/engine-form-types'
import { db } from '@/lib/db'

const TIER_PRICE: Record<string, number> = {
  free: 0, standard: 20, premium: 50, ultra: 100,
}

export async function PATCH(req: NextRequest) {
  const adminId = await getAdminUser()
  if (!adminId) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  let body: {
    templateId: string
    fields: FormEngineData['fields']
    sampleData: FormEngineData['sampleData']
    title: string
    tier: string
    categoryId?: string
  }
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { templateId, fields, sampleData, title, tier, categoryId } = body
  if (!templateId || !fields?.length || !title?.trim()) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Verify template exists and is form type
  const [existing] = await db<{ id: string; slug: string }[]>`
    SELECT id, slug FROM templates WHERE id = ${templateId} AND engine_type = 'form' LIMIT 1
  `
  if (!existing) return NextResponse.json({ error: 'Template not found' }, { status: 404 })

  const engineData: FormEngineData = { schemaVersion: '1.0', title, fields, sampleData }

  let html: string
  try {
    html = generateFormHtml(engineData)
  } catch (err) {
    return NextResponse.json({ error: `HTML build failed: ${String(err)}` }, { status: 500 })
  }

  // Setup puppeteer
  let puppeteer: Awaited<typeof import('puppeteer-core')>['default']
  let executablePath: string
  let args: string[]
  let uploadBase: string
  try {
    const mod = await import('puppeteer-core')
    puppeteer = mod.default
    if (process.platform === 'linux') {
      const { default: chromium } = await import('@sparticuz/chromium')
      executablePath = await chromium.executablePath()
      args = chromium.args
    } else {
      executablePath = process.env.CHROMIUM_PATH ??
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
      args = ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
    }
    uploadBase = process.env.UPLOAD_DIR
      ? path.join(process.env.UPLOAD_DIR, 'templates')
      : path.join(process.cwd(), 'uploads', 'templates')
    await mkdir(uploadBase, { recursive: true })
  } catch (err) {
    return NextResponse.json({ error: `Engine setup failed: ${String(err)}` }, { status: 500 })
  }

  const ts = Date.now()
  const pdfFilename = `${existing.slug}-form-${ts}.pdf`
  const pdfPath     = `/uploads/templates/${pdfFilename}`

  let browser = null
  try {
    browser = await puppeteer.launch({ executablePath, args, headless: true })
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'networkidle0' })
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '15mm', right: '15mm', bottom: '20mm', left: '15mm' },
    })
    await writeFile(path.join(uploadBase, pdfFilename), Buffer.from(pdf))
  } catch (err) {
    return NextResponse.json({ error: `PDF generate failed: ${String(err)}` }, { status: 500 })
  } finally {
    if (browser) await (browser as { close(): Promise<void> }).close().catch(() => {})
  }

  const safeTier = TIER_PRICE[tier] !== undefined ? tier : 'standard'
  const priceBaht = TIER_PRICE[safeTier]

  try {
    await db`
      UPDATE templates SET
        title         = ${title},
        tier          = ${safeTier},
        price_baht    = ${priceBaht},
        pdf_path      = ${pdfPath},
        preview_path  = NULL,
        engine_data   = ${JSON.stringify(engineData)},
        document_type = 'form',
        updated_at    = NOW()
      WHERE id = ${templateId}
    `

    // Sync category link
    await db`DELETE FROM template_category_links WHERE template_id = ${templateId}`
    if (categoryId) {
      await db`
        INSERT INTO template_category_links (template_id, category_id)
        VALUES (${templateId}, ${categoryId})
        ON CONFLICT DO NOTHING
      `
    }
  } catch (err) {
    return NextResponse.json({ error: `DB update failed: ${String(err)}` }, { status: 500 })
  }

  return NextResponse.json({ success: true, templateId, slug: existing.slug, pdfPath })
}
