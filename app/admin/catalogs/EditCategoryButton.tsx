'use client'

import { useState } from 'react'
import { updateCategoryAction } from './actions'

export function EditCategoryButton({
  id, name, emoji,
}: { id: string; name: string; emoji: string }) {
  const [editing, setEditing] = useState(false)

  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="rounded-xl px-3 py-2 text-xs font-black text-neutral-300 hover:bg-amber-50 hover:text-amber-600 transition"
      >
        แก้ไข
      </button>
    )
  }

  return (
    <form
      action={updateCategoryAction}
      className="flex items-center gap-2"
    >
      <input type="hidden" name="id" value={id} />
      <input
        name="emoji"
        defaultValue={emoji}
        maxLength={4}
        className="w-12 rounded-lg border border-amber-300 px-2 py-1 text-center text-base focus:outline-none focus:border-amber-500"
      />
      <input
        name="name"
        defaultValue={name}
        required
        autoFocus
        className="w-40 rounded-lg border border-amber-300 px-2 py-1 text-sm font-bold focus:outline-none focus:border-amber-500"
      />
      <button
        type="submit"
        className="rounded-lg bg-amber-500 px-3 py-1 text-xs font-black text-white hover:bg-amber-600 transition"
      >
        บันทึก
      </button>
      <button
        type="button"
        onClick={() => setEditing(false)}
        className="rounded-lg px-3 py-1 text-xs font-black text-neutral-400 hover:text-neutral-700 transition"
      >
        ยกเลิก
      </button>
    </form>
  )
}
