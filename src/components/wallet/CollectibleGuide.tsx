// CollectibleGuide — Collectible Voucher Guide
// TASK 2.7 — คำแนะนำขั้นตอนเก็บคูปอง (server component)

import Link from 'next/link'

const SHOPEE_STEPS = [
  { icon: '', title: 'เข้าหน้าแรก Shopee', body: 'เปิดแอป Shopee → แตะ "คูปอง" ที่แถบด้านบน' },
  { icon: '', title: 'กดเก็บคูปองรายวัน', body: 'แตะ "เก็บเลย" ทุกวัน — คูปองส่งฟรีและส่วนลดจะรีเฟรชเที่ยงคืน' },
  { icon: '', title: 'คูปอง Flash Sale', body: 'ตรวจ Flash Sale 00:00 / 12:00 / 18:00 — มักมีคูปอง Extra 10-15% off' },
  { icon: '', title: 'Shopee Pay Cashback', body: 'จ่ายด้วย Shopee Pay → รับ Coins คืน — นำมาหักเงินรอบถัดไปได้' },
]

const LAZADA_STEPS = [
  { icon: '', title: 'Voucher Center', body: 'เปิด Lazada → แตะ "Voucher" → กด "Collect" ทุกใบที่เห็น' },
  { icon: '', title: 'LazCoins', body: 'เช็ก LazCoins ทุกวันใน "Me" → แลกเป็นส่วนลดก่อน Checkout' },
  { icon: '', title: 'Flash Deals', body: 'Flash Deals ทุก 00:00 / 08:00 / 12:00 / 18:00 — มีสินค้าราคา Exclusive' },
  { icon: '', title: 'Lazada Wallet', body: 'เติม Lazada Wallet ล่วงหน้า → ได้ส่วนลดพิเศษและชำระเร็วขึ้น' },
]

const TIPS = [
  'ตั้ง Reminder ทุกวันที่ 25 (เงินเดือนออก) — แพลตฟอร์มมักแจกคูปองพิเศษ',
  'วัน 5.5 / 6.6 / 11.11 — กดเก็บคูปองตั้งแต่กลางดึกก่อน เพราะจำนวนจำกัด',
  'ไม่ต้องกรอกเลขบัตรเครดิต — ดู "โปรแบงก์" ที่ระบบแสดงให้ใต้ผลการค้นหา',
  'คูปองส่งฟรี + คูปองร้าน + คูปองแบงก์ สามารถใช้พร้อมกันได้ (Tier 1-3)',
]

export function CollectibleGuide() {
  return (
    <section>
      <h2 className="mb-4 text-lg font-extrabold text-black">วิธีเก็บคูปองให้ได้มากสุด</h2>

      {/* คูปองคุ้ม */}
      <div className="mb-5 rounded-2xl border border-orange-300 bg-orange-50 p-4">
        <div className="mb-3 flex items-center gap-2">
          <span className="rounded-xl bg-orange-500 px-3 py-1 text-xs font-extrabold text-white">
            คูปองคุ้ม
          </span>
          <span className="text-xs font-semibold text-neutral-500">เก็บก่อนใคร</span>
        </div>
        <ol className="space-y-3">
          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-200 text-xs font-black text-orange-700">1</span>
            <div>
              <p className="text-sm font-bold text-black">เปิด couponkum.com/wallet ทุกวัน</p>
              <p className="text-xs leading-5 text-neutral-500">คัดคูปองเด็ดจาก Shopee & Lazada ไว้ให้แล้ว — <Link href="/wallet" className="font-bold text-orange-600 underline underline-offset-2">เปิดดูเลย</Link></p>
            </div>
          </li>
          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-200 text-xs font-black text-orange-700">2</span>
            <div>
              <p className="text-sm font-bold text-black">ติดตาม LINE OA คูปองคุ้ม</p>
              <p className="text-xs leading-5 text-neutral-500">รับโค้ดใหม่อัตโนมัติก่อนใคร ไม่ต้องเปิดเว็บเอง — <a href={`https://line.me/R/ti/p/${process.env.NEXT_PUBLIC_LINE_OA_ID ?? '@couponkum'}`} target="_blank" rel="noopener noreferrer" className="font-bold text-orange-600 underline underline-offset-2">กดติดตาม</a></p>
            </div>
          </li>
          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-200 text-xs font-black text-orange-700">3</span>
            <div>
              <p className="text-sm font-bold text-black">กด &ldquo;เก็บ&rdquo; บันทึกโค้ดที่ชอบ</p>
              <p className="text-xs leading-5 text-neutral-500">โค้ดจะอยู่ในกระเป๋าเก็บคูปอง — ใช้ตอน Checkout ได้ทันที ไม่ต้องจำ</p>
            </div>
          </li>
        </ol>
      </div>

      {/* Shopee */}
      <div className="mb-5 rounded-2xl border border-orange-200 bg-white p-4">
        <div className="mb-3 flex items-center gap-2">
          <span className="rounded-xl bg-orange-500 px-3 py-1 text-xs font-extrabold text-white">
            Shopee
          </span>
          <span className="text-xs font-semibold text-neutral-500">คูปองรายวัน</span>
        </div>
        <ol className="space-y-3">
          {SHOPEE_STEPS.map((step, i) => (
            <li key={i} className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-100 text-xs font-black text-orange-700">
                {i + 1}
              </span>
              <div>
                <p className="text-sm font-bold text-black">{step.title}</p>
                <p className="text-xs leading-5 text-neutral-500">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      {/* Lazada */}
      <div className="mb-5 rounded-2xl border border-blue-200 bg-white p-4">
        <div className="mb-3 flex items-center gap-2">
          <span className="rounded-xl bg-blue-600 px-3 py-1 text-xs font-extrabold text-white">
            Lazada
          </span>
          <span className="text-xs font-semibold text-neutral-500">Voucher Center</span>
        </div>
        <ol className="space-y-3">
          {LAZADA_STEPS.map((step, i) => (
            <li key={i} className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-black text-blue-700">
                {i + 1}
              </span>
              <div>
                <p className="text-sm font-bold text-black">{step.title}</p>
                <p className="text-xs leading-5 text-neutral-500">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      {/* Pro tips */}
      <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
        <p className="mb-2 text-xs font-extrabold uppercase tracking-wider text-neutral-400">
          Pro Tips
        </p>
        <ul className="space-y-2">
          {TIPS.map((tip, i) => (
            <li key={i} className="flex gap-2 text-xs leading-5 text-neutral-600">
              <span className="mt-0.5 text-green-500">✓</span>
              {tip}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
