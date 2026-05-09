// app/privacy/page.tsx — Privacy Policy
// TASK 1.17: Legal & Compliance Pages

import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'นโยบายความเป็นส่วนตัว — คูปองคุ้ม',
  description: 'นโยบายความเป็นส่วนตัวและการคุ้มครองข้อมูลส่วนบุคคลของคูปองคุ้ม',
}

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-orange-50">
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-5">
        <Link href="/" className="inline-flex rounded-full bg-black px-3 py-1 text-xs font-bold text-white">
          ← คูปองคุ้ม
        </Link>

        <article className="mt-6 rounded-4xl border border-orange-200 bg-white p-6 shadow-sm sm:p-8">
          <h1 className="text-2xl font-black text-black">นโยบายความเป็นส่วนตัว</h1>
          <p className="mt-1 text-xs text-neutral-400">อัปเดตล่าสุด: พฤษภาคม 2026</p>

          <div className="mt-6 space-y-6 text-sm leading-7 text-neutral-700">
            <section>
              <h2 className="font-extrabold text-black">1. ข้อมูลที่เราเก็บรวบรวม</h2>
              <p className="mt-2">
                คูปองคุ้มเก็บข้อมูลการใช้งานในรูปแบบที่ไม่สามารถระบุตัวตนได้
                ประกอบด้วย:
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>คำค้นหาที่ท่านพิมพ์ (เพื่อปรับปรุงผลลัพธ์)</li>
                <li>การคลิกลิงก์สินค้า (เพื่อวิเคราะห์ดีลที่ได้รับความนิยม)</li>
                <li>ที่อยู่ IP ในรูปแบบที่ไม่สามารถอ่านได้ เพื่อป้องกันการปั่นคลิก</li>
                <li>ประเภทอุปกรณ์ที่ใช้งาน (เพื่อปรับการแสดงผลสำหรับมือถือและคอมพิวเตอร์)</li>
              </ul>
            </section>

            <section>
              <h2 className="font-extrabold text-black">2. วัตถุประสงค์การใช้ข้อมูล</h2>
              <p className="mt-2">ข้อมูลที่เก็บรวบรวมใช้เพื่อ:</p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>ปรับปรุงผลการค้นหาและคำแนะนำคูปอง</li>
                <li>วิเคราะห์ดีลที่ได้รับความนิยม</li>
                <li>ป้องกันการใช้งานที่ผิดปกติ</li>
                <li>รายงานผลลัพธ์แก่พาร์ทเนอร์</li>
              </ul>
            </section>

            <section>
              <h2 className="font-extrabold text-black">3. การเปิดเผยข้อมูลแก่บุคคลภายนอก</h2>
              <p className="mt-2">
                เราไม่ขายข้อมูลส่วนบุคคลแก่บุคคลภายนอก
                เราอาจแบ่งปันข้อมูลสถิติที่ไม่สามารถระบุตัวตนได้กับพาร์ทเนอร์
                เพื่อวัตถุประสงค์การรายงานผลลัพธ์เท่านั้น
              </p>
            </section>

            <section>
              <h2 className="font-extrabold text-black">4. การบันทึกการคลิกลิงก์</h2>
              <p className="mt-2">
                เมื่อท่านคลิกลิงก์สินค้าเพื่อไปยังแพลตฟอร์ม เราจะบันทึกว่าการคลิกนั้นมาจากส่วนใดของเว็บไซต์
                เพื่อระบุที่มาของการซื้อสำหรับระบบ Affiliate ไม่มีการติดตามพฤติกรรมการท่องเว็บของท่านในเว็บไซต์อื่น
              </p>
            </section>

            <section>
              <h2 className="font-extrabold text-black">5. การรักษาความปลอดภัย</h2>
              <p className="mt-2">
                เว็บไซต์ใช้การเชื่อมต่อแบบเข้ารหัสตลอดเวลา
                ข้อมูลที่อยู่ IP จะถูกแปลงให้อ่านไม่ได้ก่อนจัดเก็บ
                และข้อมูลการใช้งานจะถูกลบออกโดยอัตโนมัติภายใน 6 เดือน
              </p>
            </section>

            <section>
              <h2 className="font-extrabold text-black">6. สิทธิ์ของท่าน</h2>
              <p className="mt-2">
                ท่านมีสิทธิ์ขอดู แก้ไข หรือลบข้อมูลที่เกี่ยวข้องกับท่านได้
                โดยติดต่อเราทาง partner@couponkum.com
              </p>
            </section>

            <section>
              <h2 className="font-extrabold text-black">7. กฎหมายคุ้มครองข้อมูลส่วนบุคคล</h2>
              <p className="mt-2">
                คูปองคุ้มดำเนินการตามกฎหมายคุ้มครองข้อมูลส่วนบุคคล (PDPA) ของประเทศไทย
              </p>
            </section>
          </div>
        </article>

        <p className="mt-6 text-center text-xs text-neutral-400">
          <Link href="/terms" className="underline">ข้อกำหนดการใช้งาน</Link>
          {' '}·{' '}
          <Link href="/disclosure" className="underline">Affiliate Disclosure</Link>
        </p>
      </div>
    </main>
  )
}
