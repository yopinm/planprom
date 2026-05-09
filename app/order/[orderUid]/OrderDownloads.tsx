'use client'

interface Item {
  title: string
  downloadUrl: string | null
  expiresAt: string | null
  count: number
}

interface Props { items: Item[] }

export default function OrderDownloads({ items }: Props) {
  function downloadAll() {
    items.forEach((item, i) => {
      if (!item.downloadUrl) return
      setTimeout(() => {
        const a = document.createElement('a')
        a.href = item.downloadUrl!
        a.download = item.title
        a.click()
      }, i * 800)
    })
  }

  const available = items.filter(i => i.downloadUrl && i.count < 3 &&
    (!i.expiresAt || new Date(i.expiresAt) > new Date()))

  return (
    <div className="bg-white rounded-2xl shadow p-6 space-y-4">
      <h2 className="font-bold text-gray-900">ดาวน์โหลดไฟล์</h2>
      <ul className="space-y-2">
        {items.map((item, i) => {
          const expired   = item.expiresAt ? new Date(item.expiresAt) < new Date() : false
          const limitHit  = item.count >= 3
          const disabled  = !item.downloadUrl || expired || limitHit

          return (
            <li key={i}>
              {disabled
                ? (
                  <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-400">
                    <span>📄</span>
                    <span className="flex-1 truncate">{item.title}</span>
                    <span className="shrink-0 text-xs">{expired ? 'หมดอายุ' : limitHit ? 'ครบ 3 ครั้ง' : 'ไม่พร้อม'}</span>
                  </div>
                )
                : (
                  <a
                    href={item.downloadUrl!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm text-indigo-700 hover:bg-indigo-100"
                  >
                    <span>📄</span>
                    <span className="flex-1 truncate">{item.title}</span>
                    <span className="shrink-0 text-xs">
                      ดาวน์โหลด ({3 - item.count} ครั้งเหลือ) ↓
                    </span>
                  </a>
                )
              }
            </li>
          )
        })}
      </ul>

      {available.length > 1 && (
        <button
          onClick={downloadAll}
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition"
        >
          ดาวน์โหลดทุกไฟล์ ({available.length} ชิ้น)
        </button>
      )}

      <p className="text-xs text-gray-400 text-center">ลิงก์ใช้ได้ 24 ชม. · สูงสุด 3 ครั้งต่อไฟล์</p>
    </div>
  )
}
