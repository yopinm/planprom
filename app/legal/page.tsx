import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'ข้อจำกัดความรับผิดชอบ — แพลนพร้อม',
  description: 'ข้อจำกัดความรับผิดชอบ สิทธิ์การใช้งาน template และข้อกำหนดทางกฎหมายของแพลนพร้อม',
}

const SECTIONS = [
  {
    id: 'digital-product',
    title: '1. ผลิตภัณฑ์ดิจิทัล',
    body: `แพลนพร้อมจำหน่าย template ในรูปแบบไฟล์ดิจิทัล (PDF, Excel, Notion และรูปแบบอื่นๆ) ผู้ซื้อได้รับสิทธิ์ดาวน์โหลดและใช้งานตามเงื่อนไขที่ระบุไว้ในแต่ละ template

ผลลัพธ์จากการใช้งาน template ขึ้นอยู่กับบริบทและวิธีการนำไปใช้ของแต่ละบุคคล แพลนพร้อมไม่รับประกันผลลัพธ์ทางธุรกิจหรือการเงินใดๆ`,
  },
  {
    id: 'content-accuracy',
    title: '2. ความถูกต้องของเนื้อหา Template',
    body: `เนื้อหาใน template ถูกออกแบบมาเพื่อเป็นแนวทาง ผู้ใช้ควรปรับให้เหมาะสมกับบริบทของตนเอง เนื่องจาก:

• ข้อมูล ตัวเลข หรือสูตรใน template อาจต้องปรับตามสถานการณ์จริง
• เนื้อหาอาจไม่ครอบคลุมทุกกรณีการใช้งาน
• กฎหมาย ภาษี หรือข้อบังคับที่เกี่ยวข้องอาจเปลี่ยนแปลงตามเวลา

กรุณาตรวจสอบความถูกต้องกับผู้เชี่ยวชาญที่เกี่ยวข้องก่อนนำไปใช้งานจริงในทางธุรกิจหรือกฎหมาย`,
  },
  {
    id: 'no-warranty',
    title: '3. ข้อจำกัดของการรับประกัน',
    body: `แพลนพร้อมนำเสนอ template และบริการตามสภาพที่มีอยู่ โดยไม่สามารถรับประกันในทุกกรณี ซึ่งรวมถึง:

• ความพร้อมใช้งานของเว็บไซต์และระบบดาวน์โหลดตลอดเวลา
• ความเข้ากันได้ของไฟล์กับซอฟต์แวร์ทุกเวอร์ชัน
• ความครบถ้วนของเนื้อหาสำหรับทุกกรณีการใช้งาน`,
  },
  {
    id: 'liability',
    title: '4. การจำกัดความรับผิดชอบ',
    body: `แพลนพร้อมและผู้ดำเนินการจะไม่รับผิดชอบต่อความเสียหายใดๆ ที่เกิดจากการใช้งาน template หรือเว็บไซต์ ซึ่งรวมถึง:

• ความเสียหายทางธุรกิจหรือการเงินจากการนำ template ไปใช้
• การสูญหายของข้อมูลหรือไฟล์ที่ดาวน์โหลด
• ความเสียหายที่เกิดจากการพึ่งพาข้อมูลใน template โดยไม่ตรวจสอบกับผู้เชี่ยวชาญ`,
  },
  {
    id: 'platform-tos',
    title: '5. การปฏิบัติตามกฎของแพลตฟอร์ม',
    body: `เราปฏิบัติตามข้อกำหนดของแพลตฟอร์มที่ใช้ในการให้บริการ ได้แก่ LINE, Meta/Facebook และ Google หากมีการเปลี่ยนแปลงกฎของแพลตฟอร์มใด เราจะปรับการดำเนินงานให้สอดคล้องโดยเร็วที่สุด`,
  },
  {
    id: 'changes',
    title: '6. การเปลี่ยนแปลงข้อจำกัดความรับผิดชอบ',
    body: `เราขอสงวนสิทธิ์ในการแก้ไขข้อจำกัดความรับผิดชอบนี้ได้ตลอดเวลา การใช้งานเว็บไซต์ต่อเนื่องหลังจากมีการเปลี่ยนแปลงถือว่าท่านยอมรับข้อกำหนดใหม่`,
  },
]

export default function LegalPage() {
  return (
    <main className="min-h-screen bg-neutral-50">
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-5">
        <Link href="/" className="inline-flex rounded-full bg-black px-3 py-1 text-xs font-bold text-white">
          ← แพลนพร้อม
        </Link>

        <article className="mt-6 rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">
          <h1 className="text-2xl font-black text-black">ข้อจำกัดความรับผิดชอบ</h1>
          <p className="mt-1 text-xs text-neutral-400">
            อัปเดตล่าสุด: พฤษภาคม 2026
          </p>

          {/* Summary box */}
          <div className="mt-5 rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
            <p className="text-sm font-extrabold text-neutral-700">สรุปสำคัญ</p>
            <ul className="mt-2 space-y-1 text-xs leading-5 text-neutral-700">
              <li>• Template เป็นไฟล์ดิจิทัล — ซื้อแล้วไม่คืนเงินหลังยืนยันการชำระ</li>
              <li>• ผลลัพธ์จากการใช้งานขึ้นกับผู้ใช้ — เราไม่รับประกันผลทางธุรกิจ</li>
              <li>• ใช้ได้เฉพาะส่วนตัว — ห้ามนำไปขายต่อหรือแจกจ่าย</li>
            </ul>
          </div>

          {/* Table of contents */}
          <nav className="mt-6">
            <p className="text-xs font-extrabold uppercase tracking-wider text-neutral-400">สารบัญ</p>
            <ol className="mt-2 space-y-1">
              {SECTIONS.map(s => (
                <li key={s.id}>
                  <a href={`#${s.id}`} className="text-xs text-indigo-600 hover:underline">
                    {s.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          {/* Sections */}
          <div className="mt-8 space-y-8 text-sm leading-7 text-neutral-700">
            {SECTIONS.map(section => (
              <section key={section.id} id={section.id}>
                <h2 className="font-extrabold text-black">{section.title}</h2>
                <p className="mt-2 whitespace-pre-line">{section.body}</p>
              </section>
            ))}
          </div>
        </article>

        <p className="mt-6 text-center text-xs text-neutral-400">
          <Link href="/terms"   className="underline hover:text-indigo-600">ข้อกำหนดการใช้งาน</Link>
          {' · '}
          <Link href="/privacy" className="underline hover:text-indigo-600">นโยบายความเป็นส่วนตัว</Link>
        </p>
      </div>
    </main>
  )
}
