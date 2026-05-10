'use client'

export function ExportClient({ csv, filename, count }: { csv: string; filename: string; count: number }) {
  function download() {
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="mt-5 flex items-center gap-3">
      <button
        onClick={download}
        disabled={count === 0}
        className="flex items-center gap-2 rounded-2xl bg-indigo-600 px-5 py-2.5 text-sm font-black text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-40"
      >
        ⬇ Download CSV ({count} rows)
      </button>
      <p className="text-xs text-neutral-400">UTF-8 BOM · Excel รองรับภาษาไทย</p>
    </div>
  )
}
