import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'นโยบายความเป็นส่วนตัว — แพลนพร้อม',
  description: 'นโยบายความเป็นส่วนตัวและการคุ้มครองข้อมูลส่วนบุคคลของแพลนพร้อม',
}

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-neutral-50">
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-5">
        <Link href="/" className="inline-flex rounded-full bg-black px-3 py-1 text-xs font-bold text-white">
          ← แพลนพร้อม
        </Link>

        <article className="mt-6 rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">
          <h1 className="text-2xl font-black text-black">นโยบายความเป็นส่วนตัว</h1>
          <p className="mt-1 text-xs text-neutral-400">อัปเดตล่าสุด: พฤษภาคม 2026</p>

          <div className="mt-6 space-y-6 text-sm leading-7 text-neutral-700">
            <section>
              <h2 className="font-extrabold text-black">1. ข้อมูลที่เราเก็บรวบรวม</h2>
              <p className="mt-2">แพลนพร้อมเก็บข้อมูลเท่าที่จำเป็นสำหรับการให้บริการ ประกอบด้วย:</p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>ข้อมูลบัญชี LINE: ชื่อ, LINE User ID, และรูปโปรไฟล์ (จาก LINE OAuth — ใช้สำหรับ login และส่ง template)</li>
                <li>ประวัติการสั่งซื้อ: รายการ template, ยอดชำระ, วันที่ซื้อ</li>
                <li>สลิปการโอนเงินที่อัปโหลด (เก็บเพื่อยืนยันการชำระเงิน)</li>
                <li>ประวัติการดาวน์โหลด (เพื่อตรวจสอบสิทธิ์ access)</li>
                <li>ที่อยู่ IP ในรูปแบบที่ไม่สามารถอ่านได้ เพื่อป้องกันการใช้งานที่ผิดปกติ</li>
                <li>ประเภทอุปกรณ์ที่ใช้งาน (เพื่อปรับการแสดงผล)</li>
              </ul>
            </section>

            <section>
              <h2 className="font-extrabold text-black">2. วัตถุประสงค์การใช้ข้อมูล</h2>
              <p className="mt-2">ข้อมูลที่เก็บรวบรวมใช้เพื่อ:</p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>ยืนยันตัวตนและจัดการบัญชีผู้ใช้</li>
                <li>ยืนยันการชำระเงินและจัดส่ง template</li>
                <li>ตรวจสอบสิทธิ์ดาวน์โหลดตามประวัติการซื้อ</li>
                <li>ป้องกันการใช้งานที่ผิดปกติและการละเมิดสิทธิ์</li>
                <li>ปรับปรุงบริการและประสบการณ์การใช้งาน</li>
              </ul>
            </section>

            <section>
              <h2 className="font-extrabold text-black">3. การเปิดเผยข้อมูลแก่บุคคลภายนอก</h2>
              <p className="mt-2">
                เราไม่ขายข้อมูลส่วนบุคคลแก่บุคคลภายนอก
                เราไม่แชร์ข้อมูลส่วนตัวกับบุคคลอื่น ยกเว้นในกรณีที่จำเป็นตามกฎหมายหรือคำสั่งศาล
              </p>
            </section>

            <section>
              <h2 className="font-extrabold text-black">4. การเก็บรักษาข้อมูล</h2>
              <p className="mt-2">
                ข้อมูลการสั่งซื้อและสลิปการชำระเงินจะเก็บไว้ 12 เดือนเพื่อใช้ในการตรวจสอบและแก้ปัญหา
                หลังจากนั้นจะถูกลบโดยอัตโนมัติ
                ที่อยู่ IP จะถูกแปลงให้อ่านไม่ได้ก่อนจัดเก็บ
              </p>
            </section>

            <section>
              <h2 className="font-extrabold text-black">5. การรักษาความปลอดภัย</h2>
              <p className="mt-2">
                เว็บไซต์ใช้การเชื่อมต่อแบบเข้ารหัส HTTPS ตลอดเวลา
                ข้อมูลที่อ่อนไหวจะถูกเข้ารหัสก่อนจัดเก็บ
                การเข้าถึงฐานข้อมูลจำกัดเฉพาะระบบที่จำเป็น
              </p>
            </section>

            <section>
              <h2 className="font-extrabold text-black">6. สิทธิ์ของท่าน</h2>
              <p className="mt-2">
                ท่านมีสิทธิ์ขอดู แก้ไข หรือลบข้อมูลที่เกี่ยวข้องกับท่านได้
                โดยติดต่อเราทาง <a href="mailto:contact@planprom.com" className="font-bold text-indigo-600 underline">contact@planprom.com</a>
              </p>
            </section>

            <section>
              <h2 className="font-extrabold text-black">7. กฎหมายคุ้มครองข้อมูลส่วนบุคคล</h2>
              <p className="mt-2">
                แพลนพร้อมดำเนินการตามกฎหมายคุ้มครองข้อมูลส่วนบุคคล (PDPA) ของประเทศไทย
              </p>
            </section>
          </div>
        </article>

        <p className="mt-6 text-center text-xs text-neutral-400">
          <Link href="/terms" className="underline hover:text-indigo-600">ข้อกำหนดการใช้งาน</Link>
          {' · '}
          <Link href="/legal" className="underline hover:text-indigo-600">ข้อจำกัดความรับผิดชอบ</Link>
        </p>
      </div>
    </main>
  )
}
