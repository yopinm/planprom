'use client'

import { deleteCategoryAction } from './actions'

export function DeleteCategoryButton({ id, name }: { id: string; name: string }) {
  return (
    <form
      action={deleteCategoryAction}
      onSubmit={e => {
        if (!confirm(`ลบ catalog "${name}"?`)) e.preventDefault()
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        className="rounded-xl px-3 py-2 text-xs font-black text-neutral-300 hover:bg-red-50 hover:text-red-600 transition"
      >
        ลบ
      </button>
    </form>
  )
}
