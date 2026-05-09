// app/disclosure/page.tsx — Affiliate Disclosure
// TASK 1.17: Legal & Compliance Pages
// Required by Google AdSense policy + Thailand Consumer Protection Act

import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Affiliate Disclosure — คูปองคุ้ม',
  description: 'การเปิดเผยข้อมูลความสัมพันธ์กับพาร์ทเนอร์ Affiliate ของคูปองคุ้ม',
}

export default function DisclosurePage() {
  return (
    <main className="min-h-screen bg-orange-50">
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-5">
        <Link href="/" className="inline-flex rounded-full bg-black px-3 py-1 text-xs font-bold text-white">
          ← คูปองคุ้ม
        </Link>

        <article className="mt-6 rounded-4xl border border-orange-200 bg-white p-6 shadow-sm sm:p-8">
          <h1 className="text-2xl font-black text-black">Affiliate Disclosure</h1>
          <p className="mt-1 text-xs text-neutral-400">
            การเปิดเผยข้อมูลความสัมพันธ์กับพาร์ทเนอร์ · อัปเดต: พฤษภาคม 2026
          </p>

          {/* Summary box — shown near CTAs on product pages */}
          <div className="mt-6 rounded-2xl border border-orange-200 bg-orange-50 p-4">
            <p className="text-sm font-extrabold text-orange-700">
              📢 สรุปสั้น: เราได้รับค่าคอมมิชชัน — ราคาไม่เปลี่ยน
            </p>
            <p className="mt-1 text-xs leading-5 text-neutral-600">
              ลิงก์สินค้าบางส่วนบนเว็บไซต์เป็น Affiliate Link
              เมื่อท่านซื้อสินค้าผ่านลิงก์เหล่านี้ เราอาจได้รับค่าคอมมิชชันจากแพลตฟอร์ม
              <strong> โดยท่านไม่ต้องจ่ายเพิ่ม</strong>
            </p>
          </div>

          <div className="mt-6 space-y-6 text-sm leading-7 text-neutral-700">
            <section>
              <h2 className="font-extrabold text-black">ความสัมพันธ์กับพาร์ทเนอร์</h2>
              <p className="mt-2">
                คูปองคุ้มเป็นพาร์ทเนอร์ (Affiliate) กับแพลตฟอร์มต่อไปนี้:
              </p>
              <ul className="mt-3 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                {[
                  'Lazada Thailand',
                  'Involve Asia',
                  'Access Trade',
                  'Shopee Thailand',
                  'HP Thailand',
                  'CompAsia (Thailand)',
                  "Lotus's Shop Online",
                  'Advice Online',
                  'Studio7',
                  'Lenovo TH',
                  'SpeedCom',
                  'Adidas Thailand',
                  'Banana',
                  'Krungsri Lady Titanium Credit Card',
                  'Kept by Krungsri',
                  'Sephora Thailand',
                  'B2S',
                  'Central Online',
                  'Supersports',
                  'ALL Online',
                  'GoWabi',
                  'Bewell',
                ].map(name => (
                  <li key={name} className="flex items-center gap-2 text-sm text-neutral-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-orange-400 flex-shrink-0" />
                    {name}
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="font-extrabold text-black">วิธีทำงานของ Affiliate</h2>
              <p className="mt-2">
                เมื่อท่านคลิกลิงก์สินค้าบนเว็บไซต์และทำการซื้อ แพลตฟอร์มจะระบุว่า
                การซื้อมาจากคูปองคุ้มผ่าน Affiliate ID ของเรา
                และจ่ายค่าคอมมิชชันส่วนหนึ่งให้เรา
                <strong> ราคาสินค้าที่ท่านจ่ายไม่เปลี่ยนแปลง</strong>
              </p>
            </section>

            <section>
              <h2 className="font-extrabold text-black">ความเป็นกลางของเนื้อหา</h2>
              <p className="mt-2">
                ค่าคอมมิชชันไม่มีผลต่อการจัดอันดับสินค้าหรือคูปองบนเว็บไซต์
                เราจัดอันดับตามดีลที่คุ้มที่สุดสำหรับผู้ใช้งาน
                โดยใช้สูตร Deal Score ที่คำนวณจากราคา คุณภาพร้าน และความคุ้มค่าของคูปอง
              </p>
            </section>

            <section>
              <h2 className="font-extrabold text-black">การเก็บข้อมูลและความเป็นส่วนตัว</h2>
              <p className="mt-2">
                เราบันทึกว่าการคลิกลิงก์มาจากส่วนใดของเว็บไซต์ เพื่อนำไปปรับปรุงการแสดงผลสินค้าให้เหมาะสมยิ่งขึ้น
                ข้อมูลที่เก็บจะถูกทำให้ไม่สามารถระบุตัวตนได้ และไม่มีการแชร์ข้อมูลส่วนตัวกับบุคคลภายนอก
              </p>
            </section>

            <section>
              <h2 className="font-extrabold text-black">ติดต่อเรา</h2>
              <p className="mt-2">
                หากมีคำถามเกี่ยวกับ Affiliate Disclosure หรือนโยบายของเรา
                สามารถติดต่อได้ที่ partner@couponkum.com
              </p>
            </section>
          </div>
        </article>

        <p className="mt-6 text-center text-xs text-neutral-400">
          <Link href="/terms" className="underline">ข้อกำหนดการใช้งาน</Link>
          {' '}·{' '}
          <Link href="/privacy" className="underline">นโยบายความเป็นส่วนตัว</Link>
        </p>
      </div>
    </main>
  )
}
