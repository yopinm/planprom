'use client'
import { deletePostAction } from './actions'

export function DeletePostButton({ id, title }: { id: string; title: string }) {
  return (
    <form
      action={deletePostAction}
      onSubmit={e => {
        if (!confirm(`ลบ "${title}"?`)) e.preventDefault()
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        className="rounded-lg bg-red-50 px-2.5 py-1.5 text-xs font-bold text-red-600 hover:bg-red-100 transition"
      >
        ลบ
      </button>
    </form>
  )
}
