'use client'

// src/components/auth/LogoutButton.tsx
// Client Component — triggers Supabase signOut + redirects to homepage

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export function LogoutButton() {
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <button
      onClick={handleLogout}
      className="text-xs text-gray-400 hover:text-gray-700 transition-colors"
    >
      ออกจากระบบ
    </button>
  )
}
