import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'ข้อกำหนดการใช้งาน — แพลนพร้อม',
  description: 'ข้อกำหนดและเงื่อนไขการใช้งานแพลนพร้อม',
}

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-neutral-50">
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-5">
        <Link href="/" className="inline-flex rounded-full bg-black px-3 py-1 text-xs font-bold text-white">
          ← แพลนพร้อม
        </Link>

        <article className="mt-6 rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">
          <h1 className="text-2xl font-black text-black">ข้อกำหนดการใช้งาน</h1>
          <p className="mt-1 text-xs text-neutral-400">อัปเดตล่าสุด: พฤษภาคม 2026</p>

          <div className="mt-6 space-y-6 text-sm leading-7 text-neutral-700">
            <section>
              <h2 className="font-extrabold text-black">1. การยอมรับข้อกำหนด</h2>
              <p className="mt-2">
                การใช้งานแพลนพร้อมถือว่าท่านยอมรับข้อกำหนดและเงื่อนไขเหล่านี้ทั้งหมด
                หากท่านไม่ยอมรับ กรุณาหยุดใช้งานเว็บไซต์
              </p>
            </section>

            <section>
              <h2 className="font-extrabold text-black">2. คำอธิบายบริการ</h2>
              <p className="mt-2">
                แพลนพร้อมเป็นแพลตฟอร์มจำหน่าย template ดิจิทัลสำหรับการวางแผนธุรกิจ การเงิน และการจัดการงาน
                ผู้ซื้อได้รับไฟล์ดาวน์โหลดผ่านเว็บไซต์หรือ LINE หลังการยืนยันการชำระเงิน
                แพลนพร้อมไม่ได้เป็นผู้จำหน่ายสินค้าจับต้องได้
              </p>
            </section>

            <section>
              <h2 className="font-extrabold text-black">3. สิทธิ์การใช้งาน Template</h2>
              <p className="mt-2">
                เมื่อซื้อ template ท่านได้รับสิทธิ์การใช้งานแบบไม่จำกัดเวลาสำหรับตนเองหรือธุรกิจของท่าน
                ท่านสามารถแก้ไขเนื้อหาให้เหมาะกับความต้องการได้
              </p>
              <p className="mt-2 font-bold text-neutral-800">สิ่งที่ห้ามทำ:</p>
              <ul className="mt-1 list-disc space-y-1 pl-5">
                <li>นำ template ไปขายต่อหรือให้เช่าแก่บุคคลอื่น</li>
                <li>แจกจ่าย แชร์ไฟล์ต้นฉบับ หรืออัปโหลดไปยังแพลตฟอร์มอื่น</li>
                <li>อ้างว่าเป็นผู้สร้าง template หรือลบข้อมูลลิขสิทธิ์</li>
              </ul>
            </section>

            <section>
              <h2 className="font-extrabold text-black">4. การชำระเงินและการคืนเงิน</h2>
              <p className="mt-2">
                แพลนพร้อมรับชำระผ่าน <span className="font-bold">PromptPay QR</span> ผ่านระบบ Omise Payment Gateway
                การชำระเงินได้รับการยืนยันอัตโนมัติโดย Omise — ลิงก์ดาวน์โหลดจะส่งให้ทันทีเมื่อชำระสำเร็จ
              </p>
              <p className="mt-2">
                เนื่องจาก template เป็นสินค้าดิจิทัลที่สามารถดาวน์โหลดได้ทันทีหลังยืนยัน
                <span className="font-bold text-neutral-800"> แพลนพร้อมไม่คืนเงินหลังจากยืนยันการชำระและส่งไฟล์แล้ว</span>
              </p>
              <p className="mt-2">
                <span className="font-bold text-neutral-800">ข้อยกเว้น:</span> หากไฟล์เสียหาย เปิดไม่ได้ หรือดาวน์โหลดไม่ได้เนื่องจากปัญหาจากระบบของเรา
                กรุณาติดต่อ <a href="mailto:contact@planprom.com" className="text-indigo-600 underline">contact@planprom.com</a> ภายใน 7 วันหลังซื้อ
                เราจะส่งไฟล์ใหม่หรือพิจารณาคืนเงินเป็นรายกรณี
              </p>
            </section>

            <section>
              <h2 className="font-extrabold text-black">5. การระงับสิทธิ์การเข้าถึง</h2>
              <p className="mt-2">
                แพลนพร้อมสงวนสิทธิ์ระงับการเข้าถึงหรือยกเลิกบัญชีของผู้ใช้ที่ฝ่าฝืนข้อกำหนด
                โดยเฉพาะกรณีนำ template ไปขายต่อหรือแจกจ่าย โดยไม่จำเป็นต้องแจ้งล่วงหน้า
              </p>
            </section>

            <section>
              <h2 className="font-extrabold text-black">6. ทรัพย์สินทางปัญญา</h2>
              <p className="mt-2">
                เนื้อหา โลโก้ การออกแบบ และ template ทั้งหมดบนแพลนพร้อมเป็นทรัพย์สินทางปัญญาของแพลนพร้อม
                ห้ามนำไปใช้โดยไม่ได้รับอนุญาตเป็นลายลักษณ์อักษร
              </p>
            </section>

            <section>
              <h2 className="font-extrabold text-black">7. การเปลี่ยนแปลงข้อกำหนด</h2>
              <p className="mt-2">
                แพลนพร้อมสงวนสิทธิ์ในการเปลี่ยนแปลงข้อกำหนดเหล่านี้ได้ตลอดเวลา
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
          <Link href="/privacy" className="underline hover:text-indigo-600">นโยบายความเป็นส่วนตัว</Link>
          {' · '}
          <Link href="/legal" className="underline hover:text-indigo-600">ข้อจำกัดความรับผิดชอบ</Link>
        </p>
      </div>
    </main>
  )
}
