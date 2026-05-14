import { NextResponse } from 'next/server'
import { requireAdminSession } from '@/lib/admin-auth'
import { db } from '@/lib/db'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

function slugify(text: string): string {
  return text.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^ก-๿a-z0-9-]/g, '').replace(/-+/g, '-').slice(0, 80)
}

export async function POST() {
  await requireAdminSession('/admin/seo')

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY ยังไม่ได้ตั้งค่าใน .env.local' }, { status: 503 })
  }

  // ดึง template สุ่ม 1 รายการ (published, มี title+description)
  const [template] = await db<{ id: string; title: string; description: string; category_name: string | null }[]>`
    SELECT t.id, t.title, t.description,
           tc.name AS category_name
    FROM templates t
    LEFT JOIN template_category_links tcl ON tcl.template_id = t.id
    LEFT JOIN template_categories tc ON tc.id = tcl.category_id
    WHERE t.status = 'published' AND t.title IS NOT NULL
    ORDER BY RANDOM()
    LIMIT 1
  `
  if (!template) {
    return NextResponse.json({ error: 'ไม่มี template ใน DB — เพิ่ม template ก่อน' }, { status: 400 })
  }

  // ตรวจว่า draft สำหรับ template นี้มีอยู่แล้ว (ยัง pending_review)
  const [existing] = await db<{ id: string }[]>`
    SELECT id FROM blog_posts
    WHERE source_template_id = ${template.id} AND status = 'pending_review'
    LIMIT 1
  `
  if (existing) {
    return NextResponse.json({ error: `มี draft รออนุมัติสำหรับ "${template.title}" อยู่แล้ว` }, { status: 409 })
  }

  const category = template.category_name ?? 'การวางแผน'
  const prompt = `คุณเป็นนักเขียนบทความ SEO ภาษาไทยสำหรับเว็บไซต์ planprom.com ซึ่งขายเทมเพลต PDF สำหรับธุรกิจและการวางแผน

เขียนบทความ SEO-friendly ภาษาไทย โดยใช้ข้อมูลต่อไปนี้เป็นหัวข้อหลัก:
- ชื่อเทมเพลต: ${template.title}
- หมวดหมู่: ${category}
- คำอธิบาย: ${template.description ?? ''}

กฎการเขียน:
1. ใช้ภาษาไทยกระชับ อ่านง่าย เป็นธรรมชาติ
2. ความยาว 600-900 คำ
3. โครงสร้าง: ## หัวข้อหลัก → อธิบาย → ## หัวข้อย่อย (3-5 หัวข้อ) → ## สรุป
4. แต่ละหัวข้อย่อยมีเนื้อหา 2-3 ย่อหน้า
5. ใส่ keyword ที่เกี่ยวกับ "${template.title}" และ "${category}" ในเนื้อหาอย่างเป็นธรรมชาติ
6. ลงท้ายด้วย CTA สั้นๆ แนะนำให้ดาวน์โหลดเทมเพลตจาก planprom.com
7. ห้ามใส่ [ชื่อเว็บ] หรือ placeholder — ให้ใช้ "planprom.com" จริงๆ
8. ไม่ต้องใส่ชื่อผู้เขียน หรือวันที่

ตอบเฉพาะเนื้อหาบทความในรูปแบบ Markdown เท่านั้น ไม่ต้องมีคำอธิบายเพิ่มเติม`

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 2048,
    messages: [{ role: 'user', content: prompt }],
  })

  const content = message.content[0].type === 'text' ? message.content[0].text : ''
  if (!content.trim()) {
    return NextResponse.json({ error: 'AI ไม่ได้ส่งเนื้อหากลับมา' }, { status: 500 })
  }

  // ดึง title จากบรรทัดแรก (## ...) หรือใช้ชื่อ template
  const firstHeading = content.match(/^#{1,3}\s+(.+)/m)
  const articleTitle = firstHeading ? firstHeading[1].trim() : `คู่มือ ${template.title}`

  let slug = slugify(articleTitle)
  if (!slug) slug = `draft-${Date.now()}`

  // ตรวจ slug ซ้ำ
  const [slugConflict] = await db<{ slug: string }[]>`SELECT slug FROM blog_posts WHERE slug = ${slug} LIMIT 1`
  if (slugConflict) slug = `${slug}-${Date.now()}`

  const words = content.split(/\s+/).length
  const readingTimeMin = Math.max(2, Math.round(words / 200))

  const descMatch = content.replace(/^#{1,3}.+\n/m, '').trim().split('\n').find(l => l.trim().length > 20)
  const description = (descMatch ?? articleTitle).replace(/[#*]/g, '').trim().slice(0, 160)

  await db`
    INSERT INTO blog_posts (slug, title, description, content, reading_time_min, status, source_template_id)
    VALUES (${slug}, ${articleTitle}, ${description}, ${content}, ${readingTimeMin}, 'pending_review', ${template.id})
  `

  return NextResponse.json({ ok: true, title: articleTitle, slug, template: template.title })
}
