'use client'

import { useEffect } from 'react'

export default function ErrorPage({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string }
  unstable_retry: () => void
}): React.ReactElement {
  useEffect(() => {
    // TODO: send to error reporting service (Sentry)
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h2 className="text-xl font-semibold">เกิดข้อผิดพลาด</h2>
      <p className="text-sm text-gray-500">{error.message ?? 'Something went wrong'}</p>
      <button
        onClick={() => unstable_retry()}
        className="rounded bg-black px-4 py-2 text-sm text-white hover:bg-gray-800"
      >
        ลองอีกครั้ง
      </button>
    </div>
  )
}
