// app/auth/login/page.tsx
// TASK 2.2: Login page — Google + Line OAuth via Supabase

import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'

import { LoginButtons } from '@/components/auth/LoginButtons'

export const metadata: Metadata = {
  title: 'เข้าสู่ระบบ — แพลนพร้อม',
  description: 'เข้าสู่ระบบเพื่อบันทึกคูปองและตั้งการแจ้งเตือนราคา',
}

interface Props {
  searchParams: Promise<{ error?: string; next?: string }>
}

export default async function LoginPage({ searchParams }: Props) {
  const params = await searchParams
  const next = params.next ?? '/'
  const hasError = params.error === 'auth_failed'

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-4xl shadow-sm border border-orange-100 p-8 sm:p-12">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-2">
            <Image
              src="/logo.png"
              alt="แพลนพร้อม"
              width={40}
              height={40}
              className="h-10 w-10 rounded-xl object-contain"
              priority
            />
            <span className="text-2xl font-black tracking-tight text-black">
              แพลนพร้อม
            </span>
          </Link>
          <p className="text-sm font-bold text-orange-600">เช็คทุกขั้น แพลนทุกวัน ง่ายทุกงานวางแผน</p>
        </div>

        <div className="text-center mb-8">
          <h2 className="text-xl font-black text-black mb-2">
            ยินดีต้อนรับกลับมา
          </h2>
          <p className="text-sm text-neutral-500">
            บันทึกคูปอง • ตั้งแจ้งเตือนราคา • ดูดีลส่วนตัว
          </p>
        </div>

        {hasError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl text-sm font-bold text-red-600 flex items-center gap-2">
            <span>⚠️</span>
            <span>เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่อีกครั้ง</span>
          </div>
        )}

        <LoginButtons next={next} />

        <div className="mt-8 pt-6 border-t border-orange-50">
          <p className="text-[11px] text-neutral-400 text-center leading-relaxed font-medium">
            การเข้าสู่ระบบถือว่าคุณยอมรับ{' '}
            <Link href="/terms" className="text-orange-600 underline underline-offset-2 hover:text-orange-700">
              ข้อกำหนดการใช้งาน
            </Link>{' '}
            และ{' '}
            <Link href="/privacy" className="text-orange-600 underline underline-offset-2 hover:text-orange-700">
              นโยบายความเป็นส่วนตัว
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}
