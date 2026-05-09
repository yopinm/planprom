// app/legal/page.tsx — Legal Disclaimer Page (Full Version)
// TASK 3.16 [WS3][P3]
//
// Full legal disclaimer covering: affiliate liability, price accuracy,
// content accuracy, no warranty, limitation of liability, platform ToS compliance

import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'ข้อจำกัดความรับผิดชอบ — คูปองคุ้ม',
  description: 'ข้อจำกัดความรับผิดชอบ นโยบาย Affiliate ความถูกต้องของราคา และข้อกำหนดทางกฎหมายของคูปองคุ้ม',
}

const SECTIONS = [
  {
    id: 'affiliate',
    title: '1. การเปิดเผยความสัมพันธ์กับพาร์ทเนอร์',
    body: `คูปองคุ้มเป็นพาร์ทเนอร์กับ Shopee Thailand, Lazada Thailand และแพลตฟอร์มอื่นๆ เมื่อผู้ใช้คลิกลิงก์สินค้าบนเว็บไซต์และทำการซื้อ เราอาจได้รับค่าคอมมิชชันจากแพลตฟอร์ม ซึ่งไม่มีผลต่อราคาที่ผู้ซื้อชำระ`,
  },
  {
    id: 'price-accuracy',
    title: '2. ความถูกต้องของราคาและคูปอง',
    body: `ราคาสินค้าและมูลค่าคูปองที่แสดงบนเว็บไซต์ดึงมาจากแพลตฟอร์มโดยตรง และอาจไม่ตรงกับราคาจริง ณ เวลาที่ซื้อ เนื่องจาก:\n\n• ราคาอาจเปลี่ยนแปลงได้ทุกเมื่อโดยไม่แจ้งล่วงหน้า\n• คูปองอาจหมดอายุหรือถูกยกเลิกก่อนวันที่แสดง\n• ราคาสุทธิหลังหักคูปองเป็นการประมาณการเท่านั้น\n• เงื่อนไขการใช้คูปองขึ้นอยู่กับนโยบายของแต่ละแพลตฟอร์ม\n\nผู้ใช้ควรตรวจสอบราคาและเงื่อนไขจริงบนแพลตฟอร์มก่อนตัดสินใจซื้อเสมอ`,
  },
  {
    id: 'no-warranty',
    title: '3. ข้อจำกัดของข้อมูล',
    body: `เว็บไซต์คูปองคุ้มนำเสนอข้อมูลตามที่มีอยู่ โดยไม่สามารถรับประกันความถูกต้องสมบูรณ์ในทุกกรณี ซึ่งรวมถึง:\n\n• ความถูกต้องและครบถ้วนของข้อมูลคูปองและราคา\n• ความพร้อมใช้งานของเว็บไซต์ตลอดเวลา\n• การที่ลิงก์สินค้าจะใช้งานได้ตลอดเวลา`,
  },
  {
    id: 'liability',
    title: '4. การจำกัดความรับผิดชอบ',
    body: `คูปองคุ้มและผู้ดำเนินการจะไม่รับผิดชอบต่อความเสียหายใดๆ ที่เกิดจากการใช้งานเว็บไซต์ ซึ่งรวมถึง:\n\n• ความแตกต่างของราคาจริงกับราคาที่แสดง\n• การที่คูปองใช้ไม่ได้หรือหมดอายุ\n• ความเสียหายที่เกิดจากการพึ่งพาข้อมูลบนเว็บไซต์`,
  },
  {
    id: 'platform-tos',
    title: '5. การปฏิบัติตามกฎของแพลตฟอร์ม',
    body: `เราปฏิบัติตามข้อกำหนดของแพลตฟอร์มพาร์ทเนอร์ทุกราย ได้แก่ Shopee, Lazada, Meta/Facebook และ Google หากมีการเปลี่ยนแปลงกฎของแพลตฟอร์มใด เราจะปรับการดำเนินงานให้สอดคล้องโดยเร็วที่สุด`,
  },
  {
    id: 'content-accuracy',
    title: '6. ความถูกต้องของเนื้อหาและการจัดอันดับ',
    body: `การจัดอันดับสินค้าและการแนะนำดีลคำนวณจากราคา คุณภาพร้านค้า และมูลค่าคูปอง ค่าคอมมิชชันไม่ได้เป็นปัจจัยหลักในการจัดอันดับ อย่างไรก็ตามเราไม่สามารถรับประกันว่าการจัดอันดับจะตรงกับความต้องการของผู้ใช้ทุกคน`,
  },
  {
    id: 'tracking',
    title: '7. การเก็บข้อมูลและความเป็นส่วนตัว',
    body: `เราบันทึกว่าการคลิกลิงก์มาจากส่วนใดของเว็บไซต์ เพื่อนำไปปรับปรุงการแสดงผลสินค้าให้เหมาะสมยิ่งขึ้น ข้อมูลที่เก็บจะถูกทำให้ไม่สามารถระบุตัวตนได้ และไม่มีการแชร์ข้อมูลส่วนตัวกับบุคคลภายนอก รายละเอียดเพิ่มเติมดูที่นโยบายความเป็นส่วนตัว`,
  },
  {
    id: 'changes',
    title: '8. การเปลี่ยนแปลงข้อจำกัดความรับผิดชอบ',
    body: `เราขอสงวนสิทธิ์ในการแก้ไขข้อจำกัดความรับผิดชอบนี้ได้ตลอดเวลา การใช้งานเว็บไซต์ต่อเนื่องหลังจากมีการเปลี่ยนแปลงถือว่าท่านยอมรับข้อกำหนดใหม่`,
  },
]

