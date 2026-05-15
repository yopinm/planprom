'use client'
import { useFormStatus } from 'react-dom'

interface Props {
  className: string
  title?: string
  pendingText?: string
  children: React.ReactNode
}

export function SubmitButton({ className, title, pendingText = '…', children }: Props) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      title={title}
      className={`${className} disabled:opacity-40 disabled:cursor-wait`}
    >
      {pending ? pendingText : children}
    </button>
  )
}
