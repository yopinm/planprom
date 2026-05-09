// app/terms/page.tsx — Terms of Service
// TASK 1.17: Legal & Compliance Pages

import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'ข้อกำหนดการใช้งาน — คูปองคุ้ม',
  description: 'ข้อกำหนดและเงื่อนไขการใช้งานคูปองคุ้ม',
}

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-orange-50">
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-5">
        <Link href="/" className="inline-flex rounded-full bg-black px-3 py-1 text-xs font-bold text-white">
          ← คูปองคุ้ม
        </Link>

        <article className="mt-6 rounded-4xl border border-orange-200 bg-white p-6 shadow-sm sm:p-8">
          <h1 className="text-2xl font-black text-black">ข้อกำหนดการใช้งาน</h1>
          <p className="mt-1 text-xs text-neutral-400">อัปเดตล่าสุด: พฤษภาคม 2026</p>

          <div className="mt-6 space-y-6 text-sm leading-7 text-neutral-700">
            <section>
              <h2 className="font-extrabold text-black">1. การยอมรับข้อกำหนด</h2>
              <p className="mt-2">
                การใช้งานคูปองคุ้มถือว่าท่านยอมรับข้อกำหนดและเงื่อนไขเหล่านี้ทั้งหมด
                หากท่านไม่ยอมรับ กรุณาหยุดใช้งานเว็บไซต์
              </p>
            </section>

            <section>
              <h2 className="font-extrabold text-black">2. คำอธิบายบริการ</h2>
              <p className="mt-2">
                คูปองคุ้มเป็นแพลตฟอร์มที่รวบรวมและเปรียบเทียบคูปองส่วนลดจาก Shopee, Lazada
                และแพลตฟอร์มอื่นๆ เพื่อช่วยให้ผู้ใช้งานได้รับส่วนลดสูงสุด
                เราไม่ได้เป็นผู้จำหน่ายสินค้าโดยตรง
              </p>
            </section>

            <section>
              <h2 className="font-extrabold text-black">3. ความถูกต้องของข้อมูล</h2>
              <p className="mt-2">
                ราคาและคูปองที่แสดงบนเว็บไซต์อาจมีการเปลี่ยนแปลงตามเงื่อนไขของแต่ละแพลตฟอร์ม
                คูปองคุ้มไม่รับประกันความถูกต้องหรือความพร้อมใช้งานของคูปองในทุกเวลา
                กรุณาตรวจสอบเงื่อนไขโดยตรงกับแพลตฟอร์มก่อนทำการสั่งซื้อ
              </p>
            </section>

            <section>
              <h2 className="font-extrabold text-black">4. ลิงก์พาร์ทเนอร์</h2>
              <p className="mt-2">
                ลิงก์สินค้าบางส่วนบนเว็บไซต์เป็นลิงก์พาร์ทเนอร์
                คูปองคุ้มอาจได้รับค่าคอมมิชชันเมื่อท่านซื้อสินค้าผ่านลิงก์เหล่านี้
                โดยไม่มีค่าใช้จ่ายเพิ่มเติมสำหรับท่าน
                ดูรายละเอียดเพิ่มเติมที่{' '}
                <Link href="/disclosure" className="font-bold text-orange-600 underline">
                  การเปิดเผยข้อมูลพาร์ทเนอร์
                </Link>
              </p>
            </section>

            <section>
              <h2 className="font-extrabold text-black">5. ทรัพย์สินทางปัญญา</h2>
              <p className="mt-2">
                เนื้อหา โลโก้ และรูปภาพบนคูปองคุ้มเป็นทรัพย์สินของคูปองคุ้ม
                ห้ามนำไปใช้โดยไม่ได้รับอนุญาตเป็นลายลักษณ์อักษร
              </p>
            </section>

            <section>
              <h2 className="font-extrabold text-black">6. ข้อจำกัดความรับผิดชอบ</h2>
              <p className="mt-2">
                คูปองคุ้มไม่รับผิดชอบต่อความเสียหายที่เกิดจากการใช้งานข้อมูลหรือคูปอง
                บนเว็บไซต์ รวมถึงกรณีที่คูปองหมดอายุ ไม่สามารถใช้ได้ หรือเงื่อนไขเปลี่ยนแปลง
              </p>
            </section>

            <section>
              <h2 className="font-extrabold text-black">7. การเปลี่ยนแปลงข้อกำหนด</h2>
              <p className="mt-2">
                คูปองคุ้มสงวนสิทธิ์ในการเปลี่ยนแปลงข้อกำหนดเหล่านี้ได้ตลอดเวลา
                การใช้งานต่อเนื่องหลังการเปลี่ยนแปลงถือว่าท่านยอมรับข้อกำหนดใหม่
              </p>
            </section>

            <section>
              <h2 className="font-extrabold text-black">8. กฎหมายที่ใช้บังคับ</h2>
              <p className="mt-2">
                ข้อกำหนดนี้อยู่ภายใต้กฎหมายของประเทศไทย
                ข้อพิพาทใดๆ จะได้รับการพิจารณาในศาลที่มีอำนาจในประเทศไทย
              </p>
            </section>
          </div>
        </article>

        <p className="mt-6 text-center text-xs text-neutral-400">
          <Link href="/privacy" className="underline">นโยบายความเป็นส่วนตัว</Link>
          {' '}·{' '}
          <Link href="/disclosure" className="underline">Affiliate Disclosure</Link>
        </p>
      </div>
    </main>
  )
}