export default function LegalPage() {
  return (
    <main className="min-h-screen bg-orange-50">
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-5">
        <Link href="/" className="inline-flex rounded-full bg-black px-3 py-1 text-xs font-bold text-white">
          ← คูปองคุ้ม
        </Link>

        <article className="mt-6 rounded-4xl border border-orange-200 bg-white p-6 shadow-sm sm:p-8">
          <h1 className="text-2xl font-black text-black">ข้อจำกัดความรับผิดชอบ</h1>
          <p className="mt-1 text-xs text-neutral-400">
            อัปเดตล่าสุด: พฤษภาคม 2026
          </p>

          {/* Summary box */}
          <div className="mt-5 rounded-2xl border border-orange-200 bg-orange-50 p-4">
            <p className="text-sm font-extrabold text-orange-700">สรุปสำคัญ</p>
            <ul className="mt-2 space-y-1 text-xs leading-5 text-neutral-700">
              <li>• เราเป็น Affiliate — ได้ค่าคอมมิชชันเมื่อซื้อผ่านลิงก์ของเรา (ราคาไม่เปลี่ยน)</li>
              <li>• ราคาและคูปองเป็นการประมาณการ — ตรวจสอบจริงก่อนซื้อเสมอ</li>
              <li>• ข้อมูลอาจล้าสมัย — เราไม่รับประกันความถูกต้อง ณ เวลาใช้งานจริง</li>
            </ul>
          </div>

          {/* Table of contents */}
          <nav className="mt-6">
            <p className="text-xs font-extrabold uppercase tracking-wider text-neutral-400">สารบัญ</p>
            <ol className="mt-2 space-y-1">
              {SECTIONS.map(s => (
                <li key={s.id}>
                  <a href={`#${s.id}`} className="text-xs text-orange-600 hover:underline">
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

        {/* Footer links */}
        <p className="mt-6 text-center text-xs text-neutral-400">
          <Link href="/terms"       className="underline">ข้อกำหนดการใช้งาน</Link>
          {' · '}
          <Link href="/privacy"     className="underline">นโยบายความเป็นส่วนตัว</Link>
          {' · '}
          <Link href="/disclosure"  className="underline">Affiliate Disclosure</Link>
        </p>
      </div>
    </main>
  )
}
