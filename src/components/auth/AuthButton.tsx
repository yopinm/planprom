// src/components/auth/AuthButton.tsx
// TASK 2.2: Server Component — shows login link or user avatar + logout
// TASK 4.3 — Image Optimization (SafeImage migration)
// Reads session from cookies via createServerClient

import Link from 'next/link'
import { createServerClient } from '@/lib/supabase/server'
import { LogoutButton } from './LogoutButton'
import { SafeImage } from '@/components/product/SafeImage'

export async function AuthButton() {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return (
      <Link
        href="/auth/login"
        className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
      >
        เข้าสู่ระบบ
      </Link>
    )
  }

  const name = user.user_metadata?.full_name ?? user.email ?? 'ผู้ใช้'
  const avatar = user.user_metadata?.avatar_url as string | undefined

  return (
    <div className="flex items-center gap-2">
      {avatar ? (
        <SafeImage
          src={avatar}
          alt={name}
          width={28}
          height={28}
          className="rounded-full"
          referrerPolicy="no-referrer"
        />
      ) : (
        <span className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 text-xs flex items-center justify-center font-semibold select-none">
          {name[0]?.toUpperCase() ?? 'U'}
        </span>
      )}
      <span className="text-sm text-gray-700 hidden sm:block max-w-[120px] truncate">
        {name}
      </span>
      <LogoutButton />
    </div>
  )
}
