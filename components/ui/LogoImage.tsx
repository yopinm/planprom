'use client'

import { useState } from 'react'

interface LogoImageProps {
  src: string
  alt: string
  className?: string
}

export function LogoImage({ src, alt, className }: LogoImageProps) {
  const [failed, setFailed] = useState(false)

  if (failed) {
    return (
      <span className="text-[10px] font-black text-neutral-500">
        {alt.slice(0, 3).toUpperCase()}
      </span>
    )
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={className}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  )
}
