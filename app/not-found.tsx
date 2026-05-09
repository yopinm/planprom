import Link from 'next/link'

export default function NotFound(): React.ReactElement {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h2 className="text-xl font-semibold">404 — ไม่พบหน้านี้</h2>
      <p className="text-sm text-gray-500">หน้าที่คุณกำลังมองหาไม่มีอยู่</p>
      <Link
        href="/"
        className="rounded bg-black px-4 py-2 text-sm text-white hover:bg-gray-800"
      >
        กลับหน้าหลัก
      </Link>
    </div>
  )
}
