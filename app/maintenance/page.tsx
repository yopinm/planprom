import Link from 'next/link'
import type { Metadata } from 'next'
import type { ReactElement } from 'react'

export const metadata: Metadata = {
  title: 'ระบบกำลังปรับปรุง — แพลนพร้อม',
  robots: { index: false, follow: false },
}

interface PageProps {
  searchParams: Promise<{
    from?: string
  }>
}

function getSourceLabel(source: string | undefined): string {
  if (source === 'search') return 'หน้าค้นหา'
  if (source === 'go') return 'หน้าก่อนออกไปยังร้านค้า'
  if (source === 'api-r') return 'ระบบพาไปยังร้านค้า'
  return 'บางส่วนของระบบ'
}

export default async function MaintenancePage({ searchParams }: PageProps): Promise<ReactElement> {
  const sp = await searchParams
  const sourceLabel = getSourceLabel(sp.from)

  return (
    <main className="min-h-screen bg-orange-50 px-4 py-10">
      <section className="mx-auto flex min-h-[70vh] max-w-2xl flex-col justify-center">
        <Link
          href="/"
          className="inline-flex w-fit rounded-full bg-orange-600 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white"
        >
          แพลนพร้อม
        </Link>

        <div className="mt-6 rounded-4xl border border-orange-200 bg-white p-7 shadow-sm sm:p-10">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-orange-500">
            Maintenance Mode
          </p>
          <h1 className="mt-3 text-3xl font-black leading-tight text-neutral-950 sm:text-4xl">
            กำลังปรับปรุงระบบชั่วคราว
          </h1>
          <p className="mt-4 text-base leading-8 text-neutral-600">
            {sourceLabel} ถูกพักไว้ชั่วคราวเพื่ออัปเดตหรือแก้ไขระบบให้ปลอดภัยขึ้น
            แอดมินยังเข้าใช้งานหลังบ้านได้ตามปกติ
          </p>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/"
              className="rounded-2xl bg-black px-5 py-3 text-center text-sm font-black text-white transition hover:bg-orange-600"
            >
              กลับหน้าหลัก
            </Link>
            <Link
              href="/blog"
              className="rounded-2xl border border-orange-200 bg-orange-50 px-5 py-3 text-center text-sm font-black text-neutral-700 transition hover:bg-white"
            >
              อ่านบทความระหว่างรอ
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
